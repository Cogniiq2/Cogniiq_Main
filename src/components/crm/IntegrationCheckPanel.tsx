import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ShieldAlert } from 'lucide-react';

import {
  Button, Card, Field, InfoBanner, SectionHeader, Select, StatusBadge,
  Textarea, border, text, useToast,
} from '@/components/dashboard';
import { cn } from '@/lib/utils';
import { saveIntegrationCheck, type IntegrationCheckPatch } from '@/lib/ownerCrm/api';
import {
  INTEGRATION_OPERATIONS, INTERFACE_TYPE_ORDER,
  LEAD_INTEGRATION_MODE_ORDER, PARTNER_APPROVAL_ORDER,
  integrationCheckStatusLabel, integrationCheckStatusTone, interfaceTypeLabel,
  leadIntegrationModeDescription, leadIntegrationModeLabel, partnerApprovalLabel,
} from '@/lib/ownerCrm/catalog';
import { missingIntegrationAnswers, openCustomerDisclosures } from '@/lib/ownerCrm/nextActions';
import { centsToEuroInput, parseEuroToCents } from '@/lib/ownerCrm/format';
import { formatCentsCurrencyDe } from '@/lib/ownerFinance/exports';
import type { LeadIntegrationCheck } from '@/lib/ownerCrm/types';

/**
 * The PRE-OFFER gate: PVS erfassen → Schnittstelle prüfen → Drittanbieter-Kosten
 * prüfen → Kunden informieren → im Angebot dokumentieren.
 *
 * This is deliberately NOT the engagement's integration section. That one is
 * filled in after the contract, to build the thing. This one is filled in before
 * the offer, to find out whether it can be built at all and what a third party
 * will charge the client for it — which is the difference between a scoped offer
 * and a surprise invoice after signature.
 *
 * Every operation toggle is genuinely tri-state. "Unbekannt" is the default and
 * stays the default: an operation nobody has verified must never be shown, or
 * sold, as supported.
 */

type TriValue = '' | 'true' | 'false';

const TRI_OPTIONS = [
  { value: '', label: 'Unbekannt' },
  { value: 'true', label: 'Ja' },
  { value: 'false', label: 'Nein' },
];

function tri(value: boolean | null | undefined): TriValue {
  if (value === true) return 'true';
  if (value === false) return 'false';
  return '';
}

interface FormState {
  pvs_name: string; pvs_vendor: string; pvs_version: string; appointment_system: string;
  interface_type: string;
  api_documentation_obtained: TriValue; api_access_included: TriValue;
  partner_approval_required: TriValue; partner_approval_status: string;
  sandbox_available: TriValue;
  supports_availability: TriValue; supports_booking: TriValue; supports_reschedule: TriValue;
  supports_cancel: TriValue; supports_patient_write: TriValue;
  rate_limits: string; vendor_restrictions: string;
  third_party_setup: string; third_party_monthly: string; third_party_cost_note: string;
  third_party_costs_confirmed: boolean;
  integration_mode: string; fallback_description: string;
  customer_informed: boolean; documented_in_offer: boolean;
  notes: string;
}

const EMPTY: FormState = {
  pvs_name: '', pvs_vendor: '', pvs_version: '', appointment_system: '',
  interface_type: '',
  api_documentation_obtained: '', api_access_included: '',
  partner_approval_required: '', partner_approval_status: '',
  sandbox_available: '',
  supports_availability: '', supports_booking: '', supports_reschedule: '',
  supports_cancel: '', supports_patient_write: '',
  rate_limits: '', vendor_restrictions: '',
  third_party_setup: '', third_party_monthly: '', third_party_cost_note: '',
  third_party_costs_confirmed: false,
  integration_mode: '', fallback_description: '',
  customer_informed: false, documented_in_offer: false,
  notes: '',
};

function toForm(check: LeadIntegrationCheck | null): FormState {
  if (!check) return EMPTY;
  return {
    pvs_name: check.pvs_name ?? '', pvs_vendor: check.pvs_vendor ?? '',
    pvs_version: check.pvs_version ?? '', appointment_system: check.appointment_system ?? '',
    interface_type: check.interface_type ?? '',
    api_documentation_obtained: tri(check.api_documentation_obtained),
    api_access_included: tri(check.api_access_included),
    partner_approval_required: tri(check.partner_approval_required),
    partner_approval_status: check.partner_approval_status ?? '',
    sandbox_available: tri(check.sandbox_available),
    supports_availability: tri(check.supports_availability),
    supports_booking: tri(check.supports_booking),
    supports_reschedule: tri(check.supports_reschedule),
    supports_cancel: tri(check.supports_cancel),
    supports_patient_write: tri(check.supports_patient_write),
    rate_limits: check.rate_limits ?? '', vendor_restrictions: check.vendor_restrictions ?? '',
    third_party_setup: centsToEuroInput(check.third_party_setup_cents),
    third_party_monthly: centsToEuroInput(check.third_party_monthly_cents),
    third_party_cost_note: check.third_party_cost_note ?? '',
    third_party_costs_confirmed: check.third_party_costs_confirmed,
    integration_mode: check.integration_mode ?? '',
    fallback_description: check.fallback_description ?? '',
    customer_informed: check.customer_informed_at !== null,
    documented_in_offer: check.documented_in_offer_at !== null,
    notes: check.notes ?? '',
  };
}

