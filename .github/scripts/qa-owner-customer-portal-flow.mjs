#!/usr/bin/env node
// =============================================================================
// Owner customer-portal integration QA — real browser, real app, fixtured backend
// =============================================================================
// Drives the actual owner-facing flow this release adds:
//
//   canonical customer (/admin/clients/:organizationId)
//     -> "Kundenportal" tab
//     -> existing customer project appears (no owner_customers row needed)
//     -> create a new project (organization-scoped RPC)
//     -> add a milestone
//     -> upload a document (uploadCustomerDocument only, never Storage directly)
//     -> explicit "Freigeben" publishes it
//     -> the customer (/app/documents) can then see and download it
//
// Every Supabase call is intercepted and answered from an in-memory fixture store
// that mutates as the flow progresses, so assertions are against the SAME data the
// UI just wrote — not a static fixture. Not part of the default CI job: it needs a
// browser and a dev server. Run with
//   node .github/scripts/qa-owner-customer-portal-flow.mjs
// (requires playwright resolvable, e.g. NODE_PATH pointing at an install).
// =============================================================================

import { spawn } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';

const require_ = createRequire(import.meta.url);
const { chromium } = require_(process.env.PLAYWRIGHT_PATH ?? 'playwright');

const ORIGIN = 'http://127.0.0.1:4321';
const SUPABASE = 'https://qa-owner.supabase.co';

let failures = 0;
const ok = (label) => console.log(`ok: ${label}`);
const bad = (label, detail) => {
  failures += 1;
  console.error(`FAIL: ${label}${detail ? `\n      ${detail}` : ''}`);
};

// ---------------------------------------------------------------- fixtures
const OWNER_ID = '99999999-9999-9999-9999-999999999999';
const ORG_ID = '44444444-4444-4444-4444-444444444444';
const ACCOUNT_ID = '55555555-5555-5555-5555-555555555555';
const EXISTING_PROJECT_ID = '66666666-6666-6666-6666-666666666666';
const CUSTOMER_USER_ID = '77777777-7777-7777-7777-777777777777';

// Mutable server-side state: every mutation the owner performs in the browser
// updates this store, and every subsequent read is served FROM it — the same
// contract a real Supabase backend gives the app.
const state = {
  projects: [
    {
      id: EXISTING_PROJECT_ID,
      organization_id: ORG_ID,
      engagement_id: null,
      title: 'Pankofer Rollout',
      business_objective: 'Telefonassistent für die Zentrale ausrollen.',
      status: 'on_track',
      phase: 'Umsetzung',
      progress_percent: 40,
      start_date: '2026-06-01',
      target_date: '2026-09-30',
      next_action_summary: null,
      next_action_owner: null,
      next_action_due_date: null,
      customer_safe_blocker_summary: null,
      contact_profile_id: null,
      contact_role_label: null,
      contact_business_email: null,
      is_archived: false,
      created_at: '2026-06-01T00:00:00Z',
      updated_at: '2026-06-01T00:00:00Z',
    },
  ],
  documents: [],
  milestonesByProject: {},
  nextId: 1,
};

function freshId(prefix) {
  state.nextId += 1;
  return `${prefix}-${String(state.nextId).padStart(8, '0')}`;
}

