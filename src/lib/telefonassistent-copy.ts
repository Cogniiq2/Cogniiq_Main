// ─────────────────────────────────────────────────────────────────────────────
// Wiederverwendbare Copy-Module für das KI-Telefonassistent-Cluster.
//
// Quelle: Master-Briefs I–III (.claude/COPY-BRIEF*.md) und die finalen
// Inhaber-Antworten A–F vom 17.08.2026. Diese Bausteine sind die kanonische
// Fassung der Kernaussagen. Seiten-Configs importieren von hier, statt Prosa
// zu kopieren — so bleiben Säulen, Prozess und Datenschutz-Fakten wartbar.
//
// Regeln, die für jeden String hier gelten:
// - Deutsch, Sie-Form, keine Ausrufezeichen im Fließtext.
// - Keine erfundenen Zahlen; Statistiken nur aus der freigegebenen Liste
//   (Zi 2024/2026, vzbv 2025, GKV-Spitzenverband 2025, Virchowbund 2026),
//   immer mit Quelle und Jahr im sichtbaren Text.
// - Begrenzte, ehrliche Aussagen: Entlastung zu Stoßzeiten und außerhalb
//   der Öffnungszeiten — nie "alle Anrufe", nie Prozent-Ersparnisse.
// - Notfälle: Erkennen und sofort weiterleiten, niemals einschätzen.
// - KEINE Aussage zu Hosting-Standort, EU-Verarbeitung, Serverstandort oder
//   "DSGVO-konform" (Inhaber-Antwort B: AVV mit den Infrastruktur-Anbietern
//   sind nicht signiert, EU-Datenresidenz ungeklärt).
// - KEINE Behauptung einer fertigen PVS-Standardanbindung (Inhaber-Antwort B).
// ─────────────────────────────────────────────────────────────────────────────

/**
 * KERNAUSSAGEN — die eine Quelle für alles, was mehr als einmal auf der Website
 * steht.
 *
 * Hintergrund: Dieselbe Zusage stand mehrfach an Stellen, die niemand zusammen
 * im Blick hatte — Modultext, FAQ-String einer Seite, Stadt-Config,
 * Meta-Description. Drei Korrekturrunden mussten deshalb nachgebessert werden
 * (HONESTY-AUDIT §7). Jede Aussage, die an mehr als einer Stelle vorkommt,
 * gehört ab hier in diese Konstante; Modultexte, FAQ-Antworten und
 * Seitenkomponenten setzen sie ein, statt sie neu zu formulieren.
 *
 * Ein Test (`telefonassistent-copy.test.ts`) hält das durch: Er schlägt an,
 * sobald eine der Kernzahlen irgendwo im Cluster als Literal auftaucht.
 */
export const FAKTEN = {
  // ── Zahlen ──
  mehrpreisProMinute: `0,39\u00A0€`,
  /*
    Korrigiert am 23.08.2026 von 7 auf 14 (Inhaber).

    Vertraglich zugesagt sind ZWEI WOCHEN. Die Website versprach an zehn Stellen
    7 Tage — und zwar mit derselben Rechtsfolge, dem Wegfall der zweiten Hälfte
    der Einrichtungsgebühr. Damit stand eine Frist im Markt, die der Vertrag
    nicht trägt: Ein Kunde hätte auf 7 Tagen bestehen und bei Überschreitung die
    Hälfte der Einrichtungsgebühr einbehalten können. Eine Zusage mit Geldfolge
    darf nie kürzer sein als die vertragliche.
  */
  goLiveTage: 14,
  /** Sprachform der Frist. In Fliesstext immer diese, nie "14 Tage". */
  goLiveFrist: "zwei Wochen",
  aenderungTage: 3,
  laufzeitMonate: 12,
  preisgarantieMonate: 24,
  monatlichAufschlag: `20\u00A0%`,
  erreichbarkeit: "täglich 6–20\u00A0Uhr",
  antwortzeit: "spätestens innerhalb von 24\u00A0Stunden",
  gleichzeitigeAnrufe: 10,

  // ── Sätze, die wörtlich wiederverwendet werden ──
  /** Deckelung. Nennt die Obergrenzen einzeln, weil die Regel „nie mehr als der
   *  nächsthöhere Tarif" für MVZ nicht trägt (dort 1.400 €, Enterprise ab 5.000 €). */
  deckelung: `Über dem Minutenkontingent kostet jede weitere Minute 0,39\u00A0€. Nach oben ist jeder Tarif auf seine ausgewiesene Obergrenze gedeckelt: Basis auf 500\u00A0€ im Monat, Praxis auf 800\u00A0€, MVZ auf 1.400\u00A0€.`,

  /** Tarifzuordnung. Beschreibt nicht nur den Rechner, sondern die Zusage an den
   *  Kunden — siehe COPY-CLAIMS-TO-VERIFY F10. */
  tarifzuordnung:
    "Liegt Ihr Aufkommen dauerhaft höher, ordnen wir Sie dem Tarif zu, der für Ihren Bedarf am günstigsten ist und nicht dauerhaft an seiner Obergrenze läuft — Sie zahlen den Zuschlag also nicht Monat für Monat.",

  nichtProBehandler:
    "Abgerechnet wird pro Praxis, nicht pro Behandler.",

  /*
    Die Zusage nennt zuerst die Frist, dann die Folge, in zwei kurzen Saetzen.
    Eine Garantie, die erklaert werden muss, wirkt nicht wie eine Garantie.
    Bezugspunkt ist der Zahlungseingang, nicht der Vertragsabschluss: Die Frist
    laeuft erst mit der ersten Haelfte an, und das ist fuer beide Seiten pruefbar.
  */
  goLive: `Ihr Empfang geht spätestens zwei Wochen nach Zahlungseingang live. Halten wir diesen Termin nicht ein, entfällt die zweite Hälfte der Einrichtungsgebühr.`,

  /** Zahlungsaufteilung — erklaert, warum die Garantie ueberhaupt greifen kann. */
  zahlungsaufteilung: `Die Einrichtungsgebühr zahlen Sie zur Hälfte bei Vertragsabschluss, zur zweiten Hälfte nach dem Go-live.`,

  /*
    "Kleinere Aenderungen" ist die Grenze, die der Inhaber selbst zieht
    (23.08.2026). Sie bleibt im Satz stehen: Eine Zusage ohne Grenze bricht beim
    ersten groesseren Umbau, und genau das merkt sich dieser Kaeufer.
  */
  aenderungen: `Kleinere Änderungen an Ansagen und Regeln reichen Sie über das Kundendashboard oder per E-Mail ein; umgesetzt sind sie innerhalb von 3\u00A0Tagen.`,

  kuendigung: `Gekündigt wird mit einem Klick im Kundendashboard, zum Laufzeitende. Kein Anruf, keine E-Mail, keine Fristfalle.`,

  laufzeit: `Die Laufzeit beträgt 12\u00A0Monate; wer monatlich kündbar bleiben möchte, zahlt 20\u00A0% Aufschlag.`,

  preisgarantie: `Der Preis ist für 24\u00A0Monate schriftlich garantiert.`,

  keineAufzeichnung:
    "Gespräche werden nicht aufgezeichnet — gespeichert wird ausschließlich das strukturierte Ergebnis: Anliegen, Name, Rückrufnummer, Terminwunsch.",

  keinTraining: "Ihre Daten werden nicht zum Training von Modellen verwendet.",

  art50:
    "Der Assistent gibt sich zu Beginn jedes Anrufs als KI-System zu erkennen (Art. 50 KI-Verordnung). Ihre Patientinnen und Patienten wissen von der ersten Sekunde an, mit wem sie sprechen — abschalten lässt sich das nicht.",

  /** Anschluss. „Ihre Rufnummer bleibt" war eine Zusage ohne Grundlage; die
   *  Rufumleitung auf die vereinbarte Nummer ist der belegbare Kern davon.
   *  Inhaber-Entscheidung 18.08.2026: keine unbelegte Zusage auf der Seite,
   *  auch nicht mit [[CLAIM]]-Marker — der Marker schuetzt intern, der Besucher
   *  liest die Zusage trotzdem. */
  rufumleitung:
    "Ihre Anrufe werden auf die vereinbarte Nummer umgeleitet. Was dafür an Ihrem Anschluss nötig ist, sehen wir uns vor dem Angebot an und schreiben das Ergebnis hinein.",

  keineAnbindung:
    "Eine fertige Standardanbindung an Praxisverwaltungssysteme gibt es heute nicht. Das Ergebnis eines Anrufs steht strukturiert im Cogniiq-Dashboard; den Übertrag ins Praxissystem macht Ihr Team, solange für Ihre Software keine Schnittstelle möglich ist.",
};

