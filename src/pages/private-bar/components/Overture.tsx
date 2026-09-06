import { useEffect } from 'react';

import { strings } from '../../../private-bar/strings';

/**
 * The signature entrance.
 *
 * Deliberately CSS-only: the overlay reveals and removes itself through
 * keyframes with `animation-fill-mode: both`, so the page is complete and
 * usable even if JavaScript never executes, and the overlay — being `position:
 * fixed` — can never shift the layout beneath it.
 *
 * It plays once per document. A client-side navigation back to the bar (from
 * the cancel or success surface) remounts this component, and replaying the
 * entrance there would feel like a reset rather than a return, so a
 * module-scope flag suppresses it. The flag starts false on the server and on
 * the first client render, so hydration matches exactly.
 */
let overturePlayed = false;

export function Overture() {
  const skip = overturePlayed;

  useEffect(() => {
    overturePlayed = true;
  }, []);

  return (
    <div
      className={skip ? 'pb-overture pb-overture--instant' : 'pb-overture'}
      aria-hidden="true"
      data-testid="pb-overture"
    >
      <span className="pb-overture__mark">{strings.brand.wordmark}</span>
      <span className="pb-overture__product">{strings.brand.product}</span>
    </div>
  );
}
