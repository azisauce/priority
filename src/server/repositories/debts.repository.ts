import db from "@/lib/db";

export async function getDebtsByUserAndType(
  userId: string,
  typeFilter: string,
  statusFilter?: string | null
) {
  let query = db("debts")
    .join("counterparties", "debts.counterparty_id", "counterparties.id")
    .where("debts.user_id", userId)
    .andWhere("debts.type", typeFilter)
    .select("debts.*", "counterparties.name as counterparty");

  if (statusFilter && ["active", "paid", "overdue"].includes(statusFilter)) {
    query = query.andWhere("debts.status", statusFilter);
  }

  return query.orderBy("debts.created_at", "desc");
}

export async function updateOverdueDebts(userId: string, typeFilter: string, today: string) {
  return db("debts")
    .where("user_id", userId)
    .where("type", typeFilter)
    .whereNotNull("deadline")
    .where("deadline", "<", today)
    .whereNot("status", "paid")
    .update({ status: "overdue" });
}

export async function getScheduledPaymentsForDebts(debtIds: string[], today: string) {
  return db("payment_entries")
    .whereIn("debt_id", debtIds)
    .where("status", "scheduled")
    .where("payment_date", ">=", today)
    .orderBy("payment_date", "asc")
    .select("debt_id", "payment_date");
}

export async function findCounterpartyByUserAndName(userId: string, name: string) {
  return db("counterparties").where({ user_id: userId, name }).first();
}

export async function createCounterparty(data: { user_id: string; name: string }) {
  const [counterparty] = await db("counterparties").insert(data).returning("*");
  return counterparty;
}

export async function createDebt(data: {
  name: string;
  purpose: string | null;
  total_amount: number;
  remaining_balance: number;
  counterparty_id: string;
  type: "debt" | "asset";
  start_date: string;
  deadline: string | null;
  status: "active" | "paid" | "overdue";
  payment_period: "weekly" | "monthly" | "custom";
  fixed_installment_amount: number | null;
  notes: string | null;
  user_id: string;
}) {
  const [debt] = await db("debts").insert(data).returning("*");
  return debt;
}

export async function findDebtByIdWithCounterparty(id: string) {
  return db("debts")
    .join("counterparties", "debts.counterparty_id", "counterparties.id")
    .where("debts.id", id)
    .select("debts.*", "counterparties.name as counterparty")
    .first();
}

export async function getPaymentsByDebtId(debtId: string) {
  return db("payment_entries").where({ debt_id: debtId }).orderBy("payment_date", "desc");
}

export async function findDebtById(id: string) {
  return db("debts").where({ id }).first();
}

export async function updateDebtById(id: string, updateData: Record<string, unknown>) {
  return db("debts").where({ id }).update(updateData);
}

export async function deleteDebtById(id: string) {
  return db("debts").where({ id }).del();
}

export async function findPaymentByIdAndDebtId(paymentId: string, debtId: string) {
  return db("payment_entries").where({ id: paymentId, debt_id: debtId }).first();
}

export async function createPayment(data: {
  debt_id: string;
  amount: number;
  payment_date: string;
  status: "scheduled" | "paid" | "missed";
  note: string | null;
}) {
  const [payment] = await db("payment_entries").insert(data).returning("*");
  return payment;
}

export async function updatePaymentById(paymentId: string, updateData: Record<string, unknown>) {
  return db("payment_entries").where({ id: paymentId }).update(updateData);
}

export async function findPaymentById(paymentId: string) {
  return db("payment_entries").where({ id: paymentId }).first();
}

export async function deletePaymentById(paymentId: string) {
  return db("payment_entries").where({ id: paymentId }).del();
}
