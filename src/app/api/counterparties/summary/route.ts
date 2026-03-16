import { NextResponse } from "next/server";
import { requireAuthenticatedUserId } from "@/server/services/auth.service";
import { getCounterpartySummaryForUser } from "@/server/services/counterparties.service";

export async function GET() {
  const userId = await requireAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await getCounterpartySummaryForUser(userId);
  return NextResponse.json(result.body, { status: result.status });
}
