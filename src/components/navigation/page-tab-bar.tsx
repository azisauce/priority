"use client";

import { useEffect, useRef, useState } from "react";
import { components } from "@/theme/tokens";

interface Tab {
    key: string;
    label: string;
}

interface PageTabBarProps {
    tabs: Tab[];
    activeTab: string;
    onTabChange: (key: string) => void;
}

export default function PageTabBar({ tabs, activeTab, onTabChange }: PageTabBarProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
    const [isVisible, setIsVisible] = useState(true);
    const lastScrollY = useRef(0);

    // Handle scroll to hide/show tab bar
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY > lastScrollY.current && currentScrollY > 60) {
                // Scrolling down past the header height -> hide
                setIsVisible(false);
            } else if (currentScrollY < lastScrollY.current) {
                // Scrolling up -> show
                setIsVisible(true);
            }
            lastScrollY.current = currentScrollY;
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Update indicator position whenever activeTab changes
    useEffect(() => {
        const activeIdx = tabs.findIndex((t) => t.key === activeTab);
        const btn = tabRefs.current[activeIdx];
        const container = containerRef.current;
        if (!btn || !container) return;

        const containerRect = container.getBoundingClientRect();
        const btnRect = btn.getBoundingClientRect();

        setIndicatorStyle({
            left: btnRect.left - containerRect.left + container.scrollLeft,
            width: btnRect.width,
        });
    }, [activeTab, tabs]);

    return (
        <div
            className={`fixed left-0 right-0 z-[999] transition-transform duration-300 ease-in-out`}
            style={{
                top: `${components.topAppBar.height}px`,
                backgroundColor: "rgb(var(--m3-surface))",
                borderBottom: "1px solid rgb(var(--m3-outline-variant) / 0.4)",
                transform: isVisible ? "translateY(0)" : "translateY(-100%)",
            }}
        >
            <div
                ref={containerRef}
                className="flex overflow-x-auto scrollbar-hide"
                style={{
                    height: `${components.tabBar.height}px`,
                    paddingLeft: `${components.screen.padding}px`,
                    position: "relative",
                }}
            >
                {tabs.map((tab, idx) => {
                    const isActive = tab.key === activeTab;
                    return (
                        <button
                            key={tab.key}
                            ref={(el) => { tabRefs.current[idx] = el; }}
                            onClick={() => onTabChange(tab.key)}
                            className="shrink-0 relative"
                            style={{
                                height: "100%",
                                padding: "0 16px",
                                background: "transparent",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "14px",
                                fontWeight: isActive ? 600 : 400,
                                letterSpacing: "0.1px",
                                color: isActive
                                    ? "rgb(var(--m3-primary))"
                                    : "rgb(var(--m3-on-surface-variant))",
                                transition: "color 200ms ease, font-weight 200ms ease",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {tab.label}
                        </button>
                    );
                })}

                {/* Sliding indicator */}
                <div
                    style={{
                        position: "absolute",
                        bottom: 0,
                        left: `${indicatorStyle.left}px`,
                        width: `${indicatorStyle.width}px`,
                        height: "3px",
                        backgroundColor: "rgb(var(--m3-primary))",
                        borderRadius: "3px 3px 0 0",
                        transition: "left 250ms cubic-bezier(0.4, 0, 0.2, 1), width 250ms cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                />
            </div>
        </div>
    );
}
