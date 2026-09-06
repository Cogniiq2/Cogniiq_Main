-- ─────────────────────────────────────────────────────────────────────────────
-- BoLaGio Private Bar — shared inventory and consumption audit.
--
-- Scope: two new tables and one function, all prefixed private_bar_. Nothing
-- existing is altered, no RLS policy on any other table is touched, and no
-- permission is widened anywhere else in the schema.
--
-- SECURITY MODEL
--   Both tables have RLS enabled and NO policies, so PostgREST reaches them for
--   nobody: anon and authenticated see and change nothing. The service role
--   bypasses RLS, and it exists only inside the Cloudflare Pages Function
--   (SUPABASE_SERVICE_ROLE_KEY, server-side env var, never in the browser
--   bundle). private_bar_confirm_order() is likewise executable only by
--   service_role — EXECUTE is revoked from public, anon and authenticated — so
--   the Function is the single security boundary.
--
-- WHERE PRICES COME FROM
--   Prices are NOT stored here as a source of truth. The canonical catalogue is
--   src/private-bar/catalog.ts, which the Cloudflare Function imports and prices
--   the order from before calling this function; the amounts recorded below are
--   the audit copy of what the guest was actually shown. Keeping one price
--   source is deliberate: a second one in the database could drift from the one
--   the guest saw.
--
-- WHAT THE STATUS MEANS
--   'awaiting_payment' — the guest confirmed they are taking these drinks and
--   stock was decremented for them. It states nothing about PayPal: this
--   architecture cannot verify a payment, so no status here may ever be read as
--   "paid". That is why 'paid', 'payment_confirmed' and 'completed' are not in
--   the allowed set at all.
-- ─────────────────────────────────────────────────────────────────────────────
begin;

-- 1 ── inventory ─────────────────────────────────────────────────────────────
create table if not exists public.private_bar_inventory (
  id            uuid primary key default gen_random_uuid(),
  apartment_id  text        not null,
  product_id    text        not null,
  stock         integer     not null default 0,
  updated_at    timestamptz not null default now(),
  constraint private_bar_inventory_stock_non_negative check (stock >= 0),
  constraint private_bar_inventory_apartment_product_key unique (apartment_id, product_id)
);

comment on table public.private_bar_inventory is
  'Physical stock per apartment for the BoLaGio Private Bar. product_id matches an id in src/private-bar/catalog.ts.';
comment on column public.private_bar_inventory.stock is
  'Bottles physically present. Decremented only by private_bar_confirm_order(); never allowed below zero.';

-- The read path fetches one apartment; the unique constraint already indexes
-- (apartment_id, product_id), which serves that prefix lookup too.

-- 2 ── consumption audit ─────────────────────────────────────────────────────
create table if not exists public.private_bar_orders (
  id              uuid primary key default gen_random_uuid(),
  client_order_id text        not null unique,
  apartment_id    text        not null,
  items           jsonb       not null,
  total_cents     integer     not null,
  currency        text        not null default 'EUR',
  status          text        not null default 'awaiting_payment',
  created_at      timestamptz not null default now(),
  constraint private_bar_orders_total_non_negative check (total_cents >= 0),
  constraint private_bar_orders_status_allowed check (status in ('awaiting_payment', 'cancelled'))
);

comment on table public.private_bar_orders is
  'What a guest confirmed they took, and the amount they were asked to pay. NOT a payment record: this architecture cannot verify PayPal.';
comment on column public.private_bar_orders.client_order_id is
  'Idempotency key minted by the browser before confirmation. UNIQUE — a retry returns the existing order instead of decrementing stock twice.';
comment on column public.private_bar_orders.status is
  'awaiting_payment: taken from the bar, payment left to the guest in PayPal. Deliberately never "paid".';

create index if not exists private_bar_orders_apartment_created_idx
  on public.private_bar_orders (apartment_id, created_at desc);

-- 3 ── lock everything down ──────────────────────────────────────────────────
alter table public.private_bar_inventory enable row level security;
alter table public.private_bar_orders    enable row level security;
-- No policies, by design: with RLS on and no policy, PostgREST exposes nothing
-- to anon or authenticated. Only the service role (which bypasses RLS, and lives
-- only in the Cloudflare Function) can read or write these tables.

revoke all on public.private_bar_inventory from anon, authenticated;
revoke all on public.private_bar_orders    from anon, authenticated;

