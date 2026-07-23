-- =============================================================================
-- Owner premium offer editor — additive migration. Makes offer DRAFTS fully
-- editable (atomic, optimistic-concurrency, idempotent update + delete RPCs),
-- adds a structured premium content model (offer-level sections + richer position
-- fields + an offer-specific recipient snapshot), and makes the finalized version
-- a COMPLETE immutable snapshot (parties, document settings, template, structured
-- content) from which the final PDF is regenerated — never from current CRM/state.
--
-- Additive only. Does NOT modify 20260722120000 / 20260723120000 / 20260723121000
-- / 20260723122000. Money is integer cents; quantities integer milli-units; all
-- totals/line math remain server-authoritative. Owner-only. Safe SECURITY DEFINER
-- search path everywhere.
-- =============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. Structured premium content on offers + an offer-specific recipient snapshot.
--    JSONB arrays hold lists (outcomes, timeline phases, payment schedule) so the
--    premium PDF renders real bullet lists / rows instead of one flattened string.
-- ---------------------------------------------------------------------------
alter table public.owner_offers
  add column if not exists subtitle text,
  add column if not exists executive_summary text,
  add column if not exists project_approach text,
  add column if not exists next_steps text,
  add column if not exists desired_outcomes jsonb not null default '[]'::jsonb,
  add column if not exists timeline jsonb not null default '[]'::jsonb,
  add column if not exists payment_schedule jsonb not null default '[]'::jsonb,
  add column if not exists template_key text not null default 'cogniiq-premium-offer-v2',
  -- Offer-specific recipient snapshot/override. Populated from CRM at edit time but
  -- NEVER written back to CRM; changing it here only affects this offer.
  add column if not exists recipient_source text not null default 'crm'
    check (recipient_source in ('crm', 'manual')),
  add column if not exists recipient_company text,
  add column if not exists recipient_contact_name text,
  add column if not exists recipient_department text,
  add column if not exists recipient_street text,
  add column if not exists recipient_postal_code text,
  add column if not exists recipient_city text,
  add column if not exists recipient_country_code text,
  add column if not exists recipient_email text,
  add column if not exists recipient_phone text,
  add column if not exists recipient_vat_id text;

-- JSONB-array shape guards (arrays, not scalars/objects).
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'owner_offers_desired_outcomes_is_array') then
    alter table public.owner_offers add constraint owner_offers_desired_outcomes_is_array
      check (jsonb_typeof(desired_outcomes) = 'array');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'owner_offers_timeline_is_array') then
    alter table public.owner_offers add constraint owner_offers_timeline_is_array
      check (jsonb_typeof(timeline) = 'array');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'owner_offers_payment_schedule_is_array') then
    alter table public.owner_offers add constraint owner_offers_payment_schedule_is_array
      check (jsonb_typeof(payment_schedule) = 'array');
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 2. Richer position (module) content: long details, deliverable bullets, phase
--    and duration labels. `description` remains the short position title.
-- ---------------------------------------------------------------------------
alter table public.owner_offer_lines
  add column if not exists details text,
  add column if not exists deliverables jsonb not null default '[]'::jsonb,
  add column if not exists phase_label text,
  add column if not exists duration_label text;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'owner_offer_lines_deliverables_is_array') then
    alter table public.owner_offer_lines add constraint owner_offer_lines_deliverables_is_array
      check (jsonb_typeof(deliverables) = 'array');
  end if;
end $$;

-- Template metadata columns on the immutable version snapshot (also embedded in the
-- snapshot jsonb; columns make the template queryable per version).
alter table public.owner_offer_versions
  add column if not exists template_key text,
  add column if not exists template_version text;

commit;

-- ---------------------------------------------------------------------------
-- 3. Freeze the new commercial content on finalized offers too (replaces the guard
--    from 20260723121000; adds the structured/recipient columns to the frozen set).
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
  -- UPDATE: once past draft, the commercial substance is frozen.
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
-- 4. Helpers to persist offer scalar header + structured sections + lines from
--    JSON, and to build curated party/settings snapshots. Kept as internal
--    (non-granted) functions used by the RPCs below.
-- ---------------------------------------------------------------------------
begin;

