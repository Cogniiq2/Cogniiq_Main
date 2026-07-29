-- =============================================================================
-- Customer documents — private, authenticated document access
-- =============================================================================
-- CANONICAL SOURCE STRATEGY
--   owner_generated_documents is already the immutable system of record for
--   commercial PDFs (content-addressed via source_hash, versioned, finalized rows
--   never mutated). This migration does NOT copy those bytes anywhere. A
--   customer_documents row is EITHER:
--     * a POINTER (owner_generated_document_id set, storage_path null) to that one
--       canonical PDF in the owner-only 'owner-finance-documents' bucket, or
--     * a genuine UPLOAD (storage_path set, owner_generated_document_id null) living
--       in the new private 'customer-documents' bucket.
--   Exactly one of the two, enforced by a check constraint. There is never a second
--   copy of an invoice or offer PDF and the owner bucket's policies are not widened:
--   only the service-role Edge Function reads from it, after authorization.
--
-- STORAGE ACCESS
--   Customers get NO storage policy on either bucket. Downloads go exclusively
--   through the customer-document-download Edge Function, which verifies the JWT,
--   calls authorize_customer_document_download() (service_role only) and then mints
--   a short-lived signed URL with the service key. A signed URL does not consult
--   storage RLS at request time — that is inherent to signed URLs — so the guard is
--   that the URL is only ever minted after a server-side membership + visibility
--   check, is scoped to one object, expires in 10 minutes, and is audited. The
--   residual, accepted risk is that an already-issued URL stays valid for its
--   remaining TTL if visibility is revoked one second later.
--
-- This migration is TRANSACTIONAL and DETERMINISTIC (bare DDL, no IF NOT EXISTS on
-- structural objects) so schema drift fails loudly instead of silently no-opping.
-- The single exception is the storage.buckets upsert, which is a global singleton
-- config row, not a structural definition.
-- =============================================================================

begin;

create type public.customer_document_category as enum (
  'offer', 'acceptance', 'contract', 'invoice', 'concept', 'project_document',
  'meeting_notes', 'handover', 'manual', 'dpa', 'customer_upload'
);

-- ---------------------------------------------------------------------------
-- customer_documents
-- ---------------------------------------------------------------------------
create table public.customer_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid,
  category public.customer_document_category not null,
  title text not null,
  version integer not null default 1,
  supersedes_document_id uuid,

  -- Upload path (bytes live in the private 'customer-documents' bucket).
  storage_path text,
  content_type text,
  size_bytes bigint,

  -- Pointer path (bytes stay in the canonical owner registry; never duplicated).
  -- RESTRICT: a canonical finance PDF cannot be deleted while a customer references it.
  owner_generated_document_id uuid references public.owner_generated_documents(id) on delete restrict,

  customer_visible boolean not null default false,
  -- Set once, the first time the document is made visible. Never cleared. A document
  -- that has ever been published can never be hard-deleted (see the delete guard).
  published_at timestamptz,
  -- Permanent retirement. Archived documents disappear from every customer surface
  -- and from signed-URL authorization, but the row and its audit trail survive.
  archived_at timestamptz,

  uploaded_by uuid not null references public.profiles(id) on delete restrict,
  uploaded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint customer_documents_title_not_blank check (length(trim(title)) > 0),
  constraint customer_documents_version_positive check (version > 0),
  constraint customer_documents_size_range check (
    size_bytes is null or (size_bytes >= 0 and size_bytes <= 26214400)
  ),
  -- Defence in depth: the Edge Function is the enforcement point for uploads, but the
  -- database refuses a type outside the allow-list regardless of how a row is created.
  constraint customer_documents_content_type_allowed check (
    content_type is null or content_type in (
      'application/pdf', 'image/png', 'image/jpeg', 'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )
  ),
  -- A row is either an upload or a pointer, never both and never neither.
  constraint customer_documents_exactly_one_source check (
    (storage_path is not null and owner_generated_document_id is null)
    or (storage_path is null and owner_generated_document_id is not null)
  ),
  constraint customer_documents_upload_has_metadata check (
    storage_path is null or (content_type is not null and size_bytes is not null)
  ),
  constraint customer_documents_published_before_archived check (
    archived_at is null or published_at is null or archived_at >= published_at
  ),
  constraint customer_documents_org_id_unique unique (organization_id, id),
  -- Composite FKs: a document can never reference a project or a predecessor
  -- belonging to another organization. Column-specific SET NULL (PG15+) nulls ONLY
  -- the nullable partner column — a plain SET NULL would also try to null
  -- organization_id, which is NOT NULL, and fail.
  constraint customer_documents_project_fk
    foreign key (organization_id, project_id)
    references public.customer_projects (organization_id, id)
    on delete set null (project_id),
  constraint customer_documents_supersedes_fk
    foreign key (organization_id, supersedes_document_id)
    references public.customer_documents (organization_id, id)
    on delete set null (supersedes_document_id)
);

