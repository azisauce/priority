"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Copy, Plus } from "lucide-react";
import BudgetList from "@/components/expenses/BudgetList";
import ActionButton from "@/components/common/action-button";
import PageHeader from "@/components/layout/page-header";
import AddBudgetModal from "@/components/modals/expenses/AddBudgetModal";
import ErrorState from "@/components/states/error-state";
import LoadingState from "@/components/states/loading-state";
import { useBudgets } from "@/hooks/useBudgets";
import { useModalStore } from "@/stores/modalStore";
import type { CreateBudgetInput } from "@/types/budget";

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

const currencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
});

export default function ExpensesBudgetsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const monthFromQuery = searchParams.get("month");
    const [month, setMonth] = useState(monthFromQuery || getCurrentMonthStart());
    const [copying, setCopying] = useState(false);
    const [copyMessage, setCopyMessage] = useState<string | null>(null);

    const {
        budgets,
        loading,
        error,
        refetch,
        createBudget,
        copyPreviousMonth,
    } = useBudgets(month);

    const { activeModal, openModal, closeModal } = useModalStore();

    const monthInputValue = useMemo(() => monthStartToInputValue(month), [month]);

    const totalAllocated = useMemo(
        () => budgets.reduce((sum, budget) => sum + budget.totalAllocatedAmount, 0),
        [budgets]
    );

    const totalSpent = useMemo(
        () => budgets.reduce((sum, budget) => sum + budget.spentAmount, 0),
        [budgets]
    );

    const handleCreateBudget = async (data: CreateBudgetInput) => {
        await createBudget(data);
    };

    const handleCopyPrevious = async () => {
        setCopying(true);
        setCopyMessage(null);

        try {
            const copied = await copyPreviousMonth();
            setCopyMessage(
                copied.length > 0
                    ? `Copied ${copied.length} budget${copied.length > 1 ? "s" : ""} from previous month.`
                    : "No eligible budgets were copied from previous month."
            );
        } catch (copyError) {
            setCopyMessage(copyError instanceof Error ? copyError.message : "Failed to copy budgets.");
        } finally {
            setCopying(false);
        }
    };

    return (
        <div className="space-y-6 py-4">
            <PageHeader
                title="Budgets"
                description="Allocate monthly limits and monitor spending progress by category."
            />

            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-1">
                    <label className="text-xs text-muted-foreground" htmlFor="budget-month-selector">
                        Month
                    </label>
                    <input
                        id="budget-month-selector"
                        type="month"
                        value={monthInputValue}
                        onChange={(event) => {
                            if (!event.target.value) return;
                            setMonth(inputValueToMonthStart(event.target.value));
                            setCopyMessage(null);
                        }}
                        className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary/40"
                    />
                </div>

                <ActionButton
                    label={copying ? "Copying..." : "Copy from last month"}
                    variant="tonal"
                    icon={Copy}
                    onClick={() => void handleCopyPrevious()}
                    disabled={copying}
                />
            </div>

            {copyMessage && (
                <p className="rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">{copyMessage}</p>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground">Total Allocated</p>
                    <p className="text-xl font-semibold text-foreground">
                        {currencyFormatter.format(totalAllocated)}
                    </p>
                </div>

                <div className="rounded-2xl border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground">Total Spent</p>
                    <p className="text-xl font-semibold text-foreground">
                        {currencyFormatter.format(totalSpent)}
                    </p>
                </div>
            </div>

            {loading ? (
                <LoadingState variant="skeleton" count={4} />
            ) : error ? (
                <ErrorState message={error} onRetry={() => void refetch()} />
            ) : (
                <BudgetList
                    budgets={budgets}
                    onBudgetClick={(budget) => router.push(`/expenses/budgets/${budget.id}?month=${month}`)}
                />
            )}

            <button
                onClick={() => openModal("ADD_BUDGET")}
                className="fixed bottom-24 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition hover:opacity-90"
                style={{
                    backgroundColor: "rgb(var(--m3-primary))",
                    color: "rgb(var(--m3-on-primary))",
                }}
                aria-label="Add budget"
            >
                <Plus className="h-6 w-6" />
            </button>

            <AddBudgetModal
                open={activeModal === "ADD_BUDGET"}
                month={month}
                onClose={closeModal}
                onSubmit={handleCreateBudget}
            />
        </div>
    );
}
