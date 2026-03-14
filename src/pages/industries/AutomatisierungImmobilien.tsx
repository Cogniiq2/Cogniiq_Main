import { NationalIndustryPage } from "@/components/NationalIndustryPage";
import type { NationalIndustryPageConfig } from "@/components/NationalIndustryPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const config: NationalIndustryPageConfig = {
  seo: {
    title: "Automatisierung für Immobilienmakler | Lead-Management & Prozesse | Cogniiq",
    description: "Prozessautomatisierung für Immobilienmakler: Lead-Management, Exposé-Versand, Besichtigungstermine und Interessentenkommunikation vollständig automatisiert.",
    canonical: `${BUSINESS_INFO.website}/automatisierung-immobilien`,
    keywords: "Automatisierung Immobilien, Makler Digitalisierung, Lead-Management Makler, Immobilien Prozessautomatisierung",
  },
  h1: "Automatisierung für Immobilienmakler & -büros",
  tagline: "Immobilien · Lead-Automatisierung · CRM-Integration",
  intro: "Immobilienmakler verlieren täglich qualifizierte Leads durch zu langsame Reaktionszeiten. Automatisierung stellt sicher, dass jeder Lead sofort kontaktiert, qualifiziert und weiterverarbeitet wird – ohne manuellen Aufwand.",
  serviceSlug: "leistungen",
  serviceLabel: "Automatisierung Leistungen",
  costLink: "/kosten-automatisierung",
  costLinkLabel: "Automatisierung Kosten",
  problems: [
    {
      title: "Leads werden nicht schnell genug kontaktiert",
      description: "Interessenten, die online anfragen, erwarten eine Antwort innerhalb von Minuten. Manuelle Bearbeitung kostet Stunden – und den Lead.",
    },
    {
      title: "Exposé-Versand manuell und zeitaufwändig",
      description: "Exposés manuell an jeden Interessenten zu versenden kostet täglich Zeit. Automatisierter Exposé-Versand nach Anfrage ist effizienter.",
    },
    {
      title: "Besichtigungstermine ineffizient koordiniert",
      description: "Telefonische Terminkoordination für Besichtigungen bindet Makler-Zeit und führt zu Doppelbuchungen oder Terminkonflikten.",
    },
    {
      title: "Keine strukturierte Lead-Qualifizierung",
      description: "Ohne automatische Qualifizierung wird Zeit mit unqualifizierten Interessenten verschwendet, während echte Käufer auf Feedback warten.",
    },
    {
      title: "CRM-Datenpflege manuell und unvollständig",
      description: "Interessentendaten aus verschiedenen Quellen manuell ins CRM einzutragen ist fehleranfällig und sorgt für unvollständige Kundenakten.",
    },
    {
      title: "Keine automatische Follow-up-Kommunikation",
      description: "Interessenten, die sich nicht sofort entscheiden, werden ohne automatische Follow-ups nicht mehr kontaktiert – obwohl sie vielleicht noch kaufinteressiert sind.",
    },
  ],
  solution: {
    headline: "Kein Lead geht mehr verloren – vollautomatisch.",
    text: "Cogniiq automatisiert das komplette Lead-Management für Immobilienmakler: Von der ersten Anfrage bis zur Unterschrift läuft die Kommunikation automatisch, strukturiert und nachvollziehbar.",
  },
  benefits: [
    "Sofortige automatische Lead-Kontaktaufnahme",
    "Automatischer Exposé-Versand nach Anfrage",
    "Online-Besichtigungstermin-Buchung",
    "CRM automatisch befüllt und aktualisiert",
    "Lead-Qualifizierung per automatischem Fragebogen",
    "Follow-up-Sequenzen für passive Interessenten",
    "DSGVO-konforme Interessentendatenverarbeitung",
  ],
  workflow: {
    title: "Automatisierter Lead-Management-Workflow",
    steps: [
      {
        step: "Schritt 1",
        title: "Lead geht ein",
        description: "Anfrage über Website, Portal oder Telefon – der Lead wird sofort erfasst, ins CRM eingetragen und automatisch kontaktiert.",
      },
      {
        step: "Schritt 2",
        title: "Qualifizieren & informieren",
        description: "Automatischer Exposé-Versand, Qualifizierungsfragen und Terminangebot – alles ohne manuellen Aufwand.",
      },
      {
        step: "Schritt 3",
        title: "Nachverfolgen & abschließen",
        description: "Automatische Follow-ups in der richtigen Frequenz, bis zum Abschluss. Kein Interessent fällt durch das Raster.",
      },
    ],
  },
  cityLinks: [
    { label: "Automatisierung Bayreuth", href: "/bayreuth/automatisierung" },
    { label: "Automatisierung München", href: "/muenchen/automatisierung" },
    { label: "Automatisierung Regensburg", href: "/regensburg/automatisierung" },
    { label: "Automatisierung Bayern", href: "/bayern" },
    { label: "Automatisierung Deutschland", href: "/automatisierung-unternehmen" },
  ],
  relatedLinks: [
    { label: "Webdesign Immobilien", href: "/webdesign-immobilien" },
    { label: "KI Telefonassistent", href: "/ki-telefonassistent" },
    { label: "Kosten Automatisierung", href: "/kosten-automatisierung" },
    { label: "Automatisierung Arzt", href: "/automatisierung-arzt" },
    { label: "Automatisierung Restaurant", href: "/automatisierung-restaurant" },
  ],
  faq: [
    {
      question: "Welche CRM-Systeme können integriert werden?",
      answer: "Wir integrieren gängige Immobilien-CRM-Systeme wie OnOffice, Propstack, Flowfact sowie allgemeine CRM-Lösungen wie HubSpot oder Salesforce.",
    },
    {
      question: "Kann die Automatisierung mit Immobilienportalen verbunden werden?",
      answer: "Leads aus Immobilienscout24, Immowelt und anderen Portalen können automatisch erfasst und verarbeitet werden – je nach API-Verfügbarkeit.",
    },
    {
      question: "Was kostet Lead-Automatisierung für Makler?",
      answer: "Einfache Lead-Automatisierung mit CRM-Integration beginnt bei ca. 1.200–2.500 €. Umfassendere Systeme mit Multi-Portal-Integration typischerweise 3.000–6.000 €.",
    },
    {
      question: "Wie schnell reagiert das System auf neue Leads?",
      answer: "Sofort – innerhalb von Sekunden nach der Anfrage. Diese Schnelligkeit ist entscheidend: Studien zeigen, dass Leads in den ersten 5 Minuten kontaktiert werden müssen.",
    },
    {
      question: "Ist die Automatisierung DSGVO-konform für Interessentendaten?",
      answer: "Ja. Alle Daten werden DSGVO-konform verarbeitet, mit Einwilligungsdokumentation und auf europäischen Servern.",
    },
  ],
};

export function AutomatisierungImmobilien() {
  return <NationalIndustryPage config={config} />;
}
