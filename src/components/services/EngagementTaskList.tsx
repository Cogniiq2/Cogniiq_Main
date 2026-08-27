import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  Button, PremiumSelect, StatusBadge, border, focusRing, focusRingOnSurface,
  interactive, radius, text,
} from '@/components/dashboard';
import { InlineEmpty } from '@/components/services/servicePrimitives';
import { TASK_STATUS_ORDER, taskStatusLabel, taskStatusTone } from '@/lib/serviceOnboarding/catalog';
import { setEngagementTask, type TaskPatch } from '@/lib/serviceOnboarding/api';
import { formatDateDe } from '@/lib/ownerFinance/exports';
import type { EngagementTask, EngagementTaskStatus } from '@/lib/serviceOnboarding/types';

/**
 * The task surface.
 *
 * Compact by default — one line per step, status changed in place without a dialog. Detail
 * (evidence, notes, reviewer, blocker reason) expands inline for the one row being worked on.
 *
 * Two statuses cannot be set from the collapsed row alone, because they are meaningless without
 * their explanation: BLOCKED needs a reason and WAITING_FOR_CLIENT needs the exact request. In
 * both cases the row expands, asks for it, and submits the status together with the text. The
 * server enforces the same rule, so an empty reason can never reach the database.
 */

const STATUS_OPTIONS = TASK_STATUS_ORDER.map((status) => ({
  value: status, label: taskStatusLabel[status],
}));

/** Statuses that carry an obligation to explain themselves. */
const NEEDS_TEXT: Partial<Record<EngagementTaskStatus, 'blocker_reason' | 'client_request'>> = {
  blocked: 'blocker_reason',
  waiting_for_client: 'client_request',
};

export function EngagementTaskList({ tasks, healthcare, onChanged, emptyMessage }: {
  tasks: EngagementTask[];
  healthcare: boolean;
  onChanged: () => void;
  emptyMessage?: string;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const visible = useMemo(
    () => tasks.filter((task) => !task.healthcare_only || healthcare),
    [tasks, healthcare],
  );

  if (visible.length === 0) {
    return (
      <div className="px-5 py-4">
        <InlineEmpty>{emptyMessage ?? 'In diesem Abschnitt gibt es keine Schritte.'}</InlineEmpty>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-[var(--cq-border-subtle)]">
      {visible.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          expanded={expanded === task.id}
          onToggleExpanded={() => setExpanded((current) => (current === task.id ? null : task.id))}
          onChanged={onChanged}
        />
      ))}
    </ul>
  );
}

