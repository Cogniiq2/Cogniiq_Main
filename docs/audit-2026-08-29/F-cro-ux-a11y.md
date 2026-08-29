# F-cro-ux-a11y — CRO / UX / Mobile / Accessibility audit

Auditor: CRO/UX/mobile/a11y specialist. READ-ONLY. Repo `/home/user/Cogniiq_Main`,
branch `claude/cogniiq-website-audit-rswgrv`, build in `dist/` (93 HTML files).

## Method — and what was verified in a real browser

`dist/` was served by a local static node server on :4173 and driven with **real
headless Chromium via Playwright** (`/opt/node22/lib/node_modules/playwright`,
`PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`) at **390x844** and **1440x900**,
locale `de-DE`. Everything below marked **[BROWSER]** is a measured number or a
`getComputedStyle` / `getBoundingClientRect` / `elementFromPoint` result from that
run, not an inference. **[STATIC]** = read from `dist/*.html` or `src/`.

Scripts kept at `…/scratchpad/pw/` (`audit.mjs`, `fold.mjs`, `click.mjs`,
`funnel.mjs`, `a11y2.mjs`, `net.mjs`, `misc.mjs`, `banner.mjs`, `ctapos.mjs`).

**No live data was touched.** The funnel walk-through routed
`**n8n.cogniiq.co/**` to a stubbed 200 — no real lead was submitted.

---

## SUMMARY — what actually matters

Two defects dominate everything else, and both are conversion-fatal on mobile:

1. **CRO-01 (P0):** the cookie consent banner is **364 px tall on an 844 px
   viewport (43% of the first screen)** and sits at `z-60`. On four of the five
   audited journeys the page's **primary CTA is physically underneath it**, and
   the **mobile navigation trigger — the only navigation that exists below `lg`
   — is not clickable at all** until consent is dismissed. Playwright's own
   actionability engine refused the click: *"…`<div role="dialog" …
   aria-label="Cookie-Einwilligung">` subtree intercepts pointer events."*
2. **CRO-02 (P0):** `/kosten-ki-telefonassistent` has **exactly one contact CTA
   inside `<main>`, at y = 21,650 px of a 23,457 px document** — a visitor must
   scroll ~20,900 px (≈25 viewport heights) past the price answer before they
   are offered any way to act.

On accessibility the contact form is the weak point and every violation there is
objectively verifiable: **no `<form>` element at all** (0 in the DOM), **no
programmatic labels** on any input, **no visible focus indicator** (outline
colour resolves to `rgba(0,0,0,0)`), **no error identification of any kind**
(0 live regions, 0 error text — the Weiter button just greys out). The mobile
menu is a fake dialog: no `role`, no `aria-modal`, **Escape does not close it**,
focus never enters it and tab order leaks out the back.

A lot is genuinely good — the desktop dropdown nav is a properly built keyboard
menu, CLS is 0.0000 on every page measured, Spline is correctly desktop-only,
public routes are forced light so there is no theme flash or dark-mode contrast
problem, and there are no dead-end pages. See **§9 What is already good**.

### Severity roll-up

| ID | Title | Sev | Confidence |
|---|---|---|---|
| CRO-01 | Consent banner occludes primary CTA and blocks mobile nav | P0 | KNOWN |
| CRO-02 | `/kosten-…` single CTA at 92% scroll depth | P0 | KNOWN |
| A11Y-01 | Contact form is not a `<form>`; unusable without JS | P0 | KNOWN |
| A11Y-02 | No input is programmatically labelled | P0 | KNOWN |
| A11Y-03 | Focus indicator removed on all form controls | P0 | KNOWN |
| A11Y-04 | No error identification / suggestion anywhere in the form | P1 | KNOWN |
| A11Y-05 | Mobile menu is not a dialog; Esc dead, no focus mgmt/trap | P1 | KNOWN |
| A11Y-06 | Two `<main>` landmarks on most route families | P1 | KNOWN |
| A11Y-07 | Icon-only buttons with no accessible name, hover-only tooltip | P1 | KNOWN |
| A11Y-08 | Unlabelled `opacity-0` range inputs (homepage ROI calculator) | P1 | KNOWN |
| A11Y-09 | Placeholder contrast 1.47:1; `text-gray-400` 2.85:1 | P1 | KNOWN |
| A11Y-10 | No skip link although `#main-content` target exists | P2 | KNOWN |
| CRO-03 | Homepage H1 differs between crawler/mobile and desktop | P1 | KNOWN |
| CRO-04 | 6 required fields + 4 clicks of select before step 2 | P1 | KNOWN |
| MOB-01 | Horizontal overflow 49–63 px at 390 px on 4 pages | P1 | KNOWN |
| MOB-02 | Extreme document heights (31k–37k px) | P2 | KNOWN |
| CRO-05 | 10 different labels for one destination on the homepage | P2 | KNOWN |
| A11Y-11 | framer-motion entrance animations ignore reduced-motion | P2 | KNOWN |
| PERF-01 | Spline: 2.0 MB chunk + third-party fetch, pre-consent (desktop) | P2 | KNOWN |
| PERF-02 | Google Maps iframe fires before consent decision | P2 | LIKELY |
| CRO-06 | 132 elements pre-rendered at `opacity:0` | P2 | KNOWN |
| OBJ-01 | "What if it fails?" unanswered on all KI pages | P1 | KNOWN |

---

## 1. Journey audit

Clicks below are **measured**, by driving the real funnel end-to-end
(`funnel.mjs`) with the webhook stubbed.

### (b) City landing page → contact — measured, complete

`/bayreuth/website-relaunch` → submitted inquiry = **9 clicks + 4 typed fields**:

```
1. dismiss consent banner   <-- MANDATORY, see CRO-01
2. "Kostenloses Erstgespräch" -> /kontakt
   [type] Name, E-Mail, Unternehmen
3. open "Branche" select
4. choose Branche
5. open "Startzeitraum" select
6. choose Startzeitraum
7. Weiter -> Step 2
   [type] Ziel und Ausgangssituation
8. Weiter -> Step 3
9. Anfrage absenden
FINAL URL /anfrage-erhalten   (success page renders correctly)
```

Friction: click #1 exists only because of the banner. Clicks #3–#6 are two
Radix selects that each cost two clicks; both are `required` (CRO-04). Step 3
adds a whole step whose only required content is *nothing* — the calendar is
explicitly `optional`.

### (a) Homepage → service → contact
Homepage carries **16 links to `/kontakt`** [BROWSER, `ctaAll`]. The first
primary CTA is in the hero at y=635 — but occluded (CRO-01). Path is short;
the problem is label chaos, not distance (CRO-05).

