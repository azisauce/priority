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

export function getOrdinal(n: number): string {
    const absolute = Math.abs(Math.trunc(n));
    const remainder100 = absolute % 100;

    if (remainder100 >= 11 && remainder100 <= 13) {
        return `${absolute}th`;
    }

    const remainder10 = absolute % 10;

    if (remainder10 === 1) {
        return `${absolute}st`;
    }

    if (remainder10 === 2) {
        return `${absolute}nd`;
    }

    if (remainder10 === 3) {
        return `${absolute}rd`;
    }

    return `${absolute}th`;
}
