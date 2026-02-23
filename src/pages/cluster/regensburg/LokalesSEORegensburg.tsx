import { ClusterPage } from "@/components/ClusterPage";
import type { ClusterPageConfig } from "@/components/ClusterPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const base = BUSINESS_INFO.website;

const config: ClusterPageConfig = {
  route: "/regensburg/lokales-seo",
  city: "Regensburg",
  citySlug: "regensburg",
  cityHub: "/regensburg",
  topic: "Lokales SEO",
  seo: {
    title: "Lokales SEO Regensburg – Google-Sichtbarkeit für lokale Unternehmen | Cogniiq",
    description:
      "Lokales SEO in Regensburg: Cogniiq optimiert Ihre lokale Sichtbarkeit bei Google. Google Business Profil, strukturierte Daten, lokale Keywords – für nachhaltiges Ranking in Regensburg.",
    canonical: `${base}/regensburg/lokales-seo`,
    keywords:
      "Lokales SEO Regensburg, Local SEO Regensburg, Google Business Regensburg, SEO Agentur Regensburg, lokale Suchmaschinenoptimierung Regensburg",
  },
  hero: {
    h1: "Lokales SEO in Regensburg – Mehr Sichtbarkeit bei Google",
    lead: "Wenn potenzielle Kunden in Regensburg nach Ihrem Angebot suchen, müssen Sie gefunden werden. Lokales SEO sorgt dafür – besonders wichtig in einer Stadt mit hohem lokalem Suchvolumen durch Tourismus und wachsenden Mittelstand.",
    trustTags: ["Regensburg", "Google Business", "Map Pack", "Strukturierte Daten"],
    ctaLabel: "Kostenloses Erstgespräch",
  },
  tldr: {
    heading: "Kurzüberblick: Lokales SEO in Regensburg",
    items: [
      { label: "Für wen", value: "Gastronomie, Tourismus, Dienstleister, KMU" },
      { label: "Ziel", value: "Top-3 Google Maps & organische Ergebnisse Regensburg" },
      { label: "Zeithorizont", value: "Erste Verbesserungen in 4–10 Wochen" },
      { label: "Preisrahmen", value: "ab ca. 800 € einmalig" },
    ],
  },
  intro: {
    heading: "Warum lokales SEO in Regensburg besonders wirksam ist",
    paragraphs: [
      "Regensburg hat durch seine starke touristische Position und die wachsende Stadtbevölkerung ein überdurchschnittlich hohes Volumen an lokalen Suchanfragen. 'Restaurant Regensburg', 'Hotel Regensburg Altstadt', 'Zahnarzt Regensburg' – solche Suchanfragen haben unmittelbare Kaufabsicht und werden täglich tausende Male gestellt.",
      "Wer im Google Map Pack (den drei markierten Einträgen oben in den Suchergebnissen) erscheint, erzielt die höchste Klickrate. Das Map Pack wird von Google Business Profil-Qualität, Bewertungsanzahl, NAP-Konsistenz und Website-SEO beeinflusst – Faktoren, die gezielt optimiert werden können.",
      "Lokales SEO ist in Regensburg für viele Branchen die kosteneffizienteste Form der Neukundengewinnung. Einmal aufgebaut, liefert es dauerhaft organische Anfragen – ohne laufende Werbeausgaben.",
    ],
  },
  deliverables: {
    heading: "Was lokales SEO-Setup bei Cogniiq umfasst",
    items: [
      "Google Business Profil vollständige Optimierung",
      "NAP-Konsistenz: Name, Adresse, Telefon korrekt und einheitlich",
      "Lokale Keyword-Recherche für Regensburg und Oberpfalz",
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
    heading: "Lokales SEO in der Regensburger Wettbewerbslandschaft",
    paragraphs: [
      "Regensburg hat eine einzigartige SEO-Dynamik: Touristisch stark frequentierte Branchen (Gastronomie, Hotellerie, Freizeitangebote) konkurrieren um hochwertige lokale Suchanfragen mit messbarem Umsatzpotenzial. Gleichzeitig gibt es lokale Nischenmärkte – Handwerk, Dienstleister, Fachbetriebe – mit geringem Wettbewerb und schnellen Ranking-Resultaten.",
      "Für beide Gruppen gilt: Lokales SEO ist die Grundlage. Ohne optimiertes Google Business Profil, strukturierte Daten und lokale Keyword-Strategie bleibt Sichtbarkeit dem Zufall überlassen.",
      "Cogniiq analysiert die spezifischen Suchdaten für Ihren Markt in Regensburg und definiert eine Strategie, die auf reale Suchvolumina und Wettbewerbssituationen in Ihrer Branche ausgerichtet ist.",
    ],
  },
  faq: [
    {
      question: "Warum ist lokales SEO in Regensburg besonders wertvoll?",
      answer: "Wegen des hohen lokalen Suchvolumens durch Tourismus und wachsender Stadtbevölkerung. Lokale Suchanfragen haben hohe Kaufabsicht – wer sichtbar ist, gewinnt direkt Kunden.",
    },
    {
      question: "Wie wichtig ist das Google Business Profil?",
      answer: "Es ist der wichtigste einzelne Faktor im lokalen SEO. Ein vollständig optimiertes Profil verbessert die Sichtbarkeit im Map Pack, zeigt Öffnungszeiten und Bewertungen.",
    },
    {
      question: "Wie lange dauert es, bis lokales SEO Ergebnisse zeigt?",
      answer: "Erste Verbesserungen nach 4–8 Wochen. Signifikante Rankings in harten Kategorien nach 3–6 Monaten. Viele Regensburger Nischen reagieren schneller.",
    },
    {
      question: "Brauche ich monatliche SEO-Betreuung?",
      answer: "Einmaliges Setup ist ein guter Start. Für nachhaltige Ergebnisse ist laufende Betreuung empfehlenswert.",
    },
    {
      question: "Was kosten lokale SEO-Maßnahmen in Regensburg?",
      answer: "Einmaliges SEO-Setup ab ca. 800 €. Monatliche Betreuung ab ca. 250 € / Monat.",
    },
    {
      question: "Helfen Kundenbewertungen beim lokalen SEO?",
      answer: "Ja. Anzahl und Bewertungsqualität sind direkter Map-Pack-Rankingfaktor. Cogniiq hilft bei der Strategie zum systematischen Aufbau.",
    },
    {
      question: "Was sind strukturierte Daten?",
      answer: "Maschinenlesbare Informationen, die Google helfen, Branche, Standort und Leistungen korrekt einzuordnen. Verbessern Darstellung und lokale Rankings.",
    },
    {
      question: "Kann lokales SEO ohne neuen Website-Relaunch durchgeführt werden?",
      answer: "Ja. Viele Maßnahmen können auf bestehende Websites angewendet werden.",
    },
    {
      question: "Wie messe ich den Erfolg?",
      answer: "Google Search Console, Google Business Insights und Analytics 4 liefern klare Kennzahlen: Impressionen, Klicks, Conversion-Rate.",
    },
    {
      question: "Wie starte ich?",
      answer: "Kostenloses Erstgespräch – Analyse Ihrer aktuellen lokalen Sichtbarkeit und Handlungsempfehlung.",
    },
  ],
  internalLinks: [
    { label: "Webdesign Regensburg", href: "/regensburg/webdesign" },
    { label: "Website erstellen Regensburg", href: "/regensburg/website-erstellen" },
    { label: "Webdesign Kosten Regensburg", href: "/regensburg/webdesign-kosten" },
    { label: "Website Relaunch Regensburg", href: "/regensburg/website-relaunch" },
    { label: "Landingpage Regensburg", href: "/regensburg/landingpage" },
    { label: "Alle Leistungen", href: "/leistungen" },
  ],
};

export function LokalesSEORegensburg() {
  return <ClusterPage config={config} />;
}
