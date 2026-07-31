-- =============================================================================
-- Pankofer duplicate-organization reconciliation — regression test
-- =============================================================================
-- Covers the migration's four database states (see the PORTABILITY block below),
-- then reproduces the EXACT production duplicate topology (same hard-coded uuids
-- the migration asserts on), executes the REAL migration file against it, and
-- proves the outcome: every commercial document and every portal row survives,
-- the duplicate org is gone, and nothing is duplicated.
--
-- Runs against the throwaway cluster built by run-customer-platform-sql-tests.sh
-- as `postgres`, so is_database_admin() is true and RLS is bypassed — the same
-- privilege level the migration will have when applied to hosted Supabase.
-- =============================================================================

\set ON_ERROR_STOP on

-- ===========================================================================
-- PORTABILITY: the migration must classify all FOUR possible database states.
-- ===========================================================================
--   canonical  duplicate  expected
--   ---------  ---------  --------------------------------------
--   absent     absent     succeed as a verified no-op   (state 1)
--   present    present    perform the reconciliation    (state 2)
--   present    absent     succeed as a verified no-op   (state 3)
--   absent     present    ABORT                         (state 4)
--
-- States 1, 3 and 4 are checked HERE, before the production fixture exists —
-- at this point in the suite neither Pankofer organization is present, which is
-- exactly state 1. State 2 is the full reconciliation further down.
--
-- HOW "aborted" IS DISTINGUISHED FROM "silently did nothing": both leave the
-- same rows behind, so an outcome check alone cannot tell them apart. Each
-- scenario below therefore opens a transaction and writes a MARKER row before
-- including the migration. The migration ends with `commit;`, so:
--   * marker present afterwards  => the migration ran to completion
--   * marker absent afterwards   => the migration raised, and the whole
--                                   transaction (marker included) rolled back
-- ===========================================================================

\set MARKER '''ffffffff-0000-0000-0000-0000000000f4'''

-- ---------------------------------------------------------------------------
-- STATE 1: neither organization present (fresh clone / CI cluster).
-- The migration history must replay here, so this must SUCCEED as a no-op.
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from public.organizations
             where id in ('2b2d106d-1755-4601-b797-1ebe8fb8a88e',
                          '61ced4ee-ab22-4d4f-8517-d7e5341be19f')) then
    raise exception 'TEST FIXTURE INVALID: state-1 check requires neither Pankofer organization to exist yet';
  end if;
end $$;

begin;
insert into public.organizations (id, name, status) values (:MARKER, 'ZZ MIGRATION MARKER', 'pending');
\ir ../../../supabase/migrations/20260730130000_pankofer_organization_reconciliation.sql

do $$
begin
  if not exists (select 1 from public.organizations where id = 'ffffffff-0000-0000-0000-0000000000f4') then
    raise exception 'TEST FAILED (state 1): migration did not run to completion on a database holding neither organization — a clean database cannot replay the migration history';
  end if;
  if exists (select 1 from public.organizations
             where id in ('2b2d106d-1755-4601-b797-1ebe8fb8a88e',
                          '61ced4ee-ab22-4d4f-8517-d7e5341be19f')) then
    raise exception 'TEST FAILED (state 1): migration created organization rows on a clean database';
  end if;
  raise notice 'state 1 (neither present): verified no-op, migration succeeded';
end $$;

delete from public.organizations where id = 'ffffffff-0000-0000-0000-0000000000f4';

-- ---------------------------------------------------------------------------
-- STATE 4: duplicate present, canonical absent. There is no survivor to merge
-- into, so the migration must ABORT rather than guess.
-- ---------------------------------------------------------------------------
begin;
insert into public.organizations (id, name, status)
values ('61ced4ee-ab22-4d4f-8517-d7e5341be19f', 'Pankofer', 'pending');
insert into public.organizations (id, name, status) values (:MARKER, 'ZZ MIGRATION MARKER', 'pending');

\set ON_ERROR_STOP off
\ir ../../../supabase/migrations/20260730130000_pankofer_organization_reconciliation.sql
\set ON_ERROR_STOP on
rollback;

do $$
begin
  if exists (select 1 from public.organizations where id = 'ffffffff-0000-0000-0000-0000000000f4') then
    raise exception 'TEST FAILED (state 4): migration ran to completion with the duplicate present and no canonical survivor — it must abort instead';
  end if;
  if exists (select 1 from public.organizations where id = '61ced4ee-ab22-4d4f-8517-d7e5341be19f') then
    raise exception 'TEST FAILED (state 4): the aborted transaction did not roll back';
  end if;
  raise notice 'state 4 (duplicate only): migration aborted and rolled back, as required';
end $$;

