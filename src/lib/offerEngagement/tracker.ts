// Conservative, privacy-conscious engagement tracker for the public offer portal.
//
// Design rules this file exists to enforce:
//
//  * ACTIVE time only. "Opened 10:00, closed 10:10" is NOT ten minutes — a tab
//    left open in the background contributes nothing. Time accrues only while
//    the document is visible (and, where the browser tells us, focused).
//  * NEVER manufacture time. A wall-clock gap — a suspended browser, a sleeping
//    laptop, a throttled background tab — is capped at MAX_FOLD_MS rather than
//    counted in full. The server clamps a second time against its own clock, so
//    the two guards are independent.
//  * Under-count on purpose. Every rounding here drops fractional seconds. The
//    owner should never see more attention than actually happened.
//  * No third-party JS, no fingerprinting, no cross-site identifier, no cookies.
//    The only client identifier is a random UUID in sessionStorage, scoped to
//    the tab and meaningless outside this one offer.
//  * Fail silent. Every transport call is best-effort; a rejected promise must
//    never surface to the customer or block the offer, the PDF or acceptance.
//
// The class is deliberately framework-free and takes its transport, clock and
// DOM handles by injection, so its timing behaviour is unit-testable without a
// browser and without Supabase.

import { isOfferSectionId, type OfferSectionId } from '@/lib/offerEngagement/sections';

export type EngagementEventType =
  | 'pdf_download'
  | 'acceptance_opened'
  | 'acceptance_completed'
  | 'rejection_opened';

export interface HeartbeatPayload {
  activeDeltaSeconds: number;
  scrollBp: number;
  sections: Partial<Record<OfferSectionId, number>>;
}

export interface EngagementTransport {
  start(sessionId: string): Promise<void>;
  heartbeat(sessionId: string, payload: HeartbeatPayload): Promise<void>;
  event(sessionId: string, type: EngagementEventType): Promise<void>;
}

export interface TrackerOptions {
  transport: EngagementTransport;
  sessionId: string;
  /** Milliseconds between heartbeats. 15s: responsive enough to survive a lost tab, quiet enough to be invisible. */
  heartbeatMs?: number;
  /** Injected for tests. Defaults to performance.now(). */
  now?: () => number;
  setInterval?: (fn: () => void, ms: number) => unknown;
  clearInterval?: (handle: unknown) => void;
}

/** 15s between beats — 4 requests/minute, far below anything a user could feel. */
export const HEARTBEAT_INTERVAL_MS = 15_000;

/**
 * Client-side ceiling on a single fold of elapsed time.
 *
 * If a beat is late — a suspended process, a throttled background tab, a laptop
 * lid closed and reopened — `now()` may have advanced by hours. We credit at
 * most one heartbeat interval plus slack, never the true gap. The server then
 * clamps independently against its OWN clock, so neither side has to be trusted.
 */
export const MAX_FOLD_MS = 20_000;

export class OfferEngagementTracker {
  private readonly transport: EngagementTransport;
  private readonly sessionId: string;
  private readonly heartbeatMs: number;
  private readonly now: () => number;
  private readonly setIntervalFn: (fn: () => void, ms: number) => unknown;
  private readonly clearIntervalFn: (handle: unknown) => void;

  private timer: unknown = null;
  private running = false;

  /** Page-level active time not yet reported, in milliseconds. */
  private pendingMs = 0;
  /** Timestamp at which the page last became active, or null while inactive. */
  private activeSince: number | null = null;

  /** Highest scroll depth seen this session, in basis points (0..10000). */
  private maxScrollBp = 0;
  /** Highest scroll depth already reported, so an unchanged value is not resent. */
  private sentScrollBp = 0;

  /** Sections currently in the "meaningfully visible" band, with their entry timestamp. */
  private visibleSections = new Map<OfferSectionId, number>();
  /** Per-section active milliseconds not yet reported. */
  private pendingSectionMs = new Map<OfferSectionId, number>();

  constructor(opts: TrackerOptions) {
    this.transport = opts.transport;
    this.sessionId = opts.sessionId;
    this.heartbeatMs = opts.heartbeatMs ?? HEARTBEAT_INTERVAL_MS;
    this.now = opts.now ?? (() => performance.now());
    this.setIntervalFn = opts.setInterval ?? ((fn, ms) => setInterval(fn, ms));
    this.clearIntervalFn = opts.clearInterval ?? ((h) => clearInterval(h as ReturnType<typeof setInterval>));
  }

  /** Begin measuring. Safe to call twice; the second call is a no-op. */
  start(active: boolean): void {
    if (this.running) return;
    this.running = true;
    if (active) this.activeSince = this.now();
    void this.safe(this.transport.start(this.sessionId));
    this.timer = this.setIntervalFn(() => { void this.flush(); }, this.heartbeatMs);
  }

  /**
   * The page became visible/hidden (or focused/blurred). Hiding folds the time
   * accrued so far and stops the clock; showing restarts it from `now`, so the
   * hidden interval is simply never measured.
   */
  setActive(active: boolean): void {
    if (!this.running) return;
    if (active) {
      if (this.activeSince != null) return;
      // Resume: re-anchor the page AND every still-visible section to now, so the
      // hidden interval is not sitting in any timestamp waiting to be counted.
      const t = this.now();
      this.activeSince = t;
      for (const id of this.visibleSections.keys()) this.visibleSections.set(id, t);
      return;
    }
    // Bank what was earned, then STOP the clock. Nulling activeSince is what makes
    // the pause real: fold() is a no-op while it is null, so neither the page nor
    // any visible section accrues time until setActive(true) re-anchors them.
    this.fold();
    this.activeSince = null;
  }

