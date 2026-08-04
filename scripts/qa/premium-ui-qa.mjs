// Browser QA harness for the premium design pass.
//
// Renders the real production build and drives it with a synthetic Supabase session so the
// authenticated Owner Dashboard and Customer Portal can be inspected WITHOUT reading from or
// writing to the hosted project. Every Supabase request is intercepted at the network layer
// and answered from the fixtures below; nothing leaves the machine.
//
// Checks performed on every route, at every viewport:
//   - console errors (collected, reported, never swallowed)
//   - horizontal overflow (scrollWidth - clientWidth on the document element)
//   - touch-target height on any premium option row that is open
//
// Usage:
//   npm run build && npx vite preview --port 4173
//   node scripts/qa/premium-ui-qa.mjs [--out <dir>]
//
// Playwright is NOT a dependency of this project and is deliberately not added to
// package.json — this harness is a development tool, not part of the build. Run it where
// playwright is available (a global install, or `npx playwright`). CI does not invoke it.

import { chromium, devices } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const OUT = (() => {
  const i = process.argv.indexOf('--out');
  return i > -1 ? process.argv[i + 1] : 'qa-screenshots';
})();
const BASE = process.env.QA_BASE_URL ?? 'http://127.0.0.1:4173';
const SUPABASE_HOST = 'https://example.supabase.co';

mkdirSync(OUT, { recursive: true });

/* ------------------------------------------------------------------ fixtures */

const OWNER_ID = '00000000-0000-4000-8000-000000000001';
const CUSTOMER_ID = '00000000-0000-4000-8000-000000000002';
const ORG_A = '00000000-0000-4000-8000-0000000000a1';
const ORG_B = '00000000-0000-4000-8000-0000000000a2';

// Deliberately long, real-shaped German values: the layouts have to survive them.
const ORG_A_NAME = 'Musterbau Heizungstechnik Bayreuth GmbH & Co. KG';
const ORG_B_NAME = 'Nordlicht Energieverbund Schleswig-Holstein AG';

const session = (userId, email) => ({
  access_token: `qa.${userId}`,
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  refresh_token: `qa-refresh.${userId}`,
  user: {
    id: userId,
    aud: 'authenticated',
    role: 'authenticated',
    email,
    email_confirmed_at: '2026-01-04T09:00:00Z',
    created_at: '2026-01-04T09:00:00Z',
    updated_at: '2026-01-04T09:00:00Z',
    app_metadata: { provider: 'email' },
    user_metadata: {},
    identities: [],
  },
});

const profiles = {
  [OWNER_ID]: {
    id: OWNER_ID,
    email: 'owner@cogniiq.de',
    full_name: 'Dr. Katharina Obermüller-Weißenstein',
    platform_role: 'cogniiq_owner',
  },
  [CUSTOMER_ID]: {
    id: CUSTOMER_ID,
    email: 'kontakt@musterbau-bayreuth.de',
    full_name: 'Hans-Jürgen Schwarzenbeck',
    platform_role: 'customer',
  },
};

const memberships = {
  [OWNER_ID]: [
    { id: 'm1', organization_id: ORG_A, role: 'owner', organization: { id: ORG_A, name: ORG_A_NAME } },
  ],
  // Two memberships so the organization switcher is actually rendered.
  [CUSTOMER_ID]: [
    { id: 'm2', organization_id: ORG_A, role: 'member', organization: { id: ORG_A, name: ORG_A_NAME } },
    { id: 'm3', organization_id: ORG_B, role: 'member', organization: { id: ORG_B, name: ORG_B_NAME } },
  ],
};

const rpcFixtures = {
  list_customer_projects: [
    {
      id: 'p1',
      title: 'Rezeptionist-Rollout Standort Oberfranken',
      status: 'on_track',
      progress_percent: 62,
      next_action: 'Telefonansagen freigeben',
      next_action_owner: 'customer',
      next_milestone_title: 'Go-Live Vorbereitung',
      next_milestone_due_date: '2026-08-21',
      blocker_summary: null,
      updated_at: '2026-07-30T10:12:00Z',
    },
    {
      id: 'p2',
      title: 'Anbindung Warenwirtschaft',
      status: 'attention_needed',
      progress_percent: 28,
      next_action: 'Schnittstellenfreigabe durch IT',
      next_action_owner: 'customer',
      next_milestone_title: 'Testsystem bereitgestellt',
      next_milestone_due_date: '2026-09-04',
      blocker_summary: 'Wir warten auf den Zugang zum Testsystem.',
      updated_at: '2026-07-28T15:40:00Z',
    },
  ],
  list_customer_documents: [
    { id: 'd1', title: 'Angebot AN-2026-0142.pdf', document_type: 'offer', published_at: '2026-07-14T08:00:00Z', file_size_bytes: 284_113 },
    { id: 'd2', title: 'Leistungsbeschreibung Rezeptionist.pdf', document_type: 'spec', published_at: '2026-06-02T08:00:00Z', file_size_bytes: 1_204_882 },
  ],
  list_customer_invoices: [
    { id: 'i1', invoice_number: 'RE-2026-0088', status: 'open', total_cents: 428_400, currency: 'EUR', issue_date: '2026-07-01', due_date: '2026-07-15' },
    { id: 'i2', invoice_number: 'RE-2026-0071', status: 'paid', total_cents: 1_190_000, currency: 'EUR', issue_date: '2026-05-02', due_date: '2026-05-16' },
  ],
};

/* ------------------------------------------------------------------ interception */

