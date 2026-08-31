#!/usr/bin/env node
// =============================================================================
// Admin Center folders / Papierkorb / delete — real browser, real interactions
// =============================================================================
// qa-admin-visual.mjs looks at pages. This one USES them: it creates a folder by
// typing into the dialog, moves rows through the row menu and through the bulk
// bar, reads the delete confirmation the server preflight produced, empties a
// selection into the Papierkorb, restores from it, and does all of that at five
// viewports while asserting that the page never scrolls horizontally, the folder
// menus are never clipped, Escape closes every overlay, focus is visible, and the
// console stays clean.
//
// The Supabase surface is answered by an in-memory double that behaves like the
// migration's RPCs — including that the SERVER, not the component, decides what
// "Löschen" means for a record. Nothing here reaches a real backend and no
// production data is involved.
//
//   node .github/scripts/qa-admin-folders.mjs --out /tmp/folders
//   node .github/scripts/qa-admin-folders.mjs --viewports all

import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { findChromium, launchChromium } from './lib/chromium.mjs';
import { fixtureFor, FIXTURE_IDS } from './lib/admin-fixtures.mjs';

const ORIGIN = 'http://127.0.0.1:4322';
const SUPABASE = 'https://qa.supabase.co';

const args = process.argv.slice(2);
const argValue = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const OUT_DIR = resolve(argValue('--out', '.qa-folders'));
const VIEWPORT_MODE = argValue('--viewports', 'all');

const ALL_VIEWPORTS = [
  { label: '1440x900', width: 1440, height: 900, mobile: false },
  { label: '1280x800', width: 1280, height: 800, mobile: false },
  { label: '1024x768', width: 1024, height: 768, mobile: false },
  { label: '768x1024', width: 768, height: 1024, mobile: true },
  { label: '390x844', width: 390, height: 844, mobile: true },
];
const VIEWPORTS = VIEWPORT_MODE === 'all' ? ALL_VIEWPORTS : ALL_VIEWPORTS.slice(0, 1);

const PAGES = [
  { slug: 'invoices', path: '/admin/finance/invoices', heading: 'Rechnungen' },
  { slug: 'offers', path: '/admin/finance/offers', heading: 'Angebote' },
  { slug: 'expenses', path: '/admin/finance/expenses', heading: 'Ausgaben' },
];

let failures = 0;
const ok = (label) => console.log(`ok: ${label}`);
const bad = (label, detail) => {
  failures += 1;
  console.error(`FAIL: ${label}${detail ? `\n      ${detail}` : ''}`);
};

const chromiumPath = findChromium();
if (!chromiumPath) {
  console.log('no Chrome/Chromium found — skipping admin folder QA');
  process.exit(0);
}

/* ------------------------------------------------------- workspace double */

