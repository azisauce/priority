"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  SlidersHorizontal,
} from "lucide-react";

interface Group {
  id: string;
  groupName: string;
  description: string | null;
  createdAt: string;
  _count: { items: number };
}

interface PriorityParam {
  id: string;
  name: string;
  weight: number;
}

export default function GroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  // Param assignment in dialog
  const [allParams, setAllParams] = useState<PriorityParam[]>([]);
  const [selectedParamIds, setSelectedParamIds] = useState<Set<string>>(
    new Set()
  );
  const [loadingParams, setLoadingParams] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Group | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const fetchGroups = async () => {
    try {
      const res = await fetch("/api/groups");
      const json = await res.json();
      setGroups(json.groups ?? []);
    } catch {
      console.error("Failed to fetch groups");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllParams = useCallback(async () => {
    setLoadingParams(true);
    try {
      const res = await fetch("/api/priority-params");
      if (res.ok) {
        const json = await res.json();
        setAllParams(json.params ?? []);
      }
    } catch {
      console.error("Failed to fetch params");
    } finally {
      setLoadingParams(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setFormName("");
    setFormDesc("");
    setFormError("");
    setSelectedParamIds(new Set());
    setIsModalOpen(true);
    fetchAllParams();
  };

  const openEditModal = async (group: Group) => {
    setEditingId(group.id);
    setFormName(group.groupName);
    setFormDesc(group.description ?? "");
    setFormError("");
    setIsModalOpen(true);
    fetchAllParams();

    // Fetch currently assigned params for this group
    try {
      const res = await fetch(`/api/groups/${group.id}/params`);
      if (res.ok) {
        const json = await res.json();
        setSelectedParamIds(
          new Set((json.params ?? []).map((p: PriorityParam) => p.id))
        );
      }
    } catch {
      console.error("Failed to fetch group params");
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormName("");
    setFormDesc("");
    setFormError("");
    setSelectedParamIds(new Set());
  };

  const toggleParam = (paramId: string) => {
    setSelectedParamIds((prev) => {
      const next = new Set(prev);
      if (next.has(paramId)) {
        next.delete(paramId);
      } else {
        next.add(paramId);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      setFormError("Group name is required");
      return;
    }
    setSaving(true);
    setFormError("");

    try {
      const isEdit = editingId !== null;

      if (isEdit) {
        // Update group name
        const res = await fetch(`/api/groups/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ groupName: formName.trim(), description: formDesc.trim() || null }),
        });

        if (!res.ok) {
          const err = await res.json();
          setFormError(
            typeof err.error === "string" ? err.error : "Failed to save group"
          );
          return;
        }

        // Sync param assignments: fetch current, diff, add/remove
        const currentRes = await fetch(`/api/groups/${editingId}/params`);
        const currentJson = await currentRes.json();
        const currentIds = new Set<string>(
          (currentJson.params ?? []).map((p: PriorityParam) => p.id)
        );

        // Add new params
        for (const paramId of selectedParamIds) {
          if (!currentIds.has(paramId)) {
            await fetch(`/api/groups/${editingId}/params`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ priorityParamId: paramId }),
            });
          }
        }

        // Remove unselected params
        for (const paramId of currentIds) {
          if (!selectedParamIds.has(paramId)) {
            await fetch(
              `/api/groups/${editingId}/params?priorityParamId=${paramId}`,
              { method: "DELETE" }
            );
          }
        }
      } else {
        // Create group with params
        const res = await fetch("/api/groups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            groupName: formName.trim(),
            description: formDesc.trim() || undefined,
            priorityItemIds: Array.from(selectedParamIds),
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          setFormError(
            typeof err.error === "string" ? err.error : "Failed to save group"
          );
          return;
        }
      }

      closeModal();
      await fetchGroups();
    } catch {
      setFormError("Failed to save group");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError("");

    try {
      const res = await fetch(`/api/groups/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json();
        setDeleteError(
          typeof err.error === "string" ? err.error : "Failed to delete group"
        );
        return;
      }

      setDeleteTarget(null);
      await fetchGroups();
    } catch {
      setDeleteError("Failed to delete group");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Groups</h1>
          <p className="text-muted-foreground mt-1">
            Organize your items into groups
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Group
        </button>
      </div>

      {/* Groups Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-lg p-6 animate-pulse"
            >
              <div className="h-5 w-32 bg-muted rounded mb-3" />
              <div className="h-4 w-16 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <p className="text-muted-foreground">
            No groups yet. Create your first group to start organizing items.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (
            <div
              key={group.id}
              className="bg-card border border-border rounded-lg p-6 hover:border-muted-foreground/30 transition-colors cursor-pointer group/card"
              onClick={() => router.push(`/groups/${group.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-foreground font-medium truncate">
                    {group.groupName}
                  </h3>
                  {group.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{group.description}</p>
                  )}
                  <span className="inline-block mt-2 text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                    {group._count.items}{" "}
                    {group._count.items === 1 ? "item" : "items"}
                  </span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(group);
                    }}
                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                    title="Edit group"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(group);
                      setDeleteError("");
                    }}
                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-muted rounded-lg transition-colors"
                    title="Delete group"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Group Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={closeModal}
          />
          <div className="relative w-full max-w-md rounded-xl bg-card border border-border shadow-2xl">
            <div className="flex items-center justify-between p-6 pb-2">
              <h2 className="text-xl font-bold text-foreground">
                {editingId ? "Edit Group" : "New Group"}
              </h2>
              <button
                onClick={closeModal}
                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-5">
              {/* Group Name */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Group Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                  placeholder="Enter group name"
                  className="w-full rounded-lg bg-input border border-border px-4 py-2.5 text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  autoFocus
                />
              </div>

              {/* Description */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Description
                </label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Enter group description (optional)"
                  rows={2}
                  className="w-full rounded-lg bg-input border border-border px-4 py-2.5 text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
                />
              </div>

              {/* Priority Params */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <SlidersHorizontal className="w-4 h-4 text-primary" />
                  <label className="text-sm font-medium text-foreground">
                    Priority Parameters
                  </label>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {selectedParamIds.size} selected
                  </span>
                </div>

                {loadingParams ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                ) : allParams.length === 0 ? (
                  <p className="text-sm text-muted-foreground rounded-lg bg-muted/50 p-3 text-center">
                    No priority parameters created yet. Create some in the
                    Params page first.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {allParams.map((param) => {
                      const isSelected = selectedParamIds.has(param.id);
                      return (
                        <button
                          key={param.id}
                          type="button"
                          onClick={() => toggleParam(param.id)}
                          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium border transition-colors ${
                            isSelected
                              ? "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20"
                              : "bg-card text-muted-foreground border-border hover:bg-muted"
                          }`}
                        >
                          {isSelected ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <Plus className="w-3 h-3" />
                          )}
                          {param.name}
                          <span className="text-xs opacity-60">
                            w:{param.weight}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {formError && (
                <p className="text-destructive text-sm">{formError}</p>
              )}
            </div>

            <div className="p-6 pt-2 flex gap-3 border-t border-border">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 rounded-lg bg-muted px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/80"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Save Changes"
                    : "Create Group"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => {
              setDeleteTarget(null);
              setDeleteError("");
            }}
          />
          <div className="relative w-full max-w-sm rounded-xl bg-popover border border-border p-6 shadow-2xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <Trash2 className="h-6 w-6 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Delete Group
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              Are you sure you want to delete{" "}
              <span className="text-foreground font-medium">
                {deleteTarget.groupName}
              </span>
              ? This action cannot be undone.
            </p>
            {deleteError && (
              <p className="text-destructive text-sm mb-4">{deleteError}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteError("");
                }}
                className="flex-1 rounded-lg bg-muted px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/80"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-lg bg-destructive px-4 py-2.5 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
