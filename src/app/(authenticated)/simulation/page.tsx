"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Play,
  Calendar,
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Users,
  Clock,
} from "lucide-react";
import ItemModal from "@/components/item-modal";

interface Group {
  id: string;
  groupName: string;
  _count?: { items: number };
}

interface SimulationItem {
  id: string;
  itemName: string;
  pricing: number;
  priority: number;
  score: number;
  isInstallment?: boolean;
  monthlyPayment?: number;
  remainingInstallments?: number;
}

interface MonthlyPurchase {
  month: number;
  items: SimulationItem[];
  spent: number;
  remaining: number;
}

interface SimulationResult {
  totalMonths: number;
  monthlyPurchases: MonthlyPurchase[];
  totalSpent: number;
  unpurchased: { id: string; itemName: string; pricing: number; priority: number }[];
}

interface SimulationFormData {
  initialBudget: string;
  monthlyIncome: string;
  deadlineMonths: string;
  maxPriceThreshold?: string;
  useEase?: boolean;
  formula?: "greedy" | "optimal";
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

export default function SimulationPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [hasRun, setHasRun] = useState(false);

  const [formData, setFormData] = useState<SimulationFormData>({
    initialBudget: "",
    monthlyIncome: "",
    deadlineMonths: "",
    maxPriceThreshold: "",
    useEase: true,
    formula: "greedy",
  });

