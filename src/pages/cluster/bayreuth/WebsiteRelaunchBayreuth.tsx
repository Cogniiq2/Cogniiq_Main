import { ClusterPage } from "@/components/ClusterPage";
import type { ClusterPageConfig } from "@/components/ClusterPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const base = BUSINESS_INFO.website;

const config: ClusterPageConfig = {
  route: "/bayreuth/website-relaunch",
  city: "Bayreuth",
  citySlug: "bayreuth",
  cityHub: "/bayreuth",
  topic: "Website Relaunch",
  seo: {
    title: "Website Relaunch Bayreuth – Modernisierung & SEO-Neustart | Cogniiq",
    description:
      "Website Relaunch in Bayreuth: Cogniiq modernisiert veraltete Websites für Unternehmen in Bayreuth und Oberfranken. Pagespeed, SEO, DSGVO und Conversion – komplett neu aufgesetzt.",
    canonical: `${base}/bayreuth/website-relaunch`,
    keywords:
      "Website Relaunch Bayreuth, Website modernisieren Bayreuth, Homepage Relaunch Bayreuth, Website neu gestalten Bayreuth, Webdesign Relaunch Bayreuth",
  },
  hero: {
    h1: "Website Relaunch in Bayreuth",
    lead: "Veraltete Website, schlechtes Ranking, langsame Ladezeit? Ein Relaunch setzt den digitalen Auftritt auf eine neue Basis – technisch, inhaltlich und in der Sichtbarkeit.",
    trustTags: ["Bayreuth", "SEO-Neustart", "Pagespeed", "Kein Datenverlust"],
    ctaLabel: "Kostenloses Erstgespräch",
  },
  tldr: {
    heading: "Kurzüberblick: Website Relaunch in Bayreuth",
    items: [
      { label: "Für wen", value: "Websites älter als 3 Jahre oder mit SEO-Problemen" },
      { label: "Typische Ziele", value: "Mehr Anfragen, bessere Rankings, schnellere Ladezeit" },
      { label: "Projektdauer", value: "3–8 Wochen" },
      { label: "Preisrahmen", value: "ab ca. 2.000 €" },
    ],
  },
  intro: {
    heading: "Wann ist ein Relaunch sinnvoll – und wann nicht?",
    paragraphs: [
      "Ein Relaunch ist keine Entscheidung, die leichtfertig getroffen wird – und auch keine, die immer nötig ist. Manchmal reichen gezielte Optimierungen: Pagespeed-Fixes, SEO-Anpassungen, DSGVO-Updates. Manchmal ist die technische Grundlage so schwach oder das Design so veraltet, dass ein Neustart wirtschaftlicher ist als Flickarbeit.",
      "Cogniiq analysiert die bestehende Website vor jedem Projekt: Pagespeed, SEO-Status, Core Web Vitals, Conversion-Struktur, DSGVO-Konformität. Das Ergebnis ist eine klare Empfehlung – Optimierung oder Relaunch – mit konkreter Begründung.",
      "Ein gut durchgeführter Relaunch verbessert nachweislich Rankings, Ladezeit und Conversion-Rate. Ein schlecht durchgeführter Relaunch kostet bestehende Rankings. Der Unterschied liegt in der Sorgfalt bei URL-Struktur, Weiterleitungen und SEO-Migration.",
    ],
  },
  painPoints: [
    "Website lädt langsam – Google straft schlechte Core Web Vitals mit schlechteren Rankings ab",
    "Design ist veraltet – potenzielle Kunden verlieren sofort das Vertrauen",
    "DSGVO-Compliance ist unklar – Datenschutzerklärung und Cookie-Consent veraltet",
    "Mobile Darstellung funktioniert kaum – Nutzer auf dem Smartphone springen ab",
    "Ranking trotz Traffic-Potential schlecht – lokale Keywords in Bayreuth nicht abgedeckt",
    "CMS-System veraltet – Inhalte lassen sich kaum selbst bearbeiten",
  ],
  deliverables: {
    heading: "Was ein Relaunch mit Cogniiq umfasst",
    items: [
      "Website-Analyse und Audit (Pagespeed, SEO, DSGVO)",
      "SEO-Migrationsplan: Weiterleitungen für alle relevanten URLs",
      "Neues individuelles Design nach aktuellem Standard",
      "Performance-Optimierung: Ladezeit unter 2s, Core Web Vitals grün",
      "On-Page SEO: vollständige Neuoptimierung aller Seiten",
      "Local SEO Setup: Google Business, strukturierte Daten",
      "DSGVO-Seiten vollständig neu: Impressum, Datenschutz, Consent",
      "Analytics-Setup: GA4, Search Console, Conversion-Tracking",
      "Übergabe mit CMS und Schulung",
      "3 Monate Post-Launch Monitoring auf Wunsch",
    ],
  },
  localRelevance: {
    heading: "Website Relaunch für Bayreuther Unternehmen",
    paragraphs: [
      "Viele Bayreuther Unternehmen haben Websites, die vor 5–10 Jahren erstellt wurden. Das war in vielen Fällen ausreichend – die digitale Konkurrenz war überschaubar. Heute hat sich das geändert: Wettbewerber mit moderneren, schnelleren Websites verdrängen veraltete Präsenzen aus den Suchergebnissen.",
      "Ein Relaunch ist kein Aufwand ohne Ertrag. Die messbare Verbesserung von Pagespeed und SEO führt in der Regel zu besseren Rankings, mehr organischen Anfragen und einer niedrigeren Absprungrate. Für lokale Betriebe in Bayreuth ist das ein direkter wirtschaftlicher Vorteil.",
      "Cogniiq führt Relaunches mit besonderer Sorgfalt bei der SEO-Migration durch. Bestehende Rankings gehen nicht verloren – sie werden verbessert.",
    ],
  },
  faq: [
    {
      question: "Verliere ich meine bestehenden Google-Rankings beim Relaunch?",
      answer:
        "Bei einem professionell durchgeführten Relaunch nicht. Cogniiq erstellt vorab einen vollständigen URL-Migrationsplan mit 301-Weiterleitungen für alle relevanten Seiten. Rankings werden erhalten und in der Regel verbessert.",
    },
    {
      question: "Was kostet ein Website Relaunch in Bayreuth?",
      answer:
        "Einfache Relaunches starten ab ca. 2.000 €. Projekte mit vollständiger SEO-Migration, neuem Content und Integrationen liegen typisch bei 3.500 € – 7.000 €. Detailliertes Angebot nach kostenlosem Erstgespräch.",
    },
    {
      question: "Wie lange dauert ein Relaunch?",
      answer:
        "3–8 Wochen je nach Umfang. Ein klarer Zeitplan wird im Konzept festgelegt. Die alte Website bleibt bis zum Launch vollständig erreichbar.",
    },
    {
      question: "Was passiert mit meinen bisherigen Inhalten?",
      answer:
        "Alle relevanten Inhalte werden auf die neue Website übertragen und SEO-technisch optimiert. Inhalte, die nicht mehr relevant sind, werden gemeinsam bewertet.",
    },
    {
      question: "Wann ist ein Relaunch notwendig?",
      answer:
        "Wenn die Website älter als 3–4 Jahre ist, eine Ladezeit über 3 Sekunden hat, mobil nicht nutzbar ist, DSGVO-Lücken hat oder bei relevanten lokalen Suchanfragen nicht gefunden wird.",
    },
    {
      question: "Kann ich das CMS nach dem Relaunch beibehalten?",
      answer:
        "Je nach System ja. Wenn das bestehende CMS performant und sicher ist, kann es genutzt werden. Andernfalls empfehlen wir einen CMS-Wechsel – mit vollständiger Schulung.",
    },
    {
      question: "Ist ein Relaunch oder eine Optimierung sinnvoller?",
      answer:
        "Das hängt vom Zustand der bestehenden Website ab. Cogniiq führt eine kostenlose Analyse durch und gibt eine ehrliche Empfehlung – ohne dass ein Relaunch automatisch das Ziel ist.",
    },
    {
      question: "Werden auch die Texte beim Relaunch neu erstellt?",
      answer:
        "Auf Wunsch ja. Bestehende Texte werden SEO-optimiert übernommen oder bei Bedarf komplett neu geschrieben.",
    },
    {
      question: "Wie starte ich den Relaunch-Prozess?",
      answer:
        "Im kostenlosen Erstgespräch analysieren wir gemeinsam den Ist-Zustand und definieren Ziele und Scope. Anschließend erhalten Sie ein konkretes Angebot.",
    },
  ],
  internalLinks: [
    { label: "Webdesign Bayreuth", href: "/bayreuth/webdesign" },
    { label: "Website erstellen Bayreuth", href: "/bayreuth/website-erstellen" },
    { label: "Webdesign Kosten Bayreuth", href: "/bayreuth/webdesign-kosten" },
    { label: "Landingpage Bayreuth", href: "/bayreuth/landingpage" },
    { label: "Lokales SEO Bayreuth", href: "/bayreuth/lokales-seo" },
    { label: "Alle Leistungen", href: "/leistungen" },
  ],
};

export function WebsiteRelaunchBayreuth() {
  return <ClusterPage config={config} />;
}
