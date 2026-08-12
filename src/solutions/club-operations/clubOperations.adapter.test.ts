import { describe, expect, it } from 'vitest';

import {
  ClubOperationsError,
  clubOperationsErrorCodes,
  clubOperationsErrorMessages,
  errorMessageFor,
} from './adapter/ClubOperationsAdapter';
import { createFixtureAdapter } from './adapter/fixtureAdapter';
import { fixtureBookings } from './fixtures/bookings';
import { emptyBookingQuery } from './types';

describe('adapter contract', () => {
  it('exposes exactly the read methods — no mutation surface exists in this phase', () => {
    const adapter = createFixtureAdapter();
    const asRecord = adapter as unknown as Record<string, unknown>;
    const methods = Object.keys(adapter).filter((key) => typeof asRecord[key] === 'function');
    expect(methods.sort()).toEqual(['getOverview', 'listBookings']);
  });

  it('identifies itself without naming a connection target', () => {
    expect(createFixtureAdapter({ scenario: 'populated' }).id).toBe('fixture:populated');
  });

  it('maps every error code to a staff-facing German message', () => {
    for (const code of clubOperationsErrorCodes) {
      const message = clubOperationsErrorMessages[code];
      expect(message.length).toBeGreaterThan(0);
      expect(errorMessageFor(new ClubOperationsError(code, 'internal detail'))).toBe(message);
    }
  });

  it('never surfaces an internal error message to the UI', () => {
    const leaky = new Error('connection to internal host failed at 10.0.0.4');
    expect(errorMessageFor(leaky)).toBe(clubOperationsErrorMessages.unknown);
    expect(errorMessageFor(leaky)).not.toContain('10.0.0.4');
  });
});

describe('fixture adapter — populated', () => {
  const adapter = createFixtureAdapter({ scenario: 'populated' });

  it('returns every fixture booking for an empty query', async () => {
    const page = await adapter.listBookings(emptyBookingQuery);
    expect(page.bookings).toHaveLength(fixtureBookings.length);
    expect(page.total).toBe(fixtureBookings.length);
  });

  it('returns an overview whose booking total matches the booking list', async () => {
    const overview = await adapter.getOverview({ period: 'month' });
    const page = await adapter.listBookings(emptyBookingQuery);
    expect(overview.bookings.total).toBe(page.total);
  });

  it('is deterministic across calls', async () => {
    const first = await adapter.getOverview({ period: 'month' });
    const second = await adapter.getOverview({ period: 'month' });
    expect(first).toEqual(second);
  });
});

describe('fixture adapter — empty', () => {
  const adapter = createFixtureAdapter({ scenario: 'empty' });

  it('returns a successful but empty booking page', async () => {
    const page = await adapter.listBookings(emptyBookingQuery);
    expect(page.bookings).toEqual([]);
    expect(page.total).toBe(0);
  });

  it('returns a structurally valid overview with zeroed figures', async () => {
    const overview = await adapter.getOverview({ period: 'month' });
    expect(overview.bookings.total).toBe(0);
    expect(overview.revenue.totalCents).toBe(0);
    expect(overview.revenue.averageBookingValueCents).toBe(0);
    expect(overview.vat.totalVatCents).toBe(0);
    // Courts are still enumerated, so the section renders a real empty shape rather than crashing.
    expect(overview.courts.length).toBeGreaterThan(0);
    expect(overview.courts.every((court) => court.bookingCount === 0)).toBe(true);
  });
});

describe('fixture adapter — error', () => {
  it('rejects with a typed ClubOperationsError', async () => {
    const adapter = createFixtureAdapter({ scenario: 'error' });
    await expect(adapter.listBookings(emptyBookingQuery)).rejects.toBeInstanceOf(ClubOperationsError);
    await expect(adapter.getOverview({ period: 'month' })).rejects.toBeInstanceOf(ClubOperationsError);
  });

  it('carries the requested error code', async () => {
    const adapter = createFixtureAdapter({ scenario: 'error', errorCode: 'forbidden' });
    await expect(adapter.listBookings(emptyBookingQuery)).rejects.toMatchObject({ code: 'forbidden' });
  });
});

describe('fixture adapter — loading', () => {
  it('never settles, so the loading state can be inspected deterministically', async () => {
    const adapter = createFixtureAdapter({ scenario: 'loading' });
    const settled = await Promise.race([
      adapter.listBookings(emptyBookingQuery).then(() => 'settled'),
      Promise.resolve('pending'),
    ]);
    expect(settled).toBe('pending');
  });
});
