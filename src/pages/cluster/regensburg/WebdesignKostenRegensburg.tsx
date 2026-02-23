import { ClusterPage } from "@/components/ClusterPage";
import type { ClusterPageConfig } from "@/components/ClusterPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const base = BUSINESS_INFO.website;

const config: ClusterPageConfig = {
  route: "/regensburg/webdesign-kosten",
  city: "Regensburg",
  citySlug: "regensburg",
  cityHub: "/regensburg",
  topic: "Webdesign Kosten",
  seo: {
    title: "Webdesign Kosten Regensburg 2025 – Was kostet eine Website? | Cogniiq",
    description:
      "Webdesign Kosten in Regensburg: Was kostet eine professionelle Website in Regensburg 2025? Preisrahmen, Pakete und Einflussfaktoren – transparent erklärt von Cogniiq.",
    canonical: `${base}/regensburg/webdesign-kosten`,
    keywords:
      "Webdesign Kosten Regensburg, Website erstellen Kosten Regensburg, Homepage Kosten Regensburg, Webdesign Preis Regensburg",
  },
  hero: {
    h1: "Webdesign Kosten in Regensburg – Was kostet eine Website?",
    lead: "Transparente Preisübersicht für professionelles Webdesign in Regensburg. Keine versteckten Kosten, keine Pauschalen – eine ehrliche Einschätzung, was Qualität kostet und warum sie sich lohnt.",
    trustTags: ["Regensburg", "Transparente Preise", "Kein Baukasten", "DSGVO-konform"],
    ctaLabel: "Kostenloses Erstgespräch",
  },
  tldr: {
    heading: "Kurzüberblick: Webdesign Kosten Regensburg",
    items: [
      { label: "Einstieg ab", value: "typisch ab ca. 1.500 €" },
      { label: "Mittelbereich", value: "2.500 € – 5.500 €" },
      { label: "Marktführer-Setup", value: "5.500 € – 12.000 €+" },
      { label: "Projektdauer", value: "1–6 Wochen" },
    ],
  },
  intro: {
    heading: "Was kostet ein professioneller Webauftritt in Regensburg?",
    paragraphs: [
      "Die meisten Webdesign-Projekte in Regensburg liegen zwischen 1.500 € und 8.000 €. Kleinere Websites starten typischerweise ab ca. 1.500 €. Projekte mit erweiterter lokaler SEO-Strategie für Regensburg und die Oberpfalz, Conversion-Texten und Integrationen bewegen sich im Bereich 3.000 € bis 6.000 €.",
      "Der Preis wird durch drei Faktoren bestimmt: Seitenumfang, SEO-Tiefe und technische Integrationen. Gastronomie-Websites mit Speisekarte und Reservierungssystem sind grundlegend andere Projekte als einfache Visitenkarten-Websites für lokale Dienstleister.",
      "Was in jedem Paket enthalten ist: individuelles Design, sauberer Code, Mobile-First, DSGVO-Konformität und On-Page SEO. Das sind keine Extras – das ist Mindeststandard für professionelle Webentwicklung.",
    ],
  },
  painPoints: [
    "Billiganbieter versprechen Websites für 299 € – und liefern Templates ohne SEO-Substanz",
    "Fehlende Vergleichbarkeit von Angeboten ohne klare Leistungsbeschreibungen",
    "Unbekannte Folgekosten für Hosting, Wartung, Updates und Änderungen",
    "Websites, die nach 2 Jahren veralten und einen neuen Relaunch erfordern",
  ],
  pricing: {
    heading: "Preisrahmen: Webdesign in Regensburg",
    rangeText:
      "Die meisten Webdesign-Projekte in Regensburg liegen zwischen 1.500 € und 8.000 €. Folgende Orientierungswerte helfen bei der Einschätzung – das individuelle Angebot hängt vom konkreten Projekt ab.",
    tiers: [
      {
        name: "Website Launch",
        anchor: "ab ca. 1.500 €",
        range: "typisch: 1.500 € – 2.800 €",
        deliverables: [
          "Bis 6 Seiten, individuelles Design",
          "On-Page SEO Grundoptimierung",
          "DSGVO-Seiten inklusive",
          "Mobile-Optimierung",
          "Kontaktformular & Google Maps",
          "Übergabe & Kurzschulung",
        ],
      },
      {
        name: "Website Wachstum",
        anchor: "ab ca. 2.800 €",
        range: "typisch: 2.800 € – 5.500 €",
        deliverables: [
          "Bis 12 Seiten, Conversion-Texte",
          "Lokale SEO-Strategie Regensburg/Oberpfalz",
          "Strukturierte Daten (Schema.org)",
          "Google Analytics 4 & Search Console",
          "Core Web Vitals Optimierung",
          "3 Monate Nachbetreuung",
        ],
      },
      {
        name: "Website Marktführer",
        anchor: "ab ca. 5.500 €",
        range: "typisch: 5.500 € – 12.000 €+",
        deliverables: [
          "Unbegrenzte Seitenstruktur",
          "Dominanz-SEO Regensburg/Oberpfalz",
          "Content-Strategie & Texterstellung",
          "Lokale Backlink-Strategie",
          "KI & Automatisierungs-Integration",
          "Laufende Betreuung & Reporting",
        ],
      },
    ],
  },
  comparison: {
    heading: "Professionell vs. Baukasten: Was der Preis wirklich bedeutet",
    rows: [
      { criterion: "Design", pro: "Individuell nach Marke", con: "Template mit Einschränkungen" },
      { criterion: "SEO", pro: "Lokale Strategie Regensburg, strukturierte Daten", con: "Minimal, kein lokales Setup" },
      { criterion: "Ladezeit", pro: "Unter 2s, Core Web Vitals grün", con: "Oft 4–8s, schlecht bewertet" },
      { criterion: "Erweiterbarkeit", pro: "Skalierbar ohne Relaunch", con: "Schnell an Grenzen" },
      { criterion: "DSGVO", pro: "Vollständig, alle Pflichtseiten", con: "Lückenhaft, Abmahnrisiko" },
      { criterion: "Support", pro: "Persönlicher Ansprechpartner", con: "Ticket-System, Community" },
    ],
  },
  localRelevance: {
    heading: "Webdesign-Kosten in Regensburg im lokalen Kontext",
    paragraphs: [
      "Regensburg wächst – wirtschaftlich und digital. Gastronomie, Tourismus, Dienstleister und ein wachsender Mittelstand bedeuten steigenden Wettbewerb bei lokalen Google-Suchanfragen. Die Investition in professionelles Webdesign zahlt sich aus, wenn sie strategisch aufgebaut ist.",
      "Besonders in der Gastronomie und beim Tourismus ist die ROI-Gleichung klar: Wer bei 'Restaurant Regensburg Altstadt' auf Seite 1 erscheint, gewinnt Gäste, die sonst woanders reservieren. Eine Website-Investition von 2.500 € amortisiert sich in dieser Branche schnell.",
      "Cogniiq bietet auf Wunsch persönliche Termine in Regensburg an. Klare Angebote, nachvollziehbare Leistungsbeschreibungen, keine versteckten Kosten.",
    ],
  },
  faq: [
    {
      question: "Was kostet eine einfache Website in Regensburg?",
      answer: "Einstiegsprojekte starten typisch ab ca. 1.500 €. Preis hängt von Seitenanzahl, Designkomplexität und Funktionen ab.",
    },
    {
      question: "Warum ist professionelles Webdesign teurer als ein Baukasten?",
      answer: "Individuelle Entwicklung liefert bessere Performance, lokales SEO und Erweiterbarkeit. Baukastensysteme stoßen schnell an technische und SEO-Grenzen.",
    },
    {
      question: "Sind Hosting und Domain im Preis enthalten?",
      answer: "Nein, Hosting und Domain sind separate Positionen. Einrichtung ist im Projektpreis enthalten, laufende Kosten ca. 10–20 € / Monat.",
    },
    {
      question: "Was kostet laufende Wartung?",
      answer: "Wartungspakete ab ca. 50–80 € / Monat. Im Paket 'Website Marktführer' inklusive.",
    },
    {
      question: "Gibt es versteckte Kosten?",
      answer: "Nein. Das Angebot enthält alle Positionen. Was nicht drin steht, wird nicht berechnet.",
    },
    {
      question: "Wie lange dauert ein Webdesign-Projekt in Regensburg?",
      answer: "Launch: 7–14 Tage. Wachstum: 3–5 Wochen. Marktführer: 6–10 Wochen.",
    },
    {
      question: "Lohnt sich Webdesign für Gastronomie in Regensburg?",
      answer: "Besonders ja. Touristen und Einheimische googeln, bevor sie ein Restaurant wählen. Wer bei relevanten Suchanfragen sichtbar ist, gewinnt direkt Gäste.",
    },
    {
      question: "Was ist in jedem Paket enthalten?",
      answer: "Individuelles Design, Mobile-Optimierung, On-Page SEO, DSGVO-Seiten, Kontaktformular und Kurzschulung.",
    },
    {
      question: "Kann der Preis nach Projektbeginn steigen?",
      answer: "Nur bei Scope-Erweiterungen – vorab kommuniziert und separat angeboten.",
    },
    {
      question: "Wie erhalte ich ein konkretes Angebot?",
      answer: "Im kostenlosen Erstgespräch – 30–45 Minuten, remote oder vor Ort in Regensburg.",
    },
  ],
  internalLinks: [
    { label: "Webdesign Regensburg", href: "/regensburg/webdesign" },
    { label: "Website erstellen Regensburg", href: "/regensburg/website-erstellen" },
    { label: "Website Relaunch Regensburg", href: "/regensburg/website-relaunch" },
    { label: "Landingpage Regensburg", href: "/regensburg/landingpage" },
    { label: "Lokales SEO Regensburg", href: "/regensburg/lokales-seo" },
    { label: "Referenzen", href: "/referenzen" },
  ],
};

export function WebdesignKostenRegensburg() {
  return <ClusterPage config={config} />;
}
