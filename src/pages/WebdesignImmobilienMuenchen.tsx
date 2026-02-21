import { IndustryPage } from "@/components/IndustryPage";
import type { IndustryPageConfig } from "@/components/IndustryPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const base = BUSINESS_INFO.website;

const config: IndustryPageConfig = {
  route: "/webdesign-immobilien-muenchen",
  industry: "Immobilien & Makler",
  industrySlug: "immobilien-makler",
  seo: {
    title: "Webdesign & KI-Telefonassistent für Immobilienmakler in München | Cogniiq",
    description:
      "Makler Website München: Cogniiq entwickelt Immobilien-Websites, KI-Telefonassistenten und Automatisierungen für Makler in München. Mehr Immobilien-Leads, automatisierte Besichtigungen, DSGVO-konform.",
    canonical: `${base}/webdesign-immobilien-muenchen`,
    keywords:
      "Makler Website München, Immobilien Website München, Immobilien Leads München, KI Telefonassistent Makler München",
  },
  hero: {
    trustTags: ["München", "DSGVO-konform", "KI-Integration", "Immobilien-Leads", "Automatisierung"],
    ctaLabel: "Projekt für Immobilienmakler starten",
  },
  intro: {
    h1: "Webdesign & KI-Telefonassistent für Immobilienmakler in München",
    lead: "Cogniiq entwickelt Websites, KI-Telefonassistenten und Automatisierungssysteme für Immobilienmakler in München – für mehr qualifizierte Leads, automatisierte Besichtigungstermine und professionelle Objektpräsentation in einem der teuersten Immobilienmärkte Deutschlands.",
  },
  problems: [
    "Der Münchner Immobilienmarkt bewegt sich auf höchstem Preisniveau – Interessenten erwarten ein ebenso professionelles digitales Auftreten",
    "Telefonanfragen zu Objekten in München sind zahlreich und binden den Makler, der gleichzeitig Besichtigungen koordiniert",
    "Potenzielle Käufer und Mieter kontaktieren bevorzugt abends und am Wochenende – außerhalb der Geschäftszeiten",
    "Veraltete oder unübersichtliche Makler-Website lässt hochwertige Leads an besser aufgestellte Wettbewerber",
    "Exposé-Anfragen werden manuell bearbeitet – in München bedeutet langsame Reaktionszeit verlorene Kaufinteressenten",
    "Besichtigungstermine werden telefonisch koordiniert – fehleranfällig und unverhältnismäßig zeitintensiv",
    "Fehlende Sichtbarkeit bei Suchanfragen wie 'Makler München' oder 'Immobilien kaufen München'",
  ],
  services: [
    {
      icon: "web",
      title: "Immobilien-Website München",
      description:
        "Hochwertige Makler-Website mit Objektübersicht, Exposé-Download, Kontaktformularen und gezieltem Local-SEO für Suchanfragen wie 'Immobilienmakler München' oder 'Wohnung kaufen München'. Das Design spiegelt das Premium-Niveau des Münchner Immobilienmarkts wider.",
    },
    {
      icon: "phone",
      title: "KI-Telefonassistent für Münchner Makler",
      description:
        "Der KI-Telefonassistent qualifiziert eingehende Objektanfragen automatisch vor, beantwortet Fragen zu Lage, Größe und Preis, vereinbart Besichtigungstermine direkt und leitet qualifizierte Interessenten strukturiert an den Makler weiter – rund um die Uhr, auch an Wochenenden.",
    },
    {
      icon: "zap",
      title: "Immobilien-Automatisierung München",
      description:
        "Exposé-Versand nach Anfrage, Besichtigungsbestätigungen, automatisches Follow-up bei Interessenten und Lead-Qualifizierung laufen vollautomatisch ab. Kein manuelles Nachfassen, keine verlorenen Kontakte – gerade im schnelllebigen Münchner Markt ein entscheidender Vorteil.",
    },
  ],
  useCases: [
    {
      title: "Besichtigungstermine automatisch vereinbaren",
      description:
        "Interessenten wählen Besichtigungstermine direkt über die Website oder per KI-Telefonassistent. Der Termin wird automatisch eingetragen und eine Bestätigung versendet – ohne manuellen Koordinationsaufwand.",
    },
    {
      title: "Objektanfragen rund um die Uhr beantworten",
      description:
        "Der KI-Telefonassistent beantwortet Fragen zu Objekten, Lage, Miet- und Kaufpreisen sowie Verfügbarkeit – auch abends und am Wochenende, wenn der Markt in München besonders aktiv ist.",
    },
    {
      title: "Exposé-Anfragen automatisch bearbeiten",
      description:
        "Nach einer Anfrage über die Website wird das Exposé automatisch versendet, der Interessent im CRM erfasst und ein Follow-up-Prozess gestartet – in München zählt jede Minute Reaktionsvorteil.",
    },
    {
      title: "Qualifizierte Leads aus Münchner Suchanfragen",
      description:
        "Die Immobilien-Website wird für Suchanfragen wie 'Immobilien kaufen München', 'Wohnung mieten München' oder 'Makler München' optimiert – messbarer Anstieg organischer Anfragen.",
    },
    {
      title: "Telefonleads außerhalb der Geschäftszeiten erfassen",
      description:
        "Anrufe außerhalb der Bürozeiten landen beim KI-Telefonassistenten. Interessenten hinterlassen ihre Kontaktdaten und Objektwünsche – der Makler erhält am nächsten Morgen eine strukturierte Zusammenfassung.",
    },
    {
      title: "Automatisches Follow-up für Interessenten",
      description:
        "Nach einer Besichtigung oder einem Erstkontakt erhalten Interessenten automatisiert weiterführende Informationen und vergleichbare Objekte – ohne manuelles Eingreifen, mit messbarem Einfluss auf die Abschlussrate.",
    },
  ],
  benefits: [
    "Keine verpassten Telefonanfragen – der KI-Assistent qualifiziert und erfasst Leads rund um die Uhr",
    "Automatisierte Besichtigungsprozesse sparen dem Makler in München mehrere Stunden pro Woche",
    "Mehr hochwertige Immobilien-Leads durch eine suchmaschinenoptimierte Makler-Website für München",
    "Professioneller Marktauftritt auf dem Niveau des Münchner Immobilienmarkts",
    "Zeitersparnis durch automatisierten Exposé-Versand, Bestätigungen und Interessenten-Follow-up",
    "Schnellere Reaktionszeiten – in München entscheidet oft die erste Antwort über den Lead",
    "Vollständige DSGVO-Konformität – alle Interessentendaten werden sicher auf europäischen Servern verarbeitet",
  ],
  localContext: [
    "München ist mit Abstand der teuerste Immobilienmarkt Deutschlands. Kaufinteressenten und Mieter sind im Schnitt besser informiert und haben höhere Ansprüche an den gesamten Prozess – von der Website-Recherche bis zur Besichtigungsorganisation. Makler, die digital nicht professionell aufgestellt sind, verlieren Interessenten an Wettbewerber mit besserer Online-Präsenz.",
    "Cogniiq entwickelt für Immobilienmakler in München passgenaue Digitallösungen: eine hochwertige Makler-Website mit SEO-Fokus auf lokale Suchanfragen, einen KI-Telefonassistenten, der Objektanfragen qualifiziert und Besichtigungstermine vereinbart, sowie Automatisierungssysteme, die Exposé-Versand, Interessenten-Nachverfolgung und Lead-Management ohne manuellen Aufwand steuern.",
    "Alle Systeme sind vollständig DSGVO-konform, werden auf europäischen Servern betrieben und sind in der Regel innerhalb von 7–14 Tagen einsatzbereit. Die Betreuung erfolgt durch Cogniiq direkt und persönlich.",
  ],
  internalLinks: [
    { label: "Webdesign München", href: "/muenchen/webdesign" },
    { label: "KI-Telefonassistent München", href: "/muenchen/ki-telefonassistent" },
    { label: "Automatisierung München", href: "/muenchen/automatisierung" },
    { label: "Cogniiq München", href: "/muenchen" },
    { label: "Immobilien Bayreuth", href: "/webdesign-immobilien-bayreuth" },
    { label: "Immobilien Regensburg", href: "/webdesign-immobilien-regensburg" },
    { label: "Alle Leistungen", href: "/leistungen" },
    { label: "Bayern", href: "/bayern" },
    { label: "Deutschland", href: "/deutschland" },
  ],
  faq: [
    {
      question: "Kann Cogniiq eine Immobilien-Website mit Objektverwaltung in München erstellen?",
      answer:
        "Ja. Wir entwickeln Makler-Websites mit strukturierter Objektübersicht, Filterfunktionen und einfacher Verwaltung von Exposés und Objektfotos – individuell abgestimmt auf Ihr Portfolio und das Niveau des Münchner Markts.",
    },
    {
      question: "Wie hilft der KI-Telefonassistent bei der Lead-Qualifizierung in München?",
      answer:
        "Der KI-Telefonassistent stellt Interessenten gezielte Fragen zur gewünschten Lage, Objektgröße und Budget, erfasst die Daten strukturiert und leitet nur qualifizierte Anfragen an Sie weiter.",
    },
    {
      question: "Kann ich Besichtigungstermine direkt über die Website vereinbaren lassen?",
      answer:
        "Ja. Wir integrieren eine Terminbuchungsfunktion in Ihre Website, die Interessenten Besichtigungstermine direkt buchen lässt – mit automatischer Bestätigung und Kalendereintrag.",
    },
    {
      question: "Werden Interessentendaten DSGVO-konform verarbeitet?",
      answer:
        "Ja. Alle Kontakt- und Interessentendaten werden ausschließlich auf europäischen Servern gespeichert und nach den Anforderungen der DSGVO verarbeitet.",
    },
    {
      question: "Wie lange dauert die Einrichtung für ein Immobilienbüro in München?",
      answer:
        "Die Einrichtung dauert in der Regel 7–14 Tage. Website, KI-Telefonassistent und Automatisierungssysteme werden vollständig von Cogniiq eingerichtet – keine technischen Vorkenntnisse erforderlich.",
    },
  ],
};

export function WebdesignImmobilienMuenchen() {
  return <IndustryPage config={config} />;
}
