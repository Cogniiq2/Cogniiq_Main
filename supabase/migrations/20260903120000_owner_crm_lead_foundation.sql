-- =============================================================================
-- PR 70A — Owner CRM core: the PRE-CUSTOMER MANUAL SALES FOUNDATION
--
-- SCOPE
-- -----
-- This migration adds the sales-domain layer that sits IN FRONT of the canonical
-- customer, and nothing else:
--
--   owner_leads                    one manually entered prospect / opportunity
--   owner_lead_service_interests   which catalogue services the prospect wants
--   owner_lead_follow_ups          "call them back on Thursday", with completion
--   owner_lead_activity            append-only, sanitised sales timeline
--   owner_lead_integration_checks  the PRE-OFFER PVS / interface / cost gate
--
-- plus the owner-gated RPCs that are the ONLY way to write any of them.
--
-- DELIBERATELY NOT IN THIS MIGRATION
-- ----------------------------------
-- No lead -> customer conversion. No owner_customer_tasks change (no lead_id
-- column, no NOT NULL relaxation, no polymorphic task table). No owner_offers
-- change and no offer provenance. No project or engagement architecture, no
-- command center, no navigation, no frontend. No sourcing, scraping,
-- enrichment, outreach, telephony, payment or tax semantics. Nothing here
-- writes to, reads from or schedules an external system, and nothing here
-- touches accounting.
--
-- Leads arrive exactly one way: a human types them in. A stage change writes an
-- activity row and NOTHING else -- it creates no customer, no project and no
-- invoice, mutates no accounting, sends no mail and triggers no external system.
--
-- SECURITY MODEL (the reason this migration exists in this shape)
-- --------------------------------------------------------------
-- The browser NEVER holds a direct write privilege on any table below.
--
--   anon           : nothing at all
--   authenticated  : SELECT only, and only through an is_platform_owner() policy
--   service_role   : nothing at all -- a service-role JWT is not an owner and
--                    holding one grants no access to the sales domain
--   every INSERT / UPDATE / DELETE goes through a SECURITY DEFINER RPC that
--   independently re-checks is_platform_owner() and pins its search_path
--
-- Table-level grants are the enforcement, not a convention: without an INSERT /
-- UPDATE / DELETE grant, a PostgREST call from a browser is refused by the
-- database before RLS is even consulted, so no screen and no hand-written fetch
-- can bypass the RPC validation. Internal helpers are revoked from every browser
-- role and are reachable only from inside the definer bodies.
--
-- MIGRATION SAFETY
-- ----------------
-- Forward-only and purely additive: it creates new objects and touches no
-- existing table, column, constraint, policy, grant or row. No DROP of anything
-- pre-existing, no TRUNCATE, no data deletion, no NOT NULL relaxation. Safe on a
-- populated production database and replay-safe (every statement is IF NOT
-- EXISTS / CREATE OR REPLACE / guarded).
-- =============================================================================

begin;

-- Fail closed on every prerequisite this file actually uses. Each name below is
-- referenced by SQL further down; nothing is listed for tidiness.
do $$
begin
  if to_regprocedure('public.is_platform_owner()') is null then
    raise exception 'PR 70A requires public.is_platform_owner() (20260710120000)';
  end if;
  if to_regprocedure('public.set_updated_at()') is null then
    raise exception 'PR 70A requires public.set_updated_at() (20260710120000)';
  end if;
  if to_regclass('public.profiles') is null then
    raise exception 'PR 70A requires public.profiles (20260710120000)';
  end if;
  if to_regclass('public.owner_business_entities') is null
     or to_regclass('public.owner_audit_log') is null
     or to_regclass('public.owner_finance_requests') is null
     or to_regprocedure('public.owner_claim_idempotency(uuid, text)') is null then
    raise exception 'PR 70A requires the owner finance foundation (20260722120000)';
  end if;
  if to_regclass('public.owner_customers') is null then
    raise exception 'PR 70A requires public.owner_customers (20260724120000)';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 1. Phone normalisation.
--
--    Used by the duplicate-detection index and by the duplicate-check RPC so
--    both agree on what "the same number" means. IMMUTABLE because it is
--    indexed: it strips non-digits, collapses a leading 00 / German 0 into the
--    country code, and then drops the trunk zero German listings habitually
--    print inside the country code -- "+49 (0)89 12 34 56" and "0049 89 123456"
--    are the same practice, and a warning that misses that is worthless. No
--    German national number begins with 0, so the removal is unambiguous.
--    Deliberately crude beyond that: it feeds an ADVISORY warning and is never
--    used to merge anything.
-- ---------------------------------------------------------------------------
create or replace function public.owner_normalize_phone(p_phone text)
returns text language sql immutable strict set search_path = pg_catalog, pg_temp as $$
  select case when left(e164, 3) = '490' then '49' || substr(e164, 4) else e164 end
  from (
    select case
      when digits = '' then null
      when left(digits, 2) = '00' then substr(digits, 3)
      when left(digits, 1) = '0'  then '49' || substr(digits, 2)
      else digits
    end as e164
    from (select regexp_replace(p_phone, '[^0-9]', '', 'g') as digits) d
  ) t;
$$;

comment on function public.owner_normalize_phone(text) is
  'Digits-only comparison key for ADVISORY duplicate detection. Never used to merge records automatically.';

