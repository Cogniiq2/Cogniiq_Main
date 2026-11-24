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
| `client_onboarding_messages` | every email attempt: kind, test flag, recipient, idempotency key, provider status |

Portal access reuses `client_invitations` + `claim_my_client_invitations()`; no new account
mechanism, no duplicate org/user/invitation. An existing user is never re-created.

The canonical customer must be linked to an **existing** organization
(`owner_link_customer_organization`, once, never moves, never creates). Production today: the one
AI Receptionist customer has no `organization_id`, so the owner must link it (or create the
portal workspace via the existing client wizard) before inviting.

## 4. Security properties (tested in `.github/scripts/sql/client-onboarding-bridge-tests.sql`)

T1–T17 cover: no anon access; non-members get a uniform refusal; viewer read-only; cross-tenant
isolation incl. users in two orgs; customers cannot reach owner/service RPCs or engagement fields;
required-field check and idempotent submit; approval as the only write path; changes loop and
locking of approved facts; requests; recipient validation, idempotency, rate limits, test mails
forced to the owner, activation-link gating; service-role-only provider results (accepted is
final); claim flow compatibility; revocation; explicit linking; P0 helpers remain closed and
legacy portal tables untouched. Runs under emulated Supabase default grants on PostgreSQL 17
(CI job `client-onboarding-bridge-sql-tests`).

## 5. Email

One template module (`src/lib/clientOnboarding/emailTemplate.ts`) for preview and send. No
images, no tracking. Status shown to the owner is „Vom E-Mail-Anbieter angenommen“ — never
delivered/opened/read. See `supabase/functions/client-onboarding-invite/README.md`.

## 6. Legacy portal onboarding

`businesses`, `onboarding_sessions`, `receptionist_configs` remain untouched and keep working.
They are read **only** as prefill suggestions; a suggestion is stored only once the customer edits
or moves on. `/app/onboarding` shows a notice linking to the guided setup when one exists.

## 7. Not included (by decision)

- **Customer document upload**: `customer-document-upload` is an internal-staff flow
  (`is_platform_admin_as`), there is no malware scanning, and customers have no storage policy.
  Opening it to customers needs a separate authorization path and a scanning decision. Blocked;
  the intake asks for public information only and tells customers not to send documents with
  patient data.
- **Automatic reminders** (cron): reminders are owner-triggered only.
- **UAT acceptance / go-live approval by the customer**: the timeline shows „Ihre Freigabe“ from
  the real lifecycle; a customer-side approval action is a later phase.

## 8. Deployment order (owner approval required for each step)

1. Production backup (workflow `supabase-production-migration.yml`, mode `backup-only`).
2. Dry run, then apply `20261124120000_client_onboarding_bridge.sql` via the same workflow
   (allowlisted; requires 20260710120000, 20260710133000, 20260711120000, 20260721120000,
   20260723120000, 20260724120000, 20260830120000 — all recorded in production).
3. Deploy Edge Function `client-onboarding-invite` (JWT verification on) from the repo root.
4. Merge the frontend (Cloudflare deploy).
5. Manual checklist below with a test customer before inviting a real one.

Env: `RESEND_API_KEY`, `EMAIL_FROM`, `PUBLIC_APP_URL` already exist for the offer worker;
optional `CUSTOMER_PORTAL_INVITE_REDIRECT`, `ONBOARDING_REPLY_TO`. No new secret is required.

## 9. Manual verification checklist

- [ ] Link a test customer to a test organization; link control disappears afterwards.
- [ ] „Test an mich senden“ arrives at the owner address, marked TEST, button opens `/app/setup`.
- [ ] Real invitation to a new address: activation link sets a password, lands in the portal,
      `/app/setup` shows the intake; owner sees „Portalzugang aktiv“.
- [ ] Invitation to an existing account: login link, no second account, access after login.
- [ ] Double-click „Jetzt senden“: one message row, one email.
- [ ] Draft autosave, reload on phone resumes on the same step.
- [ ] Two tabs: the stale tab gets the conflict notice, no overwrite.
- [ ] Submit → owner review → approve mapped answer → engagement field updated, activity logged.
- [ ] Request changes → customer sees the comment, edits, resubmits.
- [ ] Follow-up request with task → task shows „Wartet auf Kunde“; customer answers; owner accepts.
- [ ] Revoke pending invitation → link no longer grants access; existing members unaffected.
- [ ] Viewer member can read but not edit.
