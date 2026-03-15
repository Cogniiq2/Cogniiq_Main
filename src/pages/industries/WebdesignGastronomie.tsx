import { NationalIndustryPage } from "@/components/NationalIndustryPage";
import type { NationalIndustryPageConfig } from "@/components/NationalIndustryPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const config: NationalIndustryPageConfig = {
  seo: {
    title: "Webdesign für Restaurants & Gastronomie | Cogniiq",
    description: "Webdesign für Restaurants: Online-Reservierung, digitale Speisekarte und Local SEO – damit Ihr Restaurant bei 'Restaurant [Stadt]' auf Seite 1 erscheint und Gäste direkt reservieren.",
    canonical: `${BUSINESS_INFO.website}/webdesign-gastronomie`,
    keywords: "Webdesign Gastronomie, Restaurant Website erstellen, Homepage Restaurant, Website Gastronomie, SEO Restaurant",
  },
  h1: "Webdesign für Restaurants & Gastronomie",
  tagline: "Gastronomie · Online-Reservierung · Local SEO",
  intro: "Noch bevor ein Gast reserviert, hat er Ihr Restaurant auf dem Smartphone bewertet: Speisekarte angeschaut, Fotos überflogen, Bewertungen gelesen. Restaurants ohne professionelle Website – oder mit einer, die mobil nicht funktioniert – scheiden in diesem Moment aus. Die Entscheidung fällt leise und bevor das Telefon klingelt.",
  serviceSlug: "leistungen",
  serviceLabel: "Webdesign Leistungen",
  costLink: "/kosten-webdesign",
  costLinkLabel: "Webdesign Kosten",
  problems: [
    {
      title: "Bei Google nicht auf Seite 1 – trotz guter Qualität",
      description: "Bei 'Restaurant Bayreuth' oder 'Italiener München Altstadt' erscheinen Betriebe ohne Local SEO nicht. Das ist kein Sichtbarkeitsproblem – es ist ein strukturelles Problem, das lösbar ist.",
    },
    {
      title: "Keine Online-Reservierung – Gäste buchen woanders",
      description: "Abends reservieren, wenn niemand ans Telefon geht: Das ist der häufigste Reservierungsmoment. Fehlt Online-Buchung, entscheidet sich der Gast für das Restaurant drei Suchergebnisse weiter oben.",
    },
    {
      title: "Mobile Website schreckt ab, statt einzuladen",
      description: "Über 70 % der Restaurant-Suchanfragen kommen vom Smartphone. Wenn die Speisekarte nicht lädt, der Text zu klein ist oder das Reservierungsformular nicht funktioniert, ist der Gast weg – in Sekunden.",
    },
    {
      title: "Speisekarte veraltet oder gar nicht digital verfügbar",
      description: "Die Speisekarte ist oft der erste Klick auf einer Restaurant-Website. Ist sie veraltet, schwer lesbar oder fehlt ganz, bricht der Besucher ab – bevor er auch nur die Reservierungsfunktion gesehen hat.",
    },
    {
      title: "Saison- und Event-Sichtbarkeit nicht genutzt",
      description: "In der Festspielzeit, zu Feiertagen und Weihnachten steigt die Suchnachfrage nach Restaurants massiv. Betriebe ohne saisonale SEO-Sichtbarkeit verpassen genau diese umsatzstarken Phasen.",
    },
    {
      title: "Kein Social Proof sichtbar – Vertrauen entsteht nicht",
      description: "Google-Bewertungen, Fotos der Gerichte, persönliche Atmosphäre: Das entscheidet, ob jemand reserviert. Fehlt diese Dimension auf der Website, gewinnt das Restaurant nebenan.",
    },
  ],
  solution: {
    headline: "Restaurants, die online überzeugen, haben volle Tische.",
    text: "Cogniiq entwickelt Restaurant-Websites mit Online-Reservierung, aktueller Speisekarte und Local SEO-Setup – sodass Ihre Qualität digital sichtbar wird und Gäste direkt buchen, wann immer sie den Impuls haben.",
  },
  benefits: [
    "Online-Reservierung rund um die Uhr – auch abends und am Wochenende",
    "Local SEO: sichtbar bei 'Restaurant [Stadt]' und verwandten Suchen",
    "Mobile-first: perfekte Darstellung auf jedem Smartphone",
    "Digitale Speisekarte mit einfacher Eigenaktualisierung",
    "Google Business Profil eingerichtet und optimiert",
    "Bewertungen und Atmosphäre-Fotos professionell eingebunden",
    "DSGVO-konforme Website mit vollständiger Datenschutzdokumentation",
  ],
  workflow: {
    title: "So entsteht Ihre Restaurant-Website",
    steps: [
      {
        step: "01",
        title: "Konzept & Design",
        description: "Analyse Ihrer Zielgruppe, der lokalen Wettbewerbssituation und der wichtigsten Buchungsmomente. Design, das die Atmosphäre Ihrer Gastronomie digital transportiert.",
      },
      {
        step: "02",
        title: "Speisekarte, Reservierung & SEO",
        description: "Integration des Reservierungssystems, Speisekarten-Setup mit einfacher Pflege, Google Business Optimierung und Local SEO für maximale regionale Sichtbarkeit.",
      },
      {
        step: "03",
        title: "Live schalten & Gäste gewinnen",
        description: "Go-live mit vollständiger Einrichtung, Schulung für eigenständige Inhaltspflege und optionalem KI-Telefonassistenten für Reservierungsanrufe außerhalb der Servicezeiten.",
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
      question: "Was kostet eine Restaurant-Website mit Online-Reservierung?",
      answer: "Restaurant-Websites mit professionellem Design und Reservierungsformular starten bei ca. 1.800 €. Mit vollständigem Reservierungssystem, Speisekarten-CMS und Local SEO-Setup typischerweise 3.000–5.000 €. Genaues Angebot nach kostenlosem Erstgespräch.",
    },
    {
      question: "Welche Reservierungssysteme integriert Cogniiq?",
      answer: "Wir integrieren OpenTable, ResDiary, Resmio und andere gängige Systeme. Auf Wunsch auch in Kombination mit dem KI-Telefonassistenten, sodass auch telefonische Reservierungen vollautomatisch laufen – 24 Stunden, 7 Tage.",
    },
    {
      question: "Kann ich die Speisekarte selbst aktualisieren?",
      answer: "Ja. Wir richten ein einfaches CMS ein, über das Sie Speisekarte, Tagesgerichte, Saisonkarte und Sonderangebote selbst pflegen – ohne technische Kenntnisse und ohne auf unsere Unterstützung warten zu müssen.",
    },
    {
      question: "Wie wichtig ist Local SEO für ein Restaurant wirklich?",
      answer: "Sehr wichtig – und oft unterschätzt. Die meisten Restaurant-Besuche beginnen mit einer lokalen Google-Suche. Mit Local SEO und Google Business Optimierung erscheinen Sie bei diesen Suchen prominent, statt hinter Aggregatoren und Konkurrenten zu verschwinden.",
    },
    {
      question: "Ist die Website DSGVO-konform?",
      answer: "Ja. Alle Cogniiq-Websites werden mit vollständiger DSGVO-Dokumentation geliefert: Datenschutzerklärung, Impressum, Cookie-Consent und DSGVO-konforme Formularverarbeitung. Auch Reservierungstools werden datenschutzkonform eingebunden.",
    },
  ],
};

export function WebdesignGastronomie() {
  return <NationalIndustryPage config={config} />;
}
