"use client";

import { components, shape } from "@/theme/tokens";
import type { LucideIcon } from "lucide-react";

interface ActionButtonProps {
    label: string;
    onClick?: () => void;
    type?: "button" | "submit" | "reset";
    variant?: "filled" | "outlined" | "text" | "tonal";
    icon?: LucideIcon;
    disabled?: boolean;
    fullWidth?: boolean;
    className?: string;
}

export default function ActionButton({
    label,
    onClick,
    type = "button",
    variant = "filled",
    icon: Icon,
    disabled = false,
    fullWidth = false,
    className = "",
}: ActionButtonProps) {
    const baseStyles: React.CSSProperties = {
        height: `${components.actionButton.height}px`,
        minWidth: `${components.actionButton.minWidth}px`,
        borderRadius: `${shape.full}px`,
        fontSize: "14px",
        fontWeight: 500,
        letterSpacing: "0.1px",
        lineHeight: "20px",
        padding: "0 24px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        transition: "all 150ms ease",
        width: fullWidth ? "100%" : undefined,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.38 : 1,
    };

    const variantStyles: Record<string, React.CSSProperties> = {
        filled: {
            backgroundColor: "rgb(var(--m3-primary))",
            color: "rgb(var(--m3-on-primary))",
            border: "none",
        },
        outlined: {
            backgroundColor: "transparent",
            color: "rgb(var(--m3-primary))",
            border: "1px solid rgb(var(--m3-outline))",
        },
        text: {
            backgroundColor: "transparent",
            color: "rgb(var(--m3-primary))",
            border: "none",
        },
        tonal: {
            backgroundColor: "rgb(var(--m3-secondary-container))",
            color: "rgb(var(--m3-on-secondary-container))",
            border: "none",
        },
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`hover:opacity-90 active:opacity-80 ${className}`}
            style={{ ...baseStyles, ...variantStyles[variant] }}
        >
            {Icon && <Icon style={{ width: "18px", height: "18px" }} />}
            {label}
        </button>
    );
}
