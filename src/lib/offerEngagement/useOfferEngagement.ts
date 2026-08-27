// React binding for OfferEngagementTracker.
//
// Owns exactly the browser wiring the tracker cannot own itself: visibility,
// focus, scroll and IntersectionObserver. It holds NO React state, so nothing
// here can trigger a re-render of the customer's offer — the returned handle is
// a stable ref wrapper.
//
// Every capability is optional at runtime: no IntersectionObserver means no
// section metrics and everything else still works; no sessionStorage means no
// refresh continuity and everything else still works.

import { useEffect, useMemo, useRef } from 'react';

import { createEngagementTransport } from '@/lib/offerEngagement/api';
import { OFFER_SECTION_IDS } from '@/lib/offerEngagement/sections';
import {
  OfferEngagementTracker, resolveClientSessionId, type EngagementEventType,
} from '@/lib/offerEngagement/tracker';

export interface OfferEngagementHandle {
  /** Record a meaningful funnel event. Never performs the business action. */
  record: (type: EngagementEventType) => void;
}

/**
 * A section counts as "meaningfully visible" only inside the middle band of the
 * viewport. A heading clipped at the very edge of the screen is not attention,
 * and counting it would make every section look read.
 */
const SECTION_ROOT_MARGIN = '-20% 0px -20% 0px';

export function useOfferEngagement(token: string | undefined, enabled: boolean): OfferEngagementHandle {
  const trackerRef = useRef<OfferEngagementTracker | null>(null);

  useEffect(() => {
    if (!token || !enabled) return;
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const sessionId = resolveClientSessionId();
    if (!sessionId) return;

    const tracker = new OfferEngagementTracker({
      transport: createEngagementTransport(token),
      sessionId,
    });
    trackerRef.current = tracker;

    const isActive = (): boolean => {
      if (document.visibilityState !== 'visible') return false;
      // hasFocus() catches a minimised window and a covered tab on the desktop.
      // It is advisory only — where it is unavailable, visibility alone governs.
      try { return document.hasFocus(); } catch { return true; }
    };

    tracker.start(isActive());

    const onVisibility = () => {
      const active = isActive();
      tracker.setActive(active);
      // Going away is the most likely moment to lose the tab entirely, so take
      // the opportunity to report. Best-effort: if the browser kills the
      // request, at most one heartbeat interval of time is lost — and losing
      // time is the safe direction.
      if (!active) void tracker.flush();
    };

    // Scroll is sampled, never handled: the listener sets one number and the
    // heartbeat reports the maximum. No write per scroll event, no rAF loop.
    const onScroll = () => {
      const doc = document.documentElement;
      const total = doc.scrollHeight;
      const seen = window.scrollY + window.innerHeight;
      // A document shorter than the viewport is fully seen by definition.
      tracker.setScrollFraction(total <= window.innerHeight ? 1 : seen / total);
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onVisibility);
    window.addEventListener('blur', onVisibility);
    window.addEventListener('pagehide', onVisibility);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    let observer: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const id = entry.target.getAttribute('data-engagement-section');
            if (id) tracker.setSectionVisible(id, entry.isIntersecting);
          }
        },
        { rootMargin: SECTION_ROOT_MARGIN, threshold: 0 },
      );
      // Observe whatever of the canonical sections this particular offer rendered.
      for (const id of OFFER_SECTION_IDS) {
        const el = document.querySelector(`[data-engagement-section="${id}"]`);
        if (el) observer.observe(el);
      }
    }

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onVisibility);
      window.removeEventListener('blur', onVisibility);
      window.removeEventListener('pagehide', onVisibility);
      window.removeEventListener('scroll', onScroll);
      observer?.disconnect();
      tracker.stop();
      trackerRef.current = null;
    };
  }, [token, enabled]);

  return useMemo<OfferEngagementHandle>(() => ({
    record: (type) => { trackerRef.current?.recordEvent(type); },
  }), []);
}
