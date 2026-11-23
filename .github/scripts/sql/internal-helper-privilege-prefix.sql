-- BEFORE the P0 hotfix: proves this harness reproduces the production defect, so the
-- post-fix assertions are meaningful rather than vacuously true on a bare cluster.
-- Runs only against the throwaway local cluster booted by
-- .github/scripts/run-internal-helper-privilege-sql-tests.sh.
\set ON_ERROR_STOP 1

do $$
begin
  if not has_function_privilege('authenticated', 'public.owner_force_destroy_row(text, uuid, integer)', 'execute') then
    raise exception 'HARNESS: platform default privileges not reproduced — authenticated should hold EXECUTE before the fix';
  end if;
  if not has_function_privilege('authenticated', 'public.owner_purge_destroy_row(text, uuid, boolean)', 'execute') then
    raise exception 'HARNESS: owner_purge_destroy_row should be executable by authenticated before the fix';
  end if;
  raise notice 'PRE-FIX reproduced: authenticated holds EXECUTE on the internal row destroyers';
end $$;

-- Demonstrate the impact locally: a plain customer session destroys an owner-only row.
insert into public.owner_customers (id, business_entity_id, company, status)
select '00000000-0000-0000-0000-0000000000c1', id, 'Opfer-Kunde (lokal)', 'active'
from public.owner_business_entities where slug = 'cogniiq';

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000903', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select public.owner_force_destroy_row('owner_customers', '00000000-0000-0000-0000-0000000000c1', 0);
commit;

do $$
begin
  if exists (select 1 from public.owner_customers where id = '00000000-0000-0000-0000-0000000000c1') then
    raise exception 'HARNESS: expected the pre-fix customer call to succeed (defect not reproduced)';
  end if;
  raise notice 'PRE-FIX reproduced: a customer session deleted an owner_customers row via owner_force_destroy_row';
end $$;

-- The T8 prevention invariant must DETECT this defect class: before the fix, its query has to
-- flag every SECURITY DEFINER helper among the 16 (the 6 non-definer ones run with the caller's
-- own privileges and are only reachable through the definer ones).
do $$
declare v_flagged text[];
begin
  select array_agg(p.proname::text order by 1) into v_flagged
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.prosecdef and p.prokind = 'f' and p.prorettype <> 'trigger'::regtype
    and (has_function_privilege('anon', p.oid, 'execute') or has_function_privilege('authenticated', p.oid, 'execute'))
    and p.prosrc !~ '(is_platform_owner|is_platform_admin|request_is_service_role|auth\.uid\(\)|is_organization_member|has_organization_role|current_user_portal_context)'
    and p.proname in ('owner_counterparty_snapshot','owner_force_delete_manifest','owner_force_delete_summary',
      'owner_force_destroy_row','owner_force_purge_storage','owner_purge_assert_no_orphans','owner_purge_blast_radius',
      'owner_purge_destroy_row','owner_purge_manifest','owner_purge_storage_paths');
  if coalesce(cardinality(v_flagged), 0) <> 10 then
    raise exception 'HARNESS: the T8 invariant query should flag all 10 definer helpers before the fix, flagged %', v_flagged;
  end if;
  raise notice 'PRE-FIX reproduced: the T8 prevention query flags all 10 unguarded SECURITY DEFINER helpers';
end $$;
