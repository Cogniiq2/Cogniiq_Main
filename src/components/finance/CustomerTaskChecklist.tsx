import { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, ChevronRight, RotateCcw } from 'lucide-react';

import {
  Modal, Button, IconButton, Field, Textarea, Select, StatusBadge, ConfirmDialog, useToast,
} from '@/components/dashboard';
import {
  createTask, updateTask, setTaskStatus, deleteTask, reorderTasks, type TaskInput,
} from '@/lib/ownerFinance/customersApi';
import { formatDateDe } from '@/lib/ownerFinance/exports';
import { taskPriorityLabel, taskPriorityTone, taskStatusLabel, taskStatusTone } from '@/lib/ownerFinance/customerLabels';
import type { OwnerCustomerTask, OwnerCustomerTaskStatus } from '@/lib/ownerFinance/types';

// The customer task checklist — the operational heart of the detail page. A checkbox completes a
// task instantly with an OPTIMISTIC update that rolls back if Supabase rejects it. Open tasks are
// reorderable (persisted via owner_reorder_customer_tasks); completed/cancelled tasks move into a
// separate collapsible section. Cancelled tasks never count as completed. German throughout.

const ACTIVE = new Set<OwnerCustomerTaskStatus>(['open', 'in_progress']);

export function CustomerTaskChecklist({ customerId, tasks, onChanged }: {
  customerId: string;
  tasks: OwnerCustomerTask[];
  onChanged: () => void;
}) {
  const toast = useToast();
  // Local mirror enables optimistic UI; it re-syncs whenever the authoritative list changes.
  const [local, setLocal] = useState<OwnerCustomerTask[]>(tasks);
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const [showDone, setShowDone] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<OwnerCustomerTask | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OwnerCustomerTask | null>(null);

  useEffect(() => { setLocal(tasks); }, [tasks]);

  const active = useMemo(() => local.filter((t) => ACTIVE.has(t.status)).sort((a, b) => a.sort_order - b.sort_order), [local]);
  const done = useMemo(
    () => local.filter((t) => !ACTIVE.has(t.status)).sort((a, b) => (b.completed_at ?? b.updated_at).localeCompare(a.completed_at ?? a.updated_at)),
    [local],
  );
  const completedCount = useMemo(() => local.filter((t) => t.status === 'completed').length, [local]);

  const withBusy = (id: string, on: boolean) => setBusy((s) => { const n = new Set(s); if (on) n.add(id); else n.delete(id); return n; });

  // Optimistic status toggle with rollback.
  const toggleComplete = async (task: OwnerCustomerTask, complete: boolean) => {
    const next: OwnerCustomerTaskStatus = complete ? 'completed' : 'open';
    const snapshot = local;
    setLocal((list) => list.map((t) => (t.id === task.id
      ? { ...t, status: next, completed_at: complete ? new Date().toISOString() : null }
      : t)));
    withBusy(task.id, true);
    const { error } = await setTaskStatus(task.id, next);
    withBusy(task.id, false);
    if (error) {
      setLocal(snapshot); // roll back — the server rejected the change
      toast.error('Aktualisierung fehlgeschlagen', 'Die Aufgabe konnte nicht aktualisiert werden.');
      return;
    }
    onChanged();
  };

  const changeStatus = async (task: OwnerCustomerTask, status: OwnerCustomerTaskStatus) => {
    const snapshot = local;
    setLocal((list) => list.map((t) => (t.id === task.id ? { ...t, status } : t)));
    withBusy(task.id, true);
    const { error } = await setTaskStatus(task.id, status);
    withBusy(task.id, false);
    if (error) { setLocal(snapshot); toast.error('Aktualisierung fehlgeschlagen', 'Bitte erneut versuchen.'); return; }
    onChanged();
  };

  // Move an open task up/down and persist the whole ordering (open tasks first, then the rest).
  const move = async (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= active.length) return;
    const reordered = [...active];
    const [item] = reordered.splice(index, 1);
    reordered.splice(target, 0, item);
    const snapshot = local;
    const orderedIds = [...reordered.map((t) => t.id), ...done.map((t) => t.id)];
    setLocal((list) => [...list].sort((a, b) => orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id))
      .map((t, i) => ({ ...t, sort_order: i })));
    const { error } = await reorderTasks(customerId, orderedIds);
    if (error) { setLocal(snapshot); toast.error('Sortierung fehlgeschlagen', 'Die Reihenfolge konnte nicht gespeichert werden.'); return; }
    onChanged();
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await deleteTask(deleteTarget.id);
    if (error) { toast.error('Löschen fehlgeschlagen', 'Bitte erneut versuchen.'); return; }
    setDeleteTarget(null);
    toast.success('Aufgabe gelöscht', 'Die Aufgabe wurde entfernt.');
    onChanged();
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-gray-950">Aufgaben-Checkliste</h3>
        <Button size="sm" icon={Plus} onClick={() => { setEditing(null); setFormOpen(true); }}>Aufgabe</Button>
      </div>

      {active.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-8 text-center text-[13px] text-gray-500">
          Keine offenen Aufgaben. Legen Sie eine neue Aufgabe an.
        </div>
      ) : (
        <ul className="space-y-2">
          {active.map((task, i) => (
            <li key={task.id} className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
              <input
                type="checkbox" checked={false} disabled={busy.has(task.id)} aria-label="Als erledigt markieren"
                onChange={() => void toggleComplete(task, true)}
                className="mt-1 h-[18px] w-[18px] shrink-0 rounded-md border-gray-300 text-gray-950 focus:ring-gray-950/40"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[14px] font-medium text-gray-900 [overflow-wrap:anywhere]">{task.title}</span>
                  <StatusBadge label={taskPriorityLabel[task.priority]} tone={taskPriorityTone[task.priority]} />
                  {task.status === 'in_progress' ? <StatusBadge label={taskStatusLabel.in_progress} tone={taskStatusTone.in_progress} /> : null}
                </div>
                {task.description ? <p className="mt-1 text-[12.5px] text-gray-500 [overflow-wrap:anywhere]">{task.description}</p> : null}
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11.5px] text-gray-400">
                  {task.due_date ? <span>Fällig {formatDateDe(task.due_date)}</span> : null}
                  {task.status === 'open' ? (
                    <button type="button" className="text-gray-500 hover:text-gray-900" onClick={() => void changeStatus(task, 'in_progress')}>In Bearbeitung setzen</button>
                  ) : (
                    <button type="button" className="text-gray-500 hover:text-gray-900" onClick={() => void changeStatus(task, 'open')}>Auf „Offen" setzen</button>
                  )}
                  <button type="button" className="text-gray-500 hover:text-gray-900" onClick={() => void changeStatus(task, 'cancelled')}>Abbrechen</button>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                <IconButton icon={ChevronUp} label="Nach oben" variant="ghost" disabled={i === 0} onClick={() => void move(i, -1)} />
                <IconButton icon={ChevronDown} label="Nach unten" variant="ghost" disabled={i === active.length - 1} onClick={() => void move(i, 1)} />
                <IconButton icon={Pencil} label="Bearbeiten" variant="ghost" onClick={() => { setEditing(task); setFormOpen(true); }} />
                <IconButton icon={Trash2} label="Löschen" variant="ghost" onClick={() => setDeleteTarget(task)} />
              </div>
            </li>
          ))}
        </ul>
      )}

      {done.length > 0 ? (
        <div className="mt-4">
          <button type="button" onClick={() => setShowDone((v) => !v)}
            className="flex items-center gap-1.5 text-[12.5px] font-semibold text-gray-500 hover:text-gray-900">
            <ChevronRight size={15} className={`transition-transform ${showDone ? 'rotate-90' : ''}`} aria-hidden="true" />
            Abgeschlossen &amp; abgebrochen ({completedCount} erledigt{done.length - completedCount > 0 ? `, ${done.length - completedCount} abgebrochen` : ''})
          </button>
          {showDone ? (
            <ul className="mt-2 space-y-1.5">
              {done.map((task) => (
                <li key={task.id} className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/60 p-3">
                  <input
                    type="checkbox" checked={task.status === 'completed'} disabled={busy.has(task.id) || task.status === 'cancelled'}
                    aria-label="Wieder öffnen" onChange={() => void toggleComplete(task, false)}
                    className="mt-1 h-[18px] w-[18px] shrink-0 rounded-md border-gray-300 text-gray-950 focus:ring-gray-950/40"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[13.5px] ${task.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-500'} [overflow-wrap:anywhere]`}>{task.title}</span>
                      <StatusBadge label={taskStatusLabel[task.status]} tone={taskStatusTone[task.status]} />
                    </div>
                    <div className="mt-0.5 text-[11.5px] text-gray-400">
                      {task.status === 'completed' && task.completed_at ? `Erledigt am ${formatDateDe(task.completed_at)}` : task.status === 'cancelled' ? 'Abgebrochen' : ''}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    {task.status === 'cancelled' ? <IconButton icon={RotateCcw} label="Wieder öffnen" variant="ghost" onClick={() => void changeStatus(task, 'open')} /> : null}
                    <IconButton icon={Trash2} label="Löschen" variant="ghost" onClick={() => setDeleteTarget(task)} />
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <TaskFormDialog
        open={formOpen} onClose={() => setFormOpen(false)} customerId={customerId} task={editing}
        onSaved={() => { setFormOpen(false); onChanged(); }} />

      <ConfirmDialog
        open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={doDelete}
        title="Aufgabe löschen" tone="danger" confirmLabel="Endgültig löschen"
        message={`Möchten Sie die Aufgabe „${deleteTarget?.title ?? ''}" wirklich löschen? Dies kann nicht rückgängig gemacht werden.`} />
    </div>
  );
}

// -------------------------------------------------------------------- Task create/edit dialog
function TaskFormDialog({ open, onClose, customerId, task, onSaved }: {
  open: boolean; onClose: () => void; customerId: string; task: OwnerCustomerTask | null; onSaved: () => void;
}) {
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('normal');
  const [status, setStatus] = useState<OwnerCustomerTaskStatus>('open');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setTitle(task?.title ?? ''); setDescription(task?.description ?? ''); setPriority(task?.priority ?? 'normal');
    setStatus(task?.status ?? 'open'); setDueDate(task?.due_date ?? ''); setNotes(task?.notes ?? '');
  }, [open, task]);

  const submit = async () => {
    if (!title.trim()) { setError('Bitte geben Sie einen Titel ein.'); return; }
    setSaving(true); setError(null);
    if (task) {
      const { error: e1 } = await updateTask(task.id, { title, description, priority, due_date: dueDate || null, notes });
      const { error: e2 } = status !== task.status ? await setTaskStatus(task.id, status) : { error: null };
      setSaving(false);
      if (e1 || e2) { setError('Speichern fehlgeschlagen. Bitte erneut versuchen.'); return; }
      toast.success('Aufgabe gespeichert', 'Die Änderungen wurden übernommen.');
      onSaved();
      return;
    }
    const input: TaskInput = { customer_id: customerId, title, description, priority, due_date: dueDate || null, notes, status };
    const { error: err } = await createTask(input);
    setSaving(false);
    if (err) { setError('Anlegen fehlgeschlagen. Bitte erneut versuchen.'); return; }
    toast.success('Aufgabe angelegt', 'Die Aufgabe wurde erstellt.');
    onSaved();
  };

  return (
    <Modal
      open={open} onClose={saving ? () => {} : onClose}
      title={task ? 'Aufgabe bearbeiten' : 'Neue Aufgabe'} size="md"
      footer={<><Button variant="secondary" onClick={onClose} disabled={saving}>Abbrechen</Button><Button onClick={() => void submit()} loading={saving}>{task ? 'Speichern' : 'Anlegen'}</Button></>}
    >
      <div className="space-y-3">
        <Field id="t-title" label="Titel" value={title} onChange={setTitle} required autoFocus />
        <Textarea id="t-desc" label="Beschreibung" value={description} onChange={setDescription} rows={2} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Select id="t-priority" label="Priorität" value={priority} onChange={setPriority}
            options={[{ value: 'low', label: 'Niedrig' }, { value: 'normal', label: 'Normal' }, { value: 'high', label: 'Hoch' }, { value: 'urgent', label: 'Dringend' }]} />
          <Select id="t-status" label="Status" value={status} onChange={(v) => setStatus(v as OwnerCustomerTaskStatus)}
            options={[{ value: 'open', label: 'Offen' }, { value: 'in_progress', label: 'In Bearbeitung' }, { value: 'completed', label: 'Erledigt' }, { value: 'cancelled', label: 'Abgebrochen' }]} />
        </div>
        <Field id="t-due" label="Fälligkeitsdatum" type="date" value={dueDate} onChange={setDueDate} />
        <Textarea id="t-notes" label="Notizen" value={notes} onChange={setNotes} rows={2} />
        {error ? <p className="text-[13px] text-red-600">{error}</p> : null}
      </div>
    </Modal>
  );
}

export default CustomerTaskChecklist;
