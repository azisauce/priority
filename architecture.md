# Priority — Architecture Documentation

## Overview

**Priority** is a purchase prioritization application built with Next.js 16. It helps users evaluate potential purchases by assigning weighted priority scores through configurable parameters and answer options. Users organize items into groups, each with assigned priority parameters, then score items against those parameters to compute a weighted priority. A "value score" metric (priority^5 / price) helps identify the best-value purchases.

---

## Tech Stack

| Layer        | Technology                        |
| ------------ | --------------------------------- |
| Framework    | Next.js 16.1.6 (App Router)      |
| Language     | TypeScript 5                      |
| Auth         | NextAuth v4 (Credentials)        |
| Database     | PostgreSQL via Knex.js 3          |
| Styling      | Tailwind CSS v4 (CSS vars theme)  |
| Validation   | Zod v4                           |
| Icons        | lucide-react                      |
| Runtime      | Node.js / React 19               |

---

## Directory Structure

```
/
├── db/
│   ├── migrations/                  # Knex migration files (10 migrations)
│   │   ├── 20260216000000_create_tables.ts
│   │   ├── 20260216010000_normalize_user_ids_to_uuid.ts
│   │   ├── 20260216020000_make_user_id_nullable_except_items_groups.ts
│   │   ├── 20260217000000_set_users_id_default.ts
│   │   ├── 20260219000000_create_item_priority_judgment_items.ts
│   │   ├── 20260220000000_add_is_done_to_items.ts
│   │   ├── 20260222000000_add_ease_fields_to_items.ts
│   │   ├── 20260304000000_create_debts_and_payment_entries.ts
│   │   ├── 20260308000000_add_type_to_debts.ts
│   │   └── 20260315151941_create_counterparties.ts
│   └── seeds/
│       └── 01_priority_and_judgment_items.ts  # Generic params/options
├── public/                          # Static assets
├── scripts/
│   └── generate-icons.mjs           # Icon generation script
├── src/
│   ├── middleware.ts                 # NextAuth route protection
│   ├── app/
│   │   ├── globals.css              # Theme CSS variables (light/dark)
│   │   ├── layout.tsx               # Root layout with SessionProvider + ThemeProvider
│   │   ├── manifest.ts              # Web app manifest
│   │   ├── page.tsx                 # Landing page (redirects to /dashboard if authenticated)
│   │   ├── login/                   # Login page
│   │   ├── register/                # Registration page
│   │   ├── (authenticated)/         # Route group — all protected pages
│   │   │   ├── layout.tsx           # Sidebar navigation layout
│   │   │   ├── layout-shell.tsx     # Shell wrapper for authenticated layout
│   │   │   ├── counterparties/      # Counterparty management page
│   │   │   ├── dashboard/           # Dashboard with aggregated stats
│   │   │   ├── groups/              # Groups listing + detail views
│   │   │   │   └── [id]/            # Group detail page
│   │   │   ├── items/               # Items listing with filters/sort
│   │   │   ├── priority-params/     # Priority parameters + eval items management
│   │   │   ├── profile/             # User profile editing
│   │   │   ├── simulation/          # Priority simulation sandbox
│   │   │   └── tracking/            # Debt/asset tracking
│   │   │       ├── page.tsx         # Tracking overview
│   │   │       └── balance/         # Balance detail views
│   │   │           └── [id]/        # Individual debt/asset balance page
│   │   └── api/                     # API routes (REST)
│   │       ├── auth/                # NextAuth + registration
│   │       ├── counterparties/      # CRUD for counterparties + summary/records
│   │       │   ├── [id]/
│   │       │   │   └── records/     # Counterparty transaction records
│   │       │   └── summary/         # Counterparty balance summary
│   │       ├── dashboard/           # Aggregated stats endpoint
│   │       ├── debts/               # CRUD for debts/assets
│   │       │   └── [id]/
│   │       │       └── payments/    # Payment entry CRUD
│   │       │           └── [paymentId]/
│   │       ├── eval-items/          # CRUD for judgment/answer items
│   │       ├── groups/              # CRUD for groups + param assignment
│   │       │   └── [id]/
│   │       │       └── params/      # Group priority param assignment
│   │       ├── items/               # CRUD for items
│   │       ├── priority-params/     # CRUD for priority parameters + eval item assignment
│   │       │   └── [id]/
│   │       │       └── eval-items/  # Eval items assigned to a priority param
│   │       ├── profile/             # User profile management
│   │       ├── simulation/          # Simulation computation
│   │       └── upload/
│   │           └── avatar/          # Avatar image upload
│   ├── components/
│   │   ├── navigation.tsx           # Sidebar navigation component
│   │   ├── theme-provider.tsx       # Dark/light mode context provider
│   │   ├── theme-toggle.tsx         # Theme switch button
│   │   ├── item-modal.tsx           # Item create/edit modal
│   │   ├── items-filter.tsx         # Items filter bar
│   │   ├── sidebar-provider.tsx     # Sidebar collapse context
│   │   ├── cards/
│   │   │   ├── card-base.tsx
│   │   │   ├── dashboard-card.tsx
│   │   │   ├── simulation-card.tsx
│   │   │   ├── tracking-card.tsx
│   │   │   └── wishlist-card.tsx
│   │   ├── common/
│   │   │   ├── action-button.tsx
│   │   │   ├── avatar-icon.tsx
│   │   │   ├── icon-button-round.tsx
│   │   │   ├── section-title.tsx
│   │   │   └── status-badge.tsx
│   │   ├── dialogs/
│   │   │   ├── confirm-dialog.tsx
│   │   │   ├── dialog-base.tsx
│   │   │   └── form-dialog.tsx
│   │   ├── filters/
│   │   │   ├── filter-bar.tsx
│   │   │   └── filter-chip.tsx
│   │   ├── layout/
│   │   │   ├── page-header.tsx
│   │   │   ├── screen-shell.tsx
│   │   │   └── top-app-bar.tsx
│   │   ├── navigation/
│   │   │   ├── bottom-nav-bar.tsx
│   │   │   ├── nav-item.tsx
│   │   │   ├── page-tab-bar.tsx
│   │   │   └── tab-item.tsx
│   │   ├── providers/
│   │   │   └── session-provider.tsx # NextAuth SessionProvider wrapper
│   │   ├── states/
│   │   │   ├── empty-state.tsx
│   │   │   ├── error-state.tsx
│   │   │   └── loading-state.tsx
│   │   ├── tables/
│   │   │   └── data-table.tsx
│   │   └── tracking/
│   │       └── balance-filters.tsx
│   ├── lib/
│   │   ├── auth.ts                  # NextAuth configuration (credentials, JWT, callbacks)
│   │   ├── db.ts                    # Knex database connection
│   │   ├── debt-utils.ts            # Debt/asset calculation utilities
│   │   ├── nav-items.ts             # Navigation item definitions
│   │   └── priority.ts             # Priority calculation utility (weighted average)
│   ├── theme/
│   │   └── tokens.ts               # Design token definitions
│   └── types/
│       ├── next-auth.d.ts           # NextAuth type augmentation (adds user.id)
│       └── tracking.ts             # Tracking/debt type definitions
├── copy_debts_to_assets.js          # One-off data migration utility
├── knexfile.ts                      # Knex DB connection config
├── next.config.ts                   # Next.js configuration
├── tsconfig.json                    # TypeScript config
└── package.json
```

