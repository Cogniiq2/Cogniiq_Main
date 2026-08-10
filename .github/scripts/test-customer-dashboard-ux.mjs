// Customer dashboard (/app) UX foundation tests.
//
// These are STRUCTURAL source assertions (the repo has no React test runner). They lock in the
// UX invariants fixed in the "customer project / document / billing core" release:
//   1. the responsive navigation gap (768-1023px had NO navigation at all) stays fixed,
//   2. entitlement denial is EXPLAINED, never a silent <Navigate> redirect,
//   3. intentionally-unbuilt sections are labelled honestly ("In Vorbereitung"),
//   4. no disabled interactive control is left without explanatory copy.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
const read = (rel) => readFileSync(resolve(root, rel), 'utf8');

let failures = 0;
const ok = (cond, msg) => { if (!cond) { console.error(`FAIL: ${msg}`); failures += 1; } else console.log(`ok: ${msg}`); };

const shell = read('src/components/app/CustomerAppShell.tsx');
const guard = read('src/components/app/ReceptionistEntitlementRoute.tsx');
const unavailable = read('src/components/app/EntitlementUnavailablePage.tsx');
const primitives = read('src/components/app/CustomerAppPrimitives.tsx');
const sectionPage = read('src/pages/app/CustomerSectionPage.tsx');

// ---------------------------------------------------------------- 1) navigation breakpoint contract
// Both authenticated surfaces render ONE premium vertical sidebar shell. The responsive contract
// has three states and no gap between them:
//   ≥1024px (lg) full 272px sidebar · 768–1023px (md) 80px rail · <768px top bar + drawer.
// The historic 768–1023px dead zone (no navigation at all) is impossible here by construction:
// the persistent sidebar appears at md, and the drawer trigger is hidden from exactly the same
// breakpoint — so the two ranges abut rather than overlap or leave a hole.
const premiumShell = read('src/components/shell/PremiumShell.tsx');

