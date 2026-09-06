import { strings } from '../../../private-bar/strings';
import { formatEuro, isPurchasable } from '../../../private-bar/pricing';
import type { PrivateBarProduct } from '../../../private-bar/catalog';

import { ProductFrame } from './ProductFrame';

/**
 * One catalogue entry.
 *
 * Phase A renders the presentation layer only — the selection interaction
 * (quantity state, tactile add/remove) is Phase B. A product without a
 * configured price shows no amount and offers no way to order it; the price
 * placeholder is a label, never a number.
 */
export function ProductCard({
  product,
  eager,
}: {
  product: PrivateBarProduct;
  eager: boolean;
}) {
  const purchasable = isPurchasable(product);
  const meta = [product.origin, product.volume].filter(Boolean).join(' · ');

  return (
    <li className="pb-product">
      <ProductFrame product={product} eager={eager} />
      <h3 className="pb-product__name">{product.name}</h3>
      {meta ? <p className="pb-product__meta">{meta}</p> : null}
      {purchasable ? (
        <p className="pb-product__price">{formatEuro(product.priceCents as number)}</p>
      ) : (
        <p className="pb-product__price pb-product__price--pending">
          {strings.catalogue.priceUnconfigured}
        </p>
      )}
    </li>
  );
}
