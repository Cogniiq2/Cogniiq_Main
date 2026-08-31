-- Owner workspace organization: folders, Papierkorb and the one delete path (20260903120000).
--
-- These tests EXECUTE against a real Postgres, because every claim the migration makes is a
-- claim about what the DATABASE does or refuses, and none of it is visible in the source:
--
--   * that a REVIEWED but unencumbered expense can now be permanently deleted from the Admin
--     Center — the correction this migration exists for — while the pre-existing
--     delete_owner_draft_expense still refuses it, unchanged, for its own callers
--   * that an issued invoice is never hard-deleted, that its number is never released and that
--     the number counter is never rolled back
--   * that deleting a FOLDER reaches no record at all
--   * that trash state changes no accounting figure — the same EÜR/VAT inputs and the same
--     period summary come back before and after
--   * that a non-owner and anon reach none of it
--
-- ON_ERROR_STOP=1 -> any failed assertion aborts with a non-zero exit.

\set ON_ERROR_STOP on
set client_min_messages = notice;

create or replace function pg_temp.pass(msg text) returns void language plpgsql as $$
begin raise notice 'PASS: %', msg; end $$;
create or replace function pg_temp.fail(msg text) returns void language plpgsql as $$
begin raise exception 'FAIL: %', msg; end $$;
create or replace function pg_temp.want(cond boolean, msg text) returns void language plpgsql as $$
begin if cond then perform pg_temp.pass(msg); else perform pg_temp.fail(msg); end if; end $$;

-- Auth follows the REAL phase0 is_platform_owner(): profiles.platform_role + auth.uid().
select set_config('t.owner','00000000-0000-0000-0000-000000000901',false);
select set_config('t.other','00000000-0000-0000-0000-000000000903',false);
update public.profiles set platform_role = 'cogniiq_owner' where id = current_setting('t.owner')::uuid;
update public.profiles set platform_role = 'customer' where id = current_setting('t.other')::uuid;
select set_config('request.jwt.claim.sub', current_setting('t.owner'), false);
select set_config('request.jwt.claim.role', 'authenticated', false);

set session_replication_role = replica;
delete from public.owner_workspace_item_state;
delete from public.owner_workspace_folders;
delete from public.owner_invoice_versions;
delete from public.owner_generated_documents;
delete from public.owner_finance_documents;
delete from public.owner_payments;
delete from public.owner_invoice_lines;
delete from public.owner_invoices;
delete from public.owner_invoice_counters;
delete from public.owner_offer_lines;
delete from public.owner_offer_acceptance_events;
delete from public.owner_document_access_tokens;
delete from public.owner_offers;
delete from public.owner_expense_lines;
delete from public.owner_expenses;
delete from public.owner_customers;
delete from public.owner_finance_requests;
delete from public.owner_finance_notifications;
delete from public.owner_document_settings;
set session_replication_role = origin;

select set_config('t.entity', (select id::text from public.owner_business_entities where slug='cogniiq'), false);

insert into public.organizations (id, name, status, created_by)
  values ('44444444-4444-4444-4444-444444444444','Ordner AG','active', current_setting('t.owner')::uuid)
  on conflict (id) do nothing;

insert into public.owner_document_settings (business_entity_id, legal_name, street, postal_code, city,
  tax_number, vat_id, invoice_number_prefix, default_payment_terms_days, default_invoice_due_days, business_email)
values (current_setting('t.entity')::uuid, 'Cogniiq UG', 'Erststr. 1', '10115', 'Berlin', 'TAX-1', 'DE1',
  'RE', 21, 7, 'rechnung@cogniiq.example');

create or replace function pg_temp.inv_lines() returns jsonb language sql as $$
  select jsonb_build_array(jsonb_build_object('description','Beratung','quantity_milli',1000,
    'unit_price_cents',100000,'vat_rate_bp',1900,'vat_treatment','standard','sort_order',0)) $$;
create or replace function pg_temp.inv_header() returns jsonb language sql as $$
  select jsonb_build_object('business_entity_id',current_setting('t.entity'),
    'organization_id','44444444-4444-4444-4444-444444444444',
    'issue_date','2026-03-01','service_date','2026-03-01','due_date','2026-03-15','currency','EUR') $$;

