import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import db from "@/lib/db";

const createDebtSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  purpose: z.string().nullable().optional(),
  totalAmount: z.number().positive("Total amount must be positive"),
  counterparty: z.string().min(1, "Counterparty is required").max(200),
  startDate: z.string().min(1, "Start date is required"),
  deadline: z.string().nullable().optional(),
  status: z.enum(["active", "paid", "overdue"]).optional().default("active"),
  paymentPeriod: z.enum(["weekly", "monthly", "custom"]).optional().default("monthly"),
  fixedInstallmentAmount: z.number().positive().nullable().optional(),
  notes: z.string().nullable().optional(),
  type: z.enum(["debt", "asset"]).optional().default("debt"),
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

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status");
  const typeFilter = searchParams.get("type") || "debt";

  let query = db("debts").where("debts.user_id", userId).andWhere("debts.type", typeFilter);

  if (statusFilter && ["active", "paid", "overdue"].includes(statusFilter)) {
    query = query.andWhere("debts.status", statusFilter);
  }

  // Auto-update overdue debts: deadline < today && status != paid
  const today = new Date().toISOString().split("T")[0];
  await db("debts")
    .where("user_id", userId)
    .where("type", typeFilter)
    .whereNotNull("deadline")
    .where("deadline", "<", today)
    .whereNot("status", "paid")
    .update({ status: "overdue" });

  const debts = await query.orderBy("created_at", "desc");

  // For each debt, get the next scheduled payment date
  const debtIds = debts.map((d: any) => d.id);
  let nextPayments: any[] = [];
  if (debtIds.length > 0) {
    nextPayments = await db("payment_entries")
      .whereIn("debt_id", debtIds)
      .where("status", "scheduled")
      .where("payment_date", ">=", today)
      .orderBy("payment_date", "asc")
      .select("debt_id", "payment_date");
  }

  // Map: debt_id -> earliest upcoming payment_date
  const nextPaymentMap: Record<string, string> = {};
  for (const p of nextPayments) {
    if (!nextPaymentMap[p.debt_id]) {
      nextPaymentMap[p.debt_id] = p.payment_date;
    }
  }

  const formatted = debts.map((d: any) => ({
    ...formatDebt(d),
    nextPaymentDate: nextPaymentMap[d.id] || null,
  }));

  return NextResponse.json({ debts: formatted });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const body = await request.json();
  const parsed = createDebtSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const {
    name,
    purpose,
    totalAmount,
    counterparty,
    startDate,
    deadline,
    status,
    paymentPeriod,
    fixedInstallmentAmount,
    notes,
    type,
  } = parsed.data;

  const [debt] = await db("debts")
    .insert({
      name,
      purpose: purpose || null,
      total_amount: totalAmount,
      remaining_balance: totalAmount, // starts at full amount
      counterparty: counterparty,
      type: type,
      start_date: startDate,
      deadline: deadline || null,
      status: status || "active",
      payment_period: paymentPeriod || "monthly",
      fixed_installment_amount: fixedInstallmentAmount ?? null,
      notes: notes || null,
      user_id: userId,
    })
    .returning("*");

  return NextResponse.json({ debt: formatDebt(debt) }, { status: 201 });
}
