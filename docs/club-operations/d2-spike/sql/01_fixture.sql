-- D2c fixture — disposable local stack only.
--
-- Synthetic schema, synthetic rows, a throwaway role and a throwaway password. Nothing here
-- resembles any real system: the table names, columns and data are invented for the spike.

drop schema if exists spike cascade;
create schema spike;

create table spike.synthetic_bookings (
  id             bigserial primary key,
  reference      text not null,
  court_key      text not null,
  starts_at      timestamptz not null,
  amount_total   numeric(12,2) not null,
  provider       text not null,
  status         text not null,
  secret_column  text not null default 'must-never-be-selectable'
);

create table spike.synthetic_payments (
  id           bigserial primary key,
  booking_ref  text not null,
  amount_eur   numeric(12,2) not null,
  status       text not null
);

insert into spike.synthetic_bookings (reference, court_key, starts_at, amount_total, provider, status)
select
  'SYN-' || lpad(g::text, 5, '0'),
  (array['padel-1','padel-2','tennis-1','tennis-2','tennis-3'])[1 + (g % 5)],
  timestamptz '2026-01-01 08:00:00+00' + (g || ' hours')::interval,
  round((10 + (g % 40))::numeric, 2),
  (array['stripe','paypal','gutschein'])[1 + (g % 3)],
  (array['CONFIRMED','PENDING','CANCELLED'])[1 + (g % 3)]
from generate_series(1, 500) g;

insert into spike.synthetic_payments (booking_ref, amount_eur, status)
select 'SYN-' || lpad(g::text, 5, '0'), round((10 + (g % 40))::numeric, 2),
       (array['succeeded','refunded','pending'])[1 + (g % 3)]
from generate_series(1, 500) g;

-- An arbitrary function the read-only role must not be able to execute.
create or replace function spike.arbitrary_function()
returns text
language sql
as $$ select 'this must never run as the read-only role' $$;

revoke execute on function spike.arbitrary_function() from public;

-- A function that writes, to prove EXECUTE denial is not merely about the return value.
create or replace function spike.writing_function()
returns void
language sql
as $$ insert into spike.synthetic_payments (booking_ref, amount_eur, status)
     values ('VIA-FUNCTION', 1.00, 'succeeded') $$;

revoke execute on function spike.writing_function() from public;

-- ─── The dedicated read-only role ──────────────────────────────────────────────────────────────
-- Throwaway credential for a disposable local container. It is not a secret, it is not reused, and
-- the whole stack is destroyed at the end of the spike.

drop role if exists cq_readonly_spike;
create role cq_readonly_spike
  login
  nosuperuser
  nocreatedb
  nocreaterole
  noinherit
  noreplication
  nobypassrls
  connection limit 4
  password :'spike_password';   -- supplied with psql -v spike_password=... (throwaway, local only)

-- Belt and braces: every transaction starts read-only at the engine level.
alter role cq_readonly_spike set default_transaction_read_only = on;
alter role cq_readonly_spike set statement_timeout = '2s';
alter role cq_readonly_spike set idle_in_transaction_session_timeout = '10s';

grant usage on schema spike to cq_readonly_spike;

-- Column-scoped SELECT only. `secret_column` is deliberately excluded.
grant select (id, reference, court_key, starts_at, amount_total, provider, status)
  on spike.synthetic_bookings to cq_readonly_spike;
grant select (id, booking_ref, amount_eur, status)
  on spike.synthetic_payments to cq_readonly_spike;

-- No INSERT/UPDATE/DELETE, no sequence usage, no EXECUTE, no default privileges on future objects.

-- RLS applies (the role is NOBYPASSRLS), so an additive policy is required or it reads nothing.
alter table spike.synthetic_bookings enable row level security;
alter table spike.synthetic_payments enable row level security;

create policy spike_bookings_readonly on spike.synthetic_bookings
  for select to cq_readonly_spike using (true);
create policy spike_payments_readonly on spike.synthetic_payments
  for select to cq_readonly_spike using (true);

-- A slow function used to prove the server, not the client, cancels a long statement.
create or replace function spike.sleep_seconds(sec double precision)
returns text
language sql
as $$ select pg_sleep(sec)::text $$;

grant execute on function spike.sleep_seconds(double precision) to cq_readonly_spike;
