"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Plus } from "lucide-react";
import ExpenseList from "@/components/expenses/ExpenseList";
import PageHeader from "@/components/layout/page-header";
import AddExpenseModal from "@/components/modals/expenses/AddExpenseModal";
import ErrorState from "@/components/states/error-state";
import LoadingState from "@/components/states/loading-state";
import { useBudgets } from "@/hooks/useBudgets";
import { useExpenses } from "@/hooks/useExpenses";
import { formatMonthYear } from "@/lib/utils";
import { useModalStore } from "@/stores/modalStore";
import type { CreateExpenseInput } from "@/types/expense";

function getCurrentMonthStart() {
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    return monthStart.toISOString().slice(0, 10);
}

function monthStartToInputValue(month: string) {
    return month.slice(0, 7);
}

function inputValueToMonthStart(value: string) {
    return `${value}-01`;
}

export default function ExpensesDailyPage() {
    const [month, setMonth] = useState(getCurrentMonthStart);
    const [bannerWarning, setBannerWarning] = useState<string | null>(null);

    const { expenses, loading, error, refetch, createExpense } = useExpenses(month);
    const { budgets } = useBudgets(month);
    const { activeModal, openModal, closeModal } = useModalStore();

    const monthInputValue = useMemo(() => monthStartToInputValue(month), [month]);

    const handleCreateExpense = async (data: CreateExpenseInput) => {
        const result = await createExpense(data);
        if (result.warning === "budget_threshold_reached") {
            setBannerWarning("Warning: a budget has reached at least 80% of its allocation.");
        } else {
            setBannerWarning(null);
        }
    };

    return (
        <div className="space-y-6 py-4">
            <div className="flex items-center justify-between gap-3">
                <PageHeader
                    title="Daily Expenses"
                    description="Track daily spending grouped by day and tied to monthly budgets."
                />
                <button
                    onClick={() => openModal("ADD_EXPENSE")}
                    className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Add Expense</span>
                    <span className="sm:hidden">Add</span>
                </button>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-1">
                    <label className="text-xs text-muted-foreground" htmlFor="daily-month-selector">
                        Month
                    </label>
                    <input
                        id="daily-month-selector"
                        type="month"
                        value={monthInputValue}
                        onChange={(event) => {
                            if (!event.target.value) return;
                            setMonth(inputValueToMonthStart(event.target.value));
                            setBannerWarning(null);
                        }}
                        className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary/40"
                    />
                </div>

                <p className="text-sm text-muted-foreground">
                    {formatMonthYear(month)}
                </p>
            </div>

            {bannerWarning && (
                <div
                    className="flex items-start gap-2 rounded-xl px-3 py-2"
                    style={{
                        backgroundColor: "rgb(var(--m3-tertiary-container))",
                        color: "rgb(var(--m3-on-tertiary-container))",
                    }}
                >
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <p className="text-sm">{bannerWarning}</p>
                </div>
            )}

            {loading ? (
                <LoadingState variant="skeleton" count={4} />
            ) : error ? (
                <ErrorState message={error} onRetry={() => void refetch()} />
            ) : (
                <ExpenseList expenses={expenses} />
            )}

            <AddExpenseModal
                open={activeModal === "ADD_EXPENSE"}
                month={month}
                budgets={budgets}
                onClose={closeModal}
                onSubmit={handleCreateExpense}
            />
        </div>
    );
}
