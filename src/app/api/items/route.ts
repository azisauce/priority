import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import db from "@/lib/db";

const createItemSchema = z.object({
  itemName: z.string().min(1, "Item name is required").max(200),
  description: z.string().nullable().optional(),
  groupId: z.string().min(1, "Group ID is required"),
  pricing: z.number().positive("Price must be positive"),
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

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get("groupId");
  const showDone = searchParams.get("showDone") || "done"; // 'all' | 'done' | 'undone'
  const minPriority = searchParams.get("minPriority");
  const maxPriority = searchParams.get("maxPriority");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const sortBy = searchParams.get("sortBy") || "created_at";
  const sortOrder = searchParams.get("sortOrder") || "desc";

  let query = db("items").where("items.user_id", userId);
  // showDone controls which items to include
  if (showDone === "done") {
    query = query.andWhere("items.is_done", true);
  } else if (showDone === "undone") {
    query = query.andWhere("items.is_done", false);
  } // 'all' => no filter

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

  const formattedItems = await Promise.all(items.map(async (item) => {
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

    return {
      id: item.id,
      itemName: item.name,
      description: item.description,
      pricing: Number(item.price),
      isDone: Boolean(item.is_done),
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
      paramAnswers,
    };
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
    console.log('dafaq');
    
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { itemName, description, groupId, pricing, priority = 0, value = 0 } = parsed.data;

  // If answers were provided, compute weighted priority and average value
  let computedPriority = priority;
  let computedValue = value;
  let params: any[] = [];
  let evalItems: any[] = [];
  if (parsed.data.answers && parsed.data.answers.length > 0) {
    const answers = parsed.data.answers;

    const priorityParamIds = answers.map((a) => a.priorityParamId);
    const evalItemIds = answers.map((a) => a.paramEvalItemId);

    // Fetch priority params (include metadata for response)
    params = await db("priority_items")
      .whereIn("id", priorityParamIds)
      .where(function () {
        this.where({ user_id: userId }).orWhereNull("user_id");
      })
      .select("id", "name", "description", "weight", "user_id", "created_at", "updated_at");

    const paramsById: Record<string, number> = {};
    for (const p of params) paramsById[p.id] = Number(p.weight || 0);

    // Fetch judgment items (include metadata for response)
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
  }

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
      priority: computedPriority,
      value: computedValue,
      user_id: userId,
    })
    .returning("*");

  // If answers were provided, persist them to the junction table and build response shape
  let paramAnswers: any[] = [];
  if (parsed.data.answers && parsed.data.answers.length > 0) {
    const answersArr = parsed.data.answers;
    await db.transaction(async (trx) => {
      const rows = answersArr.map((a) => ({
        item_id: item.id,
        priority_item_id: a.priorityParamId,
        judgment_item_id: a.paramEvalItemId,
      }));
      await trx("item_priority_judgment_items").insert(rows);
    });

    // Build paramAnswers for response using previously fetched params and evalItems
    paramAnswers = answersArr.map((a) => {
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

  return NextResponse.json({ 
    item: {
      id: item.id,
      itemName: item.name,
      description: item?.description,
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
      paramAnswers: paramAnswers,
    }
  }, { status: 201 });
}
