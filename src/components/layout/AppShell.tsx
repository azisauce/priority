"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "@/components/theme-provider";
import { useSidebar } from "@/components/sidebar-provider";
import { User, LogOut, ChevronLeft } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { mainNavItems } from "@/lib/nav-items";
import TopAppBar from "@/components/layout/top-app-bar";
import BottomNav from "@/components/layout/BottomNav";

/** Path prefixes that render a TabStrip inside their section layout */
const TAB_SECTIONS = ["/wishlist", "/debts", "/payments", "/expenses"];

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { data: session } = useSession();
    const { theme } = useTheme();
    const { collapsed, toggle } = useSidebar();

    const isActive = (href: string) =>
        pathname === href || pathname.startsWith(href + "/");

    const hasTabs = TAB_SECTIONS.some((prefix) => pathname.startsWith(prefix));

    // ─── Bottom nav active key ───────────────────────────────────────────
    const getActiveRoute = (): string => {
        if (pathname.startsWith("/dashboard")) return "dashboard";
        if (pathname.startsWith("/payments")) return "payments";
        if (pathname.startsWith("/expenses")) return "expenses";
        if (pathname.startsWith("/debts")) return "debts";
        if (pathname.startsWith("/wishlist")) return "wishlist";
        return "dashboard";
    };

    // ─── Page title for TopAppBar ────────────────────────────────────────
    const getPageTitle = (): string => {
        if (pathname.startsWith("/dashboard")) return "Dashboard";
        if (pathname.startsWith("/wishlist")) return "Wishlist";
        if (pathname.startsWith("/debts")) return "Debts";
        if (pathname.startsWith("/payments")) return "Payments";
        if (pathname.startsWith("/expenses")) return "Expenses";
        if (pathname.startsWith("/simulation")) return "Simulation";
        if (pathname.startsWith("/profile")) return "Profile";
        return "Priority";
    };

    // ─── Desktop Sidebar ─────────────────────────────────────────────────
    const sidebar = (
        <aside
            className={`
        hidden lg:flex lg:flex-col lg:fixed lg:top-4 lg:left-4 lg:bottom-4
        bg-card border border-border rounded-2xl shadow-lg
        transition-all duration-300 ease-in-out z-40 overflow-hidden
        ${collapsed ? "lg:w-18" : "lg:w-64"}
      `}
        >
            <div className="flex flex-col h-full">
                {/* Header */}
                <div
                    className={`p-4 border-b border-border flex items-center ${collapsed ? "justify-center" : "justify-between"}`}
                >
                    <div
                        className={`flex items-center gap-2 overflow-hidden ${collapsed ? "justify-center" : ""}`}
                    >
                        <img
                            src="/assets/logos/basic_logo_foregound.png"
                            alt="Priority Logo"
                            onClick={collapsed ? toggle : undefined}
                            className={`w-8 h-8 object-contain shrink-0 ${collapsed ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}`}
                        />
                        <h1
                            className={`text-xl font-bold font-raleway text-foreground whitespace-nowrap transition-opacity duration-200 ${collapsed ? "opacity-0 w-0" : "opacity-100"}`}
                        >
                            Priority.
                        </h1>
                    </div>

                    <button
                        onClick={toggle}
                        className={`p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0 ${collapsed ? "hidden" : ""}`}
                        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                </div>

                {/* Nav Links */}
                <nav className="flex-1 p-2 space-y-1 mt-1">
                    {mainNavItems.map((item) => {
                        const Icon = item.icon;
                        const isParentActive = item.children
                            ? item.children.some((child) => isActive(child.href))
                            : item.href
                              ? isActive(item.href)
                              : false;

                        return (
                            <div key={item.label}>
                                <Link
                                    href={item.href || item.defaultChild || "#"}
                                    title={collapsed ? item.label : undefined}
                                    className={`
                    flex items-center gap-3 rounded-lg text-sm font-medium transition-colors
                    ${collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"}
                    ${
                        isParentActive
                            ? item.children
                                ? "bg-primary/5 text-foreground"
                                : "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    }
                  `}
                                >
                                    <Icon className="w-5 h-5 shrink-0" />
                                    <span
                                        className={`whitespace-nowrap transition-opacity duration-200 ${collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"}`}
                                    >
                                        {item.label}
                                    </span>
                                </Link>

                                {!collapsed && item.children && isParentActive && (
                                    <div className="ml-4 mt-1 pl-4 border-l-2 border-primary/20 space-y-1">
                                        {item.children.map((child) => {
                                            const childActive = isActive(child.href);
                                            return (
                                                <Link
                                                    key={child.href}
                                                    href={child.href}
                                                    className={`
                            block px-3 py-1.5 rounded-md text-sm transition-colors
                            ${childActive ? "bg-primary/20 text-primary font-bold" : "text-muted-foreground hover:text-foreground hover:bg-accent"}
                          `}
                                                >
                                                    {child.label}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                {/* Theme Toggle */}
                <div className={`px-2 py-2 ${collapsed ? "flex justify-center" : "px-4"}`}>
                    <ThemeToggle />
                </div>

                {/* User Section */}
                <div
                    className={`p-2 border-t border-border space-y-1 ${collapsed ? "flex flex-col items-center" : "p-4"}`}
                >
                    <Link
                        href="/profile"
                        title={collapsed ? session?.user?.name || "Profile" : undefined}
                        className={`
              flex items-center gap-3 rounded-lg text-sm font-medium transition-colors
              ${collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"}
              ${isActive("/profile") ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent"}
            `}
                    >
                        {session?.user?.image ? (
                            <img
                                src={session.user.image}
                                alt="Avatar"
                                className="w-5 h-5 rounded-full object-cover shrink-0"
                            />
                        ) : (
                            <User className="w-5 h-5 shrink-0" />
                        )}
                        <span
                            className={`truncate whitespace-nowrap transition-opacity duration-200 ${collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"}`}
                        >
                            {session?.user?.name || "Profile"}
                        </span>
                    </Link>

                    <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        title={collapsed ? "Sign Out" : undefined}
                        className={`
              flex items-center gap-3 rounded-lg text-sm font-medium transition-colors w-full
              text-muted-foreground hover:text-destructive hover:bg-accent
              ${collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"}
            `}
                    >
                        <LogOut className="w-5 h-5 shrink-0" />
                        <span
                            className={`whitespace-nowrap transition-opacity duration-200 ${collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"}`}
                        >
                            Sign Out
                        </span>
                    </button>
                </div>
            </div>
        </aside>
    );

    return (
        <>
            {sidebar}

            <BottomNav
                activeRoute={getActiveRoute()}
                onNavigate={(href) => router.push(href)}
            />

            <main className="transition-all duration-300 ease-in-out min-h-screen">
                {/* Mobile: TopAppBar */}
                <div className="lg:hidden">
                    <TopAppBar
                        title={getPageTitle()}
                        userImage={session?.user?.image}
                        onAvatarPress={() => router.push("/profile")}
                    />
                </div>

                {/* Content panel */}
                <div
                    className={`
            lg:m-4 lg:rounded-2xl lg:shadow-lg lg:bg-card lg:border lg:border-border lg:min-h-[calc(100vh-2rem)]
            transition-all duration-300 ease-in-out
            ${collapsed ? "lg:ml-[calc(72px+2rem)]" : "lg:ml-[calc(16rem+2rem)]"}
          `}
                >
                    <div
                        className={`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 lg:pb-8 lg:pt-8 ${hasTabs ? "pt-[108px]" : "pt-[60px]"}`}
                    >
                        {children}
                    </div>
                </div>
            </main>
        </>
    );
}
