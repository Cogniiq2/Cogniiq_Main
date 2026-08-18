import { NationalIndustryPage } from "@/components/NationalIndustryPage";
import type { NationalIndustryPageConfig } from "@/components/NationalIndustryPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const config: NationalIndustryPageConfig = {
  seo: {
    title: "KI Telefonassistent für Hotels & Pensionen | Rezeption auch nachts | Cogniiq",
    description: "KI Telefonassistent für Hotels: erreichbar auch außerhalb der Rezeptionszeiten, Buchungsanfragen und Gästefragen strukturiert aufgenommen. Direktbuchungen stärken.",
    canonical: `${BUSINESS_INFO.website}/ki-telefonassistent-hotel`,
    keywords: "KI Telefonassistent Hotel, Rezeption außerhalb der Öffnungszeiten, automatische Zimmerbuchung, KI Rezeptionistin Hotel, Telefonservice Hotellerie",
  },
  h1: "KI Telefonassistent für Hotels & Pensionen",
  tagline: "Hotellerie · Rezeption auch nachts · Direktbuchungen stärken",
  intro: "Reisende buchen spät abends – um 22 Uhr, nach dem Feierabend, wenn die Rezeption längst geschlossen ist. Wer in diesem Moment nicht erreichbar ist, verliert die Direktbuchung häufig an ein Buchungsportal – inklusive der fälligen Provision. Der KI Telefonassistent nimmt Buchungsanfragen auch außerhalb der Rezeptionszeiten entgegen und trägt sie nach Ihren Vorgaben in Ihr System ein.",
  serviceSlug: "ki-telefonassistent",
  serviceLabel: "KI Telefonassistent",
  costLink: "/kosten-ki-telefonassistent",
  costLinkLabel: "Kosten KI Telefonassistent",
  problems: [
    {
      title: "Buchungsanfragen nachts und am Wochenende gehen verloren",
      description: "Die Buchungsentscheidung fällt selten zwischen 9 und 17 Uhr. Reisende entscheiden sich abends, nach dem Urlaubs-Browsing. Wer da nicht telefonisch erreichbar ist, verliert die Direktbuchung an ein OTA.",
    },
    {
      title: "Jede Portalbuchung kostet Provision",
      description: "Buchungsportale nehmen einen spürbaren Anteil vom Zimmerpreis. Eine direkt beim Haus gebuchte Nacht behält diese Provision im Haus – über ein Jahr summiert sich der Unterschied deutlich.",
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
    headline: "Erreichbar bleiben, wenn die Rezeption geschlossen oder gebunden ist",
    text: "Der KI Telefonassistent übernimmt telefonische Buchungsanfragen, Verfügbarkeitsfragen und Gästeanfragen auch außerhalb der Rezeptionszeiten. Direktbuchungen, die sonst am geschlossenen Telefon scheitern, kommen an. Das Rezeptionsteam konzentriert sich auf den persönlichen Service – beim Check-in und im Gespräch vor Ort.",
  },
  benefits: [
    "Erreichbar auch nachts und am Wochenende – Buchungsanfragen werden angenommen statt verpasst",
    "Direktbuchung statt Portalprovision – der Unterschied bleibt im Haus",
    "Bestätigung und Buchungsdokumentation in Ihrem System",
    // [[CLAIM: verify — Sprachumfang (Deutsch/Englisch, weitere) bestätigen]]
    "Mehrsprachig möglich: üblicherweise Deutsch und Englisch, weitere Sprachen auf Anfrage",
    "Sonderwünsche und Gruppenanfragen strukturiert erfasst",
    // [[CLAIM: verify — PMS-/Channel-Manager-Anbindungen konkret bestätigen]]
    "Anbindung an gängige PMS-Systeme und Channel-Manager wird vor dem Angebot geprüft",
    // [[CLAIM: verify — Einrichtungsdauer 7–14 Tage]]
    "Eingerichtet ohne Unterbrechung — der Hotelbetrieb läuft weiter",
  ],
  workflow: {
    title: "So läuft eine Buchungsanfrage ab",
    steps: [
      {
        step: "01",
        title: "Gast ruft an",
        description: "Ob um 10 Uhr morgens oder 23 Uhr abends – der Assistent ist sofort erreichbar, auf Deutsch oder Englisch, ohne Besetztzeichen und ohne Warteschleife.",
      },
      {
        step: "02",
        title: "Verfügbarkeit prüfen, Zimmer empfehlen",
        description: "Zimmerverfügbarkeit prüfen, Zimmertypen erklären, Preise kommunizieren, Sonderwünsche aufnehmen – nach Ihren Vorgaben und in der Sprache des Gastes.",
      },
      {
        step: "03",
        title: "Buchung direkt ins System, Gast bestätigt",
        description: "Die Buchung wird in Ihr System eingetragen, der Gast erhält eine schriftliche Bestätigung. Was automatisch läuft und was das Team noch prüft, legen Sie fest.",
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
  // Option B (Positionierung): keine Cross-Vertical-Links in eine fremde
  // Journey — der Arzt-Link wurde entfernt, Hotellerie/Gastronomie bleiben.
  relatedLinks: [
    { label: "Webdesign Hotel", href: "/webdesign-hotel" },
    { label: "KI Telefonassistent Restaurant", href: "/ki-telefonassistent-restaurant" },
    { label: "Kosten KI Telefonassistent", href: "/kosten-ki-telefonassistent" },
    { label: "KI Agentur Deutschland", href: "/ki-agentur-deutschland" },
  ],
  faq: [
    {
      question: "Kann der Assistent in unser Hotelverwaltungssystem integriert werden?",
      answer: "Welche Schnittstelle Ihr PMS oder Channel-Manager bietet, prüfen wir vor dem Angebot; das Ergebnis steht darin, auch wenn es negativ ausfällt. Eine Liste unterstützter Systeme führen wir nicht — sie wäre heute entweder leer oder unehrlich. Ein Wechsel Ihres Systems ist keine Voraussetzung.",
    },
    {
      question: "Wie hilft der Assistent dabei, Portalprovision einzusparen?",
      answer: "Eine Buchung, die ein Gast abends telefonisch direkt beim Hotel platziert statt über ein Portal, spart die Provision dieser Buchung. Wie stark sich das summiert, hängt von Ihrer Direktquote ab – wir rechnen im Erstgespräch mit Ihren eigenen Zahlen, nicht mit Musterwerten.",
    },
    {
      question: "Was passiert bei komplexen Gruppenanfragen?",
      answer: "Gruppenanfragen werden strukturiert aufgenommen – Zimmerzahl, An- und Abreise, Sonderwünsche, Veranstaltungsräume – und mit Gesprächsprotokoll an den zuständigen Mitarbeiter übergeben. Die Entscheidung über das Angebot bleibt beim Team.",
    },
    {
      question: "Kann der Assistent Late Check-out, Frühstück und weitere Extras verkaufen?",
      answer: "Ja. Der Assistent kann konfiguriert werden, um Zusatzleistungen aktiv anzubieten – Late Check-out, Frühstück, Parkplatz, Spa-Buchungen. Diese Upsell-Logik wird individuell für Ihr Haus eingestellt.",
    },
    {
      question: "Wie lange dauert die Einrichtung?",
      // [[CLAIM: verify — Einrichtungsdauer bestätigen]]
      answer: "Das hängt vom Umfang ab. Komplexe PMS-Anbindungen oder mehrsprachige Konfigurationen dauern länger. Der Hotelbetrieb wird dabei nicht unterbrochen.",
    },
  ],
};

export function KiTelefonassistentHotel() {
  return <NationalIndustryPage config={config} />;
}
