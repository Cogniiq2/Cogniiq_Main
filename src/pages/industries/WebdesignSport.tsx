import { NationalIndustryPage } from "@/components/NationalIndustryPage";
import type { NationalIndustryPageConfig } from "@/components/NationalIndustryPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const config: NationalIndustryPageConfig = {
  seo: {
    title: "Webdesign für Fitnessstudios, Vereine & Sportanlagen | Cogniiq",
    description: "Webdesign für Sport & Fitness: Kurskalender, Probestunden-Buchung und Local SEO – damit Interessenten Ihr Studio bei Google finden, die Atmosphäre spüren und sich direkt anmelden.",
    canonical: `${BUSINESS_INFO.website}/webdesign-sport`,
    keywords: "Webdesign Fitnessstudio, Sport Website, Verein Homepage, Webdesign Yoga, Webdesign Sportanlage",
  },
  h1: "Webdesign für Sport, Fitness & Vereine",
  tagline: "Fitness · Kursangebot · Probestunden-Buchung",
  intro: "Wer ein neues Fitnessstudio oder Yogastudio sucht, entscheidet sich oft online – bevor er die Tür aufmacht. Kursprogramm, Atmosphäre, Preise, Trainerprofile: Das alles wird auf der Website beurteilt. Wer in diesem Moment nicht überzeugt, verliert das Mitglied an den Anbieter, der es besser zeigt – nicht unbedingt besser macht.",
  serviceSlug: "leistungen",
  serviceLabel: "Webdesign Leistungen",
  costLink: "/kosten-webdesign",
  costLinkLabel: "Webdesign Kosten",
  problems: [
    {
      title: "Bei 'Fitnessstudio [Stadt]' nicht auf Seite 1",
      description: "Wer in einer neuen Stadt nach einem Studio sucht oder nach dem Umzug wechseln muss, findet Studios ohne Local SEO schlicht nicht. Mitgliedschaften werden an den Anbieter vergeben, der zum richtigen Zeitpunkt oben steht.",
    },
    {
      title: "Das Kursprogramm ist nicht online einsehbar",
      description: "Viele Interessenten wollen wissen, ob die Kurse zu ihrem Zeitplan passen – bevor sie auch nur eine Nachricht schreiben. Fehlt der digitale Kurskalender, springen sie ohne Rückmeldung ab.",
    },
    {
      title: "Die Probestunden-Buchung fehlt oder ist zu umständlich",
      description: "Die Probestunde ist der entscheidende Konversionspunkt für neue Mitglieder. Wenn sie nicht in zwei Klicks buchbar ist, entscheiden sich Interessenten für das Studio, das diesen Schritt leichter macht.",
    },
    {
      title: "Die Website vermittelt nicht die Energie des Studios",
      description: "Ein lebendiges Community-Studio oder ein hochwertiges Personal-Training-Konzept braucht eine Website, die diese Qualität sichtbar macht – nicht eine Vorlage aus dem Website-Baukasten mit Stock-Fotos.",
    },
    {
      title: "Mitgliedschaftsoptionen und Preise verursachen Abbrüche",
      description: "Zu viele Optionen ohne klare Struktur, fehlende Preistransparenz oder unklare Laufzeitbedingungen führen zu Abbrüchen. Interessenten wenden sich an Anbieter, die ihnen das Entscheiden leichter machen.",
    },
    {
      title: "Mitglieder-Bewertungen und Erfolge sind nicht sichtbar",
      description: "Ein Fitnessstudio lebt von seiner Community. Wer das online nicht zeigt – Mitglieder-Stimmen, Trainerprofile, Atmosphäre-Fotos – verliert gegen Kettenstudios, die genau das systematisch einsetzen.",
    },
  ],
  solution: {
    headline: "Eine Sport-Website, die Energie transportiert und Mitglieder gewinnt.",
    text: "Cogniiq entwickelt Fitness- und Sport-Websites, die das Lebensgefühl Ihres Studios digital spürbar machen – mit digitalem Kurskalender, einfacher Probestunden-Buchung und Local SEO. Das Ergebnis: mehr Neumitglieder aus der organischen Suche, weniger Aufwand am Telefon.",
  },
  benefits: [
    "Local SEO: gefunden bei 'Fitnessstudio [Stadt]', 'Yoga [Stadt]', 'Personal Training [Stadt]'",
    "Digitaler Kurskalender mit Echtzeit-Anzeige und Filter nach Kurstyp",
    "Probestunden-Buchung direkt auf der Website – mit automatischer Bestätigung",
    "Mitgliedschaftsoptionen übersichtlich und konversionsoptimiert dargestellt",
    "Trainerprofile und Community-Stimmen professionell eingebunden",
    "Mobile-first: der gesamte Anmeldeprozess auf dem Smartphone",
    "DSGVO-konforme Mitgliederdatenverarbeitung inklusive",
  ],
  workflow: {
    title: "So entsteht Ihre Sport-Website",
    steps: [
      {
        step: "01",
        title: "Konzept & Studioidentität",
        description: "Was macht Ihr Studio aus – Community, Qualifikation, Spezialisierung, Atmosphäre? Design und Struktur werden so entwickelt, dass genau das beim Besucher ankommt, bevor er die Probestunde bucht.",
      },
      {
        step: "02",
        title: "Kurskalender, Buchung & Mitgliedschaft",
        description: "Digitaler Kurskalender mit Anmelde-Integration, Probestunden-Buchungsformular und konversionsorientierte Darstellung aller Mitgliedschaftsoptionen und Preismodelle.",
      },
      {
        step: "03",
        title: "SEO & Launch",
        description: "Local SEO-Setup, Google Business Optimierung und Go-live mit vollständiger Einrichtung. Auf Wunsch inklusive CMS, über das Sie Kurse, Trainer und Events selbst pflegen.",
      },
    ],
  },
  cityLinks: [
    { label: "Webdesign Bayreuth", href: "/bayreuth/webdesign" },
    { label: "Webdesign München", href: "/muenchen/webdesign" },
    { label: "Webdesign Regensburg", href: "/regensburg/webdesign" },
    { label: "Webdesign Bayern", href: "/bayern" },
    { label: "Webdesign Deutschland", href: "/webdesign-agentur-deutschland" },
  ],
  relatedLinks: [
    { label: "Automatisierung Sport", href: "/automatisierung-sport" },
    { label: "KI Telefonassistent", href: "/ki-telefonassistent" },
    { label: "Kosten Webdesign", href: "/kosten-webdesign" },
    { label: "Webdesign Gastronomie", href: "/webdesign-gastronomie" },
    { label: "Webdesign Hotel", href: "/webdesign-hotel" },
  ],
  faq: [
    {
      question: "Was kostet eine Fitness-Website mit Kurskalender und Buchungssystem?",
      answer: "Sport- und Fitness-Websites beginnen bei ca. 1.800 €. Mit digitalem Kurskalender, Online-Anmeldung und Probestunden-Buchung typischerweise 2.500–4.500 €. Für Studios mit erweitertem Mitgliederverwaltungssystem oder Integration in Magicline, Eversports oder ClubDesk auch darüber. Genaues Angebot nach kostenlosem Erstgespräch.",
    },
    {
      question: "Kann ich den Kurskalender selbst aktualisieren?",
      answer: "Ja. Wir richten ein einfaches Content-Management-System ein, über das Sie Kurse, Zeiten, Trainer und Beschreibungen selbst pflegen – ohne technische Kenntnisse und ohne auf externe Hilfe warten zu müssen. Neue Kurse online, kurzfristige Absagen ebenfalls.",
    },
    {
      question: "Eignet sich die Lösung auch für Yogastudios und Kampfsportschulen?",
      answer: "Ja. Das Konzept funktioniert für alle kursbasierten Sportanbieter: Yoga, Pilates, CrossFit, Kampfsport, Tanzschulen, Schwimmvereine. Das Design und der Inhalt werden auf die spezifische Community, Sprache und Optik Ihres Konzepts zugeschnitten.",
    },
    {
      question: "Wie hilft Local SEO Fitnessstudios beim Wachstum?",
      answer: "Suchanfragen wie 'Fitnessstudio München Schwabing' oder 'Yoga Regensburg Innenstadt' haben sehr hohe Anmeldeabsicht. Mit Local SEO und gezielten Unterseiten für Stadtteile und Kurstypen erscheinen Sie genau dann, wenn jemand sucht – nicht wenn er zufällig vorbeiläuft.",
    },
    {
      question: "Eignet sich die Lösung auch für gemeinnützige Sportvereine?",
      answer: "Ja. Vereins-Websites haben andere Anforderungen als kommerzielle Studios – Mitgliederbereich, Vereinsnachrichten, Mannschaftsseiten und Spendenformulare können alle integriert werden. Sprechen Sie uns für ein individuelles Angebot an.",
    },
  ],
};

export function WebdesignSport() {
  return <NationalIndustryPage config={config} />;
}