create unique index customer_documents_storage_path_key
  on public.customer_documents (storage_path) where storage_path is not null;
create index customer_documents_org_visible_idx
  on public.customer_documents (organization_id, customer_visible) where archived_at is null;
create index customer_documents_project_idx
  on public.customer_documents (project_id) where project_id is not null;
create index customer_documents_owner_source_idx
  on public.customer_documents (owner_generated_document_id) where owner_generated_document_id is not null;

comment on table public.customer_documents is
  'Customer-visible documents. Either an upload (storage_path) or a pointer to the canonical owner_generated_documents PDF. Never a second copy of a commercial PDF.';
comment on column public.customer_documents.storage_path is
  'Internal object path. NEVER returned to a browser; downloads go through the customer-document-download Edge Function.';

-- ---------------------------------------------------------------------------
-- Access audit. Survives deletion of the document or the profile: the FKs are
-- SET NULL and the human-readable snapshots are captured at write time, so an
-- audit row remains meaningful after its subjects are gone.
-- ---------------------------------------------------------------------------
create table public.customer_document_access_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  document_id uuid references public.customer_documents(id) on delete set null,
  document_title_snapshot text not null,
  document_category_snapshot public.customer_document_category not null,
  user_id uuid references public.profiles(id) on delete set null,
  user_display_name_snapshot text not null,
  -- 'url_issued' is named for what actually happened. Minting a signed URL is NOT
  -- proof of a view or a download; no such proof exists without a storage webhook,
  -- so no event type claims it.
  event_type text not null check (event_type in ('uploaded', 'url_issued', 'archived')),
  occurred_at timestamptz not null default now()
);

create index customer_document_access_events_org_idx
  on public.customer_document_access_events (organization_id, occurred_at desc);
create index customer_document_access_events_document_idx
  on public.customer_document_access_events (document_id, occurred_at desc);

comment on table public.customer_document_access_events is
  'Append-only document audit. url_issued records that a signed URL was MINTED — not that the file was viewed or downloaded.';

create trigger customer_documents_set_updated_at
before update on public.customer_documents
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Source consistency: organization match, finalized status, and category.
--
-- Acceptance certificates are registered by the signed-certificate workflow as
-- document_type='offer' with render_metadata->>'signed'='true'. So:
--   * category='acceptance' REQUIRES that signed marker AND an actually-accepted
--     offer. An ordinary offer PDF can never be relabelled as an acceptance.
--   * category='offer' REQUIRES the absence of that marker, so a signed
--     certificate cannot be mislabelled as a plain offer either.
-- SECURITY DEFINER because owner_* tables are owner-only under RLS; a plain
-- invoker-rights trigger would see no rows for a cogniiq_admin and reject
-- perfectly valid registrations.
-- ---------------------------------------------------------------------------
create or replace function public.guard_customer_document_source_consistency()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid;
  v_status text;
  v_doc_type text;
  v_signed text;
  v_source_type text;
  v_source_id uuid;
  v_offer_accepted boolean := false;