/** M4 · Die vier Säulen — als beschriebene Mechanik, nicht als Slogan. */
export const SAEULEN: Array<{ title: string; description: string }> = [
  {
    title: "Für Ihre Praxis konfiguriert, nicht von der Stange",
    description:
      "Vor dem Start nehmen wir Ihre tatsächlichen Anrufanlässe auf: Terminwunsch, Terminstornierung, Rezeptbestellung, Überweisung, Befundauskunft. Für jeden Anlass legen Sie fest, was der Assistent erledigt und was immer bei Ihrem Team landet. Das Ergebnis ist Ihre Menüführung — nicht ein Standardablauf, an den Sie sich anpassen müssen.",
  },
  {
    title: "Klingt wie Ihr Empfang, nicht wie ein Automat",
    description:
      "Sie wählen die Stimme, formulieren Ihren Begrüßungssatz und legen fest, wie Ihre Praxis am Telefon spricht. Zehn Anrufe können gleichzeitig laufen, ohne dass jemand ein Besetztzeichen hört. Anrufer erfahren im ersten Satz, dass ein KI-System spricht — und können jederzeit zu einem Menschen wechseln.",
  },
  {
    title: "Die Übergabe klären wir vor der Unterschrift",
    description:
      "Jedes Gespräch endet als strukturierter Eintrag: Anliegen, Name, Rückrufnummer, Terminwunsch. Der übliche Weg sieht heute so aus, dass Ihre MFA dieses Ergebnis anschließend ins Praxissystem überträgt. Vor der Einrichtung prüfen wir, welche Schnittstelle Ihr System bietet, und bauen die Übergabe darauf auf. Wo eine Anbindung möglich ist, landet das Anliegen direkt dort, wo Sie ohnehin arbeiten. Wo sie nicht möglich ist, sagen wir Ihnen das vorher — und nicht nach der Unterschrift.",
  },
  {
    title: "Ein Kontingent, ein Preis, eine Obergrenze",
    description:
      `Jeder Tarif enthält ein festes Minutenkontingent. ${FAKTEN.deckelung} Eine Grippewelle kann Ihre Rechnung also bewegen, aber nicht sprengen. ${FAKTEN.preisgarantie} ${FAKTEN.nichtProBehandler}`,
  },
];

/**
 * M3 · Warum bisherige Versuche gescheitert sind — der vertrauensbildende
 * Block. Marktmuster benennen, nie Wettbewerber (§2.3 UWG).
 */
export const SCHEITERN_INTRO =
  "Viele Betriebe haben Telefonassistenten bereits ausprobiert — und wieder abgeschafft. Selten lag es daran, dass die Technik den Anrufer nicht verstanden hätte. Gescheitert ist fast immer, was nach dem Gespräch passiert.";

export const SCHEITERN_MUSTER: Array<{ title: string; description: string }> = [
  {
    title: "Das Ergebnis kam nicht im System an",
    description:
      "Der übliche Weg: Das Gespräch endet in einer E-Mail oder einer Sprachnachricht, und jemand tippt alles von Hand ab. Die Arbeit ist dann nicht verschwunden, sie ist nur umgezogen. Deshalb prüfen wir vor der Einrichtung, welche Schnittstelle Ihr System bietet, und sagen Ihnen vorher, was möglich ist und was nicht.",
  },
  {
    title: "Die Stimme klang nach Maschine",
    description:
      "Starre Menüs und synthetische Ansagen führen dazu, dass Anrufer auflegen oder sich beschweren. Wir stimmen Stimme, Begrüßung und Formulierungen auf Ihre Praxis ab und testen vor dem Start zwei Tage lang mit echten Szenarien — live geht der Assistent erst, wenn Sie zufrieden sind.",
  },
  {
    title: "Niemand hat das System an den Betrieb angepasst",
    description:
      `Viele Systeme am Markt werden einmal eingerichtet und dann sich selbst überlassen. Ändern sich Sprechzeiten oder Abläufe, veraltet die Konfiguration. Bei uns ist das anders: ${FAKTEN.aenderungen} Von einem festen Ansprechpartner, nicht von einem Ticketsystem.`,
  },
];

/**
 * M5 · So wird Ihr Empfang gebaut — Kurzfassung des Personalisierungsprozesses.
 * Die vollständigen acht Schritte stehen in M17 (`EINRICHTUNG_PROJEKT`).
 */
export const EINRICHTUNG_SCHRITTE: Array<{
  step: string;
  title: string;
  description: string;
}> = [
  {
    step: "01",
    title: "Erstgespräch",
    description:
      "Wir gehen Ihre typischen Anrufe durch: Welche Anliegen kommen täglich, welche zu Stoßzeiten, was darf der Assistent erledigen, was gehört immer in menschliche Hände. Dazu eine kurze Demo mit konkreten Beispielen.",
  },
  {
    step: "02",
    title: "Angebot und Unterschrift",
    description:
      "Sie erhalten ein individuell erstelltes Angebot per E-Mail. Unterschrieben wird online per E-Signatur — ohne App, ohne Zusatzsoftware, am Handy mit dem Finger.",
  },
  {
    step: "03",
    title: "Ihre Vorgaben",
    description:
      "Im Kundendashboard führen wir Sie durch die Einstellungen: Stimme, Begrüßungssatz, Anliegen, Regeln, Weiterleitungen. Notfall-Hinweise führen immer und ohne Umweg zu einem Menschen oder zur Notrufansage.",
  },
  {
    step: "04",
    title: "Aufbau",
    description:
      "Ihr Assistent wird auf Basis dieser Angaben gebaut — nicht aus einer Vorlage kopiert und nicht aus einer Liste ausgewählt.",
  },
  {
    step: "05",
    title: "Testphase und Go-live",
    description:
      `Zwei Tage testen wir gemeinsam. Live geht der Assistent erst, wenn Ihre Praxis zufrieden ist — spätestens ${FAKTEN.goLiveFrist} nach Zahlungseingang.`,
  },
];

