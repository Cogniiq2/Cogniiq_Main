-- =============================================================================
-- Owner premium offer RUNTIME HOTFIX — durable pgcrypto resolution for offer
-- finalization + secure customer links. Additive migration; does NOT modify any
-- previously applied migration.
--
-- Root cause: the offer/commercial-document SECURITY DEFINER functions call
-- pgcrypto (`gen_random_bytes`, `digest`) unqualified with `search_path = public,
-- pg_temp`. On Supabase, pgcrypto is installed in the `extensions` schema (never
-- `public`), so those calls fail at runtime with
--   "function gen_random_bytes(integer) does not exist"
-- and `digest(...)` is likewise unresolved. Offer finalization was manually
-- patched on the connected project; this migration makes the fix reproducible.
--
-- Fix: (1) ensure pgcrypto is available in the `extensions` schema; (2) re-create
-- the three affected functions to call pgcrypto EXPLICITLY schema-qualified
-- (extensions.gen_random_bytes / extensions.digest) with the bytea+typed-algorithm
-- signature, under a controlled search_path (public, extensions, pg_temp). Only the
-- pgcrypto resolution and search_path change — numbering, status transitions,
-- optimistic concurrency, snapshot contents, idempotency, audit, versioning,
-- revision behaviour and the secure-token security design are all unchanged, and
-- the same canonical snapshot still yields the same SHA-256 source hash.
-- =============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. Ensure pgcrypto is resolvable in the Supabase-compatible `extensions` schema.
--    Only CREATE it if not already installed anywhere — never silently MOVE an
--    already-installed extension between schemas (that could break other code).
-- ---------------------------------------------------------------------------
create schema if not exists extensions;

do $$
begin
  if not exists (select 1 from pg_extension where extname = 'pgcrypto') then
    execute 'create extension pgcrypto with schema extensions';
  end if;
end
$$;

-- Whatever schema pgcrypto lives in, the functions below reference it explicitly;
-- the search_path also lists `extensions` as defense-in-depth. Ensure the roles that
-- execute the SECURITY DEFINER functions can reach the schema.
grant usage on schema extensions to authenticated, anon, service_role;

commit;

