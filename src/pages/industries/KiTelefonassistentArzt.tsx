import { NationalIndustryPage } from "@/components/NationalIndustryPage";
import type { NationalIndustryPageConfig } from "@/components/NationalIndustryPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const config: NationalIndustryPageConfig = {
  seo: {
    title: "KI Telefonassistent für Arztpraxen | Automatische Terminbuchung | Cogniiq",
    description: "KI Telefonassistent für Arztpraxen: Automatische Terminbuchung, Patientenanfragen und Standardauskünfte. DSGVO-konform mit AVV, 24/7 erreichbar – Entlastung für das Praxisteam ab Tag 1.",
    canonical: `${BUSINESS_INFO.website}/ki-telefonassistent-arzt`,
    keywords: "KI Telefonassistent Arztpraxis, Praxis Telefonservice, automatische Terminbuchung Arzt, KI Rezeptionistin Praxis",
  },
  h1: "KI Telefonassistent für Arztpraxen",
  tagline: "Arztpraxis · Terminbuchung · DSGVO-konform",
  intro: "Montagmorgen, sieben Minuten nach acht: Die Praxis öffnet, und sofort klingelt das Telefon im Dauerbetrieb. Ihr Team sitzt gleichzeitig am Empfang, an der Kasse und im Behandlungsraum. Anrufe, die ins Leere laufen, landen beim nächsten Arzt in der Liste. Der KI Telefonassistent nimmt ab – sofort, in natürlicher Sprache, DSGVO-konform – und bucht den Termin direkt in Ihren Kalender.",
  serviceSlug: "ki-telefonassistent",
  serviceLabel: "KI Telefonassistent",
  costLink: "/kosten-ki-telefonassistent",
  costLinkLabel: "Kosten KI Telefonassistent",
  problems: [
    {
      title: "Montagmorgen-Stoßzeit überfordert jede Praxis",
      description: "Nach dem Wochenende stapeln sich Terminanfragen, Rezeptnachrichten und Rückrufe. Selbst gut organisierte Praxen kommen in dieser Stunde nicht mit – und Patienten, die nicht durchkommen, wählen die nächste erreichbare Praxis.",
    },
    {
      title: "Medizinisch ausgebildetes Personal beantwortet Öffnungszeiten-Fragen",
      description: "Wann öffnet die Praxis? Welche Kasse wird akzeptiert? Gibt es Parkplätze? Diese Fragen stellen Patienten täglich und binden qualifiziertes Personal, das gerade im Behandlungsraum gebraucht wird.",
    },
    {
      title: "Abends und zwischen den Sprechzeiten ist niemand erreichbar",
      description: "Ein Patient mit einer dringenden Frage um 18 Uhr landet auf der Mailbox. Beim nächsten Termin ist er nicht mehr Ihr Patient. Erreichbarkeit außerhalb der Sprechzeiten ist heute kein Luxus mehr – es ist der Mindeststandard.",
    },
    {
      title: "Jeder verpasste Anruf ist eine leere Stelle im Kalender",
      description: "In einer Praxis mit 40 Terminen täglich entspricht ein einziger verpasster Anruf direktem Umsatzverlust. Der Assistent stellt sicher, dass keine Anfrage unbeantwortet bleibt – auch nicht in der Mittagspause.",
    },
    {
      title: "Patientendaten ohne dokumentiertes System – rechtlich riskant",
      description: "Wer Patientendaten am Telefon entgegennimmt und in einem Notizblock festhält, bewegt sich datenschutzrechtlich auf unsicherem Terrain. Der KI Telefonassistent dokumentiert jede Interaktion strukturiert und DSGVO-konform.",
    },
    {
      title: "Gemeinschaftspraxen: mehrere Ärzte, ein überfordertes Team",
      description: "In Gemeinschaftspraxen und MVZ multipliziert sich das Koordinationsproblem: mehrere Kalender, verschiedene Behandlungsräume, unterschiedliche Verfügbarkeiten. Der Assistent kennt sie alle und vergibt Termine korrekt – ohne Rückfragen.",
    },
  ],
  solution: {
    headline: "Ihr Team behandelt Patienten. Der Assistent erledigt den Rest.",
    text: "Der KI Telefonassistent übernimmt eingehende Anrufe vollautomatisch: Er bucht Termine direkt in den Praxiskalender, beantwortet Standardfragen präzise nach Ihren Vorgaben und leitet medizinisch komplexe Anfragen mit vollständiger Gesprächszusammenfassung ans Team weiter. DSGVO-konform eingerichtet – ohne IT-Aufwand Ihrer Seite.",
  },
  benefits: [
    "Terminbuchung direkt in den Praxiskalender – kein Rückruf nötig",
    "Vollständig DSGVO-konform mit AVV auf deutschen Servern",
    "24/7 erreichbar – auch zwischen Sprechzeiten und im Urlaub",
    "Notfall-Eskalation konfigurierbar für Ihren Bereitschaftsdienst",
    "Integriert mit Tomedo, Medistar, Dampsoft und anderen Systemen",
    "Ein Assistent für mehrere Ärzte und Behandlungsräume",
    "Eingerichtet in 7–14 Tagen, laufender Betrieb bleibt unberührt",
  ],
  workflow: {
    title: "So läuft ein Patientenanruf ab",
    steps: [
      {
        step: "01",
        title: "Patient ruft an",
        description: "Der Assistent nimmt innerhalb von zwei Sekunden ab – kein Besetztzeichen, keine Warteschleife. Er begrüßt den Patienten professionell und erfragt das Anliegen in natürlicher Sprache.",
      },
      {
        step: "02",
        title: "Anliegen erkennen und bearbeiten",
        description: "Terminwunsch, Rezeptanfrage, Frage zu Öffnungszeiten oder Kassenakzeptanz – jedes Anliegen wird korrekt erkannt und nach Ihren Vorgaben direkt bearbeitet.",
      },
      {
        step: "03",
        title: "Termin eingetragen, Patient informiert",
        description: "Der Termin wird in Echtzeit in den Kalender eingetragen. Der Patient bekommt sofortige Bestätigung – und 24 Stunden vorher eine automatische Erinnerung.",
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
      question: "Ist der KI Telefonassistent für Arztpraxen wirklich DSGVO-konform?",
      answer: "Ja – und das ist keine Fußnote. Arztpraxen unterliegen besonders strengen Datenschutzanforderungen. Der Assistent verarbeitet alle Daten ausschließlich auf deutschen Servern, wird mit einem Auftragsverarbeitungsvertrag (AVV) geliefert und lässt sich so konfigurieren, dass medizinisch sensible Informationen nicht unverschlüsselt übertragen werden.",
    },
    {
      question: "Kann der Assistent in unser Praxisverwaltungssystem integriert werden?",
      answer: "In den meisten Fällen ja. Wir integrieren direkt in Tomedo, Medistar, Dampsoft, CGM und andere gängige Systeme. Die technische Integration übernimmt Cogniiq vollständig – Ihre Praxis muss dafür nichts einrichten oder umstellen.",
    },
    {
      question: "Was passiert, wenn ein Patient einen medizinischen Notfall schildert?",
      answer: "Der Assistent erkennt Notfallsituationen zuverlässig und leitet sofort an den Notruf (112) oder den konfigurierten Bereitschaftsarzt weiter. Die Eskalationslogik wird individuell für Ihre Praxis definiert – inklusive klarer Sprachausgabe mit Handlungsanweisungen für den Patienten.",
    },
    {
      question: "Wie viele Anrufe übernimmt der Assistent pro Tag?",
      answer: "In einer durchschnittlichen Allgemeinpraxis zwischen 30 und 80 Anrufe täglich – in Gemeinschaftspraxen oder nach Feiertagen deutlich mehr. Jeder dieser Anrufe würde sonst Ihre MFA für 3–5 Minuten aus dem direkten Patientenkontakt herausnehmen.",
    },
    {
      question: "Können wir Öffnungszeiten und Urlaubszeiten selbst anpassen?",
      answer: "Ja. Öffnungszeiten, Urlaubsblockierungen und aktuelle Praxisinfos pflegen Sie selbst in einem einfachen Dashboard – ohne technische Kenntnisse. Komplexere Anpassungen an Gesprächslogik oder Kalenderregeln übernehmen wir.",
    },
  ],
};

export function KiTelefonassistentArzt() {
  return <NationalIndustryPage config={config} />;
}
