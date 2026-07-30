#!/usr/bin/env node
// =============================================================================
// Commercial-document publishing QA — real browser, real app, fixtured backend
// =============================================================================
// Drives the exact flow that had to be performed BY HAND for the Pankofer invoice
// because the Owner UI did not exist:
//
//   owner opens /admin/finance/invoices/:id
//     -> the "Kundenportal" card shows the finalized PDF as "Nicht registriert"
//     -> selects the customer project
//     -> "Für Kundenportal registrieren"  (registers a POINTER; still invisible)
//     -> "Für Kunden freigeben"           (now customer-visible)
//   customer opens /app/billing
//     -> the invoice shows a download action
//     -> downloading calls the customer-document-download function with the
//        pdf_document_id that list_customer_invoices resolved
//   owner returns and "Freigabe zurücknehmen"
//     -> the customer's download action is gone again
//
// Every Supabase call is intercepted and answered from a MUTABLE in-memory store, so
// each assertion is against the data the UI just wrote. The store also reimplements
// the two rules the release depends on:
//   * register is idempotent per (organization, canonical PDF) — a second call returns
//     the same pointer id and never appends a row;
//   * list_customer_invoices resolves pdf_document_id only from a finalized,
//     customer-visible, non-archived pointer of document_type='invoice'.
//
// Not part of the default CI job: it needs a browser and a dev server. Run with
//   node .github/scripts/qa-commercial-publishing-flow.mjs
// (requires playwright resolvable, e.g. NODE_PATH pointing at an install).
// =============================================================================

import { spawn } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';

const require_ = createRequire(import.meta.url);
const { chromium } = require_(process.env.PLAYWRIGHT_PATH ?? 'playwright');

const ORIGIN = 'http://127.0.0.1:4322';
const SUPABASE = 'https://qa-publish.supabase.co';

let failures = 0;
const ok = (label) => console.log(`ok: ${label}`);
const bad = (label, detail) => {
  failures += 1;
  console.error(`FAIL: ${label}${detail ? `\n      ${detail}` : ''}`);
};

// ---------------------------------------------------------------- fixtures
const OWNER_ID = '99999999-9999-9999-9999-999999999999';
const CUSTOMER_USER_ID = '77777777-7777-7777-7777-777777777777';
const ORG_ID = '2b2d106d-1755-4601-b797-1ebe8fb8a88e';
const ACCOUNT_ID = '55555555-5555-5555-5555-555555555555';
const ENTITY_ID = '11111111-1111-1111-1111-111111111111';
const PROJECT_ID = '66666666-6666-6666-6666-666666666666';
const INVOICE_ID = '33333333-3333-3333-3333-333333333333';
const GENERATED_PDF_ID = '22222222-2222-2222-2222-222222222222';

let seq = 0;
const freshId = (prefix) => `${prefix}-${String(++seq).padStart(4, '0')}-0000-0000-000000000000`;

const state = {
  // One customer project, so the card can preselect it and the flow is one click.
  projects: [{
    id: PROJECT_ID, organization_id: ORG_ID, engagement_id: null,
    title: 'Pankofer Rollout', business_objective: 'Telefonassistent ausrollen.',
    status: 'on_track', phase: 'Umsetzung', progress_percent: 40,
    start_date: '2026-06-01', target_date: '2026-09-30',
    next_action_summary: null, next_action_owner: null, next_action_due_date: null,
    customer_safe_blocker_summary: null, contact_profile_id: null,
    contact_role_label: null, contact_business_email: null, is_archived: false,
    created_at: '2026-06-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z',
  }],
  // No pointer exists yet: this is the state the hosted database was in.
  customerDocuments: [],
  invoice: {
    id: INVOICE_ID, business_entity_id: ENTITY_ID, organization_id: ORG_ID,
    client_account_id: ACCOUNT_ID, engagement_id: null, invoice_number: 'RE-2026-0002',
    status: 'issued', issue_date: '2026-07-01', service_date: null, due_date: '2026-07-15',
    currency: 'EUR', net_total_cents: 100000, vat_total_cents: 19000,
    gross_total_cents: 119000, amount_paid_cents: 0, notes: null,
    external_reference: null, issued_at: '2026-07-01T00:00:00Z', archived_at: null,
    created_at: '2026-07-01T00:00:00Z', updated_at: '2026-07-01T00:00:00Z',
  },
  // A FINALIZED invoice PDF with real stored bytes — the only kind that may be published.
  generatedDocuments: [{
    id: GENERATED_PDF_ID, business_entity_id: ENTITY_ID, document_type: 'invoice',
    source_resource_type: 'owner_invoices', source_resource_id: INVOICE_ID,
    document_number: 'RE-2026-0002', version: 1, status: 'finalized', language: 'de',
    currency: 'EUR', template_version: 'v1', source_hash: 'qa-hash',
    pdf_storage_path: 'invoices/re-2026-0002-v1.pdf', render_metadata: {},
    generated_at: '2026-07-01T10:00:00Z', finalized_at: '2026-07-01T10:00:00Z', archived_at: null,
  }],
  downloadCalls: [],
  registerCalls: 0,
};