function TaskRow({ task, expanded, onToggleExpanded, onChanged }: {
  task: EngagementTask;
  expanded: boolean;
  onToggleExpanded: () => void;
  onChanged: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** A status chosen in the select that still needs its explanation before it can be sent. */
  const [pendingStatus, setPendingStatus] = useState<EngagementTaskStatus | null>(null);
  const [reason, setReason] = useState(task.blocker_reason ?? '');
  const [request, setRequest] = useState(task.client_request ?? '');
  const explanationRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setReason(task.blocker_reason ?? '');
    setRequest(task.client_request ?? '');
  }, [task.blocker_reason, task.client_request]);

  // Focus straight into the explanation the owner has just been asked for.
  useEffect(() => {
    if (pendingStatus) explanationRef.current?.focus();
  }, [pendingStatus]);

  const submit = async (patch: TaskPatch) => {
    setSaving(true);
    setError(null);
    const { error: err } = await setEngagementTask(task.id, patch);
    setSaving(false);
    if (err) { setError(err); return false; }
    onChanged();
    return true;
  };

  const onStatusPicked = async (next: string) => {
    const status = next as EngagementTaskStatus;
    if (status === task.status) return;
    const needs = NEEDS_TEXT[status];
    if (needs) {
      // Ask before writing: an unexplained blocker is worse than no blocker.
      setPendingStatus(status);
      if (!expanded) onToggleExpanded();
      return;
    }
    setPendingStatus(null);
    await submit({ status });
  };

  const confirmExplained = async () => {
    if (!pendingStatus) return;
    const value = pendingStatus === 'blocked' ? reason.trim() : request.trim();
    if (value === '') {
      setError(pendingStatus === 'blocked'
        ? 'Bitte begründen Sie die Blockade.'
        : 'Bitte angeben, was genau vom Kunden benötigt wird.');
      return;
    }
    const ok = await submit(
      pendingStatus === 'blocked'
        ? { status: 'blocked', blocker_reason: value }
        : { status: 'waiting_for_client', client_request: value },
    );
    if (ok) setPendingStatus(null);
  };

  const detailId = `task-detail-${task.id}`;
  const displayStatus = pendingStatus ?? task.status;

  return (
    <li className={cn(task.status === 'blocked' ? 'bg-red-50/40' : undefined)}>
      <div className="flex flex-col gap-2.5 px-5 py-3 sm:flex-row sm:items-start">
        <div className="order-2 w-full shrink-0 sm:order-1 sm:w-[184px]">
          <PremiumSelect
            id={`task-status-${task.id}`}
            value={displayStatus}
            onChange={(value) => void onStatusPicked(value)}
            options={STATUS_OPTIONS}
            disabled={saving}
            bare
            aria-label={`Status von „${task.title}“`}
          />
        </div>

        <button
          type="button"
          onClick={onToggleExpanded}
          aria-expanded={expanded}
          aria-controls={detailId}
          className={cn('order-1 flex min-w-0 flex-1 items-start gap-2 text-left sm:order-2 sm:pl-1', radius.md, focusRingOnSurface)}
        >
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className={cn('min-w-0 [overflow-wrap:anywhere]', text.bodyStrong, task.status === 'complete' && 'text-[var(--cq-fg-muted)]')}>
                {task.title}
              </span>
              {task.is_go_live_blocker && task.status !== 'complete' && task.status !== 'not_applicable' ? (
                <StatusBadge label="Go-Live-Blocker" tone="warning" />
              ) : null}
              {!task.is_required ? <StatusBadge label="Optional" tone="neutral" /> : null}
              {task.healthcare_only ? <StatusBadge label="Healthcare" tone="info" /> : null}
            </span>
            {task.status === 'blocked' && task.blocker_reason ? (
              <span className="mt-0.5 block text-[12px] leading-4 text-red-700 [overflow-wrap:anywhere]">
                Blockiert: {task.blocker_reason}
              </span>
            ) : task.status === 'waiting_for_client' && task.client_request ? (
              <span className="mt-0.5 block text-[12px] leading-4 text-amber-700 [overflow-wrap:anywhere]">
                Vom Kunden benötigt: {task.client_request}
              </span>
            ) : task.status === 'complete' && task.completed_at ? (
              <span className={cn('mt-0.5 block', text.hint)}>
                Erledigt am {formatDateDe(task.completed_at)}
                {task.reviewer ? ` · Prüfung: ${task.reviewer}` : ''}
              </span>
            ) : task.description ? (
              <span className={cn('mt-0.5 block', text.hint)}>{task.description}</span>
            ) : null}
          </span>
          <ChevronDown
            size={15}
            aria-hidden="true"
            className={cn(
              'mt-0.5 shrink-0 text-[var(--cq-fg-subtle)] transition-transform duration-fast motion-reduce:transition-none',
              expanded && 'rotate-180',
            )}
          />
        </button>
      </div>

      {expanded ? (
        <div id={detailId} className="px-5 pb-4 sm:pl-[212px]">
          <div className={cn('space-y-3 p-3.5', border.hairline, radius.lg, 'bg-[var(--cq-sunken)]')}>
            {task.description ? <p className={text.body}>{task.description}</p> : null}

            {pendingStatus ? (
              <div className={cn('space-y-2 border border-amber-200 bg-amber-50 p-3', radius.md)}>
                <label htmlFor={`explain-${task.id}`} className={cn('block', text.label)}>
                  {pendingStatus === 'blocked'
                    ? 'Warum ist dieser Schritt blockiert?'
                    : 'Was genau wird vom Kunden benötigt?'}
                </label>
                <textarea
                  ref={explanationRef}
                  id={`explain-${task.id}`}
                  rows={2}
                  value={pendingStatus === 'blocked' ? reason : request}
                  onChange={(event) => (pendingStatus === 'blocked' ? setReason(event.target.value) : setRequest(event.target.value))}
                  className={cn(
                    'w-full bg-[var(--cq-surface)] px-3 py-2 text-[13px] leading-5 text-[var(--cq-fg)]',
                    border.hairline, radius.md, focusRing,
                  )}
                />
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => void confirmExplained()} loading={saving}>
                    {pendingStatus === 'blocked' ? 'Als blockiert markieren' : 'Auf Kunde warten'}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => { setPendingStatus(null); setError(null); }}>
                    Abbrechen
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <DetailInput
                id={`evidence-url-${task.id}`} label="Nachweis (Link)" type="url"
                placeholder="https://" initial={task.evidence_url ?? ''}
                onCommit={(value) => submit({ evidence_url: value || null })}
              />
              <DetailInput
                id={`reviewer-${task.id}`} label="Prüfung durch" type="text"
                initial={task.reviewer ?? ''}
                onCommit={(value) => submit({ reviewer: value || null })}
              />
            </div>
            <DetailTextarea
              id={`evidence-note-${task.id}`} label="Nachweis (Notiz)"
              initial={task.evidence_note ?? ''}
              onCommit={(value) => submit({ evidence_note: value || null })}
            />
            <DetailTextarea
              id={`notes-${task.id}`} label="Interne Notiz"
              initial={task.notes ?? ''}
              onCommit={(value) => submit({ notes: value || null })}
            />

            <p className={text.hint}>
              Schritt-Code <span className="font-mono">{task.code}</span>
              {task.completed_at ? ` · erledigt am ${formatDateDe(task.completed_at)}` : ''}
            </p>
            {error ? <p className="text-[12px] leading-4 text-red-600" role="alert">{error}</p> : null}
          </div>
        </div>
      ) : null}
    </li>
  );
}

