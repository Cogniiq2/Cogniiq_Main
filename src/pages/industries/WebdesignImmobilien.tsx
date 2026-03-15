import { NationalIndustryPage } from "@/components/NationalIndustryPage";
import type { NationalIndustryPageConfig } from "@/components/NationalIndustryPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const config: NationalIndustryPageConfig = {
  seo: {
    title: "Webdesign für Immobilienmakler & Immobilienbüros | Cogniiq",
    description: "Webdesign für Immobilienmakler: Premium-Website mit Exposé-Präsentation, automatischer Lead-Erfassung und Local SEO. Mehr qualifizierte Eigentümer- und Käufer-Anfragen für Ihr Immobilienbüro.",
    canonical: `${BUSINESS_INFO.website}/webdesign-immobilien`,
    keywords: "Webdesign Immobilien, Immobilienmakler Website, Homepage Makler, Webdesign Immobilienbüro, SEO Immobilien",
  },
  h1: "Webdesign für Immobilienmakler & Immobilienbüros",
  tagline: "Immobilien · Vertrauen vor Erstgespräch · Lead-Generierung",
  intro: "Ein Eigentümer, der über Verkauf nachdenkt, googelt den Makler, bevor er anruft. Er schaut sich die Website an, liest die Referenzen, beurteilt die Exposés und entscheidet dann – still und ohne Rückmeldung –, ob er den Hörer abnimmt. Makler, die online nicht wie der beste in der Region aussehen, bekommen dieses Gespräch gar nicht erst.",
  serviceSlug: "leistungen",
  serviceLabel: "Webdesign Leistungen",
  costLink: "/kosten-webdesign",
  costLinkLabel: "Webdesign Kosten",
  problems: [
    {
      title: "Bei 'Immobilienmakler [Stadt]' nicht auf Seite 1",
      description: "Kaufinteressenten und Eigentümer suchen lokal. Wer bei diesen Suchen nicht erscheint, existiert für sie nicht – unabhängig von Erfahrung, Referenzen oder tatsächlicher Marktkenntnis.",
    },
    {
      title: "Die Website vermittelt nicht das Vertrauen, das Makler brauchen",
      description: "Immobilien sind die wertvollsten Transaktionen, die Privatpersonen treffen. Eine veraltete, unprofessionelle oder austauschbare Website schickt potenzielle Auftraggeber zum Nächsten – ohne Erklärung.",
    },
    {
      title: "Exposés werden aufgelistet statt inszeniert",
      description: "Hochwertige Objekte verdienen eine Präsentation, die Interessenten bindet. Kleine Thumbnails, fehlende Lagebeschreibungen und unvollständige Ausstattungsdetails kosten Anfragen – besonders bei Objekten über 500.000 €.",
    },
    {
      title: "Neue Anfragen kommen ohne System – und gehen unter",
      description: "Telefon, E-Mail, Kontaktformular: Anfragen kommen von überall, werden manuell bearbeitet und gehen in ruhigen Phasen unter. Die ersten 60 Minuten nach einer Anfrage entscheiden über Abschluss oder Verlust.",
    },
    {
      title: "Eigentümer-Akquise läuft ausschließlich offline",
      description: "Makler, die Verkaufsmandate über Empfehlungen und Klinkenputzen gewinnen, lassen täglich Eigentümer unentdeckt, die aktiv nach einem Makler suchen – und sich online informieren.",
    },
    {
      title: "Besichtigungstermine werden telefonisch koordiniert",
      description: "Hin- und Herschreiben für Besichtigungstermine kostet Makler und Interessenten Zeit. Online-Buchung mit Kalenderabgleich löst das strukturell – ohne eine einzige Rückfrage.",
    },
  ],
  solution: {
    headline: "Premium-Webdesign, das Vertrauen aufbaut – bevor das Telefon klingelt.",
    text: "Cogniiq entwickelt Makler-Websites, die Eigentümer und Käufer online überzeugen: mit professioneller Positionierung, hochwertiger Exposé-Darstellung und strukturierter Lead-Erfassung. Das Ergebnis: mehr qualifizierte Anfragen aus der organischen Suche – von Interessenten, die sich bereits entschieden haben.",
  },
  benefits: [
    "Local SEO: gefunden bei 'Immobilienmakler [Stadt]' und Stadtteilsuchen",
    "Premium-Design, das Markenkompetenz und Marktkenntnis sichtbar macht",
    "Exposé-Präsentation mit Bildgalerie, Grundriss und Standortmap",
    "Automatische Lead-Erfassung direkt in Ihr CRM (OnOffice, Propstack u.a.)",
    "Eigentümer-Landingpage für gezielte Verkaufsmandats-Akquise",
    "Online-Besichtigungsbuchung mit Kalenderabgleich",
    "DSGVO-konforme Verarbeitung von Interessentendaten mit AVV",
  ],
  workflow: {
    title: "Immobilien-Website mit automatisierter Lead-Erfassung",
    steps: [
      {
        step: "01",
        title: "Positionierung & Marktauftritt",
        description: "Analyse Ihrer Stärken, Ihrer Zielregion und des Wettbewerbs. Design und Textstruktur, die Ihre Expertise und bisherigen Erfolge überzeugend kommunizieren – für Käufer und Eigentümer gleichzeitig.",
      },
      {
        step: "02",
        title: "Exposés, Lead-System & SEO",
        description: "Exposé-Darstellung mit vollständiger Objekt-Präsentation, automatisierte Anfrage-Erfassung, CRM-Integration und Local SEO-Setup für Ihre wichtigsten Suchbegriffe.",
      },
      {
        step: "03",
        title: "Automatisierung & Wachstum",
        description: "Besichtigungstermin-Buchung, automatische Interessenten-Kommunikation und optionaler KI-Telefonassistent für Anrufe außerhalb Ihrer Bürozeiten.",
      },
    ],
  },
  cityLinks: [
    { label: "Webdesign Immobilien Bayreuth", href: "/webdesign-immobilien-bayreuth" },
    { label: "Webdesign Immobilien München", href: "/webdesign-immobilien-muenchen" },
    { label: "Webdesign Immobilien Regensburg", href: "/webdesign-immobilien-regensburg" },
    { label: "Webdesign Bayern", href: "/bayern" },
    { label: "Webdesign Deutschland", href: "/webdesign-agentur-deutschland" },
  ],
  relatedLinks: [
    { label: "Automatisierung Immobilien", href: "/automatisierung-immobilien" },
    { label: "KI Telefonassistent", href: "/ki-telefonassistent" },
    { label: "Kosten Webdesign", href: "/kosten-webdesign" },
    { label: "Webdesign Arzt", href: "/webdesign-arzt" },
    { label: "Webdesign Hotel", href: "/webdesign-hotel" },
  ],
  faq: [
    {
      question: "Was muss eine Makler-Website leisten, um Eigentümer-Anfragen zu gewinnen?",
      answer: "Eigentümer, die über Verkauf nachdenken, suchen nach Belegen für lokale Kompetenz: abgeschlossene Transaktionen in ihrer Preisklasse, Bewertungen, ein klar kommuniziertes Vorgehen und einen vertrauenswürdigen Gesamteindruck. Eine Eigentümer-Landingpage mit spezifischem Mehrwert – z. B. Marktwerteinschätzung oder Verkaufsratgeber – verstärkt die Konversionsrate messbar.",
    },
    {
      question: "Kann die Website Exposés automatisch anzeigen und aktualisieren?",
      answer: "Ja. Wir integrieren Exposé-Darstellungen mit Bildgalerie, Grundriss, Standortkarte, Ausstattungsdetails und Anfrage-Formular. Neue Objekte können über ein einfaches CMS ohne technische Kenntnisse eingestellt und bei Verkauf deaktiviert werden. Auf Wunsch auch mit direkter Synchronisation aus OnOffice, Propstack oder anderen Portalen.",
    },
    {
      question: "Wie hilft Local SEO Maklern bei der Neukundengewinnung?",
      answer: "Suchanfragen wie 'Immobilienmakler München Schwabing' oder 'Haus verkaufen Regensburg' haben sehr hohe Kaufabsicht. Mit Local SEO und gezielten Unterseiten pro Stadtteil erscheinen Sie genau dann, wenn jemand aktiv nach Ihrer Leistung sucht – statt nur über Empfehlungen gefunden zu werden.",
    },
    {
      question: "Kann die Website mit einem CRM verbunden werden?",
      answer: "Ja. Wir integrieren Anfragen direkt in OnOffice, Propstack, Flowfact oder andere Systeme. Jede Website-Anfrage landet automatisch als Kontakt im CRM – mit allen Feldern befüllt und einer automatischen Erstnachricht an den Interessenten. Kein Lead geht verloren, keine manuelle Übertragung nötig.",
    },
    {
      question: "Was kostet eine Immobilien-Website mit Lead-System?",
      answer: "Immobilien-Websites beginnen bei ca. 3.000 €. Mit CRM-Integration, vollständigem Exposé-System, Eigentümer-Landingpage und Local SEO typischerweise 4.500–8.000 €. Genaues Angebot nach kostenlosem Erstgespräch.",
    },
  ],
};

export function WebdesignImmobilien() {
  return <NationalIndustryPage config={config} />;
}
