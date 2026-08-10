import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Copy, ExternalLink, Pause, Play, Plus, RefreshCw, XCircle } from 'lucide-react';

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
import { AccessRolesSection } from '@/pages/admin/clients/AccessRolesSection';
import { CustomerProjectPanel } from '@/components/finance/CustomerProjectPanel';
import {
  loadOrganizationCommercialOverview,
  type OrganizationCommercialOverview,
} from '@/lib/ownerFinance/organizationCommercial';
import { offerStatusLabel } from '@/lib/ownerFinance/customerLabels';

const tabs = ['Übersicht', 'Kontakte', 'Lösungen', 'Vertrag & Budget', 'Kommerziell', 'Zugang', 'Zugriff & Rollen', 'Kundenportal', 'Aktivität'] as const;
type Tab = (typeof tabs)[number];

/**
 * A readable message from whatever was thrown.
 *
 * `String(e)` was used here, and PostgREST rejects with a PLAIN OBJECT rather than an Error
 * — so a failed load rendered the literal text "Fehler: [object Object]" at the operator.
 * Every shape the client can throw is unwrapped before falling back to a German sentence.
 */
function errorMessageOf(value: unknown): string {
  if (value instanceof Error && value.message) return value.message;
  if (typeof value === 'string' && value.trim()) return value;
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    for (const key of ['message', 'error_description', 'error', 'details', 'hint']) {
      const candidate = record[key];
      if (typeof candidate === 'string' && candidate.trim()) return candidate;
    }
  }
  return 'Unbekannter Fehler.';
}

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
      setError(errorMessageOf(e));
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => { void reload(); }, [reload]);

  const flash = (message: string) => { setNotice(message); setTimeout(() => setNotice(null), 3000); };

  if (loading) return <div className="h-40 animate-pulse rounded-2xl border border-gray-100 bg-white" />;
  if (error) {
    return (
      <AdminCard>
        <div role="alert" data-qa="error-state">
          <p className="text-sm font-semibold text-gray-950">Der Kunde konnte nicht geladen werden.</p>
          <p className="mt-1.5 text-sm text-red-600">{error}</p>
        </div>
        <button
          type="button"
          onClick={() => void reload()}
          className="mt-4 inline-flex min-h-11 items-center justify-center rounded-control border border-gray-200 bg-white px-4 text-[13.5px] font-semibold text-gray-700 transition-colors duration-fast ease-premium hover:border-gray-300 hover:bg-gray-50 hover:text-gray-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950/25 focus-visible:ring-offset-2"
        >
          Erneut laden
        </button>
      </AdminCard>
    );
  }
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
      {tab === 'Kommerziell' ? <CommercialTab organizationId={detail.organizationId} /> : null}
      {tab === 'Zugang' ? <AccessTab detail={detail} onChanged={() => void reload()} flash={flash} /> : null}
      {tab === 'Zugriff & Rollen' ? <AccessRolesSection organizationId={detail.organizationId} /> : null}
      {tab === 'Kundenportal' ? <PortalTab detail={detail} /> : null}
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

// Canonical customer-portal project management, scoped directly by organizationId —
// this is the actual integration point: the CRM-side owner_customers row that the
// Owner Finance panel usage relies on does not exist for most real portal customers
// (e.g. Pankofer) and is never required, created, backfilled or merged here.
function PortalTab({ detail }: { detail: AdminClientDetail }) {
  return (
    <CustomerProjectPanel
      organizationId={detail.organizationId}
      clientAccountId={detail.account?.id ?? null}
    />
  );
}

const invoiceStatusLabel: Record<string, string> = {
  draft: 'Entwurf', issued: 'Gestellt', partially_paid: 'Teilbezahlt', paid: 'Bezahlt',
  overdue: 'Überfällig', void: 'Storniert', cancelled: 'Storniert', credited: 'Gutgeschrieben',
};

const invoicePillTone: Record<string, 'neutral' | 'success' | 'warning' | 'danger' | 'info'> = {
  draft: 'neutral', issued: 'info', partially_paid: 'warning', paid: 'success',
  overdue: 'danger', void: 'neutral', cancelled: 'neutral', credited: 'neutral',
};

const offerPillTone: Record<string, 'neutral' | 'success' | 'warning' | 'danger' | 'info'> = {
  draft: 'neutral', finalized: 'info', sent: 'info', viewed: 'warning',
  accepted: 'success', rejected: 'danger', expired: 'warning', cancelled: 'neutral', converted: 'success',
};

/**
 * Organization-scoped commercial overview.
 *
 * This is the missing half of the canonical customer page: offers and invoices are
 * scoped by organization_id, but every existing surface for them hung off the Finance
 * CRM's owner_customers table — which most real portal customers, Pankofer included, do
 * not have a row in. So a customer with five offers and an invoice showed nothing here.
 * Nothing below requires, creates, backfills or merges an owner_customers row.
 */
