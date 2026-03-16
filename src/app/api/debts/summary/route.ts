import { NextResponse } from "next/server";
import { requireAuthenticatedUserId } from "@/server/services/auth.service";
import { getSummary } from "@/server/services/debts.service";

export async function GET() {
  const userId = await requireAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await getSummary(userId);
  return NextResponse.json(result.body, { status: result.status });
}
