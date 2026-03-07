# App Refactor — 5 Sequential AI Agent Prompts

> **How to use:** Run these prompts in order. Each prompt builds on the previous one.
> Pass the output of each step as context when starting the next prompt.

---

## PROMPT 1 — Component Architecture & Decomposition

**Goal:** Define every component the app needs, its single responsibility, its props interface, and the full folder structure. No styling. No layout logic. Just the component map.

---

### Instructions for the agent:

You are refactoring a mobile app into a fully decomposed component architecture. Your job in this step is **only** to define the component structure — not to implement styling, layout, or business logic.

**Rules:**
- Every UI element must be a standalone, single-responsibility component
- No component may handle more than one concern (e.g. a Card does not also handle filtering)
- Every component must be listed with: its name, its responsibility in one sentence, and its props interface
- Group components into categories

**Deliver the following:**

### 1. Folder Structure
Output the complete folder/file tree for all components. Use this structure:
```
src/
  components/
    layout/
    navigation/
    common/
    cards/
    filters/
    dialogs/
    tables/
    states/
  pages/
    dashboard/
    wishlist/
    tracking/
    simulation/
    profile/
```

### 2. Component Catalogue
For each component, output:
```
ComponentName
  Responsibility: [one sentence]
  Props: [list each prop with its type and whether it's required or optional]
  Emits/Callbacks: [list events or callback props]
```

**Required components — at minimum:**

**Layout**
- `TopAppBar` — displays page title and user avatar, no internal logic
- `BottomNavBar` — renders 4 nav items, highlights active one
- `PageTabBar` — renders a horizontal tab row for inner pages
- `PageHeader` — renders page title + one-line description, used on every page
- `ScreenShell` — wraps every screen with TopAppBar, optional PageTabBar, content area, BottomNavBar

**Navigation**
- `NavItem` — single bottom nav destination (icon + label + active state)
- `TabItem` — single tab in a PageTabBar

**Common**
- `AvatarIcon` — shows user image if available, fallback to person icon
- `StatusBadge` — displays a colored status label
- `ActionButton` — primary action button, uniform size
- `IconButtonRound` — circular icon button, uniform 40×40dp touch target
- `SectionTitle` — section heading inside a page

**Cards**
- `CardBase` — base card shell (elevation, radius, padding), no content
- `DashboardCard` — extends CardBase for dashboard items
- `WishlistCard` — extends CardBase for wishlist items
- `TrackingCard` — extends CardBase for tracking items
- `SimulationCard` — extends CardBase for simulation results

**Filters**
- `FilterBar` — horizontal scrollable row of FilterChips
- `FilterChip` — individual selectable/deselectable filter chip

**Dialogs**
- `DialogBase` — base dialog shell (shape, overlay, dismiss logic)
- `ConfirmDialog` — extends DialogBase: title + message + confirm/cancel buttons
- `FormDialog` — extends DialogBase: title + form fields + submit button

**Tables**
- `DataTable` — renders a full table from a data array
- `TableHeader` — renders a single header row
- `TableRow` — renders a single data row

**States**
- `EmptyState` — uniform empty state: icon + title + optional CTA
- `LoadingState` — uniform skeleton or spinner component
- `ErrorState` — uniform error state: icon + message + retry button

### 3. Acceptance Criteria
Before finishing, verify:
- [ ] Every component has exactly one responsibility
- [ ] No props are missing types
- [ ] No component is duplicated under two categories
- [ ] The folder structure matches the component catalogue exactly

---

## PROMPT 2 — M3 Design Token System

**Goal:** Set up the complete Material Design 3 token system — colors, typography, spacing, elevation, and shape — as a single source of truth. All other code will import from here.

---

### Context:
You are working on an app whose component structure was defined in the previous step [paste Prompt 1 output here]. Now create the design token foundation.

### Instructions for the agent:

Create a design token file (e.g. `src/theme/tokens.js` or `theme.dart` depending on the tech stack) that exports all M3 design tokens. **No hardcoded values anywhere else in the app — only imports from this file.**

**Deliver the following:**

