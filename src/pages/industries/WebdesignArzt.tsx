import { NationalIndustryPage } from "@/components/NationalIndustryPage";
import type { NationalIndustryPageConfig } from "@/components/NationalIndustryPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const config: NationalIndustryPageConfig = {
  seo: {
    title: "Webdesign für Arztpraxen | DSGVO-konforme Praxis-Website | Cogniiq",
    description: "Webdesign für Arztpraxen: DSGVO-konforme Praxis-Website mit Online-Terminbuchung, Local SEO und digitalem Patientenformular. Mehr Neupatienten, weniger Routineanrufe.",
    canonical: `${BUSINESS_INFO.website}/webdesign-arzt`,
    keywords: "Webdesign Arztpraxis, Praxis Website, Arzt Homepage, Website Arztpraxis DSGVO, Webdesign Praxis",
  },
  h1: "Webdesign für Arztpraxen & Medizinische Einrichtungen",
  tagline: "Arztpraxis · DSGVO-konform · Online-Terminbuchung",
  intro: "Bevor ein neuer Patient anruft, hat er Ihre Website bereits beurteilt. In Sekundenbruchteilen entscheidet er, ob Ihre Praxis professionell wirkt, ob er seinen Kassentyp findet und ob er online buchen kann. Eine schwache Website schickt ihn zurück zur Google-Suche – und zur nächsten Praxis, die diese drei Punkte besser löst.",
  serviceSlug: "leistungen",
  serviceLabel: "Webdesign Leistungen",
  costLink: "/kosten-webdesign",
  costLinkLabel: "Webdesign Kosten",
  problems: [
    {
      title: "Bei lokaler Google-Suche nicht sichtbar",
      description: "Patienten, die nach 'Hautarzt München' oder 'Hausarzt Bayreuth' suchen, finden Praxen auf Seite 2 schlicht nicht. Local SEO entscheidet täglich darüber, wer neue Patienten gewinnt und wer nicht.",
    },
    {
      title: "Neue Patienten vertrauen der Praxis nicht – noch bevor sie hereinkommen",
      description: "Veraltete Website, fehlende Arztprofile, unklare Leistungsdarstellung: Das reicht, um eine Entscheidung gegen Ihre Praxis zu fällen. Vertrauen entsteht heute zuerst online.",
    },
    {
      title: "Keine Online-Terminbuchung – Patienten rufen oder wechseln",
      description: "Wer abends nach einem Termin sucht, möchte nicht bis morgen früh warten. Online-Buchung ist für viele Patienten inzwischen ein Auswahlkriterium – nicht nur eine Bequemlichkeit.",
    },
    {
      title: "Routineanfragen überlasten das Praxisteam",
      description: "Welche Kasse? Wie lange wartet man? Wo parken? Diese Fragen beantwortet eine gute Praxis-Website von selbst – und entlastet damit das Telefon täglich um Dutzende Anrufe.",
    },
    {
      title: "DSGVO-Anforderungen nicht vollständig erfüllt",
      description: "Praxis-Websites benötigen mehr als ein Impressum: DSGVO-konformes Cookie-Consent, sichere Formularübertragung und bei Terminbuchungstools einen AVV. Fehlende Komponenten sind rechtliche Risiken.",
    },
    {
      title: "Gemeinschaftspraxen und MVZ nicht korrekt abgebildet",
      description: "Praxen mit mehreren Ärzten, verschiedenen Fachgebieten oder mehreren Standorten brauchen eine Struktur, die das abbildet – mit individuellen SEO-Seiten, ohne Verwirrungs-Potenzial.",
    },
  ],
  solution: {
    headline: "Eine Praxis-Website, die gefunden wird, überzeugt und entlastet.",
    text: "Cogniiq entwickelt DSGVO-konforme Praxis-Websites mit Online-Terminbuchung, strukturierten Daten für Google und klarer Patientenführung. Das Ergebnis: mehr Neupatienten über die organische Suche und weniger Routineanrufe im Praxisalltag.",
  },
  benefits: [
    "Local SEO: gefunden bei 'Arzt [Stadt]', 'Praxis [Fachgebiet] [Stadt]'",
    "Online-Terminbuchung – auch abends und am Wochenende",
    "DSGVO-konform: Datenschutz, Cookie-Consent und AVV inklusive",
    "Arztprofile und Leistungsdarstellung, die Vertrauen aufbauen",
    "Digitale Patientenformulare zur Entlastung der Anmeldung",
    "Strukturierte Daten für bessere Google-Darstellung (Rich Snippets)",
    "Gemeinschaftspraxen und MVZ vollständig abgebildet",
  ],
  workflow: {
    title: "Praxis-Website in drei klar definierten Phasen",
    steps: [
      {
        step: "01",
        title: "Analyse & Datenschutz-Check",
        description: "Analyse der rechtlichen Anforderungen, der Patientenstruktur und der lokalen Suchlage. Konzept für eine DSGVO-konforme Website mit optimalem Informationsaufbau für Ihre Praxisart.",
      },
      {
        step: "02",
        title: "Entwicklung & SEO-Setup",
        description: "Individuelle Praxis-Website mit Online-Terminbuchung, Local SEO, strukturierten Daten und vollständiger DSGVO-Dokumentation. Auf Wunsch direkt mit KI-Telefonassistenten integriert.",
      },
      {
        step: "03",
        title: "Launch & laufende Betreuung",
        description: "Go-live mit vollständiger Dokumentation. Optionale Betreuung für Updates, Inhaltsänderungen und Anpassungen – damit die Website nicht nach 6 Monaten veraltet wirkt.",
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
      question: "Welche DSGVO-Anforderungen gelten speziell für Praxis-Websites?",
      answer: "Praxis-Websites benötigen eine vollständige Datenschutzerklärung, DSGVO-konformes Cookie-Consent, gesicherte SSL-Formularübertragung und bei Terminbuchungstools einen Auftragsverarbeitungsvertrag (AVV). Wer Patientenfotos oder Gesundheitsbezüge einbindet, braucht zusätzliche Einwilligungsdokumentation. Cogniiq liefert alle diese Komponenten vollständig und rechtssicher.",
    },
    {
      question: "Welche Online-Terminbuchungssysteme integriert Cogniiq?",
      answer: "Wir integrieren Terminbuchungssysteme, die direkt mit Ihrem Praxiskalender synchronisiert sind – von einfachen Buchungsformularen bis zu vollständig integrierten Systemen mit Kalenderabgleich. Patienten können Termine rund um die Uhr buchen, Sie sehen alles in Ihrer gewohnten Praxissoftware.",
    },
    {
      question: "Wie lange dauert die Entwicklung einer Praxis-Website?",
      answer: "Einfache Praxis-Websites mit Terminbuchung und SEO-Setup sind in 3–4 Wochen fertig. Websites für Gemeinschaftspraxen, MVZ oder mit erweiterten Patientenportalen dauern typischerweise 5–8 Wochen – ohne Einschränkung des Praxisbetriebs.",
    },
    {
      question: "Was kostet eine Praxis-Website?",
      answer: "Praxis-Websites starten bei ca. 2.500 €. Mit Terminbuchungsintegration, vollständigem DSGVO-Setup und Local SEO typischerweise 3.500–5.500 €. Ein genaues Angebot für Ihre Praxisgröße und -struktur erhalten Sie im kostenlosen Erstgespräch.",
    },
    {
      question: "Können mehrere Ärzte, Fachgebiete und Standorte abgebildet werden?",
      answer: "Ja. Gemeinschaftspraxen, MVZ und Praxen mit mehreren Standorten werden vollständig abgebildet – inklusive individueller SEO-Seiten je Standort, Arztprofilen und fachgebietsspezifischer Leistungsdarstellung.",
    },
  ],
};

export function WebdesignArzt() {
  return <NationalIndustryPage config={config} />;
}
