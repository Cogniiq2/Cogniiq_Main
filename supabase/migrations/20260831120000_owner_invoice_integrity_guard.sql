-- =============================================================================
-- Invoice integrity safeguards (PR-0A).
--
-- WHY THIS EXISTS
--
-- Three confirmed holes, all of them at the only level that matters — the
-- database — because the browser is never the boundary:
--
--   1. ISSUED INVOICES WERE MUTABLE BY THE CLIENT.
--      20260722120000 revoked the table-wide UPDATE on owner_invoices and
--      re-granted it on a column list that includes status, issue_date,
--      due_date, currency, service_date, service_period_*, organization_id,
--      client_account_id, engagement_id, notes, external_reference and
--      archived_at. owner_guard_invoice() then only refused two things: the
--      DELETE of a non-draft, and a change of invoice_number on a non-draft.
--      Everything else on an ALREADY-ISSUED invoice — its date, its due date,
--      its currency, who it is addressed to — was writable with one PostgREST
--      call by any authenticated session that passes the owner RLS check. That
--      silently rewrites a legal document (§14 UStG) after the fact, and it
--      does so BEHIND the immutable snapshot: owner_invoice_versions keeps the
--      rendered document honest, but the row the bookkeeping, the EÜR and the
--      UStVA read from is the live one.
--
--   2. STATUS WAS DIRECTLY CLIENT-WRITABLE.
--      Same grant. An issued invoice could be turned into 'paid', 'cancelled'
--      or back to 'draft' by raw UPDATE, bypassing owner_cancel_invoice (which
--      records who/when/why), bypassing the payment ledger (which is what
--      amount_paid_cents and the derived status are supposed to come from) and
--      bypassing issue_owner_invoice (which allocates the number and captures
--      the snapshot). src/lib/ownerFinance/api.ts::setInvoiceStatus was exactly
--      that call; it is deleted in the same change.
--      The guard trigger was also `before update or delete` only, so a client
--      could INSERT a row that was 'issued' with a hand-picked invoice_number.
--
--   3. AUTOMATION CONVERTED OFFERS BY DIFFERENT RULES THAN THE OWNER DID.
--      owner_convert_offer_internal() (20260723125000) is the function the
--      acceptance pipeline and the automation worker use. It was written before
--      20260825064048 reworked the manual path, and never caught up. Against
--      convert_owner_offer_to_invoice_draft() it:
--        * copied EVERY non-optional offer line, including pricing_type =
--          'recurring' — so an accepted offer with a monthly retainer billed
--          that retainer on the initial one-time invoice, which the manual path
--          deliberately never does;
--        * wrote no source_offer_id / source_offer_conversion_kind /
--          source_offer_milestone_index, so it was invisible to the
--          owner_invoices_offer_full_once / owner_invoices_offer_milestone_once
--          unique indexes AND to the pre-flight duplicate checks. Concretely:
--          after the owner manually invoiced "Rate 1" (a milestone conversion
--          leaves the offer 'accepted' and converted_invoice_id null ON
--          PURPOSE), acceptance automation created a SECOND invoice for the
--          FULL one-time amount of the same offer. The customer is billed
--          150 %;
--        * had no "is there anything one-time to invoice?" check, so a
--          recurring-only offer produced an invoice made entirely of recurring
--          lines;
--        * resolved the payment term from a different settings column.
--      Neither path linked the canonical owner_customers row.
--
-- WHAT THIS DOES
--
--   * Removes ALL direct DML on owner_invoices from every role: anon none,
--     authenticated SELECT, service_role SELECT. Every write the application
--     performs already goes through a SECURITY DEFINER RPC (create_owner_invoice,
--     issue_owner_invoice, owner_cancel_invoice, owner_link_invoice_customer,
--     assign_invoice_organization, record_owner_invoice_payment,
--     delete_owner_draft_invoice, ...), which runs as its owner and therefore
--     needs no grant.
--   * Rewrites owner_guard_invoice() so that AFTER ISSUANCE the permitted
--     mutations are decided by FIELD DELTA and VALID STATE TRANSITION, not by
--     the caller's privilege. There is no "privileged => allow everything"
--     branch for a non-draft invoice: a SECURITY DEFINER RPC, service_role and
--     the database owner are all held to the same three whitelisted
--     transitions (ledger-consistent payment application, Storno, first-time
--     CRM link). The realistic threat to an issued invoice is not a malicious
--     browser — it is a future privileged RPC with a bug in it, and only a
--     delta check catches that. Hard-deleting a non-draft invoice is refused
--     for every caller, with no service-role or admin bypass.
--   * Hardens owner_guard_invoice_line() the same way: once the parent invoice
--     leaves draft its lines are frozen for everyone, so a privileged edit
--     cannot rewrite the document text without moving the totals.
--   * Extracts owner_convert_offer_to_invoice_core(): ONE body holding the whole
--     offer -> initial-invoice business rule. convert_owner_offer_to_invoice_draft
--     (owner-gated + idempotency-keyed) and owner_convert_offer_internal
--     (service/automation) both delegate to it and can no longer diverge.
--   * Redefines owner_process_offer_acceptance() with a single behavioural
--     change: it no longer announces "Rechnung automatisch erstellt" when no
--     invoice was created. Everything else in that function is byte-identical to
--     20260723127000.
--
-- WHAT THIS DOES NOT DO
--
--   * It does not touch owner_invoice_versions, the snapshot builders, invoice
--     numbering, the Storno flow, the payment ledger, tax/VAT/EÜR logic, the
--     recurring scheduler, or any historical row. It rewrites no data at all:
--     the only DML in this file is none.
--   * It does not relax anything. Every branch it adds can only refuse.
--   * It grants no new capability to any role. The only grant statements in this
--     file are REVOKEs plus the re-grants that keep the two conversion RPCs
--     exactly as reachable as they were.
--
-- Idempotent and safely re-appliable: create-or-replace throughout, plus
-- drop-and-recreate for the one trigger whose event list changes.
-- =============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. Remove the client write capability on owner_invoices.
--
--    NO ROLE GETS DIRECT DML ON THIS TABLE. Not `authenticated`, not
--    `service_role`. After this migration the direct permissions are:
--
--        anon           none
--        authenticated  SELECT
--        service_role   SELECT
--
--    A column-level REVOKE cannot subtract from a grant, so the whole UPDATE
--    grant goes and nothing is re-granted. INSERT goes with it, and both go for
--    service_role as well, because the INSERT branch of the guard below
--    deliberately lets a privileged caller insert ANY shape — which it must, for
--    migrations, backfills, the staging fixture seed and the issuance RPCs that
--    insert a draft and then issue it. Leaving raw INSERT with the service key
--    would therefore have left a way to manufacture a finished, "paid" invoice
--    directly, with no number allocation from the counter and no
--    owner_invoice_versions snapshot — the one thing this PR exists to prevent.
--
--    Every creation and mutation path in the repository is a SECURITY DEFINER
--    function (create_owner_invoice, record_owner_historical_paid_invoice,
--    owner_build_issued_invoice, owner_convert_offer_to_invoice_core,
--    issue_owner_invoice, owner_issue_invoice_internal, owner_cancel_invoice,
--    owner_link_invoice_customer, assign_invoice_organization,
--    delete_owner_draft_invoice, and the owner_apply_payment /
--    owner_recalc_invoice_totals triggers). A SECURITY DEFINER function runs as
--    its OWNER, so none of them consults these grants and none of them breaks.
--    A repository-wide sweep — src/, supabase/functions/, the automation
--    worker, the QA scripts, scripts/staging/, supabase/tests/ — found no raw
--    INSERT, UPDATE or DELETE against this table by any client or service-key
--    caller. The staging fixture seed runs as the database owner via psql, not
--    as service_role, and is unaffected.
--
--    owner_invoice_lines keeps its column grant: the hardened
--    owner_guard_invoice_line() below refuses every line write once the parent
--    invoice leaves draft, for all callers.
-- ---------------------------------------------------------------------------
revoke insert, update, delete on table public.owner_invoices from authenticated;
revoke insert, update, delete on table public.owner_invoices from service_role;

