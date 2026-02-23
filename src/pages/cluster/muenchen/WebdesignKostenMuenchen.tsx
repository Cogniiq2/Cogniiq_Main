import { ClusterPage } from "@/components/ClusterPage";
import type { ClusterPageConfig } from "@/components/ClusterPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const base = BUSINESS_INFO.website;

const config: ClusterPageConfig = {
  route: "/muenchen/webdesign-kosten",
  city: "München",
  citySlug: "muenchen",
  cityHub: "/muenchen",
  topic: "Webdesign Kosten",
  seo: {
    title: "Webdesign Kosten München 2025 – Was kostet eine Website? | Cogniiq",
    description:
      "Webdesign Kosten in München: Was kostet eine professionelle Website in München 2025? Preisrahmen, Pakete und Einflussfaktoren – transparent erklärt. Premium-Webdesign für den Münchner Markt.",
    canonical: `${base}/muenchen/webdesign-kosten`,
    keywords:
      "Webdesign Kosten München, Website erstellen Kosten München, Homepage Kosten München, Webdesign Preis München, Website Preis München",
  },
  hero: {
    h1: "Webdesign Kosten in München – Was kostet eine Website?",
    lead: "Transparente Preisübersicht für professionelles Webdesign in München. München ist der kompetitivste digitale Markt Bayerns – die Investition in Qualität ist hier keine Option, sondern Voraussetzung.",
    trustTags: ["München", "Premium-Qualität", "Transparente Preise", "DSGVO-konform"],
    ctaLabel: "Kostenloses Erstgespräch",
  },
  tldr: {
    heading: "Kurzüberblick: Webdesign Kosten München",
    items: [
      { label: "Einstieg ab", value: "typisch ab ca. 1.500 €" },
      { label: "Mittelbereich", value: "3.000 € – 7.000 €" },
      { label: "Marktführer-Setup", value: "7.000 € – 15.000 €+" },
      { label: "Projektdauer", value: "1–8 Wochen" },
    ],
  },
  intro: {
    heading: "Was kostet professionelles Webdesign in München?",
    paragraphs: [
      "Die meisten Webdesign-Projekte in München liegen zwischen 1.500 € und 10.000 €. Kleinere Websites starten typischerweise ab ca. 1.500 €. Wer im Münchner Markt – mit seinen höheren Wettbewerbsstandards und anspruchsvolleren Zielgruppen – nachhaltig sichtbar sein will, investiert typisch in den Bereich von 3.000 € bis 7.000 €.",
      "München unterscheidet sich von anderen Städten: Die Zielgruppe ist digital versierter, der Wettbewerb dichter, die Erwartungen an Qualität höher. Eine Website, die in einer Kleinstadt ausreicht, verliert im Münchner Markt sofort gegenüber besser aufgestellten Wettbewerbern.",
      "In jedem Paket enthalten: individuelles Design, sauberer Code, Mobile-First, DSGVO-Konformität und On-Page SEO. Der Unterschied zwischen den Paketen liegt in SEO-Tiefe, Content-Umfang und laufender Betreuung.",
    ],
  },
  painPoints: [
    "Günstiger Anbieter aus München liefert Template-Website ohne lokale SEO-Substanz",
    "Angebote ohne klare Leistungsbeschreibung machen Preisvergleiche unmöglich",
    "Fehlende Skalierbarkeit: Website entspricht in 2 Jahren nicht mehr dem Münchner Standard",
    "Zu hohe monatliche Agenturkosten ohne messbaren SEO-Fortschritt",
  ],
  pricing: {
    heading: "Preisrahmen: Webdesign in München",
    rangeText:
      "Die meisten professionellen Webdesign-Projekte in München liegen zwischen 1.500 € und 12.000 €. Im Münchner Premium-Segment – wo Zielgruppen höhere Standards erwarten – lohnt die Investition in die oberen Pakete besonders.",
    tiers: [
      {
        name: "Website Launch",
        anchor: "ab ca. 1.500 €",
        range: "typisch: 1.500 € – 3.000 €",
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
        anchor: "ab ca. 3.000 €",
        range: "typisch: 3.000 € – 6.500 €",
        deliverables: [
          "Bis 12 Seiten, Conversion-Texte",
          "Lokale SEO-Strategie München",
          "Strukturierte Daten (Schema.org)",
          "Google Analytics 4 & Search Console",
          "Core Web Vitals Optimierung",
          "3 Monate Nachbetreuung",
        ],
      },
      {
        name: "Website Marktführer",
        anchor: "ab ca. 6.500 €",
        range: "typisch: 6.500 € – 15.000 €+",
        deliverables: [
          "Unbegrenzte Seitenstruktur",
          "Dominanz-SEO München",
          "Content-Strategie & Texterstellung",
          "Backlink-Strategie lokal München",
          "KI & Automatisierungs-Integration",
          "Laufende Betreuung & Reporting",
        ],
      },
    ],
  },
  comparison: {
    heading: "Professionell vs. Baukasten im Münchner Markt",
    rows: [
      { criterion: "Design", pro: "Premium, individuell nach Marke", con: "Template, nicht differenzierend" },
      { criterion: "SEO München", pro: "Lokale Dominanz-Strategie, Strukturdaten", con: "Minimal, kein lokales Setup" },
      { criterion: "Ladezeit", pro: "Unter 1,5s, Core Web Vitals grün", con: "4–8s, schlechte Google-Bewertung" },
      { criterion: "Erweiterbarkeit", pro: "Skalierbar ohne Relaunch", con: "Schnell an Grenzen" },
      { criterion: "DSGVO", pro: "Vollständig, rechtssicher", con: "Lückenhaft, Abmahnrisiko" },
      { criterion: "Support", pro: "Persönlicher Ansprechpartner", con: "Ticket-System" },
    ],
  },
  localRelevance: {
    heading: "Webdesign-Kosten in München: Warum sich Qualität doppelt auszahlt",
    paragraphs: [
      "München ist Deutschlands teuerster und wettbewerbsintensivster lokaler Suchmarkt. Das bedeutet: Eine Website, die bei anderen Städten ausreichend wäre, verliert hier gegenüber besser optimierten Konkurrenten. Der Investitionsunterschied zwischen einer einfachen und einer strategisch aufgebauten Website zahlt sich in München deutlich schneller zurück.",
      "Die Münchner Zielgruppe – ob Privatkunden, Geschäftskunden oder Touristen – ist digital versiert und reagiert auf veraltetes Design und langsame Ladezeiten sofort mit Absprung. Das ist keine Wahrnehmungsfrage, sondern messbare Realität in jedem Analytics-Dashboard.",
      "Cogniiq entwickelt Websites für den Münchner Markt mit dem Anspruch, der diesem Markt entspricht – individuell, premium, technisch erstklassig. Persönliche Termine in München auf Wunsch möglich.",
    ],
  },
  faq: [
    {
      question: "Was kostet eine einfache Website in München?",
      answer: "Einstiegsprojekte starten typisch ab ca. 1.500 €. Im Münchner Markt sind für wettbewerbsfähige Sichtbarkeit oft Investitionen im Bereich 2.500–5.000 € realistischer.",
    },
    {
      question: "Warum sind Webdesign-Kosten in München höher als in anderen Städten?",
      answer: "Der Münchner Wettbewerb erfordert mehr SEO-Tiefe, bessere Performance und höhere Design-Qualität, um vergleichbare Rankings zu erreichen. Das spiegelt sich im Projektumfang wider.",
    },
    {
      question: "Sind Hosting und Domain inklusive?",
      answer: "Nein. Hosting und Domain sind separate Positionen. Empfehlung und Einrichtung sind inklusive, laufende Kosten ca. 10–25 € / Monat.",
    },
    {
      question: "Was kostet laufende SEO-Betreuung in München?",
      answer: "Monatliche Betreuung ab ca. 350 € / Monat. Im Paket 'Website Marktführer' inklusive.",
    },
    {
      question: "Gibt es versteckte Kosten?",
      answer: "Nein. Alle Positionen sind im Angebot aufgeführt. Was nicht drin steht, wird nicht berechnet.",
    },
    {
      question: "Wie lange dauert ein Webdesign-Projekt in München?",
      answer: "Launch: 7–14 Tage. Wachstum: 3–6 Wochen. Marktführer: 6–10 Wochen.",
    },
    {
      question: "Was ist in jedem Paket enthalten?",
      answer: "Individuelles Design, Mobile-First, On-Page SEO, DSGVO-Seiten, Kontaktformular, Kurzschulung.",
    },
    {
      question: "Lohnt sich Webdesign für Startups in München?",
      answer: "Besonders ja. Eine skalierbare Website von Anfang an ist günstiger als ein späterer Relaunch.",
    },
    {
      question: "Kann der Preis steigen?",
      answer: "Nur bei Scope-Erweiterungen – vorab kommuniziert.",
    },
    {
      question: "Wie erhalte ich ein konkretes Angebot für München?",
      answer: "Im kostenlosen Erstgespräch – 30–45 Minuten, remote oder vor Ort in München.",
    },
  ],
  internalLinks: [
    { label: "Webdesign München", href: "/muenchen/webdesign" },
    { label: "Website erstellen München", href: "/muenchen/website-erstellen" },
    { label: "Website Relaunch München", href: "/muenchen/website-relaunch" },
    { label: "Landingpage München", href: "/muenchen/landingpage" },
    { label: "Lokales SEO München", href: "/muenchen/lokales-seo" },
    { label: "Referenzen", href: "/referenzen" },
  ],
};

export function WebdesignKostenMuenchen() {
  return <ClusterPage config={config} />;
}
