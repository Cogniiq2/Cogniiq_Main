import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Bot, RefreshCw } from 'lucide-react';

import {
  Button, DefinitionGrid, EmptyState, ErrorState, InfoBanner, Panel, Select, StatusBadge, Tabs, Textarea, TableSkeleton, WorkspaceHeader, useToast,
} from '@/components/dashboard';
import {
  TOOL_DEFINITIONS, TOOL_NAMES, buildKnowledgeDocuments, composeGoldenAgentPrompt, findKnowledgeGaps, validateClientConfig, generateCustomerScenarios,
  type ClientConfig, type ConfigIssue, type DeploymentStage, type KnowledgeGap,
} from '@/lib/goldenAgent';
import {
  adminAction, getReceptionist, listCallEvents, listCalls, listConfigVersions, listEvaluationResults, listEvaluationRuns,
  type CallEventRow, type CallRow, type ConfigVersionRow, type EvaluationResultRow, type EvaluationRunRow, type ReceptionistDetail,
} from '@/lib/goldenAgent/dashboard/receptionistApi';
import { OUTCOME_LABEL, STAGE_LABEL, STAGE_OPTIONS, STAGE_TONE, formatDateTimeDe } from './receptionistLabels';

const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'configuration', label: 'Configuration' },
  { value: 'agent', label: 'Agent' },
  { value: 'knowledge', label: 'Knowledge' },
  { value: 'tools', label: 'Tools' },
  { value: 'evaluations', label: 'Evaluations' },
  { value: 'calls', label: 'Calls' },
  { value: 'settings', label: 'Settings' },
] as const;

type TabKey = (typeof TABS)[number]['value'];

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : 'Unbekannter Fehler';
}

