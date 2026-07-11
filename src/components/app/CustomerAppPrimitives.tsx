import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { AlertCircle, Check, Circle, Info, Plus } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { LaunchChecklistItem, LifecycleTone, SetupStep } from './customerPortalModel';

export const appFadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] },
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
    <motion.div initial="hidden" animate="visible" variants={appFadeUp} className="mb-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-gray-400">{eyebrow}</p>
          <h1 className="text-3xl font-bold leading-[1.08] tracking-tight text-gray-950 sm:text-4xl lg:text-5xl">
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
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.04)] sm:p-6',
        className
      )}
    >
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
    'inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2',
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
      {Icon ? <Icon size={15} aria-hidden="true" /> : null}
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
    <div className={cn('rounded-2xl border border-gray-200 bg-gray-50 p-6', compact && 'p-4')}>
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500">
        <Icon size={17} aria-hidden="true" />
      </div>
      <h3 className="text-base font-bold tracking-tight text-gray-950">{title}</h3>
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
        <div className="h-full rounded-full bg-gray-900 transition-all duration-300" style={{ width: `${normalized}%` }} />
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
          <li
            key={step.id}
            className={cn(
              'rounded-2xl border p-4 transition-colors duration-200',
              isActive ? 'border-gray-300 bg-white shadow-sm' : 'border-gray-100 bg-gray-50',
              isPast && 'border-emerald-100 bg-emerald-50/50'
            )}
          >
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
          </li>
        );
      })}
    </ol>
  );
}

export function AppField({
  label,
  description,
  id,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  description?: string;
  id: string;
}) {
  return (
    <label className={cn('block', className)} htmlFor={id}>
      <span className="mb-1.5 block text-xs font-semibold text-gray-700">{label}</span>
      <input
        id={id}
        className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3.5 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-300 focus:border-gray-400 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
        {...props}
      />
      {description ? <span className="mt-1.5 block text-[12px] leading-5 text-gray-400">{description}</span> : null}
    </label>
  );
}

export function AppTextarea({
  label,
  description,
  id,
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  description?: string;
  id: string;
}) {
  return (
    <label className={cn('block', className)} htmlFor={id}>
      <span className="mb-1.5 block text-xs font-semibold text-gray-700">{label}</span>
      <textarea
        id={id}
        className="min-h-[112px] w-full resize-none rounded-lg border border-gray-200 bg-white px-3.5 py-3 text-sm leading-relaxed text-gray-900 outline-none transition-colors placeholder:text-gray-300 focus:border-gray-400 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
        {...props}
      />
      {description ? <span className="mt-1.5 block text-[12px] leading-5 text-gray-400">{description}</span> : null}
    </label>
  );
}

export function AppSelect({
  label,
  description,
  id,
  value,
  onChange,
  options,
  className,
}: {
  label: string;
  description?: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  className?: string;
}) {
  return (
    <label className={cn('block', className)} htmlFor={id}>
      <span className="mb-1.5 block text-xs font-semibold text-gray-700">{label}</span>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3.5 text-sm text-gray-900 outline-none transition-colors focus:border-gray-400"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {description ? <span className="mt-1.5 block text-[12px] leading-5 text-gray-400">{description}</span> : null}
    </label>
  );
}

export function AppSegmentedControl({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ value: string; label: string; description?: string }>;
  value: string;
  onChange: (value: string) => void;
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
              onClick={() => onChange(option.value)}
              className={cn(
                'rounded-xl border px-4 py-3 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2',
                active ? 'border-gray-400 bg-gray-900 text-white shadow-sm' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              )}
              aria-pressed={active}
            >
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
}: {
  message: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-[13px] leading-5 text-gray-500">{message}</p>
      {actionLabel ? (
        <button
          type="button"
          disabled
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-400"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
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

export function AppErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm leading-6 text-red-700">
      <div className="mb-2 flex items-center gap-2 font-semibold">
        <AlertCircle size={16} aria-hidden="true" />
        Fehlerzustand
      </div>
      {message}
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

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
