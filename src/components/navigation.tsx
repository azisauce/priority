"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Package,
  FolderOpen,
  Calculator,
  SlidersHorizontal,
  User,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/items", label: "Items", icon: Package },
  { href: "/groups", label: "Groups", icon: FolderOpen },
  { href: "/priority-params", label: "Params", icon: SlidersHorizontal },
  { href: "/simulation", label: "Simulation", icon: Calculator },
];

export default function Navigation() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* App Title */}
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-bold text-foreground">Priority.</h1>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 p-4 space-y-1">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const active = isActive(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
            >
              <Icon className="w-5 h-5" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Theme Toggle */}
      <div className="px-4 py-2">
        <ThemeToggle />
      </div>

      {/* User Section */}
      <div className="p-4 border-t border-border space-y-2">
        <Link
          href="/profile"
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive("/profile")
            ? "bg-blue-600/10 text-blue-400"
            : "text-gray-400 hover:text-gray-100 hover:bg-gray-800"
            }`}
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
          <span className="truncate">
            {session?.user?.name || "Profile"}
          </span>
        </Link>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-accent transition-colors w-full"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-card border border-border text-muted-foreground hover:text-foreground lg:hidden"
        aria-label="Toggle navigation"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - mobile */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transform transition-transform duration-200 lg:hidden ${mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        {sidebarContent}
      </aside>

      {/* Sidebar - desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 bg-card border-r border-border">
        {sidebarContent}
      </aside>
    </>
  );
}
