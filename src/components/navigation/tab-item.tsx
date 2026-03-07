"use client";

interface TabItemProps {
    label: string;
    isActive: boolean;
    onPress: () => void;
}

export default function TabItem({ label, isActive, onPress }: TabItemProps) {
    return (
        <button
            onClick={onPress}
            className="shrink-0 transition-colors"
            style={{
                height: "48px",
                padding: "0 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "transparent",
                border: "none",
                borderBottom: isActive
                    ? "3px solid rgb(var(--m3-primary))"
                    : "3px solid transparent",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: 500,
                letterSpacing: "0.1px",
                color: isActive
                    ? "rgb(var(--m3-primary))"
                    : "rgb(var(--m3-on-surface-variant))",
                whiteSpace: "nowrap",
            }}
        >
            {label}
        </button>
    );
}
