"use client";

import { components } from "@/theme/tokens";

interface NavItemProps {
    icon: React.ComponentType<{ style?: React.CSSProperties; className?: string }>;
    activeIcon?: React.ComponentType<{ style?: React.CSSProperties; className?: string }>;
    label: string;
    isActive: boolean;
    onPress: () => void;
}

export default function NavItem({
    icon: Icon,
    activeIcon: ActiveIcon,
    label,
    isActive,
    onPress,
}: NavItemProps) {
    const DisplayIcon = isActive && ActiveIcon ? ActiveIcon : Icon;

    return (
        <button
            onClick={onPress}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0 transition-colors"
            style={{
                padding: "12px 0 16px",
                minHeight: `${components.bottomNavBar.height}px`,
                background: "transparent",
                border: "none",
                cursor: "pointer",
            }}
        >
            {/* Icon container with active indicator pill */}
            <div className="relative flex items-center justify-center">
                {isActive && (
                    <div
                        className="absolute rounded-full"
                        style={{
                            width: `${components.navIndicator.width}px`,
                            height: `${components.navIndicator.height}px`,
                            backgroundColor: "rgb(var(--m3-secondary-container))",
                        }}
                    />
                )}
                <DisplayIcon
                    style={{
                        width: "24px",
                        height: "24px",
                        position: "relative",
                        zIndex: 1,
                        color: isActive
                            ? "rgb(var(--m3-on-secondary-container))"
                            : "rgb(var(--m3-on-surface-variant))",
                    }}
                />
            </div>

            {/* Label */}
            <span
                style={{
                    fontSize: "12px",
                    fontWeight: 500,
                    letterSpacing: "0.5px",
                    lineHeight: "16px",
                    color: isActive
                        ? "rgb(var(--m3-on-secondary-container))"
                        : "rgb(var(--m3-on-surface-variant))",
                }}
                className="truncate max-w-full px-1"
            >
                {label}
            </span>
        </button>
    );
}
