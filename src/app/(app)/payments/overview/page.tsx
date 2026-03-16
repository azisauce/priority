"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import PageHeader from "@/components/layout/page-header";
import PaymentList from "@/components/payments/PaymentList";
import AddPaymentModal from "@/components/modals/payments/AddPaymentModal";
import MarkAsPaidModal from "@/components/modals/payments/MarkAsPaidModal";
import ErrorState from "@/components/states/error-state";
import LoadingState from "@/components/states/loading-state";
import { usePayments } from "@/hooks/usePayments";
import { formatMonthYear } from "@/lib/utils";
import { useModalStore } from "@/stores/modalStore";
import type { CreateMonthlyPaymentInput, MonthSummary, MonthlyPayment } from "@/types/payment";

function getCurrentMonthStart() {
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    return monthStart.toISOString().slice(0, 10);
}

function toMonthStart(value: string) {
    const date = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) {
        return "";
    }

    const monthStart = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
    return monthStart.toISOString().slice(0, 10);
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
});

export default function PaymentsOverviewPage() {
    const router = useRouter();
    const currentMonth = useMemo(() => getCurrentMonthStart(), []);

    const { payments, loading, error, refetch, createPayment, markPaymentAsPaid, getMonthSummary } =
        usePayments();
    const { activeModal, openModal, closeModal } = useModalStore();

    const [summary, setSummary] = useState<MonthSummary | null>(null);
    const [summaryLoading, setSummaryLoading] = useState(true);
    const [summaryError, setSummaryError] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [selectedPayment, setSelectedPayment] = useState<MonthlyPayment | null>(null);
    const [markingPaymentId, setMarkingPaymentId] = useState<string | null>(null);
    const [optimisticPaidIds, setOptimisticPaidIds] = useState<string[]>([]);

    const incomePayments = useMemo(
        () => payments.filter((payment) => payment.type === "income"),
        [payments]
    );

    const expensePayments = useMemo(
        () => payments.filter((payment) => payment.type === "expense"),
        [payments]
    );

    const paidPaymentIds = useMemo(() => {
        const paidIds = new Set(optimisticPaidIds);

        for (const entry of summary?.entries ?? []) {
            if (entry.month === currentMonth && entry.isPaid) {
                paidIds.add(entry.monthlyPaymentId);
            }
        }

        return paidIds;
    }, [currentMonth, optimisticPaidIds, summary]);

    const loadSummary = useCallback(async () => {
        setSummaryLoading(true);
        setSummaryError(null);

        try {
            const monthSummary = await getMonthSummary(currentMonth);
            setSummary(monthSummary);
        } catch (loadError) {
            setSummaryError(
                loadError instanceof Error ? loadError.message : "Failed to load monthly summary."
            );
            setSummary(null);
        } finally {
            setSummaryLoading(false);
        }
    }, [currentMonth, getMonthSummary]);

    useEffect(() => {
        void loadSummary();
    }, [loadSummary]);

    const handleCreatePayment = async (data: CreateMonthlyPaymentInput) => {
        setActionError(null);
        await createPayment(data);
        await loadSummary();
    };

    const handleOpenMarkAsPaid = (payment: MonthlyPayment) => {
        setActionError(null);
        setSelectedPayment(payment);
        openModal("MARK_AS_PAID");
    };

    const handleCloseMarkAsPaid = () => {
        setSelectedPayment(null);
        closeModal();
    };

    const handleMarkAsPaid = async (paymentId: string, data: { month: string; amount: number }) => {
        setActionError(null);
        setMarkingPaymentId(paymentId);

        try {
            await markPaymentAsPaid(paymentId, data);

            if (toMonthStart(data.month) === currentMonth) {
                setOptimisticPaidIds((prev) => {
                    if (prev.includes(paymentId)) {
                        return prev;
                    }

                    return [...prev, paymentId];
                });
            }

            await Promise.all([refetch(), loadSummary()]);
        } catch (markError) {
            setActionError(markError instanceof Error ? markError.message : "Failed to mark as paid.");
            throw markError;
        } finally {
            setMarkingPaymentId(null);
        }
    };

    const totalIncome =
        summary?.totalIncome ??
        incomePayments.reduce((sum, payment) => sum + payment.defaultAmount, 0);

    const totalExpenses =
        summary?.totalExpenses ??
        expensePayments.reduce((sum, payment) => sum + payment.defaultAmount, 0);

    const net = summary?.net ?? totalIncome - totalExpenses;

    if (loading && summaryLoading) {
        return (
            <div className="space-y-6 py-4">
                <PageHeader
                    title="Payments Overview"
                    description="Track your recurring monthly income and expenses in one place."
                />
                <LoadingState variant="skeleton" count={4} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6 py-4">
                <PageHeader
                    title="Payments Overview"
                    description="Track your recurring monthly income and expenses in one place."
                />
                <ErrorState message={error} onRetry={() => void refetch()} />
            </div>
        );
    }

    return (
        <div className="space-y-6 py-4">
            <div className="flex items-center justify-between gap-3">
                <PageHeader
                    title="Payments Overview"
                    description="Track your recurring monthly income and expenses in one place."
                />
                <button
                    onClick={() => openModal("ADD_PAYMENT")}
                    className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Add Payment</span>
                    <span className="sm:hidden">Add</span>
                </button>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">Current Month</p>
                <p className="text-sm text-foreground">
                    {formatMonthYear(currentMonth)}
                </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground">Total Monthly Income</p>
                    <p className="text-xl font-semibold text-foreground">{currencyFormatter.format(totalIncome)}</p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground">Total Monthly Expenses</p>
                    <p className="text-xl font-semibold text-foreground">{currencyFormatter.format(totalExpenses)}</p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground">Net</p>
                    <p
                        className="text-xl font-semibold"
                        style={{
                            color:
                                net > 0
                                    ? "rgb(var(--m3-primary))"
                                    : net < 0
                                        ? "rgb(var(--m3-error))"
                                        : "rgb(var(--m3-on-surface))",
                        }}
                    >
                        {currencyFormatter.format(net)}
                    </p>
                </div>
            </div>

            {summaryError && (
                <p className="rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">{summaryError}</p>
            )}

            {actionError && (
                <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{actionError}</p>
            )}

            {payments.length === 0 ? (
                <PaymentList payments={[]} />
            ) : (
                <div className="space-y-6">
                    <section className="space-y-3">
                        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Income</h2>
                        {incomePayments.length === 0 ? (
                            <p className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
                                No income payments yet.
                            </p>
                        ) : (
                            <PaymentList
                                payments={incomePayments}
                                paidPaymentIds={paidPaymentIds}
                                onPaymentClick={(payment) => router.push(`/payments/${payment.id}`)}
                                onMarkAsPaid={(payment) => {
                                    if (!payment.isActive) return;
                                    handleOpenMarkAsPaid(payment);
                                }}
                                markingPaymentId={markingPaymentId}
                            />
                        )}
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Expenses</h2>
                        {expensePayments.length === 0 ? (
                            <p className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
                                No expense payments yet.
                            </p>
                        ) : (
                            <PaymentList
                                payments={expensePayments}
                                paidPaymentIds={paidPaymentIds}
                                onPaymentClick={(payment) => router.push(`/payments/${payment.id}`)}
                                onMarkAsPaid={(payment) => {
                                    if (!payment.isActive) return;
                                    handleOpenMarkAsPaid(payment);
                                }}
                                markingPaymentId={markingPaymentId}
                            />
                        )}
                    </section>
                </div>
            )}

            <AddPaymentModal
                open={activeModal === "ADD_PAYMENT"}
                onClose={closeModal}
                onSubmit={handleCreatePayment}
            />

            <MarkAsPaidModal
                open={activeModal === "MARK_AS_PAID"}
                payment={selectedPayment}
                onClose={handleCloseMarkAsPaid}
                onSubmit={handleMarkAsPaid}
            />
        </div>
    );
}