/**
 * M6/M21 · Für Ihr Praxisteam — an MFA/Empfang gerichtet, ohne
 * Jobverlust-Abwehrrhetorik: Entlastung konkret zeigen, nicht verteidigen.
 */
export const TEAM_BLOCK = {
  headline: "Was sich für Ihr Team am ersten Tag ändert",
  text: "Das Telefon klingelt nicht mehr in dem Moment, in dem eine Patientin am Tresen steht. Wiederkehrende Anliegen — Terminwunsch, Stornierung, Rezeptbestellung — kommen als strukturierte Einträge an, nicht als Klingeln zwischen zwei Handgriffen. Ihr Team entscheidet weiterhin über jeden Termin und jede Rückmeldung; es wird nur seltener dabei unterbrochen.",
  points: [
    "Weniger Unterbrechungen zu Stoßzeiten — der Tresen hat Vorrang",
    "Zehn Anrufe gleichzeitig: niemand hört mehr ein Besetztzeichen, auch am Montagmorgen nicht",
    "Jeder Anruf kommt strukturiert an: Anliegen, Name, Rückrufnummer, Terminwunsch — statt Notizzettel",
    "Rückrufliste statt Daueralarm: abarbeiten, wenn es in den Ablauf passt",
    "Ihr Team behält die Kontrolle — jede Regel und jede Ansage lässt sich ändern",
    FAKTEN.aenderungen.replace(/\.$/, ""),
  ],
};

/**
 * M7 · Datenschutz in konkreten Punkten — sachlich, ohne Rechtsberatung.
 *
 * WICHTIG: Diese Liste enthält ausschließlich die vom Inhaber freigegebenen
 * Aussagen (Antwort C). Keine Aussage zu Hosting, Serverstandort, EU-Verarbeitung
 * oder "DSGVO-konform" — diese sind ausdrücklich untersagt, solange die AVV mit
 * den Infrastruktur-Anbietern nicht signiert und die Datenresidenz ungeklärt ist.
 * Keine TOM-Aussage (Liste existiert nicht). Keine DSFA-Aussage.
 */
export const DATENSCHUTZ_PUNKTE: string[] = [
  FAKTEN.keineAufzeichnung,
  FAKTEN.keinTraining,
  FAKTEN.art50,
  // [[CLAIM: Vorlage finalisieren (Inhaber-Antwort C)]]
  "Einen Auftragsverarbeitungsvertrag nach Art. 28 DSGVO stellen wir jedem Kunden bereit",
  // [[CLAIM: Klausel finalisieren (Inhaber-Antwort C)]]
  "Cogniiq und alle Mitarbeitenden werden vertraglich auf das Berufsgeheimnis nach § 203 StGB verpflichtet",
  "Ob Ihre Praxis eine Datenschutz-Folgenabschätzung benötigt, entscheidet Ihr Datenschutzbeauftragter — wir liefern die Unterlagen zu, statt die Frage für Sie zu beantworten",
];

/** M8 · Anliegen-Katalog — Grenzen benennen schafft mehr Vertrauen als verstecken. */
export const ANLIEGEN_UEBERNIMMT: string[] = [
  "Terminwünsche aufnehmen und nach Ihren Regeln vergeben oder zur Bestätigung vorlegen",
  "Terminstornierungen und Verschiebungen entgegennehmen — frei werdende Termine sind sofort sichtbar",
  "Rezept- und Überweisungswünsche strukturiert erfassen, zur Bearbeitung durch Ihr Team",
  "Wiederkehrende Fragen beantworten: Sprechzeiten, Anfahrt, Urlaubsvertretung, benötigte Unterlagen",
  "Rückrufwünsche mit Anliegen und Rückrufnummer auf die Rückrufliste setzen",
];

export const ANLIEGEN_IMMER_MENSCH: string[] = [
  "Medizinische Fragen jeder Art — der Assistent gibt keine Auskunft zu Symptomen, Befunden oder Behandlungen",
  "Notfall-Hinweise: sofortige Weiterleitung an Ihr Team, den Bereitschaftsdienst oder die klare Ansage, den Notruf 112 zu wählen — keine Einschätzung durch das System",
  "Beschwerden und emotionale Gespräche — hier übernimmt ein Mensch",
  "Alles, was Sie im Anliegen-Katalog als Chefsache markieren",
];

/** M10 · Planbare Kosten — Vorhersehbarkeit vor Preishöhe. */
export const PLANBARE_KOSTEN = {
  headline: "Ein Kontingent, ein Preis, eine Obergrenze",
  text: `Jeder Tarif enthält ein festes Minutenkontingent. ${FAKTEN.deckelung} ${FAKTEN.nichtProBehandler} Einmalig kommt die Einrichtung Ihres Empfangs dazu; sie steht vor Vertragsschluss im Angebot. ${FAKTEN.preisgarantie}`,
};

/**
 * M15 · Was unser Empfang nicht macht — benannte Grenzen als normaler
 * Abschnitt, nicht im FAQ versteckt. Bewusst unbequem; nicht abschwächen.
 * Steht auf jeder kommerziellen Seite VOR dem Preis (Brief III §3.2).
 */
export const GRENZEN = {
  headline: "Was unser Empfang nicht macht",
  intro:
    "Ein Telefonassistent, der alles verspricht, hat entweder keine Grenzen definiert oder verschweigt sie. Unsere stehen hier.",
  points: [
    "Keine medizinische Einschätzung, keine Triage, keine Beratung. Der Assistent beurteilt niemals, wie dringend ein gesundheitliches Anliegen ist – zu keinem Zeitpunkt, in keiner Konfiguration.",
    "Kein Ersatz für Ihr Team. Der Assistent nimmt Anrufe an, die sonst verloren gingen – die Entscheidungen über Termine, Rückmeldungen und Ausnahmen bleiben bei Ihren Mitarbeiterinnen und Mitarbeitern.",
    "Notfälle werden erkannt und sofort weitergeleitet – an Ihr Team, den Bereitschaftsdienst oder mit der klaren Ansage, den Notruf 112 zu wählen. Eine Bewertung des Notfalls findet nicht statt.",
    "Beschwerden, emotionale Gespräche und alles, was Sie im Anliegen-Katalog als Chefsache markieren, landen immer bei einem Menschen.",
    `${FAKTEN.keineAnbindung} Was für Ihr System geht, prüfen wir vor dem Angebot.`,
    "Gespräche werden nicht aufgezeichnet. Wenn Sie später den genauen Wortlaut eines Anrufs brauchen, gibt es ihn nicht – Sie haben das strukturierte Ergebnis, nicht die Aufnahme.",
    "Der Assistent übernimmt nicht alle Anrufe. Realistisch ist Entlastung zu Stoßzeiten und außerhalb der Öffnungszeiten – nicht die vollständige Übernahme Ihrer Telefonie.",
  ],
};

