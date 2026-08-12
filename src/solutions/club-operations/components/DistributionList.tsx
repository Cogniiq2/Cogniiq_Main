// A labelled proportion list: label, share bar, value.
//
// Used for payment-status distribution and court utilisation. A bar rather than a pie because the
// comparison staff actually make is "which is biggest", and a bar answers that at a glance without
// a legend. The bar is decorative — every value is also present as text, so the information does
// not depend on colour or on the bar rendering at all.

import { cn } from '@/lib/utils';
import { radius, text } from '@/components/dashboard/tokens';

export interface DistributionRow {
  key: string;
  label: string;
  /** 0–100. */
  percent: number;
  value: string;
  hint?: string;
}

export function DistributionList({ rows, emptyLabel }: { rows: DistributionRow[]; emptyLabel: string }) {
  if (rows.length === 0) {
    return <p className={text.hint}>{emptyLabel}</p>;
  }

  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li key={row.key}>
          <div className="flex items-baseline justify-between gap-3">
            <span className={cn('min-w-0 truncate', text.body)}>{row.label}</span>
            <span className={cn('shrink-0 tabular-nums', text.bodyStrong)}>{row.value}</span>
          </div>
          <div
            className={cn('mt-1.5 h-1.5 w-full overflow-hidden bg-[var(--cq-sunken)]', radius.full)}
            aria-hidden="true"
          >
            <div
              className={cn('h-full bg-[var(--cq-fg-subtle)]', radius.full)}
              style={{ width: `${Math.max(0, Math.min(100, row.percent))}%` }}
            />
          </div>
          {row.hint ? <p className={cn('mt-1', text.hint)}>{row.hint}</p> : null}
        </li>
      ))}
    </ul>
  );
}
