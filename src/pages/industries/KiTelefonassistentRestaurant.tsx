import { NationalIndustryPage } from "@/components/NationalIndustryPage";
import type { NationalIndustryPageConfig } from "@/components/NationalIndustryPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const config: NationalIndustryPageConfig = {
  seo: {
    title: "KI Telefonassistent für Restaurants | Automatische Reservierungen | Cogniiq",
    description: "KI Telefonassistent für Restaurants: Automatische Tischreservierungen, Bestellannahme und Standardanfragen. Nie wieder verpasste Reservierungen – 24/7 erreichbar.",
    canonical: `${BUSINESS_INFO.website}/ki-telefonassistent-restaurant`,
    keywords: "KI Telefonassistent Restaurant, automatische Reservierung, KI Rezeptionistin Gastronomie, Telefonservice Restaurant",
  },
  h1: "KI Telefonassistent für Restaurants & Gastronomie",
  tagline: "Gastronomie · Tischreservierung · 24/7",
  intro: "Restaurants verlieren täglich Reservierungen, weil das Telefon besetzt ist oder abends niemand mehr abnimmt. Der KI Telefonassistent übernimmt Reservierungsannahme, Bestätigungen und Standardanfragen automatisch – rund um die Uhr.",
  serviceSlug: "ki-telefonassistent",
  serviceLabel: "KI Telefonassistent",
  costLink: "/kosten-ki-telefonassistent",
  costLinkLabel: "Kosten KI Telefonassistent",
  problems: [
    {
      title: "Abends und am Wochenende nicht erreichbar",
      description: "Gäste rufen häufig abends oder am Wochenende an, wenn die Küche läuft und niemand ans Telefon gehen kann. Jede verpasste Reservierung ist verlorener Umsatz.",
    },
    {
      title: "Telefonleitung blockiert in Stoßzeiten",
      description: "Wenn alle Mitarbeiter im Service sind, klingelt das Telefon ins Leere. Gäste, die keinen Platz buchen können, reservieren woanders.",
    },
    {
      title: "Keine Bestätigungs- und Erinnerungs-Kommunikation",
      description: "Ohne automatische Bestätigungen und Erinnerungen steigen No-Shows, die ohne Entschädigung bleiben und Verlust bedeuten.",
    },
    {
      title: "Standardfragen kosten zu viel Personalzeit",
      description: "Öffnungszeiten, Parkplatzsituation, vegetarische Optionen – diese Fragen können automatisch beantwortet werden, anstatt wertvolle Personalzeit zu binden.",
    },
    {
      title: "Saisonspitzen und Events nicht skalierbar",
      description: "Festspiele, Weihnachtsmarkt und Feiertage bringen Anrufspitzen, die manuell nicht bewältigt werden können.",
    },
    {
      title: "Keine Reservierungen aus dem Ausland",
      description: "Internationale Gäste rufen oft auf Englisch an. Ohne mehrsprachige Unterstützung gehen diese Reservierungen verloren.",
    },
  ],
  solution: {
    headline: "Jede Reservierung automatisch – auch abends und am Wochenende.",
    text: "Der KI Telefonassistent nimmt Tischreservierungen entgegen, bestätigt sofort per SMS oder E-Mail und sendet automatische Erinnerungen. Das Restaurant-Team konzentriert sich auf den Gast.",
  },
  benefits: [
    "Tischreservierungen automatisch entgegennehmen",
    "Sofortige Bestätigung per SMS oder E-Mail",
    "Automatische Erinnerungen gegen No-Shows",
    "24/7 erreichbar – auch nachts und am Wochenende",
    "Mehrsprachig auf Anfrage (Deutsch, Englisch)",
    "Integration mit Reservierungssystemen",
    "Standardfragen automatisch beantwortet",
  ],
  workflow: {
    title: "So funktioniert der Reservierungs-Assistent",
    steps: [
      {
        step: "Schritt 1",
        title: "Gast ruft an",
        description: "Der Assistent nimmt den Anruf sofort entgegen – professionell, freundlich, in Deutsch oder Englisch.",
      },
      {
        step: "Schritt 2",
        title: "Reservierung aufnehmen",
        description: "Datum, Uhrzeit, Personenzahl und Sonderwünsche werden vollständig erfasst und in das Reservierungssystem eingetragen.",
      },
      {
        step: "Schritt 3",
        title: "Bestätigen & erinnern",
        description: "Der Gast erhält sofortige Buchungsbestätigung und eine Erinnerung vor dem Besuch – No-Shows werden deutlich reduziert.",
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
      question: "Kann der KI Assistent in ein bestehendes Reservierungssystem integriert werden?",
      answer: "Ja. Wir integrieren den Assistenten in gängige Reservierungssysteme wie OpenTable, ResDiary oder individuelle Systeme. Reservierungen laufen dann vollständig automatisch.",
    },
    {
      question: "Was passiert, wenn ein Tisch nicht mehr verfügbar ist?",
      answer: "Der Assistent prüft die Verfügbarkeit in Echtzeit und schlägt alternativ andere Zeiten vor. So werden auch bei vollen Zeiten alternative Lösungen angeboten.",
    },
    {
      question: "Kann der Assistent auf Mehrsprachigkeit konfiguriert werden?",
      answer: "Ja. Restaurants in touristisch geprägten Regionen oder mit internationalem Publikum können den Assistenten für Deutsch und Englisch (oder weitere Sprachen) konfigurieren lassen.",
    },
    {
      question: "Wie werden No-Shows reduziert?",
      answer: "Automatische Erinnerungen per SMS oder E-Mail 24 Stunden vor dem Besuch reduzieren No-Shows in der Gastronomie typischerweise um 30–50 %.",
    },
    {
      question: "Wie schnell ist der Assistent einsatzbereit?",
      answer: "In den meisten Fällen ist der Assistent innerhalb von 7–14 Tagen konfiguriert und live – ohne technischen Aufwand für das Restaurant-Team.",
    },
  ],
};

export function KiTelefonassistentRestaurant() {
  return <NationalIndustryPage config={config} />;
}
