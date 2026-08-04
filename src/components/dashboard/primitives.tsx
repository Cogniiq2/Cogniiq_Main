import { forwardRef, useId, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useMotionPresets } from '@/lib/motion';
import { formatCents } from '@/lib/clientPlatform/validation';
import { PremiumSelect } from './premiumControls';

// Shared light-mode dashboard primitives — the single visual vocabulary of the Cogniiq
// Owner Dashboard. Every radius, border, shadow, focus ring and motion duration below comes
// from the design tokens in index.css (rounded-card / border-hairline / shadow-card /
// ease-premium), so surfaces never drift between the owner area, the CRM and the finance module.
//
// Surface hierarchy:
//   canvas  → the page background (bg-canvas)
//   card    → a resting surface (bg-white + hairline + shadow-card)
//   panel   → a floating surface: menus, popovers (shadow-panel)
//   overlay → modals and drawers (shadow-overlay)

/* ------------------------------------------------------------------ Shared recipes */

/** One focus ring for every interactive element in the dashboard. */
export const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950/25 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas';

/** Resting card surface. Exported so page-level one-offs can match exactly. */
export const cardSurface = 'rounded-card border border-hairline bg-white shadow-card';

/** Field/control chrome shared by inputs, selects and textareas. */
const controlBase =
  'w-full rounded-control border bg-white text-sm text-gray-900 outline-none transition-colors duration-fast ease-premium placeholder:text-gray-400 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500';
const controlIdle = 'border-gray-200 hover:border-gray-300 focus:border-gray-400';
const controlError = 'border-red-300 focus:border-red-400';

/* ------------------------------------------------------------------ Buttons */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md';

const buttonBase = cn(
  'inline-flex select-none items-center justify-center gap-2 rounded-control font-semibold',
  'transition-[background-color,border-color,color,box-shadow,transform] duration-fast ease-premium',
  'active:scale-[0.985] disabled:pointer-events-none disabled:opacity-45 disabled:active:scale-100',
  'motion-reduce:active:scale-100',
  focusRing,
);

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-gray-950 text-white shadow-sm hover:bg-gray-800',
  secondary: 'border border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-950',
  ghost: 'text-gray-600 hover:bg-gray-100 hover:text-gray-950',
  danger: 'bg-red-600 text-white shadow-sm hover:bg-red-500',
  success: 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-500',
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
      aria-busy={loading || undefined}
      className={cn(buttonBase, buttonVariants[variant], buttonSizes[size], className)}
      {...rest}
    >
      {loading ? <Spinner /> : Icon ? <Icon size={size === 'sm' ? 14 : 15} aria-hidden="true" /> : null}
      {children}
    </button>
  );
});

/** A navigation action that must look and feel exactly like a Button. */
export function LinkButton({
  to, variant = 'primary', size = 'md', icon: Icon, className, children,
}: {
  to: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link to={to} className={cn(buttonBase, buttonVariants[variant], buttonSizes[size], className)}>
      {Icon ? <Icon size={size === 'sm' ? 14 : 15} aria-hidden="true" /> : null}
      {children}
    </Link>
  );
}

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
        'inline-flex h-9 w-9 items-center justify-center rounded-control transition-colors duration-fast ease-premium',
        'active:scale-[0.97] motion-reduce:active:scale-100',
        variant === 'secondary'
          ? 'border border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-950'
          : 'text-gray-400 hover:bg-gray-100 hover:text-gray-950',
        focusRing,
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

export function Card({
  children, className, as: As = 'div', id, interactive = false,
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'section';
  id?: string;
  /** Only set this when the whole card is genuinely clickable. */
  interactive?: boolean;
}) {
  return (
    <As
      id={id}
      className={cn(
        cardSurface,
        'p-5 sm:p-6',
        interactive && 'transition-[border-color,box-shadow] duration-base ease-premium hover:border-gray-200 hover:shadow-card-hover',
        className,
      )}
    >
      {children}
    </As>
  );
}

