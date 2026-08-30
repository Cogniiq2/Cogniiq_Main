import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

// Legacy CRM UI recipes, kept only for the two pages that have not been migrated yet
// (ClientDetailPage and NewClientWizard — see docs/admin-center-design-system.md).
//
// Everything here duplicates something @/components/dashboard already provides, in a different
// visual language: 16px radii against the dashboard's 12px, a 60px drop shadow against its
// hairline border, and fully-rounded pills against its 6px status badges. The list pages no
// longer use it. Nothing new should.
//
// The status tone maps that used to live here moved to ./statusTones: they are domain knowledge,
// not styling, and the migrated pages need them without needing any of this.

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
