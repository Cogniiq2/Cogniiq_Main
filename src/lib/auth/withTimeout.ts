// Bounded waiting for the authentication bootstrap.
//
// WHY THIS EXISTS
//   AuthContext's boot awaited getSession() and then the profile/membership
//   reads. Those calls REJECT on an error, but they do not reject when the
//   backend accepts the connection and then never answers — a stalled fetch, a
//   hung proxy, a half-open socket on a flaky mobile network. In that case the
//   boot promise simply never settles, `isLoading` stays true forever, and every
//   guarded route renders the loading screen with no way out: no retry, no sign
//   out, no explanation.
//
//   A timeout cannot cancel the underlying request — nothing can, once it is in
//   flight — so this deliberately does NOT try to. It only stops WAITING, so the
//   UI can offer a recovery path. If the slow work does eventually land, the
//   caller is free to adopt its result; `withTimeout` never discards it.
//
// This module is dependency-injected on purpose (`timers`) so the real control
// flow is executable in a plain Node test with a fake clock, rather than being
// verified by reading it.

export interface Timers {
  setTimeout: (handler: () => void, ms: number) => unknown;
  clearTimeout: (handle: unknown) => void;
}

export interface TimeoutOutcome<T> {
  /** True when the deadline passed first. `value` and `error` are then absent. */
  timedOut: boolean;
  /** The resolved value, when the work won the race. */
  value?: T;
  /** The rejection reason, when the work rejected before the deadline. */
  error?: unknown;
}

const defaultTimers: Timers = {
  setTimeout: (handler, ms) => setTimeout(handler, ms),
  clearTimeout: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
};

/**
 * Wait for `work`, but never longer than `timeoutMs`.
 *
 * Always RESOLVES — a rejection of `work` is reported as `{ error }` rather than
 * thrown — so a caller can handle every outcome in one place and an unexpected
 * failure can never take the boot down with an unhandled rejection.
 *
 * The timer is cleared as soon as `work` settles, so a resolved call leaves
 * nothing pending behind it.
 */
export function withTimeout<T>(
  work: Promise<T>,
  timeoutMs: number,
  timers: Timers = defaultTimers,
): Promise<TimeoutOutcome<T>> {
  return new Promise<TimeoutOutcome<T>>((resolve) => {
    let settled = false;

    const handle = timers.setTimeout(() => {
      if (settled) return;
      settled = true;
      resolve({ timedOut: true });
    }, timeoutMs);

    const finish = (outcome: TimeoutOutcome<T>) => {
      if (settled) return;
      settled = true;
      timers.clearTimeout(handle);
      resolve(outcome);
    };

    work.then(
      (value) => finish({ timedOut: false, value }),
      (error) => finish({ timedOut: false, error }),
    );
  });
}

/**
 * How long the authentication bootstrap may take before the user is offered a
 * recovery path. Long enough to cover a slow first load on a poor mobile
 * connection, short enough that a stalled connection does not read as a frozen
 * application.
 */
export const AUTH_BOOT_TIMEOUT_MS = 15000;

/**
 * Signing out must also be bounded: a sign-out button that hangs is worse than
 * no button, because the user has already decided to leave. Shorter than the
 * boot budget — the user is waiting on a deliberate action, not a page load.
 */
export const AUTH_SIGN_OUT_TIMEOUT_MS = 8000;
