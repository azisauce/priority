"use client";

import StatusBadge from "@/components/common/status-badge";

interface PaymentHistoryRowProps {
  entry: {
    id: string;
    month: string;
    expectedAmount: number;
    actualPaid: number | null;
    isPaid: boolean;
  };
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

export default function PaymentHistoryRow({ entry }: PaymentHistoryRowProps) {
  return (
    <tr key={entry.id} className="border-b border-border/50 last:border-b-0">
      <td className="px-4 py-3 text-sm text-foreground">
        {new Date(`${entry.month}T00:00:00.000Z`).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        })}
      </td>
      <td className="px-4 py-3 text-sm text-foreground">{currencyFormatter.format(entry.expectedAmount)}</td>
      <td className="px-4 py-3 text-sm text-foreground">
        {entry.actualPaid === null ? "-" : currencyFormatter.format(entry.actualPaid)}
      </td>
      <td className="px-4 py-3">
        <StatusBadge label={entry.isPaid ? "Paid" : "Pending"} variant={entry.isPaid ? "success" : "warning"} />
      </td>
    </tr>
  );
}