export function SectionHeader({ title, description, action, className }: { title: string; description?: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between', className)}>
      <div className="min-w-0">
        <h3 className="text-[13.5px] font-semibold tracking-tight text-gray-950">{title}</h3>
        {description ? <p className="mt-1 text-[12.5px] leading-5 text-gray-500">{description}</p> : null}
      </div>
      {/* Not shrink-0: a section action can be a full-width German button ("Kundenprojekt
          anlegen"), and refusing to shrink pushed the Kundenportal tab 28px past a 390px
          viewport. It wraps instead. */}
      {action ? <div className="flex min-w-0 flex-wrap gap-2">{action}</div> : null}
    </div>
  );
}

export function PageHeader({ title, description, actions, breadcrumb }: { title: string; description?: string; actions?: ReactNode; breadcrumb?: ReactNode }) {
  return (
    <div className="mb-7 border-b border-hairline pb-6">
      {breadcrumb ? <div className="mb-2.5">{breadcrumb}</div> : null}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.015em] text-gray-950 sm:text-[26px]">{title}</h1>
          {description ? <p className="mt-2 max-w-2xl text-[13.5px] leading-6 text-gray-500">{description}</p> : null}
        </div>
        {/*
          `shrink-0` here meant an action-heavy header (the offer detail page carries six
          controls) could not give up width, so it pushed the document 398px past the
          viewport at 1024px. The row now wraps and shrinks; `lg:justify-end` keeps the
          single-action case visually identical to before.
        */}
        {actions ? <div className="flex min-w-0 flex-wrap items-center gap-2 lg:justify-end">{actions}</div> : null}
      </div>
    </div>
  );
}

/**
 * Filter/search toolbar. A single low-profile strip rather than a full card, so a page of
 * dense operational data does not start with a heavy floating box.
 */
export function Toolbar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-2.5 rounded-card border border-hairline bg-white p-2.5 lg:flex-row lg:items-center', className)}>
      {children}
    </div>
  );
}

