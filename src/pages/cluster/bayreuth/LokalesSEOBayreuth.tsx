import { ClusterPage } from "@/components/ClusterPage";
import type { ClusterPageConfig } from "@/components/ClusterPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const base = BUSINESS_INFO.website;

const config: ClusterPageConfig = {
  route: "/bayreuth/lokales-seo",
  city: "Bayreuth",
  citySlug: "bayreuth",
  cityHub: "/bayreuth",
  topic: "Lokales SEO",
  seo: {
    title: "Lokales SEO Bayreuth – Mehr Google-Sichtbarkeit für lokale Unternehmen | Cogniiq",
    description:
      "Lokales SEO in Bayreuth: Cogniiq optimiert Ihre lokale Sichtbarkeit bei Google. Google Business Profil, strukturierte Daten, lokale Keywords – für nachhaltiges Ranking in Bayreuth.",
    canonical: `${base}/bayreuth/lokales-seo`,
    keywords:
      "Lokales SEO Bayreuth, Local SEO Bayreuth, Google Business Bayreuth, SEO Agentur Bayreuth, lokale Suchmaschinenoptimierung Bayreuth",
  },
  hero: {
    h1: "Lokales SEO in Bayreuth – Mehr Sichtbarkeit bei Google",
    lead: "Wenn potenzielle Kunden in Bayreuth nach Ihrem Angebot suchen, müssen Sie gefunden werden. Lokales SEO sorgt dafür – durch Google Business Optimierung, strukturierte Daten und lokale Keyword-Strategie.",
    trustTags: ["Bayreuth", "Google Business", "Core Web Vitals", "Strukturierte Daten"],
    ctaLabel: "Kostenloses Erstgespräch",
  },
  tldr: {
    heading: "Kurzüberblick: Lokales SEO in Bayreuth",
    items: [
      { label: "Für wen", value: "Lokale Betriebe, Praxen, Dienstleister" },
      { label: "Ziel", value: "Top-3 Google Maps & organische Ergebnisse" },
      { label: "Zeithorizont", value: "Erste Verbesserungen in 4–12 Wochen" },
      { label: "Preisrahmen", value: "ab ca. 800 € einmalig oder monatlich" },
    ],
  },
  intro: {
    heading: "Was ist Lokales SEO und warum ist es für Bayreuth entscheidend?",
    paragraphs: [
      "Lokales SEO (Local Search Engine Optimization) ist die Summe aller Maßnahmen, die dafür sorgen, dass Ihr Unternehmen bei standortbezogenen Google-Suchanfragen sichtbar ist. 'Elektriker Bayreuth', 'Restaurant Innenstadt Bayreuth', 'Physiotherapie Bayreuth' – solche Suchanfragen haben lokale Kaufabsicht. Wer hier auf Seite 1 erscheint, gewinnt diese Kunden.",
      "Google zeigt bei lokalen Suchanfragen drei Kanäle: das Google Map Pack (die drei markierten Einträge oberhalb der organischen Ergebnisse), die organischen Suchergebnisse und bezahlte Anzeigen. Lokales SEO zielt auf Sichtbarkeit in allen drei Bereichen – mit besonderem Fokus auf das Map Pack, das die meiste Klickrate erzielt.",
      "Die technischen Grundlagen sind bekannt, die Umsetzung entscheidend: ein vollständig optimiertes Google Business Profil, konsistente NAP-Daten (Name, Adresse, Telefon), strukturierte Daten auf der Website und lokale Keywords in Titeln, Beschreibungen und Inhalten.",
    ],
  },
  deliverables: {
    heading: "Was lokales SEO-Setup bei Cogniiq umfasst",
    items: [
      "Google Business Profil vollständige Optimierung",
      "NAP-Konsistenz: Name, Adresse, Telefon korrekt und einheitlich",
      "Lokale Keyword-Recherche für Bayreuth und Oberfranken",
      "On-Page Optimierung: Titel, Beschreibungen, Überschriften",
      "Strukturierte Daten (Schema.org LocalBusiness, Service, FAQ)",
      "Google Search Console Einrichtung und Monitoring",
      "Core Web Vitals Optimierung für bessere Rankings",
      "Interne Verlinkungsstruktur für topische Autorität",
      "Lokale Citation-Bereinigung bei relevanten Verzeichnissen",
      "Monatliches Ranking-Reporting auf Wunsch",
    ],
  },
  localRelevance: {
    heading: "Lokales SEO in der Bayreuther Wettbewerbslandschaft",
    paragraphs: [
      "In Bayreuth ist das Suchvolumen für viele lokale Keywords überschaubar – aber der Wettbewerb ist oft gering genug, dass gut optimierte Einträge schnell auf Seite 1 gelangen. Das macht lokales SEO für Bayreuther Betriebe besonders rentabel: geringerer Aufwand, direkter Effekt.",
      "Branchen wie Handwerk, Praxen, Gastronomie und Dienstleister profitieren am stärksten. Suchanfragen mit lokalem Bezug haben hohe Kaufabsicht – der Nutzer, der 'Zahnarzt Bayreuth Notfall' googelt, sucht sofort Hilfe. Wer hier sichtbar ist, gewinnt direkte Anfragen.",
      "Cogniiq kennt die lokale Suchlandschaft in Bayreuth und Oberfranken aus eigener Erfahrung. Wir optimieren nicht nach allgemeinen Checklisten, sondern nach den spezifischen Suchdaten und Wettbewerbssituationen in Ihrem Marktsegment.",
    ],
  },
  faq: [
    {
      question: "Was ist der Unterschied zwischen lokalem SEO und allgemeinem SEO?",
      answer:
        "Allgemeines SEO zielt auf überregionale oder nationale Sichtbarkeit. Lokales SEO fokussiert auf standortbezogene Suchanfragen mit dem Ortsnamen (z. B. 'Bayreuth') oder standortbasierte Suchanfragen ohne Ortsangabe (z. B. 'Elektriker in der Nähe').",
    },
    {
      question: "Wie wichtig ist das Google Business Profil?",
      answer:
        "Es ist der wichtigste einzelne Faktor im lokalen SEO. Ein vollständig ausgefülltes und regelmäßig gepflegtes Google Business Profil verbessert die Sichtbarkeit im Map Pack, zeigt Öffnungszeiten, Telefonnummer und Kundenbewertungen.",
    },
    {
      question: "Wie lange dauert es, bis lokales SEO Ergebnisse zeigt?",
      answer:
        "Erste Verbesserungen sind in der Regel nach 4–8 Wochen messbar. Signifikante Rankings in hart umkämpften Kategorien können 3–6 Monate benötigen. Viele Bayreuther Nischen zeigen schneller Resultate.",
    },
    {
      question: "Brauche ich monatliche SEO-Betreuung?",
      answer:
        "Ein einmaliges Setup ist ein guter Start. Für nachhaltige Ergebnisse und wachsende Rankings ist laufende Betreuung empfehlenswert – monatliches Monitoring, Content-Updates und Reaktion auf Algorithmus-Änderungen.",
    },
    {
      question: "Was kosten lokale SEO-Maßnahmen in Bayreuth?",
      answer:
        "Einmaliges SEO-Setup (Google Business, On-Page, strukturierte Daten): ab ca. 800 €. Laufende monatliche Betreuung: ab ca. 250 € / Monat. Detailliertes Angebot nach Erstgespräch.",
    },
    {
      question: "Helfen Bewertungen beim lokalen SEO?",
      answer:
        "Ja. Anzahl und Qualität der Google-Bewertungen sind ein direkter Rankingfaktor im Map Pack. Cogniiq hilft bei der Strategie zum systematischen Aufbau von Kundenbewertungen.",
    },
    {
      question: "Was sind strukturierte Daten und warum sind sie wichtig?",
      answer:
        "Strukturierte Daten (Schema.org) sind maschinenlesbare Informationen, die Google helfen, Branche, Standort, Öffnungszeiten und Leistungen korrekt einzuordnen. Sie verbessern die Darstellung in den Suchergebnissen und sind ein wichtiger lokaler Rankingfaktor.",
    },
    {
      question: "Kann lokales SEO ohne neue Website durchgeführt werden?",
      answer:
        "Einige Maßnahmen (Google Business, Citations, strukturierte Daten) sind unabhängig von der Website. Für vollständige On-Page Optimierung ist Zugang zur Website nötig.",
    },
    {
      question: "Arbeitet Cogniiq auch mit bestehenden Websites?",
      answer:
        "Ja. Wir können lokales SEO-Setup auf bestehende Websites anwenden – ohne Relaunch, ohne Design-Änderungen.",
    },
    {
      question: "Wie messe ich den Erfolg von lokalem SEO?",
      answer:
        "Über Google Search Console (Impressionen, Klicks, Rankings), Google Business Insights (Profilaufrufe, Klicks auf Telefonnummer, Routenplanung) und Analytics (organischer Traffic, Anfragen-Ursprung).",
    },
  ],
  internalLinks: [
    { label: "Webdesign Bayreuth", href: "/bayreuth/webdesign" },
    { label: "Website erstellen Bayreuth", href: "/bayreuth/website-erstellen" },
    { label: "Webdesign Kosten Bayreuth", href: "/bayreuth/webdesign-kosten" },
    { label: "Website Relaunch Bayreuth", href: "/bayreuth/website-relaunch" },
    { label: "Landingpage Bayreuth", href: "/bayreuth/landingpage" },
    { label: "Alle Leistungen", href: "/leistungen" },
  ],
};

export function LokalesSEOBayreuth() {
  return <ClusterPage config={config} />;
}
