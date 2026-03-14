import { NationalIndustryPage } from "@/components/NationalIndustryPage";
import type { NationalIndustryPageConfig } from "@/components/NationalIndustryPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const config: NationalIndustryPageConfig = {
  seo: {
    title: "Automatisierung für Fitnessstudios & Sportanlagen | Cogniiq",
    description: "Prozessautomatisierung für Fitnessstudios und Sportanlagen: Mitgliederverwaltung, Kursanmeldungen, Zahlungen und Kommunikation vollständig automatisiert.",
    canonical: `${BUSINESS_INFO.website}/automatisierung-sport`,
    keywords: "Automatisierung Fitnessstudio, Sport Digitalisierung, Mitgliederverwaltung automatisieren, Kursanmeldung automatisch",
  },
  h1: "Automatisierung für Fitnessstudios & Sportanlagen",
  tagline: "Sport · Fitness · Mitgliederverwaltung",
  intro: "Fitnessstudios und Sportanlagen verlieren Zeit durch manuelle Kursanmeldungen, Mitgliederkommunikation und Zahlungserinnerungen. Automatisierung rationalisiert diese Prozesse und gibt dem Team Zeit für das Wesentliche: die Mitglieder.",
  serviceSlug: "leistungen",
  serviceLabel: "Automatisierung Leistungen",
  costLink: "/kosten-automatisierung",
  costLinkLabel: "Automatisierung Kosten",
  problems: [
    {
      title: "Kursanmeldungen manuell und zeitaufwändig",
      description: "Anmeldungen per Telefon, E-Mail oder vor Ort zu koordinieren kostet täglich Stunden und ist fehleranfällig. Online-Anmeldung mit automatischer Bestätigung ist der Standard.",
    },
    {
      title: "Mitgliederkommunikation unsystematisch",
      description: "Informationen zu neuen Kursen, Öffnungszeiten und Events werden nicht systematisch kommuniziert. Mitglieder sind schlecht informiert und kündigen schneller.",
    },
    {
      title: "Zahlungsausfälle nicht automatisch verfolgt",
      description: "Manuelle Zahlungserinnerungen sind zeitaufwändig und unangenehm. Automatisierte Mahnprozesse lösen dieses Problem professionell.",
    },
    {
      title: "Neukunden-Onboarding ineffizient",
      description: "Neue Mitglieder manuell einzuführen, Verträge zu versenden und Zugänge einzurichten kostet Stunden. Automatisiertes Onboarding läuft in Minuten.",
    },
    {
      title: "Keine systematische Kündigungsprävention",
      description: "Mitglieder, die länger nicht im Studio waren, kündigen häufiger. Ohne automatische Re-Engagement-Kommunikation gehen diese Mitglieder verloren.",
    },
    {
      title: "Bewertungen und Empfehlungen nicht aktiv angefragt",
      description: "Zufriedene Mitglieder geben keine Bewertungen, wenn man sie nicht bittet. Automatisierte Anfragen nach langen Mitgliedschaften oder positiven Erfahrungen erhöhen Bewertungen.",
    },
  ],
  solution: {
    headline: "Fitness-Prozesse automatisieren – Mitglieder besser betreuen.",
    text: "Cogniiq automatisiert die Kernprozesse von Fitnessstudios: Kursanmeldungen, Mitglieder-Onboarding, Zahlungserinnerungen und Re-Engagement laufen vollautomatisch. Das Team konzentriert sich auf Training und Betreuung.",
  },
  benefits: [
    "Online-Kursanmeldung mit automatischer Bestätigung",
    "Automatisches Mitglieder-Onboarding",
    "Zahlungserinnerungen automatisch versandt",
    "Re-Engagement-Kommunikation für inaktive Mitglieder",
    "Neue Kurs- und Event-Kommunikation automatisch",
    "Bewertungsanfragen nach positiven Erlebnissen",
    "DSGVO-konforme Mitgliederdatenverarbeitung",
  ],
  workflow: {
    title: "Automatisiertes Mitglieder-Management",
    steps: [
      {
        step: "Schritt 1",
        title: "Neues Mitglied",
        description: "Anmeldung online oder vor Ort – automatisches Onboarding, Vertragsversand, Zugangsdaten und Willkommenssequenz starten sofort.",
      },
      {
        step: "Schritt 2",
        title: "Laufende Kommunikation",
        description: "Kurserinnerungen, Neuigkeiten, Geburtstagsnachrichten und Zahlungshinweise laufen vollautomatisch – zur richtigen Zeit, ohne manuelle Arbeit.",
      },
      {
        step: "Schritt 3",
        title: "Retention & Wachstum",
        description: "Inaktive Mitglieder werden automatisch re-engagiert. Zufriedene Mitglieder werden um Bewertungen und Empfehlungen gebeten.",
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
    { label: "Webdesign Sport", href: "/webdesign-sport" },
    { label: "KI Telefonassistent", href: "/ki-telefonassistent" },
    { label: "Kosten Automatisierung", href: "/kosten-automatisierung" },
    { label: "Automatisierung Restaurant", href: "/automatisierung-restaurant" },
    { label: "Automatisierung Arzt", href: "/automatisierung-arzt" },
  ],
  faq: [
    {
      question: "Welche Mitgliederverwaltungssysteme können integriert werden?",
      answer: "Wir integrieren gängige Fitness-Management-Systeme wie Magicline, Eversports, ClubDesk und andere – je nach API-Verfügbarkeit.",
    },
    {
      question: "Kann das System auch für Sportkurse außerhalb von Studios genutzt werden?",
      answer: "Ja. Outdoor-Gruppen, Vereine und Kursanbieter können das System für Online-Anmeldungen und Kommunikation nutzen.",
    },
    {
      question: "Was kostet Automatisierung für ein Fitnessstudio?",
      answer: "Einfache Automatisierungen wie Kursanmeldungen und Erinnerungen beginnen bei ca. 800–1.500 €. Vollständige Mitgliederverwaltungsautomatisierung typischerweise 2.000–4.000 €.",
    },
    {
      question: "Wie hilft Re-Engagement-Automatisierung bei der Kundenbindung?",
      answer: "Mitglieder, die 2–3 Wochen nicht im Studio waren, erhalten automatisch personalisierte Nachrichten. Diese Re-Engagement-Sequenzen reduzieren Kündigungen messbar.",
    },
    {
      question: "Ist die Automatisierung DSGVO-konform für Mitgliederdaten?",
      answer: "Ja. Alle Mitgliederdaten werden DSGVO-konform verarbeitet, mit klarer Einwilligungsdokumentation und auf europäischen Servern.",
    },
  ],
};

export function AutomatisierungSport() {
  return <NationalIndustryPage config={config} />;
}
