-- =============================================================================
-- Customer-document publish guard — validated, idempotent owner-source pointers
-- =============================================================================
-- WHAT ALREADY HELD, AND IS NOT WEAKENED HERE
-- -------------------------------------------
-- The BEFORE trigger customer_documents_source_consistency_guard (20260728121000)
-- already enforces, for every row regardless of caller: the source document exists,
-- resolves to the SAME organization, is `finalized`, and that the category matches
-- the document type — including that category='acceptance' requires both the signed
-- marker and an actually-accepted source offer, and that 'offer'/'acceptance'/
-- 'invoice' are unreachable from a raw upload. That trigger remains the backstop
-- and is untouched. Nothing below relaxes any of it.
--
-- WHY THIS MIGRATION
-- ------------------
-- Two real gaps remained, and the owner-facing publishing UI cannot be built on
-- top of either:
--
--   1. DUPLICATE POINTERS. Every call inserted ANOTHER pointer to the same
--      canonical PDF. A double-clicked button or a retried request produced two
--      rows the customer sees as two identical documents, and
--      list_customer_invoices' `order by ogd.version desc, cd.id desc` then picked
--      between them arbitrarily. Nothing at any layer prevented this.
--
--   2. A POINTER TO NO BYTES. pdf_storage_path IS NULL was accepted, producing a
--      "document" that appears in the customer's list and that the download Edge
--      Function can never resolve to an object — a guaranteed dead end, created
--      successfully.
--
-- Separately, every existing failure surfaced as raw PostgreSQL text
-- ('only finalized owner_generated_documents may be published to a customer
-- (got draft)'). The owner UI must show German, actionable copy and cannot parse
-- prose, so the RPC now pre-checks the same conditions the trigger enforces and
-- raises STABLE machine codes for them. This is deliberate duplication: the
-- trigger stays the security boundary, the RPC is the message layer in front of it.
--
-- FORWARD-ONLY. No existing applied migration is modified. The function signature
-- is unchanged, so existing grants, revokes and the staging preflight's identity
-- assertions continue to match exactly.
--
-- ERROR CONTRACT
-- --------------
-- Validation failures raise with a STABLE snake_case machine code as the message
-- and German owner-facing copy as the hint. The browser maps the code; it never
-- renders the raw message. Codes are additive-only.
-- =============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. Duplicate-pointer backstop.
--
-- At most one LIVE pointer per (organization, canonical document). Archived rows
-- are excluded so retiring a published document and later re-registering it is
-- still possible. This is a backstop: the RPC below converges instead of
-- colliding, and is the only path that writes pointer rows.
--
-- The index is created only after a pre-check that reports any pre-existing
-- offender by id. A bare CREATE UNIQUE INDEX on a database that already contains
-- duplicates fails with an opaque "could not create unique index" and no way to
-- act on it; deployment needs to know exactly which rows to archive, and this
-- migration must never silently pick a winner and archive customer-visible rows
-- on its own.
-- ---------------------------------------------------------------------------
do $$
declare
  v_offenders text;
begin
  select string_agg(
           format('owner_generated_document_id=%s organization_id=%s customer_documents=[%s]',
                  d.owner_generated_document_id, d.organization_id, d.ids),
           E'\n')
    into v_offenders
  from (
    select cd.organization_id,
           cd.owner_generated_document_id,
           string_agg(cd.id::text, ', ' order by cd.id) as ids
    from public.customer_documents cd
    where cd.owner_generated_document_id is not null
      and cd.archived_at is null
    group by cd.organization_id, cd.owner_generated_document_id
    having count(*) > 1
  ) d;

  if v_offenders is not null then
    raise exception using
      errcode = '23505',
      message = 'duplicate live customer_documents pointers exist; resolve before applying',
      detail  = v_offenders,
      hint    = 'Archive the redundant pointer rows with archive_customer_document(<id>) — keep the one the customer already downloaded — then re-apply this migration.';
  end if;
end $$;

create unique index customer_documents_owner_source_live_unique
  on public.customer_documents (organization_id, owner_generated_document_id)
  where owner_generated_document_id is not null and archived_at is null;

comment on index public.customer_documents_owner_source_live_unique is
  'At most one live (non-archived) customer pointer per canonical owner PDF per organization. Backstop for register_customer_document_from_owner_source, which converges rather than colliding.';

-- ---------------------------------------------------------------------------
-- 2. Category <-> source classification.
--
-- MIRRORS customer_documents_source_consistency_guard exactly. Extracted as a
-- function so the RPC's pre-check and the trigger's enforcement cannot drift
-- apart silently, and so a test can assert the two agree on every combination.
-- A signed acceptance certificate is stored as document_type='offer' with
-- render_metadata->>'signed' = 'true' (written only by
-- owner_worker_register_certificate, service_role only), so 'offer' and
-- 'acceptance' are distinguished by that flag and nothing else.
--
-- The additional "source offer must actually be accepted" requirement for
-- category='acceptance' is NOT expressible here (it depends on owner_offers state,
-- not on the document) and is checked separately in the RPC below. The trigger
-- enforces it either way.
-- ---------------------------------------------------------------------------
create or replace function public.customer_document_category_matches_owner_source(
  p_category public.customer_document_category,
  p_document_type text,
  p_render_metadata jsonb
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case p_category
    -- Billing documents. A credit note / cancellation / payment confirmation is a
    -- billing document too, but list_customer_invoices resolves ONLY
    -- document_type='invoice' as the invoice PDF, so those never masquerade as one.
    when 'invoice' then
      p_document_type in ('invoice', 'credit_note', 'payment_confirmation', 'cancellation_invoice')

    -- An ordinary finalized offer. Never a certificate.
    when 'offer' then
      p_document_type = 'offer'
      and coalesce(p_render_metadata->>'signed', '') <> 'true'

    -- A signed acceptance certificate, and only that. The signed marker is the
    -- system's definition of one (owner_worker_register_certificate writes it, and
    -- isSignedCertificateDocument in the frontend reads exactly this) - matching the
    -- trigger, which does not additionally require certificate_type.
    when 'acceptance' then
      p_document_type = 'offer'
      and coalesce(p_render_metadata->>'signed', '') = 'true'

    -- Every other category belongs to the upload path, not the canonical registry.
    else false
  end;
$$;

comment on function public.customer_document_category_matches_owner_source(public.customer_document_category, text, jsonb) is
  'True when a canonical owner PDF of this document_type may be published under this customer category. Mirrors customer_documents_source_consistency_guard exactly: offer excludes signed certificates, acceptance requires one, invoice covers the four billing types, every other category is upload-only.';

revoke all on function public.customer_document_category_matches_owner_source(public.customer_document_category, text, jsonb) from public, anon;
grant execute on function public.customer_document_category_matches_owner_source(public.customer_document_category, text, jsonb) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3. The validated, idempotent publish RPC.
--
-- Signature, return type, volatility class and grants are unchanged.
--
-- IDEMPOTENT BY DESIGN: registering an already-registered document returns the
-- EXISTING pointer id instead of raising. "Register" is a button an owner can
-- double-click and a request a proxy can retry; the honest outcome of "make this
-- PDF available to this customer" when it already is, is the row that already
-- makes it available. Visibility is never changed here — registering does not
-- release, and re-registering never re-releases something the owner revoked.
-- ---------------------------------------------------------------------------
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
declare
  v_id uuid;
  v_existing_id uuid;
  v_existing_project uuid;
  v_existing_visible boolean;
  v_source record;
  v_source_org uuid;
begin
  if not public.is_platform_admin() then
    raise exception using errcode = '42501', message = 'not authorized';
  end if;

  if p_organization_id is null then
    raise exception using errcode = '22023', message = 'organization_required',
      hint = 'Es wurde keine Organisation übergeben.';
  end if;
  if p_owner_generated_document_id is null then
    raise exception using errcode = '22023', message = 'source_document_required',
      hint = 'Es wurde kein erzeugtes Dokument ausgewählt.';
  end if;
  if length(trim(coalesce(p_title, ''))) = 0 then
    raise exception using errcode = '22023', message = 'title_required',
      hint = 'Bitte geben Sie einen Titel ein.';
  end if;

  -- Serialize check-then-insert for this exact (organization, canonical document)
  -- pair. Two concurrent registrations of the same PDF must produce ONE pointer;
  -- the loser of the race reads the winner's committed row and returns it. Held to
  -- end of transaction, so it also covers the insert itself.
  perform pg_advisory_xact_lock(
    hashtextextended(p_organization_id::text || ':' || p_owner_generated_document_id::text, 0)
  );

  -- ---- Source document must exist, be finalized, and have real bytes ----
  select ogd.id, ogd.source_resource_type, ogd.source_resource_id,
         ogd.document_type, ogd.status, ogd.pdf_storage_path, ogd.render_metadata
    into v_source
  from public.owner_generated_documents ogd
  where ogd.id = p_owner_generated_document_id;

  if not found then
    raise exception using errcode = '22023', message = 'source_document_not_found',
      hint = 'Das erzeugte Dokument wurde nicht gefunden.';
  end if;

  if v_source.status <> 'finalized' then
    raise exception using errcode = '22023', message = 'source_document_not_finalized',
      hint = 'Nur finalisierte PDFs können für das Kundenportal registriert werden. Bitte zuerst „PDF speichern“.';
  end if;

  if v_source.pdf_storage_path is null then
    raise exception using errcode = '22023', message = 'source_document_has_no_pdf',
      hint = 'Für dieses Dokument ist keine PDF-Datei gespeichert. Bitte erneut „PDF speichern“.';
  end if;

  -- ---- The source's organization decides tenancy, never the caller's parameter ----
  -- owner_generated_documents is keyed by business_entity_id and has no
  -- organization_id column; the owning customer lives on the source resource.
  if v_source.source_resource_type = 'owner_offers' then
    select o.organization_id into v_source_org
    from public.owner_offers o where o.id = v_source.source_resource_id;
  elsif v_source.source_resource_type = 'owner_invoices' then
    select i.organization_id into v_source_org
    from public.owner_invoices i where i.id = v_source.source_resource_id;
  else
    raise exception using errcode = '22023', message = 'source_resource_type_unsupported',
      hint = 'Dieser Belegtyp kann nicht im Kundenportal veröffentlicht werden.';
  end if;

  if v_source_org is null then
    raise exception using errcode = '22023', message = 'source_organization_unassigned',
      hint = 'Der zugehörige Beleg ist noch keiner Organisation zugeordnet. Bitte zuerst die Organisation zuweisen.';
  end if;

  if v_source_org <> p_organization_id then
    raise exception using errcode = '22023', message = 'source_organization_mismatch',
      hint = 'Der Beleg gehört zu einem anderen Kunden und kann hier nicht veröffentlicht werden.';
  end if;

  -- ---- Category must match what the document actually is ----
  if not public.customer_document_category_matches_owner_source(
       p_category, v_source.document_type, v_source.render_metadata) then
    raise exception using errcode = '22023', message = 'category_source_mismatch',
      hint = 'Die gewählte Kategorie passt nicht zum Dokumenttyp. Rechnungsbelege gehören zu „Rechnung“, finalisierte Angebote zu „Angebot“, und „Annahmebestätigung“ ist ausschließlich signierten Annahmebestätigungen vorbehalten.';
  end if;

  -- A certificate only proves acceptance if the offer was in fact accepted. Enforced
  -- by the trigger as well; restated so the owner gets an actionable German message
  -- rather than the trigger's raw prose.
  if p_category = 'acceptance'
     and not exists (
       select 1 from public.owner_offers o
       where o.id = v_source.source_resource_id
         and (o.accepted_at is not null or o.status = 'accepted')
     ) then
    raise exception using errcode = '22023', message = 'acceptance_offer_not_accepted',
      hint = 'Das zugehörige Angebot ist nicht als angenommen erfasst. Eine Annahmebestätigung kann erst danach veröffentlicht werden.';
  end if;

  -- ---- Target project, when given, must be a live project of THIS organization ----
  -- The composite FK already makes a cross-organization project impossible; this
  -- turns a constraint-violation string into an actionable message and additionally
  -- refuses an ARCHIVED project, which the FK does not cover.
  if p_project_id is not null then
    if not exists (
      select 1 from public.customer_projects cp
      where cp.id = p_project_id
        and cp.organization_id = p_organization_id
        and cp.is_archived = false
    ) then
      raise exception using errcode = '22023', message = 'project_not_available',
        hint = 'Das ausgewählte Projekt gehört nicht zu diesem Kunden oder ist archiviert.';
    end if;
  end if;

  -- ---- Converge on an existing live pointer instead of duplicating it ----
  select cd.id, cd.project_id, cd.customer_visible
    into v_existing_id, v_existing_project, v_existing_visible
  from public.customer_documents cd
  where cd.organization_id = p_organization_id
    and cd.owner_generated_document_id = p_owner_generated_document_id
    and cd.archived_at is null;

  if v_existing_id is not null then
    -- Re-pointing is allowed only while the document is NOT yet visible to the
    -- customer: moving a released document between projects would make it vanish
    -- from where the customer last saw it. A released document keeps its project.
    if v_existing_visible = false
       and p_project_id is not null
       and v_existing_project is distinct from p_project_id then
      update public.customer_documents
         set project_id = p_project_id, updated_at = now()
       where id = v_existing_id;
    end if;
    return v_existing_id;
  end if;

  begin
    insert into public.customer_documents (
      organization_id, project_id, category, title, owner_generated_document_id, uploaded_by
    )
    values (p_organization_id, p_project_id, p_category, trim(p_title),
            p_owner_generated_document_id, auth.uid())
    returning customer_documents.id into v_id;
  exception when unique_violation then
    -- Unreachable while the advisory lock holds; kept so the backstop index can
    -- never surface as an opaque constraint error to the owner.
    select cd.id into v_id
    from public.customer_documents cd
    where cd.organization_id = p_organization_id
      and cd.owner_generated_document_id = p_owner_generated_document_id
      and cd.archived_at is null;
    if v_id is null then raise; end if;
  end;

  return v_id;
end;
$$;

comment on function public.register_customer_document_from_owner_source(uuid, uuid, public.customer_document_category, text, uuid) is
  'Publish a canonical finalized owner PDF to a customer as a POINTER (never a copy). Validates finalization, stored PDF presence, source organization, category<->document_type and project availability. Idempotent: returns the existing live pointer instead of creating a second one. Never changes visibility.';

-- Grants are unchanged from 20260728121000; restated so a partial deployment
-- cannot leave the replaced function reachable by anon.
revoke all on function public.register_customer_document_from_owner_source(uuid, uuid, public.customer_document_category, text, uuid) from public, anon;
grant execute on function public.register_customer_document_from_owner_source(uuid, uuid, public.customer_document_category, text, uuid) to authenticated;

commit;