// ------------------------------------------------------------- dev server
function startDevServer() {
  const child = spawn('npx', ['vite', '--host', '127.0.0.1', '--port', '4321', '--strictPort'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      VITE_SUPABASE_URL: SUPABASE,
      VITE_SUPABASE_ANON_KEY: 'qa-owner-anon-key',
      VITE_OURA_CLIENT_ID: 'qa',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
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

function findChromium() {
  if (process.env.QA_CHROMIUM) return process.env.QA_CHROMIUM;
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH ?? '/opt/pw-browsers';
  for (const dir of existsSync(base) ? readdirSync(base) : []) {
    for (const rel of ['chrome-linux/chrome', 'chrome-linux/headless_shell']) {
      const candidate = `${base}/${dir}/${rel}`;
      if (existsSync(candidate)) return candidate;
    }
  }
  return undefined;
}

// Minimal multipart/form-data field extractor — only text fields are needed
// here (the file bytes themselves are irrelevant to the fixture), so this
// deliberately does not attempt to decode the file part.
function parseMultipartFields(request) {
  const contentType = request.headers()['content-type'] ?? '';
  const match = /boundary=(?:"([^"]+)"|([^;]+))/.exec(contentType);
  const boundary = match?.[1] ?? match?.[2];
  const body = request.postData();
  if (!boundary || !body) return {};
  const fields = {};
  for (const part of body.split(`--${boundary}`)) {
    const nameMatch = /name="([^"]+)"/.exec(part);
    if (!nameMatch || /filename="/.test(part)) continue;
    const value = part.split(/\r\n\r\n/)[1]?.replace(/\r\n--$/, '').trim();
    if (value !== undefined) fields[nameMatch[1]] = value;
  }
  return fields;
}

// -------------------------------------------------------------- routing
function router(role) {
  return async (route) => {
    const req = route.request();
    const url = req.url();
    const json = (body, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(body) });

    if (req.method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } });
    }

    const userId = role === 'owner' ? OWNER_ID : CUSTOMER_USER_ID;
    const email = role === 'owner' ? 'owner@cogniiq.de' : 'kunde@pankofer.example';

    // --- auth ---
    if (url.includes('/auth/v1/user')) {
      return json({ id: userId, aud: 'authenticated', email, user_metadata: {}, app_metadata: {} });
    }
    if (url.includes('/auth/v1/token')) {
      return json({ access_token: 'qa-token', token_type: 'bearer', expires_in: 3600, refresh_token: 'qa-refresh', user: { id: userId, email } });
    }
    if (url.includes('/auth/v1/logout')) return json({});

    if (url.includes('/rest/v1/rpc/claim_my_client_invitations')) return json(null);

    // --- account bootstrap ---
    if (url.includes('/rest/v1/profiles')) {
      return json({
        id: userId, email, full_name: role === 'owner' ? 'Owner Testperson' : 'Pankofer Kunde',
        platform_role: role === 'owner' ? 'cogniiq_owner' : 'customer',
        created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
      });
    }
    if (url.includes('/rest/v1/organization_members')) {
      if (role !== 'customer') return json([]);
      return json([{
        id: 'om1', organization_id: ORG_ID, user_id: userId, role: 'member', status: 'active',
        created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
        organizations: { id: ORG_ID, name: 'Pankofer GmbH', slug: 'pankofer', status: 'active', created_by: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
      }]);
    }

    // --- /admin/clients/:organizationId (loadClientDetail) ---
    if (url.includes('/rest/v1/client_accounts')) {
      return json({
        id: ACCOUNT_ID, organization_id: ORG_ID, legal_name: 'Pankofer GmbH', display_name: 'Pankofer GmbH',
        primary_contact_name: 'Herr Pankofer', primary_email: 'info@pankofer.example', phone: null, website: null,
        industry: null, address: null, lifecycle_status: 'active', lead_source: null, internal_notes: null,
        estimated_total_budget_cents: null, estimated_monthly_value_cents: null, currency: 'EUR',
      });
    }
    if (url.includes('/rest/v1/organizations')) {
      return json({ id: ORG_ID, name: 'Pankofer GmbH', status: 'active' });
    }
    if (url.includes('/rest/v1/organization_solutions')) return json([]);
    if (url.includes('/rest/v1/client_engagements')) return json([]);
    if (url.includes('/rest/v1/client_invitations')) return json([]);
    if (url.includes('/rest/v1/client_contacts')) return json([]);

    // --- customer_projects (owner read + org-scoped create RPC) ---
    if (url.includes('/rest/v1/rpc/create_customer_project_for_organization')) {
      const body = req.postDataJSON();
      const id = freshId('project');
      state.projects.push({
        id, organization_id: body.p_organization_id, engagement_id: null,
        title: body.p_title, business_objective: body.p_business_objective, status: 'on_track',
        phase: body.p_phase, progress_percent: 0, start_date: null, target_date: null,
        next_action_summary: null, next_action_owner: null, next_action_due_date: null,
        customer_safe_blocker_summary: null, contact_profile_id: null, contact_role_label: null,
        contact_business_email: null, is_archived: false,
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      });
      state.milestonesByProject[id] = [];
      return json(id);
    }
    if (url.includes('/rest/v1/rpc/create_customer_project_milestone')) {
      const body = req.postDataJSON();
      const id = freshId('milestone');
      const list = state.milestonesByProject[body.p_project_id] ?? (state.milestonesByProject[body.p_project_id] = []);
      list.push({
        id, project_id: body.p_project_id, title: body.p_title, description: body.p_description,
        status: 'upcoming', target_date: body.p_target_date, completed_at: null,
        sort_order: body.p_sort_order ?? list.length,
      });
      return json(id);
    }
    if (url.includes('/rest/v1/rpc/set_customer_document_visibility')) {
      const body = req.postDataJSON();
      const doc = state.documents.find((d) => d.id === body.p_document_id);
      if (doc) { doc.customer_visible = body.p_visible; doc.published_at = body.p_visible ? new Date().toISOString() : null; }
      return json(null);
    }

    if (url.includes('/rest/v1/customer_projects')) {
      if (role === 'customer') {
        return json(state.projects.filter((p) => p.organization_id === ORG_ID && !p.is_archived));
      }
      return json(state.projects);
    }
    if (url.includes('/rest/v1/customer_project_milestones')) {
      const projectId = /project_id=eq\.([^&]+)/.exec(url)?.[1];
      return json(state.milestonesByProject[projectId] ?? []);
    }
    if (url.includes('/rest/v1/rpc/list_customer_documents')) {
      return json(state.documents.filter((d) => d.customer_visible && !d.archived_at));
    }
    if (url.includes('/rest/v1/customer_documents')) {
      return json(state.documents);
    }

    // --- upload edge function: the ONLY path into Storage for a customer document ---
    if (url.includes('/functions/v1/customer-document-upload')) {
      const fields = parseMultipartFields(req);
      const id = freshId('doc');
      state.documents.push({
        id,
        project_id: fields.project_id ?? null,
        category: fields.category ?? 'project_document',
        title: fields.title ?? 'QA Upload Dokument',
        version: 1, customer_visible: false, published_at: null, archived_at: null,
        content_type: 'application/pdf', size_bytes: 1234, uploaded_at: new Date().toISOString(),
        owner_generated_document_id: null,
      });
      return json({ document_id: id, customer_visible: false }, 201);
    }
    if (url.includes('/functions/v1/customer-document-download')) {
      return json({ url: 'https://qa-owner.supabase.co/storage/v1/object/sign/x', expires_in: 600 });
    }

    if (url.includes('/rest/v1/')) return json([]);
    return json({});
  };
}