begin
  if new.owner_generated_document_id is null then
    -- Raw uploads may never claim an owner-reserved category: those categories are
    -- only reachable through a verified pointer to the canonical registry.
    if new.category in ('offer', 'acceptance', 'invoice') then
      raise exception 'category % requires a linked owner_generated_document_id, not a raw upload', new.category;
    end if;
    return new;
  end if;

  select ogd.status, ogd.document_type, ogd.render_metadata->>'signed',
         ogd.source_resource_type, ogd.source_resource_id
    into v_status, v_doc_type, v_signed, v_source_type, v_source_id
  from public.owner_generated_documents ogd
  where ogd.id = new.owner_generated_document_id;

  if not found then
    raise exception 'owner_generated_document_id % does not exist', new.owner_generated_document_id;
  end if;

  -- Resolve the organization through the polymorphic source. A plain FK cannot do
  -- this (source_resource_id points at either owner_offers or owner_invoices), so
  -- organization integrity for this relationship is enforced here instead.
  if v_source_type = 'owner_offers' then
    select o.organization_id, (o.accepted_at is not null or o.status = 'accepted')
      into v_org, v_offer_accepted
    from public.owner_offers o where o.id = v_source_id;
  elsif v_source_type = 'owner_invoices' then
    select i.organization_id into v_org
    from public.owner_invoices i where i.id = v_source_id;
  end if;

  if v_org is null or v_org <> new.organization_id then
    raise exception 'owner_generated_document_id must resolve to the same organization as this row';
  end if;

  if v_status <> 'finalized' then
    raise exception 'only finalized owner_generated_documents may be published to a customer (got %)', v_status;
  end if;

  if new.category = 'acceptance' then
    if v_doc_type <> 'offer' or coalesce(v_signed, '') <> 'true' then
      raise exception 'category=acceptance requires a signed acceptance certificate (document_type=offer, render_metadata.signed=true)';
    end if;
    if not v_offer_accepted then
      raise exception 'category=acceptance requires the source offer to be accepted';
    end if;
  elsif new.category = 'offer' then
    if v_doc_type <> 'offer' then
      raise exception 'category=offer requires an offer document, got %', v_doc_type;
    end if;
    if coalesce(v_signed, '') = 'true' then
      raise exception 'a signed acceptance certificate must use category=acceptance, not offer';
    end if;
  elsif new.category = 'invoice' then
    if v_doc_type not in ('invoice', 'credit_note', 'payment_confirmation', 'cancellation_invoice') then
      raise exception 'category=invoice requires a billing document, got %', v_doc_type;
    end if;
  else
    raise exception 'category % may not be linked to an owner_generated_document', new.category;
  end if;

  return new;
end;
$$;

revoke all on function public.guard_customer_document_source_consistency() from public, anon, authenticated;

create trigger customer_documents_source_consistency_guard
before insert or update of owner_generated_document_id, category, organization_id
on public.customer_documents
for each row execute function public.guard_customer_document_source_consistency();

-- ---------------------------------------------------------------------------
-- A document that has ever been published to a customer can never be hard
-- deleted — it is archived instead, preserving the record and its audit trail.
-- This fires for ANY delete against the table, not only ones routed through an
-- RPC, so it is a real backstop rather than a convention.
-- ---------------------------------------------------------------------------
create or replace function public.guard_customer_document_no_hard_delete_if_published()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.published_at is not null then
    raise exception 'document % has been published and cannot be deleted; archive it instead', old.id;
  end if;
  return old;
end;
$$;

revoke all on function public.guard_customer_document_no_hard_delete_if_published() from public, anon, authenticated;

create trigger customer_documents_no_hard_delete_if_published
before delete on public.customer_documents
for each row execute function public.guard_customer_document_no_hard_delete_if_published();

-- ---------------------------------------------------------------------------
-- RLS: deny by default; customers hold no policy at all.
-- ---------------------------------------------------------------------------
alter table public.customer_documents enable row level security;
alter table public.customer_document_access_events enable row level security;

revoke all on public.customer_documents from public, anon, authenticated;
revoke all on public.customer_document_access_events from public, anon, authenticated;

create policy customer_documents_internal_all on public.customer_documents
  for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create policy customer_document_access_events_internal_select on public.customer_document_access_events
  for select to authenticated
  using (public.is_platform_admin());

