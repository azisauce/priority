"use client";

import CardBase from "./card-base";
import type { LucideIcon } from "lucide-react";

interface DashboardCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    description?: string;
    trend?: { value: number; label: string };
    className?: string;
}

export default function DashboardCard({
    title,
    value,
    icon: Icon,
    description,
    trend,
    className = "",
}: DashboardCardProps) {
    return (
        <CardBase className={className}>
            <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                    <p
                        style={{
                            fontSize: "12px",
                            fontWeight: 500,
                            letterSpacing: "0.5px",
                            color: "rgb(var(--m3-on-surface-variant))",
                            marginBottom: "4px",
                        }}
                    >
                        {title}
                    </p>
                    <p
                        style={{
                            fontSize: "28px",
                            lineHeight: "36px",
                            fontWeight: 400,
                            color: "rgb(var(--m3-on-surface))",
                            margin: 0,
                        }}
                    >
                        {value}
                    </p>
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
                    {trend && (
                        <p
                            style={{
                                fontSize: "12px",
                                fontWeight: 500,
                                color: trend.value >= 0 ? "rgb(var(--m3-primary))" : "rgb(var(--m3-error))",
                                marginTop: "4px",
                            }}
                        >
                            {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}% {trend.label}
                        </p>
                    )}
                </div>
                <div
                    className="shrink-0 flex items-center justify-center rounded-full"
                    style={{
                        width: "40px",
                        height: "40px",
                        backgroundColor: "rgb(var(--m3-primary-container))",
                        color: "rgb(var(--m3-on-primary-container))",
                    }}
                >
                    <Icon style={{ width: "20px", height: "20px" }} />
                </div>
            </div>
        </CardBase>
    );
}
