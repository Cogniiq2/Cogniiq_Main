#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Site-wide public LIGHT theme regression check.
//
//   node .github/scripts/test-public-theme.mjs [--verbose]
//
// Loads EVERY route in the authoritative public manifest from the built artifact
// in a real browser and asserts the contract the marketing site depends on:
//
//   1. Public pages render light with no stored preference, whether the OS asks
//      for light or dark.
//   2. Public pages render light even when the GENERIC `cogniiq-theme` key says
//      `dark` or the legacy `system` — that key belongs to the application and
//      must not reach the marketing site. This is the regression that shipped.
//   3. The navigation stays light at the top of the page and after scrolling,
//      with text readable against it.
//   4. The application keeps its own theme: an explicit dark choice still
//      applies on a private surface.
// ─────────────────────────────────────────────────────────────────────────────
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { startStaticServer } from './lib/static-server.mjs';
import { findChromium, launchChromium } from './lib/chromium.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DIST = join(ROOT, 'dist');
const VERBOSE = process.argv.includes('--verbose');

const failures = [];
const fail = (m) => failures.push(m);

/**
 * Relative luminance (WCAG) of an rgb()/rgba() string.
 *
 * Returns null for a (near-)transparent colour rather than 0: `rgba(0,0,0,0)` is
 * "no colour here, look through me", and scoring it as pure black flagged every
 * element that simply does not paint its own background — #root among them.
 */
function luminance(value) {
  const m = String(value).match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const alpha = m[1].split(',').map(Number)[3];
  if (alpha !== undefined && alpha <= 0.5) return null;
  const [r, g, b] = m[1].split(',').map(Number);
  const f = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
const contrast = (a, b) => {
  const la = luminance(a);
  const lb = luminance(b);
  if (la === null || lb === null) return null;
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};

const PROBE = `(() => {
  const of = (el) => {
    if (!el) return null;
    const cs = getComputedStyle(el);
    return { bg: cs.backgroundColor, color: cs.color };
  };
  // The nav is transparent at the top by design; what the user actually sees
  // behind it is the page canvas, so resolve the first opaque ancestor colour.
  const opaqueBg = (el) => {
    let node = el;
    while (node) {
      const bg = getComputedStyle(node).backgroundColor;
      const m = bg.match(/rgba?\\(([^)]+)\\)/);
      if (m) {
        const parts = m[1].split(',').map(Number);
        if (parts.length < 4 || parts[3] > 0.5) return bg;
      }
      node = node.parentElement;
    }
    return getComputedStyle(document.body).backgroundColor;
  };
  const nav = document.querySelector('nav[role="navigation"], header, nav');
  const navLink = nav ? nav.querySelector('a, button') : null;
  return JSON.stringify({
    htmlClass: document.documentElement.className,
    html: of(document.documentElement),
    body: of(document.body),
    root: of(document.getElementById('root')),
    nav: nav ? { ...of(nav), effectiveBg: opaqueBg(nav) } : null,
    navLink: navLink ? { ...of(navLink), effectiveBg: opaqueBg(navLink) } : null,
  });
})()`;

async function loadManifest() {
  const ssr = join(ROOT, 'dist-ssr', 'entry-server.js');
  if (existsSync(ssr)) {
    const mod = await import(`${ssr}`);
    return mod.PUBLIC_ROUTES.map((r) => r.path);
  }
  // The build removes dist-ssr/ as its last step, so fall back to the sitemap +
  // the one prerendered noindex route. Both come from the same manifest.
  const { readFileSync, readdirSync, statSync } = await import('node:fs');
  const sitemap = readFileSync(join(DIST, 'sitemap.xml'), 'utf8');
  const fromSitemap = [...sitemap.matchAll(/<loc>https:\/\/cogniiq\.de([^<]*)<\/loc>/g)].map(
    (m) => m[1] || '/'
  );
  // Every prerendered .html is a manifest route; walk dist to catch noindex ones.
  const walk = (dir, base = dir, out = []) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p, base, out);
      else if (e.name.endsWith('.html')) out.push(p.slice(base.length).replace(/\.html$/, ''));
    }
    return out;
  };
  const fromDisk = walk(DIST)
    .filter((p) => !['/404', '/app-shell'].includes(p))
    .map((p) => (p === '/index' ? '/' : p));
  return [...new Set([...fromSitemap, ...fromDisk])].sort();
}

