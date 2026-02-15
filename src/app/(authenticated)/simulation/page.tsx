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
} from "lucide-react";

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
      const response = await fetch("/api/simulation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initialBudget,
          monthlyIncome,
          deadlineMonths,
          groupIds: selectedGroupIds.length > 0 ? selectedGroupIds : undefined,
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

  const maxMonthlySpent = simulation
    ? Math.max(...simulation.monthlyPurchases.map((m) => m.spent), 1)
    : 1;

  const purchasedItemsCount = simulation
    ? simulation.monthlyPurchases.reduce((sum, m) => sum + m.items.length, 0)
    : 0;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Simulation</h1>
          <p className="mt-1 text-muted-foreground">Plan your purchases over time</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="rounded-xl bg-card border border-border p-6">
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
              <div className="flex h-full min-h-[400px] items-center justify-center rounded-xl bg-card border border-border">
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
              <div className="flex h-full min-h-[400px] items-center justify-center rounded-xl bg-card border border-border">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <p className="text-muted-foreground">Running simulation...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {simulation && (
                  <>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="rounded-xl bg-card border border-border p-5">
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-blue-600/10 p-2">
                            <Calendar className="h-5 w-5 text-blue-500" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Total Months</p>
                            <p className="text-2xl font-bold text-foreground">
                              {simulation.totalMonths}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl bg-card border border-border p-5">
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-green-600/10 p-2">
                            <DollarSign className="h-5 w-5 text-green-500" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Total Spent</p>
                            <p className="text-2xl font-bold text-foreground">
                              {formatCurrency(simulation.totalSpent)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl bg-card border border-border p-5">
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-purple-600/10 p-2">
                            <ShoppingCart className="h-5 w-5 text-purple-500" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Items Purchased</p>
                            <p className="text-2xl font-bold text-foreground">
                              {purchasedItemsCount} / {totalItems}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {simulation.monthlyPurchases.length > 0 && (
                      <div className="rounded-xl bg-card border border-border p-5">
                        <h3 className="mb-4 text-lg font-semibold text-foreground">
                          Spending Timeline
                        </h3>
                        <div className="flex h-24 items-end gap-2">
                          {simulation.monthlyPurchases.map((month: MonthlyPurchase) => {
                            const width = month.spent > 0 ? (month.spent / maxMonthlySpent) * 100 : 0;
                            return (
                              <div
                                key={month.month}
                                className="group relative flex-1"
                              >
                                <div
                                  className="mx-auto h-full min-h-[4px] w-full max-w-[60px] rounded-t-md bg-primary transition-colors hover:bg-primary/80"
                                  style={{ height: `${Math.max(width, 4)}%` }}
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

                    {simulation.monthlyPurchases.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-foreground">Monthly Breakdown</h3>
                        {simulation.monthlyPurchases.map((month) => (
                          <div key={month.month} className="rounded-xl bg-card border border-border overflow-hidden">
                            <div className="flex items-center justify-between bg-muted/50 px-5 py-3">
                              <h4 className="font-medium text-foreground">Month {month.month}</h4>
                              <div className="flex items-center gap-4 text-sm">
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
                                    <th className="px-5 py-3 text-left text-sm font-medium text-muted-foreground">
                                      Item Name
                                    </th>
                                    <th className="px-5 py-3 text-left text-sm font-medium text-muted-foreground">
                                      Priority
                                    </th>
                                    <th className="px-5 py-3 text-right text-sm font-medium text-muted-foreground">
                                      Price
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                  {month.items.map((item) => (
                                    <tr key={item.id} className="transition-colors hover:bg-muted/50">
                                      <td className="px-5 py-3">
                                        <div className="flex items-center gap-2">
                                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                                          <span className="text-foreground">{item.itemName}</span>
                                        </div>
                                      </td>
                                      <td className="px-5 py-3">
                                        <span className="text-muted-foreground">{item.priority.toFixed(2)}</span>
                                      </td>
                                      <td className="px-5 py-3 text-right">
                                        <span className="text-foreground">{formatCurrency(item.pricing)}</span>
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
                      <div className="rounded-xl bg-red-900/10 border border-red-900/20 overflow-hidden">
                        <div className="flex items-center gap-3 bg-red-900/20 px-5 py-3">
                          <AlertTriangle className="h-5 w-5 text-red-400" />
                          <h3 className="font-medium text-red-300">
                            Unpurchased Items ({simulation.unpurchased.length})
                          </h3>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-red-900/20">
                                <th className="px-5 py-3 text-left text-sm font-medium text-red-400/80">
                                  Item Name
                                </th>
                                <th className="px-5 py-3 text-left text-sm font-medium text-red-400/80">
                                  Priority
                                </th>
                                <th className="px-5 py-3 text-right text-sm font-medium text-red-400/80">
                                  Price
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-red-900/20">
                              {simulation.unpurchased.map((item) => (
                                <tr key={item.id} className="transition-colors hover:bg-destructive/10">
                                  <td className="px-5 py-3 text-destructive-foreground">{item.itemName}</td>
                                  <td className="px-5 py-3 text-destructive-foreground">{item.priority.toFixed(2)}</td>
                                  <td className="px-5 py-3 text-right text-destructive-foreground">
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
                        <div className="rounded-xl bg-green-900/10 border border-green-900/20 p-5">
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-6 w-6 text-green-400" />
                            <div>
                              <h3 className="font-medium text-green-300">All items purchased!</h3>
                              <p className="text-sm text-green-400/80">
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
    </div>
  );
}
