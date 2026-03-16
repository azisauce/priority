import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUserId } from "@/server/services/auth.service";
import { createDebtForUser, getDebtsForUser } from "@/server/services/debts.service";
import { createDebtSchema } from "@/server/validators/debts.validator";

export async function GET(request: NextRequest) {
  const userId = await requireAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status");
  const typeFilter = searchParams.get("type") || "debt";

  const result = await getDebtsForUser(userId, { statusFilter, typeFilter });
  return NextResponse.json(result.body, { status: result.status });
}

export async function POST(request: NextRequest) {
  const userId = await requireAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createDebtSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const result = await createDebtForUser(userId, parsed.data);
  return NextResponse.json(result.body, { status: result.status });
}
