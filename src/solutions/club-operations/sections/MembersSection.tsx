// Club Operations — Mitglieder.
//
// Read-only member register. No creation, editing, deletion or bulk import exists here.
//
// Composition: membership is what determines the padel VAT rate, so this section is organised around
// classification rather than around a roster. The tax classification a membership confers leads, and
// each record shows the bookings and revenue it accounts for — the link the reference dashboard
// leaves implicit, and the reason an unresolved membership blocks a monthly close.

import { useCallback, useMemo, useState } from 'react';
import { SearchX, Users } from 'lucide-react';

import { EmptyState, StatusBadge } from '@/components/dashboard/primitives';
import { space, text } from '@/components/dashboard/tokens';
import { cn } from '@/lib/utils';

import type { ClubOperationsAdapter } from '../adapter/ClubOperationsAdapter';
import { CompositionBar, RankedBars, type CompositionSlice, type RankedDatum } from '../components/charts';
import { DetailLayout, DetailPanel } from '../components/DetailPanel';
import { FilterBar } from '../components/FilterBar';
import { MetricRow, MetricStrip, PrimaryMetric } from '../components/MetricCard';
import { RecordTable, type RecordColumn } from '../components/RecordTable';
import { Panel, SectionShell } from '../components/SectionShell';
import { hasNoActiveFacets, withSeed } from '../filtering';
import { formatCents, formatCount, formatDate, percentOf } from '../formatting';
import {
  memberStatusLabels,
  memberStatusTones,
  membershipLabels,
  membershipTypeLabels,
} from '../labels';
import { memberStatusOptions, membershipTypeOptions } from '../options';
import type { Member, MemberPage, MemberQuery } from '../types';
import { emptyMemberQuery, membershipTypes, memberStatuses } from '../types';
import { useClubOperationsResource } from '../useClubOperationsResource';