/**
 * M16 · Wenn wir nicht zu Ihnen passen — konkrete Konstellationen,
 * sachlich, ohne verstecktes Eigenlob.
 */
export const NICHT_PASSEND = {
  headline: "Wann wir nicht die richtige Lösung sind",
  intro:
    "Ein Erstgespräch lohnt sich nicht für jeden Betrieb. In diesen Konstellationen raten wir ab:",
  points: [
    "Sie erwarten, dass aufgenommene Termine automatisch in Ihrem Praxisverwaltungssystem stehen. Eine fertige Standardanbindung gibt es heute nicht. Ist das Ihre Bedingung, sind wir noch nicht der richtige Anbieter.",
    "Sie erwarten, dass die Telefonie vollständig ohne Ihr Team läuft. Der Assistent entlastet – er ersetzt keine Anmeldung und keine fachliche Entscheidung.",
    "Ihr Anrufaufkommen ist sehr gering und Ihr Team gut erreichbar. Dann löst der Assistent kein Problem, das Sie haben – und ein System ohne Problem ist nur ein Kostenpunkt.",
    "Sie möchten, dass Anrufer nicht erfahren, dass ein KI-System spricht. Diese Transparenz ist für uns nicht verhandelbar – rechtlich wie inhaltlich.",
  ],
};

/**
 * M20 · Was Ihre Patientinnen und Patienten gerade erleben — Patientensicht
 * aus Praxisperspektive, eigene Sätze, keine Zitate, max. eine Statistik.
 */
export const PATIENTEN_SICHT = {
  headline: "Was Ihre Patientinnen und Patienten gerade erleben",
  paragraphs: [
    "Aus Sicht Ihrer Patienten sieht ein überlasteter Montag so aus: immer besetzt, niemand geht ans Telefon, beim dritten Versuch die Warteschleife. Wer absagen wollte, kommt nicht durch – und sorgt sich, den Termin trotzdem in Rechnung gestellt zu bekommen. Manche schließen daraus, die Praxis sei absichtlich nicht erreichbar. Und ein Teil ruft gar nicht erst an, weil ihm Telefonieren schwerfällt.",
    "Nichts davon hat mit der Qualität Ihrer Medizin zu tun. Aber genau das steht später in der Online-Bewertung – und genau diese Gespräche fängt Ihr Team am Tresen auf, jeden Tag.",
  ],
  stat: {
    value: "39\u00A0%",
    text: "der Versicherten bewerten die Erreichbarkeit von Praxen außerhalb der Öffnungszeiten als schwierig.",
    source: "GKV-Spitzenverband, Versichertenbefragung 2025",
  },
};

/**
 * Anbindung an bestehende Systeme (/integrationen). Dreistufig, in dieser
 * Reihenfolge und optisch gleichrangig: was heute läuft, was wir prüfen, was
 * wir nicht behaupten. Der dritte Abschnitt wird nicht kleiner gesetzt und
 * nicht ans Ende geschoben — er ist der Grund, warum die Seite glaubwürdig ist.
 *
 * Keine Produktnamen von Praxisverwaltungssystemen, solange keine Anbindung
 * existiert (Inhaber-Antwort B).
 */
export const ANBINDUNG = {
  heute: {
    headline: "Was heute läuft",
    frage: "Was passiert nach einem Anruf?",
    absaetze: [
      "Jeder Anruf endet als strukturierter Eintrag im Cogniiq-Dashboard: Anliegen, Name, Rückrufnummer, Terminwunsch. Ihr Team sieht auf einen Blick, worum es ging, und arbeitet die Liste ab, wenn es in den Ablauf passt.",
      "Das ist bewusst kein Postfach mit Sprachnachrichten. Der Unterschied ist die Arbeit danach: Eine Mailbox müssen Sie abhören, mitschreiben und einordnen — ein strukturierter Eintrag ist bereits sortiert. Was Ihr Team noch tut, ist der Übertrag ins Praxissystem, nicht das Rekonstruieren des Gesprächs.",
      "Weil nichts aufgezeichnet wird, gibt es auch keine Audiodatei zum Abhören. Das ist eine Entscheidung, keine Lücke: Es entsteht keine Aufnahme, die aufbewahrt, geschützt und irgendwann gelöscht werden müsste.",
    ],
    punkte: [
      "Anliegen — worum es im Gespräch ging",
      "Name der anrufenden Person",
      "Rückrufnummer",
      "Terminwunsch, soweit genannt",
    ],
  },
  pruefen: {
    headline: "Was wir für Sie prüfen",
    frage: "Lässt sich das an mein System anbinden?",
    absaetze: [
      "Vor der Einrichtung sehen wir uns an, welche Schnittstelle Ihr System bietet, und bauen die Übergabe darauf auf. Wo eine Anbindung technisch möglich ist, landet das Anliegen direkt dort, wo Sie ohnehin arbeiten.",
      "Diese Prüfung gehört zum Angebot, nicht zum Projekt danach. Sie erfahren das Ergebnis vor der Unterschrift — und wenn es negativ ausfällt, erfahren Sie auch das vorher.",
    ],
    schritte: [
      "Sie nennen uns Ihr Praxisverwaltungssystem, Ihren Kalender und Ihre Telefonanlage.",
      "Wir prüfen, welche Schnittstelle es dafür gibt und was sie kann.",
      "Das Ergebnis steht im Angebot: was möglich ist, was es kostet, was nicht geht.",
      "Erst danach entscheiden Sie.",
    ],
  },
  nichtBehauptet: {
    headline: "Was wir nicht behaupten",
    frage: "Gibt es eine fertige Anbindung an mein Praxisverwaltungssystem?",
    absaetze: [
      "Nein. Eine fertige Standardanbindung an gängige Praxisverwaltungssysteme gibt es bei uns heute nicht. Wir führen deshalb auch keine Liste unterstützter Systeme — sie wäre entweder leer oder unehrlich.",
      "Das ist der Punkt, an dem viele Telefonassistenten scheitern, und wir halten es für falsch, ihn zu verschweigen: Solange keine Anbindung besteht, überträgt Ihr Team das Ergebnis von Hand ins Praxissystem. Die Arbeit ist dann nicht verschwunden, sie ist nur kürzer geworden.",
      "Wenn Ihre Bedingung lautet, dass Termine automatisch in Ihrem System stehen, sind wir heute nicht der richtige Anbieter. Das sagen wir lieber jetzt als nach der Unterschrift.",
    ],
  },
};

/**
 * Datenschutz und Sicherheit (/datenschutz-sicherheit). Aufbau wie
 * /integrationen: was gilt, was wir für Sie klären, was wir nicht behaupten.
 *
 * BINDEND: ausschließlich die fünf vom Inhaber freigegebenen Aussagen. Keine
 * Aussage zu Hosting-Standort, Serverstandort, EU-Verarbeitung oder
 * „DSGVO-konform". Keine TOM-Liste (existiert nicht). Keine Aussage zur
 * DSFA-Pflicht — die Frage ist fachlich umstritten und gehört dem
 * Datenschutzbeauftragten der Praxis.
 */
