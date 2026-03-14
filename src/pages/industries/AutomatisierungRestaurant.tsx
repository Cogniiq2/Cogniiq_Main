import { NationalIndustryPage } from "@/components/NationalIndustryPage";
import type { NationalIndustryPageConfig } from "@/components/NationalIndustryPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const config: NationalIndustryPageConfig = {
  seo: {
    title: "Automatisierung für Restaurants & Gastronomie | Cogniiq",
    description: "Prozessautomatisierung für Restaurants: Reservierungen, Bestellungen, Kommunikation und Abrechnung vollständig automatisiert. Weniger manuelle Arbeit, mehr Zeit für Gäste.",
    canonical: `${BUSINESS_INFO.website}/automatisierung-restaurant`,
    keywords: "Automatisierung Restaurant, Gastronomie Automatisierung, Reservierung automatisieren, Gastronomie Digitalisierung",
  },
  h1: "Automatisierung für Restaurants & Gastronomie",
  tagline: "Gastronomie · Automatisierung · Effizienz",
  intro: "Restaurants verlieren täglich Stunden durch manuelle Reservierungsbestätigungen, Schichteinteilungen und Lieferantenkommunikation. Automatisierung löst diese Engpässe dauerhaft – ohne zusätzliches Personal.",
  serviceSlug: "leistungen",
  serviceLabel: "Automatisierung Leistungen",
  costLink: "/kosten-automatisierung",
  costLinkLabel: "Automatisierung Kosten",
  problems: [
    {
      title: "Manuelle Reservierungsbestätigungen kosten Zeit",
      description: "Jede Reservierung manuell bestätigen, erinnern und nachfassen – das bindet täglich wertvolle Stunden, die für Gäste fehlen.",
    },
    {
      title: "Keine automatische No-Show-Kommunikation",
      description: "Ohne automatische Erinnerungen steigen No-Shows und kosten direkt Umsatz. Manuelle Erinnerungsanrufe sind ineffizient und oft vergessen.",
    },
    {
      title: "Lieferantenkommunikation manuell und zeitaufwändig",
      description: "Bestellungen bei Lieferanten, Lieferbestätigungen und Rechnungen manuell zu koordinieren kostet täglich Zeit und ist fehleranfällig.",
    },
    {
      title: "Personalplanung und Schichten unstrukturiert",
      description: "Schichteinteilungen per WhatsApp und mündliche Absprachen führen zu Fehlern, Überschneidungen und unzufriedenem Personal.",
    },
    {
      title: "Feedback und Bewertungen nicht systematisch",
      description: "Zufriedene Gäste geben keine Bewertung, wenn man sie nicht aktiv bittet. Automatisierte Follow-up-Kommunikation nach dem Besuch erhöht Bewertungen.",
    },
    {
      title: "Umsatz und Buchhaltungsdaten manuell übertragen",
      description: "Kassendaten manuell in die Buchhaltungssoftware übertragen – das ist fehleranfällig und kostet täglich unnötig Zeit.",
    },
  ],
  solution: {
    headline: "Restaurant-Abläufe automatisieren – Gäste besser bedienen.",
    text: "Cogniiq automatisiert die wichtigsten Restaurant-Prozesse: Reservierungsbestätigungen, Erinnerungen, Lieferantenkommunikation und Bewertungsanfragen laufen vollständig automatisch. Das Team konzentriert sich auf den Gast.",
  },
  benefits: [
    "Automatische Reservierungsbestätigung und Erinnerung",
    "No-Show-Reduzierung durch systematische Kommunikation",
    "Lieferantenbestellungen automatisch koordiniert",
    "Bewertungsanfragen nach Besuch automatisch versandt",
    "Kassendaten automatisch in Buchhaltung übertragen",
    "Schichtplanung strukturiert und nachvollziehbar",
    "DSGVO-konforme Gästedatenverarbeitung",
  ],
  workflow: {
    title: "Automatisierter Reservierungs-Workflow",
    steps: [
      {
        step: "Schritt 1",
        title: "Reservierung eingeht",
        description: "Ob telefonisch über KI-Assistent oder online – die Reservierung wird automatisch erfasst, in das System eingetragen und bestätigt.",
      },
      {
        step: "Schritt 2",
        title: "Automatische Kommunikation",
        description: "Bestätigung sofort, Erinnerung 24 Stunden vorher, Follow-up nach dem Besuch mit Bewertungsanfrage – vollautomatisch.",
      },
      {
        step: "Schritt 3",
        title: "Daten synchronisiert",
        description: "Alle Daten laufen automatisch in die Buchhaltung, CRM und Lieferantenplanung – keine manuelle Doppelerfassung mehr.",
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
    { label: "KI Telefonassistent Restaurant", href: "/ki-telefonassistent-restaurant" },
    { label: "Webdesign Gastronomie", href: "/webdesign-gastronomie" },
    { label: "Kosten Automatisierung", href: "/kosten-automatisierung" },
    { label: "Automatisierung Arzt", href: "/automatisierung-arzt" },
    { label: "Automatisierung Immobilien", href: "/automatisierung-immobilien" },
  ],
  faq: [
    {
      question: "Welche Restaurant-Prozesse lassen sich am einfachsten automatisieren?",
      answer: "Reservierungsbestätigungen, Erinnerungen, Bewertungsanfragen und Lieferantenbestellungen sind am einfachsten zu automatisieren – mit hohem ROI und schneller Einrichtung.",
    },
    {
      question: "Was kostet Automatisierung für ein Restaurant?",
      answer: "Einfache Workflows wie Reservierungsbestätigungen beginnen bei ca. 500–800 €. Umfassendere Automatisierungen inkl. Lieferantenintegration typischerweise 1.500–3.500 €.",
    },
    {
      question: "Kann die Automatisierung mit dem bestehenden Kassensystem verbunden werden?",
      answer: "In den meisten Fällen ja. Wir prüfen die Schnittstellen Ihres Kassensystems und entwickeln die passende Integration.",
    },
    {
      question: "Ist Automatisierung für kleine Restaurants sinnvoll?",
      answer: "Ja. Gerade kleine Restaurants mit wenig Personal profitieren stark, da jede eingesparte Stunde direkt dem Team zugute kommt.",
    },
    {
      question: "Wie lange dauert die Einrichtung?",
      answer: "Einfache Workflows sind in 1–2 Wochen live. Komplexere Integrationen mit mehreren Systemen dauern typischerweise 3–6 Wochen.",
    },
  ],
};

export function AutomatisierungRestaurant() {
  return <NationalIndustryPage config={config} />;
}
