-- =============================================================================
-- Owner commercial documents — generated PDF registry, secure public access
-- tokens (hash-only), offer acceptance evidence, and owner notifications.
-- Additive migration; does NOT modify prior migrations. Owner-only for private
-- tables; the ONLY anonymous surface is a small set of SECURITY DEFINER RPCs that
-- take a raw token, verify its SHA-256 hash, and return a curated public offer
-- projection (never internal notes, storage paths, customer ids or raw db ids
-- beyond what the customer must see). Native acceptance is "Online-Annahme /
-- einfache elektronische Signatur" — NOT a qualified/advanced e-signature.
-- =============================================================================

begin;

-- ---------------------------------------------------------------------------
-- Generated documents registry (offer/invoice PDFs). Finalized rows are immutable.
-- ---------------------------------------------------------------------------
create table if not exists public.owner_generated_documents (
  id uuid primary key default gen_random_uuid(),
  business_entity_id uuid not null references public.owner_business_entities(id) on delete cascade,
  document_type text not null check (document_type in ('offer','invoice','order_confirmation','cancellation_invoice','credit_note','payment_confirmation','finance_report')),
  source_resource_type text not null check (source_resource_type in ('owner_offers','owner_invoices')),
  source_resource_id uuid not null,
  document_number text,
  version int not null default 1 check (version > 0),
  status text not null default 'draft' check (status in ('draft','finalized','archived')),
  language text not null default 'de' check (language in ('de','en')),
  currency text not null default 'EUR' check (currency ~ '^[A-Z]{3}$'),
  template_version text not null,
  source_hash text not null,
  pdf_storage_path text,
  render_metadata jsonb not null default '{}'::jsonb,
  generated_by uuid references public.profiles(id) on delete set null,
  generated_at timestamptz not null default now(),
  finalized_at timestamptz,
  archived_at timestamptz,
  constraint owner_generated_documents_version_unique unique (source_resource_type, source_resource_id, version)
);
create index if not exists owner_generated_documents_entity_idx on public.owner_generated_documents (business_entity_id, generated_at);
create index if not exists owner_generated_documents_source_idx on public.owner_generated_documents (source_resource_type, source_resource_id);

