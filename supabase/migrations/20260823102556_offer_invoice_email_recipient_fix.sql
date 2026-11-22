-- =============================================================================
-- PRODUCTION RECONCILIATION RECORD — DO NOT EDIT BELOW THE MARKER
-- =============================================================================
-- This migration was applied to the hosted production database OUTSIDE the
-- repository (ledger version 20260823102556) and is imported here so the repository
-- describes production truthfully. It is ALREADY APPLIED; nothing in this file
-- may be pushed again (the production migration workflow refuses any version
-- that is present in the remote history).
--
-- Everything after the BEGIN marker is the EXACT statement text recorded in
-- supabase_migrations.schema_migrations.statements for this version, byte for
-- byte. Verified read-only on 2026-11-22:
--   md5(applied statement)  = 1f874f3b251aa9d8ea9839cb1a44e57b
--   .github/scripts/test-production-reconciliation.mjs re-checks this hash.
-- Source history: branch claude/command-palette-topbar-tables, commits 5e196e9 + 02997ba (file 20260823120000_*.sql there; that file is NOT imported — its version was never applied).
-- See docs/ops/production-reconciliation-2026-11.md.
-- ==== BEGIN EXACT APPLIED STATEMENT ====
-- Recipient entered in the send dialog was silently discarded; a missing address mailed the seller.
-- See supabase/migrations/20260823120000_offer_invoice_email_recipient_fix.sql for full rationale.

drop function if exists public.owner_worker_offer_context(uuid);

create or replace function public.owner_worker_offer_context(
  p_offer_id uuid,
  p_recipient_override text default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare o record; s record; v_ver record; so jsonb; v_to text;
begin
  if not public.request_is_service_role() then raise exception 'service role required'; end if;
  select * into o from public.owner_offers where id = p_offer_id;
  if o.id is null then raise exception 'offer not found'; end if;
  select * into s from public.owner_document_settings where business_entity_id = o.business_entity_id;
  select * into v_ver from public.owner_offer_versions where offer_id = o.id order by version desc limit 1;
  so := coalesce(v_ver.snapshot->'offer', to_jsonb(o));

  v_to := coalesce(
    nullif(trim(p_recipient_override), ''),
    nullif(trim(o.recipient_email), '')
  );

  return jsonb_build_object(
    'business_entity_id', o.business_entity_id,
    'offer_number', coalesce(so->>'offer_number', o.offer_number),
    'valid_until', coalesce(so->>'valid_until', o.valid_until::text),
    'recipient', jsonb_build_object(
      'company', so->>'recipient_company', 'email', v_to,
      'salutation', so->>'recipient_salutation', 'title', so->>'recipient_title',
      'first_name', so->>'recipient_first_name', 'last_name', so->>'recipient_last_name',
      'greeting_name', so->>'recipient_greeting_name'),
    'seller', jsonb_build_object('legal_name', coalesce(s.legal_name,''), 'email', s.business_email),
    'templates', jsonb_build_object('subject', s.default_offer_intro, 'body', s.default_offer_closing));
end;
$function$;

revoke all on function public.owner_worker_offer_context(uuid, text) from public, anon, authenticated;
grant execute on function public.owner_worker_offer_context(uuid, text) to service_role;

drop function if exists public.owner_worker_invoice_context(uuid);

create or replace function public.owner_worker_invoice_context(
  p_invoice_id uuid,
  p_recipient_override text default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare inv record; o record; s record; v_lines jsonb; v_to text;
begin
  if not public.request_is_service_role() then raise exception 'service role required'; end if;
  select * into inv from public.owner_invoices where id = p_invoice_id;
  if inv.id is null then raise exception 'invoice not found'; end if;
  select * into o from public.owner_offers where converted_invoice_id = p_invoice_id;
  select * into s from public.owner_document_settings where business_entity_id = inv.business_entity_id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'description', l.description, 'quantity_milli', l.quantity_milli, 'unit_price_cents', l.unit_price_cents,
    'net_cents', l.net_cents, 'vat_rate_bp', l.vat_rate_bp, 'vat_cents', l.vat_cents, 'gross_cents', l.gross_cents
  ) order by l.sort_order), '[]'::jsonb) into v_lines
  from public.owner_invoice_lines l where l.invoice_id = p_invoice_id;

  v_to := coalesce(
    nullif(trim(p_recipient_override), ''),
    nullif(trim(o.recipient_email), '')
  );

  return jsonb_build_object(
    'business_entity_id', inv.business_entity_id,
    'offer_id', o.id,
    'invoice', jsonb_build_object(
      'id', inv.id, 'invoice_number', inv.invoice_number, 'status', inv.status,
      'issue_date', inv.issue_date, 'due_date', inv.due_date, 'currency', inv.currency,
      'net_total_cents', inv.net_total_cents, 'vat_total_cents', inv.vat_total_cents, 'gross_total_cents', inv.gross_total_cents),
    'lines', v_lines,
    'recipient', jsonb_build_object(
      'company', o.recipient_company, 'contact_name', o.recipient_contact_name,
      'email', v_to,
      'salutation', o.recipient_salutation, 'title', o.recipient_title,
      'first_name', o.recipient_first_name, 'last_name', o.recipient_last_name, 'greeting_name', o.recipient_greeting_name,
      'street', o.recipient_street, 'postal_code', o.recipient_postal_code, 'city', o.recipient_city,
      'country_code', coalesce(o.recipient_country_code,'DE')),
    'seller', jsonb_build_object(
      'legal_name', coalesce(s.legal_name,''), 'owner_name', s.owner_name,
      'street', s.street, 'postal_code', s.postal_code, 'city', s.city, 'country_code', coalesce(s.country_code,'DE'),
      'email', s.business_email, 'phone', s.business_phone, 'website', s.website,
      'vat_id', s.vat_id, 'tax_number', s.tax_number,
      'iban', s.iban, 'bic', s.bic, 'bank_name', s.bank_name, 'bank_account_holder', s.bank_account_holder),
    'templates', jsonb_build_object(
      'subject', s.invoice_email_subject_template, 'body', s.invoice_email_body_template));