### (c) `/ki-telefonassistent-arzt` → pricing → inquiry
CTA ladder is **good**: `/kontakt` at y=827, 7,732, 19,206, 21,786 on a 23,060 px
page, plus 3 links to `/kosten-ki-telefonassistent` [BROWSER, `ctapos.mjs`].
Only friction: the first CTA at y=827 is below the 844 fold *and* under the
banner.

### (d) `/praxen` → product → inquiry
Two `/kontakt` CTAs, at **y=1,003 and y=35,038** of a **37,193 px** page
[BROWSER]. A **34,000 px gap** with no offer in it. First CTA needs 259 px of
scroll — acceptable; the gap is not.

### (e) `/kosten-ki-telefonassistent` → inquiry
**One** CTA in `<main>`, at **y=21,650 / 23,457** — see CRO-02.

### DEAD ENDS
**None.** Every one of the 93 built HTML files except `app-shell.html` (an
internal shell, not a public route) contains ≥2 `href="/kontakt"` [STATIC,
binary-safe grep over `dist/`]. Report this as a pass.

---

## CRO-01 — Consent banner occludes the primary CTA and blocks the mobile nav — **P0 / KNOWN / [BROWSER]**

Evidence, `src/components/ConsentBanner.tsx:106-109`:
```
role="dialog"
aria-modal="false"
aria-label="Cookie-Einwilligung"
className="fixed inset-x-0 bottom-0 z-[60] border-t border-gray-200 bg-white/95 backdrop-blur-md …"
```

Measured at 390x844 on a first visit (`fold.mjs`, `click.mjs`):

| page | banner top | banner h | % of first viewport | primary CTA y | CTA under banner? |
|---|---|---|---|---|---|
| `/` | 480 | **364** | **43%** | 635 | **yes** |
| `/bayreuth/website-relaunch` | 480 | 364 | 43% | 660 | **yes** |
| `/ki-telefonassistent-arzt` | 480 | 364 | 43% | 827 | **yes** |
| `/praxen` | 480 | 364 | 43% | 1003 | no (below fold) |
| `/kosten-ki-telefonassistent` | 480 | 364 | 43% | 21650 | no |

The sub-headline is also occluded on `/bayreuth/website-relaunch`,
`/ki-telefonassistent-arzt` and `/praxen` (`sub.occluded: true`).

**The hard proof — the mobile nav is unreachable.** `document.elementFromPoint`
at the centre of `button[aria-label="Navigation öffnen"]`
(`src/components/ui/premium-mobile-nav.tsx:103-111`, `fixed bottom-6 … z-50`)
returns the **banner's** button row, not the nav button:

```
navBtn:      {top: 774, bottom: 820}
banner:      {top: 479.6, bottom: 844}
hitOverNav:  "DIV.flex flex-shrink-0 flex-wrap items-center gap-2.5"   <-- the banner
```

and Playwright refused the click for 30 s with
*"`<div role="dialog" … aria-label="Cookie-Einwilligung">` subtree intercepts
pointer events"*. After clicking "Alle akzeptieren" the same click succeeds
immediately. Below `lg` there is **no other navigation** — `premium-mobile-nav`
is the entire menu — so until a first-time mobile visitor deals with cookies the
site has no navigation and (on 3 of 5 pages) no reachable CTA.

Blast radius: `ConsentBanner` + `PremiumMobileNav` are mounted from
`src/App.tsx` `PublicLayout` → **every public route** (~88 indexable).

Fix: cap the banner at ~200 px on small screens (collapse the explanatory
paragraph behind "Einstellungen", keep the three buttons); and lift
`PremiumMobileNav`'s trigger above it, or suppress the trigger while the banner
is open. Do not simply raise the pill's z-index above `z-60` — that would put
navigation over a consent dialog. The right shape is: banner short, buttons
always in the bottom ~120 px, pill offset upward by the banner's height while it
is shown.
Risk: low, layout-only. Live-experiment overlap: **none** (no titles/meta/anchors).

---

## CRO-02 — `/kosten-ki-telefonassistent`: one CTA, at 92% scroll depth — **P0 / KNOWN / [BROWSER]**

`ctapos.mjs`, 390 px:
```
/kosten-ki-telefonassistent  docH: 23457
  ctas: [ { t: 'Unverbindliches Erstgespräch vereinbaren', y: 21650, href: '/kontakt' } ]
```
One CTA. 20,906 px of required scrolling to reach it. This page's whole job is
to answer a bottom-of-funnel commercial question ("Was kostet…") — the visitor
arrives *ready*, and is given nothing to click for 25 screens.

Compare `/ki-telefonassistent-arzt`, same template family, which places CTAs at
827 / 7,732 / 19,206 / 21,786 — the pattern already exists in the codebase.

Fix: add a CTA immediately after the price block and one at roughly mid-page,
matching the arzt page's cadence. Reuse the existing `KiCTASection` /
`FinalCTASection` components; introduce no new copy.
Risk: low. Live-experiment overlap: this page **is** an experiment page, but the
running experiment is title/H1/canonical/meta/internal-anchor only — CTA
*placement* is untouched by it. Adding a mid-page CTA does not alter any
experiment variable. Flagging per the rules; coordinator to confirm.

---

## 2. Above the fold at 390 px — measured

`fold.mjs`, viewport 390x844, `getBoundingClientRect` after `networkidle` + 2 s.

| page | hero height | H1 top→bottom | H1 in fold | sub-headline in fold | primary CTA in fold | doc height |
|---|---|---|---|---|---|---|
| `/` | 927 | 176→283 | yes | yes | y=635 (occluded) | 31,669 |
| `/bayreuth/website-relaunch` | 854 | 274→409 | yes | occluded | y=660 (occluded) | 8,287 |
| `/ki-telefonassistent-arzt` | 1,162 | 300→424 | yes | occluded | **no** (y=827) | 23,060 |
| `/praxen` | 1,288 | 189→350 | yes | occluded | **no** (y=1,003) | 37,193 |
| `/kosten-ki-telefonassistent` | 567 | 189→270 | yes | yes | **no** (y=21,650) | 23,457 |

**Verdict:** the value proposition itself *is* legible without scrolling on all
five — H1 lands at 176–300 px with a 33–38 px type size. That part is fine. The
failure is the CTA: **in the first viewport on 0 of 5 pages once the consent
banner is accounted for.** Heroes on `/ki-telefonassistent-arzt` (1,162 px) and
`/praxen` (1,288 px) are 1.4–1.5 viewports tall, pushing the CTA out on their own
even without the banner.

