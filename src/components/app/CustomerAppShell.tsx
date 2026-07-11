import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BookOpen,
  CreditCard,
  ExternalLink,
  Headphones,
  Home,
  LogOut,
  Menu,
  Mic2,
  Phone,
  Settings,
  TestTube2,
  UserRound,
  UserPlus,
  Wand2,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { useOrganizations } from '@/hooks/useOrganizations';

const navItems: Array<{ label: string; href: string; icon: LucideIcon }> = [
  { label: 'Uebersicht', href: '/app', icon: Home },
  { label: 'Onboarding', href: '/app/onboarding', icon: Wand2 },
  { label: 'Rezeptionist', href: '/app/receptionist', icon: Headphones },
  { label: 'Wissensbasis', href: '/app/knowledge', icon: BookOpen },
  { label: 'Telefon', href: '/app/phone', icon: Phone },
  { label: 'Testen', href: '/app/test', icon: TestTube2 },
  { label: 'Anrufe', href: '/app/calls', icon: Mic2 },
  { label: 'Leads', href: '/app/leads', icon: UserPlus },
  { label: 'Abrechnung', href: '/app/billing', icon: CreditCard },
  { label: 'Einstellungen', href: '/app/settings', icon: Settings },
];

function isActivePath(pathname: string, href: string) {
  if (href === '/app') return pathname === '/app';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function CustomerAppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const { profile, user, signOut } = useAuth();
  const { memberships, activeOrganizationId, setActiveOrganizationId } = useOrganizations();
  const hasMultipleOrganizations = memberships.length > 1;
  const activeOrganization = memberships.find((membership) => membership.organization_id === activeOrganizationId);
  const displayName = profile?.full_name || profile?.email || user?.email || 'Konto';

  const handleSignOut = async () => {
    setUserMenuOpen(false);
    setMobileOpen(false);
    await signOut();
  };

  return (
    <div className="min-h-screen bg-[#f7f7f4] text-gray-950">
      <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-4">
            <Link to="/" className="flex min-w-0 items-center gap-3" aria-label="Zur Cogniiq Website">
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-sm font-bold shadow-sm">
                C
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold tracking-tight">Cogniiq</p>
                <p className="truncate text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Kundenbereich</p>
              </div>
            </Link>

            <div className="hidden h-6 w-px bg-gray-200 lg:block" />

            <nav className="hidden items-center gap-1 lg:flex" aria-label="Kundenbereich Navigation">
              {navItems.slice(0, 6).map((item) => (
                <AppNavLink key={item.href} item={item} active={isActivePath(location.pathname, item.href)} />
              ))}
            </nav>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            {hasMultipleOrganizations ? (
              <select
                value={activeOrganizationId ?? ''}
                onChange={(event) => setActiveOrganizationId(event.target.value || null)}
                className="max-w-[220px] rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition-colors focus:border-gray-400"
              >
                {memberships.map((membership) => (
                  <option key={membership.id} value={membership.organization_id}>
                    {membership.organization?.name ?? 'Unbenannte Organisation'}
                  </option>
                ))}
              </select>
            ) : (
              <div className="hidden rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-500 xl:block">
                {activeOrganization?.organization?.name ?? 'Keine Organisation'}
              </div>
            )}

            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-950"
            >
              Zur Website
              <ExternalLink size={13} />
            </Link>

            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen((open) => !open)}
                className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-700 transition-colors hover:border-gray-300 hover:text-gray-950"
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
              >
                <UserRound size={14} className="text-gray-400" />
                <span className="max-w-[160px] truncate text-sm font-medium">{displayName}</span>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.12)]">
                  <div className="border-b border-gray-100 px-4 py-3">
                    <p className="truncate text-sm font-semibold text-gray-950">{displayName}</p>
                    <p className="mt-1 truncate text-xs text-gray-500">{profile?.email ?? user?.email}</p>
                  </div>
                  <div className="p-2">
                    <MenuLink to="/app/settings" icon={Settings} label="Profil & Konto" onClick={() => setUserMenuOpen(false)} />
                    <MenuLink to="/" icon={ExternalLink} label="Zur Website" onClick={() => setUserMenuOpen(false)} />
                    <button
                      type="button"
                      onClick={() => void handleSignOut()}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-950"
                    >
                      <LogOut size={15} className="text-gray-400" />
                      Abmelden
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 md:hidden"
            aria-label="Kundenbereich Navigation"
          >
            {mobileOpen ? <X size={17} /> : <Menu size={17} />}
          </button>
        </div>

        <div className="hidden border-t border-gray-100 bg-white/70 px-4 py-2 lg:block">
          <nav className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto" aria-label="Weitere Kundenbereich Navigation">
            {navItems.slice(6).map((item) => (
              <AppNavLink key={item.href} item={item} active={isActivePath(location.pathname, item.href)} compact />
            ))}
          </nav>
        </div>

        {mobileOpen && (
          <div className="border-t border-gray-100 bg-white px-4 py-4 md:hidden">
            <nav className="space-y-1" aria-label="Mobile Kundenbereich Navigation">
              {navItems.map((item) => (
                <MobileNavLink
                  key={item.href}
                  item={item}
                  active={isActivePath(location.pathname, item.href)}
                  onClick={() => setMobileOpen(false)}
                />
              ))}
            </nav>
            <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
              <p className="truncate text-sm font-semibold text-gray-900">{displayName}</p>
              <p className="mt-1 truncate text-xs text-gray-500">{profile?.email ?? user?.email}</p>
              <p className="mt-2 truncate text-xs font-medium text-gray-500">
                {activeOrganization?.organization?.name ?? 'Keine Organisation'}
              </p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link
                to="/"
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700"
              >
                Zur Website
              </Link>
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700"
              >
                <LogOut size={14} />
                Abmelden
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}

function AppNavLink({
  item,
  active,
  compact = false,
}: {
  item: { label: string; href: string; icon: LucideIcon };
  active: boolean;
  compact?: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      to={item.href}
      className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
        active
          ? 'bg-gray-950 text-white shadow-sm'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-950'
      } ${compact ? 'whitespace-nowrap text-xs' : ''}`}
    >
      <Icon size={14} />
      {item.label}
    </Link>
  );
}

function MobileNavLink({
  item,
  active,
  onClick,
}: {
  item: { label: string; href: string; icon: LucideIcon };
  active: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      to={item.href}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${
        active ? 'bg-gray-950 text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-950'
      }`}
    >
      <Icon size={16} className={active ? 'text-white' : 'text-gray-400'} />
      {item.label}
    </Link>
  );
}

function MenuLink({
  to,
  icon: Icon,
  label,
  onClick,
}: {
  to: string;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-950"
    >
      <Icon size={15} className="text-gray-400" />
      {label}
    </Link>
  );
}