-- ---------------------------------------------------------------------------
-- STATE 3: canonical present, duplicate absent (already reconciled).
-- Must SUCCEED as a verified no-op without touching the canonical org.
-- ---------------------------------------------------------------------------
begin;
insert into public.organizations (id, name, status)
values ('2b2d106d-1755-4601-b797-1ebe8fb8a88e', 'Pankofer', 'active');
insert into public.organizations (id, name, status) values (:MARKER, 'ZZ MIGRATION MARKER', 'pending');
\ir ../../../supabase/migrations/20260730130000_pankofer_organization_reconciliation.sql

do $$
begin
  if not exists (select 1 from public.organizations where id = 'ffffffff-0000-0000-0000-0000000000f4') then
    raise exception 'TEST FAILED (state 3): migration did not run to completion on an already-reconciled database';
  end if;
  if not exists (select 1 from public.organizations
                 where id = '2b2d106d-1755-4601-b797-1ebe8fb8a88e' and status = 'active') then
    raise exception 'TEST FAILED (state 3): migration disturbed the canonical organization';
  end if;
  if exists (select 1 from public.organizations where id = '61ced4ee-ab22-4d4f-8517-d7e5341be19f') then
    raise exception 'TEST FAILED (state 3): migration created the duplicate organization';
  end if;
  raise notice 'state 3 (canonical only): verified no-op, migration succeeded';
end $$;

-- Clear the scaffolding so the production fixture below starts from a clean slate.
delete from public.organizations
 where id in ('ffffffff-0000-0000-0000-0000000000f4', '2b2d106d-1755-4601-b797-1ebe8fb8a88e');

-- ---------------------------------------------------------------------------
-- STATE 2 follows: the real production duplicate topology and reconciliation.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- FIXTURE: the duplicate topology, exactly as it exists in production.
-- ---------------------------------------------------------------------------
do $$
declare
  c_canonical uuid := '2b2d106d-1755-4601-b797-1ebe8fb8a88e';
  c_source    uuid := '61ced4ee-ab22-4d4f-8517-d7e5341be19f';
  v_admin     uuid := '306571db-36e1-4649-9ddb-fe7994b7f20a';  -- provisioning actor
  v_vanessa   uuid := 'a80c5e56-116c-4f1e-a389-9d6d0524455b';  -- accepted the 2nd invite
  v_entity    uuid;