-- ---------------------------------------------------------------------------
-- Public access tokens. Only the SHA-256 hash is stored; the raw token is
-- returned to the owner exactly once. Scoped to a single offer (+ its PDF).
-- ---------------------------------------------------------------------------
create table if not exists public.owner_document_access_tokens (
  id uuid primary key default gen_random_uuid(),
  business_entity_id uuid not null references public.owner_business_entities(id) on delete cascade,
  offer_id uuid references public.owner_offers(id) on delete cascade,
  document_id uuid references public.owner_generated_documents(id) on delete set null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  max_uses int not null default 20 check (max_uses > 0),
  use_count int not null default 0 check (use_count >= 0),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists owner_document_access_tokens_offer_idx on public.owner_document_access_tokens (offer_id);

-- Access audit (views/downloads/accept attempts). ip_hash only, never raw IP, in ordinary flow.
create table if not exists public.owner_document_access_events (
  id uuid primary key default gen_random_uuid(),
  token_id uuid references public.owner_document_access_tokens(id) on delete set null,
  offer_id uuid references public.owner_offers(id) on delete set null,
  event_type text not null check (event_type in ('viewed','downloaded','accept_attempt','accepted','rejected','denied')),
  user_agent_summary text,
  ip_hash text,
  created_at timestamptz not null default now()
);
create index if not exists owner_document_access_events_offer_idx on public.owner_document_access_events (offer_id, created_at);

-- Acceptance evidence, bound to the exact immutable document version + source hash.
create table if not exists public.owner_offer_acceptance_events (
  id uuid primary key default gen_random_uuid(),
  business_entity_id uuid not null references public.owner_business_entities(id) on delete cascade,
  offer_id uuid not null references public.owner_offers(id) on delete cascade,
  document_id uuid references public.owner_generated_documents(id) on delete set null,
  document_version int,
  source_hash text,
  token_id uuid references public.owner_document_access_tokens(id) on delete set null,
  decision text not null check (decision in ('accepted','rejected')),
  signature_level text not null default 'electronic_acceptance'
    check (signature_level in ('electronic_acceptance','simple_electronic_signature')),
  signer_name text,
  signer_company text,
  signer_email text,
  accepted_terms_version text,
  comment text,
  event_order bigint not null,
  user_agent_summary text,
  ip_address inet,
  created_at timestamptz not null default now()
);
create index if not exists owner_offer_acceptance_events_offer_idx on public.owner_offer_acceptance_events (offer_id, event_order);

-- Owner attention/notifications (offer viewed/accepted/rejected/expiring/expired, etc.).
create table if not exists public.owner_finance_notifications (
  id uuid primary key default gen_random_uuid(),
  business_entity_id uuid not null references public.owner_business_entities(id) on delete cascade,
  category text not null,
  title text not null,
  body text,
  resource_type text,
  resource_id uuid,
  amount_cents bigint,
  priority text not null default 'normal' check (priority in ('low','normal','high')),
  read_at timestamptz,
  dismissed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists owner_finance_notifications_entity_idx on public.owner_finance_notifications (business_entity_id, created_at);
create index if not exists owner_finance_notifications_open_idx on public.owner_finance_notifications (business_entity_id) where dismissed_at is null;

commit;

-- ---------------------------------------------------------------------------
-- Immutability guard for finalized generated documents (no overwrite, no hard-delete).
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_guard_generated_document()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if tg_op = 'DELETE' then
    -- Finalized documents are evidence: no hard delete for ANY role (archive instead).
    if old.status = 'finalized' then raise exception 'finalized documents cannot be deleted (evidence)'; end if;
    return old;
  end if;
  if old.status = 'finalized' then
    if new.pdf_storage_path is distinct from old.pdf_storage_path
       or new.source_hash is distinct from old.source_hash
       or new.version is distinct from old.version
       or new.document_type is distinct from old.document_type
       or new.source_resource_id is distinct from old.source_resource_id then
      raise exception 'finalized document is immutable; create a new version';
    end if;
  end if;
  if new.status = 'finalized' and new.finalized_at is null then new.finalized_at := now(); end if;
  return new;
end;
$$;

drop trigger if exists owner_generated_documents_guard on public.owner_generated_documents;
create trigger owner_generated_documents_guard before update or delete on public.owner_generated_documents
  for each row execute function public.owner_guard_generated_document();

drop trigger if exists owner_generated_documents_audit on public.owner_generated_documents;
create trigger owner_generated_documents_audit after insert or update or delete on public.owner_generated_documents
  for each row execute function public.owner_write_audit_row('owner_generated_documents');

commit;

-- ---------------------------------------------------------------------------
-- RLS + grants. Private tables owner-only; NO anon table grants anywhere.
-- ---------------------------------------------------------------------------
begin;

do $$
declare t text;
begin
  foreach t in array array['owner_generated_documents','owner_document_access_tokens','owner_finance_notifications'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_owner_all', t);
    execute format('create policy %I on public.%I for all to authenticated using (public.is_platform_owner()) with check (public.is_platform_owner())', t || '_owner_all', t);
    execute format('revoke all on table public.%I from public, anon, authenticated', t);
    execute format('grant select, insert, update on table public.%I to authenticated', t);
    execute format('grant select, insert, update, delete on table public.%I to service_role', t);
  end loop;
end;
$$;

-- Append-only evidence tables: owner may select + insert; never anon.
do $$
declare t text;
begin
  foreach t in array array['owner_document_access_events','owner_offer_acceptance_events'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_owner_select', t);
    execute format('create policy %I on public.%I for select to authenticated using (public.is_platform_owner())', t || '_owner_select', t);
    execute format('revoke all on table public.%I from public, anon, authenticated', t);
    execute format('grant select on table public.%I to authenticated', t);
    execute format('grant select, insert on table public.%I to service_role', t);
  end loop;
end;
$$;

commit;

-- ---------------------------------------------------------------------------
-- Owner RPCs: register generated document, create access token.
-- ---------------------------------------------------------------------------
begin;

-- Register a generated document version. Idempotent per (source, version). If a finalized
-- row exists with a different source_hash, a new version must be requested explicitly.
create or replace function public.register_owner_generated_document(p_idempotency_key uuid, p_doc jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_existing jsonb; v_id uuid; v_entity uuid; v_srt text; v_srid uuid; v_version int; v_result jsonb;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  v_existing := public.owner_claim_idempotency(p_idempotency_key, 'register_owner_generated_document');
  if v_existing is not null then return v_existing; end if;

  v_entity := (p_doc->>'business_entity_id')::uuid;
  v_srt := p_doc->>'source_resource_type';
  v_srid := (p_doc->>'source_resource_id')::uuid;
  if v_entity is null or v_srt is null or v_srid is null then raise exception 'entity, source_resource_type and source_resource_id are required'; end if;

  v_version := coalesce((p_doc->>'version')::int,
    (select coalesce(max(version),0)+1 from public.owner_generated_documents where source_resource_type=v_srt and source_resource_id=v_srid));

  insert into public.owner_generated_documents (business_entity_id, document_type, source_resource_type, source_resource_id,
    document_number, version, status, language, currency, template_version, source_hash, pdf_storage_path, render_metadata, generated_by)
  values (v_entity, p_doc->>'document_type', v_srt, v_srid, p_doc->>'document_number', v_version,
    coalesce(p_doc->>'status','finalized'), coalesce(p_doc->>'language','de'), coalesce(p_doc->>'currency','EUR'),
    coalesce(p_doc->>'template_version','transactional-v1'), p_doc->>'source_hash', p_doc->>'pdf_storage_path',
    coalesce(p_doc->'render_metadata','{}'::jsonb), auth.uid())
  returning id into v_id;

  v_result := jsonb_build_object('document_id', v_id, 'version', v_version);
  update public.owner_finance_requests set result = v_result where idempotency_key = p_idempotency_key;
  return v_result;
end;
$$;

-- Create a secure access token for an offer. Generates a raw 32-byte token, stores only its
-- SHA-256 hash, returns the raw token ONCE. Offer must be finalized (or later).
create or replace function public.create_offer_access_token(p_offer_id uuid, p_document_id uuid default null, p_valid_days int default 30, p_max_uses int default 20)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare o record; v_raw text; v_hash text; v_id uuid;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  select * into o from public.owner_offers where id = p_offer_id;
  if o.id is null then raise exception 'offer not found'; end if;
  if o.status = 'draft' then raise exception 'finalize the offer before creating a link'; end if;

  v_raw := encode(gen_random_bytes(32), 'hex');
  v_hash := encode(digest(v_raw, 'sha256'), 'hex');
  insert into public.owner_document_access_tokens (business_entity_id, offer_id, document_id, token_hash, expires_at, max_uses, created_by)
  values (o.business_entity_id, p_offer_id, p_document_id, v_hash, now() + make_interval(days => greatest(1, p_valid_days)), greatest(1, p_max_uses), auth.uid())
  returning id into v_id;

  return jsonb_build_object('token', v_raw, 'token_id', v_id, 'offer_id', p_offer_id, 'expires_days', greatest(1, p_valid_days));
end;
$$;

create or replace function public.revoke_offer_access_token(p_token_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  update public.owner_document_access_tokens set revoked_at = now() where id = p_token_id and revoked_at is null;
end;
$$;

revoke execute on function public.register_owner_generated_document(uuid, jsonb) from public, anon;
revoke execute on function public.create_offer_access_token(uuid, uuid, int, int) from public, anon;
revoke execute on function public.revoke_offer_access_token(uuid) from public, anon;
grant execute on function public.register_owner_generated_document(uuid, jsonb) to authenticated, service_role;
grant execute on function public.create_offer_access_token(uuid, uuid, int, int) to authenticated, service_role;
grant execute on function public.revoke_offer_access_token(uuid) to authenticated, service_role;

commit;

-- ---------------------------------------------------------------------------
-- PUBLIC token RPCs (anon). SECURITY DEFINER; return only a curated projection.
-- ---------------------------------------------------------------------------
begin;

-- Internal: verify a raw token → token row (or raise). Not granted to anon.
create or replace function public.owner_verify_offer_token(p_token text)
returns public.owner_document_access_tokens language plpgsql security definer set search_path = public, pg_temp as $$
declare v_hash text; tok public.owner_document_access_tokens;
begin
  if p_token is null or length(p_token) < 32 then raise exception 'invalid token'; end if;
  v_hash := encode(digest(p_token, 'sha256'), 'hex');
  select * into tok from public.owner_document_access_tokens where token_hash = v_hash;
  if tok.id is null then raise exception 'invalid token'; end if;
  if tok.revoked_at is not null then raise exception 'token revoked'; end if;
  if tok.expires_at <= now() then raise exception 'token expired'; end if;
  return tok;
end;
$$;
revoke execute on function public.owner_verify_offer_token(text) from public, anon, authenticated;

-- Public offer projection by token. Records a 'viewed' access event, advances offer to
-- 'viewed', and notifies the owner (once). NO internal notes / storage paths / customer ids.
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
    'description', l.description, 'quantity_milli', l.quantity_milli, 'unit', l.unit,
    'unit_price_cents', l.unit_price_cents, 'vat_rate_bp', l.vat_rate_bp, 'vat_treatment', l.vat_treatment,
    'net_cents', l.net_cents, 'vat_cents', l.vat_cents, 'gross_cents', l.gross_cents, 'is_optional', l.is_optional
  ) order by l.sort_order), '[]'::jsonb) into v_lines
  from public.owner_offer_lines l where l.offer_id = o.id;

  -- Record view + notify owner once, and advance status finalized/sent -> viewed.
  insert into public.owner_document_access_events (token_id, offer_id, event_type, user_agent_summary)
  values (tok.id, o.id, 'viewed', left(coalesce(p_user_agent,''), 200));
  if o.status in ('finalized','sent') then
    update public.owner_offers set status = 'viewed' where id = o.id;
    insert into public.owner_finance_notifications (business_entity_id, category, title, body, resource_type, resource_id, amount_cents, priority)
    values (o.business_entity_id, 'offer_viewed', 'Angebot angesehen',
      coalesce(o.offer_number,'') || ' wurde vom Kunden geöffnet.', 'owner_offers', o.id, o.gross_total_cents, 'normal');
  end if;

  v_result := jsonb_build_object(
    'offer_number', o.offer_number,
    'title', o.title,
    'status', case when o.status='converted' then 'accepted' else o.status end,
    'issue_date', o.issue_date,
    'valid_until', o.valid_until,
    'currency', o.currency,
    'introduction', o.introduction,
    'scope', o.scope,
    'assumptions', o.assumptions,
    'exclusions', o.exclusions,
    'payment_terms', o.payment_terms,
    'delivery_terms', o.delivery_terms,
    'net_total_cents', o.net_total_cents,
    'vat_total_cents', o.vat_total_cents,
    'gross_total_cents', o.gross_total_cents,
    'lines', v_lines,
    'accepted', (o.status in ('accepted','converted')),
    'rejected', (o.status = 'rejected'),
    'expired', (o.status = 'expired' or o.valid_until < current_date),
    'has_pdf', (v_doc.id is not null and v_doc.pdf_storage_path is not null),
    'document_version', v_doc.version,
    'seller', jsonb_build_object(
      'legal_name', coalesce(s.legal_name, ''),
      'street', s.street, 'postal_code', s.postal_code, 'city', s.city,
      'country_code', coalesce(s.country_code,'DE'), 'email', s.business_email,
      'website', s.website, 'vat_id', s.vat_id)
  );
  return v_result;
end;
$$;

-- Public accept/reject by token. Binds evidence to the exact document version + source hash.
-- Duplicate acceptance is idempotent (no second event, no duplicate notification).
create or replace function public.respond_offer_by_token(
  p_token text, p_decision text, p_signer_name text, p_signer_company text, p_signer_email text,
  p_terms_version text, p_comment text default null, p_user_agent text default null)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare tok public.owner_document_access_tokens; o record; v_doc record; v_order bigint; v_hash text;
begin
  if p_decision not in ('accepted','rejected') then raise exception 'invalid decision'; end if;
  tok := public.owner_verify_offer_token(p_token);
  if tok.use_count >= tok.max_uses then raise exception 'token use limit reached'; end if;

  select * into o from public.owner_offers where id = tok.offer_id for update;
  if o.id is null then raise exception 'offer unavailable'; end if;

  -- Idempotent duplicate acceptance: already accepted/converted → return without new record.
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
  v_hash := coalesce(v_doc.source_hash, (select source_hash from public.owner_offer_versions where offer_id=o.id order by version desc limit 1));

  select coalesce(max(event_order),0)+1 into v_order from public.owner_offer_acceptance_events where offer_id = o.id;

  insert into public.owner_offer_acceptance_events (business_entity_id, offer_id, document_id, document_version, source_hash,
    token_id, decision, signature_level, signer_name, signer_company, signer_email, accepted_terms_version, comment, event_order, user_agent_summary)
  values (o.business_entity_id, o.id, tok.document_id, v_doc.version, v_hash, tok.id, p_decision,
    'simple_electronic_signature', nullif(trim(p_signer_name),''), nullif(trim(p_signer_company),''),
    nullif(trim(p_signer_email),''), p_terms_version, nullif(trim(p_comment),''), v_order, left(coalesce(p_user_agent,''),200));

  update public.owner_document_access_tokens set use_count = use_count + 1 where id = tok.id;
  insert into public.owner_document_access_events (token_id, offer_id, event_type, user_agent_summary)
  values (tok.id, o.id, p_decision, left(coalesce(p_user_agent,''),200));

  if p_decision = 'accepted' then
    update public.owner_offers set status='accepted', accepted_at=now() where id=o.id;
    insert into public.owner_finance_notifications (business_entity_id, category, title, body, resource_type, resource_id, amount_cents, priority)
    values (o.business_entity_id, 'offer_accepted', 'Angebot angenommen',
      coalesce(o.offer_number,'') || ' wurde von ' || coalesce(nullif(trim(p_signer_name),''),'dem Kunden') || ' angenommen.',
      'owner_offers', o.id, o.gross_total_cents, 'high');
  else
    update public.owner_offers set status='rejected', rejected_at=now(), rejection_reason=nullif(trim(p_comment),'') where id=o.id;
    insert into public.owner_finance_notifications (business_entity_id, category, title, body, resource_type, resource_id, amount_cents, priority)
    values (o.business_entity_id, 'offer_rejected', 'Angebot abgelehnt',
      coalesce(o.offer_number,'') || ' wurde abgelehnt.', 'owner_offers', o.id, o.gross_total_cents, 'high');
  end if;

  return jsonb_build_object('decision', p_decision, 'offer_number', o.offer_number, 'source_hash', v_hash, 'event_order', v_order);
end;
$$;

-- Grant the two public projections to anon (and authenticated). NOT the verify helper.
revoke execute on function public.public_offer_by_token(text, text) from public;
revoke execute on function public.respond_offer_by_token(text, text, text, text, text, text, text, text) from public;
grant execute on function public.public_offer_by_token(text, text) to anon, authenticated, service_role;
grant execute on function public.respond_offer_by_token(text, text, text, text, text, text, text, text) to anon, authenticated, service_role;

commit;
