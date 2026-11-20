# 04 — SERP / Competitor Analysis (forensic SEO investigation, 2026-11-20)

## 0. Limitation statement — read before anything else

**This document does not describe the German Google SERP.** It could not be observed.

- google.de returns a captcha wall from this sandbox (not bypassed); Bing returns junk to this IP.
- The only search instrument was a **US-based web-search tool**. It shows **no ads, no local/map pack,
  no AI Overviews, no People-Also-Ask, no sitelinks, no review stars, no pixel layout and no true
  German ranking order**. Result order in the tool is not a ranking.
- The tool's "title" field is unreliable: for many results it returned a slug, a nav string or a
  byline ("Weiter zum Hauptinhalt", "ChatGPT Zusammenfassung", "Roboterhand mit Telefonhörer …")
  instead of the real `<title>`. Where that happened the title is marked *(title not captured)*.
  Such strings are **not** what Google shows.
- Competitor pages could not be opened. One fetch attempt on `www.drweb.de` failed with
  `getaddrinfo ENOTFOUND` (host outside the session allowlist); no further attempts were made.
  Everything said about a competitor page comes from search-result snippets only.
- `status.search.google.com` is also not reachable from here; update dates come from search
  results that cite it (Search Engine Roundtable, Search Engine Land, Search Engine Journal).

Evidence grades used throughout:

| Tag | Meaning |
|---|---|
| **[WEBSEARCH-PROXY]** | URL/domain appeared in the US web-search tool for that query on 2026-11-20 |
| **[SNIPPET]** | taken from the snippet/summary text the tool returned for that URL |
| **[REPO-DOC]** | from earlier in-repo studies (`serp-landschaft-2026-08.md`, `serp-webdesign-2026-09.md`, `post-experiment-opportunities.md`, `FINAL_KEYWORD_OWNERSHIP.md`) — dated hypotheses |
| **[LIVE-FETCH]** | fetched with curl from `https://www.cogniiq.de` on 2026-11-20 |
| **[NOT OBSERVABLE]** | ads, map pack, AI Overview, exact positions, snippet rendering, pixel layout |

Confidence for anything resting only on proxy results is capped at **low–medium**.
No position, title or snippet in this file is invented; where something was not captured it says so.

---

## 1. Cogniiq's own live titles / descriptions [LIVE-FETCH]

Fetched 2026-11-20 from `https://www.cogniiq.de` (HTTP 200, no redirect). Lengths in characters.

| Owner page | `<title>` | Meta description |
|---|---|---|
| `/ki-telefonassistent` | KI Telefonassistent für Unternehmen – Anrufe erledigen \| Cogniiq (64) | KI Telefonassistent, der Anrufe nicht nur annimmt: bucht, verschiebt und storniert Termine im Gespräch und beantwortet Ihre Fragen. Rechner ohne Anmeldung. (155) |
| `/kosten-ki-telefonassistent` | Was kostet ein KI Telefonassistent? Preise \| Cogniiq (52) | Was kostet ein KI Telefonassistent für Praxen? Ab 300 € netto im Monat mit 500 Inklusivminuten, jede weitere Minute 0,50 €, Einrichtung einmalig 990 €, zzgl. USt. (162) |
| `/webdesign-hotel` | Webdesign für Hotels \| Internetagentur für Hotellerie – Cogniiq (63) | Internetagentur für Hotellerie: Hotel-Websites mit Direktbuchungsstrecke, Zimmerpräsentation und lokalem SEO – für Stadthotels, Boutiquehotels und Pensionen. (157) |
| `/regensburg/website-relaunch` | Website Relaunch Regensburg – Modernisierung & SEO-Migration \| Cogniiq (70) | Website Relaunch in Regensburg: alte Website modernisieren, Performance verbessern, lokales SEO optimieren. Professionelle Umsetzung für Unternehmen in Ostbayern. (162) |
| `/prozessautomatisierung` | Prozessautomatisierung für Unternehmen \| Abläufe automatisieren – Cogniiq (73) | Welche Prozesse sich automatisieren lassen, welche nicht, wie Ausnahmen und Schnittstellen behandelt werden und wie eine Umsetzung abläuft. Prozessautomatisierung für Unternehmen in Deutschland. (194) |
| `/blog/prozessautomatisierung-roi` | Prozessautomatisierung ROI berechnen \| Formel, Amortisation, Kostenfallen (73) | Wie Sie den ROI einer Prozessautomatisierung berechnen: Formel, welche Kosten in die Rechnung gehören, Amortisationszeit statt Prozentwert und wann sich Automatisierung nicht rechnet. (183) |
| `/kosten-automatisierung` | Was kostet Prozessautomatisierung? Kosten, Preistreiber & Rechner \| Cogniiq (75) | Was eine Prozessautomatisierung kostet, hängt an Ausnahmen, Schnittstellen und Absicherung. … plus Rechner für Ihren Prozess. (191) |
| `/ki-telefonassistent-hotel` | KI-Telefonassistent für Hotels \| Buchungsanfragen auch nachts bearbeiten – Cogniiq (82) | (177 chars) |

Side observations from the fetch (all [LIVE-FETCH], relevant to how a result can render):

1. **No year, no "Stand …" date, no vendor count, no trial/test offer and no rating in any title.**
   The cost page's title carries the word "Preise" but **no number**; the numbers (300 €, 0,50 €,
   990 €) are in the description only. Whether Google shows that description or rewrites it is
   [NOT OBSERVABLE].
2. **No `dateModified` in the JSON-LD** of the cost page, the flagship or `/praxen` (0 matches).
   JSON-LD types present: `FAQPage`, `Service`, `Offer`/`UnitPriceSpecification` (cost page),
   `Organization`, `LocalBusiness` (city pages), `Article` (ROI post). No `AggregateRating`/`Review`.
3. **Host split:** pages are served 200 on `www.cogniiq.de`, while canonicals and the sitemap
   point to the bare host `https://cogniiq.de/...`, which also answers 200. Not a SERP topic —
   handed to the technical workstream — but it means the URL a searcher sees is `cogniiq.de`.
4. **A third-party index holds an outdated Cogniiq price model.** A `cogniiq.de`-restricted query
   in the search tool returned a summary with "jede weitere Minute 0,39 €", "Einrichtung 1.490 /
   2.490 / 3.490 €", a monthly cap and a "24 Monate Preisgarantie" [WEBSEARCH-PROXY][SNIPPET].
   The live pages contain none of these strings (0 hits for `0,39`, `1.490`, `24 Monate` on
   `/kosten-ki-telefonassistent`, `/praxen`, `/ki-telefonassistent`, `/muenchen/ki-telefonassistent`);
   git history confirms these are a superseded tariff (commit `2936360` introduced 0,50 € / 990 €).
   That proves staleness only for **that tool's index**. Whether **Google's** cached snippet for
   "ki telefonassistent kosten/preise" still shows the old figures is [NOT OBSERVABLE] and must be
   checked by the owner (section 6). If it does, the snippet is showing a price that is no longer
   offered — a trust and CTR problem and a claims problem.

---

## 2. Per-query observations

Cogniiq appeared in **none** of the 13 target queries, nor in the 8 German-context variants
[WEBSEARCH-PROXY]. That is expected for a US proxy and for GSC average positions of ~6–43, and
says nothing about Germany. Cogniiq appeared only in the `cogniiq.de`-restricted control query.

Legend for result types: **V** vendor product page · **VB** vendor-authored blog/guide ·
**L** comparison/listicle · **D** directory/marketplace/review platform · **P** publisher/informational ·
**A** agency service page · **T** tool/calculator.

### 2.1 `ki telefonassistent`

