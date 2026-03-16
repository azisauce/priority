import db from "@/lib/db";

export async function getEvalItemsForUserAndGeneric(userId: string) {
  return db("eval_options")
    .where(function () {
      this.where({ user_id: userId }).orWhereNull("user_id");
    })
    .select("*")
    .orderBy("value", "asc");
}

export async function getParamCountForEvalItem(evalItemId: string) {
  return db("param_eval_options")
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
  const [evalItem] = await db("eval_options").insert(data).returning("*");
  return evalItem;
}

export async function findEvalItemById(id: string) {
  return db("eval_options").where({ id }).first();
}

export async function updateEvalItemById(id: string, updateData: Record<string, unknown>) {
  const [updated] = await db("eval_options").where({ id }).update(updateData).returning("*");
  return updated;
}

export async function deleteEvalItemById(id: string) {
  return db("eval_options").where({ id }).del();
}