-- ---------------------------------------------------------------------------
-- 2. finalize_owner_offer — durable, deterministic SHA-256 over the canonical
--    snapshot. Body is byte-for-byte identical to 20260723123000 EXCEPT the digest
--    call (now extensions.digest over the UTF-8 bytes) and the search_path.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.finalize_owner_offer(p_idempotency_key uuid, p_offer_id uuid)
returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare
  o record; v_existing jsonb; v_lines int; v_unknown int; v_prefix text; v_next bigint; v_number text;
  v_version int; v_snapshot jsonb; v_hash text; v_result jsonb; v_pay jsonb; v_pct_sum bigint; v_pct_count int;
  v_template_key text; v_template_version text := 'cogniiq-premium-offer-v2';
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  v_existing := public.owner_claim_idempotency(p_idempotency_key, 'finalize_owner_offer');
  if v_existing is not null then return v_existing; end if;

  select * into o from public.owner_offers where id = p_offer_id for update;
  if o.id is null then raise exception 'offer not found'; end if;
  if o.status <> 'draft' then raise exception 'only draft offers can be finalized'; end if;
  if o.issue_date is null then raise exception 'issue_date is required'; end if;
  if o.valid_until is null then raise exception 'valid_until is required'; end if;
  if coalesce(o.title, '') = '' then raise exception 'title is required'; end if;
  -- Seller postal identity must be resolved (evidence-grade snapshot).
  if not exists (select 1 from public.owner_document_settings s where s.business_entity_id = o.business_entity_id
      and coalesce(s.legal_name,'') <> '' and coalesce(s.street,'') <> '' and coalesce(s.city,'') <> '') then
    raise exception 'seller legal name and postal address are required (Dokument-Einstellungen)';
  end if;
  -- Recipient company + postal address must be resolved on the offer snapshot.
  if coalesce(o.recipient_company,'') = '' then raise exception 'recipient company is required'; end if;
  if coalesce(o.recipient_street,'') = '' or coalesce(o.recipient_city,'') = '' then
    raise exception 'recipient postal address is required'; end if;

  select count(*), count(*) filter (where vat_treatment = 'unknown')
    into v_lines, v_unknown from public.owner_offer_lines where offer_id = p_offer_id and is_optional = false;
  if v_lines < 1 then raise exception 'offer needs at least one non-optional line'; end if;
  if v_unknown > 0 then raise exception 'offer has unresolved VAT treatments'; end if;
  if o.gross_total_cents <= 0 then raise exception 'offer total must be positive'; end if;

  -- If a payment schedule uses percentages on every row, they must sum to 100 %.
  v_pay := o.payment_schedule;
  if jsonb_typeof(v_pay) = 'array' and jsonb_array_length(v_pay) > 0 then
    select count(*) filter (where e ? 'percentage_bp'), coalesce(sum((e->>'percentage_bp')::bigint),0)
      into v_pct_count, v_pct_sum from jsonb_array_elements(v_pay) e;
    if v_pct_count = jsonb_array_length(v_pay) and v_pct_sum <> 10000 then
      raise exception 'payment schedule percentages must sum to 100%% (got %.2f%%)', v_pct_sum / 100.0;
    end if;
  end if;

  select coalesce(offer_number_prefix, 'AN') into v_prefix from public.owner_document_settings where business_entity_id = o.business_entity_id;
  v_prefix := coalesce(v_prefix, 'AN');
  insert into public.owner_offer_counters (business_entity_id) values (o.business_entity_id) on conflict (business_entity_id) do nothing;
  select next_number into v_next from public.owner_offer_counters where business_entity_id = o.business_entity_id for update;
  v_number := v_prefix || '-' || to_char(o.issue_date, 'YYYY') || '-' || lpad(v_next::text, 4, '0');
  update public.owner_offer_counters set next_number = v_next + 1, updated_at = now() where business_entity_id = o.business_entity_id;

  v_version := 1;
  v_template_key := coalesce(o.template_key, 'cogniiq-premium-offer-v2');

  -- Canonical, complete snapshot. `o` is the pre-finalize row (draft), so it already
  -- carries the structured content + recipient snapshot. Seller/settings are curated.
  v_snapshot := jsonb_build_object(
    'offer', (to_jsonb(o) - 'internal_notes') || jsonb_build_object('offer_number', v_number, 'status', 'finalized', 'finalized_version', v_version),
    'lines', (select coalesce(jsonb_agg(to_jsonb(l) order by l.sort_order), '[]'::jsonb) from public.owner_offer_lines l where l.offer_id = p_offer_id),
    'seller', public.owner_seller_snapshot(o.business_entity_id),
    'recipient', jsonb_build_object(
      'company', o.recipient_company, 'contact_name', o.recipient_contact_name, 'department', o.recipient_department,
      'street', o.recipient_street, 'postal_code', o.recipient_postal_code, 'city', o.recipient_city,
      'country_code', coalesce(o.recipient_country_code,'DE'), 'email', o.recipient_email, 'phone', o.recipient_phone,
      'vat_id', o.recipient_vat_id),
    'document_settings', public.owner_settings_snapshot(o.business_entity_id),
    'totals', jsonb_build_object('net_cents', o.net_total_cents, 'vat_cents', o.vat_total_cents, 'gross_cents', o.gross_total_cents),
    'template_key', v_template_key,
    'template_version', v_template_version,
    'offer_number', v_number,
    'version', v_version);
  -- Deterministic SHA-256 over the canonical snapshot text (UTF-8 bytes), pgcrypto
  -- explicitly schema-qualified so it resolves under Supabase's extensions schema.
  v_hash := encode(extensions.digest(convert_to(v_snapshot::text, 'UTF8'), 'sha256'::text), 'hex');

  update public.owner_offers
    set offer_number = v_number, status = 'finalized', finalized_version = v_version
    where id = p_offer_id;

  insert into public.owner_offer_versions (offer_id, version, offer_number, snapshot, source_hash, finalized_by, template_key, template_version)
  values (p_offer_id, v_version, v_number, v_snapshot, v_hash, auth.uid(), v_template_key, v_template_version);

  v_result := jsonb_build_object('offer_id', p_offer_id, 'offer_number', v_number, 'version', v_version, 'source_hash', v_hash);
  update public.owner_finance_requests set result = v_result where idempotency_key = p_idempotency_key;
  return v_result;
