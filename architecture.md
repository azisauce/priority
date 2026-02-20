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
│   ├── migrations/         # Knex migration files (3 migrations)
│   └── seeds/              # Seed data for generic params/options
├── public/                 # Static assets
├── src/
│   ├── middleware.ts        # NextAuth route protection
│   ├── app/
│   │   ├── globals.css      # Theme CSS variables (light/dark)
│   │   ├── layout.tsx       # Root layout with SessionProvider + ThemeProvider
│   │   ├── page.tsx         # Landing page (redirects to /dashboard if authenticated)
│   │   ├── login/           # Login page
│   │   ├── register/        # Registration page
│   │   ├── (authenticated)/ # Route group — all protected pages
│   │   │   ├── layout.tsx   # Sidebar navigation layout
│   │   │   ├── dashboard/   # Dashboard with aggregated stats
│   │   │   ├── groups/      # Groups listing + detail views
│   │   │   ├── items/       # Items listing with filters/sort
│   │   │   ├── priority-params/ # Priority parameters + eval items management
│   │   │   ├── profile/     # User profile editing
│   │   │   └── simulation/  # Priority simulation sandbox
│   │   └── api/             # API routes (REST)
│   │       ├── auth/        # NextAuth + registration
│   │       ├── dashboard/   # Aggregated stats endpoint
│   │       ├── eval-items/  # CRUD for judgment/answer items
│   │       ├── groups/      # CRUD for groups + param assignment
│   │       ├── items/       # CRUD for items
│   │       ├── priority-params/ # CRUD for priority parameters + eval item assignment
│   │       ├── profile/     # User profile management
│   │       └── simulation/  # Simulation computation
│   ├── components/
│   │   ├── navigation.tsx   # Sidebar navigation component
│   │   ├── theme-provider.tsx # Dark/light mode context provider
│   │   ├── theme-toggle.tsx # Theme switch button
│   │   └── providers/
│   │       └── session-provider.tsx # NextAuth SessionProvider wrapper
│   ├── lib/
│   │   ├── auth.ts          # NextAuth configuration (credentials, JWT, callbacks)
│   │   ├── db.ts            # Knex database connection
│   │   └── priority.ts      # Priority calculation utility (weighted average)
│   └── types/
│       └── next-auth.d.ts   # NextAuth type augmentation (adds user.id)
├── knexfile.ts              # Knex DB connection config
├── next.config.ts           # Next.js configuration
├── tsconfig.json            # TypeScript config
└── package.json
```

---

## Database Schema

### Entity Relationship

```
users (1) ──< groups (1) ──< items
  │                │
  │                └──< group_priority_items >── priority_items
  │                                                    │
  ├──< priority_items ──< priority_item_judgment_items >── judgment_items
  │
  └──< judgment_items
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
| Column      | Type         | Notes                             |
| ----------- | ------------ | --------------------------------- |
| id          | UUID (PK)    |                                   |
| user_id     | UUID (FK)    | → users.id, NULLABLE (NULL=generic) |
| name        | VARCHAR(100) |                                   |
| description | TEXT         | The question or explanation       |
| weight      | INTEGER      | CHECK BETWEEN 1 AND 10           |
| created_at  | TIMESTAMP    |                                   |
| updated_at  | TIMESTAMP    |                                   |

#### `judgment_items` (Answer Options / Eval Items)
| Column      | Type         | Notes                             |
| ----------- | ------------ | --------------------------------- |
| id          | UUID (PK)    |                                   |
| user_id     | UUID (FK)    | → users.id, NULLABLE (NULL=generic) |
| name        | VARCHAR(100) | e.g. "None", "Critical"          |
| description | TEXT         | Optional                         |
| value       | INTEGER      | CHECK BETWEEN 1 AND 5            |
| created_at  | TIMESTAMP    |                                   |
| updated_at  | TIMESTAMP    |                                   |

