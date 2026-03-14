import { NationalIndustryPage } from "@/components/NationalIndustryPage";
import type { NationalIndustryPageConfig } from "@/components/NationalIndustryPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const config: NationalIndustryPageConfig = {
  seo: {
    title: "Automatisierung für Restaurants & Gastronomie | Cogniiq",
    description: "Gastronomie-Automatisierung: Reservierungsbestätigungen, No-Show-Reduktion, Bewertungsanfragen und Kassendatenabgleich vollautomatisch. Weniger Verwaltung, mehr Zeit für Ihre Gäste.",
    canonical: `${BUSINESS_INFO.website}/automatisierung-restaurant`,
    keywords: "Automatisierung Restaurant, Gastronomie Automatisierung, Reservierung automatisieren, Gastronomie Digitalisierung",
  },
  h1: "Automatisierung für Restaurants & Gastronomie",
  tagline: "Gastronomie · Reservierungen · No-Show-Reduktion",
  intro: "Der Servicebetrieb läuft, die Küche ist voll – und gleichzeitig müssen Reservierungen bestätigt, Erinnerungen verschickt und No-Shows nachgefasst werden. Jede dieser Aufgaben ist wichtig, aber keine davon sollte manuell erledigt werden. Cogniiq automatisiert die Verwaltungsseite Ihres Restaurants, damit sich Ihr Team auf das konzentriert, wofür es ausgebildet ist: hervorragenden Service.",
  serviceSlug: "leistungen",
  serviceLabel: "Automatisierung Leistungen",
  costLink: "/kosten-automatisierung",
  costLinkLabel: "Automatisierung Kosten",
  problems: [
    {
      title: "Reservierungsbestätigungen laufen manuell – und kosten täglich Zeit",
      description: "Jede Reservierung einzeln bestätigen, Tisch zuweisen, erinnern und bei Bedarf nachfassen: Das bindet in einem mittelgroßen Restaurant täglich ein bis zwei Stunden, die für den Gästeempfang fehlen.",
    },
    {
      title: "No-Shows kosten direkt Umsatz",
      description: "Ein reservierter Tisch, der leer bleibt, weil kein Gast abgesagt hat und kein anderer nachrücken konnte: In einem Restaurant mit 60 Plätzen können das wöchentlich mehrere hundert Euro sein. Automatisierte Erinnerungen mit Bestätigungslink reduzieren No-Shows messbar.",
    },
    {
      title: "Lieferantenkommunikation läuft per Telefon und E-Mail",
      description: "Bestellungen, Lieferbestätigungen, Rechnungskorrekturen – alles manuell. Strukturierte digitale Abläufe mit automatischer Dokumentation sparen täglich wertvolle Zeit.",
    },
    {
      title: "Schichtplanung per WhatsApp und mündlicher Absprache",
      description: "Unstrukturierte Schichteinteilungen führen zu Missverständnissen, Überschneidungen und kurzfristigen Ausfällen. Digitale Schichtplanung mit automatischen Benachrichtigungen schafft Verlässlichkeit.",
    },
    {
      title: "Gäste werden nach dem Besuch nicht kontaktiert",
      description: "Zufriedene Gäste empfehlen weiter – aber nur, wenn man sie aktiv darum bittet. Ein automatischer Follow-up nach dem Besuch mit Bewertungslink erhöht Google-Bewertungen ohne manuellen Aufwand.",
    },
    {
      title: "Kassendaten werden manuell in die Buchhaltung übertragen",
      description: "Tagesumsätze, Mehrwertsteuer, Zahlungsmethoden – manuell übertragen ist fehleranfällig und kostet täglich Zeit. Automatische Synchronisation zwischen Kasse und Buchhaltungssoftware löst das dauerhaft.",
    },
  ],
  solution: {
    headline: "Mehr Gäste. Weniger No-Shows. Null manuelle Verwaltung.",
    text: "Cogniiq automatisiert die Kernprozesse Ihres Restaurants: Reservierungsbestätigungen, Erinnerungen, Bewertungsanfragen, Lieferantenkommunikation und Kassendatenabgleich laufen vollständig automatisch. Ihr Team bedient Gäste – nicht Formulare.",
  },
  benefits: [
    "Automatische Reservierungsbestätigung und Tischzuweisung",
    "Erinnerungs-SMS/-E-Mail reduziert No-Shows um bis zu 40 %",
    "Bewertungsanfrage automatisch nach jedem Besuch",
    "Lieferantenbestellungen strukturiert und automatisch koordiniert",
    "Kassendaten automatisch in Buchhaltungssoftware übertragen",
    "Schichtplanung digital, übersichtlich und nachvollziehbar",
    "DSGVO-konforme Gästedatenverarbeitung",
  ],
  workflow: {
    title: "Vom Tisch bis zur Bewertung – vollautomatisch",
    steps: [
      {
        step: "01",
        title: "Reservierung eingeht",
        description: "Ob telefonisch über den KI-Assistenten oder online – die Reservierung wird sofort erfasst, bestätigt und der richtige Tisch zugewiesen.",
      },
      {
        step: "02",
        title: "Erinnerung & Bestätigung",
        description: "24 Stunden vorher: automatische Erinnerung mit Bestätigungslink. Wer nicht bestätigt, wird erinnert. Freie Plätze bei Absagen gehen automatisch in die Warteliste.",
      },
      {
        step: "03",
        title: "Nachbereitung & Feedback",
        description: "Nach dem Besuch: Dankes-Nachricht, Bewertungsanfrage und optional eine Follow-up-Einladung. Kassendaten laufen automatisch in die Buchhaltung.",
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
      question: "Welche Prozesse lassen sich für Restaurants am schnellsten automatisieren?",
      answer: "Reservierungsbestätigungen, Erinnerungen und Bewertungsanfragen sind die schnellsten Wins – oft in einer Woche live und mit sofort messbarem Effekt. Lieferantenintegration und Kassendatenabgleich dauern länger, haben aber den höchsten dauerhaften ROI.",
    },
    {
      question: "Kann das System mit unserem Kassensystem verbunden werden?",
      answer: "In den meisten Fällen ja. Wir prüfen die Schnittstellen Ihres Kassensystems und entwickeln die passende Integration. Unterstützte Systeme u.a.: Lightspeed, Orderbird, Gastrofix, RKSV-konforme Lösungen. Beim Erstgespräch klären wir die Kompatibilität konkret.",
    },
    {
      question: "Was kostet Gastronomie-Automatisierung?",
      answer: "Einfache Workflows wie Reservierungsbestätigungen und Erinnerungen beginnen bei ca. 500–800 €. Umfassendere Automatisierungen inkl. Lieferantenintegration und Buchhaltungsanbindung typischerweise 1.500–3.500 €. Kleinere Restaurants profitieren besonders – jede eingesparte Stunde zählt.",
    },
    {
      question: "Lohnt sich Automatisierung für ein kleines Restaurant mit 5 Tischen?",
      answer: "Absolut. Gerade kleine Betriebe mit schlankem Personal profitieren am stärksten. Wer sich statt Reservierungsmanagement auf die Küche konzentrieren kann, schafft besseres Erlebnis und geringere Fehlerrate – ohne mehr Personal.",
    },
    {
      question: "Wie lange dauert die Einrichtung?",
      answer: "Einfache Workflows sind in 1–2 Wochen live. Komplexere Integrationen mit Kassen- und Lieferantensystem dauern 3–6 Wochen. Der laufende Betrieb wird dabei nicht unterbrochen.",
    },
  ],
};

export function AutomatisierungRestaurant() {
  return <NationalIndustryPage config={config} />;
}
