// The data-source resolver decides whether a Club Operations instance shows live data or the
// module's demonstration fixtures. Getting that wrong in the permissive direction would put
// fictional figures in front of a customer who believes they are looking at their own books, so
// every test here is really the same test: does this input fall back to the gateway?

import { describe, expect, it } from 'vitest';

import { resolveClubOperationsDataSource } from '@/lib/solutions/clubOperationsDataSource';

describe('resolveClubOperationsDataSource', () => {
  it('selects demo only for the exact string', () => {
    expect(resolveClubOperationsDataSource({ data_source: 'demo' })).toBe('demo');
  });

  it('defaults to the gateway when the key is absent', () => {
    expect(resolveClubOperationsDataSource({})).toBe('gateway');
    expect(resolveClubOperationsDataSource({ other: 'demo' })).toBe('gateway');
  });

  it('defaults to the gateway for a malformed config', () => {
    for (const config of [null, undefined, 'demo', 42, true, ['demo'], [{ data_source: 'demo' }]]) {
      expect(resolveClubOperationsDataSource(config)).toBe('gateway');
    }
  });

  it('defaults to the gateway for near-miss values', () => {
    // Truthiness is not enough, and neither is case-insensitive intent: an operator who meant demo
    // and mistyped it gets live behaviour, which is the safe direction to fail in.
    for (const value of ['DEMO', 'Demo', 'demo ', ' demo', 'demonstration', true, 1, {}, ['demo']]) {
      expect(resolveClubOperationsDataSource({ data_source: value })).toBe('gateway');
    }
  });

  it('ignores unrelated config keys', () => {
    expect(
      resolveClubOperationsDataSource({ data_source: 'demo', nav_order: 3, alias: 'anything' }),
    ).toBe('demo');
  });
});
