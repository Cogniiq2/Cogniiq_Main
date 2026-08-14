// Per-operation request validation for the Club Operations read gateway (D3b-A, §9).
//
// This is the first layer of two. It runs in the Cogniiq boundary function **before anything is
// signed or sent**, so a malformed or hostile query never becomes a signed request. The second layer
// runs in the upstream gateway after signature verification, because the upstream never trusts this
// one (`Cqgw1VerifyInput.validatePayload`, `cqgw1.ts:330`).
//
// ─── Why the enum members are spelled out here rather than imported ──────────────────────────────
//
// The Club Operations solution module owns the domain unions, but nothing outside that module may
// name its path — `clubOperations.boundaries.test.ts` fails the build if any file under `src/`
// outside the module so much as mentions it, which is what keeps the browser module free of a
// transport. So the wire-level unions are transcribed here, and `conformanceVectors.test.ts` pins
// the accept/reject behaviour that both this module and its upstream transcription must reproduce.
//
// ─── Rules, all mandatory ────────────────────────────────────────────────────────────────────────
//
//   * `operation` must be one of the closed twelve; nothing else is expressible.
//   * `query` must be a plain object. An unknown key is rejected, never ignored: ignoring is how a
//     request grows a side channel.
//   * enums are checked against the transcribed unions;
//   * `dateFrom` / `dateTo` are strict `YYYY-MM-DD` calendar dates with `from <= to`;
//   * `month` is strict `YYYY-MM`;
//   * `search` is a length-capped string, carried verbatim and never interpreted as a pattern;
//   * `period` / `range` must be present and inside their unions.
//
// An explicitly `undefined` value is treated as an absent key, matching canonical JSON's rule that
// absent is absent and is never spelled as `null` (`canonicalJson.ts`).

import { isCqgw1Operation, type Cqgw1Operation } from './cqgw1.ts';

/* ------------------------------------------------------------- Transcribed unions */

const overviewPeriods = ['today', 'week', 'month', 'last_month'] as const;
const reportRanges = ['week', 'month', 'last_month', 'quarter'] as const;
const bookingStatuses = ['confirmed', 'pending', 'cancelled', 'refunded', 'failed'] as const;
const courtKeys = ['padel-1', 'padel-2', 'tennis-1', 'tennis-2', 'tennis-3'] as const;
const paymentProviders = ['stripe', 'paypal', 'voucher', 'free'] as const;
const paymentStatuses = ['paid', 'pending', 'refunded', 'failed', 'not_required'] as const;
const paymentMetaClasses = ['standard', 'double_booking', 'customer_cancelled'] as const;
const invoiceStatuses = ['draft', 'open', 'paid', 'void', 'uncollectible'] as const;
const reconciliationIssues = [
  'matched',
  'paid_no_booking',
  'active_booking_refunded',
  'amount_mismatch',
  'double_booking',
  'customer_cancellation',
  'false_refund_likely',
  'needs_review',
] as const;
const reconciliationSeverities = ['ok', 'info', 'warning', 'critical'] as const;
const voucherStatuses = ['open', 'sold', 'partially_redeemed', 'redeemed', 'expired'] as const;
const membershipTypes = ['padel', 'tennis', 'combination', 'other'] as const;
const memberStatuses = ['active', 'pending', 'inactive', 'resigned'] as const;
const activityCategories = [
  'booking',
  'payment',
  'refund',
  'voucher',
  'invoice',
  'report',
  'member',
  'tax',
  'system',
] as const;
const activityActorTypes = ['admin', 'system', 'customer'] as const;
const alertSeverities = ['critical', 'high', 'medium', 'low'] as const;
/** `unresolved` is the facet spanning `open` + `in_progress`; it is a filter value, not a stored state. */
const alertStatusFacets = ['open', 'in_progress', 'resolved', 'ignored', 'unresolved'] as const;
const alertCategories = [
  'payment',
  'booking',
  'refund',
  'reconciliation',
  'voucher',
  'floodlight',
  'system',
] as const;

