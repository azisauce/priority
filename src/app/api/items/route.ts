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
  urgency: z.number().int().min(1).max(5).optional(),
  impact: z.number().int().min(1).max(5).optional(),
  risk: z.number().int().min(1).max(5).optional(),
  frequency: z.number().int().min(1).max(5).optional(),
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
    include: { group: true },
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

  const { itemName, groupId, pricing, urgency = 3, impact = 3, risk = 3, frequency = 3, priority } = parsed.data;

  // Verify group belongs to user
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group || group.userId !== userId) {
    return NextResponse.json({ error: "Group not found or not owned by user" }, { status: 400 });
  }

  const calculatedPriority = priority ?? calculatePriority({ urgency, impact, risk, frequency });

  const item = await prisma.item.create({
    data: {
      itemName,
      groupId,
      pricing,
      urgency,
      impact,
      risk,
      frequency,
      priority: calculatedPriority,
      userId,
    },
    include: { group: true },
  });

  return NextResponse.json({ item }, { status: 201 });
}
