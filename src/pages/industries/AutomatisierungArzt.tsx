import { NationalIndustryPage } from "@/components/NationalIndustryPage";
import type { NationalIndustryPageConfig } from "@/components/NationalIndustryPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const config: NationalIndustryPageConfig = {
  seo: {
    title: "Automatisierung für Arztpraxen & Praxisverwaltung | Cogniiq",
    description: "Praxisautomatisierung: Terminbestätigungen, Patientenerinnerungen und Rezeptanfragen laufen vollautomatisch – DSGVO-konform, ohne zusätzliches Personal. Mehr Zeit für Ihre Patienten.",
    canonical: `${BUSINESS_INFO.website}/automatisierung-arzt`,
    keywords: "Automatisierung Arztpraxis, Praxis Digitalisierung, Patientenkommunikation automatisieren, Praxisverwaltung Automatisierung",
  },
  h1: "Automatisierung für Arztpraxen & Praxisverwaltung",
  tagline: "Arztpraxis · Routineprozesse · DSGVO-konform",
  intro: "Jeden Morgen dasselbe: Terminbestätigungen rausschicken, Rezeptanfragen entgegennehmen, Erinnerungen verschicken, Wartelisten manuell abarbeiten. Jede dieser Aufgaben ist notwendig – aber keine davon braucht einen Menschen. Cogniiq automatisiert diese Routinen vollständig und DSGVO-konform, damit Ihr Team sich auf das konzentriert, was wirklich zählt.",
  serviceSlug: "leistungen",
  serviceLabel: "Automatisierung Leistungen",
  costLink: "/kosten-automatisierung",
  costLinkLabel: "Automatisierung Kosten",
  problems: [
    {
      title: "Terminbestätigungen binden täglich Stunden",
      description: "Jeden Termin einzeln bestätigen, erinnern und bei Absagen nachfassen: In einer mittelgroßen Praxis kostet das 1–2 Stunden pro Tag – ohne jeden medizinischen Mehrwert.",
    },
    {
      title: "Rezeptanfragen kommen per Telefon, gehen im Alltag unter",
      description: "Patienten rufen wegen Wiederholungsrezepten an, hinterlassen Nachrichten, die erst am nächsten Tag bearbeitet werden. Strukturierte digitale Anfragen mit automatischer Weiterleitung lösen das dauerhaft.",
    },
    {
      title: "Warteliste wird manuell abgearbeitet – oft zu spät",
      description: "Wenn ein Termin ausfällt, müsste sofort die Warteliste kontaktiert werden. Manuell passiert das mit Verzögerung oder gar nicht. Der Slot bleibt leer, obwohl Bedarf da ist.",
    },
    {
      title: "Patientendaten zwischen Systemen manuell synchronisiert",
      description: "Praxisverwaltung, Online-Terminbuchung und Kommunikationstool sprechen nicht miteinander. Das Ergebnis: Doppelerfassungen, Inkonsistenzen und unnötige Korrekturen.",
    },
    {
      title: "Überweisungen und Befunde ohne nachvollziehbares Tracking",
      description: "Überweisungen anfragen, Rückmeldungen abwarten, Patienten informieren – ein manueller Kommunikationskreislauf, der leicht in Vergessenheit gerät und Zeit kostet.",
    },
    {
      title: "Bewertungen entstehen nicht von selbst",
      description: "Zufriedene Patienten denken nicht automatisch daran, eine Google-Bewertung zu hinterlassen. Ein automatisierter, freundlicher Follow-up nach dem Termin erhöht die Bewertungsrate messbar – ohne aktives Zutun.",
    },
  ],
  solution: {
    headline: "Weniger Verwaltung. Mehr Versorgung.",
    text: "Cogniiq automatisiert die Routineprozesse Ihrer Praxis vollständig: Terminbestätigungen, Erinnerungen, Rezeptanfragen, Wartelistenkontakt und Follow-ups laufen ohne manuellen Aufwand. Das Ergebnis: ein entlastetes Team, weniger Fehler und Patienten, die besser informiert sind.",
  },
  benefits: [
    "Terminbestätigung und Erinnerung vollautomatisch",
    "Warteliste wird bei Absagen sofort automatisch kontaktiert",
    "Rezeptanfragen digital strukturiert und weitergeleitet",
    "Patientendaten systemübergreifend synchronisiert",
    "DSGVO-konforme Verarbeitung mit AVV auf deutschen Servern",
    "Bewertungsanfragen nach jedem Termin automatisch versandt",
    "Einrichtung in 2–4 Wochen, ohne Praxisunterbrechung",
  ],
  workflow: {
    title: "So läuft ein automatisierter Praxis-Tag",
    steps: [
      {
        step: "01",
        title: "Termin gebucht",
        description: "Ob über die Website, das Telefon oder den KI-Assistenten – der Termin wird sofort bestätigt, in alle Systeme eingetragen und die Erinnerungssequenz gestartet.",
      },
      {
        step: "02",
        title: "Automatische Kommunikation",
        description: "Bestätigung sofort, Terminerinnerung 24 Stunden vorher, Hinweise auf mitzubringende Unterlagen – alles ohne einen einzigen manuellen Schritt.",
      },
      {
        step: "03",
        title: "Nachbereitung & Feedback",
        description: "Nach dem Besuch: automatischer Follow-up, Bewertungsanfrage und bei Absagen sofortiger Wartelistenkontakt. Keine Lücken, keine vergessenen Schritte.",
      },
    ],
  },
  cityLinks: [
    { label: "Automatisierung Bayreuth", href: "/bayreuth/automatisierung" },
    { label: "Automatisierung München", href: "/muenchen/automatisierung" },
    { label: "Automatisierung Regensburg", href: "/regensburg/automatisierung" },
    { label: "Automatisierung Bayern", href: "/bayern" },
    { label: "Automatisierung Deutschland", href: "/automatisierung-unternehmen" },
  ],
  relatedLinks: [
    { label: "KI Telefonassistent Arzt", href: "/ki-telefonassistent-arzt" },
    { label: "KI Telefonassistent Praxis", href: "/ki-telefonassistent-praxis" },
    { label: "Webdesign Arzt", href: "/webdesign-arzt" },
    { label: "Kosten Automatisierung", href: "/kosten-automatisierung" },
    { label: "Automatisierung Restaurant", href: "/automatisierung-restaurant" },
  ],
  faq: [
    {
      question: "Ist Praxisautomatisierung wirklich DSGVO-konform?",
      answer: "Ja – und das ist für uns keine Selbstverständlichkeit, sondern Grundbedingung. Cogniiq arbeitet ausschließlich mit DSGVO-konformen Tools auf deutschen bzw. europäischen Servern. Jede Automatisierung wird mit einem Auftragsverarbeitungsvertrag (AVV) geliefert. Patientendaten verlassen niemals die vereinbarten Systeme.",
    },
    {
      question: "Funktioniert die Automatisierung mit unserer bestehenden Praxissoftware?",
      answer: "In den meisten Fällen ja. Wir analysieren zunächst Ihre bestehende Systemlandschaft und entwickeln passende Integrationen. Gängige Systeme wie Tomedo, Medistar, Dampsoft oder CGM werden direkt unterstützt. Wo keine direkte API existiert, bauen wir zuverlässige Übergabepunkte.",
    },
    {
      question: "Was kostet Praxisautomatisierung?",
      answer: "Einzelne Workflows wie Terminbestätigungen beginnen bei ca. 600–1.200 €. Umfassende Praxisautomatisierungen mit Systemintegration, Wartelistenmanagement und Follow-up-Sequenzen typischerweise 2.000–4.500 €. Das genaue Angebot erhalten Sie nach einem kostenlosen Erstgespräch.",
    },
    {
      question: "Wie lange dauert die Einrichtung – und merken unsere Patienten etwas davon?",
      answer: "Einfache Workflows sind in 1–2 Wochen live. Komplexere Setups dauern 3–6 Wochen. Die Umstellung läuft im Hintergrund – Patienten bemerken ausschließlich, dass Kommunikation schneller und zuverlässiger wird.",
    },
    {
      question: "Können wir die Automatisierungen nach der Einrichtung selbst anpassen?",
      answer: "Ja. Sie erhalten vollständige Dokumentation und eine kurze Einweisung. Texte, Zeitpunkte und einfache Anpassungen können Sie selbst vornehmen – ohne technische Kenntnisse. Für komplexere Änderungen stehen wir zur Verfügung.",
    },
  ],
};

export function AutomatisierungArzt() {
  return <NationalIndustryPage config={config} />;
}
