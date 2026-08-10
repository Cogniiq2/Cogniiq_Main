import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { AlertCircle, Check, Circle, Clock3, Info, Plus, RefreshCw } from 'lucide-react';

import { cn } from '@/lib/utils';
import { easePremium, useMotionPresets } from '@/lib/motion';
import type { LaunchChecklistItem, LifecycleTone, SetupStep } from './customerPortalModel';

// Customer Portal primitives. Same design tokens as the owner dashboard (rounded-card /
// border-hairline / shadow-card / ease-premium) with a calmer rhythm: larger type, more air,
// fewer competing surfaces. Everything here animates opacity and transform only and degrades
// to no movement under prefers-reduced-motion.

export const appEase: [number, number, number, number] = easePremium;

/** One focus ring for every interactive element in the portal. */
export const appFocusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950/25 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas';

export const appFadeUp = {
  hidden: { opacity: 0, y: 8 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, delay, ease: appEase },
  }),
};

const toneClasses: Record<LifecycleTone, string> = {
  neutral: 'border-gray-200 bg-gray-50 text-gray-600',
  working: 'border-gray-200 bg-white text-gray-700',
  attention: 'border-amber-200 bg-amber-50 text-amber-800',
  ready: 'border-gray-300 bg-gray-100 text-gray-800',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  paused: 'border-gray-200 bg-gray-50 text-gray-500',
  danger: 'border-red-200 bg-red-50 text-red-700',
};

export function AppPageHeader({
  eyebrow,
  title,
  description,
  action,
  meta,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
  meta?: ReactNode;
}) {
  const motionPresets = useMotionPresets();
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={motionPresets.reduce ? undefined : appFadeUp}
      className="mb-9 border-b border-hairline pb-7"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">{eyebrow}</p>
          <h1 className="text-[28px] font-semibold leading-[1.12] tracking-[-0.02em] text-gray-950 sm:text-[34px]">
            {title}
          </h1>
          <p className="mt-3.5 max-w-2xl text-[15px] leading-[1.65] text-gray-600">{description}</p>
        </div>
        {action ? <div className="flex shrink-0 flex-wrap items-center gap-3">{action}</div> : null}
      </div>
      {meta ? <div className="mt-6">{meta}</div> : null}
    </motion.div>
  );
}

export function AppCard({
  children,
  className,
  interactive = false,
}: {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
}) {
  // A plain <div> unless the card is genuinely clickable — a motion node per card costs
  // render work on every list, and a resting card has nothing to animate.
  const base = cn('rounded-card border border-hairline bg-white p-5 shadow-card sm:p-6', className);
  if (!interactive) return <div className={base}>{children}</div>;
  return (
    <div className={cn(base, 'transition-[border-color,box-shadow] duration-base ease-premium hover:border-gray-200 hover:shadow-card-hover')}>
      {children}
    </div>
  );
}

