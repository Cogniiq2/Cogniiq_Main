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
 * The photograph's alt is empty on purpose: ProductCard renders the product
 * name as a visible heading immediately below the frame, so the image is
 * decorative relative to that heading and a screen reader announcing the name
 * twice in a row for every card would be noise, not information.
 *
 * While a prepared photograph is unavailable the frame renders empty with a
 * discreet note. No bottle artwork is ever drawn or approximated.
 */
export function ProductFrame({
  product,
  eager,
  selected = false,
  dimmed = false,
}: {
  product: PrivateBarProduct;
  eager: boolean;
  selected?: boolean;
  /** Sold out: the photograph recedes rather than disappearing. */
  dimmed?: boolean;
}) {
  const { image } = product;
  const className = `pb-frame${selected ? ' is-selected' : ''}${dimmed ? ' is-dimmed' : ''}`;

  if (!image) {
    return (
      <div
        className={`${className} pb-frame--pending`}
        role="img"
        aria-label={strings.catalogue.imagePendingAlt}
      >
        <span className="pb-frame__pending">{strings.catalogue.imagePending}</span>
      </div>
    );
  }

  const srcSet = image.widths.map((width) => `${image.basePath}-${width}.webp ${width}w`).join(', ');

  return (
    <div className={className}>
      <img
        className="pb-frame__image"
        src={`${image.basePath}-${image.widths[0]}.webp`}
        srcSet={srcSet}
        sizes="(min-width: 64rem) 14rem, (min-width: 40rem) 13rem, 42vw"
        width={image.width}
        height={image.height}
        alt=""
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
      />
    </div>
  );
}
