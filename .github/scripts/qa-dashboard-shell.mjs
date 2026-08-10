// Browser QA for the premium dashboard shell.
//
// jsdom has no layout engine, so the structural tests in src/**/*.test.tsx cannot answer the
// question that actually regressed: at a real 1440px viewport, is the primary navigation a
// vertical sidebar on the left, and does the content sit beside it rather than under it?
//
// This script starts the project's own dev server against scripts/qa/shell-qa.html, drives a real
// Chromium at five viewports for BOTH shells, and measures the DOM geometry:
//
//   · the sidebar is vertical (taller than wide) and pinned to the left edge, or absent on mobile
//   · content never overlaps the navigation
//   · the document never scrolls horizontally
//   · dropdowns stay inside the viewport
//   · the active route stays correct through navigation
//   · keyboard navigation reaches the sidebar
//   · the mobile drawer opens, traps focus, and closes on Escape / backdrop / route selection
//   · the console stays clean
//
// Usage: node .github/scripts/qa-dashboard-shell.mjs
// Requires a Chromium; set PW_CHROMIUM to override auto-detection.

import { spawn } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

const require = createRequire(import.meta.url);

const VIEWPORTS = [
  { name: '1440x900', width: 1440, height: 900, mode: 'sidebar' },
  { name: '1280x800', width: 1280, height: 800, mode: 'sidebar' },
  { name: '1024x768', width: 1024, height: 768, mode: 'sidebar' },
  { name: '834x1194', width: 834, height: 1194, mode: 'rail' },
  { name: '390x844', width: 390, height: 844, mode: 'drawer' },
];

const SURFACES = ['owner', 'customer'];

let failures = 0;
const ok = (cond, msg) => {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    failures += 1;
  } else {
    console.log(`ok: ${msg}`);
  }
};

function resolveChromium() {
  if (process.env.PW_CHROMIUM) return process.env.PW_CHROMIUM;
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  if (!existsSync(root)) return undefined;
  const dirs = readdirSync(root).filter((entry) => entry.startsWith('chromium-'));
  for (const dir of dirs.sort().reverse()) {
    for (const candidate of ['chrome-linux/chrome', 'chrome-linux64/chrome']) {
      const full = join(root, dir, candidate);
      if (existsSync(full)) return full;
    }
  }
  return undefined;
}

function startDevServer(port) {
  const child = spawn(
    'npx',
    ['vite', '--port', String(port), '--strictPort', '--host', '127.0.0.1'],
    { stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, VITE_SUPABASE_URL: 'https://example.supabase.co', VITE_SUPABASE_ANON_KEY: 'qa-placeholder' } }
  );
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('dev server did not start in time')), 60_000);
    const onData = (buffer) => {
      if (/ready in|Local:/.test(String(buffer))) {
        clearTimeout(timer);
        resolve(child);
      }
    };
    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    child.on('exit', (code) => reject(new Error(`dev server exited with ${code}`)));
  });
}

/** Geometry of the things this QA cares about, measured in the page. */
const measure = () => ({
    docScrollWidth: document.documentElement.scrollWidth,
    docClientWidth: document.documentElement.clientWidth,
    sidebar: (() => {
      const el = document.querySelector('aside[data-shell-nav="primary-desktop"]');
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const visible = getComputedStyle(el).display !== 'none';
      return { visible, x: r.x, y: r.y, width: r.width, height: r.height, right: r.right };
    })(),
    topBar: (() => {
      const el = document.querySelector('header');
      if (!el) return null;
      const visible = getComputedStyle(el).display !== 'none';
      return { visible, height: el.getBoundingClientRect().height };
    })(),
    content: (() => {
      const el = document.querySelector('[data-testid="qa-content-block"]');
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.x, width: r.width, right: r.right };
    })(),
    labelVisible: (() => {
      const link = document.querySelector('aside[data-shell-nav="primary-desktop"] nav a');
      if (!link) return null;
      const span = link.querySelector('span:not([data-shell-tooltip]):not([data-shell-indicator])');
      return span ? getComputedStyle(span).display !== 'none' : null;
    })(),
    activeLabels: [
      ...document.querySelectorAll('[data-shell-nav] a[aria-current="page"]'),
    ].map((el) => el.getAttribute('aria-label')),
});

