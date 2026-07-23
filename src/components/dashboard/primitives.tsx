import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { formatCents } from '@/lib/clientPlatform/validation';

// Shared light-mode dashboard primitives. Premium, restrained, native to the Cogniiq admin
// visual language: warm off-white page, white surfaces, graphite type, near-black primary actions,
// soft shadows, 16–20px radii. Reusable by the admin and owner areas.

/* ------------------------------------------------------------------ Buttons */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md';

const buttonBase =
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f7f4]';

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-gray-950 text-white hover:bg-gray-800',
  secondary: 'border border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:text-gray-950',
  ghost: 'text-gray-600 hover:bg-gray-100 hover:text-gray-950',
  danger: 'bg-red-600 text-white hover:bg-red-500',
  success: 'bg-emerald-600 text-white hover:bg-emerald-500',
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-[13px]',
  md: 'h-11 px-4 text-[13.5px]',
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
      className={cn(buttonBase, buttonVariants[variant], buttonSizes[size], className)}
      {...rest}
    >
      {loading ? <Spinner /> : Icon ? <Icon size={size === 'sm' ? 14 : 15} aria-hidden="true" /> : null}
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
        'inline-flex h-9 w-9 items-center justify-center rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950/40 focus-visible:ring-offset-2',
        variant === 'secondary' ? 'border border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-950' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-950',
        className,
      )}
      {...rest}
    >
      <Icon size={16} aria-hidden="true" />
    </button>
  );
});

export function Spinner({ className }: { className?: string }) {
  return <span className={cn('h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent opacity-70', className)} aria-hidden="true" />;
}

/* ------------------------------------------------------------------ Surfaces */

export function Card({ children, className, as: As = 'div', id }: { children: ReactNode; className?: string; as?: 'div' | 'section'; id?: string }) {
  return (
    <As id={id} className={cn('rounded-[20px] border border-gray-100 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.04)]', className)}>
      {children}
    </As>
  );
}

export function SectionHeader({ title, description, action, className }: { title: string; description?: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between', className)}>
      <div>
        <h3 className="text-sm font-semibold tracking-tight text-gray-950">{title}</h3>
        {description ? <p className="mt-0.5 text-[12.5px] leading-5 text-gray-500">{description}</p> : null}
      </div>
      {action ? <div className="flex flex-wrap gap-2">{action}</div> : null}
    </div>
  );
}

