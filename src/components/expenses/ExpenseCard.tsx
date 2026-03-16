"use client";

import CardBase from "@/components/cards/card-base";
import { formatDate } from "@/lib/utils";
import type { Expense } from "@/types/expense";

interface ExpenseCardProps {
  expense: Expense;
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

export default function ExpenseCard({ expense }: ExpenseCardProps) {
  const hasNote = Boolean(expense.note && expense.note.trim().length > 0);

  return (
    <CardBase className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">
            {currencyFormatter.format(expense.amount)}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDate(expense.date)}
          </p>
        </div>

        <span
          className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
          style={{
            backgroundColor: expense.budgetCategory
              ? "rgb(var(--m3-secondary-container))"
              : "rgb(var(--m3-surface-variant))",
            color: expense.budgetCategory
              ? "rgb(var(--m3-on-secondary-container))"
              : "rgb(var(--m3-on-surface-variant))",
          }}
        >
          {expense.budgetCategory || "No budget"}
        </span>
      </div>

      <p className="text-sm text-foreground/90">
        {hasNote ? expense.note : "No note"}
      </p>
    </CardBase>
  );
}
