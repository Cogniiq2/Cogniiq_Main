#!/usr/bin/env node
// =============================================================================
// Admin Center shell QA — real browser, real app, fixtured backend
// =============================================================================
// Drives the actual /admin shell in headless Chromium against a running dev
// server, with every Supabase call intercepted and answered with fixtures, and
// measures the navigation rail at each viewport the owner actually works at.
//
// This is not CSS reasoning. Every assertion reads real geometry out of the live
// DOM — scrollWidth vs. viewport, per-element bounding boxes, computed overflow,
// the painted width of the scrollbar thumb — so a rail that only looks right in
// the source cannot pass.
//
// WHY IT EXISTS
// The rail scrolls inside a Radix ScrollArea rather than a native
// `overflow-y-auto` box. That swap fails in ways no unit test sees:
//   * the viewport stops being a scroll container and the footer is pushed off,
//   * Radix's `display:table` content wrapper collapses every row's width,
//   * the bottom item becomes unreachable,
//   * a row paints outside the rail and is clipped.
// The owner-only Finance module carries the longest sub-navigation in the app,
// so it is the route used to force overflow at short viewport heights.
//
// Uses the repository's dependency-free CDP driver (lib/chromium.mjs) — the same
// one the hydration and public-theme checks use — so this adds no browser
// automation package and never downloads a browser.
//
// KNOWN MEASUREMENT LIMIT: the shared launcher passes --hide-scrollbars, so the
// platform scrollbar gutter cannot be measured here and is not asserted. What IS
// asserted is the structural cause: the <nav> is not a scroll container, Radix's
// viewport is, and the painted custom thumb stays <= 4px.
//
// Not part of the default CI job: it needs a browser and a dev server. Run with
//   node .github/scripts/qa-admin-shell.mjs
// =============================================================================

import { spawn } from 'node:child_process';

import { findChromium, launchChromium } from './lib/chromium.mjs';

const ORIGIN = 'http://127.0.0.1:4321';
const SUPABASE = 'https://qa.supabase.co';
const USER_ID = '11111111-1111-1111-1111-111111111111';

// The viewports the owner works at, plus the two that historically broke:
// 1024x768 (shortest desktop — the rail overflows first here) and 768x1024
// (tablet portrait, the breakpoint band that once had no navigation at all).
const VIEWPORTS = [
  { label: '1440x900', width: 1440, height: 900, rail: 'desktop' },
  { label: '1280x800', width: 1280, height: 800, rail: 'desktop' },
  { label: '1024x768', width: 1024, height: 768, rail: 'desktop' },
  { label: '768x1024', width: 768, height: 1024, rail: 'mobile' },
  { label: '390x844', width: 390, height: 844, rail: 'mobile' },
];

let failures = 0;
const ok = (label) => console.log(`ok: ${label}`);
const bad = (label, detail) => {
  failures += 1;
  console.error(`FAIL: ${label}${detail ? `\n      ${detail}` : ''}`);
};

const chromiumPath = findChromium();
if (!chromiumPath) {
  console.log('no Chrome/Chromium found — skipping admin shell QA');
  process.exit(0);
}

// ------------------------------------------------------------- dev server
function startDevServer() {
  const child = spawn('npx', ['vite', '--host', '127.0.0.1', '--port', '4321', '--strictPort'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      VITE_SUPABASE_URL: SUPABASE,
      VITE_SUPABASE_ANON_KEY: 'qa-anon-key',
      VITE_OURA_CLIENT_ID: 'qa',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    // Own process group: `npx` forks vite, so killing the npx pid alone would
    // leave the server holding the port and the next run would fail to start.
    detached: true,
  });
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('dev server did not start in 90s')), 90_000);
    const onData = (chunk) => {
      const text = String(chunk);
      if (text.includes('ready in') || text.includes('Local:')) {
        clearTimeout(timer);
        setTimeout(() => resolve(child), 1500);
      }
    };
    child.stdout.on('data', onData);
    child.stderr.on('data', (chunk) => process.env.QA_DEBUG && process.stderr.write(chunk));
    child.on('exit', (code) => { clearTimeout(timer); reject(new Error(`dev server exited ${code}`)); });
  });
}

