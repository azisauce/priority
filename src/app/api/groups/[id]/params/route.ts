import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import db from "@/lib/db";

const assignParamSchema = z.object({
  priorityParamId: z.string().min(1, "Priority param ID is required"),
});

type RouteContext = { params: Promise<{ id: string }> };

// GET - list priority params assigned to this group
export async function GET(_request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;

  const group = await db("groups").where({ id }).first();

  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }
  if (group.user_id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const priorityParams = await db("group_priority_items")
    .where({ group_id: id })
    .join("priority_items", "group_priority_items.priority_item_id", "priority_items.id")
    .select("priority_items.*", "group_priority_items.order")
    .orderBy("group_priority_items.order");

  // Get eval items for each param
  const paramsWithEvalItems = await Promise.all(
    priorityParams.map(async (param) => {
      const evalItems = await db("priority_item_judgment_items")
        .where({ priority_item_id: param.id })
        .join("judgment_items", "priority_item_judgment_items.judgment_item_id", "judgment_items.id")
        .where(function () {
          this.where({ "judgment_items.user_id": session.user.id }).orWhereNull("judgment_items.user_id");
        })
        .select(
          "judgment_items.*",
          "priority_item_judgment_items.order",
          "priority_item_judgment_items.id as junction_id"
        )
        .orderBy("priority_item_judgment_items.order");

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
      };
    })
  );

  return NextResponse.json({ params: paramsWithEvalItems });
}

// POST - assign a priority param to this group
export async function POST(request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const { id } = await context.params;

  console.log('id ==>', id);
  console.log('userId ==>', userId);
  

  const group = await db("groups").where({ id }).first();
  console.log('group ==>', group);

  if (!group || group.user_id != userId) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = assignParamSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  console.log('parsed===>', parsed);
  
  const param = await db("priority_items")
    .where({ id: parsed.data.priorityParamId })
    .first();
  console.log('param ==>', param);

  if (!param || (param.user_id && param.user_id != userId)) {
    return NextResponse.json({ error: "Priority param not found" }, { status: 404 });
  }

  // Check if already assigned
  const existing = await db("group_priority_items")
    .where({
      group_id: id,
      priority_item_id: parsed.data.priorityParamId,
    })
    .first();

  if (existing) {
    return NextResponse.json({ error: "Already assigned" }, { status: 409 });
  }

  // Get the max order for this group
  const maxOrder = await db("group_priority_items")
    .where({ group_id: id })
    .max("order as max")
    .first();

  const newOrder = (maxOrder?.max || 0) + 1;

  await db("group_priority_items").insert({
    group_id: id,
    priority_item_id: parsed.data.priorityParamId,
    order: newOrder,
  });

  return NextResponse.json({ message: "Param assigned to group" }, { status: 201 });
}

// DELETE - unassign a priority param from this group
export async function DELETE(request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const { id } = await context.params;

  const group = await db("groups").where({ id }).first();
  if (!group || group.user_id !== userId) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const priorityParamId = searchParams.get("priorityParamId");
  if (!priorityParamId) {
    return NextResponse.json({ error: "priorityParamId is required" }, { status: 400 });
  }

  const deleted = await db("group_priority_items")
    .where({
      group_id: id,
      priority_item_id: priorityParamId,
    })
    .del();

  if (deleted === 0) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }

  return NextResponse.json({ message: "Param unassigned from group" });
}