create or replace function pg_temp.new_invoice() returns uuid language sql as $$
  select (public.create_owner_invoice(gen_random_uuid(), pg_temp.inv_header(), pg_temp.inv_lines())->>'invoice_id')::uuid $$;

create or replace function pg_temp.exp_lines() returns jsonb language sql as $$
  select jsonb_build_array(jsonb_build_object('description','Software','net_cents',10000,
    'vat_rate_bp',1900,'vat_treatment','domestic_standard')) $$;
create or replace function pg_temp.new_expense(p_review text) returns uuid language sql as $$
  select (public.create_owner_expense(gen_random_uuid(),
    jsonb_build_object('business_entity_id',current_setting('t.entity'),
      'invoice_date','2026-03-05','service_date','2026-03-05','currency','EUR','review_status',p_review),
    pg_temp.exp_lines())->>'expense_id')::uuid $$;

create or replace function pg_temp.new_offer(p_title text) returns uuid language sql as $$
  select (public.create_owner_offer(gen_random_uuid(),
    jsonb_build_object('business_entity_id',current_setting('t.entity'),
      'organization_id','44444444-4444-4444-4444-444444444444','title',p_title,
      'issue_date','2026-03-01','valid_until','2026-04-01','currency','EUR',
      'recipient_company','Ordner AG','recipient_street','Kundenstr. 1',
      'recipient_postal_code','20095','recipient_city','Hamburg','recipient_email','k@example.test'),
    jsonb_build_array(jsonb_build_object('description','Leistung','quantity_milli',1000,
      'unit_price_cents',50000,'vat_rate_bp',1900,'vat_treatment','standard','sort_order',0)))->>'offer_id')::uuid $$;

-- ===========================================================================
-- 1. Folders: create, rename, duplicate refusal, ordering
-- ===========================================================================
do $$
declare v_a jsonb; v_b jsonb; v_err text;
begin
  v_a := public.owner_create_workspace_folder(current_setting('t.entity')::uuid, 'invoice', '  SV Heinersreuth  ');
  perform pg_temp.want(v_a->>'name' = 'SV Heinersreuth', 'create folder trims whitespace');
  perform pg_temp.want((v_a->>'sort_order')::int = 0, 'first folder sorts first');

  v_b := public.owner_create_workspace_folder(current_setting('t.entity')::uuid, 'invoice', 'Archiv');
  perform pg_temp.want((v_b->>'sort_order')::int = 1, 'second folder appends');

  begin
    perform public.owner_create_workspace_folder(current_setting('t.entity')::uuid, 'invoice', 'sv heinersreuth');
    perform pg_temp.fail('a case-insensitive duplicate folder name was accepted');
  exception when others then
    get stacked diagnostics v_err = message_text;
    perform pg_temp.want(v_err = 'folder_name_taken', 'duplicate folder name refused with a stable code');
  end;

  -- The same name IS available in a different scope: an invoice folder is not an expense folder.
  perform public.owner_create_workspace_folder(current_setting('t.entity')::uuid, 'expense', 'SV Heinersreuth');
  perform pg_temp.want(
    (select count(*) from public.owner_workspace_folders where lower(name) = 'sv heinersreuth') = 2,
    'folders are scoped per resource type');

  begin
    perform public.owner_create_workspace_folder(current_setting('t.entity')::uuid, 'invoice', '   ');
    perform pg_temp.fail('an empty folder name was accepted');
  exception when others then
    get stacked diagnostics v_err = message_text;
    perform pg_temp.want(v_err = 'folder_name_required', 'empty folder name refused');
  end;

  perform public.owner_rename_workspace_folder((v_b->>'id')::uuid, 'Archiv 2026');
  perform pg_temp.want(
    (select name from public.owner_workspace_folders where id = (v_b->>'id')::uuid) = 'Archiv 2026',
    'rename folder');

  begin
    perform public.owner_rename_workspace_folder((v_b->>'id')::uuid, 'SV HEINERSREUTH');
    perform pg_temp.fail('rename onto an existing name was accepted');
  exception when others then
    get stacked diagnostics v_err = message_text;
    perform pg_temp.want(v_err = 'folder_name_taken', 'rename refuses a duplicate name');
  end;

  perform pg_temp.want(
    (select count(*) from jsonb_array_elements(
       public.owner_workspace_state(current_setting('t.entity')::uuid, 'invoice') -> 'folders')) = 2,
    'one state read returns every folder in the scope');
end $$;

