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
  nextPaymentDate?: string | null;
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

export interface DebtSummaryUpcomingDue {
  id: string;
  name: string;
  counterparty: string;
  direction: DebtDirection;
  payment_date: string;
  amount: number;
  days_until_payment: number;
}

export interface DebtSummary {
  total_i_owe: number;
  total_they_owe: number;
  net_balance: number;
  upcoming_dues: DebtSummaryUpcomingDue[];
}

export interface CounterpartyDebtRecord {
  id: string;
  name: string;
  purpose: string | null;
  direction: DebtDirection;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  startDate: string;
  deadline: string | null;
  status: DebtStatus;
  paymentPeriod: "weekly" | "monthly" | "custom";
  installmentAmount: number | null;
  createdAt: string;
}
