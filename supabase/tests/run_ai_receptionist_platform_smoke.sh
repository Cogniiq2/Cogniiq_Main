#!/usr/bin/env bash
set -euo pipefail

# Verifies 20260905120000_ai_receptionist_platform.sql:
#   * platform admins can create and manage receptionists, bindings, calls and evaluation rows;
#   * an entitled customer owner can read their own receptionist and calls, but not other tenants',
#     and never tool bindings, config history, call events or evaluation internals;
#   * a customer cannot insert/update receptionist rows;
#   * client_config.clientId must match the tenant;
#   * anon sees nothing.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@127.0.0.1:5432/postgres}"

run_psql() { psql "$DATABASE_URL" -v ON_ERROR_STOP=1 "$@"; }

run_psql -f "$ROOT_DIR/supabase/tests/lib_bootstrap.sql"
run_psql <<'SQL'
insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
values
  ('00000000-0000-0000-0000-000000000501', 'gap-admin@example.test', now(), '{"full_name":"Admin"}'::jsonb),
  ('00000000-0000-0000-0000-000000000502', 'gap-cust-a@example.test', now(), '{"full_name":"Customer A"}'::jsonb),
  ('00000000-0000-0000-0000-000000000503', 'gap-cust-b@example.test', now(), '{"full_name":"Customer B"}'::jsonb)
on conflict (id) do update set email = excluded.email;
SQL

run_psql -f "$ROOT_DIR/supabase/migrations/20260710120000_phase0_auth_tenancy_rls.sql"
run_psql -f "$ROOT_DIR/supabase/migrations/20260710133000_phase0_security_hardening.sql"
run_psql -f "$ROOT_DIR/supabase/migrations/20260711120000_receptionist_persistence.sql"
run_psql -f "$ROOT_DIR/supabase/migrations/20260721120000_product_aware_client_platform.sql"
run_psql -f "$ROOT_DIR/supabase/migrations/20260905120000_ai_receptionist_platform.sql"
# Idempotency: applying twice must be a no-op.
run_psql -f "$ROOT_DIR/supabase/migrations/20260905120000_ai_receptionist_platform.sql"

run_psql <<'SQL'
select set_config('gap.admin', '00000000-0000-0000-0000-000000000501', false);
select set_config('gap.cust_a', '00000000-0000-0000-0000-000000000502', false);
select set_config('gap.cust_b', '00000000-0000-0000-0000-000000000503', false);
select set_config('gap.org_a', '10000000-0000-4000-8000-00000000000a', false);
select set_config('gap.org_b', '10000000-0000-4000-8000-00000000000b', false);

update public.profiles set platform_role = 'cogniiq_admin' where id = current_setting('gap.admin')::uuid;

insert into public.organizations (id, name, status, created_by) values
  (current_setting('gap.org_a')::uuid, 'Tenant A', 'active', current_setting('gap.cust_a')::uuid),
  (current_setting('gap.org_b')::uuid, 'Tenant B', 'active', current_setting('gap.cust_b')::uuid);
insert into public.organization_members (organization_id, user_id, role, status) values
  (current_setting('gap.org_a')::uuid, current_setting('gap.cust_a')::uuid, 'owner', 'active'),
  (current_setting('gap.org_b')::uuid, current_setting('gap.cust_b')::uuid, 'owner', 'active');
-- Only tenant A is entitled to the receptionist product.
insert into public.organization_solutions (organization_id, catalog_key, instance_key, display_name, implementation_key, status)
values (current_setting('gap.org_a')::uuid, 'ai_receptionist', 'rezeption-' || replace(current_setting('gap.org_a'), '-', ''), 'KI-Rezeption', 'ai_receptionist', 'active');

-- Admin creates receptionists for both tenants.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('gap.admin'), true);
insert into public.ai_receptionists (id, organization_id, name, stage, client_config)
values
  ('20000000-0000-4000-8000-00000000000a', current_setting('gap.org_a')::uuid, 'Tenant A Rezeption', 'dev', jsonb_build_object('schemaVersion', 1, 'clientId', current_setting('gap.org_a'))),
  ('20000000-0000-4000-8000-00000000000b', current_setting('gap.org_b')::uuid, 'Tenant B Rezeption', 'dev', jsonb_build_object('schemaVersion', 1, 'clientId', current_setting('gap.org_b')));

