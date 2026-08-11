import { forwardRef, useMemo, useState } from 'react';
import * as RadixSelect from '@radix-ui/react-select';
import { Command as CommandPrimitive } from 'cmdk';
import * as Popover from '@radix-ui/react-popover';
import { Check, ChevronDown, ChevronUp, Search } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { border, control, focusRingOnSurface, interactive, radius, text, zIndex } from './tokens';

/**
 * Premium dropdown system for authenticated dashboard surfaces.
 *
 * Built on the Radix + cmdk dependencies already in the project — no new UI library.
 * Everything portals to document.body carrying `data-cq-portal="dashboard"`, so menus are
 * never clipped by cards, sticky table headers or dialog overflow, and still resolve the
 * dashboard tokens outside the scoped shell.
 *
 * Control choice:
 *   PremiumSelect   — constrained single choice (form values, filters, status)
 *   PremiumCombobox — genuinely long/searchable option sets
 *   DropdownMenu    — actions (see ui/dropdown-menu); never form values
 */

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  /** Optional secondary line rendered under the label inside the menu. */
  description?: string;
}

/**
 * Radix forbids an empty-string item value (it reserves "" for the cleared state). Several owner
 * pages legitimately use `{ value: '', label: '— Keine Zuordnung —' }` as a real, selectable
 * option, so "" is bridged to a sentinel inside the control and mapped straight back on change.
 * Callers keep passing and receiving "" exactly as before.
 */
const EMPTY_SENTINEL = '__cq_empty__';
const toInner = (value: string) => (value === '' ? EMPTY_SENTINEL : value);
const toOuter = (value: string) => (value === EMPTY_SENTINEL ? '' : value);

/* ------------------------------------------------------------------ Shared menu surface */

const menuSurface = cn(
  'overflow-hidden bg-[var(--cq-surface)] shadow-[var(--cq-elev-3)]',
  border.hairline,
  radius.lg,
  zIndex.popover,
  // Restrained open/close: opacity + 2px lift + a hair of scale. No bounce, no slide spectacle.
  'data-[state=open]:animate-in data-[state=closed]:animate-out',
  'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
  'data-[state=open]:zoom-in-[0.98] data-[state=closed]:zoom-out-[0.98]',
  'data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1',
  'duration-fast ease-premium',
);

const itemBase = cn(
  'relative flex cursor-pointer select-none items-start gap-2 py-2 pl-8 pr-3 text-[13px] leading-5 outline-none',
  radius.sm,
  'text-[var(--cq-fg)]',
  // Radix Select marks the active row with data-highlighted; cmdk uses data-selected.
  'data-[highlighted]:bg-[var(--cq-hover)] data-[selected=true]:bg-[var(--cq-hover)]',
  'data-[disabled]:pointer-events-none data-[disabled]:opacity-40 data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-40',
  // 36px minimum row so the menu stays comfortably tappable on touch.
  'min-h-9',
);

/* ------------------------------------------------------------------ Trigger */

const triggerBase = cn(
  'inline-flex w-full items-center justify-between gap-2 bg-[var(--cq-surface)] text-left',
  'text-[13px] text-[var(--cq-fg)]',
  border.hairline,
  radius.md,
  control.lg,
  interactive.transition,
  focusRingOnSurface,
  'hover:border-[var(--cq-border-strong)]',
  'data-[state=open]:border-[var(--cq-border-strong)]',
  'data-[placeholder]:text-[var(--cq-fg-subtle)]',
  'disabled:cursor-not-allowed disabled:bg-[var(--cq-sunken)] disabled:text-[var(--cq-fg-subtle)] disabled:hover:border-[var(--cq-border)]',
);

/* ------------------------------------------------------------------ PremiumSelect */

export interface PremiumSelectProps {
  id: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  hint?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  /** Optional leading icon in the trigger. */
  icon?: LucideIcon;
  className?: string;
  /** Render the trigger only, without the label/hint/error wrapper (e.g. inline filters). */
  bare?: boolean;
  'aria-label'?: string;
}

