// Club Operations — Aktivitätsprotokoll.
//
// Read-only, newest first. Nothing here writes an audit entry; in the reference dashboard opening a
// report or exporting one records an entry, which is a mutation and therefore absent.
//
// Composition: an audit trail is read chronologically, so the wide screen shows a day-grouped
// timeline rather than a flat table — entries under a date heading, with the time, the actor and the
// action on one line. A table of forty rows where the first column is a repeated date is a table
// that makes the reader do the grouping themselves.
//
// The table is still rendered, at phone width and for assistive technology: a timeline is a
// presentation of tabular data, and the underlying rows have to stay reachable and sortable.

import { useCallback, useMemo, useState } from 'react';
import { Activity, SearchX } from 'lucide-react';

import { EmptyState, StatusBadge } from '@/components/dashboard/primitives';
import { border, focusRingOnSurface, radius, space, surface, text } from '@/components/dashboard/tokens';
import { cn } from '@/lib/utils';

import type { ClubOperationsAdapter } from '../adapter/ClubOperationsAdapter';
import { CompositionBar, type CompositionSlice } from '../components/charts';
import { DetailLayout, DetailPanel } from '../components/DetailPanel';
import { FilterBar } from '../components/FilterBar';
import { MetricStrip } from '../components/MetricCard';
import { RecordTable, type RecordColumn } from '../components/RecordTable';
import { Panel, SectionShell } from '../components/SectionShell';
import { hasNoActiveFacets, withSeed } from '../filtering';
import { formatCount, formatDateTime, formatDayKey, formatTime, toLocalDateKey } from '../formatting';
import { activityActionLabel, activityActorTypeLabels, activityCategoryLabels } from '../labels';
import { feedback } from '../motion';
import { activityActorTypeOptions, activityCategoryOptions } from '../options';
import type { ActivityPage, ActivityQuery, ActivityRecord } from '../types';
import { activityCategories, emptyActivityQuery } from '../types';
import { useClubOperationsResource } from '../useClubOperationsResource';

/** Group the (already newest-first) records by local calendar day, preserving order. */
function groupByDay(records: ActivityRecord[]): { day: string; records: ActivityRecord[] }[] {
  const groups: { day: string; records: ActivityRecord[] }[] = [];
  for (const record of records) {
    const day = toLocalDateKey(record.occurredAt);
    const current = groups[groups.length - 1];
    if (current?.day === day) current.records.push(record);
    else groups.push({ day, records: [record] });
  }
  return groups;
}

