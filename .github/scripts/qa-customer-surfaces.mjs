#!/usr/bin/env node
// =============================================================================
// Customer surface QA — real browser, real app, fixtured backend
// =============================================================================
// Drives the actual /app surfaces in headless Chromium against a running dev
// server, with every Supabase call intercepted and answered with fixtures, and
// asserts the rendered result for each UX state at each breakpoint.
//
// This is not CSS reasoning: it reads real geometry out of the live DOM
// (document.scrollingElement.scrollWidth vs the viewport, per-element bounding
// boxes, tap-target heights) and real text content, so a layout that only looks
// fine in the source cannot pass.
//
// STATES per surface: loading, empty, populated, permission denied, backend
// unavailable (5xx), partial data, expired session, download failure.
// WIDTHS: 375, 768, 1024, 1440.
//
// Not part of the default CI job: it needs a browser and a dev server. Run with
//   node .github/scripts/qa-customer-surfaces.mjs
// (requires playwright resolvable, e.g. NODE_PATH pointing at an install).
// =============================================================================

import { spawn } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require_ = createRequire(import.meta.url);
const { chromium } = require_(process.env.PLAYWRIGHT_PATH ?? 'playwright');

const WIDTHS = [375, 768, 1024, 1440];
const ORIGIN = 'http://127.0.0.1:4319';
const SUPABASE = 'https://qa.supabase.co';

let failures = 0;
const ok = (label) => console.log(`ok: ${label}`);
const bad = (label, detail) => {
  failures += 1;
  console.error(`FAIL: ${label}${detail ? `\n      ${detail}` : ''}`);
};

// ---------------------------------------------------------------- fixtures
const USER_ID = '11111111-1111-1111-1111-111111111111';
const ORG_ID = '22222222-2222-2222-2222-222222222222';
const PROJECT_ID = '33333333-3333-3333-3333-333333333333';

const PROJECT = {
  id: PROJECT_ID,
  organization_id: ORG_ID,
  title: 'KI-Telefonassistent für die Zentrale',
  business_objective: 'Eingehende Anrufe automatisiert qualifizieren und weiterleiten.',
  status: 'on_track',
  phase: 'Umsetzung',
  progress_percent: 45,
  start_date: '2026-06-01',
  target_date: '2026-09-30',
  next_action_summary: 'Bitte die Begrüßungstexte freigeben.',
  next_action_owner: 'customer',
  next_action_due_date: '2026-08-05',
  customer_safe_blocker_summary: null,
  contact_display_name: 'Max Mustermann',
  contact_role_label: 'Projektleitung',
  contact_business_email: 'projekte@cogniiq.de',
  created_at: '2026-06-01T00:00:00Z',
  updated_at: '2026-07-20T00:00:00Z',
};

const MILESTONES = [
  { id: 'm1', project_id: PROJECT_ID, title: 'Kickoff', description: 'Abgeschlossen.', status: 'completed', target_date: '2026-06-05', completed_at: '2026-06-05T00:00:00Z', sort_order: 1 },
  { id: 'm2', project_id: PROJECT_ID, title: 'Integration der Telefonanlage', description: 'Läuft.', status: 'in_progress', target_date: '2026-08-15', completed_at: null, sort_order: 2 },
  { id: 'm3', project_id: PROJECT_ID, title: 'Go-Live', description: null, status: 'upcoming', target_date: '2026-09-25', completed_at: null, sort_order: 3 },
];

const DOCUMENTS = [
  { id: 'd1', project_id: PROJECT_ID, category: 'contract', title: 'Rahmenvertrag Cogniiq — Langer Titel der über eine Zeile hinausgehen kann', version: 2, content_type: 'application/pdf', size_bytes: 482000, uploaded_at: '2026-07-01T10:00:00Z' },
  { id: 'd2', project_id: PROJECT_ID, category: 'meeting_notes', title: 'Protokoll Workshop', version: 1, content_type: 'application/pdf', size_bytes: 91000, uploaded_at: '2026-07-10T10:00:00Z' },
  { id: 'd3', project_id: null, category: 'dpa', title: 'Auftragsverarbeitungsvertrag', version: 1, content_type: 'application/pdf', size_bytes: 120000, uploaded_at: '2026-06-20T10:00:00Z' },
];

