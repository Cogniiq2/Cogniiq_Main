# Client onboarding (AI Receptionist) — architecture and operations

Status: implemented in source, **not deployed**. Migration `20261124120000_client_onboarding_bridge.sql`
and the Edge Function `client-onboarding-invite` both need explicit owner approval before they go
to production.

## 1. What it does

| Who | Where | What |
|---|---|---|
| Owner | `/admin/finance/customers/:customerId/services/ai_receptionist` → Übersicht → „Kunden-Onboarding“ | link portal organization, compose/preview/test/send invitation (DE/EN, desktop/mobile preview, confirm step), reminders, revoke/renew, communication history, review answers (approve / request changes), follow-up requests |
| Customer | `/app/setup` (`/app/setup/:engagementId`), card on `/app`, notice on legacy `/app/onboarding` | 5-step intake + review/submit, server-side draft autosave with resume, opening-hours editor, answer follow-up requests, project timeline |

## 2. Data flow (non-negotiable)

```
customer answer (draft) ──submit──▶ submitted ──owner approve──▶ approved
                                         │                          │
                                         └─request changes──▶ changes_requested
approved + mapped question ──owner_set_engagement_field()──▶ owner_engagement_fields (canonical)
                                                            └─▶ activity log + go-live gate
```

- `owner_service_engagements` and its fields/tasks stay canonical. The customer can never write
  them; the only path is the owner's approval, which goes through the **same** RPC as a manual edit.
- Unmapped answers (opening hours, FAQ, tone, …) stay as the approved customer record.
- **Review lifecycle is enforced in the database** (`owner_onboarding_review`):
  - nothing is reviewable before the customer's first submission (intake `not_started`/`in_progress`);
  - only answers in status `submitted` (or already `approved`) can be decided on — a draft, or an
    answer the customer is reworking after a change request, is refused;
  - every approval carries the exact value the owner saw (`expected_value`); if the customer
    changed and resubmitted it in between, the approval is refused (`40001`) and the screen reloads;
  - partial reviews are allowed (approve some while others are sent back), re-approval of an
    unchanged answer is a no-op, and a resubmission keeps already approved answers approved.
- A customer submission changes no task, no field, no lifecycle and triggers no telephony,
  agent deployment or integration.

## 3. Data model (migration 20261124120000)

All tables: RLS on, no policies, no grants to `anon`/`authenticated`; access only via RPCs.

| table | purpose |
|---|---|
| `client_onboarding_questions` | seeded catalogue (30 German questions, 5 stages, `target_field_code` mapping, healthcare-only flag) |
| `client_onboarding_intakes` | one per engagement: status, stage, optimistic `version` |
| `client_onboarding_answers` | value (jsonb), status, owner comment, approved value, applied field |
| `client_onboarding_requests` | owner follow-up questions, optional linked task (set to `waiting_for_client`) |
| `client_onboarding_invitations` | engagement-level invitation log, links to the existing `client_invitations` row |
| `client_onboarding_messages` | every email attempt: kind, test flag, recipient, idempotency key, provider status, **link kind** (`activation`/`login`/`portal`) and **link expiry** |

Portal access reuses `client_invitations` + `claim_my_client_invitations()`; no new account
mechanism, no duplicate org/user/invitation. An existing user is never re-created.

The canonical customer must be linked to an **existing** organization
(`owner_link_customer_organization`, once, never moves, never creates). Production today: the one
AI Receptionist customer has no `organization_id`, so the owner must link it (or create the
portal workspace via the existing client wizard) before inviting.

## 4. Access invitation vs. email link — two different validities

| | validity | where it is shown |
|---|---|---|
| Portal invitation (`client_invitations`, role `member`) | 30 days, extended on every new invitation email | owner panel: „Portal-Einladung gültig bis …“ |
| Activation link inside the email (Supabase `generateLink`) | the project's Auth → Email → **Email OTP expiration** (typically 1 h; max 24 h) | owner panel: „Aktivierungslink gültig bis ca. …“ / „Aktivierungslink abgelaufen“, history: „mit Aktivierungslink“ |

The link expiry is recorded per message from `AUTH_LINK_TTL_SECONDS`, which must equal the Supabase
setting (default 3600 s — conservative: it can only under-state validity).

**„Neuen Aktivierungslink senden“** (owner panel, per pending invitation) sends a new invitation email.
The database reuses the **same** pending `client_invitations` row (extends it), supersedes the
previous onboarding-invitation row, and the Edge Function picks the link by account state:

| recipient account | link |
|---|---|
| none | `generateLink(invite)` — creates the single auth user |
| exists, never signed in (old link unused/expired) | `generateLink(magiclink)` to the same set-password page |
| has signed in before | normal login (`/app/login?redirectTo=/app/setup`) |

No path creates a second account or a second membership (SQL test T13b: one portal invitation per
address after repeated sends, one membership after repeated claims).

