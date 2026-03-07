/**
 * M3 Design Token System — Single Source of Truth
 *
 * Every color, font size, spacing value, elevation, and shape constant
 * used throughout the app MUST be imported from this file.
 * No hardcoded values anywhere else.
 */

/* ─── Color Tokens ─────────────────────────────────────────────────── */

export const colors = {
    light: {
        primary: "0 127 255",            // #007FFF — vibrant azure
        onPrimary: "255 255 255",
        primaryContainer: "220 235 255", // #DCEBFF
        onPrimaryContainer: "0 60 140",  // #003C8C

        secondary: "80 115 150",         // #507396 — slate blue
        onSecondary: "255 255 255",
        secondaryContainer: "230 240 250", // #E6F0FA
        onSecondaryContainer: "20 50 80", // #143250

        tertiary: "255 107 107",         // #FF6B6B — coral
        onTertiary: "255 255 255",
        tertiaryContainer: "255 235 235", // #FFEBEB
        onTertiaryContainer: "100 20 20", // #641414

        error: "186 26 26",             // #BA1A1A
        onError: "255 255 255",
        errorContainer: "255 218 214",   // #FFDAD6
        onErrorContainer: "65 0 2",      // #410002

        surface: "250 252 255",          // #FAFCFF — near-white blue
        onSurface: "10 37 64",           // #0A2540
        surfaceVariant: "230 235 245",   // #E6EBF5
        onSurfaceVariant: "68 85 110",   // #44556E

        outline: "140 165 195",          // #8CA5C3
        outlineVariant: "195 210 230",   // #C3D2E6

        background: "230 242 255",       // #E6F2FF
        onBackground: "10 37 64",        // #0A2540

        inverseSurface: "10 37 64",      // #0A2540
        inverseOnSurface: "230 242 255", // #E6F2FF
        inversePrimary: "130 195 255",   // #82C3FF

        scrim: "0 0 0",
    },
    dark: {
        primary: "130 195 255",          // #82C3FF — soft azure
        onPrimary: "0 50 110",           // #00326E
        primaryContainer: "0 75 155",    // #004B9B
        onPrimaryContainer: "200 225 255", // #C8E1FF

        secondary: "180 200 225",        // #B4C8E1
        onSecondary: "20 45 75",         // #142D4B
        secondaryContainer: "35 60 90",  // #233C5A
        onSecondaryContainer: "210 225 245", // #D2E1F5

        tertiary: "255 180 171",         // #FFB4AB
        onTertiary: "100 20 20",         // #641414
        tertiaryContainer: "130 30 30",  // #821E1E
        onTertiaryContainer: "255 218 214", // #FFDAD6

        error: "255 180 171",           // #FFB4AB
        onError: "105 0 5",             // #690005
        errorContainer: "147 0 10",      // #93000A
        onErrorContainer: "255 218 214", // #FFDAD6

        surface: "15 25 40",            // #0F1928
        onSurface: "220 230 245",       // #DCE6F5
        surfaceVariant: "35 50 70",     // #233246
        onSurfaceVariant: "185 200 220", // #B9C8DC

        outline: "120 140 170",         // #788CAA
        outlineVariant: "50 65 85",     // #324155

        background: "5 18 35",          // #051223
        onBackground: "220 235 255",    // #DCEBFF

        inverseSurface: "220 230 245",  // #DCE6F5
        inverseOnSurface: "30 42 58",   // #1E2A3A
        inversePrimary: "0 100 200",    // #0064C8

        scrim: "0 0 0",
    },
} as const;

/* ─── Typography Scale ─────────────────────────────────────────────── */