/** Every filter union additionally admits `all`, which means "no filter", not "every value". */
const FILTER_ALL = 'all';

/** Long enough for a name or a reference, short enough that no query is a payload. */
export const MAX_SEARCH_LENGTH = 120;

/* ------------------------------------------------------------------ Specification */

type FieldRule =
  | { kind: 'search' }
  | { kind: 'date' }
  | { kind: 'month' }
  | { kind: 'filter'; values: readonly string[] }
  | { kind: 'choice'; values: readonly string[]; required: true };

interface OperationSpec {
  fields: Readonly<Record<string, FieldRule>>;
  /** Both date bounds, when present and non-empty, must be ordered. */
  orderedDates?: boolean;
}

const OPERATION_SPECS: Readonly<Record<Cqgw1Operation, OperationSpec>> = {
  getOverview: {
    fields: { period: { kind: 'choice', values: overviewPeriods, required: true } },
  },
  listBookings: {
    fields: {
      search: { kind: 'search' },
      dateFrom: { kind: 'date' },
      dateTo: { kind: 'date' },
      status: { kind: 'filter', values: bookingStatuses },
      court: { kind: 'filter', values: courtKeys },
    },
    orderedDates: true,
  },
  listPayments: {
    fields: {
      search: { kind: 'search' },
      dateFrom: { kind: 'date' },
      dateTo: { kind: 'date' },
      provider: { kind: 'filter', values: paymentProviders },
      status: { kind: 'filter', values: paymentStatuses },
      metaClass: { kind: 'filter', values: paymentMetaClasses },
    },
    orderedDates: true,
  },
  listInvoices: {
    fields: {
      search: { kind: 'search' },
      dateFrom: { kind: 'date' },
      dateTo: { kind: 'date' },
      status: { kind: 'filter', values: invoiceStatuses },
    },
    orderedDates: true,
  },
  listReconciliation: {
    fields: {
      search: { kind: 'search' },
      issue: { kind: 'filter', values: reconciliationIssues },
      severity: { kind: 'filter', values: reconciliationSeverities },
    },
  },
  getMonthlyReport: {
    fields: { month: { kind: 'month' } },
  },
  getReport: {
    fields: { range: { kind: 'choice', values: reportRanges, required: true } },
  },
  listVouchers: {
    fields: {
      search: { kind: 'search' },
      status: { kind: 'filter', values: voucherStatuses },
    },
  },
  listMembers: {
    fields: {
      search: { kind: 'search' },
      membershipType: { kind: 'filter', values: membershipTypes },
      status: { kind: 'filter', values: memberStatuses },
    },
  },
  listActivity: {
    fields: {
      search: { kind: 'search' },
      dateFrom: { kind: 'date' },
      dateTo: { kind: 'date' },
      category: { kind: 'filter', values: activityCategories },
      actorType: { kind: 'filter', values: activityActorTypes },
    },
    orderedDates: true,
  },
  listAlerts: {
    fields: {
      search: { kind: 'search' },
      dateFrom: { kind: 'date' },
      dateTo: { kind: 'date' },
      severity: { kind: 'filter', values: alertSeverities },
      status: { kind: 'filter', values: alertStatusFacets },
      category: { kind: 'filter', values: alertCategories },
    },
    orderedDates: true,
  },
  getSettings: {
    fields: {},
  },
};

/* --------------------------------------------------------------------- Outcomes */

/**
 * Why a payload was refused. Internal only: the transmitted body is opaque and identical for every
 * rejection, so a caller cannot use the reason to map the validation rules.
 */
export const operationValidationReasons = [
  'body_not_object',
  'unknown_body_key',
  'operation_missing',
  'operation_unknown',
  'query_missing',
  'query_not_object',
  'unknown_query_key',
  'required_field_missing',
  'value_type',
  'value_not_allowed',
  'search_too_long',
  'date_malformed',
  'date_range_inverted',
  'month_malformed',
] as const;
export type OperationValidationReason = (typeof operationValidationReasons)[number];

