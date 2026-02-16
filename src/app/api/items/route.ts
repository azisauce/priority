import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import db from "@/lib/db";

const createItemSchema = z.object({
  itemName: z.string().min(1, "Item name is required").max(200),
  description: z.string().optional(),
  groupId: z.string().min(1, "Group ID is required"),
  pricing: z.number().positive("Price must be positive"),
  priority: z.number().optional(),
  value: z.number().optional(),
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
  const sortBy = searchParams.get("sortBy") || "created_at";
  const sortOrder = searchParams.get("sortOrder") || "desc";

  let query = db("items").where({ user_id: userId });

  if (groupId) query = query.where({ group_id: groupId });

  if (minPriority) query = query.where("priority", ">=", parseFloat(minPriority));
  if (maxPriority) query = query.where("priority", "<=", parseFloat(maxPriority));

  if (minPrice) query = query.where("price", ">=", parseFloat(minPrice));
  if (maxPrice) query = query.where("price", "<=", parseFloat(maxPrice));

  const orderByField = sortBy === "priority" ? "priority" : sortBy === "pricing" ? "price" : "created_at";
  const order = sortOrder === "asc" ? "asc" : "desc";

  const items = await query
    .leftJoin("groups", "items.group_id", "groups.id")
    .select(
      "items.*",
      "groups.id as group_id",
      "groups.name as group_name",
      "groups.description as group_description",
      "groups.user_id as group_user_id"
    )
    .orderBy(`items.${orderByField}`, order);

  const formattedItems = items.map(item => ({
    id: item.id,
    itemName: item.name,
    description: item.description,
    pricing: Number(item.price),
    priority: Number(item.priority),
    value: Number(item.value),
    userId: item.user_id,
    groupId: item.group_id,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    group: {
      id: item.group_id,
      groupName: item.group_name,
      description: item.group_description,
      userId: item.group_user_id,
    },
    paramAnswers: [], // No longer storing detailed answers in new schema
  }));

  return NextResponse.json({ items: formattedItems });
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

  const { itemName, description, groupId, pricing, priority = 0, value = 0 } = parsed.data;

  // Verify group belongs to user
  const group = await db("groups").where({ id: groupId }).first();
  if (!group || group.user_id !== userId) {
    return NextResponse.json({ error: "Group not found or not owned by user" }, { status: 400 });
  }

  const [item] = await db("items")
    .insert({
      name: itemName,
      description: description || null,
      group_id: groupId,
      price: pricing,
      priority,
      value,
      user_id: userId,
    })
    .returning("*");

  return NextResponse.json({ 
    item: {
      id: item.id,
      itemName: item.name,
      description: item.description,
      pricing: Number(item.price),
      priority: Number(item.priority),
      value: Number(item.value),
      userId: item.user_id,
      groupId: item.group_id,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      group: {
        id: group.id,
        groupName: group.name,
        description: group.description,
        userId: group.user_id,
      },
      paramAnswers: [],
    }
  }, { status: 201 });
}
