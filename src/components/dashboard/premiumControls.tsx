import { Fragment, useId, useMemo, useState, type ReactNode } from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { Command as CommandPrimitive } from 'cmdk';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

// Premium selection primitives for the Owner Dashboard and the Customer Portal.
//
// These exist because a native <select> renders the operating system's own widget: a
// browser-default arrow, an OS-drawn option list, no way to show a selected checkmark,
// group headings or a description, and no way to make the option rows meet the 44px touch
// target on mobile. Three of the four visible native selects in the product were shared
// primitives, so replacing the primitive upgrades every call site at once without any
// call-site API change.
//
// Design rules encoded here so no consumer re-decides them:
//   - one control chrome, matching Field/Textarea in primitives.tsx (rounded-control =
//     12px, hairline border, no black box, no browser arrow);
//   - depth by hairline plus shadow-panel, never by a gradient or a glass effect;
//   - the selected row gets a restrained tint and a checkmark, not a filled pill;
//   - motion is opacity + 4px translate + a 0.98 scale, 140-180ms, chevron rotation only;
//   - every overlay is portalled with data-cq-surface="overlay" so it inherits the product
//     tokens AND the prefers-reduced-motion rules in index.css, which are scoped to
//     [data-cq-surface] and would otherwise not reach a body-level portal;
//   - option rows are min-h-11 (44px) so a touch target is never below the mobile minimum;
//   - long options truncate visually but keep their full accessible name via aria-label.
//
// Behaviour is deliberately conservative: values, option order, disabled conditions and
// change callbacks pass straight through. Nothing here validates, transforms or filters.

/* ------------------------------------------------------------------ shared recipes */

const controlChrome =
  'w-full rounded-control border bg-white text-sm text-gray-900 outline-none transition-colors duration-fast ease-premium disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500';
const controlIdle = 'border-gray-200 hover:border-gray-300 data-[state=open]:border-gray-400';
const controlInvalid = 'border-red-300 data-[state=open]:border-red-400';

const overlayFocusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950/25 focus-visible:ring-offset-2 focus-visible:ring-offset-white';

/**
 * Floating surface shared by the select list, the combobox popover and the action menu.
 * Exported so richer one-off menus (the finance Export Center) can build directly on the
 * Radix primitives without re-inventing the chrome.
 */
export const premiumOverlaySurface =
  'z-50 overflow-hidden rounded-card border border-hairline bg-white shadow-panel';

/**
 * Entrance/exit motion for a Radix overlay. Radix stamps data-state and data-side, so the
 * whole thing is CSS — no AnimatePresence, no JS on the open path, nothing that can delay
 * the first paint of the menu. tailwindcss-animate supplies the keyframes.
 */
export const premiumOverlayMotion = cn(
  'data-[state=open]:animate-in data-[state=closed]:animate-out',
  'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
  'data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95',
  'data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1',
  'data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1',
  'duration-150',
);

/** One option row treatment: 44px touch target, restrained selected tint, no pill. */
export const premiumMenuItemRow = cn(
  'relative flex min-h-11 w-full cursor-pointer select-none items-center gap-2.5 rounded-control py-2 pl-3 pr-9 text-sm text-gray-700 outline-none',
  'transition-colors duration-fast ease-premium',
  'data-[highlighted]:bg-gray-100/80 data-[highlighted]:text-gray-950',
  'data-[state=checked]:bg-gray-950/[0.045] data-[state=checked]:font-semibold data-[state=checked]:text-gray-950',
  'data-[selected=true]:bg-gray-100/80 data-[selected=true]:text-gray-950',
  'data-[disabled]:pointer-events-none data-[disabled]:opacity-45',
  'aria-disabled:pointer-events-none aria-disabled:opacity-45',
);

const fieldLabelClass = 'mb-1.5 block text-[12px] font-semibold text-gray-700';
const fieldHintClass = 'mt-1.5 text-[11.5px] leading-4 text-gray-500';
const fieldErrorClass = 'mt-1.5 text-[12px] leading-4 text-red-600';

