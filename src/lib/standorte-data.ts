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
  localIntro: {
    paragraphs: string[];
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
      description: "Kein verpasster Anruf mehr in Bayreuth: Der KI Telefonassistent von Cogniiq nimmt Anrufe entgegen, beantwortet Fragen und bucht Termine – automatisch, rund um die Uhr, DSGVO-konform.",
      canonical: `${base}/bayreuth/ki-telefonassistent`,
    },
    intro: {
      h1: "KI Telefonassistent in Bayreuth",
      lead: "Für Praxen, Restaurants und lokale Dienstleister in Bayreuth, die keine Anrufe mehr verpassen wollen. Der digitale Assistent übernimmt Terminannahme, Auskunft und Weiterleitung – rund um die Uhr, ohne Warteschleife und ohne zusätzliches Personal.",
    },
    localIntro: {
      paragraphs: [
        "Bayreuth ist eine Mittelstadt mit einer ausgeprägten Dienstleistungslandschaft: Arztpraxen, Zahnarztpraxen, Physiotherapeuten, Gastronomie, Sport- und Freizeitanlagen sowie ein breites Spektrum an lokalen Handwerksbetrieben. Was diese Branchen verbindet: Sie alle werden täglich mit Anrufen konfrontiert, die ihre Mitarbeiter von der eigentlichen Arbeit abhalten. Terminanfragen, Auskunftsgespräche, Stornierungen – häufig wiederkehrend, zeitintensiv und doch unvermeidbar.",
        "Der KI Telefonassistent von Cogniiq ist speziell für diese Situation entwickelt: Er übernimmt die telefonische Kommunikation vollständig – oder gezielt in den Zeiten, in denen kein Personal verfügbar ist. Anrufe werden professionell entgegengenommen, häufige Fragen beantwortet, Termine direkt in Ihr Buchungssystem eingetragen und komplexere Anliegen strukturiert an Sie weitergeleitet. Alles DSGVO-konform, auf europäischen Servern verarbeitet.",
        "Für Unternehmen in Bayreuth bedeutet das: kein verpasster Anruf vor oder nach den Öffnungszeiten, deutlich weniger Unterbrechungen im Arbeitsalltag und ein professioneller erster Eindruck, der Vertrauen schafft. Die Einrichtung dauert 7–14 Tage und wird vollständig von Cogniiq übernommen – mit persönlichem Ansprechpartner direkt aus Bayreuth.",
      ],
    },
    warumCogniiq: [
      "Einrichtung in 7–14 Tagen – kein monatelanger Einführungsprozess",
      "Konfiguration exakt auf Ihre Branche, Ihr Angebot und Ihren Betriebsablauf",
      "Alle Gespräche werden protokolliert und als strukturierte Daten weitergeleitet",
      "Keine teuren Telefonanlagen oder dauerhaften Software-Lizenzen nötig",
      "Persönlicher Ansprechpartner aus Bayreuth – kein anonymes Support-Ticket",
      "Vollständig DSGVO-konform – Verarbeitung auf europäischen Servern",
    ],
    useCases: [
      {
        industry: "Arztpraxis & Klinik",
        title: "Terminbuchung ohne Warteschleife",
        description: "Patienten rufen an, der Assistent prüft freie Termine, bucht direkt ins System und sendet eine Bestätigung. Ihr Praxisteam wird dauerhaft entlastet – besonders in Stoßzeiten morgens und mittags.",
      },
      {
        industry: "Sport & Padel",
        title: "Platzbuchungen & Kursanfragen",
        description: "Sportanlagen und Padel-Center in Bayreuth beantworten täglich dieselben Fragen zu Öffnungszeiten und freien Plätzen. Der Assistent übernimmt das vollautomatisch – auch am Wochenende.",
      },
      {
        industry: "Gastronomie",
        title: "Reservierungen & Sonderanfragen",
        description: "Tischreservierungen entgegennehmen, Sondermenüs kommunizieren, Stornierungen bearbeiten – ohne Ablenkung für das Serviceteam. Besonders während des Servicestresses unverzichtbar.",
      },
    ],
    processSteps: [
      { number: "01", title: "Kennenlernen & Zieldefinition", description: "Wir besprechen Ihre typischen Anrufe: Welche Fragen kommen täglich? Welche Termine, welche Weiterleitungen brauchen Sie? Was soll der Assistent können – und was nicht?" },
      { number: "02", title: "Konzept & Angebot", description: "Gesprächsführung, Antworten und Eskalationsregeln werden gemeinsam entwickelt – passend zu Ihrem Betrieb in Bayreuth. Sie erhalten ein schriftliches Angebot ohne Überraschungen." },
      { number: "03", title: "Umsetzung & Feinschliff", description: "Einbindung in Ihre bestehende Telefonnummer, vollständige Konfiguration und Testläufe mit echten Szenarien. Sie hören den Assistenten selbst und geben Feedback." },
      { number: "04", title: "Go-Live & Optimierung", description: "Der Assistent ist aktiv. Wir begleiten die ersten Wochen, analysieren Gespräche und optimieren wo nötig. Sie haben jederzeit die Kontrolle." },
    ],
    faq: [
      { question: "Klingt der KI Telefonassistent natürlich?", answer: "Ja. Aktuelle Sprachmodelle sind für die meisten Anrufer nicht von einem menschlichen Mitarbeiter zu unterscheiden. Stimme, Sprechgeschwindigkeit und Gesprächsstil werden auf Ihren Betrieb in Bayreuth abgestimmt." },
      { question: "Was passiert, wenn der Assistent eine Frage nicht beantworten kann?", answer: "Er leitet den Anruf weiter oder nimmt eine strukturierte Nachricht entgegen. Sie legen exakt fest, was in welchem Fall passiert – und wir konfigurieren es entsprechend." },
      { question: "Kann ich die Inhalte selbst anpassen?", answer: "Ja, über ein einfaches Dashboard können Sie Antworten und Verfügbarkeiten selbst ändern. Für tiefere Anpassungen sind wir als Ihr Ansprechpartner in Bayreuth jederzeit erreichbar." },
      { question: "Ist der KI Telefonassistent datenschutzkonform (DSGVO)?", answer: "Ja. Alle Gespräche werden ausschließlich auf europäischen Servern verarbeitet. Wir erstellen auf Wunsch die notwendigen AVV-Dokumente und unterstützen bei der Dokumentation für Ihren Datenschutzbeauftragten." },
      { question: "Welche Branchen in Bayreuth eignen sich am besten?", answer: "Besonders geeignet: Arztpraxen, Zahnarztpraxen, Physiotherapiepraxen, Gastronomie, Padel- und Sportanlagen, Handwerksbetriebe und alle lokalen Dienstleister mit regelmäßigem Telefonaufkommen." },
      { question: "Was kostet der KI Telefonassistent in Bayreuth?", answer: "Die Kosten hängen von Anrufvolumen und Konfigurationskomplexität ab. Wir erstellen nach dem Erstgespräch ein transparentes Festpreisangebot – ohne versteckte Kosten oder laufende Lizenzgebühren für nicht genutzte Features." },
      { question: "Wie schnell ist der Assistent nach der Einrichtung live?", answer: "In der Regel ist der Assistent 7–14 Tage nach Projektstart live. Bei einfachen Setups – z.B. nur Terminannahme und Weiterleitung – auch früher möglich." },
      { question: "Was unterscheidet den KI Telefonassistenten von einem Chatbot?", answer: "Der KI Telefonassistent arbeitet mit Sprache statt Text, versteht gesprochenen Kontext und führt natürliche Dialoge – kein starres Frage-Antwort-System, keine Tastenmenüs. Er klingt und verhält sich wie ein echter Mitarbeiter am Telefon." },
    ],
    localChallenges: [
      "Viele Betriebe in Bayreuth können Anrufe nicht durchgehend annehmen – besonders vor und nach den regulären Öffnungszeiten und während Stoßzeiten",
      "Der Fachkräftemangel erhöht den Druck auf bestehendes Personal, das sich auf Kerntätigkeiten konzentrieren muss – nicht auf wiederholte Standardanfragen",
      "Gäste und Patienten erwarten heute sofortige Antworten – lange Warteschleifen oder nicht abgehobene Anrufe führen direkt zu verlorenen Kunden",
    ],
    industries: ["Arztpraxen & Kliniken", "Zahnarztpraxen", "Physiotherapie & Heilpraktiker", "Gastronomie & Restaurants", "Padel & Sportanlagen", "Handwerk & Betriebe", "Lokale Dienstleister", "Wellness & Beauty"],
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
      description: "Cogniiq automatisiert Geschäftsprozesse für Unternehmen in Bayreuth: Buchungen, Leads, Rechnungen, CRM-Synchronisation. Einmalig eingerichtet, dauerhaft entlastend. Persönliche Betreuung vor Ort.",
      canonical: `${base}/bayreuth/automatisierung`,
    },
    intro: {
      h1: "Automatisierung für Unternehmen in Bayreuth",
      lead: "Wiederkehrende Prozesse kosten täglich Zeit und binden Personal, das Sie anderswo dringend brauchen. Mit gezielten Automatisierungen – auf Basis von n8n, Make.com oder direkten API-Schnittstellen – lösen wir diese Probleme einmalig und dauerhaft.",
    },
    localIntro: {
      paragraphs: [
        "In Bayreuth arbeiten viele kleine und mittelständische Unternehmen – Handwerksbetriebe, Dienstleister, Arztpraxen, Gastronomie – mit gewachsenen Software-Landschaften, die über die Jahre entstanden sind. Das Ergebnis: Daten werden manuell von einer Anwendung in die nächste übertragen, Buchungsbestätigungen per Hand verschickt, CRM-Einträge nach jedem Telefonat neu angelegt. Diese Prozesse kosten täglich Stunden.",
        "Cogniiq analysiert, welche Abläufe in Ihrem Betrieb in Bayreuth automatisiert werden können – und setzt die Lösungen mit marktführenden Tools wie n8n und Make.com um. Das Ergebnis sind zuverlässige Workflows, die im Hintergrund laufen: Buchungsbestätigungen, die automatisch rausgehen. Leads, die direkt qualifiziert ins CRM wandern. Rechnungen, die sich selbst erstellen. Fehlerbenachrichtigungen, die Sie sofort informieren, wenn etwas schiefläuft.",
        "Anders als große Agenturen bieten wir persönliche Betreuung direkt aus Bayreuth: kein anonymes Ticket-System, keine langen Abstimmungsschleifen. Sie arbeiten direkt mit dem Entwickler, der Ihre Automatisierung gebaut hat – und der im Zweifelsfall in 30 Minuten erreichbar ist.",
      ],
    },
    warumCogniiq: [
      "Technologie-unabhängige Beratung: Wir wählen das Tool, das zu Ihrer Infrastruktur passt",
      "Saubere Dokumentation – keine Black Box, die nur wir verstehen",
      "Schrittweise Umsetzung: erst ein Prozess, dann mehr – kein Alles-oder-Nichts-Ansatz",
      "Persönliche Einweisung Ihres Teams – kein Selbststudium mit Video-Tutorials",
      "Weiterentwicklung und Support aus Bayreuth – direkter Draht, kurze Reaktionszeiten",
      "DSGVO-konform: sensible Daten verlassen Europa nicht ohne Ihre Zustimmung",
    ],
    useCases: [
      {
        industry: "Buchung & Terminverwaltung",
        title: "Automatische Buchungsbestätigungen",
        description: "Eingehende Buchungen lösen automatisch Bestätigungs-E-Mails oder WhatsApp-Nachrichten aus – ohne manuellen Eingriff. Funktioniert für Praxen, Handwerker und Dienstleister gleichermaßen.",
      },
      {
        industry: "Vertrieb & CRM",
        title: "Lead-Qualifikation und CRM-Befüllung",
        description: "Neue Anfragen aus Ihrer Website oder Social Media landen direkt qualifiziert in Ihrem CRM. Kein manuelles Copy-Paste, keine vergessenen Leads, keine Datenverluste beim Wechsel zwischen Anwendungen.",
      },
      {
        industry: "Buchhaltung & Rechnungswesen",
        title: "Rechnungen und Mahnungen automatisch",
        description: "Rechnungen werden automatisch erzeugt, verschickt und nach Zahlungseingang archiviert. Mahnungen gehen nach definierten Intervallen raus – ohne dass jemand daran denken muss.",
      },
    ],
    processSteps: [
      { number: "01", title: "Kennenlernen & Zieldefinition", description: "Gemeinsam identifizieren wir, wo Sie täglich Zeit verlieren. Welche Schritte sind manuell, fehleranfällig oder schlicht langweilig? Wir priorisieren nach ROI-Potenzial." },
      { number: "02", title: "Konzept & Angebot", description: "Wir skizzieren den Automatisierungsworkflow: welche Tools, welche Trigger, welche Aktionen, welche Ausnahmen. Sie sehen das Konzept bevor ein einziger Code geschrieben wird." },
      { number: "03", title: "Umsetzung & Feinschliff", description: "Entwicklung und Testing in einer isolierten Umgebung. Sie sehen den Prozess live bevor er in Ihrem echten Betrieb läuft – kein Blindflug." },
      { number: "04", title: "Go-Live & Optimierung", description: "Deployment, Einweisung und vollständige Dokumentation. Sie verstehen, was läuft – und können einfache Anpassungen selbst vornehmen. Bei Fragen sind wir in Bayreuth erreichbar." },
    ],
    faq: [
      { question: "Welche Tools nutzt ihr für Automatisierungen?", answer: "Primär n8n und Make.com (ehemals Integromat), bei Bedarf auch direkte API-Integrationen oder spezialisierte Tools wie Zapier oder Pipedream. Wir empfehlen immer das Tool, das langfristig am sinnvollsten für Ihren Betrieb ist – nicht das teuerste." },
      { question: "Brauche ich technisches Vorwissen?", answer: "Nein. Wir übernehmen den vollständigen Aufbau und erklären Ihnen das Ergebnis in verständlichen Worten. Nach der Übergabe können Sie einfache Änderungen selbst vornehmen." },
      { question: "Was kostet eine Automatisierung in Bayreuth?", answer: "Das hängt von der Komplexität ab. Einfache Workflows ab ca. 500–1.500 €, komplexere Projekte nach Aufwand. Erstgespräch und Einschätzung sind kostenlos – und unverbindlich." },
      { question: "Wie sicher sind die Automatisierungen?", answer: "Wir bauen ausschließlich auf etablierte, sicherheitszertifizierte Plattformen. Sensible Daten verlassen Europa nicht ohne Ihre ausdrückliche Zustimmung. Alle Workflows sind DSGVO-konform aufgebaut." },
      { question: "Können bestehende Systeme integriert werden?", answer: "Ja. Wir verbinden nahezu jede Software mit einer API – ob Ihr CRM, Ihr Buchungssystem, Ihre Buchhaltungssoftware oder branchenspezifische Anwendungen." },
      { question: "Was passiert wenn eine Automatisierung fehlschlägt?", answer: "Fehlerbenachrichtigungen sind standardmäßig eingebaut. Bei kritischen Prozessen gibt es immer einen manuellen Fallback – niemand verliert Daten, weil ein Workflow einen schlechten Tag hat." },
      { question: "Könnt ihr auch bestehende Workflows übernehmen?", answer: "Ja. Wir analysieren was vorhanden ist, beheben Fehler oder bauen es strukturierter neu auf. Oft lässt sich Bestehendes mit wenig Aufwand deutlich stabiler machen." },
      { question: "Für welche Unternehmensgrößen lohnt sich das?", answer: "Ab etwa 3–5 Mitarbeitern gibt es fast immer Prozesse, die sich lohnen zu automatisieren und sich schnell amortisieren. Wir schauen uns das gemeinsam an – ohne Verkaufsdruck." },
    ],
    localChallenges: [
      "Kleine Teams in Bayreuth managen viele Prozesse manuell – das kostet täglich Stunden, die für Kernaufgaben fehlen",
      "Gewachsene Software-Landschaften kommunizieren nicht miteinander und erzeugen Doppelarbeit bei jedem Geschäftsvorgang",
      "Fehler durch manuelle Dateneingabe kosten Zeit bei der Korrektur und Vertrauen bei Kunden, wenn Bestätigungen zu spät ankommen",
    ],
    industries: ["Handwerk & Betriebe", "Gastronomie", "Arztpraxen", "Dienstleister", "Einzelhandel", "Immobilien", "E-Commerce", "Physiotherapie & Gesundheit"],
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
      title: "Webdesign Agentur Bayreuth – Professionelle Websites für lokale Unternehmen | Cogniiq",
      description: "Cogniiq entwickelt hochkonvertierende Websites für Unternehmen in Bayreuth. Kein Baukastensystem, kein Template – individuelle Entwicklung mit SEO- und Performance-Fokus. Persönliche Betreuung vor Ort.",
      canonical: `${base}/bayreuth/webdesign`,
    },
    intro: {
      h1: "Webdesign Agentur in Bayreuth",
      lead: "Keine Baukastenwebsites, kein 08/15-Design. Wir entwickeln Websites für Unternehmen in Bayreuth, die technisch sauber, schnell und auf Ihre Zielgruppe ausgerichtet sind – und die Besucher in Kunden verwandeln.",
    },
    localIntro: {
      paragraphs: [
        "Bayreuth hat eine aktive lokale Wirtschaft: Handwerksbetriebe, Praxen, Gastronomie, Sport- und Freizeitanlagen sowie eine wachsende Zahl digitaler Dienstleister. Was viele dieser Unternehmen gemeinsam haben: Ihre Website ist entweder veraltet, auf einem günstigen Baukastensystem gebaut oder schlicht nicht darauf ausgelegt, Neukunden zu gewinnen. In einem Markt, in dem potenzielle Kunden sich zuerst online informieren, ist das ein teurer Nachteil.",
        "Cogniiq entwickelt Websites für Bayreuth, die anders sind: Individuelle Konzeption statt Vorlage, technische Präzision statt schnelle Lieferung, SEO von Anfang an statt nachträglich eingebaut. Jede Website, die wir bauen, ist auf Ihren spezifischen Bedarf und Ihre lokale Zielgruppe ausgerichtet – ob Praxis-Website mit Terminbuchung, Restaurant-Website mit Reservierung oder Unternehmens-Website mit Kontaktformular und Leadfokus.",
        "Als Webdesign-Agentur mit Sitz in Bayreuth kennen wir den lokalen Wettbewerb, die regionalen Suchgewohnheiten und die spezifischen Erwartungen Ihrer Kunden. Wir erstellen Websites, die bei lokalen Suchanfragen sichtbar sind – und die Besucher durch klare Struktur und überzeugendes Design zur Kontaktaufnahme bewegen.",
      ],
    },
    warumCogniiq: [
      "Individuelle Entwicklung – jede Website entsteht von Grund auf für Ihr Unternehmen in Bayreuth",
      "Technischer Fokus: Ladezeiten unter 2 Sekunden, Mobile-First, Core Web Vitals bestanden",
      "SEO von Anfang an eingebaut – kein nachträgliches Aufsetzen einer Grundstruktur",
      "Klare Conversion-Struktur: Besucher wissen sofort, was Sie anbieten und wie sie Kontakt aufnehmen",
      "Persönliche Zusammenarbeit direkt in Bayreuth – kein anonymes Projektportal mit Ticket-Nummern",
      "Nach dem Launch: Support, Änderungen und Optimierungen auf Wunsch",
    ],
    useCases: [
      {
        industry: "Lokale Unternehmen & Dienstleister",
        title: "Unternehmens-Website mit Leadfokus",
        description: "Klare Struktur, schnelle Ladezeit, lokales SEO für Bayreuth und ein Kontaktformular, das wirklich funktioniert. Ihre Website soll Anfragen generieren – nicht nur existieren.",
      },
      {
        industry: "Arztpraxen & Gesundheit",
        title: "Praxis-Website mit Online-Terminbuchung",
        description: "Vertrauenswürdiges Design, DSGVO-konformes Kontaktformular und optionale Einbindung eines Buchungssystems. Patienten in Bayreuth finden und buchen Sie online.",
      },
      {
        industry: "Gastronomie & Hotellerie",
        title: "Restaurant-Website mit Reservierung",
        description: "Appetitmachendes Design, aktuelle Speisekarte, Online-Reservierung und Google-Business-Optimierung für Bayreuth – alles aus einer Hand, fertig für mobile Gäste.",
      },
    ],
    processSteps: [
      { number: "01", title: "Kennenlernen & Zieldefinition", description: "Ziele, Zielgruppe, Wettbewerber und bestehende Materialien besprechen. Was soll die Website für Ihr Unternehmen in Bayreuth leisten?" },
      { number: "02", title: "Konzept & Angebot", description: "Seitenstruktur, Designsprache und Texte werden gemeinsam entwickelt. Kein Übergeben eines Word-Dokuments – wir arbeiten iterativ mit Ihnen." },
      { number: "03", title: "Umsetzung & Feinschliff", description: "Technische Umsetzung mit Performance- und SEO-Fokus. Sie sehen die Website in einer Vorschau-Umgebung bevor sie live geht." },
      { number: "04", title: "Go-Live & Optimierung", description: "Live-Schaltung, Google Analytics oder Matomo Setup, Google Search Console Einrichtung, erste Optimierungen nach Launch-Daten." },
    ],
    faq: [
      { question: "Auf welcher Technologie baut ihr auf?", answer: "Je nach Anforderung: React/Next.js für dynamische Projekte, Webflow für content-lastige Sites, WordPress für einfache Unternehmensseiten, die Ihr Team selbst pflegen soll." },
      { question: "Wie lange dauert ein Webdesign-Projekt in Bayreuth?", answer: "Einfache Unternehmenswebsites in 4–6 Wochen, komplexere Projekte in 8–12 Wochen. Nach dem Briefing geben wir Ihnen eine realistische Einschätzung." },
      { question: "Was kostet eine Website für ein Unternehmen in Bayreuth?", answer: "Einfache Unternehmenswebsites ab ca. 2.500–5.000 €, komplexere Projekte nach Aufwand. Das Erstgespräch und eine grobe Einschätzung sind kostenlos." },
      { question: "Kann ich die Website später selbst pflegen?", answer: "Ja, wenn das gewünscht ist. Wir richten ein passendes CMS ein und schulen Sie ein. Alternativ übernehmen wir auf Wunsch die laufende Pflege." },
      { question: "Macht ihr auch SEO für Bayreuth?", answer: "On-Page SEO ist immer enthalten: technische Grundlagen, saubere Struktur, lokale Keyword-Integration für Bayreuth, Core Web Vitals. Für umfangreichere lokale SEO-Kampagnen bieten wir separate Pakete an." },
      { question: "Habt ihr Erfahrung mit lokalen Unternehmen in Bayreuth?", answer: "Ja. Wir kennen die lokale Wettbewerbssituation und können Ihre Website so positionieren, dass sie bei Suchanfragen für Bayreuth und Umgebung sichtbar ist." },
      { question: "Könnt ihr eine bestehende Website modernisieren?", answer: "Ja. Ob Redesign, Relaunch oder gezielte Optimierung einzelner Seiten – wir schauen uns an, was vorhanden ist, und schlagen den sinnvollsten Weg vor." },
      { question: "Bietet ihr auch Hosting an?", answer: "Auf Wunsch organisieren wir das Hosting bei einem deutschen Anbieter. Alternativ nutzen wir Ihren bestehenden Hosting-Vertrag." },
    ],
    localChallenges: [
      "Viele Unternehmen in Bayreuth haben veraltete Websites, die auf mobilen Geräten schlecht funktionieren und bei Google kaum sichtbar sind",
      "Lokale Konkurrenz ist oft digital besser aufgestellt – eine schlechte oder langsame Website kostet täglich Neukunden, die online weitersuchen",
      "Baukastenwebsites aus Standardvorlagen sehen alle ähnlich aus und heben Ihr Unternehmen nicht vom lokalen Wettbewerb in Bayreuth ab",
    ],
    industries: ["Arztpraxen & Gesundheit", "Gastronomie & Restaurants", "Handwerk & Betriebe", "Lokale Dienstleister", "Sport & Freizeit", "Einzelhandel", "Beratung & Finanzen"],
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
      description: "Automatische Anrufannahme für Unternehmen in Regensburg: Der KI Telefonassistent von Cogniiq beantwortet Fragen, bucht Termine und leitet Anrufe weiter – 24/7, ohne Pause, DSGVO-konform.",
      canonical: `${base}/regensburg/ki-telefonassistent`,
    },
    intro: {
      h1: "KI Telefonassistent in Regensburg",
      lead: "Regensburg wächst – und mit ihm der Bedarf nach effizientem Kundenkontakt. Unser KI Telefonassistent übernimmt die Telefonkommunikation für Praxen, Betriebe und Dienstleister in Regensburg: automatisch, zuverlässig und so konfiguriert, dass er zu Ihrem Unternehmen passt.",
    },
    localIntro: {
      paragraphs: [
        "Regensburg ist eine der am schnellsten wachsenden Städte Bayerns – mit einer Universität, einer wachsenden Start-up-Szene, einem starken Mittelstand und einer der dichtesten Gastronomie- und Tourismuslandschaften in Ostbayern. Diese Dynamik schlägt sich auch in der Telefonkommunikation nieder: Anfragen kommen zu jeder Tages- und Abendzeit, besonders in der Tourismussaison und während der Semesterzeiten ist das Volumen hoch.",
        "Der KI Telefonassistent von Cogniiq ist die Antwort auf diese Herausforderung: Er nimmt Anrufe rund um die Uhr entgegen, beantwortet Standardfragen zu Öffnungszeiten, Preisen und Verfügbarkeit, bucht Termine direkt ins System und leitet komplexe Anliegen strukturiert weiter. Für Arztpraxen bedeutet das: keine überfüllte Telefonleitung am Montagmorgen. Für Restaurants: keine verpassten Reservierungen am Wochenende. Für Handwerksbetriebe: keine Anfragen, die abends ins Leere laufen.",
        "Cogniiq richtet den Assistenten speziell auf Ihr Regensburger Unternehmen ein – von der Begrüßungssprache bis zu den Weiterleitungsregeln. Die Einrichtung dauert 7–14 Tage und ist vollständig DSGVO-konform, mit Verarbeitung auf europäischen Servern. Persönliche Betreuung durch unser Team, das Regensburgern kennt und versteht.",
      ],
    },
    warumCogniiq: [
      "Schnelle Einrichtung: In 7–14 Tagen läuft der Assistent auf Ihrer Regensburger Telefonnummer",
      "Exakte Anpassung auf Ihre Abläufe und Ihre Branche – kein Einheitsprodukt von der Stange",
      "Gespräche werden strukturiert protokolliert und können in Ihr CRM oder Buchungssystem exportiert werden",
      "Skaliert automatisch: kein Qualitätsverlust bei parallel eingehenden Anrufen in Stoßzeiten",
      "Vollständig DSGVO-konform – Verarbeitung auf europäischen Servern, AVV auf Anfrage",
      "Persönliche Betreuung durch unser Team – keine anonymen Ticket-Systeme",
    ],
    useCases: [
      {
        industry: "Universitätsklinik-Umfeld & Privatpraxen",
        title: "Terminmanagement ohne überfüllte Leitung",
        description: "Regensburg hat eine hohe Dichte an medizinischen Einrichtungen rund um das Klinikum. Ein KI Assistent entlastet die Praxisanmeldung dauerhaft – besonders montags und nach Feiertagen.",
      },
      {
        industry: "Gastronomie & Tourismus",
        title: "Reservierungen rund um die Uhr",
        description: "Regensburg als eines der beliebtesten Touristenziele in Bayern hat eine hohe Nachfrage nach Restaurantreservierungen – besonders abends und am Wochenende, wenn kein Personal am Telefon sitzt.",
      },
      {
        industry: "Dienstleister & Handwerk",
        title: "Terminannahme nach Feierabend",
        description: "Handwerksbetriebe und Dienstleister in Regensburg erhalten Anfragen oft außerhalb der Arbeitszeit. Der Assistent nimmt auf und leitet sie morgens strukturiert an das richtige Teammitglied weiter.",
      },
    ],
    processSteps: [
      { number: "01", title: "Kennenlernen & Zieldefinition", description: "Wir analysieren Ihre typischen Anrufszenarien in Regensburg und verstehen, was Kunden von Ihnen wissen wollen – und wie der Assistent reagieren soll." },
      { number: "02", title: "Konzept & Angebot", description: "Entwicklung des Gesprächsdesigns: Begrüßung, Antwortinhalt, Weiterleitungsregeln und Ausnahmen. Sie sehen das Konzept bevor wir beginnen." },
      { number: "03", title: "Umsetzung & Feinschliff", description: "Technische Integration in Ihre Telefonnummer, Testläufe mit echten Szenarien und Feinabstimmung auf Basis Ihres Feedbacks." },
      { number: "04", title: "Go-Live & Optimierung", description: "Der Assistent übernimmt live. Wir monitoren und optimieren in den ersten Wochen – bis alles reibungslos läuft." },
    ],
    faq: [
      { question: "Kann der Assistent Dialekte oder regional typische Ausdrücke verstehen?", answer: "Ja. Moderne Sprachmodelle verstehen Dialekte und regionale Ausdrücke zuverlässig. Bei sehr starkem Dialekt kann die Verarbeitung minimal länger dauern – in der Praxis ist das kaum relevant." },
      { question: "Funktioniert er auch bei sehr hohem Anrufvolumen in Regensburg?", answer: "Ja, der Assistent skaliert automatisch. Auch wenn in der Tourismussaison oder am Montagmorgen viele Anrufe gleichzeitig eingehen – es gibt keine Wartezeit und keinen Qualitätsverlust." },
      { question: "Kann er Anrufe auf verschiedene Mitarbeiter weiterleiten?", answer: "Ja, Weiterleitungsregeln können flexibel konfiguriert werden – nach Thema, nach Uhrzeit, nach Mitarbeiter oder nach Verfügbarkeit." },
      { question: "Was passiert bei einem technischen Ausfall?", answer: "Es gibt immer einen Fallback: Entweder wird auf eine Backup-Nummer weitergeleitet oder der Anrufer hört eine klar formulierte Ansage. Kein Anruf geht verloren." },
      { question: "Ist der Assistent DSGVO-konform?", answer: "Ja. Alle Gesprächsdaten werden ausschließlich auf europäischen Servern verarbeitet. Wir stellen die notwendigen Datenschutzdokumente bereit und unterstützen bei der DSGVO-Dokumentation." },
      { question: "Können wir den Assistenten vor dem Kauf testen?", answer: "Ja. Im Rahmen des Erstgesprächs können wir eine Demo-Konfiguration für Ihren spezifischen Use Case in Regensburg zeigen." },
      { question: "Was kostet der KI Telefonassistent in Regensburg?", answer: "Die Kosten richten sich nach Anrufvolumen und Konfigurationskomplexität. Nach dem Erstgespräch erhalten Sie ein transparentes Festpreisangebot." },
      { question: "Wie unterscheidet sich der KI Telefonassistent von einer klassischen Telefonanlage?", answer: "Eine klassische Anlage leitet weiter und nimmt auf – ohne zu verstehen. Der KI Telefonassistent führt echte Gespräche: er antwortet, fragt nach, bucht Termine und gibt Auskunft. Ohne Tastenmenü, ohne starre Anweisung." },
    ],
    localChallenges: [
      "Regensburgs wachsende Wirtschaft und der starke Tourismus bringen mehr Anrufvolumen – aber keinen entsprechenden Zuwachs an Telefonpersonal",
      "Universität und Tourismus sorgen für Anfragen zu ungewöhnlichen Zeiten – abends, am Wochenende und außerhalb der regulären Öffnungszeiten",
      "Fachkräftemangel macht zuverlässige manuelle Telefonkommunikation für viele Regensburger Betriebe zunehmend schwierig",
    ],
    industries: ["Arztpraxen & Kliniken", "Gastronomie & Hotels", "Physio & Therapie", "Handwerk & Betriebe", "Sport & Freizeit", "Tourismus & Stadtführungen", "Lokale Dienstleister"],
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
      description: "Prozessautomatisierung für Unternehmen in Regensburg: Cogniiq verbindet Ihre Tools, eliminiert manuelle Schritte und baut zuverlässige Workflows – dauerhaft wartbar, DSGVO-konform.",
      canonical: `${base}/regensburg/automatisierung`,
    },
    intro: {
      h1: "Automatisierung für Unternehmen in Regensburg",
      lead: "In Regensburg wächst der Mittelstand schnell – und damit auch die Komplexität interner Prozesse. Wir automatisieren Ihren Betrieb: von der Buchungsbestätigung bis zur CRM-Synchronisation, einmalig eingerichtet und dauerhaft entlastend.",
    },
    localIntro: {
      paragraphs: [
        "Regensburg ist ein bedeutender Wirtschaftsstandort in Bayern: Industrie, Mittelstand, Dienstleistung, Gastronomie und Tourismus prägen die Stadt gleichermaßen. Viele dieser Unternehmen sind in den letzten Jahren schnell gewachsen – und haben dabei eine IT-Landschaft aufgebaut, die nicht mitwächst: Insellösungen, die nicht miteinander kommunizieren, manuelle Prozesse, die täglich Zeit kosten, und Daten, die mehrfach erfasst werden weil es keine automatische Synchronisation gibt.",
        "Cogniiq löst dieses Problem mit gezielter Prozessautomatisierung: Wir analysieren, welche Abläufe in Ihrem Regensburger Unternehmen automatisiert werden können und welche Tools sich dafür eignen. Das Ergebnis sind stabile, wartbare Workflows auf Basis von n8n oder Make.com, die im Hintergrund laufen – ohne dass jemand täglich daran denken muss.",
        "Von der automatischen Buchungsbestätigung für Regensburger Gastronomiebetriebe über die CRM-Synchronisation für B2B-Dienstleister bis zur automatisierten Rechnungsstellung für Handwerksbetriebe: Wir automatisieren den Prozess, der Ihnen am meisten Zeit kostet – und bauen es so, dass es mit Ihrem Unternehmen wachsen kann.",
      ],
    },
    warumCogniiq: [
      "Unabhängige Technologieberatung: wir empfehlen das Tool, das wirklich zu Ihrer Infrastruktur passt",
      "Wartbare Lösungen mit klarer Dokumentation – keine proprietären Black-Box-Workflows",
      "Skalierbar aufgebaut: was heute 10 Prozesse automatisiert, kann morgen 50 abdecken",
      "Vollständig DSGVO-konform – alle Automatisierungen entsprechen europäischen Datenschutzstandards",
      "Remote-Betreuung und schnelle Reaktionszeiten bei Anpassungen und Änderungen",
      "Schrittweise Einführung: erst ein Prozess, dann mehr – kein Alles-oder-Nichts",
    ],
    useCases: [
      {
        industry: "Mittelstand & Industrie",
        title: "ERP- und CRM-Integration",
        description: "Bestellungen, Kundendaten und Rechnungen fließen automatisch zwischen Ihren Systemen in Regensburg. Keine manuelle Übertragung, keine verlorenen Datensätze, keine Doppelerfassung.",
      },
      {
        industry: "Gastronomie & Veranstaltungen",
        title: "Event-Buchungen und Bestätigungen",
        description: "Automatische Buchungsbestätigungen, Kapazitätsprüfung und Erinnerungen für Gäste – alles ohne Personalaufwand. Für Regensburger Restaurants und Veranstaltungsorte besonders relevant in der Hochsaison.",
      },
      {
        industry: "Dienstleistung & Beratung",
        title: "Onboarding neuer Kunden",
        description: "Von der ersten Anfrage bis zur Willkommensnachricht läuft alles automatisch – Verträge, Zugänge, Terminvereinbarungen. Kein manuelles Aufwand für Ihr Team beim Start eines neuen Projekts.",
      },
    ],
    processSteps: [
      { number: "01", title: "Kennenlernen & Zieldefinition", description: "Welche Abläufe kosten täglich die meiste Zeit? Wir analysieren Ihre Workflows und priorisieren nach dem größten ROI-Potenzial." },
      { number: "02", title: "Konzept & Angebot", description: "Wir skizzieren die Automatisierung: Tools, Datenflüsse, Triggerbedingungen und Fehlerbehandlung. Sie sehen das Konzept bevor wir starten." },
      { number: "03", title: "Umsetzung & Feinschliff", description: "Entwicklung in einer Testumgebung mit echten Datensätzen. Keine Live-Experimente – Sie sehen und testen alles vor dem Deployment." },
      { number: "04", title: "Go-Live & Optimierung", description: "Deployment, vollständige Dokumentation und Einweisung Ihres Teams. Optional mit Monitoring und Support-Vertrag für laufende Betreuung." },
    ],
    faq: [
      { question: "Für welche Unternehmensgröße lohnt sich Automatisierung in Regensburg?", answer: "Ab etwa 3–5 Mitarbeitern gibt es fast immer Prozesse, die sich lohnen zu automatisieren und sich schnell amortisieren. Wir schauen uns das im Erstgespräch gemeinsam an." },
      { question: "Müssen wir unsere bestehende Software wechseln?", answer: "Nein. Wir integrieren, was bereits vorhanden ist. Nur wenn ein Tool objektiv besser für Ihren Use Case wäre, empfehlen wir es – ohne Verkaufsdruck." },
      { question: "Wie schnell sind ROI-Ergebnisse sichtbar?", answer: "Einfache Automatisierungen zahlen sich oft innerhalb von 4–8 Wochen aus. Komplexere Projekte mit größerem Scope zeigen Ergebnisse über einen längeren Zeitraum." },
      { question: "Was kostet ein Automatisierungsprojekt in Regensburg?", answer: "Abhängig vom Umfang. Erste Workflows ab ca. 500 €, komplexere Integrationen nach Aufwand. Erstgespräch und Einschätzung sind immer kostenlos." },
      { question: "Können wir selbst Änderungen an den Workflows vornehmen?", answer: "Ja. Wir dokumentieren vollständig und schulen Ihr Team. Einfache Änderungen können Sie selbst machen – für komplexere Anpassungen sind wir erreichbar." },
      { question: "Was passiert wenn eine Automatisierung fehlschlägt?", answer: "Fehlerbenachrichtigungen sind standardmäßig eingebaut. Kritische Prozesse haben immer einen manuellen Fallback. Niemand verliert Daten durch einen fehlgeschlagenen Workflow." },
      { question: "Arbeitet ihr auch mit spezifischen Regensburger Branchenlösungen?", answer: "Ja. Ob branchenspezifische ERP-Systeme, regionale Buchungsplattformen oder Regensburger Lieferantenportale – wir prüfen die verfügbaren APIs und finden eine Lösung." },
    ],
    localChallenges: [
      "Regensburger KMU haben oft gewachsene IT-Landschaften mit vielen Insellösungen, die nicht automatisch miteinander kommunizieren",
      "Das starke Wirtschaftswachstum in der Region erfordert mehr Effizienz – ohne sofort neue Mitarbeiter einzustellen",
      "Manuelle Datenpflege zwischen verschiedenen Systemen führt zu Fehlern, Zeitverlust und gelegentlich zu Kundenfrustration",
    ],
    industries: ["Industrie & Fertigung", "Mittelstand & B2B", "Gastronomie & Hotels", "Dienstleistung", "Logistik", "Handwerk", "Beratung & Recht"],
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
      title: "Webdesign Agentur Regensburg – Professionelle Websites für lokale Unternehmen | Cogniiq",
      description: "Individuelle Websites für Unternehmen in Regensburg: technisch sauber, schnell, lokal SEO-optimiert und auf Conversion ausgerichtet. Kein Baukastensystem – entwickelt von Cogniiq.",
      canonical: `${base}/regensburg/webdesign`,
    },
    intro: {
      h1: "Webdesign Agentur in Regensburg",
      lead: "Regensburg hat viel zu bieten – Ihre Website sollte das widerspiegeln. Wir entwickeln professionelle, schnelle und konversionsorientierte Websites für Unternehmen in Regensburg: individuell konzipiert, technisch erstklassig und mit lokalem SEO-Fokus.",
    },
    localIntro: {
      paragraphs: [
        "Regensburg ist eine Stadt, in der sich digitales Suchverhalten besonders ausgeprägt zeigt: Studenten, Touristen und Geschäftsreisende recherchieren Restaurants, Dienstleister und Praxen fast ausschließlich online. Gleichzeitig suchen lokale Regensburger nach handwerklichen Betrieben, Praxen und Beratungsdienstleistern – und entscheiden auf Basis des ersten digitalen Eindrucks, wen sie kontaktieren.",
        "Cogniiq entwickelt Websites für Regensburg, die in dieser Entscheidung gewinnen: Schnell laden, klar strukturiert, für mobile Geräte optimiert und auf die spezifischen Suchanfragen in Regensburg ausgerichtet. Kein generisches Template, das wie hundert andere aussieht – sondern eine Website, die Ihr Unternehmen so präsentiert, wie es in Regensburg wahrgenommen werden soll.",
        "Von der Tourismus-Website, die internationale Gäste anspricht, bis zur Unternehmens-Website, die lokale B2B-Anfragen generiert: Wir verstehen die unterschiedlichen Anforderungen des Regensburger Markts und setzen sie technisch und gestalterisch präzise um. Mit SEO von Anfang an – nicht als Nachgedanke.",
      ],
    },
    warumCogniiq: [
      "Keine Templates – jede Regensburger Website wird individuell konzipiert und entwickelt",
      "Mobile-First: über 70% Ihrer Besucher kommen vom Smartphone – wir optimieren dafür",
      "Technische Performance: Core Web Vitals, schnelle Ladezeiten, sauber strukturierter Code",
      "Lokaler SEO-Fokus: Ihre Website soll bei Suchanfragen in Regensburg und Umgebung sichtbar sein",
      "Klare Kommunikation ohne Agentur-Buzzwords: Sie wissen immer, woran wir sind und was als nächstes kommt",
      "Support und Änderungen nach dem Launch – keine Zusatzverträge für kleine Anpassungen",
    ],
    useCases: [
      {
        industry: "Tourismus & Gastronomie",
        title: "Website für Regensburgs Tourismus-Wirtschaft",
        description: "Hotels, Restaurants und touristische Anbieter in Regensburg brauchen Websites, die Gäste informieren, auf Englisch funktionieren und direkt zur Buchung oder Reservierung führen.",
      },
      {
        industry: "Mittelstand & B2B",
        title: "Unternehmens-Website mit Leadgenerierung",
        description: "B2B-Unternehmen in Regensburg brauchen Websites, die Kompetenz ausstrahlen und qualifizierte Anfragen generieren – keine bloße Imagebroschüre im Web-Format.",
      },
      {
        industry: "Gesundheit & Praxen",
        title: "Praxis-Website mit Vertrauen und Struktur",
        description: "Patienten in Regensburg informieren sich online bevor sie eine Praxis kontaktieren. Ihre Website muss Vertrauen aufbauen und die Kontaktaufnahme so einfach wie möglich machen.",
      },
    ],
    processSteps: [
      { number: "01", title: "Kennenlernen & Zieldefinition", description: "Ziele, Zielgruppe, Wettbewerber und bestehende Materialien – wir verstehen Ihr Unternehmen in Regensburg bevor wir anfangen zu konzipieren." },
      { number: "02", title: "Konzept & Angebot", description: "Seitenstruktur, Design und Texte entstehen iterativ in enger Abstimmung mit Ihnen. Sie sind in jeden Schritt eingebunden." },
      { number: "03", title: "Umsetzung & Feinschliff", description: "Technische Umsetzung mit Performance-Fokus. Sie sehen die Website in einer Vorschau-Umgebung und geben Feedback vor dem Launch." },
      { number: "04", title: "Go-Live & Optimierung", description: "Live-Schaltung, SEO-Setup für Regensburg, Analytics-Einrichtung und erste Optimierungen auf Basis der Nutzungsdaten nach dem Launch." },
    ],
    faq: [
      { question: "Könnt ihr auch bestehende Regensburger Websites übernehmen?", answer: "Ja. Wir analysieren, was vorhanden ist, und schlagen den optimalen Weg vor: gezieltes Redesign, vollständiger Relaunch oder gezielte Optimierung einzelner Seiten." },
      { question: "Wie lange dauert ein Webdesign-Projekt in Regensburg?", answer: "4–8 Wochen für einfachere Projekte, 8–12 Wochen für komplexere. Nach dem Briefing erhalten Sie einen realistischen Zeitplan." },
      { question: "Was kostet eine Website für ein Regensburger Unternehmen?", answer: "Ab ca. 2.500 € für einfache Unternehmenswebsites, komplexere Projekte nach Aufwand. Erstgespräch und Einschätzung sind immer kostenlos." },
      { question: "Baut ihr auf WordPress oder individuellem Code?", answer: "Beides. WordPress für pflegeleichte Inhalte, individuelle Entwicklung mit React/Next.js für komplexe Anforderungen oder hohe Performance-Anforderungen." },
      { question: "Macht ihr auch Texte und Fotografie?", answer: "Texte erstellen wir gemeinsam oder mit KI-Unterstützung. Für Fotografie arbeiten wir mit einem Netzwerk aus lokalen Fotografen zusammen – auf Wunsch auch in Regensburg." },
      { question: "Bietet ihr auch Wartung und Pflege an?", answer: "Ja. Auf Wunsch übernehmen wir laufende Updates, Sicherheitsupdates und Inhaltsänderungen. Alternativ schulen wir Ihr Team, damit Sie selbst Änderungen vornehmen können." },
      { question: "Kann meine Website auf Englisch sein?", answer: "Ja. Mehrsprachige Websites sind möglich – besonders für Regensburger Unternehmen mit internationalem Publikum aus Tourismus oder Universität." },
    ],
    localChallenges: [
      "Viele Regensburger Unternehmen verlieren potenzielle Kunden durch schlechte oder veraltete Websites, die auf Smartphones nicht funktionieren",
      "Tourismus und Universität bringen viele Neuzuzügler und internationale Besucher, die sich ausschließlich online informieren und hohe Ansprüche an Webdesign haben",
      "Die lokale Konkurrenz in Regensburg wächst – wer digital nicht sichtbar ist, verliert täglich Marktanteile an besser aufgestellte Mitbewerber",
    ],
    industries: ["Tourismus & Hotels", "Gastronomie & Restaurants", "Arztpraxen & Gesundheit", "Mittelstand & B2B", "Handwerk & Betriebe", "Einzelhandel", "Sport & Wellness"],
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
      description: "KI-gestützte Telefonkommunikation für Unternehmen in München: automatische Anrufannahme, Terminbuchung und Weiterleitung – rund um die Uhr, ohne Mehrpersonal, DSGVO-konform.",
      canonical: `${base}/muenchen/ki-telefonassistent`,
    },
    intro: {
      h1: "KI Telefonassistent für Unternehmen in München",
      lead: "München ist ein Wettbewerbsmarkt. Unternehmen, die Anrufe zuverlässig und schnell beantworten, gewinnen Kunden gegenüber denen, die nicht abheben. Unser KI Telefonassistent übernimmt die Telefonkommunikation – präzise, rund um die Uhr, ohne Personalaufwand.",
    },
    localIntro: {
      paragraphs: [
        "München ist einer der dynamischsten Dienstleistungsmärkte Deutschlands – und einer der wettbewerbsintensivsten. Privatpraxen, Restaurants, Beratungsunternehmen, Immobilienbüros und zahlreiche weitere Dienstleister konkurrieren täglich um dieselben Kunden. In diesem Umfeld ist ein nicht beantworteter Anruf nicht nur ein verpasster Kontakt – er ist ein verlorener Kunde, der in 30 Sekunden beim nächsten Anbieter anruft.",
        "Der KI Telefonassistent von Cogniiq ist für genau dieses Szenario entwickelt: Er beantwortet jeden eingehenden Anruf sofort – egal ob 8 Uhr morgens, 21 Uhr abends oder am Wochenende. Häufige Fragen werden präzise beantwortet, Termine werden direkt ins Buchungssystem eingetragen, komplexe Anliegen werden strukturiert weitergeleitet. Mehrsprachige Konfiguration ist auf Anfrage möglich – für Münchner Unternehmen mit internationaler Kundschaft.",
        "Cogniiq betreut Münchner Projekte vollständig remote – transparent, effizient und ohne die hohen Kosten einer lokalen Münchner Agentur. Einrichtung in 7–14 Tagen, vollständig DSGVO-konform, persönliche Betreuung durch unser Team.",
      ],
    },
    warumCogniiq: [
      "Keine Münchner Agenturpreise – transparente Kosten ohne Overhead",
      "Vollständige Remote-Einrichtung und Konfiguration – kein Vor-Ort-Termin nötig",
      "Mehrsprachige Konfiguration möglich – Deutsch und Englisch auf Anfrage",
      "Datenschutz nach DSGVO, Hosting ausschließlich in Deutschland",
      "Persönliche Betreuung und direkte Erreichbarkeit – kein Callcenter, kein Ticket-System",
      "Erfahrung aus vergleichbaren Projekten in Bayern – kein Neuland",
    ],
    useCases: [
      {
        industry: "Privatpraxen & Spezialisten",
        title: "24/7 Terminannahme ohne Mehrkosten",
        description: "Privatpatienten in München erwarten schnelle Reaktionszeiten. Der Assistent nimmt rund um die Uhr Terminanfragen entgegen, trägt sie ins Buchungssystem ein und sendet Bestätigungen.",
      },
      {
        industry: "Gastronomie & Events",
        title: "Reservierungen ohne Unterbrechung des Serviceteams",
        description: "Münchner Restaurants und Event-Locations haben hohes Reservierungsvolumen. Der Assistent entlastet das Personal dauerhaft – besonders an Stoßzeiten, Feiertagen und am Wochenende.",
      },
      {
        industry: "Beratung & Dienstleistung",
        title: "Erstanfragen strukturiert erfassen",
        description: "Münchner Beratungsunternehmen profitieren davon, wenn Erstanfragen qualifiziert erfasst und weitergeleitet werden – bevor ein Berater persönliche Zeit investiert.",
      },
    ],
    processSteps: [
      { number: "01", title: "Kennenlernen & Zieldefinition", description: "Remote-Gespräch über Ihre Anruftypen, Ihre Branche und Ihre Erwartungen. Welche Fragen kommen, welche Antworten brauchen Sie, wie soll der Assistent für München klingen?" },
      { number: "02", title: "Konzept & Angebot", description: "Aufbau des Gesprächsdesigns und der Weiterleitungslogik – spezifisch auf Ihr Münchner Unternehmen. Schriftliches Festpreisangebot ohne Überraschungen." },
      { number: "03", title: "Umsetzung & Feinschliff", description: "Testläufe mit echten Szenarien. Sie hören den Assistenten und geben Feedback – wir optimieren bis es passt." },
      { number: "04", title: "Go-Live & Optimierung", description: "Inbetriebnahme auf Ihrer Münchner Rufnummer. Monitoring und Optimierung in den ersten Wochen inklusive." },
    ],
    faq: [
      { question: "Könnt ihr Projekte in München vollständig remote betreuen?", answer: "Ja, vollständig. Die Einrichtung, Konfiguration und laufende Betreuung erfolgt remote. Persönliche Termine in München sind auf Anfrage möglich." },
      { question: "Kann der Assistent auf Englisch sprechen?", answer: "Ja. Mehrsprachige Konfigurationen sind möglich – z.B. Deutsch als Standard, Englisch auf Anfrage des Anrufers. Besonders für internationale Kundschaft in München relevant." },
      { question: "Wie unterscheidet sich der Münchner Markt?", answer: "Höheres Anrufvolumen, höhere Erwartungen an Reaktionsgeschwindigkeit, oft internationales Publikum. Der Assistent ist für alle diese Szenarien konfigurierbar." },
      { question: "Was kostet der Assistent für ein Münchner Unternehmen?", answer: "Gleich wie überall: transparent, auf Basis von Anrufvolumen und Komplexität. Kein Münchner Aufschlag – keine versteckten Agenturen-Overhead-Kosten." },
      { question: "Ist die Technologie stabil genug für das hohe Volumen in München?", answer: "Ja. Die Plattformen sind für sehr hohes Volumen ausgelegt und laufen auch bei vielen parallel eingehenden Anrufen ohne Qualitätsverlust." },
      { question: "Wie schnell ist die Einrichtung für ein Münchner Unternehmen?", answer: "7–14 Tage nach dem ersten Gespräch ist der Assistent typischerweise live – komplett remote und ohne Vor-Ort-Termine." },
      { question: "Habt ihr Referenzen aus München?", answer: "Wir arbeiten für Unternehmen in Bayern mit ähnlichen Anforderungen wie Münchner Betriebe. Auf Anfrage teilen wir Referenzprojekte aus vergleichbaren Branchen." },
      { question: "Was passiert, wenn der Assistent eine komplexe Münchner Anfrage nicht versteht?", answer: "Er leitet den Anruf weiter oder nimmt eine strukturierte Nachricht entgegen. Sie legen fest, was in welchem Fall passiert – und wir konfigurieren das entsprechend." },
    ],
    localChallenges: [
      "München hat einen der dichtesten Dienstleistungsmärkte in Deutschland – wer Anrufe nicht sofort beantwortet, verliert Kunden in Sekunden an direkten Konkurrenten",
      "Personalkosten in München sind die höchsten in Deutschland – Telefonpersonal ist teuer und schwer zu finden und zu halten",
      "Internationales Publikum erwartet mehrsprachigen Service auch per Telefon – auf Englisch, manchmal auch auf anderen Sprachen",
    ],
    industries: ["Privatpraxen & Kliniken", "Gastronomie & Luxury Dining", "Beratung & Finanzdienstleistung", "Sport & Wellness", "Hotels & Hospitality", "Immobilien & Makler"],
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
    locationNote: "Cogniiq betreut Automatisierungsprojekte für Unternehmen in München vollständig remote – ohne Qualitätseinbußen.",
    seo: {
      title: "Automatisierung Agentur München – n8n & Make.com Workflows | Cogniiq",
      description: "Prozessautomatisierung für Unternehmen in München: Cogniiq verbindet Tools, eliminiert manuelle Prozesse und liefert wartbare Workflows. Remote, schnell, zuverlässig. Kein Münchner Overhead.",
      canonical: `${base}/muenchen/automatisierung`,
    },
    intro: {
      h1: "Automatisierung für Unternehmen in München",
      lead: "Münchner Unternehmen wachsen schnell – und mit ihnen die Komplexität interner Prozesse. Wir automatisieren das, was täglich Zeit kostet: Leadverarbeitung, Buchungen, Datensynchronisation, Reporting. Remote betreut, dauerhaft wartbar.",
    },
    localIntro: {
      paragraphs: [
        "München ist ein besonderer Markt für Prozessautomatisierung: Startups, die schnell skalieren und von Anfang an skalierbare Prozesse brauchen. Mittelständische Unternehmen, die gewachsen sind und nun mit einer Vielzahl von Tools und manuellen Prozessen kämpfen. Konzerne, die einzelne Abteilungen digitalisieren wollen, ohne das große IT-Projekt anzufassen. Für alle drei Segmente bietet Cogniiq Lösungen.",
        "Wir automatisieren Prozesse in Münchner Unternehmen vollständig remote – mit denselben Tools und demselben Qualitätsanspruch wie eine lokale Münchner Agentur, aber ohne den entsprechenden Overhead. n8n und Make.com sind unsere primären Plattformen für stabile, wartbare Workflows. Bei komplexen ERP-Integrationen oder spezifischen API-Anforderungen bauen wir direkte Schnittstellen.",
        "Das Ergebnis: Leads, die automatisch qualifiziert ins CRM wandern. Bestellungen, die Lager-Updates und Versandmeldungen triggern. Reports, die sich selbst erstellen. Onboarding-Prozesse, die ohne manuelle Eingriffe ablaufen. Und ein Team in München, das sich auf die Arbeit konzentrieren kann – statt auf repetitive Datenpflege.",
      ],
    },
    warumCogniiq: [
      "Kein Münchner Agentur-Overhead – direkte Zusammenarbeit ohne große Hierarchien",
      "Technologieoffene Beratung: n8n, Make.com, Zapier, direkte APIs – je nach Ihrem Bedarf",
      "Saubere Dokumentation, die Ihr Münchner Team versteht und selbst nutzen kann",
      "DSGVO-konforme Verarbeitung, Hosting in Europa – keine Kompromisse beim Datenschutz",
      "Erfahrung mit Skalierung: von 5 bis 500 automatisierten Prozessen pro Monat",
      "Schnelle Reaktionszeiten bei Änderungen und Support – auch für Münchner Unternehmen",
    ],
    useCases: [
      {
        industry: "Startups & Scale-ups",
        title: "Automatisches Lead-Nurturing",
        description: "Neue Leads aus verschiedenen Quellen landen qualifiziert im CRM, erhalten automatische Follow-ups und werden den richtigen Vertriebsmitarbeitern zugewiesen – ohne manuelle Eingriffe.",
      },
      {
        industry: "Mittelstand & Konzerne",
        title: "System-Integrationen ohne Entwickler",
        description: "ERP, CRM, Marketing-Tools und Buchhaltung tauschen Daten automatisch aus – keine manuellen Importe, keine Doppelerfassung, keine Fehler bei der Übertragung.",
      },
      {
        industry: "E-Commerce & Retail",
        title: "Bestell- und Lagermanagement",
        description: "Bestellungen triggern automatisch Lager-Updates, Versandmeldungen und Kundenkommunikation – ohne manuelle Eingriffe, skalierbar für hohes Volumen.",
      },
    ],
    processSteps: [
      { number: "01", title: "Kennenlernen & Zieldefinition", description: "Remote-Workshop: Welche Prozesse fressen in Ihrem Münchner Unternehmen die meiste Zeit? Wir priorisieren nach ROI-Potenzial und starten dort." },
      { number: "02", title: "Konzept & Angebot", description: "Datenfluss-Diagramm, Tool-Auswahl und Risikobewertung. Kein Blind-Start – Sie sehen das Konzept und stimmen zu, bevor wir entwickeln." },
      { number: "03", title: "Umsetzung & Feinschliff", description: "Aufbau in einer Testumgebung, Abnahme durch Ihr Team, dann Deployment. Keine Live-Experimente." },
      { number: "04", title: "Go-Live & Optimierung", description: "Vollständige Dokumentation, Einweisung Ihres Teams und optional laufender Support-Vertrag für Münchner Unternehmen." },
    ],
    faq: [
      { question: "Können wir als Münchner Unternehmen vollständig remote zusammenarbeiten?", answer: "Ja, vollständig. Alle Projektphasen laufen remote – via Video-Calls, geteilten Boards und Dokumenten. Der Prozess ist identisch mit einer lokalen Zusammenarbeit." },
      { question: "Wie unterscheiden sich eure Preise von Münchner Agenturen?", answer: "Wir haben keinen Münchner Overhead. Faire Preise, direkte Zusammenarbeit ohne mehrere Projektmanagement-Ebenen zwischen Ihnen und dem Entwickler." },
      { question: "Habt ihr Erfahrung mit der Skalierung für Münchner Unternehmen?", answer: "Ja. Wir bauen Automatisierungen von Anfang an so, dass sie mit Ihrem Unternehmen mitwachsen können – ohne später komplett neu gebaut werden zu müssen." },
      { question: "Können komplexe ERP-Systeme integriert werden?", answer: "In den meisten Fällen ja. Wir prüfen vorab, welche APIs verfügbar sind, und was technisch machbar ist. Wenn nötig, entwickeln wir eigene Konnektoren." },
      { question: "Was wenn sich unsere Prozesse in München ändern?", answer: "Wir passen die Automatisierungen an. Durch saubere Dokumentation können einfache Änderungen auch intern vorgenommen werden." },
      { question: "Wie lange dauert ein Automatisierungsprojekt in München?", answer: "Einfache Workflows: 1–2 Wochen. Komplexe ERP-Integrationen: 4–8 Wochen. Realistischer Zeitplan nach der Analyse – immer." },
      { question: "Welche Branchen in München betreut ihr schwerpunktmäßig?", answer: "Startups und Scaleups, E-Commerce, Beratung, Finanzdienstleistung und Mittelstand. Wir passen uns an Ihre Branchenanforderungen an – auch in sehr spezifischen Nischen." },
    ],
    localChallenges: [
      "Münchner Unternehmen zahlen die höchsten Personalkosten in Deutschland – Automatisierung amortisiert sich schneller als irgendwo anders",
      "Viele Münchner KMU und Startups haben bereits viele Tools im Einsatz, die nicht miteinander kommunizieren und manuelle Brücken erfordern",
      "Schnell wachsende Münchner Teams brauchen skalierbare Prozesse, bevor manuelle Arbeit zum Engpass für das gesamte Wachstum wird",
    ],
    industries: ["Startups & Scaleups", "Mittelstand & KMU", "E-Commerce & Retail", "Finanzdienstleistung", "Consulting & Beratung", "Medizintechnik", "SaaS-Unternehmen"],
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
      description: "Individuelle Websites für Unternehmen in München: technisch sauber, schnell, SEO-optimiert. Kein Template, kein Baukastensystem – Qualität auf Enterprise-Niveau, faire Preise.",
      canonical: `${base}/muenchen/webdesign`,
    },
    intro: {
      h1: "Webdesign für Unternehmen in München",
      lead: "München hat viele Webdesign-Agenturen – und viele von ihnen haben entsprechende Preise. Wir bieten dasselbe Niveau an Qualität und technischem Anspruch, ohne den Münchner Overhead: individuelle Entwicklung, lokaler SEO-Fokus, faire Preise.",
    },
    localIntro: {
      paragraphs: [
        "München ist ein digitaler Wettbewerbsmarkt: Startups, Mittelständler und Konzerne konkurrieren um dieselben Kunden, und ihre Websites müssen sowohl visuell als auch technisch auf höchstem Niveau sein. Gleichzeitig ist München einer der teuersten Märkte für Agenturen – was sich direkt in den Preisen für Webprojekte niederschlägt. Viele Unternehmen zahlen mehr für Projektmanagement-Overhead als für die eigentliche Entwicklung.",
        "Cogniiq bietet Münchner Unternehmen eine Alternative: Entwicklung auf Enterprise-Niveau, ohne den Münchner Agentur-Overhead. Direkte Zusammenarbeit mit dem Entwickler, der Ihre Website baut – keine drei Hierarchieebenen zwischen Ihrem Feedback und der Umsetzung. Individuelle Konzeption, technische Präzision und SEO von Anfang an – für dasselbe Budget, das bei einer lokalen Münchner Agentur oft nur für ein einfaches Design reicht.",
        "Ob Startup, das sich für internationale Investoren und Kunden positionieren will, Mittelständler, der qualifizierte B2B-Anfragen generieren möchte, oder Premium-Dienstleister im Münchner Markt – wir entwickeln Websites, die in diesem Wettbewerbsumfeld bestehen und sichtbar sind.",
      ],
    },
    warumCogniiq: [
      "Enterprise-Qualität ohne Enterprise-Preis – kein Münchner Agentur-Overhead",
      "Individuelle Entwicklung – kein Einheitslook, keine Copy-Paste-Templates",
      "Technischer Fokus: Performance, Core Web Vitals, sicherem Code",
      "SEO für den Münchner Markt von Beginn an – keine nachträglichen Korrekturen",
      "Remote-Zusammenarbeit, die reibungslos funktioniert – transparent und effizient",
      "Support und Anpassungen nach dem Launch – ohne Wartungsverträge für Kleinigkeiten",
    ],
    useCases: [
      {
        industry: "Startups & Tech-Unternehmen",
        title: "Hochwertige Unternehmens-Website",
        description: "Münchner Startups brauchen Websites, die Investoren, Kunden und Talente ansprechen – visuell stark, technisch sauber und auf internationales Publikum ausgerichtet.",
      },
      {
        industry: "Mittelstand & B2B",
        title: "Lead-generierende Unternehmenswebsite",
        description: "B2B-Unternehmen in München brauchen Websites, die Kompetenz kommunizieren und qualifizierte Anfragen generieren – nicht nur Präsenz zeigen.",
      },
      {
        industry: "Luxury & Premium-Segment",
        title: "Premium-Markenauftritt im Web",
        description: "Für Unternehmen im Premiumsegment in München: ein Webauftritt, der die Marke adäquat repräsentiert – ästhetisch und technisch auf höchstem Niveau, responsive und mehrsprachig.",
      },
    ],
    processSteps: [
      { number: "01", title: "Kennenlernen & Zieldefinition", description: "Remote-Workshop zu Zielen, Zielgruppen, Positionierung und bestehenden Materialien. Was soll die Website für Ihr Unternehmen in München erreichen?" },
      { number: "02", title: "Konzept & Angebot", description: "Seitenstruktur, Design und Texte entstehen iterativ in engem Austausch. Kein Übergeben von Dateien ohne Feedback-Schleifen." },
      { number: "03", title: "Umsetzung & Feinschliff", description: "Technische Umsetzung mit Performance-Fokus. Sie sehen die Website in einer Live-Vorschau und geben Feedback." },
      { number: "04", title: "Go-Live & Optimierung", description: "Live-Schaltung, Google-Setup, Analytics und Monitoring. Erste Optimierungen nach den ersten Nutzungsdaten." },
    ],
    faq: [
      { question: "Arbeitet ihr auch für größere Münchner Unternehmen?", answer: "Ja. Wir skalieren den Prozess entsprechend – von der einfachen Unternehmenswebsite bis zum komplexen Web-Projekt mit mehreren Teilseiten und Sprachen." },
      { question: "Was kostet eine Website für ein Münchner Unternehmen?", answer: "Dieselben fairen Preise wie überall: ab ca. 2.500 € für einfachere Projekte, komplexere nach Aufwand. Kein Münchner Aufpreis." },
      { question: "Könnt ihr mit Münchner Markenagenturen zusammenarbeiten?", answer: "Ja. Wir übernehmen gerne die technische Umsetzung von Designs, die von anderen Agenturen erstellt wurden – sauber, performant und SEO-optimiert." },
      { question: "Habt ihr Erfahrung mit SEO für den Münchner Markt?", answer: "Ja. Lokaler SEO für konkurrenzdichte Märkte wie München erfordert Strategie und technische Präzision. Wir beraten Sie dazu und setzen es direkt um." },
      { question: "Wie funktioniert die Remote-Zusammenarbeit mit einem Münchner Unternehmen?", answer: "Video-Calls, gemeinsame Figma-Boards, Staging-Umgebungen – der Prozess läuft identisch wie bei lokalen Agenturen, ohne Fahrtzeiten und ohne Pendelzeit." },
      { question: "Wie schnell kann eine Website für unser Münchner Unternehmen live gehen?", answer: "Einfachere Projekte in 4–6 Wochen, komplexere in 8–12 Wochen. Realistischer Zeitplan nach dem Briefing – immer." },
      { question: "Habt ihr ein Portfolio für den Münchner Markt?", answer: "Auf Anfrage zeigen wir relevante Referenzprojekte aus vergleichbaren Branchen und Märkten." },
      { question: "Könnt ihr Websites auch auf Englisch entwickeln?", answer: "Ja. Mehrsprachige Websites sind Standard für Münchner Unternehmen mit internationalem Publikum. Deutsch und Englisch gleichzeitig sind kein Problem." },
    ],
    localChallenges: [
      "Viele Münchner Agenturen verlangen Premium-Preise ohne entsprechend bessere Qualität – der Overhead frisst den Projektbetrag",
      "Der Münchner Markt ist kompetitiv und international geprägt – eine schwache oder langsame Website kostet täglich Neukunden",
      "Internationales Publikum in München erwartet englischsprachige Optionen und hochwertiges, zeitgemäßes Design",
    ],
    industries: ["Startups & Scaleups", "Luxury & Premium", "B2B-Dienstleistung", "Beratung & Consulting", "Medizintechnik & Health", "Immobilien", "Gastronomie & Hotels"],
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
