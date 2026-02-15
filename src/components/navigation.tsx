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
  User,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/items", label: "Items", icon: Package },
  { href: "/groups", label: "Groups", icon: FolderOpen },
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
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-gray-100">Priority.</h1>
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
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-blue-600/10 text-blue-400"
                  : "text-gray-400 hover:text-gray-100 hover:bg-gray-800"
              }`}
            >
              <Icon className="w-5 h-5" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-800 space-y-2">
        <Link
          href="/profile"
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            isActive("/profile")
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
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-gray-800 transition-colors w-full"
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
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-gray-900 border border-gray-800 text-gray-400 hover:text-gray-100 lg:hidden"
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
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 border-r border-gray-800 transform transition-transform duration-200 lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Sidebar - desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 bg-gray-900 border-r border-gray-800">
        {sidebarContent}
      </aside>
    </>
  );
}
