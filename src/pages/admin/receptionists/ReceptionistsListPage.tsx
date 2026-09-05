import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Plus } from 'lucide-react';

import {
  Button, DataTable, EmptyState, ErrorState, Modal, Select, StatBand, StatusBadge, TableSkeleton, WorkspaceHeader, Field, useToast, type Column, type StatItem,
} from '@/components/dashboard';
import { adminAction, listOrganizations, listReceptionists, type OrganizationOption, type ReceptionistListRow } from '@/lib/goldenAgent/dashboard/receptionistApi';
import { STAGE_LABEL, STAGE_TONE, formatDateTimeDe } from './receptionistLabels';

/**
 * AI Receptionists — every customer's Golden Agent instance in one list, with its stage, the
 * provider agent it maps to, and whether the last sync succeeded. Creating one only needs a tenant
 * and a name: the default ClientConfig is generated server-side and completed on the detail page.
 */
export function ReceptionistsListPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [rows, setRows] = useState<ReceptionistListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const [organizationId, setOrganizationId] = useState('');
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await listReceptionists());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Laden fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const openCreate = useCallback(async () => {
    setCreateOpen(true);
    try {
      const orgs = await listOrganizations();
      setOrganizations(orgs);
      if (!organizationId && orgs[0]) setOrganizationId(orgs[0].id);
    } catch (e) {
      toast.error('Organisationen konnten nicht geladen werden', e instanceof Error ? e.message : undefined);
    }
  }, [organizationId, toast]);

  const create = useCallback(async () => {
    if (!organizationId || name.trim().length < 2) return;
    setCreating(true);
    try {
      const result = await adminAction({ action: 'create', organizationId, name: name.trim() });
      toast.success('AI Receptionist angelegt', 'Konfiguration jetzt vervollständigen.');
      setCreateOpen(false);
      navigate(`/admin/receptionists/${String(result.receptionistId)}`);
    } catch (e) {
      toast.error('Anlegen fehlgeschlagen', e instanceof Error ? e.message : undefined);
    } finally {
      setCreating(false);
    }
  }, [name, navigate, organizationId, toast]);

  const stats: StatItem[] = [
    { key: 'total', label: 'Gesamt', value: String(rows.length) },
    { key: 'live', label: 'Live', value: String(rows.filter((r) => r.stage === 'live').length) },
    { key: 'eval', label: 'In Evaluation', value: String(rows.filter((r) => r.stage === 'evaluation' || r.stage === 'dev').length) },
    { key: 'errors', label: 'Sync-Fehler', value: String(rows.filter((r) => r.last_sync_error).length) },
  ];

  const columns: Column<ReceptionistListRow>[] = [
    { key: 'name', header: 'Receptionist', render: (r) => <span className="font-medium">{r.name}</span>, sortValue: (r) => r.name },
    { key: 'org', header: 'Kunde', render: (r) => r.organization_name ?? r.organization_id.slice(0, 8), sortValue: (r) => r.organization_name ?? '' },
    { key: 'stage', header: 'Stage', render: (r) => <StatusBadge label={STAGE_LABEL[r.stage]} tone={STAGE_TONE[r.stage]} />, sortValue: (r) => r.stage },
    { key: 'agent', header: 'ElevenLabs Agent', render: (r) => (r.provider_agent_id ? <code className="text-[12px]">{r.provider_agent_id}</code> : <span className="text-[var(--cq-fg-muted)]">nicht provisioniert</span>), hideOnMobile: true },
    { key: 'config', header: 'Config', render: (r) => `v${r.config_version}${r.prompt_version ? ` · Prompt ${r.prompt_version}` : ''}`, hideOnMobile: true },
    { key: 'sync', header: 'Letzter Sync', render: (r) => (r.last_sync_error ? <StatusBadge label="Fehler" tone="danger" /> : formatDateTimeDe(r.last_synced_at)), sortValue: (r) => r.last_synced_at ?? '', hideOnMobile: true },
  ];

  return (
    <div>
      <WorkspaceHeader
        eyebrow="Produkte"
        title="AI Receptionists"
        subtitle="Golden-Agent-Instanzen pro Kunde: Konfiguration, ElevenLabs-Agent, Tools, Evaluation und Anrufe."
        actions={<Button icon={Plus} onClick={() => { void openCreate(); }}>Create AI Receptionist</Button>}
      />
      <div className="space-y-5">
        <StatBand items={stats} />
        {loading ? <TableSkeleton rows={4} cols={5} /> : error ? <ErrorState message={error} onRetry={() => { void load(); }} /> : rows.length === 0 ? (
          <EmptyState icon={Bot} title="Noch kein AI Receptionist" description="Lege den ersten Receptionist an. Die Konfiguration entsteht Schritt für Schritt: Standorte, Leistungen, Öffnungszeiten, Wissen, Integration." action={<Button icon={Plus} onClick={() => { void openCreate(); }}>Create AI Receptionist</Button>} />
        ) : (
          <DataTable columns={columns} rows={rows} getRowKey={(r) => r.id} mobileTitle={(r) => r.name} mobileSubtitle={(r) => r.organization_name ?? ''} rowHref={(r) => `/admin/receptionists/${r.id}`} />
        )}
      </div>
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="AI Receptionist anlegen" description="Wähle den Kunden (Login-Mandant) und gib dem Receptionist einen Namen. Alles Weitere wird auf der Detailseite konfiguriert."
        footer={<><Button variant="ghost" onClick={() => setCreateOpen(false)}>Abbrechen</Button><Button onClick={() => { void create(); }} loading={creating} disabled={!organizationId || name.trim().length < 2}>Anlegen</Button></>}>
        <div className="space-y-4">
          <Select id="rcp-org" label="Kunde / Organisation" value={organizationId} onChange={setOrganizationId} options={organizations.map((o) => ({ value: o.id, label: o.name }))} required />
          <Field id="rcp-name" label="Name" value={name} onChange={setName} placeholder="z. B. Haema Leipzig" required hint="Wird als Firmenname in der Konfiguration vorbelegt." />
        </div>
      </Modal>
    </div>
  );
}
