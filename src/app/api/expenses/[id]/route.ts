import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUserId } from "@/server/services/auth.service";
import { deleteExpense, getExpense, updateExpense } from "@/server/services/expense.service";
import { UpdateExpenseSchema } from "@/server/validators/expenses.validator";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const userId = await requireAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const result = await getExpense(userId, id);
  return NextResponse.json(result.body, { status: result.status });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const userId = await requireAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const body = await request.json();
  const parsed = UpdateExpenseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const result = await updateExpense(userId, id, parsed.data);
  return NextResponse.json(result.body, { status: result.status });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const userId = await requireAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const result = await deleteExpense(userId, id);

  return NextResponse.json(result.body, { status: result.status });
}
