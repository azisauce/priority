"use client";

import Link from "next/link";
import { HandCoins } from "lucide-react";
import DashboardCard from "@/components/cards/dashboard-card";

interface BalanceStripProps {
  totalIncome: number;
  fixedExpenses: number;
  net: number;
  paymentsCount: number;
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

export default function BalanceStrip({
  totalIncome,
  fixedExpenses,
  net,
  paymentsCount,
}: BalanceStripProps) {
  const valueColor =
    net > 0
      ? "rgb(var(--m3-primary))"
      : net < 0
        ? "rgb(var(--m3-error))"
        : "rgb(var(--m3-on-surface))";

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">Balance Strip</h2>
        <Link
          href="/payments/overview"
          className="text-sm font-medium text-primary underline-offset-2 hover:underline"
        >
          See all -&gt;
        </Link>
      </div>

      <DashboardCard
        title="Current Month Net"
        value={currencyFormatter.format(net)}
        icon={HandCoins}
        description={`${currencyFormatter.format(totalIncome)} income - ${currencyFormatter.format(
          fixedExpenses
        )} fixed expenses`}
        valueStyle={{
          fontSize: "40px",
          lineHeight: "46px",
          fontWeight: 600,
          color: valueColor,
        }}
      >
        {paymentsCount === 0 ? (
          <Link
            href="/payments/overview"
            className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
            style={{
              backgroundColor: "rgb(var(--m3-secondary-container))",
              color: "rgb(var(--m3-on-secondary-container))",
            }}
          >
            Add monthly payments
          </Link>
        ) : null}
      </DashboardCard>
    </section>
  );
}
