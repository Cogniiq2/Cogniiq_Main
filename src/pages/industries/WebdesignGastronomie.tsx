import { NationalIndustryPage } from "@/components/NationalIndustryPage";
import type { NationalIndustryPageConfig } from "@/components/NationalIndustryPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const config: NationalIndustryPageConfig = {
  seo: {
    title: "Webdesign für Restaurants & Gastronomie | Cogniiq",
    description: "Webdesign für Gastronomie und Restaurants: Speisekarten, Tischreservierung und Local SEO – damit Ihr Restaurant bei Google gefunden wird. Professionelles Website-Design für die Gastronomie.",
    canonical: `${BUSINESS_INFO.website}/webdesign-gastronomie`,
    keywords: "Webdesign Gastronomie, Restaurant Website erstellen, Homepage Restaurant, Website Gastronomie, SEO Restaurant",
  },
  h1: "Webdesign für Restaurants & Gastronomie",
  tagline: "Gastronomie · Webdesign · Reservierung online",
  intro: "Gäste entscheiden sich heute online – sie schauen sich Menü und Atmosphäre an, bevor sie reservieren. Eine professionelle Restaurant-Website mit klarer Speisekarte, Online-Reservierung und guter Google-Sichtbarkeit füllt Ihre Tische. Eine schwache Website schickt Gäste zur Konkurrenz.",
  serviceSlug: "leistungen",
  serviceLabel: "Webdesign Leistungen",
  costLink: "/kosten-webdesign",
  costLinkLabel: "Webdesign Kosten",
  problems: [
    {
      title: "Kein Platz auf der ersten Google-Seite",
      description: "Bei Suchen wie 'Restaurant Bayreuth' erscheinen Betriebe ohne Local SEO nicht auf Seite 1. Neue Gäste finden die Konkurrenz – obwohl Ihre Küche besser ist.",
    },
    {
      title: "Keine Online-Reservierungsmöglichkeit",
      description: "Gäste, die abends reservieren möchten, wenn niemand ans Telefon geht, buchen woanders. Jede nicht mögliche Reservierung ist direkter Umsatzverlust.",
    },
    {
      title: "Website nicht für Smartphones optimiert",
      description: "Über 70 % aller Restaurant-Suchanfragen kommen vom Smartphone. Eine nicht-mobile Website verliert diese Gäste sofort – an Konkurrenten mit besserem mobilen Auftritt.",
    },
    {
      title: "Keine digitale Speisekarte verfügbar",
      description: "Gäste prüfen die Speisekarte online, bevor sie entscheiden. Fehlt sie – oder ist sie veraltet – entscheiden sich viele für ein anderes Restaurant.",
    },
    {
      title: "Saisonale und event-bedingte Sichtbarkeit nicht genutzt",
      description: "Festspielzeit, Weihnachtsmarkt und Feiertage sind Hochphasen. Betriebe ohne SEO-Sichtbarkeit für saisonale Suchen verpassen genau diese Buchungsspitzen.",
    },
    {
      title: "Schwache Außenwirkung kostet Vertrauen",
      description: "Fotos, Bewertungsintegration und professionelle Darstellung entscheiden, ob ein Gast reserviert. Eine veraltete Website kostet Vertrauen noch vor dem ersten Besuch.",
    },
  ],
  solution: {
    headline: "Restaurants, die online überzeugen, sind ausgebucht.",
    text: "Cogniiq entwickelt Restaurant-Websites mit Online-Reservierung, aktueller Speisekarte und Local SEO-Setup – damit Ihre Qualität digital sichtbar wird und neue Gäste direkt reservieren können, ohne anzurufen.",
  },
  benefits: [
    "Automatische Tischreservierung – auch außerhalb der Öffnungszeiten",
    "Lokales SEO-Setup: gefunden bei 'Restaurant [Stadt]'",
    "Mobile-first: perfekt auf jedem Smartphone",
    "Digitale Speisekarte mit einfacher Aktualisierung",
    "Google Business Profil Optimierung",
    "DSGVO-konforme Website mit Datenschutzerklärung",
    "Integration KI-Telefonassistent für Anruf-Reservierungen",
  ],
  workflow: {
    title: "So entsteht Ihre Restaurant-Website",
    steps: [
      {
        step: "01",
        title: "Konzept & Design",
        description: "Wir analysieren Ihre Zielgruppe und Wettbewerbssituation und entwickeln ein Design, das die Atmosphäre und Qualität Ihrer Gastronomie digital transportiert.",
      },
      {
        step: "02",
        title: "Reservierung & SEO",
        description: "Integration des Reservierungssystems, Speisekarten-Setup, Google Business Optimierung und Local SEO für maximale Sichtbarkeit in Ihrer Region.",
      },
      {
        step: "03",
        title: "Live & wachsen",
        description: "Go-Live mit vollständiger Einrichtung, Schulung und optionalem KI-Telefonassistenten für Reservierungsanrufe, die außerhalb der Servicezeiten ankommen.",
      },
    ],
  },
  cityLinks: [
    { label: "Webdesign Gastronomie Bayreuth", href: "/webdesign-gastronomie-bayreuth" },
    { label: "Webdesign Gastronomie München", href: "/webdesign-gastronomie-muenchen" },
    { label: "Webdesign Gastronomie Regensburg", href: "/webdesign-gastronomie-regensburg" },
    { label: "Webdesign Bayern", href: "/bayern" },
    { label: "Webdesign Deutschland", href: "/webdesign-agentur-deutschland" },
  ],
  relatedLinks: [
    { label: "KI Telefonassistent Restaurant", href: "/ki-telefonassistent-restaurant" },
    { label: "Automatisierung Restaurant", href: "/automatisierung-restaurant" },
    { label: "Kosten Webdesign", href: "/kosten-webdesign" },
    { label: "Webdesign Arzt", href: "/webdesign-arzt" },
    { label: "Webdesign Hotel", href: "/webdesign-hotel" },
  ],
  faq: [
    {
      question: "Was kostet eine Restaurant-Website?",
      answer: "Restaurant-Websites starten bei ca. 1.800 € für eine professionelle Präsenz mit Speisekarte und Reservierungsformular. Mit vollständigem Reservierungssystem und erweitertem SEO-Setup typischerweise 3.000–5.000 €.",
    },
    {
      question: "Kann Cogniiq eine Online-Reservierung integrieren?",
      answer: "Ja. Wir integrieren Reservierungssysteme, die sich mit Ihrer Website und optional mit dem KI-Telefonassistenten verbinden. Reservierungen laufen dann automatisch – auch nachts und am Wochenende.",
    },
    {
      question: "Wie wichtig ist Local SEO für Restaurants?",
      answer: "Sehr wichtig. Die meisten Restaurant-Suchen sind lokal ('Restaurant München'). Ohne Local SEO und Google Business Optimierung erscheinen Sie nicht in den relevanten Ergebnissen.",
    },
    {
      question: "Kann die Speisekarte regelmäßig aktualisiert werden?",
      answer: "Ja. Wir richten ein einfaches Content-Management-System ein, über das Sie Speisekarte, Tagesgerichte und Sonderangebote selbst aktualisieren können – ohne technische Kenntnisse.",
    },
    {
      question: "Ist die Website DSGVO-konform?",
      answer: "Ja. Alle Cogniiq-Websites werden mit vollständiger DSGVO-Konformität geliefert: Datenschutzerklärung, Impressum, Cookie-Consent und DSGVO-konforme Formularverarbeitung.",
    },
  ],
};

export function WebdesignGastronomie() {
  return <NationalIndustryPage config={config} />;
}
