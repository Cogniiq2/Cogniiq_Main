import { IndustryPage } from "@/components/IndustryPage";
import type { IndustryPageConfig } from "@/components/IndustryPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const base = BUSINESS_INFO.website;

const config: IndustryPageConfig = {
  route: "/webdesign-immobilien-bayreuth",
  industry: "Immobilien",
  industrySlug: "immobilien",
  city: "Bayreuth",
  citySlug: "bayreuth",
  cityHub: "/bayreuth",
  seo: {
    title: "Webdesign & KI-Telefonassistent für Immobilienmakler in Bayreuth | Cogniiq",
    description:
      "Immobilien Website Bayreuth: Cogniiq entwickelt Websites, KI-Telefonassistenten und Lead-Automatisierungen für Immobilienmakler in Bayreuth. Mehr Anfragen, automatisierte Besichtigungen, DSGVO-konform.",
    canonical: `${base}/webdesign-immobilien-bayreuth`,
    keywords:
      "Immobilien Website Bayreuth, Makler Website Bayreuth, Immobilienmakler Bayreuth Digital, KI Telefonassistent Immobilien Bayreuth",
  },
  hero: {
    trustTags: ["Bayreuth", "DSGVO-konform", "KI-Integration", "Lead-Qualifizierung", "Automatisierung"],
    ctaLabel: "Projekt für Immobilienmakler starten",
  },
  intro: {
    h1: "Webdesign & KI-Telefonassistent für Immobilienmakler in Bayreuth",
    lead: "Cogniiq entwickelt Websites, KI-Telefonassistenten und Automatisierungssysteme für Immobilienmakler in Bayreuth – für mehr qualifizierte Kaufanfragen, automatisierte Besichtigungsprozesse und professionelle Objektpräsentation. DSGVO-konform, lokal betreut.",
  },
  engpaesse: [
    "Eingehende Interessentenanrufe lassen sich nicht skalieren – jeder Anruf kostet Maklerzeit ohne Vorqualifizierung",
    "Besichtigungstermine werden manuell koordiniert, was bei mehreren Objekten schnell unübersichtlich wird",
    "Veraltete oder templatebasierte Makler-Website wirkt unglaubwürdig und konvertiert schlecht",
    "Qualifizierte Kaufinteressenten aus Bayreuth finden die Objekte nicht, weil lokale SEO fehlt",
    "Nachfassaktionen und Follow-ups nach Besichtigungen passieren inkonsistent oder gar nicht",
  ],
  solutionSteps: [
    {
      step: "Schritt 1",
      title: "Analyse & Konzept",
      description:
        "Wir analysieren den bestehenden Lead-Prozess, die Objektstruktur und typische Anfragenmuster und entwickeln ein Konzept für Website, KI-Assistent und Automatisierung – abgestimmt auf den Bayreuther Immobilienmarkt.",
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
        "Alle Systeme gehen nach Abnahme live. Cogniiq betreut das Setup dauerhaft – für neue Objekte, Marktanpassungen und Erweiterungen des Automatisierungssystems.",
    },
  ],
  workflow: {
    title: "Beispiel-Workflow: Immobilienmakler Bayreuth",
    trigger:
      "Ein Immobilienmakler in Bayreuth hatte täglich mehrere eingehende Anfragen zu Objekten – per Telefon und über ein einfaches Kontaktformular. Ohne Vorqualifizierung war jede Anfrage ein potentieller Zeitaufwand ohne Abschlussgarantie.",
    process:
      "Cogniiq baute eine neue Makler-Website mit strukturierten Objektseiten und einem Anfrage-Workflow, der Interessenten automatisch vorqualifiziert. Ein KI-Telefonassistent beantwortet häufige Fragen zu Objekten und nimmt Besichtigungswünsche auf. Qualifizierte Leads werden mit vollständigen Angaben ans Maklerbüro weitergeleitet.",
    result:
      "Der Makler erhält strukturierte, vorqualifizierte Leads statt ungefilterter Anrufe. Besichtigungstermine werden automatisch koordiniert, Follow-ups laufen ohne manuelle Nacharbeit.",
  },
  pakete: [
    {
      name: "Start",
      tagline: "Professionelle Makler-Website mit Objektpräsentation",
      deliverables: [
        "Responsive Immobilien-Website (bis 8 Seiten)",
        "Strukturierte Objektseiten mit Exposé-Darstellung",
        "Kontaktformular mit automatischer Lead-Benachrichtigung",
        "On-Page SEO für 'Immobilienmakler Bayreuth'",
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
      tagline: "Vollständige Digitalisierung des Maklerbetriebs",
      deliverables: [
        "Alles aus Growth",
        "Automatisierte Follow-up-Sequenzen nach Besichtigung",
        "CRM-Integration & Lead-Scoring",
        "Verkäufer-Akquise-Workflow (Eigentümeranfragen)",
        "Laufende Betreuung, Updates & Priorisierung",
      ],
    },
  ],
  problems: [
    "Eingehende Interessentenanrufe ohne Vorqualifizierung kosten viel Maklerzeit ohne Ergebnis",
    "Besichtigungstermine manuell koordinieren ist bei mehreren Objekten fehleranfällig und zeitintensiv",
    "Fehlende oder veraltete Makler-Website verliert qualifizierte Kaufinteressenten aus Bayreuth",
    "Keine strukturierten Exposé-Seiten und keine SEO sorgen für geringe Sichtbarkeit bei Suchanfragen",
    "Follow-ups nach Besichtigungen passieren unregelmäßig und inkonsistent",
    "Verkäufer-Akquise läuft ausschließlich über persönliche Netzwerke statt über digitale Kanäle",
    "Keine strukturierte Erfassung von Interessenten führt zu fragmentierter Kommunikation",
  ],
  services: [
    {
      icon: "web",
      title: "Immobilien-Website Bayreuth",
      description:
        "Hochwertige Makler-Website mit professionellen Objektseiten, Exposé-Darstellung, Anfrage-Workflow und gezieltem SEO für Suchanfragen wie 'Immobilienmakler Bayreuth' oder 'Wohnung kaufen Bayreuth'. Mobiloptimiert, conversion-stark, DSGVO-konform.",
    },
    {
      icon: "phone",
      title: "KI-Telefonassistent für Immobilienmakler in Bayreuth",
      description:
        "Der KI-Telefonassistent beantwortet häufige Fragen zu Objekten, nimmt Besichtigungswünsche auf und qualifiziert Interessenten automatisch vor – damit der Makler nur noch mit ernsthaften Kaufinteressenten spricht.",
    },
    {
      icon: "zap",
      title: "Lead-Automatisierung Bayreuth",
      description:
        "Eingehende Anfragen werden automatisch qualifiziert, Besichtigungen koordiniert und Follow-ups nach Terminen strukturiert versandt. Keine Anfrage geht verloren, kein Interessent bleibt ohne Reaktion.",
    },
  ],
  useCases: [
    {
      title: "Qualifizierte Kaufinteressenten automatisch erfassen",
      description:
        "Interessenten für Objekte in Bayreuth füllen ein strukturiertes Anfrage-Formular aus – mit Budget, Zeitraum und Anforderungen. Der Makler erhält vorqualifizierte Leads statt ungefilterter Anrufe.",
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
        "Nach jeder Besichtigung wird automatisch eine strukturierte Nachfass-Sequenz ausgelöst. Kein Interessent wird vergessen, kein Kaufentscheidungsmoment verpasst.",
    },
    {
      title: "Verkäufer-Akquise über digitale Kanäle",
      description:
        "Eigentümer, die über eine Suchanfrage auf die Makler-Website kommen, werden gezielt abgeholt: strukturiertes Bewertungsformular, sofortige Reaktion, professioneller erster Eindruck.",
    },
    {
      title: "Sichtbarkeit bei lokalen Suchanfragen in Bayreuth",
      description:
        "Die Website wird für Suchanfragen wie 'Immobilienmakler Bayreuth', 'Wohnung kaufen Bayreuth' oder 'Haus verkaufen Bayreuth' optimiert – für nachhaltigen organischen Traffic.",
    },
  ],
  benefits: [
    "Mehr qualifizierte Leads durch strukturierte Vorqualifizierung im Anfrage-Prozess",
    "Automatisierte Besichtigungskoordination spart Maklerzeit bei jedem Objekt",
    "Professionelle Objektpräsentation und Makler-Website stärkt Vertrauen bei Käufern und Verkäufern",
    "Keine verpassten Anfragen – KI-Assistent beantwortet auch abends und am Wochenende",
    "Follow-up-Automatisierung erhöht die Abschlussrate ohne zusätzlichen Aufwand",
    "Bessere Sichtbarkeit bei lokalen Suchanfragen in Bayreuth – mehr organische Anfragen",
    "Vollständige DSGVO-Konformität – alle Kundendaten sicher auf europäischen Servern",
  ],
  localContext: [
    "Der Bayreuther Immobilienmarkt ist von einer stabilen Nachfrage geprägt – sowohl im Kauf- als auch im Mietbereich. Makler stehen vor der Herausforderung, qualifizierte Interessenten schnell zu erreichen und gleichzeitig die eigene Effizienz bei der Lead-Bearbeitung zu steigern.",
    "Cogniiq entwickelt für Immobilienmakler in Bayreuth maßgeschneiderte Digitallösungen: eine hochwertige Makler-Website mit strukturierten Objektseiten, einen KI-Telefonassistenten für Interessentenanfragen sowie Automatisierungssysteme für Lead-Qualifizierung, Besichtigungsplanung und Follow-up-Prozesse.",
    "Als Bayreuther Unternehmen mit direktem Ortsbezug verstehen wir den lokalen Markt und sind persönlich erreichbar. Die Einrichtung dauert 7–14 Tage. Alle Systeme sind vollständig DSGVO-konform und werden auf europäischen Servern betrieben.",
  ],
  internalLinks: [
    { label: "Webdesign Bayreuth", href: "/bayreuth/webdesign" },
    { label: "KI-Telefonassistent Bayreuth", href: "/bayreuth/ki-telefonassistent" },
    { label: "Automatisierung Bayreuth", href: "/bayreuth/automatisierung" },
    { label: "Cogniiq Bayreuth", href: "/bayreuth" },
    { label: "Immobilien München", href: "/webdesign-immobilien-muenchen" },
    { label: "Immobilien Regensburg", href: "/webdesign-immobilien-regensburg" },
    { label: "Bayern", href: "/bayern" },
    { label: "Deutschland", href: "/deutschland" },
  ],
  faq: [
    {
      question: "Kann Cogniiq eine DSGVO-konforme Makler-Website in Bayreuth erstellen?",
      answer:
        "Ja. Alle Websites und Systeme sind vollständig DSGVO-konform – mit korrekten Datenschutzdokumentationen, Cookie-Einwilligungen und sicherer Verarbeitung aller Interessentendaten auf europäischen Servern.",
    },
    {
      question: "Wie werden Interessentenanfragen über die Website automatisch vorqualifiziert?",
      answer:
        "Wir integrieren ein strukturiertes Anfrage-Formular, das Budget, Kaufzeitraum, Anforderungen und Kontaktdaten abfragt. Eingehende Anfragen werden direkt kategorisiert und mit allen relevanten Informationen ans Maklerbüro weitergeleitet.",
    },
    {
      question: "Wie lange dauert die Einrichtung für einen Immobilienmakler in Bayreuth?",
      answer:
        "Die Einrichtung dauert in der Regel 7–14 Tage. Website, KI-Assistent und Automatisierungs-Workflows werden vollständig von Cogniiq aufgebaut – Sie müssen keine technischen Vorkenntnisse mitbringen.",
    },
    {
      question: "Kann der KI-Telefonassistent auch Fragen zu spezifischen Objekten beantworten?",
      answer:
        "Ja. Wir konfigurieren den KI-Assistenten mit den relevanten Informationen zu Ihren Objekten – Lage, Ausstattung, Preis, Verfügbarkeit. Interessenten erhalten sofortige und präzise Antworten, auch außerhalb der Bürozeiten.",
    },
    {
      question: "Kann die Website auch neue Objekte einfach aufnehmen?",
      answer:
        "Ja. Wir bauen die Website so, dass Sie neue Objekte selbst einstellen oder pflegen können – ohne Programmierkenntnisse. Auf Wunsch übernimmt Cogniiq auch die laufende Pflege.",
    },
    {
      question: "Betreut Cogniiq die Systeme auch nach dem Go-live?",
      answer:
        "Ja. Als Bayreuther Unternehmen sind wir dauerhaft für Updates, Optimierungen, neue Objekte und Systemerweiterungen erreichbar – per Video-Call oder persönlich vor Ort.",
    },
    {
      question: "Kann Cogniiq auch bei der digitalen Verkäufer-Akquise helfen?",
      answer:
        "Ja. Wir konzipieren gezielt Seiten und Formulare für Eigentümer, die ihre Immobilie bewerten lassen oder verkaufen möchten – mit sofortiger Reaktion und professionellem ersten Eindruck.",
    },
  ],
};

export function WebdesignImmobilienBayreuth() {
  return <IndustryPage config={config} />;
}
