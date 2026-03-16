import db from "@/lib/db";

export async function getPriorityParamsForUserAndGeneric(userId: string) {
  return db("priority_params")
    .where(function () {
      this.where({ user_id: userId }).orWhereNull("user_id");
    })
    .select("*")
    .orderBy("created_at", "desc");
}

export async function getPriorityParamEvalItemsFilteredByUser(priorityParamId: string, userId: string) {
  return db("param_eval_options")
    .where({ priority_item_id: priorityParamId })
    .join("eval_options", "param_eval_options.judgment_item_id", "eval_options.id")
    .where(function () {
      this.where({ "eval_options.user_id": userId }).orWhereNull("eval_options.user_id");
    })
    .select(
      "eval_options.*",
      "param_eval_options.order",
      "param_eval_options.id as junction_id"
    )
    .orderBy("param_eval_options.order");
}

export async function getGroupCountForPriorityParamAndUser(priorityParamId: string, userId: string) {
  return db("group_params")
    .where({ priority_item_id: priorityParamId })
    .join("groups", "group_params.group_id", "groups.id")
    .where("groups.user_id", userId)
    .count("* as count")
    .first();
}

export async function findPriorityParamByNameAndUser(name: string, userId: string) {
  return db("priority_params").where({ name, user_id: userId }).first();
}

export async function createPriorityParam(data: {
  name: string;
  description: string | null;
  weight: number;
  user_id: string;
}) {
  const [param] = await db("priority_params").insert(data).returning("*");
  return param;
}

export async function findPriorityParamById(id: string) {
  return db("priority_params").where({ id }).first();
}

export async function getPriorityParamEvalItems(priorityParamId: string) {
  return db("param_eval_options")
    .where({ priority_item_id: priorityParamId })
    .join("eval_options", "param_eval_options.judgment_item_id", "eval_options.id")
    .select(
      "eval_options.*",
      "param_eval_options.order",
      "param_eval_options.id as junction_id"
    )
    .orderBy("param_eval_options.order");
}

export async function getPriorityParamAssignedEvalItems(priorityParamId: string) {
  return db("param_eval_options")
    .where({ priority_item_id: priorityParamId })
    .join("eval_options", "param_eval_options.judgment_item_id", "eval_options.id")
    .select("eval_options.*", "param_eval_options.order")
    .orderBy("param_eval_options.order");
}

export async function getGroupsForPriorityParam(priorityParamId: string) {
  return db("group_params")
    .where({ priority_item_id: priorityParamId })
    .join("groups", "group_params.group_id", "groups.id")
    .select("groups.*", "group_params.id as junction_id");
}

export async function findPriorityParamByNameAndUserExcludingId(
  name: string,
  userId: string,
  id: string
) {
  return db("priority_params")
    .where({ name, user_id: userId })
    .whereNot({ id })
    .first();
}

export async function updatePriorityParamById(id: string, updateData: Record<string, unknown>) {
  const [updated] = await db("priority_params").where({ id }).update(updateData).returning("*");
  return updated;
}

export async function getGroupCountForPriorityParam(priorityParamId: string) {
  return db("group_params").where({ priority_item_id: priorityParamId }).count("* as count").first();
}

export async function deletePriorityParamById(id: string) {
  return db("priority_params").where({ id }).del();
}

export async function findEvalItemById(id: string) {
  return db("eval_options").where({ id }).first();
}

export async function findPriorityParamEvalItemAssignment(priorityParamId: string, evalItemId: string) {
  return db("param_eval_options")
    .where({
      priority_item_id: priorityParamId,
      judgment_item_id: evalItemId,
    })
    .first();
}

export async function getMaxPriorityParamEvalItemOrder(priorityParamId: string) {
  return db("param_eval_options").where({ priority_item_id: priorityParamId }).max("order as max").first();
}

export async function createPriorityParamEvalItemAssignment(data: {
  priority_item_id: string;
  judgment_item_id: string;
  order: number;
}) {
  return db("param_eval_options").insert(data);
}

export async function deletePriorityParamEvalItemAssignment(priorityParamId: string, evalItemId: string) {
  return db("param_eval_options")
    .where({
      priority_item_id: priorityParamId,
      judgment_item_id: evalItemId,
    })
    .del();
}