grant select, insert, update, delete on public.customer_documents to authenticated;
grant select on public.customer_document_access_events to authenticated;

-- ---------------------------------------------------------------------------
-- Private storage bucket. NO customer policy exists: an ordinary authenticated
-- customer has zero operations on this bucket. Only internal staff (direct) and
-- the service-role Edge Function (which bypasses RLS) touch it.
--
-- FAIL-SAFE, not fail-silent: this is an UPSERT that FORCES public = false and the
-- intended size/MIME restrictions on every apply, including when the bucket row
-- already exists (e.g. it was created out-of-band, left over from a prior partial
-- deployment, or someone manually flipped it public). `on conflict do nothing`
-- would leave a pre-existing public bucket public — the bucket row itself is a
-- global singleton config row, so re-asserting its intended state on every apply
-- is correct here; this is not structural DDL and is safely re-runnable.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'customer-documents',
  'customer-documents',
  false,
  26214400,
  array[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'customer_documents_bucket_admin_all'
  ) then
    execute $p$create policy customer_documents_bucket_admin_all on storage.objects
      for all to authenticated
      using (bucket_id = 'customer-documents' and public.is_platform_admin())
      with check (bucket_id = 'customer-documents' and public.is_platform_admin())$p$;
  end if;
end;
$$;

-- =============================================================================
-- SERVICE-ROLE HELPERS
-- =============================================================================
-- These take an explicit caller id because the Edge Function calls them with a
-- service-role client, which has no session auth.uid(). They are therefore NEVER
-- granted to authenticated: a browser could otherwise pass any user id.
-- =============================================================================