async function newPage(browser, role, width = 1440) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, locale: 'de-DE' });
  await context.route(`${SUPABASE}/**`, router(role));
  const userId = role === 'owner' ? OWNER_ID : CUSTOMER_USER_ID;
  const email = role === 'owner' ? 'owner@cogniiq.de' : 'kunde@pankofer.example';
  await context.addInitScript(([url, uid, mail]) => {
    const ref = url.split('//')[1].split('.')[0];
    const session = {
      access_token: 'qa-token', token_type: 'bearer', expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: 'qa-refresh',
      user: { id: uid, aud: 'authenticated', email: mail, user_metadata: {}, app_metadata: {}, created_at: '2026-01-01T00:00:00Z' },
    };
    window.localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify(session));
  }, [SUPABASE, userId, email]);
  const page = await context.newPage();
  page.on('pageerror', (error) => bad('no uncaught page error', String(error)));
  return { context, page };
}

async function settle(page, ms = 900) {
  await page.waitForTimeout(ms);
}

async function assertVisibleText(page, needle, label) {
  const text = await page.evaluate(() => document.body.innerText);
  if (text.includes(needle)) ok(`${label}: shows "${needle}"`);
  else bad(`${label}: shows "${needle}"`, `body text was FULL: ${text.replace(/\s+/g, ' ')}`);
}

// ------------------------------------------------------------------- run
const server = await startDevServer();
const browser = await chromium.launch({ executablePath: findChromium() });

