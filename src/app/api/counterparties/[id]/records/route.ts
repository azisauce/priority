import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
    const { id } = await context.params;

    const counterparty = await db("counterparties").where({ id, user_id: userId }).first();
    if (!counterparty) {
        return NextResponse.json({ error: "Counterparty not found" }, { status: 404 });
    }

    const records = await db("debts")
        .where({ counterparty_id: id, user_id: userId })
        .orderBy("created_at", "desc");

    const formattedRecords = records.map((row: any) => ({
        id: row.id,
        type: row.type,
        amount: Number(row.total_amount), // Keep for backward compatibility
        totalAmount: Number(row.total_amount),
        remainingBalance: Number(row.remaining_balance),
        label: row.name,
        purpose: row.purpose,
        date: row.start_date,
        deadline: row.deadline,
        status: row.status,
        paymentPeriod: row.payment_period,
        fixedInstallmentAmount: row.fixed_installment_amount != null ? Number(row.fixed_installment_amount) : null,
        createdAt: row.created_at,
    }));

    // Calculate net balance
    let netBalance = 0;
    for (const r of formattedRecords) {
        if (r.type === "asset") {
            netBalance += r.remainingBalance;
        } else {
            netBalance -= r.remainingBalance;
        }
    }

    // Fetch associated payment entries
    const recordIds = formattedRecords.map((r: any) => r.id);
    let formattedPayments: any[] = [];
    if (recordIds.length > 0) {
        const payments = await db("payment_entries")
            .whereIn("debt_id", recordIds)
            .orderBy("payment_date", "desc");

        formattedPayments = payments.map((row: any) => ({
            id: row.id,
            debtId: row.debt_id,
            amount: Number(row.amount),
            paymentDate: row.payment_date,
            status: row.status,
            note: row.note,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        }));
    }

    return NextResponse.json({
        counterparty: {
            id: counterparty.id,
            name: counterparty.name,
            balance: netBalance,
        },
        records: formattedRecords,
        payments: formattedPayments,
    });
}
