import * as Dialog from '@radix-ui/react-dialog';
import type { RefObject } from 'react';

import { CASH_LOCATION } from '../../../private-bar/config';
import { formatEuro } from '../../../private-bar/pricing';
import { strings } from '../../../private-bar/strings';
import type { CartController } from '../../../private-bar/useCart';

import { PaymentPanel } from './PaymentPanel';
import { QuantityStepper } from './QuantityStepper';

/**
 * The review and payment experience.
 *
 * Built on Radix Dialog, so the focus trap, focus return, Escape handling,
 * `aria-modal` semantics and body scroll lock are the platform-correct ones
 * rather than a hand-rolled approximation. The visual and motion layer is ours.
 *
 * Radix portals its content to <body>, outside the .pb-root subtree, so the
 * portal contents are wrapped in .pb-scope — the selector that carries the
 * design tokens without the page layout that .pb-root adds.
 */
export function ReviewSheet({
  open,
  onOpenChange,
  cart,
  returnFocusRef,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cart: CartController;
  /** Where focus goes when the sheet closes. Radix returns focus to a
   *  Dialog.Trigger, and this sheet is opened from state, so the target is
   *  named explicitly instead of being left to the document. */
  returnFocusRef?: RefObject<HTMLElement>;
}) {
  const empty = cart.lines.length === 0;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <div className="pb-scope">
          <Dialog.Overlay className="pb-overlay" />
          <Dialog.Content
            className="pb-sheet"
            aria-describedby={undefined}
            onCloseAutoFocus={(event) => {
              const target = returnFocusRef?.current;
              if (!target) return; // the control is gone (selection cleared): let the document decide
              event.preventDefault();
              target.focus();
            }}
          >
            <div className="pb-sheet__handle" aria-hidden="true" />

            <div className="pb-sheet__head">
              <Dialog.Title className="pb-sheet__title">{strings.sheet.title}</Dialog.Title>
              <Dialog.Close className="pb-sheet__close" aria-label={strings.sheet.close}>
                <span aria-hidden="true">×</span>
              </Dialog.Close>
            </div>

            <div className="pb-sheet__body">
              {empty ? (
                <div className="pb-empty">
                  <div className="pb-empty__rule" aria-hidden="true" />
                  <p className="pb-empty__heading">{strings.sheet.emptyHeading}</p>
                  <p className="pb-empty__body">{strings.sheet.emptyBody}</p>
                </div>
              ) : (
                <>
                  <ul className="pb-lines">
                    {cart.lines.map((line) => (
                      <li key={line.product.id} className="pb-line">
                        <div className="pb-line__text">
                          <p className="pb-line__name">{line.product.shortLabel}</p>
                          <p className="pb-line__unit">{formatEuro(line.unitAmountCents)} je Einheit</p>
                        </div>
                        <div className="pb-line__controls">
                          {/* Decreasing past one removes the line — the minus at
                              quantity 1 IS the remove action, so there is no
                              second control competing for the same intent. */}
                          <QuantityStepper
                            size="compact"
                            name={line.product.name}
                            quantity={line.quantity}
                            onIncrease={() => cart.add(line.product.id)}
                            onDecrease={() => cart.subtract(line.product.id)}
                          />
                          <span className="pb-line__amount">
                            <span key={line.amountCents} className="pb-amount__value">
                              {formatEuro(line.amountCents)}
                            </span>
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <PaymentPanel totalCents={cart.totalCents} cashLocation={CASH_LOCATION} />

                  <button type="button" className="pb-clear" onClick={cart.clear}>
                    {strings.sheet.clear}
                  </button>
                </>
              )}
            </div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
