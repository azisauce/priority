import db from "@/lib/db";

export async function getSimulationItems(
  userId: string,
  groupIds?: string[],
  maxPriceThreshold?: number
) {
  let query = db("items").where("items.user_id", userId);

  query = query.andWhere("items.is_done", false);

  if (groupIds && groupIds.length > 0) {
    query = query.whereIn("group_id", groupIds);
  }

  if (typeof maxPriceThreshold === "number") {
    query = query.andWhere("items.price", "<=", maxPriceThreshold);
  }

  return query.select(
    "id",
    "name",
    "price",
    "priority",
    "installment_enabled",
    "total_price_with_interest",
    "interest_percentage",
    "installment_period_months"
  );
}
