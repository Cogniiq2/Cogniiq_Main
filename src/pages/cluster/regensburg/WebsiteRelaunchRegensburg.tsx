import { ClusterPage } from "@/components/ClusterPage";
import type { ClusterPageConfig } from "@/components/ClusterPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const base = BUSINESS_INFO.website;

const config: ClusterPageConfig = {
  route: "/regensburg/website-relaunch",
  city: "Regensburg",
  citySlug: "regensburg",
  cityHub: "/regensburg",
  topic: "Website Relaunch",
  seo: {
    title: "Website Relaunch Regensburg – Modernisierung & SEO-Neustart | Cogniiq",
    description:
      "Website Relaunch in Regensburg: Cogniiq modernisiert veraltete Websites für Unternehmen in Regensburg und der Oberpfalz. Pagespeed, SEO, DSGVO – komplett neu aufgesetzt.",
    canonical: `${base}/regensburg/website-relaunch`,
    keywords:
      "Website Relaunch Regensburg, Website modernisieren Regensburg, Homepage Relaunch Regensburg, Webdesign Relaunch Regensburg",
  },
  hero: {
    h1: "Website Relaunch in Regensburg",
    lead: "Veraltete Website, schlechte Rankings, langsame Ladezeit – ein Relaunch setzt den digitalen Auftritt neu auf. Technisch fundiert, SEO-sicher, ohne Verlust bestehender Rankings.",
    trustTags: ["Regensburg", "SEO-Migration", "Pagespeed", "Kein Ranking-Verlust"],
    ctaLabel: "Kostenloses Erstgespräch",
  },
  tldr: {
    heading: "Kurzüberblick: Website Relaunch in Regensburg",
    items: [
      { label: "Für wen", value: "Websites älter als 3 Jahre oder mit Performance-Problemen" },
      { label: "Typische Ziele", value: "Mehr Anfragen, schnellere Ladezeit, bessere Rankings" },
      { label: "Projektdauer", value: "3–8 Wochen" },
      { label: "Preisrahmen", value: "ab ca. 2.000 €" },
    ],
  },
  intro: {
    heading: "Wann ist ein Relaunch in Regensburg sinnvoll?",
    paragraphs: [
      "Nicht jede veraltete Website braucht sofort einen Relaunch. Manchmal genügen gezielte Optimierungen: Pagespeed-Fixes, DSGVO-Update, SEO-Anpassungen. Manchmal ist die technische Basis so schwach, dass Flickarbeit teurer ist als ein sauberer Neustart.",
      "Cogniiq analysiert die bestehende Website zuerst: Core Web Vitals, SEO-Status, DSGVO-Konformität, Conversion-Struktur. Das Ergebnis ist eine klare Empfehlung – mit konkreter Begründung, nicht mit pauschaler Empfehlung zum Relaunch.",
      "Ein Relaunch verbessert nachweislich Rankings, Ladezeit und Conversion. Der Schlüssel liegt in der sorgfältigen SEO-Migration: Weiterleitungen für alle relevanten URLs, Erhalt bestehender Rankings und simultane SEO-Verbesserung.",
    ],
  },
  painPoints: [
    "Website lädt über 4 Sekunden – Google rankt schlechte Core Web Vitals ab",
    "Design veraltet: Regensburger Zielgruppe verliert sofort Vertrauen",
    "DSGVO-Dokumentation veraltet – erhöhtes Abmahnrisiko",
    "Mobile Darstellung kaum nutzbar – besonders problematisch bei touristischer Zielgruppe in Regensburg",
    "Lokale Suchanfragen werden von Wettbewerbern dominiert, obwohl eigenes Angebot besser ist",
    "CMS veraltet: Inhalte nicht selbstständig pflegbar",
  ],
  deliverables: {
    heading: "Was ein Relaunch mit Cogniiq umfasst",
    items: [
      "Website-Audit: Pagespeed, SEO, DSGVO, Conversion",
      "SEO-Migrationsplan mit vollständigen 301-Weiterleitungen",
      "Neues individuelles Design nach aktuellem Standard",
      "Performance-Optimierung: Core Web Vitals grün",
      "On-Page SEO: vollständige Neuoptimierung",
      "Local SEO Setup: Google Business, strukturierte Daten",
      "DSGVO-Seiten vollständig erneuert",
      "Analytics-Setup: GA4, Search Console, Tracking",
      "CMS-Übergabe und Schulung",
      "Post-Launch Monitoring auf Wunsch",
    ],
  },
  localRelevance: {
    heading: "Website Relaunch für Regensburger Unternehmen",
    paragraphs: [
      "In Regensburg haben viele Betriebe Websites aus den Jahren 2015–2019. Das Regensburger Stadtbild hat sich digital weiterentwickelt – die Konkurrenz ist präsenter geworden, die Suchmaschinenstandards strenger. Wer heute noch eine Website mit 6-Sekunden-Ladezeit und fehlender Mobiloptimierung betreibt, verliert täglich Besucher an modernere Konkurrenten.",
      "Besonders in der Gastronomie – einem der stärksten Wirtschaftssektoren in Regensburg – entscheidet die Website oft darüber, ob ein Tourist oder Einheimischer reserviert oder weitersucht.",
      "Cogniiq führt Relaunches mit besonderer Sorgfalt durch. Bestehende Rankings gehen nicht verloren – sie werden verbessert. Persönliche Termine in Regensburg auf Wunsch möglich.",
    ],
  },
  faq: [
    {
      question: "Verliere ich meine Rankings beim Relaunch?",
      answer: "Bei sorgfältiger SEO-Migration nicht. Cogniiq erstellt vorab einen vollständigen Weiterleitungsplan für alle relevanten URLs.",
    },
    {
      question: "Was kostet ein Website Relaunch in Regensburg?",
      answer: "Einfache Relaunches ab ca. 2.000 €. Mit vollständiger SEO-Migration und neuen Inhalten: 3.500 € – 7.000 €.",
    },
    {
      question: "Wie lange dauert ein Relaunch?",
      answer: "3–8 Wochen. Die alte Website bleibt bis zum Launch vollständig erreichbar.",
    },
    {
      question: "Was passiert mit meinen bestehenden Inhalten?",
      answer: "Alle relevanten Inhalte werden übernommen und SEO-technisch optimiert.",
    },
    {
      question: "Wann ist ein Relaunch notwendig?",
      answer: "Bei Websites älter als 3–4 Jahre, Ladezeit über 3s, fehlender Mobiloptimierung oder DSGVO-Lücken.",
    },
    {
      question: "Kann das bestehende CMS beibehalten werden?",
      answer: "Je nach System ja. Cogniiq bewertet das im Rahmen der Analyse.",
    },
    {
      question: "Relaunch oder Optimierung – was ist sinnvoller?",
      answer: "Das hängt vom Zustand ab. Cogniiq gibt nach der kostenlosen Analyse eine ehrliche Empfehlung.",
    },
    {
      question: "Werden Texte neu erstellt?",
      answer: "Auf Wunsch ja. Bestehende Texte werden SEO-optimiert oder komplett neu geschrieben.",
    },
    {
      question: "Wie starte ich den Relaunch-Prozess?",
      answer: "Kostenloses Erstgespräch – Analyse, Zielsetzung, Angebot.",
    },
  ],
  internalLinks: [
    { label: "Webdesign Regensburg", href: "/regensburg/webdesign" },
    { label: "Website erstellen Regensburg", href: "/regensburg/website-erstellen" },
    { label: "Webdesign Kosten Regensburg", href: "/regensburg/webdesign-kosten" },
    { label: "Landingpage Regensburg", href: "/regensburg/landingpage" },
    { label: "Lokales SEO Regensburg", href: "/regensburg/lokales-seo" },
    { label: "Alle Leistungen", href: "/leistungen" },
  ],
};

export function WebsiteRelaunchRegensburg() {
  return <ClusterPage config={config} />;
}
