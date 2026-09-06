import type { RefObject } from 'react';

import { strings } from '../../../private-bar/strings';

import { AnimatedAmount } from './AnimatedAmount';

/**
 * The persistent action surface.
 *
 * It exists only while something is selected, emerges rather than appears, and
 * reserves its own height at the bottom of the page (see --pb-bar-height in the
 * stylesheet) so it never covers the last product. The safe-area inset is part
 * of its padding, so on an iPhone it sits above the home indicator rather than
 * under it.
 */
export function CheckoutBar({
  itemCount,
  totalCents,
  onOpen,
  buttonRef,
}: {
  itemCount: number;
  totalCents: number;
  onOpen: () => void;
  /** The sheet returns focus here when it closes. */
  buttonRef?: RefObject<HTMLButtonElement>;
}) {
  return (
    <div className="pb-bar">
      <button
        ref={buttonRef}
        type="button"
        className="pb-bar__button"
        onClick={onOpen}
        aria-label={strings.bar.ariaLabel}
      >
        <span className="pb-bar__left">
          <span className="pb-bar__count">{strings.bar.items(itemCount)}</span>
          <AnimatedAmount amountCents={totalCents} className="pb-bar__total" />
        </span>
        <span className="pb-bar__action">
          {strings.bar.action}
          <span className="pb-bar__arrow" aria-hidden="true">
            →
          </span>
        </span>
      </button>
    </div>
  );
}
