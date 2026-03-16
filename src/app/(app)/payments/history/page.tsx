"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import PageHeader from "@/components/layout/page-header";
import PaymentCard from "@/components/payments/PaymentCard";
import PaymentHistoryRow from "@/components/payments/PaymentHistoryRow";
import ErrorState from "@/components/states/error-state";
import LoadingState from "@/components/states/loading-state";
import { usePayments } from "@/hooks/usePayments";
import type { MonthlyPaymentEntry } from "@/types/payment";

export default function PaymentsHistoryPage() {
    const { payments, loading, error, refetch, getPayment } = usePayments();

    const [expandedPaymentId, setExpandedPaymentId] = useState<string | null>(null);
    const [entriesByPaymentId, setEntriesByPaymentId] = useState<Record<string, MonthlyPaymentEntry[]>>(
        {}
    );
    const [loadingHistoryPaymentId, setLoadingHistoryPaymentId] = useState<string | null>(null);
    const [historyError, setHistoryError] = useState<string | null>(null);

    const sortedPayments = useMemo(
        () =>
            [...payments].sort((a, b) => {
                if (a.type !== b.type) {
                    return a.type.localeCompare(b.type);
                }
                if (a.dayOfMonth !== b.dayOfMonth) {
                    return a.dayOfMonth - b.dayOfMonth;
                }
                return a.name.localeCompare(b.name);
            }),
        [payments]
    );

    const handleToggleHistory = async (paymentId: string) => {
        setHistoryError(null);

        if (expandedPaymentId === paymentId) {
            setExpandedPaymentId(null);
            return;
        }

        setExpandedPaymentId(paymentId);

        if (entriesByPaymentId[paymentId]) {
            return;
        }

        setLoadingHistoryPaymentId(paymentId);
        try {
            const payment = await getPayment(paymentId);
            setEntriesByPaymentId((prev) => ({
                ...prev,
                [paymentId]: payment?.entries ?? [],
            }));
        } catch (loadError) {
            setHistoryError(loadError instanceof Error ? loadError.message : "Failed to load payment history.");
        } finally {
            setLoadingHistoryPaymentId(null);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6 py-4">
                <PageHeader
                    title="Payment History"
                    description="Review paid and pending records for each recurring payment."
                />
                <LoadingState variant="skeleton" count={4} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6 py-4">
                <PageHeader
                    title="Payment History"
                    description="Review paid and pending records for each recurring payment."
                />
                <ErrorState message={error} onRetry={() => void refetch()} />
            </div>
        );
    }

    return (
        <div className="space-y-6 py-4">
            <PageHeader
                title="Payment History"
                description="Review paid and pending records for each recurring payment."
            />

            {historyError && (
                <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{historyError}</p>
            )}

            <div className="space-y-4">
                {sortedPayments.map((payment) => {
                    const isExpanded = expandedPaymentId === payment.id;
                    const entries = entriesByPaymentId[payment.id] ?? [];
                    const isLoadingHistory = loadingHistoryPaymentId === payment.id;

                    return (
                        <section key={payment.id} className="space-y-2">
                            <div className="rounded-2xl border border-border bg-card p-2">
                                <button
                                    type="button"
                                    onClick={() => void handleToggleHistory(payment.id)}
                                    className="flex w-full items-center justify-between gap-3 rounded-xl px-2 py-1 text-left"
                                >
                                    <div className="min-w-0 flex-1">
                                        <PaymentCard payment={payment} />
                                    </div>
                                    <span className="shrink-0 text-muted-foreground">
                                        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                                    </span>
                                </button>
                            </div>

                            {isExpanded && (
                                <div className="overflow-hidden rounded-2xl border border-border bg-card">
                                    {isLoadingHistory ? (
                                        <LoadingState message="Loading history..." />
                                    ) : entries.length === 0 ? (
                                        <p className="px-4 py-6 text-sm text-muted-foreground">No history entries yet.</p>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead className="bg-muted/40">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                            Month
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                            Expected
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                            Actual Paid
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                            Status
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {entries.map((entry) => (
                                                        <PaymentHistoryRow
                                                            key={entry.id}
                                                            entry={{
                                                                id: entry.id,
                                                                month: entry.month,
                                                                expectedAmount: entry.expectedAmount,
                                                                actualPaid: entry.actualPaid,
                                                                isPaid: entry.isPaid,
                                                            }}
                                                        />
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}
                        </section>
                    );
                })}

                {sortedPayments.length === 0 && (
                    <p className="rounded-2xl border border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground">
                        No monthly payments found.
                    </p>
                )}
            </div>
        </div>
    );
}