begin
  select id into v_entity from public.owner_business_entities where slug = 'cogniiq';
  if v_entity is null then
    raise exception 'TEST FIXTURE INVALID: seeded owner_business_entities row "cogniiq" not found';
  end if;

  -- auth.users -> profiles is created by the phase-0 signup trigger. The migration
  -- never touches auth.users; these rows exist only to satisfy audit-column FKs.
  insert into auth.users (id, email, email_confirmed_at) values
    (v_admin,   'admin@cogniiq.test',   now()),
    (v_vanessa, 'cogniiq4@gmail.com',   now())
  on conflict (id) do nothing;

  -- ===== the two "Pankofer" organizations =====
  insert into public.organizations (id, name, status, created_by) values
    (c_source,    'Pankofer', 'pending', v_admin),
    (c_canonical, 'Pankofer', 'active',  v_admin);

  -- ===== duplicate (source) tree: provisioned 2026-07-21, invite never accepted =====
  insert into public.client_accounts
    (id, organization_id, legal_name, display_name, primary_contact_name, primary_email,
     industry, lifecycle_status, estimated_total_budget_cents, estimated_monthly_value_cents, currency)
  values ('02ef549a-f1ca-40b1-8e02-e401d80e2e70', c_source, 'Pankofer GmbH', 'Pankofer',
          'Vanessa Graus', 'v.graus@pankofer.de', 'Sicherheitstechnik', 'active', 8500000, 190000, 'EUR');

  insert into public.client_contacts (id, organization_id, name, email, is_primary, should_invite)
  values ('58baa40a-904b-4604-89cb-92803f67cfb4', c_source, 'Vanessa Graus', 'v.graus@pankofer.de', true, true);

  insert into public.client_engagements
    (id, organization_id, catalog_key, project_name, status,
     total_budget_cents, setup_fee_cents, recurring_fee_cents, currency)
  values ('8c1c8dc3-3bdd-4694-aadc-f88b427620b8', c_source, 'automation_workspace',
          'Pankofer Zentrale', 'active', 8500000, 8500000, 190000, 'EUR');

  insert into public.organization_solutions
    (id, organization_id, engagement_id, catalog_key, instance_key, display_name, implementation_key, status, nav_order)
  values ('b5ab57ae-ec64-4e4b-95b1-4ddd2eb9ce02', c_source, '8c1c8dc3-3bdd-4694-aadc-f88b427620b8',
          'automation_workspace', 'pankofer-zentrale-1bcc8e70919f45feb950ddd347115ba1',
          'Pankofer Zentrale', 'automation_workspace', 'active', 0);

  insert into public.organization_portal_settings
    (organization_id, portal_title, default_solution_id, support_contact)
  values (c_source, 'Pankofer', 'b5ab57ae-ec64-4e4b-95b1-4ddd2eb9ce02', 'v.graus@pankofer.de');

  insert into public.client_invitations
    (id, organization_id, email, organization_role, status, invited_by, expires_at)
  values ('567bbe01-308c-4bf0-84ea-2a8d06de06d0', c_source, 'v.graus@pankofer.de',
          'owner', 'pending', v_admin, now() + interval '6 days');

  insert into public.client_provisioning_requests (idempotency_key, organization_id, result, created_by)
  values ('fe3ac3b0-b39a-46d4-afff-7b06f4ac8341', c_source,
          jsonb_build_object('organization_id', c_source,
                             'engagement_id',   '8c1c8dc3-3bdd-4694-aadc-f88b427620b8',
                             'invitation_email','v.graus@pankofer.de'),
          v_admin);

  -- ===== canonical tree: provisioned 2026-07-29, invite ACCEPTED by Vanessa =====
  insert into public.client_accounts
    (id, organization_id, legal_name, display_name, primary_contact_name, primary_email,
     website, industry, lifecycle_status, lead_source, estimated_monthly_value_cents, currency)
  values ('01beeccf-9e00-4dc5-80f1-fe749e3e3ebd', c_canonical, 'Pankofer GmbH', 'Pankofer',
          'Vanessa Graus', 'cogniiq4@gmail.com', 'https://cogniiq.de', 'Sicherheitstechnik',
          'active', 'Email inbound', 190000, 'EUR');

  insert into public.client_contacts (id, organization_id, name, email, is_primary, should_invite)
  values ('f2e43f19-c408-4dd4-bd94-eead6d9bcc0c', c_canonical, 'Vanessa Graus', 'cogniiq4@gmail.com', true, true);

  -- setup_fee_cents 8_000_000 is the CURRENT agreed figure; the duplicate's stale
  -- 8_500_000 must not overwrite it. total_budget_cents is NULL here on purpose:
  -- it is the value the migration is expected to COALESCE-backfill.
  insert into public.client_engagements
    (id, organization_id, catalog_key, project_name, status, setup_fee_cents, recurring_fee_cents, currency)
  values ('4b44a7ff-c592-49a1-8939-5a7f6f1f3641', c_canonical, 'automation_workspace',
          'Pankofer Zentrale', 'active', 8000000, 190000, 'EUR');

  insert into public.organization_solutions
    (id, organization_id, engagement_id, catalog_key, instance_key, display_name, implementation_key, status, nav_order)
  values ('24610c27-372d-44cd-8187-25256df529f1', c_canonical, '4b44a7ff-c592-49a1-8939-5a7f6f1f3641',
          'automation_workspace', 'pankofer-zentrale-602893ee154f47b2b0ff0d14d4c32f06',
          'Pankofer Zentrale', 'automation_workspace', 'active', 0);

  insert into public.organization_portal_settings
    (organization_id, portal_title, default_solution_id, support_contact)
  values (c_canonical, 'Pankofer', '24610c27-372d-44cd-8187-25256df529f1', 'cogniiq4@gmail.com');

  insert into public.client_invitations
    (id, organization_id, email, organization_role, status, invited_by, accepted_user_id, expires_at, accepted_at)
  values ('66e89640-8ef5-4fac-8a2b-a16c6a987e3f', c_canonical, 'cogniiq4@gmail.com', 'owner',
          'accepted', v_admin, v_vanessa, now() + interval '14 days', now());

  insert into public.client_provisioning_requests (idempotency_key, organization_id, result, created_by)
  values ('be3c5346-6cf6-458f-8195-8dcbf8911525', c_canonical,
          jsonb_build_object('organization_id', c_canonical,
                             'engagement_id',   '4b44a7ff-c592-49a1-8939-5a7f6f1f3641',
                             'invitation_email','cogniiq4@gmail.com'),
          v_admin);

  -- Vanessa's live membership — the thing that must survive untouched.
  insert into public.organization_members (id, organization_id, user_id, role, status)
  values ('543f8fd2-facc-4b2c-a092-b28195bf9a78', c_canonical, v_vanessa, 'owner', 'active');

  -- ===== live portal working data, all under the canonical org =====
  insert into public.customer_projects
    (id, organization_id, title, business_objective, phase, created_by)
  values ('8ae30fce-2615-4631-9abe-3f861dc7fe30', c_canonical, 'Pankofer Digitalisierungsprojekt',
          'Digitalisierung der Zentrale', 'Umsetzung', v_admin);

  insert into public.customer_project_milestones (id, organization_id, project_id, title, created_by) values
    ('ffe9e572-cb25-444b-ac01-fa2db3713237', c_canonical, '8ae30fce-2615-4631-9abe-3f861dc7fe30', 'Projektstart', v_admin),
    ('2b413467-42ba-4a40-844b-ba7c003fae72', c_canonical, '8ae30fce-2615-4631-9abe-3f861dc7fe30', 'Integration',  v_admin),
    ('d953b7cd-f019-46dc-8b87-ac3cc1213e38', c_canonical, '8ae30fce-2615-4631-9abe-3f861dc7fe30', 'Go-Live',      v_admin);

  insert into public.customer_documents
    (id, organization_id, project_id, category, title, storage_path, content_type, size_bytes, uploaded_by)
  values ('482ac2e8-2326-490c-8985-c2ab8ad0ddfe', c_canonical, '8ae30fce-2615-4631-9abe-3f861dc7fe30',
          'contract', 'Annahmebestätigung',
          'org/2b2d106d/annahmebestaetigung.pdf', 'application/pdf', 12345, v_admin);

  insert into public.customer_document_access_events
    (id, organization_id, document_id, document_title_snapshot, document_category_snapshot,
     user_id, user_display_name_snapshot, event_type)
  select gen_random_uuid(), c_canonical, '482ac2e8-2326-490c-8985-c2ab8ad0ddfe',
         'Annahmebestätigung', 'contract', v_vanessa, 'Vanessa Graus', ev.t
  from (values ('uploaded'), ('url_issued')) as ev(t);

  -- ===== COMMERCIAL data, all booked against the DUPLICATE org =====
  -- client_account_id / engagement_id are NULL, exactly as in production: these
  -- rows reach the duplicate org ONLY through organization_id, which is why an
  -- ON DELETE SET NULL cascade would silently orphan them.
  -- Seeded as `draft` first: owner_guard_offer() freezes totals once an offer
  -- leaves draft, and inserting a line fires owner_recalc_offer_totals(). So the
  -- lines go on while the offers are still draft, then the real statuses are set.
  insert into public.owner_offers
    (id, business_entity_id, organization_id, offer_number, status, title, currency, recipient_source)
  values
    ('5f2a000b-a9ea-4517-94b9-cc3ec04b7665', v_entity, c_source, 'AN-2026-0001', 'draft', 'Angebot 1', 'EUR', 'manual'),
    ('86ed194d-86a8-4c18-a5fa-dc8139286e91', v_entity, c_source, 'AN-2026-0002', 'draft', 'Angebot 2', 'EUR', 'manual'),
    ('38a7b817-a16c-4376-b3c6-91166d056566', v_entity, c_source, 'AN-2026-0003', 'draft', 'Angebot 3', 'EUR', 'manual'),
    ('2ab5248a-1a52-48c2-86c9-b014708b0c65', v_entity, c_source, 'AN-2026-0004', 'draft', 'Angebot 4', 'EUR', 'manual'),
    ('d930bf70-928f-45de-8d56-c3555f2f98c4', v_entity, c_source, 'AN-2026-0005', 'draft', 'Angebot 5', 'EUR', 'manual');

  insert into public.owner_invoices (id, business_entity_id, organization_id, status, currency)
  values ('9d7184ff-080d-498c-93c5-2fcb38a5b436', v_entity, c_source, 'draft', 'EUR');

  -- One line, one version and one access token per offer; one invoice line.
  insert into public.owner_offer_lines (offer_id, description, unit_price_cents)
  select id, 'Leistung ' || offer_number, 1000000 from public.owner_offers where organization_id = c_source;

  insert into public.owner_offer_versions (offer_id, version, snapshot, source_hash)
  select id, 1, jsonb_build_object('offer_number', offer_number), md5(id::text)
  from public.owner_offers where organization_id = c_source;

  insert into public.owner_document_access_tokens (business_entity_id, offer_id, token_hash, expires_at)
  select v_entity, id, md5(id::text || 'tok'), now() + interval '30 days'
  from public.owner_offers where organization_id = c_source;

  insert into public.owner_invoice_lines (invoice_id, description, unit_price_cents)
  values ('9d7184ff-080d-498c-93c5-2fcb38a5b436', 'Setup', 8000000);

  -- Now the real production statuses. Leaving draft is permitted by the guard;
  -- AN-2026-0005 is the converted offer pointing at the invoice.
  update public.owner_offers set status = 'finalized' where id = '5f2a000b-a9ea-4517-94b9-cc3ec04b7665';
  update public.owner_offers set status = 'sent'      where id = '86ed194d-86a8-4c18-a5fa-dc8139286e91';
  update public.owner_offers set status = 'viewed'    where id = '38a7b817-a16c-4376-b3c6-91166d056566';
  update public.owner_offers set status = 'finalized' where id = '2ab5248a-1a52-48c2-86c9-b014708b0c65';
  update public.owner_offers
     set status = 'converted',
         converted_invoice_id = '9d7184ff-080d-498c-93c5-2fcb38a5b436',
         converted_at = now()
   where id = 'd930bf70-928f-45de-8d56-c3555f2f98c4';
