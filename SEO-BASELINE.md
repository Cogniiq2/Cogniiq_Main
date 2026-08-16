# SEO-BASELINE — Metadaten-Snapshot vor Pass-2-Änderungen

Stand: 2026-08-16, Commit-Basis `6eac52b` · Branch `claude/cogniiq-copy-overhaul-mjkdf4`
Zweck: Rollback-Referenz (Brief II §7.1). URLs, Canonicals, hreflang, robots und
Redirects sind unantastbar und hier nur dokumentiert.

Hinweis: Die vier in der Audit-Phase bereits korrigierten Seiten (Hotel,
Restaurant, Bayern, Demo) sind mit **Vorher-Werten** dokumentiert; alle übrigen
Zeilen zeigen den Ist-Zustand nach Pass 1.

## Telefonassistent-Cluster (Stand nach Pass 1)

| Route | H1 | Title | Description (gekürzt) | Schema | Interne Links |
|---|---|---|---|---|---|
| `/ki-telefonassistent` | "Erreichbar, wenn niemand abnehmen kann. Ein KI Telefonassistent, zugeschnitten auf Ihren Betrieb." | "KI Telefonassistent – individuell konfiguriert \| Cogniiq" | "KI Telefonassistent mit Ihren Ansagen, Ihren Regeln…" | Service, FAQPage, HowTo (5 Schritte), BreadcrumbList | 12 (3 Spalten) + CTAs |
| `/ki-telefonassistent-arzt` | "KI Telefonassistent für Arztpraxen" | "KI Telefonassistent Arztpraxis – Terminannahme \| Cogniiq" | "…Terminwünsche, Stornierungen und Rezeptbestellungen strukturiert aufnehmen…" | Service, FAQPage, BreadcrumbList (via NationalIndustryPage) | 10 |
| `/ki-telefonassistent-praxis` | "KI Telefonassistent für Therapeuten & Praxen" | "KI Telefonassistent für Therapiepraxen \| Cogniiq" | "…erreichbar bleiben, während Sie behandeln…" | Service, FAQPage, BreadcrumbList | 10 |
| `/kosten-ki-telefonassistent` | "Was kostet ein KI Telefonassistent?" | "Was kostet ein KI Telefonassistent? Preise \| Cogniiq" | "…Feste monatliche Kosten statt Abrechnung pro Anruf…" | FAQPage, Offer-Angaben aus priceRanges | 9 |
| `/bayreuth/ki-telefonassistent` | "KI Telefonassistent in Bayreuth" | "KI Telefonassistent Bayreuth – Anrufannahme \| Cogniiq" | "…Anrufannahme mit Ihren Ansagen und Regeln… Betreuung vor Ort…" | LocalBusiness/Service über CityServicePage | 4 explizit + Komponenten-Links |
| `/regensburg/ki-telefonassistent` | "KI Telefonassistent in Regensburg" | "KI Telefonassistent Regensburg – Anrufannahme \| Cogniiq" | "…für Praxen, Gastronomie und Betriebe in Regensburg…" | dito | dito |
| `/muenchen/ki-telefonassistent` | "KI Telefonassistent für Unternehmen in München" | "KI Telefonassistent München – Telefonservice \| Cogniiq" | "…mehrsprachig möglich, strukturierte Übergabe…" | dito | dito |

## In der Audit-Phase geänderte Seiten — Vorher-Werte (Rollback-Referenz)

| Route | Element | Wert VOR Pass-2-Audit |
|---|---|---|
| `/ki-telefonassistent-hotel` | Description | "KI Telefonassistent für Hotels: Rezeptionsdienst auch außerhalb der Rezeptionszeiten, automatische Zimmerbuchungen und Gästeanfragen. Keine verpassten Direktbuchungen mehr." |
| `/ki-telefonassistent-hotel` | H1 / Title | unverändert geblieben: "KI Telefonassistent für Hotels & Pensionen" / "KI Telefonassistent für Hotels & Pensionen \| Rezeption auch nachts \| Cogniiq" |
| `/ki-telefonassistent-restaurant` | Description | "…Kein verpasster Tisch mehr – auch abends, nachts und am Wochenende." |
| `/ki-telefonassistent-restaurant` | H1 / Title | unverändert: "KI Telefonassistent für Restaurants & Gastronomie" / "KI Telefonassistent für Restaurants \| Automatische Tischreservierung \| Cogniiq" |
| `/bayern/ki-telefonassistent` | Description | "…entlastet Ihr Team – auch außerhalb regulärer Geschäftszeiten, DSGVO-konform, Made for Mittelstand." |
| `/bayern/ki-telefonassistent` | H1 / Title | unverändert: "KI Telefonassistent für Unternehmen in Bayern" (H1 + Title) |
| `/ki-telefonassistent/demo` | Description | "…Erleben Sie, wie Ihre KI Anrufe beantwortet und Termine automatisch bucht. Jetzt Demo-Termin sichern." |
| `/ki-telefonassistent/demo` | Title | unverändert: "KI Telefonassistent Demo buchen \| Cogniiq" |

## Zentrale Meta (`src/lib/seo-data.ts` → PAGE_META) — Ist-Zustand VOR Korrektur

| Route | Title | Description |
|---|---|---|
| `/` | "Cogniiq – KI-Telefonassistent, Webdesign & Automatisierung für Unternehmen in Bayern" | "…Kein Anruf geht verloren. Go-Live in 7–14 Tagen." |
| `/leistungen` | "Leistungen \| KI-Telefonassistent, Webdesign & Automatisierung – Cogniiq" | "…KI-Telefonassistent, der jeden Anruf beantwortet – Webdesign, das konvertiert – Automatisierung, die manuelle Arbeit eliminiert." |
| `/ueber-uns` | "Über Uns \| KI-Agentur Bayreuth – Lazar & Djordje Popovic – Cogniiq" | "…keine Beratungsfolien, keine generischen Pakete…" |
| `/faq` | "FAQ – Kosten, Ablauf & KI-Systeme \| Cogniiq Bayreuth" | "…Was kostet ein Projekt? Wie schnell geht es?…" |
| `/kontakt` | "Kostenloses Erstgespräch vereinbaren – Cogniiq \| KI-Agentur Bayern" | "30 Minuten – … Kein Pitch. Kein Standardangebot." |

## Unantastbar (dokumentiert, unverändert)

- Canonicals: identisch mit Route-URL auf allen o. g. Seiten (Basis `https://cogniiq.de`).
- Sitemap: `public/sitemap.xml`, deterministisch generiert (`scripts/generate-sitemap.mjs`), unverändert.
- hreflang: de-DE self-reference + x-default auf Homepage (durch Sitemap-Generator garantiert).
- robots: `/anfrage-erhalten` noindex + Disallow; sonst indexierbar.
- Redirects: `_redirects` portabel, keine Änderung.
