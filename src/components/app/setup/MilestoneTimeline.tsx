import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { Milestone } from '@/lib/clientOnboarding/types';

/**
 * Customer-facing project timeline. Every state comes from the server
 * (client_onboarding_milestones), which derives it from the real engagement lifecycle and the
 * intake status — nothing here is estimated or simulated, and there are no dates we could not keep.
 */
export function MilestoneTimeline({ milestones, orientation = 'vertical' }: { milestones: Milestone[]; orientation?: 'vertical' | 'horizontal' }) {
  if (orientation === 'horizontal') {
    return (
      <ol className="flex gap-1.5" aria-label="Projektfortschritt">
        {milestones.map((m) => (
          <li key={m.key} className="min-w-0 flex-1">
            <span className={cn('block h-1 rounded-full',
              m.state === 'done' ? 'bg-[var(--cq-fg)]' : m.state === 'current' ? 'bg-[var(--cq-fg-muted)]' : 'bg-[var(--cq-hover)]')} />
            <span className={cn('mt-1.5 block truncate text-[11px] leading-4',
              m.state === 'upcoming' ? 'text-[var(--cq-fg-subtle)]' : 'text-[var(--cq-fg)]', m.state === 'current' && 'font-medium')}>
              {m.label}
            </span>
          </li>
        ))}
      </ol>
    );
  }
  return (
    <ol className="relative space-y-0" aria-label="Projektfortschritt">
      {milestones.map((m, i) => (
        <li key={m.key} className="relative flex gap-3 pb-4 last:pb-0">
          {i < milestones.length - 1 ? (
            <span aria-hidden="true" className={cn('absolute left-[9px] top-5 h-[calc(100%-12px)] w-px',
              m.state === 'done' ? 'bg-[var(--cq-fg)]' : 'bg-[var(--cq-border)]')} />
          ) : null}
          <span aria-hidden="true" className={cn('relative z-10 mt-0.5 flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full border',
            m.state === 'done' && 'border-[var(--cq-fg)] bg-[var(--cq-fg)] text-white',
            m.state === 'current' && 'border-[var(--cq-fg)] bg-[var(--cq-surface)]',
            m.state === 'upcoming' && 'border-[var(--cq-border-strong)] bg-[var(--cq-surface)]')}>
            {m.state === 'done' ? <Check size={11} strokeWidth={3} /> : m.state === 'current' ? <span className="h-2 w-2 rounded-full bg-[var(--cq-fg)]" /> : null}
          </span>
          <span className="min-w-0">
            <span className={cn('block text-[13px] leading-5',
              m.state === 'upcoming' ? 'text-[var(--cq-fg-subtle)]' : 'text-[var(--cq-fg)]', m.state === 'current' && 'font-semibold')}>
              {m.label}
            </span>
            <span className="sr-only">{m.state === 'done' ? 'abgeschlossen' : m.state === 'current' ? 'aktueller Schritt' : 'folgt'}</span>
            {m.state === 'current' ? <span className="block text-[11.5px] leading-4 text-[var(--cq-fg-muted)]">Aktueller Schritt</span> : null}
          </span>
        </li>
      ))}
    </ol>
  );
}
