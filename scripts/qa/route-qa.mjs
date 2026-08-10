// Route-level browser QA for the Owner Dashboard and Customer Portal.
//
// Renders the real production build against the deterministic fixture layer in
// ./fixtures, so every listed route can be inspected in a POPULATED state — plus its
// empty and error states — without reading from or writing to hosted Supabase.
//
// The harness fails (exit 1) when:
//   - a route stays permanently in a skeleton state,
//   - a route's populated run renders no content,
//   - a console error or page error occurs,
//   - the document overflows horizontally at any viewport,
//   - an open option row is under the 44px mobile minimum,
//   - an RPC or table the page needs has no fixture (surfaced as PGRST202/PGRST205).
//
// Usage:
//   npm run build && npx vite preview --port 4173 &
//   node scripts/qa/route-qa.mjs --out qa-screenshots
//
// Playwright is intentionally NOT a package.json dependency: this is a development tool,
// not part of the build, and CI does not invoke it. Run it where playwright is available.

import { chromium } from 'playwright';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { installFixtures } from './fixtures/index.mjs';
import { ID } from './fixtures/ids.mjs';
import {
  classifyRouteState,
  isAcceptable,
  overflowFinding,
  rejectionReason,
  touchTargetFinding,
} from './detectors.mjs';

const argOf = (flag, fallback) => {
  const i = process.argv.indexOf(flag);
  return i > -1 ? process.argv[i + 1] : fallback;
};

const OUT = argOf('--out', 'qa-screenshots');
const BASE = process.env.QA_BASE_URL ?? 'http://127.0.0.1:4173';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? 'https://example.supabase.co';
const ONLY = argOf('--only', null);

mkdirSync(OUT, { recursive: true });

/* ------------------------------------------------------------------ route table */

// The fifteen owner routes and eight customer routes under review. `key` is the
// screenshot/report identifier; `label` is how the route is named in the matrix.
const OWNER_ROUTES = [
  { key: 'owner-01-dashboard', label: 'Dashboard overview', path: '/admin/finance' },
  { key: 'owner-02-kunden', label: 'Kunden list', path: '/admin/clients' },
  { key: 'owner-03-customer-detail', label: 'Customer detail', path: `/admin/clients/${ID.orgA}` },
  { key: 'owner-04-kundenportal', label: 'Kundenportal tab', path: `/admin/clients/${ID.orgA}`, tab: 'Kundenportal' },
  { key: 'owner-05-project-mgmt', label: 'Customer project management', path: `/admin/clients/${ID.orgA}`, tab: 'Kundenportal' },
  { key: 'owner-06-angebote', label: 'Angebote list', path: '/admin/finance/offers' },
  { key: 'owner-07-offer-detail', label: 'Offer detail and editor', path: `/admin/finance/offers/${ID.offerA}` },
  { key: 'owner-08-rechnungen', label: 'Rechnungen list', path: '/admin/finance/invoices' },
  { key: 'owner-09-invoice-detail', label: 'Invoice detail and editor', path: `/admin/finance/invoices/${ID.invoiceA}` },
  { key: 'owner-10-documents', label: 'Document registration/publishing', path: `/admin/clients/${ID.orgA}`, tab: 'Kundenportal' },
  { key: 'owner-11-kunden-aufgaben', label: 'Kunden & Aufgaben', path: '/admin/finance/customers' },
  { key: 'owner-12-expenses', label: 'Expenses and finance tables', path: '/admin/finance/expenses' },
  { key: 'owner-13-oura', label: 'Oura Analytics', path: '/admin/oura-analytics' },
  { key: 'owner-14-execution', label: 'Execution', path: '/admin/execution' },
  { key: 'owner-15-settings', label: 'Settings and operational forms', path: '/admin/finance/settings' },
];

const CUSTOMER_ROUTES = [
  { key: 'customer-01-portal', label: 'Portal overview', path: '/app' },
  { key: 'customer-02-project', label: 'Project detail', path: `/app/projects/${ID.projectA}` },
  { key: 'customer-03-milestones', label: 'Milestones', path: `/app/projects/${ID.projectA}`, hash: '#meilensteine' },
  { key: 'customer-04-documents', label: 'Documents', path: '/app/documents' },
  { key: 'customer-05-billing', label: 'Billing', path: '/app/billing' },
  { key: 'customer-06-solutions', label: 'Solutions', path: '/app/solutions' },
  // Static surfaces: they issue no query, so there is no error state to reach. Recorded
  // as n/a rather than silently passed or falsely failed.
  { key: 'customer-07-support', label: 'Support', path: '/app/support', errorState: 'n/a' },
  { key: 'customer-08-settings', label: 'Settings', path: '/app/settings', errorState: 'n/a' },
  // The seven receptionist surfaces. They read and write the portal-persistence tables
  // rather than the customer RPCs, and four of them are deliberately "In Vorbereitung" —
  // so their honest state is a labelled surface, never a spinner or a fake table.
  { key: 'customer-09-onboarding', label: 'Receptionist onboarding', path: '/app/onboarding', errorState: 'n/a' },
  { key: 'customer-10-receptionist', label: 'Receptionist profile', path: '/app/receptionist', errorState: 'n/a' },
  { key: 'customer-11-knowledge', label: 'Knowledge base', path: '/app/knowledge', errorState: 'n/a' },
  { key: 'customer-12-phone', label: 'Phone setup', path: '/app/phone', errorState: 'n/a' },
  { key: 'customer-13-test', label: 'Test call', path: '/app/test', errorState: 'n/a' },
  { key: 'customer-14-calls', label: 'Calls', path: '/app/calls', errorState: 'n/a' },
  { key: 'customer-15-leads', label: 'Leads', path: '/app/leads', errorState: 'n/a' },
  { key: 'customer-16-solution', label: 'Solution instance', path: '/app/solutions/ai-receptionist-musterbau', errorState: 'n/a' },
];

