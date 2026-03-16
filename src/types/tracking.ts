export type DebtDirection = "i_owe" | "they_owe";
export type DebtStatus = "active" | "paid" | "overdue";

export interface DebtItem {
  id: string;
  name: string;
  purpose: string | null;
  totalAmount: number;
  paidAmount: number;
  counterparty: string;
  direction: DebtDirection;
  startDate: string;
  deadline: string | null;
  status: DebtStatus;
  paymentPeriod: "weekly" | "monthly" | "custom";
  installmentAmount: number | null;
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
  | "direction"
  | "status"
  | "paidAmount"
  | "createdAt";

export type SortOrder = "asc" | "desc";

export interface BalanceFiltersState {
  direction: "" | DebtDirection;
  status: "" | DebtStatus;
  minAmount: string;
  maxAmount: string;
  sortBy: BalanceSortBy;
  sortOrder: SortOrder;
}
