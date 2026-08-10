-- =============================================================================
-- Customer platform — STAGING PREFLIGHT (strictly read-only)
-- =============================================================================
-- Verifies that a target database is in the exact state this release expects,
-- BEFORE anything is deployed against it. Every check is a SELECT: this script
-- creates nothing, alters nothing and writes nothing, so it is safe to run
-- against any environment including one that is already live.
--
-- Output is one line per check, `PASS: <label>` or `FAIL: <label>`.
-- scripts/staging/preflight.sh turns any FAIL into a non-zero exit.
--
-- What it answers:
--   1. Is the server new enough for the DDL this release uses?
--   2. Do the pre-existing schema dependencies this release builds on exist?
--   3. Which of the five migrations are already applied? (each is fingerprinted
--      by the objects it and only it creates)
--   4. Do the RPCs exist with the exact signatures the frontend and the Edge
--      Functions call?
--   5. Are the grants right — authenticated where intended, and service-role-only
--      functions genuinely unreachable to anon/authenticated?
--   6. Are the customer tables inaccessible directly (RLS on, no customer policy)?
--   7. Is the bucket private with the intended size and MIME restrictions?
--   8. Does every new SECURITY DEFINER function pin an empty search_path?
--   9. Case D (tasks/execution_*/oura_* legacy convergence, migration
--      20260731122000_case_d_legacy_convergence): do the 17 touched tables exist
--      with their required columns, RLS enabled, zero anon privileges,
--      authenticated access gated by is_platform_admin(), and service_role
--      access intact? Do the recalc trigger/functions exist with pinned
--      search_path? Does the migration ledger name exactly the five legacy
--      versions plus the convergence version, with no future-dated or
--      unrecognized (shadow) version present?
--  10. Reusable capability authorization (migration
--      20260804120000_reusable_capability_authorization): do the five new
--      authorization tables exist with RLS enabled, their primary/unique/
--      composite-foreign/check constraints and their indexes? Is the capability
--      catalog complete, with the expected keys and solution bindings and
--      nothing unrecognized? Do the new RPCs exist with exact signatures,
--      SECURITY DEFINER and a pinned search_path? Does anon get nothing at all,
--      does authenticated get exactly the intended minimum (SELECT only, no
--      client_invitation_roles, no membership_effective_capability_keys, but
--      current_user_portal_context yes)? Does claim_my_client_invitations still
--      carry the additive functional-role transfer? Do the required RLS policies
--      exist? And is the live data free of cross-organization assignments,
--      invalid invitation-role rows and duplicate capability/role keys?
--      The ledger must name version 20260804120000 exactly — not a generated
--      replacement timestamp.
--
-- Deliberately NOT checked here (they are not database state): Edge Function
-- deployment/health and frontend↔backend project agreement. Those live in
-- scripts/staging/verify-endpoints.mjs.
-- =============================================================================

\pset tuples_only on
\pset format unaligned
\set ON_ERROR_STOP on

-- Resolve role OIDs once. to_regrole() yields NULL for a role that does not
-- exist, which keeps has_*_privilege() from raising and lets a missing role be
-- reported as an ordinary FAIL instead of aborting the run.
with
roles as (
  select to_regrole('anon') as anon,
         to_regrole('authenticated') as authenticated,
         to_regrole('service_role') as service_role
),

-- A function's identity is (name, identity_arguments). Matching on the name
-- alone would pass for a function with a different, incompatible signature.
fn as (
  select p.oid,
         p.proname as name,
         pg_get_function_identity_arguments(p.oid) as args,
         p.prosecdef as security_definer,
         coalesce(array_to_string(p.proconfig, ','), '') as config,
         p.prosrc as body
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
),

