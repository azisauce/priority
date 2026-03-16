import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUserId } from "@/server/services/auth.service";
import { createItemForUser, getItemsForUser } from "@/server/services/items.service";
import { createItemSchema } from "@/server/validators/items.validator";

export async function GET(request: NextRequest) {
  const userId = await requireAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get("groupId");
  const showDone = searchParams.get("showDone") || "done";
  const minPriority = searchParams.get("minPriority");
  const maxPriority = searchParams.get("maxPriority");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const sortBy = searchParams.get("sortBy") || "created_at";
  const sortOrder = searchParams.get("sortOrder") || "desc";

  const result = await getItemsForUser(userId, {
    groupId,
    showDone,
    minPriority,
    maxPriority,
    minPrice,
    maxPrice,
    sortBy,
    sortOrder,
  });

  return NextResponse.json(result.body, { status: result.status });
}

export async function POST(request: NextRequest) {
  const userId = await requireAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createItemSchema.safeParse(body);
  if (!parsed.success) {
    console.log("dafaq");

    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const result = await createItemForUser(userId, parsed.data);
  return NextResponse.json(result.body, { status: result.status });
}
