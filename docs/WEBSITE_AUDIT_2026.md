# Cogniiq – Conversion, Positioning, Credibility & SEO Audit

**Scope:** Complete public website (`cogniiq.de`) + its connection to the Owner Dashboard and sales workflow.
**Date:** 2026-07-23
**Status:** Diagnosis only. No code changed. Nothing to implement until approved.
**Business goal:** Win larger digital-transformation / automation projects (€20k–€100k+) **without weakening** existing organic search visibility.

> **Method note.** This audit is derived from the actual codebase (routes in `src/App.tsx`, SEO logic in `functions/_middleware.ts`, `src/config/seoConfig.ts`, `index.html`, `public/sitemap.xml`, `public/robots.txt`, content data in `src/lib/standorte-data.ts`, `src/lib/seo-data.ts`, page components, `Navigation.tsx`, `Footer.tsx`, `ReferenzenPage.tsx`, `TestimonialBlock.tsx`). It does **not** include live Search Console / Analytics data (rankings, impressions, backlinks, real Core Web Vitals field data). Every recommendation that depends on live traffic is flagged **[VERIFY IN GSC]** and must be confirmed against real data before any page is redirected, merged, noindexed, or removed. No existing page is recommended for removal in this document.

---

## 1. Executive diagnosis

Cogniiq has an **unusually strong SEO foundation for a young agency**: ~90 indexable, largely well-differentiated German-language pages, a clean 3-tier architecture (pillar → service → local/industry), server-side metadata injection via a Cloudflare Pages Function, structured data, a mega-menu + deep footer that leaves few orphans, and city pages that are **genuinely unique** (not doorway pages — verified in `standorte-data.ts`). This is an asset to protect, not rebuild.

The problem is **not SEO reach. It is positioning altitude and proof.** The site sells three *disconnected tools* (KI-Telefonassistent, Webdesign, Automatisierung). A business owner evaluating a €20k–€100k transformation cannot tell from the site that Cogniiq builds **one connected operating system** — even though the single best proof asset on the site (SV Heinersreuth: website + booking + payments + member logic + gate/light automation + admin/finance) is *exactly* that, and even though Cogniiq operates a full Owner Dashboard (offers → e-signature → customer portal → tasks/finance) that proves it can run systems at scale. The value ceiling is set by the messaging, not the capability.

**Three sentences that summarize the gap:**
1. The site says "we do three services," the market opportunity says "we build your digital operating system" — and there is no page that carries the second message.
2. The one real, connected, live system (SV Heinersreuth) is described abstractly, stripped of its verifiable numbers, and buried under 80+ keyword pages.
3. The funnel converts local, low-ticket intent ("Webdesign Kosten Bayreuth") efficiently but has **no high-ticket lane** for a Mittelstand owner who would pay €50k for an integrated system.

**Strategic conclusion:** Add an *outcome layer* on top of the existing keyword layer. Introduce a "Digitale Betriebssysteme" (Digital Operating Systems) pillar as the new commercial apex, re-cut the homepage around the connected-system story, and turn SV Heinersreuth into a metric-backed flagship case study — **while leaving the existing URL and keyword structure intact.** The new positioning and the existing SEO structure are complementary, not competing.

---

## 2. The five biggest conversion & credibility problems

| # | Problem | Why it blocks €20k–€100k deals | Evidence |
|---|---------|-------------------------------|----------|
| **C1** | **No "operating system" positioning anywhere.** Site is organized as 3 separate services; the desired positioning has no home page. | A Mittelstand owner looking for integrated transformation sees a webdesign+phone+automation vendor, not a systems partner. Anchors price expectation low. | `App.tsx` routes, `ServicesSection`, `HomePage.tsx` section order |
| **C2** | **Weak, abstract proof.** The single real case study (SV Heinersreuth) omits its verifiable numbers (≈1,000 bookings, >€18k processed, Stripe/PayPal, member logic, gate/light automation) and reads as generic. Testimonials are mostly labeled "Vorlage" (template/placeholder). | High-ticket buyers buy on evidence. Vague proof + visible placeholders = low trust at exactly the deal size that needs the most. | `ReferenzenPage.tsx`, `TestimonialBlock.tsx` (`REAL_TESTIMONIAL` vs `PLACEHOLDER_TESTIMONIAL`) |
| **C3** | **Legal/trust surface is a liability.** Impressum & Datenschutz are **JavaScript modal panels with no crawlable URL**, and the Datenschutz text states "keine Tracking- oder Analyse-Cookies," while `index.html` loads Google Ads gtag (`AW-17946397271`). | German procurement and larger buyers check Impressum/DSGVO. Missing Impressum URL = Abmahnung risk; contradictory privacy claim = credibility and legal risk. Also weakens E-E-A-T. | `Footer.tsx` (modal panels), `index.html` (gtag) |
| **C4** | **One generic CTA everywhere.** Every path funnels to `/kontakt` "Erstgespräch." There is no high-ticket entry ("Prozessanalyse / Systemaudit anfordern") and no visible qualification, so the site optimizes for *any* lead, not *qualified* €20k+ leads. | Big-project buyers want a structured discovery/audit, not a generic "free call." No lane signals no capacity for large work. | `Navigation.tsx`, `FinalCTASection`, `KontaktPage.tsx` |
| **C5** | **Public site and Owner Dashboard are two disconnected worlds.** The site never shows that becoming a customer means getting a real system + a dashboard (offer → e-signature → portal → ongoing operation). | The most differentiating asset (a productized delivery + operations platform) is invisible to prospects; the journey looks like "agency project," not "operating partner." | `/app` portal, `/admin` finance/CRM, `/d/:token` signature portal in `App.tsx` |

---

## 3. The five biggest SEO opportunities

