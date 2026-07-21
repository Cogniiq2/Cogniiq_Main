import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Copy, Pause, Play, Plus, RefreshCw, XCircle } from 'lucide-react';

import { AdminCard, AdminField, Pill, invitationTone, lifecycleTone, solutionTone } from '@/pages/admin/clients/adminUi';
import {
  addClientContact,
  loadClientDetail,
  portalLinkForInstance,
  resendInvitationViaEdge,
  revokeInvitation,
  setSolutionStatus,
  type AdminClientDetail,
} from '@/lib/clientPlatform/adminApi';
import { formatCents } from '@/lib/clientPlatform/validation';
import {
  canRenewInvitation,
  canResendInvitation,
  effectiveInvitationStatus,
  resendOutcomeMessage,
} from '@/lib/clientPlatform/invitationStatus';

const tabs = ['Übersicht', 'Kontakte', 'Lösungen', 'Vertrag & Budget', 'Zugang', 'Aktivität'] as const;
type Tab = (typeof tabs)[number];

export function ClientDetailPage() {
  const { organizationId } = useParams<{ organizationId: string }>();
  const [detail, setDetail] = useState<AdminClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('Übersicht');
  const [notice, setNotice] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      setDetail(await loadClientDetail(organizationId));
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => { void reload(); }, [reload]);

  const flash = (message: string) => { setNotice(message); setTimeout(() => setNotice(null), 3000); };

  if (loading) return <div className="h-40 animate-pulse rounded-2xl border border-gray-100 bg-white" />;
  if (error) return <AdminCard><p className="text-sm text-red-600">Fehler: {error}</p></AdminCard>;
  if (!detail || !detail.account) {
    return (
      <AdminCard>
        <p className="text-sm font-semibold text-gray-900">Kunde nicht gefunden</p>
        <Link to="/admin/clients" className="mt-3 inline-block text-sm font-semibold text-gray-600 hover:text-gray-950">Zurück zur Liste</Link>
      </AdminCard>
    );
  }

  const account = detail.account;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link to="/admin/clients" className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:border-gray-300"><ArrowLeft size={16} /></Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-950">{detail.organizationName}</h1>
            <div className="mt-1 flex items-center gap-2">
              <Pill label={account.lifecycle_status} tone={lifecycleTone[account.lifecycle_status]} />
              <span className="text-[12px] text-gray-400">Org-Status: {detail.organizationStatus}</span>
            </div>
          </div>
        </div>
      </div>

      {notice ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">{notice}</div> : null}

      <div className="flex flex-wrap gap-1 border-b border-gray-100">
        {tabs.map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} className={`h-10 rounded-t-lg px-3 text-[13px] font-semibold transition-colors ${tab === t ? 'border-b-2 border-gray-950 text-gray-950' : 'text-gray-500 hover:text-gray-950'}`}>{t}</button>
        ))}
      </div>

      {tab === 'Übersicht' ? <OverviewTab detail={detail} /> : null}
      {tab === 'Kontakte' ? <ContactsTab detail={detail} onChanged={() => void reload()} flash={flash} /> : null}
      {tab === 'Lösungen' ? <SolutionsTab detail={detail} onChanged={() => void reload()} flash={flash} /> : null}
      {tab === 'Vertrag & Budget' ? <BudgetTab detail={detail} /> : null}
      {tab === 'Zugang' ? <AccessTab detail={detail} onChanged={() => void reload()} flash={flash} /> : null}
      {tab === 'Aktivität' ? <ActivityTab /> : null}
    </div>
  );
}

