"use client";

import { useSidebar } from "@/components/sidebar-provider";

export default function AuthenticatedLayoutShell({
    children,
}: {
    children: React.ReactNode;
}) {
    const { collapsed } = useSidebar();

    return (
        <main
            className="transition-all duration-300 ease-in-out min-h-screen"
            style={{
                // Desktop: sidebar width + margin (16px left of sidebar + sidebar + 16px gap)
                // Mobile: no offset
            }}
        >
            {/* Desktop: floating content panel */}
            <div
                className={`
          lg:m-4 lg:rounded-2xl lg:shadow-lg lg:bg-card lg:border lg:border-border lg:min-h-[calc(100vh-2rem)]
          transition-all duration-300 ease-in-out
          ${collapsed ? "lg:ml-[calc(72px+2rem)]" : "lg:ml-[calc(16rem+2rem)]"}
        `}
            >
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-16 lg:pt-8 pb-24 lg:pb-8">
                    {children}
                </div>
            </div>
        </main>
    );
}
