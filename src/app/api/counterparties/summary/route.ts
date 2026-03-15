import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    // We want to return all counterparties for this user, with their net balance.
    // Net balance = sum(assets) - sum(debts)
    // We can group by counterparty_id and calculate the sum.

    const rawBalances = await db("debts")
        .where("debts.user_id", userId)
        .select("debts.counterparty_id", "debts.type")
        .sum("debts.remaining_balance as total")
        .groupBy("debts.counterparty_id", "debts.type");

    const counterparties = await db("counterparties")
        .where("user_id", userId)
        .select("id", "name");

    // Map balances
    const balancesMap: Record<string, { assets: number, debts: number }> = {};
    for (const row of rawBalances) {
        if (!balancesMap[row.counterparty_id]) {
            balancesMap[row.counterparty_id] = { assets: 0, debts: 0 };
        }
        if (row.type === "asset") {
            balancesMap[row.counterparty_id].assets += Number(row.total || 0);
        } else if (row.type === "debt") {
            balancesMap[row.counterparty_id].debts += Number(row.total || 0);
        }
    }

    const summary = counterparties.map(cp => {
        const b = balancesMap[cp.id] || { assets: 0, debts: 0 };
        return {
            id: cp.id,
            name: cp.name,
            balance: b.assets - b.debts
        };
    });

    // Sort by absolute balance descending (biggest relationships first)
    summary.sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));

    return NextResponse.json({ counterparties: summary });
}
