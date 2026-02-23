import { ClusterPage } from "@/components/ClusterPage";
import type { ClusterPageConfig } from "@/components/ClusterPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const base = BUSINESS_INFO.website;

const config: ClusterPageConfig = {
  route: "/regensburg/landingpage",
  city: "Regensburg",
  citySlug: "regensburg",
  cityHub: "/regensburg",
  topic: "Landingpage",
  seo: {
    title: "Landingpage erstellen lassen Regensburg – Conversion-optimiert | Cogniiq",
    description:
      "Landingpage Regensburg: Cogniiq entwickelt conversion-optimierte Landingpages für Unternehmen in Regensburg. Für Google Ads, organischen Traffic und spezifische Kampagnenziele.",
    canonical: `${base}/regensburg/landingpage`,
    keywords:
      "Landingpage Regensburg, Landingpage erstellen Regensburg, Landing Page Regensburg, Conversion Landingpage Regensburg",
  },
  hero: {
    h1: "Landingpage erstellen lassen in Regensburg",
    lead: "Conversion-optimierte Landingpages für Unternehmen in Regensburg – für Google Ads, organischen Traffic und spezifische Kampagnenziele. Fokussiert, schnell, messbar.",
    trustTags: ["Regensburg", "Conversion-Fokus", "Google Ads ready", "DSGVO-konform"],
    ctaLabel: "Kostenloses Erstgespräch",
  },
  tldr: {
    heading: "Kurzüberblick: Landingpage in Regensburg",
    items: [
      { label: "Für wen", value: "Ads-Kampagnen, Lead-Generierung, Saisonaktionen" },
      { label: "Ziel", value: "Höhere Conversion-Rate, weniger Budget-Verlust" },
      { label: "Umsetzungsdauer", value: "5–10 Werktage" },
      { label: "Preisrahmen", value: "ab ca. 800 €" },
    ],
  },
  intro: {
    heading: "Landingpages für den Regensburger Markt",
    paragraphs: [
      "Google Ads in Regensburg sind besonders effektiv, wenn Traffic auf thematisch präzise Landingpages geleitet wird. Ein Regensburger Gastronomiebetrieb, der auf 'Restaurant Regensburg buchen' Anzeigen schaltet und auf seine allgemeine Startseite verlinkt, verschwendet konsequent Budget.",
      "Eine dedizierte Landingpage mit klarem Fokus auf das Kampagnenziel, lokalem Bezug zu Regensburg und einem einfachen Buchungsformular konvertiert messbar besser. Das gilt für Gastronomie, Tourismus, Dienstleister und Handwerk gleichermaßen.",
      "Cogniiq entwickelt Landingpages nach bewährten Conversion-Prinzipien: klare Headline, sofortiger lokaler Bezug zu Regensburg, sozialer Beweis, minimale Ablenkung, einfaches Formular. Jede Landingpage ist mit Analytics und Conversion-Tracking ausgestattet.",
    ],
  },
  deliverables: {
    heading: "Was eine Landingpage von Cogniiq enthält",
    items: [
      "Conversion-optimiertes Single-Page Design",
      "Klar formulierte Headline mit lokalem Bezug zu Regensburg",
      "Trust-Signale: Referenzen, Fakten, Bewertungen",
      "Zentrales Kontaktformular oder Buchungs-CTA",
      "Mobile-First, Ladezeit unter 2s",
      "Google Analytics 4 Event-Tracking",
      "DSGVO-konformes Setup",
      "A/B-ready Grundstruktur",
      "Optional: CRM-Anbindung, E-Mail-Automatisierung",
      "Übergabe mit Bearbeitungszugang",
    ],
  },
  localRelevance: {
    heading: "Landingpages für Regensburg: Tourismus und lokale Dienstleister",
    paragraphs: [
      "Regensburg hat durch seinen starken Tourismus und die lebhafte Altstadt ein überdurchschnittlich hohes lokales Suchaufkommen. Für Gastronomiebetriebe, Hotels und Tourismusdienstleister ist eine auf Touristen-Suchanfragen optimierte Landingpage ein direktes Umsatzinstrument.",
      "Für lokale Dienstleister funktioniert das Prinzip genauso: Wer bei 'Klempner Regensburg express' oder 'Reinigung Regensburg buchen' eine fokussierte Landingpage hat, gewinnt Leads, die ohne diese Seite an Wettbewerber gehen würden.",
      "Cogniiq entwickelt Landingpages mit Verständnis für die Regensburger Zielgruppe – mit optionalen Vor-Ort-Terminen in Regensburg.",
    ],
  },
  faq: [
    {
      question: "Was ist der Unterschied zwischen Landingpage und Website?",
      answer: "Website = vollständige Unternehmensdarstellung. Landingpage = eine einzige Aufgabe, ein einziger CTA, kein ablenkende Navigation.",
    },
    {
      question: "Für welche Zwecke eignet sich eine Landingpage in Regensburg?",
      answer: "Google Ads, organischer SEO-Traffic für spezifische Keywords, Event-Registrierungen, Saisonaktionen, spezifische Angebotsseiten.",
    },
    {
      question: "Wie schnell ist eine Landingpage fertig?",
      answer: "5–10 Werktage. Bei vorab verfügbaren Texten und Materialien auch schneller.",
    },
    {
      question: "Was kostet eine Landingpage in Regensburg?",
      answer: "Ab ca. 800 €. Mit erweitertem Tracking und CRM-Integration: 1.200 € – 2.500 €.",
    },
    {
      question: "Kann die Landingpage mit Google Ads verknüpft werden?",
      answer: "Ja. Conversion-Tracking für Google Ads ist standardmäßig eingerichtet.",
    },
    {
      question: "Liefert Cogniiq auch die Texte?",
      answer: "Ja – conversion-optimiert, mit lokalem Bezug auf Regensburg.",
    },
    {
      question: "Kann ich die Landingpage selbst anpassen?",
      answer: "Ja, kleinere Textanpassungen sind über das CMS möglich.",
    },
    {
      question: "Wie messe ich den Erfolg?",
      answer: "Analytics 4 trackt Seitenaufrufe, Verweildauer und Conversion-Events. Auf Wunsch einfaches Dashboard.",
    },
    {
      question: "Kann die Landingpage zur vollständigen Website ausgebaut werden?",
      answer: "Ja. Die Landingpage kann als Basis für eine vollständige Website dienen.",
    },
    {
      question: "Wie starte ich?",
      answer: "Kostenloses Erstgespräch – 30–45 Minuten, remote oder vor Ort in Regensburg.",
    },
  ],
  internalLinks: [
    { label: "Webdesign Regensburg", href: "/regensburg/webdesign" },
    { label: "Website erstellen Regensburg", href: "/regensburg/website-erstellen" },
    { label: "Webdesign Kosten Regensburg", href: "/regensburg/webdesign-kosten" },
    { label: "Website Relaunch Regensburg", href: "/regensburg/website-relaunch" },
    { label: "Lokales SEO Regensburg", href: "/regensburg/lokales-seo" },
    { label: "Alle Leistungen", href: "/leistungen" },
  ],
};

export function LandingpageRegensburg() {
  return <ClusterPage config={config} />;
}
