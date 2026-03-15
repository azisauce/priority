import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
    name: z.string().min(1).max(200).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
    const { id } = await context.params;

    const cp = await db("counterparties").where({ id }).first();
    if (!cp) {
        return NextResponse.json({ error: "Counterparty not found" }, { status: 404 });
    }
    if (cp.user_id !== userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    if (parsed.data.name && parsed.data.name !== cp.name) {
        const existing = await db("counterparties").where({ user_id: userId, name: parsed.data.name }).first();
        if (existing) {
            return NextResponse.json({ error: "Counterparty with that name already exists" }, { status: 400 });
        }
        await db("counterparties").where({ id }).update({ name: parsed.data.name });
    }

    const updated = await db("counterparties").where({ id }).first();
    return NextResponse.json({ counterparty: updated });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
    const { id } = await context.params;

    const cp = await db("counterparties").where({ id }).first();
    if (!cp) {
        return NextResponse.json({ error: "Counterparty not found" }, { status: 404 });
    }
    if (cp.user_id !== userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // records cascade delete because of schema FK setup
    await db("counterparties").where({ id }).del();

    return NextResponse.json({ message: "Counterparty deleted" });
}
