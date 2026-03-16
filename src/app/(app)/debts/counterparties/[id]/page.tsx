"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  Clock,
  Pencil,
  Plus,
  Repeat,
  Trash2,
  User,
  X,
} from "lucide-react";
import type { CounterpartyDebtRecord, DebtDirection, PaymentRecord, PaymentStatus } from "@/types/debt";

interface CounterpartyDetail {
  id: string;
  name: string;
  balance: number;
}

interface CounterpartyDetailResponse {
  counterparty?: CounterpartyDetail;
  records?: CounterpartyDebtRecord[];
  payments?: PaymentRecord[];
  error?: string;
}

interface CounterpartyFormData {
  name: string;
}

interface RecordFormData {
  name: string;
  purpose: string;
  totalAmount: string;
  direction: DebtDirection;
  startDate: string;
  deadline: string;
  paymentPeriod: "weekly" | "monthly" | "custom";
  installmentAmount: string;
  notes: string;
}

interface PaymentFormData {
  debtId: string;
  amount: string;
  paymentDate: string;
  status: PaymentStatus;
  note: string;
}

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Math.abs(amount));

const formatDate = (dateString: string): string =>
  new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const emptyRecordForm: RecordFormData = {
  name: "",
  purpose: "",
  totalAmount: "",
  direction: "i_owe",
  startDate: new Date().toISOString().split("T")[0],
  deadline: "",
  paymentPeriod: "monthly",
  installmentAmount: "",
  notes: "",
};

const emptyPaymentForm: PaymentFormData = {
  debtId: "",
  amount: "",
  paymentDate: new Date().toISOString().split("T")[0],
  status: "paid",
  note: "",
};

