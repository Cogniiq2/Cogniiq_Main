// Customer Portal browser QA.
//
// Renders the real production build against the deterministic fixture layer in
// ./fixtures, so every customer route can be inspected populated, empty, loading and
// errored — plus a named list of edge cases (a Cogniiq-owned action, a blocked project,
// a completed project, several organizations, a very long German company name, a failing
// download) — WITHOUT reading from or writing to hosted Supabase. No hosted credential is
// used and no request leaves the machine.
//
// The harness fails (exit 1) when:
//   - a route stays permanently in a skeleton state,
//   - a route's populated run renders no content,
//   - a console error or page error occurs outside the forced-error scenario,
//   - the document overflows horizontally at any viewport,
//   - a rendered surface contains a raw enum token a customer must never read,
//   - an RPC or table the page needs has no fixture (surfaced as PGRST202/PGRST205).
//
// Usage:
//   npm run build && npx vite preview --port 4173 &
//   node scripts/qa/customer-portal-qa.mjs --out qa-customer
//
// Playwright is intentionally NOT a package.json dependency: this is a development tool,
// not part of the build, and CI does not invoke it.

import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { installFixtures } from './fixtures/index.mjs';
import { ID, NAMES } from './fixtures/ids.mjs';
import { customer_projects, organizations, organization_members } from './fixtures/tables.mjs';
import { readRpc } from './fixtures/rpc.mjs';
import { classifyRouteState, isAcceptable, overflowFinding, rejectionReason } from './detectors.mjs';

const argOf = (flag, fallback) => {
  const i = process.argv.indexOf(flag);
  return i > -1 ? process.argv[i + 1] : fallback;
};

const OUT = argOf('--out', 'qa-customer');
const BASE = process.env.QA_BASE_URL ?? 'http://127.0.0.1:4173';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? 'https://example.supabase.co';
const ONLY = argOf('--only', null);

mkdirSync(OUT, { recursive: true });

/* ------------------------------------------------------------------ route table */

// Every customer-facing route registered in src/App.tsx under /app.
const CUSTOMER_ROUTES = [
  { key: 'c01-overview', label: 'Übersicht', path: '/app' },
  { key: 'c02-project', label: 'Projekt — Übersicht', path: `/app/projects/${ID.projectA}` },
  { key: 'c03-milestones', label: 'Projekt — Meilensteine', path: `/app/projects/${ID.projectA}`, hash: '#meilensteine' },
  { key: 'c04-project-docs', label: 'Projekt — Dokumente', path: `/app/projects/${ID.projectA}`, hash: '#dokumente' },
  { key: 'c05-project-billing', label: 'Projekt — Abrechnung', path: `/app/projects/${ID.projectA}`, hash: '#abrechnung' },
  { key: 'c06-documents', label: 'Dokumentencenter', path: '/app/documents' },
  { key: 'c07-billing', label: 'Abrechnung', path: '/app/billing' },
  { key: 'c08-solutions', label: 'Lösungen', path: '/app/solutions' },
  { key: 'c09-solution-detail', label: 'Lösung (Instanz)', path: '/app/solutions/ai-receptionist-musterbau' },
  // Static surfaces: they issue no query of their own, so there is no error state to
  // reach. Recorded as n/a rather than silently passed or falsely failed.
  { key: 'c10-support', label: 'Support', path: '/app/support', errorState: 'n/a' },
  { key: 'c11-settings', label: 'Einstellungen', path: '/app/settings', errorState: 'n/a' },
  // Entitlement-gated receptionist sections.
  { key: 'c12-onboarding', label: 'Einrichtung', path: '/app/onboarding' },
  { key: 'c13-receptionist', label: 'Rezeptionist', path: '/app/receptionist' },
  { key: 'c14-knowledge', label: 'Wissen', path: '/app/knowledge', errorState: 'n/a' },
  { key: 'c15-phone', label: 'Telefon', path: '/app/phone' },
  { key: 'c16-test', label: 'Test & Start', path: '/app/test', errorState: 'n/a' },
  { key: 'c17-calls', label: 'Anrufe', path: '/app/calls', errorState: 'n/a' },
  { key: 'c18-leads', label: 'Leads', path: '/app/leads', errorState: 'n/a' },
];

