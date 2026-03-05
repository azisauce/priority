"use client";

import React, { useEffect } from "react";
import {
  X,
  Calculator,
  SlidersHorizontal,
} from "lucide-react";

type Group = { id: string; groupName: string };
type EvalItemData = { id: string; name: string; value: number };
type ParamAnswerData = { priorityParam: { id: string; name: string; weight: number }; paramEvalItem: { id: string; name: string; value: number } };
type GroupParam = { id: string; name: string; weight: number; evalItems: { paramEvalItem: EvalItemData }[] };

export interface ItemFormData {
  itemName: string;
  description: string;
  groupId: string;
  pricing: string;
  priority: string;
  answers: Record<string, string>;
  enabledEaseOption?: boolean;
  easePeriod?: string;
  interestPercentage?: string;
  priceWithInterest?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  editingItem: any | null;
  formData: ItemFormData;
  setFormData: React.Dispatch<React.SetStateAction<ItemFormData>>;
  handleSubmit: (e: React.FormEvent) => void | Promise<void>;
  isSubmitting: boolean;
  groups: Group[];
  groupParams: GroupParam[];
  loadingGroupParams: boolean;
  priorityMode: "guided" | "manual";
  setPriorityMode: React.Dispatch<React.SetStateAction<"guided" | "manual">>;
  calculatedPriority: number;
  totalWeight: number;
}

