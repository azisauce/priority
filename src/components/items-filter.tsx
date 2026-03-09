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
    <div className="mb-6 rounded-xl bg-card border border-border p-3 sm:p-4">
      <div className="flex flex-wrap items-center gap-2 sm:gap-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${showFilters || hasActiveFilters
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
        >
          <Filter className="h-4 w-4" />
          <span className="hidden xs:inline">Filters</span>
          {hasActiveFilters && (
            <span className="ml-1 rounded-full bg-primary-foreground/20 px-2 py-0.5 text-xs text-primary-foreground">
              Active
            </span>
          )}
        </button>

        <div className="flex flex-1 min-w-0 items-center gap-2">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items"
            className="w-full min-w-25 rounded-lg bg-input border border-border px-3 py-2 text-sm text-foreground focus:border-ring focus:ring-1 focus:ring-ring"
          />
        </div>

        <div className="hidden sm:block h-6 w-px bg-border" />

        <div className="flex items-center gap-2">
          <label className="hidden sm:inline text-sm text-muted-foreground">Show:</label>
          <select
            value={showDoneFilter}
            onChange={(e) => setShowDoneFilter(e.target.value as DoneFilter)}
            className="rounded-lg bg-input border border-border px-2 sm:px-3 py-2 text-sm text-foreground focus:border-ring focus:ring-1 focus:ring-ring"
          >
            <option value="all">All</option>
            <option value="done">Done</option>
            <option value="undone">Undone</option>
          </select>
        </div>


      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="mt-4 grid grid-cols-1 gap-4 border-t border-border pt-4 md:grid-cols-2 lg:grid-cols-4">

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
      )}
    </div>
  );
}