end;
$function$;

revoke all on function public.owner_worker_invoice_context(uuid, text) from public, anon, authenticated;
grant execute on function public.owner_worker_invoice_context(uuid, text) to service_role;

create or replace function public.owner_enqueue_offer_email(
  p_offer_id uuid,
  p_recipient_email text default null,
  p_subject text default null,
  p_message text default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare o record; v_email text; v_norm text; v_subject text; v_message text;
  v_existing record; v_id uuid; v_status text; v_key text; v_version int; v_payload jsonb;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;

  select * into o from public.owner_offers where id = p_offer_id;
  if o.id is null then raise exception 'offer not found'; end if;

  if o.status not in ('finalized','sent','viewed') then
    raise exception 'offer is not in a sendable state (status=%)', o.status;
  end if;

  v_email := coalesce(nullif(trim(p_recipient_email), ''), nullif(trim(o.recipient_email), ''));
  if v_email is null or trim(v_email) = '' then
    raise exception 'a recipient email is required';
  end if;
  v_norm := lower(trim(v_email));
  if v_norm !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'invalid recipient email'; end if;

  v_subject := nullif(trim(coalesce(p_subject, '')), '');
  v_message := nullif(p_message, '');
  v_payload := jsonb_strip_nulls(jsonb_build_object('subject', v_subject, 'message', v_message, 'source', 'owner_dashboard'));

  select * into v_existing from public.owner_automation_jobs
    where offer_id = o.id and job_type = 'offer_email' order by created_at desc limit 1;

  if v_existing.id is not null and v_existing.status in ('pending','processing','retrying') then
    update public.owner_automation_jobs
      set recipient_email = v_norm, subject = coalesce(v_subject, subject), payload = v_payload, updated_at = now()
      where id = v_existing.id;
    return jsonb_build_object('job_id', v_existing.id, 'status', v_existing.status, 'reused', true);
  elsif v_existing.id is not null and v_existing.status in ('failed','cancelled') then
    update public.owner_automation_jobs
      set status = 'retrying', scheduled_at = now(), attempt_count = 0, last_error = null, last_error_at = null,
          max_attempts = greatest(max_attempts, attempt_count + 3),
          recipient_email = v_norm, subject = coalesce(v_subject, subject), payload = v_payload,
          provider_message_id = null, updated_at = now()
      where id = v_existing.id
      returning id, status into v_id, v_status;
    return jsonb_build_object('job_id', v_id, 'status', v_status, 'rearmed', true);
  end if;

  select coalesce(max(nullif(split_part(dedupe_key, ':', 3), '')::int), 0) + 1 into v_version
    from public.owner_automation_jobs where offer_id = o.id and job_type = 'offer_email';
  v_key := o.id::text || ':offer_email:' || v_version;

  insert into public.owner_automation_jobs (business_entity_id, job_type, offer_id, recipient_email, subject, dedupe_key, payload, status, scheduled_at)
  values (o.business_entity_id, 'offer_email', o.id, v_norm,
    coalesce(v_subject, 'Ihr persönliches Angebot ' || coalesce(o.offer_number, '')),
    v_key, v_payload, 'pending', now())
  returning id, status into v_id, v_status;

  return jsonb_build_object('job_id', v_id, 'status', v_status, 'version', v_version);
end;
$function$;

create or replace function public.owner_reap_stalled_automation_jobs(p_stale_minutes int default 15)
returns integer
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare v_count int;
begin
  if not public.request_is_service_role() then raise exception 'service role required'; end if;

  with reclaimed as (
    update public.owner_automation_jobs
       set status = case when attempt_count >= max_attempts then 'failed' else 'retrying' end,
           last_error = coalesce(last_error, 'worker stalled; job reclaimed'),
           last_error_at = now(),
           scheduled_at = now(),
           updated_at = now()
     where status = 'processing'
       and updated_at < now() - make_interval(mins => p_stale_minutes)
    returning 1
  )
  select count(*) into v_count from reclaimed;

  return v_count;
end;
$function$;

revoke all on function public.owner_reap_stalled_automation_jobs(int) from public, anon, authenticated;
grant execute on function public.owner_reap_stalled_automation_jobs(int) to service_role;

create or replace function public.owner_retry_automation_job_by_id(p_job_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare j record;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;

  select * into j from public.owner_automation_jobs where id = p_job_id;
  if j.id is null then raise exception 'job not found'; end if;

  if j.status not in ('failed','cancelled','retrying') then
    raise exception 'job is not retryable (status=%)', j.status;
  end if;

  update public.owner_automation_jobs
     set status = 'retrying',
         attempt_count = 0,
         max_attempts = greatest(max_attempts, attempt_count + 3),
         scheduled_at = now(),
         last_error = null,
         last_error_at = null,
         provider_message_id = null,
         updated_at = now()
   where id = p_job_id;

  return jsonb_build_object('job_id', p_job_id, 'status', 'retrying');
end;
$function$;

revoke all on function public.owner_retry_automation_job_by_id(uuid) from public, anon;
grant execute on function public.owner_retry_automation_job_by_id(uuid) to authenticated;