"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "@/components/theme-provider";
import { useSidebar } from "@/components/sidebar-provider";
import {
  LayoutDashboard,
  Package,
  FolderOpen,
  Calculator,
  SlidersHorizontal,
  CreditCard,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  X,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/items", label: "Items", icon: Package },
  { href: "/groups", label: "Groups", icon: FolderOpen },
  { href: "/debts", label: "Debts", icon: CreditCard },
  { href: "/priority-params", label: "Params", icon: SlidersHorizontal },
  { href: "/simulation", label: "Simulation", icon: Calculator },
];

export default function Navigation() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme } = useTheme();
  const { collapsed, toggle } = useSidebar();
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  // ─── Desktop Sidebar ────────────────────────────────────────────────
  const desktopSidebar = (
    <aside
      className={`
        hidden lg:flex lg:flex-col lg:fixed lg:top-4 lg:left-4 lg:bottom-4
        bg-card border border-border rounded-2xl shadow-lg
        transition-all duration-300 ease-in-out z-40 overflow-hidden
        ${collapsed ? "lg:w-[72px]" : "lg:w-64"}
      `}
    >
      <div className="flex flex-col h-full">
        {/* Header — logo + collapse toggle */}
        <div className={`p-4 border-b border-border flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
          <div className={`flex items-center gap-2 overflow-hidden ${collapsed ? "justify-center" : ""}`}>
            <img
              src={
                theme === "dark"
                  ? "/assets/logos/basic_logo_light_azure.png"
                  : "/assets/logos/basic_logo_deep_navy.png"
              }
              alt="Priority Logo"
              className="w-8 h-8 object-contain shrink-0"
            />
            <h1
              className={`text-xl font-bold font-raleway text-foreground whitespace-nowrap transition-opacity duration-200 ${collapsed ? "opacity-0 w-0" : "opacity-100"
                }`}
            >
              Priority.
            </h1>
          </div>

          <button
            onClick={toggle}
            className={`p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0 ${collapsed ? "hidden" : ""
              }`}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Expand button when collapsed — shown below header */}
        {collapsed && (
          <button
            onClick={toggle}
            className="mx-auto mt-2 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="Expand sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* Nav Links */}
        <nav className="flex-1 p-2 space-y-1 mt-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                title={collapsed ? link.label : undefined}
                className={`
                  flex items-center gap-3 rounded-lg text-sm font-medium transition-colors
                  ${collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"}
                  ${active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }
                `}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span
                  className={`whitespace-nowrap transition-opacity duration-200 ${collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
                    }`}
                >
                  {link.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Theme Toggle */}
        <div className={`px-2 py-2 ${collapsed ? "flex justify-center" : "px-4"}`}>
          <ThemeToggle />
        </div>

        {/* User Section */}
        <div className={`p-2 border-t border-border space-y-1 ${collapsed ? "flex flex-col items-center" : "p-4"}`}>
          <Link
            href="/profile"
            title={collapsed ? session?.user?.name || "Profile" : undefined}
            className={`
              flex items-center gap-3 rounded-lg text-sm font-medium transition-colors
              ${collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"}
              ${isActive("/profile")
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }
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
              className={`truncate whitespace-nowrap transition-opacity duration-200 ${collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
                }`}
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
              className={`whitespace-nowrap transition-opacity duration-200 ${collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
                }`}
            >
              Sign Out
            </span>
          </button>
        </div>
      </div>
    </aside>
  );

  // ─── Mobile Bottom Tab Bar ──────────────────────────────────────────
  const mobileTabBar = (
    <>
      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-card border-t border-border">
        <div className="flex items-center justify-around px-1 py-1.5 safe-bottom">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`
                  flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors min-w-0
                  ${active
                    ? "text-primary"
                    : "text-muted-foreground"
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="truncate text-[10px]">{link.label}</span>
              </Link>
            );
          })}

          {/* More button for extra actions */}
          <button
            onClick={() => setMobileMoreOpen(!mobileMoreOpen)}
            className={`
              flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors min-w-0
              ${mobileMoreOpen ? "text-primary" : "text-muted-foreground"}
            `}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px]">More</span>
          </button>
        </div>
      </nav>

      {/* Mobile "More" Sheet */}
      {mobileMoreOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40 lg:hidden"
            onClick={() => setMobileMoreOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-[60] lg:hidden bg-card border-t border-border rounded-t-2xl px-4 pt-4 pb-8 space-y-2 animate-slide-up">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-foreground">More</span>
              <button
                onClick={() => setMobileMoreOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Theme</span>
              <ThemeToggle />
            </div>

            <Link
              href="/profile"
              onClick={() => setMobileMoreOpen(false)}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${isActive("/profile")
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }
              `}
            >
              {session?.user?.image ? (
                <img
                  src={session.user.image}
                  alt="Avatar"
                  className="w-5 h-5 rounded-full object-cover"
                />
              ) : (
                <User className="w-5 h-5" />
              )}
              <span className="truncate">{session?.user?.name || "Profile"}</span>
            </Link>

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-accent transition-colors w-full"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </>
      )}
    </>
  );

  return (
    <>
      {desktopSidebar}
      {mobileTabBar}
    </>
  );
}
