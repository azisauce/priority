import {
    LayoutDashboard,
    Package,
    Calculator,
    CreditCard,
    User,
    type LucideIcon,
} from "lucide-react";

export interface NavLeaf {
    href: string;
    label: string;
    icon: LucideIcon;
    children?: undefined;
    defaultChild?: undefined;
}

export interface NavParent {
    label: string;
    icon: LucideIcon;
    children: { href: string; label: string }[];
    defaultChild: string;
    href?: undefined;
}

export type NavItem = NavLeaf | NavParent;

export const mainNavItems: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    {
        label: "Wishlist",
        icon: Package,
        children: [
            { href: "/groups", label: "Groups" },
            { href: "/items", label: "Items" },
            { href: "/priority-params", label: "Params" },
        ],
        defaultChild: "/items",
    },
    {
        label: "Tracking",
        icon: CreditCard,
        children: [
            { href: "/debts", label: "Debts" },
        ],
        defaultChild: "/debts",
    },
    { href: "/simulation", label: "Simulation", icon: Calculator },
    { href: "/profile", label: "Profile", icon: User },
];