---

## Database Schema

### Entity Relationship

```
users (1) ──< groups (1) ──< items ──< item_priority_judgment_items
  │                │                         │              │
  │                └──< group_priority_items  │              │
  │                           │              │              │
  ├──< priority_items ─────────┘─────────────┘              │
  │         │                                               │
  │         └──< priority_item_judgment_items               │
  │                           │                            │
  ├──< judgment_items ─────────┘────────────────────────────┘
  │
  ├──< counterparties (1) ──< debts ──< payment_entries
  │
  └──< debts (via user_id)
```

### Tables

#### `users`
| Column     | Type          | Notes                   |
| ---------- | ------------- | ----------------------- |
| id         | UUID (PK)     | gen_random_uuid()       |
| username   | VARCHAR(50)   | UNIQUE, NOT NULL        |
| password   | VARCHAR(255)  | bcrypt hashed           |
| image_url  | VARCHAR(500)  | Optional avatar URL     |
| created_at | TIMESTAMP     |                         |
| updated_at | TIMESTAMP     |                         |

#### `groups`
| Column      | Type         | Notes                          |
| ----------- | ------------ | ------------------------------ |
| id          | UUID (PK)    |                                |
| user_id     | UUID (FK)    | → users.id, CASCADE            |
| name        | VARCHAR(100) | Unique per user                |
| description | TEXT         | Optional                       |
| created_at  | TIMESTAMP    |                                |
| updated_at  | TIMESTAMP    |                                |

