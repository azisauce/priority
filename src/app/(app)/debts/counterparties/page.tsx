"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Search, Trash2, User, X } from "lucide-react";
import PageHeader from "@/components/layout/page-header";

interface CounterpartySummary {
  id: string;
  name: string;
  balance: number;
}

interface CounterpartyFormData {
  name: string;
}

const emptyCpForm: CounterpartyFormData = { name: "" };

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Math.abs(amount));

export default function CounterpartiesPage() {
  const router = useRouter();
  const [summaries, setSummaries] = useState<CounterpartySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [isCpModalOpen, setIsCpModalOpen] = useState(false);
  const [editingCp, setEditingCp] = useState<CounterpartySummary | null>(null);
  const [cpForm, setCpForm] = useState<CounterpartyFormData>(emptyCpForm);
  const [isSubmittingCp, setIsSubmittingCp] = useState(false);
  const [deleteCp, setDeleteCp] = useState<CounterpartySummary | null>(null);

  const fetchSummaries = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/counterparties/summary");
      if (!response.ok) {
        throw new Error("Failed to fetch counterparties");
      }

      const payload = (await response.json()) as { counterparties?: CounterpartySummary[] };
      setSummaries(payload.counterparties || []);
    } catch (error) {
      console.error("Failed to fetch counterparties:", error);
      setSummaries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSummaries();
  }, [fetchSummaries]);

  const displayedSummaries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return summaries;
    }

    return summaries.filter((counterparty) => counterparty.name.toLowerCase().includes(query));
  }, [searchQuery, summaries]);

  const getBalanceColorClass = (balance: number) => {
    if (balance > 0) return "text-green-600 dark:text-green-400";
    if (balance < 0) return "text-red-600 dark:text-red-400";
    return "text-muted-foreground";
  };

  const openAddCp = () => {
    setEditingCp(null);
    setCpForm(emptyCpForm);
    setIsCpModalOpen(true);
  };

  const openEditCp = (cp: CounterpartySummary) => {
    setEditingCp(cp);
    setCpForm({ name: cp.name });
    setIsCpModalOpen(true);
  };

  const closeCpModal = () => {
    setIsCpModalOpen(false);
    setEditingCp(null);
  };

  const handleSubmitCp = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmittingCp(true);

    try {
      const method = editingCp ? "PATCH" : "POST";
      const url = editingCp ? `/api/counterparties/${editingCp.id}` : "/api/counterparties";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cpForm),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        alert(payload.error || "Failed to save counterparty");
        return;
      }

      closeCpModal();
      await fetchSummaries();
    } catch (error) {
      console.error("Failed to save counterparty:", error);
      alert("Failed to save counterparty");
    } finally {
      setIsSubmittingCp(false);
    }
  };

  const handleDeleteCp = async () => {
    if (!deleteCp) return;

    try {
      const response = await fetch(`/api/counterparties/${deleteCp.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        alert("Failed to delete counterparty");
        return;
      }

      setDeleteCp(null);
      await fetchSummaries();
    } catch (error) {
      console.error("Failed to delete counterparty:", error);
      alert("Failed to delete counterparty");
    }
  };

  return (
    <div className="space-y-6 py-4">
      <div className="flex items-center justify-between gap-3">
        <PageHeader
          title="Counterparties"
          description="Manage balances across your financial contacts"
        />
        <button
          onClick={openAddCp}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Counterparty</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search counterparties..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="w-full rounded-lg border border-border bg-input py-2.5 pl-10 pr-4 text-sm text-foreground placeholder-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
        />
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-border bg-card">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : displayedSummaries.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/30 py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <User className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mb-1 text-lg font-semibold text-foreground">No counterparties found</h3>
          <p className="mb-6 max-w-sm text-sm text-muted-foreground">
            {searchQuery
              ? "No counterparties match your search query."
              : "Add your first counterparty to start tracking debt relationships."}
          </p>
          {!searchQuery && (
            <button
              onClick={openAddCp}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Add Counterparty
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayedSummaries.map((counterparty) => (
            <article
              key={counterparty.id}
              className="rounded-2xl border border-border bg-card p-5 transition-colors hover:bg-muted/20"
            >
              <button
                onClick={() => router.push(`/debts/counterparties/${counterparty.id}`)}
                className="w-full text-left"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="truncate font-semibold text-foreground">{counterparty.name}</div>
                </div>

                <div className="flex items-center justify-between border-t border-border/50 pt-4">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Net Balance
                  </span>
                  <span className={`text-lg font-bold ${getBalanceColorClass(counterparty.balance)}`}>
                    {counterparty.balance > 0 ? "+" : counterparty.balance < 0 ? "-" : ""}
                    {formatCurrency(counterparty.balance)}
                  </span>
                </div>
              </button>

              <div className="mt-4 flex items-center justify-end gap-2 border-t border-border/50 pt-3">
                <button
                  onClick={() => openEditCp(counterparty)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => setDeleteCp(counterparty)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/80 hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {isCpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={closeCpModal} />
          <div className="relative w-full max-w-md rounded-xl border border-border bg-card shadow-2xl">
            <div className="flex items-center justify-between p-6 pb-2">
              <h2 className="text-xl font-bold text-foreground">
                {editingCp ? "Edit Counterparty" : "Add Counterparty"}
              </h2>
              <button
                onClick={closeCpModal}
                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCp} className="space-y-4 p-6 pt-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={cpForm.name}
                  onChange={(event) => setCpForm({ name: event.target.value })}
                  className="w-full rounded-lg border border-border bg-input px-4 py-2.5 text-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                  placeholder="Person or company name"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeCpModal}
                  className="flex-1 rounded-lg bg-muted px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCp}
                  className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {isSubmittingCp ? "Saving..." : editingCp ? "Save Changes" : "Add Counterparty"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteCp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setDeleteCp(null)} />
          <div className="relative w-full max-w-md rounded-xl border border-border bg-popover p-6 shadow-2xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <Trash2 className="h-6 w-6 text-destructive" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-foreground">Delete Counterparty</h2>
            <p className="mb-6 text-muted-foreground">
              Are you sure you want to delete <span className="font-medium text-foreground">{deleteCp.name}</span>? This removes all linked debt records and payments. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteCp(null)}
                className="flex-1 rounded-lg bg-muted px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/80"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCp}
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
