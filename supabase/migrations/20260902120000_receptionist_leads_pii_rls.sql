-- =============================================================================
-- Receptionist lead PII — row-level-security boundary
-- =============================================================================
-- WHY THIS MIGRATION EXISTS
-- --------------------------
-- 20260730031350_create_cogniiq_receptionist_leads.sql creates
-- public.cogniiq_receptionist_leads and stops there: no `enable row level
-- security`, no policy, no grant statement. On Supabase the `public` schema
-- carries default privileges that grant ALL on every new table to `anon` and
-- `authenticated`, so a table created without an explicit REVOKE inherits full
-- CRUD for the anonymous role. The table therefore shipped wide open.
--
-- REAL EXPOSURE THIS MIGRATION FIXES (verified read-only against the hosted
-- project `lqgtmoulqzmrhglabrms` before a line of this file was written)
-- ---------------------------------------------------------------------------
--   * pg_class.relrowsecurity = FALSE — RLS was never turned on, not merely
--     "enabled with no policies". pg_policies holds zero rows for this table.
--   * information_schema.role_table_grants: `anon` AND `authenticated` each hold
--     DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE.
--   * The table holds 50 live rows of third-party contact PII: contact_person,
--     email, phone, street_address, postal_code, city, plus the commercial
--     assessment (fit_score, fit_notes, outreach_channel, status).
--   * The identity sequence public.cogniiq_receptionist_leads_id_seq likewise
--     grants USAGE/SELECT/UPDATE to `anon`, so the primary-key counter itself is
--     resettable by an anonymous caller.
--   * Supabase's own database linter independently reports this table at
--     level=ERROR, facing=EXTERNAL ("rls_disabled_in_public").
--
-- Concretely: any request bearing only the public anon API key — which ships in
-- the browser bundle and is public by design — can today read every lead's name,
-- e-mail address, telephone number and postal address, rewrite them, DELETE them
-- or TRUNCATE the table. This is the same defect class 20260731122000
-- (Case D convergence) fixed for execution_days / execution_tasks /
-- execution_templates / execution_template_tasks; this table was created one day
-- before that audit landed and is the remaining instance of it. Unlike those
-- tables it holds personal data of identifiable natural persons, which makes the
-- exposure a DSGVO Art. 32 matter rather than only an integrity one.
--
-- PROVENANCE OF THE 50 ROWS, AND WHY NO ANONYMOUS INSERT IS PRESERVED
-- ---------------------------------------------------------------------------
-- There are real rows but no repository caller, so the ingestion path was traced
-- before deciding what access to keep. Read-only evidence, no PII inspected:
--   * All 50 rows carry the SAME xmin (one single transaction) and occupy a
--     contiguous id range 1..50 with the sequence at exactly 50 — one bulk load,
--     with no gaps from rolled-back or deleted inserts.
--   * pg_stat_all_tables over the table's whole lifetime (the database's stats
--     were last reset 2026-05-22, well before the table existed on 2026-07-30):
--     n_tup_ins = 50, n_tup_upd = 0, n_tup_del = 0. Nothing has been inserted,
--     changed or removed since the initial load a month ago.
--   * Every row shares one sourced_date (2026-07-30), status 'new' and country
--     'DE' — a single sourcing run that has never been worked.
--   * 24h of the unified log stream (~13k events across edge_logs, postgrest_logs,
--     postgres_logs and function_logs) contains no reference to the table, and
--     every /rest/v1/ path in that window maps to a known in-repo surface.
--   * The public contact form does NOT reach Supabase at all: ContactSection.tsx
--     and FAQQuestionModal.tsx POST to https://n8n.cogniiq.co/webhook/*, and
--     src/lib/legal-content.tsx documents that contact enquiries are processed in
--     that self-hosted n8n environment. So no public submission path writes here.
--   * No lead-ingestion script exists anywhere in the repository, at any commit
--     in its history.
-- The table is therefore an internally curated outbound-prospect list, loaded
-- once by the operator. Because no anonymous INSERT path is in evidence, none is
-- preserved: this migration removes client access outright rather than keeping a
-- narrowed "just in case" grant for a caller that cannot be shown to exist. The
-- repository's established server-side pattern (SUPABASE_SERVICE_ROLE_KEY held as
-- an Edge Function secret) remains fully open for any future ingestion, and
-- service_role is deliberately left untouched below.
--
-- RESIDUAL UNCERTAINTY, STATED PLAINLY: the log window Supabase exposes is capped
-- at 24 hours, and this project has an out-of-repo automation environment
-- (n8n.cogniiq.co) whose workflow definitions are not in this repository and
-- cannot be inspected from here. If some n8n workflow writes these leads using
-- the ANON key, this migration would break it. Three things make that unlikely
-- rather than merely unverified: nothing has been written to the table in the
-- month since the single bulk load, so no such workflow is currently active; the
-- repository's server-side convention is the service-role key, which this
-- migration does not touch; and an n8n instance is a server, so it has no reason
-- to hold only the browser key. Should such a workflow surface, the correct fix
-- is to move it onto the service-role key, not to restore anonymous write access
-- to a table of personal data.
--
-- ACCESS MODEL AFTER THIS MIGRATION
-- ---------------------------------------------------------------------------
--   anon           -> nothing at all (all grants revoked; RLS on, no anon policy)
--   authenticated  -> only when public.is_platform_owner() is true; an ordinary
--                     customer gets zero rows and every write is refused
--   service_role   -> unchanged (BYPASSRLS + full grants), so trusted server-side
--                     ingestion and any future automation keep working
--   postgres /     -> unchanged, so Supabase SQL-editor maintenance stays possible
--   supabase_admin
--
-- WHY is_platform_owner() AND NOT is_platform_admin()
-- ---------------------------------------------------------------------------
-- Both are canonical helpers from 20260710120000; neither is invented here.
-- 20260722120000 gates every owner-finance table on is_platform_owner() and says
-- so explicitly ("Owner-only ... NOT is_platform_admin"), while 20260731122000
-- used is_platform_admin() for operational scheduling tables. This table is
-- third-party personal data, so it takes the stricter of the two. Hosted profiles
-- currently hold 2 cogniiq_owner and 0 cogniiq_admin, so the choice costs nothing
-- operationally today; what it buys is that adding a cogniiq_admin later does not
-- silently widen access to lead PII.
--
-- HOW THE HELPER BEHAVES HERE (verified against hosted)
-- ---------------------------------------------------------------------------
-- is_platform_owner() is SECURITY DEFINER, owned by `postgres` (which carries
-- BYPASSRLS), STABLE, and pins `search_path = public`. Inside this policy that
-- matters three ways: its read of public.profiles bypasses that table's own RLS,
-- so the policy cannot recurse and returns a correct answer even though the
-- caller may only see their own profile row; auth.uid() still resolves the
-- CALLING user, because the request JWT is session state that SECURITY DEFINER
-- does not change; and the pinned search_path means the body cannot be redirected
-- by a caller-controlled search_path. 20260710133000 already revoked EXECUTE on
-- it from public and anon — which is exactly why the policy below is scoped
-- `to authenticated`: a policy left open `to public` would make anon evaluate a
-- function it may not execute and surface a permission error instead of a clean
-- denial. anon is refused at the grant layer regardless.
--
-- WHY *NOT* `force row level security`
-- ---------------------------------------------------------------------------
-- Deliberately omitted, and not merely for consistency with the other 97
-- RLS-enabled tables in this database (0 of 113 use FORCE). FORCE RLS constrains
-- only the TABLE OWNER. This table is owned by `postgres`, and hosted `postgres`
-- has rolbypassrls = true, which defeats FORCE — so adding it would change no
-- caller's access at all. The roles this migration is defending against, `anon`
-- and `authenticated`, both have rolbypassrls = false and are already fully
-- constrained by ordinary RLS. Adding FORCE would be an inert deviation from the
-- established model that also risks breaking SQL-editor maintenance if `postgres`
-- ever lost BYPASSRLS.
--
-- SAFETY
-- ---------------------------------------------------------------------------
-- Forward-only and additive. No existing migration is edited. No lead row is
-- read, rewritten or deleted; no column is added, dropped or altered; the table's
-- shape and all 50 hosted rows are untouched. Every statement is idempotent, so a
-- replay is a no-op.
-- =============================================================================

