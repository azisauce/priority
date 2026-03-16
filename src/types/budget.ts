import type { Expense } from "@/types/expense";

export interface Budget {
  id: string;
  userId: string;
  category: string;
  month: string;
  allocatedAmount: number;
  rolledOverAmount: number;
  totalAllocatedAmount: number;
  rollover: boolean;
  spentAmount: number;
  remainingAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBudgetInput {
  category: string;
  month: string;
  allocatedAmount: number;
  rollover?: boolean;
}

export interface UpdateBudgetInput {
  category?: string;
  month?: string;
  allocatedAmount?: number;
  rollover?: boolean;
  rolledOverAmount?: number;
}

export interface BudgetListResponse {
  budgets?: Budget[];
  error?: string;
}

export interface BudgetDetailResponse {
  budget?: Budget;
  expenses?: Expense[];
  error?: string;
}

export interface BudgetCopyResponse {
  copiedBudgets?: Budget[];
  error?: string;
}
