# RELEASE_CHECKLIST — Branch `claude/seo-design-pricing-2026-10` (24.10.2026, Nachtrag 2)

Vorgänger auf diesem Branch: `00228b7` (Checkliste dort überholt: Einrichtung offen, Obergrenze
„angegeben", Blau nur Code-geprüft). Umgebung: Node 22.22.2, `VITE_SUPABASE_*` als CI-Platzhalter,
Chromium headless gegen den lokalen Build. **Preview und Produktion waren aus dem Container nicht
erreichbar**; alles, was nur dort prüfbar ist, steht als NOT VERIFIED.

| # | Prüfpunkt | Ergebnis | Evidenz |
|---|---|---|---|
| 1 | `npm run typecheck` | **PASS** | Exit 0 |
| 2 | `npm test` (vitest) | **PASS** | 115 Dateien · 2.808 bestanden · 1 übersprungen · 0 fehlgeschlagen |
| 3 | `npm run build` | **PASS** | Exit 0 (SSR, Sitemap, Client, Prerender, `_redirects`) |
| 4 | `npm run lint` | **PASS** | 0 Fehler, 34 Warnungen (bereits auf `main`) |
| 5 | `test-seo-consistency`, `test-prerender-output`, `test-pages-routing` (HEAD-Matrix, 301), `test-deploy-cache-headers`, `test-public-theme`, `test-browser-hydration` | **PASS** | alle Exit 0 gegen den frischen Build |
| 6 | 8 SEO-URLs im Prerender | **PASS** | je eine H1; Canonical `https://cogniiq.de/<pfad>`; `index, follow`; 0 × `pages.dev`; `/webdesign-agentur-deutschland` → 301 `/webdesign` (beide Formen) |
| 7 | Alte Preislogik weg | **PASS** | 0 Treffer „Obergrenze", „gedeckelt", „Höchstpreis", „1.490/2.490/3.490", „0,39" auf allen Dokumenten; „Preisdeckel" nur in der Verneinung „Einen Preisdeckel gibt es nicht" / „Es gibt keinen Preisdeckel" |
| 8 | Neue Preise sichtbar | **PASS** | „0,50 €": Kosten 28×, Praxen 10×, Flagship 8×, Arzt 3×, Zahnarzt 1×; „990 €": Kosten 16×, Flagship 5×, Praxen 5×, Arzt 1×; JSON-LD Kosten: Offers 300 / 500 / 800 + Einrichtung 990 |
| 9 | Meta = Preisquelle | **PASS** | Kosten-Description in Manifest und `PageSEO` per Test gegen `TARIFE`/`FAKTEN`/`EINRICHTUNG` abgeglichen |
| 10 | Rechner-Pflichtfälle | **PASS** | 500 → Basis 300 · 1.000 → Praxis 500 (Basis 550) · 1.500 → Praxis 750 (Basis 800, MVZ 800) · 2.000 → MVZ 800 (Basis 1.050, Praxis 1.000) · 3.000 → MVZ 1.300 (Basis 1.550, Praxis 1.500) |
| 11 | Grenzen | **PASS** | 499/500/501, 999/1.000/1.001, 1.999/2.000/2.001 je Tarif; Gleichstand 900 → Praxis, 899 → Basis 499,50; 1.600 → MVZ, 1.599 → Praxis; linear ohne Deckel bis +5.000 Min; keine Rundung (500,5 Min → 300,25 €) |
| 12 | Blaue Details visuell | **PASS (lokal gerendert)** / **NOT VERIFIED (Preview)** | Screenshots Desktop 1440 × 900 und Mobil 390 × 844 aller fünf TA-Routen vorher/nachher; Zählung siehe `FINAL_SEO_CHANGELOG.md` B2. Nicht geprüft: 360/768 px, 200 % Zoom, Dark Mode per Screenshot, echte Preview-URL |
| 13 | Nutzungsbericht / Alarme | **NICHT IMPLEMENTIERT** | Website verspricht keinen; nur Ausweis auf der Monatsrechnung (Inhabervorgabe). OWNER-INPUT J14 |
| 14 | Rundung, Steuerbasis | **OFFEN** | OWNER-INPUT J15, J8 |
| 15 | Formulare, Core Web Vitals | **NOT VERIFIED** | kein Versand, keine Messung |

## Verbleibende Deploy-Blocker

1. J8 Steuerbasis (netto/brutto) – die Seiten nennen Beträge ohne Zusatz.
2. J15 Rundungsregel – bis zur Entscheidung sagt die Website, dass der Vertrag sie festlegt.
3. Sichtprüfung der Cloudflare-Preview durch den Inhaber (Blau, Mobil).

Nichts gemergt, nichts deployt.

---

# Release-Prüfung 04.11.2026 — Branch `claude/release-fixes-2026-11`

Basis: `claude/seo-design-pricing-2026-10` @ `2936360` (10 Commits vor `origin/main` @ `ed0f8e4`,
0 dahinter → konfliktfrei mergebar). Der Ausgangsbranch bleibt unverändert. Umgebung: Node 22,
`VITE_SUPABASE_*` als Platzhalter, Playwright-Chromium gegen den lokalen Build. **Produktion und
Cloudflare-Preview waren aus dem Container erneut nicht erreichbar (Proxy 403 / DNS gesperrt).**

## Korrekturen

| Prio | Datei | Ursache | Status |
|---|---|---|---|
| P1 | `src/pages/pillars/KiAgenturDeutschland.tsx` | FAQ + FAQPage-JSON-LD nannte „ab ca. 99 € … 199–399 € … ab 499 €/Monat" – widerspricht 300/500/800 € (bestand schon auf `main`) | behoben: Antwort aus `TARIFE`/`FAKTEN`/`EINRICHTUNG` |
| P1 | `src/lib/telefonassistent-copy.ts` (`VERTRAG`) | Kostenseite: „Innerhalb dieser Zeit ändert sich Ihr Monatsbetrag nicht." widerspricht Mehrminuten ohne Deckel | behoben: Satz entfernt, Garantieumfang bleibt J5 |
| – | `src/lib/telefonassistent-copy.test.ts` | Regressionstests (rot auf altem Code, grün danach); Seite in den Kernzahl-Scan aufgenommen | neu |

## Ergebnisse (Fix-Branch)

| Prüfung | Ergebnis |
|---|---|
| `npm run typecheck` | PASS |
| `npm run lint` | PASS (0 Fehler, 34 Warnungen, unverändert ggü. `main`) |
| `npm test` | PASS – 115 Dateien, 2.811 bestanden, 1 übersprungen (Hydration-Datei läuft mit Build) |
| `npm run build` | PASS – 89 Routen (86 indexierbar, 3 noindex), Arbeitsbaum nach Build sauber |
| alle 34 Skripte aus `.github/workflows/build.yml` (u. a. SEO-Konsistenz, Prerender, Browser-Hydration mit 600 ms Verzögerung, Cache-Header, `wrangler pages dev`-Routing inkl. HEAD-Matrix, Public Theme) | PASS, 0 Fehler |
| Browser 360/390/768/1440 px + 200 % Zoom, 9 Seiten | kein horizontaler Überlauf, je 1 H1, keine Konsolenfehler außer dem extern geladenen Spline-Modell (Netzsperre) |
| Rechner im Browser | −5 → 0, 999.999 → 100.000, leer → kein Preis, 2,5 → 3 Anrufe; +1 Sprache 79 €; ab +2 keine Summe |
| JSON-LD-Preise sitewide | nur Kosten-Seite mit Offers 300/500/800/990; keine abweichenden TA-Beträge mehr |

## NOT VERIFIED

HEAD/GET, `X-Robots-Tag` und Rendering auf der echten Cloudflare-Edge (Preview und Produktion),
Core Web Vitals/Lighthouse im Feld, Formularversand, GA4/Ads-Tags nach Einwilligung.
