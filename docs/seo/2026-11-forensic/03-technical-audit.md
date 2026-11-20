# 03 — Technical SEO audit of the live site (cogniiq.de)

Date of measurement: 2026-11-20, 08:15–08:35 UTC. Auditor: technical SEO agent. Research only; no repo file other than this one was changed.

**Method.** Every URL of the live sitemap plus the three non-indexable manifest routes (89 routes) was fetched with `curl` (default UA, no spoofing) on **both** `https://www.cogniiq.de` and `https://cogniiq.de` (GET) and with HEAD on www; raw HTML was parsed with BeautifulSoup (no JS). All 89 routes were then rendered in headless Chromium (Playwright, `networkidle` + 1.5 s) and the hydrated DOM compared to the raw HTML. Redirect rules, soft-404 behaviour and private surfaces were probed individually (39 probes). The internal link graph was built from raw-HTML `<a href>` only. Scripts and raw data: `/tmp/claude-0/-home-user-Cogniiq-Main/9a9701d6-f26f-5cdb-b187-a17e29811981/scratchpad/tech/` (`parse.py`, `analyze.py`, `ld.py`, `render.cjs`, `nav.cjs`, `parsed.json`, `rendered.json`, `redirects.txt`).

`npm run build` was **not** run: the prerender pipeline was understood from source (`package.json` build script → `scripts/generate-sitemap.mjs`, `scripts/prerender.mjs`, `src/lib/routing/publicRoutes.ts`, `routeMetadata.ts`, `src/components/PageSEO.tsx`, `functions/_middleware.ts`), and the live output was verified to match the repo manifest (83 manifest titles parsed, 0 mismatches against live `<title>`; live `sitemap.xml` is byte-identical to `public/sitemap.xml`). The deployed build therefore corresponds to the current `main` manifest.

Limits: the repo clone is **shallow** (190 commits, oldest 2026-08-26), so git-history statements only cover 2026-08-26 → 2026-11-04.

---

## 1. Executive summary

**No technical defect was found that can plausibly explain a sitewide organic click drop.** Indexability, status codes, canonicals, prerendering, redirects, 404 handling, sitemap/robots and hydration are in unusually clean condition:

- 89/89 routes return 200 on GET and HEAD; 86/86 sitemap URLs are 200, indexable, self-canonical; the 3 noindex routes are not in the sitemap.
- Full content, H1, head tags, JSON-LD and internal links are in the raw HTML (SSR/prerender). Hydration does not change title, description, canonical, robots or H1 on any of the 89 routes.
- Unknown URLs return a real 404; the four retired URLs 301 in one hop to a 200 indexable target.
- All host signals point consistently at the apex `https://cogniiq.de` (see §2).

Defects found are low/medium severity and local in scope (ranked in §3): FAQ answers absent from the HTML body on 46–49 pages (incl. `/faq`, whose body is 103 words), a sitewide link to a 404 injected by Cloudflare Email Obfuscation, stale sitemap `lastmod`, noindex pages receiving contextual links from priority pages, incomplete `Article` schema on 5 pages, one reproducible React hydration error, and minor head inconsistencies.

If a click drop exists, the technical layer points to **non-technical or change-history causes** that are outside this audit but visible in the repo: between 2026-09-12 and 2026-10-23 four URLs were retired and 301-redirected, titles were changed on many routes ("stale titles", "graduated experiments"), and on 2026-10-24/11-04 the pricing content of the whole KI-Telefonassistent cluster was rewritten. Those are deliberate content/architecture changes, not malfunctions; their effect must be judged from GSC data by the other workstreams.

---

## 2. Canonical host architecture (mandatory scope)

**Question:** which host is the intended canonical, and are the signals consistent?

| # | Signal | Host used | Evidence |
|---|---|---|---|
| 1 | Source: canonical generation | **apex** | `src/lib/routing/publicRoutes.ts:30` `export const SITE_ORIGIN = 'https://cogniiq.de'`; `routeMetadata.ts` keys on `SITE_ORIGIN`; `PageSEO.tsx:120-134` writes canonical / hreflang / og:url from the canonical prop; `index.html:49,61,68,69,72` hard-codes `https://cogniiq.de/` |
| 2 | Prerender output, raw live HTML | **apex** on both hosts | For all 89 paths fetched on both hosts: status, `<title>`, robots, canonical, og:url and byte length are identical (0 mismatches). Canonical = `https://cogniiq.de<path>` in 89/89, og:url identical to canonical in 89/89. Bodies differ only in the per-request Cloudflare email-obfuscation token (2 tokens per page; the same variation occurs between two requests to the same host) |
| 3a | Sitemap `<loc>` (live and repo) | **apex** | 86/86 `<loc>` and all `xhtml:link` on `https://cogniiq.de/...`; live file identical to `public/sitemap.xml`; served identically from both hosts (same ETag `d8db3c75…`) |
| 3b | robots.txt `Sitemap:` line | **apex** | `Sitemap: https://cogniiq.de/sitemap.xml` (live, both hosts, and `public/robots.txt`) |
| 4 | JSON-LD `url` / `@id` / breadcrumb `item` | **apex** | 0 occurrences of `www.cogniiq.de` in any JSON-LD block on 89 pages; `@id` scheme `https://cogniiq.de/#organization`, `#website`, `<url>#webpage` |
| 5 | Internal links in HTML | host-relative | 0 absolute internal links; every internal `<a href>` is root-relative (`/praxen`), so links stay on whatever host was requested. 0 occurrences of the string `www.cogniiq.de` in 178 fetched documents, sitemap and robots.txt |
| 6 | Google-indexed host | **apex** | Per coordinator: GSC `sc-domain` export lists all landing pages as `https://cogniiq.de/...` |
| 7 | Cloudflare config in repo | **no host rule in either direction** | `wrangler.jsonc` has only `name`, `compatibility_date`, `assets` (no `routes`, no custom-domain block); `public/_redirects` has only path rules with relative targets; `functions/_middleware.ts` never inspects the hostname; `public/_headers` has only path rules. `git log -S'www.cogniiq'` returns only the two oldest commits of the shallow clone and the only non-doc hit in the tree is a test fixture (`.github/scripts/fixtures/premium-offer-fixture.mjs:76`, a PDF offer fixture, not routing). `git log -S'//cogniiq.de'` on index.html/robots/sitemap/routes/_redirects/functions shows only content commits; no commit in the visible history (since 2026-08-26) adds or removes a host redirect |

Live behaviour:

| Request | Result |
|---|---|
| `GET https://cogniiq.de/` | 200, canonical `https://cogniiq.de/` (self) |
| `GET https://www.cogniiq.de/` | 200, same document, canonical `https://cogniiq.de/` (cross-host) |
| `GET https://www.cogniiq.de/referenzen` | 301 → `Location: /ueber-uns` (relative, stays on www) → 200 with canonical on apex |
| `http://…` (either host) | NOT TESTABLE FROM HERE (sandbox blocks plain HTTP) |

**Verdict.** The intended and actually implemented canonical host is the **apex `https://cogniiq.de`**. Source, prerendered HTML, og:url, hreflang, sitemap, robots.txt, JSON-LD and Google's index all agree. **There are no mixed signals** — not a single canonical, sitemap entry, schema value or link points at www. `https://cogniiq.de/ → 200` is correct behaviour, not a defect. (The brief's premise "non-www → www" is inverted: www is the secondary host.)

