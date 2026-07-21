import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Building2, LayoutGrid, Mail, Wallet } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const tabs = [
  { href: '/admin/clients', label: 'Kunden', icon: Building2 },
  { href: '/admin/solutions', label: 'Lösungen', icon: LayoutGrid },
  { href: '/admin/invitations', label: 'Einladungen', icon: Mail },
];

function isActive(pathname: string, href: string) {
  if (href === '/admin/clients') return pathname === '/admin/clients' || pathname.startsWith('/admin/clients/');
  return pathname === href;
}

export function AdminClientShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { isPlatformOwner } = useAuth();
  return (
    <div className="min-h-screen bg-[#f7f7f4] text-gray-950">
      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-950 shadow-sm">C</span>
              <div>
                <p className="text-sm font-semibold tracking-tight text-gray-950">Cogniiq Admin</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Client Platform</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isPlatformOwner ? (
                <Link
                  to="/owner"
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-gray-950 px-3 text-[13px] font-semibold text-white transition-colors hover:bg-gray-800"
                >
                  <Wallet size={14} aria-hidden="true" /> Owner Cockpit
                </Link>
              ) : null}
              <Link
                to="/admin"
                className="inline-flex h-9 items-center rounded-xl border border-gray-200 bg-white px-3 text-[13px] font-semibold text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-950"
              >
                Task-Dashboard
              </Link>
            </div>
          </div>
          <nav className="flex items-center gap-1 overflow-x-auto" aria-label="Admin Client Platform">
            {tabs.map((tab) => {
              const active = isActive(pathname, tab.href);
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.href}
                  to={tab.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-xl px-3 text-[13px] font-semibold transition-colors',
                    active ? 'bg-gray-950 text-white' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-950'
                  )}
                >
                  <Icon size={14} aria-hidden="true" />
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}

const pillTones: Record<string, string> = {
  neutral: 'border-gray-200 bg-gray-50 text-gray-600',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  danger: 'border-red-200 bg-red-50 text-red-700',
  info: 'border-sky-200 bg-sky-50 text-sky-700',
};

export function Pill({ label, tone = 'neutral' }: { label: string; tone?: keyof typeof pillTones }) {
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold', pillTones[tone])}>
      {label}
    </span>
  );
}

export function AdminCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.035)]', className)}>
      {children}
    </div>
  );
}

export function AdminField({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  error,
  required,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  error?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[12px] font-semibold text-gray-600">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          'h-11 w-full rounded-xl border bg-white px-3 text-sm text-gray-900 outline-none transition-colors focus:border-gray-400',
          error ? 'border-red-300' : 'border-gray-200'
        )}
      />
      {error ? <p className="mt-1 text-[12px] text-red-600">{error}</p> : null}
    </div>
  );
}

export function AdminSelect({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[12px] font-semibold text-gray-600">{label}</label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition-colors focus:border-gray-400"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );
}

export const lifecycleTone: Record<string, keyof typeof pillTones> = {
  lead: 'neutral',
  qualified: 'info',
  active: 'success',
  paused: 'warning',
  churned: 'danger',
  archived: 'neutral',
};

export const solutionTone: Record<string, keyof typeof pillTones> = {
  active: 'success',
  provisioning: 'info',
  paused: 'warning',
  disabled: 'neutral',
};

export const invitationTone: Record<string, keyof typeof pillTones> = {
  pending: 'warning',
  accepted: 'success',
  revoked: 'danger',
  expired: 'neutral',
};
