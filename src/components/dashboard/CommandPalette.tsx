import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { Command as CommandPrimitive } from 'cmdk';
import { CornerDownLeft, Search } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { border, radius, text, zIndex } from './tokens';
import { Kbd } from './primitives';

/**
 * ⌘K command palette for the authenticated surfaces.
 *
 * One palette per shell: the shell provides the command model (navigation, actions, lazily loaded
 * entities) and mounts the provider; pages and the topbar open it via useCommandPalette(). Built on
 * the cmdk + Radix Dialog dependencies already in the project — filtering, arrow-key navigation and
 * Enter-to-select come from cmdk; focus trap, Escape and scroll lock come from Radix.
 */

export interface CommandItem {
  key: string;
  label: string;
  /** Secondary line under the label — org name, offer number, section. */
  hint?: string;
  icon?: LucideIcon;
  /** Extra strings cmdk may match besides the label (number, legal name, synonyms). */
  keywords?: string[];
  /** Navigation target. Either `to` or `run` — `to` wins when both are set. */
  to?: string;
  run?: () => void;
}

export interface CommandGroup {
  id: string;
  label: string;
  items: CommandItem[];
}

interface CommandPaletteContextValue {
  open: () => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null);

export function useCommandPalette(): CommandPaletteContextValue {
  const value = useContext(CommandPaletteContext);
  if (!value) throw new Error('useCommandPalette must be used within a CommandPaletteProvider');
  return value;
}

/** Null outside a provider — for chrome that renders with and without a palette (topbar trigger). */
export function useOptionalCommandPalette(): CommandPaletteContextValue | null {
  return useContext(CommandPaletteContext);
}

export function CommandPaletteProvider({
  groups,
  onOpen,
  children,
}: {
  groups: CommandGroup[];
  /** Fired when the palette opens — the hook for lazily loading entity groups. */
  onOpen?: () => void;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const openPalette = useCallback(() => setOpen(true), []);
  const handleOpenChange = useCallback(
    (next: boolean) => {
      setOpen(next);
      if (next) onOpen?.();
    },
    [onOpen],
  );

  // Global shortcut. ⌘K / Ctrl+K toggles — including from inside inputs, matching every serious
  // dashboard. The browser's own address-bar focus is deliberately overridden here.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((previous) => {
          const next = !previous;
          if (next) onOpen?.();
          return next;
        });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onOpen]);

  const contextValue = useMemo(() => ({ open: openPalette }), [openPalette]);

  return (
    <CommandPaletteContext.Provider value={contextValue}>
      {children}
      <CommandPaletteDialog open={open} onOpenChange={handleOpenChange} groups={groups} />
    </CommandPaletteContext.Provider>
  );
}

function CommandPaletteDialog({
  open,
  onOpenChange,
  groups,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: CommandGroup[];
}) {
  const navigate = useNavigate();

  const runItem = (item: CommandItem) => {
    onOpenChange(false);
    if (item.to) navigate(item.to);
    else item.run?.();
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          data-cq-portal="dashboard"
          className={cn(
            'fixed inset-0 bg-gray-950/25 backdrop-blur-[2px]',
            zIndex.overlay,
            'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
          )}
        />
        <Dialog.Content
          data-cq-portal="dashboard"
          aria-describedby={undefined}
          className={cn(
            'fixed left-1/2 top-[12vh] w-[min(600px,calc(100vw-32px))] -translate-x-1/2',
            'overflow-hidden bg-[var(--cq-surface)] shadow-[var(--cq-elev-3)]',
            border.hairline, radius.xl, zIndex.dialog,
            'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.98]',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-[0.98]',
            'duration-fast ease-premium',
          )}
        >
          <Dialog.Title className="sr-only">Befehlspalette</Dialog.Title>
          <CommandPrimitive
            className="flex w-full flex-col overflow-hidden"
            filter={(value, search, keywords) => {
              const haystack = `${value} ${(keywords ?? []).join(' ')}`.toLowerCase();
              return search
                .toLowerCase()
                .split(/\s+/)
                .every((term) => haystack.includes(term))
                ? 1
                : 0;
            }}
          >
            <div className={cn('flex items-center gap-2.5 px-4', border.hairlineB)}>
              <Search size={15} className="shrink-0 text-[var(--cq-fg-subtle)]" aria-hidden="true" />
              <CommandPrimitive.Input
                autoFocus
                placeholder="Seiten, Kunden und Aktionen suchen …"
                className="h-12 flex-1 bg-transparent text-[13.5px] text-[var(--cq-fg)] outline-none placeholder:text-[var(--cq-fg-subtle)]"
              />
              <Kbd>Esc</Kbd>
            </div>

            <CommandPrimitive.List className="max-h-[min(420px,60vh)] overflow-y-auto overscroll-contain p-1.5">
              <CommandPrimitive.Empty className={cn('px-3 py-10 text-center', text.hint)}>
                Kein Treffer. Andere Suchbegriffe versuchen.
              </CommandPrimitive.Empty>

              {groups
                .filter((group) => group.items.length > 0)
                .map((group) => (
                  <CommandPrimitive.Group
                    key={group.id}
                    heading={group.label}
                    className={cn(
                      '[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2.5',
                      '[&_[cmdk-group-heading]]:text-[10.5px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:uppercase',
                      '[&_[cmdk-group-heading]]:tracking-[0.05em] [&_[cmdk-group-heading]]:text-[var(--cq-fg-subtle)]',
                    )}
                  >
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <CommandPrimitive.Item
                          key={item.key}
                          // cmdk matches on value + keywords; the key keeps duplicate labels distinct.
                          value={`${item.label} ${item.key}`}
                          keywords={item.keywords}
                          onSelect={() => runItem(item)}
                          className={cn(
                            'flex cursor-pointer select-none items-center gap-2.5 px-2.5 py-2 text-[13px] leading-5 outline-none',
                            radius.md,
                            'min-h-9 text-[var(--cq-fg)]',
                            'data-[selected=true]:bg-[var(--cq-hover)]',
                          )}
                        >
                          {Icon ? (
                            <Icon size={15} aria-hidden="true" className="shrink-0 text-[var(--cq-fg-subtle)]" />
                          ) : (
                            <span className="w-[15px] shrink-0" aria-hidden="true" />
                          )}
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium">{item.label}</span>
                            {item.hint ? (
                              <span className="block truncate text-[11.5px] leading-4 text-[var(--cq-fg-subtle)]">
                                {item.hint}
                              </span>
                            ) : null}
                          </span>
                          <CornerDownLeft
                            size={13}
                            aria-hidden="true"
                            className="shrink-0 text-[var(--cq-fg-subtle)] opacity-0 data-[selected=true]:opacity-100 [[data-selected=true]_&]:opacity-100"
                          />
                        </CommandPrimitive.Item>
                      );
                    })}
                  </CommandPrimitive.Group>
                ))}
            </CommandPrimitive.List>

            <div className={cn('flex items-center gap-4 px-4 py-2.5', border.hairlineT, 'bg-[var(--cq-sunken)]')}>
              <span className={cn('flex items-center gap-1.5', text.hint)}>
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd>
                navigieren
              </span>
              <span className={cn('flex items-center gap-1.5', text.hint)}>
                <Kbd>↵</Kbd>
                öffnen
              </span>
            </div>
          </CommandPrimitive>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
