import { IndustryPage } from "@/components/IndustryPage";
import type { IndustryPageConfig } from "@/components/IndustryPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const base = BUSINESS_INFO.website;

const config: IndustryPageConfig = {
  route: "/webdesign-immobilien-regensburg",
  industry: "Immobilien",
  industrySlug: "immobilien",
  city: "Regensburg",
  citySlug: "regensburg",
  cityHub: "/regensburg",
  seo: {
    title: "Webdesign & KI-Telefonassistent für Immobilienmakler in Regensburg | Cogniiq",
    description:
      "Immobilien Website Regensburg: Cogniiq entwickelt Websites, KI-Telefonassistenten und Lead-Automatisierungen für Immobilienmakler in Regensburg. Mehr Anfragen, automatisierte Besichtigungen, DSGVO-konform.",
    canonical: `${base}/webdesign-immobilien-regensburg`,
    keywords:
      "Immobilien Website Regensburg, Makler Website Regensburg, Immobilienmakler Regensburg Digital, KI Telefonassistent Immobilien Regensburg",
  },
  hero: {
    trustTags: ["Regensburg", "DSGVO-konform", "KI-Integration", "Lead-Qualifizierung", "Automatisierung"],
    ctaLabel: "Projekt für Immobilienmakler starten",
  },
  intro: {
    h1: "Webdesign & KI-Telefonassistent für Immobilienmakler in Regensburg",
    lead: "Cogniiq entwickelt Websites, KI-Telefonassistenten und Automatisierungssysteme für Immobilienmakler in Regensburg – für mehr qualifizierte Kaufanfragen, automatisierte Besichtigungsprozesse und professionelle Objektpräsentation. DSGVO-konform, schnell eingerichtet.",
  },
  engpaesse: [
    "Regensburg wächst überdurchschnittlich – die Nachfrage nach Wohnraum übersteigt das Angebot, was zu einem hohen Anfragevolumen führt",
    "Interessenten aus München und dem Großraum suchen digital nach Immobilien in Regensburg – ohne SEO sind Makler für diese Gruppe unsichtbar",
    "Besichtigungskoordination für mehrere Objekte gleichzeitig ist manuell kaum effizient zu handhaben",
    "Ohne automatisierte Follow-up-Prozesse gehen potenzielle Käufer verloren, die noch im Entscheidungsprozess sind",
    "Verkäufer-Akquise läuft überwiegend über Empfehlungen statt über digitale Kanäle – Potenzial wird nicht ausgeschöpft",
  ],
  solutionSteps: [
    {
      step: "Schritt 1",
      title: "Analyse & Konzept",
      description:
        "Wir analysieren den bestehenden Lead-Prozess, die Objektstruktur und typische Anfragemuster des Regensburger Maklerbüros und entwickeln ein passgenaues Konzept für Website, KI-Assistent und Automatisierung.",
    },
    {
      step: "Schritt 2",
      title: "Umsetzung in 7–14 Tagen",
      description:
        "Makler-Website mit Objektpräsentation, KI-Telefonassistent für Interessentenanfragen und Automatisierungsworkflows für Besichtigungen und Follow-ups werden vollständig von Cogniiq aufgebaut.",
    },
    {
      step: "Schritt 3",
      title: "Go-live & laufende Betreuung",
      description:
        "Alle Systeme gehen nach Abnahme live. Cogniiq betreut das Setup dauerhaft remote – für neue Objekte, Marktanpassungen und Erweiterungen des Automatisierungssystems.",
    },
  ],
  workflow: {
    title: "Beispiel-Workflow: Immobilienmakler Regensburg",
    trigger:
      "Ein Immobilienmakler in Regensburg hatte täglich mehrere Anfragen zu Objekten – sowohl von lokalen Interessenten als auch von Zugezogenen aus München und dem Großraum. Ohne Vorqualifizierung war jede Anfrage ein potentieller Zeitaufwand.",
    process:
      "Cogniiq baute eine neue Makler-Website mit strukturierten Objektseiten und einem Anfrage-Workflow, der Interessenten automatisch vorqualifiziert. Ein KI-Telefonassistent beantwortet häufige Fragen und nimmt Besichtigungswünsche auf. Qualifizierte Leads werden mit vollständigen Angaben weitergeleitet.",
    result:
      "Das Maklerbüro erhält strukturierte, vorqualifizierte Leads statt ungefilterter Anrufe. Besichtigungstermine werden automatisch koordiniert. Follow-ups laufen ohne manuelle Nacharbeit.",
  },
  pakete: [
    {
      name: "Start",
      tagline: "Professionelle Makler-Website für den Regensburger Markt",
      deliverables: [
        "Responsive Immobilien-Website (bis 8 Seiten)",
        "Strukturierte Objektseiten mit Exposé-Darstellung",
        "Kontaktformular mit automatischer Lead-Benachrichtigung",
        "On-Page SEO für 'Immobilienmakler Regensburg'",
        "DSGVO-konforme Datenschutzdokumentation",
      ],
    },
    {
      name: "Growth",
      tagline: "Website + KI-Telefonassistent für qualifizierte Leads",
      deliverables: [
        "Alles aus Start",
        "KI-Telefonassistent (Objektanfragen & FAQ)",
        "Automatische Besichtigungskoordination",
        "Lead-Qualifizierungsworkflow",
        "Monatliches Reporting & Optimierungsgespräch",
      ],
    },
    {
      name: "Premium",
      tagline: "Vollständige Digitalisierung des Maklerbetriebs in Regensburg",
      deliverables: [
        "Alles aus Growth",
        "Automatisierte Follow-up-Sequenzen nach Besichtigung",
        "CRM-Integration & Lead-Scoring",
        "Verkäufer-Akquise-Workflow (Eigentümeranfragen Regensburg)",
        "Laufende Betreuung, Updates & Priorisierung",
      ],
    },
  ],
  problems: [
    "Hohe Nachfrage bei begrenztem Angebot erzeugt viele unqualifizierte Anfragen, die Maklerzeit binden",
    "Interessenten aus dem Großraum München suchen digital nach Alternativen – ohne SEO ist man für diese Gruppe unsichtbar",
    "Ohne strukturierte Leadqualifizierung ist jeder Anruf ein potenzieller Zeitaufwand ohne Garantie",
    "Besichtigungskoordination für mehrere Objekte ist manuell fehleranfällig und zeitintensiv",
    "Follow-ups nach Besichtigungen passieren unregelmäßig – dabei entscheiden Nachfassaktionen häufig über den Abschluss",
    "Verkäufer-Akquise läuft ausschließlich über Empfehlungen statt über digitale Kanäle",
    "Keine strukturierte Erfassung von Interessenten führt zu fragmentierter Kommunikation",
  ],
  services: [
    {
      icon: "web",
      title: "Immobilien-Website Regensburg",
      description:
        "Hochwertige Makler-Website mit professionellen Objektseiten, Exposé-Darstellung, Anfrage-Workflow und gezieltem SEO für Suchanfragen wie 'Immobilienmakler Regensburg' oder 'Wohnung kaufen Regensburg'. Mobiloptimiert, conversion-stark, DSGVO-konform.",
    },
    {
      icon: "phone",
      title: "KI-Telefonassistent für Immobilienmakler in Regensburg",
      description:
        "Der KI-Telefonassistent beantwortet häufige Fragen zu Objekten, nimmt Besichtigungswünsche auf und qualifiziert Interessenten automatisch vor – damit der Makler nur noch mit ernsthaften Kaufinteressenten spricht.",
    },
    {
      icon: "zap",
      title: "Lead-Automatisierung Regensburg",
      description:
        "Eingehende Anfragen werden automatisch qualifiziert, Besichtigungen koordiniert und Follow-ups nach Terminen strukturiert versandt. Keine Anfrage geht verloren, kein Interessent bleibt ohne Reaktion.",
    },
  ],
  useCases: [
    {
      title: "Qualifizierte Kaufinteressenten aus Regensburg und Umland erfassen",
      description:
        "Interessenten füllen ein strukturiertes Anfrage-Formular aus – mit Budget, Zeitraum und Anforderungen. Auch Zugezogene aus München erhalten sofort eine strukturierte Rückmeldung.",
    },
    {
      title: "Besichtigungstermine ohne manuelle Koordination",
      description:
        "Interessenten buchen Besichtigungstermine direkt über die Website oder per KI-Assistent. Bestätigungen, Erinnerungen und Nachfassaktionen laufen vollautomatisch.",
    },
    {
      title: "Objektanfragen außerhalb der Bürozeiten",
      description:
        "Der KI-Telefonassistent beantwortet Fragen zu Lage, Ausstattung, Preis und Verfügbarkeit rund um die Uhr – potenzielle Käufer erhalten sofort eine relevante Rückmeldung.",
    },
    {
      title: "Follow-up nach Besichtigung automatisieren",
      description:
        "Nach jeder Besichtigung wird automatisch eine strukturierte Nachfass-Sequenz ausgelöst. Im Regensburger Markt mit hoher Kaufbereitschaft sind schnelle Follow-ups entscheidend.",
    },
    {
      title: "Verkäufer-Akquise über digitale Kanäle",
      description:
        "Eigentümer in Regensburg und dem Landkreis, die ihre Immobilie bewerten lassen oder verkaufen möchten, werden gezielt auf der Website abgeholt – mit strukturiertem Bewertungsformular.",
    },
    {
      title: "Sichtbarkeit bei lokalen Suchanfragen in Regensburg",
      description:
        "Die Website wird für Suchanfragen wie 'Immobilienmakler Regensburg', 'Wohnung kaufen Regensburg' oder 'Haus verkaufen Regensburg' optimiert – für nachhaltigen organischen Traffic.",
    },
  ],
  benefits: [
    "Mehr qualifizierte Leads durch strukturierte Vorqualifizierung im Anfrage-Prozess",
    "Automatisierte Besichtigungskoordination spart Maklerzeit in einem Markt mit hohem Anfragevolumen",
    "Professionelle Objektpräsentation stärkt Vertrauen bei Käufern und Verkäufern in Regensburg",
    "Keine verpassten Anfragen – KI-Assistent beantwortet auch abends und am Wochenende",
    "Follow-up-Automatisierung erhöht die Abschlussrate ohne zusätzlichen Aufwand",
    "Bessere Sichtbarkeit bei lokalen und überregionalen Suchanfragen – mehr organische Anfragen",
    "Vollständige DSGVO-Konformität – alle Kundendaten sicher auf europäischen Servern",
  ],
  localContext: [
    "Regensburg ist eine der am stärksten wachsenden Städte Bayerns. Der Immobilienmarkt ist geprägt von stabiler bis steigender Nachfrage – sowohl lokal als auch von Zugezogenen aus dem Großraum München. Makler profitieren von der dynamischen Marktlage, stehen aber vor der Herausforderung, qualifizierte Leads effizient zu bearbeiten.",
    "Cogniiq entwickelt für Immobilienmakler in Regensburg maßgeschneiderte Digitallösungen: eine hochwertige Makler-Website mit strukturierten Objektseiten, einen KI-Telefonassistenten für Interessentenanfragen sowie Automatisierungssysteme für Lead-Qualifizierung, Besichtigungsplanung und Follow-up-Prozesse.",
    "Cogniiq betreut Projekte in Regensburg remote und ist für persönliche Abstimmungen direkt erreichbar. Die Einrichtung dauert 7–14 Tage. Alle Systeme sind vollständig DSGVO-konform und werden auf europäischen Servern betrieben.",
  ],
  internalLinks: [
    { label: "Webdesign Regensburg", href: "/regensburg/webdesign" },
    { label: "KI-Telefonassistent Regensburg", href: "/regensburg/ki-telefonassistent" },
    { label: "Automatisierung Regensburg", href: "/regensburg/automatisierung" },
    { label: "Cogniiq Regensburg", href: "/regensburg" },
    { label: "Immobilien Bayreuth", href: "/webdesign-immobilien-bayreuth" },
    { label: "Immobilien München", href: "/webdesign-immobilien-muenchen" },
    { label: "Bayern", href: "/bayern" },
    { label: "Deutschland", href: "/deutschland" },
  ],
  faq: [
    {
      question: "Kann Cogniiq eine DSGVO-konforme Makler-Website in Regensburg erstellen?",
      answer:
        "Ja. Alle Websites und Systeme sind vollständig DSGVO-konform – mit korrekten Datenschutzdokumentationen, Cookie-Einwilligungen und sicherer Verarbeitung aller Interessentendaten auf europäischen Servern.",
    },
    {
      question: "Wie werden Interessentenanfragen über die Website automatisch vorqualifiziert?",
      answer:
        "Wir integrieren ein strukturiertes Anfrage-Formular, das Budget, Kaufzeitraum, Anforderungen und Kontaktdaten abfragt. Eingehende Anfragen werden direkt kategorisiert und mit vollständigen Informationen ans Maklerbüro weitergeleitet.",
    },
    {
      question: "Wie lange dauert die Einrichtung für einen Immobilienmakler in Regensburg?",
      answer:
        "Die Einrichtung dauert in der Regel 7–14 Tage. Website, KI-Assistent und Automatisierungs-Workflows werden vollständig von Cogniiq aufgebaut – Sie müssen keine technischen Vorkenntnisse mitbringen.",
    },
    {
      question: "Kann der KI-Telefonassistent auch Fragen zu spezifischen Objekten in Regensburg beantworten?",
      answer:
        "Ja. Wir konfigurieren den KI-Assistenten mit den relevanten Informationen zu Ihren Objekten – Lage, Ausstattung, Preis, Verfügbarkeit. Interessenten erhalten sofortige und präzise Antworten.",
    },
    {
      question: "Kann die Website auch neue Objekte einfach aufnehmen?",
      answer:
        "Ja. Wir bauen die Website so, dass Sie neue Objekte selbst einstellen können – ohne Programmierkenntnisse. Auf Wunsch übernimmt Cogniiq auch die laufende Pflege.",
    },
    {
      question: "Betreut Cogniiq die Systeme auch nach dem Go-live in Regensburg?",
      answer:
        "Ja. Cogniiq betreut alle Systeme remote – für Updates, Optimierungen, neue Objekte und Systemerweiterungen. Persönliche Termine in Regensburg sind auf Anfrage möglich.",
    },
    {
      question: "Kann Cogniiq auch bei der digitalen Verkäufer-Akquise in Regensburg helfen?",
      answer:
        "Ja. Wir konzipieren Seiten und Formulare speziell für Eigentümer im Raum Regensburg, die ihre Immobilie bewerten lassen oder verkaufen möchten – mit sofortiger Reaktion und professionellem ersten Eindruck.",
    },
  ],
};

export function WebdesignImmobilienRegensburg() {
  return <IndustryPage config={config} />;
}
