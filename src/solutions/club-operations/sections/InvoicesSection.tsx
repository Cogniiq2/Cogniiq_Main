// Club Operations — Rechnungen.
//
// Read-only invoice ledger. The reference dashboard can create, send, void, refresh and sync
// invoices; none of those exist here, and the adapter has no method that could perform them.
//
// Composition: receivables are a question about time, not about counts — "how much is owed, and how
// long has it been owed". So the section leads with the outstanding amount and an ageing band
// breakdown, and the ledger's due-date column carries how many days late each row is. The previous
// version showed eight counts and left the reader to work the ageing out from a date column.

import { useCallback, useMemo, useState } from 'react';
import { Receipt, SearchX } from 'lucide-react';

import { EmptyState, StatusBadge } from '@/components/dashboard/primitives';
import { space, text } from '@/components/dashboard/tokens';
import { cn } from '@/lib/utils';

import type { ClubOperationsAdapter } from '../adapter/ClubOperationsAdapter';
import { CompositionBar, RankedBars, type CompositionSlice, type RankedDatum } from '../components/charts';
import { DetailLayout, DetailNote, DetailPanel } from '../components/DetailPanel';
import { FilterBar } from '../components/FilterBar';
import { MetricRow, MetricStrip, PrimaryMetric } from '../components/MetricCard';
import { RecordTable, type RecordColumn } from '../components/RecordTable';
import { Panel, SectionShell } from '../components/SectionShell';
import { FIXTURE_TODAY } from '../fixtures/vouchers';
import { hasNoActiveFacets, withSeed } from '../filtering';
import { formatCents, formatCount, formatDate, formatPercent, percentOf } from '../formatting';
import { invoiceStatusLabels, invoiceStatusTones } from '../labels';
import { invoiceStatusOptions } from '../options';
import { daysInBounds } from '../periods';
import type { Invoice, InvoicePage, InvoiceQuery } from '../types';
import { emptyInvoiceQuery } from '../types';
import { useClubOperationsResource } from '../useClubOperationsResource';

/** Open past its due date. Computed against the fixture's fixed "today", never the real clock. */
function isOverdue(invoice: Invoice): boolean {
  return invoice.status === 'open' && invoice.dueDate < FIXTURE_TODAY;
}

/** Days past due, or 0 for anything not yet late. */
function daysLate(invoice: Invoice): number {
  if (!isOverdue(invoice)) return 0;
  return daysInBounds({ start: invoice.dueDate, end: FIXTURE_TODAY }) - 1;
}

/**
 * Ageing bands.
 *
 * Chosen to match how a treasurer chases: this week's slippage, a month of it, and anything older
 * that has stopped being a reminder and become a problem.
 */
const ageingBands: { key: string; label: string; from: number; to: number }[] = [
  { key: 'due-soon', label: 'Noch nicht fällig', from: -Infinity, to: 0 },
  { key: '1-14', label: '1–14 Tage überfällig', from: 1, to: 14 },
  { key: '15-30', label: '15–30 Tage überfällig', from: 15, to: 30 },
  { key: '30-plus', label: 'Über 30 Tage überfällig', from: 31, to: Infinity },
];

