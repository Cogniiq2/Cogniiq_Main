import { CostPage } from "@/components/CostPage";
import type { CostPageConfig } from "@/components/CostPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const config: CostPageConfig = {
  seo: {
    title: "Was kostet Automatisierung? Automatisierung Kosten & Preise | Cogniiq",
    description: "Was kostet Prozessautomatisierung für Unternehmen? Automatisierung Kosten, Preise und ROI erklärt. Von einfachen Workflows bis zur vollständigen Digitalisierung – transparente Preisübersicht.",
    canonical: `${BUSINESS_INFO.website}/kosten-automatisierung`,
  },
  h1: "Was kostet Automatisierung für Unternehmen?",
  intro: "Prozessautomatisierung ist eine der effizientesten Investitionen für Unternehmen, die täglich Zeit durch manuelle Abläufe verlieren. Hier finden Sie transparente Preisübersichten und konkrete Beispiele – damit Sie den ROI vor der Entscheidung einschätzen können.",
  serviceLink: "/leistungen",
  serviceLinkLabel: "Automatisierung Leistungen",
  priceRanges: [
    {
      label: "Einzel-Workflow",
      range: "500 – 1.500 €",
      description: "Automatisierung eines einzelnen, klar definierten Prozesses – z.B. Lead-Benachrichtigung, Rechnungsversand oder Terminbestätigung.",
    },
    {
      label: "System-Integration",
      range: "1.500 – 5.000 €",
      description: "Verbindung mehrerer Systeme (CRM, Buchhaltung, Kalender, E-Mail) mit automatisierten Workflows. Dokumentiert, wartbar und skalierbar.",
    },
    {
      label: "Vollständige Digitalisierung",
      range: "ab 5.000 €",
      description: "Umfassende Automatisierung aller Kernprozesse eines Unternehmens. Onboarding, Lead-Management, Kommunikation, Abrechnung und Reporting vollständig automatisiert.",
    },
  ],
  priceFactors: [
    {
      title: "Anzahl der zu automatisierenden Prozesse",
      description: "Ein einzelner Workflow ist deutlich günstiger als die Automatisierung aller Kernprozesse eines Unternehmens. Wir empfehlen, mit dem Prozess mit dem höchsten ROI zu beginnen.",
    },
    {
      title: "Komplexität der Logik",
      description: "Einfache If-Then-Automatisierungen sind günstig. Komplexe bedingte Logiken mit mehreren Systemen, Ausnahmebehandlungen und Fehler-Routings kosten mehr.",
    },
    {
      title: "Anzahl der integrierten Systeme",
      description: "Je mehr Systeme verbunden werden sollen (CRM, ERP, Kalender, E-Mail, Telefon, Buchhaltung), desto höher der Integrationsaufwand.",
    },
    {
      title: "Datenmigration und Setup",
      description: "Wenn bestehende Daten übertragen oder aufbereitet werden müssen, erhöht das den einmaligen Aufwand. Laufende Automatisierungen sind dann kostengünstig.",
    },
    {
      title: "Laufende Wartung und Monitoring",
      description: "Automatisierungen müssen überwacht und bei Systemänderungen angepasst werden. Wartungspakete ab 99 €/Monat sichern den zuverlässigen Betrieb.",
    },
    {
      title: "Schulung und Dokumentation",
      description: "Vollständige Dokumentation und Schulung Ihres Teams ist in größeren Paketen enthalten und sichert die Unabhängigkeit nach der Übergabe.",
    },
  ],
  exampleProjects: [
    {
      title: "Lead-Management Automatisierung, Dienstleister",
      description: "Automatische Lead-Erfassung aus Website-Formular, Qualifizierung, CRM-Eintrag und Benachrichtigung des zuständigen Mitarbeiters. Kein Lead geht mehr verloren.",
      investment: "800 – 1.200 €",
    },
    {
      title: "Rechnungsautomatisierung, Handwerk",
      description: "Automatische Rechnungserstellung nach Auftragsabschluss, Versand per E-Mail, Mahnwesen und Synchronisation mit Buchhaltungssoftware.",
      investment: "1.500 – 2.500 €",
    },
    {
      title: "Onboarding-Automatisierung, Agentur",
      description: "Vollautomatisches Kunden-Onboarding: Willkommens-Mail, Vertragsversand, Kalender-Setup und Projektanlage im Projektmanagement-Tool.",
      investment: "2.000 – 3.500 €",
    },
    {
      title: "Vollständige Prozessdigitalisierung, Mittelstand",
      description: "Automatisierung aller Kernprozesse: Leadverarbeitung, Angebotserstellung, Rechnungsstellung, Kundenkommunikation und Reporting – vollständig dokumentiert.",
      investment: "ab 6.000 €",
    },
  ],
  cityLinks: [
    { label: "Automatisierung Bayreuth", href: "/bayreuth/automatisierung" },
    { label: "Automatisierung München", href: "/muenchen/automatisierung" },
    { label: "Automatisierung Regensburg", href: "/regensburg/automatisierung" },
    { label: "Automatisierung Bayern", href: "/bayern" },
    { label: "Automatisierung Deutschland", href: "/automatisierung-unternehmen" },
  ],
  industryLinks: [
    { label: "Automatisierung Restaurant", href: "/automatisierung-restaurant" },
    { label: "Automatisierung Arzt", href: "/automatisierung-arzt" },
    { label: "Automatisierung Immobilien", href: "/automatisierung-immobilien" },
    { label: "Automatisierung Sport", href: "/automatisierung-sport" },
  ],
  faq: [
    {
      question: "Was kostet eine einfache Automatisierung?",
      answer: "Ein einzelner, klar definierter Automatisierungs-Workflow (z.B. Lead-Benachrichtigung oder Terminbestätigung) kostet typischerweise 500–1.500 €. Komplexere Integrationen beginnen bei 1.500 €.",
    },
    {
      question: "Ab wann lohnt sich Automatisierung finanziell?",
      answer: "Wenn ein Prozess täglich 30 Minuten oder mehr kostet, amortisiert sich die Automatisierung in den meisten Fällen innerhalb von 3–6 Monaten. Bei zeitintensiven Prozessen wie Rechnungsstellung oft schon in wenigen Wochen.",
    },
    {
      question: "Welche Tools nutzt Cogniiq für Automatisierungen?",
      answer: "Wir arbeiten primär mit n8n und Make.com – beides DSGVO-konforme Tools, die auf europäischen Servern betrieben werden können. Bei spezifischen Anforderungen auch direkte API-Integrationen.",
    },
    {
      question: "Kann ich die Automatisierung später selbst anpassen?",
      answer: "Ja. Wir liefern vollständige Dokumentation und schulen Ihr Team in der Bedienung. Für technische Änderungen stehen wir weiterhin zur Verfügung – ohne Zwang zur laufenden Zusammenarbeit.",
    },
    {
      question: "Was kostet laufende Wartung einer Automatisierung?",
      answer: "Wartungspakete beginnen ab ca. 99 €/Monat. Diese umfassen Monitoring, Fehlerbehebung und Anpassungen bei System-Updates der integrierten Tools.",
    },
    {
      question: "Ist Automatisierung für kleine Unternehmen geeignet?",
      answer: "Ja, gerade für kleine Unternehmen ist Automatisierung besonders wertvoll, da jede eingesparte Arbeitsstunde direkt dem Betrieb zugute kommt. Bereits ein Workflow für 500–1.000 € kann täglich eine Stunde sparen.",
    },
    {
      question: "Sind Automatisierungen DSGVO-konform?",
      answer: "Ja. Cogniiq arbeitet ausschließlich mit DSGVO-konformen Tools auf europäischen Servern. Alle Automatisierungen werden mit dem notwendigen Datenschutznachweis geliefert.",
    },
  ],
  ctaHeadline: "Kostenloses Automatisierungs-Audit",
  ctaText: "Im kostenlosen Erstgespräch analysieren wir gemeinsam, welche Ihrer Prozesse sich am schnellsten und günstigsten automatisieren lassen – mit konkreter ROI-Einschätzung.",
};

export function KostenAutomatisierung() {
  return <CostPage config={config} />;
}