do $$
begin
  begin
    insert into public.ai_receptionists (organization_id, name, client_config)
    values (current_setting('gap.org_a')::uuid, 'Spoofed', jsonb_build_object('clientId', current_setting('gap.org_b')));
    raise exception 'TEST FAILED: clientId mismatch was accepted';
  exception when others then
    if sqlerrm not like '%clientId must equal organization_id%' then raise; end if;
  end;
end $$;

insert into public.ai_receptionist_tool_bindings (receptionist_id, organization_id, environment, token_hash, label)
values ('20000000-0000-4000-8000-00000000000a', current_setting('gap.org_a')::uuid, 'dev', repeat('a', 64), 'dev token');
insert into public.ai_receptionist_calls (receptionist_id, organization_id, provider_conversation_id, status, outcome, summary)
values ('20000000-0000-4000-8000-00000000000a', current_setting('gap.org_a')::uuid, 'conv_a1', 'done', 'booked', 'Termin gebucht'),
       ('20000000-0000-4000-8000-00000000000b', current_setting('gap.org_b')::uuid, 'conv_b1', 'done', 'escalated', 'Weitergeleitet');
insert into public.ai_receptionist_call_events (receptionist_id, organization_id, provider_conversation_id, event_type, tool_name, ok, latency_ms)
values ('20000000-0000-4000-8000-00000000000a', current_setting('gap.org_a')::uuid, 'conv_a1', 'tool_call', 'create_appointment', true, 320);
insert into public.ai_receptionist_evaluation_runs (id, receptionist_id, organization_id, mode, status, total, passed, failed)
values ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-00000000000a', current_setting('gap.org_a')::uuid, 'offline_reference', 'completed', 1, 1, 0);
insert into public.ai_receptionist_evaluation_results (run_id, receptionist_id, organization_id, scenario_id, category, title, passed)
values ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-00000000000a', current_setting('gap.org_a')::uuid, 'booking_simple-001', 'booking_simple', 'Simple', true);
reset role;
commit;

-- Customer A: sees own receptionist + calls, nothing else.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('gap.cust_a'), true);
do $$
declare n int;
begin
  select count(*) into n from public.ai_receptionists; if n <> 1 then raise exception 'TEST FAILED: customer A sees % receptionists', n; end if;
  select count(*) into n from public.ai_receptionist_calls; if n <> 1 then raise exception 'TEST FAILED: customer A sees % calls', n; end if;
  select count(*) into n from public.ai_receptionist_tool_bindings; if n <> 0 then raise exception 'TEST FAILED: customer A sees tool bindings'; end if;
  select count(*) into n from public.ai_receptionist_evaluation_results; if n <> 0 then raise exception 'TEST FAILED: customer A sees evaluation results'; end if;
  select count(*) into n from public.ai_receptionist_call_events; if n <> 0 then raise exception 'TEST FAILED: customer A sees call events'; end if;
  begin
    update public.ai_receptionists set name = 'Hacked' where id = '20000000-0000-4000-8000-00000000000a';
    if found then raise exception 'TEST FAILED: customer A updated a receptionist'; end if;
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.ai_receptionists (organization_id, name, client_config) values (current_setting('gap.org_a')::uuid, 'Self-made', '{}'::jsonb);
    raise exception 'TEST FAILED: customer A inserted a receptionist';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
rollback;

-- Customer B (no entitlement): sees nothing.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('gap.cust_b'), true);
do $$
declare n int;
begin
  select count(*) into n from public.ai_receptionists; if n <> 0 then raise exception 'TEST FAILED: unentitled customer B sees % receptionists', n; end if;
  select count(*) into n from public.ai_receptionist_calls; if n <> 0 then raise exception 'TEST FAILED: unentitled customer B sees calls'; end if;
end $$;
reset role;
rollback;

-- Anon: nothing, not even a select.
begin;
set local role anon;
do $$
begin
  begin
    perform 1 from public.ai_receptionists;
    raise exception 'TEST FAILED: anon can select ai_receptionists';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
rollback;

-- Admin sees everything.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('gap.admin'), true);
do $$
declare n int;
begin
  select count(*) into n from public.ai_receptionists; if n <> 2 then raise exception 'TEST FAILED: admin sees % receptionists', n; end if;
  select count(*) into n from public.ai_receptionist_tool_bindings; if n <> 1 then raise exception 'TEST FAILED: admin sees % bindings', n; end if;
end $$;
reset role;
rollback;

select 'ai receptionist platform smoke: ok' as result;
SQL