export interface OperationPayloadAccepted {
  ok: true;
  operation: Cqgw1Operation;
  /** The query with absent-valued keys dropped. These are the exact bytes that will be signed. */
  query: Record<string, unknown>;
}

export interface OperationPayloadRejected {
  ok: false;
  reason: OperationValidationReason;
  /** The offending key, when there is one. Never a value — a value can be personal or financial. */
  field?: string;
}

export type OperationPayloadResult = OperationPayloadAccepted | OperationPayloadRejected;

function reject(reason: OperationValidationReason, field?: string): OperationPayloadRejected {
  return field === undefined ? { ok: false, reason } : { ok: false, reason, field };
}

/* ------------------------------------------------------------------- Primitives */

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_PATTERN = /^\d{4}-\d{2}$/;

/** `2026-02-30` matches the grammar and is still not a date. Both checks are required. */
function isCalendarDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (month < 1 || month > 12 || day < 1) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

function isCalendarMonth(value: string): boolean {
  if (!MONTH_PATTERN.test(value)) return false;
  const month = Number(value.slice(5));
  return month >= 1 && month <= 12;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/* ------------------------------------------------------------------ Validation */

/**
 * Validate one operation's query object.
 *
 * Returns the normalised query — absent-valued keys removed — so the caller signs exactly what was
 * validated, never a superset.
 */
export function validateOperationQuery(
  operation: Cqgw1Operation,
  query: unknown,
): OperationPayloadResult {
  const spec = OPERATION_SPECS[operation];
  if (!isPlainObject(query)) return reject('query_not_object');

  const normalised: Record<string, unknown> = {};

  for (const key of Object.keys(query)) {
    const rule = spec.fields[key];
    if (!rule) return reject('unknown_query_key', key);

    const value = query[key];
    if (value === undefined) continue; // absent is absent

    if (typeof value !== 'string') return reject('value_type', key);

    switch (rule.kind) {
      case 'search':
        if (value.length > MAX_SEARCH_LENGTH) return reject('search_too_long', key);
        break;
      case 'date':
        if (value !== '' && !isCalendarDate(value)) return reject('date_malformed', key);
        break;
      case 'month':
        if (value !== '' && !isCalendarMonth(value)) return reject('month_malformed', key);
        break;
      case 'filter':
        if (value !== FILTER_ALL && !rule.values.includes(value)) {
          return reject('value_not_allowed', key);
        }
        break;
      case 'choice':
        if (!rule.values.includes(value)) return reject('value_not_allowed', key);
        break;
    }

    normalised[key] = value;
  }

  for (const [key, rule] of Object.entries(spec.fields)) {
    if (rule.kind === 'choice' && rule.required && normalised[key] === undefined) {
      return reject('required_field_missing', key);
    }
  }

  if (spec.orderedDates) {
    const from = normalised.dateFrom;
    const to = normalised.dateTo;
    if (typeof from === 'string' && typeof to === 'string' && from !== '' && to !== '' && from > to) {
      return reject('date_range_inverted', 'dateFrom');
    }
  }

  return { ok: true, operation, query: normalised };
}

/**
 * Validate a full request payload: `{ operation, query }` and nothing else.
 *
 * The exact-key rule at the top level is what stops an identity — a user id, an organization id, an
 * email — from riding along in the body. The boundary derives identity from the caller's own token
 * and from nowhere else (§6.1), so any additional key is a request to be refused, not trimmed.
 */
export function validateOperationPayload(body: unknown): OperationPayloadResult {
  if (!isPlainObject(body)) return reject('body_not_object');

  for (const key of Object.keys(body)) {
    if (key !== 'operation' && key !== 'query') return reject('unknown_body_key', key);
  }

  if (!('operation' in body) || body.operation === undefined) return reject('operation_missing');
  if (!isCqgw1Operation(body.operation)) return reject('operation_unknown');

  if (!('query' in body) || body.query === undefined) return reject('query_missing');

  return validateOperationQuery(body.operation, body.query);
}
