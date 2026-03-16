import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUserId } from "@/server/services/auth.service";
import { createExpense, listExpenses } from "@/server/services/expense.service";
import { CopyPreviousMonthSchema } from "@/server/validators/budgets.validator";
import { CreateExpenseSchema } from "@/server/validators/expenses.validator";

export async function GET(request: NextRequest) {
  const userId = await requireAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");

  const parsedMonth = CopyPreviousMonthSchema.safeParse({ month });
  if (!parsedMonth.success) {
    return NextResponse.json({ error: parsedMonth.error.flatten().fieldErrors }, { status: 400 });
  }

  const result = await listExpenses(userId, parsedMonth.data.month);
  return NextResponse.json(result.body, { status: result.status });
}

export async function POST(request: NextRequest) {
  const userId = await requireAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = CreateExpenseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const result = await createExpense(userId, parsed.data);
  return NextResponse.json(result.body, { status: result.status });
}