`https://www.cogniiq.de/*` answering 200 instead of redirecting is a **duplicate host mitigated by a consistent cross-host canonical** → classified **OPPORTUNITY**, not DEFECT. A 301 www→apex would make the consolidation a directive instead of a hint and would remove the (small) risk that links to www are counted against a duplicate; it cannot explain a click drop, because Google has demonstrably selected the apex. No routing change is recommended by this audit; the owner should only confirm the current state in the Cloudflare dashboard.

Cannot be verified from here: Cloudflare dashboard Redirect Rules / Bulk Redirects / Page Rules (none is visibly active on HTTPS, since www returns 200); "Always Use HTTPS" and the `http://` → `https://` behaviour on both hosts; HSTS is **not** sent on HTTPS responses (no `strict-transport-security` header observed); which hosts are attached as custom domains to the Pages project; whether GSC also has a `www` URL-prefix property showing indexed www URLs.

---

## 3. Defects (ranked by severity)

None of the defects below is rated capable of explaining a recent sitewide click drop on its own. "Drop-explanatory?" states that explicitly per item.

### D1 — FAQ answers exist only in JSON-LD, not in the HTML body (46 pages fully, 3 partially) — MEDIUM

- **FACT.** 70 pages emit `FAQPage` JSON-LD. On 46 of them none of the `acceptedAnswer.text` strings occurs in the raw-HTML body text; on 3 more (`/ki-telefonassistent` 10/13, `/bayreuth/ki-telefonassistent` 9/11, `/regensburg/ki-telefonassistent` 9/10) most are missing. 21 pages are clean. The accordion renders only the questions; answers are mounted on click.
- **EVIDENCE.** `/faq`: the first answer ("Das hängt von Ziel und Umfang ab. Wir arbeiten nicht mit pauschalen Paketpreisen…") occurs exactly once in the 71.9 KB document — inside `<script type="application/ld+json">`. Raw `<main>` text of `/faq` is **103 words** (H1, 8 question titles, CTA); 18 `aria-expanded="false"` buttons. Rendered `innerText` of `<main>` is also 103 words. Affected set includes `/`, `/faq`, all 24 city×service pages, the 9 `webdesign-<branche>-<stadt>` pages (full list: `ld.py`).
- **HYPOTHESIS (SEO impact).** (a) Google's structured-data policy requires FAQ markup content to be visible on the page; markup without on-page content is a spam-policy/eligibility risk (manual action "structured data issue" in the worst case, more commonly just ignored). (b) The answer text — several hundred words per page, often the most query-matching copy (costs, duration, technology) — is not indexable body content. `/faq` is effectively a thin page. (c) For AI Overviews / passage ranking the answers are not available as passages.
- **ALTERNATIVE EXPLANATION.** Google restricted FAQ rich results to authoritative gov/health sites in 2023, so the rich-result loss is nil; Google may still read JSON-LD text for understanding. The matching in this audit is a 60-character prefix match on whitespace-normalised text; the 3 "partial" pages may include formatting mismatches rather than truly missing answers.
- **CONFIDENCE.** High for the fact; low–medium for measurable ranking impact.
- **FALSIFY.** A raw-HTML `curl https://cogniiq.de/faq | grep "pauschalen Paketpreisen"` hit outside the JSON-LD block; or GSC URL Inspection "View crawled page" showing the answers in rendered HTML.
- **RECOMMENDED ACTION.** Render answers in the DOM in collapsed state (`hidden`/`details` or CSS-collapsed) so SSR HTML contains them; keep JSON-LD in sync from the same source.
- **Drop-explanatory?** No, unless this accordion behaviour was introduced shortly before the drop (check git history of `FAQSection` — then the affected pages would have lost a large share of indexable text at once; worth a dated check by the change-history workstream).

### D2 — Sitewide link to a 404 (`/cdn-cgi/l/email-protection`) and mangled e-mail text, injected by Cloudflare Email Obfuscation — LOW–MEDIUM

- **FACT.** Cloudflare rewrites the footer `mailto:` link on every page into `<a href="/cdn-cgi/l/email-protection#…">` and replaces the visible address with `[email protected]`; it also appends `<script data-cfasync="false" src="/cdn-cgi/scripts/5c5dd728/cloudflare-static/email-decode.min.js">`.
- **EVIDENCE.** 89/89 raw documents contain the link; `GET https://www.cogniiq.de/cdn-cgi/l/email-protection` → **404**. Raw footer text: "…Deutschland. [email protected] 0160 1832917". `robots.txt` does not disallow `/cdn-cgi/`. The token changes on every request, so the HTML body is never byte-stable.
- **HYPOTHESIS.** One internal link per page to a 404 (89 inlinks; shows up as "Not found (404)" in GSC and wastes a little crawl); the NAP e-mail is not machine-readable in HTML for non-JS consumers (it remains correct in JSON-LD); a third-party script mutates server-rendered markup before React hydrates (no hydration warning observed from it).
- **ALTERNATIVE.** Googlebot is known to handle `/cdn-cgi/` paths gracefully; impact is likely negligible.
- **CONFIDENCE.** High (fact) / low (impact).
- **FALSIFY.** The link absent in GSC "View crawled page" (Cloudflare may skip obfuscation for verified bots — not testable here without UA/IP of Googlebot).
- **ACTION.** Disable Scrape Shield → Email Address Obfuscation in the Cloudflare dashboard (or wrap the address in `<!--email_off-->`), or add `Disallow: /cdn-cgi/` to robots.txt.
- **Drop-explanatory?** No.

### D3 — Sitemap `lastmod` is stale for substantially changed pages — LOW

- **FACT.** 65 of 86 URLs carry `<lastmod>2026-03-14</lastmod>`. Pages rewritten later still carry it.
- **EVIDENCE.** `/kosten-ki-telefonassistent` → `2026-03-14`, although commits 98ca6dd / 2936360 (2026-10-24) and 4516338 / 29e37c9 (2026-11-04) replaced its pricing model; `/` → `2026-03-14`; `/ki-telefonassistent-arzt`, `/ki-telefonassistent-praxis` → `2026-03-14` despite 6e0ba3d (2026-10-23) "strengthen the priority pages". `lastmod` is a hand-maintained manifest field (`publicRoutes.ts`, `generate-sitemap.mjs:15`).
- **HYPOTHESIS.** Google uses `lastmod` only when it is consistently accurate; stale values mean the sitemap gives no recrawl hint, so the new prices/titles may be picked up later than necessary. SERP snippets could show superseded prices in the meantime.
- **ALTERNATIVE.** Google recrawls an 86-URL site frequently regardless.
- **CONFIDENCE.** High (fact) / low (impact). **FALSIFY:** GSC "Last crawl" for these URLs later than 2026-11-04.
- **ACTION.** Update `lastmod` in the manifest whenever a route's content changes (ideally asserted by a test comparing against the last content commit).
- **Drop-explanatory?** No.

### D4 — Indexable priority pages link contextually to `noindex, nofollow` pages that also declare a self-canonical — LOW

