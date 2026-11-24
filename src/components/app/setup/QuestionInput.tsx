import { Lock, Plus, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { AppField, AppTextarea } from '@/components/app/CustomerAppPrimitives';
import { radius, text } from '@/components/dashboard/tokens';
import { DAYS, defaultHours } from '@/lib/clientOnboarding/intake';
import type { AnswerValue, DayHours, OpeningHours, Question } from '@/lib/clientOnboarding/types';

const MAX_RANGES = 3;

/**
 * One intake question. Renders the control that fits its kind; every control is a native
 * element with a visible label, so keyboard and screen-reader use work without extra wiring.
 */
export function QuestionInput({
  question, value, onChange, error, locked, ownerComment, prefilled,
}: {
  question: Question;
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue) => void;
  error?: string | null;
  locked?: boolean;
  ownerComment?: string | null;
  prefilled?: boolean;
}) {
  const id = `q-${question.code}`;
  const label = `${question.label}${question.required ? ' *' : ''}`;
  const description = question.help ?? undefined;

  const notes = (
    <>
      {ownerComment ? (
        <p className={cn('mt-1.5 border-l-2 border-amber-400 bg-amber-50 px-2.5 py-1.5 text-[12.5px] leading-5 text-amber-900', radius.sm)}>
          <span className="font-medium">Hinweis von Cogniiq:</span> {ownerComment}
        </p>
      ) : null}
      {locked ? (
        <p className={cn('mt-1.5 inline-flex items-center gap-1', text.hint)}>
          <Lock size={11} aria-hidden="true" /> Von uns bestätigt. Für Änderungen schreiben Sie uns bitte kurz.
        </p>
      ) : null}
      {prefilled && !locked ? <p className={cn('mt-1.5', text.hint)}>Aus Ihren bisherigen Angaben übernommen. Bitte kurz prüfen.</p> : null}
    </>
  );

  if (question.kind === 'textarea') {
    return (
      <div>
        <AppTextarea id={id} label={label} description={description} error={error ?? undefined} disabled={locked}
          placeholder={question.placeholder ?? undefined} maxLength={question.max_length ?? undefined}
          value={typeof value === 'string' ? value : ''} onChange={(e) => onChange(e.target.value)} />
        {notes}
      </div>
    );
  }

  if (question.kind === 'choice') {
    return (
      <fieldset>
        <legend className={cn('mb-1.5', text.label)}>{label}</legend>
        {description ? <p className={cn('-mt-0.5 mb-2', text.hint)}>{description}</p> : null}
        <div className="grid gap-2 sm:grid-cols-2" role="radiogroup">
          {(question.options ?? []).map((o) => {
            const checked = value === o.value;
            return (
              <label key={o.value} className={cn('flex min-h-11 cursor-pointer items-center gap-2.5 border px-3 py-2 text-[13px] transition-colors', radius.md,
                checked ? 'border-[var(--cq-fg)] bg-[var(--cq-hover)] text-[var(--cq-fg)]' : 'border-[var(--cq-border)] text-[var(--cq-fg-muted)] hover:border-[var(--cq-border-strong)]',
                locked && 'pointer-events-none opacity-60')}>
                <input type="radio" name={id} className="h-4 w-4 accent-[var(--cq-fg)]" checked={checked} disabled={locked}
                  onChange={() => onChange(o.value)} />
                {o.label}
              </label>
            );
          })}
        </div>
        {error ? <p className="mt-1 text-[12px] text-red-600">{error}</p> : null}
        {notes}
      </fieldset>
    );
  }

  if (question.kind === 'multi_choice') {
    const selected = Array.isArray(value) ? (value as string[]) : [];
    return (
      <fieldset>
        <legend className={cn('mb-1.5', text.label)}>{label}</legend>
        {description ? <p className={cn('-mt-0.5 mb-2', text.hint)}>{description}</p> : null}
        <div className="grid gap-2 sm:grid-cols-2">
          {(question.options ?? []).map((o) => {
            const checked = selected.includes(o.value);
            return (
              <label key={o.value} className={cn('flex min-h-11 cursor-pointer items-center gap-2.5 border px-3 py-2 text-[13px] transition-colors', radius.md,
                checked ? 'border-[var(--cq-fg)] bg-[var(--cq-hover)] text-[var(--cq-fg)]' : 'border-[var(--cq-border)] text-[var(--cq-fg-muted)] hover:border-[var(--cq-border-strong)]',
                locked && 'pointer-events-none opacity-60')}>
                <input type="checkbox" className="h-4 w-4 accent-[var(--cq-fg)]" checked={checked} disabled={locked}
                  onChange={() => onChange(checked ? selected.filter((v) => v !== o.value) : [...selected, o.value])} />
                {o.label}
              </label>
            );
          })}
        </div>
        {error ? <p className="mt-1 text-[12px] text-red-600">{error}</p> : null}
        {notes}
      </fieldset>
    );
  }

  if (question.kind === 'hours') {
    return (
      <fieldset>
        <legend className={cn('mb-1.5', text.label)}>{label}</legend>
        {description ? <p className={cn('-mt-0.5 mb-2', text.hint)}>{description}</p> : null}
        <HoursEditor value={(value as OpeningHours | null) ?? null} onChange={onChange} disabled={locked} idPrefix={id} />
        {error ? <p className="mt-1.5 text-[12px] text-red-600">{error}</p> : null}
        {notes}
      </fieldset>
    );
  }

  const inputType = question.kind === 'email' ? 'email' : question.kind === 'phone' ? 'tel' : question.kind === 'url' ? 'url' : 'text';
  return (
    <div>
      <AppField id={id} label={label} description={description} error={error ?? undefined} disabled={locked} type={inputType}
        inputMode={question.kind === 'number' ? 'numeric' : question.kind === 'phone' ? 'tel' : undefined}
        autoComplete={question.kind === 'phone' ? 'tel' : question.kind === 'url' ? 'url' : question.kind === 'email' ? 'email' : 'off'}
        placeholder={question.placeholder ?? undefined} maxLength={question.max_length ?? undefined}
        value={value === null || value === undefined ? '' : String(value)} onChange={(e) => onChange(e.target.value)} />
      {notes}
    </div>
  );
}

