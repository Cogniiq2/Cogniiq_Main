import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { AlertCircle, Check, Circle, Clock3, Info, Plus, RefreshCw } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  border, control, dashDuration, dashEase, focusRing, focusRingOnSurface,
  interactive as interactiveTokens, radius, skeleton as skeletonClass,
  space, surface, text as dashText,
} from '@/components/dashboard/tokens';
import { PremiumSelect } from '@/components/dashboard/PremiumSelect';
import type { LaunchChecklistItem, LifecycleTone, SetupStep } from './customerPortalModel';

/**
 * Customer portal primitives.
 *
 * P2 brought these onto the shared authenticated design foundation (@/components/dashboard/tokens).
 * The portal previously ran the *public site's* type scale (page titles up to 2.75rem, 0.22em
 * eyebrows) and animated every page header and step card on mount. It now uses the application
 * scale and reserves motion for genuine interactions, so the customer and owner surfaces read as
 * two views of one product. Component APIs are unchanged — no page recomposition happens here.
 */

/** Shared dashboard easing. Re-exported under the original name for existing consumers. */
export const appEase = dashEase;

const toneClasses: Record<LifecycleTone, string> = {
  neutral: 'border-[var(--cq-border)] bg-[var(--cq-sunken)] text-[var(--cq-fg-muted)]',
  working: 'border-[var(--cq-border)] bg-[var(--cq-surface)] text-[var(--cq-fg)]',
  attention: 'border-amber-200 bg-amber-50 text-amber-800',
  ready: 'border-[var(--cq-border-strong)] bg-[var(--cq-hover)] text-[var(--cq-fg)]',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  paused: 'border-[var(--cq-border)] bg-[var(--cq-sunken)] text-[var(--cq-fg-subtle)]',
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
  // No mount animation: a page header that fades up on every navigation is page-load spectacle,
  // and it delays the first readable paint of the most important text on the screen.
  return (
    <div className="mb-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className={cn('mb-1', dashText.eyebrow)}>{eyebrow}</p>
          <h1 className={dashText.pageTitle}>{title}</h1>
          <p className={cn('mt-1 max-w-2xl', dashText.body)}>{description}</p>
        </div>
        {action ? <div className="flex flex-wrap items-center gap-2">{action}</div> : null}
      </div>
      {meta ? <div className="mt-4">{meta}</div> : null}
    </div>
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
  // Interactive cards get colour feedback only. Lifting a card on hover is a floating effect that
  // moves content under the pointer; the border/background shift reads as responsive without it.
  return (
    <div
      className={cn(
        surface.card,
        space.cardPadding,
        interactive && cn(interactiveTokens.transition, 'hover:border-[var(--cq-border-strong)] hover:bg-[var(--cq-hover)]'),
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
    <section className={cn(space.sectionGap, className)} aria-labelledby={`${slugify(title)}-heading`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {eyebrow ? <p className={cn('mb-1', dashText.eyebrow)}>{eyebrow}</p> : null}
          <h2 id={`${slugify(title)}-heading`} className={dashText.cardTitle}>
            {title}
          </h2>
          {description ? <p className={cn('mt-1 max-w-2xl', dashText.body)}>{description}</p> : null}
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
  // Matches the owner Button: colour-only feedback, no lift, no shadow growth, no icon drift.
  const baseClass = cn(
    'inline-flex items-center justify-center gap-1.5 font-medium whitespace-nowrap',
    radius.md,
    interactiveTokens.transition,
    focusRing,
    variant === 'primary' && cn(control.lg, 'bg-[var(--cq-fg)] text-white hover:bg-[#22272f]'),
    variant === 'secondary' && cn(control.lg, border.hairline, 'bg-[var(--cq-surface)] text-[var(--cq-fg)] hover:border-[var(--cq-border-strong)] hover:bg-[var(--cq-hover)]'),
    variant === 'text' && 'px-1 py-1 text-[13px] text-[var(--cq-fg-muted)] hover:text-[var(--cq-fg)]',
    disabled && 'pointer-events-none cursor-not-allowed opacity-50',
    className
  );
  const content = (
    <>
      {Icon ? <Icon size={14} aria-hidden="true" /> : null}
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
    <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
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
        // Sentence case at 11px, matching the owner StatusBadge — uppercase + wide tracking was
        // marketing chrome that made short German status words hard to scan.
        'inline-flex items-center gap-1 border px-2 py-0.5 text-[11px] font-medium leading-4',
        radius.sm,
        toneClasses[tone]
      )}
    >
      {Icon ? <Icon size={11} aria-hidden="true" /> : null}
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
    <div className={cn(surface.sunken, 'p-5', compact && 'p-4')}>
      <div className={cn('mb-3 flex h-9 w-9 items-center justify-center bg-[var(--cq-surface)] text-[var(--cq-fg-subtle)]', border.hairline, radius.md)}>
        <Icon size={16} aria-hidden="true" />
      </div>
      <h3 className={dashText.cardTitle}>{title}</h3>
      <p className={cn('mt-1 max-w-2xl', dashText.body)}>{description}</p>
      {action ? <div className="mt-4 flex flex-wrap gap-2">{action}</div> : null}
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
  const reduceMotion = useReducedMotion();
  return (
    <div>
      {label ? (
        <div className={cn('mb-1.5 flex items-center justify-between gap-3', dashText.hint)}>
          <span>{label}</span>
          <span className="tabular-nums">{normalized}%</span>
        </div>
      ) : null}
      <div
        className="h-1.5 overflow-hidden rounded-full bg-[var(--cq-hover)]"
        role="progressbar"
        aria-valuenow={normalized}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        {/* Width is the value itself, so this animates on data change only — never on mount. */}
        <motion.div
          className="h-full rounded-full bg-[var(--cq-fg)]"
          initial={false}
          animate={{ width: `${normalized}%` }}
          transition={{ duration: reduceMotion ? 0 : dashDuration.slow / 1000, ease: dashEase }}
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
        // Static list: layout animation here re-flows every sibling card whenever the step
        // advances, which is expensive and moves text the reader may be part-way through.
        return (
          <li
            key={step.id}
            className={cn(
              'relative overflow-hidden border p-4',
              radius.xl,
              interactiveTokens.transition,
              isActive
                ? 'border-[var(--cq-border-strong)] bg-[var(--cq-surface)]'
                : 'border-[var(--cq-border)] bg-[var(--cq-sunken)]',
              isPast && 'border-emerald-200 bg-emerald-50/40'
            )}
            aria-current={isActive ? 'step' : undefined}
          >
            {isActive ? <span className="absolute inset-x-0 top-0 h-0.5 bg-[var(--cq-fg)]" aria-hidden="true" /> : null}
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className={cn('flex h-7 w-7 items-center justify-center bg-[var(--cq-surface)] text-[11px] font-semibold text-[var(--cq-fg-muted)]', border.hairline, radius.md)}>
                {isPast ? <Check size={13} aria-label="Abgeschlossen" /> : index + 1}
              </span>
              <AppStatusBadge
                label={isPast ? 'bereit' : isActive ? 'aktuell' : 'wartet'}
                tone={isPast ? 'success' : isActive ? 'working' : 'neutral'}
              />
            </div>
            <h3 className={dashText.cardTitle}>{step.title}</h3>
            <p className={cn('mt-1', dashText.body)}>{step.description}</p>
          </li>
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
      <span className={cn('mb-1.5 block', dashText.label)}>{label}</span>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : description ? `${id}-hint` : undefined}
        className={cn(
          'w-full bg-[var(--cq-surface)] px-3 text-[13px] text-[var(--cq-fg)] outline-none',
          'h-10', radius.md, interactiveTokens.transition, focusRing,
          'placeholder:text-[var(--cq-fg-subtle)] disabled:cursor-not-allowed disabled:bg-[var(--cq-sunken)] disabled:text-[var(--cq-fg-subtle)]',
          error ? 'border border-red-300' : border.hairline
        )}
        {...props}
      />
      {error ? <span id={`${id}-error`} className="mt-1 block text-[12px] leading-4 text-red-600">{error}</span> : null}
      {!error && description ? <span id={`${id}-hint`} className={cn('mt-1 block', dashText.hint)}>{description}</span> : null}
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
      <span className={cn('mb-1.5 block', dashText.label)}>{label}</span>
      <textarea
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : description ? `${id}-hint` : undefined}
        className={cn(
          'min-h-[104px] w-full resize-y bg-[var(--cq-surface)] px-3 py-2.5 text-[13px] leading-5 text-[var(--cq-fg)] outline-none',
          radius.md, interactiveTokens.transition, focusRing,
          'placeholder:text-[var(--cq-fg-subtle)] disabled:cursor-not-allowed disabled:bg-[var(--cq-sunken)] disabled:text-[var(--cq-fg-subtle)]',
          error ? 'border border-red-300' : border.hairline
        )}
        {...props}
      />
      {error ? <span id={`${id}-error`} className="mt-1 block text-[12px] leading-4 text-red-600">{error}</span> : null}
      {!error && description ? <span id={`${id}-hint`} className={cn('mt-1 block', dashText.hint)}>{description}</span> : null}
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
  // Constrained single choice → Radix Select. Same props, same values, same onChange contract;
  // the customer portal and the owner area now share one dropdown implementation.
  return (
    // `className` stays on the wrapper: callers use it for grid placement, not to style the control.
    <div className={className}>
      <PremiumSelect
        id={id}
        label={label}
        value={value}
        onChange={onChange}
        options={options}
        hint={description}
        error={error}
        disabled={disabled}
      />
    </div>
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
                'relative overflow-hidden border px-3.5 py-2.5 text-left',
                radius.md, interactiveTokens.transition, focusRing,
                'disabled:cursor-not-allowed disabled:opacity-50',
                active
                  ? 'border-[var(--cq-fg)] bg-[var(--cq-fg)] text-white'
                  : cn(border.hairline, 'bg-[var(--cq-surface)] text-[var(--cq-fg)] hover:border-[var(--cq-border-strong)] hover:bg-[var(--cq-hover)]')
              )}
              aria-pressed={active}
            >
              <span className="block text-[13px] font-medium leading-5">{option.label}</span>
              {option.description ? (
                <span className={cn('mt-0.5 block text-[11.5px] leading-4', active ? 'text-white/70' : 'text-[var(--cq-fg-subtle)]')}>
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

  // Static mount: the save bar appears in response to a user edit, so animating it in adds
  // latency to feedback the user is already waiting for.
  return (
    <div
      className={cn(
        'flex flex-col gap-2.5 border px-3.5 py-2.5 sm:flex-row sm:items-center sm:justify-between',
        radius.lg,
        toneClasses[tone]
      )}
      role="status"
    >
      <p className="text-[13px] font-medium leading-5">{message}</p>
      {actionLabel ? (
        <button
          type="button"
          disabled={actionDisabled}
          aria-busy={loading || undefined}
          onClick={onAction}
          className={cn(
            'inline-flex items-center justify-center gap-1.5 border text-[13px] font-medium',
            control.md, radius.md, interactiveTokens.transition, focusRingOnSurface,
            actionDisabled
              ? 'cursor-not-allowed border-[var(--cq-border)] bg-[var(--cq-sunken)] text-[var(--cq-fg-subtle)]'
              : 'border-[var(--cq-fg)] bg-[var(--cq-fg)] text-white hover:bg-[#22272f]'
          )}
        >
          {loading ? 'Speichert...' : actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export function AppSkeleton({ label }: { label: string }) {
  return (
    <div className={cn(surface.card, space.cardPadding)} role="status" aria-label={label}>
      <div className={cn(skeletonClass, 'h-3 w-24')} />
      <div className="mt-4 space-y-2.5" aria-hidden="true">
        <div className={cn(skeletonClass, 'h-3')} />
        <div className={cn(skeletonClass, 'h-3 w-2/3')} />
      </div>
    </div>
  );
}

export function AppErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className={cn('border border-red-200 bg-red-50 p-4 text-[13px] leading-5 text-red-700', radius.xl)} role="alert">
      <div className="mb-1 flex items-center gap-1.5 font-semibold text-red-800">
        <AlertCircle size={15} aria-hidden="true" />
        Fehlerzustand
      </div>
      {message}
      {onRetry ? (
        <div className="mt-3">
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

/**
 * Route continuity. Opacity-only and short: a 4px slide on every navigation reads as movement
 * for its own sake, and any y-offset shifts the first paint of the page heading.
 */
export function AppRouteTransition({ children, routeKey }: { children: ReactNode; routeKey: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      key={routeKey}
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduceMotion ? 0 : dashDuration.fast / 1000, ease: dashEase }}
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
