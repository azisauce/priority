export type DebtType = "debt" | "asset";
export type DebtStatus = "active" | "paid" | "overdue";

export interface DebtItem {
  id: string;
  name: string;
  purpose: string | null;
  totalAmount: number;
  remainingBalance: number;
  counterparty: string;
  type: DebtType;
  startDate: string;
  deadline: string | null;
  status: DebtStatus;
  paymentPeriod: "weekly" | "monthly" | "custom";
  fixedInstallmentAmount: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt?: string;
}

export type PaymentStatus = "scheduled" | "paid" | "missed";

export interface PaymentRecord {
  id: string;
  debtId: string;
  amount: number;
  paymentDate: string;
  status: PaymentStatus;
  note: string | null;
  createdAt: string;
  updatedAt?: string;
}

export type BalanceSortBy =
  | "name"
  | "counterparty"
  | "type"
  | "status"
  | "remainingBalance"
  | "createdAt";

export type SortOrder = "asc" | "desc";

export interface BalanceFiltersState {
  type: "" | DebtType;
  status: "" | DebtStatus;
  minAmount: string;
  maxAmount: string;
  sortBy: BalanceSortBy;
  sortOrder: SortOrder;
}
