# C — Information Architecture & Internal Linking Audit
Cogniiq (cogniiq.de) · branch `claude/cogniiq-website-audit-rswgrv` @ 7d9c532
Evidence base: `dist/` (91 of 91 public routes rendered, 93 HTML files incl. `404.html` + `app-shell.html`),
`src/lib/routing/publicRoutes.ts`, `src/lib/navigation-data.ts`, `src/components/Navigation.tsx`,
`src/components/Footer.tsx`, `src/components/CityServiceRoute.tsx`, `src/lib/standorte-data.ts`.
Method: scratchpad script `linkgraph.py` parses each prerendered document into `<nav>` / `<main>` / `<footer>`
segments and counts internal `<a href>` per segment. Nothing in the repo was modified.

---

## SUMMARY

The site is **not a hierarchy. It is a 91-node near-complete graph.** One hardcoded footer
sitemap carrying **91–95 internal links** is inlined into **every one of the 91 prerendered
documents**, so 77 of 91 routes sit at crawl-depth 1 and every page passes roughly the same
signal to every other page. The pillar → cluster structure that `navigation-data.ts` was
explicitly designed to express (its own header comment describes "schrittweise Offenlegung")
**does not exist in the crawled HTML at all**: the two mega-menu panels are React state-gated
and render as `<button aria-expanded="false">` with no children, so the entire main navigation
contributes exactly **4 crawlable links** (`/`, `/ueber-uns`, `/app/login`, `/kontakt`).

