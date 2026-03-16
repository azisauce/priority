"use client";

import PageTabBar from "@/components/navigation/page-tab-bar";

interface Tab {
    key: string;
    label: string;
}

interface TabStripProps {
    tabs: Tab[];
    activeTab: string;
    onTabChange: (key: string) => void;
}

export default function TabStrip({ tabs, activeTab, onTabChange }: TabStripProps) {
    return (
        <PageTabBar
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={onTabChange}
        />
    );
}
