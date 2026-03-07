"use client";

import { shape } from "@/theme/tokens";

interface StatusBadgeProps {
    label: string;
    variant?: "default" | "success" | "warning" | "error" | "info";
    size?: "sm" | "md";
}

const variantStyles: Record<string, { bg: string; text: string }> = {
    default: {
        bg: "rgb(var(--m3-surface-variant))",
        text: "rgb(var(--m3-on-surface-variant))",
    },
    success: {
        bg: "rgb(var(--m3-primary-container))",
        text: "rgb(var(--m3-on-primary-container))",
    },
    warning: {
        bg: "rgb(var(--m3-tertiary-container))",
        text: "rgb(var(--m3-on-tertiary-container))",
    },
    error: {
        bg: "rgb(var(--m3-error-container))",
        text: "rgb(var(--m3-on-error-container))",
    },
    info: {
        bg: "rgb(var(--m3-secondary-container))",
        text: "rgb(var(--m3-on-secondary-container))",
    },
};

export default function StatusBadge({
    label,
    variant = "default",
    size = "sm",
}: StatusBadgeProps) {
    const style = variantStyles[variant] ?? variantStyles.default;

    return (
        <span
            className="inline-flex items-center font-medium whitespace-nowrap"
            style={{
                backgroundColor: style.bg,
                color: style.text,
                borderRadius: `${shape.full}px`,
                padding: size === "sm" ? "2px 8px" : "4px 12px",
                fontSize: size === "sm" ? "11px" : "12px",
                lineHeight: size === "sm" ? "16px" : "16px",
                fontWeight: 500,
                letterSpacing: "0.5px",
            }}
        >
            {label}
        </span>
    );
}
