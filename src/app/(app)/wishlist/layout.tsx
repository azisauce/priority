"use client";

import { usePathname, useRouter } from "next/navigation";
import TabStrip from "@/components/layout/TabStrip";

const tabs = [
    { key: "/wishlist/items", label: "Items" },
    { key: "/wishlist/groups", label: "Groups" },
    { key: "/wishlist/parameters", label: "Parameters" },
];

export default function WishlistLayout({ children }: { children: React.ReactNode }) {
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