### 1. Color Tokens
Define the full M3 color scheme using these token names:
```
primary, onPrimary, primaryContainer, onPrimaryContainer
secondary, onSecondary, secondaryContainer, onSecondaryContainer
tertiary, onTertiary, tertiaryContainer, onTertiaryContainer
error, onError, errorContainer, onErrorContainer
surface, onSurface, surfaceVariant, onSurfaceVariant
outline, outlineVariant
background, onBackground
inverseSurface, inverseOnSurface, inversePrimary
scrim
```
Choose a cohesive color palette. Do not use purple-on-white — pick something distinctive.

### 2. Typography Scale
Define all M3 type roles:
```
displayLarge    57sp / Light
displayMedium   45sp / Light
displaySmall    36sp / Regular
headlineLarge   32sp / Regular
headlineMedium  28sp / Regular   ← page titles
headlineSmall   24sp / Regular
titleLarge      22sp / Regular   ← section titles
titleMedium     16sp / Medium    ← card titles
titleSmall      14sp / Medium
bodyLarge       16sp / Regular
bodyMedium      14sp / Regular   ← body text
bodySmall       12sp / Regular
labelLarge      14sp / Medium
labelMedium     12sp / Medium    ← chips, labels
labelSmall      11sp / Medium
```

### 3. Spacing Constants
```
spacing: {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,    ← screen horizontal padding
  xl: 24,    ← section gap
  xxl: 32,
  xxxl: 48
}
```

### 4. Elevation Levels
Define M3 elevation as surface tint opacity overlays:
```
level0: 0dp   (no tint)
level1: 1dp   (cards)
level2: 3dp   (bottom nav, FAB)
level3: 6dp   (dialogs)
level4: 8dp
level5: 12dp
```

### 5. Shape Scale
```
extraSmall:  4dp corner radius   (chips, small components)
small:       8dp corner radius
medium:      12dp corner radius  (cards)
large:       16dp corner radius
extraLarge:  28dp corner radius  (dialogs, bottom sheets)
full:        999dp               (buttons, avatars)
```

### 6. Component-Specific Tokens
```
topAppBar:        height 64dp, horizontalPadding 16dp
bottomNavBar:     height 80dp
avatar:           size 40dp
actionButton:     height 40dp, minWidth 64dp
iconButton:       size 40dp
cardPadding:      16dp
cardGap:          12dp
screenPadding:    16dp
```

### Acceptance Criteria
- [ ] All tokens are in a single importable file
- [ ] No raw numbers exist anywhere outside this file
- [ ] Typography covers all 15 M3 type roles
- [ ] Color tokens use M3 naming exactly
- [ ] Shape and elevation match M3 specification

---

## PROMPT 3 — Mobile Layout: Top Bar + Bottom Navigation

**Goal:** Build the mobile shell — the TopAppBar and BottomNavBar — that wraps every screen. This is the persistent chrome of the app.

---

### Context:
- Component structure: [paste Prompt 1 output]
- Design tokens: [paste Prompt 2 output]

### Instructions for the agent:

Build the following components using **only** components defined in Prompt 1 and tokens defined in Prompt 2. No new tokens. No inline styles.

---

### 1. `AvatarIcon` Component

Behavior:
- Accepts a `userImage` prop (URL string, nullable)
- If `userImage` exists → render it as a circular image, 40×40dp
- If `userImage` is null → render a person icon inside a filled circle using `primaryContainer` background and `onPrimaryContainer` icon color
- Tapping it calls `onPress` callback (parent handles navigation to Profile)
- Touch target must be minimum 48×48dp (padding around the 40dp visual)

---

### 2. `TopAppBar` Component

Specs:
- Height: 64dp
- Background: `surface` color with elevation level 2 tint
- Left: page title using `titleLarge` typography, `onSurface` color, 16dp from left edge
- Right: `AvatarIcon` component, 16dp from right edge
- Vertically centered content
- Fixed/sticky — does not scroll with content
- Props:
  - `title` (string, required)
  - `userImage` (string | null, required)
  - `onAvatarPress` (function, required)

---

### 3. `NavItem` Component

Specs:
- Icon (24dp) centered above label
- Label: `labelMedium` typography
- Active state: filled icon + active indicator pill (64dp wide, 32dp tall, `secondaryContainer` background) behind the icon
- Inactive state: outlined icon + `onSurfaceVariant` color
- Active label: `onSecondaryContainer` color
- Inactive label: `onSurfaceVariant` color
- Props:
  - `icon` (icon reference)
  - `activeIcon` (icon reference)
  - `label` (string)
  - `isActive` (boolean)
  - `onPress` (function)

