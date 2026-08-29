import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Building2, Info } from 'lucide-react';

import {
  Button, Field, InfoBanner, Modal, Select, StatusBadge, Textarea, border, text, useToast,
} from '@/components/dashboard';
import { cn } from '@/lib/utils';
import { ServiceSelectionField } from '@/components/services/ServiceSelectionField';
import { createLead, findDuplicates, updateLead, type LeadInput } from '@/lib/ownerCrm/api';
import { centsToEuroInput, parseEuroToCents } from '@/lib/ownerCrm/format';
import {
  LEAD_PRIORITY_ORDER, LEAD_STAGE_ORDER, contactChannelLabel,
  leadPriorityLabel, leadStageLabel,
} from '@/lib/ownerCrm/catalog';
import type { ContactChannel, DuplicateMatch, Lead, LeadPriority, LeadStage } from '@/lib/ownerCrm/types';
import type { ServiceKey } from '@/lib/serviceOnboarding/types';

/**
 * "Lead hinzufügen" / "Lead bearbeiten".
 *
 * Creating a lead has to be fast enough to do mid-conversation, so exactly ONE
 * thing is required: a practice name, a contact name or an e-mail. Everything
 * else lives behind two optional sections that stay collapsed until asked for.
 * A field the owner does not fill stays empty — the form never invents
 * completeness it does not have.
 *
 * Duplicate detection is advisory and non-blocking, and it runs against the
 * server so it can see customers too. A strong match (e-mail, phone, website)
 * is shown as a warning; a shared company name alone is shown as a note,
 * because two practices genuinely can be called "Praxis Dr. Müller".
 */

interface FormState {
  company: string; contact_name: string; contact_role: string;
  email: string; phone: string; website: string;
  street: string; postal_code: string; city: string;
  stage: LeadStage; priority: LeadPriority;
  source: string; source_note: string;
  estimated_setup: string; estimated_monthly: string;
  industry: string; company_type: string; company_size: string;
  existing_systems: string; pain_points: string; requirements: string; notes: string;
  preferred_channel: '' | ContactChannel;
  next_follow_up: string; follow_up_note: string;
}

const EMPTY: FormState = {
  company: '', contact_name: '', contact_role: '', email: '', phone: '', website: '',
  street: '', postal_code: '', city: '',
  stage: 'new', priority: 'normal', source: '', source_note: '',
  estimated_setup: '', estimated_monthly: '',
  industry: '', company_type: '', company_size: '',
  existing_systems: '', pain_points: '', requirements: '', notes: '',
  preferred_channel: '', next_follow_up: '', follow_up_note: '',
};

function toFormState(lead: Lead, interests: ServiceKey[]): { form: FormState; services: ServiceKey[] } {
  return {
    form: {
      company: lead.company ?? '', contact_name: lead.contact_name ?? '', contact_role: lead.contact_role ?? '',
      email: lead.email ?? '', phone: lead.phone ?? '', website: lead.website ?? '',
      street: lead.street ?? '', postal_code: lead.postal_code ?? '', city: lead.city ?? '',
      stage: lead.stage, priority: lead.priority,
      source: lead.source ?? '', source_note: lead.source_note ?? '',
      estimated_setup: centsToEuroInput(lead.estimated_setup_cents),
      estimated_monthly: centsToEuroInput(lead.estimated_monthly_cents),
      industry: lead.industry ?? '', company_type: lead.company_type ?? '', company_size: lead.company_size ?? '',
      existing_systems: lead.existing_systems ?? '', pain_points: lead.pain_points ?? '',
      requirements: lead.requirements ?? '', notes: lead.notes ?? '',
      preferred_channel: lead.preferred_channel ?? '',
      next_follow_up: '', follow_up_note: '',
    },
    services: interests,
  };
}

