import {
  Building2, FileSignature, FileText, Gauge, HardDrive, LayoutDashboard, LayoutGrid, Mail,
  Receipt, Repeat, ScrollText, Settings, ShieldCheck, TrendingUp, Users, Wallet, type LucideIcon,
} from 'lucide-react';

import type { ShellSection, ShellSubNavGroup } from '@/components/dashboard';

// Single source of truth for the internal workspace navigation. The top-level switch and each
// module's grouped sub-navigation are derived from the URL, so every /admin/* page shares one
// header and one navigation model. Finance is owner-only here AND behind PlatformOwnerRoute +
// RLS — hiding an item is convenience, never the security boundary.
//
// INFORMATION ARCHITECTURE
// ------------------------
// The Admin Center is one business operating system, not a CRM next to a finance tool, so the
// rail states the shape of the business rather than the shape of the codebase:
//
//   START      Command Center
//   KUNDEN     Kunden · Portalzugänge · Lösungen · Einladungen
//   FINANZEN   Übersicht · Einnahmen · Kosten · Buchhaltung · System
//
// Every entry here points at a destination that EXISTS TODAY. Navigation must never advertise a
// feature that is not there: a link to an empty Projects page is worse than no link, because the
// owner cannot tell "not built" from "broken". Leads/Pipeline and a canonical Projects workspace
// are therefore absent — the first has no backend on main, the second has no settled model.
//
// HIDDEN, NOT DELETED
// -------------------
// `hiddenFromNav` withholds a module from the rail while leaving its route, its data and its deep
// links completely intact — typing the URL still works and nothing is destroyed. It is how Oura
// Analytics (personal health data) and the standalone Task/Execution OS leave the business
// navigation without leaving the application.

export type ModuleKey = 'home' | 'customers' | 'finance' | 'tasks' | 'oura';

interface ModuleSubNavGroup extends ShellSubNavGroup {
  /** Withheld from non-owners. The route stays owner-gated regardless. */
  ownerOnly?: boolean;
  items: (ShellSubNavItemWithGate)[];
}

interface ShellSubNavItemWithGate {
  key: string;
  label: string;
  href: string;
  icon?: LucideIcon;
  ownerOnly?: boolean;
}

interface ModuleConfig {
  key: ModuleKey;
  label: string;
  /** Where the module's own top-level item points. Owner and non-owner can differ. */
  href: string;
  ownerHref?: string;
  icon: LucideIcon;
  title: string;
  ownerOnly?: boolean;
  hiddenFromNav?: boolean;
  matches: (pathname: string) => boolean;
  subNav: ModuleSubNavGroup[];
}

// Order matters: `getActiveModule` takes the FIRST match, and the customer workspace deliberately
// claims /admin/finance/customers* out of the finance module's /admin/finance/* range.
const MODULES: ModuleConfig[] = [
  {
    key: 'home',
    label: 'Command Center',
    href: '/admin',
    icon: LayoutDashboard,
    title: 'Command Center',
    matches: (p) => p === '/admin',
    subNav: [],
  },
  {
    key: 'customers',
    label: 'Kunden',
    // A non-owner has no access to owner_customers, so their customer work starts at the portal
    // tenants they can actually administer.
    href: '/admin/clients',
    ownerHref: '/admin/finance/customers',
    icon: Users,
    title: 'Kunden',
    matches: (p) =>
      p === '/admin/finance/customers' || p.startsWith('/admin/finance/customers/') ||
      p === '/admin/clients' || p.startsWith('/admin/clients/') ||
      p === '/admin/solutions' || p === '/admin/invitations',
    subNav: [
      {
        key: 'primary',
        items: [
          // owner_customers is the canonical commercial customer. Everything else in this module
          // hangs off the portal tenant, which is a different object and is labelled as one.
          { key: 'customers', label: 'Kundenstamm', href: '/admin/finance/customers', icon: Users, ownerOnly: true },
          { key: 'clients', label: 'Portalzugänge', href: '/admin/clients', icon: Building2 },
        ],
      },
      {
        key: 'portal',
        label: 'Kundenportal',
        items: [
          { key: 'solutions', label: 'Lösungen', href: '/admin/solutions', icon: LayoutGrid },
          { key: 'invitations', label: 'Einladungen', href: '/admin/invitations', icon: Mail },
        ],
      },
    ],
  },
  {
    key: 'finance',
    label: 'Finanzen',
    href: '/admin/finance/overview',
    icon: Wallet,
    title: 'Finanzen',
    ownerOnly: true,
    matches: (p) => p === '/admin/finance' || p.startsWith('/admin/finance/'),
    // Grouped by what the business actually does with the money: what comes in, what goes out,
    // and what the tax office sees. As one flat list these read as a wall of links that says
    // nothing.
    subNav: [
      {
        key: 'primary',
        items: [
          { key: 'overview', label: 'Übersicht', href: '/admin/finance/overview', icon: LayoutDashboard },
        ],
      },
      {
        key: 'income',
        label: 'Einnahmen',
        items: [
          { key: 'offers', label: 'Angebote', href: '/admin/finance/offers', icon: FileSignature },
          { key: 'invoices', label: 'Rechnungen', href: '/admin/finance/invoices', icon: FileText },
          { key: 'revenue', label: 'Umsatz', href: '/admin/finance/revenue', icon: TrendingUp },
          { key: 'contracts', label: 'Laufende Verträge', href: '/admin/finance/contracts', icon: Repeat },
        ],
      },
      {
        key: 'costs',
        label: 'Kosten',
        items: [
          { key: 'expenses', label: 'Ausgaben', href: '/admin/finance/expenses', icon: Receipt },
          { key: 'subscriptions', label: 'Abos', href: '/admin/finance/subscriptions', icon: Repeat },
          { key: 'assets', label: 'Anlagen', href: '/admin/finance/assets', icon: HardDrive },
        ],
      },
      {
        key: 'accounting',
        label: 'Buchhaltung',
        items: [
          { key: 'taxes', label: 'Steuern', href: '/admin/finance/taxes', icon: Gauge },
          { key: 'documents', label: 'Dokumente', href: '/admin/finance/documents', icon: ScrollText },
          { key: 'audit', label: 'Audit', href: '/admin/finance/audit', icon: ShieldCheck },
        ],
      },
      {
        key: 'system',
        label: 'System',
        items: [
          { key: 'settings', label: 'Einstellungen', href: '/admin/finance/settings', icon: Settings },
        ],
      },
    ],
  },
  {
    key: 'tasks',
    label: 'Task-Dashboard',
    href: '/admin/tasks',
    icon: LayoutGrid,
    title: 'Task-Dashboard',
    // A standalone task universe with its own `tasks` table, unrelated to the customer tasks the
    // business actually runs on. It leaves the rail; the Command Center surfaces the same queue
    // contextually and links here, and every /admin/tasks/* route still resolves.
    hiddenFromNav: true,
    matches: (p) => p === '/admin/tasks' || p.startsWith('/admin/tasks/') || p === '/admin/execution',
    subNav: [],
  },
  {
    key: 'oura',
    label: 'Oura Analytics',
    href: '/admin/oura-analytics',
    icon: LayoutGrid,
    title: 'Oura Analytics',
    // Personal health analytics: not part of the business operating system, and every day it sits
    // in the rail it costs a top-level slot. Route, page and data untouched.
    hiddenFromNav: true,
    matches: (p) => p === '/admin/oura-analytics' || p.startsWith('/admin/oura-analytics/'),
    subNav: [],
  },
];

