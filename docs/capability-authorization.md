# Reusable multi-tenant capability authorization

Status: **migration applied to the hosted Cogniiq Supabase project** (`lqgtmoulqzmrhglabrms`) at
its own ledger version `20260804120000`, verified by the hosted preflight at 456 checks / 0
failures. **Not merged and not deployed** — the frontend is still only on the pull-request branch.
Steps 6–8 of the deployment order below are outstanding.

### Hosted apply, and one defect it exposed

A hosted Supabase project ships `ALTER DEFAULT PRIVILEGES` granting `EXECUTE` on new `public`
functions to `anon`, `authenticated` and `service_role`. The migration originally revoked only from
`public` and `anon`, relying on *never granting* `membership_effective_capability_keys(uuid)` to
`authenticated` — which is enough on a plain PostgreSQL database but **not** on Supabase, where the
default privilege granted it anyway. On the hosted project the function was therefore briefly
executable by any signed-in user, the exact membership-id probe its own comment forbids.

The hosted preflight caught it, it was revoked immediately, and the migration now revokes from
`public, anon, authenticated` before granting the intended audience back, so the result no longer
depends on the target project's default privileges. Anyone applying this migration to another
Supabase project must use the current file.

## Why a second role concept exists

`public.organization_role` (`owner`, `admin`, `member`, `viewer`) is a **coarse governance role**:
who may administer the tenant. It deliberately gains no new values — a `treasurer` or
`membership_manager` value would make the enum customer-specific and unreusable.

Fine-grained, customer-specific authority lives in a separate, reusable model:

| Concern | Where it lives |
| --- | --- |
| What a person may *do* | `capabilities` (global, namespaced, tenant-free) |
| What a customer *calls* a job | `organization_roles` (scoped to one organization) |
| Which capabilities a job carries | `organization_role_capabilities` |
| Which jobs a person holds | `organization_member_roles` (many per member) |
| Which jobs a new person will hold | `client_invitation_roles` (copied on claim) |

## Effective capabilities

For one **active** membership:

```
effective = ( union of capabilities of all assigned functional roles )
          ∪ ( baseline, if the member holds NO functional role )
          ∪ ( baseline, if the coarse organization role is owner or admin )
          − ( capabilities of inactive catalog entries )
          − ( capabilities bound to a solution the organization has not ACTIVATED )
```

* A **suspended** membership yields an empty set and no portal context entry at all.
* The union is **deduplicated** — two roles granting `svh.dashboard.view` produce one entry.
* "Activated" means `organization_solutions.status = 'active'`. `provisioning`, `paused` and
  `disabled` all suppress that solution's capabilities
  (`public.solution_status_entitles_capabilities`).

### The baseline, and why it exists

`public.portal_baseline_capability_keys()` returns the six general-portal capabilities. It is the
**backward-compatibility contract**: every existing customer — Pankofer included — currently has
zero functional roles, so they receive the baseline and their portal is byte-for-byte what it was.
Coarse owner/admin also always receive it, so an owner can never lock themselves out.

Removing a member's *last* functional role therefore returns them to the baseline, not to nothing.
Removing one of several roles revokes exactly that role's extra capabilities.

## Capability catalog

### General portal (no solution binding — always available)

| Key | Meaning |
| --- | --- |
| `portal.overview.view` | Portal start page |
| `portal.projects.view` | Projects and milestones |
| `portal.documents.view` | Released documents |
| `portal.billing.view` | Invoices and billing |
| `portal.support.create` | Raise a support request |
| `portal.support.view_own` | See own support requests |

### Vereinsverwaltung (`sports_club_operations`) — suppressed unless the solution is active

`svh.dashboard.view`, `svh.bookings.view`, `svh.bookings.manage`, `svh.members.view`,
`svh.members.manage`, `svh.members.applications_review`, `svh.members.numbers_assign`,
`svh.finance.view`, `svh.finance.manage`, `svh.facilities.view`, `svh.facilities.manage`,
`svh.devices.view`, `svh.devices.manage`

The `sports_club_operations` catalog entry resolves to the `unavailable` frontend implementation.
No operational pages have been invented, and no customer data is seeded anywhere.

## SVH role presets — capability matrix

Created by `public.apply_sports_club_role_presets(organization_id)`, which creates **roles only** and
assigns them to nobody. Every preset additionally carries all six baseline capabilities.

