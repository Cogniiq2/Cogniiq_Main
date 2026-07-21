import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';

import { AdminCard, Pill, invitationTone, lifecycleTone, solutionTone } from '@/pages/admin/clients/adminUi';
import { loadAdminClients, type AdminClientRow } from '@/lib/clientPlatform/adminApi';
import { formatCents } from '@/lib/clientPlatform/validation';
import { clientLifecycleStatuses, solutionCatalogKeys } from '@/lib/clientPlatform/types';

type SortKey = 'name' | 'updated' | 'monthly';

export function ClientsListPage() {
  const [rows, setRows] = useState<AdminClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [solutionFilter, setSolutionFilter] = useState('all');
  const [sort, setSort] = useState<SortKey>('name');

  useEffect(() => {
    let active = true;
    setLoading(true);
    loadAdminClients()
      .then((data) => { if (active) { setRows(data); setError(null); } })
      .catch((e: unknown) => { if (active) setError(e instanceof Error ? e.message : String(e)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    let result = rows;
    if (statusFilter !== 'all') result = result.filter((r) => r.account?.lifecycle_status === statusFilter);
    if (solutionFilter !== 'all') result = result.filter((r) => r.solutions.some((s) => s.catalog_key === solutionFilter));
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((r) =>
        r.organizationName.toLowerCase().includes(q) ||
        (r.account?.primary_email ?? '').toLowerCase().includes(q) ||
        (r.account?.primary_contact_name ?? '').toLowerCase().includes(q) ||
        (r.account?.industry ?? '').toLowerCase().includes(q));
    }
    const sorted = [...result];
    sorted.sort((a, b) => {
      if (sort === 'monthly') return (b.account?.estimated_monthly_value_cents ?? 0) - (a.account?.estimated_monthly_value_cents ?? 0);
      if (sort === 'updated') return (b.account?.updated_at ?? '').localeCompare(a.account?.updated_at ?? '');
      return a.organizationName.localeCompare(b.organizationName);
    });
    return sorted;
  }, [rows, statusFilter, solutionFilter, search, sort]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-950">Kunden</h1>
          <p className="mt-1 text-sm text-gray-500">Interne CRM-Übersicht aller Client-Workspaces.</p>
        </div>
        <Link
          to="/admin/clients/new"
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-gray-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
        >
          <Plus size={16} aria-hidden="true" /> Neuer Kunde
        </Link>
      </div>

      <AdminCard className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative block flex-1">
            <span className="sr-only">Suchen</span>
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" aria-hidden="true" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Suche nach Firma, Kontakt, E-Mail, Branche"
              className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-gray-400"
            />
          </label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-gray-400">
            <option value="all">Alle Status</option>
            {clientLifecycleStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={solutionFilter} onChange={(e) => setSolutionFilter(e.target.value)} className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-gray-400">
            <option value="all">Alle Lösungen</option>
            {solutionCatalogKeys.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-gray-400">
            <option value="name">Name (A-Z)</option>
            <option value="updated">Zuletzt aktualisiert</option>
            <option value="monthly">Monatswert</option>
          </select>
        </div>
      </AdminCard>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-2xl border border-gray-100 bg-white" />)}
        </div>
      ) : error ? (
        <AdminCard><p className="text-sm text-red-600">Fehler: {error}</p></AdminCard>
      ) : filtered.length === 0 ? (
        <AdminCard>
          <p className="text-sm font-semibold text-gray-900">Keine Kunden gefunden</p>
          <p className="mt-1 text-sm text-gray-500">Passen Sie Suche und Filter an oder legen Sie einen neuen Kunden an.</p>
        </AdminCard>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">
                <th className="px-4 py-3">Firma</th>
                <th className="px-4 py-3">Kontakt</th>
                <th className="px-4 py-3">Branche</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Lösungen</th>
                <th className="px-4 py-3">Monatswert</th>
                <th className="px-4 py-3">Zugang</th>
                <th className="px-4 py-3">Owner</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const account = row.account;
                const invitation = row.invitations.find((i) => i.status === 'pending') ?? row.invitations[0];
                return (
                  <tr key={row.organizationId} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60">
                    <td className="px-4 py-3">
                      <Link to={`/admin/clients/${row.organizationId}`} className="font-semibold text-gray-950 hover:underline">
                        {row.organizationName}
                      </Link>
                      <div className="text-[12px] text-gray-400">{account?.primary_email ?? '—'}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {account?.primary_contact_name ?? '—'}
                      <div className="text-[12px] text-gray-400">{account?.phone ?? ''}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{account?.industry ?? '—'}</td>
                    <td className="px-4 py-3">
                      {account ? <Pill label={account.lifecycle_status} tone={lifecycleTone[account.lifecycle_status]} /> : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {row.solutions.length === 0 ? <span className="text-gray-400">—</span> : row.solutions.map((s) => (
                          <Pill key={s.id} label={`${s.catalog_key.replace(/_/g, ' ')}`} tone={solutionTone[s.status]} />
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{formatCents(account?.estimated_monthly_value_cents, account?.currency)}</td>
                    <td className="px-4 py-3">{invitation ? <Pill label={invitation.status} tone={invitationTone[invitation.status]} /> : '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{account?.internal_owner ?? '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
