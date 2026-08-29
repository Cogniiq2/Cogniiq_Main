-- =============================================================================
-- Owner CRM: the manual sales layer that sits IN FRONT of the canonical customer
--
-- WHY
-- ---
-- The owner dashboard already knows how to run a CUSTOMER: owner_customers is the
-- canonical commercial identity, owner_offers/owner_invoices hang off it, and
-- migration 20260830120000 gives every purchased service a template-instantiated
-- onboarding engagement with a server-side go-live gate.
--
-- What it has never had is the step BEFORE that: a prospect the owner met, is
-- talking to, is preparing an offer for, and has not yet won. That work lived in
-- notes outside the product.
--
-- WHAT THIS ADDS
-- --------------
--   owner_leads                    one manually-entered prospect / opportunity
--   owner_lead_service_interests   which catalogue services the prospect wants
--   owner_lead_follow_ups          "call them back on Thursday", with completion
--   owner_lead_activity            append-only, sanitised sales timeline
--   owner_lead_integration_checks  the PRE-OFFER PVS / interface / cost gate
--
-- and three additive links into systems that already exist:
--   owner_offers.owner_lead_id     an offer written for a prospect
--   owner_customer_tasks.lead_id   CRM tasks, reusing the ONE task table
--   owner_leads.converted_customer_id  the lead that became this customer
--
-- MODELLING RULE THIS MIGRATION EXISTS TO PROTECT
-- ----------------------------------------------
-- A sales STAGE and a service-engagement LIFECYCLE STATUS are different things
-- that happen to share the word "lead". owner_leads.stage is the sales pipeline
-- (new → … → won/lost) and stops at conversion. owner_service_engagements
-- .lifecycle_status is the delivery pipeline (contracted → … → live) and starts
-- there. Neither column is ever used to mean the other, and no row carries both.
--
-- NOT IN SCOPE, DELIBERATELY
-- --------------------------
-- No sourcing, no scraping, no enrichment, no outreach. Nothing in this file
-- writes to, reads from or schedules an external system. Leads arrive exactly
-- one way: a human types them in.
--
-- Additive and idempotent. No existing migration is edited, no row is deleted,
-- no existing column changes type, and the only relaxed constraint is
-- owner_customer_tasks.customer_id — see section 3 for why that is safe.
-- =============================================================================

begin;

do $$
begin
  if to_regprocedure('public.is_platform_owner()') is null
    or to_regclass('public.owner_customers') is null
    or to_regclass('public.owner_offers') is null
    or to_regclass('public.owner_customer_tasks') is null
    or to_regprocedure('public.owner_claim_idempotency(uuid, text)') is null then
    raise exception 'the CRM sales layer requires the owner finance + customer foundations';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 0. Phone normalisation, used by the duplicate-detection index and by the
--    duplicate-check RPC so both agree on what "the same number" means.
--
--    IMMUTABLE because it is indexed: it only strips non-digits and collapses a
--    leading 00 / German 0 into the country code. It is deliberately crude —
--    this feeds an advisory warning, never an automatic merge.
-- ---------------------------------------------------------------------------
create or replace function public.owner_normalize_phone(p_phone text)
returns text language sql immutable strict set search_path = pg_catalog, pg_temp as $$
  select case
    when digits = '' then null
    when left(digits, 2) = '00' then substr(digits, 3)
    when left(digits, 1) = '0'  then '49' || substr(digits, 2)
    else digits
  end
  from (select regexp_replace(p_phone, '[^0-9]', '', 'g') as digits) t;
$$;

comment on function public.owner_normalize_phone(text) is
  'Digits-only comparison key for advisory duplicate detection. Never used to merge records automatically.';

-- ---------------------------------------------------------------------------
-- 1. The lead.
--
--    Every field except the identity check is optional on purpose. The owner
--    enters a prospect the moment they hear about one, with whatever they know
--    at that second; everything else is filled in later. An empty column means
--    "not known yet" and must never be presented as an answer.
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

  -- Follow-up (cache of the open follow-up; maintained by owner_lead_refresh_follow_up)
  preferred_channel text check (preferred_channel is null or preferred_channel in ('phone', 'email', 'meeting', 'other')),
  last_contact_at timestamptz,
  next_follow_up_at timestamptz,
  follow_up_note text,

  -- Outcome. A lost lead keeps every column above it; only these change.
  won_at timestamptz,
  lost_at timestamptz,
  lost_reason text,
  converted_customer_id uuid references public.owner_customers(id) on delete set null,
  converted_at timestamptz,

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
create index if not exists owner_leads_converted_idx
  on public.owner_leads (converted_customer_id) where converted_customer_id is not null;

comment on table public.owner_leads is
  'Manually entered sales prospect. Populated only by a human through owner_create_lead — there is no sourcing, enrichment or import path into this table.';
comment on column public.owner_leads.stage is
  'Sales pipeline stage. NOT a service lifecycle status: delivery state lives on owner_service_engagements.lifecycle_status and only exists after conversion.';
comment on column public.owner_leads.next_follow_up_at is
  'Cache of the earliest open owner_lead_follow_ups.due_at. Recomputed by owner_lead_refresh_follow_up; never written directly by a client.';

