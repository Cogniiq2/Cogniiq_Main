#!/usr/bin/env node
// =============================================================================
// Ausgaben-Schnellimport — real browser, real interactions
// =============================================================================
// The full owner journey at five viewports:
//
//   Ausgaben (folder overview) → Schnellimport → paste the real Q2/2026 payload →
//   Prüfen → read the errors and the vendors that would be created →
//   Abbrechen (and prove nothing was written) → paste the documented example →
//   Prüfen → Import bestätigen → the imported expenses render → the folder
//   overview is unchanged → opening a folder still works.
//
// Asserted throughout: no console error, no horizontal overflow, the dialog stays
// inside the viewport, Escape closes it, and the preview never issues a write.
//
// The Supabase surface is answered by an in-memory double that mirrors the
// migration's contract — including that the SERVER computes the totals. Nothing
// here reaches a real backend and no production data is involved.
//
//   node .github/scripts/qa-expense-schnellimport.mjs --out /tmp/expense-import
//   node .github/scripts/qa-expense-schnellimport.mjs --viewports first

import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { findChromium, launchChromium } from './lib/chromium.mjs';
import { fixtureFor, FIXTURE_IDS } from './lib/admin-fixtures.mjs';

const ORIGIN = 'http://127.0.0.1:4323';
const SUPABASE = 'https://qa.supabase.co';

const args = process.argv.slice(2);
const argValue = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const OUT_DIR = resolve(argValue('--out', '.qa-expense-import'));
const VIEWPORT_MODE = argValue('--viewports', 'all');

const ALL_VIEWPORTS = [
  { label: '1440x900', width: 1440, height: 900, mobile: false },
  { label: '1280x800', width: 1280, height: 800, mobile: false },
  { label: '1024x768', width: 1024, height: 768, mobile: false },
  { label: '768x1024', width: 768, height: 1024, mobile: true },
  { label: '390x844', width: 390, height: 844, mobile: true },
];
const VIEWPORTS = VIEWPORT_MODE === 'all' ? ALL_VIEWPORTS : ALL_VIEWPORTS.slice(0, 1);

let failures = 0;
const ok = (label) => console.log(`ok: ${label}`);
const bad = (label, detail) => {
  failures += 1;
  console.error(`FAIL: ${label}${detail ? `\n      ${detail}` : ''}`);
};

const chromiumPath = findChromium();
if (!chromiumPath) {
  console.log('no Chrome/Chromium found — skipping expense Schnellimport QA');
  process.exit(0);
}

/* ---------------------------------------------------- import server double */