export function IntegrationCheckPanel({ leadId, check, onSaved }: {
  leadId: string;
  check: LeadIntegrationCheck | null;
  onSaved: () => void | Promise<void>;
}) {
  const toast = useToast();
  const [form, setForm] = useState<FormState>(() => toForm(check));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setForm(toForm(check)); setError(null); }, [check]);

  const set = (patch: Partial<FormState>) => setForm((s) => ({ ...s, ...patch }));

  const status = check?.status ?? 'not_started';
  // Computed from the SAVED record, not the draft: it answers "what does the
  // server still refuse", and the server has only seen what was saved.
  const missing = useMemo(() => missingIntegrationAnswers(check), [check]);
  const disclosures = useMemo(() => openCustomerDisclosures(check), [check]);

  const buildPatch = (nextStatus?: string): IntegrationCheckPatch => {
    const now = new Date().toISOString();
    return {
      pvs_name: form.pvs_name.trim() || null,
      pvs_vendor: form.pvs_vendor.trim() || null,
      pvs_version: form.pvs_version.trim() || null,
      appointment_system: form.appointment_system.trim() || null,
      interface_type: form.interface_type || null,
      api_documentation_obtained: form.api_documentation_obtained || null,
      api_access_included: form.api_access_included || null,
      partner_approval_required: form.partner_approval_required || null,
      partner_approval_status: form.partner_approval_status || null,
      sandbox_available: form.sandbox_available || null,
      supports_availability: form.supports_availability || null,
      supports_booking: form.supports_booking || null,
      supports_reschedule: form.supports_reschedule || null,
      supports_cancel: form.supports_cancel || null,
      supports_patient_write: form.supports_patient_write || null,
      rate_limits: form.rate_limits.trim() || null,
      vendor_restrictions: form.vendor_restrictions.trim() || null,
      third_party_setup_cents: parseEuroToCents(form.third_party_setup),
      third_party_monthly_cents: parseEuroToCents(form.third_party_monthly),
      third_party_cost_note: form.third_party_cost_note.trim() || null,
      third_party_costs_confirmed: form.third_party_costs_confirmed,
      integration_mode: form.integration_mode || null,
      fallback_description: form.fallback_description.trim() || null,
      // Checkbox → timestamp. Keep the original stamp when it is already set, so
      // re-saving does not rewrite when the client was actually informed.
      customer_informed_at: form.customer_informed ? (check?.customer_informed_at ?? now) : null,
      documented_in_offer_at: form.documented_in_offer ? (check?.documented_in_offer_at ?? now) : null,
      notes: form.notes.trim() || null,
      ...(nextStatus ? { status: nextStatus } : {}),
    };
  };

  const save = async (nextStatus?: string) => {
    setSaving(true);
    setError(null);
    try {
      const { error: err } = await saveIntegrationCheck(leadId, buildPatch(nextStatus));
      if (err) {
        // This is the database gate refusing, not a validation hint. Show it as is.
        setError(err);
        return;
      }
      toast.success(nextStatus === 'complete' ? 'Prüfung abgeschlossen' : 'Prüfung gespeichert');
      await onSaved();
    } finally {
      setSaving(false);
    }
  };

  const thirdPartyTotal = (check?.third_party_setup_cents ?? 0) + (check?.third_party_monthly_cents ?? 0);

  return (
    <Card>
      <SectionHeader
        title="Schnittstellen- und Kostenprüfung"
        description="Vor dem Angebot zu klären: PVS erfassen → Schnittstelle prüfen → Drittanbieter-Kosten prüfen → Kunden informieren → im Angebot dokumentieren."
        action={<StatusBadge label={integrationCheckStatusLabel[status]} tone={integrationCheckStatusTone[status]} />}
      />

      <div className="mt-4 space-y-5">
        {error ? <InfoBanner tone="danger" title="Prüfung nicht abgeschlossen">{error}</InfoBanner> : null}

        {status === 'complete' ? (
          <div className={cn('flex items-start gap-2 rounded-[10px] border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[12px] leading-5 text-emerald-800')}>
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-medium">Technisch geprüft — das Angebot kann kalkuliert werden.</p>
              {thirdPartyTotal > 0 ? (
                <p className="mt-0.5">
                  Bekannte Drittanbieter-Kosten:
                  {check?.third_party_setup_cents ? ` einmalig ${formatCentsCurrencyDe(check.third_party_setup_cents)}` : ''}
                  {check?.third_party_monthly_cents ? `${check?.third_party_setup_cents ? ',' : ''} monatlich ${formatCentsCurrencyDe(check.third_party_monthly_cents)}` : ''}
                  . Diese gehören ausdrücklich ins Angebot.
                </p>
              ) : (
                <p className="mt-0.5">Es wurden keine Drittanbieter-Kosten hinterlegt.</p>
              )}
            </div>
          </div>
        ) : (
          <InfoBanner tone={missing.length > 0 ? 'warning' : 'info'} title="Offen vor dem Angebot">
            {missing.length === 0 ? (
              <p>Alle Pflichtangaben liegen vor. Die Prüfung kann abgeschlossen werden.</p>
            ) : (
              <ul className="mt-1 list-inside list-disc space-y-0.5">
                {missing.map((m) => <li key={m}>{m}</li>)}
              </ul>
            )}
          </InfoBanner>
        )}

        {disclosures.length > 0 ? (
          <InfoBanner tone="warning" title="Zusagen gegenüber dem Kunden noch offen">
            <ul className="mt-1 list-inside list-disc space-y-0.5">
              {disclosures.map((d) => <li key={d}>{d}</li>)}
            </ul>
          </InfoBanner>
        ) : null}

        {/* --------------------------------------------------------- Systems */}
        <fieldset className="grid gap-3 sm:grid-cols-2">
          <legend className={cn('mb-1.5', text.label)}>Bestandssysteme</legend>
          <Field id="ic-pvs" label="Praxissoftware (PVS)" value={form.pvs_name} onChange={(v) => set({ pvs_name: v })} placeholder="z. B. tomedo" />
          <Field id="ic-vendor" label="Hersteller" value={form.pvs_vendor} onChange={(v) => set({ pvs_vendor: v })} placeholder="z. B. zollsoft" />
          <Field id="ic-version" label="Version" value={form.pvs_version} onChange={(v) => set({ pvs_version: v })} />
          <Field id="ic-appt" label="Termin-/Kalendersystem" value={form.appointment_system} onChange={(v) => set({ appointment_system: v })} />
        </fieldset>

        {/* ------------------------------------------------------- Interface */}
        <fieldset className="grid gap-3 sm:grid-cols-2">
          <legend className={cn('mb-1.5', text.label)}>Schnittstelle</legend>
          <Select
            id="ic-interface" label="Schnittstellenart" value={form.interface_type}
            onChange={(v) => set({ interface_type: v })}
            options={[{ value: '', label: 'Noch nicht geprüft' },
              ...INTERFACE_TYPE_ORDER.map((t) => ({ value: t, label: interfaceTypeLabel[t] }))]}
          />
          <Select
            id="ic-doc" label="API-Dokumentation vorliegend" value={form.api_documentation_obtained}
            onChange={(v) => set({ api_documentation_obtained: v as TriValue })} options={TRI_OPTIONS}
          />
          <Select
            id="ic-access" label="API-Zugang im Vertrag enthalten" value={form.api_access_included}
            onChange={(v) => set({ api_access_included: v as TriValue })} options={TRI_OPTIONS}
          />
          <Select
            id="ic-sandbox" label="Sandbox/Testumgebung" value={form.sandbox_available}
            onChange={(v) => set({ sandbox_available: v as TriValue })} options={TRI_OPTIONS}
          />
          <Select
            id="ic-approval-req" label="Herstellerfreigabe erforderlich" value={form.partner_approval_required}
            onChange={(v) => set({ partner_approval_required: v as TriValue })} options={TRI_OPTIONS}
          />
          <Select
            id="ic-approval" label="Status der Freigabe" value={form.partner_approval_status}
            onChange={(v) => set({ partner_approval_status: v })}
            options={[{ value: '', label: 'Keine Angabe' },
              ...PARTNER_APPROVAL_ORDER.map((p) => ({ value: p, label: partnerApprovalLabel[p] }))]}
          />
        </fieldset>

        {/* ------------------------------------------------------ Operations */}
        <fieldset>
          <legend className={cn('mb-1.5', text.label)}>Unterstützte Vorgänge</legend>
          <p className={cn('mb-2.5', text.hint)}>
            „Unbekannt“ bedeutet ungeprüft — nicht „nein“. Nur bestätigte Vorgänge dürfen im
            Leistungsumfang zugesagt werden.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {INTEGRATION_OPERATIONS.map((op) => (
              <Select
                key={op.key} id={`ic-${op.key}`} label={op.label}
                value={form[op.key]}
                onChange={(v) => set({ [op.key]: v as TriValue } as Partial<FormState>)}
                options={TRI_OPTIONS}
              />
            ))}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field id="ic-rate" label="Rate Limits" value={form.rate_limits} onChange={(v) => set({ rate_limits: v })} />
            <Field id="ic-restrictions" label="Herstellerauflagen" value={form.vendor_restrictions} onChange={(v) => set({ vendor_restrictions: v })} />
          </div>
        </fieldset>

        {/* ----------------------------------------------------------- Costs */}
        <fieldset className="grid gap-3 sm:grid-cols-2">
          <legend className={cn('mb-1.5', text.label)}>Drittanbieter-Kosten</legend>
          <Field id="ic-cost-setup" label="Einmalig (€)" value={form.third_party_setup} onChange={(v) => set({ third_party_setup: v })} inputMode="decimal" />
          <Field id="ic-cost-monthly" label="Monatlich (€)" value={form.third_party_monthly} onChange={(v) => set({ third_party_monthly: v })} inputMode="decimal" />
          <div className="sm:col-span-2">
            <Textarea
              id="ic-cost-note" label="Notiz zu Kosten und Abrechnung" rows={2}
              value={form.third_party_cost_note} onChange={(v) => set({ third_party_cost_note: v })}
              placeholder="Transaktions-/Minutenpreise, Abrechnung über Hersteller oder über Cogniiq …"
            />
          </div>
          <label className="sm:col-span-2 flex items-start gap-2 text-[13px] leading-5">
            <input
              type="checkbox" className="mt-0.5 h-4 w-4"
              checked={form.third_party_costs_confirmed}
              onChange={(e) => set({ third_party_costs_confirmed: e.target.checked })}
            />
            <span>
              Drittanbieter-Kosten sind geprüft und vollständig — auch wenn keine anfallen.
              <span className={cn('block', text.hint)}>
                Ohne diese Bestätigung lässt sich die Prüfung nicht abschließen.
              </span>
            </span>
          </label>
        </fieldset>

        {/* ------------------------------------------------------------ Mode */}
        <fieldset className="grid gap-3">
          <legend className={cn('mb-1.5', text.label)}>Ehrliche Einordnung</legend>
          <Select
            id="ic-mode" label="Automatisierungsgrad" value={form.integration_mode}
            onChange={(v) => set({ integration_mode: v })}
            options={[{ value: '', label: 'Noch nicht geklärt' },
              ...LEAD_INTEGRATION_MODE_ORDER.map((m) => ({ value: m, label: leadIntegrationModeLabel[m] }))]}
            hint={form.integration_mode
              ? leadIntegrationModeDescription[form.integration_mode as keyof typeof leadIntegrationModeDescription]
              : undefined}
          />
          {form.integration_mode && form.integration_mode !== 'full_automation' ? (
            <Textarea
              id="ic-fallback" label="Exakter Fallback" rows={3}
              value={form.fallback_description} onChange={(v) => set({ fallback_description: v })}
              placeholder="Was genau passiert, wenn der Vorgang nicht automatisiert werden kann?"
              hint="Ein Rückruf-Workaround ist keine Automatisierung — er muss als solcher benannt werden."
            />
          ) : null}
        </fieldset>

        {/* ---------------------------------------------------- Disclosures */}
        <fieldset className={cn('space-y-2 rounded-[10px] px-3 py-2.5', border.hairline)}>
          <legend className={cn('mb-1.5', text.label)}>Kundeninformation</legend>
          <label className="flex items-start gap-2 text-[13px] leading-5">
            <input type="checkbox" className="mt-0.5 h-4 w-4" checked={form.customer_informed} onChange={(e) => set({ customer_informed: e.target.checked })} />
            <span>Kunde wurde über Integrationsumfang und Drittanbieter-Kosten informiert</span>
          </label>
          <label className="flex items-start gap-2 text-[13px] leading-5">
            <input type="checkbox" className="mt-0.5 h-4 w-4" checked={form.documented_in_offer} onChange={(e) => set({ documented_in_offer: e.target.checked })} />
            <span>Integrationsumfang und Kosten sind im Angebot dokumentiert</span>
          </label>
        </fieldset>

        <Textarea id="ic-notes" label="Interne Notizen" rows={3} value={form.notes} onChange={(v) => set({ notes: v })} />

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={() => void save('in_progress')} loading={saving}>
            Speichern
          </Button>
          <Button onClick={() => void save('complete')} loading={saving}>
            <ShieldAlert size={15} aria-hidden="true" /> Prüfung abschließen
          </Button>
          {status !== 'blocked' ? (
            <Button variant="ghost" onClick={() => void save('blocked')} disabled={saving}>
              Als blockiert markieren
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
