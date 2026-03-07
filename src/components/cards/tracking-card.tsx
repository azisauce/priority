"use client";

import CardBase from "./card-base";
import StatusBadge from "../common/status-badge";

interface TrackingCardProps {
    title: string;
    amount: string | number;
    remainingBalance?: number;
    lender?: string;
    status?: "active" | "paid" | "overdue";
    nextPaymentDate?: string | null;
    onClick?: () => void;
    actions?: React.ReactNode;
    className?: string;
}

const statusVariant: Record<string, "success" | "warning" | "error" | "info"> = {
    active: "info",
    paid: "success",
    overdue: "error",
};

export default function TrackingCard({
    title,
    amount,
    remainingBalance,
    lender,
    status,
    nextPaymentDate,
    onClick,
    actions,
    className = "",
}: TrackingCardProps) {
    return (
        <CardBase onClick={onClick} className={className}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3
                            style={{
                                fontSize: "16px",
                                lineHeight: "24px",
                                fontWeight: 500,
                                letterSpacing: "0.15px",
                                color: "rgb(var(--m3-on-surface))",
                                margin: 0,
                            }}
                        >
                            {title}
                        </h3>
                        {status && <StatusBadge label={status} variant={statusVariant[status] ?? "default"} />}
                    </div>
                    {lender && (
                        <p
                            style={{
                                fontSize: "14px",
                                lineHeight: "20px",
                                color: "rgb(var(--m3-on-surface-variant))",
                                marginTop: "4px",
                            }}
                        >
                            {lender}
                        </p>
                    )}
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span
                            style={{
                                fontSize: "14px",
                                fontWeight: 500,
                                color: "rgb(var(--m3-on-surface))",
                            }}
                        >
                            Total: {typeof amount === "number" ? `₦${amount.toLocaleString()}` : amount}
                        </span>
                        {remainingBalance !== undefined && (
                            <span
                                style={{
                                    fontSize: "12px",
                                    fontWeight: 500,
                                    color: "rgb(var(--m3-tertiary))",
                                }}
                            >
                                Remaining: ₦{remainingBalance.toLocaleString()}
                            </span>
                        )}
                    </div>
                    {nextPaymentDate && (
                        <p
                            style={{
                                fontSize: "12px",
                                color: "rgb(var(--m3-on-surface-variant))",
                                marginTop: "4px",
                            }}
                        >
                            Next payment: {nextPaymentDate}
                        </p>
                    )}
                </div>
                {actions && <div className="shrink-0 flex items-center gap-1">{actions}</div>}
            </div>
        </CardBase>
    );
}
