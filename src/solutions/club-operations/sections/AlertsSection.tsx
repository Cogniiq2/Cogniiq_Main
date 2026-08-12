// Club Operations — Alert Center.
//
// Read-only. Alerts cannot be acknowledged, resolved, dismissed or otherwise changed here; in the
// reference dashboard those actions write directly to the alerts table from the browser.
//
// Composition: triage, not reporting. The severity strip is a set of real filter controls, so the
// reader works the queue from the top down; the table is ordered unresolved-first, then by severity,
// then newest, matching the reference system. The previous version put four counts above a table and
// left the reader to sort by eye.

import { useCallback, useMemo, useState } from 'react';
import { Bell, SearchX } from 'lucide-react';

import { EmptyState, StatusBadge } from '@/components/dashboard/primitives';
import { border, focusRingOnSurface, radius, space, text } from '@/components/dashboard/tokens';
import { cn } from '@/lib/utils';

import type { ClubOperationsAdapter } from '../adapter/ClubOperationsAdapter';
import { CompositionBar, GaugeRow, type CompositionSlice } from '../components/charts';
import { DetailLayout, DetailNote, DetailPanel } from '../components/DetailPanel';
import { FilterBar } from '../components/FilterBar';
import { MetricRow, PrimaryMetric } from '../components/MetricCard';
import { RecordTable, type RecordColumn } from '../components/RecordTable';
import { Panel, SectionShell } from '../components/SectionShell';
import { hasNoActiveFacets, isAlertOpen, withSeed } from '../filtering';
import { formatCents, formatCount, formatDate, formatDateTime, formatTime } from '../formatting';
import {
  alertCategoryLabels,
  alertSeverityLabels,
  alertSeverityTones,
  alertStatusLabels,
  alertStatusTones,
  courtLabel,
} from '../labels';
import { feedback } from '../motion';
import { alertCategoryOptions, alertSeverityOptions, alertStatusOptions } from '../options';
import type { AlertPage, AlertQuery, AlertSeverity, OperationalAlert } from '../types';
import { alertCategories, alertSeverities, emptyAlertQuery } from '../types';
import { useClubOperationsResource } from '../useClubOperationsResource';

/** Matches the attention model's rail colours, so severity reads identically module-wide. */
const severityColour: Record<AlertSeverity, string> = {
  critical: 'rgb(220 38 38)',
  high: 'rgb(245 158 11)',
  medium: 'rgb(14 165 233)',
  low: 'rgb(148 163 184)',
};

function openCountFor(page: AlertPage, severity: AlertSeverity): number {
  return page.openBySeverity.find((entry) => entry.severity === severity)?.count ?? 0;
}

