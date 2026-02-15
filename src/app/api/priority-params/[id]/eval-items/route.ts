import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const assignSchema = z.object({
  paramEvalItemId: z.string().min(1, "Eval item ID is required"),
});

type RouteContext = { params: Promise<{ id: string }> };

// GET - list eval items assigned to this priority param
export async function GET(_request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;

  const param = await prisma.priorityParam.findUnique({
    where: { id },
    include: {
      evalItems: {
        include: { paramEvalItem: true },
      },
    },
  });

  if (!param) {
    return NextResponse.json({ error: "Parameter not found" }, { status: 404 });
  }
  if (param.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    evalItems: param.evalItems.map((e) => e.paramEvalItem),
  });
}

// POST - assign an eval item to this priority param
export async function POST(request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const { id } = await context.params;

  const param = await prisma.priorityParam.findUnique({ where: { id } });
  if (!param || param.userId !== userId) {
    return NextResponse.json({ error: "Parameter not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = assignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const evalItem = await prisma.paramEvalItem.findUnique({
    where: { id: parsed.data.paramEvalItemId },
  });
  if (!evalItem || evalItem.userId !== userId) {
    return NextResponse.json({ error: "Eval item not found" }, { status: 404 });
  }

  try {
    await prisma.priorityParamEvalItem.create({
      data: {
        priorityParamId: id,
        paramEvalItemId: parsed.data.paramEvalItemId,
      },
    });
  } catch {
    return NextResponse.json({ error: "Already assigned" }, { status: 409 });
  }

  return NextResponse.json({ message: "Eval item assigned" }, { status: 201 });
}

// DELETE - unassign an eval item from this priority param
export async function DELETE(request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const { id } = await context.params;

  const param = await prisma.priorityParam.findUnique({ where: { id } });
  if (!param || param.userId !== userId) {
    return NextResponse.json({ error: "Parameter not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const paramEvalItemId = searchParams.get("paramEvalItemId");
  if (!paramEvalItemId) {
    return NextResponse.json({ error: "paramEvalItemId is required" }, { status: 400 });
  }

  try {
    await prisma.priorityParamEvalItem.delete({
      where: {
        priorityParamId_paramEvalItemId: {
          priorityParamId: id,
          paramEvalItemId,
        },
      },
    });
  } catch {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }

  return NextResponse.json({ message: "Eval item unassigned" });
}
