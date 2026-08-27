-- ===========================================================================
-- Offer engagement / sales intelligence (ADDITIVE, OBSERVATIONAL ONLY).
--
-- Gives the owner an internal view of how strongly a customer engages with a
-- published offer: active viewing time, visits, scroll depth, per-section
-- attention, PDF downloads and acceptance-funnel opens.
--
-- HARD BOUNDARIES — every one of these is asserted by
-- src/lib/ownerFinance/offerEngagementSafety.test.ts against THIS file:
--   * No function here writes to owner_automation_jobs.
--   * No function here calls owner_enqueue_automation_job,
--     owner_enqueue_offer_email, owner_process_offer_acceptance,
--     record_offer_acceptance, respond_offer_by_token or
--     owner_convert_offer_internal.
--   * No function here performs any HTTP / net / pg_net / edge-function call.
--   * No function here UPDATEs public.owner_offers (no status change, no
--     acceptance, no conversion, no pricing change) and no function here
--     writes owner_invoices, owner_offer_acceptance_events or
--     owner_finance_notifications.
--   * No function here increments owner_document_access_tokens.use_count.
--     That counter gates acceptance (max_uses); a 15s heartbeat incrementing
--     it would exhaust the token and BREAK the customer's ability to accept.
--   * Engagement never writes owner_document_access_events either, so the
--     existing access audit and the existing "viewed" semantics are byte-for-
--     byte unchanged.
--
-- PRIVACY: no raw token, no IP, no user agent, no email, no name, no
-- geolocation, no fingerprint, no cross-site identifier. A session is keyed by
-- a random client-generated UUID that is scoped to a single offer and carries
-- no meaning outside it. Metrics bind to the offer server-side via the token
-- hash lookup; the raw token is never stored.
-- ===========================================================================

begin;

-- ---------------------------------------------------------------------------
-- Canonical section identifiers. Kept in ONE place (this domain + the TS
-- mirror in src/lib/offerEngagement/sections.ts) so an anonymous caller can
-- never invent unbounded section keys and turn the table into free storage.
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'owner_offer_section_id') then
    create type public.owner_offer_section_id as enum (
      'hero',
      'introduction',
      'executive_summary',
      'project_approach',
      'desired_outcomes',
      'modules',
      'optional_modules',
      'investment',
      'timeline',
      'payment_schedule',
      'terms',
      'next_steps'
    );
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- One row per meaningful visit. active_seconds is SERVER-CLAMPED (see the
-- heartbeat RPC); it is never the raw client number.
-- ---------------------------------------------------------------------------
create table if not exists public.owner_offer_engagement_sessions (
  id uuid primary key default gen_random_uuid(),
  business_entity_id uuid not null references public.owner_business_entities(id) on delete cascade,
  offer_id uuid not null references public.owner_offers(id) on delete cascade,
  -- Which link was used. NOT the raw token — only the token row reference, the
  -- same indirection owner_document_access_events already uses.
  token_id uuid references public.owner_document_access_tokens(id) on delete set null,
  -- Random UUID minted by the browser for this visit. Scoped to (offer_id): the
  -- same id under a different offer is a different session, so it can never be
  -- used to correlate a person across offers, let alone across sites.
  client_session_id uuid not null,
  started_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  -- Server clock at the previous accepted heartbeat. This is the anti-inflation
  -- anchor: accepted time can never exceed elapsed SERVER time.
  last_heartbeat_at timestamptz not null default now(),
  -- Conservative accumulated foreground time. Hard-capped at 8h per session so
  -- no caller can inflate the dashboard, however many heartbeats they send.
  active_seconds int not null default 0 check (active_seconds >= 0 and active_seconds <= 28800),
  -- Basis points (0..10000) so 31.25% survives without a float.
  max_scroll_bp int not null default 0 check (max_scroll_bp >= 0 and max_scroll_bp <= 10000),
  pdf_download_count int not null default 0 check (pdf_download_count >= 0 and pdf_download_count <= 1000),
  acceptance_open_count int not null default 0 check (acceptance_open_count >= 0 and acceptance_open_count <= 1000),
  rejection_open_count int not null default 0 check (rejection_open_count >= 0 and rejection_open_count <= 1000),
  heartbeat_count int not null default 0 check (heartbeat_count >= 0),
  created_at timestamptz not null default now(),
  constraint owner_offer_engagement_sessions_unique unique (offer_id, client_session_id)
);
create index if not exists owner_offer_engagement_sessions_offer_idx
  on public.owner_offer_engagement_sessions (offer_id, started_at desc);