-- Every RPC this release introduces, with the exact signature its callers use
-- and the grant posture it must have.
--   'authenticated' -> executable by authenticated, NOT by anon
--   'service_role'  -> executable by service_role, NOT by anon OR authenticated
expected_fn(name, args, audience) as (
  values
    -- migration 1: customer reads
    ('list_customer_projects', '', 'authenticated'),
    ('get_customer_project', 'p_project_id uuid', 'authenticated'),
    ('list_customer_project_milestones', 'p_project_id uuid', 'authenticated'),
    -- migration 1: owner writes
    ('create_customer_project_for_owner_customer', 'p_owner_customer_id uuid, p_title text, p_business_objective text, p_phase text', 'authenticated'),
    ('update_customer_project', 'p_project_id uuid, p_title text, p_business_objective text, p_phase text, p_status customer_project_status, p_progress_percent smallint, p_start_date date, p_target_date date, p_customer_safe_blocker_summary text, p_contact_profile_id uuid, p_contact_role_label text, p_contact_business_email text', 'authenticated'),
    ('set_customer_project_next_action', 'p_project_id uuid, p_summary text, p_owner customer_next_action_owner, p_due_date date', 'authenticated'),
    ('archive_customer_project', 'p_project_id uuid', 'authenticated'),
    ('create_customer_project_milestone', 'p_project_id uuid, p_title text, p_description text, p_target_date date, p_sort_order integer', 'authenticated'),
    ('update_customer_project_milestone', 'p_milestone_id uuid, p_title text, p_description text, p_status customer_milestone_status, p_target_date date, p_sort_order integer', 'authenticated'),
    ('delete_customer_project_milestone', 'p_milestone_id uuid', 'authenticated'),
    -- migration 2: customer read + owner writes
    ('list_customer_documents', 'p_project_id uuid', 'authenticated'),
    ('register_customer_document_from_owner_source', 'p_organization_id uuid, p_project_id uuid, p_category customer_document_category, p_title text, p_owner_generated_document_id uuid', 'authenticated'),
    ('set_customer_document_visibility', 'p_document_id uuid, p_visible boolean', 'authenticated'),
    ('archive_customer_document', 'p_document_id uuid', 'authenticated'),
    -- migration 2: service-role only. The payload of the first IS the storage
    -- location, so a browser-reachable grant here would defeat the Edge Function.
    ('is_organization_member_as', 'target_organization_id uuid, target_user_id uuid', 'service_role'),
    ('is_platform_admin_as', 'target_user_id uuid', 'service_role'),
    ('authorize_customer_document_download', 'p_caller_id uuid, p_document_id uuid', 'service_role'),
    ('record_customer_document_access', 'p_caller_id uuid, p_document_id uuid, p_event_type text', 'service_role'),
    ('register_customer_document_from_upload', 'p_caller_id uuid, p_organization_id uuid, p_project_id uuid, p_category customer_document_category, p_title text, p_storage_path text, p_content_type text, p_size_bytes bigint', 'service_role'),
    ('delete_unpublished_customer_document', 'p_caller_id uuid, p_document_id uuid', 'service_role'),
    -- migration 3
    ('list_customer_invoices', 'p_project_id uuid', 'authenticated'),
    ('link_customer_project_invoice', 'p_project_id uuid, p_invoice_id uuid', 'authenticated'),
    ('unlink_customer_project_invoice', 'p_project_id uuid, p_invoice_id uuid', 'authenticated'),
    -- migration 4
    ('assign_invoice_organization', 'p_invoice_id uuid, p_organization_id uuid', 'authenticated'),
    -- migration 5
    ('archive_customer_document_as', 'p_caller_id uuid, p_document_id uuid', 'service_role'),
    -- migration 20260804120000_reusable_capability_authorization
    -- membership_effective_capability_keys takes a MEMBERSHIP ID and does not re-scope to
    -- auth.uid(). Granting it to authenticated would let any signed-in user probe another
    -- organization's membership, so it is deliberately service-role only.
    ('membership_effective_capability_keys', 'p_membership_id uuid', 'service_role'),
    ('current_user_portal_context', '', 'authenticated'),
    ('admin_organization_access_overview', 'p_organization_id uuid', 'authenticated'),
    ('assign_organization_member_role', 'p_organization_member_id uuid, p_organization_role_id uuid', 'authenticated'),
    ('remove_organization_member_role', 'p_organization_member_id uuid, p_organization_role_id uuid', 'authenticated'),
    ('set_client_invitation_roles', 'p_invitation_id uuid, p_organization_role_ids uuid[]', 'authenticated'),
    ('upsert_organization_role', 'p_organization_id uuid, p_role_key text, p_label text, p_description text, p_capability_keys text[], p_sort_order integer', 'authenticated'),
    ('apply_sports_club_role_presets', 'p_organization_id uuid', 'authenticated'),
    -- Re-created (same signature, same return type) by the capability migration: its signature
    -- drifting would break every existing invitation claim.
    ('claim_my_client_invitations', '', 'authenticated')
),

resolved_fn as (
  select e.name, e.args, e.audience, f.oid, f.security_definer, f.config
  from expected_fn e
  left join fn f on f.name = e.name and f.args = e.args
),

-- Every table migration 20260731122000_case_d_legacy_convergence.sql touches,
-- with the key columns its precondition checks (or, for freshly-created tables,
-- its CREATE TABLE) require to exist.
case_d_table(name, key_columns) as (
  values
    ('tasks', array['id','title','status','priority','created_at']),
    ('execution_days', array['id','user_id','date','weekday','status','total_points','completed_points','score_percent']),
    ('execution_tasks', array['id','execution_day_id','title','category','points','is_completed']),
    ('execution_templates', array['id','weekday','plan_type','title','is_active']),
    ('execution_template_tasks', array['id','template_id','title','category','points']),
    ('oura_connections', array['id','access_token','refresh_token']),
    ('oura_daily_sleep', array['id','connection_id','day','score','raw','synced_at']),
    ('oura_daily_readiness', array['id','connection_id','day','score','raw','synced_at']),
    ('oura_daily_activity', array['id','connection_id','day','score','steps','raw','synced_at']),
    ('oura_heart_rate', array['id','connection_id','timestamp','bpm','source','raw','synced_at']),
    ('oura_sleep_sessions', array['id','connection_id','oura_id','day','raw','synced_at']),
    ('oura_workouts', array['id','connection_id','oura_id','day','raw','synced_at']),
    ('oura_sessions', array['id','connection_id','oura_id','day','raw','synced_at']),
    ('oura_tags', array['id','connection_id','oura_id','day','raw','synced_at']),
    ('oura_spo2', array['id','connection_id','day','spo2_percentage','raw','synced_at']),
    ('oura_daily_stress', array['id','connection_id','day','raw','synced_at']),
    ('oura_daily_resilience', array['id','connection_id','day','raw','synced_at'])
),

-- Every repository migration version, as of this migration's rename to
-- 20260731122000. Used to detect a remote-only, generated-shadow, or
-- future-dated ledger row -- one that names no repository file at all.
case_d_known_version(version) as (
  values
    ('20260607194622'), ('20260607200426'), ('20260706121415'), ('20260706122833'),
    ('20260709120000'), ('20260710120000'), ('20260710133000'), ('20260711120000'),
    ('20260721120000'), ('20260722120000'), ('20260723120000'), ('20260723121000'),
    ('20260723122000'), ('20260723123000'), ('20260723124000'), ('20260723125000'),
    ('20260723126000'), ('20260723127000'), ('20260723128000'), ('20260724120000'),
    ('20260728120000'), ('20260728121000'), ('20260728122000'), ('20260728123000'),
    ('20260728124000'), ('20260730031350'), ('20260730120000'), ('20260730130000'),
    ('20260731120000'), ('20260731121000'), ('20260731122000'),
    ('20260804120000')
),

case_d_legacy_version(version) as (
  values
    ('20260607194622'), ('20260607200426'), ('20260706121415'),
    ('20260706122833'), ('20260709120000')
),

-- ---------------------------------------------------------------------------
-- 20260804120000_reusable_capability_authorization fingerprints
-- ---------------------------------------------------------------------------
-- The five tables the migration creates, with the primary key each must carry.
cap_table(name, pk_columns, authenticated_select) as (
  values
    ('capabilities',                   array['key'],                                        true),
    ('organization_roles',             array['id'],                                         true),
    ('organization_role_capabilities', array['organization_role_id','capability_key'],      true),
    ('organization_member_roles',      array['id'],                                         true),
    -- Internal CRM data: RPC-only, never granted to authenticated at all.
    ('client_invitation_roles',        array['id'],                                         false)
),

