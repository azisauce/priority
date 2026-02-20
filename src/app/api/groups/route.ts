import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import db from "@/lib/db";

const createGroupSchema = z.object({
  groupName: z.string().min(1, "Group name is required").max(100),
  description: z.string().nullable().optional(),
  priorityItemIds: z.array(z.string()).nullable().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const groups = await db("groups")
    .where({ user_id: userId })
    .select("*")
    .orderBy("created_at", "desc");

  // Get item counts for each group
  const groupsWithCounts = await Promise.all(
    groups.map(async (group) => {
      const itemCount = await db("items")
        .where({ group_id: group.id })
        .count("* as count")
        .first();
      
      return {
        id: group.id,
        groupName: group.name,
        description: group.description,
        userId: group.user_id,
        createdAt: group.created_at,
        updatedAt: group.updated_at,
        _count: { items: parseInt(itemCount?.count as string || "0") },
      };
    })
  );

  return NextResponse.json({ groups: groupsWithCounts });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const body = await request.json();
  const parsed = createGroupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { groupName, description, priorityItemIds } = parsed.data;

  const existing = await db("groups")
    .where({ name: groupName, user_id: userId })
    .first();
    
  if (existing) {
    return NextResponse.json({ error: "Group name already exists" }, { status: 409 });
  }

  const [group] = await db("groups")
    .insert({
      name: groupName,
      description: description || null,
      user_id: userId,
    })
    .returning("*");

  // Create junction table entries if priority items are provided
  if (priorityItemIds && priorityItemIds.length > 0) {
    await db("group_priority_items").insert(
      priorityItemIds.map((id, index) => ({
        group_id: group.id,
        priority_item_id: id,
        order: index + 1,
      }))
    );
  }

  // Fetch priority items for response
  const priorityItems = priorityItemIds && priorityItemIds.length > 0
    ? await db("group_priority_items")
        .where({ group_id: group.id })
        .join("priority_items", "group_priority_items.priority_item_id", "priority_items.id")
        .select("priority_items.*", "group_priority_items.order")
        .orderBy("group_priority_items.order")
    : [];

  return NextResponse.json({ 
    group: {
      id: group.id,
      groupName: group.name,
      description: group.description,
      userId: group.user_id,
      createdAt: group.created_at,
      updatedAt: group.updated_at,
      _count: { items: 0 },
      priorityParams: priorityItems.map(item => ({
        id: item.id,
        name: item.name,
        weight: item.weight,
        order: item.order,
      })),
    }
  }, { status: 201 });
}
