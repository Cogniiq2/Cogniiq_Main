// Focused manual validation (project already depends on zod, but the client-platform admin
// forms need targeted, message-driven checks that map cleanly onto the RPC contract).

import {
  clientLifecycleStatuses,
  engagementStatuses,
  implementationKeys,
  solutionCatalogKeys,
  type ClientLifecycleStatus,
  type EngagementStatus,
  type ImplementationKey,
  type SolutionCatalogKey,
} from './types';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const URL_RE = /^https?:\/\/[^\s]+\.[^\s]+$/i;
const CURRENCY_RE = /^[A-Z]{3}$/;
const HEX_COLOR_RE = /^#([0-9a-f]{6}|[0-9a-f]{3})$/i;

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

export function isValidUrl(value: string): boolean {
  return URL_RE.test(value.trim());
}

export function isValidCurrency(value: string): boolean {
  return CURRENCY_RE.test(value.trim());
}

export function isValidHexColor(value: string): boolean {
  return HEX_COLOR_RE.test(value.trim());
}

export function isValidLifecycleStatus(value: string): value is ClientLifecycleStatus {
  return (clientLifecycleStatuses as readonly string[]).includes(value);
}

export function isValidEngagementStatus(value: string): value is EngagementStatus {
  return (engagementStatuses as readonly string[]).includes(value);
}

export function isValidCatalogKey(value: string): value is SolutionCatalogKey {
  return (solutionCatalogKeys as readonly string[]).includes(value);
}

export function isValidImplementationKey(value: string): value is ImplementationKey {
  return (implementationKeys as readonly string[]).includes(value);
}

// Parse a human-entered currency amount (e.g. "1.234,50" or "1234.50") into non-negative integer cents.
// Returns null when the input is blank; returns { error } when invalid.
export function parseAmountToCents(input: string): { cents: number | null } | { error: string } {
  const trimmed = input.trim();
  if (trimmed === '') return { cents: null };

  // Normalise German-style formatting: strip thousands separators, use dot as decimal.
  let normalised = trimmed.replace(/\s/g, '');
  if (normalised.includes(',') && normalised.includes('.')) {
    // Assume '.' thousands, ',' decimal (de-DE).
    normalised = normalised.replace(/\./g, '').replace(',', '.');
  } else if (normalised.includes(',')) {
    normalised = normalised.replace(',', '.');
  }

  if (!/^\d+(\.\d{1,2})?$/.test(normalised)) {
    return { error: 'Bitte einen gueltigen Betrag eingeben (max. 2 Nachkommastellen).' };
  }

  const value = Number(normalised);
  if (!Number.isFinite(value) || value < 0) {
    return { error: 'Betrag muss groesser oder gleich 0 sein.' };
  }
  return { cents: Math.round(value * 100) };
}

export function formatCents(cents: number | null | undefined, currency = 'EUR'): string {
  if (cents == null) return '—';
  try {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}

export interface FieldErrors {
  [field: string]: string;
}
