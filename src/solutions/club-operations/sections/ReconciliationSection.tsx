// Club Operations — Zahlungsabgleich.
//
// Read-only reconciliation. Nothing here contacts a payment provider: the rows are classified by
// the pure rules in `reconciliation.ts`, and the reference dashboard's invoice actions are absent.
//
// Composition: this is the only section whose job is investigation rather than reporting, so it is
// built as a triage queue. Findings are grouped by severity into a filter strip; picking one narrows
// the table, so the reader works a queue down instead of scanning a mixed list. The detail panel
// leads with the three amounts side by side, because "gebucht 48,00 / gezahlt 45,00" is the finding
// — everything else is context for it.

import { useCallback, useMemo, useState } from 'react';
import { ScanLine, SearchX } from 'lucide-react';

import { EmptyState, StatusBadge } from '@/components/dashboard/primitives';
import { border, focusRingOnSurface, radius, space, surface, text } from '@/components/dashboard/tokens';
import { cn } from '@/lib/utils';

import type { ClubOperationsAdapter } from '../adapter/ClubOperationsAdapter';
import { GaugeRow } from '../components/charts';
import { DetailLayout, DetailNote, DetailPanel } from '../components/DetailPanel';
import { FilterBar } from '../components/FilterBar';
import { MetricRow, MetricStrip, PrimaryMetric } from '../components/MetricCard';
import { RecordTable, type RecordColumn } from '../components/RecordTable';
import { Panel, SectionShell } from '../components/SectionShell';
import { hasNoActiveFacets, withSeed } from '../filtering';
import { formatCents, formatCount, formatDate, formatDateTime, formatText, formatTime } from '../formatting';
import {
  bookingStatusLabels,
  courtLabel,
  invoiceStatusLabels,
  paymentProviderLabels,
  reconciliationIssueLabels,
  reconciliationSeverityLabels,
  reconciliationSeverityTones,
} from '../labels';
import { feedback } from '../motion';
import { reconciliationIssueOptions, reconciliationSeverityOptions } from '../options';
import type {
  ReconciliationEntry,
  ReconciliationPage,
  ReconciliationQuery,
  ReconciliationSeverity,
} from '../types';
import { emptyReconciliationQuery, reconciliationSeverities } from '../types';
import { useClubOperationsResource } from '../useClubOperationsResource';

/** Severity colours, matching the attention model so a critical row is critical everywhere. */
const severityColour: Record<ReconciliationSeverity, string> = {
  critical: 'rgb(220 38 38)',
  warning: 'rgb(245 158 11)',
  info: 'rgb(14 165 233)',
  ok: 'rgb(16 185 129)',
};

