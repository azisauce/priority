import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUserId } from "@/server/services/auth.service";
import { getProfileForUser, updateProfileForUser } from "@/server/services/profile.service";
import { updateProfileSchema } from "@/server/validators/profile.validator";

export async function GET() {
  const userId = await requireAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await getProfileForUser(userId);
  return NextResponse.json(result.body, { status: result.status });
}

export async function PATCH(request: NextRequest) {
  const userId = await requireAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const result = await updateProfileForUser(userId, parsed.data);
  return NextResponse.json(result.body, { status: result.status });
}
