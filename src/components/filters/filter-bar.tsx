"use client";

interface FilterBarProps {
    children: React.ReactNode;
    className?: string;
}

export default function FilterBar({ children, className = "" }: FilterBarProps) {
    return (
        <div
            className={`flex items-center overflow-x-auto scrollbar-hide ${className}`}
            style={{
                gap: "8px",
                paddingBottom: "4px",
            }}
        >
            {children}
        </div>
    );
}
