import { NationalIndustryPage } from "@/components/NationalIndustryPage";
import type { NationalIndustryPageConfig } from "@/components/NationalIndustryPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const config: NationalIndustryPageConfig = {
  seo: {
    title: "KI Telefonassistent für Hotels & Pensionen | Rezeption auch nachts | Cogniiq",
    description: "KI Telefonassistent für Hotels: erreichbar auch außerhalb der Rezeptionszeiten. Freigegebene Buchungsabläufe werden im Gespräch abgewickelt, Gruppenanfragen gehen an Ihr Haus. Direktbuchungen stärken.",
    canonical: `${BUSINESS_INFO.website}/ki-telefonassistent-hotel`,
    keywords: "KI Telefonassistent Hotel, Rezeption außerhalb der Öffnungszeiten, automatische Zimmerbuchung, KI Rezeptionistin Hotel, Telefonservice Hotellerie",
  },
  h1: "KI Telefonassistent für Hotels & Pensionen",
  tagline: "Hotellerie · Rezeption auch nachts · Direktbuchungen stärken",
  intro: "Reisende buchen spät abends – um 22 Uhr, nach dem Feierabend, wenn die Rezeption längst geschlossen ist. Wer in diesem Moment nicht erreichbar ist, verliert die Direktbuchung häufig an ein Buchungsportal – inklusive der fälligen Provision. Der KI Telefonassistent führt das Buchungsgespräch auch außerhalb der Rezeptionszeiten: Er erklärt Zimmertypen, klärt Termin, Personenzahl und Sonderwünsche und wickelt den freigegebenen Buchungsablauf ab. In Ihr PMS eingetragen wird die Buchung, sobald dessen Schnittstelle eingerichtet und verifiziert ist — wir prüfen sie vor dem Angebot. Gruppen- und Veranstaltungsanfragen gehen bewusst an Ihr Haus: Dort entscheidet ein Mensch.",
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
    "Freigegebene Buchungsabläufe im Gespräch abgeschlossen — eingetragen in Ihrem PMS, wo dessen geprüfte Schnittstelle das trägt",
    "Ohne tragfähige Schnittstelle: vollständiger Vorgang für die Rezeption, als vereinbarter Rückfallweg",
    // [[CLAIM: verify — Sprachumfang (Deutsch/Englisch, weitere) bestätigen]]
    "Mehrsprachig möglich: üblicherweise Deutsch und Englisch, weitere Sprachen auf Anfrage",
    "Sonderwünsche und Gruppenanfragen strukturiert erfasst",
    // [[CLAIM: verify — PMS-/Channel-Manager-Anbindungen konkret bestätigen]]
    "Anbindung an gängige PMS-Systeme und Channel-Manager wird vor dem Angebot geprüft",
    // Kanonisch: 14 Kalendertage ab dem Start bis zur Übergabe zur Freigabe
    // (FAKTEN.uebergabeGarantie). Der Go-live hängt an der Kundenfreigabe und
    // darf hier nie mit einer Frist verbunden werden.
    "Eingerichtet ohne Unterbrechung — der Hotelbetrieb läuft weiter",
  ],
  workflow: {
    title: "So läuft eine Buchungsanfrage ab",
    steps: [
      {
        step: "01",
        title: "Gast ruft an",
        description: "Ob um 10 Uhr morgens oder 23 Uhr abends – der Assistent nimmt an, auf Deutsch oder Englisch, auch mehrere Anrufe zur selben Zeit. Die Kapazität wird auf Ihr Aufkommen ausgelegt und im Angebot ausgewiesen.",
      },
      {
        step: "02",
        title: "Verfügbarkeit prüfen, Zimmer empfehlen",
        description: "Zimmerverfügbarkeit prüfen, Zimmertypen erklären, Preise kommunizieren, Sonderwünsche klären – nach Ihren Vorgaben und in der Sprache des Gastes. Was Sie freigegeben haben, wickelt der Assistent im selben Gespräch ab.",
      },
      {
        step: "03",
        title: "Buchung abschließen — oder gezielt eskalieren",
        description: "Trägt die vorab geprüfte Schnittstelle Ihres PMS den Eintrag, schließt der Assistent den freigegebenen Buchungsablauf im Gespräch ab; für den Gast ist die Sache damit erledigt. Ohne tragfähige Schnittstelle steht der vollständige Vorgang für die Rezeption bereit — als vereinbarter Rückfallweg. Gruppen, Veranstaltungen und alles, was Sie ausgenommen haben, gehen in jedem Fall an Ihr Haus. Ob der Gast eine schriftliche Bestätigung erhält, richten wir als Teil Ihres Ablaufs ein.",
      },
    ],
  },
  rechner: {
    ankertext: "Preis für Ihr Anrufaufkommen berechnen",
    kontext: "Hotel",
    einleitung:
      "Hotels unterscheiden sich im Anrufaufkommen stärker als in fast jeder anderen Branche. Statt eines Beispielpreises, der für Ihr Haus ohnehin nicht gälte: Tragen Sie Ihre eigenen Zahlen ein.",
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
      answer: "Gruppen- und Veranstaltungsanfragen sind bewusst KEIN Routineablauf: Zimmerkontingente, Raten und Veranstaltungsräume sind Verhandlungssache. Der Assistent klärt im Gespräch, was sich klären lässt – Zimmerzahl, An- und Abreise, Sonderwünsche, Raumbedarf – und gibt den Vorgang mit Gesprächsprotokoll an den zuständigen Mitarbeiter. Das ist eine Eskalation nach Ihren Regeln, nicht der Normalweg einer Einzelbuchung: Die wickelt der Assistent ab.",
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
