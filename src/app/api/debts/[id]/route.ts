import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import db from "@/lib/db";
import { recalcDebt } from "@/lib/debt-utils";

const updateDebtSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  purpose: z.string().nullable().optional(),
  totalAmount: z.number().positive().optional(),
  counterparty: z.string().min(1).max(200).optional(),
  startDate: z.string().optional(),
  deadline: z.string().nullable().optional(),
  status: z.enum(["active", "paid", "overdue"]).optional(),
  paymentPeriod: z.enum(["weekly", "monthly", "custom"]).optional(),
  fixedInstallmentAmount: z.number().positive().nullable().optional(),
  notes: z.string().nullable().optional(),
});

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
    fixedInstallmentAmount: row.fixed_installment_amount != null ? Number(row.fixed_installment_amount) : null,
    notes: row.notes,
    userId: row.user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const { id } = await context.params;

  const debt = await db("debts")
    .join("counterparties", "debts.counterparty_id", "counterparties.id")
    .where("debts.id", id)
    .select("debts.*", "counterparties.name as counterparty")
    .first();

  if (!debt) {
    return NextResponse.json({ error: "Debt not found" }, { status: 404 });
  }
  if (debt.user_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch payment entries for this debt
  const payments = await db("payment_entries")
    .where({ debt_id: id })
    .orderBy("payment_date", "desc");

  const formattedPayments = payments.map((p: any) => ({
    id: p.id,
    debtId: p.debt_id,
    amount: Number(p.amount),
    paymentDate: p.payment_date,
    status: p.status,
    note: p.note,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  }));

  return NextResponse.json({
    debt: {
      ...formatDebt(debt),
      payments: formattedPayments,
    },
  });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const { id } = await context.params;

  const debt = await db("debts").where({ id }).first();
  if (!debt) {
    return NextResponse.json({ error: "Debt not found" }, { status: 404 });
  }
  if (debt.user_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = updateDebtSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.purpose !== undefined) updateData.purpose = parsed.data.purpose;
  if (parsed.data.startDate !== undefined) updateData.start_date = parsed.data.startDate;
  if (parsed.data.deadline !== undefined) updateData.deadline = parsed.data.deadline;
  if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
  if (parsed.data.paymentPeriod !== undefined) updateData.payment_period = parsed.data.paymentPeriod;
  if (parsed.data.fixedInstallmentAmount !== undefined) updateData.fixed_installment_amount = parsed.data.fixedInstallmentAmount;
  if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes;

  if (parsed.data.counterparty !== undefined) {
    let cpRow = await db("counterparties").where({ user_id: userId, name: parsed.data.counterparty }).first();
    if (!cpRow) {
      [cpRow] = await db("counterparties").insert({ user_id: userId, name: parsed.data.counterparty }).returning("*");
    }
    updateData.counterparty_id = cpRow.id;
  }

  // If totalAmount changes, recalculate remaining_balance
  if (parsed.data.totalAmount !== undefined) {
    updateData.total_amount = parsed.data.totalAmount;
  }

  if (Object.keys(updateData).length > 0) {
    await db("debts").where({ id }).update(updateData);
  }

  // Recalculate remaining_balance if totalAmount changed
  if (parsed.data.totalAmount !== undefined) {
    await recalcDebt(id);
  }

  const updated = await db("debts")
    .join("counterparties", "debts.counterparty_id", "counterparties.id")
    .where("debts.id", id)
    .select("debts.*", "counterparties.name as counterparty")
    .first();

  return NextResponse.json({ debt: formatDebt(updated) });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const { id } = await context.params;

  const debt = await db("debts").where({ id }).first();
  if (!debt) {
    return NextResponse.json({ error: "Debt not found" }, { status: 404 });
  }
  if (debt.user_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db("debts").where({ id }).del();

  return NextResponse.json({ message: "Debt deleted" });
}


