"use client";

interface LoadingStateProps {
    message?: string;
    variant?: "spinner" | "skeleton";
    count?: number;
}

function Skeleton() {
    return (
        <div className="animate-pulse space-y-3">
            <div
                className="rounded"
                style={{
                    height: "16px",
                    width: "75%",
                    backgroundColor: "rgb(var(--m3-surface-variant))",
                }}
            />
            <div
                className="rounded"
                style={{
                    height: "16px",
                    width: "50%",
                    backgroundColor: "rgb(var(--m3-surface-variant))",
                }}
            />
            <div
                className="rounded"
                style={{
                    height: "16px",
                    width: "60%",
                    backgroundColor: "rgb(var(--m3-surface-variant))",
                }}
            />
        </div>
    );
}

export default function LoadingState({
    message = "Loading...",
    variant = "spinner",
    count = 3,
}: LoadingStateProps) {
    if (variant === "skeleton") {
        return (
            <div className="space-y-4 py-4">
                {Array.from({ length: count }).map((_, i) => (
                    <div
                        key={i}
                        className="rounded-xl p-4"
                        style={{ backgroundColor: "rgb(var(--m3-surface) / 0.5)" }}
                    >
                        <Skeleton />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
            <div
                className="animate-spin rounded-full mb-4"
                style={{
                    width: "36px",
                    height: "36px",
                    border: "3px solid rgb(var(--m3-surface-variant))",
                    borderTopColor: "rgb(var(--m3-primary))",
                }}
            />
            <p
                style={{
                    fontSize: "14px",
                    lineHeight: "20px",
                    color: "rgb(var(--m3-on-surface-variant))",
                }}
            >
                {message}
            </p>
        </div>
    );
}