export const PremiumSelect = forwardRef<HTMLButtonElement, PremiumSelectProps>(function PremiumSelect(
  {
    id, label, value, onChange, options, hint, error, disabled, required,
    placeholder = 'Bitte wählen', icon: Icon, className, bare, 'aria-label': ariaLabel,
  },
  ref,
) {
  const hintId = hint && !error ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = errorId ?? hintId;

  const trigger = (
    <RadixSelect.Root
      value={toInner(value)}
      onValueChange={(next) => onChange(toOuter(next))}
      disabled={disabled}
      required={required}
    >
      <RadixSelect.Trigger
        ref={ref}
        id={id}
        aria-label={ariaLabel ?? (label ? undefined : placeholder)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        aria-required={required || undefined}
        className={cn(triggerBase, error && 'border-red-300 hover:border-red-400', className)}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2">
          {Icon ? <Icon size={14} className="shrink-0 text-[var(--cq-fg-subtle)]" aria-hidden="true" /> : null}
          {/* truncate keeps a long label from widening the trigger and shifting the layout */}
          <span className="min-w-0 flex-1 truncate">
            <RadixSelect.Value placeholder={placeholder} />
          </span>
        </span>
        <RadixSelect.Icon asChild>
          <ChevronDown
            size={14}
            aria-hidden="true"
            className="shrink-0 text-[var(--cq-fg-subtle)] transition-transform duration-fast ease-premium motion-reduce:transition-none [[data-state=open]_&]:rotate-180"
          />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>

      <RadixSelect.Portal>
        <RadixSelect.Content
          data-cq-portal="dashboard"
          position="popper"
          sideOffset={6}
          collisionPadding={12}
          className={cn(menuSurface, 'max-h-[min(320px,var(--radix-select-content-available-height))]',
            // Match the menu to the trigger so opening never changes perceived width.
            'w-[var(--radix-select-trigger-width)] min-w-[var(--radix-select-trigger-width)]')}
        >
          <RadixSelect.ScrollUpButton className="flex h-6 items-center justify-center text-[var(--cq-fg-subtle)]">
            <ChevronUp size={13} aria-hidden="true" />
          </RadixSelect.ScrollUpButton>
          <RadixSelect.Viewport className="p-1">
            {options.map((option) => (
              <RadixSelect.Item
                key={option.value}
                value={toInner(option.value)}
                disabled={option.disabled}
                className={itemBase}
              >
                <RadixSelect.ItemIndicator className="absolute left-2 top-2.5">
                  <Check size={14} aria-hidden="true" />
                </RadixSelect.ItemIndicator>
                <span className="min-w-0">
                  <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                  {option.description ? (
                    <span className="mt-0.5 block text-[11.5px] leading-4 text-[var(--cq-fg-subtle)]">
                      {option.description}
                    </span>
                  ) : null}
                </span>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
          <RadixSelect.ScrollDownButton className="flex h-6 items-center justify-center text-[var(--cq-fg-subtle)]">
            <ChevronDown size={13} aria-hidden="true" />
          </RadixSelect.ScrollDownButton>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );

  if (bare) return trigger;

  return (
    <div>
      {label ? (
        <label htmlFor={id} className={cn('mb-1.5 block', text.label)}>
          {label} {required ? <span className="text-red-500" aria-hidden="true">*</span> : null}
        </label>
      ) : null}
      {trigger}
      {hintId ? <p id={hintId} className={cn('mt-1', text.hint)}>{hint}</p> : null}
      {errorId ? <p id={errorId} className="mt-1 text-[12px] leading-4 text-red-600">{error}</p> : null}
    </div>
  );
});

/* ------------------------------------------------------------------ PremiumCombobox */

export interface PremiumComboboxProps extends Omit<PremiumSelectProps, 'icon' | 'bare'> {
  /** Placeholder for the search input inside the menu. */
  searchPlaceholder?: string;
  emptyMessage?: string;
  /** Async option sets: renders a loading row instead of the empty message. */
  loading?: boolean;
}

/**
 * Searchable single-select. Reserved for genuinely long option sets (customers, vendors) where
 * scanning a plain Select would be slow — cmdk gives filtering, arrow-key navigation and
 * Enter-to-select; Popover gives portalling, collision handling and focus restoration.
 */
export function PremiumCombobox({
  id, label, value, onChange, options, hint, error, disabled, required,
  placeholder = 'Bitte wählen', searchPlaceholder = 'Suchen …',
  emptyMessage = 'Kein Eintrag gefunden', loading = false, className,
}: PremiumComboboxProps) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => options.find((o) => o.value === value), [options, value]);

  const hintId = hint && !error ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div>
      {label ? (
        <label htmlFor={id} className={cn('mb-1.5 block', text.label)}>
          {label} {required ? <span className="text-red-500" aria-hidden="true">*</span> : null}
        </label>
      ) : null}

      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger
          id={id}
          disabled={disabled}
          role="combobox"
          aria-expanded={open}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId ?? hintId}
          aria-required={required || undefined}
          className={cn(triggerBase, error && 'border-red-300 hover:border-red-400', className)}
        >
          <span className={cn('min-w-0 flex-1 truncate', !selected && 'text-[var(--cq-fg-subtle)]')}>
            {selected?.label ?? placeholder}
          </span>
          <ChevronDown
            size={14}
            aria-hidden="true"
            className="shrink-0 text-[var(--cq-fg-subtle)] transition-transform duration-fast ease-premium motion-reduce:transition-none data-[state=open]:rotate-180"
            data-state={open ? 'open' : 'closed'}
          />
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            data-cq-portal="dashboard"
            align="start"
            sideOffset={6}
            collisionPadding={12}
            className={cn(menuSurface, 'w-[var(--radix-popover-trigger-width)] p-0')}
          >
            <CommandPrimitive shouldFilter={!loading} className="flex w-full flex-col overflow-hidden">
              <div className={cn('flex items-center gap-2 px-3', border.hairlineB)}>
                <Search size={13} className="shrink-0 text-[var(--cq-fg-subtle)]" aria-hidden="true" />
                <CommandPrimitive.Input
                  placeholder={searchPlaceholder}
                  className="h-9 flex-1 bg-transparent text-[13px] text-[var(--cq-fg)] outline-none placeholder:text-[var(--cq-fg-subtle)]"
                />
              </div>
              <CommandPrimitive.List className="max-h-[280px] overflow-y-auto overscroll-contain p-1">
                {loading ? (
                  <div className={cn('px-3 py-6 text-center', text.hint)}>Wird geladen …</div>
                ) : (
                  <>
                    <CommandPrimitive.Empty className={cn('px-3 py-6 text-center', text.hint)}>
                      {emptyMessage}
                    </CommandPrimitive.Empty>
                    <CommandPrimitive.Group>
                      {options.map((option) => (
                        <CommandPrimitive.Item
                          key={option.value}
                          // cmdk filters on `value`; use the label so typing matches what is read.
                          value={option.label}
                          disabled={option.disabled}
                          onSelect={() => { onChange(option.value); setOpen(false); }}
                          className={itemBase}
                        >
                          {option.value === value ? (
                            <Check size={14} className="absolute left-2 top-2.5" aria-hidden="true" />
                          ) : null}
                          <span className="min-w-0 truncate">{option.label}</span>
                        </CommandPrimitive.Item>
                      ))}
                    </CommandPrimitive.Group>
                  </>
                )}
              </CommandPrimitive.List>
            </CommandPrimitive>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      {hintId ? <p id={hintId} className={cn('mt-1', text.hint)}>{hint}</p> : null}
      {errorId ? <p id={errorId} className="mt-1 text-[12px] leading-4 text-red-600">{error}</p> : null}
    </div>
  );
}