export const DATENSCHUTZ_SEITE = {
  gilt: {
    headline: "Was gilt",
    frage: "Was passiert mit dem, was am Telefon gesagt wird?",
    absaetze: [
      "Fünf Punkte lassen sich heute belegen. Sie stehen hier vollständig, ohne Zusatz und ohne Auslassung.",
    ],
  },
  klaeren: {
    headline: "Was wir für Sie klären",
    frage: "Was fragt Ihr Datenschutzbeauftragter — und was bekommt er von uns?",
    absaetze: [
      "Ob Ihre Praxis eine Datenschutz-Folgenabschätzung nach Art. 35 DSGVO benötigt, entscheidet Ihr Datenschutzbeauftragter. Diese Frage ist fachlich umstritten, und wir beantworten sie nicht für Sie — wir liefern die Unterlagen zu, mit denen er sie beantworten kann.",
      "Damit dieses Gespräch nicht bei uns anfängt, sondern bei ihm: Das sind die Fragen, die er uns stellen sollte. Stellen Sie sie ruhig wörtlich — sie sind genau die richtigen, und wir beantworten sie schriftlich.",
    ],
    fragen: [
      {
        frage: "Wo werden die Daten verarbeitet, und welche Unterauftragsverarbeiter sind beteiligt?",
        warum: "Bestimmt, ob ein Drittlandtransfer vorliegt und welche Garantien nötig sind.",
      },
      {
        frage: "Liegt für jeden Unterauftragsverarbeiter ein Vertrag nach Art. 28 DSGVO vor?",
        warum: "Ohne lückenlose Kette ist die Auftragsverarbeitung nicht sauber abgebildet.",
      },
      {
        frage: "Was genau wird gespeichert, wie lange, und wann wird gelöscht?",
        warum: "Grundlage für Löschkonzept und Verarbeitungsverzeichnis.",
      },
      {
        frage: "Welche technischen und organisatorischen Maßnahmen sind dokumentiert?",
        warum: "Nachweispflicht nach Art. 32 DSGVO; gehört als Anlage zum AVV.",
      },
      {
        frage: "Wie ist die Schweigepflicht nach § 203 StGB vertraglich abgebildet — auch für Beschäftigte und Unterauftragnehmer?",
        warum: "Gehilfenstellung: Ohne Verpflichtung droht Strafbarkeit auf beiden Seiten.",
      },
      {
        frage: "Wie werden Anrufende darüber informiert, dass ein KI-System spricht?",
        warum: "Transparenzpflicht nach Art. 50 KI-Verordnung.",
      },
    ],
  },
  nichtBehauptet: {
    headline: "Was wir nicht behaupten",
    frage: "Ist der Empfang DSGVO-konform?",
    absaetze: [
      "Diesen Satz schreiben wir nicht. „DSGVO-konform“ ist keine Eigenschaft, die ein Anbieter sich selbst ausstellen kann — konform ist eine Verarbeitung, nicht ein Produkt, und beurteilen kann das nur, wer den konkreten Einsatz in Ihrer Praxis kennt.",
      "Wir machen auch keine Angabe zum Verarbeitungsort und nennen keine Unterauftragsverarbeiter, solange die Verträge dafür nicht abschließend unterzeichnet sind. Eine Aussage über Server, die wir später korrigieren müssten, wäre schlimmer als gar keine.",
      "Eine Liste technischer und organisatorischer Maßnahmen liegt noch nicht in dokumentierter Form vor. Wir führen sie deshalb hier nicht auf — auch nicht in Stichworten, weil eine unvollständige TOM-Liste den Eindruck erweckt, es gäbe eine vollständige.",
      "Was das für Sie heißt: Wenn Ihr Datenschutzbeauftragter diese Punkte vor einer Entscheidung schriftlich braucht, sprechen Sie uns an, bevor Sie weiter planen. Wir sagen Ihnen dann, was wir heute liefern können und was nicht.",
    ],
  },
};

/** M12 · Abschluss-CTA — klein, konkret, umkehrbar. */
export const CTA = {
  primaryLabel: "Unverbindliches Erstgespräch vereinbaren",
  secondaryLabel: "Anliegen-Katalog für Ihre Praxis durchgehen",
  nextStep:
    "Im Erstgespräch gehen wir Ihre typischen Anrufe durch und skizzieren, wie Ihr Empfang am Telefon aussehen könnte. Danach entscheiden Sie in Ruhe — ohne Verpflichtung.",
  // [[CLAIM: Dauer des Erstgesprächs bestätigen — bis dahin ohne Minutenangabe]]
  microcopy: "Kein Verkaufsgespräch, keine Präsentation.",
};

// ─────────────────────────────────────────────────────────────────────────────
// Preis-, Vertrags- und Prozessdaten aus den finalen Inhaber-Antworten
// (A/B/D/E/F, 17.08.2026). Diese Konstanten sind die EINZIGE Quelle für
// Beträge, Kontingente, Fristen und Prozessschritte. Seiten importieren von
// hier — eine Zahl darf nie zweimal getippt werden.
//
// Typografie: geschuetztes Leerzeichen (U+00A0) vor jeder Einheit.
// ─────────────────────────────────────────────────────────────────────────────

export interface Tarif {
  name: string;
  minuten: number;
  /** Ungefähre Anrufzahl — Praxen denken nicht in Minuten (Brief III §5.2). */
  anrufeCa: number;
  monatlich: string;
  /** Obergrenze inklusive Mehrverbrauch. */
  obergrenze: string;
  einrichtung: string;
}

export const TARIFE: Tarif[] = [
  {
    name: "Basis",
    minuten: 500,
    anrufeCa: 250,
    monatlich: "300\u00A0€",
    obergrenze: "500\u00A0€",
    einrichtung: "1.490\u00A0€",
  },
  {
    name: "Praxis",
    minuten: 1000,
    anrufeCa: 500,
    monatlich: "500\u00A0€",
    obergrenze: "800\u00A0€",
    einrichtung: "2.490\u00A0€",
  },
  {
    name: "MVZ",
    minuten: 2000,
    anrufeCa: 1000,
    monatlich: "800\u00A0€",
    obergrenze: "1.400\u00A0€",
    einrichtung: "3.490\u00A0€",
  },
];

/** Vierter Tarif ohne Kachel — bewusst als Fließtextzeile (Inhaber-Entscheidung). */
export const TARIF_ENTERPRISE =
  "Für Verbünde und Mehrstandort-MVZ: Kontingent nach Bedarf, ab 5.000\u00A0€ im Monat.";

/**
 * M10 · Die Deckelung — steht auf der Preisseite VOR der ersten Zahl
 * (Brief III §5.1).
 */
