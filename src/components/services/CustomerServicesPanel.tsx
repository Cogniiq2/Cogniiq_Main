import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, LayoutGrid, Plus } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  Button, Card, ConfirmDialog, Modal, SectionHeader, Skeleton, StatusBadge,
  border, focusRing, interactive, radius, surface, text, useToast,
} from '@/components/dashboard';
import { Meter, InlineEmpty, SelectCard } from '@/components/services/servicePrimitives';
import {
  SERVICE_BY_KEY, SERVICE_DEFINITIONS, engagementStatusLabel, engagementStatusTone,
  serviceStateLabel, serviceStateTone,
} from '@/lib/serviceOnboarding/catalog';
import {
  addCustomerService, classifyServiceError, describeServiceError, loadCustomerServices,
  setCustomerServiceState,
} from '@/lib/serviceOnboarding/api';
import type { CustomerServiceSummary, ServiceKey, ServiceState } from '@/lib/serviceOnboarding/types';

/**
 * The customer's service strip: which services this customer receives, how far each one has
 * progressed, and what stands in its way. It is the entry point into every delivery workspace.
 *
 * Deliberately a summary, not a second workspace — one row per service, and one click into the
 * real thing. The counts come from a single RPC that aggregates server-side, so adding a fifth
 * service will not add a fifth request.
 */
