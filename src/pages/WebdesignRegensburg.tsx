import { IndustryPage } from "@/components/IndustryPage";
import type { IndustryPageConfig } from "@/components/IndustryPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const base = BUSINESS_INFO.website;

const config: IndustryPageConfig = {
  route: "/regensburg/webdesign",
  industry: "Webdesign",
  industrySlug: "webdesign",
  city: "Regensburg",
  citySlug: "regensburg",
  cityHub: "/regensburg",
  seo: {
    title: "Webdesign Agentur Regensburg | Website erstellen lassen – Cogniiq",
    description:
      "Webdesign Agentur in Regensburg: Cogniiq entwickelt individuelle, SEO-optimierte und DSGVO-konforme Websites für Unternehmen in Regensburg und der Oberpfalz. Core Web Vitals, Local SEO, Conversion-Optimierung.",
    canonical: `${base}/regensburg/webdesign`,
    keywords:
      "Webdesign Regensburg, Webdesign Agentur Regensburg, Website erstellen Regensburg, Website Agentur Regensburg, Homepage erstellen Regensburg, SEO Webdesign Regensburg",
  },
  hero: {
    trustTags: ["DSGVO · Core Web Vitals · Persönliche Betreuung · Region Regensburg"],
    ctaLabel: "Kostenloses Erstgespräch",
  },
  intro: {
    h1: "Webdesign Agentur in Regensburg",
    lead: "Individuelle, schnelle und SEO-optimierte Websites für Unternehmen in Regensburg und der Oberpfalz. Vom Altstadtbetrieb bis zum wachsenden Dienstleister – digital sichtbar, lokal relevant, conversion-stark.",
  },
  engpaesse: [
    "Veraltete Website: Wettbewerber mit besserer Online-Präsenz gewinnen die Anfragen in Regensburg",
    "Keine Google-Sichtbarkeit bei lokalen Suchen wie 'Dienstleister Regensburg' oder 'Restaurant Regensburg Altstadt'",
    "Baukasten-Lösung lädt langsam, schlägt bei Core Web Vitals durch und belastet das Ranking",
    "DSGVO-Risiko: veraltete Datenschutzerklärung, fehlender Cookie-Consent, nicht rechtskonformes Impressum",
    "Mobile UX nicht vorhanden: Touristen und Einheimische springen auf dem Smartphone sofort ab",
    "Kein Tracking-Setup: Anfragenquelle unbekannt, keine Datenbasis für Entscheidungen",
  ],
  solutionSteps: [
    {
      step: "Schritt 1",
      title: "Analyse & Konzept",
      description:
        "Wir analysieren Ihren Wettbewerb in Regensburg, Ihre Zielgruppe und definieren Seitenstruktur, Conversion-Ziele und lokale SEO-Strategie. Fundiert, konkret, noch vor dem ersten Design-Pixel.",
    },
    {
      step: "Schritt 2",
      title: "Design & Umsetzung",
      description:
        "Individuelles Design – kein Template, kein Baukasten. Codiert mit modernen Web-Technologien für maximale Performance: Pagespeed unter 2s, Core Web Vitals grün, mobile-first.",
    },
    {
      step: "Schritt 3",
      title: "Local SEO & Go-Live",
      description:
        "On-Page SEO, Google Business Optimierung, strukturierte Daten, DSGVO-Setup und Analytics-Integration – alles inklusive. Launch mit Begleitung, Nachbetreuung auf Wunsch.",
    },
  ],
  workflow: {
    title: "Beispielprojekt: Gastronomie Regensburg Altstadt",
    trigger:
      "Ein Restaurant in der Regensburger Altstadt hatte eine veraltete Website ohne Mobiloptimierung. Touristen und Einheimische fanden das Restaurant kaum über Google – obwohl die Bewertungen exzellent waren.",
    process:
      "Cogniiq entwickelte eine neue Website mit Speisekarte, Online-Reservierung, lokalem SEO-Setup und strukturierten Daten. Ladezeit wurde drastisch reduziert, Google Business Profil vollständig optimiert.",
    result:
      "Deutlich mehr Tischreservierungen über die Website, verbesserte Sichtbarkeit bei 'Restaurant Regensburg Altstadt'. Direktbuchungen stiegen messbar, Abhängigkeit von Drittportalen sank.",
  },
  pakete: [
    {
      name: "Website Launch",
      tagline: "Professionelle Präsenz für Regensburg – schnell und solide",
      deliverables: [
        "Responsive Website (bis 6 Seiten)",
        "Individuelles Design nach Ihrer Marke",
        "On-Page SEO Grundoptimierung",
        "Google Business Profil Optimierung",
        "DSGVO-Seiten: Impressum, Datenschutz, Cookie-Consent",
        "Kontaktformular mit Bestätigungs-Mail",
        "Übergabe & Kurzschulung",
      ],
    },
    {
      name: "Website Wachstum",
      tagline: "Conversion & Local SEO für nachhaltiges Wachstum in Regensburg",
      deliverables: [
        "Alles aus Website Launch",
        "Erweiterte Seitenstruktur (bis 12 Seiten)",
        "Conversion-optimierte Texte & CTAs",
        "Lokale SEO-Strategie Regensburg/Oberpfalz",
        "Strukturierte Daten (Schema.org LocalBusiness)",
        "Google Analytics 4 & Search Console Setup",
        "Performance-Optimierung auf Core Web Vitals",
        "3 Monate Nachbetreuung",
      ],
    },
    {
      name: "Website Marktführer",
      tagline: "Marktführer-Position in Regensburg und der Oberpfalz",
      deliverables: [
        "Alles aus Website Wachstum",
        "Unbegrenzte Seitenstruktur & Unterseiten",
        "KI-gestützte Conversion-Optimierung",
        "Regionale SEO-Dominanz Oberpfalz",
        "Blog-/Content-Strategie für organische Reichweite",
        "Lokale Backlink-Strategie",
        "Integration KI-Telefonassistent & Automatisierung",
        "Laufende Betreuung & monatliches Reporting",
      ],
    },
  ],
  problems: [
    "Keine Sichtbarkeit bei lokalen Suchanfragen in Regensburg und Umgebung",
    "Langsame Ladezeit: schlechte Nutzererfahrung und schlechtere Google-Rankings",
    "DSGVO-Lücken: rechtliches Risiko für Betriebe, die personenbezogene Daten verarbeiten",
    "Kein Mobile-Fokus trotz hohem Smartphone-Anteil bei Touristen und Stadtbewohnern",
    "Fehlende strukturierte Daten: Google kann Branche und Standort nicht korrekt einordnen",
    "Keine Analytics: Investitionen in Marketing ohne messbare Datenbasis",
  ],
  services: [
    {
      icon: "web",
      title: "Webdesign Regensburg",
      description:
        "Individuelle Websites für Regensburger Unternehmen – responsive, schnell, conversion-stark. Für Gastronomie, Tourismus, Dienstleister, Handwerk und Mittelstand in der Oberpfalz.",
    },
    {
      icon: "zap",
      title: "Local SEO & Pagespeed",
      description:
        "Core Web Vitals Optimierung, strukturierte Daten, Google Business Profil und lokale Keyword-Strategie für maximale Sichtbarkeit in Regensburg und der gesamten Oberpfalz.",
    },
    {
      icon: "phone",
      title: "KI-Integration & Automatisierung",
      description:
        "Integration von KI-Telefonassistent und Automatisierungs-Workflows in die Website – für Betriebe, die Anfragen und Termine digital steuern möchten.",
    },
  ],
  useCases: [
    {
      title: "Gastronomie & Tourismusbetriebe",
      description:
        "Restaurant-Website mit Speisekarte, Reservierungsfunktion und lokalem SEO für Suchanfragen von Touristen und Einheimischen rund um die Regensburger Altstadt.",
    },
    {
      title: "Dienstleister & Handwerk",
      description:
        "Website für lokale Dienstleister in Regensburg: klar strukturiert, schnell ladend, mit Conversion-Funnel und Google-Sichtbarkeit für relevante lokale Suchanfragen.",
    },
    {
      title: "Arztpraxen & Therapeuten",
      description:
        "DSGVO-konforme Praxis-Website mit Online-Terminbuchung und Google Business Optimierung – für mehr Online-Sichtbarkeit bei 'Arzt Regensburg' und Fachgebietssuchen.",
    },
    {
      title: "Immobilien & Finanzdienstleister",
      description:
        "Premium-Webdesign für Regensburger Immobilienmakler und Finanzberater – mit Vertrauensaufbau durch Design, Referenzen und optimierter lokaler Suchmaschinenpräsenz.",
    },
    {
      title: "Einzelhandel & lokale Shops",
      description:
        "Online-Präsenz mit Produktübersicht oder Shop-Integration – für Regensburger Einzelhändler, die neben dem stationären Geschäft digital sichtbar sein wollen.",
    },
    {
      title: "Startups & Gründer in der Oberpfalz",
      description:
        "Skalierbare Website von Anfang an: professionell, SEO-ready und auf Wachstum ausgelegt – für Gründer, die in Regensburg und der Oberpfalz durchstarten.",
    },
  ],
  benefits: [
    "Mehr qualifizierte Anfragen aus Regensburg und der Oberpfalz durch bessere Google-Sichtbarkeit",
    "Messbar höhere Conversion-Rate durch strukturierte UX und klare Handlungsaufforderungen",
    "Rechtssicherheit durch vollständige DSGVO-Konformität inklusive aller Pflichtseiten",
    "Ladezeit unter 2 Sekunden – Core Web Vitals grün, besser als der lokale Wettbewerb",
    "Mobile-first: optimal für Touristen und Einheimische, die auf dem Smartphone suchen",
    "Skalierbar: Website wächst mit Ihrem Unternehmen mit, ohne Relaunch-Bedarf",
    "Persönliche Betreuung mit Vor-Ort-Option in Regensburg und der Oberpfalz",
  ],
  localContext: [
    "Regensburg ist eine der am schnellsten wachsenden Städte Bayerns – mit starker Gastronomie- und Tourismusbranche, wachsendem Mittelstand und einer gut vernetzten Startup-Szene. Die Altstadt, das Donauufer und die Universität ziehen jährlich hunderttausende Besucher an – ein Umfeld, in dem digitale Sichtbarkeit direkten wirtschaftlichen Einfluss hat.",
    "Besonders in Regensburg gilt: Wer bei lokalen Google-Suchen nicht auf der ersten Seite erscheint, existiert für einen Großteil der Zielgruppe schlicht nicht. Touristen googeln, bevor sie ins Restaurant gehen. Einheimische suchen online nach dem Handwerker des Vertrauens. Eine professionelle Website mit lokalem SEO ist kein Nice-to-have, sondern Grundvoraussetzung für stabiles Wachstum.",
    "Cogniiq betreut Unternehmen in Regensburg persönlich – mit optionalen Vor-Ort-Terminen und einem tiefen Verständnis für die Oberpfälzer Unternehmenslandschaft. Unsere Websites sind auf die spezifischen Such- und Wettbewerbssituationen in Regensburg zugeschnitten, nicht auf generische Templates ausgelegt.",
  ],
  internalLinks: [
    { label: "Webdesign Agentur Bayreuth", href: "/bayreuth/webdesign" },
    { label: "Webdesign Agentur München", href: "/muenchen/webdesign" },
    { label: "KI-Telefonassistent Regensburg", href: "/regensburg/ki-telefonassistent" },
    { label: "Automatisierung Regensburg", href: "/regensburg/automatisierung" },
    { label: "Alle Leistungen", href: "/leistungen" },
    { label: "Cogniiq Regensburg", href: "/regensburg" },
  ],
  faq: [
    {
      question: "Was kostet eine Website von Cogniiq in Regensburg?",
      answer:
        "Einstiegsprojekte beginnen ab ca. 1.500 € (Website Launch). Komplexere Projekte mit erweitertem SEO, Content-Strategie und Integrationen bewegen sich im höheren vierstelligen Bereich. Eine konkrete Einschätzung erhalten Sie im kostenlosen Erstgespräch.",
    },
    {
      question: "Wie lange dauert die Umsetzung einer Website in Regensburg?",
      answer:
        "Einfache Projekte sind in 7–14 Tagen live. Websites mit erweitertem Local SEO, Content und Integrationen benötigen in der Regel 3–6 Wochen. Der Zeitplan wird im Konzept verbindlich festgelegt.",
    },
    {
      question: "Kümmert sich Cogniiq auch um Hosting und laufende Pflege?",
      answer:
        "Auf Wunsch ja. Wir empfehlen performante, DSGVO-konforme Hosting-Lösungen und bieten Wartungspakete für Updates, Sicherheits-Backups und Inhaltspflege an.",
    },
    {
      question: "Ist die Website DSGVO-konform?",
      answer:
        "Ja. Impressum, Datenschutzerklärung und Cookie-Consent sind in jedem Paket enthalten. Externe Tools werden DSGVO-konform eingebunden – wichtig besonders für Betriebe, die Kunden in Deutschland bedienen.",
    },
    {
      question: "Kann ich Inhalte später selbst bearbeiten?",
      answer:
        "Ja. Wir übergeben ein einfach bedienbares Content-Management-System und schulen Sie in der Nutzung. Für technische Anpassungen steht Cogniiq weiter zur Verfügung.",
    },
    {
      question: "Was sind Core Web Vitals und warum sind sie für Regensburg relevant?",
      answer:
        "Core Web Vitals messen Ladezeit, Interaktivität und visuelle Stabilität einer Website. Google nutzt diese Metriken als Rankingfaktor – wer lokal in Regensburg gefunden werden möchte, muss hier konkurrenzfähig sein.",
    },
    {
      question: "Beinhaltet die Website auch SEO für Regensburg?",
      answer:
        "On-Page SEO und Google Business Optimierung sind in jedem Paket enthalten. Erweiterte lokale SEO-Strategien für Regensburg und die Oberpfalz, strukturierte Daten und Content-Strategie sind Teil der Pakete 'Wachstum' und 'Marktführer'.",
    },
    {
      question: "Was ist der Unterschied zu einem Baukasten wie Wix oder Squarespace?",
      answer:
        "Baukastenlösungen sind generisch, technisch limitiert und für ernsthaftes lokales SEO kaum geeignet. Cogniiq-Websites werden individuell entwickelt – mit sauberem Code, optimierter Performance und einer Qualität, die keine Baukastenlösung erreicht.",
    },
    {
      question: "Erstellt Cogniiq auch die Texte für die Website?",
      answer:
        "Ja. Auf Wunsch liefern wir Conversion-optimierte Texte mit lokalem SEO-Fokus auf Regensburg und die Oberpfalz – inklusive Keyword-Recherche und redaktioneller Qualitätssicherung.",
    },
    {
      question: "Kann die Website mit einem KI-Telefonassistenten verbunden werden?",
      answer:
        "Ja. Cogniiq integriert KI-Telefonassistenten und Automatisierungs-Workflows direkt in die Website – zum Beispiel für automatische Lead-Erfassung, Terminbuchung oder Kundenkommunikation.",
    },
    {
      question: "Wie läuft der Einstieg ab?",
      answer:
        "Kostenloses Erstgespräch buchen – 30–45 Minuten, remote oder vor Ort in Regensburg. Wir analysieren Ihre Situation, erklären das Vorgehen und geben eine erste konkrete Einschätzung. Kein Pitch, kein Druck.",
    },
  ],
};

export function WebdesignRegensburg() {
  return <IndustryPage config={config} />;
}
