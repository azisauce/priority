import db from "@/lib/db";

type ExpenseCreateData = {
  budget_id?: string | null;
  amount: number;
  note?: string | null;
  date: string;
};

type ExpenseUpdateData = Partial<ExpenseCreateData>;

function toIsoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function parseDateInput(value: string | Date, label: string): Date {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new RangeError(`Invalid ${label} value`);
    }
    return value;
  }

  const trimmed = value.trim();
  const directParsed = new Date(trimmed);

  if (!Number.isNaN(directParsed.getTime())) {
    return directParsed;
  }

  const normalizedParsed = new Date(`${trimmed}T00:00:00.000Z`);
  if (!Number.isNaN(normalizedParsed.getTime())) {
    return normalizedParsed;
  }

  throw new RangeError(`Invalid ${label} value`);
}

function normalizeToMonthStart(value: string | Date): string {
  const parsed = parseDateInput(value, "month");
  const monthStart = new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), 1));

  return toIsoDate(monthStart);
}

function getNextMonthStart(month: string | Date): string {
  const monthStartIso = normalizeToMonthStart(month);
  const monthStart = parseDateInput(monthStartIso, "month");
  const nextMonthStart = new Date(
    Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 1)
  );

  return toIsoDate(nextMonthStart);
}

function getMonthStartFromDate(date: string | Date): string {
  const targetDate = parseDateInput(date, "date");
  const monthStart = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), 1));

  return toIsoDate(monthStart);
}

export async function findAllByUserAndMonth(userId: string, month: string) {
  const monthStart = normalizeToMonthStart(month);
  const nextMonth = getNextMonthStart(monthStart);

  return db("expenses")
    .leftJoin("budgets", function joinBudgets() {
      this.on("expenses.budget_id", "=", "budgets.id").andOn(
        "budgets.user_id",
        "=",
        "expenses.user_id"
      );
    })
    .where("expenses.user_id", userId)
    .andWhere("expenses.date", ">=", monthStart)
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

export async function sumByBudget(userId: string, budgetId: string, month: string | Date) {
  const monthStart = normalizeToMonthStart(month);
  const nextMonth = getNextMonthStart(monthStart);

  const row = await db("expenses")
    .where({ user_id: userId, budget_id: budgetId })
    .andWhere("date", ">=", monthStart)
    .andWhere("date", "<", nextMonth)
    .sum<{ total_spent: string | number | null }>("amount as total_spent")
    .first();

  return Number(row?.total_spent ?? 0);
}

export function deriveMonthFromExpenseDate(date: string | Date) {
  return getMonthStartFromDate(date);
}
