"use client";

import Link from "next/link";
import { ReceiptText } from "lucide-react";
import DashboardCard from "@/components/cards/dashboard-card";

interface RecentExpenseItem {
  id: string;
  amount: number;
  note: string | null;
  date: string;
  budgetCategory: string | null;
}

interface RecentExpensesProps {
  expenses: RecentExpenseItem[];
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

export default function RecentExpenses({ expenses }: RecentExpensesProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">Recent Expenses</h2>
        <Link
          href="/expenses/daily"
          className="text-sm font-medium text-primary underline-offset-2 hover:underline"
        >
          See all -&gt;
        </Link>
      </div>

      {expenses.length === 0 ? (
        <DashboardCard
          title="No recent expenses"
          value="Start logging"
          icon={ReceiptText}
          description="Record expenses to see your latest spending activity here."
        >
          <Link
            href="/expenses/daily"
            className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
            style={{
              backgroundColor: "rgb(var(--m3-secondary-container))",
              color: "rgb(var(--m3-on-secondary-container))",
            }}
          >
            Add expense
          </Link>
        </DashboardCard>
      ) : (
        <div className="space-y-3">
          {expenses.map((expense) => {
            const label = expense.note && expense.note.trim().length > 0 ? expense.note : "Expense";

            return (
              <Link key={expense.id} href="/expenses/daily" className="block">
                <DashboardCard
                  title={label}
                  value={currencyFormatter.format(expense.amount)}
                  icon={ReceiptText}
                  description={`${expense.budgetCategory || "Uncategorized"} - ${new Date(
                    `${expense.date}T00:00:00.000Z`
                  ).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}`}
                />
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