const INVOICES = [
  { invoice_id: 'i1', project_id: PROJECT_ID, invoice_number: 'RE-2026-0042', status: 'overdue', issue_date: '2026-06-15', due_date: '2026-07-15', currency: 'EUR', net_total_cents: 1000000, vat_total_cents: 190000, gross_total_cents: 1190000, amount_paid_cents: 0, outstanding_cents: 1190000, pdf_document_id: 'd1' },
  { invoice_id: 'i2', project_id: PROJECT_ID, invoice_number: 'RE-2026-0031', status: 'paid', issue_date: '2026-05-15', due_date: '2026-06-15', currency: 'EUR', net_total_cents: 500000, vat_total_cents: 95000, gross_total_cents: 595000, amount_paid_cents: 595000, outstanding_cents: 0, pdf_document_id: null },
];

// Failure shapes exactly as PostgREST returns them — the point is that none of
// this text may reach the screen.
const RAW_PERMISSION = { code: '42501', message: 'permission denied for function public.list_customer_invoices', details: null, hint: null };
const RAW_JWT = { code: 'PGRST301', message: 'JWT expired', details: null, hint: null };
const RAW_5XX = { code: '', message: 'Internal Server Error', details: null, hint: null };

const FORBIDDEN_ON_SCREEN = [
  'permission denied', 'PGRST', '42501', 'public.list_', 'JWT expired',
  'Internal Server Error', 'relation ', 'constraint', 'undefined', 'null,',
  'customer-documents', 'storage/v1',
];

// ------------------------------------------------------------- dev server
function startDevServer() {
  const child = spawn('npx', ['vite', '--host', '127.0.0.1', '--port', '4319', '--strictPort'], {
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
    const timer = setTimeout(() => reject(new Error('dev server did not start in 90s')), 90000);
    child.stdout.on('data', (chunk) => {
      if (String(chunk).includes('ready in') || String(chunk).includes('Local:')) {
        clearTimeout(timer);
        setTimeout(() => resolve(child), 1500);
      }
    });
    child.stderr.on('data', (chunk) => process.env.QA_DEBUG && process.stderr.write(chunk));
    child.on('exit', (code) => { clearTimeout(timer); reject(new Error(`dev server exited ${code}`)); });
  });
}

// -------------------------------------------------------------- routing
// `scenario` decides what each RPC answers, so one harness covers every state.
function makeRouter(scenario) {
  return async (route) => {
    const url = route.request().url();
    const json = (body, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(body) });

    if (route.request().method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } });
    }

    // --- auth ---
    // `authHang` stalls the calls the AUTHENTICATION BOOTSTRAP awaits, without
    // answering them. Note it is not enough to stall /auth/v1: getSession()
    // reads an unexpired session straight out of localStorage and never touches
    // the network. What AuthContext.loadAccount() actually awaits is the
    // invitation-claim RPC plus the profile and membership reads — stalling
    // those is the real reproduction of the hang.
    if (scenario.authHang && (
      url.includes('/rest/v1/rpc/claim_my_client_invitations')
      || url.includes('/rest/v1/profiles')
      || url.includes('/rest/v1/organization_members')
    )) {
      return new Promise(() => {});
    }
    if (url.includes('/auth/v1/user')) {
      return json({ id: USER_ID, aud: 'authenticated', email: 'kunde@example.invalid', user_metadata: {}, app_metadata: {} });
    }
    if (url.includes('/auth/v1/token')) {
      return json({ access_token: 'qa-token', token_type: 'bearer', expires_in: 3600, refresh_token: 'qa-refresh', user: { id: USER_ID, email: 'kunde@example.invalid' } });
    }
    if (url.includes('/auth/v1/logout')) return json({});

    // --- account bootstrap ---
    if (url.includes('/rest/v1/profiles')) {
      return json({ id: USER_ID, email: 'kunde@example.invalid', full_name: 'Test Kundin', platform_role: 'customer', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' });
    }
    if (url.includes('/rest/v1/organization_members')) {
      if (scenario.noOrganization) return json([]);
      return json([{
        id: 'om1', organization_id: ORG_ID, user_id: USER_ID, role: 'member', status: 'active',
        created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
        organizations: { id: ORG_ID, name: 'Testkunde GmbH', slug: 'testkunde', status: 'active', created_by: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
      }]);
    }

    // --- RPCs ---
    const rpc = /\/rest\/v1\/rpc\/([a-z_]+)/.exec(url)?.[1];
    if (rpc) {
      const outcome = scenario.rpc?.[rpc] ?? scenario.rpcDefault ?? 'ok';
      if (outcome === 'permission') return json(RAW_PERMISSION, 403);
      if (outcome === 'expired') return json(RAW_JWT, 401);
      if (outcome === 'down') return json(RAW_5XX, 503);
      if (outcome === 'hang') return new Promise(() => {});      // never resolves: the loading state
      if (outcome === 'empty') {
        return json(rpc === 'get_customer_project' ? [] : []);
      }
      switch (rpc) {
        case 'list_customer_projects': return json([PROJECT]);
        case 'get_customer_project': return json([PROJECT]);
        case 'list_customer_project_milestones': return json(MILESTONES);
        case 'list_customer_documents': return json(DOCUMENTS);
        case 'list_customer_invoices': return json(INVOICES);
        case 'claim_my_client_invitations': return json(null);
        default: return json([]);
      }
    }

    // --- Edge Functions ---
    if (url.includes('/functions/v1/customer-document-download')) {
      if (scenario.download === 'fail') return json({ error: 'document_not_found' }, 404);
      return json({ url: 'https://qa.supabase.co/storage/v1/object/sign/x', expires_in: 600 });
    }

    if (url.includes('/rest/v1/')) return json([]);
    return json({});
  };
}

async function newPage(browser, scenario, width) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, locale: 'de-DE' });
  await context.route(`${SUPABASE}/**`, makeRouter(scenario));
  await context.addInitScript(([url, userId]) => {
    const ref = url.split('//')[1].split('.')[0];
    const session = {
      access_token: 'qa-token', token_type: 'bearer', expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: 'qa-refresh',
      user: { id: userId, aud: 'authenticated', email: 'kunde@example.invalid', user_metadata: {}, app_metadata: {}, created_at: '2026-01-01T00:00:00Z' },
    };
    window.localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify(session));
  }, [SUPABASE, USER_ID]);
  const page = await context.newPage();
  page.on('pageerror', (error) => bad('no uncaught page error', String(error)));
  return { context, page };
}