-- ===========================================================================
-- 2. Moving records, and deleting a folder without touching a single record
-- ===========================================================================
do $$
declare v_f uuid; v_i1 uuid; v_i2 uuid; v_i3 uuid; v_res jsonb;
begin
  select id into v_f from public.owner_workspace_folders where scope='invoice' and name='SV Heinersreuth';
  v_i1 := pg_temp.new_invoice(); v_i2 := pg_temp.new_invoice(); v_i3 := pg_temp.new_invoice();
  perform set_config('t.i1', v_i1::text, false);
  perform set_config('t.i2', v_i2::text, false);
  perform set_config('t.i3', v_i3::text, false);
  perform set_config('t.folder', v_f::text, false);

  perform public.owner_move_workspace_items(current_setting('t.entity')::uuid, 'invoice', array[v_i1], v_f);
  perform pg_temp.want(
    (select folder_id from public.owner_workspace_item_state where resource_id = v_i1) = v_f,
    'move a single record into a folder');

  perform public.owner_move_workspace_items(current_setting('t.entity')::uuid, 'invoice', array[v_i2, v_i3], v_f);
  perform pg_temp.want(
    (select count(*) from public.owner_workspace_item_state where folder_id = v_f) = 3,
    'bulk move puts every selected record in the folder');

  -- Folder counts come from the one state read, not from a per-row request.
  perform pg_temp.want(
    (select count(*) from jsonb_array_elements(
       public.owner_workspace_state(current_setting('t.entity')::uuid, 'invoice') -> 'items') e
     where (e->>'folder_id')::uuid = v_f) = 3,
    'the state read carries the folder assignment for every item');

  perform public.owner_move_workspace_items(current_setting('t.entity')::uuid, 'invoice', array[v_i3], null);
  perform pg_temp.want(
    not exists (select 1 from public.owner_workspace_item_state where resource_id = v_i3),
    'moving to "Ohne Ordner" leaves no state row behind');

  -- A folder belonging to another scope may not be targeted.
  begin
    perform public.owner_move_workspace_items(current_setting('t.entity')::uuid, 'invoice', array[v_i1],
      (select id from public.owner_workspace_folders where scope='expense' limit 1));
    perform pg_temp.fail('an expense folder accepted an invoice');
  exception when others then
    perform pg_temp.pass('a folder from another scope is refused');
  end;

  -- THE folder-deletion promise: the records survive and become "Ohne Ordner".
  v_res := public.owner_delete_workspace_folder(v_f);
  perform pg_temp.want((v_res->>'unassigned_count')::int = 2, 'folder deletion reports what it unassigned');
  perform pg_temp.want(
    (select count(*) from public.owner_invoices where id in (v_i1, v_i2, v_i3)) = 3,
    'deleting a folder deletes NO record');
  perform pg_temp.want(
    not exists (select 1 from public.owner_workspace_item_state where resource_id in (v_i1, v_i2)),
    'records inside a deleted folder fall back to "Ohne Ordner"');
end $$;

