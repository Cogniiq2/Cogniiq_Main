import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Check, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  Checkbox, PremiumSelect, border, focusRing, focusRingOnSurface, interactive, radius, text,
} from '@/components/dashboard';
import { setEngagementField } from '@/lib/serviceOnboarding/api';
import type { EngagementField } from '@/lib/serviceOnboarding/types';

/**
 * The structured-data editor.
 *
 * Save UX: text-like fields commit on blur, switches and selects commit immediately. There is no
 * page-level save button to hunt for, and no debounce racing the owner's typing — a field is
 * written exactly once, when they have finished with it. Every save reports its own outcome next
 * to the field it belongs to; a failure keeps the typed value on screen so nothing is silently
 * lost.
 *
 * Consequential actions (status transitions, archiving, go-live) are NOT autosaved — those go
 * through explicit confirmation elsewhere.
 */

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

function currentValue(field: EngagementField): string {
  if (field.value_bool !== null) return field.value_bool ? 'true' : 'false';
  if (field.value_number !== null) return String(field.value_number);
  if (field.value_date !== null) return field.value_date;
  return field.value_text ?? '';
}

export function EngagementFieldGroup({ fields, onSaved, disabled }: {
  fields: EngagementField[];
  /** Called after a successful write so the parent can refresh readiness and the go-live gate. */
  onSaved: () => void;
  disabled?: boolean;
}) {
  if (fields.length === 0) return null;
  return (
    <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
      {fields.map((field) => (
        <FieldEditor
          key={field.id}
          field={field}
          onSaved={onSaved}
          disabled={disabled}
          // Long-form answers and switch rows read badly in a half-width column.
          className={field.data_type === 'textarea' || field.data_type === 'boolean' ? 'sm:col-span-2' : undefined}
        />
      ))}
    </div>
  );
}

