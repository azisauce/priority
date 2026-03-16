"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  Clock3,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import PageHeader from "@/components/layout/page-header";
import type { DebtItem, PaymentRecord, PaymentStatus } from "@/types/tracking";

interface DebtDetail extends DebtItem {
  payments: PaymentRecord[];
}

interface DebtDetailResponse {
  debt?: DebtDetail;
  error?: string;
}

interface DebtFormData {
  name: string;
  purpose: string;
  totalAmount: string;
  counterparty: string;
  startDate: string;
  deadline: string;
  status: DebtItem["status"];
  paymentPeriod: DebtItem["paymentPeriod"];
  installmentAmount: string;
  notes: string;
}

interface PaymentFormData {
  amount: string;
  paymentDate: string;
  status: PaymentStatus;
  note: string;
}

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Math.abs(amount));

const formatDate = (dateString: string): string =>
  new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const getTypeBadgeClasses = (direction: DebtItem["direction"]): string => {
  if (direction === "they_owe") {
    return "bg-green-500/15 text-green-600 dark:text-green-400";
  }
  return "bg-red-500/15 text-red-600 dark:text-red-400";
};

const getDebtStatusBadgeClasses = (status: DebtItem["status"]): string => {
  if (status === "paid") return "bg-green-500/15 text-green-600 dark:text-green-400";
  if (status === "overdue") return "bg-amber-500/15 text-amber-600 dark:text-amber-400";
  return "bg-blue-500/15 text-blue-600 dark:text-blue-400";
};

const getPaymentStatusBadgeClasses = (status: PaymentStatus): string => {
  if (status === "paid") return "bg-green-500/15 text-green-600 dark:text-green-400";
  if (status === "missed") return "bg-red-500/15 text-red-600 dark:text-red-400";
  return "bg-amber-500/15 text-amber-600 dark:text-amber-400";
};

const toInputDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "";
  return dateString.split("T")[0];
};