**Is the hero a Spline 3D scene, and what does it cost on mobile?**
Only on desktop, and **it costs mobile nothing** — this is handled correctly.
`src/components/HeroSection.tsx:43-48` renders `<MobileHero />` directly below the
breakpoint and only `lazy()`-loads `hero/DesktopHero` above it. Network capture
(`net.mjs`):

```
mobile390  /  | localReqs 48 | heavy: []                         | EXTERNAL: []
desktop1440/  | localReqs 52 | heavy: ["react-spline-…js"]       | EXTERNAL: ["https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"]
```
`dist/assets/react-spline-Cte_gOum.js` is **2,039,612 bytes** [STATIC, `ls`], plus
`physics-…js` 1,987,560 B in the same graph. Zero of it is requested at 390 px.
Call this out as a **strength**, with the desktop cost noted in PERF-01.

---

## 3. CTA hierarchy

Counts from `audit.mjs` (`ctaAll`, mobile 390 px, hydrated DOM).

| page | interactive elements | links to `/kontakt` | distinct labels for `/kontakt` |
|---|---|---|---|
| `/` | 141 | **16** | **10** |
| `/ki-telefonassistent-arzt` | 64 | 5 | 3 |
| `/bayreuth/website-relaunch` | 53 | 3 | 2 |
| `/praxen` | 41 | 3 | 2 |
| `/kosten-ki-telefonassistent` | 37 | 2 | 2 |

### CRO-05 — one destination, ten labels on the homepage — **P2 / KNOWN / [BROWSER]**
The ten distinct labels pointing at `/kontakt` from `/`:
`Mehr erfahren`, `Kostenloses Erstgespräch`, `Nächster Schritt`,
`Problem lösen lassen`, `Jetzt Lösung anfragen`, `Demo anfragen`,
`Kostenloses Gespräch`, `Zusammenarbeit`, `Jetzt Gespräch buchen`, `Erstgespräch`.

Only one of these is genuinely worth changing, and it is worth changing because
it is **wrong**, not merely vague:

- **`Mehr erfahren` → `/kontakt`** (×4 on the homepage; `Mehr erfahren` also
  appears on `/kontakt` itself). The label promises information and delivers a
  three-step lead form. That is a bounce, and it is the one CTA on the page
  asking for a commitment wildly disproportionate to the visitor's stage.
  Recommended German: **`Kostenloses Erstgespräch`** where the target really is
  the form, or — better for a visitor at that stage — repoint it to the relevant
  service page and keep the label.

The rest are **good and should not be churned**. `Unverbindliches Erstgespräch
vereinbaren`, `Kostenloses Erstgespräch`, `Lösung anfragen` are specific,
low-commitment, correctly Sie-form, and honest about what happens next. Do not
"harmonise" them into one string for its own sake.

Competing primaries in one viewport: on `/` the hero shows
`Erstgespräch vereinbaren` (dark `rgb(13,24,33)`, 334×54) directly above
`Leistungen entdecken` (`rgba(255,255,255,0.7)`, 334×48) [BROWSER, `ctaFold`].
The weight difference is clear and the hierarchy reads correctly — **this is
fine**, no change needed.

Repetition: `Kostenloses Erstgespräch → /kontakt` ×4 and `Nächster Schritt →
/kontakt` ×4 on the homepage. On a 31,669 px page that is not over-repetition;
it is appropriate cadence.

---

## 4. The contact form — `src/components/ContactSection.tsx` (used only by `src/pages/KontaktPage.tsx:395`)

### Field inventory

| Step | Field | Control | Required | `<label for>` | Justified? |
|---|---|---|---|---|---|
| 1 | Name | `input[name=name]`, `autoComplete="name"` | **yes** | **no** | yes |
| 1 | E-Mail | `input[type=email][name=email]` | **yes** | **no** | yes |
| 1 | Unternehmen | `input[name=organization]` | **yes** | **no** | borderline — a solo Praxis owner has no "Unternehmensname" |
| 1 | Branche | Radix Select, 6 options | **yes** | n/a | **no** — 2 clicks, and it is derivable from the page they came from |
| 1 | Startzeitraum | Radix Select, 3 options | **yes** | n/a | **no** — a qualification question asked before trust exists |
| 2 | Interessensfelder | 4 toggle buttons | no | n/a | fine (optional) |
| 2 | Ziel und Ausgangssituation | `textarea` | **yes** | **no** | yes, but it is a free-text essay as a gate |
| 3 | Wunschtermin | `PremiumCalendar` | no (labelled `optional`) | n/a | fine |

**6 required fields** across 3 steps. `ContactSection.tsx:143-211` (step 1),
`:285-295` (goal).

### CRO-04 — required fields that plausibly cost leads — **P1 / KNOWN**
`Branche` (`:186-198`) and `Startzeitraum` (`:200-211`) are both `required` and
both Radix selects, i.e. **4 of the 9 measured clicks** in the whole funnel. A
visitor who arrived from `/ki-telefonassistent-arzt` has already declared their
Branche by their route. Neither field is needed to reply within 24 h.
**Fix:** make both optional (keep them visible — many will fill them), or
pre-select `Branche` from the referring route. Risk: low; the n8n payload keeps
its keys, values are just empty strings. Live-experiment overlap: none.

### A11Y-01 — the form is not a `<form>` — **P0 / KNOWN / [BROWSER + STATIC]**
`document.querySelectorAll('form').length` → **0** on `/kontakt` [BROWSER];
`grep -c "<form" dist/kontakt.html` → **0** [STATIC]. The author already knew —
`ContactSection.tsx:352-354`:
> *"`required` and `type="email"` never ran: the controls are not inside a
> `<form>`, so browser constraint validation is inert…"*

The JS-side email regex added there is a good fix for *that* bug, but the
structural cause remains. Consequences: no Enter-to-submit; no native constraint
validation; no `<form>` semantics for assistive tech; and **the page does not
work without JavaScript** — `dist/kontakt.html` ships 3 inert `<input>`s that
post nowhere, and there is no `<noscript>` fallback anywhere in `dist/`.
WCAG 3.3.2 (A), 1.3.1 (A); robustness beyond WCAG.
Fix: wrap steps in `<form onSubmit={…}>`, `type="submit"` on the final button.
Blast radius: `/kontakt` only.

### A11Y-02 — no input is programmatically labelled — **P0 / KNOWN / [BROWSER]**
`FormLabel` (`ContactSection.tsx:676-690`) renders a Radix `Label` with **no
`htmlFor`**, and no `Input` is given an `id`. The label is a *sibling*, not an
ancestor, so nothing associates them. Rendered DOM, straight from the browser:

```html
<div><label class="… block text-gray-700 mb-1.5" style="font-size:12.5px;…">Name *</label>
<input class="flex w-full border px-3 py-1 … focus-visible:ring-r…"
```
`{tag:"INPUT", name:"name", id:null, req:true, labelled:false, ph:"Max Mustermann"}`
— same for `email` and `organization` [BROWSER, `a11y.fields`]. Identical in
`dist/kontakt.html`: five `<label class=…>` with no `for` [STATIC].

A screen-reader user hears "Bearbeiten, leer" — the only cue is the placeholder,
which vanishes on input and fails contrast (A11Y-09).
**WCAG 1.3.1 Info and Relationships (A), 3.3.2 Labels or Instructions (A),
4.1.2 Name, Role, Value (A).**
Fix: `id` on each control + `htmlFor` on `FormLabel` (or wrap). ~10 lines.
Blast radius: `/kontakt` only — `PraxisRechnerWidget` already does this
correctly, so there is an in-repo pattern to copy.

### A11Y-03 — focus indicator removed on every form control — **P0 / KNOWN / [BROWSER]**
`getComputedStyle` on each focused input (`a11y2.mjs`):
```
input[name="name"] {"outlineStyle":"solid","outlineWidth":"2px",
  "outlineColor":"rgba(0, 0, 0, 0)",           <-- transparent
  "boxShadow":"rgb(255,255,255) 0 0 0 0, rgb(10,10,10) 0 0 0 0, rgba(0,0,0,0.05) 0 1px 2px 0",
  "borderColor":"rgb(229, 231, 235)"}          <-- unchanged from unfocused
```
Same for `email` and `organization`. **Zero visible focus indication.**

Cause is a two-layer removal:
- `src/components/ui/input.tsx:13` — `focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring`
  (also `src/components/ui/textarea.tsx:12`)
- overridden at `ContactSection.tsx:153, 167, 180, 293` with **`focus-visible:ring-0`**,
  which cancels the replacement ring and leaves only the suppressed outline.
  `SelectTrigger` at `:187, :202` does the same with `focus:ring-0`.

**WCAG 2.4.7 Focus Visible (AA)**, and 2.4.11 Focus Not Obscured (AA) is moot
because there is nothing to obscure.
Fix: drop `ring-0` from those six class strings and let the base `ring-1` apply
(or use `focus-visible:border-gray-900`). Risk: purely visual, 6 lines.
Blast radius: `ui/input`/`ui/textarea` are shared, but the *ring-0 override* is
local to `ContactSection` — the base components are fine everywhere else.

### A11Y-04 — no error identification of any kind — **P1 / KNOWN / [BROWSER]**
With `name="Test"`, `email="nichtvalide"`, `organization="Firma"` filled in:
```
{"hasErrorWord":false, "liveRegions":0}
Weiter button: {"disabled":true, "aria-disabled":null, "aria-describedby":null,
                "bg":"rgb(209, 213, 219)"}
```
No message. No `aria-live`. No `role="alert"` (the one `role="alert"` at
`ContactSection.tsx:640` is the *network-failure* box and is unrelated). The only
feedback that the email is invalid is that a grey button silently stays grey —
`canAdvance()` at `:359-366` returns false and `handleNext` at `:368-371` returns
without a word.

For a sighted user this is a dead end they must guess their way out of. For a
screen-reader user the `disabled` button is not even reachable by tab.
**WCAG 3.3.1 Error Identification (A), 3.3.3 Error Suggestion (AA).**
Fix: keep the button enabled, validate on click, render a per-field message in a
`role="alert"` region and move focus to the first invalid field.
This is the single highest-yield combined a11y+CRO fix in the form.

### Validation behaviour, error messaging, success state — assessed
- **Validation:** JS-only, `emailLooksValid` regex at `:357`, gate at `:359-366`.
  The regex is correct and the comment at `:352-354` shows it was a deliberate
  fix. Good, but silent (A11Y-04).
- **Error messaging on submit failure: this is very well done.** `:373-410`
  checks `res.ok`, preserves entered data, and renders a `role="alert"` box
  offering the phone and email fallbacks. The comment at `:373-379` documents
  the previous bug (navigating to the thank-you page from `finally`). Call this
  out as a strength.
- **Success state:** verified live — submitting navigates to `/anfrage-erhalten`
  with `state:{submitted:true}` and renders *"Anfrage erfolgreich gesendet. …
  Wir melden uns innerhalb von 24 Stunden…"* [BROWSER, `funnel.mjs`]. Good.
- **Without JavaScript: does not work at all** (A11Y-01).

---

## 5. Accessibility — remaining findings

### A11Y-05 — the mobile menu is not a dialog — **P1 / KNOWN / [BROWSER]**
`src/components/ui/premium-mobile-nav.tsx:152-163` (sheet), `:103-111` (trigger).
Measured after opening the menu (`click.mjs`):
```
MENU {"open":true, "role":null, "ariaModal":null,
      "active":"BUTTON:Navigation öffnen",     <-- focus never entered the sheet
      "trigExpanded":"ABSENT",                 <-- no aria-expanded
      "bodyOverflow":"hidden"}
after Esc still open: true                     <-- Escape does nothing
TAB while open: [IN]Schließen, [IN]Home, [IN]Leistungen, [IN]Standorte, [IN]Über uns,
  [IN]FAQ, [IN]Referenzen, [IN]Blog, [IN]Kundenlogin, [IN]Kontakt,
  [IN]Erstgespräch vereinbar, [OUT]Erstgespräch vereinbar   <-- focus escapes
```
So: the overlay has no `role="dialog"`/`aria-modal`, the trigger never announces
state, **Escape does not close it** (there is no key handler in the file — grep
for `Escape` returns nothing), focus is not moved in on open, and after the last
item focus leaves into the page behind, which is `overflow:hidden` and visually
covered. A keyboard or screen-reader user ends up interacting with content they
cannot see. Not a hard trap (you can tab out) — the opposite problem.

**WCAG 4.1.2 Name, Role, Value (A)** (missing role + `aria-expanded`),
**2.4.3 Focus Order (A)**, **1.4.13** (dismissible, for the pattern).
The desktop dropdown in `src/components/Navigation.tsx:142-147` **already
implements Escape-to-close and focus-return** and its header comment (`:21-24`)
explains exactly this class of bug. The mobile sheet simply never received the
same treatment.
Fix: `role="dialog" aria-modal="true"` on the sheet, `aria-expanded` +
`aria-controls` on the trigger, an Escape handler, focus to the close button on
open, focus back to the trigger on close, and a focus trap.
Blast radius: `PremiumMobileNav` is in `Navigation` → **every public route**.

