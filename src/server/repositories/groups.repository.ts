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
  return db("group_priority_items").insert(rows);
}

export async function getGroupPriorityItems(groupId: string) {
  return db("group_priority_items")
    .where({ group_id: groupId })
    .join("priority_items", "group_priority_items.priority_item_id", "priority_items.id")
    .select("priority_items.*", "group_priority_items.order")
    .orderBy("group_priority_items.order");
}

export async function findGroupById(id: string) {
  return db("groups").where({ id }).first();
}

export async function getItemsByGroupId(groupId: string) {
  return db("items").where({ group_id: groupId }).select("*");
}

export async function getGroupPriorityParamsWithJunction(groupId: string) {
  return db("group_priority_items")
    .where({ group_id: groupId })
    .join("priority_items", "group_priority_items.priority_item_id", "priority_items.id")
    .select(
      "priority_items.*",
      "group_priority_items.order",
      "group_priority_items.id as junction_id"
    )
    .orderBy("group_priority_items.order");
}

export async function getJudgmentItemsForPriorityParam(priorityParamId: string) {
  return db("priority_item_judgment_items")
    .where({ priority_item_id: priorityParamId })
    .join("judgment_items", "priority_item_judgment_items.judgment_item_id", "judgment_items.id")
    .select("judgment_items.*", "priority_item_judgment_items.order")
    .orderBy("priority_item_judgment_items.order");
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
  return db("group_priority_items")
    .where({ group_id: groupId })
    .join("priority_items", "group_priority_items.priority_item_id", "priority_items.id")
    .select("priority_items.*", "group_priority_items.order")
    .orderBy("group_priority_items.order");
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

export async function findPriorityParamById(priorityParamId: string) {
  return db("priority_items").where({ id: priorityParamId }).first();
}

export async function findGroupPriorityAssignment(groupId: string, priorityParamId: string) {
  return db("group_priority_items")
    .where({
      group_id: groupId,
      priority_item_id: priorityParamId,
    })
    .first();
}

export async function getMaxGroupPriorityOrder(groupId: string) {
  return db("group_priority_items").where({ group_id: groupId }).max("order as max").first();
}

export async function createGroupPriorityAssignment(data: {
  group_id: string;
  priority_item_id: string;
  order: number;
}) {
  return db("group_priority_items").insert(data);
}

export async function deleteGroupPriorityAssignment(groupId: string, priorityParamId: string) {
  return db("group_priority_items")
    .where({
      group_id: groupId,
      priority_item_id: priorityParamId,
    })
    .del();
}
