import { NationalIndustryPage } from "@/components/NationalIndustryPage";
import type { NationalIndustryPageConfig } from "@/components/NationalIndustryPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const config: NationalIndustryPageConfig = {
  seo: {
    title: "Webdesign für Fitnessstudios, Vereine & Sportanlagen | Cogniiq",
    description: "Webdesign für Sport & Fitness: Kurskalender, Online-Anmeldung und Mitgliederverwaltung. Mehr Mitglieder durch bessere Google-Sichtbarkeit für Fitnessstudios, Sportvereine und Yogastudios.",
    canonical: `${BUSINESS_INFO.website}/webdesign-sport`,
    keywords: "Webdesign Fitnessstudio, Sport Website, Verein Homepage, Webdesign Yoga, Webdesign Sportanlage",
  },
  h1: "Webdesign für Sport, Fitness & Vereine",
  tagline: "Sport · Fitness · Online-Anmeldung",
  intro: "Fitnessstudios, Sportvereine und Yogastudios brauchen eine Website, die Kurse übersichtlich präsentiert, Online-Anmeldungen ermöglicht und bei lokalen Suchanfragen sichtbar ist. Mehr Mitglieder durch besseres digitales Auftreten.",
  serviceSlug: "leistungen",
  serviceLabel: "Webdesign Leistungen",
  costLink: "/kosten-webdesign",
  costLinkLabel: "Webdesign Kosten",
  problems: [
    {
      title: "Neukunden finden das Studio nicht online",
      description: "Wenn jemand nach 'Fitnessstudio [Stadt]' sucht, erscheinen Studios ohne Local SEO nicht. Täglich verlieren sie potenzielle Mitglieder an Konkurrenten mit besserer Online-Präsenz.",
    },
    {
      title: "Kurskalender nicht digital verfügbar",
      description: "Interessenten möchten vor der Anmeldung wissen, welche Kurse wann stattfinden. Ohne digitalen Kurskalender verlieren sie das Interesse.",
    },
    {
      title: "Keine Online-Anmeldung für Kurse",
      description: "Telefonische Kursanmeldungen kosten Zeit und schrecken ab. Online-Anmeldung erhöht die Konversionsrate deutlich.",
    },
    {
      title: "Website spiegelt die Energie und Qualität nicht wider",
      description: "Ein Fitnessstudio mit modernen Geräten und motivierten Trainern verdient eine Website, die diese Energie und Qualität transportiert.",
    },
    {
      title: "Mitgliedschaften und Preise nicht klar kommuniziert",
      description: "Unklare Preisstrukturen und fehlende Mitgliedschaftsoptionen führen zu Abbrüchen vor der Anmeldung.",
    },
    {
      title: "Keine Social Proof und Bewertungen integriert",
      description: "Mitglieder-Bewertungen und Erfolgsgeschichten sind entscheidend für die Entscheidung zur Mitgliedschaft – fehlen sie, entscheiden sich Interessenten gegen den Beitritt.",
    },
  ],
  solution: {
    headline: "Sport-Websites, die mehr Mitglieder gewinnen.",
    text: "Cogniiq entwickelt Sport- und Fitness-Websites mit digitalem Kurskalender, Online-Anmeldung und Local SEO-Setup. Das Ergebnis: mehr qualifizierte Anfragen, weniger telefonischer Aufwand und messbar mehr Neumitglieder.",
  },
  benefits: [
    "Digitaler Kurskalender mit Filterfunktion",
    "Online-Anmeldung für Kurse und Probestunden",
    "Local SEO: gefunden bei 'Fitnessstudio [Stadt]'",
    "Mitgliedschaftsoptionen übersichtlich dargestellt",
    "Trainer-Profile und Social Proof integriert",
    "Mobile-optimiert für Smartphone-Nutzer",
    "DSGVO-konforme Mitgliederdatenverarbeitung",
  ],
  workflow: {
    title: "Sport-Website mit Online-Anmeldung",
    steps: [
      {
        step: "Schritt 1",
        title: "Konzept & Positionierung",
        description: "Analyse Ihrer Zielgruppe (Freizeitaktive, Leistungssportler, Familien) und Design einer Website, die Ihre Stärken kommuniziert.",
      },
      {
        step: "Schritt 2",
        title: "Kurskalender & Anmeldung",
        description: "Entwicklung des digitalen Kurskalenders, Online-Anmeldesystems und Mitgliedschafts-Darstellung mit klaren Konversionspfaden.",
      },
      {
        step: "Schritt 3",
        title: "SEO & Launch",
        description: "Local SEO Setup, Google Business Optimierung und Go-Live mit vollständiger Einrichtung und optionalem KI-Telefonassistenten.",
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
    { label: "Automatisierung Sport", href: "/automatisierung-sport" },
    { label: "KI Telefonassistent", href: "/ki-telefonassistent" },
    { label: "Kosten Webdesign", href: "/kosten-webdesign" },
    { label: "Webdesign Gastronomie", href: "/webdesign-gastronomie" },
    { label: "Webdesign Hotel", href: "/webdesign-hotel" },
  ],
  faq: [
    {
      question: "Was kostet eine Fitness-Website?",
      answer: "Fitness- und Sport-Websites beginnen bei ca. 1.800 €. Mit digitalem Kurskalender und Online-Anmeldung typischerweise 2.500–4.500 €. Genaues Angebot nach kostenlosem Erstgespräch.",
    },
    {
      question: "Kann ein digitaler Kurskalender selbst aktualisiert werden?",
      answer: "Ja. Wir richten ein einfaches Content-Management-System ein, über das Sie Kurse, Zeiten und Trainer selbst pflegen können – ohne technische Kenntnisse.",
    },
    {
      question: "Kann die Website Online-Probestunden buchen?",
      answer: "Ja. Probestunden-Buchungen sind eine der effektivsten Konversionsmaßnahmen für Fitnessstudios. Wir integrieren ein einfaches Buchungsformular mit automatischer Bestätigung.",
    },
    {
      question: "Wie hilft Local SEO Fitnessstudios?",
      answer: "Lokale Suchen wie 'Fitnessstudio München' haben sehr hohe Kaufabsicht. Mit Local SEO und Google Business Optimierung erscheinen Sie prominent in diesen Suchergebnissen.",
    },
    {
      question: "Eignet sich die Lösung auch für gemeinnützige Sportvereine?",
      answer: "Ja. Wir entwickeln Vereins-Websites mit reduzierten Preisen für gemeinnützige Organisationen. Kontakt für individuelle Konditionen.",
    },
  ],
};

export function WebdesignSport() {
  return <NationalIndustryPage config={config} />;
}
