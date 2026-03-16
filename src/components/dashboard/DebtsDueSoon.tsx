"use client";

import Link from "next/link";
import { CalendarClock } from "lucide-react";
import DashboardCard from "@/components/cards/dashboard-card";

interface DebtDueSoonItem {
  id: string;
  name: string;
  counterparty: string | null;
  direction: "i_owe" | "they_owe";
  deadline: string;
  remainingAmount: number;
  daysUntilDeadline: number;
}

interface DebtsDueSoonProps {
  debts: DebtDueSoonItem[];
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

export default function DebtsDueSoon({ debts }: DebtsDueSoonProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">Debts Due Soon</h2>
        <Link
          href="/debts/summary"
          className="text-sm font-medium text-primary underline-offset-2 hover:underline"
        >
          See all -&gt;
        </Link>
      </div>

      {debts.length === 0 ? (
        <DashboardCard
          title="No due dates in the next 7 days"
          value="You are clear"
          icon={CalendarClock}
          description="Add debts with deadlines to keep this section updated."
        >
          <Link
            href="/debts"
            className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
            style={{
              backgroundColor: "rgb(var(--m3-secondary-container))",
              color: "rgb(var(--m3-on-secondary-container))",
            }}
          >
            Add debt
          </Link>
        </DashboardCard>
      ) : (
        <div className="space-y-3">
          {debts.map((debt) => (
            <Link key={debt.id} href="/debts/summary" className="block">
              <DashboardCard
                title={debt.name}
                value={currencyFormatter.format(debt.remainingAmount)}
                icon={CalendarClock}
                description={`${debt.counterparty || "Counterparty"} - Due ${new Date(
                  `${debt.deadline}T00:00:00.000Z`
                ).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor:
                        debt.direction === "i_owe"
                          ? "rgb(var(--m3-error-container))"
                          : "rgb(var(--m3-primary-container))",
                      color:
                        debt.direction === "i_owe"
                          ? "rgb(var(--m3-on-error-container))"
                          : "rgb(var(--m3-on-primary-container))",
                    }}
                  >
                    {debt.direction === "i_owe" ? "I owe" : "They owe"}
                  </span>

                  <span
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: "rgb(var(--m3-tertiary-container))",
                      color: "rgb(var(--m3-on-tertiary-container))",
                    }}
                  >
                    {debt.daysUntilDeadline === 0
                      ? "Due today"
                      : `${debt.daysUntilDeadline}d left`}
                  </span>
                </div>
              </DashboardCard>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
