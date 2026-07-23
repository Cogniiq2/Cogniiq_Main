import {
  AlertTriangle, Building2, CalendarCheck, CheckCircle2, Cpu, FileSignature, FileText, Gauge, HardDrive, HeartPulse,
  LayoutDashboard, LayoutGrid, Mail, Receipt, Repeat, ScrollText, Settings, ShieldCheck, TrendingUp,
  Users, Wallet, type LucideIcon,
} from 'lucide-react';

import type { ShellSection, ShellSubNavItem } from '@/components/dashboard';

// Single source of truth for the unified internal workspace navigation. The top-level app switch
// (Task Dashboard / Oura / CRM / Finance) and each module's sub-navigation are derived from the URL,
// so every /admin/* page shares one header and one navigation model. Finance is owner-only here AND
// behind PlatformOwnerRoute + RLS — hiding the item is convenience, not the security boundary.

export type ModuleKey = 'tasks' | 'oura' | 'crm' | 'finance';

interface ModuleConfig {
  key: ModuleKey;
  label: string;
  href: string;
  icon: LucideIcon;
  title: string;
  subNavLabel: string;
  ownerOnly?: boolean;
  matches: (pathname: string) => boolean;
  subNav: ShellSubNavItem[];
}

const MODULES: ModuleConfig[] = [
  {
    key: 'finance',
    label: 'Finance & Steuern',
    href: '/admin/finance/overview',
    icon: Wallet,
    title: 'Finance & Steuern',
    subNavLabel: 'Finance & Steuern',
    ownerOnly: true,
    matches: (p) => p === '/admin/finance' || p.startsWith('/admin/finance/'),
    subNav: [
      { key: 'overview', label: 'Übersicht', href: '/admin/finance/overview', icon: LayoutDashboard },
      { key: 'customers', label: 'Kunden & Aufgaben', href: '/admin/finance/customers', icon: Users },
      { key: 'offers', label: 'Angebote', href: '/admin/finance/offers', icon: FileSignature },
      { key: 'invoices', label: 'Rechnungen', href: '/admin/finance/invoices', icon: FileText },
      { key: 'expenses', label: 'Ausgaben', href: '/admin/finance/expenses', icon: Receipt },
      { key: 'subscriptions', label: 'Abos', href: '/admin/finance/subscriptions', icon: Repeat },
      { key: 'assets', label: 'Anlagen', href: '/admin/finance/assets', icon: HardDrive },
      { key: 'taxes', label: 'Steuern', href: '/admin/finance/taxes', icon: Gauge },
      { key: 'revenue', label: 'Umsatz', href: '/admin/finance/revenue', icon: Wallet },
      { key: 'documents', label: 'Dokumente', href: '/admin/finance/documents', icon: ScrollText },
      { key: 'audit', label: 'Audit', href: '/admin/finance/audit', icon: ShieldCheck },
      { key: 'settings', label: 'Einstellungen', href: '/admin/finance/settings', icon: Settings },
    ],
  },
  {
    key: 'crm',
    label: 'Client CRM',
    href: '/admin/clients',
    icon: Building2,
    title: 'Client CRM',
    subNavLabel: 'Client CRM',
    matches: (p) =>
      p === '/admin/clients' || p.startsWith('/admin/clients/') ||
      p === '/admin/solutions' || p === '/admin/invitations',
    subNav: [
      { key: 'clients', label: 'Kunden', href: '/admin/clients', icon: Building2 },
      { key: 'solutions', label: 'Lösungen', href: '/admin/solutions', icon: LayoutGrid },
      { key: 'invitations', label: 'Einladungen', href: '/admin/invitations', icon: Mail },
    ],
  },
  {
    key: 'oura',
    label: 'Oura Analytics',
    href: '/admin/oura-analytics',
    icon: HeartPulse,
    title: 'Oura Analytics',
    subNavLabel: 'Oura Analytics',
    matches: (p) => p === '/admin/oura-analytics' || p.startsWith('/admin/oura-analytics/'),
    subNav: [],
  },
  {
    key: 'tasks',
    label: 'Task Dashboard',
    href: '/admin',
    icon: LayoutGrid,
    title: 'Task-Dashboard',
    subNavLabel: 'Task-Dashboard',
    matches: (p) => p === '/admin' || p.startsWith('/admin/tasks') || p === '/admin/execution',
    subNav: [
      { key: 'overview', label: 'Übersicht', href: '/admin', icon: LayoutDashboard },
      { key: 'today', label: 'Heute', href: '/admin/tasks/today', icon: CalendarCheck },
      { key: 'overdue', label: 'Überfällig', href: '/admin/tasks/overdue', icon: AlertTriangle },
      { key: 'completed', label: 'Erledigt', href: '/admin/tasks/completed', icon: CheckCircle2 },
      { key: 'revenue', label: 'Umsatzfokus', href: '/admin/tasks/revenue', icon: TrendingUp },
      { key: 'execution', label: 'Execution OS', href: '/admin/execution', icon: Cpu },
    ],
  },
];

const TASKS_MODULE = MODULES.find((m) => m.key === 'tasks')!;

export function getActiveModule(pathname: string): ModuleConfig {
  return MODULES.find((m) => m.matches(pathname)) ?? TASKS_MODULE;
}

// Top-level sections for the shell, ordered for humans (Tasks → Oura → CRM → Finance) and filtered so
// a non-owner never even sees the Finance item.
const DISPLAY_ORDER: ModuleKey[] = ['tasks', 'oura', 'crm', 'finance'];

export function getSections(pathname: string, opts: { isOwner: boolean }): ShellSection[] {
  const active = getActiveModule(pathname);
  return DISPLAY_ORDER.map((key) => MODULES.find((m) => m.key === key)!)
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
