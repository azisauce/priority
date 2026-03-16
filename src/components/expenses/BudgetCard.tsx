"use client";

import { AlertTriangle, PiggyBank } from "lucide-react";
import CardBase from "@/components/cards/card-base";
import DashboardCard from "@/components/cards/dashboard-card";
import { formatMonthYear } from "@/lib/utils";
import type { Budget } from "@/types/budget";

interface BudgetCardProps {
  budget: Budget;
  onClick?: () => void;
  variant?: "default" | "mini";
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

export default function BudgetCard({ budget, onClick, variant = "default" }: BudgetCardProps) {
  const progressRaw =
    budget.allocatedAmount > 0
      ? (budget.spentAmount / budget.allocatedAmount) * 100
      : 0;
  const progress = Math.min(Math.max(progressRaw, 0), 100);

  const isWarning = progressRaw >= 80;
  const isExceeded = progressRaw >= 100;

  const progressColor = isExceeded
    ? "rgb(var(--m3-error))"
    : isWarning
      ? "rgb(var(--m3-tertiary))"
      : "rgb(var(--m3-primary))";

  if (variant === "mini") {
    return (
      <div onClick={onClick} className={onClick ? "cursor-pointer" : ""}>
        <DashboardCard
          title={budget.category}
          value={`${Math.round(progressRaw)}%`}
          icon={PiggyBank}
          description={`${currencyFormatter.format(budget.spentAmount)} spent of ${currencyFormatter.format(
            budget.allocatedAmount
          )}`}
        >
          <div className="space-y-2">
            <div
              className="h-2 w-full overflow-hidden rounded-full"
              style={{ backgroundColor: "rgb(var(--m3-surface-variant))" }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: "100%",
                  backgroundColor: progressColor,
                  transition: "width 180ms ease",
                }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Remaining {currencyFormatter.format(budget.remainingAmount)}</span>
              {isWarning ? <span>Over 80%</span> : null}
            </div>
          </div>
        </DashboardCard>
      </div>
    );
  }

  return (
    <CardBase onClick={onClick} className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3
            style={{
              fontSize: "16px",
              lineHeight: "24px",
              fontWeight: 500,
              color: "rgb(var(--m3-on-surface))",
              margin: 0,
            }}
          >
            {budget.category}
          </h3>
          <p
            style={{
              fontSize: "12px",
              lineHeight: "16px",
              color: "rgb(var(--m3-on-surface-variant))",
              marginTop: "2px",
            }}
          >
            Month: {formatMonthYear(budget.month)}
          </p>
        </div>

        <span
          className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
          style={{
            backgroundColor: "rgb(var(--m3-secondary-container))",
            color: "rgb(var(--m3-on-secondary-container))",
          }}
        >
          {Math.round(progressRaw)}%
        </span>
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Allocated</p>
            <p className="font-medium text-foreground">
              {currencyFormatter.format(budget.allocatedAmount)}
            </p>
            {budget.rolledOverAmount > 0 && (
              <p className="text-[11px] text-muted-foreground">
                +{currencyFormatter.format(budget.rolledOverAmount)} rollover
              </p>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Spent</p>
            <p className="font-medium text-foreground">
              {currencyFormatter.format(budget.spentAmount)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Remaining</p>
            <p
              className="font-medium"
              style={{
                color:
                  budget.remainingAmount < 0
                    ? "rgb(var(--m3-error))"
                    : "rgb(var(--m3-on-surface))",
              }}
            >
              {currencyFormatter.format(budget.remainingAmount)}
            </p>
          </div>
        </div>

        <div
          className="h-2 w-full overflow-hidden rounded-full"
          style={{ backgroundColor: "rgb(var(--m3-surface-variant))" }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              backgroundColor: progressColor,
              transition: "width 180ms ease",
            }}
          />
        </div>
      </div>

      {isWarning && (
        <div
          className="flex items-start gap-2 rounded-lg px-3 py-2"
          style={{
            backgroundColor: isExceeded
              ? "rgb(var(--m3-error-container))"
              : "rgb(var(--m3-tertiary-container))",
            color: isExceeded
              ? "rgb(var(--m3-on-error-container))"
              : "rgb(var(--m3-on-tertiary-container))",
          }}
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-xs leading-5">
            {isExceeded
              ? "Budget limit exceeded. Review your recent expenses."
              : "Warning: this budget has reached at least 80% of allocation."}
          </p>
        </div>
      )}
    </CardBase>
  );
}
