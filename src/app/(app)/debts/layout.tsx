"use client";

import { usePathname, useRouter } from "next/navigation";
import TabStrip from "@/components/layout/TabStrip";

const tabs = [
    { key: "/debts/summary", label: "Summary" },
    { key: "/debts/counterparties", label: "Counterparties" },
    { key: "/debts/entries", label: "Entries" },
];

export default function DebtsLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();

    const activeTab =
        tabs.find((t) => pathname === t.key || pathname.startsWith(t.key + "/"))?.key ??
        tabs[0].key;

    return (
        <>
            <TabStrip
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={(key) => router.push(key)}
            />
            {children}
        </>
    );
}