async function installSupabaseStub(context, userId, email) {
  await context.route(`${SUPABASE_HOST}/**`, async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const json = (body) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

    if (path.startsWith('/auth/v1/token') || path.startsWith('/auth/v1/user')) {
      return json(path.startsWith('/auth/v1/user') ? session(userId, email).user : session(userId, email));
    }
    if (path.startsWith('/rest/v1/profiles')) return json([profiles[userId]]);
    if (path.startsWith('/rest/v1/organization_members')) return json(memberships[userId]);
    if (path.startsWith('/rest/v1/rpc/')) {
      const fn = path.replace('/rest/v1/rpc/', '');
      return json(rpcFixtures[fn] ?? []);
    }
    if (path.startsWith('/rest/v1/')) return json([]);
    return json({});
  });

  await context.addInitScript(
    ({ host, value }) => {
      // supabase-js v2 keys its session by project ref.
      const ref = new URL(host).hostname.split('.')[0];
      window.localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify(value));
    },
    { host: SUPABASE_HOST, value: session(userId, email) },
  );
}

/* ------------------------------------------------------------------ checks */

const findings = [];

async function inspect(page, name, viewport) {
  const overflow = await page.evaluate(() => {
    const el = document.documentElement;
    return el.scrollWidth - el.clientWidth;
  });
  if (overflow > 1) findings.push(`OVERFLOW ${name} @ ${viewport}: ${overflow}px`);
}

async function shoot(page, name) {
  const file = resolve(OUT, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  return file;
}

/* ------------------------------------------------------------------ routes */

const OWNER_ROUTES = [
  ['owner-dashboard', '/admin/finance'],
  ['owner-kunden', '/admin/clients'],
  ['owner-finance-customers', '/admin/finance/customers'],
  ['owner-angebote', '/admin/finance/offers'],
  ['owner-rechnungen', '/admin/finance/invoices'],
  ['owner-einladungen', '/admin/clients/invitations'],
  ['owner-tasks', '/admin/tasks'],
  ['owner-settings', '/admin/finance/settings'],
];

const CUSTOMER_ROUTES = [
  ['customer-overview', '/app'],
  ['customer-documents', '/app/documents'],
  ['customer-billing', '/app/billing'],
  ['customer-solutions', '/app/solutions'],
  ['customer-settings', '/app/settings'],
];

const AUTH_ROUTES = [
  ['auth-login', '/login'],
  ['auth-signup', '/signup'],
];

const VIEWPORTS = [
  ['1440x900', { width: 1440, height: 900 }],
  ['1024x768', { width: 1024, height: 768 }],
  ['390x844', { width: 390, height: 844 }],
];

async function run() {
  const browser = await chromium.launch();
  const captured = [];

  for (const [role, userId, email, routes] of [
    ['owner', OWNER_ID, 'owner@cogniiq.de', OWNER_ROUTES],
    ['customer', CUSTOMER_ID, 'kontakt@musterbau-bayreuth.de', CUSTOMER_ROUTES],
    ['anon', null, null, AUTH_ROUTES],
  ]) {
    for (const [vpName, viewport] of VIEWPORTS) {
      const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
      if (userId) await installSupabaseStub(context, userId, email);

      const page = await context.newPage();
      page.on('console', (msg) => {
        if (msg.type() === 'error') findings.push(`CONSOLE ${role} @ ${vpName}: ${msg.text().slice(0, 160)}`);
      });
      page.on('pageerror', (err) => findings.push(`PAGEERROR ${role} @ ${vpName}: ${String(err).slice(0, 160)}`));

      for (const [name, path] of routes) {
        await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' }).catch(() => {});
        await page.waitForTimeout(500);
        await inspect(page, name, vpName);
        if (vpName === '1440x900' || vpName === '390x844') {
          captured.push(await shoot(page, `${name}-${vpName}`));
        }
      }

      // Open the dropdowns that exist on this surface at the desktop viewport.
      if (vpName === '1440x900') {
        for (const [name, path] of routes.slice(0, 4)) {
          await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' }).catch(() => {});
          await page.waitForTimeout(400);
          const trigger = page.getByRole('combobox').first();
          if (await trigger.count()) {
            await trigger.click({ timeout: 3000 }).catch(() => {});
            await page.waitForTimeout(300);
            const listbox = page.getByRole('listbox');
            if (await listbox.count()) {
              captured.push(await shoot(page, `dropdown-${name}`));
              // Every option row must clear the 44px mobile minimum.
              const short = await page.evaluate(() =>
                Array.from(document.querySelectorAll('[role="option"]'))
                  .map((el) => el.getBoundingClientRect().height)
                  .filter((h) => h > 0 && h < 44).length,
              );
              if (short > 0) findings.push(`TOUCHTARGET ${name}: ${short} option row(s) under 44px`);
              // The list must be painted above the page, not clipped by an ancestor.
              const clipped = await page.evaluate(() => {
                const el = document.querySelector('[role="listbox"]');
                if (!el) return false;
                const r = el.getBoundingClientRect();
                return r.width === 0 || r.height === 0;
              });
              if (clipped) findings.push(`CLIPPED ${name}: listbox has zero size`);
            }
            await page.keyboard.press('Escape');
          }
        }
      }

      await context.close();
    }
  }

  await browser.close();

  writeFileSync(
    resolve(OUT, 'findings.txt'),
    findings.length ? findings.join('\n') : 'no findings',
    'utf8',
  );
  console.log(`captured ${captured.length} screenshots into ${OUT}`);
  console.log(findings.length ? `FINDINGS (${findings.length}):\n${findings.join('\n')}` : 'FINDINGS: none');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