export const typography = {
    displayLarge: { size: 57, lineHeight: 64, weight: 300, letterSpacing: -0.25 },
    displayMedium: { size: 45, lineHeight: 52, weight: 300, letterSpacing: 0 },
    displaySmall: { size: 36, lineHeight: 44, weight: 400, letterSpacing: 0 },

    headlineLarge: { size: 32, lineHeight: 40, weight: 400, letterSpacing: 0 },
    headlineMedium: { size: 28, lineHeight: 36, weight: 400, letterSpacing: 0 },  // page titles
    headlineSmall: { size: 24, lineHeight: 32, weight: 400, letterSpacing: 0 },

    titleLarge: { size: 22, lineHeight: 28, weight: 400, letterSpacing: 0 },     // section titles
    titleMedium: { size: 16, lineHeight: 24, weight: 500, letterSpacing: 0.15 },  // card titles
    titleSmall: { size: 14, lineHeight: 20, weight: 500, letterSpacing: 0.1 },

    bodyLarge: { size: 16, lineHeight: 24, weight: 400, letterSpacing: 0.5 },
    bodyMedium: { size: 14, lineHeight: 20, weight: 400, letterSpacing: 0.25 },   // body text
    bodySmall: { size: 12, lineHeight: 16, weight: 400, letterSpacing: 0.4 },

    labelLarge: { size: 14, lineHeight: 20, weight: 500, letterSpacing: 0.1 },
    labelMedium: { size: 12, lineHeight: 16, weight: 500, letterSpacing: 0.5 },   // chips, labels
    labelSmall: { size: 11, lineHeight: 16, weight: 500, letterSpacing: 0.5 },
} as const;

/* ─── Spacing ──────────────────────────────────────────────────────── */

export const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,   // screen horizontal padding
    xl: 24,   // section gap
    xxl: 32,
    xxxl: 48,
} as const;

/* ─── Elevation Levels ─────────────────────────────────────────────── */

export const elevation = {
    level0: { dp: 0, shadowOpacity: 0 },
    level1: { dp: 1, shadowOpacity: 0.05 },  // cards
    level2: { dp: 3, shadowOpacity: 0.08 },  // bottom nav, FAB
    level3: { dp: 6, shadowOpacity: 0.11 },  // dialogs
    level4: { dp: 8, shadowOpacity: 0.13 },
    level5: { dp: 12, shadowOpacity: 0.15 },
} as const;

/* ─── Shape Scale ──────────────────────────────────────────────────── */

export const shape = {
    extraSmall: 4,   // chips, small components
    small: 8,
    medium: 12,  // cards
    large: 16,
    extraLarge: 28,  // dialogs, bottom sheets
    full: 9999, // buttons, avatars
} as const;

/* ─── Component-Specific Tokens ────────────────────────────────────── */

export const components = {
    topAppBar: {
        height: 60,
        horizontalPadding: 16,
    },
    bottomNavBar: {
        height: 80,
    },
    avatar: {
        size: 40,
    },
    actionButton: {
        height: 40,
        minWidth: 64,
    },
    iconButton: {
        size: 40,
        touchTarget: 48,
    },
    card: {
        padding: 16,
        gap: 12,
    },
    screen: {
        padding: 16,
    },
    navIndicator: {
        width: 64,
        height: 32,
    },
    tabBar: {
        height: 48,
    },
    pageHeader: {
        topMargin: 8,
        bottomMargin: 24,
    },
} as const;

/* ─── Utility: CSS Variable Name Generator ─────────────────────────── */

/**
 * Returns M3 color token as `rgb(var(--m3-<token>))` for use in Tailwind arbitrary values.
 */
export function m3Color(token: keyof typeof colors.light): string {
    return `rgb(var(--m3-${camelToKebab(token)}))`;
}

function camelToKebab(str: string): string {
    return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

/**
 * Generate CSS custom property declarations for a color scheme.
 */
export function generateCSSVars(scheme: "light" | "dark"): Record<string, string> {
    const palette = colors[scheme];
    const vars: Record<string, string> = {};
    for (const [key, value] of Object.entries(palette)) {
        vars[`--m3-${camelToKebab(key)}`] = value;
    }
    return vars;
}