| # | Opportunity | Expected impact | Risk |
|---|-------------|-----------------|------|
| **O1** | **New "Digitale Betriebssysteme" pillar** (`/digitale-betriebssysteme`) targeting high-value transformation intent (*individuelle Unternehmenssoftware, Digitalisierung Mittelstand, digitales Betriebssystem*) — a keyword space the site currently does **not** own. | Captures high-ticket intent + becomes the internal-linking apex that raises authority of all three service pillars. New page = pure upside. | Low (additive; no cannibalization if intent is separated per §10) |
| **O2** | **Metric-backed SV Heinersreuth case study** (`/referenzen/sv-heinersreuth`) with CaseStudy structured data. | Unique, high-trust, link-worthy content; supports E-E-A-T for the whole domain; strong internal-link target for service + city pages. | Low (new URL; keep `/referenzen` as hub) |
| **O3** | **Add `/blog` + blog posts to `sitemap.xml`** — the blog is linked in nav/footer and has `_middleware` metadata but is **absent from the sitemap**, and blog posts fall back to the homepage `<title>`/canonical in raw HTML. | Faster/complete indexation of the informational layer that feeds the funnel. | Very low (technical fix) |
| **O4** | **Consolidate the three-way SEO logic into one source of truth** (`functions/_middleware.ts` and `src/config/seoConfig.ts` are near-duplicate; the `src/config` copy is not wired into Cloudflare Functions and appears dead) and add per-route canonical/title to the middleware for currently-missing routes (blog posts, some dynamic pages). | Eliminates drift risk that could silently break canonicals/titles; ensures crawlers without JS see correct head tags. | Low, but change carefully & diff every path |
| **O5** | **Industry × city expansion using the proven differentiated model** (e.g. KI-Telefonassistent × city, Automatisierung × city) — only where real search demand exists **[VERIFY IN GSC + keyword tool]**. | Extends the local footprint using a content model already shown to avoid doorway patterns. | Medium — only build where demand + unique content exist; do not scale thin pages |

---

## 4. The five biggest SEO risks

| # | Risk | Consequence if ignored | Mitigation |
|---|------|------------------------|------------|
| **R1** | **Reposition-by-replacement.** Pressure to "clean up" 80+ pages into a few "operating system" pages. | Mass loss of indexed URLs, rankings, local visibility, backlinks. This is the single largest risk in this project. | **Additive strategy only.** New apex pages sit *above* existing pages; existing URLs are preserved. Every merge/redirect goes through §19 matrix + [VERIFY IN GSC]. |
| **R2** | **Two SEO code paths drift.** `functions/_middleware.ts` (live) vs `src/config/seoConfig.ts` (apparently dead duplicate) vs client-side `PageSEO`/`CanonicalManager`. | Canonical/title/description silently wrong for some routes; JS-only canonicals for blog posts and any route missing from middleware. | Single source of truth; server-render head for every indexable route; delete/retire the dead duplicate after confirming it is unused. |
| **R3** | **Legal pages not crawlable + contradictory privacy claim.** | Weak E-E-A-T/trust signals; legal exposure; poor experience for careful (large) buyers. | Create real `/impressum` and `/datenschutz` URLs; align Datenschutz with actual Google Ads/gtag usage + consent. |
| **R4** | **`/nuernberg` declared but has no route.** `LOCATION_PAGES` (`seo-data.ts`) defines a Nürnberg page with `canonical: /nuernberg` and it appears in `areaServed`, but there is **no route** in `App.tsx`. | If any component ever renders `LOCATION_PAGES` as links → broken internal link / soft-404 to a strong keyword. Currently appears unused, so latent. | Either build a real `/nuernberg` page (if demand) or remove the dangling data entry. **[VERIFY: is `LOCATION_PAGES` rendered anywhere?]** |
| **R5** | **Keyword cannibalization between national/service/local/cost/problem layers** (e.g. `/webdesign` vs `/webdesign-agentur-deutschland` vs `/bayreuth/webdesign` vs `/kosten-webdesign`). Currently *mostly* well-separated, but adding an apex pillar without explicit intent assignment could blur it. | Diluted rankings; Google picks the "wrong" URL for a query. | Formal intent map (§10 + §14); descriptive internal anchors; canonical discipline. |

---

## 5. The single strongest positioning recommendation

> **Reposition Cogniiq from "three services" to "one digital operating system," and make SV Heinersreuth the proof — without deleting a single existing keyword page.**

Concretely: introduce **"Digitale Betriebssysteme"** as the commercial apex ("Cogniiq entwickelt individuelle digitale Betriebssysteme für Unternehmen — Kundenanfragen, Aufträge, Mitarbeiter, Dokumente, Planung, Kommunikation und Abrechnung in einem System"). The three existing pillars (Webdesign, KI-Telefonassistent, Prozessautomatisierung) become **modules of that system**, each keeping its own page, keyword target, and rankings. This raises the price ceiling and the internal-link authority simultaneously, and it is the *only* recommendation that changes deal size without touching the existing URL inventory.

---

## 6. Recommended homepage messaging

Current homepage (`HomePage.tsx`) leads with a 3-service hero and stacks ROI calculator / cost comparison / services / process / cases / testimonials / FAQ. It reads as a competent *agency*, not a *systems partner*.

**Proposed narrative order (outcome-first, proof-early, existing sections reused):**

1. **Hero H1:** *"Ihr Unternehmen läuft auf einem System — nicht auf zehn Insellösungen."* Sub: the positioning sentence verbatim (Anfragen, Aufträge, Mitarbeiter, Dokumente, Planung, Kommunikation, Abrechnung in einem System). Primary CTA: **"Prozessanalyse anfordern"**; secondary: "Referenz ansehen."
2. **Proof strip (immediately):** SV Heinersreuth one-liner with the real numbers (≈1,000 Buchungen, >€18.000 abgewickelt, live im Betrieb) → links to the case study.
3. **The problem:** fragmented tools cost time/money (reuse `ProblemSection`).
4. **The system diagram:** the seven connected areas as one operating system (new visual) → each links to its module/pillar.
5. **Modules:** the 3 existing services reframed as parts of the system (reuse `ServicesSection`, re-worded).
6. **How we work + who we are:** direct founder involvement (Lazar & Djordje Popovic), 7–14 day go-live, Festpreis, DSGVO (reuse `ProcessSection`, `TrustSection`).
7. **Proof in depth:** case study + real testimonial (drop/segregate visible "Vorlage" placeholders on the homepage).
8. **Local/where we work:** reuse `LocationContent` (keeps local relevance).
9. **Final CTA:** the qualified "Prozessanalyse/Systemaudit" offer.

