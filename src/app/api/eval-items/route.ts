import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import db from "@/lib/db";

const createEvalItemSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().optional(),
  value: z.number({ message: "Value is required" }).min(1, "Value must be at least 1").max(5, "Value must be at most 5"),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const evalItems = await db("judgment_items")
    .where({ user_id: session.user.id })
    .select("*")
    .orderBy("value", "asc");

  // Get param counts for each eval item
  const evalItemsWithCounts = await Promise.all(
    evalItems.map(async (item) => {
      const paramCount = await db("priority_item_judgment_items")
        .where({ judgment_item_id: item.id })
        .count("* as count")
        .first();

      return {
        id: item.id,
        name: item.name,
        description: item.description,
        value: item.value,
        userId: item.user_id,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        _count: { params: parseInt(paramCount?.count as string || "0") },
      };
    })
  );

  return NextResponse.json({ evalItems: evalItemsWithCounts });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const body = await request.json();
  const parsed = createEvalItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { name, description, value } = parsed.data;

  const [evalItem] = await db("judgment_items")
    .insert({
      name,
      description: description || null,
      value,
      user_id: userId,
    })
    .returning("*");

  return NextResponse.json({ 
    evalItem: {
      id: evalItem.id,
      name: evalItem.name,
      description: evalItem.description,
      value: evalItem.value,
      userId: evalItem.user_id,
      createdAt: evalItem.created_at,
      updatedAt: evalItem.updated_at,
      _count: { params: 0 },
    }
  }, { status: 201 });
}
