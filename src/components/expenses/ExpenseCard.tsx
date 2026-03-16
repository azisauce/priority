"use client";

import CardBase from "@/components/cards/card-base";
import { Pencil, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Expense } from "@/types/expense";

interface ExpenseCardProps {
  expense: Expense;
  onEdit?: () => void;
  onDelete?: () => void;
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

export default function ExpenseCard({ expense, onEdit, onDelete }: ExpenseCardProps) {
  const hasNote = Boolean(expense.note && expense.note.trim().length > 0);
  const hasActions = Boolean(onEdit || onDelete);

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

        <div className="flex items-center gap-2">
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

          {hasActions && (
            <div className="flex items-center gap-1">
              {onEdit && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onEdit();
                  }}
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
                  aria-label="Edit expense"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete();
                  }}
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                  aria-label="Delete expense"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <p className="text-sm text-foreground/90">
        {hasNote ? expense.note : "No note"}
      </p>
    </CardBase>
  );
}
