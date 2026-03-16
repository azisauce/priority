"use client";

import { PiggyBank } from "lucide-react";
import EmptyState from "@/components/states/empty-state";
import BudgetCard from "@/components/expenses/BudgetCard";
import type { Budget } from "@/types/budget";

interface BudgetListProps {
  budgets: Budget[];
  onBudgetClick?: (budget: Budget) => void;
  onEditBudget?: (budget: Budget) => void;
  onDeleteBudget?: (budget: Budget) => void;
}

export default function BudgetList({
  budgets,
  onBudgetClick,
  onEditBudget,
  onDeleteBudget,
}: BudgetListProps) {
  if (budgets.length === 0) {
    return (
      <EmptyState
        icon={PiggyBank}
        title="No budgets for this month"
        description="Create a budget to start tracking your monthly spending."
      />
    );
  }

  return (
    <div className="space-y-3">
      {budgets.map((budget) => (
        <BudgetCard
          key={budget.id}
          budget={budget}
          onClick={onBudgetClick ? () => onBudgetClick(budget) : undefined}
          onEdit={onEditBudget ? () => onEditBudget(budget) : undefined}
          onDelete={onDeleteBudget ? () => onDeleteBudget(budget) : undefined}
        />
      ))}
    </div>
  );
}
