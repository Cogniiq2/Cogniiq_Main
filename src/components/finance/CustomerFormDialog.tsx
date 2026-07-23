import { useEffect, useState } from 'react';

import { Modal, Button, Field, Textarea, useToast } from '@/components/dashboard';
import { createCustomer, updateCustomer, type CustomerInput } from '@/lib/ownerFinance/customersApi';

// Create / edit dialog for an owner customer. Used both from the customer overview and inline from
// the offer editor, so a customer can be created without leaving the offer workflow. All labels are
// German. On create the server de-duplicates (linked account → normalized email); the resulting id
// (new or matched) is returned to the caller via onSaved.

interface FormState {
  company: string; contact_name: string; email: string; phone: string;
  street: string; postal_code: string; city: string; notes: string;
}

const empty: FormState = { company: '', contact_name: '', email: '', phone: '', street: '', postal_code: '', city: '', notes: '' };

export interface CustomerFormInitial extends Partial<FormState> { id?: string }

export function CustomerFormDialog({
  open, onClose, entityId, initial, defaults, onSaved,
}: {
  open: boolean;
  onClose: () => void;
  entityId: string;
  /** When set (with an id), the dialog edits that customer; otherwise it creates a new one. */
  initial?: CustomerFormInitial | null;
  /** Prefill values for a brand-new customer (e.g. from the offer recipient fields). */
  defaults?: Partial<FormState>;
  onSaved: (customerId: string, matched: boolean) => void;
}) {
  const toast = useToast();
  const editingId = initial?.id ?? null;
  const [form, setForm] = useState<FormState>(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm({ ...empty, ...defaults, ...(initial ?? {}) } as FormState);
  }, [open, initial, defaults]);

  const set = (p: Partial<FormState>) => setForm((s) => ({ ...s, ...p }));

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
      setSaving(false);
      if (err) { setError('Speichern fehlgeschlagen. Bitte versuchen Sie es erneut.'); return; }
      toast.success('Kunde aktualisiert', 'Die Änderungen wurden gespeichert.');
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
    setSaving(false);
    if (err || !id) { setError('Anlegen fehlgeschlagen. Bitte versuchen Sie es erneut.'); return; }
    if (matched) toast.success('Bestehender Kunde übernommen', 'Ein passender Kunde war bereits vorhanden und wurde verwendet.');
    else toast.success('Kunde angelegt', 'Der neue Kunde wurde gespeichert.');
    onSaved(id, matched);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={saving ? () => {} : onClose}
      title={editingId ? 'Kunde bearbeiten' : 'Neuer Kunde'}
      description={editingId ? undefined : 'Legen Sie einen Kunden an — auch ohne Angebot oder CRM-Verknüpfung.'}
      size="md"
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
        {error ? <p className="text-[13px] text-red-600">{error}</p> : null}
      </div>
    </Modal>
  );
}

export default CustomerFormDialog;
