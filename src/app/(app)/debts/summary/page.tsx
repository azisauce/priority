"use client";

import { AlertTriangle, Wallet } from "lucide-react";
import PageHeader from "@/components/layout/page-header";
import DebtSummaryCard from "@/components/debts/DebtSummaryCard";
import UpcomingDueItem from "@/components/debts/UpcomingDueItem";
import { useSummary } from "@/hooks/useDebts";

const formatCurrency = (amount: number): string =>
    new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(Math.abs(amount));

export default function DebtsSummaryPage() {
    const { summary, loading, error, refetch } = useSummary();

    const upcomingDues = [...summary.upcoming_dues].sort(
        (a, b) => new Date(a.payment_date).getTime() - new Date(b.payment_date).getTime()
    );

    return (
        <div className="space-y-6 py-4">
            <PageHeader
                title="Debts Summary"
                description="Track what you owe, what is owed to you, and what is due soon"
            />

            {loading ? (
                <div className="flex h-64 items-center justify-center rounded-xl border border-border bg-card">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
            ) : error ? (
                <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-center">
                    <AlertTriangle className="h-8 w-8 text-amber-500" />
                    <p className="text-sm text-muted-foreground">{error}</p>
                    <button
                        onClick={refetch}
                        className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                        Retry
                    </button>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <DebtSummaryCard
                            title="Total I Owe"
                            amount={summary.total_i_owe}
                            direction="i_owe"
                        />
                        <DebtSummaryCard
                            title="Total Owed To Me"
                            amount={summary.total_they_owe}
                            direction="they_owe"
                        />
                    </div>

                    <div className="rounded-2xl border border-border bg-card p-5">
                        <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                            <Wallet className="h-4 w-4" />
                            <span className="text-sm font-medium">Net Balance</span>
                        </div>
                        <p
                            className={`text-3xl font-semibold ${
                                summary.net_balance > 0
                                    ? "text-green-600 dark:text-green-400"
                                    : summary.net_balance < 0
                                        ? "text-red-600 dark:text-red-400"
                                        : "text-foreground"
                            }`}
                        >
                            {summary.net_balance > 0 ? "+" : summary.net_balance < 0 ? "-" : ""}
                            {formatCurrency(summary.net_balance)}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-border bg-card p-5">
                        <div className="mb-4">
                            <h2 className="text-base font-semibold text-foreground">Upcoming Dues (Next 30 Days)</h2>
                            <p className="text-sm text-muted-foreground">
                                Scheduled payments approaching soon, sorted by date.
                            </p>
                        </div>

                        {upcomingDues.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
                                No upcoming dues in the next 30 days.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {upcomingDues.map((due) => (
                                    <UpcomingDueItem key={due.id} due={due} />
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
