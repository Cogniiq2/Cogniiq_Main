import { formatEuro } from '../../../private-bar/pricing';

/**
 * A monetary amount that acknowledges its own change.
 *
 * The `key` makes React replace the element whenever the value changes, which
 * restarts a short transform/opacity keyframe — a settle rather than a count-up.
 * `tabular-nums` keeps the digits from shifting width mid-animation, and the
 * live region announces the new total once, not per keystroke of animation.
 */
export function AnimatedAmount({
  amountCents,
  className,
}: {
  amountCents: number;
  className?: string;
}) {
  const formatted = formatEuro(amountCents);
  return (
    <span className={className ? `pb-amount ${className}` : 'pb-amount'}>
      <span key={amountCents} className="pb-amount__value">
        {formatted}
      </span>
    </span>
  );
}
