import { NationalIndustryPage } from "@/components/NationalIndustryPage";
import type { NationalIndustryPageConfig } from "@/components/NationalIndustryPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const config: NationalIndustryPageConfig = {
  seo: {
    title: "Webdesign für Hotels & Pensionen | Direkte Buchungen steigern | Cogniiq",
    description: "Webdesign für Hotels: Mehr Direktbuchungen, weniger Provision durch OTAs. Hotel-Website mit Buchungssystem, Local SEO und professioneller Präsentation für mehr Sichtbarkeit.",
    canonical: `${BUSINESS_INFO.website}/webdesign-hotel`,
    keywords: "Webdesign Hotel, Hotel Website erstellen, Pension Website, Direktbuchungen steigern, Webdesign Hotellerie",
  },
  h1: "Webdesign für Hotels & Pensionen",
  tagline: "Hotellerie · Direktbuchungen · Local SEO",
  intro: "Jede Direktbuchung spart 15–25 % OTA-Provision. Eine professionelle Hotel-Website mit Direktbuchungssystem und starker Google-Sichtbarkeit macht den Unterschied zwischen Provision und Gewinn.",
  serviceSlug: "leistungen",
  serviceLabel: "Webdesign Leistungen",
  costLink: "/kosten-webdesign",
  costLinkLabel: "Webdesign Kosten",
  problems: [
    {
      title: "Zu viele Buchungen über OTAs",
      description: "Booking.com, Expedia und Co. nehmen 15–25 % Provision. Ohne starke Direktbuchungs-Website verlieren Hotels täglich Marge.",
    },
    {
      title: "Nicht gefunden bei lokalen Hotel-Suchen",
      description: "Reisende, die nach 'Hotel [Stadt]' suchen, finden meist OTAs – nicht die Hotelwebsite selbst. Ohne SEO verlieren Sie diese direkten Buchungen.",
    },
    {
      title: "Veraltete Website ohne Direktbuchungssystem",
      description: "Hotels ohne Direktbuchungsmöglichkeit schicken Gäste automatisch zu OTAs. Das kostet Marge und Kundenbindung.",
    },
    {
      title: "Zimmer nicht optimal präsentiert",
      description: "Schlechte Fotos, unklare Zimmertypen und fehlende Ausstattungsinformationen kosten Buchungen – besonders bei einem Premium-Segment.",
    },
    {
      title: "Kein Vertrauensaufbau bei Geschäftsreisenden",
      description: "Businessreisende buchen bevorzugt direkt beim Hotel – wenn die Website Vertrauen aufbaut und den Buchungsprozess vereinfacht.",
    },
    {
      title: "Saisonale Sichtbarkeit nicht genutzt",
      description: "Messen, Festspiele und Events sind Hochphasen. Hotels ohne SEO-Präsenz für saisonale Suchanfragen verpassen diese Buchungsspitzen.",
    },
  ],
  solution: {
    headline: "Mehr Direktbuchungen durch professionelles Hotel-Webdesign.",
    text: "Cogniiq entwickelt Hotel-Websites mit integriertem Direktbuchungssystem, starker lokaler SEO-Sichtbarkeit und professioneller Zimmerpräsentation. Das Ziel: weniger OTA-Abhängigkeit, mehr Gewinn.",
  },
  benefits: [
    "Direktbuchungssystem für maximale Marge",
    "Local SEO: sichtbar bei 'Hotel [Stadt]'",
    "Professionelle Zimmerpräsentation mit Bildgalerie",
    "Automatische Verfügbarkeitsabfrage und Buchungsbestätigung",
    "Mobile-optimiert für Smartphone-Buchungen",
    "Google Business Profil Optimierung",
    "DSGVO-konforme Gästedatenverarbeitung",
  ],
  workflow: {
    title: "Hotel-Website mit Direktbuchung in 3 Schritten",
    steps: [
      {
        step: "Schritt 1",
        title: "Hotelmarke & Design",
        description: "Analyse Ihrer Zielgruppe (Urlauber, Geschäftsreisende, Gruppen) und Design einer Website, die Ihre Atmosphäre und Qualität digital transportiert.",
      },
      {
        step: "Schritt 2",
        title: "Buchungssystem & SEO",
        description: "Integration eines Direktbuchungssystems, Zimmerpräsentation mit Filter, Local SEO Setup und Google Business Optimierung für maximale Sichtbarkeit.",
      },
      {
        step: "Schritt 3",
        title: "Live & Direktbuchungen",
        description: "Go-Live mit vollständiger Einrichtung. Optionaler KI-Telefonassistent für telefonische Buchungen außerhalb der Rezeptionszeiten.",
      },
    ],
  },
  cityLinks: [
    { label: "Webdesign Bayreuth", href: "/bayreuth/webdesign" },
    { label: "Webdesign München", href: "/muenchen/webdesign" },
    { label: "Webdesign Regensburg", href: "/regensburg/webdesign" },
    { label: "Webdesign Bayern", href: "/bayern" },
    { label: "Webdesign Deutschland", href: "/webdesign-agentur-deutschland" },
  ],
  relatedLinks: [
    { label: "KI Telefonassistent Hotel", href: "/ki-telefonassistent-hotel" },
    { label: "Webdesign Gastronomie", href: "/webdesign-gastronomie" },
    { label: "Kosten Webdesign", href: "/kosten-webdesign" },
    { label: "Webdesign Immobilien", href: "/webdesign-immobilien" },
    { label: "Webdesign Sport", href: "/webdesign-sport" },
  ],
  faq: [
    {
      question: "Was kostet eine Hotel-Website mit Buchungssystem?",
      answer: "Hotel-Websites mit integriertem Direktbuchungssystem beginnen bei ca. 3.500 €. Je nach Zimmeranzahl, Zusatzleistungen und SEO-Umfang typischerweise 4.000–8.000 €.",
    },
    {
      question: "Welches Buchungssystem empfiehlt Cogniiq?",
      answer: "Wir integrieren verschiedene Buchungssysteme – von einfachen Formularlösungen bis zu vollständigen Channel-Managern. Die Wahl hängt von Ihrer Größe und Ihren Anforderungen ab.",
    },
    {
      question: "Kann die Hotel-Website auch für Gruppen und Events optimiert werden?",
      answer: "Ja. Hochzeiten, Tagungen und Gruppenanfragen können mit speziellen Formularen, Anfrage-Workflows und automatisierten Angeboten abgedeckt werden.",
    },
    {
      question: "Wie viel Provision kann durch Direktbuchungen gespart werden?",
      answer: "OTAs nehmen typischerweise 15–25 % Provision. Eine starke Direktbuchungs-Website amortisiert sich bei einem Hotel mit 20 Zimmern oft innerhalb von 1–3 Monaten.",
    },
    {
      question: "Ist die Hotel-Website mobiloptimiert?",
      answer: "Ja. Über 60 % aller Hotel-Buchungen starten auf mobilen Geräten. Alle Cogniiq-Websites sind mobile-first entwickelt und auf Smartphones perfekt optimiert.",
    },
  ],
};

export function WebdesignHotel() {
  return <NationalIndustryPage config={config} />;
}
