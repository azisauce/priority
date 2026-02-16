import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import db from "@/lib/db";

const updateItemSchema = z.object({
  itemName: z.string().min(1).max(200).optional(),
  description: z.string().nullable().optional(),
  groupId: z.string().min(1).optional(),
  pricing: z.number().positive().optional(),
  priority: z.number().optional(),
  value: z.number().optional(),
  answers: z
    .array(
      z.object({
        priorityParamId: z.string().min(1),
        paramEvalItemId: z.string().min(1),
      })
    )
    .optional(),
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

  // If answers were provided, compute weighted priority and average value
  let computedPriority = priority;
  let computedValue = value;
  if (parsed.data.answers && parsed.data.answers.length > 0) {
    const answers = parsed.data.answers;
    const priorityParamIds = answers.map((a) => a.priorityParamId);
    const evalItemIds = answers.map((a) => a.paramEvalItemId);

    const params = await db("priority_items").whereIn("id", priorityParamIds).select("id", "weight");
    const paramsById: Record<string, number> = {};
    for (const p of params) paramsById[p.id] = Number(p.weight || 0);

    const evalItems = await db("judgment_items").whereIn("id", evalItemIds).select("id", "value");
    const evalById: Record<string, number> = {};
    for (const ei of evalItems) evalById[ei.id] = Number(ei.value || 0);

    let totalWeight = 0;
    let weightedSum = 0;
    let simpleSum = 0;
    let count = 0;

    for (const a of answers) {
      const w = paramsById[a.priorityParamId] ?? 0;
      const v = evalById[a.paramEvalItemId] ?? 0;
      if (w > 0) {
        totalWeight += w;
        weightedSum += v * w;
      }
      simpleSum += v;
      count += 1;
    }

    if (totalWeight > 0) {
      computedPriority = Math.round((weightedSum / totalWeight) * 100) / 100;
    } else {
      computedPriority = count > 0 ? Math.round((simpleSum / count) * 100) / 100 : 0;
    }
    computedValue = count > 0 ? Math.round((simpleSum / count) * 100) / 100 : 0;
  }

  const updateData: Record<string, unknown> = {};
  if (itemName !== undefined) updateData.name = itemName;
  if (description !== undefined) updateData.description = description;
  if (groupId !== undefined) updateData.group_id = groupId;
  if (pricing !== undefined) updateData.price = pricing;
  if (computedPriority !== undefined) updateData.priority = computedPriority;
  if (computedValue !== undefined) updateData.value = computedValue;

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
