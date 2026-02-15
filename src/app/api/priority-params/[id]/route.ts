import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateParamSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  weight: z.number().positive().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;

  const param = await prisma.priorityParam.findUnique({
    where: { id },
    include: {
      evalItems: { include: { paramEvalItem: true } },
      groups: { include: { group: true } },
    },
  });

  if (!param) {
    return NextResponse.json({ error: "Parameter not found" }, { status: 404 });
  }
  if (param.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ param });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const { id } = await context.params;

  const param = await prisma.priorityParam.findUnique({ where: { id } });
  if (!param) {
    return NextResponse.json({ error: "Parameter not found" }, { status: 404 });
  }
  if (param.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = updateParamSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { name, weight } = parsed.data;

  if (name && name !== param.name) {
    const existing = await prisma.priorityParam.findUnique({
      where: { name_userId: { name, userId } },
    });
    if (existing) {
      return NextResponse.json({ error: "Parameter name already exists" }, { status: 409 });
    }
  }

  const updated = await prisma.priorityParam.update({
    where: { id },
    data: { ...(name !== undefined && { name }), ...(weight !== undefined && { weight }) },
    include: {
      evalItems: { include: { paramEvalItem: true } },
      _count: { select: { groups: true } },
    },
  });

  return NextResponse.json({ param: updated });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;

  const param = await prisma.priorityParam.findUnique({ where: { id } });
  if (!param) {
    return NextResponse.json({ error: "Parameter not found" }, { status: 404 });
  }
  if (param.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.priorityParam.delete({ where: { id } });

  return NextResponse.json({ message: "Parameter deleted" });
}