export const DECKELUNG = {
  headline: "Zuerst die Obergrenze, dann der Preis",
  text:
    `Jeder Tarif enthält ein festes Minutenkontingent. ${FAKTEN.deckelung} Mehr zahlen Sie in diesem Monat nicht — eine Grippewelle kann Ihre Rechnung also bewegen, aber nicht sprengen.`,
  hinweis: "Mehr als die ausgewiesene Obergrenze kostet es nie.",
  tarifwechsel:
    "Und Sie bleiben nicht im falschen Tarif sitzen: Liegt Ihr Aufkommen dauerhaft höher, ordnen wir Sie dem Tarif zu, der für Ihren Bedarf am günstigsten ist und nicht dauerhaft an seiner Obergrenze läuft. Wer Monat für Monat den Zuschlag zahlt, zahlt zu viel — dann gehört er in den nächsten Tarif.",
  nichtProBehandler:
    "Abgerechnet wird pro Praxis, nicht pro Behandler. Ob bei Ihnen zwei oder sieben Personen behandeln, ändert am Monatsbetrag nichts.",
};

export const SPRACHEN = {
  headline: "Weitere Sprachen",
  text: "Deutsch ist enthalten. Jede weitere Sprache kostet 79\u00A0€ im Monat; ab drei Sprachen sind es 230\u00A0€ im Monat für bis zu fünf Sprachen gleichzeitig. Der Assistent kann die Sprache mitten im Gespräch wechseln.",
};

/**
 * M17 · Einrichtung Ihres Empfangs — die acht realen Schritte.
 * Dauerangaben liegen nur für Testphase und Go-live vor; erfundene Dauern
 * sind ausgeschlossen (Inhaber-Antwort E).
 */
export const EINRICHTUNG_PROJEKT = {
  headline: "Einrichtung Ihres Empfangs",
  intro:
    "Die Einrichtung ist kein Gebührenposten, sondern ein Projekt mit acht Schritten. Sie zahlen die Hälfte bei Vertragsabschluss und die zweite Hälfte nach dem Go-live.",
  schritte: [
    {
      nummer: "1",
      title: "Erstgespräch",
      dauer: null as string | null,
      text: "Persönlich oder im Videocall. Wir gehen Ihre Praxissituation durch und zeigen an konkreten Beispielen, was der Empfang kann.",
    },
    {
      nummer: "2",
      title: "Angebot",
      dauer: null,
      text: "Sie erhalten ein individuell erstelltes Angebot per E-Mail.",
    },
    {
      nummer: "3",
      title: "Unterschrift",
      dauer: null,
      text: "Online per E-Signatur, ohne App und ohne Zusatzsoftware. Am Handy mit dem Finger, am Rechner mit der Maus.",
    },
    {
      nummer: "4",
      title: "Rechnung und Zugang",
      dauer: null,
      text: "Nach Zahlungseingang erhalten Sie Zugang zum geschützten Kundendashboard: alle Daten, der Vertrag, der Leistungsumfang und die Kündigung mit einem Klick.",
    },
    {
      nummer: "5",
      title: "Ihre Vorgaben",
      dauer: null,
      text: "Ein geführter Ablauf im Dashboard: Stimme, Begrüßungssatz, Anliegen, Regeln, Weiterleitungen. Ihre Angaben gehen direkt an uns.",
    },
    {
      nummer: "6",
      title: "Aufbau",
      dauer: null,
      text: "Ihr Assistent wird auf Basis dieser Angaben gebaut. Nicht ausgewählt, nicht aus einer Vorlage kopiert.",
    },
    {
      nummer: "7",
      title: "Testphase",
      dauer: "2\u00A0Tage",
      text: "Zwei Tage testen wir gemeinsam. Live geht der Assistent erst, wenn Ihre Praxis zufrieden ist.",
    },
    {
      nummer: "8",
      title: "Go-live",
      dauer: `spätestens ${FAKTEN.goLiveFrist} nach Zahlungseingang`,
      text: `Garantiert innerhalb von ${FAKTEN.goLiveFrist} nach Zahlungseingang. ${FAKTEN.zahlungsaufteilung}`,
    },
  ],
};

/**
 * Go-live-Garantie — eigener, ruhig gesetzter Block auf /praxen, der
 * Preisseite und im FAQ (Brief III §3.3). Nie als Aufzählungspunkt.
 */
export const GO_LIVE_GARANTIE = {
  headline: "Die Zwei-Wochen-Garantie",
  text: `${FAKTEN.goLive} Das steht so im Vertrag, nicht nur auf dieser Seite.`,

  /*
    Der Mechanismus gehoert dazu. Eine Frist ohne Folge ist eine Absichts-
    erklaerung; eine Frist mit Geldfolge ist eine Zusage. Der dritte Satz
    benennt, wer das Risiko traegt — das ist der Punkt, an dem diese Garantie
    sich von "wir sind schnell" unterscheidet.
  */
  mechanik: [
    FAKTEN.zahlungsaufteilung,
    "Verpassen wir die Frist, fordern wir die zweite Hälfte nicht ein. Sie müssen dafür nichts geltend machen und keine Nachfrist setzen.",
    "Das Risiko einer Verzögerung liegt damit bei uns — dort, wo wir es beeinflussen können.",
  ],
};

/**
 * Betreuung nach dem Go-live. Der dokumentierte Abbruchgrund im Betrieb ist
 * nicht die Technik, sondern der Support: 52 % nennen unzureichende Betreuung
 * als Wechselgrund (Zi 2026). Dieser Block beantwortet das mit einer Frist und
 * einem Namen statt mit einer Absichtserklaerung.
 */
export const BETREUUNG_NACH_GOLIVE = {
  headline: "Nach dem Go-live hört die Arbeit nicht auf",
  paragraphs: [
    "Ansagen und Regeln ändern sich: nach dem Urlaub, nach einer neuen Sprechzeit, nach der ersten Woche im Betrieb. Genau dann entscheidet sich, ob ein solches System im Alltag bleibt oder wieder abgeschaltet wird.",
    FAKTEN.aenderungen,
    "Zugesagt, nicht in Aussicht gestellt. Umgesetzt werden die Änderungen von Lazar Popovic persönlich, erreichbar täglich von 6 bis 20 Uhr — nicht von einem Ticketsystem und nicht von wechselnden Ansprechpartnern.",
  ],
};

/**
 * M14 · Die Übergabe — der dokumentierte Abbruchgrund Nr. 1. Beschreibt den
 * heutigen Weg ohne Beschönigung (Inhaber-Antwort B).
 */
export const UEBERGABE = {
  headline: "Und wer tippt das dann bei Ihnen ein?",
  paragraphs: [
    "Der übliche Weg sieht so aus: Der Assistent nimmt den Anruf an, und Ihre MFA überträgt das Ergebnis anschließend von Hand ins Praxissystem. Das ist der Grund, warum viele Praxen solche Systeme nach wenigen Wochen wieder abschalten — die Arbeit ist nicht verschwunden, sie ist nur umgezogen.",
    "Wir prüfen vor der Einrichtung, welche Schnittstelle Ihr System bietet, und bauen die Übergabe darauf auf. Wo eine Anbindung technisch möglich ist, landet das Anliegen direkt dort, wo Sie ohnehin arbeiten. Wo sie nicht möglich ist, sagen wir Ihnen das vorher — und nicht nach der Unterschrift.",
  ],
  wasAnkommt: {
    headline: "Was nach jedem Anruf im Dashboard steht",
    items: ["Anliegen", "Name", "Rückrufnummer", "Terminwunsch"],
    hinweis:
      "Strukturiert, nicht als Audiodatei — Gespräche werden nicht aufgezeichnet.",
  },
  // [[ASSET: Screenshot des Dashboards nach einem Anruf — Spezifikation in
  // ASSETS-REQUIRED.md. Bis zur Lieferung bleibt der Bild-Slot ungerendert.]]
};

