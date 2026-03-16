import db from "@/lib/db";

type BudgetCreateData = {
  category: string;
  month: string;
  allocated_amount: number;
  rollover?: boolean;
  rolled_over_amount?: number;
};

type BudgetUpdateData = Partial<BudgetCreateData>;

type SpentByBudgetRow = {
  budget_id: string;
  total_spent: string | number | null;
};

function getPreviousMonthStart(month: string): string {
  const monthStart = new Date(`${month}T00:00:00.000Z`);
  const previousMonthStart = new Date(
    Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() - 1, 1)
  );

  return previousMonthStart.toISOString().slice(0, 10);
}

export async function findAllByUserAndMonth(userId: string, month: string) {
  return db("budgets")
    .where({ user_id: userId, month })
    .orderBy("category", "asc")
    .orderBy("created_at", "asc");
}

export async function findById(userId: string, id: string) {
  return db("budgets").where({ user_id: userId, id }).first();
}

export async function create(userId: string, data: BudgetCreateData) {
  const [budget] = await db("budgets")
    .insert({
      user_id: userId,
      category: data.category,
      month: data.month,
      allocated_amount: data.allocated_amount,
      rollover: data.rollover ?? false,
      rolled_over_amount: data.rolled_over_amount ?? 0,
    })
    .returning("*");

  return budget;
}

export async function update(userId: string, id: string, data: BudgetUpdateData) {
  if (Object.keys(data).length === 0) {
    return findById(userId, id);
  }

  const [budget] = await db("budgets")
    .where({ user_id: userId, id })
    .update(data)
    .returning("*");

  return budget ?? null;
}

export async function deleteById(userId: string, id: string) {
  return db("budgets").where({ user_id: userId, id }).del();
}

export { deleteById as delete };

export async function copyFromPreviousMonth(userId: string, month: string) {
  const previousMonth = getPreviousMonthStart(month);

  const previousBudgets = await db("budgets")
    .where({ user_id: userId, month: previousMonth })
    .select("id", "category", "allocated_amount", "rollover", "rolled_over_amount");

  if (previousBudgets.length === 0) {
    return [];
  }

  const previousBudgetIds = previousBudgets.map((budget) => budget.id);

  const spentByBudgetRows = await db("expenses")
    .where("user_id", userId)
    .whereIn("budget_id", previousBudgetIds)
    .where("date", ">=", previousMonth)
    .andWhere("date", "<", month)
    .select("budget_id")
    .sum<SpentByBudgetRow[]>({ total_spent: "amount" })
    .groupBy("budget_id");

  const spentByBudgetMap = new Map<string, number>();
  for (const row of spentByBudgetRows) {
    spentByBudgetMap.set(row.budget_id, Number(row.total_spent ?? 0));
  }

  const copiedBudgets = previousBudgets.map((budget) => {
    const allocatedAmount = Number(budget.allocated_amount);
    const previousRolledOverAmount = Number(budget.rolled_over_amount ?? 0);
    const spentAmount = spentByBudgetMap.get(budget.id) ?? 0;

    const rolledOverAmount = budget.rollover
      ? Math.max(allocatedAmount + previousRolledOverAmount - spentAmount, 0)
      : 0;

    return {
      user_id: userId,
      category: budget.category,
      month,
      allocated_amount: allocatedAmount,
      rollover: Boolean(budget.rollover),
      rolled_over_amount: rolledOverAmount,
    };
  });

  const inserted = await db("budgets")
    .insert(copiedBudgets)
    .onConflict(["user_id", "category", "month"])
    .ignore()
    .returning("*");

  return inserted;
}
