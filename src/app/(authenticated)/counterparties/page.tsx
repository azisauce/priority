"use client";

import { useEffect, useState, useCallback } from "react";
import {
    CreditCard,
    AlertTriangle,
    ArrowLeft,
    Banknote,
    Search,
    User,
    Plus,
    Pencil,
    Trash2,
    X,
    CheckCircle2,
    Clock,
    Repeat,
    CalendarDays
} from "lucide-react";

/* ───────── types ───────── */

interface CounterpartySummary {
    id: string;
    name: string;
    balance: number;
}

interface RecordEntry {
    id: string;
    type: "debt" | "asset";
    amount: number;
    totalAmount: number;
    remainingBalance: number;
    label: string;
    purpose: string | null;
    date: string;
    deadline: string | null;
    status: "active" | "paid" | "overdue";
    paymentPeriod: "weekly" | "monthly" | "custom";
    fixedInstallmentAmount: number | null;
    createdAt: string;
}

interface CounterpartyDetail {
    id: string;
    name: string;
    balance: number;
}

interface CounterpartyFormData {
    name: string;
}

interface RecordFormData {
    name: string;
    purpose: string;
    totalAmount: string;
    type: "debt" | "asset";
    startDate: string;
    deadline: string;
    paymentPeriod: "weekly" | "monthly" | "custom";
    fixedInstallmentAmount: string;
    notes: string;
}

interface PaymentEntry {
    id: string;
    debtId: string;
    amount: number;
    paymentDate: string;
    status: "scheduled" | "paid" | "missed";
    note: string | null;
    createdAt: string;
}

interface PaymentFormData {
    debtId: string;
    amount: string;
    paymentDate: string;
    status: "scheduled" | "paid" | "missed";
    note: string;
}

/* ───────── formatters ───────── */

const formatCurrency = (amount: number): string =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Math.abs(amount));

const formatDate = (dateString: string): string =>
    new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });

const emptyCpForm: CounterpartyFormData = { name: "" };

const emptyRecordForm: RecordFormData = {
    name: "",
    purpose: "",
    totalAmount: "",
    type: "debt",
    startDate: new Date().toISOString().split("T")[0],
    deadline: "",
    paymentPeriod: "monthly",
    fixedInstallmentAmount: "",
    notes: "",
};

const emptyPaymentForm: PaymentFormData = {
    debtId: "",
    amount: "",
    paymentDate: new Date().toISOString().split("T")[0],
    status: "paid",
    note: "",
};

/* ═══════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════ */

