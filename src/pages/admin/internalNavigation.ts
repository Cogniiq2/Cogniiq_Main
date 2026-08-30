import {
  AlertTriangle, Building2, CalendarCheck, CheckCircle2, FileSignature, FileText, Gauge, HardDrive,
  HeartPulse, LayoutDashboard, LayoutGrid, Mail, Receipt, Repeat, ScrollText, Settings, ShieldCheck,
  TrendingUp, Users, Wallet, type LucideIcon,
} from 'lucide-react';

import type { ShellSection, ShellSubNavGroup } from '@/components/dashboard';

// Single source of truth for the unified internal workspace navigation. The top-level app switch and
// each module's grouped sub-navigation are derived from the URL, so every /admin/* page shares one
// header and one navigation model. Finance is owner-only here AND behind PlatformOwnerRoute + RLS —
// hiding the item is convenience, not the security boundary.
//
// TARGET INFORMATION ARCHITECTURE
// -------------------------------
// The Admin Center is converging on:
//
//   HOME       Command Center
//   CUSTOMERS  Leads & Pipeline · Customers · Projects
//   FINANCE    Overview · INCOME · COSTS · ACCOUNTING
//   SYSTEM     Settings · Account
//
// This file implements every part of that shape whose destination EXISTS TODAY, and nothing else.
// Navigation must never advertise a feature that is not there: a link to an empty Projects page is
// worse than no link, because the owner cannot tell "not built" from "broken". What is still missing
// and what it waits on is recorded in docs/admin-center-navigation.md and enforced by
// internalNavigation.test.ts.
//
// HIDDEN, NOT DELETED
// -------------------
// `hiddenFromNav` withholds a module from the rail while leaving its route, its data and its
// deep links completely intact — typing the URL still works, and nothing is destroyed. It is the
// mechanism for surfaces that are outside the target architecture but still in use.

export type ModuleKey = 'tasks' | 'oura' | 'crm' | 'finance';

interface ModuleConfig {
  key: ModuleKey;
  label: string;
  href: string;
  icon: LucideIcon;
  title: string;
  ownerOnly?: boolean;
  /**
   * Withheld from the rail, reachable by URL. NOT a permission: `ownerOnly` is what gates
   * access, and RLS is what enforces it.
   */
  hiddenFromNav?: boolean;
  matches: (pathname: string) => boolean;
  subNav: ShellSubNavGroup[];
}