## 5. Testing as the owner vs. testing the real customer flow

- **„Test an mich senden“** always goes to the signed-in owner's own address and contains no auth
  link. It verifies wording, layout and delivery only. The email and the composer say so: a Cogniiq
  staff account is not a member of the customer organization, so `/app/setup` shows staff a
  dedicated notice instead of the customer view.
- **Real customer flow:** add a mailbox you control as a **contact of the organization**
  (`/admin/clients/:organizationId` → Kontakte). Organization contacts are valid recipients
  (server-checked, tenant-bound). Send it the real invitation, open the link in a **separate browser
  profile**, and you go through exactly what the customer sees. Prefer a dedicated **test customer +
  test organization**: inviting a Cogniiq mailbox into a real customer's organization makes it a
  member of that organization until you remove it.

## 6. Security properties (tested in `.github/scripts/sql/client-onboarding-bridge-tests.sql`)

T1–T17 (+T7b, T8c, T9b, T11b, T13b, T15b) cover: no anon access; uniform refusal for non-members;
viewer read-only; cross-tenant isolation incl. users in two orgs; customers cannot reach
owner/service RPCs or engagement fields; **no review before submission (T8c)**; required-field check
and idempotent submit; approval as the only write path **with the exact reviewed value (T10)**;
changes loop; **partial review, drafts under rework refused, resubmission reviewable, approved
answers kept (T11b)**; requests; recipient validation incl. foreign-org contacts, idempotency, rate
limits, tests forced to the owner; **fresh activation links without duplicate invitations or
memberships, link kind by account state, link expiry recorded separately from the 30-day invitation
(T13b)**; service-role-only provider results (accepted is final); claim flow; revocation; explicit
linking; P0 helpers remain closed; legacy portal tables untouched. Runs under emulated Supabase
default grants on PostgreSQL 17 (CI job `client-onboarding-bridge-sql-tests`).

## 7. Email

One template module (`supabase/functions/_shared/clientOnboarding/emailTemplate.ts`, re-exported in
`src/lib/clientOnboarding`) for preview and send. No images, no tracking. The owner sees „Vom
E-Mail-Anbieter angenommen“ — never delivered/opened/read. The Edge Function only imports from
`supabase/functions/_shared` (no cross-directory import into `src/`). See
`supabase/functions/client-onboarding-invite/README.md`.

## 8. Legacy portal onboarding

`businesses`, `onboarding_sessions`, `receptionist_configs` remain untouched and keep working.
They are read **only** as prefill suggestions; a suggestion is stored only once the customer edits
or moves on. `/app/onboarding` shows a notice linking to the guided setup when one exists.

## 9. Not included (by decision)

- **Customer document upload**: `customer-document-upload` is an internal-staff flow
  (`is_platform_admin_as`), there is no malware scanning, and customers have no storage policy.
  Blocked; the intake asks for public information only and tells customers not to enter patient
  data, passwords or credentials.
- **Automatic reminders** (cron): reminders are owner-triggered only.
- **Customer go-live approval action**: the timeline shows „Ihre Freigabe“ from the real lifecycle;
  a customer-side approval button is a later phase.

## 10. Exact deployment steps (each needs explicit owner approval)

### Why the branch matters

`supabase-production-migration.yml` is `workflow_dispatch`. GitHub runs the workflow file — its
target dropdown, its bash allowlist and `.github/scripts/lib/supabase-migration-allowlist.mjs` —
from the branch chosen in **„Use workflow from“**. The migration SQL comes from `source_ref`.
`20261124120000` and its allowlist entry exist **only on `claude/client-onboarding-system`** until
PR #109 is merged, so a run „from main“ refuses the target (fail-closed, nothing happens).

The gate **„Pin and verify source revision“** (this PR) makes the revision exact:
- `expected_source_sha` (full 40-char SHA) must equal what `source_ref` resolves to — **required for
  `apply`**, recommended for every mode;
- the target SQL must be byte-identical in the workflow revision and in `source_ref`, so allowlist
  metadata can never describe other SQL than the one applied;
- the run summary prints workflow ref/SHA, resolved source SHA and the migration's sha256.

A push to the branch between dry run and apply changes the SHA; apply then refuses. Freeze the
branch (no pushes) from step 2 until step 4, or start again from step 2.

### Option A — pre-merge (PR #109 stays open)

0. Wait for PR #109 CI to be green. Note the PR head commit: `git rev-parse origin/claude/client-onboarding-system` → `<SHA>`.
1. **Read-only pre-checks** (Supabase dashboard): Auth → Email → *Email OTP expiration* (note the
   seconds); Auth → URL configuration → redirect URLs include `https://cogniiq.de/auth/confirmed`
   (already required by `admin-provision-client`).
