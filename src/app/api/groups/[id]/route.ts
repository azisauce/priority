import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import db from "@/lib/db";

const updateGroupSchema = z.object({
  groupName: z.string().min(1, "Group name is required").max(100).optional(),
  description: z.string().nullable().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const { id } = await context.params;

  const group = await db("groups").where({ id }).first();

  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }
  if (group.user_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Get items for this group
  const items = await db("items").where({ group_id: id }).select("*");

  // Get priority items for this group
  const priorityParams = await db("group_priority_items")
    .where({ group_id: id })
    .join("priority_items", "group_priority_items.priority_item_id", "priority_items.id")
    .select(
      "priority_items.*",
      "group_priority_items.order",
      "group_priority_items.id as junction_id"
    )
    .orderBy("group_priority_items.order");

  // Get judgment items for each priority item
  const priorityParamsWithJudgments = await Promise.all(
    priorityParams.map(async (param) => {
      const judgmentItems = await db("priority_item_judgment_items")
        .where({ priority_item_id: param.id })
        .join("judgment_items", "priority_item_judgment_items.judgment_item_id", "judgment_items.id")
        .select(
          "judgment_items.*",
          "priority_item_judgment_items.order"
        )
        .orderBy("priority_item_judgment_items.order");

      return {
        id: param.junction_id,
        priorityParam: {
          id: param.id,
          name: param.name,
          description: param.description,
          weight: param.weight,
          userId: param.user_id,
          createdAt: param.created_at,
          updatedAt: param.updated_at,
          evalItems: judgmentItems.map(ji => ({
            paramEvalItem: {
              id: ji.id,
              name: ji.name,
              description: ji.description,
              value: ji.value,
              userId: ji.user_id,
              createdAt: ji.created_at,
              updatedAt: ji.updated_at,
            }
          })),
        },
      };
    })
  );

  return NextResponse.json({ 
    group: {
      id: group.id,
      groupName: group.name,
      description: group.description,
      userId: group.user_id,
      createdAt: group.created_at,
      updatedAt: group.updated_at,
      items: items.map(item => ({
        id: item.id,
        itemName: item.name,
        description: item.description,
        pricing: item.price,
        priority: item.priority,
        value: item.value,
        groupId: item.group_id,
        userId: item.user_id,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        paramAnswers: [], // TODO: Implement param answers if needed
      })),
      priorityParams: priorityParamsWithJudgments,
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

  const group = await db("groups").where({ id }).first();
  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }
  if (group.user_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = updateGroupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { groupName, description } = parsed.data;

  if (groupName) {
    const existing = await db("groups")
      .where({ name: groupName, user_id: userId })
      .whereNot({ id })
      .first();
      
    if (existing) {
      return NextResponse.json({ error: "Group name already exists" }, { status: 409 });
    }
  }

  const updateData: Record<string, unknown> = {};
  if (groupName !== undefined) updateData.name = groupName;
  if (description !== undefined) updateData.description = description;

  const [updated] = await db("groups")
    .where({ id })
    .update(updateData)
    .returning("*");

  return NextResponse.json({ 
    group: {
      id: updated.id,
      groupName: updated.name,
      description: updated.description,
      userId: updated.user_id,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
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

  const group = await db("groups").where({ id }).first();

  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }
  if (group.user_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Delete all items belonging to this group, then delete the group
  await db("items").where({ group_id: id }).del();
  await db("groups").where({ id }).del();

  return NextResponse.json({ message: "Group deleted" });
}
