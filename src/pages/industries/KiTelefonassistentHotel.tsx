import { NationalIndustryPage } from "@/components/NationalIndustryPage";
import type { NationalIndustryPageConfig } from "@/components/NationalIndustryPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const config: NationalIndustryPageConfig = {
  seo: {
    title: "KI Telefonassistent für Hotels & Pensionen | 24/7 Rezeption | Cogniiq",
    description: "KI Telefonassistent für Hotels: 24/7 Rezeptionsdienst, automatische Zimmerbuchungen und Gästeanfragen. Keine verpassten Direktbuchungen mehr – auch außerhalb der Rezeptionszeiten.",
    canonical: `${BUSINESS_INFO.website}/ki-telefonassistent-hotel`,
    keywords: "KI Telefonassistent Hotel, 24/7 Rezeption, automatische Zimmerbuchung, KI Rezeptionistin Hotel, Telefonservice Hotellerie",
  },
  h1: "KI Telefonassistent für Hotels & Pensionen",
  tagline: "Hotellerie · 24/7 Rezeption · Direktbuchungen stärken",
  intro: "Reisende buchen spät abends – um 22 Uhr, nach dem Feierabend, wenn die Rezeption längst geschlossen ist. Wer in diesem Moment nicht erreichbar ist, verliert die Buchung an Booking.com – inklusive 18 % Provision. Der KI Telefonassistent ist 24 Stunden besetzt, nimmt Buchungsanfragen in natürlicher Sprache entgegen und bucht den Gast direkt ins PMS.",
  serviceSlug: "ki-telefonassistent",
  serviceLabel: "KI Telefonassistent",
  costLink: "/kosten-ki-telefonassistent",
  costLinkLabel: "Kosten KI Telefonassistent",
  problems: [
    {
      title: "Buchungsanfragen nachts und am Wochenende gehen verloren",
      description: "Die Buchungsentscheidung fällt selten zwischen 9 und 17 Uhr. Reisende entscheiden sich abends, nach dem Urlaubs-Browsing. Wer da nicht telefonisch erreichbar ist, verliert die Direktbuchung an ein OTA.",
    },
    {
      title: "Jede OTA-Buchung kostet 15–25 % Provision",
      description: "Booking.com, Expedia und HRS nehmen einen erheblichen Anteil vom Zimmerpreis. Eine direkt gebuchte Nacht, die über den Assistenten reinkäme, läge bei 100 % Marge. Der Unterschied summiert sich auf Jahressicht schnell in fünfstellige Beträge.",
    },
    {
      title: "Rezeptionsteam kann Telefon und Check-in nicht gleichzeitig managen",
      description: "Stoßzeiten beim Check-in oder Check-out sind für kleine Teams kaum parallel beherrschbar. Gäste warten am Tresen, während das Telefon klingelt. Beides leidet.",
    },
    {
      title: "Immer dieselben Fragen – immer dieselbe Zeit",
      description: "Frühstückszeiten, Parkplatz, Late Check-out, Haustierregeln – diese Informationen fragen Gäste täglich an. Der Assistent beantwortet sie konsistent, ohne das Rezeptionsteam zu unterbrechen.",
    },
    {
      title: "Gruppenanfragen und Events werden unstrukturiert bearbeitet",
      description: "Hochzeitsgruppen, Tagungsanfragen oder Schulklassen – solche Anfragen erfordern Koordination. Ohne strukturierten Eingang gehen Details verloren oder landen im falschen Postfach.",
    },
    {
      title: "Internationale Gäste scheitern am Sprachproblem",
      description: "Nicht jeder Rezeptionist spricht flüssig Englisch unter Druck. Reisende, die Unsicherheit am Telefon spüren, buchen lieber ein Hotel, das klarer kommuniziert.",
    },
  ],
  solution: {
    headline: "Eine Rezeption, die nie schließt – und jede Direktbuchung hält.",
    text: "Der KI Telefonassistent übernimmt telefonische Buchungsanfragen, Zimmerverfügbarkeiten und Gästeanfragen rund um die Uhr. Direktbuchungen werden nicht mehr an OTAs verloren. Das Rezeptionsteam kann sich auf persönlichen Service konzentrieren – beim Check-in und im Gespräch vor Ort.",
  },
  benefits: [
    "24/7 erreichbar – Buchungsanfragen auch nachts und am Wochenende",
    "Direktbuchung statt OTA-Provision – jede Nacht mehr Marge",
    "Automatische Bestätigung und Buchungsdokumentation im PMS",
    "Mehrsprachig: Deutsch und Englisch standard, weitere auf Anfrage",
    "Sonderwünsche und Gruppenanfragen vollständig erfasst",
    "Integration mit gängigen PMS-Systemen und Channel-Managern",
    "Eingerichtet in 7–14 Tagen – der Hotelbetrieb läuft weiter",
  ],
  workflow: {
    title: "So läuft eine Buchungsanfrage ab",
    steps: [
      {
        step: "01",
        title: "Gast ruft an",
        description: "Ob um 10 Uhr morgens oder 23 Uhr abends – der Assistent ist sofort erreichbar, auf Deutsch oder Englisch, ohne Besetztzeichen und ohne Warteschleife.",
      },
      {
        step: "02",
        title: "Verfügbarkeit prüfen, Zimmer empfehlen",
        description: "Zimmerverfügbarkeit prüfen, Zimmertypen erklären, Preise kommunizieren, Sonderwünsche aufnehmen – vollautomatisch, korrekt und in der Sprache des Gastes.",
      },
      {
        step: "03",
        title: "Buchung direkt ins System, Gast bestätigt",
        description: "Die Buchung wird ins PMS eingetragen, der Gast erhält sofortige schriftliche Bestätigung. Kein manueller Eingriff, kein Informationsverlust.",
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
    { label: "Webdesign Hotel", href: "/webdesign-hotel" },
    { label: "KI Telefonassistent Restaurant", href: "/ki-telefonassistent-restaurant" },
    { label: "Kosten KI Telefonassistent", href: "/kosten-ki-telefonassistent" },
    { label: "KI Telefonassistent Arzt", href: "/ki-telefonassistent-arzt" },
    { label: "KI Agentur Deutschland", href: "/ki-agentur-deutschland" },
  ],
  faq: [
    {
      question: "Kann der Assistent in unser Hotelverwaltungssystem integriert werden?",
      answer: "Ja. Wir integrieren in gängige PMS-Systeme und Channel-Manager – darunter protel, Apaleo, Lodgit und andere. Buchungen fließen direkt ins System, ohne manuelle Nacherfassung. Die genaue Kompatibilität klären wir im Erstgespräch.",
    },
    {
      question: "Wie hilft der Assistent konkret dabei, OTA-Provision einzusparen?",
      answer: "Jede Buchung, die ein Gast nachts telefonisch direkt beim Hotel platziert, statt zu Booking.com zu wechseln, spart die komplette Provision. Bei einem Haus mit 30 Zimmern und 10 % mehr Direktquote kann das jährlich fünfstellige Einsparungen bedeuten.",
    },
    {
      question: "Was passiert bei komplexen Gruppenanfragen?",
      answer: "Gruppenanfragen werden vollständig aufgenommen – Zimmerzahl, An- und Abreise, Sonderwünsche, Veranstaltungsräume – und mit Gesprächsprotokoll an den zuständigen Mitarbeiter weitergeleitet. Kein Informationsverlust, kein Folgeanruf nötig.",
    },
    {
      question: "Kann der Assistent Late Check-out, Frühstück und weitere Extras verkaufen?",
      answer: "Ja. Der Assistent kann konfiguriert werden, um Zusatzleistungen aktiv anzubieten – Late Check-out, Frühstück, Parkplatz, Spa-Buchungen. Diese Upsell-Logik wird individuell für Ihr Haus eingestellt.",
    },
    {
      question: "Wie lange dauert die Einrichtung?",
      answer: "Typischerweise 7–14 Tage für einfache Setups. Komplexe PMS-Integrationen oder mehrsprachige Konfigurationen dauern etwas länger. Der Hotelbetrieb wird dabei nicht unterbrochen.",
    },
  ],
};

export function KiTelefonassistentHotel() {
  return <NationalIndustryPage config={config} />;
}
