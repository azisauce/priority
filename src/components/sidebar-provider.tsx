"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

interface SidebarContextType {
    collapsed: boolean;
    toggle: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
    collapsed: false,
    toggle: () => null,
});

const STORAGE_KEY = "priority-sidebar-collapsed";

export function SidebarProvider({ children }: { children: React.ReactNode }) {
    const [collapsed, setCollapsed] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === "true") {
            setCollapsed(true);
        }
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        localStorage.setItem(STORAGE_KEY, String(collapsed));
    }, [collapsed, mounted]);

    const toggle = useCallback(() => {
        setCollapsed((prev) => !prev);
    }, []);

    return (
        <SidebarContext.Provider value={{ collapsed, toggle }}>
            {children}
        </SidebarContext.Provider>
    );
}

export const useSidebar = () => {
    const context = useContext(SidebarContext);
    if (context === undefined) {
        throw new Error("useSidebar must be used within a SidebarProvider");
    }
    return context;
};
