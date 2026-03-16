"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import ActionButton from "@/components/common/action-button";
import BudgetCard from "@/components/expenses/BudgetCard";
import ExpenseList from "@/components/expenses/ExpenseList";
import PageHeader from "@/components/layout/page-header";
import ErrorState from "@/components/states/error-state";
import LoadingState from "@/components/states/loading-state";
import type { BudgetDetailResponse } from "@/types/budget";
import type { Budget } from "@/types/budget";
import type { Expense } from "@/types/expense";

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

export default function BudgetDetailPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const searchParams = useSearchParams();

    const initialMonth = searchParams.get("month") || getCurrentMonthStart();

    const [month, setMonth] = useState(initialMonth);
    const [budget, setBudget] = useState<Budget | null>(null);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const monthInputValue = useMemo(() => monthStartToInputValue(month), [month]);

    const fetchBudgetDetail = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/budgets/${params.id}?month=${month}`);
            const payload = (await response.json()) as BudgetDetailResponse;

            if (!response.ok) {
                throw new Error(
                    typeof payload.error === "string" ? payload.error : "Failed to load budget details"
                );
            }

            setBudget(payload.budget ?? null);
            setExpenses(payload.expenses ?? []);
        } catch (fetchError) {
            setError(
                fetchError instanceof Error ? fetchError.message : "Failed to load budget details"
            );
            setBudget(null);
            setExpenses([]);
        } finally {
            setLoading(false);
        }
    }, [month, params.id]);

    useEffect(() => {
        void fetchBudgetDetail();
    }, [fetchBudgetDetail]);

    return (
        <div className="space-y-6 py-4">
            <PageHeader
                title="Budget Detail"
                description="View all expenses recorded under this budget for the selected month."
            />

            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-end sm:justify-between">
                <ActionButton
                    label="Back to Budgets"
                    variant="text"
                    icon={ArrowLeft}
                    onClick={() => router.push(`/expenses/budgets?month=${month}`)}
                />

                <div className="space-y-1">
                    <label className="text-xs text-muted-foreground" htmlFor="budget-detail-month-selector">
                        Month
                    </label>
                    <input
                        id="budget-detail-month-selector"
                        type="month"
                        value={monthInputValue}
                        onChange={(event) => {
                            if (!event.target.value) return;
                            setMonth(inputValueToMonthStart(event.target.value));
                        }}
                        className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary/40"
                    />
                </div>
            </div>

            {loading ? (
                <LoadingState variant="skeleton" count={3} />
            ) : error ? (
                <ErrorState message={error} onRetry={() => void fetchBudgetDetail()} />
            ) : budget ? (
                <div className="space-y-6">
                    <BudgetCard budget={budget} />

                    <section className="space-y-3">
                        <h2 className="text-base font-semibold text-foreground">Expenses Under This Budget</h2>
                        <ExpenseList expenses={expenses} />
                    </section>
                </div>
            ) : (
                <ErrorState
                    message="Budget not found for this month."
                    onRetry={() => void fetchBudgetDetail()}
                />
            )}
        </div>
    );
}
