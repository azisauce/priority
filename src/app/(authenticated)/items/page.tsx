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
} from "lucide-react";
import { Check } from "lucide-react";
import ItemModal from "@/components/item-modal";
import ItemsFilter from "@/components/items-filter";
import PageHeader from "@/components/layout/page-header";

interface Group {
  id: string;
  groupName: string;
  _count?: { items: number };
}

interface EvalItemData {
  id: string;
  name: string;
  value: number;
}

interface ParamAnswerData {
  priorityParam: { id: string; name: string; weight: number };
  paramEvalItem: { id: string; name: string; value: number };
}

interface GroupParam {
  id: string;
  name: string;
  weight: number;
  evalItems: { paramEvalItem: EvalItemData }[];
}

interface Item {
  id: string;
  itemName: string;
  description: string | null;
  pricing: number;
  priority: number;
  groupId: string;
  isDone?: boolean;
  createdAt: string;
  group: Group;
  paramAnswers?: ParamAnswerData[];
  enabledEaseOption?: boolean;
  easePeriod?: number;
  interestPercentage?: number;
  priceWithInterest?: number;
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
  description: string;
  groupId: string;
  pricing: string;
  priority: string;
  // Dynamic: paramId -> evalItemId
  answers: Record<string, string>;
  enabledEaseOption?: boolean;
  easePeriod?: string;
  interestPercentage?: string;
  priceWithInterest?: string;
}

