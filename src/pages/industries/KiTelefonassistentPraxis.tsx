import { NationalIndustryPage } from "@/components/NationalIndustryPage";
import type { NationalIndustryPageConfig } from "@/components/NationalIndustryPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const config: NationalIndustryPageConfig = {
  seo: {
    title: "KI Telefonassistent für Therapeuten & Praxen | Automatisierte Terminbuchung | Cogniiq",
    description: "KI Telefonassistent für Therapeuten, Physio- und Logopädiepraxen: Automatische Terminbuchung, Patientenkommunikation und Praxisentlastung. DSGVO-konform.",
    canonical: `${BUSINESS_INFO.website}/ki-telefonassistent-praxis`,
    keywords: "KI Telefonassistent Praxis, Physiotherapie Telefonservice, Terminbuchung Therapeut, KI Rezeptionistin Therapiepraxis",
  },
  h1: "KI Telefonassistent für Therapeuten & Praxen",
  tagline: "Therapeuten · Terminbuchung · Praxisentlastung",
  intro: "Während Sie behandeln, klingelt das Telefon – und niemand kann abnehmen. Patienten, die keinen Termin bekommen, wechseln zum nächsten Therapeuten. Der KI Telefonassistent nimmt Terminanfragen sofort entgegen, bucht direkt in Ihren Kalender und entlastet Ihr Team von Routinekommunikation.",
  serviceSlug: "ki-telefonassistent",
  serviceLabel: "KI Telefonassistent",
  costLink: "/kosten-ki-telefonassistent",
  costLinkLabel: "Kosten KI Telefonassistent",
  problems: [
    {
      title: "Anrufe kommen während der Behandlung",
      description: "Im Behandlungsraum kann niemand ans Telefon. Patienten, die einen Termin wollen, wählen beim nächsten erreichbaren Therapeuten.",
    },
    {
      title: "Terminkoordination frisst Verwaltungszeit",
      description: "Folgetermine, Absagen und Umplanungen per Telefon koordinieren – das kostet täglich wertvolle Stunden, die für die Therapie fehlen.",
    },
    {
      title: "No-Shows erhöhen sich ohne Erinnerungen",
      description: "Patienten ohne Terminerinnerung erscheinen seltener. Jeder unbesetzte Termin ist direkter Umsatzverlust, der sich mit automatischen Erinnerungen verhindern lässt.",
    },
    {
      title: "Keine Erreichbarkeit außerhalb der Öffnungszeiten",
      description: "Patienten, die abends oder am Wochenende einen Folgetermin buchen wollen, erreichen niemanden und rufen bei einem anderen Therapeuten an.",
    },
    {
      title: "DSGVO-Anforderungen bei Patientenkommunikation",
      description: "Therapeuten müssen Patientendaten rechtssicher verarbeiten. Ohne strukturiertes System und AVV entstehen vermeidbare rechtliche Risiken.",
    },
    {
      title: "Rezeptanfragen und Routinekommunikation",
      description: "Wiederholte Anfragen zu Rezepten, Überweisungen und Folgeterminen belasten das Team täglich – obwohl sie vollständig automatisierbar sind.",
    },
  ],
  solution: {
    headline: "Mehr Zeit für Therapie – weniger Zeit am Telefon.",
    text: "Der KI Telefonassistent übernimmt Terminannahme, Bestätigung und Erinnerungen vollautomatisch. Das Team konzentriert sich auf die Behandlung – und Patienten werden nie abgewiesen, weil niemand ans Telefon geht.",
  },
  benefits: [
    "Automatische Terminbuchung und -bestätigung",
    "Erinnerungen vor Terminen – No-Shows messbar reduziert",
    "DSGVO-konform – Patientendaten auf deutschen Servern",
    "24/7 erreichbar für Terminanfragen",
    "Entlastung des Teams von Routinekommunikation",
    "Integration mit Praxisverwaltungssystemen",
    "Folgetermine automatisch koordiniert",
  ],
  workflow: {
    title: "So läuft ein Terminanruf in der Therapeutenpraxis ab",
    steps: [
      {
        step: "01",
        title: "Patient ruft an",
        description: "Der Assistent nimmt sofort ab – auch während alle Behandlungsräume belegt sind. Kein verpasster Anruf, keine Warteschleife.",
      },
      {
        step: "02",
        title: "Termin prüfen und buchen",
        description: "Freie Termine werden in Echtzeit geprüft und dem Patienten vorgeschlagen. Nach Bestätigung wird der Termin direkt eingetragen.",
      },
      {
        step: "03",
        title: "Bestätigen und erinnern",
        description: "Sofortige Buchungsbestätigung und automatische Erinnerung 24 Stunden vorher – No-Shows werden zuverlässig reduziert.",
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
      answer: "Physiotherapeuten, Logopäden, Ergotherapeuten, Psychotherapeuten und Heilpraktiker profitieren besonders, da Terminkoordination einen erheblichen Teil ihrer Verwaltungszeit ausmacht.",
    },
    {
      question: "Ist der Assistent DSGVO-konform für Patientendaten?",
      answer: "Ja. Alle Daten werden auf deutschen Servern verarbeitet. Der Assistent wird mit einem Auftragsverarbeitungsvertrag (AVV) geliefert – vollständig rechtssicher für den Einsatz in Therapiepraxen.",
    },
    {
      question: "Kann der Assistent Folgetermine automatisch einplanen?",
      answer: "Ja. Nach einer Behandlung kann der Assistent automatisch Folgetermine anbieten und einplanen – nach den Regeln und Zeitfenstern, die Sie vorgeben.",
    },
    {
      question: "Kann ich den Assistenten testen, bevor ich mich entscheide?",
      answer: "Ja. Im kostenlosen Erstgespräch demonstrieren wir den Assistenten live – konfiguriert auf Ihre Praxis und Ihre häufigsten Anrufszenarien.",
    },
    {
      question: "Wie schnell ist der Assistent einsatzbereit?",
      answer: "In den meisten Fällen innerhalb von 7–14 Tagen – ohne IT-Aufwand auf Ihrer Seite. Cogniiq übernimmt Konfiguration und Integration vollständig.",
    },
  ],
};

export function KiTelefonassistentPraxis() {
  return <NationalIndustryPage config={config} />;
}