#### `priority_items` (Priority Parameters)
| Column      | Type         | Notes                               |
| ----------- | ------------ | ----------------------------------- |
| id          | UUID (PK)    |                                     |
| user_id     | UUID (FK)    | → users.id, NULLABLE (NULL=generic) |
| name        | VARCHAR(100) |                                     |
| description | TEXT         | The question or explanation         |
| weight      | INTEGER      | CHECK BETWEEN 1 AND 10              |
| created_at  | TIMESTAMP    |                                     |
| updated_at  | TIMESTAMP    |                                     |

#### `judgment_items` (Answer Options / Eval Items)
| Column      | Type         | Notes                               |
| ----------- | ------------ | ----------------------------------- |
| id          | UUID (PK)    |                                     |
| user_id     | UUID (FK)    | → users.id, NULLABLE (NULL=generic) |
| name        | VARCHAR(100) | e.g. "None", "Critical"             |
| description | TEXT         | Optional                            |
| value       | INTEGER      | CHECK BETWEEN 1 AND 5               |
| created_at  | TIMESTAMP    |                                     |
| updated_at  | TIMESTAMP    |                                     |

#### `items`
| Column                  | Type          | Notes                                   |
| ----------------------- | ------------- | --------------------------------------- |
| id                      | UUID (PK)     |                                         |
| user_id                 | UUID (FK)     | → users.id, CASCADE                     |
| name                    | VARCHAR(200)  |                                         |
| description             | TEXT          | Optional                                |
| group_id                | UUID (FK)     | → groups.id, CASCADE                    |
| price                   | DECIMAL(10,2) |                                         |
| priority                | DECIMAL(10,2) | Computed or manual                      |
| value                   | DECIMAL(10,2) | Average of eval item values             |
| is_done                 | BOOLEAN       | NOT NULL, DEFAULT false                 |
| enabled_ease_option     | BOOLEAN       | NOT NULL, DEFAULT false — installment flag |
| price_with_interest     | DECIMAL(10,2) | Nullable — total price with interest    |
| interest_percentage     | DECIMAL(5,2)  | NOT NULL, DEFAULT 0                     |
| ease_period             | INTEGER       | NOT NULL, DEFAULT 0 — installment months |
| created_at              | TIMESTAMP     |                                         |
| updated_at              | TIMESTAMP     |                                         |

#### `group_priority_items` (Junction)
| Column           | Type      | Notes                              |
| ---------------- | --------- | ---------------------------------- |
| id               | UUID (PK) |                                    |
| group_id         | UUID (FK) | → groups.id, CASCADE               |
| priority_item_id | UUID (FK) | → priority_items.id, CASCADE       |
| order            | INTEGER   | Display/evaluation order           |
| created_at       | TIMESTAMP |                                    |
| updated_at       | TIMESTAMP |                                    |
| UNIQUE           |           | (group_id, priority_item_id)       |

#### `priority_item_judgment_items` (Junction)
| Column           | Type      | Notes                                |
| ---------------- | --------- | ------------------------------------ |
| id               | UUID (PK) |                                      |
| priority_item_id | UUID (FK) | → priority_items.id, CASCADE         |
| judgment_item_id | UUID (FK) | → judgment_items.id, CASCADE         |
| order            | INTEGER   | Display order                        |
| created_at       | TIMESTAMP |                                      |
| updated_at       | TIMESTAMP |                                      |
| UNIQUE           |           | (priority_item_id, judgment_item_id) |