end;
$$;

revoke execute on function public.finalize_owner_offer(uuid, uuid) from public, anon;
grant execute on function public.finalize_owner_offer(uuid, uuid) to authenticated, service_role;

commit;

-- ---------------------------------------------------------------------------
-- 3. create_offer_access_token — strong random token, hash-only storage. pgcrypto
--    explicitly schema-qualified. Security design unchanged: >= 32 secure random
--    bytes, raw token returned ONCE, only the SHA-256 hash stored, scoped to one
--    finalized offer, expiry + max-uses retained, owner-only.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.create_offer_access_token(p_offer_id uuid, p_document_id uuid default null, p_valid_days int default 30, p_max_uses int default 20)
returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare o record; v_raw text; v_hash text; v_id uuid;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  select * into o from public.owner_offers where id = p_offer_id;
  if o.id is null then raise exception 'offer not found'; end if;
  if o.status = 'draft' then raise exception 'finalize the offer before creating a link'; end if;

  -- 32 cryptographically secure random bytes, hex-encoded (URL-safe) → returned once.
  v_raw := encode(extensions.gen_random_bytes(32), 'hex');
  -- Store ONLY the SHA-256 hash (bytea input, explicitly typed algorithm — no ambiguity).
  v_hash := encode(extensions.digest(convert_to(v_raw, 'UTF8'), 'sha256'::text), 'hex');
  insert into public.owner_document_access_tokens (business_entity_id, offer_id, document_id, token_hash, expires_at, max_uses, created_by)
  values (o.business_entity_id, p_offer_id, p_document_id, v_hash, now() + make_interval(days => greatest(1, p_valid_days)), greatest(1, p_max_uses), auth.uid())
  returning id into v_id;

  return jsonb_build_object('token', v_raw, 'token_id', v_id, 'offer_id', p_offer_id, 'expires_days', greatest(1, p_valid_days));
end;
$$;

revoke execute on function public.create_offer_access_token(uuid, uuid, int, int) from public, anon;
grant execute on function public.create_offer_access_token(uuid, uuid, int, int) to authenticated, service_role;

commit;

-- ---------------------------------------------------------------------------
-- 4. owner_verify_offer_token — same SHA-256 hashing so a raw token resolves to its
--    stored hash. Internal-only (not granted to anon/authenticated); returns the
--    verified token row to trusted SECURITY DEFINER callers. Unknown/revoked/expired
--    tokens are rejected exactly as before.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_verify_offer_token(p_token text)
returns public.owner_document_access_tokens language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare v_hash text; tok public.owner_document_access_tokens;
begin
  if p_token is null or length(p_token) < 32 then raise exception 'invalid token'; end if;
  v_hash := encode(extensions.digest(convert_to(p_token, 'UTF8'), 'sha256'::text), 'hex');
  select * into tok from public.owner_document_access_tokens where token_hash = v_hash;
  if tok.id is null then raise exception 'invalid token'; end if;
  if tok.revoked_at is not null then raise exception 'token revoked'; end if;
  if tok.expires_at <= now() then raise exception 'token expired'; end if;
  return tok;
end;
$$;

revoke execute on function public.owner_verify_offer_token(text) from public, anon, authenticated;
grant execute on function public.owner_verify_offer_token(text) to service_role;

commit;
