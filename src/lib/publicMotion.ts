/*
  Pointer-driven micro-interactions for the PUBLIC marketing surfaces.

  Two effects, both paint-only and both inert wherever they would be wrong:
  on touch screens (no hover), under `prefers-reduced-motion`, and on the
  server (no window). Each returns plain event handlers so the element that
  uses them stays an ordinary <a>, <button> or <div> — no wrapper, no ref, and
  nothing serialised into the prerendered HTML.

  The values are written straight to `style` / custom properties on the
  event target rather than through React state: a pointer move is not a
  render, and re-rendering a button sixty times a second to move it 3px is
  the kind of thing that turns a "premium" feel into a laggy one.
*/
import type { PointerEvent } from 'react';

/** Hover-capable pointer, motion allowed, running in a browser. */
function pointerEffectsAllowed(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

/* ── Magnetic pull ────────────────────────────────────────────────────────
   The element drifts toward the pointer by at most `strength` px (default 4),
   proportional to how far the pointer is from its centre, and springs back
   on leave. The `.cq-magnetic` transition (index.css) does the smoothing. */
export function magneticHandlers(strength = 4) {
  return {
    onPointerMove: (e: PointerEvent<HTMLElement>) => {
      if (!pointerEffectsAllowed()) return;
      const el = e.currentTarget;
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      el.style.transform = `translate(${(dx * strength).toFixed(2)}px, ${(dy * strength * 0.75).toFixed(2)}px)`;
    },
    onPointerLeave: (e: PointerEvent<HTMLElement>) => {
      e.currentTarget.style.transform = '';
    },
  };
}

/* ── Pointer spotlight on dark panels ─────────────────────────────────────
   Writes the pointer position as `--cq-mx` / `--cq-my` (percentages of the
   panel) and raises `--cq-spot` to 1 while the pointer is over it. The
   `.cq-surface::before` gradient in index.css reads all three. */
export function spotlightHandlers() {
  return {
    onPointerMove: (e: PointerEvent<HTMLElement>) => {
      if (!pointerEffectsAllowed()) return;
      const el = e.currentTarget;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--cq-mx', `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
      el.style.setProperty('--cq-my', `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
      el.style.setProperty('--cq-spot', '1');
    },
    onPointerLeave: (e: PointerEvent<HTMLElement>) => {
      e.currentTarget.style.setProperty('--cq-spot', '0');
    },
  };
}

/** True when the visitor asked for reduced motion (false on the server). */
export function reducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
