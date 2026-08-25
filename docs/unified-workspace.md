# Unified Authentication & Internal Workspace

Cogniiq is one product with three surfaces that share a single Supabase auth session:

- **Customer portal** — `/app/*` (serves customers; stays separate).
- **Internal workspace** — `/admin/*` (owner + admin): Task Dashboard, Oura Analytics, Client CRM,
  Finance & Steuern. One shell, one navigation model, one account/logout control.
- **Public marketing site** — everything else.

## One canonical login

`/app/login` (`src/pages/app/LoginPage.tsx`) is the single login for customers, admins and the owner.
There is no separate dark Admin login. `/admin/login` permanently redirects to `/app/login`
(preserving `redirectTo`). Copy is role-neutral ("Sicherer Zugang" / "Cogniiq Login"); the signup link
is labelled "Kundenkonto erstellen".

## Role-aware post-login routing (no flicker/loop)

Login never navigates on stale React role state. On success (or when an already-authenticated user
opens `/app/login`) it hands off to **`/auth/continue`** (`RoleLandingPage`), which:

1. waits until `AuthContext` has loaded the session **and** the DB-backed `profiles.platform_role`;
2. validates the requested `redirectTo`;
3. sends the user to the authorized destination, else the role's default landing.

Default landings (`src/lib/auth/authorizedRedirect.ts`, `ROLE_LANDING`):

| Role | Default |
|------|---------|
| `cogniiq_owner` | `/admin/finance/overview` |
| `cogniiq_admin` | `/admin` |
| `customer` | `/app` |

Roles come from the database (`profiles.platform_role`) — never from email or JWT metadata.
`info@cogniiq.de` is never hardcoded.

## Redirect safety (`src/lib/auth/authorizedRedirect.ts`, pure + unit-tested)

- `sanitizeRedirect` accepts only known internal prefixes (`/app`, `/admin`); rejects external URLs,
  protocol-relative `//host`, backslash / encoded-slash authority tricks, and whitespace.
- `isPathAuthorized` mirrors the guards: `/admin/finance/*` → owner, other `/admin/*` → admin, `/app/*`
  → any authenticated user.
- `resolvePostLoginDestination` returns the requested path only if safe **and** authorized for the
  role; otherwise the role default. Unauthorized/unsafe requests silently fall back.

Tests: `.github/scripts/test-auth-routing.mjs`.

## Route architecture (`src/App.tsx`, one route table)

- `/auth/continue` → `RoleLandingPage`
- Legacy: `/admin/login` → `/app/login`; `/owner`, `/owner/*` → `/admin/finance/*`
  (`/owner/clients*` → `/admin/clients*`), preserving the trailing segment + query.
- `/app/*` — customer portal (unchanged), each page behind `ProtectedRoute`.
- `/admin/*` — pathless layout route `InternalWorkspaceLayout` (one `PlatformAdminRoute`, one
  `DashboardShell`, one `ToastProvider`), with children:
  - `/admin`, `/admin/tasks/{today,overdue,completed,revenue}`, `/admin/execution` → Task Dashboard
  - `/admin/oura-analytics` → Oura Analytics
  - `/admin/clients`, `/admin/clients/new`, `/admin/clients/:organizationId`, `/admin/solutions`,
    `/admin/invitations` → Client CRM
  - `/admin/finance/*` → `FinanceModule` (owner-only `PlatformOwnerRoute` + readiness gate)
- Public marketing site — pathless layout route `PublicLayout` (nav/footer chrome).

Cloudflare deep-linking for the private surfaces is handled on **Pages** by
`public/_redirects`, which rewrites `/app`, `/admin`, `/owner`, `/auth` and `/d`
to `/app-shell` — the pretty path, deliberately **without** the `.html`
extension. Pages canonicalises an `.html` rewrite target to a bodyless 307, and
`functions/_middleware.ts` used to re-emit that empty body at HTTP 200, which is
what made every private deep link a blank page that loaded no JavaScript at all.
The middleware now validates any document it falls back to and returns an
explicit 5xx rather than a blank 200. Verified against the real Pages runtime by
`.github/scripts/test-pages-routing.mjs` (`wrangler pages dev dist`).

`wrangler.jsonc` and `worker/index.mjs` describe the Workers Assets path, which
Pages ignores and which is not currently live.

## Shared shell & navigation

`InternalWorkspaceLayout` (`src/pages/admin/InternalWorkspace.tsx`) renders the shared
`DashboardShell` with:

- **Top-level app switch:** Task Dashboard · Oura Analytics · Client CRM · Finance & Steuern. Finance
  is owner-only (hidden from admins). Derived from the URL (`internalNavigation.ts`).
- **Module sub-navigation** derived from the active module (owner-only sub-nav withheld from
  non-owners even on a typed URL).
- One account menu and one logout control.

Hiding the Finance item/sub-nav is convenience only — `PlatformOwnerRoute` and database RLS remain
the security boundary.

## Presentation

One premium light palette across the whole workspace (warm off-white `#f7f7f4`, white cards, graphite
type, near-black primary buttons, ~20px radii, soft shadows). No dark admin mode, no theme toggle, no
ambient/scan-line layers, no live clock. The Task Dashboard was rebuilt on the shared dashboard
primitives; Oura Analytics and Execution OS render inside the shared shell with the legacy admin
chrome removed (all data logic, charts and states preserved).