-- 4 ── the atomic confirmation ───────────────────────────────────────────────
-- One statement from the caller's point of view: validate, record, decrement.
-- Either all of it happens or none of it does.
create or replace function public.private_bar_confirm_order(
  p_apartment_id    text,
  p_client_order_id text,
  p_items           jsonb,
  p_total_cents     integer,
  p_currency        text default 'EUR'
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_existing  public.private_bar_orders%rowtype;
  v_item      jsonb;
  v_product   text;
  v_quantity  integer;
  v_stock     integer;
  v_order_id  uuid;
begin
  if p_apartment_id is null or p_client_order_id is null or p_items is null then
    raise exception 'private_bar:malformed_request';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'private_bar:empty_selection';
  end if;

  -- Idempotency, first and cheaply: a retry of the SAME confirmation returns the
  -- order that already exists and touches no stock. This is what makes a double
  -- tap, a browser retry or a refresh safe.
  select * into v_existing
  from public.private_bar_orders
  where client_order_id = p_client_order_id;

  if found then
    return jsonb_build_object(
      'order_id',      v_existing.id,
      'total_cents',   v_existing.total_cents,
      'currency',      v_existing.currency,
      'status',        v_existing.status,
      'created_at',    v_existing.created_at,
      'idempotent',    true
    );
  end if;

  -- Take the row locks in a deterministic order (by product_id) so two guests
  -- confirming overlapping selections at the same moment queue instead of
  -- deadlocking. FOR UPDATE holds each row until this transaction ends.
  for v_item in
    select value from jsonb_array_elements(p_items) order by value ->> 'product_id'
  loop
    v_product  := v_item ->> 'product_id';
    v_quantity := (v_item ->> 'quantity')::integer;

    if v_product is null or v_quantity is null or v_quantity < 1 then
      raise exception 'private_bar:invalid_quantity';
    end if;

    select stock into v_stock
    from public.private_bar_inventory
    where apartment_id = p_apartment_id and product_id = v_product
    for update;

    -- A product with no inventory row is unstocked, not unlimited: fail closed.
    if not found then
      raise exception 'private_bar:out_of_stock:%', v_product;
    end if;
    if v_stock < v_quantity then
      raise exception 'private_bar:out_of_stock:%', v_product;
    end if;
  end loop;

  -- Every line is available. Record the order first: its UNIQUE client_order_id
  -- is the second, database-level guarantee against a concurrent duplicate —
  -- two simultaneous retries cannot both get past this insert.
  insert into public.private_bar_orders (client_order_id, apartment_id, items, total_cents, currency, status)
  values (p_client_order_id, p_apartment_id, p_items, p_total_cents, coalesce(p_currency, 'EUR'), 'awaiting_payment')
  returning id into v_order_id;

  for v_item in select value from jsonb_array_elements(p_items) loop
    update public.private_bar_inventory
    set stock = stock - (v_item ->> 'quantity')::integer,
        updated_at = now()
    where apartment_id = p_apartment_id
      and product_id = v_item ->> 'product_id';
  end loop;

  return jsonb_build_object(
    'order_id',    v_order_id,
    'total_cents', p_total_cents,
    'currency',    coalesce(p_currency, 'EUR'),
    'status',      'awaiting_payment',
    'created_at',  now(),
    'idempotent',  false
  );
end;
$$;

comment on function public.private_bar_confirm_order(text, text, jsonb, integer, text) is
  'Atomically records a Private Bar consumption and decrements stock. Idempotent on client_order_id. Callable only by service_role (the Cloudflare Function).';

-- SECURITY DEFINER means this function runs as its owner, so its callable
-- surface has to be closed deliberately: only the service role may execute it.
revoke all on function public.private_bar_confirm_order(text, text, jsonb, integer, text) from public;
revoke all on function public.private_bar_confirm_order(text, text, jsonb, integer, text) from anon, authenticated;
grant execute on function public.private_bar_confirm_order(text, text, jsonb, integer, text) to service_role;

-- 5 ── seed the nine products, FAIL CLOSED ───────────────────────────────────
-- Every product starts at 0, i.e. "not available", never "unlimited". The real
-- counts are entered afterwards with supabase/seed/private_bar_stock.sql, which
-- is the one place the owner edits.
insert into public.private_bar_inventory (apartment_id, product_id, stock)
values
  ('bolagio-apartment-1', 'stella-rossa-prosecco-doc-brut', 0),
  ('bolagio-apartment-1', 'ploner-marell', 0),
  ('bolagio-apartment-1', 'masseria-borgo-dei-trulli-primitivo', 0),
  ('bolagio-apartment-1', 'covo-moro', 0),
  ('bolagio-apartment-1', 'ploner-sauvignon', 0),
  ('bolagio-apartment-1', 'tiefenbrunner-merus-gewuerztraminer-2022', 0),
  ('bolagio-apartment-1', 'biancavigna-2022', 0),
  ('bolagio-apartment-1', 'bayreuther-hell', 0),
  ('bolagio-apartment-1', 's-pellegrino', 0)
on conflict (apartment_id, product_id) do nothing;

commit;