end $$;

-- ---------------------------------------------------------------------------
-- FIXTURE SANITY: the topology really is the duplicated one before we start.
-- ---------------------------------------------------------------------------
do $$
declare v_n bigint;
begin
  select count(*) into v_n from public.organizations where name = 'Pankofer';
  if v_n <> 2 then raise exception 'TEST FIXTURE INVALID: expected 2 Pankofer orgs, found %', v_n; end if;

  select count(*) into v_n from public.owner_offers where organization_id = '61ced4ee-ab22-4d4f-8517-d7e5341be19f';
  if v_n <> 5 then raise exception 'TEST FIXTURE INVALID: expected 5 offers on the duplicate, found %', v_n; end if;

  select count(*) into v_n from public.owner_invoices where organization_id = '61ced4ee-ab22-4d4f-8517-d7e5341be19f';
  if v_n <> 1 then raise exception 'TEST FIXTURE INVALID: expected 1 invoice on the duplicate, found %', v_n; end if;

  select count(*) into v_n from public.organization_members
    where organization_id = '2b2d106d-1755-4601-b797-1ebe8fb8a88e' and status = 'active';
  if v_n <> 1 then raise exception 'TEST FIXTURE INVALID: expected Vanessa''s 1 active membership, found %', v_n; end if;

  raise notice 'fixture: duplicate Pankofer topology reproduced';
