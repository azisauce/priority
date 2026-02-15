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
  urgency: z.number().int().min(1).max(5).optional(),
  impact: z.number().int().min(1).max(5).optional(),
  risk: z.number().int().min(1).max(5).optional(),
  frequency: z.number().int().min(1).max(5).optional(),
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
    include: { group: true },
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

  const data = parsed.data;

  // If groupId changes, verify new group belongs to user
  if (data.groupId && data.groupId !== item.groupId) {
    const group = await prisma.group.findUnique({ where: { id: data.groupId } });
    if (!group || group.userId !== userId) {
      return NextResponse.json({ error: "Group not found or not owned by user" }, { status: 400 });
    }
  }

  // Recalculate priority if any dimension field changes
  const dimensionFields = ["urgency", "impact", "risk", "frequency"] as const;
  const hasDimensionChange = dimensionFields.some((f) => data[f] !== undefined);

  let priority = item.priority;
  if (hasDimensionChange) {
    priority = calculatePriority({
      urgency: data.urgency ?? item.urgency,
      impact: data.impact ?? item.impact,
      risk: data.risk ?? item.risk,
      frequency: data.frequency ?? item.frequency,
    });
  }

  const updated = await prisma.item.update({
    where: { id },
    data: {
      ...data,
      priority,
    },
    include: { group: true },
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
