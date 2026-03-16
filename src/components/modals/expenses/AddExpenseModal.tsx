"use client";

import { useEffect, useMemo, useState } from "react";
import FormDialog from "@/components/dialogs/form-dialog";
import type { Budget } from "@/types/budget";
import type { CreateExpenseInput, Expense } from "@/types/expense";

interface AddExpenseModalProps {
  open: boolean;
  month: string;
  budgets: Budget[];
  onClose: () => void;
  onSubmit: (data: CreateExpenseInput) => Promise<void>;
  initialData?: Expense | null;
  isEditing?: boolean;
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function toDateInputValue(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  return value.slice(0, 10);
}

export default function AddExpenseModal({
  open,
  month,
  budgets,
  onClose,
  onSubmit,
  initialData,
  isEditing = false,
}: AddExpenseModalProps) {
  const defaultDate = useMemo(() => {
    const today = getTodayDate();
    const monthPrefix = month.slice(0, 7);
    if (today.startsWith(monthPrefix)) {
      return today;
    }
    return `${monthPrefix}-01`;
  }, [month]);

  const [amount, setAmount] = useState("");
  const [budgetId, setBudgetId] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    if (isEditing && initialData) {
      setAmount(initialData.amount.toString());
      setBudgetId(initialData.budgetId ?? "");
      setNote(initialData.note ?? "");
      setDate(toDateInputValue(initialData.date) || defaultDate);
      setError("");
      return;
    }

    setAmount("");
    setBudgetId("");
    setNote("");
    setDate(defaultDate);
    setError("");
  }, [open, defaultDate, initialData, isEditing]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Amount must be greater than zero.");
      return;
    }

    if (!date) {
      setError("Date is required.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        amount: parsedAmount,
        budgetId: budgetId || null,
        note: note.trim() ? note.trim() : null,
        date,
      });
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to save expense.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit Expense" : "Add Expense"}
      onSubmit={handleSubmit}
      submitLabel={isEditing ? "Save Changes" : "Add Expense"}
      loading={submitting}
    >
      <div className="space-y-1">
        <label className="block text-sm text-muted-foreground" htmlFor="expense-amount">
          Amount
        </label>
        <input
          id="expense-amount"
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="0.00"
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary/40"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm text-muted-foreground" htmlFor="expense-budget">
          Budget
        </label>
        <select
          id="expense-budget"
          value={budgetId}
          onChange={(event) => setBudgetId(event.target.value)}
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary/40"
        >
          <option value="">No budget</option>
          {budgets.map((budget) => (
            <option key={budget.id} value={budget.id}>
              {budget.category}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="block text-sm text-muted-foreground" htmlFor="expense-note">
          Note
        </label>
        <textarea
          id="expense-note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Optional note"
          rows={3}
          className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary/40"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm text-muted-foreground" htmlFor="expense-date">
          Date
        </label>
        <input
          id="expense-date"
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>
      )}
    </FormDialog>
  );
}
