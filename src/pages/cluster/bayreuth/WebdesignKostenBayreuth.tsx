import { ClusterPage } from "@/components/ClusterPage";
import type { ClusterPageConfig } from "@/components/ClusterPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const base = BUSINESS_INFO.website;

const config: ClusterPageConfig = {
  route: "/bayreuth/webdesign-kosten",
  city: "Bayreuth",
  citySlug: "bayreuth",
  cityHub: "/bayreuth",
  topic: "Webdesign Kosten",
  seo: {
    title: "Webdesign Kosten Bayreuth 2025 – Was kostet eine Website? | Cogniiq",
    description:
      "Webdesign Kosten in Bayreuth: Was kostet eine professionelle Website in Bayreuth 2025? Preisrahmen, Pakete und Einflussfaktoren – transparent erklärt von Cogniiq.",
    canonical: `${base}/bayreuth/webdesign-kosten`,
    keywords:
      "Webdesign Kosten Bayreuth, Website erstellen Kosten Bayreuth, Homepage Kosten Bayreuth, Webdesign Preis Bayreuth, Website Preis Bayreuth",
  },
  hero: {
    h1: "Webdesign Kosten in Bayreuth – Was kostet eine Website?",
    lead: "Transparente Preisübersicht für professionelles Webdesign in Bayreuth. Keine Pauschalen, keine versteckten Kosten – eine ehrliche Einschätzung, was Qualität kostet und warum sie sich lohnt.",
    trustTags: ["Bayreuth", "Transparente Preise", "Kein Baukasten", "DSGVO-konform"],
    ctaLabel: "Kostenloses Erstgespräch",
  },
  tldr: {
    heading: "Kurzüberblick: Webdesign Kosten Bayreuth",
    items: [
      { label: "Einstieg ab", value: "typisch ab ca. 1.500 €" },
      { label: "Mittelbereich", value: "2.500 € – 5.000 €" },
      { label: "Marktführer-Setup", value: "5.000 € – 12.000 €+" },
      { label: "Projektdauer", value: "1–6 Wochen" },
    ],
  },
  intro: {
    heading: "Was kostet ein professioneller Webauftritt in Bayreuth?",
    paragraphs: [
      "Die meisten Webdesign-Projekte in Bayreuth liegen zwischen 1.500 € und 8.000 €. Kleinere Websites für lokale Dienstleister oder Praxen starten typischerweise ab ca. 1.500 €. Projekte mit erweitertem Local SEO, Content-Strategie und Integrationen bewegen sich im Bereich von 3.000 € bis 6.000 €.",
      "Der Preis hängt von drei Faktoren ab: Seitenumfang, SEO-Tiefe und Integrationen. Eine fünfseitige Unternehmenswebsite ohne komplexe Funktionen ist ein grundlegend anderes Projekt als eine skalierbare Plattform mit Buchungssystem, Automatisierungen und laufender SEO-Strategie.",
      "Was in jedem Paket enthalten ist: individuelles Design (kein Template), sauberer Code, mobile Optimierung, DSGVO-Konformität und On-Page SEO. Das sind keine Extras – das ist der Standard, den jede professionelle Website erfüllen muss.",
    ],
  },
  painPoints: [
    "Baukasten-Anbieter versprechen günstige Websites – liefern aber schlechte Pagespeed und kaum SEO-Potenzial",
    "Angebote ohne klare Leistungsbeschreibung machen Vergleiche unmöglich",
    "Günstige Agenturen liefern Templates ohne lokale SEO-Strategie",
    "Viele Websites brauchen nach 2 Jahren einen Relaunch, weil sie nicht skalierbar gebaut wurden",
  ],
  pricing: {
    heading: "Preisrahmen: Webdesign in Bayreuth",
    rangeText:
      "Die meisten Webdesign-Projekte in Bayreuth liegen zwischen 1.500 € und 8.000 €. Folgende Orientierungswerte helfen bei der Einschätzung – das individuelle Angebot hängt immer vom konkreten Projekt ab.",
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
          "Lokale SEO-Strategie Bayreuth",
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
          "Dominanz-SEO Bayreuth/Oberfranken",
          "Content-Strategie & Texterstellung",
          "Backlink-Strategie lokal",
          "KI & Automatisierungs-Integration",
          "Laufende Betreuung & Reporting",
        ],
      },
    ],
  },
  comparison: {
    heading: "Professionell vs. Baukasten: Was der Preis wirklich kauft",
    rows: [
      { criterion: "Design", pro: "Individuell nach Marke", con: "Template mit Einschränkungen" },
      { criterion: "SEO", pro: "Lokale Strategie, strukturierte Daten", con: "Minimal, kein lokales Setup" },
      { criterion: "Ladezeit", pro: "Unter 2s, Core Web Vitals grün", con: "Oft 4–8s, schlecht bewertet" },
      { criterion: "Erweiterbarkeit", pro: "Skalierbar ohne Relaunch", con: "Schnell an Grenzen" },
      { criterion: "DSGVO", pro: "Vollständig, alle Pflichtseiten", con: "Lückenhaft, Abmahnrisiko" },
      { criterion: "Support", pro: "Persönlicher Ansprechpartner", con: "Ticket-System, Community" },
    ],
  },
  localRelevance: {
    heading: "Webdesign-Kosten in Bayreuth im lokalen Kontext",
    paragraphs: [
      "In Bayreuth ist der digitale Wettbewerb spürbar gestiegen. Handwerksbetriebe, Praxen und Dienstleister, die bisher ausschließlich über Empfehlung wuchsen, merken, dass potenzielle Kunden heute zuerst googeln – und denjenigen kontaktieren, der bei der Suche sichtbar ist.",
      "Der ROI einer professionellen Website in Bayreuth ist konkret: Wer bei 'Elektriker Bayreuth' oder 'Physiotherapie Bayreuth' auf Seite 1 erscheint, gewinnt Anfragen, die sonst an Wettbewerber gehen. Die Investition in Webdesign ist keine Ausgabe – sie ist die Voraussetzung für organisches Wachstum.",
      "Cogniiq ist in Bayreuth ansässig und bietet Vor-Ort-Termine im Raum Oberfranken an. Keine versteckten Kosten, kein Stundensatz-Wildwuchs – klare Pakete mit klarer Leistungsbeschreibung.",
    ],
  },
  faq: [
    {
      question: "Was kostet eine einfache Website in Bayreuth?",
      answer:
        "Eine professionelle Einsteiger-Website (bis 6 Seiten, On-Page SEO, DSGVO) startet typisch ab ca. 1.500 €. Der genaue Preis hängt von Design-Komplexität, Anzahl der Seiten und gewünschten Funktionen ab.",
    },
    {
      question: "Warum ist professionelles Webdesign teurer als ein Baukasten?",
      answer:
        "Baukastenlösungen sind limitiert in Geschwindigkeit, SEO-Tiefe und Anpassbarkeit. Ein individuell entwickeltes Webdesign ist schneller, besser für Google und langfristig deutlich wirtschaftlicher – weil es nicht nach 2 Jahren einen Relaunch braucht.",
    },
    {
      question: "Sind Hosting und Domain im Preis enthalten?",
      answer:
        "Nein, Hosting und Domain sind separate Positionen. Wir empfehlen passende, DSGVO-konforme Anbieter und helfen bei der Einrichtung – in der Regel unter 20 € pro Monat für performantes Managed Hosting.",
    },
    {
      question: "Was kostet laufende Wartung und Pflege?",
      answer:
        "Wartungspakete starten ab ca. 50–80 € pro Monat (Updates, Backups, Monitoring). Content-Pflege und SEO-Betreuung werden separat kalkuliert. Im Paket 'Website Marktführer' ist laufende Betreuung inklusive.",
    },
    {
      question: "Gibt es versteckte Kosten?",
      answer:
        "Nein. Das Angebot enthält alle Positionen: Design, Entwicklung, On-Page SEO, DSGVO-Seiten und Übergabe. Was nicht im Angebot steht, wird nicht berechnet. Bei größeren Projekten gibt es klare Meilensteine.",
    },
    {
      question: "Wie lange dauert ein Webdesign-Projekt in Bayreuth?",
      answer:
        "Website Launch: 7–14 Tage. Website Wachstum: 3–5 Wochen. Website Marktführer: 6–10 Wochen. Der Zeitplan wird im Konzept verbindlich festgelegt.",
    },
    {
      question: "Lohnt sich Webdesign für kleine Betriebe in Bayreuth?",
      answer:
        "Ja. Besonders für lokale Betriebe mit spezifischen Suchanfragen ('Bäcker Bayreuth', 'Steuerberater Bayreuth') ist eine optimierte Website mit lokalem SEO oft die effektivste Investition in neue Kundengewinnung.",
    },
    {
      question: "Was ist inklusive in jedem Paket?",
      answer:
        "Individuelles Design, sauberer Code, Mobile-Optimierung, On-Page SEO Grundoptimierung, DSGVO-Seiten (Impressum, Datenschutz, Cookie-Consent), Kontaktformular und Kurzschulung zur Bedienung.",
    },
    {
      question: "Kann der Preis nach Projektbeginn steigen?",
      answer:
        "Nur wenn der Leistungsumfang erweitert wird. Änderungen außerhalb des vereinbarten Scopes werden vorab kommuniziert und separat angeboten. Kein Stundensatz-Überraschungen.",
    },
    {
      question: "Wie erhalte ich ein konkretes Angebot?",
      answer:
        "Im kostenlosen Erstgespräch (30–45 Min.) analysieren wir Ihre Situation und erstellen im Anschluss ein detailliertes Angebot – ohne Verpflichtung.",
    },
  ],
  internalLinks: [
    { label: "Webdesign Bayreuth", href: "/bayreuth/webdesign" },
    { label: "Website erstellen Bayreuth", href: "/bayreuth/website-erstellen" },
    { label: "Website Relaunch Bayreuth", href: "/bayreuth/website-relaunch" },
    { label: "Landingpage Bayreuth", href: "/bayreuth/landingpage" },
    { label: "Lokales SEO Bayreuth", href: "/bayreuth/lokales-seo" },
    { label: "Referenzen", href: "/referenzen" },
  ],
};

export function WebdesignKostenBayreuth() {
  return <ClusterPage config={config} />;
}