// ------------------------------------------------------------- fixtures
// The shell only needs the account bootstrap to succeed as a PLATFORM OWNER —
// that is what renders the Finance module and its full sub-navigation. Every
// other read answers empty so pages settle into their empty states instead of
// hanging, which keeps the measurements about the shell.
function fixtureFor(url) {
  if (url.includes('/auth/v1/user')) {
    return { id: USER_ID, aud: 'authenticated', email: 'owner@cogniiq.invalid', user_metadata: {}, app_metadata: {} };
  }
  if (url.includes('/auth/v1/token')) {
    return { access_token: 'qa-token', token_type: 'bearer', expires_in: 3600, refresh_token: 'qa-refresh', user: { id: USER_ID, email: 'owner@cogniiq.invalid' } };
  }
  if (url.includes('/rest/v1/profiles')) {
    return {
      id: USER_ID, email: 'owner@cogniiq.invalid', full_name: 'Owner QA',
      platform_role: 'cogniiq_owner', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
    };
  }
  if (url.includes('/rest/v1/organization_members')) return [];
  if (url.includes('/rest/v1/')) return [];
  return {};
}

const b64 = (value) => Buffer.from(value, 'utf8').toString('base64');

async function preparePage(page, viewport, { reducedMotion = false } = {}) {
  const consoleErrors = [];

  await page.send('Page.enable');
  await page.send('Runtime.enable');
  await page.send('Network.enable');

  page.on('Runtime.consoleAPICalled', (event) => {
    if (event.type !== 'error') return;
    const text = (event.args ?? []).map((a) => a.value ?? a.description ?? '').join(' ');
    // Vite's dev noise and the fixtured empty reads say nothing about the shell.
    if (/favicon|Failed to load resource|net::ERR|Download the React DevTools/.test(text)) return;
    consoleErrors.push(text);
  });
  page.on('Runtime.exceptionThrown', (event) => {
    consoleErrors.push(event.exceptionDetails?.exception?.description ?? 'uncaught exception');
  });

  // Intercept every Supabase call. The app must never reach a real backend.
  await page.send('Fetch.enable', { patterns: [{ urlPattern: `${SUPABASE}/*` }] });
  page.on('Fetch.requestPaused', async ({ requestId, request }) => {
    const headers = [
      { name: 'access-control-allow-origin', value: '*' },
      { name: 'access-control-allow-headers', value: '*' },
      { name: 'access-control-allow-methods', value: '*' },
      { name: 'content-type', value: 'application/json' },
    ];
    try {
      if (request.method === 'OPTIONS') {
        await page.send('Fetch.fulfillRequest', { requestId, responseCode: 204, responseHeaders: headers });
        return;
      }
      await page.send('Fetch.fulfillRequest', {
        requestId,
        responseCode: 200,
        responseHeaders: headers,
        body: b64(JSON.stringify(fixtureFor(request.url))),
      });
    } catch {
      /* the page navigated away mid-flight */
    }
  });

  await page.send('Emulation.setDeviceMetricsOverride', {
    width: viewport.width, height: viewport.height, deviceScaleFactor: 1, mobile: viewport.rail === 'mobile',
  });
  await page.send('Emulation.setEmulatedMedia', {
    features: [
      { name: 'prefers-color-scheme', value: 'light' },
      { name: 'prefers-reduced-motion', value: reducedMotion ? 'reduce' : 'no-preference' },
    ],
  });

  // Seed the Supabase session before any app code runs, exactly as a signed-in
  // owner's browser would already hold it.
  await page.send('Page.addScriptToEvaluateOnNewDocument', {
    source: `
      (() => {
        const ref = ${JSON.stringify(SUPABASE)}.split('//')[1].split('.')[0];
        window.localStorage.setItem('sb-' + ref + '-auth-token', JSON.stringify({
          access_token: 'qa-token', token_type: 'bearer', expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: 'qa-refresh',
          user: { id: ${JSON.stringify(USER_ID)}, aud: 'authenticated', email: 'owner@cogniiq.invalid',
                  user_metadata: {}, app_metadata: {}, created_at: '2026-01-01T00:00:00Z' },
        }));
      })();
    `,
  });

  return consoleErrors;
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function evaluate(page, expression, { awaitPromise = false } = {}) {
  const { result, exceptionDetails } = await page.send('Runtime.evaluate', {
    expression, returnByValue: true, awaitPromise,
  });
  if (exceptionDetails) throw new Error(exceptionDetails.exception?.description ?? 'evaluate failed');
  return result.value;
}

/**
 * Navigate and wait for the workspace to actually be on screen.
 *
 * A fixed sleep is not enough: Vite optimises dependencies on the first request
 * of a cold server, which can take ten seconds or more, and a shorter wait made
 * the whole suite report a missing rail rather than a slow one.
 */
async function goto(page, path, { expect = 'aside, header' } = {}) {
  await page.send('Page.navigate', { url: `${ORIGIN}${path}` });
  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    await wait(400);
    const ready = await evaluate(page, `Boolean(document.querySelector(${JSON.stringify(expect)}))`).catch(() => false);
    if (ready) {
      // One more beat so the account block and the sub-navigation have settled.
      await wait(700);
      return;
    }
  }
  throw new Error(`the workspace never rendered at ${path} within 45s`);
}

