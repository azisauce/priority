"use client";

import { shape } from "@/theme/tokens";

interface FilterChipProps {
    label: string;
    selected: boolean;
    onToggle: () => void;
    disabled?: boolean;
}

export default function FilterChip({
    label,
    selected,
    onToggle,
    disabled = false,
}: FilterChipProps) {
    return (
        <button
            onClick={onToggle}
            disabled={disabled}
            className="shrink-0 transition-all whitespace-nowrap"
            style={{
                height: "32px",
                padding: "0 16px",
                borderRadius: `${shape.extraSmall}px`,
                fontSize: "12px",
                fontWeight: 500,
                letterSpacing: "0.5px",
                border: selected ? "none" : "1px solid rgb(var(--m3-outline))",
                backgroundColor: selected
                    ? "rgb(var(--m3-secondary-container))"
                    : "transparent",
                color: selected
                    ? "rgb(var(--m3-on-secondary-container))"
                    : "rgb(var(--m3-on-surface-variant))",
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.38 : 1,
            }}
        >
            {selected && <span className="mr-1">✓</span>}
            {label}
        </button>
    );
}
