-- pgcrypto runtime regression test. Runs against a temporary DB where pgcrypto is installed
-- ONLY in the `extensions` schema (never `public`) — exactly like Supabase — so that any
-- unqualified gen_random_bytes()/digest() call would fail. Proves the runtime hotfix makes
-- finalization + secure-link creation + token verification work with schema-qualified pgcrypto.
-- Any failed assertion RAISEs and aborts (psql ON_ERROR_STOP=1 -> non-zero exit).

\set ON_ERROR_STOP on
set client_min_messages = notice;

-- Guard: pgcrypto must be in `extensions`, NOT `public` (else the test would hide the bug).
do $$
declare v_schema text;
begin
  select n.nspname into v_schema from pg_extension e join pg_namespace n on n.oid = e.extnamespace where e.extname = 'pgcrypto';
  if v_schema is null then raise exception 'pgcrypto not installed'; end if;
  if v_schema = 'public' then raise exception 'pgcrypto is in public — regression test would hide the production defect'; end if;
  raise notice 'PASS pgcrypto installed in schema "%"', v_schema;
end $$;

-- Fresh fixtures.
truncate table public.owner_offers cascade;
delete from public.owner_offer_counters;
delete from public.owner_document_settings;
delete from public.owner_finance_requests;
delete from public.owner_business_entities cascade;

insert into public.profiles (id) values ('11111111-1111-1111-1111-111111111111') on conflict do nothing;
insert into public.owner_business_entities (id, slug, display_name) values ('22222222-2222-2222-2222-222222222222','ent','Cogniiq');
insert into public.owner_document_settings (business_entity_id, legal_name, street, postal_code, city, country_code, business_email, offer_number_prefix)
  values ('22222222-2222-2222-2222-222222222222','Cogniiq UG','Beispielstr. 1','10115','Berlin','DE','info@cogniiq.de','AN');

select set_config('app.role','owner',false);
select set_config('app.uid','11111111-1111-1111-1111-111111111111',false);

do $$
declare
  v_entity uuid := '22222222-2222-2222-2222-222222222222';
  r jsonb; v_offer uuid; v_draft uuid; v_hash text; v_raw text; v_raw2 text; v_tok uuid; v_tok2 uuid;
  v_stored text; v_expected text; v_verified public.owner_document_access_tokens; v_threw boolean; v_pub jsonb; v_resp jsonb;
