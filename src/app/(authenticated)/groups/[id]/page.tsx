"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Plus, X, Check } from "lucide-react";

interface Item {
  id: string;
  itemName: string;
  pricing: number;
  priority: number;
  urgency: number;
  impact: number;
  risk: number;
  frequency: number;
  createdAt: string;
}

interface GroupDetail {
  id: string;
  groupName: string;
  items: Item[];
}

function calculateValueScore(priority: number, price: number): number {
  if (price <= 0) return Infinity;
  return Math.pow(priority, 5) / price;
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

  const fetchGroup = useCallback(async () => {
    try {
      const res = await fetch(`/api/groups/${groupId}`);
      if (!res.ok) {
        setError(res.status === 404 ? "Group not found" : "Failed to load group");
        return;
      }
      const json = await res.json();
      setGroup(json.group);
    } catch {
      setError("Failed to load group");
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-800 rounded animate-pulse" />
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-6 bg-gray-800 rounded animate-pulse" />
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
          className="flex items-center gap-2 text-gray-400 hover:text-gray-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Groups
        </button>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-12 text-center">
          <p className="text-gray-400">{error || "Group not found"}</p>
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
        className="flex items-center gap-2 text-gray-400 hover:text-gray-200 transition-colors text-sm"
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
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-gray-100 text-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="p-1.5 text-green-400 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <Check className="w-5 h-5" />
              </button>
              <button
                onClick={() => setEditing(false)}
                className="p-1.5 text-gray-400 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-gray-100">
                {group.groupName}
              </h1>
              <button
                onClick={() => {
                  setEditName(group.groupName);
                  setEditing(true);
                  setEditError("");
                }}
                className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors"
                title="Edit group name"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
        <button
          onClick={() => router.push(`/items?groupId=${groupId}`)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      </div>

      {editError && (
        <p className="text-red-400 text-sm">{editError}</p>
      )}

      {/* Items Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        {sortedItems.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400">
              No items in this group yet. Add your first item to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-800">
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
                    className="border-b border-gray-800 last:border-0 hover:bg-gray-800/50"
                  >
                    <td className="px-6 py-3 text-gray-100 font-medium">
                      {item.itemName}
                    </td>
                    <td className="px-6 py-3 text-gray-300">
                      {item.priority.toFixed(2)}
                    </td>
                    <td className="px-6 py-3 text-gray-300">
                      ${item.pricing.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-3 text-blue-400 font-medium">
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
