-- =============================================================================
-- Owner SIGNATURE PROPOSAL EXPERIENCE — premium customer journey, drawn digital
-- signature acceptance, and automated invoice creation / issuance / sending.
--
-- ADDITIVE migration. It does NOT modify any previously applied migration file. It
-- only:
--   * adds explicit recipient-personalization (greeting) fields to owner_offers,
--     which are frozen automatically into the finalized snapshot (finalize already
--     snapshots to_jsonb(offer_row), so the new columns travel with it — the
--     greeting can never drift from later CRM edits);
--   * adds drawn-signature evidence columns to the acceptance-event table;
--   * adds invoice-automation settings + a durable automation-job / email-outbox
--     table;
--   * re-creates (CREATE OR REPLACE) a small set of finalize/editor/public functions
--     to (a) persist the greeting fields and (b) serve the public portal from the
--     IMMUTABLE finalized snapshot instead of current mutable rows;
--   * adds a service-role acceptance-recording RPC (for the token-authenticated
--     Edge Function that stores the signature privately) and an internal,
--     server-authoritative acceptance-processing routine that idempotently creates
--     the invoice and queues the configured automation jobs.
--
-- All monetary math and state transitions remain server-authoritative. No secret,
-- raw token, signature bytes or storage path is ever returned to the public
-- projection. pgcrypto is referenced schema-qualified (extensions.*) exactly as the
-- 20260723124000 runtime hotfix established.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Recipient personalization (greeting) fields on the offer. Additive columns;
--    they flow into the finalized snapshot automatically via to_jsonb(offer_row).
--    Gender is NEVER inferred — 'herr'/'frau' are used only when explicitly chosen.
-- ---------------------------------------------------------------------------
begin;

alter table public.owner_offers
  add column if not exists recipient_salutation text
    check (recipient_salutation is null or recipient_salutation in ('herr','frau','neutral')),
  add column if not exists recipient_title text,
  add column if not exists recipient_first_name text,
  add column if not exists recipient_last_name text,
  add column if not exists recipient_greeting_name text;

commit;

-- ---------------------------------------------------------------------------
-- 2. Drawn-signature evidence on the acceptance-event table. Only the MINIMUM
--    evidence is stored: a private storage path (never a public URL), the SHA-256
--    of the PNG, the accepted gross amount + currency, an optional signer role,
--    and a privacy-safe IP hash. No behavioural biometrics (pressure/velocity/
--    timing) are ever stored.
-- ---------------------------------------------------------------------------
begin;

alter table public.owner_offer_acceptance_events
  add column if not exists signer_role text,
  add column if not exists signature_storage_path text,
  add column if not exists signature_sha256 text,
  add column if not exists accepted_gross_cents bigint,
  add column if not exists currency text,
  add column if not exists ip_hash text;

commit;

-- ---------------------------------------------------------------------------
-- 3. Invoice-automation settings on document settings. Safe defaults: create the
--    invoice draft automatically, but never auto-issue/auto-send until the owner
--    intentionally enables it.
-- ---------------------------------------------------------------------------
begin;

alter table public.owner_document_settings
  add column if not exists auto_create_invoice_on_acceptance boolean not null default true,
  add column if not exists auto_issue_invoice_on_acceptance boolean not null default false,
  add column if not exists auto_send_invoice_on_acceptance boolean not null default false,
  add column if not exists default_invoice_due_days int not null default 14
    check (default_invoice_due_days between 0 and 365),
  add column if not exists invoice_email_subject_template text,
  add column if not exists invoice_email_body_template text;

commit;

