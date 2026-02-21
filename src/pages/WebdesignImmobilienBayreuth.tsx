import { IndustryPage } from "@/components/IndustryPage";
import type { IndustryPageConfig } from "@/components/IndustryPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const base = BUSINESS_INFO.website;

const config: IndustryPageConfig = {
  route: "/webdesign-immobilien-bayreuth",
  industry: "Immobilien & Makler",
  industrySlug: "immobilien-makler",
  seo: {
    title: "Webdesign & KI-Telefonassistent für Immobilienmakler in Bayreuth | Cogniiq",
    description:
      "Makler Website Bayreuth: Cogniiq entwickelt Immobilien-Websites, KI-Telefonassistenten und Automatisierungen für Makler in Bayreuth. Mehr Immobilien-Leads, automatisierte Besichtigungen, DSGVO-konform.",
    canonical: `${base}/webdesign-immobilien-bayreuth`,
    keywords:
      "Makler Website Bayreuth, Immobilien Website Bayreuth, Immobilien Leads Bayreuth, KI Telefonassistent Makler",
  },
  hero: {
    trustTags: ["Bayreuth", "DSGVO-konform", "KI-Integration", "Immobilien-Leads", "Automatisierung"],
    ctaLabel: "Projekt für Immobilienmakler starten",
  },
  intro: {
    h1: "Webdesign & KI-Telefonassistent für Immobilienmakler in Bayreuth",
    lead: "Cogniiq entwickelt Websites, KI-Telefonassistenten und Automatisierungssysteme für Immobilienmakler in Bayreuth – für mehr qualifizierte Leads, automatisierte Besichtigungstermine und professionelle Objektpräsentation. Lokal betreut, DSGVO-konform.",
  },
  problems: [
    "Telefonanfragen zu Objekten binden den Makler und erschweren eine effiziente Arbeitsplanung",
    "Potenzielle Käufer und Mieter versuchen außerhalb der Geschäftszeiten Kontakt aufzunehmen",
    "Veraltete oder unübersichtliche Makler-Website senkt die Qualität eingehender Leads",
    "Exposé-Anfragen werden manuell bearbeitet – langsame Reaktionszeit führt zu verlorenen Interessenten",
    "Besichtigungstermine werden per Telefon koordiniert – fehleranfällig und zeitintensiv",
    "Fehlende Online-Sichtbarkeit bei lokalen Suchanfragen wie 'Makler Bayreuth' oder 'Immobilien kaufen Bayreuth'",
    "Manuelle Nachverfolgung von Interessenten und Leads ohne strukturiertes System",
  ],
  services: [
    {
      icon: "web",
      title: "Immobilien-Website Bayreuth",
      description:
        "Professionelle Makler-Website mit Objektübersicht, Exposé-Download, Kontaktformularen und gezieltem Local-SEO für Suchanfragen wie 'Immobilienmakler Bayreuth' oder 'Wohnung kaufen Bayreuth'. Hochwertig gestaltet, mobiloptimiert, conversion-stark.",
    },
    {
      icon: "phone",
      title: "KI-Telefonassistent für Makler",
      description:
        "Der KI-Telefonassistent qualifiziert eingehende Objektanfragen automatisch vor, beantwortet häufige Fragen zu Lage, Größe und Preis, vereinbart Besichtigungstermine direkt und leitet qualifizierte Interessenten strukturiert an den Makler weiter – rund um die Uhr.",
    },
    {
      icon: "zap",
      title: "Immobilien-Automatisierung",
      description:
        "Exposé-Versand nach Anfrage, Besichtigungsbestätigungen, automatisches Follow-up bei Interessenten und Lead-Qualifizierung laufen vollautomatisch ab. Kein manuelles Nachfassen, keine verlorenen Kontakte.",
    },
  ],
  useCases: [
    {
      title: "Besichtigungstermine automatisch vereinbaren",
      description:
        "Interessenten geben ihre Präferenzen für Besichtigungstermine direkt über die Website oder per KI-Telefonassistent ein. Der Termin wird automatisch in den Kalender eingetragen und eine Bestätigung versendet.",
    },
    {
      title: "Objektanfragen rund um die Uhr beantworten",
      description:
        "Der KI-Telefonassistent beantwortet eingehende Fragen zu Objekten, Lage, Miet- und Kaufpreisen sowie Verfügbarkeit – auch wenn der Makler nicht erreichbar ist.",
    },
    {
      title: "Exposé-Anfragen automatisch bearbeiten",
      description:
        "Nach einer Anfrage über die Website wird das Exposé automatisch versendet, der Interessent im CRM erfasst und ein Follow-up-Prozess gestartet – ohne manuellen Aufwand.",
    },
    {
      title: "Qualifizierte Leads aus lokalen Suchanfragen",
      description:
        "Die Immobilien-Website wird für Suchanfragen wie 'Immobilien kaufen Bayreuth', 'Wohnung mieten Bayreuth' oder 'Makler Bayreuth' optimiert – mehr organischer Traffic, mehr direkte Anfragen.",
    },
    {
      title: "Telefonleads außerhalb der Geschäftszeiten erfassen",
      description:
        "Anrufe außerhalb der Bürozeiten landen beim KI-Telefonassistenten. Interessenten können ihre Kontaktdaten und ihr gesuchtes Objekt hinterlassen – der Makler erhält eine strukturierte Zusammenfassung.",
    },
    {
      title: "Automatisches Follow-up für Interessenten",
      description:
        "Nach einer Besichtigung oder einem Erstkontakt erhalten Interessenten automatisiert weiterführende Informationen, Ähnlichkeitsangebote und eine gezielte Nachfrage – ohne manuelles Eingreifen.",
    },
  ],
  benefits: [
    "Keine verpassten Telefonanfragen – der KI-Assistent qualifiziert und erfasst Leads rund um die Uhr",
    "Automatisierte Besichtigungsprozesse sparen dem Makler mehrere Stunden pro Woche",
    "Mehr qualifizierte Immobilien-Leads durch eine suchmaschinenoptimierte Makler-Website",
    "Höhere Erreichbarkeit für Kaufinteressenten und Verkäufer – auf jedem Kanal, jederzeit",
    "Zeitersparnis durch automatisierten Exposé-Versand, Bestätigungen und Interessenten-Follow-up",
    "Professioneller Marktauftritt durch hochwertige Website und sofortige Reaktion auf Anfragen",
    "Vollständige DSGVO-Konformität – alle Interessentendaten werden sicher auf europäischen Servern verarbeitet",
  ],
  localContext: [
    "Der Immobilienmarkt in Bayreuth und im oberfränkischen Umland ist durch steigende Nachfrage bei begrenztem Angebot geprägt. Qualifizierte Interessenten erwarten schnelle Reaktionszeiten, hochwertige Objektpräsentationen und unkomplizierte Terminvereinbarungen – Makler, die das nicht bieten, verlieren Interessenten an professioneller aufgestellte Wettbewerber.",
    "Cogniiq entwickelt für Immobilienmakler in Bayreuth passgenaue Digitallösungen: eine hochwertige Makler-Website mit gezieltem SEO-Fokus auf lokale Suchanfragen, einen KI-Telefonassistenten, der Objektanfragen qualifiziert und Besichtigungstermine vereinbart, sowie Automatisierungssysteme, die Exposé-Versand, Interessenten-Nachverfolgung und Lead-Management ohne manuellen Aufwand steuern.",
    "Als Bayreuther Unternehmen kennen wir den lokalen Immobilienmarkt und die spezifischen Anforderungen von Maklern in der Region. Die Einrichtung aller Systeme dauert 7–14 Tage. Alle Lösungen sind vollständig DSGVO-konform und werden ausschließlich auf europäischen Servern betrieben.",
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
      question: "Kann Cogniiq eine Immobilien-Website mit Objektverwaltung in Bayreuth erstellen?",
      answer:
        "Ja. Wir entwickeln Makler-Websites mit strukturierter Objektübersicht, Filterfunktionen und einfacher Verwaltung von Exposés und Objektfotos – individuell abgestimmt auf Ihr Portfolio.",
    },
    {
      question: "Wie hilft der KI-Telefonassistent bei der Lead-Qualifizierung?",
      answer:
        "Der KI-Telefonassistent stellt Interessenten gezielte Fragen zur gewünschten Lage, Objektgröße und Budget, erfasst die Daten strukturiert und leitet nur qualifizierte Anfragen an Sie weiter.",
    },
    {
      question: "Kann ich Besichtigungstermine direkt über die Website vereinbaren lassen?",
      answer:
        "Ja. Wir integrieren eine Terminbuchungsfunktion in Ihre Website, die Interessenten Besichtigungstermine direkt nach ihren Verfügbarkeiten buchen lässt – mit automatischer Bestätigung und Kalendereintrag.",
    },
    {
      question: "Werden Interessentendaten DSGVO-konform verarbeitet?",
      answer:
        "Ja. Alle Kontakt- und Interessentendaten werden ausschließlich auf europäischen Servern gespeichert und nach den Anforderungen der DSGVO verarbeitet.",
    },
    {
      question: "Wie lange dauert die Einrichtung für ein Immobilienbüro in Bayreuth?",
      answer:
        "Die Einrichtung dauert in der Regel 7–14 Tage. Website, KI-Telefonassistent und Automatisierungssysteme werden vollständig von Cogniiq eingerichtet – keine technischen Vorkenntnisse erforderlich.",
    },
  ],
};

export function WebdesignImmobilienBayreuth() {
  return <IndustryPage config={config} />;
}