| Seen [WEBSEARCH-PROXY] | Domain | Type | Entity kind |
|---|---|---|---|
| KI-Telefonassistent einrichten und nie wieder Anrufe verpassen | omr.com/de/reviews/contenthub | P/L | publisher + software review platform (OMR Reviews) |
| Welche KI-Telefonassistenten kaufen? 5 Tools, die rangehen … | omr.com | L | same |
| *(title not captured)* /beste-ki-telefonassistenten-fuer-unternehmen ("Die 18 besten … 2026" in a second query) | zeeg.me | L (vendor-authored) | SaaS vendor (scheduling + voice) |
| KI-Telefonassistenten Vergleich 2026 | drweb.de | L | publisher (Dr. Web), "33 Anbieter" [SNIPPET] |
| Effiziente Kundenbetreuung am Telefon (/ki-telefonassistenten-im-vergleich) | it-daily.net | P/L | trade publisher |
| KI Telefonassistent für Unternehmen | fonio.ai | V | funded SaaS vendor (AT) |
| *(title not captured)* /ki-losungen-fuer/ki-telefonassistent | mind-verse.de | V | SaaS vendor |
| Anrufbeantwortung per KI … | jotform.com/de | V | global SaaS |
| deutsche telekom bringt ki assistenten für telefonate | cio.de | P | trade publisher (news) |
| besten fonio alternativen | zeeg.me | L (vendor-authored) | SaaS vendor |

- **Dominant intent:** mixed commercial investigation — "what is it / which one" — leaning to comparison.
- **Recurring players:** OMR Reviews, drweb.de, zeeg.me, fonio.ai, it-daily. Compared with
  [REPO-DOC] 2026-08 (Placetel, IONOS, Doctolib, tenios, cituro): the *kind* of result is the same
  (~half vendor LP, ~half "best N 2026"), the named domains differ — attributable to the tool, not
  evidence of a German reshuffle.
- **What they show:** counts ("5 Tools", "18 besten", "33 Anbieter"), year "2026", "Vergleich".
- **Result-type fit of `/ki-telefonassistent`:** it is a single-vendor product page (type V). That
  type exists in this result set, but the V slots seen are held by SaaS vendors with self-service
  product + pricing page (fonio, IONOS, Placetel [REPO-DOC]). Partial fit, weak brand.
- **Why click the leading result instead of Cogniiq's?** "KI Telefonassistent für Unternehmen –
  Anrufe erledigen | Cogniiq" promises a description of one unknown provider. A listicle title
  promises *all* options with prices in one visit; a known vendor (IONOS/Telekom/Placetel) promises
  a recognisable brand and — per snippets — a free test month or free minutes. Cogniiq's title has
  no number, no year, no test offer, no audience narrower than "Unternehmen".
- GSC context [REPO-DOC]: 49 impressions at avg. pos. 42,8 for the head term — at that depth CTR ≈ 0
  is the expected consequence of position, not of the title.

### 2.2 `ki telefonassistent kosten`

| Seen [WEBSEARCH-PROXY] | Domain | Type | What title/snippet shows |
|---|---|---|---|
| *(title not captured)* /content/ki-telefonassistent-kosten (two URLs) | zeeg.me | VB | per-minute price "0,08 €/Min. (Zeeg)" [SNIPPET] |
| *(title not captured — promo banner)* /blog/ki-telefonassistent-kosten | meetergo.com | VB | — |
| ki telefonassistent kosten 10 anbieter im vergleich 2025 | fonio.ai (de + nl paths) | L (vendor-authored) | "10 Anbieter", price ranges per vendor |
| KI-Telefonassistent Kosten: Preise & ROI-Rechnung 2026 | chatarmin.com | VB/T | year, "ROI-Rechnung" |
| *(title not captured — image alt)* /ki-telefonassistent-kosten/ | kopfundstift.de | L (agency-authored) | logos IONOS/fonio/VITAS; rule of thumb ">200 Anrufe → kein Verbrauchstarif" |
| Was kostet ein KI-Telefonassistent 2026? Preise und Modelle im Vergleich · "Preise von elf Anbietern, Stand 11.10.2026" | ainora.lt | L (vendor-authored) | **11 vendors, dated "Stand 11.10.2026"** |
| KI-Telefonassistent Kosten im Überblick | ionos.de/digitalguide | VB | known brand |
| Kostenratgeber 2026 | famulor.io | VB | "0,18 €/Min … ab 27 €/Monat" [SNIPPET] |
| IONOS KI-Telefonassistent … /pricing | omr.com | D | review-platform pricing page |
| KI-Telefonassistenten 2026: Die 9 besten Anbieter im Kostenvergleich | omidsaffari.com | L | "9 Anbieter", year |
| KI-Telefonassistent 2026: Kosten & ehrlicher Vergleich | alloq.digital | L (agency) | year, "ehrlich" |
| Was ein KI-Telefonassistent für die Terminbuchung kostet: Preismodelle im Vergleich | nordflux.de | VB | — |
| KI-Telefonassistenten Vergleich 2026 | drweb.de | L | 33 vendors |

- **Dominant intent:** informational with a commercial core — "what does this cost across the
  market", i.e. a **market price overview**, not "what does vendor X cost".
- **Result types:** overwhelmingly **multi-vendor cost comparisons**, almost all vendor- or
  agency-authored (matches [REPO-DOC] "fast ausschließlich Hersteller-Blogs"), now with a visible
  convention: **N vendors + year or explicit "Stand <date>" + price ranges per vendor**.
- **Market price anchors visible in snippets [SNIPPET, unverified, not usable as claims]:**
  CloudTalk "€50–€300/Monat"; fonio "99–299 €/Monat"; smao "69–299 €"; voiceOne "32–329 €";
  Famulor "ab 27 €/Monat, 0,18 €/Min."; IONOS "ab ca. 39 €/Monat, 1 Monat kostenlos"; Placetel
  "40–79 €/Monat"; per-minute "0,15–0,80 €"; setup "200–500 €".
- **Result-type fit of `/kosten-ki-telefonassistent`:** **mismatch.** The page is a single-vendor
  price page aimed at practices. The proxy result set rewards a multi-vendor price overview.
- **Why click the leading result instead of Cogniiq's?** Concretely:
  1. *Scope promise* — "10/11/9 Anbieter im Vergleich" answers the query as asked; "Was kostet ein
     KI Telefonassistent? Preise | Cogniiq" answers it for one provider nobody has heard of.
  2. *Freshness* — "2026", "Stand 11.10.2026" versus no date at all.
  3. *Price anchoring* — if Cogniiq's description is shown, "Ab 300 € netto im Monat … Einrichtung
     einmalig 990 €" sits beside snippets saying "ab 27 €", "ab 39 €", "99 €", "€50–€300". For a
     price-comparing searcher the snippet reads as the expensive outlier, with nothing in the snippet
     explaining what the difference buys (done-for-you setup, practice focus). The first clause
     "für Praxen" additionally tells every non-practice searcher the result is not for them.
  4. *Trial* — competitors' snippets carry "kostenlos testen", "1 Monat kostenlos", "Geld-zurück";
     Cogniiq's carries "Rechner ohne Anmeldung" only on the flagship, nothing on the cost page.
- GSC context [REPO-DOC]: 143 impressions at 19,2 ("kosten"), 33 at 17,8 ("preise"), 1 click.
  Position ~19 is page 2; the primary constraint is position, the above are what would still
  depress CTR if the page reached page 1.

### 2.3 `ki telefonassistent preise`

Result set ≈ 2.2 (meetergo, zeeg, kopfundstift, chatarmin, ainora, famulor, cloudtalk, omidsaffari,
alloq, nordflux, drweb) **plus genuine pricing pages** [WEBSEARCH-PROXY]:

| Seen | Domain | Type |
|---|---|---|
| *(title not captured)* /de/preise | fonio.ai | **V pricing page** |
| KI Telefonassistent | ionos.de/office-loesungen/ki-telefonassistent | **V product page with tariffs** |
| … /product/telefon-ki/pricing, …/ionos-ki-telefonassistent/pricing | omr.com | **D pricing pages on a review platform** |
| Preise für KI-Sprachassistenten: Mit welchen Kosten müssen Sie rechnen? | cloudtalk.io/de | V pricing explainer ("ab €99/Monat inkl. 200 Min." [SNIPPET]) |

- **Intent:** more transactional than "kosten" — a share of searchers wants a tariff table.
- **Fit:** *better* than for "kosten". A real single-vendor tariff page is a rewarded type here.
  Cogniiq's cost page is that type. The obstacle is brand: the single-vendor pricing slots seen
  belong to fonio / IONOS / CloudTalk, i.e. vendors a searcher already has in mind (navigational
  component: "fonio preise" collapsed into the generic query).