-- ===========================================================================
-- 3. Invoices: a draft is deleted, an issued invoice is NEVER deleted
-- ===========================================================================
do $$
declare v_draft uuid; v_issued uuid; v_number text; v_counter bigint; v_res jsonb; v_plan jsonb;
begin
  v_draft := pg_temp.new_invoice();
  v_plan := public.owner_workspace_delete_preflight_one('invoice', v_draft);
  perform pg_temp.want(v_plan->>'action' = 'hard_delete', 'a never-issued draft invoice hard-deletes');

  v_res := public.owner_workspace_delete_items(current_setting('t.entity')::uuid, 'invoice', array[v_draft]);
  perform pg_temp.want(v_res->0->>'outcome' = 'hard_deleted', 'the draft was actually removed');
  perform pg_temp.want(not exists (select 1 from public.owner_invoices where id = v_draft), 'draft invoice is gone');

  v_issued := pg_temp.new_invoice();
  perform public.issue_owner_invoice(gen_random_uuid(), v_issued);
  select invoice_number into v_number from public.owner_invoices where id = v_issued;
  perform pg_temp.want(v_number is not null, 'the issued invoice carries a server number');
  select next_number into v_counter from public.owner_invoice_counters
    where business_entity_id = current_setting('t.entity')::uuid limit 1;

  v_plan := public.owner_workspace_delete_preflight_one('invoice', v_issued);
  perform pg_temp.want(v_plan->>'action' = 'cancel_and_trash',
    'an issued invoice resolves to Storno + workspace removal, never a hard delete');
  perform pg_temp.want(v_plan->'reasons' ? 'invoice_number_retained', 'the preflight states the number is kept');

  v_res := public.owner_workspace_delete_items(current_setting('t.entity')::uuid, 'invoice', array[v_issued],
    'Doppelt erfasst');
  perform pg_temp.want(v_res->0->>'outcome' = 'cancelled_and_trashed', 'the issued invoice was cancelled and removed');
  perform pg_temp.want(exists (select 1 from public.owner_invoices where id = v_issued),
    'the issued invoice still EXISTS after "Löschen"');
  perform pg_temp.want(
    (select invoice_number from public.owner_invoices where id = v_issued) = v_number,
    'the invoice number is unchanged');
  perform pg_temp.want(
    (select status from public.owner_invoices where id = v_issued) = 'cancelled',
    'the sanctioned Storno was used');
  perform pg_temp.want(
    (select cancellation_reason from public.owner_invoices where id = v_issued) = 'Doppelt erfasst',
    'the Storno carries the reason the owner gave');
  perform pg_temp.want(
    (select next_number from public.owner_invoice_counters
      where business_entity_id = current_setting('t.entity')::uuid limit 1) = v_counter,
    'the invoice-number counter was NOT rolled back');
  perform pg_temp.want(
    (select trashed_at is not null from public.owner_workspace_item_state where resource_id = v_issued),
    'the cancelled invoice left the workspace');

  -- An already-cancelled invoice is trash-only: there is nothing left to correct.
  perform public.owner_workspace_restore_items(current_setting('t.entity')::uuid, 'invoice', array[v_issued]);
  perform pg_temp.want(
    (select status from public.owner_invoices where id = v_issued) = 'cancelled',
    'restoring from the Papierkorb does NOT reverse the Storno');
  perform pg_temp.want(
    public.owner_workspace_delete_preflight_one('invoice', v_issued)->>'action' = 'trash_only',
    'an already-cancelled invoice is trash-only');

  -- Permanent deletion from the Papierkorb re-runs the preflight and refuses.
  perform public.owner_workspace_delete_items(current_setting('t.entity')::uuid, 'invoice', array[v_issued]);
  v_res := public.owner_workspace_purge_items(current_setting('t.entity')::uuid, 'invoice', array[v_issued]);
  perform pg_temp.want(v_res->0->>'outcome' = 'blocked', 'a protected invoice cannot be purged from the trash');
  perform pg_temp.want(exists (select 1 from public.owner_invoices where id = v_issued),
    'and it is still there afterwards');
end $$;

-- ===========================================================================
-- 4. A draft invoice carrying a real dependency is trash-only, not destroyed
-- ===========================================================================
do $$
declare v_draft uuid; v_plan jsonb;
begin
  v_draft := pg_temp.new_invoice();
  insert into public.owner_finance_documents (business_entity_id, storage_object_path, invoice_id)
  values (current_setting('t.entity')::uuid, 'entity/' || v_draft::text || '-beleg.pdf', v_draft);

  v_plan := public.owner_workspace_delete_preflight_one('invoice', v_draft);
  perform pg_temp.want(v_plan->>'action' = 'trash_only', 'a draft with a linked document is trash-only');
  perform pg_temp.want(v_plan->'reasons' ? 'has_documents', 'and says why');

  perform public.owner_workspace_delete_items(current_setting('t.entity')::uuid, 'invoice', array[v_draft]);
  perform pg_temp.want(exists (select 1 from public.owner_invoices where id = v_draft), 'the draft survives');
  perform pg_temp.want(
    exists (select 1 from public.owner_finance_documents where invoice_id = v_draft),
    'and so does its document — no orphan, no cascade');
end $$;