// The five viewports the portal is signed off at. `name` is the matrix column, so the
// three original columns keep their meaning and the two added widths report separately.
const VIEWPORTS = [
  { name: 'desktop', id: '1440x900', viewport: { width: 1440, height: 900 } },
  { name: 'desktopNarrow', id: '1280x800', viewport: { width: 1280, height: 800 } },
  { name: 'tablet', id: '1024x768', viewport: { width: 1024, height: 768 } },
  { name: 'tabletPortrait', id: '834x1194', viewport: { width: 834, height: 1194 } },
  { name: 'mobile', id: '390x844', viewport: { width: 390, height: 844 } },
];

/* ------------------------------------------------------------------ page probes */

// Selectors the product actually uses for each state. Kept here rather than in the
// detector so the detector stays a pure function over the resulting numbers.
const PROBE = `(() => {
  const skeletons = document.querySelectorAll('[data-qa="skeleton"], .animate-pulse');
  const main = document.querySelector('main') ?? document.body;
  const clone = main.cloneNode(true);
  clone.querySelectorAll(
    'nav, header, script, style, [data-qa="skeleton"], .animate-pulse, '
    + '[data-qa="empty-state"], [data-qa="error-state"], [role="alert"]',
  ).forEach((el) => el.remove());
  const text = (clone.textContent ?? '').replace(/\\s+/g, ' ').trim();
  return {
    skeletonCount: skeletons.length,
    contentTextLength: text.length,
    hasEmptyState: !!document.querySelector('[data-qa="empty-state"]'),
    hasErrorState: !!document.querySelector('[data-qa="error-state"], [role="alert"]'),
    overflowPx: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  };
})()`;

/* ------------------------------------------------------------------ run */

const findings = [];
const matrix = new Map(); // key -> record

function recordFor(route) {
  if (!matrix.has(route.key)) {
    matrix.set(route.key, {
      key: route.key,
      label: route.label,
      path: route.path,
      populated: false,
      empty: false,
      error: false,
      desktop: false,
      desktopNarrow: false,
      tablet: false,
      tabletPortrait: false,
      mobile: false,
      screenshots: [],
      states: {},
    });
  }
  return matrix.get(route.key);
}