- **Why click the leader instead of Cogniiq's?** `fonio.ai/de/preise` or IONOS = the brand the
  listicles just named, self-service, visible low entry price. Cogniiq's title has "Preise" but no
  figure; a title with the actual entry price would at least qualify the click.

### 2.4 `ki telefonassistent vergleich`

| Seen [WEBSEARCH-PROXY] | Domain | Type / kind |
|---|---|---|
| Die besten KI-Telefonassistenten im Vergleich | omr.com/de/reviews/category/ai-call-assistant | **D** review-platform category (user reviews) |
| Welche KI-Telefonassistenten kaufen? 5 Tools … | omr.com | L publisher |
| KI-Telefonassistenten Vergleich 2026 ("die besten 33 Anbieter") | drweb.de | L publisher |
| Effiziente Kundenbetreuung am Telefon (/ki-telefonassistenten-im-vergleich) | it-daily.net | L publisher |
| top 11 ki telefonassistenten für deutschsprachige unternehmen 2025 / 2026 | fonio.ai | L vendor-authored |
| Vergleich 2026 (/de/ki-telefonassistent-vergleich) | famulor.io | L vendor-authored |
| beste ki sprachassistenten · dsgvo konforme ki telefonassistenten (11 vendors) | zeeg.me | L vendor-authored |
| Die 7 besten KI-Sprachassistenten für Kundenservice-Anrufe 2026 (bewertet, eingestuft und getestet) | onlinemarktplatz.de | L publisher (possibly sponsored — unknown) |
| Die besten KI-Telefonassistenten 2026: Anbieter im Vergleich · fonio.ai Alternative 2026 … im ehrlichen Vergleich | ainora.lt | L vendor-authored |
| KI-Telefonassistent 2026: 7 Telefonanlagen im Vergleich · Die 9 besten Anbieter im Kostenvergleich | omidsaffari.com | L consultant |
| Die 7 besten KI-Telefonagent-Plattformen 2026 (getestet und verglichen) | retellai.com/de | L vendor-authored |
| KI-Telefonempfang: Kosten, Funktionen und 7 Optionen … 2026 | eesel.ai/de | L vendor-authored |
| (extended variant) KI Telefonassistent: Die 12 besten Anbieter im Vergleich (2026) | superchat.de | L vendor-authored |
| (extended variant) KI-Telefonassistent Vergleich 2026: 16 Anbieter, Preise, Testnummer | assistent24.de | L |
| (extended variant) KI-Telefonassistent-Vergleich 2026: 10 digitale Empfangslösungen im Test | ai-telefonassistenten.de | L (exact-match-style domain) |
| (extended variant) KI-Telefonassistent vergleichen: Kosten und Anbieter [2026] · … Top 12 im Test | heyloha.ai, voisa.ai | L vendor-authored |

- **Intent:** pure comparison. **100 % of results seen are multi-vendor lists**; zero single-vendor
  product pages [WEBSEARCH-PROXY].
- **What titles show:** a number (5/7/9/10/11/12/16/17/18/33), "2026", "im Test / getestet",
  "ehrlich", sometimes "Preise", once "Testnummer".
- **Fit:** Cogniiq has **no page of this type**; any impression here for `/ki-telefonassistent` or
  the cost page is a result-type mismatch and should be expected to earn ~0 clicks at any position.
- **Why click the leader?** It promises the comparison the query literally asks for, from a
  publisher/review platform (OMR, Dr. Web) with reviewer credibility a vendor cannot claim.

### 2.5 `ki telefonassistent anbieter`

Same set as 2.4 (drweb, omr category, it-daily, zeeg, fonio top-11, ainora, famulor, alloq) plus
[WEBSEARCH-PROXY]: hosttest.de "/artikel/ki-telefonassistenten" (comparison portal),
wirtschaftsforum.de "Den besten KI-Telefonassistenten auswählen: Auf diese 5 Kriterien …"
(publisher, likely advertorial — unknown), ionos.de/digitalguide "KI-Telefonie einfach erklärt:
Vorteile, Funktionen und Anbieter".

- **Intent:** comparison / vendor shortlist. **Fit:** mismatch, as 2.4. One nuance: a *criteria*
  article ("5 Kriterien vor dem Kauf") is a second rewarded type that a vendor can write without
  ranking itself.

### 2.6 `internetagentur hotel` and 2.7 `internetagentur hotels`

Literal queries [WEBSEARCH-PROXY] — heavily contaminated by the US index:

| Seen | Domain | Type / kind |
|---|---|---|
| Die 10 besten Hotelmarketingagenturen 2026 · Blastness vs. Internet Marketing Expert Group | hoteltechreport.com/de | **D** hotel-tech review marketplace |
| Hotelmarketing Agentur Vergleich 2026 ("46 Agenturen", 5 categories [SNIPPET]) | drweb.de | **L** publisher |
| Internet Agency Tourism · web-agency-hotel (glossary) | additive.eu | A (South Tyrol hotel-marketing specialist) — glossary landing pages |
| Hotel-Marketing (several) | siteminder.com/de | V (hotel-tech SaaS) guides |
| hotel digital marketing · /hotels/losungen/webdesign/ | theaccessgroup.com/de-de | V (enterprise software) |
| partner pages | hotelnetsolutions.de, guest.net | hotel-tech partner directories |
| tourismus marketing | ostend.digital | A |
| hotel website erstellen | de.wix.com | builder platform |
| (hotels only) hotels in top destinations | de.hotels.com | **OTA — navigational/consumer** |

