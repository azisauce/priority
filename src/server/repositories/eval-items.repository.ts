import db from "@/lib/db";

export async function getEvalItemsForUserAndGeneric(userId: string) {
  return db("judgment_items")
    .where(function () {
      this.where({ user_id: userId }).orWhereNull("user_id");
    })
    .select("*")
    .orderBy("value", "asc");
}

export async function getParamCountForEvalItem(evalItemId: string) {
  return db("priority_item_judgment_items")
    .where({ judgment_item_id: evalItemId })
    .count("* as count")
    .first();
}

export async function createEvalItem(data: {
  name: string;
  description: string | null;
  value: number;
  user_id: string;
}) {
  const [evalItem] = await db("judgment_items").insert(data).returning("*");
  return evalItem;
}

export async function findEvalItemById(id: string) {
  return db("judgment_items").where({ id }).first();
}

export async function updateEvalItemById(id: string, updateData: Record<string, unknown>) {
  const [updated] = await db("judgment_items").where({ id }).update(updateData).returning("*");
  return updated;
}

export async function deleteEvalItemById(id: string) {
  return db("judgment_items").where({ id }).del();
}