const calculatePriorityFromAnswers = (
  answers: Record<string, string>,
  groupParams: GroupParam[]
): number => {
  const entries = Object.entries(answers).filter(([, evalItemId]) => evalItemId);
  if (entries.length === 0) return 0;

  let totalWeight = 0;
  let weightedSum = 0;

  for (const [paramId, evalItemId] of entries) {
    const param = groupParams.find((p) => p.id === paramId);
    if (!param) continue;
    const evalItem = param.evalItems.find((e) => e.paramEvalItem.id === evalItemId);
    if (!evalItem) continue;
    totalWeight += param.weight;
    weightedSum += evalItem.paramEvalItem.value * param.weight;
  }

  if (totalWeight === 0) return 0;
  return Math.round((weightedSum / totalWeight) * 100) / 100;
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
  const [showDoneFilter, setShowDoneFilter] = useState<"all" | "done" | "undone">("undone");

  const [searchQuery, setSearchQuery] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [priorityMode, setPriorityMode] = useState<"guided" | "manual">("guided");
  const [deleteItem, setDeleteItem] = useState<Item | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [togglingIds, setTogglingIds] = useState<string[]>([]);

  // Group params for the selected group in the form
  const [groupParams, setGroupParams] = useState<GroupParam[]>([]);
  const [loadingGroupParams, setLoadingGroupParams] = useState(false);

  const [formData, setFormData] = useState<ItemFormData>({
    itemName: "",
    description: "",
    groupId: urlGroupId || "",
    pricing: "",
    priority: "3",
    answers: {},
    enabledEaseOption: false,
    easePeriod: "0",
    interestPercentage: "0",
    priceWithInterest: "",
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
      params.set("showDone", showDoneFilter);

      const response = await fetch(`/api/items?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        let fetchedItems = data.items || [];

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
  }, [filters, showDoneFilter]);

  const fetchGroupParams = useCallback(async (groupId: string) => {
    if (!groupId) {
      setGroupParams([]);
      return;
    }
    setLoadingGroupParams(true);
    try {
      const response = await fetch(`/api/groups/${groupId}/params`);
      if (response.ok) {
        const data = await response.json();
        setGroupParams(data.params || []);
      }
    } catch (error) {
      console.error("Failed to fetch group params:", error);
    } finally {
      setLoadingGroupParams(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    // refetch when showDoneFilter changes
    fetchItems();
  }, [showDoneFilter, fetchItems]);

  useEffect(() => {
    if (urlGroupId) {
      setFilters((prev) => ({ ...prev, groupId: urlGroupId }));
      setFormData((prev) => ({ ...prev, groupId: urlGroupId }));
    }
  }, [urlGroupId]);

  // When group changes in form, fetch its params
  useEffect(() => {
    if (formData.groupId && isModalOpen) {
      fetchGroupParams(formData.groupId);
    }
  }, [formData.groupId, isModalOpen, fetchGroupParams]);

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
    setSearchQuery("");
  };

  const openAddModal = () => {
    setEditingItem(null);
    setPriorityMode("guided");
    setFormData({
      itemName: "",
      description: "",
      groupId: urlGroupId || "",
      pricing: "",
      priority: "3",
      answers: {},
      enabledEaseOption: false,
      easePeriod: "0",
      interestPercentage: "0",
      priceWithInterest: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: Item) => {
    setEditingItem(item);
    setPriorityMode("guided");
    // Build answers map from paramAnswers
    const answers: Record<string, string> = {};
    if (item.paramAnswers) {
      for (const pa of item.paramAnswers) {
        answers[pa.priorityParam.id] = pa.paramEvalItem.id;
      }
    }
    setFormData({
      itemName: item.itemName,
      description: item.description ?? "",
      groupId: item.groupId,
      pricing: item.pricing.toString(),
      priority: item.priority.toString(),
      enabledEaseOption: Boolean(item.enabledEaseOption),
      easePeriod: item.easePeriod?.toString() ?? "0",
      interestPercentage: item.interestPercentage?.toString() ?? "0",
      priceWithInterest: item.priceWithInterest != null ? item.priceWithInterest.toString() : "",
      answers,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setGroupParams([]);
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
    const answersArray: { priorityParamId: string; paramEvalItemId: string }[] = [];

    if (priorityMode === "manual") {
      priority = parseFloat(formData.priority);
      if (isNaN(priority) || priority < 0) {
        alert("Priority must be a valid number");
        setIsSubmitting(false);
        return;
      }
    } else {
      // Build answers from form
      for (const [paramId, evalItemId] of Object.entries(formData.answers)) {
        if (evalItemId) {
          answersArray.push({
            priorityParamId: paramId,
            paramEvalItemId: evalItemId,
          });
        }
      }
      priority = calculatePriorityFromAnswers(formData.answers, groupParams);
    }

    // Rely on native HTML validation for ease fields (they are marked `required` when enabled)

    const payload: Record<string, unknown> = {
      itemName: formData.itemName,
      description: formData.description.trim() || null,
      groupId: formData.groupId,
      pricing,
      enabledEaseOption: !!formData.enabledEaseOption,
      easePeriod: formData.easePeriod ? parseInt(formData.easePeriod, 10) : 0,
      interestPercentage: formData.interestPercentage ? parseFloat(formData.interestPercentage) : 0,
      priceWithInterest: formData.priceWithInterest ? parseFloat(formData.priceWithInterest) : null,
    };

    if (priorityMode === "manual") {
      payload.priority = priority;
    } else {
      payload.answers = answersArray;
    }

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

  const toggleItemDone = async (item: Item, done: boolean) => {
    // optimistic update: remove item from list when marking done
    setTogglingIds((prev) => [...prev, item.id]);
    const previousItems = items;
    if (done) {
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    }

    try {
      const response = await fetch(`/api/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDone: done }),
      });

      if (!response.ok) {
        throw new Error("Failed to update item");
      }
    } catch (err) {
      // revert on error
      setItems(previousItems);
      alert("Failed to update item status");
    } finally {
      setTogglingIds((prev) => prev.filter((id) => id !== item.id));
    }
  };

  const calculatedPriority =
    priorityMode === "guided"
      ? calculatePriorityFromAnswers(formData.answers, groupParams)
      : parseFloat(formData.priority) || 0;

  const totalWeight = groupParams.reduce((s, p) => s + p.weight, 0);

  const hasActiveFilters =
    searchQuery ||
    filters.groupId ||
    filters.minPriority ||
    filters.maxPriority ||
    filters.minPrice ||
    filters.maxPrice;

  const displayedItems = items.filter((item) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    if (item.itemName.toLowerCase().includes(q)) return true;
    if (item.description && item.description.toLowerCase().includes(q)) return true;
    return false;
  });

  return (
    <div className="space-y-6 py-4">
      <div className="flex items-center justify-between">
        <PageHeader title="Items" description="All your wishlist items in one place" />
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 rounded-lg bg-primary px-3 sm:px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          style={{ height: "40px", borderRadius: "9999px" }}
        >
          <Plus className="h-4 w-4" />
          <span className="sm:hidden">Add</span>
          <span className="hidden sm:inline">Add Item</span>
        </button>
      </div>

      <ItemsFilter
        filters={filters}
        setFilters={setFilters}
        showDoneFilter={showDoneFilter}
        setShowDoneFilter={setShowDoneFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        groups={groups}
      />

      {/* Items Table / Cards */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : displayedItems.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-center px-4">
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
          <>
            {/* Mobile Card View */}
            <div className="divide-y divide-border md:hidden">
              {displayedItems.map((item) => {
                const valueScore = calculateValueScore(item.priority, item.pricing);
                return (
                  <div
                    key={item.id}
                    className="p-4 transition-colors hover:bg-muted/50 active:bg-muted/50"
                    onClick={() => openEditModal(item)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!togglingIds.includes(item.id)) toggleItemDone(item, true);
                          }}
                          disabled={togglingIds.includes(item.id)}
                          className="mt-0.5 shrink-0 rounded-full p-1 text-muted-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
                          title="Mark done"
                        >
                          <Check className="h-4 w-4 text-green-500" />
                        </button>
                        <div className="min-w-0">
                          <span className={"font-medium text-sm " + (item.isDone ? "text-muted-foreground line-through" : "text-foreground")}>
                            {item.itemName}
                          </span>
                          {item.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                              {item.group?.groupName || "Unknown"}
                            </span>
                            <div className="flex items-center gap-1">
                              <div
                                className={`h-2 w-2 rounded-full ${item.priority >= 4
                                  ? "bg-red-500"
                                  : item.priority >= 3
                                    ? "bg-yellow-500"
                                    : "bg-green-500"
                                  }`}
                              />
                              <span className="text-xs text-muted-foreground">{item.priority.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="text-sm font-medium text-foreground">{formatCurrency(item.pricing)}</span>
                        <p className="text-xs text-muted-foreground mt-0.5">VS: {valueScore.toFixed(2)}</p>
                        <div className="flex items-center justify-end gap-1 mt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(item);
                            }}
                            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteItem(item);
                            }}
                            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
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
                  {displayedItems.map((item) => {
                    const valueScore = calculateValueScore(item.priority, item.pricing);
                    return (
                      <tr
                        key={item.id}
                        className="group cursor-pointer transition-colors hover:bg-muted/50"
                        onClick={() => openEditModal(item)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!togglingIds.includes(item.id)) toggleItemDone(item, true);
                              }}
                              disabled={togglingIds.includes(item.id)}
                              className="rounded-full p-1 text-muted-foreground transform transition duration-150 ease-out hover:scale-105 active:scale-95 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
                              title="Mark done"
                            >
                              <Check className="h-4 w-4 text-green-500" />
                            </button>
                            <div>
                              <span className={"font-medium " + (item.isDone ? "text-muted-foreground line-through" : "text-foreground")}>
                                {item.itemName}
                              </span>
                              {item.description && (
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.description}</p>
                              )}
                            </div>
                          </div>
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
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      <ItemModal
        isOpen={isModalOpen}
        onClose={closeModal}
        editingItem={editingItem}
        formData={formData}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        groups={groups}
        groupParams={groupParams}
        loadingGroupParams={loadingGroupParams}
        priorityMode={priorityMode}
        setPriorityMode={setPriorityMode}
        calculatedPriority={calculatedPriority}
        totalWeight={totalWeight}
      />

      {/* Delete Confirmation Modal */}
      {deleteItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setDeleteItem(null)} />
          <div className="relative w-full max-w-md rounded-xl bg-popover border border-border p-6 shadow-2xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <Trash2 className="h-6 w-6 text-destructive" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-foreground">Delete Item</h2>
            <p className="mb-6 text-muted-foreground">
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">{deleteItem.itemName}</span>? This action
              cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteItem(null)}
                className="flex-1 rounded-lg bg-muted px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/80"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
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