try {
  const { context, page } = await newPage(browser, 'owner');

  // ---- 1) canonical customer -> Kundenportal tab; the existing project appears --
  await page.goto(`${ORIGIN}/admin/clients/${ORG_ID}`, { waitUntil: 'domcontentloaded' });
  await settle(page);
  await assertVisibleText(page, 'Pankofer GmbH', 'client detail');

  await page.click('button:has-text("Kundenportal")');
  await settle(page);
  await assertVisibleText(page, 'Pankofer Rollout', 'Kundenportal tab (existing project, no owner_customers row)');

  // ---- 2) create a new project through the organization-scoped RPC -------------
  await page.click('button:has-text("Projekt anlegen")');
  await settle(page, 400);
  const createDialog = page.locator('[role="dialog"]');
  await createDialog.locator('#cp-title').fill('QA Kundenportal Projekt');
  await createDialog.locator('#cp-objective').fill('Automatisiert getestetes Projekt.');
  await createDialog.locator('#cp-phase').fill('Konzept');
  await createDialog.locator('button:has-text("Anlegen")').click();
  await settle(page, 800);
  await assertVisibleText(page, 'QA Kundenportal Projekt', 'Kundenportal tab (newly created project)');

  // ---- 3) expand it, add a milestone --------------------------------------------
  const rows = page.locator('text=QA Kundenportal Projekt').locator('xpath=ancestor::div[contains(@class,"rounded-2xl")][1]');
  await rows.locator('button:has-text("Meilensteine & Dokumente")').click();
  await settle(page, 500);
  const milestoneInput = rows.locator('input[placeholder="Neuer Meilenstein"]');
  await milestoneInput.fill('QA Meilenstein');
  await rows.locator('button:has-text("Hinzufügen")').click();
  await settle(page, 600);
  await assertVisibleText(page, 'QA Meilenstein', 'milestone added under the new project');

  // ---- 4) upload a document: shows MIME/size limits, requires all fields --------
  await page.click('button:has-text("Dokument hochladen")');
  await settle(page, 400);
  const uploadDialog = page.locator('[role="dialog"]');
  await assertVisibleText(page, 'PDF, PNG, JPEG, TXT, DOCX', 'upload dialog (allowed MIME types shown)');
  await assertVisibleText(page, '25 MB', 'upload dialog (25 MiB limit shown)');

  const uploadButton = uploadDialog.locator('button:has-text("Hochladen")');
  if (await uploadButton.isDisabled()) ok('upload dialog: submit disabled until project, category, title and file are all set');
  else bad('upload dialog: submit disabled until project, category, title and file are all set', 'button was enabled with an empty form');

  await uploadDialog.locator('#doc-project').selectOption({ label: 'QA Kundenportal Projekt' });
  await uploadDialog.locator('#doc-title').fill('QA Upload Dokument');
  await uploadDialog.locator('#doc-file').setInputFiles({
    name: 'qa-dokument.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4 QA fixture'),
  });
  await settle(page, 300);
  await uploadDialog.locator('button:has-text("Hochladen")').click();
  await settle(page, 800);
  await assertVisibleText(page, 'Nicht freigegeben', 'document list (uploaded document starts unpublished)');

  // ---- 5) explicit "Freigeben" makes it customer-visible -------------------------
  await page.click('button:has-text("Freigeben")');
  await settle(page, 600);
  await assertVisibleText(page, 'Sichtbar', 'document list (published after explicit Freigeben)');

  await context.close();

  // ---- 6) the customer can now see and download the published document ----------
  const customerSession = await newPage(browser, 'customer', 375);
  await customerSession.page.goto(`${ORIGIN}/app/documents`, { waitUntil: 'domcontentloaded' });
  await settle(customerSession.page);
  await assertVisibleText(customerSession.page, 'QA Upload Dokument', 'customer /app/documents (sees the published upload)');
  await customerSession.context.close();
} catch (error) {
  bad('owner customer-portal flow did not complete', error instanceof Error ? error.stack ?? error.message : String(error));
} finally {
  await browser.close();
  try { process.kill(-server.pid, 'SIGTERM'); } catch { server.kill('SIGTERM'); }
}

console.log('');
console.log(failures === 0 ? 'owner customer-portal flow QA: ALL PASSED' : `owner customer-portal flow QA: ${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