| Capability | Vorstand | Mitglieder&shy;verwaltung | Kassenwart | Buchungs&shy;verwaltung | Anlagen&shy;verwaltung | Lesender Admin |
| --- | :-: | :-: | :-: | :-: | :-: | :-: |
| `svh.dashboard.view` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `svh.bookings.view` | ✅ | — | — | ✅ | — | ✅ |
| `svh.bookings.manage` | ✅ | — | — | ✅ | — | — |
| `svh.members.view` | ✅ | ✅ | ✅ | — | — | ✅ |
| `svh.members.manage` | ✅ | ✅ | — | — | — | — |
| `svh.members.applications_review` | ✅ | ✅ | — | — | — | — |
| `svh.members.numbers_assign` | ✅ | ✅ | — | — | — | — |
| `svh.finance.view` | ✅ | — | ✅ | — | — | ✅ |
| `svh.finance.manage` | ✅ | — | ✅ | — | — | — |
| `svh.facilities.view` | ✅ | — | — | ✅ | ✅ | ✅ |
| `svh.facilities.manage` | ✅ | — | — | — | ✅ | — |
| `svh.devices.view` | ✅ | — | — | — | ✅ | ✅ |
| `svh.devices.manage` | ✅ | — | — | — | ✅ | — |
| **total (incl. baseline)** | 19 | 11 | 10 | 10 | 11 | 12 |

Separation of duties: outside `Vorstand`, no preset holds both `svh.finance.manage` and
`svh.members.manage`. `Lesender Administrator` holds no `manage`, `_assign` or `_review` capability
at all. Both properties are asserted in `src/lib/portalAccess/capabilities.test.ts`.

## RPC inventory

| RPC | Caller | Authorization |
| --- | --- | --- |
| `current_user_portal_context()` | customer portal | `auth.uid()` only; active memberships only |
| `admin_organization_access_overview(uuid)` | owner UI | platform admin |
| `assign_organization_member_role(uuid, uuid)` | owner UI | platform admin + same-organization |
| `remove_organization_member_role(uuid, uuid)` | owner UI | platform admin |
| `set_client_invitation_roles(uuid, uuid[])` | owner UI | platform admin + pending invitation + same-organization |
| `upsert_organization_role(uuid, text, text, text, text[], int)` | role authoring | platform admin |
| `apply_sports_club_role_presets(uuid)` | owner UI | platform admin |
| `claim_my_client_invitations()` | AuthContext | unchanged signature and rules |

`membership_effective_capability_keys(uuid)` is **not** granted to `authenticated`: it takes a
membership id and would otherwise let any signed-in user probe another organization's membership.
It is reachable only through the two read RPCs, which scope it to `auth.uid()` or to a verified
platform admin.

## Security model

* **Cross-tenant safety is structural.** `organization_member_roles` and `client_invitation_roles`
  carry a redundant `organization_id` and reference `(id, organization_id)` composite keys, so a row
  whose member and role belong to different organizations cannot be inserted at all — not by
  `service_role`, not by the database owner, not by anyone bypassing RLS.
* **RLS on every new table.** `anon` receives nothing. `authenticated` receives `SELECT` only, and
  only inside its own organizations; `client_invitation_roles` is not granted to `authenticated` at
  all.
* **No browser write path.** Every mutation goes through a `SECURITY DEFINER` RPC with a pinned
  `search_path` that re-authorizes the caller.
* **Deleting an assignment deletes an assignment.** Profiles, memberships, projects, documents and
  invoices are never cascaded into.
* **The frontend is not the boundary.** `CapabilityRoute` and `CapabilityGate` decide what to
  *offer*; the database independently decides what to *allow*. An unknown capability key fails
  closed in the UI.

## Deployment order (later, deliberately not performed here)

The database must lead the frontend, and the migration must be verified against real Pankofer data
**before** the branch is merged. The order below is not interchangeable: merging first would put a
capability-gated frontend in front of a database that cannot answer `current_user_portal_context()`,
and every existing customer would fail closed.

1. **CI green.** Every job on PR #21 passes — including the capability authorization SQL security
   job, which applies this migration to a clean database and asserts the whole boundary, and the
   staging preflight self-test, which proves the preflight actually catches drift in this
   migration's objects rather than merely counting checks.
