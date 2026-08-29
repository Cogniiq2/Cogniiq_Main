// ─────────────────────────────────────────────────────────────────────────────
// City × service page CONTENT.
//
// Split out of standorte-data.ts for one reason: it is ~102 KiB of German
// marketing copy that only nine of the site's routes render, and while it lived
// beside CITY_LINKS it was pulled into the entry chunk by every module that
// wanted that small nav list (Navigation -> premium-mobile-nav, BayernPage,
// DeutschlandPage, CityLandingPage) as well as by the route table in App.tsx.
// Every visitor on every route downloaded it, including /app/login.
//
// The route STRINGS stay in standorte-data.ts as CITY_SERVICE_ROUTES so the
// router can register the routes without loading this file; the two lists are
// held in exact agreement by src/lib/standorte-data.test.ts, so there is no
// second source of truth to drift.
// ─────────────────────────────────────────────────────────────────────────────
import { BUSINESS_INFO } from "./seo-data";
import type { CityServiceConfig } from "./standorte-data";
import { EINRICHTUNG_SCHRITTE, FAKTEN } from "./telefonassistent-copy";

const base = BUSINESS_INFO.website;

// Gemeinsamer Einrichtungsprozess für die drei Telefonassistent-Stadtseiten.
// Bewusst identisch (Brief §7.3: Prozess-Schritte sind zulässige geteilte
// Blöcke) — die stadtspezifischen Inhalte liegen in Intro, Szenarien und FAQ.
const TELEFONASSISTENT_PROZESS = EINRICHTUNG_SCHRITTE.map((s) => ({
  number: s.step,
  title: s.title,
  description: s.description,
}));

