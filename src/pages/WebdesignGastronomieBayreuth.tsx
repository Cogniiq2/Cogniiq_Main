import { IndustryPage } from "@/components/IndustryPage";
import type { IndustryPageConfig } from "@/components/IndustryPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const base = BUSINESS_INFO.website;

const config: IndustryPageConfig = {
  route: "/webdesign-gastronomie-bayreuth",
  industry: "Gastronomie",
  industrySlug: "gastronomie",
  city: "Bayreuth",
  citySlug: "bayreuth",
  cityHub: "/bayreuth",
  seo: {
    title: "Webdesign & KI-Telefonassistent für Gastronomie in Bayreuth | Cogniiq",
    description:
      "Restaurant Website Bayreuth: Cogniiq erstellt Websites, KI-Telefonassistenten und Reservierungsautomatisierungen für Restaurants in Bayreuth. Mehr Tischreservierungen, weniger Telefonaufwand, DSGVO-konform.",
    canonical: `${base}/webdesign-gastronomie-bayreuth`,
    keywords:
      "Restaurant Website Bayreuth, Reservierungssystem Gastronomie Bayreuth, Website Gastronomie Bayreuth, KI Telefonassistent Restaurant Bayreuth",
  },
  hero: {
    trustTags: ["Bayreuth", "DSGVO-konform", "KI-Integration", "Reservierungen", "Automatisierung"],
    ctaLabel: "Projekt für Gastronomie starten",
  },
  intro: {
    h1: "Webdesign & KI-Telefonassistent für Gastronomie in Bayreuth",
    lead: "Cogniiq entwickelt Websites, KI-Telefonassistenten und Automatisierungssysteme für Restaurants und Gastronomie in Bayreuth – für mehr Tischreservierungen, bessere Erreichbarkeit und automatisierte Gästekommunikation. Lokal betreut, DSGVO-konform.",
  },
  engpaesse: [
    "Reservierungsanrufe binden Servicepersonal genau dann, wenn es im Betrieb gebraucht wird",
    "Außerhalb der Öffnungszeiten eingegangene Reservierungsanfragen werden nicht erfasst und gehen verloren",
    "Keine Online-Reservierungsmöglichkeit führt dazu, dass Gäste einfach das nächste Restaurant buchen",
    "Wiederholende Anfragen zu Öffnungszeiten, Menü und Parken kosten täglich unproduktive Servicezeit",
    "Manuelle Reservierungsbestätigungen und Erinnerungen passieren inkonsistent und erzeugen No-Shows",
  ],
  solutionSteps: [
    {
      step: "Schritt 1",
      title: "Analyse & Konzept",
      description:
        "Wir erfassen Reservierungsvolumen, typische Anfragen und bestehende Abläufe und entwickeln ein passgenaues Konzept aus Website, KI-Telefonassistent und Reservierungsautomatisierung.",
    },
    {
      step: "Schritt 2",
      title: "Umsetzung in 7–14 Tagen",
      description:
        "Restaurant-Website mit Reservierungssystem, KI-Assistent und Automations-Workflows werden vollständig von Cogniiq aufgebaut und konfiguriert – ohne IT-Aufwand für den Betrieb.",
    },
    {
      step: "Schritt 3",
      title: "Go-live & laufende Betreuung",
      description:
        "Alle Systeme gehen nach Abnahme live. Als Bayreuther Unternehmen betreut Cogniiq das Setup dauerhaft – für Anpassungen zu Festspielzeiten, saisonalen Änderungen oder Erweiterungen.",
    },
  ],
  workflow: {
    title: "Beispiel-Workflow: Restaurant Bayreuth Innenstadt",
    trigger:
      "Ein Restaurant in der Bayreuther Innenstadt erhielt täglich viele Reservierungsanrufe und hatte während des Servicebetriebs regelmäßig keine Kapazität, ans Telefon zu gehen. Anfragen nach Öffnungszeiten, Menü und Veranstaltungen banden denselben Kanal.",
    process:
      "Cogniiq baute eine neue Restaurant-Website mit integriertem Online-Reservierungssystem und implementierte einen KI-Telefonassistenten für Standardanfragen. Reservierungen werden automatisch erfasst und bestätigt, das Personal nur bei komplexen Gruppenanfragen informiert.",
    result:
      "Reservierungen laufen rund um die Uhr vollautomatisch ein. Das Servicepersonal konzentriert sich auf den Gast. Anfragen zu Öffnungszeiten und Menü werden ohne Personalaufwand beantwortet.",
  },
  pakete: [
    {
      name: "Start",
      tagline: "Professionelle Restaurant-Website mit Online-Reservierung",
      deliverables: [
        "Responsive Gastronomie-Website (bis 5 Seiten)",
        "Online-Reservierungssystem (Tischbuchung)",
        "Speisekarte & Veranstaltungsbereich",
        "On-Page SEO für 'Restaurant Bayreuth'",
        "DSGVO-konforme Gästekommunikation",
      ],
    },
    {
      name: "Growth",
      tagline: "Website + KI-Telefonassistent für 24/7-Erreichbarkeit",
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
      tagline: "Vollständige Digitalisierung des Reservierungsbetriebs",
      deliverables: [
        "Alles aus Growth",
        "Automatisierter Feedback-Prozess nach Besuch",
        "Gruppenreservierungen & Eventanfragen-Workflow",
        "Saisonale Inhalte & Festspielkommunikation",
        "Laufende Betreuung, Updates & Priorisierung",
      ],
    },
  ],
  problems: [
    "Telefonanrufe für Reservierungen binden Personal besonders zur Stoßzeit im Service",
    "Außerhalb der Öffnungszeiten eingegangene Reservierungsanfragen bleiben oft unbeantwortet",
    "Veraltete oder fehlende Restaurant-Website senkt die Online-Sichtbarkeit und Buchungsrate",
    "Anfragen zu Öffnungszeiten, Menü und Sonderveranstaltungen beanspruchen täglich Servicezeit",
    "Keine zentrale Lösung für Online-Tischreservierungen über Website und Telefon",
    "Manuelle Bestätigungen und Erinnerungen für Reservierungen kosten Zeit und passieren oft unvollständig",
    "Telefonbestellungen für Abholung und Lieferung sind nicht strukturiert erfasst",
  ],
  services: [
    {
      icon: "web",
      title: "Restaurant-Website Bayreuth",
      description:
        "Professionelle Gastronomie-Website mit Online-Reservierungssystem, Speisekarte, Veranstaltungskalender und gezieltem Local-SEO für Suchanfragen wie 'Restaurant Bayreuth' oder 'Tisch reservieren Bayreuth'. Mobiloptimiert, schnell, conversion-stark.",
    },
    {
      icon: "phone",
      title: "KI-Telefonassistent für Restaurants in Bayreuth",
      description:
        "Der KI-Telefonassistent nimmt Reservierungsanrufe automatisch entgegen, beantwortet Fragen zu Öffnungszeiten, Verfügbarkeit und Sonderangeboten, trägt Tischbuchungen ins System ein und entlastet das Servicepersonal – auch abends und am Wochenende.",
    },
    {
      icon: "zap",
      title: "Reservierungs-Automatisierung Bayreuth",
      description:
        "Reservierungsbestätigungen, Erinnerungen vor dem Besuch und automatisierte Feedback-Anfragen nach dem Restaurantbesuch laufen ohne manuellen Aufwand ab. Strukturierte Gästedaten, weniger No-Shows, konsistenter Gäste-Workflow.",
    },
  ],
  useCases: [
    {
      title: "Tischreservierungen rund um die Uhr",
      description:
        "Gäste können über die Restaurant-Website oder per KI-Telefonassistent jederzeit einen Tisch reservieren – auch wenn das Restaurant geschlossen oder das Personal im Service gebunden ist.",
    },
    {
      title: "Automatische Reservierungsbestätigung und Erinnerung",
      description:
        "Nach einer Buchung erhalten Gäste sofort eine Bestätigung. Kurz vor dem Termin folgt eine automatische Erinnerung – No-Show-Rate sinkt, Tische bleiben gefüllt.",
    },
    {
      title: "Öffnungszeitenanfragen automatisch beantworten",
      description:
        "Der KI-Telefonassistent beantwortet wiederkehrende Fragen zu Öffnungszeiten, Parkmöglichkeiten, Speisekarte und Sonderveranstaltungen – ohne Personalaufwand, rund um die Uhr.",
    },
    {
      title: "Gruppenreservierungen und Events in Bayreuth",
      description:
        "Anfragen für Firmenfeiern, Geburtstage oder Hochzeiten werden über ein strukturiertes Formular qualifiziert erfasst – besonders relevant rund um die Bayreuther Festspiele.",
    },
    {
      title: "Sichtbarkeit bei lokalen Suchanfragen",
      description:
        "Die Restaurant-Website wird für Suchanfragen wie 'Restaurant Bayreuth Innenstadt', 'Festspielrestaurant Bayreuth' oder 'Tisch reservieren Bayreuth' optimiert – mehr organische Sichtbarkeit, mehr direkte Buchungen.",
    },
    {
      title: "Telefonbestellungen für Abholung strukturiert erfassen",
      description:
        "Bestellungen für Take-away werden per KI-Telefonassistent oder Online-Formular strukturiert entgegengenommen – mit automatischer Bestätigung an den Gast.",
    },
  ],
  benefits: [
    "Weniger verpasste Reservierungsanrufe – auch im laufenden Service und außerhalb der Öffnungszeiten",
    "Automatisierte Reservierungsprozesse entlasten das Serviceteam spürbar",
    "Mehr qualifizierte Tischbuchungen durch eine suchmaschinenoptimierte Restaurant-Website in Bayreuth",
    "Höhere Erreichbarkeit für Gäste – rund um die Uhr, auf jedem Kanal",
    "Zeitersparnis durch automatisierte Bestätigungen, Erinnerungen und Gästekommunikation",
    "Professioneller erster Eindruck durch moderne Website und sofortige Gesprächsannahme",
    "Vollständige DSGVO-Konformität – alle Gästedaten sicher auf europäischen Servern verarbeitet",
  ],
  localContext: [
    "Die Bayreuther Gastronomie ist vielfältig und wettbewerbsintensiv – von der klassischen Gaststätte über das moderne Restaurant bis hin zu Event-Locations rund um die Festspiele. Gleichzeitig stehen viele Betriebe vor denselben Herausforderungen: zu viele Telefonanrufe, knappe Personalressourcen und eine veraltete Online-Präsenz.",
    "Cogniiq entwickelt für Gastronomiebetriebe in Bayreuth passgenaue Digitallösungen: eine moderne Restaurant-Website mit integriertem Reservierungssystem, einen KI-Telefonassistenten, der Reservierungen entgegennimmt und Fragen beantwortet, sowie Automatisierungen, die Bestätigungen, Erinnerungen und Feedback-Prozesse ohne manuellen Aufwand steuern.",
    "Als Bayreuther Unternehmen kennen wir den lokalen Markt, die saisonalen Besonderheiten rund um die Festspiele und die Erwartungen der regionalen Gäste. Die Einrichtung aller Systeme dauert 7–14 Tage. Alle Lösungen sind vollständig DSGVO-konform.",
  ],
  internalLinks: [
    { label: "Webdesign Bayreuth", href: "/bayreuth/webdesign" },
    { label: "KI-Telefonassistent Bayreuth", href: "/bayreuth/ki-telefonassistent" },
    { label: "Automatisierung Bayreuth", href: "/bayreuth/automatisierung" },
    { label: "Cogniiq Bayreuth", href: "/bayreuth" },
    { label: "Gastronomie München", href: "/webdesign-gastronomie-muenchen" },
    { label: "Gastronomie Regensburg", href: "/webdesign-gastronomie-regensburg" },
    { label: "Bayern", href: "/bayern" },
    { label: "Deutschland", href: "/deutschland" },
  ],
  faq: [
    {
      question: "Kann Cogniiq ein Reservierungssystem in meine Restaurant-Website in Bayreuth integrieren?",
      answer:
        "Ja. Wir integrieren ein maßgeschneidertes Online-Reservierungssystem direkt in Ihre Website – abgestimmt auf Ihre Tischkapazitäten, Öffnungszeiten und Sonderveranstaltungen wie die Bayreuther Festspiele.",
    },
    {
      question: "Funktioniert der KI-Telefonassistent auch während des laufenden Services?",
      answer:
        "Ja. Der KI-Telefonassistent nimmt Anrufe unabhängig davon entgegen, ob Ihr Personal im Service gebunden ist. Reservierungen werden automatisch erfasst und können an Ihr bevorzugtes System übergeben werden.",
    },
    {
      question: "Wie lange dauert die Einrichtung für ein Restaurant in Bayreuth?",
      answer:
        "Die Einrichtung dauert in der Regel 7–14 Tage und wird vollständig von Cogniiq übernommen. Keine technischen Vorkenntnisse erforderlich – wir liefern alles schlüsselfertig.",
    },
    {
      question: "Kann die Website auch Veranstaltungen und saisonale Menüs für die Festspielzeit abbilden?",
      answer:
        "Ja. Wir bauen Ihre Website so, dass Sie Menüs, Aktionswochen und Events – auch rund um die Bayreuther Festspiele – selbst aktualisieren können, einfach und ohne Programmierkenntnisse.",
    },
    {
      question: "Sind Gästedaten aus Reservierungen DSGVO-konform gespeichert?",
      answer:
        "Ja. Alle Gästedaten werden ausschließlich auf europäischen Servern verarbeitet und nach den Anforderungen der DSGVO gespeichert und verwaltet.",
    },
    {
      question: "Kann der KI-Telefonassistent auch Gruppenreservierungen und Eventanfragen bearbeiten?",
      answer:
        "Für Standardreservierungen ja – vollautomatisch. Größere Gruppenanfragen oder Eventbuchungen werden durch den KI-Assistenten qualifiziert erfasst und mit allen relevanten Angaben strukturiert an Ihr Team weitergeleitet.",
    },
    {
      question: "Kann Cogniiq auch bei bestehenden Websites Reservierungsfunktionen nachrüsten?",
      answer:
        "Ja. Wir können ein Reservierungssystem und KI-Telefonassistenten auch an bestehende Restaurant-Websites anbinden, ohne die gesamte Website neu bauen zu müssen. Wir klären die Machbarkeit im Erstgespräch.",
    },
  ],
};

export function WebdesignGastronomieBayreuth() {
  return <IndustryPage config={config} />;
}