// --------------------------------------------------------------- probes
const PROBE_OVERFLOW = `(() => {
  const doc = document.scrollingElement;
  const offenders = [];
  if (doc.scrollWidth > doc.clientWidth + 1) {
    for (const el of document.querySelectorAll('body *')) {
      const box = el.getBoundingClientRect();
      if (box.width > 0 && box.right > doc.clientWidth + 1) {
        offenders.push(el.tagName.toLowerCase() + '.' + String(el.className).slice(0, 60) + ' right=' + Math.round(box.right));
        if (offenders.length >= 3) break;
      }
    }
  }
  return { scrollWidth: doc.scrollWidth, clientWidth: doc.clientWidth, offenders };
})()`;

const PROBE_RAIL = `(() => {
  const aside = document.querySelector('aside');
  if (!aside) return { present: false };
  const nav = aside.querySelector('nav');
  const viewport = aside.querySelector('[data-radix-scroll-area-viewport]');
  if (!nav || !viewport) return { present: true, nav: Boolean(nav), viewport: Boolean(viewport) };

  const asideBox = aside.getBoundingClientRect();
  const links = Array.from(viewport.querySelectorAll('a[href]'));
  const navStyle = getComputedStyle(nav);
  const viewStyle = getComputedStyle(viewport);
  const collapse = aside.querySelector('button[aria-expanded]');
  const collapseBox = collapse ? collapse.getBoundingClientRect() : null;

  return {
    present: true, nav: true, viewport: true,
    asideWidth: Math.round(asideBox.width),
    navOverflowY: navStyle.overflowY,
    viewportOverflowY: viewStyle.overflowY,
    overflows: viewport.scrollHeight > viewport.clientHeight + 1,
    linkCount: links.length,
    narrowRows: links.filter((a) => a.getBoundingClientRect().width < asideBox.width * 0.5).length,
    clippedRows: links.filter((a) => {
      const b = a.getBoundingClientRect();
      return b.width > 0 && (b.right > asideBox.right + 1 || b.left < asideBox.left - 1);
    }).length,
    focusableLinks: links.filter((a) => a.tabIndex >= 0).length,
    collapseBottom: collapseBox ? Math.round(collapseBox.bottom) : null,
    windowHeight: window.innerHeight,
  };
})()`;

const PROBE_LAST_ITEM = `(async () => {
  const viewport = document.querySelector('aside [data-radix-scroll-area-viewport]');
  if (!viewport) return { skipped: true };
  if (viewport.scrollHeight <= viewport.clientHeight + 1) return { skipped: true, noOverflow: true };
  viewport.scrollTop = viewport.scrollHeight;
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  const links = Array.from(viewport.querySelectorAll('a[href]'));
  const last = links[links.length - 1];
  const lastBox = last.getBoundingClientRect();
  const viewBox = viewport.getBoundingClientRect();
  return {
    scrolled: Math.round(viewport.scrollTop),
    label: last.textContent.trim(),
    visible: lastBox.top >= viewBox.top - 1 && lastBox.bottom <= viewBox.bottom + 1,
  };
})()`;

const PROBE_THUMB = `(async () => {
  const viewport = document.querySelector('aside [data-radix-scroll-area-viewport]');
  if (!viewport) return { skipped: true };
  if (viewport.scrollHeight <= viewport.clientHeight + 1) return { skipped: true, noOverflow: true };
  const root = viewport.parentElement;
  root.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }));
  root.dispatchEvent(new PointerEvent('pointermove', { bubbles: true }));
  await new Promise((r) => setTimeout(r, 200));
  const thumb = document.querySelector('aside [data-radix-scroll-area-thumb]');
  const bar = document.querySelector('aside [data-radix-scroll-area-scrollbar]');
  return {
    thumbWidth: thumb ? Math.round(thumb.getBoundingClientRect().width) : null,
    barWidth: bar ? Math.round(bar.getBoundingClientRect().width) : null,
  };
})()`;

