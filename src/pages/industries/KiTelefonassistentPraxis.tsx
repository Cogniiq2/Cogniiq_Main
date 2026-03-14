import { NationalIndustryPage } from "@/components/NationalIndustryPage";
import type { NationalIndustryPageConfig } from "@/components/NationalIndustryPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const config: NationalIndustryPageConfig = {
  seo: {
    title: "KI Telefonassistent für Praxen & Therapeuten | Automatisierte Terminbuchung | Cogniiq",
    description: "KI Telefonassistent für Therapeuten, Physio- und Logopädiepraxen: Automatische Terminbuchung, Patienten-Kommunikation und Entlastung des Praxisteams. DSGVO-konform.",
    canonical: `${BUSINESS_INFO.website}/ki-telefonassistent-praxis`,
    keywords: "KI Telefonassistent Praxis, Physiotherapie Telefonservice, Terminbuchung Therapeut, KI Rezeptionistin Therapiepraxis",
  },
  h1: "KI Telefonassistent für Therapeuten & Praxen",
  tagline: "Therapeuten · Terminbuchung · Praxisentlastung",
  intro: "Physiotherapeuten, Logopäden, Ergotherapeuten und andere Therapeuten verlieren täglich Patienten durch verpasste Anrufe. Der KI Telefonassistent nimmt Terminanfragen automatisch entgegen und entlastet das Praxisteam spürbar.",
  serviceSlug: "ki-telefonassistent",
  serviceLabel: "KI Telefonassistent",
  costLink: "/kosten-ki-telefonassistent",
  costLinkLabel: "Kosten KI Telefonassistent",
  problems: [
    {
      title: "Anrufspitzen während Behandlungen",
      description: "Während Therapeuten im Behandlungsraum sind, klingelt das Telefon – und niemand kann abnehmen. Patienten rufen beim nächsten Therapeuten an.",
    },
    {
      title: "Terminkoordination kostet zu viel Zeit",
      description: "Das manuelle Koordinieren von Terminen, Folgeterminen und Absagen bindet täglich Stunden. Diese Zeit fehlt für die eigentliche Therapiearbeit.",
    },
    {
      title: "Hohe No-Show-Rate ohne Erinnerungen",
      description: "Patienten, die keine Terminerinnerung erhalten, erscheinen häufiger nicht. Das kostet direkt Umsatz und blockiert den Kalender.",
    },
    {
      title: "Keine Erreichbarkeit außerhalb der Öffnungszeiten",
      description: "Patienten, die abends oder am Wochenende einen Folgetermin buchen möchten, können dies nicht und wechseln zur Konkurrenz.",
    },
    {
      title: "DSGVO-Anforderungen für Patientendaten",
      description: "Therapeuten müssen Patientendaten nach DSGVO verarbeiten. Ohne dokumentiertes System entstehen rechtliche Risiken.",
    },
    {
      title: "Rezeptmanagement und Überweisungsanfragen",
      description: "Routineanfragen zu Rezepten und Überweisungen belasten das Team täglich – und können vollständig automatisiert werden.",
    },
  ],
  solution: {
    headline: "Therapeuten entlasten – mehr Zeit für Patienten.",
    text: "Der KI Telefonassistent übernimmt die Terminannahme, sendet automatische Erinnerungen und beantwortet Standardanfragen. So hat das Praxisteam mehr Zeit für die Therapie – und Patienten werden nie abgewiesen.",
  },
  benefits: [
    "Automatische Terminbuchung und -bestätigung",
    "Erinnerungen reduzieren No-Shows um bis zu 50 %",
    "DSGVO-konform – Patientendaten sicher verarbeitet",
    "24/7 erreichbar für Terminanfragen",
    "Entlastung des Teams von Routinekommunikation",
    "Integration mit Praxisverwaltungssystemen",
    "Folgetermine automatisch eingeplant",
  ],
  workflow: {
    title: "Automatische Terminverwaltung für Therapeuten",
    steps: [
      {
        step: "Schritt 1",
        title: "Patient ruft an",
        description: "Der Assistent nimmt den Anruf sofort entgegen – auch wenn alle Behandlungsräume belegt sind. Kein verpasster Anruf, keine Warteschleife.",
      },
      {
        step: "Schritt 2",
        title: "Termin buchen",
        description: "Freie Termine werden geprüft und dem Patienten vorgeschlagen. Nach Bestätigung wird der Termin direkt im Praxiskalender eingetragen.",
      },
      {
        step: "Schritt 3",
        title: "Erinnern & bestätigen",
        description: "Automatische Bestätigung nach der Buchung und Erinnerung 24 Stunden vor dem Termin – No-Shows werden deutlich reduziert.",
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
    { label: "KI Telefonassistent Arzt", href: "/ki-telefonassistent-arzt" },
    { label: "Automatisierung Arzt", href: "/automatisierung-arzt" },
    { label: "Webdesign Arzt", href: "/webdesign-arzt" },
    { label: "Kosten KI Telefonassistent", href: "/kosten-ki-telefonassistent" },
    { label: "KI Telefonassistent Restaurant", href: "/ki-telefonassistent-restaurant" },
  ],
  faq: [
    {
      question: "Welche Praxisarten profitieren am meisten?",
      answer: "Physiotherapeuten, Logopäden, Ergotherapeuten, Psychotherapeuten und andere Therapeuten profitieren stark, da Terminkoordination einen großen Teil der Verwaltungszeit ausmacht.",
    },
    {
      question: "Ist der Assistent DSGVO-konform für Patientendaten?",
      answer: "Ja. Alle Daten werden auf deutschen Servern verarbeitet und der Assistent wird mit einem Auftragsverarbeitungsvertrag (AVV) geliefert.",
    },
    {
      question: "Kann der Assistent Folgetermine automatisch einplanen?",
      answer: "Ja. Nach einer Behandlung kann der Assistent automatisch Folgetermine anbieten und einplanen – nach den Regeln, die Sie vorgeben.",
    },
    {
      question: "Was kostet der KI Telefonassistent für eine Praxis?",
      answer: "Typischerweise 149–249 €/Monat für eine Therapeutenpraxis – je nach Anrufvolumen und Integrationsaufwand. Genaues Angebot nach kostenlosem Erstgespräch.",
    },
    {
      question: "Kann ich den Assistenten testen, bevor ich mich entscheide?",
      answer: "Ja. Wir bieten eine kostenlose Demo, in der Sie den Assistenten live erleben können – konfiguriert auf Ihre Praxis.",
    },
  ],
};

export function KiTelefonassistentPraxis() {
  return <NationalIndustryPage config={config} />;
}