create index if not exists owner_offer_engagement_sessions_entity_idx
  on public.owner_offer_engagement_sessions (business_entity_id, last_activity_at desc);

-- ---------------------------------------------------------------------------
-- Per-section attention, aggregated per session. Bounded by the enum above and
-- by the unique key: a session can hold at most one row per known section.
-- ---------------------------------------------------------------------------
create table if not exists public.owner_offer_section_engagement (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.owner_offer_engagement_sessions(id) on delete cascade,
  offer_id uuid not null references public.owner_offers(id) on delete cascade,
  section_id public.owner_offer_section_id not null,
  active_seconds int not null default 0 check (active_seconds >= 0 and active_seconds <= 28800),
  updated_at timestamptz not null default now(),
  constraint owner_offer_section_engagement_unique unique (session_id, section_id)
);
create index if not exists owner_offer_section_engagement_offer_idx
  on public.owner_offer_section_engagement (offer_id, section_id);

-- ---------------------------------------------------------------------------
-- Meaningful, business-level events only. Heartbeats are deliberately NOT
-- events — they are technical state and would drown the owner's timeline.
-- ---------------------------------------------------------------------------
create table if not exists public.owner_offer_engagement_events (
  id uuid primary key default gen_random_uuid(),
  business_entity_id uuid not null references public.owner_business_entities(id) on delete cascade,
  offer_id uuid not null references public.owner_offers(id) on delete cascade,
  session_id uuid references public.owner_offer_engagement_sessions(id) on delete cascade,
  event_type text not null check (event_type in (
    'session_start', 'return_visit', 'scroll_complete',
    'pdf_download', 'acceptance_opened', 'acceptance_completed', 'rejection_opened'
  )),
  created_at timestamptz not null default now()
);
create index if not exists owner_offer_engagement_events_offer_idx
  on public.owner_offer_engagement_events (offer_id, created_at desc);

commit;

-- ---------------------------------------------------------------------------
-- RLS + grants. Mirrors the existing append-only evidence tables exactly:
-- owner may SELECT, nobody may write from a table grant, anon has nothing.
-- Anonymous callers reach these tables ONLY through the narrow SECURITY
-- DEFINER RPCs below, which resolve the offer from the token and can therefore
-- never touch a session belonging to another offer.
-- ---------------------------------------------------------------------------
begin;