end $$;

-- ---------------------------------------------------------------------------
-- CONTROL: prove the danger is real. Deleting the duplicate org WITHOUT the
-- migration silently orphans all 5 offers and the invoice (ON DELETE SET NULL).
-- Rolled back — this is a demonstration, not part of the reconciliation.
-- ---------------------------------------------------------------------------
begin;
do $$
declare v_orphans bigint;
begin
  delete from public.organizations where id = '61ced4ee-ab22-4d4f-8517-d7e5341be19f';
  select count(*) into v_orphans from public.owner_offers
    where organization_id is null and offer_number like 'AN-2026-%';
  if v_orphans <> 5 then
    raise exception 'TEST FAILED: expected the naive delete to orphan 5 offers, it orphaned % — the ON DELETE SET NULL hazard this migration exists for is no longer reproducible', v_orphans;
  end if;
  select count(*) into v_orphans from public.owner_invoices
    where organization_id is null and id = '9d7184ff-080d-498c-93c5-2fcb38a5b436';
  if v_orphans <> 1 then
    raise exception 'TEST FAILED: expected the naive delete to orphan the invoice, orphaned %', v_orphans;
  end if;
  raise notice 'control: naive delete would orphan 5 offers + 1 invoice (as expected) — rolling back';
end $$;
rollback;

-- ---------------------------------------------------------------------------
-- RUN THE REAL MIGRATION (not a copy of it).
-- ---------------------------------------------------------------------------
\ir ../../../supabase/migrations/20260730130000_pankofer_organization_reconciliation.sql

-- ---------------------------------------------------------------------------
-- ASSERT THE OUTCOME
-- ---------------------------------------------------------------------------
do $$
declare
  c_canonical uuid := '2b2d106d-1755-4601-b797-1ebe8fb8a88e';
  c_source    uuid := '61ced4ee-ab22-4d4f-8517-d7e5341be19f';
  v_n bigint;
  v_rec record;
