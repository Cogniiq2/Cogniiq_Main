// ─────────────────────────────────────────────────────────────────────────────
// Der eine Anker des Preis- und Wirtschaftlichkeitsrechners.
//
// Der Rechner auf /ki-telefonassistent ist die Konversionsfunktion des
// Clusters: Er beantwortet „was kostet das bei MIR" ohne E-Mail, ohne Anmeldung
// und ohne Verkaufsgespräch. Von mehreren Seiten wird darauf verwiesen.
//
// WARUM EINE KONSTANTE UND KEIN GETIPPTER STRING. Ein Sprungziel, das an zehn
// Stellen als Literal steht, ist ein Link, der beim ersten Umbenennen leise
// bricht: Ein `#` ohne Treffer wirft keinen Fehler, er scrollt einfach nicht.
// Diese Datei ist die einzige Quelle; `rechner-konsistenz.test.tsx` prüft, dass
// die ID auf der Zielseite existiert und dass kein Verweis am Anker vorbeigeht.
//
// KEINE DOM-ORDNUNG, KEINE JS-SELEKTOREN. Der Sprung ist ein gewöhnlicher
// Fragment-Link. Er funktioniert im Prerender, ohne JavaScript, seitenintern
// wie seitenübergreifend.
// ─────────────────────────────────────────────────────────────────────────────

/** ID des Rechner-Abschnitts auf /ki-telefonassistent. Ohne führendes `#`. */
export const RECHNER_ANKER = "preis-roi-rechner";

/** Route des Rechners — die Seite, die den Anker trägt. */
export const RECHNER_ROUTE = "/ki-telefonassistent";

/** Vollständiges Sprungziel für Verweise von ANDEREN Seiten. */
export const RECHNER_LINK = `${RECHNER_ROUTE}#${RECHNER_ANKER}`;

/**
 * Untertext für Rechner-Verweise. Bewusst KEIN „keine versteckten Kosten":
 * Gebühren Dritter für eine Schnittstelle stehen erst nach der technischen
 * Prüfung fest. Versprochen wird deshalb das, was belegbar ist — dass keine
 * Position still weggelassen wird.
 */
export const RECHNER_VERSPRECHEN =
  "Sofort · ohne E-Mail · was noch nicht feststeht, wird als offen ausgewiesen";
