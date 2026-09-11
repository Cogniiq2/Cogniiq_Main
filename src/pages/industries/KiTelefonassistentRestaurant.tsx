import { NationalIndustryPage } from "@/components/NationalIndustryPage";
import type { NationalIndustryPageConfig } from "@/components/NationalIndustryPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const config: NationalIndustryPageConfig = {
  seo: {
    title: "KI Telefonassistent für Restaurants | Automatische Tischreservierung | Cogniiq",
    description: "KI Telefonassistent für Restaurants: Tischreservierungen entgegennehmen und strukturiert an Ihr Team übergeben – auch während des Service und am Wochenende.",
    canonical: `${BUSINESS_INFO.website}/ki-telefonassistent-restaurant`,
    keywords: "KI Telefonassistent Restaurant, automatische Reservierung, KI Rezeptionistin Gastronomie, Telefonservice Restaurant",
  },
  h1: "KI Telefonassistent für Restaurants & Gastronomie",
  tagline: "Gastronomie · Tischreservierung · auch außerhalb der Öffnungszeiten",
  intro: "Freitagabend, 19:30 Uhr: Die Küche läuft auf Hochtouren, jeder Tisch ist besetzt – und das Telefon klingelt. Niemand kann abnehmen. Der Anrufer will für Samstag reservieren. Er legt auf und ruft das Restaurant nebenan an. Mit dem KI Telefonassistenten wäre sein Anruf angenommen worden: Reservierungswunsch aufgenommen, an Ihr Team übergeben – und am Samstagabend säße er als Gast bei Ihnen.",
  serviceSlug: "ki-telefonassistent",
  serviceLabel: "KI Telefonassistent",
  costLink: "/kosten-ki-telefonassistent",
  costLinkLabel: "Kosten KI Telefonassistent",
  problems: [
    {
      title: "Reservierungsanrufe kommen genau dann, wenn Sie nicht abnehmen können",
      description: "Gäste reservieren zwischen 17 und 21 Uhr – also genau dann, wenn der Service läuft und niemand Zeit für Telefonate hat. Jede verpasste Reservierung ist ein Tisch, der am Abend leer bleibt.",
    },
    {
      title: "Ein Gast, der nicht durchkommt, reserviert anderswo",
      description: "Loyalität gegenüber einem Restaurant ist real – aber sie endet beim Besetztzeichen. Wer dreimal nicht durchkommt, googelt nach dem nächsten Restaurant mit einfacherer Buchung.",
    },
    {
      title: "No-Shows lassen sich nicht ohne Erinnerungssystem reduzieren",
      description: "Ein Gast, der abends um 20 Uhr reserviert und die Stornierung vergisst, erscheint nicht. Automatische Erinnerungen mit Bestätigungslink am Vortag wirken dem strukturell entgegen.",
    },
    {
      title: "Standardfragen fressen Serviceminuten",
      description: "Ist die Terrasse verfügbar? Haben Sie vegane Optionen? Gibt es Parken in der Nähe? Jede dieser Fragen kostet Serviceminuten – Minuten, die ein Servicemitarbeiter gerade am Tisch braucht.",
    },
    {
      title: "Stoßzeiten und Events übersteigen das manuelle Limit",
      description: "In der Festspielzeit, rund um Feiertage oder bei besonderen Events klingelt das Telefon in einer Frequenz, die kein Team manuell bewältigen kann. Der Assistent nimmt auch mehrere Anrufe gleichzeitig an.",
    },
    {
      title: "Internationale Gäste werden abgewiesen, ohne es zu wissen",
      description: "Touristische Lagen bedeuten Gäste, die auf Englisch anrufen. Ohne mehrsprachige Unterstützung landen diese Reservierungen bei der Konkurrenz, die das Problem gelöst hat.",
    },
  ],
  solution: {
    headline: "Reservierungen annehmen, während der Service läuft",
    text: "Der KI Telefonassistent nimmt Reservierungswünsche entgegen, erfasst Personenzahl, Zeitwunsch und Rückrufnummer und übergibt sie strukturiert an den Service. Mehrere Anrufe zur selben Zeit, ohne Warteschleife. Ihr Serviceteam bleibt bei den Gästen, die bereits am Tisch sitzen.",
  },
  benefits: [
    "Tischreservierungen entgegennehmen – auch während des Service",
    "Jeder Reservierungswunsch strukturiert dokumentiert",
    "Erreichbar auch abends, nachts und am Wochenende",
    "Erinnerung am Vortag wirkt No-Shows entgegen, wo wir den Versandweg für Sie einrichten",
    // [[CLAIM: verify — Sprachumfang bestätigen]]
    "Mehrsprachig konfigurierbar: üblicherweise Deutsch und Englisch",
    "Anbindung an gängige Reservierungssysteme wird vor dem Angebot geprüft",
    // [[CLAIM: verify — Einrichtungsdauer bestätigen]]
    "Live ohne Unterbrechung — der Betrieb läuft weiter wie gewohnt",
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
        title: "Den Tisch planbar halten",
        description: "Bestätigung und Erinnerung mit Bestätigungslink gehören nicht zum Standardumfang; wir richten sie als Teil Ihres Ablaufs ein. Ist der Versandweg eingerichtet, erinnern wir erneut an nicht bestätigte Reservierungen, damit der Tisch planbar bleibt.",
      },
    ],
  },
  rechner: {
    ankertext: "Was kostet das bei Ihrer Reservierungsmenge?",
    kontext: "Restaurant",
    einleitung:
      "Der Preis richtet sich nach Ihren Gesprächsminuten, nicht nach der Zahl der Plätze. Rechnen Sie ihn mit Ihrem eigenen Aufkommen aus — sofort und ohne Anfrage.",
  },
  cityLinks: [
    { label: "KI Telefonassistent Bayreuth", href: "/bayreuth/ki-telefonassistent" },
    { label: "KI Telefonassistent München", href: "/muenchen/ki-telefonassistent" },
    { label: "KI Telefonassistent Regensburg", href: "/regensburg/ki-telefonassistent" },
    { label: "KI Telefonassistent Bayern", href: "/bayern/ki-telefonassistent" },
    { label: "KI Agentur Deutschland", href: "/ki-agentur-deutschland" },
  ],
  // Option B (Positionierung): keine Cross-Vertical-Links in eine fremde
  // Journey — der Arzt-Link wurde entfernt, Gastronomie/Hotellerie bleiben.
  relatedLinks: [
    { label: "Webdesign Gastronomie", href: "/webdesign-gastronomie" },
    { label: "Automatisierung Restaurant", href: "/automatisierung-restaurant" },
    { label: "KI Telefonassistent Hotel", href: "/ki-telefonassistent-hotel" },
    { label: "Kosten KI Telefonassistent", href: "/kosten-ki-telefonassistent" },
    { label: "KI Agentur Deutschland", href: "/ki-agentur-deutschland" },
  ],
  faq: [
    {
      question: "Kann der Assistent in unser bestehendes Reservierungssystem integriert werden?",
      answer: "Welche Schnittstelle Ihr Reservierungssystem bietet, prüfen wir vor dem Angebot; das Ergebnis steht darin, auch wenn es negativ ausfällt. Eine Liste unterstützter Systeme führen wir nicht — sie wäre heute entweder leer oder unehrlich. Ein Wechsel Ihres Systems ist keine Voraussetzung.",
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
      question: "Verschickt der Assistent Erinnerungen an Gäste?",
      answer: "Das sagen wir nicht pauschal zu. Eine Erinnerung vor dem Besuch lässt sich als Ablauf einrichten; auf welchem Weg sie den Gast erreicht, hängt an den Systemen, die Sie einsetzen. Wir sehen uns das vor dem Angebot an und schreiben das Ergebnis hinein.",
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
