"use client";

import { components } from "@/theme/tokens";

interface PageHeaderProps {
    title?: string;
    description: string;
}

/**
 * PageHeader — renders only the description line.
 * The title is intentionally omitted: it already appears in the TopAppBar on mobile
 * and in the sidebar context on desktop, so repeating it inside the page content
 * creates visual duplication.
 *
 * Pass `title` only if you explicitly want a desktop-only section heading
 * (it will be hidden on mobile via the lg: prefix).
 */
export default function PageHeader({ title, description }: PageHeaderProps) {
    return (
        <div
            style={{
                marginTop: `${components.pageHeader.topMargin}px`,
                marginBottom: `${components.pageHeader.bottomMargin}px`,
            }}
        >
            {/* Desktop-only title — hidden on mobile because TopAppBar has it */}
            {title && (
                <h1
                    className="hidden lg:block"
                    style={{
                        fontSize: "28px",
                        lineHeight: "36px",
                        fontWeight: 400,
                        color: "rgb(var(--m3-on-surface))",
                        margin: 0,
                    }}
                >
                    {title}
                </h1>
            )}
            <p
                style={{
                    fontSize: "14px",
                    lineHeight: "20px",
                    fontWeight: 400,
                    letterSpacing: "0.25px",
                    color: "rgb(var(--m3-on-surface-variant))",
                    marginTop: title ? "4px" : 0,
                }}
            >
                {description}
            </p>
        </div>
    );
}
