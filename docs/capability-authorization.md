# Reusable multi-tenant capability authorization

Status: implemented, **not deployed**. The migration
`supabase/migrations/20260804120000_reusable_capability_authorization.sql` has not been applied to
any hosted Supabase project.

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

1. Review and merge the pull request.
2. Apply `20260804120000_reusable_capability_authorization.sql` to the hosted Cogniiq Supabase
   project. It is additive and forward-only; existing customers are unaffected on application
   because every existing member has zero functional roles and therefore receives the baseline.
3. Verify: existing customers still reach `/app`, `/app/documents` and `/app/billing`.
4. Deploy the frontend.
5. Only then, per customer: create the solution instance, call
   `apply_sports_club_role_presets(organization_id)`, and assign roles through
   **Kunden → Zugriff & Rollen**.

Steps 2–5 have **not** been performed. Nothing was applied, seeded or deployed.
