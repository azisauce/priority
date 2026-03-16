"use client";

import Link from "next/link";
import { ArrowDownCircle, ArrowUpCircle, CircleCheck, CircleDot } from "lucide-react";
import DashboardCard from "@/components/cards/dashboard-card";

interface PaymentStatusItem {
  id: string;
  name: string;
  type: "income" | "expense";
  category: string | null;
  dayOfMonth: number;
  amount: number;
  isVariable: boolean;
  isPaid: boolean;
}

interface PaymentsStatusProps {
  payments: PaymentStatusItem[];
  paidCount: number;
  unpaidCount: number;
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

export default function PaymentsStatus({
  payments,
  paidCount,
  unpaidCount,
}: PaymentsStatusProps) {
  const hasPayments = payments.length > 0;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">Monthly Payments Status</h2>
          {hasPayments ? (
            <p className="text-xs text-muted-foreground">
              {paidCount} paid, {unpaidCount} unpaid
            </p>
          ) : null}
        </div>
        <Link
          href="/payments/overview"
          className="text-sm font-medium text-primary underline-offset-2 hover:underline"
        >
          See all -&gt;
        </Link>
      </div>

      {!hasPayments ? (
        <DashboardCard
          title="No monthly payments"
          value="Start tracking"
          icon={CircleDot}
          description="Add recurring income and expenses to track this month."
        >
          <Link
            href="/payments/overview"
            className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
            style={{
              backgroundColor: "rgb(var(--m3-secondary-container))",
              color: "rgb(var(--m3-on-secondary-container))",
            }}
          >
            Add payment
          </Link>
        </DashboardCard>
      ) : (
        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1">
          {payments.map((payment) => {
            const PaymentIcon = payment.type === "income" ? ArrowDownCircle : ArrowUpCircle;

            return (
              <Link
                key={payment.id}
                href="/payments/overview"
                className="block min-w-72 snap-start"
              >
                <DashboardCard
                  title={payment.name}
                  value={currencyFormatter.format(payment.amount)}
                  icon={PaymentIcon}
                  description={`${payment.category || "Uncategorized"} - Day ${payment.dayOfMonth}`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor: payment.isPaid
                          ? "rgb(var(--m3-primary-container))"
                          : "rgb(var(--m3-tertiary-container))",
                        color: payment.isPaid
                          ? "rgb(var(--m3-on-primary-container))"
                          : "rgb(var(--m3-on-tertiary-container))",
                      }}
                    >
                      {payment.isPaid ? (
                        <>
                          <CircleCheck className="mr-1 h-3 w-3" /> Paid
                        </>
                      ) : (
                        "Unpaid"
                      )}
                    </span>

                    <span
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor: "rgb(var(--m3-secondary-container))",
                        color: "rgb(var(--m3-on-secondary-container))",
                      }}
                    >
                      {payment.isVariable ? "Variable" : "Fixed"}
                    </span>
                  </div>
                </DashboardCard>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
