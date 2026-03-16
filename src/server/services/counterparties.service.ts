/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  createCounterparty,
  deleteCounterpartyById,
  findCounterpartyById,
  findCounterpartyByIdAndUser,
  findCounterpartyByUserAndName,
  getCounterpartiesByUser,
  getCounterpartyRawBalances,
  getCounterpartyRecords,
  getPaymentsByDebtIds,
  updateCounterpartyNameById,
} from "@/server/repositories/counterparties.repository";

type ServiceResult<T> = {
  status: number;
  body: T;
};

export async function createCounterpartyForUser(
  userId: string,
  data: { name: string }
): Promise<ServiceResult<{ error: string } | { counterparty: { id: string; name: string; balance: number } }>> {
  const existing = await findCounterpartyByUserAndName(userId, data.name);

  if (existing) {
    return {
      status: 400,
      body: { error: "Counterparty already exists" },
    };
  }

  const counterparty = await createCounterparty({
    name: data.name,
    user_id: userId,
  });

  return {
    status: 201,
    body: {
      counterparty: {
        id: counterparty.id,
        name: counterparty.name,
        balance: 0,
      },
    },
  };
}

export async function updateCounterpartyForUser(
  userId: string,
  id: string,
  data: { name?: string }
): Promise<ServiceResult<{ error: string } | { counterparty: any }>> {
  const counterparty = await findCounterpartyById(id);

  if (!counterparty) {
    return { status: 404, body: { error: "Counterparty not found" } };
  }

  if (counterparty.user_id !== userId) {
    return { status: 403, body: { error: "Forbidden" } };
  }

  if (data.name && data.name !== counterparty.name) {
    const existing = await findCounterpartyByUserAndName(userId, data.name);
    if (existing) {
      return {
        status: 400,
        body: { error: "Counterparty with that name already exists" },
      };
    }

    await updateCounterpartyNameById(id, data.name);
  }

  const updated = await findCounterpartyById(id);

  return {
    status: 200,
    body: { counterparty: updated },
  };
}

export async function deleteCounterpartyForUser(
  userId: string,
  id: string
): Promise<ServiceResult<{ error: string } | { message: string }>> {
  const counterparty = await findCounterpartyById(id);

  if (!counterparty) {
    return { status: 404, body: { error: "Counterparty not found" } };
  }

  if (counterparty.user_id !== userId) {
    return { status: 403, body: { error: "Forbidden" } };
  }

  await deleteCounterpartyById(id);

  return {
    status: 200,
    body: { message: "Counterparty deleted" },
  };
}

export async function getCounterpartyRecordsForUser(
  userId: string,
  id: string
): Promise<ServiceResult<{ error: string } | { counterparty: any; records: any[]; payments: any[] }>> {
  const counterparty = await findCounterpartyByIdAndUser(id, userId);

  if (!counterparty) {
    return { status: 404, body: { error: "Counterparty not found" } };
  }

  const records = await getCounterpartyRecords(id, userId);

  const formattedRecords = records.map((row: any) => ({
    id: row.id,
    type: row.type,
    amount: Number(row.total_amount),
    totalAmount: Number(row.total_amount),
    remainingBalance: Number(row.remaining_balance),
    label: row.name,
    purpose: row.purpose,
    date: row.start_date,
    deadline: row.deadline,
    status: row.status,
    paymentPeriod: row.payment_period,
    fixedInstallmentAmount:
      row.fixed_installment_amount != null ? Number(row.fixed_installment_amount) : null,
    createdAt: row.created_at,
  }));

  let netBalance = 0;
  for (const record of formattedRecords) {
    if (record.type === "asset") {
      netBalance += record.remainingBalance;
    } else {
      netBalance -= record.remainingBalance;
    }
  }

  const recordIds = formattedRecords.map((record: any) => record.id);

  let formattedPayments: any[] = [];
  if (recordIds.length > 0) {
    const payments = await getPaymentsByDebtIds(recordIds);

    formattedPayments = payments.map((row: any) => ({
      id: row.id,
      debtId: row.debt_id,
      amount: Number(row.amount),
      paymentDate: row.payment_date,
      status: row.status,
      note: row.note,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  return {
    status: 200,
    body: {
      counterparty: {
        id: counterparty.id,
        name: counterparty.name,
        balance: netBalance,
      },
      records: formattedRecords,
      payments: formattedPayments,
    },
  };
}

export async function getCounterpartySummaryForUser(
  userId: string
): Promise<ServiceResult<{ counterparties: Array<{ id: string; name: string; balance: number }> }>> {
  const rawBalances = await getCounterpartyRawBalances(userId);
  const counterparties = await getCounterpartiesByUser(userId);

  const balancesMap: Record<string, { assets: number; debts: number }> = {};
  for (const row of rawBalances) {
    if (!balancesMap[row.counterparty_id]) {
      balancesMap[row.counterparty_id] = { assets: 0, debts: 0 };
    }

    if (row.type === "asset") {
      balancesMap[row.counterparty_id].assets += Number(row.total || 0);
    } else if (row.type === "debt") {
      balancesMap[row.counterparty_id].debts += Number(row.total || 0);
    }
  }

  const summary = counterparties.map((counterparty) => {
    const balances = balancesMap[counterparty.id] || { assets: 0, debts: 0 };

    return {
      id: counterparty.id,
      name: counterparty.name,
      balance: balances.assets - balances.debts,
    };
  });

  summary.sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));

  return {
    status: 200,
    body: { counterparties: summary },
  };
}
