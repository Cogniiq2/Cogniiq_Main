-- =============================================================================
-- Pankofer duplicate-organization reconciliation (forward-only data migration)
-- =============================================================================
-- ROOT CAUSE
-- ----------
-- The client provisioning path (client_provisioning_requests) is idempotent only
-- on a caller-supplied `idempotency_key`, and organization_solutions is unique
-- only on a randomly-suffixed `instance_key`. Nothing keys idempotency on the
-- customer identity itself, so provisioning "Pankofer / Pankofer Zentrale" a
-- second time created a COMPLETE PARALLEL organization tree instead of
-- converging on the existing one:
--
--   61ced4ee-… "Pankofer" status=pending   created 2026-07-21  invite -> v.graus@pankofer.de (never accepted)
--   2b2d106d-… "Pankofer" status=active    created 2026-07-29  invite -> cogniiq4@gmail.com  (ACCEPTED)
--
-- Vanessa accepted the SECOND invitation, so all live portal work (membership,
-- customer project, milestones, document, access events) accumulated under
-- 2b2d106d-…, while all COMMERCIAL work (5 offers + 1 invoice) had already been
-- booked against 61ced4ee-… . Neither org is disposable, hence this migration.
--
-- WHY A PLAIN DELETE OF THE DUPLICATE WOULD LOSE DATA
-- ---------------------------------------------------
-- owner_offers.organization_id and owner_invoices.organization_id are
-- ON DELETE SET NULL. Dropping org 61ced4ee-… without repointing first would
-- silently orphan all 5 offers and the invoice (organization_id -> NULL),
-- detaching them from the customer forever. Every mutation below is ordered so
-- that no FK ever transiently dangles and no commercial row is ever nulled.
--
-- SURVIVOR MAPPING (canonical 2b2d106d-… always wins where a 1:1 constraint
-- forces a single row; nothing is silently discarded):
--   client_account              -> canonical 01beeccf-… survives (client_accounts
--                                  has UNIQUE(organization_id): two rows under one
--                                  org is structurally impossible). Non-null
--                                  commercial fields present only on the duplicate
--                                  (e.g. estimated_total_budget_cents = 8_500_000)
--                                  are COALESCE-backfilled onto the survivor, then
--                                  the duplicate row is deleted. Zero inbound refs.
--   client_contact              -> canonical f2e43f19-… stays PRIMARY. The duplicate
--                                  58baa40a-… carries the real corporate address
--                                  v.graus@pankofer.de, which exists nowhere else,
--                                  so it is RETAINED and repointed to the canonical
--                                  org as a secondary contact (is_primary=false,
--                                  should_invite=false). client_contacts has no
--                                  uniqueness on (organization_id) or email.
--   client_engagement           -> canonical 4b44a7ff-… survives; NULL-only
--                                  backfill from the duplicate (total_budget_cents);
--                                  canonical setup_fee_cents (8_000_000, the newer
--                                  agreed figure) is NEVER overwritten by the
--                                  duplicate's stale 8_500_000. Duplicate
--                                  8c1c8dc3-… deleted after its sole dependent
--                                  (organization_solutions b5ab57ae-…) is gone.
--   client_invitation           -> canonical 66e89640-… (accepted) survives. The
--                                  duplicate 567bbe01-… is still `pending` and
--                                  would become a live invite link into a deleted
--                                  org, so it is repointed to the canonical org and
--                                  marked `revoked` — the historical record is kept
--                                  without leaving a second actionable owner invite.
--   client_provisioning_request -> BOTH retained. This table is the provisioning
--                                  audit/idempotency ledger; the duplicate
--                                  fe3ac3b0-… is repointed to the canonical org so
--                                  the mis-provisioning stays attributable. Its
--                                  `result` jsonb is a point-in-time snapshot, not
--                                  an FK, and is deliberately left byte-identical.
--   organization_portal_settings-> canonical row survives (PRIMARY KEY is
--                                  organization_id — one row per org, period).
--                                  Duplicate row deleted; it only pointed at the
--                                  duplicate solution, so nothing is lost.
--   organization_solution       -> canonical 24610c27-… survives. Duplicate
--                                  b5ab57ae-… deleted: same catalog_key and
--                                  display_name, pointing at the deleted duplicate
--                                  engagement — retaining it would render a
--                                  duplicate "Pankofer Zentrale" nav entry in
--                                  Vanessa's portal.
--
-- PRESERVED, UNCONDITIONALLY:
--   * Vanessa's active membership (543f8fd2-…) and every canonical portal row.
--   * All 5 offers + their 5 offer_lines, 5 offer_versions and 5 access tokens.
--   * The invoice + its 1 invoice_line (and the offer->invoice conversion link).
--   * Every generated PDF: owner_generated_documents is keyed by
--     business_entity_id and has NO organization_id column at all, so it is
--     structurally untouched by this migration.
--   * All audit/history: owner_audit_log (282 rows referencing the duplicate) has
--     no organization_id and no FK to organizations — deleting the org cannot
--     cascade into it. Left byte-identical.
--   * auth.users is NEVER read or written here.
--
-- SAFETY MODEL: single transaction; every expected id, relationship and row count
-- is asserted BEFORE the first mutation and re-verified after, and a dynamic sweep
-- over every FK in the database that references public.organizations must report
-- zero residual rows before the duplicate org row is dropped. Any deviation raises
-- and rolls the whole thing back. Re-running after a successful apply is a
-- verified no-op, not a second mutation.
-- =============================================================================

