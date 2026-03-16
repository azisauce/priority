"use client";

import CardBase from "@/components/cards/card-base";
import ActionButton from "@/components/common/action-button";
import StatusBadge from "@/components/common/status-badge";
import { formatMonthYear, getOrdinal } from "@/lib/utils";
import type { MonthlyPayment } from "@/types/payment";

interface PaymentCardProps {
  payment: MonthlyPayment;
  onClick?: () => void;
  onMarkAsPaid?: () => void;
  markAsPaidLoading?: boolean;
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

export default function PaymentCard({
  payment,
  onClick,
  onMarkAsPaid,
  markAsPaidLoading = false,
}: PaymentCardProps) {
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
            {payment.name}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">{payment.category || "Uncategorized"}</p>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge
            label={payment.type === "income" ? "Income" : "Expense"}
            variant={payment.type === "income" ? "success" : "warning"}
          />
          <StatusBadge
            label={payment.isActive ? "Active" : "Ended"}
            variant={payment.isActive ? "info" : "default"}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Amount</p>
          <p className="font-medium text-foreground">{currencyFormatter.format(payment.defaultAmount)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">
            {payment.type === "income" ? "Paid on the" : "Due on the"}
          </p>
          <p className="font-medium text-foreground">{getOrdinal(payment.dayOfMonth)} of each month</p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Starts {formatMonthYear(payment.startMonth)}
        {payment.endMonth
          ? ` • Ends ${formatMonthYear(payment.endMonth)}`
          : " • No end date"}
      </p>

      {onMarkAsPaid && (
        <div
          onClick={(event) => {
            event.stopPropagation();
          }}
        >
          <ActionButton
            label={markAsPaidLoading ? "Saving..." : "Mark as paid"}
            variant="tonal"
            onClick={() => {
              onMarkAsPaid();
            }}
            disabled={markAsPaidLoading}
          />
        </div>
      )}
    </CardBase>
  );
}
