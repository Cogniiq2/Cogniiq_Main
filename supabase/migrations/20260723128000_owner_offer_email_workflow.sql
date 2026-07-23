-- =============================================================================
-- Owner OFFER-EMAIL send workflow — the secure, owner-triggered path that replaces
-- the old browser `mailto:` behavior of the "Angebot versenden" dialog with a
-- genuine production-grade Resend send driven by the durable automation worker.
--
-- ADDITIVE migration. It does NOT modify any previously applied migration file
-- (including 20260723125000 / 126000 / 127000). It only adds:
--   * owner_enqueue_offer_email — an AUTHENTICATED, OWNER-ONLY RPC that enqueues (or
--     re-arms) exactly one durable `offer_email` job for a sendable offer. It never
--     mints or exposes the raw portal token, never sets the offer status to 'sent',
--     validates + normalizes the recipient email, stores the editable subject/message
--     in a safe job payload, uses a stable + versioned dedupe key so an explicit resend
--     preserves prior SENT jobs as historical evidence, and re-arms a failed job safely;
--   * owner_worker_mark_offer_sent — a SERVICE-ROLE-only helper the worker calls ONLY
--     after Resend confirms acceptance, to advance finalized/viewed offers to 'sent'
--     (idempotent; never downgrades accepted/converted/etc.);
--   * owner_worker_revoke_offer_token — a SERVICE-ROLE-only helper so the worker can
--     revoke the freshly minted token if a send fails (no orphaned active tokens, and
--     a retry always mints a fresh one → never multiple active tokens unintentionally).
--
-- The offer status becomes 'sent' ONLY after a successful provider send, and ONLY from
-- the worker. The enqueue RPC never touches offer status. Every function here uses
-- explicit grants/revokes. No secret, raw token, or storage path is ever returned to a
-- public/anon/authenticated caller.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. owner_enqueue_offer_email — owner-only durable enqueue for the dashboard
--    "E-Mail jetzt senden" action. The sensitive work (mint token, Resend send)
--    runs ONLY in the worker, never in the browser. The business entity is always
--    derived from the offer itself — an arbitrary entity id is never accepted.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_enqueue_offer_email(
  p_offer_id uuid, p_recipient_email text default null,
  p_subject text default null, p_message text default null)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare o record; s record; v_email text; v_norm text; v_subject text; v_message text;
  v_existing record; v_id uuid; v_status text; v_key text; v_version int; v_payload jsonb;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;

  -- Verify the offer exists; the entity is taken from the offer (never a parameter).
  select * into o from public.owner_offers where id = p_offer_id;
  if o.id is null then raise exception 'offer not found'; end if;

  -- Sending is only appropriate for a finalized/sent/viewed offer. Draft, cancelled,
  -- rejected, expired, accepted and converted offers are rejected (resend inappropriate).
  if o.status not in ('finalized','sent','viewed') then
    raise exception 'offer is not in a sendable state (status=%)', o.status;
  end if;

  select * into s from public.owner_document_settings where business_entity_id = o.business_entity_id;

  -- Resolve + validate + normalize the recipient. Explicit recipient wins, then the
  -- offer's stored recipient, then the seller's business email as a last resort.
  v_email := coalesce(nullif(trim(p_recipient_email), ''), nullif(trim(o.recipient_email), ''), s.business_email);
  if v_email is null or trim(v_email) = '' then raise exception 'a recipient email is required'; end if;
  v_norm := lower(trim(v_email));
  if v_norm !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'invalid recipient email'; end if;

  -- Editable subject/message from the dialog are stored in a SAFE job payload. The body
  -- retains its formatting here and is HTML-ESCAPED in the worker before rendering.
  v_subject := nullif(trim(coalesce(p_subject, '')), '');
  v_message := nullif(p_message, '');
  v_payload := jsonb_strip_nulls(jsonb_build_object('subject', v_subject, 'message', v_message, 'source', 'owner_dashboard'));

  -- Inspect the most recent offer_email job for this offer.
  select * into v_existing from public.owner_automation_jobs
    where offer_id = o.id and job_type = 'offer_email' order by created_at desc limit 1;

  if v_existing.id is not null and v_existing.status in ('pending','processing','retrying') then
    -- Already queued / in-flight: refresh the editable payload + recipient, never duplicate.
    update public.owner_automation_jobs
      set recipient_email = v_norm, subject = coalesce(v_subject, subject), payload = v_payload, updated_at = now()
      where id = v_existing.id;
    return jsonb_build_object('job_id', v_existing.id, 'status', v_existing.status, 'reused', true);
  elsif v_existing.id is not null and v_existing.status in ('failed','cancelled') then
    -- Re-arm the failed/cancelled job in place (preserve its history/version).
    update public.owner_automation_jobs
      set status = 'retrying', scheduled_at = now(), attempt_count = 0, last_error = null, last_error_at = null,
          max_attempts = greatest(max_attempts, attempt_count + 3),
          recipient_email = v_norm, subject = coalesce(v_subject, subject), payload = v_payload,
          provider_message_id = null, updated_at = now()
      where id = v_existing.id
      returning id, status into v_id, v_status;
    return jsonb_build_object('job_id', v_id, 'status', v_status, 'rearmed', true);
  end if;

  -- Either no prior job, or the prior job already SENT/completed (explicit resend). Create a
  -- NEW versioned attempt so prior SENT jobs are preserved as historical evidence. The dedupe
  -- key is stable per (offer, version): offerId:offer_email:<version>.
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
$$;

