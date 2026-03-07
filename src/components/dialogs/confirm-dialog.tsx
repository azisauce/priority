"use client";

import DialogBase from "./dialog-base";
import ActionButton from "../common/action-button";

interface ConfirmDialogProps {
    open: boolean;
    onClose: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    variant?: "default" | "destructive";
    loading?: boolean;
}

export default function ConfirmDialog({
    open,
    onClose,
    title,
    message,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    onConfirm,
    variant = "default",
    loading = false,
}: ConfirmDialogProps) {
    return (
        <DialogBase open={open} onClose={onClose} title={title} maxWidth="400px">
            <p
                style={{
                    fontSize: "14px",
                    lineHeight: "20px",
                    color: "rgb(var(--m3-on-surface-variant))",
                    marginBottom: "24px",
                }}
            >
                {message}
            </p>
            <div className="flex items-center justify-end gap-2">
                <ActionButton label={cancelLabel} variant="text" onClick={onClose} />
                <ActionButton
                    label={loading ? "..." : confirmLabel}
                    variant={variant === "destructive" ? "filled" : "filled"}
                    onClick={onConfirm}
                    disabled={loading}
                    className={variant === "destructive" ? "!bg-[rgb(var(--m3-error))] !text-[rgb(var(--m3-on-error))]" : ""}
                />
            </div>
        </DialogBase>
    );
}