create or replace function public.is_organization_member_as(
  target_organization_id uuid,
  target_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(exists (
    select 1
    from public.organization_members om
    where om.organization_id = target_organization_id
      and om.user_id = target_user_id
      and om.status = 'active'
  ), false);
$$;

create or replace function public.is_platform_admin_as(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(exists (
    select 1 from public.profiles p
    where p.id = target_user_id
      and p.platform_role in ('cogniiq_admin', 'cogniiq_owner')
  ), false);
$$;

revoke all on function public.is_organization_member_as(uuid, uuid) from public, anon, authenticated;
revoke all on function public.is_platform_admin_as(uuid) from public, anon, authenticated;
grant execute on function public.is_organization_member_as(uuid, uuid) to service_role;
grant execute on function public.is_platform_admin_as(uuid) to service_role;

-- ---------------------------------------------------------------------------
-- Download authorization. Returns the bucket + object path for a document the
-- caller is genuinely entitled to. Every denial reason — cross-organization,
-- suspended membership, not visible, archived, nonexistent — produces the SAME
-- generic result (zero rows), so the function never reveals whether a given
-- document id exists.
--
-- service_role ONLY: the return payload IS the sensitive infrastructure detail,
-- so granting it to authenticated would let a browser read object paths directly
-- via supabase.rpc(), bypassing the Edge Function entirely.
-- ---------------------------------------------------------------------------
create or replace function public.authorize_customer_document_download(
  p_caller_id uuid,
  p_document_id uuid
)
returns table (bucket_id text, object_path text)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_org uuid;
  v_visible boolean;
  v_archived timestamptz;
  v_storage_path text;
  v_owner_doc uuid;
begin
  if p_caller_id is null or p_document_id is null then
    return;
  end if;

  select d.organization_id, d.customer_visible, d.archived_at, d.storage_path, d.owner_generated_document_id
    into v_org, v_visible, v_archived, v_storage_path, v_owner_doc
  from public.customer_documents d
  where d.id = p_document_id;

  if not found then return; end if;
  if not public.is_organization_member_as(v_org, p_caller_id) then return; end if;
  if not v_visible or v_archived is not null then return; end if;

  if v_storage_path is not null then
    return query select 'customer-documents'::text, v_storage_path;
  else
    -- Pointer row: the canonical PDF stays in the owner-only bucket. Only the
    -- service-role Edge Function ever reads it, and only after this check.
    return query
      select 'owner-finance-documents'::text, ogd.pdf_storage_path
      from public.owner_generated_documents ogd
      where ogd.id = v_owner_doc
        and ogd.status = 'finalized'
        and ogd.pdf_storage_path is not null;
  end if;
end;
$$;

create or replace function public.record_customer_document_access(
  p_caller_id uuid,
  p_document_id uuid,
  p_event_type text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid;
  v_title text;
  v_category public.customer_document_category;
  v_user_name text;
begin
  select d.organization_id, d.title, d.category
    into v_org, v_title, v_category
  from public.customer_documents d where d.id = p_document_id;
  if not found then return; end if;

  select coalesce(p.full_name, p.email, 'Unbekannt') into v_user_name
  from public.profiles p where p.id = p_caller_id;

  insert into public.customer_document_access_events (
    organization_id, document_id, document_title_snapshot, document_category_snapshot,
    user_id, user_display_name_snapshot, event_type
  )
  values (v_org, p_document_id, v_title, v_category, p_caller_id,
          coalesce(v_user_name, 'Unbekannt'), p_event_type);
end;
$$;

revoke all on function public.authorize_customer_document_download(uuid, uuid) from public, anon, authenticated;
revoke all on function public.record_customer_document_access(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.authorize_customer_document_download(uuid, uuid) to service_role;
grant execute on function public.record_customer_document_access(uuid, uuid, text) to service_role;

-- =============================================================================
-- CUSTOMER READ RPC
-- =============================================================================
-- Allow-list note: storage_path, owner_generated_document_id, customer_visible,
-- uploaded_by, published_at and archived_at are all absent by construction.
-- p_project_id semantics: NULL means "every visible document in my organization"
-- (this is what /app/documents calls); non-NULL scopes to that one project.
-- =============================================================================

create or replace function public.list_customer_documents(p_project_id uuid default null)
returns table (
  id uuid,
  project_id uuid,
  category public.customer_document_category,
  title text,
  version integer,
  content_type text,
  size_bytes bigint,
  uploaded_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception using errcode = '28000', message = 'authentication required';
  end if;

  return query
  select d.id, d.project_id, d.category, d.title, d.version,
         d.content_type, d.size_bytes, d.uploaded_at
  from public.customer_documents d
  where d.customer_visible = true
    and d.archived_at is null
    and public.is_organization_member(d.organization_id)
    and (p_project_id is null or d.project_id = p_project_id)
  order by d.uploaded_at desc, d.id asc;
end;
$$;

revoke all on function public.list_customer_documents(uuid) from public, anon;
grant execute on function public.list_customer_documents(uuid) to authenticated;

-- =============================================================================
-- OWNER / ADMIN WRITE RPCs
-- =============================================================================

create or replace function public.register_customer_document_from_owner_source(
  p_organization_id uuid,
  p_project_id uuid,
  p_category public.customer_document_category,
  p_title text,
  p_owner_generated_document_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare v_id uuid;
begin
  if not public.is_platform_admin() then
    raise exception using errcode = '42501', message = 'not authorized';
  end if;

  insert into public.customer_documents (
    organization_id, project_id, category, title, owner_generated_document_id, uploaded_by
  )
  values (p_organization_id, p_project_id, p_category, p_title, p_owner_generated_document_id, auth.uid())
  returning customer_documents.id into v_id;

  return v_id;
end;
$$;

-- Called ONLY by the customer-document-upload Edge Function, after it has
-- validated MIME/size, generated the storage path itself and read the ACTUAL
-- object metadata back from Storage. service_role only: an authenticated caller
-- could otherwise register an arbitrary storage_path.
create or replace function public.register_customer_document_from_upload(
  p_caller_id uuid,
  p_organization_id uuid,
  p_project_id uuid,
  p_category public.customer_document_category,
  p_title text,
  p_storage_path text,
  p_content_type text,
  p_size_bytes bigint
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare v_id uuid;
begin
  if not public.is_platform_admin_as(p_caller_id) then
    raise exception using errcode = '42501', message = 'not authorized';
  end if;

  insert into public.customer_documents (
    organization_id, project_id, category, title,
    storage_path, content_type, size_bytes, uploaded_by
  )
  values (p_organization_id, p_project_id, p_category, p_title,
          p_storage_path, p_content_type, p_size_bytes, p_caller_id)
  returning customer_documents.id into v_id;

  insert into public.customer_document_access_events (
    organization_id, document_id, document_title_snapshot, document_category_snapshot,
    user_id, user_display_name_snapshot, event_type
  )
  select p_organization_id, v_id, p_title, p_category, p_caller_id,
         coalesce(pr.full_name, pr.email, 'Unbekannt'), 'uploaded'
  from public.profiles pr where pr.id = p_caller_id;

  return v_id;
end;
$$;

create or replace function public.set_customer_document_visibility(
  p_document_id uuid,
  p_visible boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_platform_admin() then
    raise exception using errcode = '42501', message = 'not authorized';
  end if;

  update public.customer_documents
  set customer_visible = p_visible,
      -- published_at latches on the first publish and is never cleared, so the
      -- "was this ever visible to a customer?" question always has a truthful answer.
      published_at = case when p_visible then coalesce(published_at, now()) else published_at end
  where id = p_document_id
    and archived_at is null;

  if not found then
    raise exception 'customer document % not found or archived', p_document_id;
  end if;
end;
$$;

create or replace function public.archive_customer_document(p_document_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_org uuid; v_title text; v_category public.customer_document_category;
begin
  if not public.is_platform_admin() then
    raise exception using errcode = '42501', message = 'not authorized';
  end if;

  update public.customer_documents
  set customer_visible = false, archived_at = now()
  where id = p_document_id and archived_at is null
  returning organization_id, title, category into v_org, v_title, v_category;

  if not found then
    raise exception 'customer document % not found or already archived', p_document_id;
  end if;

  insert into public.customer_document_access_events (
    organization_id, document_id, document_title_snapshot, document_category_snapshot,
    user_id, user_display_name_snapshot, event_type
  )
  select v_org, p_document_id, v_title, v_category, auth.uid(),
         coalesce(pr.full_name, pr.email, 'Unbekannt'), 'archived'
  from public.profiles pr where pr.id = auth.uid();
end;
$$;

-- Only a NEVER-PUBLISHED document may be permanently removed (a failed or
-- superseded upload). The delete trigger enforces this independently of this RPC.
create or replace function public.delete_unpublished_customer_document(
  p_caller_id uuid,
  p_document_id uuid
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare v_published timestamptz; v_path text;
begin
  if not public.is_platform_admin_as(p_caller_id) then
    raise exception using errcode = '42501', message = 'not authorized';
  end if;

  select published_at, storage_path into v_published, v_path
  from public.customer_documents where id = p_document_id;

  if not found then
    raise exception 'customer document % not found', p_document_id;
  end if;
  if v_published is not null then
    raise exception 'document % has been published and cannot be deleted; archive it instead', p_document_id;
  end if;

  delete from public.customer_documents where id = p_document_id;
  return v_path;
end;
$$;

revoke all on function public.register_customer_document_from_owner_source(uuid, uuid, public.customer_document_category, text, uuid) from public, anon;
revoke all on function public.register_customer_document_from_upload(uuid, uuid, uuid, public.customer_document_category, text, text, text, bigint) from public, anon, authenticated;
revoke all on function public.set_customer_document_visibility(uuid, boolean) from public, anon;
revoke all on function public.archive_customer_document(uuid) from public, anon;
revoke all on function public.delete_unpublished_customer_document(uuid, uuid) from public, anon, authenticated;

grant execute on function public.register_customer_document_from_owner_source(uuid, uuid, public.customer_document_category, text, uuid) to authenticated;
grant execute on function public.register_customer_document_from_upload(uuid, uuid, uuid, public.customer_document_category, text, text, text, bigint) to service_role;
grant execute on function public.set_customer_document_visibility(uuid, boolean) to authenticated;
grant execute on function public.archive_customer_document(uuid) to authenticated;
grant execute on function public.delete_unpublished_customer_document(uuid, uuid) to service_role;

commit;