export function LeadFormDialog({
  open, onClose, entityId, lead, serviceInterests = [], onSaved,
}: {
  open: boolean;
  onClose: () => void;
  entityId: string;
  /** When set the dialog edits that lead; otherwise it creates a new one. */
  lead?: Lead | null;
  serviceInterests?: ServiceKey[];
  onSaved: (leadId: string) => void;
}) {
  const toast = useToast();
  const editing = lead ?? null;
  const [form, setForm] = useState<FormState>(EMPTY);
  const [services, setServices] = useState<ServiceKey[]>([]);
  const [showContext, setShowContext] = useState(false);
  const [showCommercial, setShowCommercial] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Guards against a slow duplicate probe overwriting a newer one's result. */
  const probeToken = useRef(0);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setDuplicates([]);
    setShowContext(false);
    setShowCommercial(false);
    if (editing) {
      const next = toFormState(editing, serviceInterests);
      setForm(next.form);
      setServices(next.services);
    } else {
      setForm(EMPTY);
      setServices([]);
    }
    // `serviceInterests` is a fresh array each parent render; depending on it
    // would reset the selection mid-edit. Its value at open time is enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  const set = (patch: Partial<FormState>) => setForm((s) => ({ ...s, ...patch }));

  const hasIdentity = Boolean(form.company.trim() || form.contact_name.trim() || form.email.trim());

  /**
   * Probe for duplicates when the identifying fields settle. Debounced, because
   * this fires on typing; failures are swallowed on purpose — a warning that
   * cannot be produced must never stop the owner entering a lead.
   */
  const probe = useCallback(async () => {
    const payload = {
      company: form.company.trim() || null,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      website: form.website.trim() || null,
    };
    if (!payload.company && !payload.email && !payload.phone && !payload.website) {
      setDuplicates([]);
      return;
    }
    const token = ++probeToken.current;
    try {
      const found = await findDuplicates(entityId, payload, editing?.id ?? null);
      if (token === probeToken.current) setDuplicates(found);
    } catch {
      if (token === probeToken.current) setDuplicates([]);
    }
  }, [entityId, editing, form.company, form.email, form.phone, form.website]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => { void probe(); }, 400);
    return () => clearTimeout(timer);
  }, [open, probe]);

  const strongDuplicates = useMemo(() => duplicates.filter((d) => d.confidence === 'strong'), [duplicates]);
  const weakDuplicates = useMemo(() => duplicates.filter((d) => d.confidence === 'weak'), [duplicates]);

  const buildPayload = (): LeadInput => ({
    company: form.company.trim() || null,
    contact_name: form.contact_name.trim() || null,
    contact_role: form.contact_role.trim() || null,
    email: form.email.trim() || null,
    phone: form.phone.trim() || null,
    website: form.website.trim() || null,
    street: form.street.trim() || null,
    postal_code: form.postal_code.trim() || null,
    city: form.city.trim() || null,
    priority: form.priority,
    source: form.source.trim() || null,
    source_note: form.source_note.trim() || null,
    estimated_setup_cents: parseEuroToCents(form.estimated_setup),
    estimated_monthly_cents: parseEuroToCents(form.estimated_monthly),
    industry: form.industry.trim() || null,
    company_type: form.company_type.trim() || null,
    company_size: form.company_size.trim() || null,
    existing_systems: form.existing_systems.trim() || null,
    pain_points: form.pain_points.trim() || null,
    requirements: form.requirements.trim() || null,
    notes: form.notes.trim() || null,
    preferred_channel: form.preferred_channel || null,
    service_interests: services,
  });

  const submit = async () => {
    if (!hasIdentity) {
      setError('Bitte mindestens Praxis/Firma, Ansprechpartner oder E-Mail angeben.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        const { error: err } = await updateLead(editing.id, buildPayload());
        if (err) { setError(err); return; }
        toast.success('Lead aktualisiert');
        onSaved(editing.id);
      } else {
        const payload: LeadInput = {
          ...buildPayload(),
          business_entity_id: entityId,
          stage: form.stage,
          next_follow_up_at: form.next_follow_up ? new Date(form.next_follow_up).toISOString() : null,
          follow_up_note: form.follow_up_note.trim() || null,
        };
        const { id, error: err } = await createLead(payload);
        if (err || !id) { setError(err ?? 'Der Lead konnte nicht angelegt werden.'); return; }
        toast.success('Lead angelegt');
        onSaved(id);
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={editing ? 'Lead bearbeiten' : 'Lead hinzufügen'}
      description={editing
        ? undefined
        : 'Es genügt ein Name. Alles Weitere lässt sich jederzeit ergänzen.'}
      footer={(
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Abbrechen</Button>
          <Button onClick={() => void submit()} loading={saving} disabled={!hasIdentity}>
            {editing ? 'Speichern' : 'Lead anlegen'}
          </Button>
        </>
      )}
    >
      <div className="space-y-5">
        {error ? <InfoBanner tone="danger" title="Nicht gespeichert">{error}</InfoBanner> : null}

        {strongDuplicates.length > 0 ? (
          <InfoBanner tone="warning" title="Möglicherweise bereits vorhanden">
            <ul className="mt-1 space-y-1">
              {strongDuplicates.map((d) => (
                <li key={`${d.kind}-${d.id}`} className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="font-medium">{d.name}</span>
                  <StatusBadge label={d.kind === 'customer' ? 'Kunde' : 'Lead'} tone={d.kind === 'customer' ? 'success' : 'info'} />
                  <span className={text.hint}>
                    Übereinstimmung: {d.matched_on === 'email' ? 'E-Mail' : d.matched_on === 'phone' ? 'Telefon' : 'Website'}
                    {d.city ? ` · ${d.city}` : ''}
                  </span>
                </li>
              ))}
            </ul>
            <p className={cn('mt-2', text.hint)}>
              Das Anlegen bleibt möglich — es wird nichts automatisch zusammengeführt.
            </p>
          </InfoBanner>
        ) : null}

        {strongDuplicates.length === 0 && weakDuplicates.length > 0 ? (
          <div className={cn('flex gap-2 px-3 py-2', border.hairline, 'rounded-[10px]', text.hint)}>
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>
              Ähnlicher Name vorhanden: {weakDuplicates.map((d) => d.name).join(', ')}. Gleiche Namen
              sind häufig — geprüft wird nur der Name, nicht E-Mail oder Telefon.
            </span>
          </div>
        ) : null}

        {/* ---------------------------------------------------------- Identity */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            id="lead-company" label="Praxis / Firma" value={form.company}
            onChange={(v) => set({ company: v })} placeholder="Praxis Dr. Beispiel" autoFocus
          />
          <Field
            id="lead-contact" label="Ansprechpartner" value={form.contact_name}
            onChange={(v) => set({ contact_name: v })} placeholder="Dr. Anna Beispiel"
          />
          <Field
            id="lead-role" label="Funktion" value={form.contact_role}
            onChange={(v) => set({ contact_role: v })} placeholder="Praxisinhaberin"
          />
          <Field
            id="lead-email" label="E-Mail" type="email" value={form.email}
            onChange={(v) => set({ email: v })} placeholder="praxis@beispiel.de"
          />
          <Field
            id="lead-phone" label="Telefon" type="tel" value={form.phone}
            onChange={(v) => set({ phone: v })} placeholder="+49 89 1234567"
          />
          <Field
            id="lead-website" label="Website" value={form.website}
            onChange={(v) => set({ website: v })} placeholder="https://…"
          />
        </div>

        {!hasIdentity ? (
          <p className={text.hint}>
            Mindestens eines von Praxis/Firma, Ansprechpartner oder E-Mail wird benötigt.
          </p>
        ) : null}

        {/* ------------------------------------------------------------- Sales */}
        <div className="grid gap-3 sm:grid-cols-2">
          {!editing ? (
            <Select
              id="lead-stage" label="Phase" value={form.stage}
              onChange={(v) => set({ stage: v as LeadStage })}
              options={LEAD_STAGE_ORDER
                .filter((s) => s !== 'won' && s !== 'lost')
                .map((s) => ({ value: s, label: leadStageLabel[s] }))}
              hint="Gewonnen/Verloren werden später im Lead gesetzt."
            />
          ) : null}
          <Select
            id="lead-priority" label="Priorität" value={form.priority}
            onChange={(v) => set({ priority: v as LeadPriority })}
            options={LEAD_PRIORITY_ORDER.map((p) => ({ value: p, label: leadPriorityLabel[p] }))}
          />
        </div>

        <ServiceSelectionField value={services} onChange={setServices} />

        {!editing ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              id="lead-followup" label="Nächstes Follow-up" type="datetime-local"
              value={form.next_follow_up} onChange={(v) => set({ next_follow_up: v })}
              hint="Optional. Erinnert nur intern — es wird nichts versendet."
            />
            <Field
              id="lead-followup-note" label="Follow-up Notiz" value={form.follow_up_note}
              onChange={(v) => set({ follow_up_note: v })} placeholder="Rückruf zur PVS-Frage"
            />
          </div>
        ) : null}

        {/* -------------------------------------------------------- Collapsible */}
        <details
          className={cn('group', border.hairline, 'rounded-[10px] px-3 py-2')}
          open={showCommercial}
          onToggle={(e) => setShowCommercial((e.currentTarget as HTMLDetailsElement).open)}
        >
          <summary className={cn('cursor-pointer list-none select-none', text.label)}>
            Kommerziell &amp; Quelle
          </summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field
              id="lead-setup" label="Erwartetes Setup (€)" value={form.estimated_setup}
              onChange={(v) => set({ estimated_setup: v })} inputMode="decimal" placeholder="4.800,00"
            />
            <Field
              id="lead-monthly" label="Erwartet monatlich (€)" value={form.estimated_monthly}
              onChange={(v) => set({ estimated_monthly: v })} inputMode="decimal" placeholder="399,00"
            />
            <Field
              id="lead-source" label="Quelle" value={form.source}
              onChange={(v) => set({ source: v })} placeholder="Empfehlung, Messe, Website …"
            />
            <Select
              id="lead-channel" label="Bevorzugter Kanal" value={form.preferred_channel}
              onChange={(v) => set({ preferred_channel: v as ContactChannel | '' })}
              options={[
                { value: '', label: 'Keine Angabe' },
                ...(['phone', 'email', 'meeting', 'other'] as ContactChannel[])
                  .map((c) => ({ value: c, label: contactChannelLabel[c] })),
              ]}
            />
            <div className="sm:col-span-2">
              <Textarea
                id="lead-source-note" label="Notiz zur Quelle" rows={2}
                value={form.source_note} onChange={(v) => set({ source_note: v })}
              />
            </div>
          </div>
        </details>

        <details
          className={cn('group', border.hairline, 'rounded-[10px] px-3 py-2')}
          open={showContext}
          onToggle={(e) => setShowContext((e.currentTarget as HTMLDetailsElement).open)}
        >
          <summary className={cn('cursor-pointer list-none select-none', text.label)}>
            Kontext &amp; Adresse
          </summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field id="lead-street" label="Straße" value={form.street} onChange={(v) => set({ street: v })} />
            <div className="grid grid-cols-[minmax(0,7rem)_1fr] gap-3">
              <Field id="lead-zip" label="PLZ" value={form.postal_code} onChange={(v) => set({ postal_code: v })} />
              <Field id="lead-city" label="Ort" value={form.city} onChange={(v) => set({ city: v })} />
            </div>
            <Field id="lead-industry" label="Branche" value={form.industry} onChange={(v) => set({ industry: v })} />
            <Field id="lead-type" label="Praxis-/Firmentyp" value={form.company_type} onChange={(v) => set({ company_type: v })} />
            <Field id="lead-size" label="Größe" value={form.company_size} onChange={(v) => set({ company_size: v })} placeholder="z. B. 3 Behandler, 12 Mitarbeitende" />
            <div className="sm:col-span-2 grid gap-3">
              <Textarea id="lead-systems" label="Bestehende Systeme" rows={2} value={form.existing_systems} onChange={(v) => set({ existing_systems: v })} placeholder="PVS, Telefonanlage, Kalender …" />
              <Textarea id="lead-pain" label="Probleme / Anlass" rows={2} value={form.pain_points} onChange={(v) => set({ pain_points: v })} />
              <Textarea id="lead-req" label="Anforderungen" rows={2} value={form.requirements} onChange={(v) => set({ requirements: v })} />
              <Textarea id="lead-notes" label="Notizen" rows={3} value={form.notes} onChange={(v) => set({ notes: v })} />
            </div>
          </div>
        </details>

        <p className={cn('flex items-start gap-1.5', text.hint)}>
          <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Leads werden ausschließlich manuell erfasst. Es findet keine automatische Recherche,
          Anreicherung oder Kontaktaufnahme statt.
        </p>
      </div>
    </Modal>
  );
}