comment on table public.owner_invoices is
  'Owner invoices. NO role holds direct DML: anon none, authenticated SELECT, service_role '
  'SELECT. Every mutation goes through a SECURITY DEFINER RPC (create_owner_invoice, '
  'issue_owner_invoice, owner_cancel_invoice, owner_link_invoice_customer, '
  'assign_invoice_organization, record_owner_invoice_payment, delete_owner_draft_invoice). '
  'owner_guard_invoice() then enforces post-issuance immutability by FIELD DELTA for every '
  'caller, privileged ones included.';

commit;

begin;

-- ---------------------------------------------------------------------------
-- 2. owner_guard_invoice — post-issuance immutability by field delta.
--
--    THE INVARIANT THIS ENFORCES
--
--    Once an invoice has left draft it is a legal document (§14 UStG) and an
--    accounting fact. From that moment the ONLY changes it may undergo are the
--    ones the authoritative mechanisms genuinely produce. That has to hold for
--    every caller — a SECURITY DEFINER RPC, service_role and the database owner
--    included — because the realistic threat is not a malicious browser, it is a
--    future RPC with a bug in it. A guard that trusts the caller's privilege
--    cannot catch that; a guard that validates the DELTA can.
--
--    So the previous "privileged => allow everything" branch is gone. What
--    remains is a whitelist of complete, validated transitions, computed by
--    diffing to_jsonb(old) against to_jsonb(new). Anything not on the list is
--    refused, which means a column ADDED to this table in the future is frozen
--    after issuance by default rather than quietly mutable.
--
--    ALLOWED POST-ISSUANCE TRANSITIONS (each is an exact whole-row delta):
--
--    (A) PAYMENT-DERIVED — {amount_paid_cents} and/or {status}.
--        Not merely whitelisted: RE-DERIVED. amount_paid_cents must equal the
--        sum of inflow payments on the ledger and status must equal what
--        owner_apply_payment() computes from that same sum. A payment-shaped
--        UPDATE that does not agree with the ledger is refused, so this branch
--        cannot be used to invent a payment.
--
--    (B) STORNO — {status, cancelled_at, cancelled_by, cancellation_reason},
--        only into 'cancelled', only from a non-cancelled, non-void, non-draft
--        state, and only with cancelled_at actually set. Exactly what
--        owner_cancel_invoice() writes; drafts are deleted, never cancelled.
--
--    (C) FIRST-TIME CRM/PORTAL LINK — {organization_id} or {owner_customer_id},
--        and ONLY null -> a value.
--        This is the one deliberate deviation from "freeze every identity
--        field", and it is narrow on purpose. assign_invoice_organization()
--        exists precisely to attach an ALREADY-ISSUED invoice that predates
--        portal provisioning to its organization (it is live in
--        src/lib/customerPlatform/ownerProjectsApi.ts and has its own CI suite),
--        and owner_link_invoice_customer() does the same for the canonical
--        customer. Both RPCs already refuse re-pointing themselves; this branch
--        refuses it a second time, at the table. Neither can alter the issued
--        document: the recipient was frozen into owner_invoice_versions at
--        issuance and is never re-read from these columns.
--        To make these fields absolutely immutable instead, delete this branch —
--        assign_invoice_organization() then fails for issued invoices.
--
--    FROZEN AFTER ISSUANCE FOR EVERY CALLER — everything else on the table:
--      invoice_number, issued_at, issue_date, service_date,
--      service_period_start, service_period_end, due_date, currency,
--      net_total_cents, vat_total_cents, gross_total_cents, notes,
--      external_reference, engagement_id, client_account_id, historical_entry,
--      source_offer_id, source_offer_conversion_kind,
--      source_offer_milestone_index, archived_at, business_entity_id,
--      created_by, created_at, id — plus any column a later migration adds.
--
--      archived_at is frozen deliberately: a repository-wide search found NO
--      writer for it on owner_invoices (the cockpit only ever FILTERS on it), so
--      there is no legitimate mutation to preserve. If archiving an issued
--      invoice is ever wanted, it needs an RPC and an entry here — which is the
--      point: the whitelist is a decision, not an oversight.
--
--      'void', 'credited' and 'overdue' become unreachable statuses. Nothing in
--      the codebase ever set them; the only path that could was the deleted
--      client-side setInvoiceStatus. Reaching them would need a sanctioned RPC
--      and a branch here.
--
--    updated_at is excluded from the diff: owner_invoices_set_updated_at is a
--    separate BEFORE UPDATE trigger that fires after this one.
--
--    PRE-ISSUANCE (status = 'draft' AND issued_at IS NULL — the repository's own
--    definition of a real draft, the same one delete_owner_draft_invoice uses):
--    server paths keep full freedom, which is what lets create/edit/recalculate
--    and the draft -> issued transition itself work. An unprivileged caller is
--    refused outright; the revoked grants already make that unreachable, and
--    this branch is what keeps it true if a later migration re-grants.
--
--    DELETE: a real draft only, for EVERY caller. The previous
--    is_database_admin()/request_is_service_role() bypass is removed — an issued
--    or cancelled invoice is accounting history and hard-deleting it is never a
--    routine operation. There is no documented emergency path in this repository
--    that requires it, so none is preserved. The DBA escape hatch that remains
--    is `set session_replication_role = replica`, which needs superuser, is not
--    reachable from PostgREST by `authenticated` or `service_role`, and is an
--    explicit, deliberate act rather than a caller-privilege bypass.
--
--    INSERT: a privileged caller may insert any shape — migrations, backfills
--    and the staging fixture seed depend on it, and every issuance RPC inserts a
--    draft and then issues it. An unprivileged caller may only ever create a
--    genuine draft.
-- ---------------------------------------------------------------------------
create or replace function public.owner_guard_invoice()
returns trigger language plpgsql set search_path = public, pg_temp as $guard$
declare
  v_privileged boolean;
  v_was_draft boolean;
  v_changed text[];
  v_paid bigint;
  v_expected_status text;
