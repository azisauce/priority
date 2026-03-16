"use client";

import { components } from "@/theme/tokens";
import NavItem from "@/components/navigation/nav-item";
import {
    LayoutDashboard,
    Wallet,
    Receipt,
    CreditCard,
    Package,
} from "lucide-react";

interface BottomNavProps {
    activeRoute: string;
    onNavigate: (route: string) => void;
}

const navItems = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { key: "payments", label: "Payments", icon: Wallet, href: "/payments/overview" },
    { key: "expenses", label: "Expenses", icon: Receipt, href: "/expenses/daily" },
    { key: "debts", label: "Debts", icon: CreditCard, href: "/debts/entries" },
    { key: "wishlist", label: "Wishlist", icon: Package, href: "/wishlist/items" },
];

export default function BottomNav({ activeRoute, onNavigate }: BottomNavProps) {
    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-50 lg:hidden safe-bottom"
            style={{
                height: `${components.bottomNavBar.height}px`,
                backgroundColor: "rgb(var(--m3-surface))",
                borderTop: "1px solid rgb(var(--m3-outline-variant) / 0.3)",
                boxShadow: "0 -1px 8px rgb(var(--m3-scrim) / 0.08)",
            }}
        >
            <div className="flex items-stretch h-full">
                {navItems.map((item) => (
                    <NavItem
                        key={item.key}
                        icon={item.icon}
                        label={item.label}
                        isActive={activeRoute === item.key}
                        onPress={() => onNavigate(item.href)}
                    />
                ))}
            </div>
        </nav>
    );
}
