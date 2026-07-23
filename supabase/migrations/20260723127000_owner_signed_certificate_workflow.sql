-- =============================================================================
-- Owner SIGNED ACCEPTANCE CERTIFICATE + CONFIRMATION workflow — the production
-- post-acceptance pipeline that turns a signed offer acceptance into a permanent,
-- server-authoritative acceptance certificate PDF and a premium confirmation email.
--
-- ADDITIVE migration. It does NOT modify any previously applied migration file
-- (including 20260723125000 / 20260723126000). It only:
--   * adds two acceptance-automation settings (generate signed certificate +
--     send signed confirmation) and optional confirmation-email templates, both
--     with premium-safe defaults (certificate + confirmation default ON; invoice
--     issue/send remain OFF from 125000 and are untouched here);
--   * re-creates upsert_owner_document_settings (CREATE OR REPLACE) to ALSO persist
--     the four new columns — body is byte-identical to 125000 plus the new fields;
--   * extends the owner_automation_jobs job_type CHECK to add the two signed-offer
--     job types plus an explicit invoice_pdf_generate step (retryable separately);
--   * re-creates owner_process_offer_acceptance to ALSO enqueue the certificate +
--     confirmation jobs (idempotent via the existing per-offer+type dedupe key);
--   * adds a service-role certificate CONTEXT projection (seller + signer + immutable
--     offer snapshot + signature evidence, incl. the private storage path the WORKER
--     needs to fetch the PNG — never exposed to a customer);
--   * adds a service-role certificate REGISTER (idempotent; registers the certificate
--     as a signed offer document so signed_document_available flips true with NO change
--     to public_offer_by_token);
--   * adds an OWNER-gated retry/enqueue RPC for the dashboard retry actions;
--   * re-creates owner_offer_acceptance_summary to ALSO surface the certificate document;
--   * documents secure Supabase Cron scheduling (guarded; a NO-OP in local tests).
--
-- All monetary math + numbering remain server-authoritative. Every worker function is
-- service-role only; the retry RPC is owner-only. pgcrypto is referenced schema-qualified
-- (extensions.*), as established in 124000. No secret, raw token, signature bytes or
-- storage path is ever returned to a public/anon projection.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Certificate + confirmation automation settings. Premium-safe defaults:
--    generate the signed certificate and send the confirmation automatically
--    (these are non-destructive, customer-positive actions), while invoice
--    issue/send stay OFF (from 125000) until the owner opts in.
-- ---------------------------------------------------------------------------
begin;

alter table public.owner_document_settings
  add column if not exists auto_generate_signed_certificate_on_acceptance boolean not null default true,
  add column if not exists auto_send_signed_confirmation_on_acceptance boolean not null default true,
  add column if not exists confirmation_email_subject_template text,
  add column if not exists confirmation_email_body_template text;

comment on column public.owner_document_settings.auto_generate_signed_certificate_on_acceptance is
  'When true, a permanent signed acceptance certificate PDF is generated after a signed acceptance.';
comment on column public.owner_document_settings.auto_send_signed_confirmation_on_acceptance is
  'When true, a premium confirmation email (with the certificate attached) is sent after a signed acceptance.';

commit;

-- ---------------------------------------------------------------------------
-- 2. upsert_owner_document_settings — re-created to ALSO persist the four new
--    columns. Body is the 20260723125000 version plus the certificate/confirmation
--    fields on INSERT and the ON CONFLICT update. Owner-only; unchanged security.
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
    default_invoice_due_days, invoice_email_subject_template, invoice_email_body_template,
    auto_generate_signed_certificate_on_acceptance, auto_send_signed_confirmation_on_acceptance,
    confirmation_email_subject_template, confirmation_email_body_template, created_by)
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
    coalesce((p_settings->>'auto_generate_signed_certificate_on_acceptance')::boolean, true),
    coalesce((p_settings->>'auto_send_signed_confirmation_on_acceptance')::boolean, true),
    nullif(p_settings->>'confirmation_email_subject_template',''), nullif(p_settings->>'confirmation_email_body_template',''),
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
    invoice_email_body_template = excluded.invoice_email_body_template,
    auto_generate_signed_certificate_on_acceptance = excluded.auto_generate_signed_certificate_on_acceptance,
    auto_send_signed_confirmation_on_acceptance = excluded.auto_send_signed_confirmation_on_acceptance,
    confirmation_email_subject_template = excluded.confirmation_email_subject_template,
    confirmation_email_body_template = excluded.confirmation_email_body_template
  returning s.* into v_row;

  return to_jsonb(v_row);
