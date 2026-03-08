"use client";

import { useEffect, useState, useCallback } from "react";
import PageHeader from "@/components/layout/page-header";
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
  assetId: string;
  amount: number;
  paymentDate: string;
  status: "scheduled" | "paid" | "missed";
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Asset {
  id: string;
  name: string;
  purpose: string | null;
  totalAmount: number;
  remainingBalance: number;
  counterparty: string;
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

interface AssetFormData {
  name: string;
  purpose: string;
  totalAmount: string;
  counterparty: string;
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

const emptyAssetForm: AssetFormData = {
  name: "",
  purpose: "",
  totalAmount: "",
  counterparty: "",
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

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [assetForm, setAssetForm] = useState<AssetFormData>(emptyAssetForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteAsset, setDeleteAsset] = useState<Asset | null>(null);

  // Detail view
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Payment modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentEntry | null>(null);
  const [paymentForm, setPaymentForm] = useState<PaymentFormData>(emptyPaymentForm);
  const [isPaymentSubmitting, setIsPaymentSubmitting] = useState(false);
  const [deletePayment, setDeletePayment] = useState<PaymentEntry | null>(null);

  /* ─── Fetch assets list ─── */
  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/debts?type=asset&${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAssets(data.debts || []);
      }
    } catch (err) {
      console.error("Failed to fetch assets:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  /* ─── Fetch single asset detail with payments ─── */
  const fetchAssetDetail = useCallback(async (assetId: string) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/debts/${assetId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedAsset(data.debt);
      }
    } catch (err) {
      console.error("Failed to fetch asset detail:", err);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  /* ───────────── Asset CRUD ───────────── */

  const openAddAsset = () => {
    setEditingAsset(null);
    setAssetForm(emptyAssetForm);
    setIsAssetModalOpen(true);
  };

  const openEditAsset = (asset: Asset) => {
    setEditingAsset(asset);
    setAssetForm({
      name: asset.name,
      purpose: asset.purpose || "",
      totalAmount: asset.totalAmount.toString(),
      counterparty: asset.counterparty,
      startDate: asset.startDate ? asset.startDate.split("T")[0] : "",
      deadline: asset.deadline ? asset.deadline.split("T")[0] : "",
      paymentPeriod: asset.paymentPeriod,
      fixedInstallmentAmount: asset.fixedInstallmentAmount?.toString() || "",
      notes: asset.notes || "",
    });
    setIsAssetModalOpen(true);
  };

  const handleSubmitAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const totalAmount = parseFloat(assetForm.totalAmount);
    if (isNaN(totalAmount) || totalAmount <= 0) {
      alert("Please enter a valid total amount");
      setIsSubmitting(false);
      return;
    }

    const fixedAmt = assetForm.fixedInstallmentAmount ? parseFloat(assetForm.fixedInstallmentAmount) : null;
    if (fixedAmt !== null && (isNaN(fixedAmt) || fixedAmt <= 0)) {
      alert("Fixed installment amount must be positive or empty");
      setIsSubmitting(false);
      return;
    }

    const payload = {
      name: assetForm.name,
      purpose: assetForm.purpose.trim() || null,
      totalAmount,
      counterparty: assetForm.counterparty,
      startDate: assetForm.startDate,
      deadline: assetForm.deadline || null,
      paymentPeriod: assetForm.paymentPeriod,
      fixedInstallmentAmount: fixedAmt,
      notes: assetForm.notes.trim() || null,
      type: "asset",
    };

    try {
      const url = editingAsset ? `/api/debts/${editingAsset.id}` : "/api/debts";
      const method = editingAsset ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsAssetModalOpen(false);
        setEditingAsset(null);
        fetchAssets();
        // If we're editing the currently selected asset, refresh detail
        if (editingAsset && selectedAsset?.id === editingAsset.id) {
          fetchAssetDetail(editingAsset.id);
        }
      } else {
        const err = await res.json();
        alert(typeof err.error === "string" ? err.error : "Failed to save asset");
      }
    } catch (err) {
      console.error("Failed to save asset:", err);
      alert("Failed to save asset");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAsset = async () => {
    if (!deleteAsset) return;
    try {
      const res = await fetch(`/api/debts/${deleteAsset.id}`, { method: "DELETE" });
      if (res.ok) {
        setDeleteAsset(null);
        if (selectedAsset?.id === deleteAsset.id) setSelectedAsset(null);
        fetchAssets();
      } else {
        alert("Failed to delete asset");
      }
    } catch (err) {
      console.error("Failed to delete asset:", err);
      alert("Failed to delete asset");
    }
  };

  /* ───────────── Payment CRUD ───────────── */

  const openAddPayment = () => {
    setEditingPayment(null);
    setPaymentForm({
      ...emptyPaymentForm,
      amount: selectedAsset?.fixedInstallmentAmount?.toString() || "",
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
    if (!selectedAsset) return;
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
        ? `/api/debts/${selectedAsset.id}/payments/${editingPayment.id}`
        : `/api/debts/${selectedAsset.id}/payments`;
      const method = editingPayment ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsPaymentModalOpen(false);
        setEditingPayment(null);
        fetchAssetDetail(selectedAsset.id);
        fetchAssets();
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
    if (!deletePayment || !selectedAsset) return;
    try {
      const res = await fetch(
        `/api/debts/${selectedAsset.id}/payments/${deletePayment.id}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setDeletePayment(null);
        fetchAssetDetail(selectedAsset.id);
        fetchAssets();
      } else {
        alert("Failed to delete payment");
      }
    } catch (err) {
      console.error("Failed to delete payment:", err);
      alert("Failed to delete payment");
    }
  };

  /* ─── Filtered assets ─── */
  const displayedAssets = assets.filter((d) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      d.name.toLowerCase().includes(q) ||
      d.counterparty.toLowerCase().includes(q)
    );
  });

  /* ─── Status badge helpers ─── */
  const assetStatusBadge = (status: string) => {
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
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium text-primary">
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
     DETAIL VIEW — if a asset is selected
     ═══════════════════════════════════════ */
  if (selectedAsset) {
    const asset = selectedAsset;
    const paidPct =
      asset.totalAmount > 0
        ? Math.round(((asset.totalAmount - asset.remainingBalance) / asset.totalAmount) * 100)
        : 0;

    return (
      <div className="space-y-6 py-4">
        {/* Back */}
        <button
          onClick={() => setSelectedAsset(null)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Assets
        </button>

        {loadingDetail ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <>
            {/* Asset header card */}
            <div
              className={`rounded-xl border p-4 sm:p-6 ${asset.status === "paid"
                ? "bg-green-500/5 border-green-500/20"
                : asset.status === "overdue"
                  ? "bg-red-500/5 border-red-500/20"
                  : "bg-card border-border"
                }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1
                      className={`text-2xl font-bold ${asset.status === "paid"
                        ? "text-muted-foreground line-through"
                        : "text-foreground"
                        }`}
                    >
                      {asset.name}
                    </h1>
                    {assetStatusBadge(asset.status)}
                    {periodBadge(asset.paymentPeriod)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Counterparty: <span className="text-foreground font-medium">{asset.counterparty}</span>
                  </p>
                  {asset.purpose && (
                    <p className="text-sm text-muted-foreground mt-1">{asset.purpose}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => openEditAsset(asset)}
                    className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                  >
                    <Pencil className="h-4 w-4" /> Edit
                  </button>
                  <button
                    onClick={() => setDeleteAsset(asset)}
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
                  <p className="text-lg font-bold text-foreground">{formatCurrency(asset.totalAmount)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Remaining</p>
                  <p className={`text-lg font-bold ${asset.status === "paid" ? "text-green-600 dark:text-green-400" : asset.status === "overdue" ? "text-red-600 dark:text-red-400" : "text-foreground"}`}>
                    {formatCurrency(asset.remainingBalance)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Start Date</p>
                  <p className="text-sm font-medium text-foreground">{formatDate(asset.startDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Deadline</p>
                  <p className="text-sm font-medium text-foreground">{asset.deadline ? formatDate(asset.deadline) : "—"}</p>
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
                    className={`h-full rounded-full transition-all duration-500 ${asset.status === "paid"
                      ? "bg-green-500"
                      : asset.status === "overdue"
                        ? "bg-red-500"
                        : "bg-primary"
                      }`}
                    style={{ width: `${paidPct}%` }}
                  />
                </div>
              </div>

              {/* Extra info */}
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                {asset.fixedInstallmentAmount && (
                  <span>
                    Installment: <span className="text-foreground font-medium">{formatCurrency(asset.fixedInstallmentAmount)}</span>
                  </span>
                )}
                {!asset.fixedInstallmentAmount && (
                  <span className="italic">Variable installments</span>
                )}
                <span>
                  Period: <span className="text-foreground font-medium capitalize">{asset.paymentPeriod}</span>
                </span>
                {asset.notes && <span className="basis-full pt-1 text-xs">{asset.notes}</span>}
              </div>
            </div>

            {/* Payment entries */}
            <div className="rounded-xl bg-card border border-border overflow-hidden">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">Payments</h2>
                  <span className="text-sm text-muted-foreground">
                    ({asset.payments?.length || 0})
                  </span>
                </div>
                <button
                  onClick={openAddPayment}
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Plus className="h-4 w-4" /> Add Payment
                </button>
              </div>

              {!asset.payments?.length ? (
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
                    {asset.payments.map((p) => (
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
                        {asset.payments.map((p) => (
                          <tr
                            key={p.id}
                            className={`transition-colors hover:bg-muted/50 ${p.status === "paid" ? "opacity-70" : ""
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
                    className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
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
                {formatDate(deletePayment.paymentDate)}? This may change the asset balance.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeletePayment(null)} className="flex-1 rounded-lg bg-muted px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/80 transition-colors">Cancel</button>
                <button onClick={handleDeletePayment} className="flex-1 rounded-lg bg-destructive px-4 py-2.5 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors">Delete</button>
              </div>
            </div>
          </div>
        )}

        {/* ──── Asset Modals (also available in detail) ──── */}
        {renderAssetModal()}
        {renderDeleteAssetConfirm()}
      </div>
    );
  }

  /* ═══════════════════════════════════════
     HELPER: Asset Modal (shared)
     ═══════════════════════════════════════ */
  function renderAssetModal() {
    if (!isAssetModalOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/70" onClick={() => { setIsAssetModalOpen(false); setEditingAsset(null); }} />
        <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-xl bg-card border border-border shadow-2xl">
          <div className="flex items-center justify-between p-6 pb-2 shrink-0">
            <h2 className="text-xl font-bold text-foreground">
              {editingAsset ? "Edit Asset" : "Add New Asset"}
            </h2>
            <button
              onClick={() => { setIsAssetModalOpen(false); setEditingAsset(null); }}
              className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            <form id="asset-form" onSubmit={handleSubmitAsset} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={assetForm.name}
                  onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
                  className="w-full rounded-lg bg-input border border-border px-4 py-2.5 text-foreground placeholder-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                  placeholder="e.g. Car loan, Rent advance"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Purpose</label>
                <textarea
                  value={assetForm.purpose}
                  onChange={(e) => setAssetForm({ ...assetForm, purpose: e.target.value })}
                  className="w-full rounded-lg bg-input border border-border px-4 py-2.5 text-foreground placeholder-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring resize-none"
                  placeholder="Why this asset was taken"
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
                    value={assetForm.totalAmount}
                    onChange={(e) => setAssetForm({ ...assetForm, totalAmount: e.target.value })}
                    className="w-full rounded-lg bg-input border border-border px-4 py-2.5 text-foreground placeholder-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Counterparty <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={assetForm.counterparty}
                    onChange={(e) => setAssetForm({ ...assetForm, counterparty: e.target.value })}
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
                    value={assetForm.startDate}
                    onChange={(e) => setAssetForm({ ...assetForm, startDate: e.target.value })}
                    className="w-full rounded-lg bg-input border border-border px-4 py-2.5 text-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Deadline</label>
                  <input
                    type="date"
                    value={assetForm.deadline}
                    onChange={(e) => setAssetForm({ ...assetForm, deadline: e.target.value })}
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
                    value={assetForm.paymentPeriod}
                    onChange={(e) => setAssetForm({ ...assetForm, paymentPeriod: e.target.value as AssetFormData["paymentPeriod"] })}
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
                    value={assetForm.fixedInstallmentAmount}
                    onChange={(e) => setAssetForm({ ...assetForm, fixedInstallmentAmount: e.target.value })}
                    className="w-full rounded-lg bg-input border border-border px-4 py-2.5 text-foreground placeholder-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                    placeholder="Leave empty for variable"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Notes</label>
                <textarea
                  value={assetForm.notes}
                  onChange={(e) => setAssetForm({ ...assetForm, notes: e.target.value })}
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
              onClick={() => { setIsAssetModalOpen(false); setEditingAsset(null); }}
              className="flex-1 rounded-lg bg-muted px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/80 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="asset-form"
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? "Saving..." : editingAsset ? "Save Changes" : "Add Asset"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderDeleteAssetConfirm() {
    if (!deleteAsset) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/70" onClick={() => setDeleteAsset(null)} />
        <div className="relative w-full max-w-md rounded-xl bg-popover border border-border p-6 shadow-2xl">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <Trash2 className="h-6 w-6 text-destructive" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-foreground">Delete Asset</h2>
          <p className="mb-6 text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-medium text-foreground">{deleteAsset.name}</span>?
            This will also delete all payment entries. This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteAsset(null)} className="flex-1 rounded-lg bg-muted px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/80 transition-colors">Cancel</button>
            <button onClick={handleDeleteAsset} className="flex-1 rounded-lg bg-destructive px-4 py-2.5 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors">Delete</button>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════
     LIST VIEW
     ═══════════════════════════════════════ */
  return (
    <div className="space-y-6 py-4">
      <div className="flex items-center justify-between gap-3">
        <PageHeader title="Assets" description="Track and manage your assets and payments" />
        <button
          onClick={openAddAsset}
          className="flex items-center gap-2 bg-primary px-3 sm:px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 shrink-0"
          style={{ height: "40px", borderRadius: "9999px" }}
        >
          <Plus className="h-4 w-4" />
          <span className="sm:hidden">Add</span>
          <span className="hidden sm:inline">Add Asset</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search assets..."
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
              className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${statusFilter === opt.value
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
      {!loading && assets.length > 0 && (
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Owed</p>
            <p className="text-xl font-bold text-foreground">
              {formatCurrency(assets.filter((d) => d.status !== "paid").reduce((s, d) => s + d.remainingBalance, 0))}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Active Assets</p>
            <p className="text-xl font-bold text-foreground">
              {assets.filter((d) => d.status === "active").length}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Overdue</p>
            <p className="text-xl font-bold text-red-600 dark:text-red-400">
              {assets.filter((d) => d.status === "overdue").length}
            </p>
          </div>
        </div>
      )}

      {/* Assets List */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : displayedAssets.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-center">
            <div className="mb-4 rounded-full bg-muted p-4">
              <CreditCard className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground">No assets found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {searchQuery || statusFilter
                ? "Try adjusting your filters."
                : "Get started by adding your first asset."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {displayedAssets.map((asset) => {
              const paidPct =
                asset.totalAmount > 0
                  ? Math.round(((asset.totalAmount - asset.remainingBalance) / asset.totalAmount) * 100)
                  : 0;

              return (
                <div
                  key={asset.id}
                  onClick={() => fetchAssetDetail(asset.id)}
                  className={`px-4 sm:px-6 py-4 sm:py-5 cursor-pointer transition-colors hover:bg-muted/50 ${asset.status === "paid" ? "opacity-60" : ""
                    } ${asset.status === "overdue" ? "border-l-4 border-l-red-500" : ""}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3
                          className={`text-base font-semibold truncate ${asset.status === "paid"
                            ? "text-muted-foreground line-through"
                            : "text-foreground"
                            }`}
                        >
                          {asset.name}
                        </h3>
                        {assetStatusBadge(asset.status)}
                        {periodBadge(asset.paymentPeriod)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Counterparty: {asset.counterparty}</span>
                        {asset.nextPaymentDate && (
                          <span className="flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" />
                            Next: {formatDate(asset.nextPaymentDate)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-6 shrink-0">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Remaining</p>
                        <p className={`text-lg font-bold ${asset.status === "paid"
                          ? "text-green-600 dark:text-green-400"
                          : asset.status === "overdue"
                            ? "text-red-600 dark:text-red-400"
                            : "text-foreground"
                          }`}>
                          {formatCurrency(asset.remainingBalance)}
                        </p>
                      </div>
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="text-sm font-medium text-muted-foreground">{formatCurrency(asset.totalAmount)}</p>
                      </div>
                      <div className="w-16">
                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full ${asset.status === "paid"
                              ? "bg-green-500"
                              : asset.status === "overdue"
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

      {/* Modals available on both views */}
      {renderAssetModal()}
      {renderDeleteAssetConfirm()}
    </div>
  );
}
