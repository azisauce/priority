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
  isDone: z.boolean().optional(),
  is_done: z.boolean().optional(),
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
  // Load param answers for this item
  const paramRows = await db("item_priority_judgment_items")
    .where({ item_id: item.id })
    .join("priority_items", "item_priority_judgment_items.priority_item_id", "priority_items.id")
    .join("judgment_items", "item_priority_judgment_items.judgment_item_id", "judgment_items.id")
    .where(function () {
      this.where("priority_items.user_id", userId).orWhereNull("priority_items.user_id");
    })
    .andWhere(function () {
      this.where("judgment_items.user_id", userId).orWhereNull("judgment_items.user_id");
    })
    .select(
      "priority_items.id as priority_id",
      "priority_items.name as priority_name",
      "priority_items.description as priority_description",
      "priority_items.weight as priority_weight",
      "priority_items.user_id as priority_user_id",
      "priority_items.created_at as priority_created_at",
      "priority_items.updated_at as priority_updated_at",
      "judgment_items.id as eval_id",
      "judgment_items.name as eval_name",
      "judgment_items.description as eval_description",
      "judgment_items.value as eval_value",
      "judgment_items.user_id as eval_user_id",
      "judgment_items.created_at as eval_created_at",
      "judgment_items.updated_at as eval_updated_at",
      "item_priority_judgment_items.id as junction_id"
    )
    .orderBy("item_priority_judgment_items.created_at");

  const paramAnswers = paramRows.map((r: any) => ({
    priorityParam: {
      id: r.priority_id,
      name: r.priority_name,
      description: r.priority_description,
      weight: Number(r.priority_weight),
      userId: r.priority_user_id,
      createdAt: r.priority_created_at,
      updatedAt: r.priority_updated_at,
    },
    paramEvalItem: {
      id: r.eval_id,
      name: r.eval_name,
      description: r.eval_description,
      value: Number(r.eval_value),
      userId: r.eval_user_id,
      createdAt: r.eval_created_at,
      updatedAt: r.eval_updated_at,
    }
  }));

  return NextResponse.json({ 
    item: {
      id: item.id,
      itemName: item.name,
      description: item.description,
      pricing: Number(item.price),
      priority: Number(item.priority),
      value: Number(item.value),
      isDone: Boolean(item.is_done),
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
      paramAnswers,
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
  // support both camelCase and snake_case in payload
  const isDonePayload = (parsed.data as any).isDone !== undefined ? (parsed.data as any).isDone : (parsed.data as any).is_done;

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
  let paramAnswers: any[] = [];
  let params: any[] = [];
  let evalItems: any[] = [];
  if (parsed.data.answers && parsed.data.answers.length > 0) {
    const answers = parsed.data.answers;
    const priorityParamIds = answers.map((a) => a.priorityParamId);
    const evalItemIds = answers.map((a) => a.paramEvalItemId);

    // Fetch priority params (include metadata)
    params = await db("priority_items")
      .whereIn("id", priorityParamIds)
      .where(function () {
        this.where({ user_id: userId }).orWhereNull("user_id");
      })
      .select("id", "name", "description", "weight", "user_id", "created_at", "updated_at");

    const paramsById: Record<string, number> = {};
    for (const p of params) paramsById[p.id] = Number(p.weight || 0);

    // Fetch judgment items (include metadata)
    evalItems = await db("judgment_items")
      .whereIn("id", evalItemIds)
      .where(function () {
        this.where({ user_id: userId }).orWhereNull("user_id");
      })
      .select("id", "name", "description", "value", "user_id", "created_at", "updated_at");

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

    // Replace existing answers for this item in transaction
    await db.transaction(async (trx) => {
      await trx("item_priority_judgment_items").where({ item_id: id }).del();
      const rows = answers.map((a) => ({
        item_id: id,
        priority_item_id: a.priorityParamId,
        judgment_item_id: a.paramEvalItemId,
      }));
      if (rows.length > 0) await trx("item_priority_judgment_items").insert(rows);
    });

    // Build paramAnswers for response
    paramAnswers = parsed.data.answers.map((a: any) => {
      const p = params.find((pp) => pp.id === a.priorityParamId) as any;
      const ei = evalItems.find((ee) => ee.id === a.paramEvalItemId) as any;
      return {
        priorityParam: p
          ? {
              id: p.id,
              name: p.name,
              description: p.description,
              weight: Number(p.weight),
              userId: p.user_id,
              createdAt: p.created_at,
              updatedAt: p.updated_at,
            }
          : { id: a.priorityParamId },
        paramEvalItem: ei
          ? {
              id: ei.id,
              name: ei.name,
              description: ei.description,
              value: Number(ei.value),
              userId: ei.user_id,
              createdAt: ei.created_at,
              updatedAt: ei.updated_at,
            }
          : { id: a.paramEvalItemId },
      };
    });
  }

  const updateData: Record<string, unknown> = {};
  if (itemName !== undefined) updateData.name = itemName;
  if (description !== undefined) updateData.description = description;
  if (groupId !== undefined) updateData.group_id = groupId;
  if (pricing !== undefined) updateData.price = pricing;
  if (computedPriority !== undefined) updateData.priority = computedPriority;
  if (computedValue !== undefined) updateData.value = computedValue;
  if (isDonePayload !== undefined) updateData.is_done = Boolean(isDonePayload);

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
      isDone: Boolean(updated.is_done),
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
      paramAnswers: paramAnswers,
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