Keep `PAGE_META.home` keyword coverage, but evolve the H1/hero copy toward the system story. **The homepage title tag and canonical do not change.**

---

## 7. Complete current URL & keyword map

Legend — **Action:** Keep = unchanged · Improve = on-page copy/meta · Expand = add depth · Reposition = reframe as module of the system. **No page below is marked merge/redirect/remove without the risk analysis in §10/§19; the default is Keep/Improve.**

### 7.1 Core
| URL | Type | Primary keyword | Intent | Funnel | Action |
|-----|------|-----------------|--------|--------|--------|
| `/` | Home | Cogniiq / KI-Telefonassistent, Webdesign, Automatisierung Bayern | Brand + broad commercial | TOFU→MOFU | Improve (§6) |
| `/leistungen` | Services hub | Leistungen / Services | Commercial overview | MOFU | Reposition as "modules of the system" |
| `/ueber-uns` | About | Cogniiq Team, Gründer | Trust | MOFU | Improve (E-E-A-T) |
| `/faq` | FAQ | Kosten/Ablauf FAQ | Informational | MOFU | Keep |
| `/kontakt` | Contact/booking | Erstgespräch | Conversion | BOFU | Improve → add qualified "Prozessanalyse" |
| `/referenzen` | Proof hub | Referenzen / Projektbeispiele | Consideration | MOFU→BOFU | Expand → link to new case study |
| `/bewertungen` | Reviews | Bewertungen/Kundenstimmen | Trust | MOFU | Improve (reduce placeholder prominence) |
| `/blog`, `/blog/:slug` | Blog | topical informational | Informational | TOFU | **Fix: add to sitemap + server-render head** |
| `/anfrage-erhalten` | Thank-you | — | — | — | Keep (noindex/disallow — correct) |

### 7.2 Pillars (national / apex)
| URL | Primary keyword | Intent | Action |
|-----|-----------------|--------|--------|
| `/webdesign` | Webdesign Agentur | Commercial (service) | Keep/Improve |
| `/ki-telefonassistent` | KI-Telefonassistent | Commercial (service) | Keep/Improve |
| `/prozessautomatisierung` | Prozessautomatisierung | Commercial (service) | Keep/Improve |
| `/webdesign-agentur-deutschland` | Webdesign Agentur Deutschland | National commercial | Keep |
| `/ki-agentur-deutschland` | KI Agentur Deutschland | National commercial | Keep |
| `/automatisierung-unternehmen` | Automatisierung Unternehmen | National commercial | Keep |
| **`/digitale-betriebssysteme`** *(NEW)* | individuelle Unternehmenssoftware / digitales Betriebssystem / Digitalisierung Mittelstand | High-value transformation | **Create (apex)** |

### 7.3 Geo hubs & city landing
`/deutschland`, `/bayern`, `/bayern/ki-telefonassistent`, `/bayreuth`, `/muenchen`, `/regensburg` — **Keep.** Local commercial / geo-hub intent, well-covered in `_middleware` metadata and sitemap.

### 7.4 City × service (`CITY_SERVICE_CONFIGS`, `standorte-data.ts`)
For each of Bayreuth / München / Regensburg: `/{city}/webdesign`, `/{city}/ki-telefonassistent`, `/{city}/automatisierung`. Primary keyword = "{Service} {City}", local commercial intent, MOFU. **Verified genuinely differentiated** (distinct local intros, scenarios, FAQs, industries). **Action: Keep** (see §9 for polish per city).

### 7.5 City cluster (webdesign topic, per city)
`/{city}/webdesign-kosten`, `/{city}/website-erstellen`, `/{city}/landingpage`, `/{city}/website-relaunch`, `/{city}/lokales-seo` (×3 cities = 15 pages). Long-tail local commercial/informational. **Action: Keep; audit München vs Regensburg vs Bayreuth for near-duplication [VERIFY IN GSC]** (§9/§10).

### 7.6 Industry × city (webdesign)
`/webdesign-arzt-{city}`, `/webdesign-gastronomie-{city}`, `/webdesign-immobilien-{city}` (×3 cities = 9). Niche local commercial. **Keep; verify differentiation.**

### 7.7 Industry (national)
Webdesign: `/webdesign-arzt|gastronomie|immobilien|hotel|sport`. KI: `/ki-telefonassistent-arzt|restaurant|hotel|praxis`. Automatisierung: `/automatisierung-restaurant|arzt|immobilien|sport`. Commercial niche intent. **Keep.** Note potential overlap `/ki-telefonassistent-arzt` vs `/ki-telefonassistent-praxis` (§10).

### 7.8 Cost / pricing
`/kosten-webdesign`, `/kosten-ki-telefonassistent`, `/kosten-automatisierung` + per-city `webdesign-kosten`. Commercial "Kosten/Preis" intent. **Keep** (own distinct intent from service pages).

### 7.9 Problem-based landing
`/verpasste-anrufe-verlust`, `/keine-anfragen-website`, `/keine-terminbuchung-online`, `/zu-viel-manuelle-arbeit`, `/digitale-automatisierung-unternehmen`. Problem-aware informational→commercial. **Keep;** link each into its solution pillar + the new apex.

### 7.10 Utility / private (must stay out of the index)
`/scan`, `/logo-preview` (should be noindex — currently indexable, not in sitemap; low value). `/app/*` customer portal, `/admin/*` internal workspace, `/d/:token` document portal, `/auth/*` — correctly noindexed via `_middleware` X-Robots-Tag + `App.tsx` robots meta. **Keep noindex.**

### 7.11 Declared-but-missing
`/nuernberg` — declared in `LOCATION_PAGES` + `areaServed`, **no route** (R4). **Decide: build or remove data entry.**

