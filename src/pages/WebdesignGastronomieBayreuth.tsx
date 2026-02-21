import { IndustryPage } from "@/components/IndustryPage";
import type { IndustryPageConfig } from "@/components/IndustryPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const base = BUSINESS_INFO.website;

const config: IndustryPageConfig = {
  route: "/webdesign-gastronomie-bayreuth",
  industry: "Gastronomie",
  industrySlug: "gastronomie",
  seo: {
    title: "Webdesign & KI-Telefonassistent für Gastronomie in Bayreuth | Cogniiq",
    description:
      "Restaurant Website Bayreuth: Cogniiq erstellt Websites, KI-Telefonassistenten und Reservierungsautomatisierungen für Restaurants und Gastronomie in Bayreuth. Mehr Reservierungen, weniger Telefonaufwand, DSGVO-konform.",
    canonical: `${base}/webdesign-gastronomie-bayreuth`,
    keywords:
      "Restaurant Website Bayreuth, Reservierungssystem Gastronomie Bayreuth, Website Gastronomie Bayreuth, KI Telefonassistent Restaurant",
  },
  hero: {
    trustTags: ["Bayreuth", "DSGVO-konform", "KI-Integration", "Reservierungen", "Automatisierung"],
    ctaLabel: "Projekt für Gastronomie starten",
  },
  intro: {
    h1: "Webdesign & KI-Telefonassistent für Gastronomie in Bayreuth",
    lead: "Cogniiq entwickelt Websites, KI-Telefonassistenten und Automatisierungssysteme für Restaurants und Gastronomie in Bayreuth – für mehr Tischreservierungen, bessere Erreichbarkeit und automatisierte Gästekommunikation. Lokal betreut, DSGVO-konform.",
  },
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
        "Professionelle Gastronomie-Website mit Online-Reservierungssystem, Speisekarte, Veranstaltungskalender und gezieltem Local-SEO für Suchanfragen wie 'Restaurant Bayreuth' oder 'Tisch reservieren Bayreuth'. Mobiloptimiert, schnell und conversion-stark.",
    },
    {
      icon: "phone",
      title: "KI-Telefonassistent für Restaurants",
      description:
        "Der KI-Telefonassistent nimmt Reservierungsanrufe automatisch entgegen, beantwortet Fragen zu Öffnungszeiten, Verfügbarkeit und Sonderangeboten, trägt Tischbuchungen direkt ins System ein und entlastet so das Servicepersonal – auch abends und am Wochenende.",
    },
    {
      icon: "zap",
      title: "Reservierungs-Automatisierung",
      description:
        "Reservierungsbestätigungen, Erinnerungen vor dem Besuch und automatisierte Feedback-Anfragen nach dem Restaurantbesuch laufen ohne manuellen Aufwand ab. Strukturierte Gästedaten, weniger No-Shows, konsistenter Gäste-Workflow.",
    },
  ],
  useCases: [
    {
      title: "Tischreservierungen rund um die Uhr",
      description:
        "Gäste können über die Restaurant-Website oder per KI-Telefonassistent jederzeit einen Tisch reservieren – auch wenn das Restaurant geschlossen ist oder das Personal im Service gebunden ist.",
    },
    {
      title: "Automatische Reservierungsbestätigung und Erinnerung",
      description:
        "Nach einer Buchung erhalten Gäste sofort eine Bestätigung. Ein bis zwei Stunden vor dem Termin folgt eine automatische Erinnerung – No-Show-Rate sinkt, Tische bleiben gefüllt.",
    },
    {
      title: "Öffnungszeitenanfragen automatisch beantworten",
      description:
        "Der KI-Telefonassistent beantwortet wiederkehrende Fragen zu Öffnungszeiten, Parkmöglichkeiten, Speisekarte und Sonderveranstaltungen – ohne Personalaufwand, rund um die Uhr.",
    },
    {
      title: "Anfragen für Events und Gruppenreservierungen",
      description:
        "Anfragen für Firmenfeiern, Geburtstage oder Hochzeiten werden über ein strukturiertes Formular auf der Website oder per KI-Assistent qualifiziert erfasst und direkt an die zuständige Person weitergeleitet.",
    },
    {
      title: "Sichtbarkeit bei lokalen Suchanfragen",
      description:
        "Die Restaurant-Website wird für Suchanfragen wie 'Restaurant Bayreuth Innenstadt', 'Festspielrestaurant Bayreuth' oder 'Tisch reservieren Bayreuth' optimiert – mehr organische Sichtbarkeit, mehr direkte Buchungen.",
    },
    {
      title: "Telefonbestellungen für Abholung strukturiert erfassen",
      description:
        "Bestellungen für Take-away werden per KI-Telefonassistent oder Online-Formular strukturiert entgegengenommen – mit automatischer Übergabe an die Küche und Bestätigung an den Gast.",
    },
  ],
  benefits: [
    "Weniger verpasste Reservierungsanrufe – auch im laufenden Service und außerhalb der Öffnungszeiten",
    "Automatisierte Reservierungsprozesse entlasten das Serviceteam spürbar",
    "Mehr qualifizierte Tischbuchungen durch eine suchmaschinenoptimierte Restaurant-Website",
    "Höhere Erreichbarkeit für Gäste – rund um die Uhr, auf jedem Kanal",
    "Zeitersparnis durch automatisierte Bestätigungen, Erinnerungen und Gästekommunikation",
    "Professioneller erster Eindruck durch moderne Website und sofortige Gesprächsannahme",
    "Vollständige DSGVO-Konformität – alle Gästedaten werden sicher auf europäischen Servern verarbeitet",
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
    { label: "Alle Leistungen", href: "/leistungen" },
    { label: "Bayern", href: "/bayern" },
    { label: "Deutschland", href: "/deutschland" },
  ],
  faq: [
    {
      question: "Kann Cogniiq ein Reservierungssystem in die Restaurant-Website integrieren?",
      answer:
        "Ja. Wir integrieren ein maßgeschneidertes Online-Reservierungssystem direkt in Ihre Website – abgestimmt auf Ihre Tischkapazitäten, Öffnungszeiten und Sonderveranstaltungen.",
    },
    {
      question: "Funktioniert der KI-Telefonassistent auch während des laufenden Services?",
      answer:
        "Ja. Der KI-Telefonassistent nimmt Anrufe unabhängig davon entgegen, ob Ihr Personal gerade im Service gebunden ist. Reservierungen werden automatisch erfasst und können an Ihr bevorzugtes System übergeben werden.",
    },
    {
      question: "Wie lange dauert die Einrichtung für ein Restaurant in Bayreuth?",
      answer:
        "Die Einrichtung dauert in der Regel 7–14 Tage und wird vollständig von Cogniiq übernommen. Keine technischen Vorkenntnisse erforderlich.",
    },
    {
      question: "Kann die Website auch Veranstaltungen und saisonale Menüs abbilden?",
      answer:
        "Ja. Wir bauen Ihre Website so, dass Sie Menüs, Aktionswochen und Events selbst aktualisieren können – einfach, ohne Programmierkenntnisse.",
    },
    {
      question: "Sind Gästedaten aus Reservierungen DSGVO-konform gespeichert?",
      answer:
        "Ja. Alle Gästedaten werden ausschließlich auf europäischen Servern verarbeitet und nach den Anforderungen der DSGVO gespeichert und verwaltet.",
    },
  ],
};

export function WebdesignGastronomieBayreuth() {
  return <IndustryPage config={config} />;
}
