import type { ReactNode } from 'react';

import { Card, Field, Select, StatusBadge, type BadgeTone } from '@/components/dashboard';

// CRM UI primitives.
//
// These are now thin adapters over the shared dashboard design system rather than a second
// visual language: Pill → StatusBadge, AdminCard → Card, AdminField → Field, AdminSelect →
// Select. The CRM pages therefore inherit the same radii, borders, shadows, focus rings and
// interactive states as the finance module and the task dashboard, with no call-site churn.

export type PillTone = BadgeTone;

export function Pill({ label, tone = 'neutral' }: { label: string; tone?: PillTone }) {
  return <StatusBadge label={label} tone={tone} />;
}

export function AdminCard({ children, className }: { children: ReactNode; className?: string }) {
  return <Card className={className}>{children}</Card>;
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
    <Field
      id={id}
      label={label}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      type={type}
      error={error}
      required={required}
    />
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
  return <Select id={id} label={label} value={value} onChange={onChange} options={options} />;
}

export const lifecycleTone: Record<string, PillTone> = {
  lead: 'neutral',
  qualified: 'info',
  active: 'success',
  paused: 'warning',
  churned: 'danger',
  archived: 'neutral',
};

export const solutionTone: Record<string, PillTone> = {
  active: 'success',
  provisioning: 'info',
  paused: 'warning',
  disabled: 'neutral',
};

export const invitationTone: Record<string, PillTone> = {
  pending: 'warning',
  accepted: 'success',
  revoked: 'danger',
  expired: 'neutral',
};