#### `item_priority_judgment_items` (Junction — Item Evaluations)
| Column           | Type      | Notes                            |
| ---------------- | --------- | -------------------------------- |
| id               | UUID (PK) |                                  |
| item_id          | UUID (FK) | → items.id, CASCADE              |
| priority_item_id | UUID (FK) | → priority_items.id, CASCADE     |
| judgment_item_id | UUID (FK) | → judgment_items.id, CASCADE     |
| created_at       | TIMESTAMP |                                  |
| updated_at       | TIMESTAMP |                                  |
| UNIQUE           |           | (item_id, priority_item_id)      |

#### `counterparties`
| Column     | Type          | Notes                     |
| ---------- | ------------- | ------------------------- |
| id         | UUID (PK)     |                           |
| user_id    | UUID (FK)     | → users.id, CASCADE       |
| name       | VARCHAR(200)  | NOT NULL                  |
| created_at | TIMESTAMP     |                           |
| updated_at | TIMESTAMP     |                           |
| UNIQUE     |               | (user_id, name)           |

#### `debts`
| Column                   | Type           | Notes                                                |
| ------------------------ | -------------- | ---------------------------------------------------- |
| id                       | UUID (PK)      |                                                      |
| user_id                  | UUID (FK)      | → users.id, CASCADE                                  |
| name                     | VARCHAR(200)   | NOT NULL                                             |
| purpose                  | TEXT           | Optional                                             |
| total_amount             | DECIMAL(12,2)  | NOT NULL                                             |
| remaining_balance        | DECIMAL(12,2)  | NOT NULL                                             |
| counterparty_id          | UUID (FK)      | → counterparties.id, NOT NULL                        |
| start_date               | DATE           |                                                      |
| deadline                 | DATE           |                                                      |
| type                     | ENUM           | `financial_obligation_type`: `debt` \| `asset`, DEFAULT `debt` |
| status                   | ENUM           | `debt_status`: `active` \| `paid` \| `overdue`, DEFAULT `active` |
| payment_period           | ENUM           | `payment_period`: `weekly` \| `monthly` \| `custom`, DEFAULT `monthly` |
| fixed_installment_amount | DECIMAL(12,2)  | Optional                                             |
| notes                    | TEXT           | Optional                                             |
| created_at               | TIMESTAMP      |                                                      |
| updated_at               | TIMESTAMP      |                                                      |

#### `payment_entries`
| Column       | Type          | Notes                                                           |
| ------------ | ------------- | --------------------------------------------------------------- |
| id           | UUID (PK)     |                                                                 |
| debt_id      | UUID (FK)     | → debts.id, CASCADE                                             |
| amount       | DECIMAL(12,2) | NOT NULL                                                        |
| payment_date | DATE          | NOT NULL                                                        |
| status       | ENUM          | `payment_entry_status`: `scheduled` \| `paid` \| `missed`, DEFAULT `scheduled` |
| note         | TEXT          | Optional                                                        |
| created_at   | TIMESTAMP     |                                                                 |
| updated_at   | TIMESTAMP     |                                                                 |

### PostgreSQL Enum Types

| Type Name                   | Values                          |
| --------------------------- | ------------------------------- |
| `debt_status`               | `active`, `paid`, `overdue`     |
| `payment_period`            | `weekly`, `monthly`, `custom`   |
| `payment_entry_status`      | `scheduled`, `paid`, `missed`   |
| `financial_obligation_type` | `debt`, `asset`                 |

### Migrations

1. **20260216000000_create_tables** — Creates the initial 7 tables: `users`, `groups`, `priority_items`, `judgment_items`, `items`, `group_priority_items`, `priority_item_judgment_items`
2. **20260216010000_normalize_user_ids_to_uuid** — Converts `users.id` and all referencing `user_id` columns from integer to UUID; adds pgcrypto extension
3. **20260216020000_make_user_id_nullable_except_items_groups** — Makes `user_id` NULLABLE on `priority_items` and `judgment_items` (enables generic/seeded items)
4. **20260217000000_set_users_id_default** — Sets `DEFAULT gen_random_uuid()` on `users.id`
5. **20260219000000_create_item_priority_judgment_items** — Creates `item_priority_judgment_items` junction table to store per-item answer selections
6. **20260220000000_add_is_done_to_items** — Adds `is_done` boolean column to `items`
7. **20260222000000_add_ease_fields_to_items** — Adds installment/ease payment fields to `items`: `enabled_ease_option`, `price_with_interest`, `interest_percentage`, `ease_period`
8. **20260304000000_create_debts_and_payment_entries** — Creates `debts` and `payment_entries` tables with their PostgreSQL enum types
9. **20260308000000_add_type_to_debts** — Adds `type` enum column (`debt`/`asset`) to `debts`; renames `lender_name` column to `counterparty`
10. **20260315151941_create_counterparties** — Creates `counterparties` table; migrates existing `debts.counterparty` strings into `counterparties` rows; adds `debts.counterparty_id` FK; drops old `debts.counterparty` column

