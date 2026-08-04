// Customer Portal experience + boundary tests.
//
// STRUCTURAL source assertions covering the invariants that the Customer Portal redesign
// must not be allowed to break. They complement, rather than repeat,
// `test-customer-dashboard-ux.mjs` (shell shape, breakpoints, entitlement denial) and the
// vitest suite in `src/lib/customerPlatform/customerPortal.test.ts` (pure logic).
//
// What is locked in here:
//   1. organization switching keeps its EXACT previous contract,
//   2. no customer page reaches an owner/internal data source,
//   3. the customer API stays RPC-only and tenancy stays server-derived,
//   4. document-download security invariants survive the visual rework,
//   5. invoice scoping stays server-side,
//   6. the activity feed is built only from customer-safe fields,
//   7. no raw enum reaches a customer surface,
//   8. every customer route can escape its loading state,
//   9. reduced motion is honoured on every customer surface that animates,
//  10. QA fixtures stay unreachable from production code.

import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
const read = (rel) => readFileSync(resolve(root, rel), 'utf8');
/** Source with comments stripped, so prose ABOUT a rule cannot satisfy or break it. */
const code = (rel) => read(rel).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

let failures = 0;
const ok = (cond, msg) => { if (!cond) { console.error(`FAIL: ${msg}`); failures += 1; } else console.log(`ok: ${msg}`); };

const CUSTOMER_PAGES = [
  'src/pages/app/AppHomePage.tsx',
  'src/pages/app/ProjectDetailPage.tsx',
  'src/pages/app/DocumentsPage.tsx',
  'src/pages/app/BillingPage.tsx',
  'src/pages/app/SolutionsIndexPage.tsx',
  'src/pages/app/SolutionPage.tsx',
  'src/pages/app/SupportPage.tsx',
  'src/pages/app/CustomerSectionPage.tsx',
];
const CUSTOMER_COMPONENTS = [
  'src/components/app/CustomerAppShell.tsx',
  'src/components/app/CustomerAppPrimitives.tsx',
  'src/components/app/CustomerPlatformPrimitives.tsx',
];
const CUSTOMER_SURFACES = [...CUSTOMER_PAGES, ...CUSTOMER_COMPONENTS];

const shell = read('src/components/app/CustomerAppShell.tsx');
const home = read('src/pages/app/AppHomePage.tsx');
const billing = read('src/pages/app/BillingPage.tsx');
const documents = read('src/pages/app/DocumentsPage.tsx');
const projectDetail = read('src/pages/app/ProjectDetailPage.tsx');
const platformPrimitives = read('src/components/app/CustomerPlatformPrimitives.tsx');
const activity = read('src/lib/customerPlatform/customerActivity.ts');

// ------------------------------------------------------------ 1) org switching
// The control changed; the CONTRACT must not. Same membership list, same order, same
// null-coalescing call, and the id is never sent to the server as an authorization input.
ok(/setActiveOrganizationId\(value \|\| null\)/.test(shell),
  'organization switching keeps the exact `setActiveOrganizationId(value || null)` contract');
