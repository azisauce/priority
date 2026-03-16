"use client";

import Link from "next/link";
import { PiggyBank } from "lucide-react";
import DashboardCard from "@/components/cards/dashboard-card";
import BudgetCard from "@/components/expenses/BudgetCard";
import type { Budget } from "@/types/budget";

interface BudgetOverviewItem {
  id: string;
  category: string;
  month: string;
  totalAllocatedAmount: number;
  rolledOverAmount: number;
  spentAmount: number;
  remainingAmount: number;
}

interface BudgetOverviewProps {
  budgets: BudgetOverviewItem[];
}

function toMiniBudget(budget: BudgetOverviewItem): Budget {
  return {
    id: budget.id,
    userId: "",
    category: budget.category,
    month: budget.month,
    allocatedAmount: budget.totalAllocatedAmount,
    rolledOverAmount: budget.rolledOverAmount,
    totalAllocatedAmount: budget.totalAllocatedAmount,
    rollover: budget.rolledOverAmount > 0,
    spentAmount: budget.spentAmount,
    remainingAmount: budget.remainingAmount,
    createdAt: "",
    updatedAt: "",
  };
}

export default function BudgetOverview({ budgets }: BudgetOverviewProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">Budget Overview</h2>
        <Link
          href="/expenses/budgets"
          className="text-sm font-medium text-primary underline-offset-2 hover:underline"
        >
          See all -&gt;
        </Link>
      </div>

      {budgets.length === 0 ? (
        <DashboardCard
          title="No budgets for this month"
          value="Set your categories"
          icon={PiggyBank}
          description="Create a budget to track spending progress this month."
        >
          <Link
            href="/expenses/budgets"
            className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
            style={{
              backgroundColor: "rgb(var(--m3-secondary-container))",
              color: "rgb(var(--m3-on-secondary-container))",
            }}
          >
            Add budget
          </Link>
        </DashboardCard>
      ) : (
        <div className="space-y-3">
          {budgets.map((budget) => (
            <Link key={budget.id} href="/expenses/budgets" className="block">
              <BudgetCard budget={toMiniBudget(budget)} variant="mini" />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
