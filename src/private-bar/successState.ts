// ─────────────────────────────────────────────────────────────────────────────
// The success surface's view model.
//
// The single rule this module exists to make structural rather than
// conventional: NOTHING but an authoritative `paid` status may produce a
// confirming view. A browser redirect, a query parameter, a timeout or a
// network error can never reach `confirmed: true`.
//
// Pure and framework-free so it is exhaustively unit-testable. The status value
// itself is produced by the server from Phase D onwards; until then the surface
// renders `unavailable`, which states plainly that no payment is confirmed.
// ─────────────────────────────────────────────────────────────────────────────
import { strings } from './strings';

export type OrderStatus = 'paid' | 'pending' | 'failed' | 'unknown' | 'unavailable';

export interface SuccessView {
  readonly heading: string;
  readonly body: string;
  /** True ONLY for an authoritative `paid`. Drives the confirmation motion. */
  readonly confirmed: boolean;
  /** True while an authoritative answer is still expected. */
  readonly awaiting: boolean;
  /** True when the guest can usefully ask for another status check. */
  readonly retryable: boolean;
}

export function viewForStatus(status: OrderStatus): SuccessView {
  switch (status) {
    case 'paid':
      return {
        heading: strings.success.paidHeading,
        body: strings.success.paidBody,
        confirmed: true,
        awaiting: false,
        retryable: false,
      };
    case 'pending':
      return {
        heading: strings.success.confirming,
        body: strings.success.confirmingBody,
        confirmed: false,
        awaiting: true,
        retryable: false,
      };
    case 'failed':
      return {
        heading: strings.success.failedHeading,
        body: strings.success.failedBody,
        confirmed: false,
        awaiting: false,
        retryable: false,
      };
    case 'unknown':
      return {
        heading: strings.success.unknownHeading,
        body: strings.success.unknownBody,
        confirmed: false,
        awaiting: false,
        retryable: true,
      };
    case 'unavailable':
      return {
        heading: strings.success.unavailableHeading,
        body: strings.success.unavailableBody,
        confirmed: false,
        awaiting: false,
        retryable: false,
      };
  }
}
