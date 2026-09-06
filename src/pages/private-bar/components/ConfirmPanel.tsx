import { formatEuro } from '../../../private-bar/pricing';
import { strings } from '../../../private-bar/strings';
import type { ConfirmStatus } from '../../../private-bar/usePrivateBar';

/**
 * The step that actually changes something.
 *
 * Confirming is what marks the drinks as taken and reduces the apartment's
 * stock — payment follows afterwards, in PayPal. The copy says exactly that,
 * without turning it into a warning.
 *
 * The control is disabled while a confirmation is in flight; the real protection
 * against a double confirmation is the idempotency key carried by the request,
 * not this button.
 */
export function ConfirmPanel({
  totalCents,
  status,
  onConfirm,
}: {
  totalCents: number;
  status: ConfirmStatus;
  onConfirm: () => void;
}) {
  const pending = status === 'pending';

  return (
    <section className="pb-confirm" aria-labelledby="pb-confirm-heading">
      <div className="pb-pay__total">
        <span className="pb-pay__total-label">{strings.sheet.totalLabel}</span>
        <span className="pb-pay__total-value">
          <span key={totalCents} className="pb-amount__value">
            {formatEuro(totalCents)}
          </span>
        </span>
      </div>

      <h3 id="pb-confirm-heading" className="pb-confirm__heading">
        {strings.payment.confirmHeading}
      </h3>
      <p className="pb-confirm__body">{strings.payment.confirmBody}</p>

      <button type="button" className="pb-cta" onClick={onConfirm} disabled={pending}>
        {pending ? strings.payment.confirmPending : strings.payment.confirmCta}
      </button>
    </section>
  );
}