2. **Apply the hosted migration — at its own version, 20260804120000.** Apply
   `20260804120000_reusable_capability_authorization.sql` to the hosted Cogniiq Supabase project.
   It is additive and forward-only. Existing customers are unaffected the moment it lands, because
   every existing member holds zero functional roles and therefore receives the baseline.

   **This project has already suffered migration-ledger drift once** (the `20260801120000` shadow
   that Case D had to converge). The rules below are not optional:

   * The row in `supabase_migrations.schema_migrations` must be **exactly** `20260804120000`. Not
     `20260804120001`, not a same-day variant, not a fresh timestamp generated at apply time.
   * **No generated replacement timestamp.** Do not run anything that re-stamps the migration
     (`supabase migration new`, a copy-pasted file with a new name, a dashboard-pasted script
     recorded under a CLI-generated version). Apply the repository file under its own name, or
     apply its SQL and then record the ledger row explicitly as `20260804120000`.
   * Ledger and schema drift in either direction is a stop condition: a ledger row without the
     schema, or the schema without the ledger row, both fail the preflight and both must be
     resolved before anything else proceeds.

3. **Verify the schema and the migration ledger immediately after applying.** Before touching any
   customer data or any frontend:

   ```sql
   -- exactly one row, exactly this version
   select version, name
   from supabase_migrations.schema_migrations
   where version >= '20260801000000'
   order by version;

   -- the five authorization tables, all with RLS enabled
   select c.relname, c.relrowsecurity
   from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public'
     and c.relname in ('capabilities', 'organization_roles', 'organization_role_capabilities',
                       'organization_member_roles', 'client_invitation_roles')
   order by c.relname;
   ```

   The first query must return **one** row, `20260804120000`. Any additional or differently-stamped
   version is the drift this project has already been burned by — stop and reconcile the ledger
   before continuing. The second must return all five tables with `relrowsecurity = true`.

4. **Run the hosted staging preflight, and require ZERO failures.**

   ```sh
   DATABASE_URL='postgresql://...' bash scripts/staging/preflight.sh
   ```

   It is strictly read-only. It fingerprints this migration explicitly: the five tables, RLS,
   primary/unique/composite-foreign/check constraints, indexes, the complete capability catalog
   with its expected solution bindings, every new RPC signature, `SECURITY DEFINER` with a pinned
   `search_path`, the fact that `anon` can neither execute nor read anything, the exact
   `authenticated` minimum (including that `membership_effective_capability_keys` is *not*
   executable by `authenticated` while `current_user_portal_context` is), the additive
   functional-role transfer inside `claim_my_client_invitations()`, the required RLS policies, and
   the absence of cross-organization assignment rows, invalid invitation-role rows and duplicate
   capability or organization-role keys. It also re-asserts the ledger rules from step 2.

   **The Cloudflare production merge does not happen while a single preflight check is failing.**
   A partially applied or re-stamped migration is exactly the state this gate exists to refuse.

5. **Verify Pankofer.** Against hosted data, confirm the existing customer is intact *before*
   anything ships:
   - `current_user_portal_context()` returns their organization with `membership_status = 'active'`;
   - their effective capabilities contain the six baseline keys;
   - their `ai_receptionist` solution is still listed;
   - `organization_has_accessible_solution(<org>, 'ai_receptionist')` is still true.
   If any of these is wrong, stop — do not merge.
6. **Test the Cloudflare PR preview.** With the hosted migration applied, exercise the preview
   deployment for PR #21: sign in as an existing customer and confirm `/app`, `/app/documents` and
   `/app/billing` still render, and that **Kunden → Zugriff & Rollen** loads for a platform admin.
   This is the first point at which the new frontend meets the migrated database.
7. **Merge** the pull request into `main` (this is the Cloudflare production merge). Permitted only
   with step 4 reporting **zero** preflight failures and steps 5–6 clean.
8. **Verify Cloudflare production.** After the production deployment, repeat the step 6 checks on
   the production URL, then re-run the preflight (step 4) against the hosted database once more and
   confirm it is still at zero failures.

Only after all eight steps, and per customer: create the solution instance, call
`apply_sports_club_role_presets(organization_id)`, and assign roles through
**Kunden → Zugriff & Rollen**.

Steps 1–5 are **done**: CI green, the migration applied to `lqgtmoulqzmrhglabrms` at ledger version
`20260804120000` with no replacement timestamp, schema and ledger verified, the hosted preflight at
456 checks / 0 failures, and both existing customers (Cogniiq and Pankofer) confirmed to receive
exactly the six baseline capabilities with `ai_receptionist` still active.

Steps 6–8 have **not** been performed: nothing is merged, nothing is deployed, no customer data was
seeded, no functional role was created and no role was assigned to anybody. The SV Heinersreuth
Supabase project was not touched. Cloudflare is the relevant host for steps 6 and 8.
