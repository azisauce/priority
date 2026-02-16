import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import db from "@/lib/db";

const updateItemSchema = z.object({
  itemName: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  groupId: z.string().min(1).optional(),
  pricing: z.number().positive().optional(),
  priority: z.number().optional(),
  value: z.number().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const { id } = await context.params;

  const item = await db("items")
    .where({ "items.id": id })
    .leftJoin("groups", "items.group_id", "groups.id")
    .select(
      "items.*",
      "groups.id as group_id",
      "groups.name as group_name",
      "groups.description as group_description",
      "groups.user_id as group_user_id"
    )
    .first();

  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }
  if (item.user_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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
        id: item.group_id,
        groupName: item.group_name,
        description: item.group_description,
        userId: item.group_user_id,
      },
      paramAnswers: [],
    }
  });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const { id } = await context.params;

  const item = await db("items").where({ id }).first();
  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }
  if (item.user_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = updateItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { itemName, description, groupId, pricing, priority, value } = parsed.data;

  // If groupId changes, verify new group belongs to user
  if (groupId && groupId !== item.group_id) {
    const group = await db("groups").where({ id: groupId }).first();
    if (!group || group.user_id !== userId) {
      return NextResponse.json({ error: "Group not found or not owned by user" }, { status: 400 });
    }
  }

  const updateData: Record<string, unknown> = {};
  if (itemName !== undefined) updateData.name = itemName;
  if (description !== undefined) updateData.description = description;
  if (groupId !== undefined) updateData.group_id = groupId;
  if (pricing !== undefined) updateData.price = pricing;
  if (priority !== undefined) updateData.priority = priority;
  if (value !== undefined) updateData.value = value;

  const [updated] = await db("items")
    .where({ id })
    .update(updateData)
    .returning("*");

  const group = await db("groups").where({ id: updated.group_id }).first();

  return NextResponse.json({ 
    item: {
      id: updated.id,
      itemName: updated.name,
      description: updated.description,
      pricing: Number(updated.price),
      priority: Number(updated.priority),
      value: Number(updated.value),
      userId: updated.user_id,
      groupId: updated.group_id,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
      group: {
        id: group?.id,
        groupName: group?.name,
        description: group?.description,
        userId: group?.user_id,
      },
      paramAnswers: [],
    }
  });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const { id } = await context.params;

  const item = await db("items").where({ id }).first();
  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }
  if (item.user_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db("items").where({ id }).del();

  return NextResponse.json({ message: "Item deleted" });
}
