// Signature-proposal frontend tests. Two layers:
//   (A) BEHAVIOURAL — the pure greeting module is transpiled (via the repo's TypeScript
//       dependency) and executed, so the gender-safe greeting rules are genuinely tested.
//   (B) STRUCTURAL — static source assertions (the repo has no React test runner) that lock
//       in the standalone route, sensitive-document metadata, the welcome/signature/premium
//       web-view wiring, the 3-step acceptance flow, correct signature classification, and
//       the privacy rules (no token logged/stored).

import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import ts from 'typescript';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
const read = (rel) => readFileSync(resolve(root, rel), 'utf8');

let failures = 0;
const ok = (cond, msg) => { if (!cond) { console.error(`FAIL: ${msg}`); failures += 1; } else console.log(`ok: ${msg}`); };

// ---------------------------------------------------------------- (A) behavioural greeting
async function loadGreeting() {
  const src = read('src/lib/ownerFinance/greeting.ts');
  const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText;
  const dataUrl = 'data:text/javascript;base64,' + Buffer.from(js).toString('base64');
  return import(dataUrl);
}

const g = await loadGreeting();
ok(g.buildGreetingLine({ salutation: 'herr', lastName: 'Pensel' }) === 'Guten Tag, Herr Pensel', 'Herr greeting');
ok(g.buildGreetingLine({ salutation: 'frau', title: 'Dr.', lastName: 'Schneider' }) === 'Guten Tag, Frau Dr. Schneider', 'Frau Dr. greeting');
ok(g.buildGreetingLine({ salutation: 'neutral', firstName: 'Anna', lastName: 'Schneider' }) === 'Guten Tag, Anna Schneider', 'neutral full-name greeting');
ok(g.buildGreetingLine({}) === 'Willkommen', 'empty -> Willkommen fallback');
ok(g.buildGreetingLine({ salutation: 'herr' }) === 'Willkommen', 'salutation without a name never yields a bare "Herr"');
// No gender inference: a name alone (no explicit salutation) never produces Herr/Frau.
const inferred = g.buildGreetingLine({ firstName: 'Alex', lastName: 'Meyer' });
ok(inferred === 'Guten Tag, Alex Meyer' && !/Herr|Frau/.test(inferred), 'no gender inference from a name');
ok(g.buildGreetingLine({ greetingName: 'Herr Pensel' }) === 'Guten Tag, Herr Pensel', 'explicit greetingName wins verbatim');
ok(g.buildThanksLine({ salutation: 'herr', lastName: 'Pensel' }) === 'Vielen Dank, Herr Pensel.', 'thanks line for Herr');
ok(g.buildThanksLine({}) === 'Vielen Dank.', 'thanks line neutral fallback');
// missing first name still greets by last name
ok(g.buildGreetingLine({ salutation: 'herr', firstName: '', lastName: 'Pensel' }) === 'Guten Tag, Herr Pensel', 'missing first name handled');

// ---------------------------------------------------------------- (B) structural
const app = read('src/App.tsx');
const canonical = read('src/components/CanonicalManager.tsx');
const portal = read('src/pages/public/PublicDocumentPortal.tsx');
const pad = read('src/components/finance/SignaturePad.tsx');
const welcome = read('src/components/finance/WelcomeSequence.tsx');
const webview = read('src/components/finance/PremiumOfferWebView.tsx');
const api = read('src/lib/ownerFinance/offersApi.ts');

/* Standalone route OUTSIDE the marketing PublicLayout. */
const dRouteIdx = app.indexOf('path="/d/:token"');
const publicLayoutIdx = app.indexOf('<Route element={<PublicLayout />}>');
ok(dRouteIdx >= 0 && publicLayoutIdx >= 0 && dRouteIdx < publicLayoutIdx, '/d/:token route is declared before (outside) the PublicLayout group');
// The /d/ route must not appear between the PublicLayout group's open and close tags.
const layoutBlock = app.slice(publicLayoutIdx, app.indexOf('</Route>', app.lastIndexOf('path="*"')));
ok(!/path="\/d\/:token"/.test(layoutBlock), '/d/:token is not nested inside the PublicLayout group');

