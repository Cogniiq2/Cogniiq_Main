import { ClusterPage } from "@/components/ClusterPage";
import type { ClusterPageConfig } from "@/components/ClusterPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const base = BUSINESS_INFO.website;

const config: ClusterPageConfig = {
  route: "/muenchen/landingpage",
  city: "München",
  citySlug: "muenchen",
  cityHub: "/muenchen",
  topic: "Landingpage",
  seo: {
    title: "Landingpage erstellen lassen München – Conversion-optimiert | Cogniiq",
    description:
      "Landingpage München: Cogniiq entwickelt conversion-optimierte Landingpages für Unternehmen in München. Für Google Ads, SEA und organischen Traffic – technisch und inhaltlich auf höchstem Niveau.",
    canonical: `${base}/muenchen/landingpage`,
    keywords:
      "Landingpage München, Landingpage erstellen München, Landing Page München, Google Ads Landingpage München, Conversion Landingpage München",
  },
  hero: {
    h1: "Landingpage erstellen lassen in München",
    lead: "In München kostet jeder verschwendete Klick mehr. Conversion-optimierte Landingpages senken den Cost-per-Lead messbar – für Google Ads, organischen Traffic und spezifische Kampagnenziele.",
    trustTags: ["München", "Conversion-Fokus", "Google Ads ready", "A/B-ready"],
    ctaLabel: "Kostenloses Erstgespräch",
  },
  tldr: {
    heading: "Kurzüberblick: Landingpage in München",
    items: [
      { label: "Für wen", value: "Ads-Kampagnen, Lead-Generierung, B2B-Akquise" },
      { label: "Ziel", value: "Niedrigerer Cost-per-Lead, höhere Conversion" },
      { label: "Umsetzungsdauer", value: "5–10 Werktage" },
      { label: "Preisrahmen", value: "ab ca. 900 €" },
    ],
  },
  intro: {
    heading: "Warum Landingpages in München besonders wichtig sind",
    paragraphs: [
      "Google Ads in München gehören zu den teuersten in Deutschland. Klickpreise für lokale Suchanfragen sind messbar höher als in anderen Städten. Wer in diesem Umfeld Traffic auf eine generische Startseite schickt, verbrennt Budget – wer auf eine fokussierte Landingpage leitet, gewinnt messbar mehr Leads aus demselben Budget.",
      "Eine Landingpage hat keine ablenkende Navigation, keine irrelevanten Inhalte – nur den direkten Weg von der Suchanfrage zur Kontaktaufnahme. Das ist in München kein Optimierungs-Nice-to-have, sondern die Grundvoraussetzung für wirtschaftlich sinnvolle Paid-Kampagnen.",
      "Cogniiq entwickelt Landingpages nach bewährten Conversion-Prinzipien: klare Headline, sofortiger Mehrwert, Vertrauen durch Fakten, minimales Formular, schnelle Ladezeit. Jede Landingpage wird mit vollständigem Analytics und Conversion-Tracking ausgeliefert.",
    ],
  },
  deliverables: {
    heading: "Was eine Cogniiq Landingpage in München enthält",
    items: [
      "Conversion-optimiertes Single-Page Design auf Premium-Niveau",
      "Headline mit direktem Bezug zur Suchanfrage und Zielgruppe in München",
      "Trust-Signale: Referenzen, Kennzahlen, Qualitätsnachweise",
      "Fokussiertes Kontaktformular oder direkter CTA",
      "Ladezeit unter 1,5s für maximale Google Ads Qualitätsbewertung",
      "Google Analytics 4 Conversion-Tracking vollständig eingerichtet",
      "DSGVO-konformes Setup",
      "A/B-Test-ready Grundstruktur",
      "Optional: CRM-Anbindung, Hubspot-Integration, Zapier-Workflow",
      "Übergabe mit Bearbeitungszugang",
    ],
  },
  localRelevance: {
    heading: "Landingpages für den Münchner Markt",
    paragraphs: [
      "Münchner Nutzer haben hohe Erwartungen an digitale Qualität. Eine Landingpage, die bei weniger kompetitiven Märkten ausreicht, verliert in München gegen professionell optimierte Konkurrenzseiten. Design, Ladezeit und Botschaft müssen auf Münchner Niveau sein.",
      "Besonders für B2B-Dienstleister, Berater, Agenturen und Professional Services in München sind Landingpages das wichtigste Conversion-Instrument. Der Cost-per-Lead durch Paid Search ist hier hoch – eine schwach convertende Landingpage ist direkter Umsatzverlust.",
      "Cogniiq entwickelt Landingpages mit dem nötigen Verständnis für den Münchner Markt. Remote und bei Bedarf persönlich vor Ort in München.",
    ],
  },
  faq: [
    {
      question: "Warum ist eine Landingpage in München besonders wichtig?",
      answer: "Wegen der höheren Klickpreise bei Google Ads in München. Jeder Klick muss optimal konvertiert werden – eine fokussierte Landingpage senkt den Cost-per-Lead messbar.",
    },
    {
      question: "Für welche Branchen in München eignen sich Landingpages?",
      answer: "B2B-Dienstleister, Berater, Professional Services, Gastronomie, Hotellerie, Handwerk, Immobilien – überall wo Paid Traffic oder spezifische Suchanfragen gezielt konvertiert werden sollen.",
    },
    {
      question: "Wie schnell ist eine Landingpage fertig?",
      answer: "5–10 Werktage. Bei vorliegenden Texten und Materialien auch schneller.",
    },
    {
      question: "Was kostet eine Landingpage in München?",
      answer: "Ab ca. 900 €. Mit erweitertem Tracking, CRM-Integration und A/B-Test-Setup: 1.500 € – 3.000 €.",
    },
    {
      question: "Wie hoch ist die Google Ads Qualitätsbewertung für eine schnelle Landingpage?",
      answer: "Google bewertet Landingpage-Erfahrung als direkten Faktor im Quality Score – was den Klickpreis senkt. Ladezeiten unter 2s und hohe Relevanz verbessern den Quality Score messbar.",
    },
    {
      question: "Liefert Cogniiq auch die Texte?",
      answer: "Ja – conversion-optimiert, mit Fokus auf Münchner Zielgruppen und Suchabsicht.",
    },
    {
      question: "Kann die Landingpage selbst angepasst werden?",
      answer: "Ja, kleinere Änderungen sind über das CMS möglich.",
    },
    {
      question: "Wie messe ich den Erfolg?",
      answer: "Analytics 4 und Google Ads Conversion-Tracking liefern exakte Daten: Conversion-Rate, Cost-per-Lead, Absprungrate.",
    },
    {
      question: "Kann die Landingpage zur vollständigen Website ausgebaut werden?",
      answer: "Ja. Die Landingpage kann als Fundament für eine vollständige Unternehmenswebsite dienen.",
    },
    {
      question: "Wie starte ich?",
      answer: "Kostenloses Erstgespräch – remote oder vor Ort in München.",
    },
  ],
  internalLinks: [
    { label: "Webdesign München", href: "/muenchen/webdesign" },
    { label: "Website erstellen München", href: "/muenchen/website-erstellen" },
    { label: "Webdesign Kosten München", href: "/muenchen/webdesign-kosten" },
    { label: "Website Relaunch München", href: "/muenchen/website-relaunch" },
    { label: "Lokales SEO München", href: "/muenchen/lokales-seo" },
    { label: "Alle Leistungen", href: "/leistungen" },
  ],
};

export function LandingpageMuenchen() {
  return <ClusterPage config={config} />;
}
