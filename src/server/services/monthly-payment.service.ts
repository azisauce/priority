import {
  create,
  deleteById,
  findAllByUser,
  findAllByUserForMonth,
  findById,
  findEntriesForMonth,
  normalizeMonthToStart,
  update,
  upsertMonthlyPaymentEntry,
} from "@/server/repositories/monthly-payment.repository";

type ServiceResult<T> = {
  status: number;
  body: T;
};

type MonthlyPaymentRow = {
  id: string;
  user_id: string;
  name: string;
  category: string | null;
  type: "income" | "expense";
  is_variable: boolean;
  default_amount: string | number;
  day_of_month: number;
  start_month: string;
  end_month: string | null;
  created_at: string;
  updated_at: string;
  is_active?: boolean | string | number;
  entries?: MonthlyPaymentEntryRow[];
};

type MonthlyPaymentEntryRow = {
  id: string;
  monthly_payment_id: string;
  month: string;
  amount: string | number;
  is_paid: boolean | string | number;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  payment_name?: string;
  payment_category?: string | null;
  payment_type?: "income" | "expense";
  payment_default_amount?: string | number;
  payment_day_of_month?: number;
  payment_is_variable?: boolean | string | number;
};

function toNumber(value: string | number | null | undefined): number {
  return Number(value ?? 0);
}

function toBoolean(value: boolean | string | number | null | undefined): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.toLowerCase();
    return normalized === "true" || normalized === "t" || normalized === "1";
  }
  return false;
}

function toDate(dateString: string): Date {
  return new Date(`${dateString}T00:00:00.000Z`);
}

function formatEntry(entry: MonthlyPaymentEntryRow) {
  return {
    id: entry.id,
    monthlyPaymentId: entry.monthly_payment_id,
    month: entry.month,
    expectedAmount: toNumber(entry.amount),
    actualPaid: toBoolean(entry.is_paid) ? toNumber(entry.amount) : null,
    amount: toNumber(entry.amount),
    isPaid: toBoolean(entry.is_paid),
    paidAt: entry.paid_at,
    createdAt: entry.created_at,
    updatedAt: entry.updated_at,
    paymentName: entry.payment_name,
    paymentCategory: entry.payment_category ?? null,
    paymentType: entry.payment_type,
    paymentDefaultAmount:
      entry.payment_default_amount !== undefined ? toNumber(entry.payment_default_amount) : undefined,
    paymentDayOfMonth: entry.payment_day_of_month,
    paymentIsVariable:
      entry.payment_is_variable !== undefined ? toBoolean(entry.payment_is_variable) : undefined,
  };
}

function formatPayment(payment: MonthlyPaymentRow) {
  return {
    id: payment.id,
    userId: payment.user_id,
    name: payment.name,
    category: payment.category,
    type: payment.type,
    isVariable: Boolean(payment.is_variable),
    defaultAmount: toNumber(payment.default_amount),
    dayOfMonth: payment.day_of_month,
    startMonth: payment.start_month,
    endMonth: payment.end_month,
    isActive:
      payment.is_active !== undefined
        ? toBoolean(payment.is_active)
        : payment.end_month === null || payment.end_month >= normalizeMonthToStart(new Date()),
    createdAt: payment.created_at,
    updatedAt: payment.updated_at,
    entries: (payment.entries ?? []).map(formatEntry),
  };
}

export async function listPayments(
  userId: string
): Promise<ServiceResult<{ payments: ReturnType<typeof formatPayment>[] }>> {
  const payments = (await findAllByUser(userId)) as MonthlyPaymentRow[];

  return {
    status: 200,
    body: {
      payments: payments.map(formatPayment),
    },
  };
}

export async function getPayment(
  userId: string,
  id: string
): Promise<ServiceResult<{ error: string } | { payment: ReturnType<typeof formatPayment> }>> {
  const payment = (await findById(userId, id)) as MonthlyPaymentRow | null;

  if (!payment) {
    return {
      status: 404,
      body: { error: "Monthly payment not found" },
    };
  }

  return {
    status: 200,
    body: {
      payment: formatPayment(payment),
    },
  };
}

export async function createPayment(
  userId: string,
  data: {
    name: string;
    category: string;
    type: "income" | "expense";
    is_variable?: boolean;
    default_amount: number;
    day_of_month: number;
    start_month: string;
    end_month?: string | null;
  }
): Promise<ServiceResult<{ payment: ReturnType<typeof formatPayment> }>> {
  const createdPayment = (await create(userId, data)) as MonthlyPaymentRow;

  const today = new Date();
  const todayDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const paymentStart = toDate(createdPayment.start_month);
  const currentMonthStart = normalizeMonthToStart(today);

  const isEligibleForCurrentMonth =
    paymentStart.getTime() <= todayDate.getTime() &&
    (!createdPayment.end_month || createdPayment.end_month >= currentMonthStart);

  if (isEligibleForCurrentMonth) {
    await upsertMonthlyPaymentEntry(createdPayment.id, {
      month: currentMonthStart,
      amount: toNumber(createdPayment.default_amount),
      is_paid: false,
      paid_at: null,
    });
  }

  const paymentWithEntries = (await findById(userId, createdPayment.id)) as MonthlyPaymentRow;

  return {
    status: 201,
    body: {
      payment: formatPayment(paymentWithEntries),
    },
  };
}