### Seeds

The seed file `01_priority_and_judgment_items.ts` creates **generic** (user_id = NULL) priority parameters and answer options available to all users:

- **Generic Priority Parameters** (4 items, each weight 5): Urgency, Impact/Value, Frequency of Need, Strategic Importance
- **Generic Answer Options** (5 per parameter, values 1–5): one answer option per level

Generic items are **read-only** — they cannot be edited or deleted by any user.

---

## Authentication & Authorization

### NextAuth Configuration (`src/lib/auth.ts`)
- **Provider**: Credentials (username + password)
- **Strategy**: JWT (no database sessions)
- **Password hashing**: bcryptjs (compare on login)
- **Callbacks**: 
  - `jwt`: Attaches `user.id` to the JWT token
  - `session`: Copies `token.id` into `session.user.id`

### Middleware (`src/middleware.ts`)
Protected routes via `next-auth/middleware`'s `withAuth`:
- `/dashboard/*`, `/items/*`, `/groups/*`, `/simulation/*`, `/profile/*`, `/tracking/*`, `/counterparties/*`
- Unauthenticated users are redirected to `/login`

### API Authorization
Every API route calls `getServerSession(authOptions)` and checks `session.user.id`. Data is scoped to the authenticated user via `user_id` column filtering.

---

## Core Concepts

### Terminology Mapping

| UI Term             | DB Table                          | API Route              |
| ------------------- | --------------------------------- | ---------------------- |
| Priority Parameter  | `priority_items`                  | `/api/priority-params` |
| Answer Option       | `judgment_items`                  | `/api/eval-items`      |
| Group               | `groups`                          | `/api/groups`          |
| Item                | `items`                           | `/api/items`           |
| Debt / Asset        | `debts`                           | `/api/debts`           |
| Counterparty        | `counterparties`                  | `/api/counterparties`  |
| Payment Entry       | `payment_entries`                 | `/api/debts/[id]/payments` |
| Item Evaluation     | `item_priority_judgment_items`    | (resolved via `/api/items`) |

### Priority Calculation

Priority is computed as a **weighted average**:

$$
\text{priority} = \frac{\sum_{i} (w_i \times v_i)}{\sum_{i} w_i}
$$

Where:
- $w_i$ = weight of priority parameter $i$ (1–10)
- $v_i$ = value of the selected answer option for parameter $i$ (1–5)

Result range: **1.00 to 5.00**

### Value Score

Used on the items page for sorting by purchase value:

$$
\text{valueScore} = \frac{\text{priority}^5}{\text{price}}
$$

Higher scores indicate better value-for-money purchases.

### Guided vs Manual Priority

When creating/editing items, users choose between:
- **Guided mode**: Select answer options for each of the group's priority parameters. Priority is computed automatically using the weighted average formula.
- **Manual mode**: Enter a priority score directly (any non-negative number).

---

## API Routes

### Auth
| Method | Route                    | Description                     |
| ------ | ------------------------ | ------------------------------- |
| POST   | `/api/auth/register`     | Create new user account         |
| *      | `/api/auth/[...nextauth]`| NextAuth handlers (login, etc.) |

### Priority Parameters
| Method | Route                              | Description                              |
| ------ | ---------------------------------- | ---------------------------------------- |
| GET    | `/api/priority-params`             | List user's + generic params             |
| POST   | `/api/priority-params`             | Create parameter (name, description, weight 1–10) |
| GET    | `/api/priority-params/[id]`        | Get single parameter with eval items     |
| PATCH  | `/api/priority-params/[id]`        | Update parameter (blocks generic)        |
| DELETE | `/api/priority-params/[id]`        | Delete parameter (blocks generic)        |
| GET    | `/api/priority-params/[id]/eval-items` | Get assigned eval items for a param  |

