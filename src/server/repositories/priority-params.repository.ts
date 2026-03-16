import db from "@/lib/db";

export async function getPriorityParamsForUserAndGeneric(userId: string) {
  return db("priority_items")
    .where(function () {
      this.where({ user_id: userId }).orWhereNull("user_id");
    })
    .select("*")
    .orderBy("created_at", "desc");
}

export async function getPriorityParamEvalItemsFilteredByUser(priorityParamId: string, userId: string) {
  return db("priority_item_judgment_items")
    .where({ priority_item_id: priorityParamId })
    .join("judgment_items", "priority_item_judgment_items.judgment_item_id", "judgment_items.id")
    .where(function () {
      this.where({ "judgment_items.user_id": userId }).orWhereNull("judgment_items.user_id");
    })
    .select(
      "judgment_items.*",
      "priority_item_judgment_items.order",
      "priority_item_judgment_items.id as junction_id"
    )
    .orderBy("priority_item_judgment_items.order");
}

export async function getGroupCountForPriorityParamAndUser(priorityParamId: string, userId: string) {
  return db("group_priority_items")
    .where({ priority_item_id: priorityParamId })
    .join("groups", "group_priority_items.group_id", "groups.id")
    .where("groups.user_id", userId)
    .count("* as count")
    .first();
}

export async function findPriorityParamByNameAndUser(name: string, userId: string) {
  return db("priority_items").where({ name, user_id: userId }).first();
}

export async function createPriorityParam(data: {
  name: string;
  description: string | null;
  weight: number;
  user_id: string;
}) {
  const [param] = await db("priority_items").insert(data).returning("*");
  return param;
}

export async function findPriorityParamById(id: string) {
  return db("priority_items").where({ id }).first();
}

export async function getPriorityParamEvalItems(priorityParamId: string) {
  return db("priority_item_judgment_items")
    .where({ priority_item_id: priorityParamId })
    .join("judgment_items", "priority_item_judgment_items.judgment_item_id", "judgment_items.id")
    .select(
      "judgment_items.*",
      "priority_item_judgment_items.order",
      "priority_item_judgment_items.id as junction_id"
    )
    .orderBy("priority_item_judgment_items.order");
}

export async function getPriorityParamAssignedEvalItems(priorityParamId: string) {
  return db("priority_item_judgment_items")
    .where({ priority_item_id: priorityParamId })
    .join("judgment_items", "priority_item_judgment_items.judgment_item_id", "judgment_items.id")
    .select("judgment_items.*", "priority_item_judgment_items.order")
    .orderBy("priority_item_judgment_items.order");
}

export async function getGroupsForPriorityParam(priorityParamId: string) {
  return db("group_priority_items")
    .where({ priority_item_id: priorityParamId })
    .join("groups", "group_priority_items.group_id", "groups.id")
    .select("groups.*", "group_priority_items.id as junction_id");
}

export async function findPriorityParamByNameAndUserExcludingId(
  name: string,
  userId: string,
  id: string
) {
  return db("priority_items")
    .where({ name, user_id: userId })
    .whereNot({ id })
    .first();
}

export async function updatePriorityParamById(id: string, updateData: Record<string, unknown>) {
  const [updated] = await db("priority_items").where({ id }).update(updateData).returning("*");
  return updated;
}

export async function getGroupCountForPriorityParam(priorityParamId: string) {
  return db("group_priority_items").where({ priority_item_id: priorityParamId }).count("* as count").first();
}

export async function deletePriorityParamById(id: string) {
  return db("priority_items").where({ id }).del();
}

export async function findEvalItemById(id: string) {
  return db("judgment_items").where({ id }).first();
}

export async function findPriorityParamEvalItemAssignment(priorityParamId: string, evalItemId: string) {
  return db("priority_item_judgment_items")
    .where({
      priority_item_id: priorityParamId,
      judgment_item_id: evalItemId,
    })
    .first();
}

export async function getMaxPriorityParamEvalItemOrder(priorityParamId: string) {
  return db("priority_item_judgment_items").where({ priority_item_id: priorityParamId }).max("order as max").first();
}

export async function createPriorityParamEvalItemAssignment(data: {
  priority_item_id: string;
  judgment_item_id: string;
  order: number;
}) {
  return db("priority_item_judgment_items").insert(data);
}

export async function deletePriorityParamEvalItemAssignment(priorityParamId: string, evalItemId: string) {
  return db("priority_item_judgment_items")
    .where({
      priority_item_id: priorityParamId,
      judgment_item_id: evalItemId,
    })
    .del();
}