export function CustomerServicesPanel({ customerId, onServicesChanged, onLoaded }: {
  customerId: string;
  /** Fired after any change, so the parent can refresh the customer's activity timeline. */
  onServicesChanged?: () => void;
  /** Reports the loaded services, so the parent can pre-select them in the edit dialog. */
  onLoaded?: (services: CustomerServiceSummary[]) => void;
}) {
  const toast = useToast();
  // Held in a ref so a caller passing an inline arrow does not re-trigger the load effect.
  const onLoadedRef = useRef(onLoaded);
  onLoadedRef.current = onLoaded;
  const [services, setServices] = useState<CustomerServiceSummary[] | null>(null);
  /* `missing` is the window between this frontend reaching production and the two
     service-onboarding migrations being applied. It is a deployment state, not a fault, and
     it must not paint a red error across every customer page while it lasts. */
  const [status, setStatus] = useState<'ok' | 'missing' | 'error'>('ok');
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [pending, setPending] = useState<ServiceKey[]>([]);
  const [saving, setSaving] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<CustomerServiceSummary | null>(null);

  const load = useCallback(async () => {
    try {
      const loaded = await loadCustomerServices(customerId);
      setServices(loaded);
      onLoadedRef.current?.(loaded);
      setStatus('ok');
      setError(null);
    } catch (e: unknown) {
      setStatus(classifyServiceError(e));
      setError(describeServiceError(e));
      setServices([]);
    }
  }, [customerId]);

  useEffect(() => { void load(); }, [load]);

  const existing = useMemo(
    () => new Set((services ?? []).map((s) => s.service_key)),
    [services],
  );
  const available = SERVICE_DEFINITIONS.filter((s) => !existing.has(s.key));

  const visible = (services ?? []).filter((s) => s.state !== 'archived');
  const archived = (services ?? []).filter((s) => s.state === 'archived');

  const confirmAdd = async () => {
    if (pending.length === 0) { setAddOpen(false); return; }
    setSaving(true);
    const failures: string[] = [];
    for (const key of pending) {
      const { error: err } = await addCustomerService(customerId, key);
      if (err) failures.push(SERVICE_BY_KEY[key].name);
    }
    setSaving(false);
    setAddOpen(false);
    setPending([]);
    await load();
    onServicesChanged?.();
    if (failures.length > 0) {
      toast.error('Leistung konnte nicht hinzugefügt werden', failures.join(', '));
    } else {
      toast.success('Leistung hinzugefügt', 'Der Onboarding-Workspace wurde angelegt.');
    }
  };

  const changeState = async (service: CustomerServiceSummary, state: ServiceState) => {
    const { error: err } = await setCustomerServiceState(service.id, state);
    if (err) { toast.error('Änderung fehlgeschlagen', err); return; }
    setArchiveTarget(null);
    await load();
    onServicesChanged?.();
    toast.success(
      state === 'archived' ? 'Leistung archiviert' : state === 'paused' ? 'Leistung pausiert' : 'Leistung wieder aktiv',
      state === 'archived' ? 'Der Onboarding-Verlauf bleibt vollständig erhalten.' : undefined,
    );
  };

  return (
    <Card className="p-0">
      <div className="px-5 pt-5">
        <SectionHeader
          title="Leistungen"
          description="Welche Cogniiq-Leistungen dieser Kunde erhält."
          action={
            available.length > 0 && status === 'ok' ? (
              <Button variant="secondary" size="sm" icon={Plus} onClick={() => { setPending([]); setAddOpen(true); }}>
                Leistung hinzufügen
              </Button>
            ) : undefined
          }
        />
      </div>

      <div className="px-5 pb-5">
        {services === null ? (
          <div className="space-y-2" aria-hidden="true">
            <Skeleton className="h-[68px] w-full" />
            <Skeleton className="h-[68px] w-full" />
          </div>
        ) : status === 'missing' ? (
          /* Calm and factual: the feature is deployed, the database is not yet. Nothing the
             owner does on this page can fix it, so it offers no retry and no alarm. */
          <InlineEmpty>
            Die Leistungsverwaltung ist in dieser Umgebung noch nicht aktiviert. Sie steht zur
            Verfügung, sobald die zugehörige Datenbank-Migration eingespielt wurde.
          </InlineEmpty>
        ) : status === 'error' ? (
          <InlineEmpty action={<Button size="sm" variant="secondary" onClick={() => void load()}>Erneut versuchen</Button>}>
            Die Leistungen konnten nicht geladen werden. {error}
          </InlineEmpty>
        ) : visible.length === 0 ? (
          <InlineEmpty
            action={<Button size="sm" icon={Plus} onClick={() => { setPending([]); setAddOpen(true); }}>Leistung hinzufügen</Button>}
          >
            Diesem Kunden ist noch keine Leistung zugeordnet. Wählen Sie eine Leistung, um den
            passenden Onboarding-Workspace anzulegen.
          </InlineEmpty>
        ) : (
          <ul className="space-y-2">
            {visible.map((service) => (
              <li key={service.id}>
                <ServiceRow
                  customerId={customerId}
                  service={service}
                  onPause={() => void changeState(service, 'paused')}
                  onResume={() => void changeState(service, 'active')}
                  onArchive={() => setArchiveTarget(service)}
                />
              </li>
            ))}
          </ul>
        )}

        {archived.length > 0 ? (
          <div className="mt-4">
            <p className={cn('mb-2', text.eyebrow)}>Archiviert</p>
            <ul className="space-y-2">
              {archived.map((service) => (
                <li key={service.id} className={cn('flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5', surface.sunken)}>
                  <span className="flex min-w-0 items-center gap-2">
                    <span className={text.bodyStrong}>{SERVICE_BY_KEY[service.service_key].name}</span>
                    <StatusBadge label="Archiviert" tone="neutral" />
                  </span>
                  <Button size="sm" variant="secondary" onClick={() => void changeState(service, 'active')}>
                    Wieder aktivieren
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <Modal
        open={addOpen}
        onClose={saving ? () => {} : () => setAddOpen(false)}
        title="Leistung hinzufügen"
        description="Für Leistungen mit Onboarding wird der Workspace sofort aus der aktuellen Vorlage angelegt."
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddOpen(false)} disabled={saving}>Abbrechen</Button>
            <Button onClick={() => void confirmAdd()} loading={saving} disabled={pending.length === 0}>
              {pending.length > 1 ? `${pending.length} Leistungen hinzufügen` : 'Leistung hinzufügen'}
            </Button>
          </>
        }
      >
        <div className="grid gap-2">
          {available.map((service) => {
            const Icon = service.icon;
            return (
              <SelectCard
                key={service.key}
                selected={pending.includes(service.key)}
                onToggle={() => setPending((p) => p.includes(service.key) ? p.filter((k) => k !== service.key) : [...p, service.key])}
                icon={<Icon size={15} />}
                title={service.name}
                description={service.description}
                badge={service.hasOnboarding ? <StatusBadge label="Onboarding" tone="info" /> : undefined}
              />
            );
          })}
        </div>
      </Modal>

      <ConfirmDialog
        open={archiveTarget !== null}
        onClose={() => setArchiveTarget(null)}
        onConfirm={() => { if (archiveTarget) void changeState(archiveTarget, 'archived'); }}
        title="Leistung archivieren"
        confirmLabel="Leistung archivieren"
        message={
          <>
            <p>
              <span className="font-semibold text-[var(--cq-fg)]">
                {archiveTarget ? SERVICE_BY_KEY[archiveTarget.service_key].name : ''}
              </span>{' '}
              wird aus der aktiven Leistungsübersicht dieses Kunden ausgeblendet.
            </p>
            <p className="mt-2">
              Nichts wird gelöscht: der Onboarding-Fortschritt, alle Nachweise, Notizen und die
              gesamte Historie bleiben erhalten und sind nach einer Reaktivierung unverändert da.
            </p>
          </>
        }
      />
    </Card>
  );
}

function ServiceRow({ customerId, service, onPause, onResume, onArchive }: {
  customerId: string;
  service: CustomerServiceSummary;
  onPause: () => void;
  onResume: () => void;
  onArchive: () => void;
}) {
  const definition = SERVICE_BY_KEY[service.service_key];
  const Icon = definition.icon;
  const engagement = service.engagement;
  const percent = engagement && engagement.task_total > 0
    ? Math.round((engagement.task_done / engagement.task_total) * 100)
    : null;
  const blockers = engagement?.blocker_count ?? 0;
  const href = `/admin/finance/customers/${customerId}/services/${service.service_key}`;

  return (
    <div className={cn('flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center', surface.card, radius.lg)}>
      <Link
        to={href}
        className={cn('flex min-w-0 flex-1 items-center gap-3', radius.md, focusRing, interactive.transition, 'group')}
      >
        <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center bg-[var(--cq-sunken)] text-[var(--cq-fg-muted)]', border.hairline, radius.md)} aria-hidden="true">
          <Icon size={16} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-1.5">
            <span className={cn(text.bodyStrong, 'group-hover:underline')}>{definition.name}</span>
            {service.state !== 'active'
              ? <StatusBadge label={serviceStateLabel[service.state]} tone={serviceStateTone[service.state]} />
              : null}
            {engagement
              ? <StatusBadge label={engagementStatusLabel[engagement.lifecycle_status]} tone={engagementStatusTone[engagement.lifecycle_status]} />
              : null}
            {blockers > 0
              ? <StatusBadge label={`${blockers} Blocker`} tone="danger" />
              : engagement && percent === 100
                ? <StatusBadge label="Bereit" tone="success" />
                : null}
          </span>
          {engagement ? (
            <span className="mt-1.5 flex items-center gap-2.5">
              <Meter
                percent={percent}
                tone={blockers > 0 ? 'blocked' : percent === 100 ? 'complete' : 'progress'}
                className="max-w-[220px]"
              />
              <span className={cn('shrink-0 tabular-nums', text.body)}>
                {percent === null ? 'Noch keine Schritte' : `${percent}% · ${engagement.task_done}/${engagement.task_total} Schritte`}
              </span>
            </span>
          ) : (
            <span className={cn('mt-0.5 block', text.body)}>
              Kein Onboarding-Workspace — für diese Leistung gibt es noch keine Vorlage.
            </span>
          )}
        </span>
        <ChevronRight size={16} className="hidden shrink-0 text-[var(--cq-fg-subtle)] sm:block" aria-hidden="true" />
      </Link>
      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:pl-3">
        {service.state === 'active'
          ? <Button size="sm" variant="ghost" onClick={onPause}>Pausieren</Button>
          : <Button size="sm" variant="ghost" onClick={onResume}>Fortsetzen</Button>}
        <Button size="sm" variant="ghost" onClick={onArchive}>Archivieren</Button>
        <Link
          to={href}
          className={cn(
            'inline-flex h-8 items-center gap-1.5 px-2.5 text-[12.5px] font-medium text-[var(--cq-fg)]',
            'bg-[var(--cq-surface)]', border.hairline, radius.md, interactive.transition, focusRing,
            'hover:border-[var(--cq-border-strong)] hover:bg-[var(--cq-hover)]',
          )}
        >
          <LayoutGrid size={14} aria-hidden="true" />
          Öffnen
        </Link>
      </div>
    </div>
  );
}

export default CustomerServicesPanel;
