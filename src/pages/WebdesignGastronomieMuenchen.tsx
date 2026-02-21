import { IndustryPage } from "@/components/IndustryPage";
import type { IndustryPageConfig } from "@/components/IndustryPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const base = BUSINESS_INFO.website;

const config: IndustryPageConfig = {
  route: "/webdesign-gastronomie-muenchen",
  industry: "Gastronomie",
  industrySlug: "gastronomie",
  seo: {
    title: "Webdesign & KI-Telefonassistent für Gastronomie in München | Cogniiq",
    description:
      "Restaurant Website München: Cogniiq erstellt Websites, KI-Telefonassistenten und Reservierungsautomatisierungen für Restaurants und Gastronomie in München. Mehr Reservierungen, weniger Telefonaufwand, DSGVO-konform.",
    canonical: `${base}/webdesign-gastronomie-muenchen`,
    keywords:
      "Restaurant Website München, Reservierungssystem Gastronomie München, Website Gastronomie München, KI Telefonassistent Restaurant München",
  },
  hero: {
    trustTags: ["München", "DSGVO-konform", "KI-Integration", "Reservierungen", "Automatisierung"],
    ctaLabel: "Projekt für Gastronomie starten",
  },
  intro: {
    h1: "Webdesign & KI-Telefonassistent für Gastronomie in München",
    lead: "Cogniiq entwickelt Websites, KI-Telefonassistenten und Automatisierungssysteme für Restaurants und Gastronomie in München – für mehr Tischreservierungen, bessere Erreichbarkeit und automatisierte Gästekommunikation in einem der wettbewerbsintensivsten Gastronomiemärkte Deutschlands.",
  },
  problems: [
    "München hat über 5.000 Restaurants – ohne starke Online-Präsenz und Reservierungssystem gehen Gäste zur Konkurrenz",
    "Telefonanrufe für Reservierungen binden Servicepersonal genau dann, wenn es am Tisch gebraucht wird",
    "Außerhalb der Öffnungszeiten eingegangene Reservierungsanfragen bleiben unbeantwortet – Tische bleiben leer",
    "Gäste in München erwarten eine mobile-optimierte Website mit Menü, Fotos und direkt buchbaren Tischen",
    "Keine zentrale Lösung für Online-Tischreservierungen über Website, Google und Telefon",
    "Manuelle Bestätigungen und Erinnerungen für Reservierungen kosten Zeit und werden häufig vergessen",
    "Fehlende Sichtbarkeit bei Suchanfragen wie 'Restaurant München' oder 'Tisch reservieren München'",
  ],
  services: [
    {
      icon: "web",
      title: "Restaurant-Website München",
      description:
        "Professionelle Gastronomie-Website mit Online-Reservierungssystem, Speisekarte, Veranstaltungskalender und gezieltem Local-SEO für Suchanfragen wie 'Restaurant München' oder 'Tisch reservieren München'. Visuell stark, mobiloptimiert und auf Conversions ausgelegt.",
    },
    {
      icon: "phone",
      title: "KI-Telefonassistent für Münchner Restaurants",
      description:
        "Der KI-Telefonassistent nimmt Reservierungsanrufe automatisch entgegen, beantwortet Fragen zu Öffnungszeiten, Verfügbarkeit und Sonderangeboten, trägt Tischbuchungen direkt ins System ein und entlastet so Ihr Servicepersonal – auch während des Abendservice und an Wochenenden.",
    },
    {
      icon: "zap",
      title: "Reservierungs-Automatisierung",
      description:
        "Reservierungsbestätigungen, Erinnerungen vor dem Besuch und automatisierte Feedback-Anfragen nach dem Restaurantbesuch laufen ohne manuellen Aufwand ab. In einem hochfrequentierten Münchner Restaurant sind strukturierte Gästeprozesse kein Luxus, sondern Effizienzvoraussetzung.",
    },
  ],
  useCases: [
    {
      title: "Tischreservierungen rund um die Uhr",
      description:
        "Münchner Gäste reservieren spontan – auch spätabends oder am Wochenende. Über die Restaurant-Website oder per KI-Telefonassistent können Tische jederzeit gebucht werden, ohne dass Ihr Team eingebunden werden muss.",
    },
    {
      title: "Automatische Reservierungsbestätigung und Erinnerung",
      description:
        "Nach einer Buchung erhalten Gäste sofort eine Bestätigung. Kurz vor dem Termin folgt eine automatische Erinnerung – die No-Show-Rate sinkt, Tische bleiben gefüllt. Gerade am Wochenende in München ein entscheidender Vorteil.",
    },
    {
      title: "Öffnungszeitenanfragen automatisch beantworten",
      description:
        "Der KI-Telefonassistent beantwortet wiederkehrende Fragen zu Öffnungszeiten, Parkmöglichkeiten, Speisekarte und Sonderveranstaltungen – ohne Personalaufwand, rund um die Uhr.",
    },
    {
      title: "Anfragen für Events und Gruppenreservierungen",
      description:
        "Anfragen für Firmenfeiern, Geburtstage oder geschlossene Gesellschaften werden über ein strukturiertes Formular auf der Website oder per KI-Assistent qualifiziert erfasst und direkt an die zuständige Person weitergeleitet.",
    },
    {
      title: "Sichtbarkeit bei lokalen Suchanfragen in München",
      description:
        "Die Restaurant-Website wird für Suchanfragen wie 'Restaurant München Innenstadt', 'Biergarten München' oder 'Tisch reservieren München' optimiert – mehr organische Sichtbarkeit in einer der meistgesuchten Gastrometropolen Deutschlands.",
    },
    {
      title: "Telefonbestellungen für Take-away strukturiert erfassen",
      description:
        "Bestellungen für Take-away werden per KI-Telefonassistent oder Online-Formular strukturiert entgegengenommen – mit automatischer Übergabe an die Küche und sofortiger Bestätigung an den Gast.",
    },
  ],
  benefits: [
    "Keine verpassten Reservierungsanrufe – auch im laufenden Abendservice und außerhalb der Öffnungszeiten",
    "Automatisierte Reservierungsprozesse entlasten Ihr Serviceteam in einem der busiest Gastronomiestandorte Deutschlands",
    "Mehr qualifizierte Tischbuchungen durch eine suchmaschinenoptimierte Restaurant-Website für München",
    "24/7-Erreichbarkeit für Münchner Gäste – auf jedem Kanal, zu jeder Zeit",
    "Zeitersparnis durch automatisierte Bestätigungen, Erinnerungen und Gästekommunikation",
    "Professioneller Marktauftritt durch moderne Website – entscheidend in Münchens hart umkämpfter Gastrolandschaft",
    "Vollständige DSGVO-Konformität – alle Gästedaten werden sicher auf europäischen Servern verarbeitet",
  ],
  localContext: [
    "München ist die Gastronomiehauptstadt Bayerns – mit über 5.000 Restaurants, Bars, Cafés und Event-Locations. Der Wettbewerb um Gäste ist in keiner anderen deutschen Stadt so intensiv. Gleichzeitig sind die Ansprüche der Münchner Gäste hoch: digitale Buchbarkeit, schnelle Reaktionszeiten und ein überzeugender erster Eindruck online sind keine Extras, sondern Grundvoraussetzung.",
    "Cogniiq entwickelt für Gastronomiebetriebe in München passgenaue Digitallösungen: eine moderne Restaurant-Website mit integriertem Reservierungssystem, einen KI-Telefonassistenten, der Reservierungen entgegennimmt und Fragen beantwortet, sowie Automatisierungen, die Bestätigungen, Erinnerungen und Feedback-Prozesse ohne manuellen Aufwand steuern.",
    "Alle Systeme sind vollständig DSGVO-konform und in der Regel innerhalb von 7–14 Tagen einsatzbereit. Die Betreuung erfolgt durch Cogniiq direkt – persönlich, transparent und ohne unnötige Zwischenstellen.",
  ],
  internalLinks: [
    { label: "Webdesign München", href: "/muenchen/webdesign" },
    { label: "KI-Telefonassistent München", href: "/muenchen/ki-telefonassistent" },
    { label: "Automatisierung München", href: "/muenchen/automatisierung" },
    { label: "Cogniiq München", href: "/muenchen" },
    { label: "Gastronomie Bayreuth", href: "/webdesign-gastronomie-bayreuth" },
    { label: "Gastronomie Regensburg", href: "/webdesign-gastronomie-regensburg" },
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
      question: "Funktioniert der KI-Telefonassistent auch während des laufenden Abendservices?",
      answer:
        "Ja. Der KI-Telefonassistent nimmt Anrufe unabhängig davon entgegen, ob Ihr Personal gerade im Service gebunden ist. Reservierungen werden automatisch erfasst und an Ihr System übergeben.",
    },
    {
      question: "Wie lange dauert die Einrichtung für ein Restaurant in München?",
      answer:
        "Die Einrichtung dauert in der Regel 7–14 Tage und wird vollständig von Cogniiq übernommen. Keine technischen Vorkenntnisse erforderlich.",
    },
    {
      question: "Kann die Website auch saisonale Menüs und Events abbilden?",
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

export function WebdesignGastronomieMuenchen() {
  return <IndustryPage config={config} />;
}