async function settle(page, ms = 900) {
  await page.waitForTimeout(ms);
}

// --------------------------------------------------------------- assertions
async function assertNoHorizontalOverflow(page, label) {
  const result = await page.evaluate(() => {
    const doc = document.scrollingElement;
    const offenders = [];
    if (doc.scrollWidth > doc.clientWidth + 1) {
      for (const el of document.querySelectorAll('body *')) {
        const box = el.getBoundingClientRect();
        if (box.width > 0 && box.right > doc.clientWidth + 1) {
          offenders.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)} right=${Math.round(box.right)}`);
          if (offenders.length >= 3) break;
        }
      }
    }
    return { scrollWidth: doc.scrollWidth, clientWidth: doc.clientWidth, offenders };
  });
  if (result.scrollWidth > result.clientWidth + 1) {
    bad(`${label}: no horizontal overflow`, `scrollWidth ${result.scrollWidth} > viewport ${result.clientWidth}; first offenders: ${result.offenders.join(' | ')}`);
  } else {
    ok(`${label}: no horizontal overflow`);
  }
}

async function assertNoCollapsedColumn(page, label) {
  // The failure mode a flex-basis:0 item inside flex-wrap produces: an element
  // one character wide and hundreds of pixels tall.
  const collapsed = await page.evaluate(() => {
    const found = [];
    for (const el of document.querySelectorAll('body *')) {
      const box = el.getBoundingClientRect();
      if (box.width > 0 && box.width < 40 && box.height > 200 && el.textContent.trim().length > 12) {
        found.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 50)} ${Math.round(box.width)}x${Math.round(box.height)}`);
      }
    }
    return found.slice(0, 3);
  });
  if (collapsed.length) bad(`${label}: no collapsed text column`, collapsed.join(' | '));
  else ok(`${label}: no collapsed text column`);
}

async function assertNoInternalTextOnScreen(page, label) {
  const text = await page.evaluate(() => document.body.innerText);
  const leaked = FORBIDDEN_ON_SCREEN.filter((token) => text.includes(token));
  if (leaked.length) bad(`${label}: no internal/raw text on screen`, `found: ${leaked.join(', ')}`);
  else ok(`${label}: no internal/raw text on screen`);
}

