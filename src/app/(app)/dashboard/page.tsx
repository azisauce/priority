"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import PageHeader from "@/components/layout/page-header";
import DashboardCard from "@/components/cards/dashboard-card";
import BalanceStrip from "@/components/dashboard/BalanceStrip";
import PaymentsStatus from "@/components/dashboard/PaymentsStatus";
import BudgetOverview from "@/components/dashboard/BudgetOverview";
import RecentExpenses from "@/components/dashboard/RecentExpenses";
import DebtsDueSoon from "@/components/dashboard/DebtsDueSoon";

interface DashboardData {
  totalItems: number;
  totalGroups: number;
  totalValue: number;
  averagePriority: number;
  topItems: {
    id: string;
    itemName: string;
    priority: number;
    pricing: number;
    score: number;
  }[];
  paymentsSummary: {
    month: string;
    totalIncome: number;
    totalExpenses: number;
    fixedExpenses: number;
    net: number;
    paidCount: number;
    unpaidCount: number;
    payments: {
      id: string;
      name: string;
      type: "income" | "expense";
      category: string | null;
      dayOfMonth: number;
      amount: number;
      isVariable: boolean;
      isPaid: boolean;
      paidAt: string | null;
    }[];
  };
  budgetsSummary: {
    id: string;
    category: string;
    month: string;
    allocatedAmount: number;
    rolledOverAmount: number;
    totalAllocatedAmount: number;
    spentAmount: number;
    remainingAmount: number;
    spentPercent: number;
    isOver80Percent: boolean;
  }[];
  recentExpenses: {
    id: string;
    amount: number;
    note: string | null;
    date: string;
    createdAt: string;
    budgetCategory: string | null;
  }[];
  upcomingDues: {
    id: string;
    name: string;
    counterparty: string | null;
    direction: "i_owe" | "they_owe";
    status: "active" | "paid" | "overdue";
    deadline: string;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    daysUntilDeadline: number;
  }[];
}

function SectionSkeleton() {
  return <div className="h-40 animate-pulse rounded-2xl border border-border bg-card" />;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("Failed to load dashboard");
        }

        const json = (await res.json()) as DashboardData;
        setData(json);
      })
      .catch((fetchError) => {
        setError(fetchError instanceof Error ? fetchError.message : "Failed to load dashboard");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 py-4">
        <PageHeader title="Dashboard" description="Overview of your purchase priorities" />
        {Array.from({ length: 7 }).map((_, index) => (
          <SectionSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6 py-4">
        <PageHeader title="Dashboard" description="Overview of your purchase priorities" />
        <div className="rounded-2xl border border-border bg-card p-4 text-sm text-destructive">
          {error || "Unable to load dashboard data."}
        </div>
      </div>
    );
  }

  const balanceNet = data.paymentsSummary.totalIncome - data.paymentsSummary.fixedExpenses;

  return (
    <div className="space-y-8 py-4">
      <PageHeader title="Dashboard" description="Overview of your purchase priorities" />

      <BalanceStrip
        totalIncome={data.paymentsSummary.totalIncome}
        fixedExpenses={data.paymentsSummary.fixedExpenses}
        net={balanceNet}
        paymentsCount={data.paymentsSummary.payments.length}
      />

      <PaymentsStatus
        payments={data.paymentsSummary.payments}
        paidCount={data.paymentsSummary.paidCount}
        unpaidCount={data.paymentsSummary.unpaidCount}
      />

      <BudgetOverview budgets={data.budgetsSummary} />

      <RecentExpenses expenses={data.recentExpenses} />

      <DebtsDueSoon debts={data.upcomingDues} />

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-foreground">Wishlist Snapshot</h2>
          <Link
            href="/wishlist"
            className="text-sm font-medium text-primary underline-offset-2 hover:underline"
          >
            See all -&gt;
          </Link>
        </div>

        {!data.topItems.length ? (
          <DashboardCard
            title="No wishlist items"
            value="Add priorities"
            icon={Sparkles}
            description="Add wishlist items to see your top priorities here."
          >
            <Link
              href="/wishlist"
              className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
              style={{
                backgroundColor: "rgb(var(--m3-secondary-container))",
                color: "rgb(var(--m3-on-secondary-container))",
              }}
            >
              Add wishlist item
            </Link>
          </DashboardCard>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="px-3 py-3 font-medium sm:px-6">Rank</th>
                  <th className="px-3 py-3 font-medium sm:px-6">Item Name</th>
                  <th className="px-3 py-3 font-medium sm:px-6">Priority</th>
                  <th className="hidden px-3 py-3 font-medium sm:table-cell sm:px-6">Price</th>
                  <th className="hidden px-3 py-3 font-medium sm:table-cell sm:px-6">Value Score</th>
                </tr>
              </thead>
              <tbody>
                {data.topItems.map((item, index) => (
                  <tr
                    key={item.id}
                    className="border-b border-border last:border-0 hover:bg-accent/50"
                  >
                    <td className="px-3 py-3 text-muted-foreground sm:px-6">{index + 1}</td>
                    <td className="px-3 py-3 font-medium text-foreground sm:px-6">
                      <div>{item.itemName}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground sm:hidden">
                        ${item.pricing.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        - VS: {item.score.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground sm:px-6">
                      {item.priority.toFixed(2)}
                    </td>
                    <td className="hidden px-3 py-3 text-muted-foreground sm:table-cell sm:px-6">
                      ${item.pricing.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="hidden px-3 py-3 font-medium text-primary sm:table-cell sm:px-6">
                      {item.score.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-foreground">Simulation CTA</h2>
          <Link
            href="/simulation"
            className="text-sm font-medium text-primary underline-offset-2 hover:underline"
          >
            See all -&gt;
          </Link>
        </div>

        <DashboardCard
          title="Future Planning"
          value="Simulate upcoming months"
          icon={Sparkles}
          description="Preview how your income, expenses, and debts could evolve over time."
        >
          <Link
            href="/simulation"
            className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
            style={{
              backgroundColor: "rgb(var(--m3-primary))",
              color: "rgb(var(--m3-on-primary))",
            }}
          >
            Simulate future months -&gt;
          </Link>
        </DashboardCard>
      </section>
    </div>
  );
}