end;
$$;

revoke execute on function public.upsert_owner_document_settings(uuid, jsonb) from public, anon;
grant execute on function public.upsert_owner_document_settings(uuid, jsonb) to authenticated, service_role;

commit;

-- ---------------------------------------------------------------------------
-- 3. Extend the automation-job type CHECK. The 125000 table declared the check
--    inline (auto-named owner_automation_jobs_job_type_check); we drop-if-exists
--    and re-add a superset that includes the two signed-offer job types and an
--    explicit, separately-retryable invoice_pdf_generate step. Existing rows keep
--    their (still-valid) types, so this is safe to (re)apply.
-- ---------------------------------------------------------------------------
begin;

alter table public.owner_automation_jobs drop constraint if exists owner_automation_jobs_job_type_check;
alter table public.owner_automation_jobs add constraint owner_automation_jobs_job_type_check
  check (job_type in (
    'invoice_create','invoice_issue','invoice_pdf_generate','invoice_send','invoice_email','offer_email',
    'signed_offer_certificate_generate','signed_offer_confirmation_email'));

-- The 125000 status CHECK already allows sent/failed/retrying/… ; add 'completed' for
-- generation-only jobs (certificate/pdf) that must NOT be falsely marked 'sent'.
alter table public.owner_automation_jobs drop constraint if exists owner_automation_jobs_status_check;
alter table public.owner_automation_jobs add constraint owner_automation_jobs_status_check
  check (status in ('pending','processing','sent','completed','failed','retrying','cancelled'));

-- Track the output document + the last-error timestamp explicitly (additive; nullable).
alter table public.owner_automation_jobs
  add column if not exists output_document_id uuid references public.owner_generated_documents(id) on delete set null,
  add column if not exists last_error_at timestamptz,
  add column if not exists completed_at timestamptz;

commit;

-- ---------------------------------------------------------------------------
-- 3b. owner_complete_automation_job — re-created to accept 'completed' as a
--     terminal generation-only state (alongside 'sent'), stamp completed_at /
--     last_error_at, and persist output_document_id. Retry/backoff logic is
--     byte-identical to 126000. Idempotent: a terminal job is never revived.
-- ---------------------------------------------------------------------------
begin;

-- Drop the 126000 five-arg version so the new six-arg (with output_document_id) version is
-- the ONLY overload — avoids call-time ambiguity when invoked with five positional args.
drop function if exists public.owner_complete_automation_job(uuid, text, text, text, int);

create or replace function public.owner_complete_automation_job(
  p_job_id uuid, p_status text, p_provider_message_id text default null,
  p_error text default null, p_retry_delay_seconds int default 60, p_output_document_id uuid default null)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare j record; v_status text; v_sched timestamptz; v_delay int;
begin
  if not public.request_is_service_role() then raise exception 'service role required'; end if;
  if p_status not in ('sent','completed','failed','retrying') then raise exception 'invalid completion status'; end if;

  select * into j from public.owner_automation_jobs where id = p_job_id for update;
  if j.id is null then raise exception 'job not found'; end if;
  -- Idempotent terminal state: never revive/duplicate a completed send/generation.
  if j.status in ('sent','completed') then
    return jsonb_build_object('id', j.id, 'status', j.status, 'idempotent', true);
  end if;

  v_status := p_status;
  v_sched := j.scheduled_at;
  if p_status = 'retrying' then
    if j.attempt_count >= j.max_attempts then
      v_status := 'failed';
    else
      -- exponential backoff: base * 2^(attempt-1), capped, with the passed floor.
      v_delay := greatest(coalesce(p_retry_delay_seconds, 60), 30) * power(2, greatest(j.attempt_count - 1, 0))::int;
      v_delay := least(v_delay, 3600);
      v_sched := now() + make_interval(secs => v_delay);
    end if;
  end if;

  update public.owner_automation_jobs
    set status = v_status,
        provider_message_id = coalesce(p_provider_message_id, provider_message_id),
        output_document_id = coalesce(p_output_document_id, output_document_id),
        sent_at = case when v_status = 'sent' then now() else sent_at end,
        completed_at = case when v_status in ('sent','completed') then now() else completed_at end,
        last_error = case when v_status in ('sent','completed') then null else left(coalesce(p_error, last_error), 400) end,
        last_error_at = case when v_status in ('sent','completed') then last_error_at else now() end,
        scheduled_at = v_sched,
        updated_at = now()
    where id = p_job_id;

  return jsonb_build_object('id', p_job_id, 'status', v_status, 'scheduled_at', v_sched);
