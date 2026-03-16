function parseDateString(dateStr: string): Date | null {
    const datePart = dateStr.split("T")[0];
    const [year, month, day] = datePart.split("-").map(Number);

    if (
        !Number.isInteger(year) ||
        !Number.isInteger(month) ||
        !Number.isInteger(day)
    ) {
        return null;
    }

    const date = new Date(year, month - 1, day);

    if (
        Number.isNaN(date.getTime()) ||
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
    ) {
        return null;
    }

    return date;
}

export function formatMonthYear(dateStr: string): string {
    const date = parseDateString(dateStr);

    if (!date) {
        return "Invalid Date";
    }

    return date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
    });
}

export function formatDate(dateStr: string): string {
    const date = parseDateString(dateStr);

    if (!date) {
        return "Invalid Date";
    }

    return date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
    });
}