export function SearchInput({
  value, onChange, placeholder, label, className, id,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Accessible name; rendered visually hidden. */
  label: string;
  className?: string;
  id?: string;
}) {
  const generated = useId();
  const inputId = id ?? generated;
  return (
    <div className={cn('relative flex-1', className)}>
      <label htmlFor={inputId} className="sr-only">{label}</label>
      <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
      <input
        id={inputId}
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={cn(controlBase, controlIdle, 'h-11 pl-9 pr-3')}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ KPI */

export type KpiBasis = 'actual' | 'estimate' | 'forecast';
const basisLabel: Record<KpiBasis, string> = { actual: 'Ist', estimate: 'Schätzung', forecast: 'Prognose' };
const basisTone: Record<KpiBasis, string> = {
  actual: 'border-emerald-200/70 bg-emerald-50 text-emerald-700',
  estimate: 'border-amber-200/70 bg-amber-50 text-amber-700',
  forecast: 'border-sky-200/70 bg-sky-50 text-sky-700',
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
      <div className="mb-2.5 flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {Icon ? <Icon size={14} className="shrink-0 text-gray-400" aria-hidden="true" /> : null}
          <p className="truncate text-[11px] font-semibold uppercase tracking-[0.11em] text-gray-500">{label}</p>
        </div>
        {basis ? <span className={cn('shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold', basisTone[basis])}>{basisLabel[basis]}</span> : null}
      </div>
      <p className={cn('text-[26px] font-semibold leading-none tracking-[-0.02em] tabular-nums', valueColor)}>{display}</p>
      {hint ? <p className="mt-2 text-[12px] leading-5 text-gray-500">{hint}</p> : null}
    </>
  );
  // min-w-0: as a grid item the card defaults to min-width:auto, so its widest
  // unbreakable child (a long German KPI label plus its basis badge) sized the whole
  // track and pushed the dashboard 8px past a 390px viewport. The label already
  // truncates; this lets the truncation actually take effect.
  const cls = cn(cardSurface, 'min-w-0 p-5');
  if (to) {
    return (
      <Link
        to={to}
        className={cn(cls, 'block transition-[border-color,box-shadow] duration-base ease-premium hover:border-gray-200 hover:shadow-card-hover', focusRing)}
      >
        {inner}
      </Link>
    );
  }
  return <div className={cls}>{inner}</div>;
}

/* ------------------------------------------------------------------ Badges */

const badgeTones: Record<string, string> = {
  neutral: 'border-gray-200 bg-gray-50 text-gray-600',
  success: 'border-emerald-200/80 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200/80 bg-amber-50 text-amber-700',
  danger: 'border-red-200/80 bg-red-50 text-red-700',
  info: 'border-sky-200/80 bg-sky-50 text-sky-700',
};
export type BadgeTone = keyof typeof badgeTones;

export function StatusBadge({ label, tone = 'neutral', className }: { label: string; tone?: BadgeTone; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold', badgeTones[tone], className)}>
      {label}
    </span>
  );
}

/** Small coloured dot for inline status in dense rows, where a full badge would be noisy. */
export function StatusDot({ tone = 'neutral', className }: { tone?: BadgeTone; className?: string }) {
  const dot: Record<string, string> = {
    neutral: 'bg-gray-300',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
    info: 'bg-sky-500',
  };
  return <span className={cn('inline-block h-1.5 w-1.5 shrink-0 rounded-full', dot[tone], className)} aria-hidden="true" />;
}

/* ------------------------------------------------------------------ Form fields */

const labelClass = 'mb-1.5 block text-[12px] font-semibold text-gray-700';
const hintClass = 'mt-1.5 text-[11.5px] leading-4 text-gray-500';
const errorClass = 'mt-1.5 text-[12px] leading-4 text-red-600';

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
        <label htmlFor={id} className={labelClass}>
          {label} {required ? <span className="text-red-500">*</span> : null}
        </label>
      ) : null}
      <div className={cn('flex items-center', prefix && 'relative')}>
        {prefix ? <span className="pointer-events-none absolute left-3 text-sm text-gray-400" aria-hidden="true">{prefix}</span> : null}
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
          className={cn(controlBase, error ? controlError : controlIdle, 'h-11 px-3', prefix && 'pl-7')}
        />
      </div>
      {hint && !error ? <p id={`${id}-hint`} className={hintClass}>{hint}</p> : null}
      {error ? <p id={`${id}-error`} className={errorClass}>{error}</p> : null}
    </div>
  );
}

/**
 * The dashboard's select field.
 *
 * The signature is unchanged from the native-<select> version — same props, same option
 * shape, same order, same disabled semantics, same `onChange(value)` contract — so all
 * ~43 call sites across the finance module, the CRM and the task dashboard were upgraded
 * without touching a single one. Only the rendered control changed: PremiumSelect draws
 * the list itself instead of handing the job to the browser, which is what makes a
 * checkmark, a 44px option row and a consistent radius possible at all.
 */
export function Select({
  id, label, value, onChange, options, hint, disabled, required, error, ariaLabel, className,
}: {
  id: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; disabled?: boolean }[];
  hint?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  /** Accessible name for the toolbar/filter case, where no visible label is rendered. */
  ariaLabel?: string;
  className?: string;
}) {
  return (
    <PremiumSelect
      id={id}
      label={label}
      value={value}
      onValueChange={onChange}
      options={options}
      description={hint}
      error={error}
      disabled={disabled}
      required={required}
      ariaLabel={ariaLabel}
      className={className}
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
      {label ? <label htmlFor={id} className={labelClass}>{label}</label> : null}
      <textarea
        id={id}
        value={value}
        rows={rows}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={cn(controlBase, controlIdle, 'px-3 py-2.5 leading-6')}
      />
      {hint ? <p className={hintClass}>{hint}</p> : null}
    </div>
  );
}

export function Checkbox({ id, label, checked, onChange, hint, disabled }: {
  id: string; label: ReactNode; checked: boolean; onChange: (checked: boolean) => void; hint?: string; disabled?: boolean;
}) {
  return (
    <label htmlFor={id} className={cn('flex items-start gap-3 text-[13px] leading-5', disabled ? 'text-gray-400' : 'text-gray-700')}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-gray-950 focus:ring-gray-950/30"
      />
      <span>
        {label}
        {hint ? <span className="mt-0.5 block text-[11.5px] leading-4 text-gray-500">{hint}</span> : null}
      </span>
    </label>
  );
}

