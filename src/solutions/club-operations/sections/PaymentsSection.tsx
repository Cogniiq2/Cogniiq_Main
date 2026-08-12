// Club Operations — Zahlungen.
//
// Read-only payment ledger. No capture, retry, refund or any other payment mutation exists here,
// and the adapter contract has no method that could perform one.
//
// Composition: the question this section answers is "did the money arrive, and how much of it
// stayed". So gross / refunded / net lead as one continuous statement, the two compositions that
// explain them sit beside each other, and the ledger itself carries the detail. The previous version
// opened with eight equally weighted cards, four of which — including "Zahlungswege: 3" — were
// counts of things nobody reconciles.

import { useCallback, useMemo, useState } from 'react';
import { BadgeEuro, SearchX } from 'lucide-react';

import { StatusBadge } from '@/components/dashboard/primitives';
import { EmptyState } from '@/components/dashboard/primitives';
import { space, text } from '@/components/dashboard/tokens';
import { cn } from '@/lib/utils';

import type { ClubOperationsAdapter } from '../adapter/ClubOperationsAdapter';
import { CompositionBar, type CompositionSlice } from '../components/charts';
import { DetailLayout, DetailNote, DetailPanel } from '../components/DetailPanel';
import { FilterBar } from '../components/FilterBar';
import { MetricRow, MetricStrip, PrimaryMetric } from '../components/MetricCard';
import { RecordTable, type RecordColumn } from '../components/RecordTable';
import { Panel, SectionShell } from '../components/SectionShell';
import { hasNoActiveFacets, withSeed } from '../filtering';
import { formatCents, formatCount, formatDate, formatDateTime, formatTime } from '../formatting';
import {
  paymentMetaClassLabels,
  paymentMetaClassTones,
  paymentProviderLabels,
  paymentReferenceTypeLabels,
  paymentStatusLabels,
  paymentStatusTones,
} from '../labels';
import { paymentMetaClassOptions, paymentProviderOptions, paymentStatusOptions } from '../options';
import type { Payment, PaymentPage, PaymentQuery } from '../types';
import { emptyPaymentQuery } from '../types';
import { useClubOperationsResource } from '../useClubOperationsResource';

/** Fixed palette index per status, matching the overview so a status never changes colour. */
const statusTone: Record<string, number> = {
  paid: 2,
  pending: 3,
  refunded: 1,
  failed: 0,
  not_required: 4,
};

