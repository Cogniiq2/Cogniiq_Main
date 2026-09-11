import { NationalIndustryPage } from "@/components/NationalIndustryPage";
import type { NationalIndustryPageConfig } from "@/components/NationalIndustryPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const config: NationalIndustryPageConfig = {
  seo: {
    title: "KI Telefonassistent für Restaurants | Automatische Tischreservierung | Cogniiq",
    description: "KI Telefonassistent für Restaurants: Reservierungen im Gespräch abschließen statt nur aufnehmen – auch während des Service und am Wochenende. Anbindung an Ihr Reservierungssystem wird vorab geprüft.",
    canonical: `${BUSINESS_INFO.website}/ki-telefonassistent-restaurant`,
    keywords: "KI Telefonassistent Restaurant, automatische Reservierung, KI Rezeptionistin Gastronomie, Telefonservice Restaurant",
  },
  h1: "KI Telefonassistent für Restaurants & Gastronomie",
  tagline: "Gastronomie · Tischreservierung · auch außerhalb der Öffnungszeiten",
  intro: "Freitagabend, 19:30 Uhr: Die Küche läuft auf Hochtouren, jeder Tisch ist besetzt – und das Telefon klingelt. Niemand kann abnehmen. Der Anrufer will für Samstag reservieren. Er legt auf und ruft das Restaurant nebenan an. Mit dem KI Telefonassistenten wäre das Gespräch geführt und die Reservierung erledigt gewesen – Datum, Personenzahl, Sonderwünsche, fertig, ohne dass jemand im Service sie danach noch eintragen muss. In Ihr Reservierungssystem eingetragen wird sie, sobald dessen Schnittstelle eingerichtet und verifiziert ist; ohne tragfähige Schnittstelle greift der Weg, den Sie vorher festlegen.",
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
    headline: "Reservieren, während der Service läuft — und zwar zu Ende",
    text: "Der KI Telefonassistent führt das Reservierungsgespräch und schließt es ab: Datum, Uhrzeit, Personenzahl, Sonderwünsche und Allergien klärt er im Gespräch und trägt die Reservierung in Ihr System ein, sobald dessen Schnittstelle eingerichtet und verifiziert ist. Aus einem Anruf wird dann keine Notiz für später, sondern ein gebuchter Tisch. Trägt Ihr System den Eintrag nicht, steht die vollständige Reservierung für den Service bereit — das ist der vereinbarte Rückfallweg, nicht der Normalfall. Mehrere Anrufe zur selben Zeit; Ihr Serviceteam bleibt bei den Gästen, die schon am Tisch sitzen.",
  },
  benefits: [
    "Tischreservierungen im Gespräch abschließen – auch während des Service",
    "Eintrag in Ihr Reservierungssystem, wo dessen geprüfte Schnittstelle das trägt",
    "Ohne tragfähige Schnittstelle: vollständige Reservierung für den Service, als vereinbarter Rückfallweg",
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
        description: "Der Assistent nimmt an – auf Deutsch oder Englisch, professionell und freundlich. Auch mehrere Anrufe zur selben Zeit, unabhängig davon, wie voll das Restaurant gerade ist. Die Kapazität wird auf Ihr Aufkommen ausgelegt und im Angebot ausgewiesen.",
      },
      {
        step: "02",
        title: "Reservierung abschließen",
        description: "Datum, Uhrzeit, Personenzahl, Sonderwünsche und Allergien klärt der Assistent im Gespräch und schließt die Reservierung ab. In Ihr Reservierungssystem eingetragen wird sie, sobald wir dessen Schnittstelle eingerichtet und verifiziert haben — was dafür geht, prüfen wir vor dem Angebot. Ohne tragfähige Schnittstelle steht die fertige Reservierung für den Service bereit.",
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
      answer: "Ja. Allergien, Hochstuhlbedarf, Fensterwunsch, Geburtstag – der Assistent fragt nach, klärt sie im Gespräch und hängt sie an die Reservierung. Im Reservierungssystem stehen sie, sobald dessen geprüfte Schnittstelle den Eintrag trägt; sonst stehen sie vollständig beim Vorgang für den Service. So oder so ist der Service vorbereitet.",
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