/** The pointer resolution list_customer_invoices performs, reimplemented faithfully. */
function resolvePdfDocumentId(invoiceId) {
  const candidates = state.customerDocuments
    .filter((d) => d.customer_visible && !d.archived_at)
    .map((d) => ({ d, src: state.generatedDocuments.find((g) => g.id === d.owner_generated_document_id) }))
    .filter(({ src }) => src
      && src.source_resource_type === 'owner_invoices'
      && src.source_resource_id === invoiceId
      && src.document_type === 'invoice'
      && src.status === 'finalized')
    .sort((a, b) => (b.src.version - a.src.version) || (a.d.id < b.d.id ? 1 : -1));
  return candidates[0]?.d.id ?? null;
}

// -------------------------------------------------------------- dev server
function findChromium() {
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH ?? '/opt/pw-browsers';
  if (existsSync(`${base}/chromium`)) return `${base}/chromium`;
  for (const entry of existsSync(base) ? readdirSync(base) : []) {
    for (const candidate of [
      `${base}/${entry}/chrome-linux/chrome`,
      `${base}/${entry}/chrome-linux64/chrome`,
    ]) {
      if (existsSync(candidate)) return candidate;
    }
  }
  return undefined;
}

async function startDevServer() {
  const child = spawn('npx', ['vite', '--port', '4322', '--strictPort', '--host', '127.0.0.1'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      VITE_SUPABASE_URL: SUPABASE,
      VITE_SUPABASE_ANON_KEY: 'qa-anon-key',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  });
  await new Promise((resolvePromise, reject) => {
    const timer = setTimeout(() => reject(new Error('dev server did not start')), 90_000);
    child.stdout.on('data', (chunk) => {
      if (String(chunk).includes('4322')) { clearTimeout(timer); resolvePromise(); }
    });
    child.on('exit', (code) => { clearTimeout(timer); reject(new Error(`dev server exited ${code}`)); });
  });
  await new Promise((r) => setTimeout(r, 1200));
  return child;
}

