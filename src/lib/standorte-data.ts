import { BUSINESS_INFO } from "./seo-data";

export type ServiceSlug = "ki-telefonassistent" | "automatisierung" | "webdesign";
export type CitySlug = "bayreuth" | "regensburg" | "muenchen";

export interface UseCaseCard {
  industry: string;
  title: string;
  description: string;
}

export interface ProcessStep {
  number: string;
  title: string;
  description: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface RelatedLink {
  label: string;
  href: string;
}

export interface CityServiceConfig {
  city: string;
  citySlug: CitySlug;
  service: string;
  serviceSlug: ServiceSlug;
  route: string;
  locationNote?: string;
  seo: {
    title: string;
    description: string;
    canonical: string;
  };
  intro: {
    h1: string;
    lead: string;
  };
  warumCogniiq: string[];
  useCases: UseCaseCard[];
  processSteps: ProcessStep[];
  faq: FAQItem[];
  localChallenges: string[];
  industries: string[];
  sameServiceOtherCities: RelatedLink[];
  otherServicesInCity: RelatedLink[];
}

const base = BUSINESS_INFO.website;

export const CITY_SERVICE_CONFIGS: Record<string, CityServiceConfig> = {

  "bayreuth/ki-telefonassistent": {
    city: "Bayreuth",
    citySlug: "bayreuth",
    service: "KI Telefonassistent",
    serviceSlug: "ki-telefonassistent",
    route: "/bayreuth/ki-telefonassistent",
    seo: {
      title: "KI Telefonassistent Bayreuth – AI Rezeption für lokale Unternehmen | Cogniiq",
      description: "Kein verpasster Anruf mehr in Bayreuth: Der KI Telefonassistent von Cogniiq nimmt Anrufe entgegen, beantwortet Fragen und bucht Termine – automatisch, rund um die Uhr.",
      canonical: `${base}/bayreuth/ki-telefonassistent`,
    },
    intro: {
      h1: "KI Telefonassistent in Bayreuth",
      lead: "Für Praxen, Restaurants und lokale Dienstleister, die keine Anrufe mehr verpassen wollen. Der digitale Assistent übernimmt Terminannahme, Auskunft und Weiterleitung – rund um die Uhr, ohne Warteschleife und ohne zusätzliches Personal.",
    },
    warumCogniiq: [
      "Einrichtung in 7–14 Tagen – keine monatelangen Projekte",
      "Konfiguration exakt auf Ihre Branche, Ihr Angebot und Ihren Betriebsablauf",
      "Gespräche werden protokolliert und als strukturierte Daten weitergeleitet",
      "Keine teuren Telefonanlagen oder dauerhaften Software-Lizenzen nötig",
      "Persönlicher Ansprechpartner aus Bayreuth – kein anonymes Support-Ticket",
    ],
    useCases: [
      {
        industry: "Arztpraxis & Klinik",
        title: "Terminbuchung ohne Warteschleife",
        description: "Patienten rufen an, der Assistent prüft freie Termine, bucht direkt ins System und sendet eine Bestätigung. Ihr Praxisteam entlastet sich dauerhaft.",
      },
      {
        industry: "Sport & Padel",
        title: "Platzbuchungen & Kursanfragen",
        description: "Sportanlagen und Padel-Center beantworten täglich dieselben Fragen zu Öffnungszeiten und freien Plätzen. Der Assistent übernimmt das automatisch.",
      },
      {
        industry: "Gastronomie",
        title: "Reservierungen & Sonderanfragen",
        description: "Tischreservierungen entgegennehmen, Sondermenüs kommunizieren, Stornierungen bearbeiten – ohne Ablenkung für das Serviceteam.",
      },
    ],
    processSteps: [
      { number: "01", title: "Kennenlernen", description: "Wir besprechen Ihre typischen Anrufe: Welche Fragen kommen täglich? Welche Termine, welche Weiterleitungen brauchen Sie?" },
      { number: "02", title: "Konzept", description: "Gesprächsführung, Antworten und Eskalationsregeln werden gemeinsam entwickelt – passend zu Ihrem Betrieb." },
      { number: "03", title: "Einrichtung", description: "Einbindung in Ihre bestehende Telefonnummer, vollständige Konfiguration und Testläufe mit echten Szenarien." },
      { number: "04", title: "Go-Live", description: "Der Assistent ist aktiv. Wir begleiten die ersten Wochen, analysieren Gespräche und optimieren wo nötig." },
    ],
    faq: [
      { question: "Klingt der Assistent natürlich?", answer: "Ja. Aktuelle Sprachmodelle sind für die meisten Anrufer nicht von einem menschlichen Mitarbeiter zu unterscheiden. Die Stimme und der Gesprächsstil werden auf Ihren Betrieb abgestimmt." },
      { question: "Was passiert, wenn der Assistent eine Frage nicht beantworten kann?", answer: "Er leitet den Anruf weiter oder nimmt eine Nachricht entgegen. Sie legen fest, was in welchem Fall passiert." },
      { question: "Kann ich die Inhalte selbst anpassen?", answer: "Ja, über ein einfaches Dashboard. Für tiefere Anpassungen sind wir jederzeit erreichbar." },
      { question: "Ist der Assistent datenschutzkonform (DSGVO)?", answer: "Ja. Gespräche werden ausschließlich auf europäischen Servern verarbeitet. Auf Wunsch erstellen wir die passenden AVV-Dokumente." },
      { question: "Welche Branchen eignen sich am besten?", answer: "Besonders geeignet: Arztpraxen, Zahnarztpraxen, Physiotherapie, Gastronomie, Sport- und Freizeitanlagen, Handwerk und lokale Dienstleister." },
      { question: "Was kostet der KI Telefonassistent?", answer: "Die Kosten hängen vom Anrufvolumen und der Komplexität ab. Wir erstellen nach dem Erstgespräch ein transparentes Angebot ohne versteckte Kosten." },
      { question: "Wie schnell läuft er nach der Einrichtung?", answer: "In der Regel ist der Assistent 7–14 Tage nach Projektstart live. Bei einfachen Setups auch früher." },
      { question: "Was unterscheidet das von einem einfachen Chatbot?", answer: "Der KI Telefonassistent arbeitet mit Sprache statt Text, versteht Kontext und kann komplexe Dialoge führen – kein starres Frage-Antwort-System." },
    ],
    localChallenges: [
      "Viele Betriebe in Bayreuth können Anrufe nicht durchgehend annehmen – besonders vor und nach den Öffnungszeiten",
      "Fachkräftemangel erhöht den Druck auf bestehendes Personal, das sich auf Kerntätigkeiten konzentrieren muss",
      "Gäste und Patienten erwarten sofortige Antworten – lange Warteschleifen führen zu verlorenen Kunden",
    ],
    industries: ["Arztpraxen & Kliniken", "Zahnarztpraxen", "Physiotherapie", "Gastronomie", "Padel & Sport", "Handwerk", "Lokale Dienstleister"],
    sameServiceOtherCities: [
      { label: "KI Telefonassistent Regensburg", href: "/regensburg/ki-telefonassistent" },
      { label: "KI Telefonassistent München", href: "/muenchen/ki-telefonassistent" },
    ],
    otherServicesInCity: [
      { label: "Automatisierung in Bayreuth", href: "/bayreuth/automatisierung" },
      { label: "Webdesign in Bayreuth", href: "/bayreuth/webdesign" },
    ],
  },

  "bayreuth/automatisierung": {
    city: "Bayreuth",
    citySlug: "bayreuth",
    service: "Automatisierung",
    serviceSlug: "automatisierung",
    route: "/bayreuth/automatisierung",
    seo: {
      title: "Automatisierung Agentur Bayreuth – n8n & Make.com Workflows | Cogniiq",
      description: "Cogniiq automatisiert Geschäftsprozesse für Unternehmen in Bayreuth: Buchungen, Leads, Rechnungen, CRM-Synchronisation. Einmalig eingerichtet, dauerhaft entlastend.",
      canonical: `${base}/bayreuth/automatisierung`,
    },
    intro: {
      h1: "Automatisierung für Unternehmen in Bayreuth",
      lead: "Wiederkehrende Prozesse kosten täglich Zeit und binden Personal, das Sie anderswo dringend brauchen. Mit gezielten Automatisierungen – auf Basis von n8n, Make.com oder direkten API-Schnittstellen – lösen wir diese Probleme einmalig und dauerhaft.",
    },
    warumCogniiq: [
      "Technologie-unabhängige Beratung: Wir wählen das Tool, das zu Ihrer Infrastruktur passt",
      "Saubere Dokumentation – keine Black Box, die nur wir verstehen",
      "Schrittweise Umsetzung: erst ein Prozess, dann mehr – kein Alles-oder-Nichts",
      "Persönliche Einweisung Ihres Teams, kein Selbststudium mit Video-Tutorials",
      "Weiterentwicklung und Support aus Bayreuth",
    ],
    useCases: [
      {
        industry: "Buchung & Terminverwaltung",
        title: "Automatische Buchungsbestätigungen",
        description: "Eingehende Buchungen lösen automatisch Bestätigungs-E-Mails oder WhatsApp-Nachrichten aus – ohne manuellen Eingriff Ihres Teams.",
      },
      {
        industry: "Vertrieb & CRM",
        title: "Lead-Qualifikation und CRM-Befüllung",
        description: "Neue Anfragen aus Ihrer Website oder Social Media landen direkt qualifiziert in Ihrem CRM. Kein manuelles Copy-Paste, keine vergessenen Leads.",
      },
      {
        industry: "Buchhaltung & Rechnungswesen",
        title: "Rechnungen und Erinnerungen automatisch",
        description: "Rechnungen werden automatisch erzeugt, verschickt und nach Zahlungseingang archiviert. Mahnungen gehen nach definierten Intervallen raus.",
      },
    ],
    processSteps: [
      { number: "01", title: "Prozess-Analyse", description: "Gemeinsam identifizieren wir, wo Sie täglich Zeit verlieren. Welche Schritte sind manuell, fehleranfällig oder schlicht langweilig?" },
      { number: "02", title: "Lösungskonzept", description: "Wir skizzieren den Automatisierungsworkflow: welche Tools, welche Trigger, welche Aktionen, welche Ausnahmen." },
      { number: "03", title: "Aufbau & Test", description: "Entwicklung und Testing in einer isolierten Umgebung. Sie sehen den Prozess bevor er live geht." },
      { number: "04", title: "Go-Live & Übergabe", description: "Deployment, Einweisung und Dokumentation. Sie verstehen, was läuft – und können einfache Anpassungen selbst vornehmen." },
    ],
    faq: [
      { question: "Welche Tools nutzt ihr für Automatisierungen?", answer: "Primär n8n und Make.com (ehemals Integromat), bei Bedarf auch direkte API-Integrationen oder spezialisierte Tools wie Zapier oder Pipedream." },
      { question: "Brauche ich technisches Vorwissen?", answer: "Nein. Wir übernehmen den Aufbau vollständig und erklären Ihnen das Ergebnis in verständlichen Worten." },
      { question: "Was kostet eine Automatisierung?", answer: "Das hängt von der Komplexität ab. Einfache Workflows ab ca. 500–1.500 €, komplexere Projekte nach Aufwand. Erstgespräch und Einschätzung sind kostenlos." },
      { question: "Wie sicher sind die Automatisierungen?", answer: "Wir bauen nur auf etablierte, sicherheitszertifizierte Plattformen. Sensible Daten verlassen Europa nicht ohne Ihre Zustimmung." },
      { question: "Können bestehende Systeme integriert werden?", answer: "Ja. Wir verbinden nahezu jede Software mit einer API – ob Ihr CRM, Ihr Buchungssystem oder Ihre Buchhaltung." },
      { question: "Was passiert wenn eine Automatisierung fehlschlägt?", answer: "Wir bauen Fehlerbenachrichtigungen ein. Bei kritischen Prozessen gibt es immer einen manuellen Fallback." },
      { question: "Könnt ihr auch bestehende Workflows übernehmen?", answer: "Ja. Wir analysieren was vorhanden ist, beheben Fehler oder bauen es besser neu auf." },
    ],
    localChallenges: [
      "Kleine Teams in Bayreuth managen viele Prozesse manuell – das kostet täglich Stunden",
      "Gewachsene Software-Landschaften kommunizieren nicht miteinander und erzeugen Doppelarbeit",
      "Fehler durch manuelle Dateneingabe kosten Zeit bei der Korrektur und Vertrauen bei Kunden",
    ],
    industries: ["Handwerk & Betriebe", "Gastronomie", "Dienstleister", "Einzelhandel", "Arztpraxen", "Immobilien", "E-Commerce"],
    sameServiceOtherCities: [
      { label: "Automatisierung Regensburg", href: "/regensburg/automatisierung" },
      { label: "Automatisierung München", href: "/muenchen/automatisierung" },
    ],
    otherServicesInCity: [
      { label: "KI Telefonassistent in Bayreuth", href: "/bayreuth/ki-telefonassistent" },
      { label: "Webdesign in Bayreuth", href: "/bayreuth/webdesign" },
    ],
  },

  "bayreuth/webdesign": {
    city: "Bayreuth",
    citySlug: "bayreuth",
    service: "Webdesign",
    serviceSlug: "webdesign",
    route: "/bayreuth/webdesign",
    seo: {
      title: "Webdesign Agentur Bayreuth – Professionelle Websites | Cogniiq",
      description: "Cogniiq entwickelt hochkonvertierende Websites für Unternehmen in Bayreuth. Kein Baukastensystem, kein Template – individuelle Entwicklung mit SEO- und Performance-Fokus.",
      canonical: `${base}/bayreuth/webdesign`,
    },
    intro: {
      h1: "Webdesign Agentur in Bayreuth",
      lead: "Keine Baukastenwebsites, kein 08/15-Design. Wir entwickeln Websites, die technisch sauber, schnell und auf Ihre Zielgruppe ausgerichtet sind – und die Besucher in Kunden verwandeln.",
    },
    warumCogniiq: [
      "Individuelle Entwicklung – jede Website entsteht von Grund auf für Ihr Unternehmen",
      "Technischer Fokus: Ladezeiten unter 2 Sekunden, Mobile-First, Core Web Vitals",
      "SEO von Anfang an eingebaut, nicht nachträglich drangebaut",
      "Klare Conversion-Struktur: Besucher wissen sofort, was Sie anbieten und wie sie Kontakt aufnehmen",
      "Persönliche Zusammenarbeit aus Bayreuth – kein anonymes Projektportal",
    ],
    useCases: [
      {
        industry: "Lokale Unternehmen & Dienstleister",
        title: "Unternehmens-Website mit Leadfokus",
        description: "Klare Struktur, schnelle Ladezeit, lokale SEO und ein Kontaktformular, das wirklich funktioniert. Ihre Website soll Anfragen generieren, nicht nur existieren.",
      },
      {
        industry: "Arztpraxen & Gesundheit",
        title: "Praxis-Website mit Online-Terminbuchung",
        description: "Vertrauenswürdiges Design, DSGVO-konformes Kontaktformular und optionale Einbindung eines Buchungssystems. Patienten finden und buchen Sie einfach.",
      },
      {
        industry: "Gastronomie & Hotellerie",
        title: "Restaurant-Website mit Reservierung",
        description: "Appetitmachendes Design, aktuelle Speisekarte, Online-Reservierung und Google-Business-Optimierung – alles aus einer Hand.",
      },
    ],
    processSteps: [
      { number: "01", title: "Briefing", description: "Ziele, Zielgruppe, Wettbewerber und bestehende Materialien besprechen. Was soll die Website leisten?" },
      { number: "02", title: "Konzept & Design", description: "Seitenstruktur, Designsprache und Texte werden gemeinsam entwickelt. Kein Übergeben eines Word-Dokuments – wir arbeiten iterativ." },
      { number: "03", title: "Entwicklung", description: "Technische Umsetzung mit Performance- und SEO-Fokus. Sie sehen die Website in einer Vorschau-Umgebung bevor es live geht." },
      { number: "04", title: "Launch & Tracking", description: "Live-Schaltung, Google Analytics oder Matomo Setup, Google Search Console, erste Optimierungen nach Launch." },
    ],
    faq: [
      { question: "Auf welcher Technologie baut ihr auf?", answer: "Je nach Anforderung: React/Next.js für dynamische Projekte, Webflow für content-lastige Sites, WordPress für einfache Unternehmensseiten die selbst gepflegt werden sollen." },
      { question: "Wie lange dauert ein Webdesign-Projekt?", answer: "Einfache Unternehmenswebsites in 4–6 Wochen, komplexere Projekte in 8–12 Wochen. Wir geben Ihnen nach dem Briefing eine realistische Einschätzung." },
      { question: "Was kostet eine Website?", answer: "Einfache Unternehmenswebsites ab ca. 2.500–5.000 €, komplexere Projekte nach Aufwand. Erstgespräch und grobe Schätzung kostenlos." },
      { question: "Kann ich die Website später selbst pflegen?", answer: "Ja, wenn das gewünscht ist. Wir richten ein CMS ein und schulen Sie ein. Alternativ übernehmen wir die laufende Pflege." },
      { question: "Macht ihr auch SEO?", answer: "On-Page SEO ist immer enthalten: Struktur, Texte, technische Grundlagen, Ladezeiten. Für lokale SEO-Kampagnen bieten wir separate Pakete an." },
      { question: "Habt ihr Erfahrung mit lokalen Unternehmen in Bayreuth?", answer: "Ja. Wir verstehen die lokale Wettbewerbssituation und können Ihre Website so positionieren, dass sie in den Suchergebnissen für Bayreuth sichtbar ist." },
      { question: "Könnt ihr eine bestehende Website modernisieren?", answer: "Ja. Ob Redesign, Relaunch oder gezielte Optimierung – wir schauen uns an, was vorhanden ist, und schlagen den sinnvollsten Weg vor." },
    ],
    localChallenges: [
      "Viele Unternehmen in Bayreuth haben veraltete Websites, die auf mobilen Geräten schlecht funktionieren",
      "Lokale Konkurrenz ist oft digital besser aufgestellt – eine schlechte Website kostet täglich Neukunden",
      "Template-Websites aus Baukästen sehen ähnlich aus und heben Ihr Unternehmen nicht vom Wettbewerb ab",
    ],
    industries: ["Arztpraxen & Gesundheit", "Gastronomie", "Handwerk & Betriebe", "Dienstleister", "Sport & Freizeit", "Einzelhandel", "Beratung & Finanzen"],
    sameServiceOtherCities: [
      { label: "Webdesign Regensburg", href: "/regensburg/webdesign" },
      { label: "Webdesign München", href: "/muenchen/webdesign" },
    ],
    otherServicesInCity: [
      { label: "KI Telefonassistent in Bayreuth", href: "/bayreuth/ki-telefonassistent" },
      { label: "Automatisierung in Bayreuth", href: "/bayreuth/automatisierung" },
    ],
  },

  "regensburg/ki-telefonassistent": {
    city: "Regensburg",
    citySlug: "regensburg",
    service: "KI Telefonassistent",
    serviceSlug: "ki-telefonassistent",
    route: "/regensburg/ki-telefonassistent",
    seo: {
      title: "KI Telefonassistent Regensburg – AI Rezeption für lokale Unternehmen | Cogniiq",
      description: "Automatische Anrufannahme für Unternehmen in Regensburg: Der KI Telefonassistent von Cogniiq beantwortet Fragen, bucht Termine und leitet Anrufe weiter – 24/7, ohne Pause.",
      canonical: `${base}/regensburg/ki-telefonassistent`,
    },
    intro: {
      h1: "KI Telefonassistent in Regensburg",
      lead: "Regensburg wächst – und mit ihm der Bedarf nach effizientem Kundenkontakt. Unser KI Telefonassistent übernimmt die Telefonkommunikation für Praxen, Betriebe und Dienstleister: automatisch, zuverlässig und so konfiguriert, dass er zu Ihrem Unternehmen passt.",
    },
    warumCogniiq: [
      "Schnelle Einrichtung: In 7–14 Tagen läuft der Assistent auf Ihrer Telefonnummer",
      "Exakte Anpassung auf Ihre Abläufe und Ihre Branche – kein Einheitsprodukt",
      "Gespräche werden strukturiert protokolliert und können in Ihr CRM exportiert werden",
      "Persönliche Betreuung durch unser Team – keine anonymen Ticket-Systeme",
      "Flexible Anpassung: Wenn sich Ihr Betrieb verändert, ändern wir den Assistenten",
    ],
    useCases: [
      {
        industry: "Universitätsklinik-Umfeld & Privatpraxen",
        title: "Terminmanagement für Praxen",
        description: "In Regensburg gibt es eine hohe Dichte an medizinischen Einrichtungen. Ein KI Assistent entlastet die Praxisanmeldung dauerhaft.",
      },
      {
        industry: "Gastronomie & Tourismus",
        title: "Reservierungen für Restaurants",
        description: "Regensburg als Tourismusstandort hat eine hohe Nachfrage nach Restaurantreservierungen – besonders abends und am Wochenende, wenn kein Personal ans Telefon geht.",
      },
      {
        industry: "Dienstleister & Handwerk",
        title: "Terminannahme nach Feierabend",
        description: "Handwerksbetriebe und Dienstleister erhalten Anfragen oft außerhalb der Arbeitszeit. Der Assistent nimmt auf und leitet morgens strukturiert weiter.",
      },
    ],
    processSteps: [
      { number: "01", title: "Kennenlernen", description: "Wir analysieren Ihre typischen Anrufszenarien und verstehen, was Kunden von Ihnen wissen wollen." },
      { number: "02", title: "Konzept", description: "Entwicklung des Gesprächsdesigns: Begrüßung, Antworten, Weiterleitungsregeln und Ausnahmen." },
      { number: "03", title: "Einrichtung", description: "Technische Integration in Ihre Telefonnummer, Testläufe und Feinabstimmung." },
      { number: "04", title: "Go-Live", description: "Der Assistent übernimmt live. Wir monitoren und optimieren in den ersten Wochen." },
    ],
    faq: [
      { question: "Kann der Assistent Anrufe auf Bayerisch oder regional verstehen?", answer: "Ja. Moderne Sprachmodelle verstehen Dialekte zuverlässig. Bei starkem Akzent kann die Erkennung minimal länger dauern." },
      { question: "Funktioniert er auch bei sehr hohem Anrufvolumen?", answer: "Ja, der Assistent skaliert automatisch. Es gibt keine Wartezeit, auch wenn mehrere Anrufe gleichzeitig eingehen." },
      { question: "Kann er Anrufe auf verschiedene Mitarbeiter weiterleiten?", answer: "Ja, Weiterleitungsregeln können flexibel konfiguriert werden – nach Thema, nach Uhrzeit, nach Verfügbarkeit." },
      { question: "Was passiert bei einem technischen Ausfall?", answer: "Es gibt immer einen Fallback: Entweder wird auf eine Backup-Nummer weitergeleitet oder der Anrufer hört eine klar formulierte Ansage." },
      { question: "Ist der Assistent DSGVO-konform?", answer: "Ja. Alle Daten werden auf europäischen Servern verarbeitet. Wir stellen die notwendigen Datenschutzdokumente bereit." },
      { question: "Können wir den Assistenten vor dem Kauf testen?", answer: "Ja. Im Rahmen des Erstgesprächs können wir eine Demo-Konfiguration für Ihren Use Case zeigen." },
      { question: "Was kostet die monatliche Nutzung?", answer: "Die Kosten richten sich nach Anrufvolumen und Komplexität. Transparentes Angebot nach dem Erstgespräch." },
    ],
    localChallenges: [
      "Regensburgs wachsende Wirtschaft bringt mehr Anrufvolumen, aber keinen Zuwachs an Telefonpersonal",
      "Tourismus und Universität sorgen für Anfragen auch außerhalb regulärer Geschäftszeiten",
      "Fachkräftemangel macht manuelle Telefonkommunikation für viele Betriebe zunehmend unzuverlässig",
    ],
    industries: ["Arztpraxen", "Gastronomie & Hotels", "Physio & Therapie", "Handwerk", "Sport & Freizeit", "Tourismus", "Dienstleister"],
    sameServiceOtherCities: [
      { label: "KI Telefonassistent Bayreuth", href: "/bayreuth/ki-telefonassistent" },
      { label: "KI Telefonassistent München", href: "/muenchen/ki-telefonassistent" },
    ],
    otherServicesInCity: [
      { label: "Automatisierung in Regensburg", href: "/regensburg/automatisierung" },
      { label: "Webdesign in Regensburg", href: "/regensburg/webdesign" },
    ],
  },

  "regensburg/automatisierung": {
    city: "Regensburg",
    citySlug: "regensburg",
    service: "Automatisierung",
    serviceSlug: "automatisierung",
    route: "/regensburg/automatisierung",
    seo: {
      title: "Automatisierung Agentur Regensburg – Workflows mit n8n & Make.com | Cogniiq",
      description: "Prozessautomatisierung für Unternehmen in Regensburg: Cogniiq verbindet Ihre Tools, eliminiert manuelle Schritte und baut zuverlässige Workflows – dauerhaft und wartbar.",
      canonical: `${base}/regensburg/automatisierung`,
    },
    intro: {
      h1: "Automatisierung für Unternehmen in Regensburg",
      lead: "In Regensburg wächst der Mittelstand schnell – und damit auch die Komplexität interner Prozesse. Wir automatisieren Ihren Betrieb: von der Buchungsbestätigung bis zur CRM-Synchronisation, einmalig eingerichtet und dauerhaft entlastend.",
    },
    warumCogniiq: [
      "Unabhängige Technologieberatung: wir empfehlen das Tool, das wirklich zu Ihnen passt",
      "Wartbare Lösungen: klare Dokumentation, keine proprietären Black-Box-Workflows",
      "Skalierbar: was heute 10 Prozesse automatisiert, kann morgen 50 abdecken",
      "Datenschutzkonform: alle Automatisierungen entsprechen der DSGVO",
      "Remote-Betreuung und schnelle Reaktionszeiten bei Anpassungen",
    ],
    useCases: [
      {
        industry: "Mittelstand & Industrie",
        title: "ERP- und CRM-Integration",
        description: "Bestellungen, Kundendaten und Rechnungen fließen automatisch zwischen Ihren Systemen. Keine manuelle Übertragung, keine verlorenen Datensätze.",
      },
      {
        industry: "Gastronomie & Veranstaltungen",
        title: "Event-Buchungen und Bestätigungen",
        description: "Automatische Buchungsbestätigungen, Kapazitätsprüfung, Erinnerungen für Gäste – alles ohne Personalaufwand.",
      },
      {
        industry: "Dienstleistung & Beratung",
        title: "Onboarding neuer Kunden",
        description: "Von der ersten Anfrage bis zur Willkommensnachricht läuft alles automatisch – Verträge, Zugänge, Terminvereinbarungen.",
      },
    ],
    processSteps: [
      { number: "01", title: "Prozess-Analyse", description: "Welche Abläufe kosten täglich Zeit? Wir schauen uns Ihre Workflows an und priorisieren gemeinsam." },
      { number: "02", title: "Lösungskonzept", description: "Wir skizzieren die Automatisierung: Tools, Datenflüsse, Triggerbedingungen und Fehlerbehandlung." },
      { number: "03", title: "Aufbau & Test", description: "Entwicklung in einer Testumgebung mit echten Datensätzen. Keine Live-Experimente." },
      { number: "04", title: "Go-Live & Übergabe", description: "Deployment, Dokumentation und Einweisung Ihres Teams. Optional mit Monitoring und Support-Vertrag." },
    ],
    faq: [
      { question: "Für welche Unternehmensgröße lohnt sich Automatisierung?", answer: "Ab etwa 5 Mitarbeitern gibt es fast immer Prozesse, die automatisiert werden können und sich schnell amortisieren." },
      { question: "Müssen wir unsere bestehende Software wechseln?", answer: "Nein. Wir integrieren, was bereits vorhanden ist. Nur wenn ein Tool objektiv besser ist, empfehlen wir es." },
      { question: "Wie schnell sind ROI-Ergebnisse sichtbar?", answer: "Einfache Automatisierungen zahlen sich oft innerhalb von 4–8 Wochen aus. Komplexere Projekte langfristig." },
      { question: "Was kostet ein Automatisierungsprojekt?", answer: "Abhängig vom Umfang. Erste Workflows ab ca. 500 €, komplexere Integrationen nach Aufwand. Erstgespräch kostenlos." },
      { question: "Können wir selbst Änderungen vornehmen?", answer: "Ja. Wir dokumentieren alles und schulen Sie. Für größere Anpassungen sind wir jederzeit erreichbar." },
      { question: "Was passiert wenn eine Automatisierung fehlschlägt?", answer: "Fehlerbenachrichtigungen sind standardmäßig eingebaut. Kritische Prozesse haben immer einen manuellen Fallback." },
    ],
    localChallenges: [
      "Regensburger KMU haben oft gewachsene IT-Landschaften mit vielen Insellösungen, die nicht kommunizieren",
      "Wachstum in der Region erfordert mehr Effizienz, ohne sofort neue Mitarbeiter einzustellen",
      "Manuelle Datenpflege zwischen verschiedenen Systemen führt zu Fehlern und Zeitverlust",
    ],
    industries: ["Industrie & Fertigung", "Mittelstand", "Gastronomie", "Dienstleistung", "Logistik", "Handwerk", "Beratung"],
    sameServiceOtherCities: [
      { label: "Automatisierung Bayreuth", href: "/bayreuth/automatisierung" },
      { label: "Automatisierung München", href: "/muenchen/automatisierung" },
    ],
    otherServicesInCity: [
      { label: "KI Telefonassistent in Regensburg", href: "/regensburg/ki-telefonassistent" },
      { label: "Webdesign in Regensburg", href: "/regensburg/webdesign" },
    ],
  },

  "regensburg/webdesign": {
    city: "Regensburg",
    citySlug: "regensburg",
    service: "Webdesign",
    serviceSlug: "webdesign",
    route: "/regensburg/webdesign",
    seo: {
      title: "Webdesign Agentur Regensburg – Professionelle Websites | Cogniiq",
      description: "Individuelle Websites für Unternehmen in Regensburg: technisch sauber, schnell, SEO-optimiert und auf Conversion ausgerichtet. Kein Baukastensystem.",
      canonical: `${base}/regensburg/webdesign`,
    },
    intro: {
      h1: "Webdesign Agentur in Regensburg",
      lead: "Regensburg hat viel zu bieten – Ihre Website sollte das widerspiegeln. Wir entwickeln professionelle, schnelle und konversionsorientierte Websites für Unternehmen in Regensburg: individuell konzipiert, technisch erstklassig und mit lokalem SEO-Fokus.",
    },
    warumCogniiq: [
      "Keine Templates – jede Website wird individuell konzipiert und entwickelt",
      "Mobile-First: über 70% Ihrer Besucher kommen vom Smartphone",
      "Technische Performance: Core Web Vitals, schnelle Ladezeiten, sauber strukturierter Code",
      "Lokaler SEO-Fokus: Ihre Website soll bei Suchen in Regensburg sichtbar sein",
      "Klare Kommunikation ohne Agentur-Buzzwords: Sie wissen immer, woran wir sind",
    ],
    useCases: [
      {
        industry: "Tourismus & Gastronomie",
        title: "Website für Regensburgs Tourismus-Wirtschaft",
        description: "Hotels, Restaurants und touristische Anbieter in Regensburg brauchen Websites, die Gäste informieren und direkt zur Buchung führen.",
      },
      {
        industry: "Mittelstand & B2B",
        title: "Unternehmens-Website mit Leadgenerierung",
        description: "B2B-Unternehmen brauchen Websites, die Kompetenz ausstrahlen und qualifizierte Anfragen generieren – keine Imagebroschüre im Web-Format.",
      },
      {
        industry: "Gesundheit & Praxen",
        title: "Praxis-Website mit Vertrauen",
        description: "Patienten informieren sich online bevor sie eine Praxis kontaktieren. Ihre Website muss Vertrauen aufbauen und die Kontaktaufnahme erleichtern.",
      },
    ],
    processSteps: [
      { number: "01", title: "Briefing", description: "Ziele, Zielgruppe, Wettbewerber und bestehende Materialien – wir verstehen Ihr Unternehmen bevor wir anfangen." },
      { number: "02", title: "Konzept & Design", description: "Seitenstruktur, Design und Texte entstehen iterativ in enger Abstimmung mit Ihnen." },
      { number: "03", title: "Entwicklung", description: "Technische Umsetzung mit Performance-Fokus. Sie sehen die Website in einer Vorschau-Umgebung." },
      { number: "04", title: "Launch", description: "Live-Schaltung, SEO-Setup, Analytics und erste Optimierungen auf Basis der ersten Nutzungsdaten." },
    ],
    faq: [
      { question: "Könnt ihr auch bestehende Regensburger Websites übernehmen?", answer: "Ja. Wir analysieren, was vorhanden ist, und schlagen den optimalen Weg vor: Redesign, Relaunch oder gezielte Optimierung." },
      { question: "Wie lange dauert ein Webdesign-Projekt?", answer: "4–8 Wochen für einfachere Projekte, 8–12 Wochen für komplexere. Realistischer Zeitplan nach dem Briefing." },
      { question: "Was kostet eine Website für ein Regensburger Unternehmen?", answer: "Ab ca. 2.500 € für einfache Unternehmenswebsites, komplexere Projekte nach Aufwand. Erstgespräch und Einschätzung kostenlos." },
      { question: "Baut ihr auf WordPress oder individuellem Code?", answer: "Beides. WordPress für pflegeleichte Inhalte, individuelle Entwicklung (React/Next.js) für komplexe Anforderungen." },
      { question: "Macht ihr auch Fotografie oder Texte?", answer: "Texte erstellen wir gemeinsam oder mit KI-Unterstützung. Fotografie können wir über Partner-Netzwerke koordinieren." },
      { question: "Bietet ihr auch Wartung und Pflege an?", answer: "Ja, auf Wunsch übernehmen wir laufende Updates, Sicherheitsupdates und Änderungen." },
    ],
    localChallenges: [
      "Viele Regensburger Unternehmen verlieren potenzielle Kunden durch schlechte oder veraltete Websites",
      "Tourismus und Universität bringen viele Neuzuzügler, die sich ausschließlich online informieren",
      "Lokale Konkurrenz wächst – wer digital nicht sichtbar ist, verliert Marktanteile",
    ],
    industries: ["Tourismus & Hotels", "Gastronomie", "Arztpraxen", "Mittelstand & B2B", "Handwerk", "Einzelhandel", "Sport & Wellness"],
    sameServiceOtherCities: [
      { label: "Webdesign Bayreuth", href: "/bayreuth/webdesign" },
      { label: "Webdesign München", href: "/muenchen/webdesign" },
    ],
    otherServicesInCity: [
      { label: "KI Telefonassistent in Regensburg", href: "/regensburg/ki-telefonassistent" },
      { label: "Automatisierung in Regensburg", href: "/regensburg/automatisierung" },
    ],
  },

  "muenchen/ki-telefonassistent": {
    city: "München",
    citySlug: "muenchen",
    service: "KI Telefonassistent",
    serviceSlug: "ki-telefonassistent",
    route: "/muenchen/ki-telefonassistent",
    locationNote: "Cogniiq betreut Projekte für Unternehmen in München remote – persönliche Termine im Raum München auf Anfrage möglich.",
    seo: {
      title: "KI Telefonassistent München – AI Rezeption für Unternehmen | Cogniiq",
      description: "KI-gestützte Telefonkommunikation für Unternehmen in München: automatische Anrufannahme, Terminbuchung und Weiterleitung – rund um die Uhr, ohne Mehrpersonal.",
      canonical: `${base}/muenchen/ki-telefonassistent`,
    },
    intro: {
      h1: "KI Telefonassistent für Unternehmen in München",
      lead: "München ist ein Wettbewerbsmarkt. Unternehmen, die Anrufe zuverlässig und schnell beantworten, gewinnen Kunden gegenüber denen, die nicht abheben. Unser KI Telefonassistent übernimmt die Telefonkommunikation – präzise, rund um die Uhr, ohne Personalaufwand.",
    },
    warumCogniiq: [
      "Keine Münchner Agenturpreise – transparente Kosten ohne Overhead",
      "Remote-Einrichtung und vollständige Konfiguration ohne vor-Ort-Termine nötig",
      "Erfahrung aus vergleichbaren Projekten in Bayern – kein Neuland",
      "Datenschutz nach DSGVO, Hosting in Deutschland",
      "Persönliche Betreuung und direkte Erreichbarkeit – kein Callcenter",
    ],
    useCases: [
      {
        industry: "Privatpraxen & Spezialisten",
        title: "24/7 Terminannahme ohne Mehrkosten",
        description: "Privatpatienten in München erwarten schnelle Reaktionszeiten. Der Assistent nimmt rund um die Uhr Terminanfragen entgegen und trägt sie ins Buchungssystem ein.",
      },
      {
        industry: "Gastronomie & Events",
        title: "Reservierungen ohne Unterbrechung",
        description: "Restaurants und Event-Locations in München haben hohes Reservierungsvolumen. Der Assistent entlastet das Personal – besonders an Stoßzeiten und am Wochenende.",
      },
      {
        industry: "Beratung & Dienstleistung",
        title: "Erstanfragen strukturiert erfassen",
        description: "Unternehmen in der Beratungsbranche profitieren davon, wenn Erstanfragen qualifiziert erfasst und weitergeleitet werden – bevor der Berater Zeit investiert.",
      },
    ],
    processSteps: [
      { number: "01", title: "Anforderungsanalyse", description: "Remote-Gespräch über Ihre Anruftypen, Ihre Branche und Ihre Erwartungen an den Assistenten." },
      { number: "02", title: "Konfiguration", description: "Aufbau des Gesprächsdesigns und der Weiterleitungslogik – spezifisch auf Ihr Münchner Unternehmen." },
      { number: "03", title: "Test & Feinabstimmung", description: "Testläufe mit echten Szenarien. Sie geben Feedback, wir optimieren bis es passt." },
      { number: "04", title: "Go-Live", description: "Inbetriebnahme auf Ihrer Rufnummer. Monitoring und Optimierung in den ersten Wochen." },
    ],
    faq: [
      { question: "Könnt ihr Projekte in München auch remote betreuen?", answer: "Ja, vollständig. Die Einrichtung und Betreuung erfolgt remote. Persönliche Termine in München sind auf Anfrage möglich." },
      { question: "Habt ihr Referenzen aus München oder Großstädten?", answer: "Wir arbeiten für Unternehmen in Bayern, die ähnliche Anforderungen haben wie Münchner Betriebe. Auf Anfrage teilen wir Referenzprojekte." },
      { question: "Wie unterscheidet sich der Münchner Markt?", answer: "Höheres Anrufvolumen, höhere Erwartungen an Reaktionsgeschwindigkeit, oft mehrsprachige Anforderungen. Der Assistent ist für alle diese Szenarien konfigurierbar." },
      { question: "Kann der Assistent auf Englisch sprechen?", answer: "Ja. Mehrsprachige Konfigurationen sind möglich – z.B. Deutsch als Standard, Englisch auf Anfrage des Anrufers." },
      { question: "Was kostet der Assistent für ein Münchner Unternehmen?", answer: "Gleich wie überall: transparent, auf Basis von Anrufvolumen und Komplexität. Kein Münchner Aufschlag." },
      { question: "Wie schnell ist die Einrichtung?", answer: "7–14 Tage nach dem ersten Gespräch ist der Assistent typischerweise live." },
      { question: "Ist die Technologie stabil genug für Großstädte?", answer: "Ja. Die zugrundeliegenden Plattformen sind für sehr hohes Volumen ausgelegt und laufen auch bei parallel eingehenden Anrufen ohne Qualitätsverlust." },
    ],
    localChallenges: [
      "München hat einen der dichtesten Dienstleistungsmärkte in Deutschland – wer Anrufe nicht sofort beantwortet, verliert Kunden an Konkurrenten",
      "Personalkosten in München sind hoch – Telefonpersonal ist teuer und schwer zu finden",
      "Internationale Kundschaft erwartet mehrsprachigen Service auch per Telefon",
    ],
    industries: ["Privatpraxen & Kliniken", "Gastronomie & Luxury Dining", "Beratung & Finanzdienstleistung", "Sport & Wellness", "Hotels & Hospitality", "Immobilien"],
    sameServiceOtherCities: [
      { label: "KI Telefonassistent Bayreuth", href: "/bayreuth/ki-telefonassistent" },
      { label: "KI Telefonassistent Regensburg", href: "/regensburg/ki-telefonassistent" },
    ],
    otherServicesInCity: [
      { label: "Automatisierung für München", href: "/muenchen/automatisierung" },
      { label: "Webdesign für München", href: "/muenchen/webdesign" },
    ],
  },

  "muenchen/automatisierung": {
    city: "München",
    citySlug: "muenchen",
    service: "Automatisierung",
    serviceSlug: "automatisierung",
    route: "/muenchen/automatisierung",
    locationNote: "Cogniiq betreut Automatisierungsprojekte für Unternehmen in München remote – vollständig und ohne Qualitätseinbußen.",
    seo: {
      title: "Automatisierung Agentur München – n8n & Make.com Workflows | Cogniiq",
      description: "Prozessautomatisierung für Unternehmen in München: Cogniiq verbindet Tools, eliminiert manuelle Prozesse und liefert wartbare Workflows. Remote, schnell, zuverlässig.",
      canonical: `${base}/muenchen/automatisierung`,
    },
    intro: {
      h1: "Automatisierung für Unternehmen in München",
      lead: "Münchner Unternehmen wachsen schnell – und mit ihnen die Komplexität interner Prozesse. Wir automatisieren das, was täglich Zeit kostet: Leadverarbeitung, Buchungen, Datensynchronisation, Reporting. Remote betreut, dauerhaft wartbar.",
    },
    warumCogniiq: [
      "Kein Münchner Agentur-Overhead – direkte Zusammenarbeit ohne große Hierarchien",
      "Technologieoffene Beratung: n8n, Make.com, Zapier, direkte APIs – je nachdem was sinnvoll ist",
      "Saubere Dokumentation, die Ihr Team versteht und selbst nutzen kann",
      "DSGVO-konforme Verarbeitung, Hosting in Europa",
      "Erfahrung mit Skalierung: von 5 bis 500 automatisierten Prozessen",
    ],
    useCases: [
      {
        industry: "Startups & Scale-ups",
        title: "Automatisches Lead-Nurturing",
        description: "Neue Leads aus verschiedenen Quellen landen qualifiziert im CRM, erhalten automatische Follow-ups und werden Vertriebsmitarbeitern zugewiesen.",
      },
      {
        industry: "Mittelstand & Konzerne",
        title: "System-Integrationen ohne Entwickler",
        description: "ERP, CRM, Marketing-Tools und Buchhaltung tauschen Daten automatisch aus – keine manuellen Importe, keine Doppelerfassung.",
      },
      {
        industry: "E-Commerce & Retail",
        title: "Bestell- und Lagermanagement",
        description: "Bestellungen triggern automatisch Lager-Updates, Versandmeldungen und Kundenkommunikation – ohne manuelle Eingriffe.",
      },
    ],
    processSteps: [
      { number: "01", title: "Analyse", description: "Remote-Workshop: Welche Prozesse fressen die meiste Zeit? Wir priorisieren nach ROI-Potenzial." },
      { number: "02", title: "Konzept", description: "Datenfluss-Diagramm, Tool-Auswahl und Risikobewertung. Kein Blind-Start." },
      { number: "03", title: "Umsetzung", description: "Aufbau in einer Testumgebung, Abnahme durch Sie, dann Deployment." },
      { number: "04", title: "Übergabe & Support", description: "Vollständige Dokumentation, Einweisung und optional laufender Support-Vertrag." },
    ],
    faq: [
      { question: "Können wir remote zusammenarbeiten?", answer: "Ja, vollständig. Alle Projektphasen laufen remote – via Video-Calls, geteilten Boards und Dokumenten." },
      { question: "Wie unterscheiden sich eure Preise von Münchner Agenturen?", answer: "Wir haben keinen Münchner Overhead. Faire Preise, direkte Zusammenarbeit ohne viele Projektmanagement-Ebenen." },
      { question: "Habt ihr Erfahrung mit Skalierung?", answer: "Ja. Wir bauen Automatisierungen von Anfang an so, dass sie mit Ihrem Unternehmen wachsen können." },
      { question: "Können komplexe ERP-Systeme integriert werden?", answer: "In den meisten Fällen ja. Wir prüfen vorab welche APIs verfügbar sind und was technisch machbar ist." },
      { question: "Was wenn sich unsere Prozesse ändern?", answer: "Wir passen die Automatisierungen an. Durch saubere Dokumentation können kleine Änderungen auch intern vorgenommen werden." },
      { question: "Wie lange dauert ein Automatisierungsprojekt?", answer: "Einfache Workflows: 1–2 Wochen. Komplexe Integrationen: 4–8 Wochen. Realistischer Zeitplan nach der Analyse." },
    ],
    localChallenges: [
      "Münchner Unternehmen zahlen hohe Personalkosten – Automatisierung amortisiert sich schneller als anderswo",
      "Viele Münchner KMU und Startups haben bereits viele Tools im Einsatz, die nicht miteinander kommunizieren",
      "Schnell wachsende Teams brauchen skalierbare Prozesse, bevor manuelle Arbeit zum Engpass wird",
    ],
    industries: ["Startups & Scaleups", "Mittelstand", "E-Commerce", "Finanzdienstleistung", "Consulting", "Medizintechnik", "SaaS-Unternehmen"],
    sameServiceOtherCities: [
      { label: "Automatisierung Bayreuth", href: "/bayreuth/automatisierung" },
      { label: "Automatisierung Regensburg", href: "/regensburg/automatisierung" },
    ],
    otherServicesInCity: [
      { label: "KI Telefonassistent für München", href: "/muenchen/ki-telefonassistent" },
      { label: "Webdesign für München", href: "/muenchen/webdesign" },
    ],
  },

  "muenchen/webdesign": {
    city: "München",
    citySlug: "muenchen",
    service: "Webdesign",
    serviceSlug: "webdesign",
    route: "/muenchen/webdesign",
    locationNote: "Cogniiq entwickelt Websites für Unternehmen in München remote – persönliche Termine auf Anfrage möglich.",
    seo: {
      title: "Webdesign Agentur München – Professionelle Websites ohne Münchner Preise | Cogniiq",
      description: "Individuelle Webseiten für Unternehmen in München: technisch sauber, schnell, SEO-optimiert. Kein Template, kein Baukastensystem – entwickelt von Cogniiq.",
      canonical: `${base}/muenchen/webdesign`,
    },
    intro: {
      h1: "Webdesign für Unternehmen in München",
      lead: "München hat viele Webdesign-Agenturen – und viele von ihnen haben entsprechende Preise. Wir bieten dasselbe Niveau an Qualität und technischem Anspruch, ohne den Münchner Overhead: individuelle Entwicklung, SEO-Fokus, faire Preise.",
    },
    warumCogniiq: [
      "Entwicklung auf Enterprise-Niveau ohne Enterprise-Preis",
      "Individuelle Websites – kein Einheitslook, keine Copy-Paste-Templates",
      "Technischer Fokus: Performance, Core Web Vitals, sicherer Code",
      "SEO von Beginn an – keine nachträglichen Korrekturen",
      "Remote-Zusammenarbeit, die reibungslos funktioniert",
    ],
    useCases: [
      {
        industry: "Startups & Tech-Unternehmen",
        title: "Hochwertige Unternehmens-Website",
        description: "Münchner Startups brauchen Websites, die Investoren, Kunden und Talente ansprechen – visuell stark, technisch sauber, schnell erreichbar.",
      },
      {
        industry: "Mittelstand & B2B",
        title: "Lead-generierende Unternehmenswebsite",
        description: "B2B-Unternehmen in München brauchen Websites, die Kompetenz kommunizieren und qualifizierte Anfragen generieren, nicht nur Präsenz zeigen.",
      },
      {
        industry: "Luxury & Premium-Segment",
        title: "Premium-Markenauftritt im Web",
        description: "Für Unternehmen im Premiumsegment in München: ein Webauftritt, der die Marke adäquat repräsentiert – ästhetisch und technisch auf höchstem Niveau.",
      },
    ],
    processSteps: [
      { number: "01", title: "Briefing", description: "Remote-Workshop zu Zielen, Zielgruppen, Positionierung und bestehenden Materialien." },
      { number: "02", title: "Konzept & Design", description: "Seitenstruktur, Design und Texte entstehen iterativ. Kein Übergeben von Dateien ohne Feedback-Schleifen." },
      { number: "03", title: "Entwicklung", description: "Technische Umsetzung mit Performance-Fokus. Sie sehen die Website in einer Live-Vorschau." },
      { number: "04", title: "Launch & SEO-Setup", description: "Live-Schaltung, Google-Setup, Analytics und Monitoring. Erste Optimierungen nach Launch." },
    ],
    faq: [
      { question: "Arbeitet ihr auch für größere Münchner Unternehmen?", answer: "Ja. Wir skalieren den Prozess entsprechend – von der einfachen Unternehmenswebsite bis zum komplexen Web-Projekt." },
      { question: "Was kostet eine Website für ein Münchner Unternehmen?", answer: "Dieselben fairen Preise wie überall: ab ca. 2.500 € für einfachere Projekte. Keine Aufpreise für München." },
      { question: "Könnt ihr mit Münchner Markenagenturen zusammenarbeiten?", answer: "Ja, wir übernehmen gerne die technische Umsetzung von Designs, die von anderen Agenturen erstellt wurden." },
      { question: "Habt ihr Erfahrung mit SEO für München?", answer: "Ja. Lokaler SEO für konkurrenzdichte Märkte wie München erfordert Strategie. Wir beraten Sie dazu." },
      { question: "Wie funktioniert die Remote-Zusammenarbeit?", answer: "Video-Calls, gemeinsame Figma-Boards, Staging-Umgebungen – der Prozess läuft genauso ab wie bei lokalen Agenturen, ohne Pendelzeit." },
      { question: "Wie schnell kann eine Website live gehen?", answer: "Einfachere Projekte in 4–6 Wochen. Komplexere in 8–12 Wochen. Realistischer Zeitplan nach dem Briefing." },
      { question: "Habt ihr ein Portfolio für München?", answer: "Auf Anfrage zeigen wir relevante Referenzprojekte aus vergleichbaren Branchen." },
    ],
    localChallenges: [
      "Viele Münchner Agenturen verlangen Premium-Preise ohne entsprechend bessere Qualität zu liefern",
      "Der Münchner Markt ist kompetitiv – eine schwache Website kostet täglich Neukunden",
      "Internationales Publikum in München erwartet englischsprachige Optionen und hochwertiges Design",
    ],
    industries: ["Startups & Scaleups", "Luxury & Premium", "B2B-Dienstleistung", "Beratung", "Medizintechnik", "Immobilien", "Gastronomie & Hotels"],
    sameServiceOtherCities: [
      { label: "Webdesign Bayreuth", href: "/bayreuth/webdesign" },
      { label: "Webdesign Regensburg", href: "/regensburg/webdesign" },
    ],
    otherServicesInCity: [
      { label: "KI Telefonassistent für München", href: "/muenchen/ki-telefonassistent" },
      { label: "Automatisierung für München", href: "/muenchen/automatisierung" },
    ],
  },
};

export const CITY_LINKS: Record<CitySlug, { label: string; services: Array<{ label: string; href: string }> }> = {
  bayreuth: {
    label: "Bayreuth",
    services: [
      { label: "KI Telefonassistent", href: "/bayreuth/ki-telefonassistent" },
      { label: "Automatisierung", href: "/bayreuth/automatisierung" },
      { label: "Webdesign", href: "/bayreuth/webdesign" },
    ],
  },
  regensburg: {
    label: "Regensburg",
    services: [
      { label: "KI Telefonassistent", href: "/regensburg/ki-telefonassistent" },
      { label: "Automatisierung", href: "/regensburg/automatisierung" },
      { label: "Webdesign", href: "/regensburg/webdesign" },
    ],
  },
  muenchen: {
    label: "München",
    services: [
      { label: "KI Telefonassistent", href: "/muenchen/ki-telefonassistent" },
      { label: "Automatisierung", href: "/muenchen/automatisierung" },
      { label: "Webdesign", href: "/muenchen/webdesign" },
    ],
  },
};
