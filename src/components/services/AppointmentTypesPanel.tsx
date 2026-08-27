import { useEffect, useState } from 'react';
import { CalendarPlus, Pencil, Trash2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  Button, Checkbox, ConfirmDialog, Field, Modal, StatusBadge, Textarea,
  border, radius, text, useToast,
} from '@/components/dashboard';
import { DefRow, InlineEmpty } from '@/components/services/servicePrimitives';
import {
  deleteAppointmentType, upsertAppointmentType, type AppointmentTypePayload,
} from '@/lib/serviceOnboarding/api';
import type { EngagementAppointmentType } from '@/lib/serviceOnboarding/types';

/**
 * The one-to-many appointment / service catalogue.
 *
 * Each entry is a real row, not a paragraph in a notes field, because the booking logic, the
 * agent overlay and the test suite all have to agree on the same list. The dialog is the one
 * place in this workspace that uses explicit save: an appointment type is created as a whole, and
 * a half-saved one would quietly produce a bookable service nobody defined.
 */

const EMPTY: AppointmentTypePayload = {
  spoken_name: '', internal_ref: '', duration_minutes: '', location: '', provider: '',
  new_patients_allowed: true, existing_patients_only: false, prerequisites: '',
  required_information: '', booking_horizon_days: '', cancellation_rules: '',
  rescheduling_rules: '', restrictions: '',
};

function toForm(item: EngagementAppointmentType): AppointmentTypePayload {
  return {
    spoken_name: item.spoken_name,
    internal_ref: item.internal_ref ?? '',
    duration_minutes: item.duration_minutes === null ? '' : String(item.duration_minutes),
    location: item.location ?? '',
    provider: item.provider ?? '',
    new_patients_allowed: item.new_patients_allowed,
    existing_patients_only: item.existing_patients_only,
    prerequisites: item.prerequisites ?? '',
    required_information: item.required_information ?? '',
    booking_horizon_days: item.booking_horizon_days === null ? '' : String(item.booking_horizon_days),
    cancellation_rules: item.cancellation_rules ?? '',
    rescheduling_rules: item.rescheduling_rules ?? '',
    restrictions: item.restrictions ?? '',
  };
}

