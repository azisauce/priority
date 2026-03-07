"use client";

interface SectionTitleProps {
    title: string;
    action?: React.ReactNode;
}

export default function SectionTitle({ title, action }: SectionTitleProps) {
    return (
        <div className="flex items-center justify-between" style={{ marginBottom: "12px" }}>
            <h2
                style={{
                    fontSize: "22px",
                    lineHeight: "28px",
                    fontWeight: 400,
                    color: "rgb(var(--m3-on-surface))",
                    margin: 0,
                }}
            >
                {title}
            </h2>
            {action && <div>{action}</div>}
        </div>
    );
}