begin;

do $$
declare
  -- ---- hard-coded subjects -------------------------------------------------
  c_canonical   uuid := '2b2d106d-1755-4601-b797-1ebe8fb8a88e';
  c_source      uuid := '61ced4ee-ab22-4d4f-8517-d7e5341be19f';

  c_src_account    uuid := '02ef549a-f1ca-40b1-8e02-e401d80e2e70';
  c_src_contact    uuid := '58baa40a-904b-4604-89cb-92803f67cfb4';
  c_src_engagement uuid := '8c1c8dc3-3bdd-4694-aadc-f88b427620b8';
  c_src_invitation uuid := '567bbe01-308c-4bf0-84ea-2a8d06de06d0';
  c_src_solution   uuid := 'b5ab57ae-ec64-4e4b-95b1-4ddd2eb9ce02';
  c_src_provkey    uuid := 'fe3ac3b0-b39a-46d4-afff-7b06f4ac8341';

  c_can_account    uuid := '01beeccf-9e00-4dc5-80f1-fe749e3e3ebd';
  c_can_contact    uuid := 'f2e43f19-c408-4dd4-bd94-eead6d9bcc0c';
  c_can_engagement uuid := '4b44a7ff-c592-49a1-8939-5a7f6f1f3641';
  c_can_invitation uuid := '66e89640-8ef5-4fac-8a2b-a16c6a987e3f';
  c_can_solution   uuid := '24610c27-372d-44cd-8187-25256df529f1';
  c_can_provkey    uuid := 'be3c5346-6cf6-458f-8195-8dcbf8911525';
  c_can_member     uuid := '543f8fd2-facc-4b2c-a092-b28195bf9a78';
  c_can_project    uuid := '8ae30fce-2615-4631-9abe-3f861dc7fe30';
  c_can_document   uuid := '482ac2e8-2326-490c-8985-c2ab8ad0ddfe';

  c_src_invoice        uuid := '9d7184ff-080d-498c-93c5-2fcb38a5b436';
  c_src_offer_converted uuid := 'd930bf70-928f-45de-8d56-c3555f2f98c4';
  c_src_offers uuid[] := array[
    '5f2a000b-a9ea-4517-94b9-cc3ec04b7665'::uuid,  -- AN-2026-0001 finalized
    '86ed194d-86a8-4c18-a5fa-dc8139286e91'::uuid,  -- AN-2026-0002 sent
    '38a7b817-a16c-4376-b3c6-91166d056566'::uuid,  -- AN-2026-0003 viewed
    '2ab5248a-1a52-48c2-86c9-b014708b0c65'::uuid,  -- AN-2026-0004 finalized
    'd930bf70-928f-45de-8d56-c3555f2f98c4'::uuid   -- AN-2026-0005 converted
  ];

  v_n         bigint;
  v_expected  bigint;
  v_rec       record;
  v_residual  bigint;
  v_total_residual bigint := 0;
