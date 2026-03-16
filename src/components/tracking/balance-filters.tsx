"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import { Filter, Search } from "lucide-react";
import type { BalanceFiltersState } from "@/types/tracking";

type Props = {
  filters: BalanceFiltersState;
  setFilters: Dispatch<SetStateAction<BalanceFiltersState>>;
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
};

export default function BalanceFilters({
  filters,
  setFilters,
  searchQuery,
  setSearchQuery,
}: Props) {
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters =
    Boolean(searchQuery) ||
    Boolean(filters.direction) ||
    Boolean(filters.status) ||
    Boolean(filters.minAmount) ||
    Boolean(filters.maxAmount);

  const handleFilterChange = <K extends keyof BalanceFiltersState>(
    key: K,
    value: BalanceFiltersState[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      direction: "",
      status: "",
      minAmount: "",
      maxAmount: "",
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    setSearchQuery("");
    setShowFilters(false);
  };

  return (
    <div className="mb-6">
      <div className="flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search debts and assets..."
            className="w-full rounded-lg border border-border bg-input py-2.5 pl-10 pr-4 text-sm text-foreground placeholder-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
          />
        </div>

        <div className="flex shrink-0 flex-row gap-3 overflow-x-auto">
          <div className="flex rounded-lg border border-border bg-input p-1">
            {[
              { value: "", label: "All" },
              { value: "i_owe", label: "I Owe" },
              { value: "they_owe", label: "They Owe" },
            ].map((opt) => (
              <button
                key={opt.label}
                onClick={() =>
                  handleFilterChange("direction", opt.value as BalanceFiltersState["direction"])
                }
                className={`flex-1 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors sm:flex-none ${
                  filters.direction === opt.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowFilters((prev) => !prev)}
            className={`flex shrink-0 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
              showFilters || hasActiveFilters
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-input text-muted-foreground hover:bg-muted"
            }`}
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Advanced</span>
            {hasActiveFilters && (
              <span className="ml-1 rounded-full bg-primary-foreground/20 px-2 py-0.5 text-xs text-primary-foreground">
                Active
              </span>
            )}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="mt-4 rounded-xl border border-border bg-card p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-muted-foreground">Status</label>
              <select
                value={filters.status}
                onChange={(e) =>
                  handleFilterChange("status", e.target.value as BalanceFiltersState["status"])
                }
                className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus:border-ring focus:ring-1 focus:ring-ring"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-muted-foreground">Amount Range</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Min"
                  value={filters.minAmount}
                  onChange={(e) => handleFilterChange("minAmount", e.target.value)}
                  className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                />
                <span className="text-muted-foreground">-</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Max"
                  value={filters.maxAmount}
                  onChange={(e) => handleFilterChange("maxAmount", e.target.value)}
                  className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>

            <div className="md:hidden">
              <label className="mb-1 block text-sm font-medium text-muted-foreground">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) =>
                  handleFilterChange("sortBy", e.target.value as BalanceFiltersState["sortBy"])
                }
                className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus:border-ring focus:ring-1 focus:ring-ring"
              >
                <option value="createdAt">Created Date</option>
                <option value="paidAmount">Paid Amount</option>
                <option value="name">Item Name</option>
                <option value="counterparty">Counterparty</option>
                <option value="status">Status</option>
                <option value="direction">Direction</option>
              </select>
            </div>

            <div className="md:hidden">
              <label className="mb-1 block text-sm font-medium text-muted-foreground">Order</label>
              <select
                value={filters.sortOrder}
                onChange={(e) =>
                  handleFilterChange("sortOrder", e.target.value as BalanceFiltersState["sortOrder"])
                }
                className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus:border-ring focus:ring-1 focus:ring-ring"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full rounded-lg bg-muted px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/80"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