end;
$$;

revoke execute on function public.owner_complete_automation_job(uuid, text, text, text, int, uuid) from public, anon, authenticated;
grant execute on function public.owner_complete_automation_job(uuid, text, text, text, int, uuid) to service_role;

commit;

-- ---------------------------------------------------------------------------
-- 4. owner_process_offer_acceptance — re-created to ALSO enqueue the signed
--    certificate + confirmation jobs. Body is the 125000 version plus a new block:
--    when a drawn signature was captured on the accepted event and the owner enabled
--    the setting, enqueue the certificate; the confirmation email is enqueued when
--    enabled (the worker generates the certificate first if it is not yet present,
--    so the confirmation can always attach it). Fully idempotent via the per-offer+
--    type dedupe key. Invoice logic is unchanged.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_process_offer_acceptance(p_offer_id uuid, p_accept_event uuid default null)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare o record; s record; e record; v_inv uuid; v_pre jsonb; v_email text; v_subject text;
  v_created boolean := false; v_has_signature boolean := false; v_cert_queued boolean := false; v_conf_queued boolean := false;
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

  -- The latest accepted event drives certificate eligibility (a signature must exist).
  select * into e from public.owner_offer_acceptance_events
    where offer_id = o.id and decision = 'accepted' order by event_order desc limit 1;
  v_has_signature := e.id is not null and coalesce(e.signature_storage_path,'') <> '' and coalesce(e.signature_sha256,'') <> '';

  -- (a) Create the invoice draft (default: on). Idempotent via converted_invoice_id.
  if coalesce(s.auto_create_invoice_on_acceptance, true) then
    if o.converted_invoice_id is not null then
      v_inv := o.converted_invoice_id;
    else
      if o.status = 'accepted' then
        v_inv := public.owner_convert_offer_internal(o.id);
        v_created := true;
        insert into public.owner_finance_notifications (business_entity_id, category, title, body, resource_type, resource_id, amount_cents, priority)
        values (o.business_entity_id, 'invoice_created', 'Rechnung automatisch erstellt',
          'Zu ' || coalesce(o.offer_number,'') || ' wurde ein Rechnungsentwurf erstellt.', 'owner_invoices', v_inv, o.gross_total_cents, 'normal');
      end if;
    end if;
  end if;

  -- (b) Signed acceptance certificate (default: on). Only when a signature was captured.
  if coalesce(s.auto_generate_signed_certificate_on_acceptance, true) and v_has_signature then
    perform public.owner_enqueue_automation_job(o.business_entity_id, 'signed_offer_certificate_generate',
      o.id, null, coalesce(p_accept_event, e.id), v_email, 'Annahmebestätigung ' || coalesce(o.offer_number,''), '{}'::jsonb);
    v_cert_queued := true;
  end if;

  -- (c) Premium confirmation email (default: on). Needs a recipient email; the worker
  --     ensures the certificate exists before attaching it.
  if coalesce(s.auto_send_signed_confirmation_on_acceptance, true) and coalesce(v_email,'') <> '' then
    perform public.owner_enqueue_automation_job(o.business_entity_id, 'signed_offer_confirmation_email',
      o.id, null, coalesce(p_accept_event, e.id), v_email,
      'Ihre Annahme des Angebots ' || coalesce(o.offer_number,'') || ' wurde bestätigt', '{}'::jsonb);
    v_conf_queued := true;
  end if;

  -- (d) Invoice issue + send are only queued when preflight passes AND the owner enabled them.
  if (v_pre->>'ok')::boolean then
    if coalesce(s.auto_issue_invoice_on_acceptance, false) and v_inv is not null then
      perform public.owner_enqueue_automation_job(o.business_entity_id, 'invoice_issue', o.id, v_inv, p_accept_event, v_email, v_subject, '{}'::jsonb);
    end if;
    if coalesce(s.auto_send_invoice_on_acceptance, false) and v_inv is not null then
      perform public.owner_enqueue_automation_job(o.business_entity_id, 'invoice_send', o.id, v_inv, p_accept_event, v_email, v_subject, '{}'::jsonb);
    end if;
  else
    insert into public.owner_finance_notifications (business_entity_id, category, title, body, resource_type, resource_id, amount_cents, priority)
    values (o.business_entity_id, 'automation_attention', 'Automatisierung benötigt Aufmerksamkeit',
      'Die Rechnung zu ' || coalesce(o.offer_number,'') || ' konnte nicht automatisch versendet werden (fehlende Angaben).',
      'owner_offers', o.id, o.gross_total_cents, 'high');
  end if;

  return jsonb_build_object('processed', true, 'invoice_id', v_inv, 'invoice_created', v_created,
    'certificate_queued', v_cert_queued, 'confirmation_queued', v_conf_queued, 'preflight', v_pre);