revoke execute on function public.owner_enqueue_offer_email(uuid, text, text, text) from public, anon;
grant execute on function public.owner_enqueue_offer_email(uuid, text, text, text) to authenticated, service_role;

commit;

-- ---------------------------------------------------------------------------
-- 2. owner_worker_mark_offer_sent — service-role-only. Advances a finalized/viewed
--    offer to 'sent' ONLY after the worker confirms a successful provider send.
--    Idempotent (an already-'sent' offer is unchanged) and never downgrades an
--    accepted/converted/rejected/expired/cancelled offer.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_worker_mark_offer_sent(p_offer_id uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare o record;
begin
  if not public.request_is_service_role() then raise exception 'service role required'; end if;
  select * into o from public.owner_offers where id = p_offer_id for update;
  if o.id is null then raise exception 'offer not found'; end if;
  if o.status in ('finalized','viewed') then
    update public.owner_offers set status = 'sent', updated_at = now() where id = p_offer_id;
    return jsonb_build_object('offer_id', p_offer_id, 'status', 'sent', 'changed', true);
  end if;
  -- Already 'sent', or in a later lifecycle state → leave untouched.
  return jsonb_build_object('offer_id', p_offer_id, 'status', o.status, 'changed', false);
end;
$$;

revoke execute on function public.owner_worker_mark_offer_sent(uuid) from public, anon, authenticated;
grant execute on function public.owner_worker_mark_offer_sent(uuid) to service_role;

commit;

-- ---------------------------------------------------------------------------
-- 3. owner_worker_revoke_offer_token — service-role-only. Revokes a freshly minted
--    offer access token when a send fails, so a failed offer email never leaves an
--    active token behind and a subsequent retry mints a fresh one (never multiple
--    active tokens unintentionally). Only its hash was ever stored; this just stamps
--    revoked_at. Idempotent.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_worker_revoke_offer_token(p_token_id uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id uuid;
begin
  if not public.request_is_service_role() then raise exception 'service role required'; end if;
  update public.owner_document_access_tokens
    set revoked_at = now()
    where id = p_token_id and revoked_at is null
    returning id into v_id;
  return jsonb_build_object('token_id', p_token_id, 'revoked', v_id is not null);
end;
$$;

revoke execute on function public.owner_worker_revoke_offer_token(uuid) from public, anon, authenticated;
grant execute on function public.owner_worker_revoke_offer_token(uuid) to service_role;

commit;