/* ------------------------------------------------------------------ States */

export function EmptyState({ icon: Icon, title, description, action, className }: {
  icon: LucideIcon; title: string; description: string; action?: ReactNode; className?: string;
}) {
  return (
    // data-qa marks the intentional states for the route harness. It is inert in the
    // browser: no styling, no behaviour, no accessibility surface — it exists so QA can
    // tell "deliberately empty" apart from "never finished loading".
    <div data-qa="empty-state" className={cn('flex flex-col items-center rounded-card border border-dashed border-gray-200 bg-white/60 px-6 py-12 text-center', className)}>
      <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-control border border-gray-200 bg-gray-50 text-gray-400">
        <Icon size={20} aria-hidden="true" />
      </span>
      <p className="text-[15px] font-semibold tracking-tight text-gray-950">{title}</p>
      <p className="mt-2 max-w-md text-[13.5px] leading-6 text-gray-500">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ message, onRetry, title = 'Etwas ist schiefgelaufen' }: { message: string; onRetry?: () => void; title?: string }) {
  return (
    <div role="alert" data-qa="error-state" className="rounded-card border border-red-200/80 bg-red-50/70 p-5">
      <p className="text-[13.5px] font-semibold text-red-800">{title}</p>
      <p className="mt-1.5 break-words text-[13px] leading-6 text-red-700">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className={cn(
            'mt-4 inline-flex h-9 items-center rounded-control border border-red-200 bg-white px-3 text-[13px] font-semibold text-red-700',
            'transition-colors duration-fast ease-premium hover:bg-red-50 active:scale-[0.985] motion-reduce:active:scale-100',
            focusRing,
          )}
        >
          Erneut versuchen
        </button>
      ) : null}
    </div>
  );
}