end;
$$;

revoke execute on function public.owner_process_offer_acceptance(uuid, uuid) from public, anon;
grant execute on function public.owner_process_offer_acceptance(uuid, uuid) to authenticated, service_role;

commit;

-- ---------------------------------------------------------------------------
-- 5. owner_worker_certificate_context — curated projection for building the signed
--    acceptance certificate PDF + confirmation email from TRUSTED server data. It
--    reads from the IMMUTABLE finalized snapshot for offer content and from the
--    acceptance event for the signature evidence. It DOES return the private
--    signature storage path — but ONLY to the service-role worker, which fetches the
--    PNG to embed it; the path is never surfaced to a customer/anon caller. Tokens,
--    token hashes and secrets are never returned.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_worker_certificate_context(p_offer_id uuid, p_accept_event uuid default null)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare o record; s record; e record; v_ver record; so jsonb; v_gross bigint; v_currency text;
begin
  if not public.request_is_service_role() then raise exception 'service role required'; end if;
  select * into o from public.owner_offers where id = p_offer_id;
  if o.id is null then raise exception 'offer not found'; end if;
  select * into s from public.owner_document_settings where business_entity_id = o.business_entity_id;
  select * into v_ver from public.owner_offer_versions where offer_id = o.id order by version desc limit 1;
  so := coalesce(v_ver.snapshot->'offer', to_jsonb(o));

  if p_accept_event is not null then
    select * into e from public.owner_offer_acceptance_events where id = p_accept_event;
  end if;
  if e.id is null then
    select * into e from public.owner_offer_acceptance_events
      where offer_id = o.id and decision = 'accepted' order by event_order desc limit 1;
  end if;
  if e.id is null then raise exception 'no accepted event'; end if;

  v_gross := coalesce(e.accepted_gross_cents, o.gross_total_cents);
  v_currency := coalesce(e.currency, o.currency, 'EUR');

  return jsonb_build_object(
    'business_entity_id', o.business_entity_id,
    'offer_id', o.id,
    'acceptance_event_id', e.id,
    'offer', jsonb_build_object(
      'offer_number', coalesce(so->>'offer_number', o.offer_number),
      'title', coalesce(so->>'title', o.title),
      'issue_date', coalesce(so->>'issue_date', o.issue_date::text),
      'currency', v_currency,
      'gross_total_cents', v_gross,
      'document_version', e.document_version,
      'source_hash', e.source_hash,
      'terms_version', e.accepted_terms_version),
    'signer', jsonb_build_object(
      'name', e.signer_name, 'company', e.signer_company, 'email', e.signer_email, 'role', e.signer_role),
    'recipient', jsonb_build_object(
      'company', coalesce(so->>'recipient_company', o.recipient_company),
      'email', coalesce(nullif(trim(o.recipient_email),''), s.business_email),
      'salutation', coalesce(so->>'recipient_salutation', o.recipient_salutation),
      'title', coalesce(so->>'recipient_title', o.recipient_title),
      'first_name', coalesce(so->>'recipient_first_name', o.recipient_first_name),
      'last_name', coalesce(so->>'recipient_last_name', o.recipient_last_name),
      'greeting_name', coalesce(so->>'recipient_greeting_name', o.recipient_greeting_name)),
    'signature', jsonb_build_object(
      'level', e.signature_level,
      'sha256', e.signature_sha256,
      'storage_path', e.signature_storage_path,   -- worker-only; fetched to embed the PNG
      'bytes', null,
      'accepted_at', e.created_at,
      'user_agent', e.user_agent_summary,
      'ip_hash_present', (coalesce(e.ip_hash,'') <> '')),
    'seller', jsonb_build_object(
      'legal_name', coalesce(s.legal_name,''), 'owner_name', s.owner_name,
      'street', s.street, 'postal_code', s.postal_code, 'city', s.city, 'country_code', coalesce(s.country_code,'DE'),
      'email', s.business_email, 'phone', s.business_phone, 'website', s.website,
      'vat_id', s.vat_id, 'tax_number', s.tax_number),
    'templates', jsonb_build_object(
      'subject', s.confirmation_email_subject_template, 'body', s.confirmation_email_body_template));
