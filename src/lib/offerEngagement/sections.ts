// Canonical offer section identifiers.
//
// These mirror the `public.owner_offer_section_id` enum in
// supabase/migrations/20260827120000_owner_offer_engagement.sql EXACTLY, and
// they mirror the real section structure of PremiumOfferWebView — they are not
// invented buckets. A section the customer's offer does not contain simply
// never reports any time.
//
// The server ignores unknown keys rather than rejecting the heartbeat, so a
// stale client loses one section, never its whole measurement.

export const OFFER_SECTION_IDS = [
  'hero',
  'introduction',
  'executive_summary',
  'project_approach',
  'desired_outcomes',
  'modules',
  'optional_modules',
  'investment',
  'timeline',
  'payment_schedule',
  'terms',
  'next_steps',
] as const;

export type OfferSectionId = (typeof OFFER_SECTION_IDS)[number];

/** Owner-facing German labels. Deliberately neutral: attention, never "reading". */
export const OFFER_SECTION_LABEL_DE: Record<OfferSectionId, string> = {
  hero: 'Einstieg',
  introduction: 'Ausgangslage',
  executive_summary: 'Zielbild',
  project_approach: 'Vorgehen',
  desired_outcomes: 'Ergebnisse',
  modules: 'Leistungsumfang',
  optional_modules: 'Optionale Erweiterungen',
  investment: 'Investition',
  timeline: 'Projektablauf',
  payment_schedule: 'Zahlungsplan',
  terms: 'Annahmen & Rahmen',
  next_steps: 'Nächste Schritte',
};

const KNOWN = new Set<string>(OFFER_SECTION_IDS);

export function isOfferSectionId(value: string): value is OfferSectionId {
  return KNOWN.has(value);
}

/** German label for a section id, falling back to the raw id for unknown values. */
export function offerSectionLabel(id: string): string {
  return isOfferSectionId(id) ? OFFER_SECTION_LABEL_DE[id] : id;
}