/**
 * Radix Select forbids an item whose value is the empty string, because "" is how it
 * represents "nothing selected". The product uses `{ value: '', label: '— Kein Kunde —' }`
 * as a real, selectable option in a dozen places, so empty string is mapped to a private
 * sentinel on the way in and mapped straight back on the way out. Consumers never see it:
 * the value they pass in and the value handed to onValueChange are byte-identical.
 */
const EMPTY_VALUE = '__cq_empty__';
const toInternal = (value: string) => (value === '' ? EMPTY_VALUE : value);
const fromInternal = (value: string) => (value === EMPTY_VALUE ? '' : value);

/* ------------------------------------------------------------------ PremiumSelect */

export interface PremiumSelectOption {
  value: string;
  label: string;
  /** Secondary line rendered under the label inside the list (not in the trigger). */
  description?: string;
  disabled?: boolean;
  icon?: LucideIcon;
}

export interface PremiumSelectGroup {
  /** Omit for an ungrouped block; a separator is drawn between every group. */
  label?: string;
  options: PremiumSelectOption[];
}

export interface PremiumSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  /** Flat options. Mutually exclusive with `groups`; option order is preserved verbatim. */
  options?: PremiumSelectOption[];
  /** Grouped options with headings and separators. */
  groups?: PremiumSelectGroup[];
  id?: string;
  label?: ReactNode;
  /** Helper text under the control. Suppressed while an error is shown. */
  description?: string;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  /**
   * When set, Radix renders a hidden native <select> carrying this name so the control
   * participates in native form submission and in React Hook Form's uncontrolled path.
   * This is the only native select that may remain, and it is never the visible interface.
   */
  name?: string;
  className?: string;
  triggerClassName?: string;
  /** Accessible name when no visible `label` is rendered (toolbar filters). */
  ariaLabel?: string;
  contentClassName?: string;
}

