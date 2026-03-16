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
  return db("item_evaluations")
    .where({ item_id: itemId })
    .join("priority_params", "item_evaluations.priority_item_id", "priority_params.id")
    .join("eval_options", "item_evaluations.judgment_item_id", "eval_options.id")
    .where(function () {
      this.where("priority_params.user_id", userId).orWhereNull("priority_params.user_id");
    })
    .andWhere(function () {
      this.where("eval_options.user_id", userId).orWhereNull("eval_options.user_id");
    })
    .select(
      "priority_params.id as priority_id",
      "priority_params.name as priority_name",
      "priority_params.description as priority_description",
      "priority_params.weight as priority_weight",
      "priority_params.user_id as priority_user_id",
      "priority_params.created_at as priority_created_at",
      "priority_params.updated_at as priority_updated_at",
      "eval_options.id as eval_id",
      "eval_options.name as eval_name",
      "eval_options.description as eval_description",
      "eval_options.value as eval_value",
      "eval_options.user_id as eval_user_id",
      "eval_options.created_at as eval_created_at",
      "eval_options.updated_at as eval_updated_at",
      "item_evaluations.id as junction_id"
    )
    .orderBy("item_evaluations.created_at");
}

export async function getPriorityParamsByIdsForUser(priorityParamIds: string[], userId: string) {
  return db("priority_params")
    .whereIn("id", priorityParamIds)
    .where(function () {
      this.where({ user_id: userId }).orWhereNull("user_id");
    })
    .select("id", "name", "description", "weight", "user_id", "created_at", "updated_at");
}

export async function getEvalItemsByIdsForUser(evalItemIds: string[], userId: string) {
  return db("eval_options")
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
  installment_enabled: boolean;
  total_price_with_interest: number | null;
  interest_percentage: number;
  installment_period_months: number;
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
    await trx("item_evaluations").insert(rows);
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
    await trx("item_evaluations").where({ item_id: itemId }).del();
    const rows = answers.map((a) => ({
      item_id: itemId,
      priority_item_id: a.priorityParamId,
      judgment_item_id: a.paramEvalItemId,
    }));
    if (rows.length > 0) await trx("item_evaluations").insert(rows);
  });
}

export async function updateItemById(id: string, updateData: Record<string, unknown>) {
  const [updated] = await db("items").where({ id }).update(updateData).returning("*");
  return updated;
}

export async function deleteItemById(id: string) {
  return db("items").where({ id }).del();
}