function FieldEditor({ field, onSaved, disabled, className }: {
  field: EngagementField;
  onSaved: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const [draft, setDraft] = useState(() => currentValue(field));
  const [state, setState] = useState<SaveState>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const committed = useRef(currentValue(field));

  // Adopt server values again after a reload, but never overwrite what the owner is typing.
  useEffect(() => {
    const next = currentValue(field);
    if (next !== committed.current) {
      committed.current = next;
      setDraft(next);
    }
  }, [field]);

  const inputId = `field-${field.id}`;
  const hintId = field.description ? `${inputId}-hint` : undefined;
  const isNotApplicable = field.not_applicable;

  const commit = async (value: string) => {
    if (value === committed.current) { setState('idle'); return; }
    setState('saving');
    const { error } = await setEngagementField(field.id, { value: value === '' ? null : value });
    if (error) {
      setState('error');
      setMessage(error);
      return;
    }
    committed.current = value;
    setState('saved');
    setMessage(null);
    onSaved();
  };

  const toggleApplicable = async (notApplicable: boolean) => {
    setState('saving');
    const { error } = await setEngagementField(field.id, { not_applicable: notApplicable });
    if (error) { setState('error'); setMessage(error); return; }
    setState('saved');
    setMessage(null);
    onSaved();
  };

  const inputShell = cn(
    'w-full bg-[var(--cq-surface)] px-3 text-[13px] text-[var(--cq-fg)] placeholder:text-[var(--cq-fg-subtle)]',
    border.hairline, radius.md, interactive.transition, focusRing, interactive.disabled,
  );

  return (
    <div className={cn('min-w-0', className)}>
      <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <label htmlFor={inputId} className={cn('min-w-0', text.label)}>
          {field.label}
          {/* Required-ness reaches a screen reader as words, not as a decorative asterisk. */}
          {field.is_required && !isNotApplicable ? (
            <>
              <span className="ml-0.5 text-red-600" aria-hidden="true">*</span>
              <span className="sr-only"> (Pflichtangabe)</span>
            </>
          ) : null}
          {field.is_go_live_blocker ? (
            <span className={cn('ml-1.5 border border-amber-200 bg-amber-50 px-1 py-px text-[10px] font-medium text-amber-700', radius.sm)}>
              Go-Live
            </span>
          ) : null}
          {field.healthcare_only ? (
            <span className={cn('ml-1.5 border border-sky-200 bg-sky-50 px-1 py-px text-[10px] font-medium text-sky-700', radius.sm)}>
              Healthcare
            </span>
          ) : null}
        </label>
        <SaveIndicator state={state} />
      </div>

      {isNotApplicable ? (
        <div className={cn('flex flex-wrap items-center justify-between gap-2 px-3 py-2', border.hairline, radius.md, 'bg-[var(--cq-sunken)]')}>
          <span className={text.hint}>Für diesen Kunden nicht zutreffend.</span>
          <button
            type="button"
            onClick={() => void toggleApplicable(false)}
            disabled={disabled}
            className={cn('text-[12px] font-medium text-[var(--cq-fg)] underline-offset-2 hover:underline', radius.sm, focusRing)}
          >
            Wieder aktivieren
          </button>
        </div>
      ) : field.data_type === 'boolean' ? (
        <Checkbox
          id={inputId}
          label={field.description ?? 'Ja'}
          checked={draft === 'true'}
          disabled={disabled}
          onChange={(checked) => { setDraft(String(checked)); void commit(String(checked)); }}
        />
      ) : field.data_type === 'select' ? (
        <PremiumSelect
          id={inputId}
          value={draft}
          onChange={(value) => { setDraft(value); void commit(value); }}
          options={[{ value: '', label: '— nicht gesetzt —' }, ...field.options]}
          disabled={disabled}
        />
      ) : field.data_type === 'textarea' ? (
        <textarea
          id={inputId}
          value={draft}
          rows={3}
          disabled={disabled}
          aria-describedby={hintId}
          placeholder={field.placeholder ?? undefined}
          onChange={(event) => { setDraft(event.target.value); setState('idle'); }}
          onBlur={() => void commit(draft)}
          className={cn(inputShell, 'resize-y py-2 leading-5')}
        />
      ) : (
        <div className="flex items-center gap-2">
          <input
            id={inputId}
            type={field.data_type === 'number' ? 'number' : field.data_type === 'date' ? 'date' : field.data_type === 'url' ? 'url' : field.data_type === 'phone' ? 'tel' : 'text'}
            inputMode={field.data_type === 'number' ? 'decimal' : undefined}
            value={draft}
            disabled={disabled}
            aria-describedby={hintId}
            placeholder={field.placeholder ?? undefined}
            onChange={(event) => { setDraft(event.target.value); setState('idle'); }}
            onBlur={() => void commit(draft)}
            className={cn(inputShell, 'h-9')}
          />
          {field.unit ? <span className={cn('shrink-0', text.hint)}>{field.unit}</span> : null}
        </div>
      )}

      {field.description && field.data_type !== 'boolean' && !isNotApplicable ? (
        <p id={hintId} className={cn('mt-1', text.hint)}>{field.description}</p>
      ) : null}
      {state === 'error' && message ? (
        <p className="mt-1 text-[11.5px] leading-4 text-red-600" role="alert">{message}</p>
      ) : null}

      {!isNotApplicable && !field.is_required && !field.is_go_live_blocker ? (
        <button
          type="button"
          onClick={() => void toggleApplicable(true)}
          disabled={disabled}
          className={cn('mt-1 text-[11.5px] text-[var(--cq-fg-subtle)] underline-offset-2 hover:text-[var(--cq-fg-muted)] hover:underline', radius.sm, focusRingOnSurface)}
        >
          Nicht zutreffend
        </button>
      ) : null}
    </div>
  );
}

/** Save feedback that occupies a fixed slot, so nothing shifts when it appears. */
function SaveIndicator({ state }: { state: SaveState }) {
  if (state === 'idle') return <span className="h-4" aria-hidden="true" />;
  if (state === 'saving') {
    return (
      <span className={cn('inline-flex items-center gap-1', text.hint)} role="status">
        <Loader2 size={11} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> Speichern…
      </span>
    );
  }
  if (state === 'saved') {
    return (
      <span className="inline-flex items-center gap-1 text-[11.5px] leading-4 text-emerald-700" role="status">
        <Check size={11} aria-hidden="true" /> Gespeichert
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11.5px] leading-4 text-red-600" role="status">
      <AlertCircle size={11} aria-hidden="true" /> Nicht gespeichert
    </span>
  );
}

export default EngagementFieldGroup;