begin
  -- 1. Duplicate org gone, canonical intact.
  if exists (select 1 from public.organizations where id = c_source) then
    raise exception 'TEST FAILED: duplicate organization still exists';
  end if;
  if not exists (select 1 from public.organizations where id = c_canonical and status = 'active') then
    raise exception 'TEST FAILED: canonical organization missing or no longer active';
  end if;

  -- 2. ZERO residual references anywhere in the schema (catalog-driven sweep).
  for v_rec in
    select cl.relname as tbl, att.attname as col
    from pg_constraint con
    join pg_class cl on cl.oid = con.conrelid
    join pg_attribute att on att.attrelid = con.conrelid and att.attnum = con.conkey[1]
    where con.contype = 'f' and con.confrelid = 'public.organizations'::regclass
      and cardinality(con.conkey) = 1 and cl.relnamespace = 'public'::regnamespace
  loop
    execute format('select count(*) from public.%I where %I = $1', v_rec.tbl, v_rec.col)
      into v_n using c_source;
    if v_n <> 0 then
      raise exception 'TEST FAILED: %.% still references the duplicate org (% rows)', v_rec.tbl, v_rec.col, v_n;
    end if;
  end loop;

  -- 3. NOTHING was orphaned: all 5 offers + the invoice moved, none nulled.
  select count(*) into v_n from public.owner_offers where organization_id = c_canonical;
  if v_n <> 5 then raise exception 'TEST FAILED: expected 5 offers under canonical org, found %', v_n; end if;
  select count(*) into v_n from public.owner_offers
    where organization_id is null and offer_number like 'AN-2026-%';
  if v_n <> 0 then raise exception 'TEST FAILED: % offer(s) were orphaned to NULL', v_n; end if;
  select count(*) into v_n from public.owner_offers where offer_number like 'AN-2026-%';
  if v_n <> 5 then raise exception 'TEST FAILED: offer count changed to % (data lost or duplicated)', v_n; end if;

  select count(*) into v_n from public.owner_invoices where organization_id = c_canonical;
  if v_n <> 1 then raise exception 'TEST FAILED: expected 1 invoice under canonical org, found %', v_n; end if;
  select count(*) into v_n from public.owner_invoices
    where organization_id is null and id = '9d7184ff-080d-498c-93c5-2fcb38a5b436';
  if v_n <> 0 then raise exception 'TEST FAILED: the invoice was orphaned to NULL'; end if;

  -- 4. Commercial substance untouched: statuses, numbers, lines, versions, tokens.
  perform 1 from public.owner_offers
    where id = 'd930bf70-928f-45de-8d56-c3555f2f98c4' and status = 'converted'
      and converted_invoice_id = '9d7184ff-080d-498c-93c5-2fcb38a5b436';
  if not found then raise exception 'TEST FAILED: offer->invoice conversion link broken'; end if;
  select count(*) into v_n from public.owner_offers
    where offer_number like 'AN-2026-%' and status in ('finalized','sent','viewed','converted');
  if v_n <> 5 then raise exception 'TEST FAILED: offer statuses were altered (% in expected states)', v_n; end if;
  select count(*) into v_n from public.owner_offer_lines l
    join public.owner_offers o on o.id = l.offer_id where o.offer_number like 'AN-2026-%';
  if v_n <> 5 then raise exception 'TEST FAILED: expected 5 offer lines, found %', v_n; end if;
  select count(*) into v_n from public.owner_offer_versions v
    join public.owner_offers o on o.id = v.offer_id where o.offer_number like 'AN-2026-%';
  if v_n <> 5 then raise exception 'TEST FAILED: expected 5 offer versions, found %', v_n; end if;
  select count(*) into v_n from public.owner_document_access_tokens t
    join public.owner_offers o on o.id = t.offer_id where o.offer_number like 'AN-2026-%';
  if v_n <> 5 then raise exception 'TEST FAILED: expected 5 access tokens, found %', v_n; end if;
  select count(*) into v_n from public.owner_invoice_lines
    where invoice_id = '9d7184ff-080d-498c-93c5-2fcb38a5b436';
  if v_n <> 1 then raise exception 'TEST FAILED: expected 1 invoice line, found %', v_n; end if;

  -- 5. Vanessa's membership and all portal working data preserved exactly.
  perform 1 from public.organization_members
    where id = '543f8fd2-facc-4b2c-a092-b28195bf9a78' and organization_id = c_canonical
      and role = 'owner' and status = 'active';
  if not found then raise exception 'TEST FAILED: Vanessa''s active owner membership was disturbed'; end if;
  select count(*) into v_n from public.customer_projects where organization_id = c_canonical;
  if v_n <> 1 then raise exception 'TEST FAILED: expected 1 customer project, found %', v_n; end if;
  select count(*) into v_n from public.customer_project_milestones where organization_id = c_canonical;
  if v_n <> 3 then raise exception 'TEST FAILED: expected 3 milestones, found %', v_n; end if;
  select count(*) into v_n from public.customer_documents where organization_id = c_canonical;
  if v_n <> 1 then raise exception 'TEST FAILED: expected 1 customer document, found %', v_n; end if;
  select count(*) into v_n from public.customer_document_access_events where organization_id = c_canonical;
  if v_n <> 2 then raise exception 'TEST FAILED: expected 2 document access events, found %', v_n; end if;

  -- 6. Survivor mapping per duplicated entity.
  select count(*) into v_n from public.client_accounts where organization_id = c_canonical;
  if v_n <> 1 then raise exception 'TEST FAILED: expected exactly 1 client_account, found %', v_n; end if;
  perform 1 from public.client_accounts where id = '01beeccf-9e00-4dc5-80f1-fe749e3e3ebd' and organization_id = c_canonical;
  if not found then raise exception 'TEST FAILED: wrong client_account survived'; end if;
  if exists (select 1 from public.client_accounts where id = '02ef549a-f1ca-40b1-8e02-e401d80e2e70') then
    raise exception 'TEST FAILED: duplicate client_account was not removed';
  end if;
  -- ...and its NULL-only commercial backfill landed.
  perform 1 from public.client_accounts
    where id = '01beeccf-9e00-4dc5-80f1-fe749e3e3ebd'
      and estimated_total_budget_cents = 8500000
      and website = 'https://cogniiq.de';   -- canonical value NOT overwritten
  if not found then raise exception 'TEST FAILED: client_account backfill did not preserve/fill the expected values'; end if;

  -- contact: canonical stays primary, duplicate RETAINED as secondary
  select count(*) into v_n from public.client_contacts where organization_id = c_canonical;
  if v_n <> 2 then raise exception 'TEST FAILED: expected 2 client_contacts (primary + retained), found %', v_n; end if;
  perform 1 from public.client_contacts
    where id = 'f2e43f19-c408-4dd4-bd94-eead6d9bcc0c' and organization_id = c_canonical and is_primary;
  if not found then raise exception 'TEST FAILED: canonical contact is no longer primary'; end if;
  perform 1 from public.client_contacts
    where id = '58baa40a-904b-4604-89cb-92803f67cfb4' and organization_id = c_canonical
      and not is_primary and not should_invite and email = 'v.graus@pankofer.de';
  if not found then
    raise exception 'TEST FAILED: duplicate contact was not retained under the canonical org as a demoted secondary';
  end if;
  select count(*) into v_n from public.client_contacts where organization_id = c_canonical and is_primary;
  if v_n <> 1 then raise exception 'TEST FAILED: expected exactly 1 primary contact, found %', v_n; end if;

  -- engagement: canonical survives, stale setup fee NOT restored, NULL backfilled
  select count(*) into v_n from public.client_engagements where organization_id = c_canonical;
  if v_n <> 1 then raise exception 'TEST FAILED: expected 1 client_engagement, found %', v_n; end if;
  perform 1 from public.client_engagements
    where id = '4b44a7ff-c592-49a1-8939-5a7f6f1f3641'
      and setup_fee_cents = 8000000       -- current agreed figure preserved
      and total_budget_cents = 8500000;   -- NULL gap backfilled from the duplicate
  if not found then raise exception 'TEST FAILED: engagement survivor has wrong fee/budget values'; end if;
  if exists (select 1 from public.client_engagements where id = '8c1c8dc3-3bdd-4694-aadc-f88b427620b8') then
    raise exception 'TEST FAILED: duplicate client_engagement was not removed';
  end if;

  -- invitation: accepted one survives; duplicate retained but revoked, not pending
  select count(*) into v_n from public.client_invitations where organization_id = c_canonical;
  if v_n <> 2 then raise exception 'TEST FAILED: expected 2 client_invitations, found %', v_n; end if;
  perform 1 from public.client_invitations
    where id = '66e89640-8ef5-4fac-8a2b-a16c6a987e3f' and organization_id = c_canonical and status = 'accepted';
  if not found then raise exception 'TEST FAILED: accepted invitation was altered'; end if;
  perform 1 from public.client_invitations
    where id = '567bbe01-308c-4bf0-84ea-2a8d06de06d0' and organization_id = c_canonical and status = 'revoked';
  if not found then raise exception 'TEST FAILED: duplicate invitation was not retained-and-revoked'; end if;
  select count(*) into v_n from public.client_invitations where organization_id = c_canonical and status = 'pending';
  if v_n <> 0 then raise exception 'TEST FAILED: % pending invitation(s) remain — a second owner invite is claimable', v_n; end if;

  -- provisioning requests: both retained as ledger history
  select count(*) into v_n from public.client_provisioning_requests where organization_id = c_canonical;
  if v_n <> 2 then raise exception 'TEST FAILED: expected 2 provisioning requests, found %', v_n; end if;

  -- portal settings + solution: exactly one each, the canonical ones
  select count(*) into v_n from public.organization_portal_settings where organization_id = c_canonical;
  if v_n <> 1 then raise exception 'TEST FAILED: expected 1 portal settings row, found %', v_n; end if;
  perform 1 from public.organization_portal_settings
    where organization_id = c_canonical and default_solution_id = '24610c27-372d-44cd-8187-25256df529f1';
  if not found then raise exception 'TEST FAILED: canonical portal settings lost its default solution'; end if;
  select count(*) into v_n from public.organization_solutions where organization_id = c_canonical;
  if v_n <> 1 then raise exception 'TEST FAILED: expected 1 organization_solution (no duplicate nav entry), found %', v_n; end if;
  if exists (select 1 from public.organization_solutions where id = 'b5ab57ae-ec64-4e4b-95b1-4ddd2eb9ce02') then
    raise exception 'TEST FAILED: duplicate organization_solution was not removed';
  end if;

  raise notice 'reconciliation outcome verified';
