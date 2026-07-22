-- =============================================================================
-- Owner AUTOMATION WORKER — server-authoritative primitives for the production
-- automation-job worker Edge Function (send-offer-document-email).
--
-- ADDITIVE migration. It does NOT modify any previously applied migration file
-- (including 20260723125000). It only adds service-role-only SECURITY DEFINER
-- functions the worker needs:
--   * atomic job claiming (FOR UPDATE SKIP LOCKED) so two concurrent worker runs
--     can never process the same job;
--   * an idempotent internal invoice ISSUE (final number + status, immutable),
--     mirroring issue_owner_invoice's checks minus the interactive owner gate;
--   * an idempotent internal invoice CREATE (delegates to owner_convert_offer_internal);
--   * a curated worker CONTEXT projection for building the invoice email + PDF
--     (never returns tokens, storage paths or secrets);
--   * a curated OFFER context + a fresh secure-link minter (raw token returned once,
--     only its hash stored — the hash-only security model is preserved and no raw
--     token is ever persisted in the automation-job table);
--   * a document REGISTER for the generated invoice PDF (private finance bucket);
--   * a job COMPLETE transition with bounded exponential retry scheduling.
--
-- All monetary math + numbering remain server-authoritative. Every function here is
-- service-role only (the worker authenticates itself separately with WORKER_SECRET).
-- pgcrypto is referenced schema-qualified (extensions.*), as established in 124000.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. owner_claim_automation_jobs — atomically claim a bounded batch. Rows are
--    locked with FOR UPDATE SKIP LOCKED and transitioned to 'processing' with an
--    incremented attempt_count in the SAME statement, so a second concurrent worker
--    skips them entirely. Only due (scheduled_at <= now) pending/retrying jobs under
--    their attempt cap are eligible. Returns the claimed rows (curated).
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_claim_automation_jobs(p_limit int default 10, p_types text[] default null)
returns setof jsonb language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public.request_is_service_role() then raise exception 'service role required'; end if;
  return query
  with claimable as (
    select j.id
    from public.owner_automation_jobs j
    where j.status in ('pending','retrying')
      and j.attempt_count < j.max_attempts
      and j.scheduled_at <= now()
      and (p_types is null or j.job_type = any(p_types))
    order by j.scheduled_at
    limit greatest(1, least(coalesce(p_limit, 10), 50))
    for update skip locked
  )
  update public.owner_automation_jobs j
    set status = 'processing', attempt_count = j.attempt_count + 1, updated_at = now()
  from claimable c
  where j.id = c.id
  returning jsonb_build_object(
    'id', j.id, 'job_type', j.job_type, 'business_entity_id', j.business_entity_id,
    'offer_id', j.offer_id, 'invoice_id', j.invoice_id, 'acceptance_event_id', j.acceptance_event_id,
    'recipient_email', j.recipient_email, 'subject', j.subject,
    'attempt_count', j.attempt_count, 'max_attempts', j.max_attempts, 'payload', j.payload);
end;
$$;

revoke execute on function public.owner_claim_automation_jobs(int, text[]) from public, anon, authenticated;
grant execute on function public.owner_claim_automation_jobs(int, text[]) to service_role;

commit;

-- ---------------------------------------------------------------------------
-- 2. owner_complete_automation_job — the ONLY place a job leaves 'processing'.
--    Idempotent: a job already 'sent' is never overwritten. 'retrying' schedules a
--    bounded exponential backoff and is coerced to 'failed' once the attempt cap is
--    reached. Never records tokens/secrets/bytes.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_complete_automation_job(
  p_job_id uuid, p_status text, p_provider_message_id text default null,
  p_error text default null, p_retry_delay_seconds int default 60)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare j record; v_status text; v_sched timestamptz; v_delay int;
begin
  if not public.request_is_service_role() then raise exception 'service role required'; end if;
  if p_status not in ('sent','failed','retrying') then raise exception 'invalid completion status'; end if;

  select * into j from public.owner_automation_jobs where id = p_job_id for update;
  if j.id is null then raise exception 'job not found'; end if;
  -- Idempotent terminal state: never revive/duplicate a completed send.
  if j.status = 'sent' then
    return jsonb_build_object('id', j.id, 'status', 'sent', 'idempotent', true);
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
        sent_at = case when v_status = 'sent' then now() else sent_at end,
        last_error = case when v_status = 'sent' then null else left(coalesce(p_error, last_error), 400) end,
        scheduled_at = v_sched,
        updated_at = now()
    where id = p_job_id;

  return jsonb_build_object('id', p_job_id, 'status', v_status, 'scheduled_at', v_sched);
end;
$$;

revoke execute on function public.owner_complete_automation_job(uuid, text, text, text, int) from public, anon, authenticated;
grant execute on function public.owner_complete_automation_job(uuid, text, text, text, int) to service_role;

commit;

