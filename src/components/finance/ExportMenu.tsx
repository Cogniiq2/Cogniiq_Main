import { useState } from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { Download, FileText, Sheet, Braces, Table2, ChevronDown, Check } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Spinner } from '@/components/dashboard';
import {
  premiumMenuItemRow,
  premiumOverlayMotion,
  premiumOverlaySurface,
} from '@/components/dashboard/premiumControls';
import type { ExportFormat, ExportMode } from '@/lib/ownerFinance/exports';

// Reusable Export Center menu. Presents the available formats (PDF / CSV / XLSX / JSON) and an
// optional export-mode selector (current view / selected rows / complete dataset). It is purely a
// presentation + orchestration shell: the page supplies an async `onExport(format, mode)` handler
// that builds and downloads the file and records the owner_exports audit entry. Formats the page
// cannot produce are simply omitted. Styled to match the premium light dashboard (white surface,
// graphite type, soft shadow, grouped menu rather than a row of always-visible buttons).

export interface ExportModeOption {
  value: ExportMode;
  label: string;
  /** Optional count shown next to the option (e.g. selected rows). */
  count?: number;
  disabled?: boolean;
}

export interface ExportMenuProps {
  onExport: (format: ExportFormat, mode: ExportMode) => void | Promise<void>;
  /** Which formats to offer, in display order. Default: pdf, csv, xlsx. */
  formats?: ExportFormat[];
  /** Optional export modes. When omitted, exports run with mode 'current'. */
  modes?: ExportModeOption[];
  /** Advanced toggle: include internal IDs in tabular exports. */
  onIncludeIdsChange?: (includeIds: boolean) => void;
  includeIds?: boolean;
  label?: string;
  size?: 'sm' | 'md';
  disabled?: boolean;
  align?: 'left' | 'right';
}

const FORMAT_META: Record<ExportFormat, { label: string; hint: string; icon: typeof FileText }> = {
  pdf: { label: 'PDF-Bericht', hint: 'Selektierbarer Text, Cogniiq-Branding', icon: FileText },
  xlsx: { label: 'Excel (XLSX)', hint: 'Typisierte Zahlen, Datumsangaben, Filter', icon: Sheet },
  csv: { label: 'CSV', hint: 'UTF-8, Semikolon, Excel-kompatibel', icon: Table2 },
  json: { label: 'JSON', hint: 'Maschinenlesbar (roh)', icon: Braces },
};