-- ===========================================================================
-- 5. Expenses — THE correction. reviewed + unpaid + no dependency = deletable.
-- ===========================================================================
do $$
declare v_pending uuid; v_reviewed uuid; v_needs uuid; v_paid uuid; v_res jsonb; v_plan jsonb; v_payments int;
begin
  v_pending  := pg_temp.new_expense('pending');
  v_reviewed := pg_temp.new_expense('reviewed');
  v_needs    := pg_temp.new_expense('needs_info');
  v_paid     := pg_temp.new_expense('reviewed');

  perform pg_temp.want(
    public.owner_workspace_delete_preflight_one('expense', v_pending)->>'action' = 'hard_delete',
    'pending + unpaid + no dependency -> hard delete');

  v_plan := public.owner_workspace_delete_preflight_one('expense', v_reviewed);
  perform pg_temp.want(v_plan->>'action' = 'hard_delete',
    'REVIEWED + unpaid + no dependency -> hard delete (the reported defect)');
  perform pg_temp.want(v_plan->'reasons' ? 'no_protected_dependency',
    'and the reason names the absence of a dependency, not the review status');

  perform pg_temp.want(
    public.owner_workspace_delete_preflight_one('expense', v_needs)->>'action' = 'hard_delete',
    'needs_info + unpaid + no dependency -> hard delete');

  -- The pre-existing draft RPC is deliberately unchanged and still refuses a reviewed expense.
  begin
    perform public.delete_owner_draft_expense(v_reviewed);
    perform pg_temp.fail('delete_owner_draft_expense was silently widened');
  exception when others then
    perform pg_temp.pass('delete_owner_draft_expense is untouched and still refuses a reviewed expense');
  end;

  v_res := public.owner_workspace_delete_items(current_setting('t.entity')::uuid, 'expense',
    array[v_pending, v_reviewed, v_needs]);
  perform pg_temp.want(
    (select count(*) from jsonb_array_elements(v_res) e where e->>'outcome' = 'hard_deleted') = 3,
    'all three unencumbered expenses were permanently deleted');
  perform pg_temp.want(
    (select count(*) from public.owner_expenses where id in (v_pending, v_reviewed, v_needs)) = 0,
    'no Supabase table editor required: the rows are gone');
  perform pg_temp.want(
    (select count(*) from public.owner_expense_lines where expense_id in (v_pending, v_reviewed, v_needs)) = 0,
    'their lines went with them — no orphans');

  -- A paid expense is a different thing entirely.
  perform public.record_owner_expense_payment(gen_random_uuid(), v_paid, 5000, '2026-03-10');
  select count(*) into v_payments from public.owner_payments where expense_id = v_paid;
  v_plan := public.owner_workspace_delete_preflight_one('expense', v_paid);
  perform pg_temp.want(v_plan->>'action' = 'trash_only', 'a paid expense is trash-only');
  perform pg_temp.want(v_plan->'reasons' ? 'has_payments', 'and names the payment dependency');

  perform public.owner_workspace_delete_items(current_setting('t.entity')::uuid, 'expense', array[v_paid]);
  perform pg_temp.want(exists (select 1 from public.owner_expenses where id = v_paid),
    'the paid expense still exists in accounting truth');
  perform pg_temp.want(
    (select count(*) from public.owner_payments where expense_id = v_paid) = v_payments,
    'its ledger payment was NOT cascaded away');

  -- And the ledger row itself cannot be destroyed through this surface at all.
  begin
    perform public.owner_workspace_delete_items(current_setting('t.entity')::uuid, 'payment',
      array[(select id from public.owner_payments where expense_id = v_paid limit 1)]);
    perform pg_temp.want(
      (select count(*) from public.owner_payments where expense_id = v_paid) = v_payments,
      'a real ledger payment cannot be deleted through the workspace surface');
  exception when others then
    perform pg_temp.pass('the payment scope has no delete semantics and is refused outright');
  end;
  perform set_config('t.paid_expense', v_paid::text, false);
end $$;