function OverviewTab({ detail }: { detail: AdminClientDetail }) {
  const a = detail.account!;
  const rows: [string, string][] = [
    ['Rechtlicher Name', a.legal_name ?? '—'],
    ['Primärkontakt', a.primary_contact_name ?? '—'],
    ['E-Mail', a.primary_email ?? '—'],
    ['Telefon', a.phone ?? '—'],
    ['Website', a.website ?? '—'],
    ['Branche', a.industry ?? '—'],
    ['Adresse', a.address ?? '—'],
    ['Lead-Quelle', a.lead_source ?? '—'],
    ['Interner Owner', a.internal_owner ?? '—'],
  ];
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <AdminCard>
        <dl className="grid gap-4 sm:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={label}>
              <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400">{label}</dt>
              <dd className="mt-1 break-words text-sm font-medium text-gray-900">{value}</dd>
            </div>
          ))}
        </dl>
      </AdminCard>
      <AdminCard>
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400">Kommerziell</p>
        <div className="space-y-3 text-sm">
          <MoneyRow label="Gesamtbudget" cents={a.estimated_total_budget_cents} currency={a.currency} />
          <MoneyRow label="Monatswert" cents={a.estimated_monthly_value_cents} currency={a.currency} />
        </div>
        {a.internal_notes ? (
          <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400">Notizen</p>
            <p className="mt-1 whitespace-pre-wrap text-[13px] text-gray-600">{a.internal_notes}</p>
          </div>
        ) : null}
      </AdminCard>
    </div>
  );
}

function ContactsTab({ detail, onChanged, flash }: { detail: AdminClientDetail; onChanged: () => void; flash: (m: string) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);

  const add = async () => {
    if (!name.trim()) return;
    setBusy(true);
    const { error } = await addClientContact(detail.organizationId, { name: name.trim(), email: email.trim() || null, phone: phone.trim() || null });
    setBusy(false);
    if (!error) { setName(''); setEmail(''); setPhone(''); flash('Kontakt hinzugefügt.'); onChanged(); }
    else flash(`Fehler: ${error}`);
  };

  return (
    <div className="space-y-4">
      <AdminCard>
        <div className="grid gap-3 sm:grid-cols-4">
          <AdminField id="c-name" label="Name" value={name} onChange={setName} />
          <AdminField id="c-email" label="E-Mail" value={email} onChange={setEmail} />
          <AdminField id="c-phone" label="Telefon" value={phone} onChange={setPhone} />
          <div className="flex items-end">
            <button type="button" onClick={() => void add()} disabled={busy || !name.trim()} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gray-950 px-4 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"><Plus size={16} /> Kontakt</button>
          </div>
        </div>
      </AdminCard>
      <div className="space-y-2">
        {detail.contacts.length === 0 ? <AdminCard><p className="text-sm text-gray-500">Noch keine weiteren Kontakte.</p></AdminCard> : detail.contacts.map((c) => (
          <AdminCard key={c.id} className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">{c.name} {c.is_primary ? <Pill label="Primär" tone="info" /> : null}</p>
              <p className="text-[12px] text-gray-500">{[c.email, c.phone].filter(Boolean).join(' · ') || '—'}</p>
            </div>
          </AdminCard>
        ))}
      </div>
    </div>
  );
}

