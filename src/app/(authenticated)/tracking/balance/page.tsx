"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowDown,
  ArrowDownCircle,
  ArrowUp,
  ArrowUpCircle,
  ArrowUpDown,
  Search,
  Wallet,
} from "lucide-react";
import PageHeader from "@/components/layout/page-header";
import BalanceFilters from "@/components/tracking/balance-filters";
import type {
  BalanceFiltersState,
  BalanceSortBy,
  DebtItem,
  DebtType,
  DebtStatus,
} from "@/types/tracking";

interface DebtApiResponse {
  debts?: DebtItem[];
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

const getSignedAmount = (amount: number, type: DebtType): string =>
  `${type === "asset" ? "+" : "-"}${formatCurrency(amount)}`;

const getTypeBadgeClasses = (type: DebtType): string => {
  if (type === "asset") {
    return "bg-green-500/15 text-green-600 dark:text-green-400";
  }
  return "bg-red-500/15 text-red-600 dark:text-red-400";
};

const getStatusBadgeClasses = (status: DebtStatus): string => {
  if (status === "paid") return "bg-green-500/15 text-green-600 dark:text-green-400";
  if (status === "overdue") return "bg-amber-500/15 text-amber-600 dark:text-amber-400";
  return "bg-blue-500/15 text-blue-600 dark:text-blue-400";
};

export default function BalanceOverviewPage() {
  const router = useRouter();
  const [items, setItems] = useState<DebtItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<BalanceFiltersState>({
    type: "",
    status: "",
    minAmount: "",
    maxAmount: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const fetchBalanceItems = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [debtRes, assetRes] = await Promise.all([
        fetch("/api/debts?type=debt"),
        fetch("/api/debts?type=asset"),
      ]);

      if (!debtRes.ok || !assetRes.ok) {
        throw new Error("Failed to fetch debt and asset items");
      }

      const [debtData, assetData] = (await Promise.all([
        debtRes.json(),
        assetRes.json(),
      ])) as [DebtApiResponse, DebtApiResponse];

      const merged = [...(debtData.debts || []), ...(assetData.debts || [])];

      merged.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setItems(merged);
    } catch (err) {
      console.error("Failed to fetch balance overview:", err);
      setError("Failed to load balance overview. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBalanceItems();
  }, [fetchBalanceItems]);

  const totalDebts = useMemo(
    () =>
      items
        .filter((item) => item.type === "debt")
        .reduce((sum, item) => sum + item.remainingBalance, 0),
    [items]
  );

  const totalAssets = useMemo(
    () =>
      items
        .filter((item) => item.type === "asset")
        .reduce((sum, item) => sum + item.remainingBalance, 0),
    [items]
  );

  const netBalance = totalAssets - totalDebts;

  const displayedItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const minAmount = filters.minAmount ? parseFloat(filters.minAmount) : null;
    const maxAmount = filters.maxAmount ? parseFloat(filters.maxAmount) : null;

    let filtered = items.filter((item) => {
      if (q) {
        const matchesQuery =
          item.name.toLowerCase().includes(q) ||
          item.counterparty.toLowerCase().includes(q) ||
          Boolean(item.purpose && item.purpose.toLowerCase().includes(q));
        if (!matchesQuery) return false;
      }

      if (filters.type && item.type !== filters.type) return false;
      if (filters.status && item.status !== filters.status) return false;
      if (minAmount !== null && item.remainingBalance < minAmount) return false;
      if (maxAmount !== null && item.remainingBalance > maxAmount) return false;
      return true;
    });

    filtered = filtered.sort((a, b) => {
      const direction = filters.sortOrder === "asc" ? 1 : -1;

      switch (filters.sortBy) {
        case "remainingBalance":
          return (a.remainingBalance - b.remainingBalance) * direction;
        case "createdAt":
          return (
            (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * direction
          );
        case "name":
          return a.name.localeCompare(b.name) * direction;
        case "counterparty":
          return a.counterparty.localeCompare(b.counterparty) * direction;
        case "status":
          return a.status.localeCompare(b.status) * direction;
        case "type":
          return a.type.localeCompare(b.type) * direction;
        default:
          return 0;
      }
    });

    return filtered;
  }, [items, searchQuery, filters]);

  const handleSort = (field: BalanceSortBy) => {
    setFilters((prev) => {
      if (prev.sortBy === field) {
        return {
          ...prev,
          sortOrder: prev.sortOrder === "asc" ? "desc" : "asc",
        };
      }

      return {
        ...prev,
        sortBy: field,
        sortOrder: field === "createdAt" || field === "remainingBalance" ? "desc" : "asc",
      };
    });
  };

  const SortHeader = ({
    field,
    label,
    align = "left",
  }: {
    field: BalanceSortBy;
    label: string;
    align?: "left" | "right";
  }) => {
    const isActive = filters.sortBy === field;
    const isAsc = filters.sortOrder === "asc";
    const alignClass = align === "right" ? "text-right" : "text-left";
    const justifyClass = align === "right" ? "justify-end" : "";

    return (
      <th
        className={`group cursor-pointer whitespace-nowrap px-6 py-4 ${alignClass} text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted/80`}
        onClick={() => handleSort(field)}
      >
        <div className={`flex items-center gap-1 ${justifyClass}`}>
          {label}
          {isActive ? (
            <span className="flex items-center text-primary">
              {isAsc ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
            </span>
          ) : (
            <span className="flex items-center opacity-0 transition-opacity group-hover:opacity-100">
              <ArrowUpDown className="h-4 w-4" />
            </span>
          )}
        </div>
      </th>
    );
  };

  return (
    <div className="space-y-6 py-4">
      <PageHeader
        title="Balance"
        description="Overview of what you owe and what is owed to you"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2 text-muted-foreground">
            <ArrowDownCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Total Debts</span>
          </div>
          <p className="text-2xl font-semibold text-red-600 dark:text-red-400">
            -{formatCurrency(totalDebts)}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2 text-muted-foreground">
            <ArrowUpCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Total Assets</span>
          </div>
          <p className="text-2xl font-semibold text-green-600 dark:text-green-400">
            +{formatCurrency(totalAssets)}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 sm:col-span-2 lg:col-span-1">
          <div className="mb-3 flex items-center gap-2 text-muted-foreground">
            <Wallet className="h-4 w-4" />
            <span className="text-sm font-medium">Net Balance</span>
          </div>
          <p
            className={`text-2xl font-semibold ${
              netBalance > 0
                ? "text-green-600 dark:text-green-400"
                : netBalance < 0
                  ? "text-red-600 dark:text-red-400"
                  : "text-foreground"
            }`}
          >
            {netBalance > 0 ? "+" : netBalance < 0 ? "-" : ""}
            {formatCurrency(netBalance)}
          </p>
        </div>
      </div>

      <BalanceFilters
        filters={filters}
        setFilters={setFilters}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : error ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2 px-4 text-center">
            <AlertTriangle className="h-8 w-8 text-amber-500" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <button
              onClick={fetchBalanceItems}
              className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        ) : displayedItems.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center px-4 text-center">
            <Search className="mb-3 h-8 w-8 text-muted-foreground" />
            <h3 className="text-lg font-medium text-foreground">No debts or assets found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {searchQuery
                ? "Try adjusting your search query."
                : "Add a debt or asset from the Counterparties tab to see it here."}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="divide-y divide-border md:hidden">
              {displayedItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => router.push(`/tracking/balance/${item.id}`)}
                  className="w-full p-4 text-left transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${getTypeBadgeClasses(
                            item.type
                          )}`}
                        >
                          {item.type}
                        </span>
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${getStatusBadgeClasses(
                            item.status
                          )}`}
                        >
                          {item.status}
                        </span>
                      </div>

                      <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{item.counterparty}</p>
                      {item.purpose && (
                        <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                          {item.purpose}
                        </p>
                      )}
                    </div>

                    <div className="shrink-0 text-right">
                      <p
                        className={`text-sm font-semibold ${
                          item.type === "asset"
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {getSignedAmount(item.remainingBalance, item.type)}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatDate(item.createdAt)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <SortHeader field="name" label="Item" />
                    <SortHeader field="counterparty" label="Counterparty" />
                    <SortHeader field="type" label="Type" />
                    <SortHeader field="status" label="Status" />
                    <SortHeader field="remainingBalance" label="Remaining" align="right" />
                    <SortHeader field="createdAt" label="Created" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {displayedItems.map((item) => (
                    <tr
                      key={item.id}
                      className="cursor-pointer transition-colors hover:bg-muted/40"
                      onClick={() => router.push(`/tracking/balance/${item.id}`)}
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium text-foreground">{item.name}</p>
                        {item.purpose && (
                          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                            {item.purpose}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">{item.counterparty}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${getTypeBadgeClasses(
                            item.type
                          )}`}
                        >
                          {item.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${getStatusBadgeClasses(
                            item.status
                          )}`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td
                        className={`px-6 py-4 text-right text-sm font-semibold ${
                          item.type === "asset"
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {getSignedAmount(item.remainingBalance, item.type)}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {formatDate(item.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