export function AppointmentTypesPanel({ engagementId, items, onChanged }: {
  engagementId: string;
  items: EngagementAppointmentType[];
  onChanged: () => void;
}) {
  const toast = useToast();
  const [editing, setEditing] = useState<EngagementAppointmentType | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<AppointmentTypePayload>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EngagementAppointmentType | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(editing ? toForm(editing) : EMPTY);
  }, [open, editing]);

  const set = (patch: Partial<AppointmentTypePayload>) => setForm((f) => ({ ...f, ...patch }));

  const startCreate = () => { setEditing(null); setOpen(true); };
  const startEdit = (item: EngagementAppointmentType) => { setEditing(item); setOpen(true); };

  const submit = async () => {
    if (!form.spoken_name.trim()) { setError('Bitte geben Sie den gesprochenen Namen an.'); return; }
    setSaving(true);
    const { error: err } = await upsertAppointmentType(engagementId, editing?.id ?? null, form);
    setSaving(false);
    if (err) { setError(err); return; }
    setOpen(false);
    onChanged();
    toast.success(editing ? 'Terminart aktualisiert' : 'Terminart angelegt');
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { error: err } = await deleteAppointmentType(deleteTarget.id);
    setDeleteTarget(null);
    if (err) { toast.error('Löschen fehlgeschlagen', err); return; }
    onChanged();
    toast.success('Terminart entfernt');
  };

  return (
    <div className="px-5 py-4">
      {items.length === 0 ? (
        <InlineEmpty action={<Button size="sm" icon={CalendarPlus} onClick={startCreate}>Terminart anlegen</Button>}>
          Noch keine Terminarten erfasst. Der Assistent kann erst buchen, wenn hier steht, was
          buchbar ist — mit Dauer, Ort und Voraussetzungen.
        </InlineEmpty>
      ) : (
        <>
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.id} className={cn('p-3.5', border.hairline, radius.lg)}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className={cn('[overflow-wrap:anywhere]', text.bodyStrong)}>{item.spoken_name}</p>
                    <p className={cn('mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1', text.hint)}>
                      {item.internal_ref ? <span className="font-mono">{item.internal_ref}</span> : null}
                      {item.duration_minutes !== null ? <span>{item.duration_minutes} Min.</span> : null}
                      {item.location ? <span>{item.location}</span> : null}
                      {item.provider ? <span>{item.provider}</span> : null}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {item.existing_patients_only
                      ? <StatusBadge label="Nur Bestandspatienten" tone="warning" />
                      : item.new_patients_allowed
                        ? <StatusBadge label="Neue Patienten" tone="success" />
                        : null}
                    <Button size="sm" variant="ghost" icon={Pencil} onClick={() => startEdit(item)}>Bearbeiten</Button>
                    <Button size="sm" variant="ghost" icon={Trash2} onClick={() => setDeleteTarget(item)}>Entfernen</Button>
                  </div>
                </div>
                {item.prerequisites || item.required_information || item.booking_horizon_days !== null
                  || item.cancellation_rules || item.rescheduling_rules || item.restrictions ? (
                  <dl className={cn('mt-2.5 pt-2.5', border.hairlineT)}>
                    {item.required_information ? <DefRow label="Benötigte Angaben" value={item.required_information} /> : null}
                    {item.prerequisites ? <DefRow label="Voraussetzungen" value={item.prerequisites} /> : null}
                    {item.booking_horizon_days !== null ? <DefRow label="Buchungshorizont" value={`${item.booking_horizon_days} Tage`} /> : null}
                    {item.cancellation_rules ? <DefRow label="Stornoregeln" value={item.cancellation_rules} /> : null}
                    {item.rescheduling_rules ? <DefRow label="Umbuchungsregeln" value={item.rescheduling_rules} /> : null}
                    {item.restrictions ? <DefRow label="Einschränkungen" value={item.restrictions} /> : null}
                  </dl>
                ) : null}
              </li>
            ))}
          </ul>
          <div className="mt-3">
            <Button size="sm" variant="secondary" icon={CalendarPlus} onClick={startCreate}>Terminart hinzufügen</Button>
          </div>
        </>
      )}

      <Modal
        open={open}
        onClose={saving ? () => {} : () => setOpen(false)}
        title={editing ? 'Terminart bearbeiten' : 'Neue Terminart'}
        description="So, wie der Assistent sie am Telefon nennt und buchbar macht."
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={saving}>Abbrechen</Button>
            <Button onClick={() => void submit()} loading={saving}>{editing ? 'Speichern' : 'Terminart anlegen'}</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field id="apt-name" label="Gesprochener Name" required value={form.spoken_name}
            onChange={(v) => set({ spoken_name: v })} placeholder="z. B. Kontrolluntersuchung" />
          <div className="grid gap-3 sm:grid-cols-3">
            <Field id="apt-ref" label="Interne Kennung" value={form.internal_ref ?? ''} onChange={(v) => set({ internal_ref: v })} />
            <Field id="apt-duration" label="Dauer" type="number" inputMode="numeric" min="1"
              value={form.duration_minutes ?? ''} onChange={(v) => set({ duration_minutes: v })} hint="Minuten" />
            <Field id="apt-horizon" label="Buchungshorizont" type="number" inputMode="numeric" min="0"
              value={form.booking_horizon_days ?? ''} onChange={(v) => set({ booking_horizon_days: v })} hint="Tage im Voraus" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field id="apt-location" label="Ort" value={form.location ?? ''} onChange={(v) => set({ location: v })} />
            <Field id="apt-provider" label="Behandler / Ressource" value={form.provider ?? ''} onChange={(v) => set({ provider: v })} />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Checkbox id="apt-new" label="Neue Patienten erlaubt" checked={form.new_patients_allowed ?? true}
              onChange={(v) => set({ new_patients_allowed: v })} />
            <Checkbox id="apt-existing" label="Nur Bestandspatienten" checked={form.existing_patients_only ?? false}
              onChange={(v) => set({ existing_patients_only: v })} />
          </div>
          <Textarea id="apt-required" label="Benötigte Angaben" rows={2}
            value={form.required_information ?? ''} onChange={(v) => set({ required_information: v })} />
          <Textarea id="apt-prereq" label="Voraussetzungen" rows={2}
            value={form.prerequisites ?? ''} onChange={(v) => set({ prerequisites: v })} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Textarea id="apt-cancel" label="Stornoregeln" rows={2}
              value={form.cancellation_rules ?? ''} onChange={(v) => set({ cancellation_rules: v })} />
            <Textarea id="apt-resched" label="Umbuchungsregeln" rows={2}
              value={form.rescheduling_rules ?? ''} onChange={(v) => set({ rescheduling_rules: v })} />
          </div>
          <Textarea id="apt-restrict" label="Besondere Einschränkungen" rows={2}
            value={form.restrictions ?? ''} onChange={(v) => set({ restrictions: v })} />
          {error ? <p className="text-[13px] text-red-600" role="alert">{error}</p> : null}
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
        tone="danger"
        title="Terminart entfernen?"
        confirmLabel="Entfernen"
        message={
          <p>
            <span className="font-semibold text-[var(--cq-fg)]">{deleteTarget?.spoken_name}</span>{' '}
            wird aus der Terminliste dieses Projekts entfernt. Das lässt sich nicht rückgängig machen.
          </p>
        }
      />
    </div>
  );
}

export default AppointmentTypesPanel;
