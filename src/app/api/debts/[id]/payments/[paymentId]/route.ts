import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import db from "@/lib/db";
import { recalcDebt } from "@/lib/debt-utils";

const updatePaymentSchema = z.object({
  amount: z.number().positive().optional(),
  paymentDate: z.string().optional(),
  status: z.enum(["scheduled", "paid", "missed"]).optional(),
  note: z.string().nullable().optional(),
});

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

type RouteContext = { params: Promise<{ id: string; paymentId: string }> };

// GET single payment
export async function GET(_request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const { id: debtId, paymentId } = await context.params;

  // Verify debt ownership
  const debt = await db("debts").where({ id: debtId }).first();
  if (!debt || debt.user_id !== userId) {
    return NextResponse.json({ error: "Debt not found" }, { status: 404 });
  }

  const payment = await db("payment_entries")
    .where({ id: paymentId, debt_id: debtId })
    .first();

  if (!payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  return NextResponse.json({ payment: formatPayment(payment) });
}

// PATCH update a payment
export async function PATCH(request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const { id: debtId, paymentId } = await context.params;

  // Verify debt ownership
  const debt = await db("debts").where({ id: debtId }).first();
  if (!debt || debt.user_id !== userId) {
    return NextResponse.json({ error: "Debt not found" }, { status: 404 });
  }

  const payment = await db("payment_entries")
    .where({ id: paymentId, debt_id: debtId })
    .first();

  if (!payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = updatePaymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.amount !== undefined) updateData.amount = parsed.data.amount;
  if (parsed.data.paymentDate !== undefined) updateData.payment_date = parsed.data.paymentDate;
  if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
  if (parsed.data.note !== undefined) updateData.note = parsed.data.note;

  if (Object.keys(updateData).length > 0) {
    await db("payment_entries").where({ id: paymentId }).update(updateData);
  }

  // Recalculate remaining_balance and auto-status
  await recalcDebt(debtId);

  const updated = await db("payment_entries").where({ id: paymentId }).first();
  return NextResponse.json({ payment: formatPayment(updated) });
}

// DELETE a payment
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const { id: debtId, paymentId } = await context.params;

  // Verify debt ownership
  const debt = await db("debts").where({ id: debtId }).first();
  if (!debt || debt.user_id !== userId) {
    return NextResponse.json({ error: "Debt not found" }, { status: 404 });
  }

  const payment = await db("payment_entries")
    .where({ id: paymentId, debt_id: debtId })
    .first();

  if (!payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  await db("payment_entries").where({ id: paymentId }).del();

  // Recalculate remaining_balance and auto-status
  await recalcDebt(debtId);

  return NextResponse.json({ message: "Payment deleted" });
}
