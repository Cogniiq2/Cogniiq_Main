#!/usr/bin/env bash
set -euo pipefail

# Owner Finance cockpit DB smoke test. Verifies owner-only RLS (customer / org-owner / cogniiq_admin
# all denied; only cogniiq_owner allowed), append-only audit, immutable/forge-proof invoice totals,
# idempotent CRM-only client creation, per-entity invoice-number uniqueness, and payment transitions.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@127.0.0.1:5432/postgres}"
run_psql() { psql "$DATABASE_URL" -v ON_ERROR_STOP=1 "$@"; }

run_psql <<'SQL'
create extension if not exists pgcrypto;
create schema if not exists auth;
do $$ begin create role anon nologin; exception when duplicate_object then null; end $$;
do $$ begin create role authenticated nologin; exception when duplicate_object then null; end $$;
do $$ begin create role service_role nologin bypassrls; exception when duplicate_object then null; end $$;
alter role service_role bypassrls;
do $$ begin create role supabase_admin nologin; exception when duplicate_object then null; end $$;
do $$ begin create role supabase_auth_admin nologin; exception when duplicate_object then null; end $$;
create or replace function auth.uid() returns uuid language sql stable as $f$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid; $f$;
create table if not exists auth.users (id uuid primary key default gen_random_uuid(), email text, email_confirmed_at timestamptz, raw_user_meta_data jsonb default '{}'::jsonb, created_at timestamptz default now(), updated_at timestamptz default now());
alter table auth.users add column if not exists email_confirmed_at timestamptz;
grant usage on schema auth to anon, authenticated, service_role, supabase_auth_admin;
grant execute on function auth.uid() to public, anon, authenticated, service_role, supabase_auth_admin;
insert into auth.users (id, email, email_confirmed_at) values
  ('00000000-0000-0000-0000-000000000901', 'owner@x.test', now()),
  ('00000000-0000-0000-0000-000000000902', 'admin@x.test', now()),
  ('00000000-0000-0000-0000-000000000903', 'customer@x.test', now()),
  ('00000000-0000-0000-0000-000000000904', 'orgowner@x.test', now())
on conflict (id) do update set email = excluded.email;
SQL

run_psql -f "$ROOT_DIR/supabase/migrations/20260710120000_phase0_auth_tenancy_rls.sql"
run_psql -f "$ROOT_DIR/supabase/migrations/20260710133000_phase0_security_hardening.sql"
run_psql -f "$ROOT_DIR/supabase/migrations/20260711120000_receptionist_persistence.sql"
run_psql -f "$ROOT_DIR/supabase/migrations/20260721120000_product_aware_client_platform.sql"
run_psql -f "$ROOT_DIR/supabase/migrations/20260722120000_owner_finance_cockpit.sql"

run_psql <<'SQL'
select set_config('of.owner',    '00000000-0000-0000-0000-000000000901', false);
select set_config('of.admin',    '00000000-0000-0000-0000-000000000902', false);
select set_config('of.customer', '00000000-0000-0000-0000-000000000903', false);
select set_config('of.orgowner', '00000000-0000-0000-0000-000000000904', false);

update public.profiles set platform_role = 'cogniiq_owner' where id = current_setting('of.owner')::uuid;
update public.profiles set platform_role = 'cogniiq_admin' where id = current_setting('of.admin')::uuid;

-- org-owner: an organization owner who is NOT a platform owner must not gain finance access.
do $$
declare v_org uuid := gen_random_uuid();
begin
  insert into public.organizations (id, name, status, created_by) values (v_org, 'OrgOwner Co', 'active', current_setting('of.orgowner')::uuid);
  insert into public.organization_members (organization_id, user_id, role, status) values (v_org, current_setting('of.orgowner')::uuid, 'owner', 'active');
end $$;

-- seeded entity id
select set_config('of.entity', (select id::text from public.owner_business_entities where slug = 'cogniiq'), false);
select set_config('of.entity2', (select id::text from public.owner_business_entities where slug = 'cogniiq-family-gmbh'), false);

begin;  -- scenarios run inside a transaction so SET LOCAL ROLE takes effect; rolled back at the end.

-- ===== Scenario: anonymous denied =====
set local role anon;
select set_config('request.jwt.claim.role', 'anon', true);
select set_config('request.jwt.claim.sub', '', true);
do $$
declare t text;
begin
  foreach t in array array['owner_business_entities','owner_invoices','owner_expenses','owner_payments','owner_audit_log','owner_tax_estimates']
  loop
    begin
      execute format('select count(*) from public.%I', t);
      raise exception 'TEST FAILED: anon read public.%', t;
    exception when insufficient_privilege then null; end;
  end loop;
end $$;
reset role;

-- ===== Scenario: customer, org-owner, and cogniiq_admin are all denied =====
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);