- **FACT.** `/integrationen` and `/datenschutz-sicherheit` are 200, `meta robots: noindex, nofollow`, with `rel=canonical` to themselves and full WebPage/Breadcrumb JSON-LD; `/anfrage-erhalten` likewise (noindex, 0 inlinks — fine).
- **EVIDENCE.** `/datenschutz-sicherheit` is linked from `/praxen`, `/ki-telefonassistent`, the three city KI pages and more; `/integrationen` from `/ki-telefonassistent`, `/prozessautomatisierung`, `/kosten-automatisierung`, `/datenschutz-sicherheit` (4 inlinks). Not in sitemap (correct).
- **HYPOTHESIS.** Trust/"how it integrates" content that buyers in the practice cluster look for is withheld from the index (intentional per COPY-BRIEF-2 Phase 0, owner input pending), and link equity sent there is dropped (`nofollow` on a noindex page). noindex + canonical is a mildly contradictory pair.
- **ALTERNATIVE.** This is a deliberate hold, not a malfunction — then it is an OPPORTUNITY awaiting the owner's answer.
- **CONFIDENCE.** High (fact). **FALSIFY:** n/a (deliberate per manifest `indexable: false`).
- **ACTION.** Decide; once the content is verified, set `indexable: true`. Until then use `noindex, follow`.
- **Drop-explanatory?** Only if these pages were indexable and ranking before and were switched to noindex near the drop date — check manifest history (`git log -S'indexable: false' -- src/lib/routing/publicRoutes.ts`).

### D5 — `Article` JSON-LD without `datePublished`, `dateModified`, `image` on 5 pages — LOW

- **EVIDENCE.** `/verpasste-anrufe-verlust`, `/keine-anfragen-website`, `/keine-terminbuchung-online`, `/zu-viel-manuelle-arbeit`, `/digitale-automatisierung-unternehmen`: `Article` node has `headline`/`author` (Organization) only. The 12 other Article pages have dates. These five also have only 311–440 words of main text.
- **HYPOTHESIS.** Not eligible for Article enhancements; no date signal. Cosmetic.
- **CONFIDENCE.** High. **ACTION.** Add dates/image or drop the `Article` type on these problem pages. **Drop-explanatory?** No.

### D6 — Reproducible React error #421 on `/bayreuth/webdesign` — LOW

- **EVIDENCE.** `pageerror: Minified React error #421` (a Suspense boundary received an update before it finished hydrating → React falls back to client rendering for that boundary) in 4 of 4 loads of `https://www.cogniiq.de/bayreuth/webdesign`; 0 of the other 88 routes. Content, head tags and links after hydration are intact (rendered main 1 302 words vs 1 303 raw).
- **HYPOTHESIS.** No indexing impact (raw HTML complete); small INP/CLS risk on that page.
- **ALTERNATIVE.** Could be timing-dependent in headless Chromium; but it did not occur on the sibling pages `/muenchen/webdesign`, `/regensburg/webdesign`.
- **CONFIDENCE.** Medium. **ACTION.** Wrap the offending state update in `startTransition` / inspect the lazy section unique to that page. **Drop-explanatory?** No.

### D7 — Minor head inconsistencies between raw and hydrated homepage — COSMETIC

- **EVIDENCE.** Raw `/`: `hreflang="x-default"` present and `og:url="https://cogniiq.de/"`. After hydration: `x-default` link is gone and `og:url="https://cogniiq.de"` (no slash). Cause: `PageSEO.tsx:125` compares `canonical === BUSINESS_INFO.website + '/'` and the homepage passes the canonical without trailing slash. Sitemap still declares x-default. hreflang on a single-language site is redundant anyway.
- **Drop-explanatory?** No.

### D8 — City hub pages and `/faq` are thin in served HTML — LOW (content, noted for completeness)

- **EVIDENCE.** Main-content words in raw HTML: `/muenchen` 111, `/regensburg` 132, `/bayreuth` 138, `/faq` 103, `/ki-telefonassistent/demo` 210. Each hub is one paragraph plus link tiles. These hubs are sitewide-linked (88 inlinks each) and at depth 1, i.e. they receive the most internal equity of the local cluster and have the least content. Their raw H1 also contains a stray space before the colon ("Cogniiq in Bayreuth : KI-…") caused by an inline element boundary.
- **Drop-explanatory?** Not as a technical fault; relevant to the content/quality workstream.

---

## 4. Opportunities