-- Named unique constraints. The two on the PRE-EXISTING tables are what the composite
-- foreign keys below reference; without them cross-organization safety is policy-only.
cap_unique_constraint(table_name, name) as (
  values
    ('organization_members',      'organization_members_id_organization_id_key'),
    ('client_invitations',        'client_invitations_id_organization_id_key'),
    ('organization_roles',        'organization_roles_org_key_unique'),
    ('organization_roles',        'organization_roles_id_organization_id_key'),
    ('organization_member_roles', 'organization_member_roles_unique'),
    ('client_invitation_roles',   'client_invitation_roles_unique')
),

-- Composite (two-column) foreign keys. These are what make a cross-organization assignment
-- structurally impossible — unenforceable by RLS bypass, service_role or the database owner.
cap_composite_fk(table_name, name, referenced) as (
  values
    ('organization_member_roles', 'organization_member_roles_member_fk',   'organization_members'),
    ('organization_member_roles', 'organization_member_roles_role_fk',     'organization_roles'),
    ('client_invitation_roles',   'client_invitation_roles_invitation_fk', 'client_invitations'),
    ('client_invitation_roles',   'client_invitation_roles_role_fk',       'organization_roles')
),

cap_check_constraint(table_name, name) as (
  values
    ('capabilities',       'capabilities_key_format'),
    ('capabilities',       'capabilities_label_not_blank'),
    ('organization_roles', 'organization_roles_role_key_format'),
    ('organization_roles', 'organization_roles_label_not_blank')
),

cap_index(name) as (
  values
    ('organization_roles_organization_id_idx'),
    ('organization_role_capabilities_capability_key_idx'),
    ('organization_member_roles_member_idx'),
    ('organization_member_roles_role_idx'),
    ('client_invitation_roles_invitation_idx'),
    ('capabilities_solution_catalog_key_idx')
),

cap_policy(table_name, name) as (
  values
    ('capabilities',                   'capabilities_select_authenticated'),
    ('capabilities',                   'capabilities_write_platform_admin'),
    ('organization_roles',             'organization_roles_select_member_or_admin'),
    ('organization_roles',             'organization_roles_write_platform_admin'),
    ('organization_role_capabilities', 'organization_role_capabilities_select_member_or_admin'),
    ('organization_role_capabilities', 'organization_role_capabilities_write_platform_admin'),
    ('organization_member_roles',      'organization_member_roles_select_member_or_admin'),
    ('organization_member_roles',      'organization_member_roles_write_platform_admin'),
    ('client_invitation_roles',        'client_invitation_roles_platform_admin_all')
),

-- The two helpers that are NOT SECURITY DEFINER and therefore cannot ride along in
-- resolved_fn, which asserts SECURITY DEFINER for everything it covers.
cap_helper_fn(name, args) as (
  values
    ('portal_baseline_capability_keys', ''),
    ('solution_status_entitles_capabilities', 'p_status text')
),

