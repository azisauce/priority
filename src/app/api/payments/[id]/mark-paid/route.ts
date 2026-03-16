import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { markAsPaid } from "@/server/services/monthly-payment.service";
import { MarkAsPaidSchema } from "@/server/validators/monthly-payment.validator";

type RouteContext = { params: Promise<{ id: string }> };

async function getAuthenticatedUserId() {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

export async function POST(request: NextRequest, context: RouteContext) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json();
  const parsed = MarkAsPaidSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const result = await markAsPaid(userId, id, parsed.data.month, parsed.data.amount);
  return NextResponse.json(result.body, { status: result.status });
}