function CommercialTab({ organizationId }: { organizationId: string }) {
  const [data, setData] = useState<OrganizationCommercialOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: overview, error: err } = await loadOrganizationCommercialOverview(organizationId);
    if (err) { setError(err); setLoading(false); return; }
    setError(null);
    setData(overview);
    setLoading(false);
  }, [organizationId]);

  useEffect(() => { void load(); }, [load]);

  if (loading) {
    return (
      <div aria-label="Kommerzielle Daten werden geladen" className="space-y-3">
        <div className="h-24 animate-pulse rounded-2xl border border-gray-100 bg-white" />
        <div className="h-40 animate-pulse rounded-2xl border border-gray-100 bg-white" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <AdminCard>
        <div role="alert">
          <p className="text-sm font-semibold text-gray-900">Kommerzielle Daten konnten nicht geladen werden</p>
          <p className="mt-1 text-[13px] text-gray-500">
            Angebote und Rechnungen sind nur für Plattform-Administratoren sichtbar.
          </p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-3 inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-[13px] font-semibold text-gray-700 hover:border-gray-300"
          >
            <RefreshCw size={14} /> Erneut versuchen
          </button>
        </div>
      </AdminCard>
    );
  }

  const outstanding = Object.entries(data.outstandingCentsByCurrency);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <CountCard label="Angebote" count={data.offers.length} />
        <CountCard label="Rechnungen" count={data.invoices.length} />
        <AdminCard className="p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400">Offen</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-gray-950">
            {outstanding.length === 0
              ? '—'
              : outstanding.map(([currency, cents]) => formatCents(cents, currency)).join(' · ')}
          </p>
        </AdminCard>
      </div>

      <AdminCard>
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400">
          Angebote ({data.offers.length})
        </p>
        {data.offers.length === 0 ? (
          <p className="text-sm text-gray-500">Für diesen Kunden sind keine Angebote erfasst.</p>
        ) : (
          <ul className="space-y-2">
            {data.offers.map((o) => (
              <li key={o.id}>
                <Link
                  to={`/admin/finance/offers/${o.id}`}
                  className="flex flex-col gap-2 rounded-xl border border-gray-100 px-3 py-2.5 hover:border-gray-300 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-gray-900">
                      {o.offer_number ?? 'Entwurf'}
                      {o.title ? <span className="font-normal text-gray-500"> · {o.title}</span> : null}
                    </span>
                    <span className="mt-0.5 block text-[12px] text-gray-500">
                      {o.issue_date ? new Date(o.issue_date).toLocaleDateString('de-DE') : 'ohne Datum'}
                      {o.valid_until ? ` · gültig bis ${new Date(o.valid_until).toLocaleDateString('de-DE')}` : ''}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-3">
                    <Pill label={offerStatusLabel[o.status] ?? o.status} tone={offerPillTone[o.status] ?? 'neutral'} />
                    <span className="text-sm font-semibold tabular-nums text-gray-900">
                      {formatCents(o.gross_total_cents, o.currency)}
                    </span>
                    <ExternalLink size={14} className="text-gray-400" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>

      <AdminCard>
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400">
          Rechnungen ({data.invoices.length})
        </p>
        {data.invoices.length === 0 ? (
          <p className="text-sm text-gray-500">Für diesen Kunden sind keine Rechnungen erfasst.</p>
        ) : (
          <ul className="space-y-2">
            {data.invoices.map((i) => {
              const open = Math.max(i.gross_total_cents - i.amount_paid_cents, 0);
              return (
                <li key={i.id}>
                  <Link
                    to={`/admin/finance/invoices/${i.id}`}
                    className="flex flex-col gap-2 rounded-xl border border-gray-100 px-3 py-2.5 hover:border-gray-300 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-gray-900">
                        {i.invoice_number ?? 'Entwurf'}
                      </span>
                      <span className="mt-0.5 block text-[12px] text-gray-500">
                        {i.issue_date ? new Date(i.issue_date).toLocaleDateString('de-DE') : 'ohne Datum'}
                        {i.due_date ? ` · fällig ${new Date(i.due_date).toLocaleDateString('de-DE')}` : ''}
                        {open > 0 ? ` · offen ${formatCents(open, i.currency)}` : ''}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-3">
                      <Pill label={invoiceStatusLabel[i.status] ?? i.status} tone={invoicePillTone[i.status] ?? 'neutral'} />
                      <span className="text-sm font-semibold tabular-nums text-gray-900">
                        {formatCents(i.gross_total_cents, i.currency)}
                      </span>
                      <ExternalLink size={14} className="text-gray-400" aria-hidden="true" />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </AdminCard>

      <p className="text-[12px] leading-relaxed text-gray-400">
        Angebote und Rechnungen werden ausschließlich über die Organisation zugeordnet. Für die
        Freigabe eines PDFs im Kundenportal öffnen Sie den jeweiligen Beleg und nutzen dort den
        Abschnitt „Kundenportal“.
      </p>
    </div>
  );
}

function CountCard({ label, count }: { label: string; count: number }) {
  return (
    <AdminCard className="p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-gray-950">{count}</p>
    </AdminCard>
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