create or replace function pg_temp.assert_no_finance_access(p_sub text, p_label text)
returns void language plpgsql as $$
declare c integer; blocked boolean;
begin
  perform set_config('request.jwt.claim.sub', p_sub, true);
  -- SELECT returns zero rows (RLS filters; seeded entities exist but are invisible).
  select count(*) into c from public.owner_business_entities;
  if c <> 0 then raise exception 'TEST FAILED: % read % owner_business_entities', p_label, c; end if;
  select count(*) into c from public.owner_invoices;
  if c <> 0 then raise exception 'TEST FAILED: % read owner_invoices', p_label; end if;
  -- INSERT blocked by with_check.
  blocked := false;
  begin
    insert into public.owner_vendors (name) values ('rogue');
  exception when insufficient_privilege or check_violation then blocked := true; end;
  if not blocked then raise exception 'TEST FAILED: % inserted a vendor', p_label; end if;
  -- Summary RPC denied.
  blocked := false;
  begin
    perform public.owner_finance_period_summary(current_setting('of.entity')::uuid, current_date, current_date);
  exception when raise_exception then blocked := true; end;
  if not blocked then raise exception 'TEST FAILED: % ran the finance summary RPC', p_label; end if;
end $$;

select pg_temp.assert_no_finance_access(current_setting('of.customer'), 'customer');
select pg_temp.assert_no_finance_access(current_setting('of.orgowner'), 'org owner');
select pg_temp.assert_no_finance_access(current_setting('of.admin'), 'cogniiq_admin');

-- ===== Scenario: cogniiq_owner allowed =====
select set_config('request.jwt.claim.sub', current_setting('of.owner'), true);
do $$
declare c integer; summary jsonb;
begin
  select count(*) into c from public.owner_business_entities;
  if c < 2 then raise exception 'TEST FAILED: owner should see both entities, got %', c; end if;

  insert into public.owner_vendors (name, country_code) values ('OpenAI', 'US');
  insert into public.owner_tax_settings (business_entity_id, tax_year, assessment_mode) values (current_setting('of.entity')::uuid, 2026, 'single');

  summary := public.owner_finance_period_summary(current_setting('of.entity')::uuid, date '2026-01-01', date '2026-12-31');
  if (summary->>'invoiced_net_cents') is null then raise exception 'TEST FAILED: summary RPC returned no data for owner'; end if;
end $$;

-- ===== Scenario: server-authoritative invoice totals cannot be forged =====
do $$
declare v_inv uuid; blocked boolean;
begin
  insert into public.owner_invoices (business_entity_id, status, issue_date, due_date, invoice_number, created_by)
  values (current_setting('of.entity')::uuid, 'issued', current_date, current_date + 14, 'RE-2026-001', current_setting('of.owner')::uuid)
  returning id into v_inv;
  perform set_config('of.inv', v_inv::text, true);

  -- 2 units at 100.00 EUR net, 19% VAT => net 20000, vat 3800, gross 23800.
  insert into public.owner_invoice_lines (invoice_id, description, quantity_milli, unit_price_cents, vat_rate_bp, vat_treatment)
  values (v_inv, 'Beratung', 2000, 10000, 1900, 'standard');

  if (select net_total_cents from public.owner_invoices where id = v_inv) <> 20000
    or (select vat_total_cents from public.owner_invoices where id = v_inv) <> 3800
    or (select gross_total_cents from public.owner_invoices where id = v_inv) <> 23800 then
    raise exception 'TEST FAILED: invoice totals were not computed server-side from lines';
  end if;

  -- Direct forge of header totals is blocked (column privilege revoked).
  blocked := false;
  begin
    update public.owner_invoices set net_total_cents = 1 where id = v_inv;
  exception when insufficient_privilege then blocked := true; end;
  if not blocked then raise exception 'TEST FAILED: owner forged invoice header totals directly'; end if;
end $$;

-- ===== Scenario: partial-payment status transitions =====
do $$
begin
  insert into public.owner_payments (business_entity_id, kind, direction, payment_date, amount_cents, invoice_id, created_by)
  values (current_setting('of.entity')::uuid, 'income', 'inflow', current_date, 10000, current_setting('of.inv')::uuid, current_setting('of.owner')::uuid);
  if (select status from public.owner_invoices where id = current_setting('of.inv')::uuid) <> 'partially_paid' then
    raise exception 'TEST FAILED: invoice did not transition to partially_paid';
  end if;
  insert into public.owner_payments (business_entity_id, kind, direction, payment_date, amount_cents, invoice_id, created_by)
  values (current_setting('of.entity')::uuid, 'income', 'inflow', current_date, 13800, current_setting('of.inv')::uuid, current_setting('of.owner')::uuid);
  if (select status from public.owner_invoices where id = current_setting('of.inv')::uuid) <> 'paid' then
    raise exception 'TEST FAILED: invoice did not transition to paid';
  end if;
end $$;