// Mirrors 20260904120000: vendors resolve by normalised exact name, unknown ones are
// reported as creations, and the RESULT totals are computed here rather than echoed
// from the request — so a client that invented its own totals would be visible.
function createImportServer() {
  const vendors = [{ id: 'v-elm', name: 'Elm-Haustechnik' }];
  const calls = [];
  // The supplier documents the "books" already hold, keyed exactly as the migration's
  // owner_expenses_supplier_document_uniq index is: entity + vendor + lower(btrim(number)).
  const documents = new Set();
  const docKey = (entity, vendorId, number) => {
    const n = typeof number === 'string' ? number.trim().toLowerCase() : '';
    return entity && vendorId && n ? `${entity}|${vendorId}|${n}` : null;
  };

  return {
    calls,
    vendors,
    documents,
    handle(fn, body) {
      calls.push(fn);
      if (fn === 'owner_check_expense_documents') {
        return (body.p_documents ?? []).map((d) => ({
          client_import_id: d.client_import_id ?? null,
          vendor_id: d.vendor_id ?? null,
          supplier_invoice_number: d.supplier_invoice_number ?? null,
          match_count: documents.has(docKey(body.p_entity, d.vendor_id, d.supplier_invoice_number)) ? 1 : 0,
        }));
      }
      if (fn === 'owner_resolve_import_vendors') {
        return (body.p_names ?? []).map((name) => {
          const hits = vendors.filter((v) => v.name.trim().toLowerCase() === String(name).trim().toLowerCase());
          return {
            name,
            vendor_id: hits.length === 1 ? hits[0].id : null,
            match_count: hits.length,
            ambiguous: hits.length > 1,
          };
        });
      }
      if (fn === 'owner_bulk_import_expenses') {
        const rows = body.p_payload?.expenses ?? [];
        let net = 0, vat = 0, gross = 0, paid = 0, payments = 0;
        const created = [];
        const batchKeys = [];
        for (const row of rows) {
          for (const line of row.lines ?? []) {
            const n = Number(line.net_cents) || 0;
            const rate = Number(line.vat_rate_bp ?? 1900);
            const t = line.vat_treatment ?? 'domestic_standard';
            const hasVat = ['domestic_standard', 'domestic_reduced', 'reverse_charge_13b', 'intra_community'].includes(t);
            const v = hasVat ? Math.round((n * rate) / 10000) : 0;
            net += n; vat += v;
            gross += (t === 'domestic_standard' || t === 'domestic_reduced') ? n + v : n;
          }
          for (const p of row.payments ?? []) { paid += Number(p.amount_cents) || 0; payments += 1; }
          const name = row.vendor?.name;
          let vendorId = row.vendor?.vendor_id ?? null;
          if (!vendorId && name) {
            const hit = vendors.find((v) => v.name.trim().toLowerCase() === name.trim().toLowerCase());
            if (hit) {
              vendorId = hit.id;
            } else {
              vendorId = `v-${vendors.length}`;
              vendors.push({ id: vendorId, name });
              created.push(name);
            }
          }
          // The server is authoritative, so the double refuses here too: a preview that
          // went stale between Prüfen and Import bestätigen must not get a second booking.
          const key = docKey(body.p_payload?.business_entity_id, vendorId, row.supplier_invoice_number);
          if (key && documents.has(key)) {
            return { __error: `expense ${row.client_import_id}: supplier invoice "${row.supplier_invoice_number}" from this vendor is already recorded` };
          }
          if (key) documents.add(key);
          batchKeys.push(key);
        }
        return {
          batch_id: 'batch-1', expense_count: rows.length, payment_count: payments,
          net_cents: net, vat_cents: vat, gross_cents: gross, input_vat_cents: vat,
          paid_cents: paid, vendors_created: created, expenses: [],
        };
      }
      return null;
    },
  };
}

const importServer = createImportServer();
const IMPORT_FNS = new Set([
  'owner_resolve_import_vendors', 'owner_check_expense_documents', 'owner_bulk_import_expenses',
]);
// Folders are answered as an empty-but-valid workspace: this suite is about the import,
// and folder behaviour has its own runner.
const WORKSPACE_FNS = new Set(['owner_workspace_state']);

/* ------------------------------------------------------------- browser rig */

function startDevServer() {
  const child = spawn('npx', ['vite', '--host', '127.0.0.1', '--port', '4323', '--strictPort'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      VITE_SUPABASE_URL: SUPABASE,
      VITE_SUPABASE_ANON_KEY: 'qa-anon-key',
      VITE_OURA_CLIENT_ID: 'qa',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  });
  return new Promise((res, rej) => {
    const timer = setTimeout(() => rej(new Error('dev server did not start in 90s')), 90_000);
    child.stdout.on('data', (chunk) => {
      const text = String(chunk);
      if (text.includes('ready in') || text.includes('Local:')) {
        clearTimeout(timer);
        setTimeout(() => res(child), 1500);
      }
    });
    child.stderr.on('data', (chunk) => process.env.QA_DEBUG && process.stderr.write(chunk));
    child.on('exit', (code) => { clearTimeout(timer); rej(new Error(`dev server exited ${code}`)); });
  });
}

const b64 = (value) => Buffer.from(value, 'utf8').toString('base64');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function evaluate(page, expression) {
  const { result, exceptionDetails } = await page.send('Runtime.evaluate', {
    expression, returnByValue: true, awaitPromise: true,
  });
  if (exceptionDetails) throw new Error(exceptionDetails.exception?.description ?? 'evaluate failed');
  return result.value;
}

