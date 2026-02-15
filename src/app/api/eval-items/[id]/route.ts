import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateEvalItemSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  value: z.number().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;

  const evalItem = await prisma.paramEvalItem.findUnique({ where: { id } });
  if (!evalItem) {
    return NextResponse.json({ error: "Eval item not found" }, { status: 404 });
  }
  if (evalItem.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = updateEvalItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const updated = await prisma.paramEvalItem.update({
    where: { id },
    data: parsed.data,
    include: { _count: { select: { params: true } } },
  });

  return NextResponse.json({ evalItem: updated });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;

  const evalItem = await prisma.paramEvalItem.findUnique({ where: { id } });
  if (!evalItem) {
    return NextResponse.json({ error: "Eval item not found" }, { status: 404 });
  }
  if (evalItem.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.paramEvalItem.delete({ where: { id } });

  return NextResponse.json({ message: "Eval item deleted" });
}
