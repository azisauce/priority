import {
  copyFromPreviousMonth,
  create,
  deleteById,
  findAllByUserAndMonth,
  findById,
  update,
} from "@/server/repositories/budget.repository";
import {
  findAllByUserAndMonth as findExpensesByUserAndMonth,
  sumByBudget,
} from "@/server/repositories/expense.repository";

type ServiceResult<T> = {
  status: number;
  body: T;
};

type BudgetRecord = {
  id: string;
  user_id: string;
  category: string;
  month: string | Date;
  allocated_amount: string | number;
  rollover: boolean;
  rolled_over_amount: string | number;
  created_at: string;
  updated_at: string;
};

type ExpenseRecord = {
  id: string;
  user_id: string;
  budget_id: string | null;
  amount: string | number;
  note: string | null;
  date: string;
  created_at: string;
  updated_at: string;
  budget_category?: string | null;
};

function getCurrentMonthStart(): string {
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  return monthStart.toISOString().slice(0, 10);
}

function toNumber(value: string | number | null | undefined): number {
  return Number(value ?? 0);
}

function pad2(value: number): string {
  return value.toString().padStart(2, "0");
}

function toDateOnly(value: string | Date): string {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new RangeError("Invalid budget month value");
    }

    return `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(value.getDate())}`;
  }

  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    throw new RangeError("Invalid budget month value");
  }

  return `${parsed.getFullYear()}-${pad2(parsed.getMonth() + 1)}-${pad2(parsed.getDate())}`;
}

function formatExpense(expense: ExpenseRecord) {
  return {
    id: expense.id,
    userId: expense.user_id,
    budgetId: expense.budget_id,
    amount: toNumber(expense.amount),
    note: expense.note,
    date: expense.date,
    budgetCategory: expense.budget_category ?? null,
    createdAt: expense.created_at,
    updatedAt: expense.updated_at,
  };
}

function formatBudget(budget: BudgetRecord, spentAmount: number) {
  const allocatedAmount = toNumber(budget.allocated_amount);
  const rolledOverAmount = toNumber(budget.rolled_over_amount);
  const totalAllocatedAmount = allocatedAmount + rolledOverAmount;
  const remainingAmount = totalAllocatedAmount - spentAmount;

  return {
    id: budget.id,
    userId: budget.user_id,
    category: budget.category,
    month: toDateOnly(budget.month),
    allocatedAmount,
    rolledOverAmount,
    totalAllocatedAmount,
    rollover: Boolean(budget.rollover),
    spentAmount,
    remainingAmount,
    createdAt: budget.created_at,
    updatedAt: budget.updated_at,
  };
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  );
}

export async function listBudgets(
  userId: string,
  month: string
): Promise<ServiceResult<{ budgets: ReturnType<typeof formatBudget>[] }>> {
  const budgets = (await findAllByUserAndMonth(userId, month)) as BudgetRecord[];

  const spentAmounts = await Promise.all(
    budgets.map((budget) => sumByBudget(userId, budget.id, month))
  );

  const formatted = budgets.map((budget, index) => formatBudget(budget, spentAmounts[index] ?? 0));

  return {
    status: 200,
    body: { budgets: formatted },
  };
}

export async function getBudget(
  userId: string,
  id: string,
  month?: string
): Promise<
  ServiceResult<
    { error: string } | { budget: ReturnType<typeof formatBudget>; expenses: ReturnType<typeof formatExpense>[] }
  >
> {
  const budget = (await findById(userId, id)) as BudgetRecord | undefined;

  if (!budget) {
    return {
      status: 404,
      body: { error: "Budget not found" },
    };
  }

  const monthToUse = month ?? getCurrentMonthStart();

  const expenses = (await findExpensesByUserAndMonth(userId, monthToUse)) as ExpenseRecord[];
  const budgetExpenses = expenses.filter((expense) => expense.budget_id === budget.id);

  const spentAmount = budgetExpenses.reduce((sum, expense) => sum + toNumber(expense.amount), 0);

  return {
    status: 200,
    body: {
      budget: formatBudget(budget, spentAmount),
      expenses: budgetExpenses.map(formatExpense),
    },
  };
}

export async function createBudget(
  userId: string,
  data: {
    category: string;
    month: string;
    allocatedAmount: number;
    rollover?: boolean;
  }
): Promise<ServiceResult<{ error: string } | { budget: ReturnType<typeof formatBudget> }>> {
  try {
    const budget = (await create(userId, {
      category: data.category,
      month: data.month,
      allocated_amount: data.allocatedAmount,
      rollover: data.rollover ?? false,
      rolled_over_amount: 0,
    })) as BudgetRecord;

    return {
      status: 201,
      body: {
        budget: formatBudget(budget, 0),
      },
    };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        status: 409,
        body: { error: "A budget with this category already exists for this month" },
      };
    }

    throw error;
  }
}

export async function updateBudget(
  userId: string,
  id: string,
  data: {
    category?: string;
    month?: string;
    allocatedAmount?: number;
    rollover?: boolean;
    rolledOverAmount?: number;
  }
): Promise<ServiceResult<{ error: string } | { budget: ReturnType<typeof formatBudget> }>> {
  const existingBudget = (await findById(userId, id)) as BudgetRecord | undefined;

  if (!existingBudget) {
    return {
      status: 404,
      body: { error: "Budget not found" },
    };
  }

  const updateData: {
    category?: string;
    month?: string;
    allocated_amount?: number;
    rollover?: boolean;
    rolled_over_amount?: number;
  } = {};

  if (data.category !== undefined) updateData.category = data.category;
  if (data.month !== undefined) updateData.month = data.month;
  if (data.allocatedAmount !== undefined) updateData.allocated_amount = data.allocatedAmount;
  if (data.rollover !== undefined) updateData.rollover = data.rollover;
  if (data.rolledOverAmount !== undefined) updateData.rolled_over_amount = data.rolledOverAmount;

  try {
    const updated = (await update(userId, id, updateData)) as BudgetRecord | null;
    if (!updated) {
      return {
        status: 404,
        body: { error: "Budget not found" },
      };
    }

    const spentAmount = await sumByBudget(userId, updated.id, updated.month);

    return {
      status: 200,
      body: {
        budget: formatBudget(updated, spentAmount),
      },
    };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        status: 409,
        body: { error: "A budget with this category already exists for this month" },
      };
    }

    throw error;
  }
}

export async function deleteBudget(
  userId: string,
  id: string
): Promise<ServiceResult<{ error: string } | { message: string }>> {
  const existingBudget = await findById(userId, id);

  if (!existingBudget) {
    return {
      status: 404,
      body: { error: "Budget not found" },
    };
  }

  await deleteById(userId, id);

  return {
    status: 200,
    body: { message: "Budget deleted" },
  };
}

export async function copyPreviousMonth(
  userId: string,
  month: string
): Promise<ServiceResult<{ copiedBudgets: ReturnType<typeof formatBudget>[] }>> {
  const copied = (await copyFromPreviousMonth(userId, month)) as BudgetRecord[];

  return {
    status: 201,
    body: {
      copiedBudgets: copied.map((budget) => formatBudget(budget, 0)),
    },
  };
}
