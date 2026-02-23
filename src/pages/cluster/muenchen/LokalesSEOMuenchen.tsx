import { ClusterPage } from "@/components/ClusterPage";
import type { ClusterPageConfig } from "@/components/ClusterPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const base = BUSINESS_INFO.website;

const config: ClusterPageConfig = {
  route: "/muenchen/lokales-seo",
  city: "München",
  citySlug: "muenchen",
  cityHub: "/muenchen",
  topic: "Lokales SEO",
  seo: {
    title: "Lokales SEO München – Google-Dominanz für Münchner Unternehmen | Cogniiq",
    description:
      "Lokales SEO in München: Cogniiq optimiert Ihre lokale Sichtbarkeit bei Google für den härtesten Wettbewerbsmarkt Bayerns. Google Business, strukturierte Daten, Map Pack Dominanz.",
    canonical: `${base}/muenchen/lokales-seo`,
    keywords:
      "Lokales SEO München, Local SEO München, Google Business München, SEO Agentur München, lokale Suchmaschinenoptimierung München",
  },
  hero: {
    h1: "Lokales SEO in München – Google-Dominanz im härtesten Markt",
    lead: "München ist der wettbewerbsintensivste lokale Suchmarkt in Bayern. Top-3 im Map Pack zu erreichen erfordert mehr als ein ausgefülltes Google Business Profil – es erfordert eine vollständige lokale SEO-Strategie.",
    trustTags: ["München", "Map Pack", "Google Business", "Strukturierte Daten"],
    ctaLabel: "Kostenloses Erstgespräch",
  },
  tldr: {
    heading: "Kurzüberblick: Lokales SEO in München",
    items: [
      { label: "Für wen", value: "Alle lokalen Unternehmen mit Münchner Zielgruppe" },
      { label: "Ziel", value: "Top-3 Google Maps, erste Seite organisch" },
      { label: "Zeithorizont", value: "Erste Verbesserungen in 6–14 Wochen" },
      { label: "Preisrahmen", value: "ab ca. 1.000 € einmalig oder monatlich" },
    ],
  },
  intro: {
    heading: "Lokales SEO in München: Warum Standard-Maßnahmen nicht reichen",
    paragraphs: [
      "In München reicht ein ausgefülltes Google Business Profil nicht, um im Map Pack zu erscheinen. Die Konkurrenz ist zu stark, das Suchvolumen zu hoch und die Qualitätsschwelle zu hoch. Lokales SEO in München erfordert einen systematischen Ansatz: vollständig optimiertes Google Business Profil, strukturierte Daten auf der Website, konsistente lokale Citations, Bewertungsaufbau und On-Page Optimierung.",
      "Das Google Map Pack – die drei Einträge mit Karte, die bei lokalen Suchanfragen ganz oben erscheinen – erzielt die höchste Klickrate bei lokalen Suchanfragen. Für einen Münchner Betrieb bedeutet Top-3 im Map Pack einen direkten, messbaren Anstieg an Anfragen ohne laufende Werbeausgaben.",
      "Lokales SEO ist in München eine mittelfristige Investition mit langem ROI-Horizont. Einmal aufgebaut, liefert es dauerhaft organische Sichtbarkeit – in einem Markt, wo bezahlte Klicks zu den teuersten in Deutschland gehören.",
    ],
  },
  deliverables: {
    heading: "Was lokales SEO-Setup bei Cogniiq in München umfasst",
    items: [
      "Google Business Profil vollständige Optimierung",
      "NAP-Konsistenz über alle relevanten Verzeichnisse",
      "Lokale Keyword-Recherche München: Suchvolumen, Wettbewerb, Priorität",
      "On-Page Optimierung: Titel, Beschreibungen, lokale Signale",
      "Strukturierte Daten vollständig (LocalBusiness, Service, FAQ, Review)",
      "Google Search Console Einrichtung und Monitoring",
      "Core Web Vitals Optimierung als Rankingfaktor",
      "Lokale Citation-Aufbau und Bereinigung",
      "Bewertungsstrategieentwicklung",
      "Monatliches Ranking-Monitoring und Reporting",
    ],
  },
  localRelevance: {
    heading: "Lokales SEO in der Münchner Wettbewerbsrealität",
    paragraphs: [
      "München hat in praktisch jeder Branche ein hohes lokales Suchvolumen mit starkem Wettbewerb. Das bedeutet: Lokale SEO-Maßnahmen, die in Nürnberg oder Bayreuth schnell auf Seite 1 führen, erfordern in München mehr Tiefe, mehr Autorität und mehr Geduld.",
      "Der Aufwand lohnt sich. Wer in München für 'Unternehmensberater München', 'Physiotherapie München Schwabing' oder 'Catering München' auf Seite 1 erscheint, gewinnt Anfragen mit hohem Wert. Die meisten dieser Suchanfragen haben direkte Kaufabsicht.",
      "Cogniiq definiert für jedes Münchner Projekt eine realistische Strategie basierend auf aktuellen Suchdaten. Kein Versprechen unrealistischer Rankings – sondern ein klarer Plan, welche Sichtbarkeit in welchem Zeitraum erreichbar ist.",
    ],
  },
  faq: [
    {
      question: "Wie wettbewerbsintensiv ist lokales SEO in München?",
      answer: "Sehr. München ist der härteste lokale Suchmarkt in Bayern. Das bedeutet höheren Aufwand – aber auch höheres Potenzial für Unternehmen, die investieren.",
    },
    {
      question: "Wie wichtig ist das Google Business Profil in München?",
      answer: "Es ist Grundvoraussetzung. Ohne vollständig optimiertes Profil ist Map Pack Sichtbarkeit in München praktisch unmöglich.",
    },
    {
      question: "Wie lange dauert es bis zu ersten Rankings in München?",
      answer: "6–14 Wochen für erste messbare Verbesserungen. Stabile Rankings in harten Kategorien: 3–9 Monate.",
    },
    {
      question: "Brauche ich monatliche Betreuung?",
      answer: "Für nachhaltige Ergebnisse in München ja. Der Wettbewerb optimiert laufend – statische SEO-Maßnahmen verlieren an Wirkung.",
    },
    {
      question: "Was kostet lokales SEO in München?",
      answer: "Einmaliges Setup ab ca. 1.000 €. Monatliche Betreuung ab ca. 350 € / Monat.",
    },
    {
      question: "Wie helfen Bewertungen beim lokalen SEO in München?",
      answer: "Bewertungsanzahl und -qualität sind direkte Map Pack Rankingfaktoren. Besonders in München, wo Nutzer Bewertungen aktiv lesen, ist ein gutes Bewertungsprofil entscheidend.",
    },
    {
      question: "Was sind strukturierte Daten und warum sind sie in München wichtig?",
      answer: "Strukturierte Daten helfen Google, Branche und Standort präzise einzuordnen. In München, wo viele Anbieter um dieselben Keywords konkurrieren, können strukturierte Daten den Unterschied bei Rankings ausmachen.",
    },
    {
      question: "Kann lokales SEO ohne Relaunch der Website durchgeführt werden?",
      answer: "Einige Maßnahmen (Google Business, Citations) sind unabhängig. Vollständige On-Page Optimierung erfordert Website-Zugang.",
    },
    {
      question: "Wie konkurrenzfähig ist Cogniiq im Münchner SEO-Markt?",
      answer: "Cogniiq arbeitet datenbasiert: konkrete Keyword-Daten, messbarer Wettbewerbsvergleich, realistische Zielsetzung.",
    },
    {
      question: "Wie starte ich?",
      answer: "Kostenloses Erstgespräch – inkl. erster Analyse Ihrer aktuellen lokalen Sichtbarkeit in München.",
    },
  ],
  internalLinks: [
    { label: "Webdesign München", href: "/muenchen/webdesign" },
    { label: "Website erstellen München", href: "/muenchen/website-erstellen" },
    { label: "Webdesign Kosten München", href: "/muenchen/webdesign-kosten" },
    { label: "Website Relaunch München", href: "/muenchen/website-relaunch" },
    { label: "Landingpage München", href: "/muenchen/landingpage" },
    { label: "Alle Leistungen", href: "/leistungen" },
  ],
};

export function LokalesSEOMuenchen() {
  return <ClusterPage config={config} />;
}