export function ReconciliationSection({
  adapter,
  seededQuery,
}: {
  adapter: ClubOperationsAdapter;
  seededQuery?: Record<string, string>;
}) {
  const [query, setQuery] = useState<ReconciliationQuery>(() =>
    withSeed(emptyReconciliationQuery, seededQuery),
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { search, issue, severity } = query;
  const resource = useClubOperationsResource<ReconciliationPage>(
    () => adapter.listReconciliation({ search, issue, severity }),
    [adapter, search, issue, severity],
  );

  const reset = useCallback(() => {
    setQuery(emptyReconciliationQuery);
    setSelectedId(null);
  }, []);

  const patch = (partial: Partial<ReconciliationQuery>) =>
    setQuery((prev) => ({ ...prev, ...partial }));

  const columns: RecordColumn<ReconciliationEntry>[] = useMemo(
    () => [
      {
        key: 'issue',
        header: 'Befund',
        width: '240px',
        render: (row) => (
          <span className="inline-flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ background: severityColour[row.severity] }}
            />
            <span className={text.bodyStrong}>{reconciliationIssueLabels[row.issue]}</span>
          </span>
        ),
        sortValue: (row) => reconciliationIssueLabels[row.issue],
        mobile: 'hidden',
      },
      {
        key: 'severity',
        header: 'Schweregrad',
        width: '124px',
        render: (row) => (
          <StatusBadge
            label={reconciliationSeverityLabels[row.severity]}
            tone={reconciliationSeverityTones[row.severity]}
          />
        ),
        sortValue: (row) => reconciliationSeverities.indexOf(row.severity),
        mobile: 'hidden',
      },
      {
        key: 'customer',
        header: 'Kunde',
        render: (row) => <span className="break-words">{formatText(row.customerName)}</span>,
        sortValue: (row) => row.customerName,
        mobile: 'hidden',
      },
      {
        key: 'occurred',
        header: 'Zeitpunkt',
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
        key: 'booking',
        header: 'Buchung',
        width: '112px',
        render: (row) => row.bookingReference ?? <span className="text-[var(--cq-fg-subtle)]">—</span>,
        mobile: 'secondary',
      },
      {
        key: 'payment',
        header: 'Zahlung',
        width: '128px',
        render: (row) => row.paymentReference ?? <span className="text-[var(--cq-fg-subtle)]">—</span>,
        mobile: 'secondary',
      },
      {
        key: 'bookingAmount',
        header: 'Gebucht',
        align: 'right',
        width: '104px',
        render: (row) =>
          row.bookingAmountCents > 0 ? (
            formatCents(row.bookingAmountCents)
          ) : (
            <span className="text-[var(--cq-fg-subtle)]">—</span>
          ),
        sortValue: (row) => row.bookingAmountCents,
        mobile: 'primary',
      },
      {
        key: 'paymentAmount',
        header: 'Gezahlt',
        align: 'right',
        width: '104px',
        render: (row) => formatCents(row.paymentAmountCents),
        sortValue: (row) => row.paymentAmountCents,
        mobile: 'primary',
      },
      {
        key: 'recover',
        header: 'Nachzufordern',
        align: 'right',
        width: '124px',
        render: (row) =>
          row.moneyToRecoverCents > 0 ? (
            <span className="font-semibold text-red-600">{formatCents(row.moneyToRecoverCents)}</span>
          ) : (
            <span className="text-[var(--cq-fg-subtle)]">—</span>
          ),
        sortValue: (row) => row.moneyToRecoverCents,
        mobile: 'secondary',
      },
    ],
    [],
  );

  return (
    <SectionShell
      title="Zahlungsabgleich"
      description="Jede Zahlung gegen ihre Buchung geprüft — wo Beträge, Status oder Zuordnung nicht zusammenpassen."
      resource={resource}
      loadingLabel="Abgleich wird geladen"
      errorTitle="Abgleich konnte nicht geladen werden"
      notice="Die vorgeschlagenen Maßnahmen sind Hinweise. Es werden keine Rechnungen erstellt und keine Zahlungsdaten abgerufen."
      toolbar={
        <FilterBar
          query={query}
          onReset={reset}
          resultCount={resource.data?.total ?? 0}
          countLabel={['Vorgang', 'Vorgänge']}
          facets={[
            { kind: 'text', key: 'rec-search', label: 'Suche', value: search ?? '', placeholder: 'Kunde, Buchung oder Zahlung', onChange: (value) => patch({ search: value }), wide: true },
            { kind: 'select', key: 'rec-issue', label: 'Befund', value: issue ?? 'all', options: reconciliationIssueOptions, onChange: (value) => patch({ issue: value as ReconciliationQuery['issue'] }) },
            { kind: 'select', key: 'rec-severity', label: 'Schweregrad', value: severity ?? 'all', options: reconciliationSeverityOptions, onChange: (value) => patch({ severity: value as ReconciliationQuery['severity'] }) },
          ]}
        />
      }
    >
      {(page) => {
        const selected = page.entries.find((entry) => entry.id === selectedId) ?? null;

        if (page.entries.length === 0) {
          return hasNoActiveFacets(query) ? (
            <EmptyState icon={ScanLine} title="Nichts abzugleichen" description="Sobald Zahlungen vorliegen, erscheint hier der Abgleich gegen die Buchungen." />
          ) : (
            <EmptyState icon={SearchX} title="Keine Vorgänge für diese Filter" description="Passen Sie die Suche oder die Filter an, um wieder Ergebnisse zu sehen." />
          );
        }

        const bySeverity = reconciliationSeverities.map((level) => ({
          severity: level,
          entries: page.entries.filter((entry) => entry.severity === level),
        }));

        return (
          <div className={space.pageGap}>
            <MetricRow label="Ergebnis des Abgleichs" columns={3}>
              <PrimaryMetric
                label="Potenziell nachzufordern"
                value={formatCents(page.counts.moneyToRecoverCents)}
                footnote={`aus ${formatCount(page.entries.filter((entry) => entry.moneyToRecoverCents > 0).length)} Vorgängen`}
              />
              <PrimaryMetric
                label="Offene Prüfungen"
                value={formatCount(page.counts.openReview)}
                footnote={`von ${formatCount(page.counts.totalPayments)} geprüften Zahlungen`}
              />
              <PrimaryMetric
                label="Abgeglichen"
                value={formatCount(page.counts.matched)}
                footnote="ohne Beanstandung"
              />
            </MetricRow>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
              {/* Triage strip. Each severity is a real filter control, so the queue can be worked
                  down from the top rather than scanned as one mixed list. */}
              <Panel
                title="Nach Schweregrad"
                description="Auswahl filtert die Liste unten auf diesen Schweregrad."
              >
                <div className="space-y-3">
                  {bySeverity.map(({ severity: level, entries }) => {
                    const isActive = severity === level;
                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() => patch({ severity: isActive ? 'all' : level })}
                        aria-pressed={isActive}
                        aria-label={`Auf Schweregrad ${reconciliationSeverityLabels[level]} filtern`}
                        className={cn(
                          'block w-full p-2.5 text-left',
                          radius.md,
                          feedback,
                          focusRingOnSurface,
                          isActive
                            ? cn(border.strong, 'bg-[var(--cq-hover)]')
                            : cn(border.hairline, 'hover:bg-[var(--cq-hover)]'),
                        )}
                      >
                        <GaugeRow
                          label={reconciliationSeverityLabels[level]}
                          count={entries.length}
                          total={page.total}
                          tone={severityColour[level]}
                        >
                          <p className={cn('mt-1.5', text.hint)}>
                            {entries.reduce((total, entry) => total + entry.moneyToRecoverCents, 0) > 0
                              ? `${formatCents(entries.reduce((total, entry) => total + entry.moneyToRecoverCents, 0))} nachzufordern`
                              : 'Kein Betrag betroffen'}
                          </p>
                        </GaugeRow>
                      </button>
                    );
                  })}
                </div>
              </Panel>

              <Panel title="Wohin das Geld zurückfloss" description="Erstattungen nach Ursache.">
                <MetricStrip
                  items={[
                    { label: 'Erstattet gesamt', value: formatCents(page.counts.refundedTotalCents), hint: 'alle Ursachen' },
                    { label: 'Stornierungen', value: formatCents(page.counts.cancellationRefundsCents), hint: 'durch Kunden' },
                    { label: 'Doppelbuchungen', value: formatCents(page.counts.doubleBookingRefundsCents), hint: 'Korrektur' },
                    { label: 'Fehlerhafte Erstattungen', value: formatCount(page.counts.falseRefunds), hint: 'vermutlich zu Unrecht' },
                  ]}
                />
                <p className={cn('mt-3', text.hint)}>
                  Erstattungen ohne erkennbare Ursache erscheinen als eigener Befund in der Liste und
                  zählen in die Summe „potenziell nachzufordern“.
                </p>
              </Panel>
            </div>

            <DetailLayout
              list={
                <RecordTable
                  caption="Abgleich von Zahlungen gegen Buchungen"
                  columns={columns}
                  rows={page.entries}
                  getRowKey={(row) => row.id}
                  selectedKey={selectedId}
                  onSelect={(row) => setSelectedId(row.id)}
                  rowLabel={(row) =>
                    `Befund ${reconciliationIssueLabels[row.issue]} bei ${formatText(row.customerName)}`
                  }
                  mobileTitle={(row) => reconciliationIssueLabels[row.issue]}
                  mobileSubtitle={(row) => formatText(row.customerName)}
                  mobileBadge={(row) => (
                    <StatusBadge
                      label={reconciliationSeverityLabels[row.severity]}
                      tone={reconciliationSeverityTones[row.severity]}
                    />
                  )}
                  initialSort={{ key: 'severity', direction: 'asc' }}
                  minWidth={1180}
                />
              }
              detail={
                selected ? (
                  <DetailPanel
                    eyebrow="Abgleich"
                    title={reconciliationIssueLabels[selected.issue]}
                    onClose={() => setSelectedId(null)}
                    subtitle={
                      <StatusBadge
                        label={reconciliationSeverityLabels[selected.severity]}
                        tone={reconciliationSeverityTones[selected.severity]}
                      />
                    }
                    groups={[
                      {
                        label: 'Beteiligte Sätze',
                        rows: [
                          { label: 'Kunde', value: <span className="break-words">{formatText(selected.customerName)}</span> },
                          { label: 'Zeitpunkt', value: <span className={text.numeric}>{formatDateTime(selected.occurredAt)}</span> },
                          { label: 'Buchung', value: selected.bookingReference ?? '—' },
                          { label: 'Zahlung', value: selected.paymentReference ?? '—' },
                          { label: 'Platz', value: selected.court ? courtLabel(selected.court) : '—' },
                          { label: 'Zahlungsweg', value: paymentProviderLabels[selected.provider] },
                        ],
                      },
                      {
                        label: 'Status',
                        rows: [
                          { label: 'Buchungsstatus', value: selected.bookingStatus ? bookingStatusLabels[selected.bookingStatus] : '—' },
                          { label: 'Rechnung', value: selected.invoiceStatus ? invoiceStatusLabels[selected.invoiceStatus] : '—' },
                        ],
                      },
                    ]}
                  >
                    {/* The finding itself: the three amounts, adjacent, so the gap is visible
                        rather than something the reader has to subtract mentally. */}
                    <div className={cn('mt-4 grid grid-cols-3 divide-x', border.subtle, border.hairline, radius.lg, surface.card)}>
                      {([
                        { label: 'Gebucht', value: selected.bookingAmountCents },
                        { label: 'Gezahlt', value: selected.paymentAmountCents },
                        { label: 'Erstattet', value: selected.refundAmountCents },
                      ] as Array<{ label: string; value: number | null }>).map((cell) => (
                        <div key={cell.label} className="min-w-0 px-3 py-2.5">
                          <p className={cn('truncate', text.eyebrow)}>{cell.label}</p>
                          <p className="mt-1 text-[14px] font-semibold leading-5 tabular-nums text-[var(--cq-fg)]">
                            {/* An unknown refund amount and a zero one both read as an em dash here;
                                what must not happen is an unknown one reading as €0,00. */}
                            {cell.value !== null && cell.value > 0 ? formatCents(cell.value) : '—'}
                          </p>
                        </div>
                      ))}
                    </div>

                    {selected.moneyToRecoverCents > 0 ? (
                      <p
                        className={cn(
                          'mt-3 flex items-baseline justify-between gap-3 border px-3.5 py-2.5',
                          radius.lg,
                          'border-red-200 bg-red-50',
                        )}
                      >
                        <span className="text-[12px] font-medium uppercase leading-4 tracking-[0.04em] text-red-700">
                          Nachzufordern
                        </span>
                        <span className="text-[15px] font-semibold leading-5 tabular-nums text-red-700">
                          {formatCents(selected.moneyToRecoverCents)}
                        </span>
                      </p>
                    ) : null}

                    <DetailNote label="Vorgeschlagene Maßnahme">{selected.suggestedAction}</DetailNote>
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