-- Fail closed rather than silently shipping a half-applied boundary.
do $$
begin
  if to_regclass('public.cogniiq_receptionist_leads') is null then
    raise exception
      'public.cogniiq_receptionist_leads is missing. Apply 20260730031350_create_cogniiq_receptionist_leads.sql first.';
  end if;

  if to_regprocedure('public.is_platform_owner()') is null then
    raise exception
      'public.is_platform_owner() is missing. Apply 20260710120000_phase0_auth_tenancy_rls.sql first.';
  end if;
end;
$$;

alter table public.cogniiq_receptionist_leads enable row level security;

-- One policy, `for all`, gated on the canonical helper in BOTH clauses: USING
-- decides which rows a caller may see or target, WITH CHECK decides which rows a
-- caller may leave behind. Supplying only USING would let an owner write rows
-- they could not then read; omitting WITH CHECK on a `for all` policy silently
-- makes INSERT unreachable rather than owner-only.
drop policy if exists cogniiq_receptionist_leads_owner_all on public.cogniiq_receptionist_leads;
create policy cogniiq_receptionist_leads_owner_all on public.cogniiq_receptionist_leads
  for all to authenticated
  using (public.is_platform_owner())
  with check (public.is_platform_owner());

-- RLS is only half the boundary. A policy never runs for a role the grant layer
-- already refused, and — decisively for this table — TRUNCATE is NOT filtered by
-- RLS at all: it is governed purely by the table grant, so an enabled policy
-- would not have stopped an anonymous TRUNCATE from emptying all 50 rows. The
-- blanket REVOKE below is what removes it. TRUNCATE and REFERENCES are then not
-- re-granted to any browser-reachable role, so no client can drop the table's
-- contents wholesale or hang a foreign key off lead PII.
revoke all on table public.cogniiq_receptionist_leads from public, anon, authenticated;
grant select, insert, update, delete on table public.cogniiq_receptionist_leads to authenticated;
grant select, insert, update, delete on table public.cogniiq_receptionist_leads to service_role;

-- DELETE is granted to the internal owner surface on purpose, unlike the
-- owner-finance tables that withhold it: those preserve accounting history, while
-- this table is nothing but third-party personal data and a DSGVO Art. 17 erasure
-- request must be satisfiable without reaching for the service-role key.

-- The identity sequence is a separate securable that `revoke ... on table` does
-- not reach. `anon` holds USAGE/SELECT/UPDATE on it today, and UPDATE alone is
-- enough to setval() the primary-key counter into collision. Identity-column
-- generation is performed internally on behalf of the inserting statement and
-- does not consult sequence privileges, so revoking these costs the owner INSERT
-- path nothing — proven by the regression suite, which inserts as an owner after
-- this migration has run.
revoke all on sequence public.cogniiq_receptionist_leads_id_seq from public, anon, authenticated;
grant usage, select on sequence public.cogniiq_receptionist_leads_id_seq to service_role;

comment on table public.cogniiq_receptionist_leads is
  'Internally curated outbound prospect list. Contains third-party contact PII: readable and writable only by public.is_platform_owner() holders and the service role. No anonymous or ordinary-customer access, and no public submission path writes here (the website contact form posts to the external n8n environment, not to Supabase).';