const VIEWPORTS = [
  { name: 'desktop', id: '1440x900', viewport: { width: 1440, height: 900 } },
  { name: 'tablet', id: '1024x768', viewport: { width: 1024, height: 768 } },
  { name: 'mobile', id: '390x844', viewport: { width: 390, height: 844 } },
];

/* ------------------------------------------------------------------ edge cases */

const LONG_ORG_NAME =
  'Musterbau Heizungs- und Sanitärtechnik Oberfranken Bayreuth GmbH & Co. Betriebs-KG';
const LONG_PROJECT_TITLE =
  'Vollständige Ablösung der bestehenden Telefonanlage inklusive Rufnummernportierung und Anbindung der Auftragsdisposition';

const withProject = (patch) => [{ ...customer_projects[0], ...patch }, customer_projects[1]];

// Each case overrides only the values it is about; every other response stays the
// production-shaped fixture.
const CASES = [
  {
    // AuthContext reads the organisation through the EMBEDDED `organizations` resource on
    // organization_members, so a long name has to be patched there, not only on the
    // organizations table.
    key: 'x01-long-org-name',
    label: 'Sehr langer Organisationsname',
    path: '/app',
    overrides: {
      tables: {
        organizations: organizations.map((o) => (o.id === ID.orgA ? { ...o, name: LONG_ORG_NAME } : o)),
        organization_members: organization_members.map((m) => (m.organization_id === ID.orgA
          ? { ...m, organizations: { ...m.organizations, name: LONG_ORG_NAME } }
          : m)),
      },
    },
  },
  {
    key: 'x02-long-project-title',
    label: 'Sehr langer Projekttitel',
    path: '/app',
    overrides: {
      rpc: {
        list_customer_projects: withProject({ title: LONG_PROJECT_TITLE }),
        get_customer_project: [{ ...customer_projects[0], title: LONG_PROJECT_TITLE }],
      },
    },
  },
  {
    // The default fixture customer already belongs to TWO organizations, so the switcher
    // is exercised by every other case. This one is its counterpart: with a single
    // membership the switcher must disappear entirely rather than render a one-option
    // control.
    key: 'x03-single-organization',
    label: 'Nur eine Organisation (kein Umschalter)',
    path: '/app',
    overrides: {
      tables: {
        organization_members: organization_members.filter(
          (m) => m.user_id === ID.customerUser && m.organization_id === ID.orgA,
        ),
      },
    },
    forbidSelector: '#customer-organization-select',
  },
  {
    key: 'x03b-multiple-organizations',
    label: 'Mehrere Organisationen (Umschalter sichtbar)',
    path: '/app',
    requireSelector: '#customer-organization-select',
  },
  {
    key: 'x04-cogniiq-owned-action',
    label: 'Nächste Aktion liegt bei Cogniiq',
    path: '/app',
    overrides: {
      rpc: {
        // BOTH projects must be Cogniiq-owned: the overview surfaces a customer-owned
        // action from ANY active project, so leaving one behind would make the
        // "must not appear" assertion vacuous.
        list_customer_projects: customer_projects.map((project) => ({
          ...project,
          next_action_owner: 'cogniiq',
          next_action_summary: 'Testbetrieb auswerten und Ansagen final einsprechen',
        })),
      },
    },
    // The customer-owned banner must NOT be present in this case.
    forbidText: ['Ihre nächste Aktion'],
    requireText: ['Cogniiq arbeitet aktuell an'],
  },
  {
    key: 'x05-customer-owned-action',
    label: 'Nächste Aktion liegt beim Kunden',
    path: '/app',
    requireText: ['Ihre nächste Aktion'],
  },
  {
    key: 'x06-blocked-project',
    label: 'Blockiertes Projekt',
    path: '/app',
    overrides: {
      rpc: {
        list_customer_projects: withProject({
          status: 'blocked',
          customer_safe_blocker_summary:
            'Wir warten auf den Zugang zum Testsystem Ihrer Warenwirtschaft.',
        }),
      },
    },
    requireText: ['Blockiert', 'Aktuelle Blockade'],
  },
  {
    key: 'x07-completed-project',
    label: 'Abgeschlossenes Projekt',
    path: '/app',
    overrides: {
      rpc: {
        list_customer_projects: [
          { ...customer_projects[0], status: 'completed', progress_percent: 100 },
          { ...customer_projects[1], status: 'completed', progress_percent: 100 },
        ],
      },
    },
    requireText: ['Kein laufendes Projekt'],
  },
  {
    key: 'x08-open-invoice',
    label: 'Offene Rechnung',
    path: '/app/billing',
    requireText: ['Offen', 'Beglichen'],
  },
  {
    key: 'x09-all-paid',
    label: 'Alle Rechnungen bezahlt',
    path: '/app/billing',
    overrides: {
      rpc: {
        list_customer_invoices: readRpc.list_customer_invoices.map((invoice) => ({
          ...invoice,
          status: 'paid',
          amount_paid_cents: invoice.gross_total_cents,
          outstanding_cents: 0,
        })),
      },
    },
    requireText: ['Alle Rechnungen sind ausgeglichen'],
    // "Überfällig" is also the permanent label of a summary tile, so the assertion is on
    // the overdue GROUP's description, which only renders when the group has rows.
    forbidText: ['Diese Rechnungen sind über das Fälligkeitsdatum hinaus offen'],
  },
  {
    key: 'x10-overdue-invoice',
    label: 'Überfällige Rechnung',
    path: '/app/billing',
    overrides: {
      rpc: {
        list_customer_invoices: readRpc.list_customer_invoices.map((invoice, index) =>
          index === 0 ? { ...invoice, status: 'overdue' } : invoice),
      },
    },
    requireText: ['Überfällig'],
  },
  {
    key: 'x11-download-failure',
    label: 'Download schlägt fehl',
    path: '/app/documents',
    overrides: {
      functions: {
        'customer-document-download': { status: 500, body: { error: 'qa forced failure' } },
      },
    },
    clickDownload: true,
    requireText: ['Der Download konnte nicht gestartet werden'],
  },
  {
    key: 'x12-no-organization',
    label: 'Kein Workspace verbunden',
    path: '/app',
    overrides: { tables: { organization_members: [] } },
  },
];