/* ------------------------------------------------------------------ Detail inputs */

const detailShell = cn(
  'w-full bg-[var(--cq-surface)] px-3 text-[13px] text-[var(--cq-fg)] placeholder:text-[var(--cq-fg-subtle)]',
  border.hairline, radius.md, interactive.transition, focusRing,
);

function DetailInput({ id, label, type, placeholder, initial, onCommit }: {
  id: string; label: string; type: string; placeholder?: string;
  initial: string; onCommit: (value: string) => Promise<boolean>;
}) {
  const [value, setValue] = useState(initial);
  const committed = useRef(initial);
  useEffect(() => { committed.current = initial; setValue(initial); }, [initial]);
  return (
    <div>
      <label htmlFor={id} className={cn('mb-1 block', text.label)}>{label}</label>
      <input
        id={id} type={type} value={value} placeholder={placeholder}
        onChange={(event) => setValue(event.target.value)}
        onBlur={() => { if (value !== committed.current) { committed.current = value; void onCommit(value.trim()); } }}
        className={cn(detailShell, 'h-9')}
      />
    </div>
  );
}

function DetailTextarea({ id, label, initial, onCommit }: {
  id: string; label: string; initial: string; onCommit: (value: string) => Promise<boolean>;
}) {
  const [value, setValue] = useState(initial);
  const committed = useRef(initial);
  useEffect(() => { committed.current = initial; setValue(initial); }, [initial]);
  return (
    <div>
      <label htmlFor={id} className={cn('mb-1 block', text.label)}>{label}</label>
      <textarea
        id={id} rows={2} value={value}
        onChange={(event) => setValue(event.target.value)}
        onBlur={() => { if (value !== committed.current) { committed.current = value; void onCommit(value.trim()); } }}
        className={cn(detailShell, 'resize-y py-2 leading-5')}
      />
    </div>
  );
}

/** Exported for the blocker view, which shows the same status vocabulary. */
export function TaskStatusBadge({ status }: { status: EngagementTaskStatus }) {
  return <StatusBadge label={taskStatusLabel[status]} tone={taskStatusTone[status]} />;
}

export default EngagementTaskList;
