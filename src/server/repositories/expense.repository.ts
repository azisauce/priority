import db from "@/lib/db";

type ExpenseCreateData = {
  budget_id?: string | null;
  amount: number;
  note?: string | null;
  date: string;
};

type ExpenseUpdateData = Partial<ExpenseCreateData>;

function getNextMonthStart(month: string): string {
  const monthStart = new Date(`${month}T00:00:00.000Z`);
  const nextMonthStart = new Date(
    Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 1)
  );

  return nextMonthStart.toISOString().slice(0, 10);
}

function getMonthStartFromDate(date: string): string {
  const targetDate = new Date(`${date}T00:00:00.000Z`);
  const monthStart = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), 1));

  return monthStart.toISOString().slice(0, 10);
}

export async function findAllByUserAndMonth(userId: string, month: string) {
  const nextMonth = getNextMonthStart(month);

  return db("expenses")
    .leftJoin("budgets", function joinBudgets() {
      this.on("expenses.budget_id", "=", "budgets.id").andOn(
        "budgets.user_id",
        "=",
        "expenses.user_id"
      );
    })
    .where("expenses.user_id", userId)
    .andWhere("expenses.date", ">=", month)
    .andWhere("expenses.date", "<", nextMonth)
    .select("expenses.*", "budgets.category as budget_category")
    .orderBy("expenses.date", "desc")
    .orderBy("expenses.created_at", "desc");
}

export async function findById(userId: string, id: string) {
  return db("expenses")
    .leftJoin("budgets", function joinBudgets() {
      this.on("expenses.budget_id", "=", "budgets.id").andOn(
        "budgets.user_id",
        "=",
        "expenses.user_id"
      );
    })
    .where("expenses.user_id", userId)
    .andWhere("expenses.id", id)
    .select("expenses.*", "budgets.category as budget_category")
    .first();
}

export async function create(userId: string, data: ExpenseCreateData) {
  const [expense] = await db("expenses")
    .insert({
      user_id: userId,
      budget_id: data.budget_id ?? null,
      amount: data.amount,
      note: data.note ?? null,
      date: data.date,
    })
    .returning("*");

  return expense;
}

export async function update(userId: string, id: string, data: ExpenseUpdateData) {
  if (Object.keys(data).length === 0) {
    return findById(userId, id);
  }

  const [expense] = await db("expenses")
    .where({ user_id: userId, id })
    .update(data)
    .returning("*");

  return expense ?? null;
}

export async function deleteById(userId: string, id: string) {
  return db("expenses").where({ user_id: userId, id }).del();
}

export { deleteById as delete };

export async function sumByBudget(userId: string, budgetId: string, month: string) {
  const nextMonth = getNextMonthStart(month);

  const row = await db("expenses")
    .where({ user_id: userId, budget_id: budgetId })
    .andWhere("date", ">=", month)
    .andWhere("date", "<", nextMonth)
    .sum<{ total_spent: string | number | null }>("amount as total_spent")
    .first();

  return Number(row?.total_spent ?? 0);
}

export function deriveMonthFromExpenseDate(date: string) {
  return getMonthStartFromDate(date);
}
