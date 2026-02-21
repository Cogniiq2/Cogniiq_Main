import { IndustryPage } from "@/components/IndustryPage";
import type { IndustryPageConfig } from "@/components/IndustryPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const base = BUSINESS_INFO.website;

const config: IndustryPageConfig = {
  route: "/webdesign-immobilien-regensburg",
  industry: "Immobilien & Makler",
  industrySlug: "immobilien-makler",
  seo: {
    title: "Webdesign & KI-Telefonassistent für Immobilienmakler in Regensburg | Cogniiq",
    description:
      "Makler Website Regensburg: Cogniiq entwickelt Immobilien-Websites, KI-Telefonassistenten und Automatisierungen für Makler in Regensburg. Mehr Immobilien-Leads, automatisierte Besichtigungen, DSGVO-konform.",
    canonical: `${base}/webdesign-immobilien-regensburg`,
    keywords:
      "Makler Website Regensburg, Immobilien Website Regensburg, Immobilien Leads Regensburg, KI Telefonassistent Makler Regensburg",
  },
  hero: {
    trustTags: ["Regensburg", "DSGVO-konform", "KI-Integration", "Immobilien-Leads", "Persönliche Betreuung"],
    ctaLabel: "Projekt für Immobilienmakler starten",
  },
  intro: {
    h1: "Webdesign & KI-Telefonassistent für Immobilienmakler in Regensburg",
    lead: "Cogniiq entwickelt Websites, KI-Telefonassistenten und Automatisierungssysteme für Immobilienmakler in Regensburg – für mehr qualifizierte Leads, automatisierte Besichtigungstermine und professionelle Objektpräsentation in einem der dynamischsten Immobilienmärkte Ostbayerns.",
  },
  problems: [
    "Der Regensburger Immobilienmarkt wächst – Interessenten erwarten schnelle Reaktionszeiten und eine professionelle Makler-Website",
    "Telefonanfragen zu Objekten binden den Makler und erschweren eine effiziente Arbeitsplanung",
    "Potenzielle Käufer und Mieter versuchen bevorzugt abends und am Wochenende Kontakt aufzunehmen",
    "Veraltete oder unübersichtliche Makler-Website lässt qualifizierte Leads zur Konkurrenz abwandern",
    "Exposé-Anfragen werden manuell bearbeitet – langsame Reaktionszeit führt zu verlorenen Interessenten",
    "Besichtigungstermine werden telefonisch koordiniert – fehleranfällig und zeitintensiv",
    "Fehlende Sichtbarkeit bei Suchanfragen wie 'Makler Regensburg' oder 'Immobilien kaufen Regensburg'",
  ],
  services: [
    {
      icon: "web",
      title: "Immobilien-Website Regensburg",
      description:
        "Professionelle Makler-Website mit Objektübersicht, Exposé-Download, Kontaktformularen und gezieltem Local-SEO für Suchanfragen wie 'Immobilienmakler Regensburg' oder 'Wohnung kaufen Regensburg'. Hochwertig gestaltet, mobiloptimiert und auf persönliche Betreuung ausgelegt.",
    },
    {
      icon: "phone",
      title: "KI-Telefonassistent für Regensburger Makler",
      description:
        "Der KI-Telefonassistent qualifiziert eingehende Objektanfragen automatisch vor, beantwortet häufige Fragen zu Lage, Größe und Preis, vereinbart Besichtigungstermine direkt und leitet qualifizierte Interessenten strukturiert an den Makler weiter – rund um die Uhr.",
    },
    {
      icon: "zap",
      title: "Immobilien-Automatisierung Regensburg",
      description:
        "Exposé-Versand nach Anfrage, Besichtigungsbestätigungen, automatisches Follow-up bei Interessenten und Lead-Qualifizierung laufen vollautomatisch ab. Kein manuelles Nachfassen, keine verlorenen Kontakte – persönlich abgestimmt auf Ihre Arbeitsweise als regionaler Makler.",
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
        "Der KI-Telefonassistent beantwortet Fragen zu Objekten, Lage, Miet- und Kaufpreisen sowie Verfügbarkeit – auch abends und am Wochenende, wenn Interessenten in Regensburg aktiv suchen.",
    },
    {
      title: "Exposé-Anfragen automatisch bearbeiten",
      description:
        "Nach einer Anfrage über die Website wird das Exposé automatisch versendet, der Interessent im CRM erfasst und ein Follow-up-Prozess gestartet – ohne manuellen Aufwand.",
    },
    {
      title: "Qualifizierte Leads aus Regensburger Suchanfragen",
      description:
        "Die Immobilien-Website wird für Suchanfragen wie 'Immobilien kaufen Regensburg', 'Wohnung mieten Regensburg' oder 'Makler Regensburg' optimiert – messbarer Anstieg organischer Anfragen.",
    },
    {
      title: "Telefonleads außerhalb der Geschäftszeiten erfassen",
      description:
        "Anrufe außerhalb der Bürozeiten landen beim KI-Telefonassistenten. Interessenten hinterlassen ihre Kontaktdaten und Objektwünsche – der Makler erhält am nächsten Morgen eine strukturierte Zusammenfassung.",
    },
    {
      title: "Automatisches Follow-up für Interessenten",
      description:
        "Nach einer Besichtigung oder einem Erstkontakt erhalten Interessenten automatisiert weiterführende Informationen und ähnliche Objekte – ohne manuelles Eingreifen, mit messbarem Einfluss auf die Abschlussrate.",
    },
  ],
  benefits: [
    "Keine verpassten Telefonanfragen – der KI-Assistent qualifiziert und erfasst Leads rund um die Uhr",
    "Automatisierte Besichtigungsprozesse sparen dem Makler mehrere Stunden pro Woche",
    "Mehr qualifizierte Immobilien-Leads durch eine suchmaschinenoptimierte Makler-Website für Regensburg",
    "Persönlicher Marktauftritt, der das Vertrauen regional verwurzelter Interessenten stärkt",
    "Zeitersparnis durch automatisierten Exposé-Versand, Bestätigungen und Interessenten-Follow-up",
    "Persönliche Betreuung durch Cogniiq – abgestimmt auf die regionalen Besonderheiten des Regensburger Immobilienmarkts",
    "Vollständige DSGVO-Konformität – alle Interessentendaten werden sicher auf europäischen Servern verarbeitet",
  ],
  localContext: [
    "Regensburg gehört zu den am stärksten wachsenden Städten Bayerns. Steigende Einwohnerzahlen, die Universität und eine starke Wirtschaft treiben die Nachfrage nach Wohn- und Gewerbeimmobilien kontinuierlich an. Gleichzeitig sind Regensburger Interessenten auf der Suche nach regionalen Maklern, denen sie vertrauen – persönlicher Kontakt und lokale Expertise sind hier entscheidend.",
    "Cogniiq entwickelt für Immobilienmakler in Regensburg passgenaue Digitallösungen: eine hochwertige Makler-Website mit lokalem SEO-Fokus, einen KI-Telefonassistenten, der Objektanfragen qualifiziert und Besichtigungstermine vereinbart, sowie Automatisierungssysteme, die Exposé-Versand, Interessenten-Nachverfolgung und Lead-Management ohne manuellen Aufwand steuern.",
    "Wir legen besonderen Wert auf persönliche Betreuung – die Lösungen werden auf Ihre individuelle Arbeitsweise als Regensburger Makler abgestimmt. Die Einrichtung dauert 7–14 Tage. Alle Systeme sind vollständig DSGVO-konform und werden auf europäischen Servern betrieben.",
  ],
  internalLinks: [
    { label: "Webdesign Regensburg", href: "/regensburg/webdesign" },
    { label: "KI-Telefonassistent Regensburg", href: "/regensburg/ki-telefonassistent" },
    { label: "Automatisierung Regensburg", href: "/regensburg/automatisierung" },
    { label: "Cogniiq Regensburg", href: "/regensburg" },
    { label: "Immobilien Bayreuth", href: "/webdesign-immobilien-bayreuth" },
    { label: "Immobilien München", href: "/webdesign-immobilien-muenchen" },
    { label: "Alle Leistungen", href: "/leistungen" },
    { label: "Bayern", href: "/bayern" },
    { label: "Deutschland", href: "/deutschland" },
  ],
  faq: [
    {
      question: "Kann Cogniiq eine Immobilien-Website mit Objektverwaltung in Regensburg erstellen?",
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
        "Ja. Wir integrieren eine Terminbuchungsfunktion in Ihre Website, die Interessenten Besichtigungstermine direkt buchen lässt – mit automatischer Bestätigung und Kalendereintrag.",
    },
    {
      question: "Werden Interessentendaten DSGVO-konform verarbeitet?",
      answer:
        "Ja. Alle Kontakt- und Interessentendaten werden ausschließlich auf europäischen Servern gespeichert und nach den Anforderungen der DSGVO verarbeitet.",
    },
    {
      question: "Wie lange dauert die Einrichtung für ein Immobilienbüro in Regensburg?",
      answer:
        "Die Einrichtung dauert in der Regel 7–14 Tage. Website, KI-Telefonassistent und Automatisierungssysteme werden vollständig von Cogniiq eingerichtet – keine technischen Vorkenntnisse erforderlich.",
    },
  ],
};

export function WebdesignImmobilienRegensburg() {
  return <IndustryPage config={config} />;
}
