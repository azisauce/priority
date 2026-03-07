"use client";

import { useEffect, useCallback } from "react";
import { shape } from "@/theme/tokens";
import { X } from "lucide-react";

interface DialogBaseProps {
    open: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
    maxWidth?: string;
}

export default function DialogBase({
    open,
    onClose,
    children,
    title,
    maxWidth = "480px",
}: DialogBaseProps) {
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        },
        [onClose]
    );

    useEffect(() => {
        if (open) {
            document.addEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "";
        };
    }, [open, handleKeyDown]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            {/* Scrim */}
            <div
                className="absolute inset-0"
                style={{ backgroundColor: "rgb(var(--m3-scrim) / 0.32)" }}
            />

            {/* Dialog surface */}
            <div
                className="relative w-full animate-slide-up overflow-y-auto"
                style={{
                    maxWidth,
                    maxHeight: "85vh",
                    borderRadius: `${shape.extraLarge}px`,
                    backgroundColor: "rgb(var(--m3-surface))",
                    color: "rgb(var(--m3-on-surface))",
                    boxShadow: "0 6px 30px rgb(var(--m3-scrim) / 0.15)",
                    padding: "24px",
                }}
            >
                {/* Header */}
                {title && (
                    <div className="flex items-center justify-between mb-4">
                        <h2
                            style={{
                                fontSize: "24px",
                                lineHeight: "32px",
                                fontWeight: 400,
                                color: "rgb(var(--m3-on-surface))",
                                margin: 0,
                            }}
                        >
                            {title}
                        </h2>
                        <button
                            onClick={onClose}
                            className="flex items-center justify-center rounded-full transition-opacity hover:opacity-70"
                            style={{
                                width: "40px",
                                height: "40px",
                                color: "rgb(var(--m3-on-surface-variant))",
                            }}
                            aria-label="Close dialog"
                        >
                            <X style={{ width: "20px", height: "20px" }} />
                        </button>
                    </div>
                )}

                {children}
            </div>
        </div>
    );
}