### A11Y-06 — two `<main>` landmarks on most route families — **P1 / KNOWN / [BROWSER + STATIC]**
`src/App.tsx:442` renders `<main id="main-content">` in `PublicLayout`; the page
templates render a **second** `<main>` inside it:
`ClusterPage.tsx:153`, `CityServicePage.tsx:142`, `IndustryPage.tsx:150`,
`NationalIndustryPage.tsx:169`, `CostPage.tsx:125`, `ProblemPage.tsx:74`.

Confirmed in the built HTML [STATIC]:
```
dist/index.html                     mains=1
dist/kontakt.html                   mains=1
dist/ki-telefonassistent-arzt.html  mains=2
dist/praxen.html                    mains=2
dist/bayreuth/website-relaunch.html mains=2
```
Invalid HTML (only one `main` may be visible) and two "main" landmarks in the
rotor. **WCAG 1.3.1 (A)**; ARIA landmark best practice.
Blast radius: the cluster/city/industry/cost/problem templates — the **majority
of the ~88 indexable routes**. Fix: change the six inner `<main>` to `<div>`.
Six one-word edits, no visual change.

### A11Y-07 — icon-only buttons with no accessible name, tooltip on hover only — **P1 / KNOWN / [BROWSER]**
`src/components/ROICalculator.tsx:53-62` and `src/components/CostComparisonSection.tsx:67-78`:
```jsx
<button type="button"
  onMouseEnter={() => setShowTip(true)}
  onMouseLeave={() => setShowTip(false)}
  className="text-gray-300 hover:text-gray-500 transition-colors">
  <Info size={12} />
</button>
```
The browser found **8 buttons with an empty accessible name on `/`**, all with
class `text-gray-300 hover:text-gray-500`, measuring **12×12 px** [BROWSER,
`a11y.noName` / `smallTargets`]. Three faults in five lines:
- no accessible name → **WCAG 4.1.2 (A)**
- `onMouseEnter`/`onMouseLeave` only, no focus/keyboard path → **WCAG 2.1.1 Keyboard (A)**
- tooltip not dismissible/hoverable → **WCAG 1.4.13 Content on Hover or Focus (AA)**
- 12×12 target → **WCAG 2.5.8 Target Size (Minimum) (AA)** requires 24×24
- `text-gray-300` (#d1d5db) icon on white = **1.47:1** → **WCAG 1.4.11 Non-text Contrast (AA)** requires 3:1

Fix: `aria-label`, add `onFocus`/`onBlur`, Escape-to-dismiss, ≥24×24 hit area,
darker icon colour. Blast radius: the homepage ROI calculator and the cost
comparison section (also on `/kosten-…` family).

### A11Y-08 — unlabelled `opacity-0` range inputs — **P1 / KNOWN / [BROWSER]**
`ROICalculator.tsx:82-88` and `CostComparisonSection.tsx:93-99`:
```jsx
<input type="range" … className="absolute inset-0 w-full opacity-0 cursor-pointer h-full" />
```
No `id`, no `name`, no `aria-label`. Browser on `/`:
`{tag:"INPUT", type:"range", name:"", id:null, labelled:false}` ×8.
Screen reader announces "Schieberegler" with no name and no unit.
**WCAG 4.1.2 (A), 1.3.1 (A).**

**Direct in-repo counter-example:** `PraxisRechnerWidget` on `/praxen` and
`/kosten-…` renders `{id:"rechner-anrufe", labelled:"for"}` for all six of its
controls [BROWSER] — correct. Copying that pattern into `ROICalculator` is the
whole fix.

### A11Y-09 — contrast — **P1 / KNOWN / [BROWSER, computed]**
Measured with `getComputedStyle` and the WCAG relative-luminance formula:

| what | colour | on | size | ratio | required | verdict |
|---|---|---|---|---|---|---|
| input placeholder (`placeholder:text-gray-300`, `ContactSection.tsx:153,167,180,293`) | `rgb(209,213,219)` | `#fff` | 14 px | **1.47:1** | 4.5:1 | **fail 1.4.3 (AA)** |
| `text-gray-400` `rgb(156,163,175)` | | `#fff` | 16 px | **2.85:1** | 4.5:1 | **fail 1.4.3 (AA)** |
| `text-gray-300` `rgb(209,213,219)` | | `#fff` | 16 px | **1.47:1** | 4.5:1 | **fail 1.4.3 (AA)** |
| `text-gray-500` `rgb(107,114,128)` nav item | | `#fff` | 14 px/500 | **4.83:1** | 4.5:1 | pass |
| body ink `rgb(17,24,39)` | | `#fff` | 14 px | 17.74:1 | 4.5:1 | pass, excellent |

`text-gray-400` appears **964 times** across `src/**/*.tsx`; `text-gray-300`
**300 times** [STATIC, grep -o | wc -l]. Not all are text (many are icons and
borders), but the browser found real content at these values — e.g. the whole
"Zusammenfassung" block (`ContactSection.tsx:325`), the step-progress labels
(`:104-107`), the `optional` marker (`:684`), and `Schritt {n} von 3` (`:557`).
Fix: promote body/muted text one step (`gray-400`→`gray-600` = 7.0:1,
`gray-300`→`gray-500` = 4.83:1). Do this by auditing the *text* uses, not with a
blanket find-and-replace — icons and hairline borders at `gray-300` are fine
under 1.4.11 in most of these positions.

**Both themes:** the dark theme does **not apply to public pages** and therefore
introduces no second contrast surface. Verified by launching with
`colorScheme:'dark'` — `html` still resolves to `class="cq-public-light light"`,
`style.colorScheme="light"`, `body` `rgb(250,250,250)`, `h1` `rgb(17,24,39)` —
identical to the light run. The inline script at `index.html:16` strips `dark`
before first paint for every non-`/app|/admin|/owner|/auth|/d` path. The many
`dark:` utilities in public components are dead code there, not a risk.
**No theme flash. This is well engineered — see §9.**

### A11Y-10 — no skip link — **P2 / KNOWN / [BROWSER + STATIC]**
`a11y.skipLink: false` on all 8 pages tested; `grep -l "Zum Inhalt\|Hauptinhalt\|skip"`
over `dist/*.html` returns nothing. The first focusable element on every page is
the logo link ("Cogniiq Startseite"), followed by the whole header.

The target **already exists**: `src/App.tsx:442` `<main id="main-content">`, and
`src/entry-server.test.tsx:63` asserts on it. Someone intended a skip link and it
was never added.
**WCAG 2.4.1 Bypass Blocks (A)** — arguably satisfied by the `main` landmark for
screen-reader users, but not for sighted keyboard users. Low effort, real value.
Fix: one `sr-only focus:not-sr-only` anchor at the top of `PublicLayout`.
Blast radius: every public route (one insertion).

### Checks that came back CLEAN
- **`lang`**: `de` on every page [BROWSER]. Pass (3.1.1).
- **Heading order**: 0 skipped levels across `/`, `/kontakt`,
  `/ki-telefonassistent-arzt`, `/praxen`, `/kosten-…`, `/bayreuth/website-relaunch`
  (43, 15, 34, 49, 17, 31 headings respectively) [BROWSER]. Exactly one `<h1>`
  per page. **Genuinely good.**
- **Images**: 0 `<img>` without `alt`, 0 without dimensions — because there are
  **0 `<img>` elements** on the audited pages; the visual language is CSS + SVG
  + `lucide-react` icons, and the icons carry `aria-hidden="true"`
  (`Navigation.tsx:293,342,346,427,465`; `premium-mobile-nav.tsx:227,247,276`).
  Correct.
- **Invalid `role` values**: none found on any page [BROWSER, checked against the
  ARIA 1.2 role list].
- **Keyboard traps**: none. The mobile sheet leaks focus (A11Y-05) rather than
  trapping it.
- **Desktop dropdown navigation**: correct `aria-expanded` / `aria-controls` /
  `aria-haspopup` (`Navigation.tsx:329-331`), `role="tablist"/"tab"/"tabpanel"`
  with `aria-selected` (`:391-440`), Escape-to-close with focus return
  (`:142-147`, `:124`). **This is a well-built component.**

### A11Y-11 — reduced motion not honoured on public pages — **P2 / KNOWN / [BROWSER]**
With `reducedMotion:'reduce'` (`matchMedia(...).matches === true` confirmed),
`/kontakt` still had **25 elements at `opacity < 1` and 23 with a non-identity
transform** inside `<main>` 400 ms after load. There is **no `<MotionConfig
reducedMotion="user">`** anywhere; `useReducedMotion` appears only in
`SectionRail.tsx:93`, `navigation/SidebarShell.tsx:65` and
`app/CustomerAppPrimitives.tsx:289,691` — i.e. the **dashboard**, not the public
site. `src/index.css:551-566` scopes its reduced-motion block to
`[data-cq-surface='dashboard']` / `[data-cq-portal='dashboard']` only.

So every framer-motion entrance animation on the marketing site (and there are
many — `ContactSection` alone has `initial={{opacity:0,y:20}}` at `:412`, `:437`,
`:536`, plus per-step `x:24` slides at `:134`, `:225`, `:299`) runs for users who
asked for less motion.

Not a strict AA failure — 2.3.3 Animation from Interactions is **AAA**, and no
infinite animation was found (`animationIterationCount:'infinite'` → `[]`), so
2.2.2 does not bite. Still a real problem for vestibular users and a one-line
fix: wrap the public tree in `<MotionConfig reducedMotion="user">`.
Blast radius: all public routes; framer-motion handles it globally.

---

## 6. Mobile UX at 390 px

### MOB-01 — horizontal overflow on 4 of 8 pages — **P1 / KNOWN / [BROWSER]**
`document.documentElement.scrollWidth` vs `clientWidth` at 390 px:

| page | scrollWidth | overflow |
|---|---|---|
| `/` | 439 | **+49** |
| `/praxen` | 453 | **+63** |
| `/ki-telefonassistent` | 453 | **+63** |
| `/kosten-ki-telefonassistent` | 449 | **+59** |
| `/kontakt`, `/bayreuth/website-relaunch`, `/ki-telefonassistent-arzt`, `/webdesign` | 390 | 0 |

The offender list is identical on all four and points at the mobile nav pill:
```
BUTTON .fixed bottom-6 left-1/2 -translate-x-1/2 z-50 lg:hidden     right:449  w:224
DIV    .absolute inset-0 rounded-full bg-white/10 blur-xl scale-125 right:477  w:281
```
`premium-mobile-nav.tsx:113` — the decorative glow is `scale-125` of a pill whose
width is driven by the **section label text** (`currentLabel`, `:98`,`:130-132`).
On pages whose label is short ("Home", 187 px) the total stays near the edge; on
"Leistungen"/"Standorte" (224 px) the scaled glow reaches 281 px and, combined
with the centring transform, pushes the document past 390. The nav bar
(`Navigation.tsx:170`) then reports the widened scrollWidth as its own width.

Consequence: the page rubber-bands sideways and the fixed header slides off, on
the four highest-value KI/practice pages.
Fix: `overflow-x: clip` on the layout wrapper, and/or `pointer-events-none` +
`overflow-hidden` containment on the glow div, and/or drop `scale-125`.
Risk: low. Blast radius: `PremiumMobileNav` → every public route below `lg`.

### Text below 16 px
Widespread and deliberate: `/` renders body copy at **10, 10.5, 11, 11.5 and 12
px** [BROWSER, `tinyText`] — e.g. `"Gespeichert wird nur das strukturierte
Ergebnis"` at **10 px**, `"Keine Gesprächsaufzeichnung"` at 11 px. On `/kontakt`,
`"Was Sie mitnehmen"` and `"Nach Ihrer Anfrage"` are **9.5 px**
(`ContactSection.tsx:469`, `:496`, `:515`, `:526`). The form's own labels are
12.5 px (`:680`) and its inputs 14 px.

This is not a WCAG failure on its own (1.4.4 only requires 200% zoom to work),
but 9.5–11 px German body text on a phone is at the edge of legibility, and it is
being used for exactly the reassurance copy (`Keine Gesprächsaufzeichnung`,
`Kostenlos & unverbindlich`) that a hesitant B2B buyer needs to read. **P2**,
recommend a floor of 13 px for prose and 12 px for eyebrow labels.

### Tap targets
At 390 px: **128 interactive elements under 44×44 on `/`**, 45 on `/kontakt`, 30–43
on the others [BROWSER]. Under **WCAG 2.2's actual AA bar (2.5.8, 24×24)** the
real failures are narrower: the **12×12** tooltip buttons (A11Y-07) and a set of
11–12 px icon buttons. Most of the rest are inline text links inside prose, which
are exempt. Report honestly: 2.5.8 **fails on the tooltip buttons**, and the
44×44 shortfall elsewhere is a usability note, not a conformance failure. The
mobile menu's close button is **32×32** (`premium-mobile-nav.tsx:174-180`) —
passes 2.5.8, below the 44 px comfort target.

### Sticky elements obscuring content
Four fixed layers on every mobile page [BROWSER, `fixed`]:
`NAV` (top, h=72, z=50), `ScrollProgress` (h=2, z=49),
`PremiumMobileNav` pill (bottom, h=46, z=50),
`ConsentBanner` (bottom, h=364, z=60). The banner is CRO-01. The pill
permanently occupies the bottom ~70 px and sits over page content with no
compensating `padding-bottom` — on `/praxen` it lands at y=909, over the copy.
**P2.**

### Tables / code overflow
None found — no `<table>` or `<pre>` in the audited public pages.

### Scroll depth to first CTA (mobile, measured)
`/` 0 px (but occluded) · `/bayreuth/website-relaunch` 0 px (occluded) ·
`/ki-telefonassistent-arzt` 83 px · `/praxen` 259 px ·
`/kosten-ki-telefonassistent` **20,906 px**.

### MOB-02 — document heights — **P2 / KNOWN / [BROWSER]**
`/praxen` **37,193 px**, `/ki-telefonassistent` 35,158 px, `/` 31,669 px,
`/kosten-…` 23,457 px, `/ki-telefonassistent-arzt` 23,060 px at 390 px width.
`/praxen` is **44 phone screens** long with two CTAs 34,000 px apart. That page
holds the top main-nav slot for the practice audience. **P2** — not a defect on
its own, but it is the reason CRO-02 and the `/praxen` CTA gap matter so much.
The homepage also carries **141 interactive elements** and requests **46 JS
files** at 390 px [BROWSER].

---

## 7. Layout stability

### CLS is 0.0000 — **GOOD / [BROWSER]**
`PerformanceObserver({type:'layout-shift', buffered:true})`, 3 s after
`networkidle`, 390 px:
```
CLS /                          0.0000
CLS /kontakt                   0.0000
CLS /ki-telefonassistent-arzt  0.0000
CLS /praxen                    0.0000
```
- **The consent banner does not shift layout** — it is `position:fixed`
  (`ConsentBanner.tsx:109`), so it occludes (CRO-01) rather than reflows. The
  right trade was made.
- **No theme flash** — the blocking inline script at `index.html:16` sets the
  public light class during parse, before first paint, and is covered by
  `publicTheme.test.ts` per the comment at `index.html:10-14`.
- **No images to size** — 0 `<img>` on the audited pages.
- **Fonts**: no `<link>` to a webfont host in `dist/index.html`; the system font
  stack is used, so no FOUT and no `size-adjust` requirement.

### CRO-06 — 132 elements pre-rendered at `opacity:0` — **P2 / KNOWN / [STATIC]**
`grep -o 'opacity:0' dist/index.html | wc -l` → **132**;
`dist/kontakt.html` → **41**; `dist/ki-telefonassistent-arzt.html` → 73.
These are framer-motion `initial` styles baked into the SSR output. They cost no
CLS (framer-motion animates opacity, not layout), but they mean **a hydration
failure leaves large parts of the page invisible** while still present in the
HTML. Given the file's own comment about a past hydration teardown
(`premium-mobile-nav.tsx:59-66`, React #425 on unknown `/blog/*` URLs), this is a
live risk, not a theoretical one. **P2** — mitigate with `whileInView` +
`viewport={{once:true}}` defaults that start at opacity 1 for above-the-fold
content, or a CSS `no-js`/hydration-timeout fallback.

### PERF-01 / PERF-02 — third-party requests before a consent decision — **P2**
- **PERF-01 [BROWSER, KNOWN]:** on desktop `/`, `react-spline-Cte_gOum.js`
  (**2,039,612 B**) loads and fetches
  `https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode` **while the
  consent banner is still undecided**. Mobile is unaffected (correctly gated).
- **PERF-02 [BROWSER, LIKELY]:** on desktop `/kontakt`, an iframe fires
  `https://www.google.com/maps?q=49.948260,11.578270&z=16&output=embed`
  pre-consent. Source is in the prerendered HTML with
  `loading="lazy"` and `title="Standort von Cogniiq in Bayreuth"`
  (`dist/index.html`, `dist/kontakt.html`). `index.html:6-9` states *"Before
  consent there is no Google tag request"* — that is true of gtag, but a Google
  Maps embed is still a Google-hosted third-party request made before the
  visitor has chosen. Marked LIKELY because whether it needs consent is a legal
  judgement, not a technical one; the request itself is KNOWN. Recommend a
  click-to-load placeholder. **Defer the legal read to the compliance reviewer.**

---

## 8. OBJ — objection handling on the KI-Telefonassistent pages

Keyword coverage over the prerendered text [STATIC, tag-stripped `dist/*.html`]:

| objection | `/ki-telefonassistent-arzt` | `/praxen` | `/kosten-ki-telefonassistent` | `/bayreuth/website-relaunch` |
|---|---|---|---|---|
| Price (`€`, "kostet") | 15 / 4 | 50 / 6 | 68 / 19 | 10 / 3 |
| Setup effort ("Einrichtung") | 8 | 29 | 36 | **0** |
| Contract / term ("Vertrag", "Laufzeit") | 8 / 3 | 12 / 7 | 16 / 8 | **0 / 0** |
| Cancellation ("Kündigung") | 1 | 2 | 4 | **0** |
| Trial ("Testphase") | 2 | 3 | 7 | **0** |
| Data handling (DSGVO / AVV / Auftragsverarbeitung) | 6 / 1 / 5 | **1 / 0 / 1** | **1 / 0 / 1** | 8 / 0 / 0 |
| **"What happens if it fails"** | **0** | **0** | **0** | **0** |

**This is mostly a strength** — price, setup, term, cancellation and trial are all
answered *before* the CTA on the three KI pages, which is unusual and good. Three
real gaps:

### OBJ-01 — "what happens when it fails" is unanswered everywhere — **P1 / KNOWN**
No page contains an escalation/fallback narrative. Searching
`/kosten-ki-telefonassistent` for failure language surfaces only a configuration
mention: *"Ein geführter Ablauf im Dashboard: Stimme, Begrüßungssatz, Anliegen,
Regeln, **Weiterleitungen**."* For a Praxis owner the decisive question is *"what
does the caller hear when the assistant does not understand — and does my patient
get a human?"* Nothing answers it. This is the objection most likely to stop a
medical buyer at the CTA. Recommend one short, factual block per KI page —
**owner-verified, per `OWNER-INPUT.md`; do not invent the behaviour.**

### OBJ-02 — data handling thin exactly where the buyer is most sensitive — **P2 / KNOWN**
`/praxen` and `/kosten-…` mention DSGVO **once** and AVV **never**, while
`/ki-telefonassistent-arzt` covers it properly (DSGVO ×6, Auftragsverarbeitung ×5).
`/praxen` is the practice audience's main-nav landing page and is the *weaker* of
the two on the one topic a Praxis must clear internally. Lift the arzt page's
existing block onto `/praxen`. No new claims needed — reuse verified copy.

### OBJ-03 — `/bayreuth/website-relaunch` answers no commercial objection — **P2 / KNOWN**
Zero mentions of Einrichtung, Laufzeit, Vertrag, Kündigung or Testphase; price
appears 3 times. The page asks for an Erstgespräch having answered nothing about
cost, duration or process. It is a live-experiment page — the experiment is
title/H1/canonical/meta/anchors, so **adding a short "Ablauf und Kosten" block
does not touch an experiment variable**, but flag to the coordinator before
acting.

### CRO-03 — the homepage H1 the crawler sees is not the one desktop visitors see — **P1 / KNOWN / [BROWSER + STATIC]**
```
prerendered dist/index.html : "Digitale Systeme, die Unternehmen führen."
rendered  @390 (mobile)     : "Digitale Systeme, die Unternehmen führen."
rendered  @1440 (desktop)   : "Erreichbar, wenn niemand frei ist. Auch nachts. Auch samstags."
```
`src/components/HeroSection.tsx:13-17,43-48`: the server always renders
`MobileHero`; `DesktopHero` is `lazy()`-swapped in after mount above the
breakpoint. The comment shows this is intentional for hydration safety — the
mechanism is fine. The **content choice** is the problem: the version Google
indexes *and* every phone visitor reads is the abstract one ("Digitale Systeme,
die Unternehmen führen"), while the concrete, benefit-led, objection-answering
one ("Erreichbar, wenn niemand frei ist. Auch nachts. Auch samstags.") is shown
only to desktop. Given that mobile is the majority of this traffic and the
crawler sees the weaker line, the two should be brought closer — the desktop
line is the better one.

This is the **homepage**, which is **not** in the live-experiment set (PRs
#50–#56 cover `/bayreuth/*`, `/regensburg/*`, `/muenchen/*`,
`/ki-telefonassistent-arzt`, `/kosten-ki-telefonassistent`), so it is safe to
change. This is distinct from the known `prerender.mjs` metadata drift: that is
`<title>`/description overwriting; this is **body H1 divergence by viewport**.

---

## 9. What is already GOOD — do not "fix" these

1. **CLS = 0.0000** on `/`, `/kontakt`, `/ki-telefonassistent-arzt`, `/praxen`
   [BROWSER]. Fixed consent banner, no layout-shifting embeds, no webfont FOUT.
2. **No theme flash, and no dark-mode contrast surface on public pages.** The
   blocking inline script at `index.html:16` resolves the theme before first
   paint and is regression-tested (`publicTheme.test.ts`). Verified by launching
   Chromium with `colorScheme:'dark'` — public pages stay light.
3. **Spline is correctly desktop-only.** A 2.0 MB chunk and its third-party
   scene fetch are entirely absent at 390 px [BROWSER, `net.mjs`]. This is the
   single best performance decision in the codebase.
4. **The desktop dropdown navigation is a properly built keyboard menu** —
   `aria-expanded`/`aria-controls`/`aria-haspopup` (`Navigation.tsx:329-331`),
   tablist/tab/tabpanel with `aria-selected` (`:391-440`), Escape-to-close with
   focus return (`:142-147`). Its header comment documents the bug it was built
   to fix. Use it as the model for the mobile sheet (A11Y-05).
5. **Heading structure is clean** — exactly one `<h1>` per page and **zero**
   skipped heading levels across all six pages checked, at 15–49 headings each.
6. **No dead-end pages.** Every public HTML file in `dist/` carries ≥2
   `/kontakt` links plus a footer phone number.
7. **Decorative icons are correctly hidden** (`aria-hidden="true"` throughout
   `Navigation.tsx` and `premium-mobile-nav.tsx`); `lang="de"` everywhere;
   no invalid ARIA roles anywhere.
8. **`PraxisRechnerWidget` is accessible** — all six controls have real `id` +
   `label[for]` [BROWSER]. It is the in-repo template for fixing `ROICalculator`.
9. **The submit-failure path is excellent.** `ContactSection.tsx:373-410` checks
   `res.ok`, preserves the visitor's data, and surfaces a `role="alert"` with
   phone and email fallbacks. The comment documents the earlier bug where a
   `finally` block sent failed submissions to the thank-you page. Genuinely good
   engineering, and rarer than it should be.
10. **The success state works** — verified end-to-end to `/anfrage-erhalten`.
11. **The three KI pages answer price, setup, term, cancellation and trial
    before the CTA.** That is above the norm for this category.
12. **CTA copy is mostly specific and correctly low-commitment**
    ("Unverbindliches Erstgespräch vereinbaren", "Kostenloses Erstgespräch").
    Only `Mehr erfahren → /kontakt` needs changing.

---

## 10. Suggested order of work

1. **CRO-01** — shrink the consent banner and unblock the mobile nav. One
   component, every route, and it is currently suppressing every mobile
   conversion on the site.
2. **A11Y-01 + A11Y-02 + A11Y-03 + A11Y-04** — one focused pass over
   `ContactSection.tsx`: wrap in `<form>`, add `id`/`htmlFor`, drop `ring-0`,
   add a `role="alert"` error region. ~40 lines, fixes four P0/P1 violations on
   the only page that produces revenue.
3. **CRO-02** — add mid-page CTAs to `/kosten-ki-telefonassistent`.
4. **A11Y-06** — six `<main>` → `<div>` edits across the page templates.
5. **MOB-01** — contain the nav-pill glow; kill the 49–63 px overflow.
6. **CRO-04** — make `Branche` and `Startzeitraum` optional.
7. **A11Y-05** — make the mobile sheet a real dialog.
8. **A11Y-07 / A11Y-08 / A11Y-09 / A11Y-10 / A11Y-11** — the remaining a11y set.
9. **OBJ-01 / OBJ-02** — after `OWNER-INPUT.md` is answered; OBJ-01 needs
   owner-verified facts about escalation behaviour and must not be invented.