begin
  -- =========================================================================
  -- PHASE 0 — identify the database state; refuse to guess.
  -- =========================================================================
  if not exists (select 1 from public.organizations where id = c_canonical) then
    raise exception
      'ABORT: canonical organization % not present. This migration is bound to one specific database; refusing to run.',
      c_canonical;
  end if;

  if not exists (select 1 from public.organizations where id = c_source) then
    -- Already reconciled (or a database that never had the duplicate). Verify
    -- there is genuinely no residue, then no-op instead of mutating anything.
    for v_rec in
      select cl.relname as tbl, att.attname as col
      from pg_constraint con
      join pg_class cl on cl.oid = con.conrelid
      join pg_attribute att on att.attrelid = con.conrelid and att.attnum = con.conkey[1]
      where con.contype = 'f'
        and con.confrelid = 'public.organizations'::regclass
        and cardinality(con.conkey) = 1
        and cl.relnamespace = 'public'::regnamespace
    loop
      execute format('select count(*) from public.%I where %I = $1', v_rec.tbl, v_rec.col)
        into v_residual using c_source;
      if v_residual <> 0 then
        raise exception
          'ABORT: duplicate organization % is gone but %.% still holds % row(s) referencing it. Manual review required.',
          c_source, v_rec.tbl, v_rec.col, v_residual;
      end if;
    end loop;
    raise notice 'Pankofer reconciliation: duplicate organization % already absent and no residual references found — no-op.', c_source;
    return;
  end if;

  -- =========================================================================
  -- PHASE 1 — assert the EXACT expected topology. Any drift aborts everything.
  -- =========================================================================

  -- 1a. Both orgs are the Pankofer pair we expect, in the states we expect.
  perform 1 from public.organizations
    where id = c_source and name = 'Pankofer' and status = 'pending';
  if not found then
    raise exception 'ABORT: duplicate organization % is not the expected pending "Pankofer" row.', c_source;
  end if;
  perform 1 from public.organizations
    where id = c_canonical and name = 'Pankofer' and status = 'active';
  if not found then
    raise exception 'ABORT: canonical organization % is not the expected active "Pankofer" row.', c_canonical;
  end if;

  -- 1b. Exact duplicated-entity ids on the duplicate side.
  perform 1 from public.client_accounts where id = c_src_account and organization_id = c_source;
  if not found then raise exception 'ABORT: duplicate client_account % not found under %.', c_src_account, c_source; end if;
  perform 1 from public.client_contacts where id = c_src_contact and organization_id = c_source and is_primary;
  if not found then raise exception 'ABORT: duplicate client_contact % not found under %.', c_src_contact, c_source; end if;
  perform 1 from public.client_engagements where id = c_src_engagement and organization_id = c_source;
  if not found then raise exception 'ABORT: duplicate client_engagement % not found under %.', c_src_engagement, c_source; end if;
  perform 1 from public.client_invitations
    where id = c_src_invitation and organization_id = c_source and status = 'pending' and accepted_user_id is null;
  if not found then
    raise exception 'ABORT: duplicate client_invitation % is not the expected unaccepted pending invite.', c_src_invitation;
  end if;
  perform 1 from public.client_provisioning_requests where idempotency_key = c_src_provkey and organization_id = c_source;
  if not found then raise exception 'ABORT: duplicate client_provisioning_request % not found under %.', c_src_provkey, c_source; end if;
  perform 1 from public.organization_solutions where id = c_src_solution and organization_id = c_source and engagement_id = c_src_engagement;
  if not found then raise exception 'ABORT: duplicate organization_solution % not wired to engagement % as expected.', c_src_solution, c_src_engagement; end if;
  perform 1 from public.organization_portal_settings where organization_id = c_source and default_solution_id = c_src_solution;
  if not found then raise exception 'ABORT: duplicate organization_portal_settings row does not default to solution %.', c_src_solution; end if;

  -- 1c. Exact surviving-entity ids on the canonical side.
  perform 1 from public.client_accounts where id = c_can_account and organization_id = c_canonical;
  if not found then raise exception 'ABORT: canonical client_account % not found.', c_can_account; end if;
  perform 1 from public.client_contacts where id = c_can_contact and organization_id = c_canonical and is_primary;
  if not found then raise exception 'ABORT: canonical primary client_contact % not found.', c_can_contact; end if;
  perform 1 from public.client_engagements where id = c_can_engagement and organization_id = c_canonical;
  if not found then raise exception 'ABORT: canonical client_engagement % not found.', c_can_engagement; end if;
  perform 1 from public.client_invitations
    where id = c_can_invitation and organization_id = c_canonical and status = 'accepted' and accepted_user_id is not null;
  if not found then raise exception 'ABORT: canonical client_invitation % is not in the expected accepted state.', c_can_invitation; end if;
  perform 1 from public.client_provisioning_requests where idempotency_key = c_can_provkey and organization_id = c_canonical;
  if not found then raise exception 'ABORT: canonical client_provisioning_request % not found.', c_can_provkey; end if;
  perform 1 from public.organization_solutions where id = c_can_solution and organization_id = c_canonical and engagement_id = c_can_engagement;
  if not found then raise exception 'ABORT: canonical organization_solution % not wired to engagement %.', c_can_solution, c_can_engagement; end if;
  perform 1 from public.organization_portal_settings where organization_id = c_canonical and default_solution_id = c_can_solution;
  if not found then raise exception 'ABORT: canonical organization_portal_settings row does not default to solution %.', c_can_solution; end if;

  -- 1d. The live portal data we must not disturb: exact ids AND exact counts.
  perform 1 from public.organization_members
    where id = c_can_member and organization_id = c_canonical and role = 'owner' and status = 'active';
  if not found then raise exception 'ABORT: Vanessa''s active owner membership % not found under %.', c_can_member, c_canonical; end if;

  select count(*) into v_n from public.organization_members where organization_id = c_canonical and status = 'active';
  if v_n <> 1 then raise exception 'ABORT: expected exactly 1 active member under %, found %.', c_canonical, v_n; end if;
  select count(*) into v_n from public.organization_members where organization_id = c_source;
  if v_n <> 0 then raise exception 'ABORT: expected 0 members under duplicate %, found %.', c_source, v_n; end if;

  perform 1 from public.customer_projects where id = c_can_project and organization_id = c_canonical;
  if not found then raise exception 'ABORT: canonical customer_project % not found.', c_can_project; end if;
  select count(*) into v_n from public.customer_projects where organization_id = c_canonical;
  if v_n <> 1 then raise exception 'ABORT: expected exactly 1 customer_project under %, found %.', c_canonical, v_n; end if;
  select count(*) into v_n from public.customer_projects where organization_id = c_source;
  if v_n <> 0 then raise exception 'ABORT: expected 0 customer_projects under duplicate %, found %.', c_source, v_n; end if;

  select count(*) into v_n from public.customer_project_milestones
    where organization_id = c_canonical and project_id = c_can_project;
  if v_n <> 3 then raise exception 'ABORT: expected exactly 3 milestones under %, found %.', c_canonical, v_n; end if;

  perform 1 from public.customer_documents
    where id = c_can_document and organization_id = c_canonical and project_id = c_can_project;
  if not found then raise exception 'ABORT: canonical customer_document % not found.', c_can_document; end if;
  select count(*) into v_n from public.customer_documents where organization_id = c_canonical;
  if v_n <> 1 then raise exception 'ABORT: expected exactly 1 customer_document under %, found %.', c_canonical, v_n; end if;

  select count(*) into v_n from public.customer_document_access_events
    where organization_id = c_canonical and document_id = c_can_document;
  if v_n <> 2 then raise exception 'ABORT: expected exactly 2 document access events under %, found %.', c_canonical, v_n; end if;

  -- 1e. Commercial data: exactly the 5 known offers and 1 known invoice, all on
  --     the duplicate, none on the canonical org (so post-move counts are exact).
  select count(*) into v_n from public.owner_offers where organization_id = c_source;
  if v_n <> 5 then raise exception 'ABORT: expected exactly 5 offers under duplicate %, found %.', c_source, v_n; end if;
  select count(*) into v_n from public.owner_offers where organization_id = c_source and id = any(c_src_offers);
  if v_n <> 5 then raise exception 'ABORT: the 5 offers under % are not the 5 expected offer ids.', c_source; end if;
  select count(*) into v_n from public.owner_offers where organization_id = c_canonical;
  if v_n <> 0 then raise exception 'ABORT: expected 0 offers already under canonical %, found %.', c_canonical, v_n; end if;

  select count(*) into v_n from public.owner_invoices where organization_id = c_source;
  if v_n <> 1 then raise exception 'ABORT: expected exactly 1 invoice under duplicate %, found %.', c_source, v_n; end if;
  perform 1 from public.owner_invoices where id = c_src_invoice and organization_id = c_source;
  if not found then raise exception 'ABORT: expected invoice % under duplicate %.', c_src_invoice, c_source; end if;
  select count(*) into v_n from public.owner_invoices where organization_id = c_canonical;
  if v_n <> 0 then raise exception 'ABORT: expected 0 invoices already under canonical %, found %.', c_canonical, v_n; end if;

  -- 1f. The offer -> invoice conversion link must be the one we mapped.
  perform 1 from public.owner_offers
    where id = c_src_offer_converted and status = 'converted' and converted_invoice_id = c_src_invoice;
  if not found then
    raise exception 'ABORT: offer % is no longer the converted offer pointing at invoice %.', c_src_offer_converted, c_src_invoice;
  end if;

  -- 1g. CRITICAL mapping precondition: these offers/invoice reference the
  --     duplicate ONLY through organization_id. If anyone has since linked them
  --     to the duplicate's client_account or engagement, the survivor mapping
  --     below is incomplete and must be re-derived by hand rather than guessed.
  select count(*) into v_n from public.owner_offers
    where organization_id = c_source and (client_account_id is not null or engagement_id is not null);
  if v_n <> 0 then
    raise exception 'ABORT: % offer(s) under % now carry client_account_id/engagement_id; mapping must be re-derived manually.', v_n, c_source;
  end if;
  select count(*) into v_n from public.owner_invoices
    where organization_id = c_source and (client_account_id is not null or engagement_id is not null);
  if v_n <> 0 then
    raise exception 'ABORT: invoice under % now carries client_account_id/engagement_id; mapping must be re-derived manually.', c_source;
  end if;

  -- 1h. Nothing anywhere points at the duplicate rows we are about to delete.
  select (select count(*) from public.owner_customers          where client_account_id = c_src_account)
       + (select count(*) from public.owner_expenses           where client_account_id = c_src_account)
       + (select count(*) from public.owner_finance_documents  where client_account_id = c_src_account)
       + (select count(*) from public.owner_invoices           where client_account_id = c_src_account)
       + (select count(*) from public.owner_offers             where client_account_id = c_src_account)
       + (select count(*) from public.owner_payments           where client_account_id = c_src_account)
       + (select count(*) from public.owner_subscriptions      where client_account_id = c_src_account)
    into v_n;
  if v_n <> 0 then
    raise exception 'ABORT: % row(s) still reference duplicate client_account %; refusing to delete it.', v_n, c_src_account;
  end if;

  select (select count(*) from public.customer_projects     where engagement_id = c_src_engagement)
       + (select count(*) from public.owner_expenses        where engagement_id = c_src_engagement)
       + (select count(*) from public.owner_invoices        where engagement_id = c_src_engagement)
       + (select count(*) from public.owner_offers          where engagement_id = c_src_engagement)
       + (select count(*) from public.owner_subscriptions   where engagement_id = c_src_engagement)
    into v_n;
  if v_n <> 0 then
    raise exception 'ABORT: % non-solution row(s) still reference duplicate engagement %; refusing to delete it.', v_n, c_src_engagement;
  end if;

  -- The duplicate solution may only be referenced by the duplicate portal-settings
  -- row (deleted first, below). Anything else means an unmapped dependency.
  select count(*) into v_n from public.organization_portal_settings
    where default_solution_id = c_src_solution and organization_id <> c_source;
  if v_n <> 0 then
    raise exception 'ABORT: % portal-settings row(s) outside % default to duplicate solution %.', v_n, c_source, c_src_solution;
  end if;

  raise notice 'Pankofer reconciliation: all preconditions asserted; proceeding.';

  -- =========================================================================
  -- PHASE 2 — mutations, in FK-safe order (repoint before delete, always).
  -- =========================================================================

  -- 2a. COMMERCIAL DATA FIRST. Must happen before the org row is dropped or the
  --     ON DELETE SET NULL FKs would orphan all 6 documents. Offer/invoice ids,
  --     numbers, statuses, totals, lines, versions, access tokens and the
  --     conversion link are all untouched — only the tenant column moves.
  update public.owner_offers
     set organization_id = c_canonical, updated_at = now()
   where organization_id = c_source;
  get diagnostics v_n = row_count;
  if v_n <> 5 then raise exception 'ABORT: offer repoint touched % row(s), expected 5.', v_n; end if;

  update public.owner_invoices
     set organization_id = c_canonical, updated_at = now()
   where organization_id = c_source;
  get diagnostics v_n = row_count;
  if v_n <> 1 then raise exception 'ABORT: invoice repoint touched % row(s), expected 1.', v_n; end if;

  -- 2b. Retain the duplicate contact for its corporate email, demoted to
  --     secondary so the canonical primary contact stays unambiguous.
  update public.client_contacts
     set organization_id = c_canonical,
         is_primary      = false,
         should_invite    = false,
         internal_notes  = concat_ws(' ',
           nullif(internal_notes, ''),
           format('[reconciliation] Retained from duplicate organization %s (provisioned 2026-07-21); demoted to secondary contact.', c_source)),
         updated_at      = now()
   where id = c_src_contact;
  get diagnostics v_n = row_count;
  if v_n <> 1 then raise exception 'ABORT: contact repoint touched % row(s), expected 1.', v_n; end if;

  -- 2c. Retain the duplicate invitation as history, revoked so it cannot be
  --     claimed as a second owner invite. (Never touches auth.users.)
  update public.client_invitations
     set organization_id = c_canonical,
         status          = 'revoked',
         updated_at      = now()
   where id = c_src_invitation;
  get diagnostics v_n = row_count;
  if v_n <> 1 then raise exception 'ABORT: invitation repoint touched % row(s), expected 1.', v_n; end if;

  -- 2d. Keep the provisioning ledger entry attributable. `result` is a historical
  --     snapshot and is deliberately NOT rewritten.
  update public.client_provisioning_requests
     set organization_id = c_canonical
   where idempotency_key = c_src_provkey;
  get diagnostics v_n = row_count;
  if v_n <> 1 then raise exception 'ABORT: provisioning-request repoint touched % row(s), expected 1.', v_n; end if;

  -- 2e. NULL-ONLY backfill onto the surviving client_account. COALESCE(survivor,
  --     duplicate) can only fill a gap — it can never overwrite a value the
  --     canonical row already has.
  update public.client_accounts can
     set primary_contact_name          = coalesce(can.primary_contact_name, src.primary_contact_name),
         phone                         = coalesce(can.phone, src.phone),
         website                       = coalesce(can.website, src.website),
         industry                      = coalesce(can.industry, src.industry),
         address                       = coalesce(can.address, src.address),
         lead_source                   = coalesce(can.lead_source, src.lead_source),
         internal_notes                = coalesce(can.internal_notes, src.internal_notes),
         internal_owner                = coalesce(can.internal_owner, src.internal_owner),
         estimated_total_budget_cents  = coalesce(can.estimated_total_budget_cents, src.estimated_total_budget_cents),
         estimated_monthly_value_cents = coalesce(can.estimated_monthly_value_cents, src.estimated_monthly_value_cents),
         updated_at                    = now()
    from public.client_accounts src
   where can.id = c_can_account and src.id = c_src_account;
  get diagnostics v_n = row_count;
  if v_n <> 1 then raise exception 'ABORT: client_account backfill touched % row(s), expected 1.', v_n; end if;

  -- 2f. NULL-ONLY backfill onto the surviving engagement. Note setup_fee_cents is
  --     intentionally ABSENT: the canonical 8_000_000 is the current agreed figure
  --     and must not be reverted to the duplicate's stale 8_500_000.
  update public.client_engagements can
     set total_budget_cents   = coalesce(can.total_budget_cents, src.total_budget_cents),
         recurring_fee_cents  = coalesce(can.recurring_fee_cents, src.recurring_fee_cents),
         start_date           = coalesce(can.start_date, src.start_date),
         target_go_live_date  = coalesce(can.target_go_live_date, src.target_go_live_date),
         internal_owner       = coalesce(can.internal_owner, src.internal_owner),
         notes                = coalesce(can.notes, src.notes),
         updated_at           = now()
    from public.client_engagements src
   where can.id = c_can_engagement and src.id = c_src_engagement;
  get diagnostics v_n = row_count;
  if v_n <> 1 then raise exception 'ABORT: client_engagement backfill touched % row(s), expected 1.', v_n; end if;

  -- 2g. Now the deletes, innermost dependency first.
  --     portal_settings -> organization_solutions -> client_engagements
  delete from public.organization_portal_settings where organization_id = c_source;
  get diagnostics v_n = row_count;
  if v_n <> 1 then raise exception 'ABORT: duplicate portal-settings delete removed % row(s), expected 1.', v_n; end if;

  delete from public.organization_solutions where organization_id = c_source;
  get diagnostics v_n = row_count;
  if v_n <> 1 then raise exception 'ABORT: duplicate organization_solutions delete removed % row(s), expected 1.', v_n; end if;

  delete from public.client_engagements where organization_id = c_source;
  get diagnostics v_n = row_count;
  if v_n <> 1 then raise exception 'ABORT: duplicate client_engagements delete removed % row(s), expected 1.', v_n; end if;

  delete from public.client_accounts where organization_id = c_source;
  get diagnostics v_n = row_count;
  if v_n <> 1 then raise exception 'ABORT: duplicate client_accounts delete removed % row(s), expected 1.', v_n; end if;

  -- =========================================================================
  -- PHASE 3 — prove ZERO residual references, then drop the duplicate org.
  -- =========================================================================
  -- Dynamic sweep: every single-column FK in the database that targets
  -- public.organizations, discovered from the catalog rather than hard-coded, so
  -- a table added after this migration was written cannot be silently missed.
  for v_rec in
    select cl.relname as tbl, att.attname as col
    from pg_constraint con
    join pg_class cl on cl.oid = con.conrelid
    join pg_attribute att on att.attrelid = con.conrelid and att.attnum = con.conkey[1]
    where con.contype = 'f'
      and con.confrelid = 'public.organizations'::regclass
      and cardinality(con.conkey) = 1
      and cl.relnamespace = 'public'::regnamespace
    order by cl.relname
  loop
    execute format('select count(*) from public.%I where %I = $1', v_rec.tbl, v_rec.col)
      into v_residual using c_source;
    if v_residual <> 0 then
      raise exception
        'ABORT: %.% still holds % row(s) referencing duplicate organization % after reconciliation.',
        v_rec.tbl, v_rec.col, v_residual, c_source;
    end if;
    v_total_residual := v_total_residual + v_residual;
  end loop;

  if v_total_residual <> 0 then
    raise exception 'ABORT: residual reference sweep returned % row(s).', v_total_residual;
  end if;

  -- Fully safe: no FK anywhere resolves to the duplicate org, and the tables that
  -- retain historical mentions of it (owner_audit_log, and the `result` snapshot
  -- in client_provisioning_requests) hold plain text/jsonb with no FK to
  -- organizations, so they survive the delete untouched. Therefore the duplicate
  -- organization row is deleted rather than archived.
  delete from public.organizations where id = c_source;
  get diagnostics v_n = row_count;
  if v_n <> 1 then raise exception 'ABORT: duplicate organization delete removed % row(s), expected 1.', v_n; end if;

  -- =========================================================================
  -- PHASE 4 — post-state verification. Nothing lost, nothing duplicated.
  -- =========================================================================
  if exists (select 1 from public.organizations where id = c_source) then
    raise exception 'ABORT: duplicate organization % still exists.', c_source;
  end if;
  if not exists (select 1 from public.organizations where id = c_canonical and status = 'active') then
    raise exception 'ABORT: canonical organization % is no longer an active row.', c_canonical;
  end if;

  -- Commercial data: all 6 documents now under the canonical org, ids intact.
  select count(*) into v_n from public.owner_offers
    where organization_id = c_canonical and id = any(c_src_offers);
  if v_n <> 5 then raise exception 'POST-CHECK FAILED: expected all 5 offers under %, found %.', c_canonical, v_n; end if;
  select count(*) into v_n from public.owner_offers where organization_id = c_canonical;
  if v_n <> 5 then raise exception 'POST-CHECK FAILED: canonical org holds % offers, expected exactly 5.', v_n; end if;
  select count(*) into v_n from public.owner_offers where organization_id is null and id = any(c_src_offers);
  if v_n <> 0 then raise exception 'POST-CHECK FAILED: % offer(s) were orphaned to a NULL organization.', v_n; end if;

  perform 1 from public.owner_invoices where id = c_src_invoice and organization_id = c_canonical;
  if not found then raise exception 'POST-CHECK FAILED: invoice % is not under canonical org %.', c_src_invoice, c_canonical; end if;
  select count(*) into v_n from public.owner_invoices where organization_id = c_canonical;
  if v_n <> 1 then raise exception 'POST-CHECK FAILED: canonical org holds % invoices, expected exactly 1.', v_n; end if;

  -- The conversion link must still resolve.
  perform 1 from public.owner_offers o
    join public.owner_invoices i on i.id = o.converted_invoice_id
   where o.id = c_src_offer_converted and i.id = c_src_invoice
     and o.organization_id = c_canonical and i.organization_id = c_canonical;
  if not found then raise exception 'POST-CHECK FAILED: offer->invoice conversion link no longer resolves within the canonical org.'; end if;

  -- Commercial line items and access artefacts survived intact.
  select count(*) into v_n from public.owner_offer_lines where offer_id = any(c_src_offers);
  if v_n <> 5 then raise exception 'POST-CHECK FAILED: expected 5 offer lines, found %.', v_n; end if;
  select count(*) into v_n from public.owner_offer_versions where offer_id = any(c_src_offers);
  if v_n <> 5 then raise exception 'POST-CHECK FAILED: expected 5 offer versions, found %.', v_n; end if;
  select count(*) into v_n from public.owner_document_access_tokens where offer_id = any(c_src_offers);
  if v_n <> 5 then raise exception 'POST-CHECK FAILED: expected 5 offer access tokens, found %.', v_n; end if;
  select count(*) into v_n from public.owner_invoice_lines where invoice_id = c_src_invoice;
  if v_n <> 1 then raise exception 'POST-CHECK FAILED: expected 1 invoice line, found %.', v_n; end if;

  -- Live portal data untouched.
  perform 1 from public.organization_members
    where id = c_can_member and organization_id = c_canonical and role = 'owner' and status = 'active';
  if not found then raise exception 'POST-CHECK FAILED: Vanessa''s active owner membership was disturbed.'; end if;
  select count(*) into v_n from public.customer_projects where organization_id = c_canonical;
  if v_n <> 1 then raise exception 'POST-CHECK FAILED: expected 1 customer_project, found %.', v_n; end if;
  select count(*) into v_n from public.customer_project_milestones where organization_id = c_canonical;
  if v_n <> 3 then raise exception 'POST-CHECK FAILED: expected 3 milestones, found %.', v_n; end if;
  select count(*) into v_n from public.customer_documents where organization_id = c_canonical;
  if v_n <> 1 then raise exception 'POST-CHECK FAILED: expected 1 customer_document, found %.', v_n; end if;
  select count(*) into v_n from public.customer_document_access_events where organization_id = c_canonical;
  if v_n <> 2 then raise exception 'POST-CHECK FAILED: expected 2 document access events, found %.', v_n; end if;

  -- Exactly one of each 1:1 entity; retained history present but not duplicated.
  select count(*) into v_n from public.client_accounts where organization_id = c_canonical;
  if v_n <> 1 then raise exception 'POST-CHECK FAILED: expected 1 client_account, found %.', v_n; end if;
  select count(*) into v_n from public.organization_portal_settings where organization_id = c_canonical;
  if v_n <> 1 then raise exception 'POST-CHECK FAILED: expected 1 portal_settings row, found %.', v_n; end if;
  select count(*) into v_n from public.organization_solutions where organization_id = c_canonical;
  if v_n <> 1 then raise exception 'POST-CHECK FAILED: expected 1 organization_solution, found %.', v_n; end if;
  select count(*) into v_n from public.client_engagements where organization_id = c_canonical;
  if v_n <> 1 then raise exception 'POST-CHECK FAILED: expected 1 client_engagement, found %.', v_n; end if;

  select count(*) into v_n from public.client_contacts where organization_id = c_canonical;
  if v_n <> 2 then raise exception 'POST-CHECK FAILED: expected 2 client_contacts (primary + retained), found %.', v_n; end if;
  select count(*) into v_n from public.client_contacts where organization_id = c_canonical and is_primary;
  if v_n <> 1 then raise exception 'POST-CHECK FAILED: expected exactly 1 primary contact, found %.', v_n; end if;

  select count(*) into v_n from public.client_invitations where organization_id = c_canonical;
  if v_n <> 2 then raise exception 'POST-CHECK FAILED: expected 2 client_invitations (accepted + revoked), found %.', v_n; end if;
  select count(*) into v_n from public.client_invitations
    where organization_id = c_canonical and status = 'pending';
  if v_n <> 0 then raise exception 'POST-CHECK FAILED: % pending invitation(s) remain; the duplicate invite must be revoked.', v_n; end if;

  select count(*) into v_n from public.client_provisioning_requests where organization_id = c_canonical;
  if v_n <> 2 then raise exception 'POST-CHECK FAILED: expected 2 provisioning-request rows, found %.', v_n; end if;

  -- The canonical engagement must not have had its agreed setup fee rewritten.
  perform 1 from public.client_engagements where id = c_can_engagement and setup_fee_cents = 8000000;
  if not found then raise exception 'POST-CHECK FAILED: canonical engagement setup_fee_cents was modified.'; end if;

  raise notice 'Pankofer reconciliation: complete. 5 offers + 1 invoice + all portal data consolidated under %; duplicate % deleted.', c_canonical, c_source;
end $$;

commit;
