"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Plus,
  X,
  Check,
  SlidersHorizontal,
} from "lucide-react";

interface Item {
  id: string;
  itemName: string;
  pricing: number;
  priority: number;
  createdAt: string;
}

interface PriorityParam {
  id: string;
  name: string;
  weight: number;
}

interface GroupDetail {
  id: string;
  groupName: string;
  items: Item[];
  priorityParams?: { priorityParam: PriorityParam }[];
}

function calculateValueScore(priority: number, price: number): number {
  const p = Number(priority);
  const pr = Number(price);
  if (!isFinite(pr) || pr <= 0 || !isFinite(p)) return Infinity;
  return Math.pow(p, 5) / pr;
}

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editError, setEditError] = useState("");
  const [saving, setSaving] = useState(false);

  // Param assignment
  const [allParams, setAllParams] = useState<PriorityParam[]>([]);
  const [assignedParamIds, setAssignedParamIds] = useState<Set<string>>(new Set());
  const [loadingParams, setLoadingParams] = useState(false);
  const [paramActionLoading, setParamActionLoading] = useState<string | null>(null);

  const fetchGroup = useCallback(async () => {
    try {
      const res = await fetch(`/api/groups/${groupId}`);
      if (!res.ok) {
        setError(res.status === 404 ? "Group not found" : "Failed to load group");
        return;
      }
      const json = await res.json();
      const rawGroup = json.group;
      const normalizedItems: Item[] = (rawGroup.items || []).map((it: any) => ({
        ...it,
        priority: Number(it.priority),
        pricing: Number(it.pricing),
      }));
      const normalizedGroup = { ...rawGroup, items: normalizedItems };
      setGroup(normalizedGroup);
      // Build assigned set from normalizedGroup
      const assigned = new Set<string>(
        (normalizedGroup.priorityParams || []).map(
          (gp: { priorityParam: PriorityParam }) => gp.priorityParam.id
        )
      );
      setAssignedParamIds(assigned);
    } catch {
      setError("Failed to load group");
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  const fetchAllParams = useCallback(async () => {
    setLoadingParams(true);
    try {
      const res = await fetch("/api/priority-params");
      if (res.ok) {
        const json = await res.json();
        setAllParams(json.params || []);
      }
    } catch (err) {
      console.error("Failed to fetch params:", err);
    } finally {
      setLoadingParams(false);
    }
  }, []);

  useEffect(() => {
    fetchGroup();
    fetchAllParams();
  }, [fetchGroup, fetchAllParams]);

  const handleSaveEdit = async () => {
    if (!editName.trim()) {
      setEditError("Group name is required");
      return;
    }
    setSaving(true);
    setEditError("");

    try {
      const res = await fetch(`/api/groups/${groupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupName: editName.trim() }),
      });

      if (!res.ok) {
        const err = await res.json();
        setEditError(typeof err.error === "string" ? err.error : "Failed to update");
        return;
      }

      const json = await res.json();
      setGroup((prev) => (prev ? { ...prev, groupName: json.group.groupName } : prev));
      setEditing(false);
    } catch {
      setEditError("Failed to update group");
    } finally {
      setSaving(false);
    }
  };

  const toggleParam = async (paramId: string) => {
    setParamActionLoading(paramId);
    const isAssigned = assignedParamIds.has(paramId);

    try {
      if (isAssigned) {
        const res = await fetch(
          `/api/groups/${groupId}/params?priorityParamId=${paramId}`,
          { method: "DELETE" }
        );
        if (res.ok) {
          setAssignedParamIds((prev) => {
            const next = new Set(prev);
            next.delete(paramId);
            return next;
          });
        }
      } else {
        const res = await fetch(`/api/groups/${groupId}/params`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ priorityParamId: paramId }),
        });
        if (res.ok) {
          setAssignedParamIds((prev) => new Set(prev).add(paramId));
        }
      }
    } catch (err) {
      console.error("Failed to toggle param:", err);
    } finally {
      setParamActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-6 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.push("/groups")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Groups
        </button>
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <p className="text-muted-foreground">{error || "Group not found"}</p>
        </div>
      </div>
    );
  }

  const sortedItems = [...group.items]
    .map((item) => ({
      ...item,
      valueScore: calculateValueScore(item.priority, item.pricing),
    }))
    .sort((a, b) => b.valueScore - a.valueScore);

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.push("/groups")}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Groups
      </button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveEdit();
                  if (e.key === "Escape") setEditing(false);
                }}
                className="bg-input border border-border rounded-lg px-3 py-1.5 text-foreground text-xl font-bold focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                autoFocus
              />
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="p-1.5 text-green-500 hover:bg-muted rounded-lg transition-colors"
              >
                <Check className="w-5 h-5" />
              </button>
              <button
                onClick={() => setEditing(false)}
                className="p-1.5 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-foreground">
                {group.groupName}
              </h1>
              <button
                onClick={() => {
                  setEditName(group.groupName);
                  setEditing(true);
                  setEditError("");
                }}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                title="Edit group name"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
        <button
          onClick={() => router.push(`/items?groupId=${groupId}`)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      </div>

      {editError && (
        <p className="text-destructive text-sm">{editError}</p>
      )}

      {/* Priority Parameters Assignment */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Priority Parameters</h2>
          <span className="ml-auto text-sm text-muted-foreground">
            {assignedParamIds.size} assigned
          </span>
        </div>
        <div className="p-4">
          {loadingParams ? (
            <div className="flex items-center justify-center py-4">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : allParams.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No priority parameters created yet. Create some in the Params page first.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {allParams.map((param) => {
                const isAssigned = assignedParamIds.has(param.id);
                const isLoading = paramActionLoading === param.id;
                return (
                  <button
                    key={param.id}
                    onClick={() => toggleParam(param.id)}
                    disabled={isLoading}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium border transition-colors disabled:opacity-50 ${
                      isAssigned
                        ? "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20"
                        : "bg-card text-muted-foreground border-border hover:bg-muted"
                    }`}
                  >
                    {isLoading ? (
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : isAssigned ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <Plus className="w-3 h-3" />
                    )}
                    {param.name}
                    <span className="text-xs opacity-60">w:{param.weight}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Items</h2>
        </div>
        {sortedItems.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-muted-foreground">
              No items in this group yet. Add your first item to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="px-6 py-3 font-medium">Item Name</th>
                  <th className="px-6 py-3 font-medium">Priority</th>
                  <th className="px-6 py-3 font-medium">Price</th>
                  <th className="px-6 py-3 font-medium">Value Score</th>
                </tr>
              </thead>
              <tbody>
                {sortedItems.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-border last:border-0 hover:bg-accent/50"
                  >
                    <td className="px-6 py-3 text-foreground font-medium">
                      {item.itemName}
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">
                      {item.priority.toFixed(2)}
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">
                      ${item.pricing.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-3 text-primary font-medium">
                      {isFinite(item.valueScore)
                        ? item.valueScore.toFixed(4)
                        : "∞"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