  const fetchGroups = useCallback(async () => {
    try {
      const response = await fetch("/api/groups");
      if (response.ok) {
        const data = await response.json();
        setGroups(data.groups || []);
        setSelectedGroupIds((data.groups || []).map((g: Group) => g.id));
      }
    } catch (error) {
      console.error("Failed to fetch groups:", error);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const toggleGroup = (groupId: string) => {
    setSelectedGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  const selectAllGroups = () => {
    setSelectedGroupIds(groups.map((g) => g.id));
  };

  const deselectAllGroups = () => {
    setSelectedGroupIds([]);
  };

  const handleRunSimulation = async (e: React.FormEvent) => {
    e.preventDefault();

    const initialBudget = parseFloat(formData.initialBudget);
    const monthlyIncome = parseFloat(formData.monthlyIncome);

    if (isNaN(initialBudget) || initialBudget < 0) {
      alert("Please enter a valid initial budget");
      return;
    }

    if (isNaN(monthlyIncome) || monthlyIncome < 0) {
      alert("Please enter a valid monthly income");
      return;
    }

    const deadlineMonths = formData.deadlineMonths
      ? parseInt(formData.deadlineMonths)
      : undefined;

    if (deadlineMonths !== undefined && (isNaN(deadlineMonths) || deadlineMonths <= 0)) {
      alert("Deadline months must be a positive number");
      return;
    }

    setLoading(true);
    setHasRun(true);

    try {
      const maxPriceThreshold = formData.maxPriceThreshold
        ? parseFloat(formData.maxPriceThreshold)
        : undefined;

      if (maxPriceThreshold !== undefined && (isNaN(maxPriceThreshold) || maxPriceThreshold <= 0)) {
        alert("Please enter a valid max price threshold");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/simulation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initialBudget,
          monthlyIncome,
          deadlineMonths,
          maxPriceThreshold,
          groupIds: selectedGroupIds.length > 0 ? selectedGroupIds : undefined,
          useEase: typeof formData.useEase === "boolean" ? formData.useEase : true,
          formula: formData.formula || "greedy",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSimulation(data.simulation);

        const itemsResponse = await fetch("/api/items");
        if (itemsResponse.ok) {
          const itemsData = await itemsResponse.json();
          let items = itemsData.items || [];
          if (selectedGroupIds.length > 0) {
            items = items.filter((item: { groupId: string }) =>
              selectedGroupIds.includes(item.groupId)
            );
          }
          if (typeof maxPriceThreshold === "number") {
            items = items.filter((item: { pricing: number }) => item.pricing <= maxPriceThreshold);
          }
          setTotalItems(items.length);
        }
      } else {
        const error = await response.json();
        alert(error.error || "Failed to run simulation");
      }
    } catch (error) {
      console.error("Failed to run simulation:", error);
      alert("Failed to run simulation");
    } finally {
      setLoading(false);
    }
  };

  // Filter months: hide months that have no purchases or only ongoing installment payments.
  // Show a month if it contains any non-installment purchase OR contains a final installment (remainingInstallments <= 0).
  const visibleMonths = simulation
    ? simulation.monthlyPurchases.filter((m) =>
      m.items.some((it) => !it.isInstallment || (it.remainingInstallments ?? 0) <= 0)
    )
    : [];

  // Use the visible months to compute the maximum monthly spent so bars scale to what's shown.
  const maxMonthlySpent = visibleMonths.length > 0
    ? Math.max(...visibleMonths.map((m) => m.spent), 1)
    : simulation
      ? Math.max(...simulation.monthlyPurchases.map((m) => m.spent), 1)
      : 1;

  const purchasedItemsCount = simulation
    ? simulation.monthlyPurchases.reduce((sum, m) => sum + m.items.length, 0)
    : 0;

  // Item modal state (reuse existing ItemModal)
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [itemFormData, setItemFormData] = useState<any>({
    itemName: "",
    description: "",
    groupId: "",
    pricing: "",
    priority: "3",
    answers: {},
    enabledEaseOption: false,
    easePeriod: "0",
    interestPercentage: "0",
    priceWithInterest: "",
  });
  const [priorityModeItem, setPriorityModeItem] = useState<"guided" | "manual">("guided");
  const [groupParams, setGroupParams] = useState<any[]>([]);
  const [loadingGroupParams, setLoadingGroupParams] = useState(false);
  const [isItemSubmitting, setIsItemSubmitting] = useState(false);

  const calculatePriorityFromAnswers = (
    answers: Record<string, string>,
    gp: any[]
  ) => {
    const entries = Object.entries(answers).filter(([, evalItemId]) => evalItemId);
    if (entries.length === 0) return 0;

    let totalWeight = 0;
    let weightedSum = 0;

    for (const [paramId, evalItemId] of entries) {
      const param = gp.find((p) => p.id === paramId);
      if (!param) continue;
      const evalItem = param.evalItems.find((e: any) => e.paramEvalItem.id === evalItemId);
      if (!evalItem) continue;
      totalWeight += param.weight;
      weightedSum += evalItem.paramEvalItem.value * param.weight;
    }

    if (totalWeight === 0) return 0;
    return Math.round((weightedSum / totalWeight) * 100) / 100;
  };

  const openItemModal = async (id: string) => {
    try {
      const res = await fetch(`/api/items/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      const item = data.item;
      setEditingItem(item);
      const answers: Record<string, string> = {};
      if (item.paramAnswers) {
        for (const pa of item.paramAnswers) {
          answers[pa.priorityParam.id] = pa.paramEvalItem.id;
        }
      }
      setItemFormData({
        itemName: item.itemName,
        description: item.description ?? "",
        groupId: item.groupId || "",
        pricing: item.pricing != null ? String(item.pricing) : "",
        priority: item.priority != null ? String(item.priority) : "3",
        answers,
        enabledEaseOption: Boolean(item.enabledEaseOption),
        easePeriod: item.easePeriod != null ? String(item.easePeriod) : "0",
        interestPercentage: item.interestPercentage != null ? String(item.interestPercentage) : "0",
        priceWithInterest: item.priceWithInterest != null ? String(item.priceWithInterest) : "",
      });
      setIsItemModalOpen(true);
      // fetch group params for the item's group
      if (item.groupId) await fetchGroupParams(item.groupId);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchGroupParams = async (groupId: string) => {
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
  };

  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setIsItemSubmitting(true);
    try {
      const pricing = parseFloat(itemFormData.pricing);
      if (isNaN(pricing) || pricing <= 0) {
        alert("Please enter a valid price");
        setIsItemSubmitting(false);
        return;
      }

      const payload: any = {
        itemName: itemFormData.itemName,
        description: itemFormData.description.trim() || null,
        groupId: itemFormData.groupId,
        pricing,
        enabledEaseOption: !!itemFormData.enabledEaseOption,
        easePeriod: itemFormData.easePeriod ? parseInt(itemFormData.easePeriod, 10) : 0,
        interestPercentage: itemFormData.interestPercentage ? parseFloat(itemFormData.interestPercentage) : 0,
        priceWithInterest: itemFormData.priceWithInterest ? parseFloat(itemFormData.priceWithInterest) : null,
      };

      // use priority field directly when manual
      if (priorityModeItem === "manual") {
        const pr = parseFloat(itemFormData.priority);
        if (isNaN(pr) || pr < 0) {
          alert("Priority must be a valid number");
          setIsItemSubmitting(false);
          return;
        }
        payload.priority = pr;
      } else {
        // convert answers to array
        const answersArray: { priorityParamId: string; paramEvalItemId: string }[] = [];
        for (const [paramId, evalItemId] of Object.entries(itemFormData.answers || {})) {
          if (evalItemId) answersArray.push({ priorityParamId: paramId, paramEvalItemId: String(evalItemId) });
        }
        payload.answers = answersArray;
      }

      const response = await fetch(`/api/items/${editingItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setIsItemModalOpen(false);
        // re-run simulation with current params
        handleRunSimulation({ preventDefault: () => { } } as any);
      } else {
        const err = await response.json();
        alert(err.error || "Failed to save item");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save item");
    } finally {
      setIsItemSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Simulation</h1>
        <p className="mt-1 text-sm sm:text-base text-muted-foreground">Plan your purchases over time</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="rounded-xl bg-card border border-border p-4 sm:p-6">
            <h2 className="mb-6 text-lg font-semibold text-foreground">Configuration</h2>

            <form onSubmit={handleRunSimulation} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Initial Budget <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.initialBudget}
                    onChange={(e) =>
                      setFormData({ ...formData, initialBudget: e.target.value })
                    }
                    className="w-full rounded-lg bg-input border border-border pl-10 pr-4 py-2.5 text-foreground placeholder-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Monthly Income <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.monthlyIncome}
                    onChange={(e) =>
                      setFormData({ ...formData, monthlyIncome: e.target.value })
                    }
                    className="w-full rounded-lg bg-input border border-border pl-10 pr-4 py-2.5 text-foreground placeholder-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Deadline (months)
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={formData.deadlineMonths}
                  onChange={(e) =>
                    setFormData({ ...formData, deadlineMonths: e.target.value })
                  }
                  className="w-full rounded-lg bg-input border border-border px-4 py-2.5 text-foreground placeholder-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                  placeholder="No limit"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Max Price Threshold
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.maxPriceThreshold}
                    onChange={(e) =>
                      setFormData({ ...formData, maxPriceThreshold: e.target.value })
                    }
                    className="w-full rounded-lg bg-input border border-border pl-10 pr-4 py-2.5 text-foreground placeholder-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                    placeholder="No limit"
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Optional: ignore items with price above this value.</p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Use Ease Option</label>
                <div className="flex items-center gap-3">
                  <input
                    id="useEase"
                    type="checkbox"
                    checked={!!formData.useEase}
                    onChange={(e) => setFormData({ ...formData, useEase: e.target.checked })}
                    className="h-4 w-4 rounded border-border bg-input text-primary focus:ring-ring"
                  />
                  <label htmlFor="useEase" className="text-sm text-muted-foreground">
                    Simulate using ease (installments). When disabled, simulator will ignore ease options.
                  </label>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Formula</label>
                <select
                  value={formData.formula}
                  onChange={(e) => setFormData({ ...formData, formula: e.target.value as any })}
                  className="w-full rounded-lg bg-input border border-border px-4 py-2.5 text-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                >
                  <option value="greedy">Greedy (existing)</option>
                  <option value="optimal">Optimal (knapsack)</option>
                </select>
                <p className="mt-1 text-xs text-muted-foreground">Choose simulation formula: greedy or optimal selection.</p>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">
                    Filter by Groups
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectAllGroups}
                      className="text-xs text-primary hover:text-primary/80"
                    >
                      Select All
                    </button>
                    <span className="text-muted-foreground">|</span>
                    <button
                      type="button"
                      onClick={deselectAllGroups}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg bg-muted/50 p-3">
                  {groups.length === 0 ? (
                    <p className="py-2 text-sm text-muted-foreground">No groups available</p>
                  ) : (
                    groups.map((group) => (
                      <label
                        key={group.id}
                        className="flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted"
                      >
                        <input
                          type="checkbox"
                          checked={selectedGroupIds.includes(group.id)}
                          onChange={() => toggleGroup(group.id)}
                          className="h-4 w-4 rounded border-border bg-input text-primary focus:ring-ring focus:ring-offset-0"
                        />
                        <div className="flex-1">
                          <span className="text-sm text-foreground">{group.groupName}</span>
                          <span className="ml-2 text-xs text-muted-foreground">
                            ({group._count?.items || 0} items)
                          </span>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Run Simulation
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          {!hasRun ? (
            <div className="flex h-full min-h-100 items-center justify-center rounded-xl bg-card border border-border">
              <div className="text-center">
                <div className="mb-4 inline-flex rounded-full bg-muted p-4">
                  <BarChart3 className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground">No simulation run yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Configure your budget and run a simulation to see results
                </p>
              </div>
            </div>
          ) : loading ? (
            <div className="flex h-full min-h-100 items-center justify-center rounded-xl bg-card border border-border">
              <div className="flex flex-col items-center gap-4">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-muted-foreground">Running simulation...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {simulation && (
                <>
                  <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
                    <div className="rounded-xl bg-card border border-border p-3 sm:p-5">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-primary/10 p-2">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm text-muted-foreground">Total Months</p>
                          <p className="text-xl sm:text-2xl font-bold text-foreground">
                            {simulation.totalMonths}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl bg-card border border-border p-3 sm:p-5">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-green-600/10 p-2">
                          <DollarSign className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm text-muted-foreground">Total Spent</p>
                          <p className="text-xl sm:text-2xl font-bold text-foreground">
                            {formatCurrency(simulation.totalSpent)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl bg-card border border-border p-3 sm:p-5">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-purple-600/10 p-2">
                          <ShoppingCart className="h-5 w-5 text-purple-500" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm text-muted-foreground">Items Purchased</p>
                          <p className="text-xl sm:text-2xl font-bold text-foreground">
                            {purchasedItemsCount} / {totalItems}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {visibleMonths.length > 0 && (
                    <div className="rounded-xl bg-card border border-border p-3 sm:p-5">
                      <h3 className="mb-4 text-base sm:text-lg font-semibold text-foreground">
                        Spending Timeline
                      </h3>
                      <div className="flex h-24 items-end gap-1 sm:gap-2 overflow-x-auto pb-8">
                        {visibleMonths.map((month: MonthlyPurchase) => {
                          const width = month.spent > 0 ? (month.spent / maxMonthlySpent) * 100 : 0;
                          return (
                            <div
                              key={month.month}
                              className="group relative flex-1 h-full flex items-end justify-center"
                            >
                              <div
                                className="mx-auto h-full min-h-1 w-full max-w-15 rounded-t-md bg-primary transition-colors hover:bg-primary/80"
                                style={{ height: `${Math.max(width, 1)}%` }}
                              />
                              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">
                                M{month.month}
                              </div>
                              <div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-popover text-popover-foreground px-2 py-1 text-xs opacity-0 transition-opacity group-hover:opacity-100 shadow-lg border border-border">
                                {formatCurrency(month.spent)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <ItemModal
                    isOpen={isItemModalOpen}
                    onClose={() => setIsItemModalOpen(false)}
                    editingItem={editingItem}
                    formData={itemFormData}
                    setFormData={setItemFormData}
                    handleSubmit={handleItemSubmit}
                    isSubmitting={isItemSubmitting}
                    groups={groups}
                    groupParams={groupParams}
                    loadingGroupParams={loadingGroupParams}
                    priorityMode={priorityModeItem}
                    setPriorityMode={setPriorityModeItem}
                    calculatedPriority={calculatePriorityFromAnswers(itemFormData.answers || {}, groupParams)}
                    totalWeight={groupParams.reduce((s, p) => s + (p.weight || 0), 0)}
                  />

                  {visibleMonths.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-base sm:text-lg font-semibold text-foreground">Monthly Breakdown</h3>
                      {visibleMonths.map((month) => (
                        <div key={month.month} className="rounded-xl bg-card border border-border overflow-hidden">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 bg-muted/50 px-3 sm:px-5 py-2 sm:py-3">
                            <h4 className="font-medium text-foreground text-sm sm:text-base">Month {month.month}</h4>
                            <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm">
                              <span className="text-muted-foreground">
                                Spent: <span className="font-medium text-foreground">{formatCurrency(month.spent)}</span>
                              </span>
                              <span className="text-muted-foreground">
                                Remaining: <span className="font-medium text-green-500">{formatCurrency(month.remaining)}</span>
                              </span>
                            </div>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b border-border">
                                  <th className="px-3 sm:px-5 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-muted-foreground">
                                    Item Name
                                  </th>
                                  <th className="px-3 sm:px-5 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-muted-foreground">
                                    Priority
                                  </th>
                                  <th className="px-3 sm:px-5 py-2 sm:py-3 text-right text-xs sm:text-sm font-medium text-muted-foreground">
                                    Price
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border">
                                {month.items.map((item) => (
                                  <tr key={item.id} className="transition-colors hover:bg-muted/50">
                                    <td className="px-3 sm:px-5 py-2 sm:py-3">
                                      <div className="flex items-center gap-2">
                                        {(!item.isInstallment || (item.isInstallment && (item.remainingInstallments ?? 0) <= 0)) ? (
                                          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                                        ) : (
                                          <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                                        )}
                                        <span className="text-foreground cursor-pointer text-sm" onClick={() => openItemModal(item.id)}>{item.itemName}</span>
                                      </div>
                                    </td>
                                    <td className="px-3 sm:px-5 py-2 sm:py-3">
                                      <span className="text-muted-foreground text-sm">{item.priority.toFixed(2)}</span>
                                    </td>
                                    <td className="px-3 sm:px-5 py-2 sm:py-3 text-right">
                                      {item.isInstallment ? (
                                        <div className="text-right">
                                          <div className="text-foreground text-sm">{formatCurrency(item.monthlyPayment || 0)}/mo</div>
                                          <div className="text-xs text-muted-foreground">Remaining: {item.remainingInstallments} months</div>
                                        </div>
                                      ) : (
                                        <span className="text-foreground text-sm">{formatCurrency(item.pricing)}</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {simulation.unpurchased.length > 0 && (
                    <div className="rounded-xl bg-destructive/5 border border-destructive/20 overflow-hidden">
                      <div className="flex items-center gap-3 bg-destructive/10 px-3 sm:px-5 py-2 sm:py-3">
                        <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                        <h3 className="font-medium text-destructive text-sm sm:text-base">
                          Unpurchased Items ({simulation.unpurchased.length})
                        </h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-destructive/20">
                              <th className="px-3 sm:px-5 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-destructive/80">
                                Item Name
                              </th>
                              <th className="px-3 sm:px-5 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-destructive/80">
                                Priority
                              </th>
                              <th className="px-3 sm:px-5 py-2 sm:py-3 text-right text-xs sm:text-sm font-medium text-destructive/80">
                                Price
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-destructive/20">
                            {simulation.unpurchased.map((item) => (
                              <tr key={item.id} className="transition-colors hover:bg-destructive/10">
                                <td className="px-3 sm:px-5 py-2 sm:py-3 text-destructive-foreground text-sm">{item.itemName}</td>
                                <td className="px-3 sm:px-5 py-2 sm:py-3 text-destructive-foreground text-sm">{item.priority.toFixed(2)}</td>
                                <td className="px-3 sm:px-5 py-2 sm:py-3 text-right text-destructive-foreground text-sm">
                                  {formatCurrency(item.pricing)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {simulation.monthlyPurchases.length === 0 && simulation.unpurchased.length === 0 && (
                    <div className="rounded-xl bg-card border border-border p-8 text-center">
                      <div className="mb-3 inline-flex rounded-full bg-muted p-3">
                        <Users className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-medium text-foreground">No items to simulate</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Add items to your selected groups to run a simulation
                      </p>
                    </div>
                  )}

                  {simulation.unpurchased.length === 0 &&
                    simulation.monthlyPurchases.length > 0 &&
                    purchasedItemsCount > 0 && (
                      <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-5">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                          <div>
                            <h3 className="font-medium text-green-600 dark:text-green-400">All items purchased!</h3>
                            <p className="text-sm text-green-600/80 dark:text-green-400/80">
                              Congratulations! You have purchased all {purchasedItemsCount} items.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
