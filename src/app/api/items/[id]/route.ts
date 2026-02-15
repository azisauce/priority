import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculatePriority } from "@/lib/priority";
import { z } from "zod";

const updateItemSchema = z.object({
  itemName: z.string().min(1).max(200).optional(),
  groupId: z.string().min(1).optional(),
  pricing: z.number().positive().optional(),
  answers: z.array(z.object({
    priorityParamId: z.string().min(1),
    paramEvalItemId: z.string().min(1),
  })).optional(),
  priority: z.number().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const { id } = await context.params;

  const item = await prisma.item.findUnique({
    where: { id },
    include: {
      group: true,
      paramAnswers: {
        include: {
          priorityParam: true,
          paramEvalItem: true,
        },
      },
    },
  });

  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }
  if (item.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ item });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const { id } = await context.params;

  const item = await prisma.item.findUnique({ where: { id } });
  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }
  if (item.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = updateItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { answers, priority: manualPriority, ...data } = parsed.data;

  // If groupId changes, verify new group belongs to user
  if (data.groupId && data.groupId !== item.groupId) {
    const group = await prisma.group.findUnique({ where: { id: data.groupId } });
    if (!group || group.userId !== userId) {
      return NextResponse.json({ error: "Group not found or not owned by user" }, { status: 400 });
    }
  }

  // Recalculate priority from answers
  let priority = manualPriority ?? item.priority;
  if (answers && answers.length > 0 && !manualPriority) {
    const paramIds = answers.map((a) => a.priorityParamId);
    const evalItemIds = answers.map((a) => a.paramEvalItemId);

    const [params, evalItems] = await Promise.all([
      prisma.priorityParam.findMany({ where: { id: { in: paramIds } } }),
      prisma.paramEvalItem.findMany({ where: { id: { in: evalItemIds } } }),
    ]);

    const paramMap = new Map(params.map((p) => [p.id, p]));
    const evalItemMap = new Map(evalItems.map((e) => [e.id, e]));

    const priorityAnswers = answers.map((a) => ({
      value: evalItemMap.get(a.paramEvalItemId)?.value ?? 0,
      weight: paramMap.get(a.priorityParamId)?.weight ?? 0,
    }));

    priority = calculatePriority(priorityAnswers);
  }

  // Update answers: delete old, create new
  if (answers) {
    await prisma.itemParamAnswer.deleteMany({ where: { itemId: id } });
  }

  const updated = await prisma.item.update({
    where: { id },
    data: {
      ...data,
      priority,
      ...(answers ? {
        paramAnswers: {
          create: answers.map((a) => ({
            priorityParamId: a.priorityParamId,
            paramEvalItemId: a.paramEvalItemId,
          })),
        },
      } : {}),
    },
    include: {
      group: true,
      paramAnswers: {
        include: {
          priorityParam: true,
          paramEvalItem: true,
        },
      },
    },
  });

  return NextResponse.json({ item: updated });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const { id } = await context.params;

  const item = await prisma.item.findUnique({ where: { id } });
  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }
  if (item.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.item.delete({ where: { id } });

  return NextResponse.json({ message: "Item deleted" });
}