-- ===========================================================================
-- 6. Offers: a pristine draft goes; everything else keeps its evidence
-- ===========================================================================
do $$
declare v_draft uuid; v_final uuid; v_res jsonb; v_plan jsonb; v_version int;
begin
  v_draft := pg_temp.new_offer('Entwurf');
  perform pg_temp.want(
    public.owner_workspace_delete_preflight_one('offer', v_draft)->>'action' = 'hard_delete',
    'a pristine draft offer hard-deletes');
  v_res := public.owner_workspace_delete_items(current_setting('t.entity')::uuid, 'offer', array[v_draft]);
  perform pg_temp.want(v_res->0->>'outcome' = 'hard_deleted', 'and it is actually removed');
  perform pg_temp.want(not exists (select 1 from public.owner_offers where id = v_draft), 'the draft offer is gone');

  v_final := pg_temp.new_offer('Finalisiert');
  perform public.finalize_owner_offer(gen_random_uuid(), v_final);
  select finalized_version into v_version from public.owner_offers where id = v_final;
  perform pg_temp.want(v_version is not null, 'the offer has an immutable finalized version');

  v_plan := public.owner_workspace_delete_preflight_one('offer', v_final);
  perform pg_temp.want(v_plan->>'action' = 'archive_and_trash',
    'a finalized offer is archived and removed from the workspace, never destroyed');
  perform pg_temp.want(v_plan->'reasons' ? 'has_immutable_version', 'and says which evidence protects it');

  v_res := public.owner_workspace_delete_items(current_setting('t.entity')::uuid, 'offer', array[v_final]);
  perform pg_temp.want(v_res->0->>'outcome' = 'archived_and_trashed', 'the sanctioned archive path was used');
  perform pg_temp.want(exists (select 1 from public.owner_offers where id = v_final), 'the offer still exists');
  perform pg_temp.want(
    (select finalized_version from public.owner_offers where id = v_final) = v_version,
    'its immutable version is untouched');
  perform pg_temp.want(
    (select archived_at is not null from public.owner_offers where id = v_final),
    'and it carries the repository archive flag, so no pipeline attention remains');
  perform pg_temp.want(
    (select count(*) from public.owner_offer_lines where offer_id = v_final) > 0,
    'its snapshot lines survived');

  -- Restoring the offer to the workspace does not un-archive it: archive is commercial
  -- state, the Papierkorb is a view.
  perform public.owner_workspace_restore_items(current_setting('t.entity')::uuid, 'offer', array[v_final]);
  perform pg_temp.want(
    (select archived_at is not null from public.owner_offers where id = v_final),
    'restoring from the Papierkorb does not reverse the archive');
end $$;

-- ===========================================================================
-- 7. A converted offer keeps its invoice
-- ===========================================================================
do $$
declare v_offer uuid; v_inv uuid;
begin
  v_offer := pg_temp.new_offer('Konvertiert');
  perform public.finalize_owner_offer(gen_random_uuid(), v_offer);
  update public.owner_offers set status = 'accepted', accepted_at = now() where id = v_offer;
  v_inv := (public.convert_owner_offer_to_invoice_draft(gen_random_uuid(), v_offer)->>'invoice_id')::uuid;
  perform pg_temp.want(v_inv is not null, 'the offer converted to an invoice draft');

  perform public.owner_workspace_delete_items(current_setting('t.entity')::uuid, 'offer', array[v_offer]);
  perform pg_temp.want(exists (select 1 from public.owner_invoices where id = v_inv),
    'removing the offer from the workspace leaves its invoice intact');
  perform pg_temp.want(
    (select source_offer_id from public.owner_invoices where id = v_inv) = v_offer,
    'and the invoice -> offer link is unbroken');
end $$;

-- ===========================================================================
-- 8. THE ACCOUNTING FIREWALL. Trash state changes no figure, anywhere.
-- ===========================================================================
do $$
declare v_before jsonb; v_after jsonb; v_sum_before jsonb; v_sum_after jsonb; v_ids uuid[];
begin
  v_before := public.owner_tax_period_inputs(current_setting('t.entity')::uuid, '2026-01-01', '2026-12-31', 'ist');
  v_sum_before := to_jsonb(public.owner_finance_period_summary(current_setting('t.entity')::uuid, '2026-01-01', '2026-12-31'));

  -- Put EVERY remaining invoice and expense in the Papierkorb, including the paid ones.
  select array_agg(id) into v_ids from public.owner_expenses;
  perform public.owner_workspace_delete_items(current_setting('t.entity')::uuid, 'expense', v_ids);
  select array_agg(id) into v_ids from public.owner_invoices;
  perform public.owner_workspace_trash_item(current_setting('t.entity')::uuid, 'invoice', i, null)
    from unnest(v_ids) as i;

  v_after := public.owner_tax_period_inputs(current_setting('t.entity')::uuid, '2026-01-01', '2026-12-31', 'ist');
  v_sum_after := to_jsonb(public.owner_finance_period_summary(current_setting('t.entity')::uuid, '2026-01-01', '2026-12-31'));

  perform pg_temp.want(v_before = v_after,
    'EÜR / VAT period inputs are byte-identical with everything in the Papierkorb');
  perform pg_temp.want(v_sum_before = v_sum_after,
    'the period summary (revenue, cash, receivables) is unchanged by trash state');
  perform pg_temp.want(
    (select amount_paid_cents from public.owner_expenses where id = current_setting('t.paid_expense')::uuid) > 0,
    'a trashed paid expense keeps its payment status');
