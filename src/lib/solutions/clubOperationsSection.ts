// URL segment → Club Operations section.
//
// Lives beside the landing component rather than inside it so it stays independently testable and
// does not turn the landing into a mixed module.

import {
  defaultClubOperationsSection,
  isClubOperationsSection,
  type ClubOperationsSectionId,
} from '@/solutions/club-operations/navigation';

/**
 * The route's trailing segment, as a section.
 *
 * An unknown, empty or multi-segment remainder falls back to the default section rather than
 * erroring: a stale bookmark should open the dashboard, not a dead end. The section is only ever a
 * view selector — it grants nothing — so a wrong value has no security meaning.
 */
export function sectionFromSplat(splat: string | undefined): ClubOperationsSectionId {
  const first = (splat ?? '').split('/').filter(Boolean)[0];
  if (first && isClubOperationsSection(first)) return first;
  return defaultClubOperationsSection;
}
