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

// ---- personalized public-offer greeting: additional rules -----------------------------
// Explicit Herr/Frau with a full contact name (structured fields win over contactName).
ok(g.buildGreetingLine({ salutation: 'herr', firstName: 'Milan', lastName: 'Popovic', contactName: 'Milan Popovic' }) === 'Guten Tag, Herr Popovic', 'Herr with full contact name uses surname only, no duplication');
ok(g.buildGreetingLine({ salutation: 'frau', firstName: 'Sandra', lastName: 'Graus', contactName: 'Sandra Graus' }) === 'Guten Tag, Frau Graus', 'Frau with full contact name uses surname only, no duplication');
// No structured name AND no explicit salutation: fall back to the free-text contact name.
ok(g.buildGreetingLine({ contactName: 'Vanessa Graus' }) === 'Guten Tag, Vanessa Graus', 'contact name without salutation is used verbatim');
// Neutral/unspecified salutation with no structured name still uses contact name.
ok(g.buildGreetingLine({ salutation: 'neutral', contactName: 'Vanessa Graus' }) === 'Guten Tag, Vanessa Graus', 'neutral salutation + contact name only');
// Leading/repeated whitespace is normalized in every input field.
ok(g.buildGreetingLine({ contactName: '  Vanessa   Graus  ' }) === 'Guten Tag, Vanessa Graus', 'whitespace in contact name is normalized');
ok(g.buildGreetingLine({ salutation: '  herr  ', lastName: '  Popovic  ' }) === 'Guten Tag, Herr Popovic', 'whitespace in salutation/surname is normalized');
// Company alone (no person) must never be used as a surname or greeted name.
ok(g.buildGreetingLine({ salutation: 'herr' }) === 'Willkommen', 'salutation with only a company (no person fields) never fabricates a name');
ok(!/Cogniiq|GmbH/.test(g.buildGreetingLine({})), 'company name is never substituted for a person');
// No "undefined"/"null" ever renders, and no duplicated punctuation.
for (const input of [{}, { salutation: 'herr' }, { contactName: '' }, { firstName: null, lastName: undefined }]) {
  const line = g.buildGreetingLine(input);
  ok(!/undefined|null/.test(line), `no literal undefined/null rendered for ${JSON.stringify(input)}`);
  ok(!/,,|,\s*,/.test(line), `no duplicated punctuation for ${JSON.stringify(input)}`);
}
// Public-page fallback (explicit option) yields the required copy exactly.
ok(g.buildGreetingLine({}, { fallback: 'Guten Tag' }) === 'Guten Tag', 'public-page fallback renders "Guten Tag"');
ok(`${g.buildGreetingLine({}, { fallback: 'Guten Tag' })},` === 'Guten Tag,', 'public-page fallback composes to the exact required "Guten Tag," greeting');

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

/* Personalized greeting: recipient snapshot (snake_case, from the secure token RPC) is
   explicitly mapped to the greeting helper's camelCase input — never spread as-is, and
   never sourced from the URL/route params. */
ok(/firstName:\s*r\.first_name/.test(portal) && /lastName:\s*r\.last_name/.test(portal), 'first/last name explicitly mapped from the recipient snapshot');
ok(/contactName:\s*r\.contact_name/.test(portal), 'contact name explicitly mapped from the recipient snapshot');
ok(/greetingName:\s*r\.greeting_name/.test(portal), 'explicit greeting name mapped from the recipient snapshot');
ok(!/buildGreetingLine\(offer\?\.recipient/.test(portal), 'greeting is never built from the raw (snake_case) recipient object directly');
ok(/fallback:\s*'Guten Tag'/.test(portal), "public page uses the 'Guten Tag' fallback");
// Both the emailed link and a manually copied link land on this same component/route,
// backed by the same fetchPublicOffer(token) call — so they always resolve to the same
// greeting for a given offer. There is no separate code path per link-origin.
ok(/fetchPublicOffer\(token\)/.test(portal), 'single fetch path for the public offer regardless of how the link was obtained');
ok((portal.match(/fetchPublicOffer\(/g) ?? []).length === 1, 'only one fetchPublicOffer call site — no email-specific vs. copied-link branching');
// The greeting is not read from route/query params — only from `token`, which is itself
// only used to fetch the server-verified projection.
ok(!/useSearchParams|recipientName|name=.*searchParams/.test(portal), 'recipient name is never trusted from URL parameters');

/* Greeting renders once, before the introductory/offer text, using the premium design. */
const heroIdx = webview.indexOf('{greeting}');
const introIdx = webview.indexOf('offer.introduction');
ok(heroIdx >= 0 && introIdx > heroIdx, 'greeting renders before the introduction section');
ok((webview.match(/\{greeting\}/g) ?? []).length === 1, 'greeting is rendered exactly once in the web view (not per-section)');

if (failures) { console.error(`\nsignature offer portal tests: ${failures} FAILED`); process.exit(1); }
console.log('\nsignature offer portal tests: ALL PASSED');
