import { NationalIndustryPage } from "@/components/NationalIndustryPage";
import type { NationalIndustryPageConfig } from "@/components/NationalIndustryPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const config: NationalIndustryPageConfig = {
  seo: {
    title: "Automatisierung für Arztpraxen | Erinnerungen, Warteliste & Kommunikation – Cogniiq",
    description: "Praxisautomatisierung: Terminbestätigungen, Patientenerinnerungen und Rezeptanfragen laufen automatisch – ohne zusätzliches Personal. Mehr Zeit für Ihre Patienten.",
    canonical: `${BUSINESS_INFO.website}/automatisierung-arzt`,
    keywords: "Automatisierung Arztpraxis, Praxis Digitalisierung, Patientenkommunikation automatisieren, Praxisverwaltung Automatisierung",
  },
  h1: "Automatisierung für Arztpraxen & Praxisverwaltung",
  tagline: "Arztpraxis · Routineprozesse · Persönliche Betreuung",
  intro: "Jeden Morgen dasselbe: Terminbestätigungen rausschicken, Rezeptanfragen entgegennehmen, Erinnerungen verschicken, Wartelisten manuell abarbeiten. Jede dieser Aufgaben ist notwendig – aber kaum eine braucht durchgehend einen Menschen. Cogniiq automatisiert diese Routinen dort, wo sie sich in feste Regeln fassen lassen, damit Ihr Team sich auf das konzentriert, was wirklich zählt.",
  serviceSlug: "leistungen",
  serviceLabel: "Automatisierung Leistungen",
  costLink: "/kosten-automatisierung",
  costLinkLabel: "Automatisierung Kosten",
  problems: [
    {
      title: "Terminbestätigungen binden täglich Stunden",
      description: "Jeden Termin einzeln bestätigen, erinnern und bei Absagen nachfassen: In einer mittelgroßen Praxis kostet das täglich spürbar Zeit – ohne jeden medizinischen Mehrwert.",
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
      description: "Die wenigsten Patienten denken nach dem Termin daran, eine Bewertung zu hinterlassen. Ein automatisierter, freundlicher Follow-up macht es ihnen leichter.",
    },
  ],
  solution: {
    headline: "Weniger Verwaltung. Mehr Versorgung.",
    text: "Cogniiq automatisiert die regelbasierten Routineprozesse Ihrer Praxis: Terminbestätigungen, Erinnerungen, Rezeptanfragen, Wartelistenkontakt und Follow-ups laufen ohne Handarbeit – mit einem Menschen genau an den Stellen, die eine Entscheidung brauchen. Das Ziel: ein entlastetes Team und Patienten, die rechtzeitig informiert sind.",
  },
  benefits: [
    "Terminbestätigung und Erinnerung automatisch",
    "Warteliste wird bei Absagen sofort automatisch kontaktiert",
    "Rezeptanfragen digital strukturiert und weitergeleitet",
    "Daten zwischen angebundenen Systemen abgeglichen – soweit deren Schnittstellen das tragen",
    "Verarbeitung mit Auftragsverarbeitungsvertrag",
    "Bewertungsanfragen nach jedem Termin automatisch versandt",
    "Einrichtung im laufenden Betrieb, Zeitplan nach der Analyse",
  ],
  workflow: {
    title: "So läuft ein automatisierter Praxis-Tag",
    steps: [
      {
        step: "01",
        title: "Termin gebucht",
        description: "Ob über die Website, das Telefon oder den KI-Assistenten – der Termin wird bestätigt, in die angebundenen Systeme eingetragen und die Erinnerungssequenz gestartet.",
      },
      {
        step: "02",
        title: "Automatische Kommunikation",
        description: "Bestätigung sofort, Terminerinnerung 24 Stunden vorher, Hinweise auf mitzubringende Unterlagen – alles ohne einen einzigen manuellen Schritt.",
      },
      {
        step: "03",
        title: "Nachbereitung & Feedback",
        description: "Nach dem Besuch: automatischer Follow-up, Bewertungsanfrage und bei Absagen sofortiger Wartelistenkontakt. Jeder Schritt ist protokolliert; was nicht automatisch läuft, landet als Aufgabe beim Team.",
      },
    ],
  },
  cityLinks: [
    { label: "Automatisierung Bayreuth", href: "/bayreuth/automatisierung" },
    { label: "Automatisierung München", href: "/muenchen/automatisierung" },
    { label: "Automatisierung Regensburg", href: "/regensburg/automatisierung" },
    { label: "Automatisierung Bayern", href: "/bayern" },
    { label: "Automatisierung Deutschland", href: "/prozessautomatisierung" },
  ],
  relatedLinks: [
    // Der Pillar der Automatisierungs-Intention, den die Branchenseiten bis
    // 2026-09-12 nirgends kontextuell verlinkt haben (docs/seo/ARCHITEKTUR.md).
    { label: "Prozessautomatisierung", href: "/prozessautomatisierung" },
    { label: "KI Telefonassistent Arzt", href: "/ki-telefonassistent-arzt" },
    { label: "KI Telefonassistent Praxis", href: "/ki-telefonassistent-praxis" },
    { label: "Webdesign Arzt", href: "/webdesign-arzt" },
    { label: "Kosten Automatisierung", href: "/kosten-automatisierung" },
    { label: "KI-Telefonassistent Zahnarztpraxis", href: "/ki-telefonassistent-zahnarztpraxis" },
  ],
  faq: [
    {
      question: "Wie ist der Datenschutz bei der Praxisautomatisierung geregelt?",
      answer: "Jede Automatisierung wird mit einem Auftragsverarbeitungsvertrag (AVV) geliefert, und Patientendaten verlassen die vereinbarten Systeme nicht. Zum Verarbeitungsort machen wir derzeit keine Angabe — die Verträge mit den beteiligten Anbietern sind nicht abschließend unterzeichnet. Ob der konkrete Einsatz in Ihrer Praxis den Anforderungen genügt, beurteilt Ihr Datenschutzbeauftragter – wir liefern ihm die Unterlagen dafür zu.",
    },
    {
      question: "Funktioniert die Automatisierung mit unserer bestehenden Praxissoftware?",
      answer: "Das prüfen wir vor dem Angebot, statt es vorab zu versprechen. Eine Liste unterstützter Systeme führen wir bewusst nicht — sie wäre entweder unvollständig oder unehrlich. Stattdessen nehmen wir Ihre Praxissoftware im Erstgespräch auf und prüfen: ob eine geeignete Schnittstelle existiert, ob Zugang oder Freigabe erreichbar ist, welche Vorgänge sie zulässt und ob Dritte dafür Gebühren berechnen. Trägt das, binden wir Ihr System direkt an. Trägt es nicht, legen wir den Übergabeweg fest. Das Ergebnis steht im Angebot, mit allen dafür bekannten Kosten für den vereinbarten Umfang, bevor Sie unterschreiben.",
    },
    {
      question: "Was kostet Praxisautomatisierung?",
      answer: "Das hängt davon ab, wie viele Abläufe angebunden werden und welche Schnittstellen Ihre Praxissoftware bietet. Was den Preis treibt und wie wir rechnen, steht auf der Kostenseite zur Automatisierung; das Angebot erhalten Sie nach einem kostenlosen Erstgespräch – als Betrag, nicht als Spanne.",
    },
    {
      question: "Wie lange dauert die Einrichtung – und merken unsere Patienten etwas davon?",
      answer: "Den Zeitplan legen wir nach der Analyse fest; er hängt an den beteiligten Systemen. Die Umstellung läuft im laufenden Praxisbetrieb; für Patienten ändert sich die Art der Nachrichten, nicht der Ansprechpartner.",
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
