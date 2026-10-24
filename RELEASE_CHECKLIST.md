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
