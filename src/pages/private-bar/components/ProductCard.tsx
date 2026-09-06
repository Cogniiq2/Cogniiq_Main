import { strings } from '../../../private-bar/strings';
import { formatEuro, isPurchasable } from '../../../private-bar/pricing';
import type { PrivateBarProduct } from '../../../private-bar/catalog';

import { ProductFrame } from './ProductFrame';
import { QuantityStepper } from './QuantityStepper';

/**
 * One catalogue entry.
 *
 * Unselected, the photograph dominates and the only affordance is a quiet
 * "Hinzufügen". Selected, the frame picks up a champagne hairline and the
 * quantity control takes its place — controls appear where they are needed
 * rather than cluttering every product permanently.
 *
 * Availability comes from live inventory: a product the apartment no longer
 * holds is shown, priced and clearly marked "Nicht verfügbar", with no way to
 * add it. The last bottles are announced quietly rather than with urgency.
 */
export function ProductCard({
  product,
  quantity,
  available,
  eager,
  onAdd,
  onIncrease,
  onDecrease,
}: {
  product: PrivateBarProduct;
  quantity: number;
  /** Live stock, already capped at the per-product maximum. */
  available: number;
  eager: boolean;
  onAdd: () => void;
  onIncrease: () => void;
  onDecrease: () => void;
}) {
  const priced = isPurchasable(product);
  const soldOut = available <= 0;
  const selected = quantity > 0;
  const meta = [product.origin, product.volume].filter(Boolean).join(' · ');
  const remaining = available - quantity;

  return (
    // The entrance reveal and the hover lift both animate `transform`, and an
    // `animation-fill-mode: both` keyframe permanently pins that property once
    // it finishes — a later CSS transition on the SAME element and property is
    // silently overridden by the filled animation. Splitting them onto two
    // elements (the li's one-time entrance vs. the inner card's hover lift)
    // keeps both independent: nested transforms compose without conflict.
    <li className={`pb-product${soldOut ? ' is-sold-out' : ''}`}>
      <div className="pb-product__inner">
        <ProductFrame product={product} eager={eager} selected={selected} dimmed={soldOut} />

        <h3 className="pb-product__name">{product.name}</h3>
        {meta ? <p className="pb-product__meta">{meta}</p> : null}

        <div className="pb-product__foot">
          {priced ? (
            <span className="pb-product__price">{formatEuro(product.priceCents as number)}</span>
          ) : (
            <span className="pb-product__price pb-product__price--pending">
              {strings.catalogue.priceUnconfigured}
            </span>
          )}

          {priced && soldOut ? (
            <span className="pb-product__state">{strings.catalogue.unavailable}</span>
          ) : null}

          {priced && !soldOut ? (
            selected ? (
              <QuantityStepper
                name={product.name}
                quantity={quantity}
                canIncrease={quantity < available}
                onIncrease={onIncrease}
                onDecrease={onDecrease}
              />
            ) : (
              <button
                type="button"
                className="pb-add"
                onClick={onAdd}
                aria-label={strings.catalogue.addAria(product.name)}
              >
                {strings.catalogue.add}
              </button>
            )
          ) : null}
        </div>

        {/* Always rendered, so the cards in a row keep a shared baseline whether
            or not they have something to say about what is left. */}
        <p className="pb-product__hint">
          {priced && !soldOut && remaining <= 2
            ? remaining <= 0
              ? strings.catalogue.lastOne
              : strings.catalogue.remaining(remaining)
            : ''}
        </p>
      </div>
    </li>
  );
}
