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
      // [[CLAIM: verify — Rufumleitung auf die bestehende Rufnummer, Kompatibilität
      // der Telefonanlage (OWNER-INPUT B4 weiterhin unbeantwortet)]]
      "Jeder Tarif enthält ein festes Minutenkontingent. Wird es überschritten, kostet jede weitere Minute 0,39 € — und Ihre Monatsrechnung übersteigt nie den nächsthöheren Tarif. Eine Grippewelle kann Ihre Rechnung also bewegen, aber nicht sprengen. Der Preis ist für 24 Monate garantiert, und abgerechnet wird nicht pro Behandler.",
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
      "Viele Systeme am Markt werden einmal eingerichtet und dann sich selbst überlassen. Ändern sich Sprechzeiten oder Abläufe, veraltet die Konfiguration. Bei uns reichen Sie eine Änderung über Ihr Kundendashboard oder per E-Mail ein; umgesetzt ist sie innerhalb von 3 Tagen — von einem festen Ansprechpartner, nicht von einem Ticketsystem.",
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
      "Zwei Tage testen wir gemeinsam. Live geht der Assistent erst, wenn Ihre Praxis zufrieden ist — spätestens 7 Tage nach Zahlungseingang.",
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
    "Änderungen an Ansagen und Regeln reichen Sie über das Kundendashboard oder per E-Mail ein; umgesetzt sind sie innerhalb von 3 Tagen",
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
  "Es wird kein Gespräch aufgezeichnet. Gespeichert wird ausschließlich das strukturierte Ergebnis: Anliegen, Name, Rückrufnummer, Terminwunsch",
  "Ihre Daten werden nicht zum Training von Modellen verwendet",
  "Der Assistent gibt sich zu Beginn jedes Anrufs als KI-System zu erkennen (Art. 50 KI-Verordnung). Ihre Patientinnen und Patienten wissen von der ersten Sekunde an, mit wem sie sprechen — abschalten lässt sich das nicht",
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
  text: "Jeder Tarif enthält ein festes Minutenkontingent. Wird es überschritten, kostet jede weitere Minute 0,39 € — und Ihre Monatsrechnung übersteigt nie den nächsthöheren Tarif. Abgerechnet wird pro Praxis, nicht pro Behandler. Einmalig kommt die Einrichtung Ihres Empfangs dazu; sie steht vor Vertragsschluss im Angebot. Der Preis ist für 24 Monate garantiert.",
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
    "Es gibt heute keine fertige Standardanbindung an Praxisverwaltungssysteme. Das Ergebnis eines Anrufs steht strukturiert im Cogniiq-Dashboard; den Übertrag ins Praxissystem macht Ihr Team, solange für Ihre Software keine Schnittstelle möglich ist. Was für Ihr System geht, prüfen wir vor dem Angebot.",
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
    value: "39 %",
    text: "der Versicherten bewerten die Erreichbarkeit von Praxen außerhalb der Öffnungszeiten als schwierig.",
    source: "GKV-Spitzenverband, Versichertenbefragung 2025",
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