export async function updatePayment(
  userId: string,
  id: string,
  data: {
    name?: string;
    category?: string;
    type?: "income" | "expense";
    is_variable?: boolean;
    default_amount?: number;
    day_of_month?: number;
    start_month?: string;
    end_month?: string | null;
  }
): Promise<ServiceResult<{ error: string } | { payment: ReturnType<typeof formatPayment> }>> {
  const existing = (await findById(userId, id)) as MonthlyPaymentRow | null;
  if (!existing) {
    return {
      status: 404,
      body: { error: "Monthly payment not found" },
    };
  }

  const updatedPayment = (await update(userId, id, data)) as MonthlyPaymentRow | null;

  if (!updatedPayment) {
    return {
      status: 404,
      body: { error: "Monthly payment not found" },
    };
  }

  const paymentWithEntries = (await findById(userId, id)) as MonthlyPaymentRow;

  return {
    status: 200,
    body: {
      payment: formatPayment(paymentWithEntries),
    },
  };
}

export async function deletePayment(
  userId: string,
  id: string
): Promise<ServiceResult<{ error: string } | { message: string }>> {
  const existing = await findById(userId, id);

  if (!existing) {
    return {
      status: 404,
      body: { error: "Monthly payment not found" },
    };
  }

  await deleteById(userId, id);

  return {
    status: 200,
    body: { message: "Monthly payment deleted" },
  };
}

export async function markAsPaid(
  userId: string,
  paymentId: string,
  month: string,
  amount: number
): Promise<ServiceResult<{ error: string } | { entry: ReturnType<typeof formatEntry> }>> {
  const payment = (await findById(userId, paymentId)) as MonthlyPaymentRow | null;

  if (!payment) {
    return {
      status: 404,
      body: { error: "Monthly payment not found" },
    };
  }

  const entry = (await upsertMonthlyPaymentEntry(paymentId, {
    month: normalizeMonthToStart(toDate(month)),
    amount,
    is_paid: true,
    paid_at: new Date(),
  })) as MonthlyPaymentEntryRow;

  return {
    status: 200,
    body: {
      entry: formatEntry({
        ...entry,
        payment_name: payment.name,
        payment_category: payment.category,
        payment_type: payment.type,
        payment_default_amount: payment.default_amount,
        payment_day_of_month: payment.day_of_month,
        payment_is_variable: payment.is_variable,
      }),
    },
  };
}

export async function getMonthSummary(
  userId: string,
  month: string
): Promise<
  ServiceResult<{
    month: string;
    totalIncome: number;
    totalExpenses: number;
    net: number;
    entries: Array<{
      id: string;
      monthlyPaymentId: string;
      paymentName: string;
      paymentCategory: string | null;
      paymentType: "income" | "expense";
      dayOfMonth: number;
      isVariable: boolean;
      month: string;
      expectedAmount: number;
      actualPaid: number | null;
      isPaid: boolean;
      paidAt: string | null;
    }>;
  }>
> {
  const monthDate = toDate(month);
  const normalizedMonth = normalizeMonthToStart(monthDate);

  const [payments, entriesForMonth] = await Promise.all([
    findAllByUserForMonth(userId, monthDate),
    findEntriesForMonth(userId, monthDate),
  ]);

  const paymentsRows = payments as MonthlyPaymentRow[];
  const entryRows = entriesForMonth as MonthlyPaymentEntryRow[];

  const entryByPaymentId = new Map<string, MonthlyPaymentEntryRow>();
  for (const entry of entryRows) {
    entryByPaymentId.set(entry.monthly_payment_id, entry);
  }

  const summaryEntries = paymentsRows.map((payment) => {
    const entry = entryByPaymentId.get(payment.id);
    const expectedAmount = entry ? toNumber(entry.amount) : toNumber(payment.default_amount);
    const isPaid = entry ? toBoolean(entry.is_paid) : false;

    return {
      id: entry?.id ?? `${payment.id}:${normalizedMonth}`,
      monthlyPaymentId: payment.id,
      paymentName: payment.name,
      paymentCategory: payment.category,
      paymentType: payment.type,
      dayOfMonth: payment.day_of_month,
      isVariable: Boolean(payment.is_variable),
      month: normalizedMonth,
      expectedAmount,
      actualPaid: isPaid ? expectedAmount : null,
      isPaid,
      paidAt: entry?.paid_at ?? null,
    };
  });

  const totalIncome = summaryEntries
    .filter((entry) => entry.paymentType === "income")
    .reduce((sum, entry) => sum + entry.expectedAmount, 0);

  const totalExpenses = summaryEntries
    .filter((entry) => entry.paymentType === "expense")
    .reduce((sum, entry) => sum + entry.expectedAmount, 0);

  return {
    status: 200,
    body: {
      month: normalizedMonth,
      totalIncome,
      totalExpenses,
      net: totalIncome - totalExpenses,
      entries: summaryEntries,
    },
  };
}