#### `items`
| Column      | Type          | Notes                         |
| ----------- | ------------- | ----------------------------- |
| id          | UUID (PK)     |                               |
| user_id     | UUID (FK)     | → users.id, CASCADE           |
| name        | VARCHAR(200)  |                               |
| description | TEXT          | Optional                      |
| group_id    | UUID (FK)     | → groups.id, CASCADE          |
| price       | DECIMAL(10,2) |                               |
| priority    | DECIMAL(10,2) | Computed or manual            |
| value       | DECIMAL(10,2) | Average of eval item values   |
| created_at  | TIMESTAMP     |                               |
| updated_at  | TIMESTAMP     |                               |

#### `group_priority_items` (Junction)
| Column           | Type     | Notes                              |
| ---------------- | -------- | ---------------------------------- |
| id               | UUID (PK)|                                    |
| group_id         | UUID (FK)| → groups.id, CASCADE               |
| priority_item_id | UUID (FK)| → priority_items.id, CASCADE       |
| order            | INTEGER  | Display/evaluation order           |
| UNIQUE           |          | (group_id, priority_item_id)       |

#### `priority_item_judgment_items` (Junction)
| Column            | Type     | Notes                               |
| ----------------- | -------- | ----------------------------------- |
| id                | UUID (PK)|                                     |
| priority_item_id  | UUID (FK)| → priority_items.id, CASCADE        |
| judgment_item_id  | UUID (FK)| → judgment_items.id, CASCADE        |
| order             | INTEGER  | Display order                       |
| UNIQUE            |          | (priority_item_id, judgment_item_id)|

### Migrations

1. **20260216000000** — Creates all 7 tables with indexes
2. **20260216010000** — Normalizes user_id columns to UUID type
3. **20260216020000** — Makes user_id NULLABLE on priority_items and judgment_items (enables generic/seeded items)

### Seeds

The seed file `01_priority_and_judgment_items.ts` creates **generic** (user_id = NULL) priority parameters and answer options available to all users:

- **Generic Priority Parameters**: Urgency (weight 9), Frequency of Use (8), Long-term Value (7), Emotional Satisfaction (6), Replaceability (5), Budget Impact (4), Opportunity Cost (3)
- **Generic Answer Options**: None (1), Mildly (2), Moderately (3), Very (4), Extremely (5)

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
- `/dashboard/*`, `/items/*`, `/groups/*`, `/simulation/*`, `/profile/*`
- Unauthenticated users are redirected to `/login`

### API Authorization
Every API route calls `getServerSession(authOptions)` and checks `session.user.id`. Data is scoped to the authenticated user via `user_id` column filtering.

---

## Core Concepts

### Terminology Mapping

| UI Term             | DB Table                        | API Route             |
| ------------------- | ------------------------------- | --------------------- |
| Priority Parameter  | `priority_items`                | `/api/priority-params`|
| Answer Option       | `judgment_items`                | `/api/eval-items`     |
| Group               | `groups`                        | `/api/groups`         |
| Item                | `items`                         | `/api/items`          |

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
| Method | Route              | Description                              |
| ------ | ------------------ | ---------------------------------------- |
| GET    | `/api/dashboard`   | Aggregated stats (counts, top items)     |
| GET    | `/api/profile`     | Get current user profile                 |
| PATCH  | `/api/profile`     | Update username, image, or password      |
| POST   | `/api/simulation`  | Run priority simulation with custom data |

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

4. **Junction tables for many-to-many**: Groups ↔ Priority Parameters and Priority Parameters ↔ Answer Options use junction tables with ordering support.

5. **Client-side value score**: The "value score" (priority^5 / price) is computed client-side for sorting — it's not stored in the database.

6. **No ORM**: Raw SQL via Knex.js query builder for full control over queries and easy PostgreSQL-specific features.

7. **Zod validation on all API routes**: Every POST/PATCH endpoint validates the request body with Zod schemas before processing.

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
