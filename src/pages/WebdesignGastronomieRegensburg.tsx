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
      "Restaurant Website Regensburg: Cogniiq erstellt Websites, KI-Telefonassistenten und Reservierungsautomatisierungen für Restaurants in Regensburg. Mehr Tischreservierungen, weniger Telefonaufwand, persönlich betreut.",
    canonical: `${base}/webdesign-gastronomie-regensburg`,
    keywords:
      "Restaurant Website Regensburg, Reservierungssystem Gastronomie Regensburg, Website Restaurant Regensburg, KI Telefonassistent Gastronomie Regensburg",
  },
  hero: {
    trustTags: ["Regensburg", "KI-Integration", "Reservierungen", "Automatisierung"],
    ctaLabel: "Projekt für Gastronomie starten",
  },
  intro: {
    h1: "Webdesign & KI-Telefonassistent für Gastronomie in Regensburg",
    lead: "Cogniiq entwickelt Websites, KI-Telefonassistenten und Automatisierungssysteme für Restaurants und Gastronomie in Regensburg – für mehr Tischreservierungen, bessere Erreichbarkeit und automatisierte Gästekommunikation. Schnell eingerichtet, persönlich betreut.",
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
      title: "Umsetzung in 7–14 Tagen",
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
    title: "Beispielszenario: Restaurant Regensburg Altstadt",
    trigger:
      "Angenommen, ein Restaurant in der Regensburger Altstadt erhält täglich Reservierungsanrufe – vor allem am Wochenende und von Touristen, die kurzfristig einen Tisch suchen. Das Personal ist im Service gebunden, Anrufe gehen ins Leere.",
    process:
      "Vorgehen: Cogniiq entwickelt eine Restaurant-Website mit Online-Reservierungssystem und richtet einen KI-Telefonassistenten für Reservierungen und häufige Fragen ein. Tischbuchungen werden automatisch erfasst und sofort bestätigt.",
    result:
      "So könnten Reservierungen auch außerhalb der Öffnungszeiten eingehen – auch mehrsprachig – und das Serviceteam sich auf den Gast konzentrieren.",
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
        "Datenschutzerklärung, Impressum und Cookie-Einwilligung",
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
      title: "Tischreservierungen für lokale und touristische Gäste außerhalb der Öffnungszeiten",
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
        "Der KI-Telefonassistent beantwortet wiederkehrende Fragen zu Öffnungszeiten, Parkmöglichkeiten, Speisekarte und Besonderheiten in der Regensburger Altstadt – ohne Personalaufwand, auch außerhalb der Öffnungszeiten.",
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
    "Höhere Erreichbarkeit für lokale und touristische Gäste – auch außerhalb der Öffnungszeiten, in jeder Sprache",
    "Zeitersparnis durch automatisierte Bestätigungen, Erinnerungen und Gästekommunikation",
    "Professioneller erster Eindruck in einer UNESCO-Welterbestadt mit hohen Gästeansprüchen",
  ],
  localContext: [
    "Regensburg zieht jährlich Millionen Touristen an und beheimatet eine der ältesten Universitäten Deutschlands. Die Gastronomie der Stadt profitiert von dieser Mischung aus lokalem Stammpublikum, Studenten und internationalem Tourismus – steht aber gleichzeitig vor der Herausforderung, digital präsent und buchbar zu sein.",
    "Cogniiq entwickelt für Gastronomiebetriebe in Regensburg passgenaue Digitallösungen: eine moderne Restaurant-Website mit integriertem Reservierungssystem, einen KI-Telefonassistenten sowie Automatisierungen für Bestätigungen, Erinnerungen und Feedback-Prozesse.",
    "Alle Systeme werden datenschutzorientiert umgesetzt und sind in der Regel innerhalb von 7–14 Tagen einsatzbereit. Cogniiq betreut das Setup langfristig remote.",
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
        "Die Einrichtung dauert in der Regel 7–14 Tage und wird vollständig von Cogniiq übernommen. Keine technischen Vorkenntnisse erforderlich – wir liefern alles schlüsselfertig.",
    },
    {
      question: "Kann die Website auch saisonale Menüs und touristische Informationen abbilden?",
      answer:
        "Ja. Wir bauen Ihre Website so, dass Sie Menüs, saisonale Angebote und Veranstaltungen selbst aktualisieren können – einfach und ohne Programmierkenntnisse.",
    },
    {
      question: "Wie werden Gästedaten aus Reservierungen verarbeitet?",
      answer:
        "Das hängt vom eingesetzten Reservierungstool ab. Wir binden es mit Auftragsverarbeitungsvertrag ein und dokumentieren, welche Daten wohin fließen. Den Verarbeitungsort nennt Ihnen der jeweilige Anbieter verbindlich — wir geben ihn nicht aus zweiter Hand weiter.",
    },
    {
      question: "Kann der KI-Assistent auch Gruppenreservierungen und Eventanfragen bearbeiten?",
      answer:
        "Für Standardreservierungen ja – automatisch nach Ihren Vorgaben. Größere Gruppen oder Events werden durch den KI-Assistenten qualifiziert erfasst und mit allen relevanten Angaben strukturiert an Ihr Team weitergeleitet.",
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
