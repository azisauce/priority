/* eslint-disable @typescript-eslint/no-explicit-any */

import { recalcDebt } from "@/lib/debt-utils";
import {
  createCounterparty,
  createDebt,
  createPayment,
  deleteDebtById,
  deletePaymentById,
  findCounterpartyByUserAndName,
  findDebtById,
  findDebtByIdWithCounterparty,
  findPaymentById,
  findPaymentByIdAndDebtId,
  findSummaryByUser,
  getDebtsByUserAndDirection,
  getPaymentsByDebtId,
  getScheduledPaymentsForDebts,
  updateDebtById,
  updateOverdueDebts,
  updatePaymentById,
} from "@/server/repositories/debts.repository";

type ServiceResult<T> = {
  status: number;
  body: T;
};

function formatDebt(row: any) {
  return {
    id: row.id,
    name: row.name,
    purpose: row.purpose,
    totalAmount: Number(row.total_amount),
    paidAmount: Number(row.paid_amount),
    counterparty: row.counterparty,
    direction: row.direction,
    startDate: row.start_date,
    deadline: row.deadline,
    status: row.status,
    paymentPeriod: row.payment_period,
    installmentAmount: row.installment_amount != null ? Number(row.installment_amount) : null,
    notes: row.notes,
    userId: row.user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function formatPayment(row: any) {
  return {
    id: row.id,
    debtId: row.debt_id,
    amount: Number(row.amount),
    paymentDate: row.payment_date,
    status: row.status,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function daysUntil(dateString: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(dateString);
  target.setHours(0, 0, 0, 0);

  const millisecondsInDay = 1000 * 60 * 60 * 24;
  const diff = Math.ceil((target.getTime() - today.getTime()) / millisecondsInDay);

  return Math.max(diff, 0);
}

export async function getDebtsForUser(
  userId: string,
  filters: { statusFilter?: string | null; directionFilter: string }
): Promise<ServiceResult<{ debts: any[] }>> {
  const today = new Date().toISOString().split("T")[0];

  await updateOverdueDebts(userId, filters.directionFilter, today);

  const debts = await getDebtsByUserAndDirection(
    userId,
    filters.directionFilter,
    filters.statusFilter
  );

  const debtIds = debts.map((debt: any) => debt.id);

  let nextPayments: any[] = [];
  if (debtIds.length > 0) {
    nextPayments = await getScheduledPaymentsForDebts(debtIds, today);
  }

  const nextPaymentMap: Record<string, string> = {};
  for (const payment of nextPayments) {
    if (!nextPaymentMap[payment.debt_id]) {
      nextPaymentMap[payment.debt_id] = payment.payment_date;
    }
  }

  const formatted = debts.map((debt: any) => ({
    ...formatDebt(debt),
    nextPaymentDate: nextPaymentMap[debt.id] || null,
  }));

  return {
    status: 200,
    body: { debts: formatted },
  };
}

export async function getSummary(
  userId: string
): Promise<
  ServiceResult<{
    total_i_owe: number;
    total_they_owe: number;
    net_balance: number;
    upcoming_dues: Array<{
      id: string;
      name: string;
      counterparty: string;
      direction: "i_owe" | "they_owe";
      deadline: string;
      remaining_amount: number;
      days_until_deadline: number;
    }>;
  }>
> {
  const { totalsByDirection, upcomingDues } = await findSummaryByUser(userId);

  let totalIOwe = 0;
  let totalTheyOwe = 0;

  for (const row of totalsByDirection as Array<{
    direction: "i_owe" | "they_owe";
    total_remaining: string | number | null;
  }>) {
    const value = Number(row.total_remaining || 0);
    if (row.direction === "i_owe") {
      totalIOwe += value;
    } else if (row.direction === "they_owe") {
      totalTheyOwe += value;
    }
  }

  const formattedUpcomingDues = (upcomingDues as Array<any>).map((row) => {
    const remainingAmount = Math.max(Number(row.total_amount) - Number(row.paid_amount), 0);

    return {
      id: row.id,
      name: row.name,
      counterparty: row.counterparty,
      direction: row.direction,
      deadline: row.deadline,
      remaining_amount: remainingAmount,
      days_until_deadline: daysUntil(row.deadline),
    };
  });

  return {
    status: 200,
    body: {
      total_i_owe: totalIOwe,
      total_they_owe: totalTheyOwe,
      net_balance: totalTheyOwe - totalIOwe,
      upcoming_dues: formattedUpcomingDues,
    },
  };
}

export async function createDebtForUser(
  userId: string,
  data: {
    name: string;
    purpose?: string | null;
    totalAmount: number;
    counterparty: string;
    startDate: string;
    deadline?: string | null;
    status?: "active" | "paid" | "overdue";
    paymentPeriod?: "weekly" | "monthly" | "custom";
    installmentAmount?: number | null;
    notes?: string | null;
    direction?: "i_owe" | "they_owe";
    // Backward compatibility for callers not yet migrated to installmentAmount.
    fixedInstallmentAmount?: number | null;
  }
): Promise<ServiceResult<{ debt: any }>> {
  let counterparty = await findCounterpartyByUserAndName(userId, data.counterparty);
  if (!counterparty) {
    counterparty = await createCounterparty({ user_id: userId, name: data.counterparty });
  }

  const debt = await createDebt({
    name: data.name,
    purpose: data.purpose || null,
    total_amount: data.totalAmount,
    paid_amount: 0,
    counterparty_id: counterparty.id,
    direction: data.direction || "i_owe",
    start_date: data.startDate,
    deadline: data.deadline || null,
    status: data.status || "active",
    payment_period: data.paymentPeriod || "monthly",
    installment_amount: data.installmentAmount ?? data.fixedInstallmentAmount ?? null,
    notes: data.notes || null,
    user_id: userId,
  });

  debt.counterparty = counterparty.name;

  return {
    status: 201,
    body: { debt: formatDebt(debt) },
  };
}

export async function getDebtForUserById(
  userId: string,
  id: string
): Promise<ServiceResult<{ error: string } | { debt: any }>> {
  const debt = await findDebtByIdWithCounterparty(id);

  if (!debt) {
    return { status: 404, body: { error: "Debt not found" } };
  }

  if (debt.user_id !== userId) {
    return { status: 403, body: { error: "Forbidden" } };
  }

  const payments = await getPaymentsByDebtId(id);

  const formattedPayments = payments.map((payment: any) => ({
    id: payment.id,
    debtId: payment.debt_id,
    amount: Number(payment.amount),
    paymentDate: payment.payment_date,
    status: payment.status,
    note: payment.note,
    createdAt: payment.created_at,
    updatedAt: payment.updated_at,
  }));

  return {
    status: 200,
    body: {
      debt: {
        ...formatDebt(debt),
        payments: formattedPayments,
      },
    },
  };
}

export async function updateDebtForUser(
  userId: string,
  id: string,
  data: {
    name?: string;
    purpose?: string | null;
    totalAmount?: number;
    counterparty?: string;
    startDate?: string;
    deadline?: string | null;
    status?: "active" | "paid" | "overdue";
    paymentPeriod?: "weekly" | "monthly" | "custom";
    installmentAmount?: number | null;
    direction?: "i_owe" | "they_owe";
    notes?: string | null;
    // Backward compatibility for callers not yet migrated to installmentAmount.
    fixedInstallmentAmount?: number | null;
  }
): Promise<ServiceResult<{ error: string } | { debt: any }>> {
  const debt = await findDebtById(id);

  if (!debt) {
    return { status: 404, body: { error: "Debt not found" } };
  }

  if (debt.user_id !== userId) {
    return { status: 403, body: { error: "Forbidden" } };
  }

  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.purpose !== undefined) updateData.purpose = data.purpose;
  if (data.startDate !== undefined) updateData.start_date = data.startDate;
  if (data.deadline !== undefined) updateData.deadline = data.deadline;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.paymentPeriod !== undefined) updateData.payment_period = data.paymentPeriod;
  if (data.installmentAmount !== undefined || data.fixedInstallmentAmount !== undefined) {
    updateData.installment_amount =
      data.installmentAmount !== undefined ? data.installmentAmount : data.fixedInstallmentAmount;
  }
  if (data.direction !== undefined) {
    updateData.direction = data.direction;
  }
  if (data.notes !== undefined) updateData.notes = data.notes;

  if (data.counterparty !== undefined) {
    let counterparty = await findCounterpartyByUserAndName(userId, data.counterparty);
    if (!counterparty) {
      counterparty = await createCounterparty({ user_id: userId, name: data.counterparty });
    }
    updateData.counterparty_id = counterparty.id;
  }

  if (data.totalAmount !== undefined) {
    updateData.total_amount = data.totalAmount;
  }

  if (Object.keys(updateData).length > 0) {
    await updateDebtById(id, updateData);
  }

  if (data.totalAmount !== undefined) {
    await recalcDebt(id);
  }

  const updated = await findDebtByIdWithCounterparty(id);

  return {
    status: 200,
    body: { debt: formatDebt(updated) },
  };
}

export async function deleteDebtForUser(
  userId: string,
  id: string
): Promise<ServiceResult<{ error: string } | { message: string }>> {
  const debt = await findDebtById(id);

  if (!debt) {
    return { status: 404, body: { error: "Debt not found" } };
  }

  if (debt.user_id !== userId) {
    return { status: 403, body: { error: "Forbidden" } };
  }

  await deleteDebtById(id);

  return {
    status: 200,
    body: { message: "Debt deleted" },
  };
}

export async function getDebtPaymentsForUser(
  userId: string,
  debtId: string
): Promise<ServiceResult<{ error: string } | { payments: any[] }>> {
  const debt = await findDebtById(debtId);

  if (!debt) {
    return { status: 404, body: { error: "Debt not found" } };
  }

  if (debt.user_id !== userId) {
    return { status: 403, body: { error: "Forbidden" } };
  }

  const payments = await getPaymentsByDebtId(debtId);

  return {
    status: 200,
    body: { payments: payments.map(formatPayment) },
  };
}

export async function createDebtPaymentForUser(
  userId: string,
  debtId: string,
  data: {
    amount: number;
    paymentDate: string;
    status?: "scheduled" | "paid" | "missed";
    note?: string | null;
  }
): Promise<ServiceResult<{ error: string } | { payment: any }>> {
  const debt = await findDebtById(debtId);

  if (!debt) {
    return { status: 404, body: { error: "Debt not found" } };
  }

  if (debt.user_id !== userId) {
    return { status: 403, body: { error: "Forbidden" } };
  }

  const payment = await createPayment({
    debt_id: debtId,
    amount: data.amount,
    payment_date: data.paymentDate,
    status: data.status || "scheduled",
    note: data.note || null,
  });

  await recalcDebt(debtId);

  return {
    status: 201,
    body: { payment: formatPayment(payment) },
  };
}

export async function getDebtPaymentForUser(
  userId: string,
  debtId: string,
  paymentId: string
): Promise<ServiceResult<{ error: string } | { payment: any }>> {
  const debt = await findDebtById(debtId);

  if (!debt || debt.user_id !== userId) {
    return { status: 404, body: { error: "Debt not found" } };
  }

  const payment = await findPaymentByIdAndDebtId(paymentId, debtId);

  if (!payment) {
    return { status: 404, body: { error: "Payment not found" } };
  }

  return {
    status: 200,
    body: { payment: formatPayment(payment) },
  };
}

export async function updateDebtPaymentForUser(
  userId: string,
  debtId: string,
  paymentId: string,
  data: {
    amount?: number;
    paymentDate?: string;
    status?: "scheduled" | "paid" | "missed";
    note?: string | null;
  }
): Promise<ServiceResult<{ error: string } | { payment: any }>> {
  const debt = await findDebtById(debtId);

  if (!debt || debt.user_id !== userId) {
    return { status: 404, body: { error: "Debt not found" } };
  }

  const payment = await findPaymentByIdAndDebtId(paymentId, debtId);

  if (!payment) {
    return { status: 404, body: { error: "Payment not found" } };
  }

  const updateData: Record<string, unknown> = {};
  if (data.amount !== undefined) updateData.amount = data.amount;
  if (data.paymentDate !== undefined) updateData.payment_date = data.paymentDate;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.note !== undefined) updateData.note = data.note;

  if (Object.keys(updateData).length > 0) {
    await updatePaymentById(paymentId, updateData);
  }

  await recalcDebt(debtId);

  const updated = await findPaymentById(paymentId);

  return {
    status: 200,
    body: { payment: formatPayment(updated) },
  };
}

export async function deleteDebtPaymentForUser(
  userId: string,
  debtId: string,
  paymentId: string
): Promise<ServiceResult<{ error: string } | { message: string }>> {
  const debt = await findDebtById(debtId);

  if (!debt || debt.user_id !== userId) {
    return { status: 404, body: { error: "Debt not found" } };
  }

  const payment = await findPaymentByIdAndDebtId(paymentId, debtId);

  if (!payment) {
    return { status: 404, body: { error: "Payment not found" } };
  }

  await deletePaymentById(paymentId);

  await recalcDebt(debtId);

  return {
    status: 200,
    body: { message: "Payment deleted" },
  };
}
