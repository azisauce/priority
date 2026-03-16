import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUserId } from "@/server/services/auth.service";
import {
  deletePriorityParamForUser,
  getPriorityParamForUserById,
  updatePriorityParamForUser,
} from "@/server/services/priority-params.service";
import { updateParamSchema } from "@/server/validators/priority-params.validator";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const userId = await requireAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;

  const result = await getPriorityParamForUserById(userId, id);
  return NextResponse.json(result.body, { status: result.status });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const userId = await requireAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;

  const body = await request.json();
  const parsed = updateParamSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const result = await updatePriorityParamForUser(userId, id, parsed.data);
  return NextResponse.json(result.body, { status: result.status });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const userId = await requireAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;

  const result = await deletePriorityParamForUser(userId, id);
  return NextResponse.json(result.body, { status: result.status });
}
