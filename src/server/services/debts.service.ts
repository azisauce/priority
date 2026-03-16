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
  getDebtsByUserAndType,
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
    remainingBalance: Number(row.remaining_balance),
    counterparty: row.counterparty,
    type: row.type,
    startDate: row.start_date,
    deadline: row.deadline,
    status: row.status,
    paymentPeriod: row.payment_period,
    fixedInstallmentAmount:
      row.fixed_installment_amount != null ? Number(row.fixed_installment_amount) : null,
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

export async function getDebtsForUser(
  userId: string,
  filters: { statusFilter?: string | null; typeFilter: string }
): Promise<ServiceResult<{ debts: any[] }>> {
  const today = new Date().toISOString().split("T")[0];

  await updateOverdueDebts(userId, filters.typeFilter, today);

  const debts = await getDebtsByUserAndType(userId, filters.typeFilter, filters.statusFilter);

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
    fixedInstallmentAmount?: number | null;
    notes?: string | null;
    type?: "debt" | "asset";
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
    remaining_balance: data.totalAmount,
    counterparty_id: counterparty.id,
    type: data.type || "debt",
    start_date: data.startDate,
    deadline: data.deadline || null,
    status: data.status || "active",
    payment_period: data.paymentPeriod || "monthly",
    fixed_installment_amount: data.fixedInstallmentAmount ?? null,
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
    fixedInstallmentAmount?: number | null;
    notes?: string | null;
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
  if (data.fixedInstallmentAmount !== undefined) {
    updateData.fixed_installment_amount = data.fixedInstallmentAmount;
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