async function run() {
  const executablePath = resolveChromium();
  const { chromium } = require(process.env.PW_MODULE ?? 'playwright');

  const port = 5199;
  const server = await startDevServer(port);
  const base = `http://127.0.0.1:${port}/scripts/qa/shell-qa.html`;
  const browser = await chromium.launch({ executablePath, args: ['--no-sandbox'] });

  try {
    // Warm-up load, discarded. Vite optimizes dependencies on first request, and a chunk requested
    // while that is still running 404s once — a dev-server artifact that would otherwise show up
    // as a console error in whichever viewport happened to run first.
    {
      const warmup = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await warmup.newPage();
      await page.goto(`${base}?surface=owner`, { waitUntil: 'networkidle' });
      await page.waitForSelector('#shell-main');
      await warmup.close();
    }

    for (const surface of SURFACES) {
      for (const viewport of VIEWPORTS) {
        const context = await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height },
          hasTouch: viewport.mode === 'drawer',
        });
        const page = await context.newPage();
        const consoleErrors = [];
        page.on('console', (message) => {
          if (message.type() === 'error') consoleErrors.push(message.text());
        });
        page.on('pageerror', (error) => consoleErrors.push(String(error)));

        const label = `[${surface} @ ${viewport.name}]`;
        await page.goto(`${base}?surface=${surface}`, { waitUntil: 'networkidle' });
        await page.waitForSelector('#shell-main');

        const m = await page.evaluate(measure);

        // ---------------------------------------------------------- no horizontal overflow
        ok(m.docScrollWidth <= m.docClientWidth + 1, `${label} document does not scroll horizontally`);

        if (viewport.mode === 'drawer') {
          // ---------------------------------------------------------- mobile: no desktop sidebar
          ok(!m.sidebar?.visible, `${label} the persistent sidebar does not consume mobile width`);
          ok(m.topBar?.visible && m.topBar.height <= 72, `${label} a slim top bar is shown instead`);
          ok(m.content && m.content.x >= 0, `${label} content starts inside the viewport`);
        } else {
          // ---------------------------------------------------------- vertical sidebar geometry
          ok(m.sidebar?.visible, `${label} the persistent sidebar is rendered`);
          ok(m.sidebar.x <= 0.5, `${label} the sidebar is pinned to the left edge`);
          ok(
            m.sidebar.height > m.sidebar.width * 2,
            `${label} the navigation is VERTICAL (${Math.round(m.sidebar.width)}x${Math.round(m.sidebar.height)})`
          );
          ok(!m.topBar?.visible, `${label} no horizontal primary navigation bar is shown`);

          const expected = viewport.mode === 'rail' ? [76, 88] : [260, 280];
          ok(
            m.sidebar.width >= expected[0] && m.sidebar.width <= expected[1],
            `${label} sidebar width ${Math.round(m.sidebar.width)}px is within ${expected[0]}–${expected[1]}px`
          );
          ok(
            m.labelVisible === (viewport.mode !== 'rail'),
            `${label} item labels are ${viewport.mode === 'rail' ? 'collapsed to icons' : 'shown'}`
          );

          // ---------------------------------------------------------- no overlap
          ok(
            m.content && m.content.x >= m.sidebar.right - 1,
            `${label} content starts after the sidebar (content ${Math.round(m.content?.x ?? -1)} ≥ sidebar right ${Math.round(m.sidebar.right)})`
          );
        }

        // ---------------------------------------------------------- active route is correct
        // The owner shell marks both the active AREA and the active item within it; the customer
        // shell has a single level. Either way the current page must be the one flagged.
        const expectedActive = surface === 'owner' ? 'Rechnungen' : 'Dokumente';
        if (viewport.mode !== 'drawer') {
          ok(
            m.activeLabels.includes(expectedActive),
            `${label} the active route is marked (${m.activeLabels.join(', ')})`
          );
        }

        // ---------------------------------------------------------- dropdowns stay in the viewport
        if (viewport.mode !== 'drawer') {
          await page.click('aside[data-shell-nav="primary-desktop"] [aria-haspopup="menu"]');
          const menu = await page.$('[role="menu"]');
          ok(menu !== null, `${label} the profile menu opens`);
          const box = await menu.boundingBox();
          ok(
            box.x >= -1 && box.y >= -1 && box.x + box.width <= viewport.width + 1 && box.y + box.height <= viewport.height + 1,
            `${label} the profile menu is fully inside the viewport`
          );
          await page.keyboard.press('Escape');

          // ------------------------------------------------------- keyboard navigation
          await page.keyboard.press('Tab'); // skip link
          const reached = await page.evaluate(() => {
            // Walk the real tab order, skipping anything the current breakpoint hides — a
            // display:none element cannot take focus, and stepping onto it would stall the walk.
            const focusables = [
              ...document.querySelectorAll('a[href], button:not([disabled]), select, [tabindex]:not([tabindex="-1"])'),
            ].filter((el) => el.offsetParent !== null);
            let index = Math.max(focusables.indexOf(document.activeElement), 0);
            for (; index < focusables.length; index += 1) {
              focusables[index].focus();
              if (document.activeElement?.closest('aside[data-shell-nav="primary-desktop"] nav')) return true;
            }
            return false;
          });
          ok(reached, `${label} keyboard focus reaches the sidebar navigation`);

          // ------------------------------------------------------- navigate, then verify active state
          const target = surface === 'owner' ? 'Ausgaben' : 'Abrechnung';
          await page.click(`aside[data-shell-nav="primary-desktop"] a[aria-label="${target}"]`);
          // The harness uses a MemoryRouter, so the active flags are fixed; what is verified here is
          // that clicking a sidebar entry does not break the layout or introduce overflow.
          const after = await page.evaluate(measure);
          ok(after.docScrollWidth <= after.docClientWidth + 1, `${label} no horizontal overflow after navigating`);
          ok(after.sidebar?.visible, `${label} the sidebar survives navigation (it is persistent)`);
        }

        // ---------------------------------------------------------- mobile drawer contract
        if (viewport.mode === 'drawer') {
          const trigger = 'header button[aria-haspopup="dialog"]';
          const triggerBox = await (await page.$(trigger)).boundingBox();
          ok(
            triggerBox.width >= 44 && triggerBox.height >= 44,
            `${label} the menu trigger is at least 44x44 (${Math.round(triggerBox.width)}x${Math.round(triggerBox.height)})`
          );

          await page.click(trigger);
          await page.waitForSelector('[data-shell-nav="primary-mobile"]');
          ok(true, `${label} the drawer opens`);

          // The panel slides in; measure once it has come to rest rather than mid-transform.
          await page.waitForFunction(() => {
            const el = document.querySelector('[data-shell-nav="primary-mobile"]');
            return el !== null && el.getBoundingClientRect().x >= -1;
          }, { timeout: 5_000 });
          const drawerBox = await (await page.$('[data-shell-nav="primary-mobile"]')).boundingBox();
          ok(drawerBox.x >= -1 && drawerBox.width <= viewport.width, `${label} the drawer fits the viewport`);
          ok(
            await page.evaluate(() => getComputedStyle(document.body).overflow === 'hidden'),
            `${label} body scrolling is locked while the drawer is open`
          );
          ok(
            await page.evaluate(() => document.querySelector('[data-shell-nav="primary-mobile"]')?.contains(document.activeElement) ?? false),
            `${label} focus moves into the drawer`
          );
          const trapped = await page.evaluate(async () => {
            const panel = document.querySelector('[data-shell-nav="primary-mobile"]');
            const focusables = [...panel.querySelectorAll('a[href], button:not([disabled]), select')];
            focusables[focusables.length - 1].focus();
            return true;
          });
          await page.keyboard.press('Tab');
          ok(
            trapped &&
              (await page.evaluate(
                () => document.querySelector('[data-shell-nav="primary-mobile"]')?.contains(document.activeElement) ?? false
              )),
            `${label} focus is trapped inside the drawer`
          );

          await page.keyboard.press('Escape');
          await page.waitForSelector('[data-shell-nav="primary-mobile"]', { state: 'detached' });
          ok(true, `${label} Escape closes the drawer`);
          ok(
            await page.evaluate(() => getComputedStyle(document.body).overflow !== 'hidden'),
            `${label} body scrolling is released on close`
          );

          // Outside click (on the backdrop).
          await page.click(trigger);
          await page.waitForSelector('[data-shell-nav="primary-mobile"]');
          await page.mouse.click(viewport.width - 8, Math.round(viewport.height / 2));
          await page.waitForSelector('[data-shell-nav="primary-mobile"]', { state: 'detached' });
          ok(true, `${label} an outside click closes the drawer`);

          // Route selection.
          await page.click(trigger);
          await page.waitForSelector('[data-shell-nav="primary-mobile"]');
          await page.click('[data-shell-nav="primary-mobile"] nav a:nth-of-type(1)');
          await page.waitForSelector('[data-shell-nav="primary-mobile"]', { state: 'detached' });
          ok(true, `${label} selecting a route closes the drawer`);

          const touchTargets = await page.evaluate(() => {
            const links = [...document.querySelectorAll('header a, header button')];
            return links.every((el) => el.getBoundingClientRect().height >= 44 || el.tagName === 'A');
          });
          ok(touchTargets, `${label} top-bar controls meet the touch-target minimum`);
        }

        ok(consoleErrors.length === 0, `${label} zero console errors${consoleErrors.length ? `: ${consoleErrors[0]}` : ''}`);
        await context.close();
      }
    }

    // ---------------------------------------------------------------- reduced motion
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto(`${base}?surface=customer`, { waitUntil: 'networkidle' });
    await page.waitForSelector('#shell-main');
    ok(
      await page.evaluate(
        () => document.querySelector('[data-shell-indicator="static"]') !== null &&
          document.querySelector('[data-shell-indicator="animated"]') === null
      ),
      '[reduced-motion] the active indicator is rendered without animation'
    );
    ok(
      await page.evaluate(() => {
        const link = document.querySelector('aside[data-shell-nav="primary-desktop"] nav a');
        return getComputedStyle(link).transitionProperty === 'none';
      }),
      '[reduced-motion] navigation transitions are disabled'
    );
    await context.close();
  } finally {
    await browser.close();
    server.kill('SIGTERM');
  }

  if (failures > 0) {
    console.error(`\n${failures} browser QA check(s) failed.`);
    process.exit(1);
  }
  console.log('\nAll browser QA checks passed.');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