### Eval Items (Answer Options)
| Method | Route                   | Description                              |
| ------ | ----------------------- | ---------------------------------------- |
| GET    | `/api/eval-items`       | List user's + generic eval items         |
| POST   | `/api/eval-items`       | Create eval item (name, description, value 1–5) |
| GET    | `/api/eval-items/[id]`  | Get single eval item                     |
| PATCH  | `/api/eval-items/[id]`  | Update eval item (blocks generic)        |
| DELETE | `/api/eval-items/[id]`  | Delete eval item (blocks generic)        |

### Groups
| Method | Route                        | Description                               |
| ------ | ---------------------------- | ----------------------------------------- |
| GET    | `/api/groups`                | List user's groups with item counts        |
| POST   | `/api/groups`                | Create group with optional param assignment|
| GET    | `/api/groups/[id]`           | Get group detail with items and params     |
| PATCH  | `/api/groups/[id]`           | Update group name/description              |
| DELETE | `/api/groups/[id]`           | Delete group (cascades to items)           |
| GET    | `/api/groups/[id]/params`    | Get assigned priority params for group     |
| POST   | `/api/groups/[id]/params`    | Assign priority param to group             |
| DELETE | `/api/groups/[id]/params`    | Unassign priority param from group         |

### Items
| Method | Route                 | Description                                     |
| ------ | --------------------- | ----------------------------------------------- |
| GET    | `/api/items`          | List items with filtering and sorting            |
| POST   | `/api/items`          | Create item with guided or manual priority       |
| GET    | `/api/items/[id]`     | Get single item with group info                  |
| PATCH  | `/api/items/[id]`     | Update item (supports answers-based recalculation)|
| DELETE | `/api/items/[id]`     | Delete item                                      |

### Other
| Method | Route                    | Description                              |
| ------ | ------------------------ | ---------------------------------------- |
| GET    | `/api/dashboard`         | Aggregated stats (counts, top items)     |
| GET    | `/api/profile`           | Get current user profile                 |
| PATCH  | `/api/profile`           | Update username, image, or password      |
| POST   | `/api/simulation`        | Run priority simulation with custom data |
| POST   | `/api/upload/avatar`     | Upload avatar image                      |

### Debts / Assets (Tracking)
| Method | Route                               | Description                                  |
| ------ | ----------------------------------- | -------------------------------------------- |
| GET    | `/api/debts`                        | List user's debts and assets                 |
| POST   | `/api/debts`                        | Create debt or asset                         |
| GET    | `/api/debts/[id]`                   | Get single debt/asset with payment entries   |
| PATCH  | `/api/debts/[id]`                   | Update debt/asset                            |
| DELETE | `/api/debts/[id]`                   | Delete debt/asset                            |
| GET    | `/api/debts/[id]/payments`          | List payment entries for a debt              |
| POST   | `/api/debts/[id]/payments`          | Create payment entry                         |
| PATCH  | `/api/debts/[id]/payments/[paymentId]` | Update a payment entry                    |
| DELETE | `/api/debts/[id]/payments/[paymentId]` | Delete a payment entry                    |

### Counterparties
| Method | Route                               | Description                              |
| ------ | ----------------------------------- | ---------------------------------------- |
| GET    | `/api/counterparties`               | List user's counterparties               |
| POST   | `/api/counterparties`               | Create counterparty                      |
| GET    | `/api/counterparties/[id]`          | Get single counterparty                  |
| PATCH  | `/api/counterparties/[id]`          | Update counterparty                      |
| DELETE | `/api/counterparties/[id]`          | Delete counterparty                      |
| GET    | `/api/counterparties/[id]/records`  | Get debts/assets linked to counterparty  |
| GET    | `/api/counterparties/summary`       | Aggregate balance summary per counterparty |

---

## Frontend Pages

### Public Pages
- **`/`** — Landing page with hero section, redirects logged-in users to dashboard
- **`/login`** — Login form (username + password)
- **`/register`** — Registration form

