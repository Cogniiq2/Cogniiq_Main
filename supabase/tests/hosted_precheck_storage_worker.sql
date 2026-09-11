-- ===========================================================================
-- READ-ONLY precheck for the storage-purge-worker deployment.
--
-- Run this in the Supabase SQL Editor on the HOSTED project BEFORE deploying
-- the Edge Function or scheduling the cron job. It changes nothing — every
-- statement is a SELECT. Each block prints what it found and a plain
-- pass/fail verdict; read the verdicts top to bottom.
--
-- What it checks, and why each one matters for this specific worker:
--   1. service_role exists and bypasses RLS (the platform guarantee this
--      whole design relies on — if this is ever false, the worker's Storage
--      API calls would be silently subject to RLS like any other role).
--   2. service_role can reach storage.objects/storage.buckets at all
--      (schema USAGE + table privileges) — without this the worker's
--      storage.from(bucket).remove() calls fail outright.
--   3. The three buckets this system's purge paths reference actually exist:
--      owner-finance-documents, owner-offer-signatures, customer-documents.
--      A missing bucket does not break anything today (nothing is queued for
--      a bucket with zero rows in it), but if any of these is absent it means
--      a prior migration's bucket-creation step never ran on this project —
--      worth knowing before the worker goes live, not after.
--   4. pg_cron, pg_net and the vault schema exist — required for the guarded
--      scheduling block in 20260910140000 §11 to do anything at all; without
--      them that block is a permanent no-op and the worker is never invoked.
--   5. The migration's own functions and the queue table exist with the
--      expected grants — confirms 20260910*.sql actually applied cleanly.
-- ===========================================================================

\echo '=== 1. service_role: exists, bypasses RLS ==='
select
  rolname,
  rolbypassrls as bypasses_rls,
  case when rolbypassrls then 'PASS' else 'FAIL — service_role does not bypass RLS on this project' end as verdict
from pg_roles where rolname = 'service_role';

\echo ''
\echo '=== 2. service_role: schema + table privileges on storage ==='
select
  has_schema_privilege('service_role', 'storage', 'USAGE') as schema_usage,
  has_table_privilege('service_role', 'storage.objects', 'SELECT') as objects_select,
  has_table_privilege('service_role', 'storage.objects', 'DELETE') as objects_delete,
  has_table_privilege('service_role', 'storage.buckets', 'SELECT') as buckets_select,
  case when has_schema_privilege('service_role', 'storage', 'USAGE')
        and has_table_privilege('service_role', 'storage.objects', 'DELETE')
       then 'PASS'
       else 'FAIL — service_role cannot delete from storage.objects; the worker cannot function'
  end as verdict;

\echo ''
\echo '=== 3. The three buckets this system uses actually exist ==='
select
  b.id as bucket_id,
  case when b.id is not null then 'present' else 'MISSING' end as status
from unnest(array['owner-finance-documents', 'owner-offer-signatures', 'customer-documents']) as expected(id)
left join storage.buckets b on b.id = expected.id;

\echo ''
\echo '=== 4. Required extensions/schemas for the cron dispatch ==='
select
  exists (select 1 from pg_extension where extname = 'pg_cron') as pg_cron_installed,
  exists (select 1 from pg_extension where extname = 'pg_net') as pg_net_installed,
  exists (select 1 from information_schema.schemata where schema_name = 'vault') as vault_schema_present,
  case when exists (select 1 from pg_extension where extname = 'pg_cron')
        and exists (select 1 from pg_extension where extname = 'pg_net')
        and exists (select 1 from information_schema.schemata where schema_name = 'vault')
       then 'PASS'
       else 'FAIL (or PARTIAL) — the guarded cron block in 20260910140000 §11 will remain a permanent no-op until all three are present; enable pg_cron and pg_net under Database -> Extensions if missing'
  end as verdict;

\echo ''
\echo '=== 4b. If Vault secrets were already stored (informational — 0 rows is normal pre-deploy) ==='
do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'vault') then
    raise notice 'Run separately after checking: select name from vault.decrypted_secrets where name in (''storage_purge_worker_url'',''storage_purge_worker_secret'');';
  end if;
end $$;

\echo ''
\echo '=== 5. The migration applied: functions and table present with expected grants ==='
select
  p.proname as function_name,
  has_function_privilege('service_role', p.oid, 'execute') as service_role_can_execute,
  has_function_privilege('authenticated', p.oid, 'execute') as authenticated_can_execute
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'owner_storage_purge_enqueue', 'owner_storage_purge_claim_batch',
    'owner_storage_purge_complete', 'owner_storage_purge_retry_failed',
    'owner_storage_purge_status', 'owner_storage_purge_stale_after')
order by p.proname;

\echo ''
select
  to_regclass('public.owner_storage_purge_queue') is not null as queue_table_exists,
  case when to_regclass('public.owner_storage_purge_queue') is not null then 'PASS'
       else 'FAIL — 20260910140000_owner_storage_purge_worker.sql has not been applied to this project'
  end as verdict;

\echo ''
\echo '=== Done. A single FAIL above blocks deployment; resolve it, then re-run this file. ==='
