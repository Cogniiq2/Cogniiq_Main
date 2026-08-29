# Post-experiment opportunities

Angelegt: 2026-08-29 · Basis-Commit `0652c2e`

Sechs Routen laufen als Suchexperimente und sind eingefroren. Dieses Dokument
sammelt, was an ihnen auffällt, **damit es nicht am Experiment vorbei umgesetzt
wird**. Nichts hier darf angefasst werden, solange die Route in
`PROTECTED_EXPERIMENT_PATHS` steht (`src/lib/routing/protectedExperiments.ts`).

Der Test `src/protectedExperiments.test.tsx` erzwingt das: Er vergleicht Titel,
Description, Canonical, Robots, H1, Fließtext, JSON-LD und ausgehende Anker mit
einer festgeschriebenen Fassung und zählt zusätzlich, wie oft im Quelltext auf
jede dieser Routen verwiesen wird.

## Ablauf, wenn ein Experiment endet

1. Ergebnis in `docs/seo/organic-growth-scoreboard.md` festhalten.
2. Pfad aus `PROTECTED_EXPERIMENT_PATHS` entfernen.
3. `npm run seo:baseline` ausführen, damit die Fixture die verbleibenden Routen
   abbildet.
4. Die Punkte unten in einem eigenen, kleinen PR umsetzen — nicht gebündelt mit
   anderer Arbeit, damit die Wirkung zurechenbar bleibt.

---

## `/bayreuth/website-relaunch`