| # | Opportunity | Evidence |
|---|---|---|
| O1 | 301 `www` → apex (dashboard rule) so the duplicate host is consolidated by directive, not only by canonical | §2 |
| O2 | Send HSTS | no `strict-transport-security` header on any response |
| O3 | Hashed assets are served `cache-control: public, max-age=14400, must-revalidate` instead of `max-age=31536000, immutable` (contrary to the comment in `_headers`, which assumes long-lived caching) | `/assets/index-C0TwAoqa.js`, `/assets/index-FV2pDUR2.css` |
| O4 | Homepage loads `react-spline-BJuxx2w1.js` = **595 KB brotli** on desktop (plus a scene from `prod.spline.design`); total homepage transfer 926 KB / 43 requests vs ≈300 KB / 13–14 requests on `/praxen` and `/kosten-ki-telefonassistent`. Not requested on a Pixel-7 mobile profile (41 requests, no spline), so mobile-first indexing/CWV is unaffected | `rendered.json`, `nav.cjs` |
| O5 | Entry bundle `index-C0TwAoqa.js` 199 KB br on every page; 37 `modulepreload` hints on the homepage | raw `<head>` |
| O6 | Title length: 68/89 titles > 60 chars, 36 > 70; ≈60 exceed ~580 px (estimate) and will be truncated/rewritten in SERPs, e.g. `/` (84), `/ki-telefonassistent-restaurant` (83), `/bayern/ki-telefonassistent` (83), `/automatisierung-arzt` (83) | appendix |
| O7 | Descriptions: 39/89 > 160 chars; longest `/regensburg/ki-telefonassistent` 237, `/bayreuth/ki-telefonassistent` 216, `/kosten-webdesign` 208, `/blog/ki-telefonassistent-restaurant` 208 | appendix |
| O8 | Uppercase URL variants return 404 (`/Praxen`, `/KI-Telefonassistent`) rather than 301 to lowercase. Correct, but a redirect would rescue mistyped inbound links | `redirects.txt` |
| O9 | `/404` (the 404 document's own pretty path) returns 200 with `noindex, nofollow` meta but without the `X-Robots-Tag` that `_headers` sets only for `/404.html`. Harmless (noindex meta present, not linked) | `redirects.txt` |
| O10 | Weakly linked blog posts: `/blog/webdesign-agentur-auswahl` 1 inlink, `/blog/digitalisierung-mittelstand` 2, `/blog/ki-telefonassistent-restaurant` 2, `/blog/prozessautomatisierung-roi` 3, `/blog/verpasste-anrufe-kosten` 3 | `analyze.py` |
| O11 | Internal link distribution is footer/nav-dominated: 42 targets are linked from all 89 pages, including low-priority ones (`/muenchen/webdesign-kosten`, `/bayreuth/website-relaunch`, `/regensburg/website-relaunch`, 4 `automatisierung-<branche>`), each page carries 76–143 links. Priority pages are not differentiated from secondary ones by inlink count (all 88) | `analyze.py` |
| O12 | Live robots.txt is prefixed by Cloudflare's managed block (not in repo): `Content-Signal: search=yes,ai-train=no,use=reference` and `Disallow: /` for GPTBot, ClaudeBot, CCBot, Google-Extended, **GoogleOther**, Applebot-Extended, meta-externalagent, Bytespider, Amazonbot etc. Googlebot/Bingbot are not blocked, so classic search is unaffected; Google-Extended controls Gemini grounding/training, not Search or AI Overviews. Owner decision whether AI-assistant visibility is wanted | `live-robots.txt` |
| O13 | `Crawl-delay` lines for Googlebot (ignored by Google) and a dedicated `User-agent: Googlebot` group that contains only `Allow: /` — meaning the `Disallow: /api/ /_debug/ /preview/ /__/` rules of the `*` group do **not** apply to Googlebot. Those paths 404, so no exposure | `robots.txt` |
| O14 | `meta keywords`, `geo.*`, `content-language` meta tags are ignored by Google (no harm) | raw `<head>` |
| O15 | `Organization` appears 2–3× in JSON-LD on 27 pages (inline `provider`/`publisher` objects without `@id` next to the `@graph` node). Not invalid; referencing `{"@id": "https://cogniiq.de/#organization"}` would be cleaner | `ld.py` |

---

## 5. No issue — checked and found clean

| Area | What was checked | Result |
|---|---|---|
| Status codes | GET on 89 routes × 2 hosts, HEAD on 89 (www) | 267/267 = 200; HEAD and GET agree on status, `content-type: text/html; charset=utf-8`, `cache-control: no-cache` |
| Sitemap ↔ manifest | live `sitemap.xml` vs `public/sitemap.xml` vs `PUBLIC_ROUTE_PATHS` | live = repo (identical); 86 `<loc>` = 89 manifest routes minus exactly the 3 `indexable:false` routes; valid XML, `application/xml` |
| Sitemap URLs | status, robots, canonical | 86/86 200, indexable, canonical self-referential (apex), none redirects |
| In sitemap but noindex / indexable but not in sitemap | both directions | none / none |
| Canonical | count and value | exactly 1 per page, absolute, self-referential, 89/89; unaffected by query strings (`/praxen?utm_source=x`, `/?foo=bar` → canonical without query) and by `//praxen` |
| Meta robots / X-Robots-Tag | all public routes | `index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1` on 86; no `X-Robots-Tag` on any public route; no accidental noindex |
| Title / description / H1 | presence, count, duplicates | exactly 1 title, 1 description, 1 H1 on 89/89; **0 duplicate titles, 0 duplicate descriptions, 0 duplicate H1s** |
| og / twitter | og:title = title, og:description = description, og:url = canonical, og:image | consistent on 89/89 (raw); og:image `https://cogniiq.de/og-image.png` |
| `html lang`, hreflang | | `lang="de"` 89/89; `hreflang="de-DE"` self-referential 89/89 |
| SSR / prerender | raw vs rendered | main content, H1, nav and footer links present without JS on all 89; raw `<main>` word count ≈ rendered `innerText` word count (e.g. `/praxen` 4 448 vs 4 277, `/kosten-ki-telefonassistent` 4 441 vs 4 269, `/ki-telefonassistent` 5 152 vs 4 981, `/prozessautomatisierung` 2 958 vs 2 957, `/webdesign-hotel` 789 vs 788, `/regensburg/website-relaunch` 520 vs 518, `/` 1 346); link counts equal ±3; with JS disabled `/praxen` shows 4 277 words, H1 visible, 0 text blocks stuck at `opacity:0` |
| Hydration vs head | title, description, canonical, robots, H1, JSON-LD count | unchanged on 89/89 (only D7 on the homepage); no hydration-mismatch warnings; only D6 as page error |
| Client-side navigation | `/`→`/praxen`→`/kosten-ki-telefonassistent`, `/integrationen`→`/webdesign` | title, description, canonical, og:url, robots and hreflang update correctly; a noindex page does not leak noindex into the next route |
| Console / network | 89 routes | only failures are sandbox-blocked third parties (`static.cloudflareinsights.com` beacon, `prod.spline.design`) — not site findings; 0 failed first-party requests, 0 first-party 4xx/5xx; all requests first-party otherwise (no Google tag before consent) |
| Soft 404 | `/this-is-nonsense-xyz-123`, `/blog/nonexistent-post`, `/bayreuth/nonsense`, `/preview/x`, `/api/x`, `/automatisierung-unternehmen/foo`, `/sitemap.xml/` | real **404**, 62.9 KB "Seite nicht gefunden (404)" document, `noindex, nofollow`, no canonical; missing asset → 404 `no-store` |
| Legacy redirects (`_redirects` ↔ `legacyRedirects.ts`) | 8 rules (4 sources × slash/no slash), both hosts | all **301**, one hop, targets `/prozessautomatisierung`, `/ueber-uns`, `/webdesign` are 200 + indexable + in sitemap; no chains; no retired URL in sitemap; 0 internal links to redirecting URLs |
| Trailing slash / `.html` | `/ki-telefonassistent/`, `/praxen.html`, `/index.html` | 308 → clean path, one hop (permanent) |
| Private surfaces | `/app`, `/app/login`, `/admin`, `/admin/finance`, `/owner`, `/auth/confirm`, `/d/abc123`, `/app-shell` | 200 app shell (4.9 KB), `X-Robots-Tag: noindex, nofollow` + noindex meta, no canonical, not in sitemap. Only `/app/login` is linked (header "Kundenlogin", sitewide) |
| Internal link graph | raw-HTML crawl from `/` | all 88 other public routes reachable; depth 1: 51, depth 2: 36, max depth 2; **0 orphans** among sitemap URLs; 0 links to 3xx; 0 internal `nofollow`; only non-route targets: `/app/login` (noindex shell) and D2 |
| JSON-LD validity | 400+ blocks on 89 pages | 0 invalid JSON; Organization, LocalBusiness/ProfessionalService, WebSite, WebPage, BreadcrumbList on all 89; breadcrumb positions sequential, items absolute apex URLs, last item = page URL; no `AggregateRating`/`Review` markup anywhere (no fabricated-rating risk) |
| Price / offer consistency | `/kosten-ki-telefonassistent` `Service.offers` vs visible text and vs cluster pages | JSON-LD 300 / 500 / 800 EUR per month (`valueAddedTaxIncluded:false`), 990 EUR setup, 0,50 € overage — all present verbatim in visible body; same figures on `/`, `/praxen`, `/ki-telefonassistent`, `/ki-telefonassistent-arzt`, `/bayreuth/ki-telefonassistent`; no conflicting legacy price found on the sampled cluster pages; meta description states the same "Ab 300 € netto … 990 €" |
| pages.dev contamination | grep of 178 live documents, live sitemap, live robots; grep of `src/`, `functions/`, `public/`, `scripts/`, `index.html` | **0** occurrences live; in the repo only `RELEASE_CHECKLIST.md` mentions it. Canonicals are hard-wired to the apex, so a preview host would canonicalise to production |
| Images | `alt` attribute | 0 `<img>` without `alt` on 89 pages |
| Deployed build = repo | live titles vs manifest | 0 mismatches |
| robots.txt | live vs repo | repo content served unchanged after the Cloudflare-managed prefix (O12); `Allow: /` for `*`, Googlebot, Bingbot; sitemap line correct |

---

## 6. Preview-host (pages.dev) protection — partially verifiable

There is **no** logic in `functions/_middleware.ts` or `public/_headers` that sets `X-Robots-Tag: noindex` based on hostname; a `*.pages.dev` deployment would be served with `index, follow`. It is protected only indirectly: every document's canonical, og:url, hreflang, JSON-LD and the sitemap are hard-coded to `https://cogniiq.de`. Cloudflare Pages adds `X-Robots-Tag: noindex` automatically on **preview** deployment aliases (`<hash>.<project>.pages.dev`) but **not** on the production alias `<project>.pages.dev`. Whether `cogniiq-main.pages.dev` (or similar) is publicly reachable and indexed is NOT TESTABLE FROM HERE → OPPORTUNITY: verify with `site:pages.dev "Cogniiq"` and, if reachable, add a hostname-based noindex or redirect.

---

## 7. Not testable from this sandbox (for the owner)

1. `http://cogniiq.de` and `http://www.cogniiq.de` → HTTPS redirect (status, hops, target host).
2. `*.pages.dev` production/preview hosts: reachability, `X-Robots-Tag`, whether indexed.
3. Cloudflare dashboard: Redirect Rules, Bulk Redirects, Page Rules, custom-domain list, "Always Use HTTPS", HSTS, Email Obfuscation, Bot Fight Mode / WAF / managed challenge.
4. What Googlebot actually receives (verified-bot IPs): possible Cloudflare bot challenge or different handling of email obfuscation — check GSC URL Inspection → "View crawled page" + HTTP response for `/`, `/praxen`, `/kosten-ki-telefonassistent`; check GSC Crawl Stats for 5xx/403/429 spikes and host status.
5. GSC Page-indexing report (duplicate/alternate canonical counts, "Crawled – currently not indexed", 404 for `/cdn-cgi/l/email-protection`), manual actions, and whether a `www` property shows indexed URLs.
6. Core Web Vitals field data (CrUX), Lighthouse; the Spline scene and the Cloudflare Insights beacon could not load here.
7. Google Rich Results Test / Schema validator (external hosts blocked); JSON-LD was validated structurally only.
8. External backlinks pointing at www or at retired URLs.
9. Git history before 2026-08-26 (shallow clone): when the apex was chosen and whether a host redirect ever existed.

---

## 8. Appendix — per-URL table (host `www.cogniiq.de`, identical on apex)

Inlinks = number of other public pages linking to the URL in raw HTML. Depth = clicks from `/`. Raw words = whole body (main only). Rendered = `innerText` words of `<main>` after hydration.

| URL | St | Title (chars) | Desc len | Canonical | Robots | H1 | Inlinks | Depth | Raw words (main) | Rendered main words | In sitemap |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `/` | 200 | Cogniiq – KI-Telefonassistent, Webdesign & Automatisierung für Unternehmen in Bayern (84) | 170 | self (apex) | index,follow | Erreichbar, wenn niemand frei ist. | 88 | 0 | 1570 (1346) | 1338 | yes |
| `/leistungen` | 200 | Leistungen \| KI-Telefonassistent, Webdesign & Automatisierung – Cogniiq (71) | 157 | self (apex) | index,follow | Digitale Systeme, die Umsatz erzeugen und Arbeit eliminieren. | 88 | 1 | 942 (718) | 717 | yes |
| `/kontakt` | 200 | Kostenloses Erstgespräch vereinbaren – Cogniiq \| KI-Agentur Bayern (66) | 172 | self (apex) | index,follow | KI-Systeme für Ihr Unternehmen besprechen | 88 | 1 | 647 (423) | 422 | yes |
| `/ueber-uns` | 200 | Über Uns \| KI-Agentur Bayreuth – Lazar & Djordje Popovic – Cogniiq (66) | 166 | self (apex) | index,follow | Wer hinter Cogniiq steckt. | 88 | 1 | 849 (625) | 624 | yes |
| `/faq` | 200 | FAQ – Kosten, Ablauf & KI-Systeme \| Cogniiq Bayreuth (52) | 166 | self (apex) | index,follow | Häufige Fragen zu Kosten, Ablauf und KI-Systemen | 88 | 1 | 327 (103) | 103 | yes |
| `/praxen` | 200 | KI Telefonassistent für Praxen – Ihr Empfang \| Cogniiq (54) | 151 | self (apex) | index,follow | KI-Telefonassistent für Praxen: ein Empfang am Telefon, der Anliegen erledigt. | 88 | 1 | 4672 (4448) | 4277 | yes |
| `/integrationen` | 200 | Anbindungen an Ihr System \| Cogniiq (35) | 194 | self (apex) | noindex,nofollow | Anbindung an Ihr System | 4 | 2 | 1064 (840) | 840 | no |
| `/datenschutz-sicherheit` | 200 | Datenschutz & Sicherheit – die Prüfpunkte \| Cogniiq (51) | 143 | self (apex) | noindex,nofollow | Datenschutz und Sicherheit | 6 | 2 | 1064 (840) | 839 | no |
| `/ki-telefonassistent` | 200 | KI Telefonassistent für Unternehmen – Anrufe erledigen \| Cogniiq (64) | 155 | self (apex) | index,follow | KI-Telefon­assistent für Unternehmen: Anrufe nicht nur annehmen. Anliegen erledigen. | 88 | 1 | 5376 (5152) | 4981 | yes |
| `/webdesign` | 200 | Webdesign Agentur – Websites für Unternehmen \| Cogniiq (54) | 145 | self (apex) | index,follow | Webdesign für Unternehmen: Websites mit einem klaren Auftrag | 88 | 1 | 2627 (2403) | 2399 | yes |
| `/prozessautomatisierung` | 200 | Prozessautomatisierung für Unternehmen \| Abläufe automatisieren – Cogniiq (73) | 194 | self (apex) | index,follow | Geschäftsprozesse automatisieren — mit Ausnahmen, die jemand sieht | 88 | 1 | 3182 (2958) | 2957 | yes |
| `/ki-agentur-deutschland` | 200 | KI Agentur Deutschland \| AI-Systeme für Unternehmen – Cogniiq (61) | 137 | self (apex) | index,follow | KI Agentur Deutschland – Telefonassistent & Automatisierung für Ihr Unternehmen | 88 | 1 | 1200 (976) | 974 | yes |
| `/ki-telefonassistent/demo` | 200 | KI-Telefonassistent Demo \| Live-Vorführung AI-Rezeptionistin – Cogniiq (70) | 188 | self (apex) | index,follow | Demo-Termin anfragen | 88 | 1 | 434 (210) | 235 | yes |
| `/ki-telefonassistent-einfuehren` | 200 | KI-Telefonassistent in der Praxis einführen \| Cogniiq (53) | 154 | self (apex) | index,follow | Einen KI-Telefonassistenten in der Praxis einführen | 88 | 1 | 2396 (2172) | 2163 | yes |
| `/ki-telefonassistent-zahnarztpraxis` | 200 | KI-Telefonassistent in der Zahnarztpraxis: Anrufe und Grenzen \| Cogniiq (71) | 166 | self (apex) | index,follow | KI-Telefonassistent in der Zahnarztpraxis: welche Anrufe er übernimmt und welche nicht | 88 | 1 | 2705 (2481) | 2471 | yes |
| `/deutschland` | 200 | AI-Systeme & Webdesign für Unternehmen in Deutschland \| Cogniiq (63) | 164 | self (apex) | index,follow | Webdesign, KI-Telefonassistent & Automatisierung in Deutschland | 88 | 1 | 1473 (1249) | 1246 | yes |
| `/bayern` | 200 | AI-Systeme & Webdesign für Unternehmen in Bayern \| Cogniiq (58) | 164 | self (apex) | index,follow | KI Agentur Bayern – Webdesign, KI-Telefonassistent & Automatisierung | 88 | 1 | 1612 (1388) | 1386 | yes |
| `/bayern/ki-telefonassistent` | 200 | KI-Telefonassistent Bayern \| AI-Rezeptionistin für bayerische Unternehmen – Cogniiq (83) | 154 | self (apex) | index,follow | KI Telefonassistent für Unternehmen in Bayern | 5 | 2 | 1030 (806) | 629 | yes |
| `/bayreuth` | 200 | Cogniiq in Bayreuth – KI-Telefonassistent, Websites & Automatisierung (69) | 158 | self (apex) | index,follow | Cogniiq in Bayreuth : KI-Telefonassistent, Websites und Automatisierung | 88 | 1 | 362 (138) | 136 | yes |
| `/muenchen` | 200 | Cogniiq in München – KI-Telefonassistent, Websites & Automatisierung (68) | 154 | self (apex) | index,follow | Cogniiq in München : KI-Telefonassistent, Websites und Automatisierung | 88 | 1 | 335 (111) | 109 | yes |
| `/regensburg` | 200 | Cogniiq in Regensburg – KI-Telefonassistent, Websites & Automatisierung (71) | 134 | self (apex) | index,follow | Cogniiq in Regensburg : KI-Telefonassistent, Websites und Automatisierung | 88 | 1 | 356 (132) | 130 | yes |
| `/bayreuth/webdesign` | 200 | Webdesign Agentur Bayreuth – Website erstellen & SEO \| Cogniiq (62) | 180 | self (apex) | index,follow | Webdesign Agentur in Bayreuth | 88 | 1 | 1527 (1303) | 1302 | yes |
| `/bayreuth/ki-telefonassistent` | 200 | KI Telefonassistent Bayreuth – AI Rezeption & Anrufannahme \| Cogniiq (68) | 216 | self (apex) | index,follow | KI Telefonassistent in Bayreuth | 23 | 1 | 2095 (1871) | 1869 | yes |
| `/bayreuth/automatisierung` | 200 | Prozessautomatisierung Bayreuth \| KI-Workflows für lokale Unternehmen – Cogniiq (79) | 171 | self (apex) | index,follow | Automatisierung für Unternehmen in Bayreuth | 23 | 1 | 1519 (1295) | 1294 | yes |
| `/bayreuth/webdesign-kosten` | 200 | Webdesign Kosten Bayreuth – Preise für Websites in der Region \| Cogniiq (71) | 159 | self (apex) | index,follow | Webdesign Kosten in Bayreuth – Was kostet eine Website? | 5 | 2 | 910 (686) | 684 | yes |
| `/bayreuth/website-erstellen` | 200 | Website erstellen lassen in Bayreuth \| Professionell & schnell – Cogniiq (72) | 156 | self (apex) | index,follow | Website erstellen lassen in Bayreuth | 4 | 2 | 768 (544) | 542 | yes |
| `/bayreuth/landingpage` | 200 | Landingpage Bayreuth – Conversion-optimierte Seiten für Kampagnen \| Cogniiq (75) | 153 | self (apex) | index,follow | Landingpage erstellen lassen in Bayreuth | 4 | 2 | 661 (437) | 435 | yes |
| `/bayreuth/website-relaunch` | 200 | Website Relaunch Bayreuth – Alte Website modernisieren \| Cogniiq (64) | 172 | self (apex) | index,follow | Website Relaunch in Bayreuth | 88 | 1 | 777 (553) | 551 | yes |
| `/bayreuth/lokales-seo` | 200 | SEO Bayreuth – Lokales SEO & Google-Sichtbarkeit für Unternehmen \| Cogniiq (74) | 189 | self (apex) | index,follow | SEO in Bayreuth: lokale Sichtbarkeit bei Google für Ihr Unternehmen | 5 | 2 | 752 (528) | 526 | yes |
| `/muenchen/webdesign` | 200 | Webdesign Agentur München – Website erstellen \| Cogniiq (55) | 174 | self (apex) | index,follow | Webdesign für Unternehmen in München | 26 | 1 | 1451 (1227) | 1225 | yes |
| `/muenchen/ki-telefonassistent` | 200 | KI Telefonassistent München – AI Rezeption & Telefonservice \| Cogniiq (69) | 153 | self (apex) | index,follow | KI Telefonassistent für Unternehmen in München | 23 | 1 | 1926 (1702) | 1701 | yes |
| `/muenchen/automatisierung` | 200 | Prozessautomatisierung München \| KI-Workflows für Münchner Unternehmen – Cogniiq (80) | 162 | self (apex) | index,follow | Automatisierung für Unternehmen in München | 23 | 1 | 1380 (1156) | 1155 | yes |
| `/muenchen/webdesign-kosten` | 200 | Webdesign Kosten München – Preise für professionelle Websites \| Cogniiq (71) | 158 | self (apex) | index,follow | Webdesign Kosten in München – Was kostet eine Website? | 88 | 1 | 906 (682) | 680 | yes |
| `/muenchen/website-erstellen` | 200 | Website erstellen lassen in München \| Professionell & schnell – Cogniiq (71) | 154 | self (apex) | index,follow | Website erstellen lassen in München | 4 | 2 | 756 (532) | 530 | yes |
| `/muenchen/landingpage` | 200 | Landingpage München – Conversion-starke Seiten für den Münchner Markt \| Cogniiq (79) | 146 | self (apex) | index,follow | Landingpage erstellen lassen in München | 4 | 2 | 675 (451) | 449 | yes |
| `/muenchen/website-relaunch` | 200 | Website Relaunch München – Modernisierung ohne Rankingverlust \| Cogniiq (71) | 148 | self (apex) | index,follow | Website Relaunch in München | 5 | 2 | 773 (549) | 547 | yes |
| `/muenchen/lokales-seo` | 200 | Lokales SEO München – Google Maps & lokale Sichtbarkeit \| Cogniiq (65) | 130 | self (apex) | index,follow | Lokales SEO in München – Google-Dominanz im härtesten Markt | 4 | 2 | 749 (525) | 523 | yes |
| `/regensburg/webdesign` | 200 | Webdesign Agentur Regensburg – Website erstellen & SEO \| Cogniiq (64) | 172 | self (apex) | index,follow | Webdesign Agentur in Regensburg | 26 | 1 | 1502 (1278) | 1276 | yes |
| `/regensburg/ki-telefonassistent` | 200 | KI Telefonassistent Regensburg – AI Rezeption & Anrufannahme \| Cogniiq (70) | 237 | self (apex) | index,follow | KI Telefonassistent in Regensburg | 23 | 1 | 1999 (1775) | 1774 | yes |
| `/regensburg/automatisierung` | 200 | Prozessautomatisierung Regensburg \| KI-Workflows für lokale Unternehmen – Cogniiq (81) | 164 | self (apex) | index,follow | Automatisierung für Unternehmen in Regensburg | 23 | 1 | 1337 (1113) | 1112 | yes |
| `/regensburg/webdesign-kosten` | 200 | Webdesign Kosten Regensburg – Transparente Preise für Websites \| Cogniiq (72) | 154 | self (apex) | index,follow | Webdesign Kosten in Regensburg – Was kostet eine Website? | 5 | 2 | 877 (653) | 651 | yes |
| `/regensburg/website-erstellen` | 200 | Website erstellen lassen in Regensburg \| Professionell & schnell – Cogniiq (74) | 145 | self (apex) | index,follow | Website erstellen lassen in Regensburg | 4 | 2 | 757 (533) | 531 | yes |
| `/regensburg/landingpage` | 200 | Landingpage Regensburg – Conversion-optimierte Seiten \| Cogniiq (63) | 146 | self (apex) | index,follow | Landingpage erstellen lassen in Regensburg | 4 | 2 | 633 (409) | 407 | yes |
| `/regensburg/website-relaunch` | 200 | Website Relaunch Regensburg – Modernisierung & SEO-Migration \| Cogniiq (70) | 162 | self (apex) | index,follow | Website Relaunch in Regensburg | 88 | 1 | 744 (520) | 518 | yes |
| `/regensburg/lokales-seo` | 200 | Lokales SEO Regensburg – Google Maps & lokale Suche \| Cogniiq (61) | 163 | self (apex) | index,follow | Lokales SEO in Regensburg – Mehr Sichtbarkeit bei Google | 4 | 2 | 696 (472) | 470 | yes |
| `/webdesign-arzt-bayreuth` | 200 | Webdesign für Ärzte in Bayreuth \| Praxis-Website erstellen – Cogniiq (68) | 153 | self (apex) | index,follow | Webdesign Arztpraxis Bayreuth & KI-Telefonassistent | 6 | 2 | 1896 (1672) | 1666 | yes |
| `/webdesign-gastronomie-bayreuth` | 200 | Webdesign für Restaurants in Bayreuth \| Online Reservierungen – Cogniiq (71) | 150 | self (apex) | index,follow | Webdesign & KI-Telefonassistent für Gastronomie in Bayreuth | 5 | 2 | 1235 (1011) | 1005 | yes |
| `/webdesign-immobilien-bayreuth` | 200 | Webdesign für Immobilienmakler in Bayreuth \| Leads gewinnen – Cogniiq (69) | 166 | self (apex) | index,follow | Webdesign & KI-Telefonassistent für Immobilienmakler in Bayreuth | 5 | 2 | 1205 (981) | 975 | yes |
| `/webdesign-arzt-muenchen` | 200 | Webdesign für Ärzte in München \| Praxis-Website erstellen – Cogniiq (67) | 127 | self (apex) | index,follow | Webdesign & KI-Telefonassistent für Arztpraxen in München | 5 | 2 | 975 (751) | 747 | yes |
| `/webdesign-gastronomie-muenchen` | 200 | Webdesign für Restaurants in München \| Online Reservierungen – Cogniiq (70) | 149 | self (apex) | index,follow | Webdesign & KI-Telefonassistent für Gastronomie in München | 6 | 2 | 1223 (999) | 993 | yes |
| `/webdesign-immobilien-muenchen` | 200 | Webdesign für Immobilienmakler in München \| Leads gewinnen – Cogniiq (68) | 157 | self (apex) | index,follow | Webdesign & KI-Telefonassistent für Immobilienmakler in München | 5 | 2 | 1244 (1020) | 1014 | yes |
| `/webdesign-arzt-regensburg` | 200 | Webdesign für Ärzte in Regensburg \| Praxis-Website erstellen – Cogniiq (70) | 133 | self (apex) | index,follow | Webdesign & KI-Telefonassistent für Arztpraxen in Regensburg | 5 | 2 | 1343 (1119) | 1113 | yes |
| `/webdesign-gastronomie-regensburg` | 200 | Webdesign für Restaurants in Regensburg \| Online Reservierungen – Cogniiq (73) | 157 | self (apex) | index,follow | Webdesign & KI-Telefonassistent für Gastronomie in Regensburg | 5 | 2 | 1228 (1004) | 998 | yes |
| `/webdesign-immobilien-regensburg` | 200 | Webdesign für Immobilienmakler in Regensburg \| Leads gewinnen – Cogniiq (71) | 153 | self (apex) | index,follow | Webdesign & KI-Telefonassistent für Immobilienmakler in Regensburg | 6 | 2 | 1250 (1026) | 1020 | yes |
| `/webdesign-gastronomie` | 200 | Webdesign für Restaurants & Gastronomie \| Online Reservierungen – Cogniiq (73) | 157 | self (apex) | index,follow | Webdesign für Restaurants & Gastronomie | 88 | 1 | 877 (653) | 652 | yes |
| `/webdesign-arzt` | 200 | Webdesign für Ärzte & Praxen \| Patientengewinnung online – Cogniiq (66) | 131 | self (apex) | index,follow | Webdesign für Arztpraxen & Medizinische Einrichtungen | 88 | 1 | 875 (651) | 650 | yes |
| `/webdesign-immobilien` | 200 | Webdesign für Immobilienmakler \| Objekte präsentieren & Leads gewinnen – Cogniiq (80) | 164 | self (apex) | index,follow | Webdesign für Immobilienmakler & Immobilienbüros | 88 | 1 | 886 (662) | 661 | yes |
| `/webdesign-hotel` | 200 | Webdesign für Hotels \| Internetagentur für Hotellerie – Cogniiq (63) | 157 | self (apex) | index,follow | Webdesign für Hotels & Pensionen | 88 | 1 | 1013 (789) | 788 | yes |
| `/webdesign-sport` | 200 | Webdesign für Sportvereine & Fitnessstudios \| Mitgliederwachstum – Cogniiq (74) | 157 | self (apex) | index,follow | Webdesign für Sport, Fitness & Vereine | 88 | 1 | 921 (697) | 696 | yes |
| `/ki-telefonassistent-arzt` | 200 | KI-Telefonassistent Arztpraxis: Anrufe erledigen \| Cogniiq (58) | 158 | self (apex) | index,follow | KI-Telefonassistent für Arztpraxen: Anrufe erledigen, nicht notieren | 88 | 1 | 3815 (3591) | 3584 | yes |
| `/ki-telefonassistent-restaurant` | 200 | KI-Telefonassistent für Restaurants \| Reservierungen automatisch annehmen – Cogniiq (83) | 156 | self (apex) | index,follow | KI Telefonassistent für Restaurants & Gastronomie | 88 | 1 | 1171 (947) | 946 | yes |
| `/ki-telefonassistent-hotel` | 200 | KI-Telefonassistent für Hotels \| Buchungsanfragen auch nachts bearbeiten – Cogniiq (82) | 177 | self (apex) | index,follow | KI Telefonassistent für Hotels & Pensionen | 88 | 1 | 1128 (904) | 903 | yes |
| `/ki-telefonassistent-praxis` | 200 | KI-Telefonassistent für Therapiepraxen \| Cogniiq (48) | 173 | self (apex) | index,follow | KI Telefonassistent für Therapeuten & Praxen | 6 | 2 | 2607 (2383) | 2382 | yes |
| `/automatisierung-restaurant` | 200 | Automatisierung für Restaurants \| Bestellungen, Reservierungen & mehr – Cogniiq (79) | 152 | self (apex) | index,follow | Automatisierung für Restaurants & Gastronomie | 88 | 1 | 846 (622) | 621 | yes |
| `/automatisierung-arzt` | 200 | Automatisierung für Arztpraxen \| Erinnerungen, Warteliste & Kommunikation – Cogniiq (83) | 189 | self (apex) | index,follow | Automatisierung für Arztpraxen & Praxisverwaltung | 88 | 1 | 869 (645) | 644 | yes |
| `/automatisierung-immobilien` | 200 | Automatisierung für Immobilienmakler \| Lead-Nachverfolgung & CRM – Cogniiq (74) | 170 | self (apex) | index,follow | Automatisierung für Immobilienmakler & Immobilienbüros | 88 | 1 | 847 (623) | 622 | yes |
| `/automatisierung-sport` | 200 | Automatisierung für Sportvereine & Studios \| Mitgliederverwaltung KI – Cogniiq (78) | 136 | self (apex) | index,follow | Automatisierung für Fitnessstudios & Sportanlagen | 88 | 1 | 831 (607) | 606 | yes |
| `/kosten-webdesign` | 200 | Was kostet eine Website? Webdesign Kosten & Preistreiber \| Cogniiq (66) | 208 | self (apex) | index,follow | Was kostet eine Website? | 88 | 1 | 1527 (1303) | 1303 | yes |
| `/kosten-ki-telefonassistent` | 200 | Was kostet ein KI Telefonassistent? Preise \| Cogniiq (52) | 162 | self (apex) | index,follow | Was kostet ein KI Telefonassistent? | 88 | 1 | 4665 (4441) | 4269 | yes |
| `/kosten-automatisierung` | 200 | Was kostet Prozessautomatisierung? Kosten, Preistreiber & Rechner \| Cogniiq (75) | 191 | self (apex) | index,follow | Was kostet Prozessautomatisierung? | 88 | 1 | 2204 (1980) | 1974 | yes |
| `/verpasste-anrufe-verlust` | 200 | Verpasste Anrufe: Was sie Unternehmen wirklich kosten \| Cogniiq (63) | 154 | self (apex) | index,follow | Verpasste Anrufe kosten Ihr Unternehmen täglich Aufträge | 22 | 1 | 664 (440) | 439 | yes |
| `/keine-anfragen-website` | 200 | Warum Ihre Website keine Anfragen bringt – und wie Sie das ändern \| Cogniiq (75) | 154 | self (apex) | index,follow | Warum Ihre Website keine Anfragen generiert | 22 | 1 | 579 (355) | 354 | yes |
| `/keine-terminbuchung-online` | 200 | Keine Online-Terminbuchung? Das kostet Sie täglich Patienten & Kunden \| Cogniiq (79) | 183 | self (apex) | index,follow | Keine Online-Terminbuchung: Das kostet Ihr Unternehmen täglich | 18 | 2 | 577 (353) | 352 | yes |
| `/zu-viel-manuelle-arbeit` | 200 | Zu viel manuelle Arbeit im Unternehmen? KI löst das \| Cogniiq (61) | 179 | self (apex) | index,follow | Zu viel manuelle Arbeit im Unternehmen: Automatisierung löst das Problem | 23 | 1 | 535 (311) | 310 | yes |
| `/digitale-automatisierung-unternehmen` | 200 | Digitale Automatisierung für Unternehmen – Praxisnah & sofort einsetzbar \| Cogniiq (82) | 109 | self (apex) | index,follow | Digitale Automatisierung für Unternehmen: Wie man startet | 4 | 1 | 539 (315) | 314 | yes |
| `/blog` | 200 | Blog – KI, Webdesign & Automatisierung für Unternehmen \| Cogniiq (64) | 146 | self (apex) | index,follow | KI, Webdesign & Automatisierung | 88 | 1 | 705 (481) | 481 | yes |
| `/blog/ki-automatisierung-kleine-unternehmen` | 200 | KI-Automatisierung für kleine Unternehmen \| Leitfaden (53) | 156 | self (apex) | index,follow | KI-Automatisierung für kleine Unternehmen: Der komplette Leitfaden | 9 | 2 | 901 (677) | 677 | yes |
| `/blog/ki-telefonassistent-arztpraxis` | 200 | Telefon in der Arztpraxis: was beim Team bleiben muss \| Cogniiq (63) | 186 | self (apex) | index,follow | Telefon in der Arztpraxis: welche Anrufe beim Team bleiben müssen – und welche nicht | 5 | 2 | 1163 (939) | 939 | yes |
| `/blog/webdesign-konversion-tipps` | 200 | Webdesign für mehr Anfragen & Konversion \| 8 Tipps (50) | 150 | self (apex) | index,follow | Webdesign für mehr Anfragen: 8 Konversionsfaktoren, die wirklich zählen | 6 | 2 | 898 (674) | 674 | yes |
| `/blog/lokales-seo-unternehmen` | 200 | Lokales SEO für Unternehmen \| Google Maps & lokale Suche (56) | 147 | self (apex) | index,follow | Lokales SEO für Unternehmen: Wie Sie in Google Maps und lokalen Suchen erscheinen | 4 | 2 | 885 (661) | 661 | yes |
| `/blog/prozessautomatisierung-roi` | 200 | Prozessautomatisierung ROI berechnen \| Formel, Amortisation, Kostenfallen (73) | 183 | self (apex) | index,follow | Prozessautomatisierung ROI: So messen Sie den echten Nutzen | 3 | 2 | 1243 (1019) | 1019 | yes |
| `/blog/verpasste-anrufe-kosten` | 200 | Verpasste Anrufe Kosten berechnen \| KI-Telefonassistent (55) | 163 | self (apex) | index,follow | Was verpasste Anrufe Ihr Unternehmen wirklich kosten – eine Kalkulation | 3 | 2 | 780 (556) | 556 | yes |
| `/blog/ki-telefonassistent-restaurant` | 200 | KI-Telefonassistent Restaurant \| Reservierungen automatisieren (62) | 208 | self (apex) | index,follow | KI-Telefonassistent für Restaurants: Mehr Reservierungen, weniger Arbeit | 2 | 2 | 766 (542) | 542 | yes |
| `/blog/website-ohne-anfragen` | 200 | Website bringt keine Anfragen? Ursachen & Lösungen (50) | 136 | self (apex) | index,follow | Warum Ihre Website keine Anfragen bringt – und wie Sie das ändern | 4 | 2 | 833 (609) | 609 | yes |
| `/blog/digitalisierung-mittelstand` | 200 | Digitalisierung Mittelstand \| Wo anfangen & was vermeiden (57) | 177 | self (apex) | index,follow | Digitalisierung im Mittelstand: Wo anfangen, was vermeiden | 2 | 2 | 809 (585) | 585 | yes |
| `/blog/webdesign-agentur-auswahl` | 200 | Webdesign Agentur auswählen \| 7 entscheidende Kriterien (55) | 163 | self (apex) | index,follow | Webdesign-Agentur auswählen: 7 Kriterien, die wirklich zählen | 1 | 2 | 828 (604) | 604 | yes |
| `/impressum` | 200 | Impressum \| Cogniiq (19) | 100 | self (apex) | index,follow | Impressum | 88 | 1 | 424 (200) | 199 | yes |
| `/datenschutz` | 200 | Datenschutzerklärung \| Cogniiq (30) | 152 | self (apex) | index,follow | Datenschutzerklärung | 88 | 1 | 1139 (915) | 907 | yes |
| `/anfrage-erhalten` | 200 | Anfrage erhalten – wir melden uns \| Cogniiq (43) | 146 | self (apex) | noindex,nofollow | Anfrage erfolgreich gesendet. | 0 | - | 248 (24) | 24 | no |
