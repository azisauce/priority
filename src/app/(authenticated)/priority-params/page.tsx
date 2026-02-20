"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  LinkIcon,
  Unlink,
} from "lucide-react";

interface EvalItem {
  id: string;
  name: string;
  description: string | null;
  value: number;
  userId: string | null;
  _count?: { params: number };
}

interface PriorityParam {
  id: string;
  name: string;
  description: string | null;
  weight: number;
  userId: string | null;
  evalItems: { paramEvalItem: EvalItem }[];
  _count?: { groups: number };
}

export default function PriorityParamsPage() {
  // --- Params state ---
  const [params, setParams] = useState<PriorityParam[]>([]);
  const [loadingParams, setLoadingParams] = useState(true);
  const [showParamForm, setShowParamForm] = useState(false);
  const [editingParamId, setEditingParamId] = useState<string | null>(null);
  const [paramName, setParamName] = useState("");
  const [paramDesc, setParamDesc] = useState("");
  const [paramWeight, setParamWeight] = useState("");
  const [paramError, setParamError] = useState("");
  const [paramSaving, setParamSaving] = useState(false);
  const [deleteParam, setDeleteParam] = useState<PriorityParam | null>(null);
  const [expandedParam, setExpandedParam] = useState<string | null>(null);
  const [assigningEval, setAssigningEval] = useState<string | null>(null);

  // --- Eval items state ---
  const [evalItems, setEvalItems] = useState<EvalItem[]>([]);
  const [loadingEvalItems, setLoadingEvalItems] = useState(true);
  const [showEvalForm, setShowEvalForm] = useState(false);
  const [editingEvalId, setEditingEvalId] = useState<string | null>(null);
  const [evalName, setEvalName] = useState("");
  const [evalDesc, setEvalDesc] = useState("");
  const [evalValue, setEvalValue] = useState("");
  const [evalError, setEvalError] = useState("");
  const [evalSaving, setEvalSaving] = useState(false);
  const [deleteEval, setDeleteEval] = useState<EvalItem | null>(null);

  // --- Fetch data ---
  const fetchParams = useCallback(async () => {
    try {
      const res = await fetch("/api/priority-params");
      const json = await res.json();
      setParams(json.params ?? []);
    } catch {
      console.error("Failed to fetch params");
    } finally {
      setLoadingParams(false);
    }
  }, []);

  const fetchEvalItems = useCallback(async () => {
    try {
      const res = await fetch("/api/eval-items");
      const json = await res.json();
      setEvalItems(json.evalItems ?? []);
    } catch {
      console.error("Failed to fetch eval items");
    } finally {
      setLoadingEvalItems(false);
    }
  }, []);

  useEffect(() => {
    fetchParams();
    fetchEvalItems();
  }, [fetchParams, fetchEvalItems]);

  // --- Param CRUD ---
  const handleSaveParam = async () => {
    if (!paramName.trim()) {
      setParamError("Name is required");
      return;
    }
    const weight = parseFloat(paramWeight);
    if (isNaN(weight) || weight < 1 || weight > 10 || !Number.isInteger(weight)) {
      setParamError("Weight must be a whole number between 1 and 10");
      return;
    }
    setParamSaving(true);
    setParamError("");

    try {
      const isEdit = editingParamId !== null;
      const url = isEdit
        ? `/api/priority-params/${editingParamId}`
        : "/api/priority-params";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: paramName.trim(), description: paramDesc.trim() || null, weight }),
      });

      if (!res.ok) {
        const err = await res.json();
        setParamError(typeof err.error === "string" ? err.error : "Failed to save");
        return;
      }

      await fetchParams();
      setShowParamForm(false);
      setEditingParamId(null);
      setParamName("");
      setParamDesc("");
      setParamWeight("");
    } catch {
      setParamError("Failed to save parameter");
    } finally {
      setParamSaving(false);
    }
  };

  const handleDeleteParam = async () => {
    if (!deleteParam) return;
    try {
      await fetch(`/api/priority-params/${deleteParam.id}`, { method: "DELETE" });
      setDeleteParam(null);
      await fetchParams();
    } catch {
      console.error("Failed to delete param");
    }
  };

  const handleEditParam = (p: PriorityParam) => {
    setEditingParamId(p.id);
    setParamName(p.name);
    setParamDesc(p.description || "");
    setParamWeight(p.weight.toString());
    setShowParamForm(true);
    setParamError("");
  };

  // --- Eval Item CRUD ---
  const handleSaveEval = async () => {
    if (!evalName.trim()) {
      setEvalError("Name is required");
      return;
    }
    const value = parseFloat(evalValue);
    if (isNaN(value) || value < 1 || value > 5 || !Number.isInteger(value)) {
      setEvalError("Value must be a whole number between 1 and 5");
      return;
    }
    setEvalSaving(true);
    setEvalError("");

    try {
      const isEdit = editingEvalId !== null;
      const url = isEdit
        ? `/api/eval-items/${editingEvalId}`
        : "/api/eval-items";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: evalName.trim(), description: evalDesc.trim() || null, value }),
      });

      if (!res.ok) {
        const err = await res.json();
        setEvalError(typeof err.error === "string" ? err.error : "Failed to save");
        return;
      }

      await fetchEvalItems();
      await fetchParams();
      if (!isEdit) {
        setEvalName("");
        setEvalDesc("");
        setEvalValue("");
      } else {
        setShowEvalForm(false);
        setEditingEvalId(null);
        setEvalName("");
        setEvalDesc("");
        setEvalValue("");
      }
    } catch {
      setEvalError("Failed to save eval item");
    } finally {
      setEvalSaving(false);
    }
  };

  const handleDeleteEval = async () => {
    if (!deleteEval) return;
    try {
      await fetch(`/api/eval-items/${deleteEval.id}`, { method: "DELETE" });
      setDeleteEval(null);
      await fetchEvalItems();
      await fetchParams();
    } catch {
      console.error("Failed to delete eval item");
    }
  };

  const handleEditEval = (e: EvalItem) => {
    setEditingEvalId(e.id);
    setEvalName(e.name);
    setEvalDesc(e.description || "");
    setEvalValue(e.value.toString());
    setShowEvalForm(true);
    setEvalError("");
  };

  // --- Assign/Unassign eval items to a param ---
  const isEvalAssigned = (paramId: string, evalItemId: string): boolean => {
    const param = params.find((p) => p.id === paramId);
    return param?.evalItems.some((e) => e.paramEvalItem.id === evalItemId) ?? false;
  };

  const toggleEvalAssignment = async (paramId: string, evalItemId: string) => {
    const assigned = isEvalAssigned(paramId, evalItemId);
    const loadingKey = `${paramId}-${evalItemId}`;
    setAssigningEval(loadingKey);
    
    // Optimistic update: update local state immediately
    setParams((prevParams) => {
      return prevParams.map((p) => {
        if (p.id !== paramId) return p;
        
        if (assigned) {
          // Remove from evalItems
          return {
            ...p,
            evalItems: p.evalItems.filter((e) => e.paramEvalItem.id !== evalItemId),
          };
        } else {
          // Add to evalItems
          const evalItem = evalItems.find((e) => e.id === evalItemId);
          if (!evalItem) return p;
          
          return {
            ...p,
            evalItems: [
              ...p.evalItems,
              {
                id: `temp-${Date.now()}`, // temporary ID
                paramEvalItem: evalItem,
              },
            ],
          };
        }
      });
    });

    try {
      if (assigned) {
        await fetch(
          `/api/priority-params/${paramId}/eval-items?paramEvalItemId=${evalItemId}`,
          { method: "DELETE" }
        );
      } else {
        await fetch(`/api/priority-params/${paramId}/eval-items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paramEvalItemId: evalItemId }),
        });
      }
      // Refresh to get the real data from server
      await fetchParams();
    } catch (error) {
      console.error("Failed to toggle eval assignment", error);
      // Revert optimistic update on error
      await fetchParams();
    } finally {
      setAssigningEval(null);
    }
  };

  // --- Compute total weight for display ---
  const totalWeight = params.reduce((sum, p) => sum + p.weight, 0);

  // Sort lists so non-generic (user-owned) items appear first, then by name
  const sortedParams = [...params].sort((a, b) => {
    const aGeneric = !a.userId;
    const bGeneric = !b.userId;
    if (aGeneric !== bGeneric) return aGeneric ? 1 : -1;
    return a.name.localeCompare(b.name);
  });

  const sortedEvalItems = [...evalItems].sort((a, b) => {
    const aGeneric = !a.userId;
    const bGeneric = !b.userId;
    if (aGeneric !== bGeneric) return aGeneric ? 1 : -1;
    return a.name.localeCompare(b.name);
  });

  // For a given param, return eval items with assigned ones first, then others
  const evalItemsForParam = (paramId: string) =>
    [...sortedEvalItems].sort((a, b) => {
      const aAssigned = isEvalAssigned(paramId, a.id);
      const bAssigned = isEvalAssigned(paramId, b.id);
      if (aAssigned && bAssigned) {
        // both assigned: sort by value descending, then name
        if (b.value !== a.value) return b.value - a.value;
        return a.name.localeCompare(b.name);
      }
      if (aAssigned !== bAssigned) return aAssigned ? -1 : 1;
      // both unassigned: keep generic/name ordering
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Priority Parameters</h1>
        <p className="text-muted-foreground mt-1">
          Define parameters, answer options, and assign them to customize priority calculation per group.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* LEFT COLUMN: Priority Params */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Parameters</h2>
            {!showParamForm && (
              <button
                onClick={() => {
                  setShowParamForm(true);
                  setEditingParamId(null);
                  setParamName("");
                  setParamDesc("");
                  setParamWeight("");
                  setParamError("");
                }}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            )}
          </div>

          {/* Param Form */}
          {showParamForm && (
            <div className="bg-card border border-border rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                {editingParamId ? "Edit Parameter" : "New Parameter"}
              </h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={paramName}
                  onChange={(e) => setParamName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveParam()}
                  placeholder="Parameter name"
                  className="flex-1 bg-input border border-border rounded-lg px-3 py-2 text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  autoFocus
                />
                <input
                  type="number"
                  value={paramWeight}
                  onChange={(e) => setParamWeight(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveParam()}
                  placeholder="Weight (1-10)"
                  min="1"
                  max="10"
                  step="1"
                  className="w-28 bg-input border border-border rounded-lg px-3 py-2 text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <input
                type="text"
                value={paramDesc}
                onChange={(e) => setParamDesc(e.target.value)}
                placeholder="Description / question (optional)"
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveParam}
                  disabled={paramSaving}
                  className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {paramSaving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => {
                    setShowParamForm(false);
                    setEditingParamId(null);
                    setParamName("");
                    setParamDesc("");
                    setParamWeight("");
                    setParamError("");
                  }}
                  className="text-muted-foreground hover:text-foreground p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {paramError && (
                <p className="text-destructive text-sm">{paramError}</p>
              )}
            </div>
          )}

          {/* Params List */}
          {loadingParams ? (
            <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-lg p-4 animate-pulse">
                  <div className="h-5 w-32 bg-muted rounded mb-2" />
                  <div className="h-4 w-16 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : params.length === 0 ? (
            <div className="max-h-[60vh] overflow-y-auto pr-2">
              <div className="bg-card border border-border rounded-lg p-8 text-center">
                <p className="text-muted-foreground">No parameters yet. Create one to get started.</p>
              </div>
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-3">
              {sortedParams.map((param) => {
                const pct = totalWeight > 0 ? ((param.weight / totalWeight) * 100).toFixed(1) : "0";
                const isExpanded = expandedParam === param.id;

                return (
                  <div
                    key={param.id}
                    className="bg-card border border-border rounded-lg overflow-hidden"
                  >
                    {/* Param header */}
                    <div className="p-4 flex items-center justify-between">
                      <button
                        onClick={() => setExpandedParam(isExpanded ? null : param.id)}
                        className="flex-1 flex items-center gap-3 text-left"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                        <div>
                          <h3 className="text-foreground font-medium">
                            {param.name}
                            {!param.userId && (
                              <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                Generic
                              </span>
                            )}
                          </h3>
                          {param.description && (
                            <p className="text-sm text-muted-foreground mt-0.5 italic">{param.description}</p>
                          )}
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                            <span>
                              Weight: {param.weight} ({pct}%)
                            </span>
                            <span>
                              {param.evalItems.length} answer{param.evalItems.length !== 1 ? "s" : ""}
                            </span>
                            <span>
                              {param._count?.groups ?? 0} group{(param._count?.groups ?? 0) !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>
                      </button>
                      {param.userId && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEditParam(param)}
                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteParam(param)}
                            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-muted rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Expanded: manage eval items for this param */}
                    {isExpanded && (
                      <div className="border-t border-border p-4 bg-muted/30">
                        <h4 className="text-sm font-medium text-muted-foreground mb-3">
                          Assigned Answer Options
                        </h4>
                        {sortedEvalItems.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No answer options created yet. Create some in the right panel.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {evalItemsForParam(param.id).map((ei) => {
                              const assigned = isEvalAssigned(param.id, ei.id);
                              const isLoading = assigningEval === `${param.id}-${ei.id}`;
                              return (
                                <div
                                  key={ei.id}
                                  className="flex items-center justify-between rounded-lg border border-border p-2.5 bg-card"
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm font-medium text-foreground">
                                      {ei.name}
                                    </span>
                                    {!ei.userId && (
                                      <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                        Generic
                                      </span>
                                    )}
                                    <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                                      value: {ei.value}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => toggleEvalAssignment(param.id, ei.id)}
                                    disabled={isLoading || !param.userId}
                                    title={!param.userId ? "Cannot modify generic parameter" : undefined}
                                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                      assigned
                                        ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                                        : "bg-primary/10 text-primary hover:bg-primary/20"
                                    }`}
                                  >
                                    {isLoading ? (
                                      <>
                                        <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                        {assigned ? "Unassigning..." : "Assigning..."}
                                      </>
                                    ) : assigned ? (
                                      <>
                                        <Unlink className="w-3 h-3" /> Unassign
                                      </>
                                    ) : (
                                      <>
                                        <LinkIcon className="w-3 h-3" /> Assign
                                      </>
                                    )}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Eval Items (Answer Options) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Answer Options</h2>
            {!showEvalForm && (
              <button
                onClick={() => {
                  setShowEvalForm(true);
                  setEditingEvalId(null);
                  setEvalName("");
                  setEvalDesc("");
                  setEvalValue("");
                  setEvalError("");
                }}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            )}
          </div>

          {/* Eval Form */}
          {showEvalForm && (
            <div className="bg-card border border-border rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                {editingEvalId ? "Edit Answer Option" : "New Answer Option"}
              </h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={evalName}
                  onChange={(e) => setEvalName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveEval()}
                  placeholder='Label (e.g. "None", "Critical")'
                  className="flex-1 bg-input border border-border rounded-lg px-3 py-2 text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  autoFocus
                />
                <input
                  type="number"
                  value={evalValue}
                  onChange={(e) => setEvalValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveEval()}
                  placeholder="Value (1-5)"
                  min="1"
                  max="5"
                  step="1"
                  className="w-28 bg-input border border-border rounded-lg px-3 py-2 text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <input
                type="text"
                value={evalDesc}
                onChange={(e) => setEvalDesc(e.target.value)}
                placeholder="Description (optional)"
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveEval}
                  disabled={evalSaving}
                  className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {evalSaving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => {
                    setShowEvalForm(false);
                    setEditingEvalId(null);
                    setEvalName("");
                    setEvalDesc("");
                    setEvalValue("");
                    setEvalError("");
                  }}
                  className="text-muted-foreground hover:text-foreground p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {evalError && (
                <p className="text-destructive text-sm">{evalError}</p>
              )}
            </div>
          )}

          {/* Eval Items List */}
          {loadingEvalItems ? (
            <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-lg p-4 animate-pulse">
                  <div className="h-5 w-32 bg-muted rounded mb-2" />
                  <div className="h-4 w-16 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : sortedEvalItems.length === 0 ? (
            <div className="max-h-[60vh] overflow-y-auto pr-2">
              <div className="bg-card border border-border rounded-lg p-8 text-center">
                <p className="text-muted-foreground">
                  No answer options yet. Create labels like &quot;None&quot;, &quot;Low&quot;, &quot;Medium&quot;, &quot;High&quot;, &quot;Critical&quot;.
                </p>
              </div>
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-2">
              {sortedEvalItems.map((ei) => (
                <div
                  key={ei.id}
                  className="bg-card border border-border rounded-lg p-4 flex items-center justify-between"
                >
                  <div>
                    <span className="text-foreground font-medium">{ei.name}</span>
                    {!ei.userId && (
                      <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                        Generic
                      </span>
                    )}
                    <span className="ml-3 text-sm text-muted-foreground">
                      value: {ei.value}
                    </span>
                    <span className="ml-3 text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                      {ei._count?.params ?? 0} param{(ei._count?.params ?? 0) !== 1 ? "s" : ""}
                    </span>
                    {ei.description && (
                      <p className="text-xs text-muted-foreground mt-1">{ei.description}</p>
                    )}
                  </div>
                  {ei.userId && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditEval(ei)}
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteEval(ei)}
                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-muted rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Param Confirmation */}
      {deleteParam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-popover border border-border rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-foreground mb-2">Delete Parameter</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Delete <span className="text-foreground font-medium">{deleteParam.name}</span>? This will
              remove it from all groups and items.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteParam(null)}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteParam}
                className="px-4 py-2 text-sm bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Eval Item Confirmation */}
      {deleteEval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-popover border border-border rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-foreground mb-2">Delete Answer Option</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Delete <span className="text-foreground font-medium">{deleteEval.name}</span>? This will
              unassign it from all parameters.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteEval(null)}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteEval}
                className="px-4 py-2 text-sm bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg font-medium transition-colors"
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
