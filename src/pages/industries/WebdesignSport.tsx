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
  intro: "Wer ein Fitnessstudio oder Yogastudio sucht, googelt zuerst. Ohne professionelle Website mit klarem Kursangebot, Online-Anmeldung und guter lokaler Sichtbarkeit entscheiden sich Interessenten für die Konkurrenz – noch bevor sie Ihre Türschwelle betreten haben.",
  serviceSlug: "leistungen",
  serviceLabel: "Webdesign Leistungen",
  costLink: "/kosten-webdesign",
  costLinkLabel: "Webdesign Kosten",
  problems: [
    {
      title: "Neukunden finden das Studio bei Google nicht",
      description: "Bei Suchen nach 'Fitnessstudio [Stadt]' erscheinen Studios ohne Local SEO nicht auf Seite 1. Täglich verlieren sie potenzielle Mitglieder an Konkurrenten mit besserer Online-Präsenz.",
    },
    {
      title: "Kurskalender nicht digital verfügbar",
      description: "Interessenten möchten vor der Anmeldung wissen, welche Kurse wann stattfinden. Fehlt der digitale Kurskalender, springen viele ab.",
    },
    {
      title: "Keine Online-Anmeldung für Kurse",
      description: "Telefonische Kursanmeldungen schrecken ab und kosten Personalzeit. Online-Anmeldung erhöht die Konversionsrate und reduziert Verwaltungsaufwand.",
    },
    {
      title: "Website transportiert Energie und Qualität nicht",
      description: "Ein modernes Fitnessstudio mit qualifizierten Trainern verdient eine Website, die genau diese Energie und Qualität digital vermittelt.",
    },
    {
      title: "Mitgliedschaften und Preise unklar kommuniziert",
      description: "Unklare Preisstrukturen und fehlende Mitgliedschaftsoptionen führen zu Abbrüchen vor der Anmeldung – potenzielle Mitglieder wechseln zum nächsten Anbieter.",
    },
    {
      title: "Fehlende Bewertungen und Social Proof",
      description: "Mitglieder-Erfolgsgeschichten und Bewertungen sind entscheidend für die Mitgliedschaftsentscheidung. Fehlen sie, entscheiden sich Interessenten gegen den Beitritt.",
    },
  ],
  solution: {
    headline: "Sport-Websites, die mehr Mitglieder gewinnen.",
    text: "Cogniiq entwickelt Sport- und Fitness-Websites mit digitalem Kurskalender, Online-Anmeldung und Local SEO-Setup. Das Ergebnis: mehr qualifizierte Anfragen, weniger telefonischer Aufwand und messbar mehr Neumitglieder.",
  },
  benefits: [
    "Digitaler Kurskalender mit Filter- und Buchungsfunktion",
    "Online-Anmeldung für Kurse und Probestunden",
    "Local SEO: gefunden bei 'Fitnessstudio [Stadt]'",
    "Mitgliedschaftsoptionen übersichtlich und überzeugend dargestellt",
    "Trainer-Profile und Social Proof integriert",
    "Mobile-first: optimiert für Smartphone-Nutzer",
    "DSGVO-konforme Mitgliederdatenverarbeitung",
  ],
  workflow: {
    title: "So entsteht Ihre Sport-Website",
    steps: [
      {
        step: "01",
        title: "Konzept & Positionierung",
        description: "Analyse Ihrer Zielgruppe und Stärken. Design einer Website, die die Energie, Qualität und Atmosphäre Ihres Studios digital transportiert.",
      },
      {
        step: "02",
        title: "Kurskalender & Anmeldung",
        description: "Digitaler Kurskalender, Online-Anmeldesystem und Mitgliedschaftsdarstellung mit klaren Konversionspfaden zur Probestunden-Buchung.",
      },
      {
        step: "03",
        title: "SEO & Launch",
        description: "Local SEO-Setup, Google Business Optimierung und Go-Live mit vollständiger Einrichtung und optionalem KI-Telefonassistenten.",
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
      question: "Kann die Website Probestunden-Buchungen ermöglichen?",
      answer: "Ja. Probestunden-Buchungen sind eine der wirksamsten Konversionsmaßnahmen für Fitnessstudios. Wir integrieren ein einfaches Buchungsformular mit automatischer Bestätigung.",
    },
    {
      question: "Wie hilft Local SEO Fitnessstudios?",
      answer: "Lokale Suchen wie 'Fitnessstudio München' haben sehr hohe Kaufabsicht. Mit Local SEO und Google Business Optimierung erscheinen Sie prominent in diesen Suchergebnissen.",
    },
    {
      question: "Eignet sich die Lösung auch für gemeinnützige Sportvereine?",
      answer: "Ja. Wir entwickeln Vereins-Websites mit angepassten Konditionen für gemeinnützige Organisationen. Sprechen Sie uns für ein individuelles Angebot an.",
    },
  ],
};

export function WebdesignSport() {
  return <NationalIndustryPage config={config} />;
}