end;
$$;

revoke execute on function public.owner_worker_certificate_context(uuid, uuid) from public, anon, authenticated;
grant execute on function public.owner_worker_certificate_context(uuid, uuid) to service_role;

commit;

-- ---------------------------------------------------------------------------
-- 6. owner_worker_register_certificate — register the generated certificate PDF as
--    a SIGNED offer document in the private finance-document registry. Dedupes on
--    (source=owner_offers, source_id=offer, document_type='offer', signed='true') so
--    retries never create a second certificate AND it never collides with the
--    finalized (unsigned) offer PDF. Registering it makes signed_document_available
--    true with NO change to public_offer_by_token. Service-role only.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_worker_register_certificate(
  p_entity uuid, p_offer_id uuid, p_acceptance_event_id uuid, p_document_number text,
  p_currency text, p_source_hash text, p_signature_sha256 text, p_storage_path text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id uuid; v_version int; v_existing record; v_meta jsonb;
begin
  if not public.request_is_service_role() then raise exception 'service role required'; end if;

  select * into v_existing from public.owner_generated_documents
    where source_resource_type = 'owner_offers' and source_resource_id = p_offer_id
      and document_type = 'offer' and status = 'finalized' and render_metadata->>'signed' = 'true'
    order by version desc limit 1;
  if v_existing.id is not null then
    return jsonb_build_object('document_id', v_existing.id, 'version', v_existing.version, 'idempotent', true);
  end if;

  v_meta := jsonb_build_object(
    'signed', true, 'certificate_type', 'offer_acceptance', 'offer_id', p_offer_id,
    'acceptance_event_id', p_acceptance_event_id, 'source_hash', p_source_hash,
    'signature_sha256', p_signature_sha256, 'via', 'automation-worker');

  select coalesce(max(version),0)+1 into v_version from public.owner_generated_documents
    where source_resource_type = 'owner_offers' and source_resource_id = p_offer_id;
  insert into public.owner_generated_documents (business_entity_id, document_type, source_resource_type, source_resource_id,
    document_number, version, status, language, currency, template_version, source_hash, pdf_storage_path, render_metadata, finalized_at)
  values (p_entity, 'offer', 'owner_offers', p_offer_id, p_document_number, v_version,
    'finalized', 'de', coalesce(p_currency,'EUR'), 'acceptance-certificate-v1', p_source_hash,
    p_storage_path, v_meta, now())
  returning id into v_id;
  return jsonb_build_object('document_id', v_id, 'version', v_version, 'idempotent', false);
end;
$$;

revoke execute on function public.owner_worker_register_certificate(uuid, uuid, uuid, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.owner_worker_register_certificate(uuid, uuid, uuid, text, text, text, text, text) to service_role;

commit;

-- ---------------------------------------------------------------------------
-- 7. owner_retry_automation_job — OWNER-gated retry/enqueue for the dashboard retry
--    actions. It re-arms an existing (offer, job_type) job to 'retrying' due now, or
--    creates it if missing (e.g. a certificate that was never queued because the
--    setting was off at acceptance time). It resets the attempt budget so an
--    exhausted job can run again. Never executes the sensitive operation itself — the
--    secure worker does — so nothing runs in the browser. Owner-only.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_retry_automation_job(p_offer_id uuid, p_job_type text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare o record; s record; v_email text; v_subject text; v_id uuid; v_key text; e record;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  if p_job_type not in (
    'invoice_create','invoice_issue','invoice_pdf_generate','invoice_send','invoice_email',
    'signed_offer_certificate_generate','signed_offer_confirmation_email') then
    raise exception 'unsupported job type';
  end if;
  select * into o from public.owner_offers where id = p_offer_id;
  if o.id is null then raise exception 'offer not found'; end if;

  select * into s from public.owner_document_settings where business_entity_id = o.business_entity_id;
  v_email := coalesce(nullif(trim(o.recipient_email),''), s.business_email);
  v_key := p_offer_id::text || ':' || p_job_type;

  select * into e from public.owner_offer_acceptance_events
    where offer_id = o.id and decision = 'accepted' order by event_order desc limit 1;
  v_subject := case p_job_type
    when 'signed_offer_confirmation_email' then 'Ihre Annahme des Angebots ' || coalesce(o.offer_number,'') || ' wurde bestätigt'
    when 'signed_offer_certificate_generate' then 'Annahmebestätigung ' || coalesce(o.offer_number,'')
    else coalesce(nullif(s.invoice_email_subject_template,''), 'Ihre Rechnung zu Angebot ' || coalesce(o.offer_number,'')) end;

  insert into public.owner_automation_jobs (business_entity_id, job_type, offer_id, invoice_id, acceptance_event_id,
    recipient_email, subject, dedupe_key, status, scheduled_at, attempt_count, last_error)
  values (o.business_entity_id, p_job_type, o.id, o.converted_invoice_id, e.id, v_email, v_subject, v_key,
    'retrying', now(), 0, null)
  on conflict (dedupe_key) do update set
    status = 'retrying', scheduled_at = now(), attempt_count = 0, last_error = null,
    max_attempts = greatest(public.owner_automation_jobs.max_attempts, public.owner_automation_jobs.attempt_count + 3),
    updated_at = now()
  returning id into v_id;

  return jsonb_build_object('job_id', v_id, 'job_type', p_job_type, 'status', 'retrying');
end;
$$;

revoke execute on function public.owner_retry_automation_job(uuid, text) from public, anon;
grant execute on function public.owner_retry_automation_job(uuid, text) to authenticated, service_role;

commit;

-- ---------------------------------------------------------------------------
-- 8. owner_offer_acceptance_summary — re-created to ALSO surface the signed
--    certificate document (id, version, storage path, generated timestamp). Body is
--    the 125000 version plus the certificate lookup + a richer job projection
--    (attempt/scheduled/error timestamps). Owner-only; never exposed to anon.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_offer_acceptance_summary(p_offer_id uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare o record; e record; inv record; cert record; v_jobs jsonb;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  select * into o from public.owner_offers where id = p_offer_id;
  if o.id is null then raise exception 'offer not found'; end if;

  select * into e from public.owner_offer_acceptance_events
    where offer_id = p_offer_id and decision = 'accepted' order by event_order desc limit 1;
  select * into inv from public.owner_invoices where id = o.converted_invoice_id;
  select * into cert from public.owner_generated_documents
    where source_resource_type='owner_offers' and source_resource_id=p_offer_id
      and document_type='offer' and status='finalized' and render_metadata->>'signed'='true'
    order by version desc limit 1;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', j.id, 'job_type', j.job_type, 'status', j.status, 'attempt_count', j.attempt_count,
    'max_attempts', j.max_attempts, 'last_error', j.last_error, 'last_error_at', j.last_error_at,
    'provider_message_id', j.provider_message_id, 'scheduled_at', j.scheduled_at,
    'sent_at', j.sent_at, 'completed_at', j.completed_at, 'updated_at', j.updated_at) order by j.created_at), '[]'::jsonb)
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
    'certificate', case when cert.id is null then null else jsonb_build_object(
      'document_id', cert.id, 'version', cert.version, 'storage_path', cert.pdf_storage_path,
      'document_number', cert.document_number, 'generated_at', cert.finalized_at) end,
    'automation_jobs', v_jobs
  );