---

## 8. Proposed sitemap (target state)

Keep the current well-structured `sitemap.xml` and **add**:
- `/blog` and each `/blog/:slug` (currently missing).
- `/digitale-betriebssysteme` (new apex, priority ~0.95).
- `/referenzen/sv-heinersreuth` (new case study, priority ~0.85).
- `/impressum`, `/datenschutz` (new legal URLs — priority low, e.g. 0.3, `changefreq yearly`; keep indexable for trust).
- `/nuernberg` **only if** the page is actually built.

**Do not add** utility/private surfaces (`/scan`, `/logo-preview`, `/app/*`, `/admin/*`, `/d/*`, `/anfrage-erhalten`). Refresh `<lastmod>` only for pages actually changed (avoid blanket date bumps, which erode `lastmod` trust). Keep a single sitemap (volume is well under the 50k limit).

---

## 9. Local SEO differentiation plan (every city/service page)

**Finding:** The city × service pages (`standorte-data.ts`) are **not** doorway pages. Each has a distinct local intro, city-specific business context (Festspielzeit for Bayreuth; UNESCO/tourism + university + Klinikum for Regensburg; scale/competition for München), unique scenarios, unique FAQs, and different internal links. This is a genuine strength and must be **preserved**.

**Physical vs service reality (state this consistently on every local page — never fabricate a local presence):**
- **Physical location:** Bayreuth only (Am Main Straße 3, 95444). LocalBusiness schema is factually correct **only for Bayreuth**.
- **Service area / remote:** München, Regensburg (and remote nationwide) — persönliche Termine möglich, but no office. City pages already word this carefully ("Anbieter mit Hauptsitz in Bayreuth"). Keep that framing; do **not** imply a München/Regensburg office.
- **Existing customer location:** Heinersreuth/Bayreuth region (SV Heinersreuth). Only Bayreuth-area pages may reference it as a *local* reference; other city pages may reference it as a regional/company reference, not a local one.

**Differentiation plan per surface:**

| Surface | Keep unique | Watch / improve |
|---------|-------------|-----------------|
| `/bayreuth/*` (service) | Strong (HQ, Festspiel context, real local scenarios) | Can cite SV Heinersreuth as a *local* proof (biggest advantage) |
| `/muenchen/*` (service) | Good local intro | Ensure München-specific proof framing stays honest (regional, not local office); differentiate industries/scenarios from Bayreuth |
| `/regensburg/*` (service) | Strong (UNESCO/tourism/university/Klinikum angle) | Keep; verify FAQs differ from other cities |
| `/{city}/webdesign-kosten` ×3 | Local price framing | **Highest duplication risk** — verify price ranges, examples, FAQs differ per city, not just the city token [VERIFY] |
| `/{city}/website-erstellen` ×3 | Process copy | Verify body copy is not near-identical across cities |
| `/{city}/landingpage` ×3 | Campaign angle | Differentiate use-cases per local market |
| `/{city}/website-relaunch` ×3 | Relaunch/no-ranking-loss angle | Differentiate examples per city |
| `/{city}/lokales-seo` ×3 | Google Maps / NAP angle | Add city-specific local-search realities |
| `/webdesign-{industry}-{city}` ×9 | Industry+city niche | Verify each has distinct FAQ/examples, not a template with swapped tokens |

**Rule for any new local page:** it must offer standalone value (distinct intro, local context, industries, problems, examples, FAQs, headings, title, meta, CTA, internal links, and image/alt context). No new local page purely to capture a city keyword.

---

## 10. Keyword-cannibalization analysis

For each cluster: competing URLs → preferred primary → distinct intents → linking → title/H1 guidance → consolidation verdict → ranking risk. **Default verdict is "separate by intent, do not consolidate." No consolidation is recommended blind — each is [VERIFY IN GSC] (do the two URLs rank for the same query with the same intent, and does one already win?).**

### 10.1 Webdesign family
- **Competing:** `/webdesign` · `/webdesign-agentur-deutschland` · `/bayreuth/webdesign` (+city) · `/kosten-webdesign` · `/{city}/webdesign-kosten` · `/{city}/website-erstellen`.
- **Preferred primary:** `/webdesign` (generic service) and `/webdesign-agentur-deutschland` (national "Agentur" query).
- **Distinct intents:** `/webdesign` = service explainer; `-agentur-deutschland` = national "agency" transactional; `/{city}/webdesign` = local commercial; `/kosten-webdesign` = price research; `/{city}/website-erstellen` = local "erstellen lassen" transactional.
- **Linking:** city → national pillar → `/webdesign`; cost pages link "up" to service, service links "down" to cost.
- **Title/H1:** keep "Agentur" on the national pillar, "in {City}" on local, "Kosten/Preise" on cost — currently well done.
- **Verdict:** **Separate; do not merge.** Risk if blurred: `/webdesign` and `/webdesign-agentur-deutschland` could split "webdesign agentur" authority — assign that head term to the national pillar via internal anchors. **[VERIFY]** whether both currently rank for "webdesign agentur"; if they trade positions, strengthen one and internally subordinate the other (no redirect).

### 10.2 KI-Telefonassistent family
- **Competing:** `/ki-telefonassistent` · `/ki-agentur-deutschland` · `/bayern/ki-telefonassistent` · `/{city}/ki-telefonassistent` · `/ki-telefonassistent-arzt|praxis|hotel|restaurant` · `/kosten-ki-telefonassistent`.
- **Overlap hotspot:** `/ki-telefonassistent-arzt` vs `/ki-telefonassistent-praxis` — near-identical intent (both medical). **[VERIFY]** if they cannibalize; if so, differentiate (Arzt = general practice/patient acquisition; Praxis = Facharzt/Terminverwaltung/Rezept) or subordinate one via canonical only with GSC evidence.
- **Verdict:** separate by geography and industry; only the Arzt/Praxis pair is a genuine merge *candidate* pending data.