begin
  -- "Privileged" means a genuine database-owner context, which is exactly what a
  -- SECURITY DEFINER function gives its body — nothing else. request_is_service_role()
  -- is deliberately NOT part of this: a service-role JWT is a request header, and
  -- treating it as privileged would mean the service key could insert a finished,
  -- numbered, "paid" invoice directly if the revoked grant above were ever restored.
  -- It reaches every legitimate operation through the same RPCs everyone else uses.
  v_privileged := public.is_database_admin();

  if tg_op = 'DELETE' then
    if old.status <> 'draft' or old.issued_at is not null then
      raise exception
        'invoice % is % and cannot be deleted; accounting history is kept (cancel it instead)',
        coalesce(old.invoice_number, old.id::text), old.status;
    end if;
    return old;
  end if;

  if tg_op = 'INSERT' then
    if v_privileged then return new; end if;
    -- A client may only ever create a genuine draft. Number allocation, issuance
    -- and cancellation are server acts; letting an INSERT carry them would be the
    -- same forgery as an UPDATE, one statement earlier.
    if coalesce(new.status, 'draft') <> 'draft'
       or new.invoice_number is not null
       or new.issued_at is not null
       or new.cancelled_at is not null
       or new.cancelled_by is not null
       or new.cancellation_reason is not null then
      raise exception 'invoices can only be created as drafts; use issue_owner_invoice to issue';
    end if;
    return new;
  end if;

  -- ----------------------------- UPDATE ------------------------------------
  v_was_draft := old.status = 'draft' and old.issued_at is null;

  if v_was_draft and new.status = 'issued' and new.issued_at is null then
    new.issued_at := now();
  end if;

  -- A client session may not write this table AT ALL, at any lifecycle stage.
  -- The revoked grant already makes this unreachable; the check is what keeps it
  -- true if a later migration re-grants, and it runs before the post-issuance
  -- whitelist so a client can never reach even a well-formed payment update.
  if not v_privileged then
    raise exception
      'invoices cannot be modified directly; use the invoice RPCs (issue, cancel, record payment)';
  end if;

  if v_was_draft then
    return new;
  end if;

  -- Post-issuance. Caller privilege is deliberately NOT consulted from here on:
  -- among privileged callers the delta is the whole test, because the realistic
  -- threat is a sanctioned RPC with a bug in it.
  select coalesce(array_agg(k order by k), array[]::text[]) into v_changed
  from jsonb_object_keys(to_jsonb(new)) as k
  where k <> 'updated_at'
    and (to_jsonb(new) -> k) is distinct from (to_jsonb(old) -> k);

  if array_length(v_changed, 1) is null then
    return new;                                   -- no-op update
  end if;

  -- (A) Payment-derived, re-derived from the ledger rather than trusted.
  if v_changed <@ array['amount_paid_cents', 'status'] then
    select coalesce(sum(p.amount_cents), 0) into v_paid
    from public.owner_payments p
    where p.invoice_id = new.id and p.direction = 'inflow';

    v_expected_status := case
      when old.status in ('draft', 'void', 'cancelled', 'credited') then old.status
      when v_paid >= new.gross_total_cents and new.gross_total_cents > 0 then 'paid'
      when v_paid > 0 then 'partially_paid'
      else 'issued'
    end;

    if new.amount_paid_cents = v_paid and new.status = v_expected_status then
      return new;
    end if;
    raise exception
      'invoice % : a payment-derived update must match the payment ledger (ledger %, attempted paid %, expected status %, attempted %)',
      coalesce(new.invoice_number, new.id::text), v_paid, new.amount_paid_cents,
      v_expected_status, new.status;
  end if;

  -- (B) Storno.
  if v_changed <@ array['status', 'cancelled_at', 'cancelled_by', 'cancellation_reason']
     and new.status = 'cancelled'
     and old.status not in ('cancelled', 'void')
     and new.cancelled_at is not null then
    return new;
  end if;

  -- (C) First-time CRM / portal link, null -> value only.
  if v_changed = array['organization_id']
     and old.organization_id is null and new.organization_id is not null then
    return new;
  end if;
  if v_changed = array['owner_customer_id']
     and old.owner_customer_id is null and new.owner_customer_id is not null then
    return new;
  end if;

  raise exception
    'invoice % is % and its issuance-defining fields are immutable; refused change to: %',
    coalesce(old.invoice_number, old.id::text), old.status, array_to_string(v_changed, ', ');
