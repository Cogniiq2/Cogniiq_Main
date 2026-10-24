# RELEASE_CHECKLIST — Branch `claude/seo-design-pricing-2026-10` (24.10.2026)

Vorgänger: `claude/seo-release-fixes-2026-10` @ `ce42080` (Checkliste vom 23.10. gilt dort weiter).
Umgebung: Node 22.22.2, `VITE_SUPABASE_*` als CI-Platzhalter, Chromium headless, `wrangler pages dev dist`
lokal. **Produktion und Preview waren aus diesem Container nicht erreichbar** (Proxy 403); alles, was nur
dort prüfbar ist, steht als NOT VERIFIED.

| # | Prüfpunkt | Ergebnis | Evidenz |
|---|---|---|---|
| 1 | `npm run typecheck` | **PASS** | `tsc --noEmit -p tsconfig.app.json`, Exit 0 |
| 2 | `npm test` (vitest) | **PASS** | 115 Dateien · 2.800 bestanden · 1 übersprungen · 0 fehlgeschlagen (nach Umbau: `telefonassistent-rechner.test.ts`, `…grenzfaelle`, `telefonassistent-copy.test.ts`, `rechner-konsistenz.test.tsx`, `KostenKiTelefonassistent.test.tsx`, `homepageVerdichtung.test.tsx`, `KiTelefonassistentPage.rechner.test.tsx`) |
| 3 | `npm run build` (SSR, Sitemap, Client, Prerender, `_redirects`-Prüfung) | **PASS** | Exit 0; 86 Sitemap-URLs |
| 4 | `npm run lint` | **PASS** | 0 Fehler, 34 Warnungen (alle bereits auf `main`) |
| 5 | `test-seo-consistency`, `test-prerender-output`, `test-pages-routing` (inkl. HEAD-Matrix und 301), `test-deploy-cache-headers`, `test-public-theme`, `test-browser-hydration` | **PASS** | alle Exit 0 gegen den frischen Build |
| 6 | GET/HEAD, echte 404, 301 ohne Kette | **PASS (lokal)** / **NOT VERIFIED (Edge)** | `test-pages-routing` gegen wrangler: HEAD = GET-Status, kein Shell-Error, kein Body; `/webdesign-agentur-deutschland` → 301 `/webdesign` (beide Formen, `dist/_redirects` 77–78), Ziel 200, keine Kette; 0 interne Links auf die alte URL; nicht in Sitemap |
| 7 | Canonical genau einmal, Produktionspfad, Robots, eine H1 | **PASS** | Prerender der 8 URLs (7 Dokumente + Redirect): je eine H1, `rel=canonical` auf `https://cogniiq.de/<pfad>`, `index, follow`, 0 Treffer `pages.dev` |
| 8 | Title/Description | **PASS** | Descriptions: Arzt 158, Kosten 165, Zahnarzt 166 (unverändert), Flagship 155, Praxen 151, Webdesign 145, Regensburg 162 (unverändert) Zeichen; Titel unverändert außer keinem – Regensburg-Titel bleibt die Fassung vom 23.10. |
| 9 | Preise konsistent mit der zentralen Quelle | **PASS** | eine Quelle `TARIFE`/`EINRICHTUNG`/`SPRACHEN_PREISE`; auf allen 7 Dokumenten 0 Treffer „1.490/2.490/3.490", 0 Treffer „0,39", 0 Treffer „gedeckelt/kostet es nie mehr"; „angegebene Obergrenze" Kosten 13×, Praxen 2×, Arzt 1×, Flagship 1×; JSON-LD nur Monats-Offers 300/500/800 |
| 10 | Markt- vs. Cogniiq-Preise getrennt | **PASS** | Kostenseite: Markttabelle ohne Zahlen, Cogniiq-Zeile ausdrücklich „unser Modell", Hinweis „die Zeilen darüber beschreiben Marktmodelle, keine Cogniiq-Preise" |
| 11 | Rechner: keine Zeit-als-Geld-Rechnung, keine Amortisation ohne Einmalbetrag, offene Posten nie 0 | **PASS** | Kern ohne `ersteJahrSaldoEur`/`amortisationMonate`; `offeneKosten = ["einrichtung","anbindung"]`; Tests „Baustein A/B/C", „Geldsaldo" |
| 12 | Blaue Details | **PASS (Code)** / **NOT VERIFIED (visuell)** | `PubButton.primary` + `CTA_PRIMARY_CLASS` + 36 handgerollte Buttons in `bg-pub-signal`; Prerender: Arzt 7, Kosten 16, Zahnarzt 5, Flagship 13, Praxen 18, Webdesign 3, Regensburg 7 Signal-Vorkommen; verbleibende schwarze Fläche: die Chat-Blase des Gesprächsbeispiels auf dem Flagship (kein Button) – bewusst; `RechnerCta` und der Stimmprobe-Play-Button ebenfalls auf Signal. Kontrast weiß/Signal 6,27:1. Keine Screenshots, keine Prüfung bei 360/390/768/1440 |
| 13 | Claims | **PASS (Repo)** | keine neuen Garantien; Notfall nur als konfigurierte Weiterleitung; Zeit-/Kostenersparnis nur qualifiziert (Bausteine A/B/C) |
| 14 | Gewinnerdiffs | **PASS** | Dental: 1 Zeile (Finder-String vom 23.10., kein Inhalt); Regensburg: 0 Zeilen in diesem Durchgang; beide erhalten nur die gemeinsame Button-Farbe und gemeinsame Copy-Sätze |
| 15 | Interne Links / CTAs | **PASS (statisch)** | `test-prerender-output` (eingehende Links, nur Manifest-Ziele); Praxen-Router → Arzt/Zahnarzt/Therapie; Praxen → Kosten (Preise, Vertrag); Arzt → Kosten/Rechneranker |
| 16 | Formulare | **NOT VERIFIED (bewusst)** | kein Versand ausgelöst |
| 17 | Mobile 360/390/768, Desktop 1440, 200 % Zoom | **NOT VERIFIED** | kein Screenshot-Lauf möglich; statisch: Tabellen `overflow-x-auto`, Beträge `break-words` |
| 18 | Core Web Vitals | **NOT VERIFIED** | keine Messung |
| 19 | Tatsächlich geprüfte Preview-/Produktions-URLs | **NONE** | Netzwerk gesperrt; alle URL-Prüfungen gegen `127.0.0.1` (wrangler) |

## Verbleibende Deploy-Blocker

1. **J10 Einrichtungsbetrag** (oder ausdrückliche Freigabe, die Einrichtung öffentlich ohne Betrag
   zu nennen) sowie J11–J13 (Obergrenze, Mehrminuten, Sonderintegration) – `OWNER-INPUT.md`.
2. Edge-Verifikation von HEAD/Robots-Headern und Mobile-Rendering nach dem Preview-Deploy.

Nichts gemergt, nichts deployt.
