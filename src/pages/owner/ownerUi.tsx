import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Building2, CreditCard, FileText, Gauge, HardDrive, LayoutDashboard, LogOut, Menu, Receipt,
  Repeat, ScrollText, Settings, ShieldCheck, Wallet, X, type LucideIcon,
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { formatCents } from '@/lib/clientPlatform/validation';

interface NavItem { label: string; href: string; icon: LucideIcon }

const navItems: NavItem[] = [
  { label: 'Übersicht', href: '/owner/overview', icon: LayoutDashboard },
  { label: 'Kunden', href: '/owner/clients', icon: Building2 },
  { label: 'Umsatz', href: '/owner/revenue', icon: Wallet },
  { label: 'Rechnungen', href: '/owner/invoices', icon: FileText },
  { label: 'Ausgaben', href: '/owner/expenses', icon: Receipt },
  { label: 'Abos', href: '/owner/subscriptions', icon: Repeat },
  { label: 'Anlagen', href: '/owner/assets', icon: HardDrive },
  { label: 'Steuern', href: '/owner/taxes', icon: Gauge },
  { label: 'Dokumente', href: '/owner/documents', icon: ScrollText },
  { label: 'Audit', href: '/owner/audit', icon: ShieldCheck },
  { label: 'Einstellungen', href: '/owner/settings', icon: Settings },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function OwnerShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { profile, user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav = (
    <nav className="space-y-1" aria-label="Owner Cockpit">
      {navItems.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            to={item.href}
            onClick={() => setMobileOpen(false)}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-colors',
              active ? 'bg-cyan-500/15 text-cyan-200 ring-1 ring-inset ring-cyan-400/25' : 'text-slate-400 hover:bg-white/5 hover:text-slate-100',
            )}
          >
            <Icon size={16} aria-hidden="true" className={active ? 'text-cyan-300' : 'text-slate-500'} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#0a111f] text-slate-100">
      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-white/5 bg-[#0b1324] px-4 py-5 lg:flex">
        <div className="mb-6 flex items-center gap-3 px-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500 text-sm font-bold text-slate-950">C</span>
          <div>
            <p className="text-sm font-semibold tracking-tight">Owner Cockpit</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Cogniiq Finanzen</p>
          </div>
        </div>
        {nav}
        <div className="mt-auto space-y-1 border-t border-white/5 pt-4">
          <Link to="/admin/clients" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-100">
            <CreditCard size={16} className="text-slate-500" aria-hidden="true" /> Client-Administration
          </Link>
          <button type="button" onClick={() => void signOut()} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-100">
            <LogOut size={16} className="text-slate-500" aria-hidden="true" /> Abmelden
          </button>
          <p className="truncate px-3 pt-2 text-[11px] text-slate-600">{profile?.email ?? user?.email}</p>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-white/5 bg-[#0b1324]/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500 text-xs font-bold text-slate-950">C</span>
          <span className="text-sm font-semibold">Owner Cockpit</span>
        </div>
        <button type="button" onClick={() => setMobileOpen((o) => !o)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-200" aria-label="Menü" aria-expanded={mobileOpen}>
          {mobileOpen ? <X size={17} /> : <Menu size={17} />}
        </button>
      </div>
      {mobileOpen ? (
        <div className="border-b border-white/5 bg-[#0b1324] px-4 py-4 lg:hidden">
          {nav}
          <div className="mt-3 border-t border-white/5 pt-3">
            <Link to="/admin/clients" onClick={() => setMobileOpen(false)} className="block rounded-xl px-3 py-2.5 text-[13px] font-medium text-slate-300">Client-Administration</Link>
            <button type="button" onClick={() => void signOut()} className="block w-full rounded-xl px-3 py-2.5 text-left text-[13px] font-medium text-slate-300">Abmelden</button>
          </div>
        </div>
      ) : null}

      <main className="px-4 py-6 sm:px-6 lg:ml-64 lg:px-10 lg:py-8">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
    </div>
  );
}

export function OwnerPageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-[28px]">{title}</h1>
        {description ? <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-400">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function OwnerCard({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('rounded-2xl border border-white/8 bg-[#111a2e] p-5 shadow-[0_16px_50px_rgba(0,0,0,0.35)]', className)}>{children}</div>;
}

export type KpiBasis = 'actual' | 'estimate' | 'forecast';
const basisLabel: Record<KpiBasis, string> = { actual: 'Ist', estimate: 'Schätzung', forecast: 'Prognose' };
const basisTone: Record<KpiBasis, string> = {
  actual: 'text-emerald-300 bg-emerald-400/10 ring-emerald-400/20',
  estimate: 'text-amber-300 bg-amber-400/10 ring-amber-400/20',
  forecast: 'text-sky-300 bg-sky-400/10 ring-sky-400/20',
};

export function OwnerKpi({ label, valueCents, value, basis, hint, currency = 'EUR' }: {
  label: string; valueCents?: number | null; value?: string; basis: KpiBasis; hint?: string; currency?: string;
}) {
  const display = value ?? (valueCents == null ? '—' : formatCents(valueCents, currency));
  return (
    <OwnerCard className="p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset', basisTone[basis])}>{basisLabel[basis]}</span>
      </div>
      <p className="text-[22px] font-semibold tracking-tight text-white tabular-nums">{display}</p>
      {hint ? <p className="mt-1.5 text-[12px] leading-5 text-slate-500">{hint}</p> : null}
    </OwnerCard>
  );
}

const pillTones: Record<string, string> = {
  neutral: 'bg-white/5 text-slate-300 ring-white/10',
  success: 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/20',
  warning: 'bg-amber-400/10 text-amber-300 ring-amber-400/20',
  danger: 'bg-rose-400/10 text-rose-300 ring-rose-400/20',
  info: 'bg-cyan-400/10 text-cyan-300 ring-cyan-400/20',
};

export function OwnerPill({ label, tone = 'neutral' }: { label: string; tone?: keyof typeof pillTones }) {
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset', pillTones[tone])}>{label}</span>;
}

export function OwnerEmpty({ icon: Icon, title, description, action }: { icon: LucideIcon; title: string; description: string; action?: ReactNode }) {
  return (
    <OwnerCard className="flex flex-col items-center py-14 text-center">
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-400"><Icon size={22} aria-hidden="true" /></span>
      <p className="text-base font-semibold text-white">{title}</p>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </OwnerCard>
  );
}

export function OwnerButton({ children, onClick, variant = 'primary', type = 'button', disabled }: {
  children: ReactNode; onClick?: () => void; variant?: 'primary' | 'ghost'; type?: 'button' | 'submit'; disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-[13.5px] font-semibold transition-colors disabled:opacity-50',
        variant === 'primary' ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400' : 'border border-white/10 text-slate-200 hover:bg-white/5',
      )}
    >
      {children}
    </button>
  );
}

export function OwnerField({ id, label, value, onChange, placeholder, type = 'text', error, required, hint }: {
  id: string; label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; error?: string; required?: boolean; hint?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[12px] font-medium text-slate-300">{label}{required ? <span className="text-rose-400"> *</span> : null}</label>
      <input
        id={id} type={type} value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn('h-10 w-full rounded-xl border bg-[#0c1526] px-3 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition-colors focus:border-cyan-500/50', error ? 'border-rose-500/50' : 'border-white/10')}
      />
      {hint && !error ? <p className="mt-1 text-[11px] text-slate-500">{hint}</p> : null}
      {error ? <p className="mt-1 text-[11px] text-rose-400">{error}</p> : null}
    </div>
  );
}

export function OwnerSelect({ id, label, value, onChange, options }: {
  id: string; label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[12px] font-medium text-slate-300">{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="h-10 w-full rounded-xl border border-white/10 bg-[#0c1526] px-3 text-sm text-slate-100 outline-none focus:border-cyan-500/50">
        {options.map((o) => <option key={o.value} value={o.value} className="bg-[#0c1526]">{o.label}</option>)}
      </select>
    </div>
  );
}

export function OwnerLoading({ label }: { label: string }) {
  return <OwnerCard className="flex items-center gap-3 text-sm text-slate-400"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-cyan-400" /> {label}</OwnerCard>;
}

export function OwnerError({ message }: { message: string }) {
  return <OwnerCard className="border-rose-500/20 bg-rose-500/5 text-sm text-rose-300">Fehler: {message}</OwnerCard>;
}

export const invoiceStatusTone: Record<string, keyof typeof pillTones> = {
  draft: 'neutral', issued: 'info', partially_paid: 'warning', paid: 'success',
  overdue: 'danger', void: 'neutral', cancelled: 'neutral', credited: 'neutral',
};