-- ===== Scenario: issued invoice cannot be hard-deleted or renumbered; void blocks new payments =====
do $$
declare blocked boolean; v_void uuid;
begin
  blocked := false;
  begin
    delete from public.owner_invoices where id = current_setting('of.inv')::uuid;
  exception when raise_exception then blocked := true; end;
  if not blocked then raise exception 'TEST FAILED: an issued invoice was hard-deleted'; end if;

  blocked := false;
  begin
    update public.owner_invoices set invoice_number = 'RE-2026-999' where id = current_setting('of.inv')::uuid;
  exception when raise_exception then blocked := true; end;
  if not blocked then raise exception 'TEST FAILED: an issued invoice was silently renumbered'; end if;

  insert into public.owner_invoices (business_entity_id, status, invoice_number, created_by)
  values (current_setting('of.entity')::uuid, 'void', 'RE-2026-VOID', current_setting('of.owner')::uuid)
  returning id into v_void;
  blocked := false;
  begin
    insert into public.owner_payments (business_entity_id, kind, direction, payment_date, amount_cents, invoice_id, created_by)
    values (current_setting('of.entity')::uuid, 'income', 'inflow', current_date, 100, v_void, current_setting('of.owner')::uuid);
  exception when raise_exception then blocked := true; end;
  if not blocked then raise exception 'TEST FAILED: a payment was recorded against a void invoice'; end if;
end $$;

-- ===== Scenario: invoice number unique per entity, reusable across entities =====
do $$
declare blocked boolean;
begin
  blocked := false;
  begin
    insert into public.owner_invoices (business_entity_id, status, invoice_number, created_by)
    values (current_setting('of.entity')::uuid, 'issued', 'RE-2026-001', current_setting('of.owner')::uuid);
  exception when unique_violation then blocked := true; end;
  if not blocked then raise exception 'TEST FAILED: duplicate invoice number within an entity was allowed'; end if;

  -- Same number in a different entity is fine.
  insert into public.owner_invoices (business_entity_id, status, invoice_number, created_by)
  values (current_setting('of.entity2')::uuid, 'issued', 'RE-2026-001', current_setting('of.owner')::uuid);
end $$;

-- ===== Scenario: append-only audit log =====
do $$
declare v_audit uuid; blocked boolean;
begin
  insert into public.owner_audit_log (business_entity_id, actor_user_id, action, resource_type, resource_id, after_summary)
  values (current_setting('of.entity')::uuid, current_setting('of.owner')::uuid, 'invoice.issued', 'owner_invoices', current_setting('of.inv')::uuid, '{"status":"issued"}'::jsonb)
  returning id into v_audit;

  blocked := false;
  begin update public.owner_audit_log set action = 'tampered' where id = v_audit; exception when insufficient_privilege then blocked := true; end;
  if not blocked then raise exception 'TEST FAILED: audit event was updated'; end if;

  blocked := false;
  begin delete from public.owner_audit_log where id = v_audit; exception when insufficient_privilege then blocked := true; end;
  if not blocked then raise exception 'TEST FAILED: audit event was deleted'; end if;
end $$;

-- ===== Scenario: tax-estimate snapshots are immutable =====
do $$
declare v_est uuid; blocked boolean;
begin
  insert into public.owner_tax_estimates (business_entity_id, tax_year, tax_type, rules_version, estimated_liability_cents, confidence)
  values (current_setting('of.entity')::uuid, 2026, 'vat', 'de-2026-v1', 5000, 'estimate')
  returning id into v_est;
  blocked := false;
  begin update public.owner_tax_estimates set estimated_liability_cents = 1 where id = v_est; exception when insufficient_privilege then blocked := true; end;
  if not blocked then raise exception 'TEST FAILED: a tax estimate snapshot was mutated'; end if;
end $$;

-- ===== Scenario: idempotent CRM-only client creation (no solution/membership/invitation) =====
do $$
declare r1 jsonb; r2 jsonb; c integer;
begin
  r1 := public.create_crm_only_client('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Nordwind GmbH', null, 'kontakt@nordwind.test', '+49301234567', 'Handel', 'active', 'Klara Nord');
  r2 := public.create_crm_only_client('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Different Name', null, null, null, null, 'lead', null);
  if (r1->>'organization_id') <> (r2->>'organization_id') or (r1->>'client_account_id') <> (r2->>'client_account_id') then
    raise exception 'TEST FAILED: CRM-only client creation is not idempotent';
  end if;
  select count(*) into c from public.client_accounts where organization_id = (r1->>'organization_id')::uuid;
  if c <> 1 then raise exception 'TEST FAILED: CRM-only client created % accounts', c; end if;
  select count(*) into c from public.organization_solutions where organization_id = (r1->>'organization_id')::uuid;
  if c <> 0 then raise exception 'TEST FAILED: CRM-only client created a solution'; end if;
  select count(*) into c from public.organization_members where organization_id = (r1->>'organization_id')::uuid;
  if c <> 0 then raise exception 'TEST FAILED: CRM-only client created a membership'; end if;
  select count(*) into c from public.client_invitations where organization_id = (r1->>'organization_id')::uuid;
  if c <> 0 then raise exception 'TEST FAILED: CRM-only client created an invitation'; end if;
end $$;

-- ===== Scenario: null idempotency key rejected =====
do $$
declare blocked boolean := false;
begin
  begin perform public.create_crm_only_client(null::uuid, 'X', null, null, null, null, 'lead', null);
  exception when raise_exception then blocked := true; end;
  if not blocked then raise exception 'TEST FAILED: CRM-only client created without an idempotency key'; end if;
end $$;

reset role;
rollback;
SQL

echo "owner finance smoke test: ALL SCENARIOS PASSED"