/* Sensitive-document metadata. */
ok(/isDocumentSurface/.test(app), 'document-surface detection exists');
ok(/noindex, nofollow, noarchive, nosnippet/.test(app), 'robots noindex/nofollow/noarchive/nosnippet on /d/');
ok(/setMeta\('referrer', 'no-referrer'\)/.test(app), 'referrer no-referrer on /d/');
ok(/isPrivateSurface\(pathname\) \|\| isDocumentSurface\(pathname\)/.test(app), 'LocalBusinessSchema suppressed on /d/');
ok(/startsWith\("\/d\/"\)/.test(canonical), 'CanonicalManager skips /d/ (no marketing canonical)');

/* Portal wiring: welcome -> premium web view + signature acceptance. */
ok(/WelcomeSequence/.test(portal) && /PremiumOfferWebView/.test(portal) && /SignaturePad/.test(portal), 'portal composes welcome + web view + signature pad');
ok(/100dvh/.test(portal), 'portal shell uses 100dvh');
ok(/overflow-x-hidden/.test(portal), 'portal shell prevents horizontal overflow');
ok(/document\.title = `Angebot \$\{offer\.offer_number\} · Cogniiq`/.test(portal), 'title set to offer number after load');

/* 3-step acceptance flow + classification. */
ok(/Angaben/.test(portal) && /Unterschrift/.test(portal) && /Annahme/.test(portal), 'three-step stepper labels present');
ok(/Verbindlich annehmen und übermitteln/.test(portal), 'final submit label present');
ok(/Annahme wird sicher übermittelt/.test(portal), 'submitting label present');
ok(/einfache elektronische Signatur|einfacher elektronischer Signatur/.test(portal), 'labelled simple electronic signature');
ok(!/qualifizierte elektronische Signatur|fortgeschrittene elektronische Signatur|notariell/.test(portal), 'never labelled qualified/advanced/notarised');
ok(/verbindlich an/.test(portal) && /berechtigt bin/.test(portal), 'explicit binding acceptance checkbox text present');

/* Mobile action bar + safe area, decision panel sticky. */
ok(/env\(safe-area-inset-bottom\)/.test(portal), 'mobile bar respects safe-area inset');
ok(/min-h-\[44px\]/.test(portal), 'mobile accept button >= 44px');
ok(/sticky top-8/.test(portal), 'desktop decision panel is sticky in flow');
ok(/!done && !expired/.test(portal), 'action bar hidden after a decision');

/* SignaturePad capabilities. */
ok(/onPointerDown|onPointerMove|onPointerUp/.test(pad), 'signature pad uses Pointer Events');
ok(/touchAction: 'none'|touch-none/.test(pad), 'signature pad suppresses page scroll (touch-action none)');
ok(/devicePixelRatio/.test(pad), 'signature pad is high-DPI');
ok(/undo/.test(pad) && /clear/.test(pad), 'signature pad has undo + clear');
ok(/isEmpty/.test(pad) && /onInkChange/.test(pad), 'signature pad detects empty ink and reports it');
ok(/Stattdessen tippen|type/.test(pad), 'signature pad offers a typed fallback');
// No behavioural biometrics: the code never reads pointer pressure/tilt/velocity or device motion.
ok(!/\.pressure\b|\.tiltX\b|\.tiltY\b|devicemotion|deviceorientation/i.test(pad), 'no behavioural biometrics captured');

/* Welcome sequence. */
ok(/Überspringen/.test(welcome), 'welcome has a skip control');
ok(/prefers-reduced-motion|prefersReducedMotion/.test(welcome), 'welcome respects reduced motion');
ok(!/localStorage|sessionStorage/.test(welcome), 'welcome stores nothing to track the animation');
ok(/FULL_DURATION_MS = 3600/.test(welcome), 'welcome duration within the 3.2–4.0s budget');

/* Premium web view long-word safety. */
ok(/overflow-wrap:anywhere|hyphens-auto/.test(webview), 'web view wraps long German compound words safely');

/* Privacy: token never logged / stored / sent to analytics. */
for (const [name, src] of [['portal', portal], ['api', api], ['pad', pad], ['welcome', welcome]]) {
  ok(!/localStorage|sessionStorage/.test(src) || name === 'api', `${name}: token not persisted to web storage`);
  ok(!/console\.log\([^)]*token/i.test(src), `${name}: token never console-logged`);
}
ok(/acceptOfferWithSignature/.test(api) && /process-accepted-offer/.test(api), 'signed acceptance prefers the Edge Function');
ok(/respondPublicOffer\(/.test(api), 'server-authoritative RPC fallback exists');

if (failures) { console.error(`\nsignature offer portal tests: ${failures} FAILED`); process.exit(1); }
console.log('\nsignature offer portal tests: ALL PASSED');