/* ------------------------------------------------------------------ probes */

const PROBE = `(() => {
  const strip = (root) => {
    const clone = root.cloneNode(true);
    clone.querySelectorAll(
      'script, style, noscript, nav, header, [data-qa="skeleton"], .animate-pulse, '
      + '[data-qa="empty-state"], [data-qa="error-state"], [role="alert"], [role="status"]',
    ).forEach((el) => el.remove());
    return (clone.textContent ?? '').replace(/\\s+/g, ' ').trim();
  };
  const visibleText = (root) => {
    const clone = root.cloneNode(true);
    clone.querySelectorAll('script, style, noscript').forEach((el) => el.remove());
    return (clone.textContent ?? '').replace(/\\s+/g, ' ').trim();
  };
  // Guard screens (auth bootstrap, entitlement denial) render ABOVE <main>, so falling
  // back to the document body is what stops a correct guard state reading as "blank".
  const main = document.querySelector('main') ?? document.body;
  return {
    skeletonCount: document.querySelectorAll('[data-qa="skeleton"], .animate-pulse').length,
    loadingIndicatorCount: document.querySelectorAll('[role="status"], .animate-spin').length,
    contentTextLength: strip(main).length,
    hasEmptyState: !!document.querySelector('[data-qa="empty-state"]'),
    hasErrorState: !!document.querySelector('[data-qa="error-state"], [role="alert"]'),
    overflowPx: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    bodyText: visibleText(document.body),
    sidebarCount: document.querySelectorAll('[data-qa="customer-sidebar"]').length,
    horizontalNavCount: document.querySelectorAll('header nav').length,
  };
})()`;

