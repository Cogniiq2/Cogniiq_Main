/*
  Which rail lines to draw for a section list that is longer than the rail.

  The rail tracks EVERY section on the page — that is what keeps the active line honest on a
  long pillar page — but it may only draw a handful of hairlines without becoming a sidebar.
  This module owns that reduction, and nothing else: it is pure, so the behaviour can be
  asserted directly instead of inferred from a rendered component.

  The window is ANCHORED rather than sliding: the first and last section keep permanent slots
  and a short run of lines travels with the active section between them. Collapsed stretches
  become a single shortened hairline.

      ▁ … ▁▁▁ ▃ ▁▁▁ … ▁        first · gap · run around active · gap · last

  Anchoring is what keeps the movement calm. A plain sliding window shifts every line by one
  on each section change; here the ends are fixed, so only the middle run advances and the
  reader keeps a stable sense of how far through the page they are.
*/

/** Maximum slots the rail ever draws — lines and collapse markers together. */
export const MAX_LINES = 9;

export type RailItem =
  | { kind: 'section'; index: number }
  | { kind: 'gap'; key: string };

/**
 * Reduce `count` sections to at most `max` slots around `activeIndex`.
 * The active section is always present, as are the first and the last.
 */
export function railWindow(count: number, activeIndex: number, max: number = MAX_LINES): RailItem[] {
  if (count <= max) {
    return Array.from({ length: count }, (_, index) => ({ kind: 'section', index }));
  }

  const last = count - 1;
  // With both collapse markers present the travelling run holds `max - 4` lines: the two
  // anchors and the two markers take the rest. When the run reaches an anchor its marker
  // disappears and the run grows into the freed slot.
  const runSize = max - 4;
  let lo = activeIndex - Math.floor(runSize / 2);
  let hi = lo + runSize - 1;

  if (lo <= 2) {
    // Near the top: no left marker, the run starts right after the first anchor.
    lo = 1;
    hi = max - 3;
  } else if (hi >= last - 2) {
    // Near the bottom: no right marker, the run ends right before the last anchor.
    hi = last - 1;
    lo = last - (max - 3);
  }

  const items: RailItem[] = [{ kind: 'section', index: 0 }];
  if (lo > 1) items.push({ kind: 'gap', key: 'gap-start' });
  for (let i = lo; i <= hi; i += 1) items.push({ kind: 'section', index: i });
  if (hi < last - 1) items.push({ kind: 'gap', key: 'gap-end' });
  items.push({ kind: 'section', index: last });
  return items;
}
