import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUserId } from "@/server/services/auth.service";
import {
  createEvalItemForUser,
  getEvalItems,
} from "@/server/services/eval-items.service";
import { createEvalItemSchema } from "@/server/validators/eval-items.validator";

export async function GET() {
  const userId = await requireAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await getEvalItems(userId);
  return NextResponse.json(result.body, { status: result.status });
}

export async function POST(request: NextRequest) {
  const userId = await requireAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createEvalItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const result = await createEvalItemForUser(userId, parsed.data);
  return NextResponse.json(result.body, { status: result.status });
}
