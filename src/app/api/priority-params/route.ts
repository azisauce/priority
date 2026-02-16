import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import db from "@/lib/db";

const createParamSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().optional(),
  weight: z.number().positive("Weight must be positive").max(10, "Weight must be at most 10"),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await db("priority_items")
    .where({ user_id: session.user.id })
    .select("*")
    .orderBy("created_at", "desc");

  // Get eval items (judgment items) and group counts for each param
  const paramsWithDetails = await Promise.all(
    params.map(async (param) => {
      const evalItems = await db("priority_item_judgment_items")
        .where({ priority_item_id: param.id })
        .join("judgment_items", "priority_item_judgment_items.judgment_item_id", "judgment_items.id")
        .select(
          "judgment_items.*",
          "priority_item_judgment_items.order",
          "priority_item_judgment_items.id as junction_id"
        )
        .orderBy("priority_item_judgment_items.order");

      const groupCount = await db("group_priority_items")
        .where({ priority_item_id: param.id })
        .count("* as count")
        .first();

      return {
        id: param.id,
        name: param.name,
        description: param.description,
        weight: param.weight,
        userId: param.user_id,
        createdAt: param.created_at,
        updatedAt: param.updated_at,
        evalItems: evalItems.map(ei => ({
          id: ei.junction_id,
          paramEvalItem: {
            id: ei.id,
            name: ei.name,
            description: ei.description,
            value: ei.value,
            userId: ei.user_id,
            createdAt: ei.created_at,
            updatedAt: ei.updated_at,
          }
        })),
        _count: { groups: parseInt(groupCount?.count as string || "0") },
      };
    })
  );

  return NextResponse.json({ params: paramsWithDetails });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const body = await request.json();
  const parsed = createParamSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { name, description, weight } = parsed.data;

  const existing = await db("priority_items")
    .where({ name, user_id: userId })
    .first();
    
  if (existing) {
    return NextResponse.json({ error: "Parameter name already exists" }, { status: 409 });
  }

  const [param] = await db("priority_items")
    .insert({
      name,
      description: description || null,
      weight,
      user_id: userId,
    })
    .returning("*");

  return NextResponse.json({ 
    param: {
      id: param.id,
      name: param.name,
      description: param.description,
      weight: param.weight,
      userId: param.user_id,
      createdAt: param.created_at,
      updatedAt: param.updated_at,
      evalItems: [],
      _count: { groups: 0 },
    }
  }, { status: 201 });
}
