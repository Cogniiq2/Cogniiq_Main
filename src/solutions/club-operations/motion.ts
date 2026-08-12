// Module-local motion recipes.
//
// Built entirely on the dashboard's existing scale (`duration-fast|base|slow`, `ease-premium` — see
// src/components/dashboard/tokens.ts and the tailwind config). Nothing here introduces a new curve
// or a new duration: the module has to feel like the same product as the rest of the dashboard, and
// a second easing is how that stops being true.
//
// Reduced motion needs no branch in this file. The dashboard scope collapses every
// transition-duration and animation-duration to 1ms under `prefers-reduced-motion: reduce`
// (src/index.css), so a reduced-motion reader gets the same state changes without the movement.
// The `motion-safe:` prefixes below are belt-and-braces for the entrance animations specifically,
// where a 1ms slide is still a 1ms slide.
//
// What is deliberately absent: spring physics, stagger sequences, scale effects, parallax, any
// animation on page load, and any transition on a property that triggers layout. Every recipe here
// animates opacity, transform, colour or shadow only.

/** 140ms. Hover, focus and selection feedback — anything the pointer causes directly. */
export const feedback =
  'transition-[color,background-color,border-color,box-shadow,opacity] duration-fast ease-premium';

/** 140ms, transform included. For controls that shift by a hair on interaction. */
export const feedbackWithTransform =
  'transition-[color,background-color,border-color,box-shadow,opacity,transform] duration-fast ease-premium';

/** 180ms. Disclosure, panels and anything that changes what is on screen. */
export const disclosure = 'transition-[opacity,transform] duration-base ease-premium';

/**
 * Section entrance. A short fade with a 4px rise — enough that switching sections reads as a
 * change rather than a repaint, short enough that the content is never withheld.
 */
export const sectionEnter =
  'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-base motion-safe:ease-premium';

/** Detail-panel entrance. Slides in from the side it occupies on wide screens. */
export const panelEnter =
  'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-2 motion-safe:duration-base motion-safe:ease-premium';

/** Attention rows and other short lists that appear in place. Fade only — no movement. */
export const fadeIn = 'motion-safe:animate-in motion-safe:fade-in motion-safe:duration-base';

/**
 * Chart reveal. Bars and areas grow from the baseline once, over 240ms.
 *
 * Applied to the SVG's own transform-origin rather than per element: animating 30 bars individually
 * would be a stagger sequence, which is exactly the kind of motion that delays comprehension.
 */
export const chartReveal =
  'motion-safe:animate-in motion-safe:fade-in motion-safe:duration-slow motion-safe:ease-premium';