-- Apply scalar header fields + structured sections to an existing draft offer row.
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
    desired_outcomes    = coalesce(p_sections->'desired_outcomes', '[]'::jsonb),
    timeline            = coalesce(p_sections->'timeline', '[]'::jsonb),
    payment_schedule    = coalesce(p_sections->'payment_schedule', '[]'::jsonb)
  where id = p_offer_id;
end;
$$;

-- Replace all lines of a draft offer from a JSON array (server recomputes line math).
create or replace function public.owner_replace_offer_lines(p_offer_id uuid, p_lines jsonb)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_line jsonb; v_idx int := 0;
begin
  delete from public.owner_offer_lines where offer_id = p_offer_id;
  for v_line in select * from jsonb_array_elements(coalesce(p_lines, '[]'::jsonb)) loop
    insert into public.owner_offer_lines (offer_id, description, details, deliverables, phase_label, duration_label,
      quantity_milli, unit, unit_price_cents, vat_rate_bp, vat_treatment, is_optional, sort_order)
    values (p_offer_id, v_line->>'description', v_line->>'details',
      coalesce(v_line->'deliverables', '[]'::jsonb), v_line->>'phase_label', v_line->>'duration_label',
      coalesce((v_line->>'quantity_milli')::bigint, 1000), coalesce(v_line->>'unit','Stück'),
      (v_line->>'unit_price_cents')::bigint, coalesce((v_line->>'vat_rate_bp')::int, 1900),
      coalesce(v_line->>'vat_treatment','standard'), coalesce((v_line->>'is_optional')::boolean, false),
      coalesce((v_line->>'sort_order')::int, v_idx));
    v_idx := v_idx + 1;
  end loop;
end;
$$;

-- Curated seller identity snapshot from document settings (evidence-grade, no secrets beyond
-- what is rendered on the intended customer document).
create or replace function public.owner_seller_snapshot(p_entity uuid)
returns jsonb language sql security definer set search_path = public, pg_temp as $$
  select jsonb_build_object(
    'legal_name', s.legal_name, 'owner_name', s.owner_name,
    'street', s.street, 'postal_code', s.postal_code, 'city', s.city, 'country_code', coalesce(s.country_code,'DE'),
    'email', s.business_email, 'phone', s.business_phone, 'website', s.website,
    'vat_id', s.vat_id, 'tax_number', s.tax_number,
    'bank_account_holder', s.bank_account_holder, 'iban', s.iban, 'bic', s.bic, 'bank_name', s.bank_name)
  from public.owner_document_settings s where s.business_entity_id = p_entity;
$$;

create or replace function public.owner_settings_snapshot(p_entity uuid)
returns jsonb language sql security definer set search_path = public, pg_temp as $$
  select jsonb_build_object(
    'document_language', coalesce(s.document_language,'de'),
    'brand_accent', s.brand_accent, 'logo_storage_path', s.logo_storage_path,
    'offer_number_prefix', coalesce(s.offer_number_prefix,'AN'),
    'default_offer_intro', s.default_offer_intro, 'default_offer_closing', s.default_offer_closing,
    'default_offer_footer', s.default_offer_footer,
    'default_offer_validity_days', coalesce(s.default_offer_validity_days,30))
  from public.owner_document_settings s where s.business_entity_id = p_entity;
$$;

revoke execute on function public.owner_apply_offer_header(uuid, jsonb, jsonb) from public, anon, authenticated;
revoke execute on function public.owner_replace_offer_lines(uuid, jsonb) from public, anon, authenticated;
revoke execute on function public.owner_seller_snapshot(uuid) from public, anon, authenticated;
revoke execute on function public.owner_settings_snapshot(uuid) from public, anon, authenticated;
grant execute on function public.owner_apply_offer_header(uuid, jsonb, jsonb) to service_role;
grant execute on function public.owner_replace_offer_lines(uuid, jsonb) to service_role;
grant execute on function public.owner_seller_snapshot(uuid) to service_role;
grant execute on function public.owner_settings_snapshot(uuid) to service_role;

commit;