German-context variant "Internetagentur für Hotels Hotellerie Agentur Hotelwebsite erstellen
lassen" (extended) [WEBSEARCH-PROXY] — a cleaner German set, all type **A hotel specialists**:
niederrhein-web.de ("Hotel Webseite erstellen lassen", "ab 89 €/Monat" [SNIPPET]),
netgenerator.de ("Hotel-Webdesign Agentur Berlin: Websites, die Buchungen bringen", "seit über 20
Jahren" [SNIPPET]), indual.ch, agentur-anmut.de ("Webseiten für Hotels", referenzen path),
th-experts.com ("Hotel Website erstellen lassen: mehr Direktbuchungen"), hellohotel.io (XPORT,
"über 25 Jahre"), grafikwald.com ("Webdesign für Hotels"), hotelkompetenzzentrum.de ("Hotel Web
Design – schlüsselfertige Hotel-Websites"), cosmotura.com ("Webdesign für Hotels: Wir bauen
Hotel-Websites mit Anspruch").

- **Intent:** ambiguous. Three readings coexist: (a) hotelier looking for a web/marketing agency
  (commercial), (b) "hotels" as a consumer/OTA term (the hotels.com hit), (c) "Internetagentur"
  as an old-fashioned generic agency term that Google may localise to the searcher's city.
  Reading (c) would trigger a **local pack** in Germany — [NOT OBSERVABLE].
- **Recurring kinds:** hotel-tech marketplaces/directories, hotel-only specialist agencies with
  10–25 years of hotel references, hotel-tech SaaS.
- **Fit of `/webdesign-hotel`:** correct *type* (agency service page). Wrong *depth of proof*: the
  competing A-pages are hotel-only specialists whose snippet carries years in hospitality,
  reference paths (`/referenzen/hotel-webdesign/`), booking-engine names. Cogniiq is a generalist
  AI/web agency with a hotel vertical page; its own title/description contain no reference, no
  number, no booking system name.
- **Why click the leader instead of Cogniiq's?** "Hotel-Webdesign Agentur Berlin: Websites, die
  Buchungen bringen" / "seit über 20 Jahren … Hotels, Pensionen und Gasthöfe" signals *we only do
  hotels and have done it for decades*. "Die 10 besten Hotelmarketingagenturen 2026" signals a
  shortlist. "Webdesign für Hotels | Internetagentur für Hotellerie – Cogniiq" signals a keyword
  pairing; the brand name gives no hospitality cue and the snippet lists features, not proof.
- **Query-mix warning:** [REPO-DOC] reports 1.184 impressions / avg. pos. 17,7 / 0 clicks on
  `/webdesign-hotel` and says the "internetagentur hotel/hotels" family is involved. The term
  "Internetagentur" is in the title *because it was added* — the page may be collecting
  impressions for a low-intent, partly consumer, partly localised query family for which it is
  shown far down. Zero clicks at ~18 is the base-rate expectation; it is not evidence of a bad
  snippet. Query×Page data is needed before any conclusion.

### 2.8 `webdesign hotel` and 2.9 `webdesign für hotels`

Literal `webdesign hotel` returned an **almost entirely English** set (siteminder.com, webfx.com,
digitalsilk.com, cloudbeds, cvent, wix, littlehotelier, 99designs, nicepage) — a proxy artifact,
unusable for Germany [WEBSEARCH-PROXY]. `webdesign für hotels` returned a German set:

| Seen [WEBSEARCH-PROXY] | Domain | Type / kind |
|---|---|---|
| /de-de/hotels/losungen/webdesign/ | theaccessgroup.com | V enterprise hotel software |
| /de/r/marketing/hotel-webseiten-design · /de/webseiten-fuer-hotels/ | siteminder.com | V hotel-tech SaaS (site builder) |
| /de/marketing/websites · /website-builders-cms ("Top 10 … 2026", "Umfrage unter 1925 Hoteliers" [SNIPPET]) | hoteltechreport.com | D marketplace |
| hotel website design | cvent.com/de | P/V inspiration listicle |
| WordPress-Websites für Hotels: Design und Entwicklung | seahawkmedia.com/de | A |
| /de/webseiten-gestalter | littlehotelier.com | V SaaS |
| hotel website erstellen | de.wix.com | builder |
| Hotel-Website templates | nicepage.com/de, 99designs.com | template marketplaces |
| (variant) grafikwald.com, cosmotura.com/webdesign-hotel, hotelkompetenzzentrum.de/de/hotel-webdesign, netgenerator.de | — | A hotel specialists |

- **Intent:** split between *inspiration/DIY* ("show me good hotel websites", templates, builders)
  and *commercial* ("who builds it"). In Germany an **image pack** is plausible for
  "webdesign hotel" — [NOT OBSERVABLE].
- **Recurring kinds:** hotel-tech SaaS with their own site builders (SiteMinder, Little Hotelier,
  Access), marketplaces, template platforms, then specialist agencies.
- **Fit:** right type for the commercial half only. For the inspiration half an agency service
  page is a mismatch (searchers want examples; Cogniiq's snippet shows none).
- **Why click the leader?** SiteMinder/Little Hotelier are brands hoteliers already use for their
  channel manager — the result promises a website that is already wired to their booking engine.
  Hotel Tech Report promises a ranked shortlist "from 1,925 hoteliers". Specialist agencies show
  hotel references. Cogniiq shows "Direktbuchungsstrecke, Zimmerpräsentation und lokalem SEO" — the
  same feature words everyone uses, no named PMS/booking engine, no example hotel.

### 2.10 `website relaunch regensburg`

Literal query [WEBSEARCH-PROXY]: **news/institutional** results — uni-regensburg.de "Website-Relaunch"
project pages (homepage live 1 April 2026 [SNIPPET]), typo3.com OTH Regensburg case study,
in2code.de references, gruen.net (Domspatzen relaunch), mittelstandcafe.de (press release),
plus other universities' relaunch pages and a stepstone.de job listing. No agency service page.

German-context variant "Website Relaunch Regensburg Agentur Webdesign Relaunch Homepage
modernisieren" (extended) [WEBSEARCH-PROXY] — all **local agency pages (A)**:
webdesign-journal.de/webdesign-regensburg (directory-style), net4all.at "Webagentur Regensburg",
webflott.de "Webdesign Regensburg", justmake-marketing.de "Webdesign Agentur Regensburg",
heroldmedien.de "Webdesign Regensburg" (TYPO3, Mittelstand), homepage-regensburg.de "Webdesign
Regensburg" (exact-match local domain, Agentur Rubel), webdesignerr.de "Webdesign Regensburg »
Wer nicht überzeugt, wird übersehen!", cbachleitner.de ("Relaunch ca. 1.900–4.500 €" [SNIPPET],
old), kinetiqa.de "Agentur Webdesign Regensburg", ucentric-media.de "Website Relaunch Agentur"
("Wir sind spezialisiert auf Website-Relaunches … Büro in Regensburg" [SNIPPET]).

- **Intent:** two readings. (a) **local commercial** — a Regensburg business wants its site
  relaunched; (b) **navigational/news** — people looking for *the* Regensburg website relaunch
  (Universität Regensburg relaunched in 2026; OTH; city). The proxy shows reading (b) for the
  literal query. If Google.de mixes in (b), a share of the impressions on Cogniiq's page comes
  from searchers who will never click an agency.
- **Fit:** `/regensburg/website-relaunch` is a **relaunch-specific local page** — that is actually
  *more* specific than most competitors, whose ranking pages are generic "Webdesign Regensburg"
  pages. Type fit is good.
- **Why click the leader instead of Cogniiq's?** For reading (a), three things Cogniiq's result
  cannot show: (1) a **Google Business Profile with reviews in a local pack** above the organic
  results ([NOT OBSERVABLE], but the standard layout for "<service> <city>"); (2) a visibly
  Regensburg-rooted identity — "homepage-regensburg.de", "Büro in Regensburg", street address —
  whereas Cogniiq is described elsewhere as Bayreuth-based and its snippet says "für Unternehmen
  in Ostbayern"; (3) a concrete relaunch promise (price range, "kostenloses Konzept vorab",
  "spezialisiert auf Relaunches"). Cogniiq's title spends its second half on "Modernisierung &
  SEO-Migration" — jargon to an owner-manager — and the description on generic benefits
  ("Performance verbessern … Professionelle Umsetzung").
- GSC context [REPO-DOC]: page 331–358 impressions at ~10,9–12,2; the two main queries 82 and 54
  impressions at **5,8**; 1 click in 3 months. **This is the one case where position does not
  explain the missing clicks**: ~136 impressions at ~5,8 would ordinarily be expected to yield a
  few clicks. But 136 impressions is a small sample (0–1 clicks is within noise for a 2–4 % CTR
  slot beneath a local pack), and an average of 5,8 can hide a bimodal distribution.

### 2.11 `roi prozessautomatisierung`

| Seen [WEBSEARCH-PROXY] | Domain | Type / kind |
|---|---|---|
| **ROI-Rechner für Prozessautomatisierung** | techsy.io/de/ressourcen/tools | **T calculator** (agency/dev shop) |
| SAP-ROI Calculator: Ab wann rechnet sich SAP Prozessoptimierung? | precisely.com/de | T (enterprise vendor) |
| roi rechner · roi-rechner-automatisierung-finanzprozesse | esker.com/de | T (enterprise vendor) |
| How do you calculate ROI for process automation? (worked example, 316 %) | boc-group.com | VB (BPM vendor) |
| wie automatisierung … kosten senkt ("Amortisation ~14 Monate, ROI ~170 % nach 36 Monaten") | hagel-it.de | VB (IT service provider, Hamburg) |
| in vier schritten zur prozessautomatisierung · erfolgsmessung bei RPA | computerwoche.de | P |
| how to show business value and roi of automation | pagerduty.com/de | VB |
| roi business automation guide ("300–500 %") | ecosire.com/de | VB |
| Comarch-Studie … „Wo kann mein Unternehmen einen ROI erzielen?" | silicon-saxony.de | P |
| RPA sinnvoll einsetzen | barc.com/de | analyst |
| Deloitte, KPMG AT, Automation Anywhere (Forrester TEI), Flowable, Bizagi | — | consultancies / enterprise vendors |
| (variant) ki roi berechnen 2026 formel beispiele kmu | skill-sprinters.de | VB |

- **Intent:** informational ("how do I calculate / justify it") with a strong **tool** component.
- **What they show:** "ROI-Rechner", a percentage (316 %, 170 %, 300–500 %), an amortisation
  period, a study name (Forrester, Comarch).
- **Fit of `/blog/prozessautomatisierung-roi`:** right type (informational article with formula).
  The gap is the **calculator**: the tool exists on `/kosten-automatisierung` ("plus Rechner für
  Ihren Prozess"), not on the ROI article, and the word "Rechner" is not in the ROI article's
  title. A calculator-titled result is the most distinctive item in the set.
- **Why click the leader?** "ROI-Rechner für Prozessautomatisierung" promises an answer for *my*
  numbers in one minute; a worked example with "316 %" promises a figure to paste into a business
  case; computerwoche/Deloitte promise a citable authority. Cogniiq's "Formel, Amortisation,
  Kostenfallen" is a sound, honest promise — and the only title without the brand at the end, so
  no trust cue at all — but it promises reading, not a result.
- **Sample warning:** the prompt lists "roi für prozessautomatisierung" as CTR-suspect; no
  query-level impression count for it is in the repo docs. Likely a handful of impressions —
  **insufficient sample** until GSC says otherwise.

### 2.12 `prozessautomatisierung`

[WEBSEARCH-PROXY]: rs-online.com "Prozessautomatisierung-Leitfaden" (**industrial** automation),
haufe-akademie.de (training provider, definition article), salesforce.com/de, lexware.de ("in 5
Schritten"), sap.com, ibm.com (PDFs), omr.com contenthub, monday.com/blog/de, publica.fraunhofer.de,
computerwoche.de, university lecture scripts (FAU — *Prozessautomatisierung* as process-control
engineering), DGUV, O'Reilly ("Praktische Prozessautomatisierung", Ruecker).

- **Intent:** **informational / definitional**, and **ambiguous** between business-process
  automation and industrial process control (Verfahrenstechnik). No agency service page seen.
- **Players:** enterprise software vendors, training providers, trade publishers, universities.
- **Fit of `/prozessautomatisierung`:** **mismatch** — a commercial agency service page for a
  definitional head term dominated by SAP/IBM/Salesforce/Haufe. Not a realistic target; should be
  treated like the telephone head term in [REPO-DOC] ("kein realistisches Ziel").
- **Why click the leader?** SAP/IBM/Haufe = known brand answering "Was ist …". In Germany a
  definitional query of this kind is a prime AI-Overview candidate ([NOT OBSERVABLE]) — in which
  case nobody clicks anyone.

### 2.13 `prozessautomatisierung agentur`

Literal query [WEBSEARCH-PROXY] was noisy — the tool matched "Agentur" to "**agentic**" (Automation
Anywhere "agentic process automation", aimultiple "agentic enterprise service") and returned
consultancies (msg, Forvis Mazars AT, Rödl, KPMG AT), itransition, techsy.io, computerwoche, omr.

German-context variant "Prozessautomatisierung Agentur Mittelstand Geschäftsprozesse automatisieren
lassen Dienstleister" (extended) [WEBSEARCH-PROXY] — a clean **agency (A)** set:
flowagentur.de "Agentur für KI- und Prozessautomatisierung im Mittelstand", ai-atelier.de
"Prozessautomatisierung für den Mittelstand", dixeno.de "AI Automation Agentur" (Make/Zapier/n8n,
"Amortisation 3–6 Monate" [SNIPPET]), process-vision.de "KI-Agentur Zwickau: Prozessautomatisierung
im Mittelstand", prozessgesteuert.de "Automation-Agentur" (n8n/iPaaS), codamic.ag
"Prozessautomatisierung für den Mittelstand" ("seit 1999"), wsk.gmbh, derprozessmeister.de
(Handwerk), handelsblatt.com/adv (advertorial). Second variant (n8n/Make): studiomeyer.io,
alloq.digital "n8n-Agentur", wz-it.com, hagel-it.de, mind-verse.de, t3n.de, plus **Fiverr gig
pages** (marketplace).

- **Intent:** commercial, service-seeking. **Result type rewarded:** agency service page — the
  **same type as Cogniiq's page**. This is the query in the automation cluster where Cogniiq's page
  type fits.
- **What titles show:** an **audience** ("für den Mittelstand", "Handwerk", "E-Commerce"), a
  **stack** (n8n, Make, HubSpot, Odoo, Microsoft 365), a **city**, a founding year.
- **Why click a leader instead of Cogniiq's?** "… für den Mittelstand" / "KI-Agentur Zwickau" /
  "n8n-Agentur" lets the searcher self-identify in the title. Cogniiq's "Prozessautomatisierung
  für Unternehmen | Abläufe automatisieren – Cogniiq" names neither audience, stack, region nor
  outcome; the description is a table of contents ("Welche Prozesse sich automatisieren lassen,
  welche nicht …") — accurate and differentiated in substance (exceptions handling) but it reads
  as an article abstract, not an offer, and it does not say "Agentur".

---

## 3. Comparison with the earlier in-repo studies

| Earlier claim [REPO-DOC] | Seen now [WEBSEARCH-PROXY] | Reading |
|---|---|---|
| Head term ≈ 50/50 vendor LP and "TOP-N 2026" lists (2026-08) | Same mix; listicle share looks higher, more vendor-authored lists | Consistent. Named domains differ → tool noise, not evidence of change |
| Kosten/Preise "fast ausschließlich Hersteller-Blogs" | Still vendor-authored, but now mostly **multi-vendor** cost comparisons with N + year + "Stand" date | Convention has hardened: single-vendor cost prose looks rarer |
| Vergleich/Anbieter: "Hersteller, die sich selbst zum Sieger küren" | Confirmed; additionally publisher/review-platform lists (OMR category, drweb 33, it-daily, hosttest) | Vendor-authored comparisons are *already saturated* (≥10 seen) |
| "Jede rankende kommerzielle Seite trägt 2026 im Titel" | Confirmed for listicles/cost guides; not for pure product pages | Holds for the comparison types |
| Webdesign: Kostenratgeber carry numbers + year; local queries dominated by city pages (2026-09) | Regensburg variant: all local "Webdesign Regensburg" agency pages | Consistent |
| Cogniiq not visible for non-brand queries | Still none in 21 result sets | Uninformative on a US proxy |

---

## 4. Google updates 2026-09-01 … 2026-11-20

Sources are search results citing Google's Search Status Dashboard and the trade press; the
dashboard itself could not be opened from this sandbox. Dates are as reported.

| Update | Start | End | Status on 2026-11-20 | Sources |
|---|---|---|---|---|
| **September 2026 spam update** | 2026-09-24, ~12:00 pm ET | **2026-10-08**, 4:37 am ET (13 d 16 h) | Complete | https://status.search.google.com/incidents/XhUDXP7A67iHCD2kmbVu · https://www.seroundtable.com/google-september-2026-spam-update-42163.html · https://www.seroundtable.com/google-september-2026-spam-update-done-42235.html · https://searchengineland.com/google-releases-september-2026-spam-update-491267 · https://searchengineland.com/google-september-2026-spam-update-done-rolling-out-493550 |
| **November 2026 core update** | 2026-11-10, 10:06 PT | none posted | **Reported as still rolling out** (latest coverage found: 16–18 Nov). Google: "may take up to 2 weeks" → nominally ~24 Nov, but that is an estimate | https://status.search.google.com/incidents/WLxcJyC6jMWMfryxsKMc · https://www.seroundtable.com/google-november-2026-core-update-42504.html · https://searchengineland.com/google-november-2026-core-update-rolling-out-now-501348 · https://www.searchenginejournal.com/google-november-2026-core-update/596614/ · https://www.seroundtable.com/google-november-2026-core-update-ranking-volatility-42543.html |
| October 2026 | — | — | **No confirmed core or spam update found.** Unconfirmed volatility reported by Search Engine Roundtable around 16 Oct and 20–21 Oct | https://www.seroundtable.com/google-search-ranking-volatility-chatter-42317.html · https://www.seroundtable.com/google-search-ranking-volatility-42347.html |
| (context, before window) August 2026 spam update | 2026-08-18 | 2026-08-21 | Complete | https://www.seroundtable.com/google-august-2026-spam-update-done-41906.html |

Details and caveats:

- **I cannot confirm from a primary source that the November core update is still rolling out
  today (20 Nov).** No completion notice appeared in any search result; the most recent items
  found (16–18 Nov) say "still rolling out". The owner should open
  https://status.search.google.com/products/rGHU1u87FJnkP6W2GwMi/history to confirm.
- Search Engine Roundtable reported the September spam update as slower than recent ones (two
  weeks, not two days), "more core-update-like" in impact, with volatility waves on 25–27 Sep,
  30 Sep and 4–6 Oct [SNIPPET]. Earlier 2026 core updates per the same coverage: March (27 Mar–8 Apr)
  and May (21 May–2 Jun); November is described as the third core update of 2026.
- Roundtable also reported that noticeable movement from the November core update may have begun
  around **13–14 Nov** rather than at launch, and that third-party trackers struggled to measure it [SNIPPET].
- **GSC data anomaly, 9–11 Nov 2026:** Google confirmed a logging error that lowered impressions
  in the **Generative AI performance report** in Search Console for 9–11 November; reported as a
  logging-only issue not affecting clicks or other reports. No report found that the main
  Performance report was affected.
  Sources: https://support.google.com/webmasters/answer/6211453?hl=en ·
  https://searchengineland.com/google-search-console-performance-report-data-bug-nov-9-11-501899 ·
  https://www.seroundtable.com/google-generative-ai-performance-report-data-bug-42527.html

**Consequence for this investigation (FACT-based):**

- The GSC window used in `FINAL_KEYWORD_OWNERSHIP.md` (24 Sep – 21 Oct 2026) **coincides almost
  exactly with the September spam update (24 Sep – 8 Oct)** for its first half, and contains the
  unconfirmed 16 and 20–21 Oct volatility. Average positions from that window are measured on
  moving ground.
- Any GSC data from **10 Nov onward is inside an unfinished core update**. Google's own guidance
  as quoted in coverage: wait for completion, then at least one full week, then compare against a
  week before the start. Before/after conclusions on titles, CTR or positions drawn now are not
  valid.

## 5. AI Overviews / AI Mode in Germany, same window

| Finding | Grade | Source |
|---|---|---|
| SISTRIX: AI Overviews shown for **>50 % of German keywords since 2 Nov 2026**; **57,9 % on 6 Nov 2026**; share "nearly doubled since early July 2026"; basis ≈100 M German keywords | [SNIPPET] of SISTRIX and secondary coverage — original post not opened | https://www.sistrix.de/news/ai-overviews-jetzt-bei-ueber-50-der-keywords/ · https://onlinemarketing.de/seo/ai-overviews-deutschland-anteil-wachstum · https://www.drweb.de/google-ai-overviews-haelfte-keywords/ · https://www.marketing-boerse.de/web/details/2645-58-prozent-der-keywords-mit-ai-overviews/206991 |
| A secondary source gives ~61 % for mid-November, attributed to SISTRIX via OMR, **mobile only** — not comparable to the 57,9 % | [SNIPPET], weak | https://wortfilter.de/google-ai-overviews-61-prozent/ |
| Earlier SISTRIX measurement (spring 2026, >100 M keywords): AIO on ~20 % of German queries; **position-1 CTR falls from 27 % to 11 %** when an AI Overview is shown (~59 % relative drop) | [SNIPPET]; measurement predates the window | https://www.searchenginejournal.com/google-ai-overviews-cut-germanys-top-organic-ctr-by-59/569954/ · https://www.sistrix.de/frag-sistrix/ai-grundlagen/ai-overviews/ |
| AI Mode (KI-Modus) has been available in Germany since 8 Oct 2025; **no specific AI-Mode change for Germany in Sep–Nov 2026 was found** | [SNIPPET]; absence of evidence | https://chatelain-cadet.de/wissen/google-ai-mode-deutschland/ |
| Google expanded ads in AI Mode to ten more countries; **Germany not among them**, no date given | [SNIPPET] | https://onlinemarktplatz.de/294874/anzeigen-im-ki-modus-google/ |

Caveats: the figures conflict across secondary sources (some still cite ~20 % "Stand August 2026");
the 57,9 % is a single-tool measurement over that tool's keyword set, not over Cogniiq's queries.
**Whether an AI Overview appears on any of Cogniiq's 13 queries is [NOT OBSERVABLE].** What can be
said: if the SISTRIX trend is right, the AIO share in Germany roughly doubled between July and
early November 2026 — i.e. **during exactly the period in which Cogniiq's impressions without
clicks accumulated**. Informational and definitional queries ("ki telefonassistent kosten",
"roi prozessautomatisierung", "prozessautomatisierung") are the typical AIO candidates;
"<service> <city>" queries typically are not.

---

## 6. CTR-suspect queries — most likely constraint and what to screenshot

Owner check for all rows: **incognito window, google.de, physically in Germany (no VPN to
elsewhere), signed out, desktop and mobile separately, full-page screenshot from the top down to
Cogniiq's result (or to the end of page 2).** Record: ads count, AI Overview yes/no (and whether
Cogniiq is cited in it), local pack yes/no and who is in it, PAA, image pack, Cogniiq's position,
and the **exact title and snippet Google renders for Cogniiq**.

| Query | Most likely constraint(s), in order | Grade | Confidence | Screenshot must show |
|---|---|---|---|---|
| `ki telefonassistent kosten` | 1 position (~19 = page 2) · 2 **result-type mismatch** (multi-vendor cost comparisons rewarded) · 3 AI Overview answering the price range · 4 weak title (no number/year) · 5 price-anchor disadvantage in snippet | 1 [REPO-DOC]; 2 [WEBSEARCH-PROXY]; 3 [NOT OBSERVABLE]; 4 [LIVE-FETCH]; 5 [SNIPPET] | low–medium | AIO present? Which price range does it state? Ads by fonio/IONOS/Placetel? Does Cogniiq's snippet show **0,50 €/990 €** (current) or **0,39 €/1.490 €** (stale)? |
| `ki telefonassistent preise` | 1 position (~18) · 2 weak brand vs. vendor pricing pages (fonio/IONOS) · 3 ads · 4 title without figure | 1 [REPO-DOC]; 2 [WEBSEARCH-PROXY]; 3 [NOT OBSERVABLE] | low–medium | Ads block; which vendor pricing pages rank; rendered Cogniiq title |
| `internetagentur hotel` / `internetagentur hotels` | 1 **query-mix artifact / intent mismatch** (ambiguous query; consumer + localised generic-agency readings) · 2 position (~18) · 3 **local pack** of nearby "Internetagentur" listings · 4 directory dominance (Hotel Tech Report, Dr. Web) · 5 lack of trust (no hotel proof vs. specialists) | 1 [WEBSEARCH-PROXY]; 2 [REPO-DOC]; 3 [NOT OBSERVABLE]; 4–5 [WEBSEARCH-PROXY][SNIPPET] | low | Is there a map pack? Is it localised to the searcher's city? Any OTA/hotel results? Where is Cogniiq? Repeat from a second German city if possible |
| `webdesign hotel` / `webdesign für hotels` | 1 position (~18) · 2 intent mismatch for the inspiration/DIY half (image pack, builders, templates) · 3 lack of trust vs. hotel-tech brands and hotel-only agencies · 4 ads from SaaS builders | 1 [REPO-DOC]; 2–3 [WEBSEARCH-PROXY]; 4 [NOT OBSERVABLE] | low | Image pack? Ads? Share of agencies vs. SaaS/builders/listicles on page 1 |
| `website relaunch regensburg` | 1 **local pack** above organic · 2 **insufficient sample** (~136 impressions on the two main queries) · 3 intent mismatch (news/navigational: Uni/OTH Regensburg relaunch) · 4 weak local trust (not visibly Regensburg-based; no reviews) · 5 weak title/snippet (jargon, no concrete promise) | 1 [NOT OBSERVABLE]; 2–4 [REPO-DOC][WEBSEARCH-PROXY]; 5 [LIVE-FETCH] | low–medium | Map pack and its three listings + review counts; whether uni-regensburg.de / OTH results appear; Cogniiq's exact position on desktop **and** mobile (is 5,8 real or an average of ~3 and ~9?); does Cogniiq have a Business Profile for Regensburg at all |
| `roi (für) prozessautomatisierung` | 1 **insufficient sample** · 2 AI Overview (formula question) · 3 poor information gain vs. calculator-titled results · 4 weak brand (no brand in title, authorities like computerwoche/Deloitte in set) | 1 no data in repo docs; 2 [NOT OBSERVABLE]; 3–4 [WEBSEARCH-PROXY][LIVE-FETCH] | low | AIO present and does it give the formula? Is a calculator result above Cogniiq? Position |

---

## 7. Key conclusions

### C1 — The telephone "kosten / vergleich / anbieter" queries reward multi-vendor comparison pages; Cogniiq offers single-vendor pages

- **FACT:** In the proxy results for `ki telefonassistent vergleich` and `… anbieter`, every result
  seen was a multi-vendor list; for `… kosten` the large majority were multi-vendor cost
  comparisons with a vendor count and a year or "Stand" date in the title. Cogniiq's owner pages
  are a single-vendor product page and a single-vendor price page; their titles contain no count,
  year or date.
- **EVIDENCE:** §2.2–2.5 [WEBSEARCH-PROXY]; §1 [LIVE-FETCH]; consistent with [REPO-DOC] 2026-08
  ("falscher Seitentyp").
- **HYPOTHESIS:** Impressions Cogniiq collects on these queries are low-position appearances of a
  page type the query does not reward; even at a better position the CTR would stay below the
  position norm.
- **ALTERNATIVE EXPLANATION:** Position alone (avg. 17–43) fully explains zero clicks; the result
  type would not matter if the page ranked top 5. Or: the German SERP contains more single-vendor
  pages (IONOS, Placetel, Telekom) than the US proxy shows.
- **CONFIDENCE:** low–medium (two independent in-repo proxy studies and this one agree on the
  type; none saw the German SERP).
- **WHAT WOULD FALSIFY THIS:** German page-1 screenshots showing ≥3 single-vendor product/price
  pages from small providers for "ki telefonassistent kosten"; or Query×Page data showing normal
  CTR for the cost page on days it ranked ≤10.
- **RECOMMENDED ACTION:** Do not judge the cost page's title by CTR while it sits at ~19. Treat
  "vergleich/anbieter" as *not owned* by any current page. Decide on a comparison/criteria page
  separately (see §8) — not by retitling the product page with "Vergleich".

### C2 — For `ki telefonassistent kosten/preise`, Cogniiq's snippet is the high-price outlier and may be stale

- **FACT:** Live description states "Ab 300 € netto im Monat … 0,50 € … Einrichtung einmalig 990 €".
  Competitor snippets in the same result sets state entry prices of 27–99 €/month and free
  trials. A third-party search index still holds Cogniiq's superseded tariff (0,39 €, 1.490 €,
  cap, 24-month guarantee).
- **EVIDENCE:** §1 [LIVE-FETCH]; §2.2 [SNIPPET]; `git log -S'0,39'` → commit `2936360`.
- **HYPOTHESIS:** Shown side by side, a price-comparing searcher skips the 300 € result unless the
  snippet says what category of product it is (done-for-you, practice-specific, set up and tested
  by people) — currently it says "für Praxen" and then only numbers.
- **ALTERNATIVE EXPLANATION:** A visible honest price pre-qualifies; fewer but better clicks is the
  intended outcome, and the 1 recorded click is simply the position-19 base rate. Google may also
  not show the meta description at all.
- **CONFIDENCE:** low (competitor prices are unverified snippets; rendering not observable).
- **WHAT WOULD FALSIFY THIS:** A German screenshot in which Google's snippet for Cogniiq does not
  show the price, or shows it among similarly priced done-for-you providers.
- **RECOMMENDED ACTION:** Owner screenshots the rendered snippet (current vs. stale prices) first.
  No copy change before that; any reframing must respect `.claude/COPY-BRIEF-2.md` (pricing claims
  are owner-gated). If Google shows stale prices, request recrawl of the cost page in GSC.

### C3 — `website relaunch regensburg`: position does not explain the missing clicks; a local pack and sample size are the leading suspects

- **FACT:** [REPO-DOC] 82 + 54 impressions at avg. 5,8; 1 click in 3 months on the page. The
  page is the right result type. The literal query on the proxy returned institutional relaunch
  news (Universität Regensburg relaunched 2026), the German-context variant returned only local
  agencies with visibly local identity.
- **EVIDENCE:** §2.10 [WEBSEARCH-PROXY][SNIPPET]; `FINAL_KEYWORD_OWNERSHIP.md`, `post-experiment-opportunities.md`.
- **HYPOTHESIS:** A map pack with reviewed Regensburg agencies takes most clicks; Cogniiq, with no
  visible Regensburg address/reviews in the result, gets the remainder — statistically ~0–3
  clicks on ~136 impressions.
- **ALTERNATIVE EXPLANATION:** (a) pure sample noise; (b) mixed intent — part of the impressions
  are people looking for the university's relaunch; (c) avg. 5,8 is an artifact of a few
  high-position impressions (e.g. personalised/local) and many low ones; (d) title/snippet too
  generic.
- **CONFIDENCE:** low–medium for "position is not the constraint"; low for which alternative holds.
- **WHAT WOULD FALSIFY THIS:** Screenshot without a local pack and Cogniiq in the top 5 organic on
  both devices → then title/snippet/trust is the constraint. Or GSC showing the 5,8 comes from
  <20 impressions.
- **RECOMMENDED ACTION:** Screenshot (desktop + mobile); export Query×Page×Device for the two
  queries; check whether a Google Business Profile exists and is eligible for Regensburg. The page
  is marked "geschützt" in [REPO-DOC] — no title change until the core update has finished plus
  one week.

### C4 — The hotel cluster is an ambiguous, specialist-dominated space; zero clicks at ~18 is uninformative

- **FACT:** `/webdesign-hotel`: 1.184 impressions, avg. 17,7, 0 clicks [REPO-DOC]. Proxy results
  show hotel-tech marketplaces, hotel-tech SaaS and hotel-only agencies; "internetagentur hotels"
  also returned an OTA.
- **HYPOTHESIS:** High impressions come from broad/ambiguous variants where the page is shown deep;
  no title fix converts them. Winning requires hotel proof (references, named booking systems),
  not wording.
- **ALTERNATIVE EXPLANATION:** The page ranks ≤10 for a specific subset and still gets nothing —
  then it is a trust/snippet problem. Only Query×Page distinguishes these.
- **CONFIDENCE:** low. **FALSIFIER:** Query-level data with ≥100 impressions at position ≤8 and 0 clicks.
- **RECOMMENDED ACTION:** Pull the query list for this page before touching it. Do not add
  unverifiable hotel proof ([[CLAIM]] rules).

### C5 — Automation cluster: head term is definitional (not winnable), "agentur" variant fits, ROI query rewards calculators

- **FACT:** `prozessautomatisierung` → SAP/IBM/Salesforce/Haufe/universities, partly industrial
  meaning. `… agentur` (German variant) → agency service pages naming audience/stack/city.
  `roi …` → calculators and worked examples.
- **HYPOTHESIS:** `/prozessautomatisierung` can only compete on modified queries (agentur, KMU,
  Mittelstand, region, n8n/Make); the ROI article would gain from surfacing the existing
  calculator in its title/intro.
- **ALTERNATIVE:** German SERP for the head term may include a local pack or agencies; the proxy
  over-represents global enterprise domains.
- **CONFIDENCE:** low–medium. **FALSIFIER:** German page 1 for the head term showing ≥3 SME agencies.
- **RECOMMENDED ACTION:** Stop reading head-term impressions as an opportunity. Candidate (after
  the core update settles): test "Agentur"/audience in the service page title; link/embed the
  calculator from the ROI article. Both are hypotheses to test, not findings.

### C6 — The measurement period is contaminated by two confirmed updates and a steep AIO expansion

- **FACT:** Spam update 24 Sep–8 Oct 2026; core update from 10 Nov 2026, no completion reported;
  SISTRIX reports AIO share in Germany passing 50 % on 2 Nov (57,9 % on 6 Nov), nearly doubled
  since July; GSC AI-report logging error 9–11 Nov.
- **EVIDENCE:** §4, §5 (URLs).
- **HYPOTHESIS:** Part of the "impressions without clicks" pattern on informational queries is
  market-wide (AIO) rather than Cogniiq-specific.
- **ALTERNATIVE:** None of Cogniiq's queries trigger an AIO; the pattern is entirely positional.
- **CONFIDENCE:** medium for the dates (multiple trade sources citing the dashboard); low for any
  causal link to Cogniiq.
- **FALSIFIER:** Screenshots showing no AIO on the six CTR-suspect queries.
- **RECOMMENDED ACTION:** Freeze CTR/title experiments until the core update is confirmed complete
  + 7 days. Annotate 24 Sep, 8 Oct, 10 Nov (and the end date) in every GSC chart.

---

## 8. Assessment: a future "KI-Telefonassistent Vergleich / Anbieter" page

### What existing comparison pages contain (snippet-level only — pages were not opened)

- **Vendor count as headline** (5 … 33), year "2026", "im Test / getestet", sometimes an explicit
  "Stand <date>".
- **Per-vendor blocks:** origin country, target segment (KMU, Praxis, Handwerk, Contact Center),
  price from/to per month, per-minute price, included minutes, setup fee, trial terms (IONOS
  "1 Monat kostenlos", Placetel "10 Tage / 50 Freiminuten", fonio "30 Tage Geld-zurück"),
  hosting/DSGVO statement (EU / Frankfurt, AVV), languages/voices, integrations.
- **Segment verdicts** ("für Arztpraxen eher Aaron.ai oder VITAS, für kleine Betriebe fonio …").
- **Recurring vendor names:** fonio.ai, IONOS, Placetel AI, Aaron.ai (Doctolib), VITAS, Parloa,
  Synthflow, Zeeg, Famulor, smao, voiceOne, CloudTalk, Agentino, FlowLyne, Mindverse.
- **Authorship:** a few publishers/review platforms (OMR Reviews category with user reviews,
  Dr. Web, it-daily, hosttest) and **a large number of vendors ranking themselves** (fonio, zeeg,
  famulor, ainora, superchat, heyloha, voisa, retell, eesel, alloq). Several label themselves
  "ehrlich", which indicates the bias problem is already visible to the market.
- **Not visible in any snippet:** a disclosed test protocol, test-call recordings, measured
  outcomes, who paid for placement. (Absence in snippets ≠ absence on the pages.)

### Could a vendor-authored Cogniiq page credibly add distinct information?

**The bias problem is real and structural.** A vendor listing competitors and itself is the most
saturated page type in this space (≥10 seen). An eleventh "Die X besten Anbieter 2026" by a small
agency adds no information, has less authority than OMR/Dr. Web, and would require Cogniiq to
publish competitor prices and features it **cannot verify** — contrary to the repo's own rule
([REPO-DOC]: "Wettbewerberzahlen aus Snippets … sind nicht verwendbar") and to the claims regime in
`.claude/COPY-BRIEF-2.md`. Prices in this market change monthly (snippets already disagree with
each other for Placetel and fonio); a stale competitor price on a vendor's page is a liability
(§ 6 UWG comparative-advertising requirements: objective, verifiable, not misleading — legal
review needed, this is not legal advice).

What a vendor **could** credibly contribute — only if it stays inside what it actually knows:

1. **A category comparison instead of a vendor ranking:** self-service SaaS tool vs. feature inside
   a cloud telephone system (Placetel/IONOS type) vs. done-for-you service (Cogniiq type) vs.
   human answering service. What each category costs *structurally* (who configures, who tests,
   who maintains), with Cogniiq openly placed in one category and an explicit "wann wir nicht
   passen". This is knowledge an implementer has and a listicle writer does not. No competitor
   price needed.
2. **A buyer's test protocol:** the 10–15 calls a practice should place against any candidate
   during a trial (appointment change, emergency hint, dialect, interrupting, unknown request,
   handover), and how to score them. Reusable against every vendor, falsifiable by the reader,
   and consistent with the existing `/ki-telefonassistent-einfuehren` material.
3. **A cost-normalisation method:** how to convert per-call, per-minute, per-user and flat tariffs
   to one figure for *your* call volume (the snippets show this is where buyers get confused:
   "Unterschiede verstecken sich in der Abrechnungseinheit"). Cogniiq already has a calculator.
4. **Own primary data, if any exists and the owner releases it:** anonymised call-mix, share of
   calls resolved without handover, typical setup effort. Currently unverified → `[[CLAIM]]`,
   blocked until `OWNER-INPUT.md` is answered.
5. **A dated, sourced vendor table only as an optional appendix** — each cell linked to the
   vendor's own pricing page with "abgerufen am", no ranking, no winner, Cogniiq in the same table
   with the same columns. This requires the ability to open those pages (not possible from this
   sandbox) and a maintenance commitment (monthly).

- **FACT:** Vendor-authored "best-of" lists are saturated; category/criteria/test-protocol content
  appeared at most once (wirtschaftsforum "5 Kriterien") in the results seen.
- **HYPOTHESIS:** A criteria + category + test-protocol page offers information gain and can be
  written without biased competitor claims; it may still not rank for "vergleich" because the
  query appears to reward enumerated vendor lists.
- **ALTERNATIVE EXPLANATION:** Google rewards the list format itself; a non-list page is simply
  the wrong type again, however useful.
- **CONFIDENCE:** low–medium.
- **WHAT WOULD FALSIFY THIS:** German page 1 for "ki telefonassistent anbieter/vergleich"
  containing no criteria/guide-style result at all (only enumerated lists) → the format cannot
  rank there and the page should be judged as a sales-enablement asset, not an SEO asset.
- **RECOMMENDED ACTION:** Do not build a self-ranking listicle. If a page is built, build the
  category/criteria/test-protocol version, state authorship and interest in the first screen,
  include "wann wir nicht passen", and treat a sourced vendor table as a later, owner-approved
  and legally reviewed addition. In parallel, the higher-leverage route to appearing for
  "vergleich/anbieter" is **being listed in the existing third-party comparisons** (OMR Reviews
  category, Dr. Web's 33-vendor list, hosttest) — see `authority-acquisition-plan.md`.

---

## 9. What this analysis cannot tell you

- Any actual German position, title rewrite, snippet, ad, map pack, AI Overview, PAA or image pack.
- Whether Cogniiq is cited in any AI Overview.
- Anything about the content of competitor pages beyond search snippets.
- Whether the November 2026 core update has completed as of today.
- Query-level impression counts for "roi für prozessautomatisierung" and for the
  "internetagentur hotel(s)" family (not in the repo docs read for this report).

## 10. Search log (2026-11-20, US web-search tool)

Standard mode: `ki telefonassistent` · `ki telefonassistent kosten` · `ki telefonassistent preise` ·
`ki telefonassistent vergleich` · `ki telefonassistent anbieter` · `internetagentur hotel` ·
`internetagentur hotels` · `webdesign hotel` · `webdesign für hotels` · `website relaunch regensburg` ·
`roi prozessautomatisierung` · `prozessautomatisierung` · `prozessautomatisierung agentur` ·
`Webdesign Hotel Agentur Deutschland Hotel-Website Direktbuchungen` ·
`Prozessautomatisierung Agentur KMU n8n Make Automatisierungsagentur Deutschland` ·
`ROI Prozessautomatisierung berechnen Formel Amortisation` ·
`cogniiq KI Telefonassistent` (restricted to cogniiq.de) ·
`Google September 2026 spam update rolling out September 24` (restricted to seroundtable /
searchengineland / status.search.google.com).

Extended mode: `Website Relaunch Regensburg Agentur Webdesign Relaunch Homepage modernisieren` ·
`Internetagentur für Hotels Hotellerie Agentur Hotelwebsite erstellen lassen` ·
`KI Telefonassistent für Unternehmen Anbieter Placetel IONOS fonio Telekom kostenlos testen` ·
`Prozessautomatisierung Agentur Mittelstand Geschäftsprozesse automatisieren lassen Dienstleister` ·
`Google core update November 2026 rollout Search Status Dashboard` ·
`Google spam update OR core update September 2026 OR October 2026 rollout complete seroundtable` ·
`Google November 2026 core update rollout complete finished` (restricted) ·
`Google Search Console logging error impressions November 9 11 2026` ·
`AI Overviews Deutschland KI-Modus Änderung Oktober November 2026 Klickrate` ·
`SISTRIX AI Overviews Deutschland 57,9 Prozent Keywords November 2026 Beus` ·
`Google KI-Modus AI Mode Deutschland Neuerung Oktober 2026 AI Overviews Ausweitung …`.

Fetch attempts: `https://www.drweb.de/ki-telefonassistenten-vergleich/` → `ENOTFOUND` (not
allowlisted; no further competitor fetches). `https://status.search.google.com/summary` → no
connection. `https://www.cogniiq.de/*` → 200.
