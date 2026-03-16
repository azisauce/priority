import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUserId } from "@/server/services/auth.service";
import { copyPreviousMonth } from "@/server/services/budget.service";
import { CopyPreviousMonthSchema } from "@/server/validators/budgets.validator";

export async function POST(request: NextRequest) {
  const userId = await requireAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = CopyPreviousMonthSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const result = await copyPreviousMonth(userId, parsed.data.month);
  return NextResponse.json(result.body, { status: result.status });
}
