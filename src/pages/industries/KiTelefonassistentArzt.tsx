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
  intro: "Jede Arztpraxis kennt das: Montagmorgen klingelt das Telefon ununterbrochen, das Team ist besetzt, Patienten legen auf. Der KI Telefonassistent nimmt eingehende Anrufe sofort entgegen – bucht Termine direkt in den Praxiskalender, beantwortet Standardfragen und entlastet Ihr Team dauerhaft.",
  serviceSlug: "ki-telefonassistent",
  serviceLabel: "KI Telefonassistent",
  costLink: "/kosten-ki-telefonassistent",
  costLinkLabel: "Kosten KI Telefonassistent",
  problems: [
    {
      title: "Anrufspitzen zu Stoßzeiten",
      description: "Montagmorgen und nach Feiertagen ist die Telefonleitung dauerhaft besetzt. Patienten warten zu lange oder legen auf – und buchen woanders.",
    },
    {
      title: "Routinefragen binden qualifiziertes Personal",
      description: "Öffnungszeiten, Rezeptanfragen, Überweisungen: Diese Standardanliegen nehmen Praxismitarbeiterinnen täglich mehrere Stunden in Anspruch, die für die direkte Patientenversorgung fehlen.",
    },
    {
      title: "Keine Erreichbarkeit außerhalb der Sprechzeiten",
      description: "Patienten mit dringendem Anliegen außerhalb der Öffnungszeiten erreichen niemanden. Viele wechseln zur nächsten Praxis – oder fahren unnötig in die Notaufnahme.",
    },
    {
      title: "Terminausfälle durch verpasste Anrufe",
      description: "Jeder Anruf, der ins Leere geht, ist ein potenzieller Patient, der einen Termin anderswo bucht. Das kostet direkt Kapazität und Umsatz.",
    },
    {
      title: "DSGVO-Risiken bei unsystemischer Telefonkommunikation",
      description: "Patientendaten am Telefon ohne dokumentiertes System zu verarbeiten birgt rechtliche Risiken. Ohne klare Prozesse und AVV ist die Praxis angreifbar.",
    },
    {
      title: "Terminkoordination in Gemeinschaftspraxen",
      description: "Bei mehreren Ärzten und Behandlungsräumen ist die manuelle Terminkoordination komplex, zeitaufwändig und fehleranfällig – besonders in Stoßzeiten.",
    },
  ],
  solution: {
    headline: "Praxisteam dauerhaft entlasten – Patienten zuverlässig erreichen.",
    text: "Der KI Telefonassistent übernimmt eingehende Anrufe vollautomatisch: Er bucht Termine direkt in den Praxiskalender, beantwortet Standardfragen DSGVO-konform und leitet komplexe Anliegen mit strukturierter Zusammenfassung weiter. Das Praxisteam konzentriert sich auf das Wesentliche.",
  },
  benefits: [
    "Automatische Terminbuchung direkt in den Praxiskalender",
    "DSGVO-konform – Verarbeitung auf deutschen Servern",
    "24/7 telefonisch erreichbar für Ihre Patienten",
    "Standardauskünfte automatisch und korrekt beantwortet",
    "Entlastung des Praxisteams von Routineanrufen",
    "Integration mit gängigen Praxisverwaltungssystemen",
    "Eingerichtet in 7–14 Tagen, kein IT-Aufwand Ihrer Seite",
  ],
  workflow: {
    title: "So läuft ein Patientenanruf ab",
    steps: [
      {
        step: "01",
        title: "Patient ruft an",
        description: "Der Assistent nimmt sofort ab – auch wenn alle Leitungen besetzt sind. Er begrüßt den Patienten professionell und erfragt das Anliegen in natürlicher Sprache.",
      },
      {
        step: "02",
        title: "Anliegen verstehen und bearbeiten",
        description: "Terminanfragen, Fragen zu Öffnungszeiten, Leistungen und Überweisungen werden korrekt beantwortet. Alles nach Ihren Vorgaben – branchenspezifisch konfiguriert.",
      },
      {
        step: "03",
        title: "Termin buchen und bestätigen",
        description: "Verfügbarkeit wird in Echtzeit geprüft, der Termin direkt eingetragen. Der Patient erhält eine Bestätigung – ohne Rückruf, ohne manuelle Nacharbeit.",
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
      answer: "Ja. Alle Patientendaten werden ausschließlich auf deutschen Servern verarbeitet. Der Assistent wird mit einem Auftragsverarbeitungsvertrag (AVV) geliefert und ist vollständig DSGVO-konform konfiguriert.",
    },
    {
      question: "Kann der Assistent in unser Praxisverwaltungssystem integriert werden?",
      answer: "Ja. Wir integrieren den Assistenten in gängige Praxisverwaltungssysteme für direkte Kalender-Synchronisation. Die technische Integration übernimmt Cogniiq vollständig – kein Aufwand auf Ihrer Seite.",
    },
    {
      question: "Was passiert bei medizinischen Notfällen?",
      answer: "Der Assistent erkennt Notfallsituationen und leitet sofort an den Notruf oder den diensthabenden Arzt weiter. Die Eskalationslogik wird individuell für Ihre Praxis konfiguriert.",
    },
    {
      question: "Wie viel Zeit spart der Assistent pro Tag?",
      answer: "In einer durchschnittlichen Allgemeinpraxis übernimmt der Assistent täglich 30–80 Anrufe. Das entspricht mehreren Stunden Teamzeit, die direkt für die Patientenversorgung verfügbar wird.",
    },
    {
      question: "Kann die Praxis den Assistenten selbst anpassen?",
      answer: "Einfache Anpassungen wie Öffnungszeiten und Urlaubsregelungen können Sie selbst vornehmen. Für komplexere Konfigurationen steht Cogniiq zur Verfügung.",
    },
  ],
};

export function KiTelefonassistentArzt() {
  return <NationalIndustryPage config={config} />;
}
