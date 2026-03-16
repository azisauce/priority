import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUserId } from "@/server/services/auth.service";
import { getBudget } from "@/server/services/budget.service";
import { CopyPreviousMonthSchema } from "@/server/validators/budgets.validator";

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
    if ("error" in result.body) {
      return NextResponse.json(result.body, { status: result.status });
    }

    return NextResponse.json({ expenses: result.body.expenses }, { status: result.status });
  }

  const result = await getBudget(userId, id);
  if ("error" in result.body) {
    return NextResponse.json(result.body, { status: result.status });
  }

  return NextResponse.json({ expenses: result.body.expenses }, { status: result.status });
}
