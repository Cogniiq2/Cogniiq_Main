// Club Operations — Gutscheine.
//
// Read-only. No creation, redemption, adjustment, resend or deactivation exists here.
//
// Composition: a voucher is a liability, so the section is built around the one number that matters
// — how much of the issued value is still owed — and around the date it stops being owed. Each row
// carries a consumption bar, so "how far through is it" is answerable without comparing two
// currency figures. Vouchers that expired holding a balance are called out separately: they are the
// only rows where the club's exposure quietly turned into the customer's loss.

import { useCallback, useMemo, useState } from 'react';
import { Gift, SearchX } from 'lucide-react';

import { EmptyState, StatusBadge } from '@/components/dashboard/primitives';
import { radius, space, text } from '@/components/dashboard/tokens';
import { cn } from '@/lib/utils';

import type { ClubOperationsAdapter } from '../adapter/ClubOperationsAdapter';
import { CompositionBar, type CompositionSlice } from '../components/charts';
import { DetailLayout, DetailPanel } from '../components/DetailPanel';
import { FilterBar } from '../components/FilterBar';
import { MetricRow, MetricStrip, PrimaryMetric } from '../components/MetricCard';
import { RecordTable, type RecordColumn } from '../components/RecordTable';
import { SectionShell } from '../components/SectionShell';
import { FIXTURE_TODAY } from '../fixtures/vouchers';
import { hasNoActiveFacets, withSeed } from '../filtering';
import { formatCents, formatCount, formatDate, formatDateTime, formatPercent, percentOf } from '../formatting';
import { voucherStatusLabels, voucherStatusTones } from '../labels';
import { chartReveal } from '../motion';
import { voucherStatusOptions } from '../options';
import { voucherStatuses, type Voucher, type VoucherPage, type VoucherQuery } from '../types';
import { emptyVoucherQuery } from '../types';
import { useClubOperationsResource } from '../useClubOperationsResource';

/** How much of a voucher's value has been used, 0–100. */
function consumedPercent(voucher: Voucher): number {
  return percentOf(voucher.originalValueCents - voucher.remainingCents, voucher.originalValueCents);
}

/** A voucher whose validity lapsed while it still held value. */
function isStranded(voucher: Voucher): boolean {
  return voucher.status === 'expired' && voucher.remainingCents > 0;
}

