import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, LogOut, Menu, X, type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

// Unified light dashboard shell shared by the Cogniiq admin and owner areas. One Cogniiq header, one
// account/logout control, a top-level app switch and a per-area sub-navigation — so the finance
// module feels native to the admin dashboard rather than a separate application.

export interface ShellSection {
  key: string;
  label: string;
  href: string;
  icon?: LucideIcon;
  /** true when the current location belongs to this top-level section */
  active: boolean;
  /** owner-only sections are marked so callers can gate them; the shell itself renders what it's given */
  ownerOnly?: boolean;
}

export interface ShellSubNavItem {
  key: string;
  label: string;
  href: string;
  icon?: LucideIcon;
}

function AccountMenu() {
  const { profile, user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const email = profile?.email ?? user?.email ?? '—';

  useEffect(() => {
    if (!open) return;
    const onDoc = (event: MouseEvent) => { if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false); };
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const initials = (email[0] ?? 'C').toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex h-9 items-center gap-2 rounded-xl border border-gray-200 bg-white pl-1.5 pr-2.5 text-[13px] font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:text-gray-950"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gray-950 text-[11px] font-bold text-white">{initials}</span>
        <span className="hidden max-w-[160px] truncate sm:inline">{email}</span>
        <ChevronDown size={14} className="text-gray-400" aria-hidden="true" />
      </button>
      {open ? (
        <div role="menu" className="absolute right-0 z-40 mt-2 w-64 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.14)]">
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">Angemeldet als</p>
            <p className="mt-0.5 truncate text-[13px] font-semibold text-gray-950">{email}</p>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => { setOpen(false); void signOut(); }}
            className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-[13px] font-semibold text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-950"
          >
            <LogOut size={15} className="text-gray-400" aria-hidden="true" /> Abmelden
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function DashboardShell({
  sections, subNav, subNavLabel, activeSubKey, title, children,
}: {
  sections: ShellSection[];
  subNav?: ShellSubNavItem[];
  subNavLabel?: string;
  activeSubKey?: (pathname: string, href: string) => boolean;
  title?: string;
  children: ReactNode;
}) {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isSubActive = (href: string) =>
    activeSubKey ? activeSubKey(pathname, href) : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="min-h-screen bg-[#f7f7f4] text-gray-950">
      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-950 shadow-sm">C</span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold tracking-tight text-gray-950">Cogniiq</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">{title ?? 'Dashboard'}</p>
              </div>
            </div>

            {/* Desktop app switch */}
            <nav className="hidden items-center gap-1 lg:flex" aria-label="Bereiche">
              {sections.map((s) => {
                const Icon = s.icon;
                return (
                  <Link
                    key={s.key}
                    to={s.href}
                    aria-current={s.active ? 'page' : undefined}
                    className={cn(
                      'inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-xl px-3 text-[13px] font-semibold transition-colors',
                      s.active ? 'bg-gray-950 text-white' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-950',
                    )}
                  >
                    {Icon ? <Icon size={14} aria-hidden="true" /> : null}
                    {s.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              <AccountMenu />
              <button
                type="button"
                onClick={() => setMobileOpen((o) => !o)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 lg:hidden"
                aria-label="Menü"
                aria-expanded={mobileOpen}
              >
                {mobileOpen ? <X size={17} /> : <Menu size={17} />}
              </button>
            </div>
          </div>

          {/* Desktop sub-nav */}
          {subNav && subNav.length ? (
            <nav className="hidden items-center gap-1 overflow-x-auto lg:flex" aria-label={subNavLabel ?? 'Navigation'}>
              {subNav.map((item) => {
                const active = isSubActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.key}
                    to={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-xl px-3 text-[13px] font-semibold transition-colors',
                      active ? 'bg-gray-100 text-gray-950' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-950',
                    )}
                  >
                    {Icon ? <Icon size={14} aria-hidden="true" /> : null}
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          ) : null}
        </div>

        {/* Mobile menu */}
        {mobileOpen ? (
          <div className="border-t border-gray-100 bg-white px-4 py-4 lg:hidden">
            <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">Bereiche</p>
            <div className="space-y-1">
              {sections.map((s) => {
                const Icon = s.icon;
                return (
                  <Link
                    key={s.key}
                    to={s.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold transition-colors',
                      s.active ? 'bg-gray-950 text-white' : 'text-gray-600 hover:bg-gray-50',
                    )}
                  >
                    {Icon ? <Icon size={15} aria-hidden="true" /> : null}
                    {s.label}
                  </Link>
                );
              })}
            </div>
            {subNav && subNav.length ? (
              <>
                <p className="mb-2 mt-4 px-1 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">{subNavLabel ?? 'Navigation'}</p>
                <div className="grid grid-cols-2 gap-1">
                  {subNav.map((item) => {
                    const active = isSubActive(item.href);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.key}
                        to={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          'flex items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-colors',
                          active ? 'bg-gray-100 text-gray-950' : 'text-gray-600 hover:bg-gray-50',
                        )}
                      >
                        {Icon ? <Icon size={14} aria-hidden="true" /> : null}
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </>
            ) : null}
          </div>
        ) : null}
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
