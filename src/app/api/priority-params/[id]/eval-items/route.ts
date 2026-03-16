import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUserId } from "@/server/services/auth.service";
import {
  assignEvalItemToPriorityParam,
  getPriorityParamEvalItemsForUser,
  unassignEvalItemFromPriorityParam,
} from "@/server/services/priority-params.service";
import { assignParamEvalItemSchema } from "@/server/validators/priority-params.validator";

type RouteContext = { params: Promise<{ id: string }> };

// GET - list eval items assigned to this priority param
export async function GET(_request: NextRequest, context: RouteContext) {
  const userId = await requireAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;

  const result = await getPriorityParamEvalItemsForUser(userId, id);
  return NextResponse.json(result.body, { status: result.status });
}

// POST - assign an eval item to this priority param
export async function POST(request: NextRequest, context: RouteContext) {
  const userId = await requireAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;

  const body = await request.json();
  const parsed = assignParamEvalItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const result = await assignEvalItemToPriorityParam(userId, id, parsed.data.paramEvalItemId);
  return NextResponse.json(result.body, { status: result.status });
}

// DELETE - unassign an eval item from this priority param
export async function DELETE(request: NextRequest, context: RouteContext) {
  const userId = await requireAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;

  const { searchParams } = new URL(request.url);
  const paramEvalItemId = searchParams.get("paramEvalItemId");
  if (!paramEvalItemId) {
    return NextResponse.json({ error: "paramEvalItemId is required" }, { status: 400 });
  }

  const result = await unassignEvalItemFromPriorityParam(userId, id, paramEvalItemId);
  return NextResponse.json(result.body, { status: result.status });
}
