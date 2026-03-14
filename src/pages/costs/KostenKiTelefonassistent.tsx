import { CostPage } from "@/components/CostPage";
import type { CostPageConfig } from "@/components/CostPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

const config: CostPageConfig = {
  seo: {
    title: "Was kostet ein KI Telefonassistent? Preise & Kosten | Cogniiq",
    description: "Was kostet ein KI Telefonassistent für Unternehmen? Transparente Preisübersicht, Einflussfaktoren und Beispielprojekte. KI Anrufbeantworter Kosten für Arztpraxen, Gastronomie und Mittelstand.",
    canonical: `${BUSINESS_INFO.website}/kosten-ki-telefonassistent`,
  },
  h1: "Was kostet ein KI Telefonassistent?",
  intro: "Der KI Telefonassistent ist eine der kosteneffizientesten Investitionen für Unternehmen, die täglich Anrufe verpassen. Hier erfahren Sie, welche Faktoren den Preis bestimmen und was typische Projekte kosten – transparent und ohne Überraschungen.",
  serviceLink: "/ki-telefonassistent",
  serviceLinkLabel: "KI Telefonassistent entdecken",
  priceRanges: [
    {
      label: "Basis",
      range: "ab 99 €/Monat",
      description: "Einfacher KI Telefonassistent für Standardanfragen, Öffnungszeiten und Weiterleitung. Ideal für kleinere Betriebe mit wenigen Anrufen täglich.",
    },
    {
      label: "Professionell",
      range: "199 – 399 €/Monat",
      description: "Vollständige Terminbuchung, CRM-Integration, individuelle Konfiguration für Ihre Branche und unbegrenzte Anrufe. Für wachsende Unternehmen.",
    },
    {
      label: "Enterprise",
      range: "ab 499 €/Monat",
      description: "Mehrsprachig, Multi-Standort, erweiterte Automationsintegration, dedizierter Support und Custom-Integrationen. Für Unternehmen mit hohem Anrufvolumen.",
    },
  ],
  priceFactors: [
    {
      title: "Anrufvolumen",
      description: "Die Anzahl der monatlichen Anrufe beeinflusst den Preis. Günstige Basismodelle decken wenige Anrufe ab, Enterprise-Lösungen skalieren ohne Mehrkosten.",
    },
    {
      title: "Komplexität der Konfiguration",
      description: "Ein einfacher Anrufbeantworter mit Standard-Antworten ist günstiger als ein Assistent, der individuelle Fragen, Terminbuchung und CRM-Integration abdeckt.",
    },
    {
      title: "Kalender- und CRM-Integration",
      description: "Die Anbindung an Google Calendar, Outlook oder ein CRM-System erfordert einmaligen Konfigurationsaufwand, der separat berechnet werden kann.",
    },
    {
      title: "Branchenspezifische Anpassung",
      description: "Praxen, Anwaltskanzleien oder spezialisierte Betriebe benötigen spezifisches Fachwissen und Kommunikationsmuster – das schlägt sich im Setup nieder.",
    },
    {
      title: "Mehrsprachigkeit",
      description: "Ein Assistent, der Deutsch und Englisch (oder weitere Sprachen) spricht, erfordert zusätzliche Konfiguration und ist entsprechend teurer.",
    },
    {
      title: "Einmalige Einrichtungsgebühr",
      description: "Neben der monatlichen Gebühr fällt bei manchen Konfigurationen eine einmalige Einrichtungsgebühr an, die die individuelle Konfiguration und das Onboarding abdeckt.",
    },
  ],
  exampleProjects: [
    {
      title: "Allgemeinmedizin Praxis, München",
      description: "KI Telefonassistent für Terminbuchungen, Überweisungsanfragen und Standardauskünfte. Integration mit Kalender-Software. Entlastet das Praxisteam täglich um mehrere Stunden.",
      investment: "249 €/Monat",
    },
    {
      title: "Restaurant, Bayreuth",
      description: "Automatische Reservierungsannahme, Tischbestätigung und Erinnerungs-SMS. Auch abends und am Wochenende erreichbar – keine verpassten Reservierungen mehr.",
      investment: "149 €/Monat",
    },
    {
      title: "Handwerksbetrieb, Regensburg",
      description: "Anrufannahme während Außeneinsatz, Auftragsanfragen qualifizieren, Rückruf organisieren. Integration mit CRM für automatische Lead-Erfassung.",
      investment: "199 €/Monat",
    },
    {
      title: "Physiotherapiepraxis, Bayern",
      description: "Terminbuchung, Terminverschiebungen und Stornierungen vollautomatisch. DSGVO-konforme Verarbeitung aller Patientendaten auf deutschen Servern.",
      investment: "299 €/Monat",
    },
  ],
  cityLinks: [
    { label: "KI Telefonassistent Bayreuth", href: "/bayreuth/ki-telefonassistent" },
    { label: "KI Telefonassistent München", href: "/muenchen/ki-telefonassistent" },
    { label: "KI Telefonassistent Regensburg", href: "/regensburg/ki-telefonassistent" },
    { label: "KI Telefonassistent Bayern", href: "/bayern/ki-telefonassistent" },
    { label: "KI Agentur Deutschland", href: "/ki-agentur-deutschland" },
  ],
  industryLinks: [
    { label: "KI Telefonassistent Arztpraxis", href: "/ki-telefonassistent-arzt" },
    { label: "KI Telefonassistent Restaurant", href: "/ki-telefonassistent-restaurant" },
    { label: "KI Telefonassistent Hotel", href: "/ki-telefonassistent-hotel" },
    { label: "KI Telefonassistent Praxis", href: "/ki-telefonassistent-praxis" },
  ],
  faq: [
    {
      question: "Was kostet ein KI Telefonassistent pro Monat?",
      answer: "Die monatlichen Kosten beginnen bei ca. 99 €/Monat für einfache Konfigurationen. Professionelle Lösungen mit Terminbuchung und CRM-Integration kosten typischerweise 199–399 €/Monat. Das genaue Angebot hängt von Ihrem Anrufvolumen und den benötigten Funktionen ab.",
    },
    {
      question: "Gibt es eine Einrichtungsgebühr für den KI Telefonassistenten?",
      answer: "Je nach Komplexität der Konfiguration kann eine einmalige Einrichtungsgebühr anfallen. Diese deckt die individuelle Konfiguration, das Training auf Ihre Branche und das Onboarding ab. Im Erstgespräch wird geklärt, ob und in welcher Höhe dies anfällt.",
    },
    {
      question: "Wie lange muss ich den Vertrag laufen lassen?",
      answer: "Wir bieten flexible Laufzeiten. Monatliche Kündigung ist möglich – auch wenn wir aus Erfahrung sagen können, dass Kunden den Service nach einmaliger Einrichtung selten wieder abbestellen.",
    },
    {
      question: "Ist der KI Telefonassistent teurer als ein Mensch am Telefon?",
      answer: "Im Vergleich zu einer Teilzeitmitarbeiterin (ca. 1.500–2.000 €/Monat) ist der KI Assistent deutlich günstiger – und ist 24/7 verfügbar, nie krank und nie im Urlaub. Der ROI zeigt sich meist innerhalb weniger Wochen.",
    },
    {
      question: "Was passiert, wenn der KI Assistent eine Frage nicht beantworten kann?",
      answer: "Wenn der Assistent eine Anfrage nicht bearbeiten kann, leitet er automatisch an einen Mitarbeiter weiter oder nimmt eine Rückrufbitte auf. Kein Anruf geht verloren.",
    },
    {
      question: "Wie viel kostet die Integration in bestehende Systeme?",
      answer: "Standardintegrationen (Google Calendar, Outlook, gängige CRM-Systeme) sind in vielen Paketen inklusive oder kosten eine geringe einmalige Gebühr. Individuelle API-Integrationen werden separat kalkuliert.",
    },
    {
      question: "Kann ich den KI Assistenten später erweitern?",
      answer: "Ja. Der Assistent kann jederzeit um neue Funktionen, Sprachen oder Integrationen erweitert werden. Cogniiq begleitet Sie dabei laufend.",
    },
  ],
  ctaHeadline: "Individuelles Angebot für Ihren KI Telefonassistenten",
  ctaText: "Im kostenlosen Erstgespräch konfigurieren wir gemeinsam den idealen Assistenten für Ihr Unternehmen und erstellen ein transparentes Preisangebot.",
};

export function KostenKiTelefonassistent() {
  return <CostPage config={config} />;
}
