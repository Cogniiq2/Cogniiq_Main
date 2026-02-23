import { ClusterPage } from "@/components/ClusterPage";
import type { ClusterPageConfig } from "@/components/ClusterPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const base = BUSINESS_INFO.website;

const config: ClusterPageConfig = {
  route: "/muenchen/website-relaunch",
  city: "München",
  citySlug: "muenchen",
  cityHub: "/muenchen",
  topic: "Website Relaunch",
  seo: {
    title: "Website Relaunch München – Modernisierung & SEO-Neustart | Cogniiq",
    description:
      "Website Relaunch in München: Cogniiq modernisiert veraltete Websites für Unternehmen in München. Core Web Vitals, lokale SEO-Dominanz, DSGVO – komplett auf Premium-Niveau neu aufgesetzt.",
    canonical: `${base}/muenchen/website-relaunch`,
    keywords:
      "Website Relaunch München, Website modernisieren München, Homepage Relaunch München, Webdesign Relaunch München",
  },
  hero: {
    h1: "Website Relaunch in München",
    lead: "Im Münchner Wettbewerb ist eine veraltete Website keine Kleinigkeit – sie kostet täglich Anfragen an besser aufgestellte Konkurrenten. Ein Relaunch setzt den digitalen Auftritt auf das Niveau, das der Münchner Markt erfordert.",
    trustTags: ["München", "Premium-Standard", "SEO-Migration", "Kein Ranking-Verlust"],
    ctaLabel: "Kostenloses Erstgespräch",
  },
  tldr: {
    heading: "Kurzüberblick: Website Relaunch in München",
    items: [
      { label: "Für wen", value: "Münchner Unternehmen mit veralteter oder schwacher Website" },
      { label: "Typische Ziele", value: "Top-Rankings, Ladezeit unter 1,5s, mehr Anfragen" },
      { label: "Projektdauer", value: "4–10 Wochen" },
      { label: "Preisrahmen", value: "ab ca. 2.500 €" },
    ],
  },
  intro: {
    heading: "Wann ist ein Relaunch in München notwendig?",
    paragraphs: [
      "In München gelten höhere Schwellenwerte als in anderen Städten. Eine Website, die technisch solide, aber nicht herausragend ist, verliert gegenüber besser optimierten Konkurrenten im Map Pack und in den organischen Ergebnissen. Der Entscheidungsmaßstab ist nicht 'gut genug' – er ist 'besser als die Konkurrenz'.",
      "Cogniiq analysiert die bestehende Website in direktem Vergleich mit den führenden Wettbewerbern im Münchner Markt: Pagespeed, Core Web Vitals, SEO-Qualität, Conversion-Struktur, DSGVO-Konformität. Das Ergebnis ist eine konkrete Empfehlung mit messbarer Begründung.",
      "Ein Relaunch in München hat besonders hohe SEO-Anforderungen: vollständige URL-Migration, strukturierte Daten, Backlink-Monitoring und parallele Contentstrategie. Cogniiq führt diese Schritte systematisch durch.",
    ],
  },
  painPoints: [
    "Ladezeit über 3s: direkter Ranking-Malus im Münchner Hochkompetitionsmarkt",
    "Veraltetes Design: Münchner Zielgruppe verlässt die Seite innerhalb von 3 Sekunden",
    "Core Web Vitals schlecht: Google benachteiligt die Website in den Suchergebnissen",
    "DSGVO-Dokumentation veraltet: erhöhtes Abmahnrisiko in einem rechtsbewussten Markt",
    "Lokale SEO-Grundlage fehlt: Google Business nicht optimiert, keine strukturierten Daten",
    "Keine Skalierbarkeit: Website deckt wachsende Anforderungen nicht ab",
  ],
  deliverables: {
    heading: "Was ein Relaunch mit Cogniiq in München umfasst",
    items: [
      "Vollständiger Website-Audit im Wettbewerbsvergleich München",
      "SEO-Migrationsplan mit allen 301-Weiterleitungen",
      "Premium individuelles Design nach Münchner Standards",
      "Performance: Ladezeit unter 1,5s, Core Web Vitals grün",
      "On-Page SEO vollständig neu optimiert",
      "Local SEO: Google Business, strukturierte Daten, lokale Autorität",
      "DSGVO vollständig erneuert",
      "Analytics: GA4, Search Console, Conversion-Tracking",
      "CMS-Übergabe und Schulung",
      "Post-Launch Monitoring und SEO-Reporting",
    ],
  },
  localRelevance: {
    heading: "Website Relaunch in München: Anforderungen des Markts",
    paragraphs: [
      "Münchner Unternehmen haben oft Websites, die vor 4–7 Jahren erstellt wurden und damals den Anforderungen genügten. Der Münchner Markt hat sich schneller entwickelt als anderswo – was 2018 akzeptabel war, ist 2025 in München ein Wettbewerbsnachteil.",
      "Die Benchmarks sind klar: Ladezeit unter 1,5s, Core Web Vitals im grünen Bereich, vollständiges lokales SEO-Setup und ein Design, das Vertrauen auf den ersten Blick erzeugt. Ein professionell durchgeführter Relaunch trifft diese Benchmarks – und setzt die Website in eine Position, in der sie Rankings nicht verliert, sondern gewinnt.",
      "Cogniiq führt Relaunches für Münchner Unternehmen mit der Präzision durch, die dieser Markt erfordert. Persönliche Termine in München auf Wunsch möglich.",
    ],
  },
  faq: [
    {
      question: "Verliere ich meine Rankings beim Relaunch in München?",
      answer: "Bei sorgfältiger SEO-Migration nicht. Cogniiq erstellt einen vollständigen Weiterleitungsplan für alle relevanten URLs – Rankings werden erhalten und verbessert.",
    },
    {
      question: "Was kostet ein Website Relaunch in München?",
      answer: "Einfache Relaunches ab ca. 2.500 €. Komplexere Projekte mit vollständiger SEO-Strategie: 4.500 € – 10.000 €.",
    },
    {
      question: "Wie lange dauert ein Relaunch in München?",
      answer: "4–10 Wochen. Die alte Website bleibt bis zum Launch vollständig erreichbar.",
    },
    {
      question: "Was passiert mit den bestehenden Inhalten?",
      answer: "Alle relevanten Inhalte werden übernommen und SEO-optimiert.",
    },
    {
      question: "Wann ist ein Relaunch in München nötig?",
      answer: "Bei Ladezeit über 3s, fehlender Mobile-Optimierung, veralteten DSGVO-Seiten oder schwachen Rankings im Münchner Wettbewerb.",
    },
    {
      question: "Relaunch oder Optimierung?",
      answer: "Cogniiq analysiert den Ist-Zustand und gibt eine ehrliche Empfehlung – ein Relaunch ist nicht automatisch das Ziel.",
    },
    {
      question: "Werden Texte neu erstellt?",
      answer: "Auf Wunsch ja. SEO-optimiert für Münchner Suchanfragen und Zielgruppen.",
    },
    {
      question: "Wie schnell zeigen sich Ergebnisse nach dem Relaunch?",
      answer: "Erste Ranking-Veränderungen nach 2–6 Wochen. Vollständige Indexierung und stabilisierte Rankings nach 2–3 Monaten.",
    },
    {
      question: "Wie starte ich den Relaunch-Prozess?",
      answer: "Kostenloses Erstgespräch – Analyse des Ist-Zustands und konkrete Empfehlung.",
    },
  ],
  internalLinks: [
    { label: "Webdesign München", href: "/muenchen/webdesign" },
    { label: "Website erstellen München", href: "/muenchen/website-erstellen" },
    { label: "Webdesign Kosten München", href: "/muenchen/webdesign-kosten" },
    { label: "Landingpage München", href: "/muenchen/landingpage" },
    { label: "Lokales SEO München", href: "/muenchen/lokales-seo" },
    { label: "Alle Leistungen", href: "/leistungen" },
  ],
};

export function WebsiteRelaunchMuenchen() {
  return <ClusterPage config={config} />;
}
