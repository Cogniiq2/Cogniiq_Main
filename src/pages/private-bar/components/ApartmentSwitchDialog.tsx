import * as Dialog from '@radix-ui/react-dialog';

import { apartmentLabel, type ApartmentKey } from '../../../private-bar/apartments';
import { strings } from '../../../private-bar/strings';

/**
 * Confirmation for a switch that would discard a selection.
 *
 * A cart belongs to ONE apartment — the bottles are physically in that
 * apartment — so switching cannot carry it over and must not silently drop it.
 * With an empty selection there is nothing to lose and the switch happens
 * without asking; this dialog appears only when something would actually be
 * discarded, and says so plainly.
 *
 * Radix Dialog for the same reason as the review sheet: the focus trap, Escape
 * handling and aria-modal semantics are the platform-correct ones.
 */
export function ApartmentSwitchDialog({
  open,
  onOpenChange,
  apartment,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The apartment currently selected — the one whose cart would be cleared. */
  apartment: ApartmentKey;
  onConfirm: () => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <div className="pb-scope">
          <Dialog.Overlay className="pb-overlay" />
          <Dialog.Content className="pb-dialog" aria-describedby="pb-switch-body">
            <Dialog.Title className="pb-dialog__title">
              {strings.apartment.switchTitle}
            </Dialog.Title>
            <p id="pb-switch-body" className="pb-dialog__body">
              {strings.apartment.switchBody(apartmentLabel(apartment))}
            </p>
            <button type="button" className="pb-cta" onClick={onConfirm}>
              {strings.apartment.switchConfirm}
            </button>
            <Dialog.Close className="pb-clear">{strings.apartment.switchCancel}</Dialog.Close>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
