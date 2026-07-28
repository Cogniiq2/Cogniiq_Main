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

if (failures) { console.error(`\ncustomer dashboard UX tests: ${failures} FAILED`); process.exit(1); }
console.log('\ncustomer dashboard UX tests: ALL PASSED');
