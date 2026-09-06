import { strings } from '../../../private-bar/strings';
import type { PrivateBarProduct } from '../../../private-bar/catalog';

/**
 * The product presentation frame.
 *
 * One container, one optical treatment, for every product — so the guest can
 * match the digital representation to the physical bottle at a glance. The
 * frame owns a fixed 3:4 ratio and the image carries its intrinsic
 * width/height, which is what keeps cumulative layout shift at zero.
 *
 * While a prepared photograph is unavailable the frame renders empty with a
 * discreet note. No bottle artwork is ever drawn or approximated.
 */
export function ProductFrame({
  product,
  eager,
}: {
  product: PrivateBarProduct;
  eager: boolean;
}) {
  const { image } = product;

  if (!image) {
    return (
      <div className="pb-frame pb-frame--pending" role="img" aria-label={strings.catalogue.imagePendingAlt}>
        <span className="pb-frame__pending">{strings.catalogue.imagePending}</span>
      </div>
    );
  }

  const srcSet = image.widths.map((width) => `${image.basePath}-${width}.webp ${width}w`).join(', ');

  return (
    <div className="pb-frame">
      <img
        className="pb-frame__image"
        src={`${image.basePath}-${image.widths[0]}.webp`}
        srcSet={srcSet}
        sizes="(min-width: 64rem) 14rem, (min-width: 40rem) 13rem, 42vw"
        width={image.width}
        height={image.height}
        alt={product.name}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
      />
    </div>
  );
}
