import { NationalIndustryPage } from "@/components/NationalIndustryPage";
import type { NationalIndustryPageConfig } from "@/components/NationalIndustryPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const config: NationalIndustryPageConfig = {
  seo: {
    title: "KI Telefonassistent für Restaurants | Automatische Tischreservierung | Cogniiq",
    description: "KI Telefonassistent für Restaurants: Tischreservierungen automatisch entgegennehmen, bestätigen und erinnern. Kein verpasster Tisch mehr – auch abends, nachts und am Wochenende.",
    canonical: `${BUSINESS_INFO.website}/ki-telefonassistent-restaurant`,
    keywords: "KI Telefonassistent Restaurant, automatische Reservierung, KI Rezeptionistin Gastronomie, Telefonservice Restaurant",
  },
  h1: "KI Telefonassistent für Restaurants & Gastronomie",
  tagline: "Gastronomie · Tischreservierung · 24/7",
  intro: "Freitagabend, 19:30 Uhr: Die Küche läuft auf Hochtouren, jeder Tisch ist besetzt – und das Telefon klingelt. Niemand kann abnehmen. Der Anrufer will für Samstag reservieren. Er legt auf und ruft das Restaurant nebenan an. Mit dem KI Telefonassistenten hätte er in 90 Sekunden seinen Tisch gehabt, eine Bestätigung erhalten – und wäre am Samstagabend als Gast bei Ihnen.",
  serviceSlug: "ki-telefonassistent",
  serviceLabel: "KI Telefonassistent",
  costLink: "/kosten-ki-telefonassistent",
  costLinkLabel: "Kosten KI Telefonassistent",
  problems: [
    {
      title: "Reservierungsanrufe kommen genau dann, wenn Sie nicht abnehmen können",
      description: "Gäste reservieren zwischen 17 und 21 Uhr – also genau dann, wenn der Service läuft und niemand Zeit für Telefonate hat. Jede verpasste Reservierung ist ein Tisch, der am Abend leer bleibt.",
    },
    {
      title: "Ein Gast, der nicht durchkommt, reserviert anderswo",
      description: "Loyalität gegenüber einem Restaurant ist real – aber sie endet beim Besetztzeichen. Wer dreimal nicht durchkommt, googelt nach dem nächsten Restaurant mit einfacherer Buchung.",
    },
    {
      title: "No-Shows lassen sich nicht ohne Erinnerungssystem reduzieren",
      description: "Ein Gast, der abends um 20 Uhr reserviert und am nächsten Morgen vergessen hat, zu stornieren, erscheint nicht. Automatische Erinnerungen mit Bestätigungslink 24 Stunden vorher lösen dieses Problem strukturell.",
    },
    {
      title: "Standardfragen fressen Serviceminuten",
      description: "Ist die Terrasse verfügbar? Haben Sie vegane Optionen? Gibt es Parken in der Nähe? Diese Fragen nehmen je Anruf 3–4 Minuten in Anspruch – Minuten, die ein Servicemitarbeiter gerade am Tisch braucht.",
    },
    {
      title: "Stoßzeiten und Events übersteigen das manuelle Limit",
      description: "In der Festspielzeit, rund um Feiertage oder bei besonderen Events klingelt das Telefon in einer Frequenz, die kein Team manuell bewältigen kann. Der Assistent skaliert ohne Limit.",
    },
    {
      title: "Internationale Gäste werden abgewiesen, ohne es zu wissen",
      description: "Touristische Lagen bedeuten Gäste, die auf Englisch anrufen. Ohne mehrsprachige Unterstützung landen diese Reservierungen bei der Konkurrenz, die das Problem gelöst hat.",
    },
  ],
  solution: {
    headline: "Kein Tisch bleibt leer, weil niemand abgehoben hat.",
    text: "Der KI Telefonassistent nimmt Reservierungen in Echtzeit entgegen, prüft Verfügbarkeit und bestätigt sofort per SMS oder E-Mail. Automatische Erinnerungen reduzieren No-Shows nachweisbar. Ihr Serviceteam widmet sich vollständig den Gästen, die bereits am Tisch sitzen.",
  },
  benefits: [
    "Tischreservierungen automatisch entgegennehmen – auch während des Service",
    "Sofortige Bestätigung per SMS oder E-Mail an den Gast",
    "24/7 erreichbar – auch abends, nachts und am Wochenende",
    "Automatische Erinnerung 24h vorher reduziert No-Shows messbar",
    "Mehrsprachig konfigurierbar: Deutsch und Englisch",
    "Integration mit OpenTable, ResDiary und anderen Systemen",
    "Live in 7–14 Tagen – der Betrieb läuft weiter wie gewohnt",
  ],
  workflow: {
    title: "So läuft eine Reservierung ab",
    steps: [
      {
        step: "01",
        title: "Gast ruft an",
        description: "Der Assistent nimmt sofort ab – auf Deutsch oder Englisch, professionell und freundlich. Kein Besetztzeichen, keine Warteschleife, egal wie voll das Restaurant gerade ist.",
      },
      {
        step: "02",
        title: "Reservierung aufnehmen",
        description: "Datum, Uhrzeit, Personenzahl, Sonderwünsche und Allergien werden vollständig erfasst und direkt in das Reservierungssystem eingetragen.",
      },
      {
        step: "03",
        title: "Bestätigen und den Tisch sichern",
        description: "Der Gast erhält sofortige Buchungsbestätigung und einen Tag vorher eine Erinnerung mit Bestätigungslink. Nicht bestätigte Reservierungen werden nochmals erinnert – No-Shows sinken spürbar.",
      },
    ],
  },
  cityLinks: [
    { label: "KI Telefonassistent Bayreuth", href: "/bayreuth/ki-telefonassistent" },
    { label: "KI Telefonassistent München", href: "/muenchen/ki-telefonassistent" },
    { label: "KI Telefonassistent Regensburg", href: "/regensburg/ki-telefonassistent" },
    { label: "KI Telefonassistent Bayern", href: "/bayern/ki-telefonassistent" },
    { label: "KI Agentur Deutschland", href: "/ki-agentur-deutschland" },
  ],
  relatedLinks: [
    { label: "Webdesign Gastronomie", href: "/webdesign-gastronomie" },
    { label: "Automatisierung Restaurant", href: "/automatisierung-restaurant" },
    { label: "KI Telefonassistent Hotel", href: "/ki-telefonassistent-hotel" },
    { label: "Kosten KI Telefonassistent", href: "/kosten-ki-telefonassistent" },
    { label: "KI Telefonassistent Arzt", href: "/ki-telefonassistent-arzt" },
  ],
  faq: [
    {
      question: "Kann der Assistent in unser bestehendes Reservierungssystem integriert werden?",
      answer: "Ja. Wir integrieren den Assistenten in OpenTable, ResDiary, Resmio und andere gängige Reservierungssysteme. Reservierungen laufen direkt ins System – ohne manuelle Übertragung. Beim Erstgespräch klären wir konkret, was mit Ihrer Software möglich ist.",
    },
    {
      question: "Was passiert, wenn ein Wunschtisch oder eine Uhrzeit nicht verfügbar ist?",
      answer: "Der Assistent prüft Verfügbarkeit in Echtzeit und schlägt automatisch Alternativen vor – andere Uhrzeiten, andere Bereiche. So verwandeln sich 'leider ausgebucht'-Gespräche oft doch noch in Reservierungen.",
    },
    {
      question: "Kann der Assistent Sonderwünsche und Allergien aufnehmen?",
      answer: "Ja. Allergien, Hochstuhlbedarf, Fensterwunsch, Geburtstag – alles wird während des Gesprächs erfasst und im Reservierungssystem dokumentiert, sodass der Service optimal vorbereitet ist.",
    },
    {
      question: "Wie wirksam sind die automatischen Erinnerungen gegen No-Shows?",
      answer: "Automatische Erinnerungen per SMS oder E-Mail 24 Stunden vor dem Besuch reduzieren No-Shows bei Restaurants im Schnitt um 30–45 %. Der genaue Zeitpunkt und der Inhalt werden für Ihr Restaurant individuell konfiguriert.",
    },
    {
      question: "Lässt sich der Assistent auch auf Festspiel- und Eventzeiten vorbereiten?",
      answer: "Ja. Saisonale Verfügbarkeiten, Event-spezifische Regeln und erhöhte Kapazitäten lassen sich konfigurieren – sodass der Assistent auch in Stoßzeiten präzise und konsistent arbeitet.",
    },
  ],
};

export function KiTelefonassistentRestaurant() {
  return <NationalIndustryPage config={config} />;
}
