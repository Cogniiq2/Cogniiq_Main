import { IndustryPage } from "@/components/IndustryPage";
import type { IndustryPageConfig } from "@/components/IndustryPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const base = BUSINESS_INFO.website;

const config: IndustryPageConfig = {
  route: "/webdesign-arzt-bayreuth",
  industry: "Arzt & Praxis",
  industrySlug: "arzt-praxis",
  city: "Bayreuth",
  citySlug: "bayreuth",
  cityHub: "/bayreuth",
  seo: {
    title: "Webdesign & KI-Telefonassistent für Arztpraxen in Bayreuth | Cogniiq",
    description:
      "Praxis Website Bayreuth: Cogniiq entwickelt Websites, KI-Telefonassistenten und Automatisierungen für Arztpraxen in Bayreuth. Weniger Telefonüberlastung, mehr Online-Termine, DSGVO-konform.",
    canonical: `${base}/webdesign-arzt-bayreuth`,
    keywords:
      "Praxis Website Bayreuth, Arzt Website Bayreuth, Terminbuchung Praxis Bayreuth, KI Telefonassistent Arztpraxis Bayreuth",
  },
  hero: {
    trustTags: ["Bayreuth", "DSGVO-konform", "KI-Integration", "Terminprozesse", "Automatisierung"],
    ctaLabel: "Projekt für Arztpraxis starten",
  },
  intro: {
    h1: "Webdesign & KI-Telefonassistent für Arztpraxen in Bayreuth",
    lead: "Cogniiq entwickelt Websites, KI-Telefonassistenten und Automatisierungssysteme für Arztpraxen in Bayreuth – für mehr Patientenanfragen, bessere Erreichbarkeit und automatisierte Terminprozesse. DSGVO-konform, lokal betreut.",
  },
  engpaesse: [
    "Telefonanrufe für Terminbuchungen überlasten die Rezeption – besonders morgens und nach der Mittagspause",
    "Patientenanfragen außerhalb der Öffnungszeiten bleiben unbeantwortet, Termine gehen verloren",
    "Veraltete oder fehlende Praxis-Website kostet täglich Sichtbarkeit bei lokalen Suchanfragen in Bayreuth",
    "Manuelle Terminerinnerungen und Bestätigungen binden Personalzeit, die im Patientenkontakt fehlt",
    "Keine Online-Terminbuchung zwingt Patienten dazu, Alternativen mit besserer digitaler Erreichbarkeit zu wählen",
  ],
  solutionSteps: [
    {
      step: "Schritt 1",
      title: "Analyse & Konzept",
      description:
        "Wir analysieren Telefonaufkommen, Patientenfluss und bestehende Abläufe der Praxis und entwickeln ein maßgeschneidertes Konzept für Website, KI-Assistent und Automatisierung.",
    },
    {
      step: "Schritt 2",
      title: "Umsetzung in 7–14 Tagen",
      description:
        "Website, KI-Telefonassistent und Automatisierungsworkflows werden vollständig von Cogniiq aufgebaut. Keine IT-Arbeit auf Praxisseite – wir liefern alles schlüsselfertig.",
    },
    {
      step: "Schritt 3",
      title: "Go-live & laufende Betreuung",
      description:
        "Nach Abnahme geht alles live. Cogniiq bleibt als direkter Ansprechpartner für Anpassungen und Optimierungen – persönlich erreichbar als Bayreuther Unternehmen.",
    },
  ],
  workflow: {
    title: "Beispiel-Workflow: Allgemeinpraxis Bayreuth",
    trigger:
      "Eine Allgemeinpraxis in Bayreuth mit mehreren Mitarbeitern hatte täglich ein hohes Telefonaufkommen. Die Rezeption war in Stoßzeiten dauerhaft überlastet, außerhalb der Öffnungszeiten wurden alle Anfragen auf den Anrufbeantworter geleitet – was zu Rückstau und Patientenfrustration führte.",
    process:
      "Cogniiq baute eine neue Praxis-Website mit integrierter Online-Terminbuchung und implementierte einen KI-Telefonassistenten für Standardanfragen: Öffnungszeiten, Terminbuchung und häufige Fragen. Dringende Anliegen werden strukturiert an die Rezeption weitergeleitet.",
    result:
      "Die Rezeption bearbeitet nur noch Anfragen, die echte Beratung erfordern. Routineanfragen laufen vollständig automatisiert. Patienten erhalten außerhalb der Öffnungszeiten eine sofortige Rückmeldung statt Anrufbeantworter.",
  },
  pakete: [
    {
      name: "Start",
      tagline: "Professionelle Praxis-Website mit Grundfunktionen",
      deliverables: [
        "Responsive Praxis-Website (bis 5 Seiten)",
        "Kontaktformular mit automatischer Benachrichtigung",
        "Google Maps Integration & NAP-Konsistenz",
        "On-Page SEO für lokale Suchanfragen Bayreuth",
        "DSGVO-konforme Datenschutzdokumentation",
      ],
    },
    {
      name: "Growth",
      tagline: "Website + KI-Telefonassistent für mehr Erreichbarkeit",
      deliverables: [
        "Alles aus Start",
        "KI-Telefonassistent (24/7 Anrufannahme)",
        "Automatische Terminverwaltung & Kalenderintegration",
        "Erinnerungs-SMS / E-Mail für Patienten",
        "Monatliches Reporting & Optimierungsgespräch",
      ],
    },
    {
      name: "Premium",
      tagline: "Vollständige Digitalisierung der Praxisabläufe",
      deliverables: [
        "Alles aus Growth",
        "Automatisierte Recall-Kampagnen & Nachsorge",
        "Integration in bestehende Praxissoftware",
        "Patientenkommunikation via SMS-Workflow",
        "Laufende Betreuung, Updates & Priorisierung",
      ],
    },
  ],
  problems: [
    "Hohe Anzahl täglicher Anrufe belastet die Rezeption und unterbricht laufende Behandlungen",
    "Terminorganisation per Telefon kostet Praxispersonal unverhältnismäßig viel Zeit",
    "Außerhalb der Öffnungszeiten werden Patientenanfragen nicht beantwortet – Termine gehen verloren",
    "Veraltete oder fehlende Praxis-Website sorgt für schlechte Online-Sichtbarkeit in Bayreuth",
    "Keine Möglichkeit zur Online-Terminbuchung – Patienten wechseln zur Konkurrenz",
    "Manuelle Erinnerungs- und Bestätigungsprozesse binden Personalkapazitäten",
    "Fehlende digitale Kommunikationskanäle für Patientenanfragen außerhalb des Telefons",
  ],
  services: [
    {
      icon: "web",
      title: "Praxis-Website Bayreuth",
      description:
        "Moderne, schnelle Praxis-Website mit Online-Terminbuchung, klarer Leistungsübersicht, Arztprofilen und optimalem Ranking für Suchbegriffe wie 'Arzt Bayreuth' oder 'Praxis Bayreuth'. Conversion-optimiert, mobilfreundlich, DSGVO-konform.",
    },
    {
      icon: "phone",
      title: "KI-Telefonassistent für Arztpraxen in Bayreuth",
      description:
        "Der KI-Telefonassistent nimmt Patientenanrufe automatisch an, beantwortet Fragen zu Öffnungszeiten, Fachrichtungen und Formalitäten, bucht Termine direkt ins System ein und leitet komplexe Anliegen strukturiert weiter – 24/7, ohne Warteschleife.",
    },
    {
      icon: "zap",
      title: "Praxis-Automatisierung Bayreuth",
      description:
        "Terminbestätigungen, Erinnerungs-SMS, Recall-Kampagnen und Patientenkommunikation laufen automatisiert ab. Weniger Aufwand für das Team, weniger No-Shows, konsistentere Patientenerfahrung.",
    },
  ],
  useCases: [
    {
      title: "Online-Terminbuchung rund um die Uhr",
      description:
        "Patienten buchen Termine direkt über die Praxis-Website oder per KI-Telefonassistent – auch abends, am Wochenende und an Feiertagen. Kein Anruf notwendig, kein Personal gebunden.",
    },
    {
      title: "Automatische Terminerinnerungen",
      description:
        "Kurz vor dem Termin erhalten Patienten automatisch eine Erinnerung per SMS oder E-Mail. No-Show-Rate sinkt messbar, Praxiskalender bleibt gefüllt.",
    },
    {
      title: "Rezeption entlasten bei Stoßzeiten",
      description:
        "Montags früh und über die Mittagspause ist die Rezeption in Bayreuther Praxen regelmäßig überlastet. Der KI-Telefonassistent nimmt parallel Anrufe entgegen – alle Anfragen werden erfasst.",
    },
    {
      title: "Patientenanfragen über die Website",
      description:
        "Ein strukturiertes Kontaktformular auf der Praxis-Website qualifiziert eingehende Anfragen automatisch vor, leitet sie ans richtige Team weiter und bestätigt dem Patienten sofort den Eingang.",
    },
    {
      title: "KI-Rezeption außerhalb der Öffnungszeiten",
      description:
        "Anrufe außerhalb der Öffnungszeiten landen nicht auf dem Anrufbeantworter, sondern werden vom KI-Assistenten sinnvoll beantwortet: Terminwünsche notiert, Notfälle weitergeleitet.",
    },
    {
      title: "Lokale SEO für Arztpraxen in Bayreuth",
      description:
        "Die Praxis-Website wird technisch und inhaltlich so optimiert, dass sie bei Suchanfragen wie 'Arzt Bayreuth', 'Hausarzt Bayreuth' oder '[Fachrichtung] Bayreuth' sichtbar erscheint.",
    },
  ],
  benefits: [
    "Weniger verpasste Anrufe – der KI-Assistent nimmt auch bei vollem Betrieb alle Anrufe entgegen",
    "Automatisierte Terminprozesse entlasten das Praxisteam messbar",
    "Mehr qualifizierte Patientenanfragen durch eine suchmaschinenoptimierte Praxis-Website in Bayreuth",
    "Höhere Erreichbarkeit für Patienten – rund um die Uhr, auch außerhalb der Öffnungszeiten",
    "Zeitersparnis durch automatisierte Erinnerungen, Bestätigungen und Kommunikationsabläufe",
    "Professioneller erster Eindruck durch moderne Website und sofortige Gesprächsannahme",
    "Vollständige DSGVO-Konformität – alle Daten auf europäischen Servern verarbeitet",
  ],
  localContext: [
    "Bayreuth verfügt über eine dichte Praxislandschaft – von Allgemeinmedizin über Fachpraxen bis zu Zahnarztpraxen und Physiotherapieeinrichtungen. Der Wettbewerb um Patienten ist spürbar gestiegen, während gleichzeitig der Fachkräftemangel im medizinischen Bereich den Personalaufwand für administrative Tätigkeiten begrenzt.",
    "Cogniiq entwickelt speziell für Arztpraxen in Bayreuth maßgeschneiderte Digitallösungen: eine hochperformante Praxis-Website mit integrierter Terminbuchung, einen KI-Telefonassistenten, der die Rezeption rund um die Uhr entlastet, sowie Automatisierungssysteme für Terminerinnerungen und Patientenkommunikation.",
    "Als Unternehmen mit Hauptsitz in Bayreuth kennen wir die lokalen Besonderheiten und sind für persönliche Abstimmungen direkt erreichbar. Die Einrichtung aller Lösungen dauert 7–14 Tage. Alle Systeme sind vollständig DSGVO-konform und werden ausschließlich auf europäischen Servern betrieben.",
  ],
  internalLinks: [
    { label: "Webdesign Bayreuth", href: "/bayreuth/webdesign" },
    { label: "KI-Telefonassistent Bayreuth", href: "/bayreuth/ki-telefonassistent" },
    { label: "Automatisierung Bayreuth", href: "/bayreuth/automatisierung" },
    { label: "Cogniiq Bayreuth", href: "/bayreuth" },
    { label: "Arzt München", href: "/webdesign-arzt-muenchen" },
    { label: "Arzt Regensburg", href: "/webdesign-arzt-regensburg" },
    { label: "Bayern", href: "/bayern" },
    { label: "Deutschland", href: "/deutschland" },
  ],
  faq: [
    {
      question: "Kann Cogniiq eine DSGVO-konforme Praxis-Website in Bayreuth erstellen?",
      answer:
        "Ja. Alle Websites und Systeme von Cogniiq sind vollständig DSGVO-konform. Formulare, Datenschutzerklärungen, Cookie-Einwilligungen und die Datenverarbeitung entsprechen den geltenden Datenschutzanforderungen für Arztpraxen in Bayern.",
    },
    {
      question: "Funktioniert der KI-Telefonassistent mit meiner bestehenden Praxissoftware in Bayreuth?",
      answer:
        "In den meisten Fällen ja. Der KI-Telefonassistent kann an gängige Praxisverwaltungssysteme und Kalendertools angebunden werden. Wir klären die technische Integration im kostenlosen Erstgespräch individuell.",
    },
    {
      question: "Wie lange dauert die Einrichtung für eine Arztpraxis in Bayreuth?",
      answer:
        "Die Einrichtung dauert in der Regel 7–14 Tage und wird vollständig von Cogniiq übernommen. Sie müssen keine technischen Vorkenntnisse mitbringen und erhalten alles schlüsselfertig.",
    },
    {
      question: "Kann ich meinen Patienten Online-Terminbuchung anbieten?",
      answer:
        "Ja. Wir integrieren eine strukturierte Online-Terminbuchung direkt in Ihre Praxis-Website – abgestimmt auf Ihre Öffnungszeiten, Fachbereiche und Verfügbarkeiten. Patienten buchen ohne Telefonanruf.",
    },
    {
      question: "Was passiert mit Anrufen außerhalb meiner Öffnungszeiten?",
      answer:
        "Der KI-Telefonassistent ist rund um die Uhr aktiv. Er beantwortet häufige Fragen, notiert Terminwünsche und leitet dringende Anliegen entsprechend weiter – ohne Warteschleife, ohne Anrufbeantworter.",
    },
    {
      question: "Betreut Cogniiq die Systeme auch nach dem Go-live?",
      answer:
        "Ja. Cogniiq bietet laufende Betreuung für Anpassungen, Optimierungen, neue Inhalte und technische Updates. Als Bayreuther Unternehmen sind wir direkt erreichbar – per Video-Call oder persönlich vor Ort.",
    },
    {
      question: "Ist Cogniiq auch für Gemeinschaftspraxen oder MVZ in Bayreuth geeignet?",
      answer:
        "Ja. Wir konzipieren Praxis-Websites und KI-Systeme auch für Gemeinschaftspraxen, Medizinische Versorgungszentren und Praxen mit mehreren Standorten – mit klarer Struktur pro Fachrichtung und DSGVO-konformer Kommunikation.",
    },
  ],
};

export function WebdesignArztBayreuth() {
  return <IndustryPage config={config} />;
}
