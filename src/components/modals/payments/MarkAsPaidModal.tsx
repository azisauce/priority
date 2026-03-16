"use client";

import { useEffect, useMemo, useState } from "react";
import FormDialog from "@/components/dialogs/form-dialog";
import type { MarkAsPaidInput, MonthlyPayment } from "@/types/payment";

interface MarkAsPaidModalProps {
  open: boolean;
  payment: MonthlyPayment | null;
  onClose: () => void;
  onSubmit: (paymentId: string, data: MarkAsPaidInput) => Promise<void>;
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

export default function MarkAsPaidModal({
  open,
  payment,
  onClose,
  onSubmit,
}: MarkAsPaidModalProps) {
  const defaultMonth = useMemo(() => getTodayDate(), []);

  const [month, setMonth] = useState(defaultMonth);
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !payment) return;

    setMonth(defaultMonth);
    setAmount(payment.defaultAmount.toString());
    setError("");
  }, [open, payment, defaultMonth]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!payment) {
      setError("No payment selected.");
      return;
    }

    const parsedAmount = Number(amount);

    if (!month) {
      setError("Month is required.");
      return;
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Amount must be greater than zero.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await onSubmit(payment.id, {
        month,
        amount: parsedAmount,
      });
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to mark payment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={`Mark as paid${payment ? `: ${payment.name}` : ""}`}
      onSubmit={handleSubmit}
      submitLabel="Save"
      loading={submitting}
    >
      <div className="space-y-1">
        <label className="block text-sm text-muted-foreground" htmlFor="mark-paid-month">
          Month
        </label>
        <input
          id="mark-paid-month"
          type="date"
          value={month}
          onChange={(event) => setMonth(event.target.value)}
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary/40"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm text-muted-foreground" htmlFor="mark-paid-amount">
          Amount
        </label>
        <input
          id="mark-paid-amount"
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          readOnly={!payment?.isVariable}
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
        />
        {!payment?.isVariable && (
          <p className="text-xs text-muted-foreground">Fixed payment amount comes from the default amount.</p>
        )}
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>
      )}
    </FormDialog>
  );
}
