"use client";

import { useState } from "react";
import { Filter, Search } from "lucide-react";

type Props = {
  filters: any;
  setFilters: (f: any) => void;
  showDoneFilter: DoneFilter;
  setShowDoneFilter: React.Dispatch<React.SetStateAction<DoneFilter>>;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  groups: any[];
};

export type DoneFilter = "all" | "done" | "undone";

export default function ItemsFilter({
  filters,
  setFilters,
  showDoneFilter,
  setShowDoneFilter,
  searchQuery,
  setSearchQuery,
  groups,
}: Props) {
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters =
    Boolean(searchQuery) ||
    Boolean(filters.groupId) ||
    Boolean(filters.minPriority) ||
    Boolean(filters.maxPriority) ||
    Boolean(filters.minPrice) ||
    Boolean(filters.maxPrice);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev: any) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      groupId: "",
      minPriority: "",
      maxPriority: "",
      minPrice: "",
      maxPrice: "",
      sortBy: "priority",
      sortOrder: "desc",
    });
    setShowDoneFilter("all");
    setSearchQuery("");
    setShowFilters(false);
  };

  return (
    <div className="mb-6">
      {/* Main Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items..."
            className="w-full rounded-lg bg-input border border-border pl-10 pr-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
          />
        </div>

        {/* Action / Filter Toggles */}
        <div className="flex flex-row gap-3 overflow-x-auto shrink-0">
          {/* Status Pills */}
          <div className="flex rounded-lg bg-input p-1 border border-border">
            {[
              { value: "all", label: "All" },
              { value: "undone", label: "Active" },
              { value: "done", label: "Done" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setShowDoneFilter(opt.value as DoneFilter)}
                className={`flex-1 whitespace-nowrap sm:flex-none rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${showDoneFilter === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Advanced Filters Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center shrink-0 justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors border ${showFilters || hasActiveFilters
              ? "bg-primary border-primary text-primary-foreground"
              : "bg-input border-border text-muted-foreground hover:bg-muted"
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

      {/* Expanded Filters */}
      {showFilters && (
        <div className="mt-4 rounded-xl bg-card border border-border p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">

            <div>
              <label className="mb-1 block text-sm font-medium text-muted-foreground">Group</label>
              <select
                value={filters.groupId}
                onChange={(e) => handleFilterChange("groupId", e.target.value)}
                className="w-full rounded-lg bg-input border border-border px-3 py-2 text-sm text-foreground focus:border-ring focus:ring-1 focus:ring-ring"
              >
                <option value="">All Groups</option>
                {groups.map((group: any) => (
                  <option key={group.id} value={group.id}>
                    {group.groupName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-muted-foreground">Priority Range</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Min"
                  value={filters.minPriority}
                  onChange={(e) => handleFilterChange("minPriority", e.target.value)}
                  className="w-full rounded-lg bg-input border border-border px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                />
                <span className="text-muted-foreground">-</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Max"
                  value={filters.maxPriority}
                  onChange={(e) => handleFilterChange("maxPriority", e.target.value)}
                  className="w-full rounded-lg bg-input border border-border px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-muted-foreground">Price Range</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Min"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange("minPrice", e.target.value)}
                  className="w-full rounded-lg bg-input border border-border px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                />
                <span className="text-muted-foreground">-</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Max"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
                  className="w-full rounded-lg bg-input border border-border px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                />
              </div>
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
