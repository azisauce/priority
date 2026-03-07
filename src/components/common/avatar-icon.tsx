"use client";

import { User } from "lucide-react";
import { components } from "@/theme/tokens";

interface AvatarIconProps {
    userImage?: string | null;
    onPress?: () => void;
    size?: number;
}

export default function AvatarIcon({
    userImage,
    onPress,
    size = components.avatar.size,
}: AvatarIconProps) {
    return (
        <button
            onClick={onPress}
            className="flex items-center justify-center shrink-0"
            style={{
                width: `${components.iconButton.touchTarget}px`,
                height: `${components.iconButton.touchTarget}px`,
            }}
            aria-label="User avatar"
        >
            {userImage ? (
                <img
                    src={userImage}
                    alt="User avatar"
                    className="rounded-full object-cover"
                    style={{ width: `${size}px`, height: `${size}px` }}
                />
            ) : (
                <div
                    className="rounded-full flex items-center justify-center"
                    style={{
                        width: `${size}px`,
                        height: `${size}px`,
                        backgroundColor: "rgb(var(--m3-primary-container))",
                        color: "rgb(var(--m3-on-primary-container))",
                    }}
                >
                    <User style={{ width: `${size * 0.5}px`, height: `${size * 0.5}px` }} />
                </div>
            )}
        </button>
    );
}
