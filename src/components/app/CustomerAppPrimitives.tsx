import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { AlertCircle, Check, Circle, Info, Plus, RefreshCw } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { LaunchChecklistItem, LifecycleTone, SetupStep } from './customerPortalModel';

export const appEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const appFadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, delay, ease: appEase },
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
  return (
    <motion.div initial="hidden" animate="visible" variants={appFadeUp} className="mb-10">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-gray-400">{eyebrow}</p>
          <h1 className="text-3xl font-bold leading-[1.06] tracking-tight text-gray-950 sm:text-4xl lg:text-[2.75rem]">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-[1.75] text-gray-500">{description}</p>
        </div>
        {action ? <div className="flex flex-wrap items-center gap-3">{action}</div> : null}
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
  return (
    <motion.div
      whileHover={interactive ? { y: -2 } : undefined}
      transition={{ duration: 0.2, ease: appEase }}
      className={cn(
        'rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.035)] sm:p-6',
        interactive && 'transition-colors duration-200 hover:border-gray-200 hover:shadow-[0_20px_70px_rgba(15,23,42,0.06)]',
        className
      )}
    >
      {children}
    </motion.div>
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
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">{eyebrow}</p>
          ) : null}
          <h2 id={`${slugify(title)}-heading`} className="text-2xl font-bold leading-tight tracking-tight text-gray-950">
            {title}
          </h2>
          {description ? <p className="mt-2 text-sm leading-6 text-gray-500">{description}</p> : null}
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
  type = 'button',
  onClick,
}: {
  children: ReactNode;
  to?: string;
  icon?: LucideIcon;
  variant?: 'primary' | 'secondary' | 'text';
  className?: string;
  disabled?: boolean;
  type?: ButtonHTMLAttributes<HTMLButtonElement>['type'];
  onClick?: ButtonHTMLAttributes<HTMLButtonElement>['onClick'];
}) {
  const baseClass = cn(
    'group inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 active:scale-[0.99]',
    variant === 'primary' &&
      'bg-gray-900 px-6 py-3.5 text-white shadow-sm hover:-translate-y-0.5 hover:bg-gray-700 hover:shadow-md',
    variant === 'secondary' &&
      'border border-gray-200 bg-white px-5 py-3 text-gray-700 hover:border-gray-400 hover:bg-gray-50',
    variant === 'text' && 'px-1 py-1 text-gray-500 hover:text-gray-950',
    disabled && 'pointer-events-none cursor-not-allowed opacity-45 hover:translate-y-0 hover:shadow-sm',
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

  return (
    <button type={type} className={baseClass} disabled={disabled} onClick={onClick}>
      {content}
    </button>
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
        'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.14em]',
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
    <div className={cn('rounded-2xl border border-gray-100 bg-gray-50/80 p-6', compact && 'p-4')}>
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 shadow-sm">
        <Icon size={17} aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold tracking-tight text-gray-950">{title}</h3>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">{description}</p>
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
        <div className="mb-2 flex items-center justify-between gap-3 text-[11px] font-semibold text-gray-400">
          <span>{label}</span>
          <span>{normalized}%</span>
        </div>
      ) : null}
      <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
        <motion.div
          className="h-full rounded-full bg-gray-900"
          initial={false}
          animate={{ width: `${normalized}%` }}
          transition={{ duration: 0.45, ease: appEase }}
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
              'relative overflow-hidden rounded-2xl border p-4 transition-colors duration-200',
              isActive ? 'border-gray-300 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.045)]' : 'border-gray-100 bg-gray-50/80',
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
            <p className="mt-2 text-[13px] leading-relaxed text-gray-500">{step.description}</p>
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
      <span className="mb-1.5 block text-xs font-semibold text-gray-700">{label}</span>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        className={cn(
          'h-11 w-full rounded-lg border bg-white px-3.5 text-sm text-gray-900 outline-none transition-all duration-200 placeholder:text-gray-300 focus:shadow-[0_0_0_3px_rgba(156,163,175,0.12)] disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400',
          error ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-gray-400'
        )}
        {...props}
      />
      {error ? <span className="mt-1.5 block text-[12px] leading-5 text-red-600">{error}</span> : null}
      {!error && description ? <span className="mt-1.5 block text-[12px] leading-5 text-gray-400">{description}</span> : null}
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
          'min-h-[112px] w-full resize-none rounded-lg border bg-white px-3.5 py-3 text-sm leading-relaxed text-gray-900 outline-none transition-all duration-200 placeholder:text-gray-300 focus:shadow-[0_0_0_3px_rgba(156,163,175,0.12)] disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400',
          error ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-gray-400'
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
  description?: string;
  error?: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <label className={cn('block', className)} htmlFor={id}>
      <span className="mb-1.5 block text-xs font-semibold text-gray-700">{label}</span>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        disabled={disabled}
        className={cn(
          'h-11 w-full rounded-lg border bg-white px-3.5 text-sm text-gray-900 outline-none transition-all duration-200 focus:shadow-[0_0_0_3px_rgba(156,163,175,0.12)] disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400',
          error ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-gray-400'
        )}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <span className="mt-1.5 block text-[12px] leading-5 text-red-600">{error}</span> : null}
      {!error && description ? <span className="mt-1.5 block text-[12px] leading-5 text-gray-400">{description}</span> : null}
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
                'group relative overflow-hidden rounded-xl border px-4 py-3 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60',
                active ? 'border-gray-400 bg-gray-900 text-white shadow-sm' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              )}
              aria-pressed={active}
            >
              {active ? <motion.span layoutId={`segmented-${label}`} className="absolute inset-x-0 top-0 h-0.5 bg-white/70" /> : null}
              <span className="block text-sm font-semibold">{option.label}</span>
              {option.description ? (
                <span className={cn('mt-1 block text-[12px] leading-5', active ? 'text-white/65' : 'text-gray-400')}>
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
    <div className="grid gap-4 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 sm:grid-cols-[1fr_auto] sm:items-center">
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
        <div key={item.id} className="flex gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
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
        'flex flex-col gap-3 rounded-2xl border bg-white/90 px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between',
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
            'inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2',
            actionDisabled
              ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400'
              : 'border-gray-900 bg-gray-900 text-white hover:bg-gray-700'
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
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="h-3 w-24 rounded-full bg-gray-100" />
      <div className="mt-5 space-y-3" aria-label={label}>
        <div className="h-3 rounded-full bg-gray-100" />
        <div className="h-3 w-2/3 rounded-full bg-gray-100" />
      </div>
    </div>
  );
}

export function AppErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm leading-6 text-red-700">
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

export function AppAddButton({ children }: { children: ReactNode }) {
  return (
    <AppButton variant="secondary" disabled icon={Plus}>
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
      exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
      transition={{ duration: 0.24, ease: appEase }}
    >
      {children}
    </motion.div>
  );
}

export function AppPreviewNotice({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white/75 px-4 py-3">
      <p className="text-[12.5px] leading-5 text-gray-500">{children}</p>
    </div>
  );
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
