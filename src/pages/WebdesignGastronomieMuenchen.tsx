import { IndustryPage } from "@/components/IndustryPage";
import type { IndustryPageConfig } from "@/components/IndustryPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const base = BUSINESS_INFO.website;

const config: IndustryPageConfig = {
  route: "/webdesign-gastronomie-muenchen",
  industry: "Gastronomie",
  industrySlug: "gastronomie",
  city: "München",
  citySlug: "muenchen",
  cityHub: "/muenchen",
  seo: {
    title: "Webdesign & KI-Telefonassistent für Gastronomie in München | Cogniiq",
    description:
      "Restaurant Website München: Cogniiq entwickelt Websites, KI-Telefonassistenten und Reservierungsautomatisierungen für Restaurants in München. Mehr Tischreservierungen, weniger Telefonaufwand, persönlich betreut.",
    canonical: `${base}/webdesign-gastronomie-muenchen`,
    keywords:
      "Restaurant Website München, Reservierungssystem Gastronomie München, Website Restaurant München, KI Telefonassistent Gastronomie München",
  },
  hero: {
    trustTags: ["München", "KI-Integration", "Reservierungen", "Automatisierung"],
    ctaLabel: "Projekt für Gastronomie starten",
  },
  intro: {
    h1: "Webdesign & KI-Telefonassistent für Gastronomie in München",
    lead: "Cogniiq entwickelt Websites, KI-Telefonassistenten und Automatisierungssysteme für Restaurants und Gastronomie in München – für mehr Tischreservierungen, bessere Erreichbarkeit und automatisierte Gästekommunikation. Schnell eingerichtet, persönlich betreut.",
  },
  engpaesse: [
    "In Münchens wettbewerbsintensivem Gastronomiemarkt kostet eine fehlende Online-Präsenz täglich Tischbuchungen",
    "Reservierungsanrufe während des Betriebs sind in München besonders häufig – Personal ist selten verfügbar",
    "Gäste aus dem internationalen und überregionalen Segment erwarten mehrsprachige Buchungsoptionen und sofortige Bestätigung",
    "Ohne automatisierte Erinnerungen ist die No-Show-Rate besonders an Wochenenden hoch",
    "Eventanfragen für Firmenessen, Oktoberfest-Feiern oder private Veranstaltungen kommen strukturlos an und werden nicht optimal bearbeitet",
  ],
  solutionSteps: [
    {
      step: "Schritt 1",
      title: "Analyse & Konzept",
      description:
        "Wir erfassen Reservierungsvolumen, Veranstaltungsstruktur und typische Anfragen – und entwickeln ein Konzept aus Website, KI-Telefonassistent und Reservierungsautomatisierung, das dem Münchner Gastronomiebetrieb gerecht wird.",
    },
    {
      step: "Schritt 2",
      title: "Umsetzung in 7–14 Tagen",
      description:
        "Restaurant-Website, Reservierungssystem, KI-Assistent und Automations-Workflows werden vollständig von Cogniiq aufgebaut – ohne IT-Aufwand für den Betrieb, schlüsselfertig in Betrieb.",
    },
    {
      step: "Schritt 3",
      title: "Go-live & laufende Betreuung",
      description:
        "Alle Systeme gehen nach Abnahme live. Cogniiq betreut das Setup dauerhaft – für saisonale Anpassungen, neue Menükarten, Event-Seiten und Erweiterungen des Automatisierungssystems.",
    },
  ],
  workflow: {
    title: "Beispielszenario: Restaurant München Innenstadt",
    trigger:
      "Angenommen, ein Restaurant in der Münchner Innenstadt erhält täglich viele Reservierungsanrufe – vor allem abends und am Wochenende. Das Personal ist im Service gebunden, Anrufe gehen ins Leere, Reservierungen werden verpasst.",
    process:
      "Vorgehen: Cogniiq entwickelt eine Restaurant-Website mit Online-Reservierungssystem und richtet einen KI-Telefonassistenten für Reservierungen und häufige Fragen ein. Tischbuchungen werden automatisch erfasst und bestätigt, Gruppenanfragen strukturiert ans Team weitergeleitet.",
    result:
      "So könnten Reservierungen auch dann eingehen, wenn niemand ans Telefon geht, das Serviceteam sich auf den Gast konzentrieren und die Website über die organische Suche auffindbar sein.",
  },
  pakete: [
    {
      name: "Start",
      tagline: "Professionelle Restaurant-Website für München",
      deliverables: [
        "Responsive Gastronomie-Website (bis 5 Seiten)",
        "Online-Reservierungssystem (Tischbuchung)",
        "Speisekarte & Veranstaltungsbereich",
        "On-Page SEO für 'Restaurant München'",
        "Datenschutzerklärung, Impressum und Cookie-Einwilligung",
      ],
    },
    {
      name: "Growth",
      tagline: "Website + KI-Telefonassistent für Erreichbarkeit außerhalb der Öffnungszeiten",
      deliverables: [
        "Alles aus Start",
        "KI-Telefonassistent (Reservierungen & FAQ)",
        "Automatische Bestätigungen & Erinnerungen",
        "Integration mit Reservierungskalender",
        "Monatliches Reporting & Optimierungsgespräch",
      ],
    },
    {
      name: "Premium",
      tagline: "Vollständige Digitalisierung für Münchner Gastronomiebetriebe",
      deliverables: [
        "Alles aus Growth",
        "Automatisierter Feedback-Prozess nach Besuch",
        "Gruppenreservierungen & Event-Anfragen-Workflow",
        "Saisonale Inhalte & Oktoberfest-Kommunikation",
        "Laufende Betreuung, Updates & Priorisierung",
      ],
    },
  ],
  problems: [
    "Reservierungsanrufe binden Servicepersonal zur umsatzstärksten Zeit im laufenden Betrieb",
    "Außerhalb der Öffnungszeiten eingegangene Reservierungsanfragen bleiben unbeantwortet",
    "In München ohne professionelle Restaurant-Website und SEO unsichtbar bei relevanten Suchanfragen",
    "Anfragen zu Öffnungszeiten, Menü und Parkmöglichkeiten kosten täglich wertvolle Servicezeit",
    "Keine automatisierte Erinnerung führt zu hoher No-Show-Rate besonders am Wochenende",
    "Eventanfragen und Gruppenreservierungen kommen unstrukturiert und werden nicht optimal bearbeitet",
    "Telefonbestellungen für Take-away sind nicht sauber strukturiert und erfasst",
  ],
  services: [
    {
      icon: "web",
      title: "Restaurant-Website München",
      description:
        "Hochwertige Gastronomie-Website mit Online-Reservierungssystem, digitaler Speisekarte, Event-Seiten und gezieltem SEO für Suchanfragen wie 'Restaurant München' oder 'Tisch reservieren München'. Mobiloptimiert und conversion-stark.",
    },
    {
      icon: "phone",
      title: "KI-Telefonassistent für Restaurants in München",
      description:
        "Der KI-Telefonassistent nimmt Reservierungsanrufe automatisch entgegen, beantwortet Fragen zu Öffnungszeiten, Verfügbarkeit und Menü, trägt Tischbuchungen ins System ein und entlastet das Servicepersonal – auch beim Oktoberfest-Betrieb.",
    },
    {
      icon: "zap",
      title: "Reservierungs-Automatisierung München",
      description:
        "Reservierungsbestätigungen, Erinnerungen und automatisierte Feedback-Anfragen nach dem Restaurantbesuch laufen ohne manuellen Aufwand ab. Strukturierte Gästedaten, weniger No-Shows, konsistenter Gäste-Workflow.",
    },
  ],
  useCases: [
    {
      title: "Tischreservierungen außerhalb der Öffnungszeiten in München",
      description:
        "Gäste reservieren über die Website oder per KI-Assistent jederzeit – auch wenn das Restaurant im Vollbetrieb ist oder geschlossen hat. In einer Stadt wie München ist Erreichbarkeit außerhalb der Öffnungszeiten selbstverständlich.",
    },
    {
      title: "Automatische Reservierungsbestätigung und Erinnerung",
      description:
        "Nach einer Buchung erhalten Gäste sofort eine Bestätigung. Kurz vor dem Termin folgt eine automatische Erinnerung – besonders wichtig bei vorab gebuchten Events und Firmenfeiern.",
    },
    {
      title: "Öffnungszeitenanfragen automatisch beantworten",
      description:
        "Der KI-Telefonassistent beantwortet wiederkehrende Fragen zu Öffnungszeiten, Parkplätzen, Menü und Sonderaktionen – ohne Personalaufwand, auch außerhalb der Öffnungszeiten und in Stoßzeiten.",
    },
    {
      title: "Gruppenreservierungen und Events in München",
      description:
        "Anfragen für Firmenfeiern, Geburtstage oder Betriebsausflüge werden über ein strukturiertes Formular erfasst und mit allen relevanten Informationen ans Team weitergeleitet.",
    },
    {
      title: "Sichtbarkeit bei lokalen Suchanfragen in München",
      description:
        "Die Restaurant-Website wird für Suchanfragen wie 'Restaurant München Innenstadt', 'Biergarten München' oder 'Tisch reservieren München' optimiert – mehr organische Sichtbarkeit, mehr Buchungen.",
    },
    {
      title: "Automatisierter Feedback-Prozess",
      description:
        "Nach dem Besuch erhalten Gäste automatisch eine Nachricht mit einer Feedback-Anfrage. Positives Feedback wird in Richtung Google-Bewertung gelenkt – wichtig für das Münchner Ranking.",
    },
  ],
  benefits: [
    "Weniger verpasste Reservierungsanrufe – auch im laufenden Betrieb und außerhalb der Öffnungszeiten",
    "Automatisierte Reservierungsprozesse entlasten das Serviceteam in einem der busiest Gastronomiestandorte",
    "Mehr qualifizierte Tischbuchungen durch eine suchmaschinenoptimierte Restaurant-Website in München",
    "Höhere Erreichbarkeit für Gäste – auch außerhalb der Öffnungszeiten, in einer Stadt, die nie schläft",
    "Zeitersparnis durch automatisierte Bestätigungen, Erinnerungen und Gästekommunikation",
    "Professioneller erster Eindruck im wettbewerbsintensivsten Gastronomiemarkt Bayerns",
  ],
  localContext: [
    "München hat eine der dichtesten und wettbewerbsintensivsten Gastronomieszenen in Deutschland. Restaurants konkurrieren nicht nur um lokale Stammgäste, sondern auch um Touristen, Geschäftsreisende und den überregionalen Markt. Eine professionelle Online-Präsenz ist keine Option, sondern Grundvoraussetzung.",
    "Cogniiq entwickelt für Gastronomiebetriebe in München passgenaue Digitallösungen: eine moderne Restaurant-Website mit integriertem Reservierungssystem, einen KI-Telefonassistenten sowie Automatisierungen für Bestätigungen, Erinnerungen und Feedback-Prozesse.",
    "Alle Systeme werden datenschutzorientiert umgesetzt und sind in der Regel innerhalb von 7–14 Tagen einsatzbereit. Cogniiq betreut das Setup langfristig remote – saisonale Anpassungen und neue Menükarten inklusive.",
  ],
  internalLinks: [
    { label: "Webdesign München", href: "/muenchen/webdesign" },
    { label: "KI-Telefonassistent München", href: "/muenchen/ki-telefonassistent" },
    { label: "Automatisierung München", href: "/muenchen/automatisierung" },
    { label: "Cogniiq München", href: "/muenchen" },
    { label: "Gastronomie Bayreuth", href: "/webdesign-gastronomie-bayreuth" },
    { label: "Gastronomie Regensburg", href: "/webdesign-gastronomie-regensburg" },
    { label: "Bayern", href: "/bayern" },
    { label: "Deutschland", href: "/deutschland" },
  ],
  faq: [
    {
      question: "Kann Cogniiq ein Reservierungssystem in meine Restaurant-Website in München integrieren?",
      answer:
        "Ja. Wir integrieren ein maßgeschneidertes Online-Reservierungssystem direkt in Ihre Website – abgestimmt auf Ihre Tischkapazitäten, Öffnungszeiten, Sonderveranstaltungen und die spezifischen Anforderungen des Münchner Markts.",
    },
    {
      question: "Funktioniert der KI-Telefonassistent auch beim Oktoberfest-Betrieb oder bei Spitzenauslastung?",
      answer:
        "Ja. Der KI-Telefonassistent skaliert beliebig – er nimmt unbegrenzt parallel Anrufe entgegen, ohne Wartezeit. Gerade in Hochsaison wie dem Oktoberfest ist das ein entscheidender Vorteil.",
    },
    {
      question: "Wie lange dauert die Einrichtung für ein Restaurant in München?",
      answer:
        "Die Einrichtung dauert in der Regel 7–14 Tage und wird vollständig von Cogniiq übernommen. Keine technischen Vorkenntnisse erforderlich – wir liefern alles schlüsselfertig.",
    },
    {
      question: "Kann die Website auch Veranstaltungen, Saisonkarten und Events abbilden?",
      answer:
        "Ja. Wir bauen Ihre Website so, dass Sie Menüs, Events und saisonale Aktionen selbst aktualisieren können – einfach, ohne Programmierkenntnisse. Auf Wunsch übernehmen wir auch die Pflege.",
    },
    {
      question: "Wie werden Gästedaten aus Reservierungen verarbeitet?",
      answer:
        "Das hängt vom eingesetzten Reservierungstool ab. Wir binden es mit Auftragsverarbeitungsvertrag ein und dokumentieren, welche Daten wohin fließen. Den Verarbeitungsort nennt Ihnen der jeweilige Anbieter verbindlich — wir geben ihn nicht aus zweiter Hand weiter.",
    },
    {
      question: "Kann der KI-Assistent auch englischsprachige Gäste bedienen?",
      answer:
        "Ja. Der KI-Telefonassistent kann mehrsprachig konfiguriert werden – besonders relevant in München mit einem hohen internationalen Gästeanteil.",
    },
    {
      question: "Kann Cogniiq auch bei bestehenden Restaurant-Websites Reservierungsfunktionen nachrüsten?",
      answer:
        "Ja. Wir können ein Reservierungssystem und KI-Telefonassistenten auch an bestehende Restaurant-Websites anbinden, ohne die gesamte Website neu bauen zu müssen.",
    },
  ],
};

export function WebdesignGastronomieMuenchen() {
  return <IndustryPage config={config} />;
}
