import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Plus, Search } from 'lucide-react';

import {
  Button, DataTable, EmptyState, ErrorState, Field, Modal, PageHeader, Select, StatusBadge,
  TableSkeleton, useToast, type Column,
} from '@/components/dashboard';
import { lifecycleTone } from '@/pages/owner/ownerUi';
import { createCrmOnlyClient } from '@/lib/ownerFinance/api';
import { loadAdminClients, type AdminClientRow } from '@/lib/clientPlatform/adminApi';
import { formatCents, isValidEmail } from '@/lib/clientPlatform/validation';
import { clientLifecycleStatuses } from '@/lib/clientPlatform/types';

export function ClientsPage() {
  const toast = useToast();
  const [rows, setRows] = useState<AdminClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [lifecycle, setLifecycle] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);

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

  const columns: Column<AdminClientRow>[] = [
    {
      key: 'name', header: 'Kunde', render: (r) => (
        <div><p className="font-semibold text-gray-950">{r.organizationName}</p><p className="text-[12px] text-gray-500">{r.account?.primary_email ?? '—'}</p></div>
      ),
    },
    { key: 'status', header: 'Status', render: (r) => (r.account ? <StatusBadge label={r.account.lifecycle_status} tone={lifecycleTone[r.account.lifecycle_status]} /> : <span className="text-gray-400">—</span>) },
    { key: 'budget', header: 'Budget', align: 'right', render: (r) => <span className="tabular-nums">{formatCents(r.account?.estimated_total_budget_cents ?? null, r.account?.currency)}</span> },
    { key: 'monthly', header: 'Monatswert', align: 'right', render: (r) => <span className="tabular-nums">{formatCents(r.account?.estimated_monthly_value_cents ?? null, r.account?.currency)}</span> },
    { key: 'solutions', header: 'Lösungen', render: (r) => <span className="text-gray-500">{r.solutions.length || '—'}</span> },
    { key: 'action', header: '', align: 'right', render: (r) => <Link to={`/admin/clients/${r.organizationId}`} onClick={(e) => e.stopPropagation()} className="text-[13px] font-semibold text-gray-950 hover:underline">Admin öffnen</Link> },
  ];

  return (
    <>
      <PageHeader
        title="Kunden (CRM)"
        description="Interne CRM-Kunden mit Umsatz-, Budget- und Margeninformationen. CRM-only-Kunden ohne Kundenportal können hier angelegt werden."
        actions={<Button icon={Plus} onClick={() => setCreateOpen(true)}>CRM-Kunde</Button>}
      />

      {error ? <div className="mb-6"><ErrorState message={error} onRetry={() => void load()} /></div> : null}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <label className="relative block flex-1">
          <span className="sr-only">Suche</span>
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Suche nach Firma, E-Mail, Branche" className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-900 outline-none transition-colors focus:border-gray-400" />
        </label>
        <div className="sm:w-56">
          <Select id="lc" value={lifecycle} onChange={setLifecycle} options={[{ value: 'all', label: 'Alle Status' }, ...clientLifecycleStatuses.map((s) => ({ value: s, label: s }))]} />
        </div>
      </div>

      {loading ? <TableSkeleton rows={5} cols={5} /> : filtered.length === 0 ? (
        <EmptyState icon={Building2} title="Keine Kunden" description="Legen Sie einen CRM-Kunden an oder passen Sie die Filter an." action={<Button icon={Plus} onClick={() => setCreateOpen(true)}>CRM-Kunde</Button>} />
      ) : (
        <DataTable columns={columns} rows={filtered} getRowKey={(r) => r.organizationId} minWidth={840} mobileTitle={(r) => r.organizationName} mobileSubtitle={(r) => r.account?.primary_email ?? '—'} />
      )}

      <CreateCrmClient open={createOpen} onClose={() => setCreateOpen(false)} onDone={() => { setCreateOpen(false); toast.success('CRM-Kunde angelegt'); void load(); }} onError={(m) => toast.error('Anlegen fehlgeschlagen', m)} />
    </>
  );
}

function CreateCrmClient({ open, onClose, onDone, onError }: { open: boolean; onClose: () => void; onDone: () => void; onError: (m: string) => void }) {
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
    if (!ok) { setErr(error ?? 'Fehler'); onError(error ?? 'Fehler'); return; }
    setName(''); setEmail(''); setPhone(''); setIndustry(''); setContact(''); setStatus('lead');
    onDone();
  };

  return (
    <Modal
      open={open}
      onClose={busy ? () => {} : onClose}
      title="CRM-Kunde anlegen"
      description="Legt Organisation + CRM-Konto an. Keine Lösung, keine Mitgliedschaft, keine Einladung, kein Kundenportal."
      footer={<><Button variant="secondary" onClick={onClose} disabled={busy}>Abbrechen</Button><Button onClick={() => void submit()} loading={busy}>Anlegen</Button></>}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Field id="cn" label="Firma" value={name} onChange={setName} required autoFocus /></div>
        <Field id="ce" label="E-Mail" value={email} onChange={setEmail} type="email" />
        <Field id="cp" label="Telefon" value={phone} onChange={setPhone} />
        <Field id="ci" label="Branche" value={industry} onChange={setIndustry} />
        <Field id="cc" label="Ansprechpartner" value={contact} onChange={setContact} />
        <Select id="cs" label="Status" value={status} onChange={setStatus} options={clientLifecycleStatuses.map((s) => ({ value: s, label: s }))} />
      </div>
      {err ? <p className="mt-3 text-[13px] text-red-600">{err}</p> : null}
    </Modal>
  );
}
