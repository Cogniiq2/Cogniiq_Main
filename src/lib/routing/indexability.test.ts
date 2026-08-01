import { describe, expect, it } from 'vitest';

import {
  DEFAULT_ROBOTS,
  PRIVATE_ROBOTS,
  isAuthSurface,
  isDocumentSurface,
  isPrivateSurface,
  privateDocumentTitle,
  shouldSuppressCanonical,
} from './indexability';

describe('isAuthSurface', () => {
  it('covers every /auth/* route', () => {
    expect(isAuthSurface('/auth')).toBe(true);
    expect(isAuthSurface('/auth/confirmed')).toBe(true);
    expect(isAuthSurface('/auth/continue')).toBe(true);
  });

  it('does not match unrelated paths that merely start with the same letters', () => {
    expect(isAuthSurface('/authors')).toBe(false);
    expect(isAuthSurface('/')).toBe(false);
    expect(isAuthSurface('/leistungen')).toBe(false);
  });
});

describe('isPrivateSurface', () => {
  it('treats the confirmation surface as private, so it is served noindex', () => {
    expect(isPrivateSurface('/auth/confirmed')).toBe(true);
    expect(isPrivateSurface('/auth/continue')).toBe(true);
    expect(PRIVATE_ROBOTS).toBe('noindex, nofollow');
  });

  it('keeps the existing private surfaces private', () => {
    for (const path of ['/app', '/app/billing', '/admin', '/admin/finance', '/owner', '/owner/taxes']) {
      expect(isPrivateSurface(path)).toBe(true);
    }
  });

  it('leaves marketing pages indexable', () => {
    for (const path of ['/', '/leistungen', '/kontakt', '/blog/foo']) {
      expect(isPrivateSurface(path)).toBe(false);
    }
    expect(DEFAULT_ROBOTS.startsWith('index, follow')).toBe(true);
  });
});

describe('canonical suppression', () => {
  it('emits no canonical URL for token- and email-link-only surfaces', () => {
    expect(shouldSuppressCanonical('/auth/confirmed')).toBe(true);
    expect(shouldSuppressCanonical('/d/abc123')).toBe(true);
    expect(isDocumentSurface('/d/abc123')).toBe(true);
  });

  it('keeps canonical URLs for public pages', () => {
    expect(shouldSuppressCanonical('/')).toBe(false);
    expect(shouldSuppressCanonical('/leistungen')).toBe(false);
  });
});

describe('privateDocumentTitle', () => {
  it('titles the confirmation surface as an account page, not the portal', () => {
    expect(privateDocumentTitle('/auth/confirmed')).toBe('Cogniiq Konto');
  });

  it('preserves the existing private titles', () => {
    expect(privateDocumentTitle('/admin/finance')).toBe('Cogniiq Admin');
    expect(privateDocumentTitle('/owner')).toBe('Cogniiq Owner');
    expect(privateDocumentTitle('/app/billing')).toBe('Cogniiq Kundenbereich');
  });
});
