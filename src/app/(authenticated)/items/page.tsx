"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  Search,
  Filter,
  ArrowUp,
  ArrowDown,
  Pencil,
  Trash2,
  X,
  Calculator,
  SlidersHorizontal,
} from "lucide-react";

interface Group {
  id: string;
  groupName: string;
  _count?: { items: number };
}

interface Item {
  id: string;
  itemName: string;
  pricing: number;
  priority: number;
  urgency: number;
  impact: number;
  risk: number;
  frequency: number;
  groupId: string;
  createdAt: string;
  group: Group;
}

interface Filters {
  groupId: string;
  minPriority: string;
  maxPriority: string;
  minPrice: string;
  maxPrice: string;
  sortBy: "priority" | "pricing" | "createdAt" | "valueScore";
  sortOrder: "asc" | "desc";
}

interface ItemFormData {
  itemName: string;
  groupId: string;
  pricing: string;
  urgency: number;
  impact: number;
  risk: number;
  frequency: number;
  priority: string;
}

const calculatePriority = (urgency: number, impact: number, risk: number, frequency: number): number => {
  const score = urgency * 0.3 + impact * 0.3 + risk * 0.25 + frequency * 0.15;
  return Math.round(score * 100) / 100;
};

const calculateValueScore = (priority: number, price: number): number => {
  if (price <= 0) return 0;
  return Math.pow(priority, 5) / price;
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default function ItemsPage() {
  const searchParams = useSearchParams();
  const urlGroupId = searchParams.get("groupId");

  const [items, setItems] = useState<Item[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState<Filters>({
    groupId: urlGroupId || "",
    minPriority: "",
    maxPriority: "",
    minPrice: "",
    maxPrice: "",
    sortBy: "priority",
    sortOrder: "desc",
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [priorityMode, setPriorityMode] = useState<"guided" | "manual">("guided");
  const [deleteItem, setDeleteItem] = useState<Item | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<ItemFormData>({
    itemName: "",
    groupId: urlGroupId || "",
    pricing: "",
    urgency: 3,
    impact: 3,
    risk: 3,
    frequency: 3,
    priority: "3",
  });

  const fetchGroups = useCallback(async () => {
    try {
      const response = await fetch("/api/groups");
      if (response.ok) {
        const data = await response.json();
        setGroups(data.groups || []);
      }
    } catch (error) {
      console.error("Failed to fetch groups:", error);
    }
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.groupId) params.set("groupId", filters.groupId);
      if (filters.minPriority) params.set("minPriority", filters.minPriority);
      if (filters.maxPriority) params.set("maxPriority", filters.maxPriority);
      if (filters.minPrice) params.set("minPrice", filters.minPrice);
      if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
      if (filters.sortBy !== "valueScore") params.set("sortBy", filters.sortBy);
      params.set("sortOrder", filters.sortOrder);

      const response = await fetch(`/api/items?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        let fetchedItems = data.items || [];

        // Client-side sorting for value score
        if (filters.sortBy === "valueScore") {
          fetchedItems = fetchedItems.sort((a: Item, b: Item) => {
            const scoreA = calculateValueScore(a.priority, a.pricing);
            const scoreB = calculateValueScore(b.priority, b.pricing);
            return filters.sortOrder === "asc" ? scoreA - scoreB : scoreB - scoreA;
          });
        }

        setItems(fetchedItems);
      }
    } catch (error) {
      console.error("Failed to fetch items:", error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    if (urlGroupId) {
      setFilters((prev) => ({ ...prev, groupId: urlGroupId }));
      setFormData((prev) => ({ ...prev, groupId: urlGroupId }));
    }
  }, [urlGroupId]);

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
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
  };

  const openAddModal = () => {
    setEditingItem(null);
    setPriorityMode("guided");
    setFormData({
      itemName: "",
      groupId: urlGroupId || "",
      pricing: "",
      urgency: 3,
      impact: 3,
      risk: 3,
      frequency: 3,
      priority: "3",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: Item) => {
    setEditingItem(item);
    setPriorityMode("guided");
    setFormData({
      itemName: item.itemName,
      groupId: item.groupId,
      pricing: item.pricing.toString(),
      urgency: item.urgency,
      impact: item.impact,
      risk: item.risk,
      frequency: item.frequency,
      priority: item.priority.toString(),
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const pricing = parseFloat(formData.pricing);
    if (isNaN(pricing) || pricing <= 0) {
      alert("Please enter a valid price");
      setIsSubmitting(false);
      return;
    }

    let priority: number;
    let urgency: number;
    let impact: number;
    let risk: number;
    let frequency: number;

    if (priorityMode === "manual") {
      priority = parseFloat(formData.priority);
      if (isNaN(priority) || priority < 1 || priority > 5) {
        alert("Priority must be between 1 and 5");
        setIsSubmitting(false);
        return;
      }
      urgency = 3;
      impact = 3;
      risk = 3;
      frequency = 3;
    } else {
      urgency = formData.urgency;
      impact = formData.impact;
      risk = formData.risk;
      frequency = formData.frequency;
      priority = calculatePriority(urgency, impact, risk, frequency);
    }

    const payload = {
      itemName: formData.itemName,
      groupId: formData.groupId,
      pricing,
      urgency,
      impact,
      risk,
      frequency,
      priority,
    };

    try {
      const url = editingItem ? `/api/items/${editingItem.id}` : "/api/items";
      const method = editingItem ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        closeModal();
        fetchItems();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to save item");
      }
    } catch (error) {
      console.error("Failed to save item:", error);
      alert("Failed to save item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;

    try {
      const response = await fetch(`/api/items/${deleteItem.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setDeleteItem(null);
        fetchItems();
      } else {
        alert("Failed to delete item");
      }
    } catch (error) {
      console.error("Failed to delete item:", error);
      alert("Failed to delete item");
    }
  };

  const calculatedPriority =
    priorityMode === "guided"
      ? calculatePriority(formData.urgency, formData.impact, formData.risk, formData.frequency)
      : parseFloat(formData.priority) || 0;

  const hasActiveFilters =
    filters.groupId ||
    filters.minPriority ||
    filters.maxPriority ||
    filters.minPrice ||
    filters.maxPrice;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Items</h1>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add Item
          </button>
        </div>

        {/* Filter Bar */}
        <div className="mb-6 rounded-xl bg-card border border-border p-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${showFilters || hasActiveFilters
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
            >
              <Filter className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <span className="ml-1 rounded-full bg-primary-foreground/20 px-2 py-0.5 text-xs text-primary-foreground">
                  Active
                </span>
              )}
            </button>

            <div className="h-6 w-px bg-border" />

            {/* Quick Sort */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sort by:</span>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                className="rounded-lg bg-input border border-border px-3 py-2 text-sm text-foreground focus:border-ring focus:ring-1 focus:ring-ring"
              >
                <option value="priority">Priority</option>
                <option value="pricing">Price</option>
                <option value="createdAt">Date Added</option>
                <option value="valueScore">Value Score</option>
              </select>
              <button
                onClick={() =>
                  handleFilterChange("sortOrder", filters.sortOrder === "asc" ? "desc" : "asc")
                }
                className="rounded-lg bg-input border border-border p-2 text-muted-foreground hover:bg-muted"
              >
                {filters.sortOrder === "asc" ? (
                  <ArrowUp className="h-4 w-4" />
                ) : (
                  <ArrowDown className="h-4 w-4" />
                )}
              </button>
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
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.groupName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-muted-foreground">
                  Priority Range
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="5"
                    step="0.01"
                    placeholder="Min"
                    value={filters.minPriority}
                    onChange={(e) => handleFilterChange("minPriority", e.target.value)}
                    className="w-full rounded-lg bg-input border border-border px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                  />
                  <span className="text-muted-foreground">-</span>
                  <input
                    type="number"
                    min="1"
                    max="5"
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

        {/* Items Table */}
        <div className="rounded-xl bg-card border border-border overflow-hidden">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <div className="mb-4 rounded-full bg-muted p-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground">No items found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {hasActiveFilters
                  ? "Try adjusting your filters or clear them to see all items."
                  : "Get started by adding your first item."}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">
                      Item Name
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">
                      Group
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">
                      Priority
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">
                      Price
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">
                      Value Score
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">
                      Created
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((item) => {
                    const valueScore = calculateValueScore(item.priority, item.pricing);
                    return (
                      <tr
                        key={item.id}
                        className="group cursor-pointer transition-colors hover:bg-muted/50"
                        onClick={() => openEditModal(item)}
                      >
                        <td className="px-6 py-4">
                          <span className="font-medium text-foreground">{item.itemName}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">
                            {item.group?.groupName || "Unknown"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div
                              className={`h-2 w-2 rounded-full ${item.priority >= 4
                                ? "bg-red-500"
                                : item.priority >= 3
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                                }`}
                            />
                            <span className="text-foreground">{item.priority.toFixed(2)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-foreground">{formatCurrency(item.pricing)}</td>
                        <td className="px-6 py-4">
                          <span className="text-foreground">{valueScore.toFixed(2)}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {formatDate(item.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(item);
                              }}
                              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteItem(item);
                              }}
                              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={closeModal} />
          <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-xl bg-card border border-border shadow-2xl">
            <div className="flex items-center justify-between p-6 pb-2 shrink-0">
              <h2 className="text-xl font-bold text-foreground">
                {editingItem ? "Edit Item" : "Add New Item"}
              </h2>
              <button
                onClick={closeModal}
                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              <form id="item-form" onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Item Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.itemName}
                    onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                    className="w-full rounded-lg bg-input border border-border px-4 py-2.5 text-foreground placeholder-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                    placeholder="Enter item name"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Group <span className="text-destructive">*</span>
                  </label>
                  <select
                    required
                    value={formData.groupId}
                    onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
                    className="w-full rounded-lg bg-input border border-border px-4 py-2.5 text-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                  >
                    <option value="">Select a group</option>
                    {groups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.groupName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Price <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    value={formData.pricing}
                    onChange={(e) => setFormData({ ...formData, pricing: e.target.value })}
                    className="w-full rounded-lg bg-input border border-border px-4 py-2.5 text-foreground placeholder-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                    placeholder="0.00"
                  />
                </div>

                {/* Priority Mode Toggle */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Priority Input Mode
                  </label>
                  <div className="flex rounded-lg bg-input p-1">
                    <button
                      type="button"
                      onClick={() => setPriorityMode("guided")}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors ${priorityMode === "guided"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                      Guided
                    </button>
                    <button
                      type="button"
                      onClick={() => setPriorityMode("manual")}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors ${priorityMode === "manual"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                      <Calculator className="h-4 w-4" />
                      Manual
                    </button>
                  </div>
                </div>

                {/* Priority Input */}
                {priorityMode === "guided" ? (
                  <div className="space-y-4 rounded-lg bg-muted/50 p-4">
                    {[
                      { key: "urgency", label: "Urgency", weight: 30 },
                      { key: "impact", label: "Impact", weight: 30 },
                      { key: "risk", label: "Risk", weight: 25 },
                      { key: "frequency", label: "Frequency", weight: 15 },
                    ].map((dim) => (
                      <div key={dim.key}>
                        <div className="mb-1 flex items-center justify-between">
                          <label className="text-sm font-medium text-foreground">
                            {dim.label} ({dim.weight}%)
                          </label>
                          <span className="text-sm font-semibold text-primary">
                            {formData[dim.key as keyof ItemFormData] as number}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          step="1"
                          value={formData[dim.key as keyof ItemFormData] as number}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              [dim.key]: parseInt(e.target.value),
                            })
                          }
                          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary"
                        />
                        <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                          <span>1</span>
                          <span>2</span>
                          <span>3</span>
                          <span>4</span>
                          <span>5</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Priority (1-5)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      step="0.01"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full rounded-lg bg-input border border-border px-4 py-2.5 text-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                      placeholder="3.00"
                    />
                  </div>
                )}

                {/* Calculated Priority Display */}
                <div className="rounded-lg bg-primary/10 border border-primary/20 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Calculated Priority Score</span>
                    <span className="text-2xl font-bold text-primary">
                      {calculatedPriority.toFixed(2)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {priorityMode === "guided"
                      ? "Based on urgency (30%) + impact (30%) + risk (25%) + frequency (15%)"
                      : "Manually entered priority value"}
                  </p>
                </div>

              </form>
            </div>

            <div className="p-6 pt-2 shrink-0 flex gap-3 bg-card rounded-b-xl border-t border-border">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 rounded-lg bg-muted px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/80"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="item-form"
                disabled={isSubmitting}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : editingItem ? "Save Changes" : "Add Item"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setDeleteItem(null)} />
          <div className="relative w-full max-w-md rounded-xl bg-gray-900 p-6 shadow-2xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
              <Trash2 className="h-6 w-6 text-red-500" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-gray-100">Delete Item</h2>
            <p className="mb-6 text-gray-400">
              Are you sure you want to delete{" "}
              <span className="font-medium text-gray-200">{deleteItem.itemName}</span>? This action
              cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteItem(null)}
                className="flex-1 rounded-lg bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
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
