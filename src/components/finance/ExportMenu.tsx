import { useEffect, useRef, useState } from 'react';
import { Download, FileText, Sheet, Braces, Table2, ChevronDown, Check } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Spinner } from '@/components/dashboard';
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
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);

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

  return (
    <div ref={rootRef} className="relative inline-block">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          'inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:text-gray-950 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950/40 focus-visible:ring-offset-2',
          sizeCls,
        )}
      >
        <Download size={size === 'sm' ? 14 : 15} aria-hidden="true" />
        {label}
        <ChevronDown size={14} className={cn('transition-transform', open && 'rotate-180')} aria-hidden="true" />
      </button>

      {open ? (
        <div
          role="menu"
          className={cn(
            'absolute z-40 mt-2 w-72 overflow-hidden rounded-2xl border border-gray-100 bg-white p-1.5 shadow-[0_24px_70px_rgba(15,23,42,0.14)]',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {modes && modes.length > 0 ? (
            <div className="px-2 pb-2 pt-1.5">
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">Umfang</p>
              <div className="space-y-0.5">
                {modes.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    disabled={m.disabled}
                    onClick={() => setMode(m.value)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-[13px] transition-colors disabled:cursor-not-allowed disabled:opacity-40',
                      mode === m.value ? 'bg-gray-100 text-gray-950' : 'text-gray-600 hover:bg-gray-50',
                    )}
                  >
                    <span className="flex items-center gap-2">
                      {mode === m.value ? <Check size={13} className="text-gray-950" /> : <span className="w-[13px]" />}
                      {m.label}
                    </span>
                    {typeof m.count === 'number' ? <span className="tabular-nums text-[11px] text-gray-400">{m.count}</span> : null}
                  </button>
                ))}
              </div>
              <div className="my-1.5 h-px bg-gray-100" />
            </div>
          ) : null}

          <div className="space-y-0.5">
            {formats.map((f) => {
              const meta = FORMAT_META[f];
              const Icon = meta.icon;
              return (
                <button
                  key={f}
                  type="button"
                  role="menuitem"
                  disabled={busy != null}
                  onClick={() => void run(f)}
                  className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                    {busy === f ? <Spinner className="h-4 w-4" /> : <Icon size={16} aria-hidden="true" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold text-gray-950">{meta.label}</span>
                    <span className="block truncate text-[11.5px] text-gray-400">{meta.hint}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {onIncludeIdsChange ? (
            <>
              <div className="my-1.5 h-px bg-gray-100" />
              <label className="flex cursor-pointer items-center gap-2 px-2.5 py-1.5 text-[12px] text-gray-500">
                <input
                  type="checkbox"
                  checked={includeIds}
                  onChange={(e) => onIncludeIdsChange(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-gray-300 text-gray-900 focus:ring-gray-400"
                />
                Interne IDs einbeziehen (Rohexport)
              </label>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