export default function CounterpartiesPage() {
    const [summaries, setSummaries] = useState<CounterpartySummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Detail view
    const [selectedCp, setSelectedCp] = useState<CounterpartyDetail | null>(null);
    const [records, setRecords] = useState<RecordEntry[]>([]);
    const [payments, setPayments] = useState<PaymentEntry[]>([]);
    const [loadingDetail, setLoadingDetail] = useState(false);

    // CP Modals
    const [isCpModalOpen, setIsCpModalOpen] = useState(false);
    const [editingCp, setEditingCp] = useState<CounterpartySummary | CounterpartyDetail | null>(null);
    const [cpForm, setCpForm] = useState<CounterpartyFormData>(emptyCpForm);
    const [isSubmittingCp, setIsSubmittingCp] = useState(false);
    const [deleteCp, setDeleteCp] = useState<CounterpartySummary | CounterpartyDetail | null>(null);

    // Record Modals
    const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<RecordEntry | null>(null);
    const [recordForm, setRecordForm] = useState<RecordFormData>(emptyRecordForm);
    const [isSubmittingRecord, setIsSubmittingRecord] = useState(false);
    const [deleteRecord, setDeleteRecord] = useState<RecordEntry | null>(null);

    // Payment Modals
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [editingPayment, setEditingPayment] = useState<PaymentEntry | null>(null);
    const [paymentForm, setPaymentForm] = useState<PaymentFormData>(emptyPaymentForm);
    const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
    const [deletePayment, setDeletePayment] = useState<PaymentEntry | null>(null);

    /* ─── Fetch summaries ─── */
    const fetchSummaries = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/counterparties/summary`);
            if (res.ok) {
                const data = await res.json();
                setSummaries(data.counterparties || []);
            }
        } catch (err) {
            console.error("Failed to fetch counterparties:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSummaries();
    }, [fetchSummaries]);

    /* ─── Fetch single counterparty detail ─── */
    const fetchDetail = useCallback(async (cpId: string) => {
        setLoadingDetail(true);
        try {
            const res = await fetch(`/api/counterparties/${cpId}/records`);
            if (res.ok) {
                const data = await res.json();
                setSelectedCp(data.counterparty);
                setRecords(data.records || []);
                setPayments(data.payments || []);
            }
        } catch (err) {
            console.error("Failed to fetch counterparty details:", err);
        } finally {
            setLoadingDetail(false);
        }
    }, []);

    const handleSelectCp = (cpId: string) => {
        fetchDetail(cpId);
    };

    /* ─── Filtered summaries ─── */
    const displayedSummaries = summaries.filter((c) => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return true;
        return c.name.toLowerCase().includes(q);
    });

    const getBalanceColorClass = (balance: number) => {
        if (balance > 0) return "text-green-600 dark:text-green-400";
        if (balance < 0) return "text-red-600 dark:text-red-400";
        return "text-muted-foreground";
    };

    const periodBadge = (period: string) => {
        if (period === "custom" || !period) return null;
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] sm:text-xs font-medium text-violet-600 dark:text-violet-400">
                <Repeat className="h-3 w-3" />
                {period === "weekly" ? "Weekly" : "Monthly"}
            </span>
        );
    };

    /* ───────── CP CRUD ───────── */
    const openAddCp = () => {
        setEditingCp(null);
        setCpForm(emptyCpForm);
        setIsCpModalOpen(true);
    };
    const openEditCp = (cp: CounterpartySummary | CounterpartyDetail) => {
        setEditingCp(cp);
        setCpForm({ name: cp.name });
        setIsCpModalOpen(true);
    };

    const handleSubmitCp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmittingCp(true);
        try {
            const method = editingCp ? "PATCH" : "POST";
            const url = editingCp ? `/api/counterparties/${editingCp.id}` : `/api/counterparties`;
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(cpForm)
            });
            if (res.ok) {
                setIsCpModalOpen(false);
                fetchSummaries();
                if (selectedCp && editingCp?.id === selectedCp.id) fetchDetail(selectedCp.id);
            } else {
                const err = await res.json();
                alert(typeof err.error === "string" ? err.error : "Failed to save counterparty");
            }
        } catch (error) {
            console.error(error);
            alert("Failed to save counterparty");
        } finally {
            setIsSubmittingCp(false);
        }
    };

    const handleDeleteCp = async () => {
        if (!deleteCp) return;
        try {
            const res = await fetch(`/api/counterparties/${deleteCp.id}`, { method: "DELETE" });
            if (res.ok) {
                if (selectedCp?.id === deleteCp.id) setSelectedCp(null);
                setDeleteCp(null);
                fetchSummaries();
            } else {
                alert("Failed to delete counterparty");
            }
        } catch (err) {
            console.error(err);
            alert("Failed to delete counterparty");
        }
    };

    /* ───────── Record CRUD ───────── */
    const openAddRecord = () => {
        setEditingRecord(null);
        setRecordForm(emptyRecordForm);
        setIsRecordModalOpen(true);
    };

    const openEditRecord = (rec: RecordEntry) => {
        setEditingRecord(rec);
        setRecordForm({
            name: rec.label,
            purpose: rec.purpose || "",
            totalAmount: (rec.totalAmount || rec.amount || 0).toString(),
            type: rec.type,
            startDate: rec.date ? rec.date.split("T")[0] : "",
            deadline: rec.deadline ? rec.deadline.split("T")[0] : "",
            paymentPeriod: rec.paymentPeriod || "monthly",
            fixedInstallmentAmount: rec.fixedInstallmentAmount?.toString() || "",
            notes: "",
        });
        setIsRecordModalOpen(true);
    };

    const handleSubmitRecord = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCp) return;
        setIsSubmittingRecord(true);
        const totalAmt = parseFloat(recordForm.totalAmount);
        if (isNaN(totalAmt) || totalAmt <= 0) {
            alert("Please enter a valid amount");
            setIsSubmittingRecord(false);
            return;
        }
        const fixedAmt = recordForm.fixedInstallmentAmount ? parseFloat(recordForm.fixedInstallmentAmount) : null;
        try {
            const method = editingRecord ? "PATCH" : "POST";
            const url = editingRecord ? `/api/debts/${editingRecord.id}` : "/api/debts";
            const payload = {
                name: recordForm.name,
                purpose: recordForm.purpose.trim() || null,
                totalAmount: totalAmt,
                counterparty: selectedCp.name,
                type: recordForm.type,
                startDate: recordForm.startDate,
                deadline: recordForm.deadline || null,
                paymentPeriod: recordForm.paymentPeriod,
                fixedInstallmentAmount: fixedAmt,
                notes: recordForm.notes.trim() || null
            };
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                setIsRecordModalOpen(false);
                fetchDetail(selectedCp.id);
                fetchSummaries();
            } else {
                const err = await res.json();
                alert(typeof err.error === "string" ? err.error : "Failed to save record");
            }
        } catch (err) {
            console.error(err);
            alert("Failed to save record");
        } finally {
            setIsSubmittingRecord(false);
        }
    };

    const handleDeleteRecord = async () => {
        if (!deleteRecord) return;
        try {
            const res = await fetch(`/api/debts/${deleteRecord.id}`, { method: "DELETE" });
            if (res.ok) {
                setDeleteRecord(null);
                if (selectedCp) {
                    fetchDetail(selectedCp.id);
                    fetchSummaries();
                }
            } else {
                alert("Failed to delete record");
            }
        } catch (err) {
            console.error(err);
            alert("Failed to delete record");
        }
    };

    /* ───────── Payment CRUD ───────── */
    const openAddPayment = (debtId?: string) => {
        setEditingPayment(null);
        let firstActiveId = debtId || "";
        if (!firstActiveId && records.length > 0) {
            firstActiveId = records[0].id; // default to first record
        }
        setPaymentForm({ ...emptyPaymentForm, debtId: firstActiveId });
        setIsPaymentModalOpen(true);
    };

    const openEditPayment = (pay: PaymentEntry) => {
        setEditingPayment(pay);
        setPaymentForm({
            debtId: pay.debtId,
            amount: pay.amount.toString(),
            paymentDate: pay.paymentDate ? pay.paymentDate.split("T")[0] : "",
            status: pay.status,
            note: pay.note || "",
        });
        setIsPaymentModalOpen(true);
    };

    const handleSubmitPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCp) return;
        if (!paymentForm.debtId) {
            alert("Please select an item (debt/asset) for this payment");
            return;
        }

        setIsSubmittingPayment(true);
        const amount = parseFloat(paymentForm.amount);
        if (isNaN(amount) || amount <= 0) {
            alert("Please enter a valid positive amount");
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
                note: paymentForm.note.trim() || null
            };

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setIsPaymentModalOpen(false);
                fetchDetail(selectedCp.id);
            } else {
                const err = await res.json();
                alert(typeof err.error === "string" ? err.error : "Failed to save payment");
            }
        } catch (err) {
            console.error(err);
            alert("Failed to save payment");
        } finally {
            setIsSubmittingPayment(false);
        }
    };

    const handleDeletePayment = async () => {
        if (!deletePayment || !selectedCp) return;
        try {
            const res = await fetch(`/api/debts/${deletePayment.debtId}/payments/${deletePayment.id}`, { method: "DELETE" });
            if (res.ok) {
                setDeletePayment(null);
                fetchDetail(selectedCp.id);
            } else {
                alert("Failed to delete payment");
            }
        } catch (err) {
            console.error(err);
            alert("Failed to delete payment");
        }
    };

    /* ═══════════════════════════════════════
       MODALS RENDER
       ═══════════════════════════════════════ */

    function renderCpModal() {
        if (!isCpModalOpen) return null;
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/70" onClick={() => { setIsCpModalOpen(false); setEditingCp(null); }} />
                <div className="relative w-full max-w-md rounded-xl bg-card border border-border shadow-2xl">
                    <div className="flex items-center justify-between p-6 pb-2">
                        <h2 className="text-xl font-bold text-foreground">
                            {editingCp ? "Edit Counterparty" : "Add Counterparty"}
                        </h2>
                        <button
                            onClick={() => { setIsCpModalOpen(false); setEditingCp(null); }}
                            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    <form onSubmit={handleSubmitCp} className="p-6 pt-4 space-y-4">
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-foreground">
                                Name <span className="text-destructive">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={cpForm.name}
                                onChange={(e) => setCpForm({ name: e.target.value })}
                                className="w-full rounded-lg bg-input border border-border px-4 py-2.5 text-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                                placeholder="Person or Company name"
                            />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => { setIsCpModalOpen(false); setEditingCp(null); }}
                                className="flex-1 rounded-lg bg-muted px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/80 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmittingCp}
                                className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                            >
                                {isSubmittingCp ? "Saving..." : editingCp ? "Save Changes" : "Add Counterparty"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    function renderDeleteCpConfirm() {
        if (!deleteCp) return null;
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/70" onClick={() => setDeleteCp(null)} />
                <div className="relative w-full max-w-md rounded-xl bg-popover border border-border p-6 shadow-2xl">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                        <Trash2 className="h-6 w-6 text-destructive" />
                    </div>
                    <h2 className="mb-2 text-xl font-bold text-foreground">Delete Counterparty</h2>
                    <p className="mb-6 text-muted-foreground">
                        Are you sure you want to delete <span className="font-medium text-foreground">{deleteCp.name}</span>?
                        This will delete ALL associated debts and assets forever. This cannot be undone.
                    </p>
                    <div className="flex gap-3">
                        <button onClick={() => setDeleteCp(null)} className="flex-1 rounded-lg bg-muted px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/80 transition-colors">Cancel</button>
                        <button onClick={handleDeleteCp} className="flex-1 rounded-lg bg-destructive px-4 py-2.5 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors">Delete</button>
                    </div>
                </div>
            </div>
        );
    }

    function renderRecordModal() {
        if (!isRecordModalOpen) return null;
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/70" onClick={() => { setIsRecordModalOpen(false); setEditingRecord(null); }} />
                <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-xl bg-card border border-border shadow-2xl">
                    <div className="flex items-center justify-between p-6 pb-2 shrink-0">
                        <h2 className="text-xl font-bold text-foreground">
                            {editingRecord ? "Edit Record" : "Add Record"}
                        </h2>
                        <button
                            onClick={() => { setIsRecordModalOpen(false); setEditingRecord(null); }}
                            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 py-4">
                        <form id="record-form" onSubmit={handleSubmitRecord} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                                        Type <span className="text-destructive">*</span>
                                    </label>
                                    <select
                                        value={recordForm.type}
                                        onChange={(e) => setRecordForm({ ...recordForm, type: e.target.value as "debt" | "asset" })}
                                        disabled={!!editingRecord}
                                        className="w-full rounded-lg bg-input border border-border px-4 py-2.5 text-foreground focus:border-ring focus:ring-1 focus:ring-ring disabled:opacity-50"
                                    >
                                        <option value="debt">Debt (I Owe)</option>
                                        <option value="asset">Asset (They Owe)</option>
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
                                        onChange={(e) => setRecordForm({ ...recordForm, totalAmount: e.target.value })}
                                        className="w-full rounded-lg bg-input border border-border px-4 py-2.5 text-foreground focus:border-ring focus:ring-1 focus:ring-ring"
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
                                    onChange={(e) => setRecordForm({ ...recordForm, name: e.target.value })}
                                    className="w-full rounded-lg bg-input border border-border px-4 py-2.5 text-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-foreground">Purpose</label>
                                <textarea
                                    value={recordForm.purpose}
                                    onChange={(e) => setRecordForm({ ...recordForm, purpose: e.target.value })}
                                    className="w-full rounded-lg bg-input border border-border px-4 py-2.5 text-foreground resize-none focus:border-ring focus:ring-1 focus:ring-ring"
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
                                        onChange={(e) => setRecordForm({ ...recordForm, startDate: e.target.value })}
                                        className="w-full rounded-lg bg-input border border-border px-4 py-2.5 text-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-foreground">Deadline</label>
                                    <input
                                        type="date"
                                        value={recordForm.deadline}
                                        onChange={(e) => setRecordForm({ ...recordForm, deadline: e.target.value })}
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
                                        value={recordForm.paymentPeriod}
                                        onChange={(e) => setRecordForm({ ...recordForm, paymentPeriod: e.target.value as RecordFormData["paymentPeriod"] })}
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
                                        value={recordForm.fixedInstallmentAmount}
                                        onChange={(e) => setRecordForm({ ...recordForm, fixedInstallmentAmount: e.target.value })}
                                        className="w-full rounded-lg bg-input border border-border px-4 py-2.5 text-foreground placeholder-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                                        placeholder="Leave empty for variable"
                                    />
                                </div>
                            </div>
                        </form>
                    </div>
                    <div className="p-6 pt-2 shrink-0 flex gap-3 bg-card rounded-b-xl border-t border-border">
                        <button
                            type="button"
                            onClick={() => { setIsRecordModalOpen(false); setEditingRecord(null); }}
                            className="flex-1 rounded-lg bg-muted px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/80 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            form="record-form"
                            disabled={isSubmittingRecord}
                            className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                        >
                            {isSubmittingRecord ? "Saving..." : editingRecord ? "Save Changes" : "Add Record"}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    function renderDeleteRecordConfirm() {
        if (!deleteRecord) return null;
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/70" onClick={() => setDeleteRecord(null)} />
                <div className="relative w-full max-w-md rounded-xl bg-popover border border-border p-6 shadow-2xl">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                        <Trash2 className="h-6 w-6 text-destructive" />
                    </div>
                    <h2 className="mb-2 text-xl font-bold text-foreground">Delete Record</h2>
                    <p className="mb-6 text-muted-foreground">
                        Are you sure you want to delete <span className="font-medium text-foreground">{deleteRecord.label}</span>?
                        This will delete ALL associated payments forever. This cannot be undone.
                    </p>
                    <div className="flex gap-3">
                        <button onClick={() => setDeleteRecord(null)} className="flex-1 rounded-lg bg-muted px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/80 transition-colors">Cancel</button>
                        <button onClick={handleDeleteRecord} className="flex-1 rounded-lg bg-destructive px-4 py-2.5 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors">Delete</button>
                    </div>
                </div>
            </div>
        );
    }

    function renderPaymentModal() {
        if (!isPaymentModalOpen) return null;
        return (
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
                    <form id="payment-form" onSubmit={handleSubmitPayment} className="p-6 pt-4 space-y-4">
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-foreground">
                                For Item <span className="text-destructive">*</span>
                            </label>
                            <select
                                required
                                value={paymentForm.debtId}
                                onChange={(e) => setPaymentForm({ ...paymentForm, debtId: e.target.value })}
                                disabled={!!editingPayment}
                                className="w-full rounded-lg bg-input border border-border px-4 py-2.5 text-foreground focus:border-ring focus:ring-1 focus:ring-ring disabled:opacity-50"
                            >
                                <option value="" disabled>Select debt/asset</option>
                                {records.map(r => (
                                    <option key={r.id} value={r.id}>{r.label} ({r.type === 'asset' ? '+' : '-'}{formatCurrency(r.amount)})</option>
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
                                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                    className="w-full rounded-lg bg-input border border-border px-4 py-2.5 text-foreground focus:border-ring focus:ring-1 focus:ring-ring"
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
                                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                                    className="w-full rounded-lg bg-input border border-border px-4 py-2.5 text-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-foreground">Status</label>
                            <select
                                value={paymentForm.status}
                                onChange={(e) => setPaymentForm({ ...paymentForm, status: e.target.value as any })}
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
                                onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })}
                                className="w-full rounded-lg bg-input border border-border px-4 py-2.5 text-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                                placeholder="Optional note..."
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
                                disabled={isSubmittingPayment}
                                className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                            >
                                {isSubmittingPayment ? "Saving..." : editingPayment ? "Save Changes" : "Save Payment"}
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
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                        <Trash2 className="h-6 w-6 text-destructive" />
                    </div>
                    <h2 className="mb-2 text-xl font-bold text-foreground">Delete Payment</h2>
                    <p className="mb-6 text-muted-foreground">
                        Are you sure you want to delete this payment of <span className="font-medium text-foreground">{formatCurrency(deletePayment.amount)}</span>?
                        This will revert the balance. This cannot be undone.
                    </p>
                    <div className="flex gap-3">
                        <button onClick={() => setDeletePayment(null)} className="flex-1 rounded-lg bg-muted px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/80 transition-colors">Cancel</button>
                        <button onClick={handleDeletePayment} className="flex-1 rounded-lg bg-destructive px-4 py-2.5 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors">Delete</button>
                    </div>
                </div>
            </div>
        );
    }

    /* ═══════════════════════════════════════
       DETAIL VIEW
       ═══════════════════════════════════════ */
    if (selectedCp) {
        return (
            <div className="space-y-6 py-4">
                {/* Back */}
                <button
                    onClick={() => setSelectedCp(null)}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Ledger
                </button>

                {loadingDetail ? (
                    <div className="flex h-64 items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                ) : (
                    <>
                        {/* Header card */}
                        <div className={`rounded-xl border p-4 sm:p-6 bg-card border-border`}>
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                <div className="space-y-1">
                                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                                        <User className="w-6 h-6 text-primary" />
                                        {selectedCp.name}
                                    </h1>
                                    <p className="text-sm text-muted-foreground">
                                        Net Balance:{" "}
                                        <span className={`font-bold ${getBalanceColorClass(selectedCp.balance)}`}>
                                            {selectedCp.balance > 0 ? "+" : selectedCp.balance < 0 ? "-" : ""}
                                            {formatCurrency(selectedCp.balance)}
                                        </span>
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        onClick={() => openEditCp(selectedCp)}
                                        className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                                    >
                                        <Pencil className="h-4 w-4" /> Edit
                                    </button>
                                    <button
                                        onClick={() => setDeleteCp(selectedCp)}
                                        className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-2 text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-muted/80 transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4" /> Delete
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Records */}
                        <div className="rounded-xl bg-card border border-border overflow-hidden">
                            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <Banknote className="w-4 h-4 text-primary" />
                                    <h2 className="text-lg font-semibold text-foreground">Items (Debts & Assets)</h2>
                                    <span className="text-sm text-muted-foreground">({records.length})</span>
                                </div>
                                <button
                                    onClick={openAddRecord}
                                    className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                                >
                                    <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Add Item</span>
                                </button>
                            </div>

                            {!records.length ? (
                                <div className="p-12 text-center text-muted-foreground">
                                    <Banknote className="h-10 w-10 mx-auto mb-3 opacity-40" />
                                    <p>No items found.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-border">
                                    {records.map((r) => {
                                        const actualTotalVal = r.totalAmount || r.amount;
                                        const paidAmount = actualTotalVal - r.remainingBalance;

                                        return (
                                            <div key={r.id} className="p-4 sm:px-6 hover:bg-muted/30 transition-colors">
                                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                                    <div className="space-y-2">
                                                        <div className="flex items-center flex-wrap gap-2">
                                                            <span className="font-medium text-sm text-foreground">{r.label}</span>
                                                            {r.status === "paid" && (
                                                                <span className="inline-flex items-center rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-medium text-green-600 uppercase tracking-wider">
                                                                    Paid
                                                                </span>
                                                            )}
                                                            {r.status === "overdue" && (
                                                                <span className="inline-flex items-center rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-medium text-red-600 uppercase tracking-wider">
                                                                    Overdue
                                                                </span>
                                                            )}
                                                            {periodBadge(r.paymentPeriod)}
                                                            {r.fixedInstallmentAmount ? (
                                                                <span className="text-xs text-muted-foreground font-medium ml-1">
                                                                    {formatCurrency(r.fixedInstallmentAmount)}
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                        <div className="flex gap-4 text-xs text-muted-foreground">
                                                            <span className="flex items-center gap-1">
                                                                <CalendarDays className="h-3 w-3" />
                                                                {formatDate(r.date)}
                                                            </span>
                                                            {r.purpose && <span>{r.purpose}</span>}
                                                        </div>

                                                        {/* Display money happened */}
                                                        <div className="flex gap-4 text-xs mt-1 border-t border-border/50 pt-2">
                                                            <div className="flex flex-col">
                                                                <span className="text-muted-foreground">Total</span>
                                                                <span className="font-medium text-foreground">{formatCurrency(actualTotalVal)}</span>
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-muted-foreground">Paid</span>
                                                                <span className={`font-medium ${r.type === 'asset' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                                    {formatCurrency(paidAmount)}
                                                                </span>
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-muted-foreground">Remaining</span>
                                                                <span className="font-medium text-foreground">{formatCurrency(r.remainingBalance)}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex sm:flex-col items-center gap-2 justify-between">
                                                        <div className="text-right">
                                                            <span
                                                                className={`font-semibold text-sm ${r.type === "asset"
                                                                    ? "text-green-600 dark:text-green-400"
                                                                    : "text-red-600 dark:text-red-400"
                                                                    }`}
                                                            >
                                                                {r.type === "asset" ? "+" : "-"}
                                                                {formatCurrency(r.remainingBalance)}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={() => openAddPayment(r.id)}
                                                                title="Add Payment"
                                                                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-green-600 transition-colors"
                                                            >
                                                                <Plus className="h-3.5 w-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => openEditRecord(r)}
                                                                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-primary transition-colors"
                                                            >
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => setDeleteRecord(r)}
                                                                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive transition-colors"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Payments */}
                        <div className="rounded-xl bg-card border border-border overflow-hidden mt-6">
                            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-primary" />
                                    <h2 className="text-lg font-semibold text-foreground">Payment Entries</h2>
                                    <span className="text-sm text-muted-foreground">({payments.length})</span>
                                </div>
                                <button
                                    onClick={() => openAddPayment()}
                                    className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                                    disabled={records.length === 0}
                                    title={records.length === 0 ? "Add an item first" : "Add Payment"}
                                >
                                    <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Add Payment</span>
                                </button>
                            </div>

                            {!payments.length ? (
                                <div className="p-12 text-center text-muted-foreground">
                                    <Clock className="h-10 w-10 mx-auto mb-3 opacity-40" />
                                    <p>No payments recorded yet.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-border">
                                    {payments.map((p) => {
                                        const parentRecord = records.find(r => r.id === p.debtId);
                                        const isAsset = parentRecord?.type === "asset";
                                        return (
                                            <div key={p.id} className="p-4 sm:px-6 hover:bg-muted/30 transition-colors">
                                                <div className="flex items-center justify-between gap-4">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-sm text-foreground">
                                                                {parentRecord ? parentRecord.label : "Unknown Item"}
                                                            </span>
                                                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] sm:text-xs font-medium ${p.status === 'paid' ? 'bg-green-500/15 text-green-600' :
                                                                    p.status === 'missed' ? 'bg-red-500/15 text-red-600' :
                                                                        'bg-blue-500/15 text-blue-600'
                                                                }`}>
                                                                {p.status.toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <div className="flex gap-4 text-xs text-muted-foreground">
                                                            <span className="flex items-center gap-1">
                                                                <CalendarDays className="h-3 w-3" />
                                                                {formatDate(p.paymentDate)}
                                                            </span>
                                                            {p.note && <span>{p.note}</span>}
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-4">
                                                        <span className={`font-semibold text-sm ${isAsset ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                            {isAsset ? "+" : "-"}{formatCurrency(p.amount)}
                                                        </span>
                                                        <div className="flex items-center gap-1">
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
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Modals placed here for detail views */}
                {renderCpModal()}
                {renderDeleteCpConfirm()}
                {renderRecordModal()}
                {renderDeleteRecordConfirm()}
                {renderPaymentModal()}
                {renderDeletePaymentConfirm()}
            </div>
        );
    }

    /* ═══════════════════════════════════════
       SUMMARY VIEW (Grid of Cards)
       ═══════════════════════════════════════ */
    return (
        <div className="space-y-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Counterparty Ledger</h1>
                    <p className="text-sm text-muted-foreground">Manage balances across all your contacts</p>
                </div>
                <button
                    onClick={openAddCp}
                    className="flex items-center gap-2 bg-primary px-3 sm:px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 rounded-full shrink-0"
                >
                    <Plus className="h-4 w-4" />
                    <span>Add Counterparty</span>
                </button>
            </div>

            {/* Search */}
            <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search counterparties..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-lg bg-card border border-border pl-9 pr-4 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    />
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex h-64 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
            ) : displayedSummaries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center border rounded-2xl border-dashed border-border bg-card/30">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                        <User className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">No counterparties found</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mb-6">
                        {searchQuery
                            ? "No contacts match your search query."
                            : "You don't have any recorded financial relationships yet. Add a debt or asset to see them here."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {displayedSummaries.map((cp) => (
                        <button
                            key={cp.id}
                            onClick={() => handleSelectCp(cp.id)}
                            className="flex flex-col justify-between p-5 rounded-2xl border border-border bg-card text-left transition-all hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                            <div className="flex items-center gap-3 w-full mb-4">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                    <User className="h-5 w-5" />
                                </div>
                                <div className="truncate font-semibold text-foreground">{cp.name}</div>
                            </div>

                            <div className="mt-auto pt-4 border-t border-border/50 w-full flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Net Balance
                                </span>
                                <span className={`text-lg font-bold ${getBalanceColorClass(cp.balance)}`}>
                                    {cp.balance > 0 ? "+" : cp.balance < 0 ? "-" : ""}
                                    {formatCurrency(cp.balance)}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* Modal available on summary view too */}
            {renderCpModal()}
        </div>
    );
}
