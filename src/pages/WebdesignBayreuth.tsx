import { IndustryPage } from "@/components/IndustryPage";
import type { IndustryPageConfig } from "@/components/IndustryPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const base = BUSINESS_INFO.website;

const config: IndustryPageConfig = {
  route: "/bayreuth/webdesign",
  industry: "Webdesign",
  industrySlug: "webdesign",
  city: "Bayreuth",
  citySlug: "bayreuth",
  cityHub: "/bayreuth",
  seo: {
    title: "Webdesign Agentur Bayreuth | Website erstellen lassen – Cogniiq",
    description:
      "Webdesign Agentur in Bayreuth: Cogniiq entwickelt individuelle, SEO-optimierte und DSGVO-konforme Websites für Unternehmen in Bayreuth und Oberfranken. Core Web Vitals, Local SEO, Conversion-Optimierung.",
    canonical: `${base}/bayreuth/webdesign`,
    keywords:
      "Webdesign Bayreuth, Webdesign Agentur Bayreuth, Website erstellen Bayreuth, Website Agentur Bayreuth, Homepage erstellen Bayreuth, SEO Webdesign Bayreuth",
  },
  hero: {
    trustTags: ["DSGVO · Core Web Vitals · Persönliche Betreuung · Region Bayreuth"],
    ctaLabel: "Kostenloses Erstgespräch",
  },
  intro: {
    h1: "Webdesign Agentur in Bayreuth",
    lead: "Individuelle, schnelle und SEO-optimierte Websites für Unternehmen in Bayreuth und Oberfranken. Von der Konzeption bis zum Go-live – persönlich betreut, lokal verwurzelt, technisch auf höchstem Niveau.",
  },
  engpaesse: [
    "Veraltete Website verliert täglich Anfragen an Wettbewerber, die bei Google sichtbar sind",
    "Baukasten-Website lädt langsam, schlägt bei Core Web Vitals durch und kostet Rankings",
    "Kein lokales SEO-Setup: Google findet das Unternehmen nicht für Suchanfragen in Bayreuth",
    "Fehlende DSGVO-Konformität: Datenschutzerklärung, Cookie-Consent und Impressum nicht rechtssicher",
    "Website konvertiert nicht – viele Besucher, kaum Anfragen, kein klares Call-to-Action",
    "Keine mobile Optimierung: über 65 % der Nutzer in Bayreuth surfen über das Smartphone",
  ],
  solutionSteps: [
    {
      step: "Schritt 1",
      title: "Analyse & Konzept",
      description:
        "Wir analysieren Ihre aktuelle Situation, Wettbewerbslage in Bayreuth und definieren Ziele, Zielgruppe und Seitenstruktur. Das Ergebnis ist ein klares Konzept – noch vor dem ersten Design-Entwurf.",
    },
    {
      step: "Schritt 2",
      title: "Design & Umsetzung",
      description:
        "Individuelles Design auf Basis Ihrer Marke, codiert mit modernsten Web-Technologien. Performance-optimiert ab der ersten Zeile Code – für maximale Pagespeed und Core Web Vitals Scores.",
    },
    {
      step: "Schritt 3",
      title: "SEO-Setup & Go-Live",
      description:
        "On-Page SEO, Local SEO, Google Business Optimierung, strukturierte Daten und DSGVO-Seiten – alles inklusive. Wir begleiten den Launch und bleiben als lokaler Ansprechpartner erreichbar.",
    },
  ],
  workflow: {
    title: "Beispielprojekt: Handwerksbetrieb Bayreuth",
    trigger:
      "Ein Handwerksbetrieb in Bayreuth mit 8 Mitarbeitern hatte eine veraltete Website ohne Mobile-Optimierung und keine Sichtbarkeit bei lokalen Google-Suchen. Anfragen kamen ausschließlich über Weiterempfehlung.",
    process:
      "Cogniiq entwickelte eine neue responsive Website mit lokalem SEO-Setup, Google Business Optimierung, strukturierten Daten und einem klaren Conversion-Funnel. Ladezeit wurde von 6,4s auf unter 1,8s reduziert.",
    result:
      "Innerhalb von 90 Tagen erste Seite bei 'Handwerker Bayreuth'. Messbar mehr organische Anfragen über die Website, deutliche Reduktion der Abhängigkeit von Weiterempfehlungen.",
  },
  pakete: [
    {
      name: "Website Launch",
      tagline: "Professionelle Präsenz für Bayreuth – schnell und solide",
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
      tagline: "Conversion & Local SEO für nachhaltiges Wachstum in Bayreuth",
      deliverables: [
        "Alles aus Website Launch",
        "Erweiterte Seitenstruktur (bis 12 Seiten)",
        "Conversion-optimierte Texte & CTAs",
        "Lokale SEO-Strategie Bayreuth/Oberfranken",
        "Strukturierte Daten (Schema.org LocalBusiness)",
        "Google Analytics 4 & Search Console Setup",
        "Performance-Optimierung auf Core Web Vitals",
        "3 Monate Nachbetreuung",
      ],
    },
    {
      name: "Website Marktführer",
      tagline: "Marktführer-Position in Bayreuth und Oberfranken",
      deliverables: [
        "Alles aus Website Wachstum",
        "Unbegrenzte Seitenstruktur & Unterseiten",
        "KI-gestützte Conversion-Optimierung",
        "Regionale SEO-Dominanz Oberfranken",
        "Blog-/Content-Strategie für organische Reichweite",
        "Lokale Backlink-Strategie",
        "Integration KI-Telefonassistent & Automatisierung",
        "Laufende Betreuung & monatliches Reporting",
      ],
    },
  ],
  problems: [
    "Keine Sichtbarkeit bei 'Webdesign Bayreuth' oder 'Website erstellen Bayreuth'",
    "Langsame Ladezeit schadet Rankings und Conversion-Rate",
    "Nicht DSGVO-konform: rechtliches Risiko für den Betrieb",
    "Keine strukturierten Daten: Google kann das Unternehmen nicht richtig einordnen",
    "Mobile UX mangelhaft: Besucher springen sofort ab",
    "Kein Tracking: unklar, woher Anfragen kommen",
  ],
  services: [
    {
      icon: "web",
      title: "Webdesign Bayreuth",
      description:
        "Individuelle Websites für Unternehmen in Bayreuth – responsive, schnell und auf Conversion ausgerichtet. Von der einfachen Visitenkarten-Website bis zur komplexen Multi-Page-Präsenz.",
    },
    {
      icon: "zap",
      title: "Local SEO & Pagespeed",
      description:
        "Core Web Vitals Optimierung, strukturierte Daten, Google Business Profil und lokale Keyword-Strategie für maximale Sichtbarkeit in Bayreuth und Oberfranken.",
    },
    {
      icon: "phone",
      title: "KI-Integration & Automatisierung",
      description:
        "Nahtlose Integration von KI-Telefonassistent und Automatisierungs-Workflows direkt in die Website – für mehr Effizienz ohne zusätzlichen Personalaufwand.",
    },
  ],
  useCases: [
    {
      title: "Handwerker & Dienstleister in Bayreuth",
      description:
        "Neue Website mit lokalem SEO-Setup – von der Suche 'Elektriker Bayreuth' direkt auf die Angebotsseite. Mehr Anfragen, weniger Abhängigkeit von Empfehlungen.",
    },
    {
      title: "Arztpraxen & Therapeuten",
      description:
        "DSGVO-konforme Praxis-Website mit Online-Terminbuchung und Google Business Optimierung für lokale Suchanfragen wie 'Zahnarzt Bayreuth'.",
    },
    {
      title: "Gastronomie & Hotellerie",
      description:
        "Restaurant-Website mit Speisekarte, Reservierungsfunktion und optimierter lokaler Sichtbarkeit – besonders relevant zur Festspielzeit in Bayreuth.",
    },
    {
      title: "Mittelstand & Fachbetriebe",
      description:
        "Professionelle Unternehmenswebsite mit Conversion-Funnel, Referenzbereich und Integration in bestehende CRM- und ERP-Systeme.",
    },
    {
      title: "Immobilien & Finanzdienstleister",
      description:
        "Vertrauensaufbau durch Premium-Webdesign mit klarer Positionierung und lokalem SEO-Fokus auf Bayreuth und den Landkreis.",
    },
    {
      title: "Startups & Gründer in Oberfranken",
      description:
        "Schnelles Go-to-Market mit professioneller Website, die von Anfang an auf Wachstum ausgelegt ist – ohne Mehrkosten beim Skalieren.",
    },
  ],
  benefits: [
    "Mehr qualifizierte Anfragen durch bessere Google-Sichtbarkeit in Bayreuth",
    "Messbar höhere Conversion-Rate durch strukturierte User Experience und klare CTAs",
    "Rechtssicherheit durch vollständige DSGVO-Konformität inklusive aller Pflichtseiten",
    "Schnelle Ladezeit unter 2 Sekunden – besser als 95 % aller lokalen Wettbewerber",
    "Persönliche Betreuung durch ein lokales Team, erreichbar in Bayreuth",
    "Skalierbar: Website wächst mit dem Unternehmen, ohne Relaunch-Bedarf",
    "Integration mit KI-Telefonassistent und Automatisierung für vollständige Digitalisierung",
  ],
  localContext: [
    "Bayreuth ist Wirtschaftsstandort mit starkem Mittelstand, Handwerksbetrieben, Praxen und zunehmend technologieorientierten Unternehmen. Die Festspielregion zieht jährlich internationale Gäste an – ein Umfeld, das professionellen digitalen Auftritt nicht nur belohnt, sondern voraussetzt.",
    "Viele Bayreuther Unternehmen sind lokal bekannt, aber digital kaum sichtbar. Bei Suchanfragen wie 'Handwerker Bayreuth', 'Physiotherapie Bayreuth' oder 'Restaurant Bayreuth' fehlen sie – und verlieren Aufträge an Wettbewerber mit besserer Online-Präsenz. Das ist keine Frage der Unternehmensgröße, sondern des digitalen Setups.",
    "Cogniiq ist in Bayreuth ansässig und kennt die lokale Unternehmenslandschaft in Oberfranken. Unsere Websites sind nicht generisch – sie sind auf die spezifischen Suchmuster, Branchen und Wettbewerbssituationen in Bayreuth ausgerichtet. Persönliche Vor-Ort-Termine sind selbstverständlich möglich.",
  ],
  internalLinks: [
    { label: "Webdesign Agentur München", href: "/muenchen/webdesign" },
    { label: "Webdesign Agentur Regensburg", href: "/regensburg/webdesign" },
    { label: "KI-Telefonassistent Bayreuth", href: "/bayreuth/ki-telefonassistent" },
    { label: "Automatisierung Bayreuth", href: "/bayreuth/automatisierung" },
    { label: "Alle Leistungen", href: "/leistungen" },
    { label: "Cogniiq Bayreuth", href: "/bayreuth" },
  ],
  faq: [
    {
      question: "Was kostet eine Website von Cogniiq in Bayreuth?",
      answer:
        "Je nach Umfang und Zielsetzung starten Projekte ab ca. 1.500 € (Website Launch) bis hin zu komplexen Lösungen im vierstelligen Bereich. Im kostenlosen Erstgespräch erhalten Sie eine konkrete Einschätzung ohne Verpflichtung.",
    },
    {
      question: "Wie lange dauert die Umsetzung einer Website?",
      answer:
        "Einfache Projekte gehen in 7–14 Tagen online. Komplexere Websites mit Local SEO, Content-Strategie und Integrationen benötigen 3–6 Wochen. Der genaue Zeitplan wird im Konzept festgelegt.",
    },
    {
      question: "Kümmert sich Cogniiq auch um Hosting und Pflege?",
      answer:
        "Auf Wunsch ja. Wir empfehlen performante Hosting-Lösungen und bieten laufende Wartungspakete für Updates, Sicherheits-Backups und Inhaltspflege an.",
    },
    {
      question: "Ist die Website DSGVO-konform?",
      answer:
        "Ja. Jede Website von Cogniiq wird mit rechtssicherem Impressum, Datenschutzerklärung und DSGVO-konformem Cookie-Consent ausgeliefert. Externe Tools wie Google Analytics werden datenschutzkonform eingebunden.",
    },
    {
      question: "Kann ich meine Website später selbst bearbeiten?",
      answer:
        "Ja. Wir übergeben Ihnen ein Content-Management-System Ihrer Wahl und schulen Sie in der Bedienung. Für technische Anpassungen stehen wir weiterhin zur Verfügung.",
    },
    {
      question: "Beinhaltet das Paket auch SEO?",
      answer:
        "On-Page SEO und lokale Grundoptimierung sind in jedem Paket enthalten. Erweiterte lokale SEO-Strategien für Bayreuth, strukturierte Daten und Google Business Optimierung sind Teil der Pakete 'Wachstum' und 'Marktführer'.",
    },
    {
      question: "Was ist der Unterschied zwischen einer Cogniiq-Website und einem Baukasten?",
      answer:
        "Baukastenlösungen wie Wix oder Squarespace sind generisch, langsam und schlecht für SEO. Cogniiq entwickelt individuell – mit sauberem Code, optimierter Pagespeed, lokalem SEO-Setup und technischer Qualität, die Baukastensysteme strukturell nicht erreichen können.",
    },
    {
      question: "Liefert Cogniiq auch die Texte für die Website?",
      answer:
        "Ja. Auf Wunsch erstellen wir Conversion-optimierte Texte für alle Seiten – inklusive SEO-Ausrichtung auf relevante Keywords in Bayreuth und Oberfranken.",
    },
    {
      question: "Was sind Core Web Vitals und warum sind sie wichtig?",
      answer:
        "Core Web Vitals sind Google-Messwerte für Ladezeit, Interaktivität und visuelle Stabilität. Schlechte Werte wirken sich direkt negativ auf das Google-Ranking aus. Cogniiq-Websites werden von Anfang an auf diese Metriken optimiert.",
    },
    {
      question: "Arbeitet Cogniiq auch mit bestehenden Websites?",
      answer:
        "Ja. Wir analysieren und optimieren bestehende Websites hinsichtlich Pagespeed, SEO, Conversion und DSGVO – ohne zwingend komplett neu zu bauen.",
    },
    {
      question: "Kann die Website mit KI-Telefonassistent und Automatisierung verbunden werden?",
      answer:
        "Ja. Cogniiq integriert nahtlos KI-Telefonassistenten und Automatisierungsworkflows direkt in die Website – zum Beispiel für automatische Lead-Erfassung, Terminbuchung oder Benachrichtigungssysteme.",
    },
    {
      question: "Wie läuft der erste Schritt ab?",
      answer:
        "Sie buchen ein kostenloses Erstgespräch. In 30–45 Minuten analysieren wir Ihre aktuelle Situation, Ziele und Wettbewerbslage in Bayreuth und geben eine erste konkrete Einschätzung – ohne Verpflichtung.",
    },
  ],
};

export function WebdesignBayreuth() {
  return <IndustryPage config={config} />;
}