export function LoadingState({ label }: { label?: string }) {
  return (
    <div role="status" data-qa="loading-state" className={cn(cardSurface, 'flex items-center gap-3 px-5 py-4 text-sm text-gray-500')}>
      <Spinner className="text-gray-400" /> {label ?? 'Wird geladen…'}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div data-qa="skeleton" className={cn('animate-pulse rounded-md bg-gray-100', className)} aria-hidden="true" />;
}

export function KpiSkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={cn(cardSurface, 'p-5')}>
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
    <div className={cn(cardSurface, 'overflow-hidden')} aria-hidden="true">
      <div className="border-b border-hairline px-5 py-3.5"><Skeleton className="h-3 w-40" /></div>
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
  const motionPresets = useMotionPresets();
  const groupId = useId();
  return (
    <div className={cn('inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-control border border-hairline bg-white p-1', className)} role="tablist">
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
              'relative inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold transition-colors duration-fast ease-premium',
              active ? 'text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-950',
              focusRing,
            )}
          >
            {active ? (
              <motion.span
                layoutId={`dashboard-tab-${groupId}`}
                className="absolute inset-0 rounded-lg bg-gray-950"
                transition={motionPresets.indicator}
              />
            ) : null}
            <span className="relative z-10">{tab.label}</span>
            {tab.count != null ? (
              <span className={cn('relative z-10 rounded-full px-1.5 text-[10px] font-bold tabular-nums', active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500')}>{tab.count}</span>
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
 *
 * `onRowClick` is a pointer convenience only. It deliberately does NOT put role="button"/tabIndex on
 * the row: that would override the row's table semantics and nest an interactive element inside
 * another one. Rows that navigate must therefore still contain a real <Link> (normally the first
 * cell) — that link is the keyboard and screen-reader path, and clicking the row is the shortcut.
 */
export function DataTable<T>({ columns, rows, getRowKey, mobileTitle, mobileSubtitle, onRowClick, isRowSelected, caption, minWidth = 720 }: {
  columns: Column<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  mobileTitle: (row: T) => ReactNode;
  mobileSubtitle?: (row: T) => ReactNode;
  onRowClick?: (row: T) => void;
  /** Marks a row as the current/acted-on one. Renders a tint plus a left marker, never colour alone. */
  isRowSelected?: (row: T) => boolean;
  /** Visually hidden table caption. A screen-reader user otherwise meets an unnamed grid. */
  caption?: string;
  minWidth?: number;
}) {
  const alignClass = (a?: 'left' | 'right' | 'center') => (a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left');
  // Right-aligned columns in this product are money, counts and percentages. Proportional
  // digits make a column of amounts ragged even when it is flush right, so they get
  // tabular figures — the single change that makes a financial table read professionally.
  const numericClass = (a?: 'left' | 'right' | 'center') => (a === 'right' ? 'tabular-nums' : undefined);
  const interactiveProps = (row: T) => (onRowClick ? { onClick: () => onRowClick(row) } : {});

  return (
    <div className={cn(cardSurface, 'overflow-hidden')}>
      {/* Desktop / tablet */}
      <div className="hidden max-h-[70vh] overflow-auto md:block">
        <table className="w-full text-left text-sm" style={{ minWidth }}>
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          {/* Sticky so the column meaning survives a long invoice or expense list. The
              background is opaque, not a tint, or the scrolled rows show through it. */}
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-hairline bg-gray-50 text-[10.5px] font-semibold uppercase tracking-[0.09em] text-gray-500 [&>th]:bg-gray-50">
              {columns.map((c) => (
                <th key={c.key} scope="col" className={cn('px-5 py-3 font-semibold', alignClass(c.align))}>{c.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const selected = isRowSelected?.(row) ?? false;
              return (
                <tr
                  key={getRowKey(row)}
                  {...interactiveProps(row)}
                  aria-current={selected ? 'true' : undefined}
                  className={cn(
                    'relative border-b border-gray-50 last:border-0',
                    onRowClick && 'cursor-pointer transition-colors duration-fast ease-premium hover:bg-gray-50/80 focus-within:bg-gray-50/80',
                    selected && 'bg-gray-950/[0.035] hover:bg-gray-950/[0.045]',
                  )}
                >
                  {columns.map((c, columnIndex) => (
                    <td
                      key={c.key}
                      className={cn(
                        'relative px-5 py-3.5 align-middle text-[13px] text-gray-700',
                        alignClass(c.align),
                        numericClass(c.align),
                        c.className,
                      )}
                    >
                      {selected && columnIndex === 0 ? (
                        <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-gray-950" aria-hidden="true" />
                      ) : null}
                      {c.render(row)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Mobile */}
      <div className="divide-y divide-gray-50 md:hidden">
        {rows.map((row) => (
          <div
            key={getRowKey(row)}
            {...interactiveProps(row)}
            className={cn(
              'p-4',
              onRowClick && 'cursor-pointer transition-colors duration-fast ease-premium focus-within:bg-gray-50/80 active:bg-gray-50',
              isRowSelected?.(row) && 'bg-gray-950/[0.035]',
            )}
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="min-w-0 text-sm font-semibold text-gray-950">{mobileTitle(row)}</div>
            </div>
            {mobileSubtitle ? <div className="mb-3 text-[12px] leading-5 text-gray-500">{mobileSubtitle(row)}</div> : null}
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5">
              {columns.filter((c) => !c.hideOnMobile).map((c) => (
                <div key={c.key} className="min-w-0">
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-500">{c.header}</dt>
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
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
    info: 'border-sky-200 bg-sky-50 text-sky-900',
    danger: 'border-red-200 bg-red-50 text-red-900',
  } as const;
  return (
    <div className={cn('flex flex-col gap-3 rounded-card border p-4 sm:flex-row sm:items-center sm:justify-between', tones[tone])}>
      <div className="min-w-0">
        <p className="text-[13px] font-semibold">{title}</p>
        {children ? <div className="mt-1 text-[12.5px] leading-5 opacity-90">{children}</div> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