-- ---------------------------------------------------------------------------
-- 2. Service interest, follow-ups, activity, and the pre-offer integration gate.
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
-- storage path or a credential — the same contract owner_customer_activity has.
create table if not exists public.owner_lead_activity (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.owner_leads(id) on delete cascade,
  event_type text not null,
  summary text not null,
  -- Set only on manually logged contact; system events leave it null.
  channel text check (channel is null or channel in ('call', 'email', 'meeting', 'note', 'other')),
  occurred_at timestamptz not null default now(),
  related_offer_id uuid references public.owner_offers(id) on delete set null,
  actor_user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists owner_lead_activity_lead_idx
  on public.owner_lead_activity (lead_id, occurred_at desc);

-- The PRE-OFFER gate (spec §18). One row per lead, created on demand.
--
-- This exists SEPARATELY from the engagement's `software` / `integration`
-- sections on purpose. Those are filled in after the contract, to build the
-- thing. This is filled in BEFORE the offer, to find out whether the thing can
-- be built at all and what the customer will be charged by a third party for it.
-- Answering it late is how a client is surprised by a vendor licence fee after
-- signing.
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

  -- Supported operations. NULL means "not yet established" — which is not the
  -- same as "no", and must never be rendered as one.
  supports_availability boolean,
  supports_booking boolean,
  supports_reschedule boolean,
  supports_cancel boolean,
  supports_patient_write boolean,

  rate_limits text,
  vendor_restrictions text,

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

comment on table public.owner_lead_integration_checks is
  'Pre-offer assessment: can this prospect''s appointment/PVS environment actually be integrated, and what does a third party charge for it. Deliberately separate from the engagement''s post-contract integration section.';
comment on column public.owner_lead_integration_checks.supports_booking is
  'Tri-state. NULL = not yet established, which is not the same as false and must not be displayed as "Nein".';

commit;

-- ---------------------------------------------------------------------------
-- 3. Additive links into the systems that already exist.
--
--    owner_customer_tasks.customer_id loses NOT NULL so the ONE task table can
--    also carry a CRM task on a prospect. This is safe:
--      * every existing row has a customer_id, and the new CHECK requires
--        exactly one of (customer_id, lead_id), so no existing row is affected;
--      * every existing RPC writes customer_id and every existing read filters
--        on it, so lead tasks are invisible to the customer surfaces;
--      * the alternative — a second task table — is the parallel system this
--        codebase deliberately does not build.
--
--    owner_offers.owner_lead_id is NOT in owner_guard_offer's frozen-column
--    blocklist, so an offer can still be linked to its prospect after it has
--    been finalised, exactly as owner_customer_id already can.
-- ---------------------------------------------------------------------------
begin;

alter table public.owner_customer_tasks
  add column if not exists lead_id uuid references public.owner_leads(id) on delete cascade;

alter table public.owner_customer_tasks alter column customer_id drop not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.owner_customer_tasks'::regclass
      and conname = 'owner_customer_tasks_one_owner'
  ) then
    alter table public.owner_customer_tasks
      add constraint owner_customer_tasks_one_owner check (
        (customer_id is not null and lead_id is null)
        or (customer_id is null and lead_id is not null)
      );
  end if;
end;
$$;

create index if not exists owner_customer_tasks_lead_idx
  on public.owner_customer_tasks (lead_id, sort_order) where lead_id is not null;
-- The command center's "overdue internal tasks" queue.
create index if not exists owner_customer_tasks_due_open_idx
  on public.owner_customer_tasks (business_entity_id, due_date)
  where status in ('open', 'in_progress') and due_date is not null;

comment on column public.owner_customer_tasks.lead_id is
  'Set instead of customer_id for a CRM task on a prospect. Exactly one of the two is always non-null.';

alter table public.owner_offers
  add column if not exists owner_lead_id uuid references public.owner_leads(id) on delete set null;
create index if not exists owner_offers_owner_lead_idx
  on public.owner_offers (owner_lead_id) where owner_lead_id is not null;

commit;

-- ---------------------------------------------------------------------------
-- 4. Triggers: updated_at + the append-only audit trail.
-- ---------------------------------------------------------------------------
begin;

do $$
declare t text;
begin
  foreach t in array array['owner_leads', 'owner_lead_follow_ups', 'owner_lead_integration_checks'] loop
    execute format('drop trigger if exists %I on public.%I', t || '_set_updated_at', t);
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', t || '_set_updated_at', t);
  end loop;
  foreach t in array array['owner_leads', 'owner_lead_integration_checks'] loop
    execute format('drop trigger if exists %I on public.%I', t || '_audit', t);
    execute format('create trigger %I after insert or update or delete on public.%I for each row execute function public.owner_write_audit_row(%L)', t || '_audit', t, t);
  end loop;
end;
$$;

commit;

-- ---------------------------------------------------------------------------
-- 5. RLS + grants. Owner-only, everywhere, with activity append-only.
--
--    Three layers, and the UI is none of them: the tables are revoked from anon
--    and from public, the policies require is_platform_owner(), and every write
--    below goes through a SECURITY DEFINER function that checks it again.
-- ---------------------------------------------------------------------------
begin;

