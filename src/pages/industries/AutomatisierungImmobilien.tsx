import { NationalIndustryPage } from "@/components/NationalIndustryPage";
import type { NationalIndustryPageConfig } from "@/components/NationalIndustryPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const config: NationalIndustryPageConfig = {
  seo: {
    title: "Automatisierung für Immobilienmakler | Lead-Management & CRM | Cogniiq",
    description: "Lead-Automatisierung für Immobilienmakler: Sofortige Kontaktaufnahme, automatischer Exposé-Versand, Besichtigungstermine und CRM-Synchronisation. Kein qualifizierter Lead geht mehr verloren.",
    canonical: `${BUSINESS_INFO.website}/automatisierung-immobilien`,
    keywords: "Automatisierung Immobilien, Makler Digitalisierung, Lead-Management Makler, Immobilien Prozessautomatisierung",
  },
  h1: "Automatisierung für Immobilienmakler & Immobilienbüros",
  tagline: "Immobilien · Lead-Automatisierung · CRM-Integration",
  intro: "Ein Interessent fragt abends über Immobilienscout an. Morgen früh ruft er auch beim Wettbewerber an – und entscheidet sich für den, der schneller war. Immobilienmakler verlieren täglich qualifizierte Leads nicht durch schlechtes Angebot, sondern durch zu langsame Reaktion. Automatisierung stellt sicher, dass jeder Lead in Sekunden kontaktiert, qualifiziert und im CRM erfasst wird.",
  serviceSlug: "leistungen",
  serviceLabel: "Automatisierung Leistungen",
  costLink: "/kosten-automatisierung",
  costLinkLabel: "Automatisierung Kosten",
  problems: [
    {
      title: "Leads werden zu spät kontaktiert – und gehen verloren",
      description: "Studien zeigen: Leads, die innerhalb von 5 Minuten kontaktiert werden, konvertieren 21-mal häufiger als solche, die nach einer Stunde kontaktiert werden. Manuelle Bearbeitung kann das nicht leisten.",
    },
    {
      title: "Exposé-Versand kostet täglich wertvolle Makler-Zeit",
      description: "Jede Anfrage manuell prüfen, das passende Exposé heraussuchen und versenden – bei 10–20 Anfragen täglich summiert sich das auf Stunden, die für Akquise und Abschlüsse fehlen.",
    },
    {
      title: "Besichtigungstermine werden telefonisch koordiniert",
      description: "Hin-und-her-Telefonieren für Besichtigungstermine kostet beide Seiten Zeit. Automatisierte Online-Buchung mit Kalenderabgleich löst das ohne eine einzige Rückfrage.",
    },
    {
      title: "Lead-Qualifizierung fehlt – jeder wird gleich behandelt",
      description: "Ohne automatische Qualifizierung verbringen Makler Zeit mit Interessenten, die nicht kaufbereit sind – während echte Käufer auf eine Rückmeldung warten.",
    },
    {
      title: "CRM-Pflege bleibt liegen – Kundenakten sind lückenhaft",
      description: "Interessentendaten aus Portalen, E-Mails und Telefonaten manuell ins CRM einzutragen passiert oft gar nicht. Das Ergebnis: keine Übersicht, keine strukturierte Nachverfolgung.",
    },
    {
      title: "Follow-up-Kommunikation findet nicht statt",
      description: "Interessenten, die beim ersten Mal nicht kaufen, werden nie wieder kontaktiert. Automatisierte Follow-up-Sequenzen halten den Kontakt warm – über Wochen, ohne manuelle Arbeit.",
    },
  ],
  solution: {
    headline: "Kein Lead geht mehr verloren – vollautomatisch.",
    text: "Cogniiq automatisiert das gesamte Lead-Management: Von der ersten Portalanfrage bis zur Unterschrift läuft jede Kommunikation automatisch, strukturiert und nachvollziehbar – im CRM Ihrer Wahl, ohne manuellen Aufwand.",
  },
  benefits: [
    "Sofortige automatische Kontaktaufnahme nach Anfrage (< 60 Sekunden)",
    "Automatischer Exposé-Versand nach Interessentenprofil",
    "Online-Besichtigungsbuchung mit automatischem Kalenderabgleich",
    "Lead-Qualifizierung per automatischem Fragebogen",
    "CRM automatisch befüllt: OnOffice, Propstack, HubSpot u.v.m.",
    "Follow-up-Sequenzen für passive Interessenten",
    "DSGVO-konforme Interessentendatenverarbeitung",
  ],
  workflow: {
    title: "Von der Anfrage zum Termin – vollautomatisch",
    steps: [
      {
        step: "01",
        title: "Lead geht ein",
        description: "Anfrage über Website, Immobilienportal oder Telefon – der Lead wird innerhalb von Sekunden ins CRM eingetragen, automatisch begrüßt und qualifiziert.",
      },
      {
        step: "02",
        title: "Informieren & Termin vereinbaren",
        description: "Passendes Exposé wird automatisch versendet, Qualifizierungsfragen gestellt und ein Besichtigungstermin angeboten – ohne eine einzige manuelle Handlung.",
      },
      {
        step: "03",
        title: "Nachverfolgen bis zum Abschluss",
        description: "Automatische Follow-up-Sequenzen in der richtigen Frequenz und zum richtigen Zeitpunkt. Kein Interessent fällt durch das Raster – auch Monate später nicht.",
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
      answer: "Wir integrieren die gängigen Immobilien-CRMs direkt: OnOffice, Propstack, Flowfact, Immoware24. Darüber hinaus unterstützen wir allgemeine CRM-Lösungen wie HubSpot, Pipedrive oder Salesforce. Wo keine direkte API existiert, entwickeln wir zuverlässige Übergabepunkte.",
    },
    {
      question: "Können auch Leads aus Immobilienportalen automatisch erfasst werden?",
      answer: "Ja. Anfragen von Immobilienscout24, Immowelt, eBay Kleinanzeigen und anderen Portalen laufen direkt in das Automatisierungssystem ein – je nach API-Verfügbarkeit des jeweiligen Portals. Die Kontaktaufnahme erfolgt innerhalb von Sekunden.",
    },
    {
      question: "Was kostet Lead-Automatisierung für Immobilienmakler?",
      answer: "Einfache Lead-Automatisierung mit CRM-Integration beginnt bei ca. 1.200–2.500 €. Umfassendere Systeme mit Multi-Portal-Integration, Follow-up-Sequenzen und Besichtigungsmanagement typischerweise 3.000–6.000 €. Genaues Angebot nach kostenlosem Erstgespräch.",
    },
    {
      question: "Wie schnell kontaktiert das System einen neuen Lead?",
      answer: "Innerhalb von unter 60 Sekunden nach der Anfrage. Das ist der entscheidende Unterschied zu manueller Bearbeitung: In der Zeit, in der ein Makler morgens seine E-Mails öffnet, hat das System bereits drei Interessenten kontaktiert, qualifiziert und Exposés verschickt.",
    },
    {
      question: "Ist die Verarbeitung von Interessentendaten DSGVO-konform?",
      answer: "Ja. Alle Interessentendaten werden DSGVO-konform verarbeitet – mit dokumentierter Einwilligung, auf europäischen Servern und mit einem Auftragsverarbeitungsvertrag (AVV). Datenschutzerklärung und Opt-in-Prozesse werden gemeinsam mit Ihnen konfiguriert.",
    },
  ],
};

export function AutomatisierungImmobilien() {
  return <NationalIndustryPage config={config} />;
}