begin
  -- Build a finalizable offer.
  r := public.create_owner_offer(
    gen_random_uuid(),
    jsonb_build_object('business_entity_id', v_entity, 'title','Token Test','issue_date','2026-07-01','valid_until','2026-07-31',
      'recipient_source','manual','recipient_company','Kunde GmbH','recipient_street','Weg 2','recipient_city','Simbach','recipient_email','k@p.test'),
    jsonb_build_array(jsonb_build_object('description','Modul','unit_price_cents',8000000,'vat_rate_bp',1900,'vat_treatment','standard','sort_order',0)),
    '{}'::jsonb);
  v_offer := (r->>'offer_id')::uuid;

  -- Keep a separate pristine draft to prove drafts cannot receive a token.
  r := public.create_owner_offer(
    gen_random_uuid(),
    jsonb_build_object('business_entity_id', v_entity, 'title','Draft','issue_date','2026-07-01','valid_until','2026-07-31'),
    jsonb_build_array(jsonb_build_object('description','M','unit_price_cents',100,'vat_treatment','standard')), '{}'::jsonb);
  v_draft := (r->>'offer_id')::uuid;

  -- (1) finalize succeeds under the extensions-schema pgcrypto.
  r := public.finalize_owner_offer(gen_random_uuid(), v_offer);
  if (r->>'offer_number') is null then raise exception 'TEST finalize: no number'; end if;
  raise notice 'PASS finalize_owner_offer succeeds (pgcrypto resolved)';

  -- (2)(3) finalized snapshot source hash is 64 hex chars.
  select source_hash into v_hash from public.owner_offer_versions where offer_id = v_offer and version = 1;
  if v_hash !~ '^[0-9a-f]{64}$' then raise exception 'TEST hash: source hash not 64 hex, got %', v_hash; end if;
  raise notice 'PASS finalized snapshot source hash is 64 hex chars';

  -- (4)(5)(6) create token succeeds, raw token returned, token id + offer id returned.
  r := public.create_offer_access_token(v_offer, null, 30, 20);
  v_raw := r->>'token'; v_tok := (r->>'token_id')::uuid;
  if v_raw is null then raise exception 'TEST token: no raw token'; end if;
  if (r->>'offer_id')::uuid <> v_offer then raise exception 'TEST token: wrong offer id'; end if;
  if v_tok is null then raise exception 'TEST token: no token id'; end if;
  if length(v_raw) < 64 then raise exception 'TEST token: raw too short (len %)', length(v_raw); end if;  -- 32 bytes -> 64 hex
  if v_raw !~ '^[0-9a-f]{64}$' then raise exception 'TEST token: raw not hex-encoded'; end if;
  raise notice 'PASS create_offer_access_token returns a strong raw token once (len %, offer + token id)', length(v_raw);

  -- (7)(8)(9) DB stores only the hash; stored value != raw; stored hash == expected sha256.
  select token_hash into v_stored from public.owner_document_access_tokens where id = v_tok;
  v_expected := encode(extensions.digest(convert_to(v_raw, 'UTF8'), 'sha256'::text), 'hex');
  if v_stored = v_raw then raise exception 'TEST token: raw token stored in DB!'; end if;
  if v_stored <> v_expected then raise exception 'TEST token: stored hash != expected sha256'; end if;
  if exists (select 1 from public.owner_document_access_tokens where id = v_tok and token_hash = v_raw) then raise exception 'TEST token: raw persisted'; end if;
  raise notice 'PASS DB stores only the SHA-256 hash (never the raw token)';

  -- (10) two tokens differ.
  r := public.create_offer_access_token(v_offer, null, 30, 20);
  v_raw2 := r->>'token'; v_tok2 := (r->>'token_id')::uuid;
  if v_raw2 = v_raw then raise exception 'TEST token: two tokens identical (weak entropy)'; end if;
  if v_tok2 = v_tok then raise exception 'TEST token: token ids identical'; end if;
  raise notice 'PASS two created tokens are different';

  -- (11) verify accepts the valid token.
  v_verified := public.owner_verify_offer_token(v_raw);
  if v_verified.id <> v_tok then raise exception 'TEST verify: wrong token resolved'; end if;
  if v_verified.offer_id <> v_offer then raise exception 'TEST verify: wrong offer'; end if;
  raise notice 'PASS owner_verify_offer_token accepts a valid token';

  -- (12) invalid token rejected.
  v_threw := false;
  begin perform public.owner_verify_offer_token(repeat('f', 64)); exception when others then v_threw := (sqlerrm like '%invalid token%'); end;
  if not v_threw then raise exception 'TEST verify: unknown token accepted'; end if;
  v_threw := false;
  begin perform public.owner_verify_offer_token('short'); exception when others then v_threw := (sqlerrm like '%invalid token%'); end;
  if not v_threw then raise exception 'TEST verify: too-short token accepted'; end if;
  raise notice 'PASS invalid / too-short tokens are rejected';

  -- (13) revoked token rejected.
  update public.owner_document_access_tokens set revoked_at = now() where id = v_tok2;
  v_threw := false;
  begin perform public.owner_verify_offer_token(v_raw2); exception when others then v_threw := (sqlerrm like '%revoked%'); end;
  if not v_threw then raise exception 'TEST verify: revoked token accepted'; end if;
  raise notice 'PASS revoked token is rejected';

  -- (14) expired token rejected.
  update public.owner_document_access_tokens set expires_at = now() - interval '1 day' where id = v_tok;
  v_threw := false;
  begin perform public.owner_verify_offer_token(v_raw); exception when others then v_threw := (sqlerrm like '%expired%'); end;
  if not v_threw then raise exception 'TEST verify: expired token accepted'; end if;
  raise notice 'PASS expired token is rejected';

  -- (15) draft offer cannot receive a token.
  v_threw := false;
  begin perform public.create_offer_access_token(v_draft, null, 30, 20); exception when others then v_threw := (sqlerrm like '%finalize the offer%'); end;
  if not v_threw then raise exception 'TEST token: draft received a token'; end if;
  raise notice 'PASS draft offer cannot receive a token';

  -- (19)(20) public projection + acceptance work with a fresh valid token.
  r := public.create_offer_access_token(v_offer, null, 30, 20);
  v_raw := r->>'token';
  v_pub := public.public_offer_by_token(v_raw, 'test-agent');
  if v_pub->>'offer_number' is null then raise exception 'TEST public: no projection'; end if;
  if v_pub ? 'internal_notes' then raise exception 'TEST public: internal notes exposed'; end if;
  if v_pub ? 'pdf_storage_path' then raise exception 'TEST public: storage path exposed'; end if;
  raise notice 'PASS public_offer_by_token returns a curated projection (no internal notes / storage paths)';

  v_resp := public.respond_offer_by_token(v_raw, 'accepted', 'Herr Muster', 'Kunde GmbH', 'k@p.test', 'v1', 'Passt', 'test-agent');
  if v_resp->>'decision' <> 'accepted' then raise exception 'TEST respond: acceptance failed'; end if;
  if (select status from public.owner_offers where id = v_offer) <> 'accepted' then raise exception 'TEST respond: offer not accepted'; end if;
  raise notice 'PASS respond_offer_by_token records acceptance with a valid token';
end $$;

-- (16)(17)(18) admin / customer / anon cannot create a token (owner-only RPC).
select set_config('app.role','admin',false);
do $$ declare v_threw boolean := false; begin
  begin perform public.create_offer_access_token('00000000-0000-0000-0000-000000000000', null, 30, 20);
  exception when others then v_threw := (sqlerrm like '%Owner access required%'); end;
  if not v_threw then raise exception 'TEST access: admin created a token'; end if;
  raise notice 'PASS admin cannot create a token';
end $$;
select set_config('app.role','anon',false);
do $$ declare v_threw boolean := false; begin
  begin perform public.create_offer_access_token('00000000-0000-0000-0000-000000000000', null, 30, 20);
  exception when others then v_threw := (sqlerrm like '%Owner access required%'); end;
  if not v_threw then raise exception 'TEST access: anon/customer created a token'; end if;
  raise notice 'PASS customer / anon cannot create a token';
end $$;

-- (21) no private token/document table is anonymously readable (RLS + no grant to anon).
set role anon;
do $$ declare v_ok boolean := false; begin
  begin perform 1 from public.owner_document_access_tokens limit 1;
  exception when insufficient_privilege then v_ok := true; end;
  if not v_ok then raise exception 'TEST rls: owner_document_access_tokens anonymously readable'; end if;
  raise notice 'PASS private token table is not anonymously readable';
end $$;
reset role;

select 'premium-offer pgcrypto tests: ALL PASSED' as result;
