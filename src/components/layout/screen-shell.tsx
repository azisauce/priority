"use client";

import TopAppBar from "./top-app-bar";
import PageTabBar from "../navigation/page-tab-bar";
import { components } from "@/theme/tokens";

interface Tab {
    key: string;
    label: string;
}

interface ScreenShellProps {
    title: string;
    userImage?: string | null;
    onAvatarPress?: () => void;
    tabs?: Tab[] | null;
    activeTab?: string | null;
    onTabChange?: ((key: string) => void) | null;
    children: React.ReactNode;
}

export default function ScreenShell({
    title,
    userImage,
    onAvatarPress,
    tabs,
    activeTab,
    onTabChange,
    children,
}: ScreenShellProps) {
    return (
        <div className="flex flex-col min-h-screen lg:min-h-0">
            {/* Mobile top app bar */}
            <TopAppBar
                title={title}
                userImage={userImage}
                onAvatarPress={onAvatarPress}
            />

            {/* Optional tab bar */}
            {tabs && activeTab && onTabChange && (
                <div className="lg:hidden">
                    <PageTabBar
                        tabs={tabs}
                        activeTab={activeTab}
                        onTabChange={onTabChange}
                    />
                </div>
            )}

            {/* Content area */}
            <div
                className="flex-1"
                style={{
                    paddingLeft: `${components.screen.padding}px`,
                    paddingRight: `${components.screen.padding}px`,
                    paddingTop: `${(tabs && activeTab && onTabChange) ? 108 : 60}px`,
                    paddingBottom: `${components.bottomNavBar.height + 16}px`,
                }}
            >
                {children}
            </div>
        </div>
    );
}