export function AppSection({
  eyebrow,
  title,
  description,
  children,
  className,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <section className={cn('space-y-5', className)} aria-labelledby={`${slugify(title)}-heading`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          {eyebrow ? (
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">{eyebrow}</p>
          ) : null}
          <h2 id={`${slugify(title)}-heading`} className="text-[19px] font-semibold leading-tight tracking-[-0.015em] text-gray-950">
            {title}
          </h2>
          {description ? <p className="mt-2 text-[13.5px] leading-6 text-gray-600">{description}</p> : null}
        </div>
        {action ? <div className="flex flex-wrap gap-2">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

export function AppButton({
  children,
  to,
  icon: Icon,
  variant = 'primary',
  className,
  disabled,
  disabledReason,
  type = 'button',
  onClick,
}: {
  children: ReactNode;
  to?: string;
  icon?: LucideIcon;
  variant?: 'primary' | 'secondary' | 'text';
  className?: string;
  disabled?: boolean;
  /**
   * Why this control cannot be used right now. Rendered as visible copy next to the
   * control AND wired up via title/aria-describedby, so a disabled button never looks
   * broken or merely unresponsive.
   */
  disabledReason?: string;
  type?: ButtonHTMLAttributes<HTMLButtonElement>['type'];
  onClick?: ButtonHTMLAttributes<HTMLButtonElement>['onClick'];
}) {
  const baseClass = cn(
    'group inline-flex select-none items-center justify-center gap-2 rounded-control text-[13.5px] font-semibold',
    'transition-[background-color,border-color,color,box-shadow,transform] duration-fast ease-premium',
    'active:scale-[0.985] motion-reduce:active:scale-100',
    appFocusRing,
    variant === 'primary' && 'min-h-11 bg-gray-950 px-5 text-white shadow-sm hover:bg-gray-800',
    variant === 'secondary' &&
      'min-h-11 border border-gray-200 bg-white px-4 text-gray-700 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-950',
    variant === 'text' && 'px-1 py-1 text-gray-600 hover:text-gray-950',
    disabled && 'pointer-events-none cursor-not-allowed opacity-45',
    className
  );
  const content = (
    <>
      {Icon ? (
        <Icon
          size={15}
          className={cn('transition-transform duration-200', !disabled && variant !== 'text' && 'group-hover:translate-x-0.5')}
          aria-hidden="true"
        />
      ) : null}
      {children}
    </>
  );

  if (to && !disabled) {
    return (
      <Link to={to} className={baseClass}>
        {content}
      </Link>
    );
  }

  const hintId = disabled && disabledReason ? `disabled-hint-${slugify(String(children))}` : undefined;
  const button = (
    <button
      type={type}
      className={baseClass}
      disabled={disabled}
      onClick={onClick}
      title={disabled ? disabledReason : undefined}
      aria-describedby={hintId}
    >
      {content}
    </button>
  );

  if (!hintId) return button;

  return (
    <span className="inline-flex max-w-sm flex-col items-start gap-1.5">
      {button}
      <span id={hintId} className="text-[11.5px] leading-[1.45] text-gray-400">
        {disabledReason}
      </span>
    </span>
  );
}

/**
 * Honest marker for a surface that is intentionally not built yet. Used instead of
 * leaving inert controls that read as broken functionality.
 */
export function AppInPreparationBadge({ label = 'In Vorbereitung' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-gray-500">
      <Clock3 size={12} aria-hidden="true" />
      {label}
    </span>
  );
}

/**
 * Explains, once and prominently, why a whole group of inputs is currently read-only —
 * clearer than repeating the same hint on fifteen individual fields.
 */
export function AppReadOnlyNotice({ children }: { children: ReactNode }) {
  return (
    <div className="mb-6 flex items-start gap-3 rounded-card border border-amber-200 bg-amber-50 px-4 py-3">
      <Info size={15} className="mt-0.5 flex-shrink-0 text-amber-700" aria-hidden="true" />
      <p className="text-[12.5px] leading-5 text-amber-800">{children}</p>
    </div>
  );
}

export function AppStatusBadge({
  label,
  tone = 'neutral',
  icon: Icon,
}: {
  label: string;
  tone?: LifecycleTone;
  icon?: LucideIcon;
}) {
  return (
    <span
      className={cn(
        // max-w-full + truncate: this badge also carries the organisation NAME on the
        // portal home, and a long German company name at 390px was 435px wide on its own
        // — 45px past the viewport. Short status labels are unaffected.
        'inline-flex max-w-full items-center gap-1.5 truncate whitespace-nowrap rounded-lg border px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.12em]',
        toneClasses[tone]
      )}
    >
      {Icon ? <Icon size={12} aria-hidden="true" /> : null}
      {label}
    </span>
  );
}

export function AppEmptyState({
  icon: Icon = Info,
  title,
  description,
  action,
  compact = false,
}: {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    // data-qa marks the intentional state for the route harness; inert in the browser.
    <div data-qa="empty-state" className={cn('rounded-card border border-dashed border-gray-200 bg-white/60 p-7', compact && 'p-5')}>
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-control border border-gray-200 bg-gray-50 text-gray-400">
        <Icon size={18} aria-hidden="true" />
      </div>
      <h3 className="text-[15px] font-semibold tracking-tight text-gray-950">{title}</h3>
      <p className="mt-2 max-w-2xl text-[13.5px] leading-6 text-gray-600">{description}</p>
      {action ? <div className="mt-5 flex flex-wrap gap-2">{action}</div> : null}
    </div>
  );
}

export function AppProgress({
  value,
  label,
}: {
  value: number;
  label?: string;
}) {
  const normalized = Math.max(0, Math.min(100, value));
  return (
    <div>
      {label ? (
        <div className="mb-2 flex items-center justify-between gap-3 text-[11px] font-semibold text-gray-500">
          <span>{label}</span>
          <span className="tabular-nums text-gray-950">{normalized}%</span>
        </div>
      ) : null}
      <div
        className="h-1.5 overflow-hidden rounded-full bg-gray-100"
        role="progressbar"
        aria-valuenow={normalized}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        {/* scaleX rather than width: the bar animates on the compositor and never
            reflows the card around it. */}
        <motion.div
          className="h-full w-full origin-left rounded-full bg-gray-950"
          initial={false}
          animate={{ scaleX: normalized / 100 }}
          transition={{ duration: 0.4, ease: appEase }}
        />
      </div>
    </div>
  );
}

export function AppStepList({
  steps,
  currentIndex = 0,
}: {
  steps: SetupStep[];
  currentIndex?: number;
}) {
  return (
    <ol className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {steps.map((step, index) => {
        const isActive = index === currentIndex;
        const isPast = index < currentIndex;
        return (
          <motion.li
            key={step.id}
            layout
            transition={{ duration: 0.24, ease: appEase }}
            className={cn(
              'relative overflow-hidden rounded-card border p-4 transition-colors duration-base ease-premium',
              isActive ? 'border-gray-300 bg-white shadow-card' : 'border-hairline bg-gray-50/80',
              isPast && 'border-emerald-100 bg-emerald-50/40'
            )}
          >
            {isActive ? <motion.div layoutId="app-step-active" className="absolute inset-x-0 top-0 h-0.5 bg-gray-900" /> : null}
            <div className="mb-4 flex items-center justify-between gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-600">
                {isPast ? <Check size={14} aria-label="Abgeschlossen" /> : index + 1}
              </span>
              <AppStatusBadge
                label={isPast ? 'bereit' : isActive ? 'aktuell' : 'wartet'}
                tone={isPast ? 'success' : isActive ? 'working' : 'neutral'}
              />
            </div>
            <h3 className="text-sm font-semibold leading-snug text-gray-950">{step.title}</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-gray-600">{step.description}</p>
          </motion.li>
        );
      })}
    </ol>
  );
}

export function AppField({
  label,
  description,
  error,
  id,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  description?: string;
  error?: string;
  id: string;
}) {
  return (
    <label className={cn('block', className)} htmlFor={id}>
      <span className="mb-1.5 block text-[12px] font-semibold text-gray-700">{label}</span>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        className={cn(
          'h-11 w-full rounded-control border bg-white px-3.5 text-sm text-gray-900 outline-none transition-colors duration-fast ease-premium placeholder:text-gray-400 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
          error ? 'border-red-300 focus:border-red-400' : 'border-gray-200 hover:border-gray-300 focus:border-gray-400'
        )}
        {...props}
      />
      {error ? <span className="mt-1.5 block text-[12px] leading-5 text-red-600">{error}</span> : null}
      {!error && description ? <span className="mt-1.5 block text-[12px] leading-5 text-gray-500">{description}</span> : null}
    </label>
  );
}

export function AppTextarea({
  label,
  description,
  error,
  id,
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  description?: string;
  error?: string;
  id: string;
}) {
  return (
    <label className={cn('block', className)} htmlFor={id}>
      <span className="mb-1.5 block text-xs font-semibold text-gray-700">{label}</span>
      <textarea
        id={id}
        aria-invalid={Boolean(error)}
        className={cn(
          'min-h-[112px] w-full resize-none rounded-control border bg-white px-3.5 py-3 text-sm leading-relaxed text-gray-900 outline-none transition-colors duration-fast ease-premium placeholder:text-gray-400 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
          error ? 'border-red-300 focus:border-red-400' : 'border-gray-200 hover:border-gray-300 focus:border-gray-400'
        )}
        {...props}
      />
      {error ? <span className="mt-1.5 block text-[12px] leading-5 text-red-600">{error}</span> : null}
      {!error && description ? <span className="mt-1.5 block text-[12px] leading-5 text-gray-400">{description}</span> : null}
    </label>
  );
}

export function AppSelect({
  label,
  labelHidden = false,
  description,
  error,
  id,
  value,
  onChange,
  options,
  className,
  disabled = false,
}: {
  label: string;
  /** Renders the label for assistive technology only — for compact filter rows. */
  labelHidden?: boolean;
  description?: string;
  error?: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  className?: string;
  disabled?: boolean;
}) {
  // Deliberately still a native <select>. The portal has exactly one select system, and a
  // native listbox is rendered by the platform rather than by the page, so it can never be
  // clipped by an ancestor's overflow and needs no portal, no focus trap and no
  // reduced-motion handling of its own.
  return (
    <label className={cn('block', className)} htmlFor={id}>
      <span className={cn('mb-1.5 block text-[12px] font-semibold text-gray-700', labelHidden && 'sr-only')}>
        {label}
      </span>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        disabled={disabled}
        className={cn(
          'h-11 w-full rounded-control border bg-white px-3.5 text-sm text-gray-900 outline-none',
          'transition-colors duration-fast ease-premium disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
          appFocusRing,
          error ? 'border-red-300 focus:border-red-400' : 'border-gray-200 hover:border-gray-300 focus:border-gray-400'
        )}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <span className="mt-1.5 block text-[12px] leading-5 text-red-600">{error}</span> : null}
      {!error && description ? <span className="mt-1.5 block text-[12px] leading-5 text-gray-500">{description}</span> : null}
    </label>
  );
}

export function AppSegmentedControl({
  label,
  options,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  options: Array<{ value: string; label: string; description?: string }>;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <fieldset>
      <legend className="mb-3 text-xs font-semibold text-gray-700">{label}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              type="button"
              key={option.value}
              disabled={disabled}
              onClick={() => onChange(option.value)}
              className={cn(
                'group relative overflow-hidden rounded-control border px-4 py-3 text-left transition-[background-color,border-color,color,transform] duration-fast ease-premium active:scale-[0.985] motion-reduce:active:scale-100 disabled:cursor-not-allowed disabled:opacity-60',
                appFocusRing,
                active ? 'border-gray-950 bg-gray-950 text-white shadow-sm' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              )}
              aria-pressed={active}
            >
              {active ? <motion.span layoutId={`segmented-${label}`} className="absolute inset-x-0 top-0 h-0.5 bg-white/70" /> : null}
              <span className="block text-sm font-semibold">{option.label}</span>
              {option.description ? (
                <span className={cn('mt-1 block text-[12px] leading-5', active ? 'text-white/70' : 'text-gray-500')}>
                  {option.description}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function AppInlineEditor({
  label,
  value,
  source,
  status = 'Noch nicht bestaetigt',
}: {
  label: string;
  value: string;
  source: string;
  status?: string;
}) {
  return (
    <div className="grid gap-4 rounded-control border border-hairline bg-gray-50 px-4 py-3 sm:grid-cols-[1fr_auto] sm:items-center">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">{label}</p>
        <p className="mt-1 text-sm font-semibold text-gray-900">{value}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <AppSourceChip label={source} />
          <AppConfidenceIndicator label={status} />
        </div>
      </div>
      <AppButton variant="secondary" disabled>
        Bearbeiten
      </AppButton>
    </div>
  );
}

export function AppSourceChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2 py-1 text-[11px] font-medium text-gray-500">
      <Circle size={7} className="fill-gray-300 text-gray-300" aria-hidden="true" />
      {label}
    </span>
  );
}

export function AppConfidenceIndicator({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2 py-1 text-[11px] font-medium text-gray-500">
      <AlertCircle size={12} aria-hidden="true" />
      {label}
    </span>
  );
}

export function AppLaunchChecklist({ items }: { items: LaunchChecklistItem[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="flex gap-3 rounded-control border border-hairline bg-gray-50 p-4">
          <span
            className={cn(
              'mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border',
              item.complete ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-white text-gray-300'
            )}
          >
            {item.complete ? <Check size={13} aria-label="Abgeschlossen" /> : <Circle size={9} aria-hidden="true" />}
          </span>
          <div>
            <p className="text-sm font-semibold text-gray-900">{item.label}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-gray-500">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AppSaveBar({
  message,
  actionLabel,
  onAction,
  disabled = false,
  loading = false,
  tone = 'neutral',
}: {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  disabled?: boolean;
  loading?: boolean;
  tone?: LifecycleTone;
}) {
  const actionDisabled = disabled || loading || !onAction;

  return (
    <motion.div
      initial={{ opacity: 0.9, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: appEase }}
      className={cn(
        'flex flex-col gap-3 rounded-card border bg-white/95 px-4 py-3 shadow-card sm:flex-row sm:items-center sm:justify-between',
        toneClasses[tone]
      )}
    >
      <p className="text-[13px] font-medium leading-5">{message}</p>
      {actionLabel ? (
        <button
          type="button"
          disabled={actionDisabled}
          onClick={onAction}
          className={cn(
            'inline-flex min-h-11 items-center justify-center gap-2 rounded-control border px-4 text-[13.5px] font-semibold transition-colors duration-fast ease-premium',
            appFocusRing,
            actionDisabled
              ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400'
              : 'border-gray-950 bg-gray-950 text-white hover:bg-gray-800'
          )}
        >
          {loading ? 'Speichert...' : actionLabel}
        </button>
      ) : null}
    </motion.div>
  );
}

export function AppSkeleton({ label }: { label: string }) {
  return (
    <div role="status" data-qa="skeleton" aria-label={label} className="rounded-card border border-hairline bg-white p-5 shadow-card">
      <span className="sr-only">{label}</span>
      <div className="animate-pulse motion-reduce:animate-none" aria-hidden="true">
        <div className="h-3 w-24 rounded-full bg-gray-100" />
        <div className="mt-5 space-y-3">
          <div className="h-3 rounded-full bg-gray-100" />
          <div className="h-3 w-2/3 rounded-full bg-gray-100" />
        </div>
      </div>
    </div>
  );
}

export function AppErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" data-qa="error-state" className="rounded-card border border-red-200/80 bg-red-50/70 p-5 text-[13.5px] leading-6 text-red-800">
      <div className="mb-2 flex items-center gap-2 font-semibold">
        <AlertCircle size={16} aria-hidden="true" />
        Fehlerzustand
      </div>
      {message}
      {onRetry ? (
        <div className="mt-4">
          <AppButton variant="secondary" icon={RefreshCw} onClick={onRetry}>
            Erneut laden
          </AppButton>
        </div>
      ) : null}
    </div>
  );
}

export function AppAddButton({
  children,
  disabledReason = 'Diese Funktion ist noch in Vorbereitung. Sobald die Datenquelle verbunden ist, können Sie hier Einträge ergänzen.',
}: {
  children: ReactNode;
  disabledReason?: string;
}) {
  return (
    <AppButton variant="secondary" disabled icon={Plus} disabledReason={disabledReason}>
      {children}
    </AppButton>
  );
}

export function AppRouteTransition({ children, routeKey }: { children: ReactNode; routeKey: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      key={routeKey}
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.24, ease: appEase }}
    >
      {children}
    </motion.div>
  );
}

export function AppPreviewNotice({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-card border border-hairline bg-white/75 px-4 py-3">
      <p className="text-[12.5px] leading-5 text-gray-600">{children}</p>
    </div>
  );
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
