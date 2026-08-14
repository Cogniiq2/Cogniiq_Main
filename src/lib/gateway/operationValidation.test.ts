// Per-operation parameter validation (plan §9, §14.1.2).

import { describe, expect, it } from 'vitest';

import { cqgw1Operations, type Cqgw1Operation } from './cqgw1';
import {
  MAX_SEARCH_LENGTH,
  validateOperationPayload,
  validateOperationQuery,
} from './operationValidation';

/** One valid query per operation — every one of the closed twelve, none left out. */
const VALID_QUERIES: Record<Cqgw1Operation, Record<string, unknown>> = {
  getOverview: { period: 'month' },
  listBookings: {
    search: 'Muster',
    dateFrom: '2026-01-01',
    dateTo: '2026-01-31',
    status: 'confirmed',
    court: 'padel-1',
  },
  listPayments: {
    search: '',
    dateFrom: '',
    dateTo: '',
    provider: 'stripe',
    status: 'paid',
    metaClass: 'standard',
  },
  listInvoices: { search: '', dateFrom: '2026-02-01', dateTo: '2026-02-28', status: 'open' },
  listReconciliation: { search: '', issue: 'needs_review', severity: 'warning' },
  getMonthlyReport: { month: '2026-07' },
  getReport: { range: 'quarter' },
  listVouchers: { search: '', status: 'redeemed' },
  listMembers: { search: '', membershipType: 'combination', status: 'active' },
  listActivity: {
    search: '',
    dateFrom: '',
    dateTo: '',
    category: 'booking',
    actorType: 'admin',
  },
  listAlerts: {
    search: '',
    dateFrom: '',
    dateTo: '',
    severity: 'critical',
    status: 'unresolved',
    category: 'payment',
  },
  getSettings: {},
};

describe('the closed twelve', () => {
  it('has a valid query for every operation and no others', () => {
    expect(Object.keys(VALID_QUERIES).sort()).toEqual([...cqgw1Operations].sort());
  });

  for (const operation of cqgw1Operations) {
    it(`${operation} accepts its valid query`, () => {
      const result = validateOperationQuery(operation, VALID_QUERIES[operation]);
      expect(result.ok, JSON.stringify(result)).toBe(true);
    });

    it(`${operation} accepts an all-defaults query`, () => {
      const defaults: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(VALID_QUERIES[operation])) {
        // Filters default to `all`; required choices keep their value; everything else empties.
        if (['status', 'court', 'provider', 'metaClass', 'issue', 'severity', 'membershipType', 'category', 'actorType'].includes(key)) {
          defaults[key] = 'all';
        } else if (key === 'period' || key === 'range') {
          defaults[key] = value;
        } else {
          defaults[key] = '';
        }
      }
      expect(validateOperationQuery(operation, defaults).ok).toBe(true);
    });
  }

  it('accepts the empty query wherever no field is required', () => {
    for (const operation of cqgw1Operations) {
      const required = operation === 'getOverview' || operation === 'getReport';
      expect(validateOperationQuery(operation, {}).ok, operation).toBe(!required);
    }
  });
});

describe('unknown and malformed operations are refused', () => {
  for (const operation of ['listCustomers', 'select', 'getOverview ', 'GETOVERVIEW', '', 'drop']) {
    it(`refuses the operation ${JSON.stringify(operation)}`, () => {
      expect(validateOperationPayload({ operation, query: {} })).toEqual({
        ok: false,
        reason: 'operation_unknown',
      });
    });
  }

  it('refuses a non-string operation', () => {
    expect(validateOperationPayload({ operation: 1, query: {} }).ok).toBe(false);
    expect(validateOperationPayload({ operation: null, query: {} }).ok).toBe(false);
    expect(validateOperationPayload({ operation: ['getOverview'], query: {} }).ok).toBe(false);
  });

  it('refuses a missing operation or query', () => {
    expect(validateOperationPayload({ query: {} })).toEqual({ ok: false, reason: 'operation_missing' });
    expect(validateOperationPayload({ operation: 'getSettings' })).toEqual({
      ok: false,
      reason: 'query_missing',
    });
  });

  it('refuses a body that is not a plain object', () => {
    for (const body of [null, 'x', 3, [], undefined]) {
      expect(validateOperationPayload(body)).toEqual({ ok: false, reason: 'body_not_object' });
    }
  });
});

describe('identity cannot ride along in the payload', () => {
  for (const key of ['userId', 'organizationId', 'email', 'role', 'sql', 'table']) {
    it(`refuses a top-level ${key}`, () => {
      expect(validateOperationPayload({ operation: 'getSettings', query: {}, [key]: 'x' })).toEqual({
        ok: false,
        reason: 'unknown_body_key',
        field: key,
      });
    });

    it(`refuses ${key} inside the query`, () => {
      const result = validateOperationQuery('listBookings', { [key]: 'x' });
      expect(result).toEqual({ ok: false, reason: 'unknown_query_key', field: key });
    });
  }
});

describe('unknown query keys are refused, never ignored', () => {
  it('refuses an extra key even alongside valid ones', () => {
    expect(validateOperationQuery('listBookings', { status: 'all', limit: '1000' })).toEqual({
      ok: false,
      reason: 'unknown_query_key',
      field: 'limit',
    });
  });

  it('refuses a key that belongs to a different operation', () => {
    expect(validateOperationQuery('listVouchers', { court: 'padel-1' }).ok).toBe(false);
    expect(validateOperationQuery('getSettings', { period: 'month' }).ok).toBe(false);
  });
});

