import { useCallback, useEffect, useRef, useState } from 'react';

import { resolvePaypalUrl } from '../../../private-bar/config';
import { amountForCopy, formatEuro } from '../../../private-bar/pricing';
import { strings } from '../../../private-bar/strings';

/**
 * Copies text without a browser dialog and without assuming a modern API.
 *
 * The async Clipboard API needs a secure context and a permission that can be
 * refused; the textarea fallback is what makes the control work anyway. Neither
 * path logs: a failed copy is answered in the interface, not in the console.
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
 * The payment surface.
 *
 * This version owns no payment lifecycle: it states the amount precisely, hands
 * the guest to PayPal through the one configured link, and never learns — or
 * claims — what happened afterwards. The selection is deliberately NOT cleared
 * on handoff.
 *
 * With no link configured the PayPal control is disabled rather than pointed at
 * a placeholder, and the cash alternative still stands on its own.
 */
export function PaymentPanel({ totalCents, cashLocation }: { totalCents: number; cashLocation?: string | null }) {
  const paypalUrl = resolvePaypalUrl();
  const formatted = formatEuro(totalCents);
  const [copied, setCopied] = useState(false);
  const [handedOff, setHandedOff] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (copyTimer.current) clearTimeout(copyTimer.current);
  }, []);

  const onCopy = useCallback(async () => {
    const ok = await copyText(amountForCopy(totalCents));
    if (!ok) return;
    setCopied(true);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 2200);
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
        className={copied ? 'pb-copy is-copied' : 'pb-copy'}
        onClick={onCopy}
        aria-label={strings.payment.copyAmountAria(formatted)}
      >
        <span className="pb-copy__label">
          {copied ? strings.payment.copied : strings.payment.copyAmount}
        </span>
      </button>

      {/* The handoff acknowledgement. It says only that nothing further is
          required here — never that a payment was received, because this site
          has no way of knowing that. */}
      <p className="pb-pay__handoff" role="status" aria-live="polite">
        {handedOff ? strings.payment.handedOff : ''}
      </p>

      <div className="pb-pay__divider" aria-hidden="true">
        <span>{strings.payment.or}</span>
      </div>

      <div className="pb-cash">
        <h4 className="pb-cash__heading">{strings.payment.cashHeading}</h4>
        <p className="pb-cash__body">
          {strings.payment.cashBody}
          {cashLocation ? ` ${cashLocation}` : ''}
        </p>
      </div>
    </section>
  );
}
