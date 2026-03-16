import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUserId } from "@/server/services/auth.service";
import { deleteBudget, getBudget, updateBudget } from "@/server/services/budget.service";
import { CopyPreviousMonthSchema, UpdateBudgetSchema } from "@/server/validators/budgets.validator";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const userId = await requireAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");

  if (month) {
    const parsedMonth = CopyPreviousMonthSchema.safeParse({ month });
    if (!parsedMonth.success) {
      return NextResponse.json(
        { error: parsedMonth.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const result = await getBudget(userId, id, parsedMonth.data.month);
    return NextResponse.json(result.body, { status: result.status });
  }

  const result = await getBudget(userId, id);
  return NextResponse.json(result.body, { status: result.status });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const userId = await requireAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const body = await request.json();
  const parsed = UpdateBudgetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const result = await updateBudget(userId, id, parsed.data);
  return NextResponse.json(result.body, { status: result.status });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const userId = await requireAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const result = await deleteBudget(userId, id);
  return NextResponse.json(result.body, { status: result.status });
}
