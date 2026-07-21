import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { HardDrive, Plus, Repeat, ScrollText, ShieldCheck, Upload } from 'lucide-react';

import {
  Button, Card, EmptyState, ErrorState, Field, KpiCard, KpiSkeletonGrid, Modal, PageHeader, SectionHeader,
  Select, StatusBadge, TableSkeleton, useToast,
} from '@/components/dashboard';
import { useOwnerEntity } from '@/pages/owner/ownerContext';
import {
  createAsset, createSubscription, loadAssets, loadAudit, loadDocuments, loadPeriodSummary,
  loadSubscriptions, secureUuid, setSubscriptionStatus,
} from '@/lib/ownerFinance/api';
import { supabase } from '@/lib/supabase';
import { formatCents, parseAmountToCents } from '@/lib/clientPlatform/validation';
import type { OwnerAsset, OwnerAuditEntry, OwnerFinanceDocument, OwnerSubscription, PeriodSummary } from '@/lib/ownerFinance/types';

function toCents(input: string): number | null {
  const p = parseAmountToCents(input);
  return 'error' in p ? null : p.cents;
}

// ---------------- Revenue ----------------
export function RevenuePage() {
  const { entity, taxYear } = useOwnerEntity();
  const [summary, setSummary] = useState<PeriodSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!entity) return;
    setLoading(true);
    loadPeriodSummary(entity.id, `${taxYear}-01-01`, `${taxYear}-12-31`)
      .then((s) => { setSummary(s); setError(null); })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, [entity, taxYear]);

  return (
    <>
      <PageHeader title="Umsatz" description={`Umsatz- und Forderungsübersicht ${taxYear}. Details und Rechnungserfassung im Bereich Rechnungen.`}
        actions={<Link to="/owner/invoices" className="inline-flex h-11 items-center gap-2 rounded-xl bg-gray-950 px-4 text-[13.5px] font-semibold text-white transition-colors hover:bg-gray-800">Rechnungen verwalten</Link>} />
      {error ? <ErrorState message={error} /> : loading || !summary ? <KpiSkeletonGrid /> : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Fakturiert (netto)" valueCents={summary.invoiced_net_cents} basis="actual" />
          <KpiCard label="Fakturiert (brutto)" valueCents={summary.invoiced_gross_cents} basis="actual" />
          <KpiCard label="Zahlungseingang" valueCents={summary.cash_in_cents} basis="actual" />
          <KpiCard label="Offene Forderungen" valueCents={summary.outstanding_cents} basis="actual" tone={summary.overdue_cents > 0 ? 'negative' : 'neutral'} hint={summary.overdue_count ? `${summary.overdue_count} überfällig` : undefined} />
        </div>
      )}
    </>
  );
}

// ---------------- Subscriptions ----------------
function normalizedMonthly(s: OwnerSubscription): number {
  const g = s.expected_gross_cents ?? 0;
  if (s.billing_frequency === 'monthly') return g;
  if (s.billing_frequency === 'quarterly') return Math.round(g / 3);
  if (s.billing_frequency === 'annual') return Math.round(g / 12);
  return 0;
}