### Protected Pages (under `(authenticated)/` route group)
- **`/dashboard`** — Stats cards (total groups, items, params, avg priority), top items table, quick actions
- **`/priority-params`** — Two-column layout: left = priority parameters (create, edit, delete, view), right = eval/answer items (create, edit, delete, view). Generic items are marked with a badge and have edit/delete disabled.
- **`/groups`** — Card grid of groups. Modal for create/edit with name, description, and priority parameter chip-toggle assignment.
- **`/groups/[id]`** — Group detail showing items table and assigned priority parameters with eval items. Supports param assignment, item creation with guided priority.
- **`/items`** — Full items table with sort/filter controls (by group, priority range, price range, sort by priority/price/date/value-score). Modal for add/edit with guided or manual priority input.
- **`/simulation`** — Sandbox for testing priority calculations without saving.
- **`/profile`** — Edit username, profile image URL, change password.
- **`/tracking`** — Debt and asset overview: lists all debts/assets with status, remaining balance, and counterparty. Supports create/edit/delete for debts and assets.
- **`/tracking/balance/[id]`** — Detail view for a single debt/asset: shows all payment entries, scheduled vs paid vs missed, and allows adding/editing/deleting payment entries.
- **`/counterparties`** — Lists all counterparties (lenders, borrowers, etc.) with balance summaries. Supports create/edit/delete.

### Layout & Navigation
- The `(authenticated)/layout.tsx` wraps all protected pages with a collapsible sidebar navigation
- The sidebar has links to: Dashboard, Items, Groups, Priority Params, Simulation, Profile
- Dark/light theme toggle in the sidebar header

---

## Theming

The app uses CSS custom properties defined in `globals.css` for theming. A `ThemeProvider` context manages dark/light mode, persisting the choice in `localStorage`.

### CSS Variable Strategy
Variables are defined in `:root` (light) and `.dark` (dark) selectors using HSL values. Tailwind CSS v4 references these via utility classes like `bg-background`, `text-foreground`, `border-border`, etc.

### Key Theme Variables
- `--background`, `--foreground` — Page background and text
- `--card`, `--card-foreground` — Card surfaces
- `--primary`, `--primary-foreground` — Accent/button colors
- `--muted`, `--muted-foreground` — Subdued elements
- `--border` — Border color
- `--input` — Form input backgrounds
- `--destructive` — Delete/error actions
- `--ring` — Focus ring color

---

## Key Design Decisions

1. **Generic items (user_id = NULL)**: Seeded parameters and answer options are shared across all users but are immutable. The API returns a 403 if a user attempts to edit or delete them.

2. **Cascade on group delete**: Deleting a group cascades to delete all items in that group (both at DB level via FK constraints and explicitly in the API handler).

3. **Weighted priority**: Priority is always stored as a decimal, whether computed via guided mode or entered manually. This allows consistent sorting and comparison.

4. **Junction tables for many-to-many**: Groups ↔ Priority Parameters and Priority Parameters ↔ Answer Options use junction tables with ordering support. Item evaluations use `item_priority_judgment_items` to capture which answer option was selected for each priority parameter on a given item.

5. **Client-side value score**: The "value score" (priority^5 / price) is computed client-side for sorting — it's not stored in the database.

6. **No ORM**: Raw SQL via Knex.js query builder for full control over queries and easy PostgreSQL-specific features.

7. **Zod validation on all API routes**: Every POST/PATCH endpoint validates the request body with Zod schemas before processing.

8. **Debts and Assets unified in one table**: The `debts` table uses a `type` enum (`debt` | `asset`) to differentiate obligations from receivables, allowing a single tracking flow and shared payment entry logic.

9. **Counterparties as a reference table**: Rather than storing lender/borrower names as free-text on each debt, counterparties are normalized into their own table with a unique constraint on `(user_id, name)`. This enables aggregate summaries (total owed to/from a counterparty) and prevents duplicate entries.

---

## Running the Application

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env   # Configure DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL

# Run database migrations
npm run migrate

# Seed generic data
npx knex --knexfile knexfile.ts seed:run

# Start development server
npm run dev
```

### Environment Variables

| Variable         | Description                        |
| ---------------- | ---------------------------------- |
| DATABASE_URL     | PostgreSQL connection string       |
| NEXTAUTH_SECRET  | NextAuth JWT signing secret        |
| NEXTAUTH_URL     | App base URL (e.g. http://localhost:3000) |
