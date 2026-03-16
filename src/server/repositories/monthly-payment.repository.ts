import db from "@/lib/db";

export type MonthlyPaymentType = "income" | "expense";

export type MonthlyPaymentCreateData = {
  name: string;
  category: string;
  type: MonthlyPaymentType;
  is_variable?: boolean;
  default_amount: number;
  day_of_month: number;
  start_month: string;
  end_month?: string | null;
};

export type MonthlyPaymentUpdateData = Partial<MonthlyPaymentCreateData>;

export type MonthlyPaymentEntryUpsertData = {
  month: string;
  amount: number;
  is_paid?: boolean;
  paid_at?: Date | null;
};

function toMonthStart(date: Date): string {
  const monthStart = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  return monthStart.toISOString().slice(0, 10);
}

export async function findAllByUser(userId: string) {
  const currentMonthStart = toMonthStart(new Date());

  return db("monthly_payments")
    .where("monthly_payments.user_id", userId)
    .select(
      "monthly_payments.*",
      db.raw(
        "CASE WHEN monthly_payments.end_month IS NULL OR monthly_payments.end_month >= ? THEN true ELSE false END as is_active",
        [currentMonthStart]
      )
    )
    .orderBy("monthly_payments.type", "asc")
    .orderBy("monthly_payments.day_of_month", "asc")
    .orderBy("monthly_payments.name", "asc");
}

export async function findById(userId: string, id: string) {
  const currentMonthStart = toMonthStart(new Date());

  const payment = await db("monthly_payments")
    .where("monthly_payments.user_id", userId)
    .andWhere("monthly_payments.id", id)
    .select(
      "monthly_payments.*",
      db.raw(
        "CASE WHEN monthly_payments.end_month IS NULL OR monthly_payments.end_month >= ? THEN true ELSE false END as is_active",
        [currentMonthStart]
      )
    )
    .first();

  if (!payment) {
    return null;
  }

  const entries = await db("monthly_payment_entries")
    .where("monthly_payment_entries.monthly_payment_id", id)
    .select("monthly_payment_entries.*")
    .orderBy("monthly_payment_entries.month", "desc")
    .orderBy("monthly_payment_entries.created_at", "desc");

  return {
    ...payment,
    entries,
  };
}

export async function create(userId: string, data: MonthlyPaymentCreateData) {
  const [payment] = await db("monthly_payments")
    .insert({
      user_id: userId,
      name: data.name,
      category: data.category,
      type: data.type,
      is_variable: data.is_variable ?? false,
      default_amount: data.default_amount,
      day_of_month: data.day_of_month,
      start_month: data.start_month,
      end_month: data.end_month ?? null,
    })
    .returning("*");

  return payment;
}

export async function update(userId: string, id: string, data: MonthlyPaymentUpdateData) {
  if (Object.keys(data).length === 0) {
    return db("monthly_payments").where({ user_id: userId, id }).first();
  }

  const [payment] = await db("monthly_payments")
    .where({ user_id: userId, id })
    .update(data)
    .returning("*");

  return payment ?? null;
}

export async function deleteById(userId: string, id: string) {
  return db("monthly_payments").where({ user_id: userId, id }).del();
}

export { deleteById as delete };

export async function findEntriesForMonth(userId: string, month: Date) {
  const monthStart = toMonthStart(month);

  return db("monthly_payment_entries")
    .join(
      "monthly_payments",
      "monthly_payment_entries.monthly_payment_id",
      "monthly_payments.id"
    )
    .where("monthly_payments.user_id", userId)
    .andWhere("monthly_payment_entries.month", monthStart)
    .select(
      "monthly_payment_entries.*",
      "monthly_payments.name as payment_name",
      "monthly_payments.category as payment_category",
      "monthly_payments.type as payment_type",
      "monthly_payments.default_amount as payment_default_amount",
      "monthly_payments.day_of_month as payment_day_of_month",
      "monthly_payments.is_variable as payment_is_variable"
    )
    .orderBy("monthly_payments.type", "asc")
    .orderBy("monthly_payments.day_of_month", "asc")
    .orderBy("monthly_payments.name", "asc");
}

export async function findAllByUserForMonth(userId: string, month: Date) {
  const monthStart = toMonthStart(month);

  return db("monthly_payments")
    .where("monthly_payments.user_id", userId)
    .andWhere("monthly_payments.start_month", "<=", monthStart)
    .andWhere(function whereEndMonth() {
      this.whereNull("monthly_payments.end_month").orWhere(
        "monthly_payments.end_month",
        ">=",
        monthStart
      );
    })
    .select("monthly_payments.*")
    .orderBy("monthly_payments.type", "asc")
    .orderBy("monthly_payments.day_of_month", "asc")
    .orderBy("monthly_payments.name", "asc");
}

export async function upsertMonthlyPaymentEntry(
  monthlyPaymentId: string,
  data: MonthlyPaymentEntryUpsertData
) {
  const [entry] = await db("monthly_payment_entries")
    .insert({
      monthly_payment_id: monthlyPaymentId,
      month: data.month,
      amount: data.amount,
      is_paid: data.is_paid ?? false,
      paid_at: data.paid_at ?? null,
    })
    .onConflict(["monthly_payment_id", "month"])
    .merge({
      amount: data.amount,
      is_paid: data.is_paid ?? false,
      paid_at: data.paid_at ?? null,
      updated_at: db.fn.now(),
    })
    .returning("*");

  return entry;
}

export async function findEntriesByPaymentId(userId: string, paymentId: string) {
  return db("monthly_payment_entries")
    .join(
      "monthly_payments",
      "monthly_payment_entries.monthly_payment_id",
      "monthly_payments.id"
    )
    .where("monthly_payments.user_id", userId)
    .andWhere("monthly_payment_entries.monthly_payment_id", paymentId)
    .select("monthly_payment_entries.*")
    .orderBy("monthly_payment_entries.month", "desc")
    .orderBy("monthly_payment_entries.created_at", "desc");
}

export async function findEntryByPaymentIdAndMonth(
  userId: string,
  paymentId: string,
  month: Date
) {
  const monthStart = toMonthStart(month);

  return db("monthly_payment_entries")
    .join(
      "monthly_payments",
      "monthly_payment_entries.monthly_payment_id",
      "monthly_payments.id"
    )
    .where("monthly_payments.user_id", userId)
    .andWhere("monthly_payment_entries.monthly_payment_id", paymentId)
    .andWhere("monthly_payment_entries.month", monthStart)
    .select("monthly_payment_entries.*")
    .first();
}

export function normalizeMonthToStart(date: Date): string {
  return toMonthStart(date);
}