// -------------------------------------------------------------- assertions
async function assertNoHorizontalOverflow(page, label) {
  const result = await evaluate(page, PROBE_OVERFLOW);
  if (result.scrollWidth > result.clientWidth + 1) {
    bad(`${label}: no horizontal overflow`, `scrollWidth ${result.scrollWidth} > viewport ${result.clientWidth}; offenders: ${result.offenders.join(' | ')}`);
  } else {
    ok(`${label}: no horizontal overflow`);
  }
}

async function assertDesktopRail(page, label) {
  const rail = await evaluate(page, PROBE_RAIL);
  if (!rail.present || !rail.viewport) {
    bad(`${label}: desktop rail renders with a scroll viewport`, JSON.stringify(rail));
    return rail;
  }
  ok(`${label}: desktop rail renders with a scroll viewport (${rail.linkCount} links, overflowing=${rail.overflows})`);

  if (rail.navOverflowY === 'auto' || rail.navOverflowY === 'scroll') {
    bad(`${label}: exactly one scroll container in the rail`, `the <nav> itself is overflow-y:${rail.navOverflowY}`);
  } else {
    ok(`${label}: exactly one scroll container in the rail (<nav> is ${rail.navOverflowY}, viewport is ${rail.viewportOverflowY})`);
  }

  if (rail.narrowRows === 0) ok(`${label}: no navigation row collapsed to intrinsic width`);
  else bad(`${label}: no navigation row collapsed to intrinsic width`, `${rail.narrowRows} row(s) under half the rail width`);

  if (rail.clippedRows === 0) ok(`${label}: no navigation row painted outside the rail`);
  else bad(`${label}: no navigation row painted outside the rail`, `${rail.clippedRows} clipped row(s)`);

  if (rail.collapseBottom !== null && rail.collapseBottom <= rail.windowHeight + 1) {
    ok(`${label}: the rail footer stays on screen (bottom ${rail.collapseBottom} <= ${rail.windowHeight})`);
  } else {
    bad(`${label}: the rail footer stays on screen`, `collapse control bottom ${rail.collapseBottom} vs viewport ${rail.windowHeight}`);
  }

  if (rail.linkCount > 0 && rail.linkCount === rail.focusableLinks) {
    ok(`${label}: all ${rail.linkCount} rail links are in the tab order`);
  } else {
    bad(`${label}: all rail links are in the tab order`, `${rail.focusableLinks}/${rail.linkCount} focusable`);
  }

  const last = await evaluate(page, PROBE_LAST_ITEM, { awaitPromise: true });
  if (last.skipped) ok(`${label}: rail fits without scrolling`);
  else if (last.visible) ok(`${label}: the last navigation item ("${last.label}") is reachable by scrolling`);
  else bad(`${label}: the last navigation item is reachable by scrolling`, `"${last.label}" is still clipped after scrolling ${last.scrolled}px`);

  const thumb = await evaluate(page, PROBE_THUMB, { awaitPromise: true });
  if (thumb.skipped) ok(`${label}: no scrollbar needed`);
  else if (thumb.thumbWidth === null) ok(`${label}: custom thumb stays hidden until hover`);
  else if (thumb.thumbWidth <= 4) ok(`${label}: custom scrollbar thumb is ${thumb.thumbWidth}px inside a ${thumb.barWidth}px hit area`);
  else bad(`${label}: custom scrollbar thumb is slim`, `thumb painted at ${thumb.thumbWidth}px, expected <= 4px`);

  return rail;
}

function reportConsole(consoleErrors, label) {
  if (consoleErrors.length === 0) ok(`${label}: no console errors`);
  else bad(`${label}: no console errors`, consoleErrors.slice(0, 3).join(' | '));
}

// -------------------------------------------------------------------- run
const server = await startDevServer();

