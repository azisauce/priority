import {
    LayoutDashboard,
    Package,
    Calculator,
    CreditCard,
    Wallet,
    Receipt,
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
        label: "Payments",
        icon: Wallet,
        children: [
            { href: "/payments/overview", label: "Overview" },
            { href: "/payments/history", label: "History" },
        ],
        defaultChild: "/payments/overview",
    },
    {
        label: "Expenses",
        icon: Receipt,
        children: [
            { href: "/expenses/daily", label: "Daily" },
            { href: "/expenses/budgets", label: "Budgets" },
        ],
        defaultChild: "/expenses/daily",
    },
    {
        label: "Debts",
        icon: CreditCard,
        children: [
            { href: "/debts/summary", label: "Summary" },
            { href: "/debts/counterparties", label: "Counterparties" },
            { href: "/debts/entries", label: "Entries" },
        ],
        defaultChild: "/debts/summary",
    },
    {
        label: "Wishlist",
        icon: Package,
        children: [
            { href: "/wishlist/items", label: "Items" },
            { href: "/wishlist/groups", label: "Groups" },
            { href: "/wishlist/parameters", label: "Parameters" },
        ],
        defaultChild: "/wishlist/items",
    },
    { href: "/simulation", label: "Simulation", icon: Calculator },
];
