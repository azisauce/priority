"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useSidebar } from "@/components/sidebar-provider";
import { mainNavItems } from "@/lib/nav-items";
import TopAppBar from "@/components/layout/top-app-bar";
import PageTabBar from "@/components/navigation/page-tab-bar";

export default function AuthenticatedLayoutShell({
    children,
}: {
    children: React.ReactNode;
}) {
    const { collapsed } = useSidebar();
    const pathname = usePathname();
    const router = useRouter();
    const { data: session } = useSession();

    // Find the active parent (Wishlist, Tracking, etc.)
    const activeParent = mainNavItems.find(
        (item) => "children" in item && item.children?.some((child) => pathname === child.href || pathname.startsWith(child.href + "/"))
    ) as { label: string; children: { href: string; label: string }[] } | undefined;

    // Convert children to tab format for PageTabBar
    const tabs = activeParent?.children.map(child => ({
        key: child.href,
        label: child.label,
    }));

    const activeTab = activeParent?.children.find(
        child => pathname === child.href || pathname.startsWith(child.href + "/")
    )?.href;

    const hasTabs = Boolean(tabs && activeTab);

    // Get the current page title for TopAppBar
    const getPageTitle = (): string => {
        if (activeParent) return activeParent.label;
        const leafItem = mainNavItems.find(item => item.href && (pathname === item.href || pathname.startsWith(item.href + "/")));
        if (leafItem) return leafItem.label;
        if (pathname.startsWith("/profile")) return "Profile";
        return "Priority";
    };

    return (
        <main
            className="transition-all duration-300 ease-in-out min-h-screen"
        >
            {/* Mobile: TopAppBar + optional PageTabBar */}
            <div className="lg:hidden">
                <TopAppBar
                    title={getPageTitle()}
                    userImage={session?.user?.image}
                    onAvatarPress={() => router.push("/profile")}
                />
                {tabs && activeTab && (
                    <PageTabBar
                        tabs={tabs}
                        activeTab={activeTab}
                        onTabChange={(key) => router.push(key)}
                    />
                )}
            </div>

            {/* Desktop: floating content panel */}
            <div
                className={`
          lg:m-4 lg:rounded-2xl lg:shadow-lg lg:bg-card lg:border lg:border-border lg:min-h-[calc(100vh-2rem)]
          transition-all duration-300 ease-in-out
          ${collapsed ? "lg:ml-[calc(72px+2rem)]" : "lg:ml-[calc(16rem+2rem)]"}
        `}
            >
                <div className={`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 lg:pb-8 lg:pt-8 ${hasTabs ? "pt-[108px]" : "pt-[60px]"}`}>
                    {children}
                </div>
            </div>
        </main>
    );
}
