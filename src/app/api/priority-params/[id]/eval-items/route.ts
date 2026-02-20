import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import db from "@/lib/db";

const assignSchema = z.object({
  paramEvalItemId: z.string().min(1, "Eval item ID is required"),
});

type RouteContext = { params: Promise<{ id: string }> };

// GET - list eval items assigned to this priority param
export async function GET(_request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;

  const param = await db("priority_items").where({ id }).first();

  if (!param) {
    return NextResponse.json({ error: "Parameter not found" }, { status: 404 });
  }
  if (param.user_id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const evalItems = await db("priority_item_judgment_items")
    .where({ priority_item_id: id })
    .join("judgment_items", "priority_item_judgment_items.judgment_item_id", "judgment_items.id")
    .select("judgment_items.*", "priority_item_judgment_items.order")
    .orderBy("priority_item_judgment_items.order");

  return NextResponse.json({
    evalItems: evalItems.map(ei => ({
      id: ei.id,
      name: ei.name,
      description: ei.description,
      value: ei.value,
      userId: ei.user_id,
      createdAt: ei.created_at,
      updatedAt: ei.updated_at,
    })),
  });
}

// POST - assign an eval item to this priority param
export async function POST(request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const { id } = await context.params;

  const param = await db("priority_items").where({ id }).first();
  if (!param) {
    return NextResponse.json({ error: "Parameter not found" }, { status: 404 });
  }
  // Only user's own params can be modified (not generic ones)
  if (param.user_id !== userId) {
    return NextResponse.json({ error: "Forbidden - can only modify your own parameters" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = assignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const evalItem = await db("judgment_items")
    .where({ id: parsed.data.paramEvalItemId })
    .first();
  if (!evalItem) {
    return NextResponse.json({ error: "Eval item not found" }, { status: 404 });
  }
  // Allow user's own items or generic items (user_id is null)
  if (evalItem.user_id !== null && evalItem.user_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Check if already assigned
  const existing = await db("priority_item_judgment_items")
    .where({
      priority_item_id: id,
      judgment_item_id: parsed.data.paramEvalItemId,
    })
    .first();

  if (existing) {
    return NextResponse.json({ error: "Already assigned" }, { status: 409 });
  }

  // Get the max order for this priority item
  const maxOrder = await db("priority_item_judgment_items")
    .where({ priority_item_id: id })
    .max("order as max")
    .first();

  const newOrder = (maxOrder?.max || 0) + 1;

  await db("priority_item_judgment_items").insert({
    priority_item_id: id,
    judgment_item_id: parsed.data.paramEvalItemId,
    order: newOrder,
  });

  return NextResponse.json({ message: "Eval item assigned" }, { status: 201 });
}

// DELETE - unassign an eval item from this priority param
export async function DELETE(request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const { id } = await context.params;

  const param = await db("priority_items").where({ id }).first();
  if (!param) {
    return NextResponse.json({ error: "Parameter not found" }, { status: 404 });
  }
  // Only user's own params can be modified (not generic ones)
  if (param.user_id !== userId) {
    return NextResponse.json({ error: "Forbidden - can only modify your own parameters" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const paramEvalItemId = searchParams.get("paramEvalItemId");
  if (!paramEvalItemId) {
    return NextResponse.json({ error: "paramEvalItemId is required" }, { status: 400 });
  }

  const deleted = await db("priority_item_judgment_items")
    .where({
      priority_item_id: id,
      judgment_item_id: paramEvalItemId,
    })
    .del();

  if (deleted === 0) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }

  return NextResponse.json({ message: "Eval item unassigned" });
}
