// Generic read-only detail panel.
//
// A definition list with a close control and nothing else. There is deliberately no action row and
// no slot for one: every mutation in the reference dashboard needs its own server-side permission
// check and audit trail before it can appear anywhere in this module.
//
// Three things changed in this pass:
//   * The panel takes focus when it opens and returns it to the row that opened it on close, so a
//     keyboard reader is not silently left at the top of the table.
//   * Rows are grouped, so a fourteen-row panel reads as identification / money / timeline rather
//     than as one undifferentiated list.
//   * On wide screens the panel sticks while the table scrolls beneath it. A detail column that
//     scrolls away from the row it describes is a column the reader has to keep re-finding.

import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

import { IconButton } from '@/components/dashboard/primitives';
import { border, radius, space, surface, text } from '@/components/dashboard/tokens';
import { cn } from '@/lib/utils';

import { panelEnter } from '../motion';

export interface DetailRow {
  label: string;
  value: ReactNode;
  /** Puts the value on its own line — for anything long enough to wrap awkwardly. */
  block?: boolean;
}

export interface DetailGroup {
  label: string;
  rows: DetailRow[];
}

export function DetailPanel({
  eyebrow,
  title,
  subtitle,
  rows,
  groups,
  onClose,
  children,
}: {
  eyebrow: string;
  title: string;
  /** Status badges or a one-line summary directly under the title. */
  subtitle?: ReactNode;
  /** Ungrouped rows, rendered above any groups. */
  rows?: DetailRow[];
  groups?: DetailGroup[];
  onClose: () => void;
  /** Extra content below the definition lists, e.g. a usage history. */
  children?: ReactNode;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const openerRef = useRef<Element | null>(null);

  useEffect(() => {
    // Remember who opened us, then move focus into the panel so the next Tab lands inside it.
    openerRef.current = document.activeElement;
    headingRef.current?.focus();

    return () => {
      const opener = openerRef.current;
      // Only restore if the opener is still on the page — after a filter change it may not be.
      if (opener instanceof HTMLElement && document.contains(opener)) opener.focus();
    };
  }, []);

  return (
    <section
      aria-labelledby="club-ops-detail-title"
      className={cn(
        surface.card,
        space.cardPadding,
        panelEnter,
        // Sticks beside a scrolling table on wide screens; flows normally below it on narrow ones.
        'xl:sticky xl:top-4 xl:max-h-[calc(100vh-2rem)] xl:overflow-y-auto',
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={text.eyebrow}>{eyebrow}</p>
          <h3
            id="club-ops-detail-title"
            ref={headingRef}
            tabIndex={-1}
            className={cn('mt-0.5 break-words outline-none', text.cardTitle)}
          >
            {title}
          </h3>
          {subtitle ? <div className="mt-2 flex flex-wrap gap-1.5">{subtitle}</div> : null}
        </div>
        <IconButton icon={X} label="Detailansicht schließen" variant="ghost" onClick={onClose} />
      </div>

      {rows && rows.length > 0 ? <DetailRows rows={rows} /> : null}

      {groups?.map((group) => (
        <div key={group.label} className={cn('mt-4 pt-3 first:mt-0 first:border-0 first:pt-0', border.hairlineT)}>
          <p className={text.eyebrow}>{group.label}</p>
          <div className="mt-1.5">
            <DetailRows rows={group.rows} />
          </div>
        </div>
      ))}

      {children}
    </section>
  );
}

function DetailRows({ rows }: { rows: DetailRow[] }) {
  return (
    <dl className="divide-y divide-[var(--cq-border-subtle)]">
      {rows.map((row) => (
        <div
          key={row.label}
          className={cn(
            'gap-x-4 gap-y-1 py-2',
            row.block
              ? 'block'
              : 'flex flex-wrap items-baseline justify-between',
          )}
        >
          <dt className={cn('shrink-0', text.eyebrow)}>{row.label}</dt>
          <dd className={cn('min-w-0', row.block ? 'mt-1 text-left' : 'text-right', text.body)}>
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * List beside detail on wide screens, detail below list on narrow.
 *
 * The grid only splits once a detail is open, so an unopened table uses the full width rather than
 * reserving an empty 340px column for a panel that may never appear.
 */
export function DetailLayout({ list, detail }: { list: ReactNode; detail: ReactNode | null }) {
  return (
    <div className={cn('grid gap-4', detail && 'xl:grid-cols-[minmax(0,1fr)_360px]')}>
      <div className="min-w-0">{list}</div>
      {detail}
    </div>
  );
}

/** A small labelled block for use inside a panel's children slot. */
export function DetailNote({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={cn('mt-4 p-3', radius.lg, 'bg-[var(--cq-sunken)]', border.hairline)}>
      <p className={text.eyebrow}>{label}</p>
      <div className={cn('mt-1', text.body)}>{children}</div>
    </div>
  );
}
