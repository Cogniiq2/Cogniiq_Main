# FINAL_SEO_CHANGELOG — Korrekturdurchgang 2026-10-23

Branch `claude/seo-release-fixes-2026-10`, abgezweigt von `claude/seo-audit-2026-10` @ `226512f`.
Kein Deploy, kein Merge. Jede Zeile nennt Ursache, Vorher/Nachher, Test und den kleinsten Rollback.
Kein pauschaler Rollback des SEO-Branches; keine einzelne Änderung des Branches wurde zurückgenommen.

## P0 · Technik

| Datei / URL | Ursache | Vorher → Nachher | Test | Minimaler Rollback |
|---|---|---|---|---|
| `functions/_middleware.ts` (alle prerenderten Routen) | `HEAD` lieferte 500 `X-Cogniiq-Shell-Error: asset body is not an HTML document`: Cloudflare beantwortet HEAD ohne Body, die Function las den leeren Body und prüfte ihn als Dokument | HEAD wird intern als GET gegen den Asset-Store aufgelöst; Antwort = gleicher Status, gleiche Header, `Content-Length` des Dokuments, **kein Body**. Redirects passieren unverändert; der 500-Pfad antwortet für HEAD ohne Textbody. Asset-Guard, Cache-Header, Canonical/Robots, 404-Status unverändert | `src/test/middleware-head.test.ts` (6 Fälle mit bodyloser HEAD-Antwort: Dokument, 404, privater Deep-Link, Redirect, kaputtes Asset) – **vor** dem Fix 4/6 rot; `.github/scripts/test-pages-routing.mjs` prüft gegen `wrangler pages dev` HEAD = GET-Status, kein Shell-Error, kein Body für 9 Pfade | `git checkout 226512f -- functions/_middleware.ts` (bringt den 500 zurück) |
| `scripts/lib/private-routing.d.mts` (neu) | Der Unit-Test zieht `functions/_middleware.ts` in das TS-Programm; das `.mjs`-Modul hatte keine Typen | Deklarationsdatei | `npm run typecheck` | Datei löschen, Test entfernen |
| `.github/scripts/test-pages-routing.mjs` | kein HEAD-Vertrag | HEAD-Block (9 Pfade: Dokumente, 404, Redirect, Sitemap, robots) | läuft im Build-Nachweis | Block entfernen |

## P0 · Preiswahrheit und Tarifempfehlung

| Datei / URL | Ursache | Vorher → Nachher | Test | Minimaler Rollback |
|---|---|---|---|---|
| `src/lib/telefonassistent-rechner.ts` · `berechnePreis` | Kommentar sagte, der Sprachaufschlag werde nicht still addiert; `monatlichGesamtEur` addierte ihn immer – auch dort, wo offen ist, ob er unter die Obergrenze fällt | Summe nur, wenn Telefonie + Aufschlag ≤ Obergrenze (beide Lesarten gleich). Darüber `UNBEKANNT` plus `monatlichSpanne {min: Obergrenze, max: Telefonie + Aufschlag}` | `telefonassistent-rechner.test.ts` „Sprachaufschlag und Obergrenze" (unter/über Obergrenze, nie Spanne ohne Sprache, alle Tarif-/Deckelgrenzen ±1) | Datei auf `226512f` zurücksetzen (bringt die stille Addition zurück) |
| ebd. · `tarifVergleich` (neu), `waehleSzenario` (unverändert, neu dokumentiert) | Rechner zeigte **einen** Tarif als „Passender Tarif"; die Zuordnungsregel (COPY-CLAIMS F10/Z1) ist vertraglich unbestätigt; ob ein Monatswert „dauerhaft" ist, weiß der Code nicht | Alle drei Listentarife bei diesem Aufkommen werden geliefert; die Oberfläche nennt „Tarif nach unserer Zuordnungsregel" und legt den Vergleich samt Hinweis „ob Sie bei einem Spitzenmonat im kleineren Tarif bleiben, regelt Ihr Vertrag – wir versprechen keinen günstigsten Tarif" offen | „1.000 × 2 Minuten: Regel nennt MVZ, Vergleich zeigt Basis/Praxis an der Obergrenze"; `rechner-konsistenz.test.tsx` Preis-Matrix unverändert grün; `grenzfaelle.test.ts` unverändert grün | Vergleichstabelle und Hinweis aus `TelefonRechner.tsx` entfernen |
| `src/components/TelefonRechner.tsx` (Preisblock) | leeres Anruffeld rechnete als 0 (Basis 300 €) | ohne beide Mengenangaben kein Preis, sondern Aufforderung; Hinweis „Beispiel – bitte anpassen"; Laufzeit + „Steuerbasis nennt Ihr Angebot" am Preis | Komponente rendert in `KostenKiTelefonassistent.test.tsx`, `homepageVerdichtung.test.tsx` | — |

