import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateGroupSchema = z.object({
  groupName: z.string().min(1, "Group name is required").max(100),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const { id } = await context.params;

  const group = await prisma.group.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          paramAnswers: {
            include: {
              priorityParam: true,
              paramEvalItem: true,
            },
          },
        },
      },
      priorityParams: {
        include: {
          priorityParam: {
            include: {
              evalItems: { include: { paramEvalItem: true } },
            },
          },
        },
      },
    },
  });

  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }
  if (group.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ group });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const { id } = await context.params;

  const group = await prisma.group.findUnique({ where: { id } });
  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }
  if (group.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = updateGroupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { groupName } = parsed.data;

  const existing = await prisma.group.findUnique({
    where: { groupName_userId: { groupName, userId } },
  });
  if (existing && existing.id !== id) {
    return NextResponse.json({ error: "Group name already exists" }, { status: 409 });
  }

  const updated = await prisma.group.update({
    where: { id },
    data: { groupName },
  });

  return NextResponse.json({ group: updated });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const { id } = await context.params;

  const group = await prisma.group.findUnique({
    where: { id },
    include: { _count: { select: { items: true } } },
  });

  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }
  if (group.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (group._count.items > 0) {
    return NextResponse.json({ error: "Cannot delete group with items" }, { status: 400 });
  }

  await prisma.group.delete({ where: { id } });

  return NextResponse.json({ message: "Group deleted" });
}
