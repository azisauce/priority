"use client";

import DialogBase from "./dialog-base";
import ActionButton from "../common/action-button";

interface FormDialogProps {
    open: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    onSubmit: (e: React.FormEvent) => void;
    submitLabel?: string;
    cancelLabel?: string;
    loading?: boolean;
    maxWidth?: string;
}

export default function FormDialog({
    open,
    onClose,
    title,
    children,
    onSubmit,
    submitLabel = "Save",
    cancelLabel = "Cancel",
    loading = false,
    maxWidth = "480px",
}: FormDialogProps) {
    return (
        <DialogBase open={open} onClose={onClose} title={title} maxWidth={maxWidth}>
            <form onSubmit={onSubmit}>
                <div className="space-y-4">{children}</div>
                <div className="flex items-center justify-end gap-2 mt-6">
                    <ActionButton label={cancelLabel} variant="text" onClick={onClose} type="button" />
                    <ActionButton label={loading ? "Saving..." : submitLabel} variant="filled" type="submit" disabled={loading} />
                </div>
            </form>
        </DialogBase>
    );
}
