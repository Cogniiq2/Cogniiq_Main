import { NationalIndustryPage } from "@/components/NationalIndustryPage";
import type { NationalIndustryPageConfig } from "@/components/NationalIndustryPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const config: NationalIndustryPageConfig = {
  seo: {
    title: "Webdesign für Arztpraxen | DSGVO-konforme Praxis-Website | Cogniiq",
    description: "Webdesign für Arztpraxen: DSGVO-konforme Praxis-Website mit Online-Terminbuchung und Local SEO. Mehr Patienten durch bessere Google-Sichtbarkeit. Für Allgemeinmedizin, Fachärzte und Therapeuten.",
    canonical: `${BUSINESS_INFO.website}/webdesign-arzt`,
    keywords: "Webdesign Arztpraxis, Praxis Website, Arzt Homepage, Website Arztpraxis DSGVO, Webdesign Praxis",
  },
  h1: "Webdesign für Arztpraxen & Medizinische Einrichtungen",
  tagline: "Arztpraxis · DSGVO-konform · Online-Terminbuchung",
  intro: "Eine professionelle Praxis-Website stärkt das Patientenvertrauen, reduziert Anrufvolumen und steigert die Sichtbarkeit bei lokalen Suchen wie 'Zahnarzt München'. DSGVO-konform, mobil-optimiert und mit optionaler Terminbuchung.",
  serviceSlug: "leistungen",
  serviceLabel: "Webdesign Leistungen",
  costLink: "/kosten-webdesign",
  costLinkLabel: "Webdesign Kosten",
  problems: [
    {
      title: "Patienten finden die Praxis nicht bei Google",
      description: "Wenn neue Patienten nach 'Arzt [Stadt]' suchen, erscheinen Praxen ohne Local SEO nicht auf Seite 1. Das Potenzial an Neupatienten bleibt ungenutzt.",
    },
    {
      title: "Telefonisches Anfrageaufkommen überlastet das Team",
      description: "Routineanfragen zu Öffnungszeiten, Leistungen und Terminverfügbarkeit belasten das Praxisteam täglich und lenken von der Patientenversorgung ab.",
    },
    {
      title: "Veraltete Website schafft kein Vertrauen",
      description: "Eine veraltete oder unprofessionelle Praxis-Website wirkt auf Patienten abschreckend – noch bevor sie die Praxis betreten haben.",
    },
    {
      title: "Keine Online-Terminbuchung",
      description: "Patienten, die außerhalb der Öffnungszeiten einen Termin buchen möchten, können dies nicht und wechseln zur Konkurrenz.",
    },
    {
      title: "DSGVO-Compliance nicht sichergestellt",
      description: "Praxis-Websites müssen besondere DSGVO-Anforderungen erfüllen. Unvollständige Datenschutzrichtlinien können rechtliche Konsequenzen haben.",
    },
    {
      title: "Keine Patienteninformationen digital verfügbar",
      description: "Informationen zu Leistungen, Vorbereitung auf Untersuchungen und Formulare werden noch postalisch oder telefonisch übermittelt – zeitaufwändig und ineffizient.",
    },
  ],
  solution: {
    headline: "Praxis-Websites, die Vertrauen aufbauen und Patienten entlasten.",
    text: "Cogniiq entwickelt DSGVO-konforme Praxis-Websites mit Online-Terminbuchung, strukturierten Daten für Suchergebnisse und Local SEO-Setup. Das Ergebnis: mehr qualifizierte Neupatienten und weniger Routineanrufe.",
  },
  benefits: [
    "DSGVO-konforme Verarbeitung aller Patientendaten",
    "Online-Terminbuchung rund um die Uhr",
    "Local SEO: gefunden bei 'Arzt [Stadt]'",
    "Praxis-Informationen und Leistungen übersichtlich dargestellt",
    "Digitale Formulare für Neupatienten",
    "Integration KI-Telefonassistent für automatische Terminbuchung",
    "Strukturierte Daten für bessere Google-Darstellung",
  ],
  workflow: {
    title: "Praxis-Website in 3 Schritten",
    steps: [
      {
        step: "Schritt 1",
        title: "DSGVO-Analyse & Konzept",
        description: "Analyse der rechtlichen Anforderungen, Patientenstruktur und lokalen Wettbewerbssituation. Konzept für DSGVO-konforme Website mit optimalem Content.",
      },
      {
        step: "Schritt 2",
        title: "Entwicklung & SEO",
        description: "Individuelle Praxis-Website mit Terminbuchungsintegration, Local SEO Setup, strukturierten Daten und vollständiger DSGVO-Konformität.",
      },
      {
        step: "Schritt 3",
        title: "Go-Live & Betreuung",
        description: "Launch mit vollständiger Dokumentation, optionalem KI-Telefonassistenten und laufender Betreuung für Updates.",
      },
    ],
  },
  cityLinks: [
    { label: "Webdesign Arzt Bayreuth", href: "/webdesign-arzt-bayreuth" },
    { label: "Webdesign Arzt München", href: "/webdesign-arzt-muenchen" },
    { label: "Webdesign Arzt Regensburg", href: "/webdesign-arzt-regensburg" },
    { label: "Webdesign Bayern", href: "/bayern" },
    { label: "Webdesign Deutschland", href: "/webdesign-agentur-deutschland" },
  ],
  relatedLinks: [
    { label: "KI Telefonassistent Arzt", href: "/ki-telefonassistent-arzt" },
    { label: "KI Telefonassistent Praxis", href: "/ki-telefonassistent-praxis" },
    { label: "Automatisierung Arzt", href: "/automatisierung-arzt" },
    { label: "Kosten Webdesign", href: "/kosten-webdesign" },
    { label: "Webdesign Immobilien", href: "/webdesign-immobilien" },
  ],
  faq: [
    {
      question: "Welche DSGVO-Anforderungen gelten für Praxis-Websites?",
      answer: "Praxis-Websites benötigen eine vollständige Datenschutzerklärung, DSGVO-konformes Cookie-Consent, sichere Formularübertragung (SSL), und bei Terminbuchungstools einen Auftragsverarbeitungsvertrag (AVV). Cogniiq liefert alle Komponenten.",
    },
    {
      question: "Kann eine Praxis-Website Terminbuchungen automatisieren?",
      answer: "Ja. Wir integrieren Terminbuchungssysteme, die mit Ihrem Praxiskalender synchronisiert sind. Patienten können online Termine buchen – auch nachts und am Wochenende.",
    },
    {
      question: "Wie lange dauert die Entwicklung einer Praxis-Website?",
      answer: "Einfache Praxis-Websites sind in 2–3 Wochen fertig. Mit Terminbuchungssystem und erweitertem SEO-Setup typischerweise 4–6 Wochen.",
    },
    {
      question: "Was kostet eine Praxis-Website?",
      answer: "Praxis-Websites beginnen bei ca. 2.000 €. Mit Terminbuchungsintegration und DSGVO-konformem Setup typischerweise 3.000–5.000 €. Genaues Angebot nach kostenlosem Erstgespräch.",
    },
    {
      question: "Können mehrere Ärzte oder Standorte abgebildet werden?",
      answer: "Ja. Gemeinschaftspraxen, MVZ oder Praxen mit mehreren Standorten werden vollständig abgebildet – inkl. individueller SEO-Seiten je Standort.",
    },
  ],
};

export function WebdesignArzt() {
  return <NationalIndustryPage config={config} />;
}
