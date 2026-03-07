"use client";

import CardBase from "./card-base";
import type { LucideIcon } from "lucide-react";

interface SimulationCardProps {
    title: string;
    value: string | number;
    icon?: LucideIcon;
    description?: string;
    highlight?: boolean;
    className?: string;
    children?: React.ReactNode;
}

export default function SimulationCard({
    title,
    value,
    icon: Icon,
    description,
    highlight = false,
    className = "",
    children,
}: SimulationCardProps) {
    return (
        <CardBase className={className}>
            <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                    <p
                        style={{
                            fontSize: "12px",
                            fontWeight: 500,
                            letterSpacing: "0.5px",
                            color: highlight ? "rgb(var(--m3-primary))" : "rgb(var(--m3-on-surface-variant))",
                            marginBottom: "4px",
                        }}
                    >
                        {title}
                    </p>
                    <p
                        style={{
                            fontSize: "22px",
                            lineHeight: "28px",
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
                </div>
                {Icon && (
                    <div
                        className="shrink-0 flex items-center justify-center rounded-full"
                        style={{
                            width: "40px",
                            height: "40px",
                            backgroundColor: highlight
                                ? "rgb(var(--m3-primary-container))"
                                : "rgb(var(--m3-surface-variant))",
                            color: highlight
                                ? "rgb(var(--m3-on-primary-container))"
                                : "rgb(var(--m3-on-surface-variant))",
                        }}
                    >
                        <Icon style={{ width: "20px", height: "20px" }} />
                    </div>
                )}
            </div>
            {children}
        </CardBase>
    );
}