function SolutionsTab({ detail, onChanged, flash }: { detail: AdminClientDetail; onChanged: () => void; flash: (m: string) => void }) {
  const toggle = async (id: string, next: 'active' | 'paused') => {
    const { error } = await setSolutionStatus(id, next);
    flash(error ? `Fehler: ${error}` : next === 'paused' ? 'Lösung pausiert.' : 'Lösung aktiviert.');
    if (!error) onChanged();
  };
  const copyLink = async (instanceKey: string) => {
    const link = portalLinkForInstance(instanceKey);
    try { await navigator.clipboard.writeText(link); flash('Portal-Link kopiert.'); } catch { flash(link); }
  };
  return (
    <div className="space-y-2">
      {detail.solutions.length === 0 ? <AdminCard><p className="text-sm text-gray-500">Keine Lösungen zugewiesen. Nutzen Sie den Assistenten „Neuer Kunde“, um eine Lösung zu provisionieren.</p></AdminCard> : detail.solutions.map((s) => (
        <AdminCard key={s.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">{s.display_name} <Pill label={s.status} tone={solutionTone[s.status]} /></p>
            <p className="text-[12px] text-gray-500">{s.catalog_key} · {s.implementation_key} · <span className="font-mono">{s.instance_key}</span></p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => void copyLink(s.instance_key)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-[13px] font-semibold text-gray-700 hover:border-gray-300"><Copy size={14} /> Link</button>
            {s.status === 'paused' ? (
              <button type="button" onClick={() => void toggle(s.id, 'active')} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-[13px] font-semibold text-emerald-700 hover:bg-emerald-100"><Play size={14} /> Aktivieren</button>
            ) : (
              <button type="button" onClick={() => void toggle(s.id, 'paused')} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 text-[13px] font-semibold text-amber-700 hover:bg-amber-100"><Pause size={14} /> Pausieren</button>
            )}
          </div>
        </AdminCard>
      ))}
    </div>
  );
}

function BudgetTab({ detail }: { detail: AdminClientDetail }) {
  const a = detail.account!;
  return (
    <div className="space-y-4">
      <AdminCard>
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400">Kundenkonto</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <MoneyRow label="Gesamtbudget" cents={a.estimated_total_budget_cents} currency={a.currency} />
          <MoneyRow label="Monatswert" cents={a.estimated_monthly_value_cents} currency={a.currency} />
        </div>
      </AdminCard>
      <div className="space-y-2">
        {detail.engagements.map((e) => (
          <AdminCard key={e.id} className="p-4">
            <p className="text-sm font-semibold text-gray-900">{e.project_name} <Pill label={e.status} tone={e.status === 'active' ? 'success' : 'neutral'} /></p>
            <div className="mt-2 grid gap-2 sm:grid-cols-3 text-[13px] text-gray-600">
              <span>Budget: {formatCents(e.total_budget_cents, e.currency)}</span>
              <span>Setup: {formatCents(e.setup_fee_cents, e.currency)}</span>
              <span>Monatlich: {formatCents(e.recurring_fee_cents, e.currency)}</span>
            </div>
          </AdminCard>
        ))}
      </div>
    </div>
  );
}

function AccessTab({ detail, onChanged, flash }: { detail: AdminClientDetail; onChanged: () => void; flash: (m: string) => void }) {
  const resend = async (invitationId: string, renewExpired = false) => {
    const { ok, outcome, error } = await resendInvitationViaEdge(invitationId, renewExpired);
    flash(outcome ? resendOutcomeMessage(outcome, renewExpired) : ok ? 'Einladung gesendet.' : `Fehler: ${error ?? 'unbekannt'}`);
    if (ok) onChanged();
  };
  const revoke = async (id: string) => {
    const { error } = await revokeInvitation(id);
    flash(error ? `Fehler: ${error}` : 'Einladung widerrufen.');
    if (!error) onChanged();
  };
  return (
    <div className="space-y-2">
      {detail.invitations.length === 0 ? <AdminCard><p className="text-sm text-gray-500">Keine Einladungen.</p></AdminCard> : detail.invitations.map((inv) => {
        const eff = effectiveInvitationStatus(inv);
        return (
          <AdminCard key={inv.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">{inv.email} <Pill label={eff} tone={invitationTone[eff]} /></p>
              <p className="text-[12px] text-gray-500">Rolle: {inv.organization_role}{inv.expires_at ? ` · läuft ab ${new Date(inv.expires_at).toLocaleDateString('de-DE')}` : ''}</p>
            </div>
            <div className="flex gap-2">
              {canResendInvitation(eff) ? (
                <button type="button" onClick={() => void resend(inv.id)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-[13px] font-semibold text-gray-700 hover:border-gray-300"><RefreshCw size={14} /> Erneut senden</button>
              ) : null}
              {canRenewInvitation(eff) ? (
                <button type="button" onClick={() => void resend(inv.id, true)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 text-[13px] font-semibold text-amber-700 hover:bg-amber-100"><RefreshCw size={14} /> Erneuern & senden</button>
              ) : null}
              {canResendInvitation(eff) ? (
                <button type="button" onClick={() => void revoke(inv.id)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 text-[13px] font-semibold text-red-700 hover:bg-red-100"><XCircle size={14} /> Widerrufen</button>
              ) : null}
            </div>
          </AdminCard>
        );
      })}
    </div>
  );
}

function ActivityTab() {
  return <AdminCard><p className="text-sm text-gray-500">Aktivitätsverlauf folgt. Es werden keine Ereignisse simuliert.</p></AdminCard>;
}

function MoneyRow({ label, cents, currency }: { label: string; cents: number | null; currency: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5">
      <span className="text-[13px] font-medium text-gray-600">{label}</span>
      <span className="text-sm font-semibold text-gray-900">{formatCents(cents, currency)}</span>
    </div>
  );
}
