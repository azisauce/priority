"use client";

import { AlertTriangle } from "lucide-react";
import ActionButton from "../common/action-button";

interface ErrorStateProps {
    message?: string;
    onRetry?: () => void;
    retryLabel?: string;
}

export default function ErrorState({
    message = "Something went wrong",
    onRetry,
    retryLabel = "Try Again",
}: ErrorStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div
                className="rounded-full flex items-center justify-center mb-4"
                style={{
                    width: "64px",
                    height: "64px",
                    backgroundColor: "rgb(var(--m3-error-container))",
                    color: "rgb(var(--m3-on-error-container))",
                }}
            >
                <AlertTriangle style={{ width: "28px", height: "28px" }} />
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
                Error
            </h3>
            <p
                style={{
                    fontSize: "14px",
                    lineHeight: "20px",
                    color: "rgb(var(--m3-on-surface-variant))",
                    maxWidth: "300px",
                }}
            >
                {message}
            </p>
            {onRetry && (
                <div className="mt-4">
                    <ActionButton label={retryLabel} variant="tonal" onClick={onRetry} />
                </div>
            )}
        </div>
    );
}