// Behaves like 20260903120000: folders are per-scope, deleting a folder unassigns
// rather than deletes, and the delete outcome is decided here rather than by the UI.
function createWorkspace() {
  const folders = new Map(); // scope -> [{id,name,sort_order,created_at}]
  const items = new Map();   // `${scope}:${id}` -> {folder_id, trashed_at}
  let seq = 0;

  // Every scope starts with a deliberately long folder name. The rail must truncate it
  // rather than widen the page — the failure mode this suite exists to catch on a phone.
  for (const scope of ['invoice', 'offer', 'expense']) {
    folders.set(scope, [{
      id: `seed-${scope}`, name: 'Website-Projekte und Wartungsverträge',
      sort_order: 0, created_at: '2026-01-01T00:00:00Z',
    }]);
  }
  seq = 10;
  const list = (scope) => folders.get(scope) ?? [];

  // Only a never-issued draft / a pristine row is disposable; everything else is kept.
  const plan = (scope, id) => {
    if (scope === 'invoice') {
      return id === 'i9'
        ? { resource_id: id, action: 'hard_delete', reasons: ['never_issued_draft'], dependencies: {} }
        : id === 'i10'
          ? { resource_id: id, action: 'trash_only', reasons: ['already_cancelled', 'invoice_number_retained'], dependencies: {} }
          : { resource_id: id, action: 'cancel_and_trash', reasons: ['issued_invoice_requires_storno', 'invoice_number_retained'], dependencies: {} };
    }
    if (scope === 'offer') {
      return id === 'o1'
        ? { resource_id: id, action: 'hard_delete', reasons: ['pristine_draft'], dependencies: {} }
        : { resource_id: id, action: 'archive_and_trash', reasons: ['has_immutable_version'], dependencies: {} };
    }
    return ['x1', 'x2'].includes(id)
      ? { resource_id: id, action: 'hard_delete', reasons: ['no_protected_dependency'], dependencies: {} }
      : { resource_id: id, action: 'trash_only', reasons: ['has_payments'], dependencies: {} };
  };

  return {
    handle(fn, body) {
      const scope = body.p_scope;
      switch (fn) {
        case 'owner_workspace_state':
          return {
            scope,
            folders: list(scope),
            items: [...items.entries()]
              .filter(([key]) => key.startsWith(`${scope}:`))
              .map(([key, value]) => ({ resource_id: key.slice(scope.length + 1), ...value })),
          };
        case 'owner_create_workspace_folder': {
          const name = String(body.p_name).trim();
          const existing = list(scope);
          if (existing.some((f) => f.name.toLowerCase() === name.toLowerCase())) {
            return { __error: 'folder_name_taken' };
          }
          const folder = { id: `wf${++seq}`, name, sort_order: existing.length, created_at: '2026-01-01T00:00:00Z' };
          folders.set(scope, [...existing, folder]);
          return folder;
        }
        case 'owner_rename_workspace_folder':
          for (const [key, value] of folders) {
            folders.set(key, value.map((f) => (f.id === body.p_folder_id ? { ...f, name: String(body.p_name).trim() } : f)));
          }
          return { id: body.p_folder_id };
        case 'owner_delete_workspace_folder': {
          let unassigned = 0;
          for (const [key, value] of items) {
            if (value.folder_id !== body.p_folder_id) continue;
            unassigned += 1;
            if (value.trashed_at) items.set(key, { ...value, folder_id: null });
            else items.delete(key);
          }
          for (const [key, value] of folders) folders.set(key, value.filter((f) => f.id !== body.p_folder_id));
          return { unassigned_count: unassigned };
        }
        case 'owner_move_workspace_items': {
          for (const id of body.p_resource_ids) {
            const key = `${scope}:${id}`;
            const previous = items.get(key);
            if (!body.p_folder_id && !previous?.trashed_at) items.delete(key);
            else items.set(key, { folder_id: body.p_folder_id ?? null, trashed_at: previous?.trashed_at ?? null });
          }
          return { moved: body.p_resource_ids.length };
        }
        case 'owner_workspace_delete_preflight':
          return body.p_resource_ids.map((id) => plan(scope, id));
        case 'owner_workspace_delete_items':
          return body.p_resource_ids.map((id) => {
            const p = plan(scope, id);
            const key = `${scope}:${id}`;
            if (p.action === 'hard_delete') { items.delete(key); return { ...p, outcome: 'hard_deleted', error: null }; }
            items.set(key, { folder_id: items.get(key)?.folder_id ?? null, trashed_at: '2026-08-30T00:00:00Z' });
            return {
              ...p,
              outcome: p.action === 'cancel_and_trash' ? 'cancelled_and_trashed'
                : p.action === 'archive_and_trash' ? 'archived_and_trashed' : 'trashed',
              error: null,
            };
          });
        case 'owner_workspace_restore_items': {
          for (const id of body.p_resource_ids) {
            const key = `${scope}:${id}`;
            const previous = items.get(key);
            if (!previous) continue;
            if (previous.folder_id) items.set(key, { ...previous, trashed_at: null });
            else items.delete(key);
          }
          return { restored: body.p_resource_ids.length };
        }
        default:
          return undefined;
      }
    },
  };
}

const workspace = createWorkspace();
const WORKSPACE_FNS = new Set([
  'owner_workspace_state', 'owner_create_workspace_folder', 'owner_rename_workspace_folder',
  'owner_delete_workspace_folder', 'owner_move_workspace_items', 'owner_workspace_delete_preflight',
  'owner_workspace_delete_items', 'owner_workspace_restore_items', 'owner_workspace_purge_items',
]);

/* ------------------------------------------------------------- browser rig */

