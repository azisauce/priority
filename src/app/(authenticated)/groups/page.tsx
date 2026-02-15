"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, X } from "lucide-react";

interface Group {
  id: string;
  groupName: string;
  createdAt: string;
  _count: { items: number };
}

export default function GroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
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

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleSave = async () => {
    if (!formName.trim()) {
      setFormError("Group name is required");
      return;
    }
    setSaving(true);
    setFormError("");

    try {
      const isEdit = editingId !== null;
      const url = isEdit ? `/api/groups/${editingId}` : "/api/groups";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupName: formName.trim() }),
      });

      if (!res.ok) {
        const err = await res.json();
        setFormError(
          typeof err.error === "string"
            ? err.error
            : "Failed to save group"
        );
        return;
      }

      await fetchGroups();

      if (isEdit) {
        setShowForm(false);
        setEditingId(null);
        setFormName("");
      } else {
        // Keep form open but clear name for next entry
        setFormName("");
        // Focus will automatically return to input because it has autoFocus
      }
    } catch {
      setFormError("Failed to save group");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (group: Group) => {
    setEditingId(group.id);
    setFormName(group.groupName);
    setShowForm(true);
    setFormError("");
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormName("");
    setFormError("");
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
          typeof err.error === "string"
            ? err.error
            : "Failed to delete group"
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
          <h1 className="text-2xl font-bold text-gray-100">Groups</h1>
          <p className="text-gray-400 mt-1">Organize your items into groups</p>
        </div>
        {!showForm && (
          <button
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
              setFormName("");
              setFormError("");
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Group
          </button>
        )}
      </div>

      {/* Inline Form */}
      {showForm && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-300 mb-3">
            {editingId ? "Edit Group" : "New Group"}
          </h3>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              placeholder="Group name"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={handleCancelForm}
              className="text-gray-400 hover:text-gray-200 p-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {formError && (
            <p className="text-red-400 text-sm mt-2">{formError}</p>
          )}
        </div>
      )}

      {/* Groups Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-gray-900 border border-gray-800 rounded-lg p-6 animate-pulse"
            >
              <div className="h-5 w-32 bg-gray-800 rounded mb-3" />
              <div className="h-4 w-16 bg-gray-800 rounded" />
            </div>
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-12 text-center">
          <p className="text-gray-400">
            No groups yet. Create your first group to start organizing items.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (
            <div
              key={group.id}
              className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors cursor-pointer group/card"
              onClick={() => router.push(`/groups/${group.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-gray-100 font-medium truncate">
                    {group.groupName}
                  </h3>
                  <span className="inline-block mt-2 text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded-full">
                    {group._count.items}{" "}
                    {group._count.items === 1 ? "item" : "items"}
                  </span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(group);
                    }}
                    className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors"
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
                    className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
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

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-100 mb-2">
              Delete Group
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Are you sure you want to delete{" "}
              <span className="text-gray-200 font-medium">
                {deleteTarget.groupName}
              </span>
              ? This action cannot be undone.
            </p>
            {deleteError && (
              <p className="text-red-400 text-sm mb-4">{deleteError}</p>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteError("");
                }}
                className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
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