export function HoursEditor({ value, onChange, disabled, idPrefix }: {
  value: OpeningHours | null; onChange: (v: OpeningHours) => void; disabled?: boolean; idPrefix: string;
}) {
  const hours = value && Object.keys(value).length ? value : null;
  if (!hours) {
    return (
      <button type="button" disabled={disabled} onClick={() => onChange(defaultHours())}
        className={cn('inline-flex min-h-11 items-center gap-1.5 border border-dashed border-[var(--cq-border-strong)] px-3 text-[13px] text-[var(--cq-fg)] hover:bg-[var(--cq-hover)]', radius.md)}>
        <Plus size={14} aria-hidden="true" /> Öffnungszeiten eintragen
      </button>
    );
  }

  const update = (day: string, next: DayHours) => onChange({ ...hours, [day]: next });

  return (
    <div className={cn('divide-y divide-[var(--cq-border)] border border-[var(--cq-border)]', radius.md)}>
      {DAYS.map((d) => {
        const day: DayHours = hours[d.key] ?? { closed: true, ranges: [] };
        return (
          <div key={d.key} className="flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center">
            <div className="flex items-center justify-between sm:w-40 sm:shrink-0">
              <span className="text-[13px] font-medium text-[var(--cq-fg)]">{d.label}</span>
              <label className="inline-flex items-center gap-1.5 text-[12px] text-[var(--cq-fg-muted)] sm:hidden">
                <input type="checkbox" className="h-4 w-4 accent-[var(--cq-fg)]" checked={day.closed} disabled={disabled}
                  onChange={(e) => update(d.key, e.target.checked ? { closed: true, ranges: [] } : { closed: false, ranges: [['08:00', '17:00']] })} />
                geschlossen
              </label>
            </div>
            <div className="flex flex-1 flex-wrap items-center gap-2">
              {day.closed ? (
                <span className={text.hint}>Geschlossen</span>
              ) : day.ranges.map(([start, end], i) => (
                <span key={i} className="inline-flex items-center gap-1">
                  <input aria-label={`${d.label} Zeitfenster ${i + 1} Beginn`} id={`${idPrefix}-${d.key}-${i}-s`} type="time" value={start} disabled={disabled}
                    onChange={(e) => update(d.key, { closed: false, ranges: day.ranges.map((r, j) => (j === i ? [e.target.value, r[1]] : r)) as Array<[string, string]> })}
                    className={cn('h-10 w-[6.5rem] border border-[var(--cq-border)] bg-[var(--cq-surface)] px-2 text-[13px] tabular-nums', radius.sm)} />
                  <span className="text-[var(--cq-fg-subtle)]">–</span>
                  <input aria-label={`${d.label} Zeitfenster ${i + 1} Ende`} type="time" value={end} disabled={disabled}
                    onChange={(e) => update(d.key, { closed: false, ranges: day.ranges.map((r, j) => (j === i ? [r[0], e.target.value] : r)) as Array<[string, string]> })}
                    className={cn('h-10 w-[6.5rem] border border-[var(--cq-border)] bg-[var(--cq-surface)] px-2 text-[13px] tabular-nums', radius.sm)} />
                  {day.ranges.length > 1 ? (
                    <button type="button" disabled={disabled} aria-label={`${d.label} Zeitfenster ${i + 1} entfernen`}
                      onClick={() => update(d.key, { closed: false, ranges: day.ranges.filter((_, j) => j !== i) })}
                      className={cn('flex h-8 w-8 items-center justify-center text-[var(--cq-fg-subtle)] hover:bg-[var(--cq-hover)] hover:text-[var(--cq-fg)]', radius.sm)}>
                      <X size={14} aria-hidden="true" />
                    </button>
                  ) : null}
                </span>
              ))}
              {!day.closed && day.ranges.length < MAX_RANGES ? (
                <button type="button" disabled={disabled}
                  onClick={() => update(d.key, { closed: false, ranges: [...day.ranges, ['14:00', '18:00']] })}
                  className="text-[12px] font-medium text-[var(--cq-fg-muted)] underline-offset-2 hover:text-[var(--cq-fg)] hover:underline">
                  + Zeitfenster
                </button>
              ) : null}
            </div>
            <label className="hidden items-center gap-1.5 text-[12px] text-[var(--cq-fg-muted)] sm:inline-flex">
              <input type="checkbox" className="h-4 w-4 accent-[var(--cq-fg)]" checked={day.closed} disabled={disabled}
                onChange={(e) => update(d.key, e.target.checked ? { closed: true, ranges: [] } : { closed: false, ranges: [['08:00', '17:00']] })} />
              geschlossen
            </label>
          </div>
        );
      })}
    </div>
  );
}
