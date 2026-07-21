import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';

import { AdminCard, AdminField, AdminSelect } from '@/pages/admin/clients/adminUi';
import {
  provisionClientViaEdge,
  type ProvisionClientPayload,
  type ProvisionClientResult,
} from '@/lib/clientPlatform/adminApi';
import { clientLifecycleStatuses, solutionCatalogKeys } from '@/lib/clientPlatform/types';
import { isValidEmail, isValidUrl, parseAmountToCents } from '@/lib/clientPlatform/validation';

// One stable idempotency key per intended submission (per wizard mount). Retries of the same
// submission reuse it so the server replays instead of creating a duplicate workspace; a brand new
// client is a fresh mount and therefore a fresh key. Uses only cryptographically secure browser
// APIs — never Math.random — since this is a database identity.
function newIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const steps = ['Unternehmen', 'Ansprechpartner', 'Vertrag & Budget', 'Lösung & Zugang'];

interface FormState {
  displayName: string;
  legalName: string;
  industry: string;
  website: string;
  address: string;
  leadSource: string;
  lifecycleStatus: string;
  contactName: string;
  email: string;
  phone: string;
  totalBudget: string;
  setupFee: string;
  monthlyFee: string;
  currency: string;
  targetGoLiveDate: string;
  internalOwner: string;
  internalNotes: string;
  catalogKey: string;
  solutionDisplayName: string;
  sendInvitation: boolean;
}

const initialForm: FormState = {
  displayName: '',
  legalName: '',
  industry: '',
  website: '',
  address: '',
  leadSource: '',
  lifecycleStatus: 'active',
  contactName: '',
  email: '',
  phone: '',
  totalBudget: '',
  setupFee: '',
  monthlyFee: '',
  currency: 'EUR',
  targetGoLiveDate: '',
  internalOwner: '',
  internalNotes: '',
  catalogKey: 'ai_receptionist',
  solutionDisplayName: '',
  sendInvitation: true,
};

