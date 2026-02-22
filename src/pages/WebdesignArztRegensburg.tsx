import { IndustryPage } from "@/components/IndustryPage";
import type { IndustryPageConfig } from "@/components/IndustryPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const base = BUSINESS_INFO.website;

const config: IndustryPageConfig = {
  route: "/webdesign-arzt-regensburg",
  industry: "Arzt & Praxis",
  industrySlug: "arzt-praxis",
  city: "Regensburg",
  citySlug: "regensburg",
  cityHub: "/regensburg",
  seo: {
    title: "Webdesign & KI-Telefonassistent für Arztpraxen in Regensburg | Cogniiq",
    description:
      "Praxis Website Regensburg: Cogniiq entwickelt Websites, KI-Telefonassistenten und Automatisierungen für Arztpraxen in Regensburg. Weniger Telefonüberlastung, mehr Online-Termine, DSGVO-konform.",
    canonical: `${base}/webdesign-arzt-regensburg`,
    keywords:
      "Praxis Website Regensburg, Arzt Website Regensburg, Terminbuchung Praxis Regensburg, KI Telefonassistent Arztpraxis Regensburg",
  },
  hero: {
    trustTags: ["Regensburg", "DSGVO-konform", "KI-Integration", "Terminprozesse", "Automatisierung"],
    ctaLabel: "Projekt für Arztpraxis starten",
  },
  intro: {
    h1: "Webdesign & KI-Telefonassistent für Arztpraxen in Regensburg",
    lead: "Cogniiq entwickelt Websites, KI-Telefonassistenten und Automatisierungssysteme für Arztpraxen in Regensburg – für mehr Patientenanfragen, bessere Erreichbarkeit und automatisierte Terminprozesse. DSGVO-konform, schnell eingerichtet.",
  },
  engpaesse: [
    "Regensburg wächst – Praxen versorgen zunehmend auch Patienten aus dem Umland, was das Telefonaufkommen weiter erhöht",
    "Studierende und junge Patientengruppen der Uni Regensburg erwarten digitale Terminbuchung als Selbstverständlichkeit",
    "Praxen nahe dem Uniklinikum Regensburg konkurrieren um Patienten mit einem breiten Angebot an Spezialisten",
    "Patientenanfragen außerhalb der Öffnungszeiten bleiben unbeantwortet – obwohl die Nachfrage rund um die Uhr besteht",
    "Ohne strukturierte Online-Präsenz verlieren Praxen in Regensburg Patienten an besser digital aufgestellte Mitbewerber",
  ],
  solutionSteps: [
    {
      step: "Schritt 1",
      title: "Analyse & Konzept",
      description:
        "Wir analysieren Telefonaufkommen, Patientenfluss und bestehende Abläufe der Regensburger Praxis und entwickeln ein maßgeschneidertes Konzept für Website, KI-Assistent und Automatisierung.",
    },
    {
      step: "Schritt 2",
      title: "Umsetzung in 7–14 Tagen",
      description:
        "Website, KI-Telefonassistent und Automatisierungsworkflows werden vollständig von Cogniiq aufgebaut und konfiguriert. Die Praxis erhält alles schlüsselfertig – ohne IT-Aufwand auf Praxisseite.",
    },
    {
      step: "Schritt 3",
      title: "Go-live & laufende Betreuung",
      description:
        "Nach Abnahme geht alles live. Cogniiq betreut alle Systeme remote – für Anpassungen, Optimierungen und Erweiterungen. Persönliche Termine in Regensburg sind möglich.",
    },
  ],
  workflow: {
    title: "Beispiel-Workflow: Arztpraxis Regensburg",
    trigger:
      "Eine Arztpraxis in Regensburg mit Nähe zur Universität hatte ein überdurchschnittlich junges Patientenprofil. Diese Patientengruppe erwartete Online-Terminbuchung und digitale Kommunikation. Die veraltete Website und ausschließliche Telefonbuchung führten zu messbarem Patientenverlust.",
    process:
      "Cogniiq baute eine neue Praxis-Website mit Online-Terminbuchung und implementierte einen KI-Telefonassistenten. Die Website wurde gezielt für Suchbegriffe wie 'Arzt Regensburg' und 'Hausarzt Regensburg' optimiert.",
    result:
      "Die Praxis erhält kontinuierlich neue Patientenanfragen über organische Suchanfragen. Online-Terminbuchung entlastet die Rezeption. Der KI-Assistent deckt alle Anfragen außerhalb der Öffnungszeiten ab.",
  },
  pakete: [
    {
      name: "Start",
      tagline: "Professionelle Praxis-Website für Regensburg",
      deliverables: [
        "Responsive Praxis-Website (bis 5 Seiten)",
        "Kontaktformular mit automatischer Benachrichtigung",
        "Google Maps Integration & NAP-Konsistenz Regensburg",
        "On-Page SEO für lokale Suchanfragen Regensburg",
        "DSGVO-konforme Datenschutzdokumentation",
      ],
    },
    {
      name: "Growth",
      tagline: "Website + KI-Telefonassistent für 24/7-Erreichbarkeit",
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
    "Veraltete oder fehlende Praxis-Website sorgt für schlechte Online-Sichtbarkeit in Regensburg",
    "Keine Möglichkeit zur Online-Terminbuchung – Patienten wechseln zur Konkurrenz",
    "Junges Patientenprofil der Unistadt erwartet digitale Kommunikation als Standard",
    "Fehlende digitale Kommunikationskanäle für Patientenanfragen außerhalb des Telefons",
  ],
  services: [
    {
      icon: "web",
      title: "Praxis-Website Regensburg",
      description:
        "Moderne, schnelle Praxis-Website mit Online-Terminbuchung, klarer Leistungsübersicht, Arztprofilen und optimalem Ranking für Suchbegriffe wie 'Arzt Regensburg' oder 'Praxis Regensburg'. Conversion-optimiert, mobilfreundlich, DSGVO-konform.",
    },
    {
      icon: "phone",
      title: "KI-Telefonassistent für Arztpraxen in Regensburg",
      description:
        "Der KI-Telefonassistent nimmt Patientenanrufe automatisch an, beantwortet Fragen zu Öffnungszeiten, Fachrichtungen und Formalitäten, bucht Termine direkt ins System ein und leitet komplexe Anliegen strukturiert weiter – 24/7, ohne Warteschleife.",
    },
    {
      icon: "zap",
      title: "Praxis-Automatisierung Regensburg",
      description:
        "Terminbestätigungen, Erinnerungs-SMS, Recall-Kampagnen und Patientenkommunikation laufen automatisiert ab. Weniger Aufwand für das Team, weniger No-Shows, konsistentere Patientenerfahrung.",
    },
  ],
  useCases: [
    {
      title: "Online-Terminbuchung für das junge Patientenprofil Regensburgs",
      description:
        "Studierende und junge Berufstätige buchen Termine bevorzugt digital – direkt über die Praxis-Website oder per KI-Assistent, auch abends und am Wochenende. Kein Anruf notwendig.",
    },
    {
      title: "Automatische Terminerinnerungen",
      description:
        "Kurz vor dem Termin erhalten Patienten automatisch eine Erinnerung per SMS oder E-Mail. No-Show-Rate sinkt messbar, Praxiskalender bleibt gefüllt.",
    },
    {
      title: "Rezeption entlasten bei Stoßzeiten",
      description:
        "Montags früh und über die Mittagspause ist die Rezeption in Regensburger Praxen regelmäßig überlastet. Der KI-Telefonassistent nimmt parallel Anrufe entgegen – alle Anfragen werden erfasst.",
    },
    {
      title: "Patientenanfragen aus dem Umland strukturiert erfassen",
      description:
        "Patienten aus dem Landkreis Regensburg, die eine Praxis in der Stadt suchen, landen über lokale Suchanfragen auf der Website und buchen direkt – ohne Telefonat.",
    },
    {
      title: "KI-Rezeption außerhalb der Öffnungszeiten",
      description:
        "Anrufe außerhalb der Öffnungszeiten werden vom KI-Assistenten sinnvoll beantwortet: Terminwünsche notiert, häufige Fragen beantwortet, Notfälle weitergeleitet.",
    },
    {
      title: "Lokale SEO für Arztpraxen in Regensburg",
      description:
        "Die Praxis-Website wird für Suchanfragen wie 'Arzt Regensburg', 'Hausarzt Regensburg' oder '[Fachrichtung] Regensburg' optimiert – mehr Sichtbarkeit, mehr Patientenanfragen.",
    },
  ],
  benefits: [
    "Weniger verpasste Anrufe – der KI-Assistent nimmt auch bei vollem Betrieb alle Anrufe entgegen",
    "Automatisierte Terminprozesse entlasten das Praxisteam in einer wachsenden Mittelstadt",
    "Mehr qualifizierte Patientenanfragen durch eine suchmaschinenoptimierte Praxis-Website in Regensburg",
    "Höhere Erreichbarkeit für Patienten – rund um die Uhr, auch außerhalb der Öffnungszeiten",
    "Zeitersparnis durch automatisierte Erinnerungen, Bestätigungen und Kommunikationsabläufe",
    "Bessere Ansprache des jungen Patientenprofils der Unistadt durch digitale Kanäle",
    "Vollständige DSGVO-Konformität – alle Daten auf europäischen Servern verarbeitet",
  ],
  localContext: [
    "Regensburg ist eine wachsende Mittelstadt mit einem breiten Praxisnetz und einem jungen Patientenprofil, das durch die Universität und das Uniklinikum geprägt wird. Gleichzeitig versorgen viele Praxen auch Patienten aus dem Landkreis – mit entsprechend hohem Anfragevolumen.",
    "Cogniiq entwickelt für Arztpraxen in Regensburg maßgeschneiderte Digitallösungen: eine hochperformante Praxis-Website mit integrierter Terminbuchung, einen KI-Telefonassistenten, der die Rezeption rund um die Uhr entlastet, sowie Automatisierungssysteme für Terminerinnerungen und Patientenkommunikation.",
    "Cogniiq betreut Projekte in Regensburg remote und ist für persönliche Abstimmungen direkt erreichbar. Die Einrichtung aller Lösungen dauert 7–14 Tage. Alle Systeme sind vollständig DSGVO-konform.",
  ],
  internalLinks: [
    { label: "Webdesign Regensburg", href: "/regensburg/webdesign" },
    { label: "KI-Telefonassistent Regensburg", href: "/regensburg/ki-telefonassistent" },
    { label: "Automatisierung Regensburg", href: "/regensburg/automatisierung" },
    { label: "Cogniiq Regensburg", href: "/regensburg" },
    { label: "Arzt Bayreuth", href: "/webdesign-arzt-bayreuth" },
    { label: "Arzt München", href: "/webdesign-arzt-muenchen" },
    { label: "Bayern", href: "/bayern" },
    { label: "Deutschland", href: "/deutschland" },
  ],
  faq: [
    {
      question: "Kann Cogniiq eine DSGVO-konforme Praxis-Website in Regensburg erstellen?",
      answer:
        "Ja. Alle Websites und Systeme von Cogniiq sind vollständig DSGVO-konform. Formulare, Datenschutzerklärungen, Cookie-Einwilligungen und die Datenverarbeitung entsprechen den Datenschutzanforderungen für Arztpraxen in Bayern.",
    },
    {
      question: "Funktioniert der KI-Telefonassistent mit meiner bestehenden Praxissoftware in Regensburg?",
      answer:
        "In den meisten Fällen ja. Der KI-Telefonassistent kann an gängige Praxisverwaltungssysteme und Kalendertools angebunden werden. Wir klären die technische Integration im kostenlosen Erstgespräch individuell.",
    },
    {
      question: "Wie lange dauert die Einrichtung für eine Arztpraxis in Regensburg?",
      answer:
        "Die Einrichtung dauert in der Regel 7–14 Tage und wird vollständig von Cogniiq übernommen. Sie müssen keine technischen Vorkenntnisse mitbringen.",
    },
    {
      question: "Kann ich meinen Patienten in Regensburg Online-Terminbuchung anbieten?",
      answer:
        "Ja. Wir integrieren eine strukturierte Online-Terminbuchung direkt in Ihre Praxis-Website – abgestimmt auf Ihre Öffnungszeiten, Fachbereiche und Verfügbarkeiten.",
    },
    {
      question: "Was passiert mit Anrufen außerhalb meiner Öffnungszeiten?",
      answer:
        "Der KI-Telefonassistent ist rund um die Uhr aktiv. Er beantwortet häufige Fragen, notiert Terminwünsche und leitet dringende Anliegen entsprechend weiter – ohne Warteschleife, ohne Anrufbeantworter.",
    },
    {
      question: "Betreut Cogniiq die Systeme auch nach dem Go-live in Regensburg?",
      answer:
        "Ja. Cogniiq betreut alle Systeme remote – für Anpassungen, Optimierungen, neue Inhalte und technische Updates. Persönliche Termine in Regensburg sind auf Anfrage möglich.",
    },
    {
      question: "Wie wichtig ist lokale SEO für Arztpraxen in Regensburg?",
      answer:
        "Sehr wichtig. Regensburg ist eine Unistadt mit hoher Suchaktivität bei 'Arzt Regensburg' und verwandten Begriffen. Eine gut optimierte Praxis-Website bringt kontinuierlich neue Patientenanfragen über Google.",
    },
  ],
};

export function WebdesignArztRegensburg() {
  return <IndustryPage config={config} />;
}
