"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowLeft,
  CalendarDays,
  Repeat,
  Banknote,
} from "lucide-react";

/* ───────── types ───────── */

interface PaymentEntry {
  id: string;
  debtId: string;
  amount: number;
  paymentDate: string;
  status: "scheduled" | "paid" | "missed";
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Debt {
  id: string;
  name: string;
  purpose: string | null;
  totalAmount: number;
  remainingBalance: number;
  lenderName: string;
  startDate: string;
  deadline: string | null;
  status: "active" | "paid" | "overdue";
  paymentPeriod: "weekly" | "monthly" | "custom";
  fixedInstallmentAmount: number | null;
  notes: string | null;
  nextPaymentDate: string | null;
  payments?: PaymentEntry[];
  createdAt: string;
  updatedAt: string;
}

interface DebtFormData {
  name: string;
  purpose: string;
  totalAmount: string;
  lenderName: string;
  startDate: string;
  deadline: string;
  paymentPeriod: "weekly" | "monthly" | "custom";
  fixedInstallmentAmount: string;
  notes: string;
}

interface PaymentFormData {
  amount: string;
  paymentDate: string;
  status: "scheduled" | "paid" | "missed";
  note: string;
}

/* ───────── formatters ───────── */

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

const formatDate = (dateString: string): string =>
  new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

/* ───────── empty form defaults ───────── */

const emptyDebtForm: DebtFormData = {
  name: "",
  purpose: "",
  totalAmount: "",
  lenderName: "",
  startDate: new Date().toISOString().split("T")[0],
  deadline: "",
  paymentPeriod: "monthly",
  fixedInstallmentAmount: "",
  notes: "",
};

const emptyPaymentForm: PaymentFormData = {
  amount: "",
  paymentDate: new Date().toISOString().split("T")[0],
  status: "paid",
  note: "",
};

/* ═══════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════ */

export default function DebtsPage() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [debtForm, setDebtForm] = useState<DebtFormData>(emptyDebtForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteDebt, setDeleteDebt] = useState<Debt | null>(null);

  // Detail view
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Payment modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentEntry | null>(null);
  const [paymentForm, setPaymentForm] = useState<PaymentFormData>(emptyPaymentForm);
  const [isPaymentSubmitting, setIsPaymentSubmitting] = useState(false);
  const [deletePayment, setDeletePayment] = useState<PaymentEntry | null>(null);

