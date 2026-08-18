import { IndustryPage } from "@/components/IndustryPage";
import type { IndustryPageConfig } from "@/components/IndustryPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const base = BUSINESS_INFO.website;

const config: IndustryPageConfig = {
  route: "/webdesign-arzt-muenchen",
  industry: "Arzt & Praxis",
  industrySlug: "arzt-praxis",
  city: "München",
  citySlug: "muenchen",
  cityHub: "/muenchen",
  seo: {
    title: "Webdesign & KI-Telefonassistent für Arztpraxen in München | Cogniiq",
    description:
      "Praxis Website München: Cogniiq entwickelt Websites, KI-Telefonassistenten und Automatisierungen für Arztpraxen in München. Weniger Telefonüberlastung, mehr Online-Termine, persönlich betreut.",
    canonical: `${base}/webdesign-arzt-muenchen`,
    keywords:
      "Praxis Website München, Arzt Website München, Terminbuchung Praxis München, KI Rezeption Arztpraxis München",
  },
  hero: {
    trustTags: ["München", "KI-Integration", "Terminprozesse", "Automatisierung"],
    ctaLabel: "Projekt für Arztpraxis starten",
  },
  intro: {
    h1: "Webdesign & KI-Telefonassistent für Arztpraxen in München",
    lead: "Cogniiq entwickelt Websites, KI-Telefonassistenten und Automatisierungssysteme für Arztpraxen in München – für mehr Patientenanfragen, bessere Erreichbarkeit und automatisierte Terminprozesse. Schnell eingerichtet, persönlich betreut.",
  },
  problems: [
    "In einer Millionenstadt wie München ist die Konkurrenz unter Praxen hoch – eine veraltete Website kostet täglich neue Patienten",
    "Hohe Anrufvolumen in Münchner Praxen belasten die Rezeption und unterbrechen laufende Behandlungen",
    "Patienten erwarten in München digitale Lösungen: Wer keine Online-Terminbuchung anbietet, verliert sie an die Konkurrenz",
    "Außerhalb der Öffnungszeiten bleiben Patientenanfragen unbeantwortet – in einer Stadt, die rund um die Uhr aktiv ist",
    "Manuelle Erinnerungs- und Bestätigungsprozesse binden Personalkapazitäten, die in München besonders knapp sind",
    "Fehlende Sichtbarkeit bei Suchanfragen wie 'Arzt München' oder 'Praxis München' lässt qualifizierten Traffic ungenutzt",
    "Keine strukturierten digitalen Kommunikationskanäle für das hohe Patientenaufkommen einer Großstadt",
  ],
  services: [
    {
      icon: "web",
      title: "Praxis-Website München",
      description:
        "Hochperformante Praxis-Website mit Online-Terminbuchung, klarer Leistungsübersicht, Arztprofilen und gezieltem SEO für Suchanfragen wie 'Arzt München' oder 'Praxis München'. Conversion-optimiert und mobilfreundlich – damit Ihre Praxis in der Münchner Suchergebnisseite sichtbar bleibt.",
    },
    {
      icon: "phone",
      title: "KI-Telefonassistent für Münchner Praxen",
      description:
        "Der KI-Telefonassistent nimmt Patientenanrufe automatisch an, beantwortet Fragen zu Öffnungszeiten, Fachrichtungen und Formalitäten, bucht Termine direkt ins System ein und leitet komplexe Anliegen strukturiert an Ihr Team weiter – auch außerhalb der Sprechzeiten, ohne Warteschleife, auch bei hohem Anrufaufkommen.",
    },
    {
      icon: "zap",
      title: "Praxis-Automatisierung München",
      description:
        "Terminbestätigungen, Erinnerungs-SMS, Recall-Kampagnen und Patientenkommunikation laufen automatisiert ab. Besonders in großstädtischen Praxen mit hohem Durchsatz reduziert das den administrativen Aufwand, und Erinnerungen wirken No-Shows entgegen.",
    },
  ],
  useCases: [
    {
      title: "Online-Terminbuchung außerhalb der Sprechzeiten",
      description:
        "Münchner Patienten buchen Termine direkt über die Praxis-Website oder per KI-Telefonassistent – abends, am Wochenende und an Feiertagen. In einer Stadt mit hohem Lebenstempo ist Erreichbarkeit außerhalb der Sprechzeiten kein Bonus, sondern Erwartung.",
    },
    {
      title: "Automatische Terminerinnerungen",
      description:
        "Patienten erhalten kurz vor dem Termin automatisch eine Erinnerung per SMS oder E-Mail. Erinnerungen wirken No-Shows entgegen – gerade in gut ausgelasteten Münchner Praxen ein spürbarer Effizienzgewinn.",
    },
    {
      title: "Rezeption entlasten bei Stoßzeiten",
      description:
        "Montags früh und während der Mittagspause ist die Rezeption in Münchner Praxen chronisch überlastet. Der KI-Telefonassistent nimmt parallel Anrufe entgegen, ohne Warteschleife – Anfragen werden strukturiert erfasst.",
    },
    {
      title: "Patientenanfragen über die Website qualifizieren",
      description:
        "Ein strukturiertes Kontaktformular auf der Praxis-Website qualifiziert eingehende Anfragen automatisch vor, leitet sie ans richtige Team weiter und bestätigt dem Patienten sofort den Eingang.",
    },
    {
      title: "Telefonische KI-Rezeption außerhalb der Öffnungszeiten",
      description:
        "Anrufe außerhalb der Öffnungszeiten landen nicht auf dem Anrufbeantworter, sondern werden vom KI-Assistenten sinnvoll beantwortet: Terminwünsche werden notiert, Notfälle korrekt weitergeleitet.",
    },
    {
      title: "Suchmaschinenoptimierung für lokale Suchanfragen",
      description:
        "Die Praxis-Website wird technisch und inhaltlich so optimiert, dass sie bei Suchanfragen wie 'Arzt München', 'Hausarzt München' oder '[Fachrichtung] München' sichtbar erscheint – und so neue Patienten erreicht.",
    },
  ],
  benefits: [
    "Erreichbar auch dann, wenn niemand abnehmen kann – der KI-Assistent nimmt auch bei vollem Betrieb Anrufe entgegen",
    "Automatisierte Terminprozesse entlasten das Praxisteam in einer Großstadt mit hohem Anfragevolumen",
    "Mehr qualifizierte Patientenanfragen durch eine suchmaschinenoptimierte Praxis-Website für München",
    "Erreichbarkeit außerhalb der Sprechzeiten – in München eine Grundvoraussetzung für Patientenzufriedenheit",
    "Zeitersparnis durch automatisierte Erinnerungen, Bestätigungen und Kommunikationsabläufe",
    "Professioneller erster Eindruck durch moderne Website – besonders wichtig im Münchner Wettbewerb",
  ],
  localContext: [
    "München ist einer der dichtesten Gesundheitsmärkte Deutschlands. Arztpraxen konkurrieren in der Millionenstadt nicht nur um Kassenpatienten, sondern auch um Privatpatienten und Selbstzahler. Gleichzeitig sind die Erwartungen an Digitalität und Service in München überdurchschnittlich hoch – Patienten erwarten Online-Terminbuchung, schnelle Reaktionszeiten und eine moderne Praxis-Website als Selbstverständlichkeit.",
    "Cogniiq entwickelt für Arztpraxen in München maßgeschneiderte Digitallösungen: eine hochperformante Praxis-Website mit integrierter Terminbuchung, einen KI-Telefonassistenten, der die Rezeption auch außerhalb der Sprechzeiten entlastet, sowie Automatisierungssysteme, die Terminerinnerungen, Patientenkommunikation und interne Abläufe ohne manuellen Aufwand steuern.",
    "Alle Systeme werden datenschutzorientiert umgesetzt und sind in der Regel innerhalb von 7–14 Tagen einsatzbereit. Die Betreuung erfolgt durch Cogniiq persönlich – transparent, direkt und ohne unnötige Zwischenstellen.",
  ],
  internalLinks: [
    { label: "Webdesign München", href: "/muenchen/webdesign" },
    { label: "KI-Telefonassistent München", href: "/muenchen/ki-telefonassistent" },
    { label: "Automatisierung München", href: "/muenchen/automatisierung" },
    { label: "Cogniiq München", href: "/muenchen" },
    { label: "Arzt Bayreuth", href: "/webdesign-arzt-bayreuth" },
    { label: "Arzt Regensburg", href: "/webdesign-arzt-regensburg" },
    { label: "Alle Leistungen", href: "/leistungen" },
    { label: "Bayern", href: "/bayern" },
    { label: "Deutschland", href: "/deutschland" },
  ],
  faq: [
    {
      question: "Was liefert Cogniiq zum Datenschutz einer Praxis-Website in München?",
      answer:
        "Zum Lieferumfang gehören Datenschutzerklärung, Impressum, Cookie-Einwilligung, gesicherte Formularübertragung und die Dokumentation der Datenflüsse. Ob der konkrete Einsatz den Anforderungen genügt, beurteilt Ihr Datenschutzbeauftragter – wir liefern ihm die Unterlagen dafür zu.",
    },
    {
      question: "Funktioniert der KI-Telefonassistent mit meiner bestehenden Praxissoftware?",
      answer:
        "In den meisten Fällen ja. Der KI-Telefonassistent kann an gängige Praxisverwaltungssysteme und Kalendertools angebunden werden. Wir klären die technische Integration im Erstgespräch individuell.",
    },
    {
      question: "Wie lange dauert die Einrichtung für eine Arztpraxis in München?",
      answer:
        "Die Einrichtung dauert in der Regel 7–14 Tage und wird vollständig von Cogniiq übernommen. Sie müssen keine technischen Vorkenntnisse mitbringen.",
    },
    {
      question: "Kann ich meinen Münchner Patienten Online-Terminbuchung anbieten?",
      answer:
        "Ja. Wir integrieren eine strukturierte Online-Terminbuchung direkt in Ihre Praxis-Website – abgestimmt auf Ihre Öffnungszeiten, Fachbereiche und Verfügbarkeiten.",
    },
    {
      question: "Was passiert mit Anrufen außerhalb meiner Öffnungszeiten?",
      answer:
        "Der KI-Telefonassistent ist auch außerhalb der Sprechzeiten aktiv. Er beantwortet häufige Fragen, notiert Terminwünsche und leitet dringende Anliegen entsprechend weiter – ohne Warteschleife, ohne Anrufbeantworter.",
    },
  ],
};

export function WebdesignArztMuenchen() {
  return <IndustryPage config={config} />;
}
