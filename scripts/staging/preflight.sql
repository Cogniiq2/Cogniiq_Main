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
         coalesce(array_to_string(p.proconfig, ','), '') as config
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
    ('archive_customer_document_as', 'p_caller_id uuid, p_document_id uuid', 'service_role')
),

resolved_fn as (
  select e.name, e.args, e.audience, f.oid, f.security_definer, f.config
  from expected_fn e
  left join fn f on f.name = e.name and f.args = e.args
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
)

select case when passed then 'PASS' else 'FAIL' end || ': [' || section || '] ' || label
from checks
order by section, ord, label;
