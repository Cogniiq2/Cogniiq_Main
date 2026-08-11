import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronsUpDown, LogOut, type LucideIcon } from 'lucide-react';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// The account block that sits at the foot of both navigation rails. One visual language, one
// interaction model; each surface supplies its own menu entries and sign-out handler.

export interface RailAccountLink {
  key: string;
  label: string;
  to: string;
  icon: LucideIcon;
}

export function RailAccount({
  collapsed,
  name,
  email,
  context,
  links,
  onSignOut,
  withTooltip = false,
}: {
  collapsed: boolean;
  name: string;
  email?: string | null;
  /** Optional third line, e.g. the active organization. */
  context?: string | null;
  links: RailAccountLink[];
  onSignOut: () => void;
  withTooltip?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  // Collapsing the rail must not leave an orphaned popover floating beside a 76px column.
  useEffect(() => {
    setOpen(false);
  }, [collapsed]);

  const initials = (name.trim()[0] ?? email?.[0] ?? 'C').toUpperCase();

  const trigger = (
    <button
      type="button"
      onClick={() => setOpen((value) => !value)}
      aria-haspopup="menu"
      aria-expanded={open}
      aria-label={collapsed ? `Konto: ${name}` : undefined}
      className={cn(
        'flex min-h-[44px] w-full items-center rounded-xl text-left outline-none',
        'transition-colors duration-150 hover:bg-gray-100/70 active:bg-gray-200/60',
        'focus-visible:ring-2 focus-visible:ring-gray-950/25 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
        collapsed ? 'justify-center px-0' : 'gap-2.5 px-2',
      )}
    >
      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-[12px] font-bold text-gray-950">
        {initials}
      </span>
      {collapsed ? null : (
        <>
          <span className="min-w-0 flex-1 overflow-hidden">
            <span className="block truncate text-[12.5px] font-semibold text-gray-950">{name}</span>
            {email ? <span className="block truncate text-[11px] text-gray-400">{email}</span> : null}
          </span>
          <ChevronsUpDown size={14} className="flex-shrink-0 text-gray-400" aria-hidden="true" />
        </>
      )}
    </button>
  );

  return (
    <div className={cn('relative p-2', collapsed && 'px-2.5')} ref={ref}>
      {withTooltip && collapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>{trigger}</TooltipTrigger>
          <TooltipContent side="right" sideOffset={10} className="bg-gray-950 text-[12px] font-medium text-white">
            {name}
          </TooltipContent>
        </Tooltip>
      ) : (
        trigger
      )}

      {open ? (
        <div
          role="menu"
          className="absolute bottom-[calc(100%-4px)] left-2 right-2 z-50 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.14)]"
        >
          <div className="border-b border-gray-100 px-3.5 py-3">
            <p className="truncate text-[12.5px] font-semibold text-gray-950">{name}</p>
            {email ? <p className="mt-0.5 truncate text-[11px] text-gray-500">{email}</p> : null}
            {context ? <p className="mt-1.5 truncate text-[10.5px] font-medium text-gray-400">{context}</p> : null}
          </div>
          <div className="p-1.5">
            {links.map((link) => (
              <MenuRow key={link.key} icon={link.icon}>
                <Link
                  to={link.to}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex-1 truncate outline-none"
                >
                  {link.label}
                </Link>
              </MenuRow>
            ))}
            <MenuRow icon={LogOut}>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onSignOut();
                }}
                className="flex-1 truncate text-left outline-none"
              >
                Abmelden
              </button>
            </MenuRow>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MenuRow({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12.5px] font-medium text-gray-600 transition-colors duration-150 hover:bg-gray-50 hover:text-gray-950 focus-within:bg-gray-50 focus-within:text-gray-950">
      <Icon size={15} className="flex-shrink-0 text-gray-400" aria-hidden="true" />
      {children}
    </div>
  );
}
