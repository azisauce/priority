import db from "@/lib/db";

export async function findCounterpartyByUserAndName(userId: string, name: string) {
  return db("counterparties").where({ user_id: userId, name }).first();
}

export async function createCounterparty(data: {
  name: string;
  user_id: string;
  type?: "person" | "bank" | "company";
}) {
  const [counterparty] = await db("counterparties").insert(data).returning("*");
  return counterparty;
}

export async function findCounterpartyById(id: string) {
  return db("counterparties").where({ id }).first();
}

export async function updateCounterpartyById(
  id: string,
  updateData: { name?: string; type?: "person" | "bank" | "company" }
) {
  return db("counterparties").where({ id }).update(updateData);
}

export async function deleteCounterpartyById(id: string) {
  return db("counterparties").where({ id }).del();
}

export async function findCounterpartyByIdAndUser(id: string, userId: string) {
  return db("counterparties").where({ id, user_id: userId }).first();
}

export async function getCounterpartyRecords(id: string, userId: string) {
  return db("debts").where({ counterparty_id: id, user_id: userId }).orderBy("created_at", "desc");
}

export async function getPaymentsByDebtIds(debtIds: string[]) {
  return db("debt_payments").whereIn("debt_id", debtIds).orderBy("payment_date", "desc");
}

export async function getCounterpartyRawBalances(userId: string) {
  return db("debts")
    .where("debts.user_id", userId)
    .select("debts.counterparty_id", "debts.direction")
    .select(db.raw("SUM(debts.total_amount - debts.paid_amount) as total"))
    .groupBy("debts.counterparty_id", "debts.direction");
}

export async function getCounterpartiesByUser(userId: string) {
  return db("counterparties").where("user_id", userId).select("id", "name", "type");
}
