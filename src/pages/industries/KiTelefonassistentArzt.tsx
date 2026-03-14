import { NationalIndustryPage } from "@/components/NationalIndustryPage";
import type { NationalIndustryPageConfig } from "@/components/NationalIndustryPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const config: NationalIndustryPageConfig = {
  seo: {
    title: "KI Telefonassistent für Arztpraxen | Automatische Terminbuchung | Cogniiq",
    description: "KI Telefonassistent für Arztpraxen: Automatische Terminbuchung, Patientenanfragen und Standardauskünfte. DSGVO-konform, 24/7 erreichbar, Entlastung für das Praxisteam.",
    canonical: `${BUSINESS_INFO.website}/ki-telefonassistent-arzt`,
    keywords: "KI Telefonassistent Arztpraxis, Praxis Telefonservice, automatische Terminbuchung Arzt, KI Rezeptionistin Praxis",
  },
  h1: "KI Telefonassistent für Arztpraxen",
  tagline: "Arztpraxis · Terminbuchung · DSGVO-konform",
  intro: "Arztpraxen verlieren täglich Stunden durch Routineanrufe. Der KI Telefonassistent übernimmt Terminbuchungen, Standardauskünfte und Weiterleitung automatisch – DSGVO-konform und rund um die Uhr.",
  serviceSlug: "ki-telefonassistent",
  serviceLabel: "KI Telefonassistent",
  costLink: "/kosten-ki-telefonassistent",
  costLinkLabel: "Kosten KI Telefonassistent",
  problems: [
    {
      title: "Anrufspitzen überlasten das Praxisteam",
      description: "Montagmorgen und nach Feiertagen klingelt das Telefon ununterbrochen. Das Team kann nicht alle Anrufe gleichzeitig betreuen – Patienten warten oder legen auf.",
    },
    {
      title: "Routineanfragen blockieren wichtige Arbeit",
      description: "Öffnungszeiten, Überweisungsanfragen und Standardauskünfte nehmen Praxismitarbeiter täglich stundenlang in Anspruch – Zeit, die für Patienten fehlt.",
    },
    {
      title: "Keine telefonische Erreichbarkeit außerhalb der Sprechzeiten",
      description: "Patienten mit dringendem Anliegen außerhalb der Öffnungszeiten erreichen niemanden und wechseln zur Konkurrenz oder fahren in die Notaufnahme.",
    },
    {
      title: "Verpasste Termine durch Anrufausfälle",
      description: "Jeder Anruf, der ins Leere klingelt, ist ein potenzieller Patient, der einen Termin woanders bucht. Das kostet direkt Umsatz.",
    },
    {
      title: "DSGVO-Anforderungen bei Patientenkommunikation",
      description: "Die Verarbeitung von Patientendaten am Telefon muss DSGVO-konform erfolgen. Ohne dokumentiertes System entstehen rechtliche Risiken.",
    },
    {
      title: "Terminkoordination zwischen mehreren Ärzten komplex",
      description: "In Gemeinschaftspraxen ist die Koordination von Terminen für mehrere Ärzte und Behandlungsräume manuell zeitaufwändig und fehleranfällig.",
    },
  ],
  solution: {
    headline: "Praxisteam entlasten – Patienten besser betreuen.",
    text: "Der KI Telefonassistent nimmt eingehende Anrufe automatisch entgegen, bucht Termine direkt in den Praxiskalender und beantwortet Standardfragen DSGVO-konform. Das Praxisteam konzentriert sich auf die Patientenversorgung.",
  },
  benefits: [
    "Automatische Terminbuchung in Praxiskalender",
    "DSGVO-konform – alle Daten auf deutschen Servern",
    "24/7 telefonisch erreichbar für Patienten",
    "Standardauskünfte automatisch beantwortet",
    "Entlastung des Praxisteams von Routineanrufen",
    "Integration mit gängigen Praxisverwaltungssystemen",
    "Einrichtung in 7–14 Tagen, kein technischer Aufwand",
  ],
  workflow: {
    title: "So funktioniert der KI Telefonassistent in der Arztpraxis",
    steps: [
      {
        step: "Schritt 1",
        title: "Patient ruft an",
        description: "Der Assistent nimmt den Anruf sofort entgegen – kein Warten, keine Warteschleife. Er begrüßt den Patienten professionell und erfragt das Anliegen.",
      },
      {
        step: "Schritt 2",
        title: "Anliegen bearbeiten",
        description: "Terminanfragen, Standardfragen zu Öffnungszeiten, Leistungen und Überweisungen werden automatisch und korrekt beantwortet.",
      },
      {
        step: "Schritt 3",
        title: "Termin bestätigen",
        description: "Terminanfragen werden geprüft, bestätigt und direkt in den Praxiskalender eingetragen. Der Patient erhält eine Bestätigung.",
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
    { label: "Webdesign Arzt", href: "/webdesign-arzt" },
    { label: "KI Telefonassistent Praxis", href: "/ki-telefonassistent-praxis" },
    { label: "Automatisierung Arzt", href: "/automatisierung-arzt" },
    { label: "Kosten KI Telefonassistent", href: "/kosten-ki-telefonassistent" },
    { label: "KI Telefonassistent Restaurant", href: "/ki-telefonassistent-restaurant" },
  ],
  faq: [
    {
      question: "Ist der KI Telefonassistent für Arztpraxen DSGVO-konform?",
      answer: "Ja. Alle Patientendaten werden ausschließlich auf deutschen Servern verarbeitet. Der Assistent ist vollständig DSGVO-konform und wird mit einem Auftragsverarbeitungsvertrag (AVV) geliefert.",
    },
    {
      question: "Kann der Assistent in das Praxisverwaltungssystem integriert werden?",
      answer: "Ja. Wir integrieren den Assistenten in gängige Praxisverwaltungssysteme für direkte Kalender-Synchronisation. Die technische Integration übernimmt Cogniiq.",
    },
    {
      question: "Was passiert bei medizinischen Notfällen?",
      answer: "Der Assistent ist so konfiguriert, dass er bei medizinischen Notfällen sofort an den Notaruf oder den Arzt weiterleitet. Sicherheit hat absolute Priorität.",
    },
    {
      question: "Wie viel Zeit spart der KI Assistent pro Tag?",
      answer: "In einer durchschnittlichen Allgemeinpraxis übernimmt der Assistent täglich 40–80 Anrufe. Das entspricht 3–6 Stunden Teamzeit, die für die Patientenversorgung genutzt werden kann.",
    },
    {
      question: "Kann die Praxis den Assistenten selbst anpassen?",
      answer: "Grundlegende Anpassungen wie Öffnungszeiten und Urlaubszeiten kann die Praxis selbst vornehmen. Komplexere Anpassungen unterstützt Cogniiq.",
    },
  ],
};

export function KiTelefonassistentArzt() {
  return <NationalIndustryPage config={config} />;
}
