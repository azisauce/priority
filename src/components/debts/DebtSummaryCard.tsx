import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";

interface DebtSummaryCardProps {
  title: string;
  amount: number;
  direction: "i_owe" | "they_owe";
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Math.abs(amount));

export default function DebtSummaryCard({ title, amount, direction }: DebtSummaryCardProps) {
  const isTheyOwe = direction === "they_owe";

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-3 flex items-center gap-2 text-muted-foreground">
        {isTheyOwe ? <ArrowUpCircle className="h-4 w-4" /> : <ArrowDownCircle className="h-4 w-4" />}
        <span className="text-sm font-medium">{title}</span>
      </div>
      <p className={`text-3xl font-semibold ${isTheyOwe ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
        {isTheyOwe ? "+" : "-"}
        {formatCurrency(amount)}
      </p>
    </div>
  );
}