// -------------------------------------------------------------- routing
function router(role) {
  return async (route) => {
    const req = route.request();
    const url = req.url();
    const json = (body, status = 200) => route.fulfill({
      status, contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(body),
    });

    if (req.method() === 'OPTIONS') {
      return route.fulfill({
        status: 204,
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-headers': '*',
          'access-control-allow-methods': '*',
        },
      });
    }

    const userId = role === 'owner' ? OWNER_ID : CUSTOMER_USER_ID;
    const email = role === 'owner' ? 'owner@cogniiq.de' : 'kunde@pankofer.example';

    if (url.includes('/auth/v1/user')) {
      return json({ id: userId, aud: 'authenticated', email, user_metadata: {}, app_metadata: {} });
    }
    if (url.includes('/auth/v1/token')) {
      return json({ access_token: 'qa-token', token_type: 'bearer', expires_in: 3600, refresh_token: 'qa-refresh', user: { id: userId, email } });
    }
    if (url.includes('/auth/v1/logout')) return json({});
    if (url.includes('/rest/v1/rpc/claim_my_client_invitations')) return json(null);

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

    // --- owner finance context ---
    if (url.includes('/rest/v1/owner_business_entities')) {
      return json([{
        id: ENTITY_ID, display_name: 'Cogniiq', legal_form: 'Einzelunternehmen',
        tax_scheme: 'standard', default_currency: 'EUR', is_active: true,
        created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
      }]);
    }
    if (url.includes('/rest/v1/owner_document_settings')) return json(null);
    if (url.includes('/rest/v1/owner_invoice_lines')) {
      return json([{
        id: 'line-1', invoice_id: INVOICE_ID, description: 'Leistungspaket',
        quantity_milli: 1000, unit: 'Stk', unit_price_cents: 100000, vat_rate_bp: 1900,
        vat_treatment: 'standard', net_cents: 100000, vat_cents: 19000, gross_cents: 119000,
        sort_order: 0,
      }]);
    }
    if (url.includes('/rest/v1/owner_payments')) return json([]);
    if (url.includes('/rest/v1/owner_invoices')) {
      // maybeSingle() on the detail page vs a list elsewhere: both are served.
      return url.includes(`id=eq.${INVOICE_ID}`) ? json(state.invoice) : json([state.invoice]);
    }
    if (url.includes('/rest/v1/owner_generated_documents')) {
      return json(state.generatedDocuments);
    }
    if (url.includes('/rest/v1/owner_offers')) return json([]);

    // --- CRM reads used by the recipient lookup and the client detail page ---
    if (url.includes('/rest/v1/client_accounts')) {
      const account = {
        id: ACCOUNT_ID, organization_id: ORG_ID, legal_name: 'Pankofer GmbH',
        display_name: 'Pankofer GmbH', primary_contact_name: 'Herr Pankofer',
        primary_email: 'info@pankofer.example', phone: null, website: null, industry: null,
        address: 'Hauptstraße 1\n84032 Landshut', lifecycle_status: 'active', lead_source: null,
        internal_notes: null, estimated_total_budget_cents: null,
        estimated_monthly_value_cents: null, currency: 'EUR',
      };
      return url.includes('organization_id=eq.') && !url.includes('select=*') ? json(account) : json([account]);
    }
    if (url.includes('/rest/v1/organizations')) {
      return json({ id: ORG_ID, name: 'Pankofer GmbH', status: 'active' });
    }
    if (url.includes('/rest/v1/organization_solutions')) return json([]);
    if (url.includes('/rest/v1/client_engagements')) return json([]);
    if (url.includes('/rest/v1/client_invitations')) return json([]);
    if (url.includes('/rest/v1/client_contacts')) return json([]);

    // --- THE PUBLISH RPC: idempotent per (organization, canonical PDF) ---
    if (url.includes('/rest/v1/rpc/register_customer_document_from_owner_source')) {
      const body = req.postDataJSON();
      state.registerCalls += 1;
      const existing = state.customerDocuments.find(
        (d) => d.organization_id === body.p_organization_id
          && d.owner_generated_document_id === body.p_owner_generated_document_id
          && !d.archived_at,
      );
      if (existing) {
        if (!existing.customer_visible && body.p_project_id) existing.project_id = body.p_project_id;
        return json(existing.id);
      }
      const id = freshId('cdoc');
      state.customerDocuments.push({
        id, organization_id: body.p_organization_id, project_id: body.p_project_id ?? null,
        category: body.p_category, title: body.p_title, version: 1,
        customer_visible: false, published_at: null, archived_at: null,
        content_type: null, size_bytes: null, uploaded_at: new Date().toISOString(),
        owner_generated_document_id: body.p_owner_generated_document_id,
      });
      return json(id);
    }
    if (url.includes('/rest/v1/rpc/set_customer_document_visibility')) {
      const body = req.postDataJSON();
      const doc = state.customerDocuments.find((d) => d.id === body.p_document_id);
      if (doc) {
        doc.customer_visible = body.p_visible;
        // published_at latches, exactly as the RPC does.
        if (body.p_visible) doc.published_at = doc.published_at ?? new Date().toISOString();
      }
      return json(null);
    }

    if (url.includes('/rest/v1/customer_projects')) {
      return json(state.projects);
    }
    if (url.includes('/rest/v1/customer_project_milestones')) return json([]);
    if (url.includes('/rest/v1/customer_project_invoices')) return json([]);
    if (url.includes('/rest/v1/customer_documents')) {
      return json(state.customerDocuments);
    }

    // --- customer billing surface ---
    if (url.includes('/rest/v1/rpc/list_customer_projects')) {
      return json(state.projects.map((p) => ({
        project_id: p.id, title: p.title, business_objective: p.business_objective,
        status: p.status, phase: p.phase, progress_percent: p.progress_percent,
        start_date: p.start_date, target_date: p.target_date,
        next_action_summary: p.next_action_summary, next_action_owner: p.next_action_owner,
        next_action_due_date: p.next_action_due_date,
        customer_safe_blocker_summary: p.customer_safe_blocker_summary,
        contact_role_label: null, contact_business_email: null,
        organization_id: p.organization_id, organization_name: 'Pankofer GmbH',
      })));
    }
    if (url.includes('/rest/v1/rpc/list_customer_invoices')) {
      const i = state.invoice;
      return json([{
        invoice_id: i.id, project_id: PROJECT_ID, invoice_number: i.invoice_number,
        status: i.status, issue_date: i.issue_date, due_date: i.due_date, currency: i.currency,
        net_total_cents: i.net_total_cents, vat_total_cents: i.vat_total_cents,
        gross_total_cents: i.gross_total_cents, amount_paid_cents: i.amount_paid_cents,
        outstanding_cents: Math.max(i.gross_total_cents - i.amount_paid_cents, 0),
        pdf_document_id: resolvePdfDocumentId(i.id),
      }]);
    }
    if (url.includes('/rest/v1/rpc/list_customer_documents')) {
      return json(state.customerDocuments.filter((d) => d.customer_visible && !d.archived_at));
    }
    if (url.includes('/functions/v1/customer-document-download')) {
      const body = req.postDataJSON?.() ?? null;
      state.downloadCalls.push(body);
      return json({ url: `${SUPABASE}/storage/v1/object/sign/qa`, expires_in: 600 });
    }

    if (url.includes('/rest/v1/rpc/')) return json(null);
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

const settle = (page, ms = 900) => page.waitForTimeout(ms);

async function bodyText(page) {
  return page.evaluate(() => document.body.innerText);
}

// Case-insensitive: several headings are uppercased by CSS (`uppercase`), so the
// rendered innerText legitimately differs in case from the string in the source.
async function assertVisibleText(page, needle, label) {
  const text = await bodyText(page);
  if (text.toLowerCase().includes(needle.toLowerCase())) ok(`${label}: shows "${needle}"`);
  else bad(`${label}: shows "${needle}"`, `body text was: ${text.replace(/\s+/g, ' ').slice(0, 1200)}`);
}

/**
 * Whether the customer's invoice row offers a PDF download.
 *
 * Asserted on the CONTROL, not on the substring "PDF": the billing surface mentions
 * PDF in other copy, so a text search would be satisfied by prose and would pass even
 * with the download button gone — the exact regression this checks for.
 */
async function invoiceDownloadCount(page) {
  return page.locator('button:has-text("Rechnung als PDF")').count();
}

// No horizontal overflow at any width: a card full of long German button labels is
// exactly where a detail page starts scrolling sideways on a phone.
async function assertNoHorizontalOverflow(page, label) {
  const offender = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    if (document.documentElement.scrollWidth <= vw + 1) return null;
    for (const el of Array.from(document.querySelectorAll('*'))) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.right > vw + 1) {
        return `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)} right=${Math.round(r.right)} vw=${vw}`;
      }
    }
    return `scrollWidth=${document.documentElement.scrollWidth} vw=${vw}`;
  });
  if (!offender) ok(`${label}: no horizontal overflow`);
  else bad(`${label}: no horizontal overflow`, offender);
}

