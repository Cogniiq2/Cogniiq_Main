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
  tagline: "Hotellerie · 24/7 Rezeption · Direktbuchungen",
  intro: "Reisende buchen spät abends und nachts – dann, wenn die Rezeption nicht mehr besetzt ist. Der KI Telefonassistent übernimmt Buchungsanfragen, Zimmerverfügbarkeit und Gästeanfragen rund um die Uhr. Direktbuchungen gehen nicht mehr an OTAs verloren.",
  serviceSlug: "ki-telefonassistent",
  serviceLabel: "KI Telefonassistent",
  costLink: "/kosten-ki-telefonassistent",
  costLinkLabel: "Kosten KI Telefonassistent",
  problems: [
    {
      title: "Buchungsanfragen außerhalb der Rezeptionszeiten",
      description: "Reisende entscheiden sich oft spät abends oder am Wochenende. Ohne 24/7-Erreichbarkeit gehen diese Direktbuchungen an OTAs – mit Provisionsverlust für das Hotel.",
    },
    {
      title: "Rezeptionsteam in Stoßzeiten überlastet",
      description: "Check-in, Check-out und gleichzeitig klingelnde Telefone: kleine Teams können das nicht vollständig bewältigen. Gäste warten oder kommen nicht durch.",
    },
    {
      title: "Standardfragen binden wertvolle Rezeptionszeit",
      description: "Parkmöglichkeiten, Frühstückszeiten, Haustierfreundlichkeit, WLAN – diese Fragen können vollautomatisch beantwortet werden, ohne das Rezeptionsteam zu belasten.",
    },
    {
      title: "Gruppen- und Eventanfragen werden verzögert bearbeitet",
      description: "Gruppenanfragen erfordern koordinierte Kommunikation. Ohne klaren Prozess gehen Anfragen verloren oder werden zu spät bearbeitet.",
    },
    {
      title: "Internationale Gäste nicht bedient",
      description: "Reisende aus dem Ausland rufen auf Englisch an. Ohne mehrsprachigen Telefonservice entgehen internationale Buchungen.",
    },
    {
      title: "Keine automatischen Buchungsbestätigungen",
      description: "Manuelle Bestätigungs-E-Mails kosten Zeit und sind fehleranfällig. Automatisierte Bestätigungen erhöhen die Gästezufriedenheit und reduzieren No-Shows messbar.",
    },
  ],
  solution: {
    headline: "24/7 erreichbar – wie eine Rezeption, die nie schließt.",
    text: "Der KI Telefonassistent übernimmt die telefonische Erreichbarkeit vollautomatisch: Buchungsanfragen, Zimmerverfügbarkeit, Standardauskünfte – und leitet komplexe Anliegen mit vollständiger Zusammenfassung an das Rezeptionsteam weiter.",
  },
  benefits: [
    "24/7 telefonische Erreichbarkeit für Gäste",
    "Automatische Zimmerbuchungen und Bestätigungen",
    "Mehrsprachig konfigurierbar: Deutsch und Englisch",
    "Standardauskünfte vollautomatisch beantwortet",
    "Integration mit Channel-Manager und PMS-Systemen",
    "Erinnerungen zur Reduktion von No-Shows",
    "Keine verpassten Direktbuchungen mehr",
  ],
  workflow: {
    title: "So läuft eine Buchungsanfrage ab",
    steps: [
      {
        step: "01",
        title: "Gast ruft an",
        description: "Ob Buchungsanfrage, Zimmerverfügbarkeit oder Standardfrage – der Assistent ist sofort erreichbar, auch nachts und am Wochenende. Kein Besetztzeichen, keine Warteschleife.",
      },
      {
        step: "02",
        title: "Anliegen klären und prüfen",
        description: "Verfügbarkeit prüfen, Zimmertypen erklären, Sonderwünsche aufnehmen und Preise kommunizieren – vollautomatisch, korrekt und freundlich.",
      },
      {
        step: "03",
        title: "Buchung bestätigen",
        description: "Buchung ins System eintragen, Bestätigung versenden und Gast verabschieden. Vollständig ohne manuellen Aufwand – in unter zwei Minuten abgeschlossen.",
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
      answer: "Ja. Wir integrieren in gängige PMS-Systeme und Channel-Manager. Buchungen laufen direkt ins Hotelsystem – ohne manuelle Nacherfassung durch das Rezeptionsteam.",
    },
    {
      question: "Spricht der Assistent auch Englisch?",
      answer: "Ja. Hotels können den Assistenten für Deutsch und Englisch konfigurieren lassen. Weitere Sprachen sind auf Anfrage möglich.",
    },
    {
      question: "Was passiert bei komplexen Gruppenanfragen?",
      answer: "Gruppenanfragen werden vollständig aufgenommen, kategorisiert und mit Gesprächszusammenfassung an den zuständigen Mitarbeiter weitergeleitet – kein Informationsverlust.",
    },
    {
      question: "Kann der Assistent Sonderwünsche aufnehmen?",
      answer: "Ja. Allergien, Zimmerausstattung, Anreisezeiten und andere Sonderwünsche werden während des Gesprächs erfasst und im System dokumentiert.",
    },
    {
      question: "Wie lange dauert die Einrichtung?",
      answer: "In den meisten Fällen ist der Assistent innerhalb von 7–14 Tagen konfiguriert und live. Komplexe PMS-Integrationen werden individuell abgestimmt.",
    },
  ],
};

export function KiTelefonassistentHotel() {
  return <NationalIndustryPage config={config} />;
}
