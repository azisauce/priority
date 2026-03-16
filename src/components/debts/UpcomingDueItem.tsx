import type { DebtSummaryUpcomingDue } from "@/types/debt";

interface UpcomingDueItemProps {
  due: DebtSummaryUpcomingDue;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Math.abs(amount));

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

export default function UpcomingDueItem({ due }: UpcomingDueItemProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{due.name}</p>
        <p className="truncate text-xs text-muted-foreground">{due.counterparty}</p>
      </div>

      <div className="text-right">
        <p className={`text-sm font-semibold ${due.direction === "they_owe" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
          {due.direction === "they_owe" ? "+" : "-"}
          {formatCurrency(due.remaining_amount)}
        </p>
        <p className="text-xs text-muted-foreground">
          {due.days_until_deadline}d • {formatDate(due.deadline)}
        </p>
      </div>
    </div>
  );
}
