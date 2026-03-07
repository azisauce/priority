"use client";

import { components } from "@/theme/tokens";
import AvatarIcon from "../common/avatar-icon";

interface TopAppBarProps {
    title: string;
    userImage?: string | null;
    onAvatarPress?: () => void;
}

export default function TopAppBar({
    title,
    userImage,
    onAvatarPress,
}: TopAppBarProps) {
    return (
        <header
            className="fixed top-0 left-0 right-0 z-[1000] flex items-center justify-between lg:hidden"
            style={{
                height: `${components.topAppBar.height}px`,
                paddingLeft: `${components.topAppBar.horizontalPadding}px`,
                paddingRight: `${components.topAppBar.horizontalPadding}px`,
                backgroundColor: "rgb(var(--m3-surface))",
            }}
        >
            <h1
                style={{
                    fontSize: "24px",
                    lineHeight: "32px",
                    fontWeight: 700,
                    color: "rgb(var(--m3-on-surface))",
                    margin: 0,
                    letterSpacing: "-0.3px",
                }}
            >
                {title}
            </h1>
            <AvatarIcon userImage={userImage} onPress={onAvatarPress} />
        </header>
    );
}
