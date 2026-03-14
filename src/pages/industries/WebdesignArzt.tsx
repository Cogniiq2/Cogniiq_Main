import { NationalIndustryPage } from "@/components/NationalIndustryPage";
import type { NationalIndustryPageConfig } from "@/components/NationalIndustryPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const config: NationalIndustryPageConfig = {
  seo: {
    title: "Webdesign für Arztpraxen | DSGVO-konforme Praxis-Website | Cogniiq",
    description: "Webdesign für Arztpraxen: DSGVO-konforme Praxis-Website mit Online-Terminbuchung und Local SEO. Mehr Patienten durch bessere Google-Sichtbarkeit – für Allgemeinmedizin, Fachärzte und Therapeuten.",
    canonical: `${BUSINESS_INFO.website}/webdesign-arzt`,
    keywords: "Webdesign Arztpraxis, Praxis Website, Arzt Homepage, Website Arztpraxis DSGVO, Webdesign Praxis",
  },
  h1: "Webdesign für Arztpraxen & Medizinische Einrichtungen",
  tagline: "Arztpraxis · DSGVO-konform · Online-Terminbuchung",
  intro: "Neue Patienten entscheiden sich heute zuerst online für eine Praxis – und oft schon vor dem ersten Anruf. Eine professionelle Praxis-Website stärkt Vertrauen, reduziert Anrufvolumen durch Online-Buchung und sorgt dafür, dass Sie bei lokalen Suchen wie 'Arzt München' auf Seite 1 erscheinen.",
  serviceSlug: "leistungen",
  serviceLabel: "Webdesign Leistungen",
  costLink: "/kosten-webdesign",
  costLinkLabel: "Webdesign Kosten",
  problems: [
    {
      title: "Neue Patienten finden die Praxis bei Google nicht",
      description: "Wer nach 'Arzt [Stadt]' sucht, findet Praxen ohne Local SEO auf Seite 2 oder gar nicht. Das Potenzial an Neupatienten bleibt vollständig ungenutzt.",
    },
    {
      title: "Telefonanfragen überlasten das Praxisteam",
      description: "Routineanfragen zu Öffnungszeiten, Leistungen und Terminverfügbarkeit nehmen Praxismitarbeiterinnen täglich stundenlang in Anspruch – Zeit, die für Patienten fehlt.",
    },
    {
      title: "Veraltete Website schafft kein Vertrauen",
      description: "Patienten entscheiden sich bewusst oder unbewusst gegen eine Praxis, deren Website veraltet oder unprofessionell wirkt – noch bevor sie einen Fuß in die Praxis setzen.",
    },
    {
      title: "Keine Online-Terminbuchung verfügbar",
      description: "Patienten, die abends oder am Wochenende einen Termin buchen möchten, können das nicht – und buchen in der nächsten Praxis, die Online-Buchung anbietet.",
    },
    {
      title: "DSGVO-Konformität nicht vollständig sichergestellt",
      description: "Praxis-Websites unterliegen besonderen datenschutzrechtlichen Anforderungen. Unvollständige Datenschutzrichtlinien und fehlende AVV sind rechtliche Risiken.",
    },
    {
      title: "Patienteninformationen fehlen oder sind unstrukturiert",
      description: "Leistungsübersichten, Vorbereitungshinweise und Formulare noch postalisch oder telefonisch bereitzustellen kostet Zeit – und wirkt unprofessionell.",
    },
  ],
  solution: {
    headline: "Praxis-Websites, die Vertrauen aufbauen und Patienten entlasten.",
    text: "Cogniiq entwickelt DSGVO-konforme Praxis-Websites mit Online-Terminbuchung, Local SEO-Setup und strukturierten Daten für bessere Google-Darstellung. Das Ergebnis: mehr qualifizierte Neupatienten und deutlich weniger Routineanrufe.",
  },
  benefits: [
    "DSGVO-konforme Verarbeitung aller Patientendaten",
    "Online-Terminbuchung rund um die Uhr",
    "Local SEO: gefunden bei 'Arzt [Stadt]'",
    "Praxis-Leistungen klar und vertrauenswürdig dargestellt",
    "Digitale Formulare für Neupatienten",
    "Integration KI-Telefonassistent für automatische Terminbuchung",
    "Strukturierte Daten für bessere Darstellung in Google",
  ],
  workflow: {
    title: "Praxis-Website in drei klar definierten Phasen",
    steps: [
      {
        step: "01",
        title: "DSGVO-Analyse & Konzept",
        description: "Analyse der rechtlichen Anforderungen, Patientenstruktur und lokalen Wettbewerbssituation. Konzept für eine DSGVO-konforme Website mit optimalem Informationsaufbau.",
      },
      {
        step: "02",
        title: "Entwicklung & SEO",
        description: "Individuelle Praxis-Website mit Terminbuchungsintegration, Local SEO-Setup, strukturierten Daten und vollständiger DSGVO-Konformität.",
      },
      {
        step: "03",
        title: "Go-Live & Betreuung",
        description: "Launch mit vollständiger Dokumentation, optionalem KI-Telefonassistenten und laufender Betreuung für Updates und Anpassungen.",
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
      answer: "Praxis-Websites benötigen eine vollständige Datenschutzerklärung, DSGVO-konformes Cookie-Consent, gesicherte Formularübertragung (SSL) und bei Terminbuchungstools einen Auftragsverarbeitungsvertrag (AVV). Cogniiq liefert alle Komponenten vollständig.",
    },
    {
      question: "Kann eine Praxis-Website Terminbuchungen automatisieren?",
      answer: "Ja. Wir integrieren Terminbuchungssysteme, die mit Ihrem Praxiskalender synchronisiert sind. Patienten können online Termine buchen – auch abends und am Wochenende.",
    },
    {
      question: "Wie lange dauert die Entwicklung einer Praxis-Website?",
      answer: "Einfache Praxis-Websites sind in 2–3 Wochen fertig. Mit Terminbuchungssystem und erweitertem SEO-Setup typischerweise 4–6 Wochen – ohne Unterbrechung des Praxisbetriebs.",
    },
    {
      question: "Was kostet eine Praxis-Website?",
      answer: "Praxis-Websites beginnen bei ca. 2.000 €. Mit Terminbuchungsintegration und DSGVO-Setup typischerweise 3.000–5.000 €. Ein genaues Angebot erhalten Sie im kostenlosen Erstgespräch.",
    },
    {
      question: "Können mehrere Ärzte oder Standorte abgebildet werden?",
      answer: "Ja. Gemeinschaftspraxen, MVZ oder Praxen mit mehreren Standorten werden vollständig abgebildet – inkl. individueller SEO-Seiten je Standort und Arztprofilen.",
    },
  ],
};

export function WebdesignArzt() {
  return <NationalIndustryPage config={config} />;
}
