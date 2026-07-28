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

// ---------------------------------------------------------------- 1) navigation breakpoint gap
// The desktop cluster, the mobile trigger and the mobile panel must all switch at the SAME
// breakpoint as the desktop nav row (lg). Any md: variant among them re-opens the dead zone.
ok(/className="hidden items-center gap-2 lg:flex"/.test(shell), 'desktop header cluster switches at lg (not md)');
ok(/text-gray-700 lg:hidden"/.test(shell), 'mobile menu trigger is hidden from lg up (not md)');
ok(/border-t border-gray-100 bg-white lg:hidden"/.test(shell), 'mobile nav panel is hidden from lg up (not md)');
ok(/border-t border-gray-100 bg-white\/80 lg:block/.test(shell), 'desktop nav row still appears at lg');
ok(!/\bmd:hidden\b/.test(shell), 'no md:hidden remains in the shell (would recreate the 768-1023px gap)');
ok(!/\bmd:flex\b/.test(shell), 'no md:flex remains in the shell (would recreate the 768-1023px gap)');
// The org switcher lives in the desktop cluster, which is now lg-only, so the mobile panel must
// carry its own switcher or multi-org users lose it below 1024px.
ok(/customer-organization-select-mobile/.test(shell), 'mobile panel provides an organization switcher');

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

/* Routes exist and are protected. */
for (const route of ['/app/projects/:projectId', '/app/documents', '/app/billing']) {
  const pattern = new RegExp(`path="${route.replace(/[/:]/g, (c) => '\\' + c)}"[^>]*element=\\{<ProtectedRoute>`);
  ok(pattern.test(app), `${route} is registered behind ProtectedRoute`);
}
ok(/BillingPage \/><\/ProtectedRoute>/.test(app), '/app/billing renders the real BillingPage, not the old stub');

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

/* Navigation exposes the new surfaces. */
ok(/label: 'Dokumente', href: '\/app\/documents'/.test(shell), 'Dokumente is in the primary navigation');
ok(/label: 'Abrechnung', href: '\/app\/billing'/.test(shell), 'Abrechnung is in the primary navigation');

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
ok(/<CustomerProjectPanel ownerCustomerId=\{c\.id\} organizationId=\{c\.organization_id\} \/>/.test(ownerCustomerDetail),
  'the project panel is mounted on the CRM customer detail page with the real organization id');

/* Internal task tooling and the customer projection stay separate. */
ok(/CustomerTaskChecklist/.test(ownerCustomerDetail) && /CustomerProjectPanel/.test(ownerCustomerDetail),
  'internal task checklist and customer-visible project panel coexist as separate surfaces');
ok(!/owner_customer_tasks/.test(ownerApi), 'the customer project API never touches internal owner tasks');

/* Owner-facing copy makes the customer-visible boundary explicit. */
ok(/Interne Notizen, Budgets und Aufgaben bleiben hier außen vor/.test(ownerPanel),
  'the panel states that internal notes, budgets and tasks are excluded');
ok(/Nur kundensichere Formulierungen/.test(ownerPanel),
  'the blocker field warns that only customer-safe wording belongs there');
ok(/private Profil-E-Mail wird nie automatisch angezeigt/.test(ownerPanel),
  'the contact email field states the private profile address is never auto-exposed');

if (failures) { console.error(`\ncustomer dashboard UX tests: ${failures} FAILED`); process.exit(1); }
console.log('\ncustomer dashboard UX tests: ALL PASSED');