export function SubscriptionsPage() {
  const { entity } = useOwnerEntity();
  const toast = useToast();
  const [subs, setSubs] = useState<OwnerSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    if (!entity) return;
    setLoading(true);
    try { setSubs(await loadSubscriptions(entity.id)); setError(null); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }, [entity]);
  useEffect(() => { void load(); }, [load]);

  const monthlyTotal = subs.filter((s) => s.status === 'active').reduce((sum, s) => sum + normalizedMonthly(s), 0);

  const toggle = async (s: OwnerSubscription) => {
    const next = s.status === 'active' ? 'paused' : 'active';
    const { error: err } = await setSubscriptionStatus(s.id, next);
    if (err) { toast.error('Aktualisierung fehlgeschlagen', err); return; }
    toast.success(next === 'active' ? 'Abo aktiviert' : 'Abo pausiert');
    void load();
  };

  return (
    <>
      <PageHeader title="Abonnements" description="Wiederkehrende Kosten als Prognose. Ein Abo wird erst als Ausgabe gebucht, wenn eine echte Ausgabe/Zahlung existiert."
        actions={<Button icon={Plus} onClick={() => setOpen(true)} disabled={!entity}>Abo</Button>} />

      {error ? <div className="mb-6"><ErrorState message={error} onRetry={() => void load()} /></div> : null}

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <KpiCard label="Normalisiert / Monat (aktiv)" valueCents={monthlyTotal} basis="forecast" />
        <KpiCard label="Normalisiert / Jahr (aktiv)" valueCents={monthlyTotal * 12} basis="forecast" />
      </div>

      {loading ? <TableSkeleton rows={4} cols={3} /> : subs.length === 0 ? (
        <EmptyState icon={Repeat} title="Keine Abonnements" description="Erfassen Sie wiederkehrende Software- und Programmkosten als Prognose." action={<Button icon={Plus} onClick={() => setOpen(true)} disabled={!entity}>Abo</Button>} />
      ) : (
        <div className="space-y-2.5">
          {subs.map((s) => (
            <Card key={s.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold text-gray-950">{s.name} <StatusBadge label={s.status === 'active' ? 'aktiv' : s.status === 'paused' ? 'pausiert' : 'gekündigt'} tone={s.status === 'active' ? 'success' : 'neutral'} /></p>
                <p className="mt-0.5 text-[12px] text-gray-500">{s.billing_frequency} · {formatCents(s.expected_gross_cents ?? null)} · nächste: {s.next_billing_date ?? '—'} · {formatCents(normalizedMonthly(s))}/Monat</p>
              </div>
              <Button size="sm" variant={s.status === 'active' ? 'secondary' : 'success'} onClick={() => void toggle(s)}>{s.status === 'active' ? 'Pausieren' : 'Aktivieren'}</Button>
            </Card>
          ))}
        </div>
      )}

      {entity ? <SubscriptionModal open={open} entityId={entity.id} onClose={() => setOpen(false)} onDone={() => { setOpen(false); toast.success('Abo gespeichert'); void load(); }} onError={(m) => toast.error('Speichern fehlgeschlagen', m)} /> : null}
    </>
  );
}

