-- Local-only bootstrap for testing the additive owner-offer migrations against a
-- temporary PostgreSQL database. This is NEVER applied to Supabase; it only stubs the
-- Supabase primitives (auth schema, roles) and the small set of upstream objects that
-- the offer/document/commercial-document migrations depend on, so the REAL migrations
-- (20260723120000 / 121000 / 122000 / 123000) run unmodified on top.
--
-- is_platform_owner()/is_database_admin()/request_is_service_role()/auth.uid() read a
-- GUC (app.role / app.uid) so a test can simulate owner vs admin vs anon vs service.

create extension if not exists pgcrypto;

-- Supabase-style roles.
do $$ begin
  if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname='anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname='service_role') then create role service_role nologin; end if;
end $$;

create schema if not exists auth;
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('app.uid', true), '')::uuid
$$;

-- Role predicates driven by the app.role GUC: 'owner' | 'admin' | 'service' | 'anon'.
create or replace function public.is_platform_owner() returns boolean language sql stable as $$
  select coalesce(current_setting('app.role', true), 'anon') = 'owner'
$$;
create or replace function public.is_database_admin() returns boolean language sql stable as $$
  select coalesce(current_setting('app.role', true), 'anon') = 'admin'
$$;
create or replace function public.request_is_service_role() returns boolean language sql stable as $$
  select coalesce(current_setting('app.role', true), 'anon') = 'service'
$$;

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

-- Upstream tables (mirrors of the applied 20260722120000_owner_finance_cockpit.sql shapes).
create table if not exists public.profiles (id uuid primary key default gen_random_uuid());
create table if not exists public.organizations (id uuid primary key default gen_random_uuid());
create table if not exists public.client_accounts (id uuid primary key default gen_random_uuid());
create table if not exists public.client_engagements (id uuid primary key default gen_random_uuid());

create table if not exists public.owner_business_entities (
  id uuid primary key default gen_random_uuid(),
  slug text not null default 'ent',
  display_name text not null default 'Entity',
  currency text not null default 'EUR',
  country_code text not null default 'DE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.owner_finance_requests (
  idempotency_key uuid primary key,
  kind text not null,
  result jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.owner_audit_log (
  id uuid primary key default gen_random_uuid(),
  business_entity_id uuid,
  actor_user_id uuid,
  action text not null,
  resource_type text not null,
  resource_id uuid,
  before_summary jsonb,
  after_summary jsonb,
  correlation_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.owner_invoices (
  id uuid primary key default gen_random_uuid(),
  business_entity_id uuid not null references public.owner_business_entities(id) on delete restrict,
  organization_id uuid references public.organizations(id) on delete set null,
  client_account_id uuid references public.client_accounts(id) on delete set null,
  engagement_id uuid references public.client_engagements(id) on delete set null,
  invoice_number text,
  status text not null default 'draft',
  issue_date date,
  service_date date,
  service_period_start date,
  service_period_end date,
  due_date date,
  currency text not null default 'EUR',
  net_total_cents bigint not null default 0,
  vat_total_cents bigint not null default 0,
  gross_total_cents bigint not null default 0,
  amount_paid_cents bigint not null default 0,
  notes text,
  external_reference text,
  issued_at timestamptz,
  archived_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.owner_invoice_lines (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.owner_invoices(id) on delete cascade,
  description text not null,
  quantity_milli bigint not null default 1000,
  unit_price_cents bigint not null,
  net_cents bigint not null default 0,
  vat_rate_bp int not null default 1900,
  vat_treatment text not null default 'standard',
  vat_cents bigint not null default 0,
  gross_cents bigint not null default 0,
  service_period_start date,
  service_period_end date,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Audit trigger factory (same signature/behaviour as the real owner_write_audit_row).
create or replace function public.owner_write_audit_row()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare
  strip text[] := array['notes','breakdown','before_summary','after_summary','depreciation_snapshot',
    'validation_result','file_metadata','record_counts','assumptions_notes','review_reason','metadata'];
  v_new jsonb; v_old jsonb; v_entity uuid; v_rid uuid;
begin
  if tg_op <> 'DELETE' then v_new := to_jsonb(new) - strip; end if;
  if tg_op <> 'INSERT' then v_old := to_jsonb(old) - strip; end if;
  v_entity := coalesce((coalesce(v_new, v_old)->>'business_entity_id')::uuid, (coalesce(v_new, v_old)->>'id')::uuid);
  v_rid := (coalesce(v_new, v_old)->>'id')::uuid;
  insert into public.owner_audit_log (business_entity_id, actor_user_id, action, resource_type, resource_id, before_summary, after_summary)
  values (v_entity, auth.uid(), tg_argv[0] || '.' || lower(tg_op), tg_argv[0], v_rid, v_old, v_new);
  return coalesce(new, old);
end;
$$;

-- Idempotency claim helper (same behaviour as the real one).
create or replace function public.owner_claim_idempotency(p_key uuid, p_kind text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_kind text; v_result jsonb;
begin
  if p_key is null then raise exception 'an idempotency key is required'; end if;
  insert into public.owner_finance_requests (idempotency_key, kind, created_by)
  values (p_key, p_kind, auth.uid()) on conflict (idempotency_key) do nothing;
  select kind, result into v_kind, v_result from public.owner_finance_requests where idempotency_key = p_key for update;
  if v_kind is distinct from p_kind then raise exception 'idempotency key already used for a different operation (%)', v_kind; end if;
  return v_result;
end;
$$;
