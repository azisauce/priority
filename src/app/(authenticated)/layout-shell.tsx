"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/components/sidebar-provider";
import { mainNavItems } from "@/lib/nav-items";

export default function AuthenticatedLayoutShell({
    children,
}: {
    children: React.ReactNode;
}) {
    const { collapsed } = useSidebar();
    const pathname = usePathname();

    // Find the active parent (Wishlist, Tracking, etc.)
    const activeParent = mainNavItems.find(
        (item) => "children" in item && item.children?.some((child) => pathname === child.href || pathname.startsWith(child.href + "/"))
    ) as { label: string; children: { href: string; label: string }[] } | undefined;

    return (
        <main
            className="transition-all duration-300 ease-in-out min-h-screen"
        >
            {/* Desktop: floating content panel */}
            <div
                className={`
          lg:m-4 lg:rounded-2xl lg:shadow-lg lg:bg-card lg:border lg:border-border lg:min-h-[calc(100vh-2rem)]
          transition-all duration-300 ease-in-out
          ${collapsed ? "lg:ml-[calc(72px+2rem)]" : "lg:ml-[calc(16rem+2rem)]"}
        `}
            >
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:pt-8 pb-24 lg:pb-8">
                    {/* Mobile secondary tab bar — in-flow, above page content */}
                    {activeParent && (
                        <div className="lg:hidden -mx-4 sm:-mx-6 mb-6">
                            {/* Section title */}
                            <p className="px-4 sm:px-6 pt-1 pb-2 lg:text-xl sm:text-3xl text-2xl font-bold text-foreground">
                                {activeParent.label}
                            </p>
                            {/* Tab row */}
                            <nav className="border-b border-border" aria-label={activeParent.label + " sections"}>
                                <div className="flex">
                                    {activeParent.children.map((child) => {
                                        const isActive = pathname === child.href || pathname.startsWith(child.href + "/");
                                        return (
                                            <Link
                                                key={child.href}
                                                href={child.href}
                                                className={`
                                                    flex-1 text-center py-2.5 text-sm font-semibold transition-colors border-b-2
                                                    ${isActive
                                                        ? "text-primary border-primary"
                                                        : "text-muted-foreground border-transparent hover:text-foreground"
                                                    }
                                                `}
                                            >
                                                {child.label}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </nav>
                        </div>
                    )}
                    {children}
                </div>
            </div>
        </main>
    );
}