function GapList({ gaps }: { gaps: KnowledgeGap[] }) {
  if (gaps.length === 0) return <p className="text-[13px] text-emerald-700">Keine offenen Onboarding-Punkte.</p>;
  return (
    <ul className="space-y-1.5">
      {gaps.map((gap) => (
        <li key={`${gap.area}-${gap.message}`} className="flex items-start gap-2 text-[13px]">
          <StatusBadge label={gap.severity === 'blocker' ? 'Blocker' : 'Hinweis'} tone={gap.severity === 'blocker' ? 'danger' : 'warning'} />
          <span><span className="text-[var(--cq-fg-muted)]">{gap.area}</span> · {gap.message}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * One receptionist, eight sections. Functional first: every section is backed by real data and
 * real actions (receptionist-admin), visual polish is deliberately minimal.
 */
export function ReceptionistDetailPage() {
  const { receptionistId = '' } = useParams();
  const [tab, setTab] = useState<TabKey>('overview');
  const [detail, setDetail] = useState<ReceptionistDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setDetail(await getReceptionist(receptionistId));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [receptionistId]);

  useEffect(() => { void load(); }, [load]);

  const validation = useMemo(() => (detail ? validateClientConfig(detail.client_config) : null), [detail]);
  const config = validation?.config ?? null;
  const gaps = useMemo(() => (config ? findKnowledgeGaps(config) : []), [config]);

  if (loading) return <TableSkeleton rows={6} cols={3} />;
  if (error) return <ErrorState message={error} onRetry={() => { void load(); }} />;
  if (!detail) return <EmptyState icon={Bot} title="Receptionist nicht gefunden" description="Der Datensatz existiert nicht oder du hast keinen Zugriff." action={<Link to="/admin/receptionists" className="underline">Zur Übersicht</Link>} />;

  return (
    <div>
      <WorkspaceHeader
        leading={<Link to="/admin/receptionists" className="inline-flex items-center gap-1 text-[12.5px] text-[var(--cq-fg-muted)] hover:text-[var(--cq-fg)]"><ArrowLeft size={14} /> AI Receptionists</Link>}
        title={detail.name}
        subtitle={detail.organization_name ?? detail.organization_id}
        status={<StatusBadge label={STAGE_LABEL[detail.stage]} tone={STAGE_TONE[detail.stage]} />}
        actions={<Button variant="ghost" icon={RefreshCw} onClick={() => { void load(); }}>Neu laden</Button>}
        toolbar={<Tabs tabs={TABS.map((t) => ({ value: t.value, label: t.label }))} value={tab} onChange={(v) => setTab(v as TabKey)} />}
      />
      {!config && validation ? (
        <div className="mb-5">
          <InfoBanner tone="warning" title="Die gespeicherte Konfiguration ist unvollständig oder ungültig.">
            {validation.issues.filter((i) => i.severity === 'error').length} Fehler. Öffne den Tab Configuration, um sie zu beheben. Bis dahin sind Provisionierung und Evaluation gesperrt.
          </InfoBanner>
        </div>
      ) : null}
      {tab === 'overview' ? <OverviewTab detail={detail} config={config} gaps={gaps} /> : null}
      {tab === 'configuration' ? <ConfigurationTab detail={detail} onSaved={load} /> : null}
      {tab === 'agent' ? <AgentTab detail={detail} config={config} onChanged={load} /> : null}
      {tab === 'knowledge' ? <KnowledgeTab config={config} gaps={gaps} /> : null}
      {tab === 'tools' ? <ToolsTab detail={detail} config={config} /> : null}
      {tab === 'evaluations' ? <EvaluationsTab detail={detail} config={config} /> : null}
      {tab === 'calls' ? <CallsTab detail={detail} /> : null}
      {tab === 'settings' ? <SettingsTab detail={detail} onChanged={load} /> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ Overview */

function OverviewTab({ detail, config, gaps }: { detail: ReceptionistDetail; config: ClientConfig | null; gaps: KnowledgeGap[] }) {
  const prompt = useMemo(() => (config ? composeGoldenAgentPrompt(config) : null), [config]);
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel title="Status">
        <DefinitionGrid columns={2} items={[
          { label: 'Stage', value: STAGE_LABEL[detail.stage] },
          { label: 'ElevenLabs Agent', value: detail.provider_agent_id ? <code className="text-[12px]">{detail.provider_agent_id}</code> : 'nicht provisioniert' },
          { label: 'Config-Version', value: `v${detail.config_version}` },
          { label: 'Prompt-Version', value: detail.prompt_version ?? '—' },
          { label: 'Letzter Sync', value: formatDateTimeDe(detail.last_synced_at) },
          { label: 'Sync-Fehler', value: detail.last_sync_error ?? 'keiner' },
          { label: 'Buchungsanbindung', value: config?.bookingIntegration.provider ?? '—' },
          { label: 'Sprachen', value: config ? [config.primaryLanguage, ...config.additionalLanguages].join(', ') : '—' },
        ]} />
      </Panel>
      <Panel title="Onboarding-Status" description="Was fehlt, bevor der Agent DEV verlassen darf.">
        <GapList gaps={gaps} />
      </Panel>
      <Panel title="Konfigurierte Fakten">
        <DefinitionGrid columns={2} items={[
          { label: 'Standorte', value: config ? `${config.locations.length} (${config.locations.map((l) => l.name).join(', ') || '—'})` : '—' },
          { label: 'Leistungen', value: config ? `${config.services.length} (${config.services.filter((s) => s.bookable).length} buchbar)` : '—' },
          { label: 'FAQs', value: config ? String(config.faqs.length) : '—' },
          { label: 'Eskalationskontakte', value: config ? String(config.escalationContacts.length) : '—' },
          { label: 'Wissensquellen', value: config ? `${config.knowledgeSources.length} (${config.knowledgeSources.filter((s) => s.reviewed).length} freigegeben)` : '—' },
          { label: 'Prompt-Länge', value: prompt ? `${prompt.length.toLocaleString('de-DE')} Zeichen` : '—' },
        ]} />
      </Panel>
      <Panel title="Onboarding-Ablauf" description="Die Reihenfolge, in der ein Kunde live geht.">
        <ol className="list-decimal space-y-1 pl-5 text-[13px]">
          <li>Kunde anlegen (erledigt)</li>
          <li>Configuration: Firma, Standorte, Leistungen, Öffnungszeiten, Regeln, FAQs, Eskalation</li>
          <li>Knowledge: Quellen eintragen und freigeben</li>
          <li>Configuration: Buchungsanbindung wählen (mock → n8n_webhook)</li>
          <li>Agent: Plan prüfen, provisionieren (DEV)</li>
          <li>Evaluations: Offline-Suite, dann ElevenLabs-Simulation</li>
          <li>Fehler beheben, erneut provisionieren</li>
          <li>Settings: Stage auf STAGING/LIVE (nur nach Freigabe; Telefonnummer manuell)</li>
        </ol>
      </Panel>
    </div>
  );
}

/* ------------------------------------------------------------------ Configuration */

function ConfigurationTab({ detail, onSaved }: { detail: ReceptionistDetail; onSaved: () => Promise<void> }) {
  const toast = useToast();
  const [text, setText] = useState(() => JSON.stringify(detail.client_config, null, 2));
  const [note, setNote] = useState('');
  const [issues, setIssues] = useState<ConfigIssue[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [versions, setVersions] = useState<ConfigVersionRow[]>([]);

  useEffect(() => { listConfigVersions(detail.id).then(setVersions).catch(() => setVersions([])); }, [detail.id]);

  const validate = useCallback((): ClientConfig | null => {
    try {
      const parsed = JSON.parse(text) as unknown;
      setParseError(null);
      const result = validateClientConfig(parsed);
      setIssues(result.issues);
      return result.config;
    } catch (e) {
      setParseError(errorMessage(e));
      return null;
    }
  }, [text]);

  const save = useCallback(async () => {
    const config = validate();
    if (!config) { toast.error('Konfiguration ungültig', 'Bitte zuerst die Fehler beheben.'); return; }
    setSaving(true);
    try {
      const result = await adminAction({ action: 'save_config', receptionistId: detail.id, clientConfig: config, note: note || undefined });
      toast.success(`Konfiguration gespeichert (v${String(result.configVersion)})`);
      setNote('');
      await onSaved();
    } catch (e) {
      toast.error('Speichern fehlgeschlagen', errorMessage(e));
    } finally {
      setSaving(false);
    }
  }, [detail.id, note, onSaved, toast, validate]);

  const errors = issues.filter((i) => i.severity === 'error');
  return (
    <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
      <Panel title="ClientConfig (JSON)" description="Die vollständige Kundenkonfiguration. Kundenspezifisches gehört nur hierher, nie in den Golden-Agent-Code." action={<div className="flex gap-2"><Button variant="ghost" onClick={validate}>Prüfen</Button><Button onClick={() => { void save(); }} loading={saving}>Speichern</Button></div>}>
        <textarea className="h-[560px] w-full rounded-md border border-[var(--cq-border)] bg-[var(--cq-sunken)] p-3 font-mono text-[12px] leading-5" value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} aria-label="ClientConfig JSON" />
        <div className="mt-3">
          <Textarea id="cfg-note" label="Änderungsnotiz (optional)" value={note} onChange={setNote} rows={2} />
        </div>
      </Panel>
      <div className="space-y-5">
        <Panel title="Prüfergebnis">
          {parseError ? <p className="text-[13px] text-red-700">JSON-Fehler: {parseError}</p> : null}
          {!parseError && issues.length === 0 ? <p className="text-[13px] text-[var(--cq-fg-muted)]">Noch nicht geprüft oder keine Befunde.</p> : null}
          {issues.length > 0 ? (
            <ul className="space-y-1 text-[12.5px]">
              {issues.map((issue) => (
                <li key={`${issue.path}-${issue.message}`}>
                  <StatusBadge label={issue.severity === 'error' ? 'Fehler' : 'Hinweis'} tone={issue.severity === 'error' ? 'danger' : 'warning'} /> <code>{issue.path || '(root)'}</code> · {issue.message}
                </li>
              ))}
            </ul>
          ) : null}
          {issues.length > 0 && errors.length === 0 ? <p className="mt-2 text-[13px] text-emerald-700">Gültig.</p> : null}
        </Panel>
        <Panel title="Versionen" count={versions.length}>
          {versions.length === 0 ? <p className="text-[13px] text-[var(--cq-fg-muted)]">Noch keine gespeicherte Version.</p> : (
            <ul className="space-y-1 text-[12.5px]">
              {versions.map((v) => <li key={v.id}>v{v.version} · {formatDateTimeDe(v.created_at)}{v.note ? ` · ${v.note}` : ''}</li>)}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Agent */

function AgentTab({ detail, config, onChanged }: { detail: ReceptionistDetail; config: ClientConfig | null; onChanged: () => Promise<void> }) {
  const toast = useToast();
  const [plan, setPlan] = useState<Record<string, unknown> | null>(null);
  const [status, setStatus] = useState<Record<string, unknown> | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  const run = useCallback(async (label: string, body: Record<string, unknown>, after?: (result: Record<string, unknown>) => void) => {
    setBusy(label);
    try {
      const result = await adminAction({ ...body, receptionistId: detail.id });
      after?.(result);
    } catch (e) {
      toast.error(`${label} fehlgeschlagen`, errorMessage(e));
    } finally {
      setBusy(null);
    }
  }, [detail.id, toast]);

  const provisionLabel = detail.provider_agent_id ? 'Agent synchronisieren' : 'Agent erstellen (DEV)';
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel title="Provisionierung" description="Cogniiq Dashboard → Cogniiq Backend → ElevenLabs API. Kein Claude zur Laufzeit.">
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => { void run('Plan', { action: 'plan' }, (r) => setPlan(r.plan as Record<string, unknown>)); }} loading={busy === 'Plan'} disabled={!config}>Plan anzeigen</Button>
          <Button onClick={() => { void run('Provisionierung', { action: 'provision', allowLiveChanges: detail.stage === 'live' ? window.confirm('Dieser Agent ist LIVE. Änderungen wirklich anwenden?') : false }, (r) => { if (typeof r.newToolToken === 'string') setNewToken(r.newToolToken); toast.success('Agent provisioniert', `${(r.created as string[]).length} erstellt, ${(r.updated as string[]).length} aktualisiert`); void onChanged(); }); }} loading={busy === 'Provisionierung'} disabled={!config}>{provisionLabel}</Button>
          <Button variant="ghost" onClick={() => { void run('Status', { action: 'status' }, setStatus); }} loading={busy === 'Status'} disabled={!detail.provider_agent_id}>Status aus ElevenLabs lesen</Button>
        </div>
        {newToken ? (
          <div className="mt-4">
            <InfoBanner tone="warning" title="Neues Tool-Token (wird nur einmal angezeigt)">
              Es ist bereits als Workspace-Secret in ElevenLabs hinterlegt und in den Tools referenziert. Notiere es nur, wenn du die Tools manuell testen willst.
              <pre className="mt-2 overflow-x-auto rounded bg-[var(--cq-sunken)] p-2 text-[11px]">{newToken}</pre>
            </InfoBanner>
          </div>
        ) : null}
        {plan ? (
          <div className="mt-4 space-y-2 text-[13px]">
            <DefinitionGrid columns={2} items={[
              { label: 'Agent-Name', value: String(plan.agentName) },
              { label: 'Stage', value: String(plan.stage) },
              { label: 'Prompt', value: `${String(plan.promptVersion)} · ${Number(plan.promptLength).toLocaleString('de-DE')} Zeichen` },
              { label: 'Schritte', value: String((plan.steps as string[]).length) },
            ]} />
            {(plan.warnings as string[]).length ? <ul className="list-disc pl-5 text-amber-700">{(plan.warnings as string[]).map((w) => <li key={w}>{w}</li>)}</ul> : null}
            <details><summary className="cursor-pointer">Schritte</summary><ul className="mt-1 list-disc pl-5 text-[12px]">{(plan.steps as string[]).map((s) => <li key={s}>{s}</li>)}</ul></details>
            <button type="button" className="text-[12.5px] underline" onClick={() => setShowPrompt((v) => !v)}>{showPrompt ? 'System-Prompt ausblenden' : 'System-Prompt anzeigen'}</button>
            {showPrompt ? <pre className="max-h-[480px] overflow-auto whitespace-pre-wrap rounded bg-[var(--cq-sunken)] p-3 text-[11.5px]">{String(plan.systemPrompt)}</pre> : null}
          </div>
        ) : null}
      </Panel>
      <Panel title="Live-Status in ElevenLabs">
        {!detail.provider_agent_id ? <p className="text-[13px] text-[var(--cq-fg-muted)]">Noch kein Agent. Erst den Plan prüfen, dann provisionieren.</p> : status ? (
          <DefinitionGrid columns={1} items={[
            { label: 'Agent-ID', value: <code className="text-[12px]">{String(status.agentId)}</code> },
            { label: 'Name', value: String((status.snapshot as Record<string, unknown>)?.name ?? '—') },
            { label: 'LLM / Stimme', value: `${String((status.snapshot as Record<string, unknown>)?.llm ?? '—')} · ${String((status.snapshot as Record<string, unknown>)?.voice_id ?? '—')}` },
            { label: 'Tools verknüpft', value: String(((status.snapshot as Record<string, unknown>)?.tool_ids as string[] | undefined)?.length ?? 0) },
            { label: 'Wissensdokumente', value: String(((status.snapshot as Record<string, unknown>)?.knowledge_base as unknown[] | undefined)?.length ?? 0) },
            { label: 'Telefonnummern', value: (status.phoneNumbers as string[]).length ? (status.phoneNumbers as string[]).join(', ') : 'keine (wird manuell zugewiesen)' },
            { label: 'Tool-Drift', value: (status.toolDrift as string[]).length ? <span className="text-red-700">{(status.toolDrift as string[]).length} Tools fehlen am Agenten</span> : 'keine' },
          ]} />
        ) : <p className="text-[13px] text-[var(--cq-fg-muted)]">„Status aus ElevenLabs lesen“ holt die aktuelle Konfiguration.</p>}
      </Panel>
    </div>
  );
}

/* ------------------------------------------------------------------ Knowledge */

function KnowledgeTab({ config, gaps }: { config: ClientConfig | null; gaps: KnowledgeGap[] }) {
  const documents = useMemo(() => (config ? buildKnowledgeDocuments(config) : []), [config]);
  if (!config) return <EmptyState icon={Bot} title="Konfiguration ungültig" description="Wissen wird aus der gültigen Konfiguration abgeleitet." />;
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel title="Wissensquellen" count={config.knowledgeSources.length} description="Website, FAQ, Dokumente, Text. Nur freigegebene Quellen erreichen den Agenten.">
        {config.knowledgeSources.length === 0 ? <p className="text-[13px] text-[var(--cq-fg-muted)]">Keine Quellen. In der Configuration unter knowledgeSources eintragen.</p> : (
          <ul className="space-y-1.5 text-[13px]">
            {config.knowledgeSources.map((s) => <li key={s.id} className="flex items-center gap-2"><StatusBadge label={s.reviewed ? 'freigegeben' : 'Review offen'} tone={s.reviewed ? 'success' : 'warning'} /><span>{s.name} <span className="text-[var(--cq-fg-muted)]">({s.kind}{s.url ? ` · ${s.url}` : ''})</span></span></li>)}
          </ul>
        )}
      </Panel>
      <Panel title="Wissensklassen" description="Woher eine Antwort kommen darf.">
        <DefinitionGrid columns={1} items={[
          { label: 'Konfiguriert (Prompt)', value: `${config.locations.length} Standorte, ${config.services.length} Leistungen, ${config.faqs.length} FAQs` },
          { label: 'Wissensdatenbank', value: `${config.knowledgeSources.filter((s) => s.reviewed).length} freigegebene Quellen + ${documents.length} generierte Dokumente` },
          { label: 'Nur per Tool', value: 'freie Termine, bestehende Termine, Buchungen' },
          { label: 'Immer eskalieren', value: (config.alwaysEscalateTopics ?? []).join(', ') || 'nur universelle Themen (medizinisch, Beschwerde, Abrechnung, Datenschutz)' },
          { label: 'Unbekannt', value: 'Agent sagt ehrlich "weiß ich nicht" und bietet Rückruf an' },
        ]} />
      </Panel>
      <Panel title="Generierte Wissensdokumente" count={documents.length} description="Werden bei der Provisionierung in die ElevenLabs-Wissensdatenbank geschrieben.">
        {documents.map((doc) => <details key={doc.key} className="mb-2"><summary className="cursor-pointer text-[13px] font-medium">{doc.name}</summary><pre className="mt-1 max-h-72 overflow-auto whitespace-pre-wrap rounded bg-[var(--cq-sunken)] p-2 text-[11.5px]">{doc.text}</pre></details>)}
      </Panel>
      <Panel title="Onboarding-Lücken"><GapList gaps={gaps} /></Panel>
    </div>
  );
}

/* ------------------------------------------------------------------ Tools */

function ToolsTab({ detail, config }: { detail: ReceptionistDetail; config: ClientConfig | null }) {
  const state = detail.provider_state as { toolIds?: Record<string, string>; toolSecretIds?: Record<string, string> };
  return (
    <div className="space-y-5">
      <Panel title="Buchungsanbindung" description="Golden Agent → generisches Tool → Kunden-Adapter → Kundensystem.">
        <DefinitionGrid columns={2} items={[
          { label: 'Provider', value: config?.bookingIntegration.provider ?? '—' },
          { label: 'n8n Basis-URL', value: config?.bookingIntegration.baseUrl ?? '—' },
          { label: 'Secret (Env-Var-Name)', value: config?.bookingIntegration.secretEnvVar ?? '—' },
          { label: 'Tool-Secret in ElevenLabs', value: state.toolSecretIds ? Object.entries(state.toolSecretIds).map(([env, id]) => `${env}: ${id}`).join(', ') : 'noch nicht erzeugt' },
        ]} />
      </Panel>
      <Panel title="Universelle Tool-Verträge" count={TOOL_NAMES.length} flush>
        <table className="w-full text-[12.5px]">
          <thead><tr className="text-left text-[var(--cq-fg-muted)]"><th className="p-2">Tool</th><th className="p-2">Klasse</th><th className="p-2">Bestätigung</th><th className="p-2">Idempotent</th><th className="p-2">ElevenLabs-ID</th></tr></thead>
          <tbody>
            {TOOL_NAMES.map((name) => {
              const def = TOOL_DEFINITIONS[name];
              return (
                <tr key={name} className="border-t border-[var(--cq-border)]">
                  <td className="p-2 font-mono">{name}</td>
                  <td className="p-2">{def.class}</td>
                  <td className="p-2">{def.requiresConfirmation ? 'ja' : '—'}</td>
                  <td className="p-2">{def.idempotent ? 'ja' : '—'}</td>
                  <td className="p-2 font-mono text-[11px]">{state.toolIds?.[name] ?? '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}

/* ------------------------------------------------------------------ Evaluations */

function EvaluationsTab({ detail, config }: { detail: ReceptionistDetail; config: ClientConfig | null }) {
  const toast = useToast();
  const [runs, setRuns] = useState<EvaluationRunRow[]>([]);
  const [selected, setSelected] = useState<EvaluationRunRow | null>(null);
  const [results, setResults] = useState<EvaluationResultRow[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const scenarioCount = useMemo(() => (config ? generateCustomerScenarios(config).length : 0), [config]);

  const loadRuns = useCallback(async () => {
    try { setRuns(await listEvaluationRuns(detail.id)); } catch (e) { toast.error('Läufe konnten nicht geladen werden', errorMessage(e)); }
  }, [detail.id, toast]);
  useEffect(() => { void loadRuns(); }, [loadRuns]);
  useEffect(() => {
    if (!selected) { setResults([]); return; }
    listEvaluationResults(selected.id).then(setResults).catch((e) => toast.error('Ergebnisse konnten nicht geladen werden', errorMessage(e)));
  }, [selected, toast]);

  const act = useCallback(async (label: string, body: Record<string, unknown>) => {
    setBusy(label);
    try {
      const result = await adminAction({ ...body, receptionistId: detail.id });
      const summary = result.summary as { passed?: number; total?: number } | undefined;
      toast.success(`${label} abgeschlossen`, summary ? `${summary.passed}/${summary.total} bestanden` : typeof result.status === 'string' ? `Status: ${result.status}` : undefined);
      await loadRuns();
    } catch (e) {
      toast.error(`${label} fehlgeschlagen`, errorMessage(e));
    } finally {
      setBusy(null);
    }
  }, [detail.id, loadRuns, toast]);

  const failures = results.filter((r) => !r.passed);
  return (
    <div className="space-y-5">
      <Panel title="Evaluation starten" description={`Generierte Suite für diesen Kunden: ${scenarioCount} Szenarien. Offline prüft Tool-Verträge und Regeln deterministisch; die ElevenLabs-Simulation lässt ein LLM den Anrufer spielen.`}>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => { void act('Offline-Evaluation', { action: 'run_offline_evaluation' }); }} loading={busy === 'Offline-Evaluation'} disabled={!config}>Offline-Suite ausführen</Button>
          <Button variant="secondary" onClick={() => { void act('Simulationstests anlegen', { action: 'create_simulation_tests' }); }} loading={busy === 'Simulationstests anlegen'} disabled={!detail.provider_agent_id}>ElevenLabs-Tests anlegen</Button>
          <Button variant="secondary" onClick={() => { void act('Simulation starten', { action: 'run_simulation_tests' }); }} loading={busy === 'Simulation starten'} disabled={!detail.provider_agent_id}>ElevenLabs-Simulation starten</Button>
        </div>
      </Panel>
      <div className="grid gap-5 lg:grid-cols-[1fr_2fr]">
        <Panel title="Läufe" count={runs.length} flush>
          {runs.length === 0 ? <p className="p-4 text-[13px] text-[var(--cq-fg-muted)]">Noch kein Lauf.</p> : (
            <ul>
              {runs.map((run) => (
                <li key={run.id}>
                  <button type="button" onClick={() => setSelected(run)} className={`w-full border-t border-[var(--cq-border)] p-3 text-left text-[12.5px] hover:bg-[var(--cq-hover)] ${selected?.id === run.id ? 'bg-[var(--cq-sunken)]' : ''}`}>
                    <div className="flex items-center justify-between gap-2"><span className="font-medium">{run.mode}</span><StatusBadge label={run.status} tone={run.status === 'completed' ? (run.failed === 0 ? 'success' : 'warning') : run.status === 'failed' ? 'danger' : 'info'} /></div>
                    <div className="text-[var(--cq-fg-muted)]">{formatDateTimeDe(run.created_at)} · {run.passed}/{run.total} bestanden · Config v{run.config_version ?? '?'}</div>
                    {run.status === 'running' && run.mode === 'elevenlabs_simulation' && run.provider_invocation_id ? (
                      <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); void act('Ergebnisse abrufen', { action: 'fetch_simulation_results', runId: run.id, invocationId: run.provider_invocation_id }); }}>Ergebnisse abrufen</Button>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title={selected ? `Ergebnisse · ${selected.mode}` : 'Ergebnisse'} description={selected ? `${failures.length} Fehlschläge, ${results.length - failures.length} bestanden. Jede Dimension einzeln, nichts hinter einer Gesamtnote versteckt.` : 'Lauf links auswählen.'}>
          {selected?.summary?.byDimension ? (
            <div className="mb-3 grid grid-cols-3 gap-2 text-[12px]">
              {Object.entries(selected.summary.byDimension).map(([dim, stats]) => <div key={dim} className="rounded border border-[var(--cq-border)] p-2"><div className="text-[var(--cq-fg-muted)]">{dim}</div><div className="font-semibold">{stats.passed}/{stats.applicable}</div></div>)}
            </div>
          ) : null}
          {results.length === 0 ? null : (
            <ul className="space-y-1.5">
              {[...failures, ...results.filter((r) => r.passed)].map((r) => (
                <li key={r.id} className="rounded border border-[var(--cq-border)] p-2 text-[12.5px]">
                  <button type="button" className="flex w-full items-center justify-between gap-2 text-left" onClick={() => setOpen(open === r.id ? null : r.id)}>
                    <span><StatusBadge label={r.passed ? 'OK' : 'FAIL'} tone={r.passed ? 'success' : 'danger'} /> <span className="ml-1 text-[var(--cq-fg-muted)]">{r.category}</span> · {r.title}</span>
                    <span className="text-[var(--cq-fg-muted)]">{OUTCOME_LABEL[r.outcome ?? 'unknown'] ?? r.outcome}</span>
                  </button>
                  {open === r.id ? (
                    <div className="mt-2 space-y-2">
                      {r.findings.filter((f) => f.severity !== 'info').length ? <ul className="list-disc pl-5">{r.findings.filter((f) => f.severity !== 'info').map((f, i) => <li key={i} className={f.severity === 'fail' ? 'text-red-700' : 'text-amber-700'}>[{f.dimension}] {f.message}{f.turn !== undefined ? ` (Turn ${f.turn})` : ''}</li>)}</ul> : <p className="text-emerald-700">Keine Befunde.</p>}
                      <details><summary className="cursor-pointer">Transkript ({r.transcript.turns?.length ?? 0} Turns)</summary>
                        <ol className="mt-1 space-y-1 text-[12px]">{(r.transcript.turns ?? []).map((t, i) => <li key={i}><span className="font-semibold">{t.role === 'agent' ? 'Agent' : 'Anrufer'}:</span> {t.text}{t.toolCalls?.length ? <span className="text-[var(--cq-fg-muted)]"> [{t.toolCalls.map((c) => c.name).join(', ')}]</span> : null}{t.toolResults?.some((x) => !x.ok) ? <span className="text-red-700"> [{t.toolResults.filter((x) => !x.ok).map((x) => x.code).join(', ')}]</span> : null}</li>)}</ol>
                      </details>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Calls */

function CallsTab({ detail }: { detail: ReceptionistDetail }) {
  const toast = useToast();
  const [calls, setCalls] = useState<CallRow[]>([]);
  const [events, setEvents] = useState<CallEventRow[]>([]);
  const [conversation, setConversation] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [c, e] = await Promise.all([listCalls(detail.id), listCallEvents(detail.id, conversation ?? undefined)]);
      setCalls(c);
      setEvents(e);
    } catch (e) {
      toast.error('Anrufe konnten nicht geladen werden', errorMessage(e));
    }
  }, [conversation, detail.id, toast]);
  useEffect(() => { void load(); }, [load]);

  const sync = useCallback(async () => {
    setBusy(true);
    try {
      const result = await adminAction({ action: 'sync_calls', receptionistId: detail.id });
      toast.success('Anrufe synchronisiert', `${String(result.synced)} Gespräche`);
      await load();
    } catch (e) {
      toast.error('Sync fehlgeschlagen', errorMessage(e));
    } finally {
      setBusy(false);
    }
  }, [detail.id, load, toast]);

  return (
    <div className="space-y-5">
      <Panel title="Anrufe" count={calls.length} description="Ergebnisse aus dem Post-Call-Webhook und dem manuellen Sync. Transkripte bleiben beim Provider." action={<Button variant="secondary" onClick={() => { void sync(); }} loading={busy} disabled={!detail.provider_agent_id}>Aus ElevenLabs synchronisieren</Button>} flush>
        {calls.length === 0 ? <p className="p-4 text-[13px] text-[var(--cq-fg-muted)]">Noch keine Anrufe.</p> : (
          <table className="w-full text-[12.5px]">
            <thead><tr className="text-left text-[var(--cq-fg-muted)]"><th className="p-2">Start</th><th className="p-2">Dauer</th><th className="p-2">Status</th><th className="p-2">Ergebnis</th><th className="p-2">Tools</th><th className="p-2">Eskaliert</th></tr></thead>
            <tbody>
              {calls.map((c) => (
                <tr key={c.id} className={`cursor-pointer border-t border-[var(--cq-border)] hover:bg-[var(--cq-hover)] ${conversation === c.provider_conversation_id ? 'bg-[var(--cq-sunken)]' : ''}`} onClick={() => setConversation(conversation === c.provider_conversation_id ? null : c.provider_conversation_id)}>
                  <td className="p-2">{formatDateTimeDe(c.started_at)}</td>
                  <td className="p-2">{c.duration_secs != null ? `${c.duration_secs}s` : '—'}</td>
                  <td className="p-2">{c.status}</td>
                  <td className="p-2">{c.outcome ? OUTCOME_LABEL[c.outcome] ?? c.outcome : '—'}</td>
                  <td className="p-2">{c.tool_call_count}{c.tool_error_count ? <span className="text-red-700"> ({c.tool_error_count} Fehler)</span> : null}</td>
                  <td className="p-2">{c.escalated ? 'ja' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
      <Panel title={conversation ? `Ereignisse · ${conversation}` : 'Ereignisse (alle)'} count={events.length} description="Tool-Aufrufe, Ergebnisse, Latenz, Fehlercodes, Intents. Keine Anruferdaten." flush>
        {events.length === 0 ? <p className="p-4 text-[13px] text-[var(--cq-fg-muted)]">Keine Ereignisse.</p> : (
          <table className="w-full text-[12px]">
            <thead><tr className="text-left text-[var(--cq-fg-muted)]"><th className="p-2">Zeit</th><th className="p-2">Typ</th><th className="p-2">Tool</th><th className="p-2">OK</th><th className="p-2">Fehler</th><th className="p-2">Latenz</th><th className="p-2">Intent / Detail</th></tr></thead>
            <tbody>{events.map((e) => <tr key={e.id} className="border-t border-[var(--cq-border)]"><td className="p-2">{formatDateTimeDe(e.occurred_at)}</td><td className="p-2">{e.event_type}</td><td className="p-2 font-mono">{e.tool_name ?? '—'}</td><td className="p-2">{e.ok == null ? '—' : e.ok ? 'ja' : 'nein'}</td><td className="p-2 text-red-700">{e.failure_code ?? ''}</td><td className="p-2">{e.latency_ms != null ? `${e.latency_ms} ms` : '—'}</td><td className="p-2">{[e.intent, e.detail].filter(Boolean).join(' · ')}</td></tr>)}</tbody>
          </table>
        )}
      </Panel>
    </div>
  );
}

/* ------------------------------------------------------------------ Settings */

function SettingsTab({ detail, onChanged }: { detail: ReceptionistDetail; onChanged: () => Promise<void> }) {
  const toast = useToast();
  const [stage, setStage] = useState<DeploymentStage>(detail.stage);
  const [busy, setBusy] = useState<string | null>(null);

  const setStageRemote = useCallback(async () => {
    if (stage === 'live' && !window.confirm('Stage auf LIVE setzen? Das ist der produktive Kunden-Agent. Telefonnummern werden nicht automatisch geändert.')) return;
    setBusy('stage');
    try {
      await adminAction({ action: 'set_stage', receptionistId: detail.id, stage });
      toast.success('Stage geändert', STAGE_LABEL[stage]);
      await onChanged();
    } catch (e) {
      toast.error('Stage konnte nicht geändert werden', errorMessage(e));
    } finally {
      setBusy(null);
    }
  }, [detail.id, onChanged, stage, toast]);

  const rotate = useCallback(async () => {
    if (!window.confirm('Tool-Token rotieren? Danach muss der Agent neu provisioniert werden.')) return;
    setBusy('rotate');
    try {
      await adminAction({ action: 'rotate_token', receptionistId: detail.id });
      toast.success('Token rotiert', 'Agent jetzt neu provisionieren (Tab Agent).');
      await onChanged();
    } catch (e) {
      toast.error('Rotation fehlgeschlagen', errorMessage(e));
    } finally {
      setBusy(null);
    }
  }, [detail.id, onChanged, toast]);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel title="Stage" description="DEV → EVALUATION → STAGING → LIVE. LIVE erfordert eine gültige Live-Konfiguration ohne Blocker und einen provisionierten Agenten.">
        <div className="space-y-3">
          <Select id="stage" label="Stage" value={stage} onChange={(v) => setStage(v as DeploymentStage)} options={STAGE_OPTIONS.map((o) => ({ value: o.value, label: o.label, description: o.description }))} />
          <Button onClick={() => { void setStageRemote(); }} loading={busy === 'stage'} disabled={stage === detail.stage}>Stage setzen</Button>
        </div>
      </Panel>
      <Panel title="Sicherheit" description="Das Tool-Token authentifiziert die ElevenLabs-Tools gegenüber dem Cogniiq-Backend. Es wird nur gehasht gespeichert.">
        <Button variant="secondary" onClick={() => { void rotate(); }} loading={busy === 'rotate'}>Tool-Token rotieren</Button>
      </Panel>
      <Panel title="Identität">
        <DefinitionGrid columns={2} items={[
          { label: 'Receptionist-ID', value: <code className="text-[12px]">{detail.id}</code> },
          { label: 'Organisation', value: <code className="text-[12px]">{detail.organization_id}</code> },
          { label: 'Angelegt', value: formatDateTimeDe(detail.created_at) },
          { label: 'Geändert', value: formatDateTimeDe(detail.updated_at) },
        ]} />
      </Panel>
    </div>
  );
}
