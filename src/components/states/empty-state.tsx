"use client";

import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import ActionButton from "../common/action-button";

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
}

export default function EmptyState({
    icon: Icon = Inbox,
    title,
    description,
    actionLabel,
    onAction,
}: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div
                className="rounded-full flex items-center justify-center mb-4"
                style={{
                    width: "64px",
                    height: "64px",
                    backgroundColor: "rgb(var(--m3-surface-variant))",
                    color: "rgb(var(--m3-on-surface-variant))",
                }}
            >
                <Icon style={{ width: "28px", height: "28px" }} />
            </div>
            <h3
                style={{
                    fontSize: "16px",
                    lineHeight: "24px",
                    fontWeight: 500,
                    color: "rgb(var(--m3-on-surface))",
                    margin: "0 0 4px",
                }}
            >
                {title}
            </h3>
            {description && (
                <p
                    style={{
                        fontSize: "14px",
                        lineHeight: "20px",
                        color: "rgb(var(--m3-on-surface-variant))",
                        maxWidth: "300px",
                    }}
                >
                    {description}
                </p>
            )}
            {actionLabel && onAction && (
                <div className="mt-4">
                    <ActionButton label={actionLabel} variant="tonal" onClick={onAction} />
                </div>
            )}
        </div>
    );
}
