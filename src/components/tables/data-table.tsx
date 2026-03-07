"use client";

interface Column<T> {
    key: string;
    header: string;
    render?: (item: T, index: number) => React.ReactNode;
    align?: "left" | "center" | "right";
    width?: string;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    keyExtractor: (item: T, index: number) => string;
    onRowClick?: (item: T) => void;
    emptyMessage?: string;
    className?: string;
}

export default function DataTable<T>({
    columns,
    data,
    keyExtractor,
    onRowClick,
    className = "",
}: DataTableProps<T>) {
    return (
        <div className={`overflow-x-auto ${className}`}>
            <table className="w-full" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
                <thead>
                    <tr>
                        {columns.map((col) => (
                            <th
                                key={col.key}
                                style={{
                                    textAlign: col.align || "left",
                                    padding: "12px 16px",
                                    fontSize: "12px",
                                    fontWeight: 500,
                                    letterSpacing: "0.5px",
                                    color: "rgb(var(--m3-on-surface-variant))",
                                    borderBottom: "1px solid rgb(var(--m3-outline-variant))",
                                    whiteSpace: "nowrap",
                                    width: col.width,
                                }}
                            >
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((item, idx) => (
                        <tr
                            key={keyExtractor(item, idx)}
                            onClick={() => onRowClick?.(item)}
                            className={`transition-colors ${onRowClick ? "cursor-pointer" : ""}`}
                            style={{
                                backgroundColor: "transparent",
                            }}
                            onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.backgroundColor =
                                    "rgb(var(--m3-surface-variant) / 0.3)";
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                            }}
                        >
                            {columns.map((col) => (
                                <td
                                    key={col.key}
                                    style={{
                                        textAlign: col.align || "left",
                                        padding: "12px 16px",
                                        fontSize: "14px",
                                        lineHeight: "20px",
                                        color: "rgb(var(--m3-on-surface))",
                                        borderBottom: "1px solid rgb(var(--m3-outline-variant) / 0.3)",
                                    }}
                                >
                                    {col.render
                                        ? col.render(item, idx)
                                        : String((item as Record<string, unknown>)[col.key] ?? "")}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
