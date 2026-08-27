// Timing semantics of the engagement tracker.
//
// The whole value of "active viewing time" rests on it NOT being wall-clock time.
// These tests drive the tracker with an injected clock and pin the behaviours the
// brief calls for: background tabs pause, suspended browsers are not credited,
// nothing is measured before start, and analytics failure is inert.
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MAX_FOLD_MS, OfferEngagementTracker, type EngagementTransport, type HeartbeatPayload } from '@/lib/offerEngagement/tracker';

function harness(opts?: { failing?: boolean }) {
  let t = 0;
  const beats: HeartbeatPayload[] = [];
  const events: string[] = [];
  const started: string[] = [];
  const fail = () => Promise.reject(new Error('network down'));
  const transport: EngagementTransport = {
    start: async (id) => { started.push(id); if (opts?.failing) return fail(); },
    heartbeat: async (_id, p) => { beats.push(p); if (opts?.failing) return fail(); },
    event: async (_id, type) => { events.push(type); if (opts?.failing) return fail(); },
  };
  // No real timers: flush() is driven explicitly so each test controls the clock.
  const tracker = new OfferEngagementTracker({
    transport, sessionId: 's-1',
    now: () => t,
    setInterval: () => 1,
    clearInterval: () => {},
  });
  return { tracker, beats, events, started, advance: (ms: number) => { t += ms; }, at: () => t };
}

describe('active viewing time', () => {
  it('counts foreground time only', async () => {
    const h = harness();
    h.tracker.start(true);
    h.advance(10_000);
    await h.tracker.flush();
    expect(h.beats.at(-1)?.activeDeltaSeconds).toBe(10);
  });

  it('does NOT count a backgrounded tab — the core of the brief', async () => {
    const h = harness();
    h.tracker.start(true);
    h.advance(5_000);          // 5s visible
    h.tracker.setActive(false);
    h.advance(600_000);        // ten minutes in the background
    h.tracker.setActive(true);
    h.advance(3_000);          // 3s visible again
    await h.tracker.flush();

    const total = h.beats.reduce((a, b) => a + b.activeDeltaSeconds, 0);
    expect(total).toBe(8);     // 5 + 3, never 605
  });

  it('does not credit a suspended browser for the full gap', async () => {
    const h = harness();
    h.tracker.start(true);
    h.advance(4 * 60 * 60 * 1000); // laptop lid closed for four hours, still "visible"
    await h.tracker.flush();
    expect(h.beats.at(-1)?.activeDeltaSeconds).toBe(MAX_FOLD_MS / 1000);
  });

  it('keeps sub-second remainders instead of rounding them away forever', async () => {
    const h = harness();
    h.tracker.start(true);
    for (let i = 0; i < 3; i++) { h.advance(700); await h.tracker.flush(); }
    // 3 × 0.7s = 2.1s → the second whole second is reported once it accrues.
    h.advance(700);
    await h.tracker.flush();
    expect(h.beats.reduce((a, b) => a + b.activeDeltaSeconds, 0)).toBe(2);
  });

  it('measures nothing before start and nothing after stop', async () => {
    const h = harness();
    h.advance(10_000);
    await h.tracker.flush();
    expect(h.beats).toHaveLength(0);

    h.tracker.start(true);
    h.advance(3_000);
    h.tracker.stop();
    const after = h.beats.length;
    h.advance(60_000);
    await h.tracker.flush();
    expect(h.beats).toHaveLength(after);
  });

  it('stays off the network when nothing measurable happened', async () => {
    const h = harness();
    h.tracker.start(false);   // opened in a background tab
    await h.tracker.flush();
    await h.tracker.flush();
    expect(h.beats).toHaveLength(0);
  });
});

describe('scroll depth', () => {
  it('reports the maximum, never the current position', async () => {
    const h = harness();
    h.tracker.start(true);
    h.tracker.setScrollFraction(0.82);
    h.tracker.setScrollFraction(0.31);   // scrolled back up
    h.advance(1_000);
    await h.tracker.flush();
    expect(h.beats.at(-1)?.scrollBp).toBe(8_200);
  });

  it('clamps out-of-range and non-finite values', async () => {
    const h = harness();
    h.tracker.start(true);
    h.tracker.setScrollFraction(Number.NaN);
    h.tracker.setScrollFraction(-3);
    h.tracker.setScrollFraction(7.5);
    h.advance(1_000);
    await h.tracker.flush();
    expect(h.beats.at(-1)?.scrollBp).toBe(10_000);
  });

  it('does not resend an unchanged scroll value', async () => {
    const h = harness();
    h.tracker.start(true);
    h.tracker.setScrollFraction(0.5);
    h.advance(1_000);
    await h.tracker.flush();
    await h.tracker.flush();          // nothing new: no time, no scroll change
    expect(h.beats).toHaveLength(1);
  });
});

describe('section attention', () => {
  it('accrues only while the section is visible AND the page is active', async () => {
    const h = harness();
    h.tracker.start(true);
    h.tracker.setSectionVisible('investment', true);
    h.advance(6_000);
    h.tracker.setActive(false);     // page hidden — section time must stop too
    h.advance(300_000);
    h.tracker.setActive(true);
    h.advance(2_000);
    h.tracker.setSectionVisible('investment', false);
    await h.tracker.flush();

    const total = h.beats.reduce((a, b) => a + (b.sections.investment ?? 0), 0);
    expect(total).toBe(8);
  });

  it('ignores section ids outside the canonical list', async () => {
    const h = harness();
    h.tracker.start(true);
    h.tracker.setSectionVisible('not_a_real_section', true);
    h.advance(5_000);
    await h.tracker.flush();
    expect(Object.keys(h.beats.at(-1)?.sections ?? {})).toEqual([]);
  });

  it('never reports more section time than the page was active', async () => {
    const h = harness();
    h.tracker.start(true);
    h.tracker.setSectionVisible('modules', true);
    h.advance(3_000);
    await h.tracker.flush();
    const b = h.beats.at(-1)!;
    expect(b.sections.modules).toBeLessThanOrEqual(b.activeDeltaSeconds);
  });
});

describe('failure tolerance', () => {
  it('swallows transport rejections — analytics never surfaces to the customer', async () => {
    const h = harness({ failing: true });
    h.tracker.start(true);
    h.advance(5_000);
    await expect(h.tracker.flush()).resolves.toBeUndefined();
    expect(() => h.tracker.recordEvent('pdf_download')).not.toThrow();
    expect(() => h.tracker.stop()).not.toThrow();
  });

  it('records a funnel event without performing any business action', () => {
    const h = harness();
    h.tracker.start(true);
    h.tracker.recordEvent('acceptance_opened');
    // The tracker's ONLY outward effect is one transport.event call.
    expect(h.events).toEqual(['acceptance_opened']);
  });
});

describe('session identity', () => {
  beforeEach(() => { vi.unstubAllGlobals(); });

  it('reuses the id across a reload and mints a fresh one per tab', async () => {
    const { resolveClientSessionId } = await import('@/lib/offerEngagement/tracker');
    sessionStorage.clear();
    const first = resolveClientSessionId('t.key');
    expect(first).toMatch(/^[0-9a-f-]{36}$/);
    expect(resolveClientSessionId('t.key')).toBe(first);   // reload
    sessionStorage.clear();                                 // new tab
    expect(resolveClientSessionId('t.key')).not.toBe(first);
  });

  it('still yields an id when storage is unavailable (private mode)', async () => {
    const { resolveClientSessionId } = await import('@/lib/offerEngagement/tracker');
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    expect(resolveClientSessionId('t.key')).toMatch(/^[0-9a-f-]{36}$/);
  });
});
