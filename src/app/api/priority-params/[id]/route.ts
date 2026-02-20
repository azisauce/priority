import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import db from "@/lib/db";

const updateParamSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  weight: z.number().int().min(1).max(10).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

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

  // Get eval items
  const evalItems = await db("priority_item_judgment_items")
    .where({ priority_item_id: id })
    .join("judgment_items", "priority_item_judgment_items.judgment_item_id", "judgment_items.id")
    .select(
      "judgment_items.*",
      "priority_item_judgment_items.order",
      "priority_item_judgment_items.id as junction_id"
    )
    .orderBy("priority_item_judgment_items.order");

  // Get groups
  const groups = await db("group_priority_items")
    .where({ priority_item_id: id })
    .join("groups", "group_priority_items.group_id", "groups.id")
    .select(
      "groups.*",
      "group_priority_items.id as junction_id"
    );

  return NextResponse.json({ 
    param: {
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
      groups: groups.map(g => ({
        id: g.junction_id,
        group: {
          id: g.id,
          groupName: g.name,
          description: g.description,
          userId: g.user_id,
          createdAt: g.created_at,
          updatedAt: g.updated_at,
        }
      })),
    }
  });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
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
  if (param.user_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = updateParamSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { name, description, weight } = parsed.data;

  if (name && name !== param.name) {
    const existing = await db("priority_items")
      .where({ name, user_id: userId })
      .whereNot({ id })
      .first();
    if (existing) {
      return NextResponse.json({ error: "Parameter name already exists" }, { status: 409 });
    }
  }

  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (weight !== undefined) updateData.weight = weight;

  const [updated] = await db("priority_items")
    .where({ id })
    .update(updateData)
    .returning("*");

  // Get eval items count
  const evalItems = await db("priority_item_judgment_items")
    .where({ priority_item_id: id })
    .join("judgment_items", "priority_item_judgment_items.judgment_item_id", "judgment_items.id")
    .select(
      "judgment_items.*",
      "priority_item_judgment_items.order",
      "priority_item_judgment_items.id as junction_id"
    )
    .orderBy("priority_item_judgment_items.order");

  const groupCount = await db("group_priority_items")
    .where({ priority_item_id: id })
    .count("* as count")
    .first();

  return NextResponse.json({ 
    param: {
      id: updated.id,
      name: updated.name,
      description: updated.description,
      weight: updated.weight,
      userId: updated.user_id,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
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
    }
  });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
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

  await db("priority_items").where({ id }).del();

  return NextResponse.json({ message: "Parameter deleted" });
}