---

### 4. `BottomNavBar` Component

Specs:
- Height: 80dp
- Background: `surface` with elevation level 2
- Contains exactly 4 `NavItem` components:
  1. Dashboard — grid/home icon
  2. Wishlist — bookmark/heart icon
  3. Tracking — location/truck icon
  4. Simulation — calculator/chart icon
- Items distributed with equal width
- Props:
  - `activeRoute` (string, required) — one of: `'dashboard'`, `'wishlist'`, `'tracking'`, `'simulation'`
  - `onNavigate` (function, required) — receives route name as argument

---

### 5. `ScreenShell` Component

This is the root wrapper for every screen. It composes:
- `TopAppBar` at the top (fixed)
- Optional `PageTabBar` directly below TopAppBar (fixed, only when `tabs` prop is provided)
- Scrollable content area in the middle (with `screenPadding` horizontal padding, top padding accounts for bar heights)
- `BottomNavBar` at the bottom (fixed)

Props:
- `title` (string, required)
- `userImage` (string | null, required)
- `onAvatarPress` (function, required)
- `activeRoute` (string, required)
- `onNavigate` (function, required)
- `tabs` (array of tab objects | null, optional) — if provided, renders PageTabBar
- `activeTab` (string | null, optional)
- `onTabChange` (function | null, optional)
- `children` (node, required)

---

### Acceptance Criteria
- [ ] Avatar shows image when available, icon when not
- [ ] Avatar tap triggers navigation callback
- [ ] TopAppBar title and avatar are vertically centered
- [ ] BottomNavBar shows exactly 4 items
- [ ] Active nav item has the indicator pill
- [ ] ScreenShell composes all parts correctly
- [ ] No hardcoded colors, sizes, or fonts — only token imports
- [ ] All touch targets minimum 48×48dp

---

## PROMPT 4 — Inner Page Tabs & Page Header

**Goal:** Implement the tabbed sub-navigation system for pages that have inner pages, and enforce a uniform PageHeader on every page.

---

### Context:
- Component structure: [paste Prompt 1 output]
- Design tokens: [paste Prompt 2 output]
- Layout shell: [paste Prompt 3 output]

### Instructions for the agent:

---

### 1. `TabItem` Component

Specs:
- Displays a text label
- Active state: `primary` color label + bottom underline indicator (3dp tall, `primary` color, full width of tab)
- Inactive state: `onSurfaceVariant` color label, no underline
- Label typography: `titleSmall`
- Minimum touch target: 48dp height
- Props:
  - `label` (string, required)
  - `isActive` (boolean, required)
  - `onPress` (function, required)

---

### 2. `PageTabBar` Component

Specs:
- Horizontally scrollable row of `TabItem` components
- Background: `surface` color
- Bottom border: 1dp `outlineVariant` color
- Height: 48dp
- Left padding: 16dp (aligns with screen content)
- Sticky — sits directly below `TopAppBar`, does not scroll with content
- Props:
  - `tabs` (array of `{ key: string, label: string }`, required)
  - `activeTab` (string, required)
  - `onTabChange` (function, required) — receives tab key

---

### 3. `PageHeader` Component

Every single page in the app must start with this component. No exceptions.

Specs:
- Top margin: 8dp below the tab bar (or top bar if no tabs)
- Title: `headlineMedium` typography, `onSurface` color
- Description: `bodyMedium` typography, `onSurfaceVariant` color, rendered on the line below the title
- Bottom margin: 24dp (creates visual separation from page content)
- Props:
  - `title` (string, required)
  - `description` (string, required) — every page must pass this, no empty strings

---

### 4. Define Tabbed Pages

Implement inner tabs for these pages. For each, define the tab keys, labels, and a stub component for each tab's content:

**Dashboard**
- Tabs: `overview` | `analytics` | `reports`

**Tracking**
- Tabs: `active` | `history` | `map`

**Simulation**
- Tabs: `configure` | `results` | `comparison`

Each page must:
1. Use `ScreenShell` with the `tabs` prop populated
2. Render `PageHeader` as the first element inside the content area
3. Render the correct sub-page component based on `activeTab`
4. Persist the active tab in local state

