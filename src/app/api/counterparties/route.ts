import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";
import { z } from "zod";

const createCounterpartySchema = z.object({
    name: z.string().min(1, "Name is required").max(200),
});

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await request.json();
    const parsed = createCounterpartySchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { name } = parsed.data;

    // Check if counterparty exists
    const existing = await db("counterparties").where({ user_id: userId, name }).first();
    if (existing) {
        return NextResponse.json({ error: "Counterparty already exists" }, { status: 400 });
    }

    const [counterparty] = await db("counterparties")
        .insert({
            name,
            user_id: userId,
        })
        .returning("*");

    return NextResponse.json({ counterparty: { id: counterparty.id, name: counterparty.name, balance: 0 } }, { status: 201 });
}
