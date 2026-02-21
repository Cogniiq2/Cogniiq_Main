import { IndustryPage } from "@/components/IndustryPage";
import type { IndustryPageConfig } from "@/components/IndustryPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const base = BUSINESS_INFO.website;

const config: IndustryPageConfig = {
  route: "/webdesign-arzt-bayreuth",
  industry: "Arzt & Praxis",
  industrySlug: "arzt-praxis",
  seo: {
    title: "Webdesign & KI-Telefonassistent für Arztpraxen in Bayreuth | Cogniiq",
    description:
      "Praxis Website Bayreuth: Cogniiq entwickelt Websites, KI-Telefonassistenten und Automatisierungen für Arztpraxen in Bayreuth. Weniger Telefonüberlastung, mehr Online-Termine, DSGVO-konform.",
    canonical: `${base}/webdesign-arzt-bayreuth`,
    keywords:
      "Praxis Website Bayreuth, Arzt Website Bayreuth, Terminbuchung Praxis Bayreuth, KI Rezeption Arztpraxis",
  },
  hero: {
    trustTags: ["Bayreuth", "DSGVO-konform", "KI-Integration", "Terminprozesse", "Automatisierung"],
    ctaLabel: "Projekt für Arztpraxis starten",
  },
  intro: {
    h1: "Webdesign & KI-Telefonassistent für Arztpraxen in Bayreuth",
    lead: "Cogniiq entwickelt Websites, KI-Telefonassistenten und Automatisierungssysteme für Arztpraxen in Bayreuth – für mehr Patientenanfragen, bessere Erreichbarkeit und automatisierte Terminprozesse. DSGVO-konform, lokal betreut.",
  },
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
      title: "KI-Telefonassistent für die Praxis",
      description:
        "Der KI-Telefonassistent nimmt Patientenanrufe automatisch an, beantwortet Fragen zu Öffnungszeiten, Fachrichtungen und Formalitäten, bucht Termine direkt ins System ein und leitet komplexe Anliegen strukturiert an Ihr Team weiter – 24/7, ohne Warteschleife.",
    },
    {
      icon: "zap",
      title: "Praxis-Automatisierung",
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
        "Montags früh und über die Mittagspause ist die Rezeption regelmäßig überlastet. Der KI-Telefonassistent nimmt parallel Anrufe entgegen, ohne Warteschleife – alle Anfragen werden erfasst.",
    },
    {
      title: "Patientenanfragen über die Website",
      description:
        "Ein strukturiertes Kontaktformular auf der Praxis-Website qualifiziert eingehende Anfragen automatisch vor, leitet sie ans richtige Team weiter und bestätigt dem Patienten sofort den Eingang.",
    },
    {
      title: "Telefonische KI-Rezeption außerhalb der Öffnungszeiten",
      description:
        "Anrufe außerhalb der Öffnungszeiten landen nicht auf dem Anrufbeantworter, sondern werden vom KI-Assistenten sinnvoll beantwortet: Terminwünsche werden notiert, Notfälle weitergeleitet.",
    },
    {
      title: "Suchmaschinenoptimierung für lokale Suchanfragen",
      description:
        "Die Praxis-Website wird technisch und inhaltlich so optimiert, dass sie bei Suchanfragen wie 'Arzt Bayreuth', 'Hausarzt Bayreuth' oder '[Fachrichtung] Bayreuth' sichtbar erscheint.",
    },
  ],
  benefits: [
    "Weniger verpasste Anrufe – der KI-Assistent nimmt auch bei vollem Betrieb alle Anrufe entgegen",
    "Automatisierte Terminprozesse entlasten das Praxisteam messbar",
    "Mehr qualifizierte Patientenanfragen durch eine suchmaschinenoptimierte Praxis-Website",
    "Höhere Erreichbarkeit für Patienten – rund um die Uhr, auch außerhalb der Öffnungszeiten",
    "Zeitersparnis durch automatisierte Erinnerungen, Bestätigungen und Kommunikationsabläufe",
    "Professioneller erster Eindruck durch moderne Website und sofortige Gesprächsannahme",
    "Vollständige DSGVO-Konformität – alle Daten werden ausschließlich auf europäischen Servern verarbeitet",
  ],
  localContext: [
    "Bayreuth verfügt über eine dichte Praxislandschaft – von Allgemeinmedizin über Fachpraxen bis zu Zahnarztpraxen und Physiotherapieeinrichtungen. Der Wettbewerb um Patienten ist spürbar gestiegen, während gleichzeitig der Fachkräftemangel im medizinischen Bereich den Personalaufwand für administrative Tätigkeiten begrenzt.",
    "Cogniiq entwickelt speziell für Arztpraxen in Bayreuth maßgeschneiderte Digitallösungen: eine hochperformante Praxis-Website mit integrierter Terminbuchung, einen KI-Telefonassistenten, der die Rezeption rund um die Uhr entlastet, sowie Automatisierungssysteme, die Terminerinnerungen, Patientenkommunikation und interne Abläufe ohne manuellen Aufwand steuern.",
    "Als Unternehmen mit Hauptsitz in Bayreuth kennen wir die lokalen Besonderheiten, verstehen die Anforderungen der regionalen Patientenklientel und sind für persönliche Abstimmungen direkt erreichbar. Die Einrichtung aller Lösungen dauert 7–14 Tage. Alle Systeme sind vollständig DSGVO-konform und werden ausschließlich auf europäischen Servern betrieben.",
  ],
  internalLinks: [
    { label: "Webdesign Bayreuth", href: "/bayreuth/webdesign" },
    { label: "KI-Telefonassistent Bayreuth", href: "/bayreuth/ki-telefonassistent" },
    { label: "Automatisierung Bayreuth", href: "/bayreuth/automatisierung" },
    { label: "Cogniiq Bayreuth", href: "/bayreuth" },
    { label: "Alle Leistungen", href: "/leistungen" },
    { label: "Bayern", href: "/bayern" },
    { label: "Deutschland", href: "/deutschland" },
  ],
  faq: [
    {
      question: "Kann Cogniiq eine DSGVO-konforme Praxis-Website in Bayreuth erstellen?",
      answer:
        "Ja. Alle Websites und Systeme von Cogniiq sind vollständig DSGVO-konform. Formulare, Datenschutzerklärungen, Cookie-Einwilligungen und die Datenverarbeitung entsprechen den geltenden Datenschutzanforderungen für Arztpraxen.",
    },
    {
      question: "Funktioniert der KI-Telefonassistent mit meiner bestehenden Praxissoftware?",
      answer:
        "In den meisten Fällen ja. Der KI-Telefonassistent kann an gängige Praxisverwaltungssysteme und Kalendertools angebunden werden. Wir klären die technische Integration im Erstgespräch individuell.",
    },
    {
      question: "Wie lange dauert die Einrichtung für eine Arztpraxis in Bayreuth?",
      answer:
        "Die Einrichtung dauert in der Regel 7–14 Tage und wird vollständig von Cogniiq übernommen. Sie müssen keine technischen Vorkenntnisse mitbringen.",
    },
    {
      question: "Kann ich meinen Patienten Online-Terminbuchung anbieten?",
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

export function WebdesignArztBayreuth() {
  return <IndustryPage config={config} />;
}
