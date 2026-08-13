-- D2c criterion 3 — deliberately mis-apply a DML grant.
--
-- This simulates the failure the "belt and braces" claim is supposed to survive: someone grants the
-- read-only role write privileges by mistake in a later migration. The question the spike answers is
-- whether `default_transaction_read_only = on` still prevents the write, or whether it is only a
-- default that a client can turn off.

grant insert, update, delete on spike.synthetic_bookings to cq_readonly_spike;
grant insert, update, delete on spike.synthetic_payments to cq_readonly_spike;
grant usage, select on all sequences in schema spike to cq_readonly_spike;

-- The role keeps default_transaction_read_only = on. Nothing else changes.
select rolname, rolconnlimit, rolsuper, rolbypassrls, rolconfig
from pg_roles where rolname = 'cq_readonly_spike';

select count(*) as bookings_before from spike.synthetic_bookings;
