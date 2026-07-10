# Phase 0 Security Audit

Phase 0 introduces Auth, platform roles, tenant tables, and admin RLS. Phase 0.1 adds hardening in `20260710133000_phase0_security_hardening.sql` because the original migration may already have been applied.

## Critical Findings And Remediation

| Finding | Risk | Phase 0.1 state |
| --- | --- | --- |
| `create_organization_for_user` was granted to `authenticated` | Customer-callable org provisioning before Stripe/payment | Revoked from `anon/authenticated`; granted only to `service_role`; function also rejects non-database/non-service callers |
| Existing `auth.users` were not backfilled | Existing accounts could fail closed or lack profiles | Idempotent backfill creates missing customer profiles only |
| Auth profile trigger handled insert only | Email/profile metadata could become stale | Replaced with insert/update trigger for email and safe display metadata |
| RLS row policy was treated as column protection | Customers could attempt protected column updates | Column grants plus protected-column triggers added |
| Organization `updated_at` was frontend-writable | Client could forge audit timestamps | Removed from column grants and protected by trigger |
| Final org owner removal was not blocked | Tenant could be left without active owner | Membership guard blocks delete/demotion/suspension of final active owner |
| Auth user deletion could cascade through owner profiles | Final platform/org owners could be removed accidentally | Profile delete guard blocks final Cogniiq owner and final active org owner deletes |
| RLS verification file was comment-only | No reproducible attack checks | Replaced with transaction-safe negative/positive SQL tests |
| n8n URLs remain browser-visible | Public webhook abuse/spam risk | Documented as unresolved; next phase must replace with dedicated Edge Functions |

## Table Grant Matrix

| Table | `public`/`anon` | `authenticated` | `service_role` |
| --- | --- | --- | --- |
| `profiles` | no table access | `select`; update only `full_name`, `avatar_url`, `phone`; RLS self/admin | backend bypass only |
| `organizations` | no table access | `select`; update only `name`, `slug`; RLS member/admin | backend bypass only |
| `organization_members` | no table access | `select`, `insert`, `delete`, update only `role`, `status`; RLS plus guard trigger | backend bypass only |
| `tasks` | no anon access | CRUD only when `is_platform_admin()` passes | backend bypass only |
| `execution_days` | no anon access | CRUD only when `is_platform_admin()` passes | backend bypass only |
| `execution_tasks` | no anon access | CRUD only when `is_platform_admin()` passes | backend bypass only |
| `oura_connections` | no anon/auth access | no browser table access | server-side token access only |
| Oura metric tables | no anon access | `select` only for platform admins | sync function writes server-side |

## Security-Definer Functions

| Function | Purpose | Necessity | Caller grants | Notes |
| --- | --- | --- | --- | --- |
| `is_platform_owner()` | Owner role helper | Avoids profile RLS recursion | `authenticated`, `service_role` | Safe search path; reads UUID-bound profile role |
| `is_platform_admin()` | Admin/owner helper | Required by admin table policies | `authenticated`, `service_role` | Safe search path; fails false for missing profile |
| `is_organization_member(uuid)` | Tenant membership helper | Avoids recursive membership RLS | `authenticated`, `service_role` | Uses `auth.uid()` and active memberships |
| `has_organization_role(uuid, organization_role[])` | Tenant role helper | Avoids recursive membership RLS | `authenticated`, `service_role` | Input is target org plus allowed enum roles |
| `current_user_organization_ids()` | App bootstrap org ids | Avoids recursive membership RLS | `authenticated`, `service_role` | Returns only current user's active org ids |
| `create_organization_for_user(uuid,text)` | Trusted org provisioning | Future backend/manual provisioning | `service_role` only | Also rejects non-service/non-database callers |
| `generate_daily_execution_plan(date)` | Internal Execution OS generator | Needs inserts behind admin RPC | `authenticated` | Function internally checks `is_platform_admin()` |
| `sync_auth_user_profile()` | Auth trigger | Required for auth schema trigger | no browser grants | Syncs profile/email; never role metadata |

Trigger guard functions are not browser-callable and have execute revoked from `public`, `anon`, and `authenticated`.

## Direct n8n Exposure

| Source | Destination key | Payload category | Required replacement |
| --- | --- | --- | --- |
| `src/components/ContactSection.tsx` | `N8N_ENDPOINTS.contact` | contact form lead | `submit-contact` |
| `src/pages/KontaktPage.tsx` | `N8N_ENDPOINTS.contact` | contact page lead | `submit-contact` |
| `src/components/FAQQuestionModal.tsx` | `N8N_ENDPOINTS.faqQuestion` | FAQ question | `submit-faq-question` |
| `src/pages/KiTelefonassistentDemoPage.tsx` | `N8N_ENDPOINTS.receptionistDemo` | demo booking | `submit-receptionist-demo` |

Centralization is not a security fix. The URLs remain public and need bot protection, rate limits, payload schemas, and safe backend-only forwarding.

## Oura Audit

- Browser clients do not read `oura_connections` and therefore do not receive Oura access or refresh tokens.
- `sync-oura` uses `SUPABASE_SERVICE_ROLE_KEY` only inside the Edge Function.
- The function requires a signed-in Supabase user token and checks `profiles.platform_role` server-side before syncing.
- Each Oura endpoint sync fails independently and returns per-endpoint counts/errors.
- The external `oura-callback` function is not present in this repository and remains unverified here.
- `supabase/config.toml` keeps gateway JWT verification off for `sync-oura`; the function performs its own admin JWT verification so CORS preflight and browser calls are not broken by the gateway.

## Environment Matrix

| Variable | Location | Secret? | Notes |
| --- | --- | --- | --- |
| `VITE_SUPABASE_URL` | browser | no | Required to initialize Supabase client |
| `VITE_SUPABASE_ANON_KEY` | browser | no | Public anon key; RLS remains the boundary |
| `VITE_OURA_CLIENT_ID` | browser | no | OAuth client id metadata |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge/server only | yes | Never expose to browser |
| Oura client secret | Edge/server only | yes | Expected in callback function, not present here |
| n8n auth tokens | Edge/server only | yes | Not implemented yet |

No service-role key, Stripe secret, Vapi private key, or Oura refresh/access token should appear in frontend source.