async function visit(page, route) {
  const url = `${BASE}${route.path}${route.hash ?? ''}`;
  await page.goto(url, { waitUntil: 'domcontentloaded' }).catch(() => {});
  // Give the app's queries a bounded window to resolve. Deliberately not `networkidle`:
  // under the `loading` scenario a request never settles, and networkidle would hang.
  await page.waitForTimeout(1200);
  if (route.tab) {
    const tab = page.getByRole('tab', { name: route.tab }).or(page.getByRole('button', { name: route.tab }));
    if (await tab.count()) {
      await tab.first().click({ timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(600);
    }
  }
}

async function captureRoute(page, route, scenario, vp) {
  await visit(page, route);
  const snapshot = await page.evaluate(PROBE);
  const state = classifyRouteState(snapshot);
  const record = recordFor(route);
  record.states[`${scenario}/${vp.name}`] = state;

  const overflow = overflowFinding(route.key, vp.id, snapshot.overflowPx);
  if (overflow) findings.push(overflow);

  if (scenario === 'error' && route.errorState === 'n/a') {
    record.error = 'n/a';
    return null;
  }

  if (!isAcceptable(scenario, state)) {
    findings.push(rejectionReason(route.key, scenario, state));
    return null;
  }

  record[scenario] = true;
  record[vp.name] = true;

  const file = `${route.key}-${scenario}-${vp.name}.png`;
  await page.screenshot({ path: resolve(OUT, file), fullPage: false });
  record.screenshots.push(file);
  return file;
}

async function runRole(browser, role, routes) {
  for (const scenario of ['populated', 'empty', 'error']) {
    // Empty and error are only meaningful once; capturing them at three viewports
    // triples the run for no additional evidence.
    const viewports = scenario === 'populated' ? VIEWPORTS : [VIEWPORTS[0]];

    for (const vp of viewports) {
      const context = await browser.newContext({ viewport: vp.viewport, deviceScaleFactor: 1 });
      await installFixtures(context, { role, scenario, supabaseUrl: SUPABASE_URL });

      const page = await context.newPage();
      page.on('console', (msg) => {
        if (msg.type() !== 'error') return;
        const text = msg.text();
        // A forced-error scenario legitimately logs the error it was asked to produce.
        if (scenario === 'error') return;
        findings.push(`CONSOLE ${role}/${scenario} @ ${vp.id}: ${text.slice(0, 200)}`);
      });
      page.on('pageerror', (err) => {
        findings.push(`PAGEERROR ${role}/${scenario} @ ${vp.id}: ${String(err).slice(0, 200)}`);
      });

      for (const route of routes) {
        if (ONLY && !route.key.includes(ONLY)) continue;
        await captureRoute(page, route, scenario, vp);
      }

      // Dropdown inspection: open the first combobox on each populated desktop route and
      // check the option rows clear the 44px minimum and are not clipped.
      if (scenario === 'populated' && vp.name === 'desktop') {
        for (const route of routes) {
          if (ONLY && !route.key.includes(ONLY)) continue;
          await visit(page, route);
          const trigger = page.getByRole('combobox').first();
          if (!(await trigger.count())) continue;
          await trigger.click({ timeout: 3000 }).catch(() => {});
          await page.waitForTimeout(350);
          if (!(await page.getByRole('listbox').count())) {
            await page.keyboard.press('Escape').catch(() => {});
            continue;
          }
          const short = await page.evaluate(() =>
            Array.from(document.querySelectorAll('[role="option"]'))
              .map((el) => el.getBoundingClientRect().height)
              .filter((h) => h > 0 && h < 44).length);
          const finding = touchTargetFinding(route.key, short);
          if (finding) findings.push(finding);

          const file = `${route.key}-dropdown-desktop.png`;
          await page.screenshot({ path: resolve(OUT, file), fullPage: false });
          recordFor(route).screenshots.push(file);
          await page.keyboard.press('Escape').catch(() => {});
        }
      }

      await context.close();
    }
  }
}

function writeReport() {
  const rows = [...matrix.values()];
  const header = '| Route | Path | Populated | Empty | Error | 1440 | 1280 | 1024 | 834 | 390 | Screenshots |';
  const sep = '|---|---|---|---|---|---|---|---|---|---|---|';
  const yn = (b) => (b === 'n/a' ? 'n/a' : b ? 'yes' : 'NO');
  const body = rows.map((r) =>
    `| ${r.label} | \`${r.path}\` | ${yn(r.populated)} | ${yn(r.empty)} | ${yn(r.error)} | `
    + `${yn(r.desktop)} | ${yn(r.desktopNarrow)} | ${yn(r.tablet)} | ${yn(r.tabletPortrait)} | ${yn(r.mobile)} | `
    + `${r.screenshots.join('<br>') || '—'} |`);

  const report = [
    '# Route QA matrix',
    '',
    `Base: ${BASE}`,
    `Generated: ${new Date().toISOString()}`,
    '',
    header, sep, ...body,
    '',
    '## Findings',
    '',
    findings.length ? findings.map((f) => `- ${f}`).join('\n') : 'None.',
    '',
  ].join('\n');

  writeFileSync(resolve(OUT, 'route-qa-report.md'), report, 'utf8');
  writeFileSync(resolve(OUT, 'route-qa-report.json'), JSON.stringify({ rows, findings }, null, 2), 'utf8');
  return { rows, report };
}

/**
 * The pinned Chromium of whatever Playwright build is installed may not be present, but a
 * full Chromium usually is. Prefer an explicit PW_CHROMIUM, then the newest chromium-* in
 * PLAYWRIGHT_BROWSERS_PATH, and fall back to Playwright's own resolution.
 */
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

async function main() {
  const browser = await chromium.launch({ executablePath: resolveChromium(), args: ['--no-sandbox'] });
  try {
    await runRole(browser, 'owner', OWNER_ROUTES);
    await runRole(browser, 'customer', CUSTOMER_ROUTES);
  } finally {
    await browser.close();
  }

  const { rows } = writeReport();
  const missingPopulated = rows.filter((r) => !r.populated).map((r) => r.label);

  console.log(`\nRoutes inspected: ${rows.length}`);
  console.log(`Screenshots: ${rows.reduce((n, r) => n + r.screenshots.length, 0)} in ${OUT}`);
  if (missingPopulated.length) {
    console.log(`\nNO POPULATED CAPTURE (${missingPopulated.length}):\n  ${missingPopulated.join('\n  ')}`);
  }
  if (findings.length) {
    console.log(`\nFINDINGS (${findings.length}):`);
    for (const f of findings) console.log(`  ${f}`);
  }

  // The gate: every listed route must have rendered populated, with no findings.
  if (missingPopulated.length || findings.length) process.exit(1);
  console.log('\nAll routes rendered populated; no findings.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