Consequence: internal authority is distributed almost uniformly, and where it *is* differentiated
it is differentiated **backwards**. The `/webdesign` pillar (1,696 impressions, position 76 — the
site's single largest non-branded impression pool) receives **1 in-content inbound link**, from
`/prozessautomatisierung`, which is itself an in-content orphan. Its own three city children each
receive 36–37. The pillar is a pure link donor: 35 out, 1 in.

**Already healthy** — say so plainly: 91/91 routes prerender, zero broken internal links, zero
`<a>` pointing outside the known route set, only `/anfrage-erhalten` is unreachable (correct — it
is `noindex` + robots-Disallow), CI enforces bidirectional App.tsx ↔ publicRoutes parity, the 9
city × service configs are test-asserted against their route list, and titles/H1s are unique
strings on all 91 routes (no literal duplicates).

### The eight findings

| ID | Title | Confidence | Sev |
|---|---|---|---|
| C1 | Main navigation contributes 4 crawlable links; the designed hierarchy is client-only | KNOWN | **P0** |
| C2 | 91-link footer on all 91 pages flattens the graph to a mesh; hierarchy is unreadable | KNOWN | **P0** |
| C3 | Commercial-value vs internal-authority inversion (the mismatch list) | KNOWN | **P0** |
| C4 | Orphans and near-orphans: `/prozessautomatisierung`, `/webdesign`, `/integrationen`, the blog island | KNOWN | **P1** |
| C5 | Thin / redundant / low-information pages (full table) | KNOWN | P1–P2 |
| C6 | Nine NEW duplicated-intent groups beyond the two already known | KNOWN | **P1** |
| C7 | `/faq` ships 96 visible words: all 8 answers are missing from the prerendered HTML | KNOWN | P2 |
| C8 | City × service matrix can grow; parity is guarded, page *count* is not | LIKELY | P2 |

---

## ROUTE INVENTORY — 91 routes, 14 families

Derived from `src/lib/routing/publicRoutes.ts` (`grep -c 'path: "'` → 91; 90 indexable + 1 noindex).

| Family | n | Routes |
|---|---|---|
| homepage | 1 | `/` |
| pillar | 5 | `/ki-telefonassistent`, `/webdesign`, `/prozessautomatisierung`, `/praxen`, `/automatisierung-unternehmen` |
| national | 2 | `/ki-agentur-deutschland`, `/webdesign-agentur-deutschland` |
| core | 8 | `/leistungen`, `/kontakt`, `/ueber-uns`, `/faq`, `/referenzen`, `/bewertungen`, `/integrationen`, `/datenschutz-sicherheit` |
| geo hub | 5 | `/deutschland`, `/bayern`, `/bayreuth`, `/muenchen`, `/regensburg` |
| geo × service | 1 | `/bayern/ki-telefonassistent` |
| city × service | 9 | `/{bayreuth,muenchen,regensburg}/{webdesign,ki-telefonassistent,automatisierung}` |
| cluster (city × topic) | 15 | `/{bayreuth,muenchen,regensburg}/{webdesign-kosten,website-erstellen,landingpage,website-relaunch,lokales-seo}` |
| industry | 13 | `/webdesign-{gastronomie,arzt,immobilien,hotel,sport}`, `/ki-telefonassistent-{arzt,restaurant,hotel,praxis}`, `/automatisierung-{restaurant,arzt,immobilien,sport}` |
| industry × city | 9 | `/webdesign-{arzt,gastronomie,immobilien}-{bayreuth,muenchen,regensburg}` |
| cost | 3 | `/kosten-webdesign`, `/kosten-ki-telefonassistent`, `/kosten-automatisierung` |
| problem | 5 | `/verpasste-anrufe-verlust`, `/keine-anfragen-website`, `/keine-terminbuchung-online`, `/zu-viel-manuelle-arbeit`, `/digitale-automatisierung-unternehmen` |
| blog | 11 | `/blog` + 10 posts |
| legal / demo / confirm | 4 | `/impressum`, `/datenschutz`, `/ki-telefonassistent/demo`, `/anfrage-erhalten` |

Note: `/webdesign-agentur-deutschland` was placed under *national* by intent; the script's regex
classed it under *industry*. Cosmetic only — no count elsewhere depends on it.

---

## C1 — Main navigation contributes 4 crawlable links (KNOWN, P0)

**Evidence.** In every prerendered document the `<nav>` element contains 2 `<button>` and 4 `<a>`:

```
dist/index.html  <nav …>  buttons=2  links=['/', '/ueber-uns', '/app/login', '/kontakt']
<button type="button" … aria-expanded="false" aria-controls="nav-panel-leistungen" aria-haspopup="true">
<button type="button" … aria-expanded="false" aria-controls="nav-panel-standorte" aria-haspopup="true">
```

`src/components/Navigation.tsx:60` holds `const [activeMenu, setActiveMenu] = useState<string | null>(null)`
and the panels are conditionally rendered from it (`:205 onOpen={() => openMenu('leistungen')}`,
`:215 …'standorte'`). SSR runs with `activeMenu === null`, so `nav-panel-leistungen` and
`nav-panel-standorte` are **never emitted**.

The 21 destinations declared in `src/lib/navigation-data.ts` — the 3 `LEISTUNGEN` hubs, their
12 `nischen`, 4 `abschluss` entries, `LEISTUNGEN_AUSWEG`, and the 5 `STANDORTE` — reach a crawler
**only via the footer**, where they are indistinguishable from the other ~85 footer links.

**Why this matters.** Header navigation is the strongest site-wide hierarchy signal available.
The file's own comment block claims the restructure preserved linking because "der Footer trägt
eine vollständige Sitemap mit 77 Verweisen". That is true for *reachability* and false for
*prominence*: what the redesign actually did was move 21 deliberately-ranked links into an
undifferentiated 91-link block. `/praxen` — the top nav slot for the priority audience, per the
comment at `navigation-data.ts:60-63` — gets no header link in crawled HTML at all.

Blast radius: all 91 documents. Fix: render both panels in markup and hide with CSS/`hidden`
rather than conditional mounting (the toggle already sets `aria-expanded`, so the a11y contract
is unchanged). Risk: low; panel markup is ~21 anchors, no layout impact when `hidden`.
Live-experiment overlap: **none** — no title, H1, canonical, meta or experiment anchor text is touched.

---

## C2 — The 91-link footer flattens the graph to a mesh (KNOWN, P0)

**Evidence.** Measured footer link counts across all 91 documents: **{91, 92, 93, 94, 95}** internal
links per page. Inbound footer counts: 68 routes are linked from 90 pages, 6 routes from 90 pages
twice, 4 routes three times, 13 routes not at all. Source is a hardcoded four-column sitemap in
`src/components/Footer.tsx` (groups at `:187, :200, :215, :225, :238, :254, :267, :276, :285, :299,
:312, :325, :345, :358, :368`) plus a prose paragraph at `:397–409` adding 10 more anchors.

**Resulting depth distribution (all link types, BFS from `/`):**

| depth | routes |
|---|---|
| 0 | 1 |
| **1** | **77** |
| 2 | 11 (`/datenschutz-sicherheit` + all 10 blog posts) |
| 3 | 1 (`/integrationen`) |
| ∞ | 1 (`/anfrage-erhalten` — correct, noindex) |

**Same BFS following only in-content (`<main>`) links:**

| depth | routes |
|---|---|
| 0 | 1 |
| 1 | 27 |
| 2 | 33 |
| 3 | 11 |
| 4 | 4 |
| **∞** | **15** |

The two distributions are the finding. Structurally the site *does* have a shape — a sane 0→4
in-content hierarchy — but the footer overwrites it with a flat plane before a crawler can read
it. 84 of the 91 routes are linked from the homepage's own `<main>`, which compounds it.

Duplicated footer anchors (same target twice or three times in one footer): `/` ×3,
`/webdesign-agentur-deutschland` ×3, `/ki-agentur-deutschland` ×3, `/automatisierung-unternehmen` ×3,
`/leistungen` ×2, `/kontakt` ×2, `/ki-telefonassistent` ×2, `/bayreuth` ×2, `/muenchen` ×2, `/regensburg` ×2.
These ten routes are the only ones the footer weights at all, and the weighting does not match
the commercial priorities in C3.

Fix (owner decision, not a mechanical one): reduce the site-wide footer to a small constant set
(legal, contact, the 3–5 pillars) and move the exhaustive sitemap to contextual in-content link
blocks on the relevant hub. Risk: **material** — this changes reachability for many routes and must
be paired with C1 and with contextual links first, never shipped alone. Live-experiment overlap: none.

---

## C3 — Commercial value vs internal authority: the mismatch list (KNOWN, P0)

"inC" = distinct pages linking to the route from inside `<main>` — the only inbound number that
carries differentiated weight, since footer inbound is 90 for almost everything.

### Under-linked relative to commercial value

| Route | inC | in-content depth | Commercial value | Comparison that makes it a mismatch |
|---|---|---|---|---|
| `/webdesign` | **1** | ∞ | Highest non-branded impression pool on the site (1,696 imp, pos 76) | Its own children `/bayreuth/webdesign` 37, `/muenchen/webdesign` 36, `/regensburg/webdesign` 36 |
| `/prozessautomatisierung` | **0** | ∞ | Service pillar #3 | Sibling pillar `/automatisierung-unternehmen` 22 |
| `/kosten-webdesign` | 15 | 2 | Explicit high-intent cost query | `/kontakt` 168, `/leistungen` 91 |
| `/kosten-automatisierung` | 15 | 2 | Explicit high-intent cost query | idem |
| `/kosten-ki-telefonassistent` | 18 | 2 | Live experiment; highest-intent query in the priority family | `/verpasste-anrufe-verlust` (a top-of-funnel problem page) also 32 |
| `/ki-telefonassistent-arzt` | 15 | 2 | **The stated #1 target** (medical practices) | `/bayern` 69 — a geo hub with no commercial intent — has 4.6× more |
| `/ki-telefonassistent-praxis` | 8 | 2 | Same target family | half of `/ki-telefonassistent-arzt`, though 68% the same text |
| `/praxen` | 24 | 2 | Designated top-nav entry for the priority audience | fewer than `/bayreuth` (25), a 106-word hub |
| `/bayreuth/website-relaunch` | 6 | 3 | Live experiment | linked only by the 4 Bayreuth cluster siblings + `/webdesign` + `/webdesign-agentur-deutschland` |
| `/regensburg/website-relaunch` | 7 | 1 | Live experiment | best of the three, and only because `/` and `/regensburg` link it |
| `/muenchen/website-relaunch` | 5 | 3 | Live experiment | no link from `/` or `/muenchen` |
| `/muenchen/webdesign-kosten` | 6 | 2 | Live experiment | vs `/bayern` 69 |
| `/integrationen` | **1** | 3 | Objection-handling asset for the priority buyer | linked only from `/datenschutz-sicherheit` |
| `/datenschutz-sicherheit` | 7 | 2 | The decisive objection for medical practices (GDPR) | vs `/bayern` 69 |

### Over-linked relative to commercial value

| Route | inC | Words | Why it is over-weighted |
|---|---|---|---|
| `/bayern` | **69** | 1,375 | Second-most-linked page on the site. A regional hub with no transactional intent outranks every cost page, every industry page, and the entire practice family in internal authority. |
| `/kontakt` | 168 | 389 | Expected for a CTA; noted only so it is excluded from comparisons. |
| `/leistungen` | 91 | 686 | Generic service index absorbing more than any individual service. |
| `/verpasste-anrufe-verlust` | 32 | 320 | 320-word top-of-funnel page tied with the `/ki-telefonassistent` pillar (32) and above every cost page. |
| `/bayreuth` `/muenchen` `/regensburg` | 25 / 24 / 24 | 106 / 104 / 124 | Three ~110-word routing stubs each carry more internal authority than `/kosten-webdesign` (15) or `/ki-telefonassistent-arzt` (15). |
| `/zu-viel-manuelle-arbeit` | 23 | 302 | 302-word problem page above every cost page. |

**One-sentence statement of the mismatch:** internal authority currently tracks *geography and
funnel-top problem framing*; commercial value sits in *service pillars, cost pages, and the medical
practice family*. The two rankings barely correlate.

Fix: rebalance in-content links — the four pillars and three cost pages should each carry
in-content inbound ≥ their own children, and `/bayern`'s 69 inbound is the budget to redistribute.
Risk: low if done as additive contextual links first. Live-experiment overlap: **the experiment
pages are net beneficiaries here — adding inbound links to them changes no title/H1/canonical and
no experiment-specific anchor text**, but any new anchor pointing at one of the seven experiment
URLs should reuse wording already present elsewhere rather than inventing a variant.

---

## C4 — Orphans and near-orphans (KNOWN, P1)

**True in-content orphans (0 links from any `<main>` anywhere on the site):**

| Route | inFooter | Verdict |
|---|---|---|
| `/prozessautomatisierung` | yes | **Footer-only pillar.** 292 words. Zero in-content inbound. Yet it is the *sole* in-content link source for `/webdesign`. |
| `/impressum` | yes (bottom bar) | Correct and expected. |
| `/anfrage-erhalten` | no | Correct — `indexable: false` (`publicRoutes.ts:814`), robots-Disallow. |

**Near-orphans (exactly 1 in-content inbound):**

| Route | Sole in-content source | Anchor text |
|---|---|---|
| `/webdesign` | `/prozessautomatisierung` (itself an orphan) | "Webdesign" |
| `/integrationen` | `/datenschutz-sicherheit` | "Was nach einem Anruf mit dem Ergebnis passiert" |
| `/faq` | one page | — |
| `/bewertungen` | one page | — |
| `/ueber-uns` | one page (plus header nav) | — |
| `/blog/webdesign-agentur-auswahl` | `/blog` only | — |

**`/webdesign` — precise quantification of the prior audit's claim.** Confirmed and worse than
stated. Exactly **one** in-content inbound link, from `/prozessautomatisierung`, which has zero
in-content inbound of its own. So `/webdesign` is at in-content depth ∞ — **no path of in-content
links reaches it from the homepage.** It is reachable only through the footer. Meanwhile it emits
**35** in-content outbound links, including to all three of its own city children and to
`/kosten-webdesign`. It is a pure donor. Its three city children receive 36–37 in-content inbound each.

**The blog island.** `/blog` shows 20 in-content inbound — **all 20 come from the 10 blog posts
themselves** (each post links "Blog" and "Alle Artikel"). No page outside `/blog/*` links into the
blog from `<main>`. The footer does not link any individual post (all 10 posts are in the
zero-footer-inbound set). So: `/blog` is footer-reachable (depth 1), the 10 posts are reachable
only through `/blog` (depth 2), and the whole subtree is in-content-unreachable from `/`. 10 posts
× ~490–658 words are producing zero internal support for the money pages and receiving none.

**Routes at in-content depth ≥ 4:** `/bewertungen`, `/bayreuth/landingpage`, `/bayreuth/lokales-seo`,
`/bayreuth/webdesign-kosten` (depth 4). Note Bayreuth — the company's own headquarters
(`navigation-data.ts:121 HAUPTSITZ_SLUG = "/bayreuth"`) — has the *deepest* cluster pages of the
three cities; Regensburg's equivalents sit at depth 2.

Fix: link the three service pillars from `/leistungen` and `/` in-content; link `/webdesign` from
each of its nine child pages (they already link up to `/kosten-webdesign`, so the pattern exists);
surface 2–3 relevant blog posts in-content on the matching pillar. Risk: low.
Live-experiment overlap: none.

---

## C5 — Thin / redundant / low-information pages (KNOWN, P1–P2)

Method: visible text = `<main>` with `<script>`/`<style>`/`<svg>` removed, tags stripped.
`uniq%` = share of a page's 8-word shingles that appear on **no** sibling page in the same family
(100% = fully distinctive within its family; 32% = two thirds of the text is verbatim sibling text).

**Flagged for owner review only. No deletion or redirect is proposed anywhere in this section.**

### THIN (visible text < 350 words)

| Route | words | uniq% | inC | Evidence / verdict |
|---|---|---|---|---|
| `/faq` | **96** | 100 | 1 | 8 questions render, **0 answers** — see C7. Also has **no `<h1>`** in `<main>`. THIN + defect. |
| `/muenchen` | 104 | 92.8 | 24 | Pure routing stub. LOW-INFORMATION (defensible as a hub, not as a "Webdesign München" ranking asset). |
| `/bayreuth` | 106 | 89.9 | 25 | idem — and this is the HQ city. |
| `/regensburg` | 124 | 89.7 | 24 | idem. |
| `/bewertungen` | 145 | 100 | 1 | THIN. Near-orphan. Overlaps `/referenzen` in purpose. |
| `/ki-telefonassistent/demo` | 184 | 100 | 3 | THIN. Interactive demo — likely client-rendered; low crawlable substance is expected, flag as acceptable-thin. |
| `/referenzen` | 233 | 100 | 4 | THIN. |
| `/keine-terminbuchung-online` | 288 | 90.7 | 18 | THIN but well-linked — receives more internal authority than any cost page. |
| `/prozessautomatisierung` | **292** | 95.8 | **0** | THIN **and** orphan **and** duplicating `/automatisierung-unternehmen` (887w) in intent. The clearest single flag on the site. |
| `/zu-viel-manuelle-arbeit` | 302 | 91.1 | 23 | THIN. |
| `/digitale-automatisierung-unternehmen` | 309 | 91.4 | 3 | THIN + near-orphan. |
| `/verpasste-anrufe-verlust` | 320 | 91.7 | 32 | THIN, yet 4th-most-linked page on the site. |
| `/keine-anfragen-website` | 351 | 92.4 | 19 | THIN. Title is verbatim the H1 of `/blog/website-ohne-anfragen` — see C6-D. |
| `/webdesign` | **369** | 97.8 | **1** | THIN **and** near-orphan **and** the highest-impression non-branded URL. Three problems on one route. |

### REDUNDANT (< 70% unique within family — majority of text is verbatim sibling text)

| Route | words | uniq% | Pair evidence |
|---|---|---|---|
| `/ki-telefonassistent-praxis` | 2,011 | **31.9** | **68.1%** of its 8-word shingles also appear on `/ki-telefonassistent-arzt` |
| `/ki-telefonassistent-arzt` | 2,037 | **32.8** | same pair (live-experiment page — flag, do not touch) |
| `/ki-telefonassistent` | 3,049 | 48.1 | 51.9% shared with `/praxen` |
| `/webdesign-immobilien-bayreuth` | 972 | 51.4 | 42.4% shared with `/webdesign-immobilien-regensburg` |
| `/blog` | 464 | 52.3 | index page; overlap is post teasers — acceptable |
| `/webdesign-immobilien-regensburg` | 1,017 | 52.9 | idem |
| `/praxen` | 3,733 | 54.5 | 48.4% shared with `/ki-telefonassistent-arzt`; **62.3%** of `/praxen` shingles also on `/kosten-ki-telefonassistent` |
| `/regensburg/ki-telefonassistent` | 1,711 | 61.7 | 31.2% pairwise with `/bayreuth/ki-telefonassistent` |
| `/webdesign-immobilien-muenchen` | 1,011 | 62.4 | |
| `/regensburg/webdesign-kosten` | 645 | 62.9 | 33.6% pairwise with `/bayreuth/webdesign-kosten` |
| `/bayreuth/ki-telefonassistent` | 1,784 | 63.7 | |
| `/muenchen/ki-telefonassistent` | 1,689 | 64.7 | |
| `/bayreuth/webdesign-kosten` | 678 | 64.9 | |
| `/webdesign-gastronomie-muenchen` | 987 | 66.7 | |
| `/webdesign-gastronomie-regensburg` | 992 | 67.2 | |

### GOOD SUPPORTING PAGES (healthy — state this explicitly)

The **9 city × service** pages are the strongest family on the site: 1,095–1,784 words, and the
webdesign/automatisierung triplets are **84–88% unique** within family. Direct pairwise check:
`/bayreuth/webdesign` ↔ `/muenchen/webdesign` share only **10.2%** of shingles. These are genuinely
differentiated local pages, not spun templates, and they carry the site's highest in-content
inbound counts (28–37). Whatever authored them is the pattern worth reusing.

Also healthy: `/kosten-ki-telefonassistent` (2,356 words, 100% unique), `/ki-agentur-deutschland`
(940w, 100%), `/webdesign-agentur-deutschland` (963w, 99.8%), `/automatisierung-unternehmen`
(887w, 99.5%), `/bayern/ki-telefonassistent` (768w, 100%), `/datenschutz` (913w, 100%).
The 15 hand-written cluster pages are 76–93% unique — moderate templating, but each is an
individually authored `.tsx` (`src/pages/cluster/{city}/*.tsx`), not a generated matrix, and they
read as supporting pages rather than doorway pages.

**Would flag for owner review, and why:** `/prozessautomatisierung` (thin + orphan + duplicates
`/automatisierung-unternehmen`), `/webdesign` (thin + near-orphan + the site's biggest impression
pool — it needs *more* content, not less), `/ki-telefonassistent-praxis` vs `/ki-telefonassistent-arzt`
(68% identical, both ~2,000 words, both targeting medical practices), `/bewertungen` vs `/referenzen`
(145w and 233w, same trust purpose, one of them near-orphaned), `/digitale-automatisierung-unternehmen`
(309w, 3 inbound, overlapping three other automation routes), and `/faq` (96 crawlable words).

---

## C6 — Duplicated intent / cannibalization: nine NEW groups (KNOWN, P1)

Excluded as already known: the München pricing three-way and the Regensburg hub-vs-service split.
Groups below are derived from `dist` titles, H1s, and measured shingle overlap.

**C6-A — "KI-Telefonassistent Arztpraxis": FOUR routes, and this is the stated #1 commercial target.**
`/ki-telefonassistent-arzt` (T: "KI-Telefonassistent für Arztpraxen | Termine automatisch buchen"),
`/ki-telefonassistent-praxis` (T: "KI-Telefonassistent für medizinische Praxen"),
`/praxen` (T: "KI Telefonassistent für Praxen – Ihr Empfang"),
`/blog/ki-telefonassistent-arztpraxis` (H1: "KI-Telefonassistent für Arztpraxen: Weniger Stress…").
Measured: arzt↔praxis **68.1%**, praxen↔ki-telefonassistent **51.9%**, praxen↔arzt **48.4%**.
Four URLs, ~8,300 words, one query family, and the internal linking splits them 15 / 8 / 24 / 9.
**Severity P1 — this is the highest-value family on the site fighting itself.**
`/ki-telefonassistent-arzt` is a live experiment: flag only, propose no title/H1 change.

**C6-B — "Website bringt keine Anfragen": the title is the other page's H1, verbatim.**
`/keine-anfragen-website` `<title>` = *"Warum Ihre Website keine Anfragen bringt – und wie Sie das ändern | Cogniiq"*.
`/blog/website-ohne-anfragen` `<h1>` = *"Warum Ihre Website keine Anfragen bringt – und wie Sie das ändern"*.
Identical string, two URLs. Add `/blog/webdesign-konversion-tipps` ("Webdesign für mehr Anfragen") → 3-way.

**C6-C — "Verpasste Anrufe kosten".** `/verpasste-anrufe-verlust` (T: "Verpasste Anrufe kosten
täglich Umsatz") vs `/blog/verpasste-anrufe-kosten` (T: "Verpasste Anrufe Kosten berechnen").
Same head term, same modifier.

**C6-D — "Automatisierung für Unternehmen": four routes.** `/prozessautomatisierung`
(H1 "Manuelle Prozesse stoppen. KI übernimmt."), `/automatisierung-unternehmen`
(H1 "Automatisierung für Unternehmen – manuelle Prozesse ein für allemal lösen"),
`/digitale-automatisierung-unternehmen`, `/zu-viel-manuelle-arbeit`. Plus
`/blog/ki-automatisierung-kleine-unternehmen` and `/blog/digitalisierung-mittelstand` on the SMB
edge of the same intent. The orphaned pillar and the nav-designated pillar are the same page twice.

**C6-E — "Webdesign Agentur".** `/webdesign` (T: "Webdesign Agentur – Hochkonvertierende Websites
für Unternehmen") vs `/webdesign-agentur-deutschland` (T: "Webdesign Agentur Deutschland").
Text overlap only **1.1%**, so these are two distinct documents chasing one head term — and the
national page has 18 in-content inbound to the pillar's 1.
Add `/blog/webdesign-agentur-auswahl` ("Webdesign Agentur auswählen") → 3-way.

**C6-F — Webdesign cost: four routes.** `/kosten-webdesign` (H1 "Was kostet Webdesign?") vs
`/{bayreuth,muenchen,regensburg}/webdesign-kosten` (all three H1s: "Webdesign Kosten in {Stadt} –
Was kostet eine Website?"). The three city H1s are the same sentence with one token swapped.
Text overlap national↔city is **0.0%**, so the *content* is separate; the *intent* is not. The
München leg of this is the already-known finding — the national↔all-three shape is the extension.

**C6-G — "Lokales SEO": four routes.** `/blog/lokales-seo-unternehmen` ("Lokales SEO für
Unternehmen: Wie Sie in Google Maps und lokalen Suchen erscheinen") vs `/{city}/lokales-seo`
(three near-identical H1s, two of them literally "Lokales SEO in {Stadt} – Mehr Sichtbarkeit bei
Google"). The blog post is the only non-local one and it targets the generic head term.

**C6-H — Trust/social proof.** `/referenzen` (H1 "Digitale Systeme, die im Alltag funktionieren.")
vs `/bewertungen` (H1 "Bewertungen"). 233 and 145 words, same job, `/bewertungen` near-orphaned at
1 in-content inbound.

**C6-I — Industry × city vs industry.** `/webdesign-arzt` vs `/webdesign-arzt-{3 cities}` vs
`/praxen` vs `/ki-telefonassistent-arzt`. Text overlap `/webdesign-arzt` ↔ `/webdesign-arzt-bayreuth`
is **0.0%**, so no duplication problem — but note that six of the nine industry × city H1s begin
"Webdesign & KI-Telefonassistent für …", i.e. they hedge across **two** service intents in one H1.
Listed as LIKELY dilution rather than KNOWN cannibalization.

Fix for the group as a whole: an owner decision on which URL owns each intent, then internal
anchor text consolidated onto the winner. Risk: medium — this is a positioning decision, not a
mechanical one, and `.claude/COPY-BRIEF-2.md` Phase 0 gates anything touching pricing claims.
Live-experiment overlap: C6-A and C6-F touch `/ki-telefonassistent-arzt`, `/kosten-ki-telefonassistent`
and `/muenchen/webdesign-kosten`. **Flag only until the experiments have read out.**

---

## C7 — `/faq` ships 96 visible words; all 8 answers are missing (KNOWN, P2)

**Evidence.** `dist/faq.html` `<main>` visible text, complete:

> FAQ · Häufige Fragen. … 8 Antworten · Remote umsetzbar · Alle Fragen ansehen · 01 Was kostet ein
> Projekt mit euch? 02 Wie schnell könnt ihr starten? … 08 Wie läuft ein Projekt typischerweise ab?
> Noch eine offene Frage? … Frage stellen

Eight questions, zero answers, and **no `<h1>` element in `<main>` at all** (the H1 extraction
returned empty for `/faq` and for no other route). Mitigating: a valid `FAQPage` JSON-LD block
(2,415 bytes) *is* present in `dist/faq.html`, so the answers exist in structured data.

Blast radius: one route. Fix: render answers in the DOM (collapsed via CSS, not unmounted) and add
an `<h1>`. Risk: low. Live-experiment overlap: none.

---

## C8 — Route proliferation risk (LIKELY, P2)

**Where new combinations would be added.** Two different mechanisms, with different risk profiles:

1. **Data-driven — the 9 city × service pages.** `src/lib/standorte-data.ts:77
   `export const CITY_SERVICE_ROUTES: readonly string[]` feeds `src/App.tsx` (which registers the
   routes lazily) and `src/lib/standorte-service-configs.ts` supplies `CITY_SERVICE_CONFIGS`.
   `src/components/CityServiceRoute.tsx:11-24` maps route → config and throws if they disagree.
   **This is a real matrix.** Adding a 4th city is 3 new indexable URLs from one config edit;
   adding a 4th service is 3 more. A 6 × 4 grid would be 24 pages.
2. **Hand-written — the 15 cluster pages and 9 industry × city pages.** Each is its own file
   (`src/pages/cluster/{bayreuth,muenchen,regensburg}/*.tsx`,
   `src/pages/Webdesign{Arzt,Gastronomie,Immobilien}{Bayreuth,Muenchen,Regensburg}.tsx`) with an
   explicit `<Route>` in `src/App.tsx` (e.g. `:596`). Expensive to add — which is itself the
   guardrail, and it shows in the quality (84–93% unique text).

**Guardrails that exist (healthy):** `src/lib/standorte-data.test.ts` asserts `CITY_SERVICE_ROUTES`
matches `CITY_SERVICE_CONFIGS`; `.github/scripts/test-seo-consistency.mjs` enforces App.tsx ↔
`publicRoutes.ts` parity **bidirectionally** (documented at `publicRoutes.ts:16-19`), so a new route
cannot ship without a title, description and sitemap entry. `CityServiceRoute.tsx:22` throws rather
than emitting an empty indexable page.

**Guardrail that does not exist:** nothing caps or reviews the *number* of pages, the ratio of
generated to hand-written pages, or the minimum word count / uniqueness of a new page. Every
existing check is a consistency check. Given that the mesh (C2) means each new page dilutes all 91
existing ones, and that the current site already carries 14 routes under 370 words, this is the
mechanism by which the situation gets worse.

Fix: add a CI assertion in the existing `.github/scripts/` suite — minimum rendered word count and
maximum intra-family shingle overlap for any new prerendered route. Risk: low, additive test only.
Live-experiment overlap: none.

---

## FULL DATA TABLE — all 91 routes

`inC` = distinct pages linking from `<main>`. `inFoot` = footer anchors per page (1 = once on every
page, 2/3 = duplicated in the footer). `inNav` = present in the 4-link crawlable header.
`out(main)` = in-content outbound. Depths are BFS from `/`; ∞ = unreachable by that link class.

| route | family | inC | inFoot | inNav | out(main) | depth(content) | depth(all) | words | uniq% |
|---|---|---|---|---|---|---|---|---|---|
| `/` | homepage | 84 | 3 | Y | 84 | 0 | 0 | 2398 | 100.0 |
| `/leistungen` | core | 91 | 2 | - | 54 | 1 | 1 | 686 | 93.8 |
| `/kontakt` | core | 168 | 2 | Y | 15 | 1 | 1 | 389 | 100.0 |
| `/ueber-uns` | core | 1 | 1 | Y | 30 | 1 | 1 | 595 | 92.6 |
| `/faq` | core | 1 | 1 | - | 2 | 1 | 1 | 96 | 100.0 |
| `/referenzen` | core | 4 | 1 | - | 4 | 3 | 1 | 233 | 100.0 |
| `/bewertungen` | core | 1 | 1 | - | 3 | 4 | 1 | 145 | 100.0 |
| `/praxen` | pillar | 24 | 1 | - | 11 | 2 | 1 | 3733 | 54.5 |
| `/integrationen` | core | 1 | 0 | - | 6 | 3 | 3 | 646 | 97.3 |
| `/datenschutz-sicherheit` | core | 7 | 0 | - | 7 | 2 | 2 | 839 | 97.8 |
| `/ki-telefonassistent` | pillar | 32 | 2 | - | 21 | 1 | 1 | 3049 | 48.1 |
| `/webdesign` | pillar | 1 | 1 | - | 35 | ∞ | 1 | 369 | 97.8 |
| `/prozessautomatisierung` | pillar | 0 | 1 | - | 16 | ∞ | 1 | 292 | 95.8 |
| `/webdesign-agentur-deutschland` | industry | 18 | 3 | - | 26 | 2 | 1 | 963 | 99.8 |
| `/ki-agentur-deutschland` | national | 20 | 3 | - | 27 | 2 | 1 | 940 | 100.0 |
| `/automatisierung-unternehmen` | pillar | 22 | 3 | - | 25 | 2 | 1 | 887 | 99.5 |
| `/ki-telefonassistent/demo` | demo | 3 | 1 | - | 2 | 2 | 1 | 184 | 100.0 |
| `/deutschland` | geo-hub | 21 | 1 | - | 29 | 1 | 1 | 1233 | 92.1 |
| `/bayern` | geo-hub | 69 | 1 | - | 25 | 2 | 1 | 1375 | 93.4 |
| `/bayern/ki-telefonassistent` | geo-service | 6 | 1 | - | 11 | 2 | 1 | 768 | 100.0 |
| `/bayreuth` | geo-hub | 25 | 2 | - | 13 | 1 | 1 | 106 | 89.9 |
| `/muenchen` | geo-hub | 24 | 2 | - | 13 | 1 | 1 | 104 | 92.8 |
| `/regensburg` | geo-hub | 24 | 2 | - | 14 | 1 | 1 | 124 | 89.7 |
| `/bayreuth/webdesign` | city-service | 37 | 1 | - | 37 | 1 | 1 | 1264 | 87.4 |
| `/bayreuth/ki-telefonassistent` | city-service | 29 | 1 | - | 40 | 1 | 1 | 1784 | 63.7 |
| `/bayreuth/automatisierung` | city-service | 29 | 1 | - | 36 | 1 | 1 | 1279 | 87.8 |
| `/bayreuth/webdesign-kosten` | cluster | 5 | 1 | - | 17 | 4 | 1 | 678 | 64.9 |
| `/bayreuth/website-erstellen` | cluster | 6 | 1 | - | 14 | 3 | 1 | 540 | 86.1 |
| `/bayreuth/landingpage` | cluster | 5 | 1 | - | 14 | 4 | 1 | 436 | 83.2 |
| `/bayreuth/website-relaunch` | cluster | 6 | 1 | - | 14 | 3 | 1 | 546 | 89.4 |
| `/bayreuth/lokales-seo` | cluster | 5 | 1 | - | 14 | 4 | 1 | 525 | 78.6 |
| `/muenchen/webdesign` | city-service | 36 | 1 | - | 38 | 1 | 1 | 1151 | 84.0 |
| `/muenchen/ki-telefonassistent` | city-service | 28 | 1 | - | 40 | 1 | 1 | 1689 | 64.7 |
| `/muenchen/automatisierung` | city-service | 28 | 1 | - | 36 | 1 | 1 | 1139 | 85.0 |
| `/muenchen/webdesign-kosten` | cluster | 6 | 1 | - | 17 | 2 | 1 | 674 | 84.8 |
| `/muenchen/website-erstellen` | cluster | 6 | 1 | - | 14 | 3 | 1 | 530 | 89.3 |
| `/muenchen/landingpage` | cluster | 5 | 1 | - | 14 | 3 | 1 | 450 | 87.4 |
| `/muenchen/website-relaunch` | cluster | 5 | 1 | - | 14 | 3 | 1 | 542 | 91.6 |
| `/muenchen/lokales-seo` | cluster | 5 | 1 | - | 14 | 3 | 1 | 524 | 92.5 |
| `/regensburg/webdesign` | city-service | 36 | 1 | - | 37 | 1 | 1 | 1169 | 85.3 |
| `/regensburg/ki-telefonassistent` | city-service | 28 | 1 | - | 40 | 1 | 1 | 1711 | 61.7 |
| `/regensburg/automatisierung` | city-service | 28 | 1 | - | 36 | 1 | 1 | 1095 | 84.7 |
| `/regensburg/webdesign-kosten` | cluster | 5 | 1 | - | 17 | 2 | 1 | 645 | 62.9 |
| `/regensburg/website-erstellen` | cluster | 5 | 1 | - | 14 | 2 | 1 | 528 | 83.3 |
| `/regensburg/landingpage` | cluster | 5 | 1 | - | 14 | 2 | 1 | 408 | 79.3 |
| `/regensburg/website-relaunch` | cluster | 7 | 1 | - | 14 | 1 | 1 | 490 | 88.2 |
| `/regensburg/lokales-seo` | cluster | 5 | 1 | - | 14 | 2 | 1 | 470 | 76.2 |
| `/webdesign-arzt-bayreuth` | industry-city | 8 | 1 | - | 22 | 2 | 1 | 1562 | 90.9 |
| `/webdesign-gastronomie-bayreuth` | industry-city | 7 | 1 | - | 22 | 2 | 1 | 999 | 73.1 |
| `/webdesign-immobilien-bayreuth` | industry-city | 7 | 1 | - | 22 | 2 | 1 | 972 | 51.4 |
| `/webdesign-arzt-muenchen` | industry-city | 6 | 1 | - | 20 | 2 | 1 | 698 | 78.3 |
| `/webdesign-gastronomie-muenchen` | industry-city | 7 | 1 | - | 22 | 2 | 1 | 987 | 66.7 |
| `/webdesign-immobilien-muenchen` | industry-city | 6 | 1 | - | 22 | 2 | 1 | 1011 | 62.4 |
| `/webdesign-arzt-regensburg` | industry-city | 6 | 1 | - | 22 | 2 | 1 | 1027 | 77.3 |
| `/webdesign-gastronomie-regensburg` | industry-city | 6 | 1 | - | 22 | 2 | 1 | 992 | 67.2 |
| `/webdesign-immobilien-regensburg` | industry-city | 7 | 1 | - | 22 | 2 | 1 | 1017 | 52.9 |
| `/webdesign-gastronomie` | industry | 11 | 1 | - | 19 | 2 | 1 | 649 | 79.5 |
| `/webdesign-arzt` | industry | 12 | 1 | - | 19 | 2 | 1 | 647 | 78.6 |
| `/webdesign-immobilien` | industry | 11 | 1 | - | 19 | 1 | 1 | 658 | 78.6 |
| `/webdesign-hotel` | industry | 10 | 1 | - | 19 | 2 | 1 | 685 | 79.7 |
| `/webdesign-sport` | industry | 5 | 1 | - | 19 | 3 | 1 | 693 | 79.8 |
| `/ki-telefonassistent-arzt` | industry | 15 | 1 | - | 27 | 1 | 1 | 2037 | 32.8 |
| `/ki-telefonassistent-restaurant` | industry | 10 | 1 | - | 19 | 1 | 1 | 726 | 79.1 |
| `/ki-telefonassistent-hotel` | industry | 8 | 1 | - | 18 | 2 | 1 | 717 | 77.9 |
| `/ki-telefonassistent-praxis` | industry | 8 | 1 | - | 27 | 1 | 1 | 2011 | 31.9 |
| `/automatisierung-restaurant` | industry | 13 | 1 | - | 19 | 2 | 1 | 619 | 76.7 |
| `/automatisierung-arzt` | industry | 14 | 1 | - | 19 | 2 | 1 | 599 | 76.9 |
| `/automatisierung-immobilien` | industry | 9 | 1 | - | 19 | 2 | 1 | 621 | 77.6 |
| `/automatisierung-sport` | industry | 4 | 1 | - | 19 | 3 | 1 | 605 | 77.3 |
| `/kosten-webdesign` | cost | 15 | 1 | - | 15 | 2 | 1 | 521 | 89.5 |
| `/kosten-ki-telefonassistent` | cost | 18 | 1 | - | 7 | 2 | 1 | 2356 | 100.0 |
| `/kosten-automatisierung` | cost | 15 | 1 | - | 14 | 2 | 1 | 489 | 88.8 |
| `/verpasste-anrufe-verlust` | problem | 32 | 1 | - | 11 | 1 | 1 | 320 | 91.7 |
| `/keine-anfragen-website` | problem | 19 | 1 | - | 10 | 1 | 1 | 351 | 92.4 |
| `/keine-terminbuchung-online` | problem | 18 | 1 | - | 11 | 2 | 1 | 288 | 90.7 |
| `/zu-viel-manuelle-arbeit` | problem | 23 | 1 | - | 11 | 1 | 1 | 302 | 91.1 |
| `/digitale-automatisierung-unternehmen` | problem | 3 | 1 | - | 10 | 1 | 1 | 309 | 91.4 |
| `/blog` | blog | 20 | 1 | - | 12 | ∞ | 1 | 464 | 52.3 |
| `/blog/ki-automatisierung-kleine-unternehmen` | blog | 17 | 0 | - | 11 | ∞ | 2 | 618 | 87.5 |
| `/blog/ki-telefonassistent-arztpraxis` | blog | 9 | 0 | - | 11 | ∞ | 2 | 568 | 86.2 |
| `/blog/webdesign-konversion-tipps` | blog | 11 | 0 | - | 11 | ∞ | 2 | 628 | 84.8 |
| `/blog/lokales-seo-unternehmen` | blog | 7 | 0 | - | 11 | ∞ | 2 | 658 | 84.6 |
| `/blog/prozessautomatisierung-roi` | blog | 5 | 0 | - | 11 | ∞ | 2 | 522 | 85.2 |
| `/blog/verpasste-anrufe-kosten` | blog | 5 | 0 | - | 11 | ∞ | 2 | 489 | 80.3 |
| `/blog/ki-telefonassistent-restaurant` | blog | 5 | 0 | - | 11 | ∞ | 2 | 486 | 82.1 |
| `/blog/website-ohne-anfragen` | blog | 7 | 0 | - | 11 | ∞ | 2 | 560 | 80.1 |
| `/blog/digitalisierung-mittelstand` | blog | 3 | 0 | - | 11 | ∞ | 2 | 562 | 88.9 |
| `/blog/webdesign-agentur-auswahl` | blog | 1 | 0 | - | 11 | ∞ | 2 | 558 | 82.5 |
| `/impressum` | legal | 0 | 1 | - | 0 | ∞ | 1 | 199 | 100.0 |
| `/datenschutz` | legal | 2 | 1 | - | 0 | 3 | 1 | 913 | 100.0 |
| `/anfrage-erhalten` | confirm | 0 | 0 | - | 1 | ∞ | ∞ | 24 | 100.0 |

---

## WHAT IS ALREADY HEALTHY (explicit)

1. **Rendering and reachability.** 91/91 public routes prerender to real HTML. Every internal `<a>`
   resolves to a known public route — zero broken internal links across 91 documents. Only
   `/anfrage-erhalten` is unreachable, which is correct (`indexable: false`, robots-Disallow).
2. **Route manifest discipline.** `publicRoutes.ts` is a genuinely authoritative single source with
   an enforced bidirectional parity guard against the runtime router. This is better than most sites
   of this size and it is why route coverage has no gaps to report.
3. **The 9 city × service pages.** 1,095–1,784 words, 84–88% unique for the webdesign/automatisierung
   triplets, 10.2% pairwise overlap between `/bayreuth/webdesign` and `/muenchen/webdesign`. Genuinely
   differentiated local pages, and the best-linked family on the site. Reuse this pattern.
4. **Unique titles and H1s.** No two of the 91 routes share a literal `<title>`, and no two share a
   literal H1. The cannibalization in C6 is semantic, not mechanical duplication.
5. **`/kosten-ki-telefonassistent`** — 2,356 words, 100% unique within family. The strongest
   commercial page on the site by content quality; it just needs more internal authority.
6. **Data-driven matrix has integrity checks.** Route/config drift throws at build rather than
   emitting an empty indexable page (`CityServiceRoute.tsx:22`).
7. **`/anfrage-erhalten` handling** — correctly excluded from nav, footer, sitemap, and index.

## PRIORITY ORDER FOR THE OWNER

1. **C1** — render the two nav panels in markup (smallest change, largest structural effect).
2. **C4/C3 for `/webdesign` and `/prozessautomatisierung`** — link the pillars in-content from their
   own children and from `/leistungen`. Purely additive, no experiment overlap.
3. **C3 rebalance** — move in-content link budget from `/bayern` toward the cost pages and the
   practice family.
4. **C2 footer reduction** — highest impact, highest risk; must follow 1–3, never precede them.
5. **C6-A** — the practice-family cannibalization decision, **after** the `/ki-telefonassistent-arzt`
   experiment reads out.
6. **C7, C8** — small, independent, safe at any time.
