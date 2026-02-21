import { IndustryPage } from "@/components/IndustryPage";
import type { IndustryPageConfig } from "@/components/IndustryPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const base = BUSINESS_INFO.website;

const config: IndustryPageConfig = {
  route: "/webdesign-arzt-regensburg",
  industry: "Arzt & Praxis",
  industrySlug: "arzt-praxis",
  seo: {
    title: "Webdesign & KI-Telefonassistent für Arztpraxen in Regensburg | Cogniiq",
    description:
      "Praxis Website Regensburg: Cogniiq entwickelt Websites, KI-Telefonassistenten und Automatisierungen für Arztpraxen in Regensburg. Weniger Telefonüberlastung, mehr Online-Termine, DSGVO-konform.",
    canonical: `${base}/webdesign-arzt-regensburg`,
    keywords:
      "Praxis Website Regensburg, Arzt Website Regensburg, Terminbuchung Praxis Regensburg, KI Rezeption Arztpraxis Regensburg",
  },
  hero: {
    trustTags: ["Regensburg", "DSGVO-konform", "KI-Integration", "Terminprozesse", "Persönliche Betreuung"],
    ctaLabel: "Projekt für Arztpraxis starten",
  },
  intro: {
    h1: "Webdesign & KI-Telefonassistent für Arztpraxen in Regensburg",
    lead: "Cogniiq entwickelt Websites, KI-Telefonassistenten und Automatisierungssysteme für Arztpraxen in Regensburg – für mehr Patientenanfragen, bessere Erreichbarkeit und automatisierte Terminprozesse. Persönliche Betreuung, DSGVO-konform.",
  },
  problems: [
    "Regensburger Praxen erleben wachsenden Wettbewerb – ohne digitale Präsenz gehen neue Patienten verloren",
    "Hohe Anrufvolumen belasten die Rezeption und unterbrechen laufende Behandlungen",
    "Außerhalb der Öffnungszeiten werden Patientenanfragen nicht beantwortet – Termine gehen verloren",
    "Veraltete oder fehlende Praxis-Website sorgt für schlechte Sichtbarkeit in der Regensburger Suche",
    "Keine Online-Terminbuchung – Patienten bevorzugen digitale Buchungsmöglichkeiten",
    "Manuelle Erinnerungs- und Bestätigungsprozesse binden Personalkapazitäten, die in Regensburg zunehmend knapp sind",
    "Fehlende digitale Kommunikationskanäle für Patientenanfragen außerhalb des Telefons",
  ],
  services: [
    {
      icon: "web",
      title: "Praxis-Website Regensburg",
      description:
        "Moderne, schnelle Praxis-Website mit Online-Terminbuchung, klarer Leistungsübersicht, Arztprofilen und gezieltem SEO für Suchanfragen wie 'Arzt Regensburg' oder 'Praxis Regensburg'. Conversion-optimiert, mobilfreundlich, DSGVO-konform – persönlich auf Ihre Praxis abgestimmt.",
    },
    {
      icon: "phone",
      title: "KI-Telefonassistent für Regensburger Praxen",
      description:
        "Der KI-Telefonassistent nimmt Patientenanrufe automatisch an, beantwortet Fragen zu Öffnungszeiten, Fachrichtungen und Formalitäten, bucht Termine direkt ins System ein und leitet komplexe Anliegen strukturiert an Ihr Team weiter – 24/7, ohne Warteschleife.",
    },
    {
      icon: "zap",
      title: "Praxis-Automatisierung Regensburg",
      description:
        "Terminbestätigungen, Erinnerungs-SMS, Recall-Kampagnen und Patientenkommunikation laufen automatisiert ab. Weniger Aufwand für Ihr Team, weniger No-Shows, konsistentere Patientenerfahrung – angepasst an die Bedürfnisse regionaler Regensburger Praxen.",
    },
  ],
  useCases: [
    {
      title: "Online-Terminbuchung rund um die Uhr",
      description:
        "Patienten buchen Termine direkt über die Praxis-Website oder per KI-Telefonassistent – auch abends und an Wochenenden. In Regensburg schätzen Patienten den persönlichen Charakter der Praxis und gleichzeitig die Bequemlichkeit digitaler Buchung.",
    },
    {
      title: "Automatische Terminerinnerungen",
      description:
        "Kurz vor dem Termin erhalten Patienten automatisch eine Erinnerung per SMS oder E-Mail. Die No-Show-Rate sinkt messbar – der Praxiskalender bleibt gefüllt, Ausfälle werden reduziert.",
    },
    {
      title: "Rezeption entlasten bei Stoßzeiten",
      description:
        "Montags früh und über die Mittagspause ist die Rezeption regelmäßig überlastet. Der KI-Telefonassistent nimmt parallel Anrufe entgegen – alle Anfragen werden erfasst, Ihr Team bleibt entlastet.",
    },
    {
      title: "Patientenanfragen über die Website qualifizieren",
      description:
        "Ein strukturiertes Kontaktformular auf der Praxis-Website qualifiziert eingehende Anfragen automatisch vor, leitet sie ans richtige Team weiter und bestätigt dem Patienten sofort den Eingang.",
    },
    {
      title: "Telefonische KI-Rezeption außerhalb der Öffnungszeiten",
      description:
        "Anrufe außerhalb der Öffnungszeiten werden vom KI-Assistenten sinnvoll beantwortet: Terminwünsche werden notiert, dringende Anliegen werden korrekt weitergeleitet.",
    },
    {
      title: "Suchmaschinenoptimierung für lokale Suchanfragen",
      description:
        "Die Praxis-Website wird so optimiert, dass sie bei Suchanfragen wie 'Arzt Regensburg', 'Hausarzt Regensburg' oder '[Fachrichtung] Regensburg' sichtbar erscheint – für messbaren Zuwachs bei neuen Patienten.",
    },
  ],
  benefits: [
    "Keine verpassten Anrufe – der KI-Assistent nimmt auch bei vollem Betrieb alle Anrufe entgegen",
    "Automatisierte Terminprozesse entlasten das Praxisteam spürbar",
    "Mehr qualifizierte Patientenanfragen durch eine suchmaschinenoptimierte Praxis-Website für Regensburg",
    "24/7-Erreichbarkeit für Patienten – auch außerhalb der Öffnungszeiten",
    "Zeitersparnis durch automatisierte Erinnerungen, Bestätigungen und Kommunikationsabläufe",
    "Persönliche Betreuung durch Cogniiq – maßgeschneidert auf regionale Regensburger Praxen",
    "Vollständige DSGVO-Konformität – alle Daten werden ausschließlich auf europäischen Servern verarbeitet",
  ],
  localContext: [
    "Regensburg ist eine wachsende Universitätsstadt mit einer lebhaften regionalen Praxislandschaft – von Allgemeinmedizin über Fachpraxen bis zu Zahnarztpraxen. Der Wettbewerb um Patienten nimmt zu, während gleichzeitig das Bedürfnis nach persönlicher, regional verwurzelter Betreuung in Regensburg besonders ausgeprägt ist.",
    "Cogniiq entwickelt für Arztpraxen in Regensburg maßgeschneiderte Digitallösungen: eine moderne Praxis-Website mit integrierter Terminbuchung, einen KI-Telefonassistenten, der die Rezeption rund um die Uhr entlastet, sowie Automatisierungssysteme, die Terminerinnerungen, Patientenkommunikation und interne Abläufe ohne manuellen Aufwand steuern.",
    "Wir legen Wert auf persönliche Betreuung – abgestimmt auf die regionalen Besonderheiten des Regensburger Gesundheitsmarkts. Die Einrichtung aller Systeme dauert 7–14 Tage. Alle Lösungen sind vollständig DSGVO-konform und werden auf europäischen Servern betrieben.",
  ],
  internalLinks: [
    { label: "Webdesign Regensburg", href: "/regensburg/webdesign" },
    { label: "KI-Telefonassistent Regensburg", href: "/regensburg/ki-telefonassistent" },
    { label: "Automatisierung Regensburg", href: "/regensburg/automatisierung" },
    { label: "Cogniiq Regensburg", href: "/regensburg" },
    { label: "Arzt Bayreuth", href: "/webdesign-arzt-bayreuth" },
    { label: "Arzt München", href: "/webdesign-arzt-muenchen" },
    { label: "Alle Leistungen", href: "/leistungen" },
    { label: "Bayern", href: "/bayern" },
    { label: "Deutschland", href: "/deutschland" },
  ],
  faq: [
    {
      question: "Kann Cogniiq eine DSGVO-konforme Praxis-Website in Regensburg erstellen?",
      answer:
        "Ja. Alle Websites und Systeme von Cogniiq sind vollständig DSGVO-konform. Formulare, Datenschutzerklärungen, Cookie-Einwilligungen und die Datenverarbeitung entsprechen den geltenden Datenschutzanforderungen für Arztpraxen.",
    },
    {
      question: "Funktioniert der KI-Telefonassistent mit meiner bestehenden Praxissoftware?",
      answer:
        "In den meisten Fällen ja. Der KI-Telefonassistent kann an gängige Praxisverwaltungssysteme und Kalendertools angebunden werden. Wir klären die technische Integration im Erstgespräch individuell.",
    },
    {
      question: "Wie lange dauert die Einrichtung für eine Arztpraxis in Regensburg?",
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
        "Der KI-Telefonassistent ist rund um die Uhr aktiv. Er beantwortet häufige Fragen, notiert Terminwünsche und leitet dringende Anliegen entsprechend weiter – ohne Warteschleife.",
    },
  ],
};

export function WebdesignArztRegensburg() {
  return <IndustryPage config={config} />;
}
