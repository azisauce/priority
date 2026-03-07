"use client";

import { components } from "@/theme/tokens";
import NavItem from "./nav-item";
import {
    LayoutDashboard,
    Package,
    CreditCard,
    Calculator,
} from "lucide-react";

interface BottomNavBarProps {
    activeRoute: string;
    onNavigate: (route: string) => void;
}

const navItems = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { key: "wishlist", label: "Wishlist", icon: Package, href: "/items" },
    { key: "tracking", label: "Tracking", icon: CreditCard, href: "/debts" },
    { key: "simulation", label: "Simulation", icon: Calculator, href: "/simulation" },
];

export default function BottomNavBar({
    activeRoute,
    onNavigate,
}: BottomNavBarProps) {
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