function SubscriptionModal({ open, entityId, onClose, onDone, onError }: { open: boolean; entityId: string; onClose: () => void; onDone: () => void; onError: (m: string) => void }) {
  const [name, setName] = useState('');
  const [freq, setFreq] = useState('monthly');
  const [gross, setGross] = useState('');
  const [next, setNext] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const add = async () => {
    setErr(null);
    if (!name.trim()) { setErr('Name erforderlich.'); return; }
    setBusy(true);
    const g = toCents(gross);
    const { error } = await createSubscription(entityId, { name: name.trim(), billing_frequency: freq as OwnerSubscription['billing_frequency'], expected_gross_cents: g, next_billing_date: next || null });
    setBusy(false);
    if (error) { setErr(error); onError(error); return; }
    setName(''); setGross(''); setNext(''); setFreq('monthly');
    onDone();
  };

  return (
    <Modal open={open} onClose={busy ? () => {} : onClose} title="Abonnement erfassen" footer={<><Button variant="secondary" onClick={onClose} disabled={busy}>Abbrechen</Button><Button onClick={() => void add()} loading={busy}>Speichern</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Field id="sn" label="Name" value={name} onChange={setName} required autoFocus /></div>
        <Select id="sf" label="Intervall" value={freq} onChange={setFreq} options={[{ value: 'monthly', label: 'Monatlich' }, { value: 'quarterly', label: 'Quartal' }, { value: 'annual', label: 'Jährlich' }]} />
        <Field id="sg" label="Brutto" prefix="€" value={gross} onChange={setGross} inputMode="decimal" />
        <Field id="snext" label="Nächste Abrechnung" type="date" value={next} onChange={setNext} />
      </div>
      {err ? <p className="mt-3 text-[13px] text-red-600">{err}</p> : null}
    </Modal>
  );
}

// ---------------- Assets ----------------
export function AssetsPage() {
  const { entity } = useOwnerEntity();
  const toast = useToast();
  const [assets, setAssets] = useState<OwnerAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    if (!entity) return;
    setLoading(true);
    try { setAssets(await loadAssets(entity.id)); setError(null); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }, [entity]);
  useEffect(() => { void load(); }, [load]);

  return (
    <>
      <PageHeader title="Anlagen & Ausstattung" description="Anlagegüter mit Abschreibung. Es wird nicht angenommen, dass Geräte immer sofort abziehbar sind – bitte die Abschreibungsart bestätigen."
        actions={<Button icon={Plus} onClick={() => setOpen(true)} disabled={!entity}>Anlage</Button>} />

      {error ? <div className="mb-6"><ErrorState message={error} onRetry={() => void load()} /></div> : null}

      {loading ? <TableSkeleton rows={4} cols={3} /> : assets.length === 0 ? (
        <EmptyState icon={HardDrive} title="Keine Anlagen" description="Erfassen Sie Ausstattung und Geräte, um Abschreibungen zu planen." action={<Button icon={Plus} onClick={() => setOpen(true)} disabled={!entity}>Anlage</Button>} />
      ) : (
        <div className="space-y-2.5">
          {assets.map((a) => (
            <Card key={a.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold text-gray-950">{a.name} <StatusBadge label={a.status === 'active' ? 'aktiv' : a.status} tone={a.status === 'active' ? 'success' : 'neutral'} /></p>
                <p className="mt-0.5 text-[12px] text-gray-500">{formatCents(a.acquisition_cost_cents ?? null)} · {a.depreciation_method} · {a.useful_life_months ? `${a.useful_life_months} Mon.` : '—'} · Kauf {a.purchase_date ?? '—'}</p>
              </div>
              <StatusBadge label="Abschreibung: Schätzung" tone="warning" />
            </Card>
          ))}
        </div>
      )}

      {entity ? <AssetModal open={open} entityId={entity.id} onClose={() => setOpen(false)} onDone={() => { setOpen(false); toast.success('Anlage gespeichert'); void load(); }} onError={(m) => toast.error('Speichern fehlgeschlagen', m)} /> : null}
    </>
  );
}

function AssetModal({ open, entityId, onClose, onDone, onError }: { open: boolean; entityId: string; onClose: () => void; onDone: () => void; onError: (m: string) => void }) {
  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState('straight_line');
  const [life, setLife] = useState('36');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const add = async () => {
    setErr(null);
    if (!name.trim()) { setErr('Bezeichnung erforderlich.'); return; }
    setBusy(true);
    const c = toCents(cost);
    const { error } = await createAsset(entityId, {
      name: name.trim(), acquisition_cost_cents: c, purchase_date: purchaseDate || null,
      depreciation_method: method as OwnerAsset['depreciation_method'], useful_life_months: method === 'straight_line' ? Number(life) || null : null,
      depreciation_start_date: purchaseDate || null,
    });
    setBusy(false);
    if (error) { setErr(error); onError(error); return; }
    setName(''); setCost('');
    onDone();
  };

  return (
    <Modal open={open} onClose={busy ? () => {} : onClose} title="Anlage erfassen" footer={<><Button variant="secondary" onClick={onClose} disabled={busy}>Abbrechen</Button><Button onClick={() => void add()} loading={busy}>Speichern</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Field id="an" label="Bezeichnung" value={name} onChange={setName} required autoFocus /></div>
        <Field id="ac" label="Anschaffungskosten" prefix="€" value={cost} onChange={setCost} inputMode="decimal" />
        <Field id="ad" label="Kaufdatum" type="date" value={purchaseDate} onChange={setPurchaseDate} />
        <Select id="am" label="Abschreibung" value={method} onChange={setMethod} options={[{ value: 'immediate', label: 'Sofortabzug (GWG)' }, { value: 'straight_line', label: 'Linear' }, { value: 'pool', label: 'Sammelposten' }, { value: 'manual', label: 'Manuell' }]} />
        {method === 'straight_line' ? <Field id="al" label="Nutzungsdauer (Monate)" value={life} onChange={setLife} hint="lt. amtlicher AfA-Tabelle" inputMode="numeric" /> : null}
      </div>
      {err ? <p className="mt-3 text-[13px] text-red-600">{err}</p> : null}
    </Modal>
  );
}

// ---------------- Documents ----------------
const ALLOWED_MIME = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'text/csv'];
const MAX_BYTES = 25 * 1024 * 1024;

export function DocumentsPage() {
  const { entity } = useOwnerEntity();
  const toast = useToast();
  const [docs, setDocs] = useState<OwnerFinanceDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!entity) return;
    setLoading(true);
    try { setDocs(await loadDocuments(entity.id)); setError(null); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }, [entity]);
  useEffect(() => { void load(); }, [load]);

  const onFile = async (file: File) => {
    if (!entity) return;
    if (!ALLOWED_MIME.includes(file.type)) { toast.error('Nicht erlaubter Dateityp', 'Erlaubt: PDF, PNG, JPEG, WebP, CSV.'); return; }
    if (file.size > MAX_BYTES) { toast.error('Datei zu groß', 'Maximal 25 MB.'); return; }
    setUploading(true);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
    const path = `${entity.id}/${secureUuid()}-${safeName}`;
    const up = await supabase.storage.from('owner-finance-documents').upload(path, file, { upsert: false, contentType: file.type });
    if (up.error) { setUploading(false); toast.error('Upload fehlgeschlagen', up.error.message); return; }
    const { error: metaErr } = await supabase.from('owner_finance_documents').insert({
      business_entity_id: entity.id, storage_object_path: path, original_filename: file.name, mime_type: file.type, file_size_bytes: file.size,
    });
    setUploading(false);
    if (metaErr) { toast.error('Metadaten fehlgeschlagen', metaErr.message); return; }
    toast.success('Dokument hochgeladen');
    void load();
  };

  return (
    <>
      <PageHeader title="Dokumente" description="Private Finanzdokumente. Owner-only, kein öffentlicher Bucket, nur signierte URLs. Kein OCR in V1."
        actions={<><input ref={fileRef} type="file" className="hidden" aria-hidden="true" onChange={(e) => { const f = e.target.files?.[0]; if (f) void onFile(f); e.target.value = ''; }} />
          <Button icon={Upload} onClick={() => fileRef.current?.click()} loading={uploading} disabled={!entity}>Hochladen</Button></>} />

      {error ? <div className="mb-6"><ErrorState message={error} onRetry={() => void load()} /></div> : null}

      {loading ? <TableSkeleton rows={4} cols={3} /> : docs.length === 0 ? (
        <EmptyState icon={ScrollText} title="Keine Dokumente" description="Laden Sie Belege und Rechnungen hoch. Dateien liegen in einem privaten Bucket; Metadaten werden getrennt gespeichert." action={<Button icon={Upload} onClick={() => fileRef.current?.click()} disabled={!entity}>Hochladen</Button>} />
      ) : (
        <div className="space-y-2.5">
          {docs.map((d) => (
            <Card key={d.id} className="flex items-center justify-between p-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-950">{d.original_filename ?? d.storage_object_path}</p>
                <p className="mt-0.5 text-[12px] text-gray-500">{d.mime_type ?? '—'} · {d.file_size_bytes ? `${Math.round(d.file_size_bytes / 1024)} KB` : '—'} · {new Date(d.created_at).toLocaleDateString('de-DE')}</p>
              </div>
              <StatusBadge label="privat" tone="info" />
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

// ---------------- Audit ----------------
export function AuditPage() {
  const { entity } = useOwnerEntity();
  const [rows, setRows] = useState<OwnerAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!entity) return;
    setLoading(true);
    loadAudit(entity.id).then((r) => { setRows(r); setError(null); }).catch((e: unknown) => setError(e instanceof Error ? e.message : String(e))).finally(() => setLoading(false));
  }, [entity]);

  return (
    <>
      <PageHeader title="Audit" description="Fortlaufendes, nur anfügbares Protokoll wesentlicher Finanzaktionen. Einträge können nicht geändert oder gelöscht werden." />
      {error ? <ErrorState message={error} /> : loading ? <TableSkeleton rows={6} cols={2} /> : rows.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="Noch keine Audit-Einträge" description="Sobald Rechnungen, Ausgaben, Zahlungen oder Steuer-Snapshots erstellt werden, erscheinen sie hier." />
      ) : (
        <Card className="p-0">
          <SectionHeader title="Ereignisprotokoll" className="border-b border-gray-100 px-5 py-4 mb-0" />
          <div className="divide-y divide-gray-50">
            {rows.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <div className="flex items-center gap-3">
                  <StatusBadge label={r.action} tone="neutral" />
                  <span className="text-[12px] text-gray-500">{r.resource_type}</span>
                </div>
                <span className="text-[12px] text-gray-400">{new Date(r.created_at).toLocaleString('de-DE')}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}