/**
 * Raw tokens that must never be RENDERED to a customer.
 *
 * Matched as whole words against the page's visible text. Values whose spelling is also
 * ordinary German or English prose (`active`, `paused`, `completed`, `member`) are
 * excluded, because a substring hit on those is a false positive rather than a leak.
 */
const FORBIDDEN_ENUM_TOKENS = [
  'on_track', 'attention_needed', 'next_action_owner', 'customer_safe_blocker_summary',
  'in_progress', 'partially_paid', 'project_document', 'meeting_notes', 'customer_upload',
  'cogniiq_admin', 'cogniiq_owner', 'platform_role', 'ai_receptionist',
  'automation_workspace', 'pankofer_operations', 'organization_id', 'client_account_id',
  'provisioning',
];

function enumLeakFinding(key, viewport, bodyText) {
  const hits = FORBIDDEN_ENUM_TOKENS.filter((token) => new RegExp(`\\b${token}\\b`).test(bodyText));
  return hits.length ? `RAW ENUM ${key} @ ${viewport}: ${hits.join(', ')}` : null;
}

/* ------------------------------------------------------------------ run */

const findings = [];
const matrix = new Map();

function recordFor(route) {
  if (!matrix.has(route.key)) {
    matrix.set(route.key, {
      key: route.key,
      label: route.label,
      path: `${route.path}${route.hash ?? ''}`,
      populated: false,
      empty: false,
      error: false,
      loading: false,
      desktop: false,
      tablet: false,
      mobile: false,
      screenshots: [],
      states: {},
    });
  }
  return matrix.get(route.key);
}

async function visit(page, route) {
  await page.goto(`${BASE}${route.path}`, { waitUntil: 'domcontentloaded' }).catch(() => {});
  if (route.hash) {
    // Set the hash after load so the app's own hash effect runs, exactly as it would for
    // a customer clicking the section.
    await page.evaluate((h) => { window.location.hash = h; }, route.hash).catch(() => {});
  }
  // Wait for the page to REACH a state rather than for a fixed number of milliseconds.
  // `networkidle` is unusable here — under the loading scenario a request never settles —
  // and a flat sleep was long enough for most routes but not for the overview, which
  // resolves four requests before it can render its modules. The condition is "the app
  // has committed to something": content, an empty state, an error, or a loading
  // affordance. The timeout is the bound, not the mechanism.
  await page
    .waitForFunction(() => {
      const main = document.querySelector('main');
      const settled = !!document.querySelector(
        '[data-qa="empty-state"], [data-qa="error-state"], [role="alert"], '
        + '[data-qa="skeleton"], [role="status"], .animate-pulse, .animate-spin',
      );
      const text = main ? (main.textContent ?? '').replace(/\s+/g, ' ').trim().length : 0;
      return settled || text > 200;
    }, undefined, { timeout: 4000 })
    .catch(() => {});
  // A short settle so a resolved query's render lands before the probe reads the DOM.
  await page.waitForTimeout(500);
}

