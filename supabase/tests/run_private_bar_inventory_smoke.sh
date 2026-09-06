#!/usr/bin/env bash
set -euo pipefail

# BoLaGio Private Bar inventory DB smoke test.
#
# Verifies the guarantees that only the database can actually make: an
# all-or-nothing decrement, idempotency on client_order_id, stock that can never
# go negative, fail-closed behaviour for products with no inventory row, and a
# function/table surface that anon and authenticated cannot reach.
#
# Usage: DATABASE_URL=postgres://... bash supabase/tests/run_private_bar_inventory_smoke.sh

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@127.0.0.1:5432/postgres}"
run_psql() { psql "$DATABASE_URL" -v ON_ERROR_STOP=1 "$@"; }

# Supabase roles the migration references.
run_psql <<'SQL'
create extension if not exists pgcrypto;
do $$ begin create role anon nologin; exception when duplicate_object then null; end $$;
do $$ begin create role authenticated nologin; exception when duplicate_object then null; end $$;
do $$ begin create role service_role nologin bypassrls; exception when duplicate_object then null; end $$;
alter role service_role bypassrls;
drop table if exists public.private_bar_orders cascade;
drop table if exists public.private_bar_inventory cascade;
SQL

run_psql -f "$ROOT_DIR/supabase/migrations/20260906120000_private_bar_inventory.sql"

run_psql <<'SQL'
\set ON_ERROR_STOP on
set search_path = public;

-- Stock for the test apartment.
update private_bar_inventory set stock = 3 where apartment_id = 'bolagio-apartment-1' and product_id = 'bayreuther-hell';
update private_bar_inventory set stock = 1 where apartment_id = 'bolagio-apartment-1' and product_id = 's-pellegrino';

do $$
declare
  v_result jsonb;
  v_stock  integer;
  v_orders integer;
begin
  -- 1 ─ a valid confirmation decrements exactly once.
  v_result := private_bar_confirm_order(
    'bolagio-apartment-1',
    '11111111-1111-4111-8111-111111111111',
    '[{"product_id":"bayreuther-hell","quantity":2}]'::jsonb,
    900, 'EUR');
  if (v_result ->> 'status') <> 'awaiting_payment' then
    raise exception 'FAIL 1: unexpected status %', v_result;
  end if;
  select stock into v_stock from private_bar_inventory where product_id = 'bayreuther-hell';
  if v_stock <> 1 then raise exception 'FAIL 1: stock is %, expected 1', v_stock; end if;

  -- 2 ─ the same client_order_id is the SAME order: no second decrement.
  v_result := private_bar_confirm_order(
    'bolagio-apartment-1',
    '11111111-1111-4111-8111-111111111111',
    '[{"product_id":"bayreuther-hell","quantity":2}]'::jsonb,
    900, 'EUR');
  if (v_result ->> 'idempotent') <> 'true' then
    raise exception 'FAIL 2: replay was not reported as idempotent: %', v_result;
  end if;
  select stock into v_stock from private_bar_inventory where product_id = 'bayreuther-hell';
  if v_stock <> 1 then raise exception 'FAIL 2: replay changed stock to %', v_stock; end if;
  select count(*) into v_orders from private_bar_orders;
  if v_orders <> 1 then raise exception 'FAIL 2: % orders exist, expected 1', v_orders; end if;

  -- 3 ─ insufficient stock rejects the WHOLE order: no partial decrement.
  begin
    v_result := private_bar_confirm_order(
      'bolagio-apartment-1',
      '22222222-2222-4222-8222-222222222222',
      '[{"product_id":"bayreuther-hell","quantity":1},{"product_id":"s-pellegrino","quantity":5}]'::jsonb,
      2700, 'EUR');
    raise exception 'FAIL 3: an impossible order was accepted';
  exception when others then
    if sqlerrm not like 'private_bar:out_of_stock%' then raise; end if;
  end;
  select stock into v_stock from private_bar_inventory where product_id = 'bayreuther-hell';
  if v_stock <> 1 then raise exception 'FAIL 3: the available line was decremented anyway (stock %)', v_stock; end if;
  select stock into v_stock from private_bar_inventory where product_id = 's-pellegrino';
  if v_stock <> 1 then raise exception 'FAIL 3: the unavailable line was decremented (stock %)', v_stock; end if;
  select count(*) into v_orders from private_bar_orders;
  if v_orders <> 1 then raise exception 'FAIL 3: a rejected order was still recorded'; end if;

  -- 4 ─ a product with no inventory row is unstocked, not unlimited.
  begin
    v_result := private_bar_confirm_order(
      'bolagio-apartment-1',
      '33333333-3333-4333-8333-333333333333',
      '[{"product_id":"not-in-this-apartment","quantity":1}]'::jsonb,
      100, 'EUR');
    raise exception 'FAIL 4: an unstocked product was accepted';
  exception when others then
    if sqlerrm not like 'private_bar:out_of_stock%' then raise; end if;
  end;

  -- 5 ─ a different client_order_id is a new, valid order.
  v_result := private_bar_confirm_order(
    'bolagio-apartment-1',
    '44444444-4444-4444-8444-444444444444',
    '[{"product_id":"bayreuther-hell","quantity":1}]'::jsonb,
    450, 'EUR');
  select stock into v_stock from private_bar_inventory where product_id = 'bayreuther-hell';
  if v_stock <> 0 then raise exception 'FAIL 5: stock is %, expected 0', v_stock; end if;
  select count(*) into v_orders from private_bar_orders;
  if v_orders <> 2 then raise exception 'FAIL 5: % orders exist, expected 2', v_orders; end if;

  -- 6 ─ the last bottle is gone: the next request fails rather than going negative.
  begin
    v_result := private_bar_confirm_order(
      'bolagio-apartment-1',
      '55555555-5555-4555-8555-555555555555',
      '[{"product_id":"bayreuther-hell","quantity":1}]'::jsonb,
      450, 'EUR');
    raise exception 'FAIL 6: an order was accepted with zero stock';
  exception when others then
    if sqlerrm not like 'private_bar:out_of_stock%' then raise; end if;
  end;

  raise notice 'private bar inventory: all function checks passed';
