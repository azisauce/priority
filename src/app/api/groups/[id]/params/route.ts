import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUserId } from "@/server/services/auth.service";
import {
  assignPriorityParamToGroup,
  getGroupPriorityParamsForUser,
  unassignPriorityParamFromGroup,
} from "@/server/services/groups.service";
import { assignPriorityParamSchema } from "@/server/validators/groups.validator";

type RouteContext = { params: Promise<{ id: string }> };

// GET - list priority params assigned to this group
export async function GET(_request: NextRequest, context: RouteContext) {
  const userId = await requireAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;

  const result = await getGroupPriorityParamsForUser(userId, id);
  return NextResponse.json(result.body, { status: result.status });
}

// POST - assign a priority param to this group
export async function POST(request: NextRequest, context: RouteContext) {
  const userId = await requireAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;

  const body = await request.json();
  const parsed = assignPriorityParamSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const result = await assignPriorityParamToGroup(userId, id, parsed.data.priorityParamId);
  return NextResponse.json(result.body, { status: result.status });
}

// DELETE - unassign a priority param from this group
export async function DELETE(request: NextRequest, context: RouteContext) {
  const userId = await requireAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;

  const { searchParams } = new URL(request.url);
  const priorityParamId = searchParams.get("priorityParamId");
  if (!priorityParamId) {
    return NextResponse.json({ error: "priorityParamId is required" }, { status: 400 });
  }

  const result = await unassignPriorityParamFromGroup(userId, id, priorityParamId);
  return NextResponse.json(result.body, { status: result.status });
}
