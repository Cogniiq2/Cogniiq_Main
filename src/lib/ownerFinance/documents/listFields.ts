// Shared parsing for offer fields that hold "one entry per line" content.
//
// Some offer fields are semantically LISTS typed into a plain textarea — "Nicht enthalten"
// (exclusions) and "Annahmen" (assumptions) are the two today. The owner types one item per
// line; nothing forces a bullet character and nothing should.
//
// Before this module every surface rendered those fields as prose, and both premium renderers
// actively destroyed the structure: `text.split(/\n{2,}/)` then `p.split(/\n/).join(' ')`
// deliberately joins single newlines with a SPACE, so ten exclusions collapsed into one running
// paragraph — and typing "•" by hand only produced "• a • b • c" on that same single line.
//
// The split between list and prose is a property of the FIELD, not of this module: only the
// fields a surface routes through `asListOrProse` become lists. Introduction, executive summary,
// project approach, delivery/payment terms and next steps stay prose and keep their existing
// reflow behaviour — a newline inside a paragraph is not a bullet.
//
// Pure and dependency-free, so the @react-pdf document, the owner's HTML preview and the
// customer portal can all share one interpretation and cannot drift apart.

/**
 * A leading list marker the owner may have typed by hand. Requires trailing whitespace, so a
 * hyphenated word ("-Modul") or a negative number ("-5 % Rabatt") is never treated as a marker.
 */
const LEADING_MARKER = /^\s*(?:[•·▪‣◦*+]|[-–—])\s+/;

/**
 * Split "one entry per line" text into its entries.
 *
 * Handles CRLF and LF, trims each entry, drops blank lines, and strips a leading bullet or dash
 * the owner typed manually so the renderer's own bullet is never doubled up.
 */
export function parseListEntries(text: string | null | undefined): string[] {
  if (!text) return [];
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(LEADING_MARKER, '').trim())
    .filter((line) => line.length > 0);
}

/** A field resolved to the shape a renderer should draw. */
export type TextBlock =
  | { kind: 'list'; items: string[] }
  | { kind: 'prose'; text: string };

/**
 * Resolve a list-capable field to a list or to prose.
 *
 * Two or more non-empty lines means the owner entered separate entries, so the field renders as
 * a list. A single line (or a single paragraph, however long) stays prose — which is why a
 * historical one-paragraph "Annahmen" keeps exactly the presentation it has today.
 *
 * Returns null for an absent or whitespace-only field so callers can skip the section entirely.
 */
export function asListOrProse(text: string | null | undefined): TextBlock | null {
  if (!text || !text.trim()) return null;
  const items = parseListEntries(text);
  if (items.length >= 2) return { kind: 'list', items };
  return { kind: 'prose', text: text.trim() };
}