do $$
declare t text;
begin
  foreach t in array array[
    'owner_leads', 'owner_lead_service_interests', 'owner_lead_follow_ups',
    'owner_lead_integration_checks'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_owner_all', t);
    execute format('create policy %I on public.%I for all to authenticated using (public.is_platform_owner()) with check (public.is_platform_owner())', t || '_owner_all', t);
    execute format('revoke all on table public.%I from public, anon, authenticated', t);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', t);
    execute format('grant select, insert, update, delete on table public.%I to service_role', t);
  end loop;
end;
$$;

alter table public.owner_lead_activity enable row level security;
drop policy if exists owner_lead_activity_owner_select on public.owner_lead_activity;
create policy owner_lead_activity_owner_select on public.owner_lead_activity
  for select to authenticated using (public.is_platform_owner());
drop policy if exists owner_lead_activity_owner_insert on public.owner_lead_activity;
create policy owner_lead_activity_owner_insert on public.owner_lead_activity
  for insert to authenticated with check (public.is_platform_owner());
revoke all on table public.owner_lead_activity from public, anon, authenticated;
grant select, insert on table public.owner_lead_activity to authenticated;
grant select, insert, update, delete on table public.owner_lead_activity to service_role;

commit;

-- ---------------------------------------------------------------------------
-- 6. Internal helpers. Not callable by a browser: revoked from authenticated
--    and only ever reached from inside the owner-gated RPCs below.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_record_lead_activity(
  p_lead_id uuid, p_event_type text, p_summary text,
  p_channel text default null, p_occurred_at timestamptz default null,
  p_offer_id uuid default null
) returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not exists (select 1 from public.owner_leads where id = p_lead_id) then return; end if;
  insert into public.owner_lead_activity (lead_id, event_type, summary, channel, occurred_at, related_offer_id, actor_user_id)
  values (p_lead_id, p_event_type, left(p_summary, 500), p_channel, coalesce(p_occurred_at, now()), p_offer_id, auth.uid());
  update public.owner_leads set last_activity_at = now() where id = p_lead_id;
end;
$$;
revoke execute on function public.owner_record_lead_activity(uuid, text, text, text, timestamptz, uuid) from public, anon, authenticated;
grant execute on function public.owner_record_lead_activity(uuid, text, text, text, timestamptz, uuid) to service_role;

-- The lead's next_follow_up_at / follow_up_note are a cache of the earliest OPEN
-- follow-up. Recomputing from the table (rather than writing both places) means
-- the two can never disagree, whatever order the owner completes things in.
create or replace function public.owner_lead_refresh_follow_up(p_lead_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare f record;
begin
  select due_at, reason into f
  from public.owner_lead_follow_ups
  where lead_id = p_lead_id and status = 'open'
  order by due_at asc limit 1;

  update public.owner_leads
  set next_follow_up_at = f.due_at, follow_up_note = f.reason
  where id = p_lead_id;
end;
$$;
revoke execute on function public.owner_lead_refresh_follow_up(uuid) from public, anon, authenticated;
grant execute on function public.owner_lead_refresh_follow_up(uuid) to service_role;

/** Display name, in the order a human would recognise the prospect. */
create or replace function public.owner_lead_display_name(p_lead public.owner_leads)
returns text language sql immutable set search_path = pg_catalog, pg_temp as $$
  select coalesce(
    nullif(btrim(p_lead.company), ''),
    nullif(btrim(p_lead.contact_name), ''),
    nullif(btrim(p_lead.email), ''),
    'Lead');
$$;

commit;

-- ---------------------------------------------------------------------------
-- 7. Duplicate detection (advisory).
--
--    Returns likely matches across leads AND canonical customers so the owner is
--    warned about "this is already a customer", not only "this is already a
--    lead". It never merges, never blocks and never decides: a shared company
--    name alone is reported as the weakest possible signal precisely because two
--    practices genuinely can be called "Praxis Dr. Müller".
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_find_lead_duplicates(
  p_entity_id uuid, p_payload jsonb, p_exclude_lead_id uuid default null
) returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  v_email text; v_phone text; v_company text; v_domain text; v_rows jsonb;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;

  v_email   := lower(nullif(btrim(p_payload->>'email'), ''));
  v_phone   := public.owner_normalize_phone(nullif(btrim(p_payload->>'phone'), ''));
  v_company := lower(nullif(btrim(p_payload->>'company'), ''));
  -- Host only, so https://praxis-mueller.de/kontakt and www.praxis-mueller.de match.
  v_domain  := lower(regexp_replace(regexp_replace(coalesce(nullif(btrim(p_payload->>'website'), ''), ''),
                 '^https?://', ''), '^www\.', ''));
  v_domain  := nullif(split_part(v_domain, '/', 1), '');

  if v_email is null and v_phone is null and v_company is null and v_domain is null then
    return jsonb_build_array();
  end if;

  select coalesce(jsonb_agg(to_jsonb(m) order by m.confidence desc, m.name), jsonb_build_array())
  into v_rows
  from (
    select
      'lead'::text as kind,
      l.id,
      public.owner_lead_display_name(l) as name,
      l.stage as state,
      l.city,
      case
        when v_email is not null and lower(btrim(l.email)) = v_email then 'email'
        when v_phone is not null and public.owner_normalize_phone(l.phone) = v_phone then 'phone'
        when v_domain is not null and lower(regexp_replace(regexp_replace(coalesce(l.website,''), '^https?://',''), '^www\.','')) like v_domain || '%' then 'website'
        else 'company'
      end as matched_on,
      case
        when v_email is not null and lower(btrim(l.email)) = v_email then 'strong'
        when v_phone is not null and public.owner_normalize_phone(l.phone) = v_phone then 'strong'
        when v_domain is not null and lower(regexp_replace(regexp_replace(coalesce(l.website,''), '^https?://',''), '^www\.','')) like v_domain || '%' then 'strong'
        else 'weak'
      end as confidence
    from public.owner_leads l
    where l.business_entity_id = p_entity_id
      and (p_exclude_lead_id is null or l.id <> p_exclude_lead_id)
      and (
        (v_email is not null and lower(btrim(l.email)) = v_email)
        or (v_phone is not null and public.owner_normalize_phone(l.phone) = v_phone)
        or (v_domain is not null and lower(regexp_replace(regexp_replace(coalesce(l.website,''), '^https?://',''), '^www\.','')) like v_domain || '%')
        or (v_company is not null and lower(btrim(l.company)) = v_company)
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
        else 'company'
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
      )
  ) m;

  return v_rows;
end;
$$;

commit;

-- ---------------------------------------------------------------------------
-- 8. Lead CRUD.
--
--    Creation asks for almost nothing — a company OR a contact OR an email — so
--    the owner can capture a prospect mid-conversation. Duplicate matches are
--    RETURNED, never acted on: the caller decides whether to keep going.
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

  v_result := jsonb_build_object(
    'lead_id', v_id,
    'duplicates', public.owner_find_lead_duplicates(v_entity, p_payload, v_id));
  update public.owner_finance_requests set result = v_result where idempotency_key = p_idempotency_key;
  return v_result;
end;
$$;

-- Patch semantics, like owner_update_customer: a key that is absent is left
-- alone, a key present with an empty value clears the column. Stage, outcome and
-- conversion columns are deliberately NOT settable here — each has its own RPC
-- so the activity trail cannot be bypassed.
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
    priority                = case when p_patch ? 'priority'                then p_patch->>'priority'                                    else priority end,
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

-- Archiving is reversible and never deletes. There is no hard-delete RPC for a
-- lead at all: sales history is the one thing this system exists to keep.
create or replace function public.owner_set_lead_archived(p_lead_id uuid, p_archived boolean)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
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
-- 9. Stage, outcome and reopening.
--
--    Changing a stage records an activity row and NOTHING ELSE. It sends no
--    e-mail, starts no sequence and touches no external system: outreach is
--    always an explicit, separate human act.
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
  if l.converted_customer_id is not null and p_stage <> 'won' then
    raise exception 'this lead is already converted into a customer and stays won';
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
-- 10. Follow-ups and manually logged contact.
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
-- call logged on Monday for a conversation on Friday reads correctly.
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
-- 11. The pre-offer integration & third-party-cost gate.
--
--     `status = complete` is refused until the four questions an offer actually
--     depends on have answers: which system, whether it has an interface, what
--     a third party charges, and — when it is not full automation — what the
--     honest fallback is. That refusal is the whole point of the table.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_upsert_lead_integration_check(p_lead_id uuid, p_patch jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare c record; v_status text;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  if not exists (select 1 from public.owner_leads where id = p_lead_id) then raise exception 'lead not found'; end if;

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
    status                      = case when p_patch ? 'status'                      then p_patch->>'status'                                  else status end,
    updated_by                  = auth.uid()
  where lead_id = p_lead_id
  returning * into c;

  if c.status not in ('not_started', 'in_progress', 'blocked', 'complete') then
    raise exception 'invalid assessment status %', c.status;
  end if;

  -- The gate. Refused as a database fact, so no screen can talk its way past it.
  if c.status = 'complete' then
    if coalesce(btrim(c.pvs_name), '') = '' and coalesce(btrim(c.appointment_system), '') = '' then
      raise exception 'record the PVS or the appointment system before completing the assessment';
    end if;
    if c.interface_type is null then
      raise exception 'record whether an interface exists before completing the assessment';
    end if;
    if not c.third_party_costs_confirmed then
      raise exception 'third-party costs must be confirmed before completing the assessment';
    end if;
    if c.integration_mode is null or c.integration_mode = 'unknown' then
      raise exception 'record whether this is full or partial automation before completing the assessment';
    end if;
    if c.integration_mode <> 'full_automation'
       and coalesce(btrim(c.fallback_description), '') = '' then
      raise exception 'a partial automation must describe its exact fallback';
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
-- 12. CRM tasks on a lead. Same table, same statuses, same activity discipline
--     as customer tasks — only the owning row differs.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_create_lead_task(p_idempotency_key uuid, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_existing jsonb; v_lead uuid; v_entity uuid; v_id uuid; v_sort int; v_result jsonb; v_status text;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  v_existing := public.owner_claim_idempotency(p_idempotency_key, 'owner_create_lead_task');
  if v_existing is not null then return v_existing; end if;

  v_lead := nullif(p_payload->>'lead_id', '')::uuid;
  select business_entity_id into v_entity from public.owner_leads where id = v_lead;
  if v_entity is null then raise exception 'lead not found'; end if;
  if length(trim(coalesce(p_payload->>'title', ''))) = 0 then raise exception 'a task title is required'; end if;
  v_status := coalesce(nullif(p_payload->>'status', ''), 'open');
  if v_status not in ('open','in_progress','completed','cancelled') then raise exception 'invalid task status %', v_status; end if;

  select coalesce(max(sort_order), -1) + 1 into v_sort from public.owner_customer_tasks where lead_id = v_lead;

  insert into public.owner_customer_tasks (business_entity_id, customer_id, lead_id, title, description,
    status, priority, due_date, sort_order, notes, completed_at, completed_by, created_by)
  values (v_entity, null, v_lead, btrim(p_payload->>'title'), nullif(btrim(p_payload->>'description'), ''),
    v_status, coalesce(nullif(p_payload->>'priority', ''), 'normal'),
    nullif(p_payload->>'due_date', '')::date, v_sort, nullif(btrim(p_payload->>'notes'), ''),
    case when v_status = 'completed' then now() else null end,
    case when v_status = 'completed' then auth.uid() else null end, auth.uid())
  returning id into v_id;

  perform public.owner_record_lead_activity(v_lead, 'task_created', 'Aufgabe erstellt: ' || btrim(p_payload->>'title'));

  v_result := jsonb_build_object('task_id', v_id);
  update public.owner_finance_requests set result = v_result where idempotency_key = p_idempotency_key;
  return v_result;
end;
$$;

create or replace function public.owner_set_lead_task_status(p_task_id uuid, p_status text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare t record;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  if p_status not in ('open','in_progress','completed','cancelled') then raise exception 'invalid task status %', p_status; end if;
  select * into t from public.owner_customer_tasks where id = p_task_id for update;
  if t.id is null then raise exception 'task not found'; end if;
  if t.lead_id is null then raise exception 'this is a customer task; use owner_set_customer_task_status'; end if;

  update public.owner_customer_tasks set
    status = p_status,
    completed_at = case when p_status = 'completed' then coalesce(completed_at, now()) else null end,
    completed_by = case when p_status = 'completed' then coalesce(completed_by, auth.uid()) else null end
  where id = p_task_id;

  perform public.owner_record_lead_activity(t.lead_id,
    case p_status when 'completed' then 'task_completed' when 'cancelled' then 'task_cancelled' else 'task_status_changed' end,
    case p_status
      when 'completed' then 'Aufgabe erledigt: ' || t.title
      when 'cancelled' then 'Aufgabe abgebrochen: ' || t.title
      else 'Aufgabenstatus geändert: ' || t.title end);
  return jsonb_build_object('task_id', p_task_id, 'status', p_status);
end;
$$;

create or replace function public.owner_delete_lead_task(p_task_id uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare t record;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  select * into t from public.owner_customer_tasks where id = p_task_id;
  if t.id is null then raise exception 'task not found'; end if;
  if t.lead_id is null then raise exception 'this is a customer task; use the customer task RPC'; end if;
  delete from public.owner_customer_tasks where id = p_task_id;
  perform public.owner_record_lead_activity(t.lead_id, 'task_deleted', 'Aufgabe gelöscht: ' || t.title);
  return jsonb_build_object('deleted', true);
end;
$$;

commit;

-- ---------------------------------------------------------------------------
-- 13. Lead → customer conversion.
--
--     The single most consequential write in the CRM, and therefore entirely
--     server-side. It is:
--
--       ATOMIC       one function, one transaction. Either the customer, the
--                    services, the link and the trail all exist, or none do.
--       IDEMPOTENT   twice over. The idempotency key replays the stored result,
--                    AND an already-converted lead returns its existing
--                    customer instead of making a second one — so a double
--                    click, a retry and a stale tab are all harmless.
--       NON-DESTRUCTIVE  the lead survives, keeps every field, every note,
--                    every activity row and every offer, and gains a link.
--
--     Matching an EXISTING customer is preferred over creating a duplicate:
--     an explicit customer_id first, then a normalised e-mail. Company name
--     alone never matches — the same rule owner_create_customer already uses.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_convert_lead_to_customer(p_idempotency_key uuid, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_existing jsonb; l record; v_lead uuid; v_customer uuid; v_matched boolean := false;
  v_norm text; v_service text; v_svc jsonb; v_services jsonb := jsonb_build_array();
  v_result jsonb; v_name text;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  v_existing := public.owner_claim_idempotency(p_idempotency_key, 'owner_convert_lead_to_customer');
  if v_existing is not null then return v_existing; end if;

  v_lead := nullif(p_payload->>'lead_id', '')::uuid;
  select * into l from public.owner_leads where id = v_lead for update;
  if l.id is null then raise exception 'lead not found'; end if;

  v_name := coalesce(nullif(btrim(l.company), ''), nullif(btrim(l.contact_name), ''), l.email);

  -- Already converted: return the same customer. Never a second one.
  if l.converted_customer_id is not null then
    v_customer := l.converted_customer_id;
    v_matched := true;
  else
    v_customer := nullif(p_payload->>'customer_id', '')::uuid;
    if v_customer is not null then
      if not exists (select 1 from public.owner_customers
                     where id = v_customer and business_entity_id = l.business_entity_id) then
        raise exception 'the selected customer does not belong to this business entity';
      end if;
      v_matched := true;
    end if;

    if v_customer is null then
      v_norm := lower(nullif(btrim(l.email), ''));
      if v_norm is not null then
        select id into v_customer from public.owner_customers
        where business_entity_id = l.business_entity_id and lower(btrim(email)) = v_norm
        limit 1;
        if v_customer is not null then v_matched := true; end if;
      end if;
    end if;

    if v_customer is null then
      insert into public.owner_customers (business_entity_id, company, contact_name, email, phone,
        street, postal_code, city, country_code, status, notes, created_by)
      values (l.business_entity_id, l.company, l.contact_name, l.email, l.phone,
        l.street, l.postal_code, l.city, l.country_code, 'active',
        -- Sales context travels with the customer; sales *scoring* does not.
        nullif(concat_ws(E'\n\n',
          nullif(btrim(coalesce(l.requirements, '')), ''),
          nullif(btrim(coalesce(l.notes, '')), '')), ''),
        auth.uid())
      returning id into v_customer;
      perform public.owner_record_customer_activity(v_customer, 'customer_created',
        'Kunde aus Lead erstellt: ' || v_name);
    end if;

    update public.owner_leads set
      stage = 'won',
      won_at = coalesce(won_at, now()),
      lost_at = null, lost_reason = null,
      converted_customer_id = v_customer,
      converted_at = now()
    where id = v_lead;

    -- Offers written for the prospect follow it to the customer. Linking is
    -- permitted on finalised offers (owner_guard_offer freezes commercial
    -- substance only), so an accepted offer keeps its number and its totals.
    update public.owner_offers
    set owner_customer_id = coalesce(owner_customer_id, v_customer)
    where owner_lead_id = v_lead;

    perform public.owner_record_lead_activity(v_lead, 'lead_converted',
      'In Kunde umgewandelt: ' || v_name);
    perform public.owner_record_customer_activity(v_customer, 'customer_from_lead',
      'Aus Lead übernommen: ' || v_name);
  end if;

  -- Services. owner_add_customer_service is itself idempotent per (customer,
  -- service) and instantiates the AI Receptionist onboarding template exactly
  -- once, so re-running conversion adds nothing and duplicates nothing.
  for v_service in
    select jsonb_array_elements_text(
      case when p_payload ? 'services' then p_payload->'services'
           else coalesce((select jsonb_agg(service_key) from public.owner_lead_service_interests where lead_id = v_lead), '[]'::jsonb)
      end)
  loop
    v_svc := public.owner_add_customer_service(gen_random_uuid(), v_customer, v_service);
    v_services := v_services || jsonb_build_array(jsonb_build_object(
      'service_key', v_service,
      'service_id', v_svc->>'service_id',
      'engagement_id', v_svc->>'engagement_id',
      'created', coalesce((v_svc->>'created')::boolean, false)));
  end loop;

  v_result := jsonb_build_object(
    'lead_id', v_lead, 'customer_id', v_customer,
    'matched_existing', v_matched, 'services', v_services);
  update public.owner_finance_requests set result = v_result where idempotency_key = p_idempotency_key;
  return v_result;
end;
$$;

commit;

-- ---------------------------------------------------------------------------
-- 13b. Offer ↔ lead linking.
--
--      Mirrors owner_link_offer_customer exactly: the offer stays in the canonical
--      finance system and this only records WHO it was written for. Permitted on a
--      finalised offer because owner_lead_id is not one of the commercial columns
--      owner_guard_offer freezes — the totals, the number and the text stay immutable.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_link_offer_lead(p_offer_id uuid, p_lead_id uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare o record; l record;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  select * into o from public.owner_offers where id = p_offer_id;
  if o.id is null then raise exception 'offer not found'; end if;

  if p_lead_id is null then
    update public.owner_offers set owner_lead_id = null where id = p_offer_id;
    return jsonb_build_object('offer_id', p_offer_id, 'lead_id', null);
  end if;

  select * into l from public.owner_leads where id = p_lead_id;
  if l.id is null then raise exception 'lead not found'; end if;
  if l.business_entity_id <> o.business_entity_id then
    raise exception 'the offer and the lead belong to different business entities';
  end if;

  update public.owner_offers set owner_lead_id = p_lead_id where id = p_offer_id;
  perform public.owner_record_lead_activity(p_lead_id, 'offer_linked',
    'Angebot verknüpft: ' || coalesce(o.offer_number, o.title, 'Entwurf'), null, null, p_offer_id);
  return jsonb_build_object('offer_id', p_offer_id, 'lead_id', p_lead_id);
end;
$$;

commit;

-- ---------------------------------------------------------------------------
-- 14. Reads. One list projection and one detail projection, both shaped exactly
--     as the pages consume them so no screen assembles a customer from parts.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_list_leads(p_entity_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v jsonb;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;

  select coalesce(jsonb_agg(to_jsonb(r) order by r.last_activity_at desc), jsonb_build_array())
  into v
  from (
    select
      l.id, l.company, l.contact_name, l.contact_role, l.email, l.phone, l.website,
      l.city, l.postal_code, l.stage, l.priority, l.source,
      l.estimated_setup_cents, l.estimated_monthly_cents, l.probability_percent,
      l.next_follow_up_at, l.follow_up_note, l.last_contact_at, l.last_activity_at,
      l.won_at, l.lost_at, l.lost_reason, l.converted_customer_id, l.converted_at,
      l.archived_at, l.created_at,
      public.owner_lead_display_name(l) as display_name,
      coalesce((select jsonb_agg(si.service_key order by si.service_key)
                from public.owner_lead_service_interests si where si.lead_id = l.id), '[]'::jsonb) as service_interests,
      coalesce((select count(*) from public.owner_customer_tasks t
                where t.lead_id = l.id and t.status in ('open', 'in_progress')), 0) as open_task_count,
      coalesce((select count(*) from public.owner_offers o where o.owner_lead_id = l.id and o.archived_at is null), 0) as offer_count,
      coalesce((select ic.status from public.owner_lead_integration_checks ic where ic.lead_id = l.id), 'not_started') as integration_status
    from public.owner_leads l
    where l.business_entity_id = p_entity_id
  ) r;
  return v;
end;
$$;

-- The reverse link, for the customer page: which prospect became this customer.
-- Deliberately a narrow projection — the customer workspace shows the PROVENANCE
-- of the relationship, not the sales record. Estimated value, probability and
-- internal sales notes stay on the lead page where they belong.
create or replace function public.owner_customer_origin_lead(p_customer_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v jsonb;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;

  select jsonb_build_object(
    'id', l.id,
    'display_name', public.owner_lead_display_name(l),
    'stage', l.stage,
    'source', l.source,
    'created_at', l.created_at,
    'converted_at', l.converted_at,
    'activity_count', (select count(*) from public.owner_lead_activity a where a.lead_id = l.id),
    'integration_status', coalesce(
      (select ic.status from public.owner_lead_integration_checks ic where ic.lead_id = l.id), 'not_started')
  ) into v
  from public.owner_leads l
  where l.converted_customer_id = p_customer_id
  order by l.converted_at asc
  limit 1;

  return v;
end;
$$;

create or replace function public.owner_lead_detail(p_lead_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare l record; v jsonb;
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
    'tasks', coalesce((select jsonb_agg(to_jsonb(t) order by t.sort_order)
       from public.owner_customer_tasks t where t.lead_id = l.id), '[]'::jsonb),
    'activity', coalesce((select jsonb_agg(to_jsonb(a) order by a.occurred_at desc, a.created_at desc)
       from public.owner_lead_activity a where a.lead_id = l.id), '[]'::jsonb),
    'integration_check', (select to_jsonb(ic) from public.owner_lead_integration_checks ic where ic.lead_id = l.id),
    'offers', coalesce((select jsonb_agg(jsonb_build_object(
         'id', o.id, 'offer_number', o.offer_number, 'title', o.title, 'status', o.status,
         'gross_total_cents', o.gross_total_cents, 'valid_until', o.valid_until,
         'created_at', o.created_at, 'archived_at', o.archived_at) order by o.created_at desc)
       from public.owner_offers o where o.owner_lead_id = l.id), '[]'::jsonb),
    'customer', (select jsonb_build_object('id', c.id, 'company', c.company,
         'contact_name', c.contact_name, 'status', c.status)
       from public.owner_customers c where c.id = l.converted_customer_id)
  ) into v;
  return v;
end;
$$;

commit;

-- ---------------------------------------------------------------------------
-- 15. The command center.
--
--     One query behind the owner's home screen. It answers "what needs me
--     today", and every number in it is DERIVED from a row that exists — there
--     is no scoring model, no prediction and no recommendation engine. If the
--     dashboard says a follow-up is two days overdue, a follow-up row is two
--     days overdue.
--
--     `p_today` is passed in by the caller so the boundary between "overdue"
--     and "today" is the OWNER'S day, not the server's UTC one.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_command_center(p_entity_id uuid, p_today date default null)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_today date; v_now timestamptz; v jsonb;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  v_today := coalesce(p_today, current_date);
  -- Everything due before tomorrow 00:00 in the owner's day is "today or earlier".
  v_now := (v_today + 1)::timestamptz;

  select jsonb_build_object(
    /* ---------------------------------------------------------- TODAY */
    'follow_ups', coalesce((
      select jsonb_agg(x order by x.due_at asc) from (
        select f.id as follow_up_id, f.lead_id, f.due_at, f.reason,
               public.owner_lead_display_name(l) as lead_name,
               l.stage, l.priority,
               case when f.due_at < v_today::timestamptz then 'overdue' else 'today' end as bucket
        from public.owner_lead_follow_ups f
        join public.owner_leads l on l.id = f.lead_id
        where f.status = 'open' and l.business_entity_id = p_entity_id
          and l.archived_at is null and l.converted_customer_id is null
          and f.due_at < v_now
        limit 50
      ) x), '[]'::jsonb),

    'upcoming_follow_up_count', (
      select count(*) from public.owner_lead_follow_ups f
      join public.owner_leads l on l.id = f.lead_id
      where f.status = 'open' and l.business_entity_id = p_entity_id
        and l.archived_at is null and f.due_at >= v_now),

    -- Active prospects nobody has scheduled anything for. The quietest way to
    -- lose a deal, so it gets its own queue rather than a footnote.
    'leads_without_follow_up', coalesce((
      select jsonb_agg(x order by x.last_activity_at asc) from (
        select l.id as lead_id, public.owner_lead_display_name(l) as lead_name,
               l.stage, l.priority, l.last_activity_at
        from public.owner_leads l
        where l.business_entity_id = p_entity_id and l.archived_at is null
          and l.stage not in ('won', 'lost') and l.next_follow_up_at is null
        limit 25
      ) x), '[]'::jsonb),

    'overdue_tasks', coalesce((
      select jsonb_agg(x order by x.due_date asc) from (
        select t.id as task_id, t.title, t.due_date, t.priority,
               t.lead_id, t.customer_id,
               case when t.lead_id is not null then public.owner_lead_display_name(l)
                    else coalesce(nullif(btrim(c.company), ''), nullif(btrim(c.contact_name), ''), 'Ohne Zuordnung') end as subject_name,
               case when t.lead_id is not null then 'lead' else 'customer' end as subject_kind
        from public.owner_customer_tasks t
        left join public.owner_leads l on l.id = t.lead_id
        left join public.owner_customers c on c.id = t.customer_id
        where t.business_entity_id = p_entity_id
          and t.status in ('open', 'in_progress')
          and t.due_date is not null and t.due_date <= v_today
        limit 50
      ) x), '[]'::jsonb),

    /* ------------------------------------------------- DELIVERY: waiting */
    -- What we are waiting on the CLIENT for, across every engagement. This is
    -- the queue the owner chases; it is not shown to the client.
    'waiting_for_client', coalesce((
      select jsonb_agg(x order by x.updated_at asc) from (
        select et.id as task_id, et.title, et.client_request, et.updated_at,
               e.id as engagement_id, e.service_key, e.customer_id,
               coalesce(nullif(btrim(c.company), ''), nullif(btrim(c.contact_name), ''), 'Kunde') as customer_name
        from public.owner_engagement_tasks et
        join public.owner_service_engagements e on e.id = et.engagement_id
        join public.owner_customers c on c.id = e.customer_id
        where e.business_entity_id = p_entity_id and et.status = 'waiting_for_client'
        limit 50
      ) x), '[]'::jsonb),

    'blockers', coalesce((
      select jsonb_agg(x order by x.updated_at asc) from (
        select et.id as task_id, et.title, et.blocker_reason, et.updated_at,
               et.readiness_category, e.id as engagement_id, e.service_key, e.customer_id,
               coalesce(nullif(btrim(c.company), ''), nullif(btrim(c.contact_name), ''), 'Kunde') as customer_name
        from public.owner_engagement_tasks et
        join public.owner_service_engagements e on e.id = et.engagement_id
        join public.owner_customers c on c.id = e.customer_id
        where e.business_entity_id = p_entity_id and et.status = 'blocked'
        limit 50
      ) x), '[]'::jsonb),

    /* ----------------------------------------------------------- SALES */
    'pipeline', coalesce((
      select jsonb_agg(jsonb_build_object(
               'stage', s.stage, 'count', s.n,
               'estimated_setup_cents', s.setup, 'estimated_monthly_cents', s.monthly))
      from (
        select l.stage, count(*) as n,
               coalesce(sum(l.estimated_setup_cents), 0) as setup,
               coalesce(sum(l.estimated_monthly_cents), 0) as monthly
        from public.owner_leads l
        where l.business_entity_id = p_entity_id and l.archived_at is null
        group by l.stage
      ) s), '[]'::jsonb),

    'open_offers', coalesce((
      select jsonb_agg(x order by x.created_at asc) from (
        select o.id as offer_id, o.offer_number, o.title, o.status,
               o.gross_total_cents, o.valid_until, o.created_at,
               o.owner_lead_id, o.owner_customer_id,
               case when o.owner_lead_id is not null then public.owner_lead_display_name(l)
                    else coalesce(nullif(btrim(c.company), ''), nullif(btrim(c.contact_name), ''),
                                  nullif(btrim(o.recipient_company), ''), 'Ohne Zuordnung') end as subject_name
        from public.owner_offers o
        left join public.owner_leads l on l.id = o.owner_lead_id
        left join public.owner_customers c on c.id = o.owner_customer_id
        where o.business_entity_id = p_entity_id and o.archived_at is null
          -- Everything that has left draft and has not yet been answered.
          and o.status in ('finalized', 'sent', 'viewed')
        limit 50
      ) x), '[]'::jsonb),

    /* -------------------------------------------------------- DELIVERY */
    'engagements', coalesce((
      select jsonb_agg(jsonb_build_object('lifecycle_status', s.lifecycle_status,
                                          'service_key', s.service_key, 'count', s.n))
      from (
        select e.lifecycle_status, e.service_key, count(*) as n
        from public.owner_service_engagements e
        join public.owner_customer_services cs on cs.id = e.customer_service_id
        where e.business_entity_id = p_entity_id and cs.state = 'active'
        group by e.lifecycle_status, e.service_key
      ) s), '[]'::jsonb),

    -- Freshly live engagements still inside their monitoring window.
    'monitoring', coalesce((
      select jsonb_agg(x order by x.went_live_at desc) from (
        select e.id as engagement_id, e.customer_id, e.service_key, e.went_live_at, e.monitoring_until,
               coalesce(nullif(btrim(c.company), ''), nullif(btrim(c.contact_name), ''), 'Kunde') as customer_name
        from public.owner_service_engagements e
        join public.owner_customers c on c.id = e.customer_id
        where e.business_entity_id = p_entity_id
          and e.lifecycle_status in ('live', 'monitoring')
          and (e.monitoring_until is null or e.monitoring_until >= v_today)
          and e.went_live_at is not null
        limit 25
      ) x), '[]'::jsonb),

    -- Prospects interested in the AI Receptionist whose pre-offer integration
    -- assessment is not finished. Sending an offer before this is answered is
    -- how a third-party licence fee becomes a surprise.
    'integration_gate_open', coalesce((
      select jsonb_agg(x order by x.last_activity_at asc) from (
        select l.id as lead_id, public.owner_lead_display_name(l) as lead_name,
               l.stage, l.last_activity_at,
               coalesce(ic.status, 'not_started') as integration_status
        from public.owner_leads l
        join public.owner_lead_service_interests si
          on si.lead_id = l.id and si.service_key = 'ai_receptionist'
        left join public.owner_lead_integration_checks ic on ic.lead_id = l.id
        where l.business_entity_id = p_entity_id and l.archived_at is null
          and l.stage not in ('new', 'contacted', 'won', 'lost')
          and coalesce(ic.status, 'not_started') <> 'complete'
        limit 25
      ) x), '[]'::jsonb)
  ) into v;

  return v;
end;
$$;

commit;

-- ---------------------------------------------------------------------------
-- 16. Grants. Owner-gated in the body AND revoked from anon/public here.
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
    'owner_create_lead_task(uuid, jsonb)',
    'owner_set_lead_task_status(uuid, text)',
    'owner_delete_lead_task(uuid)',
    'owner_convert_lead_to_customer(uuid, jsonb)',
    'owner_link_offer_lead(uuid, uuid)',
    'owner_list_leads(uuid)',
    'owner_lead_detail(uuid)',
    'owner_customer_origin_lead(uuid)',
    'owner_find_lead_duplicates(uuid, jsonb, uuid)',
    'owner_command_center(uuid, date)'
  ] loop
    execute format('revoke execute on function public.%s from public, anon', sig);
    execute format('grant execute on function public.%s to authenticated, service_role', sig);
  end loop;
end;
$$;

-- The two pure helpers are reached only from inside the SECURITY DEFINER bodies
-- above, which run as the definer. No caller ever needs to execute them.
revoke execute on function public.owner_normalize_phone(text) from public, anon, authenticated;
grant execute on function public.owner_normalize_phone(text) to service_role;
revoke execute on function public.owner_lead_display_name(public.owner_leads) from public, anon, authenticated;
grant execute on function public.owner_lead_display_name(public.owner_leads) to service_role;
commit;

-- ---------------------------------------------------------------------------
-- 17. A note on public.cogniiq_receptionist_leads.
--
--     That table is residue of a one-off sourcing experiment on 2026-07-30
--     (google_rating, review_count, fit_score, sourced_date give it away),
--     referenced by no application code. It is NOT the owner's pipeline and must
--     not be presented as one: the manual CRM is public.owner_leads above.
--
--     Its security is deliberately NOT this migration's business. Migration
--     20260902120000_receptionist_leads_pii_rls.sql owns that table's boundary
--     and does the job far more completely than a side note here could — it
--     revokes the identity sequence, withholds TRUNCATE, and proves the result
--     against a demonstrated exposure. Re-granting the same table from here
--     would silently narrow the access matrix that migration chose.
--
--     Whether the 50 rows are eventually deleted is an owner decision, not an
--     engineering one, and nothing in this migration touches them.
-- ---------------------------------------------------------------------------
