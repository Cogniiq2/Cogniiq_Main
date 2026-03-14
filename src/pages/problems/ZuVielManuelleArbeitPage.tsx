import { ProblemPage } from "@/components/ProblemPage";
import type { ProblemPageConfig } from "@/components/ProblemPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const config: ProblemPageConfig = {
  seo: {
    title: "Zu viel manuelle Arbeit im Unternehmen – Automatisierung als Lösung | Cogniiq",
    description: "Manuelle Arbeit kostet Unternehmen täglich Stunden. Erfahren Sie, welche Prozesse sofort automatisiert werden können und wie viel Zeit und Geld Sie dabei sparen.",
    canonical: `${BUSINESS_INFO.website}/zu-viel-manuelle-arbeit`,
  },
  h1: "Zu viel manuelle Arbeit im Unternehmen: Automatisierung löst das Problem",
  tagline: "Problem · Manuelle Prozesse · Automatisierung",
  intro: "Deutschlands Unternehmen verbringen täglich Stunden mit Aufgaben, die vollständig automatisiert werden könnten. Jede Stunde manuelle Arbeit ist eine verlorene Stunde, die besser in Wachstum investiert wäre.",
  problem: {
    headline: "Welche manuellen Prozesse Unternehmen täglich Zeit kosten",
    points: [
      "Termine manuell koordinieren, bestätigen und erinnern",
      "E-Mails und Anfragen manuell beantworten und weiterleiten",
      "Kundendaten manuell zwischen verschiedenen Systemen übertragen",
      "Rechnungen und Angebote manuell erstellen und versenden",
      "Social-Media-Beiträge manuell erstellen und posten",
      "Berichte und Auswertungen manuell zusammenstellen",
      "Lead-Follow-ups manuell nachverfolgen und dokumentieren",
    ],
  },
  costs: {
    headline: "Was manuelle Arbeit Ihr Unternehmen wirklich kostet",
    points: [
      {
        title: "Direkte Personalkosten",
        description: "Eine Arbeitsstunde kostet inkl. Lohnnebenkosten ca. 30–60 €. Bei 3 Stunden täglich manueller Arbeit sind das 25.000–50.000 € pro Jahr – für vermeidbare Aufgaben.",
      },
      {
        title: "Fehleranfälligkeit und Qualitätskosten",
        description: "Manuelle Prozesse sind fehleranfällig. Doppelt erfasste Daten, vergessene Follow-ups und falsche Buchungen kosten Zeit für Korrekturen und Kundenvertrauen.",
      },
      {
        title: "Skalierungsproblem",
        description: "Wenn Ihr Unternehmen wächst, wachsen manuelle Prozesse proportional mit. Automatisierung skaliert kostenlos – ohne neues Personal für Routineaufgaben.",
      },
      {
        title: "Opportunitätskosten",
        description: "Stunden, die mit manuellen Routinen verbracht werden, fehlen für Verkauf, Kundenpflege und strategische Aufgaben, die echten Mehrwert schaffen.",
      },
    ],
  },
  solution: {
    headline: "Automatisierung, die sofort Zeit freisetzt.",
    text: "Cogniiq automatisiert die zeitaufwändigsten Prozesse Ihres Unternehmens mit n8n und Make.com – DSGVO-konform, auf europäischen Servern, vollständig dokumentiert. Die meisten Workflows sind in 1–3 Wochen live.",
    bullets: [
      "Lead-Management vollständig automatisiert",
      "Terminbestätigung und Erinnerungen automatisch",
      "Rechnungsstellung und Mahnwesen automatisiert",
      "Daten zwischen Systemen automatisch synchronisiert",
      "DSGVO-konform auf deutschen Servern",
      "Vollständige Dokumentation und Team-Schulung",
    ],
  },
  serviceLinks: [
    { label: "Automatisierung für Unternehmen", href: "/automatisierung-unternehmen" },
    { label: "Automatisierung Kosten", href: "/kosten-automatisierung" },
    { label: "KI Agentur Deutschland", href: "/ki-agentur-deutschland" },
    { label: "Digitale Automatisierung", href: "/digitale-automatisierung-unternehmen" },
    { label: "Kontakt", href: "/kontakt" },
  ],
};

export function ZuVielManuelleArbeitPage() {
  return <ProblemPage config={config} />;
}
