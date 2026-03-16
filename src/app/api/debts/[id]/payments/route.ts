import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUserId } from "@/server/services/auth.service";
import {
  createDebtPaymentForUser,
  getDebtPaymentsForUser,
} from "@/server/services/debts.service";
import { createPaymentSchema } from "@/server/validators/debts.validator";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const userId = await requireAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: debtId } = await context.params;
  const result = await getDebtPaymentsForUser(userId, debtId);

  return NextResponse.json(result.body, { status: result.status });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const userId = await requireAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: debtId } = await context.params;

  const body = await request.json();
  const parsed = createPaymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const result = await createDebtPaymentForUser(userId, debtId, parsed.data);
  return NextResponse.json(result.body, { status: result.status });
}
