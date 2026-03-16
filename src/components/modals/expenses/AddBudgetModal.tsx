"use client";

import { useEffect, useMemo, useState } from "react";
import FormDialog from "@/components/dialogs/form-dialog";
import type { CreateBudgetInput } from "@/types/budget";

interface AddBudgetModalProps {
  open: boolean;
  month: string;
  onClose: () => void;
  onSubmit: (data: CreateBudgetInput) => Promise<void>;
}

function toMonthInputValue(month: string) {
  return month.slice(0, 7);
}

function toMonthStartDate(monthInput: string) {
  return `${monthInput}-01`;
}

export default function AddBudgetModal({ open, month, onClose, onSubmit }: AddBudgetModalProps) {
  const initialMonthInput = useMemo(() => toMonthInputValue(month), [month]);

  const [category, setCategory] = useState("");
  const [allocatedAmount, setAllocatedAmount] = useState("");
  const [monthInput, setMonthInput] = useState(initialMonthInput);
  const [rollover, setRollover] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    setCategory("");
    setAllocatedAmount("");
    setMonthInput(initialMonthInput);
    setRollover(false);
    setError("");
  }, [open, initialMonthInput]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    const trimmedCategory = category.trim();
    const parsedAmount = Number(allocatedAmount);

    if (!trimmedCategory) {
      setError("Category is required.");
      return;
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Allocated amount must be greater than zero.");
      return;
    }

    if (!monthInput) {
      setError("Month is required.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        category: trimmedCategory,
        allocatedAmount: parsedAmount,
        month: toMonthStartDate(monthInput),
        rollover,
      });
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to create budget.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title="Add Budget"
      onSubmit={handleSubmit}
      submitLabel="Add Budget"
      loading={submitting}
    >
      <div className="space-y-1">
        <label className="block text-sm text-muted-foreground" htmlFor="budget-category">
          Category
        </label>
        <input
          id="budget-category"
          type="text"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          placeholder="e.g. Groceries"
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary/40"
          maxLength={100}
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm text-muted-foreground" htmlFor="budget-amount">
          Allocated Amount
        </label>
        <input
          id="budget-amount"
          type="number"
          min="0"
          step="0.01"
          value={allocatedAmount}
          onChange={(event) => setAllocatedAmount(event.target.value)}
          placeholder="0.00"
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary/40"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm text-muted-foreground" htmlFor="budget-month">
          Month
        </label>
        <input
          id="budget-month"
          type="month"
          value={monthInput}
          onChange={(event) => setMonthInput(event.target.value)}
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary/40"
        />
      </div>

      <label className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={rollover}
          onChange={(event) => setRollover(event.target.checked)}
          className="h-4 w-4"
        />
        Enable rollover for unused amount
      </label>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>
      )}
    </FormDialog>
  );
}