export function ExportMenu({
  onExport,
  formats = ['pdf', 'csv', 'xlsx'],
  modes,
  onIncludeIdsChange,
  includeIds = false,
  label = 'Exportieren',
  size = 'sm',
  disabled = false,
  align = 'right',
}: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<ExportFormat | null>(null);
  const [mode, setMode] = useState<ExportMode>(modes?.[0]?.value ?? 'current');

  const run = async (format: ExportFormat) => {
    setBusy(format);
    try {
      await onExport(format, mode);
      setOpen(false);
    } finally {
      setBusy(null);
    }
  };

  const sizeCls = size === 'sm' ? 'h-9 px-3 text-[13px]' : 'h-11 px-4 text-[13.5px]';

  // Built directly on the Radix menu primitives rather than PremiumDropdownMenu: the Export
  // Center is a composite menu (a scope radio group, then the format actions, then an
  // advanced toggle) rather than a flat action list. It shares the chrome, the motion and
  // the row treatment with every other menu in the product, and it now inherits Radix's
  // focus return, Escape handling, typeahead and portalling — the previous version listened
  // on the document and could be clipped by an ancestor's overflow inside a dialog.
  return (
    <DropdownMenuPrimitive.Root open={open} onOpenChange={setOpen}>
      <DropdownMenuPrimitive.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'group inline-flex items-center gap-2 rounded-control border border-gray-200 bg-white font-semibold text-gray-700',
            'transition-colors duration-fast ease-premium hover:border-gray-300 hover:text-gray-950',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950/25 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
            sizeCls,
          )}
        >
          <Download size={size === 'sm' ? 14 : 15} aria-hidden="true" />
          {label}
          <ChevronDown
            size={14}
            aria-hidden="true"
            className="text-gray-400 transition-transform duration-fast ease-premium group-data-[state=open]:rotate-180 motion-reduce:transition-none"
          />
        </button>
      </DropdownMenuPrimitive.Trigger>

      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          data-cq-surface="overlay"
          align={align === 'right' ? 'end' : 'start'}
          sideOffset={6}
          collisionPadding={12}
          className={cn(premiumOverlaySurface, premiumOverlayMotion, 'w-72 max-w-[calc(100vw-1.5rem)] p-1.5')}
        >
          {modes && modes.length > 0 ? (
            <>
              <DropdownMenuPrimitive.Label className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                Umfang
              </DropdownMenuPrimitive.Label>
              <DropdownMenuPrimitive.RadioGroup
                value={mode}
                onValueChange={(next) => setMode(next as ExportMode)}
              >
                {modes.map((m) => (
                  <DropdownMenuPrimitive.RadioItem
                    key={m.value}
                    value={m.value}
                    disabled={m.disabled}
                    // The scope is a persistent setting, not an action: keep the menu open.
                    onSelect={(event) => event.preventDefault()}
                    className={cn(premiumMenuItemRow, 'min-h-10 py-1.5')}
                  >
                    <span className="flex w-[15px] shrink-0 items-center justify-center">
                      <DropdownMenuPrimitive.ItemIndicator>
                        <Check size={14} className="text-gray-950" aria-hidden="true" />
                      </DropdownMenuPrimitive.ItemIndicator>
                    </span>
                    <span className="min-w-0 flex-1 truncate">{m.label}</span>
                    {typeof m.count === 'number' ? (
                      <span className="shrink-0 tabular-nums text-[11px] text-gray-400">{m.count}</span>
                    ) : null}
                  </DropdownMenuPrimitive.RadioItem>
                ))}
              </DropdownMenuPrimitive.RadioGroup>
              <DropdownMenuPrimitive.Separator className="my-1.5 h-px bg-hairline" />
            </>
          ) : null}

          <DropdownMenuPrimitive.Group>
            {formats.map((f) => {
              const meta = FORMAT_META[f];
              const Icon = meta.icon;
              return (
                <DropdownMenuPrimitive.Item
                  key={f}
                  disabled={busy != null}
                  // The export is async and the menu closes itself in `run` once the file has
                  // been produced, so the default close-on-select is suppressed.
                  onSelect={(event) => { event.preventDefault(); void run(f); }}
                  className={cn(premiumMenuItemRow, 'pr-3')}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-gray-100 text-gray-600">
                    {busy === f ? <Spinner className="h-4 w-4" /> : <Icon size={16} aria-hidden="true" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-semibold text-gray-950">{meta.label}</span>
                    <span className="block truncate text-[11.5px] font-normal text-gray-500">{meta.hint}</span>
                  </span>
                </DropdownMenuPrimitive.Item>
              );
            })}
          </DropdownMenuPrimitive.Group>

          {onIncludeIdsChange ? (
            <>
              <DropdownMenuPrimitive.Separator className="my-1.5 h-px bg-hairline" />
              <DropdownMenuPrimitive.CheckboxItem
                checked={includeIds}
                onCheckedChange={onIncludeIdsChange}
                onSelect={(event) => event.preventDefault()}
                className={cn(premiumMenuItemRow, 'min-h-10 py-1.5 text-[12px] text-gray-500')}
              >
                <span className="flex w-[15px] shrink-0 items-center justify-center">
                  <DropdownMenuPrimitive.ItemIndicator>
                    <Check size={14} className="text-gray-950" aria-hidden="true" />
                  </DropdownMenuPrimitive.ItemIndicator>
                </span>
                Interne IDs einbeziehen (Rohexport)
              </DropdownMenuPrimitive.CheckboxItem>
            </>
          ) : null}
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
}
