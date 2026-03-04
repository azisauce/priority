import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import db from "@/lib/db";
import { recalcDebt } from "@/lib/debt-utils";

const createPaymentSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  paymentDate: z.string().min(1, "Payment date is required"),
  status: z.enum(["scheduled", "paid", "missed"]).optional().default("scheduled"),
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

type RouteContext = { params: Promise<{ id: string }> };

// GET all payments for a debt
export async function GET(_request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const { id: debtId } = await context.params;

  // Verify debt ownership
  const debt = await db("debts").where({ id: debtId }).first();
  if (!debt) {
    return NextResponse.json({ error: "Debt not found" }, { status: 404 });
  }
  if (debt.user_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payments = await db("payment_entries")
    .where({ debt_id: debtId })
    .orderBy("payment_date", "desc");

  return NextResponse.json({ payments: payments.map(formatPayment) });
}

// POST create a new payment entry
export async function POST(request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const { id: debtId } = await context.params;

  // Verify debt ownership
  const debt = await db("debts").where({ id: debtId }).first();
  if (!debt) {
    return NextResponse.json({ error: "Debt not found" }, { status: 404 });
  }
  if (debt.user_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createPaymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { amount, paymentDate, status, note } = parsed.data;

  const [payment] = await db("payment_entries")
    .insert({
      debt_id: debtId,
      amount,
      payment_date: paymentDate,
      status: status || "scheduled",
      note: note || null,
    })
    .returning("*");

  // Recalculate remaining_balance and auto-status
  await recalcDebt(debtId);

  return NextResponse.json({ payment: formatPayment(payment) }, { status: 201 });
}
