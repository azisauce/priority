"use client";

import { components } from "@/theme/tokens";
import type { LucideIcon } from "lucide-react";

interface IconButtonRoundProps {
    icon: LucideIcon;
    onClick?: () => void;
    ariaLabel: string;
    variant?: "standard" | "filled" | "tonal" | "outlined";
    disabled?: boolean;
    size?: number;
}

export default function IconButtonRound({
    icon: Icon,
    onClick,
    ariaLabel,
    variant = "standard",
    disabled = false,
    size = components.iconButton.size,
}: IconButtonRoundProps) {
    const variantStyles: Record<string, React.CSSProperties> = {
        standard: {
            backgroundColor: "transparent",
            color: "rgb(var(--m3-on-surface-variant))",
        },
        filled: {
            backgroundColor: "rgb(var(--m3-primary))",
            color: "rgb(var(--m3-on-primary))",
        },
        tonal: {
            backgroundColor: "rgb(var(--m3-secondary-container))",
            color: "rgb(var(--m3-on-secondary-container))",
        },
        outlined: {
            backgroundColor: "transparent",
            color: "rgb(var(--m3-on-surface-variant))",
            border: "1px solid rgb(var(--m3-outline))",
        },
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            aria-label={ariaLabel}
            className="flex items-center justify-center rounded-full transition-opacity hover:opacity-80 active:opacity-70"
            style={{
                width: `${components.iconButton.touchTarget}px`,
                height: `${components.iconButton.touchTarget}px`,
                padding: `${(components.iconButton.touchTarget - size) / 2}px`,
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.38 : 1,
                ...variantStyles[variant],
            }}
        >
            <Icon style={{ width: `${size * 0.6}px`, height: `${size * 0.6}px` }} />
        </button>
    );
}
