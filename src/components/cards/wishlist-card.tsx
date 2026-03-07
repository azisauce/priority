"use client";

import CardBase from "./card-base";
import StatusBadge from "../common/status-badge";

interface WishlistCardProps {
    title: string;
    price: string | number;
    priority: number;
    group?: string;
    description?: string;
    isDone?: boolean;
    onClick?: () => void;
    actions?: React.ReactNode;
    className?: string;
}

export default function WishlistCard({
    title,
    price,
    priority,
    group,
    description,
    isDone,
    onClick,
    actions,
    className = "",
}: WishlistCardProps) {
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
                            className={isDone ? "line-through opacity-60" : ""}
                        >
                            {title}
                        </h3>
                        {isDone && <StatusBadge label="Done" variant="success" />}
                        {group && <StatusBadge label={group} variant="info" />}
                    </div>
                    {description && (
                        <p
                            style={{
                                fontSize: "14px",
                                lineHeight: "20px",
                                color: "rgb(var(--m3-on-surface-variant))",
                                marginTop: "4px",
                            }}
                        >
                            {description}
                        </p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                        <span
                            style={{
                                fontSize: "14px",
                                fontWeight: 500,
                                color: "rgb(var(--m3-primary))",
                            }}
                        >
                            {typeof price === "number" ? `₦${price.toLocaleString()}` : price}
                        </span>
                        <span
                            style={{
                                fontSize: "12px",
                                fontWeight: 500,
                                color: "rgb(var(--m3-on-surface-variant))",
                            }}
                        >
                            Priority: {priority.toFixed(2)}
                        </span>
                    </div>
                </div>
                {actions && <div className="shrink-0 flex items-center gap-1">{actions}</div>}
            </div>
        </CardBase>
    );
}