async function inspect(page, origin, route, { stored, scheme }) {
  await page.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-color-scheme', value: scheme }],
  });
  await page.send('Runtime.evaluate', {
    expression: `try{${stored ? `localStorage.setItem('cogniiq-theme','${stored}')` : `localStorage.removeItem('cogniiq-theme')`}}catch(e){}`,
  });
  await page.send('Page.navigate', { url: `${origin}${route}` });
  await page.send('Runtime.evaluate', {
    expression:
      'new Promise(r => { if (document.readyState === "complete") r(); else addEventListener("load", () => r(), {once:true}); })',
    awaitPromise: true,
  });
  await new Promise((r) => setTimeout(r, 700));

  const top = JSON.parse(
    (await page.send('Runtime.evaluate', { expression: PROBE, returnByValue: true })).result.value
  );
  await page.send('Runtime.evaluate', { expression: 'window.scrollTo(0, 1200)' });
  await new Promise((r) => setTimeout(r, 600));
  const scrolled = JSON.parse(
    (await page.send('Runtime.evaluate', { expression: PROBE, returnByValue: true })).result.value
  );
  return { top, scrolled };
}

async function run() {
  if (!existsSync(join(DIST, 'index.html'))) {
    console.error('✗ dist/ not built. Run `npm run build` first.');
    process.exit(1);
  }
  const executable = findChromium();
  if (!executable) {
    console.log('⚠ No Chrome/Chromium found — skipping the public-theme check.');
    process.exit(0);
  }

  const routes = await loadManifest();
  console.log(`  checking ${routes.length} public routes from the manifest`);

  const server = await startStaticServer(DIST);
  const { page, close } = await launchChromium(executable);
  let darkCanvas = 0;
  let darkNav = 0;

  try {
    await page.send('Page.enable');
    await page.send('Runtime.enable');
    await page.send('Emulation.setDeviceMetricsOverride', {
      width: 1350,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    // ── 1. default appearance, OS asking for dark ──────────────────────────
    for (const route of routes) {
      const { top, scrolled } = await inspect(page, server.origin, route, {
        stored: null,
        scheme: 'dark',
      });

      if (/\bdark\b/.test(top.htmlClass)) {
        fail(`${route}: <html class="${top.htmlClass}"> with no stored preference — OS dark leaked in`);
        darkCanvas++;
      }
      for (const [name, node] of [['body', top.body], ['root', top.root]]) {
        const l = node ? luminance(node.bg) : null;
        if (l !== null && l < 0.5) {
          fail(`${route}: ${name} background ${node.bg} is dark in the default theme`);
          darkCanvas++;
        }
      }

      for (const [state, snap] of [['top', top], ['scrolled', scrolled]]) {
        if (!snap.nav) continue;
        const l = luminance(snap.nav.effectiveBg);
        if (l !== null && l < 0.5) {
          fail(`${route}: navigation (${state}) resolves to dark ${snap.nav.effectiveBg}`);
          darkNav++;
        }
        if (snap.navLink) {
          const ratio = contrast(snap.navLink.color, snap.navLink.effectiveBg);
          if (ratio !== null && ratio < 4.5) {
            fail(
              `${route}: navigation text (${state}) contrast ${ratio.toFixed(2)}:1 — ${snap.navLink.color} on ${snap.navLink.effectiveBg}`
            );
          }
        }
      }
      if (VERBOSE) {
        console.log(
          `  ${route.padEnd(40)} body=${top.body.bg} nav@top=${top.nav?.effectiveBg} nav@scroll=${scrolled.nav?.effectiveBg}`
        );
      }
    }

    // ── 1b. default appearance, OS asking for light ────────────────────────
    for (const route of routes) {
      const { top } = await inspect(page, server.origin, route, { stored: null, scheme: 'light' });
      const l = luminance(top.body.bg);
      if (l !== null && l < 0.5) {
        fail(`${route}: canvas ${top.body.bg} is dark with no preference and OS light`);
        darkCanvas++;
      }
    }

    // ── 2. the generic key must not reach public pages ─────────────────────
    const sample = ['/', '/leistungen', '/bewertungen', '/referenzen', '/ueber-uns', '/kontakt'].filter(
      (r) => routes.includes(r)
    );
    for (const stored of ['dark', 'system']) {
      for (const route of sample) {
        const { top, scrolled } = await inspect(page, server.origin, route, { stored, scheme: 'dark' });

        if (/\bdark\b/.test(top.htmlClass)) {
          fail(`${route}: <html class="${top.htmlClass}"> with generic cogniiq-theme="${stored}"`);
          darkCanvas++;
        }
        const bodyL = luminance(top.body.bg);
        if (bodyL !== null && bodyL < 0.5) {
          fail(`${route}: canvas ${top.body.bg} is dark with generic cogniiq-theme="${stored}"`);
          darkCanvas++;
        }
        for (const [state, snap] of [['top', top], ['scrolled', scrolled]]) {
          const l = snap.nav ? luminance(snap.nav.effectiveBg) : null;
          if (l !== null && l < 0.5) {
            fail(`${route}: navigation (${state}) is dark ${snap.nav.effectiveBg} with cogniiq-theme="${stored}"`);
            darkNav++;
          }
        }
        if (VERBOSE) {
          console.log(`  [${stored}] ${route.padEnd(30)} body=${top.body.bg} nav@scroll=${scrolled.nav?.effectiveBg}`);
        }
      }
    }

    // ── 3. the application must KEEP its own theme ─────────────────────────
    // The hotfix pins the public surface only. If this stops going dark, the fix
    // has overreached and broken the preference a customer explicitly set.
    const privateRoute = '/app/login';
    const { top: privDark } = await inspect(page, server.origin, privateRoute, {
      stored: 'dark',
      scheme: 'dark',
    });
    if (!/\bdark\b/.test(privDark.htmlClass)) {
      fail(`${privateRoute}: explicit dark preference no longer applies (class "${privDark.htmlClass}")`);
    }
    const privL = luminance(privDark.body.bg);
    if (privL === null || privL > 0.3) {
      fail(`${privateRoute}: private dark canvas is ${privDark.body.bg}, expected dark`);
    }
    const { top: privLight } = await inspect(page, server.origin, privateRoute, {
      stored: 'light',
      scheme: 'dark',
    });
    if (/\bdark\b/.test(privLight.htmlClass)) {
      fail(`${privateRoute}: light preference produced "${privLight.htmlClass}"`);
    }
    if (VERBOSE) {
      console.log(`  [private] ${privateRoute} dark=${privDark.body.bg} light=${privLight.body.bg}`);
    }

  } finally {
    await close();
    await server.close();
  }

  if (failures.length) {
    console.error('\n✗ Public theme verification FAILED:');
    for (const f of failures.slice(0, 40)) console.error(`  - ${f}`);
    if (failures.length > 40) console.error(`  … and ${failures.length - 40} more`);
    console.error(`\n  ${darkCanvas} dark-canvas finding(s), ${darkNav} dark-navigation finding(s)`);
    process.exit(1);
  }

  console.log(`  ✓ all ${routes.length} public routes stay light by default, with OS light AND OS dark`);
  console.log('  ✓ public routes stay light with generic cogniiq-theme=dark and =system');
  console.log('  ✓ navigation stays light and readable at the top and after scrolling');
  console.log('  ✓ the application keeps its own explicit dark preference');
  console.log('\n✓ Public theme verification passed.');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