end;
$guard$;

comment on function public.owner_guard_invoice() is
  'Row guard for owner_invoices. Once an invoice leaves draft, the only permitted UPDATEs are a '
  'ledger-consistent payment application, a Storno into cancelled, and a first-time '
  'organization/owner_customer link — validated by field delta for EVERY caller, including '
  'SECURITY DEFINER RPCs, service_role and the database owner. Non-draft invoices can never be '
  'hard-deleted. A client session may not write the table at all.';

-- The event list changes (INSERT is added), which create-or-replace on the
-- function cannot do — the trigger itself has to be recreated.
drop trigger if exists owner_invoices_guard on public.owner_invoices;
create trigger owner_invoices_guard before insert or update or delete on public.owner_invoices
  for each row execute function public.owner_guard_invoice();

-- ---------------------------------------------------------------------------
-- 2b. owner_guard_invoice_line — the same principle one table down.
--
--     The header guard already refuses any change to the totals, so a privileged
--     line edit that changes money is caught there. A line edit that does NOT
--     change money — a description, a service period, a sort order — would slip
--     past it, and the description is document-defining text on the issued PDF.
--     The is_database_admin()/request_is_service_role() bypass is therefore
--     removed here too: once the parent invoice leaves draft, its lines are
--     frozen for everyone.
--
--     The parent-is-gone case is kept exactly as before: when a draft invoice is
--     deleted, ON DELETE CASCADE removes the parent row first, so the lookup
--     finds nothing and the cascade proceeds.
-- ---------------------------------------------------------------------------
create or replace function public.owner_guard_invoice_line()
returns trigger language plpgsql set search_path = public, pg_temp as $line$
declare inv record;
begin
  select status, issued_at, invoice_number into inv
  from public.owner_invoices where id = coalesce(new.invoice_id, old.invoice_id);
  if inv.status is not null and (inv.status <> 'draft' or inv.issued_at is not null) then
    raise exception 'invoice lines cannot be changed after issuance; use cancellation or a credit note';
  end if;
  return coalesce(new, old);
