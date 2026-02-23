import { IndustryPage } from "@/components/IndustryPage";
import type { IndustryPageConfig } from "@/components/IndustryPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const base = BUSINESS_INFO.website;

const config: IndustryPageConfig = {
  route: "/muenchen/webdesign",
  industry: "Webdesign",
  industrySlug: "webdesign",
  city: "München",
  citySlug: "muenchen",
  cityHub: "/muenchen",
  seo: {
    title: "Webdesign Agentur München | Website erstellen lassen – Cogniiq",
    description:
      "Webdesign Agentur in München: Cogniiq entwickelt premium Websites für Unternehmen in München – SEO-optimiert, blitzschnell, DSGVO-konform. Core Web Vitals, Local SEO, Conversion-Fokus für den Münchner Markt.",
    canonical: `${base}/muenchen/webdesign`,
    keywords:
      "Webdesign München, Webdesign Agentur München, Website erstellen München, Website Agentur München, Homepage erstellen München, SEO Webdesign München",
  },
  hero: {
    trustTags: ["DSGVO · Core Web Vitals · Persönliche Betreuung · Region München"],
    ctaLabel: "Kostenloses Erstgespräch",
  },
  intro: {
    h1: "Webdesign Agentur in München",
    lead: "Individuelle, schnelle und SEO-optimierte Websites für Unternehmen in München. Im härtesten digitalen Wettbewerb Bayerns braucht es mehr als ein schönes Design – Cogniiq liefert Websites, die ranken, laden und konvertieren.",
  },
  engpaesse: [
    "München ist der kompetitivste lokale Suchmarkt Bayerns – ohne erstklassiges SEO-Setup ist Sichtbarkeit ausgeschlossen",
    "Premium-Anspruch der Zielgruppe: eine langsame oder generisch aussehende Website kostet sofort Vertrauen und Aufträge",
    "Wettbewerber mit professionellem Webdesign dominieren die ersten Google-Treffer für jede relevante Keyword-Kombination",
    "Baukastenlösungen scheitern bei Core Web Vitals – und damit im direkten Ranking-Vergleich gegen gut aufgestellte Münchner Betriebe",
    "Fehlende DSGVO-Konformität: in München besonders relevant durch erhöhtes rechtliches Bewusstsein und Abmahnrisiko",
    "Kein skalierbares Fundament: Website wächst nicht mit dem Unternehmen – Relaunch alle 2–3 Jahre statt einmal richtig bauen",
  ],
  solutionSteps: [
    {
      step: "Schritt 1",
      title: "Wettbewerbs-Analyse München",
      description:
        "Tiefgehende Analyse Ihrer Wettbewerbssituation in München: welche Keywords ranken, wer dominiert, was fehlt. Daraus entsteht eine Strategie, die Ihre Position konkret verbessert.",
    },
    {
      step: "Schritt 2",
      title: "Premium Design & Entwicklung",
      description:
        "Individuelles Design auf Premium-Niveau – keine Templates, kein Baukasten. Entwickelt mit modernsten Technologien für maximale Performance: Pagespeed unter 1,5s, Core Web Vitals grün, mobile-first.",
    },
    {
      step: "Schritt 3",
      title: "Lokale SEO-Dominanz & Go-Live",
      description:
        "Vollständiges Local SEO-Setup für München: strukturierte Daten, Google Business Optimierung, Conversion-Tracking, DSGVO-Seiten. Launch mit Begleitung und optionaler laufender Betreuung.",
    },
  ],
  workflow: {
    title: "Beispielprojekt: Unternehmensberatung München",
    trigger:
      "Eine mittelständische Unternehmensberatung in München hatte eine veraltete Website, die bei keinem relevanten Keyword auf der ersten Seite erschien. Das Unternehmen war offline bekannt, online kaum auffindbar.",
    process:
      "Cogniiq entwickelte eine neue Unternehmenswebsite mit klarer Positionierung, Conversion-optimierten Texten, vollständigem Local SEO-Setup für München und strukturierten Daten. Pagespeed wurde auf unter 1,5s optimiert.",
    result:
      "Innerhalb von 60 Tagen erste Seite für priorisierte Keywords in München. Messbar mehr qualifizierte Anfragen über die Website, deutlich höhere Verweildauer und sinkende Absprungrate.",
  },
  pakete: [
    {
      name: "Website Launch",
      tagline: "Professionelle Präsenz für den Münchner Markt – schnell und solide",
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
      tagline: "Conversion & Local SEO für nachhaltiges Wachstum in München",
      deliverables: [
        "Alles aus Website Launch",
        "Erweiterte Seitenstruktur (bis 12 Seiten)",
        "Conversion-optimierte Texte & CTAs",
        "Lokale SEO-Strategie München & Umland",
        "Strukturierte Daten (Schema.org LocalBusiness)",
        "Google Analytics 4 & Search Console Setup",
        "Performance-Optimierung auf Core Web Vitals",
        "3 Monate Nachbetreuung",
      ],
    },
    {
      name: "Website Marktführer",
      tagline: "Marktführer-Position im Münchner Wettbewerb",
      deliverables: [
        "Alles aus Website Wachstum",
        "Unbegrenzte Seitenstruktur & Unterseiten",
        "KI-gestützte Conversion-Optimierung",
        "Dominanz-SEO-Strategie für München",
        "Blog-/Content-Strategie für organische Reichweite",
        "Lokale Backlink-Strategie",
        "Integration KI-Telefonassistent & Automatisierung",
        "Laufende Betreuung & monatliches Reporting",
      ],
    },
  ],
  problems: [
    "Extrem hoher lokaler Wettbewerb: ohne Top-3 Google-Ranking keine organische Sichtbarkeit in München",
    "Langsame Website verliert sofort Vertrauen bei einer anspruchsvollen Münchner Zielgruppe",
    "Keine strukturierten Daten: Google ordnet Branche und Standort nicht korrekt ein",
    "DSGVO-Lücken: in München erhöhtes Risiko durch rechtsbewusstes Umfeld",
    "Fehlende Skalierbarkeit: Website hält Wachstum nicht mit, Relaunch alle paar Jahre nötig",
    "Kein Conversion-Tracking: Marketingbudget ohne Datenbasis investiert",
  ],
  services: [
    {
      icon: "web",
      title: "Webdesign München",
      description:
        "Individuelle Premium-Websites für Münchner Unternehmen – technisch und ästhetisch auf dem Niveau, das der Münchner Markt verlangt. Responsive, schnell, conversion-stark.",
    },
    {
      icon: "zap",
      title: "Local SEO & Pagespeed München",
      description:
        "Umfassende lokale SEO-Strategie für München: Core Web Vitals, strukturierte Daten, Google Business Optimierung und Keyword-Dominanz für Ihre Branche im Münchner Markt.",
    },
    {
      icon: "phone",
      title: "KI-Integration & Skalierung",
      description:
        "Für wachsende Unternehmen in München: Integration von KI-Telefonassistent und Automatisierungs-Workflows in die Website – skalierbar, effizient, ohne Mehraufwand.",
    },
  ],
  useCases: [
    {
      title: "Unternehmensberatung & Professional Services",
      description:
        "Premium-Webdesign für Berater, Anwälte, Steuerberater und Dienstleister in München – mit Positionierung, Vertrauensaufbau und konkretem Conversion-Funnel.",
    },
    {
      title: "Wachstumsunternehmen & Scale-ups",
      description:
        "Skalierbare Website-Architektur für Münchner Wachstumsunternehmen: performance-optimiert, erweiterbar und von Anfang an auf Marktdominanz ausgerichtet.",
    },
    {
      title: "Gastronomie & Hotellerie",
      description:
        "Restaurant- und Hotelwebsites mit Online-Reservierung, lokalem SEO-Setup und Premium-Darstellung – für den anspruchsvollen Münchner Markt und internationale Gäste.",
    },
    {
      title: "Arztpraxen & Gesundheitsdienstleister",
      description:
        "DSGVO-konforme Praxis-Website mit Online-Terminbuchung und starker lokaler Sichtbarkeit bei Suchanfragen wie 'Arzt München' oder 'Praxis München Schwabing'.",
    },
    {
      title: "Immobilien & Finanzdienstleister",
      description:
        "Vertrauensstarkes Webdesign für Münchner Immobilienmakler, Vermögensberater und Finanzdienstleister – mit klarer Positionierung und maximaler lokaler Sichtbarkeit.",
    },
    {
      title: "Handwerk & lokale Dienstleister",
      description:
        "Webdesign für Handwerker und Dienstleister in München: lokale SEO-Sichtbarkeit für relevante Suchanfragen, klarer Conversion-Funnel und professionelle Außenwirkung.",
    },
  ],
  benefits: [
    "Konkurrenzfähige Google-Sichtbarkeit im härtesten lokalen Suchmarkt Bayerns",
    "Premium-Anmutung, die das Vertrauen der anspruchsvollen Münchner Zielgruppe gewinnt",
    "Ladezeit unter 1,5 Sekunden – Core Web Vitals grün, messbar besser als Wettbewerber",
    "Vollständige DSGVO-Konformität inklusive aller Pflichtseiten und konformer Tool-Einbindung",
    "Skalierbare Architektur: Website wächst mit dem Unternehmen, kein Relaunch nötig",
    "Conversion-Tracking und Analytics von Anfang an: Datenbasis für alle Marketingentscheidungen",
    "Integration mit KI-Telefonassistent und Automatisierung für vollständige Digitalisierung",
  ],
  localContext: [
    "München ist der wettbewerbsintensivste digitale Markt in Bayern – und einer der kompetitivsten in Deutschland. Unternehmen, die bei lokalen Suchanfragen auf Seite 1 erscheinen wollen, brauchen nicht nur eine schöne Website, sondern eine technisch erstklassige, strategisch fundierte und lokal ausgerichtete Online-Präsenz.",
    "Die Münchner Zielgruppe ist anspruchsvoll und digital versiert. Eine langsame oder generisch wirkende Website signalisiert sofort Mittelmäßigkeit – und schickt potenzielle Kunden weiter zum nächsten Anbieter. Gleichzeitig bietet der Münchner Markt enorme Chancen: wer technisch und inhaltlich überzeugt, skaliert schnell.",
    "Cogniiq betreut Unternehmen in München mit dem gleichen Anspruch wie im eigenen Heimatmarkt Bayreuth – mit persönlichen Terminen auf Wunsch und einem tiefen Verständnis für die Münchner Wettbewerbssituation. Unsere Websites sind keine Massenware, sondern individuelle Systeme für nachhaltiges Wachstum.",
  ],
  internalLinks: [
    { label: "Webdesign Agentur Bayreuth", href: "/bayreuth/webdesign" },
    { label: "Webdesign Agentur Regensburg", href: "/regensburg/webdesign" },
    { label: "KI-Telefonassistent München", href: "/muenchen/ki-telefonassistent" },
    { label: "Automatisierung München", href: "/muenchen/automatisierung" },
    { label: "Alle Leistungen", href: "/leistungen" },
    { label: "Cogniiq München", href: "/muenchen" },
  ],
  faq: [
    {
      question: "Was kostet eine Website von Cogniiq in München?",
      answer:
        "Projekte starten ab ca. 1.500 € (Website Launch) und skalieren je nach Umfang, SEO-Tiefe und Integrationen. Der Münchner Wettbewerb erfordert oft mehr Investition in SEO und Content – dafür ist der ROI entsprechend höher. Konkrete Einschätzung im kostenlosen Erstgespräch.",
    },
    {
      question: "Wie lange dauert die Umsetzung einer Website in München?",
      answer:
        "Kompakte Projekte sind in 7–14 Tagen online. Websites mit vollständiger SEO-Strategie, Content und Integrationen benötigen 4–8 Wochen. Der Zeitplan wird im Konzept verbindlich festgelegt.",
    },
    {
      question: "Ist Cogniiq auch für den Münchner Wettbewerb aufgestellt?",
      answer:
        "Ja. Wir haben spezifische Erfahrung mit dem Münchner Markt: höhere Keyword-Wettbewerbsintensität, anspruchsvollere Zielgruppen und die Notwendigkeit technisch überlegener Websites. Unser Ansatz ist datenbasiert und auf Wettbewerbsüberlegenheit ausgerichtet.",
    },
    {
      question: "Beinhaltet das Paket Local SEO für München?",
      answer:
        "On-Page SEO und Google Business Optimierung sind in jedem Paket enthalten. Umfassende lokale SEO-Strategie für München, strukturierte Daten, Backlink-Aufbau und Content-Strategie sind Teil der Pakete 'Wachstum' und 'Marktführer'.",
    },
    {
      question: "Ist die Website DSGVO-konform?",
      answer:
        "Ja. Impressum, Datenschutzerklärung und Cookie-Consent sind standardmäßig enthalten. In München ist DSGVO-Konformität besonders wichtig – wir liefern rechtssichere Umsetzung inklusive aller eingebundenen Dritttools.",
    },
    {
      question: "Was sind Core Web Vitals und warum sind sie in München so wichtig?",
      answer:
        "Core Web Vitals sind Google-Messwerte für Ladezeit, Interaktivität und visuelle Stabilität. Im Münchner Wettbewerb kann schlechte Performance den Unterschied zwischen Seite 1 und Seite 2 ausmachen. Cogniiq-Websites werden von Beginn an auf maximale Core Web Vitals optimiert.",
    },
    {
      question: "Erstellt Cogniiq auch Texte für die Website?",
      answer:
        "Ja. Conversion-optimierte Texte mit lokalem SEO-Fokus auf München sind auf Wunsch Teil des Projekts. Inklusive Keyword-Recherche, Wettbewerbsanalyse und professioneller Texterstellung.",
    },
    {
      question: "Was unterscheidet Cogniiq von anderen Webdesign-Agenturen in München?",
      answer:
        "Cogniiq liefert keine Massenware. Jede Website ist individuell entwickelt, technisch erstklassig und auf die spezifische Wettbewerbssituation in München ausgerichtet. Kein Template, kein Baukasten, kein generischer Ansatz.",
    },
    {
      question: "Kann ich die Website später selbst bearbeiten?",
      answer:
        "Ja. Übergabe mit Content-Management-System und Kurzschulung ist Standard. Für technische Anpassungen und Weiterentwicklung steht Cogniiq weiterhin zur Verfügung.",
    },
    {
      question: "Kann die Website mit KI-Telefonassistent und Automatisierung verbunden werden?",
      answer:
        "Ja. Für Münchner Unternehmen, die skalieren wollen, integrieren wir KI-Telefonassistenten und Automatisierungs-Workflows direkt in die Website – für vollständige digitale Effizienz.",
    },
    {
      question: "Bietet Cogniiq auch laufende SEO-Betreuung für München an?",
      answer:
        "Ja. Im Paket 'Website Marktführer' ist laufende Betreuung inklusive monatlichem Reporting enthalten. Wir beobachten Rankings, optimieren Content und stellen sicher, dass Ihre Website in München dauerhaft sichtbar bleibt.",
    },
    {
      question: "Wie starte ich mit Cogniiq?",
      answer:
        "Kostenloses Erstgespräch buchen – 30–45 Minuten, remote oder bei Bedarf vor Ort in München. Wir analysieren Ihre Situation, zeigen konkrete Handlungsfelder und geben eine erste Einschätzung ohne Verpflichtung.",
    },
  ],
};

export function WebdesignMuenchen() {
  return <IndustryPage config={config} />;
}