export function VouchersSection({
  adapter,
  seededQuery,
}: {
  adapter: ClubOperationsAdapter;
  seededQuery?: Record<string, string>;
}) {
  const [query, setQuery] = useState<VoucherQuery>(() => withSeed(emptyVoucherQuery, seededQuery));
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { search, status } = query;
  const resource = useClubOperationsResource<VoucherPage>(
    () => adapter.listVouchers({ search, status }),
    [adapter, search, status],
  );

  const reset = useCallback(() => {
    setQuery(emptyVoucherQuery);
    setSelectedId(null);
  }, []);

  const patch = (partial: Partial<VoucherQuery>) => setQuery((prev) => ({ ...prev, ...partial }));

  const columns: RecordColumn<Voucher>[] = useMemo(
    () => [
      {
        key: 'code',
        header: 'Code',
        width: '150px',
        render: (row) => <span className={cn(text.bodyStrong, 'tabular-nums')}>{row.code}</span>,
        sortValue: (row) => row.code,
        mobile: 'hidden',
      },
      {
        key: 'buyer',
        header: 'Käufer',
        render: (row) => (
          <span className="break-words">
            {row.buyerName ?? <span className="text-[var(--cq-fg-subtle)]">noch nicht verkauft</span>}
          </span>
        ),
        sortValue: (row) => row.buyerName ?? '',
        mobile: 'hidden',
      },
      {
        key: 'status',
        header: 'Status',
        width: '150px',
        render: (row) => (
          <StatusBadge label={voucherStatusLabels[row.status]} tone={voucherStatusTones[row.status]} />
        ),
        sortValue: (row) => voucherStatuses.indexOf(row.status),
        mobile: 'hidden',
      },
      {
        key: 'consumed',
        header: 'Verbraucht',
        width: '132px',
        render: (row) => (
          <span className="flex items-center gap-2">
            <span
              className={cn('h-1.5 w-14 shrink-0 overflow-hidden bg-[var(--cq-sunken)]', radius.full)}
              aria-hidden="true"
            >
              <span
                className={cn('block h-full', radius.full, chartReveal)}
                style={{
                  width: `${consumedPercent(row)}%`,
                  background: isStranded(row) ? 'var(--cq-chart-4)' : 'var(--cq-chart-1)',
                }}
              />
            </span>
            <span className="tabular-nums">{formatPercent(consumedPercent(row))}</span>
          </span>
        ),
        sortValue: (row) => consumedPercent(row),
        mobile: 'primary',
      },
      {
        key: 'expires',
        header: 'Gültig bis',
        width: '128px',
        render: (row) => (
          <span
            className={cn(
              'whitespace-nowrap tabular-nums',
              // Only a known date can be past. An unknown one is not overdue, and must not be
              // coloured as though it were.
              row.expiresAt !== null && row.expiresAt < FIXTURE_TODAY && 'text-red-600',
            )}
          >
            {formatDate(row.expiresAt)}
          </span>
        ),
        sortValue: (row) => row.expiresAt,
        mobile: 'primary',
      },
      {
        key: 'usages',
        header: 'Einlösungen',
        align: 'right',
        width: '110px',
        // `null` means redemption history is not tracked upstream, so there is no count to show —
        // as opposed to a tracked history that happens to be empty, which is a legitimate 0.
        render: (row) => formatCount(row.usages?.length ?? null),
        sortValue: (row) => row.usages?.length ?? null,
        mobile: 'secondary',
      },
      {
        key: 'original',
        header: 'Wert',
        align: 'right',
        width: '104px',
        render: (row) => formatCents(row.originalValueCents),
        sortValue: (row) => row.originalValueCents,
        mobile: 'secondary',
      },
      {
        key: 'remaining',
        header: 'Restguthaben',
        align: 'right',
        width: '124px',
        render: (row) => (
          <span className={cn(text.bodyStrong, isStranded(row) && 'text-amber-700')}>
            {formatCents(row.remainingCents)}
          </span>
        ),
        sortValue: (row) => row.remainingCents,
        mobile: 'primary',
      },
    ],
    [],
  );

  return (
    <SectionShell
      title="Gutscheine"
      description="Welcher Wert ausgegeben ist, wie viel davon noch offen ist und wann er verfällt."
      resource={resource}
      loadingLabel="Gutscheine werden geladen"
      errorTitle="Gutscheine konnten nicht geladen werden"
      notice="Gutscheine können hier nicht erstellt, eingelöst oder deaktiviert werden."
      toolbar={
        <FilterBar
          query={query}
          onReset={reset}
          resultCount={resource.data?.total ?? 0}
          countLabel={['Gutschein', 'Gutscheine']}
          facets={[
            { kind: 'text', key: 'voucher-search', label: 'Suche', value: search ?? '', placeholder: 'Code oder Käufer', onChange: (value) => patch({ search: value }), wide: true },
            { kind: 'select', key: 'voucher-status', label: 'Status', value: status ?? 'all', options: voucherStatusOptions, onChange: (value) => patch({ status: value as VoucherQuery['status'] }) },
          ]}
        />
      }
    >
      {(page) => {
        const selected = page.vouchers.find((voucher) => voucher.id === selectedId) ?? null;

        if (page.vouchers.length === 0) {
          return hasNoActiveFacets(query) ? (
            <EmptyState icon={Gift} title="Noch keine Gutscheine" description="Sobald Gutscheine ausgegeben werden, erscheinen sie hier." />
          ) : (
            <EmptyState icon={SearchX} title="Keine Gutscheine für diese Filter" description="Passen Sie die Suche oder die Filter an, um wieder Ergebnisse zu sehen." />
          );
        }

        // "Expired holding a balance" is only answerable where the expiry date is. With it absent no
        // voucher can be shown to have expired, so a count of none would assert that the club has no
        // stranded value — a claim about money customers paid and may never redeem. Unknown, not nil.
        const expiryKnown = page.vouchers.every((voucher) => voucher.expiresAt !== null);
        const stranded = page.vouchers.filter(isStranded);
        const strandedCount = expiryKnown ? stranded.length : null;
        const strandedValue = expiryKnown
          ? stranded.reduce((total, voucher) => total + voucher.remainingCents, 0)
          : null;

        const statusSlices: CompositionSlice[] = voucherStatuses
          .map((value, index) => ({
            key: value,
            label: voucherStatusLabels[value],
            value: page.vouchers.filter((voucher) => voucher.status === value).length,
            tone: index,
          }))
          .filter((slice) => slice.value > 0)
          .map((slice) => ({ ...slice, display: formatCount(slice.value) }));

        return (
          <div className={space.pageGap}>
            <MetricRow label="Gutscheinbestand im aktuellen Filter" columns={3}>
              <PrimaryMetric
                label="Ausgegebener Wert"
                value={formatCents(page.totals.issuedValueCents)}
                footnote={`${formatCount(page.totals.count)} Gutscheine`}
              />
              <PrimaryMetric
                label="Eingelöst"
                value={formatCents(page.totals.redeemedValueCents)}
                footnote={`${formatPercent(percentOf(page.totals.redeemedValueCents, page.totals.issuedValueCents), 1)} des ausgegebenen Werts`}
              />
              <PrimaryMetric
                label="Offenes Restguthaben"
                value={formatCents(page.totals.outstandingValueCents)}
                footnote="Verbindlichkeit gegenüber Kunden"
              />
            </MetricRow>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className={cn('flex flex-col gap-3')}>
                <MetricStrip
                  items={[
                    { label: 'Verfallen', value: formatCount(page.totals.expiredCount), hint: 'Gültigkeit abgelaufen' },
                    { label: 'Verfallen mit Restwert', value: formatCount(strandedCount), hint: formatCents(strandedValue) },
                    { label: 'Vollständig eingelöst', value: formatCount(page.vouchers.filter((voucher) => voucher.status === 'redeemed').length), hint: 'kein Restguthaben' },
                    { label: 'Noch nicht verkauft', value: formatCount(page.vouchers.filter((voucher) => voucher.status === 'open').length), hint: 'ausgestellt, offen' },
                  ]}
                />
                {stranded.length > 0 ? (
                  <p
                    className={cn(
                      'flex items-start gap-2 border px-3.5 py-2.5',
                      radius.lg,
                      'border-amber-200 bg-amber-50 text-[12.5px] leading-5 text-amber-800',
                    )}
                  >
                    {formatCount(stranded.length)} Gutschein
                    {stranded.length === 1 ? '' : 'e'} mit zusammen {formatCents(strandedValue)}{' '}
                    Restguthaben sind abgelaufen. Der Betrag ist im offenen Restguthaben oben nicht
                    enthalten.
                  </p>
                ) : null}
              </div>

              <div className="rounded-[12px]">
                <CompositionBar
                  slices={statusSlices}
                  emptyLabel="Keine Gutscheine im aktuellen Filter."
                  totalLabel={`${formatCount(page.total)} Gutscheine`}
                />
              </div>
            </div>

            <DetailLayout
              list={
                <RecordTable
                  caption="Gutscheine"
                  columns={columns}
                  rows={page.vouchers}
                  getRowKey={(row) => row.id}
                  selectedKey={selectedId}
                  onSelect={(row) => setSelectedId(row.id)}
                  rowLabel={(row) => `Gutschein ${row.code}`}
                  mobileTitle={(row) => row.code}
                  mobileSubtitle={(row) => row.buyerName ?? 'Noch nicht verkauft'}
                  mobileBadge={(row) => (
                    <StatusBadge
                      label={voucherStatusLabels[row.status]}
                      tone={voucherStatusTones[row.status]}
                    />
                  )}
                  initialSort={{ key: 'expires', direction: 'asc' }}
                  minWidth={1080}
                />
              }
              detail={
                selected ? (
                  <DetailPanel
                    eyebrow="Gutschein"
                    title={selected.code}
                    onClose={() => setSelectedId(null)}
                    subtitle={
                      <StatusBadge
                        label={voucherStatusLabels[selected.status]}
                        tone={voucherStatusTones[selected.status]}
                      />
                    }
                    groups={[
                      {
                        label: 'Guthaben',
                        rows: [
                          { label: 'Ursprungswert', value: <span className={text.numeric}>{formatCents(selected.originalValueCents)}</span> },
                          { label: 'Eingelöst', value: <span className={text.numeric}>{formatCents(selected.originalValueCents - selected.remainingCents)}</span> },
                          { label: 'Restguthaben', value: <span className={cn(text.numeric, text.bodyStrong)}>{formatCents(selected.remainingCents)}</span> },
                          { label: 'Verbraucht', value: <span className={text.numeric}>{formatPercent(consumedPercent(selected))}</span> },
                        ],
                      },
                      {
                        label: 'Laufzeit',
                        rows: [
                          { label: 'Käufer', value: <span className="break-words">{selected.buyerName ?? '—'}</span> },
                          { label: 'Ausgestellt', value: <span className={text.numeric}>{formatDate(selected.issuedAt)}</span> },
                          { label: 'Verkauft', value: <span className={text.numeric}>{selected.soldAt ? formatDate(selected.soldAt) : '—'}</span> },
                          { label: 'Gültig bis', value: <span className={text.numeric}>{formatDate(selected.expiresAt)}</span> },
                        ],
                      },
                    ]}
                  >
                    <div className="mt-4">
                      <p className={text.eyebrow}>Einlösungen</p>
                      {selected.usages === null ? (
                        // Not the same sentence as "hasn't been redeemed yet": the club's system does
                        // not record redemption history at all, so claiming the voucher is unused
                        // would be asserting something nobody can know.
                        <p className={cn('mt-2', text.hint)}>
                          Einlösungen werden im Vereinssystem nicht erfasst.
                        </p>
                      ) : selected.usages.length === 0 ? (
                        <p className={cn('mt-2', text.hint)}>Dieser Gutschein wurde noch nicht eingelöst.</p>
                      ) : (
                        <ol className="mt-2 space-y-2.5">
                          {selected.usages.map((usage) => (
                            <li
                              key={usage.id}
                              className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5"
                            >
                              <span className={text.body}>{usage.bookingReference}</span>
                              <span className={cn('tabular-nums', text.bodyStrong)}>
                                {formatCents(usage.amountCents)}
                              </span>
                              <span className={cn('w-full tabular-nums', text.hint)}>
                                {formatDateTime(usage.redeemedAt)}
                              </span>
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>
                  </DetailPanel>
                ) : null
              }
            />
          </div>
        );
      }}
    </SectionShell>
  );
}
