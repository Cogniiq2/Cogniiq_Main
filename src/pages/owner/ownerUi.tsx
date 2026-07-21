import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Building2, FileText, Gauge, HardDrive, LayoutDashboard, LayoutGrid, HeartPulse, Receipt,
  Repeat, ScrollText, Settings, ShieldCheck, Wallet,
} from 'lucide-react';

import { DashboardShell, type ShellSection, type ShellSubNavItem, type BadgeTone } from '@/components/dashboard';

// Owner-scoped façade over the shared light dashboard design system. The finance module renders
// inside the SAME visual shell as the rest of the Cogniiq admin dashboard — no second dark sidebar,
// no duplicate logout, no separate application feeling. All primitives come from the shared system.
export * from '@/components/dashboard';

const financeSubNav: ShellSubNavItem[] = [
  { key: 'overview', label: 'Übersicht', href: '/owner/overview', icon: LayoutDashboard },
  { key: 'invoices', label: 'Rechnungen', href: '/owner/invoices', icon: FileText },
  { key: 'expenses', label: 'Ausgaben', href: '/owner/expenses', icon: Receipt },
  { key: 'subscriptions', label: 'Abos', href: '/owner/subscriptions', icon: Repeat },
  { key: 'assets', label: 'Anlagen', href: '/owner/assets', icon: HardDrive },
  { key: 'taxes', label: 'Steuern', href: '/owner/taxes', icon: Gauge },
  { key: 'clients', label: 'Kunden (CRM)', href: '/owner/clients', icon: Building2 },
  { key: 'revenue', label: 'Umsatz', href: '/owner/revenue', icon: Wallet },
  { key: 'documents', label: 'Dokumente', href: '/owner/documents', icon: ScrollText },
  { key: 'audit', label: 'Audit', href: '/owner/audit', icon: ShieldCheck },
  { key: 'settings', label: 'Einstellungen', href: '/owner/settings', icon: Settings },
];

export function OwnerShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const inOwner = pathname.startsWith('/owner');
  const sections: ShellSection[] = [
    { key: 'tasks', label: 'Task-Dashboard', href: '/admin', icon: LayoutGrid, active: false },
    { key: 'oura', label: 'Oura Analytics', href: '/admin/oura-analytics', icon: HeartPulse, active: false },
    { key: 'crm', label: 'Client CRM', href: '/admin/clients', icon: Building2, active: false },
    { key: 'finance', label: 'Finance & Steuern', href: '/owner/overview', icon: Wallet, active: inOwner, ownerOnly: true },
  ];
  return (
    <DashboardShell sections={sections} subNav={financeSubNav} subNavLabel="Finance & Steuern" title="Finance & Steuern">
      {children}
    </DashboardShell>
  );
}

// Owner-domain status tones mapped onto the shared badge palette.
export const invoiceStatusTone: Record<string, BadgeTone> = {
  draft: 'neutral', issued: 'info', partially_paid: 'warning', paid: 'success',
  overdue: 'danger', void: 'neutral', cancelled: 'neutral', credited: 'neutral',
};

export const expenseReviewTone: Record<string, BadgeTone> = {
  reviewed: 'success', pending: 'warning', needs_info: 'warning',
};

export const paymentStatusTone: Record<string, BadgeTone> = {
  unpaid: 'neutral', partially_paid: 'warning', paid: 'success', void: 'neutral',
};

export const lifecycleTone: Record<string, BadgeTone> = {
  lead: 'neutral', qualified: 'info', active: 'success', paused: 'warning', churned: 'danger', archived: 'neutral',
};