  /* ─── Fetch debts list ─── */
  const fetchDebts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/debts?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setDebts(data.debts || []);
      }
    } catch (err) {
      console.error("Failed to fetch debts:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchDebts();
  }, [fetchDebts]);

  /* ─── Fetch single debt detail with payments ─── */
  const fetchDebtDetail = useCallback(async (debtId: string) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/debts/${debtId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedDebt(data.debt);
      }
    } catch (err) {
      console.error("Failed to fetch debt detail:", err);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  /* ───────────── Debt CRUD ───────────── */

  const openAddDebt = () => {
    setEditingDebt(null);
    setDebtForm(emptyDebtForm);
    setIsDebtModalOpen(true);
  };

  const openEditDebt = (debt: Debt) => {
    setEditingDebt(debt);
    setDebtForm({
      name: debt.name,
      purpose: debt.purpose || "",
      totalAmount: debt.totalAmount.toString(),
      lenderName: debt.lenderName,
      startDate: debt.startDate ? debt.startDate.split("T")[0] : "",
      deadline: debt.deadline ? debt.deadline.split("T")[0] : "",
      paymentPeriod: debt.paymentPeriod,
      fixedInstallmentAmount: debt.fixedInstallmentAmount?.toString() || "",
      notes: debt.notes || "",
    });
    setIsDebtModalOpen(true);
  };

  const handleSubmitDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const totalAmount = parseFloat(debtForm.totalAmount);
    if (isNaN(totalAmount) || totalAmount <= 0) {
      alert("Please enter a valid total amount");
      setIsSubmitting(false);
      return;
    }

    const fixedAmt = debtForm.fixedInstallmentAmount ? parseFloat(debtForm.fixedInstallmentAmount) : null;
    if (fixedAmt !== null && (isNaN(fixedAmt) || fixedAmt <= 0)) {
      alert("Fixed installment amount must be positive or empty");
      setIsSubmitting(false);
      return;
    }

    const payload = {
      name: debtForm.name,
      purpose: debtForm.purpose.trim() || null,
      totalAmount,
      lenderName: debtForm.lenderName,
      startDate: debtForm.startDate,
      deadline: debtForm.deadline || null,
      paymentPeriod: debtForm.paymentPeriod,
      fixedInstallmentAmount: fixedAmt,
      notes: debtForm.notes.trim() || null,
    };

    try {
      const url = editingDebt ? `/api/debts/${editingDebt.id}` : "/api/debts";
      const method = editingDebt ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsDebtModalOpen(false);
        setEditingDebt(null);
        fetchDebts();
        // If we're editing the currently selected debt, refresh detail
        if (editingDebt && selectedDebt?.id === editingDebt.id) {
          fetchDebtDetail(editingDebt.id);
        }
      } else {
        const err = await res.json();
        alert(typeof err.error === "string" ? err.error : "Failed to save debt");
      }
    } catch (err) {
      console.error("Failed to save debt:", err);
      alert("Failed to save debt");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDebt = async () => {
    if (!deleteDebt) return;
    try {
      const res = await fetch(`/api/debts/${deleteDebt.id}`, { method: "DELETE" });
      if (res.ok) {
        setDeleteDebt(null);
        if (selectedDebt?.id === deleteDebt.id) setSelectedDebt(null);
        fetchDebts();
      } else {
        alert("Failed to delete debt");
      }
    } catch (err) {
      console.error("Failed to delete debt:", err);
      alert("Failed to delete debt");
    }
  };

  /* ───────────── Payment CRUD ───────────── */

  const openAddPayment = () => {
    setEditingPayment(null);
    setPaymentForm({
      ...emptyPaymentForm,
      amount: selectedDebt?.fixedInstallmentAmount?.toString() || "",
    });
    setIsPaymentModalOpen(true);
  };

  const openEditPayment = (payment: PaymentEntry) => {
    setEditingPayment(payment);
    setPaymentForm({
      amount: payment.amount.toString(),
      paymentDate: payment.paymentDate ? payment.paymentDate.split("T")[0] : "",
      status: payment.status,
      note: payment.note || "",
    });
    setIsPaymentModalOpen(true);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebt) return;
    setIsPaymentSubmitting(true);

    const amount = parseFloat(paymentForm.amount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount");
      setIsPaymentSubmitting(false);
      return;
    }

    const payload = {
      amount,
      paymentDate: paymentForm.paymentDate,
      status: paymentForm.status,
      note: paymentForm.note.trim() || null,
    };

    try {
      const url = editingPayment
        ? `/api/debts/${selectedDebt.id}/payments/${editingPayment.id}`
        : `/api/debts/${selectedDebt.id}/payments`;
      const method = editingPayment ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsPaymentModalOpen(false);
        setEditingPayment(null);
        fetchDebtDetail(selectedDebt.id);
        fetchDebts();
      } else {
        const err = await res.json();
        alert(typeof err.error === "string" ? err.error : "Failed to save payment");
      }
    } catch (err) {
      console.error("Failed to save payment:", err);
      alert("Failed to save payment");
    } finally {
      setIsPaymentSubmitting(false);
    }
  };

  const handleDeletePayment = async () => {
    if (!deletePayment || !selectedDebt) return;
    try {
      const res = await fetch(
        `/api/debts/${selectedDebt.id}/payments/${deletePayment.id}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setDeletePayment(null);
        fetchDebtDetail(selectedDebt.id);
        fetchDebts();
      } else {
        alert("Failed to delete payment");
      }
    } catch (err) {
      console.error("Failed to delete payment:", err);
      alert("Failed to delete payment");
    }
  };

  /* ─── Filtered debts ─── */
  const displayedDebts = debts.filter((d) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      d.name.toLowerCase().includes(q) ||
      d.lenderName.toLowerCase().includes(q)
    );
  });

  /* ─── Status badge helpers ─── */
  const debtStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2.5 py-0.5 text-xs font-medium text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-3 w-3" /> Paid
          </span>
        );
      case "overdue":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-medium text-red-600 dark:text-red-400">
            <AlertTriangle className="h-3 w-3" /> Overdue
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-2.5 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400">
            <Clock className="h-3 w-3" /> Active
          </span>
        );
    }
  };

  const paymentStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2.5 py-0.5 text-xs font-medium text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-3 w-3" /> Paid
          </span>
        );
      case "missed":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-medium text-red-600 dark:text-red-400">
            <AlertTriangle className="h-3 w-3" /> Missed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/15 px-2.5 py-0.5 text-xs font-medium text-yellow-600 dark:text-yellow-400">
            <Clock className="h-3 w-3" /> Scheduled
          </span>
        );
    }
  };

  const periodBadge = (period: string) => {
    if (period === "custom") return null;
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/15 px-2 py-0.5 text-xs font-medium text-violet-600 dark:text-violet-400">
        <Repeat className="h-3 w-3" />
        {period === "weekly" ? "Weekly" : "Monthly"}
      </span>
    );
  };

  /* ═══════════════════════════════════════
     DETAIL VIEW — if a debt is selected
     ═══════════════════════════════════════ */
  if (selectedDebt) {
    const debt = selectedDebt;
    const paidPct =
      debt.totalAmount > 0
        ? Math.round(((debt.totalAmount - debt.remainingBalance) / debt.totalAmount) * 100)
        : 0;

    return (
      <div className="min-h-screen bg-background p-3 sm:p-6">
        <div className="mx-auto max-w-5xl space-y-6">
          {/* Back */}
          <button
            onClick={() => setSelectedDebt(null)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Debts
          </button>

          {loadingDetail ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : (
            <>
              {/* Debt header card */}
              <div
                className={`rounded-xl border p-4 sm:p-6 ${
                  debt.status === "paid"
                    ? "bg-green-500/5 border-green-500/20"
                    : debt.status === "overdue"
                    ? "bg-red-500/5 border-red-500/20"
                    : "bg-card border-border"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h1
                        className={`text-2xl font-bold ${
                          debt.status === "paid"
                            ? "text-muted-foreground line-through"
                            : "text-foreground"
                        }`}
                      >
                        {debt.name}
                      </h1>
                      {debtStatusBadge(debt.status)}
                      {periodBadge(debt.paymentPeriod)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Lender: <span className="text-foreground font-medium">{debt.lenderName}</span>
                    </p>
                    {debt.purpose && (
                      <p className="text-sm text-muted-foreground mt-1">{debt.purpose}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => openEditDebt(debt)}
                      className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                    >
                      <Pencil className="h-4 w-4" /> Edit
                    </button>
                    <button
                      onClick={() => setDeleteDebt(debt)}
                      className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-2 text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-muted/80 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" /> Delete
                    </button>
                  </div>
                </div>

                {/* Stats row */}
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total</p>
                    <p className="text-lg font-bold text-foreground">{formatCurrency(debt.totalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Remaining</p>
                    <p className={`text-lg font-bold ${debt.status === "paid" ? "text-green-600 dark:text-green-400" : debt.status === "overdue" ? "text-red-600 dark:text-red-400" : "text-foreground"}`}>
                      {formatCurrency(debt.remainingBalance)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Start Date</p>
                    <p className="text-sm font-medium text-foreground">{formatDate(debt.startDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Deadline</p>
                    <p className="text-sm font-medium text-foreground">{debt.deadline ? formatDate(debt.deadline) : "—"}</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>Progress</span>
                    <span>{paidPct}% paid</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        debt.status === "paid"
                          ? "bg-green-500"
                          : debt.status === "overdue"
                          ? "bg-red-500"
                          : "bg-primary"
                      }`}
                      style={{ width: `${paidPct}%` }}
                    />
                  </div>
                </div>

                {/* Extra info */}
                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                  {debt.fixedInstallmentAmount && (
                    <span>
                      Installment: <span className="text-foreground font-medium">{formatCurrency(debt.fixedInstallmentAmount)}</span>
                    </span>
                  )}
                  {!debt.fixedInstallmentAmount && (
                    <span className="italic">Variable installments</span>
                  )}
                  <span>
                    Period: <span className="text-foreground font-medium capitalize">{debt.paymentPeriod}</span>
                  </span>
                  {debt.notes && <span className="basis-full pt-1 text-xs">{debt.notes}</span>}
                </div>
              </div>

              {/* Payment entries */}
              <div className="rounded-xl bg-card border border-border overflow-hidden">
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-primary" />
                    <h2 className="text-lg font-semibold text-foreground">Payments</h2>
                    <span className="text-sm text-muted-foreground">
                      ({debt.payments?.length || 0})
                    </span>
                  </div>
                  <button
                    onClick={openAddPayment}
                    className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <Plus className="h-4 w-4" /> Add Payment
                  </button>
                </div>

                {!debt.payments?.length ? (
                  <div className="p-12 text-center text-muted-foreground">
                    <Banknote className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p>No payments recorded yet.</p>
                    <button
                      onClick={openAddPayment}
                      className="mt-3 text-primary text-sm underline"
                    >
                      Record your first payment
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Mobile card view for payments */}
                    <div className="divide-y divide-border sm:hidden">
                      {debt.payments.map((p) => (
                        <div
                          key={p.id}
                          className={`p-3 ${p.status === "paid" ? "opacity-70" : ""}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className={`font-medium text-sm ${p.status === "paid" ? "text-green-600 dark:text-green-400" : "text-foreground"}`}>
                                  {formatCurrency(p.amount)}
                                </span>
                                {paymentStatusBadge(p.status)}
                              </div>
                              <p className="text-xs text-muted-foreground">{formatDate(p.paymentDate)}</p>
                              {p.note && <p className="text-xs text-muted-foreground truncate max-w-50">{p.note}</p>}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => openEditPayment(p)}
                                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-primary transition-colors"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setDeletePayment(p)}
                                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop table view for payments */}
                    <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/50 text-left">
                          <th className="px-4 sm:px-6 py-3 font-semibold text-muted-foreground">Date</th>
                          <th className="px-4 sm:px-6 py-3 font-semibold text-muted-foreground">Amount</th>
                          <th className="px-4 sm:px-6 py-3 font-semibold text-muted-foreground">Status</th>
                          <th className="px-4 sm:px-6 py-3 font-semibold text-muted-foreground">Note</th>
                          <th className="px-4 sm:px-6 py-3 font-semibold text-muted-foreground text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {debt.payments.map((p) => (
                          <tr
                            key={p.id}
                            className={`transition-colors hover:bg-muted/50 ${
                              p.status === "paid" ? "opacity-70" : ""
                            }`}
                          >
                            <td className="px-4 sm:px-6 py-3 text-foreground">
                              {formatDate(p.paymentDate)}
                            </td>
                            <td className={`px-4 sm:px-6 py-3 font-medium ${p.status === "paid" ? "text-green-600 dark:text-green-400" : "text-foreground"}`}>
                              {formatCurrency(p.amount)}
                            </td>
                            <td className="px-4 sm:px-6 py-3">{paymentStatusBadge(p.status)}</td>
                            <td className="px-4 sm:px-6 py-3 text-muted-foreground max-w-50 truncate">
                              {p.note || "—"}
                            </td>
                            <td className="px-4 sm:px-6 py-3">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => openEditPayment(p)}
                                  className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-primary transition-colors"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => setDeletePayment(p)}
                                  className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-destructive transition-colors"
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
        </div>

        {/* ──── Payment Modal ──── */}
        {isPaymentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70" onClick={() => { setIsPaymentModalOpen(false); setEditingPayment(null); }} />
            <div className="relative w-full max-w-md rounded-xl bg-card border border-border shadow-2xl">
              <div className="flex items-center justify-between p-6 pb-2">
                <h2 className="text-xl font-bold text-foreground">
                  {editingPayment ? "Edit Payment" : "Add Payment"}
                </h2>
                <button
                  onClick={() => { setIsPaymentModalOpen(false); setEditingPayment(null); }}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleSubmitPayment} className="p-6 pt-4 space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Amount <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    className="w-full rounded-lg bg-input border border-border px-4 py-2.5 text-foreground placeholder-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Payment Date <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentForm.paymentDate}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                    className="w-full rounded-lg bg-input border border-border px-4 py-2.5 text-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Status</label>
                  <select
                    value={paymentForm.status}
                    onChange={(e) => setPaymentForm({ ...paymentForm, status: e.target.value as PaymentFormData["status"] })}
                    className="w-full rounded-lg bg-input border border-border px-4 py-2.5 text-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                  >
                    <option value="paid">Paid</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="missed">Missed</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Note</label>
                  <textarea
                    value={paymentForm.note}
                    onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })}
                    className="w-full rounded-lg bg-input border border-border px-4 py-2.5 text-foreground placeholder-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring resize-none"
                    placeholder="Optional note"
                    rows={2}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setIsPaymentModalOpen(false); setEditingPayment(null); }}
                    className="flex-1 rounded-lg bg-muted px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/80 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPaymentSubmitting}
                    className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {isPaymentSubmitting ? "Saving..." : editingPayment ? "Save Changes" : "Add Payment"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ──── Delete Payment Confirm ──── */}
        {deletePayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70" onClick={() => setDeletePayment(null)} />
            <div className="relative w-full max-w-md rounded-xl bg-popover border border-border p-6 shadow-2xl">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <Trash2 className="h-6 w-6 text-destructive" />
              </div>
              <h2 className="mb-2 text-xl font-bold text-foreground">Delete Payment</h2>
              <p className="mb-6 text-muted-foreground">
                Delete payment of <span className="font-medium text-foreground">{formatCurrency(deletePayment.amount)}</span> on{" "}
                {formatDate(deletePayment.paymentDate)}? This may change the debt balance.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeletePayment(null)} className="flex-1 rounded-lg bg-muted px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/80 transition-colors">Cancel</button>
                <button onClick={handleDeletePayment} className="flex-1 rounded-lg bg-destructive px-4 py-2.5 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors">Delete</button>
              </div>
            </div>
          </div>
        )}

        {/* ──── Debt Modals (also available in detail) ──── */}
        {renderDebtModal()}
        {renderDeleteDebtConfirm()}
      </div>
    );
  }

  /* ═══════════════════════════════════════
     HELPER: Debt Modal (shared)
     ═══════════════════════════════════════ */
  function renderDebtModal() {
    if (!isDebtModalOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/70" onClick={() => { setIsDebtModalOpen(false); setEditingDebt(null); }} />
        <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-xl bg-card border border-border shadow-2xl">
          <div className="flex items-center justify-between p-6 pb-2 shrink-0">
            <h2 className="text-xl font-bold text-foreground">
              {editingDebt ? "Edit Debt" : "Add New Debt"}
            </h2>
            <button
              onClick={() => { setIsDebtModalOpen(false); setEditingDebt(null); }}
              className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            <form id="debt-form" onSubmit={handleSubmitDebt} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={debtForm.name}
                  onChange={(e) => setDebtForm({ ...debtForm, name: e.target.value })}
                  className="w-full rounded-lg bg-input border border-border px-4 py-2.5 text-foreground placeholder-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                  placeholder="e.g. Car loan, Rent advance"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Purpose</label>
                <textarea
                  value={debtForm.purpose}
                  onChange={(e) => setDebtForm({ ...debtForm, purpose: e.target.value })}
                  className="w-full rounded-lg bg-input border border-border px-4 py-2.5 text-foreground placeholder-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring resize-none"
                  placeholder="Why this debt was taken"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Total Amount <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    value={debtForm.totalAmount}
                    onChange={(e) => setDebtForm({ ...debtForm, totalAmount: e.target.value })}
                    className="w-full rounded-lg bg-input border border-border px-4 py-2.5 text-foreground placeholder-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Lender Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={debtForm.lenderName}
                    onChange={(e) => setDebtForm({ ...debtForm, lenderName: e.target.value })}
                    className="w-full rounded-lg bg-input border border-border px-4 py-2.5 text-foreground placeholder-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                    placeholder="Person or entity"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Start Date <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={debtForm.startDate}
                    onChange={(e) => setDebtForm({ ...debtForm, startDate: e.target.value })}
                    className="w-full rounded-lg bg-input border border-border px-4 py-2.5 text-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Deadline</label>
                  <input
                    type="date"
                    value={debtForm.deadline}
                    onChange={(e) => setDebtForm({ ...debtForm, deadline: e.target.value })}
                    className="w-full rounded-lg bg-input border border-border px-4 py-2.5 text-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Payment Period <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={debtForm.paymentPeriod}
                    onChange={(e) => setDebtForm({ ...debtForm, paymentPeriod: e.target.value as DebtFormData["paymentPeriod"] })}
                    className="w-full rounded-lg bg-input border border-border px-4 py-2.5 text-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Fixed Installment
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={debtForm.fixedInstallmentAmount}
                    onChange={(e) => setDebtForm({ ...debtForm, fixedInstallmentAmount: e.target.value })}
                    className="w-full rounded-lg bg-input border border-border px-4 py-2.5 text-foreground placeholder-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                    placeholder="Leave empty for variable"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Notes</label>
                <textarea
                  value={debtForm.notes}
                  onChange={(e) => setDebtForm({ ...debtForm, notes: e.target.value })}
                  className="w-full rounded-lg bg-input border border-border px-4 py-2.5 text-foreground placeholder-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring resize-none"
                  placeholder="Optional notes"
                  rows={2}
                />
              </div>
            </form>
          </div>

          <div className="p-6 pt-2 shrink-0 flex gap-3 bg-card rounded-b-xl border-t border-border">
            <button
              type="button"
              onClick={() => { setIsDebtModalOpen(false); setEditingDebt(null); }}
              className="flex-1 rounded-lg bg-muted px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/80 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="debt-form"
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? "Saving..." : editingDebt ? "Save Changes" : "Add Debt"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderDeleteDebtConfirm() {
    if (!deleteDebt) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/70" onClick={() => setDeleteDebt(null)} />
        <div className="relative w-full max-w-md rounded-xl bg-popover border border-border p-6 shadow-2xl">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <Trash2 className="h-6 w-6 text-destructive" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-foreground">Delete Debt</h2>
          <p className="mb-6 text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-medium text-foreground">{deleteDebt.name}</span>?
            This will also delete all payment entries. This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteDebt(null)} className="flex-1 rounded-lg bg-muted px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/80 transition-colors">Cancel</button>
            <button onClick={handleDeleteDebt} className="flex-1 rounded-lg bg-destructive px-4 py-2.5 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors">Delete</button>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════
     LIST VIEW
     ═══════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-background p-3 sm:p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Debts</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">Track and manage your debts and payments</p>
          </div>
          <button
            onClick={openAddDebt}
            className="flex items-center gap-2 rounded-lg bg-primary px-3 sm:px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span className="sm:hidden">Add</span>
            <span className="hidden sm:inline">Add Debt</span>
          </button>
        </div>

        {/* Filters Bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search debts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg bg-input border border-border pl-10 pr-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="flex rounded-lg bg-input p-1 border border-border overflow-x-auto">
            {[
              { value: "", label: "All" },
              { value: "active", label: "Active" },
              { value: "overdue", label: "Overdue" },
              { value: "paid", label: "Paid" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  statusFilter === opt.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        {!loading && debts.length > 0 && (
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Owed</p>
              <p className="text-xl font-bold text-foreground">
                {formatCurrency(debts.filter((d) => d.status !== "paid").reduce((s, d) => s + d.remainingBalance, 0))}
              </p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Active Debts</p>
              <p className="text-xl font-bold text-foreground">
                {debts.filter((d) => d.status === "active").length}
              </p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Overdue</p>
              <p className="text-xl font-bold text-red-600 dark:text-red-400">
                {debts.filter((d) => d.status === "overdue").length}
              </p>
            </div>
          </div>
        )}

        {/* Debts List */}
        <div className="rounded-xl bg-card border border-border overflow-hidden">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : displayedDebts.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <div className="mb-4 rounded-full bg-muted p-4">
                <CreditCard className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground">No debts found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchQuery || statusFilter
                  ? "Try adjusting your filters."
                  : "Get started by adding your first debt."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {displayedDebts.map((debt) => {
                const paidPct =
                  debt.totalAmount > 0
                    ? Math.round(((debt.totalAmount - debt.remainingBalance) / debt.totalAmount) * 100)
                    : 0;

                return (
                  <div
                    key={debt.id}
                    onClick={() => fetchDebtDetail(debt.id)}
                    className={`px-4 sm:px-6 py-4 sm:py-5 cursor-pointer transition-colors hover:bg-muted/50 ${
                      debt.status === "paid" ? "opacity-60" : ""
                    } ${debt.status === "overdue" ? "border-l-4 border-l-red-500" : ""}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3
                            className={`text-base font-semibold truncate ${
                              debt.status === "paid"
                                ? "text-muted-foreground line-through"
                                : "text-foreground"
                            }`}
                          >
                            {debt.name}
                          </h3>
                          {debtStatusBadge(debt.status)}
                          {periodBadge(debt.paymentPeriod)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Lender: {debt.lenderName}</span>
                          {debt.nextPaymentDate && (
                            <span className="flex items-center gap-1">
                              <CalendarDays className="h-3 w-3" />
                              Next: {formatDate(debt.nextPaymentDate)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-6 shrink-0">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Remaining</p>
                          <p className={`text-lg font-bold ${
                            debt.status === "paid"
                              ? "text-green-600 dark:text-green-400"
                              : debt.status === "overdue"
                              ? "text-red-600 dark:text-red-400"
                              : "text-foreground"
                          }`}>
                            {formatCurrency(debt.remainingBalance)}
                          </p>
                        </div>
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-muted-foreground">Total</p>
                          <p className="text-sm font-medium text-muted-foreground">{formatCurrency(debt.totalAmount)}</p>
                        </div>
                        <div className="w-16">
                          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                debt.status === "paid"
                                  ? "bg-green-500"
                                  : debt.status === "overdue"
                                  ? "bg-red-500"
                                  : "bg-primary"
                              }`}
                              style={{ width: `${paidPct}%` }}
                            />
                          </div>
                          <p className="text-center text-xs text-muted-foreground mt-0.5">{paidPct}%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modals available on both views */}
      {renderDebtModal()}
      {renderDeleteDebtConfirm()}
    </div>
  );
}