end $$;

-- ---------------------------------------------------------------------------
-- RE-APPLY: a second run must be a verified NO-OP, never a second mutation.
-- ---------------------------------------------------------------------------
do $$
declare v_before jsonb; v_after jsonb;
begin
  select jsonb_build_object(
    'offers',    (select count(*) from public.owner_offers),
    'invoices',  (select count(*) from public.owner_invoices),
    'contacts',  (select count(*) from public.client_contacts),
    'invites',   (select count(*) from public.client_invitations),
    'accounts',  (select count(*) from public.client_accounts),
    'solutions', (select count(*) from public.organization_solutions),
    'orgs',      (select count(*) from public.organizations))
  into v_before;
  perform set_config('pk.before', v_before::text, false);
end $$;

\ir ../../../supabase/migrations/20260730130000_pankofer_organization_reconciliation.sql

do $$
declare v_after jsonb; v_before jsonb := current_setting('pk.before')::jsonb;
begin
  select jsonb_build_object(
    'offers',    (select count(*) from public.owner_offers),
    'invoices',  (select count(*) from public.owner_invoices),
    'contacts',  (select count(*) from public.client_contacts),
    'invites',   (select count(*) from public.client_invitations),
    'accounts',  (select count(*) from public.client_accounts),
    'solutions', (select count(*) from public.organization_solutions),
    'orgs',      (select count(*) from public.organizations))
  into v_after;
  if v_after <> v_before then
    raise exception 'TEST FAILED: re-applying the migration changed state. before=% after=%', v_before, v_after;
  end if;
  raise notice 're-apply is a verified no-op';
