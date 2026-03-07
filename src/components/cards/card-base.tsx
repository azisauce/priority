"use client";

import { components, shape, elevation } from "@/theme/tokens";

interface CardBaseProps {
    children: React.ReactNode;
    className?: string;
    padding?: number;
    onClick?: () => void;
    elevationLevel?: keyof typeof elevation;
}

export default function CardBase({
    children,
    className = "",
    padding = components.card.padding,
    onClick,
    elevationLevel = "level1",
}: CardBaseProps) {
    const elev = elevation[elevationLevel];

    return (
        <div
            onClick={onClick}
            className={`transition-shadow ${onClick ? "cursor-pointer hover:shadow-md" : ""} ${className}`}
            style={{
                borderRadius: `${shape.medium}px`,
                padding: `${padding}px`,
                backgroundColor: "rgb(var(--m3-surface))",
                color: "rgb(var(--m3-on-surface))",
                boxShadow: `0 ${elev.dp}px ${elev.dp * 2}px rgb(var(--m3-scrim) / ${elev.shadowOpacity})`,
                border: "1px solid rgb(var(--m3-outline-variant) / 0.3)",
            }}
        >
            {children}
        </div>
    );
}