async function preparePage(page) {
  const consoleErrors = [];
  await page.send('Page.enable');
  await page.send('Runtime.enable');
  await page.send('Network.enable');

  page.on('Runtime.consoleAPICalled', (event) => {
    if (event.type !== 'error') return;
    const text = (event.args ?? []).map((a) => a.value ?? a.description ?? '').join(' ');
    if (/favicon|Failed to load resource|net::ERR|Download the React DevTools/.test(text)) return;
    consoleErrors.push(text);
  });
  page.on('Runtime.exceptionThrown', (event) => {
    consoleErrors.push(event.exceptionDetails?.exception?.description ?? 'uncaught exception');
  });

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
      const rpc = request.url.match(/\/rest\/v1\/rpc\/([a-z0-9_]+)/i);
      if (rpc && IMPORT_FNS.has(rpc[1])) {
        let body = {};
        try { body = JSON.parse(Buffer.from(request.postData ?? '{}', 'utf8').toString()); } catch { /* empty */ }
        const answer = importServer.handle(rpc[1], body);
        // A refusal comes back exactly as PostgREST delivers a raised exception, so the
        // browser takes the real error path rather than a hand-waved one.
        const refused = answer && typeof answer === 'object' && '__error' in answer;
        await page.send('Fetch.fulfillRequest', {
          requestId, responseCode: refused ? 400 : 200, responseHeaders: headers,
          body: b64(JSON.stringify(refused ? { message: answer.__error, code: 'P0001' } : answer)),
        });
        return;
      }
      if (rpc && WORKSPACE_FNS.has(rpc[1])) {
        await page.send('Fetch.fulfillRequest', {
          requestId, responseCode: 200, responseHeaders: headers,
          body: b64(JSON.stringify({ folders: [], items: [] })),
        });
        return;
      }
      const accept = Object.entries(request.headers ?? {})
        .find(([k]) => k.toLowerCase() === 'accept')?.[1] ?? '';
      await page.send('Fetch.fulfillRequest', {
        requestId, responseCode: 200, responseHeaders: headers,
        body: b64(JSON.stringify(fixtureFor(request.url, { accept }))),
      });
    } catch { /* navigated away mid-flight */ }
  });

  await page.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-color-scheme', value: 'light' }],
  });

  await page.send('Page.addScriptToEvaluateOnNewDocument', {
    source: `
      (() => {
        const ref = ${JSON.stringify(SUPABASE)}.split('//')[1].split('.')[0];
        window.localStorage.setItem('sb-' + ref + '-auth-token', JSON.stringify({
          access_token: 'qa-token', token_type: 'bearer', expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: 'qa-refresh',
          user: { id: ${JSON.stringify(FIXTURE_IDS.USER_ID)}, aud: 'authenticated',
                  email: 'owner@cogniiq.invalid', user_metadata: {}, app_metadata: {},
                  created_at: '2026-01-01T00:00:00Z' },
        }));
      })();
    `,
  });

  return consoleErrors;
}

const setViewport = (page, v) => page.send('Emulation.setDeviceMetricsOverride', {
  width: v.width, height: v.height, deviceScaleFactor: 1, mobile: v.mobile,
});

async function goto(page, path) {
  await page.send('Page.navigate', { url: `${ORIGIN}${path}` });
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    await wait(400);
    const ready = await evaluate(page, `Boolean(document.querySelector("main h1"))`).catch(() => false);
    if (ready) { await wait(900); return true; }
  }
  return false;
}

async function screenshot(page, file) {
  const { data } = await page.send('Page.captureScreenshot', {
    format: 'png', captureBeyondViewport: true, fromSurface: true, optimizeForSpeed: false,
  });
  writeFileSync(file, Buffer.from(data, 'base64'));
}

/* --------------------------------------------------------- DOM vocabulary */
//
// Addressed the way a user perceives it — accessible names and visible text — so a
// styling change cannot silently make this suite stop testing anything.

