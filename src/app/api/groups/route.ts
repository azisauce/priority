import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUserId } from "@/server/services/auth.service";
import { createGroupForUser, getGroupsForUser } from "@/server/services/groups.service";
import { createGroupSchema } from "@/server/validators/groups.validator";

export async function GET() {
  const userId = await requireAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await getGroupsForUser(userId);
  return NextResponse.json(result.body, { status: result.status });
}

export async function POST(request: NextRequest) {
  const userId = await requireAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createGroupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const result = await createGroupForUser(userId, parsed.data);
  return NextResponse.json(result.body, { status: result.status });
}