-- ---------------------------------------------------------------------------
-- 2. The lead.
--
--    Creation is deliberately lightweight: one recognisable identity (a company
--    OR a contact name OR an e-mail) and nothing else is mandatory, so the owner
--    can capture a prospect mid-conversation with whatever they know at that
--    second. An empty column means "not known yet" and must never be presented
--    as an answer.
-- ---------------------------------------------------------------------------
create table if not exists public.owner_leads (
  id uuid primary key default gen_random_uuid(),
  business_entity_id uuid not null references public.owner_business_entities(id) on delete restrict,

  -- Contact
  company text,
  contact_name text,
  contact_role text,
  email text,
  phone text,
  website text,
  street text,
  postal_code text,
  city text,
  country_code text,

  -- Sales
  stage text not null default 'new' check (stage in (
    'new', 'contacted', 'qualification', 'discovery', 'interested',
    'offer_preparation', 'offer_sent', 'negotiation', 'won', 'lost')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  source text,
  source_note text,
  estimated_setup_cents bigint check (estimated_setup_cents is null or estimated_setup_cents >= 0),
  estimated_monthly_cents bigint check (estimated_monthly_cents is null or estimated_monthly_cents >= 0),
  probability_percent int check (probability_percent is null or (probability_percent between 0 and 100)),

  -- Context
  industry text,
  company_type text,
  company_size text,
  existing_systems text,
  pain_points text,
  requirements text,
  notes text,

  -- Follow-up. Cache of the earliest OPEN owner_lead_follow_ups row; maintained
  -- only by owner_lead_refresh_follow_up, never written by a client.
  preferred_channel text check (preferred_channel is null or preferred_channel in ('phone', 'email', 'meeting', 'other')),
  last_contact_at timestamptz,
  next_follow_up_at timestamptz,
  follow_up_note text,

  -- Outcome. A lost lead keeps every column above it; only these change.
  won_at timestamptz,
  lost_at timestamptz,
  lost_reason text,

  archived_at timestamptz,
  archived_by uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  last_activity_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Same rule the canonical customer uses: one human-recognisable identifier.
  constraint owner_leads_has_identity check (
    length(trim(coalesce(company, ''))) > 0
    or length(trim(coalesce(contact_name, ''))) > 0
    or length(trim(coalesce(email, ''))) > 0
  )
);

create index if not exists owner_leads_entity_stage_idx
  on public.owner_leads (business_entity_id, stage);
create index if not exists owner_leads_entity_activity_idx
  on public.owner_leads (business_entity_id, last_activity_at desc)
  where archived_at is null;
-- Follow-up queues (overdue / today / upcoming) read this one.
create index if not exists owner_leads_follow_up_idx
  on public.owner_leads (business_entity_id, next_follow_up_at)
  where next_follow_up_at is not null and archived_at is null;
-- Duplicate detection. NOT unique: advisory matching only, exactly like
-- owner_customers. Two prospects may legitimately share a switchboard number.
create index if not exists owner_leads_email_idx
  on public.owner_leads (business_entity_id, lower(btrim(email))) where email is not null;
create index if not exists owner_leads_phone_idx
  on public.owner_leads (business_entity_id, public.owner_normalize_phone(phone)) where phone is not null;

comment on table public.owner_leads is
  'Manually entered sales prospect. Populated only by a human through owner_create_lead -- there is no sourcing, enrichment, outreach or import path into this table.';
comment on column public.owner_leads.stage is
  'Sales pipeline stage. NOT a service lifecycle status, and NOT a conversion mechanism: reaching ''won'' records an activity row and changes nothing outside this table. Lead -> customer conversion is PR 70B.';
comment on column public.owner_leads.next_follow_up_at is
  'Cache of the earliest open owner_lead_follow_ups.due_at. Recomputed by owner_lead_refresh_follow_up; never written directly by a client.';

-- ---------------------------------------------------------------------------
-- 3. Service interest, follow-ups, activity.
-- ---------------------------------------------------------------------------
create table if not exists public.owner_lead_service_interests (
  lead_id uuid not null references public.owner_leads(id) on delete cascade,
  -- Deliberately the same four keys as the service catalogue. Kept as a CHECK
  -- rather than an FK because the catalogue is code, not a table.
  service_key text not null check (service_key in ('ai_receptionist', 'automations', 'website', 'custom_project')),
  created_at timestamptz not null default now(),
  primary key (lead_id, service_key)
);

create table if not exists public.owner_lead_follow_ups (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.owner_leads(id) on delete cascade,
  due_at timestamptz not null,
  reason text,
  status text not null default 'open' check (status in ('open', 'done', 'cancelled')),
  completed_at timestamptz,
  completed_by uuid references public.profiles(id) on delete set null,
  completion_note text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists owner_lead_follow_ups_open_idx
  on public.owner_lead_follow_ups (lead_id, due_at) where status = 'open';

-- Append-only, sanitised German timeline. `summary` never carries a token, a
-- storage path or a credential -- the same contract owner_customer_activity has.
-- Append-only is enforced by grants: authenticated holds SELECT and nothing
-- else, so a browser cannot insert, update or delete a timeline row at all. The
-- ONLY write path is owner_record_lead_activity, which is itself unreachable
-- from a browser and is called only from inside the owner-gated RPCs.
create table if not exists public.owner_lead_activity (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.owner_leads(id) on delete cascade,
  event_type text not null,
  summary text not null,
  -- Set only on manually logged contact; system events leave it null.
  channel text check (channel is null or channel in ('call', 'email', 'meeting', 'note', 'other')),
  occurred_at timestamptz not null default now(),
  actor_user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists owner_lead_activity_lead_idx
  on public.owner_lead_activity (lead_id, occurred_at desc);

comment on table public.owner_lead_activity is
  'Append-only sanitised sales timeline. No role holds INSERT/UPDATE/DELETE on this table; owner_record_lead_activity is the only write path.';

-- ---------------------------------------------------------------------------
-- 4. The PRE-OFFER integration and third-party-cost gate.
--
--    This exists to stop an offer being written before the four questions the
--    offer depends on have real answers. Answering them late is how a client is
--    surprised by a vendor licence fee after signing.
--
--    Operation-capability booleans are TRI-STATE. NULL means "not yet
--    established", which is NOT the same as FALSE and must never be rendered as
--    one. Nothing in this migration ever coerces NULL to false.
-- ---------------------------------------------------------------------------
create table if not exists public.owner_lead_integration_checks (
  lead_id uuid primary key references public.owner_leads(id) on delete cascade,

  pvs_name text,
  pvs_vendor text,
  pvs_version text,
  appointment_system text,

  interface_type text check (interface_type is null or interface_type in (
    'official_api', 'fhir', 'hl7', 'gdt', 'rest_api', 'partner_interface',
    'middleware', 'none', 'unknown')),
  api_documentation_obtained boolean,
  api_access_included boolean,
  partner_approval_required boolean,
  partner_approval_status text check (partner_approval_status is null or partner_approval_status in (
    'granted', 'pending', 'refused', 'not_required')),
  sandbox_available boolean,

  -- Supported operations. Tri-state; see the table comment above.
  supports_availability boolean,
  supports_booking boolean,
  supports_reschedule boolean,
  supports_cancel boolean,
  supports_patient_write boolean,

  rate_limits text,
  vendor_restrictions text,

  -- "Explicitly confirmed, including zero" is two facts, not one: the owner has
  -- ticked the confirmation AND an actual amount is recorded. 0 is a valid
  -- amount; NULL is not.
  third_party_setup_cents bigint check (third_party_setup_cents is null or third_party_setup_cents >= 0),
  third_party_monthly_cents bigint check (third_party_monthly_cents is null or third_party_monthly_cents >= 0),
  third_party_cost_note text,
  third_party_costs_confirmed boolean not null default false,

  integration_mode text check (integration_mode is null or integration_mode in (
    'full_automation', 'partial_automation', 'not_possible', 'unknown')),
  fallback_description text,

  customer_informed_at timestamptz,
  documented_in_offer_at timestamptz,

  status text not null default 'not_started' check (status in (
    'not_started', 'in_progress', 'blocked', 'complete')),
  notes text,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- The gate itself, as a TABLE CONSTRAINT.
--
-- The RPC below checks the same five conditions first so the owner gets a
-- specific German message instead of a constraint name. This constraint is what
-- makes the claim TRUE rather than merely intended: it holds for every write
-- path that exists now or is added later, including a superuser, a future
-- migration and a direct psql session. Added in a guarded block rather than
-- inline so a replay onto an already-created table still installs it.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.owner_lead_integration_checks'::regclass
      and conname = 'owner_lead_integration_checks_complete_gate'
  ) then
    alter table public.owner_lead_integration_checks
      add constraint owner_lead_integration_checks_complete_gate check (
        status <> 'complete' or (
          -- 1. the environment is identified: a PVS or an appointment system
          (coalesce(btrim(pvs_name), '') <> '' or coalesce(btrim(appointment_system), '') <> '')
          -- 2. the interface question is ANSWERED. 'none' is an answer.
          --    NULL is not, and neither is 'unknown'.
          and interface_type is not null and interface_type <> 'unknown'
          -- 3. third-party costs explicitly confirmed, including zero
          and third_party_costs_confirmed
          and third_party_setup_cents is not null
          and third_party_monthly_cents is not null
          -- 4. the integration mode is actually decided
          and integration_mode is not null and integration_mode <> 'unknown'
          -- 5. anything short of full automation states its fallback
          and (integration_mode = 'full_automation'
               or coalesce(btrim(fallback_description), '') <> '')
        )
      );
  end if;
end;
$$;

comment on table public.owner_lead_integration_checks is
  'Pre-offer assessment: can this prospect''s appointment/PVS environment actually be integrated, and what does a third party charge for it. status = ''complete'' is refused by a table constraint until all five conditions hold, so the gate is a database fact and not a screen behaviour.';
comment on column public.owner_lead_integration_checks.supports_booking is
  'Tri-state. NULL = not yet established, which is NOT the same as false and must not be displayed as "Nein".';
comment on column public.owner_lead_integration_checks.third_party_costs_confirmed is
  'Explicit owner confirmation. Completing the assessment also requires a recorded amount; zero is a valid amount, NULL is not.';

commit;

-- ---------------------------------------------------------------------------
-- 5. Triggers: updated_at and a sanitised audit trail.
--
--    A DEDICATED audit function rather than the generic public.owner_write_audit_row().
--    The generic factory resolves the business entity as
--      coalesce(row->>'business_entity_id', row->>'id')
--    which is correct only for owner_business_entities and wrong for any table
--    that simply lacks the column -- the exact defect migration 20260830122000
--    had to repair in production. owner_lead_integration_checks has neither
--    column (its primary key is lead_id), so it resolves the entity honestly
--    through the lead, or fails, and never substitutes an arbitrary row id.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_write_lead_audit_row()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare
  -- Superset of the generic factory's list plus every free-text sales column, so
  -- prospect notes, pain points and vendor terms never land in the audit log.
  strip text[] := array['notes', 'source_note', 'existing_systems', 'pain_points', 'requirements',
    'follow_up_note', 'lost_reason', 'rate_limits', 'vendor_restrictions',
    'third_party_cost_note', 'fallback_description', 'before_summary', 'after_summary', 'metadata'];
  v_new jsonb;
  v_old jsonb;
  v_row jsonb;
  v_entity uuid;
  v_lead uuid;
  v_rid uuid;
begin
  if tg_op <> 'DELETE' then v_new := to_jsonb(new) - strip; end if;
  if tg_op <> 'INSERT' then v_old := to_jsonb(old) - strip; end if;
  v_row := coalesce(v_new, v_old);

  -- 1. The row carries the entity itself (owner_leads).
  v_entity := nullif(v_row->>'business_entity_id', '')::uuid;

  -- 2. Otherwise resolve it through the lead (owner_lead_integration_checks).
  if v_entity is null then
    v_lead := nullif(v_row->>'lead_id', '')::uuid;
    if v_lead is not null then
      select l.business_entity_id into v_entity from public.owner_leads l where l.id = v_lead;
    end if;
  end if;

  -- 3. There is no third option. Never substitute a row id for an entity id.
  if v_entity is null then
    raise exception 'owner_write_lead_audit_row: cannot resolve a business entity for %', tg_argv[0];
  end if;

  v_rid := coalesce(nullif(v_row->>'id', ''), nullif(v_row->>'lead_id', ''))::uuid;

  insert into public.owner_audit_log (business_entity_id, actor_user_id, action, resource_type,
    resource_id, before_summary, after_summary)
  values (v_entity, auth.uid(), tg_argv[0] || '.' || lower(tg_op), tg_argv[0], v_rid, v_old, v_new);
  return coalesce(new, old);
end;
$$;
revoke execute on function public.owner_write_lead_audit_row() from public, anon, authenticated, service_role;

do $$
declare t text;
begin
  foreach t in array array['owner_leads', 'owner_lead_follow_ups', 'owner_lead_integration_checks'] loop
    execute format('drop trigger if exists %I on public.%I', t || '_set_updated_at', t);
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', t || '_set_updated_at', t);
  end loop;
  foreach t in array array['owner_leads', 'owner_lead_integration_checks'] loop
    execute format('drop trigger if exists %I on public.%I', t || '_audit', t);
    execute format('create trigger %I after insert or update or delete on public.%I for each row execute function public.owner_write_lead_audit_row(%L)', t || '_audit', t, t);
  end loop;
end;
$$;

commit;

-- ---------------------------------------------------------------------------
-- 6. RLS and the grant matrix.
--
--    THE GRANT MATRIX IS THE SECURITY BOUNDARY. RLS alone is not enough: a
--    policy that permits an owner to UPDATE means an owner's browser session can
--    PATCH the table directly through PostgREST and set, say,
--    owner_lead_integration_checks.status = 'complete' without ever entering the
--    RPC that validates it. So no browser role receives INSERT, UPDATE or
--    DELETE on any table here. The SELECT policy still requires
--    is_platform_owner(), so an ordinary authenticated user reads zero rows.
--
--    service_role is granted nothing either. A service-role JWT is not an owner,
--    and possessing one must not be a way into the sales domain.
-- ---------------------------------------------------------------------------
begin;

do $$
declare t text;
begin
  foreach t in array array[
    'owner_leads', 'owner_lead_service_interests', 'owner_lead_follow_ups',
    'owner_lead_activity', 'owner_lead_integration_checks'
  ] loop
    execute format('alter table public.%I enable row level security', t);

    -- SELECT ONLY. There is deliberately no ALL / INSERT / UPDATE / DELETE policy.
    execute format('drop policy if exists %I on public.%I', t || '_owner_select', t);
    execute format('create policy %I on public.%I for select to authenticated using (public.is_platform_owner())', t || '_owner_select', t);

    -- Withdraw everything Supabase's default privileges hand out in `public`,
    -- then hand back exactly one privilege.
    execute format('revoke all on table public.%I from public, anon, authenticated, service_role', t);
    execute format('grant select on table public.%I to authenticated', t);
  end loop;
end;
$$;

commit;

-- ---------------------------------------------------------------------------
-- 7. Internal helpers.
--
--    Not callable by a browser: revoked from anon, authenticated AND
--    service_role, and reached only from inside the owner-gated SECURITY
--    DEFINER bodies below, which execute as the definer.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_record_lead_activity(
  p_lead_id uuid, p_event_type text, p_summary text,
  p_channel text default null, p_occurred_at timestamptz default null
) returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not exists (select 1 from public.owner_leads where id = p_lead_id) then return; end if;
  insert into public.owner_lead_activity (lead_id, event_type, summary, channel, occurred_at, actor_user_id)
  values (p_lead_id, p_event_type, left(p_summary, 500), p_channel, coalesce(p_occurred_at, now()), auth.uid());
  update public.owner_leads set last_activity_at = now() where id = p_lead_id;
end;
$$;
revoke execute on function public.owner_record_lead_activity(uuid, text, text, text, timestamptz)
  from public, anon, authenticated, service_role;

-- The lead's next_follow_up_at / follow_up_note are a CACHE of the earliest OPEN
-- follow-up. Recomputing from the table (rather than writing both places) means
-- the two can never disagree, whatever order the owner completes things in.
create or replace function public.owner_lead_refresh_follow_up(p_lead_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare f record;
begin
  select due_at, reason into f
  from public.owner_lead_follow_ups
  where lead_id = p_lead_id and status = 'open'
  order by due_at asc, id asc limit 1;

  update public.owner_leads
  set next_follow_up_at = f.due_at, follow_up_note = f.reason
  where id = p_lead_id;
end;
$$;
revoke execute on function public.owner_lead_refresh_follow_up(uuid)
  from public, anon, authenticated, service_role;

-- Display name, in the order a human would recognise the prospect.
create or replace function public.owner_lead_display_name(p_lead public.owner_leads)
returns text language sql immutable set search_path = pg_catalog, pg_temp as $$
  select coalesce(
    nullif(btrim(p_lead.company), ''),
    nullif(btrim(p_lead.contact_name), ''),
    nullif(btrim(p_lead.email), ''),
    'Lead');
$$;

-- Host only, so https://praxis-mueller.de/kontakt and www.praxis-mueller.de
-- compare equal. Shared by the index-free duplicate scan so lead and customer
-- rows are judged by the same rule.
create or replace function public.owner_normalize_domain(p_url text)
returns text language sql immutable set search_path = pg_catalog, pg_temp as $$
  select nullif(split_part(
    regexp_replace(regexp_replace(lower(btrim(coalesce(p_url, ''))), '^https?://', ''), '^www\.', ''),
    '/', 1), '');
$$;

revoke execute on function public.owner_normalize_phone(text) from public, anon, authenticated, service_role;
revoke execute on function public.owner_normalize_domain(text) from public, anon, authenticated, service_role;
revoke execute on function public.owner_lead_display_name(public.owner_leads) from public, anon, authenticated, service_role;

commit;

-- ---------------------------------------------------------------------------
-- 8. Duplicate detection -- ADVISORY ONLY.
--
--    Returns likely matches across leads AND canonical customers so the owner is
--    warned about "this is already a customer", not only "this is already a
--    lead". It never merges, never blocks and never decides. E-mail, normalised
--    phone and website domain are STRONG signals; a shared company or contact
--    name alone is WEAK, precisely because two practices genuinely can be called
--    "Praxis Dr. Müller".
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_find_lead_duplicates(
  p_entity_id uuid, p_payload jsonb, p_exclude_lead_id uuid default null
) returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  v_email text; v_phone text; v_company text; v_contact text; v_domain text; v_rows jsonb;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  if p_entity_id is null then raise exception 'business_entity_id is required'; end if;

  v_email   := lower(nullif(btrim(p_payload->>'email'), ''));
  v_phone   := public.owner_normalize_phone(nullif(btrim(p_payload->>'phone'), ''));
  v_company := lower(nullif(btrim(p_payload->>'company'), ''));
  v_contact := lower(nullif(btrim(p_payload->>'contact_name'), ''));
  v_domain  := public.owner_normalize_domain(p_payload->>'website');

  if v_email is null and v_phone is null and v_company is null
     and v_contact is null and v_domain is null then
    return jsonb_build_array();
  end if;

  select coalesce(jsonb_agg(to_jsonb(m) order by m.confidence, m.name), jsonb_build_array())
  into v_rows
  from (
    select
      'lead'::text as kind,
      l.id,
      public.owner_lead_display_name(l) as name,
      l.stage as state,
      l.city,
      case
        when v_email  is not null and lower(btrim(l.email)) = v_email then 'email'
        when v_phone  is not null and public.owner_normalize_phone(l.phone) = v_phone then 'phone'
        when v_domain is not null and public.owner_normalize_domain(l.website) = v_domain then 'website'
        when v_company is not null and lower(btrim(l.company)) = v_company then 'company'
        else 'contact_name'
      end as matched_on,
      case
        when v_email  is not null and lower(btrim(l.email)) = v_email then 'strong'
        when v_phone  is not null and public.owner_normalize_phone(l.phone) = v_phone then 'strong'
        when v_domain is not null and public.owner_normalize_domain(l.website) = v_domain then 'strong'
        else 'weak'
      end as confidence
    from public.owner_leads l
    where l.business_entity_id = p_entity_id
      and (p_exclude_lead_id is null or l.id <> p_exclude_lead_id)
      and (
        (v_email  is not null and lower(btrim(l.email)) = v_email)
        or (v_phone  is not null and public.owner_normalize_phone(l.phone) = v_phone)
        or (v_domain is not null and public.owner_normalize_domain(l.website) = v_domain)
        or (v_company is not null and lower(btrim(l.company)) = v_company)
        or (v_contact is not null and lower(btrim(l.contact_name)) = v_contact)
      )

    union all

    select
      'customer'::text,
      c.id,
      coalesce(nullif(btrim(c.company), ''), nullif(btrim(c.contact_name), ''), c.email, 'Kunde'),
      c.status,
      c.city,
      case
        when v_email is not null and lower(btrim(c.email)) = v_email then 'email'
        when v_phone is not null and public.owner_normalize_phone(c.phone) = v_phone then 'phone'
        when v_company is not null and lower(btrim(c.company)) = v_company then 'company'
        else 'contact_name'
      end,
      case
        when v_email is not null and lower(btrim(c.email)) = v_email then 'strong'
        when v_phone is not null and public.owner_normalize_phone(c.phone) = v_phone then 'strong'
        else 'weak'
      end
    from public.owner_customers c
    where c.business_entity_id = p_entity_id
      and (
        (v_email is not null and lower(btrim(c.email)) = v_email)
        or (v_phone is not null and public.owner_normalize_phone(c.phone) = v_phone)
        or (v_company is not null and lower(btrim(c.company)) = v_company)
        or (v_contact is not null and lower(btrim(c.contact_name)) = v_contact)
      )
  ) m;

  return v_rows;
end;
$$;

comment on function public.owner_find_lead_duplicates(uuid, jsonb, uuid) is
  'Advisory duplicate warning across leads and customers. Never merges, never blocks, never decides.';

commit;

-- ---------------------------------------------------------------------------
-- 9. Lead CRUD.
--
--    Duplicate matches are RETURNED, never acted on: the caller decides whether
--    to keep going. Stage and outcome columns are NOT settable through the
--    generic update, so the activity trail cannot be bypassed.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_create_lead(p_idempotency_key uuid, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_existing jsonb; v_entity uuid; v_id uuid; v_result jsonb;
  v_company text; v_contact text; v_email text; v_stage text; v_priority text;
  v_service text; v_due timestamptz;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  v_existing := public.owner_claim_idempotency(p_idempotency_key, 'owner_create_lead');
  if v_existing is not null then return v_existing; end if;

  v_entity := nullif(p_payload->>'business_entity_id', '')::uuid;
  if v_entity is null then raise exception 'business_entity_id is required'; end if;
  if not exists (select 1 from public.owner_business_entities where id = v_entity) then
    raise exception 'unknown business entity';
  end if;

  v_company := nullif(btrim(p_payload->>'company'), '');
  v_contact := nullif(btrim(p_payload->>'contact_name'), '');
  v_email   := nullif(btrim(p_payload->>'email'), '');
  if v_company is null and v_contact is null and v_email is null then
    raise exception 'a lead needs at least a company, a contact or an email';
  end if;

  v_stage := coalesce(nullif(p_payload->>'stage', ''), 'new');
  if v_stage in ('won', 'lost') then
    raise exception 'a new lead cannot start as won or lost';
  end if;
  v_priority := coalesce(nullif(p_payload->>'priority', ''), 'normal');

  insert into public.owner_leads (
    business_entity_id, company, contact_name, contact_role, email, phone, website,
    street, postal_code, city, country_code,
    stage, priority, source, source_note,
    estimated_setup_cents, estimated_monthly_cents, probability_percent,
    industry, company_type, company_size, existing_systems, pain_points, requirements, notes,
    preferred_channel, last_contact_at, created_by)
  values (
    v_entity, v_company, v_contact, nullif(btrim(p_payload->>'contact_role'), ''), v_email,
    nullif(btrim(p_payload->>'phone'), ''), nullif(btrim(p_payload->>'website'), ''),
    nullif(btrim(p_payload->>'street'), ''), nullif(btrim(p_payload->>'postal_code'), ''),
    nullif(btrim(p_payload->>'city'), ''), nullif(btrim(p_payload->>'country_code'), ''),
    v_stage, v_priority,
    nullif(btrim(p_payload->>'source'), ''), nullif(btrim(p_payload->>'source_note'), ''),
    nullif(p_payload->>'estimated_setup_cents', '')::bigint,
    nullif(p_payload->>'estimated_monthly_cents', '')::bigint,
    nullif(p_payload->>'probability_percent', '')::int,
    nullif(btrim(p_payload->>'industry'), ''), nullif(btrim(p_payload->>'company_type'), ''),
    nullif(btrim(p_payload->>'company_size'), ''), nullif(btrim(p_payload->>'existing_systems'), ''),
    nullif(btrim(p_payload->>'pain_points'), ''), nullif(btrim(p_payload->>'requirements'), ''),
    nullif(btrim(p_payload->>'notes'), ''),
    nullif(p_payload->>'preferred_channel', ''), nullif(p_payload->>'last_contact_at', '')::timestamptz,
    auth.uid())
  returning id into v_id;

  for v_service in select jsonb_array_elements_text(coalesce(p_payload->'service_interests', '[]'::jsonb)) loop
    insert into public.owner_lead_service_interests (lead_id, service_key)
    values (v_id, v_service) on conflict do nothing;
  end loop;

  v_due := nullif(p_payload->>'next_follow_up_at', '')::timestamptz;
  if v_due is not null then
    insert into public.owner_lead_follow_ups (lead_id, due_at, reason, created_by)
    values (v_id, v_due, nullif(btrim(p_payload->>'follow_up_note'), ''), auth.uid());
    perform public.owner_lead_refresh_follow_up(v_id);
  end if;

  perform public.owner_record_lead_activity(
    v_id, 'lead_created', 'Lead angelegt: ' || coalesce(v_company, v_contact, v_email));

  -- Advisory only. The duplicates ride back with the new lead; nothing is merged
  -- and nothing is blocked.
  v_result := jsonb_build_object(
    'lead_id', v_id,
    'duplicates', public.owner_find_lead_duplicates(v_entity, p_payload, v_id));
  update public.owner_finance_requests set result = v_result where idempotency_key = p_idempotency_key;
  return v_result;
end;
$$;

-- Patch semantics, like owner_update_customer: a key that is absent is left
-- alone, a key present with an empty value clears the column.
create or replace function public.owner_update_lead(p_lead_id uuid, p_patch jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare l record; v_service text;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  select * into l from public.owner_leads where id = p_lead_id;
  if l.id is null then raise exception 'lead not found'; end if;
  if (p_patch ? 'priority') and (p_patch->>'priority') not in ('low','normal','high','urgent') then
    raise exception 'invalid lead priority';
  end if;
  if (p_patch ? 'preferred_channel') and nullif(p_patch->>'preferred_channel','') is not null
     and (p_patch->>'preferred_channel') not in ('phone','email','meeting','other') then
    raise exception 'invalid contact channel';
  end if;

  update public.owner_leads set
    company                 = case when p_patch ? 'company'                 then nullif(btrim(p_patch->>'company'), '')                 else company end,
    contact_name            = case when p_patch ? 'contact_name'            then nullif(btrim(p_patch->>'contact_name'), '')            else contact_name end,
    contact_role            = case when p_patch ? 'contact_role'            then nullif(btrim(p_patch->>'contact_role'), '')            else contact_role end,
    email                   = case when p_patch ? 'email'                   then nullif(btrim(p_patch->>'email'), '')                   else email end,
    phone                   = case when p_patch ? 'phone'                   then nullif(btrim(p_patch->>'phone'), '')                   else phone end,
    website                 = case when p_patch ? 'website'                 then nullif(btrim(p_patch->>'website'), '')                 else website end,
    street                  = case when p_patch ? 'street'                  then nullif(btrim(p_patch->>'street'), '')                  else street end,
    postal_code             = case when p_patch ? 'postal_code'             then nullif(btrim(p_patch->>'postal_code'), '')             else postal_code end,
    city                    = case when p_patch ? 'city'                    then nullif(btrim(p_patch->>'city'), '')                    else city end,
    country_code            = case when p_patch ? 'country_code'            then nullif(btrim(p_patch->>'country_code'), '')            else country_code end,
    priority                = case when p_patch ? 'priority'                then p_patch->>'priority'                                   else priority end,
    source                  = case when p_patch ? 'source'                  then nullif(btrim(p_patch->>'source'), '')                  else source end,
    source_note             = case when p_patch ? 'source_note'             then nullif(btrim(p_patch->>'source_note'), '')             else source_note end,
    estimated_setup_cents   = case when p_patch ? 'estimated_setup_cents'   then nullif(p_patch->>'estimated_setup_cents', '')::bigint   else estimated_setup_cents end,
    estimated_monthly_cents = case when p_patch ? 'estimated_monthly_cents' then nullif(p_patch->>'estimated_monthly_cents', '')::bigint else estimated_monthly_cents end,
    probability_percent     = case when p_patch ? 'probability_percent'     then nullif(p_patch->>'probability_percent', '')::int        else probability_percent end,
    industry                = case when p_patch ? 'industry'                then nullif(btrim(p_patch->>'industry'), '')                else industry end,
    company_type            = case when p_patch ? 'company_type'            then nullif(btrim(p_patch->>'company_type'), '')            else company_type end,
    company_size            = case when p_patch ? 'company_size'            then nullif(btrim(p_patch->>'company_size'), '')            else company_size end,
    existing_systems        = case when p_patch ? 'existing_systems'        then nullif(btrim(p_patch->>'existing_systems'), '')        else existing_systems end,
    pain_points             = case when p_patch ? 'pain_points'             then nullif(btrim(p_patch->>'pain_points'), '')             else pain_points end,
    requirements            = case when p_patch ? 'requirements'            then nullif(btrim(p_patch->>'requirements'), '')            else requirements end,
    notes                   = case when p_patch ? 'notes'                   then nullif(btrim(p_patch->>'notes'), '')                   else notes end,
    preferred_channel       = case when p_patch ? 'preferred_channel'       then nullif(p_patch->>'preferred_channel', '')              else preferred_channel end,
    last_contact_at         = case when p_patch ? 'last_contact_at'         then nullif(p_patch->>'last_contact_at', '')::timestamptz   else last_contact_at end
  where id = p_lead_id;

  -- Service interests are replaced wholesale when the key is present.
  if p_patch ? 'service_interests' then
    delete from public.owner_lead_service_interests
    where lead_id = p_lead_id
      and service_key not in (
        select jsonb_array_elements_text(coalesce(p_patch->'service_interests', '[]'::jsonb)));
    for v_service in select jsonb_array_elements_text(coalesce(p_patch->'service_interests', '[]'::jsonb)) loop
      insert into public.owner_lead_service_interests (lead_id, service_key)
      values (p_lead_id, v_service) on conflict do nothing;
    end loop;
  end if;

  perform public.owner_record_lead_activity(p_lead_id, 'lead_updated', 'Lead-Daten aktualisiert');
  return jsonb_build_object('lead_id', p_lead_id);
end;
$$;

-- Archiving is reversible and never deletes. There is deliberately no
-- hard-delete RPC for a lead: sales history is the one thing this layer exists
-- to keep.
create or replace function public.owner_set_lead_archived(p_lead_id uuid, p_archived boolean)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  if p_archived is null then raise exception 'archived must be true or false'; end if;
  if not exists (select 1 from public.owner_leads where id = p_lead_id) then raise exception 'lead not found'; end if;

  update public.owner_leads
  set archived_at = case when p_archived then coalesce(archived_at, now()) else null end,
      archived_by = case when p_archived then coalesce(archived_by, auth.uid()) else null end
  where id = p_lead_id;

  perform public.owner_record_lead_activity(p_lead_id,
    case when p_archived then 'lead_archived' else 'lead_restored' end,
    case when p_archived then 'Lead archiviert' else 'Lead wiederhergestellt' end);
  return jsonb_build_object('lead_id', p_lead_id, 'archived', p_archived);
end;
$$;

commit;

-- ---------------------------------------------------------------------------
-- 10. Stage, outcome and reopening.
--
--     Changing a stage records an activity row and NOTHING ELSE. It creates no
--     customer, no project and no invoice, mutates no accounting, sends no mail
--     and triggers no external system. 'won' here means "the owner marked this
--     opportunity won" -- conversion into a customer is PR 70B and does not
--     exist yet.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_set_lead_stage(p_lead_id uuid, p_stage text, p_note text default null)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare l record; v_label text;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  if p_stage not in ('new','contacted','qualification','discovery','interested',
                     'offer_preparation','offer_sent','negotiation','won','lost') then
    raise exception 'invalid pipeline stage %', p_stage;
  end if;
  select * into l from public.owner_leads where id = p_lead_id for update;
  if l.id is null then raise exception 'lead not found'; end if;
  if p_stage = 'lost' and nullif(btrim(coalesce(p_note, '')), '') is null then
    raise exception 'a lost opportunity needs a reason';
  end if;

  v_label := case p_stage
    when 'new' then 'Neu' when 'contacted' then 'Kontaktiert'
    when 'qualification' then 'Qualifizierung' when 'discovery' then 'Termin / Analyse'
    when 'interested' then 'Interessiert' when 'offer_preparation' then 'Angebot in Vorbereitung'
    when 'offer_sent' then 'Angebot versendet' when 'negotiation' then 'Verhandlung'
    when 'won' then 'Gewonnen' else 'Verloren' end;

  update public.owner_leads set
    stage = p_stage,
    won_at  = case when p_stage = 'won'  then coalesce(won_at, now())  else null end,
    lost_at = case when p_stage = 'lost' then coalesce(lost_at, now()) else null end,
    -- A reopened lead keeps its history; only the reason for a loss that is no
    -- longer a loss is cleared.
    lost_reason = case when p_stage = 'lost' then btrim(p_note) else null end
  where id = p_lead_id;

  perform public.owner_record_lead_activity(p_lead_id,
    case p_stage when 'won' then 'lead_won' when 'lost' then 'lead_lost' else 'stage_changed' end,
    case
      when p_stage = 'lost' then 'Als verloren markiert: ' || btrim(p_note)
      when p_stage = 'won'  then 'Als gewonnen markiert'
      when l.stage = 'lost' then 'Lead wieder geöffnet — Phase: ' || v_label
      else 'Phase geändert auf: ' || v_label
    end);

  return jsonb_build_object('lead_id', p_lead_id, 'stage', p_stage);
end;
$$;

commit;

-- ---------------------------------------------------------------------------
-- 11. Follow-ups and manually logged contact.
--
--     Completing a follow-up may create exactly ONE successor, passed in by the
--     owner. There is no recurrence, no auto-scheduling and no sequence.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_upsert_lead_follow_up(
  p_lead_id uuid, p_follow_up_id uuid, p_due_at timestamptz, p_reason text
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id uuid;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  if not exists (select 1 from public.owner_leads where id = p_lead_id) then raise exception 'lead not found'; end if;
  if p_due_at is null then raise exception 'a follow-up needs a date'; end if;

  if p_follow_up_id is null then
    insert into public.owner_lead_follow_ups (lead_id, due_at, reason, created_by)
    values (p_lead_id, p_due_at, nullif(btrim(p_reason), ''), auth.uid())
    returning id into v_id;
    perform public.owner_record_lead_activity(p_lead_id, 'follow_up_created',
      'Follow-up gesetzt' || coalesce(': ' || nullif(btrim(p_reason), ''), ''));
  else
    update public.owner_lead_follow_ups
    set due_at = p_due_at, reason = nullif(btrim(p_reason), '')
    where id = p_follow_up_id and lead_id = p_lead_id and status = 'open'
    returning id into v_id;
    if v_id is null then raise exception 'open follow-up not found'; end if;
    perform public.owner_record_lead_activity(p_lead_id, 'follow_up_updated', 'Follow-up angepasst');
  end if;

  perform public.owner_lead_refresh_follow_up(p_lead_id);
  return jsonb_build_object('follow_up_id', v_id);
end;
$$;

create or replace function public.owner_complete_lead_follow_up(
  p_follow_up_id uuid, p_status text, p_note text default null,
  p_next_due_at timestamptz default null, p_next_reason text default null
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare f record; v_next uuid;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  if p_status not in ('done', 'cancelled') then raise exception 'invalid follow-up outcome %', p_status; end if;
  select * into f from public.owner_lead_follow_ups where id = p_follow_up_id for update;
  if f.id is null then raise exception 'follow-up not found'; end if;
  if f.status <> 'open' then raise exception 'this follow-up is already closed'; end if;

  update public.owner_lead_follow_ups
  set status = p_status, completed_at = now(), completed_by = auth.uid(),
      completion_note = nullif(btrim(p_note), '')
  where id = p_follow_up_id;

  if p_next_due_at is not null then
    insert into public.owner_lead_follow_ups (lead_id, due_at, reason, created_by)
    values (f.lead_id, p_next_due_at, nullif(btrim(p_next_reason), ''), auth.uid())
    returning id into v_next;
  end if;

  perform public.owner_lead_refresh_follow_up(f.lead_id);
  perform public.owner_record_lead_activity(f.lead_id,
    case when p_status = 'done' then 'follow_up_completed' else 'follow_up_cancelled' end,
    case when p_status = 'done' then 'Follow-up erledigt' else 'Follow-up abgebrochen' end
      || coalesce(': ' || nullif(btrim(p_note), ''), ''));

  return jsonb_build_object('follow_up_id', p_follow_up_id, 'next_follow_up_id', v_next);
end;
$$;

-- Manually logged contact and free notes. `occurred_at` is the owner's, so a
-- call logged on Monday for a conversation on Friday reads correctly. This
-- records history; it sends nothing.
create or replace function public.owner_log_lead_contact(
  p_lead_id uuid, p_channel text, p_summary text, p_occurred_at timestamptz default null
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_when timestamptz;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  if p_channel not in ('call','email','meeting','note','other') then raise exception 'invalid contact channel %', p_channel; end if;
  if nullif(btrim(coalesce(p_summary, '')), '') is null then raise exception 'a note cannot be empty'; end if;
  if not exists (select 1 from public.owner_leads where id = p_lead_id) then raise exception 'lead not found'; end if;

  v_when := coalesce(p_occurred_at, now());
  perform public.owner_record_lead_activity(p_lead_id,
    case when p_channel = 'note' then 'note_added' else 'contact_logged' end,
    btrim(p_summary), p_channel, v_when);

  -- A note is not contact. Only a real interaction moves last_contact_at.
  if p_channel <> 'note' then
    update public.owner_leads
    set last_contact_at = greatest(coalesce(last_contact_at, v_when), v_when)
    where id = p_lead_id;
  end if;

  return jsonb_build_object('lead_id', p_lead_id);
end;
$$;

commit;

-- ---------------------------------------------------------------------------
-- 12. The pre-offer integration and third-party-cost gate.
--
--     status = 'complete' is refused until all five conditions hold. The checks
--     below exist to produce a specific German message; the TABLE CONSTRAINT
--     installed in section 4 is what makes the refusal true for every write
--     path, including ones this migration cannot see.
--
--     Tri-state is preserved end to end: a key absent from the patch leaves the
--     column alone, a key present with JSON null clears it back to "unknown",
--     and only an explicit false stores false. Nothing coerces NULL to false.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_upsert_lead_integration_check(p_lead_id uuid, p_patch jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare c record;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  if not exists (select 1 from public.owner_leads where id = p_lead_id) then raise exception 'lead not found'; end if;
  if (p_patch ? 'status') and (p_patch->>'status') is distinct from null
     and (p_patch->>'status') not in ('not_started','in_progress','blocked','complete') then
    raise exception 'invalid assessment status %', p_patch->>'status';
  end if;

  insert into public.owner_lead_integration_checks (lead_id) values (p_lead_id)
  on conflict (lead_id) do nothing;

  update public.owner_lead_integration_checks set
    pvs_name                    = case when p_patch ? 'pvs_name'                    then nullif(btrim(p_patch->>'pvs_name'), '')            else pvs_name end,
    pvs_vendor                  = case when p_patch ? 'pvs_vendor'                  then nullif(btrim(p_patch->>'pvs_vendor'), '')          else pvs_vendor end,
    pvs_version                 = case when p_patch ? 'pvs_version'                 then nullif(btrim(p_patch->>'pvs_version'), '')         else pvs_version end,
    appointment_system          = case when p_patch ? 'appointment_system'          then nullif(btrim(p_patch->>'appointment_system'), '')  else appointment_system end,
    interface_type              = case when p_patch ? 'interface_type'              then nullif(p_patch->>'interface_type', '')             else interface_type end,
    api_documentation_obtained  = case when p_patch ? 'api_documentation_obtained'  then nullif(p_patch->>'api_documentation_obtained', '')::boolean else api_documentation_obtained end,
    api_access_included         = case when p_patch ? 'api_access_included'         then nullif(p_patch->>'api_access_included', '')::boolean        else api_access_included end,
    partner_approval_required   = case when p_patch ? 'partner_approval_required'   then nullif(p_patch->>'partner_approval_required', '')::boolean  else partner_approval_required end,
    partner_approval_status     = case when p_patch ? 'partner_approval_status'     then nullif(p_patch->>'partner_approval_status', '')    else partner_approval_status end,
    sandbox_available           = case when p_patch ? 'sandbox_available'           then nullif(p_patch->>'sandbox_available', '')::boolean  else sandbox_available end,
    supports_availability       = case when p_patch ? 'supports_availability'       then nullif(p_patch->>'supports_availability', '')::boolean   else supports_availability end,
    supports_booking            = case when p_patch ? 'supports_booking'            then nullif(p_patch->>'supports_booking', '')::boolean        else supports_booking end,
    supports_reschedule         = case when p_patch ? 'supports_reschedule'         then nullif(p_patch->>'supports_reschedule', '')::boolean     else supports_reschedule end,
    supports_cancel             = case when p_patch ? 'supports_cancel'             then nullif(p_patch->>'supports_cancel', '')::boolean         else supports_cancel end,
    supports_patient_write      = case when p_patch ? 'supports_patient_write'      then nullif(p_patch->>'supports_patient_write', '')::boolean  else supports_patient_write end,
    rate_limits                 = case when p_patch ? 'rate_limits'                 then nullif(btrim(p_patch->>'rate_limits'), '')          else rate_limits end,
    vendor_restrictions         = case when p_patch ? 'vendor_restrictions'         then nullif(btrim(p_patch->>'vendor_restrictions'), '')  else vendor_restrictions end,
    third_party_setup_cents     = case when p_patch ? 'third_party_setup_cents'     then nullif(p_patch->>'third_party_setup_cents', '')::bigint   else third_party_setup_cents end,
    third_party_monthly_cents   = case when p_patch ? 'third_party_monthly_cents'   then nullif(p_patch->>'third_party_monthly_cents', '')::bigint else third_party_monthly_cents end,
    third_party_cost_note       = case when p_patch ? 'third_party_cost_note'       then nullif(btrim(p_patch->>'third_party_cost_note'), '') else third_party_cost_note end,
    third_party_costs_confirmed = case when p_patch ? 'third_party_costs_confirmed' then coalesce(nullif(p_patch->>'third_party_costs_confirmed', '')::boolean, false) else third_party_costs_confirmed end,
    integration_mode            = case when p_patch ? 'integration_mode'            then nullif(p_patch->>'integration_mode', '')            else integration_mode end,
    fallback_description        = case when p_patch ? 'fallback_description'        then nullif(btrim(p_patch->>'fallback_description'), '') else fallback_description end,
    customer_informed_at        = case when p_patch ? 'customer_informed_at'        then nullif(p_patch->>'customer_informed_at', '')::timestamptz   else customer_informed_at end,
    documented_in_offer_at      = case when p_patch ? 'documented_in_offer_at'      then nullif(p_patch->>'documented_in_offer_at', '')::timestamptz else documented_in_offer_at end,
    notes                       = case when p_patch ? 'notes'                       then nullif(btrim(p_patch->>'notes'), '')                else notes end,
    status                      = case when p_patch ? 'status'                      then coalesce(nullif(p_patch->>'status', ''), 'not_started') else status end,
    updated_by                  = auth.uid()
  where lead_id = p_lead_id
  returning * into c;

  -- The five conditions, each with its own message. The table constraint says
  -- the same thing in a way no caller can route around.
  if c.status = 'complete' then
    if coalesce(btrim(c.pvs_name), '') = '' and coalesce(btrim(c.appointment_system), '') = '' then
      raise exception 'record the PVS or the appointment system before completing the assessment';
    end if;
    if c.interface_type is null or c.interface_type = 'unknown' then
      raise exception 'record which interface exists before completing the assessment ("none" is a valid answer)';
    end if;
    if not c.third_party_costs_confirmed
       or c.third_party_setup_cents is null or c.third_party_monthly_cents is null then
      raise exception 'third-party costs must be confirmed with explicit amounts (zero is allowed) before completing the assessment';
    end if;
    if c.integration_mode is null or c.integration_mode = 'unknown' then
      raise exception 'record whether this is full or partial automation before completing the assessment';
    end if;
    if c.integration_mode <> 'full_automation'
       and coalesce(btrim(c.fallback_description), '') = '' then
      raise exception 'anything short of full automation must describe its exact fallback';
    end if;
  end if;

  perform public.owner_record_lead_activity(p_lead_id, 'integration_check_updated',
    'Schnittstellen-Prüfung aktualisiert'
    || case when c.status = 'complete' then ' — abgeschlossen' else '' end);

  return jsonb_build_object('lead_id', p_lead_id, 'status', c.status);
end;
$$;

commit;

-- ---------------------------------------------------------------------------
-- 13. Read models.
--
--     Two projections shaped the way a sales surface consumes them, so no screen
--     assembles a lead from parts. There is deliberately no command-center or
--     cross-domain aggregate here: that is PR 70E.
--
--     TASK SEAM (documented on purpose, not implemented):
--     A lead may eventually need internal to-dos. This PR does NOT add a
--     `lead_id` to public.owner_customer_tasks, does not relax its NOT NULL, and
--     does NOT create a second physical task table. When task support arrives it
--     must be one task concept with one owner column resolved at the API seam --
--     `tasks` is reserved in owner_lead_detail's shape below and returns an
--     empty array until then, so a consumer written today keeps working.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_list_leads(p_entity_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v jsonb;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  if p_entity_id is null then raise exception 'business_entity_id is required'; end if;

  select coalesce(jsonb_agg(to_jsonb(r) order by r.last_activity_at desc), jsonb_build_array())
  into v
  from (
    select
      l.id, l.company, l.contact_name, l.contact_role, l.email, l.phone, l.website,
      l.city, l.postal_code, l.stage, l.priority, l.source,
      l.estimated_setup_cents, l.estimated_monthly_cents, l.probability_percent,
      l.next_follow_up_at, l.follow_up_note, l.last_contact_at, l.last_activity_at,
      l.won_at, l.lost_at, l.lost_reason, l.archived_at, l.created_at,
      public.owner_lead_display_name(l) as display_name,
      coalesce((select jsonb_agg(si.service_key order by si.service_key)
                from public.owner_lead_service_interests si where si.lead_id = l.id), '[]'::jsonb) as service_interests,
      coalesce((select ic.status from public.owner_lead_integration_checks ic where ic.lead_id = l.id), 'not_started') as integration_status
    from public.owner_leads l
    where l.business_entity_id = p_entity_id
  ) r;
  return v;
end;
$$;

create or replace function public.owner_lead_detail(p_lead_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
-- %rowtype, not `record`: owner_lead_display_name takes the owner_leads
-- composite type, and an untyped plpgsql record cannot be cast to it.
declare l public.owner_leads%rowtype; v jsonb;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  select * into l from public.owner_leads where id = p_lead_id;
  if l.id is null then return null; end if;

  select jsonb_build_object(
    'lead', to_jsonb(l) || jsonb_build_object('display_name', public.owner_lead_display_name(l)),
    'service_interests', coalesce((select jsonb_agg(si.service_key order by si.service_key)
       from public.owner_lead_service_interests si where si.lead_id = l.id), '[]'::jsonb),
    'follow_ups', coalesce((select jsonb_agg(to_jsonb(f) order by
         case when f.status = 'open' then 0 else 1 end, f.due_at desc)
       from public.owner_lead_follow_ups f where f.lead_id = l.id), '[]'::jsonb),
    'activity', coalesce((select jsonb_agg(to_jsonb(a) order by a.occurred_at desc, a.created_at desc)
       from public.owner_lead_activity a where a.lead_id = l.id), '[]'::jsonb),
    'integration_check', (select to_jsonb(ic) from public.owner_lead_integration_checks ic where ic.lead_id = l.id),
    -- Reserved seam; see the section comment. No task persistence exists in 70A.
    'tasks', '[]'::jsonb
  ) into v;
  return v;
end;
$$;

commit;

-- ---------------------------------------------------------------------------
-- 14. RPC grants.
--
--     Owner-gated in the body AND revoked from anon and public here. Only
--     `authenticated` may reach them, and only an authenticated session whose
--     database-owned profiles.platform_role is 'cogniiq_owner' gets past the
--     first line of each body.
--
--     service_role is deliberately NOT granted execute. Holding a service-role
--     key is not the same as being the owner, and nothing in this PR runs
--     server-side.
-- ---------------------------------------------------------------------------
begin;
do $$
declare sig text;
begin
  foreach sig in array array[
    'owner_create_lead(uuid, jsonb)',
    'owner_update_lead(uuid, jsonb)',
    'owner_set_lead_archived(uuid, boolean)',
    'owner_set_lead_stage(uuid, text, text)',
    'owner_upsert_lead_follow_up(uuid, uuid, timestamptz, text)',
    'owner_complete_lead_follow_up(uuid, text, text, timestamptz, text)',
    'owner_log_lead_contact(uuid, text, text, timestamptz)',
    'owner_upsert_lead_integration_check(uuid, jsonb)',
    'owner_find_lead_duplicates(uuid, jsonb, uuid)',
    'owner_list_leads(uuid)',
    'owner_lead_detail(uuid)'
  ] loop
    execute format('revoke execute on function public.%s from public, anon, service_role', sig);
    execute format('grant execute on function public.%s to authenticated', sig);
  end loop;
end;
$$;
commit;
