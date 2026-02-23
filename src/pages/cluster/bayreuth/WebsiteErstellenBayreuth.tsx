import { ClusterPage } from "@/components/ClusterPage";
import type { ClusterPageConfig } from "@/components/ClusterPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const base = BUSINESS_INFO.website;

const config: ClusterPageConfig = {
  route: "/bayreuth/website-erstellen",
  city: "Bayreuth",
  citySlug: "bayreuth",
  cityHub: "/bayreuth",
  topic: "Website erstellen",
  seo: {
    title: "Website erstellen lassen Bayreuth – Professionell & SEO-ready | Cogniiq",
    description:
      "Website erstellen lassen in Bayreuth: Cogniiq entwickelt individuelle, schnelle und DSGVO-konforme Websites für Unternehmen in Bayreuth und Oberfranken. Persönliche Betreuung, lokales SEO inklusive.",
    canonical: `${base}/bayreuth/website-erstellen`,
    keywords:
      "Website erstellen Bayreuth, Homepage erstellen Bayreuth, Website erstellen lassen Bayreuth, Webseite erstellen Bayreuth, neue Website Bayreuth",
  },
  hero: {
    h1: "Website erstellen lassen in Bayreuth",
    lead: "Individuelle Websites für Unternehmen in Bayreuth – von der ersten Idee bis zum fertigen System. Kein Baukasten, kein Template. Entwickelt für Ihre Zielgruppe, optimiert für Google.",
    trustTags: ["Bayreuth", "Kein Template", "SEO-ready", "DSGVO-konform"],
    ctaLabel: "Kostenloses Erstgespräch",
  },
  tldr: {
    heading: "Kurzüberblick: Website erstellen in Bayreuth",
    items: [
      { label: "Für wen", value: "KMU, Praxen, Handwerk, Dienstleister" },
      { label: "Typische Ergebnisse", value: "Mehr organische Anfragen, besseres Ranking" },
      { label: "Projektdauer", value: "1–6 Wochen" },
      { label: "Preisrahmen", value: "ab ca. 1.500 €" },
    ],
  },
  intro: {
    heading: "Wie läuft eine Website-Erstellung in Bayreuth ab?",
    paragraphs: [
      "Eine neue Website ist mehr als Design. Es beginnt mit der Frage: Was soll die Website für Ihr Unternehmen leisten? Mehr Anfragen, bessere Sichtbarkeit in Bayreuth, klarere Positionierung? Die Antwort bestimmt Struktur, Inhalte und technisches Setup – noch bevor das erste Design entsteht.",
      "Cogniiq arbeitet in drei Phasen: Analyse & Konzept, Design & Entwicklung, dann Local SEO-Setup und Go-Live. Jede Phase hat klare Deliverables und einen definierten Zeitplan. Sie erhalten keine Überraschungen – nur Ergebnisse.",
      "Alle Websites werden von Grund auf individuell entwickelt: sauberer Code, Mobile-First, Core Web Vitals optimiert, DSGVO-konform ab Auslieferung. Kein Template, kein Baukasten – das ist kein Qualitätsmerkmal, das ist der Standard.",
    ],
  },
  painPoints: [
    "Erste Website oder Erstauftritt: kein klares Konzept, woher Anfragen kommen sollen",
    "Alte Website existiert, bringt aber keine Anfragen – unbekannt warum",
    "Baukasten-Website wurde selbst gebaut – funktioniert, ist aber kaum auffindbar bei Google",
    "Wettbewerber erscheinen bei relevanten Suchanfragen in Bayreuth, das eigene Unternehmen nicht",
  ],
  deliverables: {
    heading: "Was Sie mit einer neuen Website erhalten",
    items: [
      "Individuelles Design nach Ihrer Marke und Zielgruppe",
      "Responsive Design: optimal auf Smartphone, Tablet und Desktop",
      "On-Page SEO: Titel, Beschreibungen, Struktur, interne Links",
      "Local SEO Setup: Google Business, strukturierte Daten, NAP-Konsistenz",
      "DSGVO-Seiten: Impressum, Datenschutz, Cookie-Consent",
      "Kontaktformular mit automatischer Bestätigungs-Mail",
      "Google Analytics 4 & Search Console Integration",
      "Performance: Pagespeed unter 2s, Core Web Vitals grün",
      "Übergabe mit Content-Management-System",
      "Kurzschulung zur eigenständigen Inhaltspflege",
    ],
  },
  localRelevance: {
    heading: "Website erstellen in Bayreuth – lokaler Vorteil",
    paragraphs: [
      "Ein Bayreuther Unternehmen, das eine neue Website erstellen lässt, hat einen konkreten Vorteil gegenüber überregionalen Anbietern: lokales Know-how. Suchbegriffe wie 'Steuerkanzlei Bayreuth', 'Zahnarzt Bayreuth Innenstadt' oder 'IT-Service Oberfranken' haben spezifische Wettbewerbsstrukturen und Suchvolumina – die ein lokaler Anbieter kennt.",
      "Cogniiq ist in Bayreuth ansässig und analysiert die lokale Suchlandschaft für jedes Projekt. Das Ergebnis ist keine generische Website, sondern ein System, das gezielt auf die Suchanfragen Ihrer Zielgruppe in Bayreuth ausgerichtet ist.",
      "Persönliche Vor-Ort-Termine im Raum Bayreuth und Oberfranken sind selbstverständlich möglich. Kein Remote-only, kein Outsourcing ins Ausland – direkte Kommunikation mit dem Team, das Ihre Website entwickelt.",
    ],
  },
  faq: [
    {
      question: "Wie lange dauert es, eine neue Website in Bayreuth zu erstellen?",
      answer:
        "Kompakte Projekte (bis 6 Seiten) sind in 7–14 Tagen live. Websites mit erweitertem SEO und Content: 3–5 Wochen. Komplexere Projekte mit Integrationen: 6–10 Wochen. Verbindlicher Zeitplan wird im Konzept festgelegt.",
    },
    {
      question: "Muss ich Inhalte selbst liefern?",
      answer:
        "Nein. Auf Wunsch erstellen wir alle Texte: SEO-optimiert, conversion-stark, lokal ausgerichtet. Bilder stellen wir über lizenzfreie Quellen bereit oder arbeiten mit Ihrem vorhandenen Bildmaterial.",
    },
    {
      question: "Kann ich die Website nach Fertigstellung selbst bearbeiten?",
      answer:
        "Ja. Alle Websites werden mit einem CMS übergeben, das ohne Programmierkenntnisse bedienbar ist. Wir schulen Sie in der Nutzung und stehen bei Fragen weiterhin zur Verfügung.",
    },
    {
      question: "Was passiert, wenn ich mehr Seiten brauche?",
      answer:
        "Die Seitenstruktur ist erweiterbar. Weitere Seiten können jederzeit hinzugefügt werden – ohne Relaunch und ohne zusätzliche Einrichtungskosten.",
    },
    {
      question: "Funktioniert die Website auf dem Smartphone?",
      answer:
        "Ja. Alle Websites werden Mobile-First entwickelt – das Design ist auf Smartphone-Nutzung optimiert, da über 65 % der Nutzer in Bayreuth mobil surfen.",
    },
    {
      question: "Ist die neue Website direkt bei Google gefunden?",
      answer:
        "Nach dem Launch beginnt Google mit der Indexierung. Mit einem vollständigen SEO-Setup, Google Search Console und strukturierten Daten wird der Indexierungsprozess aktiv beschleunigt. Erste Sichtbarkeit ist in der Regel nach 2–6 Wochen messbar.",
    },
    {
      question: "Was kostet das Erstellen einer Website in Bayreuth?",
      answer:
        "Einfache Websites starten typisch ab ca. 1.500 €. Der genaue Preis hängt von Umfang, SEO-Tiefe und Funktionen ab. Detaillierte Preisübersicht auf /bayreuth/webdesign-kosten.",
    },
    {
      question: "Brauche ich ein Hosting-Paket?",
      answer:
        "Ja. Wir empfehlen DSGVO-konforme, performante Hosting-Lösungen. Einrichtung und Konfiguration sind im Projektpreis enthalten, die laufenden Hosting-Kosten (ca. 10–20 € / Monat) sind separat.",
    },
    {
      question: "Kann Cogniiq auch meine bestehende Website überarbeiten?",
      answer:
        "Ja. Wir analysieren die bestehende Website auf Pagespeed, SEO und Conversion und entscheiden gemeinsam, ob ein Relaunch oder eine gezielte Optimierung sinnvoller ist.",
    },
    {
      question: "Wie starte ich?",
      answer:
        "Kostenloses Erstgespräch buchen – 30–45 Minuten, remote oder vor Ort in Bayreuth. Wir analysieren Ihre Situation und erstellen im Anschluss ein konkretes Angebot.",
    },
  ],
  internalLinks: [
    { label: "Webdesign Bayreuth", href: "/bayreuth/webdesign" },
    { label: "Webdesign Kosten Bayreuth", href: "/bayreuth/webdesign-kosten" },
    { label: "Website Relaunch Bayreuth", href: "/bayreuth/website-relaunch" },
    { label: "Landingpage Bayreuth", href: "/bayreuth/landingpage" },
    { label: "Lokales SEO Bayreuth", href: "/bayreuth/lokales-seo" },
    { label: "Alle Leistungen", href: "/leistungen" },
  ],
};

export function WebsiteErstellenBayreuth() {
  return <ClusterPage config={config} />;
}
