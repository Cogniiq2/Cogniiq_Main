# E — TRUST / E-E-A-T AUDIT (Cogniiq)

Auditor: Trust/E-E-A-T specialist · Read-only · Evidence from `dist/` (93 HTML docs,
fresh build) and `src/`. Branch under audit: `claude/cogniiq-website-audit-rswgrv`.
No live-experiment page is proposed for rewording; overlaps are noted per finding.

---

## SUMMARY

**The honesty programme worked — and then hid its own best output.**

Cogniiq has produced two of the most credible B2B pages I have seen from a small
agency: `/integrationen` ("Eine fertige Standardanbindung … gibt es bei uns heute
nicht … sie wäre entweder leer oder unehrlich") and `/datenschutz-sicherheit`
("Diesen Satz schreiben wir nicht"). Both are **`noindex, nofollow`** and have
**1 and 7 internal inbound links** respectively. They were made noindex in commit
`e060c94` when they were empty scaffolds (COPY-GAPS.md §0); the scaffolds have
since been filled with owner-confirmed content and **nobody lifted the noindex**.
That single stale flag is the largest trust loss on the site, and reversing it is
free and involves no new claim.

Second theme: **the honesty pass covered the healthcare/telephone cluster and did
not reach the automation, webdesign-industry and blog surfaces.** Those surfaces
still assert named third-party integrations as "direkt unterstützt" — in indexable
`FAQPage` JSON-LD — while `/praxen` and `/integrationen` say the opposite on the
same domain. A sceptical buyer who reads two pages finds the contradiction.

Third theme: **there is not one photograph of a person, product or workplace in
any of the 93 rendered documents**, and no blog article carries a human author.
Two real, named, consenting founders exist; a photo of one already sits in the
repo unused. This is free E-E-A-T left on the table.

**Legal:** the Impressum is, on its face, complete for a German sole
proprietorship — every §5 DDG element I can check is present, §18(2) MStV is
present, and the discontinued EU-ODR link is correctly absent. One item is
genuinely UNCLEAR (whether the operator is a registered Kaufmann, which would
change the required firm name). **I am not giving legal advice; a lawyer's review
is the owner's call.**

**NAP:** effectively clean in the visible layer (one phone format, one address,
one email, everywhere). Two structured-data defects: the same `@id` is defined
with conflicting address completeness on 14 pages, and published opening hours
(Mo–Fr 09–18 in JSON-LD) contradict the published service window (täglich 6–20)
on `/praxen`.

### Findings by severity
| P | Count | IDs |
|---|---|---|
| P0 | 0 | — |
| P1 | 7 | E-01, E-02, E-03, E-04, E-05, E-06, E-07 |
| P2 | 6 | E-08 … E-13 |
| P3 | 5 | E-14 … E-18 |

### Ranked honest-credibility opportunities (trust gain per unit of effort)
| # | Move | Effort | Already on site? | Finding |
|---|---|---|---|---|
| 1 | Un-`noindex` + link `/integrationen` and `/datenschutz-sicherheit` | trivial | yes, buried + noindex | E-01 |
| 2 | Fix `/bewertungen` meta description so the SERP promise matches the honest page | trivial | no | E-04 |
| 3 | Put the two founders' real photos + differentiated bios on `/ueber-uns`; a photo already exists in `public/` | low | no (initials only) | E-05 |
| 4 | Name a human author on all 10 blog articles | low | no (`author: Organization`) | E-06 |
| 5 | Reconcile the named-integration claims with `/integrationen` | medium | contradiction live | E-02 |
| 6 | Promote the `/praxen` "Was unser Empfang nicht macht" limitations block to the other product lines | medium | healthcare only | E-09 |
| 7 | Publish a `sameAs` external corroboration set (Google Business Profile, LinkedIn) | low, owner-dependent | no (`sameAs: ["https://cogniiq.de"]`) | E-08 |
| 8 | Make the phone number and the 6–20 window a visible contact route, not only a footer line | low | partial | E-11 |

### What is already STRONG (do not touch)
- `/integrationen` and `/datenschutz-sicherheit` — best-in-class "what we do NOT
  do" pages. `dist/integrationen.html`: *"Wenn Ihre Bedingung lautet, dass Termine
  automatisch in Ihrem System stehen, sind wir heute nicht der richtige Anbieter.
  Das sagen wir lieber jetzt als nach der Unterschrift."*
- `/referenzen` — explains the *absence* of case studies instead of faking one:
  *"Wir haben sie entfernt, weil uns dafür keine schriftliche Freigabe des Kunden
  vorlag – unabhängig davon, wie gut das Projekt gelaufen ist."*
- `/bewertungen` body — *"Eine leere Seite ist uns lieber als eine geschönte."*
- `/praxen` — sourced statistics (vzbv Marktcheck 2025; GKV-Spitzenverband 2025),
  a real guarantee with a stated remedy (*"entfällt die zweite Hälfte der
  Einrichtungsgebühr"*), published price caps (500/800/1.400 €), a named person
  with hours, and an explicit seven-item limitations list. **This page is the
  standard the rest of the site should be measured against.**
- `/datenschutz` — names actual processors (Cloudflare, self-hosted n8n, Supabase,
  Resend, Google Ireland), the exact GA4 cookie `_ga_K7BS3LKT6H`, Consent Mode v2
  defaults, and states honestly that a third-country transfer *"kann nicht
  ausgeschlossen werden"*. Dated `2026-08-28`. Unusually specific and verifiable.
- The DSGVO FAQ answer is consistent across four independent pages and refuses the
  self-certification: *"Diesen Satz stellen wir uns nicht selbst aus — konform ist
  eine Verarbeitung, kein Produkt."*
- **Zero broken internal links** across all 93 documents (checked every `href="/…"`
  against the built route set).
- No lorem ipsum, no "coming soon", no stock-photo people, no logo wall, no fake
  counters, no `aggregateRating`/`Review` markup anywhere.
- NAP in the visible layer is uniform: `0160 1832917` in all 116 visible
  occurrences, `Am Main 3 / 95444 Bayreuth` and `info@cogniiq.de` everywhere.

---

## 1 · TRUST SURFACE INVENTORY — what a visitor actually learns

| Page | Rendered? | What the visitor learns |
|---|---|---|
| `/impressum` | yes | Cogniiq, Inhaber Lazar Popovic, Am Main 3, 95444 Bayreuth, Tel. 0160 1832917, info@cogniiq.de, USt-IdNr. DE460292419, §18(2) MStV = Lazar Popovic, no consumer-arbitration participation. |
| `/datenschutz` | yes | Full processor list, GA4/Ads consent architecture, rights, BayLDA, dated 2026-08-28. |
| `/agb` | **does not exist** | No terms page in the 93-document build (E-16). |
| `/ueber-uns` | yes | Founders named; three service pillars; four working principles; 4-step process; locations; six FAQ **questions with no answers in the HTML** (E-03). |
| `/kontakt` | yes | 3-step form (Name, E-Mail, Unternehmen, Branche, Startzeitraum all required), address, phone, e-mail, "Antwort in der Regel innerhalb von 24 Stunden". |
| `/referenzen` | yes | Method + an explicit statement that no client project is shown and why. No fabricated proof. |
| `/bewertungen` | yes | "Derzeit ist hier keine Kundenstimme veröffentlicht." + six things Cogniiq *can* guarantee. |
| `/praxen` | yes | The deepest, most substantiated page on the site (see STRONG, above). |
| `/integrationen` | yes but **noindex,nofollow**, 1 inbound link | Honest "no ready PVS integration" page. |
| `/datenschutz-sicherheit` | yes but **noindex,nofollow**, 7 inbound links | Honest "what we do not claim" DPO page. |
| `/ki-telefonassistent/demo` | yes | A lead form. No listenable or watchable demo (E-07). |

---

## FINDINGS

### E-01 — The two most credible pages on the site are `noindex, nofollow` and unlinked
**KNOWN · P1 · blast radius: whole-site credibility, all commercial queries**

Evidence:
```
dist/integrationen.html          <meta name="robots" content="noindex, nofollow">
dist/datenschutz-sicherheit.html <meta name="robots" content="noindex, nofollow">
```
Internal inbound links across the 93 built documents: `/integrationen` = **1 page**,
`/datenschutz-sicherheit` = **7 pages**. For comparison `/referenzen`, `/bewertungen`,
`/impressum`, `/praxen` = 92 pages each (footer).

Cause is documented and now stale — `COPY-GAPS.md:22-24`:
> "Routen `/praxen`, `/integrationen`, `/datenschutz-sicherheit` angelegt
> (`e060c94`); die beiden letzteren als **Grundgerüst ohne Fachaussagen und
> bewusst `noindex`**."

They are no longer scaffolds. `dist/integrationen.html` now carries the full
owner-confirmed answer to OWNER-INPUT B1/B3, and `dist/datenschutz-sicherheit.html`
carries the full §7.7 position. The `noindex` was a correct decision for empty
pages and is now suppressing the site's best evidence.

Fix (honest, no new claim): remove the noindex from `src/lib/routing/indexability.ts`
for these two routes, add them to the footer legal/trust column and to the
`/praxen`, `/ki-telefonassistent`, `/kontakt` bodies. Nothing is written; only
already-published, owner-confirmed text is made reachable.

Risk: none to honesty. Small SEO risk that thin pages get indexed — they are not
thin (both ~800+ words of substantive text).
Live-experiment overlap: none.

---

### E-02 — Named third-party integrations asserted as "direkt unterstützt" in indexable JSON-LD, contradicting `/integrationen` and `/praxen`
**KNOWN · P1 · blast radius: 8 rendered pages + `/leistungen` runtime FAQ + 2 blog articles**

The honesty pass reached the telephone-assistant/healthcare cluster. It did not
reach the automation and webdesign-industry FAQs, which still name vendors and
say the integration exists **today**. These sit in `FAQPage` structured data and
are therefore rich-result eligible.

Evidence, live in the delivered HTML:
```
dist/automatisierung-arzt.html (FAQPage JSON-LD)
  "Gängige Systeme wie Tomedo, Medistar, Dampsoft oder CGM werden direkt unterstützt."
  → src/pages/industries/AutomatisierungArzt.tsx:99

dist/automatisierung-sport.html
  "Wir integrieren gängige Fitness-Management-Systeme direkt: Magicline, Eversports,
   ClubDesk, PerfectGym u.v.m."
  → src/pages/industries/AutomatisierungSport.tsx:95

dist/automatisierung-unternehmen.html
  "Die meisten gängigen Business-Tools: HubSpot, Pipedrive, Salesforce, … und
   Hunderte weitere – über maßgeschneiderte Workflows und direkte API-Integrationen."
  → src/pages/pillars/AutomatisierungUnternehmen.tsx:141
```
Further instances: `AutomatisierungImmobilien.tsx:54,94` · `AutomatisierungRestaurant.tsx:98`
· `WebdesignImmobilien.tsx:53,99,107` · `WebdesignSport.tsx:95` ·
`ProzessautomatisierungHub.tsx:37` · `LeistungenPage.tsx:207` ("von Tomedo und CGM
über OnOffice und HubSpot bis zu Lightspeed und Magicline" — client-rendered, in
`assets/LeistungenPage-03wOimC2.js`, visible to a real visitor after hydration).

The same site says, on `dist/praxen.html`:
> "Eine fertige Standardanbindung an Praxisverwaltungssysteme gibt es heute nicht."

and on `dist/integrationen.html`:
> "Wir führen deshalb auch keine Liste unterstützter Systeme — sie wäre entweder
> leer oder unehrlich."

OWNER-INPUT B (summary table) records: *"**Keine fertige PVS-Standardanbindung** —
daraus folgt `FAKTEN.keineAnbindung`, die Seite `/integrationen` und die Streichung
aller PVS-Namen."* The streichung did not reach these files.

Classification of the claims themselves: **UNVERIFIABLE** for the automation
product (custom API work may genuinely be possible per client) — but
**self-contradictory as published**. Tomedo/Medistar/Dampsoft/CGM specifically are
the four names OWNER-INPUT B3 ordered removed.

Fix (honest options only): replace "werden direkt unterstützt" with the wording
already owner-approved on `/integrationen` — *"Vor der Einrichtung prüfen wir,
welche Schnittstelle Ihr System bietet … Das Ergebnis steht im Angebot, auch wenn
es negativ ausfällt."* Keep vendor names only if the owner confirms a working
integration exists for that specific product; otherwise drop the names.
Risk: losing a keyword surface for vendor-name queries. Accept — a contradiction a
prospect can find in two clicks costs more.
Live-experiment overlap: none (no experiment page is in this list).

---

### E-03 — `/ueber-uns` renders six FAQ questions and zero answers, and emits no FAQPage schema
**KNOWN · P1 · blast radius: the primary company/authority page**

Evidence — `dist/ueber-uns.html` contains the question text and nothing else:
```
"Sind die Systeme DSGVO-konform?</span>…aria-expanded="false"…
 …>Kann ich mit einem einzelnen Service starten?</span>
```
`grep -c "DSGVO" dist/ueber-uns.html` → **1** (the question only). The answers
exist in source (`src/pages/UeberUnsPage.tsx:240-260`) but the accordion renders
its panel only after a click, and unlike 69 other pages this one emits **no
FAQPage JSON-LD**.

Why this is a trust finding, not just SEO: the hidden answers are among the best
copy on the site — `UeberUnsPage.tsx:249-250` carries the full §7.7-compliant
DSGVO position. A crawler, an AI summariser, and a visitor scanning without
clicking all see six unanswered questions on the page that is supposed to
establish who Cogniiq is.

Fix: render the answers in the DOM (visually collapsed is fine — `hidden`/height,
not conditional render), and add the FAQPage schema `PageSEO` already supports.
Risk: none.

---

### E-04 — `/bewertungen` SERP snippet promises "echte Bewertungen"; the page has none
**KNOWN · P1 · blast radius: 1 page, but it is the review page**

Evidence:
```
src/lib/routing/publicRoutes.ts:111
  description: "Was Kunden über Cogniiq sagen: echte Bewertungen zu Webdesign,
  KI-Telefonassistenten und Automatisierung. Überzeugen Sie sich von unserer Arbeit."
```
Delivered verbatim in `dist/bewertungen.html`'s `<meta name="description">`.
The page body says:
> "Derzeit ist hier keine Kundenstimme veröffentlicht."

The body is exemplary; the metadata is a bait-and-switch against it. `<title>` is
also `Bewertungen & Kundenstimmen | Cogniiq AI-Agentur Bayern`.

This is exactly the failure mode HONESTY-AUDIT §7.1 documents: the component was
corrected, the manifest entry was not.

Fix: rewrite the description to match the page — e.g. state the publication policy
(written consent only) rather than promising reviews. Consider whether the page
should be `index` at all while empty; if it stays indexed, the snippet must not
promise content the page does not have.
Risk: none. Live-experiment overlap: none.

---

### E-05 — Zero photographs of anyone or anything, and two identical founder bios
**KNOWN · P1 · blast radius: whole site**

Evidence: across all 93 rendered documents there is **not one** `src="…png|jpg|webp"`
image reference (checked; the only external `src` is a Google Maps embed on two
pages). The `/ueber-uns` founder cards render the letters **"L"** and **"D"**.

The two founder bios are byte-identical apart from the swapped name
(`dist/ueber-uns.html`):
> "Gründer von Cogniiq. Arbeitet gemeinsam mit Djordje Popovic an Konzeption,
> Umsetzung und Betrieb der Kundenprojekte…"
> "Gründer von Cogniiq. Arbeitet gemeinsam mit Lazar Popovic an Konzeption,
> Umsetzung und Betrieb der Kundenprojekte…"

and both list the identical four "Schwerpunkte". This is a *deliberate* and
defensible consequence of HONESTY-AUDIT §1 (the previously published, mutually
inverted specialisations were unverified). But the current state reads as
placeholder text to a buyer, and it is not the only honest option.

A real photograph already exists in the repo: `public/Lazar_Popovic.png` →
shipped as `dist/Lazar_Popovic.png`, referenced only by an internal bundle
(`assets/ScanPage-CZ_CkcpZ.js`), never by a public page.

Fix (honest only): (a) publish the existing photo of Lazar Popovic and one of
Djordje Popovic on `/ueber-uns` and `/praxen` (where he is already named as the
personal contact); (b) ask each founder to write his own two-sentence description
of what he actually does — a self-description is verifiable by definition and
removes the duplicate-text problem without asserting a specialisation Cogniiq
cannot back. OWNER-INPUT **F5** already asks for exactly this and is unanswered.
Risk: requires the owner's consent for the images. No fabrication involved.

---

### E-06 — No human author on any advice content
**KNOWN · P1 · blast radius: all 10 blog articles**

Evidence — all ten articles carry the same JSON-LD author:
```
"author":{"@type":"Organization","name":"Cogniiq","url":"https://cogniiq.de"}
```
(10/10 in `dist/blog/*.html`). No visible byline anywhere in the rendered article
(`dist/blog/ki-telefonassistent-arztpraxis.html` shows category, reading time and
dates — no person).

Cogniiq has two real, named, publicly identified founders and an operator who is
already presented by name with contact hours on `/praxen`. Attributing the advice
content to a named `Person` with a link to `/ueber-uns` is the single cheapest
E-E-A-T improvement available and requires inventing nothing.

Fix: `author: {@type: Person, name, url: /ueber-uns#<anchor>}` in `blog-data.ts`
plus a visible byline. Only attribute an article to the person who actually wrote
or approved it.
Risk: none.

---

### E-07 — `/ki-telefonassistent/demo` promises a live demonstration and delivers a lead form
**KNOWN · P1 · blast radius: 1 page, linked from all 92**

Evidence — `dist/ki-telefonassistent/demo.html`:
- `<title>`: "KI-Telefonassistent Demo | **Live-Vorführung** AI-Rezeptionistin – Cogniiq"
- H1 area: "**Erleben Sie live**, wie Ihre KI Anrufe beantwortet und Termine automatisch bucht"
- Bullet: "**Live-Demo** des KI Telefonassistenten"
- Section "Was wir Ihnen zeigen" → "**Live-Telefonat** — Erleben Sie einen echten
  Anruf, den der KI Assistent entgegennimmt und beantwortet."

What the page actually contains: a seven-field request form. The demo is a
scheduled video call (steps 1–4: "Formular ausfüllen … Wir melden uns in der Regel
innerhalb von 24 Stunden … Live-Demo per Video").

Compounding: the audio-sample component that would satisfy this promise
deliberately renders nothing — `src/components/StimmprobeSection.tsx:47`
`if (!STIMMPROBE.src) return null;` — because OWNER-INPUT **F1** is unanswered.
It is wired into `/praxen`, `/ki-telefonassistent`, `CityServicePage` and
`NationalIndustryPage` and renders on none of them.

Also on this page: "Sehen Sie, wie der Assistent **direkt einen Termin in den
Kalender bucht**" — same contradiction with `/integrationen` as E-02.

Fix (honest options): (1) **highest value** — record a 30–90 s staged sample call
(the owner has already specified: staged, no patient data — `StimmprobeSection.tsx:9-10`),
supply `STIMMPROBE.src`, and the strongest trust asset on the site switches on
across four page families at once. (2) Until then, relabel the page honestly:
"Demo-Termin anfragen" / "Wir führen Ihnen den Assistenten im Videocall vor" and
drop "Erleben Sie live" / "Live-Telefonat".
Risk: (2) reduces click appeal on a nav-level link; the current wording risks a
"they oversold it" reaction at the first click, which is worse.
Live-experiment overlap: none.

---

### E-08 — Entity has no external corroboration: `sameAs` points only at itself
**KNOWN · P2 · blast radius: all 93 documents**

Evidence — `index.html:225-227`:
```json
"sameAs": ["https://cogniiq.de"]
```
and `src/lib/seo-data.ts:79` `socialMedia: { linkedin: "", … }`, which makes
`LocalBusinessSchema.tsx:4` emit `sameAs: undefined`.

A self-referential `sameAs` conveys nothing. There is no Google Business Profile
link, no LinkedIn, no directory, no third-party corroboration of the entity
anywhere on the site. For a local business with a physical address in Bayreuth
this is the most standard, entirely truthful trust signal available.

Fix: populate `socialMedia` with profiles that actually exist and are controlled
by Cogniiq, and link the Google Business Profile from `/kontakt`. Do not invent or
list profiles that do not exist.
Risk: owner-dependent (the profiles must exist first).

---

### E-09 — Honest limitation blocks exist only in the healthcare cluster
**KNOWN · P2 · blast radius: webdesign + automation product lines (≈40 pages)**

`/praxen` carries a seven-item "Was unser Empfang nicht macht" block —
*"Der Assistent übernimmt nicht alle Anrufe. Realistisch ist Entlastung zu
Stoßzeiten und außerhalb der Öffnungszeiten – nicht die vollständige Übernahme
Ihrer Telefonie."* `/integrationen` and `/datenschutz-sicherheit` each devote
their third section to "Was wir nicht behaupten".

No equivalent exists on `/webdesign`, `/prozessautomatisierung`,
`/automatisierung-*` or the webdesign city pages. Those pages assert capability
without stating a boundary — the exact pattern that makes the healthcare pages
credible, absent where the site earns most of its impressions.

Fix: port the pattern, not the text. Each product line states in its own words
what it does not do and where it is not the right choice. This is pure
first-party expertise demonstration and requires no asset.
Risk: none, other than authoring effort.
Live-experiment overlap: `/bayreuth/webdesign`, `/muenchen/webdesign` are live
experiments — add a body section only, do not touch title/H1/canonical/meta.

---

### E-10 — Same `@id`, conflicting address: `#localbusiness` redefined without `streetAddress` on 14 pages
**KNOWN · P2 · blast radius: 14 city/region pages**

Evidence — `dist/bayreuth.html` contains three definitions of the same node. The
third (`id="page-additional-schema"`) drops the street:
```json
{"@type":"LocalBusiness","@id":"https://cogniiq.de/#localbusiness","name":"Cogniiq",
 "telephone":"+49 160 1832917","address":{"@type":"PostalAddress",
 "addressLocality":"Bayreuth","addressRegion":"Bayern","postalCode":"95444",
 "addressCountry":"DE"}}
```
while `index.html:199-212` and `LocalBusinessSchema.tsx:77-90` both define the same
`@id` **with** `"streetAddress":"Am Main 3"`. Affected files (5 vs 6 occurrence
mismatch): `bayreuth.html`, `muenchen.html`, `regensburg.html`, `bayern.html`,
`deutschland.html`, and the nine `<city>/<service>.html` pages.
Source: `src/components/CityServicePage.tsx:76-88` (and the parallel blocks in
`ClusterPage.tsx:111`, `IndustryPage.tsx:108`, `BayernPage.tsx:222`,
`CityLandingPage.tsx:102`, `BayernKiTelefonassistentPage.tsx:94`).

Separately, `#organization` is fully defined **twice** per page from two sources
(`index.html:88` and `LocalBusinessSchema.tsx:9`) with different property sets
(`hasOfferCatalog`/`knowsAbout` in one, `hasMap`/`image`/`contactPoint.hoursAvailable`
in the other). The code already knows about this — `CityServicePage.tsx:92` comments
on "the identical @id emitted by index.html and LocalBusinessSchema on the same page".

For a local business, an inconsistent NAP entity in structured data is a real
local-SEO defect, not a cosmetic one.

Fix: emit each `@id` exactly once per page. Make `index.html` the single source
for `#organization`/`#localbusiness`/`#website` (or make `LocalBusinessSchema` the
source and strip the static block); page-level schema references the node
(`{"@id": …}`) instead of redefining it.
Risk: schema refactor — needs the existing consistency test extended.

---

### E-11 — Published opening hours contradict the published service window
**KNOWN · P2 · blast radius: all 93 documents vs `/praxen`**

Evidence:
```
index.html:216-222        "opens":"09:00","closes":"18:00", Mon–Fri
src/lib/seo-data.ts:73-77 businessHours: Mo–Fr 09:00–18:00
```
vs `dist/praxen.html`:
> "Umgesetzt werden die Änderungen von Lazar Popovic persönlich, **erreichbar
> täglich von 6 bis 20 Uhr**"
> "Erreichbar täglich 6–20 Uhr · Antwort spätestens innerhalb von 24 Stunden"

which matches OWNER-INPUT **D2** ("erreichbar täglich 6–20 Uhr"). The JSON-LD
hours are the unconfirmed value and are what Google reads.

Fix: set `businessHours` to the owner-confirmed window (or, if 6–20 applies only
to existing customers, publish both distinctly: office hours vs. customer support
window). Do not publish a window nobody is actually reachable in.
Risk: none.

---

### E-12 — `/kontakt` asserts "niemals an Dritte weitergegeben"; `/datenschutz` names four processors
**KNOWN · P2 · blast radius: `/kontakt` + `ContactSection` (2 pages)**

Evidence — `src/components/ContactSection.tsx:532`, rendered in `dist/kontakt.html`:
> "Ihre Daten werden ausschließlich zur Bearbeitung Ihrer Anfrage verwendet und
> **niemals an Dritte weitergegeben**."

with badges `SSL-verschlüsselt` / `Keine Weitergabe` (`ContactSection.tsx:49-50`).

`dist/datenschutz.html` §4 and §8 state that enquiries are processed through a
self-hosted n8n instance and that Supabase and Resend are used for customer
processes, with Cloudflare hosting the site.

Legally these are Auftragsverarbeiter, not "Dritte" — so the sentence is arguably
defensible. But it is an absolute ("niemals") that a data-protection officer
reading both pages will challenge, on a site whose whole positioning is that it
does not make absolute claims. `SSL-verschlüsselt` is also a 2015-era trust badge
that signals nothing in 2026 (TLS is universal).

Fix: "Ihre Angaben verwenden wir ausschließlich zur Bearbeitung Ihrer Anfrage. Wer
sie technisch verarbeitet, steht in unserer Datenschutzerklärung." + link. Replace
the SSL badge with something that is actually differentiating (e.g. "Keine
Weitergabe zu Werbezwecken" or the AVV statement).
Risk: none.

---

### E-13 — Homepage cost comparison: a "Beispielwert" that is simultaneously a "Fixpreis", with derived savings
**KNOWN · P2 · blast radius: homepage**

Evidence — `dist/index.html`, `CostComparisonSection`:
```
297 € / Monat        "Beispielwert. Fester Monatsbetrag, im Angebot verbindlich."  (src:308)
Gesamt / Monat 297 € "Fixpreis. Keine Überraschungen."                             (src:361)
Sie sparen jeden Monat 1.780 €   = 86 % weniger als heute
Jahresersparnis 21.360 €
```
`src/components/CostComparisonSection.tsx:19-21` carries the standing marker:
`// [[CLAIM: verify — 297 € ist ein Beispielwert und weicht von den publizierten Staffeln ab`

The label "Beispielwert" and the caption "Fixpreis. Keine Überraschungen." are on
the same card and contradict each other, and the headline savings (1.780 € / 86 % /
21.360 €) are derived from the example price as if it were real. HONESTY-AUDIT §1
recorded this as fixed by labelling; the labelling did not survive contact with
the surrounding copy. It also conflicts with the published `TARIFE`
(Basis/Praxis/MVZ with 500/800/1.400 € caps) shown on `/praxen`.

The card's feature list additionally asserts "**Integration Kalender & CRM**"
(`CostComparisonSection.tsx:337`) and "Sofortbestätigung per SMS oder Mail" (:338)
under "Was enthalten ist" — same contradiction as E-02, on the homepage.

Fix: either drive the card from the real `TARIFE` values, or drop the derived
savings figures and the "Fixpreis" caption and let the calculator work only from
visitor inputs (the pattern the ROI calculator already uses honestly). Remove
"Integration Kalender & CRM" from "Was enthalten ist" unless it is true today.
Risk: the savings number is a strong conversion element; it is also the single
most checkable claim on the homepage.

---

### E-14 — Blog articles are dated 8 months before the company's own founding date
**KNOWN · P3 · blast radius: 10 blog articles**

Evidence:
```
index.html:101   "foundingDate": "2025-10-15"   (comment in seo-data.ts:6-7:
                  "Business start date confirmed by the operator")
dist/blog/*.html "datePublished": 2025-01-20 … 2025-03-13   (all ten)
```
All ten articles claim publication between 20 Jan and 13 Mar 2025; the company
states it was founded 15 Oct 2025. Every `updatedAt` is also ≤ Mar 2025, i.e. the
"advice" content presents as 18 months stale, and one title still reads
"KI-Telefonassistent Arztpraxis **2025**".

Fix: date the articles to when they were actually written, and refresh
`updatedAt` when content is genuinely revised. Do not backdate.
Risk: none. (Note: fixing dates changes `<title>`-adjacent metadata on blog
routes only — no live experiment touches `/blog/*`.)

---

### E-15 — Blog body asserts direct PVS booking as a product capability
**KNOWN · P3 (part of the E-02 cluster) · blast radius: 2 articles**

Evidence — `src/lib/blog-data.ts:181,192`, rendered in
`dist/blog/ki-telefonassistent-arztpraxis.html`, under the heading
"Was ein KI-Telefonassistent für Arztpraxen übernimmt":
> "Terminbuchung direkt in das Praxisverwaltungssystem (z. B. Samedi, Doctolib, Medistar)"
> "Die gängigen deutschen Praxisverwaltungssysteme wie Medistar, Turbomed oder
> Samedi bieten APIs… **DSGVO-Konformität ist dabei nicht optional, sondern Pflicht.**"

Read in context this describes Cogniiq's own offering. HONESTY-AUDIT §7.3 records
one DSGVO restbefund in `blog-data.ts:198` as fixed; these two lines survived.

Fix: reframe as a general market description ("Systeme am Markt bieten …") — which
§7.7's permitted-statements table explicitly allows — or remove. Keep it clearly
separated from what Cogniiq delivers.

---

### E-16 — No terms of business published anywhere
**LIKELY · P3 · blast radius: site-wide**

Evidence: no `/agb` route exists in the 93-document build; no `href="/agb"` anywhere.
The site nonetheless sells 12/24-month contracts with e-signature, operates a
password-protected `Kundenlogin`, and states contract terms only in scattered body
copy (`/praxen`: "Der Preis ist für 24 Monate schriftlich garantiert",
"Kündigung mit einem Klick").

AGB are **not legally mandatory** and their absence is not a compliance defect.
It is a trust defect: a B2B buyer evaluating a multi-year contract cannot read the
terms before the call. Cogniiq's published position ("kündbar per Klick",
"Preisgarantie 24 Monate") is unusually buyer-friendly — publishing it as terms
would be an asset, not a risk.

Fix (owner + lawyer decision, not mine): publish the contract terms, or at minimum
a "Vertragskonditionen auf einen Blick" section on the pricing page.

---

### E-17 — "DE · AT · CH" hero badge is unsupported by any other statement on the site
**KNOWN · P3 · blast radius: mobile homepage**

Evidence — `src/components/MobileHero.tsx:583` `{['DE','AT','CH'].map(…)}`,
rendered in `dist/index.html`. Everything else on the site says Germany:
`areaServed` in JSON-LD lists Deutschland + Bayern + 10 German cities only
(`index.html:123-135`); `/kontakt` says "Für Unternehmen in Deutschland";
`/ueber-uns` says "Aus Bayreuth — für ganz Deutschland".

An implied Austria/Switzerland footprint with no page, phone number, or legal
presence behind it is the kind of small overclaim a careful buyer notices.
Fix: drop the badge, or make it a truthful capability statement ("Remote-Projekte
auch in AT und CH möglich") only if the owner confirms it.

---

### E-18 — Homepage ROI calculator defaults produce a €374.616 headline
**LIKELY · P3 · blast radius: homepage**

Evidence — `dist/index.html` with preset defaults: "Summe / Monat − 31.218 €" and
"**374.616 €**". HONESTY-AUDIT §1 removed a "375.000 € pro Jahr" projection from
`/verpasste-anrufe-verlust` as fabricated; the homepage calculator reproduces
essentially the same number from its own presets.

**In its favour**, the framing is genuinely honest and unusually good:
> "Die Startwerte sind frei gewählte Beispiele — maßgeblich sind Ihre eigenen Eingaben."
> "Das ist die Hochrechnung Ihrer eigenen Angaben, kein Betrag, der sich
> zurückgewinnen lässt. Ein Telefonassistent nimmt Anrufe an, die sonst niemand
> annimmt — er ersetzt nicht die Arbeit, die danach folgt."

Recommendation: leave the mechanism; consider starting the "davon verpasst" slider
lower than 32 % so the default headline is not the same figure the honesty pass
removed elsewhere. Not a violation — a perception risk.

---

## 2 · COMPANY / LEGAL TRANSPARENCY — §5 DDG / §18(2) MStV element check

Source: `src/lib/legal-content.tsx` (single source for `/impressum`), rendered at
`dist/impressum.html`. **This is a source-text check, not a legal opinion. Whether
the Impressum is compliant is for the owner's lawyer to determine.**

| Required element | Status | Evidence |
|---|---|---|
| Name + legal form | **PRESENT** | `legal-content.tsx:34-36` "Cogniiq / Inhaber: Lazar Popovic". Sole proprietorship: full first + surname given, which is what §5 DDG requires of a natural person. |
| Anschrift (no P.O. box) | **PRESENT** | `legal-content.tsx:38-42` "Am Main 3 / 95444 Bayreuth / Deutschland" |
| E-Mail | **PRESENT** | `legal-content.tsx:49` |
| Second fast contact route (phone or equivalent) | **PRESENT** | `legal-content.tsx:47` "Telefon: 0160 1832917" |
| Vertretungsberechtigte | **N/A** | Sole proprietor represents himself; no separate entry required. |
| Registergericht + HRB | **N/A as published** | No HR entry claimed. A non-registered Einzelunternehmen has none. See UNCLEAR below. |
| USt-IdNr. (§27a UStG) | **PRESENT** | `legal-content.tsx:53` "DE460292419" |
| §18(2) MStV content-responsible person | **PRESENT** | `legal-content.tsx:55-62`, with full address |
| Aufsichtsbehörde / Berufsrecht | **N/A** | Web/AI agency is not a regulated profession. |
| EU-ODR platform link | **correctly ABSENT** | Documented at `legal-content.tsx:12`; the ODR platform was discontinued. Actively correct — many sites still carry the dead link. |
| Verbraucherstreitbeilegung statement | **PRESENT** | `legal-content.tsx:64-68` |

**UNCLEAR (single item, owner/lawyer to resolve):** whether the operator is
registered in the Handelsregister as a Kaufmann. If he is, the firm name in the
Impressum and in `BUSINESS_INFO.legalName` would need the registered form (e.g.
"… e.K.") plus Registergericht and HRB. Nothing in the repository indicates
registration, and the code comments (`legal-content.tsx:6-10`) describe a verified
sole proprietorship — so the current form is consistent with what is documented.
Flagging only because it is the one field that cannot be verified from the repo.

**Minor gap (P3):** the Datenschutzerklärung's "Verantwortliche Stelle"
(`dist/datenschutz.html` §2) gives name, address and e-mail but **no phone
number**, while the Impressum does. Art. 13 DSGVO expects the controller's contact
details; adding the phone line costs nothing.

---

## 3 · NAP + ENTITY CONSISTENCY

**Visible layer: clean.** Measured across all 93 rendered documents:

| Field | Variants found | Verdict |
|---|---|---|
| Phone (visible text) | `0160 1832917` × 116, no other form | consistent |
| Phone (`tel:` href) | `tel:+491601832917`, 1 per page | consistent |
| Phone (JSON-LD) | `"+49 160 1832917"` × 305 | consistent |
| Street | `Am Main 3` × 205 (JSON-LD) + footer/Impressum/Kontakt | consistent |
| Postal code | `95444` × 219 | see E-10 (14 extra, address-incomplete nodes) |
| Locality | `Bayreuth` × 219 | consistent |
| E-mail | `info@cogniiq.de` × 303 | consistent |
| Business name | `"Cogniiq"` × 533; one `Organization.name` variant is the long homepage title | see below |
| Legal name | `"Cogniiq, Inhaber Lazar Popovic"` (`index.html:92`, `seo-data.ts:3`) | matches Impressum |

Defects:
- **E-10** — `#localbusiness` redefined without `streetAddress` on 14 pages; `#organization`
  fully defined twice on every page from two sources.
- **E-11** — opening hours in JSON-LD (Mo–Fr 09–18) vs published availability (täglich 6–20).
- **Minor:** one `"name":"Cogniiq – KI-Telefonassistent, Webdesign & Automatisierung
  für Unternehmen in Bayern"` appears where a schema `name` should carry the
  business name, not the page title. P3.
- **Minor:** `priceRange: "€€€"` (`seo-data.ts:85`, `index.html:204`) is an unexplained
  self-assessment while the site publishes actual price bands. Either drop it or
  make it consistent with the published Staffeln. P3. (HONESTY-AUDIT §4 already
  lists it as owner-confirmation-pending.)

---

## 4 · CONTACT TRANSPARENCY AND FRICTION

**Routes available to a prospect: four.**
1. E-mail `info@cogniiq.de` — footer on all 92 pages, clickable.
2. Phone `0160 1832917` — footer on all 92 pages, `tel:` linked.
3. The 3-step form on `/kontakt`.
4. The 7-field form on `/ki-telefonassistent/demo`.

**Phone: published, clickable, but it is a mobile number** (0160 = Telekom mobile).
That is entirely legitimate for a two-person firm and is *not* something to hide —
but it is currently presented as a passive footer line. `/praxen` already publishes
the far stronger version — "erreichbar täglich von 6 bis 20 Uhr", named person —
and that framing appears on exactly one page. **KNOWN · P2 (part of E-11 fix):
promote "Rufen Sie an — täglich 6–20 Uhr, Sie sprechen mit Lazar Popovic" to
`/kontakt` and the footer.** No new claim; it is already published.

**Physical address: verifiable.** Am Main 3, 95444 Bayreuth appears in the footer,
Impressum, Datenschutz, Kontakt and JSON-LD, with a Google Maps embed on two pages
and matching geo coordinates. Good.

**Response-time promise: substantiated.** "Antwort in der Regel innerhalb von 24
Stunden" (`/kontakt`, `/ki-telefonassistent/demo`, homepage CTA) matches
OWNER-INPUT **D3** ("Antwort spätestens in 24 Stunden"). The hedge "in der Regel"
is appropriate. **SUBSTANTIATED — by owner answer D3.**

**Form proportionality — the one real friction finding.**
`/kontakt` step 1 requires **Name, E-Mail, Unternehmen, Branche, Startzeitraum**
(all `required`) before the visitor sees steps 2 and 3. Asking a first-touch
visitor to commit to a *start date* before they have heard anything is
disproportionate to their commitment level, on a site whose whole positioning is
"kein Verkaufsdruck". The `/ki-telefonassistent/demo` form is better calibrated
(only Name, E-Mail, Unternehmen required; Telefon, Branche, Größe, Situation
optional).

**LIKELY · P2 · fix:** make `Branche` and `Startzeitraum` optional, or move them to
step 2. Add a visible "lieber telefonieren?" route beside the form with the number
and the 6–20 window. GA4 was only just merged so there is no behavioural data to
argue from — treat as a reasoned recommendation, not a measured one.
Live-experiment overlap: none. This is a candidate for a *future* experiment once
GA4 has baseline data.

---

## 5 · FOUNDER / AUTHOR / EXPERTISE SIGNALS

**People: real, consistently named, under-presented.**
Lazar Popovic and Djordje Popovic appear consistently across `/ueber-uns`,
`/referenzen`, `/praxen`, `/bewertungen`, `BUSINESS_INFO.founders`, and the
`Person` nodes in `index.html:148-161`. Roles are neutral ("Gründer") by
deliberate decision after HONESTY-AUDIT §1 found mutually inverted, unverified
specialisations. Lazar Popovic is additionally presented on `/praxen` as the named
operational contact with hours — the strongest person signal on the site.
Weaknesses: identical bios, no photographs (E-05), no author attribution (E-06).

**Expertise: demonstrated in three places, asserted almost everywhere else.**

*Best examples (genuine demonstration — decision criteria, mechanism, limits):*
- `dist/integrationen.html`: *"Das ist der Punkt, an dem viele Telefonassistenten
  scheitern, und wir halten es für falsch, ihn zu verschweigen: Solange keine
  Anbindung besteht, überträgt Ihr Team das Ergebnis von Hand ins Praxissystem.
  Die Arbeit ist dann nicht verschwunden, sie ist nur kürzer geworden."*
- `dist/datenschutz-sicherheit.html`: six questions written *for the buyer's own
  DPO to ask Cogniiq*, each with the reason it matters ("Bestimmt, ob ein
  Drittlandtransfer vorliegt…"). Handing a prospect the ammunition to interrogate
  you is the highest-confidence expertise signal on the site.
- `dist/praxen.html` "Warum bisherige Versuche oft gescheitert sind" — diagnoses
  the failure mode of the whole product category before selling into it.
- `dist/datenschutz.html` — naming Cloudflare, self-hosted n8n, Supabase, Resend
  and the exact GA4 cookie is verifiable technical transparency.

*Weakest examples (assertion without mechanism):*
- `dist/ueber-uns.html`: *"Websites, die nicht nur aussehen — sondern qualifizierte
  Anfragen erzeugen"*; *"Conversion-Architektur statt Standard-Templates"*;
  *"wir entwickeln Systeme, die messbar wirken"* (`UeberUnsPage.tsx:1021`);
  *"Unternehmen durch intelligente Systeme messbar effizienter zu machen"* (:483).
  Four "messbar"/"Conversion" claims with no measurement, method or example behind
  any of them — on the page whose job is to establish competence.
- `dist/deutschland.html` FAQ: *"Direkter Ansprechpartner, faire Preise, schnelle
  Umsetzung"* (`DeutschlandPage.tsx:206`) — generic agency boilerplate.
- Footer, all 92 pages: *"hochkonvertierende Websites"* (`seo-data.ts:4`,
  `index.html:100`). This is the same phrasing that got `seo-metadata.ts` deleted
  on 17.08.2026 (HONESTY-AUDIT §7.2 note to #7); it survives in
  `BUSINESS_INFO.description`, which feeds the footer text **and** the
  `Organization`/`LocalBusiness`/`WebSite` JSON-LD on every page. **KNOWN · P2.**

**The asymmetry is the finding:** the pages where Cogniiq demonstrates expertise
are noindexed and unlinked; the pages where it merely asserts expertise are the
indexed, footer-linked, nav-linked ones.

---

## 6 · CLAIMS vs. EVIDENCE (trust-relevant claims currently live)

| # | Claim (live) | Where | Status | Basis / note |
|---|---|---|---|---|
| 1 | "Gespräche werden nicht aufgezeichnet" | `/praxen`, `/integrationen`, `/datenschutz-sicherheit`, homepage | **SUBSTANTIATED** | OWNER-INPUT B ("Keine Gesprächsaufzeichnung"); centralised in `FAKTEN` and guarded by `telefonassistent-copy.test.ts` |
| 2 | "Ihre Daten werden nicht zum Training von Modellen verwendet" | `/datenschutz-sicherheit`, `/praxen` | **SUBSTANTIATED** | OWNER-INPUT B ("kein Training auf Kundendaten") |
| 3 | Art.-50 KI-VO announcement, not switchable off | telephone-assistant pages | **SUBSTANTIATED** | OWNER-INPUT C1 = ja |
| 4 | AVV nach Art. 28 DSGVO für jeden Kunden | homepage stat, `/ueber-uns`, `/datenschutz-sicherheit` | **SUBSTANTIATED** | OWNER-INPUT C2 |
| 5 | §203 StGB vertraglich | `/datenschutz-sicherheit` | **SUBSTANTIATED** | OWNER-INPUT C5 |
| 6 | Zwei-Wochen-Garantie mit Rechtsfolge (zweite Hälfte entfällt) | `/praxen`, homepage stat "14 Tage bis zur Übergabe" | **SUBSTANTIATED** | `FAKTEN.einrichtungsfristTage`; the code comment at `StatsSection.tsx:32-35` shows the distinction (Übergabe, not Go-live) was made deliberately. Well handled. |
| 7 | Preisdeckelung 500/800/1.400 €, 0,39 €/Min, 24-Monats-Preisgarantie | `/praxen`, Preisseite | **SUBSTANTIATED** | OWNER-INPUT A; centralised in `TARIFE`, test-guarded |
| 8 | "Antwort in der Regel innerhalb von 24 Stunden" | `/kontakt`, `/demo`, homepage | **SUBSTANTIATED** | OWNER-INPUT D3 |
| 9 | "erreichbar täglich 6–20 Uhr", Änderungen in 3 Tagen | `/praxen` | **SUBSTANTIATED** | OWNER-INPUT D2/D4 — but contradicted by JSON-LD hours (E-11) |
| 10 | "Zehn Anrufe gleichzeitig" | `/praxen` | **SUBSTANTIATED** | OWNER-INPUT B11 (10 parallel) |
| 11 | **"DSGVO-konform"** as a self-certification | **nowhere** | **correctly ABSENT** | §7.7 lock holds; verified across `/ueber-uns`, `/leistungen`, `/bayern`, `/deutschland`, `/datenschutz-sicherheit` — all four answer by refusing the claim |
| 12 | **EU hosting / Verarbeitungsort** | **nowhere** | **correctly ABSENT** | §7.7 lock holds; the standard refusal sentence is used instead |
| 13 | Security claims ("rechtssicher", "zertifiziert") | **nowhere** | **correctly ABSENT** | §7.7 |
| 14 | Implied client volume / counts / logos | **nowhere** | **correctly ABSENT** | HONESTY-AUDIT §5 confirmed; the fabricated scarcity counter is gone from this branch |
| 15 | **"Gängige Systeme wie Tomedo, Medistar, Dampsoft oder CGM werden direkt unterstützt"** | `/automatisierung-arzt` FAQPage JSON-LD | **UNSUBSTANTIATED** | Contradicted by OWNER-INPUT B1/B3 and by `/integrationen`. **E-02** |
| 16 | "Magicline, Eversports, ClubDesk, PerfectGym … direkt" | `/automatisierung-sport` | **UNVERIFIABLE** | E-02 |
| 17 | "HubSpot, Pipedrive, Salesforce … und Hunderte weitere" | `/automatisierung-unternehmen`, `/prozessautomatisierung` | **UNVERIFIABLE** | E-02 |
| 18 | "Integration Kalender & CRM" as included feature | homepage cost card | **UNSUBSTANTIATED** | Contradicts `/integrationen`. E-13 |
| 19 | "Sofortbestätigung per SMS oder Mail" | homepage cost card | **UNVERIFIABLE** | OWNER-INPUT B unanswered on this |
| 20 | "Terminbuchung direkt in das Praxisverwaltungssystem (Samedi, Doctolib, Medistar)" | blog article | **UNSUBSTANTIATED** | E-15 |
| 21 | 297 € "Fixpreis" + 1.780 €/Monat + 21.360 €/Jahr Ersparnis | homepage | **UNSUBSTANTIATED** | Derived from a self-declared example value. E-13 |
| 22 | "Erste Systeme … in ein bis zwei Wochen … Systemverbünde in 3 bis 5 Wochen" | `/ueber-uns` (`UeberUnsPage.tsx:102`) | **UNVERIFIABLE** | No owner-confirmed duration exists for webdesign/automation; OWNER-INPUT E supplies durations only for the telephone assistant (2-day test, 7-day go-live, 2-week handover). P2. |
| 23 | "Einzellösungen … in 7 bis 14 Tagen einsatzbereit" | `/ueber-uns` FAQ (`UeberUnsPage.tsx:246`) | **UNSUBSTANTIATED** | OWNER-INPUT E1 records "7–14 Tage" as *überholt* and removed from the cluster; it survives here (and in `bayreuth/website-erstellen.html`, `muenchen/website-erstellen.html`). Currently hidden from the DOM by E-03 — visible after a click. P2. |
| 24 | "DE · AT · CH" | mobile homepage hero | **UNSUBSTANTIATED** | E-17 |
| 25 | "niemals an Dritte weitergegeben" | `/kontakt` | **contested** | E-12 |
| 26 | "Websites, die … qualifizierte Anfragen erzeugen" / "messbar wirken" / "hochkonvertierende Websites" | `/ueber-uns`, footer × 92, JSON-LD × 92 | **UNSUBSTANTIATED** (puffery) | §5 of this report |
| 27 | Blog: vzbv Marktcheck 2025, GKV-Spitzenverband 2025 | `/praxen`, blog | **SUBSTANTIATED (cited)** | Named source + year given, per COPY-BRIEF approved statistics. Good practice — worth extending. |

---

## 7 · THE HONEST-CREDIBILITY OPPORTUNITY (ranked)

Every item below is **true today or verifiable by the owner without inventing
anything.** No testimonials, logos, counts, ratings or certifications are proposed.

**1. Un-noindex and link `/integrationen` + `/datenschutz-sicherheit`.** (E-01)
Already written, already owner-confirmed, currently invisible. *Effort: minutes.
Impact: the site's strongest differentiator becomes reachable.* Not on the site
in any effective sense today.

**2. Fix the `/bewertungen` meta description.** (E-04) One line in
`publicRoutes.ts:111`. Removes an active bait-and-switch against Cogniiq's own
honest page.

**3. Publish real founder photos and self-written role descriptions.** (E-05)
`public/Lazar_Popovic.png` already exists in the repo and ships in `dist/` unused.
Two identical bios and two letter-avatars are the weakest moment on the company
page. A self-description is verifiable by construction. *Owner consent needed for
images (OWNER-INPUT F5).*

**4. Name a human author on the blog.** (E-06) `Organization` → `Person`, plus a
visible byline linking to `/ueber-uns`. Zero fabrication, standard E-E-A-T.

**5. Record the staged sample call.** (E-07 / OWNER-INPUT F1) The component is
built and hard-wired with its mandatory label (`StimmprobeSection.tsx:9-10,47`);
supplying one audio file switches on the strongest asset across `/praxen`,
`/ki-telefonassistent`, `CityServicePage` and `NationalIndustryPage`
simultaneously. Currently renders on zero pages.

**6. Reconcile the integration claims sitewide.** (E-02) Converts the site's
biggest self-contradiction into a repeat of its best page. The honest wording
already exists on `/integrationen` and can be reused verbatim.

**7. Port the "was wir nicht machen" pattern to webdesign and automation.** (E-09)
On the site for healthcare only. This is the cheapest form of demonstrated
expertise: stating where you are not the right choice.

**8. Publish the no-recording / no-training / Art.-50 stance above the fold on the
homepage.** Partially present — the TrustStrip already carries "Keine
Gesprächsaufzeichnung" and "AVV" — but it is a four-tile strip competing with a
"14 Tage" counter. These three facts are owner-confirmed, unusual in this market,
and are the answer to the objection that actually blocks the sale. *Already on the
site, under-weighted.*

**9. Publish the consent architecture as a selling point.** GA4 + Ads run
consent-gated with Consent Mode v2 defaults denied (`dist/datenschutz.html` §6/§7,
PR #50). Cogniiq builds websites for regulated clients and can say: *this is how we
build consent on your site too, and here is ours to inspect.* Buried in the legal
page today; nothing on `/webdesign` mentions it.

**10. Publish the price bands and the cancellation terms as terms, not prose.**
(E-16) 500/800/1.400 € caps, 0,39 €/min, 24-month price guarantee, one-click
cancellation are all already published on `/praxen` in body copy. Consolidating
them is a differentiator against the category's opacity.

**11. Add external entity corroboration (`sameAs`).** (E-08) Owner-dependent, but
a Google Business Profile for a business with a real Bayreuth address is standard
and free.

---

## 8 · ANTI-TRUST SIGNALS (things that actively reduce credibility)

| Signal | Evidence | Severity |
|---|---|---|
| Site contradicts itself on integrations | `automatisierung-arzt.html` "direkt unterstützt" vs `praxen.html` "gibt es heute nicht" | P1 (E-02) |
| Six FAQ questions with no answers | `dist/ueber-uns.html` | P1 (E-03) |
| SERP promises "echte Bewertungen", page has none | `publicRoutes.ts:111` vs `dist/bewertungen.html` | P1 (E-04) |
| A page called "Demo / Live-Vorführung" that is a form | `dist/ki-telefonassistent/demo.html` | P1 (E-07) |
| Two identical founder bios, letter avatars, zero photos | `dist/ueber-uns.html` | P1 (E-05) |
| "Beispielwert" and "Fixpreis. Keine Überraschungen." on the same card | `CostComparisonSection.tsx:308,361` | P2 (E-13) |
| Blog dated before the company was founded | `2025-01-20` vs `foundingDate 2025-10-15` | P3 (E-14) |
| Blog frozen at Feb/Mar 2025, titles say "2025" | `dist/blog/*` | P3 (E-14) |
| "hochkonvertierende Websites" in the footer and JSON-LD of all 92 pages | `seo-data.ts:4` | P2 |
| `sameAs: ["https://cogniiq.de"]` | `index.html:225` | P2 (E-08) |
| "SSL-verschlüsselt" as a 2026 trust badge | `ContactSection.tsx:49` | P3 (E-12) |
| Opening hours nobody keeps | `index.html:216` vs `/praxen` | P2 (E-11) |
| "DE · AT · CH" with no AT/CH anything | `MobileHero.tsx:583` | P3 (E-17) |
| Required "Startzeitraum" on a first-touch form | `dist/kontakt.html` | P2 (§4) |

**Checked and clean — no finding:**
- No lorem ipsum, no "coming soon"/"demnächst", no TODO/placeholder text in any
  rendered document. (The single "Max Mustermann" hit is a form `placeholder`
  attribute on `/kontakt` and `/demo` — correct usage.)
- **No broken internal links** in any of the 93 documents.
- No stock photography of people — because there is no photography at all (E-05).
- No empty sections: `/referenzen` and `/bewertungen` explain their emptiness
  rather than showing a blank; `StimmprobeSection` and `TestimonialBlock` return
  `null` rather than rendering a placeholder, exactly as HONESTY-AUDIT §9.1 states.
- No `aggregateRating`, `Review`, star markup, logo wall, client counter, award
  badge or partner seal anywhere.

---

## 9 · LIVE-EXPERIMENT OVERLAP

No finding in this report proposes a change to the title, H1, canonical, meta or
experiment-specific anchor text of any of the seven live-experiment routes.

- E-09 (limitation blocks) touches `/bayreuth/webdesign` and `/muenchen/webdesign`
  **body content only** — recommend deferring until the experiments conclude.
- Claim #23 ("7 bis 14 Tagen") appears in `bayreuth/website-erstellen.html` and
  `muenchen/website-erstellen.html`, which are **not** on the experiment list.
- E-01, E-02, E-03, E-04, E-05, E-06, E-07, E-08, E-10, E-11, E-12, E-13, E-14,
  E-15, E-16, E-17, E-18: no overlap.

---

## 10 · WHAT I COULD NOT DETERMINE

- Whether the operator is a registered Kaufmann (affects the required firm name).
- Whether any of the named integrations in E-02 is genuinely delivered today for
  the automation product — only the owner can answer.
- Whether "niemals an Dritte weitergegeben" is intended in the legal sense
  (Auftragsverarbeiter excluded) or the colloquial sense.
- Actual visitor behaviour on the `/kontakt` form: GA4 was merged only in PR #50,
  so no behavioural baseline exists. The form-friction recommendation is reasoned,
  not measured.
- Whether `priceRange: "€€€"` reflects anything the owner intends to assert.
