// The module's record table.
//
// Module-local rather than a change to the shared `DataTable`, which the owner-finance pages and the
// internal tasks module also render — reshaping it for this module's needs would be a redesign of
// three surfaces that nobody asked to have redesigned.
//
// What it adds over the shared primitive, and why:
//
//   Sticky header      Only once a table is long enough to scroll past its own headings. A sticky
//                      header on an eight-row table is chrome that pins nothing.
//   Working sort       Local, real, and offered only on columns that declare a sort key. A sort
//                      affordance on a column that cannot sort is exactly the kind of dead control
//                      this phase is meant not to have.
//   Stable widths      Declared per column and applied through <colgroup>, so switching a filter
//                      does not reflow every column to fit the new longest cell.
//   Selected row       A rail and a tint on the row whose detail panel is open. The previous version
//                      opened a panel with no indication of which row it belonged to.
//   Keyboard access    The row's identifier cell is a real button. A click handler on <tr> alone is
//                      reachable by pointer only.
//   Prioritised mobile Two or three fields chosen per section, with the rest behind a disclosure —
//                      rather than every column restacked as a definition list.

import { useMemo, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';

import { border, focusRingOnSurface, radius, space, surface, text, zIndex } from '@/components/dashboard/tokens';
import { cn } from '@/lib/utils';

import { feedback } from '../motion';

export interface RecordColumn<T> {
  key: string;
  header: string;
  align?: 'left' | 'right';
  /** CSS width for the <col>. Omit for the column that should absorb slack. */
  width?: string;
  render: (row: T) => ReactNode;
  /**
   * Makes the column sortable. Must return a value comparable with < and >.
   * Columns without it render a plain header — no inert sort arrow.
   *
   * `null` is permitted, and means the underlying value is unavailable. Such rows sort to the end in
   * both directions rather than being coerced to `''` or `0`, which would file them among the
   * genuine empties and the genuine zeroes.
   */
  sortValue?: (row: T) => string | number | null;
  /**
   * Placement in the phone layout.
   *   primary   — shown in the card's field grid (keep to three at most)
   *   secondary — folded into the card's "Weitere Angaben" disclosure
   *   hidden    — omitted entirely; already carried by the title or subtitle
   */
  mobile?: 'primary' | 'secondary' | 'hidden';
}

type SortState = { key: string; direction: 'asc' | 'desc' } | null;

/** Long enough that the header scrolls out of view before the rows run out. */
const STICKY_FROM_ROWS = 12;

export function RecordTable<T>({
  columns,
  rows,
  getRowKey,
  onSelect,
  selectedKey,
  rowLabel,
  mobileTitle,
  mobileSubtitle,
  mobileBadge,
  minWidth = 880,
  initialSort,
  caption,
}: {
  columns: RecordColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  onSelect?: (row: T) => void;
  selectedKey?: string | null;
  /** Accessible name of the row-opening control, e.g. `(row) => \`Buchung ${row.reference}\``. */
  rowLabel: (row: T) => string;
  mobileTitle: (row: T) => ReactNode;
  mobileSubtitle?: (row: T) => ReactNode;
  /** Status badge pinned to the top-right of the phone card, where the eye lands first. */
  mobileBadge?: (row: T) => ReactNode;
  minWidth?: number;
  initialSort?: { key: string; direction: 'asc' | 'desc' };
  caption: string;
}) {
  const [sort, setSort] = useState<SortState>(initialSort ?? null);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const column = columns.find((candidate) => candidate.key === sort.key);
    if (!column?.sortValue) return rows;
    const direction = sort.direction === 'asc' ? 1 : -1;
    // Copy first: sorting the caller's array in place would reorder the source list too.
    return [...rows].sort((a, b) => {
      const left = column.sortValue!(a);
      const right = column.sortValue!(b);
      // Unavailable values are not small values. They sink to the bottom whichever way the column is
      // sorted, so reversing the order never parades them at the top as if they were results.
      if (left === null || right === null) {
        if (left === right) return 0;
        return left === null ? 1 : -1;
      }
      if (left === right) return 0;
      return (left < right ? -1 : 1) * direction;
    });
  }, [rows, sort, columns]);

  const toggleSort = (key: string) =>
    setSort((previous) =>
      previous?.key === key
        ? previous.direction === 'asc'
          ? { key, direction: 'desc' }
          : // Third click clears, so the reader can always get back to the section's own order —
            // which for alerts and the activity log is meaningful rather than arbitrary.
            null
        : { key, direction: 'asc' },
    );

  const sticky = sorted.length > STICKY_FROM_ROWS;
  const primaryColumns = columns.filter((column) => column.mobile === 'primary');
  const secondaryColumns = columns.filter((column) => column.mobile === 'secondary');

  return (
    <div className={cn(surface.card, 'overflow-hidden p-0')}>
      {/* Desktop / tablet */}
      <div
        className={cn(
          'hidden md:block',
          sticky ? 'max-h-[min(70vh,760px)] overflow-auto' : 'overflow-x-auto',
        )}
      >
        <table className="w-full text-left" style={{ minWidth }}>
          <caption className="sr-only">{caption}</caption>
          <colgroup>
            {columns.map((column) => (
              <col key={column.key} style={column.width ? { width: column.width } : undefined} />
            ))}
          </colgroup>
          <thead className={cn(sticky && `sticky top-0 ${zIndex.stickyHeader}`)}>
            <tr className={cn('bg-[var(--cq-surface)]', border.hairlineB)}>
              {columns.map((column) => {
                const isSorted = sort?.key === column.key;
                const alignment = column.align === 'right' ? 'text-right' : 'text-left';

                if (!column.sortValue) {
                  return (
                    <th
                      key={column.key}
                      scope="col"
                      className={cn(space.cellX, 'py-2.5', text.eyebrow, alignment)}
                    >
                      {column.header}
                    </th>
                  );
                }

                return (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={isSorted ? (sort!.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                    className={cn(space.cellX, 'py-1.5', alignment)}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSort(column.key)}
                      aria-label={`Nach ${column.header} sortieren`}
                      className={cn(
                        'group -mx-1.5 inline-flex h-7 max-w-full items-center gap-1 px-1.5',
                        column.align === 'right' && 'flex-row-reverse',
                        radius.sm,
                        text.eyebrow,
                        feedback,
                        focusRingOnSurface,
                        'hover:bg-[var(--cq-hover)] hover:text-[var(--cq-fg)]',
                        isSorted && 'text-[var(--cq-fg)]',
                      )}
                    >
                      <span className="truncate">{column.header}</span>
                      {isSorted ? (
                        sort!.direction === 'asc' ? (
                          <ArrowUp size={11} aria-hidden="true" className="shrink-0" />
                        ) : (
                          <ArrowDown size={11} aria-hidden="true" className="shrink-0" />
                        )
                      ) : (
                        <ChevronsUpDown
                          size={11}
                          aria-hidden="true"
                          className="shrink-0 opacity-0 group-hover:opacity-60 group-focus-visible:opacity-60"
                        />
                      )}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => {
              const key = getRowKey(row);
              const isSelected = selectedKey === key;
              return (
                <tr
                  key={key}
                  onClick={onSelect ? () => onSelect(row) : undefined}
                  aria-current={isSelected ? true : undefined}
                  className={cn(
                    'border-b border-[var(--cq-border-subtle)] last:border-0',
                    feedback,
                    onSelect && 'cursor-pointer hover:bg-[var(--cq-hover)]',
                    isSelected && 'bg-[var(--cq-hover)]',
                  )}
                >
                  {columns.map((column, index) => (
                    <td
                      key={column.key}
                      className={cn(
                        space.cellX,
                        'relative py-2.5 text-[13px] leading-5 text-[var(--cq-fg)]',
                        column.align === 'right' ? 'text-right tabular-nums' : 'text-left',
                      )}
                    >
                      {/* Selection rail on the leading cell — the row that owns the open panel. */}
                      {index === 0 && isSelected ? (
                        <span
                          aria-hidden="true"
                          className="absolute inset-y-0 left-0 w-[3px] bg-[var(--cq-fg)]"
                        />
                      ) : null}
                      {index === 0 && onSelect ? (
                        <button
                          type="button"
                          onClick={(event) => {
                            // The <tr> also handles the click; without this the panel would be
                            // opened twice and the second call would fight the first.
                            event.stopPropagation();
                            onSelect(row);
                          }}
                          aria-label={rowLabel(row)}
                          className={cn(
                            '-mx-1 max-w-full px-1 text-left',
                            radius.sm,
                            feedback,
                            focusRingOnSurface,
                          )}
                        >
                          {column.render(row)}
                        </button>
                      ) : (
                        column.render(row)
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Phone. Not the desktop columns restacked: a title, a status, two or three fields that
          matter, and everything else behind a disclosure the reader opens only when they need it. */}
      <ul className="divide-y divide-[var(--cq-border-subtle)] md:hidden">
        {sorted.map((row) => {
          const key = getRowKey(row);
          const isSelected = selectedKey === key;
          return (
            <li key={key} className={cn('relative', isSelected && 'bg-[var(--cq-hover)]')}>
              {isSelected ? (
                <span aria-hidden="true" className="absolute inset-y-0 left-0 w-[3px] bg-[var(--cq-fg)]" />
              ) : null}
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {onSelect ? (
                      <button
                        type="button"
                        onClick={() => onSelect(row)}
                        aria-label={rowLabel(row)}
                        className={cn(
                          '-mx-1 max-w-full px-1 text-left',
                          radius.sm,
                          text.bodyStrong,
                          feedback,
                          focusRingOnSurface,
                        )}
                      >
                        {mobileTitle(row)}
                      </button>
                    ) : (
                      <div className={text.bodyStrong}>{mobileTitle(row)}</div>
                    )}
                    {mobileSubtitle ? (
                      <div className={cn('mt-0.5', text.hint)}>{mobileSubtitle(row)}</div>
                    ) : null}
                  </div>
                  {mobileBadge ? <div className="shrink-0">{mobileBadge(row)}</div> : null}
                </div>

                {primaryColumns.length > 0 ? (
                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
                    {primaryColumns.map((column) => (
                      <div key={column.key} className="min-w-0">
                        <dt className={text.eyebrow}>{column.header}</dt>
                        <dd
                          className={cn(
                            'mt-0.5 text-[13px] leading-5 text-[var(--cq-fg)]',
                            column.align === 'right' && 'tabular-nums',
                          )}
                        >
                          {column.render(row)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                ) : null}

                {secondaryColumns.length > 0 ? (
                  <details className="group mt-2.5">
                    <summary
                      className={cn(
                        // 32px minimum: this is a phone-only control, and a 24px tap target is
                        // below the floor every other control in the module respects.
                        '-mx-1 inline-flex h-8 cursor-pointer list-none items-center gap-1 px-1',
                        text.hint,
                        focusRingOnSurface,
                        radius.sm,
                      )}
                    >
                      <ChevronsUpDown size={11} aria-hidden="true" />
                      Weitere Angaben
                    </summary>
                    <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2">
                      {secondaryColumns.map((column) => (
                        <div key={column.key} className="min-w-0">
                          <dt className={text.eyebrow}>{column.header}</dt>
                          <dd
                            className={cn(
                              'mt-0.5 text-[13px] leading-5 text-[var(--cq-fg)]',
                              column.align === 'right' && 'tabular-nums',
                            )}
                          >
                            {column.render(row)}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </details>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