Läuft seit 2026-08-29 mit einem Titel-Experiment (Aufnahme des Begriffs
„Performance"); Protokoll in
`docs/SEO-EXPERIMENT-BAYREUTH-PERFORMANCE-TITLE-2026-08-29.md`.

- **Nach dem Experiment:** Falls der Titel die CTR hebt, dieselbe Prüfung für
  `/regensburg/website-relaunch` und `/muenchen/website-relaunch` wiederholen —
  aber einzeln und nacheinander, nicht als Sammeländerung. Sonst ist wieder
  nicht zuzuordnen, was gewirkt hat.
- **Beobachtung, nicht umsetzen:** Die H1 („Website Relaunch in Bayreuth")
  nennt „Performance" nicht, der Titel jetzt schon. Ob die Angleichung der H1
  hilft oder das Relaunch-Signal verwässert, ist offen und wäre das nächste
  saubere Einzelexperiment.

## `/regensburg/website-relaunch`

- Beschreibt Prüfkriterien einer Leistung, darunter „DSGVO-Konformität"
  (`src/pages/cluster/regensburg/WebsiteRelaunchRegensburg.tsx:40`). Das ist
  nach HONESTY-AUDIT §7.7 zulässig, weil es ein Prüfpunkt einer Dienstleistung
  ist und keine Aussage über das eigene Produkt. **Kein Handlungsbedarf** —
  hier nur vermerkt, damit es bei einer späteren Claim-Runde nicht
  fälschlich als Verstoß angestrichen wird.

## `/muenchen/webdesign-kosten`

Nach dem Experiment zu prüfen — alles **Claim-Hygiene**, kein SEO-Gewinn:

- `src/pages/cluster/muenchen/WebdesignKostenMuenchen.tsx:130` — „Monatliche
  Betreuung ab ca. 350 € / Monat" ist ein Preis ohne bestätigte Grundlage
  (Klasse Z6/Z12 in `COPY-CLAIMS-TO-VERIFY.md`).
- Ebd. `:138` — „Launch: 7–14 Tage. Wachstum: 3–6 Wochen. Marktführer: 6–10
  Wochen." Fristen ohne Beleg. Für den Telefonassistenten wurde die Frist
  bereits korrigiert; für Webdesign steht diese Prüfung noch aus.
- Ebd. `:32`, `:82` — „Marktführer" als Paketname. Reklamehafte Übertreibung,
  keine Aussage über Cogniiq. Geringes Risiko, nur der Vollständigkeit halber.

## `/bayreuth/webdesign`

- `src/lib/standorte-service-configs.ts:357` — „Auf Wunsch organisieren wir das
  Hosting bei einem deutschen oder europäischen Anbieter." Grenzfall zu
  §7.7: Die Ausnahme für einen vom Kunden selbst beauftragten Dritten greift
  vermutlich, „organisieren wir" rückt es aber näher an eine Aussage über die
  eigene Infrastruktur. **Nach dem Experiment neu formulieren**, sodass der
  Auftrag des Kunden eindeutig im Satz steht.
- Die Seite trägt mit 38 Quelltext-Verweisen die meisten internen Links aller
  eingefrorenen Routen. Nach dem Experiment lohnt eine Prüfung, ob diese
  Linkmenge noch der Bedeutung der Seite entspricht.

## `/ki-telefonassistent-arzt`

- Claim-Scan sauber: keine verbotene Formulierung gefunden.
- **Die eigentliche Frage ist die Struktur, nicht der Text.** Diese Route,
  `/praxen` und `/ki-telefonassistent-praxis` konkurrieren um dieselbe
  medizinische Suchintention. Der Einstieg dieser Seite und die H1 von
  `/praxen` erzählen fast dieselbe Szene. Nach dem Experiment gehört
  entschieden, welche Seite die Intention „KI Telefonassistent Arztpraxis"
  kanonisch besitzt — und die beiden anderen darauf ausgerichtet oder
  zusammengeführt. Das ist die größte ungenutzte Struktur­reserve im Cluster
  und lässt sich vorher nicht angehen, weil zwei der drei Seiten eingefroren
  sind.

## `/kosten-ki-telefonassistent`

- Claim-Scan sauber.
- `src/components/Navigation.tsx:362` setzt
  `GEMESSEN_NUR_NACH_HYDRATION = '/kosten-ki-telefonassistent'` als expliziten
  Experiment-Schutz. Diese Zeile gehört mit dem Experiment ausgewertet und
  danach entfernt oder begründet beibehalten.
- Der neue Einführungsleitfaden verweist bei Kostenfragen bewusst **nicht**
  hierher, obwohl es der naheliegende Verweis wäre. Nach dem Experiment gehört
  dieser Verweis ergänzt — er ist inhaltlich richtig und fehlt derzeit nur,
  weil er die eingehende Linkstruktur der Messung verändert hätte.

---

## Nicht experimentbezogen, aber hier notiert

Diese Punkte betreffen **nicht** eingefrorene Routen und könnten sofort
angegangen werden. Sie stehen hier, weil sie in derselben Prüfung aufgefallen
sind und sonst verloren gingen. Sie waren nicht Teil dieses PRs, weil sie
nichts mit Rankings zu tun haben.

| Fundstelle | Text | Regel |
|---|---|---|
| `src/pages/costs/KostenAutomatisierung.tsx:71` | „Vollautomatisches Kunden-Onboarding" | wörtlich verbotenes Wort, COPY-BRIEF §5.9 |
| `src/pages/costs/KostenAutomatisierung.tsx:29` | „… vollständig automatisiert." | dieselbe Klasse |
| `src/pages/WebdesignArztBayreuth.tsx:199` | „… laufen bei Cogniiq vollständig automatisiert ab." | dieselbe Klasse, zusätzlich absolute Zusage auf einer Gesundheitsseite |
| `src/pages/problems/ZuVielManuelleArbeitPage.tsx:13,51` | „vollständig automatisiert" | dieselbe Klasse |
| `src/lib/standorte-service-configs.ts:227` | „Wir verbinden nahezu jede Software mit einer API" | Muster „funktioniert mit allen" |
| `src/lib/standorte-service-configs.ts:93` | „… wird jeder angenommen – ohne Warteschleife." | absolute Zusage; gehört an `FAKTEN.gleichzeitigeAnrufe` gebunden |
| `src/lib/standorte-service-configs.ts:186` | „marktführenden Automatisierungsplattformen" | unbelegter Superlativ über Dritte |

Höchste Priorität davon bleibt unverändert **Z0** aus
`COPY-CLAIMS-TO-VERIFY.md`: der Vorgabewert des Praxis-Rechners. Er steht
weiterhin vor jedem Besucher der Preisseite und hängt an einer Messung, die
noch aussteht.
