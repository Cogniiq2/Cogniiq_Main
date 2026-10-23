# RELEASE_CHECKLIST — Branch `claude/seo-release-fixes-2026-10` (23.10.2026)

Umgebung: Node 22.22.2, `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` als CI-Platzhalter, Chromium
headless (vorinstalliert), `wrangler pages dev dist` lokal. **Produktion (`cogniiq.de`) und
Preview (`511f15e7.cogniiq-main.pages.dev`) waren aus diesem Container nicht erreichbar**
(Proxy 403 für beide Hosts, `curl` Exit 56). Alles, was nur dort prüfbar ist, steht als
NOT VERIFIED mit dem Grund.

| # | Prüfpunkt | Ergebnis | Evidenz |
|---|---|---|---|
| 1 | `npm run typecheck` | **PASS** | `tsc --noEmit -p tsconfig.app.json`, Exit 0 (inkl. `functions/_middleware.ts` über den neuen Unit-Test) |
| 2 | `npm test` (vitest) | **PASS** | 115 Dateien · 2.805 bestanden · 1 übersprungen · 0 fehlgeschlagen; davon neu: `src/test/middleware-head.test.ts` (6), `telefonassistent-rechner.test.ts` (71 nach Umbau) |
| 3 | `npm run build` (SSR-Build, Sitemap, Client, Prerender, `_redirects`-Prüfung) | **PASS** | Exit 0; 86 Sitemap-URLs; „dist/ was not modified" trat nur im Zwischenstand auf, bevor die `GRENZEN`-Finder in Einführen/Zahnarzt nachgezogen waren |
| 4 | `npm run lint` | **PASS** | 0 Fehler, 34 Warnungen (alle bereits auf `main`) |
| 5 | GET/HEAD-Matrix | **PASS (lokal)** / **NOT VERIFIED (Edge)** | Unit-Test mit bodyloser HEAD-Antwort: Dokument 200, 404, privater Deep-Link mit `X-Robots-Tag`, Redirect 307, kaputtes Asset 500 ohne Textbody – alt 4/6 rot, neu 6/6 grün. `wrangler pages dev`: HEAD = GET-Status, kein `X-Cogniiq-Shell-Error`, kein Body für `/`, `/ki-telefonassistent-arzt`, `/kosten-ki-telefonassistent`, `/praxen`, `/app/login`, `/completely-unknown-url` (404), `/webdesign-agentur-deutschland` (301), `/sitemap.xml`, `/robots.txt`; `/praxen/` → 307. Edge-Verhalten nach Deploy per `curl -I` nachholen |
| 6 | Echte 404 | **PASS (lokal)** | GET und HEAD `/completely-unknown-url` → 404 mit 404-Dokument; kein Soft-404 |
| 7 | 301 `/webdesign-agentur-deutschland` → `/webdesign`, keine Kette/Loop | **PASS (lokal)** | `dist/_redirects` Zeilen 77–78 (beide Formen); wrangler 301 → `/webdesign` (200); `legacyRedirects.test.ts` |
| 8 | Canonical genau einmal, Produktionspfad, Ziel indexierbar | **PASS** | Prerender der 7 Prioritäts-URLs: ein `rel="canonical"` auf `https://cogniiq.de/<pfad>`, `robots index, follow`; 0 Treffer `pages.dev` in HTML und Sitemap |
| 9 | Sitemap: nur kanonische indexierbare Ziele, keine Redirectquelle, keine Preview-Hosts | **PASS** | 86 `<loc>`, 0 Treffer `webdesign-agentur-deutschland`/`pages.dev`; `npm run sitemap` im Build |
| 10 | robots je Umgebung | **PASS (Repo)** / **NOT VERIFIED (Preview-Header)** | Repo setzt kein Preview-`noindex`; der im Review beobachtete `X-Robots-Tag: noindex` auf der Preview kommt aus der Umgebung und darf nicht in Produktion erscheinen – nach Deploy per `curl -I https://cogniiq.de/` prüfen |
| 11 | Title/Description, eine H1, H2/H3 | **PASS** | Prerender: je eine H1 auf Arzt, Kosten, Flagship, Praxen, Regensburg, Webdesign, Zahnarzt; Descriptions Arzt 158, Praxen 151, Kosten 157, Flagship 157, Webdesign 145 Zeichen; Regensburg 164 (unverändert, geschützt) |
| 12 | SSR/Prerender = Hydration | **PASS** | `src/prerender.hydration.test.tsx` 19/19 gegen den frischen Build; `.github/scripts/test-browser-hydration.mjs` (echter Chromium) bestanden |
| 13 | JSON-LD gültig, dedupliziert, keine erfundenen Ratings/Offers | **PASS** | 5 `ld+json`-Blöcke je Seite (4 auf Zahnarzt), `test-seo-consistency.mjs` bestanden; kein `AggregateRating`/`Offer` hinzugefügt; FAQ-Schema wie vor dem Durchgang, kein Rich-Result zugesagt |
| 14 | hreflang | **PASS** | unverändert: `de-DE` je Seite, `x-default` nur auf `/` (ein Sprachcluster); nicht erweitert |
| 15 | Interne Links, Fragmente, Haupt-CTAs | **PASS (statisch)** | `test-prerender-output.mjs` (jede indexierbare Route eingehend verlinkt, Links nur auf Manifest-Routen); Rechneranker `#preis-roi-rechner` genau einmal auf `/ki-telefonassistent`, Links von `/`, Arzt, Praxen zeigen dorthin; neuer Praxen-Router verlinkt Arzt/Zahnarzt/Therapie |
| 16 | Formulare | **NOT VERIFIED (bewusst)** | kein Versand ausgelöst; Demo-/Kontaktpfade sind in `test-pages-routing.mjs` als Journeys abgedeckt; keine Zustellbehauptung |
| 17 | Responsive 360/390/768/1440, 200 % Zoom, Tabellen/Rechner ohne Overflow | **NOT VERIFIED** | kein Screenshot-Lauf möglich (kein Viewport-Screenshot-Skript im Repo; Preview nicht erreichbar). Statisch: Tarifvergleich in `overflow-x-auto`, Beträge `break-words`, Eingaben `min-w-0`; Mobile-Rendering bleibt vor dem Deploy manuell zu prüfen |
| 18 | Tastatur/Screenreader | **PASS (statisch)** / **NOT VERIFIED (AT)** | Bausteine `role="checkbox"` + `aria-checked`, Felder mit `label`/`aria-describedby`, Ergebnisbereiche `aria-live="polite"`, `Rollwert` mit `sr-only`-Endwert; kein Screenreader-Lauf |
| 19 | Claims | **PASS (Repo)** | Notfall-Erkennung → konfigurierte Weiterleitung (Copy, Blog, CostComparison); „Hälfte", „Normalfall", „niemand hört ein Besetztzeichen", Regensburg-Garantien korrigiert; Build bricht, wenn der `GRENZEN`-Notfallpunkt fehlt |
| 20 | Preise | **PASS (Code)** / **BLOCKER (Regeln)** | alle Beträge aus `TARIFE`/`FAKTEN`/`SPRACHEN_PREISE` (`rechner-konsistenz` „tippt keinen Betrag erneut"); Zuordnungsregel offengelegt statt „günstigster Tarif"; Sprachaufschlag als Spanne über der Obergrenze; **J1–J8 unbestätigt → NOT READY** |
| 21 | Quellen | **PASS** (GKV, Zi) / **NOT VERIFIED** (vzbv) | GKV 39 % mit Population/Gegenstand/n; Zi 52,1 % nur auf Einführen mit Bezugsgröße; vzbv-Original nicht abrufbar, Formulierung auf die befragte Nutzergruppe eingeschränkt |
| 22 | Gewinnerdiffs | **PASS** | Dental: 1 Zeile (Finder-String), kein Inhalt; Regensburg: 12 Zeilen (Title, Lead, Tag, 2 Sätze, 1 FAQ), H1/Struktur/Preise unverändert; keine Shared-Component-Änderung außer `GRENZEN.points[2]` (bewusst, dokumentiert) |
| 23 | Analytics | **PASS** | nur feste Ereignisnamen/Labels (`rechner-konsistenz` Analytics-Suite); `price_calculated`/`roi_calculated` getrennt von `cta_demo_click`; keine Werte in URL/Event; Consent-Gate unverändert (`trackEvent` prüft `analytics === 'granted'`) |
| 24 | Core Web Vitals | **NOT VERIFIED** | keine Labor- oder Feldmessung in diesem Durchgang; nichts Gegenteiliges behauptet |
| 25 | Tatsächlich geprüfte Preview-URLs | **NONE** | Netzwerk gesperrt; alle URL-Prüfungen gegen `wrangler pages dev dist` auf 127.0.0.1 |

## Verbleibende Release-Blocker

1. Tarifregeln J1–J8 (`OWNER-INPUT.md`) – ohne sie bleibt jede Preissumme eine Teilsumme und die
   Zuordnungsregel eine veröffentlichte, aber vertraglich ungedeckte Zusage.
2. Edge-Verifikation des HEAD-Fixes und der Preview-/Produktions-Robots-Header nach dem Deploy der
   Preview (Punkte 5, 10).
3. Mobile-Rendering 360/390/768 (Punkt 17) vor der Freigabe manuell prüfen.
