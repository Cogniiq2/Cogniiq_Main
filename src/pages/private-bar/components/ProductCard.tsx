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
 * quantity control takes the place of that affordance — controls appear where
 * they are needed instead of cluttering every product permanently.
 *
 * A product without a configured price shows no amount and offers no control:
 * it can be looked at, not ordered.
 */
export function ProductCard({
  product,
  quantity,
  eager,
  onAdd,
  onIncrease,
  onDecrease,
}: {
  product: PrivateBarProduct;
  quantity: number;
  eager: boolean;
  onAdd: () => void;
  onIncrease: () => void;
  onDecrease: () => void;
}) {
  const orderable = isPurchasable(product);
  const selected = quantity > 0;
  const meta = [product.origin, product.volume].filter(Boolean).join(' · ');

  return (
    <li className={selected ? 'pb-product is-selected' : 'pb-product'}>
      <ProductFrame product={product} eager={eager} selected={selected} />

      <h3 className="pb-product__name">{product.name}</h3>
      {meta ? <p className="pb-product__meta">{meta}</p> : null}

      <div className="pb-product__foot">
        {orderable ? (
          <span className="pb-product__price">{formatEuro(product.priceCents as number)}</span>
        ) : (
          <span className="pb-product__price pb-product__price--pending">
            {product.available ? strings.catalogue.priceUnconfigured : strings.catalogue.unavailable}
          </span>
        )}

        {orderable ? (
          selected ? (
            <QuantityStepper
              name={product.name}
              quantity={quantity}
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
    </li>
  );
}
