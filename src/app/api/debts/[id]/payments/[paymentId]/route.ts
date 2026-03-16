import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUserId } from "@/server/services/auth.service";
import {
  deleteDebtPaymentForUser,
  getDebtPaymentForUser,
  updateDebtPaymentForUser,
} from "@/server/services/debts.service";
import { updatePaymentSchema } from "@/server/validators/debts.validator";

type RouteContext = { params: Promise<{ id: string; paymentId: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const userId = await requireAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: debtId, paymentId } = await context.params;
  const result = await getDebtPaymentForUser(userId, debtId, paymentId);

  return NextResponse.json(result.body, { status: result.status });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const userId = await requireAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: debtId, paymentId } = await context.params;

  const body = await request.json();
  const parsed = updatePaymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const result = await updateDebtPaymentForUser(userId, debtId, paymentId, parsed.data);
  return NextResponse.json(result.body, { status: result.status });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const userId = await requireAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: debtId, paymentId } = await context.params;
  const result = await deleteDebtPaymentForUser(userId, debtId, paymentId);

  return NextResponse.json(result.body, { status: result.status });
}