### 10.3 Automatisierung family
- **Competing:** `/prozessautomatisierung` · `/automatisierung-unternehmen` · `/{city}/automatisierung` · `/automatisierung-{industry}` · `/kosten-automatisierung` · `/zu-viel-manuelle-arbeit` · `/digitale-automatisierung-unternehmen`.
- **New wrinkle:** the apex `/digitale-betriebssysteme` must target *transformation/operating-system* intent, **not** "prozessautomatisierung" — otherwise it cannibalizes the pillar. Assign: apex = "individuelle Unternehmenssoftware / Betriebssystem / Digitalisierung Mittelstand"; `/prozessautomatisierung` = "Prozesse automatisieren"; `/automatisierung-unternehmen` = "Automatisierung Unternehmen." Keep them distinct in H1 and intro.
- **Verdict:** separate; watch the new apex on launch.

### 10.4 Cross-layer rule
Cost pages, problem pages, and service pages must each keep a *single* primary intent (research vs problem-aware vs commercial). Do not let every page chase the head term. Enforce via §14.

---

## 11. SV Heinersreuth case-study structure (flagship proof)

**Use only verified facts.** Confirm each metric against project data/code before publishing; publish only what is true. Do **not** invent quotes or numbers.

**Proposed URL:** `/referenzen/sv-heinersreuth` (child of `/referenzen`, which stays the hub).
**Primary keyword:** *Vereinssoftware / Buchungssystem Sportanlage / digitales Betriebssystem Fallstudie* (consideration, not head-term commercial).
**Secondary:** Padel Buchungssystem, Mitgliederverwaltung digital, Zahlungsabwicklung Verein (Stripe/PayPal), Anlagenautomation.
**Structure:**
1. **Snapshot bar (verified metrics):** ≈1.000 Buchungen · >€18.000 abgewickelt · Live im Betrieb · Stripe + PayPal · Mitglieder-/Gast-Logik.
2. **Ausgangslage:** fragmented tools, manual coordination.
3. **Das System (the operating-system story):** Website → Buchung → Zahlung (Stripe/PayPal) → Mitglieder-/Nichtmitglied-Logik → Stornierung/Erstattung → Admin/Finanzübersicht → **Anlagenautomation** (gate/access + Flutlicht), with the existing security-discretion note kept ("sicherheitsrelevante Details nicht öffentlich").
4. **Ergebnis im Betrieb:** the operational outcomes already listed on `/referenzen`, now numbers-backed.
5. **Real testimonial** (`REAL_TESTIMONIAL`) — keep, clearly attributed.
6. **Diagram/screenshots** that build trust (recommended): a system-connection diagram (7 areas), an anonymized booking-flow screenshot, an anonymized admin/finance overview. Redact PII and security details.
7. **CTA:** "Ein solches System für Ihr Unternehmen? Prozessanalyse anfordern."

**Where it should be linked from (internal):**
- `/digitale-betriebssysteme` (apex — primary proof), `/prozessautomatisierung`, `/webdesign`, `/ki-telefonassistent`, `/automatisierung-sport`, `/webdesign-sport`, `/referenzen`, homepage proof strip.
- **City pages:** `/bayreuth/*` may reference it as a *local* reference; München/Regensburg only as a *regional/company* reference (honest framing).
**Structured data:** `CreativeWork`/`CaseStudy`-style (extend the existing `ReferenzenPage` graph). **No unsupported claims in schema.**
**Duplicate-content guard:** the deep case study lives on ONE URL. `/referenzen` keeps a *summary* card linking to it; service/city pages use short, varied 1–2 sentence references + link — never paste the full write-up.

---

## 12. Required trust & security content

For €20k–€100k buyers (and procurement), add credible, factual trust surface:
1. **`/impressum`** — real crawlable URL (move content out of the JS modal). §5 TMG/DDG compliant.
2. **`/datenschutz`** — real crawlable URL; **correct the "no tracking cookies" statement** to reflect Google Ads/gtag; add consent handling; name processors (Resend, Supabase, Stripe/PayPal, Cloudflare, Google) and EU-server posture where true.
3. **`/sicherheit-datenschutz`** (procurement trust page) — DSGVO posture, EU/German hosting, AVV availability, data-processing overview, e-signature integrity, backups/monitoring, access control. **Only factual claims** — no unverifiable certifications.
4. **`/ueber-uns` E-E-A-T uplift** — named founders (already present: Lazar & Djordje Popovic), direct responsibility, real experience; ties to the "direct founder involvement" trust angle.
5. **Reviews hygiene** — segregate or clearly label placeholder testimonials; never let "Vorlage" cards read as real proof on money pages.

---

## 13. Ideal CTA & sales funnel

**Target journey:** Visitor → understands the problem → sees verified proof → explores a relevant module → **requests a Prozessanalyse** → qualified discovery call → tailored demo → digital offer → secure e-signature → Owner Dashboard customer/project.