const MODULES: ModuleConfig[] = [
  {
    key: 'finance',
    label: 'Finance & Steuern',
    href: '/admin/finance/overview',
    icon: Wallet,
    title: 'Finance & Steuern',
    ownerOnly: true,
    matches: (p) => p === '/admin/finance' || p.startsWith('/admin/finance/'),
    // Thirteen destinations. As one flat list they read as a wall of links that says nothing
    // about the business; grouped, the rail states the shape of it — what comes in, what goes
    // out, and what the tax office sees. The group labels are the target architecture's, so this
    // navigation does not have to be re-learned when the remaining pages arrive.
    subNav: [
      {
        key: 'primary',
        items: [
          { key: 'overview', label: 'Übersicht', href: '/admin/finance/overview', icon: LayoutDashboard },
          // Belongs under CUSTOMERS in the target architecture. It stays here until Projects and
          // Leads exist to stand beside it — moving it alone would leave a one-item section and
          // split the owner's customer work across two modules for no gain.
          { key: 'customers', label: 'Kunden & Aufgaben', href: '/admin/finance/customers', icon: Users },
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
    key: 'crm',
    label: 'Client CRM',
    href: '/admin/clients',
    icon: Building2,
    title: 'Client CRM',
    matches: (p) =>
      p === '/admin/clients' || p.startsWith('/admin/clients/') ||
      p === '/admin/solutions' || p === '/admin/invitations',
    subNav: [
      {
        key: 'primary',
        label: 'Client CRM',
        items: [
          { key: 'clients', label: 'Kunden', href: '/admin/clients', icon: Building2 },
          { key: 'solutions', label: 'Lösungen', href: '/admin/solutions', icon: LayoutGrid },
          { key: 'invitations', label: 'Einladungen', href: '/admin/invitations', icon: Mail },
        ],
      },
    ],
  },
  {
    key: 'oura',
    label: 'Oura Analytics',
    href: '/admin/oura-analytics',
    icon: HeartPulse,
    title: 'Oura Analytics',
    // Personal health analytics. It is not part of the business operating system the Admin Center
    // is becoming, and every day it sits in the rail it costs a top-level slot that HOME and
    // CUSTOMERS need. The page, its route and its data are untouched: /admin/oura-analytics still
    // works when typed.
    hiddenFromNav: true,
    matches: (p) => p === '/admin/oura-analytics' || p.startsWith('/admin/oura-analytics/'),
    subNav: [],
  },
  {
    key: 'tasks',
    label: 'Task Dashboard',
    href: '/admin',
    icon: LayoutGrid,
    title: 'Task-Dashboard',
    // The interim HOME. In the target architecture this slot belongs to the Command Center and
    // task/work views become contextual to a customer, a project or a service rather than a
    // standalone destination. It stays visible until that replacement exists — hiding it now
    // would leave /admin, which the brand mark links to, unreachable from the rail.
    matches: (p) => p === '/admin' || p.startsWith('/admin/tasks') || p === '/admin/execution',
    subNav: [
      {
        key: 'primary',
        label: 'Task-Dashboard',
        items: [
          { key: 'overview', label: 'Übersicht', href: '/admin', icon: LayoutDashboard },
          { key: 'today', label: 'Heute', href: '/admin/tasks/today', icon: CalendarCheck },
          { key: 'overdue', label: 'Überfällig', href: '/admin/tasks/overdue', icon: AlertTriangle },
          { key: 'completed', label: 'Erledigt', href: '/admin/tasks/completed', icon: CheckCircle2 },
          { key: 'revenue', label: 'Umsatzfokus', href: '/admin/tasks/revenue', icon: TrendingUp },
          // 'Execution OS' (/admin/execution) is withheld here for the same reason as Oura: it is
          // a standalone execution surface with no place in the target architecture. The route is
          // untouched and still resolves.
        ],
      },
    ],
  },
];

const TASKS_MODULE = MODULES.find((m) => m.key === 'tasks')!;

export function getActiveModule(pathname: string): ModuleConfig {
  return MODULES.find((m) => m.matches(pathname)) ?? TASKS_MODULE;
}

// Top-level sections for the shell, ordered for humans and filtered so a non-owner never even sees
// the Finance item and nobody sees a module withheld from the rail.
const DISPLAY_ORDER: ModuleKey[] = ['tasks', 'crm', 'finance', 'oura'];

export function getSections(pathname: string, opts: { isOwner: boolean }): ShellSection[] {
  const active = getActiveModule(pathname);
  return DISPLAY_ORDER.map((key) => MODULES.find((m) => m.key === key)!)
    .filter((m) => !m.hiddenFromNav)
    .filter((m) => !m.ownerOnly || opts.isOwner)
    .map((m) => ({
      key: m.key,
      label: m.label,
      href: m.href,
      icon: m.icon,
      active: m.key === active.key,
      ownerOnly: m.ownerOnly,
    }));
}

// Sub-nav highlighting: exact match, or a deeper path under a non-root href (so /admin/clients/:id
// still highlights "Kunden" while /admin never swallows every task tab).
export function isSubNavActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href === '/admin') return false;
  return pathname.startsWith(`${href}/`);
}

/** Every destination the rail can reach, flattened — used by the navigation contract tests. */
export function allNavHrefs(): string[] {
  const hrefs = new Set<string>();
  for (const module of MODULES) {
    if (!module.hiddenFromNav) hrefs.add(module.href);
    for (const group of module.subNav) for (const item of group.items) hrefs.add(item.href);
  }
  return [...hrefs];
}
