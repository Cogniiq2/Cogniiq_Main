import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { CornerDownLeft, Search, type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { border, radius, surface, text, zIndex } from './tokens';

/**
 * ⌘K / Ctrl+K — jump anywhere, start anything.
 *
 * Deliberately honest about what it can do. It offers exactly three kinds of result:
 *
 *   * every destination the navigation rail can reach, filtered by what the current
 *     user may see (the caller passes them in already gated),
 *   * actions that are real routes — "Neues Angebot" opens the composer, it does not
 *     pretend to create anything from here,
 *   * business objects from a real backend read the caller supplies.
 *
 * There is no global server search behind this, so it never advertises one: when the
 * object source is absent or fails, the palette simply has no object group rather than
 * an empty "no results" pretending the search ran.
 *
 * Keyboard is the whole point: ↑/↓ move, Enter opens, Escape closes, and the active
 * option is bound to the input through aria-activedescendant so the combobox is
 * announced correctly rather than merely looking right.
 */

export interface CommandItem {
  id: string;
  label: string;
  /** Second line — what this is, or which record it belongs to. */
  hint?: string;
  group: string;
  to: string;
  icon?: LucideIcon;
  /** Extra text the query matches against but that is not displayed. */
  keywords?: string;
}

export interface CommandPaletteProps {
  items: CommandItem[];
  /**
   * Loads searchable business objects the first time the palette opens. Optional:
   * without it the palette is navigation and actions only, which is a complete and
   * truthful feature rather than a degraded one.
   */
  loadObjects?: () => Promise<CommandItem[]>;
  /** Announced as the dialog's name. */
  label?: string;
}

const MAX_PER_GROUP = 6;

function normalise(value: string): string {
  return value
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');
}

/**
 * Subsequence match over the label, hint and keywords.
 *
 * Typing "refin" finds "Finanzen › Rechnungen" without the owner having to remember
 * the exact wording, and umlauts are folded so "ubersicht" finds "Übersicht".
 */
export function matchCommand(item: CommandItem, query: string): boolean {
  const q = normalise(query.trim());
  if (!q) return true;
  const haystack = normalise([item.label, item.hint, item.group, item.keywords].filter(Boolean).join(' '));
  if (haystack.includes(q)) return true;
  let index = 0;
  for (const char of q) {
    if (char === ' ') continue;
    index = haystack.indexOf(char, index);
    if (index === -1) return false;
    index += 1;
  }
  return true;
}

/** Ranks exact prefix matches above contains, above subsequence. Stable within a tier. */
export function rankCommands(items: CommandItem[], query: string): CommandItem[] {
  const q = normalise(query.trim());
  if (!q) return items;
  const score = (item: CommandItem) => {
    const label = normalise(item.label);
    if (label.startsWith(q)) return 0;
    if (label.includes(q)) return 1;
    if (normalise([item.hint, item.keywords].filter(Boolean).join(' ')).includes(q)) return 2;
    return 3;
  };
  return [...items].sort((a, b) => score(a) - score(b));
}

/**
 * Open state lives in a context so the rail's trigger and the overlay can be mounted in
 * different parts of the shell without either owning the other.
 */
const CommandPaletteContext = createContext<{ open: boolean; setOpen: (open: boolean) => void } | null>(null);

export function useCommandPalette() {
  return useContext(CommandPaletteContext);
}

export function CommandPalette({ items, loadObjects, label = 'Schnellsuche' }: CommandPaletteProps) {
  const context = useCommandPalette();
  const [localOpen, setLocalOpen] = useState(false);
  const open = context ? context.open : localOpen;
  const setOpen = context ? context.setOpen : setLocalOpen;
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [objects, setObjects] = useState<CommandItem[]>([]);
  const [objectsState, setObjectsState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  // The shortcut handler is registered once; this keeps it toggling against the
  // current state without re-binding the listener on every open/close.
  const openRef = useRef(open);
  openRef.current = open;

  // Close on navigation, so opening a result never leaves the overlay behind.
  useEffect(() => { setOpen(false); }, [pathname, setOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen(!openRef.current);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [setOpen]);

  // The object read happens once, on first open — never on every page load, and never
  // on a keystroke. A failure is silent: the palette keeps its navigation and actions.
  useEffect(() => {
    if (!open || !loadObjects || objectsState !== 'idle') return;
    setObjectsState('loading');
    loadObjects()
      .then((loaded) => { setObjects(loaded); setObjectsState('ready'); })
      .catch(() => setObjectsState('error'));
  }, [open, loadObjects, objectsState]);

  useEffect(() => {
    if (!open) { setQuery(''); setActive(0); return; }
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => { cancelAnimationFrame(frame); document.body.style.overflow = overflow; };
  }, [open]);

  const results = useMemo(() => {
    const all = [...items, ...objects];
    const matched = rankCommands(all.filter((item) => matchCommand(item, query)), query);
    const grouped = new Map<string, CommandItem[]>();
    for (const item of matched) {
      const bucket = grouped.get(item.group) ?? [];
      if (bucket.length >= MAX_PER_GROUP) continue;
      bucket.push(item);
      grouped.set(item.group, bucket);
    }
    return [...grouped.entries()].map(([group, groupItems]) => ({ group, items: groupItems }));
  }, [items, objects, query]);

  const flat = useMemo(() => results.flatMap((section) => section.items), [results]);

  useEffect(() => { setActive(0); }, [query]);

  const run = useCallback((item: CommandItem) => {
    setOpen(false);
    navigate(item.to);
  }, [navigate, setOpen]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') { event.preventDefault(); setOpen(false); return; }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((index) => (flat.length ? (index + 1) % flat.length : 0));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((index) => (flat.length ? (index - 1 + flat.length) % flat.length : 0));
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const item = flat[active];
      if (item) run(item);
    }
  };

  // Keep the highlighted option inside the scrolling list.
  useEffect(() => {
    if (!open) return;
    const node = listRef.current?.querySelector(`[data-index="${active}"]`);
    node?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  if (!open) return null;

  const activeId = flat[active] ? `cq-cmd-${flat[active].id}` : undefined;

  return createPortal(
    <div
      data-cq-portal="dashboard"
      className={cn('fixed inset-0 flex items-start justify-center px-4 pt-[12vh]', zIndex.dialog)}
      role="presentation"
    >
      <div
        className="absolute inset-0 bg-[rgba(13,17,23,0.32)] animate-in fade-in duration-fast"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      {/* The key handler sits on the dialog rather than the input: arrows and Enter then
          work while focus is anywhere inside the palette, including immediately after it
          opens and before the input has taken focus. */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onKeyDown={onKeyDown}
        className={cn(
          'relative flex max-h-[70vh] w-full max-w-xl flex-col overflow-hidden rounded-[12px]',
          surface.overlay,
          'animate-in fade-in zoom-in-[0.985] duration-base ease-premium',
        )}
      >
        <div className={cn('flex items-center gap-2.5 px-4', border.hairlineB)}>
          <Search size={16} className="shrink-0 text-[var(--cq-fg-subtle)]" aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            role="combobox"
            aria-expanded="true"
            aria-controls="cq-command-list"
            aria-activedescendant={activeId}
            aria-autocomplete="list"
            aria-label="Befehl oder Ziel suchen"
            placeholder="Suchen: Kunde, Rechnung, Seite …"
            className="h-12 w-full bg-transparent text-[14px] text-[var(--cq-fg)] outline-none placeholder:text-[var(--cq-fg-subtle)]"
          />
          <kbd className={cn('shrink-0 border px-1.5 py-0.5 text-[10px] font-medium text-[var(--cq-fg-subtle)]', radius.sm, border.hairline)}>
            ESC
          </kbd>
        </div>

        <div id="cq-command-list" role="listbox" aria-label={label} ref={listRef} className="min-h-0 flex-1 overflow-y-auto py-2">
          {flat.length === 0 ? (
            <p className="px-4 py-8 text-center text-[13px] leading-5 text-[var(--cq-fg-muted)]">
              Kein Treffer für „{query}". Gesucht wird in der Navigation, den Aktionen
              {objectsState === 'ready' && objects.length > 0 ? ' und Ihren Kunden' : ''}.
            </p>
          ) : (
            results.map((section) => (
              <div key={section.group} className="mb-1 last:mb-0">
                <p className={cn('px-4 py-1.5', text.eyebrow)}>{section.group}</p>
                {section.items.map((item) => {
                  const index = flat.indexOf(item);
                  const isActive = index === active;
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.id}
                      id={`cq-cmd-${item.id}`}
                      data-index={index}
                      role="option"
                      aria-selected={isActive}
                      onMouseEnter={() => setActive(index)}
                      onClick={() => run(item)}
                      className={cn(
                        'mx-2 flex cursor-pointer items-center gap-2.5 px-2 py-2',
                        radius.md,
                        isActive ? 'bg-[var(--cq-accent-weak)]' : 'hover:bg-[var(--cq-hover)]',
                      )}
                    >
                      {Icon ? (
                        <Icon size={15} className={cn('shrink-0', isActive ? 'text-[var(--cq-accent-fg)]' : 'text-[var(--cq-fg-subtle)]')} aria-hidden="true" />
                      ) : null}
                      <span className="min-w-0 flex-1">
                        <span className={cn('block truncate', text.bodyStrong)}>{item.label}</span>
                        {item.hint ? <span className={cn('block truncate', text.hint)}>{item.hint}</span> : null}
                      </span>
                      {isActive ? (
                        <CornerDownLeft size={13} className="shrink-0 text-[var(--cq-accent-fg)]" aria-hidden="true" />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ))
          )}
          {objectsState === 'loading' ? (
            <p className={cn('px-4 py-2', text.hint)} role="status">Kunden werden geladen …</p>
          ) : null}
        </div>

        <div className={cn('flex items-center justify-between gap-3 px-4 py-2', border.hairlineT)}>
          <span className={text.hint}>↑ ↓ blättern · ⏎ öffnen</span>
          <span className={text.hint}>{flat.length} Treffer</span>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/**
 * The rail affordance that tells the owner the palette exists.
 *
 * Renders nothing outside a provider, so a shell without a palette does not grow a
 * button that opens nothing.
 */
export function CommandPaletteTrigger({ collapsed }: { collapsed: boolean }) {
  const context = useCommandPalette();
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
  if (!context) return null;
  return (
    <div className={cn('pt-3', collapsed ? 'px-2.5' : 'px-3')}>
    <button
      type="button"
      onClick={() => context.setOpen(true)}
      aria-label="Schnellsuche öffnen"
      className={cn(
        'flex min-h-[36px] w-full items-center gap-2.5 border border-[var(--cq-border)] bg-[var(--cq-sunken)] text-[12.5px] text-[var(--cq-fg-subtle)]',
        radius.md,
        'transition-colors duration-fast ease-premium hover:border-[var(--cq-border-strong)] hover:text-[var(--cq-fg-muted)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cq-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-white',
        collapsed ? 'justify-center px-0' : 'px-2.5',
      )}
    >
      <Search size={15} aria-hidden="true" className="shrink-0" />
      {collapsed ? null : (
        <>
          <span className="flex-1 text-left">Suchen</span>
          <kbd className="shrink-0 rounded-[4px] border border-[var(--cq-border)] bg-white px-1 py-0.5 text-[10px] font-medium">
            {isMac ? '⌘K' : 'Ctrl K'}
          </kbd>
        </>
      )}
    </button>
    </div>
  );
}

/**
 * Mounts the palette and shares its open state with anything below — the rail's
 * trigger in particular, which lives inside the shell rather than beside the overlay.
 */
export function CommandPaletteProvider({
  items, loadObjects, children,
}: CommandPaletteProps & { children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const value = useMemo(() => ({ open, setOpen }), [open]);
  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
      <CommandPalette items={items} loadObjects={loadObjects} />
    </CommandPaletteContext.Provider>
  );
}