export default function BalanceDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const debtId = params.id;

  const [debt, setDebt] = useState<DebtDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [isSubmittingDebt, setIsSubmittingDebt] = useState(false);
  const [debtForm, setDebtForm] = useState<DebtFormData>({
    name: "",
    purpose: "",
    totalAmount: "",
    counterparty: "",
    startDate: "",
    deadline: "",
    status: "active",
    paymentPeriod: "monthly",
    installmentAmount: "",
    notes: "",
  });

  const [deleteDebtOpen, setDeleteDebtOpen] = useState(false);
  const [isDeletingDebt, setIsDeletingDebt] = useState(false);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentRecord | null>(null);
  const [paymentForm, setPaymentForm] = useState<PaymentFormData>({
    amount: "",
    paymentDate: new Date().toISOString().split("T")[0],
    status: "paid",
    note: "",
  });

  const [deletePayment, setDeletePayment] = useState<PaymentRecord | null>(null);
  const [isDeletingPayment, setIsDeletingPayment] = useState(false);

  const fetchDebtDetail = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/debts/${debtId}`);
      if (!res.ok) {
        throw new Error("Failed to load debt details");
      }

      const data = (await res.json()) as DebtDetailResponse;
      if (!data.debt) {
        setDebt(null);
        setError("Debt/asset not found.");
        return;
      }

      setDebt({
        ...data.debt,
        payments: data.debt.payments || [],
      });
    } catch (err) {
      console.error("Failed to fetch debt details:", err);
      setError("Failed to load debt/asset details. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [debtId]);

  useEffect(() => {
    if (debtId) {
      fetchDebtDetail();
    }
  }, [debtId, fetchDebtDetail]);

  const openEditDebt = () => {
    if (!debt) return;

    setDebtForm({
      name: debt.name,
      purpose: debt.purpose || "",
      totalAmount: debt.totalAmount.toString(),
      counterparty: debt.counterparty,
      startDate: toInputDate(debt.startDate),
      deadline: toInputDate(debt.deadline),
      status: debt.status,
      paymentPeriod: debt.paymentPeriod,
      installmentAmount: debt.installmentAmount?.toString() || "",
      notes: debt.notes || "",
    });
    setIsDebtModalOpen(true);
  };

  const handleSubmitDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!debt) return;

    const totalAmount = parseFloat(debtForm.totalAmount);
    if (Number.isNaN(totalAmount) || totalAmount <= 0) {
      alert("Please enter a valid total amount");
      return;
    }

    const installmentAmount = debtForm.installmentAmount
      ? parseFloat(debtForm.installmentAmount)
      : null;

    if (
      installmentAmount !== null &&
      (Number.isNaN(installmentAmount) || installmentAmount <= 0)
    ) {
      alert("Fixed installment must be a positive amount");
      return;
    }

    setIsSubmittingDebt(true);
    try {
      const payload = {
        name: debtForm.name,
        purpose: debtForm.purpose.trim() || null,
        totalAmount,
        counterparty: debtForm.counterparty,
        startDate: debtForm.startDate,
        deadline: debtForm.deadline || null,
        status: debtForm.status,
        paymentPeriod: debtForm.paymentPeriod,
        installmentAmount,
        notes: debtForm.notes.trim() || null,
      };

      const res = await fetch(`/api/debts/${debt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(typeof err.error === "string" ? err.error : "Failed to update debt/asset");
        return;
      }

      setIsDebtModalOpen(false);
      await fetchDebtDetail();
    } catch (err) {
      console.error("Failed to update debt:", err);
      alert("Failed to update debt/asset");
    } finally {
      setIsSubmittingDebt(false);
    }
  };

  const handleDeleteDebt = async () => {
    if (!debt) return;

    setIsDeletingDebt(true);
    try {
      const res = await fetch(`/api/debts/${debt.id}`, { method: "DELETE" });
      if (!res.ok) {
        alert("Failed to delete debt/asset");
        return;
      }

      router.push("/debts/entries");
    } catch (err) {
      console.error("Failed to delete debt:", err);
      alert("Failed to delete debt/asset");
    } finally {
      setIsDeletingDebt(false);
    }
  };

  const openAddPayment = () => {
    setEditingPayment(null);
    setPaymentForm({
      amount: "",
      paymentDate: new Date().toISOString().split("T")[0],
      status: "paid",
      note: "",
    });
    setIsPaymentModalOpen(true);
  };

  const openEditPayment = (payment: PaymentRecord) => {
    setEditingPayment(payment);
    setPaymentForm({
      amount: payment.amount.toString(),
      paymentDate: toInputDate(payment.paymentDate),
      status: payment.status,
      note: payment.note || "",
    });
    setIsPaymentModalOpen(true);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!debt) return;

    const amount = parseFloat(paymentForm.amount);
    if (Number.isNaN(amount) || amount <= 0) {
      alert("Please enter a valid payment amount");
      return;
    }

    setIsSubmittingPayment(true);
    try {
      const payload = {
        amount,
        paymentDate: paymentForm.paymentDate,
        status: paymentForm.status,
        note: paymentForm.note.trim() || null,
      };

      const isEditing = Boolean(editingPayment);
      const url = isEditing
        ? `/api/debts/${debt.id}/payments/${editingPayment?.id}`
        : `/api/debts/${debt.id}/payments`;

      const res = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(typeof err.error === "string" ? err.error : "Failed to save payment");
        return;
      }

      setIsPaymentModalOpen(false);
      setEditingPayment(null);
      await fetchDebtDetail();
    } catch (err) {
      console.error("Failed to save payment:", err);
      alert("Failed to save payment");
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleDeletePayment = async () => {
    if (!debt || !deletePayment) return;

    setIsDeletingPayment(true);
    try {
      const res = await fetch(`/api/debts/${debt.id}/payments/${deletePayment.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        alert("Failed to delete payment");
        return;
      }

      setDeletePayment(null);
      await fetchDebtDetail();
    } catch (err) {
      console.error("Failed to delete payment:", err);
      alert("Failed to delete payment");
    } finally {
      setIsDeletingPayment(false);
    }
  };

  const displayedPayments = useMemo(() => {
    if (!debt) return [];

    const q = searchQuery.trim().toLowerCase();
    if (!q) return debt.payments;

    return debt.payments.filter((payment) => {
      if (payment.status.toLowerCase().includes(q)) return true;
      if (payment.note && payment.note.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [debt, searchQuery]);

  const closeDebtModal = () => {
    setIsDebtModalOpen(false);
  };

  const closePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setEditingPayment(null);
  };

  function renderDebtModal() {
    if (!isDebtModalOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/70" onClick={closeDebtModal} />
        <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-xl bg-card border border-border shadow-2xl">
          <div className="flex items-center justify-between p-6 pb-2 shrink-0">
            <h2 className="text-xl font-bold text-foreground">Edit Debt/Asset</h2>
            <button
              onClick={closeDebtModal}
              className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            <form id="debt-form" onSubmit={handleSubmitDebt} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Name</label>
                  <input
                    required
                    type="text"
                    value={debtForm.name}
                    onChange={(e) => setDebtForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-lg bg-input border border-border px-4 py-2.5 text-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Counterparty</label>
                  <input
                    required
                    type="text"
                    value={debtForm.counterparty}
                    onChange={(e) =>
                      setDebtForm((prev) => ({ ...prev, counterparty: e.target.value }))
                    }
                    className="w-full rounded-lg bg-input border border-border px-4 py-2.5 text-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Total Amount</label>
                  <input
                    required
                    min="0.01"
                    step="0.01"
                    type="number"
                    value={debtForm.totalAmount}
                    onChange={(e) =>
                      setDebtForm((prev) => ({ ...prev, totalAmount: e.target.value }))
                    }
                    className="w-full rounded-lg bg-input border border-border px-4 py-2.5 text-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Status</label>
                  <select
                    value={debtForm.status}
                    onChange={(e) =>
                      setDebtForm((prev) => ({
                        ...prev,
                        status: e.target.value as DebtItem["status"],
                      }))
                    }
                    className="w-full rounded-lg bg-input border border-border px-4 py-2.5 text-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                  >
                    <option value="active">Active</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Start Date</label>
                  <input
                    required
                    type="date"
                    value={debtForm.startDate}
                    onChange={(e) =>
                      setDebtForm((prev) => ({ ...prev, startDate: e.target.value }))
                    }
                    className="w-full rounded-lg bg-input border border-border px-4 py-2.5 text-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Deadline</label>
                  <input
                    type="date"
                    value={debtForm.deadline}
                    onChange={(e) =>
                      setDebtForm((prev) => ({ ...prev, deadline: e.target.value }))
                    }
                    className="w-full rounded-lg bg-input border border-border px-4 py-2.5 text-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Payment Period</label>
                  <select
                    value={debtForm.paymentPeriod}
                    onChange={(e) =>
                      setDebtForm((prev) => ({
                        ...prev,
                        paymentPeriod: e.target.value as DebtItem["paymentPeriod"],
                      }))
                    }
                    className="w-full rounded-lg bg-input border border-border px-4 py-2.5 text-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Fixed Installment</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={debtForm.installmentAmount}
                    onChange={(e) =>
                      setDebtForm((prev) => ({ ...prev, installmentAmount: e.target.value }))
                    }
                    placeholder="Leave empty for variable"
                    className="w-full rounded-lg bg-input border border-border px-4 py-2.5 text-foreground placeholder-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Purpose</label>
                <textarea
                  rows={2}
                  value={debtForm.purpose}
                  onChange={(e) => setDebtForm((prev) => ({ ...prev, purpose: e.target.value }))}
                  className="w-full rounded-lg bg-input border border-border px-4 py-2.5 text-foreground resize-none focus:border-ring focus:ring-1 focus:ring-ring"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Notes</label>
                <textarea
                  rows={2}
                  value={debtForm.notes}
                  onChange={(e) => setDebtForm((prev) => ({ ...prev, notes: e.target.value }))}
                  className="w-full rounded-lg bg-input border border-border px-4 py-2.5 text-foreground resize-none focus:border-ring focus:ring-1 focus:ring-ring"
                />
              </div>
            </form>
          </div>

          <div className="p-6 pt-2 shrink-0 flex gap-3 bg-card rounded-b-xl border-t border-border">
            <button
              type="button"
              onClick={closeDebtModal}
              className="flex-1 rounded-lg bg-muted px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/80 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="debt-form"
              disabled={isSubmittingDebt}
              className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {isSubmittingDebt ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderDeleteDebtConfirm() {
    if (!deleteDebtOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/70" onClick={() => setDeleteDebtOpen(false)} />
        <div className="relative w-full max-w-md rounded-xl bg-popover border border-border p-6 shadow-2xl">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <Trash2 className="h-6 w-6 text-destructive" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-foreground">Delete Debt/Asset</h2>
          <p className="mb-6 text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-medium text-foreground">{debt?.name || "this item"}</span>? This
            will delete ALL associated payments forever. This cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteDebtOpen(false)}
              className="flex-1 rounded-lg bg-muted px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/80 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteDebt}
              disabled={isDeletingDebt}
              className="flex-1 rounded-lg bg-destructive px-4 py-2.5 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 transition-colors"
            >
              {isDeletingDebt ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderPaymentModal() {
    if (!isPaymentModalOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/70" onClick={closePaymentModal} />
        <div className="relative w-full max-w-md rounded-xl bg-card border border-border shadow-2xl">
          <div className="flex items-center justify-between p-6 pb-2">
            <h2 className="text-xl font-bold text-foreground">
              {editingPayment ? "Edit Payment" : "Add Payment"}
            </h2>
            <button
              onClick={closePaymentModal}
              className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <form id="payment-form" onSubmit={handleSubmitPayment} className="p-6 pt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Amount <span className="text-destructive">*</span>
                </label>
                <input
                  required
                  min="0.01"
                  step="0.01"
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) =>
                    setPaymentForm((prev) => ({ ...prev, amount: e.target.value }))
                  }
                  className="w-full rounded-lg bg-input border border-border px-4 py-2.5 text-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Date <span className="text-destructive">*</span>
                </label>
                <input
                  required
                  type="date"
                  value={paymentForm.paymentDate}
                  onChange={(e) =>
                    setPaymentForm((prev) => ({ ...prev, paymentDate: e.target.value }))
                  }
                  className="w-full rounded-lg bg-input border border-border px-4 py-2.5 text-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Status</label>
              <select
                value={paymentForm.status}
                onChange={(e) =>
                  setPaymentForm((prev) => ({
                    ...prev,
                    status: e.target.value as PaymentStatus,
                  }))
                }
                className="w-full rounded-lg bg-input border border-border px-4 py-2.5 text-foreground focus:border-ring focus:ring-1 focus:ring-ring"
              >
                <option value="scheduled">Scheduled</option>
                <option value="paid">Paid</option>
                <option value="missed">Missed</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Note</label>
              <input
                type="text"
                value={paymentForm.note}
                onChange={(e) =>
                  setPaymentForm((prev) => ({ ...prev, note: e.target.value }))
                }
                placeholder="Optional note..."
                className="w-full rounded-lg bg-input border border-border px-4 py-2.5 text-foreground placeholder-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={closePaymentModal}
                className="flex-1 rounded-lg bg-muted px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/80 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingPayment}
                className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {isSubmittingPayment
                  ? "Saving..."
                  : editingPayment
                    ? "Save Changes"
                    : "Save Payment"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  function renderDeletePaymentConfirm() {
    if (!deletePayment) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/70" onClick={() => setDeletePayment(null)} />
        <div className="relative w-full max-w-md rounded-xl bg-popover border border-border p-6 shadow-2xl">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <Trash2 className="h-6 w-6 text-destructive" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-foreground">Delete Payment</h2>
          <p className="mb-6 text-muted-foreground">
            Are you sure you want to delete this payment of{" "}
            <span className="font-medium text-foreground">{formatCurrency(deletePayment.amount)}</span>?
            This will revert the balance. This cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setDeletePayment(null)}
              className="flex-1 rounded-lg bg-muted px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/80 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDeletePayment}
              disabled={isDeletingPayment}
              className="flex-1 rounded-lg bg-destructive px-4 py-2.5 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 transition-colors"
            >
              {isDeletingPayment ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      <button
        onClick={() => router.push("/debts/entries")}
        className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Balance
      </button>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : error || !debt ? (
        <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-center">
          <AlertTriangle className="h-8 w-8 text-amber-500" />
          <p className="text-sm text-muted-foreground">{error || "Debt/asset not found."}</p>
          <button
            onClick={fetchDebtDetail}
            className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <PageHeader
              title={debt.name}
              description={`Managed with ${debt.counterparty}`}
            />
            <div className="flex shrink-0 items-center gap-2 pt-2">
              <button
                onClick={openEditDebt}
                className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
              >
                <Pencil className="h-4 w-4" />
                <span className="hidden sm:inline">Edit</span>
              </button>
              <button
                onClick={() => setDeleteDebtOpen(true)}
                className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/80 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Type</p>
              <span
                className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-xs font-medium uppercase ${getTypeBadgeClasses(
                  debt.direction
                )}`}
              >
                {debt.direction === "they_owe" ? "they owe" : "i owe"}
              </span>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Status</p>
              <span
                className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-xs font-medium uppercase ${getDebtStatusBadgeClasses(
                  debt.status
                )}`}
              >
                {debt.status}
              </span>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Amount</p>
              <p className="mt-2 text-lg font-semibold text-foreground">{formatCurrency(debt.totalAmount)}</p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Remaining Balance</p>
              <p
                className={`mt-2 text-lg font-semibold ${
                  debt.direction === "they_owe"
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {debt.direction === "they_owe" ? "+" : "-"}
                {formatCurrency(Math.max(debt.totalAmount - debt.paidAmount, 0))}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
            <h2 className="text-base font-semibold text-foreground">Details</h2>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Counterparty</p>
                <p className="text-sm font-medium text-foreground">{debt.counterparty}</p>
              </div>

              <div className="rounded-lg bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Start Date</p>
                <p className="text-sm font-medium text-foreground">{formatDate(debt.startDate)}</p>
              </div>

              <div className="rounded-lg bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Deadline</p>
                <p className="text-sm font-medium text-foreground">
                  {debt.deadline ? formatDate(debt.deadline) : "Not set"}
                </p>
              </div>

              <div className="rounded-lg bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Payment Period</p>
                <p className="text-sm font-medium capitalize text-foreground">{debt.paymentPeriod}</p>
              </div>

              <div className="rounded-lg bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Fixed Installment</p>
                <p className="text-sm font-medium text-foreground">
                  {debt.installmentAmount ? formatCurrency(debt.installmentAmount) : "Variable"}
                </p>
              </div>

              <div className="rounded-lg bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-sm font-medium text-foreground">{formatDate(debt.createdAt)}</p>
              </div>
            </div>
            {debt.purpose && (
              <div className="mt-3 rounded-lg bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Purpose</p>
                <p className="text-sm text-foreground">{debt.purpose}</p>
              </div>
            )}
            {debt.notes && (
              <div className="mt-3 rounded-lg bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Notes</p>
                <p className="text-sm text-foreground">{debt.notes}</p>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="border-b border-border px-4 py-3 sm:px-6 sm:py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Payment Records</h2>
                  <p className="text-sm text-muted-foreground">
                    Add, edit, and delete payments linked to this debt/asset.
                  </p>
                </div>
                <button
                  onClick={openAddPayment}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4" />
                  Add Payment
                </button>
              </div>

              <div className="relative mt-3">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search payment status or note..."
                  className="w-full rounded-lg border border-border bg-input py-2.5 pl-10 pr-4 text-sm text-foreground placeholder-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>

            {displayedPayments.length === 0 ? (
              <div className="flex h-56 flex-col items-center justify-center px-4 text-center">
                <Clock3 className="mb-2 h-8 w-8 text-muted-foreground" />
                <h3 className="text-base font-medium text-foreground">No payment records</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create a payment record to track repayments on this item.
                </p>
              </div>
            ) : (
              <>
                <div className="divide-y divide-border md:hidden">
                  {displayedPayments.map((payment) => (
                    <div key={payment.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="mb-1.5 flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${getPaymentStatusBadgeClasses(
                                payment.status
                              )}`}
                            >
                              {payment.status}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-foreground">{formatCurrency(payment.amount)}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(payment.paymentDate)}</p>
                          {payment.note && (
                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{payment.note}</p>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            onClick={() => openEditPayment(payment)}
                            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeletePayment(payment)}
                            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Amount</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Date</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Status</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Note</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {displayedPayments.map((payment) => (
                        <tr key={payment.id} className="transition-colors hover:bg-muted/40">
                          <td className="px-6 py-4 text-sm font-semibold text-foreground">
                            {formatCurrency(payment.amount)}
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <CalendarDays className="h-3.5 w-3.5" />
                              {formatDate(payment.paymentDate)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${getPaymentStatusBadgeClasses(
                                payment.status
                              )}`}
                            >
                              {payment.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {payment.note || "-"}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openEditPayment(payment)}
                                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setDeletePayment(payment)}
                                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {renderDebtModal()}
      {renderDeleteDebtConfirm()}
      {renderPaymentModal()}
      {renderDeletePaymentConfirm()}
    </div>
  );
}