export function NewClientWizard() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ProvisionClientResult | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [idempotencyKey] = useState(newIdempotencyKey);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  function validateStep(current: number): boolean {
    const next: Record<string, string> = {};
    if (current === 0) {
      if (!form.displayName.trim()) next.displayName = 'Firmenname ist erforderlich.';
      if (form.website && !isValidUrl(form.website)) next.website = 'Bitte eine gültige URL (https://…) eingeben.';
    }
    if (current === 1) {
      if (!form.email.trim() || !isValidEmail(form.email)) next.email = 'Eine gültige E-Mail ist erforderlich.';
    }
    if (current === 2) {
      for (const [key, field] of [['totalBudget', 'totalBudget'], ['setupFee', 'setupFee'], ['monthlyFee', 'monthlyFee']] as const) {
        const parsed = parseAmountToCents(form[field]);
        if ('error' in parsed) next[key] = parsed.error;
      }
    }
    if (current === 3) {
      if (!form.solutionDisplayName.trim()) next.solutionDisplayName = 'Anzeigename der Lösung ist erforderlich.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function goNext() {
    if (validateStep(step)) setStep((s) => Math.min(steps.length - 1, s + 1));
  }

  async function handleSubmit() {
    if (!validateStep(3)) return;
    // Validate all money fields once more for the payload.
    const total = parseAmountToCents(form.totalBudget);
    const setup = parseAmountToCents(form.setupFee);
    const monthly = parseAmountToCents(form.monthlyFee);
    if ('error' in total || 'error' in setup || 'error' in monthly) {
      setStep(2);
      return;
    }

    const payload: ProvisionClientPayload = {
      idempotencyKey,
      displayName: form.displayName.trim(),
      legalName: form.legalName.trim() || null,
      primaryContactName: form.contactName.trim() || null,
      primaryEmail: form.email.trim() || null,
      phone: form.phone.trim() || null,
      website: form.website.trim() || null,
      industry: form.industry.trim() || null,
      address: form.address.trim() || null,
      leadSource: form.leadSource.trim() || null,
      lifecycleStatus: form.lifecycleStatus,
      internalNotes: form.internalNotes.trim() || null,
      internalOwner: form.internalOwner.trim() || null,
      currency: form.currency.trim().toUpperCase() || 'EUR',
      estimatedTotalBudgetCents: total.cents,
      estimatedMonthlyValueCents: monthly.cents,
      catalogKey: form.catalogKey,
      projectName: form.solutionDisplayName.trim() || form.displayName.trim(),
      engagementStatus: 'active',
      totalBudgetCents: total.cents,
      setupFeeCents: setup.cents,
      recurringFeeCents: monthly.cents,
      targetGoLiveDate: form.targetGoLiveDate || null,
      solutionDisplayName: form.solutionDisplayName.trim(),
      invitationEmail: form.email.trim().toLowerCase(),
      organizationRole: 'owner',
      sendInvitation: form.sendInvitation,
    };

    setSubmitting(true);
    setSubmitError(null);
    const res = await provisionClientViaEdge(payload);
    setSubmitting(false);
    if (!res.ok) {
      setSubmitError(res.error ?? 'Provisionierung fehlgeschlagen.');
      return;
    }
    setResult(res);
  }

  if (result?.ok) {
    const workspace = (result.workspace ?? {}) as Record<string, string>;
    const invitation = (result.invitation ?? {}) as Record<string, string>;
    return (
      <div className="mx-auto max-w-2xl">
        <AdminCard>
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700">
            <CheckCircle2 size={20} aria-hidden="true" />
          </div>
          <h1 className="text-xl font-semibold text-gray-950">Client-Workspace erstellt</h1>
          <ul className="mt-5 space-y-2 text-sm text-gray-700">
            <ResultRow label="Organisation" ok value="angelegt" />
            <ResultRow label="CRM-Konto" ok value="angelegt" />
            <ResultRow label="Engagement" ok value="angelegt" />
            <ResultRow label="Lösung zugewiesen" ok value={(workspace.instance_key as string) ?? 'zugewiesen'} />
            <ResultRow
              label="Einladung"
              ok={invitation.status !== 'email_error'}
              value={describeInvite(invitation)}
            />
          </ul>
          <div className="mt-6 flex gap-3">
            <Link to={`/admin/clients/${workspace.organization_id}`} className="inline-flex h-11 items-center rounded-xl bg-gray-950 px-4 text-sm font-semibold text-white hover:bg-gray-800">
              Kunden öffnen
            </Link>
            <Link to="/admin/clients" className="inline-flex h-11 items-center rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 hover:border-gray-300">
              Zur Kundenliste
            </Link>
          </div>
        </AdminCard>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-950">Neuer Kunde</h1>
          <p className="mt-1 text-sm text-gray-500">Schritt {step + 1} von {steps.length}: {steps[step]}</p>
        </div>
        <Link to="/admin/clients" className="text-sm font-semibold text-gray-500 hover:text-gray-950">Abbrechen</Link>
      </div>

      <div className="flex gap-2">
        {steps.map((label, index) => (
          <div key={label} className={`h-1.5 flex-1 rounded-full ${index <= step ? 'bg-gray-950' : 'bg-gray-200'}`} />
        ))}
      </div>

      <AdminCard>
        {step === 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <AdminField id="displayName" label="Firma / Anzeigename" value={form.displayName} onChange={(v) => set('displayName', v)} error={errors.displayName} required />
            <AdminField id="legalName" label="Rechtlicher Name" value={form.legalName} onChange={(v) => set('legalName', v)} />
            <AdminField id="industry" label="Branche" value={form.industry} onChange={(v) => set('industry', v)} />
            <AdminField id="website" label="Website" value={form.website} onChange={(v) => set('website', v)} placeholder="https://…" error={errors.website} />
            <div className="sm:col-span-2">
              <AdminField id="address" label="Adresse" value={form.address} onChange={(v) => set('address', v)} />
            </div>
            <AdminField id="leadSource" label="Lead-Quelle" value={form.leadSource} onChange={(v) => set('leadSource', v)} />
            <AdminSelect id="lifecycleStatus" label="Lifecycle-Status" value={form.lifecycleStatus} onChange={(v) => set('lifecycleStatus', v)} options={clientLifecycleStatuses.map((s) => ({ value: s, label: s }))} />
          </div>
        ) : null}

        {step === 1 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <AdminField id="contactName" label="Ansprechpartner" value={form.contactName} onChange={(v) => set('contactName', v)} />
            <AdminField id="email" label="E-Mail (Einladung)" value={form.email} onChange={(v) => set('email', v)} type="email" error={errors.email} required />
            <AdminField id="phone" label="Telefon" value={form.phone} onChange={(v) => set('phone', v)} />
          </div>
        ) : null}

        {step === 2 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <AdminField id="totalBudget" label="Gesamtbudget" value={form.totalBudget} onChange={(v) => set('totalBudget', v)} placeholder="z. B. 5000,00" error={errors.totalBudget} />
            <AdminSelect id="currency" label="Währung" value={form.currency} onChange={(v) => set('currency', v)} options={[{ value: 'EUR', label: 'EUR' }, { value: 'CHF', label: 'CHF' }, { value: 'USD', label: 'USD' }]} />
            <AdminField id="setupFee" label="Setup-Gebühr" value={form.setupFee} onChange={(v) => set('setupFee', v)} placeholder="z. B. 1000,00" error={errors.setupFee} />
            <AdminField id="monthlyFee" label="Monatliche Gebühr" value={form.monthlyFee} onChange={(v) => set('monthlyFee', v)} placeholder="z. B. 250,00" error={errors.monthlyFee} />
            <AdminField id="targetGoLiveDate" label="Ziel-Go-Live" value={form.targetGoLiveDate} onChange={(v) => set('targetGoLiveDate', v)} type="date" />
            <AdminField id="internalOwner" label="Interner Owner" value={form.internalOwner} onChange={(v) => set('internalOwner', v)} />
            <div className="sm:col-span-2">
              <label htmlFor="internalNotes" className="mb-1.5 block text-[12px] font-semibold text-gray-600">Interne Notizen</label>
              <textarea id="internalNotes" value={form.internalNotes} onChange={(e) => set('internalNotes', e.target.value)} rows={3} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-400" />
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <AdminSelect id="catalogKey" label="Lösungstyp" value={form.catalogKey} onChange={(v) => set('catalogKey', v)} options={solutionCatalogKeys.map((s) => ({ value: s, label: s.replace(/_/g, ' ') }))} />
            <AdminField id="solutionDisplayName" label="Anzeigename der Lösung" value={form.solutionDisplayName} onChange={(v) => set('solutionDisplayName', v)} error={errors.solutionDisplayName} required />
            <div className="sm:col-span-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
              <p className="text-[12px] text-gray-500">Implementierung und Instanz-Schlüssel werden serverseitig aus dem kontrollierten Lösungskatalog abgeleitet und nach dem Anlegen angezeigt.</p>
            </div>
            <label className="sm:col-span-2 flex items-start gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3">
              <input type="checkbox" checked={form.sendInvitation} onChange={(e) => set('sendInvitation', e.target.checked)} className="mt-1 h-4 w-4 rounded border-gray-300" />
              <span>
                <span className="block text-sm font-semibold text-gray-900">Einladung jetzt senden</span>
                <span className="mt-1 block text-[12.5px] text-gray-500">Sendet eine Auth-Einladung an {form.email || 'die Kontakt-E-Mail'}. Die Datenbank-Einladung bleibt so oder so bestehen.</span>
              </span>
            </label>
          </div>
        ) : null}

        {submitError ? <p className="mt-4 text-sm text-red-600">{submitError}</p> : null}
      </AdminCard>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 disabled:opacity-50"
        >
          <ArrowLeft size={16} aria-hidden="true" /> Zurück
        </button>
        {step < steps.length - 1 ? (
          <button type="button" onClick={goNext} className="inline-flex h-11 items-center gap-2 rounded-xl bg-gray-950 px-4 text-sm font-semibold text-white hover:bg-gray-800">
            Weiter <ArrowRight size={16} aria-hidden="true" />
          </button>
        ) : (
          <button type="button" onClick={() => void handleSubmit()} disabled={submitting} className="inline-flex h-11 items-center gap-2 rounded-xl bg-gray-950 px-4 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60">
            {submitting ? <><Loader2 size={16} className="animate-spin" aria-hidden="true" /> Erstelle…</> : 'Kunde anlegen'}
          </button>
        )}
      </div>
    </div>
  );
}

function ResultRow({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <li className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5">
      <span className="font-medium text-gray-700">{label}</span>
      <span className={ok ? 'text-emerald-700' : 'text-amber-700'}>{value}</span>
    </li>
  );
}

function describeInvite(invitation: Record<string, string>): string {
  switch (invitation.status) {
    case 'sent': return 'gesendet';
    case 'existing_user': return 'bestehender Nutzer – Zugang beim nächsten Login';
    case 'email_error': return 'E-Mail-Fehler (Einladung bleibt offen)';
    case undefined: return 'ausstehend';
    default: return invitation.skipped ? 'nicht gesendet' : 'ausstehend';
  }
}