export function MembersSection({
  adapter,
  seededQuery,
}: {
  adapter: ClubOperationsAdapter;
  seededQuery?: Record<string, string>;
}) {
  const [query, setQuery] = useState<MemberQuery>(() => withSeed(emptyMemberQuery, seededQuery));
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { search, membershipType, status } = query;
  const resource = useClubOperationsResource<MemberPage>(
    () => adapter.listMembers({ search, membershipType, status }),
    [adapter, search, membershipType, status],
  );

  const reset = useCallback(() => {
    setQuery(emptyMemberQuery);
    setSelectedId(null);
  }, []);

  const patch = (partial: Partial<MemberQuery>) => setQuery((prev) => ({ ...prev, ...partial }));

  const columns: RecordColumn<Member>[] = useMemo(
    () => [
      {
        key: 'name',
        header: 'Name',
        render: (row) => (
          <span className="break-words">
            <span className={text.bodyStrong}>
              {row.firstName} {row.lastName}
            </span>
            <span className={cn('ml-2 tabular-nums', text.hint)}>Nr. {row.memberNumber}</span>
          </span>
        ),
        sortValue: (row) => `${row.lastName} ${row.firstName}`,
        mobile: 'hidden',
      },
      {
        key: 'type',
        header: 'Mitgliedschaft',
        width: '132px',
        render: (row) => membershipTypeLabels[row.membershipType],
        sortValue: (row) => membershipTypeLabels[row.membershipType],
        mobile: 'primary',
      },
      {
        key: 'status',
        header: 'Status',
        width: '122px',
        render: (row) => (
          <StatusBadge label={memberStatusLabels[row.status]} tone={memberStatusTones[row.status]} />
        ),
        sortValue: (row) => memberStatuses.indexOf(row.status),
        mobile: 'hidden',
      },
      {
        key: 'vat',
        header: 'Steuerlich',
        width: '128px',
        render: (row) => (
          <span className={row.vatClassification === 'member' ? text.bodyStrong : text.hint}>
            {membershipLabels[row.vatClassification]}
          </span>
        ),
        sortValue: (row) => membershipLabels[row.vatClassification],
        mobile: 'primary',
      },
      {
        key: 'joined',
        header: 'Eintritt',
        width: '116px',
        render: (row) => <span className="whitespace-nowrap tabular-nums">{formatDate(row.joinedAt)}</span>,
        sortValue: (row) => row.joinedAt,
        mobile: 'secondary',
      },
      {
        key: 'validUntil',
        header: 'Gültig bis',
        width: '116px',
        render: (row) => (
          <span className="whitespace-nowrap tabular-nums">
            {row.validUntil ? formatDate(row.validUntil) : <span className="text-[var(--cq-fg-subtle)]">—</span>}
          </span>
        ),
        sortValue: (row) => row.validUntil ?? '',
        mobile: 'secondary',
      },
      {
        key: 'bookings',
        header: 'Buchungen',
        align: 'right',
        width: '108px',
        render: (row) => formatCount(row.bookingCount),
        sortValue: (row) => row.bookingCount,
        mobile: 'primary',
      },
      {
        key: 'revenue',
        header: 'Umsatz',
        align: 'right',
        width: '112px',
        render: (row) => (
          <span className={row.bookingRevenueCents > 0 ? text.bodyStrong : undefined}>
            {formatCents(row.bookingRevenueCents)}
          </span>
        ),
        sortValue: (row) => row.bookingRevenueCents,
        mobile: 'secondary',
      },
    ],
    [],
  );

  return (
    <SectionShell
      title="Mitglieder"
      description="Wer Mitglied ist, welche steuerliche Einstufung das bewirkt und welche Buchungen darauf entfallen."
      resource={resource}
      loadingLabel="Mitglieder werden geladen"
      errorTitle="Mitglieder konnten nicht geladen werden"
      notice="Mitglieder können hier nicht angelegt, bearbeitet oder gelöscht werden."
      toolbar={
        <FilterBar
          query={query}
          onReset={reset}
          resultCount={resource.data?.total ?? 0}
          countLabel={['Mitglied', 'Mitglieder']}
          facets={[
            { kind: 'text', key: 'member-search', label: 'Suche', value: search ?? '', placeholder: 'Name, Nummer oder Ort', onChange: (value) => patch({ search: value }), wide: true },
            { kind: 'select', key: 'member-type', label: 'Mitgliedschaft', value: membershipType ?? 'all', options: membershipTypeOptions, onChange: (value) => patch({ membershipType: value as MemberQuery['membershipType'] }) },
            { kind: 'select', key: 'member-status', label: 'Status', value: status ?? 'all', options: memberStatusOptions, onChange: (value) => patch({ status: value as MemberQuery['status'] }) },
          ]}
        />
      }
    >
      {(page) => {
        const selected = page.members.find((member) => member.id === selectedId) ?? null;

        if (page.members.length === 0) {
          return hasNoActiveFacets(query) ? (
            <EmptyState icon={Users} title="Noch keine Mitglieder" description="Sobald Mitglieder erfasst sind, erscheinen sie hier." />
          ) : (
            <EmptyState icon={SearchX} title="Keine Mitglieder für diese Filter" description="Passen Sie die Suche oder die Filter an, um wieder Ergebnisse zu sehen." />
          );
        }

        const reducedRate = page.members.filter((member) => member.vatClassification === 'member');
        const withBookings = page.members.filter((member) => member.bookingCount > 0);

        const typeSlices: CompositionSlice[] = membershipTypes
          .map((value, index) => ({
            key: value,
            label: membershipTypeLabels[value],
            value: page.members.filter((member) => member.membershipType === value).length,
            tone: index,
          }))
          .filter((slice) => slice.value > 0)
          .map((slice) => ({ ...slice, display: formatCount(slice.value) }));

        const topMembers: RankedDatum[] = [...withBookings]
          .sort((a, b) => b.bookingRevenueCents - a.bookingRevenueCents)
          .slice(0, 6)
          .map((member, index) => ({
            key: member.id,
            label: `${member.firstName} ${member.lastName}`,
            percent: percentOf(
              member.bookingRevenueCents,
              Math.max(...withBookings.map((entry) => entry.bookingRevenueCents), 1),
            ),
            value: formatCents(member.bookingRevenueCents),
            hint: `${formatCount(member.bookingCount)} Buchungen · ${membershipTypeLabels[member.membershipType]}`,
            leading: index === 0,
          }));

        return (
          <div className={space.pageGap}>
            <MetricRow label="Mitgliederbestand im aktuellen Filter" columns={3}>
              <PrimaryMetric
                label="Mitglieder"
                value={formatCount(page.totals.total)}
                footnote={`${formatCount(page.totals.active)} aktiv`}
              />
              <PrimaryMetric
                label="Mit ermäßigtem Steuersatz"
                value={formatCount(reducedRate.length)}
                footnote="Padel- und Kombinationsmitgliedschaften"
              />
              <PrimaryMetric
                label="Umsatz aus Mitgliederbuchungen"
                value={formatCents(page.members.reduce((total, member) => total + member.bookingRevenueCents, 0))}
                footnote={`${formatCount(withBookings.length)} Mitglieder mit Buchungen`}
              />
            </MetricRow>

            <div className="grid gap-4 lg:grid-cols-2">
              <Panel title="Mitgliedschaftsarten" description="Zusammensetzung des Bestands.">
                <CompositionBar
                  slices={typeSlices}
                  emptyLabel="Keine Mitglieder im aktuellen Filter."
                  totalLabel={`${formatCount(page.total)} Mitglieder`}
                />
              </Panel>
              <Panel title="Umsatzstärkste Mitglieder" description="Buchungsumsatz im gesamten Datenbestand.">
                <RankedBars rows={topMembers} emptyLabel="Keine Mitgliederbuchungen im aktuellen Filter." />
              </Panel>
            </div>

            <MetricStrip
              items={[
                { label: 'Padel', value: formatCount(page.totals.padel), hint: 'ermäßigter Steuersatz' },
                { label: 'Kombination', value: formatCount(page.totals.combination), hint: 'Padel und Tennis' },
                { label: 'Tennis', value: formatCount(page.totals.tennis), hint: 'steuerfrei' },
                { label: 'Ohne Buchungen', value: formatCount(page.total - withBookings.length), hint: 'im Datenbestand' },
              ]}
            />

            <DetailLayout
              list={
                <RecordTable
                  caption="Mitgliederverzeichnis"
                  columns={columns}
                  rows={page.members}
                  getRowKey={(row) => row.id}
                  selectedKey={selectedId}
                  onSelect={(row) => setSelectedId(row.id)}
                  rowLabel={(row) => `Mitglied ${row.firstName} ${row.lastName}`}
                  mobileTitle={(row) => `${row.firstName} ${row.lastName}`}
                  mobileSubtitle={(row) => `Nr. ${row.memberNumber}`}
                  mobileBadge={(row) => (
                    <StatusBadge
                      label={memberStatusLabels[row.status]}
                      tone={memberStatusTones[row.status]}
                    />
                  )}
                  initialSort={{ key: 'name', direction: 'asc' }}
                  minWidth={1060}
                />
              }
              detail={
                selected ? (
                  <DetailPanel
                    eyebrow="Mitglied"
                    title={`${selected.firstName} ${selected.lastName}`}
                    onClose={() => setSelectedId(null)}
                    subtitle={
                      <StatusBadge
                        label={memberStatusLabels[selected.status]}
                        tone={memberStatusTones[selected.status]}
                      />
                    }
                    groups={[
                      {
                        label: 'Mitgliedschaft',
                        rows: [
                          { label: 'Mitgliedsnummer', value: <span className={text.numeric}>{selected.memberNumber}</span> },
                          { label: 'Art', value: membershipTypeLabels[selected.membershipType] },
                          { label: 'Steuerliche Einstufung', value: membershipLabels[selected.vatClassification] },
                          { label: 'Eintritt', value: <span className={text.numeric}>{formatDate(selected.joinedAt)}</span> },
                          { label: 'Gültig bis', value: <span className={text.numeric}>{selected.validUntil ? formatDate(selected.validUntil) : '—'}</span> },
                          { label: 'Ort', value: `${selected.postalCode} ${selected.city}` },
                        ],
                      },
                      {
                        label: 'Buchungen',
                        rows: [
                          { label: 'Anzahl', value: <span className={text.numeric}>{formatCount(selected.bookingCount)}</span> },
                          { label: 'Umsatz', value: <span className={cn(text.numeric, text.bodyStrong)}>{formatCents(selected.bookingRevenueCents)}</span> },
                        ],
                      },
                    ]}
                  />
                ) : null
              }
            />
          </div>
        );
      }}
    </SectionShell>
  );
}