try {
  // ---- 1) the shell at every viewport, on the longest sub-navigation ------
  for (const viewport of VIEWPORTS) {
    const browser = await launchChromium(chromiumPath);
    try {
      const consoleErrors = await preparePage(browser.page, viewport);
      await goto(browser.page, '/admin/finance/overview');
      const label = `finance @${viewport.label}`;

      await assertNoHorizontalOverflow(browser.page, label);

      if (viewport.rail === 'desktop') {
        await assertDesktopRail(browser.page, label);
      } else {
        const trigger = await evaluate(browser.page, `Boolean(document.querySelector('header button[aria-expanded]'))`);
        if (trigger) ok(`${label}: mobile navigation trigger is present`);
        else bad(`${label}: mobile navigation trigger is present`, 'no header trigger found');
      }

      reportConsole(consoleErrors, label);
    } finally {
      await browser.close();
    }
  }

  // ---- 2) the mobile drawer opens and lists the navigation ----------------
  {
    const viewport = VIEWPORTS[VIEWPORTS.length - 1];
    const browser = await launchChromium(chromiumPath);
    try {
      await preparePage(browser.page, viewport);
      await goto(browser.page, '/admin/finance/overview');
      await evaluate(browser.page, `document.querySelector('header button[aria-expanded]').click()`);
      await wait(600);
      const drawer = await evaluate(browser.page, `(() => {
        const dialog = document.querySelector('[role="dialog"]');
        if (!dialog) return { open: false };
        const box = dialog.getBoundingClientRect();
        return {
          open: true,
          hasScroller: Boolean(dialog.querySelector('[data-radix-scroll-area-viewport]')),
          links: dialog.querySelectorAll('a[href]').length,
          withinViewport: box.right <= window.innerWidth + 1,
        };
      })()`);
      if (drawer.open && drawer.hasScroller && drawer.links > 0 && drawer.withinViewport) {
        ok(`drawer @${viewport.label}: opens with a scrollable navigation of ${drawer.links} links, inside the viewport`);
      } else {
        bad(`drawer @${viewport.label}: opens with a scrollable navigation inside the viewport`, JSON.stringify(drawer));
      }
      await assertNoHorizontalOverflow(browser.page, `drawer @${viewport.label}`);
    } finally {
      await browser.close();
    }
  }

  // ---- 3) the collapsed rail keeps every destination reachable ------------
  {
    const viewport = VIEWPORTS[2]; // 1024x768 — the shortest desktop
    const browser = await launchChromium(chromiumPath);
    try {
      await preparePage(browser.page, viewport);
      await goto(browser.page, '/admin/finance/overview');
      const before = await evaluate(browser.page, PROBE_RAIL);
      await evaluate(browser.page, `document.querySelector('aside button[aria-expanded]').click()`);
      await wait(700);
      const after = await evaluate(browser.page, PROBE_RAIL);

      if (after.linkCount === before.linkCount) ok(`collapsed @${viewport.label}: all ${after.linkCount} destinations survive the collapse`);
      else bad(`collapsed @${viewport.label}: all destinations survive the collapse`, `${before.linkCount} -> ${after.linkCount}`);

      if (after.asideWidth < before.asideWidth) ok(`collapsed @${viewport.label}: the rail narrows (${before.asideWidth} -> ${after.asideWidth}px)`);
      else bad(`collapsed @${viewport.label}: the rail narrows`, `${before.asideWidth} -> ${after.asideWidth}px`);

      if (after.clippedRows === 0) ok(`collapsed @${viewport.label}: no row painted outside the narrowed rail`);
      else bad(`collapsed @${viewport.label}: no row painted outside the narrowed rail`, `${after.clippedRows} clipped row(s)`);

      await assertNoHorizontalOverflow(browser.page, `collapsed @${viewport.label}`);
    } finally {
      await browser.close();
    }
  }

  // ---- 4) reduced motion: the rail still works, without animation ---------
  {
    const viewport = VIEWPORTS[0];
    const browser = await launchChromium(chromiumPath);
    try {
      const consoleErrors = await preparePage(browser.page, viewport, { reducedMotion: true });
      await goto(browser.page, '/admin/finance/overview');
      const rail = await evaluate(browser.page, PROBE_RAIL);
      if (rail.present && rail.linkCount > 0) ok(`reduced motion @${viewport.label}: the rail renders with all ${rail.linkCount} destinations`);
      else bad(`reduced motion @${viewport.label}: the rail renders`, JSON.stringify(rail));

      const durations = await evaluate(browser.page, `(() => {
        const scope = document.querySelector('[data-cq-surface="dashboard"]');
        if (!scope) return null;
        const style = getComputedStyle(scope);
        return { fast: style.getPropertyValue('--cq-duration-fast').trim(), base: style.getPropertyValue('--cq-duration-base').trim() };
      })()`);
      if (durations && durations.fast === '1ms' && durations.base === '1ms') {
        ok(`reduced motion @${viewport.label}: dashboard motion tokens collapse to 1ms`);
      } else {
        bad(`reduced motion @${viewport.label}: dashboard motion tokens collapse to 1ms`, JSON.stringify(durations));
      }
      reportConsole(consoleErrors, `reduced motion @${viewport.label}`);
    } finally {
      await browser.close();
    }
  }

  // ---- 5) the admin theme scope must not follow the user to the public site
  {
    const browser = await launchChromium(chromiumPath);
    try {
      await preparePage(browser.page, VIEWPORTS[0]);
      await goto(browser.page, '/admin/finance/overview');
      const inside = await evaluate(browser.page, `document.documentElement.getAttribute('data-admin-theme')`);
      if (inside === 'light') ok('admin theme scope: applied while the workspace is mounted');
      else bad('admin theme scope: applied while the workspace is mounted', `got ${inside}`);

      // Client-side navigation back to the marketing site, the way the rail's
      // "Zur Website" link does it. A full page load would prove nothing — the
      // attribute only leaks across an IN-SESSION route change, because that is
      // the only case where <html> survives while the workspace unmounts.
      //
      // Driven through history + popstate rather than by clicking the link: the
      // link lives inside the account dropdown, so a click test would really be
      // testing the dropdown. React Router listens to popstate, so this is a
      // genuine client-side route change through the same router.
      await evaluate(browser.page, `(() => {
        window.history.pushState({}, '', '/');
        window.dispatchEvent(new PopStateEvent('popstate'));
        return true;
      })()`);
      await wait(1500);
      const after = await evaluate(browser.page, `({
        path: window.location.pathname,
        attr: document.documentElement.getAttribute('data-admin-theme'),
      })`);
      if (after.path !== '/') {
        bad('admin theme scope: removed again on the public site', `client-side navigation did not reach / (landed on ${after.path})`);
      } else if (after.attr === null) {
        ok('admin theme scope: removed again on the public site');
      } else {
        bad('admin theme scope: removed again on the public site', `data-admin-theme="${after.attr}" still on <html> at ${after.path}`);
      }
    } finally {
      await browser.close();
    }
  }

  // ---- 6) motion is DECLARED, never inherited
  //
  // src/index.css carries a document-wide `*` rule giving every element a 300ms
  // colour/background/border transition. It predates the dashboard and stays for
  // the public site. The Admin Center opts out of it, so that the only motion
  // inside the workspace is motion a component asked for.
  //
  // Probes are synthetic elements injected into the real scope rather than
  // whichever component happens to be on screen: this asserts the CASCADE, so it
  // cannot start passing (or failing) because a component's classes changed.
  const PROBE_MOTION = `((selector, className) => {
    const scope = document.querySelector(selector);
    if (!scope) return null;
    const probe = document.createElement('div');
    if (className) probe.className = className;
    scope.appendChild(probe);
    const style = getComputedStyle(probe);
    const out = { property: style.transitionProperty, duration: style.transitionDuration };
    probe.remove();
    return out;
  })`;

  /** Chrome reports seconds ("0.14s"); accept either unit. */
  const ms = (value) => {
    if (typeof value !== 'string') return NaN;
    const n = Number.parseFloat(value);
    if (Number.isNaN(n)) return NaN;
    return value.trim().endsWith('ms') ? n : n * 1000;
  };

  {
    const browser = await launchChromium(chromiumPath);
    try {
      await preparePage(browser.page, VIEWPORTS[0]);
      await goto(browser.page, '/admin/finance/overview');

      // A. no explicit transition => no inherited transition at all.
      const bare = await evaluate(browser.page, `${PROBE_MOTION}('[data-cq-surface="dashboard"]', '')`);
      if (bare && bare.property === 'none') {
        ok('motion: an admin element without an explicit transition inherits none');
      } else {
        bad('motion: an admin element without an explicit transition inherits none', JSON.stringify(bare));
      }

      // B. declared dashboard motion still resolves, and to the dashboard band.
      const declared = await evaluate(
        browser.page,
        `${PROBE_MOTION}('[data-cq-surface="dashboard"]', 'transition-colors duration-fast')`
      );
      const declaredMs = ms(declared?.duration);
      if (declared && declared.property !== 'none' && declaredMs >= 140 && declaredMs <= 180) {
        ok(`motion: declared dashboard motion resolves to ${declared.duration} (140-180ms band)`);
      } else {
        bad('motion: declared dashboard motion resolves to the 140-180ms band', JSON.stringify(declared));
      }

      // Stated separately from A because it is the specific regression: whatever
      // else changes, the 300ms blanket must never be what an admin element gets.
      // Inert means either no property to animate, or nothing to wait for.
      const bareIsInert = Boolean(bare) && (bare.property === 'none' || ms(bare.duration) === 0);
      if (bareIsInert) {
        ok('motion: the document-wide 300ms transition does not reach the workspace');
      } else {
        bad('motion: the document-wide 300ms transition does not reach the workspace', JSON.stringify(bare));
      }

      // D. the public site keeps the rule exactly as it was.
      await evaluate(browser.page, `(() => {
        window.history.pushState({}, '', '/');
        window.dispatchEvent(new PopStateEvent('popstate'));
        return true;
      })()`);
      await wait(1500);
      const publicProbe = await evaluate(browser.page, `${PROBE_MOTION}('body', '')`);
      if (
        publicProbe &&
        publicProbe.property.includes('background-color') &&
        ms(publicProbe.duration) === 300
      ) {
        ok('motion: the public site still inherits its 300ms transition (unchanged by this PR)');
      } else {
        bad('motion: the public site still inherits its 300ms transition', JSON.stringify(publicProbe));
      }
    } finally {
      await browser.close();
    }
  }

  // C. reduced motion still collapses DECLARED admin motion.
  {
    const browser = await launchChromium(chromiumPath);
    try {
      await preparePage(browser.page, VIEWPORTS[0], { reducedMotion: true });
      await goto(browser.page, '/admin/finance/overview');
      const reduced = await evaluate(
        browser.page,
        `${PROBE_MOTION}('[data-cq-surface="dashboard"]', 'transition-colors duration-fast')`
      );
      const reducedMs = ms(reduced?.duration);
      if (reduced && reducedMs <= 1) {
        ok(`motion: reduced motion collapses declared admin motion to ${reduced.duration}`);
      } else {
        bad('motion: reduced motion collapses declared admin motion', JSON.stringify(reduced));
      }
    } finally {
      await browser.close();
    }
  }

  // ---- 7) the REAL portal, not a synthetic element in the dashboard root
  //
  // Radix renders the mobile drawer into document.body, so it leaves the
  // [data-cq-surface="dashboard"] subtree entirely and the surface selector cannot
  // reach it. The only thing that brings it back under the dashboard motion rules
  // is the `data-cq-portal="dashboard"` attribute set at the portal site. A
  // synthetic probe inside the dashboard root would pass whether or not that
  // attribute exists, so this opens the actual drawer and measures what Radix put
  // in the DOM.
  const OPEN_DRAWER = `document.querySelector('header button[aria-expanded]').click()`;

  const PROBE_PORTAL = `((className) => {
    const dialog = document.querySelector('[role="dialog"]');
    if (!dialog) return { open: false };
    const overlayStyle = getComputedStyle(dialog);
    // The close button is a REAL component element that declares its own motion.
    const close = dialog.querySelector('button[aria-label]');
    const closeStyle = close ? getComputedStyle(close) : null;
    // Two children: one bare (must inherit nothing) and one that declares motion
    // (must still resolve). Measuring only one of them cannot tell the two apart.
    const bare = document.createElement('div');
    dialog.appendChild(bare);
    const bareStyle = getComputedStyle(bare);
    const declared = document.createElement('div');
    if (className) declared.className = className;
    dialog.appendChild(declared);
    const declaredStyle = getComputedStyle(declared);
    const out = {
      open: true,
      // Proof it really escaped the surface subtree.
      escapedSurface: dialog.closest('[data-cq-surface="dashboard"]') === null,
      markedAsDashboardPortal: dialog.getAttribute('data-cq-portal') === 'dashboard',
      dialog: { property: overlayStyle.transitionProperty, duration: overlayStyle.transitionDuration },
      realCloseButton: closeStyle
        ? { property: closeStyle.transitionProperty, duration: closeStyle.transitionDuration }
        : null,
      bareChild: { property: bareStyle.transitionProperty, duration: bareStyle.transitionDuration },
      declaredChild: { property: declaredStyle.transitionProperty, duration: declaredStyle.transitionDuration },
    };
    bare.remove();
    declared.remove();
    return out;
  })`;

  {
    const viewport = VIEWPORTS[VIEWPORTS.length - 1]; // 390x844 — the drawer viewport
    const browser = await launchChromium(chromiumPath);
    try {
      await preparePage(browser.page, viewport);
      await goto(browser.page, '/admin/finance/overview');
      await evaluate(browser.page, OPEN_DRAWER);
      await wait(700);
      const portal = await evaluate(browser.page, `${PROBE_PORTAL}('transition-colors duration-fast')`);

      if (!portal || !portal.open) {
        bad('portal: the mobile drawer opens as a real Radix portal', JSON.stringify(portal));
      } else {
        if (portal.escapedSurface) {
          ok('portal: the drawer really is outside the dashboard surface subtree');
        } else {
          bad('portal: the drawer really is outside the dashboard surface subtree', 'it did not escape — this probe would prove nothing');
        }

        if (portal.markedAsDashboardPortal) {
          ok('portal: the portaled drawer carries data-cq-portal="dashboard"');
        } else {
          bad('portal: the portaled drawer carries data-cq-portal="dashboard"', JSON.stringify(portal));
        }

        // A — the real portaled node, and a bare child of it, inherit nothing.
        if (portal.dialog.property === 'none' && portal.bareChild.property === 'none') {
          ok('portal: a real portaled element inherits no transition');
        } else {
          bad('portal: a real portaled element inherits no transition', JSON.stringify(portal));
        }

        // B — declared motion inside the real portal still resolves, and in band.
        const declaredMs = ms(portal.declaredChild?.duration);
        if (portal.declaredChild.property !== 'none' && declaredMs >= 140 && declaredMs <= 180) {
          ok(`portal: declared motion inside the real portal resolves to ${portal.declaredChild.duration}`);
        } else {
          bad('portal: declared motion inside the real portal resolves to the 140-180ms band', JSON.stringify(portal.declaredChild));
        }

        // B — a real component element inside the portal that DOES declare motion.
        const closeMs = ms(portal.realCloseButton?.duration);
        if (portal.realCloseButton && portal.realCloseButton.property !== 'none' && closeMs > 0 && closeMs <= 200) {
          ok(`portal: the drawer close button keeps its declared ${portal.realCloseButton.duration} transition`);
        } else {
          bad('portal: the drawer close button keeps its declared transition', JSON.stringify(portal.realCloseButton));
        }
      }
    } finally {
      await browser.close();
    }
  }

  // C for the real portal — reduced motion must reach it too.
  {
    const viewport = VIEWPORTS[VIEWPORTS.length - 1];
    const browser = await launchChromium(chromiumPath);
    try {
      await preparePage(browser.page, viewport, { reducedMotion: true });
      await goto(browser.page, '/admin/finance/overview');
      await evaluate(browser.page, OPEN_DRAWER);
      await wait(700);
      const portal = await evaluate(browser.page, `${PROBE_PORTAL}('transition-colors duration-fast')`);
      const childMs = ms(portal?.declaredChild?.duration);
      if (portal && portal.open && childMs <= 1) {
        ok(`portal: reduced motion collapses declared portal motion to ${portal.declaredChild.duration}`);
      } else {
        bad('portal: reduced motion collapses declared portal motion', JSON.stringify(portal));
      }
    } finally {
      await browser.close();
    }
  }

  // D — a public page must not carry dashboard portal scoping at all.
  {
    const browser = await launchChromium(chromiumPath);
    try {
      await preparePage(browser.page, VIEWPORTS[0]);
      await goto(browser.page, '/', { expect: 'footer' });
      const publicScope = await evaluate(browser.page, `({
        dashboardPortals: document.querySelectorAll('[data-cq-portal]').length,
        dashboardSurfaces: document.querySelectorAll('[data-cq-surface]').length,
      })`);
      if (publicScope.dashboardPortals === 0 && publicScope.dashboardSurfaces === 0) {
        ok('portal: the public site carries no dashboard portal or surface scoping');
      } else {
        bad('portal: the public site carries no dashboard portal or surface scoping', JSON.stringify(publicScope));
      }
    } finally {
      await browser.close();
    }
  }
} finally {
  try { process.kill(-server.pid, 'SIGTERM'); } catch { server.kill('SIGTERM'); }
}

console.log('');
console.log(failures === 0 ? 'admin shell QA: ALL PASSED' : `admin shell QA: ${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
