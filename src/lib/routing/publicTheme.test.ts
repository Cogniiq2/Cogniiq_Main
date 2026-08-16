import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  PUBLIC_LIGHT_CLASS,
  PUBLIC_THEME_INLINE_SCRIPT,
  THEMED_PRIVATE_PREFIXES,
  usesGenericTheme,
  usesPublicLightTheme,
} from './publicTheme';
import { isDocumentSurface, isPrivateSurface } from './indexability';

describe('public light theme surface classification', () => {
  it('treats every private surface as keeping the generic theme', () => {
    for (const path of [
      '/app',
      '/app/login',
      '/app/projekte/1',
      '/admin',
      '/admin/kunden',
      '/owner',
      '/owner/finanzen',
      '/auth',
      '/auth/confirmed',
      '/d',
      '/d/abc123',
    ]) {
      expect(usesGenericTheme(path)).toBe(true);
      expect(usesPublicLightTheme(path)).toBe(false);
    }
  });

  it('treats public marketing routes as light-pinned', () => {
    for (const path of [
      '/',
      '/leistungen',
      '/bewertungen',
      '/referenzen',
      '/ueber-uns',
      '/kontakt',
      '/bayreuth/webdesign',
      '/bayreuth/lokales-seo',
      '/blog',
      '/blog/lokales-seo-unternehmen',
      '/gibt-es-nicht',
    ]) {
      expect(usesPublicLightTheme(path)).toBe(true);
      expect(usesGenericTheme(path)).toBe(false);
    }
  });

  // A prefix that merely STARTS with a private one is a public URL. Without the
  // boundary check "/apps-fuer-handwerker" would be classified private and would
  // inherit the application's dark theme.
  it('matches on path boundaries, not string prefixes', () => {
    for (const path of ['/apps-fuer-handwerker', '/administration', '/ownership', '/design']) {
      expect(usesPublicLightTheme(path)).toBe(true);
    }
  });

  it('agrees with the indexability module about what is private', () => {
    for (const path of ['/app/login', '/admin', '/owner', '/auth/confirmed', '/d/token']) {
      expect(isPrivateSurface(path) || isDocumentSurface(path)).toBe(true);
      expect(usesGenericTheme(path)).toBe(true);
    }
  });
});

describe('pre-paint inline script', () => {
  // The script is duplicated into index.html because it must run before any
  // module loads. That is two copies of the same logic, so the copies are pinned
  // to each other here rather than trusted to stay in step.
  // process.cwd() rather than import.meta.url: the suite runs under jsdom, where
  // import.meta.url is not a file: URL and new URL(...) throws during collection.
  const indexHtml = readFileSync(join(process.cwd(), 'index.html'), 'utf8');

  it('is present in index.html exactly as generated', () => {
    expect(indexHtml).toContain(PUBLIC_THEME_INLINE_SCRIPT);
  });

  it('carries every private prefix', () => {
    for (const prefix of THEMED_PRIVATE_PREFIXES) {
      expect(PUBLIC_THEME_INLINE_SCRIPT).toContain(`"${prefix}"`);
    }
  });

  it('applies the public light class and declares the light scheme', () => {
    expect(PUBLIC_THEME_INLINE_SCRIPT).toContain(PUBLIC_LIGHT_CLASS);
    expect(PUBLIC_THEME_INLINE_SCRIPT).toContain('colorScheme="light"');
  });

  it('runs before the stylesheet can paint a dark canvas', () => {
    // It must sit in <head>, ahead of the module script that boots the app.
    const scriptAt = indexHtml.indexOf(PUBLIC_THEME_INLINE_SCRIPT);
    const bootAt = indexHtml.indexOf('/src/main.tsx');
    expect(scriptAt).toBeGreaterThan(-1);
    expect(scriptAt).toBeLessThan(bootAt);
  });
});
