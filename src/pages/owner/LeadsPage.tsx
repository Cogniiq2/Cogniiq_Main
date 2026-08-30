import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Target } from 'lucide-react';

import {
  Button, DataTable, EmptyState, ErrorState, Field, KpiCard, PageHeader, Select,
  StatusBadge, TableSkeleton, Tabs, text, type Column,
} from '@/components/dashboard';
import { cn } from '@/lib/utils';
import { useOwnerEntity } from '@/pages/owner/ownerContext';
import { LeadFormDialog } from '@/components/crm/LeadFormDialog';
import { loadLeads, localIsoDate } from '@/lib/ownerCrm/api';
import {
  LEAD_PRIORITY_ORDER, LEAD_STAGE_ORDER, integrationCheckStatusLabel,
  integrationCheckStatusTone, leadPriorityLabel, leadPriorityTone, leadPriorityWeight,
  leadStageLabel, leadStageTone,
} from '@/lib/ownerCrm/catalog';
import { followUpBucket, openPipelineValue } from '@/lib/ownerCrm/nextActions';
import { SERVICE_BY_KEY } from '@/lib/serviceOnboarding/catalog';
import { formatCentsCurrencyDe, formatDateDe } from '@/lib/ownerFinance/exports';
import type { LeadListRow, LeadStage } from '@/lib/ownerCrm/types';

// The owner's lead list: information-dense, searchable and filterable, and the
// entry point for "Lead hinzufügen". Leads only ever arrive through that button
// — there is no import, no sourcing and no feed behind this page.

type SortKey = 'activity' | 'follow_up' | 'value' | 'priority' | 'name';

const SORTS: { value: SortKey; label: string }[] = [
  { value: 'activity', label: 'Letzte Aktivität' },
  { value: 'follow_up', label: 'Nächstes Follow-up' },
  { value: 'value', label: 'Potenzial' },
  { value: 'priority', label: 'Priorität' },
  { value: 'name', label: 'Name' },
];

type TabKey = 'active' | 'overdue' | 'today' | 'no_follow_up' | 'won' | 'lost' | 'archived' | 'all';

function matchesTab(row: LeadListRow, tab: TabKey, today: string): boolean {
  const archived = Boolean(row.archived_at);
  if (tab === 'archived') return archived;
  if (tab === 'all') return true;
  if (archived) return false;
  switch (tab) {
    case 'active': return row.stage !== 'won' && row.stage !== 'lost';
    case 'won': return row.stage === 'won';
    case 'lost': return row.stage === 'lost';
    case 'overdue': return row.stage !== 'won' && row.stage !== 'lost' && followUpBucket(row, today) === 'overdue';
    case 'today': return row.stage !== 'won' && row.stage !== 'lost' && followUpBucket(row, today) === 'today';
    case 'no_follow_up': return row.stage !== 'won' && row.stage !== 'lost' && followUpBucket(row, today) === 'none';
    default: return true;
  }
}

/** Search across every identifier the owner might remember a prospect by. */
function matchesQuery(row: LeadListRow, needle: string): boolean {
  if (!needle) return true;
  const haystack = [
    row.display_name, row.company, row.contact_name, row.contact_role,
    row.email, row.phone, row.city, row.postal_code, row.source, row.website,
  ].filter(Boolean).join(' ').toLowerCase();
  return haystack.includes(needle);
}

