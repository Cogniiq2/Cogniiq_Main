// ─────────────────────────────────────────────────────────────────────────────
// Informationsarchitektur der öffentlichen Navigation — eine Quelle für Desktop
// und Mobil.
//
// WARUM DIESE DATEI EXISTIERT
//
// Desktop- und Mobilnavigation trugen dieselben Listen zweimal, in zwei Dateien,
// und sind erwartungsgemäß auseinandergelaufen. Das ist die Fehlerklasse aus
// HONESTY-AUDIT §7 in ihrer Navigationsvariante. Beide Oberflächen lesen ab hier
// von hier.
//
// DAS ORDNUNGSPRINZIP: SCHRITTWEISE OFFENLEGUNG
//
// Ebene 1 beantwortet „Was macht ihr?" — drei Antworten, mehr nicht.
// Ebene 2 beantwortet „Für wen?" — und erscheint erst, wenn der Besucher eine
// Leistung gewählt hat.
//
// Vorher standen 37 Verweise gleichzeitig im Leistungs-Panel, alle im selben
// visuellen Gewicht, gemischt aus drei Ordnungsachsen (Leistung, Problem,
// Unternehmen). Wer eine Sache sucht, musste 37 Beschriftungen lesen. Jetzt
// liest er drei.
//
// WAS NICHT MEHR IN DER NAVIGATION STEHT
//
// Nichts geht verloren: Der Footer trägt eine vollständige Sitemap mit 77
// Verweisen und steht auf jedem der 92 ausgelieferten Dokumente. Vor dieser
// Umstellung wurde geprüft, dass **jede** Seite, welche die Navigation verlinkt,
// auch im Footer steht. Die interne Verlinkung bleibt damit unverändert; nur die
// Aufmerksamkeit des Besuchers wird nicht mehr geteilt.
// ─────────────────────────────────────────────────────────────────────────────

export interface NavZiel {
  label: string;
  href: string;
}

export interface NavLeistung {
  key: string;
  label: string;
  /** Übersichtsseite der Leistung — die Beschriftung selbst ist ein Verweis. */
  href: string;
  /** Ein Satz, was die Leistung tut. Kein Slogan, keine Adjektivkette. */
  claim: string;
  /** Ebene 2: für wen. Erscheint erst nach der Wahl einer Leistung. */
  nischen: NavZiel[];
  /** Abschluss der Detailspalte — Demo und Preise, visuell abgesetzt. */
  abschluss: NavZiel[];
}

/**
 * Reihenfolge ist Absicht: Der Telefonassistent steht vorn, weil er die
 * ausgearbeitete Beweiskette und den Gesundheits-Schwerpunkt trägt.
 */
export const LEISTUNGEN: NavLeistung[] = [
  {
    key: "telefonassistent",
    label: "KI-Telefonassistent",
    href: "/ki-telefonassistent",
    claim: "Nimmt die Anrufe an, die sonst ins Leere laufen.",
    nischen: [
      // Führt bewusst auf /praxen statt auf die Segmentseiten: Das ist der Hub
      // mit der vollständigen Beweiskette, die Segmentseiten hängen darunter.
      // /praxen war bis hierher weder in der Navigation noch im Footer verlinkt.
      { label: "Für Arzt- und Zahnarztpraxen", href: "/praxen" },
      { label: "Für Restaurants", href: "/ki-telefonassistent-restaurant" },
      { label: "Für Hotels", href: "/ki-telefonassistent-hotel" },
    ],
    abschluss: [
      { label: "Demo anhören", href: "/ki-telefonassistent/demo" },
      { label: "Preise", href: "/kosten-ki-telefonassistent" },
    ],
  },
  {
    key: "webdesign",
    label: "Webdesign",
    href: "/webdesign",
    claim: "Websites, die gefunden werden und Anfragen bringen.",
    nischen: [
      { label: "Für Arztpraxen", href: "/webdesign-arzt" },
      { label: "Für Gastronomie", href: "/webdesign-gastronomie" },
      { label: "Für Immobilien", href: "/webdesign-immobilien" },
      { label: "Für Hotels", href: "/webdesign-hotel" },
      { label: "Für Sport und Fitness", href: "/webdesign-sport" },
    ],
    abschluss: [{ label: "Preise", href: "/kosten-webdesign" }],
  },
  {
    key: "automatisierung",
    label: "Automatisierung",
    href: "/automatisierung-unternehmen",
    claim: "Wiederkehrende Abläufe laufen ohne Handarbeit.",
    nischen: [
      { label: "Für Arztpraxen", href: "/automatisierung-arzt" },
      { label: "Für Restaurants", href: "/automatisierung-restaurant" },
      { label: "Für Immobilien", href: "/automatisierung-immobilien" },
      { label: "Für Sport und Fitness", href: "/automatisierung-sport" },
    ],
    abschluss: [{ label: "Preise", href: "/kosten-automatisierung" }],
  },
];

/**
 * Der zweite Einstiegsweg, für Besucher, die ihr Problem kennen, aber nicht den
 * Namen der Lösung. Eine einzelne, ruhig gesetzte Zeile am Fuß des Panels —
 * nicht fünf weitere Verweise neben den drei Leistungen. Die fünf
 * Problemseiten bleiben über den Footer erreichbar.
 */
export const LEISTUNGEN_AUSWEG: NavZiel = {
  label: "Sie wissen noch nicht, was Sie brauchen?",
  href: "/leistungen",
};

/**
 * Standorte als schlichte Liste statt als zweites Mega-Panel. Es sind fünf
 * Ziele — dafür ist eine volle Bühne die falsche Form. Die Leistungen je Stadt
 * stehen auf der jeweiligen Stadtseite, wo sie hingehören.
 */
export const STANDORTE: { staedte: NavZiel[]; regionen: NavZiel[] } = {
  staedte: [
    { label: "Bayreuth", href: "/bayreuth" },
    { label: "München", href: "/muenchen" },
    { label: "Regensburg", href: "/regensburg" },
  ],
  regionen: [
    { label: "Bayern", href: "/bayern" },
    { label: "Deutschland", href: "/deutschland" },
  ],
};

/** Kennzeichnung des Hauptsitzes — belegt (Impressum, Firmenanschrift). */
export const HAUPTSITZ_SLUG = "/bayreuth";

/**
 * Pfad-Präfixe, an denen die Navigation den aktiven Bereich erkennt. An einer
 * Stelle gepflegt, damit Desktop und Mobil dieselbe Seite hervorheben.
 */
export const AKTIV_PRAEFIXE = {
  leistungen: [
    "/ki-telefonassistent",
    "/webdesign",
    "/automatisierung",
    "/kosten-",
    "/leistungen",
    "/praxen",
    "/integrationen",
    "/datenschutz-sicherheit",
  ],
  standorte: ["/bayreuth", "/muenchen", "/regensburg", "/bayern", "/deutschland"],
};

export function istAktiv(pfad: string, bereich: keyof typeof AKTIV_PRAEFIXE): boolean {
  return AKTIV_PRAEFIXE[bereich].some((p) => pfad === p || pfad.startsWith(p));
}
