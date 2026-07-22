-- =============================================================================
-- Owner document settings — business identity & document defaults for generated
-- offers and invoices. Additive migration; does NOT modify the applied
-- 20260722120000_owner_finance_cockpit.sql. Owner-only (public.is_platform_owner),
-- RLS-gated, updated_at maintained, append-only audit via the existing factory.
--
-- Bank/tax identifiers live here so they can be rendered onto intended customer
-- documents, but they are NEVER publicly readable: RLS restricts the row to the
-- platform owner, and the public offer portal exposes only a curated projection
-- (see 20260723122000_owner_commercial_documents.sql). No online-banking
-- credentials or provider secrets are stored here.
-- =============================================================================

begin;

create table if not exists public.owner_document_settings (
  business_entity_id uuid primary key references public.owner_business_entities(id) on delete cascade,
  -- Identity
  legal_name text,
  owner_name text,
  street text,
  postal_code text,
  city text,
  country_code text not null default 'DE' check (country_code ~ '^[A-Z]{2}$'),
  business_email text check (business_email is null or business_email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  business_phone text,
  website text,
  -- Tax
  tax_number text,
  vat_id text,
  -- Bank (owner-only; rendered onto invoices as payment info)
  bank_account_holder text,
  iban text check (iban is null or iban ~ '^[A-Z]{2}[0-9]{2}[A-Z0-9]{10,30}$'),
  bic text check (bic is null or bic ~ '^[A-Z0-9]{8}([A-Z0-9]{3})?$'),
  bank_name text,
  -- Document defaults
  default_payment_terms_days int not null default 14 check (default_payment_terms_days between 0 and 365),
  default_offer_validity_days int not null default 30 check (default_offer_validity_days between 1 and 365),
  default_invoice_footer text,
  default_offer_footer text,
  default_offer_intro text,
  default_offer_closing text,
  invoice_number_prefix text not null default 'RE' check (invoice_number_prefix ~ '^[A-Z0-9-]{1,8}$'),
  offer_number_prefix text not null default 'AN' check (offer_number_prefix ~ '^[A-Z0-9-]{1,8}$'),
  document_language text not null default 'de' check (document_language in ('de', 'en')),
  logo_storage_path text,
  brand_accent text check (brand_accent is null or brand_accent ~ '^#[0-9A-Fa-f]{6}$'),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.owner_document_settings is
  'Owner-only business identity and document defaults for generated offers/invoices. Bank/tax identifiers are RLS-restricted to the owner and only rendered onto intended customer documents. No secrets/credentials stored.';

-- updated_at maintenance (reuses public.set_updated_at from phase 0).
drop trigger if exists owner_document_settings_set_updated_at on public.owner_document_settings;
create trigger owner_document_settings_set_updated_at before update on public.owner_document_settings
  for each row execute function public.set_updated_at();

-- Append-only audit (reuses the existing security-definer factory).
drop trigger if exists owner_document_settings_audit on public.owner_document_settings;
create trigger owner_document_settings_audit
  after insert or update or delete on public.owner_document_settings
  for each row execute function public.owner_write_audit_row('owner_document_settings');

-- RLS: strictly owner-only.
alter table public.owner_document_settings enable row level security;
drop policy if exists owner_document_settings_owner_all on public.owner_document_settings;
create policy owner_document_settings_owner_all on public.owner_document_settings
  for all to authenticated
  using (public.is_platform_owner()) with check (public.is_platform_owner());
revoke all on table public.owner_document_settings from public, anon, authenticated;
grant select, insert, update on table public.owner_document_settings to authenticated;
grant select, insert, update, delete on table public.owner_document_settings to service_role;

-- Owner-only upsert RPC so the frontend never trusts a raw insert path and the
-- created_by/business_entity binding is server-authoritative.
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
    document_language, logo_storage_path, brand_accent, created_by)
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
    nullif(p_settings->>'brand_accent', ''), auth.uid())
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
    brand_accent = excluded.brand_accent
  returning s.* into v_row;

  return to_jsonb(v_row);
end;
$$;

revoke execute on function public.upsert_owner_document_settings(uuid, jsonb) from public, anon;
grant execute on function public.upsert_owner_document_settings(uuid, jsonb) to authenticated, service_role;

commit;