2. Actions → *Supabase Production Migration* → **Use workflow from: `claude/client-onboarding-system`**
   - `source_ref`: `claude/client-onboarding-system`
   - `expected_source_sha`: `<SHA>`
   - `target_migration`: `20261124120000_client_onboarding_bridge.sql`
   - `mode`: `backup-only` → verify the encrypted backup artifact and restore-point gates passed.
3. Same inputs, `mode`: `dry-run` → verify the summary shows the same `<SHA>` and sha256, the dry run
   lists exactly one migration (`20261124120000`) and the dependency gate passed.
4. Same inputs, `mode`: `apply`, `confirmation`: `APPLY_MIGRATION_20261124120000`.
5. Read-only verification (SQL editor):
   `select version from supabase_migrations.schema_migrations where version = '20261124120000';`
   and `select count(*) from public.client_onboarding_questions;` → 30.
6. Edge Function (from a checkout of `<SHA>`):
   ```bash
   supabase secrets set AUTH_LINK_TTL_SECONDS=<seconds from step 1> --project-ref lqgtmoulqzmrhglabrms
   supabase functions deploy client-onboarding-invite --project-ref lqgtmoulqzmrhglabrms
   ```
   (JWT verification stays on; no new secret — `RESEND_API_KEY`, `EMAIL_FROM`, `PUBLIC_APP_URL`
   already exist.)
7. Merge PR #109 (Cloudflare deploys the frontend). Until then the database objects exist but no
   UI calls them; the migration is additive and safe to have in place first.
8. Pilot (§11) before inviting a real customer.

### Option B — post-merge

Merge PR #109 first (frontend panels show „noch nicht aktiviert“ until the migration exists), then
run steps 2–4 with **Use workflow from: `main`**, `source_ref: main`, `expected_source_sha` = the
merge commit on `main`, then steps 5–6 and 8.

Option A is recommended: the database and function are in place and verified before any UI points
at them.

### Rollback

The migration is additive (new tables/functions only; no existing object altered). If the pilot
fails, disable the feature by not merging/reverting the frontend; the encrypted backup from step 2
is the restore point. Never run destructive SQL in production without a separate approval.

## 11. End-to-end pilot (realistic, before the first real customer)

Use a **test customer**, never a real one. Two browser profiles: **Owner** and **Customer**.

| # | Who | Action | Expected |
|---|---|---|---|
| 1 | Owner | Create a test portal workspace via the existing client wizard (`/admin/clients/new`) and a test customer in Kundenstamm; add the AI Receptionist service to that customer | engagement exists, lifecycle `lead` |
| 2 | Owner | Engagement → Kunden-Onboarding → link the test organization | link chooser disappears; no new organization created |
| 3 | Owner | `/admin/clients/:org` → Kontakte: add `pilot+1@<your-domain>` | contact appears as recipient „Kontakt der Organisation“ |
| 4 | Owner | Composer → „Test an mich senden“ | mail at owner address, marked TEST, no auth link; history: Test · „mit Portal-Link (Test)“ |
| 5 | Owner | Composer → invitation to `pilot+1@…` → confirm → „Jetzt senden“; double-click on purpose | exactly one history row „Vom E-Mail-Anbieter angenommen · mit Aktivierungslink“; panel shows invitation (30 days) and link expiry separately |
| 6 | Customer | Open the link → set password | lands in the portal; owner panel: „Portalzugang aktiv“ |
| 7 | Owner | Repeat 5 for `pilot+2@…`, **wait until the activation link has expired**, then „Neuen Aktivierungslink senden“ | panel showed „Aktivierungslink abgelaufen“; the new mail's link works (magic-link path); still one portal invitation, one membership |
| 8 | Customer | Fill step 1–2, close the browser, reopen on a phone | answers kept, resumes on the same step |
| 9 | Customer | Open the intake in two tabs, edit in both | stale tab shows the conflict notice; no overwrite |
| 10 | Owner | Try to review while the customer is still drafting | no decisions offered; server would refuse |
| 11 | Customer | Submit | „Übermittelt – wird geprüft“; owner sees answers |
| 12 | Owner | Approve company name; request changes on one answer with a comment | engagement field „Offizieller Praxisname“ updated, activity logged; customer sees the comment |
| 13 | Customer | Edit the flagged answer, resubmit | approved answers stay approved |
| 14 | Owner | Follow-up request linked to a task; send it by email | task „Wartet auf Kunde“; customer answers in the portal; owner „Antwort übernehmen“ |
| 15 | Owner | Revoke the `pilot+2` invitation (if not yet activated) | link no longer grants access; existing members unaffected |
| 16 | — | Viewer role (read-only) | no admin UI changes member roles today; covered by SQL test T6, not part of the manual pilot |
| 17 | Owner | Clean up: remove pilot members/contacts from the test organization | nothing left in real customer data |

Record the result of every row in the PR before the first real invitation.