---

### 5. Non-Tabbed Pages

These pages use `ScreenShell` without tabs but still require `PageHeader`:

- **Wishlist** — description: "Items you've saved for later"
- **Profile** — description: "Your account and preferences"

---

### Acceptance Criteria
- [ ] `PageTabBar` is scrollable and sticky below TopAppBar
- [ ] Active tab has underline indicator, inactive tabs do not
- [ ] `PageHeader` appears on every single page
- [ ] Every `PageHeader` has both a title and a non-empty description
- [ ] Dashboard, Tracking, and Simulation have working tab switching
- [ ] Wishlist and Profile have no tabs but have PageHeader
- [ ] No hardcoded colors or sizes — tokens only

---

## PROMPT 5 — Style Consistency Audit & Enforcement

**Goal:** Review the entire built app and enforce uniform styling. Fix every inconsistency. This is a dedicated polish pass.

---

### Context:
- Full codebase from Prompts 1–4: [paste all previous outputs or share the codebase]

### Instructions for the agent:

Go through every component and every page. For each item in the checklist below, identify violations and fix them. Report what you fixed.

---

### Audit Checklist

#### Buttons
- [ ] Every `ActionButton` is exactly 40dp tall — fix any that deviate
- [ ] Every `ActionButton` uses `full` shape (fully rounded) — fix any square or partially rounded buttons
- [ ] All buttons in the same row are vertically centered — fix any misaligned rows
- [ ] No button uses a custom font size — all use `labelLarge` from the token system
- [ ] No button has a custom background color — all use token colors

#### Icons & Touch Targets
- [ ] Every `IconButtonRound` is exactly 40dp visual size with 48dp touch target
- [ ] No icon is larger than 24dp in navigation or smaller than 20dp in cards

#### Page Headers
- [ ] Open every page file — confirm `PageHeader` is the first rendered element inside the content area
- [ ] Confirm every `PageHeader` has a non-empty `description` prop
- [ ] If any page is missing a description, add a concise one now

#### Colors
- [ ] Search the entire codebase for any hardcoded hex values (e.g. `#`, `rgb(`, `Color(0x`) — replace every one with the correct token
- [ ] Search for any hardcoded color names (e.g. `Colors.blue`, `Colors.grey`) — replace with tokens
- [ ] Confirm `surface`, `onSurface`, `primary`, `onPrimary` etc. are used correctly per M3 roles

#### Spacing
- [ ] Every screen has exactly 16dp horizontal padding — no screen has 12dp, 20dp, or 24dp
- [ ] Gap between cards is exactly 12dp everywhere
- [ ] Gap between page sections is exactly 24dp everywhere
- [ ] No component has arbitrary margins that differ from the spacing token scale

#### Typography
- [ ] Page titles use `headlineMedium` — not `headlineLarge` or `titleLarge`
- [ ] Card titles use `titleMedium` — not `bodyLarge` or `titleLarge`
- [ ] Body copy uses `bodyMedium` — not `bodyLarge`
- [ ] No component uses a raw font size number — all use type scale tokens

#### Empty & Loading States
- [ ] Every list, table, or data view has an `EmptyState` component for the zero-items case
- [ ] Every async data fetch shows a `LoadingState` component while waiting
- [ ] `EmptyState` and `LoadingState` look identical across all pages (same component, not page-specific copies)

#### Cards
- [ ] All cards use `CardBase` as their foundation — no card reinvents elevation or radius
- [ ] All cards have exactly 16dp internal padding
- [ ] All cards use `medium` shape (12dp radius)

#### Dialogs
- [ ] All dialogs use `DialogBase` as their foundation
- [ ] All dialogs use `extraLarge` shape (28dp radius)
- [ ] Confirm and cancel buttons inside dialogs are aligned to the right, same height

---

### Deliverable

Output a fix report in this format:
```
FIXED: [component/page name] — [what was wrong] → [what was changed]
```

Then output the corrected code for every file that was changed.

### Acceptance Criteria
- [ ] Zero hardcoded color values remain in the codebase
- [ ] Zero buttons with inconsistent heights or misaligned rows
- [ ] Every page has PageHeader with a description
- [ ] EmptyState and LoadingState used consistently on all data views
- [ ] All spacing matches the token scale exactly