-- ---------------------------------------------------------------------------
-- 3b. upsert_owner_document_settings — re-created to ALSO persist the automation
--     settings. Body is the 20260723120000 version plus the six automation columns on
--     both INSERT and the ON CONFLICT update. Owner-only; unchanged security.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.upsert_owner_document_settings(p_entity uuid, p_settings jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_row public.owner_document_settings;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  if p_entity is null then raise exception 'business_entity_id is required'; end if;
  if not exists (select 1 from public.owner_business_entities where id = p_entity) then
    raise exception 'unknown business entity';
  end if;

  insert into public.owner_document_settings as s (
    business_entity_id, legal_name, owner_name, street, postal_code, city, country_code,
    business_email, business_phone, website, tax_number, vat_id,
    bank_account_holder, iban, bic, bank_name,
    default_payment_terms_days, default_offer_validity_days, default_invoice_footer, default_offer_footer,
    default_offer_intro, default_offer_closing, invoice_number_prefix, offer_number_prefix,
    document_language, logo_storage_path, brand_accent,
    auto_create_invoice_on_acceptance, auto_issue_invoice_on_acceptance, auto_send_invoice_on_acceptance,
    default_invoice_due_days, invoice_email_subject_template, invoice_email_body_template, created_by)
  values (
    p_entity, p_settings->>'legal_name', p_settings->>'owner_name', p_settings->>'street',
    p_settings->>'postal_code', p_settings->>'city', coalesce(p_settings->>'country_code', 'DE'),
    nullif(p_settings->>'business_email', ''), p_settings->>'business_phone', p_settings->>'website',
    p_settings->>'tax_number', p_settings->>'vat_id',
    p_settings->>'bank_account_holder', nullif(p_settings->>'iban', ''), nullif(p_settings->>'bic', ''), p_settings->>'bank_name',
    coalesce((p_settings->>'default_payment_terms_days')::int, 14),
    coalesce((p_settings->>'default_offer_validity_days')::int, 30),
    p_settings->>'default_invoice_footer', p_settings->>'default_offer_footer',
    p_settings->>'default_offer_intro', p_settings->>'default_offer_closing',
    coalesce(p_settings->>'invoice_number_prefix', 'RE'), coalesce(p_settings->>'offer_number_prefix', 'AN'),
    coalesce(p_settings->>'document_language', 'de'), p_settings->>'logo_storage_path',
    nullif(p_settings->>'brand_accent', ''),
    coalesce((p_settings->>'auto_create_invoice_on_acceptance')::boolean, true),
    coalesce((p_settings->>'auto_issue_invoice_on_acceptance')::boolean, false),
    coalesce((p_settings->>'auto_send_invoice_on_acceptance')::boolean, false),
    coalesce((p_settings->>'default_invoice_due_days')::int, 14),
    nullif(p_settings->>'invoice_email_subject_template',''), nullif(p_settings->>'invoice_email_body_template',''),
    auth.uid())
  on conflict (business_entity_id) do update set
    legal_name = excluded.legal_name, owner_name = excluded.owner_name, street = excluded.street,
    postal_code = excluded.postal_code, city = excluded.city, country_code = excluded.country_code,
    business_email = excluded.business_email, business_phone = excluded.business_phone, website = excluded.website,
    tax_number = excluded.tax_number, vat_id = excluded.vat_id,
    bank_account_holder = excluded.bank_account_holder, iban = excluded.iban, bic = excluded.bic, bank_name = excluded.bank_name,
    default_payment_terms_days = excluded.default_payment_terms_days,
    default_offer_validity_days = excluded.default_offer_validity_days,
    default_invoice_footer = excluded.default_invoice_footer, default_offer_footer = excluded.default_offer_footer,
    default_offer_intro = excluded.default_offer_intro, default_offer_closing = excluded.default_offer_closing,
    invoice_number_prefix = excluded.invoice_number_prefix, offer_number_prefix = excluded.offer_number_prefix,
    document_language = excluded.document_language, logo_storage_path = excluded.logo_storage_path,
    brand_accent = excluded.brand_accent,
    auto_create_invoice_on_acceptance = excluded.auto_create_invoice_on_acceptance,
    auto_issue_invoice_on_acceptance = excluded.auto_issue_invoice_on_acceptance,
    auto_send_invoice_on_acceptance = excluded.auto_send_invoice_on_acceptance,
    default_invoice_due_days = excluded.default_invoice_due_days,
    invoice_email_subject_template = excluded.invoice_email_subject_template,
    invoice_email_body_template = excluded.invoice_email_body_template
  returning s.* into v_row;

  return to_jsonb(v_row);
end;
$$;

revoke execute on function public.upsert_owner_document_settings(uuid, jsonb) from public, anon;
grant execute on function public.upsert_owner_document_settings(uuid, jsonb) to authenticated, service_role;

commit;

-- ---------------------------------------------------------------------------
-- 4. Durable automation-job / email-outbox table. One row per (offer, job_type)
--    is enforced by a unique dedupe key, so repeated acceptance never enqueues a
--    second invoice/email job. Bounded retries; owner-visible last error summary.
--    The raw customer token / signature bytes are NEVER stored here.
-- ---------------------------------------------------------------------------
begin;

create table if not exists public.owner_automation_jobs (
  id uuid primary key default gen_random_uuid(),
  business_entity_id uuid not null references public.owner_business_entities(id) on delete cascade,
  job_type text not null check (job_type in (
    'invoice_create','invoice_issue','invoice_send','invoice_email','offer_email')),
  status text not null default 'pending' check (status in (
    'pending','processing','sent','failed','retrying','cancelled')),
  offer_id uuid references public.owner_offers(id) on delete set null,
  invoice_id uuid references public.owner_invoices(id) on delete set null,
  acceptance_event_id uuid references public.owner_offer_acceptance_events(id) on delete set null,
  recipient_email text,
  subject text,
  dedupe_key text not null,
  attempt_count int not null default 0 check (attempt_count >= 0),
  max_attempts int not null default 5 check (max_attempts > 0),
  last_error text,
  provider_message_id text,
  payload jsonb not null default '{}'::jsonb,
  scheduled_at timestamptz not null default now(),
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint owner_automation_jobs_dedupe_unique unique (dedupe_key)
);
create index if not exists owner_automation_jobs_entity_idx on public.owner_automation_jobs (business_entity_id, created_at);
create index if not exists owner_automation_jobs_status_idx on public.owner_automation_jobs (status, scheduled_at);
create index if not exists owner_automation_jobs_offer_idx on public.owner_automation_jobs (offer_id);

drop trigger if exists owner_automation_jobs_touch on public.owner_automation_jobs;
create trigger owner_automation_jobs_touch before update on public.owner_automation_jobs
  for each row execute function public.set_updated_at();

alter table public.owner_automation_jobs enable row level security;
-- Owner reads/writes; service_role (worker) reads/writes. Never anon / customer.
drop policy if exists owner_automation_jobs_owner_all on public.owner_automation_jobs;
create policy owner_automation_jobs_owner_all on public.owner_automation_jobs
  for all to authenticated using (public.is_platform_owner()) with check (public.is_platform_owner());

grant select, insert, update on public.owner_automation_jobs to authenticated, service_role;

commit;

-- ---------------------------------------------------------------------------
-- 5. Private storage bucket for drawn signatures + finalized signed offer PDFs is
--    provisioned only where the Supabase `storage` schema exists (production). The
--    local migration-test harness has no storage schema, so this is guarded and is
--    a no-op there. Signatures are NEVER public; owners read them via short-lived
--    signed URLs generated server/owner-side.
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage')
     and exists (select 1 from information_schema.tables where table_schema='storage' and table_name='buckets') then
    insert into storage.buckets (id, name, public)
    values ('owner-offer-signatures','owner-offer-signatures', false)
    on conflict (id) do nothing;
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- 6. owner_apply_offer_header — re-created to ALSO persist the greeting fields.
--    Everything else is unchanged from 20260723123000. SECURITY DEFINER, internal
--    (service_role only), called by create/update-draft RPCs.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_apply_offer_header(p_offer_id uuid, p_header jsonb, p_sections jsonb)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  update public.owner_offers set
    organization_id     = nullif(p_header->>'organization_id','')::uuid,
    client_account_id   = nullif(p_header->>'client_account_id','')::uuid,
    engagement_id       = nullif(p_header->>'engagement_id','')::uuid,
    title               = p_header->>'title',
    subtitle            = p_header->>'subtitle',
    issue_date          = nullif(p_header->>'issue_date','')::date,
    valid_until         = nullif(p_header->>'valid_until','')::date,
    currency            = coalesce(nullif(p_header->>'currency',''), currency),
    introduction        = p_header->>'introduction',
    executive_summary   = p_header->>'executive_summary',
    project_approach    = p_header->>'project_approach',
    next_steps          = p_header->>'next_steps',
    scope               = p_header->>'scope',
    assumptions         = p_header->>'assumptions',
    exclusions          = p_header->>'exclusions',
    payment_terms       = p_header->>'payment_terms',
    delivery_terms      = p_header->>'delivery_terms',
    internal_notes      = p_header->>'internal_notes',
    template_key        = coalesce(nullif(p_header->>'template_key',''), template_key),
    recipient_source    = coalesce(nullif(p_header->>'recipient_source',''), 'crm'),
    recipient_company     = p_header->>'recipient_company',
    recipient_contact_name= p_header->>'recipient_contact_name',
    recipient_department  = p_header->>'recipient_department',
    recipient_street      = p_header->>'recipient_street',
    recipient_postal_code = p_header->>'recipient_postal_code',
    recipient_city        = p_header->>'recipient_city',
    recipient_country_code= p_header->>'recipient_country_code',
    recipient_email       = p_header->>'recipient_email',
    recipient_phone       = p_header->>'recipient_phone',
    recipient_vat_id      = p_header->>'recipient_vat_id',
    -- Greeting personalization (explicit; gender never inferred).
    recipient_salutation  = nullif(p_header->>'recipient_salutation',''),
    recipient_title       = nullif(p_header->>'recipient_title',''),
    recipient_first_name  = nullif(p_header->>'recipient_first_name',''),
    recipient_last_name   = nullif(p_header->>'recipient_last_name',''),
    recipient_greeting_name = nullif(p_header->>'recipient_greeting_name',''),
    desired_outcomes    = coalesce(p_sections->'desired_outcomes', '[]'::jsonb),
    timeline            = coalesce(p_sections->'timeline', '[]'::jsonb),
    payment_schedule    = coalesce(p_sections->'payment_schedule', '[]'::jsonb)
  where id = p_offer_id;
end;
$$;

revoke execute on function public.owner_apply_offer_header(uuid, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.owner_apply_offer_header(uuid, jsonb, jsonb) to service_role;

commit;

-- ---------------------------------------------------------------------------
-- 6b. owner_guard_offer — re-created to ALSO freeze the greeting fields once an
--     offer leaves draft (defense in depth; the projection is already snapshot-
--     backed). Body is identical to 20260723123000 plus the five greeting columns.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_guard_offer()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if tg_op = 'DELETE' then
    if public.is_database_admin() or public.request_is_service_role() then return old; end if;
    if old.status <> 'draft' then raise exception 'only draft offers can be deleted'; end if;
    return old;
  end if;
  if old.status <> 'draft' then
    if new.offer_number is distinct from old.offer_number then raise exception 'finalized offer number cannot change'; end if;
    if new.title is distinct from old.title
       or new.subtitle is distinct from old.subtitle
       or new.introduction is distinct from old.introduction
       or new.executive_summary is distinct from old.executive_summary
       or new.project_approach is distinct from old.project_approach
       or new.next_steps is distinct from old.next_steps
       or new.scope is distinct from old.scope
       or new.assumptions is distinct from old.assumptions
       or new.exclusions is distinct from old.exclusions
       or new.payment_terms is distinct from old.payment_terms
       or new.delivery_terms is distinct from old.delivery_terms
       or new.desired_outcomes is distinct from old.desired_outcomes
       or new.timeline is distinct from old.timeline
       or new.payment_schedule is distinct from old.payment_schedule
       or new.template_key is distinct from old.template_key
       or new.recipient_company is distinct from old.recipient_company
       or new.recipient_contact_name is distinct from old.recipient_contact_name
       or new.recipient_department is distinct from old.recipient_department
       or new.recipient_street is distinct from old.recipient_street
       or new.recipient_postal_code is distinct from old.recipient_postal_code
       or new.recipient_city is distinct from old.recipient_city
       or new.recipient_country_code is distinct from old.recipient_country_code
       or new.recipient_email is distinct from old.recipient_email
       or new.recipient_phone is distinct from old.recipient_phone
       or new.recipient_vat_id is distinct from old.recipient_vat_id
       or new.recipient_salutation is distinct from old.recipient_salutation
       or new.recipient_title is distinct from old.recipient_title
       or new.recipient_first_name is distinct from old.recipient_first_name
       or new.recipient_last_name is distinct from old.recipient_last_name
       or new.recipient_greeting_name is distinct from old.recipient_greeting_name
       or new.valid_until is distinct from old.valid_until
       or new.net_total_cents is distinct from old.net_total_cents
       or new.gross_total_cents is distinct from old.gross_total_cents then
      raise exception 'finalized offer content is immutable; create a revision instead';
    end if;
  end if;
  return new;
end;
$$;

commit;

-- ---------------------------------------------------------------------------
-- 7. public_offer_by_token — re-created to serve a CURATED projection from the
--    IMMUTABLE finalized snapshot (owner_offer_versions) whenever one exists, so
--    the portal always matches the finalized PDF and cannot be changed by later
--    CRM / settings edits. Only current status + token lifecycle come from the live
--    row. Greeting fields + structured content are included. It NEVER returns raw
--    snapshot JSON, internal notes, storage paths, ids, token hashes or bank data.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.public_offer_by_token(p_token text, p_user_agent text default null)
returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare
  tok public.owner_document_access_tokens; o record; v_doc record; v_ver record;
  snap jsonb; so jsonb; sl jsonb; ss jsonb; st jsonb; v_lines jsonb; v_result jsonb;
  v_signer text; v_accepted_at timestamptz;
begin
  tok := public.owner_verify_offer_token(p_token);
  select * into o from public.owner_offers where id = tok.offer_id;
  if o.id is null then raise exception 'offer unavailable'; end if;
  if o.status = 'cancelled' then raise exception 'offer unavailable'; end if;

  select * into v_doc from public.owner_generated_documents where id = tok.document_id;
  select * into v_ver from public.owner_offer_versions where offer_id = o.id order by version desc limit 1;

  -- Record the view + notify the owner once; advance finalized/sent -> viewed. This is the
  -- only place we touch the live row, and only for status/lifecycle (never content).
  insert into public.owner_document_access_events (token_id, offer_id, event_type, user_agent_summary)
  values (tok.id, o.id, 'viewed', left(coalesce(p_user_agent,''), 200));
  if o.status in ('finalized','sent') then
    update public.owner_offers set status = 'viewed' where id = o.id;
    insert into public.owner_finance_notifications (business_entity_id, category, title, body, resource_type, resource_id, amount_cents, priority)
    values (o.business_entity_id, 'offer_viewed', 'Angebot angesehen',
      coalesce(o.offer_number,'') || ' wurde vom Kunden geöffnet.', 'owner_offers', o.id, o.gross_total_cents, 'normal');
  end if;

  -- Accepted signer name + timestamp (for the returning-visitor success view). Never email/role.
  if o.status in ('accepted','converted') then
    select signer_name, created_at into v_signer, v_accepted_at
    from public.owner_offer_acceptance_events
    where offer_id = o.id and decision = 'accepted' order by event_order desc limit 1;
  end if;

  if v_ver.snapshot is not null then
    -- ---- Serve from the immutable snapshot ----
    snap := v_ver.snapshot;
    so := snap->'offer';
    ss := snap->'seller';
    st := snap->'totals';
    select coalesce(jsonb_agg(jsonb_build_object(
      'description', l->>'description', 'details', l->>'details',
      'deliverables', coalesce(l->'deliverables','[]'::jsonb),
      'phase_label', l->>'phase_label', 'duration_label', l->>'duration_label',
      'quantity_milli', (l->>'quantity_milli')::bigint, 'unit', l->>'unit',
      'unit_price_cents', (l->>'unit_price_cents')::bigint, 'vat_rate_bp', (l->>'vat_rate_bp')::int,
      'vat_treatment', l->>'vat_treatment',
      'net_cents', (l->>'net_cents')::bigint, 'vat_cents', (l->>'vat_cents')::bigint,
      'gross_cents', (l->>'gross_cents')::bigint, 'is_optional', (l->>'is_optional')::boolean
    ) order by (l->>'sort_order')::int), '[]'::jsonb) into v_lines
    from jsonb_array_elements(coalesce(snap->'lines','[]'::jsonb)) l;

    v_result := jsonb_build_object(
      'offer_number', so->>'offer_number', 'title', so->>'title', 'subtitle', so->>'subtitle',
      'status', case when o.status='converted' then 'accepted' else o.status end,
      'issue_date', so->>'issue_date', 'valid_until', so->>'valid_until', 'currency', so->>'currency',
      'introduction', so->>'introduction', 'executive_summary', so->>'executive_summary',
      'project_approach', so->>'project_approach', 'next_steps', so->>'next_steps',
      'scope', so->>'scope', 'assumptions', so->>'assumptions', 'exclusions', so->>'exclusions',
      'payment_terms', so->>'payment_terms', 'delivery_terms', so->>'delivery_terms',
      'desired_outcomes', coalesce(so->'desired_outcomes','[]'::jsonb),
      'timeline', coalesce(so->'timeline','[]'::jsonb),
      'payment_schedule', coalesce(so->'payment_schedule','[]'::jsonb),
      'net_total_cents', coalesce((st->>'net_cents')::bigint, 0),
      'vat_total_cents', coalesce((st->>'vat_cents')::bigint, 0),
      'gross_total_cents', coalesce((st->>'gross_cents')::bigint, 0),
      'lines', v_lines,
      'recipient', jsonb_build_object(
        'company', so->>'recipient_company', 'contact_name', so->>'recipient_contact_name',
        'city', so->>'recipient_city', 'email', so->>'recipient_email',
        'salutation', so->>'recipient_salutation', 'title', so->>'recipient_title',
        'first_name', so->>'recipient_first_name', 'last_name', so->>'recipient_last_name',
        'greeting_name', so->>'recipient_greeting_name'),
      'seller', jsonb_build_object(
        'legal_name', coalesce(ss->>'legal_name',''), 'street', ss->>'street',
        'postal_code', ss->>'postal_code', 'city', ss->>'city',
        'country_code', coalesce(ss->>'country_code','DE'), 'email', ss->>'email',
        'website', ss->>'website', 'vat_id', ss->>'vat_id'),
      'template_version', snap->>'template_version'
    );
  else
    -- ---- Fallback: no snapshot (defensive; a token requires a non-draft offer). ----
    select coalesce(jsonb_agg(jsonb_build_object(
      'description', l.description, 'details', l.details, 'deliverables', l.deliverables,
      'phase_label', l.phase_label, 'duration_label', l.duration_label,
      'quantity_milli', l.quantity_milli, 'unit', l.unit,
      'unit_price_cents', l.unit_price_cents, 'vat_rate_bp', l.vat_rate_bp, 'vat_treatment', l.vat_treatment,
      'net_cents', l.net_cents, 'vat_cents', l.vat_cents, 'gross_cents', l.gross_cents, 'is_optional', l.is_optional
    ) order by l.sort_order), '[]'::jsonb) into v_lines
    from public.owner_offer_lines l where l.offer_id = o.id;

    v_result := jsonb_build_object(
      'offer_number', o.offer_number, 'title', o.title, 'subtitle', o.subtitle,
      'status', case when o.status='converted' then 'accepted' else o.status end,
      'issue_date', o.issue_date, 'valid_until', o.valid_until, 'currency', o.currency,
      'introduction', o.introduction, 'executive_summary', o.executive_summary,
      'project_approach', o.project_approach, 'next_steps', o.next_steps,
      'scope', o.scope, 'assumptions', o.assumptions, 'exclusions', o.exclusions,
      'payment_terms', o.payment_terms, 'delivery_terms', o.delivery_terms,
      'desired_outcomes', o.desired_outcomes, 'timeline', o.timeline, 'payment_schedule', o.payment_schedule,
      'net_total_cents', o.net_total_cents, 'vat_total_cents', o.vat_total_cents, 'gross_total_cents', o.gross_total_cents,
      'lines', v_lines,
      'recipient', jsonb_build_object(
        'company', o.recipient_company, 'contact_name', o.recipient_contact_name, 'city', o.recipient_city,
        'email', o.recipient_email, 'salutation', o.recipient_salutation, 'title', o.recipient_title,
        'first_name', o.recipient_first_name, 'last_name', o.recipient_last_name,
        'greeting_name', o.recipient_greeting_name),
      'seller', (select jsonb_build_object(
        'legal_name', coalesce(s.legal_name,''), 'street', s.street, 'postal_code', s.postal_code,
        'city', s.city, 'country_code', coalesce(s.country_code,'DE'), 'email', s.business_email,
        'website', s.website, 'vat_id', s.vat_id)
        from public.owner_document_settings s where s.business_entity_id = o.business_entity_id),
      'template_version', v_ver.template_version
    );
  end if;

  -- Common status/lifecycle + document availability (from live row + generated doc).
  v_result := v_result || jsonb_build_object(
    'accepted', (o.status in ('accepted','converted')),
    'rejected', (o.status = 'rejected'),
    'expired', (o.status = 'expired' or o.valid_until < current_date),
    'has_pdf', (v_doc.id is not null and v_doc.pdf_storage_path is not null),
    'document_version', v_doc.version,
    'accepted_signer_name', v_signer,
    'accepted_at', v_accepted_at,
    'signed_document_available', exists (
      select 1 from public.owner_generated_documents g
      where g.source_resource_type='owner_offers' and g.source_resource_id=o.id
        and g.document_type='offer' and g.render_metadata->>'signed' = 'true')
  );
  return v_result;
end;
$$;

revoke execute on function public.public_offer_by_token(text, text) from public;
grant execute on function public.public_offer_by_token(text, text) to anon, authenticated, service_role;

commit;

-- ---------------------------------------------------------------------------
-- 8. owner_convert_offer_internal — server-authoritative invoice draft creation
--    WITHOUT the interactive owner check (called by the acceptance pipeline that
--    runs in an anonymous / service context). Idempotent via converted_invoice_id.
--    Uses accepted offer lines + snapshot totals; due date from automation setting.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_convert_offer_internal(p_offer_id uuid)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare o record; v_inv uuid; v_line record; v_terms int;
begin
  select * into o from public.owner_offers where id = p_offer_id for update;
  if o.id is null then raise exception 'offer not found'; end if;
  if o.converted_invoice_id is not null then return o.converted_invoice_id; end if;
  if o.status not in ('accepted') then raise exception 'only accepted offers can be converted'; end if;

  select coalesce(default_invoice_due_days, default_payment_terms_days, 14) into v_terms
    from public.owner_document_settings where business_entity_id = o.business_entity_id;
  v_terms := coalesce(v_terms, 14);

  insert into public.owner_invoices (business_entity_id, organization_id, client_account_id, engagement_id,
    status, issue_date, service_date, due_date, currency, notes, external_reference, created_by)
  values (o.business_entity_id, o.organization_id, o.client_account_id, o.engagement_id, 'draft',
    current_date, current_date, current_date + v_terms, o.currency,
    coalesce(o.payment_terms, ''), 'Angebot ' || coalesce(o.offer_number, o.id::text), o.created_by)
  returning id into v_inv;

  for v_line in select * from public.owner_offer_lines where offer_id = p_offer_id and is_optional = false order by sort_order loop
    insert into public.owner_invoice_lines (invoice_id, description, quantity_milli, unit_price_cents, vat_rate_bp, vat_treatment, sort_order)
    values (v_inv, v_line.description, v_line.quantity_milli, v_line.unit_price_cents, v_line.vat_rate_bp, v_line.vat_treatment, v_line.sort_order);
  end loop;

  update public.owner_offers set converted_invoice_id = v_inv, converted_at = now(), status = 'converted' where id = p_offer_id;
  return v_inv;
end;
$$;

revoke execute on function public.owner_convert_offer_internal(uuid) from public, anon, authenticated;
grant execute on function public.owner_convert_offer_internal(uuid) to service_role;

commit;

-- ---------------------------------------------------------------------------
-- 9. owner_invoice_preflight — read-only completeness gate before issuing/sending.
--    Returns { ok, missing[] }. Never raises; never sends an incomplete invoice.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_invoice_preflight(p_entity uuid, p_offer_id uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare s record; o record; missing text[] := '{}';
begin
  select * into s from public.owner_document_settings where business_entity_id = p_entity;
  select * into o from public.owner_offers where id = p_offer_id;
  if coalesce(s.legal_name,'') = '' then missing := missing || 'seller_legal_name'; end if;
  if coalesce(s.street,'') = '' or coalesce(s.city,'') = '' then missing := missing || 'seller_address'; end if;
  if coalesce(s.vat_id,'') = '' and coalesce(s.tax_number,'') = '' then missing := missing || 'seller_tax_information'; end if;
  if coalesce(s.invoice_number_prefix,'') = '' then missing := missing || 'invoice_number_configuration'; end if;
  if coalesce(o.recipient_company,'') = '' then missing := missing || 'recipient_legal_name'; end if;
  if coalesce(o.recipient_street,'') = '' or coalesce(o.recipient_city,'') = '' then missing := missing || 'recipient_address'; end if;
  if coalesce(s.business_email,'') = '' then missing := missing || 'sender_email_configuration'; end if;
  return jsonb_build_object('ok', array_length(missing,1) is null, 'missing', to_jsonb(missing));
end;
$$;

revoke execute on function public.owner_invoice_preflight(uuid, uuid) from public, anon;
grant execute on function public.owner_invoice_preflight(uuid, uuid) to authenticated, service_role;

commit;

-- ---------------------------------------------------------------------------
-- 10. owner_enqueue_automation_job — dedupe-keyed insert (one job per offer+type).
--     owner_process_offer_acceptance — the server-authoritative pipeline run after
--     an offer becomes 'accepted': idempotently create the invoice (per setting),
--     run preflight, and queue issue/send/email jobs. It is safe to call repeatedly.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_enqueue_automation_job(
  p_entity uuid, p_type text, p_offer uuid, p_invoice uuid, p_accept uuid, p_email text, p_subject text, p_payload jsonb)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id uuid; v_key text;
begin
  v_key := coalesce(p_offer::text, 'x') || ':' || p_type;
  insert into public.owner_automation_jobs (business_entity_id, job_type, offer_id, invoice_id, acceptance_event_id, recipient_email, subject, dedupe_key, payload)
  values (p_entity, p_type, p_offer, p_invoice, p_accept, p_email, p_subject, v_key, coalesce(p_payload,'{}'::jsonb))
  on conflict (dedupe_key) do nothing
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.owner_process_offer_acceptance(p_offer_id uuid, p_accept_event uuid default null)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare o record; s record; v_inv uuid; v_pre jsonb; v_email text; v_subject text; v_created boolean := false;
begin
  select * into o from public.owner_offers where id = p_offer_id for update;
  if o.id is null then raise exception 'offer not found'; end if;
  if o.status not in ('accepted','converted') then
    return jsonb_build_object('processed', false, 'reason', 'offer_not_accepted');
  end if;

  select * into s from public.owner_document_settings where business_entity_id = o.business_entity_id;
  v_pre := public.owner_invoice_preflight(o.business_entity_id, o.id);
  v_email := coalesce(nullif(trim(o.recipient_email),''), s.business_email);
  v_subject := coalesce(nullif(s.invoice_email_subject_template,''),
    'Ihre Rechnung zu Angebot ' || coalesce(o.offer_number,''));

  -- (a) Create the invoice draft (default: on). Idempotent via converted_invoice_id.
  if coalesce(s.auto_create_invoice_on_acceptance, true) then
    if o.converted_invoice_id is not null then
      v_inv := o.converted_invoice_id;
    else
      -- convert requires status 'accepted'; if already 'converted' the id branch above handled it.
      if o.status = 'accepted' then
        v_inv := public.owner_convert_offer_internal(o.id);
        v_created := true;
        insert into public.owner_finance_notifications (business_entity_id, category, title, body, resource_type, resource_id, amount_cents, priority)
        values (o.business_entity_id, 'invoice_created', 'Rechnung automatisch erstellt',
          'Zu ' || coalesce(o.offer_number,'') || ' wurde ein Rechnungsentwurf erstellt.', 'owner_invoices', v_inv, o.gross_total_cents, 'normal');
      end if;
    end if;
  end if;

  -- (b) Issue + (c) send are only queued when preflight passes AND the owner enabled them.
  if (v_pre->>'ok')::boolean then
    if coalesce(s.auto_issue_invoice_on_acceptance, false) and v_inv is not null then
      perform public.owner_enqueue_automation_job(o.business_entity_id, 'invoice_issue', o.id, v_inv, p_accept_event, v_email, v_subject, '{}'::jsonb);
    end if;
    if coalesce(s.auto_send_invoice_on_acceptance, false) and v_inv is not null then
      perform public.owner_enqueue_automation_job(o.business_entity_id, 'invoice_send', o.id, v_inv, p_accept_event, v_email, v_subject, '{}'::jsonb);
    end if;
  else
    -- Preflight failed: acceptance stands, invoice remains a draft, owner is asked to act.
    insert into public.owner_finance_notifications (business_entity_id, category, title, body, resource_type, resource_id, amount_cents, priority)
    values (o.business_entity_id, 'automation_attention', 'Automatisierung benötigt Aufmerksamkeit',
      'Die Rechnung zu ' || coalesce(o.offer_number,'') || ' konnte nicht automatisch versendet werden (fehlende Angaben).',
      'owner_offers', o.id, o.gross_total_cents, 'high');
  end if;

  return jsonb_build_object('processed', true, 'invoice_id', v_inv, 'invoice_created', v_created, 'preflight', v_pre);
end;
$$;

revoke execute on function public.owner_enqueue_automation_job(uuid, text, uuid, uuid, uuid, text, text, jsonb) from public, anon, authenticated;
revoke execute on function public.owner_process_offer_acceptance(uuid, uuid) from public, anon;
grant execute on function public.owner_enqueue_automation_job(uuid, text, uuid, uuid, uuid, text, text, jsonb) to service_role;
grant execute on function public.owner_process_offer_acceptance(uuid, uuid) to authenticated, service_role;

commit;

-- ---------------------------------------------------------------------------
-- 11. respond_offer_by_token — re-created to (a) persist the accepted gross amount
--     + currency + optional signer role + optional signature evidence metadata on
--     the acceptance event, and (b) drive the server-authoritative acceptance
--     pipeline (idempotent invoice + automation jobs). The signature payload metadata
--     (hash + private storage path) is written by the token-authenticated Edge
--     Function via record_offer_acceptance; this anon RPC accepts an optional
--     pre-computed hash so the flow is complete even without the drawn signature.
--     Duplicate acceptance remains fully idempotent.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.respond_offer_by_token(
  p_token text, p_decision text, p_signer_name text, p_signer_company text, p_signer_email text,
  p_terms_version text, p_comment text default null, p_user_agent text default null)
returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare tok public.owner_document_access_tokens; o record; v_doc record; v_order bigint; v_hash text; v_evt uuid; v_ver int;
begin
  if p_decision not in ('accepted','rejected') then raise exception 'invalid decision'; end if;
  tok := public.owner_verify_offer_token(p_token);
  if tok.use_count >= tok.max_uses then raise exception 'token use limit reached'; end if;

  select * into o from public.owner_offers where id = tok.offer_id for update;
  if o.id is null then raise exception 'offer unavailable'; end if;

  if o.status in ('accepted','converted') then
    return jsonb_build_object('decision','accepted','already_recorded',true,'offer_number',o.offer_number);
  end if;
  if o.status = 'rejected' then
    return jsonb_build_object('decision','rejected','already_recorded',true,'offer_number',o.offer_number);
  end if;
  if o.status not in ('finalized','sent','viewed') then raise exception 'offer is not open for a response'; end if;
  if o.valid_until < current_date then raise exception 'offer has expired'; end if;
  if p_decision = 'accepted' and coalesce(trim(p_signer_name),'') = '' then raise exception 'signer name is required'; end if;

  select * into v_doc from public.owner_generated_documents where id = tok.document_id;
  select source_hash, version into v_hash, v_ver from public.owner_offer_versions where offer_id=o.id order by version desc limit 1;
  v_hash := coalesce(v_doc.source_hash, v_hash);

  select coalesce(max(event_order),0)+1 into v_order from public.owner_offer_acceptance_events where offer_id = o.id;

  insert into public.owner_offer_acceptance_events (business_entity_id, offer_id, document_id, document_version, source_hash,
    token_id, decision, signature_level, signer_name, signer_company, signer_email, accepted_terms_version, comment,
    accepted_gross_cents, currency, event_order, user_agent_summary)
  values (o.business_entity_id, o.id, tok.document_id, coalesce(v_doc.version, v_ver), v_hash, tok.id, p_decision,
    'simple_electronic_signature', nullif(trim(p_signer_name),''), nullif(trim(p_signer_company),''),
    nullif(trim(p_signer_email),''), p_terms_version, nullif(trim(p_comment),''),
    o.gross_total_cents, o.currency, v_order, left(coalesce(p_user_agent,''),200))
  returning id into v_evt;

  update public.owner_document_access_tokens set use_count = use_count + 1 where id = tok.id;
  insert into public.owner_document_access_events (token_id, offer_id, event_type, user_agent_summary)
  values (tok.id, o.id, p_decision, left(coalesce(p_user_agent,''),200));

  if p_decision = 'accepted' then
    update public.owner_offers set status='accepted', accepted_at=now() where id=o.id;
    insert into public.owner_finance_notifications (business_entity_id, category, title, body, resource_type, resource_id, amount_cents, priority)
    values (o.business_entity_id, 'offer_accepted', 'Angebot angenommen',
      coalesce(o.offer_number,'') || ' wurde von ' || coalesce(nullif(trim(p_signer_name),''),'dem Kunden') || ' angenommen.',
      'owner_offers', o.id, o.gross_total_cents, 'high');
    -- Server-authoritative downstream: idempotent invoice + configured automation jobs.
    perform public.owner_process_offer_acceptance(o.id, v_evt);
  else
    update public.owner_offers set status='rejected', rejected_at=now(), rejection_reason=nullif(trim(p_comment),'') where id=o.id;
    insert into public.owner_finance_notifications (business_entity_id, category, title, body, resource_type, resource_id, amount_cents, priority)
    values (o.business_entity_id, 'offer_rejected', 'Angebot abgelehnt',
      coalesce(o.offer_number,'') || ' wurde abgelehnt.', 'owner_offers', o.id, o.gross_total_cents, 'high');
  end if;

  return jsonb_build_object('decision', p_decision, 'offer_number', o.offer_number, 'source_hash', v_hash, 'event_order', v_order, 'acceptance_event_id', v_evt);
end;
$$;

revoke execute on function public.respond_offer_by_token(text, text, text, text, text, text, text, text) from public;
grant execute on function public.respond_offer_by_token(text, text, text, text, text, text, text, text) to anon, authenticated, service_role;

commit;

-- ---------------------------------------------------------------------------
-- 12. record_offer_acceptance — the token-authenticated Edge Function path. The
--     Edge Function validates the token, validates + hashes the PNG, stores it in
--     the PRIVATE signatures bucket (service-role, server-generated path), then
--     calls this (service_role-only) RPC with the signature EVIDENCE (never bytes).
--     Binds evidence to the exact immutable version + source hash, is idempotent,
--     and drives the same acceptance pipeline as the anon RPC.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.record_offer_acceptance(
  p_token text, p_signer_name text, p_signer_company text, p_signer_email text, p_signer_role text,
  p_comment text, p_terms_version text, p_signature_path text, p_signature_sha256 text,
  p_signature_bytes int, p_user_agent text default null, p_ip_hash text default null)
returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare tok public.owner_document_access_tokens; o record; v_doc record; v_order bigint; v_hash text; v_evt uuid; v_ver int;
begin
  if not public.request_is_service_role() then raise exception 'service role required'; end if;
  tok := public.owner_verify_offer_token(p_token);
  if tok.use_count >= tok.max_uses then raise exception 'token use limit reached'; end if;
  -- Server-side signature-payload gate (defence in depth; the Edge Function checks first).
  if coalesce(trim(p_signer_name),'') = '' then raise exception 'signer name is required'; end if;
  if coalesce(p_signature_sha256,'') !~ '^[0-9a-f]{64}$' then raise exception 'invalid signature hash'; end if;
  if coalesce(p_signature_bytes,0) <= 0 or p_signature_bytes > 400000 then raise exception 'signature payload out of bounds'; end if;

  select * into o from public.owner_offers where id = tok.offer_id for update;
  if o.id is null then raise exception 'offer unavailable'; end if;
  if o.status in ('accepted','converted') then
    return jsonb_build_object('decision','accepted','already_recorded',true,'offer_number',o.offer_number);
  end if;
  if o.status not in ('finalized','sent','viewed') then raise exception 'offer is not open for a response'; end if;
  if o.valid_until < current_date then raise exception 'offer has expired'; end if;

  select * into v_doc from public.owner_generated_documents where id = tok.document_id;
  select source_hash, version into v_hash, v_ver from public.owner_offer_versions where offer_id=o.id order by version desc limit 1;
  v_hash := coalesce(v_doc.source_hash, v_hash);
  select coalesce(max(event_order),0)+1 into v_order from public.owner_offer_acceptance_events where offer_id = o.id;

  insert into public.owner_offer_acceptance_events (business_entity_id, offer_id, document_id, document_version, source_hash,
    token_id, decision, signature_level, signer_name, signer_company, signer_email, signer_role, accepted_terms_version, comment,
    signature_storage_path, signature_sha256, accepted_gross_cents, currency, event_order, user_agent_summary, ip_hash)
  values (o.business_entity_id, o.id, tok.document_id, coalesce(v_doc.version, v_ver), v_hash, tok.id, 'accepted',
    'simple_electronic_signature', nullif(trim(p_signer_name),''), nullif(trim(p_signer_company),''),
    nullif(trim(p_signer_email),''), nullif(trim(p_signer_role),''), p_terms_version, nullif(trim(p_comment),''),
    p_signature_path, p_signature_sha256, o.gross_total_cents, o.currency, v_order, left(coalesce(p_user_agent,''),200), p_ip_hash)
  returning id into v_evt;

  update public.owner_document_access_tokens set use_count = use_count + 1 where id = tok.id;
  insert into public.owner_document_access_events (token_id, offer_id, event_type, user_agent_summary, ip_hash)
  values (tok.id, o.id, 'accepted', left(coalesce(p_user_agent,''),200), p_ip_hash);

  update public.owner_offers set status='accepted', accepted_at=now() where id=o.id;
  insert into public.owner_finance_notifications (business_entity_id, category, title, body, resource_type, resource_id, amount_cents, priority)
  values (o.business_entity_id, 'offer_accepted', 'Angebot angenommen',
    coalesce(o.offer_number,'') || ' wurde von ' || coalesce(nullif(trim(p_signer_name),''),'dem Kunden') || ' unterschrieben angenommen.',
    'owner_offers', o.id, o.gross_total_cents, 'high');
  perform public.owner_process_offer_acceptance(o.id, v_evt);

  return jsonb_build_object('decision','accepted','offer_number',o.offer_number,'source_hash',v_hash,'event_order',v_order,'acceptance_event_id',v_evt);
end;
$$;

revoke execute on function public.record_offer_acceptance(text, text, text, text, text, text, text, text, text, int, text, text) from public, anon, authenticated;
grant execute on function public.record_offer_acceptance(text, text, text, text, text, text, text, text, text, int, text, text) to service_role;

commit;

-- ---------------------------------------------------------------------------
-- 13. owner_offer_acceptance_summary — owner-only retrieval for the dashboard
--     acceptance view. Returns signer identity, accepted amount, signature storage
--     path (owner signs a short-lived URL client-side), immutable version + source
--     hash, generated invoice + status, and the automation-job statuses. Owner-only;
--     never exposed to anon / customer.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_offer_acceptance_summary(p_offer_id uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare o record; e record; inv record; v_jobs jsonb;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  select * into o from public.owner_offers where id = p_offer_id;
  if o.id is null then raise exception 'offer not found'; end if;

  select * into e from public.owner_offer_acceptance_events
    where offer_id = p_offer_id and decision = 'accepted' order by event_order desc limit 1;
  select * into inv from public.owner_invoices where id = o.converted_invoice_id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', j.id, 'job_type', j.job_type, 'status', j.status, 'attempt_count', j.attempt_count,
    'last_error', j.last_error, 'provider_message_id', j.provider_message_id,
    'sent_at', j.sent_at, 'updated_at', j.updated_at) order by j.created_at), '[]'::jsonb)
  into v_jobs from public.owner_automation_jobs j where j.offer_id = p_offer_id;

  return jsonb_build_object(
    'offer_id', o.id, 'offer_number', o.offer_number, 'title', o.title, 'status', o.status,
    'accepted', o.status in ('accepted','converted'),
    'accepted_at', o.accepted_at,
    'signer_name', e.signer_name, 'signer_company', e.signer_company, 'signer_email', e.signer_email,
    'signer_role', e.signer_role, 'accepted_gross_cents', e.accepted_gross_cents, 'currency', e.currency,
    'terms_version', e.accepted_terms_version, 'signature_level', e.signature_level,
    'signature_storage_path', e.signature_storage_path, 'signature_sha256', e.signature_sha256,
    'document_version', e.document_version, 'source_hash', e.source_hash,
    'invoice', case when inv.id is null then null else jsonb_build_object(
      'id', inv.id, 'invoice_number', inv.invoice_number, 'status', inv.status,
      'gross_total_cents', inv.gross_total_cents, 'due_date', inv.due_date) end,
    'automation_jobs', v_jobs
  );
end;
$$;

revoke execute on function public.owner_offer_acceptance_summary(uuid) from public, anon;
grant execute on function public.owner_offer_acceptance_summary(uuid) to authenticated, service_role;

commit;