export function PageHeader({ title, description, actions, breadcrumb }: { title: string; description?: string; actions?: ReactNode; breadcrumb?: ReactNode }) {
  return (
    <div className="mb-6">
      {breadcrumb ? <div className="mb-2">{breadcrumb}</div> : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-950 sm:text-[26px]">{title}</h1>
          {description ? <p className="mt-2 max-w-2xl text-[13.5px] leading-6 text-gray-500">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ KPI */

export type KpiBasis = 'actual' | 'estimate' | 'forecast';
const basisLabel: Record<KpiBasis, string> = { actual: 'Ist', estimate: 'Schätzung', forecast: 'Prognose' };
const basisTone: Record<KpiBasis, string> = {
  actual: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  estimate: 'border-amber-200 bg-amber-50 text-amber-700',
  forecast: 'border-sky-200 bg-sky-50 text-sky-700',
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
  const valueColor = tone === 'positive' ? 'text-emerald-700' : tone === 'negative' ? 'text-red-600' : 'text-gray-950';
  const inner = (
    <>
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {Icon ? <Icon size={15} className="text-gray-400" aria-hidden="true" /> : null}
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400">{label}</p>
        </div>
        {basis ? <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-semibold', basisTone[basis])}>{basisLabel[basis]}</span> : null}
      </div>
      <p className={cn('text-[24px] font-semibold tracking-tight tabular-nums', valueColor)}>{display}</p>
      {hint ? <p className="mt-1.5 text-[12px] leading-5 text-gray-500">{hint}</p> : null}
    </>
  );
  const cls = 'rounded-[20px] border border-gray-100 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.04)]';
  if (to) {
    return <Link to={to} className={cn(cls, 'block transition-colors hover:border-gray-200')}>{inner}</Link>;
  }
  return <div className={cls}>{inner}</div>;
}

/* ------------------------------------------------------------------ Badges */

const badgeTones: Record<string, string> = {
  neutral: 'border-gray-200 bg-gray-50 text-gray-600',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  danger: 'border-red-200 bg-red-50 text-red-700',
  info: 'border-sky-200 bg-sky-50 text-sky-700',
};
export type BadgeTone = keyof typeof badgeTones;

export function StatusBadge({ label, tone = 'neutral', className }: { label: string; tone?: BadgeTone; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold', badgeTones[tone], className)}>
      {label}
    </span>
  );
}

/* ------------------------------------------------------------------ Form fields */

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
        <label htmlFor={id} className="mb-1.5 block text-[12px] font-semibold text-gray-600">
          {label} {required ? <span className="text-red-500">*</span> : null}
        </label>
      ) : null}
      <div className={cn('flex items-center rounded-xl border bg-white transition-colors focus-within:border-gray-400', error ? 'border-red-300' : 'border-gray-200', disabled && 'bg-gray-50')}>
        {prefix ? <span className="pl-3 text-sm text-gray-400" aria-hidden="true">{prefix}</span> : null}
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
          className="h-11 w-full rounded-xl bg-transparent px-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 disabled:text-gray-500"
        />
      </div>
      {hint && !error ? <p id={`${id}-hint`} className="mt-1 text-[11.5px] text-gray-400">{hint}</p> : null}
      {error ? <p id={`${id}-error`} className="mt-1 text-[12px] text-red-600">{error}</p> : null}
    </div>
  );
}

export function Select({
  id, label, value, onChange, options, hint, disabled, required, error,
}: {
  id: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  hint?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
}) {
  return (
    <div>
      {label ? (
        <label htmlFor={id} className="mb-1.5 block text-[12px] font-semibold text-gray-600">
          {label} {required ? <span className="text-red-500">*</span> : null}
        </label>
      ) : null}
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        className={cn(
          'h-11 w-full rounded-xl border bg-white px-3 text-sm text-gray-900 outline-none transition-colors focus:border-gray-400 disabled:bg-gray-50 disabled:text-gray-500',
          error ? 'border-red-300' : 'border-gray-200',
        )}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      {hint && !error ? <p className="mt-1 text-[11.5px] text-gray-400">{hint}</p> : null}
      {error ? <p className="mt-1 text-[12px] text-red-600">{error}</p> : null}
    </div>
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
      {label ? <label htmlFor={id} className="mb-1.5 block text-[12px] font-semibold text-gray-600">{label}</label> : null}
      <textarea
        id={id}
        value={value}
        rows={rows}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-gray-400 placeholder:text-gray-400 disabled:bg-gray-50"
      />
      {hint ? <p className="mt-1 text-[11.5px] text-gray-400">{hint}</p> : null}
    </div>
  );
}

export function Checkbox({ id, label, checked, onChange, hint, disabled }: {
  id: string; label: ReactNode; checked: boolean; onChange: (checked: boolean) => void; hint?: string; disabled?: boolean;
}) {
  return (
    <label htmlFor={id} className={cn('flex items-start gap-3 text-[13px]', disabled ? 'text-gray-400' : 'text-gray-700')}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-gray-950 focus:ring-gray-950/40"
      />
      <span>
        {label}
        {hint ? <span className="mt-0.5 block text-[11.5px] text-gray-400">{hint}</span> : null}
      </span>
    </label>
  );
}

/* ------------------------------------------------------------------ States */

export function EmptyState({ icon: Icon, title, description, action, className }: {
  icon: LucideIcon; title: string; description: string; action?: ReactNode; className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center rounded-[20px] border border-dashed border-gray-200 bg-white py-14 text-center', className)}>
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 text-gray-400">
        <Icon size={22} aria-hidden="true" />
      </span>
      <p className="text-base font-semibold text-gray-950">{title}</p>
      <p className="mt-2 max-w-md px-6 text-[13.5px] leading-6 text-gray-500">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ message, onRetry, title = 'Etwas ist schiefgelaufen' }: { message: string; onRetry?: () => void; title?: string }) {
  return (
    <div className="rounded-[20px] border border-red-100 bg-red-50/60 p-5">
      <p className="text-sm font-semibold text-red-700">{title}</p>
      <p className="mt-1 break-words text-[13px] leading-6 text-red-600">{message}</p>
      {onRetry ? (
        <button type="button" onClick={onRetry} className="mt-3 inline-flex h-9 items-center rounded-xl border border-red-200 bg-white px-3 text-[13px] font-semibold text-red-700 transition-colors hover:bg-red-50">
          Erneut versuchen
        </button>
      ) : null}
    </div>
  );
}

export function LoadingState({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[20px] border border-gray-100 bg-white px-5 py-4 text-sm text-gray-500 shadow-[0_18px_60px_rgba(15,23,42,0.04)]">
      <Spinner className="text-gray-400" /> {label ?? 'Wird geladen…'}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-gray-100', className)} aria-hidden="true" />;
}

export function KpiSkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-[20px] border border-gray-100 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.04)]">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-4 h-7 w-32" />
          <Skeleton className="mt-3 h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-[20px] border border-gray-100 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.04)]">
      <div className="border-b border-gray-100 px-5 py-3.5"><Skeleton className="h-3 w-40" /></div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 border-b border-gray-50 px-5 py-4 last:border-0">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className={cn('h-3.5', c === 0 ? 'w-32' : 'flex-1')} />
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
    <div className={cn('flex items-center gap-1 overflow-x-auto rounded-xl border border-gray-100 bg-white p-1', className)} role="tablist">
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={cn(
              'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold transition-colors',
              active ? 'bg-gray-950 text-white' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-950',
            )}
          >
            {tab.label}
            {tab.count != null ? (
              <span className={cn('rounded-full px-1.5 text-[10px] font-bold tabular-nums', active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500')}>{tab.count}</span>
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
    <div className="rounded-[20px] border border-gray-100 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.04)]">
      {/* Desktop / tablet */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm" style={{ minWidth }}>
          <thead>
            <tr className="border-b border-gray-100 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400">
              {columns.map((c) => (
                <th key={c.key} scope="col" className={cn('px-5 py-3.5', alignClass(c.align))}>{c.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={getRowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn('border-b border-gray-50 last:border-0', onRowClick && 'cursor-pointer transition-colors hover:bg-gray-50/70')}
              >
                {columns.map((c) => (
                  <td key={c.key} className={cn('px-5 py-3.5 text-gray-700', alignClass(c.align), c.className)}>{c.render(row)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Mobile */}
      <div className="divide-y divide-gray-50 md:hidden">
        {rows.map((row) => (
          <div key={getRowKey(row)} onClick={onRowClick ? () => onRowClick(row) : undefined} className={cn('p-4', onRowClick && 'cursor-pointer')}>
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="min-w-0 text-sm font-semibold text-gray-950">{mobileTitle(row)}</div>
            </div>
            {mobileSubtitle ? <div className="mb-3 text-[12px] text-gray-500">{mobileSubtitle(row)}</div> : null}
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
              {columns.filter((c) => !c.hideOnMobile).map((c) => (
                <div key={c.key} className="min-w-0">
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400">{c.header}</dt>
                  <dd className={cn('mt-0.5 text-[13px] text-gray-700', c.align === 'right' && 'tabular-nums')}>{c.render(row)}</dd>
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
  const tones = {
    warning: 'border-amber-200 bg-amber-50 text-amber-800',
    info: 'border-sky-200 bg-sky-50 text-sky-800',
    danger: 'border-red-200 bg-red-50 text-red-800',
  } as const;
  return (
    <div className={cn('flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between', tones[tone])}>
      <div className="min-w-0">
        <p className="text-[13px] font-semibold">{title}</p>
        {children ? <div className="mt-1 text-[12.5px] leading-5 opacity-90">{children}</div> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