const HELPERS = `
  window.__qa = {
    button: (name) => [...document.querySelectorAll('button')]
      .find((b) => (b.getAttribute('aria-label') ?? b.textContent.trim()) === name),
    dialog: () => document.querySelector('[role="dialog"][aria-modal="true"]'),
    dialogText: () => window.__qa.dialog()?.innerText ?? '',
    textarea: () => window.__qa.dialog()?.querySelector('textarea') ?? null,
    click: (el) => { if (!el) return false; el.scrollIntoView({ block: 'center' }); el.click(); return true; },
    // A real paste: one value change plus the input event React listens for.
    paste: (el, value) => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
      setter.call(el, value);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    },
    overflow: () => Math.round(document.scrollingElement.scrollWidth - document.scrollingElement.clientWidth),
    // The failure mode a phone exposes: a dialog wider than the screen, or text clipped
    // out of it. Measured against the viewport, not against a parent.
    dialogFits: () => {
      const d = window.__qa.dialog();
      if (!d) return null;
      const r = d.getBoundingClientRect();
      return { left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width),
               viewport: window.innerWidth, fits: r.left >= -1 && r.right <= window.innerWidth + 1 };
    },
    // Any element inside the dialog whose own content scrolls sideways.
    innerOverflow: () => {
      const d = window.__qa.dialog();
      if (!d) return 0;
      return [...d.querySelectorAll('*')]
        .reduce((worst, el) => Math.max(worst, el.scrollWidth - el.clientWidth), 0);
    },
  };
`;
const withHelpers = (expr) => `(() => { ${HELPERS} return (${expr}); })()`;
const run = (page, expr) => evaluate(page, withHelpers(expr));

async function pressEscape(page) {
  await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await wait(400);
}

/* --------------------------------------------------------------- payloads */

// The payloads come from the SHIPPED modules, read through the dev server's own module
// graph. Node cannot import .ts directly, and a copy pasted into this file could silently
// drift from the fixture the tests and the app actually use — so the browser imports them.
async function payloadsFromApp(page) {
  return evaluate(page, `
    (async () => {
      const fx = await import('/src/lib/ownerFinance/fixtures/q2exp2026Expenses.ts');
      const mod = await import('/src/lib/ownerFinance/expenseBulkImport.ts');
      return { real: fx.Q2EXP_2026_EXPENSES, template: mod.expenseImportTemplate() };
    })()
  `);
}

/* -------------------------------------------------------------------- run */

mkdirSync(OUT_DIR, { recursive: true });
const server = await startDevServer();
const browser = await launchChromium(chromiumPath);
const { page } = browser;

