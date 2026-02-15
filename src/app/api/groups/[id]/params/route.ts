import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const assignParamSchema = z.object({
  priorityParamId: z.string().min(1, "Priority param ID is required"),
});

type RouteContext = { params: Promise<{ id: string }> };

// GET - list priority params assigned to this group
export async function GET(_request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;

  const group = await prisma.group.findUnique({
    where: { id },
    include: {
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
  if (group.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    params: group.priorityParams.map((gp) => gp.priorityParam),
  });
}

// POST - assign a priority param to this group
export async function POST(request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const { id } = await context.params;

  const group = await prisma.group.findUnique({ where: { id } });
  if (!group || group.userId !== userId) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = assignParamSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const param = await prisma.priorityParam.findUnique({
    where: { id: parsed.data.priorityParamId },
  });
  if (!param || param.userId !== userId) {
    return NextResponse.json({ error: "Priority param not found" }, { status: 404 });
  }

  try {
    await prisma.groupPriorityParam.create({
      data: {
        groupId: id,
        priorityParamId: parsed.data.priorityParamId,
      },
    });
  } catch {
    return NextResponse.json({ error: "Already assigned" }, { status: 409 });
  }

  return NextResponse.json({ message: "Param assigned to group" }, { status: 201 });
}

// DELETE - unassign a priority param from this group
export async function DELETE(request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const { id } = await context.params;

  const group = await prisma.group.findUnique({ where: { id } });
  if (!group || group.userId !== userId) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const priorityParamId = searchParams.get("priorityParamId");
  if (!priorityParamId) {
    return NextResponse.json({ error: "priorityParamId is required" }, { status: 400 });
  }

  try {
    await prisma.groupPriorityParam.delete({
      where: {
        groupId_priorityParamId: {
          groupId: id,
          priorityParamId,
        },
      },
    });
  } catch {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }

  return NextResponse.json({ message: "Param unassigned from group" });
}