async function captureRoute(page, route, scenario, vp) {
  await visit(page, route);
  const snapshot = await page.evaluate(PROBE);
  const state = classifyRouteState(snapshot);
  const record = recordFor(route);
  record.states[`${scenario}/${vp.name}`] = state;

  const overflow = overflowFinding(route.key, vp.id, snapshot.overflowPx);
  if (overflow) findings.push(overflow);

  const leak = enumLeakFinding(route.key, vp.id, snapshot.bodyText);
  if (leak) findings.push(leak);

  // Shell-shape invariants, checked on the real rendered page rather than the source.
  if (scenario === 'populated') {
    if (vp.name === 'desktop' && snapshot.sidebarCount !== 1) {
      findings.push(`SHELL ${route.key} @ ${vp.id}: expected exactly one customer sidebar, found ${snapshot.sidebarCount}`);
    }
    if (vp.name === 'desktop' && snapshot.horizontalNavCount > 0) {
      findings.push(`SHELL ${route.key} @ ${vp.id}: a horizontal <header><nav> is still rendered on desktop`);
    }
  }

  if (scenario === 'error' && route.errorState === 'n/a') {
    record.error = 'n/a';
    return;
  }

  if (!isAcceptable(scenario, state)) {
    findings.push(rejectionReason(route.key, scenario, state));
    return;
  }

  record[scenario] = true;
  record[vp.name] = true;

  const file = `${route.key}-${scenario}-${vp.name}.png`;
  await page.screenshot({ path: resolve(OUT, file), fullPage: false });
  record.screenshots.push(file);
}

async function runScenarios(browser) {
  for (const scenario of ['populated', 'empty', 'error', 'loading']) {
    // Empty, error and loading are captured once at desktop: three viewports would
    // triple the run for no additional evidence about the STATE.
    const viewports = scenario === 'populated' ? VIEWPORTS : [VIEWPORTS[0]];

    for (const vp of viewports) {
      const context = await browser.newContext({ viewport: vp.viewport, deviceScaleFactor: 1 });
      await installFixtures(context, { role: 'customer', scenario, supabaseUrl: SUPABASE_URL });
      const page = await context.newPage();
      attachErrorListeners(page, `customer/${scenario}`, vp.id, scenario === 'error' || scenario === 'loading');

      for (const route of CUSTOMER_ROUTES) {
        if (ONLY && !route.key.includes(ONLY)) continue;
        await captureRoute(page, route, scenario, vp);
      }
      await context.close();
    }
  }
}

async function runCases(browser) {
  for (const testCase of CASES) {
    if (ONLY && !testCase.key.includes(ONLY)) continue;
    // Every case is checked at desktop AND mobile: the edge cases most likely to break
    // (long names, many organizations) break at 390px first.
    for (const vp of [VIEWPORTS[0], VIEWPORTS[2]]) {
      const context = await browser.newContext({ viewport: vp.viewport, deviceScaleFactor: 1 });
      await installFixtures(context, {
        role: 'customer',
        scenario: 'populated',
        supabaseUrl: SUPABASE_URL,
        overrides: testCase.overrides ?? {},
      });
      const page = await context.newPage();
      attachErrorListeners(page, `case/${testCase.key}`, vp.id, Boolean(testCase.clickDownload));

      await visit(page, testCase);

      if (testCase.clickDownload) {
        const button = page.getByRole('button', { name: /Öffnen/ }).first();
        if (await button.count()) {
          await button.click({ timeout: 3000 }).catch(() => {});
          await page.waitForTimeout(700);
        }
      }

      const snapshot = await page.evaluate(PROBE);
      const overflow = overflowFinding(testCase.key, vp.id, snapshot.overflowPx);
      if (overflow) findings.push(overflow);
      const leak = enumLeakFinding(testCase.key, vp.id, snapshot.bodyText);
      if (leak) findings.push(leak);

      for (const needle of testCase.requireText ?? []) {
        if (!snapshot.bodyText.includes(needle)) {
          findings.push(`CASE ${testCase.key} @ ${vp.id}: expected text not found — "${needle}"`);
        }
      }
      for (const needle of testCase.forbidText ?? []) {
        if (snapshot.bodyText.includes(needle)) {
          findings.push(`CASE ${testCase.key} @ ${vp.id}: forbidden text present — "${needle}"`);
        }
      }
      // The organisation switcher only exists on the surface the viewport actually shows:
      // the rail at desktop, the drawer at mobile. Checked at desktop only.
      if (vp.name === 'desktop') {
        if (testCase.requireSelector && !(await page.locator(testCase.requireSelector).count())) {
          findings.push(`CASE ${testCase.key} @ ${vp.id}: expected element not found — ${testCase.requireSelector}`);
        }
        if (testCase.forbidSelector && (await page.locator(testCase.forbidSelector).count())) {
          findings.push(`CASE ${testCase.key} @ ${vp.id}: element should be absent — ${testCase.forbidSelector}`);
        }
      }
      if (snapshot.skeletonCount > 0 && snapshot.contentTextLength < 40) {
        findings.push(`CASE ${testCase.key} @ ${vp.id}: page is stuck in a skeleton state`);
      }

      const file = `${testCase.key}-${vp.name}.png`;
      await page.screenshot({ path: resolve(OUT, file), fullPage: false });
      caseShots.push({ key: testCase.key, label: testCase.label, file });

      await context.close();
    }
  }
}