end;
$line$;

drop trigger if exists owner_invoice_lines_guard on public.owner_invoice_lines;
create trigger owner_invoice_lines_guard before insert or update or delete on public.owner_invoice_lines
  for each row execute function public.owner_guard_invoice_line();

commit;

begin;

-- ---------------------------------------------------------------------------
-- 3. owner_convert_offer_to_invoice_core — the ONE definition of
--    "offer -> initial invoice".
--
--    This is the body of convert_owner_offer_to_invoice_draft as it stands in
--    20260825064048, lifted verbatim minus the two things that are about the
--    CALLER rather than about the conversion: the interactive owner check and
--    the idempotency-key claim. Both wrappers below add back what they need.
--    The business rules — recurring lines excluded, one-time amount required,
--    milestone scaling, the three mutually-exclusive duplicate rules, the
--    provenance columns, the terminal-only-for-full offer update — now exist
--    exactly once and cannot drift again.
--
--    Two deliberate additions, applying equally to both callers:
--      * owner_customer_id is copied from the offer (re-checked against the
--        invoice's business entity), so a converted invoice carries the
--        canonical CRM link and owner_invoice_recipient_snapshot() resolves its
--        recipient from 'owner_customer' rather than falling back. Neither path
--        did this before.
--      * p_created_by is a parameter: the owner's auth.uid() for a manual
--        conversion, the offer's author for an unattended one. Attribution, not
--        a business rule.
--
--    One convergence the owner should know about: the two paths resolved the
--    payment term from DIFFERENT settings columns — the manual path from
--    default_payment_terms_days ("Zahlungsziel"), the automation from
--    coalesce(default_invoice_due_days, default_payment_terms_days)
--    ("Rechnungs-Fälligkeit"). One rule has to win. The manual path's is kept,
--    because it is the owner-facing, human-reviewed path this PR was told to
--    treat as canonical, and keeping it leaves manual conversion byte-identical.
--    The visible effect is limited to unattended conversions on an entity where
--    those two settings differ; both default to 14.
--
--    Not callable by anyone: no grant is issued after the revoke, so only the
--    function owner reaches it — which is precisely the two SECURITY DEFINER
--    wrappers below.
-- ---------------------------------------------------------------------------
create or replace function public.owner_convert_offer_to_invoice_core(
  p_offer_id uuid, p_milestone_index int, p_created_by uuid
)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $core$
declare
  o record; v_inv uuid; v_line record; v_group record; v_terms int;
  v_recurring_excluded int; v_one_time_net bigint; v_milestone jsonb; v_ratio numeric; v_label text;
  v_group_count int; v_desc text; v_net bigint; v_customer uuid;
  v_full_invoiced boolean; v_milestone_total int; v_this_milestone int;
begin
  select * into o from public.owner_offers where id = p_offer_id for update;
  if o.id is null then raise exception 'offer not found'; end if;

  -- What has this offer already produced? Counted across ALL statuses on purpose: a cancelled
  -- invoice keeps its slot (see the unique-index comment in 20260825064048).
  select
    coalesce(bool_or(i.source_offer_conversion_kind = 'full'), false),
    count(*) filter (where i.source_offer_conversion_kind = 'milestone'),
    count(*) filter (where i.source_offer_conversion_kind = 'milestone'
                       and i.source_offer_milestone_index = p_milestone_index)
  into v_full_invoiced, v_milestone_total, v_this_milestone
  from public.owner_invoices i where i.source_offer_id = p_offer_id;

  -- converted_invoice_id is the authoritative "full conversion happened" marker: it is also set
  -- by conversions made BEFORE 20260825064048, whose invoices carry no source_offer_* columns.
  v_full_invoiced := v_full_invoiced or o.converted_invoice_id is not null;

  if p_milestone_index is null then
    -- Idempotent re-conversion: a REPEAT of the same full conversion returns the existing
    -- invoice rather than raising or duplicating.
    if v_full_invoiced then
      return jsonb_build_object('invoice_id', o.converted_invoice_id, 'offer_id', p_offer_id, 'idempotent', true);
    end if;
    if v_milestone_total > 0 then
      raise exception 'cannot invoice the full one-time amount: % instalment invoice(s) already exist for this offer', v_milestone_total;
    end if;
  else
    if v_full_invoiced then
      raise exception 'cannot invoice an instalment: the full one-time amount of this offer has already been invoiced';
    end if;
    if v_this_milestone > 0 then
      raise exception 'payment-plan instalment % has already been invoiced for this offer', p_milestone_index + 1;
    end if;
  end if;

  if o.status <> 'accepted' then raise exception 'only accepted offers can be converted'; end if;

  select coalesce(sum(net_cents), 0) into v_one_time_net from public.owner_offer_lines
    where offer_id = p_offer_id and is_optional = false and pricing_type = 'one_time';
  if v_one_time_net <= 0 then
    raise exception 'offer has no invoiceable one-time position — recurring positions are billed separately';
  end if;

  v_label := null; v_ratio := null;
  if p_milestone_index is not null then
    if jsonb_typeof(o.payment_schedule) <> 'array' or p_milestone_index < 0
       or p_milestone_index >= jsonb_array_length(o.payment_schedule) then
      raise exception 'invalid payment milestone index';
    end if;
    v_milestone := o.payment_schedule -> p_milestone_index;
    v_label := coalesce(v_milestone->>'label', 'Rate ' || (p_milestone_index + 1));
    if v_milestone ? 'percentage_bp' and (v_milestone->>'percentage_bp') is not null then
      v_ratio := (v_milestone->>'percentage_bp')::numeric / 10000;
      v_label := v_label || ' (' || round((v_milestone->>'percentage_bp')::numeric / 100, 2) || ' %)';
    elsif v_milestone ? 'amount_cents' and (v_milestone->>'amount_cents') is not null then
      v_ratio := (v_milestone->>'amount_cents')::numeric / v_one_time_net;
    else
      raise exception 'payment milestone has neither a percentage nor an amount';
    end if;
    if v_ratio <= 0 then raise exception 'payment milestone resolves to a non-positive amount'; end if;
  end if;

  select coalesce(default_payment_terms_days, 14) into v_terms from public.owner_document_settings where business_entity_id = o.business_entity_id;
  v_terms := coalesce(v_terms, 14);

  -- Canonical customer link, re-verified against the entity the invoice belongs to. A mismatch
  -- (which owner_link_invoice_customer would refuse outright) degrades to "no link" rather than
  -- failing the conversion, because the CRM link is metadata, not part of the document.
  select c.id into v_customer from public.owner_customers c
    where c.id = o.owner_customer_id and c.business_entity_id = o.business_entity_id;

  -- Recording the provenance in the same INSERT is what makes the unique indexes the real
  -- guarantee: a concurrent duplicate fails here, inside this transaction, before any invoice
  -- line exists.
  insert into public.owner_invoices (business_entity_id, organization_id, client_account_id, engagement_id,
    owner_customer_id, source_offer_id, source_offer_conversion_kind, source_offer_milestone_index,
    status, issue_date, service_date, due_date, currency, notes, external_reference, created_by)
  values (o.business_entity_id, o.organization_id, o.client_account_id, o.engagement_id, v_customer, o.id,
    case when p_milestone_index is null then 'full' else 'milestone' end, p_milestone_index,
    'draft', current_date, current_date, current_date + v_terms, o.currency,
    coalesce(o.payment_terms, ''), 'Angebot ' || coalesce(o.offer_number, o.id::text), p_created_by)
  returning id into v_inv;

  if p_milestone_index is null then
    -- Full one-time amount: copied verbatim, one invoice line per offer line.
    for v_line in select * from public.owner_offer_lines
      where offer_id = p_offer_id and is_optional = false and pricing_type = 'one_time' order by sort_order loop
      insert into public.owner_invoice_lines (invoice_id, description, quantity_milli, unit_price_cents, vat_rate_bp, vat_treatment, sort_order)
      values (v_inv, v_line.description, v_line.quantity_milli, v_line.unit_price_cents, v_line.vat_rate_bp, v_line.vat_treatment, v_line.sort_order);
    end loop;
  else
    -- A rate: one invoice line per (vat_rate_bp, vat_treatment) group among the one-time
    -- lines, each scaled by the milestone's ratio.
    select count(*) into v_group_count from (
      select 1 from public.owner_offer_lines
      where offer_id = p_offer_id and is_optional = false and pricing_type = 'one_time'
      group by vat_rate_bp, vat_treatment
    ) g;
    for v_group in
      select vat_rate_bp, vat_treatment, sum(net_cents) as grp_net from public.owner_offer_lines
      where offer_id = p_offer_id and is_optional = false and pricing_type = 'one_time'
      group by vat_rate_bp, vat_treatment order by vat_rate_bp desc
    loop
      v_net := round(v_group.grp_net * v_ratio);
      v_desc := v_label || case when v_group_count > 1 then format(' (%s USt)', v_group.vat_rate_bp / 100.0) else '' end;
      insert into public.owner_invoice_lines (invoice_id, description, quantity_milli, unit_price_cents, vat_rate_bp, vat_treatment, sort_order)
      values (v_inv, v_desc, 1000, v_net, v_group.vat_rate_bp, v_group.vat_treatment, 0);
    end loop;
  end if;

  select count(*) into v_recurring_excluded from public.owner_offer_lines
    where offer_id = p_offer_id and is_optional = false and pricing_type = 'recurring';

  -- Only a FULL conversion is terminal. A rate invoice leaves the offer 'accepted' so the next
  -- rate — or the eventual full remainder — stays a possible, deliberate future action.
  if p_milestone_index is null then
    update public.owner_offers set converted_invoice_id = v_inv, converted_at = now(), status = 'converted' where id = p_offer_id;
  end if;

  return jsonb_build_object(
    'invoice_id', v_inv, 'offer_id', p_offer_id, 'recurring_lines_excluded', v_recurring_excluded,
    'milestone_label', v_label, 'is_full_conversion', p_milestone_index is null);
end;
$core$;

-- Internal only. No grant follows this revoke on purpose: the two wrappers below are SECURITY
-- DEFINER and therefore already run as this function's owner.
revoke execute on function public.owner_convert_offer_to_invoice_core(uuid, int, uuid) from public, anon, authenticated, service_role;

comment on function public.owner_convert_offer_to_invoice_core(uuid, int, uuid) is
  'The single definition of offer -> initial-invoice conversion. Not callable directly; '
  'convert_owner_offer_to_invoice_draft (owner) and owner_convert_offer_internal (automation) '
  'both delegate here so the two can never diverge again.';

commit;

begin;

-- ---------------------------------------------------------------------------
-- 4. The owner-facing wrapper. Identical externally: same signature, same owner
--    gate, same idempotency-key semantics, same result shape.
-- ---------------------------------------------------------------------------
create or replace function public.convert_owner_offer_to_invoice_draft(
  p_idempotency_key uuid, p_offer_id uuid, p_milestone_index int default null
)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $fn$
declare v_existing jsonb; v_result jsonb;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  v_existing := public.owner_claim_idempotency(p_idempotency_key, 'convert_owner_offer_to_invoice_draft');
  if v_existing is not null then return v_existing; end if;

  v_result := public.owner_convert_offer_to_invoice_core(p_offer_id, p_milestone_index, auth.uid());

  update public.owner_finance_requests set result = v_result where idempotency_key = p_idempotency_key;
  return v_result;
end;
$fn$;

revoke execute on function public.convert_owner_offer_to_invoice_draft(uuid, uuid, int) from public, anon;
grant execute on function public.convert_owner_offer_to_invoice_draft(uuid, uuid, int) to authenticated, service_role;

commit;

begin;

-- ---------------------------------------------------------------------------
-- 5. The automation wrapper. Same signature and same return type as before
--    (uuid), so every caller — owner_process_offer_acceptance,
--    owner_ensure_offer_invoice_internal — is untouched.
--
--    One deliberate difference from the owner path: an offer with nothing
--    one-time to invoice returns NULL instead of raising. The owner clicking
--    "Rechnung erzeugen" on a recurring-only offer should be told why nothing
--    happened; unattended acceptance of that same offer must not abort the whole
--    acceptance transaction (certificate, confirmation e-mail, notifications)
--    over an invoice that correctly does not exist. Callers already treat a null
--    invoice as "no invoice to issue or send".
-- ---------------------------------------------------------------------------
create or replace function public.owner_convert_offer_internal(p_offer_id uuid)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $fn$
declare o record; v_one_time_net bigint; v_result jsonb;
begin
  select * into o from public.owner_offers where id = p_offer_id;
  if o.id is null then raise exception 'offer not found'; end if;
  if o.converted_invoice_id is not null then return o.converted_invoice_id; end if;

  select coalesce(sum(net_cents), 0) into v_one_time_net from public.owner_offer_lines
    where offer_id = p_offer_id and is_optional = false and pricing_type = 'one_time';
  if v_one_time_net <= 0 then return null; end if;

  v_result := public.owner_convert_offer_to_invoice_core(p_offer_id, null, o.created_by);
  return (v_result->>'invoice_id')::uuid;
end;
$fn$;

revoke execute on function public.owner_convert_offer_internal(uuid) from public, anon, authenticated;
grant execute on function public.owner_convert_offer_internal(uuid) to service_role;

comment on function public.owner_convert_offer_internal(uuid) is
  'Automation entry point for offer -> initial invoice. Delegates to '
  'owner_convert_offer_to_invoice_core so it follows exactly the rules the owner-facing '
  'conversion follows. Returns null when the offer has no one-time position to invoice.';

commit;

begin;

-- ---------------------------------------------------------------------------
-- 6. owner_process_offer_acceptance — the 20260723127000 body with ONE change:
--    the "Rechnung automatisch erstellt" notification is now conditional on an
--    invoice actually having been created. Previously the conversion could not
--    return null, so the notification was unconditional; now a recurring-only
--    offer would otherwise announce an invoice that does not exist and store a
--    notification pointing at resource_id = null.
--    Everything else below is unchanged, including the certificate and
--    confirmation blocks and the preflight-gated issue/send enqueues.
-- ---------------------------------------------------------------------------
create or replace function public.owner_process_offer_acceptance(p_offer_id uuid, p_accept_event uuid default null)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $fn$
declare o record; s record; e record; v_inv uuid; v_pre jsonb; v_email text; v_subject text;
  v_created boolean := false; v_has_signature boolean := false; v_cert_queued boolean := false; v_conf_queued boolean := false;
begin
  select * into o from public.owner_offers where id = p_offer_id for update;
  if o.id is null then raise exception 'offer not found'; end if;
  if o.status not in ('accepted','converted') then
    return jsonb_build_object('processed', false, 'reason', 'offer_not_accepted');
  end if;

  select * into s from public.owner_document_settings where business_entity_id = o.business_entity_id;
  v_pre := public.owner_invoice_preflight(o.business_entity_id, o.id);
  v_email := coalesce(nullif(trim(o.recipient_email),''), s.business_email);
  v_subject := coalesce(nullif(s.invoice_email_subject_template,''),
    'Ihre Rechnung zu Angebot ' || coalesce(o.offer_number,''));

  -- The latest accepted event drives certificate eligibility (a signature must exist).
  select * into e from public.owner_offer_acceptance_events
    where offer_id = o.id and decision = 'accepted' order by event_order desc limit 1;
  v_has_signature := e.id is not null and coalesce(e.signature_storage_path,'') <> '' and coalesce(e.signature_sha256,'') <> '';

  -- (a) Create the invoice draft (default: on). Idempotent via converted_invoice_id.
  if coalesce(s.auto_create_invoice_on_acceptance, true) then
    if o.converted_invoice_id is not null then
      v_inv := o.converted_invoice_id;
    else
      if o.status = 'accepted' then
        v_inv := public.owner_convert_offer_internal(o.id);
        -- Null means the offer had no one-time position to bill; there is nothing to announce.
        if v_inv is not null then
          v_created := true;
          insert into public.owner_finance_notifications (business_entity_id, category, title, body, resource_type, resource_id, amount_cents, priority)
          values (o.business_entity_id, 'invoice_created', 'Rechnung automatisch erstellt',
            'Zu ' || coalesce(o.offer_number,'') || ' wurde ein Rechnungsentwurf erstellt.', 'owner_invoices', v_inv, o.gross_total_cents, 'normal');
        end if;
      end if;
    end if;
  end if;

  -- (b) Signed acceptance certificate (default: on). Only when a signature was captured.
  if coalesce(s.auto_generate_signed_certificate_on_acceptance, true) and v_has_signature then
    perform public.owner_enqueue_automation_job(o.business_entity_id, 'signed_offer_certificate_generate',
      o.id, null, coalesce(p_accept_event, e.id), v_email, 'Annahmebestätigung ' || coalesce(o.offer_number,''), '{}'::jsonb);
    v_cert_queued := true;
  end if;

  -- (c) Premium confirmation email (default: on). Needs a recipient email; the worker
  --     ensures the certificate exists before attaching it.
  if coalesce(s.auto_send_signed_confirmation_on_acceptance, true) and coalesce(v_email,'') <> '' then
    perform public.owner_enqueue_automation_job(o.business_entity_id, 'signed_offer_confirmation_email',
      o.id, null, coalesce(p_accept_event, e.id), v_email,
      'Ihre Annahme des Angebots ' || coalesce(o.offer_number,'') || ' wurde bestätigt', '{}'::jsonb);
    v_conf_queued := true;
  end if;

  -- (d) Invoice issue + send are only queued when preflight passes AND the owner enabled them.
  if (v_pre->>'ok')::boolean then
    if coalesce(s.auto_issue_invoice_on_acceptance, false) and v_inv is not null then
      perform public.owner_enqueue_automation_job(o.business_entity_id, 'invoice_issue', o.id, v_inv, p_accept_event, v_email, v_subject, '{}'::jsonb);
    end if;
    if coalesce(s.auto_send_invoice_on_acceptance, false) and v_inv is not null then
      perform public.owner_enqueue_automation_job(o.business_entity_id, 'invoice_send', o.id, v_inv, p_accept_event, v_email, v_subject, '{}'::jsonb);
    end if;
  else
    insert into public.owner_finance_notifications (business_entity_id, category, title, body, resource_type, resource_id, amount_cents, priority)
    values (o.business_entity_id, 'automation_attention', 'Automatisierung benötigt Aufmerksamkeit',
      'Die Rechnung zu ' || coalesce(o.offer_number,'') || ' konnte nicht automatisch versendet werden (fehlende Angaben).',
      'owner_offers', o.id, o.gross_total_cents, 'high');
  end if;

  return jsonb_build_object('processed', true, 'invoice_id', v_inv, 'invoice_created', v_created,
    'certificate_queued', v_cert_queued, 'confirmation_queued', v_conf_queued, 'preflight', v_pre);
end;
$fn$;

revoke execute on function public.owner_process_offer_acceptance(uuid, uuid) from public, anon;
grant execute on function public.owner_process_offer_acceptance(uuid, uuid) to authenticated, service_role;

commit;
