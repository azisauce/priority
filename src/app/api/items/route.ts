import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculatePriority } from "@/lib/priority";
import { z } from "zod";

const createItemSchema = z.object({
  itemName: z.string().min(1, "Item name is required").max(200),
  groupId: z.string().min(1, "Group ID is required"),
  pricing: z.number().positive("Price must be positive"),
  answers: z.array(z.object({
    priorityParamId: z.string().min(1),
    paramEvalItemId: z.string().min(1),
  })).optional(),
  priority: z.number().optional(),
});

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get("groupId");
  const minPriority = searchParams.get("minPriority");
  const maxPriority = searchParams.get("maxPriority");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = searchParams.get("sortOrder") || "desc";

  const where: Record<string, unknown> = { userId };

  if (groupId) where.groupId = groupId;

  if (minPriority || maxPriority) {
    where.priority = {
      ...(minPriority ? { gte: parseFloat(minPriority) } : {}),
      ...(maxPriority ? { lte: parseFloat(maxPriority) } : {}),
    };
  }

  if (minPrice || maxPrice) {
    where.pricing = {
      ...(minPrice ? { gte: parseFloat(minPrice) } : {}),
      ...(maxPrice ? { lte: parseFloat(maxPrice) } : {}),
    };
  }

  const orderByField = sortBy === "priority" ? "priority" : sortBy === "pricing" ? "pricing" : "createdAt";
  const order = sortOrder === "asc" ? "asc" : "desc";

  const items = await prisma.item.findMany({
    where,
    include: {
      group: true,
      paramAnswers: {
        include: {
          priorityParam: true,
          paramEvalItem: true,
        },
      },
    },
    orderBy: { [orderByField]: order },
  });

  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const body = await request.json();
  const parsed = createItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { itemName, groupId, pricing, answers = [], priority } = parsed.data;

  // Verify group belongs to user
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group || group.userId !== userId) {
    return NextResponse.json({ error: "Group not found or not owned by user" }, { status: 400 });
  }

  // Calculate priority from answers if not provided manually
  let calculatedPriority = priority ?? 0;
  if (!priority && answers.length > 0) {
    // Look up eval item values and param weights
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

    calculatedPriority = calculatePriority(priorityAnswers);
  }

  const item = await prisma.item.create({
    data: {
      itemName,
      groupId,
      pricing,
      priority: calculatedPriority,
      userId,
      paramAnswers: {
        create: answers.map((a) => ({
          priorityParamId: a.priorityParamId,
          paramEvalItemId: a.paramEvalItemId,
        })),
      },
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

  return NextResponse.json({ item }, { status: 201 });
}
