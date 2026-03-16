"use client";

import { useEffect, useMemo, useState } from "react";
import FormDialog from "@/components/dialogs/form-dialog";
import type { Budget, CreateBudgetInput } from "@/types/budget";

interface AddBudgetModalProps {
  open: boolean;
  month: string;
  onClose: () => void;
  onSubmit: (data: CreateBudgetInput) => Promise<void>;
  initialData?: Budget | null;
  isEditing?: boolean;
}

function toMonthInputValue(month: string) {
  return month.slice(0, 7);
}

function toMonthStartDate(monthInput: string) {
  return `${monthInput}-01`;
}

function pad2(value: number): string {
  return value.toString().padStart(2, "0");
}

function toMonthInputFromValue(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  const trimmed = value.trim();
  if (/^\d{4}-\d{2}(-\d{2})?$/.test(trimmed)) {
    return trimmed.slice(0, 7);
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return `${parsed.getFullYear()}-${pad2(parsed.getMonth() + 1)}`;
}

export default function AddBudgetModal({
  open,
  month,
  onClose,
  onSubmit,
  initialData,
  isEditing = false,
}: AddBudgetModalProps) {
  const initialMonthInput = useMemo(() => toMonthInputValue(month), [month]);

  const [category, setCategory] = useState("");
  const [allocatedAmount, setAllocatedAmount] = useState("");
  const [monthInput, setMonthInput] = useState(initialMonthInput);
  const [rollover, setRollover] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    if (isEditing && initialData) {
      setCategory(initialData.category);
      setAllocatedAmount(initialData.allocatedAmount.toString());
      setMonthInput(toMonthInputFromValue(initialData.month) || initialMonthInput);
      setRollover(initialData.rollover);
      setError("");
      return;
    }

    setCategory("");
    setAllocatedAmount("");
    setMonthInput(initialMonthInput);
    setRollover(false);
    setError("");
  }, [open, initialData, initialMonthInput, isEditing]);

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
      setError(submitError instanceof Error ? submitError.message : "Failed to save budget.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit Budget" : "Add Budget"}
      onSubmit={handleSubmit}
      submitLabel={isEditing ? "Save Changes" : "Add Budget"}
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
