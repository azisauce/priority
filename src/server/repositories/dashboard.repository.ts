import db from "@/lib/db";

export async function getTotalItemsResultByUser(userId: string) {
  return db("items").where("items.user_id", userId).count("* as count").first();
}

export async function getTotalGroupsResultByUser(userId: string) {
  return db("groups").where({ user_id: userId }).count("* as count").first();
}

export async function getAllItemsByUser(userId: string) {
  return db("items")
    .where("items.user_id", userId)
    .select("id", "name", "price", "priority", "group_id");
}

export async function getRecentItemsByUser(userId: string) {
  return db("items")
    .where("items.user_id", userId)
    .orderBy("created_at", "desc")
    .limit(5)
    .select("items.*")
    .leftJoin("groups", "items.group_id", "groups.id")
    .select(
      "items.*",
      "groups.id as group_id",
      "groups.name as group_name",
      "groups.description as group_description"
    );
}

export async function getItemsAggregationByUser(userId: string) {
  return db("items")
    .where({ user_id: userId })
    .sum("price as sum_price")
    .avg("priority as avg_priority")
    .first();
}
