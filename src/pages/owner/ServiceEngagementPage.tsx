import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  Card, ErrorState, PremiumSelect, Skeleton, StatusBadge, Tabs, Textarea,
  border, radius, text, useToast,
} from '@/components/dashboard';
import { EngagementHero } from '@/components/services/EngagementHero';
import {
  ActivityPanel, BlockerPanel, NextActionsPanel, ReadinessPanel,
} from '@/components/services/EngagementOverview';
import { EngagementFieldGroup } from '@/components/services/EngagementFieldGroup';
import { EngagementTaskList } from '@/components/services/EngagementTaskList';
import { AppointmentTypesPanel } from '@/components/services/AppointmentTypesPanel';
import { PhaseSection } from '@/components/services/servicePrimitives';
import {
  NAV_GROUP_ORDER, integrationModeDescription, integrationModeLabel,
  isServiceKey, navGroupLabel,
} from '@/lib/serviceOnboarding/catalog';
import {
  classifyServiceError, describeServiceError, loadCustomerServices, loadEngagementDetail,
  setEngagementStatus, updateEngagement,
} from '@/lib/serviceOnboarding/api';
import {
  computeGoLiveGate, computeNextActions, computeReadiness, computeTaskCounts, taskApplies,
} from '@/lib/serviceOnboarding/readiness';
import type {
  EngagementDetail, EngagementStatus, GoLiveBlocker, NavGroup,
} from '@/lib/serviceOnboarding/types';

/**
 * The AI Receptionist delivery workspace.
 *
 * Route: /admin/finance/customers/:customerId/services/:serviceKey — one level under the
 * canonical customer, so the customer stays the spine and the service is what hangs off it.
 *
 * The twenty operational phases are grouped into nine navigation areas. Everything a phase needs
 * lives together: its structured data above, its actionable steps below. Overview is not another
 * tab of forms — it is the command centre, the readiness breakdown, the worklist and the blockers.
 */
