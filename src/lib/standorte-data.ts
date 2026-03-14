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

export interface IndustryBlock {
  name: string;
  problem: string;
  solution: string;
}

export interface LocalScenario {
  title: string;
  description: string;
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
  industriesExpanded: IndustryBlock[];
  localScenarios: LocalScenario[];
  sameServiceOtherCities: RelatedLink[];
  otherServicesInCity: RelatedLink[];
}

const base = BUSINESS_INFO.website;

export const CITY_SERVICE_CONFIGS: Record<string, CityServiceConfig> = {

  // ─── BAYREUTH / KI TELEFONASSISTENT ──────────────────────────────────────────
  "bayreuth/ki-telefonassistent": {
    city: "Bayreuth",
    citySlug: "bayreuth",
    service: "KI Telefonassistent",
    serviceSlug: "ki-telefonassistent",
    route: "/bayreuth/ki-telefonassistent",
    seo: {
      title: "KI Telefonassistent Bayreuth – AI Rezeption & Anrufannahme | Cogniiq",
      description: "KI Telefonassistent Bayreuth: Automatische Anrufannahme, Terminbuchung & Weiterleitung für lokale Unternehmen. DSGVO-konform, 24/7 erreichbar, Einrichtung in 7–14 Tagen.",
      canonical: `${base}/bayreuth/ki-telefonassistent`,
    },
    intro: {
      h1: "KI Telefonassistent in Bayreuth",
      lead: "Für Praxen, Restaurants und lokale Dienstleister in Bayreuth, die keine Anrufe mehr verpassen wollen. Der KI Telefonassistent übernimmt Terminannahme, Auskunft und Weiterleitung – rund um die Uhr, ohne Warteschleife, ohne zusätzliches Personal.",
    },
    localIntro: {
      paragraphs: [
        "Bayreuth ist eine lebendige Mittelstadt im Herzen Oberfrankens – geprägt von einem dichten Netz an Arztpraxen, Zahnarztpraxen, Physiotherapeuten, Gastronomie, Sport- und Freizeiteinrichtungen sowie einem breiten Spektrum lokaler Handwerksbetriebe und Dienstleister. Der gemeinsame Nenner dieser Branchen: täglich eingehende Anrufe, die wertvolle Arbeitszeit binden und oft unbeantwortet bleiben, sobald das Personal in Behandlungen, im Service oder im Kundengespräch ist.",
        "Genau für diese Lücke ist der KI Telefonassistent von Cogniiq entwickelt worden. Er übernimmt die telefonische Kommunikation vollständig oder ergänzt Ihr Team gezielt in den Zeiten, in denen kein Personal verfügbar ist – Montagmorgen, Mittagspause, nach Feierabend, am Wochenende. Anrufe werden professionell angenommen, häufige Fragen zu Öffnungszeiten, Preisen oder Verfügbarkeit werden sofort beantwortet, Termine werden direkt in Ihr Buchungssystem eingetragen, und komplexere Anliegen werden strukturiert an Ihr Team weitergeleitet.",
        "Für Unternehmen in Bayreuth bedeutet das konkret: kein verpasster Anruf mehr außerhalb der Öffnungszeiten, deutlich weniger Unterbrechungen des laufenden Betriebs und ein professioneller, konsistenter erster Eindruck für jeden Anrufer. Der Assistent klingt nicht wie ein Telefonmenü – er führt echte Gespräche, versteht Kontext und reagiert situationsangemessen.",
        "Die Einrichtung des KI Telefonassistenten in Bayreuth dauert 7–14 Tage und wird vollständig von Cogniiq übernommen. Es sind keine technischen Vorkenntnisse, keine neue Telefonanlage und keine dauerhaften Softwarelizenzen erforderlich. Sie arbeiten weiterhin mit Ihrer bestehenden Telefonnummer. Als Anbieter mit Hauptsitz in Bayreuth stehen wir für persönliche Betreuung und direkte Erreichbarkeit – kein Ticket-System, kein anonymes Support-Center.",
        "Ob Sie eine Arztpraxis in der Innenstadt führen, ein Restaurant rund um den Festspielpark betreiben oder einen Handwerksbetrieb im Umland von Bayreuth haben – der KI Telefonassistent ist auf Ihre spezifischen Anforderungen konfigurierbar. Die Lösung wächst mit Ihrem Betrieb und kann jederzeit angepasst werden, wenn sich Ihr Angebot, Ihre Öffnungszeiten oder Ihre Prozesse ändern. Auch unser Leistungsangebot für [Automatisierung in Bayreuth](/bayreuth/automatisierung) und [Webdesign in Bayreuth](/bayreuth/webdesign) kann nahtlos ergänzt werden.",
      ],
    },
    warumCogniiq: [
      "Einrichtung in 7–14 Tagen – kein monatelanger Einführungsprozess, kein Projektstress",
      "Konfiguration exakt auf Ihre Branche, Ihr Angebot und Ihren Betriebsablauf in Bayreuth",
      "Alle Gespräche werden protokolliert und als strukturierte Daten an Ihr Team weitergeleitet",
      "Keine teuren Telefonanlagen, keine neuen Nummern, keine dauerhaften Softwarelizenzen",
      "Persönlicher Ansprechpartner aus Bayreuth – direkter Kontakt, keine anonymen Tickets",
      "Vollständig DSGVO-konform – Verarbeitung ausschließlich auf europäischen Servern",
    ],
    useCases: [
      {
        industry: "Arztpraxis & Klinik",
        title: "Terminbuchung ohne Warteschleife",
        description: "Patienten rufen an, der Assistent prüft freie Termine, bucht direkt ins System und sendet eine Bestätigung. Das Praxisteam wird dauerhaft entlastet – besonders in Stoßzeiten morgens und mittags, wenn die Anmeldung ohnehin überlastet ist.",
      },
      {
        industry: "Sport & Padel",
        title: "Platzbuchungen & Kursanfragen",
        description: "Sportanlagen und Padel-Center in Bayreuth beantworten täglich dieselben Fragen zu Öffnungszeiten, freien Plätzen und Kursangeboten. Der Assistent übernimmt das vollautomatisch – auch abends und am Wochenende, wenn kein Personal vor Ort ist.",
      },
      {
        industry: "Gastronomie",
        title: "Reservierungen & Sonderanfragen",
        description: "Tischreservierungen entgegennehmen, Sondermenüs und Allergien kommunizieren, Stornierungen bearbeiten – ohne Ablenkung für das Serviceteam. Besonders in der Festspielzeit mit erhöhtem Besucheraufkommen in Bayreuth unverzichtbar.",
      },
    ],
    processSteps: [
      { number: "01", title: "Kennenlernen & Zieldefinition", description: "Wir besprechen Ihre typischen Anrufszenarien in Bayreuth: Welche Fragen kommen täglich? Welche Termine, welche Weiterleitungen brauchen Sie? Was soll der Assistent können – und was definitiv nicht?" },
      { number: "02", title: "Konzept & Angebot", description: "Gesprächsführung, Antwortinhalte und Eskalationsregeln werden gemeinsam entwickelt – passend zu Ihrem Betrieb in Bayreuth. Sie erhalten ein schriftliches Festpreisangebot ohne Überraschungen." },
      { number: "03", title: "Umsetzung & Feinschliff", description: "Einbindung in Ihre bestehende Telefonnummer, vollständige Konfiguration und Testläufe mit echten Szenarien. Sie hören den Assistenten selbst und geben Feedback vor dem Live-Gang." },
      { number: "04", title: "Go-Live & Optimierung", description: "Der Assistent ist aktiv. Wir begleiten die ersten Wochen aktiv, analysieren Gesprächsverläufe und optimieren, wo nötig. Sie haben jederzeit die volle Kontrolle über Konfiguration und Inhalte." },
    ],
    faq: [
      { question: "Klingt der KI Telefonassistent natürlich?", answer: "Ja. Aktuelle Sprachmodelle sind für die meisten Anrufer kaum von einem menschlichen Mitarbeiter zu unterscheiden. Stimme, Sprechgeschwindigkeit und Gesprächsstil werden individuell auf Ihren Betrieb in Bayreuth abgestimmt." },
      { question: "Was passiert, wenn der Assistent eine Frage nicht beantworten kann?", answer: "Er leitet den Anruf weiter oder nimmt eine strukturierte Nachricht entgegen. Sie legen im Vorfeld exakt fest, was in welchem Fall passiert – und wir konfigurieren das entsprechend." },
      { question: "Kann ich die Inhalte des Assistenten selbst anpassen?", answer: "Ja. Über ein einfaches Dashboard können Sie Antworten, Verfügbarkeiten und Weiterleitungsregeln selbst ändern. Für tiefere Anpassungen sind wir als Ihr Ansprechpartner in Bayreuth direkt erreichbar." },
      { question: "Ist der KI Telefonassistent DSGVO-konform?", answer: "Ja. Alle Gespräche werden ausschließlich auf europäischen Servern verarbeitet. Auf Wunsch erstellen wir die notwendigen AVV-Dokumente und unterstützen bei der Dokumentation für Ihren Datenschutzbeauftragten." },
      { question: "Welche Branchen in Bayreuth eignen sich am besten?", answer: "Besonders geeignet: Arztpraxen, Zahnarztpraxen, Physiotherapiepraxen, Gastronomie, Padel- und Sportanlagen, Handwerksbetriebe, Friseure, Kosmetikstudios und alle lokalen Dienstleister mit regelmäßigem Telefonaufkommen." },
      { question: "Was kostet der KI Telefonassistent in Bayreuth?", answer: "Die Kosten hängen von Anrufvolumen und Konfigurationskomplexität ab. Nach dem Erstgespräch erhalten Sie ein transparentes Festpreisangebot – ohne versteckte Kosten oder Lizenzgebühren für nicht genutzte Features." },
      { question: "Wie schnell ist der Assistent live?", answer: "In der Regel 7–14 Tage nach Projektstart. Bei einfachen Setups – z. B. nur Terminannahme und Weiterleitung – ist ein früherer Start möglich." },
      { question: "Was unterscheidet den KI Telefonassistenten von einem Chatbot?", answer: "Der KI Telefonassistent arbeitet mit gesprochener Sprache, versteht Kontext und führt natürliche Dialoge – kein starres Menüsystem, keine Tastennavigation. Er klingt und verhält sich wie ein echter Mitarbeiter am Telefon." },
      { question: "Können mehrere Standorte oder Leitungen gleichzeitig bedient werden?", answer: "Ja. Der Assistent skaliert automatisch – auch wenn mehrere Anrufe gleichzeitig eingehen, gibt es keine Warteschleife und keinen Qualitätsverlust." },
      { question: "Was passiert mit den aufgezeichneten Gesprächen?", answer: "Gespräche werden protokolliert und als strukturierte Zusammenfassung weitergeleitet – nicht als Rohaudio, falls nicht explizit gewünscht. Datenschutzkonform, löschbar, vollständig dokumentiert." },
      { question: "Kann der Assistent in bestehende Buchungssysteme integriert werden?", answer: "Ja. Wir integrieren gängige Buchungs- und Kalender-Tools. Welches System Sie nutzen, besprechen wir im Erstgespräch – und prüfen die Integrationsmöglichkeit vorab." },
      { question: "Wie unterscheidet sich Cogniiq von anderen Anbietern?", answer: "Als Anbieter mit Sitz in Bayreuth bieten wir persönliche Vor-Ort-Betreuung, schnelle Reaktionszeiten und Konfigurationen, die auf den lokalen Bayreuth-Kontext abgestimmt sind – nicht auf ein generisches Produkt für anonyme Massenanbieter." },
    ],
    localChallenges: [
      "Viele Betriebe in Bayreuth können Anrufe nicht durchgehend annehmen – besonders vor und nach Öffnungszeiten sowie in Stoßzeiten, wenn das Personal vollständig ausgelastet ist",
      "Der anhaltende Fachkräftemangel in Oberfranken erhöht den Druck auf bestehendes Personal: Jede Minute, die mit Standardanfragen verbracht wird, fehlt bei der eigentlichen Arbeit",
      "Gäste, Patienten und Kunden erwarten heute sofortige Antworten – eine nicht abgehobene Leitung oder eine lange Warteschleife wird direkt als Serviceproblem wahrgenommen und führt zu verlorenen Kunden",
    ],
    industries: ["Arztpraxen & Kliniken", "Zahnarztpraxen", "Physiotherapie & Heilpraktiker", "Gastronomie & Restaurants", "Padel & Sportanlagen", "Handwerk & Betriebe", "Lokale Dienstleister", "Wellness & Beauty"],
    industriesExpanded: [
      {
        name: "Arztpraxen & Zahnarztpraxen",
        problem: "Praxen in Bayreuth sind montags und nach Feiertagen mit Anrufspitzen konfrontiert, die das Praxispersonal erheblich belasten. Patienten, die nicht durchkommen, rufen beim nächsten Arzt an.",
        solution: "Der KI Telefonassistent nimmt Terminanfragen sofort entgegen, prüft Verfügbarkeiten und bucht direkt – rund um die Uhr, ohne Warteschleife. Das Praxisteam wird dauerhaft entlastet.",
      },
      {
        name: "Physiotherapie & Heilpraktiker",
        problem: "Praxen mit kleinen Teams haben oft niemanden, der dauerhaft ans Telefon gehen kann. Anfragen nach Feierabend oder zwischen Behandlungen gehen verloren.",
        solution: "Der Assistent übernimmt die Anrufannahme in therapiefreien Zeiten, nimmt Terminwünsche entgegen und sendet automatische Bestätigungen.",
      },
      {
        name: "Gastronomie & Restaurants",
        problem: "Restaurants in Bayreuth – besonders rund um die Festspielzeit – erhalten täglich viele Anfragen zu Reservierungen, Sondermenüs und Events. Das Serviceteam ist während des Betriebs nicht erreichbar.",
        solution: "Der Assistent nimmt Reservierungen entgegen, kommuniziert Menüoptionen und bearbeitet Stornierungen – ohne das Serviceteam zu unterbrechen.",
      },
      {
        name: "Padel & Sportanlagen",
        problem: "Sportanlagen beantworten täglich dieselben Fragen zu Platzverfügbarkeit, Öffnungszeiten und Kursbuchungen – eine monotone Aufgabe, die Personal bindet.",
        solution: "Der KI Telefonassistent beantwortet alle Standardanfragen vollautomatisch und bucht Plätze direkt ins System – auch am Abend und Wochenende.",
      },
      {
        name: "Handwerk & lokale Betriebe",
        problem: "Handwerksbetriebe in Bayreuth und dem Umland sind tagsüber auf der Baustelle oder beim Kunden – und verpassen dadurch Auftragsanfragen, die abends einfach an den Mitbewerber gehen.",
        solution: "Der Assistent nimmt Anfragen entgegen, qualifiziert das Anliegen und leitet strukturierte Nachrichten an den Betriebsinhaber weiter – kein verpasster Auftrag mehr.",
      },
      {
        name: "Wellness & Beauty",
        problem: "Kosmetikstudios und Friseursalons in Bayreuth erhalten Buchungsanfragen zu jeder Tageszeit, haben aber während der Behandlung keine Möglichkeit, ans Telefon zu gehen.",
        solution: "Der KI Telefonassistent bucht Termine automatisch in den Kalender ein und sendet Bestätigungen – ohne Unterbrechung der laufenden Behandlung.",
      },
    ],
    localScenarios: [
      {
        title: "Hausarztpraxis nahe dem Stadtpark",
        description: "Eine Allgemeinmedizin-Praxis in der Bayreuth Innenstadt erhält montags über 80 Anrufe vor 9 Uhr. Die Anmeldung ist chronisch überlastet. Nach Einführung des KI Telefonassistenten werden Termine automatisch gebucht, Standardfragen sofort beantwortet – das Praxisteam konzentriert sich auf die Patienten im Wartezimmer.",
      },
      {
        title: "Restaurant im Festspielviertel",
        description: "Ein Restaurant nahe dem Festspielhaus erhält in der Bayreuther Festspielzeit täglich Dutzende Reservierungsanfragen per Telefon – viele außerhalb der Öffnungszeiten. Der Assistent nimmt Reservierungen auch nachts entgegen und sendet automatische Bestätigungen, ohne dass Personal außerhalb der Betriebszeiten erreichbar sein muss.",
      },
      {
        title: "Physiotherapiepraxis im Gewerbegebiet",
        description: "Eine Physiotherapiepraxis mit drei Therapeuten hat niemanden, der dauerhaft Telefon abnimmt. Patienten erreichen die Praxis oft nicht und gehen zur Konkurrenz. Mit dem KI Telefonassistenten werden Anfragen auch während laufender Behandlungen professionell entgegengenommen und Termine direkt vergeben.",
      },
      {
        title: "Padel-Anlage am Stadtrand",
        description: "Eine Padel-Anlage erhält täglich viele Anrufe zu Platzbuchungen und Kursen. Statt einen Mitarbeiter dauerhaft ans Telefon zu binden, übernimmt der Assistent alle Standardkommunikation – und meldet sich nur bei komplexen Anfragen beim Team.",
      },
    ],
    sameServiceOtherCities: [
      { label: "KI-Telefonassistent Regensburg", href: "/regensburg/ki-telefonassistent" },
      { label: "KI-Telefonassistent München", href: "/muenchen/ki-telefonassistent" },
    ],
    otherServicesInCity: [
      { label: "Automatisierung Bayreuth", href: "/bayreuth/automatisierung" },
      { label: "Webdesign Bayreuth", href: "/bayreuth/webdesign" },
    ],
  },

  // ─── BAYREUTH / AUTOMATISIERUNG ──────────────────────────────────────────────
  "bayreuth/automatisierung": {
    city: "Bayreuth",
    citySlug: "bayreuth",
    service: "Automatisierung",
    serviceSlug: "automatisierung",
    route: "/bayreuth/automatisierung",
    seo: {
      title: "Automatisierung Bayreuth – Prozessautomatisierung & Workflows | Cogniiq",
      description: "Prozessautomatisierung für Unternehmen in Bayreuth: Workflows & API-Integrationen. Buchungen, CRM, Leads, Rechnungen automatisieren. Persönliche Betreuung vor Ort.",
      canonical: `${base}/bayreuth/automatisierung`,
    },
    intro: {
      h1: "Automatisierung für Unternehmen in Bayreuth",
      lead: "Wiederkehrende Prozesse kosten täglich Zeit und binden Personal, das Sie anderswo dringend brauchen. Mit gezielter Prozessautomatisierung – auf Basis maßgeschneiderter Workflows und direkter API-Integrationen – lösen wir diese Engpässe einmalig und dauerhaft.",
    },
    localIntro: {
      paragraphs: [
        "In Bayreuth arbeiten viele kleine und mittelständische Unternehmen – Handwerksbetriebe, Dienstleister, Arztpraxen, Gastronomie – mit gewachsenen Software-Landschaften, die über die Jahre entstanden sind. Das Ergebnis sind Systeme, die nicht miteinander kommunizieren: Daten werden manuell von einer Anwendung in die nächste übertragen, Buchungsbestätigungen per Hand verschickt, CRM-Einträge nach jedem Telefonat neu angelegt. Diese Prozesse kosten täglich Stunden, die für Kernaufgaben fehlen.",
        "Cogniiq analysiert, welche Abläufe in Ihrem Betrieb in Bayreuth automatisiert werden können – und setzt die Lösungen mit marktführenden Automatisierungsplattformen und direkten API-Integrationen um. Das Ergebnis sind zuverlässige Workflows, die vollständig im Hintergrund laufen: Buchungsbestätigungen, die automatisch ausgehen. Leads, die direkt qualifiziert ins CRM wandern. Rechnungen, die sich selbst erstellen. Fehlerbenachrichtigungen, die sofort informieren, wenn etwas schiefläuft.",
        "Ein entscheidender Vorteil gegenüber anonymen Online-Agenturen: Als Anbieter mit Hauptsitz in Bayreuth kennen wir die lokalen Betriebsrealitäten. Wir verstehen, wie ein Handwerksbetrieb in Oberfranken tickt, was eine Arztpraxis im Stadtgebiet täglich belastet und wo der Einzelhandel seine Zeitverluste hat. Diese lokale Perspektive fließt direkt in die Konzeption der Automatisierungen ein.",
        "Schrittweise Umsetzung ist unser Standard: Wir beginnen mit dem Prozess, der die meiste Zeit kostet, setzen ihn sauber um und zeigen das Ergebnis, bevor wir weitermachen. Keine Black Boxes, keine Systeme, die nur wir verstehen. Jede Automatisierung wird vollständig dokumentiert, sodass Ihr Team bei Bedarf einfache Anpassungen selbst vornehmen kann.",
        "Neben der Automatisierung bieten wir in Bayreuth auch den [KI Telefonassistenten](/bayreuth/ki-telefonassistent) sowie professionelles [Webdesign für Bayreuth](/bayreuth/webdesign) an – drei Bausteine, die sich ideal ergänzen und zusammen die digitale Basis eines modernen lokalen Unternehmens bilden. Alle Lösungen sind DSGVO-konform und werden ausschließlich auf europäischen Servern betrieben.",
      ],
    },
    warumCogniiq: [
      "Technologie-unabhängige Beratung – wir wählen das Tool, das wirklich zu Ihrer Infrastruktur passt",
      "Saubere Dokumentation jeder Automatisierung – keine Black Box, die nur wir verstehen",
      "Schrittweise Umsetzung: erst ein Prozess, dann mehr – kein Alles-oder-Nichts-Ansatz",
      "Persönliche Einweisung Ihres Teams – kein Selbststudium mit Video-Tutorials",
      "Weiterentwicklung und Support aus Bayreuth – direkter Draht, kurze Reaktionszeiten",
      "DSGVO-konform: alle Daten bleiben in Europa, keine unsicheren Drittland-Übertragungen",
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
        description: "Neue Anfragen aus Website oder Social Media landen direkt qualifiziert im CRM. Kein manuelles Copy-Paste, keine vergessenen Leads – jede Anfrage wird sofort verarbeitet.",
      },
      {
        industry: "Buchhaltung & Rechnungswesen",
        title: "Rechnungen und Mahnungen automatisch",
        description: "Rechnungen werden automatisch erzeugt, verschickt und nach Zahlungseingang archiviert. Mahnungen gehen nach definierten Intervallen raus – ohne dass jemand daran denken muss.",
      },
    ],
    processSteps: [
      { number: "01", title: "Kennenlernen & Zieldefinition", description: "Gemeinsam identifizieren wir die Prozesse in Ihrem Bayreuth-Betrieb, die täglich Zeit kosten. Wir priorisieren nach ROI-Potenzial und beginnen dort, wo der Hebel am größten ist." },
      { number: "02", title: "Konzept & Angebot", description: "Wir skizzieren den Automatisierungsworkflow: welche Tools, welche Trigger, welche Aktionen, welche Ausnahmen. Sie sehen das Konzept und stimmen zu, bevor wir eine einzige Zeile konfigurieren." },
      { number: "03", title: "Umsetzung & Feinschliff", description: "Entwicklung und Testing in einer isolierten Umgebung. Sie sehen den Prozess live, bevor er in Ihrem echten Betrieb in Bayreuth läuft – kein Blindflug, kein Live-Experiment." },
      { number: "04", title: "Go-Live & Optimierung", description: "Deployment, Einweisung Ihres Teams und vollständige Dokumentation. Sie verstehen, was läuft – und können einfache Anpassungen selbst vornehmen. Bei Fragen sind wir direkt erreichbar." },
    ],
    faq: [
      { question: "Welche Tools nutzt Cogniiq für Automatisierungen in Bayreuth?", answer: "Wir setzen auf professionelle, DSGVO-konforme Automatisierungsplattformen und direkte API-Integrationen. Wir empfehlen immer die Lösung, die langfristig am sinnvollsten für Ihren Betrieb ist – nicht die teuerste." },
      { question: "Brauche ich technisches Vorwissen für Prozessautomatisierung?", answer: "Nein. Wir übernehmen den vollständigen Aufbau und erklären Ihnen das Ergebnis in verständlichen Worten. Nach der Übergabe können Sie einfache Änderungen selbst vornehmen." },
      { question: "Was kostet Prozessautomatisierung in Bayreuth?", answer: "Das hängt von der Komplexität ab. Einfache Workflows starten ab ca. 500–1.500 €, komplexere Projekte nach Aufwand. Das Erstgespräch und eine erste Einschätzung sind kostenlos und unverbindlich." },
      { question: "Wie sicher sind die automatisierten Workflows?", answer: "Wir bauen ausschließlich auf etablierte, sicherheitszertifizierte Plattformen. Sensible Daten verlassen Europa nicht ohne Ihre ausdrückliche Zustimmung. Alle Workflows sind DSGVO-konform." },
      { question: "Können bestehende Systeme in Automatisierungen integriert werden?", answer: "Ja. Wir verbinden nahezu jede Software mit einer API – CRM, Buchungssystem, Buchhaltungssoftware oder branchenspezifische Anwendungen für Bayreuth-Unternehmen." },
      { question: "Was passiert wenn eine Automatisierung fehlschlägt?", answer: "Fehlerbenachrichtigungen sind standardmäßig eingebaut. Bei kritischen Prozessen gibt es immer einen manuellen Fallback – niemand verliert Daten, weil ein Workflow einen Fehler hatte." },
      { question: "Könnt ihr auch bestehende Workflows übernehmen?", answer: "Ja. Wir analysieren was vorhanden ist, beheben Fehler oder bauen es strukturierter neu auf. Oft lässt sich Bestehendes mit wenig Aufwand deutlich stabiler machen." },
      { question: "Für welche Unternehmensgrößen lohnt sich Automatisierung in Bayreuth?", answer: "Ab etwa 3–5 Mitarbeitern gibt es fast immer Prozesse, die sich lohnen zu automatisieren und sich schnell amortisieren. Wir schauen uns das gemeinsam an – ohne Verkaufsdruck." },
      { question: "Wie lange dauert die Einrichtung einer Automatisierung?", answer: "Einfache Workflows können innerhalb einer Woche live gehen. Komplexere Projekte mit mehreren integrierten Systemen dauern typisch 2–4 Wochen. Realistischer Zeitplan nach der Analyse." },
      { question: "Kann ich Automatisierungen auch für saisonale Prozesse nutzen?", answer: "Ja. Workflows können zeitbasiert aktiviert und deaktiviert werden – z. B. für die Bayreuth Festspielzeit, saisonale Öffnungszeiten oder Jahresendkampagnen." },
      { question: "Welche Automatisierungsplattform ist die richtige für meinen Betrieb?", answer: "Das hängt von Ihren Anforderungen ab: Datenschutz, Skalierbarkeit und Komplexität der Prozesse. Wir beraten unabhängig und wählen gemeinsam mit Ihnen die Lösung, die langfristig am besten passt." },
      { question: "Bietet Cogniiq auch laufende Betreuung nach dem Go-Live?", answer: "Ja. Auf Wunsch übernehmen wir einen Support-Vertrag für regelmäßige Wartung, Updates und Erweiterungen. Alternativ übergeben wir vollständig und sind bei Bedarf erreichbar." },
    ],
    localChallenges: [
      "Kleine Teams in Bayreuth und Oberfranken managen viele Prozesse manuell – das kostet täglich Stunden, die für Kernaufgaben und Kundenkontakt fehlen",
      "Gewachsene Software-Landschaften kommunizieren nicht miteinander – CRM, Buchungssystem und Buchhaltung sind Inseln, zwischen denen Daten per Hand übertragen werden",
      "Fehler durch manuelle Dateneingabe kosten Zeit bei der Korrektur und beschädigen das Vertrauen bei Kunden, wenn Bestätigungen zu spät oder gar nicht ankommen",
    ],
    industries: ["Handwerk & Betriebe", "Gastronomie", "Arztpraxen", "Dienstleister", "Einzelhandel", "Immobilien", "E-Commerce", "Physiotherapie & Gesundheit"],
    industriesExpanded: [
      {
        name: "Handwerk & Betriebe",
        problem: "Handwerksbetriebe in Bayreuth erstellen Angebote, bestätigen Aufträge und schreiben Rechnungen – alles manuell, oft mit Doppelerfassung in verschiedenen Systemen.",
        solution: "Angebotserstellung, Auftragsbestätigung und Rechnungsstellung werden automatisiert – ausgelöst durch einfache Trigger wie Formulareingang oder Kunden-E-Mail.",
      },
      {
        name: "Gastronomie & Restaurants",
        problem: "Restaurants managen Reservierungen, Tagesmenüs und Personaleinteilung in getrennten Tools ohne automatische Synchronisation.",
        solution: "Buchungsbestätigungen, Erinnerungen an Gäste und interne Benachrichtigungen werden vollautomatisch ausgelöst – ohne manuelle Eingriffe im laufenden Betrieb.",
      },
      {
        name: "Arztpraxen & Gesundheit",
        problem: "Praxen in Bayreuth verwalten Patientendaten, Terminkalender und Abrechnungssysteme in getrennten Anwendungen, die nicht automatisch synchronisieren.",
        solution: "Wir automatisieren Erinnerungsbenachrichtigungen, Terminbestätigungen und Datenübertragungen zwischen Systemen – DSGVO-konform und ohne manuellen Aufwand.",
      },
      {
        name: "Lokale Dienstleister",
        problem: "Dienstleister erhalten Anfragen über Website, E-Mail, Telefon und Social Media – und verlieren den Überblick, weil keine zentrale Verarbeitung stattfindet.",
        solution: "Alle Eingangskanäle werden in einem zentralen Workflow zusammengeführt, qualifiziert und dem richtigen Ansprechpartner zugewiesen.",
      },
      {
        name: "Einzelhandel & E-Commerce",
        problem: "Kleine Online-Shops in Bayreuth verwalten Bestellungen, Lager und Kundenkommunikation noch manuell – was bei Wachstum sofort zum Engpass wird.",
        solution: "Bestelleingang, Lagerabzug, Versandbenachrichtigung und Rechnungsversand werden vollautomatisiert – skalierbar ohne Mehrpersonal.",
      },
    ],
    localScenarios: [
      {
        title: "Handwerksbetrieb im Umland von Bayreuth",
        description: "Ein Elektriker mit 8 Mitarbeitern erstellt täglich Angebote per Hand, bestätigt Aufträge per E-Mail und schreibt Rechnungen in einem anderen Tool. Durch Automatisierung werden Angebote direkt aus dem Kalender generiert, Auftragsbestätigungen automatisch versandt und Rechnungen nach Leistungserbringung automatisch erstellt.",
      },
      {
        title: "Restaurant mit Online-Reservierung",
        description: "Ein Restaurant in der Bayreuth Innenstadt erhält Reservierungen über drei verschiedene Kanäle – Website, Google, Telefonassistent – die manuell im Kalender eingetragen werden. Nach der Automatisierung laufen alle Buchungen zentral zusammen, Erinnerungen gehen automatisch raus, und Stornierungen werden sofort im Kalender aktualisiert.",
      },
      {
        title: "Physiotherapiepraxis mit Abrechnungsworkflow",
        description: "Eine Physiotherapiepraxis mit 4 Therapeuten führt Patientenakten in einem System und Abrechnungen in einem anderen. Monatlich werden Daten per Hand übertragen. Nach der Automatisierung wird die Abrechnung aus dem Praxisverwaltungssystem direkt in die Buchhaltung überführt – ohne manuelle Dateneingabe.",
      },
    ],
    sameServiceOtherCities: [
      { label: "Automatisierung Regensburg", href: "/regensburg/automatisierung" },
      { label: "Automatisierung München", href: "/muenchen/automatisierung" },
    ],
    otherServicesInCity: [
      { label: "KI-Telefonassistent Bayreuth", href: "/bayreuth/ki-telefonassistent" },
      { label: "Webdesign Bayreuth", href: "/bayreuth/webdesign" },
    ],
  },

  // ─── BAYREUTH / WEBDESIGN ────────────────────────────────────────────────────
  "bayreuth/webdesign": {
    city: "Bayreuth",
    citySlug: "bayreuth",
    service: "Webdesign",
    serviceSlug: "webdesign",
    route: "/bayreuth/webdesign",
    seo: {
      title: "Webdesign Agentur Bayreuth – Website erstellen & SEO | Cogniiq",
      description: "Webdesign Bayreuth: Individuelle Websites für lokale Unternehmen. Schnell, SEO-optimiert, Mobile-First. Keine Templates – professionelle Webentwicklung mit lokalem Ansprechpartner.",
      canonical: `${base}/bayreuth/webdesign`,
    },
    intro: {
      h1: "Webdesign Agentur in Bayreuth",
      lead: "Keine Baukastenwebsites, kein 08/15-Design. Wir entwickeln Websites für Unternehmen in Bayreuth, die technisch sauber, schnell und auf Ihre Zielgruppe ausgerichtet sind – und die Besucher zuverlässig in Kunden verwandeln.",
    },
    localIntro: {
      paragraphs: [
        "Bayreuth hat eine aktive, vielfältige lokale Wirtschaft: Handwerksbetriebe, medizinische Praxen, Gastronomie, Sport- und Freizeitanlagen sowie eine wachsende Zahl digitaler Dienstleister. Was viele dieser Unternehmen gemeinsam haben: Ihre Website entspricht nicht mehr dem Stand, den potenzielle Kunden erwarten. Veraltete Designs, langsame Ladezeiten auf mobilen Geräten, schwache lokale Sichtbarkeit in Google – das sind täglich verlorene Kunden.",
        "Cogniiq entwickelt Websites für Unternehmen in Bayreuth, die anders sind. Jede Website entsteht von Grund auf neu – keine Vorlage, kein Baukastensystem. Wir beginnen mit dem Briefing: Was soll die Website leisten? Wer ist die Zielgruppe? Welche lokalen Suchbegriffe in Bayreuth sind relevant? Daraus entsteht eine Website, die technisch einwandfrei, schnell und für lokale Suchanfragen optimiert ist.",
        "Als Webdesign-Agentur mit Sitz in Bayreuth kennen wir die lokalen Wettbewerbsverhältnisse, die Suchgewohnheiten der Region und die spezifischen Erwartungen Ihrer Kunden in Oberfranken. Wir optimieren Websites nicht nur für generische Keywords, sondern gezielt für Suchanfragen wie 'Webdesign Agentur Bayreuth', 'Website erstellen Bayreuth' und branchenspezifische lokale Kombinationen.",
        "Jede Website, die wir bauen, ist Mobile-First: Über 70% der Suchanfragen in Deutschland erfolgen inzwischen vom Smartphone. Ladezeiten unter 2 Sekunden, bestandene Core Web Vitals und ein sauberes technisches Fundament sind kein optionales Extra – sondern der Standard, den wir für jedes Projekt liefern. SEO ist von Anfang an eingebaut, nicht nachträglich als Patch hinzugefügt.",
        "Als Ergänzung zum Webdesign bieten wir in Bayreuth auch den [KI Telefonassistenten für Bayreuth](/bayreuth/ki-telefonassistent) und [Prozessautomatisierung](/bayreuth/automatisierung) an. Diese drei Bereiche ergänzen sich ideal: Eine sichtbare, schnelle Website generiert Anfragen – der KI Assistent nimmt sie entgegen – Automatisierungen verarbeiten sie effizient. Alles aus einer Hand, persönlich betreut in Bayreuth.",
      ],
    },
    warumCogniiq: [
      "Individuelle Entwicklung – jede Website entsteht für Ihr Unternehmen in Bayreuth, nicht aus einer Vorlage",
      "Technischer Fokus: Ladezeiten unter 2 Sekunden, Mobile-First, Core Web Vitals bestanden",
      "SEO von Anfang an eingebaut – lokale Sichtbarkeit für Bayreuth und Umgebung",
      "Klare Conversion-Struktur: Besucher wissen sofort, was Sie anbieten und wie sie Kontakt aufnehmen",
      "Persönliche Zusammenarbeit direkt in Bayreuth – kein anonymes Projektportal",
      "Support und Änderungen nach dem Launch – kein Wartungsvertrag für Kleinigkeiten nötig",
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
        description: "Vertrauenswürdiges Design, DSGVO-konformes Kontaktformular und optionale Buchungssystem-Integration. Patienten in Bayreuth finden und buchen Sie einfach online.",
      },
      {
        industry: "Gastronomie & Hotellerie",
        title: "Restaurant-Website mit Reservierung",
        description: "Appetitmachendes Design, aktuelle Speisekarte, Online-Reservierung und Google-Business-Optimierung für Bayreuth – alles aus einer Hand, optimiert für mobile Gäste.",
      },
    ],
    processSteps: [
      { number: "01", title: "Kennenlernen & Zieldefinition", description: "Ziele, Zielgruppe, Wettbewerber in Bayreuth und bestehende Materialien besprechen. Was soll die Website für Ihr Unternehmen wirklich leisten?" },
      { number: "02", title: "Konzept & Angebot", description: "Seitenstruktur, Designsprache, Texte und SEO-Strategie für Bayreuth werden gemeinsam entwickelt. Kein Übergeben von Dokumenten ohne Feedback-Schleifen." },
      { number: "03", title: "Umsetzung & Feinschliff", description: "Technische Umsetzung mit Performance- und SEO-Fokus. Sie sehen die Website in einer vollständigen Vorschau-Umgebung, bevor sie live geht." },
      { number: "04", title: "Go-Live & Optimierung", description: "Live-Schaltung, Google Analytics/Matomo, Google Search Console, erste Optimierungen nach den tatsächlichen Nutzungsdaten der ersten Wochen." },
    ],
    faq: [
      { question: "Auf welcher Technologie baut Cogniiq Websites in Bayreuth?", answer: "Je nach Anforderung: React/Next.js für dynamische Projekte mit höchsten Performance-Anforderungen, Webflow für content-lastige Sites, WordPress für einfache Unternehmenswebsites, die Ihr Team selbst pflegen soll." },
      { question: "Wie lange dauert ein Webdesign-Projekt in Bayreuth?", answer: "Einfache Unternehmenswebsites in 4–6 Wochen, komplexere Projekte in 8–12 Wochen. Nach dem Briefing erhalten Sie immer eine realistische Zeitschätzung." },
      { question: "Was kostet eine Website für ein Unternehmen in Bayreuth?", answer: "Einfache Unternehmenswebsites ab ca. 2.500–5.000 €, komplexere Projekte nach Aufwand. Erstgespräch und grobe Einschätzung sind kostenlos." },
      { question: "Kann ich die Website nach dem Launch selbst pflegen?", answer: "Ja. Wir richten bei Bedarf ein CMS ein und schulen Ihr Team. Alternativ übernehmen wir die laufende Pflege – je nach Ihren Wünschen." },
      { question: "Macht Cogniiq auch lokales SEO für Bayreuth?", answer: "On-Page SEO ist in jedem Projekt enthalten: technische Grundlagen, saubere Struktur, lokale Keyword-Integration für Bayreuth, Core Web Vitals. Für umfangreichere SEO-Kampagnen bieten wir separate Pakete an." },
      { question: "Habt ihr Erfahrung mit dem Bayreuth-Markt?", answer: "Ja. Wir kennen die lokale Wettbewerbssituation in Bayreuth und Oberfranken und positionieren Websites so, dass sie bei lokalen Suchanfragen sichtbar sind." },
      { question: "Könnt ihr eine bestehende Website modernisieren?", answer: "Ja. Ob Redesign, Relaunch oder gezielte Optimierung einzelner Seiten – wir analysieren was vorhanden ist und schlagen den sinnvollsten Weg vor." },
      { question: "Bietet ihr auch Hosting an?", answer: "Auf Wunsch organisieren wir das Hosting bei einem deutschen oder europäischen Anbieter. Alternativ nutzen wir Ihren bestehenden Hosting-Vertrag." },
      { question: "Wie unterscheidet sich eine professionelle Website von einem Baukastensystem?", answer: "Baukastensysteme wie Wix oder Jimdo liefern akzeptable Ergebnisse für einfache Visitenkarten-Websites. Für Unternehmen in Bayreuth, die Neukunden über Google gewinnen wollen, sind individuelle, technisch optimierte Websites deutlich effektiver." },
      { question: "Wird die Website auch für Google My Business optimiert?", answer: "Ja. Google My Business Optimierung und die Verknüpfung mit der Website sind fester Bestandteil unserer lokalen SEO-Arbeit für Bayreuth." },
      { question: "Können auch mehrsprachige Websites erstellt werden?", answer: "Ja. Für Unternehmen in Bayreuth, die internationale Gäste oder Kunden ansprechen – z. B. in der Festspielzeit – bieten wir mehrsprachige Website-Entwicklung an." },
      { question: "Was passiert nach dem Launch?", answer: "Wir analysieren die ersten Wochen, identifizieren Optimierungspotenzial und setzen es um. Auf Wunsch übernehmen wir laufende Betreuung, Updates und SEO-Optimierungen." },
    ],
    localChallenges: [
      "Viele Unternehmen in Bayreuth haben veraltete Websites, die auf mobilen Geräten schlecht funktionieren und bei Google kaum sichtbar sind",
      "Lokale Konkurrenz ist oft digital besser aufgestellt – eine schlechte Website kostet täglich Neukunden, die online weitersuchen und beim Mitbewerber landen",
      "Baukastenwebsites aus Standardvorlagen sehen alle ähnlich aus und heben Ihr Unternehmen nicht vom lokalen Wettbewerb ab",
    ],
    industries: ["Arztpraxen & Gesundheit", "Gastronomie & Restaurants", "Handwerk & Betriebe", "Lokale Dienstleister", "Sport & Freizeit", "Einzelhandel", "Beratung & Finanzen"],
    industriesExpanded: [
      {
        name: "Arztpraxen & Zahnarztpraxen",
        problem: "Praxen in Bayreuth verlieren täglich potenzielle Patienten, weil ihre Website nicht gefunden wird oder nicht vertrauenswürdig wirkt. Online-Terminbuchung ist oft gar nicht vorhanden.",
        solution: "Wir entwickeln vertrauenswürdige Praxis-Websites mit DSGVO-konformem Buchungssystem, optimiert für lokale Suchanfragen in Bayreuth.",
      },
      {
        name: "Gastronomie & Festspielstadt",
        problem: "Restaurants rund um die Bayreuth Festspiele verlieren Gäste an Mitbewerber mit besserer Online-Präsenz. Reservierungen kommen nicht über die Website, sondern nur per Telefon.",
        solution: "Wir erstellen appetitmachende Restaurant-Websites mit integrierter Online-Reservierung, Speisekarte und Google-Business-Optimierung für Bayreuth.",
      },
      {
        name: "Handwerk & lokale Betriebe",
        problem: "Handwerksbetriebe in Bayreuth und dem Umland verlieren Auftragsanfragen an Konkurrenten mit besserer Google-Sichtbarkeit und professionellerer Website.",
        solution: "Klare, schnelle Unternehmenswebsites mit Kontaktformular, Leistungsübersicht und lokalem SEO für Bayreuth und die Region Oberfranken.",
      },
      {
        name: "Sport & Freizeitanlagen",
        problem: "Sport- und Freizeitanlagen haben oft keine Website, die Kurse, Buchungen und Öffnungszeiten aktuell darstellt – Gäste suchen vergeblich nach Informationen.",
        solution: "Wir entwickeln übersichtliche Websites mit Online-Buchungsfunktion und automatischer Aktualisierung von Kursplänen und Verfügbarkeiten.",
      },
      {
        name: "Lokale Dienstleister",
        problem: "Friseure, Kosmetikstudios, Steuerberater und andere Dienstleister in Bayreuth sind online kaum sichtbar und verlieren Kunden, die lokal suchen.",
        solution: "Professionelle, schnell ladende Websites mit lokalem SEO-Fokus, Kontaktformular und Terminbuchung – speziell für den Bayreuth-Markt optimiert.",
      },
    ],
    localScenarios: [
      {
        title: "Zahnarztpraxis in der Innenstadt",
        description: "Eine Zahnarztpraxis in der Bayreuth Innenstadt verliert täglich potenzielle Neupatienten, weil die Website veraltet ist und bei Google-Suchen nach 'Zahnarzt Bayreuth' nicht erscheint. Nach dem Relaunch mit lokaler SEO-Optimierung und Online-Terminbuchung steigen die monatlichen Neupatientenanfragen deutlich.",
      },
      {
        title: "Restaurant nahe der Universität",
        description: "Ein Restaurant in Universitätsnähe hat keine Online-Reservierung und verliert täglich Buchungen an besser digitalisierte Mitbewerber. Mit einer neuen, mobil-optimierten Website mit integriertem Reservierungssystem und Google-Business-Optimierung steigen die Onlinebuchungen innerhalb weniger Wochen.",
      },
      {
        title: "Sanitär-Handwerksbetrieb im Umland",
        description: "Ein Sanitärbetrieb aus dem Umland von Bayreuth hat keine suchmaschinenoptimierte Website. Auftragsanfragen kommen ausschließlich über Empfehlungen. Nach dem Website-Launch mit lokaler SEO-Optimierung für 'Sanitär Bayreuth' und 'Heizung Bayreuth' kommen erste organische Anfragen über Google innerhalb von 6–8 Wochen.",
      },
    ],
    sameServiceOtherCities: [
      { label: "Webdesign Regensburg", href: "/regensburg/webdesign" },
      { label: "Webdesign München", href: "/muenchen/webdesign" },
    ],
    otherServicesInCity: [
      { label: "KI-Telefonassistent Bayreuth", href: "/bayreuth/ki-telefonassistent" },
      { label: "Automatisierung Bayreuth", href: "/bayreuth/automatisierung" },
    ],
  },

  // ─── REGENSBURG / KI TELEFONASSISTENT ────────────────────────────────────────
  "regensburg/ki-telefonassistent": {
    city: "Regensburg",
    citySlug: "regensburg",
    service: "KI Telefonassistent",
    serviceSlug: "ki-telefonassistent",
    route: "/regensburg/ki-telefonassistent",
    seo: {
      title: "KI Telefonassistent Regensburg – AI Rezeption & Anrufannahme | Cogniiq",
      description: "KI Telefonassistent Regensburg: Automatische Anrufannahme, Terminbuchung & Weiterleitung für Praxen, Gastronomie und Dienstleister. 24/7, DSGVO-konform, Einrichtung in 7–14 Tagen.",
      canonical: `${base}/regensburg/ki-telefonassistent`,
    },
    intro: {
      h1: "KI Telefonassistent in Regensburg",
      lead: "Regensburg wächst – und mit ihm der Bedarf nach effizientem Kundenkontakt. Der KI Telefonassistent von Cogniiq übernimmt die Telefonkommunikation für Praxen, Betriebe und Dienstleister in Regensburg: automatisch, zuverlässig, rund um die Uhr.",
    },
    localIntro: {
      paragraphs: [
        "Regensburg ist eine der am schnellsten wachsenden Städte Bayerns – mit einer Universität, einer wachsenden Start-up-Szene, einem starken industriellen Mittelstand und einer der dichtesten Gastronomie- und Tourismuslandschaften in Ostbayern. Diese Dynamik schlägt sich direkt in der Telefonkommunikation nieder: Anfragen kommen zu jeder Tages- und Abendzeit, besonders in der Tourismussaison und während der Semesterzeiten ist das Volumen erheblich.",
        "Der KI Telefonassistent von Cogniiq ist die passende Antwort auf diese Herausforderung: Er nimmt Anrufe rund um die Uhr entgegen, beantwortet Standardfragen zu Öffnungszeiten, Preisen und Verfügbarkeit sofort, bucht Termine direkt ins System und leitet komplexe Anliegen strukturiert weiter. Für Arztpraxen rund ums Klinikum: keine überfüllte Telefonleitung am Montagmorgen. Für Restaurants in der Altstadt: keine verpassten Reservierungen am Wochenende. Für Handwerksbetriebe im Umland: keine Anfragen, die abends ins Leere laufen.",
        "Was den Regensburger Markt besonders macht: die Kombination aus studentischem Publikum, internationalem Tourismus und etabliertem Mittelstand stellt besondere Anforderungen an die telefonische Erreichbarkeit. Regensburg ist UNESCO-Weltkulturerbe und einer der meistbesuchten Städte Deutschlands – der Tourismus bringt Anfragen auch in Sprachen und zu Zeiten, die für klassischen Telefondienst schwer abzudecken sind.",
        "Der KI Telefonassistent wird speziell auf Ihr Regensburger Unternehmen konfiguriert – von der Begrüßungssprache bis zu den Weiterleitungsregeln. Die technische Einrichtung dauert 7–14 Tage und läuft vollständig im Hintergrund: Ihre bestehende Rufnummer bleibt, Ihr Team muss nichts Neues lernen, und der Assistent ist vollständig DSGVO-konform auf europäischen Servern betrieben.",
        "Für Regensburger Unternehmen, die ihre digitale Infrastruktur weiter ausbauen möchten, ergänzt der KI Telefonassistent die [Automatisierung für Regensburg](/regensburg/automatisierung) und das [Webdesign für Regensburg](/regensburg/webdesign) ideal. Wer Anfragen professionell entgegennimmt, sie automatisch verarbeitet und online sichtbar ist, hat in einem wachsenden Markt wie Regensburg einen deutlichen Wettbewerbsvorteil.",
      ],
    },
    warumCogniiq: [
      "Einrichtung in 7–14 Tagen auf Ihrer Regensburger Telefonnummer – ohne neue Hardware",
      "Exakte Anpassung auf Ihre Branche, Ihren Betrieb und die spezifischen Anforderungen in Regensburg",
      "Gespräche strukturiert protokolliert – direkt exportierbar in Ihr CRM oder Buchungssystem",
      "Automatische Skalierung: kein Qualitätsverlust bei Anrufspitzen in der Tourismussaison",
      "Vollständig DSGVO-konform – Verarbeitung auf europäischen Servern, AVV auf Anfrage",
      "Persönliche Betreuung ohne Ticket-Warteschlangen – direkte Erreichbarkeit des Teams",
    ],
    useCases: [
      {
        industry: "Universitätsklinik-Umfeld & Privatpraxen",
        title: "Terminmanagement ohne Leitungsstau",
        description: "Regensburg hat eine hohe Dichte an medizinischen Einrichtungen rund ums Klinikum. Ein KI Telefonassistent entlastet die Praxisanmeldung dauerhaft – besonders montags, nach Feiertagen und in Grippezeiten, wenn das Telefon kaum stillsteht.",
      },
      {
        industry: "Gastronomie & Tourismus",
        title: "Reservierungen rund um die Uhr",
        description: "Regensburg als eines der beliebtesten Touristenziele Deutschlands hat ganzjährig hohe Nachfrage nach Restaurantreservierungen – besonders abends und am Wochenende, wenn das Serviceteam voll ausgelastet ist.",
      },
      {
        industry: "Dienstleister & Handwerk",
        title: "Terminannahme nach Feierabend",
        description: "Handwerksbetriebe und Dienstleister in Regensburg und dem Landkreis erhalten viele Anfragen außerhalb der Arbeitszeit. Der Assistent nimmt strukturiert auf und leitet morgens an das richtige Teammitglied weiter.",
      },
    ],
    processSteps: [
      { number: "01", title: "Kennenlernen & Zieldefinition", description: "Wir analysieren Ihre typischen Anrufszenarien in Regensburg: Was fragen Ihre Kunden, welche Antworten brauchen sie, wie soll der Assistent auf Ihr Unternehmen abgestimmt klingen?" },
      { number: "02", title: "Konzept & Angebot", description: "Entwicklung des Gesprächsdesigns: Begrüßung, Antwortinhalte, Weiterleitungsregeln. Sie sehen das vollständige Konzept und erhalten ein Festpreisangebot, bevor wir beginnen." },
      { number: "03", title: "Umsetzung & Feinschliff", description: "Technische Integration in Ihre Rufnummer, Testläufe mit echten Szenarien aus dem Regensburg-Kontext und Feinabstimmung auf Basis Ihres Feedbacks." },
      { number: "04", title: "Go-Live & Optimierung", description: "Der Assistent übernimmt live. Wir monitoren und optimieren in den ersten Wochen aktiv – bis alles reibungslos läuft und Sie die volle Kontrolle haben." },
    ],
    faq: [
      { question: "Versteht der Assistent Dialekte – auch Bayerisch?", answer: "Ja. Moderne Sprachmodelle verstehen Dialekte und regionale Ausdrücke zuverlässig. Bei sehr starkem Dialekt kann die Verarbeitung minimal länger dauern – in der Praxis sind die Ergebnisse sehr gut." },
      { question: "Funktioniert der Assistent auch bei hohem Anrufvolumen in der Tourismussaison?", answer: "Ja. Der Assistent skaliert automatisch. Auch wenn in der Hauptsaison viele Anrufe gleichzeitig eingehen, gibt es keine Wartezeit und keinen Qualitätsverlust." },
      { question: "Kann er Anrufe auf verschiedene Mitarbeiter weiterleiten?", answer: "Ja. Weiterleitungsregeln können flexibel konfiguriert werden – nach Thema, Uhrzeit, Mitarbeiter oder Verfügbarkeit." },
      { question: "Was passiert bei einem technischen Ausfall?", answer: "Es gibt immer einen Fallback: entweder Weiterleitung auf eine Backup-Nummer oder eine klar formulierte Ansage. Kein Anruf geht verloren." },
      { question: "Ist der KI Telefonassistent DSGVO-konform?", answer: "Ja. Alle Daten werden auf europäischen Servern verarbeitet. Wir stellen alle notwendigen Datenschutzdokumente bereit und unterstützen bei der DSGVO-Dokumentation." },
      { question: "Können wir den Assistenten vor dem Kauf testen?", answer: "Ja. Im Rahmen des Erstgesprächs können wir eine Demo-Konfiguration für Ihren spezifischen Regensburg-Use-Case zeigen." },
      { question: "Was kostet der KI Telefonassistent in Regensburg?", answer: "Die Kosten richten sich nach Anrufvolumen und Konfigurationskomplexität. Nach dem Erstgespräch erhalten Sie ein transparentes Festpreisangebot." },
      { question: "Wie unterscheidet sich der KI Telefonassistent von einer klassischen Telefonanlage?", answer: "Eine Anlage leitet weiter und nimmt auf – ohne zu verstehen. Der KI Telefonassistent führt echte Gespräche: er antwortet situationsangemessen, fragt nach, bucht Termine und gibt Auskunft. Ohne Tastenmenü, ohne starre Optionen." },
      { question: "Kann der Assistent auch auf Englisch sprechen?", answer: "Ja. Für Regensburger Unternehmen mit internationalem Publikum – Tourismus, Universität, Technologiebetriebe – sind mehrsprachige Konfigurationen möglich." },
      { question: "Wie funktioniert die Integration in meinen bestehenden Kalender?", answer: "Wir integrieren gängige Buchungs- und Kalendertools. Welches System Sie nutzen, besprechen wir vorab – und prüfen die technische Integrationsmöglichkeit." },
      { question: "Muss ich meine Telefonnummer wechseln?", answer: "Nein. Der Assistent läuft auf Ihrer bestehenden Telefonnummer. Für Ihre Kunden ändert sich nichts außer der Qualität des Telefonservices." },
    ],
    localChallenges: [
      "Regensburgs Wirtschaftswachstum und starker Tourismus bringen deutlich mehr Anrufvolumen – aber keinen entsprechenden Zuwachs an Telefonpersonal in den Betrieben",
      "Universität und Tourismus sorgen für Anfragen zu ungewöhnlichen Zeiten – abends, am Wochenende und außerhalb regulärer Öffnungszeiten, wenn niemand ans Telefon geht",
      "Fachkräftemangel macht zuverlässige manuelle Telefonkommunikation für viele Regensburger Betriebe zunehmend schwierig und teuer",
    ],
    industries: ["Arztpraxen & Kliniken", "Gastronomie & Hotels", "Physio & Therapie", "Handwerk & Betriebe", "Sport & Freizeit", "Tourismus", "Lokale Dienstleister"],
    industriesExpanded: [
      {
        name: "Arztpraxen & Klinikumfeld",
        problem: "Praxen in der Nähe des Uniklinikums Regensburg sind chronisch überlastet. Montags und nach Feiertagen ist die Telefonleitung dauerhaft besetzt – Patienten wählen den nächsten Arzt.",
        solution: "Der KI Telefonassistent nimmt Anrufe sofort an, bucht Termine und beantwortet Standardfragen – ohne Warteschleife, ohne Leitungsstau, auch in Stoßzeiten.",
      },
      {
        name: "Gastronomie & Altstadtgastronomie",
        problem: "Restaurants in der Regensburger Altstadt und rund um den Dom sind für internationale Gäste attraktiv – aber telefonisch oft schwer erreichbar, wenn das Serviceteam im Einsatz ist.",
        solution: "Reservierungen werden rund um die Uhr entgegengenommen, auf Englisch oder Deutsch beantwortet und automatisch im Reservierungssystem eingetragen.",
      },
      {
        name: "Tourismus & Stadtführungen",
        problem: "Anbieter von Stadtführungen und touristischen Erlebnissen in Regensburg erhalten viele internationale Anfragen außerhalb der Bürozeiten – und verpassen sie oft.",
        solution: "Der Assistent beantwortet Buchungsanfragen auf Deutsch und Englisch rund um die Uhr und leitet Buchungen direkt in das Buchungssystem ein.",
      },
      {
        name: "Handwerk & Betriebe",
        problem: "Handwerksbetriebe in Regensburg und dem Landkreis sind tagsüber bei Kunden und verpassen Anfragen, die dann an Mitbewerber gehen.",
        solution: "Anfragen werden professionell angenommen, qualifiziert und strukturiert weitergeleitet – ohne dass der Inhaber selbst ans Telefon muss.",
      },
      {
        name: "Physio, Therapie & Wellness",
        problem: "Kleinen Praxen fehlt das Personal, das zwischen Behandlungen dauerhaft Telefon abnimmt. Termine werden verpasst oder erst mit großer Verzögerung vergeben.",
        solution: "Der Assistent übernimmt die Terminvergabe vollständig – direkt, freundlich, ohne Wartezeit – und entlastet das Praxisteam nachhaltig.",
      },
    ],
    localScenarios: [
      {
        title: "Hausarztpraxis nahe dem Regensburg Klinikum",
        description: "Eine internistische Praxis nahe dem Klinikum erhält montags 60–80 Anrufe vor 8:30 Uhr. Die Anmeldung ist dauerhaft überlastet. Nach Einführung des KI Telefonassistenten werden Standardtermine automatisch gebucht – das Team kümmert sich nur noch um komplexe Anfragen und akute Fälle.",
      },
      {
        title: "Restaurant in der Regensburger Altstadt",
        description: "Ein Restaurant direkt an der Steinernen Brücke erhält täglich Reservierungsanfragen von Touristen aus aller Welt – auch abends nach Küchenschluss. Mit dem KI Telefonassistenten werden Reservierungen auf Deutsch und Englisch rund um die Uhr entgegengenommen und automatisch im Kalender eingetragen.",
      },
      {
        title: "Physio-Praxis im Stadtgebiet Regensburg",
        description: "Eine Physiotherapiepraxis mit vier Behandlungsräumen hat niemanden, der dauerhaft Telefon abnimmt. Anfragen zwischen Behandlungen wurden bisher per Anrufbeantworter gesammelt und später zurückgerufen – mit dem Assistenten werden Termine sofort vergeben.",
      },
      {
        title: "Handwerksbetrieb im Landkreis Regensburg",
        description: "Ein Sanitärbetrieb aus dem Landkreis Regensburg verpasst täglich Auftragsanfragen, weil die Mitarbeiter tagsüber auf Montage sind. Der KI Telefonassistent nimmt Anfragen entgegen, qualifiziert das Anliegen und leitet strukturierte Nachrichten an den Inhaber weiter.",
      },
    ],
    sameServiceOtherCities: [
      { label: "KI-Telefonassistent Bayreuth", href: "/bayreuth/ki-telefonassistent" },
      { label: "KI-Telefonassistent München", href: "/muenchen/ki-telefonassistent" },
    ],
    otherServicesInCity: [
      { label: "Automatisierung Regensburg", href: "/regensburg/automatisierung" },
      { label: "Webdesign Regensburg", href: "/regensburg/webdesign" },
    ],
  },

  // ─── REGENSBURG / AUTOMATISIERUNG ────────────────────────────────────────────
  "regensburg/automatisierung": {
    city: "Regensburg",
    citySlug: "regensburg",
    service: "Automatisierung",
    serviceSlug: "automatisierung",
    route: "/regensburg/automatisierung",
    seo: {
      title: "Automatisierung Regensburg – Prozessautomatisierung & Workflows | Cogniiq",
      description: "Prozessautomatisierung für Unternehmen in Regensburg: Workflows & CRM-Integration, Leadverarbeitung. Wartbar, DSGVO-konform, persönliche Betreuung.",
      canonical: `${base}/regensburg/automatisierung`,
    },
    intro: {
      h1: "Automatisierung für Unternehmen in Regensburg",
      lead: "In Regensburg wächst der Mittelstand schnell – und mit ihm die Komplexität interner Prozesse. Wir automatisieren Ihren Betrieb: von der Buchungsbestätigung bis zur CRM-Synchronisation, einmalig eingerichtet, dauerhaft entlastend.",
    },
    localIntro: {
      paragraphs: [
        "Regensburg ist ein bedeutender Wirtschaftsstandort in Bayern: Industrie, Mittelstand, Gastronomie, Tourismus und eine dynamische Start-up-Szene prägen die Stadt gleichermaßen. Viele dieser Unternehmen sind in den letzten Jahren schnell gewachsen – und haben dabei eine IT-Infrastruktur aufgebaut, die nicht mitwächst. Insellösungen kommunizieren nicht miteinander, Prozesse werden doppelt geführt, und manuelle Datenübertragung zwischen Systemen frisst täglich wertvolle Zeit.",
        "Cogniiq löst dieses Problem mit gezielter Geschäftsprozess-Automatisierung: Wir analysieren, welche Abläufe in Ihrem Regensburger Unternehmen automatisiert werden können, und welche Integrationen dafür am sinnvollsten sind. Das Ergebnis sind stabile, vollständig dokumentierte Workflows – die im Hintergrund laufen, ohne dass jemand täglich daran denken muss.",
        "Von der automatischen Buchungsbestätigung für Regensburger Gastronomiebetriebe über die CRM-Synchronisation für mittelständische Dienstleister bis zur automatisierten Rechnungsstellung für Handwerksbetriebe im Landkreis Regensburg: Wir starten dort, wo der Hebel am größten ist, und bauen das System so, dass es mit Ihrem Unternehmen wachsen kann.",
        "Als Automatisierungs-Agentur mit bayerischer Verwurzelung bringen wir nicht nur technisches Know-how mit, sondern auch das Verständnis für mittelständische Prozessrealitäten. Wir erklären keine Konzepte – wir analysieren Ihren Betrieb, priorisieren nach ROI und liefern Ergebnisse, die spürbar sind.",
        "Die Kombination aus Prozessautomatisierung und [KI Telefonassistent für Regensburg](/regensburg/ki-telefonassistent) sowie professionellem [Webdesign für Regensburg](/regensburg/webdesign) schafft eine vollständige digitale Betriebsinfrastruktur. Alle Lösungen werden DSGVO-konform umgesetzt und sind auf den langfristigen Betrieb ausgelegt.",
      ],
    },
    warumCogniiq: [
      "Unabhängige Technologieberatung – wir empfehlen das Tool, das zu Ihrer Infrastruktur passt",
      "Wartbare Lösungen mit vollständiger Dokumentation – keine proprietären Systeme",
      "Skalierbar: was heute 10 Prozesse automatisiert, deckt morgen 50 ab",
      "DSGVO-konform – alle Automatisierungen entsprechen europäischen Datenschutzstandards",
      "Schnelle Reaktionszeiten bei Anpassungen – auch nach dem Go-Live",
      "Schrittweise Einführung: kein Risiko, kein Alles-oder-Nichts",
    ],
    useCases: [
      {
        industry: "Mittelstand & Industrie",
        title: "ERP- und CRM-Integration",
        description: "Bestellungen, Kundendaten und Rechnungen fließen automatisch zwischen Ihren Systemen. Keine manuelle Übertragung, keine verlorenen Datensätze – sauber und zuverlässig.",
      },
      {
        industry: "Gastronomie & Veranstaltungen",
        title: "Event-Buchungen automatisch bestätigen",
        description: "Buchungsbestätigungen, Kapazitätsprüfungen und Erinnerungen für Gäste – ohne Personalaufwand. Besonders relevant für Regensburger Betriebe in der Touristenhochsaison.",
      },
      {
        industry: "Dienstleistung & Beratung",
        title: "Kunden-Onboarding automatisieren",
        description: "Von der ersten Anfrage bis zur Willkommensnachricht läuft alles automatisch – Verträge, Zugänge, Terminvereinbarungen, ohne manuelle Eingriffe Ihres Teams.",
      },
    ],
    processSteps: [
      { number: "01", title: "Kennenlernen & Zieldefinition", description: "Welche Abläufe in Ihrem Regensburger Betrieb kosten täglich die meiste Zeit? Wir analysieren Workflows und priorisieren nach ROI-Potenzial." },
      { number: "02", title: "Konzept & Angebot", description: "Wir skizzieren die Automatisierung: Tools, Datenflüsse, Triggerbedingungen, Fehlerbehandlung. Sie sehen das vollständige Konzept vor dem Start." },
      { number: "03", title: "Umsetzung & Feinschliff", description: "Entwicklung in einer Testumgebung mit echten Datensätzen. Keine Live-Experimente – Sie testen und bestätigen, bevor es live geht." },
      { number: "04", title: "Go-Live & Optimierung", description: "Deployment, vollständige Dokumentation, Einweisung Ihres Teams. Optional mit laufendem Monitoring und Support-Vertrag." },
    ],
    faq: [
      { question: "Für welche Unternehmensgrößen lohnt sich Automatisierung in Regensburg?", answer: "Ab etwa 3–5 Mitarbeitern gibt es fast immer Prozesse, die sich lohnen zu automatisieren. Wir schauen uns das im kostenfreien Erstgespräch gemeinsam an." },
      { question: "Müssen wir unsere bestehende Software wechseln?", answer: "Nein. Wir integrieren was bereits vorhanden ist. Nur wenn ein Tool objektiv besser für Ihren Use Case wäre, empfehlen wir es – ohne Verkaufsdruck." },
      { question: "Wie schnell sind ROI-Ergebnisse sichtbar?", answer: "Einfache Automatisierungen zahlen sich oft innerhalb von 4–8 Wochen aus. Komplexere Projekte über einen längeren Zeitraum – abhängig vom Prozessvolumen." },
      { question: "Was kostet Prozessautomatisierung in Regensburg?", answer: "Erste Workflows ab ca. 500 €, komplexere Integrationen nach Aufwand. Erstgespräch und Einschätzung sind immer kostenlos." },
      { question: "Können wir Änderungen selbst vornehmen?", answer: "Ja. Wir dokumentieren vollständig und schulen Ihr Team. Einfache Änderungen können Sie intern vornehmen – für komplexe sind wir erreichbar." },
      { question: "Was passiert wenn eine Automatisierung fehlschlägt?", answer: "Fehlerbenachrichtigungen sind standardmäßig eingebaut. Kritische Prozesse haben immer einen manuellen Fallback." },
      { question: "Arbeitet ihr auch mit branchenspezifischen Regensburger Lösungen?", answer: "Ja. Ob branchenspezifische ERP-Systeme, regionale Buchungsplattformen oder spezialisierte Tools – wir prüfen die verfügbaren APIs und finden eine Lösung." },
      { question: "Wie lange dauert ein Automatisierungsprojekt?", answer: "Einfache Workflows: 1–2 Wochen. Komplexere Integrationen: 3–6 Wochen. Realistischer Zeitplan nach der Analyse – immer." },
      { question: "Kann Workflow-Automatisierung auch saisonale Prozesse abdecken?", answer: "Ja. Workflows können zeitbasiert aktiviert werden – ideal für die Regensburger Touristensaison oder saisonale Marketingkampagnen." },
      { question: "Bietet Cogniiq auch laufende Wartung an?", answer: "Ja. Auf Wunsch übernehmen wir einen Support-Vertrag für Wartung, Updates und Erweiterungen der Automatisierungen." },
    ],
    localChallenges: [
      "Regensburger KMU haben oft gewachsene IT-Landschaften mit Insellösungen, die nicht automatisch miteinander kommunizieren",
      "Starkes Wirtschaftswachstum in der Region erfordert mehr Effizienz – ohne sofort neue Mitarbeiter einstellen zu müssen",
      "Manuelle Datenpflege zwischen verschiedenen Systemen führt zu Fehlern, Zeitverlust und gelegentlich Kundenfrustration",
    ],
    industries: ["Industrie & Fertigung", "Mittelstand & B2B", "Gastronomie & Hotels", "Dienstleistung", "Logistik", "Handwerk", "Beratung & Recht"],
    industriesExpanded: [
      {
        name: "Industrie & Fertigung",
        problem: "Industrieunternehmen in Regensburg managen Bestellungen, Lieferketten und Kundenkommunikation in getrennten Systemen ohne automatische Synchronisation.",
        solution: "ERP- und CRM-Integrationen synchronisieren Daten automatisch – keine Doppelerfassung, keine Fehler bei der manuellen Übertragung zwischen Systemen.",
      },
      {
        name: "Gastronomie & Tourismus",
        problem: "Regensburger Restaurants und Hotels erhalten Buchungen über verschiedene Kanäle, die manuell zusammengeführt werden müssen – fehleranfällig und zeitintensiv.",
        solution: "Alle Buchungskanäle fließen automatisch in ein zentrales System. Bestätigungen, Erinnerungen und Stornierungen laufen vollautomatisch.",
      },
      {
        name: "Mittelstand & Beratung",
        problem: "Beratungsunternehmen in Regensburg verlieren Zeit mit manuellem Kunden-Onboarding, Terminmanagement und Nachverfolgung von Angeboten.",
        solution: "Vom Erstanfrage-Eingang bis zum abgeschlossenen Onboarding laufen alle Schritte automatisch – mit korrekten Daten, zur richtigen Zeit, ohne manuelle Eingriffe.",
      },
      {
        name: "Logistik & Transport",
        problem: "Logistikbetriebe im Großraum Regensburg koordinieren Fahrten, Lieferungen und Kundenkommunikation noch teilweise manuell.",
        solution: "Automatisierte Benachrichtigungen, Statusupdates und Dokumentation sorgen für reibungslose Abläufe ohne manuelle Koordination.",
      },
    ],
    localScenarios: [
      {
        title: "Mittelständischer Dienstleister im Regensburg Stadtgebiet",
        description: "Ein B2B-Dienstleister mit 20 Mitarbeitern erhält Anfragen über Website, E-Mail und Telefon. Jede Anfrage wird manuell im CRM erfasst, ein Angebot erstellt und per E-Mail versandt. Nach der Automatisierung läuft der gesamte Prozess – von Anfrageneingang über Qualifikation bis zur Angebotserstellung – automatisch in unter 5 Minuten.",
      },
      {
        title: "Hotel in der Regensburger Altstadt",
        description: "Ein Hotel in der Altstadt erhält Buchungen über Booking.com, die eigene Website und telefonisch – drei Quellen, die manuell im Hotelmanagementsystem eingetragen werden. Automatisierung synchronisiert alle Kanäle in Echtzeit und versendet automatisch Bestätigungen in der jeweiligen Sprache des Gastes.",
      },
      {
        title: "Handwerksbetrieb im Landkreis Regensburg",
        description: "Ein Malerbetrieb aus dem Landkreis erstellt Angebote per Hand, bestätigt Aufträge per Telefon und verschickt Rechnungen mit Verzögerung. Nach der Automatisierung werden Angebote per Klick generiert, Auftragsbestätigungen automatisch versandt und Rechnungen nach Projektabschluss direkt erstellt.",
      },
    ],
    sameServiceOtherCities: [
      { label: "Automatisierung Bayreuth", href: "/bayreuth/automatisierung" },
      { label: "Automatisierung München", href: "/muenchen/automatisierung" },
    ],
    otherServicesInCity: [
      { label: "KI-Telefonassistent Regensburg", href: "/regensburg/ki-telefonassistent" },
      { label: "Webdesign Regensburg", href: "/regensburg/webdesign" },
    ],
  },

  // ─── REGENSBURG / WEBDESIGN ───────────────────────────────────────────────────
  "regensburg/webdesign": {
    city: "Regensburg",
    citySlug: "regensburg",
    service: "Webdesign",
    serviceSlug: "webdesign",
    route: "/regensburg/webdesign",
    seo: {
      title: "Webdesign Agentur Regensburg – Website erstellen & SEO | Cogniiq",
      description: "Webdesign Regensburg: Individuelle Websites für Unternehmen, Praxen und Gastronomie. Schnell, lokal SEO-optimiert, Mobile-First. Website Agentur mit persönlicher Betreuung.",
      canonical: `${base}/regensburg/webdesign`,
    },
    intro: {
      h1: "Webdesign Agentur in Regensburg",
      lead: "Regensburg hat viel zu bieten – Ihre Website sollte das widerspiegeln. Wir entwickeln professionelle, schnelle und konversionsorientierte Websites für Unternehmen in Regensburg: individuell konzipiert, technisch präzise, lokal SEO-optimiert.",
    },
    localIntro: {
      paragraphs: [
        "Regensburg ist eine Stadt, in der sich digitales Suchverhalten besonders stark ausgeprägt zeigt: Studenten, Touristen und Geschäftsreisende recherchieren Restaurants, Dienstleister und Praxen fast ausschließlich online. Lokale Regensburger suchen Handwerksbetriebe, Praxen und Beratungsdienstleister über Google – und entscheiden auf Basis des ersten digitalen Eindrucks, wen sie kontaktieren. Wer online nicht sichtbar oder nicht überzeugend ist, verliert täglich Kunden.",
        "Cogniiq entwickelt Websites für Regensburg, die in dieser Entscheidung gewinnen. Jede Website wird individuell konzipiert – keine Vorlagen, kein Baukastensystem. Sie ist schnell (unter 2 Sekunden Ladezeit), für Smartphones optimiert (über 70% der Suchanfragen kommen vom Handy), lokal für Regensburg SEO-optimiert und auf Conversion ausgerichtet: Klare Struktur, überzeugende Inhalte, ein Kontaktweg, der wirklich genutzt wird.",
        "Als Webdesign-Agentur mit Bayern-Verwurzelung verstehen wir die Anforderungen des Regensburger Markts: die Mischung aus Tourismus, Universitätspublikum, internationalem Mittelstand und der historischen Altstadt als Markenidentität der Stadt. Websites für Regensburger Unternehmen müssen sowohl lokal verwurzelt als auch international ansprechend sein – und technisch einwandfrei.",
        "Lokales SEO ist dabei kein Add-on, sondern Grundlage: Wir optimieren jede Website gezielt für Suchanfragen wie 'Webdesign Agentur Regensburg', 'Website erstellen Regensburg' und branchenspezifische lokale Kombinationen. Strukturierte Daten, Google My Business Optimierung und regionale Linkbuilding-Grundlagen sind fester Bestandteil jedes Projekts.",
        "Neben dem Webdesign bieten wir in Regensburg auch den [KI Telefonassistenten für Regensburg](/regensburg/ki-telefonassistent) und [Prozessautomatisierung für Regensburg](/regensburg/automatisierung) an. Wer eine professionelle Website hat, die Anfragen generiert, braucht auch das richtige System, um diese Anfragen effizient zu verarbeiten. Alle Leistungen aus einer Hand, von Cogniiq für den Regensburg-Markt.",
      ],
    },
    warumCogniiq: [
      "Keine Templates – jede Website für Regensburg wird individuell konzipiert und entwickelt",
      "Mobile-First: über 70% der Besucher kommen vom Smartphone – wir optimieren zuerst dafür",
      "Technische Präzision: Core Web Vitals, schnelle Ladezeiten, sauber strukturierter Code",
      "Lokaler SEO-Fokus: Sichtbarkeit für Suchanfragen in Regensburg und Umgebung",
      "Klare Kommunikation: Sie wissen immer, woran wir sind und was als nächstes kommt",
      "Support und Anpassungen nach dem Launch – ohne unnötige Wartungsverträge",
    ],
    useCases: [
      {
        industry: "Tourismus & Gastronomie",
        title: "Website für Regensburgs Tourismus-Wirtschaft",
        description: "Hotels, Restaurants und touristische Anbieter brauchen Websites, die internationale Gäste ansprechen, mehrsprachig funktionieren und direkt zur Buchung führen.",
      },
      {
        industry: "Mittelstand & B2B",
        title: "Unternehmens-Website mit Leadgenerierung",
        description: "B2B-Unternehmen in Regensburg brauchen Websites, die Kompetenz ausstrahlen und qualifizierte Anfragen generieren – keine reine Visitenkarte im Web.",
      },
      {
        industry: "Gesundheit & Praxen",
        title: "Praxis-Website mit Vertrauen und Funktion",
        description: "Patienten informieren sich online, bevor sie eine Praxis kontaktieren. Ihre Website muss Vertrauen aufbauen und die Kontaktaufnahme so einfach wie möglich machen.",
      },
    ],
    processSteps: [
      { number: "01", title: "Kennenlernen & Zieldefinition", description: "Ziele, Zielgruppe, Mitbewerber in Regensburg und bestehende Materialien. Wir verstehen Ihr Unternehmen, bevor wir anfangen zu konzipieren." },
      { number: "02", title: "Konzept & Angebot", description: "Seitenstruktur, Design und Texte entstehen iterativ in enger Abstimmung mit Ihnen. Kein Übergeben ohne Feedback-Schleifen." },
      { number: "03", title: "Umsetzung & Feinschliff", description: "Technische Umsetzung mit Performance-Fokus. Sie sehen die Website in einer vollständigen Vorschau und geben Feedback vor dem Launch." },
      { number: "04", title: "Go-Live & Optimierung", description: "Live-Schaltung, SEO-Setup für Regensburg, Analytics-Einrichtung und erste Optimierungen auf Basis der Nutzungsdaten." },
    ],
    faq: [
      { question: "Könnt ihr auch bestehende Regensburger Websites übernehmen?", answer: "Ja. Wir analysieren was vorhanden ist und schlagen den optimalen Weg vor: Redesign, vollständiger Relaunch oder gezielte Optimierung einzelner Seiten." },
      { question: "Wie lange dauert ein Webdesign-Projekt in Regensburg?", answer: "4–6 Wochen für einfachere Projekte, 8–12 Wochen für komplexere. Nach dem Briefing erhalten Sie immer einen realistischen Zeitplan." },
      { question: "Was kostet eine Website für ein Regensburger Unternehmen?", answer: "Ab ca. 2.500 € für einfache Unternehmenswebsites, komplexere Projekte nach Aufwand. Erstgespräch kostenlos." },
      { question: "Baut ihr auf WordPress oder individuellem Code?", answer: "Beides – je nach Anforderung. WordPress für pflegeleichte Inhalte, React/Next.js für Performance und Komplexität." },
      { question: "Macht ihr auch Texte?", answer: "Ja. Texte erstellen wir gemeinsam oder mit KI-Unterstützung – immer auf Ihre Zielgruppe und lokale Suchanfragen in Regensburg ausgerichtet." },
      { question: "Bietet ihr auch Wartung an?", answer: "Ja. Auf Wunsch übernehmen wir laufende Updates, Sicherheitsupdates und Inhaltsänderungen." },
      { question: "Kann die Website mehrsprachig sein?", answer: "Ja. Für Regensburger Unternehmen mit internationalem Publikum aus Tourismus oder Universität sind mehrsprachige Websites kein Problem." },
      { question: "Wie optimiert ihr für Google in Regensburg?", answer: "On-Page SEO, strukturierte Daten, Google My Business Optimierung und lokale Keyword-Strategie für Regensburg sind fester Bestandteil – nicht optionales Extra." },
      { question: "Könnt ihr auch Fotografie und Videoproduktion koordinieren?", answer: "Auf Wunsch koordinieren wir Fotografie über lokale Partnernetzwerke in der Regensburg-Region." },
      { question: "Was ist der Unterschied zu einer Webagentur in Regensburg?", answer: "Wir sind auf leistungsstarke, konversionsorientierte Websites spezialisiert – ohne den Overhead großer Agenturen. Direkter Kontakt mit dem Entwickler, kürzere Wege, schnellere Ergebnisse." },
    ],
    localChallenges: [
      "Viele Regensburger Unternehmen verlieren Kunden durch veraltete oder schlecht funktionierende Websites, die mobile Nutzer abschrecken",
      "Tourismus und Universität bringen internationale Besucher und hohe digitale Erwartungen – eine durchschnittliche Website reicht nicht mehr",
      "Die lokale Konkurrenz in Regensburg wächst digital – wer nicht sichtbar ist, verliert täglich Marktanteile",
    ],
    industries: ["Tourismus & Hotels", "Gastronomie & Restaurants", "Arztpraxen & Gesundheit", "Mittelstand & B2B", "Handwerk & Betriebe", "Einzelhandel", "Sport & Wellness"],
    industriesExpanded: [
      {
        name: "Tourismus & Hotellerie",
        problem: "Hotels und touristische Anbieter in Regensburg verlieren Direktbuchungen an OTA-Plattformen, weil die eigene Website nicht überzeugend genug ist oder schlechte Ladezeiten hat.",
        solution: "Schnelle, mehrsprachige Hotel-Websites mit integriertem Buchungssystem und gezielter SEO-Optimierung für touristische Suchanfragen in Regensburg.",
      },
      {
        name: "Gastronomie & Altstadtgastronomie",
        problem: "Restaurants in Regensburg sind mobil kaum zu finden oder überzeugen online nicht. Gäste buchen beim Mitbewerber, der besser online sichtbar ist.",
        solution: "Mobile-optimierte Restaurant-Websites mit Online-Reservierung, Speisekarte und Google-Business-Optimierung speziell für den Regensburg-Markt.",
      },
      {
        name: "Arztpraxen & Gesundheit",
        problem: "Praxen in Regensburg haben Websites, die nicht für lokale Suchanfragen optimiert sind und keine Online-Terminbuchung anbieten – Patienten gehen zur Konkurrenz.",
        solution: "Vertrauenswürdige Praxis-Websites mit Terminbuchung, DSGVO-konformem Kontaktformular und lokalem SEO für Suchanfragen in Regensburg.",
      },
      {
        name: "Mittelstand & B2B",
        problem: "B2B-Unternehmen im Regensburg-Umland haben Websites, die keinen Mehrwert für die Leadgenerierung liefern – sie existieren, aber sie konvertieren nicht.",
        solution: "Strategisch konzipierte Unternehmenswebsites mit klarer Positionierung, überzeugenden Inhalten und technischer Grundlage für lokale Sichtbarkeit.",
      },
    ],
    localScenarios: [
      {
        title: "Hotel in der Regensburger Altstadt",
        description: "Ein inhabergeführtes Hotel nahe dem Dom hat eine veraltete Website ohne mobiles Design. Buchungen kommen fast ausschließlich über Booking.com. Nach dem Website-Relaunch mit Buchungssystem und lokalem SEO steigen Direktbuchungen – mit deutlich besserer Marge als OTA-Buchungen.",
      },
      {
        title: "Zahnarztpraxis im Stadtgebiet",
        description: "Eine Zahnarztpraxis in Regensburg West findet sich bei Google-Suchen nach 'Zahnarzt Regensburg' erst auf Seite 3. Durch eine neue Website mit strukturierten Daten, Google My Business Optimierung und lokalem On-Page-SEO erscheint sie innerhalb von 8 Wochen auf den ersten Positionen.",
      },
      {
        title: "Mittelständisches B2B-Unternehmen im Gewerbegebiet",
        description: "Ein technischer Dienstleister im Gewerbegebiet Regensburg West hat eine Website, die Kompetenz ausstrahlt, aber keine Anfragen generiert. Nach der Überarbeitung mit klarer CTA-Struktur, Fallstudien und verbesserter Leadstrecke steigen qualifizierte Anfragen deutlich.",
      },
    ],
    sameServiceOtherCities: [
      { label: "Webdesign Bayreuth", href: "/bayreuth/webdesign" },
      { label: "Webdesign München", href: "/muenchen/webdesign" },
    ],
    otherServicesInCity: [
      { label: "KI-Telefonassistent Regensburg", href: "/regensburg/ki-telefonassistent" },
      { label: "Automatisierung Regensburg", href: "/regensburg/automatisierung" },
    ],
  },

  // ─── MÜNCHEN / KI TELEFONASSISTENT ───────────────────────────────────────────
  "muenchen/ki-telefonassistent": {
    city: "München",
    citySlug: "muenchen",
    service: "KI Telefonassistent",
    serviceSlug: "ki-telefonassistent",
    route: "/muenchen/ki-telefonassistent",
    locationNote: "Cogniiq betreut Projekte für Unternehmen in München vollständig remote – persönliche Termine im Raum München auf Anfrage möglich.",
    seo: {
      title: "KI Telefonassistent München – AI Rezeption & Telefonservice | Cogniiq",
      description: "KI Telefonassistent München: Automatische Anrufannahme, Terminbuchung & Weiterleitung für Unternehmen. 24/7, mehrsprachig, DSGVO-konform. Ohne Münchner Agentur-Overhead.",
      canonical: `${base}/muenchen/ki-telefonassistent`,
    },
    intro: {
      h1: "KI Telefonassistent für Unternehmen in München",
      lead: "München ist ein Wettbewerbsmarkt, in dem ein nicht beantworteter Anruf ein verlorener Kunde ist. Der KI Telefonassistent von Cogniiq übernimmt die telefonische Kommunikation präzise, rund um die Uhr, mehrsprachig – ohne Personalkosten, ohne Agentur-Overhead.",
    },
    localIntro: {
      paragraphs: [
        "München ist einer der dynamischsten Dienstleistungsmärkte Deutschlands – und einer der wettbewerbsintensivsten. Privatpraxen, Restaurants, Beratungsunternehmen, Immobilienbüros, Kanzleien und Premium-Dienstleister konkurrieren täglich um dieselben Kunden. In diesem Umfeld ist ein nicht beantworteter Anruf nicht nur ein verpasster Kontakt – es ist ein verlorener Kunde, der in wenigen Sekunden beim nächsten Anbieter anruft, der sofort abnimmt.",
        "Der KI Telefonassistent von Cogniiq ist für genau dieses Wettbewerbsumfeld entwickelt: Er beantwortet jeden eingehenden Anruf sofort – egal ob 8 Uhr morgens, 21 Uhr abends, am Wochenende oder während der Urlaubszeit. Häufige Fragen werden präzise beantwortet, Termine werden direkt ins Buchungssystem eingetragen, komplexe Anliegen werden strukturiert und vollständig an das zuständige Teammitglied weitergeleitet. Mehrsprachige Konfiguration ist auf Anfrage möglich – Deutsch und Englisch als Standard, weitere Sprachen auf Anfrage.",
        "Was Münchner Unternehmen von anderen Märkten unterscheidet: hohe Erwartungen an Reaktionsgeschwindigkeit, ein erheblicher Anteil internationaler Kunden und Patienten, ein Preisniveau, das jeden verlorenen Kunden teuer macht. Der KI Telefonassistent ist für diese Anforderungen konfiguriert – nicht als generisches Produkt, sondern als individuell angepasste Lösung für Ihren Münchner Betrieb.",
        "Cogniiq betreut Münchner Projekte vollständig remote – transparent, effizient und ohne die hohen Kosten lokaler Münchner Agenturen. Einrichtung in 7–14 Tagen, vollständig DSGVO-konform mit Verarbeitung auf deutschen Servern. Sie zahlen für das Ergebnis – nicht für Büroräume in der Maximilianstraße.",
        "Als Teil einer umfassenden digitalen Strategie für München lässt sich der KI Telefonassistent ideal mit [Prozessautomatisierung für München](/muenchen/automatisierung) und professionellem [Webdesign für München](/muenchen/webdesign) kombinieren. Unternehmen, die online sichtbar sind, Anfragen professionell entgegennehmen und effizient verarbeiten, sind im Münchner Markt klar im Vorteil.",
      ],
    },
    warumCogniiq: [
      "Keine Münchner Agenturpreise – transparente Kosten ohne Overhead für teure Bürolagen",
      "Mehrsprachige Konfiguration: Deutsch, Englisch und weitere Sprachen auf Anfrage",
      "Vollständige Remote-Einrichtung – kein Vor-Ort-Termin nötig, kein Zeitverlust",
      "Datenschutz nach DSGVO, Verarbeitung ausschließlich auf deutschen Servern",
      "Persönliche Betreuung – kein anonymes Callcenter, keine Ticket-Warteschlangen",
      "Erfahrung aus vergleichbaren bayerischen Projekten – keine unkalkulierbaren Risiken",
    ],
    useCases: [
      {
        industry: "Privatpraxen & Spezialisten",
        title: "24/7 Terminannahme für Privatpatienten",
        description: "Privatpatienten in München erwarten schnellste Reaktionszeiten. Der Assistent nimmt rund um die Uhr Terminanfragen entgegen, bucht direkt ins System und sendet Bestätigungen – ohne Mehrkosten für Nachtbereitschaft.",
      },
      {
        industry: "Gastronomie & Premium Dining",
        title: "Reservierungen ohne Servicetörung",
        description: "Münchner Restaurants im gehobenen Segment haben hohes Reservierungsvolumen. Der Assistent entlastet das Serviceteam dauerhaft – auf Englisch und Deutsch, an Stoßzeiten und am Wochenende.",
      },
      {
        industry: "Beratung, Recht & Finanzdienstleistung",
        title: "Erstanfragen strukturiert qualifizieren",
        description: "Kanzleien und Beratungsunternehmen in München profitieren, wenn Erstanfragen qualifiziert erfasst und zugewiesen werden – bevor ein Partner persönliche Zeit investiert.",
      },
    ],
    processSteps: [
      { number: "01", title: "Kennenlernen & Zieldefinition", description: "Remote-Gespräch über Ihre Anruftypen, Ihre Branche in München und Ihre Erwartungen. Welche Fragen kommen, wie soll der Assistent klingen, welche Sprachen brauchen Sie?" },
      { number: "02", title: "Konzept & Angebot", description: "Gesprächsdesign und Weiterleitungslogik – spezifisch auf Ihr Münchner Unternehmen. Festpreisangebot ohne Überraschungen." },
      { number: "03", title: "Umsetzung & Feinschliff", description: "Testläufe mit echten Münchner Szenarien. Sie hören den Assistenten selbst und geben Feedback – wir optimieren bis es passt." },
      { number: "04", title: "Go-Live & Optimierung", description: "Inbetriebnahme auf Ihrer Münchner Rufnummer. Aktives Monitoring und Optimierung in den ersten Wochen inklusive." },
    ],
    faq: [
      { question: "Kann der Assistent auf Englisch für internationale Kunden in München sprechen?", answer: "Ja. Mehrsprachige Konfigurationen sind Standard – Deutsch und Englisch gleichzeitig, mit automatischer Spracherkennung oder auf Wunsch des Anrufers umschaltbar." },
      { question: "Wie unterscheidet sich der Münchner Markt vom Rest Bayerns?", answer: "Höheres Anrufvolumen, höhere Erwartungen an Reaktionsgeschwindigkeit, stärkeres internationales Publikum und ein direktes Wettbewerbsumfeld. Der Assistent ist für alle diese Szenarien konfiguriert." },
      { question: "Könnt ihr Projekte in München vollständig remote betreuen?", answer: "Ja, vollständig. Alle Projektphasen laufen remote. Persönliche Termine im Raum München sind auf Anfrage möglich." },
      { question: "Was kostet der KI Telefonassistent für ein Münchner Unternehmen?", answer: "Gleiche Preise wie überall – transparent und auf Basis von Anrufvolumen und Konfiguration. Kein Münchner Aufpreis, keine versteckten Overheadkosten." },
      { question: "Ist die Technologie stabil genug für das hohe Volumen in München?", answer: "Ja. Die Plattformen sind für sehr hohes Volumen ausgelegt. Auch bei parallel eingehenden Anrufen gibt es keinen Qualitätsverlust." },
      { question: "Wie schnell ist die Einrichtung?", answer: "7–14 Tage nach dem ersten Gespräch – vollständig remote, ohne Vor-Ort-Termin." },
      { question: "Kann der Assistent für mehrere Standorte konfiguriert werden?", answer: "Ja. Für Unternehmen mit mehreren Standorten in München oder im Großraum können separate Konfigurationen pro Standort eingerichtet werden." },
      { question: "Unterstützt der Assistent auch Premium-Branchen wie Privatmedizin oder Luxus-Gastronomie?", answer: "Ja. Ton, Sprache und Gesprächsführung werden auf das Niveau Ihrer Marke angepasst – auch für das gehobene Münchner Premiumsegment." },
      { question: "Was passiert mit sensiblen Patientendaten oder Geschäftsinformationen?", answer: "Alle Daten werden DSGVO-konform auf deutschen Servern verarbeitet. Wir erstellen die notwendigen AVV-Dokumente und Datenschutznachweise." },
      { question: "Kann der Assistent mit meinem bestehenden Münchner Buchungssystem kommunizieren?", answer: "In den meisten Fällen ja. Wir prüfen die API-Verfügbarkeit Ihres Systems vorab und integrieren entsprechend." },
      { question: "Wie unterscheidet sich Cogniiq von Münchner Agenturen, die ähnliche Lösungen anbieten?", answer: "Wir haben keinen Münchner Overhead. Direkte Zusammenarbeit, faire Preise, schnelle Umsetzung – ohne mehrere Hierarchieebenen zwischen Ihnen und dem Ergebnis." },
    ],
    localChallenges: [
      "München hat einen der dichtesten Dienstleistungsmärkte in Deutschland – wer Anrufe nicht sofort beantwortet, verliert Kunden in Sekunden an direkte Konkurrenten",
      "Personalkosten in München sind die höchsten in Deutschland – Telefonpersonal ist teuer, schwer zu finden und zu halten",
      "Internationales Publikum in München erwartet mehrsprachigen Telefonservice auf höchstem Niveau",
    ],
    industries: ["Privatpraxen & Kliniken", "Gastronomie & Luxury Dining", "Beratung & Finanzdienstleistung", "Sport & Wellness", "Hotels & Hospitality", "Immobilien & Kanzleien"],
    industriesExpanded: [
      {
        name: "Privatpraxen & Spezialisten",
        problem: "Privatpraxen in München haben eine zahlungskräftige Patientenschaft, die sofortige Reaktionszeiten erwartet. Ein besetztes Telefon oder eine nicht beantwortete Anfrage führt direkt zum Wechsel.",
        solution: "Der KI Telefonassistent nimmt Anfragen sofort an – mehrsprachig, auf dem Niveau der Praxis, rund um die Uhr. Terminbuchung und Bestätigung vollautomatisch.",
      },
      {
        name: "Gastronomie & Premium Dining",
        problem: "Gehobene Restaurants in München haben höchste Ansprüche an den Telefonservice – und gleichzeitig ist das Personal während des Betriebs vollständig ausgelastet.",
        solution: "Ein auf das Sprachniveau und die Marke abgestimmter Assistent nimmt Reservierungen auf Deutsch und Englisch entgegen – diskret, professionell, auf dem Niveau des Hauses.",
      },
      {
        name: "Kanzleien & Rechtsberatung",
        problem: "Rechtsanwaltskanzleien in München wollen keine Mandantenanfragen durch überforderte Telefonzentralen filtern lassen – aber haben auch keine Zeit, jeden Erstanruf selbst zu führen.",
        solution: "Der Assistent qualifiziert Erstanfragen strukturiert, erfasst Kontaktdaten und leitet an den zuständigen Anwalt weiter – effizient, diskret, professionell.",
      },
      {
        name: "Hotels & Hospitality",
        problem: "Münchner Hotels erhalten Anfragen auf mehreren Sprachen zu jeder Tages- und Nachtzeit. Das Front-Desk-Team ist tagsüber vollständig ausgelastet.",
        solution: "Mehrsprachiger KI Telefonassistent für Reservierungsanfragen, Informationen und Weiterleitung – skalierbar für Stoßzeiten wie Oktoberfest oder internationale Messen.",
      },
      {
        name: "Immobilien & Makler",
        problem: "Immobilienmakler in München verlieren potenzielle Käufer und Mieter, wenn Anfragen nicht sofort beantwortet werden – der Markt ist zu konkurrenzreich für Verzögerungen.",
        solution: "Sofortige Anrufannahme, Erfassung der Anfrage und strukturierte Weiterleitung – damit kein potenzieller Interessent unbeantwortet bleibt.",
      },
    ],
    localScenarios: [
      {
        title: "Privatarztpraxis in Schwabing",
        description: "Eine internistische Privatpraxis in Schwabing hat eine internationale Patientenschaft, die häufig auf Englisch anruft. Nach Einführung des KI Telefonassistenten werden Anfragen sofort auf Deutsch und Englisch angenommen und Termine direkt in das Praxissystem gebucht – ohne Belastung des Praxisteams.",
      },
      {
        title: "Gehobenes Restaurant in der Altstadt",
        description: "Ein Restaurant in der Münchner Altstadt erhält täglich Dutzende Reservierungsanfragen – viele abends nach Küchenschluss, von internationalen Gästen auf Englisch. Der KI Telefonassistent nimmt diese Anfragen professionell und auf Sprachniveau des Hauses entgegen und bestätigt automatisch.",
      },
      {
        title: "Kanzlei in der Maxvorstadt",
        description: "Eine mittelgroße Kanzlei in der Maxvorstadt hat täglich Erstanrufe von potenziellen Mandanten, die jedoch durch das Telefonteam nicht ausreichend qualifiziert werden. Der Assistent erfasst Anliegen strukturiert, prüft Zuständigkeiten und leitet gezielt an den richtigen Anwalt weiter.",
      },
      {
        title: "Luxushotel im Stadtgebiet",
        description: "Ein Luxushotel in München erhält Anfragen auf vier Sprachen rund um die Uhr – Deutsch, Englisch, Französisch, Arabisch. Der KI Telefonassistent deckt Deutsch und Englisch vollständig ab und leitet andere Sprachen gezielt an verfügbare Mitarbeiter weiter.",
      },
    ],
    sameServiceOtherCities: [
      { label: "KI-Telefonassistent Bayreuth", href: "/bayreuth/ki-telefonassistent" },
      { label: "KI-Telefonassistent Regensburg", href: "/regensburg/ki-telefonassistent" },
    ],
    otherServicesInCity: [
      { label: "Automatisierung München", href: "/muenchen/automatisierung" },
      { label: "Webdesign München", href: "/muenchen/webdesign" },
    ],
  },

  // ─── MÜNCHEN / AUTOMATISIERUNG ───────────────────────────────────────────────
  "muenchen/automatisierung": {
    city: "München",
    citySlug: "muenchen",
    service: "Automatisierung",
    serviceSlug: "automatisierung",
    route: "/muenchen/automatisierung",
    locationNote: "Cogniiq betreut Automatisierungsprojekte für Unternehmen in München vollständig remote – transparent, effizient, ohne Qualitätseinbußen.",
    seo: {
      title: "Automatisierung München – Prozessautomatisierung & Workflows | Cogniiq",
      description: "Prozessautomatisierung für Unternehmen in München: Workflows & ERP-Integration, Leadverarbeitung. Remote betreut, skalierbar, DSGVO-konform. Kein Münchner Overhead.",
      canonical: `${base}/muenchen/automatisierung`,
    },
    intro: {
      h1: "Automatisierung für Unternehmen in München",
      lead: "Münchner Unternehmen wachsen schnell und haben keine Zeit für manuelle Prozesse. Wir automatisieren das, was täglich Zeit kostet: Leadverarbeitung, Datensynchronisation, Buchungen, Reporting. Remote betreut, dauerhaft wartbar, enterprise-ready.",
    },
    localIntro: {
      paragraphs: [
        "München ist ein Ausnahmestandort für Prozessautomatisierung: Schnell wachsende Startups brauchen von Anfang an skalierbare Prozesse. Mittelständler kämpfen mit gewachsenen Tool-Landschaften und manuellen Brücken zwischen Systemen. Konzerne digitalisieren einzelne Abteilungen ohne das große IT-Projekt anzufassen. Und Premium-Dienstleister wollen Effizienz, ohne Qualität und Markenwahrnehmung zu kompromittieren. Cogniiq liefert für alle diese Szenarien präzise Automatisierungslösungen.",
        "Als Automatisierungs-Agentur, die Münchner Unternehmen vollständig remote betreut, kombinieren wir das technische Know-how einer spezialisierten Agentur mit den Preisstrukturen, die großen Münchner Agenturen mit teurer Büromiete fehlen. Die Zusammenarbeit läuft über Video-Calls, geteilte Boards und vollständig dokumentierte Konzepte – genauso professionell wie vor Ort, ohne Fahrtzeiten und ohne Overhead-Kosten.",
        "Für Workflow-Automatisierung in München setzen wir auf professionelle, skalierbare Plattformen – je nach Ihren Anforderungen an Datenschutz, Skalierbarkeit und Kosten empfehlen wir die passende Lösung. Bei komplexen ERP-Integrationen oder spezifischen API-Anforderungen entwickeln wir auch direkte Schnittstellen. Alle Lösungen sind vollständig dokumentiert und so gebaut, dass sie Ihr Team versteht und selbst warten kann.",
        "Was den Münchner Markt besonders macht: Personalkosten sind die höchsten in Deutschland – jede Stunde, die durch Automatisierung eingespart wird, hat hier den höchsten ROI. Ein Workflow, der täglich 2 Stunden Arbeit ersetzt, amortisiert sich in München schneller als in jeder anderen deutschen Stadt. Das macht Automatisierungsinvestitions in München besonders attraktiv.",
        "Neben der Automatisierung bieten wir für München auch den [KI Telefonassistenten für München](/muenchen/ki-telefonassistent) und professionelles [Webdesign für München](/muenchen/webdesign) an. Unternehmen, die alle drei Bereiche kombinieren, haben im Münchner Wettbewerbsmarkt einen messbaren operativen Vorteil.",
      ],
    },
    warumCogniiq: [
      "Kein Münchner Agentur-Overhead – direkte Zusammenarbeit, faire Preise",
      "Technologieoffene Beratung: professionelle Plattformen und direkte APIs – je nach Bedarf",
      "Saubere Dokumentation, die Ihr Team versteht und nutzen kann",
      "DSGVO-konforme Verarbeitung auf europäischen Servern – kein Datenschutz-Risiko",
      "Erfahrung mit Skalierung: von 5 bis 500 automatisierten Prozessen",
      "Schnelle Reaktionszeiten bei Anpassungen – auch für wachsende Münchner Unternehmen",
    ],
    useCases: [
      {
        industry: "Startups & Scale-ups",
        title: "Lead-Nurturing vollautomatisch",
        description: "Neue Leads aus allen Quellen landen qualifiziert im CRM, erhalten automatisierte Follow-ups und werden den richtigen Vertriebsmitarbeitern zugewiesen – ohne manuelle Eingriffe, skalierbar mit dem Unternehmen.",
      },
      {
        industry: "Mittelstand & Konzerne",
        title: "System-Integrationen ohne IT-Projekt",
        description: "ERP, CRM, Marketing-Tools und Buchhaltung tauschen Daten automatisch aus – keine manuellen Importe, keine Doppelerfassung, keine Fehler beim Transfer zwischen Systemen.",
      },
      {
        industry: "E-Commerce & Retail",
        title: "Bestell- und Lagermanagement automatisieren",
        description: "Bestellungen triggern Lager-Updates, Versandmeldungen und Kundenkommunikation vollautomatisch – ohne manuelle Eingriffe, skalierbar für hohes Transaktionsvolumen im Münchner Markt.",
      },
    ],
    processSteps: [
      { number: "01", title: "Kennenlernen & Zieldefinition", description: "Remote-Workshop: Welche Prozesse in Ihrem Münchner Unternehmen haben den größten ROI? Wir priorisieren nach Zeitersparnis und Fehlerreduktion." },
      { number: "02", title: "Konzept & Angebot", description: "Datenfluss-Diagramm, Tool-Auswahl, Risikobewertung und Festpreisangebot. Kein Blind-Start – Sie stimmen zu, bevor wir entwickeln." },
      { number: "03", title: "Umsetzung & Feinschliff", description: "Aufbau in einer Testumgebung, Abnahme durch Ihr Team, dann Deployment. Keine Experimente im Live-Betrieb." },
      { number: "04", title: "Go-Live & Optimierung", description: "Vollständige Dokumentation, Einweisung und optional laufender Support-Vertrag für kontinuierliche Weiterentwicklung." },
    ],
    faq: [
      { question: "Kann die gesamte Zusammenarbeit remote stattfinden?", answer: "Ja, vollständig. Alle Projektphasen laufen remote via Video-Calls und geteilten Boards – genauso professionell wie vor Ort." },
      { question: "Wie unterscheiden sich eure Preise von Münchner Agenturen?", answer: "Wir haben keinen Münchner Overhead – faire Preise, direkte Zusammenarbeit ohne viele Hierarchieebenen." },
      { question: "Habt ihr Erfahrung mit Skalierung für Münchner Unternehmen?", answer: "Ja. Wir bauen Automatisierungen von Anfang an skalierbar – damit sie mit Ihrem Unternehmen wachsen können." },
      { question: "Können komplexe ERP-Systeme integriert werden?", answer: "In den meisten Fällen ja. Wir prüfen vorab welche APIs verfügbar sind und was technisch machbar ist." },
      { question: "Was wenn sich unsere Prozesse ändern?", answer: "Wir passen die Automatisierungen an. Durch vollständige Dokumentation können einfache Änderungen auch intern vorgenommen werden." },
      { question: "Wie lange dauert ein Automatisierungsprojekt in München?", answer: "Einfache Workflows: 1–2 Wochen. Komplexe Integrationen: 4–8 Wochen. Realistischer Zeitplan nach der Analyse." },
      { question: "Welche Branchen in München betreut ihr?", answer: "Startups, Scaleups, E-Commerce, Beratung, Finanzdienstleistung, Mittelstand, Medizintechnik und SaaS – wir passen uns Ihrer Branche an." },
      { question: "Welche Automatisierungsplattform ist die richtige für mein Unternehmen in München?", answer: "Das hängt von Ihren Anforderungen ab: Datenschutzbedürfnisse, Skalierbarkeit und technische Komplexität. Wir beraten unabhängig und empfehlen die Lösung, die langfristig am besten zu Ihrem Unternehmen passt." },
      { question: "Wie hoch ist der ROI von Automatisierungen in München?", answer: "Durch die hohen Personalkosten in München amortisieren sich Automatisierungen schneller als in anderen Städten. Ein Workflow, der täglich 2 Stunden Arbeit ersetzt, zahlt sich bei Münchner Lohnniveau oft in wenigen Monaten." },
      { question: "Bietet Cogniiq auch laufende Wartung an?", answer: "Ja. Auf Wunsch übernehmen wir laufenden Support, Updates und Erweiterungen – mit definierten Reaktionszeiten." },
    ],
    localChallenges: [
      "Münchner Unternehmen zahlen die höchsten Personalkosten in Deutschland – manuelle Prozesse kosten hier mehr als anderswo",
      "Viele Münchner KMU und Startups haben viele Tools im Einsatz, die nicht automatisch kommunizieren",
      "Schnell wachsende Teams brauchen skalierbare Prozesse, bevor manuelle Arbeit zum Wachstumsengpass wird",
    ],
    industries: ["Startups & Scaleups", "Mittelstand & KMU", "E-Commerce & Retail", "Finanzdienstleistung", "Consulting", "Medizintechnik", "SaaS-Unternehmen"],
    industriesExpanded: [
      {
        name: "Startups & Scaleups",
        problem: "Münchner Startups wachsen schnell und bauen dabei manuelle Prozesse auf, die im Betrieb kurzfristig funktionieren aber langfristig skalieren nicht. Mit jedem neuen Mitarbeiter wächst der Prozessaufwand überproportional.",
        solution: "Automatisierungen für Lead-Verarbeitung, Kunden-Onboarding, Reporting und Kommunikation – die von Anfang an so gebaut werden, dass sie mit dem Unternehmen wachsen.",
      },
      {
        name: "E-Commerce & D2C",
        problem: "E-Commerce-Unternehmen in München haben bei Wachstum sofort Engpässe bei Bestellabwicklung, Lagerhaltung und Kundenkommunikation – weil alles noch manuell läuft.",
        solution: "Vollautomatisierte Bestellverarbeitung, Lagerabgleich, Versandmeldungen und Kundenkommunikation – ohne manuelle Eingriffe, skalierbar für hohes Volumen.",
      },
      {
        name: "Finanzdienstleistung & Beratung",
        problem: "Beratungsunternehmen in München verlieren Zeit mit manuellem Kunden-Onboarding, Dokumentenmanagement und CRM-Pflege.",
        solution: "Vom Erstanfrage-Eingang bis zum abgeschlossenen Onboarding laufen alle Schritte automatisch – DSGVO-konform, vollständig dokumentiert.",
      },
      {
        name: "Medizintechnik & Life Sciences",
        problem: "Medizintechnik-Unternehmen in München haben komplexe Prozesse für Compliance, Reporting und Kundenkommunikation, die noch manuell ablaufen.",
        solution: "Automatisierte Workflows für Reporting, Kundenkommunikation und Datensynchronisation – mit Berücksichtigung der branchenspezifischen Compliance-Anforderungen.",
      },
    ],
    localScenarios: [
      {
        title: "B2B-SaaS-Startup in Schwabing",
        description: "Ein SaaS-Startup in Schwabing erhält täglich neue Trial-Anmeldungen, die manuell im CRM erfasst, mit Welcome-E-Mails begrüßt und dem Vertriebsteam zugewiesen werden. Nach der Automatisierung läuft der gesamte Prozess in unter 2 Minuten – von der Anmeldung bis zur personalisierten Begrüßungssequenz.",
      },
      {
        title: "E-Commerce-Unternehmen in der Maxvorstadt",
        description: "Ein D2C-Brand aus der Maxvorstadt verwaltet 100 Bestellungen pro Tag manuell in drei Systemen. Bestellabwicklung, Lagerabzug und Versandbenachrichtigung sind fehleranfällig und zeitintensiv. Nach der Automatisierung läuft der gesamte Prozess vollautomatisch – mit messbarer Fehlerreduktion.",
      },
      {
        title: "Unternehmensberatung im Münchner Stadtgebiet",
        description: "Eine mittelgroße Unternehmensberatung in München verliert wöchentlich Stunden mit dem manuellen Onboarding neuer Mandanten – Verträge versenden, Zugänge einrichten, erste Termine koordinieren. Nach der Automatisierung läuft Onboarding innerhalb von Minuten nach Vertragsunterzeichnung vollständig automatisch ab.",
      },
    ],
    sameServiceOtherCities: [
      { label: "Automatisierung Bayreuth", href: "/bayreuth/automatisierung" },
      { label: "Automatisierung Regensburg", href: "/regensburg/automatisierung" },
    ],
    otherServicesInCity: [
      { label: "KI-Telefonassistent München", href: "/muenchen/ki-telefonassistent" },
      { label: "Webdesign München", href: "/muenchen/webdesign" },
    ],
  },

  // ─── MÜNCHEN / WEBDESIGN ─────────────────────────────────────────────────────
  "muenchen/webdesign": {
    city: "München",
    citySlug: "muenchen",
    service: "Webdesign",
    serviceSlug: "webdesign",
    route: "/muenchen/webdesign",
    locationNote: "Cogniiq entwickelt Websites für Unternehmen in München vollständig remote – persönliche Termine im Raum München auf Anfrage möglich.",
    seo: {
      title: "Webdesign Agentur München – Website erstellen ohne Agentur-Overhead | Cogniiq",
      description: "Webdesign München: Individuelle Websites für Startups, Mittelstand und Premium-Segment. Enterprise-Qualität ohne Münchner Agenturpreise. SEO-optimiert, schnell, mehrsprachig.",
      canonical: `${base}/muenchen/webdesign`,
    },
    intro: {
      h1: "Webdesign für Unternehmen in München",
      lead: "München hat viele Webdesign-Agenturen mit entsprechenden Preisen. Cogniiq bietet dasselbe technische Niveau und dieselbe gestalterische Qualität – ohne Münchner Overhead: individuelle Entwicklung, Enterprise-Performance, faire Preise.",
    },
    localIntro: {
      paragraphs: [
        "München ist ein digitaler Wettbewerbsmarkt, in dem Websites sowohl visuell als auch technisch auf höchstem Niveau sein müssen. Startups positionieren sich für internationale Investoren. Mittelständler brauchen Websites, die qualifizierte B2B-Anfragen generieren. Premium-Dienstleister müssen online dasselbe Niveau darstellen, das ihre Marke offline lebt. Und alle konkurrieren in einem Markt, in dem Google täglich entscheidet, wer gesehen wird – und wer nicht.",
        "Cogniiq bietet Münchner Unternehmen eine echte Alternative zu lokalen Agenturen: Entwicklung auf Enterprise-Niveau, direkte Zusammenarbeit mit dem Entwickler Ihrer Website – ohne drei Hierarchieebenen zwischen Ihrem Feedback und der Umsetzung. Individuelle Konzeption, technische Präzision, SEO von Anfang an integriert, mehrsprachige Entwicklung auf Wunsch – für ein Budget, das bei einer lokalen Münchner Agentur oft nicht einmal für das erste Designkonzept reicht.",
        "Was technisch Standard für uns ist: Ladezeiten unter 1,5 Sekunden, Core Web Vitals im grünen Bereich, Mobile-First-Design (über 70% der Münchner Suchanfragen kommen vom Smartphone), strukturierte Daten für Google und DSGVO-konforme Implementierung aller Tools. Diese technischen Grundlagen sind keine Optional-Features – sie sind die Basis, auf der jede Website für den Münchner Markt gebaut sein muss.",
        "Für internationale Unternehmen und Münchner Firmen mit globalen Kunden: Mehrsprachige Website-Entwicklung auf Deutsch und Englisch ist Standard, weitere Sprachen auf Anfrage. Wir kennen die Anforderungen an internationale SEO-Strukturen und setzen sie technisch korrekt um.",
        "Als Ergänzung zum Webdesign bieten wir in München auch den [KI Telefonassistenten für München](/muenchen/ki-telefonassistent) und [Prozessautomatisierung für München](/muenchen/automatisierung) an. Alle drei Bereiche aus einer Hand – für eine konsistente, leistungsstarke digitale Infrastruktur ohne Schnittstellenprobleme zwischen verschiedenen Agenturen.",
      ],
    },
    warumCogniiq: [
      "Enterprise-Qualität ohne Münchner Agenturpreis – kein Overhead für teure Bürolagen",
      "Individuelle Entwicklung – kein Template, kein Einheitslook, keine Copy-Paste-Arbeit",
      "Technische Spitzenklasse: Performance, Core Web Vitals, sauberer Code",
      "SEO für den Münchner Markt von Anfang an – lokal und international",
      "Mehrsprachige Entwicklung: Deutsch, Englisch und weitere Sprachen",
      "Remote-Zusammenarbeit mit klaren Prozessen – transparent und effizient",
    ],
    useCases: [
      {
        industry: "Startups & Tech-Unternehmen",
        title: "Unternehmens-Website für internationale Positionierung",
        description: "Münchner Startups brauchen Websites, die Investoren, internationale Kunden und Talente ansprechen – visuell stark, technisch einwandfrei, schnell, mehrsprachig.",
      },
      {
        industry: "Mittelstand & B2B",
        title: "Lead-generierende Unternehmenswebsite",
        description: "B2B-Unternehmen in München brauchen Websites, die Kompetenz kommunizieren und qualifizierte Anfragen generieren – keine reine Präsenzwebsite ohne Conversion-Fokus.",
      },
      {
        industry: "Luxury & Premium-Segment",
        title: "Premium-Markenauftritt im Web",
        description: "Für Münchner Unternehmen im Premiumsegment: ein Webauftritt, der die Marke adäquat repräsentiert – ästhetisch und technisch auf höchstem Niveau, mehrsprachig, international.",
      },
    ],
    processSteps: [
      { number: "01", title: "Kennenlernen & Zieldefinition", description: "Remote-Workshop zu Zielen, Zielgruppen, Wettbewerbsumfeld in München und bestehenden Materialien. Was soll die Website für Ihr Unternehmen erreichen?" },
      { number: "02", title: "Konzept & Angebot", description: "Seitenstruktur, Design, Texte und SEO-Strategie für München entstehen iterativ. Kein Datei-Transfer ohne Feedback-Schleifen." },
      { number: "03", title: "Umsetzung & Feinschliff", description: "Technische Umsetzung mit Performance-Fokus. Sie sehen die Website in einer vollständigen Live-Vorschau und geben Feedback." },
      { number: "04", title: "Go-Live & Optimierung", description: "Live-Schaltung, Google-Setup, Analytics und Monitoring. Erste Optimierungen nach den tatsächlichen Nutzungsdaten." },
    ],
    faq: [
      { question: "Arbeitet ihr auch für größere Münchner Unternehmen?", answer: "Ja. Wir skalieren den Prozess entsprechend – von der einfachen Unternehmenswebsite bis zum komplexen mehrsprachigen Web-Projekt." },
      { question: "Was kostet eine Website für ein Münchner Unternehmen?", answer: "Ab ca. 2.500 € für einfachere Projekte, komplexere nach Aufwand. Kein Münchner Aufpreis – faire Preise für jeden Markt." },
      { question: "Könnt ihr mit Münchner Markenagenturen zusammenarbeiten?", answer: "Ja. Wir übernehmen gerne die technische Umsetzung von Designs, die von anderen Agenturen erstellt wurden." },
      { question: "Habt ihr Erfahrung mit SEO für den Münchner Markt?", answer: "Ja. Lokaler SEO für den Münchner Markt erfordert Strategie – wir kennen den Wettbewerb und setzen gezielte Maßnahmen um." },
      { question: "Wie funktioniert die Remote-Zusammenarbeit?", answer: "Video-Calls, Figma-Boards, Staging-Umgebungen – genauso wie bei lokalen Agenturen, ohne Pendelzeit und ohne Overhead." },
      { question: "Wie schnell kann eine Website live gehen?", answer: "Einfachere Projekte in 4–6 Wochen, komplexere in 8–12 Wochen. Immer mit realistischem Zeitplan nach dem Briefing." },
      { question: "Könnt ihr Websites auf Englisch und Deutsch gleichzeitig entwickeln?", answer: "Ja. Mehrsprachige Websites mit korrekter hreflang-Implementierung und internationaler SEO-Struktur sind unser Standard für Münchner Kunden mit globalem Publikum." },
      { question: "Was unterscheidet Cogniiq von einer Münchner Agentur?", answer: "Kein Overhead für teure Büroräume, direkte Zusammenarbeit mit dem Entwickler, schnellere Umsetzung, faire Preise. Dasselbe Ergebnis – ohne die Kosten der Münchner Innenstadt." },
      { question: "Habt ihr Erfahrung mit dem Münchner Premium-Segment?", answer: "Ja. Ton, Ästhetik und technisches Niveau werden auf das Premiumsegment angepasst – für Unternehmen, bei denen der erste digitale Eindruck entscheidend ist." },
      { question: "Was passiert nach dem Launch?", answer: "Wir analysieren Nutzungsdaten, identifizieren Optimierungspotenzial und setzen Verbesserungen um. Laufende Betreuung auf Wunsch." },
      { question: "Kann ich die Website selbst pflegen?", answer: "Ja. Wir richten auf Wunsch ein CMS ein und schulen Ihr Team. Alternativ übernehmen wir die Pflege." },
    ],
    localChallenges: [
      "Münchner Agenturen verlangen Premium-Preise, die für viele Unternehmen nicht gerechtfertigt sind – der Overhead übersteigt oft die eigentliche Entwicklungsleistung",
      "Der Münchner Markt ist international geprägt – eine Website ohne Englisch verliert relevante Zielgruppen",
      "Die Konkurrenz in München ist technisch oft sehr stark aufgestellt – langsame oder veraltete Websites kosten sofort sichtbar Kunden",
    ],
    industries: ["Startups & Scaleups", "Luxury & Premium", "B2B-Dienstleistung", "Beratung & Consulting", "Medizintechnik & Health", "Immobilien", "Gastronomie & Hotels"],
    industriesExpanded: [
      {
        name: "Startups & Technologieunternehmen",
        problem: "Münchner Startups brauchen Websites, die sowohl für Investoren als auch für internationale Kunden überzeugend sind – technisch performant, englischsprachig und visuell stark.",
        solution: "Individuelle Website-Entwicklung in Deutsch und Englisch, optimiert für internationale Sichtbarkeit und Investor-Kommunikation.",
      },
      {
        name: "Luxury & Premium-Dienstleister",
        problem: "Premium-Unternehmen in München können sich eine durchschnittliche Website nicht leisten – die Online-Präsenz muss dieselbe Qualität kommunizieren wie das physische Angebot.",
        solution: "Designpräzise, technisch einwandfreie Websites, die Premium-Positionierung digital überzeugend vermitteln – ästhetisch und funktional auf höchstem Niveau.",
      },
      {
        name: "B2B-Mittelstand & Beratung",
        problem: "Mittelständische B2B-Unternehmen in München haben Websites, die zwar existieren aber keine qualifizierten Anfragen generieren – weil Struktur und Inhalte nicht auf Conversion ausgerichtet sind.",
        solution: "Strategisch konzipierte Unternehmenswebsites mit klarer Positionierung, überzeugenden Case Studies und technischer SEO-Grundlage für Sichtbarkeit in München.",
      },
      {
        name: "Hotels & Hospitality",
        problem: "Münchner Hotels verlieren Direktbuchungen an OTA-Plattformen, weil die eigene Website nicht überzeugend oder technisch nicht konkurrenzfähig ist.",
        solution: "Hochwertige Hotel-Websites mit Buchungssystem, mehrsprachigem Content und SEO-Optimierung für touristische Suchanfragen in München.",
      },
    ],
    localScenarios: [
      {
        title: "Tech-Startup in Schwabing",
        description: "Ein B2B-SaaS-Startup in Schwabing hat eine intern gebaute Website, die technisch schwach und nicht für internationale Nutzer optimiert ist. Nach dem Website-Relaunch in Deutsch und Englisch mit klarer Produktpositionierung und SEO-Struktur steigen qualifizierte Demo-Anfragen messbar.",
      },
      {
        title: "Privatarztpraxis in der Maxvorstadt",
        description: "Eine Privatarztpraxis in der Maxvorstadt hat eine veraltete Website ohne Online-Terminbuchung und schlechter Google-Sichtbarkeit. Nach dem Relaunch mit lokaler SEO-Optimierung für 'Privatarzt München' und mehrsprachigem Content steigen Neupatientenanfragen deutlich.",
      },
      {
        title: "Beratungsunternehmen mit internationalen Kunden",
        description: "Eine Unternehmensberatung in München arbeitet mit internationalen Kunden und braucht eine mehrsprachige Website, die auf Englisch ebenso überzeugend ist wie auf Deutsch. Cogniiq entwickelt eine technisch performante, international SEO-optimierte Website mit klarer Service-Positionierung.",
      },
    ],
    sameServiceOtherCities: [
      { label: "Webdesign Bayreuth", href: "/bayreuth/webdesign" },
      { label: "Webdesign Regensburg", href: "/regensburg/webdesign" },
    ],
    otherServicesInCity: [
      { label: "KI-Telefonassistent München", href: "/muenchen/ki-telefonassistent" },
      { label: "Automatisierung München", href: "/muenchen/automatisierung" },
    ],
  },
};

export const CITY_LINKS: Record<CitySlug, { label: string; services: Array<{ label: string; href: string }> }> = {
  bayreuth: {
    label: "Bayreuth",
    services: [
      { label: "Webdesign Bayreuth", href: "/bayreuth/webdesign" },
      { label: "KI-Telefonassistent Bayreuth", href: "/bayreuth/ki-telefonassistent" },
      { label: "Automatisierung Bayreuth", href: "/bayreuth/automatisierung" },
    ],
  },
  muenchen: {
    label: "München",
    services: [
      { label: "Webdesign München", href: "/muenchen/webdesign" },
      { label: "KI-Telefonassistent München", href: "/muenchen/ki-telefonassistent" },
      { label: "Automatisierung München", href: "/muenchen/automatisierung" },
    ],
  },
  regensburg: {
    label: "Regensburg",
    services: [
      { label: "Webdesign Regensburg", href: "/regensburg/webdesign" },
      { label: "KI-Telefonassistent Regensburg", href: "/regensburg/ki-telefonassistent" },
      { label: "Automatisierung Regensburg", href: "/regensburg/automatisierung" },
    ],
  },
};
