-- =============================================================================
-- Client provisioning identity resolution — forward-only duplicate-organization fix
-- =============================================================================
-- ROOT CAUSE (the one that produced the two Pankofer organizations)
-- ----------------------------------------------------------------
-- provision_client_workspace() is idempotent on ONE thing: a caller-supplied
-- `p_idempotency_key`. Everything downstream keys off the organization it creates,
-- and organization_solutions is unique only on a randomly-suffixed `instance_key`.
-- So nothing in the entire path is keyed on the CUSTOMER'S IDENTITY. Provisioning
-- the same company a second time — from a reloaded wizard that minted a fresh
-- idempotency key, with a different invitation address — created a complete parallel
-- organization tree, and both trees then accumulated real work:
--
--   61ced4ee-… "Pankofer"  invite v.graus@pankofer.de (never accepted) -> 5 offers + 1 invoice
--   2b2d106d-… "Pankofer"  invite cogniiq4@gmail.com  (ACCEPTED)      -> portal, project, docs
--
-- 20260730130000 reconciled that specific damage. This migration removes the cause,
-- so it cannot recur.
--
-- THE RULE
-- --------
-- Identity is resolved BEFORE an organization is created, and there are exactly
-- three outcomes:
--
--   1. STRONG match — the normalized company name matches AND at least one
--      independent identity signal corroborates it (an exact contact address, a
--      CORPORATE email domain, or the website host). Converge silently on the
--      existing organization and reuse every part of its tree.
--
--   2. NAME-ONLY match — the normalized company name matches and NOTHING
--      corroborates it. STOP. Raise `organization_identity_conflict` with the
--      candidate list, and require the owner to choose explicitly: reuse that
--      organization, or deliberately create a separate one. Two unrelated companies
--      genuinely can be called "Müller GmbH", so a name alone must never merge them
--      — and must never silently fork them either.
--
--   3. No match — create a new organization, exactly as before.
--
-- WHY FREE-MAIL DOMAINS ARE NOT A SIGNAL
-- --------------------------------------
-- cogniiq4@gmail.com and v.graus@pankofer.de share nothing, but two unrelated
-- customers both using gmail.com share a domain. Treating gmail.com as
-- corroboration would silently merge unrelated companies with a common name — the
-- exact failure mode this migration exists to prevent. Free-mail domains therefore
-- corroborate nothing; only an EXACT address match does.
--
-- Applied to the real Pankofer sequence this yields outcome 2, not outcome 1 and
-- not outcome 3: the second request stops and asks. No duplicate is created and no
-- merge happens behind the owner's back.
--
-- FORWARD-ONLY. No applied migration is modified and no data is reconciled here.
-- provision_client_workspace() keeps its exact signature, return type and grants;
-- its body is replaced so that even a stale caller can no longer create a duplicate.
-- The new work lives in provision_client_workspace_with_identity(), which the old
-- signature delegates to with no decision supplied.
-- =============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. Identity normalization helpers. IMMUTABLE so they can back functional
--    indexes; `set search_path = ''` so they are safe as index expressions.
-- ---------------------------------------------------------------------------

-- Company-name normalization: case, diacritics, punctuation and legal form are all
-- noise for identity. "Pankofer GmbH & Co. KG", "pankofer gmbh" and "PANKOFER"
-- all collapse to 'pankofer'. Deliberately NOT fuzzy: this is an equality key, and
-- a near-miss must fall through to "no match" (create) rather than to a merge.
create or replace function public.normalize_client_identity_name(p_name text)
returns text
language sql
immutable
set search_path = ''
as $$
  with base as (
    -- German umlauts EXPAND (ä -> ae), because "Müller" and "Mueller" are the same
    -- company typed two ways and must produce the same key. translate() cannot do
    -- this — it is a 1:1 character map — so the expansions come first and translate
    -- then folds the remaining single-character accents.
    select translate(
             replace(replace(replace(replace(
               lower(coalesce(p_name, '')),
               'ä', 'ae'), 'ö', 'oe'), 'ü', 'ue'), 'ß', 'ss'),
             'àáâãåèéêëìíîïòóôõùúûýñç',
             'aaaaaeeeeiiiioooouuuync'
           ) as s
  ),
  tokens as (
    select regexp_split_to_table(
             trim(regexp_replace(s, '[^a-z0-9]+', ' ', 'g')), '\s+') as t
    from base
  )
  select coalesce(string_agg(t, '' order by ord), '')
  from (
    select t, row_number() over () as ord
    from tokens
    where t <> ''
      -- Legal forms and connectives only. Nothing descriptive is stripped:
      -- removing e.g. "holding" or "gruppe" would merge genuinely different
      -- entities within one corporate family.
      and t not in (
        'gmbh', 'ggmbh', 'mbh', 'ag', 'ug', 'kg', 'kgaa', 'ohg', 'gbr', 'ek',
        'se', 'ev', 'eg', 'gmbhcokg', 'co', 'cie', 'und', 'and',
        'ltd', 'limited', 'plc', 'inc', 'incorporated', 'llc', 'lp', 'llp',
        'bv', 'nv', 'sa', 'sas', 'sarl', 'srl', 'spa', 'ab', 'as', 'oy', 'aps'
      )
  ) kept;