/**
 * Interaction QA: the drawer, keyboard-only navigation, focus return and reduced motion.
 * These are behaviours, not states, so they run once each rather than per route.
 */
async function runInteractions(browser) {
  /* ---- mobile drawer: open, Escape, focus return, no body scroll ---- */
  {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await installFixtures(context, { role: 'customer', scenario: 'populated', supabaseUrl: SUPABASE_URL });
    const page = await context.newPage();
    attachErrorListeners(page, 'interaction/drawer', '390x844', false);
    await visit(page, { path: '/app' });

    const trigger = page.getByRole('button', { name: 'Navigation öffnen' });
    if (!(await trigger.count())) {
      findings.push('INTERACTION drawer: no "Navigation öffnen" trigger found at 390px');
    } else {
      await trigger.click();
      await page.waitForTimeout(400);
      const opened = await page.evaluate(() => ({
        dialog: !!document.querySelector('[role="dialog"][aria-modal="true"]'),
        bodyOverflow: document.body.style.overflow,
        overflowPx: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      }));
      if (!opened.dialog) findings.push('INTERACTION drawer: no modal dialog after opening');
      if (opened.bodyOverflow !== 'hidden') findings.push('INTERACTION drawer: body scroll is not locked while open');
      if (opened.overflowPx > 1) findings.push(`INTERACTION drawer: horizontal overflow ${opened.overflowPx}px while open`);
      await page.screenshot({ path: resolve(OUT, 'i01-drawer-open-mobile.png') });
      caseShots.push({ key: 'i01', label: 'Mobiles Navigationspanel geöffnet', file: 'i01-drawer-open-mobile.png' });

      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
      const closed = await page.evaluate(() => ({
        dialog: !!document.querySelector('[role="dialog"][aria-modal="true"]'),
        bodyOverflow: document.body.style.overflow,
        focusLabel: document.activeElement?.getAttribute('aria-label') ?? null,
      }));
      if (closed.dialog) findings.push('INTERACTION drawer: Escape did not close the drawer');
      if (closed.bodyOverflow === 'hidden') findings.push('INTERACTION drawer: body scroll stayed locked after close');
      if (closed.focusLabel !== 'Navigation öffnen') {
        findings.push(`INTERACTION drawer: focus did not return to the trigger (was ${closed.focusLabel})`);
      }
    }
    await context.close();
  }

  /* ---- keyboard-only traversal of the desktop rail ---- */
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await installFixtures(context, { role: 'customer', scenario: 'populated', supabaseUrl: SUPABASE_URL });
    const page = await context.newPage();
    attachErrorListeners(page, 'interaction/keyboard', '1440x900', false);
    await visit(page, { path: '/app' });

    const stops = [];
    for (let i = 0; i < 14; i += 1) {
      await page.keyboard.press('Tab');
      stops.push(await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        const style = window.getComputedStyle(el);
        return {
          text: (el.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 40),
          ring: style.outlineStyle !== 'none' || style.boxShadow !== 'none',
        };
      }));
    }
    const real = stops.filter(Boolean);
    if (real.length < 8) findings.push(`INTERACTION keyboard: only ${real.length} focusable stops in the first 14 tabs`);
    const firstStop = real[0]?.text ?? '';
    if (!/Zum Inhalt springen/.test(firstStop)) {
      findings.push(`INTERACTION keyboard: the skip link is not the first stop (got "${firstStop}")`);
    }
    await page.screenshot({ path: resolve(OUT, 'i02-keyboard-focus-desktop.png') });
    caseShots.push({ key: 'i02', label: 'Tastaturfokus in der Rail', file: 'i02-keyboard-focus-desktop.png' });
    await context.close();
  }

  /* ---- reduced motion: nothing may still be MOVING after the paint ---- */
  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: 'reduce',
    });
    await installFixtures(context, { role: 'customer', scenario: 'populated', supabaseUrl: SUPABASE_URL });
    const page = await context.newPage();
    attachErrorListeners(page, 'interaction/reduced-motion', '1440x900', false);

    for (const path of ['/app', `/app/projects/${ID.projectA}`, '/app/documents', '/app/billing', '/app/solutions']) {
      await visit(page, { path });
      // The invariant is MOVEMENT, not the presence of a transform: a search icon centred
      // with -translate-y-1/2 and a progress bar resting on scaleX are static layout, and
      // flagging those was a false positive. Two samples 320ms apart isolate what is
      // actually animating.
      const sample = () => page.evaluate(() => {
        const out = {};
        let i = 0;
        for (const el of document.querySelectorAll('body *')) {
          const cs = window.getComputedStyle(el);
          out[`${i}:${el.tagName}`] = `${cs.transform}|${cs.opacity}`;
          i += 1;
        }
        return out;
      });
      const first = await sample();
      await page.waitForTimeout(320);
      const second = await sample();
      const moving = Object.keys(first).filter((k) => k in second && first[k] !== second[k]);
      if (moving.length) {
        findings.push(`REDUCED MOTION ${path}: ${moving.length} element(s) still animating — ${moving.slice(0, 4).join(', ')}`);
      }
      // Nothing may be left invisible either: an entrance animation that does not run
      // under reduced motion must start at its final opacity, not at 0.
      const invisible = await page.evaluate(() => Array.from(document.querySelectorAll('main *'))
        .filter((el) => {
          const cs = window.getComputedStyle(el);
          return Number(cs.opacity) < 0.05 && cs.display !== 'none' && cs.visibility !== 'hidden';
        })
        .map((el) => el.tagName.toLowerCase())
        .slice(0, 4));
      if (invisible.length) {
        findings.push(`REDUCED MOTION ${path}: element(s) stuck at opacity 0 — ${invisible.join(', ')}`);
      }
    }
    await page.screenshot({ path: resolve(OUT, 'i03-reduced-motion-desktop.png') });
    caseShots.push({ key: 'i03', label: 'Reduced motion', file: 'i03-reduced-motion-desktop.png' });
    await context.close();
  }

  /* ---- dropdown portal clipping: the account menu and the org switcher ---- */
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await installFixtures(context, { role: 'customer', scenario: 'populated', supabaseUrl: SUPABASE_URL });
    const page = await context.newPage();
    attachErrorListeners(page, 'interaction/dropdown', '1440x900', false);
    await visit(page, { path: '/app' });

    const account = page.locator('[data-qa="customer-sidebar"] button').last();
    await account.click({ timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(350);
    const menu = await page.evaluate(() => {
      const el = document.querySelector('[role="menu"]');
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        top: r.top, left: r.left, right: r.right, bottom: r.bottom,
        vw: window.innerWidth, vh: window.innerHeight,
        shortItems: Array.from(document.querySelectorAll('[role="menuitem"]'))
          .map((i) => i.getBoundingClientRect().height).filter((h) => h > 0 && h < 36).length,
      };
    });
    if (!menu) {
      findings.push('INTERACTION dropdown: the account menu did not open');
    } else {
      if (menu.left < 0 || menu.top < 0 || menu.right > menu.vw || menu.bottom > menu.vh) {
        findings.push(`INTERACTION dropdown: the account menu is clipped by the viewport (${JSON.stringify(menu)})`);
      }
      await page.screenshot({ path: resolve(OUT, 'i04-account-menu-desktop.png') });
      caseShots.push({ key: 'i04', label: 'Kontomenü in der Rail', file: 'i04-account-menu-desktop.png' });
    }
    await context.close();
  }
}

