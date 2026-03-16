import { findById as findBudgetById } from "@/server/repositories/budget.repository";
import {
  create,
  deleteById,
  deriveMonthFromExpenseDate,
  findAllByUserAndMonth,
  findById,
  sumByBudget,
  update,
} from "@/server/repositories/expense.repository";

type ServiceResult<T> = {
  status: number;
  body: T;
};

type BudgetRecord = {
  id: string;
  user_id: string;
  category: string;
  month: string;
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

function toNumber(value: string | number | null | undefined): number {
  return Number(value ?? 0);
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

export async function listExpenses(
  userId: string,
  month: string
): Promise<ServiceResult<{ expenses: ReturnType<typeof formatExpense>[] }>> {
  const expenses = (await findAllByUserAndMonth(userId, month)) as ExpenseRecord[];

  return {
    status: 200,
    body: { expenses: expenses.map(formatExpense) },
  };
}

export async function getExpense(
  userId: string,
  id: string
): Promise<ServiceResult<{ error: string } | { expense: ReturnType<typeof formatExpense> }>> {
  const expense = (await findById(userId, id)) as ExpenseRecord | undefined;

  if (!expense) {
    return {
      status: 404,
      body: { error: "Expense not found" },
    };
  }

  return {
    status: 200,
    body: {
      expense: formatExpense(expense),
    },
  };
}

export async function createExpense(
  userId: string,
  data: {
    amount: number;
    budgetId?: string | null;
    note?: string | null;
    date: string;
  }
): Promise<
  ServiceResult<
    { error: string } | { data: ReturnType<typeof formatExpense>; warning?: "budget_threshold_reached" }
  >
> {
  let budget: BudgetRecord | undefined;

  if (data.budgetId) {
    budget = (await findBudgetById(userId, data.budgetId)) as BudgetRecord | undefined;
    if (!budget) {
      return {
        status: 404,
        body: { error: "Budget not found" },
      };
    }
  }

  const createdExpense = (await create(userId, {
    amount: data.amount,
    budget_id: data.budgetId ?? null,
    note: data.note ?? null,
    date: data.date,
  })) as ExpenseRecord;

  const expenseWithCategory = (await findById(userId, createdExpense.id)) as ExpenseRecord | undefined;

  let warning: "budget_threshold_reached" | undefined;

  if (budget && createdExpense.budget_id) {
    const month = deriveMonthFromExpenseDate(createdExpense.date);
    const spentAmount = await sumByBudget(userId, createdExpense.budget_id, month);

    const thresholdBase = toNumber(budget.allocated_amount);

    if (thresholdBase > 0 && spentAmount >= thresholdBase * 0.8) {
      warning = "budget_threshold_reached";
    }
  }

  return {
    status: 201,
    body: {
      data: formatExpense(expenseWithCategory ?? createdExpense),
      ...(warning ? { warning } : {}),
    },
  };
}

export async function updateExpense(
  userId: string,
  id: string,
  data: {
    amount?: number;
    budgetId?: string | null;
    note?: string | null;
    date?: string;
  }
): Promise<ServiceResult<{ error: string } | { expense: ReturnType<typeof formatExpense> }>> {
  const existingExpense = (await findById(userId, id)) as ExpenseRecord | undefined;

  if (!existingExpense) {
    return {
      status: 404,
      body: { error: "Expense not found" },
    };
  }

  if (data.budgetId !== undefined && data.budgetId !== null) {
    const budget = await findBudgetById(userId, data.budgetId);
    if (!budget) {
      return {
        status: 404,
        body: { error: "Budget not found" },
      };
    }
  }

  const updateData: {
    amount?: number;
    budget_id?: string | null;
    note?: string | null;
    date?: string;
  } = {};

  if (data.amount !== undefined) updateData.amount = data.amount;
  if (data.budgetId !== undefined) updateData.budget_id = data.budgetId;
  if (data.note !== undefined) updateData.note = data.note;
  if (data.date !== undefined) updateData.date = data.date;

  const updatedExpense = (await update(userId, id, updateData)) as ExpenseRecord | null;

  if (!updatedExpense) {
    return {
      status: 404,
      body: { error: "Expense not found" },
    };
  }

  const expenseWithCategory = (await findById(userId, id)) as ExpenseRecord | undefined;

  return {
    status: 200,
    body: {
      expense: formatExpense(expenseWithCategory ?? updatedExpense),
    },
  };
}

export async function deleteExpense(
  userId: string,
  id: string
): Promise<ServiceResult<{ error: string } | { message: string }>> {
  const existingExpense = await findById(userId, id);

  if (!existingExpense) {
    return {
      status: 404,
      body: { error: "Expense not found" },
    };
  }

  await deleteById(userId, id);

  return {
    status: 200,
    body: { message: "Expense deleted" },
  };
}
