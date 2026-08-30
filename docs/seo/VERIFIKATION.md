# Verifikationsstatus dieser Recherche

**Zuerst lesen. Ohne diesen Kontext sind die übrigen Dokumente irreführend.**

## Wie die Recherche entstanden ist

Die Recherche wurde am 2026-08-30 in einer automatisierten Session durchgeführt.
Die Session hatte **keinen ungefilterten Netzzugang**: ausgehende HTTPS-Verbindungen
wurden von der Egress-Policy der Umgebung abgelehnt (`connect_rejected`), und zwar
für *jede* Domain — `developers.google.com` und `eur-lex.europa.eu` eingeschlossen.

Konkret bedeutet das:

- **Keine einzige Seite wurde geöffnet.** Nicht eine Wettbewerberseite, nicht ein
  Herstellerdokument, nicht ein Gesetzestext.
- Verfügbar waren ausschließlich **Trefferlisten einer Suchmaschine samt Snippets**.
- Die Treffer waren zudem **US-lokalisiert**. Sie zeigen, *wer* im Themenfeld
  konkurriert — sie zeigen **nicht** die Rangfolge auf `google.de`.

## Was daraus folgt

| Aussagetyp | Status |
|---|---|
| „Diese Domains konkurrieren im Themenfeld" | belastbar |
| „Dieser Seitentyp dominiert die Ergebnisse" | belastbar |
| „Diese URL existiert" | belastbar (Suchindex) |
| „Position X auf google.de" | **nicht verifiziert** — nie behaupten |
| SERP-Features (Ads, Local Pack, PAA, Snippets) | **nicht verifiziert** |
| Inhalt / Wortlaut / Datum eines fremden Dokuments | **nicht verifiziert** |
| Preisangaben von Wettbewerbern | **nicht verifiziert** |
| Technische Fähigkeiten einer PVS-Schnittstelle | **nicht verifiziert** |
| Suchvolumen, Difficulty, Traffic-Schätzungen | **nicht erhoben** |

## Regel für die Verwertung

> Keine Zahl, kein Rechtsbezug, keine Herstelleraussage und kein Zitat aus diesen
> Dokumenten geht auf eine öffentliche Seite, bevor die Primärquelle **selbst
> geöffnet, gelesen und mit Abrufdatum vermerkt** wurde.

Das ist keine Formalie. Die Kernthese von `pvs-integration-recherche.md` lautet,
dass Wettbewerber die Integrationslage falsch darstellen. Diese These mit
ebenfalls ungeprüften Angaben zu belegen, würde denselben Fehler wiederholen —
nur mit Cogniiq als Absender, in einem medizinnahen Umfeld, in dem Google und
Leser zu Recht besonders streng sind.

## Was dadurch in dieser Session bewusst NICHT passiert ist

Es wurde **keine neue indexierbare Seite veröffentlicht.** Die inhaltlich stärkste
Chance (siehe `pvs-integration-recherche.md`) verlangt belegte Herstelleraussagen.
Solange die Belege nicht geprüft werden können, wäre die Seite entweder vage —
und damit wertlos — oder konkret und unbelegt, und damit ein Risiko. Beides ist
schlechter als sie nicht zu veröffentlichen.

Die Recherche ist damit **Vorarbeit**, nicht Ergebnis. Der teure Teil — das
Wettbewerbsbild, die Lückenanalyse, die Quellenliste — ist erledigt. Offen ist
der Verifikationsschritt, der Netzzugang oder Herstellerkontakt braucht.
