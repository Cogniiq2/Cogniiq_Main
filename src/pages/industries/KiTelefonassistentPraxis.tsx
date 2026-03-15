import { NationalIndustryPage } from "@/components/NationalIndustryPage";
import type { NationalIndustryPageConfig } from "@/components/NationalIndustryPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const config: NationalIndustryPageConfig = {
  seo: {
    title: "KI Telefonassistent für Therapeuten & Praxen | Automatisierte Terminbuchung | Cogniiq",
    description: "KI Telefonassistent für Physio-, Logo- und Ergotherapeuten: Automatische Terminbuchung, Erinnerungen und Praxisentlastung. DSGVO-konform, keine verpassten Patienten mehr.",
    canonical: `${BUSINESS_INFO.website}/ki-telefonassistent-praxis`,
    keywords: "KI Telefonassistent Praxis, Physiotherapie Telefonservice, Terminbuchung Therapeut, KI Rezeptionistin Therapiepraxis",
  },
  h1: "KI Telefonassistent für Therapeuten & Praxen",
  tagline: "Therapeuten · Terminbuchung · Praxisentlastung",
  intro: "Sie behandeln – und gleichzeitig klingelt das Telefon. Wer alleine oder mit kleinem Team arbeitet, kann keine Sitzung unterbrechen, um einen Terminwunsch entgegenzunehmen. Der Patient wartet kurz, bekommt keine Antwort und ruft den nächsten Therapeuten an. Der KI Telefonassistent nimmt ab, solange Sie im Behandlungsraum sind – und bucht den Termin direkt in Ihren Kalender.",
  serviceSlug: "ki-telefonassistent",
  serviceLabel: "KI Telefonassistent",
  costLink: "/kosten-ki-telefonassistent",
  costLinkLabel: "Kosten KI Telefonassistent",
  problems: [
    {
      title: "Behandlung und Telefon gleichzeitig ist nicht möglich",
      description: "Physiotherapeuten, Ergotherapeuten und Logopäden haben keine freien Hände und keine freie Aufmerksamkeit während einer Sitzung. Anrufe in dieser Zeit gehen verloren – und mit ihnen potenzielle Patienten.",
    },
    {
      title: "Folgetermine werden telefonisch koordiniert – statt direkt gebucht",
      description: "Nach jeder Behandlung die nächsten Termine koordinieren, Absagen umplanen, Wartelistenkontakt halten: Das summiert sich täglich auf wertvolle Stunden, die der Therapiearbeit fehlen.",
    },
    {
      title: "No-Shows treffen kleine Praxen besonders hart",
      description: "Ein gebuchter Termin, der unbesetzt bleibt, ist in einer Einzelpraxis nicht durch andere Kapazitäten aufgefangen. Automatische Erinnerungen verhindern das zuverlässig – ohne tägliche Arbeit.",
    },
    {
      title: "Abends und am Wochenende erreichbar sein ist die Ausnahme",
      description: "Patienten, die nach Feierabend einen Termin buchen wollen, landen auf der Mailbox. Viele versuchen es nicht noch einmal. Erreichbarkeit außerhalb der Öffnungszeiten entscheidet heute über Patientenbindung.",
    },
    {
      title: "Patientendaten ohne strukturiertes System",
      description: "Name, Anliegen, Kontaktdaten – am Telefon abgenommen und auf einem Notizzettel. Für Therapiepraxen mit ihren datenschutzrechtlichen Anforderungen ist das eine unnötige Schwachstelle.",
    },
    {
      title: "Rezept- und Routineanfragen fressen Verwaltungszeit",
      description: "Kann ich meine Folgerezeptur verlängern lassen? Wann ist der nächste freie Termin? Wie lange dauert eine Einheit? Diese Fragen lassen sich vollständig automatisieren – und entlasten den Praxisalltag dauerhaft.",
    },
  ],
  solution: {
    headline: "Mehr Zeit für Therapie. Kein verpasster Patient mehr.",
    text: "Der KI Telefonassistent übernimmt Terminannahme, Bestätigung und Erinnerungen – vollständig automatisch. Sie behandeln, der Assistent verwaltet. Patienten werden nicht mehr abgewiesen, weil Sie gerade im Behandlungsraum sind.",
  },
  benefits: [
    "Terminbuchung während der Behandlung – kein Anruf geht verloren",
    "Automatische Terminerinnerungen reduzieren No-Shows messbar",
    "DSGVO-konform – Patientendaten auf deutschen Servern mit AVV",
    "24/7 erreichbar für Terminwünsche und Standardfragen",
    "Folgetermine automatisch angeboten und eingetragen",
    "Integration mit Praxisverwaltungssystemen",
    "Eingerichtet in 7–14 Tagen – keine Unterbrechung des Betriebs",
  ],
  workflow: {
    title: "So läuft ein Terminanruf in der Therapeutenpraxis ab",
    steps: [
      {
        step: "01",
        title: "Patient ruft an",
        description: "Der Assistent nimmt sofort ab – auch wenn alle Behandlungsräume belegt sind. Kein verpasster Anruf, keine Warteschleife, kein Besetztzeichen.",
      },
      {
        step: "02",
        title: "Termin prüfen und buchen",
        description: "Freie Termine werden in Echtzeit geprüft und dem Patienten vorgeschlagen – nach den Regeln und Zeitfenstern, die Sie vorgeben. Nach Bestätigung wird der Termin direkt eingetragen.",
      },
      {
        step: "03",
        title: "Bestätigung sofort, Erinnerung automatisch",
        description: "Sofortige Buchungsbestätigung per SMS oder E-Mail. 24 Stunden vorher folgt eine automatische Erinnerung – No-Shows sinken, ohne dass Sie einen Finger rühren.",
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
      answer: "Physiotherapeuten, Ergotherapeuten, Logopäden, Psychotherapeuten und Heilpraktiker profitieren besonders stark – weil bei ihnen Behandlungszeit und Telefonzeit direkt konkurrieren. Je weniger Assistenz, desto höher der Gewinn durch Automatisierung.",
    },
    {
      question: "Ist der Assistent DSGVO-konform für Patientendaten in Therapiepraxen?",
      answer: "Ja. Alle Daten werden auf deutschen Servern verarbeitet. Der Assistent wird mit einem Auftragsverarbeitungsvertrag (AVV) geliefert – vollständig rechtssicher für Therapiepraxen, die sensible Gesundheitsdaten verarbeiten.",
    },
    {
      question: "Kann der Assistent automatisch Folgetermine einplanen?",
      answer: "Ja. Nach einer Sitzung kann der Assistent automatisch Folgetermine anbieten und einplanen – nach den Zeitfenstern und Regeln, die Sie vorgeben. Patienten müssen nicht aktiv nachfragen oder nochmals anrufen.",
    },
    {
      question: "Was passiert mit Anfragen, die der Assistent nicht beantworten kann?",
      answer: "Komplexe medizinische Fragen, unklare Anliegen oder Eskalationsszenarien werden mit vollständiger Gesprächszusammenfassung an Sie weitergeleitet – als Nachricht oder in Ihr Verwaltungssystem. Kein Informationsverlust.",
    },
    {
      question: "Kann ich den Assistenten testen, bevor ich mich entscheide?",
      answer: "Ja. Im kostenlosen Erstgespräch zeigen wir den Assistenten live – konfiguriert auf Ihre Praxis, Ihre häufigsten Anrufszenarien und Ihren Kalender. Sie können den Unterschied sofort einschätzen.",
    },
  ],
};

export function KiTelefonassistentPraxis() {
  return <NationalIndustryPage config={config} />;
}