export function InvoicesSection({
  adapter,
  seededQuery,
}: {
  adapter: ClubOperationsAdapter;
  seededQuery?: Record<string, string>;
}) {
  const [query, setQuery] = useState<InvoiceQuery>(() => withSeed(emptyInvoiceQuery, seededQuery));
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { search, dateFrom, dateTo, status } = query;
  const resource = useClubOperationsResource<InvoicePage>(
    () => adapter.listInvoices({ search, dateFrom, dateTo, status }),
    [adapter, search, dateFrom, dateTo, status],
  );

  const reset = useCallback(() => {
    setQuery(emptyInvoiceQuery);
    setSelectedId(null);
  }, []);

  const patch = (partial: Partial<InvoiceQuery>) => setQuery((prev) => ({ ...prev, ...partial }));

  const columns: RecordColumn<Invoice>[] = useMemo(
    () => [
      {
        key: 'number',
        header: 'Nummer',
        width: '150px',
        render: (row) => <span className={text.bodyStrong}>{row.number}</span>,
        sortValue: (row) => row.number,
        mobile: 'hidden',
      },
      {
        key: 'customer',
        header: 'Kunde',
        render: (row) => <span className="break-words">{row.customerName}</span>,
        sortValue: (row) => row.customerName,
        mobile: 'hidden',
      },
      {
        key: 'booking',
        header: 'Buchung',
        width: '110px',
        render: (row) => row.bookingReference ?? <span className="text-[var(--cq-fg-subtle)]">—</span>,
        mobile: 'secondary',
      },
      {
        key: 'issued',
        header: 'Rechnungsdatum',
        width: '134px',
        render: (row) => <span className="whitespace-nowrap tabular-nums">{formatDate(row.issuedAt)}</span>,
        sortValue: (row) => row.issuedAt,
        mobile: 'secondary',
      },
      {
        key: 'due',
        header: 'Fällig',
        width: '150px',
        render: (row) => {
          const late = daysLate(row);
          return (
            <span className="whitespace-nowrap tabular-nums">
              <span className={late > 0 ? 'font-medium text-red-600' : undefined}>
                {formatDate(row.dueDate)}
              </span>
              {late > 0 ? (
                <span className={cn('ml-1.5 text-red-600')}>+{late} T</span>
              ) : null}
            </span>
          );
        },
        sortValue: (row) => row.dueDate,
        mobile: 'primary',
      },
      {
        key: 'status',
        header: 'Status',
        width: '150px',
        render: (row) => (
          <StatusBadge
            label={isOverdue(row) ? 'Überfällig' : invoiceStatusLabels[row.status]}
            tone={isOverdue(row) ? 'danger' : invoiceStatusTones[row.status]}
          />
        ),
        sortValue: (row) => (isOverdue(row) ? 'Überfällig' : invoiceStatusLabels[row.status]),
        mobile: 'hidden',
      },
      {
        key: 'net',
        header: 'Netto',
        align: 'right',
        width: '104px',
        render: (row) => formatCents(row.netCents, row.currency),
        sortValue: (row) => row.netCents,
        mobile: 'secondary',
      },
      {
        key: 'vat',
        header: 'MwSt.',
        align: 'right',
        width: '96px',
        render: (row) => formatCents(row.vatCents, row.currency),
        sortValue: (row) => row.vatCents,
        mobile: 'secondary',
      },
      {
        key: 'gross',
        header: 'Brutto',
        align: 'right',
        width: '112px',
        render: (row) => <span className={text.bodyStrong}>{formatCents(row.grossCents, row.currency)}</span>,
        sortValue: (row) => row.grossCents,
        mobile: 'primary',
      },
    ],
    [],
  );

  return (
    <SectionShell
      title="Rechnungen"
      description="Wie viel offen ist, wie lange es offen ist und was bereits eingezogen wurde."
      resource={resource}
      loadingLabel="Rechnungen werden geladen"
      errorTitle="Rechnungen konnten nicht geladen werden"
      notice="Rechnungen können hier nicht erstellt, versendet oder storniert werden."
      toolbar={
        <FilterBar
          query={query}
          onReset={reset}
          resultCount={resource.data?.total ?? 0}
          countLabel={['Rechnung', 'Rechnungen']}
          facets={[
            { kind: 'text', key: 'invoice-search', label: 'Suche', value: search ?? '', placeholder: 'Nummer, Kunde oder Buchung', onChange: (value) => patch({ search: value }), wide: true },
            { kind: 'select', key: 'invoice-status', label: 'Status', value: status ?? 'all', options: invoiceStatusOptions, onChange: (value) => patch({ status: value as InvoiceQuery['status'] }) },
            { kind: 'date', key: 'invoice-from', label: 'Von', value: dateFrom ?? '', onChange: (value) => patch({ dateFrom: value }) },
            { kind: 'date', key: 'invoice-to', label: 'Bis', value: dateTo ?? '', onChange: (value) => patch({ dateTo: value }) },
          ]}
        />
      }
    >
      {(page) => {
        const selected = page.invoices.find((invoice) => invoice.id === selectedId) ?? null;

        if (page.invoices.length === 0) {
          return hasNoActiveFacets(query) ? (
            <EmptyState icon={Receipt} title="Noch keine Rechnungen" description="Sobald Rechnungen gestellt werden, erscheinen sie hier." />
          ) : (
            <EmptyState icon={SearchX} title="Keine Rechnungen für diese Filter" description="Passen Sie die Suche oder die Filter an, um wieder Ergebnisse zu sehen." />
          );
        }

        const open = page.invoices.filter((invoice) => invoice.status === 'open');
        const ageing: RankedDatum[] = ageingBands
          .map((band) => {
            const slice = open.filter((invoice) => {
              const late = daysLate(invoice);
              return late >= band.from && late <= band.to;
            });
            const amount = slice.reduce((total, invoice) => total + invoice.grossCents, 0);
            return {
              band,
              size: slice.length,
              row: {
                key: band.key,
                label: band.label,
                percent: percentOf(amount, page.counts.outstandingCents),
                value: formatCents(amount),
                hint: `${formatCount(slice.length)} Rechnungen`,
                // The oldest band is the one that has stopped being a reminder.
                leading: band.key === '30-plus' && slice.length > 0,
              } satisfies RankedDatum,
            };
          })
          // Empty bands are dropped: an ageing chart is easier to read as three occupied bands than
          // as four with a zero in the middle.
          .filter((entry) => entry.size > 0)
          .map((entry) => entry.row);

        const statusSlices: CompositionSlice[] = [
          { key: 'open', label: 'Offen', value: page.counts.open, tone: 3 },
          { key: 'paid', label: 'Bezahlt', value: page.counts.paid, tone: 2 },
          { key: 'draft', label: 'Entwurf', value: page.counts.draft, tone: 4 },
          { key: 'void', label: 'Storniert', value: page.counts.voided, tone: 1 },
          { key: 'uncollectible', label: 'Uneinbringlich', value: page.counts.uncollectible, tone: 0 },
        ]
          .filter((slice) => slice.value > 0)
          .map((slice) => ({ ...slice, display: formatCount(slice.value) }));

        const collectionRate = percentOf(
          page.counts.collectedCents,
          page.counts.collectedCents + page.counts.outstandingCents,
        );

        return (
          <div className={space.pageGap}>
            <MetricRow label="Forderungen im aktuellen Filter" columns={3}>
              <PrimaryMetric
                label="Ausstehender Betrag"
                value={formatCents(page.counts.outstandingCents)}
                footnote={`${formatCount(page.counts.open)} offene Rechnungen`}
              />
              <PrimaryMetric
                label="Davon überfällig"
                value={formatCount(page.counts.overdue)}
                footnote={
                  page.counts.overdue > 0
                    ? `${formatCents(open.filter(isOverdue).reduce((total, invoice) => total + invoice.grossCents, 0))} über Fälligkeit`
                    : 'Keine Rechnung über Fälligkeit'
                }
              />
              <PrimaryMetric
                label="Eingezogen"
                value={formatCents(page.counts.collectedCents)}
                footnote={`Einzugsquote ${formatPercent(collectionRate, 1)}`}
              />
            </MetricRow>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
              <Panel
                title="Altersstruktur der offenen Forderungen"
                description="Wie lange offene Beträge bereits über ihrer Fälligkeit liegen."
              >
                <RankedBars rows={ageing} emptyLabel="Keine offenen Forderungen im aktuellen Filter." />
              </Panel>
              <Panel title="Rechnungsstatus" description="Zusammensetzung des Bestands.">
                <CompositionBar
                  slices={statusSlices}
                  emptyLabel="Keine Rechnungen im aktuellen Filter."
                  totalLabel={`${formatCount(page.total)} Rechnungen`}
                />
              </Panel>
            </div>

            <MetricStrip
              items={[
                { label: 'Entwürfe', value: formatCount(page.counts.draft), hint: 'noch nicht versendet' },
                { label: 'Bezahlt', value: formatCount(page.counts.paid), hint: 'vollständig eingezogen' },
                { label: 'Storniert', value: formatCount(page.counts.voided), hint: 'nachträglich aufgehoben' },
                { label: 'Uneinbringlich', value: formatCount(page.counts.uncollectible), hint: 'abgeschrieben' },
              ]}
            />

            <DetailLayout
              list={
                <RecordTable
                  caption="Rechnungen"
                  columns={columns}
                  rows={page.invoices}
                  getRowKey={(row) => row.id}
                  selectedKey={selectedId}
                  onSelect={(row) => setSelectedId(row.id)}
                  rowLabel={(row) => `Rechnung ${row.number} an ${row.customerName}`}
                  mobileTitle={(row) => row.number}
                  mobileSubtitle={(row) => row.customerName}
                  mobileBadge={(row) => (
                    <StatusBadge
                      label={isOverdue(row) ? 'Überfällig' : invoiceStatusLabels[row.status]}
                      tone={isOverdue(row) ? 'danger' : invoiceStatusTones[row.status]}
                    />
                  )}
                  initialSort={{ key: 'due', direction: 'asc' }}
                  minWidth={1080}
                />
              }
              detail={
                selected ? (
                  <DetailPanel
                    eyebrow="Rechnung"
                    title={selected.number}
                    onClose={() => setSelectedId(null)}
                    subtitle={
                      <StatusBadge
                        label={isOverdue(selected) ? `Überfällig seit ${daysLate(selected)} Tagen` : invoiceStatusLabels[selected.status]}
                        tone={isOverdue(selected) ? 'danger' : invoiceStatusTones[selected.status]}
                      />
                    }
                    groups={[
                      {
                        label: 'Zuordnung',
                        rows: [
                          { label: 'Kunde', value: <span className="break-words">{selected.customerName}</span> },
                          { label: 'Buchung', value: selected.bookingReference ?? '—' },
                        ],
                      },
                      {
                        label: 'Beträge',
                        rows: [
                          { label: 'Netto', value: <span className={text.numeric}>{formatCents(selected.netCents, selected.currency)}</span> },
                          {
                            label: 'MwSt.',
                            value: (
                              <span className={text.numeric}>
                                {formatCents(selected.vatCents, selected.currency)}
                                {selected.taxRatePercent != null ? ` (${selected.taxRatePercent} %)` : ''}
                              </span>
                            ),
                          },
                          { label: 'Brutto', value: <span className={cn(text.numeric, text.bodyStrong)}>{formatCents(selected.grossCents, selected.currency)}</span> },
                        ],
                      },
                      {
                        label: 'Verlauf',
                        rows: [
                          { label: 'Rechnungsdatum', value: <span className={text.numeric}>{formatDate(selected.issuedAt)}</span> },
                          { label: 'Fällig am', value: <span className={text.numeric}>{formatDate(selected.dueDate)}</span> },
                          { label: 'Versendet', value: <span className={text.numeric}>{selected.sentAt ? formatDate(selected.sentAt) : '—'}</span> },
                          { label: 'Bezahlt', value: <span className={text.numeric}>{selected.paidAt ? formatDate(selected.paidAt) : '—'}</span> },
                          { label: 'Storniert', value: <span className={text.numeric}>{selected.voidedAt ? formatDate(selected.voidedAt) : '—'}</span> },
                        ],
                      },
                    ]}
                  >
                    <DetailNote label="Grund">{selected.reason}</DetailNote>
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
