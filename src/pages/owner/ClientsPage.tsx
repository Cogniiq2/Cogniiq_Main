import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Plus, Search } from 'lucide-react';

import { OwnerButton, OwnerCard, OwnerEmpty, OwnerError, OwnerField, OwnerLoading, OwnerPageHeader, OwnerPill, OwnerSelect } from '@/pages/owner/ownerUi';
import { createCrmOnlyClient } from '@/lib/ownerFinance/api';
import { loadAdminClients, type AdminClientRow } from '@/lib/clientPlatform/adminApi';
import { formatCents, isValidEmail } from '@/lib/clientPlatform/validation';
import { clientLifecycleStatuses } from '@/lib/clientPlatform/types';

const lifecycleTone: Record<string, 'neutral' | 'info' | 'success' | 'warning' | 'danger'> = {
  lead: 'neutral', qualified: 'info', active: 'success', paused: 'warning', churned: 'danger', archived: 'neutral',
};

export function ClientsPage() {
  const [rows, setRows] = useState<AdminClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [lifecycle, setLifecycle] = useState('all');
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setRows(await loadAdminClients()); setError(null); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => rows.filter((r) => {
    if (lifecycle !== 'all' && r.account?.lifecycle_status !== lifecycle) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return r.organizationName.toLowerCase().includes(q) || (r.account?.primary_email ?? '').toLowerCase().includes(q) || (r.account?.industry ?? '').toLowerCase().includes(q);
    }
    return true;
  }), [rows, lifecycle, search]);

  return (
    <>
      <OwnerPageHeader
        title="Kunden"
        description="Interne CRM-Kunden mit Umsatz-, Budget- und Margeninformationen. CRM-only-Kunden ohne Kundenportal können hier angelegt werden."
        actions={<OwnerButton onClick={() => setShowCreate((s) => !s)}><Plus size={15} /> CRM-Kunde</OwnerButton>}
      />
      {showCreate ? <CreateCrmClient onDone={() => { setShowCreate(false); void load(); }} /> : null}
      {error ? <OwnerError message={error} /> : null}

      <OwnerCard className="mb-4 p-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative block flex-1">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" aria-hidden="true" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Suche nach Firma, E-Mail, Branche" className="h-10 w-full rounded-xl border border-white/10 bg-[#0c1526] pl-9 pr-3 text-sm text-slate-100 outline-none focus:border-cyan-500/50" />
          </label>
          <div className="sm:w-56"><OwnerSelect id="lc" label="" value={lifecycle} onChange={setLifecycle} options={[{ value: 'all', label: 'Alle Status' }, ...clientLifecycleStatuses.map((s) => ({ value: s, label: s }))]} /></div>
        </div>
      </OwnerCard>

      {loading ? <OwnerLoading label="Kunden werden geladen" /> : filtered.length === 0 ? (
        <OwnerEmpty icon={Building2} title="Keine Kunden" description="Legen Sie einen CRM-Kunden an oder passen Sie die Filter an." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/8 bg-[#111a2e]">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead><tr className="border-b border-white/8 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
              <th className="px-4 py-3">Kunde</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Budget</th>
              <th className="px-4 py-3 text-right">Monatswert</th><th className="px-4 py-3">Lösungen</th><th className="px-4 py-3"></th>
            </tr></thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.organizationId} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-100">{r.organizationName}</p>
                    <p className="text-[12px] text-slate-500">{r.account?.primary_email ?? '—'}</p>
                  </td>
                  <td className="px-4 py-3">{r.account ? <OwnerPill label={r.account.lifecycle_status} tone={lifecycleTone[r.account.lifecycle_status]} /> : '—'}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-300">{formatCents(r.account?.estimated_total_budget_cents ?? null, r.account?.currency)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-300">{formatCents(r.account?.estimated_monthly_value_cents ?? null, r.account?.currency)}</td>
                  <td className="px-4 py-3 text-slate-400">{r.solutions.length || '—'}</td>
                  <td className="px-4 py-3 text-right"><Link to={`/admin/clients/${r.organizationId}`} className="text-[13px] font-semibold text-cyan-300 hover:underline">Admin öffnen</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function CreateCrmClient({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [industry, setIndustry] = useState('');
  const [status, setStatus] = useState('lead');
  const [contact, setContact] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setErr(null);
    if (!name.trim()) { setErr('Firmenname erforderlich.'); return; }
    if (email.trim() && !isValidEmail(email)) { setErr('Ungültige E-Mail.'); return; }
    setBusy(true);
    const { ok, error } = await createCrmOnlyClient({ displayName: name.trim(), primaryEmail: email.trim() || null, phone: phone.trim() || null, industry: industry.trim() || null, lifecycleStatus: status, primaryContactName: contact.trim() || null });
    setBusy(false);
    if (!ok) { setErr(error ?? 'Fehler'); return; }
    onDone();
  };

  return (
    <OwnerCard className="mb-4">
      <p className="mb-1 text-sm font-semibold text-white">CRM-Kunde anlegen</p>
      <p className="mb-4 text-[12px] text-slate-500">Legt Organisation + CRM-Konto an. Keine Lösung, keine Mitgliedschaft, keine Einladung, kein Kundenportal.</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <OwnerField id="cn" label="Firma" value={name} onChange={setName} required />
        <OwnerField id="ce" label="E-Mail" value={email} onChange={setEmail} />
        <OwnerField id="cp" label="Telefon" value={phone} onChange={setPhone} />
        <OwnerField id="ci" label="Branche" value={industry} onChange={setIndustry} />
        <OwnerField id="cc" label="Ansprechpartner" value={contact} onChange={setContact} />
        <OwnerSelect id="cs" label="Status" value={status} onChange={setStatus} options={clientLifecycleStatuses.map((s) => ({ value: s, label: s }))} />
      </div>
      {err ? <p className="mt-2 text-sm text-rose-400">{err}</p> : null}
      <div className="mt-4 flex gap-2">
        <OwnerButton onClick={() => void submit()} disabled={busy}>{busy ? 'Anlegen…' : 'Anlegen'}</OwnerButton>
        <OwnerButton variant="ghost" onClick={onDone}>Abbrechen</OwnerButton>
      </div>
    </OwnerCard>
  );
}