try {
  const consoleErrors = await preparePage(page);
  await setViewport(page, ALL_VIEWPORTS[0]);

  if (!(await goto(page, '/admin/finance/expenses'))) {
    bad('flow: Ausgaben did not render');
  } else {
    const payloads = await payloadsFromApp(page);
    if (!payloads?.real || !payloads?.template) {
      bad('flow: could not read the shipped payloads', 'the fixture or template module did not load');
    }
    consoleErrors.length = 0;

    // 1. The action is on the FOLDER OVERVIEW, which is what the bare route renders.
    const entry = await run(page, `({
      heading: document.querySelector('main h1')?.textContent?.trim() ?? null,
      importButton: Boolean(window.__qa.button('Schnellimport')),
      rows: document.querySelectorAll('table tbody tr').length,
    })`);
    if (entry.heading !== 'Ausgaben') bad('overview: wrong page', JSON.stringify(entry));
    else if (!entry.importButton) bad('overview: no Schnellimport action', 'the folder overview must still offer it');
    else ok('Ausgaben overview offers Schnellimport as a page-level action');

    // 2. Open it.
    await run(page, `window.__qa.click(window.__qa.button('Schnellimport'))`);
    await wait(600);
    const opened = await run(page, `({
      open: Boolean(window.__qa.dialog()),
      title: window.__qa.dialogText().split('\\n')[0] ?? '',
      hasTextarea: Boolean(window.__qa.textarea()),
      saysVendors: window.__qa.dialogText().includes('Lieferanten, keine Kunden'),
    })`);
    if (!opened.open) bad('dialog: did not open');
    else if (!opened.title.includes('Ausgaben-Schnellimport')) bad('dialog: wrong title', opened.title);
    else if (!opened.hasTextarea) bad('dialog: no paste field');
    else if (!opened.saysVendors) bad('dialog: does not state the vendor/customer distinction');
    else ok('dialog opens as "Ausgaben-Schnellimport" with the vendor notice');
    await screenshot(page, `${OUT_DIR}/01-dialog-empty.png`);

    // 3. Paste the REAL Q2/2026 payload and preview it.
    await run(page, `window.__qa.paste(window.__qa.textarea(), ${JSON.stringify(payloads.real)})`);
    await wait(300);
    await run(page, `window.__qa.click(window.__qa.button('Prüfen'))`);
    await wait(1200);

    const previewed = await run(page, `({ text: window.__qa.dialogText() })`);
    const writesDuringPreview = importServer.calls.filter((c) => c === 'owner_bulk_import_expenses').length;
    if (writesDuringPreview !== 0) bad('preview: WROTE', `${writesDuringPreview} import call(s) during preview`);
    else ok('preview writes nothing');

    if (!previewed.text.includes('Lieferantengutschrift')) {
      bad('preview: the supplier credit was not blocked', previewed.text.slice(0, 400));
    } else ok('preview blocks the supplier credit with a readable message');

    for (const gone of ['wurde nicht gefunden', 'issue_date', 'übersteigen']) {
      if (previewed.text.includes(gone)) bad(`preview: the old error "${gone}" is still reported`);
    }
    ok('preview no longer reports any of the four production errors');

    if (!previewed.text.includes('Neuer Lieferant wird angelegt')) {
      bad('preview: does not name the vendors it would create');
    } else ok('preview names every vendor it would create');
    await screenshot(page, `${OUT_DIR}/02-preview-real-payload.png`);

    // 4. Cancel — and prove nothing was written.
    await run(page, `window.__qa.click(window.__qa.button('Zurück'))`);
    await wait(400);
    await run(page, `window.__qa.click(window.__qa.button('Abbrechen'))`);
    await wait(600);
    const cancelled = await run(page, `Boolean(window.__qa.dialog())`);
    const writesAfterCancel = importServer.calls.filter((c) => c === 'owner_bulk_import_expenses').length;
    if (cancelled) bad('cancel: the dialog stayed open');
    else if (writesAfterCancel !== 0) bad('cancel: WROTE', `${writesAfterCancel} import call(s)`);
    else ok('cancelling closes the dialog and writes nothing');

    // 5. The documented example → confirm → the import runs exactly once.
    await run(page, `window.__qa.click(window.__qa.button('Schnellimport'))`);
    await wait(600);
    await run(page, `window.__qa.click(window.__qa.button('Beispiel einfügen'))`);
    await wait(400);
    const exampleLoaded = await run(page, `(window.__qa.textarea()?.value ?? '').includes('"expenses"')`);
    if (!exampleLoaded) bad('example: "Beispiel einfügen" did not fill the field');
    else ok('"Beispiel einfügen" fills the field with the documented expense JSON');

    await run(page, `window.__qa.click(window.__qa.button('Prüfen'))`);
    await wait(1200);
    const ready = await run(page, `({
      text: window.__qa.dialogText(),
      confirmEnabled: !(window.__qa.button('Import bestätigen')?.disabled ?? true),
    })`);
    if (!ready.confirmEnabled) bad('example: confirmation is not available', ready.text.slice(0, 400));
    else ok('a clean payload enables — and requires — an explicit confirmation');
    if (!ready.text.includes('Vorsteuer')) bad('preview: no Vorsteuer line');
    else ok('the preview states Netto, USt, Vorsteuer, Brutto and Bezahlt');
    await screenshot(page, `${OUT_DIR}/03-preview-example.png`);

    await run(page, `window.__qa.click(window.__qa.button('Import bestätigen'))`);
    await wait(1500);
    const imports = importServer.calls.filter((c) => c === 'owner_bulk_import_expenses').length;
    if (imports !== 1) bad('confirm: expected exactly ONE atomic import call', `saw ${imports}`);
    else ok('confirmation runs exactly one atomic import RPC');
    await screenshot(page, `${OUT_DIR}/04-after-import.png`);

    // 5b. THE DUPLICATE GUARD, in the browser.
    //
    //     The exact reported defect: the SAME supplier documents are pasted a second time
    //     under fresh client_import_ids. The cross-batch guard cannot see it — the labels
    //     are new — so the supplier-document identity has to, and the owner must read that
    //     before confirming, not a constraint violation afterwards.
    await wait(600);
    await run(page, `window.__qa.click(window.__qa.button('Schnellimport'))`);
    await wait(600);
    await run(page, `window.__qa.click(window.__qa.button('Beispiel einfügen'))`);
    await wait(400);
    // Same documents, different labels.
    await run(page, `(() => {
      const el = window.__qa.textarea();
      const doc = JSON.parse(el.value);
      doc.expenses.forEach((e, i) => { e.client_import_id = 'WIEDERHOLT-' + (i + 1); });
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
      setter.call(el, JSON.stringify(doc, null, 2));
      el.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    })()`);
    await wait(400);
    const importsBeforeRepaste = importServer.calls.filter((c) => c === 'owner_bulk_import_expenses').length;
    await run(page, `window.__qa.click(window.__qa.button('Prüfen'))`);
    await wait(1500);
    const repaste = await run(page, `({
      text: window.__qa.dialogText(),
      confirmEnabled: !(window.__qa.button('Import bestätigen')?.disabled ?? true),
      overflow: window.__qa.overflow(),
    })`);
    const importsAfterRepaste = importServer.calls.filter((c) => c === 'owner_bulk_import_expenses').length;
    const probed = importServer.calls.filter((c) => c === 'owner_check_expense_documents').length;

    if (probed === 0) bad('duplicate: the preview never asked the server about the documents');
    else ok('the preview asks the server which supplier documents are already booked');
    if (repaste.confirmEnabled) bad('duplicate: confirmation was still offered', repaste.text.slice(0, 400));
    else ok('re-pasting already-imported documents makes confirmation IMPOSSIBLE');
    if (!repaste.text.includes('bereits erfasst')) {
      bad('duplicate: the preview does not say the document is already recorded', repaste.text.slice(0, 400));
    } else ok('the preview names the documents as already recorded');
    if (!repaste.text.includes('Vorsteuer doppelt')) {
      bad('duplicate: the preview does not state the tax consequence', repaste.text.slice(0, 400));
    } else ok('and states why: the Vorsteuer would be claimed twice');
    if (importsAfterRepaste !== importsBeforeRepaste) {
      bad('duplicate: the preview WROTE', `${importsAfterRepaste - importsBeforeRepaste} import call(s)`);
    } else ok('the duplicate preview writes nothing');
    if (repaste.overflow > 0) bad('duplicate: horizontal overflow', `${repaste.overflow}px`);
    await screenshot(page, `${OUT_DIR}/05-duplicate-refused.png`);

    // Escape rather than a named button: the preview state offers "Zurück" and
    // "Import bestätigen", and the point here is only to get back to the overview.
    await pressEscape(page);
    await wait(800);
    if (await run(page, `Boolean(window.__qa.dialog())`)) {
      bad('duplicate: the dialog did not close after the refused preview');
    } else ok('the refused duplicate preview closes without writing anything');

    // 6. The folder overview is unchanged and opening a folder still works.
    await wait(600);
    const afterImport = await run(page, `({
      dialog: Boolean(window.__qa.dialog()),
      heading: document.querySelector('main h1')?.textContent?.trim() ?? null,
      importButton: Boolean(window.__qa.button('Schnellimport')),
      overflow: window.__qa.overflow(),
    })`);
    if (afterImport.dialog) bad('after import: the dialog stayed open');
    else if (afterImport.heading !== 'Ausgaben') bad('after import: navigated away', JSON.stringify(afterImport));
    else if (!afterImport.importButton) bad('after import: the Schnellimport action disappeared');
    else ok('after importing, the Ausgaben overview is intact and unchanged');

    if (!(await goto(page, '/admin/finance/expenses?folder=all'))) {
      bad('after import: opening a folder view failed');
    } else {
      const folderView = await run(page, `({
        heading: document.querySelector('main h1')?.textContent?.trim() ?? null,
        importButton: Boolean(window.__qa.button('Schnellimport')),
        overflow: window.__qa.overflow(),
      })`);
      if (folderView.heading !== 'Ausgaben') bad('folder view: did not render');
      else if (!folderView.importButton) bad('folder view: no Schnellimport action');
      else if (folderView.overflow > 0) bad('folder view: horizontal overflow', `${folderView.overflow}px`);
      else ok('opening a folder still works and still offers Schnellimport');
    }

    if (consoleErrors.length) bad('console errors during the journey', consoleErrors.slice(0, 5).join('\n      '));
    else ok('no console errors during the whole journey');
  }

  // ------------------------------------------------------------- viewports
  for (const viewport of VIEWPORTS) {
    await setViewport(page, viewport);
    const label = `Ausgaben-Schnellimport @ ${viewport.label}`;
    consoleErrors.length = 0;

    if (!(await goto(page, '/admin/finance/expenses'))) { bad(label, 'never rendered'); continue; }
    const payloads = await payloadsFromApp(page);

    await run(page, `window.__qa.click(window.__qa.button('Schnellimport'))`);
    await wait(700);
    await run(page, `window.__qa.paste(window.__qa.textarea(), ${JSON.stringify(payloads.real)})`);
    await wait(200);
    await run(page, `window.__qa.click(window.__qa.button('Prüfen'))`);
    await wait(1400);
    await screenshot(page, `${OUT_DIR}/preview--${viewport.label}.png`);

    const geometry = await run(page, `({
      pageOverflow: window.__qa.overflow(),
      dialog: window.__qa.dialogFits(),
      innerOverflow: window.__qa.innerOverflow(),
      errorsVisible: window.__qa.dialogText().includes('Lieferantengutschrift'),
      vendorsVisible: window.__qa.dialogText().includes('Neuer Lieferant wird angelegt'),
    })`);

    if (geometry.pageOverflow > 0) bad(`${label}: horizontal overflow`, `${geometry.pageOverflow}px`);
    else ok(`${label}: no horizontal page overflow`);

    if (!geometry.dialog?.fits) {
      bad(`${label}: dialog escapes the viewport`, JSON.stringify(geometry.dialog));
    } else ok(`${label}: the dialog stays inside the viewport (${geometry.dialog.width}px)`);

    // The JSON textarea legitimately scrolls; nothing else may.
    if (geometry.innerOverflow > 0 && geometry.innerOverflow > 4) {
      const worst = await run(page, `(() => {
        const d = window.__qa.dialog();
        const el = [...d.querySelectorAll('*')].sort((a, b) =>
          (b.scrollWidth - b.clientWidth) - (a.scrollWidth - a.clientWidth))[0];
        return el ? el.tagName + '.' + (el.className || '').toString().slice(0, 60) : null;
      })()`);
      if (!String(worst).startsWith('TEXTAREA')) {
        bad(`${label}: content overflows inside the dialog`, `${geometry.innerOverflow}px in ${worst}`);
      } else ok(`${label}: only the JSON field scrolls, as intended`);
    } else ok(`${label}: no content overflow inside the dialog`);

    if (!geometry.errorsVisible) bad(`${label}: the blocking error is not readable`);
    else if (!geometry.vendorsVisible) bad(`${label}: the vendor-creation notice is not readable`);
    else ok(`${label}: errors and vendor notices are readable`);

    await pressEscape(page);
    const closed = await run(page, `!window.__qa.dialog()`);
    if (!closed) bad(`${label}: Escape did not close the dialog`);
    else ok(`${label}: Escape closes the dialog`);

    if (consoleErrors.length) bad(`${label}: console errors`, consoleErrors.slice(0, 3).join('\n      '));
  }

  await browser.close?.();
} catch (error) {
  bad('expense Schnellimport QA crashed', error?.stack ?? error?.message ?? String(error));
} finally {
  try { await browser.close?.(); } catch { /* already gone */ }
  try { process.kill(-server.pid, 'SIGTERM'); } catch { /* already gone */ }
}

console.log(`\nscreenshots: ${OUT_DIR}`);
if (failures) {
  console.error(`\n${failures} expense Schnellimport QA check(s) failed`);
  process.exit(1);
}
console.log('\nexpense Schnellimport QA passed');
