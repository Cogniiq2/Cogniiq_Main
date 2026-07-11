import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BookOpen,
  ChevronDown,
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

import { AppStatusBadge } from '@/components/app/CustomerAppPrimitives';
import { defaultLifecycleState, lifecycleDisplays } from '@/components/app/customerPortalModel';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganizations } from '@/hooks/useOrganizations';
import { cn } from '@/lib/utils';

type CustomerNavGroup = 'setup' | 'operate' | 'account';

interface CustomerNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  group: CustomerNavGroup;
}

const navItems: CustomerNavItem[] = [
  { label: 'Uebersicht', href: '/app', icon: Home, group: 'setup' },
  { label: 'Einrichtung', href: '/app/onboarding', icon: Wand2, group: 'setup' },
  { label: 'Rezeptionist', href: '/app/receptionist', icon: Headphones, group: 'setup' },
  { label: 'Wissen', href: '/app/knowledge', icon: BookOpen, group: 'setup' },
  { label: 'Telefon', href: '/app/phone', icon: Phone, group: 'setup' },
  { label: 'Test & Start', href: '/app/test', icon: TestTube2, group: 'setup' },
  { label: 'Anrufe', href: '/app/calls', icon: Mic2, group: 'operate' },
  { label: 'Leads', href: '/app/leads', icon: UserPlus, group: 'operate' },
  { label: 'Abrechnung', href: '/app/billing', icon: CreditCard, group: 'account' },
  { label: 'Einstellungen', href: '/app/settings', icon: Settings, group: 'account' },
];

const navGroupLabels: Record<CustomerNavGroup, string> = {
  setup: 'Setup',
  operate: 'Betrieb',
  account: 'Konto',
};