const caseShots = [];

function attachErrorListeners(page, scope, viewport, tolerateErrors) {
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    if (tolerateErrors) return;
    findings.push(`CONSOLE ${scope} @ ${viewport}: ${msg.text().slice(0, 200)}`);
  });
  page.on('pageerror', (err) => {
    findings.push(`PAGEERROR ${scope} @ ${viewport}: ${String(err).slice(0, 200)}`);
  });
}

function writeReport() {
  const rows = [...matrix.values()];
  const yn = (b) => (b === 'n/a' ? 'n/a' : b ? 'yes' : 'NO');
  const body = rows.map((r) =>
    `| ${r.label} | \`${r.path}\` | ${yn(r.populated)} | ${yn(r.empty)} | ${yn(r.error)} | ${yn(r.loading)} | `
    + `${yn(r.desktop)} | ${yn(r.tablet)} | ${yn(r.mobile)} | ${r.screenshots.join('<br>') || '—'} |`);

  const report = [
    '# Customer Portal route QA',
    '',
    `Base: ${BASE}`,
    `Generated: ${new Date().toISOString()}`,
    `Fixture organisation: ${NAMES.orgA}`,
    '',
    '| Route | Path | Populated | Empty | Error | Loading | Desktop | Tablet | Mobile | Screenshots |',
    '|---|---|---|---|---|---|---|---|---|---|',
    ...body,
    '',
    '## Edge cases and interactions',
    '',
    '| Case | Screenshot |',
    '|---|---|',
    ...caseShots.map((c) => `| ${c.label} | ${c.file} |`),
    '',
    '## Findings',
    '',
    findings.length ? findings.map((f) => `- ${f}`).join('\n') : 'None.',
    '',
  ].join('\n');

  writeFileSync(resolve(OUT, 'customer-portal-qa.md'), report, 'utf8');
  writeFileSync(resolve(OUT, 'customer-portal-qa.json'), JSON.stringify({ rows, caseShots, findings }, null, 2), 'utf8');
  return rows;
}

async function main() {
  const browser = await chromium.launch();
  try {
    await runScenarios(browser);
    await runCases(browser);
    await runInteractions(browser);
  } finally {
    await browser.close();
  }

  const rows = writeReport();
  const missingPopulated = rows.filter((r) => !r.populated).map((r) => r.label);

  console.log(`\nRoutes inspected: ${rows.length}`);
  console.log(`Screenshots: ${rows.reduce((n, r) => n + r.screenshots.length, 0) + caseShots.length} in ${OUT}`);
  if (missingPopulated.length) {
    console.log(`\nNO POPULATED CAPTURE (${missingPopulated.length}):\n  ${missingPopulated.join('\n  ')}`);
  }
  if (findings.length) {
    console.log(`\nFINDINGS (${findings.length}):`);
    for (const f of findings) console.log(`  ${f}`);
  }

  if (missingPopulated.length || findings.length) process.exit(1);
  console.log('\nAll customer routes rendered populated; no findings.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
