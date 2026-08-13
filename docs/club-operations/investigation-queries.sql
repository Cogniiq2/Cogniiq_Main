-- ============================================================================================
--  NOT FOR PRODUCTION EXECUTION WITHOUT OWNER APPROVAL
-- ============================================================================================
--
--  Phase D1 §9.2 pre-report investigations, written for review in Phase D2. NONE of these queries
--  has been executed. They have not been run against a hosted project, a production database, a
--  staging database or any local database.
--
--  WHY THIS FILE IS HERE AND NOT IN supabase/migrations/
--  ------------------------------------------------------------------------------------------
--  Anything under `supabase/migrations/` is executed automatically by the migration tooling. These
--  are investigations, not schema changes, and they must never run on a deploy, in CI, in a test
--  run or as part of any build. Keeping them under `docs/` makes that structural rather than a
--  matter of anyone remembering. There is a test that fails if this file ever moves into the
--  migrations directory.
--
--  WHAT THEY ARE FOR
--  ------------------------------------------------------------------------------------------
--  Five ambiguities in the upstream financial model are documented in the D1 correction report.
--  Each one changes what a future report would be allowed to claim, and none of them can be
--  settled from committed source — only measured. These queries measure them.
--
--  PRIVACY CONSTRAINTS OBSERVED BY EVERY QUERY BELOW
--  ------------------------------------------------------------------------------------------
--    * aggregates only — COUNT, SUM, MIN, MAX; no query returns a row-level record;
--    * no name, e-mail address, telephone number, postal address, booking note, voucher code,
--      booking reference, invoice number, member number, provider identifier or cancellation
--      token appears in any select list;
--    * no free-text column is returned, because free text can contain anything;
--    * no query writes, and none is transactional: every statement is a plain SELECT.
--
--  HOW THEY SHOULD BE RUN, IF THE OWNER APPROVES
--  ------------------------------------------------------------------------------------------
--    * by the upstream system's owner, not by Cogniiq;
--    * read-only, against a read-only role or a restored snapshot;
--    * one query at a time, with the aggregate output reviewed before the next is run;
--    * results recorded as numbers in the phase report — never as exported rows.
--
--  Until every one of these is answered, no Cogniiq output may be labelled a tax report, a VAT
--  return input, or authoritative. See the D1 §9.3 authority statement.
-- ============================================================================================


