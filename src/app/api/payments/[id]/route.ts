import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { deletePayment, getPayment, updatePayment } from "@/server/services/monthly-payment.service";
import { UpdateMonthlyPaymentSchema } from "@/server/validators/monthly-payment.validator";

type RouteContext = { params: Promise<{ id: string }> };

async function getAuthenticatedUserId() {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const result = await getPayment(userId, id);

  return NextResponse.json(result.body, { status: result.status });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json();
  const parsed = UpdateMonthlyPaymentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const result = await updatePayment(userId, id, parsed.data);
  return NextResponse.json(result.body, { status: result.status });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const result = await deletePayment(userId, id);

  return NextResponse.json(result.body, { status: result.status });
}