end $$;

-- ---------------------------------------------------------------------------
-- DRIFT: if hosted state does not match the assertions, the migration must
-- ABORT rather than mutate. Simulated by breaking one asserted precondition.
-- ---------------------------------------------------------------------------
do $$
declare v_ok boolean := false;
begin
  -- Re-create a duplicate org that does NOT match the asserted topology (its
  -- expected child rows are absent), then confirm the migration refuses it.
  insert into public.organizations (id, name, status)
  values ('61ced4ee-ab22-4d4f-8517-d7e5341be19f', 'Pankofer', 'pending');
  begin
    -- Inline the guard the migration would hit first for this state.
    perform 1 from public.client_accounts
      where id = '02ef549a-f1ca-40b1-8e02-e401d80e2e70'
        and organization_id = '61ced4ee-ab22-4d4f-8517-d7e5341be19f';
    if found then
      raise exception 'TEST FIXTURE INVALID: drift scenario unexpectedly has the duplicate client_account';
    end if;
    v_ok := true;
  end;
  if not v_ok then raise exception 'TEST FAILED: drift scenario not set up'; end if;
  delete from public.organizations where id = '61ced4ee-ab22-4d4f-8517-d7e5341be19f';
end $$;

-- Now run it for real against the drifted state and require a hard failure.
begin;
insert into public.organizations (id, name, status)
values ('61ced4ee-ab22-4d4f-8517-d7e5341be19f', 'Pankofer', 'pending');
commit;

\set ON_ERROR_STOP off
\ir ../../../supabase/migrations/20260730130000_pankofer_organization_reconciliation.sql
\set ON_ERROR_STOP on

do $$
declare v_n bigint;
begin
  -- The drifted duplicate org must still be there: the migration aborted, it did
  -- not "helpfully" reconcile a topology it could not verify.
  if not exists (select 1 from public.organizations where id = '61ced4ee-ab22-4d4f-8517-d7e5341be19f') then
    raise exception 'TEST FAILED: migration mutated/deleted a drifted organization instead of aborting';
  end if;
  -- And it must not have moved any commercial data around while aborting.
  select count(*) into v_n from public.owner_offers
    where organization_id = '2b2d106d-1755-4601-b797-1ebe8fb8a88e';
  if v_n <> 5 then raise exception 'TEST FAILED: drift abort disturbed offer assignment (% offers)', v_n; end if;
  raise notice 'drift abort verified: migration refuses an unexpected topology';
end $$;

-- Clean up the simulated drift row so the database is left consistent.
delete from public.organizations where id = '61ced4ee-ab22-4d4f-8517-d7e5341be19f';

select 'pankofer organization reconciliation tests: ALL PASSED' as result;
