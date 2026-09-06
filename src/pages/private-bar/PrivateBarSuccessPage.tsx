import { PrivateBarShell } from './PrivateBarShell';
import { strings } from '../../private-bar/strings';
import { viewForStatus, type OrderStatus } from '../../private-bar/successState';

/**
 * The return surface for a completed payment.
 *
 * Phase A carries the composition and the view model only. The authoritative
 * status endpoint is Phase D, so the status is `unavailable` — a state whose
 * copy says explicitly that this page confirms no payment. There is no code
 * path here, and none is planned, by which a query parameter or a redirect can
 * produce a confirmation: only `viewForStatus('paid')` sets `confirmed`.
 */
const PHASE_A_STATUS: OrderStatus = 'unavailable';

export function PrivateBarSuccessPage() {
  const view = viewForStatus(PHASE_A_STATUS);

  return (
    <PrivateBarShell title={strings.documentTitles.success}>
      <div className="pb-status">
        <p className="pb-status__mark pb-enter pb-enter--1">{strings.brand.wordmark}</p>
        <p className="pb-status__product pb-enter pb-enter--1">{strings.brand.product}</p>

        <h1 className="pb-status__heading pb-enter pb-enter--2">{view.heading}</h1>
        <p className="pb-status__body pb-enter pb-enter--3">{view.body}</p>

        {view.awaiting ? <div className="pb-pulse" aria-hidden="true" /> : null}

        <span className="sr-only" role="status" aria-live="polite">
          {view.heading}
        </span>
      </div>
    </PrivateBarShell>
  );
}
