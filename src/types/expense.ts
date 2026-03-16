export interface Expense {
  id: string;
  userId: string;
  budgetId: string | null;
  amount: number;
  note: string | null;
  date: string;
  budgetCategory: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseInput {
  amount: number;
  budgetId?: string | null;
  note?: string | null;
  date: string;
}

export interface UpdateExpenseInput {
  amount?: number;
  budgetId?: string | null;
  note?: string | null;
  date?: string;
}

export interface ExpenseListResponse {
  expenses?: Expense[];
  error?: string;
}

export interface ExpensePostResponse {
  data?: Expense;
  warning?: "budget_threshold_reached";
  error?: string;
}
