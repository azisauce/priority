export type MonthlyPaymentType = "income" | "expense";

export interface MonthlyPaymentEntry {
  id: string;
  monthlyPaymentId: string;
  month: string;
  expectedAmount: number;
  actualPaid: number | null;
  amount: number;
  isPaid: boolean;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  paymentName?: string;
  paymentCategory?: string | null;
  paymentType?: MonthlyPaymentType;
  paymentDefaultAmount?: number;
  paymentDayOfMonth?: number;
  paymentIsVariable?: boolean;
}

export interface MonthlyPayment {
  id: string;
  userId: string;
  name: string;
  category: string | null;
  type: MonthlyPaymentType;
  isVariable: boolean;
  defaultAmount: number;
  dayOfMonth: number;
  startMonth: string;
  endMonth: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  entries: MonthlyPaymentEntry[];
}

export interface CreateMonthlyPaymentInput {
  name: string;
  category: string;
  type: MonthlyPaymentType;
  is_variable?: boolean;
  default_amount: number;
  day_of_month: number;
  start_month: string;
  end_month?: string | null;
}

export type UpdateMonthlyPaymentInput = Partial<CreateMonthlyPaymentInput>;

export interface MarkAsPaidInput {
  month: string;
  amount: number;
}

export interface MonthSummaryEntry {
  id: string;
  monthlyPaymentId: string;
  paymentName: string;
  paymentCategory: string | null;
  paymentType: MonthlyPaymentType;
  dayOfMonth: number;
  isVariable: boolean;
  month: string;
  expectedAmount: number;
  actualPaid: number | null;
  isPaid: boolean;
  paidAt: string | null;
}

export interface MonthSummary {
  month: string;
  totalIncome: number;
  totalExpenses: number;
  net: number;
  entries: MonthSummaryEntry[];
}

export interface PaymentsListResponse {
  payments?: MonthlyPayment[];
  error?: string;
}

export interface PaymentDetailResponse {
  payment?: MonthlyPayment;
  error?: string;
}

export interface MonthSummaryResponse extends Partial<MonthSummary> {
  error?: string;
}