export function LeadsPage() {
  const { entity } = useOwnerEntity();
  const navigate = useNavigate();
  const [rows, setRows] = useState<LeadListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>('active');
  const [query, setQuery] = useState('');
  const [stage, setStage] = useState<'all' | LeadStage>('all');
  const [priority, setPriority] = useState('all');
  const [service, setService] = useState('all');
  const [city, setCity] = useState('all');
  const [sort, setSort] = useState<SortKey>('activity');
  const [createOpen, setCreateOpen] = useState(false);

  // Pinned for the lifetime of the render pass, so a list rendered at 23:59 and
  // the badges inside it cannot disagree about which day it is.
  const today = useMemo(() => localIsoDate(), []);

  const load = useCallback(async () => {
    if (!entity) return;
    setLoading(true);
    try {
      setRows(await loadLeads(entity.id));
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [entity]);

  useEffect(() => { void load(); }, [load]);

  const cities = useMemo(
    () => Array.from(new Set(rows.map((r) => r.city).filter((c): c is string => Boolean(c)))).sort((a, b) => a.localeCompare(b, 'de')),
    [rows],
  );

  const counts = useMemo(() => ({
    active: rows.filter((r) => matchesTab(r, 'active', today)).length,
    overdue: rows.filter((r) => matchesTab(r, 'overdue', today)).length,
    today: rows.filter((r) => matchesTab(r, 'today', today)).length,
    no_follow_up: rows.filter((r) => matchesTab(r, 'no_follow_up', today)).length,
    won: rows.filter((r) => matchesTab(r, 'won', today)).length,
    lost: rows.filter((r) => matchesTab(r, 'lost', today)).length,
    archived: rows.filter((r) => matchesTab(r, 'archived', today)).length,
  }), [rows, today]);

  const pipeline = useMemo(() => openPipelineValue(rows), [rows]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = rows.filter((r) =>
      matchesTab(r, tab, today)
      && matchesQuery(r, needle)
      && (stage === 'all' || r.stage === stage)
      && (priority === 'all' || r.priority === priority)
      && (service === 'all' || r.service_interests.includes(service as never))
      && (city === 'all' || r.city === city));

    const byName = (a: LeadListRow, b: LeadListRow) => a.display_name.localeCompare(b.display_name, 'de');
    return [...filtered].sort((a, b) => {
      switch (sort) {
        case 'follow_up': {
          // Leads with a date first, soonest at the top; the rest keep their own order.
          if (!a.next_follow_up_at && !b.next_follow_up_at) return byName(a, b);
          if (!a.next_follow_up_at) return 1;
          if (!b.next_follow_up_at) return -1;
          return a.next_follow_up_at.localeCompare(b.next_follow_up_at);
        }
        case 'value':
          return ((b.estimated_setup_cents ?? 0) - (a.estimated_setup_cents ?? 0)) || byName(a, b);
        case 'priority':
          return (leadPriorityWeight[b.priority] - leadPriorityWeight[a.priority]) || byName(a, b);
        case 'name':
          return byName(a, b);
        default:
          return b.last_activity_at.localeCompare(a.last_activity_at);
      }
    });
  }, [rows, tab, query, stage, priority, service, city, sort, today]);

  const columns: Column<LeadListRow>[] = [
    {
      key: 'lead', header: 'Lead',
      render: (r) => (
        <div className="min-w-0">
          <p className={cn('truncate', text.bodyStrong)}>{r.display_name}</p>
          {r.contact_name && r.company ? <p className={cn('truncate', text.hint)}>{r.contact_name}</p> : null}
        </div>
      ),
    },
    {
      key: 'stage', header: 'Phase',
      render: (r) => <StatusBadge label={leadStageLabel[r.stage]} tone={leadStageTone[r.stage]} />,
    },
    {
      key: 'services', header: 'Interesse', hideOnMobile: true,
      render: (r) => (r.service_interests.length === 0
        ? <span className={text.hint}>—</span>
        : <span className="text-[12px]">{r.service_interests.map((k) => SERVICE_BY_KEY[k]?.name ?? k).join(', ')}</span>),
    },
    {
      key: 'integration', header: 'Schnittstelle', hideOnMobile: true,
      // Only meaningful where the AI Receptionist is on the table.
      render: (r) => (r.service_interests.includes('ai_receptionist')
        ? <StatusBadge label={integrationCheckStatusLabel[r.integration_status]} tone={integrationCheckStatusTone[r.integration_status]} />
        : <span className={text.hint}>—</span>),
    },
    {
      key: 'priority', header: 'Priorität', hideOnMobile: true,
      render: (r) => <StatusBadge label={leadPriorityLabel[r.priority]} tone={leadPriorityTone[r.priority]} />,
    },
    {
      key: 'follow_up', header: 'Follow-up',
      render: (r) => {
        if (!r.next_follow_up_at) return <span className={text.hint}>Nicht geplant</span>;
        const bucket = followUpBucket(r, today);
        return (
          <span className={cn(bucket === 'overdue' && 'font-medium text-red-600', bucket === 'today' && 'font-medium text-amber-700')}>
            {formatDateDe(r.next_follow_up_at)}
          </span>
        );
      },
    },
    {
      key: 'value', header: 'Potenzial', align: 'right',
      render: (r) => (r.estimated_setup_cents === null && r.estimated_monthly_cents === null
        ? <span className={text.hint}>—</span>
        : (
          <div>
            {r.estimated_setup_cents !== null ? <p>{formatCentsCurrencyDe(r.estimated_setup_cents)}</p> : null}
            {r.estimated_monthly_cents !== null ? <p className={text.hint}>{formatCentsCurrencyDe(r.estimated_monthly_cents)} / Monat</p> : null}
          </div>
        )),
    },
    {
      key: 'activity', header: 'Letzte Aktivität', align: 'right', hideOnMobile: true,
      render: (r) => <span className={text.hint}>{formatDateDe(r.last_activity_at)}</span>,
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Leads"
        description="Manuell erfasste Interessenten. Diese Liste wird ausschließlich von Ihnen gepflegt."
        actions={(
          <Button onClick={() => setCreateOpen(true)} disabled={!entity}>
            <Plus size={15} aria-hidden="true" /> Lead hinzufügen
          </Button>
        )}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Aktive Leads" value={String(pipeline.count)} icon={Target} />
        <KpiCard
          label="Follow-up überfällig" value={String(counts.overdue)}
          tone={counts.overdue > 0 ? 'negative' : 'neutral'}
          hint={counts.today > 0 ? `${counts.today} heute fällig` : undefined}
        />
        <KpiCard label="Potenzial Setup" valueCents={pipeline.setupCents} basis="estimate" />
        <KpiCard label="Potenzial monatlich" valueCents={pipeline.monthlyCents} basis="estimate" />
      </div>

      <Tabs
        value={tab}
        onChange={(v) => setTab(v as TabKey)}
        tabs={[
          { value: 'active', label: 'Aktiv', count: counts.active },
          { value: 'overdue', label: 'Überfällig', count: counts.overdue },
          { value: 'today', label: 'Heute', count: counts.today },
          { value: 'no_follow_up', label: 'Ohne Follow-up', count: counts.no_follow_up },
          { value: 'won', label: 'Gewonnen', count: counts.won },
          { value: 'lost', label: 'Verloren', count: counts.lost },
          { value: 'archived', label: 'Archiviert', count: counts.archived },
          { value: 'all', label: 'Alle', count: rows.length },
        ]}
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <div className="xl:col-span-2">
          <Field
            id="lead-search" value={query} onChange={setQuery}
            placeholder="Suchen: Praxis, Kontakt, E-Mail, Telefon, Ort …"
          />
        </div>
        <Select
          id="lead-filter-stage" value={stage} onChange={(v) => setStage(v as 'all' | LeadStage)}
          options={[{ value: 'all', label: 'Alle Phasen' }, ...LEAD_STAGE_ORDER.map((s) => ({ value: s, label: leadStageLabel[s] }))]}
        />
        <Select
          id="lead-filter-priority" value={priority} onChange={setPriority}
          options={[{ value: 'all', label: 'Alle Prioritäten' }, ...LEAD_PRIORITY_ORDER.map((p) => ({ value: p, label: leadPriorityLabel[p] }))]}
        />
        <Select
          id="lead-filter-service" value={service} onChange={setService}
          options={[
            { value: 'all', label: 'Alle Leistungen' },
            ...Object.values(SERVICE_BY_KEY).map((s) => ({ value: s.key, label: s.name })),
          ]}
        />
        {cities.length > 1 ? (
          <Select
            id="lead-filter-city" value={city} onChange={setCity}
            options={[{ value: 'all', label: 'Alle Orte' }, ...cities.map((c) => ({ value: c, label: c }))]}
          />
        ) : null}
        <Select
          id="lead-sort" value={sort} onChange={(v) => setSort(v as SortKey)}
          options={SORTS.map((s) => ({ value: s.value, label: `Sortierung: ${s.label}` }))}
        />
      </div>

      {error ? (
        <ErrorState message={error} onRetry={() => void load()} />
      ) : loading ? (
        <TableSkeleton rows={6} cols={7} />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Target}
          title={rows.length === 0 ? 'Noch keine Leads erfasst' : 'Keine Treffer'}
          description={rows.length === 0
            ? 'Legen Sie Ihren ersten Interessenten an. Ein Name genügt — alles Weitere lässt sich später ergänzen.'
            : 'Passen Sie Suche oder Filter an.'}
          action={rows.length === 0
            ? <Button onClick={() => setCreateOpen(true)}><Plus size={15} aria-hidden="true" /> Lead hinzufügen</Button>
            : <Button variant="secondary" onClick={() => { setQuery(''); setStage('all'); setPriority('all'); setService('all'); setCity('all'); setTab('all'); }}>Filter zurücksetzen</Button>}
        />
      ) : (
        <>
          <p className={text.hint}>
            {visible.length} von {rows.length} {rows.length === 1 ? 'Lead' : 'Leads'}
          </p>
          <DataTable
            columns={columns}
            rows={visible}
            getRowKey={(r) => r.id}
            minWidth={980}
            mobileTitle={(r) => r.display_name}
            mobileSubtitle={(r) => [r.city, r.email].filter(Boolean).join(' · ')}
            onRowClick={(r) => navigate(`/admin/finance/leads/${r.id}`)}
          />
        </>
      )}

      {entity ? (
        <LeadFormDialog
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          entityId={entity.id}
          onSaved={(id) => navigate(`/admin/finance/leads/${id}`)}
        />
      ) : null}
    </div>
  );
}

export default LeadsPage;