ok(/options=\{memberships\.map\(\(membership\) => \(\{/.test(shell),
  'the switcher is still built from `memberships` in their existing order');
ok(/value: membership\.organization_id/.test(shell),
  'the switcher still submits the membership organization id');
ok(/hasMultipleOrganizations = memberships\.length > 1/.test(shell),
  'the switcher still appears only for a customer with more than one membership');
ok(/hasMultipleOrganizations \?[\s\S]{0,80}<PremiumSelect/.test(shell),
  'a single-membership customer gets no switcher at all');
// Both surfaces that can navigate must carry it, or one breakpoint loses the ability.
ok(/organizationSelect\('',/.test(shell) && /organizationSelect\('-mobile',/.test(shell),
  'the rail and the mobile drawer each render the switcher');

// ------------------------------------------ 2) no internal/owner data source reachable
// A customer page must never import an owner API, an internal task surface, or the raw
// Supabase client (which would let it query a table directly).
const FORBIDDEN_IMPORTS = [
  'ownerFinance/api',
  'ownerFinance/customersApi',
  'customerPlatform/ownerProjectsApi',
  'clientPlatform/adminApi',
  'components/finance/CustomerTaskChecklist',
  'components/finance/CustomerProjectPanel',
  'pages/owner/',
  'pages/admin/',
];
for (const rel of CUSTOMER_SURFACES) {
  const src = code(rel);
  for (const forbidden of FORBIDDEN_IMPORTS) {
    ok(!new RegExp(`from '[^']*${forbidden.replace(/\//g, '\\/')}`).test(src),
      `${rel} does not import ${forbidden}`);
  }
  ok(!/from '@\/lib\/supabase'/.test(src),
    `${rel} does not import the Supabase client directly (all reads go through the customer API)`);
  ok(!/\.from\(['"`]/.test(src), `${rel} performs no direct table select`);
}
// Formatting helpers ARE shared with the owner side on purpose — reusing the German
// currency/date formatter is not a data-source leak, and reimplementing it would drift.
ok(/ownerFinance\/exports\/format/.test(home),
  'the shared de-DE formatting helpers are reused rather than reimplemented');

// ------------------------------------------------------------ 3) customer API surface
const customerApi = code('src/lib/customerPlatform/customerApi.ts');
ok(!/\.from\(/.test(customerApi), 'customerApi never selects from a table directly (RPC only)');
for (const rpc of ['list_customer_projects', 'get_customer_project', 'list_customer_project_milestones',
                   'list_customer_documents', 'list_customer_invoices']) {
  ok(new RegExp(`'${rpc}'`).test(customerApi), `customerApi still calls the ${rpc} RPC`);
}
ok(!/organization_id/.test(customerApi),
  'no organization id is sent from the client (tenancy is derived server-side from auth.uid())');
// The shared project provider must not become a second request path.
const projectsContext = code('src/hooks/useCustomerProjectsContext.tsx');
ok(/useCustomerProjects\(\)/.test(projectsContext),
  'the shared project provider reuses the existing hook rather than issuing its own query');
ok(!/supabase/.test(projectsContext), 'the shared project provider never touches Supabase itself');

// ---------------------------------------------------- 4) document download security
ok(/requestCustomerDocumentUrl/.test(platformPrimitives),
  'downloads request a fresh signed URL at click time');
ok(/window\.open\(url/.test(platformPrimitives),
  'the signed URL is opened immediately, never rendered into the DOM');
ok(!/href=\{url\}/.test(platformPrimitives), 'the signed URL is never bound to an href');
ok(!/set[A-Z]\w*\(\s*url\s*\)/.test(platformPrimitives),
  'no state setter ever receives the signed URL');
ok(!/\burl\b/.test(platformPrimitives.split('const open = async')[1]?.split('return (')[0]?.replace(/data: url|\|\| !url|window\.open\(url/g, '') ?? ''),
  'the signed URL is referenced only where it is opened');
ok(!/storage\.from\(/.test(platformPrimitives), 'the browser never calls Storage directly');
ok(!/console\.(log|info|warn|error)\([^)]*url/i.test(platformPrimitives),
  'the signed URL is never logged');
// The download control gained loading/success/failure feedback; it must still be one
// request per click, not a pre-fetched link.
ok(/onClick=\{\(\) => void open\(\)\}/.test(platformPrimitives),
  'the URL request is triggered by the click, not on render');
// No upload path on the customer side.
for (const rel of CUSTOMER_SURFACES) {
  ok(!/customer-document-upload/.test(read(rel)), `${rel} exposes no upload path`);
}

// ------------------------------------------------------- 5) invoice tenant scoping
ok(/useCustomerInvoices\(null\)/.test(billing),
  '/app/billing requests the organization scope, which the RPC resolves server-side');
ok(!/organization_id|p_organization/.test(code('src/pages/app/BillingPage.tsx')),
  'the billing page never passes an organization id of its own');
ok(/useCustomerInvoices\(projectId\)/.test(projectDetail),
  'project billing is scoped by project id only — tenancy still comes from the RPC');
// No amount is recomputed for display.
const billingCode = code('src/pages/app/BillingPage.tsx');
ok(!/\*\s*0\.19|\/\s*1\.19|vat_total_cents\s*[*/]/.test(billingCode),
  'the billing page re-derives no tax and rescales no amount');
ok(!/stripe|Stripe|paypal/i.test(billing), 'no payment provider is wired into the billing page');
ok(/Online-Zahlungsfunktion ist in dieser Version bewusst nicht enthalten/.test(billing),
  'the billing page still states plainly that online payment is not included');

// ------------------------------------------------- 6) activity feed is customer-safe
// Every field the builder reads must be one the customer RPC allow-lists return.
const CUSTOMER_SAFE_FIELDS = [
  'completed_at', 'uploaded_at', 'issue_date', 'updated_at', 'created_at',
  'title', 'invoice_number', 'invoice_id', 'phase', 'project_id', 'id', 'status',
];
const activityCode = code('src/lib/customerPlatform/customerActivity.ts');
const readFields = [...activityCode.matchAll(/\b(?:milestone|document|invoice|project)\.([a-z_]+)/g)]
  .map((m) => m[1]);
for (const field of new Set(readFields)) {
  ok(CUSTOMER_SAFE_FIELDS.includes(field),
    `the activity feed reads only customer-safe fields (saw \`${field}\`)`);
}
ok(!/audit|owner_|internal|note/i.test(activityCode),
  'the activity feed touches no audit, owner or internal record');
ok(/Do not call this an audit log|NOT an audit log/i.test(activity),
  'the activity module states that it is not an audit log');
ok(/entries\.sort\(compareActivity\)/.test(activityCode),
  'activity entries are sorted deterministically');
ok(/Zuletzt passiert/.test(home) && !/Audit|Protokoll/.test(home),
  'the overview presents the feed as recent updates, not as an audit log');

// -------------------------------------------------------------- 7) no raw enums
// A customer surface must render a LABEL, never the stored token. The check is that no
// customer file contains a bare enum literal outside a comparison.
const RAW_TOKENS = ['on_track', 'attention_needed', 'partially_paid', 'project_document',
                    'meeting_notes', 'customer_upload', 'cogniiq_admin', 'cogniiq_owner'];
for (const rel of CUSTOMER_SURFACES) {
  const src = code(rel);
  for (const token of RAW_TOKENS) {
    // Allowed: a comparison or an object key. Forbidden: the token inside JSX text.
    const inJsxText = new RegExp(`>[^<>{}]*\\b${token}\\b[^<>{}]*<`);
    ok(!inJsxText.test(src), `${rel} never renders the raw token \`${token}\` as text`);
  }
}
// The lookup helpers must fall back to a placeholder rather than to the token itself.
const labels = code('src/lib/customerPlatform/customerLabels.ts');
ok(/return \(map as Record<string, string>\)\[value\] \?\? '—'/.test(labels),
  'an unrecognised account enum renders as an em dash, never as the raw value');
ok(/customerInvoiceStatusLabels\[status\] \?\? '—'/.test(platformPrimitives),
  'an unrecognised invoice status renders as an em dash, never as the raw value');
ok(/customerMilestoneStatusLabels\[milestone\.status\] \?\? '—'/.test(platformPrimitives),
  'an unrecognised milestone status renders as an em dash, never as the raw value');
ok(!/platform_role\}/.test(read('src/pages/app/CustomerSectionPage.tsx')),
  'the settings page no longer prints profile.platform_role raw');
ok(/customerPlatformRoleLabel\(profile\.platform_role\)/.test(read('src/pages/app/CustomerSectionPage.tsx')),
  'the settings page humanises the platform role');
ok(/customerOrganizationStatusLabel\(activeOrganization\.status\)/.test(read('src/pages/app/CustomerSectionPage.tsx')),
  'the settings page humanises the organization status');

// ------------------------------------------- 8) every route can escape its skeleton
// A loading branch is only honest if a terminal branch exists beside it. Each page that
// renders a skeleton must also render at least one of: content, an empty state, an error.
for (const rel of CUSTOMER_PAGES) {
  const src = read(rel);
  if (!/AppSkeleton/.test(src)) continue;
  ok(/status === 'error'/.test(src) || /AppErrorState/.test(src),
    `${rel} has an error branch beside its skeleton`);
  ok(/AppEmptyState/.test(src) || /status === 'ready'/.test(src) || /loadStatus/.test(src),
    `${rel} has a terminal ready/empty branch beside its skeleton`);
}
// A factual claim about the account may never be made on a failed request.
ok(/projectsStatus === 'error'/.test(home),
  'the overview reports a failed project request as a failure, not as "no project yet"');
ok(/projectsStatus === 'ready' \?/.test(home),
  'the overview only claims "no project" once the request actually succeeded');
ok(/milestonesStatus === 'ready'[\s\S]{0,120}Kein offener Meilenstein/.test(home),
  'the overview only claims "no open milestone" once milestones loaded');
ok(/milestonesStatus === 'ready'[\s\S]{0,160}Kein offener Meilenstein/.test(projectDetail),
  'project detail only claims "no open milestone" once milestones loaded');

// -------------------------------------------------- 9) next action ownership rule
// The rule lives in `customerPortalModel` and is exercised behaviourally by
// `customerPortal.test.ts`; here we lock in that the page actually uses it.
const portalModelCode = code('src/lib/customerPlatform/customerPortalModel.ts');
ok(/p\.next_action_owner === 'customer' && p\.next_action_summary/.test(portalModelCode),
  'the customer next-action rule requires BOTH customer ownership and a summary');
ok(/primary\.next_action_owner !== 'cogniiq'/.test(portalModelCode),
  'the Cogniiq next-action rule refuses anything not owned by Cogniiq');
ok(/pickCustomerNextAction\(activeProjects, primaryProject\)/.test(home),
  'the overview delegates its banner to the customer-ownership rule');
ok(/pickCogniiqNextAction\(primaryProject\)/.test(home),
  'the overview delegates "Cogniiq arbeitet aktuell an" to the Cogniiq-ownership rule');
ok(/customerAction \? <NextActionBanner/.test(home),
  'the banner renders only when such an action exists');
ok(/ownedByCustomer = project\.next_action_owner === 'customer'/.test(projectDetail),
  'project detail branches explicitly on who owns the next action');
ok(/Dieser Schritt liegt bei Cogniiq\. Sie müssen dafür nichts tun\./.test(projectDetail),
  'a Cogniiq-owned action tells the customer they need do nothing');

// ------------------------------------------------------------ 10) reduced motion
for (const rel of CUSTOMER_SURFACES) {
  const src = read(rel);
  if (!/framer-motion/.test(src)) continue;
  ok(/useReducedMotion|useMotionPresets|motionPresets\.reduce/.test(src),
    `${rel} consults the reduced-motion preference before animating`);
}
ok(/reduceMotion \? \{ duration: 0 \}/.test(projectDetail) || /reduceMotion \? false/.test(projectDetail),
  'project detail collapses its progress animation under reduced motion');
ok(/reduceMotion \? false : \{ scaleX: 0 \}/.test(home),
  'the overview progress bar does not animate from zero under reduced motion');
ok(/motion-reduce:/.test(shell), 'the shell disables its CSS transitions under reduced motion');
// No stagger across long lists.
ok(!/staggerChildren/.test(read('src/components/app/CustomerPlatformPrimitives.tsx')),
  'no stagger is applied across document, invoice or milestone lists');

// ------------------------------------------------ 11) QA fixtures stay test-only
const srcFiles = [];
(function walk(dir) {
  for (const entry of readdirSync(resolve(root, dir), { withFileTypes: true })) {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) walk(rel);
    else if (/\.(ts|tsx)$/.test(entry.name)) srcFiles.push(rel);
  }
})('src');
for (const rel of srcFiles) {
  if (/\.test\.tsx?$/.test(rel)) continue;
  ok(!/from '[^']*scripts\/qa/.test(read(rel)), `${rel} does not import the QA fixture layer`);
}

// -------------------------------------------------- 12) no fabricated commitments
// Copy that would promise something the product cannot keep.
const FABRICATION_PATTERNS = [
  [/innerhalb von \d+ (Stunden|Minuten|Werktagen)/i, 'an invented response time'],
  [/Antwortzeit|Reaktionszeit|SLA\b/i, 'an invented service level'],
  [/Live-?Chat|Chat verfügbar|Jetzt online/i, 'fake chat availability'],
  [/\b\d+ (Anrufe|Leads|Minuten) (diesen|im) Monat/i, 'a fabricated usage metric'],
];
for (const rel of CUSTOMER_SURFACES) {
  // Comments are stripped first: these files DOCUMENT which promises were deliberately
  // not made ("inventing 'meldet sich innerhalb von 24 Stunden' would be a promise the
  // product cannot keep"), and that prose matched its own pattern.
  const src = code(rel);
  for (const [pattern, what] of FABRICATION_PATTERNS) {
    ok(!pattern.test(src), `${rel} renders no ${what}`);
  }
}

if (failures) { console.error(`\ncustomer portal experience tests: ${failures} FAILED`); process.exit(1); }
console.log('\ncustomer portal experience tests: ALL PASSED');