// Buttons and tabs are pressed; an inline text link is read and clicked with a
// finger only incidentally. They get different floors rather than one number
// that would either be too lax for controls or flag every breadcrumb.
async function assertTapTargets(page, label) {
  const small = await page.evaluate(() => {
    const found = [];
    const floorFor = (el) => (el.tagName === 'A' && !/\bborder\b|\bbg-/.test(el.className) ? 18 : 32);
    for (const el of document.querySelectorAll('button, a[href], [role="tab"]')) {
      const box = el.getBoundingClientRect();
      const floor = floorFor(el);
      if (box.width > 0 && box.height > 0 && box.height < floor) {
        found.push(`${el.tagName.toLowerCase()}"${el.textContent.trim().slice(0, 24)}" h=${Math.round(box.height)} < ${floor}`);
      }
    }
    return found.slice(0, 4);
  });
  if (small.length) bad(`${label}: interactive targets are tall enough`, small.join(' | '));
  else ok(`${label}: interactive targets are tall enough`);
}

async function assertVisibleText(page, needle, label) {
  const text = await page.evaluate(() => document.body.innerText);
  if (text.includes(needle)) ok(`${label}: shows "${needle}"`);
  else bad(`${label}: shows "${needle}"`, `body text was: ${text.replace(/\s+/g, ' ').slice(0, 240)}`);
}

async function assertNotEndlessLoading(page, label) {
  const text = await page.evaluate(() => document.body.innerText);
  const stillLoading = /wird geladen|wird vorbereitet …|Wird vorbereitet …/i.test(text);
  const hasResolution = /Fehlerzustand|Erneut laden|Noch keine|nicht verfügbar|Keine Organisation|Ihr Portal wird vorbereitet/i.test(text);
  if (stillLoading && !hasResolution) {
    bad(`${label}: is not stuck in an endless loading state`, `body text: ${text.replace(/\s+/g, ' ').slice(0, 200)}`);
  } else {
    ok(`${label}: is not stuck in an endless loading state`);
  }
}

async function assertRetryAvailable(page, label) {
  const count = await page.evaluate(() =>
    Array.from(document.querySelectorAll('button')).filter((b) => /erneut/i.test(b.textContent)).length);
  if (count > 0) ok(`${label}: offers a retry action`);
  else bad(`${label}: offers a retry action`, 'no button containing "erneut" was rendered');
}

// ------------------------------------------------------------------- run
const ROUTES = [
  { path: '/app', name: 'home' },
  { path: `/app/projects/${PROJECT_ID}`, name: 'project-detail' },
  { path: '/app/documents', name: 'documents' },
  { path: '/app/billing', name: 'billing' },
];

const server = await startDevServer();
// Resolve the pre-installed Chromium rather than downloading one.
function findChromium() {
  if (process.env.QA_CHROMIUM) return process.env.QA_CHROMIUM;
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH ?? '/opt/pw-browsers';
  for (const dir of existsSync(base) ? readdirSync(base) : []) {
    for (const rel of ['chrome-linux/chrome', 'chrome-linux/headless_shell']) {
      const candidate = join(base, dir, rel);
      if (existsSync(candidate)) return candidate;
    }
  }
  return undefined; // let playwright try its own resolution
}

const browser = await chromium.launch({ executablePath: findChromium() });

