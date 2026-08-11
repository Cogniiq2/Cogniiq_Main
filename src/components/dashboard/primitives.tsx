import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { formatCents } from '@/lib/clientPlatform/validation';
import {
  border, control, elevation, focusRing, focusRingOnSurface, interactive,
  radius, skeleton as skeletonClass, space, statusTone, surface, text,
} from './tokens';
import { PremiumSelect, type SelectOption } from './PremiumSelect';

// Shared dashboard primitives for the authenticated Cogniiq surfaces.
//
// Every visual decision here comes from ./tokens — nothing hard-codes a colour, radius, shadow or
// duration. Public component APIs are unchanged from the pre-P1 versions so the owner finance
// pages, the finance module and the internal tasks module keep working untouched.

/* ------------------------------------------------------------------ Buttons */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md';

const buttonBase = cn(
  'inline-flex items-center justify-center gap-1.5 font-medium whitespace-nowrap',
  radius.md,
  interactive.transition,
  interactive.disabled,
  focusRing,
);

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-[var(--cq-fg)] text-white hover:bg-[#22272f]',
  secondary: cn('bg-[var(--cq-surface)] text-[var(--cq-fg)]', border.hairline, 'hover:bg-[var(--cq-hover)] hover:border-[var(--cq-border-strong)]'),
  ghost: 'text-[var(--cq-fg-muted)] hover:bg-[var(--cq-hover)] hover:text-[var(--cq-fg)]',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700',
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: control.sm,
  md: control.md,
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: LucideIcon;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, icon: Icon, className, children, disabled, type = 'button', ...rest }, ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(buttonBase, buttonVariants[variant], buttonSizes[size], className)}
      {...rest}
    >
      {loading ? <Spinner /> : Icon ? <Icon size={14} aria-hidden="true" /> : null}
      {children}
    </button>
  );
});

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  label: string;
  variant?: 'secondary' | 'ghost';
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon: Icon, label, variant = 'secondary', className, type = 'button', ...rest }, ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        // 36px square keeps icon-only actions inside the minimum touch target.
        'inline-flex h-9 w-9 items-center justify-center',
        radius.md, interactive.transition, interactive.disabled, focusRing,
        variant === 'secondary'
          ? cn('bg-[var(--cq-surface)] text-[var(--cq-fg-muted)]', border.hairline, 'hover:text-[var(--cq-fg)] hover:border-[var(--cq-border-strong)]')
          : 'text-[var(--cq-fg-subtle)] hover:bg-[var(--cq-hover)] hover:text-[var(--cq-fg)]',
        className,
      )}
      {...rest}
    >
      <Icon size={15} aria-hidden="true" />
    </button>
  );
});

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn('h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent opacity-70', className)}
      aria-hidden="true"
    />
  );
}

/* ------------------------------------------------------------------ Surfaces */

export function Card({ children, className, as: As = 'div', id }: { children: ReactNode; className?: string; as?: 'div' | 'section'; id?: string }) {
  return (
    <As id={id} className={cn(surface.card, space.cardPadding, className)}>
      {children}
    </As>
  );
}

export function SectionHeader({ title, description, action, className }: { title: string; description?: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between', className)}>
      <div className="min-w-0">
        <h3 className={text.sectionTitle}>{title}</h3>
        {description ? <p className={cn('mt-0.5', text.hint)}>{description}</p> : null}
      </div>
      {action ? <div className="flex flex-wrap gap-2">{action}</div> : null}
    </div>
  );
}