  /** Report the current scroll position as a fraction 0..1. Cheap; call from a passive listener. */
  setScrollFraction(fraction: number): void {
    if (!Number.isFinite(fraction)) return;
    const bp = Math.round(Math.min(Math.max(fraction, 0), 1) * 10_000);
    if (bp > this.maxScrollBp) this.maxScrollBp = bp;
  }

  /** A section entered or left the "meaningfully visible" band. */
  setSectionVisible(id: string, visible: boolean): void {
    if (!this.running || !isOfferSectionId(id)) return;
    if (visible) {
      if (!this.visibleSections.has(id)) this.visibleSections.set(id, this.now());
      return;
    }
    const since = this.visibleSections.get(id);
    if (since == null) return;
    this.visibleSections.delete(id);
    if (this.activeSince != null) this.addSectionMs(id, this.clampGap(this.now() - since));
  }

  /**
   * Record a meaningful funnel event. Purely observational — this reports that
   * something was OPENED; it never performs the business action itself.
   */
  recordEvent(type: EngagementEventType): void {
    if (!this.running) return;
    void this.safe(this.transport.event(this.sessionId, type));
  }

  /** Fold and send whatever has accrued. Called on the heartbeat and on hide/unload. */
  async flush(): Promise<void> {
    if (!this.running) return;
    this.fold();

    const seconds = Math.floor(this.pendingMs / 1000);
    const sections: Partial<Record<OfferSectionId, number>> = {};
    let hasSection = false;
    for (const [id, ms] of this.pendingSectionMs) {
      const s = Math.floor(ms / 1000);
      if (s > 0) { sections[id] = s; hasSection = true; }
    }
    const scrollChanged = this.maxScrollBp > this.sentScrollBp;

    // Nothing measurable happened — stay off the network entirely.
    if (seconds <= 0 && !scrollChanged && !hasSection) return;

    // Keep sub-second remainders so slow accumulation is not rounded away forever.
    this.pendingMs -= seconds * 1000;
    for (const [id, ms] of [...this.pendingSectionMs]) {
      const s = sections[id] ?? 0;
      const rest = ms - s * 1000;
      if (rest > 0) this.pendingSectionMs.set(id, rest); else this.pendingSectionMs.delete(id);
    }
    const scrollBp = this.maxScrollBp;
    this.sentScrollBp = scrollBp;

    await this.safe(this.transport.heartbeat(this.sessionId, {
      activeDeltaSeconds: seconds, scrollBp, sections,
    }));
  }

  /** Stop measuring and make one last best-effort report. */
  stop(): void {
    if (!this.running) return;
    void this.flush();
    this.running = false;
    if (this.timer != null) { this.clearIntervalFn(this.timer); this.timer = null; }
    this.activeSince = null;
    this.visibleSections.clear();
  }

  // ---- internals --------------------------------------------------------

  /**
   * Move elapsed active time into the pending buckets and restart the clock.
   * Every gap passes through clampGap, so a suspended browser contributes at
   * most one interval's worth of time rather than the real elapsed duration.
   */
  private fold(): void {
    if (this.activeSince == null) return;
    const t = this.now();
    const delta = this.clampGap(t - this.activeSince);
    this.pendingMs += delta;
    this.activeSince = t;
    for (const [id, since] of this.visibleSections) {
      this.addSectionMs(id, this.clampGap(t - since));
      this.visibleSections.set(id, t);
    }
  }

  private clampGap(ms: number): number {
    if (!Number.isFinite(ms) || ms <= 0) return 0;
    return Math.min(ms, MAX_FOLD_MS);
  }

  private addSectionMs(id: OfferSectionId, ms: number): void {
    if (ms <= 0) return;
    this.pendingSectionMs.set(id, (this.pendingSectionMs.get(id) ?? 0) + ms);
  }

  /** Analytics is never allowed to raise into the customer's page. */
  private async safe(p: Promise<unknown>): Promise<void> {
    try { await p; } catch { /* best-effort by design */ }
  }
}

/**
 * The per-tab session identifier.
 *
 * sessionStorage, not localStorage or a cookie: it dies with the tab, is not
 * shared across tabs, and is invisible to any other origin. A reload keeps it
 * (a refresh is the same visit); a new tab mints a new one (a genuine return
 * visit). The value is a random UUID with no derivation from the token, the
 * customer or the device.
 */
export function resolveClientSessionId(storageKey = 'cq.offer.session'): string {
  const mint = (): string => {
    try {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
      const b = new Uint8Array(16);
      crypto.getRandomValues(b);
      b[6] = (b[6] & 0x0f) | 0x40;
      b[8] = (b[8] & 0x3f) | 0x80;
      const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
      return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
    } catch {
      return '';
    }
  };
  try {
    const existing = sessionStorage.getItem(storageKey);
    if (existing) return existing;
    const next = mint();
    if (next) sessionStorage.setItem(storageKey, next);
    return next;
  } catch {
    // Private mode / storage disabled: still measure, just without refresh continuity.
    return mint();
  }
}