try {
  // ---- 1) populated, at every breakpoint --------------------------------
  for (const width of WIDTHS) {
    for (const route of ROUTES) {
      const { context, page } = await newPage(browser, {}, width);
      await page.goto(`${ORIGIN}${route.path}`, { waitUntil: 'domcontentloaded' });
      await settle(page);
      const label = `${route.name} @${width} populated`;
      await assertNoHorizontalOverflow(page, label);
      await assertNoCollapsedColumn(page, label);
      await assertNoInternalTextOnScreen(page, label);
      await assertTapTargets(page, label);
      await assertNotEndlessLoading(page, label);
      await context.close();
    }
  }

  // ---- 2) project detail: every tab, narrow + wide ----------------------
  for (const width of [375, 1440]) {
    const { context, page } = await newPage(browser, {}, width);
    await page.goto(`${ORIGIN}/app/projects/${PROJECT_ID}`, { waitUntil: 'domcontentloaded' });
    await settle(page);
    for (const tab of ['Meilensteine', 'Dokumente', 'Abrechnung']) {
      await page.click(`[role="tab"]:has-text("${tab}")`);
      await settle(page, 600);
      const label = `project-detail/${tab} @${width}`;
      await assertNoHorizontalOverflow(page, label);
      await assertNoCollapsedColumn(page, label);
      await assertNoInternalTextOnScreen(page, label);
    }
    await context.close();
  }

  // ---- 3) failure states ------------------------------------------------
  const FAILURE_SCENARIOS = [
    ['permission denied', { rpcDefault: 'permission' }],
    ['expired session', { rpcDefault: 'expired' }],
    ['backend unavailable', { rpcDefault: 'down' }],
  ];
  for (const [name, scenario] of FAILURE_SCENARIOS) {
    for (const width of [375, 1440]) {
      for (const route of ROUTES) {
        const { context, page } = await newPage(browser, scenario, width);
        await page.goto(`${ORIGIN}${route.path}`, { waitUntil: 'domcontentloaded' });
        await settle(page);
        const label = `${route.name} @${width} ${name}`;
        await assertNotEndlessLoading(page, label);
        await assertNoInternalTextOnScreen(page, label);
        await assertNoHorizontalOverflow(page, label);
        // Every surface, home included, must report a failure and offer a retry —
        // never present a failed request as a settled fact about the account.
        await assertRetryAvailable(page, label);
        if (route.name === 'home') {
          const body = await page.evaluate(() => document.body.innerText);
          if (/Ihr Portal wird vorbereitet/.test(body)) {
            bad(`${label}: a failed project request is not shown as "portal is being prepared"`,
              'the onboarding claim was rendered while the request had failed');
          } else {
            ok(`${label}: a failed project request is not shown as "portal is being prepared"`);
          }
        }
        await context.close();
      }
    }
  }

  // ---- 4) empty state ---------------------------------------------------
  for (const route of ROUTES) {
    const { context, page } = await newPage(browser, { rpcDefault: 'empty' }, 375);
    await page.goto(`${ORIGIN}${route.path}`, { waitUntil: 'domcontentloaded' });
    await settle(page);
    const label = `${route.name} @375 empty`;
    await assertNotEndlessLoading(page, label);
    await assertNoInternalTextOnScreen(page, label);
    await context.close();
  }

  // ---- 5) no organization ----------------------------------------------
  for (const route of ['/app/documents', '/app/billing']) {
    const { context, page } = await newPage(browser, { noOrganization: true }, 375);
    await page.goto(`${ORIGIN}${route}`, { waitUntil: 'domcontentloaded' });
    await settle(page);
    await assertVisibleText(page, 'Keine Organisation verbunden', `${route} @375 no-organization`);
    await context.close();
  }

  // ---- 6) PARTIAL data: the project loads, its milestones do not --------
  // The overview must not turn a failed request into the claim that no
  // milestone is open.
  {
    const { context, page } = await newPage(
      browser,
      { rpc: { list_customer_project_milestones: 'down' } },
      1440,
    );
    await page.goto(`${ORIGIN}/app/projects/${PROJECT_ID}`, { waitUntil: 'domcontentloaded' });
    await settle(page);
    const text = await page.evaluate(() => document.body.innerText);
    if (text.includes('Kein offener Meilenstein')) {
      bad('partial data: a failed milestone load is not reported as "no open milestone"',
        'the overview asserted "Kein offener Meilenstein" while the request had failed');
    } else {
      ok('partial data: a failed milestone load is not reported as "no open milestone"');
    }
    await assertVisibleText(page, 'Konnte nicht geladen werden', 'partial data');
    await assertNoInternalTextOnScreen(page, 'partial data');
    await context.close();
  }

  // ---- 7) still loading: a pending request shows a skeleton, not nothing -
  {
    // Only the surface's own RPC hangs. Hanging the auth bootstrap too would
    // measure AuthContext's boot gate rather than this page's loading state.
    const { context, page } = await newPage(browser, { rpc: { list_customer_documents: 'hang' } }, 375);
    await page.goto(`${ORIGIN}/app/documents`, { waitUntil: 'domcontentloaded' });
    await settle(page, 1500);
    const text = await page.evaluate(() => document.body.innerText);
    if (/Dokumente/.test(text)) ok('loading: the page frame renders while the request is in flight');
    else bad('loading: the page frame renders while the request is in flight', text.slice(0, 160));
    const skeleton = await page.evaluate(() =>
      document.querySelectorAll('[aria-label="Dokumente werden geladen"]').length);
    if (skeleton > 0) ok('loading: a labelled skeleton is shown, not a blank area');
    else bad('loading: a labelled skeleton is shown, not a blank area', 'no skeleton with the expected aria-label');
    await assertNoHorizontalOverflow(page, 'documents @375 loading');
    await context.close();
  }

  // ---- 8) download failure ---------------------------------------------
  {
    const { context, page } = await newPage(browser, { download: 'fail' }, 375);
    await page.goto(`${ORIGIN}/app/documents`, { waitUntil: 'domcontentloaded' });
    await settle(page);
    await page.click('button:has-text("Öffnen")');
    await settle(page, 800);
    await assertVisibleText(page, 'Der Download konnte nicht gestartet werden', 'download failure @375');
    await assertNoInternalTextOnScreen(page, 'download failure @375');
    await assertNoHorizontalOverflow(page, 'download failure @375');
    await context.close();
  }

  // ---- 8b) the authentication bootstrap must never hang forever ----------
  // A backend that accepts the connection and then never answers used to strand
  // every guarded route on an English spinner with no retry and no sign out.
  {
    const { context, page } = await newPage(browser, { authHang: true }, 375);
    await page.goto(`${ORIGIN}/app`, { waitUntil: 'domcontentloaded' });

    // Before the deadline it is still legitimately loading.
    await settle(page, 2000);
    const early = await page.evaluate(() => document.body.innerText);
    if (/Checking secure session/.test(early)) {
      ok('auth hang: still shows the loading screen before the deadline');
    } else {
      bad('auth hang: still shows the loading screen before the deadline',
        `expected the bootstrap to be pending; got: ${early.replace(/\s+/g, ' ').slice(0, 120)}`);
    }

    // After the deadline it must have recovered into an actionable German state.
    await page.waitForFunction(
      () => /Anmeldung dauert zu lange/.test(document.body.innerText),
      { timeout: 30000 },
    ).then(
      () => ok('auth hang: the recovery state appears after the deadline, not an endless spinner'),
      () => bad('auth hang: the recovery state appears after the deadline, not an endless spinner',
        'the deadline passed and the app was still spinning'),
    );

    const text = await page.evaluate(() => document.body.innerText);
    if (!/Checking secure session/.test(text)) ok('auth hang: the endless spinner is gone');
    else bad('auth hang: the endless spinner is gone', 'the loading screen is still rendered');

    for (const needle of ['Anmeldung dauert zu lange', 'Erneut versuchen', 'Abmelden']) {
      if (text.includes(needle)) ok(`auth hang: offers "${needle}"`);
      else bad(`auth hang: offers "${needle}"`, text.replace(/\s+/g, ' ').slice(0, 160));
    }

    // It must not have bounced a possibly-valid session to the login form.
    const path = await page.evaluate(() => window.location.pathname);
    if (path === '/app') ok('auth hang: does not redirect to login on a request that never answered');
    else bad('auth hang: does not redirect to login on a request that never answered', `landed on ${path}`);

    await assertNoInternalTextOnScreen(page, 'auth hang @375');
    await assertNoHorizontalOverflow(page, 'auth hang @375');
    await assertTapTargets(page, 'auth hang @375');
    await context.close();
  }

  // ---- 8c) retry after a hang must recover once the backend answers -------
  {
    const scenario = { authHang: true };
    const contextAndPage = await newPage(browser, scenario, 1440);
    const { context, page } = contextAndPage;
    await page.goto(`${ORIGIN}/app`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(
      () => /Anmeldung dauert zu lange/.test(document.body.innerText),
      { timeout: 30000 },
    ).catch(() => {});

    // The backend comes back; the user presses "Erneut versuchen".
    scenario.authHang = false;
    await page.click('button:has-text("Erneut versuchen")');
    await page.waitForFunction(
      () => !/Anmeldung dauert zu lange/.test(document.body.innerText),
      { timeout: 30000 },
    ).then(
      () => ok('auth hang: retry recovers the session once the backend answers again'),
      () => bad('auth hang: retry recovers the session once the backend answers again',
        'the recovery screen never cleared after a successful retry'),
    );
    await context.close();
  }

  // ---- 9) the marketing consent banner must not intrude on /app ---------
  {
    const { context, page } = await newPage(browser, {}, 375);
    await page.goto(`${ORIGIN}/app`, { waitUntil: 'domcontentloaded' });
    await settle(page);
    const banner = await page.evaluate(() =>
      Array.from(document.querySelectorAll('div,section,aside'))
        .filter((el) => /Cookie|Einwilligung|akzeptieren/i.test(el.textContent ?? '') && el.getBoundingClientRect().height > 40)
        .length);
    if (banner === 0) ok('the marketing consent banner does not render on an authenticated /app surface');
    else bad('the marketing consent banner does not render on an authenticated /app surface', `${banner} banner-like element(s) found`);
    await context.close();
  }
} finally {
  await browser.close();
  try { process.kill(-server.pid, 'SIGTERM'); } catch { server.kill('SIGTERM'); }
}

console.log('');
console.log(failures === 0 ? 'customer surface QA: ALL PASSED' : `customer surface QA: ${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
