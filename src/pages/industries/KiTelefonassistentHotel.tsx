import { NationalIndustryPage } from "@/components/NationalIndustryPage";
import type { NationalIndustryPageConfig } from "@/components/NationalIndustryPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const config: NationalIndustryPageConfig = {
  seo: {
    title: "KI Telefonassistent für Hotels & Pensionen | 24/7 Rezeption | Cogniiq",
    description: "KI Telefonassistent für Hotels: 24/7 Rezeptionsdienst, automatische Zimmerbuchungen und Gästeanfragen. Nie wieder verpasste Buchungen außerhalb der Rezeptionszeiten.",
    canonical: `${BUSINESS_INFO.website}/ki-telefonassistent-hotel`,
    keywords: "KI Telefonassistent Hotel, 24/7 Rezeption, automatische Zimmerbuchung, KI Rezeptionistin Hotel, Telefonservice Hotellerie",
  },
  h1: "KI Telefonassistent für Hotels & Pensionen",
  tagline: "Hotellerie · 24/7 Rezeption · Buchungsautomatisierung",
  intro: "Hotels verlieren Direktbuchungen, weil außerhalb der Rezeptionszeiten niemand ans Telefon geht. Der KI Telefonassistent übernimmt Buchungsanfragen, Zimmerverfügbarkeit und Gästeanfragen – rund um die Uhr, mehrsprachig und DSGVO-konform.",
  serviceSlug: "ki-telefonassistent",
  serviceLabel: "KI Telefonassistent",
  costLink: "/kosten-ki-telefonassistent",
  costLinkLabel: "Kosten KI Telefonassistent",
  problems: [
    {
      title: "Buchungsanfragen außerhalb der Rezeptionszeiten",
      description: "Reisende buchen oft spät abends oder nachts. Ohne 24/7-Erreichbarkeit gehen diese Buchungen an OTAs oder Konkurrenten – mit Provision-Verlust.",
    },
    {
      title: "Rezeptionsteam überlastet in Stoßzeiten",
      description: "Check-in, Check-out und gleichzeitig eingehende Anrufe sind für kleine Teams kaum zu bewältigen. Gäste müssen warten oder werden vertröstet.",
    },
    {
      title: "Standardfragen binden wertvolle Personalzeit",
      description: "Fragen zu Parkmöglichkeiten, Frühstückszeiten, Haustierfreundlichkeit und WLAN können vollständig automatisiert beantwortet werden.",
    },
    {
      title: "Gruppenanfragen nicht effizient koordiniert",
      description: "Gruppen- und Eventbuchungen erfordern komplexe Kommunikation. Ohne System gehen Anfragen verloren oder werden zu spät bearbeitet.",
    },
    {
      title: "Mehrsprachige Gäste nicht bedient",
      description: "Internationale Reisende rufen auf Englisch an. Ohne mehrsprachigen Service entgehen internationale Buchungen – besonders in touristisch geprägten Regionen.",
    },
    {
      title: "Keine automatischen Buchungsbestätigungen",
      description: "Manuelle Bestätigungs-E-Mails kosten Zeit und sind fehleranfällig. Automatisierte Bestätigungen erhöhen Gästezufriedenheit und reduzieren No-Shows.",
    },
  ],
  solution: {
    headline: "24/7 erreichbar – wie eine Rezeption, die nie schläft.",
    text: "Der KI Telefonassistent übernimmt die telefonische Erreichbarkeit außerhalb der Rezeptionszeiten: Buchungsanfragen, Zimmerverfügbarkeit, Standardauskünfte – und leitet komplexe Anfragen automatisch weiter.",
  },
  benefits: [
    "24/7 telefonische Erreichbarkeit für Gäste",
    "Automatische Zimmerbuchungen und Bestätigungen",
    "Mehrsprachig: Deutsch und Englisch",
    "Standardauskünfte vollständig automatisiert",
    "Integration mit Channel-Manager und PMS",
    "Reduktion von No-Shows durch Erinnerungen",
    "Keine verpassten Direktbuchungen mehr",
  ],
  workflow: {
    title: "KI Telefonassistent als 24/7 Rezeptionsdienst",
    steps: [
      {
        step: "Schritt 1",
        title: "Gast ruft an",
        description: "Ob Anfrage zur Zimmerverfügbarkeit, Buchungsänderung oder Standardfrage – der Assistent ist sofort erreichbar, auch nachts und am Wochenende.",
      },
      {
        step: "Schritt 2",
        title: "Anliegen klären",
        description: "Verfügbarkeit prüfen, Zimmertypen erklären, Sonderwünsche aufnehmen und Preise kommunizieren – vollautomatisch und korrekt.",
      },
      {
        step: "Schritt 3",
        title: "Buchung bestätigen",
        description: "Buchung in das Hotelsystem eintragen, Bestätigung versenden und Gast verabschieden – in unter zwei Minuten.",
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
      question: "Kann der KI Assistent in das Hotelverwaltungssystem integriert werden?",
      answer: "Ja. Wir integrieren in gängige PMS-Systeme und Channel-Manager. Buchungen laufen direkt ins Hotelsystem – ohne manuelle Nacherfassung.",
    },
    {
      question: "Spricht der Assistent auch Englisch?",
      answer: "Ja. Hotels können den Assistenten für Deutsch und Englisch konfigurieren lassen. Weitere Sprachen auf Anfrage.",
    },
    {
      question: "Was passiert bei komplexen Gruppenanfragen?",
      answer: "Gruppenanfragen werden automatisch aufgenommen, kategorisiert und an den zuständigen Mitarbeiter weitergeleitet – mit vollständiger Zusammenfassung des Anliegens.",
    },
    {
      question: "Kann der Assistent Sonderwünsche aufnehmen?",
      answer: "Ja. Allergien, Zimmerausstattung, Anreisezeiten und andere Sonderwünsche werden erfasst und im System notiert.",
    },
    {
      question: "Wie lange dauert die Einrichtung?",
      answer: "In den meisten Fällen ist der Assistent innerhalb von 7–14 Tagen konfiguriert und live. Komplexe Integrationen können etwas länger dauern.",
    },
  ],
};

export function KiTelefonassistentHotel() {
  return <NationalIndustryPage config={config} />;
}
