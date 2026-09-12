// ─────────────────────────────────────────────────────────────────────────────
// ZEITUMRECHNUNG — die Konstanten, mit denen auf dieser Website aus einer
// Wochenangabe eine Monatsangabe wird.
//
// WARUM SIE NICHT MEHR IM TELEFON-RECHNER WOHNEN. `WOCHEN_PRO_MONAT` stand bis
// zum 12.09.2026 in `telefonassistent-rechner.ts`, weil es damals nur einen
// Rechner gab. Mit dem Wirtschaftlichkeitsrechner auf /kosten-automatisierung
// gibt es zwei — und der zweite hätte, um dieselbe Zahl zu benutzen, das
// gesamte Preismodell des Telefonassistenten (Tarife, Minutenpreise,
// Sprachaufschläge) in sein Bündel gezogen. Zwei Produkte, deren Preislogik
// aneinanderhängt, weil sie sich eine Zeitkonstante teilen: genau die Sorte
// Kopplung, die später niemand mehr auflöst.
//
// Die Alternative — die Zahl im zweiten Rechner erneut zu tippen — ist die
// Fehlerklasse, gegen die `rechner-konsistenz.test.tsx` überhaupt geschrieben
// wurde: 4,3 auf der einen Fläche, 4,33 auf der anderen, gleiche Eingabe, zwei
// Ergebnisse, und der Besucher findet den Widerspruch in unter einer Minute.
//
// Deshalb dieses Modul: eine Datei ohne jede Abhängigkeit, die beide Rechner
// lesen. `telefonassistent-rechner.ts` exportiert `WOCHEN_PRO_MONAT` weiterhin
// unverändert weiter, damit kein Aufrufer und kein Test dort etwas merkt.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Wochen je Monat. EINE Zahl für das ganze Projekt.
 *
 * Vorher standen 4,3 (Startseite) und 4,33 (Praxis-Rechner) nebeneinander.
 * 4,33 ist der genauere Wert (365 ÷ 7 ÷ 12 = 4,345); er gilt überall.
 */
export const WOCHEN_PRO_MONAT = 4.33;

/** Monate je Jahr. Benannt, damit die Jahresformeln lesbar bleiben. */
export const MONATE_PRO_JAHR = 12;
