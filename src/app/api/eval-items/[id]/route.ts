import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import db from "@/lib/db";

const updateEvalItemSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  value: z.number().min(1).max(5).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;

  const evalItem = await db("judgment_items").where({ id }).first();
  if (!evalItem) {
    return NextResponse.json({ error: "Eval item not found" }, { status: 404 });
  }
  if (evalItem.user_id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = updateEvalItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
  if (parsed.data.value !== undefined) updateData.value = parsed.data.value;

  const [updated] = await db("judgment_items")
    .where({ id })
    .update(updateData)
    .returning("*");

  const paramCount = await db("priority_item_judgment_items")
    .where({ judgment_item_id: id })
    .count("* as count")
    .first();

  return NextResponse.json({ 
    evalItem: {
      id: updated.id,
      name: updated.name,
      description: updated.description,
      value: updated.value,
      userId: updated.user_id,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
      _count: { params: parseInt(paramCount?.count as string || "0") },
    }
  });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;

  const evalItem = await db("judgment_items").where({ id }).first();
  if (!evalItem) {
    return NextResponse.json({ error: "Eval item not found" }, { status: 404 });
  }
  if (evalItem.user_id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db("judgment_items").where({ id }).del();

  return NextResponse.json({ message: "Eval item deleted" });
}
