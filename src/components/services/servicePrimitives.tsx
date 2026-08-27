import { type ReactNode } from 'react';

import { cn } from '@/lib/utils';
import { border, focusRing, interactive, radius, surface, text } from '@/components/dashboard';

// A small local design vocabulary for the service delivery workspace, built entirely from the
// existing dashboard tokens: no new font, no new icon family, no new radius, no new colour.
// Everything here exists because the workspace needs a shape the shared primitives do not have —
// a progress meter, a definition row, a quiet section shell.

/* ------------------------------------------------------------------ Meter */

export type MeterTone = 'neutral' | 'progress' | 'complete' | 'blocked';

const meterFill: Record<MeterTone, string> = {
  neutral: 'bg-[var(--cq-border-strong)]',
  progress: 'bg-[var(--cq-fg)]',
  complete: 'bg-emerald-500',
  blocked: 'bg-amber-500',
};

/**
 * A 4px reading meter. Deliberately not a dial: a row of these compares nine categories at a
 * glance, which a ring cannot. `percent === null` means "no applicable required items", and
 * renders as an empty track rather than as a misleading 0%.
 */
export function Meter({ percent, tone = 'progress', className }: {
  percent: number | null;
  tone?: MeterTone;
  className?: string;
}) {
  const width = percent === null ? 0 : Math.max(0, Math.min(100, percent));
  return (
    <div
      className={cn('h-1 w-full overflow-hidden bg-[var(--cq-sunken)]', radius.full, className)}
      // The numeric value is always printed next to the meter, so it is decorative here.
      aria-hidden="true"
    >
      <div
        className={cn('h-full transition-[width] duration-base ease-premium motion-reduce:transition-none', radius.full, meterFill[tone])}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ Definition row */

/**
 * Label/value pair for read-only structured data. Wraps rather than truncating.
 *
 * The label uses the `label` tone, not `hint`: it names a value the owner is reading, so it
 * has to stay legible. `hint` sits at 3.4:1 on white and is reserved here for the secondary
 * line under the value.
 */
export function DefRow({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,140px)_minmax(0,1fr)] gap-x-4 gap-y-0.5 py-1.5">
      <dt className={cn('pt-px', text.label)}>{label}</dt>
      <dd className={cn('min-w-0 [overflow-wrap:anywhere]', text.bodyStrong)}>
        {value}
        {hint ? <span className={cn('mt-0.5 block', text.hint)}>{hint}</span> : null}
      </dd>
    </div>
  );
}

/* ------------------------------------------------------------------ Section shell */

/**
 * One operational phase. A plain hairline block rather than a card inside a card — the workspace
 * already sits on a card, and nesting boxes is the fastest way to make an interface feel cheap.
 */
export function PhaseSection({ title, description, meta, children, id }: {
  title: string;
  description?: string | null;
  meta?: ReactNode;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className={cn('overflow-hidden', surface.card)} aria-labelledby={id ? `${id}-title` : undefined}>
      <header className={cn('flex flex-wrap items-start justify-between gap-3 px-5 py-3.5', border.hairlineB)}>
        <div className="min-w-0">
          <h3 id={id ? `${id}-title` : undefined} className={text.cardTitle}>{title}</h3>
          {description ? <p className={cn('mt-0.5 max-w-2xl', text.hint)}>{description}</p> : null}
        </div>
        {meta ? <div className="flex shrink-0 flex-wrap items-center gap-2">{meta}</div> : null}
      </header>
      {children}
    </section>
  );
}

/* ------------------------------------------------------------------ Quiet inline empty state */

/**
 * The compact empty state used inside a section. The shared `EmptyState` is a full-page shape;
 * this one says what belongs here without leaving a dead 200px hole in a dense workspace.
 */
export function InlineEmpty({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className={cn('flex flex-col items-start gap-3 border border-dashed border-[var(--cq-border-strong)] px-4 py-5 sm:flex-row sm:items-center sm:justify-between', radius.lg, 'bg-[var(--cq-sunken)]')}>
      <p className={cn('min-w-0', text.body)}>{children}</p>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ Selectable card */

/**
 * The selectable tile used for service selection. A real `<button>` with `aria-pressed`, so the
 * selected state reaches assistive technology and the keyboard, and is never communicated by
 * colour alone — the check mark carries it too.
 */
export function SelectCard({ selected, onToggle, icon, title, description, disabled, badge }: {
  selected: boolean;
  onToggle: () => void;
  icon: ReactNode;
  title: string;
  description: string;
  disabled?: boolean;
  badge?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        'group relative flex w-full items-start gap-3 p-3.5 text-left',
        radius.lg, interactive.transition, interactive.disabled, focusRing,
        selected
          ? 'border border-[var(--cq-fg)] bg-[var(--cq-hover)]'
          : cn(border.hairline, 'bg-[var(--cq-surface)] hover:border-[var(--cq-border-strong)] hover:bg-[var(--cq-hover)]'),
      )}
    >
      <span
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center', radius.md, interactive.transition,
          selected ? 'bg-[var(--cq-fg)] text-white' : cn(border.hairline, 'bg-[var(--cq-sunken)] text-[var(--cq-fg-subtle)]'),
        )}
        aria-hidden="true"
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-1.5">
          <span className={text.bodyStrong}>{title}</span>
          {badge}
        </span>
        <span className={cn('mt-0.5 block', text.hint)}>{description}</span>
      </span>
      <span
        className={cn(
          'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border', radius.full, interactive.transition,
          selected ? 'border-[var(--cq-fg)] bg-[var(--cq-fg)] text-white' : 'border-[var(--cq-border-strong)] bg-[var(--cq-surface)]',
        )}
        aria-hidden="true"
      >
        {selected ? (
          <svg viewBox="0 0 10 10" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1.5 5.2 3.8 7.5 8.5 2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
      </span>
    </button>
  );
}