export function ServiceEngagementPage() {
  const { customerId, serviceKey } = useParams<{ customerId: string; serviceKey: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [detail, setDetail] = useState<EngagementDetail | null>(null);
  /* A ref, not state: resolving the service into its engagement id must not re-run the load
     effect, or every first mount would fetch the workspace twice. */
  const engagementIdRef = useRef<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backendMissing, setBackendMissing] = useState(false);
  const [group, setGroup] = useState<NavGroup>('overview');
  const [statusSaving, setStatusSaving] = useState(false);

  const backHref = `/admin/finance/customers/${customerId ?? ''}`;

  /* Resolve the service into its engagement, then load the workspace. Two calls on first mount
     and exactly one on every refresh afterwards — the engagement id does not change. */
  const load = useCallback(async () => {
    if (!customerId || !serviceKey || !isServiceKey(serviceKey)) {
      setError('Unbekannte Leistung.');
      setLoading(false);
      return;
    }
    try {
      let id = engagementIdRef.current;
      if (!id) {
        const services = await loadCustomerServices(customerId);
        const service = services.find((s) => s.service_key === serviceKey);
        if (!service) { setError('Diese Leistung ist dem Kunden nicht zugeordnet.'); setLoading(false); return; }
        if (!service.engagement) { setError('Für diese Leistung existiert noch kein Onboarding-Workspace.'); setLoading(false); return; }
        id = service.engagement.id;
        engagementIdRef.current = id;
      }
      setDetail(await loadEngagementDetail(id));
      setBackendMissing(false);
      setError(null);
    } catch (e: unknown) {
      // Before the migrations are applied the tables and RPCs do not exist. That is a
      // deployment state, and saying so is more useful than a Postgres error string.
      const missing = classifyServiceError(e) === 'missing';
      setBackendMissing(missing);
      setError(
        missing
          ? 'Die Leistungsverwaltung ist in dieser Umgebung noch nicht aktiviert. Sie steht zur Verfügung, sobald die zugehörige Datenbank-Migration eingespielt wurde.'
          : describeServiceError(e),
      );
    } finally {
      setLoading(false);
    }
  }, [customerId, serviceKey]);

  useEffect(() => { void load(); }, [load]);

  const refresh = useCallback(() => { void load(); }, [load]);

  const readiness = useMemo(() => (detail ? computeReadiness(detail) : null), [detail]);
  const gate = useMemo(() => (detail ? computeGoLiveGate(detail) : null), [detail]);
  const nextActions = useMemo(() => (detail ? computeNextActions(detail) : []), [detail]);
  const counts = useMemo(() => (detail ? computeTaskCounts(detail) : null), [detail]);

  /** Which navigation area a section belongs to, so a jump lands on the right tab. */
  const groupOfSection = useMemo(() => {
    const map = new Map<string, NavGroup>();
    for (const section of detail?.sections ?? []) map.set(section.code, section.nav_group);
    return map;
  }, [detail]);

  const jumpToSection = useCallback((sectionCode: string) => {
    const target = groupOfSection.get(sectionCode);
    if (target) setGroup(target);
    // Let the tab content mount before scrolling to it.
    window.requestAnimationFrame(() => {
      document.getElementById(`section-${sectionCode}`)?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'start',
      });
    });
  }, [groupOfSection]);

  const changeStatus = async (status: EngagementStatus) => {
    const engagementId = engagementIdRef.current;
    if (!engagementId) return;
    setStatusSaving(true);
    const { error: err } = await setEngagementStatus(engagementId, status);
    setStatusSaving(false);
    if (err) {
      toast.error('Phase konnte nicht geändert werden', err);
      return;
    }
    refresh();
  };

  if (loading) {
    return (
      <div className="space-y-5" aria-busy="true">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-[196px] w-full" />
        <Skeleton className="h-9 w-full max-w-xl" />
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <Skeleton className="h-[280px] w-full" />
          <Skeleton className="h-[280px] w-full" />
        </div>
      </div>
    );
  }

  if (error || !detail || !readiness || !gate || !counts) {
    return (
      <>
        <button
          onClick={() => navigate(backHref)}
          className={cn('mb-3 inline-flex items-center gap-1 text-[13px] font-medium text-[var(--cq-fg-muted)] hover:text-[var(--cq-fg)]', radius.sm)}
        >
          <ArrowLeft size={14} aria-hidden="true" /> Zurück zum Kunden
        </button>
        {/* A not-yet-migrated environment is a deployment state, not a failure, so it gets a
            calm card and no retry button — retrying cannot create the tables. */}
        {backendMissing ? (
          <Card>
            <p className={text.cardTitle}>Leistungsverwaltung noch nicht aktiviert</p>
            <p className={cn('mt-1.5 max-w-2xl', text.body)}>{error}</p>
          </Card>
        ) : (
          <ErrorState message={error ?? 'Workspace nicht gefunden'} onRetry={refresh} />
        )}
      </>
    );
  }

  const { engagement } = detail;
  const healthcare = engagement.healthcare;

  const sectionsInGroup = detail.sections
    .filter((section) => section.nav_group === group)
    .filter((section) => !section.healthcare_only || healthcare);

  /** Tab counts show open work, so an area that needs attention is visible before opening it. */
  const groupCounts = new Map<NavGroup, number>();
  for (const section of detail.sections) {
    if (section.healthcare_only && !healthcare) continue;
    const open = detail.tasks.filter(
      (task) => task.section_code === section.code
        && taskApplies(task, healthcare)
        && task.status !== 'complete',
    ).length;
    groupCounts.set(section.nav_group, (groupCounts.get(section.nav_group) ?? 0) + open);
  }

  const tabs = NAV_GROUP_ORDER
    .filter((navGroup) => navGroup === 'overview' || detail.sections.some(
      (section) => section.nav_group === navGroup && (!section.healthcare_only || healthcare),
    ))
    .map((navGroup) => ({
      value: navGroup,
      label: navGroupLabel[navGroup],
      count: navGroup === 'overview' ? undefined : groupCounts.get(navGroup) ?? 0,
    }));

  const onBlockerSelected = (blocker: GoLiveBlocker) => jumpToSection(blocker.section_code);

  return (
    <div className="space-y-5">
      <button
        onClick={() => navigate(backHref)}
        className={cn('inline-flex items-center gap-1 text-[13px] font-medium text-[var(--cq-fg-muted)] transition-colors duration-fast hover:text-[var(--cq-fg)]', radius.sm)}
      >
        <ArrowLeft size={14} aria-hidden="true" /> Zurück zum Kunden
      </button>

      <EngagementHero
        detail={detail}
        readiness={readiness}
        gate={gate}
        nextAction={nextActions[0] ?? null}
        statusSaving={statusSaving}
        onStatusChange={(status) => void changeStatus(status)}
        onShowBlockers={() => {
          setGroup('overview');
          window.requestAnimationFrame(() => {
            document.getElementById('blocker-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          });
        }}
        onContinue={() => {
          const action = nextActions[0];
          if (action) jumpToSection(action.sectionCode);
        }}
      />

      <div className="sticky top-0 z-10 -mx-1 bg-[var(--cq-canvas)] px-1 py-2">
        <Tabs
          tabs={tabs}
          value={group}
          onChange={(value) => setGroup(value as NavGroup)}
        />
      </div>

      {group === 'overview' ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-5">
            <NextActionsPanel
              actions={nextActions}
              onSelect={(action) => jumpToSection(action.sectionCode)}
            />
            <BlockerPanel id="blocker-panel" gate={gate} sections={detail.sections} onSelect={onBlockerSelected} />
            {sectionsInGroup.map((section) => (
              <PhaseSection
                key={section.code}
                id={`section-${section.code}`}
                title={section.title}
                description={section.description}
              >
                <SectionBody detail={detail} sectionCode={section.code} onChanged={refresh} />
              </PhaseSection>
            ))}
            <EngagementSettings detail={detail} onChanged={refresh} />
          </div>
          <div className="space-y-5">
            <ReadinessPanel readiness={readiness} />
            <Card>
              <p className={cn('mb-3', text.eyebrow)}>Schritte</p>
              <dl className="space-y-1.5">
                <CountRow label="Offen" value={counts.open} />
                <CountRow label="In Arbeit" value={counts.inProgress} />
                <CountRow label="Wartet auf Kunde" value={counts.waitingForClient} />
                <CountRow label="Blockiert" value={counts.blocked} tone={counts.blocked > 0 ? 'danger' : undefined} />
                <CountRow label="Erledigt" value={counts.complete} />
                <CountRow label="Nicht zutreffend" value={counts.notApplicable} />
              </dl>
            </Card>
            <ActivityPanel activity={detail.activity} />
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {sectionsInGroup.length === 0 ? (
            <Card>
              <p className={text.body}>Für diesen Bereich sind in der aktuellen Vorlage keine Abschnitte hinterlegt.</p>
            </Card>
          ) : (
            sectionsInGroup.map((section) => {
              const openCount = detail.tasks.filter(
                (task) => task.section_code === section.code && taskApplies(task, healthcare) && task.status !== 'complete',
              ).length;
              return (
                <PhaseSection
                  key={section.code}
                  id={`section-${section.code}`}
                  title={section.title}
                  description={section.description}
                  meta={
                    <>
                      {section.healthcare_only ? <StatusBadge label="Healthcare" tone="info" /> : null}
                      <StatusBadge
                        label={openCount === 0 ? 'Abgeschlossen' : `${openCount} offen`}
                        tone={openCount === 0 ? 'success' : 'neutral'}
                      />
                    </>
                  }
                >
                  <SectionBody detail={detail} sectionCode={section.code} onChanged={refresh} />
                </PhaseSection>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ Section body */

/**
 * One phase: its structured data first, then its actionable steps. The appointment catalogue is
 * the one section with a shape of its own, because it is a list of records rather than a fixed
 * set of fields.
 */
function SectionBody({ detail, sectionCode, onChanged }: {
  detail: EngagementDetail;
  sectionCode: string;
  onChanged: () => void;
}) {
  const healthcare = detail.engagement.healthcare;
  const fields = detail.fields.filter(
    (field) => field.section_code === sectionCode && (!field.healthcare_only || healthcare),
  );
  const tasks = detail.tasks.filter((task) => task.section_code === sectionCode);

  return (
    <>
      {fields.length > 0 ? (
        <div className={cn('px-5 py-4', tasks.length > 0 && border.hairlineB)}>
          <EngagementFieldGroup fields={fields} onSaved={onChanged} />
        </div>
      ) : null}

      {sectionCode === 'workflow' ? (
        <div className={cn(tasks.length > 0 && border.hairlineB)}>
          <p className={cn('px-5 pt-4', text.eyebrow)}>Terminarten</p>
          <AppointmentTypesPanel
            engagementId={detail.engagement.id}
            items={detail.appointment_types}
            onChanged={onChanged}
          />
        </div>
      ) : null}

      {tasks.length > 0 ? (
        <EngagementTaskList
          tasks={tasks}
          healthcare={healthcare}
          onChanged={onChanged}
          emptyMessage="In diesem Abschnitt gibt es für diesen Kunden keine zutreffenden Schritte."
        />
      ) : null}
    </>
  );
}

/* ------------------------------------------------------------------ Engagement settings */

/**
 * The switches that change what applies to this client. `Healthcare` folds an entire class of
 * compliance work in or out, and the integration classification is where a partial automation is
 * forced to name its limitation — the database refuses to store one without.
 */
function EngagementSettings({ detail, onChanged }: { detail: EngagementDetail; onChanged: () => void }) {
  const toast = useToast();
  const { engagement } = detail;
  const [limitations, setLimitations] = useState(engagement.integration_limitations ?? '');
  const [summary, setSummary] = useState(engagement.summary ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLimitations(engagement.integration_limitations ?? '');
    setSummary(engagement.summary ?? '');
  }, [engagement.integration_limitations, engagement.summary]);

  const save = async (patch: Parameters<typeof updateEngagement>[1]) => {
    setSaving(true);
    const { error } = await updateEngagement(engagement.id, patch);
    setSaving(false);
    if (error) { toast.error('Speichern fehlgeschlagen', error); return false; }
    onChanged();
    return true;
  };

  return (
    <PhaseSection
      title="Projekteinstellungen"
      description="Steuern, welche Anforderungen für diesen Kunden überhaupt gelten."
      id="section-settings"
    >
      <div className="space-y-4 px-5 py-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <PremiumSelect
            id="engagement-healthcare"
            label="Projekttyp"
            value={engagement.healthcare ? 'healthcare' : 'general'}
            disabled={saving}
            onChange={(value) => void save({ healthcare: value === 'healthcare' })}
            options={[
              { value: 'general', label: 'Allgemeines Unternehmen', description: 'Gesundheitsspezifische Schritte entfallen' },
              { value: 'healthcare', label: 'Healthcare', description: 'Art. 9, § 203 und EU-Verarbeitung werden verlangt' },
            ]}
            hint="Healthcare blendet die gesundheitsspezifischen Pflichtschritte ein oder aus."
          />
          <PremiumSelect
            id="engagement-integration-mode"
            label="Integrationsart"
            value={engagement.integration_mode ?? ''}
            disabled={saving}
            onChange={(value) => {
              if (value === 'partial_automation' && limitations.trim() === '') {
                toast.error(
                  'Einschränkung erforderlich',
                  'Eine Teilautomatisierung muss dokumentieren, was genau nicht automatisiert ist.',
                );
                return;
              }
              void save({ integration_mode: value === '' ? null : value, integration_limitations: limitations || null });
            }}
            options={[
              { value: '', label: '— noch nicht eingeordnet —' },
              { value: 'full_automation', label: integrationModeLabel.full_automation, description: integrationModeDescription.full_automation },
              { value: 'partial_automation', label: integrationModeLabel.partial_automation, description: integrationModeDescription.partial_automation },
            ]}
          />
        </div>

        <Textarea
          id="engagement-limitations"
          label="Dokumentierte Einschränkungen"
          rows={3}
          value={limitations}
          onChange={setLimitations}
          hint="Bei Teilautomatisierung verpflichtend. Ein Rückruf oder ein Ticket ist keine Automatisierung — schreiben Sie auf, welcher Vorgang tatsächlich nicht durchläuft."
        />
        <div className="flex justify-end">
          <SaveButton
            disabled={saving || limitations === (engagement.integration_limitations ?? '')}
            onClick={() => void save({ integration_limitations: limitations || null })}
          />
        </div>

        <Textarea
          id="engagement-summary"
          label="Projektnotiz"
          rows={3}
          value={summary}
          onChange={setSummary}
          hint="Kurzer interner Kontext, der beim nächsten Öffnen sofort sichtbar sein soll."
        />
        <div className="flex justify-end">
          <SaveButton
            disabled={saving || summary === (engagement.summary ?? '')}
            onClick={() => void save({ summary: summary || null })}
          />
        </div>

        <p className={text.hint}>
          Vorlage: {engagement.template_code ?? '—'} · Version {engagement.template_version ?? '—'}.
          Spätere Vorlagenversionen ändern dieses Projekt nicht.
        </p>
      </div>
    </PhaseSection>
  );
}

function SaveButton({ disabled, onClick }: { disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex h-8 items-center px-2.5 text-[12.5px] font-medium',
        radius.md, border.hairline,
        disabled
          ? 'cursor-not-allowed bg-[var(--cq-sunken)] text-[var(--cq-fg-subtle)]'
          : 'bg-[var(--cq-surface)] text-[var(--cq-fg)] hover:bg-[var(--cq-hover)]',
      )}
    >
      {disabled ? 'Gespeichert' : 'Speichern'}
    </button>
  );
}

function CountRow({ label, value, tone }: { label: string; value: number; tone?: 'danger' }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className={text.body}>{label}</dt>
      <dd className={cn('tabular-nums text-[13px] font-medium', tone === 'danger' && value > 0 ? 'text-red-600' : 'text-[var(--cq-fg)]')}>
        {value}
      </dd>
    </div>
  );
}

export default ServiceEngagementPage;
