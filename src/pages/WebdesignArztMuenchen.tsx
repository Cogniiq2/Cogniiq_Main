import { IndustryPage } from "@/components/IndustryPage";
import type { IndustryPageConfig } from "@/components/IndustryPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const base = BUSINESS_INFO.website;

const config: IndustryPageConfig = {
  route: "/webdesign-arzt-muenchen",
  industry: "Arzt & Praxis",
  industrySlug: "arzt-praxis",
  city: "Muenchen",
  citySlug: "muenchen",
  cityHub: "/muenchen",
  seo: {
    title: "Webdesign & KI-Telefonassistent für Arztpraxen in München | Cogniiq",
    description:
      "Praxis Website München: Cogniiq entwickelt Websites, KI-Telefonassistenten und Automatisierungen für Arztpraxen in München. Weniger Telefonüberlastung, mehr Online-Termine, DSGVO-konform.",
    canonical: `${base}/webdesign-arzt-muenchen`,
    keywords:
      "Praxis Website München, Arzt Website München, Terminbuchung Praxis München, KI Rezeption Arztpraxis München",
  },
  hero: {
    trustTags: ["München", "DSGVO-konform", "KI-Integration", "Terminprozesse", "Automatisierung"],
    ctaLabel: "Projekt für Arztpraxis starten",
  },
  intro: {
    h1: "Webdesign & KI-Telefonassistent für Arztpraxen in München",
    lead: "Cogniiq entwickelt Websites, KI-Telefonassistenten und Automatisierungssysteme für Arztpraxen in München – für mehr Patientenanfragen, bessere Erreichbarkeit und automatisierte Terminprozesse. DSGVO-konform, schnell eingerichtet.",
  },
  engpaesse: [
    "Hohe Telefonlast blockiert das Empfangsteam und verlaengert Wartezeiten fuer Patienten",
    "Anfragen ausserhalb der Oeffnungszeiten bleiben zu lange unbeantwortet",
    "Veraltete Praxis-Websites verlieren neue Patienten an digital staerkere Wettbewerber",
    "Manuelle Terminbestaetigungen und Erinnerungen kosten taeglich wertvolle Teamzeit",
    "Fehlende Online-Terminwege erschweren planbare Auslastung und schnelle Rueckmeldung",
    "Unstrukturierte Kontaktanfragen fuehren zu Rueckfragen, Doppelarbeit und Medienbruechen",
  ],
  solutionSteps: [
    {
      step: "Schritt 1",
      title: "Praxisprozesse analysieren",
      description:
        "Cogniiq prueft Telefonaufkommen, Terminwege, Website-Struktur und interne Engpaesse, bevor Website, KI-Telefonassistent und Automatisierungen abgestimmt werden.",
    },
    {
      step: "Schritt 2",
      title: "Systeme einrichten",
      description:
        "Website, Kontaktstrecken, Telefonannahme und Erinnerungsprozesse werden schluesselfertig aufgebaut und mit den vorhandenen Praxisablaeufen abgestimmt.",
    },
    {
      step: "Schritt 3",
      title: "Betrieb begleiten",
      description:
        "Nach dem Go-live bleibt Cogniiq Ansprechpartner fuer Anpassungen, Monitoring, Inhalte und technische Optimierung im laufenden Praxisbetrieb.",
    },
  ],
  workflow: {
    title: "Praxisbeispiel: Muenchner Praxis mit digitaler Rezeption",
    trigger:
      "Eine Praxis erhaelt zu Stosszeiten mehr Anrufe, als das Team parallel bearbeiten kann. Terminwuensche, Rueckfragen und Standardinformationen konkurrieren mit der Betreuung vor Ort.",
    process:
      "Cogniiq strukturiert die Website, richtet klare Kontaktwege ein und konfiguriert den KI-Telefonassistenten fuer haeufige Fragen, Terminwuensche und sichere Weiterleitung.",
    result:
      "Routineanliegen laufen planbarer ein, Patienten erhalten schneller Rueckmeldung und das Praxisteam gewinnt Zeit fuer persoenliche Anliegen.",
  },
  pakete: [
    {
      name: "Start",
      tagline: "Moderne Praxis-Website fuer lokale Sichtbarkeit",
      deliverables: [
        "Responsive Praxis-Website",
        "Kontakt- und Anfrageformular",
        "Lokale SEO-Grundlage",
        "DSGVO-Basisdokumentation",
      ],
    },
    {
      name: "Growth",
      tagline: "Website plus KI-Telefonannahme",
      deliverables: [
        "Alles aus Start",
        "KI-Telefonassistent fuer Routineanfragen",
        "Terminwunsch-Erfassung",
        "Strukturierte Weiterleitung an das Team",
      ],
    },
    {
      name: "Premium",
      tagline: "Betreutes Praxissystem mit Automatisierung",
      deliverables: [
        "Alles aus Growth",
        "Automatische Erinnerungen",
        "Integrationsplanung fuer bestehende Tools",
        "Laufende Betreuung und Optimierung",
      ],
    },
  ],
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
        "Hochperformante Praxis-Website mit Online-Terminbuchung, klarer Leistungsübersicht, Arztprofilen und gezieltem SEO für Suchanfragen wie 'Arzt München' oder 'Praxis München'. Conversion-optimiert, mobilfreundlich, DSGVO-konform – damit Ihre Praxis in der Münchner Suchergebnisseite sichtbar bleibt.",
    },
    {
      icon: "phone",
      title: "KI-Telefonassistent für Münchner Praxen",
      description:
        "Der KI-Telefonassistent nimmt Patientenanrufe automatisch an, beantwortet Fragen zu Öffnungszeiten, Fachrichtungen und Formalitäten, bucht Termine direkt ins System ein und leitet komplexe Anliegen strukturiert an Ihr Team weiter – 24/7, ohne Warteschleife, auch bei hohem Anrufaufkommen.",
    },
    {
      icon: "zap",
      title: "Praxis-Automatisierung München",
      description:
        "Terminbestätigungen, Erinnerungs-SMS, Recall-Kampagnen und Patientenkommunikation laufen automatisiert ab. Besonders in großstädtischen Praxen mit hohem Durchsatz reduziert das den administrativen Aufwand messbar und senkt die No-Show-Rate.",
    },
  ],
  useCases: [
    {
      title: "Online-Terminbuchung rund um die Uhr",
      description:
        "Münchner Patienten buchen Termine direkt über die Praxis-Website oder per KI-Telefonassistent – abends, am Wochenende und an Feiertagen. In einer Stadt mit hohem Lebenstempo ist 24/7-Erreichbarkeit kein Bonus, sondern Erwartung.",
    },
    {
      title: "Automatische Terminerinnerungen",
      description:
        "Patienten erhalten kurz vor dem Termin automatisch eine Erinnerung per SMS oder E-Mail. Die No-Show-Rate sinkt messbar – gerade in gut ausgelasteten Münchner Praxen ein entscheidender Effizienzgewinn.",
    },
    {
      title: "Rezeption entlasten bei Stoßzeiten",
      description:
        "Montags früh und während der Mittagspause ist die Rezeption in Münchner Praxen chronisch überlastet. Der KI-Telefonassistent nimmt parallel Anrufe entgegen, ohne Warteschleife – alle Anfragen werden zuverlässig erfasst.",
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
        "Die Praxis-Website wird technisch und inhaltlich so optimiert, dass sie bei Suchanfragen wie 'Arzt München', 'Hausarzt München' oder '[Fachrichtung] München' sichtbar erscheint – für messbaren Zustrom neuer Patienten.",
    },
  ],
  benefits: [
    "Keine verpassten Anrufe mehr – der KI-Assistent nimmt auch bei vollem Betrieb alle Anrufe entgegen",
    "Automatisierte Terminprozesse entlasten das Praxisteam in einer Großstadt mit hohem Anfragevolumen",
    "Mehr qualifizierte Patientenanfragen durch eine suchmaschinenoptimierte Praxis-Website für München",
    "24/7-Erreichbarkeit – in München eine Grundvoraussetzung für Patientenzufriedenheit",
    "Zeitersparnis durch automatisierte Erinnerungen, Bestätigungen und Kommunikationsabläufe",
    "Professioneller erster Eindruck durch moderne Website – besonders wichtig im Münchner Wettbewerb",
    "Vollständige DSGVO-Konformität – alle Daten werden ausschließlich auf europäischen Servern verarbeitet",
  ],
  localContext: [
    "München ist einer der dichtesten Gesundheitsmärkte Deutschlands. Arztpraxen konkurrieren in der Millionenstadt nicht nur um Kassenpatienten, sondern auch um Privatpatienten und Selbstzahler. Gleichzeitig sind die Erwartungen an Digitalität und Service in München überdurchschnittlich hoch – Patienten erwarten Online-Terminbuchung, schnelle Reaktionszeiten und eine moderne Praxis-Website als Selbstverständlichkeit.",
    "Cogniiq entwickelt für Arztpraxen in München maßgeschneiderte Digitallösungen: eine hochperformante Praxis-Website mit integrierter Terminbuchung, einen KI-Telefonassistenten, der die Rezeption rund um die Uhr entlastet, sowie Automatisierungssysteme, die Terminerinnerungen, Patientenkommunikation und interne Abläufe ohne manuellen Aufwand steuern.",
    "Alle Systeme sind vollständig DSGVO-konform, werden auf europäischen Servern betrieben und sind in der Regel innerhalb von 7–14 Tagen einsatzbereit. Die Betreuung erfolgt durch Cogniiq persönlich – transparent, direkt und ohne unnötige Zwischenstellen.",
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
      question: "Kann Cogniiq eine DSGVO-konforme Praxis-Website in München erstellen?",
      answer:
        "Ja. Alle Websites und Systeme von Cogniiq sind vollständig DSGVO-konform. Formulare, Datenschutzerklärungen, Cookie-Einwilligungen und die Datenverarbeitung entsprechen den geltenden Datenschutzanforderungen für Arztpraxen.",
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
        "Der KI-Telefonassistent ist rund um die Uhr aktiv. Er beantwortet häufige Fragen, notiert Terminwünsche und leitet dringende Anliegen entsprechend weiter – ohne Warteschleife, ohne Anrufbeantworter.",
    },
  ],
};

export function WebdesignArztMuenchen() {
  return <IndustryPage config={config} />;
}