export default function CounterpartyDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const counterpartyId = params.id;

  const [counterparty, setCounterparty] = useState<CounterpartyDetail | null>(null);
  const [records, setRecords] = useState<CounterpartyDebtRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCpModalOpen, setIsCpModalOpen] = useState(false);
  const [cpForm, setCpForm] = useState<CounterpartyFormData>({ name: "" });
  const [isSubmittingCp, setIsSubmittingCp] = useState(false);
  const [deleteCpOpen, setDeleteCpOpen] = useState(false);

  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CounterpartyDebtRecord | null>(null);
  const [recordForm, setRecordForm] = useState<RecordFormData>(emptyRecordForm);
  const [isSubmittingRecord, setIsSubmittingRecord] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState<CounterpartyDebtRecord | null>(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentRecord | null>(null);
  const [paymentForm, setPaymentForm] = useState<PaymentFormData>(emptyPaymentForm);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [deletePayment, setDeletePayment] = useState<PaymentRecord | null>(null);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/counterparties/${counterpartyId}/records`);
      const payload = (await response.json()) as CounterpartyDetailResponse;

      if (!response.ok) {
        setError(payload.error || "Failed to load counterparty details");
        setCounterparty(null);
        setRecords([]);
        setPayments([]);
        return;
      }

      setCounterparty(payload.counterparty || null);
      setRecords(payload.records || []);
      setPayments(payload.payments || []);
    } catch (fetchError) {
      console.error("Failed to load counterparty details:", fetchError);
      setError("Failed to load counterparty details");
      setCounterparty(null);
      setRecords([]);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [counterpartyId]);

  useEffect(() => {
    if (counterpartyId) {
      void fetchDetail();
    }
  }, [counterpartyId, fetchDetail]);

  const getBalanceColorClass = (balance: number) => {
    if (balance > 0) return "text-green-600 dark:text-green-400";
    if (balance < 0) return "text-red-600 dark:text-red-400";
    return "text-muted-foreground";
  };

  const periodBadge = (period: string) => {
    if (period === "custom" || !period) return null;

    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-medium text-violet-600 dark:text-violet-400">
        <Repeat className="h-3 w-3" />
        {period === "weekly" ? "Weekly" : "Monthly"}
      </span>
    );
  };

  const openEditCounterparty = () => {
    if (!counterparty) return;
    setCpForm({ name: counterparty.name });
    setIsCpModalOpen(true);
  };

  const handleUpdateCounterparty = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!counterparty) return;

    setIsSubmittingCp(true);
    try {
      const response = await fetch(`/api/counterparties/${counterparty.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cpForm),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        alert(payload.error || "Failed to update counterparty");
        return;
      }

      setIsCpModalOpen(false);
      await fetchDetail();
    } catch (updateError) {
      console.error("Failed to update counterparty:", updateError);
      alert("Failed to update counterparty");
    } finally {
      setIsSubmittingCp(false);
    }
  };

  const handleDeleteCounterparty = async () => {
    if (!counterparty) return;

    try {
      const response = await fetch(`/api/counterparties/${counterparty.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        alert("Failed to delete counterparty");
        return;
      }

      router.push("/debts/counterparties");
    } catch (deleteError) {
      console.error("Failed to delete counterparty:", deleteError);
      alert("Failed to delete counterparty");
    }
  };

  const openAddRecord = () => {
    setEditingRecord(null);
    setRecordForm(emptyRecordForm);
    setIsRecordModalOpen(true);
  };

  const openEditRecord = (record: CounterpartyDebtRecord) => {
    setEditingRecord(record);
    setRecordForm({
      name: record.name,
      purpose: record.purpose || "",
      totalAmount: record.totalAmount.toString(),
      direction: record.direction,
      startDate: record.startDate ? record.startDate.split("T")[0] : "",
      deadline: record.deadline ? record.deadline.split("T")[0] : "",
      paymentPeriod: record.paymentPeriod,
      installmentAmount: record.installmentAmount?.toString() || "",
      notes: "",
    });
    setIsRecordModalOpen(true);
  };

  const handleSubmitRecord = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!counterparty) return;

    setIsSubmittingRecord(true);

    const totalAmount = parseFloat(recordForm.totalAmount);
    if (Number.isNaN(totalAmount) || totalAmount <= 0) {
      alert("Please enter a valid total amount");
      setIsSubmittingRecord(false);
      return;
    }

    const installmentAmount = recordForm.installmentAmount
      ? parseFloat(recordForm.installmentAmount)
      : null;

    if (
      installmentAmount !== null &&
      (Number.isNaN(installmentAmount) || installmentAmount <= 0)
    ) {
      alert("Fixed installment must be a positive amount");
      setIsSubmittingRecord(false);
      return;
    }

    try {
      const method = editingRecord ? "PATCH" : "POST";
      const url = editingRecord ? `/api/debts/${editingRecord.id}` : "/api/debts";
      const payload = {
        name: recordForm.name,
        purpose: recordForm.purpose.trim() || null,
        totalAmount,
        counterparty: counterparty.name,
        direction: recordForm.direction,
        startDate: recordForm.startDate,
        deadline: recordForm.deadline || null,
        paymentPeriod: recordForm.paymentPeriod,
        installmentAmount,
        notes: recordForm.notes.trim() || null,
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const payloadError = (await response.json()) as { error?: string };
        alert(payloadError.error || "Failed to save record");
        return;
      }

      setIsRecordModalOpen(false);
      setEditingRecord(null);
      await fetchDetail();
    } catch (submitError) {
      console.error("Failed to save record:", submitError);
      alert("Failed to save record");
    } finally {
      setIsSubmittingRecord(false);
    }
  };

  const handleDeleteRecord = async () => {
    if (!deleteRecord) return;

    try {
      const response = await fetch(`/api/debts/${deleteRecord.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        alert("Failed to delete record");
        return;
      }

      setDeleteRecord(null);
      await fetchDetail();
    } catch (deleteError) {
      console.error("Failed to delete record:", deleteError);
      alert("Failed to delete record");
    }
  };

  const openAddPayment = (debtId?: string) => {
    setEditingPayment(null);
    let defaultDebtId = debtId || "";

    if (!defaultDebtId && records.length > 0) {
      defaultDebtId = records[0].id;
    }

    setPaymentForm({ ...emptyPaymentForm, debtId: defaultDebtId });
    setIsPaymentModalOpen(true);
  };

  const openEditPayment = (payment: PaymentRecord) => {
    setEditingPayment(payment);
    setPaymentForm({
      debtId: payment.debtId,
      amount: payment.amount.toString(),
      paymentDate: payment.paymentDate ? payment.paymentDate.split("T")[0] : "",
      status: payment.status,
      note: payment.note || "",
    });
    setIsPaymentModalOpen(true);
  };

  const handleSubmitPayment = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!paymentForm.debtId) {
      alert("Please select a debt entry for this payment");
      return;
    }

    setIsSubmittingPayment(true);

    const amount = parseFloat(paymentForm.amount);
    if (Number.isNaN(amount) || amount <= 0) {
      alert("Please enter a valid payment amount");
      setIsSubmittingPayment(false);
      return;
    }

    try {
      const method = editingPayment ? "PATCH" : "POST";
      const url = editingPayment
        ? `/api/debts/${paymentForm.debtId}/payments/${editingPayment.id}`
        : `/api/debts/${paymentForm.debtId}/payments`;

      const payload = {
        amount,
        paymentDate: paymentForm.paymentDate,
        status: paymentForm.status,
        note: paymentForm.note.trim() || null,
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const payloadError = (await response.json()) as { error?: string };
        alert(payloadError.error || "Failed to save payment");
        return;
      }

      setIsPaymentModalOpen(false);
      setEditingPayment(null);
      await fetchDetail();
    } catch (submitError) {
      console.error("Failed to save payment:", submitError);
      alert("Failed to save payment");
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleDeletePayment = async () => {
    if (!deletePayment) return;

    try {
      const response = await fetch(`/api/debts/${deletePayment.debtId}/payments/${deletePayment.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        alert("Failed to delete payment");
        return;
      }

      setDeletePayment(null);
      await fetchDetail();
    } catch (deleteError) {
      console.error("Failed to delete payment:", deleteError);
      alert("Failed to delete payment");
    }
  };

  const recordById = useMemo(() => {
    const map: Record<string, CounterpartyDebtRecord> = {};
    for (const record of records) {
      map[record.id] = record;
    }
    return map;
  }, [records]);

  return (
    <div className="space-y-6 py-4">
      <button
        onClick={() => router.push("/debts/counterparties")}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Counterparties
      </button>

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-border bg-card">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : error || !counterparty ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-border bg-card px-4 text-center text-sm text-muted-foreground">
          {error || "Counterparty not found."}
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
                  <User className="h-6 w-6 text-primary" />
                  {counterparty.name}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Net Balance:{" "}
                  <span className={`font-bold ${getBalanceColorClass(counterparty.balance)}`}>
                    {counterparty.balance > 0 ? "+" : counterparty.balance < 0 ? "-" : ""}
                    {formatCurrency(counterparty.balance)}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={openEditCounterparty}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={() => setDeleteCpOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/80 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
            <section className="overflow-hidden rounded-xl border border-border bg-card xl:flex-1 xl:min-w-0">
              <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3 sm:px-6 sm:py-4">
                <div className="flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">Entries</h2>
                  <span className="text-sm text-muted-foreground">({records.length})</span>
                </div>
                <button
                  onClick={openAddRecord}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4" />
                  Add Entry
                </button>
              </div>

              {records.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">No entries found.</div>
              ) : (
                <div className="divide-y divide-border">
                  {records.map((record) => (
                    <div key={record.id} className="p-4 transition-colors hover:bg-muted/20 sm:px-6">
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-foreground">{record.name}</span>
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                                record.direction === "they_owe"
                                  ? "bg-green-500/15 text-green-600 dark:text-green-400"
                                  : "bg-red-500/15 text-red-600 dark:text-red-400"
                              }`}
                            >
                              {record.direction === "they_owe" ? "they owe" : "i owe"}
                            </span>
                            {record.status === "paid" && (
                              <span className="inline-flex rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-green-600 dark:text-green-400">
                                Paid
                              </span>
                            )}
                            {record.status === "overdue" && (
                              <span className="inline-flex rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-red-600 dark:text-red-400">
                                Overdue
                              </span>
                            )}
                            {periodBadge(record.paymentPeriod)}
                          </div>

                          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <CalendarDays className="h-3 w-3" />
                              {formatDate(record.startDate)}
                            </span>
                            {record.purpose && <span>{record.purpose}</span>}
                          </div>

                          <div className="mt-1 flex gap-4 border-t border-border/50 pt-2 text-xs">
                            <div>
                              <span className="text-muted-foreground">Total</span>
                              <p className="font-medium text-foreground">{formatCurrency(record.totalAmount)}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Paid</span>
                              <p
                                className={`font-medium ${
                                  record.direction === "they_owe"
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-red-600 dark:text-red-400"
                                }`}
                              >
                                {formatCurrency(record.paidAmount)}
                              </p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Remaining</span>
                              <p className="font-medium text-foreground">{formatCurrency(record.remainingAmount)}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openAddPayment(record.id)}
                            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-green-600"
                            title="Add payment"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => openEditRecord(record)}
                            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteRecord(record)}
                            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="overflow-hidden rounded-xl border border-border bg-card xl:flex-1 xl:min-w-0">
              <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3 sm:px-6 sm:py-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">Payment Entries</h2>
                  <span className="text-sm text-muted-foreground">({payments.length})</span>
                </div>
                <button
                  onClick={() => openAddPayment()}
                  disabled={records.length === 0}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  Add Payment
                </button>
              </div>

              {payments.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">No payments recorded yet.</div>
              ) : (
                <div className="divide-y divide-border">
                  {payments.map((payment) => {
                    const parentRecord = recordById[payment.debtId];
                    const isAsset = parentRecord?.direction === "they_owe";

                    return (
                      <div key={payment.id} className="p-4 transition-colors hover:bg-muted/20 sm:px-6">
                        <div className="flex items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-foreground">
                                {parentRecord ? parentRecord.name : "Unknown Entry"}
                              </span>
                              <span
                                className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                                  payment.status === "paid"
                                    ? "bg-green-500/15 text-green-600"
                                    : payment.status === "missed"
                                      ? "bg-red-500/15 text-red-600"
                                      : "bg-blue-500/15 text-blue-600"
                                }`}
                              >
                                {payment.status}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                              <span className="inline-flex items-center gap-1">
                                <CalendarDays className="h-3 w-3" />
                                {formatDate(payment.paymentDate)}
                              </span>
                              {payment.note && <span>{payment.note}</span>}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm font-semibold ${
                                isAsset
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-red-600 dark:text-red-400"
                              }`}
                            >
                              {isAsset ? "+" : "-"}
                              {formatCurrency(payment.amount)}
                            </span>
                            <button
                              onClick={() => openEditPayment(payment)}
                              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletePayment(payment)}
                              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </>
      )}

      {isCpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setIsCpModalOpen(false)} />
          <div className="relative w-full max-w-md rounded-xl border border-border bg-card shadow-2xl">
            <div className="flex items-center justify-between p-6 pb-2">
              <h2 className="text-xl font-bold text-foreground">Edit Counterparty</h2>
              <button
                onClick={() => setIsCpModalOpen(false)}
                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCounterparty} className="space-y-4 p-6 pt-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Name</label>
                <input
                  type="text"
                  required
                  value={cpForm.name}
                  onChange={(event) => setCpForm({ name: event.target.value })}
                  className="w-full rounded-lg border border-border bg-input px-4 py-2.5 text-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCpModalOpen(false)}
                  className="flex-1 rounded-lg bg-muted px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCp}
                  className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {isSubmittingCp ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteCpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setDeleteCpOpen(false)} />
          <div className="relative w-full max-w-md rounded-xl border border-border bg-popover p-6 shadow-2xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <Trash2 className="h-6 w-6 text-destructive" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-foreground">Delete Counterparty</h2>
            <p className="mb-6 text-muted-foreground">
              Are you sure you want to delete this counterparty? This will delete all linked entries and payment records.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteCpOpen(false)}
                className="flex-1 rounded-lg bg-muted px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/80"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCounterparty}
                className="flex-1 rounded-lg bg-destructive px-4 py-2.5 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => {
              setIsRecordModalOpen(false);
              setEditingRecord(null);
            }}
          />
          <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-xl border border-border bg-card shadow-2xl">
            <div className="flex shrink-0 items-center justify-between p-6 pb-2">
              <h2 className="text-xl font-bold text-foreground">
                {editingRecord ? "Edit Entry" : "Add Entry"}
              </h2>
              <button
                onClick={() => {
                  setIsRecordModalOpen(false);
                  setEditingRecord(null);
                }}
                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              <form id="record-form" onSubmit={handleSubmitRecord} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Direction <span className="text-destructive">*</span>
                    </label>
                    <select
                      value={recordForm.direction}
                      onChange={(event) =>
                        setRecordForm((prev) => ({
                          ...prev,
                          direction: event.target.value as DebtDirection,
                        }))
                      }
                      disabled={Boolean(editingRecord)}
                      className="w-full rounded-lg border border-border bg-input px-4 py-2.5 text-foreground focus:border-ring focus:ring-1 focus:ring-ring disabled:opacity-50"
                    >
                      <option value="i_owe">I Owe</option>
                      <option value="they_owe">They Owe</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Total Amount <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="0.01"
                      step="0.01"
                      value={recordForm.totalAmount}
                      onChange={(event) =>
                        setRecordForm((prev) => ({ ...prev, totalAmount: event.target.value }))
                      }
                      className="w-full rounded-lg border border-border bg-input px-4 py-2.5 text-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={recordForm.name}
                    onChange={(event) =>
                      setRecordForm((prev) => ({ ...prev, name: event.target.value }))
                    }
                    className="w-full rounded-lg border border-border bg-input px-4 py-2.5 text-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Purpose</label>
                  <textarea
                    value={recordForm.purpose}
                    onChange={(event) =>
                      setRecordForm((prev) => ({ ...prev, purpose: event.target.value }))
                    }
                    className="w-full resize-none rounded-lg border border-border bg-input px-4 py-2.5 text-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Start Date <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={recordForm.startDate}
                      onChange={(event) =>
                        setRecordForm((prev) => ({ ...prev, startDate: event.target.value }))
                      }
                      className="w-full rounded-lg border border-border bg-input px-4 py-2.5 text-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">Deadline</label>
                    <input
                      type="date"
                      value={recordForm.deadline}
                      onChange={(event) =>
                        setRecordForm((prev) => ({ ...prev, deadline: event.target.value }))
                      }
                      className="w-full rounded-lg border border-border bg-input px-4 py-2.5 text-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">Payment Period</label>
                    <select
                      value={recordForm.paymentPeriod}
                      onChange={(event) =>
                        setRecordForm((prev) => ({
                          ...prev,
                          paymentPeriod: event.target.value as RecordFormData["paymentPeriod"],
                        }))
                      }
                      className="w-full rounded-lg border border-border bg-input px-4 py-2.5 text-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="weekly">Weekly</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">Installment</label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={recordForm.installmentAmount}
                      onChange={(event) =>
                        setRecordForm((prev) => ({
                          ...prev,
                          installmentAmount: event.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-border bg-input px-4 py-2.5 text-foreground placeholder-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                      placeholder="Leave empty for variable"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Notes</label>
                  <textarea
                    value={recordForm.notes}
                    onChange={(event) =>
                      setRecordForm((prev) => ({ ...prev, notes: event.target.value }))
                    }
                    className="w-full resize-none rounded-lg border border-border bg-input px-4 py-2.5 text-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                    rows={2}
                  />
                </div>
              </form>
            </div>

            <div className="flex shrink-0 gap-3 rounded-b-xl border-t border-border bg-card p-6 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsRecordModalOpen(false);
                  setEditingRecord(null);
                }}
                className="flex-1 rounded-lg bg-muted px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/80"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="record-form"
                disabled={isSubmittingRecord}
                className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {isSubmittingRecord ? "Saving..." : editingRecord ? "Save Changes" : "Add Entry"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setDeleteRecord(null)} />
          <div className="relative w-full max-w-md rounded-xl border border-border bg-popover p-6 shadow-2xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <Trash2 className="h-6 w-6 text-destructive" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-foreground">Delete Entry</h2>
            <p className="mb-6 text-muted-foreground">
              Are you sure you want to delete <span className="font-medium text-foreground">{deleteRecord.name}</span>? This will also remove linked payments.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteRecord(null)}
                className="flex-1 rounded-lg bg-muted px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/80"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteRecord}
                className="flex-1 rounded-lg bg-destructive px-4 py-2.5 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => {
              setIsPaymentModalOpen(false);
              setEditingPayment(null);
            }}
          />
          <div className="relative w-full max-w-md rounded-xl border border-border bg-card shadow-2xl">
            <div className="flex items-center justify-between p-6 pb-2">
              <h2 className="text-xl font-bold text-foreground">
                {editingPayment ? "Edit Payment" : "Add Payment"}
              </h2>
              <button
                onClick={() => {
                  setIsPaymentModalOpen(false);
                  setEditingPayment(null);
                }}
                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form id="payment-form" onSubmit={handleSubmitPayment} className="space-y-4 p-6 pt-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  For Entry <span className="text-destructive">*</span>
                </label>
                <select
                  required
                  value={paymentForm.debtId}
                  onChange={(event) =>
                    setPaymentForm((prev) => ({ ...prev, debtId: event.target.value }))
                  }
                  disabled={Boolean(editingPayment)}
                  className="w-full rounded-lg border border-border bg-input px-4 py-2.5 text-foreground focus:border-ring focus:ring-1 focus:ring-ring disabled:opacity-50"
                >
                  <option value="" disabled>
                    Select entry
                  </option>
                  {records.map((record) => (
                    <option key={record.id} value={record.id}>
                      {record.name} ({record.direction === "they_owe" ? "+" : "-"}
                      {formatCurrency(record.remainingAmount)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                    onChange={(event) =>
                      setPaymentForm((prev) => ({ ...prev, amount: event.target.value }))
                    }
                    className="w-full rounded-lg border border-border bg-input px-4 py-2.5 text-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Date <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentForm.paymentDate}
                    onChange={(event) =>
                      setPaymentForm((prev) => ({ ...prev, paymentDate: event.target.value }))
                    }
                    className="w-full rounded-lg border border-border bg-input px-4 py-2.5 text-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Status</label>
                <select
                  value={paymentForm.status}
                  onChange={(event) =>
                    setPaymentForm((prev) => ({
                      ...prev,
                      status: event.target.value as PaymentStatus,
                    }))
                  }
                  className="w-full rounded-lg border border-border bg-input px-4 py-2.5 text-foreground focus:border-ring focus:ring-1 focus:ring-ring"
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
                  onChange={(event) =>
                    setPaymentForm((prev) => ({ ...prev, note: event.target.value }))
                  }
                  className="w-full rounded-lg border border-border bg-input px-4 py-2.5 text-foreground placeholder-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                  placeholder="Optional note..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsPaymentModalOpen(false);
                    setEditingPayment(null);
                  }}
                  className="flex-1 rounded-lg bg-muted px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPayment}
                  className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
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
      )}

      {deletePayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setDeletePayment(null)} />
          <div className="relative w-full max-w-md rounded-xl border border-border bg-popover p-6 shadow-2xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <Trash2 className="h-6 w-6 text-destructive" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-foreground">Delete Payment</h2>
            <p className="mb-6 text-muted-foreground">
              Are you sure you want to delete this payment of{" "}
              <span className="font-medium text-foreground">{formatCurrency(deletePayment.amount)}</span>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletePayment(null)}
                className="flex-1 rounded-lg bg-muted px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/80"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePayment}
                className="flex-1 rounded-lg bg-destructive px-4 py-2.5 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