-- --------------------------------------------------------------------------------------------
-- 1. REFUND-SOURCE OVERLAP                                          (D1 §9.1 #15 — evidence: I)
--
-- The upstream model treats two refund sources as additive: booking-level cancellation refunds and
-- payment-level double-booking refunds. Nothing in the schema asserts they are disjoint. If they
-- overlap at all, the additive model double-counts and must be replaced by a deduplicated one.
--
-- Decides: whether `refundedTotal = cancellation + doubleBooking` is a valid identity.
-- Expected if the model is sound: overlapping_count = 0.
-- --------------------------------------------------------------------------------------------
select
  count(*) filter (where b.refund_status = 'refunded')                        as booking_refunds,
  count(*) filter (where p.id is not null)                                    as payment_refunds_matched,
  count(*) filter (where b.refund_status = 'refunded' and p.id is not null)   as overlapping_count,
  coalesce(sum(b.amount_total) filter (where b.refund_status = 'refunded' and p.id is not null), 0)
                                                                             as overlapping_booking_gross,
  coalesce(sum(p.amount_eur)   filter (where b.refund_status = 'refunded' and p.id is not null), 0)
                                                                             as overlapping_payment_gross
from public.bookings b
left join public.payments p
  on p.reference_type = 'booking'
 and p.reference_id   = b.booking_id
 and p.status         = 'refunded';


-- --------------------------------------------------------------------------------------------
-- 2. ZERO-AMOUNT NON-FREE BOOKINGS                                  (D1 §9.1 #12 — evidence: P, conflicting)
--
-- Upstream defines "free" two different ways: by provider alone in the tax path, and by provider
-- OR a zero amount in the KPI path. The two disagree exactly for a zero-amount booking carrying a
-- real provider.
--
-- Decides: whether the free-booking definition is a material choice or a theoretical one.
-- If zero_amount_with_provider = 0, either rule is safe and the choice can be made on clarity.
-- --------------------------------------------------------------------------------------------
select
  count(*)                                                                    as total_bookings,
  count(*) filter (
    where coalesce(nullif(btrim(lower(provider)), ''), 'free') <> 'free'
      and coalesce(amount_total, 0) = 0
  )                                                                           as zero_amount_with_provider,
  count(distinct lower(btrim(provider))) filter (
    where coalesce(nullif(btrim(lower(provider)), ''), 'free') <> 'free'
      and coalesce(amount_total, 0) = 0
  )                                                                           as distinct_providers_affected,
  min(start_time) filter (
    where coalesce(nullif(btrim(lower(provider)), ''), 'free') <> 'free'
      and coalesce(amount_total, 0) = 0
  )                                                                           as earliest_affected,
  max(start_time) filter (
    where coalesce(nullif(btrim(lower(provider)), ''), 'free') <> 'free'
      and coalesce(amount_total, 0) = 0
  )                                                                           as latest_affected
from public.bookings;


-- --------------------------------------------------------------------------------------------
-- 3. NULL refund_amount ON REFUNDED BOOKINGS                        (D1 §9.1 #13 — evidence: P)
--
-- Upstream falls back to the full `amount_total` when `refund_amount` is null or blank. For a
-- partial refund with a missing amount, that overstates the refund — and therefore understates
-- revenue — silently.
--
-- Decides: whether the fallback is harmless or must be replaced by an explicit "unknown" flag.
-- Quantifies: the maximum euro overstatement the fallback can introduce.
-- --------------------------------------------------------------------------------------------
select
  count(*)                                                                    as refunded_bookings,
  count(*) filter (where refund_amount is null)                               as refund_amount_null,
  count(*) filter (where refund_amount is not null and refund_amount <= 0)    as refund_amount_non_positive,
  count(*) filter (
    where refund_amount is not null
      and refund_amount > 0
      and refund_amount < amount_total
  )                                                                           as genuine_partial_refunds,
  coalesce(sum(amount_total) filter (where refund_amount is null), 0)         as fallback_exposure_gross
from public.bookings
where refund_status = 'refunded';


-- --------------------------------------------------------------------------------------------
-- 4. UNRESOLVED MEMBERSHIP RATE                                     (D1 §9.1 #7 — evidence: B + T)
--
-- `player_membership` is self-declared free text with no join to the member register. The share of
-- padel gross that lands in the unresolved bucket is simultaneously the size of the manual-review
-- burden and the size of the VAT exposure.
--
-- The membership parse is reproduced here exactly as the committed upstream parser defines it:
-- split on '-', trim, lowercase, drop empties; any 'member' token wins; otherwise every token must
-- be in {guest, student}; anything else is unresolved.
--
-- Decides: whether a reduced-rate VAT position can rest on this field at all.
-- --------------------------------------------------------------------------------------------
with eligible as (
  select
    b.court_key,
    b.amount_total,
    b.tax_membership_override,
    (
      select array_agg(token)
      from (
        select btrim(lower(t)) as token
        from unnest(string_to_array(coalesce(b.player_membership, ''), '-')) as t
      ) tokens
      where token <> ''
    ) as membership_tokens
  from public.bookings b
  where upper(coalesce(b.status, '')) not in ('CANCELLED', 'FAILED', 'PENDING', 'REFUNDED')
    and coalesce(b.refund_status, '') <> 'refunded'
    and coalesce(nullif(btrim(lower(b.provider)), ''), 'free') <> 'free'
),
classified as (
  select
    amount_total,
    case
      when tax_membership_override in ('member', 'non_member') then tax_membership_override
      when membership_tokens is null                            then 'unresolved'
      when 'member' = any(membership_tokens)                    then 'member'
      when membership_tokens <@ array['guest', 'student']        then 'non_member'
      else 'unresolved'
    end as classification
  from eligible
  where btrim(lower(court_key)) in ('padel-1', 'padel-2')
)
select
  classification,
  count(*)                                                                    as booking_count,
  coalesce(sum(amount_total), 0)                                              as gross,
  round(
    100.0 * coalesce(sum(amount_total), 0)
      / nullif(sum(coalesce(sum(amount_total), 0)) over (), 0),
    2
  )                                                                           as gross_share_percent
from classified
group by classification
order by classification;


-- --------------------------------------------------------------------------------------------
-- 5. LEGACY VERSUS RECOMPUTED MONTHLY TOTALS                        (D1 §9.1 #19/#20/#21)
--
-- The persisted monthly report rows were produced by the browser path, which mixed UTC date slicing
-- with browser-local hours and accumulated in binary floating point. A fresh recomputation in
-- Europe/Berlin with integer arithmetic WILL differ. The question is by how much, and whether the
-- difference is confined to period boundaries or is systemic.
--
-- Decides: which figure is authoritative for a closed month, and how the delta is presented.
-- Note: this compares against a Berlin-bucketed recomputation, which is deliberately NOT how the
-- stored figure was produced — the disagreement is the measurement, not a defect in this query.
-- --------------------------------------------------------------------------------------------
with recomputed as (
  select
    to_char((b.start_time at time zone 'Europe/Berlin'), 'YYYY-MM')            as report_month,
    count(*)                                                                  as booking_count,
    coalesce(sum(b.amount_total), 0)                                          as total_revenue
  from public.bookings b
  where upper(coalesce(b.status, '')) not in ('CANCELLED', 'FAILED', 'PENDING', 'REFUNDED')
    and coalesce(b.refund_status, '') <> 'refunded'
    and coalesce(nullif(btrim(lower(b.provider)), ''), 'free') <> 'free'
  group by 1
)
select
  r.report_month,
  m.total_revenue                                                             as stored_revenue,
  r.total_revenue                                                             as recomputed_revenue,
  r.total_revenue - coalesce(m.total_revenue, 0)                              as revenue_delta,
  m.booking_count                                                             as stored_bookings,
  r.booking_count                                                             as recomputed_bookings,
  r.booking_count - coalesce(m.booking_count, 0)                              as booking_delta
from recomputed r
full outer join public.admin_monthly_reports m
  on m.report_month = r.report_month
order by 1;


-- ============================================================================================
--  END — NOT FOR PRODUCTION EXECUTION WITHOUT OWNER APPROVAL
-- ============================================================================================
