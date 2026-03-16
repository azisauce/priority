import db from "@/lib/db";

function getCurrentMonthStart(): string {
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  return monthStart.toISOString().slice(0, 10);
}

function getNextMonthStart(monthStart: string): string {
  const monthDate = new Date(`${monthStart}T00:00:00.000Z`);
  const nextMonth = new Date(Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth() + 1, 1));

  return nextMonth.toISOString().slice(0, 10);
}

function toBoolean(value: boolean | string | number | null | undefined): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value === 1;
  }

  if (typeof value === "string") {
    const normalized = value.toLowerCase();
    return normalized === "true" || normalized === "t" || normalized === "1";
  }

  return false;
}

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

export async function getCurrentMonthPaymentsSummary(userId: string) {
  const month = getCurrentMonthStart();

  const rows = await db("monthly_payments")
    .leftJoin("monthly_payment_entries", function joinEntries() {
      this.on("monthly_payment_entries.monthly_payment_id", "=", "monthly_payments.id").andOn(
        "monthly_payment_entries.month",
        "=",
        db.raw("?", [month])
      );
    })
    .where("monthly_payments.user_id", userId)
    .andWhere("monthly_payments.start_month", "<=", month)
    .andWhere(function whereEndMonth() {
      this.whereNull("monthly_payments.end_month").orWhere("monthly_payments.end_month", ">=", month);
    })
    .select(
      "monthly_payments.id",
      "monthly_payments.name",
      "monthly_payments.type",
      "monthly_payments.category",
      "monthly_payments.is_variable",
      "monthly_payments.day_of_month",
      "monthly_payments.default_amount",
      "monthly_payment_entries.amount as entry_amount",
      "monthly_payment_entries.is_paid",
      "monthly_payment_entries.paid_at"
    )
    .orderBy("monthly_payments.type", "asc")
    .orderBy("monthly_payments.day_of_month", "asc")
    .orderBy("monthly_payments.name", "asc");

  const payments = rows.map((row) => {
    const amount = Number(row.entry_amount ?? row.default_amount ?? 0);
    const isPaid = toBoolean(row.is_paid);

    return {
      id: row.id,
      name: row.name,
      type: row.type,
      category: row.category,
      is_variable: toBoolean(row.is_variable),
      day_of_month: row.day_of_month,
      amount,
      is_paid: isPaid,
      paid_at: row.paid_at,
    };
  });

  const totalIncome = payments
    .filter((payment) => payment.type === "income")
    .reduce((sum, payment) => sum + payment.amount, 0);

  const totalExpenses = payments
    .filter((payment) => payment.type === "expense")
    .reduce((sum, payment) => sum + payment.amount, 0);

  const fixedExpenses = payments
    .filter((payment) => payment.type === "expense" && !payment.is_variable)
    .reduce((sum, payment) => sum + payment.amount, 0);

  const paidCount = payments.filter((payment) => payment.is_paid).length;
  const unpaidCount = Math.max(payments.length - paidCount, 0);

  return {
    month,
    total_income: totalIncome,
    total_expenses: totalExpenses,
    fixed_expenses: fixedExpenses,
    net: totalIncome - totalExpenses,
    paid_count: paidCount,
    unpaid_count: unpaidCount,
    payments,
  };
}

export async function getCurrentMonthBudgetsSummary(userId: string) {
  const month = getCurrentMonthStart();
  const nextMonth = getNextMonthStart(month);

  const rows = await db("budgets")
    .leftJoin("expenses", function joinExpenses() {
      this.on("expenses.budget_id", "=", "budgets.id")
        .andOn("expenses.user_id", "=", "budgets.user_id")
        .andOn("expenses.date", ">=", db.raw("?", [month]))
        .andOn("expenses.date", "<", db.raw("?", [nextMonth]));
    })
    .where("budgets.user_id", userId)
    .andWhere("budgets.month", month)
    .groupBy(
      "budgets.id",
      "budgets.category",
      "budgets.month",
      "budgets.allocated_amount",
      "budgets.rolled_over_amount"
    )
    .select(
      "budgets.id",
      "budgets.category",
      "budgets.month",
      "budgets.allocated_amount",
      "budgets.rolled_over_amount",
      db.raw("COALESCE(SUM(expenses.amount), 0) as spent_amount")
    )
    .orderBy("budgets.category", "asc")
    .orderBy("budgets.created_at", "asc");

  return rows.map((row) => {
    const allocatedAmount = Number(row.allocated_amount ?? 0);
    const rolledOverAmount = Number(row.rolled_over_amount ?? 0);
    const totalAllocatedAmount = allocatedAmount + rolledOverAmount;
    const spentAmount = Number(row.spent_amount ?? 0);
    const spentPercentRaw =
      totalAllocatedAmount > 0 ? (spentAmount / totalAllocatedAmount) * 100 : 0;

    return {
      id: row.id,
      category: row.category,
      month: row.month,
      allocated_amount: allocatedAmount,
      rolled_over_amount: rolledOverAmount,
      total_allocated_amount: totalAllocatedAmount,
      spent_amount: spentAmount,
      remaining_amount: totalAllocatedAmount - spentAmount,
      spent_percent: Math.round(spentPercentRaw * 100) / 100,
      is_over_80_percent: spentPercentRaw >= 80,
    };
  });
}

export async function getRecentExpenses(userId: string, limit = 5) {
  return db("expenses")
    .leftJoin("budgets", function joinBudgets() {
      this.on("expenses.budget_id", "=", "budgets.id").andOn(
        "budgets.user_id",
        "=",
        "expenses.user_id"
      );
    })
    .where("expenses.user_id", userId)
    .select(
      "expenses.id",
      "expenses.amount",
      "expenses.note",
      "expenses.date",
      "expenses.created_at",
      "budgets.category as budget_category"
    )
    .orderBy("expenses.date", "desc")
    .orderBy("expenses.created_at", "desc")
    .limit(limit);
}

export async function getUpcomingDues(userId: string, days = 7) {
  const today = new Date();
  const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const dueByUtc = new Date(todayUtc);
  dueByUtc.setUTCDate(todayUtc.getUTCDate() + days);

  const todayIso = todayUtc.toISOString().slice(0, 10);
  const dueByIso = dueByUtc.toISOString().slice(0, 10);

  return db("debts")
    .leftJoin("counterparties", "debts.counterparty_id", "counterparties.id")
    .where("debts.user_id", userId)
    .whereNotNull("debts.deadline")
    .andWhere("debts.deadline", ">=", todayIso)
    .andWhere("debts.deadline", "<=", dueByIso)
    .whereNot("debts.status", "paid")
    .select(
      "debts.id",
      "debts.name",
      "debts.direction",
      "debts.status",
      "debts.deadline",
      "debts.total_amount",
      "debts.paid_amount",
      db.raw("GREATEST(debts.total_amount - debts.paid_amount, 0) as remaining_amount"),
      "counterparties.name as counterparty"
    )
    .orderBy("debts.deadline", "asc")
    .orderBy("debts.created_at", "asc");
}