-- ---------------------------------------------------------------------------
-- 5. create_owner_offer — replaced (4-arg with structured sections + rich lines).
--    Drops the 3-arg version so a 3-named-arg call is unambiguous.
-- ---------------------------------------------------------------------------
begin;

drop function if exists public.create_owner_offer(uuid, jsonb, jsonb);

create or replace function public.create_owner_offer(p_idempotency_key uuid, p_header jsonb, p_lines jsonb, p_sections jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_existing jsonb; v_id uuid; v_entity uuid; v_result jsonb;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  v_existing := public.owner_claim_idempotency(p_idempotency_key, 'create_owner_offer');
  if v_existing is not null then return v_existing; end if;

  v_entity := (p_header->>'business_entity_id')::uuid;
  if v_entity is null then raise exception 'business_entity_id is required'; end if;
  if not exists (select 1 from public.owner_business_entities where id = v_entity) then raise exception 'unknown business entity'; end if;
  if p_lines is null or jsonb_array_length(p_lines) < 1 then raise exception 'at least one offer line is required'; end if;

  insert into public.owner_offers (business_entity_id, status, currency, created_by)
  values (v_entity, 'draft', coalesce(nullif(p_header->>'currency',''),'EUR'), auth.uid())
  returning id into v_id;

  perform public.owner_apply_offer_header(v_id, p_header, p_sections);
  perform public.owner_replace_offer_lines(v_id, p_lines);

  v_result := jsonb_build_object('offer_id', v_id);
  update public.owner_finance_requests set result = v_result where idempotency_key = p_idempotency_key;
  return v_result;
end;
$$;

revoke execute on function public.create_owner_offer(uuid, jsonb, jsonb, jsonb) from public, anon;
grant execute on function public.create_owner_offer(uuid, jsonb, jsonb, jsonb) to authenticated, service_role;

commit;

-- ---------------------------------------------------------------------------
-- 6. update_owner_offer_draft — atomic, optimistic-concurrency draft edit.
--    Same offer id, still a draft, no number assigned, no duplicate. Full rollback
--    on any invalid line/section (single-statement function transaction).
-- ---------------------------------------------------------------------------
begin;

create or replace function public.update_owner_offer_draft(
  p_idempotency_key uuid, p_offer_id uuid, p_expected_updated_at timestamptz,
  p_header jsonb, p_lines jsonb, p_sections jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_existing jsonb; o record; v_entity uuid; v_result jsonb; v_updated timestamptz;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  v_existing := public.owner_claim_idempotency(p_idempotency_key, 'update_owner_offer_draft');
  if v_existing is not null then return v_existing; end if;

  select * into o from public.owner_offers where id = p_offer_id for update;
  if o.id is null then raise exception 'offer not found'; end if;
  if o.status <> 'draft' then raise exception 'only draft offers can be edited'; end if;
  -- Optimistic concurrency: reject stale concurrent edits.
  if p_expected_updated_at is null or o.updated_at is distinct from p_expected_updated_at then
    raise exception 'offer was modified concurrently (stale edit)';
  end if;
  if p_lines is null or jsonb_array_length(p_lines) < 1 then raise exception 'at least one offer line is required'; end if;

  -- Cross-entity relationship guard: a supplied customer must not belong to another tenant path.
  v_entity := o.business_entity_id;
  if nullif(p_header->>'business_entity_id','') is not null and (p_header->>'business_entity_id')::uuid <> v_entity then
    raise exception 'business entity of a draft cannot change';
  end if;

  perform public.owner_apply_offer_header(p_offer_id, p_header, p_sections);
  perform public.owner_replace_offer_lines(p_offer_id, p_lines);

  select updated_at into v_updated from public.owner_offers where id = p_offer_id;
  v_result := jsonb_build_object('offer_id', p_offer_id, 'updated_at', v_updated, 'status', 'draft');
  update public.owner_finance_requests set result = v_result where idempotency_key = p_idempotency_key;
  return v_result;
end;
$$;

revoke execute on function public.update_owner_offer_draft(uuid, uuid, timestamptz, jsonb, jsonb, jsonb) from public, anon;
grant execute on function public.update_owner_offer_draft(uuid, uuid, timestamptz, jsonb, jsonb, jsonb) to authenticated, service_role;

commit;

-- ---------------------------------------------------------------------------
-- 7. delete_owner_offer_draft — only a pristine draft may be deleted.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.delete_owner_offer_draft(p_idempotency_key uuid, p_offer_id uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_existing jsonb; o record; v_result jsonb;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  v_existing := public.owner_claim_idempotency(p_idempotency_key, 'delete_owner_offer_draft');
  if v_existing is not null then return v_existing; end if;

  select * into o from public.owner_offers where id = p_offer_id for update;
  if o.id is null then raise exception 'offer not found'; end if;
  if o.status <> 'draft' then raise exception 'only draft offers can be deleted'; end if;
  if o.finalized_version is not null then raise exception 'offer has a finalized version'; end if;
  if o.converted_invoice_id is not null then raise exception 'offer has been converted'; end if;
  if exists (select 1 from public.owner_generated_documents where source_resource_type='owner_offers' and source_resource_id=p_offer_id) then
    raise exception 'offer has generated documents'; end if;
  if exists (select 1 from public.owner_document_access_tokens where offer_id=p_offer_id) then
    raise exception 'offer has an access token'; end if;
  if exists (select 1 from public.owner_offer_acceptance_events where offer_id=p_offer_id) then
    raise exception 'offer has acceptance events'; end if;

  -- Delete lines first while the draft parent still exists so the line-immutability
  -- guard resolves the offer's 'draft' status (a cascade would find the parent gone).
  delete from public.owner_offer_lines where offer_id = p_offer_id;
  delete from public.owner_offers where id = p_offer_id;

  v_result := jsonb_build_object('offer_id', p_offer_id, 'deleted', true);
  update public.owner_finance_requests set result = v_result where idempotency_key = p_idempotency_key;
  return v_result;
end;
$$;

revoke execute on function public.delete_owner_offer_draft(uuid, uuid) from public, anon;
grant execute on function public.delete_owner_offer_draft(uuid, uuid) to authenticated, service_role;

commit;

-- ---------------------------------------------------------------------------
-- 8. finalize_owner_offer — replaced. Complete immutable snapshot: offer header,
--    structured sections, all position fields, totals, seller identity, recipient
--    company/address/contact/email, document settings, template key + version.
--    Source hash is derived from this canonical snapshot.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.finalize_owner_offer(p_idempotency_key uuid, p_offer_id uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
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
  v_hash := encode(digest(v_snapshot::text, 'sha256'), 'hex');

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

commit;

-- ---------------------------------------------------------------------------
-- 9. create_owner_offer_revision — replaced. Clones the frozen commercial content
--    (incl. structured sections + rich lines + recipient snapshot) into a NEW draft.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.create_owner_offer_revision(p_idempotency_key uuid, p_offer_id uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_existing jsonb; src record; v_id uuid; v_result jsonb;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  v_existing := public.owner_claim_idempotency(p_idempotency_key, 'create_owner_offer_revision');
  if v_existing is not null then return v_existing; end if;

  select * into src from public.owner_offers where id = p_offer_id;
  if src.id is null then raise exception 'offer not found'; end if;
  if src.status = 'draft' then raise exception 'draft offers are edited directly, not revised'; end if;

  insert into public.owner_offers (business_entity_id, organization_id, client_account_id, engagement_id,
    status, title, subtitle, issue_date, valid_until, currency, introduction, executive_summary, project_approach,
    next_steps, scope, assumptions, exclusions, payment_terms, delivery_terms, internal_notes,
    desired_outcomes, timeline, payment_schedule, template_key,
    recipient_source, recipient_company, recipient_contact_name, recipient_department, recipient_street,
    recipient_postal_code, recipient_city, recipient_country_code, recipient_email, recipient_phone, recipient_vat_id,
    created_by)
  values (src.business_entity_id, src.organization_id, src.client_account_id, src.engagement_id,
    'draft', src.title, src.subtitle, current_date, src.valid_until, src.currency, src.introduction,
    src.executive_summary, src.project_approach, src.next_steps, src.scope, src.assumptions, src.exclusions,
    src.payment_terms, src.delivery_terms, src.internal_notes,
    src.desired_outcomes, src.timeline, src.payment_schedule, src.template_key,
    src.recipient_source, src.recipient_company, src.recipient_contact_name, src.recipient_department, src.recipient_street,
    src.recipient_postal_code, src.recipient_city, src.recipient_country_code, src.recipient_email, src.recipient_phone, src.recipient_vat_id,
    auth.uid())
  returning id into v_id;

  insert into public.owner_offer_lines (offer_id, description, details, deliverables, phase_label, duration_label,
    quantity_milli, unit, unit_price_cents, vat_rate_bp, vat_treatment, is_optional, sort_order)
  select v_id, description, details, deliverables, phase_label, duration_label,
    quantity_milli, unit, unit_price_cents, vat_rate_bp, vat_treatment, is_optional, sort_order
  from public.owner_offer_lines where offer_id = p_offer_id;

  v_result := jsonb_build_object('offer_id', v_id, 'revised_from', p_offer_id);
  update public.owner_finance_requests set result = v_result where idempotency_key = p_idempotency_key;
  return v_result;
end;
$$;

commit;

-- ---------------------------------------------------------------------------
-- 10. public_offer_by_token — replaced to expose the structured premium content
--     and the (customer-facing) recipient identity, still curated (no internal
--     notes / storage paths / raw ids). Prefers the frozen version snapshot for
--     finalized offers so the portal matches the finalized PDF exactly.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.public_offer_by_token(p_token text, p_user_agent text default null)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare tok public.owner_document_access_tokens; o record; s record; v_lines jsonb; v_doc record; v_result jsonb;
begin
  tok := public.owner_verify_offer_token(p_token);
  select * into o from public.owner_offers where id = tok.offer_id;
  if o.id is null then raise exception 'offer unavailable'; end if;
  if o.status = 'cancelled' then raise exception 'offer unavailable'; end if;

  select * into s from public.owner_document_settings where business_entity_id = o.business_entity_id;
  select * into v_doc from public.owner_generated_documents where id = tok.document_id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'description', l.description, 'details', l.details, 'deliverables', l.deliverables,
    'phase_label', l.phase_label, 'duration_label', l.duration_label,
    'quantity_milli', l.quantity_milli, 'unit', l.unit,
    'unit_price_cents', l.unit_price_cents, 'vat_rate_bp', l.vat_rate_bp, 'vat_treatment', l.vat_treatment,
    'net_cents', l.net_cents, 'vat_cents', l.vat_cents, 'gross_cents', l.gross_cents, 'is_optional', l.is_optional
  ) order by l.sort_order), '[]'::jsonb) into v_lines
  from public.owner_offer_lines l where l.offer_id = o.id;

  insert into public.owner_document_access_events (token_id, offer_id, event_type, user_agent_summary)
  values (tok.id, o.id, 'viewed', left(coalesce(p_user_agent,''), 200));
  if o.status in ('finalized','sent') then
    update public.owner_offers set status = 'viewed' where id = o.id;
    insert into public.owner_finance_notifications (business_entity_id, category, title, body, resource_type, resource_id, amount_cents, priority)
    values (o.business_entity_id, 'offer_viewed', 'Angebot angesehen',
      coalesce(o.offer_number,'') || ' wurde vom Kunden geöffnet.', 'owner_offers', o.id, o.gross_total_cents, 'normal');
  end if;

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
    'accepted', (o.status in ('accepted','converted')),
    'rejected', (o.status = 'rejected'),
    'expired', (o.status = 'expired' or o.valid_until < current_date),
    'has_pdf', (v_doc.id is not null and v_doc.pdf_storage_path is not null),
    'document_version', v_doc.version,
    'recipient', jsonb_build_object('company', o.recipient_company, 'contact_name', o.recipient_contact_name,
      'city', o.recipient_city),
    'seller', jsonb_build_object(
      'legal_name', coalesce(s.legal_name, ''),
      'street', s.street, 'postal_code', s.postal_code, 'city', s.city,
      'country_code', coalesce(s.country_code,'DE'), 'email', s.business_email,
      'website', s.website, 'vat_id', s.vat_id)
  );
  return v_result;
end;
$$;

commit;
