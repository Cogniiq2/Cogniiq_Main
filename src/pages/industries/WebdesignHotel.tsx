import { NationalIndustryPage } from "@/components/NationalIndustryPage";
import type { NationalIndustryPageConfig } from "@/components/NationalIndustryPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const config: NationalIndustryPageConfig = {
  seo: {
    title: "Webdesign für Hotels & Pensionen | Direktbuchungen steigern | Cogniiq",
    description: "Webdesign für Hotels: Mehr Direktbuchungen, weniger OTA-Provision. Hotel-Website mit Buchungssystem, Local SEO und professioneller Präsentation für mehr Sichtbarkeit.",
    canonical: `${BUSINESS_INFO.website}/webdesign-hotel`,
    keywords: "Webdesign Hotel, Hotel Website erstellen, Pension Website, Direktbuchungen steigern, Webdesign Hotellerie",
  },
  h1: "Webdesign für Hotels & Pensionen",
  tagline: "Hotellerie · Direktbuchungen · weniger OTA-Provision",
  intro: "Jede Buchung über Booking.com oder Expedia kostet 15–25 % Provision. Eine starke Hotel-Website mit Direktbuchungssystem und guter Google-Sichtbarkeit verschiebt dieses Verhältnis nachhaltig – und steigert die Marge ohne zusätzliche Marketingkosten.",
  serviceSlug: "leistungen",
  serviceLabel: "Webdesign Leistungen",
  costLink: "/kosten-webdesign",
  costLinkLabel: "Webdesign Kosten",
  problems: [
    {
      title: "Zu viele Buchungen laufen über OTAs",
      description: "Booking.com, Expedia und Co. nehmen 15–25 % Provision. Ohne eigene starke Direktbuchungs-Website verlieren Hotels täglich wertvolle Marge.",
    },
    {
      title: "Bei lokalen Hotel-Suchen nicht sichtbar",
      description: "Reisende, die nach 'Hotel [Stadt]' suchen, finden meist OTA-Listings – nicht die Hotelwebsite selbst. Ohne SEO verlieren Sie diese direkten Buchungschancen.",
    },
    {
      title: "Kein Direktbuchungssystem auf der eigenen Website",
      description: "Hotels ohne Direktbuchung schicken Interessenten automatisch zu OTAs. Das kostet Marge, Kundenbindung und die Möglichkeit zur direkten Gästekommunikation.",
    },
    {
      title: "Zimmer nicht optimal präsentiert",
      description: "Unklare Zimmerbeschreibungen, schlechte Fotos und fehlende Ausstattungsdetails kosten Buchungen – besonders im gehobenen Segment.",
    },
    {
      title: "Vertrauen bei Geschäftsreisenden fehlt",
      description: "Businessreisende buchen bevorzugt direkt beim Hotel – wenn die Website Professionalität ausstrahlt und den Buchungsprozess vereinfacht.",
    },
    {
      title: "Saisonale Buchungsspitzen nicht genutzt",
      description: "Messen, Festspiele und Events sind Hochphasen. Hotels ohne SEO-Präsenz für saisonale Suchanfragen verpassen genau diese profitablen Buchungsspitzen.",
    },
  ],
  solution: {
    headline: "Mehr Direktbuchungen durch professionelles Hotel-Webdesign.",
    text: "Cogniiq entwickelt Hotel-Websites mit integriertem Direktbuchungssystem, starker lokaler Sichtbarkeit und überzeugender Zimmerpräsentation. Das Ziel: weniger OTA-Abhängigkeit, mehr Gewinn, stärkere Gästebindung.",
  },
  benefits: [
    "Direktbuchungssystem für maximale Marge",
    "Local SEO: sichtbar bei 'Hotel [Stadt]'",
    "Professionelle Zimmerpräsentation mit Bildgalerie",
    "Automatische Verfügbarkeitsabfrage und Buchungsbestätigung",
    "Mobile-first: optimiert für Smartphone-Buchungen",
    "Google Business Profil Optimierung",
    "DSGVO-konforme Gästedatenverarbeitung",
  ],
  workflow: {
    title: "Hotel-Website mit Direktbuchung – in drei Phasen",
    steps: [
      {
        step: "01",
        title: "Hotelmarke & Design",
        description: "Analyse Ihrer Zielgruppe (Urlauber, Geschäftsreisende, Gruppen) und Design einer Website, die Ihre Atmosphäre und Qualität überzeugend transportiert.",
      },
      {
        step: "02",
        title: "Buchungssystem & SEO",
        description: "Integration des Direktbuchungssystems, Zimmerpräsentation, Local SEO-Setup und Google Business Optimierung für maximale Sichtbarkeit.",
      },
      {
        step: "03",
        title: "Live & wachsen",
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
      answer: "Hotel-Websites mit integriertem Direktbuchungssystem beginnen bei ca. 3.500 €. Je nach Zimmeranzahl, Zusatzleistungen und SEO-Umfang typischerweise 4.000–8.000 €. Genaues Angebot nach kostenlosem Erstgespräch.",
    },
    {
      question: "Welches Buchungssystem empfiehlt Cogniiq?",
      answer: "Wir integrieren verschiedene Buchungssysteme – von einfachen Formularlösungen bis zu vollständigen Channel-Managern. Die Wahl richtet sich nach Ihrer Größe und Ihren Integrationsanforderungen.",
    },
    {
      question: "Kann die Website für Gruppen und Events optimiert werden?",
      answer: "Ja. Hochzeiten, Tagungen und Gruppenanfragen können mit speziellen Formularen, Anfrage-Workflows und automatisierten Angebotsprozessen abgedeckt werden.",
    },
    {
      question: "Wie viel Provision kann durch Direktbuchungen eingespart werden?",
      answer: "OTAs nehmen typischerweise 15–25 % Provision. Eine starke Direktbuchungs-Website amortisiert sich bei einem Hotel mit 20 Zimmern oft innerhalb weniger Monate.",
    },
    {
      question: "Ist die Hotel-Website mobiloptimiert?",
      answer: "Ja. Über 60 % aller Hotel-Buchungen beginnen auf mobilen Geräten. Alle Cogniiq-Websites werden mobile-first entwickelt und sind auf Smartphones vollständig optimiert.",
    },
  ],
};

export function WebdesignHotel() {
  return <NationalIndustryPage config={config} />;
}