export function PaymentsSection({
  adapter,
  seededQuery,
}: {
  adapter: ClubOperationsAdapter;
  /** Facets pre-applied by a drill-down from the overview. */
  seededQuery?: Record<string, string>;
}) {
  const [query, setQuery] = useState<PaymentQuery>(() => withSeed(emptyPaymentQuery, seededQuery));
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { search, dateFrom, dateTo, provider, status, metaClass } = query;
  const resource = useClubOperationsResource<PaymentPage>(
    () => adapter.listPayments({ search, dateFrom, dateTo, provider, status, metaClass }),
    [adapter, search, dateFrom, dateTo, provider, status, metaClass],
  );

  const reset = useCallback(() => {
    setQuery(emptyPaymentQuery);
    setSelectedId(null);
  }, []);

  const patch = (partial: Partial<PaymentQuery>) => setQuery((prev) => ({ ...prev, ...partial }));

  const columns: RecordColumn<Payment>[] = useMemo(
    () => [
      {
        key: 'reference',
        header: 'Referenz',
        width: '130px',
        render: (row) => <span className={text.bodyStrong}>{row.reference}</span>,
        sortValue: (row) => row.reference,
        mobile: 'hidden',
      },
      {
        key: 'date',
        header: 'Datum',
        width: '150px',
        render: (row) => (
          <span className="whitespace-nowrap tabular-nums">
            {formatDate(row.occurredAt)}
            <span className={cn('ml-1.5', text.hint)}>{formatTime(row.occurredAt)}</span>
          </span>
        ),
        sortValue: (row) => row.occurredAt,
        mobile: 'primary',
      },
      {
        key: 'customer',
        header: 'Kunde',
        render: (row) => <span className="break-words">{row.customerName}</span>,
        sortValue: (row) => row.customerName,
        mobile: 'hidden',
      },
      {
        key: 'provider',
        header: 'Zahlungsweg',
        width: '128px',
        render: (row) => paymentProviderLabels[row.provider],
        sortValue: (row) => paymentProviderLabels[row.provider],
        mobile: 'primary',
      },
      {
        key: 'type',
        header: 'Bezug',
        width: '170px',
        render: (row) => (
          <span className={text.hint}>
            {paymentReferenceTypeLabels[row.referenceType]} · {row.referenceLabel}
          </span>
        ),
        mobile: 'secondary',
      },
      {
        key: 'status',
        header: 'Status',
        width: '128px',
        render: (row) => (
          <StatusBadge label={paymentStatusLabels[row.status]} tone={paymentStatusTones[row.status]} />
        ),
        sortValue: (row) => paymentStatusLabels[row.status],
        mobile: 'hidden',
      },
      {
        key: 'gross',
        header: 'Brutto',
        align: 'right',
        width: '112px',
        render: (row) => formatCents(row.grossCents, row.currency),
        sortValue: (row) => row.grossCents,
        mobile: 'primary',
      },
      {
        key: 'refunded',
        header: 'Erstattet',
        align: 'right',
        width: '112px',
        render: (row) =>
          row.refundedCents > 0 ? (
            <span className="text-red-600">{formatCents(row.refundedCents, row.currency)}</span>
          ) : (
            <span className="text-[var(--cq-fg-subtle)]">—</span>
          ),
        sortValue: (row) => row.refundedCents,
        mobile: 'secondary',
      },
      {
        key: 'net',
        header: 'Verbleibt',
        align: 'right',
        width: '112px',
        render: (row) => (
          <span className={text.bodyStrong}>
            {formatCents(row.grossCents - row.refundedCents, row.currency)}
          </span>
        ),
        sortValue: (row) => row.grossCents - row.refundedCents,
        mobile: 'secondary',
      },
    ],
    [],
  );

  return (
    <SectionShell
      title="Zahlungen"
      description="Was eingegangen ist, was zurückgeflossen ist und was dem Verein davon geblieben ist."
      resource={resource}
      loadingLabel="Zahlungen werden geladen"
      errorTitle="Zahlungen konnten nicht geladen werden"
      notice="Erstattungen und Zahlungsvorgänge können hier nicht ausgelöst werden."
      toolbar={
        <FilterBar
          query={query}
          onReset={reset}
          resultCount={resource.data?.total ?? 0}
          countLabel={['Zahlung', 'Zahlungen']}
          facets={[
            { kind: 'text', key: 'payment-search', label: 'Suche', value: search ?? '', placeholder: 'Name, Referenz oder Bezug', onChange: (value) => patch({ search: value }), wide: true },
            { kind: 'select', key: 'payment-status', label: 'Status', value: status ?? 'all', options: paymentStatusOptions, onChange: (value) => patch({ status: value as PaymentQuery['status'] }) },
            { kind: 'select', key: 'payment-provider', label: 'Zahlungsweg', value: provider ?? 'all', options: paymentProviderOptions, onChange: (value) => patch({ provider: value as PaymentQuery['provider'] }) },
            { kind: 'select', key: 'payment-meta', label: 'Vorgang', value: metaClass ?? 'all', options: paymentMetaClassOptions, onChange: (value) => patch({ metaClass: value as PaymentQuery['metaClass'] }) },
            { kind: 'date', key: 'payment-from', label: 'Von', value: dateFrom ?? '', onChange: (value) => patch({ dateFrom: value }) },
            { kind: 'date', key: 'payment-to', label: 'Bis', value: dateTo ?? '', onChange: (value) => patch({ dateTo: value }) },
          ]}
        />
      }
    >
      {(page) => {
        const selected = page.payments.find((payment) => payment.id === selectedId) ?? null;

        if (page.payments.length === 0) {
          return hasNoActiveFacets(query) ? (
            <EmptyState icon={BadgeEuro} title="Noch keine Zahlungen" description="Sobald Zahlungen eingehen, erscheinen sie hier." />
          ) : (
            <EmptyState icon={SearchX} title="Keine Zahlungen für diese Filter" description="Passen Sie die Suche oder die Filter an, um wieder Ergebnisse zu sehen." />
          );
        }

        const providerSlices: CompositionSlice[] = page.byProvider.map((slice, index) => ({
          key: slice.provider,
          label: paymentProviderLabels[slice.provider],
          value: slice.amountCents,
          display: formatCents(slice.amountCents),
          tone: index,
        }));

        const statusSlices: CompositionSlice[] = page.byStatus.map((slice) => ({
          key: slice.status,
          label: paymentStatusLabels[slice.status],
          value: slice.count,
          display: formatCount(slice.count),
          tone: statusTone[slice.status] ?? 4,
        }));

        const { totals } = page;

        return (
          <div className={space.pageGap}>
            {/* Gross minus refunded equals net, read left to right as one sentence. */}
            <MetricRow label="Zahlungsfluss im aktuellen Filter" columns={3}>
              <PrimaryMetric
                label="Brutto eingegangen"
                value={formatCents(totals.grossCents)}
                footnote={`${formatCount(totals.succeededCount)} erfolgreiche Zahlungen`}
              />
              <PrimaryMetric
                label="Erstattet"
                value={formatCents(totals.refundedCents)}
                footnote={`${formatCount(totals.refundedCount)} Vorgänge mit Rückfluss`}
              />
              <PrimaryMetric
                label="Verbleibt"
                value={formatCents(totals.netCents)}
                footnote="Brutto abzüglich Erstattungen"
              />
            </MetricRow>

            <MetricStrip
              items={[
                { label: 'Ausstehend', value: formatCents(totals.pendingCents), hint: `${formatCount(totals.pendingCount)} offen` },
                { label: 'Doppelbuchungen', value: formatCount(totals.doubleBookingCount), hint: 'als Vorgang klassifiziert' },
                { label: 'Kundenstornierungen', value: formatCount(totals.customerCancelledCount), hint: 'als Vorgang klassifiziert' },
                { label: 'Zahlungswege', value: formatCount(page.byProvider.length), hint: 'im aktuellen Filter aktiv' },
              ]}
            />

            <div className="grid gap-4 lg:grid-cols-2">
              <Panel title="Zahlungswege" description="Anteil der Anbieter am Bruttoeingang.">
                <CompositionBar
                  slices={providerSlices}
                  emptyLabel="Keine Zahlungen im aktuellen Filter."
                  totalLabel={`Gesamt ${formatCents(totals.grossCents)}`}
                />
              </Panel>
              <Panel title="Zahlungsstatus" description="Wie viele Vorgänge tatsächlich abgeschlossen sind.">
                <CompositionBar
                  slices={statusSlices}
                  emptyLabel="Keine Zahlungen im aktuellen Filter."
                  totalLabel={`${formatCount(page.total)} Vorgänge`}
                />
              </Panel>
            </div>

            <DetailLayout
              list={
                <RecordTable
                  caption="Zahlungen"
                  columns={columns}
                  rows={page.payments}
                  getRowKey={(row) => row.id}
                  selectedKey={selectedId}
                  onSelect={(row) => setSelectedId(row.id)}
                  rowLabel={(row) => `Zahlung ${row.reference} von ${row.customerName}`}
                  mobileTitle={(row) => row.customerName}
                  mobileSubtitle={(row) => row.reference}
                  mobileBadge={(row) => (
                    <StatusBadge
                      label={paymentStatusLabels[row.status]}
                      tone={paymentStatusTones[row.status]}
                    />
                  )}
                  initialSort={{ key: 'date', direction: 'desc' }}
                  minWidth={1040}
                />
              }
              detail={
                selected ? (
                  <DetailPanel
                    eyebrow="Zahlung"
                    title={selected.reference}
                    onClose={() => setSelectedId(null)}
                    subtitle={
                      <>
                        <StatusBadge
                          label={paymentStatusLabels[selected.status]}
                          tone={paymentStatusTones[selected.status]}
                        />
                        <StatusBadge
                          label={paymentMetaClassLabels[selected.metaClass]}
                          tone={paymentMetaClassTones[selected.metaClass]}
                        />
                      </>
                    }
                    groups={[
                      {
                        label: 'Vorgang',
                        rows: [
                          { label: 'Kunde', value: <span className="break-words">{selected.customerName}</span> },
                          { label: 'Zeitpunkt', value: <span className={text.numeric}>{formatDateTime(selected.occurredAt)}</span> },
                          { label: 'Zahlungsweg', value: paymentProviderLabels[selected.provider] },
                          { label: 'Bezug', value: `${paymentReferenceTypeLabels[selected.referenceType]} ${selected.referenceLabel}` },
                        ],
                      },
                      {
                        label: 'Beträge',
                        rows: [
                          { label: 'Brutto', value: <span className={text.numeric}>{formatCents(selected.grossCents, selected.currency)}</span> },
                          { label: 'Erstattet', value: <span className={text.numeric}>{selected.refundedCents > 0 ? formatCents(selected.refundedCents, selected.currency) : '—'}</span> },
                          { label: 'Verbleibt', value: <span className={cn(text.numeric, text.bodyStrong)}>{formatCents(selected.grossCents - selected.refundedCents, selected.currency)}</span> },
                        ],
                      },
                    ]}
                  >
                    {selected.note ? <DetailNote label="Hinweis">{selected.note}</DetailNote> : null}
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
