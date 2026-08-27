import { useEffect, useState } from 'react';

import { Modal, Button, Field, Textarea, useToast, border } from '@/components/dashboard';
import { createCustomer, updateCustomer, type CustomerInput } from '@/lib/ownerFinance/customersApi';
import { ServiceSelectionField } from '@/components/services/ServiceSelectionField';
import { addCustomerService, isMissingBackendMessage } from '@/lib/serviceOnboarding/api';
import { SERVICE_BY_KEY } from '@/lib/serviceOnboarding/catalog';
import type { ServiceKey } from '@/lib/serviceOnboarding/types';

// Create / edit dialog for an owner customer. Used both from the customer overview and inline from
// the offer editor, so a customer can be created without leaving the offer workflow. All labels are
// German. On create the server de-duplicates (linked account → normalized email); the resulting id
// (new or matched) is returned to the caller via onSaved.
//
// The dialog also carries the service selection: choosing "AI Receptionist" here provisions the
// onboarding workspace from the active template as soon as the customer is saved. Provisioning is
// idempotent server-side, so a matched (existing) customer never gets a second engagement.

interface FormState {
  company: string; contact_name: string; email: string; phone: string;
  street: string; postal_code: string; city: string; notes: string;
}

const empty: FormState = { company: '', contact_name: '', email: '', phone: '', street: '', postal_code: '', city: '', notes: '' };

export interface CustomerFormInitial extends Partial<FormState> { id?: string }

