import { useCallback, useEffect, useRef, useState } from 'react';

import { CASH_LOCATION, resolvePaypalUrl } from '../../../private-bar/config';
import { amountForCopy, formatEuro } from '../../../private-bar/pricing';
import { strings } from '../../../private-bar/strings';

/**
 * Copies text without a browser dialog and without assuming a modern API.
 *
 * The async Clipboard API needs a secure context and a permission that can be
 * refused; the textarea fallback is what makes the control work anyway. Neither
 * path logs — a failed copy is answered in the interface, not in the console.
 */
async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the manual path
  }

  try {
    const field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.top = '-1000px';
    field.style.opacity = '0';
    document.body.appendChild(field);
    field.select();
    const copied = document.execCommand('copy');
    document.body.removeChild(field);
    return copied;
  } catch {
    return false;
  }
}

/**
 * The payment surface, shown once the selection has been confirmed.
 *
 * The PayPal page is configured for a customer-entered amount, so this panel's
 * job is to make the exact figure impossible to miss and effortless to carry
 * over: it is stated large, and one control puts it on the clipboard as a plain
 * German decimal ("29,50").
 *
 * Nothing here learns the outcome. Opening PayPal produces one line saying the
 * payment is completed there — never that it was received.
 */
export function PaymentPanel({
  totalCents,
  onNewSelection,
}: {
  totalCents: number;
  onNewSelection: () => void;
}) {
  const paypalUrl = resolvePaypalUrl();
  const formatted = formatEuro(totalCents);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [handedOff, setHandedOff] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    },
    []
  );

  const onCopy = useCallback(async () => {
    const ok = await copyText(amountForCopy(totalCents));
    setCopyState(ok ? 'copied' : 'failed');
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopyState('idle'), ok ? 2200 : 5000);
  }, [totalCents]);

  return (
    <section className="pb-pay" aria-labelledby="pb-pay-heading">
      <h3 id="pb-pay-heading" className="pb-eyebrow pb-pay__heading">
        {strings.payment.heading}
      </h3>

      <div className="pb-pay__total">
        <span className="pb-pay__total-label">{strings.sheet.totalLabel}</span>
        <span className="pb-pay__total-value">
          <span key={totalCents} className="pb-amount__value">
            {formatted}
          </span>
        </span>
      </div>

      {paypalUrl ? (
        <>
          <a
            className="pb-cta"
            href={paypalUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setHandedOff(true)}
          >
            {strings.payment.paypal}
          </a>
          <p className="pb-pay__note">{strings.payment.paypalNote(formatted)}</p>
        </>
      ) : (
        <>
          <button type="button" className="pb-cta" disabled>
            {strings.payment.paypal}
          </button>
          <p className="pb-pay__note">{strings.payment.paypalUnavailable}</p>
        </>
      )}

      <button
        type="button"
        className={copyState === 'copied' ? 'pb-copy is-copied' : 'pb-copy'}
        onClick={onCopy}
        aria-label={strings.payment.copyAmountAria(formatted)}
      >
        <span className="pb-copy__label">
          {copyState === 'copied' ? strings.payment.copied : strings.payment.copyAmount}
        </span>
      </button>

      {/* Never a claim about the payment: only that it is finished in PayPal,
          and that the selection is safe here in the meantime. */}
      <p className="pb-pay__handoff" role="status" aria-live="polite">
        {copyState === 'failed' ? strings.payment.copyFailed : handedOff ? strings.payment.handedOff : ''}
      </p>

      <div className="pb-pay__divider" aria-hidden="true">
        <span>{strings.payment.or}</span>
      </div>

      <div className="pb-cash">
        <h4 className="pb-cash__heading">{strings.payment.cashHeading}</h4>
        <p className="pb-cash__body">
          {strings.payment.cashBody}
          {CASH_LOCATION ? ` ${CASH_LOCATION}` : ''}
        </p>
      </div>

      <button type="button" className="pb-clear" onClick={onNewSelection}>
        {strings.payment.newSelection}
      </button>
    </section>
  );
}
