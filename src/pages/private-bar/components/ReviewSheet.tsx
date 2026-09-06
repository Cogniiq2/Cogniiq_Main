import * as Dialog from '@radix-ui/react-dialog';
import type { RefObject } from 'react';

import { productById } from '../../../private-bar/catalog';
import { formatEuro } from '../../../private-bar/pricing';
import { strings } from '../../../private-bar/strings';
import type { PrivateBarController } from '../../../private-bar/usePrivateBar';

import { ConfirmPanel } from './ConfirmPanel';
import { PaymentPanel } from './PaymentPanel';
import { QuantityStepper } from './QuantityStepper';

/**
 * The review, confirmation and payment experience.
 *
 * Built on Radix Dialog, so the focus trap, focus return, Escape handling,
 * `aria-modal` semantics and body scroll lock are the platform-correct ones
 * rather than a hand-rolled approximation. The visual and motion layer is ours.
 *
 * Radix portals its content to <body>, outside the .pb-root subtree, so the
 * portal contents are wrapped in .pb-scope — the selector carrying the design
 * tokens without the page layout that .pb-root adds.
 *
 * Three states, in order: an editable selection, the confirmation step, and —
 * once stock has actually been reduced — the payment surface. A confirmed order
 * is FROZEN: it can no longer be edited, because the bottles are already out of
 * the apartment's inventory and the amount owed must keep matching what was
 * taken.
 */
export function ReviewSheet({
  open,
  onOpenChange,
  bar,
  returnFocusRef,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bar: PrivateBarController;
  /** Where focus goes when the sheet closes. Radix returns focus to a
   *  Dialog.Trigger, and this sheet is opened from state, so the target is
   *  named explicitly instead of being left to the document. */
  returnFocusRef?: RefObject<HTMLElement>;
}) {
  const confirmed = bar.confirmedOrder;
  const empty = !confirmed && bar.lines.length === 0;

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
              if (!target) return; // the control is gone: let the document decide
              event.preventDefault();
              target.focus();
            }}
          >
            <div className="pb-sheet__handle" aria-hidden="true" />

            <div className="pb-sheet__head">
              <Dialog.Title className="pb-sheet__title">
                {confirmed ? strings.sheet.confirmedTitle : strings.sheet.title}
              </Dialog.Title>
              <Dialog.Close className="pb-sheet__close" aria-label={strings.sheet.close}>
                <span aria-hidden="true">×</span>
              </Dialog.Close>
            </div>

            {/* One notice for the whole sheet. A refused confirmation can empty
                the selection, and the explanation has to outlive the step it
                happened in. */}
            <p className="pb-notice pb-sheet__notice" role="status" aria-live="polite">
              {bar.confirmStatus === 'stock_changed' || bar.reconciled
                ? strings.errors.stockChanged
                : bar.confirmStatus === 'failed'
                  ? strings.errors.confirmFailed
                  : ''}
            </p>

            <div className="pb-sheet__body">
              {confirmed ? (
                <>
                  <ul className="pb-lines">
                    {confirmed.items.map((item) => {
                      const product = productById(item.productId);
                      return (
                        <li key={item.productId} className="pb-line pb-line--static">
                          <div className="pb-line__text">
                            <p className="pb-line__name">{product?.shortLabel ?? item.productId}</p>
                            <p className="pb-line__unit">
                              {item.quantity} × {formatEuro(item.unitAmountCents)}
                            </p>
                          </div>
                          <span className="pb-line__amount">{formatEuro(item.amountCents)}</span>
                        </li>
                      );
                    })}
                  </ul>

                  <p className="pb-confirmed-note">{strings.payment.confirmedNote}</p>

                  <PaymentPanel
                    totalCents={confirmed.totalCents}
                    onNewSelection={bar.startNewSelection}
                  />
                </>
              ) : empty ? (
                <div className="pb-empty">
                  <div className="pb-empty__rule" aria-hidden="true" />
                  <p className="pb-empty__heading">{strings.sheet.emptyHeading}</p>
                  <p className="pb-empty__body">{strings.sheet.emptyBody}</p>
                </div>
              ) : (
                <>
                  <ul className="pb-lines">
                    {bar.lines.map((line) => (
                      <li key={line.product.id} className="pb-line">
                        <div className="pb-line__text">
                          <p className="pb-line__name">{line.product.shortLabel}</p>
                          <p className="pb-line__unit">
                            {formatEuro(line.unitAmountCents)} je Einheit
                          </p>
                        </div>
                        <div className="pb-line__controls">
                          {/* Decreasing past one removes the line — the minus at
                              quantity 1 IS the remove action, so no second
                              control competes for the same intent. */}
                          <QuantityStepper
                            size="compact"
                            name={line.product.name}
                            quantity={line.quantity}
                            canIncrease={line.quantity < bar.availableFor(line.product.id)}
                            onIncrease={() => bar.add(line.product.id)}
                            onDecrease={() => bar.subtract(line.product.id)}
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

                  <ConfirmPanel
                    totalCents={bar.totalCents}
                    status={bar.confirmStatus}
                    onConfirm={bar.confirm}
                  />

                  <button type="button" className="pb-clear" onClick={bar.clear}>
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