end $$;

-- 7 ─ the CHECK constraint is the last line of defence against a negative count.
do $$
begin
  update private_bar_inventory set stock = -1 where product_id = 's-pellegrino';
  raise exception 'FAIL 7: stock was allowed to go negative';
exception when check_violation then
  raise notice 'private bar inventory: negative stock rejected by constraint';
end $$;

-- 8 ─ the guest-facing roles reach none of it.
do $$
declare
  v_can boolean;
begin
  select has_function_privilege('anon', 'public.private_bar_confirm_order(text,text,jsonb,integer,text)', 'execute')
    into v_can;
  if v_can then raise exception 'FAIL 8: anon may execute the confirmation function'; end if;

  select has_function_privilege('authenticated', 'public.private_bar_confirm_order(text,text,jsonb,integer,text)', 'execute')
    into v_can;
  if v_can then raise exception 'FAIL 8: authenticated may execute the confirmation function'; end if;

  select has_table_privilege('anon', 'public.private_bar_inventory', 'select') into v_can;
  if v_can then raise exception 'FAIL 8: anon may read inventory directly'; end if;

  select has_table_privilege('anon', 'public.private_bar_orders', 'insert') into v_can;
  if v_can then raise exception 'FAIL 8: anon may write orders directly'; end if;

  if not (select relrowsecurity from pg_class where oid = 'public.private_bar_inventory'::regclass) then
    raise exception 'FAIL 8: RLS is not enabled on private_bar_inventory';
  end if;
  if not (select relrowsecurity from pg_class where oid = 'public.private_bar_orders'::regclass) then
    raise exception 'FAIL 8: RLS is not enabled on private_bar_orders';
  end if;

  raise notice 'private bar inventory: anon and authenticated are locked out';
end $$;
SQL

echo "✓ Private Bar inventory smoke test passed."