export const CITY_SERVICE_CONFIGS: Record<string, CityServiceConfig> = {

  // ─── BAYREUTH / KI TELEFONASSISTENT ──────────────────────────────────────────
  "bayreuth/ki-telefonassistent": {
    city: "Bayreuth",
    citySlug: "bayreuth",
    service: "KI Telefonassistent",
    serviceSlug: "ki-telefonassistent",
    route: "/bayreuth/ki-telefonassistent",
    seo: {
      title: "KI Telefonassistent Bayreuth – Anrufannahme | Cogniiq",
      description: "KI Telefonassistent für Betriebe in Bayreuth: Anrufannahme mit Ihrer Stimmauswahl und Ihren Regeln, strukturierte Übergabe an Ihr Team, Betreuung vor Ort.",
      canonical: `${base}/bayreuth/ki-telefonassistent`,
    },
    intro: {
      h1: "KI Telefonassistent in Bayreuth",
      lead: "Das Telefon klingelt, während Patient oder Gast vor Ihnen steht – in Praxen, Gastronomie und Betrieben in Bayreuth gehört dieser Moment zum Alltag. Der KI Telefonassistent von Cogniiq nimmt diese Anrufe an: mit Ihrer Stimmauswahl, Ihrem Begrüßungssatz, Ihren Formulierungen und Ihren Regeln.",
    },
    localIntro: {
      paragraphs: [
        "Bayreuth ist eine Mittelstadt in Oberfranken. Arzt- und Zahnarztpraxen, Therapiepraxen, Gastronomie, Sportanlagen und Handwerksbetriebe prägen den Ort. So unterschiedlich diese Betriebe sind – am Telefon teilen sie dasselbe Problem: Die Anrufe kommen gebündelt zu Stoßzeiten, genau dann, wenn das Personal in Behandlung, Service oder Kundengespräch gebunden ist.",
        "Der Telefonassistent nimmt die Anrufe an, die sonst ins Leere laufen: morgens vor Öffnung, in der Mittagspause, nach Feierabend, am Wochenende. Wiederkehrende Fragen zu Zeiten, Anfahrt oder Verfügbarkeit beantwortet er nach Ihren Vorgaben. Terminwünsche trägt er nach Ihren Regeln ein oder legt sie zur Bestätigung vor. Alles andere übergibt er strukturiert an Ihr Team – mit Rückrufnummer, Anliegen und nächstem Schritt.",
        "Ehrlich betrachtet: Viele Betriebe haben Telefonassistenten schon ausprobiert und wieder abgeschafft. Selten lag es daran, dass die Technik den Anrufer nicht verstand. Gescheitert ist meist, was danach kam – das Ergebnis landete nirgends, die Stimme klang nach Automat, und niemand passte das System an den Betrieb an. Um genau diese drei Punkte herum ist unser Assistent gebaut: Übergabe zuerst, Ansagen mit Ihrem Ton, laufende Anpassung als Teil des Betriebs.",
        `Die Einrichtung übernimmt Cogniiq vollständig; Ihre Anrufe werden auf den Assistenten umgeleitet. ${FAKTEN.uebergabeGarantie} Als Anbieter mit Hauptsitz in Bayreuth sind wir direkt erreichbar – mit festem Ansprechpartner statt Ticketsystem, auf Wunsch auch mit Terminen vor Ort.`,
        "Ob Hausarztpraxis in der Innenstadt, Restaurant zur Festspielzeit oder Handwerksbetrieb im Umland: Der Anliegen-Katalog wird auf Ihren Betrieb zugeschnitten und wächst mit, wenn sich Zeiten oder Abläufe ändern. Ergänzend unterstützen wir mit [Automatisierung in Bayreuth](/bayreuth/automatisierung) und [Webdesign in Bayreuth](/bayreuth/webdesign).",
      ],
    },
    warumCogniiq: [
      `Festes Minutenkontingent, darüber ${FAKTEN.mehrpreisProMinute}/Min. – gedeckelt auf die ausgewiesene Obergrenze Ihres Tarifs; Einmalposten stehen vor Vertragsschluss im Angebot`,
      "Ihre Stimmauswahl, Ihr Begrüßungssatz, Ihre Formulierungen – Anrufer erfahren im ersten Satz, dass ein KI-System spricht",
      "Jedes Gespräch endet als strukturierter Eintrag bei Ihrem Team – kein Abhören, kein Abtippen",
      "Ihre Anrufe werden auf die vereinbarte Nummer umgeleitet – was dafür an Ihrem Anschluss nötig ist, sehen wir uns vor dem Angebot an",
      "Hauptsitz in Bayreuth: fester Ansprechpartner, direkte Erreichbarkeit, Termine vor Ort möglich",
      "Keine Gesprächsaufzeichnung, kein Training mit Ihren Daten – Auftragsverarbeitungsvertrag nach Art. 28 DSGVO inklusive",
    ],
    useCases: [
      {
        industry: "Arztpraxis & Therapiepraxis",
        title: "Entlastung für die Anmeldung zu Stoßzeiten",
        description: "Der Assistent nimmt Terminwünsche, Stornierungen und Rezeptbestellungen an, wenn die Anmeldung gebunden ist, und übergibt sie als strukturierte Einträge. Medizinische Auskünfte gibt er nicht; Notfall-Hinweise gehen sofort an einen Menschen.",
      },
      {
        industry: "Sport & Padel",
        title: "Platzbuchungen & Kursanfragen",
        description: "Sportanlagen beantworten täglich dieselben Fragen zu Öffnungszeiten, freien Plätzen und Kursen. Der Assistent übernimmt diese Standardanfragen nach Ihren Vorgaben – auch abends und am Wochenende, wenn niemand am Empfang sitzt.",
      },
      {
        industry: "Gastronomie",
        title: "Reservierungen & Sonderanfragen",
        description: "Tischreservierungen annehmen, Fragen zu Sondermenüs beantworten, Stornierungen erfassen – ohne das Serviceteam zu unterbrechen. Gerade zur Festspielzeit, wenn das Anrufaufkommen deutlich steigt, eine spürbare Entlastung.",
      },
    ],
    processSteps: TELEFONASSISTENT_PROZESS,
    faq: [
      { question: "Klingt der KI Telefonassistent natürlich?", answer: "Er klingt gut – aber ehrlich gesagt: Nicht jeder Anrufer mag Sprachassistenten, und das respektieren wir. Sie wählen die Stimme, formulieren den Begrüßungssatz und legen die Formulierungen fest. Anrufer erfahren im ersten Satz, dass ein KI-System spricht, und können jederzeit zu einem Menschen wechseln." },
      { question: "Was passiert, wenn der Assistent eine Frage nicht beantworten kann?", answer: "Er leitet den Anruf weiter oder nimmt eine strukturierte Nachricht mit Rückrufnummer und Anliegen auf. Was in welchem Fall passiert, legen Sie vor dem Start im Anliegen-Katalog fest – und können es später ändern." },
      { question: "Kann ich die Inhalte des Assistenten selbst anpassen?", answer: "Ja. Öffnungszeiten, Urlaubsansagen und aktuelle Hinweise ändern Sie selbst über ein Dashboard – auch kurzfristig vor Feiertagen. Für Änderungen an Gesprächslogik und Regeln haben Sie einen festen Ansprechpartner." },
      { question: "Worauf müssen Sie bei DSGVO und KI Telefonassistent achten?", answer: "Vier Punkte entscheiden, und Sie sollten sie bei jedem Anbieter abfragen: Wird das Gespräch aufgezeichnet und wie lange gespeichert. Werden Ihre Daten zum Training von Modellen verwendet. Gibt es einen Auftragsverarbeitungsvertrag nach Art. 28 DSGVO. Und wie wird die Schweigepflicht nach § 203 StGB vertraglich abgebildet. Bei uns: Gespräche werden nicht aufgezeichnet – gespeichert wird ausschließlich das strukturierte Ergebnis. Ihre Daten werden nicht zum Training von Modellen verwendet. Einen AVV nach Art. 28 DSGVO stellen wir jedem Kunden bereit. Cogniiq und alle Mitarbeitenden werden vertraglich auf das Berufsgeheimnis nach § 203 StGB verpflichtet. Der Assistent gibt sich zu Beginn jedes Anrufs als KI-System zu erkennen. Bei der Dokumentation für Ihren Datenschutzbeauftragten unterstützen wir." },
      { question: "Welche Betriebe profitieren am meisten?", answer: "Betriebe, bei denen Telefon und eigentliche Arbeit um dieselben Hände konkurrieren: Arzt- und Zahnarztpraxen, Therapiepraxen, Gastronomie, Sportanlagen, Handwerk und lokale Dienstleister mit regelmäßigem Anrufaufkommen." },
      { question: "Was kostet der KI Telefonassistent?", answer: `Sie zahlen einen festen Monatsbetrag für ein Minutenkontingent. ${FAKTEN.deckelung} ${FAKTEN.tarifzuordnung} Nach dem Erstgespräch erhalten Sie ein schriftliches Angebot, in dem auch Einmalposten wie die Einrichtung offen ausgewiesen sind.` },
      { question: "Wie schnell ist der Empfang einsatzbereit?", answer: `${FAKTEN.uebergabeGarantie} ${FAKTEN.startDefinition} Enthalten sind Erstgespräch, Ihre Vorgaben, der Aufbau und zwei Tage Testphase. ${FAKTEN.freigabeNachUebergabe} ${FAKTEN.pruefzeitNeutral}` },
      { question: "Was unterscheidet den Assistenten von einem Telefonmenü oder Chatbot?", answer: "Ein Telefonmenü zwingt Anrufer in starre Optionen und Tastennavigation. Der Assistent arbeitet mit gesprochener Sprache: Er erfragt das Anliegen, beantwortet freigegebene Fragen und nimmt alles andere strukturiert auf – ohne dass sich jemand durch ein Menü drücken muss." },
      { question: "Können mehrere Anrufe gleichzeitig ankommen?", answer: "Ja. Auch wenn mehrere Anrufe gleichzeitig eingehen, wird jeder angenommen – ohne Warteschleife. Das ist gerade zu Stoßzeiten der eigentliche Unterschied zum klassischen Empfang mit einer Leitung." },
      { question: "Was passiert bei einem technischen Ausfall?", answer: "Für den Störungsfall wird ein Fallback eingerichtet: Anrufe laufen dann auf eine von Ihnen benannte Nummer oder auf eine klare Ansage mit dem nächsten Schritt. Diesen Weg legen wir gemeinsam bei der Einrichtung fest." },
      // „binden wir an" behauptete bestehende Standardanbindungen. Es gibt keine
      // Liste unterstützter Systeme (ANBINDUNG.nichtBehauptet) — die Prüfung ist
      // das, was zugesagt werden darf.
      { question: "Kann der Assistent in bestehende Buchungssysteme integriert werden?", answer: "Das hängt von Ihrem System ab. Ob es eine geeignete Schnittstelle gibt, ob wir Zugang dafür bekommen und ob Dritte Gebühren dafür verlangen, prüfen wir vor dem Angebot – das Ergebnis steht mit allen Kosten darin, auch wenn es negativ ausfällt. Trägt die Prüfung, übergeben wir Termine direkt in Ihr System. Trägt sie nicht, bleibt es beim strukturierten Eintrag im Dashboard, den Ihr Team überträgt." },
      { question: "Wer betreut uns nach dem Start?", answer: "Ein fester Ansprechpartner in Bayreuth – kein anonymes Ticketsystem. In den ersten Wochen werten wir Gesprächsverläufe gemeinsam aus und passen Regeln und Ansagen an; danach bleibt der Draht derselbe." },
    ],
    localChallenges: [
      "Viele Betriebe in Bayreuth können Anrufe nicht durchgehend annehmen – besonders vor und nach den Öffnungszeiten sowie zu Stoßzeiten, wenn das Personal vollständig ausgelastet ist",
      "Der Fachkräftemangel in Oberfranken erhöht den Druck auf bestehendes Personal: Jede Minute für Standardanfragen fehlt bei der eigentlichen Arbeit",
      "Wer mehrfach niemanden erreicht, versucht es oft beim nächsten Anbieter – und bewertet die Erreichbarkeit mitunter öffentlich",
    ],
    industries: ["Arztpraxen & Kliniken", "Zahnarztpraxen", "Physiotherapie & Heilpraktiker", "Gastronomie & Restaurants", "Padel & Sportanlagen", "Handwerk & Betriebe", "Lokale Dienstleister", "Wellness & Beauty"],
    industriesExpanded: [
      {
        name: "Arztpraxen & Zahnarztpraxen",
        problem: "Montags und nach Feiertagen trifft die Anrufflut die Anmeldung, während dort bereits Patienten stehen. Wer nicht durchkommt, versucht es oft bei der nächsten Praxis.",
        solution: "Der Assistent nimmt Terminwünsche und Stornierungen an, wenn die Anmeldung gebunden ist, und übergibt sie als strukturierte Einträge. Medizinische Auskünfte gibt er nicht; Notfall-Hinweise gehen sofort an einen Menschen.",
      },
      {
        name: "Physiotherapie & Heilpraktiker",
        problem: "Praxen mit kleinen Teams haben niemanden, der dauerhaft ans Telefon gehen kann. Anrufe zwischen Behandlungen und nach Feierabend landen auf der Mailbox – oder nirgends.",
        solution: "Der Assistent nimmt Terminwünsche und Absagen während der Behandlungszeiten an und legt sie als sortierte Liste vor – der Rückruf-Marathon am Abend entfällt weitgehend.",
      },
      {
        name: "Gastronomie & Restaurants",
        problem: "Rund um die Festspielzeit erhalten Restaurants täglich viele Anfragen zu Reservierungen, Sondermenüs und Events – das Serviceteam ist währenddessen im Einsatz und nicht erreichbar.",
        solution: "Der Assistent nimmt Reservierungen entgegen, beantwortet Fragen zu Menüs nach Ihren Vorgaben und erfasst Stornierungen – ohne das Serviceteam zu unterbrechen.",
      },
      {
        name: "Padel & Sportanlagen",
        problem: "Sportanlagen beantworten täglich dieselben Fragen zu Platzverfügbarkeit, Öffnungszeiten und Kursbuchungen – eine wiederkehrende Aufgabe, die Personal bindet.",
        solution: "Der Assistent beantwortet Standardanfragen nach Ihren Vorgaben und trägt Platzbuchungen nach Ihren Regeln ein – auch am Abend und am Wochenende.",
      },
      {
        name: "Handwerk & lokale Betriebe",
        problem: "Handwerksbetriebe im Raum Bayreuth sind tagsüber auf der Baustelle oder beim Kunden – Auftragsanfragen erreichen niemanden und gehen mitunter an Mitbewerber.",
        solution: "Der Assistent nimmt Anfragen an, erfasst Anliegen und Rückrufnummer strukturiert und legt sie dem Inhaber als sortierte Liste vor.",
      },
      {
        name: "Wellness & Beauty",
        problem: "Kosmetikstudios und Friseursalons erhalten Buchungsanfragen zu jeder Tageszeit, haben aber während der Behandlung keine Hand frei für das Telefon.",
        solution: "Der Assistent nimmt Terminwünsche an und trägt sie nach Ihren Regeln in den Kalender ein – ohne die laufende Behandlung zu unterbrechen.",
      },
    ],
    localScenarios: [
      {
        title: "Hausarztpraxis in der Innenstadt",
        description: "Montagmorgen: Am Tresen stehen Patienten, das Telefon klingelt ohne Pause, die Anmeldung entscheidet im Sekundentakt, wer warten muss. Mit dem Telefonassistenten würden Terminwünsche und Rezeptbestellungen strukturiert aufgenommen – und das Team könnte sich den Patienten im Wartezimmer widmen.",
      },
      {
        title: "Restaurant im Festspielviertel",
        description: "Zur Festspielzeit steigt das Reservierungsaufkommen deutlich – viele Anfragen kommen abends nach Küchenschluss. Der Assistent nimmt Reservierungen auch außerhalb der Servicezeiten an und bestätigt sie, ohne dass jemand erreichbar sein muss.",
      },
      {
        title: "Physiotherapiepraxis im Gewerbegebiet",
        description: "Drei Therapeuten, kein besetzter Empfang: Während der Behandlungen nimmt niemand ab, abends arbeitet die Inhaberin die Mailbox ab. Mit dem Assistenten kämen Terminwünsche und Absagen als sortierte Liste an – und frei werdende Termine könnten neu vergeben werden.",
      },
      {
        title: "Padel-Anlage am Stadtrand",
        description: "Täglich ähnliche Anrufe zu Platzbuchungen und Kursen. Statt einen Mitarbeiter ans Telefon zu binden, übernimmt der Assistent die Standardanfragen nach Vorgabe – und meldet sich nur bei besonderen Anliegen beim Team.",
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
        "Als Anbieter mit Hauptsitz in Bayreuth kennen wir die lokalen Betriebsrealitäten – und betreuen Sie mit festem Ansprechpartner. Wir verstehen, wie ein Handwerksbetrieb in Oberfranken tickt, was eine Arztpraxis im Stadtgebiet täglich belastet und wo der Einzelhandel seine Zeitverluste hat. Diese lokale Perspektive fließt direkt in die Konzeption der Automatisierungen ein.",
        "Schrittweise Umsetzung ist unser Standard: Wir beginnen mit dem Prozess, der die meiste Zeit kostet, setzen ihn sauber um und zeigen das Ergebnis, bevor wir weitermachen. Keine Black Boxes, keine Systeme, die nur wir verstehen. Jede Automatisierung wird vollständig dokumentiert, sodass Ihr Team bei Bedarf einfache Anpassungen selbst vornehmen kann.",
        "Neben der Automatisierung bieten wir in Bayreuth auch den [KI Telefonassistenten](/bayreuth/ki-telefonassistent) sowie professionelles [Webdesign für Bayreuth](/bayreuth/webdesign) an – drei Bausteine, die sich ideal ergänzen und zusammen die digitale Basis eines modernen lokalen Unternehmens bilden.",
      ],
    },
    warumCogniiq: [
      "Technologie-unabhängige Beratung – wir wählen das Tool, das wirklich zu Ihrer Infrastruktur passt",
      "Saubere Dokumentation jeder Automatisierung – keine Black Box, die nur wir verstehen",
      "Schrittweise Umsetzung: erst ein Prozess, dann mehr – kein Alles-oder-Nichts-Ansatz",
      "Persönliche Einweisung Ihres Teams – kein Selbststudium mit Video-Tutorials",
      "Weiterentwicklung und Support aus Bayreuth – direkter Draht, kurze Reaktionszeiten",
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
      { question: "Welche Tools nutzt Cogniiq für Automatisierungen in Bayreuth?", answer: "Wir setzen auf professionelle, etablierte Automatisierungsplattformen und direkte API-Integrationen. Wir empfehlen immer die Lösung, die langfristig am sinnvollsten für Ihren Betrieb ist – nicht die teuerste." },
      { question: "Brauche ich technisches Vorwissen für Prozessautomatisierung?", answer: "Nein. Wir übernehmen den vollständigen Aufbau und erklären Ihnen das Ergebnis in verständlichen Worten. Nach der Übergabe können Sie einfache Änderungen selbst vornehmen." },
      { question: "Was kostet Prozessautomatisierung in Bayreuth?", answer: "Das hängt von der Komplexität ab. Einfache Workflows starten ab ca. 500–1.500 €, komplexere Projekte nach Aufwand. Das Erstgespräch und eine erste Einschätzung sind kostenlos und unverbindlich." },
      { question: "Wie sicher sind die automatisierten Workflows?", answer: "Wir bauen auf etablierte Plattformen und dokumentieren zu jedem Workflow, welche Daten wohin fließen. Welche Systeme beteiligt sind, steht vor Projektbeginn fest." },
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
        solution: "Buchungsbestätigungen, Erinnerungen an Gäste und interne Benachrichtigungen werden automatisch ausgelöst – ohne manuelle Eingriffe im laufenden Betrieb.",
      },
      {
        name: "Arztpraxen & Gesundheit",
        problem: "Praxen in Bayreuth verwalten Patientendaten, Terminkalender und Abrechnungssysteme in getrennten Anwendungen, die nicht automatisch synchronisieren.",
        solution: "Wir automatisieren Erinnerungsbenachrichtigungen, Terminbestätigungen und Datenübertragungen zwischen Systemen – ohne manuellen Aufwand.",
      },
      {
        name: "Lokale Dienstleister",
        problem: "Dienstleister erhalten Anfragen über Website, E-Mail, Telefon und Social Media – und verlieren den Überblick, weil keine zentrale Verarbeitung stattfindet.",
        solution: "Alle Eingangskanäle werden in einem zentralen Workflow zusammengeführt, qualifiziert und dem richtigen Ansprechpartner zugewiesen.",
      },
      {
        name: "Einzelhandel & E-Commerce",
        problem: "Kleine Online-Shops in Bayreuth verwalten Bestellungen, Lager und Kundenkommunikation noch manuell – was bei Wachstum sofort zum Engpass wird.",
        solution: "Bestelleingang, Lagerabzug, Versandbenachrichtigung und Rechnungsversand werden automatisiert – skalierbar ohne Mehrpersonal.",
      },
    ],
    localScenarios: [
      {
        title: "Handwerksbetrieb im Umland von Bayreuth",
        description: "Ein Elektriker mit 8 Mitarbeitern erstellt täglich Angebote per Hand, bestätigt Aufträge per E-Mail und schreibt Rechnungen in einem anderen Tool. Durch Automatisierung werden Angebote direkt aus dem Kalender generiert, Auftragsbestätigungen automatisch versandt und Rechnungen nach Leistungserbringung automatisch erstellt.",
      },
      {
        title: "Restaurant mit Online-Reservierung",
        description: "Ein Restaurant in der Bayreuth Innenstadt erhält Reservierungen über drei verschiedene Kanäle – Website, Google, Telefonassistent – die manuell im Kalender eingetragen werden. Mit einer passenden Automatisierung laufen alle Buchungen zentral zusammen, Erinnerungen gehen automatisch raus, und Stornierungen werden sofort im Kalender aktualisiert.",
      },
      {
        title: "Physiotherapiepraxis mit Abrechnungsworkflow",
        description: "Eine Physiotherapiepraxis mit 4 Therapeuten führt Patientenakten in einem System und Abrechnungen in einem anderen. Monatlich werden Daten per Hand übertragen. Mit einer passenden Automatisierung wird die Abrechnung aus dem Praxisverwaltungssystem direkt in die Buchhaltung überführt – ohne manuelle Dateneingabe.",
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
        "Jede Website, die wir bauen, ist Mobile-First: Der überwiegende Teil der Suchanfragen in Deutschland erfolgt inzwischen vom Smartphone. Ladezeiten unter 2 Sekunden, bestandene Core Web Vitals und ein sauberes technisches Fundament sind kein optionales Extra – sondern der Standard, den wir für jedes Projekt liefern. SEO ist von Anfang an eingebaut, nicht nachträglich als Patch hinzugefügt.",
        "Als Ergänzung zum Webdesign bieten wir in Bayreuth auch den [KI Telefonassistenten für Bayreuth](/bayreuth/ki-telefonassistent) und [Prozessautomatisierung](/bayreuth/automatisierung) an. Diese drei Bereiche ergänzen sich ideal: Eine sichtbare, schnelle Website generiert Anfragen – der KI Assistent nimmt sie entgegen – Automatisierungen verarbeiten sie effizient. Alles aus einer Hand, persönlich betreut in Bayreuth.",
      ],
    },
    warumCogniiq: [
      "Individuelle Entwicklung – jede Website entsteht für Ihr Unternehmen in Bayreuth, nicht aus einer Vorlage",
      "Technischer Fokus: Ladezeiten unter 2 Sekunden, Mobile-First, Core Web Vitals bestanden",
      "SEO von Anfang an eingebaut – lokale Sichtbarkeit für Bayreuth und Umgebung",
      "Klare Conversion-Struktur: Besucher wissen sofort, was Sie anbieten und wie sie Kontakt aufnehmen",
      "Persönliche Zusammenarbeit direkt in Bayreuth – mit festem Ansprechpartner",
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
        description: "Vertrauenswürdiges Design, Kontaktformular mit Datenschutzhinweis und optionale Buchungssystem-Integration. Patienten in Bayreuth finden und buchen Sie einfach online.",
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
      { question: "Was kostet eine Website für ein Unternehmen in Bayreuth?", answer: "Websites starten ab ca. 1.500 €. Individuell entwickelte Unternehmenswebsites liegen je nach Umfang typischerweise bei ca. 2.500–5.000 €, komplexere Projekte nach Aufwand. Erstgespräch und grobe Einschätzung sind kostenlos." },
      { question: "Kann ich die Website nach dem Launch selbst pflegen?", answer: "Ja. Wir richten bei Bedarf ein CMS ein und schulen Ihr Team. Alternativ übernehmen wir die laufende Pflege – je nach Ihren Wünschen." },
      { question: "Macht Cogniiq auch lokales SEO für Bayreuth?", answer: "On-Page SEO ist in jedem Projekt enthalten: technische Grundlagen, saubere Struktur, lokale Keyword-Integration für Bayreuth, Core Web Vitals. Für umfangreichere SEO-Kampagnen bieten wir separate Pakete an." },
      { question: "Habt ihr Erfahrung mit dem Bayreuth-Markt?", answer: "Ja. Wir kennen die lokale Wettbewerbssituation in Bayreuth und Oberfranken und positionieren Websites so, dass sie bei lokalen Suchanfragen sichtbar sind." },
      { question: "Könnt ihr eine bestehende Website modernisieren?", answer: "Ja. Ob Redesign, Relaunch oder gezielte Optimierung einzelner Seiten – wir analysieren was vorhanden ist und schlagen den sinnvollsten Weg vor." },
      { question: "Bietet ihr auch Hosting an?", answer: "Auf Wunsch organisieren wir das Hosting bei einem deutschen oder europäischen Anbieter. Alternativ nutzen wir Ihren bestehenden Hosting-Vertrag." },
      { question: "Wie unterscheidet sich eine professionelle Website von einem Baukastensystem?", answer: "Baukastensysteme liefern akzeptable Ergebnisse für einfache Visitenkarten-Websites. Für Unternehmen in Bayreuth, die Neukunden über Google gewinnen wollen, sind individuelle, technisch optimierte Websites deutlich effektiver." },
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
        solution: "Wir entwickeln vertrauenswürdige Praxis-Websites mit Buchungssystem, optimiert für lokale Suchanfragen in Bayreuth.",
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
        description: "Ein Sanitärbetrieb aus dem Umland von Bayreuth hat keine suchmaschinenoptimierte Website. Auftragsanfragen kommen ausschließlich über Empfehlungen. Nach dem Website-Launch mit lokaler SEO-Optimierung für 'Sanitär Bayreuth' und 'Heizung Bayreuth' kommen erste organische Anfragen über Google nach einigen Wochen.",
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
      title: "KI Telefonassistent Regensburg – Anrufannahme | Cogniiq",
      description: "KI Telefonassistent für Praxen, Gastronomie und Betriebe in Regensburg: Anrufannahme mit Ihrer Stimmauswahl und Ihren Regeln, strukturierte Übergabe.",
      canonical: `${base}/regensburg/ki-telefonassistent`,
    },
    intro: {
      h1: "KI Telefonassistent in Regensburg",
      lead: "In der Praxis stehen Patienten am Tresen, im Restaurant ist das Serviceteam im Einsatz, im Handwerksbetrieb sind alle beim Kunden – und das Telefon klingelt. Der KI Telefonassistent von Cogniiq nimmt diese Anrufe für Betriebe in Regensburg an: mit Ihrer Stimmauswahl, Ihrem Begrüßungssatz, Ihren Formulierungen und Ihren Regeln.",
    },
    localIntro: {
      paragraphs: [
        "Regensburg ist Universitätsstadt mit Uniklinikum, hat eine Altstadt, die zum UNESCO-Welterbe zählt, und ganzjährigen Tourismus. Diese Mischung prägt auch das Telefon: Anfragen kommen zu jeder Tages- und Abendzeit, in der Tourismussaison und zu Semesterbeginn deutlich mehr – das Personal in Praxen, Küchen und Werkstätten wächst aber nicht mit.",
        "Der Telefonassistent nimmt Anrufe an, wenn Ihr Team gebunden ist oder der Betrieb geschlossen hat. Wiederkehrende Fragen zu Zeiten, Preisen oder Verfügbarkeit beantwortet er nach Ihren Vorgaben, Terminwünsche trägt er nach Ihren Regeln ein oder legt sie zur Bestätigung vor. Komplexe und dringende Anliegen übergibt er sofort und strukturiert an einen Menschen – mit Rückrufnummer, Anliegen und nächstem Schritt.",
        "Dabei gilt, was sich am Markt gezeigt hat: Ein Telefonassistent überzeugt nicht dadurch, dass er Anrufer versteht, sondern dadurch, dass das Ergebnis danach im richtigen System ankommt und die Ansagen zum Betrieb passen. Beides steht deshalb im Zentrum der Einrichtung – vor dem Start hören Sie den Assistenten selbst und geben ihn erst dann frei.",
        `Die Einrichtung läuft im Hintergrund: Ihre Anrufe werden auf den Assistenten umgeleitet, Ihr Team muss nichts Neues lernen. ${FAKTEN.uebergabeGarantie} Ein Auftragsverarbeitungsvertrag nach Art. 28 DSGVO gehört dazu, ${FAKTEN.keineAufzeichnung}`,
        "Für Betriebe im Raum Regensburg, die ihre Abläufe weiter entlasten möchten, ergänzt der Telefonassistent die [Automatisierung für Regensburg](/regensburg/automatisierung) und das [Webdesign für Regensburg](/regensburg/webdesign) – Anfragen annehmen, verarbeiten und sichtbar sein greifen dabei ineinander.",
      ],
    },
    warumCogniiq: [
      `Festes Minutenkontingent, darüber ${FAKTEN.mehrpreisProMinute}/Min. – gedeckelt auf die ausgewiesene Obergrenze Ihres Tarifs; Einmalposten stehen vor Vertragsschluss im Angebot`,
      "Ihre Stimmauswahl, Ihr Begrüßungssatz, Ihre Formulierungen – Anrufer erfahren im ersten Satz, dass ein KI-System spricht",
      // Keine pauschale Übergabe-Zusage: ob Kalender, CRM oder Buchungssystem
      // angebunden werden können, entscheidet die Prüfung des konkreten Systems
      // vor dem Angebot (FAKTEN.keineAnbindung).
      "Jedes Gespräch endet als strukturierter Eintrag im Dashboard – kein Abhören, kein Rekonstruieren; ob Ihr System angebunden werden kann und was eine Schnittstelle kostet, prüfen wir vor dem Angebot",
      "Auch bei Anrufspitzen in der Tourismussaison wird jeder Anruf angenommen – ohne Warteschleife",
      "Keine Gesprächsaufzeichnung, kein Training mit Ihren Daten – Auftragsverarbeitungsvertrag nach Art. 28 DSGVO inklusive",
      "Persönliche Betreuung mit festem Ansprechpartner – kein Ticketsystem",
    ],
    useCases: [
      {
        industry: "Praxen im Klinikumfeld",
        title: "Entlastung für die Anmeldung zu Stoßzeiten",
        description: "Rund um das Uniklinikum liegen viele Praxen – und montags, nach Feiertagen und in Infektwellen steht das Telefon kaum still. Der Assistent nimmt Terminwünsche und Stornierungen strukturiert auf; medizinische Auskünfte gibt er nicht, Notfall-Hinweise gehen sofort an einen Menschen.",
      },
      {
        industry: "Gastronomie & Tourismus",
        title: "Reservierungen außerhalb der Öffnungszeiten",
        description: "Die Altstadtgastronomie erhält Reservierungsanfragen das ganze Jahr – viele abends und am Wochenende, wenn das Serviceteam im Einsatz ist. Der Assistent nimmt sie an und bestätigt nach Ihren Vorgaben.",
      },
      {
        industry: "Dienstleister & Handwerk",
        title: "Terminannahme nach Feierabend",
        description: "Betriebe im Raum Regensburg und im Landkreis erhalten viele Anfragen außerhalb der Arbeitszeit. Der Assistent erfasst sie strukturiert – morgens liegt die sortierte Liste beim richtigen Teammitglied.",
      },
    ],
    processSteps: TELEFONASSISTENT_PROZESS,
    faq: [
      { question: "Versteht der Assistent Dialekte – auch Bayerisch?", answer: "Regionale Ausdrücke und Dialekt versteht der Assistent in aller Regel gut; bei sehr starkem Dialekt fragt er nach, statt zu raten. In der Testphase prüfen wir das mit echten Szenarien aus Ihrem Alltag – bevor der erste Anrufer ihn hört." },
      { question: "Funktioniert der Assistent auch bei hohem Anrufaufkommen in der Tourismussaison?", answer: "Ja. Auch wenn mehrere Anrufe gleichzeitig eingehen, wird jeder angenommen – ohne Warteschleife. Das ist gerade in der Hauptsaison der Unterschied zu einer einzelnen besetzten Leitung." },
      { question: "Kann er Anrufe auf verschiedene Mitarbeiter weiterleiten?", answer: "Ja. Weiterleitungsregeln werden nach Thema, Uhrzeit und Verfügbarkeit konfiguriert – Sie legen fest, welches Anliegen bei wem landet." },
      { question: "Was passiert bei einem technischen Ausfall?", answer: "Für den Störungsfall wird ein Fallback eingerichtet: Anrufe laufen dann auf eine von Ihnen benannte Nummer oder auf eine klare Ansage mit dem nächsten Schritt. Diesen Weg legen wir gemeinsam bei der Einrichtung fest." },
      { question: "Worauf müssen Sie bei DSGVO und KI Telefonassistent achten?", answer: "Vier Punkte entscheiden, und Sie sollten sie bei jedem Anbieter abfragen: Wird das Gespräch aufgezeichnet und wie lange gespeichert. Werden Ihre Daten zum Training von Modellen verwendet. Gibt es einen Auftragsverarbeitungsvertrag nach Art. 28 DSGVO. Und wie wird die Schweigepflicht nach § 203 StGB vertraglich abgebildet. Bei uns: Gespräche werden nicht aufgezeichnet – gespeichert wird ausschließlich das strukturierte Ergebnis. Ihre Daten werden nicht zum Training von Modellen verwendet. Einen AVV nach Art. 28 DSGVO stellen wir jedem Kunden bereit. Cogniiq und alle Mitarbeitenden werden vertraglich auf das Berufsgeheimnis nach § 203 StGB verpflichtet. Der Assistent gibt sich zu Beginn jedes Anrufs als KI-System zu erkennen. Bei der Dokumentation für Ihren Datenschutzbeauftragten unterstützen wir." },
      { question: "Können wir den Assistenten vor der Entscheidung hören?", answer: "Ja. Im unverbindlichen Erstgespräch zeigen wir eine Beispielkonfiguration für Ihren Anwendungsfall. Vor dem Start testen Sie mit echten Szenarien – live geht der Assistent erst nach Ihrer Freigabe." },
      { question: "Was kostet der KI Telefonassistent?", answer: `Sie zahlen einen festen Monatsbetrag für ein Minutenkontingent. ${FAKTEN.deckelung} ${FAKTEN.tarifzuordnung} Nach dem Erstgespräch erhalten Sie ein schriftliches Angebot, in dem auch Einmalposten offen ausgewiesen sind.` },
      { question: "Wie unterscheidet sich der Assistent von einer klassischen Telefonanlage?", answer: "Eine Anlage leitet weiter und zeichnet auf – ohne das Anliegen zu erfassen. Der Assistent erfragt das Anliegen in gesprochener Sprache, beantwortet freigegebene Fragen, trägt Termine nach Ihren Regeln ein und übergibt alles andere strukturiert – ohne Tastenmenü und starre Optionen." },
      { question: "Kann der Assistent auch auf Englisch sprechen?", answer: "Für Betriebe mit internationalem Publikum – Tourismus, Universität, Technologie – sind mehrsprachige Konfigurationen möglich, üblicherweise Deutsch und Englisch. Den konkreten Umfang klären wir im Erstgespräch." },
      // Siehe Bayreuth: keine Zusage bestehender Anbindungen.
      { question: "Wie funktioniert die Anbindung an meinen bestehenden Kalender?", answer: "Welche Schnittstelle Ihr Kalender bietet, sehen wir uns vor dem Angebot an; das Ergebnis steht darin, auch wenn es negativ ausfällt. Wo keine Anbindung möglich ist, bleibt es beim strukturierten Eintrag im Dashboard, den Ihr Team überträgt." },
      { question: "Was ändert sich an meinem Telefonanschluss?", answer: FAKTEN.rufumleitung },
    ],
    localChallenges: [
      "Wirtschaftswachstum und Tourismus bringen deutlich mehr Anrufaufkommen – aber keinen entsprechenden Zuwachs an Personal am Telefon",
      "Universität und Tourismus sorgen für Anfragen zu ungewöhnlichen Zeiten – abends, am Wochenende und außerhalb regulärer Öffnungszeiten",
      "Der Fachkräftemangel macht dauerhaft besetzte Telefonplätze für viele Betriebe schwer realisierbar und teuer",
    ],
    industries: ["Arztpraxen & Kliniken", "Gastronomie & Hotels", "Physio & Therapie", "Handwerk & Betriebe", "Sport & Freizeit", "Tourismus", "Lokale Dienstleister"],
    industriesExpanded: [
      {
        name: "Arztpraxen & Klinikumfeld",
        problem: "In Praxen rund um das Uniklinikum ist die Leitung montags und nach Feiertagen dauerbesetzt, während am Tresen bereits Patienten warten. Wer nicht durchkommt, versucht es oft bei der nächsten Praxis.",
        solution: "Der Assistent nimmt Terminwünsche und Stornierungen strukturiert auf und beantwortet wiederkehrende Fragen nach Ihren Vorgaben. Medizinische Auskünfte gibt er nicht; Notfall-Hinweise gehen sofort an einen Menschen.",
      },
      {
        name: "Gastronomie & Altstadt",
        problem: "Restaurants in der Altstadt und rund um den Dom sind für internationale Gäste attraktiv – aber telefonisch schwer erreichbar, wenn das Serviceteam im Einsatz ist.",
        solution: "Reservierungen werden auch außerhalb der Öffnungszeiten angenommen, nach Ihren Vorgaben beantwortet und in Ihr Reservierungssystem übergeben – mehrsprachige Konfiguration ist möglich.",
      },
      {
        name: "Tourismus & Stadtführungen",
        problem: "Anbieter von Führungen und Erlebnissen erhalten viele internationale Anfragen außerhalb der Bürozeiten – oft erreichen sie niemanden.",
        solution: "Der Assistent nimmt Buchungsanfragen auch außerhalb der Bürozeiten an und übergibt sie strukturiert in Ihr Buchungssystem.",
      },
      {
        name: "Handwerk & Betriebe",
        problem: "Betriebe im Landkreis sind tagsüber bei Kunden – Anfragen erreichen niemanden und gehen mitunter an Mitbewerber.",
        solution: "Anfragen werden angenommen, mit Anliegen und Rückrufnummer erfasst und dem Inhaber als sortierte Liste vorgelegt – ohne dass er selbst ans Telefon muss.",
      },
      {
        name: "Physio, Therapie & Wellness",
        problem: "Kleinen Praxen fehlt das Personal, das zwischen Behandlungen dauerhaft ans Telefon geht. Termine werden verzögert vergeben oder gehen verloren.",
        solution: "Der Assistent nimmt Terminwünsche und Absagen während der Behandlungszeiten an – nach Ihren Zeitfenstern und Regeln – und entlastet das Praxisteam spürbar.",
      },
    ],
    localScenarios: [
      {
        title: "Hausarztpraxis nahe dem Klinikum",
        description: "Montagmorgen: Die Leitung ist dauerbesetzt, am Tresen warten Patienten, die Anmeldung kommt nicht hinterher. Mit dem Telefonassistenten würden Terminwünsche und Stornierungen strukturiert aufgenommen – das Team könnte sich auf akute Fälle und die Patienten vor Ort konzentrieren.",
      },
      {
        title: "Restaurant in der Altstadt",
        description: "Reservierungsanfragen von Gästen aus aller Welt, viele abends nach Küchenschluss. Der Assistent nimmt sie auch außerhalb der Servicezeiten an und trägt sie nach Vorgabe in den Kalender ein – das Serviceteam bleibt beim Gast.",
      },
      {
        title: "Physio-Praxis im Stadtgebiet",
        description: "Vier Behandlungsräume, kein besetzter Empfang: Anfragen liefen bisher auf den Anrufbeantworter und wurden abends zurückgerufen. Mit dem Assistenten kämen Terminwünsche als sortierte Liste an – und viele Termine wären schon vergeben, bevor jemand zurückrufen muss.",
      },
      {
        title: "Handwerksbetrieb im Landkreis",
        description: "Ein Sanitärbetrieb ist tagsüber auf Montage – Auftragsanfragen erreichen niemanden. Der Assistent nimmt sie an, erfasst Anliegen und Rückrufnummer und legt sie dem Inhaber strukturiert vor.",
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
      description: "Prozessautomatisierung für Unternehmen in Regensburg: Workflows & CRM-Integration, Leadverarbeitung. Wartbar, dokumentiert, persönliche Betreuung.",
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
        "Die Kombination aus Prozessautomatisierung und [KI Telefonassistent für Regensburg](/regensburg/ki-telefonassistent) sowie professionellem [Webdesign für Regensburg](/regensburg/webdesign) schafft eine vollständige digitale Betriebsinfrastruktur, die auf den langfristigen Betrieb ausgelegt ist.",
      ],
    },
    warumCogniiq: [
      "Unabhängige Technologieberatung – wir empfehlen das Tool, das zu Ihrer Infrastruktur passt",
      "Wartbare Lösungen mit vollständiger Dokumentation – keine proprietären Systeme",
      "Skalierbar: was heute 10 Prozesse automatisiert, deckt morgen 50 ab",
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
      { question: "Was kostet Prozessautomatisierung in Regensburg?", answer: "Erste Workflows ab ca. 500 €, komplexere Integrationen nach Aufwand. Erstgespräch und Einschätzung sind immer kostenlos." },
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
        solution: "Alle Buchungskanäle fließen automatisch in ein zentrales System. Bestätigungen, Erinnerungen und Stornierungen laufen automatisch.",
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
        description: "Ein B2B-Dienstleister mit 20 Mitarbeitern erhält Anfragen über Website, E-Mail und Telefon. Jede Anfrage wird manuell im CRM erfasst, ein Angebot erstellt und per E-Mail versandt. Mit einer passenden Automatisierung läuft der gesamte Prozess – von Anfrageneingang über Qualifikation bis zur Angebotserstellung – automatisch in wenigen Minuten.",
      },
      {
        title: "Hotel in der Regensburger Altstadt",
        description: "Ein Hotel in der Altstadt erhält Buchungen über Booking.com, die eigene Website und telefonisch – drei Quellen, die manuell im Hotelmanagementsystem eingetragen werden. Automatisierung synchronisiert alle Kanäle in Echtzeit und versendet automatisch Bestätigungen in der jeweiligen Sprache des Gastes.",
      },
      {
        title: "Handwerksbetrieb im Landkreis Regensburg",
        description: "Ein Malerbetrieb aus dem Landkreis erstellt Angebote per Hand, bestätigt Aufträge per Telefon und verschickt Rechnungen mit Verzögerung. Mit einer passenden Automatisierung könnten Angebote per Klick generiert, Auftragsbestätigungen automatisch versandt und Rechnungen nach Projektabschluss direkt erstellt werden.",
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
        "Cogniiq entwickelt Websites für Regensburg, die in dieser Entscheidung gewinnen. Jede Website wird individuell konzipiert – keine Vorlagen, kein Baukastensystem. Sie ist schnell (unter 2 Sekunden Ladezeit), für Smartphones optimiert (der überwiegende Teil der Suchanfragen kommt vom Handy), lokal für Regensburg SEO-optimiert und auf Conversion ausgerichtet: Klare Struktur, überzeugende Inhalte, ein Kontaktweg, der wirklich genutzt wird.",
        "Als Webdesign-Agentur mit Bayern-Verwurzelung verstehen wir die Anforderungen des Regensburger Markts: die Mischung aus Tourismus, Universitätspublikum, internationalem Mittelstand und der historischen Altstadt als Markenidentität der Stadt. Websites für Regensburger Unternehmen müssen sowohl lokal verwurzelt als auch international ansprechend sein – und technisch einwandfrei.",
        "Lokales SEO ist dabei kein Add-on, sondern Grundlage: Wir optimieren jede Website gezielt für Suchanfragen wie 'Webdesign Agentur Regensburg', 'Website erstellen Regensburg' und branchenspezifische lokale Kombinationen. Strukturierte Daten, Google My Business Optimierung und regionale Linkbuilding-Grundlagen sind fester Bestandteil jedes Projekts.",
        "Neben dem Webdesign bieten wir in Regensburg auch den [KI Telefonassistenten für Regensburg](/regensburg/ki-telefonassistent) und [Prozessautomatisierung für Regensburg](/regensburg/automatisierung) an. Wer eine professionelle Website hat, die Anfragen generiert, braucht auch das richtige System, um diese Anfragen effizient zu verarbeiten. Alle Leistungen aus einer Hand, von Cogniiq für den Regensburg-Markt.",
      ],
    },
    warumCogniiq: [
      "Keine Templates – jede Website für Regensburg wird individuell konzipiert und entwickelt",
      "Mobile-First: der überwiegende Teil der Besucher kommt vom Smartphone – wir optimieren zuerst dafür",
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
      { question: "Was kostet eine Website für ein Regensburger Unternehmen?", answer: "Websites starten ab ca. 1.500 €. Individuell entwickelte Unternehmenswebsites liegen je nach Umfang typischerweise bei ca. 2.500–5.000 €, komplexere Projekte nach Aufwand. Erstgespräch kostenlos." },
      { question: "Baut ihr auf WordPress oder individuellem Code?", answer: "Beides – je nach Anforderung. WordPress für pflegeleichte Inhalte, React/Next.js für Performance und Komplexität." },
      { question: "Macht ihr auch Texte?", answer: "Ja. Texte erstellen wir gemeinsam oder mit KI-Unterstützung – immer auf Ihre Zielgruppe und lokale Suchanfragen in Regensburg ausgerichtet." },
      { question: "Bietet ihr auch Wartung an?", answer: "Ja. Auf Wunsch übernehmen wir laufende Updates, Sicherheitsupdates und Inhaltsänderungen." },
      { question: "Kann die Website mehrsprachig sein?", answer: "Ja. Für Regensburger Unternehmen mit internationalem Publikum aus Tourismus oder Universität sind mehrsprachige Websites kein Problem." },
      { question: "Wie optimiert ihr für Google in Regensburg?", answer: "On-Page SEO, strukturierte Daten, Google My Business Optimierung und lokale Keyword-Strategie für Regensburg sind fester Bestandteil – nicht optionales Extra." },
      { question: "Könnt ihr auch Fotografie und Videoproduktion koordinieren?", answer: "Auf Wunsch koordinieren wir Fotografie über lokale Partnernetzwerke in der Regensburg-Region." },
      { question: "Was ist der Unterschied zu einer Webagentur in Regensburg?", answer: "Wir sind auf leistungsstarke, konversionsorientierte Websites spezialisiert – mit direktem Kontakt zum Entwickler, kurzen Wegen und schnellen Ergebnissen." },
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
        solution: "Vertrauenswürdige Praxis-Websites mit Terminbuchung, Kontaktformular mit Datenschutzhinweis und lokalem SEO für Suchanfragen in Regensburg.",
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
        description: "Eine Zahnarztpraxis in Regensburg West findet sich bei Google-Suchen nach 'Zahnarzt Regensburg' erst auf Seite 3. Durch eine neue Website mit strukturierten Daten, Google My Business Optimierung und lokalem On-Page-SEO verbessert sie ihre Sichtbarkeit deutlich.",
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
      title: "KI Telefonassistent München – Telefonservice | Cogniiq",
      description: "KI Telefonassistent für Unternehmen in München: Anrufannahme mit Ihrer Stimmauswahl und Ihren Regeln, bis zu fünf Sprachen, strukturierte Übergabe.",
      canonical: `${base}/muenchen/ki-telefonassistent`,
    },
    intro: {
      h1: "KI Telefonassistent für Unternehmen in München",
      lead: "In der Privatpraxis wartet ein Patient am Empfang, in der Kanzlei läuft eine Besprechung, im Restaurant ist Service – und das Telefon klingelt. Der KI Telefonassistent von Cogniiq nimmt diese Anrufe für Münchner Betriebe an: mit Ihrer Stimmauswahl, Ihrem Begrüßungssatz und Ihren Regeln, auf Wunsch in bis zu fünf Sprachen.",
    },
    localIntro: {
      paragraphs: [
        "In München sitzen Privatpraxen, Kanzleien, Beratungen, Immobilienbüros, Hotels und Gastronomie dicht beieinander und konkurrieren um dieselben Kunden – und um dieselben Fachkräfte. Anrufer erwarten schnelle Reaktion, ein erheblicher Teil spricht Englisch, und dauerhaft besetzte Telefonplätze sind bei Münchner Personalkosten schwer darstellbar.",
        "Der Telefonassistent nimmt Anrufe an, wenn Ihr Team gebunden ist oder der Betrieb geschlossen hat – morgens vor Öffnung, abends, am Wochenende, in Urlaubszeiten. Wiederkehrende Fragen beantwortet er nach Ihren Vorgaben, Termine trägt er nach Ihren Regeln ein, komplexe Anliegen übergibt er strukturiert an das zuständige Teammitglied. Mehrsprachige Konfiguration ist möglich – üblicherweise Deutsch und Englisch, weitere Sprachen auf Anfrage.",
        "Entscheidend ist dabei nicht die Technik, sondern der Zuschnitt: Ein Assistent überzeugt erst, wenn die Ansagen zum Haus passen, die Regeln den Abläufen folgen und das Ergebnis im richtigen System ankommt. Deshalb beginnt jedes Projekt mit einem Aufnahmegespräch über Ihre tatsächlichen Anrufe – und endet erst nach einer Testphase, in der Sie den Assistenten selbst gehört und freigegeben haben.",
        `Cogniiq betreut Münchner Projekte vollständig remote; persönliche Termine im Raum München sind auf Anfrage möglich. Ein Auftragsverarbeitungsvertrag nach Art. 28 DSGVO gehört dazu, Gespräche werden nicht aufgezeichnet. Die Kosten sind fest vereinbart – ein Monatsbetrag für ein definiertes Minutenkontingent, darüber ${FAKTEN.mehrpreisProMinute}/Min. und gedeckelt auf die Obergrenze Ihres Tarifs.`,
        "Als Teil einer digitalen Gesamtaufstellung lässt sich der Telefonassistent mit [Prozessautomatisierung für München](/muenchen/automatisierung) und [Webdesign für München](/muenchen/webdesign) kombinieren – Anfragen annehmen, verarbeiten und sichtbar sein greifen ineinander.",
      ],
    },
    warumCogniiq: [
      `Festes Minutenkontingent, darüber ${FAKTEN.mehrpreisProMinute}/Min. – gedeckelt auf die ausgewiesene Obergrenze Ihres Tarifs; Einmalposten stehen vor Vertragsschluss im Angebot`,
      "Mehrsprachige Konfiguration möglich: üblicherweise Deutsch und Englisch, weitere Sprachen auf Anfrage",
      "Vollständige Remote-Einrichtung – persönliche Termine im Raum München auf Anfrage",
      "Jedes Gespräch endet als strukturierter Eintrag bei Ihrem Team – kein Abhören, kein Abtippen",
      "Persönliche Betreuung mit festem Ansprechpartner – kein anonymes Callcenter, kein Ticketsystem",
      "Keine Gesprächsaufzeichnung, kein Training mit Ihren Daten – Auftragsverarbeitungsvertrag nach Art. 28 DSGVO inklusive",
    ],
    useCases: [
      {
        industry: "Privatpraxen & Spezialisten",
        title: "Terminannahme außerhalb der Sprechzeiten",
        description: "Privatpatienten erwarten schnelle Reaktion – auch abends und auf Englisch. Der Assistent nimmt Terminwünsche außerhalb der Sprechzeiten an und trägt sie nach Ihren Regeln ein. Medizinische Auskünfte gibt er nicht; dringende Anliegen gehen sofort an einen Menschen.",
      },
      {
        industry: "Gastronomie & Premium Dining",
        title: "Reservierungen ohne Störung im Service",
        description: "Restaurants im gehobenen Segment haben hohes Reservierungsaufkommen – und ein Serviceteam, das beim Gast bleiben soll. Der Assistent nimmt Reservierungen auf Deutsch und Englisch an, im Ton des Hauses.",
      },
      {
        industry: "Beratung, Recht & Finanzdienstleistung",
        title: "Erstanfragen strukturiert erfassen",
        description: "Kanzleien und Beratungen profitieren, wenn Erstanfragen mit Anliegen, Kontaktdaten und Zuständigkeit erfasst ankommen – bevor ein Partner persönliche Zeit investiert.",
      },
    ],
    processSteps: TELEFONASSISTENT_PROZESS,
    faq: [
      { question: "Kann der Assistent auf Englisch mit internationalen Kunden sprechen?", answer: "Mehrsprachige Konfigurationen sind möglich – üblicherweise Deutsch und Englisch. Wie die Sprachwahl im Gespräch abläuft und welche Sprachen Sie brauchen, klären wir im Erstgespräch und testen es vor dem Start." },
      { question: "Betreut Cogniiq Projekte in München vollständig remote?", answer: "Ja. Alle Projektphasen – Aufnahmegespräch, Ansagen, Testphase, laufende Anpassung – funktionieren remote. Persönliche Termine im Raum München sind auf Anfrage möglich." },
      { question: "Was kostet der KI Telefonassistent für ein Münchner Unternehmen?", answer: `Dieselben Konditionen wie überall: ein fester Monatsbetrag für ein Minutenkontingent. ${FAKTEN.deckelung} Nach dem Erstgespräch erhalten Sie ein schriftliches Angebot mit allen Posten.` },
      { question: "Kommen unsere Kunden mit einer Computerstimme klar?", answer: "Nicht alle sofort – das nehmen wir ernst. Sie wählen die Stimme, formulieren den Begrüßungssatz und legen die Formulierungen fest. Anrufer erfahren im ersten Satz, dass ein KI-System spricht, und können jederzeit zu einem Menschen wechseln." },
      { question: "Was passiert bei mehreren Anrufen gleichzeitig?", answer: "Jeder Anruf wird angenommen, auch wenn mehrere parallel eingehen – ohne Warteschleife. Gerade zu Stoßzeiten wie Messen oder Ferienbeginn ist das der Unterschied zu einer einzelnen Leitung." },
      { question: "Wie schnell ist die Einrichtung?", answer: `${FAKTEN.uebergabeGarantie} ${FAKTEN.startDefinition} Enthalten sind Erstgespräch, Ihre Vorgaben, der Aufbau und zwei Tage Testphase. ${FAKTEN.freigabeNachUebergabe} ${FAKTEN.pruefzeitNeutral}` },
      { question: "Kann der Assistent für mehrere Standorte konfiguriert werden?", answer: "Ja. Für Unternehmen mit mehreren Standorten im Großraum können separate Regeln und Ansagen pro Standort eingerichtet werden – mit einheitlichem Standard, wo Sie ihn wollen." },
      { question: "Passt der Assistent zu Privatmedizin oder gehobener Gastronomie?", answer: "Ton, Ansagen und Gesprächsführung werden auf das Niveau Ihres Hauses abgestimmt und vor dem Start von Ihnen freigegeben. Was der Assistent übernimmt und was beim Team bleibt, legen Sie im Anliegen-Katalog fest." },
      { question: "Was passiert mit sensiblen Patientendaten oder Geschäftsinformationen?", answer: "Vier Punkte entscheiden, und Sie sollten sie bei jedem Anbieter abfragen: Wird das Gespräch aufgezeichnet und wie lange gespeichert. Werden Ihre Daten zum Training von Modellen verwendet. Gibt es einen Auftragsverarbeitungsvertrag nach Art. 28 DSGVO. Und wie wird die Schweigepflicht nach § 203 StGB vertraglich abgebildet. Bei uns: Gespräche werden nicht aufgezeichnet – gespeichert wird ausschließlich das strukturierte Ergebnis. Ihre Daten werden nicht zum Training von Modellen verwendet. Einen AVV nach Art. 28 DSGVO stellen wir jedem Kunden bereit. Cogniiq und alle Mitarbeitenden werden vertraglich auf das Berufsgeheimnis nach § 203 StGB verpflichtet. Der Assistent gibt sich zu Beginn jedes Anrufs als KI-System zu erkennen. " },
      { question: "Kann der Assistent mit meinem bestehenden Buchungssystem arbeiten?", answer: "Das prüfen wir vor dem Angebot: Wir klären die Anbindungsmöglichkeit Ihres Systems und sagen Ihnen konkret, in welcher Form die Übergabe ankommt. Ein Systemwechsel ist nicht Voraussetzung." },
      { question: "Was passiert bei einem technischen Ausfall?", answer: "Für den Störungsfall wird ein Fallback eingerichtet: Anrufe laufen dann auf eine von Ihnen benannte Nummer oder auf eine klare Ansage mit dem nächsten Schritt. Diesen Weg legen wir gemeinsam bei der Einrichtung fest." },
    ],
    localChallenges: [
      "In München ist die Auswahl an Anbietern groß – wer telefonisch schwer erreichbar ist, macht es Anrufern leicht, beim nächsten Anbieter anzurufen",
      "Die Personalkosten in München gehören zu den höchsten in Deutschland – dauerhaft besetzte Telefonplätze sind teuer und schwer zu besetzen",
      "Ein erheblicher Teil der Anrufer spricht Englisch – Erreichbarkeit heißt hier auch: in der richtigen Sprache antworten",
    ],
    industries: ["Privatpraxen & Kliniken", "Gastronomie & Luxury Dining", "Beratung & Finanzdienstleistung", "Sport & Wellness", "Hotels & Hospitality", "Immobilien & Kanzleien"],
    industriesExpanded: [
      {
        name: "Privatpraxen & Spezialisten",
        problem: "Privatpatienten erwarten schnelle Reaktion – ein dauerhaft besetztes Telefon oder eine unbeantwortete Anfrage spricht sich in diesem Umfeld schnell herum.",
        solution: "Der Assistent nimmt Terminwünsche auch außerhalb der Sprechzeiten an – auf Wunsch mehrsprachig, im Ton der Praxis. Medizinische Auskünfte gibt er nicht; dringende Anliegen gehen sofort an einen Menschen.",
      },
      {
        name: "Gastronomie & Premium Dining",
        problem: "Gehobene Restaurants haben hohe Ansprüche an den Ton am Telefon – und ein Team, das während des Services beim Gast bleiben soll.",
        solution: "Ein auf das Sprachniveau des Hauses abgestimmter Assistent nimmt Reservierungen auf Deutsch und Englisch an – die Ansagen geben Sie vor dem Start frei.",
      },
      {
        name: "Kanzleien & Rechtsberatung",
        problem: "Kanzleien wollen Erstanfragen sauber erfasst haben – ohne dass ein Anwalt jeden Erstanruf selbst führt oder Anliegen in der Telefonzentrale verloren gehen.",
        solution: "Der Assistent erfasst Erstanfragen strukturiert mit Anliegen und Kontaktdaten und leitet nach Ihren Zuständigkeitsregeln weiter – Rechtsauskünfte gibt er nicht.",
      },
      {
        name: "Hotels & Hospitality",
        problem: "Hotels erhalten Anfragen in mehreren Sprachen zu jeder Tages- und Nachtzeit, während das Front-Desk-Team tagsüber ausgelastet ist.",
        solution: "Der Assistent nimmt Reservierungsanfragen und Standardfragen mehrsprachig an – konfigurierbar für Stoßzeiten wie Oktoberfest oder Messewochen.",
      },
      {
        name: "Immobilien & Makler",
        problem: "Interessenten für Kauf und Miete rufen dann an, wenn Makler in Besichtigungen sind – unbeantwortete Anfragen kühlen in diesem Markt schnell ab.",
        solution: "Der Assistent nimmt Anfragen an, erfasst Objekt, Anliegen und Rückrufnummer und legt sie strukturiert vor – der Rückruf erfolgt vorbereitet statt blind.",
      },
    ],
    localScenarios: [
      {
        title: "Privatarztpraxis in Schwabing",
        description: "Eine internistische Privatpraxis mit internationaler Patientenschaft erhält viele Anrufe auf Englisch. Mit dem Telefonassistenten würden Terminwünsche auf Deutsch und Englisch angenommen und nach den Regeln der Praxis eingetragen – ohne zusätzliche Belastung des Teams.",
      },
      {
        title: "Gehobenes Restaurant in der Altstadt",
        description: "Reservierungsanfragen kommen gehäuft abends nach Küchenschluss, oft auf Englisch. Der Assistent nimmt sie im Ton des Hauses an und bestätigt nach Vorgabe – das Team erfährt es morgens aus der Liste statt vom Anrufbeantworter.",
      },
      {
        title: "Kanzlei in der Maxvorstadt",
        description: "Täglich Erstanrufe potenzieller Mandanten, die bisher unvollständig notiert wurden. Der Assistent erfasst Anliegen, Gegenstand und Kontaktdaten strukturiert und leitet nach Zuständigkeit weiter – der zuständige Anwalt ruft vorbereitet zurück.",
      },
      {
        title: "Hotel im Stadtgebiet",
        description: "Anfragen kommen rund um die Uhr und in mehreren Sprachen. Der Assistent deckt Deutsch und Englisch ab und übergibt andere Sprachen gezielt an verfügbare Mitarbeiter – das Front-Desk-Team bleibt bei den Gästen im Haus.",
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
      description: "Prozessautomatisierung für Unternehmen in München: Workflows & ERP-Integration, Leadverarbeitung. Remote betreut, skalierbar, dokumentiert. Transparente Festpreise.",
      canonical: `${base}/muenchen/automatisierung`,
    },
    intro: {
      h1: "Automatisierung für Unternehmen in München",
      lead: "Münchner Unternehmen wachsen schnell und haben keine Zeit für manuelle Prozesse. Wir automatisieren das, was täglich Zeit kostet: Leadverarbeitung, Datensynchronisation, Buchungen, Reporting. Remote betreut, dauerhaft wartbar, enterprise-ready.",
    },
    localIntro: {
      paragraphs: [
        "München ist ein Ausnahmestandort für Prozessautomatisierung: Schnell wachsende Startups brauchen von Anfang an skalierbare Prozesse. Mittelständler kämpfen mit gewachsenen Tool-Landschaften und manuellen Brücken zwischen Systemen. Konzerne digitalisieren einzelne Abteilungen ohne das große IT-Projekt anzufassen. Und Premium-Dienstleister wollen Effizienz, ohne Qualität und Markenwahrnehmung zu kompromittieren. Cogniiq liefert für alle diese Szenarien präzise Automatisierungslösungen.",
        "Als Automatisierungs-Agentur, die Münchner Unternehmen vollständig remote betreut, kombinieren wir das technische Know-how einer spezialisierten Agentur mit schlanken, transparenten Festpreisen. Die Zusammenarbeit läuft über Video-Calls, geteilte Boards und vollständig dokumentierte Konzepte – genauso professionell wie vor Ort, ohne Fahrtzeiten.",
        "Für Workflow-Automatisierung in München setzen wir auf professionelle, skalierbare Plattformen – je nach Ihren Anforderungen an Datenschutz, Skalierbarkeit und Kosten empfehlen wir die passende Lösung. Bei komplexen ERP-Integrationen oder spezifischen API-Anforderungen entwickeln wir auch direkte Schnittstellen. Alle Lösungen sind vollständig dokumentiert und so gebaut, dass sie Ihr Team versteht und selbst warten kann.",
        "Was den Münchner Markt besonders macht: Personalkosten sind die höchsten in Deutschland – jede Stunde, die durch Automatisierung eingespart wird, hat hier den höchsten ROI. Ein Workflow, der täglich 2 Stunden Arbeit ersetzt, amortisiert sich bei Münchner Lohnniveau schnell. Das macht Automatisierungsinvestitions in München besonders attraktiv.",
        "Neben der Automatisierung bieten wir für München auch den [KI Telefonassistenten für München](/muenchen/ki-telefonassistent) und professionelles [Webdesign für München](/muenchen/webdesign) an. Unternehmen, die alle drei Bereiche kombinieren, haben im Münchner Wettbewerbsmarkt einen messbaren operativen Vorteil.",
      ],
    },
    warumCogniiq: [
      "Vollständig remote betreut – direkte Zusammenarbeit, transparente Festpreise",
      "Technologieoffene Beratung: professionelle Plattformen und direkte APIs – je nach Bedarf",
      "Saubere Dokumentation, die Ihr Team versteht und nutzen kann",
      "Erfahrung mit Skalierung: von 5 bis 500 automatisierten Prozessen",
      "Schnelle Reaktionszeiten bei Anpassungen – auch für wachsende Münchner Unternehmen",
    ],
    useCases: [
      {
        industry: "Startups & Scale-ups",
        title: "Lead-Nurturing automatisch",
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
        description: "Bestellungen triggern Lager-Updates, Versandmeldungen und Kundenkommunikation automatisch – ohne manuelle Eingriffe, skalierbar für hohes Transaktionsvolumen im Münchner Markt.",
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
      { question: "Wie unterscheiden sich eure Preise von Münchner Agenturen?", answer: "Wir arbeiten vollständig remote mit transparenten Festpreisen und direkter Zusammenarbeit – Sie sehen vor dem Start, was das Projekt kostet." },
      { question: "Habt ihr Erfahrung mit Skalierung für Münchner Unternehmen?", answer: "Ja. Wir bauen Automatisierungen von Anfang an skalierbar – damit sie mit Ihrem Unternehmen wachsen können." },
      { question: "Können komplexe ERP-Systeme integriert werden?", answer: "In den meisten Fällen ja. Wir prüfen vorab welche APIs verfügbar sind und was technisch machbar ist." },
      { question: "Was wenn sich unsere Prozesse ändern?", answer: "Wir passen die Automatisierungen an. Durch vollständige Dokumentation können einfache Änderungen auch intern vorgenommen werden." },
      { question: "Wie lange dauert ein Automatisierungsprojekt in München?", answer: "Einfache Workflows: 1–2 Wochen. Komplexe Integrationen: 4–8 Wochen. Realistischer Zeitplan nach der Analyse." },
      { question: "Welche Branchen in München betreut ihr?", answer: "Startups, Scaleups, E-Commerce, Beratung, Finanzdienstleistung, Mittelstand, Medizintechnik und SaaS – wir passen uns Ihrer Branche an." },
      { question: "Welche Automatisierungsplattform ist die richtige für mein Unternehmen in München?", answer: "Das hängt von Ihren Anforderungen ab: Datenschutzbedürfnisse, Skalierbarkeit und technische Komplexität. Wir beraten unabhängig und empfehlen die Lösung, die langfristig am besten zu Ihrem Unternehmen passt." },
      { question: "Wie hoch ist der ROI von Automatisierungen in München?", answer: "Durch die hohen Personalkosten in München amortisieren sich Automatisierungen oft schnell. Ein Workflow, der täglich 2 Stunden Arbeit ersetzt, zahlt sich bei Münchner Lohnniveau oft in wenigen Monaten." },
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
        solution: "Automatisierte Bestellverarbeitung, Lagerabgleich, Versandmeldungen und Kundenkommunikation – ohne manuelle Eingriffe, skalierbar für hohes Volumen.",
      },
      {
        name: "Finanzdienstleistung & Beratung",
        problem: "Beratungsunternehmen in München verlieren Zeit mit manuellem Kunden-Onboarding, Dokumentenmanagement und CRM-Pflege.",
        solution: "Vom Erstanfrage-Eingang bis zum abgeschlossenen Onboarding laufen alle Schritte automatisch – vollständig dokumentiert.",
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
        description: "Ein SaaS-Startup in Schwabing erhält täglich neue Trial-Anmeldungen, die manuell im CRM erfasst, mit Welcome-E-Mails begrüßt und dem Vertriebsteam zugewiesen werden. Mit einer passenden Automatisierung läuft der gesamte Prozess in wenigen Minuten – von der Anmeldung bis zur personalisierten Begrüßungssequenz.",
      },
      {
        title: "E-Commerce-Unternehmen in der Maxvorstadt",
        description: "Ein D2C-Brand aus der Maxvorstadt verwaltet einen wachsenden Bestellbestand manuell in drei Systemen. Bestellabwicklung, Lagerabzug und Versandbenachrichtigung sind fehleranfällig und zeitintensiv. Mit einer passenden Automatisierung läuft der gesamte Prozess automatisch – mit deutlich weniger Fehlerquellen.",
      },
      {
        title: "Unternehmensberatung im Münchner Stadtgebiet",
        description: "Eine mittelgroße Unternehmensberatung in München verliert wöchentlich Stunden mit dem manuellen Onboarding neuer Mandanten – Verträge versenden, Zugänge einrichten, erste Termine koordinieren. Mit einer passenden Automatisierung läuft Onboarding innerhalb von Minuten nach Vertragsunterzeichnung vollständig automatisch ab.",
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
      title: "Webdesign Agentur München – Website erstellen & SEO | Cogniiq",
      description: "Webdesign München: Individuelle Websites für Startups, Mittelstand und Premium-Segment. Enterprise-Qualität, remote betreut, transparente Festpreise. SEO-optimiert, schnell, mehrsprachig.",
      canonical: `${base}/muenchen/webdesign`,
    },
    intro: {
      h1: "Webdesign für Unternehmen in München",
      lead: "Cogniiq entwickelt Websites für Münchner Unternehmen auf hohem technischem und gestalterischem Niveau – vollständig remote betreut, mit transparenten Festpreisen: individuelle Entwicklung, Enterprise-Performance, klare Abläufe.",
    },
    localIntro: {
      paragraphs: [
        "München ist ein digitaler Wettbewerbsmarkt, in dem Websites sowohl visuell als auch technisch auf höchstem Niveau sein müssen. Startups positionieren sich für internationale Investoren. Mittelständler brauchen Websites, die qualifizierte B2B-Anfragen generieren. Premium-Dienstleister müssen online dasselbe Niveau darstellen, das ihre Marke offline lebt. Und alle konkurrieren in einem Markt, in dem Google täglich entscheidet, wer gesehen wird – und wer nicht.",
        "Cogniiq bietet Münchner Unternehmen Entwicklung auf Enterprise-Niveau und direkte Zusammenarbeit mit dem Entwickler Ihrer Website – vollständig remote betreut, mit transparenten Festpreisen. Individuelle Konzeption, technische Präzision, SEO von Anfang an integriert, mehrsprachige Entwicklung auf Wunsch.",
        "Was technisch Standard für uns ist: Ladezeiten unter 1,5 Sekunden, Core Web Vitals im grünen Bereich, Mobile-First-Design (der überwiegende Teil der Münchner Suchanfragen kommt vom Smartphone), strukturierte Daten für Google und eine dokumentierte Einbindung aller Tools. Diese technischen Grundlagen sind keine Optional-Features – sie sind die Basis, auf der jede Website für den Münchner Markt gebaut sein muss.",
        "Für internationale Unternehmen und Münchner Firmen mit globalen Kunden: Mehrsprachige Website-Entwicklung auf Deutsch und Englisch ist Standard, weitere Sprachen auf Anfrage. Wir kennen die Anforderungen an internationale SEO-Strukturen und setzen sie technisch korrekt um.",
        "Als Ergänzung zum Webdesign bieten wir in München auch den [KI Telefonassistenten für München](/muenchen/ki-telefonassistent) und [Prozessautomatisierung für München](/muenchen/automatisierung) an. Alle drei Bereiche aus einer Hand – für eine konsistente, leistungsstarke digitale Infrastruktur ohne Schnittstellenprobleme zwischen verschiedenen Agenturen.",
      ],
    },
    warumCogniiq: [
      "Enterprise-Qualität – vollständig remote betreut, mit transparenten Festpreisen",
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
      { question: "Was kostet eine Website für ein Münchner Unternehmen?", answer: "Websites starten ab ca. 1.500 €, abhängig von Umfang und Anforderungen. Die vollständige Preisstaffelung mit allen Paketen für den Münchner Markt finden Sie auf unserer Seite „Webdesign Kosten München“." },
      { question: "Könnt ihr mit Münchner Markenagenturen zusammenarbeiten?", answer: "Ja. Wir übernehmen gerne die technische Umsetzung von Designs, die von anderen Agenturen erstellt wurden." },
      { question: "Habt ihr Erfahrung mit SEO für den Münchner Markt?", answer: "Ja. Lokaler SEO für den Münchner Markt erfordert Strategie – wir kennen den Wettbewerb und setzen gezielte Maßnahmen um." },
      { question: "Wie funktioniert die Remote-Zusammenarbeit?", answer: "Video-Calls, Figma-Boards, Staging-Umgebungen – genauso wie bei lokalen Agenturen, ohne Pendelzeit." },
      { question: "Wie schnell kann eine Website live gehen?", answer: "Einfachere Projekte in 4–6 Wochen, komplexere in 8–12 Wochen. Immer mit realistischem Zeitplan nach dem Briefing." },
      { question: "Könnt ihr Websites auf Englisch und Deutsch gleichzeitig entwickeln?", answer: "Ja. Mehrsprachige Websites mit korrekter hreflang-Implementierung und internationaler SEO-Struktur sind unser Standard für Münchner Kunden mit globalem Publikum." },
      { question: "Was unterscheidet Cogniiq von einer Münchner Agentur?", answer: "Wir arbeiten vollständig remote – mit direkter Zusammenarbeit mit dem Entwickler, schneller Umsetzung und transparenten Festpreisen." },
      { question: "Habt ihr Erfahrung mit dem Münchner Premium-Segment?", answer: "Ja. Ton, Ästhetik und technisches Niveau werden auf das Premiumsegment angepasst – für Unternehmen, bei denen der erste digitale Eindruck entscheidend ist." },
      { question: "Was passiert nach dem Launch?", answer: "Wir analysieren Nutzungsdaten, identifizieren Optimierungspotenzial und setzen Verbesserungen um. Laufende Betreuung auf Wunsch." },
      { question: "Kann ich die Website selbst pflegen?", answer: "Ja. Wir richten auf Wunsch ein CMS ein und schulen Ihr Team. Alternativ übernehmen wir die Pflege." },
    ],
    localChallenges: [
      "Webdesign-Budgets sind im Münchner Markt schnell gebunden – transparente Festpreise und effiziente Remote-Zusammenarbeit schaffen Planbarkeit",
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
        description: "Ein B2B-SaaS-Startup in Schwabing hat eine intern gebaute Website, die technisch schwach und nicht für internationale Nutzer optimiert ist. Nach dem Website-Relaunch in Deutsch und Englisch mit klarer Produktpositionierung und SEO-Struktur steigen qualifizierte Demo-Anfragen deutlich.",
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
      { label: "Webdesign Kosten München", href: "/muenchen/webdesign-kosten" },
      { label: "KI-Telefonassistent München", href: "/muenchen/ki-telefonassistent" },
      { label: "Automatisierung München", href: "/muenchen/automatisierung" },
    ],
  },
};
