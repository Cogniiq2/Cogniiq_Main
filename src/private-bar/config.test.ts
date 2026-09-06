import { describe, expect, it } from 'vitest';

import { CASH_LOCATION, PAYPAL_PAYMENT_URL, resolvePaypalUrl } from './config';

describe('PayPal configuration', () => {
  it('fails closed when nothing is configured', () => {
    expect(resolvePaypalUrl(null)).toBeNull();
    expect(resolvePaypalUrl('')).toBeNull();
  });

  it('accepts the owner-supplied PayPal link verbatim', () => {
    expect(resolvePaypalUrl('https://paypal.me/example/18.50')).toBe(
      'https://paypal.me/example/18.50'
    );
    expect(resolvePaypalUrl('https://www.paypal.com/paypalme/example')).toBe(
      'https://www.paypal.com/paypalme/example'
    );
  });

  it('refuses anything that is not a PayPal https URL, so a guest is never misdirected', () => {
    expect(resolvePaypalUrl('http://paypal.me/example')).toBeNull();
    expect(resolvePaypalUrl('https://paypal.me.attacker.example/x')).toBeNull();
    expect(resolvePaypalUrl('https://example.com/pay')).toBeNull();
    expect(resolvePaypalUrl('/private-bar/pay')).toBeNull();
    expect(resolvePaypalUrl('TODO')).toBeNull();
  });

  it('ships unconfigured: no placeholder URL and no invented cash location', () => {
    expect(PAYPAL_PAYMENT_URL).toBeNull();
    expect(CASH_LOCATION).toBeNull();
  });
});