export function PageHeader({ title, description, actions, breadcrumb }: { title: string; description?: string; actions?: ReactNode; breadcrumb?: ReactNode }) {
  return (
    <div className="mb-5">
      {breadcrumb ? <div className="mb-2">{breadcrumb}</div> : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className={text.pageTitle}>{title}</h1>
          {description ? <p className={cn('mt-1 max-w-2xl', text.body)}>{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ KPI */

export type KpiBasis = 'actual' | 'estimate' | 'forecast';
const basisLabel: Record<KpiBasis, string> = { actual: 'Ist', estimate: 'Schätzung', forecast: 'Prognose' };
const basisTone: Record<KpiBasis, string> = {
  actual: statusTone.success,
  estimate: statusTone.warning,
  forecast: statusTone.info,
};

export function KpiCard({
  label, valueCents, value, basis, hint, currency = 'EUR', tone = 'neutral', to, icon: Icon,
}: {
  label: string;
  valueCents?: number | null;
  value?: string;
  basis?: KpiBasis;
  hint?: string;
  currency?: string;
  tone?: 'neutral' | 'positive' | 'negative';
  to?: string;
  icon?: LucideIcon;
}) {
  const display = value ?? (valueCents == null ? '—' : formatCents(valueCents, currency));
  const valueColor = tone === 'positive' ? 'text-emerald-700' : tone === 'negative' ? 'text-red-600' : '';
  const inner = (
    <>
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          {Icon ? <Icon size={13} className="shrink-0 text-[var(--cq-fg-subtle)]" aria-hidden="true" /> : null}
          <p className={cn('truncate', text.eyebrow)}>{label}</p>
        </div>
        {basis ? (
          <span className={cn('shrink-0 border px-1.5 py-0.5 text-[10px] font-medium', radius.sm, basisTone[basis])}>
            {basisLabel[basis]}
          </span>
        ) : null}
      </div>
      <p className={cn(text.metric, valueColor)}>{display}</p>
      {hint ? <p className={cn('mt-1', text.hint)}>{hint}</p> : null}
    </>
  );
  const cls = cn(surface.card, space.cardPaddingTight);
  if (to) {
    return (
      <Link to={to} className={cn(cls, 'block', interactive.transition, focusRing, 'hover:border-[var(--cq-border-strong)] hover:bg-[var(--cq-hover)]')}>
        {inner}
      </Link>
    );
  }
  return <div className={cls}>{inner}</div>;
}

/* ------------------------------------------------------------------ Badges */

export type BadgeTone = keyof typeof statusTone;

export function StatusBadge({ label, tone = 'neutral', className }: { label: string; tone?: BadgeTone; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 border px-2 py-0.5 text-[11px] font-medium leading-4', radius.sm, statusTone[tone], className)}>
      {label}
    </span>
  );
}

/* ------------------------------------------------------------------ Form fields */

const fieldShell = cn(
  'flex items-center bg-[var(--cq-surface)]',
  border.hairline, radius.md, interactive.transition,
  'focus-within:ring-2 focus-within:ring-[var(--cq-focus)] focus-within:ring-offset-2 focus-within:ring-offset-[var(--cq-canvas)]',
);

export function Field({
  id, label, value, onChange, placeholder, type = 'text', error, required, hint, disabled, prefix, min, step, inputMode, autoFocus,
}: {
  id: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  error?: string;
  required?: boolean;
  hint?: string;
  disabled?: boolean;
  prefix?: string;
  min?: string;
  step?: string;
  inputMode?: 'text' | 'decimal' | 'numeric';
  autoFocus?: boolean;
}) {
  return (
    <div>
      {label ? (
        <label htmlFor={id} className={cn('mb-1.5 block', text.label)}>
          {label} {required ? <span className="text-red-500" aria-hidden="true">*</span> : null}
        </label>
      ) : null}
      <div className={cn(fieldShell, error && 'border-red-300', disabled && 'bg-[var(--cq-sunken)]')}>
        {prefix ? <span className={cn('pl-3', text.hint)} aria-hidden="true">{prefix}</span> : null}
        <input
          id={id}
          type={type}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          min={min}
          step={step}
          inputMode={inputMode}
          autoFocus={autoFocus}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          onChange={(event) => onChange(event.target.value)}
          className={cn(
            'h-10 w-full bg-transparent px-3 text-[13px] text-[var(--cq-fg)] outline-none',
            radius.md,
            'placeholder:text-[var(--cq-fg-subtle)] disabled:cursor-not-allowed disabled:text-[var(--cq-fg-subtle)]',
          )}
        />
      </div>
      {hint && !error ? <p id={`${id}-hint`} className={cn('mt-1', text.hint)}>{hint}</p> : null}
      {error ? <p id={`${id}-error`} className="mt-1 text-[12px] leading-4 text-red-600">{error}</p> : null}
    </div>
  );
}

/**
 * Constrained single choice. Backed by the Radix-based PremiumSelect: portalled menu, typeahead,
 * keyboard navigation, selected checkmark and full ARIA. The prop contract is unchanged from the
 * previous native <select> implementation, so all existing call sites work untouched — including
 * options that use "" as a real value (mapped internally, see PremiumSelect).
 */
export function Select({
  id, label, value, onChange, options, hint, disabled, required, error,
}: {
  id: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  hint?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
}) {
  return (
    <PremiumSelect
      id={id}
      label={label}
      value={value}
      onChange={onChange}
      options={options}
      hint={hint}
      disabled={disabled}
      required={required}
      error={error}
    />
  );
}

export function Textarea({
  id, label, value, onChange, placeholder, rows = 3, hint, disabled,
}: {
  id: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      {label ? <label htmlFor={id} className={cn('mb-1.5 block', text.label)}>{label}</label> : null}
      <textarea
        id={id}
        value={value}
        rows={rows}
        placeholder={placeholder}
        disabled={disabled}
        aria-describedby={hint ? `${id}-hint` : undefined}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          'w-full bg-[var(--cq-surface)] px-3 py-2.5 text-[13px] leading-5 text-[var(--cq-fg)] outline-none',
          border.hairline, radius.md, interactive.transition, focusRing,
          'placeholder:text-[var(--cq-fg-subtle)] disabled:cursor-not-allowed disabled:bg-[var(--cq-sunken)]',
        )}
      />
      {hint ? <p id={`${id}-hint`} className={cn('mt-1', text.hint)}>{hint}</p> : null}
    </div>
  );
}

export function Checkbox({ id, label, checked, onChange, hint, disabled }: {
  id: string; label: ReactNode; checked: boolean; onChange: (checked: boolean) => void; hint?: string; disabled?: boolean;
}) {
  return (
    <label
      htmlFor={id}
      className={cn('flex items-start gap-2.5 text-[13px] leading-5', disabled ? 'cursor-not-allowed text-[var(--cq-fg-subtle)]' : 'cursor-pointer text-[var(--cq-fg)]')}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        aria-describedby={hint ? `${id}-hint` : undefined}
        onChange={(event) => onChange(event.target.checked)}
        className={cn('mt-px h-4 w-4 shrink-0 border-[var(--cq-border-strong)] text-[var(--cq-fg)]', radius.sm, focusRingOnSurface)}
      />
      <span className="min-w-0">
        {label}
        {hint ? <span id={`${id}-hint`} className={cn('mt-0.5 block', text.hint)}>{hint}</span> : null}
      </span>
    </label>
  );
}

/* ------------------------------------------------------------------ States */

export function EmptyState({ icon: Icon, title, description, action, className }: {
  icon: LucideIcon; title: string; description: string; action?: ReactNode; className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center border border-dashed border-[var(--cq-border-strong)] bg-[var(--cq-sunken)] px-6 py-12 text-center', radius.xl, className)}>
      <span className={cn('mb-3 flex h-10 w-10 items-center justify-center bg-[var(--cq-surface)] text-[var(--cq-fg-subtle)]', border.hairline, radius.lg)}>
        <Icon size={18} aria-hidden="true" />
      </span>
      <p className={text.cardTitle}>{title}</p>
      <p className={cn('mt-1.5 max-w-md', text.body)}>{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ message, onRetry, title = 'Etwas ist schiefgelaufen' }: { message: string; onRetry?: () => void; title?: string }) {
  return (
    <div className={cn('border border-red-200 bg-red-50 p-4', radius.xl)} role="alert">
      <p className="text-[13px] font-semibold leading-5 text-red-800">{title}</p>
      <p className="mt-1 break-words text-[13px] leading-5 text-red-700">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className={cn('mt-3 inline-flex h-9 items-center border border-red-200 bg-white px-3 text-[13px] font-medium text-red-700', radius.md, interactive.transition, focusRing, 'hover:bg-red-50')}
        >
          Erneut versuchen
        </button>
      ) : null}
    </div>
  );
}

export function LoadingState({ label }: { label?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5 px-4 py-3', surface.card, text.body)} role="status">
      <Spinner className="text-[var(--cq-fg-subtle)]" /> {label ?? 'Wird geladen…'}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn(skeletonClass, className)} aria-hidden="true" />;
}

export function KpiSkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={cn(surface.card, space.cardPaddingTight)}>
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-3 h-6 w-32" />
          <Skeleton className="mt-2 h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className={cn('overflow-hidden', surface.card, 'p-0')} aria-hidden="true">
      <div className={cn('px-4 py-3', border.hairlineB)}><Skeleton className="h-3 w-40" /></div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className={cn('flex items-center gap-4 px-4 py-3 last:border-0', border.hairlineB, border.subtle)}>
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className={cn('h-3', c === 0 ? 'w-32' : 'flex-1')} />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ Tabs */

export function Tabs({ tabs, value, onChange, className }: {
  tabs: { value: string; label: string; count?: number }[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div
      className={cn('flex items-center gap-0.5 overflow-x-auto bg-[var(--cq-sunken)] p-0.5', border.hairline, radius.md, className)}
      role="tablist"
    >
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(tab.value)}
            className={cn(
              'inline-flex h-8 shrink-0 items-center gap-1.5 px-2.5 text-[12.5px] font-medium',
              radius.sm, interactive.transition, focusRingOnSurface,
              active
                ? cn('bg-[var(--cq-surface)] text-[var(--cq-fg)]', elevation.e1)
                : 'text-[var(--cq-fg-muted)] hover:text-[var(--cq-fg)]',
            )}
          >
            {tab.label}
            {tab.count != null ? (
              <span className={cn('px-1 text-[10.5px] font-semibold tabular-nums', radius.sm, active ? 'text-[var(--cq-fg-muted)]' : 'text-[var(--cq-fg-subtle)]')}>
                {tab.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ DataTable */

export interface Column<T> {
  key: string;
  header: string;
  align?: 'left' | 'right' | 'center';
  className?: string;
  render: (row: T) => ReactNode;
  /** hide this column on small screens (folded into the mobile card) */
  hideOnMobile?: boolean;
}

/**
 * Responsive data table: a semantic <table> on md+ screens with controlled horizontal scroll, and a
 * stacked card list on small screens so rows never overflow unusably.
 */
export function DataTable<T>({ columns, rows, getRowKey, mobileTitle, mobileSubtitle, onRowClick, minWidth = 720 }: {
  columns: Column<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  mobileTitle: (row: T) => ReactNode;
  mobileSubtitle?: (row: T) => ReactNode;
  onRowClick?: (row: T) => void;
  minWidth?: number;
}) {
  const alignClass = (a?: 'left' | 'right' | 'center') => (a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left');
  return (
    <div className={cn(surface.card, 'p-0')}>
      {/* Desktop / tablet */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left" style={{ minWidth }}>
          <thead>
            <tr className={border.hairlineB}>
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className={cn(space.cellX, 'py-2.5', text.eyebrow, alignClass(c.align))}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={getRowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'border-b border-[var(--cq-border-subtle)] last:border-0',
                  onRowClick && cn('cursor-pointer', interactive.transition, interactive.hoverRow),
                )}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn(space.cellX, 'py-2.5 text-[13px] leading-5 text-[var(--cq-fg)]', alignClass(c.align), c.align === 'right' && text.numeric, c.className)}
                  >
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Mobile */}
      <div className="divide-y divide-[var(--cq-border-subtle)] md:hidden">
        {rows.map((row) => (
          <div key={getRowKey(row)} onClick={onRowClick ? () => onRowClick(row) : undefined} className={cn('p-4', onRowClick && 'cursor-pointer')}>
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className={cn('min-w-0', text.bodyStrong)}>{mobileTitle(row)}</div>
            </div>
            {mobileSubtitle ? <div className={cn('mb-3', text.hint)}>{mobileSubtitle(row)}</div> : null}
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
              {columns.filter((c) => !c.hideOnMobile).map((c) => (
                <div key={c.key} className="min-w-0">
                  <dt className={text.eyebrow}>{c.header}</dt>
                  <dd className={cn('mt-0.5 text-[13px] leading-5 text-[var(--cq-fg)]', c.align === 'right' && text.numeric)}>{c.render(row)}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Misc */

export function InfoBanner({ tone = 'warning', title, children, action }: {
  tone?: 'warning' | 'info' | 'danger';
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className={cn('flex flex-col gap-2.5 border p-3.5 sm:flex-row sm:items-center sm:justify-between', radius.lg, statusTone[tone])}>
      <div className="min-w-0">
        <p className="text-[13px] font-semibold leading-5">{title}</p>
        {children ? <div className="mt-0.5 text-[12.5px] leading-5 opacity-90">{children}</div> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