ok(/<aside\b/.test(premiumShell), 'the shell renders a real <aside> sidebar element');
ok(/data-shell-nav="primary-desktop"/.test(premiumShell), 'the persistent sidebar is tagged as the primary desktop navigation');
ok(/hidden w-20 flex-col border-r[^"]*md:flex/.test(premiumShell), 'the sidebar is a vertical 80px rail from md up');
ok(/collapsed \? '' : 'lg:w-\[272px\]'/.test(premiumShell), 'the sidebar expands to 272px at lg unless the user collapsed it');
ok(/md:pl-20/.test(premiumShell), 'content is offset by the rail width at md (no overlap)');
ok(/collapsed \? '' : 'lg:pl-\[272px\]'/.test(premiumShell), 'content is offset by the full sidebar width at lg');
ok(/backdrop-blur-xl md:hidden/.test(premiumShell), 'the slim top bar exists only below md');
ok(/fixed inset-0 z-50 md:hidden/.test(premiumShell), 'the drawer exists only below md — it never overlays tablet or desktop content');
// The two ranges must switch at the SAME breakpoint. The drawer and the top bar are `md:hidden`
// and the sidebar is `md:flex`, so 768px is one clean handover; an `lg:hidden` on either of those
// two elements would re-open a range with no navigation at all.
ok(!/(top bar|drawer)[^\n]*lg:hidden/.test(premiumShell), 'neither the top bar nor the drawer switches at lg');
ok((premiumShell.match(/md:hidden/g) ?? []).length >= 2, 'top bar and drawer both hand over at md');

// The customer shell must render THROUGH that one shell — never its own header/nav markup.
ok(/<PremiumShell/.test(shell), 'the customer shell renders the premium sidebar shell');
ok(!/<header/.test(shell), 'the customer shell no longer builds its own horizontal header');
ok(!/<nav/.test(shell), 'the customer shell no longer builds its own navigation element');
// A multi-organization member must keep the switcher at EVERY width: inline in the expanded
// sidebar, inside the profile menu at rail widths, and inside the mobile drawer.
ok(/data-testid="customer-organization-select"/.test(shell), 'the customer shell provides an organization switcher');
ok(/contextSlot=\{organizationSwitcher\}/.test(shell), 'the switcher is handed to the shell as the context slot');
// Three placements, mutually exclusive by breakpoint: inline (lg expanded), profile menu (rail),
// drawer (<md). Losing the middle one is exactly how the old 768–1023px gap was born.
ok((premiumShell.match(/>\{contextSlot\}</g) ?? []).length === 3,
  'the context slot is placed for all three responsive states (sidebar, rail menu, drawer)');
ok(/contextSlot \?[\s\S]{0,200}collapsed \? '' : 'lg:hidden'/.test(premiumShell),
  'rail widths surface the context slot in the profile menu, so it is never lost between 768 and 1023px');

// The owner shell must render through the SAME component — one shell system, two nav models.
const ownerShell = read('src/components/dashboard/DashboardShell.tsx');
ok(/<PremiumShell/.test(ownerShell), 'the owner shell renders the premium sidebar shell');
ok(!/<header/.test(ownerShell), 'the owner shell no longer builds its own horizontal header');

// ---------------------------------------------------------------- 2) entitlement denial is explained
ok(!/<Navigate to="\/app" replace \/>/.test(guard), 'entitlement guard no longer silently redirects to /app');
ok(/EntitlementUnavailablePage/.test(guard), 'entitlement guard renders an explanation page');
ok(/supportEmail=\{portalSettings\?\.support_contact/.test(guard), 'explanation page offers the real support contact');
ok(/nicht freigeschaltet/.test(guard), 'denial copy states the surface is not unlocked yet');
ok(/Zur Übersicht/.test(unavailable), 'explanation page offers a way back to the overview');
// Denial must still be a denial: the guarded children are never rendered on the unentitled path.
const entitledIdx = unavailable.indexOf('EntitlementUnavailablePage');
ok(entitledIdx >= 0 && !/\{children\}/.test(unavailable), 'explanation page never renders guarded children');

// ---------------------------------------------------------------- 3) honest "In Vorbereitung" states
ok(/export function AppInPreparationBadge/.test(primitives), 'AppInPreparationBadge primitive exists');
ok(/inPreparationSections = new Set<CustomerSection>\(\['knowledge', 'test', 'calls', 'leads'\]\)/.test(sectionPage),
  'stub sections are explicitly enumerated as in-preparation');
ok(/<AppInPreparationBadge \/>/.test(sectionPage), 'in-preparation sections render the badge');
ok(/keine Beispiel- oder Platzhalterdaten/.test(sectionPage), 'in-preparation notice promises no fabricated data');
// The three genuinely-persisted sections must NOT be labelled in-preparation.
for (const real of ['onboarding', 'receptionist', 'phone']) {
  ok(!new RegExp(`inPreparationSections[^)]*'${real}'`).test(sectionPage), `${real} is not marked in-preparation`);
}

// ---------------------------------------------------------------- 4) no unexplained disabled control
ok(/disabledReason\?: string/.test(primitives), 'AppButton accepts a disabledReason');
ok(/title=\{disabled \? disabledReason : undefined\}/.test(primitives), 'disabled buttons expose the reason as a tooltip');
ok(/aria-describedby=\{hintId\}/.test(primitives), 'disabled buttons are wired to their hint for screen readers');
ok(/export function AppReadOnlyNotice/.test(primitives), 'AppReadOnlyNotice primitive exists for group-level read-only copy');

// Every `disabled` AppButton in the customer section page must carry a disabledReason.
// (Buttons disabled by a live expression — e.g. stageIndex === 0 — are self-evident from
// their adjacent state and are matched separately below.)
const hardDisabledButtons = [...sectionPage.matchAll(/<AppButton\b[^>]*\bdisabled\b(?!=)[^>]*>/gs)];
ok(hardDisabledButtons.length > 0, 'found unconditionally-disabled buttons to check');
for (const [match] of hardDisabledButtons) {
  ok(/disabledReason/.test(match), `unconditionally-disabled button carries a reason: ${match.slice(0, 60).replace(/\s+/g, ' ')}…`);
}
// The disabled search input is explained too.
ok(/aria-describedby="operational-search-hint"/.test(sectionPage), 'disabled search input is wired to an explanatory hint');
ok(/searchDisabledReason/.test(sectionPage), 'disabled search/filter share one explicit reason string');
// The read-only (role-gated) form sections explain themselves at group level.
ok((sectionPage.match(/<AppReadOnlyNotice>/g) ?? []).length >= 3,
  'onboarding, receptionist and phone each explain the read-only state');
ok(/Nur Owner und Admins/.test(sectionPage), 'read-only copy names the required role');

// ---------------------------------------------------------------- regression guards
// Real receptionist/phone/onboarding functionality must remain untouched by this phase.
ok(/saveOnboarding\(draft\)/.test(sectionPage), 'onboarding save path intact');
ok(/saveReceptionist\(draft\)/.test(sectionPage), 'receptionist save path intact');
ok(/savePhone\(draft\)/.test(sectionPage), 'phone save path intact');

// ---------------------------------------------------------------- 5) customer workspace surfaces
const app = read('src/App.tsx');
const home = read('src/pages/app/AppHomePage.tsx');
const projectDetail = read('src/pages/app/ProjectDetailPage.tsx');
const documentsPage = read('src/pages/app/DocumentsPage.tsx');
const billingPage = read('src/pages/app/BillingPage.tsx');
const customerApi = read('src/lib/customerPlatform/customerApi.ts');
const customerTypes = read('src/lib/customerPlatform/types.ts');
const platformPrimitives = read('src/components/app/CustomerPlatformPrimitives.tsx');

/* Routes exist and are protected.
   Authentication is no longer applied per route: the whole /app subtree sits inside
   CustomerPortalBoundary, which applies the SAME ProtectedRoute and then bootstraps the
   portal-access context once. Each route additionally declares the capability it requires.
   Both halves are asserted — losing either one would silently open a customer surface. */
const boundary = read('src/components/app/CapabilityRoute.tsx');

/* (a) The boundary still authenticates, and still does so with ProtectedRoute. */
ok(/export function CustomerPortalBoundary/.test(boundary), 'the /app subtree has a portal boundary');
ok(/<ProtectedRoute>[\s\S]*<\/ProtectedRoute>/.test(boundary),
  'CustomerPortalBoundary still applies ProtectedRoute (authentication is unchanged)');
ok(/PortalAccessProvider/.test(boundary), 'the boundary bootstraps the portal-access context');

/* (b) Every customer route is inside that boundary's element subtree. Isolate the boundary's
       <Route element={<CustomerPortalBoundary />}> ... </Route> block so a route accidentally
       moved outside it cannot satisfy the per-route checks below. */
const boundaryBlock =
  /<Route element=\{<CustomerPortalBoundary \/>\}>([\s\S]*?)\n\s*<\/Route>/.exec(app);
ok(boundaryBlock !== null, 'App.tsx nests the customer routes inside CustomerPortalBoundary');
const guardedRoutes = boundaryBlock?.[1] ?? '';

/* (c) Each protected route is wrapped in CapabilityRoute AND requires the right capability. */
const routeCapabilities = {
  '/app/projects/:projectId': 'portal.projects.view',
  '/app/documents': 'portal.documents.view',
  '/app/billing': 'portal.billing.view',
};
for (const [route, capability] of Object.entries(routeCapabilities)) {
  const escaped = route.replace(/[/:]/g, (c) => '\\' + c);
  const pattern = new RegExp(
    `path="${escaped}"[^>]*element=\\{<CapabilityRoute requires=\\{\\['${capability}'\\]\\}>`
  );
  ok(pattern.test(guardedRoutes),
    `${route} is registered inside CustomerPortalBoundary behind CapabilityRoute requires ${capability}`);
}
ok(/<CapabilityRoute requires=\{\['portal\.billing\.view'\]\}><BillingPage \/><\/CapabilityRoute>/.test(app),
  '/app/billing renders the real BillingPage, not the old stub');

/* (d) The guard fails CLOSED. A guard that rendered children while the context was still
       loading, or that dropped the requirement, would flash unauthorized content. */
ok(/if \(status === 'loading'\) return <AuthLoadingScreen \/>;/.test(boundary),
  'CapabilityRoute renders a loading screen, never the page, while access is unknown');
ok(/hasEveryCapability\(requires\)/.test(boundary), 'CapabilityRoute enforces the required capabilities');
ok(/status === 'unauthenticated'/.test(boundary) && /\/app\/login\?redirectTo=/.test(boundary),
  'an expired session is redirected to login instead of rendering the page');

/* The billing stub is gone entirely. */
ok(!/BillingExperience/.test(sectionPage), 'the placeholder BillingExperience is removed');
ok(!/billingAreas/.test(sectionPage), 'the placeholder billingAreas list is no longer rendered');
ok(!/billingAreas/.test(read('src/components/app/customerPortalModel.ts')), 'billingAreas is deleted from the model');
ok(!/\| 'billing'/.test(sectionPage), "'billing' is removed from the CustomerSection union");

/* Every customer read goes through an RPC — never a direct table select.
   Comments are stripped first so prose ABOUT the rule cannot satisfy or break it. */
const customerApiCode = customerApi.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
ok(!/\.from\(/.test(customerApiCode), 'customerApi never selects from a table directly (RPC only)');
for (const rpc of ['list_customer_projects', 'get_customer_project', 'list_customer_project_milestones',
                   'list_customer_documents', 'list_customer_invoices']) {
  ok(new RegExp(`'${rpc}'`).test(customerApi), `customerApi calls the ${rpc} RPC`);
}
ok(/customer-document-download/.test(customerApi), 'downloads go through the Edge Function');
ok(!/storage\.from\(/.test(customerApi), 'the browser never calls Storage directly for customer documents');
ok(!/organization_id/.test(customerApi),
  'no organization id is sent from the client (tenancy is derived server-side from auth.uid())');

/* Home page: "active" excludes completed/paused, and archived never arrives. */
// Parse the actual array literal rather than pattern-matching nearby text, so the
// assertion cannot be satisfied (or broken) by unrelated occurrences elsewhere in the file.
const activeArray = /activeCustomerProjectStatuses: CustomerProjectStatus\[\] = \[([\s\S]*?)\]/.exec(customerTypes);
ok(activeArray !== null, 'the active-status allow-list is declared');
const activeStatuses = (activeArray?.[1] ?? '').match(/'[a-z_]+'/g)?.map((s) => s.replace(/'/g, '')) ?? [];
ok(JSON.stringify(activeStatuses) === JSON.stringify(['on_track', 'attention_needed', 'blocked']),
  `active statuses are exactly on_track, attention_needed, blocked (got ${JSON.stringify(activeStatuses)})`);
ok(!activeStatuses.includes('completed'), 'completed is NOT an active status');
ok(!activeStatuses.includes('paused'), 'paused is NOT an active status');
ok(/projects\.filter\(isActiveCustomerProject\)/.test(home), 'the home page filters to active projects only');

/* Home page cards are conditional on real data — no decorative empties. */
ok(/customerActions\.length \? <NextActionCard/.test(home), '"Ihre nächste Aktion" renders only when one exists');
ok(/next_action_owner === 'customer'/.test(home), 'the next-action card is limited to actions the CUSTOMER owns');
ok(/recentDocuments\.length \? \(/.test(home), 'recent documents render only when documents exist');
ok(/openInvoices\.length \? \(/.test(home), 'open invoices render only when invoices are open');
ok(/contactProject \? <ContactCard/.test(home), 'the contact card renders only when a verified contact exists');
ok(/activeProjects\.length \? \(/.test(home) && /<NoProjectState/.test(home),
  'with no project the home page shows the real onboarding state instead of empty cards');
ok(!/Letzte Aktivität/.test(home), 'the permanently-empty "Letzte Aktivität" section is gone');

/* Project detail answers the required questions. */
for (const tab of ['Übersicht', 'Meilensteine', 'Dokumente', 'Abrechnung']) {
  ok(new RegExp(`label: '${tab}'`).test(projectDetail), `project detail has a ${tab} section`);
}
ok(/Ihre nächste Aktion/.test(projectDetail) && /Nächster Schritt bei Cogniiq/.test(projectDetail),
  'project detail states explicitly whether the customer or Cogniiq must act');
ok(/Nächster Meilenstein/.test(projectDetail), 'project detail surfaces the next milestone');
ok(/customer_safe_blocker_summary/.test(projectDetail), 'project detail shows the customer-safe blocker summary');
ok(/Projekt nicht verfügbar/.test(projectDetail),
  'an unavailable project renders one generic state (no existence oracle)');

/* Documents page covers organization-level documents. */
ok(/useCustomerDocuments\(null\)/.test(documentsPage), '/app/documents requests ALL organization documents');

/* Signed URLs are treated as short-lived credentials, not links. */
ok(/requestCustomerDocumentUrl/.test(platformPrimitives), 'downloads request a fresh signed URL at click time');
ok(/window\.open\(url/.test(platformPrimitives), 'the signed URL is opened immediately, never rendered into the DOM');
ok(!/href=\{url\}/.test(platformPrimitives), 'the signed URL is never bound to an href');

/* German formatting helpers are reused, not reimplemented. */
ok(/formatCentsCurrencyDe/.test(platformPrimitives) && /formatDateDe/.test(platformPrimitives),
  'existing de-DE currency and date helpers are reused');
ok(!/toLocaleString\('de/.test(billingPage), 'the billing page does not hand-roll German formatting');

/* No payment processing in this release. */
ok(!/stripe|Stripe/.test(billingPage), 'no payment provider is wired into the billing page');
ok(/Online-Zahlungsfunktion ist in dieser Version bewusst nicht enthalten/.test(billingPage),
  'the billing page states plainly that online payment is not included');

/* Navigation exposes the new surfaces.
   The static list moved out of the shell into the capability-derived navigation model. Each entry
   must still exist, must still point at the same href, and must now declare the capability that
   gates it — a nav entry whose requiredCapabilities drifted from its route guard would either
   dead-end the user or advertise a surface they cannot open. */
const navigation = read('src/lib/portalAccess/navigation.ts');
for (const [label, href, capability] of [
  ['Dokumente', '/app/documents', 'portal.documents.view'],
  ['Abrechnung', '/app/billing', 'portal.billing.view'],
  ['Übersicht', '/app', 'portal.overview.view'],
]) {
  const pattern = new RegExp(
    `label: '${label}', href: '${href.replace(/\//g, '\\/')}',[^}]*requiredCapabilities: \\['${capability}'\\]`
  );
  ok(pattern.test(navigation),
    `${label} is in the primary navigation, gated on ${capability}`);
}

/* The nav entry and the route guard must agree, or navigation lies about what is reachable. */
for (const [href, capability] of [['/app/documents', 'portal.documents.view'],
                                  ['/app/billing', 'portal.billing.view']]) {
  const navEntry = new RegExp(
    `href: '${href.replace(/\//g, '\\/')}',[^}]*requiredCapabilities: \\['${capability}'\\]`
  );
  const routeEntry = new RegExp(
    `path="${href.replace(/\//g, '\\/')}"[^>]*requires=\\{\\['${capability}'\\]\\}`
  );
  ok(navEntry.test(navigation) && routeEntry.test(app),
    `${href} requires the same capability in navigation and in its route guard`);
}

/* The shell must DERIVE navigation rather than hard-code it, or capabilities cannot affect it. */
ok(/buildPortalNavigation/.test(shell), 'the shell derives navigation from capabilities + solutions');
ok(!/label: 'Dokumente', href: '\/app\/documents'/.test(shell),
  'the shell no longer hard-codes the navigation list');

/* Access must never be decided per customer. */
for (const source of [navigation, boundary, read('src/contexts/PortalAccessContext.tsx')]) {
  ok(!/organization(\w*)\.name\s*===/i.test(source), 'no navigation or guard branches on an organization name');
  ok(!/[\w.+-]+@[\w-]+\.[a-z]{2,}/i.test(source), 'no hard-coded email address decides access');
}

// ---------------------------------------------------------------- 6) owner-side management
const ownerApi = read('src/lib/customerPlatform/ownerProjectsApi.ts');
const ownerPanel = read('src/components/finance/CustomerProjectPanel.tsx');
const ownerCustomerDetail = read('src/pages/owner/CustomerDetailPage.tsx');

/* Every owner mutation goes through a guarded RPC, never a direct table write. */
const ownerApiCode = ownerApi.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
for (const forbidden of ['.insert(', '.update(', '.delete(', '.upsert(']) {
  ok(!ownerApiCode.includes(forbidden), `owner API performs no direct ${forbidden.slice(1, -1)} on a table`);
}
for (const rpc of ['create_customer_project_for_owner_customer', 'update_customer_project',
                   'set_customer_project_next_action', 'archive_customer_project',
                   'create_customer_project_milestone', 'update_customer_project_milestone',
                   'delete_customer_project_milestone', 'register_customer_document_from_owner_source',
                   'set_customer_document_visibility', 'archive_customer_document',
                   'link_customer_project_invoice', 'unlink_customer_project_invoice']) {
  ok(new RegExp(`'${rpc}'`).test(ownerApi), `owner API exposes the ${rpc} RPC`);
}

/* Uploads never touch Storage from the browser. */
ok(!/storage\.from\(/.test(ownerApi), 'the owner API never calls Storage directly');
ok(/functions\.invoke\('customer-document-upload'/.test(ownerApi),
  'uploads go through the controlled server-side Edge Function');

/* completed_at is never sent by the client — it is derived from status server-side. */
ok(!/p_completed_at/.test(ownerApi), 'completed_at is never supplied by the client');

/* The panel refuses to create a project without a linked organization. */
ok(/organizationId: string \| null/.test(ownerPanel), 'the panel accepts a nullable organization id');
ok(/if \(!organizationId\)/.test(ownerPanel), 'the panel branches on a missing organization');
ok(/Kein Portalzugang vorhanden/.test(ownerPanel),
  'a customer without portal provisioning gets an explicit explanation, not a failing save');
ok(/Einladung/.test(ownerPanel), 'the explanation points at the real prerequisite (invitation)');

/* The panel is wired into the CRM customer detail page and passes the real org id. */
ok(/<CustomerProjectPanel[\s\S]{0,200}ownerCustomerId=\{c\.id\}[\s\S]{0,200}organizationId=\{c\.organization_id\}[\s\S]{0,200}clientAccountId=\{c\.client_account_id\}/.test(ownerCustomerDetail),
  'the project panel is mounted on the CRM customer detail page with the real organization and client-account ids');

/* Internal task tooling and the customer projection stay separate. */
ok(/CustomerTaskChecklist/.test(ownerCustomerDetail) && /CustomerProjectPanel/.test(ownerCustomerDetail),
  'internal task checklist and customer-visible project panel coexist as separate surfaces');
ok(!/owner_customer_tasks/.test(ownerApi), 'the customer project API never touches internal owner tasks');

/* Document retirement/deletion is server-controlled only. No owner browser code
   may call Storage.remove directly — archiving never touches storage at all, and
   permanent deletion of a never-published upload goes through the Edge Function. */
ok(!/\.storage\.from\(/.test(ownerApiCode), 'the owner API never references Storage at all');
ok(!/\.storage\./.test(ownerPanel.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')),
  'the owner project panel never references Storage directly');
ok(/customer-document-upload/.test(ownerApi), 'uploads route through the controlled Edge Function');
ok(!/customer-document-upload.*retire|retire.*customer-document-upload/.test(ownerApi),
  'no separate ad hoc retire call bypasses the Edge Function');

/* Invoice-organization dependency: warned, blocked, and given a real fix path. */
ok(/organization_id: string \| null/.test(ownerApi), 'invoice candidates carry a nullable organization_id for the owner UI to branch on');
ok(/assign_invoice_organization/.test(ownerApi), 'the owner API exposes the organization-assignment RPC');
ok(/keiner Organisation zugeordnet/.test(ownerPanel), 'the panel warns explicitly when an invoice has no organization');
ok(/Organisation zuweisen und verknüpfen/.test(ownerPanel), 'the panel offers a real one-click fix, not just a warning');
ok(/gehört zu einer anderen Organisation/.test(ownerPanel), 'a mismatched-organization invoice is explained, not silently hidden');
// The mismatch case must NOT offer a fix button — reassigning across organizations is never allowed.
const case3Match = /\/\/ Case 3:[\s\S]*?<\/li>\s*\);/.exec(ownerPanel);
ok(case3Match !== null, 'the cross-organization (Case 3) branch is present');
ok(!/Button|onAssignAndLink|onLink/.test(case3Match?.[0] ?? 'Button'),
  'the cross-organization case renders no action button of any kind');

/* Owner-facing copy makes the customer-visible boundary explicit. */
ok(/Interne Notizen, Budgets und Aufgaben bleiben hier außen vor/.test(ownerPanel),
  'the panel states that internal notes, budgets and tasks are excluded');
ok(/Nur kundensichere Formulierungen/.test(ownerPanel),
  'the blocker field warns that only customer-safe wording belongs there');
ok(/private Profil-E-Mail wird nie automatisch angezeigt/.test(ownerPanel),
  'the contact email field states the private profile address is never auto-exposed');

// ---------------------------------------------------------------- 7) Edge Function env handling
const envHelper = read('supabase/functions/_shared/env.ts');
const downloadIndex = read('supabase/functions/customer-document-download/index.ts');
const uploadIndex = read('supabase/functions/customer-document-upload/index.ts');

ok(/getSupabasePublishableKey|getSupabaseSecretKey|getSupabaseUrl/.test(envHelper),
  'a shared env helper exists for the modern/legacy key lookup');
ok(/SUPABASE_PUBLISHABLE_KEYS.*SUPABASE_PUBLISHABLE_KEY.*SUPABASE_ANON_KEY/.test(envHelper.replace(/\n/g, ' ')),
  'publishable key lookup prefers the modern name with a legacy fallback');
ok(/SUPABASE_SECRET_KEYS.*SUPABASE_SECRET_KEY.*SUPABASE_SERVICE_ROLE_KEY/.test(envHelper.replace(/\n/g, ' ')),
  'secret key lookup prefers the modern name with a legacy fallback');
ok(!/console\.(log|error|warn)\([^)]*(SECRET|SERVICE_ROLE|PUBLISHABLE|ANON_KEY|getSupabase\w+\(\))/i.test(envHelper),
  'the env helper never logs a key value');

for (const [name, index] of [['download', downloadIndex], ['upload', uploadIndex]]) {
  ok(!/Deno\.env\.get\('SUPABASE_/.test(index),
    `${name}: no reserved SUPABASE_ env var is read directly (supabase secrets set rejects that prefix)`);
  ok(/from '\.\.\/_shared\/env\.ts'/.test(index), `${name}: uses the shared env helper`);
  ok(!/console\.(log|error|warn)\([^)]*(SERVICE_ROLE|SECRET_KEY|ANON_KEY|PUBLISHABLE)/i.test(index),
    `${name}: never logs a key value`);
}

if (failures) { console.error(`\ncustomer dashboard UX tests: ${failures} FAILED`); process.exit(1); }
console.log('\ncustomer dashboard UX tests: ALL PASSED');