describe('value grammar', () => {
  it('refuses a non-string value', () => {
    for (const value of [1, true, null, {}, []]) {
      expect(validateOperationQuery('listBookings', { search: value })).toEqual({
        ok: false,
        reason: 'value_type',
        field: 'search',
      });
    }
  });

  it('treats an explicitly undefined value as an absent key', () => {
    const result = validateOperationQuery('listBookings', { search: undefined, status: 'all' });
    expect(result).toEqual({ ok: true, operation: 'listBookings', query: { status: 'all' } });
  });

  it('caps the search string', () => {
    expect(validateOperationQuery('listBookings', { search: 'a'.repeat(MAX_SEARCH_LENGTH) }).ok).toBe(true);
    expect(validateOperationQuery('listBookings', { search: 'a'.repeat(MAX_SEARCH_LENGTH + 1) })).toEqual({
      ok: false,
      reason: 'search_too_long',
      field: 'search',
    });
  });

  it('carries the search text verbatim rather than interpreting it', () => {
    const result = validateOperationQuery('listBookings', { search: "%_';--" });
    expect(result).toEqual({ ok: true, operation: 'listBookings', query: { search: "%_';--" } });
  });

  it('enforces the date grammar', () => {
    for (const value of ['2026-1-1', '26-01-01', '2026/01/01', '2026-01-01T00:00:00Z', '2026-13-01', '2026-02-30', 'today']) {
      expect(validateOperationQuery('listBookings', { dateFrom: value }), value).toEqual({
        ok: false,
        reason: 'date_malformed',
        field: 'dateFrom',
      });
    }
    expect(validateOperationQuery('listBookings', { dateFrom: '2028-02-29' }).ok).toBe(true); // leap year
    expect(validateOperationQuery('listBookings', { dateFrom: '2027-02-29' }).ok).toBe(false);
    expect(validateOperationQuery('listBookings', { dateFrom: '' }).ok).toBe(true);
  });

  it('refuses an inverted date range, and accepts an equal one', () => {
    expect(validateOperationQuery('listBookings', { dateFrom: '2026-03-02', dateTo: '2026-03-01' })).toEqual({
      ok: false,
      reason: 'date_range_inverted',
      field: 'dateFrom',
    });
    expect(validateOperationQuery('listBookings', { dateFrom: '2026-03-01', dateTo: '2026-03-01' }).ok).toBe(true);
    // A single open bound is not a range.
    expect(validateOperationQuery('listBookings', { dateFrom: '2026-03-02', dateTo: '' }).ok).toBe(true);
  });

  it('enforces the month grammar', () => {
    for (const value of ['2026-7', '2026-13', '2026-00', '2026', '2026-07-01']) {
      expect(validateOperationQuery('getMonthlyReport', { month: value }), value).toEqual({
        ok: false,
        reason: 'month_malformed',
        field: 'month',
      });
    }
    expect(validateOperationQuery('getMonthlyReport', { month: '2026-01' }).ok).toBe(true);
    expect(validateOperationQuery('getMonthlyReport', { month: '2026-12' }).ok).toBe(true);
    expect(validateOperationQuery('getMonthlyReport', { month: '' }).ok).toBe(true);
  });

  it('checks enum boundaries', () => {
    expect(validateOperationQuery('listBookings', { status: 'archived' })).toEqual({
      ok: false,
      reason: 'value_not_allowed',
      field: 'status',
    });
    expect(validateOperationQuery('listBookings', { court: 'padel-3' }).ok).toBe(false);
    expect(validateOperationQuery('listAlerts', { status: 'unresolved' }).ok).toBe(true);
    expect(validateOperationQuery('listAlerts', { status: 'escalated' }).ok).toBe(false);
  });

  it('requires the operations that have a required choice, and refuses `all` for them', () => {
    expect(validateOperationQuery('getOverview', {})).toEqual({
      ok: false,
      reason: 'required_field_missing',
      field: 'period',
    });
    expect(validateOperationQuery('getOverview', { period: 'all' }).ok).toBe(false);
    expect(validateOperationQuery('getReport', { range: 'all' }).ok).toBe(false);
    expect(validateOperationQuery('getReport', { range: 'year' }).ok).toBe(false);
  });

  it('never reports a value, only a field name and a reason', () => {
    const result = validateOperationQuery('listBookings', { search: 'Vertrauliche Person' });
    expect(result.ok).toBe(true);
    const rejected = validateOperationQuery('listBookings', { status: 'Vertraulich' });
    expect(JSON.stringify(rejected)).not.toContain('Vertraulich');
  });
});

describe('getSettings takes no parameters at all', () => {
  it('accepts only the empty object', () => {
    expect(validateOperationQuery('getSettings', {})).toEqual({
      ok: true,
      operation: 'getSettings',
      query: {},
    });
    expect(validateOperationQuery('getSettings', { anything: 'x' }).ok).toBe(false);
  });
});

describe('the query must be an object', () => {
  it('refuses arrays, strings and null', () => {
    for (const query of [null, [], 'x', 3, true]) {
      expect(validateOperationQuery('listBookings', query)).toEqual({
        ok: false,
        reason: 'query_not_object',
      });
    }
  });
});