function isActivePath(pathname: string, href: string) {
  if (href === '/app') return pathname === '/app';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function CustomerAppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const { profile, user, signOut } = useAuth();
  const { memberships, activeOrganization, activeOrganizationId, setActiveOrganizationId } = useOrganizations();
  const hasMultipleOrganizations = memberships.length > 1;
  const displayName = profile?.full_name || profile?.email || user?.email || 'Konto';
  const lifecycle = lifecycleDisplays[defaultLifecycleState];

  const handleSignOut = async () => {
    setUserMenuOpen(false);
    setMobileOpen(false);
    await signOut();
  };

  return (
    <div className="min-h-screen bg-[#f7f7f4] text-gray-950">
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link to="/" className="group flex min-w-0 items-center gap-3" aria-label="Zur Cogniiq Website">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-sm font-bold tracking-tight text-gray-950 shadow-sm transition-colors group-hover:border-gray-300">
              C
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold tracking-tight text-gray-950">Cogniiq</span>
              <span className="block truncate text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
                Kundenbereich
              </span>
            </span>
          </Link>

          <div className="hidden min-w-0 flex-1 items-center justify-center gap-3 lg:flex">
            <div className="flex min-w-0 items-center gap-2 rounded-2xl border border-gray-100 bg-gray-50 px-3 py-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Workspace</span>
              <span className="max-w-[220px] truncate text-sm font-semibold text-gray-800">
                {activeOrganization?.name ?? 'Noch nicht provisioniert'}
              </span>
            </div>
            <AppStatusBadge label={lifecycle.label} tone={lifecycle.tone} />
          </div>

          <div className="hidden items-center gap-2 md:flex">
            {hasMultipleOrganizations ? (
              <label className="sr-only" htmlFor="customer-organization-select">
                Organisation auswaehlen
              </label>
            ) : null}
            {hasMultipleOrganizations ? (
              <select
                id="customer-organization-select"
                value={activeOrganizationId ?? ''}
                onChange={(event) => setActiveOrganizationId(event.target.value || null)}
                className="h-10 max-w-[220px] rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 outline-none transition-colors focus:border-gray-400"
              >
                {memberships.map((membership) => (
                  <option key={membership.id} value={membership.organization_id}>
                    {membership.organization?.name ?? 'Unbenannte Organisation'}
                  </option>
                ))}
              </select>
            ) : null}

            <Link
              to="/"
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 text-sm font-semibold text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
            >
              Zur Website
              <ExternalLink size={13} aria-hidden="true" />
            </Link>

            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen((open) => !open)}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-gray-700 transition-colors hover:border-gray-300 hover:text-gray-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
              >
                <UserRound size={14} className="text-gray-400" aria-hidden="true" />
                <span className="max-w-[150px] truncate text-sm font-medium">{displayName}</span>
                <ChevronDown size={13} className="text-gray-400" aria-hidden="true" />
              </button>

              {userMenuOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-72 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.12)]"
                >
                  <div className="border-b border-gray-100 px-4 py-3">
                    <p className="truncate text-sm font-semibold text-gray-950">{displayName}</p>
                    <p className="mt-1 truncate text-xs text-gray-500">{profile?.email ?? user?.email}</p>
                    <p className="mt-2 truncate text-[11px] font-medium text-gray-400">
                      {activeOrganization?.name ?? 'Keine Organisation verbunden'}
                    </p>
                  </div>
                  <div className="p-2">
                    <MenuLink to="/app/settings" icon={Settings} label="Profil & Konto" onClick={() => setUserMenuOpen(false)} />
                    <MenuLink to="/" icon={ExternalLink} label="Zur Website" onClick={() => setUserMenuOpen(false)} />
                    <button
                      type="button"
                      onClick={() => void handleSignOut()}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                      role="menuitem"
                    >
                      <LogOut size={15} className="text-gray-400" aria-hidden="true" />
                      Abmelden
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 md:hidden"
            aria-label="Kundenbereich Navigation"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={17} aria-hidden="true" /> : <Menu size={17} aria-hidden="true" />}
          </button>
        </div>

        <div className="hidden border-t border-gray-100 bg-white/80 lg:block">
          <nav className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-3 sm:px-6 lg:px-8" aria-label="Kundenbereich Navigation">
            {(['setup', 'operate', 'account'] as CustomerNavGroup[]).map((group) => (
              <div key={group} className="flex items-center gap-1">
                <span className="px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-300">
                  {navGroupLabels[group]}
                </span>
                {navItems
                  .filter((item) => item.group === group)
                  .map((item) => (
                    <AppNavLink key={item.href} item={item} active={isActivePath(location.pathname, item.href)} />
                  ))}
              </div>
            ))}
          </nav>
        </div>

        {mobileOpen ? (
          <div className="border-t border-gray-100 bg-white px-4 py-4 md:hidden">
            <div className="mb-4 rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Workspace</p>
              <p className="mt-1 truncate text-sm font-semibold text-gray-900">
                {activeOrganization?.name ?? 'Noch nicht provisioniert'}
              </p>
              <p className="mt-2 text-[12px] leading-5 text-gray-500">{lifecycle.description}</p>
            </div>
            <nav className="space-y-5" aria-label="Mobile Kundenbereich Navigation">
              {(['setup', 'operate', 'account'] as CustomerNavGroup[]).map((group) => (
                <div key={group}>
                  <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
                    {navGroupLabels[group]}
                  </p>
                  <div className="space-y-1">
                    {navItems
                      .filter((item) => item.group === group)
                      .map((item) => (
                        <MobileNavLink
                          key={item.href}
                          item={item}
                          active={isActivePath(location.pathname, item.href)}
                          onClick={() => setMobileOpen(false)}
                        />
                      ))}
                  </div>
                </div>
              ))}
            </nav>
            <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
              <p className="truncate text-sm font-semibold text-gray-900">{displayName}</p>
              <p className="mt-1 truncate text-xs text-gray-500">{profile?.email ?? user?.email}</p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link
                to="/"
                onClick={() => setMobileOpen(false)}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700"
              >
                Website
              </Link>
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700"
              >
                <LogOut size={14} aria-hidden="true" />
                Abmelden
              </button>
            </div>
          </div>
        ) : null}
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}

function AppNavLink({ item, active }: { item: CustomerNavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-xl px-3 text-[13px] font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2',
        active ? 'bg-gray-950 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-950'
      )}
    >
      <Icon size={14} className={active ? 'text-white' : 'text-gray-400'} aria-hidden="true" />
      {item.label}
    </Link>
  );
}

function MobileNavLink({
  item,
  active,
  onClick,
}: {
  item: CustomerNavItem;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      to={item.href}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors',
        active ? 'bg-gray-950 text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-950'
      )}
    >
      <Icon size={16} className={active ? 'text-white' : 'text-gray-400'} aria-hidden="true" />
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
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
      role="menuitem"
    >
      <Icon size={15} className="text-gray-400" aria-hidden="true" />
      {label}
    </Link>
  );
}
