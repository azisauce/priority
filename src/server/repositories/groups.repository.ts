import db from "@/lib/db";

export async function getGroupsByUserId(userId: string) {
  return db("groups").where({ user_id: userId }).select("*").orderBy("created_at", "desc");
}

export async function getItemCountForGroup(groupId: string) {
  return db("items").where({ group_id: groupId }).count("* as count").first();
}

export async function findGroupByNameAndUserId(groupName: string, userId: string) {
  return db("groups").where({ name: groupName, user_id: userId }).first();
}

export async function createGroup(data: { name: string; description: string | null; user_id: string }) {
  const [group] = await db("groups").insert(data).returning("*");
  return group;
}

export async function createGroupPriorityAssignments(
  rows: { group_id: string; priority_item_id: string; order: number }[]
) {
  return db("group_params").insert(rows);
}

export async function getGroupPriorityItems(groupId: string) {
  return db("group_params")
    .where({ group_id: groupId })
    .join("priority_params", "group_params.priority_item_id", "priority_params.id")
    .select("priority_params.*", "group_params.order")
    .orderBy("group_params.order");
}

export async function findGroupById(id: string) {
  return db("groups").where({ id }).first();
}

export async function getItemsByGroupId(groupId: string) {
  return db("items").where({ group_id: groupId }).select("*");
}

export async function getGroupPriorityParamsWithJunction(groupId: string) {
  return db("group_params")
    .where({ group_id: groupId })
    .join("priority_params", "group_params.priority_item_id", "priority_params.id")
    .select(
      "priority_params.*",
      "group_params.order",
      "group_params.id as junction_id"
    )
    .orderBy("group_params.order");
}

export async function getJudgmentItemsForPriorityParam(priorityParamId: string) {
  return db("param_eval_options")
    .where({ priority_item_id: priorityParamId })
    .join("eval_options", "param_eval_options.judgment_item_id", "eval_options.id")
    .select("eval_options.*", "param_eval_options.order")
    .orderBy("param_eval_options.order");
}

export async function findGroupByNameAndUserIdExcludingId(groupName: string, userId: string, id: string) {
  return db("groups").where({ name: groupName, user_id: userId }).whereNot({ id }).first();
}

export async function updateGroupById(id: string, updateData: Record<string, unknown>) {
  const [updated] = await db("groups").where({ id }).update(updateData).returning("*");
  return updated;
}

export async function deleteItemsByGroupId(groupId: string) {
  return db("items").where({ group_id: groupId }).del();
}

export async function deleteGroupById(groupId: string) {
  return db("groups").where({ id: groupId }).del();
}

export async function getGroupPriorityParams(groupId: string) {
  return db("group_params")
    .where({ group_id: groupId })
    .join("priority_params", "group_params.priority_item_id", "priority_params.id")
    .select("priority_params.*", "group_params.order")
    .orderBy("group_params.order");
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

export async function findPriorityParamById(priorityParamId: string) {
  return db("priority_params").where({ id: priorityParamId }).first();
}

export async function findGroupPriorityAssignment(groupId: string, priorityParamId: string) {
  return db("group_params")
    .where({
      group_id: groupId,
      priority_item_id: priorityParamId,
    })
    .first();
}

export async function getMaxGroupPriorityOrder(groupId: string) {
  return db("group_params").where({ group_id: groupId }).max("order as max").first();
}

export async function createGroupPriorityAssignment(data: {
  group_id: string;
  priority_item_id: string;
  order: number;
}) {
  return db("group_params").insert(data);
}

export async function deleteGroupPriorityAssignment(groupId: string, priorityParamId: string) {
  return db("group_params")
    .where({
      group_id: groupId,
      priority_item_id: priorityParamId,
    })
    .del();
}
