import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { getMonthSummary } from "@/server/services/monthly-payment.service";

const MonthSummaryQuerySchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Month must be in YYYY-MM-DD format")
    .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`)), {
      message: "Invalid month",
    }),
});

async function getAuthenticatedUserId() {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

export async function GET(request: NextRequest) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = MonthSummaryQuerySchema.safeParse({ month: searchParams.get("month") });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const result = await getMonthSummary(userId, parsed.data.month);
  return NextResponse.json(result.body, { status: result.status });
}