checks(section, ord, label, passed) as (

  -- ---------------------------------------------------------------- 1) server
  select '1 server', 1,
         'PostgreSQL 15 or newer (column-specific ON DELETE SET NULL is used by migrations 1 and 2)',
         current_setting('server_version_num')::int >= 150000

  union all
  select '1 server', 2, 'pgcrypto/gen_random_uuid() is available',
         exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                 where p.proname = 'gen_random_uuid')

  -- ------------------------------------------------- 2) required dependencies
  union all
  select '2 dependency', 10, format('required table public.%s exists', t.name),
         to_regclass('public.' || t.name) is not null
  from (values ('organizations'), ('organization_members'), ('profiles'),
               ('client_engagements'), ('owner_customers'), ('owner_invoices'),
               ('owner_offers'), ('owner_generated_documents')) as t(name)

  union all
  select '2 dependency', 20, format('required helper public.%s() exists', h.name),
         exists (select 1 from fn where fn.name = h.name)
  from (values ('is_platform_admin'), ('is_organization_member'), ('set_updated_at')) as h(name)

  union all
  select '2 dependency', 30, format('required role %s exists', r.name),
         to_regrole(r.name) is not null
  from (values ('anon'), ('authenticated'), ('service_role')) as r(name)

  -- --------------------------------------------- 3) migrations already applied
  -- Fingerprinted by objects unique to each migration, so this is true state and
  -- not a claim read out of a migration ledger.
  union all
  select '3 migration', 100,
         '20260728120000_customer_project_core is applied (customer_projects + customer_project_milestones + enums)',
         to_regclass('public.customer_projects') is not null
         and to_regclass('public.customer_project_milestones') is not null
         and to_regtype('public.customer_project_status') is not null
         and to_regtype('public.customer_next_action_owner') is not null
         and to_regtype('public.customer_milestone_status') is not null

  union all
  select '3 migration', 101,
         '20260728121000_customer_documents is applied (customer_documents + access events + bucket)',
         to_regclass('public.customer_documents') is not null
         and to_regclass('public.customer_document_access_events') is not null
         and to_regtype('public.customer_document_category') is not null
         and exists (select 1 from storage.buckets where id = 'customer-documents')

  union all
  select '3 migration', 102,
         '20260728122000_customer_billing_link is applied (customer_project_invoices + org/id anchors)',
         to_regclass('public.customer_project_invoices') is not null
         and exists (select 1 from pg_constraint where conname = 'owner_invoices_org_id_unique')
         and exists (select 1 from pg_constraint where conname = 'owner_offers_org_id_unique')

  union all
  select '3 migration', 103,
         '20260728123000_owner_invoice_organization_assignment is applied (assign_invoice_organization)',
         exists (select 1 from fn where fn.name = 'assign_invoice_organization' and fn.args = 'p_invoice_id uuid, p_organization_id uuid')

  union all
  select '3 migration', 104,
         '20260728124000_customer_document_archive_service_role is applied (archive_customer_document_as)',
         exists (select 1 from fn where fn.name = 'archive_customer_document_as'
                 and fn.args = 'p_caller_id uuid, p_document_id uuid')

  union all
  select '3 migration', 105,
         '20260730120000_customer_project_organization_scope is applied (create_customer_project_for_organization)',
         exists (select 1 from fn where fn.name = 'create_customer_project_for_organization'
                 and fn.args = 'p_organization_id uuid, p_title text, p_business_objective text, p_phase text')

  union all
  select '3 migration', 106,
         '20260731120000_customer_document_publish_guard is applied (pointer uniqueness + category helper)',
         exists (select 1 from pg_class c join pg_index i on i.indexrelid = c.oid
                 where c.relname = 'customer_documents_owner_source_live_unique' and i.indisunique)
         and exists (select 1 from fn where fn.name = 'customer_document_category_matches_owner_source')

  union all
  select '3 migration', 107,
         '20260731121000_client_provisioning_identity is applied (identity helpers + candidate discovery)',
         exists (select 1 from fn where fn.name = 'normalize_client_identity_name' and fn.args = 'p_name text')
         and exists (select 1 from fn where fn.name = 'client_identity_email_domain' and fn.args = 'p_email text')
         and exists (select 1 from fn where fn.name = 'client_identity_website_host' and fn.args = 'p_website text')
         and exists (select 1 from fn where fn.name = 'find_client_organization_candidates')
         and exists (select 1 from fn where fn.name = 'provision_client_workspace_with_identity')

  union all
  -- The identity fix must NOT make the normalized name unique: once an owner has
  -- deliberately chosen to keep two same-named companies separate, uniqueness here
  -- would make that decision un-representable and break provisioning outright.
  select '3 migration', 108,
         'normalized company name is indexed for lookup but NOT unique (a deliberate split stays possible)',
         exists (select 1 from pg_class c where c.relname = 'client_accounts_identity_name_idx')
         and not exists (
           select 1 from pg_class c join pg_index i on i.indexrelid = c.oid
           where c.relname in ('client_accounts_identity_name_idx',
                               'client_accounts_identity_legal_name_idx',
                               'organizations_identity_name_idx')
             and i.indisunique)

  union all
  select '3 migration', 109,
         '20260804120000_reusable_capability_authorization is applied (five authorization tables + capability catalog + portal-context RPC)',
         to_regclass('public.capabilities') is not null
         and to_regclass('public.organization_roles') is not null
         and to_regclass('public.organization_role_capabilities') is not null
         and to_regclass('public.organization_member_roles') is not null
         and to_regclass('public.client_invitation_roles') is not null
         and exists (select 1 from fn where fn.name = 'current_user_portal_context' and fn.args = '')
         and exists (select 1 from fn where fn.name = 'membership_effective_capability_keys'
                     and fn.args = 'p_membership_id uuid')

  union all
  select '3 migration', 110,
         'composite tenant-integrity FKs are present (milestones, documents, supersedes chain, invoice link)',
         (select count(*) from pg_constraint
          where conname in ('customer_project_milestones_project_fk',
                            'customer_documents_project_fk',
                            'customer_documents_supersedes_fk',
                            'customer_project_invoices_project_fk',
                            'customer_project_invoices_invoice_fk',
                            'customer_projects_engagement_fk')) = 6

  union all
  select '3 migration', 111,
         'the published-document hard-delete guard trigger is installed',
         exists (select 1 from pg_trigger
                 where tgname = 'customer_documents_no_hard_delete_if_published' and not tgisinternal)

  union all
  select '3 migration', 112,
         'the document source-consistency guard trigger is installed',
         exists (select 1 from pg_trigger
                 where tgname = 'customer_documents_source_consistency_guard' and not tgisinternal)

  -- ------------------------------------------------ 4) RPC signatures + grants
  union all
  select '4 rpc', 200, format('RPC public.%s(%s) exists with the exact signature its callers use', r.name, r.args),
         r.oid is not null
  from resolved_fn r

  union all
  select '4 grant', 210, format('%s(%s) is executable by authenticated', r.name, r.args),
         coalesce(has_function_privilege((select authenticated from roles), r.oid, 'EXECUTE'), false)
  from resolved_fn r where r.audience = 'authenticated' and r.oid is not null

  union all
  select '4 grant', 211, format('%s(%s) is NOT executable by anon', r.name, r.args),
         not coalesce(has_function_privilege((select anon from roles), r.oid, 'EXECUTE'), true)
  from resolved_fn r where r.oid is not null

  -- The load-bearing one: these expose storage paths, accept an explicit caller
  -- id, or bypass auth.uid(). A browser must not be able to call them at all.
  union all
  select '4 grant', 220, format('SERVICE-ROLE ONLY: %s(%s) is NOT executable by authenticated', r.name, r.args),
         not coalesce(has_function_privilege((select authenticated from roles), r.oid, 'EXECUTE'), true)
  from resolved_fn r where r.audience = 'service_role' and r.oid is not null

  union all
  select '4 grant', 221, format('SERVICE-ROLE ONLY: %s(%s) IS executable by service_role', r.name, r.args),
         coalesce(has_function_privilege((select service_role from roles), r.oid, 'EXECUTE'), false)
  from resolved_fn r where r.audience = 'service_role' and r.oid is not null

  union all
  select '4 grant', 230, format('%s(%s) is NOT executable by PUBLIC', r.name, r.args),
         not coalesce(has_function_privilege('public', r.oid, 'EXECUTE'), true)
  from resolved_fn r where r.oid is not null

  -- -------------------------------------------- 5) SECURITY DEFINER hygiene
  union all
  select '5 secdef', 300, format('%s(%s) pins search_path (empty path + fully qualified references)', r.name, r.args),
         r.security_definer and r.config like '%search_path=%'
  from resolved_fn r where r.oid is not null

  union all
  select '5 secdef', 301, format('trigger guard public.%s() is not executable by anon/authenticated', g.name),
         not coalesce(has_function_privilege((select authenticated from roles),
                      (select oid from fn where fn.name = g.name limit 1), 'EXECUTE'), true)
  from (values ('guard_customer_project_contact_is_internal'),
               ('guard_customer_document_source_consistency'),
               ('guard_customer_document_no_hard_delete_if_published')) as g(name)
  where exists (select 1 from fn where fn.name = g.name)

  -- ------------------------------------------ 6) customer tables are sealed
  union all
  select '6 table', 400, format('RLS is enabled on public.%s', t.name),
         coalesce((select c.relrowsecurity from pg_class c
                   join pg_namespace n on n.oid = c.relnamespace
                   where n.nspname = 'public' and c.relname = t.name), false)
  from (values ('customer_projects'), ('customer_project_milestones'), ('customer_documents'),
               ('customer_document_access_events'), ('customer_project_invoices')) as t(name)
  where to_regclass('public.' || t.name) is not null

  union all
  select '6 table', 401, format('public.%s has NO policy reachable without is_platform_admin()', t.name),
         not exists (
           select 1 from pg_policies p
           where p.schemaname = 'public' and p.tablename = t.name
             and coalesce(p.qual, '') not like '%is_platform_admin%'
         )
  from (values ('customer_projects'), ('customer_project_milestones'), ('customer_documents'),
               ('customer_document_access_events'), ('customer_project_invoices')) as t(name)
  where to_regclass('public.' || t.name) is not null

  union all
  select '6 table', 402, format('anon holds NO table privilege on public.%s', t.name),
         not coalesce((select bool_or(has_table_privilege((select anon from roles), 'public.' || t.name, priv))
                       from (values ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE')) as p(priv)), true)
  from (values ('customer_projects'), ('customer_project_milestones'), ('customer_documents'),
               ('customer_document_access_events'), ('customer_project_invoices')) as t(name)
  where to_regclass('public.' || t.name) is not null

  -- ------------------------------------------------------- 7) storage bucket
  union all
  select '7 storage', 500, 'the customer-documents bucket exists',
         exists (select 1 from storage.buckets where id = 'customer-documents')

  union all
  select '7 storage', 501, 'the customer-documents bucket is PRIVATE',
         coalesce((select not public from storage.buckets where id = 'customer-documents'), false)

  union all
  select '7 storage', 502, 'the customer-documents bucket caps objects at 25 MiB',
         coalesce((select file_size_limit = 26214400 from storage.buckets where id = 'customer-documents'), false)

  union all
  select '7 storage', 503, 'the customer-documents bucket restricts MIME types to the intended allow-list',
         coalesce((select allowed_mime_types @> array[
                     'application/pdf', 'image/png', 'image/jpeg', 'text/plain',
                     'application/vnd.openxmlformats-officedocument.wordprocessingml.document']::text[]
                   and array_length(allowed_mime_types, 1) = 5
                   from storage.buckets where id = 'customer-documents'), false)

  union all
  select '7 storage', 510, 'no storage.objects policy grants a customer access to customer-documents',
         not exists (
           select 1 from pg_policies p
           where p.schemaname = 'storage' and p.tablename = 'objects'
             and coalesce(p.qual, '') || coalesce(p.with_check, '') like '%customer-documents%'
             and coalesce(p.qual, '') || coalesce(p.with_check, '') not like '%is_platform_admin%'
         )

  union all
  select '7 storage', 511, 'RLS is enabled on storage.objects',
         coalesce((select c.relrowsecurity from pg_class c
                   join pg_namespace n on n.oid = c.relnamespace
                   where n.nspname = 'storage' and c.relname = 'objects'), false)

  -- --------------------------- 9) Case D: tasks/execution_*/oura_* convergence
  union all
  select '9 case-d', 900, format('required table public.%s exists', t.name),
         to_regclass('public.' || t.name) is not null
  from case_d_table t

  union all
  select '9 case-d', 901, format('public.%s has all required columns', t.name),
         not exists (
           select 1 from unnest(t.key_columns) as col
           where not exists (
             select 1 from information_schema.columns c
             where c.table_schema = 'public' and c.table_name = t.name and c.column_name = col
           )
         )
  from case_d_table t
  where to_regclass('public.' || t.name) is not null

  union all
  select '9 case-d', 902, format('RLS is enabled on public.%s', t.name),
         coalesce((select c.relrowsecurity from pg_class c
                   join pg_namespace n on n.oid = c.relnamespace
                   where n.nspname = 'public' and c.relname = t.name), false)
  from case_d_table t
  where to_regclass('public.' || t.name) is not null

  union all
  select '9 case-d', 903, format('anon holds NO table privilege on public.%s', t.name),
         not coalesce((select bool_or(has_table_privilege((select anon from roles), 'public.' || t.name, priv))
                       from (values ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE')) as p(priv)), true)
  from case_d_table t
  where to_regclass('public.' || t.name) is not null

  union all
  select '9 case-d', 904, format('public.%s has NO policy reachable without is_platform_admin()', t.name),
         not exists (
           select 1 from pg_policies p
           where p.schemaname = 'public' and p.tablename = t.name
             and coalesce(p.qual, '') not like '%is_platform_admin%'
         )
  from case_d_table t
  where to_regclass('public.' || t.name) is not null

  union all
  select '9 case-d', 905, format('service_role holds full SELECT/INSERT/UPDATE/DELETE on public.%s', t.name),
         coalesce((select bool_and(has_table_privilege((select service_role from roles), 'public.' || t.name, priv))
                   from (values ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE')) as p(priv)), false)
  from case_d_table t
  where to_regclass('public.' || t.name) is not null

  union all
  select '9 case-d', 910, 'public.recalc_execution_day_stats(uuid) exists',
         exists (select 1 from fn where fn.name = 'recalc_execution_day_stats' and fn.args = 'day_id uuid')

  union all
  select '9 case-d', 911, 'public.recalc_execution_day_stats(uuid) pins search_path (SECURITY DEFINER)',
         coalesce((select f.security_definer and f.config like '%search_path=%'
                   from fn f where f.name = 'recalc_execution_day_stats' and f.args = 'day_id uuid'), false)

  union all
  select '9 case-d', 912, 'public.trigger_recalc_execution_day() exists',
         exists (select 1 from fn where fn.name = 'trigger_recalc_execution_day' and fn.args = '')

  union all
  select '9 case-d', 913, 'public.trigger_recalc_execution_day() pins search_path (SECURITY DEFINER)',
         coalesce((select f.security_definer and f.config like '%search_path=%'
                   from fn f where f.name = 'trigger_recalc_execution_day' and f.args = ''), false)

  union all
  select '9 case-d', 914, 'trigger trg_execution_tasks_recalc is installed on public.execution_tasks',
         exists (select 1 from pg_trigger where tgname = 'trg_execution_tasks_recalc' and not tgisinternal)
         and to_regclass('public.execution_tasks') is not null

  union all
  select '9 case-d', 915, 'neither recalc function is executable by anon',
         not coalesce((select bool_or(has_function_privilege((select anon from roles), f.oid, 'EXECUTE'))
                       from fn f where f.name in ('recalc_execution_day_stats', 'trigger_recalc_execution_day')), true)

  -- Ledger checks: the migration ledger this always ships with on a real
  -- Supabase project (hosted or `supabase start`), never created by this
  -- read-only script.
  union all
  select '9 case-d', 920, 'migration ledger table supabase_migrations.schema_migrations exists',
         to_regclass('supabase_migrations.schema_migrations') is not null

  union all
  select '9 case-d', 921, format('ledger names legacy migration %s as applied', v.version),
         exists (select 1 from supabase_migrations.schema_migrations m where m.version = v.version)
  from case_d_legacy_version v
  where to_regclass('supabase_migrations.schema_migrations') is not null

  union all
  select '9 case-d', 922, 'ledger names the convergence migration 20260731122000 as applied',
         exists (select 1 from supabase_migrations.schema_migrations m where m.version = '20260731122000')
  from (select 1) as _dummy
  where to_regclass('supabase_migrations.schema_migrations') is not null

  -- "Future-dated" is judged against the newest version this repository
  -- actually knows about, not live wall-clock time: comparing to clock_timestamp()
  -- would make this check racy across time zones and same-day migrations
  -- (exactly the class of bug that produced the original 20260801120000 shadow).
  union all
  select '9 case-d', 923, 'ledger has no version dated after the newest repository migration',
         not exists (
           select 1 from supabase_migrations.schema_migrations m
           where m.version > (select max(version) from case_d_known_version)
         )
  from (select 1) as _dummy
  where to_regclass('supabase_migrations.schema_migrations') is not null

  union all
  select '9 case-d', 924, 'ledger has no generated-shadow or otherwise unrecognized version',
         not exists (
           select 1 from supabase_migrations.schema_migrations m
           where m.version not in (select version from case_d_known_version)
         )
  from (select 1) as _dummy
  where to_regclass('supabase_migrations.schema_migrations') is not null

  -- ------------- 10) reusable capability authorization (20260804120000)
  -- Structural fingerprints only. Everything that has to READ one of the new tables
  -- lives in the guarded content block at the end of this file, because a missing
  -- table would otherwise make this whole statement unparseable on a database where
  -- the migration has not been applied yet.
  union all
  select '10 capability', 1000, format('required table public.%s exists', t.name),
         to_regclass('public.' || t.name) is not null
  from cap_table t

  union all
  select '10 capability', 1001, format('RLS is enabled on public.%s', t.name),
         coalesce((select c.relrowsecurity from pg_class c
                   join pg_namespace n on n.oid = c.relnamespace
                   where n.nspname = 'public' and c.relname = t.name), false)
  from cap_table t
  where to_regclass('public.' || t.name) is not null

  union all
  select '10 capability', 1002, format('anon holds NO table privilege on public.%s', t.name),
         not coalesce((select bool_or(has_table_privilege((select anon from roles), 'public.' || t.name, priv))
                       from (values ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE')) as p(priv)), true)
  from cap_table t
  where to_regclass('public.' || t.name) is not null

  -- The browser has no direct write path to any authorization table: every mutation goes
  -- through a SECURITY DEFINER RPC that re-authorizes the caller.
  union all
  select '10 capability', 1003, format('authenticated holds NO INSERT/UPDATE/DELETE on public.%s', t.name),
         not coalesce((select bool_or(has_table_privilege((select authenticated from roles), 'public.' || t.name, priv))
                       from (values ('INSERT'), ('UPDATE'), ('DELETE')) as p(priv)), true)
  from cap_table t
  where to_regclass('public.' || t.name) is not null

  union all
  select '10 capability', 1004, format('authenticated holds SELECT on public.%s (RLS still narrows it)', t.name),
         coalesce(has_table_privilege((select authenticated from roles), 'public.' || t.name, 'SELECT'), false)
  from cap_table t
  where t.authenticated_select and to_regclass('public.' || t.name) is not null

  union all
  select '10 capability', 1005, format('authenticated holds NO privilege at all on public.%s (RPC-only CRM data)', t.name),
         not coalesce((select bool_or(has_table_privilege((select authenticated from roles), 'public.' || t.name, priv))
                       from (values ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE')) as p(priv)), true)
  from cap_table t
  where not t.authenticated_select and to_regclass('public.' || t.name) is not null

  union all
  select '10 capability', 1006, format('service_role holds full SELECT/INSERT/UPDATE/DELETE on public.%s', t.name),
         coalesce((select bool_and(has_table_privilege((select service_role from roles), 'public.' || t.name, priv))
                   from (values ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE')) as p(priv)), false)
  from cap_table t
  where to_regclass('public.' || t.name) is not null

  union all
  select '10 capability', 1010, format('public.%s has primary key (%s)', t.name, array_to_string(t.pk_columns, ', ')),
         coalesce((
           select array_agg(a.attname::text order by k.ord) = t.pk_columns
           from pg_constraint con
           join lateral unnest(con.conkey) with ordinality as k(attnum, ord) on true
           join pg_attribute a on a.attrelid = con.conrelid and a.attnum = k.attnum
           where con.conrelid = ('public.' || t.name)::regclass and con.contype = 'p'
         ), false)
  from cap_table t
  where to_regclass('public.' || t.name) is not null

  union all
  select '10 capability', 1011, format('unique constraint %s exists on public.%s', u.name, u.table_name),
         exists (select 1 from pg_constraint con
                 where con.conname = u.name and con.contype = 'u'
                   and con.conrelid = ('public.' || u.table_name)::regclass)
  from cap_unique_constraint u
  where to_regclass('public.' || u.table_name) is not null

  -- Two columns, not one: a single-column FK would leave the organization_id free to diverge,
  -- which is exactly the cross-tenant hole the composite keys close.
  union all
  select '10 capability', 1012,
         format('COMPOSITE foreign key %s on public.%s references public.%s on (id, organization_id)',
                f.name, f.table_name, f.referenced),
         coalesce((
           select con.contype = 'f'
                  and array_length(con.conkey, 1) = 2
                  and array_length(con.confkey, 1) = 2
                  and con.confrelid = ('public.' || f.referenced)::regclass
           from pg_constraint con
           where con.conname = f.name and con.conrelid = ('public.' || f.table_name)::regclass
         ), false)
  from cap_composite_fk f
  where to_regclass('public.' || f.table_name) is not null
    and to_regclass('public.' || f.referenced) is not null

  union all
  select '10 capability', 1013, format('check constraint %s exists on public.%s', k.name, k.table_name),
         exists (select 1 from pg_constraint con
                 where con.conname = k.name and con.contype = 'c'
                   and con.conrelid = ('public.' || k.table_name)::regclass)
  from cap_check_constraint k
  where to_regclass('public.' || k.table_name) is not null

  union all
  select '10 capability', 1020, format('index public.%s exists', i.name),
         exists (select 1 from pg_class c
                 join pg_namespace n on n.oid = c.relnamespace
                 where n.nspname = 'public' and c.relname = i.name and c.relkind = 'i')
  from cap_index i

  union all
  select '10 capability', 1030, format('RLS policy %s exists on public.%s', p.name, p.table_name),
         exists (select 1 from pg_policies pol
                 where pol.schemaname = 'public' and pol.tablename = p.table_name
                   and pol.policyname = p.name)
  from cap_policy p
  where to_regclass('public.' || p.table_name) is not null

  -- SELECT on the tenant-free capability vocabulary is deliberately open to authenticated;
  -- every WRITE path must still be gated on is_platform_admin().
  union all
  select '10 capability', 1031,
         format('public.%s has NO write policy reachable without is_platform_admin()', t.name),
         not exists (
           select 1 from pg_policies pol
           where pol.schemaname = 'public' and pol.tablename = t.name
             and pol.cmd in ('ALL', 'INSERT', 'UPDATE', 'DELETE')
             and coalesce(pol.qual, '') || coalesce(pol.with_check, '') not like '%is_platform_admin%'
         )
  from cap_table t
  where to_regclass('public.' || t.name) is not null

  union all
  select '10 capability', 1032,
         'public.client_invitation_roles has NO policy reachable without is_platform_admin()',
         not exists (
           select 1 from pg_policies pol
           where pol.schemaname = 'public' and pol.tablename = 'client_invitation_roles'
             and coalesce(pol.qual, '') || coalesce(pol.with_check, '') not like '%is_platform_admin%'
         )
  from (select 1) as _dummy
  where to_regclass('public.client_invitation_roles') is not null

  union all
  select '10 capability', 1040, format('helper public.%s(%s) exists', h.name, h.args),
         exists (select 1 from fn where fn.name = h.name and fn.args = h.args)
  from cap_helper_fn h

  union all
  select '10 capability', 1041, format('helper %s(%s) is executable by authenticated', h.name, h.args),
         coalesce((select has_function_privilege((select authenticated from roles), f.oid, 'EXECUTE')
                   from fn f where f.name = h.name and f.args = h.args), false)
  from cap_helper_fn h
  where exists (select 1 from fn where fn.name = h.name and fn.args = h.args)

  union all
  select '10 capability', 1042, format('helper %s(%s) is NOT executable by anon', h.name, h.args),
         not coalesce((select has_function_privilege((select anon from roles), f.oid, 'EXECUTE')
                       from fn f where f.name = h.name and f.args = h.args), true)
  from cap_helper_fn h
  where exists (select 1 from fn where fn.name = h.name and fn.args = h.args)

  -- The single most load-bearing grant in this migration, called out explicitly rather than
  -- left to the generic service-role-only sweep.
  union all
  select '10 capability', 1050,
         'membership_effective_capability_keys(uuid) is NOT executable by authenticated (it takes a membership id)',
         not coalesce((select has_function_privilege((select authenticated from roles), f.oid, 'EXECUTE')
                       from fn f where f.name = 'membership_effective_capability_keys'
                         and f.args = 'p_membership_id uuid'), true)

  union all
  select '10 capability', 1051,
         'current_user_portal_context() IS executable by authenticated (the portal cannot boot without it)',
         coalesce((select has_function_privilege((select authenticated from roles), f.oid, 'EXECUTE')
                   from fn f where f.name = 'current_user_portal_context' and f.args = ''), false)

  -- Additive step in claim_my_client_invitations(): the invitation's configured functional roles
  -- are copied onto the membership, exactly once. Losing it silently strands every invited user
  -- on the baseline, which looks like a working login and is not.
  union all
  select '10 capability', 1060,
         'claim_my_client_invitations() transfers the invitation''s functional roles onto the membership',
         coalesce((
           select f.body like '%client_invitation_roles%'
              and f.body like '%organization_member_roles%'
              and f.body like '%on conflict (organization_member_id, organization_role_id) do nothing%'
           from fn f where f.name = 'claim_my_client_invitations' and f.args = ''
         ), false)

  -- Ledger: this project has already been burned once by a generated replacement timestamp.
  -- The hosted ledger must name 20260804120000 itself, not a re-stamped equivalent.
  union all
  select '10 capability', 1070,
         'ledger names the capability authorization migration 20260804120000 as applied',
         exists (select 1 from supabase_migrations.schema_migrations m where m.version = '20260804120000')
  from (select 1) as _dummy
  where to_regclass('supabase_migrations.schema_migrations') is not null

  union all
  select '10 capability', 1071,
         'ledger carries NO generated replacement timestamp for the capability authorization migration',
         not exists (
           select 1 from supabase_migrations.schema_migrations m
           where m.version > '20260731122000' and m.version <> '20260804120000'
         )
  from (select 1) as _dummy
  where to_regclass('supabase_migrations.schema_migrations') is not null
)

select case when passed then 'PASS' else 'FAIL' end || ': [' || section || '] ' || label
from checks
order by section, ord, label;

-- =============================================================================
-- 10b) Capability authorization CONTENT checks (guarded)
-- =============================================================================
-- These read the new tables and call the new catalog helper. A statement that
-- names a table which does not exist cannot even be parsed, so this block is
-- skipped entirely on a database where 20260804120000 has not been applied — the
-- structural section above already reports that as a failure.
select case
         when to_regclass('public.capabilities') is not null
          and to_regclass('public.organization_roles') is not null
          and to_regclass('public.organization_member_roles') is not null
          and to_regclass('public.client_invitation_roles') is not null
          and to_regclass('public.solution_catalog') is not null
          and to_regprocedure('public.portal_baseline_capability_keys()') is not null
         then 'yes' else 'no'
       end as capability_layer_present
\gset

\if :capability_layer_present

with
-- The complete catalog this release ships, key by key, with the solution each capability is
-- bound to. NULL means a general-portal capability that every organization always has.
-- A wrong binding is not cosmetic: it either suppresses access the customer paid for, or
-- grants access to a product the organization never activated.
expected_capability(key, solution_catalog_key) as (
  values
    ('portal.overview.view',             null),
    ('portal.projects.view',             null),
    ('portal.documents.view',            null),
    ('portal.billing.view',              null),
    ('portal.support.create',            null),
    ('portal.support.view_own',          null),
    ('svh.dashboard.view',               'sports_club_operations'),
    ('svh.bookings.view',                'sports_club_operations'),
    ('svh.bookings.manage',              'sports_club_operations'),
    ('svh.members.view',                 'sports_club_operations'),
    ('svh.members.manage',               'sports_club_operations'),
    ('svh.members.applications_review',  'sports_club_operations'),
    ('svh.members.numbers_assign',       'sports_club_operations'),
    ('svh.finance.view',                 'sports_club_operations'),
    ('svh.finance.manage',               'sports_club_operations'),
    ('svh.facilities.view',              'sports_club_operations'),
    ('svh.facilities.manage',            'sports_club_operations'),
    ('svh.devices.view',                 'sports_club_operations'),
    ('svh.devices.manage',               'sports_club_operations')
),

expected_baseline(key) as (
  values
    ('portal.overview.view'), ('portal.projects.view'), ('portal.documents.view'),
    ('portal.billing.view'), ('portal.support.create'), ('portal.support.view_own')
),

content_checks(section, ord, label, passed) as (

  select '10 capability', 1100,
         format('capability %s exists, is active and is bound to %s',
                e.key, coalesce(e.solution_catalog_key, 'the general portal (no solution)')),
         exists (
           select 1 from public.capabilities c
           where c.key = e.key
             and c.is_active
             and c.solution_catalog_key is not distinct from e.solution_catalog_key
         )
  from expected_capability e

  -- Drift in the other direction: a key this release does not know about would be granted by
  -- roles the frontend cannot reason about.
  union all
  select '10 capability', 1101, 'the capability catalog contains no unrecognized capability key',
         not exists (
           select 1 from public.capabilities c
           where c.key not in (select key from expected_capability)
         )

  union all
  select '10 capability', 1102, 'the sports_club_operations solution catalog entry exists',
         exists (select 1 from public.solution_catalog s where s.key = 'sports_club_operations')

  -- The backward-compatibility contract: every existing customer holds zero functional roles
  -- and therefore receives exactly these six keys and nothing else.
  union all
  select '10 capability', 1103,
         'portal_baseline_capability_keys() returns exactly the six general-portal capabilities',
         (select array_agg(k order by k) from unnest(public.portal_baseline_capability_keys()) as k)
           = (select array_agg(key order by key) from expected_baseline)

  union all
  select '10 capability', 1110, 'no duplicate capability key exists',
         (select count(*) from public.capabilities) = (select count(distinct key) from public.capabilities)

  union all
  select '10 capability', 1111, 'no duplicate functional role key exists inside one organization',
         not exists (
           select 1 from public.organization_roles
           group by organization_id, role_key having count(*) > 1
         )

  -- The structural composite keys should make these impossible. They are asserted anyway:
  -- a row that got in before the constraints existed would be invisible to the constraint check.
  union all
  select '10 capability', 1120,
         'no membership role assignment crosses organizations (row, member and role agree)',
         not exists (
           select 1
           from public.organization_member_roles omr
           left join public.organization_members om on om.id = omr.organization_member_id
           left join public.organization_roles orole on orole.id = omr.organization_role_id
           where om.id is null
              or orole.id is null
              or om.organization_id <> omr.organization_id
              or orole.organization_id <> omr.organization_id
         )

  union all
  select '10 capability', 1121,
         'no invitation role assignment crosses organizations (row, invitation and role agree)',
         not exists (
           select 1
           from public.client_invitation_roles cir
           left join public.client_invitations ci on ci.id = cir.client_invitation_id
           left join public.organization_roles orole on orole.id = cir.organization_role_id
           where ci.id is null
              or orole.id is null
              or ci.organization_id <> cir.organization_id
              or orole.organization_id <> cir.organization_id
         )

  union all
  select '10 capability', 1122,
         'every capability granted by a functional role resolves to a catalog entry',
         not exists (
           select 1 from public.organization_role_capabilities orc
           where not exists (select 1 from public.capabilities c where c.key = orc.capability_key)
         )
)

select case when passed then 'PASS' else 'FAIL' end || ': [' || section || '] ' || label
from content_checks
order by section, ord, label;

\endif