export function PremiumSelect({
  value,
  onValueChange,
  options,
  groups,
  id,
  label,
  description,
  error,
  placeholder,
  disabled = false,
  required = false,
  name,
  className,
  triggerClassName,
  ariaLabel,
  contentClassName,
}: PremiumSelectProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const describedBy = error ? `${controlId}-error` : description ? `${controlId}-hint` : undefined;

  const resolvedGroups: PremiumSelectGroup[] = useMemo(
    () => (groups && groups.length > 0 ? groups : [{ options: options ?? [] }]),
    [groups, options],
  );

  return (
    <div className={className}>
      {label ? (
        <label htmlFor={controlId} className={fieldLabelClass}>
          {label} {required ? <span className="text-red-500">*</span> : null}
        </label>
      ) : null}

      <SelectPrimitive.Root
        value={toInternal(value)}
        onValueChange={(next) => onValueChange(fromInternal(next))}
        disabled={disabled}
        required={required}
        name={name}
      >
        <SelectPrimitive.Trigger
          id={controlId}
          aria-label={label ? undefined : ariaLabel}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            controlChrome,
            error ? controlInvalid : controlIdle,
            'group flex h-11 items-center justify-between gap-2 px-3 text-left',
            overlayFocusRing,
            'focus-visible:ring-offset-canvas',
            triggerClassName,
          )}
        >
          {/*
            The truncation lives on a wrapper, not on Select.Value. Radix renders Value as a
            bare span whose parent is the trigger's flex row; `truncate` on the Value itself
            has no flex basis to shrink against, so a long German organisation name (the
            kind with a legal form and a place name in it) escaped the control and painted
            over the control beside it in the portal topbar. The accessible name is
            unaffected — this is purely a box for the text to be clipped inside.
          */}
          <span className="min-w-0 flex-1 overflow-hidden truncate whitespace-nowrap">
            <SelectPrimitive.Value
              placeholder={<span className="text-gray-400">{placeholder ?? 'Bitte wählen'}</span>}
            />
          </span>
          <SelectPrimitive.Icon asChild>
            <ChevronDown
              size={15}
              aria-hidden="true"
              className="shrink-0 text-gray-400 transition-transform duration-fast ease-premium group-data-[state=open]:rotate-180 motion-reduce:transition-none"
            />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            data-cq-surface="overlay"
            position="popper"
            sideOffset={6}
            collisionPadding={12}
            className={cn(
              premiumOverlaySurface,
              premiumOverlayMotion,
              'max-h-[min(22rem,var(--radix-select-content-available-height))] w-[var(--radix-select-trigger-width)] min-w-[11rem]',
              contentClassName,
            )}
          >
            <SelectPrimitive.ScrollUpButton className="flex h-6 items-center justify-center bg-gradient-to-b from-white text-gray-400" />
            <SelectPrimitive.Viewport className="p-1.5">
              {resolvedGroups.map((group, groupIndex) => (
                <Fragment key={group.label ?? `group-${groupIndex}`}>
                  {groupIndex > 0 ? (
                    <SelectPrimitive.Separator className="my-1.5 h-px bg-hairline" />
                  ) : null}
                  <SelectPrimitive.Group>
                    {group.label ? (
                      <SelectPrimitive.Label className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                        {group.label}
                      </SelectPrimitive.Label>
                    ) : null}
                    {group.options.map((option) => (
                      <SelectPrimitive.Item
                        key={option.value}
                        value={toInternal(option.value)}
                        disabled={option.disabled}
                        className={premiumMenuItemRow}
                      >
                        {option.icon ? (
                          <option.icon size={15} className="shrink-0 text-gray-400" aria-hidden="true" />
                        ) : null}
                        <span className="min-w-0 flex-1">
                          <SelectPrimitive.ItemText>
                            <span className="block truncate">{option.label}</span>
                          </SelectPrimitive.ItemText>
                          {option.description ? (
                            <span className="mt-0.5 block truncate text-[11.5px] font-normal text-gray-500">
                              {option.description}
                            </span>
                          ) : null}
                        </span>
                        <SelectPrimitive.ItemIndicator className="absolute right-3 flex items-center">
                          <Check size={15} className="text-gray-950" aria-hidden="true" />
                        </SelectPrimitive.ItemIndicator>
                      </SelectPrimitive.Item>
                    ))}
                  </SelectPrimitive.Group>
                </Fragment>
              ))}
            </SelectPrimitive.Viewport>
            <SelectPrimitive.ScrollDownButton className="flex h-6 items-center justify-center bg-gradient-to-t from-white text-gray-400" />
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>

      {description && !error ? (
        <p id={`${controlId}-hint`} className={fieldHintClass}>
          {description}
        </p>
      ) : null}
      {error ? (
        <p id={`${controlId}-error`} className={fieldErrorClass}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ PremiumCombobox */

export interface PremiumComboboxOption {
  value: string;
  label: string;
  /** Extra text matched by the search box but rendered as a muted second line. */
  description?: string;
  /** Additional terms to match on (customer number, invoice number) without rendering them. */
  keywords?: string[];
  disabled?: boolean;
}

export interface PremiumComboboxProps {
  value: string;
  onValueChange: (value: string) => void;
  options: PremiumComboboxOption[];
  id?: string;
  label?: ReactNode;
  description?: string;
  error?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  /** Rendered when the search matches nothing. Should name the real next action. */
  emptyMessage?: string;
  disabled?: boolean;
  required?: boolean;
  /**
   * Show a clear ("×") affordance. Only pass this where the underlying field genuinely
   * permits an empty value — clearing sets the value to ''. Defaults to false so a
   * required field can never be emptied through the UI.
   */
  clearable?: boolean;
  className?: string;
  triggerClassName?: string;
  ariaLabel?: string;
}

/**
 * A searchable single-select for long entity lists — customers, projects, invoices,
 * documents. Popover + cmdk rather than Radix Select, because a 300-row customer list is
 * unusable without a filter box. Selection semantics are identical to PremiumSelect: one
 * value in, one value out, no validation of its own.
 */
export function PremiumCombobox({
  value,
  onValueChange,
  options,
  id,
  label,
  description,
  error,
  placeholder,
  searchPlaceholder = 'Suchen …',
  emptyMessage = 'Kein Eintrag gefunden.',
  disabled = false,
  required = false,
  clearable = false,
  className,
  triggerClassName,
  ariaLabel,
}: PremiumComboboxProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);
  const describedBy = error ? `${controlId}-error` : description ? `${controlId}-hint` : undefined;

  return (
    <div className={className}>
      {label ? (
        <label htmlFor={controlId} className={fieldLabelClass}>
          {label} {required ? <span className="text-red-500">*</span> : null}
        </label>
      ) : null}

      <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
        <PopoverPrimitive.Trigger asChild>
          <button
            type="button"
            id={controlId}
            role="combobox"
            aria-expanded={open}
            aria-label={label ? undefined : ariaLabel}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            disabled={disabled}
            className={cn(
              controlChrome,
              error ? controlInvalid : controlIdle,
              'group flex h-11 items-center justify-between gap-2 px-3 text-left',
              overlayFocusRing,
              'focus-visible:ring-offset-canvas',
              triggerClassName,
            )}
          >
            <span className={cn('min-w-0 flex-1 truncate', !selected && 'text-gray-400')}>
              {selected?.label ?? placeholder ?? 'Bitte wählen'}
            </span>
            {clearable && selected ? (
              <span
                role="button"
                tabIndex={-1}
                aria-label="Auswahl entfernen"
                onPointerDown={(event) => {
                  // Stop the popover trigger from opening on the same gesture.
                  event.preventDefault();
                  event.stopPropagation();
                  onValueChange('');
                }}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors duration-fast ease-premium hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={13} aria-hidden="true" />
              </span>
            ) : null}
            <ChevronDown
              size={15}
              aria-hidden="true"
              className="shrink-0 text-gray-400 transition-transform duration-fast ease-premium group-data-[state=open]:rotate-180 motion-reduce:transition-none"
            />
          </button>
        </PopoverPrimitive.Trigger>

        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            data-cq-surface="overlay"
            align="start"
            sideOffset={6}
            collisionPadding={12}
            className={cn(
              premiumOverlaySurface,
              premiumOverlayMotion,
              'w-[var(--radix-popover-trigger-width)] min-w-[14rem] p-0',
            )}
          >
            <CommandPrimitive
              // cmdk's own filter, extended so `keywords` and `description` are searchable
              // without being rendered as part of the label.
              filter={(itemValue, search) => {
                const option = options.find((candidate) => candidate.value === itemValue);
                if (!option) return 0;
                const haystack = [option.label, option.description ?? '', ...(option.keywords ?? [])]
                  .join(' ')
                  .toLowerCase();
                return haystack.includes(search.toLowerCase()) ? 1 : 0;
              }}
            >
              <div className="flex items-center gap-2 border-b border-hairline px-3">
                <Search size={14} className="shrink-0 text-gray-400" aria-hidden="true" />
                <CommandPrimitive.Input
                  placeholder={searchPlaceholder}
                  className="h-11 w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                />
              </div>
              <CommandPrimitive.List className="max-h-[min(18rem,var(--radix-popover-content-available-height))] overflow-y-auto overscroll-contain p-1.5">
                <CommandPrimitive.Empty className="px-3 py-6 text-center text-[13px] text-gray-500">
                  {emptyMessage}
                </CommandPrimitive.Empty>
                {options.map((option) => (
                  <CommandPrimitive.Item
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                    onSelect={(next) => {
                      onValueChange(next);
                      setOpen(false);
                    }}
                    className={premiumMenuItemRow}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{option.label}</span>
                      {option.description ? (
                        <span className="mt-0.5 block truncate text-[11.5px] font-normal text-gray-500">
                          {option.description}
                        </span>
                      ) : null}
                    </span>
                    {option.value === value ? (
                      <Check size={15} className="absolute right-3 text-gray-950" aria-hidden="true" />
                    ) : null}
                  </CommandPrimitive.Item>
                ))}
              </CommandPrimitive.List>
            </CommandPrimitive>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>

      {description && !error ? (
        <p id={`${controlId}-hint`} className={fieldHintClass}>
          {description}
        </p>
      ) : null}
      {error ? (
        <p id={`${controlId}-error`} className={fieldErrorClass}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ PremiumDropdownMenu */

export interface PremiumMenuItem {
  key: string;
  label: string;
  onSelect?: () => void;
  icon?: LucideIcon;
  /** Muted second line — also the place to explain WHY an item is disabled. */
  description?: string;
  disabled?: boolean;
  destructive?: boolean;
  /** Trailing text: a count, a shortcut, a format hint. */
  meta?: string;
}

export interface PremiumMenuGroup {
  label?: string;
  items: PremiumMenuItem[];
}

export interface PremiumDropdownMenuProps {
  /** The control that opens the menu. Rendered via asChild, so it keeps its own styling. */
  trigger: ReactNode;
  groups: PremiumMenuGroup[];
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * An action menu. Radix Dropdown Menu handles the parts a hand-rolled menu usually gets
 * wrong: focus moves into the menu on open and returns to the trigger on close, Escape and
 * outside-click both close it, arrow keys and typeahead work, and the menu is portalled so
 * it cannot be clipped by an ancestor's overflow or out-ranked by a dialog's z-index.
 */
export function PremiumDropdownMenu({
  trigger,
  groups,
  align = 'end',
  side = 'bottom',
  className,
  open,
  onOpenChange,
}: PremiumDropdownMenuProps) {
  return (
    // modal={false}: an action menu is not a dialog. Modal mode locks body scroll and lays a
    // pointer-events blocker over the page, so opening a row menu in a long finance table
    // froze the scroll position and swallowed the next click. Radix still handles Escape,
    // outside-click dismissal and focus return without it.
    <DropdownMenuPrimitive.Root modal={false} open={open} onOpenChange={onOpenChange}>
      <DropdownMenuPrimitive.Trigger asChild>{trigger}</DropdownMenuPrimitive.Trigger>
      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          data-cq-surface="overlay"
          align={align}
          side={side}
          sideOffset={6}
          collisionPadding={12}
          className={cn(
            premiumOverlaySurface,
            premiumOverlayMotion,
            'min-w-[13rem] max-w-[min(20rem,calc(100vw-1.5rem))] p-1.5',
            className,
          )}
        >
          {groups.map((group, groupIndex) => (
            <Fragment key={group.label ?? `group-${groupIndex}`}>
              {groupIndex > 0 ? (
                <DropdownMenuPrimitive.Separator className="my-1.5 h-px bg-hairline" />
              ) : null}
              <DropdownMenuPrimitive.Group>
                {group.label ? (
                  <DropdownMenuPrimitive.Label className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                    {group.label}
                  </DropdownMenuPrimitive.Label>
                ) : null}
                {group.items.map((item) => (
                  <DropdownMenuPrimitive.Item
                    key={item.key}
                    disabled={item.disabled}
                    onSelect={item.onSelect}
                    className={cn(
                      premiumMenuItemRow,
                      'pr-3',
                      item.destructive &&
                        'text-red-600 data-[highlighted]:bg-red-50 data-[highlighted]:text-red-700',
                    )}
                  >
                    {item.icon ? (
                      <item.icon
                        size={15}
                        aria-hidden="true"
                        className={cn('shrink-0', item.destructive ? 'text-red-400' : 'text-gray-400')}
                      />
                    ) : null}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{item.label}</span>
                      {item.description ? (
                        <span className="mt-0.5 block text-[11.5px] font-normal leading-4 text-gray-500">
                          {item.description}
                        </span>
                      ) : null}
                    </span>
                    {item.meta ? (
                      <span className="shrink-0 text-[11px] font-medium text-gray-400">{item.meta}</span>
                    ) : null}
                  </DropdownMenuPrimitive.Item>
                ))}
              </DropdownMenuPrimitive.Group>
            </Fragment>
          ))}
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
}
