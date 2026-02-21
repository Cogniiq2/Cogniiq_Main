import { IndustryPage } from "@/components/IndustryPage";
import type { IndustryPageConfig } from "@/components/IndustryPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const base = BUSINESS_INFO.website;

const config: IndustryPageConfig = {
  route: "/webdesign-gastronomie-regensburg",
  industry: "Gastronomie",
  industrySlug: "gastronomie",
  seo: {
    title: "Webdesign & KI-Telefonassistent für Gastronomie in Regensburg | Cogniiq",
    description:
      "Restaurant Website Regensburg: Cogniiq erstellt Websites, KI-Telefonassistenten und Reservierungsautomatisierungen für Restaurants und Gastronomie in Regensburg. Mehr Reservierungen, weniger Telefonaufwand, DSGVO-konform.",
    canonical: `${base}/webdesign-gastronomie-regensburg`,
    keywords:
      "Restaurant Website Regensburg, Reservierungssystem Gastronomie Regensburg, Website Gastronomie Regensburg, KI Telefonassistent Restaurant Regensburg",
  },
  hero: {
    trustTags: ["Regensburg", "DSGVO-konform", "KI-Integration", "Reservierungen", "Persönliche Betreuung"],
    ctaLabel: "Projekt für Gastronomie starten",
  },
  intro: {
    h1: "Webdesign & KI-Telefonassistent für Gastronomie in Regensburg",
    lead: "Cogniiq entwickelt Websites, KI-Telefonassistenten und Automatisierungssysteme für Restaurants und Gastronomie in Regensburg – für mehr Tischreservierungen, bessere Erreichbarkeit und automatisierte Gästekommunikation in der historischen Weltkulturerbestadt.",
  },
  problems: [
    "Regensburgs lebhafte Gastronomie rund um die Altstadt und den Dom steht vor wachsendem digitalem Wettbewerb",
    "Telefonanrufe für Reservierungen binden Servicepersonal genau dann, wenn es am Tisch gebraucht wird",
    "Außerhalb der Öffnungszeiten eingegangene Reservierungsanfragen bleiben oft unbeantwortet – Tische bleiben leer",
    "Gäste aus Tourismus und Universität erwarten eine mobiloptimierte Website mit Menü, Fotos und direkter Buchungsmöglichkeit",
    "Keine zentrale Lösung für Online-Tischreservierungen über Website und Telefon",
    "Manuelle Bestätigungen und Erinnerungen für Reservierungen kosten Zeit und passieren unvollständig",
    "Fehlende Sichtbarkeit bei Suchanfragen wie 'Restaurant Regensburg' oder 'Tisch reservieren Regensburg'",
  ],
  services: [
    {
      icon: "web",
      title: "Restaurant-Website Regensburg",
      description:
        "Professionelle Gastronomie-Website mit Online-Reservierungssystem, Speisekarte, Veranstaltungskalender und gezieltem Local-SEO für Suchanfragen wie 'Restaurant Regensburg' oder 'Tisch reservieren Regensburg'. Authentisch gestaltet, mobiloptimiert und auf Conversions ausgelegt.",
    },
    {
      icon: "phone",
      title: "KI-Telefonassistent für Regensburger Restaurants",
      description:
        "Der KI-Telefonassistent nimmt Reservierungsanrufe automatisch entgegen, beantwortet Fragen zu Öffnungszeiten, Verfügbarkeit und Tagesangeboten, trägt Tischbuchungen direkt ins System ein und entlastet so das Servicepersonal – auch während des Abendservice.",
    },
    {
      icon: "zap",
      title: "Reservierungs-Automatisierung",
      description:
        "Reservierungsbestätigungen, Erinnerungen vor dem Besuch und automatisierte Feedback-Anfragen nach dem Restaurantbesuch laufen ohne manuellen Aufwand ab. Strukturierte Gästeprozesse für lokale Regensburger Gastronomie.",
    },
  ],
  useCases: [
    {
      title: "Tischreservierungen rund um die Uhr",
      description:
        "Gäste – ob Einheimische, Studenten oder Touristen – können über die Restaurant-Website oder per KI-Telefonassistent jederzeit einen Tisch reservieren, auch wenn das Restaurant geschlossen oder das Personal im Service gebunden ist.",
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
      title: "Anfragen für Events und Gruppenreservierungen",
      description:
        "Anfragen für Betriebsfeiern, Geburtstage oder Gruppenreservierungen werden über ein strukturiertes Formular auf der Website oder per KI-Assistent erfasst und weitergeleitet.",
    },
    {
      title: "Sichtbarkeit bei lokalen Suchanfragen in Regensburg",
      description:
        "Die Restaurant-Website wird für Suchanfragen wie 'Restaurant Regensburg Altstadt', 'Biergarten Regensburg' oder 'Tisch reservieren Regensburg' optimiert – mehr organische Sichtbarkeit für lokale und touristische Gäste.",
    },
    {
      title: "Telefonbestellungen für Take-away strukturiert erfassen",
      description:
        "Bestellungen für Take-away werden per KI-Telefonassistent oder Online-Formular strukturiert entgegengenommen – mit automatischer Übergabe an die Küche und Bestätigung an den Gast.",
    },
  ],
  benefits: [
    "Keine verpassten Reservierungsanrufe – auch im laufenden Service und außerhalb der Öffnungszeiten",
    "Automatisierte Reservierungsprozesse entlasten das Serviceteam spürbar",
    "Mehr qualifizierte Tischbuchungen durch eine suchmaschinenoptimierte Restaurant-Website für Regensburg",
    "Erreichbarkeit für Einheimische, Studenten und Touristen – rund um die Uhr, auf jedem Kanal",
    "Persönliche Betreuung durch Cogniiq – abgestimmt auf die regionalen Eigenheiten des Regensburger Gastronomiemarkts",
    "Professioneller erster Eindruck durch moderne Website – entscheidend in einer Stadt mit lebhafter Gastro-Konkurrenz",
    "Vollständige DSGVO-Konformität – alle Gästedaten werden sicher auf europäischen Servern verarbeitet",
  ],
  localContext: [
    "Regensburg zieht jährlich Millionen Touristen an und beheimatet eine der ältesten Universitäten Deutschlands. Die Gastronomie der Stadt profitiert von dieser Mischung aus lokalem Stammpublikum, Studenten und internationalem Tourismus – steht aber gleichzeitig vor der Herausforderung, digital präsent und buchbar zu sein.",
    "Cogniiq entwickelt für Gastronomiebetriebe in Regensburg passgenaue Digitallösungen: eine moderne Restaurant-Website mit integriertem Reservierungssystem, einen KI-Telefonassistenten sowie Automatisierungen, die Bestätigungen, Erinnerungen und Feedback-Prozesse ohne manuellen Aufwand steuern.",
    "Wir legen besonderen Wert auf persönliche Betreuung und regionale Abstimmung – die Lösungen werden auf die Eigenheiten des Regensburger Markts zugeschnitten. Die Einrichtung dauert 7–14 Tage. Alle Systeme sind vollständig DSGVO-konform.",
  ],
  internalLinks: [
    { label: "Webdesign Regensburg", href: "/regensburg/webdesign" },
    { label: "KI-Telefonassistent Regensburg", href: "/regensburg/ki-telefonassistent" },
    { label: "Automatisierung Regensburg", href: "/regensburg/automatisierung" },
    { label: "Cogniiq Regensburg", href: "/regensburg" },
    { label: "Gastronomie Bayreuth", href: "/webdesign-gastronomie-bayreuth" },
    { label: "Gastronomie München", href: "/webdesign-gastronomie-muenchen" },
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
        "Ja. Der KI-Telefonassistent nimmt Anrufe unabhängig davon entgegen, ob Ihr Personal gerade im Service gebunden ist. Reservierungen werden automatisch erfasst.",
    },
    {
      question: "Wie lange dauert die Einrichtung für ein Restaurant in Regensburg?",
      answer:
        "Die Einrichtung dauert in der Regel 7–14 Tage und wird vollständig von Cogniiq übernommen. Keine technischen Vorkenntnisse erforderlich.",
    },
    {
      question: "Kann die Website auch saisonale Menüs und lokale Events abbilden?",
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

export function WebdesignGastronomieRegensburg() {
  return <IndustryPage config={config} />;
}