export default function ItemModal({
  isOpen,
  onClose,
  editingItem,
  formData,
  setFormData,
  handleSubmit,
  isSubmitting,
  groups,
  groupParams,
  loadingGroupParams,
  priorityMode,
  setPriorityMode,
  calculatedPriority,
  totalWeight,
}: Props) {
  if (!isOpen) return null;

  console.log("editingItem=======>",editingItem);
  const safeParse = (v?: string | number | null) => {
    if (v === undefined || v === null || v === "") return null;
    const n = typeof v === "number" ? v : parseFloat(String(v));
    return Number.isFinite(n) ? n : null;
  };

  const handlePriceWithInterestChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData((prev) => {
      const pricing = safeParse(prev.pricing);
      const pwi = safeParse(val);
      let interest = prev.interestPercentage ?? "";
      if (pricing && pricing > 0 && pwi !== null) {
        const perc = ((pwi - pricing) / pricing) * 100;
        interest = (Math.round(perc * 100) / 100).toString();
      }
      return { ...prev, priceWithInterest: val, interestPercentage: interest };
    });
  };

  const handleInterestPercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData((prev) => {
      const pricing = safeParse(prev.pricing);
      const perc = safeParse(val);
      let pwi = prev.priceWithInterest ?? "";
      if (pricing && pricing > 0 && perc !== null) {
        const computed = pricing * (1 + perc / 100);
        pwi = (Math.round(computed * 100) / 100).toString();
      }
      return { ...prev, interestPercentage: val, priceWithInterest: pwi };
    });
  };

  // When pricing changes, keep paired fields in sync
  useEffect(() => {
    const pricing = safeParse(formData.pricing);
    if (!formData.enabledEaseOption || !pricing || pricing <= 0) return;

    if (formData.priceWithInterest) {
      const pwi = safeParse(formData.priceWithInterest);
      if (pwi !== null) {
        const perc = ((pwi - pricing) / pricing) * 100;
        const percStr = (Math.round(perc * 100) / 100).toString();
        if (percStr !== formData.interestPercentage) {
          setFormData((prev) => ({ ...prev, interestPercentage: percStr }));
        }
      }
    } else if (formData.interestPercentage) {
      const perc = safeParse(formData.interestPercentage);
      if (perc !== null) {
        const computed = pricing * (1 + perc / 100);
        const pwiStr = (Math.round(computed * 100) / 100).toString();
        if (pwiStr !== formData.priceWithInterest) {
          setFormData((prev) => ({ ...prev, priceWithInterest: pwiStr }));
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.pricing, formData.enabledEaseOption]);
  

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-xl bg-card border border-border shadow-2xl">
        <div className="flex items-center justify-between p-6 pb-2 shrink-0">
          <h2 className="text-xl font-bold text-foreground">{editingItem ? "Edit Item" : "Add New Item"}</h2>
          <button onClick={onClose} className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <form id="item-form" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Item Name <span className="text-destructive">*</span></label>
              <input type="text" required value={formData.itemName} onChange={(e) => setFormData({ ...formData, itemName: e.target.value })} className="w-full rounded-lg bg-input border border-border px-4 py-2.5 text-foreground placeholder-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring" placeholder="Enter item name" />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Description</label>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full rounded-lg bg-input border border-border px-4 py-2.5 text-foreground placeholder-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring resize-none" placeholder="Enter description (optional)" rows={2} />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Group <span className="text-destructive">*</span></label>
              <select required value={formData.groupId} onChange={(e) => setFormData({ ...formData, groupId: e.target.value, answers: {} })} className="w-full rounded-lg bg-input border border-border px-4 py-2.5 text-foreground focus:border-ring focus:ring-1 focus:ring-ring">
                <option value="">Select a group</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>{group.groupName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Price <span className="text-destructive">*</span></label>
              <input type="number" required min="0.01" step="0.01" value={formData.pricing} onChange={(e) => setFormData({ ...formData, pricing: e.target.value })} className="w-full rounded-lg bg-input border border-border px-4 py-2.5 text-foreground placeholder-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring" placeholder="0.00" />
            </div>

            <div className="pt-2">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={!!formData.enabledEaseOption} onChange={(e) => setFormData({ ...formData, enabledEaseOption: e.target.checked })} className="h-4 w-4" />
                <span className="text-sm text-foreground">Enable ease option</span>
              </label>
            </div>

            {formData.enabledEaseOption && (
              <div className="flex flex-wrap items-center justify-start gap-4 pt-2">
                <div className="flex-1 min-w-25">
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Ease Period (months)</label>
                  <input required={!!formData.enabledEaseOption} type="number" min="1" step="1" value={formData.easePeriod ?? ""} onChange={(e) => setFormData({ ...formData, easePeriod: e.target.value })} className="w-full rounded-lg bg-input border border-border px-4 py-2.5 text-foreground placeholder-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring" placeholder="0" />
                </div>

                <div className="flex-1 min-w-25">
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Interest Percentage</label>
                  <input required={!!formData.enabledEaseOption} type="number" min="0" step="0.1" value={formData.interestPercentage ?? ""} onChange={handleInterestPercentageChange} className="w-full rounded-lg bg-input border border-border px-4 py-2.5 text-foreground placeholder-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring" placeholder="0.00" />
                </div>

                <div className="flex-1 min-w-25">
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Price With Interest</label>
                  <input required={!!formData.enabledEaseOption} type="number" min="0." step="0.1" value={formData.priceWithInterest ?? ""} onChange={handlePriceWithInterestChange} className="w-full rounded-lg bg-input border border-border px-4 py-2.5 text-foreground placeholder-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring" placeholder="0.00" />
                </div>
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Priority Input Mode</label>
              <div className="flex rounded-lg bg-input p-1">
                <button type="button" onClick={() => setPriorityMode("guided")} className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors ${priorityMode === "guided" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  <SlidersHorizontal className="h-4 w-4" />
                  Guided
                </button>
                <button type="button" onClick={() => setPriorityMode("manual")} className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors ${priorityMode === "manual" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  <Calculator className="h-4 w-4" />
                  Manual
                </button>
              </div>
            </div>

            {priorityMode === "guided" ? (
              <div className="space-y-4 rounded-lg bg-muted/50 p-4">
                {loadingGroupParams ? (
                  <div className="flex items-center justify-center py-4"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
                ) : !formData.groupId ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Select a group to see its priority parameters.</p>
                ) : groupParams.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No priority parameters assigned to this group. Assign parameters on the group detail page.</p>
                ) : (
                  groupParams.map((param) => {
                    const pct = totalWeight > 0 ? ((param.weight / totalWeight) * 100).toFixed(0) : "0";
                    const selectedEvalId = formData.answers[param.id] || "";
                    const selectedEval = param.evalItems.find((e) => e.paramEvalItem.id === selectedEvalId);

                    return (
                      <div key={param.id}>
                        <div className="mb-1.5 flex items-center justify-between">
                          <label className="text-sm font-medium text-foreground">{param.name} <span className="text-muted-foreground font-normal">( weight: {pct}% | {param.weight} pts )</span></label>
                          {selectedEval && <span className="text-sm font-semibold text-primary">{selectedEval.paramEvalItem.name} ({selectedEval.paramEvalItem.value})</span>}
                        </div>
                        {param.evalItems.length === 0 ? (
                          <p className="text-xs text-muted-foreground">No answer options assigned to this parameter.</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {param.evalItems.sort((a, b) => a.paramEvalItem.value - b.paramEvalItem.value).map((ei) => (
                              <button key={ei.paramEvalItem.id} type="button" onClick={() => setFormData({ ...formData, answers: { ...formData.answers, [param.id]: ei.paramEvalItem.id } })} className={`rounded-lg px-3 py-1.5 text-sm font-medium border transition-colors ${selectedEvalId === ei.paramEvalItem.id ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-muted"}`}>
                                {ei.paramEvalItem.name}
                                <span className="ml-1 text-xs opacity-70">({ei.paramEvalItem.value})</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Priority Score</label>
                <input type="number" min="0" step="0.01" value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className="w-full rounded-lg bg-input border border-border px-4 py-2.5 text-foreground focus:border-ring focus:ring-1 focus:ring-ring" placeholder="3.00" />
              </div>
            )}

            <div className="rounded-lg bg-primary/10 border border-primary/20 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Calculated Priority Score</span>
                <span className="text-2xl font-bold text-primary">{calculatedPriority.toFixed(2)}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{priorityMode === "guided" ? "Weighted average of selected answers" : "Manually entered priority value"}</p>
            </div>
          </form>
        </div>

        <div className="p-6 pt-2 shrink-0 flex gap-3 bg-card rounded-b-xl border-t border-border">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg bg-muted px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/80">Cancel</button>
          <button type="submit" form="item-form" disabled={isSubmitting} className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">{isSubmitting ? "Saving..." : editingItem ? "Save Changes" : "Add Item"}</button>
        </div>
      </div>
    </div>
  );
}