export function CustomerFormDialog({
  open, onClose, entityId, initial, defaults, existingServices = [], onSaved,
}: {
  open: boolean;
  onClose: () => void;
  entityId: string;
  /** When set (with an id), the dialog edits that customer; otherwise it creates a new one. */
  initial?: CustomerFormInitial | null;
  /** Prefill values for a brand-new customer (e.g. from the offer recipient fields). */
  defaults?: Partial<FormState>;
  /** Services the customer already receives. Shown as selected and not removable here. */
  existingServices?: ServiceKey[];
  onSaved: (customerId: string, matched: boolean) => void;
}) {
  const toast = useToast();
  const editingId = initial?.id ?? null;
  const [form, setForm] = useState<FormState>(empty);
  const [services, setServices] = useState<ServiceKey[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm({ ...empty, ...defaults, ...(initial ?? {}) } as FormState);
    setServices(existingServices);
    // `existingServices` is a fresh array on every parent render; depending on it would reset the
    // selection mid-edit. The dialog only needs its value at the moment it opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial, defaults]);

  const set = (p: Partial<FormState>) => setForm((s) => ({ ...s, ...p }));

  /**
   * Provision the services the owner just selected. Runs after the customer exists, because a
   * service needs a customer to hang off. Failures are reported by name rather than swallowed —
   * the customer is already saved at this point, and pretending otherwise would be worse.
   */
  const provisionServices = async (customerId: string): Promise<{ failed: string[]; missing: boolean }> => {
    const added = services.filter((key) => !existingServices.includes(key));
    const failed: string[] = [];
    let missing = false;
    for (const key of added) {
      const { error: err } = await addCustomerService(customerId, key);
      if (err) {
        failed.push(SERVICE_BY_KEY[key].name);
        // Before the service migrations are applied the RPC does not exist. The customer was
        // still saved, so the message says that rather than implying the whole save failed.
        if (isMissingBackendMessage(err)) missing = true;
      }
    }
    return { failed, missing };
  };

  const reportProvisioning = ({ failed, missing }: { failed: string[]; missing: boolean }) => {
    if (failed.length === 0) return false;
    toast.error(
      missing ? 'Leistungen noch nicht verfügbar' : 'Leistung konnte nicht angelegt werden',
      missing
        ? 'Der Kunde wurde gespeichert. Die Leistungsverwaltung wird aktiv, sobald die zugehörige Datenbank-Migration eingespielt ist.'
        : failed.join(', '),
    );
    return true;
  };

  const submit = async () => {
    if (!form.company.trim() && !form.contact_name.trim() && !form.email.trim()) {
      setError('Bitte geben Sie mindestens Firma, Ansprechpartner oder E-Mail an.');
      return;
    }
    setSaving(true); setError(null);
    if (editingId) {
      const patch: Partial<CustomerInput> = {
        company: form.company, contact_name: form.contact_name, email: form.email, phone: form.phone,
        street: form.street, postal_code: form.postal_code, city: form.city, notes: form.notes,
      };
      const { error: err } = await updateCustomer(editingId, patch);
      if (err) { setSaving(false); setError('Speichern fehlgeschlagen. Bitte versuchen Sie es erneut.'); return; }
      const provisioning = await provisionServices(editingId);
      setSaving(false);
      if (!reportProvisioning(provisioning)) {
        toast.success('Kunde aktualisiert', 'Die Änderungen wurden gespeichert.');
      }
      onSaved(editingId, false);
      onClose();
      return;
    }
    const input: CustomerInput = {
      business_entity_id: entityId,
      company: form.company, contact_name: form.contact_name, email: form.email, phone: form.phone,
      street: form.street, postal_code: form.postal_code, city: form.city, notes: form.notes,
    };
    const { id, matched, error: err } = await createCustomer(input);
    if (err || !id) { setSaving(false); setError('Anlegen fehlgeschlagen. Bitte versuchen Sie es erneut.'); return; }
    const provisioning = await provisionServices(id);
    setSaving(false);
    // A provisioning failure is reported on its own; a success toast on top of it would be
    // contradictory, so only one of the two is ever shown.
    if (!reportProvisioning(provisioning)) {
      if (matched) {
        toast.success('Bestehender Kunde übernommen', 'Ein passender Kunde war bereits vorhanden und wurde verwendet.');
      } else {
        toast.success('Kunde angelegt', services.length > 0 ? 'Der Onboarding-Workspace wurde angelegt.' : 'Der neue Kunde wurde gespeichert.');
      }
    }
    onSaved(id, matched);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={saving ? () => {} : onClose}
      title={editingId ? 'Kunde bearbeiten' : 'Neuer Kunde'}
      description={editingId ? undefined : 'Legen Sie einen Kunden an — auch ohne Angebot oder CRM-Verknüpfung.'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Abbrechen</Button>
          <Button onClick={() => void submit()} loading={saving}>{editingId ? 'Speichern' : 'Kunde anlegen'}</Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field id="c-company" label="Firma" value={form.company} onChange={(v) => set({ company: v })} placeholder="z. B. Muster GmbH" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field id="c-contact" label="Ansprechpartner" value={form.contact_name} onChange={(v) => set({ contact_name: v })} />
          <Field id="c-email" label="E-Mail" type="email" value={form.email} onChange={(v) => set({ email: v })} hint="Wird zur Kundenerkennung genutzt" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field id="c-phone" label="Telefon" value={form.phone} onChange={(v) => set({ phone: v })} />
          <Field id="c-street" label="Straße" value={form.street} onChange={(v) => set({ street: v })} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field id="c-postal" label="PLZ" value={form.postal_code} onChange={(v) => set({ postal_code: v })} />
          <Field id="c-city" label="Ort" value={form.city} onChange={(v) => set({ city: v })} />
        </div>
        <Textarea id="c-notes" label="Notizen" value={form.notes} onChange={(v) => set({ notes: v })} rows={3} />

        <div className={`pt-4 ${border.hairlineT}`}>
          <ServiceSelectionField
            value={services}
            onChange={setServices}
            locked={existingServices}
            disabled={saving}
          />
        </div>

        {error ? <p className="text-[13px] text-red-600" role="alert">{error}</p> : null}
      </div>
    </Modal>
  );
}

export default CustomerFormDialog;
