import { useReducedMotion } from 'framer-motion';
import type { Transition, Variants } from 'framer-motion';

// One motion vocabulary for both authenticated shells (Owner Dashboard and Customer Portal).
//
// Rules encoded here, so no component has to re-decide them:
//  - animate opacity and transform only (never width/height/top/left on a hot path);
//  - short durations: nothing that delays the user's actual work;
//  - a single easing curve, matching --cq-ease in index.css;
//  - every helper degrades to "no movement" under prefers-reduced-motion.

export const easePremium: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const duration = {
  fast: 0.12,
  base: 0.18,
  slow: 0.26,
} as const;

export const transitions = {
  fast: { duration: duration.fast, ease: easePremium } satisfies Transition,
  base: { duration: duration.base, ease: easePremium } satisfies Transition,
  slow: { duration: duration.slow, ease: easePremium } satisfies Transition,
} as const;

/** Page/route entrance: a short lift, nothing that shifts layout. */
export const pageEnter: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: transitions.slow },
};

/** Staggered list/grid entrance for sibling cards. */
export const listContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.035, delayChildren: 0.02 } },
};

export const listItem: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: transitions.base },
};

/** Dropdown / popover / menu surface. */
export const popIn: Variants = {
  hidden: { opacity: 0, y: -4, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: transitions.fast },
  exit: { opacity: 0, y: -4, scale: 0.98, transition: transitions.fast },
};

/**
 * Reduced-motion aware presets. Returns the same shape whether or not motion is
 * reduced, so a component never needs a conditional branch at the call site: when
 * motion is reduced the variants collapse to a plain opacity change with no
 * transform and effectively zero duration.
 */
export function useMotionPresets() {
  const reduce = useReducedMotion();

  const still: Transition = { duration: 0 };

  return {
    reduce: Boolean(reduce),
    transition: reduce ? still : transitions.base,
    pageEnter: reduce
      ? ({ hidden: { opacity: 1 }, visible: { opacity: 1 } } satisfies Variants)
      : pageEnter,
    listContainer: reduce ? ({ hidden: {}, visible: {} } satisfies Variants) : listContainer,
    listItem: reduce
      ? ({ hidden: { opacity: 1 }, visible: { opacity: 1 } } satisfies Variants)
      : listItem,
    popIn: reduce
      ? ({
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: still },
          exit: { opacity: 0, transition: still },
        } satisfies Variants)
      : popIn,
    /** layout/layoutId transition for animated active indicators. */
    indicator: reduce ? still : ({ duration: duration.slow, ease: easePremium } satisfies Transition),
  };
}
