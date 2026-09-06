import { strings } from '../../../private-bar/strings';

/**
 * The quantity control, shown only once a product has been selected.
 *
 * Every target is at least 44 px, the digit morphs on change (keyed element,
 * see AnimatedAmount for the same technique) and the whole control is a group
 * so a screen reader announces the product together with its quantity.
 */
export function QuantityStepper({
  name,
  quantity,
  onIncrease,
  onDecrease,
  canIncrease = true,
  size = 'default',
}: {
  name: string;
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  /** False at the last bottle in the apartment: the control says so by being spent. */
  canIncrease?: boolean;
  size?: 'default' | 'compact';
}) {
  return (
    <div
      className={size === 'compact' ? 'pb-stepper pb-stepper--compact' : 'pb-stepper'}
      role="group"
      aria-label={strings.catalogue.quantityAria(name, quantity)}
    >
      <button
        type="button"
        className="pb-stepper__button"
        onClick={onDecrease}
        aria-label={strings.catalogue.decreaseAria(name)}
      >
        <span aria-hidden="true">−</span>
      </button>
      <span className="pb-stepper__value" aria-hidden="true">
        <span key={quantity} className="pb-stepper__digit">
          {quantity}
        </span>
      </span>
      <button
        type="button"
        className="pb-stepper__button"
        onClick={onIncrease}
        disabled={!canIncrease}
        aria-label={strings.catalogue.increaseAria(name)}
      >
        <span aria-hidden="true">+</span>
      </button>
    </div>
  );
}
