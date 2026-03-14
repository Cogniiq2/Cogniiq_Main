import { NationalIndustryPage } from "@/components/NationalIndustryPage";
import type { NationalIndustryPageConfig } from "@/components/NationalIndustryPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const config: NationalIndustryPageConfig = {
  seo: {
    title: "Webdesign für Immobilienmakler & Immobilienbüros | Cogniiq",
    description: "Webdesign für Immobilienmakler: Premium-Website mit Exposé-Präsentation, Anfrage-Automatisierung und Local SEO. Mehr qualifizierte Leads für Ihr Immobilienbüro.",
    canonical: `${BUSINESS_INFO.website}/webdesign-immobilien`,
    keywords: "Webdesign Immobilien, Immobilienmakler Website, Homepage Makler, Webdesign Immobilienbüro, SEO Immobilien",
  },
  h1: "Webdesign für Immobilienmakler & Immobilienbüros",
  tagline: "Immobilien · Premium-Webdesign · Lead-Generierung",
  intro: "Immobilien werden über Vertrauen verkauft – und Vertrauen entsteht zuerst online. Eine professionelle Makler-Website mit klarer Positionierung, Exposé-Präsentation und automatisierter Lead-Erfassung ist der Schlüssel zu mehr Anfragen.",
  serviceSlug: "leistungen",
  serviceLabel: "Webdesign Leistungen",
  costLink: "/kosten-webdesign",
  costLinkLabel: "Webdesign Kosten",
  problems: [
    {
      title: "Mangelnde Online-Sichtbarkeit bei lokalen Suchanfragen",
      description: "Kaufinteressenten suchen bei Google nach 'Immobilienmakler [Stadt]'. Ohne Local SEO erscheinen Sie nicht – und vergeben wertvolle Leads an Konkurrenten.",
    },
    {
      title: "Exposés nicht optimal präsentiert",
      description: "Hochwertige Immobilien verdienen eine hochwertige digitale Präsentation. Schlechte Bildqualität, unübersichtliche Exposés oder fehlende Filter schrecken Interessenten ab.",
    },
    {
      title: "Anfragen nicht automatisiert erfasst",
      description: "Anfragen kommen per Telefon, E-Mail und Formular – aber ohne System gehen sie verloren oder werden zu spät bearbeitet. Interessenten wenden sich an schnellere Makler.",
    },
    {
      title: "Website entspricht nicht dem Premium-Anspruch",
      description: "Eine veraltete Website passt nicht zum Premium-Image, das Immobilienmakler aufbauen müssen, um hochwertige Objekte und Käufer zu gewinnen.",
    },
    {
      title: "Kein Vertrauensaufbau vor dem Erstgespräch",
      description: "Bevor ein Eigentümer seinen Makler auswählt, recherchiert er online. Fehlen Referenzen, Bewertungen und professionelle Darstellung, entscheidet er sich anders.",
    },
    {
      title: "Besichtigungstermine ineffizient koordiniert",
      description: "Telefonische Terminkoordination für Besichtigungen kostet täglich wertvolle Zeit. Automatisierte Terminbuchung löst dieses Problem dauerhaft.",
    },
  ],
  solution: {
    headline: "Premium-Webdesign, das Immobilien und Makler optimal präsentiert.",
    text: "Cogniiq entwickelt Immobilien-Websites, die Vertrauen aufbauen, Exposés professionell präsentieren und Leads automatisch erfassen. Das Ergebnis: mehr qualifizierte Anfragen mit weniger manuellem Aufwand.",
  },
  benefits: [
    "Exposé-Präsentation mit Bildgalerie und Filterfunktion",
    "Automatische Lead-Erfassung aus Anfrage-Formularen",
    "Local SEO: gefunden bei 'Immobilienmakler [Stadt]'",
    "Premium-Design, das Ihren Markenwert widerspiegelt",
    "Automatische Besichtigungstermin-Koordination",
    "CRM-Integration für lückenloses Lead-Management",
    "DSGVO-konforme Verarbeitung von Interessentendaten",
  ],
  workflow: {
    title: "Immobilien-Website mit automatisierter Lead-Erfassung",
    steps: [
      {
        step: "Schritt 1",
        title: "Positioning & Design",
        description: "Analyse Ihrer Positionierung, Zielgruppe und Wettbewerbsumfeld. Premium-Design, das Ihren Markenwert und Ihre Expertise kommuniziert.",
      },
      {
        step: "Schritt 2",
        title: "Exposés & Lead-System",
        description: "Exposé-Darstellung, automatisierte Lead-Erfassung, CRM-Integration und Local SEO-Setup für maximale Sichtbarkeit in Ihrer Region.",
      },
      {
        step: "Schritt 3",
        title: "Automatisierung & Wachstum",
        description: "Integration von Terminbuchung, automatischer Interessenten-Kommunikation und optionalem KI-Telefonassistenten für verpasste Anrufe.",
      },
    ],
  },
  cityLinks: [
    { label: "Webdesign Immobilien Bayreuth", href: "/webdesign-immobilien-bayreuth" },
    { label: "Webdesign Immobilien München", href: "/webdesign-immobilien-muenchen" },
    { label: "Webdesign Immobilien Regensburg", href: "/webdesign-immobilien-regensburg" },
    { label: "Webdesign Bayern", href: "/bayern" },
    { label: "Webdesign Deutschland", href: "/webdesign-agentur-deutschland" },
  ],
  relatedLinks: [
    { label: "Automatisierung Immobilien", href: "/automatisierung-immobilien" },
    { label: "KI Telefonassistent", href: "/ki-telefonassistent" },
    { label: "Kosten Webdesign", href: "/kosten-webdesign" },
    { label: "Webdesign Arzt", href: "/webdesign-arzt" },
    { label: "Webdesign Hotel", href: "/webdesign-hotel" },
  ],
  faq: [
    {
      question: "Was sollte eine Immobilien-Website unbedingt enthalten?",
      answer: "Eine professionelle Immobilien-Website braucht: Exposé-Präsentation mit Filterfunktion, Anfrage-Formulare, Makler-Profil mit Referenzen, Google Business Optimierung und Local SEO. Terminbuchung und CRM-Integration erhöhen den ROI deutlich.",
    },
    {
      question: "Kann die Website Exposés automatisch anzeigen?",
      answer: "Ja. Wir integrieren Exposé-Darstellungen mit Bildgalerie, Standortkarte, Ausstattungsdetails und Anfrage-Formular. Neue Exposés können einfach selbst hinzugefügt werden.",
    },
    {
      question: "Wie hilft Local SEO Immobilienmaklern?",
      answer: "Lokale Käufer und Verkäufer suchen gezielt nach Maklern in ihrer Stadt. Mit Local SEO erscheinen Sie bei Suchen wie 'Immobilienmakler München' auf Seite 1 – das erhöht qualifizierte Anfragen messbar.",
    },
    {
      question: "Kann die Website mit einem CRM-System verbunden werden?",
      answer: "Ja. Wir integrieren Anfragen aus der Website direkt in Ihr CRM – ob OnOffice, Propstack oder andere Systeme. Kein Lead geht mehr verloren.",
    },
    {
      question: "Was kostet eine Immobilien-Website?",
      answer: "Immobilien-Websites beginnen bei ca. 3.000 €. Mit CRM-Integration, Exposé-System und erweitertem SEO typischerweise 4.500–8.000 €. Genaues Angebot nach kostenlosem Erstgespräch.",
    },
  ],
};

export function WebdesignImmobilien() {
  return <NationalIndustryPage config={config} />;
}
