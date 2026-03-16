"use client";

import { useMemo } from "react";
import { ReceiptText } from "lucide-react";
import EmptyState from "@/components/states/empty-state";
import ExpenseCard from "@/components/expenses/ExpenseCard";
import { formatDate } from "@/lib/utils";
import type { Expense } from "@/types/expense";

interface ExpenseListProps {
  expenses: Expense[];
}

function sortByDateDesc(a: Expense, b: Expense) {
  const dateDelta = new Date(`${b.date}T00:00:00.000Z`).getTime() -
    new Date(`${a.date}T00:00:00.000Z`).getTime();

  if (dateDelta !== 0) {
    return dateDelta;
  }

  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

export default function ExpenseList({ expenses }: ExpenseListProps) {
  const groupedExpenses = useMemo(() => {
    const grouped = new Map<string, Expense[]>();

    for (const expense of [...expenses].sort(sortByDateDesc)) {
      const dateKey = expense.date;
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)?.push(expense);
    }

    return [...grouped.entries()];
  }, [expenses]);

  if (groupedExpenses.length === 0) {
    return (
      <EmptyState
        icon={ReceiptText}
        title="No expenses for this month"
        description="Add an expense to start tracking your daily spending."
      />
    );
  }

  return (
    <div className="space-y-6">
      {groupedExpenses.map(([date, dayExpenses]) => (
        <section key={date} className="space-y-3">
          <h3
            style={{
              fontSize: "14px",
              lineHeight: "20px",
              fontWeight: 600,
              color: "rgb(var(--m3-on-surface-variant))",
              margin: 0,
            }}
          >
            {formatDate(date)}
          </h3>

          <div className="space-y-2">
            {dayExpenses.map((expense) => (
              <ExpenseCard key={expense.id} expense={expense} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
