-- =============================================================================
-- owner_invoice_preflight: repair the missing-field reporting.
--
-- THE BUG
--
-- 20260723125000_owner_signature_proposal_experience.sql introduced
-- owner_invoice_preflight() as a read-only completeness gate whose contract is,
-- in its own words: "Returns { ok, missing[] }. Never raises; never sends an
-- incomplete invoice." Each of its seven checks appends to a text[] local like
-- this:
--
--     declare missing text[] := '{}';
--     ...
--     missing := missing || 'seller_legal_name';
--
-- The right-hand side is an UNKNOWN-typed literal, and PostgreSQL resolves
-- `text[] || unknown` to the array||array form of the operator rather than the
-- array||element form. The literal is therefore parsed as an ARRAY LITERAL, and
-- because 'seller_legal_name' does not start with '{' the statement dies with:
--
--     ERROR:  malformed array literal: "seller_legal_name"
--     DETAIL: Array value must start with "{" or dimension information.
--
-- This is not conditional on the data: it happens on the FIRST branch that
-- fires, for every literal, whether the array is empty or not. The function
-- therefore works only when nothing is missing, and raises in exactly the case
-- it exists to describe — the inverse of its contract.
--
-- CONFIRMED IMPACT
--
-- owner_process_offer_acceptance() calls owner_invoice_preflight() unguarded and
-- has no exception handler, so the error propagates and aborts the WHOLE
-- acceptance transaction. An accepted offer whose recipient address or whose
-- seller document settings are incomplete — precisely the case the preflight was
-- built to report — takes down the invoice draft, the signed acceptance
-- certificate, the confirmation e-mail and the owner notification with it.
--
-- THE FIX
--
-- array_append(missing, '...') on all seven branches. array_append is
-- unambiguously scalar-appending: there is no overload it can be resolved to
-- that would reinterpret the literal as an array, and unlike `|| array['...']`
-- it cannot be silently re-broken by a later edit that drops the array[]
-- wrapper.
--
-- NOTHING ELSE CHANGES. Same signature, same volatility, same SECURITY DEFINER,
-- same search_path, same seven checks in the same order, same
-- jsonb_build_object('ok', ..., 'missing', ...) result shape, same grants. The
-- happy path — the only path that worked before — is byte-for-byte identical:
-- with nothing missing the loop never appends, array_length(missing,1) is still
-- null, and the function still returns {"ok": true, "missing": []}.
--
-- The seven identifiers are part of the result contract and are reproduced
-- verbatim; the ORDER they are appended in is the order the checks run, which is
-- unchanged, so `missing` stays deterministic for any caller that depends on it.
--
-- This migration is create-or-replace only: no table, column, index, constraint,
-- trigger, grant, policy or row is touched. It rewrites no data, changes no
-- accounting or tax semantics, touches no invoice numbering and no snapshot.
-- Safely re-appliable.
-- =============================================================================

begin;

create or replace function public.owner_invoice_preflight(p_entity uuid, p_offer_id uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare s record; o record; missing text[] := '{}';
begin
  select * into s from public.owner_document_settings where business_entity_id = p_entity;
  select * into o from public.owner_offers where id = p_offer_id;
  if coalesce(s.legal_name,'') = '' then missing := array_append(missing, 'seller_legal_name'); end if;
  if coalesce(s.street,'') = '' or coalesce(s.city,'') = '' then missing := array_append(missing, 'seller_address'); end if;
  if coalesce(s.vat_id,'') = '' and coalesce(s.tax_number,'') = '' then missing := array_append(missing, 'seller_tax_information'); end if;
  if coalesce(s.invoice_number_prefix,'') = '' then missing := array_append(missing, 'invoice_number_configuration'); end if;
  if coalesce(o.recipient_company,'') = '' then missing := array_append(missing, 'recipient_legal_name'); end if;
  if coalesce(o.recipient_street,'') = '' or coalesce(o.recipient_city,'') = '' then missing := array_append(missing, 'recipient_address'); end if;
  if coalesce(s.business_email,'') = '' then missing := array_append(missing, 'sender_email_configuration'); end if;
  return jsonb_build_object('ok', array_length(missing,1) is null, 'missing', to_jsonb(missing));
end;
$$;

comment on function public.owner_invoice_preflight(uuid, uuid) is
  'Read-only completeness gate before issuing/sending an invoice. Returns { ok, missing[] } and '
  'never raises. Appends with array_append: `missing || ''literal''` resolves to array||array and '
  'dies with "malformed array literal" on the first missing field (fixed 20260901120000).';

-- Unchanged from 20260723125000; restated so the grant set is explicit next to
-- the definition rather than only in the original migration.
revoke execute on function public.owner_invoice_preflight(uuid, uuid) from public, anon;
grant execute on function public.owner_invoice_preflight(uuid, uuid) to authenticated, service_role;

commit;