const HOME_MODULE = MODULES[0];

export function getActiveModule(pathname: string): ModuleConfig {
  return MODULES.find((m) => m.matches(pathname)) ?? HOME_MODULE;
}

const DISPLAY_ORDER: ModuleKey[] = ['home', 'customers', 'finance', 'tasks', 'oura'];

export function getSections(pathname: string, opts: { isOwner: boolean }): ShellSection[] {
  const active = getActiveModule(pathname);
  return DISPLAY_ORDER.map((key) => MODULES.find((m) => m.key === key)!)
    .filter((m) => !m.hiddenFromNav)
    .filter((m) => !m.ownerOnly || opts.isOwner)
    .map((m) => ({
      key: m.key,
      label: m.label,
      href: (opts.isOwner && m.ownerHref) || m.href,
      icon: m.icon,
      active: m.key === active.key,
      ownerOnly: m.ownerOnly,
    }));
}

/**
 * The active module's sub-navigation with owner-only destinations removed for anyone else.
 *
 * Empty groups are dropped by the shell, so a non-owner simply sees a shorter rail rather than an
 * orphan heading. This is presentation: PlatformOwnerRoute and RLS remain the boundary.
 */
export function getSubNav(pathname: string, opts: { isOwner: boolean }): ShellSubNavGroup[] {
  const active = getActiveModule(pathname);
  if (active.ownerOnly && !opts.isOwner) return [];
  return active.subNav
    .filter((group) => !group.ownerOnly || opts.isOwner)
    .map((group) => ({
      key: group.key,
      label: group.label,
      items: group.items
        .filter((item) => !item.ownerOnly || opts.isOwner)
        .map(({ key, label, href, icon }) => ({ key, label, href, icon })),
    }))
    .filter((group) => group.items.length > 0);
}

// Sub-nav highlighting: exact match, or a deeper path under a non-root href (so
// /admin/finance/customers/:id still highlights "Kunden" while /admin never swallows anything).
export function isSubNavActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href === '/admin') return false;
  return pathname.startsWith(`${href}/`);
}

/** Every destination the rail can reach, flattened — used by the navigation contract tests. */
export function allNavHrefs(): string[] {
  const hrefs = new Set<string>();
  for (const module of MODULES) {
    if (module.hiddenFromNav) continue;
    hrefs.add(module.href);
    if (module.ownerHref) hrefs.add(module.ownerHref);
    for (const group of module.subNav) for (const item of group.items) hrefs.add(item.href);
  }
  return [...hrefs];
}

/** Routes that stay alive but are deliberately absent from the rail. */
export function hiddenNavHrefs(): string[] {
  return MODULES.filter((m) => m.hiddenFromNav).map((m) => m.href);
}