do $$
declare t text;
begin
  foreach t in array array[
    'owner_offer_engagement_sessions',
    'owner_offer_section_engagement',
    'owner_offer_engagement_events'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_owner_select', t);
    execute format(
      'create policy %I on public.%I for select to authenticated using (public.is_platform_owner())',
      t || '_owner_select', t);
    execute format('revoke all on table public.%I from public, anon, authenticated', t);
    execute format('grant select on table public.%I to authenticated', t);
    execute format('grant select, insert, update on table public.%I to service_role', t);
  end loop;
end;
$$;

commit;

-- ---------------------------------------------------------------------------
-- PUBLIC engagement RPCs (anon). SECURITY DEFINER.
--
-- These deliberately do NOT call public_offer_by_token: that RPC records a
-- 'viewed' access event, advances the offer status and notifies the owner. A
-- heartbeat routed through it would produce a storm of spurious view events
-- and owner notifications. Engagement resolves the token itself, read-only.
-- ---------------------------------------------------------------------------
begin;

-- Internal: token -> (token row, offer row) for ENGAGEMENT ONLY.
-- Read-only with respect to every existing table. In particular it does NOT
-- increment use_count: that counter gates acceptance via max_uses, and a
-- heartbeat consuming it would lock the customer out of accepting.
create or replace function public.owner_engagement_context(p_token text)
returns table (token_id uuid, offer_id uuid, business_entity_id uuid)
language plpgsql security definer set search_path = public, pg_temp as $$
declare tok public.owner_document_access_tokens; o record;
begin
  tok := public.owner_verify_offer_token(p_token);
  select id, business_entity_id, status into o from public.owner_offers where id = tok.offer_id;
  if o.id is null then raise exception 'offer unavailable'; end if;
  if o.status = 'cancelled' then raise exception 'offer unavailable'; end if;
  token_id := tok.id; offer_id := o.id; business_entity_id := o.business_entity_id;
  return next;
end;
$$;
revoke execute on function public.owner_engagement_context(text) from public, anon, authenticated;

-- Start or resume a view session. Idempotent per (offer, client_session_id):
-- a page refresh resumes the same session rather than inventing a new visit.
create or replace function public.public_offer_engagement_start(
  p_token text, p_client_session_id uuid, p_returning boolean default false)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare ctx record; v_session uuid; v_existing record; v_visit_count int;
begin
  if p_client_session_id is null then raise exception 'invalid session'; end if;
  select * into ctx from public.owner_engagement_context(p_token);

  select id, started_at into v_existing
  from public.owner_offer_engagement_sessions
  where offer_id = ctx.offer_id and client_session_id = p_client_session_id;

  if v_existing.id is not null then
    -- Refresh / resume: touch activity, never a second visit.
    update public.owner_offer_engagement_sessions
      set last_activity_at = now(), last_heartbeat_at = now()
      where id = v_existing.id;
    return jsonb_build_object('ok', true, 'session_id', v_existing.id, 'resumed', true);
  end if;

  select count(*) into v_visit_count
  from public.owner_offer_engagement_sessions where offer_id = ctx.offer_id;

  insert into public.owner_offer_engagement_sessions
    (business_entity_id, offer_id, token_id, client_session_id)
  values (ctx.business_entity_id, ctx.offer_id, ctx.token_id, p_client_session_id)
  returning id into v_session;

  insert into public.owner_offer_engagement_events (business_entity_id, offer_id, session_id, event_type)
  values (ctx.business_entity_id, ctx.offer_id, v_session,
    case when v_visit_count > 0 or p_returning then 'return_visit' else 'session_start' end);

  return jsonb_build_object('ok', true, 'session_id', v_session, 'resumed', false);
end;
$$;

-- Heartbeat. THE anti-inflation boundary.
--
-- accepted_delta = greatest(0, least(
--     client-reported active delta,          -- the browser's own conservative number
--     elapsed SERVER seconds + 2s grace,     -- cannot outrun the server clock
--     30                                     -- one 15s beat plus one missed beat
-- ))
--
-- A caller submitting active_seconds = 500000 therefore contributes at most 30
-- seconds, and only if 30 seconds of real server time have actually elapsed.
create or replace function public.public_offer_engagement_heartbeat(
  p_token text,
  p_client_session_id uuid,
  p_active_delta_seconds int,
  p_scroll_bp int default null,
  p_sections jsonb default null)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  ctx record; s record;
  c_max_delta constant int := 30;         -- hard ceiling per heartbeat
  c_grace constant int := 2;              -- tolerance for scheduling jitter
  c_max_sections constant int := 24;      -- payload bound
  v_server_elapsed int;
  v_accepted int;
  v_scroll int;
  v_key text; v_val int; v_count int := 0;
begin
  if p_client_session_id is null then raise exception 'invalid session'; end if;
  select * into ctx from public.owner_engagement_context(p_token);

  -- The session is looked up BY OFFER. A session id from another offer simply
  -- does not resolve here, so one link can never write another offer's metrics.
  select * into s from public.owner_offer_engagement_sessions
  where offer_id = ctx.offer_id and client_session_id = p_client_session_id
  for update;
  if s.id is null then raise exception 'unknown session'; end if;

  v_server_elapsed := floor(extract(epoch from (now() - s.last_heartbeat_at)))::int;
  v_accepted := greatest(0, least(
    coalesce(p_active_delta_seconds, 0),
    v_server_elapsed + c_grace,
    c_max_delta
  ));

  -- Scroll depth only ever ratchets upward, and only within 0..10000 bp.
  v_scroll := greatest(s.max_scroll_bp, least(greatest(coalesce(p_scroll_bp, 0), 0), 10000));

  update public.owner_offer_engagement_sessions set
    active_seconds  = least(active_seconds + v_accepted, 28800),
    max_scroll_bp   = v_scroll,
    last_activity_at = now(),
    last_heartbeat_at = now(),
    heartbeat_count = heartbeat_count + 1
  where id = s.id;

  -- Reaching the bottom is a meaningful business event; record it exactly once.
  if v_scroll >= 9800 and s.max_scroll_bp < 9800 then
    insert into public.owner_offer_engagement_events (business_entity_id, offer_id, session_id, event_type)
    values (ctx.business_entity_id, ctx.offer_id, s.id, 'scroll_complete');
  end if;

  -- Per-section deltas. Unknown keys are IGNORED (not an error — a stale client
  -- must never lose its whole heartbeat over one renamed section). Each section
  -- delta is clamped to the accepted page delta, so sections can never sum to
  -- more attention than the page itself was granted.
  if p_sections is not null and jsonb_typeof(p_sections) = 'object' and v_accepted > 0 then
    for v_key, v_val in
      select key, greatest(0, least(coalesce((value#>>'{}')::int, 0), v_accepted))
      from jsonb_each(p_sections)
    loop
      exit when v_count >= c_max_sections;
      v_count := v_count + 1;
      if v_val > 0 and exists (
        select 1 from unnest(enum_range(null::public.owner_offer_section_id)) e
        where e::text = v_key
      ) then
        insert into public.owner_offer_section_engagement (session_id, offer_id, section_id, active_seconds)
        values (s.id, ctx.offer_id, v_key::public.owner_offer_section_id, v_val)
        on conflict (session_id, section_id) do update
          set active_seconds = least(public.owner_offer_section_engagement.active_seconds + excluded.active_seconds, 28800),
              updated_at = now();
      end if;
    end loop;
  end if;

  return jsonb_build_object('ok', true, 'accepted_seconds', v_accepted);
end;
$$;

-- Record ONE meaningful funnel event. Observational only: opening the
-- acceptance dialog records that it was opened and does nothing else — it does
-- not accept the offer, change its status, price it, invoice it, or send mail.
-- The authoritative acceptance path remains respond_offer_by_token /
-- process-accepted-offer, untouched by this migration.
create or replace function public.public_offer_engagement_event(
  p_token text, p_client_session_id uuid, p_event_type text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare ctx record; s record;
begin
  if p_event_type not in ('pdf_download', 'acceptance_opened', 'acceptance_completed', 'rejection_opened') then
    raise exception 'invalid event type';
  end if;
  if p_client_session_id is null then raise exception 'invalid session'; end if;
  select * into ctx from public.owner_engagement_context(p_token);

  select * into s from public.owner_offer_engagement_sessions
  where offer_id = ctx.offer_id and client_session_id = p_client_session_id
  for update;
  if s.id is null then raise exception 'unknown session'; end if;

  update public.owner_offer_engagement_sessions set
    pdf_download_count    = pdf_download_count    + (case when p_event_type = 'pdf_download'       then 1 else 0 end),
    acceptance_open_count = acceptance_open_count + (case when p_event_type = 'acceptance_opened'  then 1 else 0 end),
    rejection_open_count  = rejection_open_count  + (case when p_event_type = 'rejection_opened'   then 1 else 0 end),
    last_activity_at = now()
  where id = s.id
    -- Bound the counters so a scripted caller cannot grow them without limit.
    and pdf_download_count < 1000 and acceptance_open_count < 1000 and rejection_open_count < 1000;

  insert into public.owner_offer_engagement_events (business_entity_id, offer_id, session_id, event_type)
  values (ctx.business_entity_id, ctx.offer_id, s.id, p_event_type);

  return jsonb_build_object('ok', true);
end;
$$;

-- Anon may call exactly these three. Never the context helper.
revoke execute on function public.public_offer_engagement_start(text, uuid, boolean) from public;
revoke execute on function public.public_offer_engagement_heartbeat(text, uuid, int, int, jsonb) from public;
revoke execute on function public.public_offer_engagement_event(text, uuid, text) from public;
grant execute on function public.public_offer_engagement_start(text, uuid, boolean) to anon, authenticated, service_role;
grant execute on function public.public_offer_engagement_heartbeat(text, uuid, int, int, jsonb) to anon, authenticated, service_role;
grant execute on function public.public_offer_engagement_event(text, uuid, text) to anon, authenticated, service_role;

commit;

-- ---------------------------------------------------------------------------
-- OWNER read RPCs. Aggregation happens in the database; the dashboard never
-- reassembles metrics from raw rows.
--
-- Historical honesty: offers viewed BEFORE this feature existed have
-- owner_document_access_events but no measured duration. Those are reported
-- separately as historical_* and are NEVER folded into active time. The
-- dashboard must not infer (last event - first event) as viewing duration.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_offer_engagement_summary(p_offer_id uuid)
returns jsonb language plpgsql security definer stable set search_path = public, pg_temp as $$
declare v_agg record; v_hist record; v_sections jsonb; v_sessions jsonb; v_events jsonb;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;

  select
    count(*)::int                          as total_sessions,
    coalesce(sum(active_seconds), 0)::int  as total_active_seconds,
    coalesce(max(active_seconds), 0)::int  as longest_active_seconds,
    coalesce(max(max_scroll_bp), 0)::int   as max_scroll_bp,
    min(started_at)                        as first_session_at,
    max(last_activity_at)                  as last_activity_at,
    coalesce(sum(pdf_download_count), 0)::int    as pdf_download_count,
    coalesce(sum(acceptance_open_count), 0)::int as acceptance_open_count,
    coalesce(sum(rejection_open_count), 0)::int  as rejection_open_count
  into v_agg
  from public.owner_offer_engagement_sessions where offer_id = p_offer_id;

  -- Pre-feature opens. Count + first/last only — never a duration.
  select count(*)::int as c, min(created_at) as f, max(created_at) as l into v_hist
  from public.owner_document_access_events
  where offer_id = p_offer_id and event_type = 'viewed';

  select coalesce(jsonb_agg(x order by x.active_seconds desc), '[]'::jsonb) into v_sections from (
    select se.section_id::text as section_id,
           sum(se.active_seconds)::int as active_seconds,
           count(distinct se.session_id)::int as session_count
    from public.owner_offer_section_engagement se
    where se.offer_id = p_offer_id
    group by se.section_id
    having sum(se.active_seconds) > 0
  ) x;

  select coalesce(jsonb_agg(jsonb_build_object(
    'started_at', s.started_at,
    'last_activity_at', s.last_activity_at,
    'active_seconds', s.active_seconds,
    'max_scroll_bp', s.max_scroll_bp,
    'pdf_download_count', s.pdf_download_count,
    'acceptance_open_count', s.acceptance_open_count
  ) order by s.started_at desc), '[]'::jsonb) into v_sessions
  from (select * from public.owner_offer_engagement_sessions
        where offer_id = p_offer_id order by started_at desc limit 50) s;

  select coalesce(jsonb_agg(jsonb_build_object(
    'event_type', e.event_type, 'created_at', e.created_at
  ) order by e.created_at desc), '[]'::jsonb) into v_events
  from (select * from public.owner_offer_engagement_events
        where offer_id = p_offer_id order by created_at desc limit 100) e;

  return jsonb_build_object(
    'offer_id', p_offer_id,
    'total_sessions', coalesce(v_agg.total_sessions, 0),
    'total_active_seconds', coalesce(v_agg.total_active_seconds, 0),
    'longest_active_seconds', coalesce(v_agg.longest_active_seconds, 0),
    'max_scroll_bp', coalesce(v_agg.max_scroll_bp, 0),
    'first_session_at', v_agg.first_session_at,
    'last_activity_at', v_agg.last_activity_at,
    'pdf_download_count', coalesce(v_agg.pdf_download_count, 0),
    'acceptance_open_count', coalesce(v_agg.acceptance_open_count, 0),
    'rejection_open_count', coalesce(v_agg.rejection_open_count, 0),
    'historical_view_count', coalesce(v_hist.c, 0),
    'historical_first_viewed_at', v_hist.f,
    'historical_last_viewed_at', v_hist.l,
    'sections', v_sections,
    'sessions', v_sessions,
    'events', v_events
  );
end;
$$;

-- Compact per-offer rows for the offers list and for variant comparison across
-- offers of the SAME organization. organization_id comes from owner_offers —
-- a real relation, never a recipient string match.
create or replace function public.owner_offer_engagement_overview(p_entity uuid)
returns jsonb language plpgsql security definer stable set search_path = public, pg_temp as $$
declare v jsonb;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'offer_id', x.offer_id,
    'organization_id', x.organization_id,
    'total_sessions', x.total_sessions,
    'total_active_seconds', x.total_active_seconds,
    'longest_active_seconds', x.longest_active_seconds,
    'max_scroll_bp', x.max_scroll_bp,
    'first_session_at', x.first_session_at,
    'last_activity_at', x.last_activity_at,
    'pdf_download_count', x.pdf_download_count,
    'acceptance_open_count', x.acceptance_open_count
  )), '[]'::jsonb) into v
  from (
    select
      o.id as offer_id,
      o.organization_id,
      count(s.id)::int                          as total_sessions,
      coalesce(sum(s.active_seconds), 0)::int   as total_active_seconds,
      coalesce(max(s.active_seconds), 0)::int   as longest_active_seconds,
      coalesce(max(s.max_scroll_bp), 0)::int    as max_scroll_bp,
      min(s.started_at)                         as first_session_at,
      max(s.last_activity_at)                   as last_activity_at,
      coalesce(sum(s.pdf_download_count), 0)::int    as pdf_download_count,
      coalesce(sum(s.acceptance_open_count), 0)::int as acceptance_open_count
    from public.owner_offers o
    join public.owner_offer_engagement_sessions s on s.offer_id = o.id
    where o.business_entity_id = p_entity
    group by o.id, o.organization_id
  ) x;

  return v;
end;
$$;

revoke execute on function public.owner_offer_engagement_summary(uuid) from public, anon;
revoke execute on function public.owner_offer_engagement_overview(uuid) from public, anon;
grant execute on function public.owner_offer_engagement_summary(uuid) to authenticated, service_role;
grant execute on function public.owner_offer_engagement_overview(uuid) to authenticated, service_role;

commit;