**Map to what already exists in the code (reuse, don't rebuild):**
- **Public site** → primary CTA becomes **"Prozessanalyse / Systemaudit anfordern"** (higher-intent than "Erstgespräch"). Keep `/kontakt` booking (`ContactSection` + `PremiumCalendar` + `useAvailability`) as the mechanism; add a qualification step (budget/timeframe/scope) to filter for €20k+ intent.
- **Discovery/demo** → founder-led, using SV Heinersreuth as the reference system.
- **Offer** → `OfferEditor` → `SendOfferDialog` (production Resend email) → **`/d/:token` public document portal** (already noindex/no-referrer/secure-token — correct).
- **Signature** → `SignaturePad` / post-acceptance workflow → customer created.
- **Customer** → `/app` portal (solutions, billing, support) + `/admin` finance/tasks on Cogniiq's side.

**SEO-entry integration (critical):** every entry type must have a logical path into this funnel —
- City/service/industry pages → module pillar → apex `/digitale-betriebssysteme` → Prozessanalyse.
- Cost pages → "what you actually get" → case study → Prozessanalyse.
- Problem pages → matching solution pillar → proof → Prozessanalyse.
- Case study → Prozessanalyse.
The site should make visible that the funnel ends in a **real system + dashboard**, not just "a project."

---

## 14. Exact public pages: create / rewrite / expand / merge / redirect / preserve

**CREATE (all additive — no SEO risk to existing URLs):**
- `/digitale-betriebssysteme` (apex pillar)
- `/referenzen/sv-heinersreuth` (flagship case study)
- `/impressum`, `/datenschutz` (crawlable legal)
- `/sicherheit-datenschutz` (procurement trust)
- *(optional)* `/nuernberg` — only if demand [VERIFY]
- *(optional)* "So arbeiten wir mit Cogniiq" — could be a section on the apex or a standalone `/zusammenarbeit`

**REWRITE (copy/meta only, URL unchanged):**
- `/` homepage hero + section framing (§6)
- `/leistungen` (reframe services as modules)
- `/kontakt` (add qualified Prozessanalyse offer)
- `/bewertungen` (placeholder hygiene)

**EXPAND (add depth, URL unchanged):**
- `/referenzen` (summary + link to case study)
- `/ueber-uns` (E-E-A-T)
- Problem pages (link into apex + module)

**MERGE / REDIRECT / NOINDEX — candidates ONLY, each gated by GSC:**
- `/ki-telefonassistent-arzt` ↔ `/ki-telefonassistent-praxis` — merge *candidate* if data shows cannibalization; otherwise differentiate. **[VERIFY]**
- `/scan`, `/logo-preview` — **noindex** (utility, low value). Low risk; confirm they attract no organic traffic first. **[VERIFY]**
- Any `/{city}/webdesign-kosten` proven near-duplicate — *first improve/differentiate*; consolidate only as a last resort with data.

**PRESERVE unchanged:** all geo hubs, all city × service pages, all industry pages, all cost pages, all national pillars, `/faq`, `/anfrage-erhalten` (noindex), all private surfaces.

---

## 15. Internal-linking strategy

**Model (hub-and-spoke with a new apex):**
```
                 Homepage
                    │
        ┌───────────┼─────────────┐
        ▼           ▼             ▼
  /digitale-betriebssysteme (APEX)  ← case study, problem pages point up
        │  │  │
        ▼  ▼  ▼
 /webdesign  /ki-telefonassistent  /prozessautomatisierung   (module pillars)
   │            │                      │
   ▼            ▼                      ▼
 national → city → industry × city   (existing local layer, unchanged)
   │            │                      │
   └──► /referenzen/sv-heinersreuth ◄──┘   (proof, linked from all modules)
                    │
                    ▼
        /kontakt (Prozessanalyse — conversion)
```
**Rules:**
- Every service/city/industry/cost/problem page links **up** to its module pillar and to the apex, and **across** to the case study and to `/kontakt`.
- Apex links **down** to all three modules + case study + trust page.
- **Descriptive anchors** ("digitales Betriebssystem für Vereine", "KI-Telefonassistent für Arztpraxen") — avoid repetitive exact-match ("Webdesign Bayreuth" ×20).
- Preserve the existing mega-menu + footer link equity (they already prevent most orphans). Add apex, case study, and legal pages to nav/footer.
- **No orphans:** blog posts must be linked from `/blog` *and* relevant pillars; case study linked from proof strip + modules; legal pages in footer.

---

## 16. Metadata strategy

- **Single source of truth:** consolidate head-tag generation in `functions/_middleware.ts`; retire the duplicate `src/config/seoConfig.ts` after confirming it is unused. Ensure **every indexable route** (incl. `/blog/:slug` and new pages) gets server-rendered `title`/`description`/`canonical`/OG/Twitter — not JS-only.
- **Titles:** keep the proven patterns (`{Service} {City} | Cogniiq`, `{Service} Agentur Deutschland | Cogniiq`, `Kosten {Service} | Cogniiq`). Apex: `Digitale Betriebssysteme für Unternehmen | Individuelle Unternehmenssoftware – Cogniiq`.
- **Descriptions:** unique per page (already strong); keep ≤ ~155 chars, benefit-led.
- **Keywords meta:** low SEO value; harmless to keep for consistency, not a priority.
- **Canonicals:** self-referential, trailing-slash-normalized (already handled by `CanonicalManager` client-side + middleware server-side — keep both in sync; server value is authoritative). New pages must ship with correct canonicals in middleware.
- **OG/Twitter:** already synced to canonical/title/description in middleware — extend to new routes; add a case-study-specific OG image.

---

## 17. Structured-data strategy

Current: `Organization` + `LocalBusiness` + `WebSite` (global, `index.html`), `BreadcrumbList` (`PageSEO`), `CollectionPage`+`CreativeWork` (`ReferenzenPage`). Recommendations:
- **LocalBusiness** — factually correct for the **Bayreuth** entity only. It is currently emitted on every public page (`PublicStructuredData` → `LocalBusinessSchema`). Keep the single Bayreuth `@id`; do **not** mint München/Regensburg LocalBusiness entities (no premises). For city pages, prefer **`Service` + `areaServed`** over implying a local business.
- **Service schema** — add to module + city × service pages (`Service`, `provider` → the org `@id`, `areaServed`), no unsupported claims.
- **CaseStudy/CreativeWork** — extend for `/referenzen/sv-heinersreuth` with verified facts only.
- **FAQPage** — the city configs and FAQ page carry rich Q&A; add `FAQPage` schema **only where the FAQs are truly on-page and compliant** (avoid marked-up FAQs that aren't visible).
- **BreadcrumbList** — keep; ensure the new nested URLs (`/referenzen/sv-heinersreuth`) get correct breadcrumbs.
- **Organization** — add `sameAs` real profiles when available (LinkedIn etc. are currently empty in `seo-data.ts`).
- **Do not** add Review/AggregateRating schema unless backed by genuine, policy-compliant reviews.

---

## 18. Technical SEO checklist

**Confirmed OK:** SPA fallback (`_redirects` + middleware 404→index), server-side head injection for ~90 routes, HTML `Cache-Control: no-cache` (prevents stale-chunk white pages), asset pass-through guard, trailing-slash normalization, robots.txt + sitemap reference, private-surface noindex via `X-Robots-Tag` + meta, `/d/:token` noindex+no-referrer+no canonical, viewport/lang/geo meta, preconnect for fonts.

**To fix / verify:**
- [ ] **Add `/blog` + posts to sitemap;** server-render head for `/blog/:slug` (currently homepage fallback in raw HTML).
- [ ] **Impressum/Datenschutz as real URLs** (currently JS modals) + fix privacy/tracking contradiction.
- [ ] **`/nuernberg`** dangling data (build or remove).
- [ ] **Retire duplicate SEO logic** (`src/config/seoConfig.ts`).
- [ ] **`/scan`, `/logo-preview`** → noindex [VERIFY no traffic].
- [ ] **www vs non-www + http→https** — confirm a single canonical host redirect at Cloudflare Pages level (not visible in repo). [VERIFY]
- [ ] **`<lastmod>` hygiene** — update only changed pages.
- [ ] **JS-rendering risk** — ensure critical head + core content are server-visible for every indexable route (middleware covers head; body is client-rendered — confirm Googlebot renders the SPA; consider prerender/SSG for the apex + case study if field data shows crawl/latency issues). [VERIFY]
- [ ] **Core Web Vitals** — measure real field data (heavy Framer Motion usage on many pages; lazy sections on homepage). Verify LCP/CLS/INP on mobile. [VERIFY]
- [ ] **Images** — audit dimensions/lazy-loading/alt across pages (data model supports unique alt per city — enforce it).
- [ ] **Broken links / redirect chains / soft-404s** — crawl post-change; especially any `LOCATION_PAGES`-derived links.
- [ ] **Heading hierarchy** — one H1 per page (verified on sampled pages); audit sitewide.

---

## 19. Content-migration & redirect matrix

**No page is rewritten/removed unless it appears here.** All recommendations default to preserve. "Merge/redirect" rows are *candidates* pending [VERIFY IN GSC].

| Page | Keep URL? | Keep content? | Rewrite? | Expand? | Merge? | Redirect? | Canonical target | Primary KW before | Primary KW after | Links to preserve | SEO risk | Expected benefit |
|------|-----------|---------------|----------|---------|--------|-----------|------------------|-------------------|------------------|-------------------|----------|------------------|
| `/` | ✅ | Partial | ✅ (hero/framing) | – | – | – | self | KI/Web/Auto Bayern | + "Betriebssystem" | all nav/footer | Low | Higher-ticket positioning |
| `/leistungen` | ✅ | Partial | ✅ (modules) | – | – | – | self | Leistungen | Leistungen/System | mega-menu | Low | Ties services into system |
| `/digitale-betriebssysteme` *(new)* | n/a | new | – | – | – | – | self | – | individuelle Unternehmenssoftware | apex hub | None (additive) | New high-value intent |
| `/referenzen` | ✅ | ✅ | – | ✅ | – | – | self | Referenzen | Referenzen (hub) | proof links | Low | Feeds case study |
| `/referenzen/sv-heinersreuth` *(new)* | n/a | new | – | – | – | – | self | – | Vereinssoftware/Fallstudie | modules+home | None | Flagship proof |
| `/impressum` *(new URL)* | n/a | move from modal | – | – | – | – | self | – | Impressum | footer | None | Legal + E-E-A-T |
| `/datenschutz` *(new URL)* | n/a | move+correct | ✅ (tracking) | – | – | – | self | – | Datenschutz | footer | None | Legal + trust |
| `/kontakt` | ✅ | ✅ | ✅ (qualify) | – | – | – | self | Erstgespräch | Prozessanalyse | CTA target | Low | Qualified leads |
| `/bewertungen` | ✅ | ✅ | ✅ (placeholder) | – | – | – | self | Bewertungen | Bewertungen | trust | Low | Credibility |
| `/blog` + `/blog/:slug` | ✅ | ✅ | – | – | – | – | self | topical | topical | nav/footer | **Med (indexation)** | Fix sitemap+head → index |
| `/ki-telefonassistent-arzt` | ✅ (default) | ✅ | maybe | – | *candidate* | *candidate* | self unless GSC shows overlap | KI Telefonassistent Arzt | Arzt (general) | mega-menu | **Med — verify vs praxis** | Remove cannibalization only if real |
| `/ki-telefonassistent-praxis` | ✅ (default) | ✅ | maybe | – | *candidate* | *candidate* | self / → arzt only if GSC | KI Telefonassistent Praxis | Facharzt/Terminverwaltung | mega-menu | **Med — verify** | Same |
| `/scan`, `/logo-preview` | ✅ | ✅ | – | – | – | – (noindex) | self+noindex | – | – | none | Low [verify traffic] | Cleaner index |
| `/nuernberg` (data only) | decide | – | – | – | – | – | self if built | Nürnberg | Nürnberg | none yet | Low (latent) | Fix dangling ref |
| All city×service / industry / cost / geo / pillar / problem pages | ✅ | ✅ | Improve only | selective | – | – | self | unchanged | unchanged | mega-menu/footer | **Low if preserved / High if replaced** | Protect existing rankings |

---

## 20. Prioritized implementation roadmap

Ranked by **business impact ÷ SEO risk**. Each item lists: conversion impact · SEO impact · effort · risk · success metric.

**Phase 0 — Zero-risk fixes & instrumentation (do first)**
1. **Add `/blog` + posts to sitemap; server-render blog head.** Conv: low · SEO: med (indexation) · Effort: S · Risk: very low · Metric: blog pages indexed in GSC.
2. **Create crawlable `/impressum` + `/datenschutz`; fix tracking-cookie contradiction.** Conv: med (trust) · SEO: med (E-E-A-T) · Effort: S · Risk: low · Metric: pages live+indexed, legal review passed.
3. **Retire duplicate `src/config/seoConfig.ts`; single head source.** Conv: none · SEO: risk-reduction · Effort: S · Risk: low · Metric: one source, all routes correct.
4. **Baseline in GSC/Analytics** (rankings, top pages, cannibalization pairs, CWV field data) — required input for every [VERIFY] item. Effort: S · Risk: none.

**Phase 1 — Positioning apex (highest business impact)**
5. **Create `/digitale-betriebssysteme` apex** + wire into nav/footer/internal links. Conv: high · SEO: high (new intent, additive) · Effort: M · Risk: low · Metric: rankings for transformation terms, apex-assisted conversions.
6. **Metric-backed SV Heinersreuth case study `/referenzen/sv-heinersreuth`.** Conv: high · SEO: med-high · Effort: M · Risk: low · Metric: case-study-assisted leads, backlinks.
7. **Homepage rewrite (§6).** Conv: high · SEO: low (no URL/canonical change) · Effort: M · Risk: low · Metric: homepage → Prozessanalyse conversion rate.

**Phase 2 — Qualified funnel & trust**
8. **`/kontakt` → qualified "Prozessanalyse" + qualification step.** Conv: high (lead quality) · SEO: low · Effort: M · Risk: low · Metric: % of leads ≥ €20k intent.
9. **`/sicherheit-datenschutz` procurement trust page.** Conv: med · SEO: low-med · Effort: S-M · Risk: low · Metric: procurement-stage progression.
10. **Reviews/placeholder hygiene + `/ueber-uns` E-E-A-T.** Conv: med · SEO: low-med · Effort: S · Risk: low.

**Phase 3 — SEO polish (data-gated)**
11. **Cannibalization resolution (Arzt/Praxis; webdesign head term)** — only per GSC. Effort: S-M · Risk: med (that's why it's gated) · Metric: consolidated ranking, no traffic loss.
12. **City-cluster duplication audit + differentiation** (`webdesign-kosten` ×3 etc.). Effort: M · Risk: low (improve, not remove).
13. **Service/CaseStudy structured data; `/scan` `/logo-preview` noindex; `/nuernberg` decision.** Effort: S-M · Risk: low.
14. **CWV / rendering optimization** if field data warrants (prerender apex + case study). Effort: M · Risk: low.

---

## 21. Exact files that would likely need to change (when approved)

> Listed for planning only — **no edits made.** Grouped by workstream.

**Routing & new pages**
- `src/App.tsx` — add routes: `/digitale-betriebssysteme`, `/referenzen/sv-heinersreuth`, `/impressum`, `/datenschutz`, `/sicherheit-datenschutz`, (opt.) `/nuernberg`.
- New: `src/pages/pillars/DigitaleBetriebssysteme.tsx`, `src/pages/referenzen/SvHeinersreuthCaseStudy.tsx`, `src/pages/legal/ImpressumPage.tsx`, `src/pages/legal/DatenschutzPage.tsx`, `src/pages/legal/SicherheitPage.tsx`.

**SEO infrastructure**
- `functions/_middleware.ts` — add `seoConfig` entries (title/description/canonical/OG/Twitter/keywords) for every new route + `/blog/:slug` handling.
- `src/config/seoConfig.ts` — **retire** (confirm unused) to remove the duplicate source.
- `public/sitemap.xml` — add `/blog`, blog posts, apex, case study, legal pages; refresh `lastmod` only for changed pages.
- `public/robots.txt` — no change needed (optionally note new legal pages are allowed).
- `index.html` — align default Datenschutz posture / consent for gtag; (opt.) add case-study OG image reference; `sameAs` when profiles exist.
- `src/components/CanonicalManager.tsx`, `src/components/PageSEO.tsx` — ensure new nested routes canonicalize correctly.

**Content & positioning**
- `src/pages/HomePage.tsx`, `src/components/HeroSection.tsx`, `src/components/ServicesSection.tsx`, `src/components/ProblemSection.tsx`, `src/components/FinalCTASection.tsx` — homepage system narrative + CTA.
- `src/pages/LeistungenPage.tsx` — reframe services as modules.
- `src/pages/ReferenzenPage.tsx` — summary card linking to the deep case study; keep `REAL_TESTIMONIAL`.
- `src/components/TestimonialBlock.tsx` / `src/pages/BewertungenPage.tsx` — placeholder hygiene on money pages.
- `src/pages/KontaktPage.tsx`, `src/components/ContactSection.tsx` — qualified Prozessanalyse + qualification fields.
- `src/pages/UeberUnsPage.tsx` — E-E-A-T uplift.

**Trust/legal**
- `src/components/Footer.tsx` — replace Impressum/Datenschutz **modals** with links to real URLs (keep modal optionally as a shortcut, but the URL must exist and be crawlable).

**Structured data**
- `src/components/LocalBusinessSchema.tsx` / `PublicStructuredData` (in `App.tsx`) — keep single Bayreuth LocalBusiness; add `Service` schema for city/module pages instead of implying multi-location LocalBusiness.

**Internal linking**
- `src/components/Navigation.tsx`, `src/components/Footer.tsx`, `src/components/RelatedPages.tsx` — add apex, case study, legal pages; descriptive anchors.

**Dangling data**
- `src/lib/seo-data.ts` — resolve `/nuernberg` in `LOCATION_PAGES` (build page or remove entry); add real `socialMedia`/`sameAs` when available.

---

### Guardrails (apply to every change)
- **Preserve first.** No existing URL is redirected/merged/noindexed/removed without the §19 matrix row **and** live GSC evidence (search intent, keyword, internal links, backlinks, indexed status, traffic, cannibalization risk, correct redirect target). Prefer improving a page over removing it.
- **Additive positioning.** The operating-system layer sits *above* the keyword layer; it does not replace it.
- **No fabrication.** No invented statistics, client results, offices, certifications, or reviews. Distinguish physical location (Bayreuth) vs service area (München/Regensburg/remote) vs customer location (Heinersreuth region) vs target market everywhere.
- **Every major change is measured** (conversion impact, SEO impact, effort, risk, success metric — as tabulated in §20).
