// Generic filter bar.
//
// Declarative: a section describes its facets, and the bar renders labelled, keyboard-reachable
// controls plus a result count and a reset affordance that only appears once something is actually
// filtered. One implementation means every section filters and resets the same way.
//
// Reworked in this pass around one complaint: the previous bar rendered every facet as an
// equal-width control in a four-column grid and reported "3 Filter aktiv" — a number, with no way to
// tell *which* three without reading back through six controls. Now:
//
//   * Search leads and is visually the primary control, because it is the one people reach for.
//   * Date bounds and the remaining facets sit behind a disclosure on narrow screens, so a phone
//     shows one field rather than six stacked ones.
//   * Active facets render as removable chips that name themselves. Each chip clears exactly its own
//     facet, which is a real control doing a real thing — not a decorative summary.
//   * The result count is a proper figure rather than a grey footnote.

import { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';

import { Button, Field } from '@/components/dashboard/primitives';
import { PremiumSelect } from '@/components/dashboard/PremiumSelect';
import { border, focusRingOnSurface, radius, space, surface, text } from '@/components/dashboard/tokens';
import { cn } from '@/lib/utils';

import { feedback } from '../motion';
import { formatCount } from '../formatting';
import { countActiveFacets } from '../filtering';

export interface SelectFacet {
  kind: 'select';
  key: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

export interface TextFacet {
  kind: 'text';
  key: string;
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  /** Marks the facet as the section's primary search, given its own full-width row. */
  wide?: boolean;
}

export interface DateFacet {
  kind: 'date';
  key: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export type Facet = SelectFacet | TextFacet | DateFacet;

/** Human-readable current value of an active facet, for its chip. */
function chipLabel(facet: Facet): string | null {
  if (!facet.value || facet.value === 'all') return null;
  if (facet.kind === 'select') {
    const option = facet.options.find((candidate) => candidate.value === facet.value);
    return option ? `${facet.label}: ${option.label}` : null;
  }
  return `${facet.label}: ${facet.value}`;
}

/** Clearing a facet means returning it to its inactive value, which differs by kind. */
function clearValue(facet: Facet): string {
  return facet.kind === 'select' ? 'all' : '';
}

export function FilterBar({
  facets,
  query,
  onReset,
  resultCount,
  countLabel,
}: {
  facets: Facet[];
  /** The query object, used only to count active facets. */
  query: object;
  onReset: () => void;
  resultCount: number;
  /** Singular and plural noun, e.g. ['Zahlung', 'Zahlungen']. */
  countLabel: [string, string];
}) {
  const activeCount = countActiveFacets(query);
  const [singular, plural] = countLabel;
  // Narrow screens start collapsed; anything already filtered starts open, so an active filter is
  // never hidden behind a control the reader has to think to open.
  const [expanded, setExpanded] = useState(false);

  const search = facets.find((facet): facet is TextFacet => facet.kind === 'text' && facet.wide === true);
  const rest = facets.filter((facet) => facet !== search);
  const activeChips = facets
    .map((facet) => ({ facet, label: chipLabel(facet) }))
    .filter((entry): entry is { facet: Facet; label: string } => entry.label !== null);

  const showRest = expanded || activeCount > 0;

  return (
    <div className={cn(surface.card, space.cardPaddingTight)}>
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-end">
        {search ? (
          <div className="min-w-0 flex-1">
            <Field
              id={`club-ops-${search.key}`}
              label={search.label}
              value={search.value}
              placeholder={search.placeholder}
              onChange={search.onChange}
            />
          </div>
        ) : null}

        <div className="flex items-center gap-2">
          {rest.length > 0 ? (
            <Button
              variant="secondary"
              icon={SlidersHorizontal}
              onClick={() => setExpanded((previous) => !previous)}
              aria-expanded={showRest}
              className="sm:hidden"
            >
              Filter
              {activeCount > 0 ? (
                <span className="tabular-nums">({activeCount})</span>
              ) : null}
            </Button>
          ) : null}

          {/* The result count. A figure, not a footnote — it is the answer to the filter.
              Count and noun sit in one text run on purpose: split across two elements they stop
              being a single readable phrase for both a screen reader and a text query. */}
          <p
            role="status"
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 px-3 py-2',
              radius.md,
              border.hairline,
              'bg-[var(--cq-sunken)]',
            )}
          >
            <Search size={12} aria-hidden="true" className="shrink-0 text-[var(--cq-fg-subtle)]" />
            <span className="text-[14px] font-semibold leading-5 tabular-nums text-[var(--cq-fg)]">
              {formatCount(resultCount)} {resultCount === 1 ? singular : plural}
            </span>
          </p>
        </div>
      </div>

      {rest.length > 0 ? (
        <div className={cn('mt-3 gap-3 sm:grid sm:grid-cols-2 xl:grid-cols-4', showRest ? 'grid' : 'hidden sm:grid')}>
          {rest.map((facet) => {
            if (facet.kind === 'select') {
              return (
                <PremiumSelect
                  key={facet.key}
                  id={`club-ops-${facet.key}`}
                  label={facet.label}
                  value={facet.value}
                  onChange={facet.onChange}
                  options={facet.options}
                />
              );
            }
            return (
              <Field
                key={facet.key}
                id={`club-ops-${facet.key}`}
                label={facet.label}
                type={facet.kind === 'date' ? 'date' : 'text'}
                value={facet.value}
                placeholder={facet.kind === 'text' ? facet.placeholder : undefined}
                onChange={facet.onChange}
              />
            );
          })}
        </div>
      ) : null}

      {activeChips.length > 0 ? (
        <div className={cn('mt-3 flex flex-wrap items-center gap-1.5 pt-3', border.hairlineT)}>
          <span className={cn('mr-0.5', text.eyebrow)}>Aktive Filter</span>
          {activeChips.map(({ facet, label }) => (
            <button
              key={facet.key}
              type="button"
              onClick={() => facet.onChange(clearValue(facet))}
              aria-label={`Filter entfernen: ${label}`}
              className={cn(
                'group inline-flex max-w-full items-center gap-1.5 border py-1 pl-2.5 pr-2 text-[12px] font-medium leading-4',
                radius.full,
                border.hairline,
                'bg-[var(--cq-sunken)] text-[var(--cq-fg-muted)]',
                feedback,
                focusRingOnSurface,
                'hover:border-[var(--cq-border-strong)] hover:text-[var(--cq-fg)]',
              )}
            >
              <span className="truncate">{label}</span>
              <X size={11} aria-hidden="true" className="shrink-0 opacity-60 group-hover:opacity-100" />
            </button>
          ))}
          <Button variant="ghost" size="sm" icon={X} onClick={onReset} className="ml-auto">
            Filter zurücksetzen
          </Button>
        </div>
      ) : null}
    </div>
  );
}