end;
$$;

revoke execute on function public.owner_offer_acceptance_summary(uuid) from public, anon;
grant execute on function public.owner_offer_acceptance_summary(uuid) to authenticated, service_role;

commit;

-- ---------------------------------------------------------------------------
-- 9. SECURE SUPABASE CRON SCHEDULING (documented + guarded; a NO-OP in local tests).
--
-- The automation worker (send-offer-document-email Edge Function) is invoked every
-- minute by pg_cron + pg_net. The Function URL and the WORKER_SECRET are read from
-- Supabase Vault — NEVER hard-coded in SQL. The block below is fully guarded: it only
-- acts when pg_cron + pg_net + vault exist AND both secrets are present in vault, so it
-- is a NO-OP in the throwaway migration-test database (which has none of them) and does
-- not schedule anything automatically. Run the operator SQL (see below / the README) in
-- the Supabase SQL Editor to actually create the schedule.
--
--   -- One-time: store the secrets in Vault (Dashboard: SQL Editor).
--   select vault.create_secret('https://<ref>.supabase.co/functions/v1/send-offer-document-email',
--                              'automation_worker_url');
--   select vault.create_secret('<the WORKER_SECRET value>', 'automation_worker_secret');
--
--   -- Create the every-minute schedule (idempotent — unschedule first if it exists):
--   select cron.unschedule('cogniiq-automation-worker')
--     where exists (select 1 from cron.job where jobname = 'cogniiq-automation-worker');
--   select cron.schedule('cogniiq-automation-worker', '* * * * *', $cron$
--     select net.http_post(
--       url     := (select decrypted_secret from vault.decrypted_secrets where name='automation_worker_url'),
--       headers := jsonb_build_object(
--         'content-type','application/json',
--         'x-worker-secret',(select decrypted_secret from vault.decrypted_secrets where name='automation_worker_secret')),
--       body    := '{}'::jsonb) as request_id;
--   $cron$);
--
--   -- Inspect the schedule:            select * from cron.job where jobname='cogniiq-automation-worker';
--   -- Inspect recent runs:             select * from cron.job_run_details
--   --                                    where jobid=(select jobid from cron.job where jobname='cogniiq-automation-worker')
--   --                                    order by start_time desc limit 20;
--   -- Pause (remove) the schedule:     select cron.unschedule('cogniiq-automation-worker');
--   -- Recreate the schedule:           re-run the cron.schedule(...) call above.
-- ---------------------------------------------------------------------------
-- Every relation reference that might not exist (vault.*, cron.*, net.*) is inside an
-- EXECUTE string so it is only PLANNED when the guarded schemas are actually present —
-- otherwise the whole block would fail to plan in a database without Vault/pg_cron.
do $$
declare v_has_url boolean := false; v_has_secret boolean := false;
begin
  if not (exists (select 1 from pg_extension where extname = 'pg_cron')
      and exists (select 1 from pg_extension where extname = 'pg_net')
      and exists (select 1 from information_schema.schemata where schema_name = 'vault')) then
    return;  -- NO-OP: local tests / any DB without Vault + pg_cron + pg_net.
  end if;
  execute $q$ select exists (select 1 from vault.decrypted_secrets where name = 'automation_worker_url') $q$ into v_has_url;
  execute $q$ select exists (select 1 from vault.decrypted_secrets where name = 'automation_worker_secret') $q$ into v_has_secret;
  if not (v_has_url and v_has_secret) then
    return;  -- NO-OP until an operator stores both secrets in Vault.
  end if;
  execute $q$ select cron.unschedule('cogniiq-automation-worker')
    where exists (select 1 from cron.job where jobname = 'cogniiq-automation-worker') $q$;
  execute $q$ select cron.schedule('cogniiq-automation-worker', '* * * * *', $cron$
    select net.http_post(
      url     := (select decrypted_secret from vault.decrypted_secrets where name='automation_worker_url'),
      headers := jsonb_build_object(
        'content-type','application/json',
        'x-worker-secret',(select decrypted_secret from vault.decrypted_secrets where name='automation_worker_secret')),
      body    := '{}'::jsonb) as request_id;
  $cron$) $q$;
end
$$;
