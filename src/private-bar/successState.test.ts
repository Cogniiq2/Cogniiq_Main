import { describe, expect, it } from 'vitest';

import { viewForStatus, type OrderStatus } from './successState';

const ALL: OrderStatus[] = ['paid', 'pending', 'failed', 'unknown', 'unavailable'];

describe('success view model', () => {
  it('confirms a payment for the authoritative paid status and for nothing else', () => {
    for (const status of ALL) {
      expect(viewForStatus(status).confirmed).toBe(status === 'paid');
    }
  });

  it('waits only while an authoritative answer is still expected', () => {
    expect(viewForStatus('pending').awaiting).toBe(true);
    for (const status of ALL.filter((s) => s !== 'pending')) {
      expect(viewForStatus(status).awaiting).toBe(false);
    }
  });

  it('offers a retry only when another check can still help', () => {
    expect(viewForStatus('unknown').retryable).toBe(true);
    for (const status of ALL.filter((s) => s !== 'unknown')) {
      expect(viewForStatus(status).retryable).toBe(false);
    }
  });

  it('never presents an unconfirmed state as a thank-you', () => {
    for (const status of ALL.filter((s) => s !== 'paid')) {
      const view = viewForStatus(status);
      expect(view.heading).not.toMatch(/vielen dank/i);
      expect(view.body).not.toMatch(/eingegangen/i);
    }
  });

  it('gives every status a heading and a body', () => {
    for (const status of ALL) {
      expect(viewForStatus(status).heading.length).toBeGreaterThan(0);
      expect(viewForStatus(status).body.length).toBeGreaterThan(0);
    }
  });
});
