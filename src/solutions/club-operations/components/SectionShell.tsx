// Shared section scaffolding.
//
// Every section renders the same four states from the same adapter shape. Putting that in one place
// means a new section cannot forget its loading announcement or its retry affordance, and the
// states stay identical across the module rather than drifting section by section.
//
// The section header carries the section's own title and purpose. The module header above it
// carries identity, period and health, so the two never repeat each other.

import type { ReactNode } from 'react';
import { Info } from 'lucide-react';

import { ErrorState, Skeleton } from '@/components/dashboard/primitives';
import { border, radius, space, surface, text } from '@/components/dashboard/tokens';
import { cn } from '@/lib/utils';

import { sectionEnter } from '../motion';
import type { ResourceState } from '../useClubOperationsResource';

/**
 * Shown at the foot of every section, so the data's nature is never in doubt.
 *
 * Deliberately repeated per section rather than stated once in the header. A reader who lands deep
 * in Zahlungsabgleich and scrolls a table of discrepancies should not have to scroll back up to find
 * out that none of it is real.
 */
export function FixtureNotice({ children }: { children?: ReactNode }) {
  return (
    <p
      className={cn(
        'flex items-start gap-2 px-3.5 py-2.5',
        radius.lg,
        border.hairline,
        'bg-[var(--cq-sunken)]',
        text.hint,
      )}
    >
      <Info size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
      <span>
        Beispieldaten zur Ansicht des Aufbaus. Es besteht keine Verbindung zu einem Live-System.
        {children ? ` ${children}` : ' Änderungen sind in dieser Ausbaustufe nicht möglich.'}
      </span>
    </p>
  );
}

/** The section's own heading. Sits under the module header, so it never restates the module. */
export function SectionIntro({
  title,
  description,
  meta,
  action,
}: {
  title: string;
  description: string;
  /** Right-aligned context, e.g. the reporting window. Never a control. */
  meta?: ReactNode;
  /** A real control belonging to the section, e.g. its period select. */
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h2 className="text-[17px] font-semibold leading-6 tracking-[-0.01em] text-[var(--cq-fg)]">
          {title}
        </h2>
        <p className={cn('mt-1 max-w-2xl', text.body)}>{description}</p>
        {meta ? <div className={cn('mt-1.5', text.hint)}>{meta}</div> : null}
      </div>
      {action ? <div className="shrink-0 sm:w-56">{action}</div> : null}
    </div>
  );
}

export function SectionShell<T>({
  title,
  description,
  meta,
  action,
  resource,
  loadingLabel,
  errorTitle,
  toolbar,
  children,
  notice,
  loadingShape = 'table',
}: {
  title: string;
  description: string;
  meta?: ReactNode;
  action?: ReactNode;
  resource: ResourceState<T>;
  loadingLabel: string;
  errorTitle: string;
  /** Filters and controls. Rendered above the content and kept visible in every state. */
  toolbar?: ReactNode;
  children: (data: T) => ReactNode;
  notice?: ReactNode;
  /** Which skeleton to show, so the loading state has the shape of what is arriving. */
  loadingShape?: 'table' | 'metrics' | 'report';
}) {
  const { status, data, error, reload } = resource;

  return (
    <div className={space.pageGap}>
      <SectionIntro title={title} description={description} meta={meta} action={action} />

      {toolbar}

      {status === 'loading' ? (
        <div role="status" aria-label={loadingLabel}>
          <SectionSkeleton shape={loadingShape} />
        </div>
      ) : null}

      {status === 'error' ? (
        <ErrorState title={errorTitle} message={error ?? 'Unbekannter Fehler.'} onRetry={reload} />
      ) : null}

      {status === 'ready' && data ? <div className={sectionEnter}>{children(data)}</div> : null}

      <FixtureNotice>{notice}</FixtureNotice>
    </div>
  );
}

/**
 * Skeletons that match the layout they stand in for.
 *
 * A generic six-row table skeleton in front of a metrics page tells the reader to expect a table,
 * then replaces it with cards — a layout shift dressed up as a loading state.
 */
export function SectionSkeleton({ shape }: { shape: 'table' | 'metrics' | 'report' }) {
  const metricRow = (count: number, key: string) => (
    <div key={key} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={cn(surface.card, space.cardPaddingTight)}>
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-3 h-6 w-28" />
          <Skeleton className="mt-2 h-3 w-20" />
        </div>
      ))}
    </div>
  );

  const panelRow = (
    <div className="grid gap-4 lg:grid-cols-2">
      {[0, 1].map((index) => (
        <div key={index} className={cn(surface.card, space.cardPadding)}>
          <Skeleton className="h-3 w-32" />
          <Skeleton className="mt-4 h-[120px] w-full" />
        </div>
      ))}
    </div>
  );

  const tableBlock = (
    <div className={cn(surface.card, 'overflow-hidden p-0')} aria-hidden="true">
      <div className={cn('px-4 py-3', border.hairlineB)}>
        <Skeleton className="h-3 w-40" />
      </div>
      {Array.from({ length: 7 }).map((_, row) => (
        <div
          key={row}
          className={cn('flex items-center gap-4 px-4 py-3 last:border-0', border.hairlineB, border.subtle)}
        >
          {Array.from({ length: 6 }).map((_, column) => (
            <Skeleton key={column} className={cn('h-3', column === 0 ? 'w-28' : 'flex-1')} />
          ))}
        </div>
      ))}
    </div>
  );

  return (
    <div className={space.pageGap} aria-hidden="true">
      {shape === 'metrics' ? (
        <>
          {metricRow(4, 'a')}
          {panelRow}
        </>
      ) : null}
      {shape === 'report' ? (
        <>
          {metricRow(4, 'a')}
          {panelRow}
          {tableBlock}
        </>
      ) : null}
      {shape === 'table' ? (
        <>
          {metricRow(4, 'a')}
          {tableBlock}
        </>
      ) : null}
    </div>
  );
}

/** A card with a heading, used for the panels that are not tables. */
export function Panel({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn(surface.card, space.cardPadding, 'flex min-w-0 flex-col', className)}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className={text.cardTitle}>{title}</h3>
          {description ? <p className={cn('mt-0.5', text.hint)}>{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </section>
  );
}