-- ---------------------------------------------------------------------------
-- 3. owner_ensure_offer_invoice_internal — idempotent invoice creation for an
--    accepted offer (delegates to the existing server-authoritative conversion).
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_ensure_offer_invoice_internal(p_offer_id uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare o record; v_inv uuid;
begin
  if not public.request_is_service_role() then raise exception 'service role required'; end if;
  select * into o from public.owner_offers where id = p_offer_id;
  if o.id is null then raise exception 'offer not found'; end if;
  if o.converted_invoice_id is not null then
    return jsonb_build_object('invoice_id', o.converted_invoice_id, 'idempotent', true);
  end if;
  v_inv := public.owner_convert_offer_internal(p_offer_id);
  return jsonb_build_object('invoice_id', v_inv, 'idempotent', false);
end;
$$;

revoke execute on function public.owner_ensure_offer_invoice_internal(uuid) from public, anon, authenticated;
grant execute on function public.owner_ensure_offer_invoice_internal(uuid) to service_role;

commit;

-- ---------------------------------------------------------------------------
-- 4. owner_issue_invoice_internal — idempotent, server-authoritative invoice
--    finalization for the worker. Runs the same preflight + numbering as
--    issue_owner_invoice, minus the interactive owner gate (service-role only).
--    Assigns the final number, sets status='issued', persists immutable data. A
--    validation failure RAISEs so the worker records it and does NOT mark sent.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_issue_invoice_internal(p_invoice_id uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare inv record; v_lines int; v_unknown int; v_number text; v_next bigint;
begin
  if not public.request_is_service_role() then raise exception 'service role required'; end if;
  select * into inv from public.owner_invoices where id = p_invoice_id for update;
  if inv.id is null then raise exception 'invoice not found'; end if;
  -- Idempotent: an already-issued invoice keeps its number and status.
  if inv.status <> 'draft' then
    return jsonb_build_object('invoice_id', p_invoice_id, 'invoice_number', inv.invoice_number, 'status', inv.status, 'idempotent', true);
  end if;

  -- Complete invoice preflight before issuing.
  if inv.issue_date is null then raise exception 'issue_date is required'; end if;
  if inv.service_date is null and inv.service_period_start is null then raise exception 'service date or period is required'; end if;
  if inv.due_date is null then raise exception 'due_date is required'; end if;
  if inv.currency not in ('EUR','CHF','USD') then raise exception 'unsupported currency %', inv.currency; end if;
  select count(*), count(*) filter (where vat_treatment = 'unknown') into v_lines, v_unknown
    from public.owner_invoice_lines where invoice_id = p_invoice_id;
  if v_lines < 1 then raise exception 'invoice has no lines'; end if;
  if v_unknown > 0 then raise exception 'invoice has unresolved VAT treatments'; end if;
  if inv.net_total_cents <= 0 or inv.gross_total_cents <= 0 then raise exception 'invoice totals must be positive'; end if;

  v_number := inv.invoice_number;
  if v_number is null or trim(v_number) = '' then
    insert into public.owner_invoice_counters (business_entity_id) values (inv.business_entity_id) on conflict (business_entity_id) do nothing;
    select next_number into v_next from public.owner_invoice_counters where business_entity_id = inv.business_entity_id for update;
    v_number := 'RE-' || to_char(inv.issue_date, 'YYYY') || '-' || lpad(v_next::text, 4, '0');
    update public.owner_invoice_counters set next_number = v_next + 1, updated_at = now() where business_entity_id = inv.business_entity_id;
  end if;

  update public.owner_invoices set invoice_number = v_number, status = 'issued', issued_at = now() where id = p_invoice_id;
  return jsonb_build_object('invoice_id', p_invoice_id, 'invoice_number', v_number, 'status', 'issued', 'idempotent', false);
end;
$$;

revoke execute on function public.owner_issue_invoice_internal(uuid) from public, anon, authenticated;
grant execute on function public.owner_issue_invoice_internal(uuid) to service_role;

commit;

-- ---------------------------------------------------------------------------
-- 5. owner_worker_invoice_context — curated projection for building the invoice
--    email + PDF from TRUSTED server data. Includes seller identity + bank details
--    (which belong on an invoice), the invoice + lines, and the recipient resolved
--    from the linked offer. NEVER returns tokens, token hashes, storage paths or
--    service-role internals.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_worker_invoice_context(p_invoice_id uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare inv record; o record; s record; v_lines jsonb;
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
      'email', coalesce(nullif(trim(o.recipient_email),''), s.business_email),
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
$$;

revoke execute on function public.owner_worker_invoice_context(uuid) from public, anon, authenticated;
grant execute on function public.owner_worker_invoice_context(uuid) to service_role;

commit;

-- ---------------------------------------------------------------------------
-- 6. owner_worker_offer_context + owner_worker_mint_offer_link — offer_email
--    support. Context is served from the immutable snapshot. The link minter creates
--    a fresh secure token (only its SHA-256 hash is stored) and returns the raw token
--    ONCE so the worker can build the EXACT /d/<token> portal URL in memory. No raw
--    token is ever persisted in the automation-job table.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_worker_offer_context(p_offer_id uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare o record; s record; v_ver record; so jsonb;
begin
  if not public.request_is_service_role() then raise exception 'service role required'; end if;
  select * into o from public.owner_offers where id = p_offer_id;
  if o.id is null then raise exception 'offer not found'; end if;
  select * into s from public.owner_document_settings where business_entity_id = o.business_entity_id;
  select * into v_ver from public.owner_offer_versions where offer_id = o.id order by version desc limit 1;
  so := coalesce(v_ver.snapshot->'offer', to_jsonb(o));
  return jsonb_build_object(
    'business_entity_id', o.business_entity_id,
    'offer_number', coalesce(so->>'offer_number', o.offer_number),
    'valid_until', coalesce(so->>'valid_until', o.valid_until::text),
    'recipient', jsonb_build_object(
      'company', so->>'recipient_company', 'email', coalesce(nullif(trim(o.recipient_email),''), s.business_email),
      'salutation', so->>'recipient_salutation', 'title', so->>'recipient_title',
      'first_name', so->>'recipient_first_name', 'last_name', so->>'recipient_last_name', 'greeting_name', so->>'recipient_greeting_name'),
    'seller', jsonb_build_object('legal_name', coalesce(s.legal_name,''), 'email', s.business_email),
    'templates', jsonb_build_object('subject', s.default_offer_intro, 'body', s.default_offer_closing));
end;
$$;

create or replace function public.owner_worker_mint_offer_link(p_offer_id uuid, p_valid_days int default 30)
returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare o record; v_raw text; v_hash text; v_id uuid;
begin
  if not public.request_is_service_role() then raise exception 'service role required'; end if;
  select * into o from public.owner_offers where id = p_offer_id;
  if o.id is null then raise exception 'offer not found'; end if;
  if o.status = 'draft' then raise exception 'finalize the offer before minting a link'; end if;
  v_raw := encode(extensions.gen_random_bytes(32), 'hex');
  v_hash := encode(extensions.digest(convert_to(v_raw, 'UTF8'), 'sha256'::text), 'hex');
  insert into public.owner_document_access_tokens (business_entity_id, offer_id, token_hash, expires_at, max_uses)
  values (o.business_entity_id, o.id, v_hash, now() + make_interval(days => greatest(1, p_valid_days)), 20)
  returning id into v_id;
  -- Raw token returned ONCE; only its hash is stored. Never persisted in a job row.
  return jsonb_build_object('token', v_raw, 'token_id', v_id, 'offer_id', o.id);
end;
$$;

revoke execute on function public.owner_worker_offer_context(uuid) from public, anon, authenticated;
revoke execute on function public.owner_worker_mint_offer_link(uuid, int) from public, anon, authenticated;
grant execute on function public.owner_worker_offer_context(uuid) to service_role;
grant execute on function public.owner_worker_mint_offer_link(uuid, int) to service_role;

commit;

-- ---------------------------------------------------------------------------
-- 7. owner_worker_register_document — register the generated invoice PDF in the
--    private finance-document registry (service-role; no interactive owner gate).
--    Idempotent per (source, type): returns the existing finalized doc if present.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_worker_register_document(
  p_entity uuid, p_document_type text, p_source_resource_type text, p_source_resource_id uuid,
  p_document_number text, p_currency text, p_template_version text, p_source_hash text,
  p_storage_path text, p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id uuid; v_version int; v_existing record;
begin
  if not public.request_is_service_role() then raise exception 'service role required'; end if;
  select * into v_existing from public.owner_generated_documents
    where source_resource_type = p_source_resource_type and source_resource_id = p_source_resource_id
      and document_type = p_document_type and status = 'finalized'
    order by version desc limit 1;
  if v_existing.id is not null then
    return jsonb_build_object('document_id', v_existing.id, 'version', v_existing.version, 'idempotent', true);
  end if;
  select coalesce(max(version),0)+1 into v_version from public.owner_generated_documents
    where source_resource_type = p_source_resource_type and source_resource_id = p_source_resource_id;
  insert into public.owner_generated_documents (business_entity_id, document_type, source_resource_type, source_resource_id,
    document_number, version, status, language, currency, template_version, source_hash, pdf_storage_path, render_metadata, finalized_at)
  values (p_entity, p_document_type, p_source_resource_type, p_source_resource_id, p_document_number, v_version,
    'finalized', 'de', coalesce(p_currency,'EUR'), coalesce(p_template_version,'invoice-worker-v1'), p_source_hash,
    p_storage_path, coalesce(p_metadata,'{}'::jsonb), now())
  returning id into v_id;
  return jsonb_build_object('document_id', v_id, 'version', v_version, 'idempotent', false);
end;
$$;

revoke execute on function public.owner_worker_register_document(uuid, text, text, uuid, text, text, text, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.owner_worker_register_document(uuid, text, text, uuid, text, text, text, text, text, jsonb) to service_role;

commit;