function startDevServer() {
  const child = spawn('npx', ['vite', '--host', '127.0.0.1', '--port', '4322', '--strictPort'], {
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

async function preparePage(page, { reducedMotion = false } = {}) {
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
      if (rpc && WORKSPACE_FNS.has(rpc[1])) {
        let body = {};
        try { body = JSON.parse(Buffer.from(request.postData ?? '{}', 'utf8').toString()); } catch { /* empty */ }
        const value = workspace.handle(rpc[1], body);
        if (value && value.__error) {
          await page.send('Fetch.fulfillRequest', {
            requestId, responseCode: 400, responseHeaders: headers,
            body: b64(JSON.stringify({ message: value.__error, code: 'P0001' })),
          });
          return;
        }
        await page.send('Fetch.fulfillRequest', {
          requestId, responseCode: 200, responseHeaders: headers, body: b64(JSON.stringify(value ?? null)),
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
    features: [
      { name: 'prefers-color-scheme', value: 'light' },
      { name: 'prefers-reduced-motion', value: reducedMotion ? 'reduce' : 'no-preference' },
    ],
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

async function setViewport(page, viewport) {
  await page.send('Emulation.setDeviceMetricsOverride', {
    width: viewport.width, height: viewport.height, deviceScaleFactor: 1, mobile: viewport.mobile,
  });
}

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

/* -------------------------------------------------------- DOM vocabulary */
//
// Everything is addressed the way a user perceives it — an accessible name — rather than
// by class name, so a styling change cannot silently make this suite stop testing anything.

const HELPERS = `
  window.__qa = {
    rail: () => document.querySelector('[role="radiogroup"][aria-label="Nach Ordner filtern"]'),
    chips: () => [...(window.__qa.rail()?.querySelectorAll('[role="radio"]') ?? [])],
    chip: (text) => window.__qa.chips().find((c) => c.textContent.includes(text)),
    byName: (role, name) => [...document.querySelectorAll('[role="' + role + '"], button, input')]
      .filter((el) => {
        const label = el.getAttribute('aria-label') ?? el.textContent.trim();
        return label === name || (name instanceof RegExp && name.test(label));
      }),
    button: (name) => [...document.querySelectorAll('button')]
      .find((b) => (b.getAttribute('aria-label') ?? b.textContent.trim()) === name),
    buttonLike: (fragment) => [...document.querySelectorAll('button')]
      .find((b) => (b.getAttribute('aria-label') ?? b.textContent.trim()).includes(fragment)),
    menuItem: (name) => [...document.querySelectorAll('[role="menuitem"]')]
      .find((m) => m.textContent.trim() === name),
    dialog: () => document.querySelector('[role="dialog"][aria-modal="true"]'),
    rows: () => [...document.querySelectorAll('table tbody tr')],
    overflow: () => Math.round(document.scrollingElement.scrollWidth - document.scrollingElement.clientWidth),
    click: (el) => { if (!el) return false; el.scrollIntoView({ block: 'center' }); el.click(); return true; },
    // Radix menus open on pointerdown and commit on pointerup, so a bare .click() never
    // reaches them. This is the real pointer sequence a mouse produces.
    press: (el) => {
      if (!el) return false;
      el.scrollIntoView({ block: 'center' });
      const opts = { bubbles: true, cancelable: true, button: 0, pointerId: 1, isPrimary: true, pointerType: 'mouse' };
      el.dispatchEvent(new PointerEvent('pointerdown', opts));
      el.dispatchEvent(new MouseEvent('mousedown', opts));
      el.dispatchEvent(new PointerEvent('pointerup', opts));
      el.dispatchEvent(new MouseEvent('mouseup', opts));
      el.dispatchEvent(new MouseEvent('click', opts));
      return true;
    },
    type: (el, value) => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(el, value);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    },
  };
`;

const withHelpers = (expr) => `(() => { ${HELPERS} return (${expr}); })()`;
const run = (page, expr) => evaluate(page, withHelpers(expr));

/* -------------------------------------------------------------------- run */

mkdirSync(OUT_DIR, { recursive: true });
const server = await startDevServer();
const browser = await launchChromium(chromiumPath);
const { page } = browser;

try {
  const consoleErrors = await preparePage(page);

  // ---------------------------------------------------------------- flows
  // The full journey from the quality bar: create a folder, move records into it,
  // open it, select rows, delete them, open the Papierkorb, restore — without leaving
  // the page. Driven on Invoices, where the delete semantics are the strictest.
  await setViewport(page, ALL_VIEWPORTS[0]);
  consoleErrors.length = 0;

  if (!(await goto(page, '/admin/finance/invoices'))) {
    bad('flow: invoices did not render');
  } else {
    // 1. The rail opens on "Alle" with both system views and nothing invented.
    const initial = await run(page, `({
      chips: window.__qa.chips().map((c) => c.textContent.trim()),
      active: window.__qa.chips().find((c) => c.getAttribute('aria-checked') === 'true')?.textContent.trim(),
    })`);
    if (initial.active?.startsWith('Alle') && initial.chips.some((c) => c.startsWith('Papierkorb'))) {
      ok(`rail: opens on "Alle" with ${initial.chips.length} views`);
    } else {
      bad('rail: initial state', JSON.stringify(initial));
    }

    // 2. Create a folder: click +, type, Enter. It exists once the server confirms.
    await run(page, `window.__qa.click(window.__qa.button('Neuer Ordner'))`);
    await wait(700);
    await run(page, `(() => {
      const input = window.__qa.dialog().querySelector('input');
      window.__qa.type(input, 'SV Heinersreuth');
      return true;
    })()`);
    await wait(150);
    await run(page, `window.__qa.click(window.__qa.button('Ordner anlegen'))`);
    await wait(900);
    const created = await run(page, `({
      chips: window.__qa.chips().map((c) => c.textContent.trim()),
      dialogOpen: Boolean(window.__qa.dialog()),
      active: window.__qa.chips().find((c) => c.getAttribute('aria-checked') === 'true')?.textContent.trim(),
    })`);
    if (created.chips.some((c) => c.includes('SV Heinersreuth')) && !created.dialogOpen
        && created.active?.includes('SV Heinersreuth')) {
      ok('create folder: appears immediately and becomes the active view');
    } else {
      bad('create folder', JSON.stringify(created));
    }

    // 3. A duplicate name is an INLINE error and the dialog stays open — never a toast.
    await run(page, `window.__qa.click(window.__qa.button('Neuer Ordner'))`);
    await wait(700);
    await run(page, `(() => { window.__qa.type(window.__qa.dialog().querySelector('input'), 'sv heinersreuth'); return true; })()`);
    await wait(150);
    await run(page, `window.__qa.click(window.__qa.button('Ordner anlegen'))`);
    await wait(700);
    const duplicate = await run(page, `({
      open: Boolean(window.__qa.dialog()),
      inline: window.__qa.dialog()?.querySelector('[id$="-error"]')?.textContent?.trim() ?? null,
    })`);
    if (duplicate.open && /existiert bereits/.test(duplicate.inline ?? '')) {
      ok('create folder: a duplicate name is refused inline, in the dialog');
    } else {
      bad('create folder: duplicate handling', JSON.stringify(duplicate));
    }
    // Escape must close the dialog.
    await evaluate(page, `document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`);
    await wait(400);
    if (await run(page, `!window.__qa.dialog()`)) ok('overlays: Escape closes the folder dialog');
    else bad('overlays: Escape', 'the folder dialog stayed open');

    // 4. Move rows into it, from the bulk bar, in one request.
    await run(page, `window.__qa.click(window.__qa.chip('Alle'))`);
    await wait(500);
    await run(page, `window.__qa.click(document.querySelector('input[aria-label="Alle sichtbaren Zeilen auswählen"]'))`);
    await wait(300);
    const bulkBar = await run(page, `document.body.innerText.includes('ausgewählt')`);
    if (bulkBar) ok('bulk bar: appears with a live selection count');
    else bad('bulk bar', 'no selection count appeared');

    await run(page, `window.__qa.click(window.__qa.button('In Ordner verschieben'))`);
    await wait(400);
    await run(page, `window.__qa.click([...window.__qa.dialog().querySelectorAll('button')].find((b) => b.textContent.trim() === 'SV Heinersreuth'))`);
    await wait(1200);
    const moved = await run(page, `window.__qa.chip('SV Heinersreuth')?.textContent.trim() ?? null`);
    if (/SV Heinersreuth\s*10/.test(moved ?? '')) ok(`bulk move: the folder now counts every moved row (${moved})`);
    else bad('bulk move', `folder chip reads "${moved}"`);

    // 5. Open the folder: the list is exactly its contents.
    await run(page, `window.__qa.click(window.__qa.chip('SV Heinersreuth'))`);
    await wait(700);
    const inFolder = await run(page, `window.__qa.rows().length`);
    if (inFolder === 10) ok('folder view: shows only the folder’s records');
    else bad('folder view', `${inFolder} rows in a folder that holds 10`);

    // 6. The row menu opens, is not clipped, and carries both organisation actions.
    await run(page, `window.__qa.press(window.__qa.buttonLike('organisieren'))`);
    await wait(600);
    const menu = await run(page, `(() => {
      const items = [...document.querySelectorAll('[role="menuitem"]')].map((m) => m.textContent.trim());
      const content = document.querySelector('[data-cq-portal="dashboard"][role="menu"], [role="menu"][data-radix-menu-content]');
      const box = content?.getBoundingClientRect();
      return {
        items,
        portaled: Boolean(document.querySelector('[data-radix-popper-content-wrapper] [data-cq-portal="dashboard"]')
          || content?.closest('[data-radix-popper-content-wrapper]')),
        inViewport: box ? box.right <= window.innerWidth + 1 && box.left >= -1 && box.bottom <= window.innerHeight + 1 : false,
      };
    })()`);
    if (menu.items.includes('In Ordner verschieben') && menu.items.includes('Löschen')) {
      ok('row menu: offers "In Ordner verschieben" and "Löschen"');
    } else {
      bad('row menu: items', JSON.stringify(menu.items));
    }
    if (menu.portaled) ok('row menu: portaled, so a sticky header or table overflow cannot clip it');
    else bad('row menu: portal', 'the menu is not in a Radix portal');
    if (menu.inViewport) ok('row menu: stays fully inside the viewport');
    else bad('row menu: clipping', 'the menu escaped the viewport');

    // 7. The delete confirmation states what the SERVER decided, not the menu wording.
    await run(page, `window.__qa.press(window.__qa.menuItem('Löschen'))`);
    await wait(1400);
    const confirm = await run(page, `(() => {
      const d = window.__qa.dialog();
      return d ? { title: d.querySelector('h2')?.textContent.trim(), body: d.innerText } : null;
    })()`);
    if (confirm?.title === 'Rechnung entfernen?'
        && /Rechnungsnummer und der gesetzlich erforderliche Nachweis bleiben erhalten/.test(confirm.body)) {
      ok('delete confirmation: an issued invoice is offered as Storno + removal, and says the number is kept');
    } else {
      bad('delete confirmation', JSON.stringify(confirm)?.slice(0, 300));
    }
    await evaluate(page, `document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`);
    await wait(400);

    // 8. Delete a selection, land in the Papierkorb, restore.
    await run(page, `window.__qa.click(document.querySelector('input[aria-label="Alle sichtbaren Zeilen auswählen"]'))`);
    await wait(300);
    await run(page, `window.__qa.click(window.__qa.button('Löschen'))`);
    await wait(1200);
    const bulkConfirm = await run(page, `window.__qa.dialog()?.innerText ?? ''`);
    if (/endgültig gelöscht/.test(bulkConfirm) && /Papierkorb verschoben/.test(bulkConfirm)) {
      ok('bulk delete: the confirmation breaks the batch down by what will happen to each record');
    } else {
      bad('bulk delete confirmation', bulkConfirm.slice(0, 300));
    }
    await run(page, `window.__qa.click([...window.__qa.dialog().querySelectorAll('button')].find((b) => b.textContent.trim() === 'Entfernen'))`);
    await wait(1800);

    await run(page, `window.__qa.click(window.__qa.chip('Papierkorb'))`);
    await wait(900);
    const trash = await run(page, `({
      rows: window.__qa.rows().length,
      restore: Boolean(window.__qa.button('Wiederherstellen')),
      protectedNote: document.body.innerText.includes('Nachweis-/Buchhaltungsgründen erhalten bleiben'),
      fakePermanent: Boolean(window.__qa.button('Endgültig löschen')),
    })`);
    if (trash.rows > 0 && trash.restore) ok(`Papierkorb: holds ${trash.rows} records, each restorable`);
    else bad('Papierkorb', JSON.stringify(trash));
    if (trash.protectedNote && !trash.fakePermanent) {
      ok('Papierkorb: a protected record explains itself instead of showing a delete button that would refuse');
    } else {
      bad('Papierkorb: protected records', JSON.stringify(trash));
    }

    await run(page, `window.__qa.click(window.__qa.button('Wiederherstellen'))`);
    await wait(1400);
    const afterRestore = await run(page, `window.__qa.rows().length`);
    if (afterRestore === trash.rows - 1) ok('Papierkorb: restore returns a record to the workspace');
    else bad('Papierkorb: restore', `${trash.rows} -> ${afterRestore}`);

    if (consoleErrors.length) bad('flow: console errors', consoleErrors.slice(0, 3).join('\n      '));
    else ok('flow: no console errors across the whole journey');
  }

  // ----------------------------------------------------------- viewports
  // The rail must fit every supported width without ever giving the PAGE a
  // horizontal scrollbar, and a long folder name must truncate rather than widen it.
  for (const viewport of VIEWPORTS) {
    await setViewport(page, viewport);
    for (const target of PAGES) {
      const label = `${target.slug} @ ${viewport.label}`;
      consoleErrors.length = 0;
      if (!(await goto(page, target.path))) { bad(label, 'never rendered'); continue; }
      await screenshot(page, `${OUT_DIR}/${target.slug}--${viewport.label}.png`);
      const probe = await run(page, `(() => {
        const rail = window.__qa.rail();
        const chips = window.__qa.chips();
        const long = chips.find((c) => c.textContent.includes('Website-Projekte'));
        // Truncation shows up as SOME element inside the chip being clipped; which one
        // depends on the markup, so the whole subtree is asked rather than one guess.
        const clipped = long
          ? [long, ...long.querySelectorAll('*')].some((el) => el.scrollWidth > el.clientWidth + 1)
          : null;
        return {
          overflow: window.__qa.overflow(),
          rail: Boolean(rail),
          chipWidth: long ? Math.round(long.getBoundingClientRect().width) : null,
          truncated: clipped,
          chips: chips.length,
        };
      })()`);
      if (!probe.rail) { bad(label, 'no folder rail rendered'); continue; }
      if (probe.overflow > 1) { bad(`${label}: horizontal page overflow`, `${probe.overflow}px`); continue; }
      if (probe.truncated === false) {
        bad(`${label}: long folder name`, `chip is ${probe.chipWidth}px and nothing inside it is clipped`);
        continue;
      }
      if (consoleErrors.length) { bad(`${label}: console errors`, consoleErrors.slice(0, 2).join('; ')); continue; }
      ok(`${label}: rail with ${probe.chips} views, no page overflow`);
    }
  }

  // ------------------------------------------------------- reduced motion
  // prefers-reduced-motion must reach the rail AND the portaled overlays. The dashboard
  // collapses durations under `[data-cq-surface]` and `[data-cq-portal]`, so a new node
  // that portals to document.body without the marker would silently keep animating —
  // which is exactly what is checked here rather than assumed.
  await setViewport(page, ALL_VIEWPORTS[0]);
  await page.send('Emulation.setEmulatedMedia', {
    features: [
      { name: 'prefers-color-scheme', value: 'light' },
      { name: 'prefers-reduced-motion', value: 'reduce' },
    ],
  });
  if (await goto(page, '/admin/finance/expenses')) {
    await run(page, `window.__qa.click(window.__qa.button('Neuer Ordner'))`);
    await wait(700);
    const motion = await run(page, `(() => {
      const ms = (value) => Math.max(...String(value).split(',').map((v) => parseFloat(v) * (v.includes('ms') ? 1 : 1000) || 0));
      const chip = window.__qa.chips()[0];
      const dialog = window.__qa.dialog();
      const portal = dialog?.closest('[data-cq-portal="dashboard"]');
      return {
        chip: ms(getComputedStyle(chip).transitionDuration),
        dialogAnimation: dialog ? ms(getComputedStyle(dialog).animationDuration) : null,
        marked: Boolean(portal),
      };
    })()`);
    if (!motion.marked) {
      bad('reduced motion: portal marker', 'the folder dialog portal is missing data-cq-portal="dashboard"');
    } else if (motion.chip > 20 || (motion.dialogAnimation ?? 0) > 20) {
      bad('reduced motion', `chip ${motion.chip}ms, dialog ${motion.dialogAnimation}ms — durations were not collapsed`);
    } else {
      ok('reduced motion: rail and portaled dialog both collapse their durations');
    }
    await screenshot(page, `${OUT_DIR}/reduced-motion.png`);
  }

  await browser.close?.();
} catch (error) {
  bad('admin folder QA crashed', error?.message ?? String(error));
} finally {
  try { await browser.close?.(); } catch { /* already gone */ }
  try { process.kill(-server.pid, 'SIGTERM'); } catch { /* already gone */ }
}

console.log(`\nscreenshots: ${OUT_DIR}`);
if (failures) {
  console.error(`\n${failures} admin folder QA check(s) failed`);
  process.exit(1);
}
console.log('\nadmin folder QA passed');