/**
 * M18 · Betreuung — Antwort auf den dokumentierten Abbruchgrund (52 % nennen
 * unzureichenden Support als Wechselgrund, Zi 2026).
 */
export const BETREUUNG = {
  headline: "Wer sich kümmert, wenn Sie etwas ändern wollen",
  person: {
    name: "Lazar Popovic",
    rolle: "Gründer und Leiter",
    // [[ASSET: Foto Lazar Popovic — vom Inhaber freigegeben, public/Lazar_Popovic.png]]
    bildAlt: "Lazar Popovic, Gründer und Leiter von Cogniiq",
  },
  text: "Sie sprechen mit einer Person, nicht mit einem Ticketsystem und nicht mit einem wechselnden Support-Team.",
  fakten: [
    { label: "Erreichbar", wert: FAKTEN.erreichbarkeit },
    { label: "Antwort", wert: FAKTEN.antwortzeit },
    {
      label: "Änderungen an Ansagen und Regeln",
      wert: `eingereicht über das Kundendashboard oder per E-Mail, umgesetzt innerhalb von ${FAKTEN.aenderungTage}\u00A0Tagen`,
    },
  ],
};

/**
 * M19 · Umkehrbarkeit — kompakter Faktenblock, keine Marketingsprache.
 * Die Testphase liegt nach Vertragsabschluss und Zahlung der ersten Hälfte;
 * das wird ausdrücklich gesagt (Inhaber-Vorgabe).
 */
export const UMKEHRBARKEIT = {
  headline: "Wie Sie wieder herauskommen",
  fakten: [
    {
      label: "Laufzeit",
      wert: FAKTEN.laufzeit,
    },
    {
      label: "Kündigung",
      wert: FAKTEN.kuendigung,
    },
    { label: "Preisgarantie", wert: FAKTEN.preisgarantie },
    {
      label: "Testphase",
      wert: "2\u00A0Tage, nach Vertragsabschluss und Zahlung der ersten Hälfte. Live geht der Empfang erst, wenn Sie zufrieden sind",
    },
  ],
  vetorecht:
    `Die Testphase ist kein kostenloser Test. Sie ist der Punkt, an dem Sie ein Vetorecht haben: Ohne Ihre Freigabe geht der Empfang nicht live, und halten wir die ${FAKTEN.goLiveFrist} nicht ein, entfällt die zweite Hälfte der Einrichtungsgebühr.`,
  // [[CLAIM: Was mit den gespeicherten Ergebnissen nach Vertragsende geschieht,
  // ist nicht beantwortet (Brief II §4.7). Bis dahin keine Aussage dazu.]]
};

/** Verankerung — sachlich, ohne Ersparnisbehauptung (Brief III §3.4). */
export const PERSONALKOSTEN_ANKER = {
  text: "Zum Vergleich, ohne daraus eine Ersparnis abzuleiten: Das Tarifgehalt für Medizinische Fachangestellte beginnt 2026 bei 2.939,59\u00A0€ monatlich, zuzüglich Arbeitgeberkosten.",
  source: "Gehaltstarifvertrag MFA (Virchowbund), 2026",
};

/**
 * Was nicht extra kostet — ausdrücklich benennen. 46 % nennen versteckte
 * Preissteigerungen als Wechselgrund (Zi 2026), also wird die Gegenliste
 * genauso konkret wie die Preisliste (Brief III §5.7).
 */
export const NICHT_EXTRA = {
  headline: "Was nicht extra kostet",
  intro:
    "Diese Posten tauchen auf keiner Rechnung auf, weil sie im Monatsbetrag enthalten sind:",
  punkte: [
    `Änderungen an Ansagen, Anliegen und Regeln — unbegrenzt, umgesetzt innerhalb von ${FAKTEN.aenderungTage}\u00A0Tagen`,
    `Ihr fester Ansprechpartner, erreichbar ${FAKTEN.erreichbarkeit}, Antwort ${FAKTEN.antwortzeit}`,
    `${FAKTEN.gleichzeitigeAnrufe} gleichzeitige Anrufe in jedem Tarif — auch im kleinsten`,
    "Deutsch als Sprache",
    "Der Auftragsverarbeitungsvertrag nach Art. 28 DSGVO",
    "Die zwei Tage Testphase, sie sind Teil der Einrichtung",
    "Das Kundendashboard mit Vertrag, Leistungsumfang und Kündigung",
    "Jede weitere behandelnde Person in Ihrer Praxis",
  ],
};

/** Vertragsrahmen als kompakter Faktenblock für die Preisseite. */
export const VERTRAG = {
  headline: "Laufzeit, Kündigung und Preisgarantie",
  fakten: [
    {
      label: "Laufzeit",
      wert: FAKTEN.laufzeit,
    },
    {
      label: "Kündigung",
      wert: FAKTEN.kuendigung,
    },
    {
      label: "Preisgarantie",
      wert: `${FAKTEN.preisgarantie} Innerhalb dieser Zeit ändert sich Ihr Monatsbetrag nicht.`,
    },
    {
      label: "Zahlung der Einrichtung",
      wert: "50\u00A0% bei Vertragsabschluss, 50\u00A0% nach dem Go-live.",
    },
  ],
};

/**
 * Copy des Praxis-Rechners (COPY-BRIEF-3 §6). Die Zahlen des Rechners kommen
 * aus TARIFE; hier stehen ausschließlich die Texte.
 *
 * Zum Automatisierungsgrad: Voreingestellt sind 90\u00A0% — der Anteil der Anrufe,
 * den der Assistent nach Angabe des Inhabers (18.08.2026) vollständig übernimmt.
 * Der Wert ist im Rechner frei einstellbar.
 *
 * [[CLAIM: verify — gemessene Übernahmequote (OWNER-INPUT F4). Die Zahl steht als
 * Vorgabewert vor jedem Besucher und ist damit eine Aussage über das eigene
 * Produkt. Diese Zielgruppe prüft solche Zahlen nach; ohne Beleg ist sie das
 * größte Einzelrisiko auf der Preisseite.]]
 */