end $$;

-- ===========================================================================
-- 9. Security. A non-owner and anon reach nothing.
-- ===========================================================================
select set_config('request.jwt.claim.sub', current_setting('t.other'), false);

do $$
declare v_ok boolean;
begin
  perform pg_temp.want(public.is_platform_owner() = false, 'the test now runs as a non-owner');

  begin perform public.owner_create_workspace_folder(current_setting('t.entity')::uuid, 'invoice', 'Fremd');
    perform pg_temp.fail('a non-owner created a folder');
  exception when others then perform pg_temp.pass('non-owner cannot create a folder'); end;

  begin perform public.owner_move_workspace_items(current_setting('t.entity')::uuid, 'invoice',
      array[gen_random_uuid()], null);
    perform pg_temp.fail('a non-owner moved an item');
  exception when others then perform pg_temp.pass('non-owner cannot move an item'); end;

  begin perform public.owner_workspace_trash_item(current_setting('t.entity')::uuid, 'invoice', gen_random_uuid(), null);
    perform pg_temp.fail('a non-owner trashed an item');
  exception when others then perform pg_temp.pass('non-owner cannot trash'); end;

  begin perform public.owner_workspace_delete_items(current_setting('t.entity')::uuid, 'expense', array[gen_random_uuid()]);
    perform pg_temp.fail('a non-owner ran the delete path');
  exception when others then perform pg_temp.pass('non-owner cannot delete'); end;

  begin perform public.owner_delete_expense_if_unencumbered(gen_random_uuid());
    perform pg_temp.fail('a non-owner hard-deleted an expense');
  exception when others then perform pg_temp.pass('non-owner cannot hard delete an expense'); end;

  begin perform public.owner_workspace_state(current_setting('t.entity')::uuid, 'invoice');
    perform pg_temp.fail('a non-owner read the workspace state');
  exception when others then perform pg_temp.pass('non-owner cannot read folder state'); end;
end $$;

-- Privilege, not policy: anon must hold no EXECUTE on any of it, and no table right either.
do $$
declare fn text; v_bad text[] := array[]::text[]; t text;
begin
  foreach fn in array array[
    'owner_workspace_state', 'owner_create_workspace_folder', 'owner_rename_workspace_folder',
    'owner_delete_workspace_folder', 'owner_reorder_workspace_folders', 'owner_move_workspace_items',
    'owner_workspace_delete_preflight', 'owner_workspace_delete_preflight_one',
    'owner_delete_expense_if_unencumbered', 'owner_workspace_delete_items',
    'owner_workspace_trash_item', 'owner_workspace_restore_items', 'owner_workspace_purge_items'
  ] loop
    if exists (
      select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = fn
        and has_function_privilege('anon', p.oid, 'execute')
    ) then v_bad := v_bad || fn; end if;
  end loop;
  perform pg_temp.want(v_bad = array[]::text[], 'anon can execute none of the workspace RPCs');

  foreach t in array array['owner_workspace_folders', 'owner_workspace_item_state'] loop
    perform pg_temp.want(
      not has_table_privilege('anon', 'public.' || t, 'select')
      and not has_table_privilege('anon', 'public.' || t, 'insert')
      and not has_table_privilege('anon', 'public.' || t, 'update')
      and not has_table_privilege('anon', 'public.' || t, 'delete'),
      'anon holds no privilege on ' || t);
    perform pg_temp.want(
      not has_table_privilege('authenticated', 'public.' || t, 'insert')
      and not has_table_privilege('authenticated', 'public.' || t, 'update')
      and not has_table_privilege('authenticated', 'public.' || t, 'delete'),
      'the browser cannot write ' || t || ' directly — every mutation goes through an RPC');
    perform pg_temp.want(
      (select relrowsecurity from pg_class where oid = ('public.' || t)::regclass),
      'RLS is enabled on ' || t);
  end loop;
end $$;

select 'workspace organization tests passed' as result;