export function AlertsSection({
  adapter,
  seededQuery,
}: {
  adapter: ClubOperationsAdapter;
  seededQuery?: Record<string, string>;
}) {
  const [query, setQuery] = useState<AlertQuery>(() => withSeed(emptyAlertQuery, seededQuery));
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { search, dateFrom, dateTo, severity, status, category } = query;
  const resource = useClubOperationsResource<AlertPage>(
    () => adapter.listAlerts({ search, dateFrom, dateTo, severity, status, category }),
    [adapter, search, dateFrom, dateTo, severity, status, category],
  );

  const reset = useCallback(() => {
    setQuery(emptyAlertQuery);
    setSelectedId(null);
  }, []);

  const patch = (partial: Partial<AlertQuery>) => setQuery((prev) => ({ ...prev, ...partial }));

  const columns: RecordColumn<OperationalAlert>[] = useMemo(
    () => [
      {
        key: 'title',
        header: 'Meldung',
        render: (row) => (
          <span className="inline-flex items-start gap-2">
            <span
              aria-hidden="true"
              className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ background: severityColour[row.severity] }}
            />
            <span className={cn('break-words', isAlertOpen(row) ? text.bodyStrong : text.body)}>
              {row.title}
            </span>
          </span>
        ),
        sortValue: (row) => row.title,
        mobile: 'hidden',
      },
      {
        key: 'severity',
        header: 'Schweregrad',
        width: '120px',
        render: (row) => (
          <StatusBadge label={alertSeverityLabels[row.severity]} tone={alertSeverityTones[row.severity]} />
        ),
        sortValue: (row) => alertSeverities.indexOf(row.severity),
        mobile: 'hidden',
      },
      {
        key: 'status',
        header: 'Status',
        width: '132px',
        render: (row) => (
          <StatusBadge label={alertStatusLabels[row.status]} tone={alertStatusTones[row.status]} />
        ),
        sortValue: (row) => alertStatusLabels[row.status],
        mobile: 'primary',
      },
      {
        key: 'category',
        header: 'Kategorie',
        width: '118px',
        render: (row) => alertCategoryLabels[row.category],
        sortValue: (row) => alertCategoryLabels[row.category],
        mobile: 'primary',
      },
      {
        key: 'created',
        header: 'Erstellt',
        width: '150px',
        render: (row) => (
          <span className="whitespace-nowrap tabular-nums">
            {formatDate(row.createdAt)}
            <span className={cn('ml-1.5', text.hint)}>{formatTime(row.createdAt)}</span>
          </span>
        ),
        sortValue: (row) => row.createdAt,
        mobile: 'primary',
      },
      {
        key: 'reference',
        header: 'Bezug',
        width: '128px',
        render: (row) => row.relatedReference ?? <span className="text-[var(--cq-fg-subtle)]">—</span>,
        mobile: 'secondary',
      },
      {
        key: 'amount',
        header: 'Betrag',
        align: 'right',
        width: '112px',
        render: (row) =>
          row.amountCents == null ? (
            <span className="text-[var(--cq-fg-subtle)]">—</span>
          ) : (
            formatCents(row.amountCents)
          ),
        sortValue: (row) => row.amountCents ?? -1,
        mobile: 'secondary',
      },
    ],
    [],
  );

  return (
    <SectionShell
      title="Alert Center"
      description="Gemeldete Auffälligkeiten nach Dringlichkeit — unerledigte zuerst, danach nach Schweregrad und Alter."
      resource={resource}
      loadingLabel="Meldungen werden geladen"
      errorTitle="Meldungen konnten nicht geladen werden"
      notice="Meldungen können hier nicht bearbeitet, gelöst oder ausgeblendet werden."
      toolbar={
        <FilterBar
          query={query}
          onReset={reset}
          resultCount={resource.data?.total ?? 0}
          countLabel={['Meldung', 'Meldungen']}
          facets={[
            { kind: 'text', key: 'alert-search', label: 'Suche', value: search ?? '', placeholder: 'Titel, Nachricht oder Bezug', onChange: (value) => patch({ search: value }), wide: true },
            { kind: 'select', key: 'alert-status', label: 'Status', value: status ?? 'all', options: alertStatusOptions, onChange: (value) => patch({ status: value as AlertQuery['status'] }) },
            { kind: 'select', key: 'alert-severity', label: 'Schweregrad', value: severity ?? 'all', options: alertSeverityOptions, onChange: (value) => patch({ severity: value as AlertQuery['severity'] }) },
            { kind: 'select', key: 'alert-category', label: 'Kategorie', value: category ?? 'all', options: alertCategoryOptions, onChange: (value) => patch({ category: value as AlertQuery['category'] }) },
            { kind: 'date', key: 'alert-from', label: 'Von', value: dateFrom ?? '', onChange: (value) => patch({ dateFrom: value }) },
            { kind: 'date', key: 'alert-to', label: 'Bis', value: dateTo ?? '', onChange: (value) => patch({ dateTo: value }) },
          ]}
        />
      }
    >
      {(page) => {
        const selected = page.alerts.find((alert) => alert.id === selectedId) ?? null;

        if (page.alerts.length === 0) {
          return hasNoActiveFacets(query) ? (
            <EmptyState icon={Bell} title="Keine Meldungen" description="Der Betrieb läuft ohne Auffälligkeiten. Neue Meldungen erscheinen hier." />
          ) : (
            <EmptyState icon={SearchX} title="Keine Meldungen für diese Filter" description="Passen Sie die Suche oder die Filter an, um wieder Ergebnisse zu sehen." />
          );
        }

        const openAmount = page.alerts
          .filter(isAlertOpen)
          .reduce((total, alert) => total + (alert.amountCents ?? 0), 0);

        const categorySlices: CompositionSlice[] = alertCategories
          .map((value, index) => ({
            key: value,
            label: alertCategoryLabels[value],
            value: page.alerts.filter((alert) => alert.category === value).length,
            tone: index,
          }))
          .filter((slice) => slice.value > 0)
          .map((slice) => ({ ...slice, display: formatCount(slice.value) }));

        return (
          <div className={space.pageGap}>
            <MetricRow label="Meldungslage im aktuellen Filter" columns={3}>
              <PrimaryMetric
                label="Offen gesamt"
                value={formatCount(page.openCount)}
                footnote={`von ${formatCount(page.total)} Meldungen im Filter`}
              />
              <PrimaryMetric
                label="Kritisch offen"
                value={formatCount(openCountFor(page, 'critical'))}
                footnote={
                  openCountFor(page, 'critical') > 0
                    ? 'Sofortige Prüfung erforderlich'
                    : 'Keine kritischen Meldungen offen'
                }
              />
              <PrimaryMetric
                label="Betroffener Betrag"
                value={formatCents(openAmount)}
                footnote="Summe der offenen Meldungen mit Betrag"
              />
            </MetricRow>

            <div className="grid gap-4 lg:grid-cols-2">
              <Panel
                title="Triage nach Schweregrad"
                description="Auswahl filtert die Liste auf offene Meldungen dieses Schweregrads."
              >
                <div className="space-y-3">
                  {alertSeverities.map((level) => {
                    const isActive = severity === level && status === 'unresolved';
                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() =>
                          patch(
                            isActive
                              ? { severity: 'all', status: 'all' }
                              : { severity: level, status: 'unresolved' },
                          )
                        }
                        aria-pressed={isActive}
                        aria-label={`Unerledigte Meldungen mit Schweregrad ${alertSeverityLabels[level]} anzeigen`}
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
                          label={alertSeverityLabels[level]}
                          count={openCountFor(page, level)}
                          total={Math.max(page.openCount, 1)}
                          tone={severityColour[level]}
                        />
                      </button>
                    );
                  })}
                </div>
              </Panel>

              <Panel title="Meldungen nach Kategorie" description="Wo die Auffälligkeiten entstehen.">
                <CompositionBar
                  slices={categorySlices}
                  emptyLabel="Keine Meldungen im aktuellen Filter."
                  totalLabel={`${formatCount(page.total)} Meldungen`}
                />
              </Panel>
            </div>

            <DetailLayout
              list={
                <RecordTable
                  caption="Operative Meldungen"
                  columns={columns}
                  rows={page.alerts}
                  getRowKey={(row) => row.id}
                  selectedKey={selectedId}
                  onSelect={(row) => setSelectedId(row.id)}
                  rowLabel={(row) => `Meldung: ${row.title}`}
                  mobileTitle={(row) => row.title}
                  mobileSubtitle={(row) => alertCategoryLabels[row.category]}
                  mobileBadge={(row) => (
                    <StatusBadge
                      label={alertSeverityLabels[row.severity]}
                      tone={alertSeverityTones[row.severity]}
                    />
                  )}
                  minWidth={1080}
                />
              }
              detail={
                selected ? (
                  <DetailPanel
                    eyebrow="Meldung"
                    title={selected.title}
                    onClose={() => setSelectedId(null)}
                    subtitle={
                      <>
                        <StatusBadge
                          label={alertSeverityLabels[selected.severity]}
                          tone={alertSeverityTones[selected.severity]}
                        />
                        <StatusBadge
                          label={alertStatusLabels[selected.status]}
                          tone={alertStatusTones[selected.status]}
                        />
                      </>
                    }
                    groups={[
                      {
                        label: 'Einordnung',
                        rows: [
                          { label: 'Kategorie', value: alertCategoryLabels[selected.category] },
                          { label: 'Erstellt', value: <span className={text.numeric}>{formatDateTime(selected.createdAt)}</span> },
                          { label: 'Bezug', value: selected.relatedReference ?? '—' },
                          { label: 'Platz', value: selected.court ? courtLabel(selected.court) : '—' },
                          { label: 'Betrag', value: <span className={text.numeric}>{selected.amountCents == null ? '—' : formatCents(selected.amountCents)}</span> },
                        ],
                      },
                      {
                        label: 'Bearbeitung',
                        rows: [
                          { label: 'Gelöst am', value: <span className={text.numeric}>{selected.resolvedAt ? formatDateTime(selected.resolvedAt) : '—'}</span> },
                          { label: 'Gelöst durch', value: selected.resolvedByRole ?? '—' },
                        ],
                      },
                    ]}
                  >
                    <DetailNote label="Meldungstext">{selected.message}</DetailNote>
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
