import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { HardDrive, Plus, Repeat, ScrollText, ShieldCheck, Upload } from 'lucide-react';

import { OwnerButton, OwnerCard, OwnerEmpty, OwnerError, OwnerField, OwnerKpi, OwnerLoading, OwnerPageHeader, OwnerPill, OwnerSelect } from '@/pages/owner/ownerUi';
import { useOwnerEntity } from '@/pages/owner/ownerContext';
import {
  createAsset, createSubscription, loadAssets, loadAudit, loadDocuments, loadPeriodSummary,
  loadSubscriptions, secureUuid, setSubscriptionStatus,
} from '@/lib/ownerFinance/api';
import { supabase } from '@/lib/supabase';
import { formatCents, parseAmountToCents } from '@/lib/clientPlatform/validation';
import type { OwnerAsset, OwnerAuditEntry, OwnerFinanceDocument, OwnerSubscription, PeriodSummary } from '@/lib/ownerFinance/types';

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
      <OwnerPageHeader title="Umsatz" description={`Umsatz- und Forderungsübersicht ${taxYear}. Details und Rechnungserfassung im Bereich Rechnungen.`}
        actions={<Link to="/owner/invoices" className="inline-flex h-10 items-center gap-2 rounded-xl bg-cyan-500 px-4 text-[13.5px] font-semibold text-slate-950 hover:bg-cyan-400">Rechnungen verwalten</Link>} />
      {error ? <OwnerError message={error} /> : loading || !summary ? <OwnerLoading label="Umsatz wird geladen" /> : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <OwnerKpi label="Fakturiert (netto)" valueCents={summary.invoiced_net_cents} basis="actual" />
          <OwnerKpi label="Fakturiert (brutto)" valueCents={summary.invoiced_gross_cents} basis="actual" />
          <OwnerKpi label="Zahlungseingang" valueCents={summary.cash_in_cents} basis="actual" />
          <OwnerKpi label="Offene Forderungen" valueCents={summary.outstanding_cents} basis="actual" hint={summary.overdue_count ? `${summary.overdue_count} überfällig` : undefined} />
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
  const [subs, setSubs] = useState<OwnerSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [show, setShow] = useState(false);
  const [name, setName] = useState('');
  const [freq, setFreq] = useState('monthly');
  const [gross, setGross] = useState('');
  const [next, setNext] = useState('');

  const load = useCallback(async () => {
    if (!entity) return;
    setLoading(true);
    try { setSubs(await loadSubscriptions(entity.id)); setError(null); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }, [entity]);
  useEffect(() => { void load(); }, [load]);

  const add = async () => {
    if (!entity || !name.trim()) return;
    const g = parseAmountToCents(gross);
    await createSubscription(entity.id, { name: name.trim(), billing_frequency: freq as OwnerSubscription['billing_frequency'], expected_gross_cents: 'error' in g ? null : g.cents, next_billing_date: next || null });
    setShow(false); setName(''); setGross(''); setNext('');
    void load();
  };

  const monthlyTotal = subs.filter((s) => s.status === 'active').reduce((sum, s) => sum + normalizedMonthly(s), 0);

  return (
    <>
      <OwnerPageHeader title="Abonnements" description="Wiederkehrende Kosten als Prognose. Ein Abo wird erst als Ausgabe gebucht, wenn eine echte Ausgabe/Zahlung existiert."
        actions={<OwnerButton onClick={() => setShow((s) => !s)}><Plus size={15} /> Abo</OwnerButton>} />
      {show && entity ? (
        <OwnerCard className="mb-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <OwnerField id="sn" label="Name" value={name} onChange={setName} required />
            <OwnerSelect id="sf" label="Intervall" value={freq} onChange={setFreq} options={[{ value: 'monthly', label: 'Monatlich' }, { value: 'quarterly', label: 'Quartal' }, { value: 'annual', label: 'Jährlich' }]} />
            <OwnerField id="sg" label="Brutto (€)" value={gross} onChange={setGross} />
            <OwnerField id="snext" label="Nächste Abrechnung" value={next} onChange={setNext} type="date" />
          </div>
          <div className="mt-4 flex gap-2"><OwnerButton onClick={() => void add()}>Speichern</OwnerButton><OwnerButton variant="ghost" onClick={() => setShow(false)}>Abbrechen</OwnerButton></div>
        </OwnerCard>
      ) : null}
      {error ? <OwnerError message={error} /> : null}
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <OwnerKpi label="Normalisiert / Monat (aktiv)" valueCents={monthlyTotal} basis="forecast" />
        <OwnerKpi label="Normalisiert / Jahr (aktiv)" valueCents={monthlyTotal * 12} basis="forecast" />
      </div>
      {loading ? <OwnerLoading label="Abos werden geladen" /> : subs.length === 0 ? (
        <OwnerEmpty icon={Repeat} title="Keine Abonnements" description="Erfassen Sie wiederkehrende Software- und Programmkosten als Prognose." />
      ) : (
        <div className="space-y-2">
          {subs.map((s) => (
            <OwnerCard key={s.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-100">{s.name} <OwnerPill label={s.status} tone={s.status === 'active' ? 'success' : 'neutral'} /></p>
                <p className="text-[12px] text-slate-500">{s.billing_frequency} · {formatCents(s.expected_gross_cents ?? null)} · nächste: {s.next_billing_date ?? '—'} · {formatCents(normalizedMonthly(s))}/Monat</p>
              </div>
              <div className="flex gap-2">
                {s.status === 'active' ? <button type="button" onClick={() => { void setSubscriptionStatus(s.id, 'paused').then(load); }} className="rounded-lg border border-white/10 px-2.5 py-1 text-[12px] font-semibold text-slate-300">Pausieren</button>
                  : <button type="button" onClick={() => { void setSubscriptionStatus(s.id, 'active').then(load); }} className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[12px] font-semibold text-emerald-200">Aktivieren</button>}
              </div>
            </OwnerCard>
          ))}
        </div>
      )}
    </>
  );
}

// ---------------- Assets ----------------
export function AssetsPage() {
  const { entity } = useOwnerEntity();
  const [assets, setAssets] = useState<OwnerAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [show, setShow] = useState(false);
  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState('straight_line');
  const [life, setLife] = useState('36');

  const load = useCallback(async () => {
    if (!entity) return;
    setLoading(true);
    try { setAssets(await loadAssets(entity.id)); setError(null); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }, [entity]);
  useEffect(() => { void load(); }, [load]);

  const add = async () => {
    if (!entity || !name.trim()) return;
    const c = parseAmountToCents(cost);
    await createAsset(entity.id, {
      name: name.trim(), acquisition_cost_cents: 'error' in c ? null : c.cents, purchase_date: purchaseDate || null,
      depreciation_method: method as OwnerAsset['depreciation_method'], useful_life_months: method === 'straight_line' ? Number(life) || null : null,
      depreciation_start_date: purchaseDate || null,
    });
    setShow(false); setName(''); setCost('');
    void load();
  };

  return (
    <>
      <OwnerPageHeader title="Anlagen & Ausstattung" description="Anlagegüter mit Abschreibung. Es wird nicht angenommen, dass Geräte immer sofort abziehbar sind – bitte die Abschreibungsart bestätigen."
        actions={<OwnerButton onClick={() => setShow((s) => !s)}><Plus size={15} /> Anlage</OwnerButton>} />
      {show && entity ? (
        <OwnerCard className="mb-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <OwnerField id="an" label="Bezeichnung" value={name} onChange={setName} required />
            <OwnerField id="ac" label="Anschaffungskosten (€)" value={cost} onChange={setCost} />
            <OwnerField id="ad" label="Kaufdatum" value={purchaseDate} onChange={setPurchaseDate} type="date" />
            <OwnerSelect id="am" label="Abschreibung" value={method} onChange={setMethod} options={[{ value: 'immediate', label: 'Sofortabzug (GWG)' }, { value: 'straight_line', label: 'Linear' }, { value: 'pool', label: 'Sammelposten' }, { value: 'manual', label: 'Manuell' }]} />
            {method === 'straight_line' ? <OwnerField id="al" label="Nutzungsdauer (Monate)" value={life} onChange={setLife} hint="lt. amtlicher AfA-Tabelle" /> : null}
          </div>
          <div className="mt-4 flex gap-2"><OwnerButton onClick={() => void add()}>Speichern</OwnerButton><OwnerButton variant="ghost" onClick={() => setShow(false)}>Abbrechen</OwnerButton></div>
        </OwnerCard>
      ) : null}
      {error ? <OwnerError message={error} /> : null}
      {loading ? <OwnerLoading label="Anlagen werden geladen" /> : assets.length === 0 ? (
        <OwnerEmpty icon={HardDrive} title="Keine Anlagen" description="Erfassen Sie Ausstattung und Geräte, um Abschreibungen zu planen." />
      ) : (
        <div className="space-y-2">
          {assets.map((a) => (
            <OwnerCard key={a.id} className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium text-slate-100">{a.name} <OwnerPill label={a.status} tone={a.status === 'active' ? 'success' : 'neutral'} /></p>
                <p className="text-[12px] text-slate-500">{formatCents(a.acquisition_cost_cents ?? null)} · {a.depreciation_method} · {a.useful_life_months ? `${a.useful_life_months} Mon.` : '—'} · Kauf {a.purchase_date ?? '—'}</p>
              </div>
              <span className="text-[11px] text-amber-300">Abschreibung: Schätzung</span>
            </OwnerCard>
          ))}
        </div>
      )}
    </>
  );
}

// ---------------- Documents ----------------
const ALLOWED_MIME = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'text/csv'];
const MAX_BYTES = 25 * 1024 * 1024;

export function DocumentsPage() {
  const { entity } = useOwnerEntity();
  const [docs, setDocs] = useState<OwnerFinanceDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
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
    setUploadError(null);
    if (!ALLOWED_MIME.includes(file.type)) { setUploadError('Nicht erlaubter Dateityp.'); return; }
    if (file.size > MAX_BYTES) { setUploadError('Datei zu groß (max. 25 MB).'); return; }
    setUploading(true);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
    const path = `${entity.id}/${secureUuid()}-${safeName}`;
    const up = await supabase.storage.from('owner-finance-documents').upload(path, file, { upsert: false, contentType: file.type });
    if (up.error) { setUploading(false); setUploadError(up.error.message); return; }
    const { error: metaErr } = await supabase.from('owner_finance_documents').insert({
      business_entity_id: entity.id, storage_object_path: path, original_filename: file.name, mime_type: file.type, file_size_bytes: file.size,
    });
    setUploading(false);
    if (metaErr) { setUploadError(metaErr.message); return; }
    // The document metadata insert generates its audit record database-side.
    void load();
  };

  return (
    <>
      <OwnerPageHeader title="Dokumente" description="Private Finanzdokumente. Owner-only, kein öffentlicher Bucket, nur signierte URLs. Kein OCR in V1."
        actions={<><input ref={fileRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void onFile(f); }} />
          <OwnerButton onClick={() => fileRef.current?.click()} disabled={uploading}><Upload size={15} /> {uploading ? 'Lädt…' : 'Hochladen'}</OwnerButton></>} />
      {uploadError ? <OwnerError message={uploadError} /> : null}
      {error ? <OwnerError message={error} /> : null}
      {loading ? <OwnerLoading label="Dokumente werden geladen" /> : docs.length === 0 ? (
        <OwnerEmpty icon={ScrollText} title="Keine Dokumente" description="Laden Sie Belege und Rechnungen hoch. Dateien liegen in einem privaten Bucket; Metadaten werden getrennt gespeichert." />
      ) : (
        <div className="space-y-2">
          {docs.map((d) => (
            <OwnerCard key={d.id} className="flex items-center justify-between p-4">
              <div><p className="text-sm font-medium text-slate-100">{d.original_filename ?? d.storage_object_path}</p>
                <p className="text-[12px] text-slate-500">{d.mime_type ?? '—'} · {d.file_size_bytes ? `${Math.round(d.file_size_bytes / 1024)} KB` : '—'} · {new Date(d.created_at).toLocaleDateString('de-DE')}</p></div>
              <OwnerPill label="privat" tone="info" />
            </OwnerCard>
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
      <OwnerPageHeader title="Audit" description="Fortlaufendes, nur anfügbares Protokoll wesentlicher Finanzaktionen. Einträge können nicht geändert oder gelöscht werden." />
      {error ? <OwnerError message={error} /> : loading ? <OwnerLoading label="Audit wird geladen" /> : rows.length === 0 ? (
        <OwnerEmpty icon={ShieldCheck} title="Noch keine Audit-Einträge" description="Sobald Rechnungen, Ausgaben, Zahlungen oder Steuer-Snapshots erstellt werden, erscheinen sie hier." />
      ) : (
        <div className="space-y-1.5">
          {rows.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-[#111a2e] px-4 py-2.5 text-sm">
              <div><span className="font-medium text-slate-100">{r.action}</span><span className="ml-2 text-[12px] text-slate-500">{r.resource_type}</span></div>
              <span className="text-[12px] text-slate-500">{new Date(r.created_at).toLocaleString('de-DE')}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
