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
  /** Numerischer Zwilling von `mehrpreisProMinute` — für Rechenlogik, damit
   *  niemand den Anzeigestring zurück in eine Zahl parsen muss. Gegen den
   *  String abgesichert in `telefonassistent-copy.test.ts`. */
  mehrpreisProMinuteEur: 0.39,
  /*
    Korrigiert am 23.08.2026 von 7 auf 14 (Inhaber).

    Kanonische Bedeutung: 14 KALENDERTAGE ab dem Start, und sie laufen bis zur
    UEBERGABE ZUR FREIGABE — nicht bis zum Go-live.

    An diesem Punkt zerbrach die alte Fassung logisch: Sie garantierte einen
    Live-Termin und raeumte im selben Atemzug ein unbefristetes Freigaberecht
    ein ("ohne Ihre Freigabe geht der Empfang nicht live"). Beides zusammen ist
    nicht erfuellbar — ein Kunde, der drei Wochen prueft, haette die Frist
    gerissen, die wir uns selbst gesetzt haben, und dafuer die zweite Haelfte
    der Einrichtungsgebuehr einbehalten koennen. Zugesagt wird deshalb nur, was
    allein in unserer Hand liegt: der fertig eingerichtete, testbereite Empfang.
  */
  einrichtungsfristTage: 14,
  /** Sprachform der Frist. In Fliesstext immer diese, nie "14 Tage". */
  einrichtungsfrist: "zwei Wochen",
  aenderungTage: 3,
  laufzeitMonate: 12,
  preisgarantieMonate: 24,
  monatlichAufschlag: `20\u00A0%`,
  erreichbarkeit: "täglich 6–20\u00A0Uhr",
  antwortzeit: "spätestens innerhalb von 24\u00A0Stunden",
  /*
    GLEICHZEITIGE ANRUFE — eingefroren, nicht bestätigt. Stand 11.09.2026.

    Die 10 stammen aus der Inhaber-Antwort zu Abschnitt B. Die Recherche zum
    Kapazitätsanbieter (ElevenAgents, offizielle Preisseite, 11.09.2026) zeigt
    aber: Die Gleichzeitigkeit ist dort eine WORKSPACE-Grenze, die sich ALLE
    Agenten eines Kontos teilen — Free 4, Starter 6, Creator 10, Pro 20,
    Scale 30, Business 40, Enterprise nach Vereinbarung. Eine Konto-Obergrenze
    von 10 ist damit keine Zusage von 10 Gesprächen JE KUNDE, sobald mehr als
    ein Kunde gleichzeitig telefoniert; sie wäre es nur bei einer eigenen
    Umgebung je Kunde oder einer vertraglich reservierten Kapazität. Weder das
    eine noch das andere ist im Repository dokumentiert: Das Onboarding erfasst
    eine Agent-ID und eine Umgebung (EU/US), aber kein Kapazitäts- oder
    Tarifmerkmal.

    Konsequenz, bis der Inhaber die Bereitstellung bestätigt (OWNER-INPUT B11):
      • Auf allen NICHT eingefrorenen Flächen steht `gleichzeitigeAnrufeSatz` —
        eine Aussage ohne Zahl, die in jedem Fall stimmt.
      • Diese Zahl wird NUR noch von `NICHT_EXTRA` verwendet, und das steht
        ausschließlich auf der eingefrorenen Kostenseite. Sie wird dort nicht
        angefasst, weil deren gerenderte Bytes die Messbedingung eines
        laufenden Experiments sind — und nicht, weil sie belegt wäre.
      • Sobald das Experiment endet, ist diese Zahl entweder belegt oder sie
        verschwindet auch dort.
  */
  gleichzeitigeAnrufe: 10,

  /*
    Die belastbare Fassung: Sie sagt zu, was in jeder Bereitstellung gilt —
    mehrere Gespräche zur selben Zeit statt eines Besetztzeichens — und
    verspricht keine Zahl, die von einer Konto-Obergrenze abhängt. Bewusst auch
    KEIN „kein Anruf geht verloren": Ob Überlauf, Warteschlange oder
    Rückfallnummer eingerichtet sind, hängt am Setup (OWNER-INPUT B9/B11).
  */
  gleichzeitigeAnrufeSatz:
    "Mehrere Anrufe zur selben Zeit — die Kapazität wird auf Ihr Aufkommen ausgelegt und im Angebot ausgewiesen.",
  /** Kurzform für Aufzählungen und Merkmalslisten. */
  gleichzeitigeAnrufeKurz: "Mehrere Anrufe zur selben Zeit",

  // ── Sätze, die wörtlich wiederverwendet werden ──
  /** Deckelung. Nennt die Obergrenzen einzeln, weil die Regel „nie mehr als der
   *  nächsthöhere Tarif" für MVZ nicht trägt (dort 1.400 €, Enterprise ab 5.000 €). */
  deckelung: `Über dem Minutenkontingent kostet jede weitere Minute 0,39\u00A0€. Nach oben ist jeder Tarif auf seine ausgewiesene Obergrenze gedeckelt: Basis auf 500\u00A0€ im Monat, Praxis auf 800\u00A0€, MVZ auf 1.400\u00A0€.`,

  /*
    WORAUF SICH DIE OBERGRENZE BEZIEHT — Korrektur vom 12.09.2026.

    `deckelung` (oben) beschreibt die Regel korrekt: Der TARIF ist gedeckelt.
    Daraus wurde an mehreren Stellen ein Satz über die GESAMTRECHNUNG —
    „Mehr zahlen Sie in diesem Monat nicht", „Mehr als die ausgewiesene
    Obergrenze kostet es nie". Das ist zu weit: Die Preislogik deckelt
    nachweislich Grundpreis plus Mehrverbrauch. Ob Zusatzsprachen, der
    Aufschlag für monatliche Kündbarkeit und individuell vereinbarte
    Anbindungskosten INNERHALB dieser Grenze liegen, sagt unsere eigene
    Quelle nicht — der Rechner weist sie deshalb seit jeher als eigene
    Positionen aus, während die Prosa sie stillschweigend mit eingeschlossen
    hat. Zwei Flächen, zwei Aussagen, und die großzügigere stand im Fließtext.

    `deckelungGeltung` benennt den Geltungsbereich, ohne die Gegenbehauptung
    aufzustellen: Es steht hier NICHT, dass die Zusatzposten außerhalb der
    Obergrenze liegen — auch das gäbe die Quelle nicht her. Es steht, dass
    die Telefonie-Obergrenze allein die Endsumme nicht festlegt und das
    Angebot die offenen Positionen schließt.
  */
  deckelungGeltung:
    "Gedeckelt ist damit der Telefoniepreis — Grundpreis plus Mehrverbrauch. Zusatzsprachen, der Aufschlag für monatliche Kündbarkeit sowie individuell vereinbarte Integrations- oder Drittanbieterkosten weisen wir separat aus, soweit sie anfallen; ob sie in die Obergrenze fallen, legt Ihr Angebot fest. Die Telefonie-Obergrenze allein ist deshalb noch nicht Ihre Endsumme.",

  /** Kurzform für Kacheln und Tabellen: nennt den Bezug mit, in vier Wörtern. */
  deckelungKurz: "Telefonie gedeckelt: Grundpreis + Mehrverbrauch",

  /** Tarifzuordnung. Beschreibt nicht nur den Rechner, sondern die Zusage an den
   *  Kunden — siehe COPY-CLAIMS-TO-VERIFY F10. */
  tarifzuordnung:
    "Liegt Ihr Aufkommen dauerhaft höher, ordnen wir Sie dem Tarif zu, der für Ihren Bedarf am günstigsten ist und nicht dauerhaft an seiner Obergrenze läuft — Sie zahlen den Zuschlag also nicht Monat für Monat.",

  nichtProBehandler:
    "Abgerechnet wird pro Praxis, nicht pro Behandler.",

  /*
    Die Zusage nennt zuerst die Frist, dann die Folge, in zwei kurzen Saetzen.
    Eine Garantie, die erklaert werden muss, wirkt nicht wie eine Garantie.
    Zugesagter Meilenstein ist die Uebergabe zur Freigabe, nicht der Go-live:
    der Go-live haengt an einer Freigabe, die allein der Kunde erteilt und fuer
    die er sich so viel Zeit nehmen darf, wie er moechte. Eine Frist mit
    Geldfolge darf nur das umfassen, was wir selbst liefern.
  */
  uebergabeGarantie: `Spätestens zwei Wochen nach dem Start ist Ihr KI-Empfang vollständig eingerichtet und bereit für Ihre Freigabe. Halten wir diesen Termin nicht ein, entfällt die zweite Hälfte der Einrichtungsgebühr.`,

  /*
    Der Fristbeginn ist eine eigene Aussage, weil er der Punkt ist, an dem die
    Garantie kippen kann. Beide Bedingungen muessen erfuellt sein: Geldeingang
    UND vollstaendige Angaben. Eine Frist, die ab Zahlungseingang allein laeuft,
    macht uns fuer Verzoegerungen haftbar, die der Kunde selbst verursacht —
    Schritt 5 der Einrichtung ("Ihre Vorgaben") liegt vollstaendig bei ihm.
  */
  startDefinition: `Der Start ist der Tag, an dem die erste Hälfte der Einrichtungsgebühr eingegangen ist und uns alle für die Einrichtung erforderlichen Angaben vollständig vorliegen.`,

  /*
    Der Satz, der die Garantie widerspruchsfrei macht: Was wir zusagen, endet an
    der Uebergabe; was danach kommt, entscheidet der Kunde. Steht ueberall dort,
    wo die Frist genannt wird — sonst liest sich die Frist wieder als Live-Termin.
  */
  freigabeNachUebergabe: `Nach der Übergabe testen Sie den Empfang in Ruhe. Live geschaltet wird erst nach Ihrer Freigabe.`,

  /** Macht explizit, dass die Pruefzeit des Kunden in keine Richtung zaehlt:
   *  nicht als Verzug bei uns, nicht als Versaeumnis bei ihm. */
  pruefzeitNeutral: `Wie lange Sie prüfen, entscheiden Sie. Ihre Prüfzeit zählt weder als Verzögerung auf unserer Seite noch als Versäumnis auf Ihrer.`,

  /** Keine Antragspflicht — das ist der Teil, der die Zusage glaubwuerdig macht. */
  garantieOhneAntrag: `Sie müssen dafür nichts geltend machen und keine Nachfrist setzen: Wir stellen die zweite Hälfte dann einfach nicht in Rechnung.`,

  /*
    Fairness in beide Richtungen. Bewusst NUR kundenseitige Abhaengigkeiten, die
    nach dem Start neu entstehen: Dienstleister, die wir selbst auswaehlen, sind
    unser Risiko, nicht seines. Ein breiter Drittanbieter-Ausschluss wuerde genau
    die Verbindlichkeit zerreden, die das staerkste Verkaufsargument der Seite ist.
  */
  fristPause: `Entsteht nach dem Start eine neue Abhängigkeit auf Ihrer Seite — geänderte Anforderungen, zusätzlicher Umfang, ein neu benötigter Zugang oder eine offene Entscheidung —, pausiert die Frist so lange und läuft danach weiter. Alles Übrige liegt bei uns, auch die Dienstleister, mit denen wir arbeiten.`,

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

  // Kein Pauschalversprechen und keine Pauschalabsage: beides wäre eine Aussage
  // über ein System, das wir noch nicht gesehen haben. Namen einzelner
  // Praxisverwaltungssysteme stehen hier bewusst nicht (OWNER-INPUT B3).
  /*
    BOOKING_WRITE, RICHTIG GELESEN — korrigiert am 11.09.2026.

    Die Inhaber-Bestaetigung vom 10.09.2026 lautet: "ONLY AFTER VERIFIED
    CUSTOMER INTEGRATION". Der Satz, der frueher hier stand, hat daraus
    gemacht: "was universell gilt, ist die AUFNAHME des Terminwunsches — nicht
    der Schreibvorgang". Das war eine Fehlleseung mit Folgen: Aus einer
    Bedingung fuer den SCHREIBZUGRIFF AUF FREMDSYSTEME wurde eine
    Produktbeschreibung, und die Copy fiel auf einen Anrufbeantworter mit
    Transkript zurueck.

    Die beiden Regeln sind getrennt (ausgeschrieben im Block
    "PRODUKTWAHRHEIT, KORRIGIERT AM 11.09.2026" weiter unten):

      AUTOMATED_WORKFLOW_COMPLETION = ZUGESICHERTE PRODUKTFAEHIGKEIT
        Konfigurierte Routineablaeufe wickelt der Assistent im Gespraech
        vollstaendig ab — buchen, verschieben, absagen, konfigurierte Fragen
        beantworten —, ohne dass daraus eine Aufgabe fuer einen Menschen wird.

      SYSTEM_SCHREIBZUGRIFF = KUNDENSPEZIFISCH UND PRUEFPFLICHTIG
        Ob dieser Ablauf direkt in das System des Kunden schreibt, haengt an
        dessen Schnittstelle; die wird je Kunde eingerichtet und verifiziert.
        Ohne sie greift der vorher vereinbarte Fallback — als AUSNAHME, nicht
        als Normalfall.

    Der String unten bleibt trotzdem WORTGLEICH: Er wird von einer
    eingefrorenen Experimentroute gerendert, deren Bytes sich bis zum Ende der
    Messung nicht bewegen duerfen. Fuer die nicht eingefrorenen Flaechen gilt
    `ABWICKLUNG` weiter unten. Endet das Experiment, wird auch dieser String
    auf die korrigierte Fassung gezogen — notiert in
    docs/seo/post-experiment-opportunities.md.
  */
  terminaufnahme:
    "Terminwünsche nimmt der Assistent nach Ihren Regeln auf: Er vergibt den Termin im vereinbarten Rahmen oder legt ihn Ihrem Team zur Bestätigung vor. Ob ein Termin zusätzlich direkt in Ihr Praxis- oder Kalendersystem geschrieben wird, hängt an dessen Schnittstelle — wir prüfen sie vor dem Angebot und richten die Übergabe erst ein, wenn sie für Ihr System nachweislich trägt.",

  /*
    Inhaber-Bestaetigung 10.09.2026 — SMS_EMAIL_CONFIRMATION: "ONLY FOR
    SPECIFIC CUSTOMER WORKFLOWS". SMS- und E-Mail-Bestaetigungen sind also
    keine Standardfunktion des Telefonassistenten. Oeffentliche Copy darf sie
    nicht als fuer jeden Kunden enthalten darstellen.

    Nicht hiervon beruehrt: Bestaetigungsmails eines Kontaktformulars auf einer
    von Cogniiq gebauten WEBSITE. Das ist das Webdesign-Produkt und keine
    Aussage ueber den Telefonassistenten (COPY-CLAIMS-TO-VERIFY.md Z25).
  */
  bestaetigungen:
    "Bestätigungen und Erinnerungen per SMS oder E-Mail gehören nicht zum Standardumfang. Sie lassen sich als Teil eines für Sie eingerichteten Ablaufs umsetzen — was dafür nötig ist und was es kostet, steht vor dem Vertragsschluss im Angebot.",

  keineAnbindung:
    "Eine Standardanbindung, die auf jedes Praxisverwaltungssystem sofort passt, gibt es nicht — deshalb prüfen wir Ihr konkretes System vor dem Angebot: ob es eine geeignete Schnittstelle gibt, ob wir dafür Zugang oder eine Freigabe bekommen, welche Vorgänge sie zulässt und ob Dritte dafür Gebühren verlangen. Wo das trägt, übergeben wir Termine und Ergebnisse direkt in Ihr System. Wo es nicht trägt, steht das Ergebnis strukturiert im Cogniiq-Dashboard und wir legen den Übergabeweg vorher gemeinsam fest.",
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
      "Sie wählen die Stimme, formulieren Ihren Begrüßungssatz und legen fest, wie Ihre Praxis am Telefon spricht. Mehrere Anrufe können zur selben Zeit laufen, ohne dass jemand ein Besetztzeichen hört. Anrufer erfahren im ersten Satz, dass ein KI-System spricht — und können jederzeit zu einem Menschen wechseln.",
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
    title: "Übergabe, Testphase und Go-live",
    description:
      `Spätestens ${FAKTEN.einrichtungsfrist} nach dem Start übergeben wir Ihnen den fertig eingerichteten Empfang. Zwei Tage testen wir gemeinsam; live geht der Assistent erst nach Ihrer Freigabe.`,
  },
];

