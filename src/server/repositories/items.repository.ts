import db from "@/lib/db";

type GetItemsFilters = {
  userId: string;
  groupId?: string | null;
  showDone: string;
  minPriority?: string | null;
  maxPriority?: string | null;
  minPrice?: string | null;
  maxPrice?: string | null;
  sortBy: string;
  sortOrder: string;
};

type ItemAnswerInput = {
  priorityParamId: string;
  paramEvalItemId: string;
};

export async function getItemsWithGroupsForUser(filters: GetItemsFilters) {
  const {
    userId,
    groupId,
    showDone,
    minPriority,
    maxPriority,
    minPrice,
    maxPrice,
    sortBy,
    sortOrder,
  } = filters;

  let query = db("items").where("items.user_id", userId);

  if (showDone === "done") {
    query = query.andWhere("items.is_done", true);
  } else if (showDone === "undone") {
    query = query.andWhere("items.is_done", false);
  }

  if (groupId) query = query.where({ group_id: groupId });

  if (minPriority) query = query.where("priority", ">=", parseFloat(minPriority));
  if (maxPriority) query = query.where("priority", "<=", parseFloat(maxPriority));

  if (minPrice) query = query.where("price", ">=", parseFloat(minPrice));
  if (maxPrice) query = query.where("price", "<=", parseFloat(maxPrice));

  const orderByField = sortBy === "priority" ? "priority" : sortBy === "pricing" ? "price" : "created_at";
  const order = sortOrder === "asc" ? "asc" : "desc";

  return query
    .leftJoin("groups", "items.group_id", "groups.id")
    .select(
      "items.*",
      "groups.id as group_id",
      "groups.name as group_name",
      "groups.description as group_description",
      "groups.user_id as group_user_id"
    )
    .orderBy(`items.${orderByField}`, order);
}

export async function getItemParamRows(itemId: string, userId: string) {
  return db("item_priority_judgment_items")
    .where({ item_id: itemId })
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
}

export async function getPriorityParamsByIdsForUser(priorityParamIds: string[], userId: string) {
  return db("priority_items")
    .whereIn("id", priorityParamIds)
    .where(function () {
      this.where({ user_id: userId }).orWhereNull("user_id");
    })
    .select("id", "name", "description", "weight", "user_id", "created_at", "updated_at");
}

export async function getEvalItemsByIdsForUser(evalItemIds: string[], userId: string) {
  return db("judgment_items")
    .whereIn("id", evalItemIds)
    .where(function () {
      this.where({ user_id: userId }).orWhereNull("user_id");
    })
    .select("id", "name", "description", "value", "user_id", "created_at", "updated_at");
}

export async function findGroupById(groupId: string) {
  return db("groups").where({ id: groupId }).first();
}

export async function createItem(data: {
  name: string;
  description: string | null;
  group_id: string;
  price: number;
  enabled_ease_option: boolean;
  price_with_interest: number | null;
  interest_percentage: number;
  ease_period: number;
  priority: number;
  value: number;
  user_id: string;
}) {
  const [item] = await db("items").insert(data).returning("*");
  return item;
}

export async function createItemParamAnswers(itemId: string, answers: ItemAnswerInput[]) {
  await db.transaction(async (trx) => {
    const rows = answers.map((a) => ({
      item_id: itemId,
      priority_item_id: a.priorityParamId,
      judgment_item_id: a.paramEvalItemId,
    }));
    await trx("item_priority_judgment_items").insert(rows);
  });
}

export async function getItemWithGroupById(id: string) {
  return db("items")
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
}

export async function findItemById(id: string) {
  return db("items").where({ id }).first();
}

export async function replaceItemParamAnswers(itemId: string, answers: ItemAnswerInput[]) {
  await db.transaction(async (trx) => {
    await trx("item_priority_judgment_items").where({ item_id: itemId }).del();
    const rows = answers.map((a) => ({
      item_id: itemId,
      priority_item_id: a.priorityParamId,
      judgment_item_id: a.paramEvalItemId,
    }));
    if (rows.length > 0) await trx("item_priority_judgment_items").insert(rows);
  });
}

export async function updateItemById(id: string, updateData: Record<string, unknown>) {
  const [updated] = await db("items").where({ id }).update(updateData).returning("*");
  return updated;
}

export async function deleteItemById(id: string) {
  return db("items").where({ id }).del();
}