$$;

comment on function public.normalize_client_identity_name(text) is
  'Identity key for a company name: diacritics folded, punctuation dropped, legal form removed. Equality only — never fuzzy. Used to DETECT a possible duplicate, never on its own to merge one.';

-- Free-mail domains carry no organizational identity. Returns the lowercase domain
-- of a corporate address, or NULL for a free-mail / malformed address.
create or replace function public.client_identity_email_domain(p_email text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when d is null or d = '' then null
    when d in (
      'gmail.com', 'googlemail.com', 'gmx.de', 'gmx.net', 'gmx.at', 'gmx.ch',
      'web.de', 't-online.de', 'freenet.de', 'posteo.de', 'mailbox.org',
      'outlook.com', 'outlook.de', 'hotmail.com', 'hotmail.de', 'live.com', 'live.de',
      'msn.com', 'yahoo.com', 'yahoo.de', 'ymail.com', 'aol.com',
      'icloud.com', 'me.com', 'mac.com', 'protonmail.com', 'proton.me', 'pm.me',
      'mail.com', 'zoho.com', 'yandex.com', 'tutanota.com', 'fastmail.com',
      'example.com', 'example.org', 'example.test', 'test.com'
    ) then null
    else d
  end
  from (
    select lower(trim(split_part(coalesce(p_email, ''), '@', 2))) as d
  ) s;
$$;

comment on function public.client_identity_email_domain(text) is
  'Corporate email domain, or NULL for free-mail providers. A shared free-mail domain must never corroborate a company-name match.';

-- Website host, comparable across the ways an owner might type it.
create or replace function public.client_identity_website_host(p_website text)
returns text
language sql
immutable
set search_path = ''
as $$
  select nullif(
    regexp_replace(
      regexp_replace(
        regexp_replace(lower(trim(coalesce(p_website, ''))), '^[a-z]+://', ''),
        '^www\.', ''),
      '[/?#].*$', ''),
    '');
$$;

comment on function public.client_identity_website_host(text) is
  'Normalized website host (scheme, leading www. and path removed) for identity comparison.';

revoke all on function public.normalize_client_identity_name(text) from public, anon;
revoke all on function public.client_identity_email_domain(text) from public, anon;
revoke all on function public.client_identity_website_host(text) from public, anon;
grant execute on function public.normalize_client_identity_name(text) to authenticated, service_role;
grant execute on function public.client_identity_email_domain(text) to authenticated, service_role;
grant execute on function public.client_identity_website_host(text) to authenticated, service_role;

-- Lookup support. Not unique: two organizations with the same normalized name are a
-- LEGITIMATE end state once an owner has explicitly chosen to keep them separate, so
-- uniqueness here would forbid a decision the owner is allowed to make.
create index client_accounts_identity_name_idx
  on public.client_accounts (public.normalize_client_identity_name(display_name));
create index client_accounts_identity_legal_name_idx
  on public.client_accounts (public.normalize_client_identity_name(legal_name));
create index organizations_identity_name_idx
  on public.organizations (public.normalize_client_identity_name(name));

-- ---------------------------------------------------------------------------
-- 2. Candidate discovery.
--
-- SECURITY DEFINER + is_platform_admin(): an owner deciding between "reuse" and
-- "create separate" must see every matching organization, including ones they are
-- not a member of. Admin-only, and it returns nothing but what the decision needs.
-- ---------------------------------------------------------------------------
create or replace function public.find_client_organization_candidates(
  p_display_name text,
  p_legal_name text default null,
  p_primary_email text default null,
  p_invitation_email text default null,
  p_website text default null
)
returns table (
  organization_id uuid,
  organization_name text,
  organization_status text,
  client_account_id uuid,
  match_strength text,
  matched_on text[],
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_norm_display text := public.normalize_client_identity_name(p_display_name);
  v_norm_legal text := public.normalize_client_identity_name(p_legal_name);
  v_primary text := nullif(lower(trim(coalesce(p_primary_email, ''))), '');
  v_invite text := nullif(lower(trim(coalesce(p_invitation_email, ''))), '');
  v_host text := public.client_identity_website_host(p_website);
  v_domains text[];
begin
  if not public.is_platform_admin() then
    raise exception using errcode = '42501', message = 'not authorized';
  end if;

  if coalesce(v_norm_display, '') = '' and coalesce(v_norm_legal, '') = '' then
    return;
  end if;

  v_domains := array_remove(array[
    public.client_identity_email_domain(v_primary),
    public.client_identity_email_domain(v_invite)
  ], null);

  return query
  with candidate as (
    select o.id, o.name, o.status::text as status, o.created_at, ca.id as account_id,
           ca.primary_email, ca.website
    from public.organizations o
    left join public.client_accounts ca on ca.organization_id = o.id
    where (nullif(v_norm_display, '') is not null and (
             public.normalize_client_identity_name(o.name) = v_norm_display
             or public.normalize_client_identity_name(ca.display_name) = v_norm_display
             or public.normalize_client_identity_name(ca.legal_name) = v_norm_display))
       or (nullif(v_norm_legal, '') is not null and (
             public.normalize_client_identity_name(o.name) = v_norm_legal
             or public.normalize_client_identity_name(ca.display_name) = v_norm_legal
             or public.normalize_client_identity_name(ca.legal_name) = v_norm_legal))
  ),
  -- Every address already on record for the candidate organization: the CRM
  -- account, its contacts, and its invitations.
  known_email as (
    select c.id as org_id, lower(e.email) as email
    from candidate c
    cross join lateral (
      select c.primary_email as email
      union all select cc.email from public.client_contacts cc where cc.organization_id = c.id
      union all select ci.email from public.client_invitations ci where ci.organization_id = c.id
    ) e(email)
    where e.email is not null and trim(e.email) <> ''
  ),
  signal as (
    select c.id as org_id,
           -- An EXACT address match is a strong signal regardless of provider: the
           -- same human being is on both records.
           exists (select 1 from known_email k where k.org_id = c.id
                     and k.email in (coalesce(v_primary, '\x00'), coalesce(v_invite, '\x00'))) as email_exact,
           -- A shared CORPORATE domain is a strong signal. Free-mail domains were
           -- already removed from v_domains, so they cannot reach here.
           (cardinality(v_domains) > 0 and exists (
              select 1 from known_email k where k.org_id = c.id
                and public.client_identity_email_domain(k.email) = any (v_domains))) as email_domain,
           (cardinality(v_domains) > 0
              and public.client_identity_website_host(c.website) = any (v_domains)) as website_domain,
           (v_host is not null
              and public.client_identity_website_host(c.website) = v_host) as website_exact
    from candidate c
  )
  select c.id, c.name, c.status, c.account_id,
         case when s.email_exact or s.email_domain or s.website_domain or s.website_exact
              then 'strong' else 'name_only' end,
         array_remove(array[
           'normalized_name',
           case when s.email_exact then 'contact_email' end,
           case when s.email_domain then 'corporate_email_domain' end,
           case when s.website_exact then 'website_host' end,
           case when s.website_domain then 'website_matches_email_domain' end
         ], null),
         c.created_at
  from candidate c
  join signal s on s.org_id = c.id
  order by
    case when s.email_exact or s.email_domain or s.website_domain or s.website_exact then 0 else 1 end,
    c.created_at asc;
end;
$$;

comment on function public.find_client_organization_candidates(text, text, text, text, text) is
  'Organizations that may already be this customer. strong = normalized name plus an independent corroborating signal (exact contact address, corporate email domain, or website host); name_only = name alone, which requires an explicit owner decision. Admin-only.';

revoke all on function public.find_client_organization_candidates(text, text, text, text, text) from public, anon;
grant execute on function public.find_client_organization_candidates(text, text, text, text, text) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3. Provisioning with identity resolution.
--
-- Same behaviour as before for a genuinely new customer. For a returning one, every
-- step below is a reuse-or-create, so a second request adds NOTHING: no second
-- client_account (structurally impossible — UNIQUE(organization_id) — so the
-- existing row is reused and only its NULL fields are backfilled), no second
-- engagement for the same catalog_key + project, no second solution instance for the
-- same catalog_key + display name, no second portal settings row, no second
-- invitation for the same address, and no membership touched at all.
-- ---------------------------------------------------------------------------
create or replace function public.provision_client_workspace_with_identity(
  p_idempotency_key uuid,
  p_display_name text,
  p_legal_name text,
  p_primary_contact_name text,
  p_primary_email text,
  p_phone text,
  p_website text,
  p_industry text,
  p_address text,
  p_lead_source text,
  p_lifecycle_status text,
  p_internal_notes text,
  p_internal_owner text,
  p_currency text,
  p_estimated_total_budget_cents bigint,
  p_estimated_monthly_value_cents bigint,
  p_catalog_key text,
  p_project_name text,
  p_engagement_status text,
  p_total_budget_cents bigint,
  p_setup_fee_cents bigint,
  p_recurring_fee_cents bigint,
  p_target_go_live_date date,
  p_solution_display_name text,
  p_invitation_email text,
  p_organization_role public.organization_role,
  p_identity_decision text default null,
  p_target_organization_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_currency text := upper(coalesce(nullif(trim(p_currency), ''), 'EUR'));
  v_lifecycle text := coalesce(nullif(trim(p_lifecycle_status), ''), 'lead');
  v_engagement_status text := coalesce(nullif(trim(p_engagement_status), ''), 'active');
  v_invite_email text := lower(trim(coalesce(p_invitation_email, '')));
  v_decision text := lower(nullif(trim(coalesce(p_identity_decision, '')), ''));
  v_impl_key text;
  v_slug text;
  v_instance_key text;
  v_existing_result jsonb;
  v_result jsonb;
  v_role public.organization_role := coalesce(p_organization_role, 'owner');
  v_org_id uuid;
  v_account_id uuid;
  v_contact_id uuid;
  v_engagement_id uuid;
  v_solution_id uuid;
  v_invitation_id uuid;
  v_norm_name text;
  v_reused boolean := false;
  v_identity_match text := 'new';
  v_strong_count int;
  v_strong_org uuid;
  v_weak_count int;
  v_candidates jsonb;
  v_has_primary_contact boolean;
  v_member_exists boolean := false;
  v_invitation_note text := null;
begin
  if not public.is_platform_admin() then
    raise exception 'Only Cogniiq platform admins may provision client workspaces';
  end if;

  if p_idempotency_key is null then
    raise exception 'an idempotency key is required';
  end if;

  -- Idempotency-key replay. Unchanged: a retry of a COMMITTED request returns the
  -- original ids and creates nothing. This is the first and cheapest of the three
  -- convergence layers; identity resolution below is what catches a retry that
  -- arrived with a NEW key.
  insert into public.client_provisioning_requests (idempotency_key, created_by)
  values (p_idempotency_key, auth.uid())
  on conflict (idempotency_key) do nothing;

  select cpr.result into v_existing_result
  from public.client_provisioning_requests cpr
  where cpr.idempotency_key = p_idempotency_key
  for update;

  if v_existing_result is not null then
    return v_existing_result;
  end if;

  -- ---- Validation (unchanged) ----
  if length(trim(coalesce(p_display_name, ''))) = 0 then
    raise exception 'display_name is required';
  end if;
  if length(trim(coalesce(p_project_name, ''))) = 0 then
    raise exception 'project_name is required';
  end if;
  if length(trim(coalesce(p_solution_display_name, ''))) = 0 then
    raise exception 'solution_display_name is required';
  end if;
  if v_currency !~ '^[A-Z]{3}$' then
    raise exception 'currency must be a 3-letter ISO code';
  end if;
  if v_lifecycle not in ('lead', 'qualified', 'active', 'paused', 'churned', 'archived') then
    raise exception 'invalid lifecycle_status';
  end if;
  if v_engagement_status not in ('draft', 'active', 'paused', 'completed', 'cancelled') then
    raise exception 'invalid engagement status';
  end if;
  select sc.default_implementation_key into v_impl_key
  from public.solution_catalog sc
  where sc.key = p_catalog_key and sc.is_active;
  if v_impl_key is null then
    raise exception 'unknown or inactive catalog_key';
  end if;
  if v_impl_key not in ('ai_receptionist', 'automation_workspace', 'pankofer_operations', 'unavailable') then
    raise exception 'catalog default implementation is not an allowed implementation key';
  end if;
  if v_invite_email = '' or v_invite_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'a valid invitation email is required';
  end if;
  if coalesce(p_estimated_total_budget_cents, 0) < 0
    or coalesce(p_estimated_monthly_value_cents, 0) < 0
    or coalesce(p_total_budget_cents, 0) < 0
    or coalesce(p_setup_fee_cents, 0) < 0
    or coalesce(p_recurring_fee_cents, 0) < 0 then
    raise exception 'monetary amounts must be non-negative';
  end if;
  if v_decision is not null and v_decision not in ('reuse', 'create_separate') then
    raise exception using errcode = '22023', message = 'invalid_identity_decision',
      hint = 'identity_decision must be reuse or create_separate.';
  end if;

  -- ---- Identity resolution ----
  -- The advisory lock is keyed on the normalized company name, so two concurrent
  -- requests for the SAME customer serialize here even though their idempotency keys
  -- differ. Whichever arrives second re-reads candidates under READ COMMITTED — a
  -- fresh snapshot per statement — and therefore sees the organization the first one
  -- committed, instead of racing past the check and creating a twin.
  v_norm_name := public.normalize_client_identity_name(p_display_name);
  if coalesce(v_norm_name, '') = '' then
    -- A name made entirely of legal-form tokens ("GmbH") normalizes to empty. Fall
    -- back to the raw trimmed name so the lock still serializes something meaningful.
    v_norm_name := lower(trim(p_display_name));
  end if;
  perform pg_advisory_xact_lock(hashtextextended('client_identity:' || v_norm_name, 0));

  select count(*) filter (where c.match_strength = 'strong'),
         count(*) filter (where c.match_strength = 'name_only'),
         -- No min()/max() aggregate exists for uuid, and picking the OLDEST strong
         -- candidate is the right tie-break anyway: the original organization wins.
         (array_agg(c.organization_id order by c.created_at)
            filter (where c.match_strength = 'strong'))[1],
         jsonb_agg(jsonb_build_object(
           'organization_id', c.organization_id,
           'organization_name', c.organization_name,
           'organization_status', c.organization_status,
           'match_strength', c.match_strength,
           'matched_on', c.matched_on,
           'created_at', c.created_at
         ) order by c.match_strength, c.created_at)
    into v_strong_count, v_weak_count, v_strong_org, v_candidates
  from public.find_client_organization_candidates(
         p_display_name, p_legal_name, p_primary_email, v_invite_email, p_website) c;

  if v_decision = 'reuse' then
    if p_target_organization_id is null then
      raise exception using errcode = '22023', message = 'reuse_requires_target_organization',
        hint = 'Bitte wählen Sie die bestehende Organisation aus, die weiterverwendet werden soll.';
    end if;
    -- The target must be one of the presented candidates. Reuse is a decision
    -- between the alternatives the owner was actually shown, not a free-form
    -- attach of any organization id someone can name.
    if not exists (
      select 1
      from jsonb_array_elements(coalesce(v_candidates, '[]'::jsonb)) e
      where (e->>'organization_id')::uuid = p_target_organization_id
    ) then
      raise exception using errcode = '22023', message = 'reuse_target_not_a_candidate',
        hint = 'Die gewählte Organisation gehört nicht zu den gefundenen Übereinstimmungen.';
    end if;
    v_org_id := p_target_organization_id;
    v_reused := true;
    v_identity_match := 'explicit_reuse';

  elsif v_decision = 'create_separate' then
    -- The owner has looked at the candidates and stated that this is a different
    -- company. Recorded as a deliberate choice, not an accident.
    v_identity_match := 'explicit_separate';

  elsif coalesce(v_strong_count, 0) > 1 then
    -- More than one organization corroborates. Converging on an arbitrary one would
    -- be a silent merge; this needs a human.
    raise exception using
      errcode = '23505',
      message = 'organization_identity_conflict',
      detail = coalesce(v_candidates, '[]'::jsonb)::text,
      hint = 'Mehrere bestehende Organisationen passen zu diesem Kunden. Bitte wählen Sie ausdrücklich eine aus oder legen Sie bewusst eine separate an.';

  elsif coalesce(v_strong_count, 0) = 1 then
    -- Strong, unambiguous match: converge.
    v_org_id := v_strong_org;
    v_reused := true;
    v_identity_match := 'strong';

  elsif coalesce(v_weak_count, 0) > 0 then
    -- Name alone. Never merge on this, and never silently fork on it either.
    raise exception using
      errcode = '23505',
      message = 'organization_identity_conflict',
      detail = coalesce(v_candidates, '[]'::jsonb)::text,
      hint = 'Es existiert bereits eine Organisation mit diesem Namen, aber kein weiteres übereinstimmendes Merkmal. Bitte wählen Sie ausdrücklich: bestehende Organisation weiterverwenden oder bewusst eine separate anlegen.';
  end if;

  -- ---- 1. Organization ----
  if v_org_id is null then
    insert into public.organizations (name, status, created_by)
    values (trim(p_display_name), 'pending', auth.uid())
    returning id into v_org_id;
  end if;
  -- On reuse the organization's status is left exactly as it is: an ACTIVE customer
  -- must never be pushed back to 'pending' by a re-provision, which would revoke
  -- live portal access.

  -- ---- 2. Client account (CRM) — one per organization, enforced by UNIQUE ----
  insert into public.client_accounts (
    organization_id, legal_name, display_name, primary_contact_name, primary_email,
    phone, website, industry, address, lifecycle_status, lead_source, internal_notes,
    estimated_total_budget_cents, estimated_monthly_value_cents, internal_owner, currency
  )
  values (
    v_org_id, nullif(trim(coalesce(p_legal_name, '')), ''), trim(p_display_name),
    nullif(trim(coalesce(p_primary_contact_name, '')), ''), nullif(trim(coalesce(p_primary_email, '')), ''),
    nullif(trim(coalesce(p_phone, '')), ''), nullif(trim(coalesce(p_website, '')), ''),
    nullif(trim(coalesce(p_industry, '')), ''), nullif(trim(coalesce(p_address, '')), ''),
    v_lifecycle, nullif(trim(coalesce(p_lead_source, '')), ''), nullif(trim(coalesce(p_internal_notes, '')), ''),
    p_estimated_total_budget_cents, p_estimated_monthly_value_cents,
    nullif(trim(coalesce(p_internal_owner, '')), ''), v_currency
  )
  on conflict (organization_id) do update
    -- NULL-ONLY backfill. Curated CRM data is never overwritten by a later
    -- provisioning form: a re-provision may ADD a legal name or a phone number that
    -- was missing, and may never replace one that an owner has since corrected.
    -- lifecycle_status and currency are deliberately absent — they are managed
    -- state, not provisioning inputs.
    set legal_name = coalesce(client_accounts.legal_name, excluded.legal_name),
        primary_contact_name = coalesce(client_accounts.primary_contact_name, excluded.primary_contact_name),
        primary_email = coalesce(client_accounts.primary_email, excluded.primary_email),
        phone = coalesce(client_accounts.phone, excluded.phone),
        website = coalesce(client_accounts.website, excluded.website),
        industry = coalesce(client_accounts.industry, excluded.industry),
        address = coalesce(client_accounts.address, excluded.address),
        lead_source = coalesce(client_accounts.lead_source, excluded.lead_source),
        internal_notes = coalesce(client_accounts.internal_notes, excluded.internal_notes),
        internal_owner = coalesce(client_accounts.internal_owner, excluded.internal_owner),
        estimated_total_budget_cents = coalesce(client_accounts.estimated_total_budget_cents, excluded.estimated_total_budget_cents),
        estimated_monthly_value_cents = coalesce(client_accounts.estimated_monthly_value_cents, excluded.estimated_monthly_value_cents)
  returning id into v_account_id;

  -- ---- 3. Primary contact — reused by address, never duplicated ----
  select cc.id into v_contact_id
  from public.client_contacts cc
  where cc.organization_id = v_org_id and lower(cc.email) = v_invite_email
  order by cc.is_primary desc, cc.created_at asc
  limit 1;

  if v_contact_id is null then
    select exists (
      select 1 from public.client_contacts cc
      where cc.organization_id = v_org_id and cc.is_primary
    ) into v_has_primary_contact;

    insert into public.client_contacts (organization_id, name, email, phone, is_primary, should_invite)
    values (
      v_org_id,
      coalesce(nullif(trim(coalesce(p_primary_contact_name, '')), ''), trim(p_display_name)),
      v_invite_email, nullif(trim(coalesce(p_phone, '')), ''),
      -- An existing primary contact keeps that role; a second "primary" would make
      -- the question "who is the primary contact?" unanswerable.
      not v_has_primary_contact, true
    )
    returning id into v_contact_id;
  end if;

  -- ---- 4. Engagement — one per (organization, catalog_key, project) ----
  select ce.id into v_engagement_id
  from public.client_engagements ce
  where ce.organization_id = v_org_id
    and ce.catalog_key = p_catalog_key
    and public.normalize_client_identity_name(ce.project_name)
        = public.normalize_client_identity_name(p_project_name)
  order by ce.created_at asc
  limit 1;

  if v_engagement_id is null then
    insert into public.client_engagements (
      organization_id, catalog_key, project_name, status, total_budget_cents,
      setup_fee_cents, recurring_fee_cents, currency, target_go_live_date, internal_owner
    )
    values (
      v_org_id, p_catalog_key, trim(p_project_name), v_engagement_status, p_total_budget_cents,
      p_setup_fee_cents, p_recurring_fee_cents, v_currency, p_target_go_live_date,
      nullif(trim(coalesce(p_internal_owner, '')), '')
    )
    returning id into v_engagement_id;
  end if;

  -- ---- 5. Solution instance — one per (organization, catalog_key, display name) ----
  -- Crucially, a reused solution KEEPS its instance_key: that key is the customer's
  -- portal URL, and minting a new one would break every link already shared.
  select os.id, os.instance_key into v_solution_id, v_instance_key
  from public.organization_solutions os
  where os.organization_id = v_org_id
    and os.catalog_key = p_catalog_key
    and public.normalize_client_identity_name(os.display_name)
        = public.normalize_client_identity_name(p_solution_display_name)
  order by os.created_at asc
  limit 1;

  if v_solution_id is null then
    v_slug := lower(trim(coalesce(p_solution_display_name, '')));
    v_slug := regexp_replace(v_slug, '[^a-z0-9]+', '-', 'g');
    v_slug := trim(both '-' from v_slug);
    if length(v_slug) < 3 then
      v_slug := 'loesung';
    end if;
    v_slug := substr(v_slug, 1, 40);

    loop
      v_instance_key := v_slug || '-' || replace(gen_random_uuid()::text, '-', '');
      exit when not exists (
        select 1 from public.organization_solutions os where os.instance_key = v_instance_key
      );
    end loop;

    insert into public.organization_solutions (
      organization_id, engagement_id, catalog_key, instance_key, display_name, implementation_key, status
    )
    values (
      v_org_id, v_engagement_id, p_catalog_key, v_instance_key, trim(p_solution_display_name),
      v_impl_key, 'active'
    )
    returning id into v_solution_id;
  end if;

  -- ---- 6. Portal settings — one row per organization (PK), never a second ----
  insert into public.organization_portal_settings (organization_id, portal_title, default_solution_id, support_contact)
  values (v_org_id, trim(p_display_name), v_solution_id, nullif(trim(coalesce(p_primary_email, '')), ''))
  on conflict (organization_id) do nothing;

  -- ---- 7. Invitation — reused, and skipped entirely for an existing member ----
  -- MEMBERSHIPS ARE NEVER TOUCHED HERE. If the invitee is already an active member,
  -- issuing another pending invitation would put a live "join this workspace" link
  -- in the world for someone who has already joined — which is exactly how the
  -- second Pankofer invitation came to be accepted.
  select exists (
    select 1
    from public.organization_members om
    join public.profiles pr on pr.id = om.user_id
    where om.organization_id = v_org_id
      and om.status = 'active'
      and lower(coalesce(pr.email, '')) = v_invite_email
  ) into v_member_exists;

  select ci.id into v_invitation_id
  from public.client_invitations ci
  where ci.organization_id = v_org_id
    and ci.email = v_invite_email
    and ci.status in ('pending', 'accepted')
  order by case ci.status when 'accepted' then 0 else 1 end, ci.created_at desc
  limit 1;

  if v_invitation_id is not null then
    v_invitation_note := 'existing_invitation_reused';
  elsif v_member_exists then
    v_invitation_note := 'skipped_existing_member';
  else
    insert into public.client_invitations (organization_id, email, organization_role, status, invited_by, expires_at)
    values (v_org_id, v_invite_email, v_role, 'pending', auth.uid(), now() + interval '14 days')
    returning id into v_invitation_id;
    v_invitation_note := 'invitation_created';
  end if;

  v_result := jsonb_build_object(
    'organization_id', v_org_id,
    'client_account_id', v_account_id,
    'client_contact_id', v_contact_id,
    'engagement_id', v_engagement_id,
    'organization_solution_id', v_solution_id,
    'instance_key', v_instance_key,
    'invitation_id', v_invitation_id,
    'invitation_email', v_invite_email,
    -- Additive fields. Every key the previous version returned is still present and
    -- unchanged, so an older caller keeps working.
    'reused_existing_organization', v_reused,
    'identity_match', v_identity_match,
    'invitation_outcome', v_invitation_note
  );

  update public.client_provisioning_requests
    set result = v_result, organization_id = v_org_id
  where idempotency_key = p_idempotency_key;

  return v_result;
end;
$$;

comment on function public.provision_client_workspace_with_identity(
  uuid, text, text, text, text, text, text, text, text, text, text, text, text, text,
  bigint, bigint, text, text, text, bigint, bigint, bigint, date, text, text,
  public.organization_role, text, uuid
) is
  'Admin provisioning with customer-identity resolution. A strong identity match converges on the existing organization and reuses its whole tree; a name-only match raises organization_identity_conflict with the candidate list and requires identity_decision=reuse|create_separate. Concurrency-safe via an advisory lock on the normalized name. Never creates a second client_account, engagement, solution, portal-settings row, invitation or membership on reuse.';

revoke all on function public.provision_client_workspace_with_identity(
  uuid, text, text, text, text, text, text, text, text, text, text, text, text, text,
  bigint, bigint, text, text, text, bigint, bigint, bigint, date, text, text,
  public.organization_role, text, uuid
) from public, anon;
grant execute on function public.provision_client_workspace_with_identity(
  uuid, text, text, text, text, text, text, text, text, text, text, text, text, text,
  bigint, bigint, text, text, text, bigint, bigint, bigint, date, text, text,
  public.organization_role, text, uuid
) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 4. The original signature now delegates.
--
-- Identical parameter list, name, order and return type, so PostgREST dispatch,
-- the existing grants and the staging preflight's signature assertions are all
-- unaffected. Its body no longer creates an organization unconditionally, so a
-- stale caller — an old browser tab, a queued retry, a script — can no longer
-- produce a duplicate. It supplies no decision, so a name-only collision raises
-- instead of guessing.
-- ---------------------------------------------------------------------------
create or replace function public.provision_client_workspace(
  p_idempotency_key uuid,
  p_display_name text,
  p_legal_name text,
  p_primary_contact_name text,
  p_primary_email text,
  p_phone text,
  p_website text,
  p_industry text,
  p_address text,
  p_lead_source text,
  p_lifecycle_status text,
  p_internal_notes text,
  p_internal_owner text,
  p_currency text,
  p_estimated_total_budget_cents bigint,
  p_estimated_monthly_value_cents bigint,
  p_catalog_key text,
  p_project_name text,
  p_engagement_status text,
  p_total_budget_cents bigint,
  p_setup_fee_cents bigint,
  p_recurring_fee_cents bigint,
  p_target_go_live_date date,
  p_solution_display_name text,
  p_invitation_email text,
  p_organization_role public.organization_role
)
returns jsonb
language sql
security definer
set search_path = public, auth, pg_temp
as $$
  select public.provision_client_workspace_with_identity(
    p_idempotency_key, p_display_name, p_legal_name, p_primary_contact_name, p_primary_email,
    p_phone, p_website, p_industry, p_address, p_lead_source, p_lifecycle_status,
    p_internal_notes, p_internal_owner, p_currency, p_estimated_total_budget_cents,
    p_estimated_monthly_value_cents, p_catalog_key, p_project_name, p_engagement_status,
    p_total_budget_cents, p_setup_fee_cents, p_recurring_fee_cents, p_target_go_live_date,
    p_solution_display_name, p_invitation_email, p_organization_role, null, null);
$$;

comment on function public.provision_client_workspace is
  'Atomic admin-only provisioning, now identity-resolving: delegates to provision_client_workspace_with_identity with no owner decision, so a strong match converges and a name-only collision raises organization_identity_conflict rather than creating a duplicate organization. Never sends email.';

revoke all on function public.provision_client_workspace(
  uuid, text, text, text, text, text, text, text, text, text, text, text, text, text,
  bigint, bigint, text, text, text, bigint, bigint, bigint, date, text, text, public.organization_role
) from public, anon;
grant execute on function public.provision_client_workspace(
  uuid, text, text, text, text, text, text, text, text, text, text, text, text, text,
  bigint, bigint, text, text, text, bigint, bigint, bigint, date, text, text, public.organization_role
) to authenticated, service_role;

commit;