export const RECHNER = {
  headline: "Was spart eine Praxis durch einen KI Telefonassistenten?",
  intro:
    "Stellen Sie die Regler auf Ihre Praxis ein. Der Rechner trennt bewusst zwei Dinge, die oft in einer Zahl verschwinden: wie viele Anrufe überhaupt angenommen werden — und wie viel Bearbeitungszeit dabei tatsächlich eingespart wird. Das ist nicht dasselbe.",
  rahmung:
    "Der Rechner ist auf einen Automatisierungsgrad von 90\u00A0% voreingestellt und zieht unsere eigenen Kosten ab — Monatspreis und Einrichtung. Stellen Sie den Grad auf den Wert ein, den Sie für Ihre Praxis für realistisch halten; der Rechenweg bleibt vollständig nachvollziehbar.",
  label: "Rechnung mit Ihren Angaben — keine Zusage.",
  anbindungsHinweis:
    "Der Wert steigt, wo eine Anbindung an Ihr Praxisverwaltungssystem möglich ist: Dann entfällt auch das Übertragen von Hand. Was für Ihr System geht, prüfen wir vor dem Angebot.",
  stundenkostenQuelle:
    "Vorschlagswert abgeleitet aus dem MFA-Tarifgehalt 2026 (ab 2.939,59\u00A0€ brutto im Monat) bei angenommenen 38,5 Wochenstunden — ohne Arbeitgeberkosten. Passen Sie den Wert an Ihre Praxis an.",
  stundenkostenSource: "Gehaltstarifvertrag MFA (Virchowbund), 2026",
  startwertHinweis:
    "Alle Startwerte sind frei gewählte Beispiele, keine Branchenstatistik.",
  terminwertLabel: "Was ist Ihnen ein gewonnener Termin wert?",
  terminwertKontext:
    "Der wirtschaftliche Nutzen liegt meist nicht in der eingesparten Zeit, sondern in den Anrufen, die heute gar nicht ankommen. Was ein gewonnener Termin für Ihre Praxis wert ist, wissen nur Sie — deshalb rechnen wir diesen Teil nicht ohne Ihre Angabe.",
  terminwertLeer:
    "Solange dieses Feld leer bleibt, bleibt dieser Teil der Rechnung leer. Wir setzen hier keinen typischen Wert ein.",
};

// ─────────────────────────────────────────────────────────────────────────────
// KOMPAKTFASSUNGEN für die drei Stadtseiten (Inhaber-Entscheidung „Option A“,
// 18.08.2026).
//
// Warum kompakt und nicht vollständig: Die Stadtseite soll lokal sein. Die
// Tiefe liegt auf /praxen. Die vollständige Beweiskette auf die Stadtseiten zu
// kopieren, brächte je Seite rund 9.700 Zeichen geteilten Text und drückte alle
// drei unter die 40-%-Schwelle für einzigartigen Inhalt — verdünnter
// Unique-Anteil ist genau das Muster, das Stadtseiten abgewertet werden lässt.
//
// BINDEND: Diese Fassungen formulieren nichts neu. Jeder Satz kommt aus FAKTEN,
// SAEULEN, DATENSCHUTZ_PUNKTE oder UMKEHRBARKEIT. Wer hier einen eigenen String
// einsetzt, erzeugt genau die zweite Wahrheitsquelle, die HONESTY-AUDIT §7
// beschreibt.
// ─────────────────────────────────────────────────────────────────────────────

export interface KompaktBlock {
  /** Welches Modul verkürzt wird — für Wartung, nicht für die Anzeige. */
  modul: string;
  headline: string;
  /** Ziel der Vollversion. Jede Kompaktfassung verweist auf genau eine Seite. */
  mehr: { label: string; href: string };
}

/** M4 · Die vier Säulen — Titel ohne die vier Absätze. */
export const KOMPAKT_SAEULEN: KompaktBlock & { punkte: string[] } = {
  modul: "M4",
  headline: "Was wir konkret anders machen",
  // Alle vier Säulen, weil P1–P4 zusammen die Positionierung tragen; verkürzt
  // wird die Beschreibung, nicht die Zahl der Säulen.
  punkte: SAEULEN.map((saeule) => saeule.title),
  mehr: {
    label: "Die vier Säulen mit der Mechanik dahinter",
    href: "/praxen",
  },
};

/** M10 · Planbare Kosten — die Deckelungsaussage, sonst nichts. */
export const KOMPAKT_KOSTEN: KompaktBlock & { text: string } = {
  modul: "M10",
  headline: "Ein Kontingent, ein Preis, eine Obergrenze",
  text: FAKTEN.deckelung,
  mehr: {
    label: "Alle Tarife, Kontingente und Obergrenzen",
    href: "/kosten-ki-telefonassistent",
  },
};

/** M19 · Umkehrbarkeit — Laufzeit und Kündigung, ohne Testphase und Vetorecht. */
export const KOMPAKT_UMKEHRBARKEIT: KompaktBlock & {
  fakten: Array<{ label: string; wert: string }>;
} = {
  modul: "M19",
  headline: "Wie Sie wieder herauskommen",
  fakten: UMKEHRBARKEIT.fakten.slice(0, 2),
  mehr: {
    label: "Testphase, Vetorecht und Preisgarantie im Detail",
    href: "/praxen",
  },
};

/** M7 · Datenschutz in drei Punkten — die drei belegbaren Aussagen. */
export const KOMPAKT_DATENSCHUTZ: KompaktBlock & { punkte: string[] } = {
  modul: "M7",
  headline: "Datenschutz in drei Punkten",
  punkte: DATENSCHUTZ_PUNKTE.slice(0, 3),
  mehr: {
    label: "Was Ihr Datenschutzbeauftragter fragen sollte",
    href: "/datenschutz-sicherheit",
  },
};

/**
 * M20 · Patientensicht — der Wiedererkennungsabsatz, ohne den zweiten Absatz
 * und ohne die Statistik. Beides bleibt auf /praxen.
 */
export const KOMPAKT_PATIENTEN_SICHT: KompaktBlock & { text: string } = {
  modul: "M20",
  headline: PATIENTEN_SICHT.headline,
  text: PATIENTEN_SICHT.paragraphs[0],
  mehr: {
    label: "Was Unerreichbarkeit Ihre Praxis kostet",
    href: "/praxen",
  },
};

/**
 * M8 · Anliegen-Katalog — drei Beispiele statt der vollständigen Doppelliste.
 * Die Grenzen stehen auf denselben Seiten ohnehin voll in M15.
 */
export const KOMPAKT_ANLIEGEN: KompaktBlock & { punkte: string[] } = {
  modul: "M8",
  headline: "Was der Empfang übernimmt",
  punkte: ANLIEGEN_UEBERNIMMT.slice(0, 3),
  mehr: {
    label: "Der vollständige Katalog — auch, was immer bei einem Menschen landet",
    href: "/praxen",
  },
};

/** M21 · Für Ihr Team — der Absatz, ohne die sechs Punkte. */
export const KOMPAKT_TEAM: KompaktBlock & { text: string } = {
  modul: "M21",
  headline: TEAM_BLOCK.headline,
  text: TEAM_BLOCK.text,
  mehr: {
    label: "Was sich für Ihr Team konkret ändert",
    href: "/praxen",
  },
};

/**
 * M17 · Einrichtung — Rahmen und die acht Schritttitel, ohne die
 * Beschreibungen. Der Beweis ist, dass es acht benannte Schritte gibt.
 */
export const KOMPAKT_EINRICHTUNG: KompaktBlock & {
  intro: string;
  schritte: string[];
} = {
  modul: "M17",
  headline: EINRICHTUNG_PROJEKT.headline,
  intro: EINRICHTUNG_PROJEKT.intro,
  schritte: EINRICHTUNG_PROJEKT.schritte.map((schritt) => schritt.title),
  mehr: {
    label: "Jeder Schritt im Einzelnen, mit Dauer",
    href: "/praxen",
  },
};