// ------------------------------------------------------------------- run
const server = await startDevServer();
const browser = await chromium.launch({ executablePath: findChromium() });

try {
  // ================================================================ owner
  const owner = await newPage(browser, 'owner');
  await owner.page.goto(`${ORIGIN}/admin/finance/invoices/${INVOICE_ID}`, { waitUntil: 'domcontentloaded' });
  await settle(owner.page, 1600);

  await assertVisibleText(owner.page, 'RE-2026-0002', 'invoice detail');
  await assertVisibleText(owner.page, 'Kundenportal', 'invoice detail (publishing card present)');
  await assertVisibleText(owner.page, 'Nicht registriert', 'publishing card (unpublished finalized PDF)');
  await assertVisibleText(owner.page, 'Für Kundenportal registrieren', 'publishing card (register action)');
  if (await owner.page.locator('button:has-text("Für Kunden freigeben")').count() === 0) {
    ok('publishing card: no release action before the document is registered');
  } else {
    bad('publishing card: no release action before the document is registered', 'the button was present');
  }
  await assertNoHorizontalOverflow(owner.page, 'invoice detail at 1440');

  // The single customer project must be preselected, so the common case is one click.
  const selected = await owner.page.locator('#publish-project').inputValue();
  if (selected === PROJECT_ID) ok('publishing card: the only customer project is preselected');
  else bad('publishing card: the only customer project is preselected', `value was "${selected}"`);

  // ---- register -----------------------------------------------------------------
  await owner.page.click('button:has-text("Für Kundenportal registrieren")');
  await settle(owner.page, 1000);

  await assertVisibleText(owner.page, 'Registriert, nicht freigegeben', 'publishing card (registered but not released)');
  await assertVisibleText(owner.page, 'Noch nicht für den Kunden sichtbar', 'publishing card (states it is still invisible)');
  if (state.customerDocuments.length === 1) ok('register created exactly ONE customer_documents pointer');
  else bad('register created exactly ONE customer_documents pointer', `${state.customerDocuments.length} rows`);
  const pointer = state.customerDocuments[0];
  if (pointer.owner_generated_document_id === GENERATED_PDF_ID && pointer.content_type === null) {
    ok('the pointer references the canonical PDF and carries no copied bytes');
  } else {
    bad('the pointer references the canonical PDF and carries no copied bytes', JSON.stringify(pointer));
  }
  if (pointer.category === 'invoice') ok('the pointer was registered under category=invoice');
  else bad('the pointer was registered under category=invoice', `category was ${pointer.category}`);
  if (pointer.project_id === PROJECT_ID) ok('the pointer was filed under the selected customer project');
  else bad('the pointer was filed under the selected customer project', String(pointer.project_id));
  if (pointer.customer_visible === false) ok('registering did NOT make the document customer-visible');
  else bad('registering did NOT make the document customer-visible', 'it was published immediately');

  // ---- registering again must not duplicate --------------------------------------
  await owner.page.click('button:has-text("Projekt übernehmen")');
  await settle(owner.page, 900);
  if (state.customerDocuments.length === 1) ok('a second registration did not create a duplicate pointer');
  else bad('a second registration did not create a duplicate pointer', `${state.customerDocuments.length} rows`);
  if (state.registerCalls >= 2) ok('the second registration really did reach the server');
  else bad('the second registration really did reach the server', `${state.registerCalls} calls`);

  // ---- the customer cannot see it yet -------------------------------------------
  const early = await newPage(browser, 'customer', 1440);
  await early.page.goto(`${ORIGIN}/app/billing`, { waitUntil: 'domcontentloaded' });
  await settle(early.page, 1400);
  await assertVisibleText(early.page, 'RE-2026-0002', 'customer billing (invoice visible)');
  if (await invoiceDownloadCount(early.page) === 0) {
    ok('customer billing: no download control before the release');
  } else {
    bad('customer billing: no download control before the release', 'the button was already present');
  }
  await early.context.close();

  // ---- release ------------------------------------------------------------------
  await owner.page.click('button:has-text("Für Kunden freigeben")');
  await settle(owner.page, 1000);
  await assertVisibleText(owner.page, 'Für Kunden freigegeben', 'publishing card (released)');
  await assertVisibleText(owner.page, 'Freigabe zurücknehmen', 'publishing card (revoke action available)');
  if (state.customerDocuments[0].customer_visible === true) ok('release set customer_visible');
  else bad('release set customer_visible', 'the pointer is still invisible');
  if (state.customerDocuments.length === 1) ok('release did not create another pointer');
  else bad('release did not create another pointer', `${state.customerDocuments.length} rows`);

  // ============================================================== customer
  const customer = await newPage(browser, 'customer', 375);
  await customer.page.goto(`${ORIGIN}/app/billing`, { waitUntil: 'domcontentloaded' });
  await settle(customer.page, 1400);

  await assertVisibleText(customer.page, 'RE-2026-0002', 'customer billing at 375 (invoice)');
  await assertNoHorizontalOverflow(customer.page, 'customer billing at 375');

  // list_customer_invoices must have resolved pdf_document_id to OUR pointer.
  const resolved = resolvePdfDocumentId(INVOICE_ID);
  if (resolved === state.customerDocuments[0].id) {
    ok('list_customer_invoices resolves pdf_document_id to the released pointer');
  } else {
    bad('list_customer_invoices resolves pdf_document_id to the released pointer', String(resolved));
  }

  if (await invoiceDownloadCount(customer.page) > 0) {
    ok('customer billing offers a PDF download for the released invoice');
    await customer.page.locator('button:has-text("Rechnung als PDF")').first().click();
    await settle(customer.page, 1200);
    const call = state.downloadCalls.at(-1);
    if (call && call.document_id === state.customerDocuments[0].id) {
      ok('the download calls customer-document-download with the resolved pdf_document_id');
    } else {
      bad('the download calls customer-document-download with the resolved pdf_document_id',
        JSON.stringify(state.downloadCalls));
    }
  } else {
    bad('customer billing offers a PDF download for the released invoice',
      (await bodyText(customer.page)).replace(/\s+/g, ' ').slice(0, 1200));
  }
  await customer.context.close();

  // ============================================================== revoke
  await owner.page.click('button:has-text("Freigabe zurücknehmen")');
  await settle(owner.page, 1000);
  await assertVisibleText(owner.page, 'Registriert, nicht freigegeben', 'publishing card (revoked)');
  if (state.customerDocuments[0].customer_visible === false) ok('revoke cleared customer_visible');
  else bad('revoke cleared customer_visible', 'it is still visible');
  if (state.customerDocuments[0].published_at) {
    ok('published_at latched, so "was this ever visible?" is still answerable after a revoke');
  } else {
    bad('published_at latched after a revoke', 'it was cleared');
  }
  if (resolvePdfDocumentId(INVOICE_ID) === null) {
    ok('after a revoke the customer no longer resolves a pdf_document_id');
  } else {
    bad('after a revoke the customer no longer resolves a pdf_document_id', 'it still resolves');
  }

  const after = await newPage(browser, 'customer', 1440);
  await after.page.goto(`${ORIGIN}/app/billing`, { waitUntil: 'domcontentloaded' });
  await settle(after.page, 1400);
  await assertVisibleText(after.page, 'RE-2026-0002', 'customer billing after revoke (invoice still listed)');
  if (await invoiceDownloadCount(after.page) === 0) {
    ok('customer billing after revoke: the download control is withdrawn');
  } else {
    bad('customer billing after revoke: the download control is withdrawn', 'it is still offered');
  }
  await after.context.close();

  // ==================================================== commercial overview
  await owner.page.goto(`${ORIGIN}/admin/clients/${ORG_ID}`, { waitUntil: 'domcontentloaded' });
  await settle(owner.page, 1400);
  await owner.page.click('button:has-text("Kommerziell")');
  await settle(owner.page, 1200);
  await assertVisibleText(owner.page, 'Rechnungen (1)', 'commercial tab (invoice count)');
  await assertVisibleText(owner.page, 'RE-2026-0002', 'commercial tab (invoice listed with a link)');
  await assertVisibleText(owner.page, 'Angebote (0)', 'commercial tab (offer count)');
  await assertNoHorizontalOverflow(owner.page, 'commercial tab at 1440');

  await owner.context.close();
} catch (error) {
  bad('commercial publishing flow did not complete', error instanceof Error ? error.stack ?? error.message : String(error));
} finally {
  await browser.close();
  try { process.kill(-server.pid, 'SIGTERM'); } catch { server.kill('SIGTERM'); }
}

console.log('');
console.log(failures === 0 ? 'commercial publishing flow QA: ALL PASSED' : `commercial publishing flow QA: ${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
