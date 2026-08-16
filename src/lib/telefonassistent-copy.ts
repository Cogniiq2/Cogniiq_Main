// ─────────────────────────────────────────────────────────────────────────────
// Wiederverwendbare Copy-Module für das KI-Telefonassistent-Cluster.
//
// Quelle: Master-Brief "Cogniiq Website Copy Overhaul (Evidence-Driven)".
// Diese Bausteine (M1–M12 im Brief) sind die kanonische Fassung der
// Kernaussagen. Seiten-Configs importieren von hier, statt Prosa zu
// kopieren — so bleiben Säulen, Prozess und Datenschutz-Fakten wartbar.
//
// Regeln, die für jeden String hier gelten:
// - Deutsch, Sie-Form, keine Ausrufezeichen im Fließtext.
// - Keine erfundenen Zahlen; Statistiken nur aus der freigegebenen Liste
//   (Zi 2024/2026, vzbv 2025, GKV-Spitzenverband 2025, Virchowbund 2026),
//   immer mit Quelle und Jahr im sichtbaren Text.
// - Begrenzte, ehrliche Aussagen: Entlastung zu Stoßzeiten und außerhalb
//   der Öffnungszeiten — nie "alle Anrufe", nie Prozent-Ersparnisse.
// - Notfälle: Erkennen und sofort weiterleiten, niemals einschätzen.
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
      "Begrüßung, Ansagen und Tonfall werden auf Ihren Betrieb abgestimmt. Auf Wunsch verwenden wir Ihre eigenen, selbst aufgesprochenen Ansagen. Anrufer erfahren zu Beginn transparent, dass ein Sprachassistent sie betreut — und können jederzeit zu einem Menschen wechseln.",
  },
  {
    title: "Die Übergabe kommt dort an, wo Sie arbeiten",
    description:
      "Jedes Gespräch endet in einer strukturierten Zusammenfassung: Anliegen, Rückrufnummer, gewünschter Termin, nächster Schritt. Ihr Team liest das Ergebnis dort, wo es ohnehin arbeitet — kein Zettel, kein Abtippen, kein Hin- und Herspringen zwischen Systemen.",
  },
  {
    title: "Planbare Kosten, kein Systemwechsel",
    description:
      "Feste monatliche Kosten statt Abrechnung pro Anruf. Ihre Rufnummer bleibt, Ihre Telefonanlage bleibt, Ihr Kalender bleibt. Der Assistent ergänzt Ihre bestehende Arbeitsweise, statt einen Plattformwechsel zu verlangen.",
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
      "Der übliche Weg: Das Gespräch endet in einer E-Mail oder einer Sprachnachricht, und jemand tippt alles von Hand ab. Aus Entlastung wird Mehrarbeit. Deshalb behandeln wir die Übergabe als Kern des Produkts, nicht als Zusatzfunktion.",
  },
  {
    title: "Die Stimme klang nach Maschine",
    description:
      "Starre Menüs und synthetische Ansagen führen dazu, dass Anrufer auflegen oder sich beschweren. Wir stimmen Stimme und Ansagen auf Ihren Betrieb ab — auf Wunsch mit Ihren eigenen Aufnahmen — und testen vor dem Start mit echten Szenarien.",
  },
  {
    title: "Niemand hat das System an den Betrieb angepasst",
    description:
      "Viele Systeme am Markt werden einmal eingerichtet und dann sich selbst überlassen. Ändern sich Sprechzeiten oder Abläufe, veraltet die Konfiguration. Bei uns gehören Anpassungen zum laufenden Betrieb — mit festem Ansprechpartner statt Ticketsystem.",
  },
];

