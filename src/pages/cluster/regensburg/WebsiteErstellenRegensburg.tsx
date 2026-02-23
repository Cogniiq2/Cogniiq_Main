import { ClusterPage } from "@/components/ClusterPage";
import type { ClusterPageConfig } from "@/components/ClusterPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const base = BUSINESS_INFO.website;

const config: ClusterPageConfig = {
  route: "/regensburg/website-erstellen",
  city: "Regensburg",
  citySlug: "regensburg",
  cityHub: "/regensburg",
  topic: "Website erstellen",
  seo: {
    title: "Website erstellen lassen Regensburg – Professionell & SEO-ready | Cogniiq",
    description:
      "Website erstellen lassen in Regensburg: Cogniiq entwickelt individuelle, schnelle und DSGVO-konforme Websites für Unternehmen in Regensburg und der Oberpfalz. Kein Template – lokales SEO inklusive.",
    canonical: `${base}/regensburg/website-erstellen`,
    keywords:
      "Website erstellen Regensburg, Homepage erstellen Regensburg, Website erstellen lassen Regensburg, neue Website Regensburg",
  },
  hero: {
    h1: "Website erstellen lassen in Regensburg",
    lead: "Individuelle Websites für Unternehmen in Regensburg und der Oberpfalz. Kein Baukasten, kein Template. Entwickelt für Ihre Zielgruppe – ob Tourismusbetrieb, Dienstleister oder Mittelstand.",
    trustTags: ["Regensburg", "Kein Template", "SEO-ready", "DSGVO-konform"],
    ctaLabel: "Kostenloses Erstgespräch",
  },
  tldr: {
    heading: "Kurzüberblick: Website erstellen in Regensburg",
    items: [
      { label: "Für wen", value: "Gastronomie, Dienstleister, KMU, Praxen" },
      { label: "Typische Ergebnisse", value: "Mehr organische Anfragen, bessere Sichtbarkeit" },
      { label: "Projektdauer", value: "1–6 Wochen" },
      { label: "Preisrahmen", value: "ab ca. 1.500 €" },
    ],
  },
  intro: {
    heading: "Website erstellen in Regensburg – was Sie erwarten können",
    paragraphs: [
      "Regensburg ist eine der dynamischsten Städte Bayerns – mit starkem Tourismus, wachsendem Mittelstand und einer aktiven Gastronomie- und Dienstleistungsszene. Eine neue Website in diesem Umfeld muss mehr leisten als gut aussehen: Sie muss bei lokalen Suchanfragen gefunden werden, auf Mobilgeräten funktionieren und Besucher in Anfragen umwandeln.",
      "Cogniiq entwickelt neue Websites für Regensburger Unternehmen in drei klar definierten Phasen: Analyse & Konzept, Design & Entwicklung, Local SEO-Setup & Go-Live. Jede Phase hat klare Deliverables – kein Rätselraten, kein Scope-Creep.",
      "Das Ergebnis ist keine generische Vorlage, sondern eine Website, die auf die spezifischen Suchanfragen Ihrer Zielgruppe in Regensburg ausgerichtet ist und technisch auf dem Stand ist, den Google für gute Rankings voraussetzt.",
    ],
  },
  painPoints: [
    "Gastronomie ohne Online-Reservierung verliert Gäste an Konkurrenten mit besserer digitaler Buchbarkeit",
    "Dienstleister ohne lokale Google-Sichtbarkeit werden von Kunden nicht gefunden, die gezielt suchen",
    "Selbst erstellte Baukasten-Website funktioniert, rankt aber kaum bei relevanten Suchanfragen",
    "Erste Website benötigt strategischen Aufbau, damit Investition langfristig wirkt",
  ],
  deliverables: {
    heading: "Was Sie mit einer neuen Website von Cogniiq erhalten",
    items: [
      "Individuelles Design nach Ihrer Marke und Zielgruppe",
      "Responsive Design: Smartphone, Tablet und Desktop",
      "On-Page SEO: Titel, Beschreibungen, Struktur, interne Verlinkung",
      "Local SEO Setup: Google Business, strukturierte Daten, NAP-Konsistenz",
      "DSGVO-Seiten: Impressum, Datenschutz, Cookie-Consent",
      "Kontaktformular mit Bestätigungs-Mail",
      "Google Analytics 4 & Search Console Integration",
      "Performance: Pagespeed unter 2s, Core Web Vitals grün",
      "CMS mit Schulung zur eigenständigen Inhaltspflege",
      "Optional: Reservierungssystem, Speisekarte, Terminbuchung",
    ],
  },
  localRelevance: {
    heading: "Website erstellen in Regensburg – lokaler Vorteil",
    paragraphs: [
      "Für Regensburger Betriebe ist lokale Sichtbarkeit ein direkter Wettbewerbsfaktor. Touristen googeln Restaurants, bevor sie buchen. Einheimische suchen online nach Handwerkern und Dienstleistern. Wer bei diesen Suchanfragen auf Seite 1 erscheint, gewinnt Anfragen, die sonst an Wettbewerber gehen.",
      "Besonderheit Regensburg: Die Altstadt und touristischen Attraktionen bedeuten ein überdurchschnittlich hohes Suchaufkommen mit lokalem Bezug. Für Gastronomie und Tourismusbetriebe ist das eine seltene Chance – wenn die digitale Präsenz stimmt.",
      "Cogniiq entwickelt Websites mit einem tiefen Verständnis für die Regensburger Suchlandschaft. Auf Wunsch sind persönliche Termine vor Ort in Regensburg möglich.",
    ],
  },
  faq: [
    {
      question: "Wie lange dauert die Erstellung einer neuen Website in Regensburg?",
      answer: "7–14 Tage für kompakte Projekte. 3–6 Wochen für Websites mit erweitertem SEO und Integrationen.",
    },
    {
      question: "Muss ich die Texte selbst liefern?",
      answer: "Nein. Cogniiq erstellt auf Wunsch alle Texte – SEO-optimiert und auf die Regensburger Zielgruppe ausgerichtet.",
    },
    {
      question: "Kann ich die Website selbst bearbeiten?",
      answer: "Ja. Übergabe mit CMS und Schulung ist Standard. Für technische Anpassungen stehen wir weiter zur Verfügung.",
    },
    {
      question: "Kann eine Reservierungsfunktion integriert werden?",
      answer: "Ja. Für Gastronomie und Dienstleister integrieren wir Online-Reservierung und Terminbuchung direkt in die Website.",
    },
    {
      question: "Funktioniert die Website auf dem Smartphone?",
      answer: "Ja. Mobile-First ist Standard. Besonders relevant in Regensburg durch den hohen Anteil an mobilen Tourismussuchen.",
    },
    {
      question: "Ist die Website direkt bei Google gefunden?",
      answer: "Mit vollständigem SEO-Setup beschleunigen wir den Indexierungsprozess. Erste Sichtbarkeit typisch nach 2–6 Wochen.",
    },
    {
      question: "Was kostet eine Website in Regensburg?",
      answer: "Ab ca. 1.500 € für kompakte Projekte. Detaillierte Preisübersicht unter /regensburg/webdesign-kosten.",
    },
    {
      question: "Kann Cogniiq bestehende Websites überarbeiten?",
      answer: "Ja. Analyse, Optimierung oder Relaunch – je nachdem, was die bestehende Situation erfordert.",
    },
    {
      question: "Gibt es eine Möglichkeit für persönliche Treffen in Regensburg?",
      answer: "Ja. Auf Wunsch sind Vor-Ort-Termine in Regensburg möglich.",
    },
    {
      question: "Wie starte ich?",
      answer: "Kostenloses Erstgespräch – 30–45 Minuten, remote oder vor Ort in Regensburg.",
    },
  ],
  internalLinks: [
    { label: "Webdesign Regensburg", href: "/regensburg/webdesign" },
    { label: "Webdesign Kosten Regensburg", href: "/regensburg/webdesign-kosten" },
    { label: "Website Relaunch Regensburg", href: "/regensburg/website-relaunch" },
    { label: "Landingpage Regensburg", href: "/regensburg/landingpage" },
    { label: "Lokales SEO Regensburg", href: "/regensburg/lokales-seo" },
    { label: "Alle Leistungen", href: "/leistungen" },
  ],
};

export function WebsiteErstellenRegensburg() {
  return <ClusterPage config={config} />;
}