/**
 * M6/M21 · Für Ihr Praxisteam — an MFA/Empfang gerichtet, ohne
 * Jobverlust-Abwehrrhetorik: Entlastung konkret zeigen, nicht verteidigen.
 */
export const TEAM_BLOCK = {
  headline: "Was sich für Ihr Team am ersten Tag ändert",
  text: "Das Telefon klingelt nicht mehr in dem Moment, in dem eine Patientin am Tresen steht. Wiederkehrende Anliegen — Terminwunsch, Stornierung, Rezeptbestellung — kommen als strukturierte Einträge an, nicht als Klingeln zwischen zwei Handgriffen. Ihr Team entscheidet weiterhin über jeden Termin und jede Rückmeldung; es wird nur seltener dabei unterbrochen.",
  /*
    KORRIGIERTE FASSUNG für die nicht eingefrorenen Seiten.

    `text` daneben ist wortgleich eingefroren: `KOMPAKT_TEAM.text` leitet sich
    davon ab und wird von einer Experimentroute gerendert. Inhaltlich ist die
    alte Fassung überholt — sie beschreibt Routineanliegen als „strukturierte
    Einträge", also als Aufgaben, die danach jemand erledigt. Genau das tun sie
    im Normalbetrieb nicht mehr.
  */
  textAbwicklung:
    "Das Telefon klingelt nicht mehr in dem Moment, in dem eine Patientin am Tresen steht. Wiederkehrende Anliegen — Termin vergeben, verschieben, stornieren, freigegebene Fragen beantworten — sind erledigt, bevor der Anrufer auflegt; sie erscheinen als abgeschlossener Vorgang und nicht als Aufgabe. Auf der Liste Ihres Teams steht nur, was Sie ausgenommen haben: fachliche Fragen, Rezept- und Überweisungswünsche, strittige Fälle. Den Rahmen legen Sie fest, und Sie können ihn jederzeit ändern.",
  points: [
    "Weniger Unterbrechungen zu Stoßzeiten — der Tresen hat Vorrang",
    "Mehrere Anrufe zur selben Zeit: niemand hört mehr ein Besetztzeichen, auch am Montagmorgen nicht",
    "Freigegebene Routineabläufe sind im Gespräch erledigt — sie landen gar nicht erst auf einer Liste",
    "Was übrig bleibt, kommt strukturiert an: Anliegen, Name, Rückrufnummer, Terminwunsch — statt Notizzettel",
    "Eine kurze Liste echter Ausnahmen statt Daueralarm: abarbeiten, wenn es in den Ablauf passt",
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

/*
  KORRIGIERTE FASSUNG des Anliegen-Katalogs — für die nicht eingefrorenen Seiten.

  `ANLIEGEN_UEBERNIMMT` bleibt wortgleich: `KOMPAKT_ANLIEGEN.punkte` schneidet
  die ersten drei Zeilen heraus und wird von einer Experimentroute gerendert.
  Die alte Formulierung „Terminwünsche AUFNEHMEN und … vergeben" stellt die
  Aufnahme vor die Vergabe und liest sich damit als Notizdienst. Die korrigierte
  Fassung nennt die Abwicklung zuerst; die Vorlage zur Bestätigung bleibt als
  das erhalten, was sie ist — eine Option, die die Praxis wählt.
*/
export const ANLIEGEN_UEBERNIMMT_ABWICKLUNG: string[] = [
  "Termine im Gespräch vergeben — im Rahmen, den Sie festlegen; wo Sie eine Bestätigung wünschen, legt er sie vor",
  "Termine verschieben und stornieren — im Gespräch erledigt, frei werdende Termine sind sofort wieder vergebbar",
  ...ANLIEGEN_UEBERNIMMT.slice(2),
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
    `${FAKTEN.keineAnbindung} Das Ergebnis der Prüfung steht im Angebot, mit allen dafür bekannten Kosten für den vereinbarten Umfang — auch die einer Schnittstelle, die Dritte berechnen.`,
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
    "Sie brauchen die Zusage, dass Termine automatisch in Ihrem Praxisverwaltungssystem stehen, schon bevor Ihr System geprüft ist. Ob das geht, hängt an Ihrer Software: Wir prüfen vor dem Angebot, ob eine geeignete Schnittstelle existiert, ob wir Zugang erhalten und was sie zulässt. Fällt die Prüfung negativ aus, sagen wir das vor der Unterschrift — eine Zusage vorab bekommen Sie von uns nicht.",
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
      "Ein freigegebener Routineablauf endet im Gespräch: Der Termin ist vergeben, verschoben oder storniert, und im Dashboard steht er als erledigter Vorgang — nicht als Aufgabe. Alles andere endet als strukturierter Eintrag: Anliegen, Name, Rückrufnummer, Terminwunsch. Ihr Team sieht auf einen Blick, worum es ging, und arbeitet diese kürzere Liste ab, wenn es in den Ablauf passt.",
      "Das ist bewusst kein Postfach mit Sprachnachrichten. Der Unterschied ist die Arbeit danach: Eine Mailbox müssen Sie abhören, mitschreiben und einordnen — ein strukturierter Eintrag ist bereits sortiert. Bleibt der Übertrag ins Praxissystem, weil keine Schnittstelle trägt, ist es ein Übertrag, kein Rekonstruieren des Gesprächs.",
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
      "Eine pauschale Ja-Antwort wäre unseriös, und eine Liste unterstützter Systeme führen wir bewusst nicht — sie wäre entweder unvollständig oder unehrlich. Was wir stattdessen tun: Wir nehmen Ihr Praxisverwaltungs- und Terminsystem im Erstgespräch auf und prüfen es, bevor Sie ein Angebot bekommen.",
      "Geprüft wird vier Dinge: ob eine geeignete Schnittstelle überhaupt existiert, ob Zugang oder Partnerfreigabe dafür erreichbar ist, welche Vorgänge sie zulässt — und ob Dritte für die Schnittstelle Gebühren verlangen. Trägt die Prüfung, binden wir Ihr System an, bis hin zur direkten Übergabe von Terminen und Ergebnissen, soweit die Schnittstelle das hergibt.",
      "Trägt sie nicht, sagen wir das vor der Unterschrift und legen stattdessen den Übergabeweg fest: Das Ergebnis steht strukturiert im Cogniiq-Dashboard, und Ihr Team übernimmt es von dort. In beiden Fällen steht das Ergebnis der Prüfung im Angebot, mit allen dafür bekannten Kosten für den vereinbarten Umfang — auch Schnittstellenkosten Dritter. Kommt später etwas hinzu, dann nur, weil sich der vereinbarte Umfang ändert oder ein externer Anbieter seine Preise ändert. Beides besprechen wir mit Ihnen und halten es fest, bevor es anfällt — nicht danach.",
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
  /*
    NUMERISCHE ZWILLINGE der drei Beträge darüber.

    Warum additiv und nicht statt der Strings: Die Strings sind das, was auf der
    Seite steht, inklusive schmalem geschütztem Leerzeichen — und die Preisseite
    ist ein eingefrorenes Experiment, dessen gerenderte Bytes sich nicht ändern
    dürfen. Die Strings bleiben deshalb unangetastet.

    Warum überhaupt Zahlen: Der ältere Praxis-Rechner parst die Strings zurück
    in Zahlen (`betragZuZahl`). Das ist eine Geschäftslogik, die an einer
    Anzeigeformatierung hängt — ein Tausenderpunkt an der falschen Stelle wäre
    ein stiller Rechenfehler. Neue Rechner lesen ausschließlich diese Felder.

    `telefonassistent-copy.test.ts` hält beide Darstellungen aneinander: Weicht
    eine Zahl von ihrem String ab, schlägt der Test an.
  */
  monatlichEur: number;
  obergrenzeEur: number;
  einrichtungEur: number;
}

export const TARIFE: Tarif[] = [
  {
    name: "Basis",
    minuten: 500,
    anrufeCa: 250,
    monatlich: "300\u00A0€",
    obergrenze: "500\u00A0€",
    einrichtung: "1.490\u00A0€",
    monatlichEur: 300,
    obergrenzeEur: 500,
    einrichtungEur: 1490,
  },
  {
    name: "Praxis",
    minuten: 1000,
    anrufeCa: 500,
    monatlich: "500\u00A0€",
    obergrenze: "800\u00A0€",
    einrichtung: "2.490\u00A0€",
    monatlichEur: 500,
    obergrenzeEur: 800,
    einrichtungEur: 2490,
  },
  {
    name: "MVZ",
    minuten: 2000,
    anrufeCa: 1000,
    monatlich: "800\u00A0€",
    obergrenze: "1.400\u00A0€",
    einrichtung: "3.490\u00A0€",
    monatlichEur: 800,
    obergrenzeEur: 1400,
    einrichtungEur: 3490,
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
    `Jeder Tarif enthält ein festes Minutenkontingent. ${FAKTEN.deckelung} Eine Grippewelle kann Ihre Telefonierechnung also bewegen, aber nicht sprengen.`,
  /** Der Geltungsbereich steht direkt neben der Zusage, nicht im Kleingedruckten. */
  geltung: FAKTEN.deckelungGeltung,
  hinweis: "Für Grundpreis und Mehrverbrauch kostet es nie mehr als die ausgewiesene Obergrenze.",
  tarifwechsel:
    "Und Sie bleiben nicht im falschen Tarif sitzen: Liegt Ihr Aufkommen dauerhaft höher, ordnen wir Sie dem Tarif zu, der für Ihren Bedarf am günstigsten ist und nicht dauerhaft an seiner Obergrenze läuft. Wer Monat für Monat den Zuschlag zahlt, zahlt zu viel — dann gehört er in den nächsten Tarif.",
  nichtProBehandler:
    "Abgerechnet wird pro Praxis, nicht pro Behandler. Ob bei Ihnen zwei oder sieben Personen behandeln, ändert am Monatsbetrag nichts.",
};

/*
  NUMERIK ZU SPRACHEN — additiv, damit Rechner nicht den Anzeigetext parsen.

  Was der Satz eindeutig sagt und was hier abgebildet ist:
    - Deutsch ist enthalten und kostet nichts extra.
    - Jede weitere Sprache: 79 € im Monat.
    - Ab drei weiteren Sprachen: 230 € im Monat statt 3 × 79 € = 237 €.

  „ab drei Sprachen" ist als DREI ZUSATZSPRACHEN gelesen, weil nur diese
  Lesart wirtschaftlich aufgeht: Bei zwei Zusatzsprachen wären 2 × 79 € = 158 €
  günstiger als das Paket, ein Paket also sinnlos. Bei drei kippt es (237 € >
  230 €).

  NICHT abgebildet, weil der Satz es nicht eindeutig festlegt — siehe
  OWNER-INPUT: ob „bis zu fünf Sprachen gleichzeitig" Deutsch mitzählt, und ob
  der Sprachaufschlag INNERHALB der Tarif-Obergrenze liegt oder daneben. Der
  Rechner rät das nicht, sondern weist den Aufschlag als eigene Zeile aus und
  sagt dazu, dass die Zuordnung zur Obergrenze im Angebot steht.

  SICHTBARER TEXT UND RECHNER GEZOGEN, 12.09.2026 — OWNER-INPUT H3 offen.

  Bis zum 12.09.2026 stand in `SPRACHEN.text` „ab drei Sprachen sind es 230 €
  im Monat für bis zu fünf Sprachen gleichzeitig" als feststehende Tatsache,
  während `sprachenAufschlagEur()` genau diese Konfiguration schon als OFFEN
  auswies. Der statische Text war damit SICHERER als der Rechenkern — und zwar
  bei der Zahl, die ein Kunde später auf seiner Rechnung wiederfindet.

  Was bekannt ist und hier zugesagt werden darf:
    • Deutsch ist enthalten und kostet nichts extra.
    • EINE weitere Sprache: 79 € im Monat.

  Was offen ist, solange H3 nicht bestätigt ist:
    • ob „ab drei Sprachen" drei Sprachen INSGESAMT (also zwei zusätzliche)
      oder drei ZUSÄTZLICHE Sprachen meint,
    • ob „bis zu fünf Sprachen" Deutsch mitzählt.
  Beide Lesarten treffen sich schon bei ZWEI Zusatzsprachen, also genau dort,
  wo der Rechner OFFEN sagt. Ab dort nennt der sichtbare Text deshalb keinen
  Betrag mehr, sondern verweist auf den Paketpreis im schriftlichen Angebot.
  Verschwiegen wird nichts: Dass weitere Sprachen Geld kosten, steht im Satz.

  `paketEur` bleibt als Datum stehen — es ist die Zahl, die der Inhaber genannt
  hat —, ist aber ABSICHTLICH ohne Konsument in der Produktion: kein sichtbarer
  Text und keine Rechnung leiten daraus einen Betrag ab, bevor H3 geklärt ist.
*/
export const SPRACHEN_PREISE = {
  /** Monatspreis je zusätzlicher Sprache unterhalb der Paketschwelle. */
  proSpracheEur: 79,
  /** Ab dieser Anzahl ZUSATZsprachen gilt der Paketpreis. */
  paketAbZusatzsprachen: 3,
  /** Monatlicher Paketpreis ab der Schwelle — UNBESTÄTIGT (OWNER-INPUT H3).
   *  Wird bewusst nirgends angezeigt und in keine Rechnung eingesetzt. */
  paketEur: 230,
};

export const SPRACHEN = {
  headline: "Weitere Sprachen",
  text: "Deutsch ist enthalten und kostet nichts extra. Eine weitere Sprache kostet 79\u00A0€ im Monat. Ab zwei zusätzlichen Sprachen gilt ein Paketpreis, dessen genaue Staffelung wir Ihnen im schriftlichen Angebot nennen — wir setzen hier keinen Betrag ein, den wir nicht für jede Konstellation belegen können. Der Assistent kann die Sprache mitten im Gespräch wechseln.",
};

/**
 * M17 · Einrichtung Ihres Empfangs — die acht realen Schritte.
 * Dauerangaben liegen nur für Testphase und Übergabe vor; erfundene Dauern
 * sind ausgeschlossen (Inhaber-Antwort E). Schritt 8 ist bewusst die Übergabe
 * und nicht der Go-live: nur bis dorthin reicht die zugesagte Frist.
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
      text: "Ein geführter Ablauf im Dashboard: Stimme, Begrüßungssatz, Anliegen, Regeln, Weiterleitungen. Ihre Angaben gehen direkt an uns — sobald sie vollständig vorliegen und die erste Hälfte eingegangen ist, beginnt die Zwei-Wochen-Frist.",
    },
    {
      nummer: "6",
      title: "Aufbau",
      dauer: null,
      text: "Ihr Assistent wird auf Basis dieser Angaben gebaut. Nicht ausgewählt, nicht aus einer Vorlage kopiert.",
    },
    {
      nummer: "7",
      title: "Übergabe zur Freigabe",
      dauer: `spätestens ${FAKTEN.einrichtungsfrist} nach dem Start`,
      text: `${FAKTEN.uebergabeGarantie} ${FAKTEN.startDefinition}`,
    },
    {
      nummer: "8",
      title: "Testphase und Go-live",
      dauer: "2 Tage Test",
      text: `${FAKTEN.freigabeNachUebergabe} Zwei Tage davon gehen wir gemeinsam mit Ihnen durch. ${FAKTEN.pruefzeitNeutral}`,
    },
  ],
};

/**
 * Zwei-Wochen-Garantie — eigener, ruhig gesetzter Block auf /praxen, der
 * Preisseite und im FAQ (Brief III §3.3). Nie als Aufzählungspunkt.
 *
 * Zugesagt ist die Übergabe zur Freigabe, nicht der Go-live. Der Zusatz "Das
 * steht so im Vertrag" ist bewusst entfernt: Ein Vertragsdokument mit genau
 * diesen Bedingungen liegt nicht geprüft vor, und eine Zusage über den
 * Vertragsinhalt darf nicht auf einer Annahme stehen (COPY-CLAIMS-TO-VERIFY).
 */
export const ZWEI_WOCHEN_GARANTIE = {
  headline: "Die Zwei-Wochen-Garantie",
  text: FAKTEN.uebergabeGarantie,

  /*
    Reihenfolge ist die Leseordnung der Frage, die der Kunde tatsaechlich hat:
    Wie zahle ich? -> Ab wann laeuft die Uhr? -> Was passiert nach der
    Uebergabe? -> Zaehlt meine Pruefzeit gegen euch? -> Was, wenn ihr zu spaet
    seid? -> Und wenn es an mir liegt? Eine Frist ohne Folge ist eine Absichts-
    erklaerung; eine Frist ohne Startpunkt ist ein offenes Risiko; eine Frist
    ohne benannten Endpunkt widerspricht dem Freigaberecht.
  */
  mechanik: [
    FAKTEN.zahlungsaufteilung,
    FAKTEN.startDefinition,
    FAKTEN.freigabeNachUebergabe,
    FAKTEN.pruefzeitNeutral,
    FAKTEN.garantieOhneAntrag,
    FAKTEN.fristPause,
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
/*
  EINGEFROREN — WORTGLEICH LASSEN.

  `UEBERGABE` wird von `TelefonassistentBeweiskette` gerendert und damit von
  einer eingefrorenen Experimentroute. Jede Änderung an diesen Strings bewegt
  deren gerenderte Bytes und zerstört die Messung; `protectedExperiments.test.tsx`
  fängt das ab.

  Inhaltlich ist die Fassung überholt: Ihr erster Satz beschreibt den ÜBLICHEN
  WEG ANDERER SYSTEME („der Assistent nimmt an, Ihre MFA überträgt danach von
  Hand") und wurde als Beschreibung DIESES Produkts gelesen. Die korrigierte
  Fassung steht direkt darunter in `UEBERGABE_ABWICKLUNG` und wird von den
  nicht eingefrorenen Seiten verwendet. Endet das Experiment, ersetzt sie diese
  hier — notiert in docs/seo/post-experiment-opportunities.md.
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
 * Die korrigierte Praxis-Fassung von `UEBERGABE` — für alle NICHT eingefrorenen
 * Seiten (`/praxen`, `/integrationen`).
 *
 * Der Unterschied ist die Reihenfolge, und sie entscheidet, was der Leser für
 * das Produkt hält. `UEBERGABE` beginnt mit der Handübertragung durch die MFA;
 * gemeint war der übliche Weg ANDERER Systeme, gelesen wurde es als Normalfall
 * hier. Diese Fassung nennt zuerst, was im Normalbetrieb passiert — der Anruf
 * ist erledigt, bevor der Anrufer auflegt —, dann die Abgrenzung, dann die
 * Bedingung für Schreibzugriff auf ein Kundensystem.
 *
 * Die Übergabe bleibt vollständig beschrieben. Sie ist wertvoll, aber sie ist
 * der AUSNAHMEWEG: für fachliche Fragen, Ausnahmen und Abläufe, die eine
 * Schnittstelle nicht trägt.
 */
export const UEBERGABE_ABWICKLUNG = {
  headline: "Und wer tippt das dann bei Ihnen ein?",
  paragraphs: [
    "Im Normalfall niemand. Was Sie freigegeben haben, wickelt der Assistent im Gespräch ab: Termin vergeben, verschieben, absagen, freigegebene Fragen beantworten. Der Vorgang ist fertig, bevor der Anrufer auflegt — er wird nicht zu einer Aufgabe, die jemand später abtippt.",
    "Das unterscheidet den Empfang von den Systemen, die viele Praxen nach wenigen Wochen wieder abschalten: Dort nimmt eine Maschine den Anruf an, und die Arbeit ist nicht verschwunden, sondern nur umgezogen — von der Anmeldung auf die Abendliste.",
    "Die Bedingung dafür ist technisch und wird vorher geklärt: Wo ein Ablauf direkt in Ihr Praxissystem schreibt, prüfen wir dessen Schnittstelle vor der Einrichtung und verifizieren die Anbindung vor dem Go-live. Trägt sie einen Ablauf nicht, greift der Weg, den wir vorher gemeinsam festgelegt haben — dann steht der fertige Vorgang für Ihr Team bereit. Das ist der Rückfallweg, nicht der Normalfall, und Sie erfahren vor der Unterschrift, welcher Ihrer Abläufe welchen Weg nimmt.",
  ],
  wasAnkommt: {
    headline: "Was bei einer Übergabe im Dashboard steht",
    items: ["Anliegen", "Name", "Rückrufnummer", "Terminwunsch", "Warum übergeben wurde"],
    hinweis:
      "Strukturiert, nicht als Audiodatei — Gespräche werden nicht aufgezeichnet. Abläufe, die durchlaufen, erscheinen als erledigt und nicht als Aufgabe.",
  },
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
      wert: "2\u00A0Tage, nach Vertragsabschluss und Zahlung der ersten Hälfte. Live geschaltet wird erst nach Ihrer Freigabe",
    },
  ],
  vetorecht:
    `Die Testphase ist kein kostenloser Test. Sie ist der Punkt, an dem Sie ein Vetorecht haben: Ohne Ihre Freigabe geht der Empfang nicht live. Die Zwei-Wochen-Frist deckt unsere Arbeit bis zur Übergabe an Sie ab — was danach geschieht, bestimmen Sie. ${FAKTEN.pruefzeitNeutral}`,
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
 * ZUR AUTOMATISIERUNG, Stand 11.09.2026. Der Begriff „Automatisierungsgrad"
 * hat diesen Rechner zwei Fassungen lang in die Irre geführt: Erst stand hier
 * „voreingestellt sind 90 %", während das Widget mit 20 % startete; dann wurde
 * die Prosa entschärft und die 20 % blieben als Vorgabewert stehen. Beide Male
 * las sich die Zahl als Aussage darüber, wie viel Cogniiq schafft.
 *
 * Der Inhaber hat die Produktwahrheit am 11.09.2026 klargestellt, und sie ist
 * das Gegenteil einer Einschränkung: Einen KONFIGURIERTEN Routineablauf wickelt
 * der Assistent vollständig ab — annehmen, sprechen, buchen, verschieben,
 * absagen, abschließen — bis zu 100 % der konfigurierten Routineanrufe, ohne
 * dass daraus eine Aufgabe für einen Menschen entsteht. Ausnahmen bleiben
 * Ausnahmen: Notfälle, Anliegen außerhalb des konfigurierten Umfangs, bewusst
 * menschlich gehaltene Fälle, ausdrückliche Eskalationsregeln.
 *
 * Was schwankt, ist eine ANDERE Zahl: der Anteil der Anrufe eines Betriebs, der
 * überhaupt zu diesen Routineabläufen gehört. Das ist eine Eigenschaft des
 * Anrufmix des Kunden, keine Leistungsgrenze des Systems — und deshalb eine
 * Zahl, die nur der Kunde kennt. Der kanonische Rechner setzt dafür keinen
 * Vorgabewert ein. Eine gemessene eigene Übernahmequote wird weiterhin NICHT
 * veröffentlicht (OWNER-INPUT F4 offen); sie wird für diese Trennung auch nicht
 * gebraucht.
 */
export const RECHNER = {
  headline: "Was spart eine Praxis durch einen KI Telefonassistenten?",
  intro:
    "Stellen Sie die Regler auf Ihre Praxis ein. Der Rechner trennt bewusst zwei Dinge, die oft in einer Zahl verschwinden: wie viele Anrufe überhaupt angenommen werden — und wie viel Bearbeitungszeit dabei tatsächlich eingespart wird. Das ist nicht dasselbe.",
  anbindungsHinweis:
    "Der Wert steigt, wo eine Anbindung an Ihr Praxisverwaltungssystem möglich ist: Dann entfällt auch das Übertragen von Hand. Was für Ihr System geht, prüfen wir vor dem Angebot.",
  /*
    DIE FASSUNG FÜR ALLE FLÄCHEN, seit 12.09.2026.

    Daneben stand bis zum 12.09.2026 `rahmung` — „startet bewusst mit einem
    zurückhaltenden Automatisierungsgrad". Diese Fassung blieb nur deshalb
    stehen, weil die Kostenseite ein eingefrorenes SEO-Experiment war und ihre
    gerenderten Bytes sich nicht bewegen durften. Mit dem Ende dieses
    Experiments (Inhaber-Entscheidung 12.09.2026) ist sie ersatzlos entfernt:
    Die Lesart war falsch. Einen konfigurierten Routineablauf wickelt der
    Assistent vollständig ab; was schwankt, ist der Anteil der Anrufe eines
    Betriebs, der überhaupt zu solchen Abläufen gehört. Es gibt keinen
    „Automatisierungsgrad" mehr, den wir voreinstellen.
  */
  rahmungRoutine:
    "Der Rechner zieht unsere eigenen Kosten ab — Monatspreis und Einrichtung. Für den Anteil Ihrer Anrufe, der zu konfigurierten Routineabläufen gehört, setzen wir bewusst keinen Wert ein: Wie groß dieser Anteil bei Ihnen ist, wissen nur Sie. Der Rechenweg bleibt vollständig nachvollziehbar.",

  /** Erklärung neben dem Routineanteil-Feld. Trennt Fähigkeit und Anrufmix. */
  routineanteilErklaerung:
    "Diese Routineabläufe kann der Cogniiq-Telefonassistent vollständig automatisiert abwickeln. Ausnahmen und bewusst menschlich gehaltene Fälle werden nach Ihren Regeln eskaliert.",
  routineanteilLeer:
    "Solange dieses Feld leer bleibt, bleibt die Zeitrechnung leer. Wir setzen hier keinen Anteil für Sie ein.",
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

// ─────────────────────────────────────────────────────────────────────────────
// GENERISCHE FASSUNG FÜR /ki-telefonassistent
//
// WARUM ES DIESEN BLOCK GIBT
//
// Alles oberhalb ist für Arztpraxen geschrieben: MFA, Anmeldung, Rezept,
// Überweisung, Notruf 112, § 203 StGB, „pro Praxis, nicht pro Behandler".
// Das ist richtig — für /praxen und die beiden Arzt- bzw. Praxis-Seiten des
// Clusters, die genau diese Intention bedienen.
//
// Die generische Seite /ki-telefonassistent hat diese Bausteine mitbenutzt und
// las sich dadurch wie eine Praxisseite: Überschriften über Patientinnen, über
// das Praxisteam, über medizinische Triage. Für jemanden, der „KI
// Telefonassistent für Unternehmen" sucht — Handwerk, Kanzlei, Hausverwaltung,
// Gastronomie — ist das die falsche Seite, und für Google war die dominante
// Entität dieser Seite „Arztpraxis" statt „Telefonassistent für Unternehmen".
// Damit stand die generische Seite im Wettbewerb mit der Praxisseite um
// dieselbe Intention und gewann keine von beiden.
//
// Diese Konstanten sind deshalb die BRANCHENOFFENE Fassung derselben
// Kernaussagen. Sie ersetzen die Praxis-Fassung nicht und werden von den
// Praxisseiten nicht importiert — deren Wortlaut bleibt unverändert.
//
// Es gelten dieselben Regeln wie oben: keine erfundenen Zahlen, keine Aussage
// zu Hosting oder Serverstandort, kein Schreibzugriff auf fremde Systeme ohne
// geprüfte Anbindung (BOOKING_WRITE), keine SMS-/E-Mail-Bestätigung als
// Standardfunktion (SMS_EMAIL_CONFIRMATION).
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// PRODUKTWAHRHEIT, KORRIGIERT AM 11.09.2026 (Inhaber-Review der Preview)
//
// DIE ALTE AUSLEGUNG WAR ZU DEFENSIV UND VERKAUFTE DAS PRODUKT UNTER WERT.
//
// Aus BOOKING_WRITE („only after verified customer integration") war in der
// Copy die Aussage geworden, der Assistent NEHME Terminwünsche nur AUF und ein
// Mitarbeiter erledige sie danach. Das beschreibt einen Anrufbeantworter mit
// Transkript, nicht dieses Produkt. Der Inhaber hat das am 11.09.2026
// ausdrücklich korrigiert.
//
// DIE BEIDEN REGELN, DIE AB JETZT GELTEN — sie sind NICHT dieselbe Regel:
//
//   AUTOMATISIERTE_ABWICKLUNG = ZUGESICHERTE PRODUKTFÄHIGKEIT
//     Der Assistent führt konfigurierte Routineabläufe vollständig zu Ende:
//     Termin buchen, verschieben, absagen, konfigurierte Fragen beantworten.
//     Das darf die Copy als Fähigkeit des Produkts sagen — mit „buchen",
//     „verschieben", „absagen", nicht ersatzweise mit „aufnehmen".
//
//   SYSTEM_SCHREIBZUGRIFF = KUNDENSPEZIFISCH UND PRÜFPFLICHTIG
//     Ob dieser Ablauf direkt in DAS SYSTEM DES KUNDEN schreibt (Kalender,
//     PVS, CRM, Buchungssystem), hängt an dessen Schnittstelle. Diese
//     Anbindung wird je Kunde umgesetzt und technisch verifiziert, bevor sie
//     zugesagt wird. Es gibt keine Zusage „funktioniert mit jeder Software".
//
// RICHTIG: „Der Assistent bucht, verschiebt und storniert Termine automatisch.
//           Direkter Schreibzugriff auf Ihr System wird für Ihr System
//           eingerichtet und verifiziert; ohne Anbindung greift der vereinbarte
//           Fallback."
// FALSCH:  „Der Assistent nimmt Terminwünsche auf, Ihr Team bestätigt."
// FALSCH:  „Der Kern des Produkts ist die strukturierte Übergabe."
// FALSCH:  „Schreibt automatisch in jedes Kalender-, PVS- oder CRM-System."
//
// AN KÜNFTIGE BEARBEITER: Ein Kommentar in dieser Datei hat die Seite einmal
// auf Nachrichtenannahme zurückgefahren. Wer „buchen" wieder gegen „aufnehmen"
// tauscht, macht denselben Fehler erneut. Die Prüffrage lautet nicht „steht da
// buchen?", sondern „steht die Anbindungsbedingung dort, wo Schreibzugriff auf
// ein Kundensystem behauptet wird?".
//
// NICHT ÜBERKORRIGIEREN: keine Aussage wie „übernimmt jeden Anruf", „Ihr Team
// telefoniert nie wieder", „100 % automatisiert", „garantierte Ersparnis" oder
// „von einem Menschen nicht zu unterscheiden".
//
// Die älteren Konstanten FAKTEN.terminaufnahme und FAKTEN.bestaetigungen
// bleiben WORTGLEICH bestehen: Sie werden von eingefrorenen Experimentrouten
// gerendert und dürfen sich dort nicht bewegen. Für die generische Seite gelten
// stattdessen die Konstanten unten.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Die eine Stelle, an der die Fähigkeit und ihre Bedingung zusammen stehen.
 * Überall, wo die Seite von Buchen, Verschieben oder Stornieren spricht, gehört
 * `qualifikation` in Lese- oder Sichtweite — nicht ans Seitenende.
 */
export const ABWICKLUNG = {
  faehigkeit:
    "Der Assistent führt die Abläufe, die Sie freigeben, im Gespräch zu Ende: Er bucht Termine, verschiebt sie, nimmt Absagen entgegen und beantwortet Ihre konfigurierten Fragen — ohne dass danach jemand die Anfrage noch einmal anfassen muss.",
  qualifikation:
    "Wo ein Ablauf direkt in Ihr System schreibt — Kalender, Buchungssystem, CRM oder Branchensoftware —, richten wir diese Anbindung für Ihr System ein und verifizieren sie vor dem Go-live. Eine Standardanbindung, die auf jede Software sofort passt, gibt es nicht: Wir prüfen Ihre vor dem Angebot und schreiben das Ergebnis hinein. Trägt sie einen Ablauf nicht, greift der Weg, den wir vorher gemeinsam festgelegt haben.",
  /** Kurzform für Bildunterschriften und Badges. */
  kurz: "Bei eingerichteter und verifizierter Systemanbindung.",
  /** Noch kürzer, für die Fußzeile einer Beispieldarstellung. */
  badge: "Beispiel mit verifizierter Kalenderanbindung",
};

/**
 * Was nach dem Anliegen passiert — drei Wege, in der Reihenfolge ihrer
 * Häufigkeit im Normalbetrieb. Ersetzt die frühere Rahmung „Die Übergabe
 * entscheidet. Deshalb ist sie der Kern.": Der Unterschied zu anderen Systemen
 * ist nicht die Qualität der Übergabe, sondern dass die meisten Routineanrufe
 * gar keine mehr brauchen.
 */
export const DREI_WEGE = {
  headline: "Was passiert, nachdem der Anrufer sein Anliegen gesagt hat",
  intro:
    "Drei Wege, und der erste ist im Normalbetrieb der häufigste. Welcher Anlass welchen Weg nimmt, legen Sie vor dem Start fest — nicht wir.",
  wege: [
    {
      kennung: "A",
      title: "Erledigt",
      text: "Der Assistent führt den Ablauf im Gespräch zu Ende: Termin gebucht, verschoben oder storniert. Der Anrufer legt mit einem Ergebnis auf, nicht mit einem Versprechen. Bei Ihnen entsteht keine Aufgabe.",
      fussnote: "Für Abläufe, die in Ihr System schreiben, gilt die eingerichtete und verifizierte Anbindung.",
    },
    {
      kennung: "B",
      title: "Beantwortet",
      text: "Öffnungszeiten, Anfahrt, Zuständigkeiten, benötigte Unterlagen, Status einer Sache: Der Assistent beantwortet die Fragen, die Sie ihm vorgegeben haben, direkt im Gespräch. Auch hier bleibt nichts liegen.",
      fussnote: null as string | null,
    },
    {
      kennung: "C",
      title: "Übergeben",
      text: "Dringend, sensibel, strittig oder außerhalb dessen, was Sie freigegeben haben: Dann übernimmt ein Mensch — sofort weitergeleitet, wo jemand erreichbar ist, sonst als strukturierter Eintrag mit Anliegen, Rückrufnummer und Kontext. Das ist der Ausnahmeweg, nicht der Regelfall.",
      fussnote: null,
    },
  ],
};

/**
 * Natürliches Gespräch — vom Inhaber als Kernunterscheidungsmerkmal bestätigt.
 *
 * Die Grenze ist nicht verhandelbar: Es wird NICHT behauptet, der Anrufer merke
 * den Unterschied zu einem Menschen nicht. Die Offenlegung nach Art. 50 KI-VO
 * steht am Anfang jedes Anrufs und ist nicht abschaltbar. Die Aussage lautet
 * „natürlich klingend UND erkennbar KI" — nicht „heimlich menschlich".
 */
export const GESPRAECH = {
  headline: "Ein Gespräch, kein Tastenmenü",
  intro:
    "Der Anrufer sagt sein Anliegen so, wie er es sagen würde, wenn jemand abhebt. Kein Durchnummerieren von Menüpunkten, keine Ansage, die man sich merken muss, keine Warteschleife.",
  punkte: [
    {
      title: "Frei formulieren statt Menü drücken",
      text: "Der Assistent hört zu, fragt nach, wenn etwas fehlt, und kommt auch dann weiter, wenn der Anrufer vom erwarteten Ablauf abweicht oder zwei Dinge auf einmal will.",
    },
    {
      title: "Ihre Gesprächslogik, nicht ein Standardbaum",
      text: "Was der Assistent fragt, anbietet und entscheidet, folgt den Regeln Ihres Betriebs — nicht einer Vorlage, an die Sie sich anpassen müssten.",
    },
    {
      title: "Ihre Stimme, Ihr Ton",
      text: "Stimme, Begrüßungssatz und Formulierungen wählen Sie aus. Der Assistent klingt nach Ihrem Empfang, nicht nach Ansagetext.",
    },
    {
      title: "Natürlich klingend und trotzdem transparent",
      text: "Im ersten Satz sagt der Assistent, dass er ein KI-System ist (Art. 50 KI-Verordnung). Das lässt sich nicht abschalten, und wir behaupten nicht, der Unterschied zu einem Menschen sei unhörbar. Wer lieber mit einer Person spricht, wird weitergeleitet.",
    },
  ],
};

/**
 * Definition und Abgrenzung. Der Begriff wird auf der Seite bisher nirgends
 * erklärt — weder gegenüber der Mailbox noch gegenüber dem Tastenmenü, obwohl
 * genau das die erste Frage eines Käufers ist, der den Begriff zum ersten Mal
 * gesucht hat.
 */
export const WAS_IST = {
  headline: "Was ein KI-Telefonassistent ist — und was er nicht ist",
  definition:
    "Ein KI-Telefonassistent ist eine Software, die eingehende Anrufe selbst annimmt und in natürlicher Sprache mit dem Anrufer spricht. Der entscheidende Unterschied liegt darin, was danach passiert: Ein guter Assistent notiert das Anliegen nicht nur, er erledigt es. Er bucht den Termin, verschiebt ihn, nimmt die Absage entgegen und beantwortet die Fragen, die Sie ihm vorgegeben haben — im selben Gespräch, ohne dass danach jemand die Anfrage noch einmal in die Hand nimmt. Nur was Sie ausgenommen haben oder was der Assistent nicht abschließen kann, geht an einen Menschen. Gebräuchlich sind für dieselbe Sache auch die Begriffe KI-Anrufassistent, AI-Telefonassistent, digitaler Telefonassistent, KI-Telefonservice oder KI-Telefonzentrale.",
  abgrenzungen: [
    {
      gegen: "Anrufbeantworter und Mailbox",
      text: "Die Mailbox nimmt auf, sie versteht nichts. Jemand muss abhören, zurückrufen und den Termin selbst eintragen — die Arbeit ist nicht weg, sie ist verschoben. Der Assistent führt das Gespräch und schließt den Vorgang ab, statt Ihnen eine Nachricht zu hinterlassen.",
    },
    {
      gegen: "Tastenmenü und Warteschleife",
      text: "Ein Tastenmenü zwingt den Anrufer in Ihre Struktur und endet fast immer doch bei einem Menschen. Wer kein passendes Feld findet, legt auf. Der Assistent fragt offen nach dem Anliegen, versteht auch Abweichungen vom erwarteten Ablauf und führt den Vorgang selbst zu Ende.",
    },
    {
      gegen: "Telefonservice mit externen Mitarbeitenden",
      text: "Ein externer Telefondienst kostet pro Gespräch, kennt Ihren Betrieb nur aus einem Leitfaden und reicht die meisten Anliegen als Notiz an Sie zurück. Der Assistent arbeitet mit einem festen Kontingent, nimmt mehrere Anrufe gleichzeitig an und schließt Termine im vereinbarten Rahmen selbst ab.",
    },
    {
      gegen: "Chatbot auf der Website",
      text: "Ein Chatbot erreicht nur, wer ohnehin auf Ihrer Website ist. Der Anruf bleibt für viele Kunden der erste Weg — und ist der Kanal, an dem ein besetztes Zeichen sofort einen Auftrag kostet.",
    },
  ],
};

/**
 * Der Abschnitt, der die Seite von Anbieterlisten und Wettbewerbsseiten
 * unterscheidet: Kaufkriterien, die für JEDEN Anbieter gelten, mit der eigenen
 * Antwort daneben. Jedes Kriterium ist zugleich ein reales Scheiternsmuster —
 * deshalb steht die Begründung vor der eigenen Antwort und nicht dahinter.
 *
 * `cogniiq` darf nur Aussagen enthalten, die auf dieser Website belegt sind.
 * Keine Aussage über Hosting, Serverstandort oder „DSGVO-konform".
 */
export const ANBIETER_CHECKLISTE: Array<{
  frage: string;
  warum: string;
  cogniiq: string;
}> = [
  {
    frage: "Erledigt das System den Anruf — oder erzeugt es eine neue Aufgabe?",
    warum:
      "Das ist der Punkt, an dem die meisten Einführungen scheitern. Das Gespräch läuft gut, das Ergebnis landet in einer E-Mail, und jemand tippt es von Hand ab. Die Arbeit ist dann nicht verschwunden, sie ist nur umgezogen — und der Betrieb schaltet das System nach ein paar Wochen wieder ab.",
    cogniiq:
      "Für die Abläufe, die Sie freigeben, ist der Anruf mit dem Auflegen erledigt: Termin gebucht, verschoben oder storniert, Frage beantwortet. Nur Ausnahmen und alles, was Sie ausgenommen haben, gehen an einen Menschen — dann vollständig und lesbar, nicht als Sprachnachricht.",
  },
  {
    frage: "Ist die Anbindung an mein System geprüft — oder nur behauptet?",
    warum:
      "„Bucht Termine automatisch in Ihren Kalender“ steht auf fast jeder Anbieterseite. Buchen können die meisten; die Frage ist, ob es in IHREM System landet. Das hängt an dessen Schnittstelle, an Zugängen, an Freigaben und manchmal an Gebühren Dritter. Eine Zusage vor der Prüfung ist keine Zusage.",
    cogniiq: `${ABWICKLUNG.qualifikation} Wir sagen Ihnen also vor der Unterschrift, welche Abläufe bei Ihnen automatisch durchlaufen und welche nicht.`,
  },
  {
    frage: "Wie sauber ist der Weg zum Menschen, wenn er gebraucht wird?",
    warum:
      "Ein System ohne sauberen Übergang zum Menschen erzeugt genau die Anrufe, die Sie vermeiden wollten — verärgerte Rückrufe. Fragen Sie nach, woran ein Anbieter Dringlichkeit erkennt und was danach passiert.",
    cogniiq:
      "Dringende Anliegen und alles, was Sie als Chefsache markieren, gehen sofort an einen Menschen. Wer lieber mit einer Person spricht, wird auf Wunsch jederzeit weitergeleitet. Der Assistent versucht nicht, Fälle zu lösen, die in menschliche Hände gehören.",
  },
  {
    frage: "Was steht am Monatsende auf der Rechnung?",
    warum:
      "Minutenpreise ohne Obergrenze verschieben das Mengenrisiko auf Sie. Ein einzelner Ausnahmemonat — Rückrufwelle, Störung, Kampagne — kann eine Abrechnung sprengen, die im Normalbetrieb unauffällig war.",
    cogniiq: `Jeder Tarif enthält ein festes Minutenkontingent und ist nach oben auf eine ausgewiesene Obergrenze gedeckelt. ${FAKTEN.preisgarantie} Die Zahlen stehen vollständig auf der Kostenseite, nicht erst im Gespräch.`,
  },
  {
    frage: "Was passiert mit dem, was Anrufer sagen?",
    warum:
      "Vier Fragen entscheiden, und Sie sollten sie jedem Anbieter stellen: Wird das Gespräch aufgezeichnet und wie lange gespeichert? Werden Ihre Daten zum Training von Modellen verwendet? Gibt es einen Auftragsverarbeitungsvertrag nach Art. 28 DSGVO? Und erfährt der Anrufer, dass er mit einem KI-System spricht?",
    cogniiq: `${FAKTEN.keineAufzeichnung} ${FAKTEN.keinTraining} Einen Auftragsverarbeitungsvertrag nach Art. 28 DSGVO stellen wir jedem Kunden bereit. Der Assistent gibt sich zu Beginn jedes Anrufs als KI-System zu erkennen; abschalten lässt sich das nicht.`,
  },
  {
    frage: "Wer ändert die Ansage, wenn sich nächste Woche etwas ändert?",
    warum:
      "Viele Systeme werden einmal eingerichtet und dann sich selbst überlassen. Ändern sich Öffnungszeiten oder Abläufe, veraltet die Konfiguration — und niemand fühlt sich zuständig.",
    cogniiq: `Öffnungszeiten, Urlaubsansagen und aktuelle Hinweise ändern Sie selbst im Kundendashboard. ${FAKTEN.aenderungen} Für Änderungen an Gesprächslogik und Regeln haben Sie einen festen Ansprechpartner, kein Ticketsystem.`,
  },
];

/**
 * Branchenoffene Fassung von UEBERGABE.
 *
 * Die Praxis-Fassung nennt „Ihre MFA" und „ins Praxissystem" — auf der
 * generischen Seite war das der letzte verbliebene Medizinbezug und stand
 * ausgerechnet im wichtigsten Beweisabschnitt der Seite.
 */
/**
 * Der AUSNAHMEWEG (Weg C aus DREI_WEGE), nicht der Kern des Produkts.
 *
 * Diese Konstante hieß einmal „Die Übergabe entscheidet. Deshalb ist sie der
 * Kern." Das war die zentrale Fehlrahmung der Seite: Sie machte die Notiz zum
 * Produkt. Sie bleibt wertvoll — aber nur für die Anrufe, die ein Mensch
 * übernehmen muss.
 */
export const GENERISCH_UEBERGABE = {
  headline: "Und wenn doch ein Mensch ran muss?",
  paragraphs: [
    "Nicht jeder Anruf ist Routine. Für alles, was Sie ausgenommen haben, was strittig ist oder was der Assistent nicht abschließen kann, ist der Übergang an einen Menschen der Teil, an dem solche Systeme sonst scheitern: Das Gespräch läuft gut, und am Ende steht doch wieder eine Sprachnachricht, die jemand abhören und abtippen muss.",
    "Deshalb ist auch der Ausnahmeweg vorher festgelegt. Wo jemand erreichbar ist, wird sofort weitergeleitet. Sonst steht das Anliegen vollständig und lesbar da, wo Ihr Team ohnehin arbeitet — und niemand muss ein Gespräch rekonstruieren.",
  ],
  wasAnkommt: {
    headline: "Was bei einer Übergabe ankommt",
    items: ["Anliegen", "Name", "Rückrufnummer", "Worum es konkret geht", "Warum übergeben wurde"],
    hinweis:
      "Strukturiert, nicht als Audiodatei — Gespräche werden nicht aufgezeichnet.",
  },
};

/**
 * Branchenoffene Fassung von DECKELUNG.
 *
 * `DECKELUNG.text` nennt eine Grippewelle als Lastspitze und
 * `DECKELUNG.nichtProBehandler` rechnet „pro Praxis, nicht pro Behandler" —
 * beides sind Praxisaussagen. Die Abrechnungseinheit wird hier NICHT
 * verallgemeinert („pro Betrieb, nicht pro Mitarbeiter" wäre eine Aussage, die
 * der Inhaber so nicht getroffen hat); sie entfällt auf der generischen Seite
 * und steht weiterhin dort, wo sie belegt ist. Die Obergrenze selbst gilt
 * unabhängig von der Branche und bleibt deshalb wörtlich erhalten.
 */
export const GENERISCH_DECKELUNG = {
  headline: "Zuerst die Obergrenze, dann der Preis",
  text: `Jeder Tarif enthält ein festes Minutenkontingent. ${FAKTEN.deckelung} Eine Rückrufwelle oder eine Kampagne kann Ihre Telefonierechnung also bewegen, aber nicht sprengen.`,
  geltung: FAKTEN.deckelungGeltung,
  tarifwechsel: DECKELUNG.tarifwechsel,
  preisgarantie: FAKTEN.preisgarantie,
};

/** Branchenoffene Fassung von SAEULEN. */
export const GENERISCH_SAEULEN: Array<{ title: string; description: string }> = [
  {
    title: "Auf Ihre Anrufe konfiguriert, nicht von der Stange",
    description:
      "Vor dem Start nehmen wir Ihre tatsächlichen Anrufanlässe auf: Terminwunsch, Absage, Angebotsanfrage, Statusfrage, Reklamation, Rückrufbitte. Für jeden Anlass legen Sie fest, was der Assistent erledigt und was immer bei Ihrem Team landet. Das Ergebnis ist Ihre Gesprächsführung — nicht ein Standardablauf, an den Sie sich anpassen müssen.",
  },
  {
    title: "Klingt wie Ihr Empfang, nicht wie ein Automat",
    description: `Sie wählen die Stimme, formulieren Ihren Begrüßungssatz und legen fest, wie Ihr Betrieb am Telefon spricht. Mehrere Anrufe können zur selben Zeit laufen, ohne dass jemand ein Besetztzeichen hört; die Kapazität wird auf Ihr Aufkommen ausgelegt. Anrufer erfahren im ersten Satz, dass ein KI-System spricht — und können jederzeit zu einem Menschen wechseln.`,
  },
  {
    title: "Die Anbindung klären wir vor der Unterschrift",
    description:
      "Damit ein Termin nicht nur zugesagt, sondern auch eingetragen ist, muss der Assistent in Ihr System schreiben dürfen. Vor der Einrichtung prüfen wir, welche Schnittstelle Ihr Kalender, Ihr Buchungssystem, Ihr CRM oder Ihre Branchensoftware bietet, richten sie ein und verifizieren sie. Trägt sie, schließt der Assistent den Vorgang direkt dort ab. Trägt sie einen Ablauf nicht, legen wir vorher gemeinsam fest, was stattdessen passiert — und sagen es Ihnen vor der Unterschrift, nicht danach.",
  },
];

/** Branchenoffene Fassung des Anliegen-Katalogs. */
export const GENERISCH_UEBERNIMMT: string[] = [
  "Termine im Gespräch buchen — im Rahmen der Regeln, die Sie freigegeben haben",
  "Termine verschieben und Absagen abschließen; der frei gewordene Platz ist sofort wieder vergeben",
  "Wiederkehrende Fragen beantworten: Öffnungszeiten, Anfahrt, Zuständigkeiten, benötigte Unterlagen",
  "Erstanfragen qualifizieren und, wo vorgesehen, direkt einen Gesprächstermin vergeben",
  "Auf Wunsch in weiteren Sprachen sprechen und die Sprache mitten im Gespräch wechseln",
  "Anrufer an die zuständige Person weiterleiten, wenn die Regel das vorsieht und dort jemand erreichbar ist",
];

export const GENERISCH_IMMER_MENSCH: string[] = [
  "Dringende Anliegen: erkannt an den Signalwörtern, die Sie festlegen, und sofort weitergeleitet — ohne eigene Einschätzung durch das System",
  "Fachliche Entscheidungen, für die Ihr Urteil nötig ist",
  "Beschwerden und emotionale Gespräche",
  "Preis- und Vertragszusagen außerhalb dessen, was Sie freigegeben haben",
  "Anliegen, die außerhalb des freigegebenen Katalogs liegen oder die der Assistent nicht abschließen kann",
  "Anrufer, die ausdrücklich einen Menschen möchten, wo Ihre Regel das vorsieht",
];

/** Branchenoffene Fassung von GRENZEN. Inhaltlich identisch, ohne Medizinbezug. */
export const GENERISCH_GRENZEN = {
  headline: "Was unser Empfang nicht macht",
  intro:
    "Ein Telefonassistent, der alles verspricht, hat entweder keine Grenzen definiert oder verschweigt sie. Unsere stehen hier.",
  points: [
    "Kein Ersatz für Ihr Team. Routineabläufe schließt der Assistent ab; Entscheidungen außerhalb der freigegebenen Regeln, Ausnahmen und alles Strittige bleiben bei Ihren Mitarbeiterinnen und Mitarbeitern.",
    "Keine fachliche Beratung und keine Bewertung von Dringlichkeit. Er erkennt die Signalwörter, die Sie festlegen, und leitet dann weiter — beurteilen tut er nicht.",
    "Er handelt nur innerhalb dessen, was Sie freigegeben haben. Welcher Anlass automatisch abgeschlossen wird und wo die Grenze liegt, entscheiden Sie im Anliegen-Katalog — nicht das System.",
    `${FAKTEN.keineAnbindung} Das Ergebnis der Prüfung steht im Angebot, mit allen dafür bekannten Kosten für den vereinbarten Umfang — auch denen einer Schnittstelle, die Dritte berechnen.`,
    FAKTEN.bestaetigungen,
    "Gespräche werden nicht aufgezeichnet. Wenn Sie später den genauen Wortlaut eines Anrufs brauchen, gibt es ihn nicht — Sie haben das strukturierte Ergebnis, nicht die Aufnahme.",
    "Der Assistent übernimmt nicht alle Anrufe. Was er vollständig abschließt, sind die Routineabläufe, die Sie freigegeben haben — nicht Ihre gesamte Telefonie. Wie groß dieser Anteil in Ihrem Betrieb ist, hängt an Ihren Anrufanlässen; wir nennen dafür keine Quote, die wir nicht gemessen haben.",
  ],
};

/** Branchenoffene Fassung von NICHT_PASSEND. */
export const GENERISCH_NICHT_PASSEND = {
  headline: "Wann wir nicht die richtige Lösung sind",
  intro:
    "Ein Erstgespräch lohnt sich nicht für jeden Betrieb. In diesen Konstellationen raten wir ab:",
  points: [
    "Sie brauchen die Zusage, dass der Assistent in Ihre Branchensoftware schreibt, schon bevor wir Ihr System gesehen haben. Buchen, Verschieben und Stornieren kann er; ob das direkt in Ihrem System landet, hängt an dessen Schnittstelle. Das prüfen wir vor dem Angebot und schreiben das Ergebnis hinein — eine Zusage ins Blaue bekommen Sie von uns nicht.",
    "Sie erwarten, dass die Telefonie vollständig ohne Ihr Team läuft. Routineabläufe schließt der Assistent ab, aber Ausnahmen, Beschwerden und fachliche Entscheidungen bleiben bei Menschen — wer null Telefonbeteiligung erwartet, wird enttäuscht.",
    "Ihr Anrufaufkommen ist gering und Ihr Team gut erreichbar. Dann löst der Assistent kein Problem, das Sie haben — und ein System ohne Problem ist nur ein Kostenpunkt.",
    "Sie möchten, dass Anrufer nicht erfahren, dass ein KI-System spricht. Diese Transparenz ist für uns nicht verhandelbar — rechtlich wie inhaltlich.",
  ],
};

/** Branchenoffene Datenschutzpunkte: ohne § 203 StGB und ohne DSFA-Praxisbezug. */
export const GENERISCH_DATENSCHUTZ_PUNKTE: string[] = [
  FAKTEN.keineAufzeichnung,
  FAKTEN.keinTraining,
  "Der Assistent gibt sich zu Beginn jedes Anrufs als KI-System zu erkennen (Art. 50 KI-Verordnung). Ihre Anruferinnen und Anrufer wissen von der ersten Sekunde an, mit wem sie sprechen — abschalten lässt sich das nicht.",
  "Einen Auftragsverarbeitungsvertrag nach Art. 28 DSGVO stellen wir jedem Kunden bereit",
  "Welche Unterlagen Ihr Datenschutzbeauftragter für seine Bewertung braucht, liefern wir zu — die Bewertung selbst nehmen wir ihm nicht ab",
];