/** M5 · So wird Ihr Empfang gebaut — der Personalisierungsprozess. */
export const EINRICHTUNG_SCHRITTE: Array<{
  step: string;
  title: string;
  description: string;
}> = [
  {
    step: "01",
    title: "Aufnahmegespräch",
    description:
      "Wir gehen Ihre typischen Anrufe durch: Welche Anliegen kommen täglich, welche zu Stoßzeiten, was darf der Assistent erledigen, was gehört immer in menschliche Hände.",
  },
  {
    step: "02",
    title: "Anliegen-Katalog und Regeln",
    description:
      "Für jeden Anrufanlass wird festgelegt, was passiert: direkt bearbeiten, strukturiert aufnehmen oder sofort weiterleiten. Notfall-Hinweise führen immer und ohne Umweg zu einem Menschen oder zur Notrufansage.",
  },
  {
    step: "03",
    title: "Stimme und Ansagen",
    description:
      "Begrüßung und Ansagen werden formuliert und abgestimmt — auf Wunsch mit Ihren eigenen Aufnahmen. Sie hören den Assistenten, bevor ein einziger echter Anruf ankommt.",
  },
  {
    step: "04",
    title: "Testphase mit echten Szenarien",
    description:
      "Vor dem Start rufen wir gemeinsam an: Terminwunsch, Stornierung, unklares Anliegen, Notfall-Formulierung. Was nicht sitzt, wird angepasst — erst dann geht der Assistent live.",
  },
  {
    step: "05",
    title: "Laufende Anpassung",
    description:
      "Nach dem Start werten wir Gesprächsverläufe mit Ihnen aus und passen Regeln und Ansagen an. Öffnungszeiten und Urlaubsansagen pflegen Sie selbst — ohne Support-Anruf.",
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
    "Keine doppelte Erfassung: Anliegen kommen strukturiert an, nicht als Notizzettel",
    "Rückrufliste statt Daueralarm: abarbeiten, wenn es in den Ablauf passt",
    "Ihr Team behält die Kontrolle — Regeln und Ansagen lassen sich jederzeit ändern",
    // [[CLAIM: verify — Einweisung des Teams: wer, wie lange (OWNER-INPUT D/E)]]
    "Die Einweisung gehört zur Einrichtung: Ihr Team sieht vor dem Start, wo Einträge ankommen und wie Ansagen geändert werden",
    "Öffnungszeiten und Urlaubsansagen ändert Ihr Team selbst über ein Dashboard — ohne Anruf beim Support",
  ],
};

/** M7 · Datenschutz in konkreten Punkten — sachlich, ohne Rechtsberatung. */
export const DATENSCHUTZ_PUNKTE: string[] = [
  "Auftragsverarbeitungsvertrag nach Art. 28 DSGVO gehört zur Einrichtung — kein Zusatzposten, kein Sonderwunsch",
  "Verarbeitung auf europäischen Servern; Gespräche werden als strukturierte Zusammenfassung übergeben, nicht als Rohaudio gespeichert, sofern Sie das nicht ausdrücklich wünschen",
  "Anrufer erfahren zu Gesprächsbeginn, dass ein Sprachassistent sie betreut (Transparenzpflicht nach Art. 50 KI-Verordnung) — und können jederzeit einen Menschen verlangen",
  "Ob Ihre Praxis eine Datenschutz-Folgenabschätzung benötigt, entscheidet Ihr Datenschutzbeauftragter — wir liefern die Dokumentation zu, statt die Frage für Sie zu beantworten",
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
  headline: "Feste monatliche Kosten, keine Abrechnung pro Anruf",
  text: "Sie zahlen einen festen Monatsbetrag für einen definierten Leistungsumfang. Ein starker Montagmorgen oder eine Grippewelle verändert Ihre Rechnung nicht. Was einmalig anfällt — etwa die Einrichtung — steht vor Vertragsschluss schriftlich im Angebot.",
};

/**
 * M15 · Was unser Empfang nicht macht — benannte Grenzen als normaler
 * Abschnitt, nicht im FAQ versteckt. Bewusst unbequem; nicht abschwächen.
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
    // [[CLAIM: verify — Liste der heute noch nicht angebundenen Systeme (OWNER-INPUT B1–B3) ergänzen, sobald sie vorliegt]]
    "Nicht jedes System ist heute anbindbar. Was für Ihre Software möglich ist, prüfen wir vor dem Angebot – und sagen Ihnen auch, was (noch) nicht geht.",
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
    "Sie erwarten, dass die Telefonie vollständig ohne Ihr Team läuft. Der Assistent entlastet – er ersetzt keine Anmeldung und keine fachliche Entscheidung.",
    "Ihr Anrufaufkommen ist sehr gering und Ihr Team gut erreichbar. Dann löst der Assistent kein Problem, das Sie haben – und ein System ohne Problem ist nur ein Kostenpunkt.",
    "Sie möchten, dass Anrufer nicht erfahren, dass ein Sprachassistent spricht. Diese Transparenz ist für uns nicht verhandelbar – rechtlich wie inhaltlich.",
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
    value: "39 %",
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
};