**Bleibt P0-Blocker (OWNER INPUT, keine Regel erfunden):** Tarifzulässigkeit je Kunde; Definition
„dauerhaft" (Zeitraum, Schwelle, Umstellung, Mitteilung, Spitzen); Geltung des Deckels für
Sprach-/Integrations-/Kündigungsaufschläge; Bezugsgröße des 20-%-Aufschlags; Umfang der
24-Monats-Preisgarantie; Branchenbezug der Tarife; Sprachpaket-Staffel; Steuerbasis und
Drittkosten. Dokumentiert in `FINAL_SEO_RELEASE_AUDIT.md` §Owner-Inputs und `OWNER-INPUT.md`.

## P0/P1 · Nutzenrechner (ROI)

| Datei / URL | Ursache | Vorher → Nachher | Test | Minimaler Rollback |
|---|---|---|---|---|
| `src/lib/telefonassistent-rechner.ts` · `berechneNutzen` ersetzt `berechneWirtschaftlichkeit`, `kapazitaetsEingabe`, `personalkostenEingabe`, `ChancenEingabe` | Zeitwert (Telefonminuten × Routineanteil × Stundensatz) ging als Nutzen in Nettoeffekt, Jahreseffekt und Amortisation ein (Repro: 300 × 2 Min, 100 %, 50 €/h → +161 €/Monat, 9,3 Monate); KI-Minuten = menschliche Zeit; keine Nacharbeit; Zusatzfälle ohne Kapazität; Chancen als Pflicht | Drei Bausteine, jeder ausdrücklich an/aus: **A Zeit** (Teamanrufe × Team-Bearbeitungszeit × übernommener Anteil − Restaufwand; Zeitwert optional, nie im Saldo; ohne Restaufwand „bedingt"), **B Kosten** (tatsächlich entfallende Ausgaben, 0 gültig), **C Termine** (bereinigte Zusatztermine × Deckungsbeitrag, realisierbar nur bis freie Kapazität; ohne Kapazitätsangabe Potenzial, nicht im Saldo). Geldsaldo = B + C − bekannte laufende Kosten; Erstjahr = 12 × Saldo − Einrichtung (Annahme benannt); Amortisation nur bei Saldo > 0 und bekannten Kosten; Anbindung immer als offen; Kapazitätskonflikt B∧C gemeldet; leer ≠ 0; Prozent 0–100; keine NaN/Infinity | `telefonassistent-rechner.test.ts` 71 Fälle, darunter die Pflichtfälle des Auftrags: 300 × 2 Min (339 €, 1.490 €, 5.558 €), 50 % ohne Nacharbeit = 5 h / 150 € Zeitwert und **kein** −189 €, 100 %/50 €/h = 10 h / 500 € ohne Amortisation, 1.000 × 2 Min, Grenzen ±1, Sprachen 0–3, leer/0/negativ/150 %/NaN/1e9, 0 Termine, 0 Kapazität, Fixture 600 + 5 × 40 − 339 = 461 €/Monat, 4.042 €/Jahr, 3,23 Monate, Saldo ≤ 0, offene Kosten, Matrix | `git checkout 226512f -- src/lib/telefonassistent-rechner.ts src/components/TelefonRechner.tsx src/lib/telefonassistent-rechner.test.ts src/lib/rechner-konsistenz.test.tsx` (bringt die Zeitwert-Amortisation zurück – nicht empfohlen) |
| `src/components/TelefonRechner.tsx` (Nutzenblock) | Pflichttrichter, „für viele Betriebe der größere Posten", „trägt sich nicht … Erstgespräch sparen", 150 % blieb im Feld, Slider-Max = Feld-Max | Drei Ergebnisse (A Std., B €, C €) + Geldsaldo mit Umfang („ohne Kostensenkung, ohne zusätzliche Termine"), Kurztext „Mehr Zeit bedeutet nicht automatisch weniger Lohnkosten …", `Zahlenfeld` klemmt auf [min, max], rundet Ganzzahlen, `schieberMax` getrennt vom Feld-Max, `aria-describedby`, `role="checkbox"` für Bausteine; CTA „Szenario und Anbindung prüfen"; Hinweis, dass der Link keine Eingaben mitträgt | `rechner-konsistenz.test.tsx` „Nutzenbausteine — ein Kern, beide Flächen" (keine zweite Implementierung, aktiv-Schalter, keine Vorgabewerte, kein Baustein vorgewählt, keine `_completed`-Events) | wie oben |
| `src/lib/consent.ts` | `price_calculator_completed` / `roi_calculator_completed` feuerten beim CTA-Klick (maßen Absicht) | `price_calculated` (Preis liegt vor, einmal) und `roi_calculated` (Geldsaldo liegt vor, einmal); CTA nur `cta_demo_click` | `rechner-konsistenz.test.tsx` Analytics (nur feste Zeichenketten) | Namen zurückbenennen |
| `src/pages/costs/KostenKiTelefonassistent.test.tsx`, `src/components/homepageVerdichtung.test.tsx` | pinnten das Label „Passender Tarif" | „Tarif nach unserer Zuordnungsregel" | — | — |

## P1 · Claims und Quellen

| Datei / URL | Ursache | Vorher → Nachher | Test | Minimaler Rollback |
|---|---|---|---|---|
| `src/lib/telefonassistent-copy.ts` · `GRENZEN.points[2]` (Flagship, Praxen, Arzt, Zahnarzt-Grenzen) | „Notfälle werden erkannt und sofort weitergeleitet" – Erkennungsgarantie | „Hinweise auf einen Notfall – Signalwörter und Formulierungen, die Sie festlegen – lösen … die hinterlegte Weiterleitung aus … eine Erkennung jedes Notfalls versprechen wir nicht." | `KiTelefonassistentArzt.tsx` wirft beim Build, wenn der Punkt fehlt (`GRENZEN_NOTFALL`) | Satz zurücksetzen |
| ebd. · `PATIENTEN_SICHT.stat` (Praxen) | 39 % als „Erreichbarkeit von Praxen" | „der befragten Versicherten … Erreichbarkeit medizinischer Versorgung außerhalb der üblichen Praxisöffnungszeiten … Aussage über die Versorgung insgesamt, nicht über das Praxistelefon", Quelle mit n = 3.520 | `telefonassistent-copy.test.ts` | — |
| ebd. · `ANLIEGEN`/`UEBERGABE_ABWICKLUNG` | „Das ist der Rückfallweg, nicht der Normalfall"; „Im Normalfall niemand" – unbelegter Normalfall | „Welcher Ihrer Abläufe welchen Weg nimmt, erfahren Sie vor der Unterschrift"; „Für die freigegebenen Abläufe niemand" | — | — |
| ebd. · Vorteilsliste | „niemand hört mehr ein Besetztzeichen" (absolut) | „deutlich seltener ein Besetztzeichen" | `rechner-konsistenz.test.tsx` „verspricht nirgends unbedingte Erreichbarkeit" | — |
| `src/pages/industries/KiTelefonassistentArzt.tsx` | „Die Hälfte der Anrufe ist keine Terminfrage" (unbelegter Anteil); FAQ-Antwort mit „..": `DATENSCHUTZ_PUNKTE.join(". ")` auf Sätzen mit Schlusspunkt; identischer Patientensicht-Abschnitt wie `/praxen` | „Ein großer Teil der Anrufe …"; Schlusspunkte vor dem Join entfernt; Abschnitt entfernt (steht einmal auf dem Hub), Kommentar erklärt warum | Prerender-Prüfung: keine „.." mehr im sichtbaren Text | Abschnitt aus `226512f` zurückkopieren |
| `src/pages/PraxenPage.tsx` · vzbv-Kasten | „Mehr als ein Drittel der Befragten" (alle Patienten impliziert) | „der befragten Nutzerinnen und Nutzer von Arztterminportalen … Aussage über diese Nutzergruppe" – **Originalquelle im Container nicht abrufbar (Netzwerk gesperrt); Formulierung folgt dem Review-Befund, Prüfung NOT VERIFIED** | — | — |
| Zi 52,1 % / 46 % | Prüfung: sichtbar nur auf `/ki-telefonassistent-einfuehren` mit korrekter Bezugsgröße (wechselwillige Teilnehmende, PVS-Monitoring 2025); in `telefonassistent-copy.ts` nur in Kommentaren | keine Änderung nötig | — | — |

## P1 · Inhalt, Rollen, Metadaten

| Datei / URL | Ursache | Vorher → Nachher | Test | Minimaler Rollback |
|---|---|---|---|---|
| `src/pages/PraxenPage.tsx` (`/praxen`) | Praxisarten-Wegweiser stand am Seitenende hinter der Hausarzt-Strecke; Hub las sich wie zweite Arztseite | Block „Welche Praxis sind Sie?" (Arzt / Zahnarzt / Therapie) direkt nach dem Hero, mit Satz, was der Hub einmal erklärt; alter Block am Ende entfernt, Regionalliste bleibt. Head/H1 unverändert | Prerender: eine H1, Links vorhanden | Block zurück ans Ende |
| `src/pages/KiTelefonassistentPage.tsx` (`/ki-telefonassistent`) | zwei Hero-Absätze zur Integration; „Eingesetzt in Branchen" ohne Einsatznachweis; „der Platz ist sofort wieder frei"; FAQ wiederholte „Deutsch ist enthalten" | ein Absatz; „Geeignet für Branchen mit hohem Telefonaufkommen"; „der frei gewordene Platz ist wieder vergebbar"; FAQ ohne Dopplung. Titel/H1/Rechneranker unverändert | — | Einzelzeilen zurücksetzen |
| `src/lib/routing/publicRoutes.ts` + `src/pages/cluster/regensburg/WebsiteRelaunchRegensburg.tsx` (`/regensburg/website-relaunch`, geschützt) | Title „Modernisierung ohne Rankingverlust", Lead „ohne Verlust bestehender Rankings", Tag „Kein Ranking-Verlust", „verbessert nachweislich", „gehen nicht verloren – sie werden verbessert", FAQ „Bei sorgfältiger SEO-Migration nicht" – Garantien | Title „Website Relaunch Regensburg – Modernisierung & SEO-Migration \| Cogniiq" (lokaler Querykern erhalten); Zielformulierungen statt Garantien; FAQ nennt Restrisiko und Kontrolle. **H1, Struktur, Preise/Zeiten unverändert**; die generischer gewordenen „ab 2.000 €"/„3–8 Wochen" aus dem SEO-Branch bleiben bis zur Inhaber-Bestätigung | Prerender-Head | Title-Zeile und 5 Sätze zurücksetzen; Konflikt Titel-Schutz vs. Wahrheit bewusst zugunsten der Wahrheit gelöst |
| `src/lib/routing/publicRoutes.ts` (`/webdesign`) | Description zählte sieben Themen auf | „Webdesign für Unternehmen: was eine Website bei Cogniiq umfasst, wer die Inhalte liefert, was den Preis bestimmt und wie ein Projekt bis zum Go-live abläuft." | ≤ 158 Zeichen (Manifest-Test) | — |
| ebd. (`/ki-telefonassistent-arzt`) | Description versprach Terminvergabe ohne Integrationsbedingung | „… vergeben, verschieben, absagen – über den vorher geprüften Kalenderweg. …" | Manifest-Test | — |
| ebd. (`/kosten-ki-telefonassistent`) | „gedeckelter Rechnung" (Deckel gilt nur Telefonie), „Zwei-Wochen-Garantie" (Übergabe, nicht Go-live) | „gedeckelter Telefonie und Übergabe in zwei Wochen" | Manifest-Test | — |
| Dental `/ki-telefonassistent-zahnarztpraxis` | — | **keine Änderung** in diesem Durchgang (nur die gemeinsame `GRENZEN`-Korrektur wirkt dort mit) | Diff gegen `226512f` leer für die Datei | — |
| `/webdesign` Körper | echte Projektbelege gesucht | **nicht gefunden, nichts erfunden**: OWNER TODO (Projekte, Screenshots, Rechte) – kein leerer Platzhalter gesetzt; 13-Schritte-Prozess unverändert, weil die Lead-Zeile bereits keine festen Dauern nennt | — | — |

## Dokumente

`FINAL_SEO_RELEASE_AUDIT.md`, `FINAL_SEO_CHANGELOG.md` (dieses), `FINAL_KEYWORD_OWNERSHIP.md`,
`FINAL_EXTERNAL_AUTHORITY_PLAN.md`, `RELEASE_CHECKLIST.md`; Verweise in `SEO_AUDIT_2026.md`,
`SEO_CHANGELOG.md`; Messzeilen in `docs/seo/organic-growth-scoreboard.md`; Owner-Fragen in `OWNER-INPUT.md`.
