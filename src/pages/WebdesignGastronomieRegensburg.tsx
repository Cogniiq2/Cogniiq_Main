import { IndustryPage } from "@/components/IndustryPage";
import type { IndustryPageConfig } from "@/components/IndustryPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const base = BUSINESS_INFO.website;

const config: IndustryPageConfig = {
  route: "/webdesign-gastronomie-regensburg",
  industry: "Gastronomie",
  industrySlug: "gastronomie",
  city: "Regensburg",
  citySlug: "regensburg",
  cityHub: "/regensburg",
  seo: {
    title: "Webdesign & KI-Telefonassistent für Gastronomie in Regensburg | Cogniiq",
    description:
      "Restaurant Website Regensburg: Cogniiq erstellt Websites, KI-Telefonassistenten und Reservierungsautomatisierungen für Restaurants in Regensburg. Mehr Tischreservierungen, weniger Telefonaufwand, DSGVO-konform.",
    canonical: `${base}/webdesign-gastronomie-regensburg`,
    keywords:
      "Restaurant Website Regensburg, Reservierungssystem Gastronomie Regensburg, Website Restaurant Regensburg, KI Telefonassistent Gastronomie Regensburg",
  },
  hero: {
    trustTags: ["Regensburg", "DSGVO-konform", "KI-Integration", "Reservierungen", "Automatisierung"],
    ctaLabel: "Projekt für Gastronomie starten",
  },
  intro: {
    h1: "Webdesign & KI-Telefonassistent für Gastronomie in Regensburg",
    lead: "Cogniiq entwickelt Websites, KI-Telefonassistenten und Automatisierungssysteme für Restaurants und Gastronomie in Regensburg – für mehr Tischreservierungen, bessere Erreichbarkeit und automatisierte Gästekommunikation. DSGVO-konform, schnell eingerichtet.",
  },
  engpaesse: [
    "Regensburgs Gastronomie bedient Studenten, Touristen und Einheimische gleichzeitig – die Reservierungsnachfrage ist unberechenbar und saisonabhängig",
    "In der Altstadt mit begrenzten Tischkapazitäten ist jede nicht aufgenommene Reservierung ein direkter Umsatzverlust",
    "Touristengäste aus aller Welt recherchieren und buchen digital – wer keine englischsprachige Online-Reservierung hat, ist nicht auffindbar",
    "Veranstaltungsanfragen rund um die UNESCO-Welterbestätte kommen strukturlos und werden nicht systematisch bearbeitet",
    "Manuelle Reservierungsbestätigungen passieren inkonsistent und erzeugen No-Shows bei touristischen Buchungen",
  ],
  solutionSteps: [
    {
      step: "Schritt 1",
      title: "Analyse & Konzept",
      description:
        "Wir erfassen Reservierungsvolumen, Gästemix (lokal, Touristen, Studenten) und bestehende Abläufe und entwickeln ein passgenaues Konzept für Website, KI-Assistent und Reservierungsautomatisierung in Regensburg.",
    },
    {
      step: "Schritt 2",
      title: "Umsetzung in 7–14 Tagen",
      description:
        "Restaurant-Website mit Reservierungssystem, KI-Telefonassistent und Automatisierungs-Workflows werden vollständig von Cogniiq aufgebaut – schlüsselfertig, ohne IT-Aufwand für den Betrieb.",
    },
    {
      step: "Schritt 3",
      title: "Go-live & laufende Betreuung",
      description:
        "Alle Systeme gehen nach Abnahme live. Cogniiq betreut das Setup dauerhaft remote – für saisonale Anpassungen, Touristenhochsaison, Eventseiten und Erweiterungen.",
    },
  ],
  workflow: {
    title: "Beispiel-Workflow: Restaurant Regensburg Altstadt",
    trigger:
      "Ein Restaurant in der Regensburger Altstadt hatte täglich Reservierungsanrufe – vor allem am Wochenende und von Touristen, die kurzfristig einen Tisch suchten. Das Personal war im Service gebunden, Anrufe gingen ins Leere.",
    process:
      "Cogniiq baute eine neue Restaurant-Website mit Online-Reservierungssystem und implementierte einen KI-Telefonassistenten für Reservierungen und häufige Fragen. Tischbuchungen werden automatisch erfasst und sofort bestätigt.",
    result:
      "Reservierungen laufen rund um die Uhr vollautomatisch ein – auch für Touristen ohne Sprachkenntnisse. Das Serviceteam konzentriert sich auf den Gast. Die Website bringt kontinuierlich neue Buchungen.",
  },
  pakete: [
    {
      name: "Start",
      tagline: "Professionelle Restaurant-Website für Regensburg",
      deliverables: [
        "Responsive Gastronomie-Website (bis 5 Seiten)",
        "Online-Reservierungssystem (Tischbuchung)",
        "Speisekarte & Veranstaltungsbereich",
        "On-Page SEO für 'Restaurant Regensburg'",
        "DSGVO-konforme Gästekommunikation",
      ],
    },
    {
      name: "Growth",
      tagline: "Website + KI-Telefonassistent für lokale und touristische Gäste",
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
      tagline: "Vollständige Digitalisierung für Regensburger Gastronomiebetriebe",
      deliverables: [
        "Alles aus Growth",
        "Automatisierter Feedback-Prozess nach Besuch",
        "Gruppenreservierungen & Eventanfragen-Workflow",
        "Saisonale Inhalte & Tourismusoptimierung",
        "Laufende Betreuung, Updates & Priorisierung",
      ],
    },
  ],
  problems: [
    "Reservierungsanrufe binden Servicepersonal zur stärksten Betriebszeit",
    "Touristengäste aus dem Ausland buchen digital oder gar nicht – ohne Online-Reservierung geht Traffic verloren",
    "Veraltete oder fehlende Restaurant-Website senkt die Sichtbarkeit bei lokalen und touristischen Suchanfragen",
    "Anfragen zu Öffnungszeiten, Menü und Veranstaltungen beanspruchen täglich unproduktive Servicezeit",
    "Keine automatisierte Erinnerung erzeugt No-Shows besonders bei Touristenbuchungen",
    "Veranstaltungsanfragen für Gruppen kommen strukturlos an und werden nicht systematisch erfasst",
    "Telefonbestellungen für Abholung sind nicht sauber strukturiert",
  ],
  services: [
    {
      icon: "web",
      title: "Restaurant-Website Regensburg",
      description:
        "Professionelle Gastronomie-Website mit Online-Reservierungssystem, digitaler Speisekarte, Event-Seiten und gezieltem SEO für Suchanfragen wie 'Restaurant Regensburg' oder 'Tisch reservieren Regensburg'. Für lokale und internationale Gäste optimiert.",
    },
    {
      icon: "phone",
      title: "KI-Telefonassistent für Restaurants in Regensburg",
      description:
        "Der KI-Telefonassistent nimmt Reservierungsanrufe automatisch entgegen, beantwortet Fragen zu Öffnungszeiten, Verfügbarkeit und Menü und trägt Tischbuchungen ins System ein – auch wenn das Personal im Service gebunden ist.",
    },
    {
      icon: "zap",
      title: "Reservierungs-Automatisierung Regensburg",
      description:
        "Reservierungsbestätigungen, Erinnerungen und automatisierte Feedback-Anfragen nach dem Restaurantbesuch laufen ohne manuellen Aufwand ab. Strukturierte Gästedaten, weniger No-Shows, konsistenter Gäste-Workflow.",
    },
  ],
  useCases: [
    {
      title: "Tischreservierungen für lokale und touristische Gäste rund um die Uhr",
      description:
        "Gäste reservieren über die Website oder per KI-Assistent jederzeit – auch wenn das Restaurant geschlossen hat oder im vollen Betrieb ist. Für internationale Touristen besonders wichtig.",
    },
    {
      title: "Automatische Reservierungsbestätigung und Erinnerung",
      description:
        "Nach einer Buchung erhalten Gäste sofort eine Bestätigung. Kurz vor dem Termin folgt eine automatische Erinnerung – besonders bei Touristenbuchungen, bei denen der Gast den Termin häufig vergisst.",
    },
    {
      title: "Öffnungszeitenanfragen für Touristen automatisch beantworten",
      description:
        "Der KI-Telefonassistent beantwortet wiederkehrende Fragen zu Öffnungszeiten, Parkmöglichkeiten, Speisekarte und Besonderheiten in der Regensburger Altstadt – ohne Personalaufwand, rund um die Uhr.",
    },
    {
      title: "Gruppenreservierungen und Events in Regensburg",
      description:
        "Anfragen für Studigruppenfeiern, Firmenessen oder Touristengruppen werden über ein strukturiertes Formular erfasst und mit allen relevanten Informationen ans Team weitergeleitet.",
    },
    {
      title: "Sichtbarkeit bei Tourismus-Suchanfragen",
      description:
        "Die Website wird für Suchanfragen wie 'Restaurant Regensburg Altstadt', 'Restaurant Welterbe Regensburg' oder 'Tisch reservieren Regensburg' optimiert – mehr organische Sichtbarkeit bei Touristen und Einheimischen.",
    },
    {
      title: "Automatisierter Feedback-Prozess nach Besuch",
      description:
        "Nach dem Besuch erhalten Gäste automatisch eine Feedback-Anfrage. Positives Feedback wird in Richtung Google-Bewertung gelenkt – wichtig für das Ranking in einer stark bewerteten Tourismusstadt.",
    },
  ],
  benefits: [
    "Weniger verpasste Reservierungsanrufe – auch im laufenden Service und außerhalb der Öffnungszeiten",
    "Automatisierte Reservierungsprozesse entlasten das Serviceteam in einem touristisch stark frequentierten Standort",
    "Mehr qualifizierte Tischbuchungen durch eine suchmaschinenoptimierte Restaurant-Website in Regensburg",
    "Höhere Erreichbarkeit für lokale und touristische Gäste – rund um die Uhr, in jeder Sprache",
    "Zeitersparnis durch automatisierte Bestätigungen, Erinnerungen und Gästekommunikation",
    "Professioneller erster Eindruck in einer UNESCO-Welterbestadt mit hohen Gästeansprüchen",
    "Vollständige DSGVO-Konformität – alle Gästedaten sicher auf europäischen Servern",
  ],
  localContext: [
    "Regensburg zieht jährlich Millionen Touristen an und beheimatet eine der ältesten Universitäten Deutschlands. Die Gastronomie der Stadt profitiert von dieser Mischung aus lokalem Stammpublikum, Studenten und internationalem Tourismus – steht aber gleichzeitig vor der Herausforderung, digital präsent und buchbar zu sein.",
    "Cogniiq entwickelt für Gastronomiebetriebe in Regensburg passgenaue Digitallösungen: eine moderne Restaurant-Website mit integriertem Reservierungssystem, einen KI-Telefonassistenten sowie Automatisierungen für Bestätigungen, Erinnerungen und Feedback-Prozesse.",
    "Alle Systeme sind vollständig DSGVO-konform, werden auf europäischen Servern betrieben und sind in der Regel innerhalb von 7–14 Tagen einsatzbereit. Cogniiq betreut das Setup langfristig remote.",
  ],
  internalLinks: [
    { label: "Webdesign Regensburg", href: "/regensburg/webdesign" },
    { label: "KI-Telefonassistent Regensburg", href: "/regensburg/ki-telefonassistent" },
    { label: "Automatisierung Regensburg", href: "/regensburg/automatisierung" },
    { label: "Cogniiq Regensburg", href: "/regensburg" },
    { label: "Gastronomie Bayreuth", href: "/webdesign-gastronomie-bayreuth" },
    { label: "Gastronomie München", href: "/webdesign-gastronomie-muenchen" },
    { label: "Bayern", href: "/bayern" },
    { label: "Deutschland", href: "/deutschland" },
  ],
  faq: [
    {
      question: "Kann Cogniiq ein Reservierungssystem in meine Restaurant-Website in Regensburg integrieren?",
      answer:
        "Ja. Wir integrieren ein maßgeschneidertes Online-Reservierungssystem direkt in Ihre Website – abgestimmt auf Ihre Tischkapazitäten, Öffnungszeiten und den spezifischen Gästemix in Regensburg.",
    },
    {
      question: "Kann der KI-Telefonassistent auch internationale Touristen bedienen?",
      answer:
        "Ja. Der KI-Telefonassistent kann mehrsprachig konfiguriert werden – wichtig in einer Tourismusstadt wie Regensburg mit internationalen Gästen. Standardsprache ist Deutsch, Englisch ist auf Anfrage konfigurierbar.",
    },
    {
      question: "Wie lange dauert die Einrichtung für ein Restaurant in Regensburg?",
      answer:
        "Die Einrichtung dauert in der Regel 7–14 Tage und wird vollständig von Cogniiq übernommen. Keine technischen Vorkenntnisse erforderlich – wir liefern alles schlüsselfertig.",
    },
    {
      question: "Kann die Website auch saisonale Menüs und touristische Informationen abbilden?",
      answer:
        "Ja. Wir bauen Ihre Website so, dass Sie Menüs, saisonale Angebote und Veranstaltungen selbst aktualisieren können – einfach und ohne Programmierkenntnisse.",
    },
    {
      question: "Sind Gästedaten aus Reservierungen DSGVO-konform?",
      answer:
        "Ja. Alle Gästedaten werden ausschließlich auf europäischen Servern verarbeitet und nach den Anforderungen der DSGVO gespeichert und verwaltet.",
    },
    {
      question: "Kann der KI-Assistent auch Gruppenreservierungen und Eventanfragen bearbeiten?",
      answer:
        "Für Standardreservierungen ja – vollautomatisch. Größere Gruppen oder Events werden durch den KI-Assistenten qualifiziert erfasst und mit allen relevanten Angaben strukturiert an Ihr Team weitergeleitet.",
    },
    {
      question: "Wie wichtig ist lokale SEO für Restaurants in Regensburg?",
      answer:
        "Sehr wichtig. Regensburg hat eine hohe Suchaktivität bei touristischen Begriffen wie 'Restaurant Regensburg Altstadt'. Eine gut optimierte Website bringt kontinuierlich neue Buchungen über Google.",
    },
  ],
};

export function WebdesignGastronomieRegensburg() {
  return <IndustryPage config={config} />;
}
