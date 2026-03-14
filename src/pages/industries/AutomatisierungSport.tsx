import { NationalIndustryPage } from "@/components/NationalIndustryPage";
import type { NationalIndustryPageConfig } from "@/components/NationalIndustryPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const config: NationalIndustryPageConfig = {
  seo: {
    title: "Automatisierung für Fitnessstudios & Sportanlagen | Cogniiq",
    description: "Fitness-Automatisierung: Kursanmeldungen, Mitglieder-Onboarding, Zahlungserinnerungen und Re-Engagement vollautomatisch. Mehr Mitglieder, weniger Verwaltung – für Fitnessstudios, Yogastudios und Sportvereine.",
    canonical: `${BUSINESS_INFO.website}/automatisierung-sport`,
    keywords: "Automatisierung Fitnessstudio, Sport Digitalisierung, Mitgliederverwaltung automatisieren, Kursanmeldung automatisch",
  },
  h1: "Automatisierung für Fitnessstudios & Sportanlagen",
  tagline: "Fitness · Mitgliederverwaltung · Kündigungsprävention",
  intro: "Neue Mitglieder anmelden, Kurse koordinieren, Zahlungsausfälle nachfassen, inaktive Mitglieder reaktivieren – das alles gehört zum Alltag eines Fitnessstudios. Und fast nichts davon muss manuell erledigt werden. Cogniiq automatisiert die Verwaltungsprozesse Ihrer Anlage vollständig, damit Ihre Trainer trainieren und Ihr Team sich auf Mitglieder konzentrieren kann.",
  serviceSlug: "leistungen",
  serviceLabel: "Automatisierung Leistungen",
  costLink: "/kosten-automatisierung",
  costLinkLabel: "Automatisierung Kosten",
  problems: [
    {
      title: "Kursanmeldungen laufen per Telefon und E-Mail",
      description: "Anmeldungen manuell koordinieren, Kurskapazitäten im Blick behalten und Bestätigungen verschicken – bei mehreren Kursen täglich summiert sich das schnell auf Stunden pro Woche.",
    },
    {
      title: "Neue Mitglieder werden nicht systematisch eingeführt",
      description: "Wer als neues Mitglied kein strukturiertes Onboarding erlebt, kommt nach dem ersten Besuch oft nicht wieder. Automatisiertes Onboarding mit Willkommenssequenz, Trainingshinweisen und erstem Buchungsangebot erhöht die Bindung messbar.",
    },
    {
      title: "Zahlungsausfälle werden spät oder gar nicht bearbeitet",
      description: "SEPA-Rückläufer und ausstehende Beiträge manuell nachzuverfolgen kostet Zeit und ist unangenehm. Automatisierte Zahlungserinnerungen lösen das professionell und ohne persönliche Konfrontation.",
    },
    {
      title: "Inaktive Mitglieder kündigen still",
      description: "Mitglieder, die drei Wochen nicht mehr kommen, kündigen innerhalb der nächsten zwei Monate mit hoher Wahrscheinlichkeit. Automatisiertes Re-Engagement – zur richtigen Zeit, mit dem richtigen Anreiz – hält sie.",
    },
    {
      title: "Mitgliederkommunikation ist unsystematisch und lückenhaft",
      description: "Neuigkeiten, Kursänderungen, Events und Angebote erreichen Mitglieder nicht zuverlässig. Automatisierte Kommunikationssequenzen stellen sicher, dass jedes Mitglied zur richtigen Zeit informiert wird.",
    },
    {
      title: "Bewertungen und Empfehlungen werden nicht aktiv angefragt",
      description: "Die meisten zufriedenen Mitglieder empfehlen das Studio nicht aktiv und hinterlassen keine Bewertung – solange man sie nicht darum bittet. Automatisierte Anfragen nach positiven Erlebnissen erhöhen Bewertungsrate und Weiterempfehlungen.",
    },
  ],
  solution: {
    headline: "Mitglieder gewinnen, halten und begeistern – vollautomatisch.",
    text: "Cogniiq automatisiert die Kern-Workflows Ihres Studios: Kursanmeldung, Mitglieder-Onboarding, Zahlungsverfolgung, Re-Engagement und Bewertungsanfragen laufen ohne manuellen Aufwand. Das Ergebnis: weniger Verwaltung, mehr Mitgliederzufriedenheit und geringere Kündigungsrate.",
  },
  benefits: [
    "Online-Kursanmeldung mit automatischer Bestätigung und Warteliste",
    "Automatisches Onboarding für neue Mitglieder",
    "Zahlungserinnerungen und Mahnprozess vollautomatisch",
    "Re-Engagement-Sequenz für inaktive Mitglieder",
    "Kurs- und Event-Kommunikation automatisch an alle Mitglieder",
    "Bewertungsanfragen nach positiven Erlebnissen",
    "DSGVO-konforme Mitgliederdatenverarbeitung auf deutschen Servern",
  ],
  workflow: {
    title: "So funktioniert automatisiertes Mitglieder-Management",
    steps: [
      {
        step: "01",
        title: "Neues Mitglied",
        description: "Anmeldung online oder vor Ort – automatisches Onboarding, Vertragsversand, Zugangsdaten und Willkommenssequenz starten sofort, ohne manuellen Eingriff.",
      },
      {
        step: "02",
        title: "Aktive Betreuung",
        description: "Kurserinnerungen, Neuigkeiten, Angebote, Geburtstagsnachrichten und Zahlungshinweise werden zur richtigen Zeit automatisch versendet.",
      },
      {
        step: "03",
        title: "Retention & Wachstum",
        description: "Inaktive Mitglieder erhalten automatisch Re-Engagement-Nachrichten. Zufriedene Mitglieder werden um Bewertungen und Empfehlungen gebeten – zur optimalen Zeit.",
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
      answer: "Wir integrieren gängige Fitness-Management-Systeme direkt: Magicline, Eversports, ClubDesk, PerfectGym u.v.m. Wo keine direkte API besteht, entwickeln wir Übergabepunkte. Beim Erstgespräch klären wir die Kompatibilität Ihrer bestehenden Software.",
    },
    {
      question: "Kann das System auch für Vereine und Outdoor-Kurse genutzt werden?",
      answer: "Ja. Sportvereine, Outdoor-Gruppen und Kursanbieter ohne feste Infrastruktur profitieren genauso – die Automatisierungen sind nicht an eine bestimmte Software gebunden und lassen sich flexibel aufsetzen.",
    },
    {
      question: "Was kostet Automatisierung für ein Fitnessstudio?",
      answer: "Einzelne Workflows wie Kursanmeldungen und Erinnerungen beginnen bei ca. 800–1.500 €. Vollständige Mitgliederverwaltungsautomatisierung mit Re-Engagement, Zahlungsverfolgung und Onboarding typischerweise 2.000–4.000 €. Genaues Angebot nach kostenlosem Erstgespräch.",
    },
    {
      question: "Wie hilft Re-Engagement-Automatisierung konkret bei der Mitgliederbindung?",
      answer: "Mitglieder, die 2–3 Wochen nicht eingecheckt haben, erhalten eine automatische, persönliche Nachricht – mit einem konkreten Angebot oder einer Einladung. Diese Sequenzen reduzieren Kündigungen nachweisbar, weil sie zum richtigen Zeitpunkt und ohne manuellen Aufwand greifen.",
    },
    {
      question: "Ist die Verarbeitung von Mitgliederdaten DSGVO-konform?",
      answer: "Ja. Alle Mitgliederdaten werden DSGVO-konform verarbeitet: auf deutschen bzw. europäischen Servern, mit klarer Einwilligungsdokumentation und Auftragsverarbeitungsvertrag (AVV). Die Datenschutzerklärung Ihrer Website wird entsprechend angepasst.",
    },
  ],
};

export function AutomatisierungSport() {
  return <NationalIndustryPage config={config} />;
}
