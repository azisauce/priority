"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import ActionButton from "@/components/common/action-button";
import PageHeader from "@/components/layout/page-header";
import MarkAsPaidModal from "@/components/modals/payments/MarkAsPaidModal";
import PaymentHistoryRow from "@/components/payments/PaymentHistoryRow";
import ErrorState from "@/components/states/error-state";
import LoadingState from "@/components/states/loading-state";
import { usePayments } from "@/hooks/usePayments";
import { formatMonthYear } from "@/lib/utils";
import { useModalStore } from "@/stores/modalStore";
import type { MonthlyPayment } from "@/types/payment";

const currencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
});

export default function PaymentDetailPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();

    const { getPayment, markPaymentAsPaid } = usePayments();
    const { activeModal, openModal, closeModal } = useModalStore();

    const [payment, setPayment] = useState<MonthlyPayment | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [marking, setMarking] = useState(false);

    const paymentId = params.id;

    const sortedEntries = useMemo(
        () =>
            [...(payment?.entries ?? [])].sort((a, b) => {
                const monthDelta =
                    new Date(`${b.month}T00:00:00.000Z`).getTime() -
                    new Date(`${a.month}T00:00:00.000Z`).getTime();

                if (monthDelta !== 0) {
                    return monthDelta;
                }

                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }),
        [payment]
    );

    const loadPayment = useCallback(async () => {
        if (!paymentId) return;

        setLoading(true);
        setError(null);

        try {
            const payload = await getPayment(paymentId);
            if (!payload) {
                setError("Monthly payment not found.");
                setPayment(null);
                return;
            }

            setPayment(payload);
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : "Failed to load payment.");
            setPayment(null);
        } finally {
            setLoading(false);
        }
    }, [getPayment, paymentId]);

    useEffect(() => {
        void loadPayment();
    }, [loadPayment]);

    const handleMarkAsPaid = async (targetPaymentId: string, data: { month: string; amount: number }) => {
        setMarking(true);
        try {
            await markPaymentAsPaid(targetPaymentId, data);
            await loadPayment();
        } finally {
            setMarking(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6 py-4">
                <PageHeader title="Payment Detail" description="Inspect payment details and full month-by-month history." />
                <LoadingState variant="skeleton" count={4} />
            </div>
        );
    }

    if (error || !payment) {
        return (
            <div className="space-y-6 py-4">
                <PageHeader title="Payment Detail" description="Inspect payment details and full month-by-month history." />
                <ErrorState message={error ?? "Monthly payment not found."} onRetry={() => void loadPayment()} />
            </div>
        );
    }

    return (
        <div className="space-y-6 py-4">
            <div className="flex flex-wrap items-center gap-3">
                <ActionButton label="Back" variant="text" icon={ArrowLeft} onClick={() => router.back()} />
                <ActionButton
                    label={marking ? "Saving..." : "Mark as paid"}
                    variant="tonal"
                    icon={CheckCircle2}
                    onClick={() => openModal("MARK_AS_PAID")}
                    disabled={marking}
                />
            </div>

            <PageHeader
                title={payment.name}
                description="Inspect payment details and full month-by-month history."
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-2xl border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground">Category</p>
                    <p className="text-sm font-medium text-foreground">{payment.category || "Uncategorized"}</p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground">Type</p>
                    <p className="text-sm font-medium text-foreground">
                        {payment.type === "income" ? "Income" : "Expense"}
                    </p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="text-sm font-medium text-foreground">{payment.isActive ? "Active" : "Ended"}</p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground">Default Amount</p>
                    <p className="text-sm font-medium text-foreground">
                        {currencyFormatter.format(payment.defaultAmount)}
                    </p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground">Day of Month</p>
                    <p className="text-sm font-medium text-foreground">{payment.dayOfMonth}</p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground">Variable Amount</p>
                    <p className="text-sm font-medium text-foreground">{payment.isVariable ? "Yes" : "No"}</p>
                </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
                Starts {formatMonthYear(payment.startMonth)}
                {payment.endMonth
                    ? ` • Ends ${formatMonthYear(payment.endMonth)}`
                    : " • No end date"}
            </div>

            <div className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="border-b border-border/50 px-4 py-3">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">History</h2>
                </div>

                {sortedEntries.length === 0 ? (
                    <p className="px-4 py-6 text-sm text-muted-foreground">No payment entries yet.</p>
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
                                {sortedEntries.map((entry) => (
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

            <MarkAsPaidModal
                open={activeModal === "MARK_AS_PAID"}
                payment={payment}
                onClose={closeModal}
                onSubmit={handleMarkAsPaid}
            />
        </div>
    );
}
