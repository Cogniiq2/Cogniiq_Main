import { NationalIndustryPage } from "@/components/NationalIndustryPage";
import type { NationalIndustryPageConfig } from "@/components/NationalIndustryPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const config: NationalIndustryPageConfig = {
  seo: {
    title: "Automatisierung für Arztpraxen & Praxisverwaltung | Cogniiq",
    description: "Prozessautomatisierung für Arztpraxen: Terminbuchung, Patientenkommunikation und Praxisverwaltung automatisiert. Entlasten Sie Ihr Team und fokussieren Sie sich auf die Patientenversorgung.",
    canonical: `${BUSINESS_INFO.website}/automatisierung-arzt`,
    keywords: "Automatisierung Arztpraxis, Praxis Digitalisierung, Patientenkommunikation automatisieren, Praxisverwaltung Automatisierung",
  },
  h1: "Automatisierung für Arztpraxen & Praxisverwaltung",
  tagline: "Arztpraxis · Praxisautomatisierung · DSGVO-konform",
  intro: "Arztpraxen verlieren täglich Stunden durch Routineaufgaben: Terminbestätigungen, Patientenerinnerungen, Rezeptanfragen und administrative Abläufe. Automatisierung löst diese Engpässe dauerhaft und DSGVO-konform.",
  serviceSlug: "leistungen",
  serviceLabel: "Automatisierung Leistungen",
  costLink: "/kosten-automatisierung",
  costLinkLabel: "Automatisierung Kosten",
  problems: [
    {
      title: "Manuelle Terminbestätigungen kosten wertvolle Zeit",
      description: "Jeden Termin manuell bestätigen und erinnern – das bindet täglich Stunden, die für die Patientenversorgung fehlen.",
    },
    {
      title: "Rezeptanfragen telefonisch und ineffizient",
      description: "Routinemäßige Rezeptanfragen über das Telefon belasten das Team und können vollständig automatisiert werden.",
    },
    {
      title: "Patientendaten zwischen Systemen manuell übertragen",
      description: "Patientendaten manuell zwischen Praxisverwaltung, Terminkalender und Kommunikationstools zu übertragen ist zeitaufwändig und fehleranfällig.",
    },
    {
      title: "Keine automatische Wartelistenverwaltung",
      description: "Bei Terminabsagen wird die Warteliste manuell abgearbeitet – oft verzögert und ineffizient. Automatisierung füllt freie Slots sofort.",
    },
    {
      title: "Überweisungsmanagement zeitaufwändig",
      description: "Überweisungen beantragen, nachverfolgen und dokumentieren – ein manueller Prozess, der mit Automatisierung deutlich vereinfacht werden kann.",
    },
    {
      title: "Keine strukturierte Bewertungsanfrage nach Besuch",
      description: "Zufriedene Patienten geben selten von sich aus Bewertungen. Automatisierte Follow-ups nach dem Termin erhöhen die Bewertungsrate messbar.",
    },
  ],
  solution: {
    headline: "Praxisabläufe automatisieren – mehr Zeit für Patienten.",
    text: "Cogniiq automatisiert die Routineprozesse Ihrer Praxis: Terminbestätigungen, Erinnerungen, Wartelistenverwaltung und Patientenkommunikation laufen vollautomatisch. Das Team konzentriert sich auf die Versorgung.",
  },
  benefits: [
    "Automatische Terminbestätigung und Erinnerung",
    "Wartelistenverwaltung vollautomatisch",
    "DSGVO-konforme Automatisierung auf deutschen Servern",
    "Rezeptanfragen strukturiert und automatisiert verarbeitet",
    "Patientendaten systemübergreifend synchronisiert",
    "Bewertungsanfragen automatisch nach Besuch versandt",
    "Einrichtung in 2–4 Wochen ohne Praxisunterbrechung",
  ],
  workflow: {
    title: "Automatisierter Praxis-Workflow",
    steps: [
      {
        step: "Schritt 1",
        title: "Termin gebucht",
        description: "Ob online oder telefonisch – der Termin wird erfasst, bestätigt und in alle relevanten Systeme übertragen.",
      },
      {
        step: "Schritt 2",
        title: "Automatische Kommunikation",
        description: "Terminerinnerung 24–48 Stunden vorher, Hinweise auf mitzubringende Unterlagen und Follow-up nach dem Besuch.",
      },
      {
        step: "Schritt 3",
        title: "Warteliste & Berichte",
        description: "Bei Absagen wird die Warteliste automatisch kontaktiert. Auslastungsberichte werden automatisch erstellt.",
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
    { label: "KI Telefonassistent Arzt", href: "/ki-telefonassistent-arzt" },
    { label: "KI Telefonassistent Praxis", href: "/ki-telefonassistent-praxis" },
    { label: "Webdesign Arzt", href: "/webdesign-arzt" },
    { label: "Kosten Automatisierung", href: "/kosten-automatisierung" },
    { label: "Automatisierung Restaurant", href: "/automatisierung-restaurant" },
  ],
  faq: [
    {
      question: "Ist Praxisautomatisierung DSGVO-konform?",
      answer: "Ja. Cogniiq arbeitet ausschließlich mit DSGVO-konformen Tools auf deutschen/europäischen Servern. Alle Automatisierungen werden mit einem Auftragsverarbeitungsvertrag (AVV) geliefert.",
    },
    {
      question: "Kann die Automatisierung mit der bestehenden Praxissoftware verbunden werden?",
      answer: "In den meisten Fällen ja. Wir analysieren Ihre bestehenden Systeme und entwickeln passende Integrationen. Gängige Praxisverwaltungssysteme werden direkt unterstützt.",
    },
    {
      question: "Was kostet Praxisautomatisierung?",
      answer: "Einfache Workflows wie Terminbestätigungen beginnen bei ca. 600–1.200 €. Umfassendere Automatisierungen mit Systemintegrationen typischerweise 2.000–4.500 €.",
    },
    {
      question: "Wie lange dauert die Einrichtung?",
      answer: "Einfache Workflows sind in 1–2 Wochen live. Komplexere Praxisautomatisierungen dauern typischerweise 3–6 Wochen, ohne den Praxisbetrieb zu unterbrechen.",
    },
    {
      question: "Kann ich die Automatisierungen selbst anpassen?",
      answer: "Ja. Wir liefern vollständige Dokumentation und schulen Ihr Team. Einfache Anpassungen wie Texte oder Zeiten können Sie selbst vornehmen.",
    },
  ],
};

export function AutomatisierungArzt() {
  return <NationalIndustryPage config={config} />;
}
