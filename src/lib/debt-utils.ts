import db from "@/lib/db";

/**
 * Recalculate remaining_balance for a debt and auto-set status.
 * remaining_balance = total_amount - SUM(paid payments)
 * status = 'paid' if remaining <= 0, 'overdue' if deadline passed, else 'active'
 */
export async function recalcDebt(debtId: string) {
  const debt = await db("debts").where({ id: debtId }).first();
  if (!debt) return;

  const result = await db("payment_entries")
    .where({ debt_id: debtId, status: "paid" })
    .sum("amount as total_paid")
    .first();

  const totalPaid = Number(result?.total_paid || 0);
  const remaining = Math.max(Number(debt.total_amount) - totalPaid, 0);

  const updateData: Record<string, unknown> = { remaining_balance: remaining };

  if (remaining <= 0) {
    updateData.status = "paid";
  } else if (
    debt.deadline &&
    new Date(debt.deadline) < new Date() &&
    debt.status !== "paid"
  ) {
    updateData.status = "overdue";
  } else if (debt.status === "paid" && remaining > 0) {
    // Was marked paid but now has balance again (e.g. payment deleted)
    updateData.status = "active";
  }

  await db("debts").where({ id: debtId }).update(updateData);
}
