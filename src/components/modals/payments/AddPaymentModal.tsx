"use client";

import { useEffect, useMemo, useState } from "react";
import FormDialog from "@/components/dialogs/form-dialog";
import type { CreateMonthlyPaymentInput, MonthlyPayment } from "@/types/payment";

interface AddPaymentModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateMonthlyPaymentInput) => Promise<void>;
  initialData?: MonthlyPayment | null;
  isEditing?: boolean;
}

function getCurrentMonthStart() {
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  return monthStart.toISOString().slice(0, 10);
}

function toDateInputValue(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  return value.slice(0, 10);
}

export default function AddPaymentModal({
  open,
  onClose,
  onSubmit,
  initialData,
  isEditing = false,
}: AddPaymentModalProps) {
  const defaultStartMonth = useMemo(() => getCurrentMonthStart(), []);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [isVariable, setIsVariable] = useState(false);
  const [defaultAmount, setDefaultAmount] = useState("");
  const [dayOfMonth, setDayOfMonth] = useState("1");
  const [startMonth, setStartMonth] = useState(defaultStartMonth);
  const [endMonth, setEndMonth] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    if (isEditing && initialData) {
      setName(initialData.name);
      setCategory(initialData.category ?? "");
      setType(initialData.type);
      setIsVariable(initialData.isVariable);
      setDefaultAmount(initialData.defaultAmount.toString());
      setDayOfMonth(initialData.dayOfMonth.toString());
      setStartMonth(toDateInputValue(initialData.startMonth) || defaultStartMonth);
      setEndMonth(toDateInputValue(initialData.endMonth));
      setError("");
      return;
    }

    setName("");
    setCategory("");
    setType("expense");
    setIsVariable(false);
    setDefaultAmount("");
    setDayOfMonth("1");
    setStartMonth(defaultStartMonth);
    setEndMonth("");
    setError("");
  }, [open, defaultStartMonth, initialData, isEditing]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    const parsedAmount = Number(defaultAmount);
    const parsedDayOfMonth = Number(dayOfMonth);

    if (!name.trim()) {
      setError("Name is required.");
      return;
    }

    if (!category.trim()) {
      setError("Category is required.");
      return;
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Default amount must be greater than zero.");
      return;
    }

    if (!Number.isInteger(parsedDayOfMonth) || parsedDayOfMonth < 1 || parsedDayOfMonth > 31) {
      setError("Day of month must be between 1 and 31.");
      return;
    }

    if (!startMonth) {
      setError("Start month is required.");
      return;
    }

    if (endMonth && new Date(`${endMonth}T00:00:00.000Z`) < new Date(`${startMonth}T00:00:00.000Z`)) {
      setError("End month cannot be before start month.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        category: category.trim(),
        type,
        is_variable: isVariable,
        default_amount: parsedAmount,
        day_of_month: parsedDayOfMonth,
        start_month: startMonth,
        end_month: endMonth ? endMonth : null,
      });
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to save payment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit Monthly Payment" : "Add Monthly Payment"}
      onSubmit={handleSubmit}
      submitLabel={isEditing ? "Save Changes" : "Add Payment"}
      loading={submitting}
    >
      <div className="space-y-1">
        <label className="block text-sm text-muted-foreground" htmlFor="payment-name">
          Name
        </label>
        <input
          id="payment-name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Salary"
          maxLength={200}
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary/40"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm text-muted-foreground" htmlFor="payment-category">
          Category
        </label>
        <input
          id="payment-category"
          type="text"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          placeholder="e.g. Housing"
          maxLength={100}
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary/40"
        />
      </div>

      <div className="space-y-1">
        <p className="block text-sm text-muted-foreground">Type</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setType("income")}
            className="rounded-xl border px-3 py-2 text-sm font-medium transition"
            style={{
              borderColor:
                type === "income" ? "rgb(var(--m3-primary))" : "rgb(var(--m3-outline-variant))",
              backgroundColor:
                type === "income"
                  ? "rgb(var(--m3-primary-container))"
                  : "rgb(var(--m3-surface))",
              color:
                type === "income"
                  ? "rgb(var(--m3-on-primary-container))"
                  : "rgb(var(--m3-on-surface))",
            }}
          >
            Income
          </button>
          <button
            type="button"
            onClick={() => setType("expense")}
            className="rounded-xl border px-3 py-2 text-sm font-medium transition"
            style={{
              borderColor:
                type === "expense" ? "rgb(var(--m3-primary))" : "rgb(var(--m3-outline-variant))",
              backgroundColor:
                type === "expense"
                  ? "rgb(var(--m3-primary-container))"
                  : "rgb(var(--m3-surface))",
              color:
                type === "expense"
                  ? "rgb(var(--m3-on-primary-container))"
                  : "rgb(var(--m3-on-surface))",
            }}
          >
            Expense
          </button>
        </div>
      </div>

      <label className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={isVariable}
          onChange={(event) => setIsVariable(event.target.checked)}
          className="h-4 w-4"
        />
        This payment amount can vary month to month
      </label>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="block text-sm text-muted-foreground" htmlFor="payment-default-amount">
            Default Amount
          </label>
          <input
            id="payment-default-amount"
            type="number"
            min="0"
            step="0.01"
            value={defaultAmount}
            onChange={(event) => setDefaultAmount(event.target.value)}
            placeholder="0.00"
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm text-muted-foreground" htmlFor="payment-day-of-month">
            Day of Month
          </label>
          <input
            id="payment-day-of-month"
            type="number"
            min="1"
            max="31"
            step="1"
            value={dayOfMonth}
            onChange={(event) => setDayOfMonth(event.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary/40"
          />
          <p className="text-xs text-muted-foreground">
            The day of the month this payment is typically due or received (e.g. 1 for rent on the 1st).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="block text-sm text-muted-foreground" htmlFor="payment-start-month">
            Start Month
          </label>
          <input
            id="payment-start-month"
            type="date"
            value={startMonth}
            onChange={(event) => setStartMonth(event.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm text-muted-foreground" htmlFor="payment-end-month">
            End Month (optional)
          </label>
          <input
            id="payment-end-month"
            type="date"
            value={endMonth}
            onChange={(event) => setEndMonth(event.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>
      )}
    </FormDialog>
  );
}