export function ActivitySection({
  adapter,
  seededQuery,
}: {
  adapter: ClubOperationsAdapter;
  seededQuery?: Record<string, string>;
}) {
  const [query, setQuery] = useState<ActivityQuery>(() => withSeed(emptyActivityQuery, seededQuery));
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { search, dateFrom, dateTo, category, actorType } = query;
  const resource = useClubOperationsResource<ActivityPage>(
    () => adapter.listActivity({ search, dateFrom, dateTo, category, actorType }),
    [adapter, search, dateFrom, dateTo, category, actorType],
  );

  const reset = useCallback(() => {
    setQuery(emptyActivityQuery);
    setSelectedId(null);
  }, []);

  const patch = (partial: Partial<ActivityQuery>) => setQuery((prev) => ({ ...prev, ...partial }));

  const columns: RecordColumn<ActivityRecord>[] = useMemo(
    () => [
      {
        key: 'time',
        header: 'Zeitpunkt',
        width: '152px',
        render: (row) => <span className="whitespace-nowrap tabular-nums">{formatDateTime(row.occurredAt)}</span>,
        sortValue: (row) => row.occurredAt,
        mobile: 'primary',
      },
      {
        key: 'action',
        header: 'Aktion',
        width: '210px',
        render: (row) => <span className={text.bodyStrong}>{activityActionLabel(row.actionCode)}</span>,
        sortValue: (row) => activityActionLabel(row.actionCode),
        mobile: 'hidden',
      },
      {
        key: 'category',
        header: 'Kategorie',
        width: '124px',
        render: (row) => <StatusBadge label={activityCategoryLabels[row.category]} tone="neutral" />,
        sortValue: (row) => activityCategoryLabels[row.category],
        mobile: 'primary',
      },
      {
        key: 'summary',
        header: 'Vorgang',
        render: (row) => <span className="break-words">{row.summary}</span>,
        mobile: 'secondary',
      },
      {
        key: 'actor',
        header: 'Akteur',
        width: '168px',
        render: (row) => (
          <span className={text.hint}>
            {activityActorTypeLabels[row.actorType]} · {row.actorRole}
          </span>
        ),
        sortValue: (row) => `${row.actorType} ${row.actorRole}`,
        mobile: 'secondary',
      },
      {
        key: 'reference',
        header: 'Bezug',
        width: '128px',
        render: (row) => row.relatedReference ?? <span className="text-[var(--cq-fg-subtle)]">—</span>,
        mobile: 'primary',
      },
    ],
    [],
  );

  return (
    <SectionShell
      title="Aktivitätsprotokoll"
      description="Nachvollziehbare Historie aller Vorgänge, neueste zuerst — wer wann was ausgelöst hat."
      resource={resource}
      loadingLabel="Aktivitätsprotokoll wird geladen"
      errorTitle="Aktivitätsprotokoll konnte nicht geladen werden"
      notice="Das Protokoll ist reine Historie und wird durch diese Ansicht nicht ergänzt."
      toolbar={
        <FilterBar
          query={query}
          onReset={reset}
          resultCount={resource.data?.total ?? 0}
          countLabel={['Eintrag', 'Einträge']}
          facets={[
            { kind: 'text', key: 'activity-search', label: 'Suche', value: search ?? '', placeholder: 'Vorgang, Objekt oder Bezug', onChange: (value) => patch({ search: value }), wide: true },
            { kind: 'select', key: 'activity-category', label: 'Kategorie', value: category ?? 'all', options: activityCategoryOptions, onChange: (value) => patch({ category: value as ActivityQuery['category'] }) },
            { kind: 'select', key: 'activity-actor', label: 'Akteur', value: actorType ?? 'all', options: activityActorTypeOptions, onChange: (value) => patch({ actorType: value as ActivityQuery['actorType'] }) },
            { kind: 'date', key: 'activity-from', label: 'Von', value: dateFrom ?? '', onChange: (value) => patch({ dateFrom: value }) },
            { kind: 'date', key: 'activity-to', label: 'Bis', value: dateTo ?? '', onChange: (value) => patch({ dateTo: value }) },
          ]}
        />
      }
    >
      {(page) => {
        const selected = page.records.find((record) => record.id === selectedId) ?? null;

        if (page.records.length === 0) {
          return hasNoActiveFacets(query) ? (
            <EmptyState icon={Activity} title="Noch keine Einträge" description="Sobald Vorgänge stattfinden, erscheinen sie hier." />
          ) : (
            <EmptyState icon={SearchX} title="Keine Einträge für diese Filter" description="Passen Sie die Suche oder die Filter an, um wieder Ergebnisse zu sehen." />
          );
        }

        const days = groupByDay(page.records);
        const categorySlices: CompositionSlice[] = activityCategories
          .map((value, index) => ({
            key: value,
            label: activityCategoryLabels[value],
            value: page.records.filter((record) => record.category === value).length,
            tone: index,
          }))
          .filter((slice) => slice.value > 0)
          .map((slice) => ({ ...slice, display: formatCount(slice.value) }));

        return (
          <div className={space.pageGap}>
            <MetricStrip
              items={[
                { label: 'Einträge', value: formatCount(page.total), hint: 'im aktuellen Filter' },
                { label: 'Tage mit Aktivität', value: formatCount(days.length), hint: 'im aktuellen Filter' },
                { label: 'Durch Administration', value: formatCount(page.records.filter((record) => record.actorType === 'admin').length), hint: 'manuell ausgelöst' },
                { label: 'Durch System', value: formatCount(page.records.filter((record) => record.actorType === 'system').length), hint: 'automatisch' },
              ]}
            />

            <Panel title="Vorgänge nach Kategorie" description="Wo im Betrieb die Historie entsteht.">
              <CompositionBar
                slices={categorySlices}
                emptyLabel="Keine Einträge im aktuellen Filter."
                totalLabel={`${formatCount(page.total)} Einträge`}
              />
            </Panel>

            <DetailLayout
              list={
                <div className="space-y-4">
                  {/* Wide screens: a day-grouped trail. */}
                  <ol className="hidden space-y-5 xl:block">
                    {days.map((group) => (
                      <li key={group.day}>
                        <h4
                          className={cn(
                            'sticky top-0 z-10 -mx-1 mb-2 bg-[var(--cq-canvas)] px-1 py-1 tabular-nums',
                            text.eyebrow,
                          )}
                        >
                          {formatDayKey(group.day)}
                          <span className="ml-2 font-normal normal-case tracking-normal text-[var(--cq-fg-subtle)]">
                            {formatCount(group.records.length)} Einträge
                          </span>
                        </h4>
                        <ol className={cn('overflow-hidden', surface.card, 'p-0')}>
                          {group.records.map((record) => {
                            const isSelected = record.id === selectedId;
                            return (
                              <li
                                key={record.id}
                                className={cn('relative', border.hairlineB, border.subtle, 'last:border-0')}
                              >
                                {isSelected ? (
                                  <span
                                    aria-hidden="true"
                                    className="absolute inset-y-0 left-0 w-[3px] bg-[var(--cq-fg)]"
                                  />
                                ) : null}
                                <button
                                  type="button"
                                  onClick={() => setSelectedId(record.id)}
                                  aria-label={`Protokolleintrag vom ${formatDateTime(record.occurredAt)}`}
                                  className={cn(
                                    'flex w-full items-baseline gap-3 px-4 py-2.5 text-left',
                                    feedback,
                                    focusRingOnSurface,
                                    'hover:bg-[var(--cq-hover)]',
                                    isSelected && 'bg-[var(--cq-hover)]',
                                  )}
                                >
                                  <span className={cn('w-11 shrink-0 tabular-nums', text.hint)}>
                                    {formatTime(record.occurredAt)}
                                  </span>
                                  <span className={cn('w-[188px] shrink-0 truncate', text.bodyStrong)}>
                                    {activityActionLabel(record.actionCode)}
                                  </span>
                                  <span className={cn('min-w-0 flex-1 truncate', text.body)}>
                                    {record.summary}
                                  </span>
                                  <span className={cn('w-40 shrink-0 truncate text-right', text.hint)}>
                                    {activityActorTypeLabels[record.actorType]} · {record.actorRole}
                                  </span>
                                </button>
                              </li>
                            );
                          })}
                        </ol>
                      </li>
                    ))}
                  </ol>

                  {/* Narrow screens and assistive technology: the rows as a real table. */}
                  <div className="xl:hidden">
                    <RecordTable
                      caption="Aktivitätsprotokoll"
                      columns={columns}
                      rows={page.records}
                      getRowKey={(row) => row.id}
                      selectedKey={selectedId}
                      onSelect={(row) => setSelectedId(row.id)}
                      rowLabel={(row) => `Protokolleintrag vom ${formatDateTime(row.occurredAt)}`}
                      mobileTitle={(row) => activityActionLabel(row.actionCode)}
                      mobileSubtitle={(row) => row.summary}
                      minWidth={1020}
                    />
                  </div>
                </div>
              }
              detail={
                selected ? (
                  <DetailPanel
                    eyebrow="Protokolleintrag"
                    title={activityActionLabel(selected.actionCode)}
                    onClose={() => setSelectedId(null)}
                    subtitle={
                      <StatusBadge label={activityCategoryLabels[selected.category]} tone="neutral" />
                    }
                    groups={[
                      {
                        label: 'Vorgang',
                        rows: [
                          { label: 'Zeitpunkt', value: <span className={text.numeric}>{formatDateTime(selected.occurredAt)}</span> },
                          { label: 'Aktionscode', value: <span className={cn(text.numeric, 'text-[12px]')}>{selected.actionCode}</span> },
                          { label: 'Objekt', value: <span className="break-words">{selected.entityLabel}</span> },
                          { label: 'Bezug', value: selected.relatedReference ?? '—' },
                        ],
                      },
                      {
                        label: 'Akteur',
                        rows: [
                          { label: 'Art', value: activityActorTypeLabels[selected.actorType] },
                          { label: 'Rolle', value: selected.actorRole },
                        ],
                      },
                    ]}
                  >
                    <p className={cn('mt-4 p-3', radius.lg, 'bg-[var(--cq-sunken)]', border.hairline, text.body)}>
                      {selected.summary}
                    </p>
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
