import { NationalIndustryPage } from "@/components/NationalIndustryPage";
import type { NationalIndustryPageConfig } from "@/components/NationalIndustryPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const config: NationalIndustryPageConfig = {
  seo: {
    title: "KI Telefonassistent für Restaurants | Automatische Reservierungen | Cogniiq",
    description: "KI Telefonassistent für Restaurants: Automatische Tischreservierungen, Bestätigungen und Standardanfragen. Keine verpassten Reservierungen mehr – 24/7 erreichbar.",
    canonical: `${BUSINESS_INFO.website}/ki-telefonassistent-restaurant`,
    keywords: "KI Telefonassistent Restaurant, automatische Reservierung, KI Rezeptionistin Gastronomie, Telefonservice Restaurant",
  },
  h1: "KI Telefonassistent für Restaurants & Gastronomie",
  tagline: "Gastronomie · Tischreservierung · 24/7",
  intro: "Gäste rufen abends an – genau dann, wenn die Küche läuft und kein Mitarbeiter ans Telefon gehen kann. Der KI Telefonassistent nimmt Reservierungen automatisch entgegen, bestätigt sofort und sendet Erinnerungen vor dem Besuch. Kein verpasster Tisch mehr, kein verlorener Umsatz.",
  serviceSlug: "ki-telefonassistent",
  serviceLabel: "KI Telefonassistent",
  costLink: "/kosten-ki-telefonassistent",
  costLinkLabel: "Kosten KI Telefonassistent",
  problems: [
    {
      title: "Abends und am Wochenende nicht erreichbar",
      description: "Gäste reservieren häufig zwischen 17 und 21 Uhr. Genau dann ist das Restaurant voll im Betrieb und niemand kann ans Telefon gehen – jede verpasste Reservierung ist direkter Umsatzverlust.",
    },
    {
      title: "Service-Team kann kein Telefon nebenher betreiben",
      description: "Wenn alle Mitarbeiter im Service beschäftigt sind, klingelt das Telefon ins Leere. Gäste, die niemanden erreichen, reservieren schlicht woanders.",
    },
    {
      title: "No-Shows durch fehlende Erinnerungen",
      description: "Ohne automatische Erinnerungs-SMS oder -E-Mail vor dem Besuch steigt die No-Show-Rate messbar. Jede unbesetzte Reservierung ist verschenkter Umsatz.",
    },
    {
      title: "Standardfragen binden Servicepersonal",
      description: "Öffnungszeiten, Parken, Speisekarte, vegetarische Optionen – diese Fragen können vollautomatisch beantwortet werden, anstatt das Team zu unterbrechen.",
    },
    {
      title: "Anrufspitzen bei Events und Saison nicht bewältigbar",
      description: "Weihnachtsmarkt, Festspielzeit, Feiertage: In Stoßzeiten klingelt das Telefon ununterbrochen. Manuell ist das nicht skalierbar.",
    },
    {
      title: "Internationale Gäste werden nicht bedient",
      description: "In touristisch geprägten Lagen rufen viele Gäste auf Englisch an. Ohne mehrsprachige Unterstützung gehen diese Buchungen verloren.",
    },
  ],
  solution: {
    headline: "Jede Reservierung angenommen – auch wenn der Service läuft.",
    text: "Der KI Telefonassistent nimmt Tischreservierungen entgegen, prüft Verfügbarkeit in Echtzeit und bestätigt sofort per SMS oder E-Mail. Automatische Erinnerungen reduzieren No-Shows spürbar. Das Team kann sich vollständig auf den Gast konzentrieren.",
  },
  benefits: [
    "Tischreservierungen automatisch entgegennehmen und bestätigen",
    "Erinnerungs-SMS oder -E-Mail vor dem Besuch",
    "24/7 erreichbar – auch abends, nachts und am Wochenende",
    "Mehrsprachig konfigurierbar (Deutsch, Englisch)",
    "Integration mit bestehenden Reservierungssystemen",
    "Standardfragen vollautomatisch beantwortet",
    "Eingerichtet in 7–14 Tagen, kein IT-Aufwand nötig",
  ],
  workflow: {
    title: "So läuft eine Reservierung ab",
    steps: [
      {
        step: "01",
        title: "Gast ruft an",
        description: "Der Assistent nimmt sofort ab – professionell und freundlich, auf Deutsch oder Englisch. Keine Warteschleife, kein Besetztzeichen.",
      },
      {
        step: "02",
        title: "Reservierung aufnehmen",
        description: "Datum, Uhrzeit, Personenzahl und Sonderwünsche werden vollständig erfasst und direkt in das Reservierungssystem eingetragen.",
      },
      {
        step: "03",
        title: "Bestätigen und erinnern",
        description: "Der Gast erhält sofortige Buchungsbestätigung und eine Erinnerung vor dem Besuch. No-Shows werden deutlich reduziert.",
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
      answer: "Ja. Wir integrieren den Assistenten in gängige Reservierungssysteme wie OpenTable, ResDiary oder individuelle Systeme. Reservierungen laufen dann vollständig automatisch ohne manuelle Nacharbeit.",
    },
    {
      question: "Was passiert, wenn ein Tisch nicht verfügbar ist?",
      answer: "Der Assistent prüft die Verfügbarkeit in Echtzeit und schlägt automatisch alternative Zeiten vor. So werden auch bei vollen Abenden alternative Lösungen angeboten.",
    },
    {
      question: "Kann der Assistent mehrsprachig konfiguriert werden?",
      answer: "Ja. Restaurants in touristisch geprägten Regionen oder mit internationalem Publikum können den Assistenten für Deutsch und Englisch (oder weitere Sprachen) konfigurieren lassen.",
    },
    {
      question: "Wie werden No-Shows reduziert?",
      answer: "Automatische Erinnerungen per SMS oder E-Mail 24 Stunden vor dem Besuch reduzieren No-Shows messbar. Die genaue Zeitsteuerung wird individuell für Ihr Restaurant konfiguriert.",
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
