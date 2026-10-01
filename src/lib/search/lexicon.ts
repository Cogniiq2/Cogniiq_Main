// ─────────────────────────────────────────────────────────────────────────────
// Wortschatz der Seitensuche.
//
// Zwei Dinge stehen hier:
//
//   1. FACETTEN — Leistung, Branche, Standort. Jede Facette kennt die Wörter, mit
//      denen Besucher sie meinen („Homepage" für Webdesign, „Zahnärzte" für die
//      Zahnarztpraxis, „Munich" für München). Die Facetten einer Seite werden aus
//      ihrem Pfad abgeleitet, nie von Hand je Seite gepflegt — so trägt jede
//      neue Route automatisch den passenden Wortschatz.
//
//   2. ERGÄNZUNGEN je Seite — Absichtssätze und Beschriftungen für Seiten, deren
//      Pfad allein die Absicht nicht verrät (Kontakt, FAQ, Problemseiten).
//
// Die fünf eingefrorenen Experimentrouten (src/lib/routing/protectedExperiments.ts)
// dürfen hier NICHT als Pfad vorkommen: Der Schutz zählt jede Erwähnung ihres
// Pfads im Quellbaum. Sie bekommen ihren Wortschatz ausschließlich über die
// Facetten, die aus dem Pfad abgeleitet werden. lexicon.test.ts sichert das.
// ─────────────────────────────────────────────────────────────────────────────

export type SearchKind =
  | 'leistung'
  | 'branche'
  | 'standort'
  | 'preise'
  | 'problem'
  | 'ratgeber'
  | 'unternehmen'
  | 'rechtliches';

export const KIND_LABEL: Record<SearchKind, string> = {
  leistung: 'Leistung',
  branche: 'Branche',
  standort: 'Standort',
  preise: 'Preise',
  problem: 'Problem',
  ratgeber: 'Ratgeber',
  unternehmen: 'Unternehmen',
  rechtliches: 'Rechtliches',
};

export type FacetAxis = 'service' | 'industry' | 'city';

export interface Facet {
  readonly axis: FacetAxis;
  readonly id: string;
  /** Sichtbare Beschriftung, z. B. in „Trifft: Webdesign · Zahnarzt · München". */
  readonly label: string;
  /** Übergeordnete Facette derselben Achse (Zahnarzt → Arzt). */
  readonly parent?: string;
  /** Standorte: Region statt Stadt — wird bei Stadtfragen milder behandelt. */
  readonly region?: boolean;
  /** Pfadbausteine, an denen eine Seite diese Facette trägt. */
  readonly pathTokens: readonly string[];
  /** Wörter und Wendungen, mit denen Besucher die Facette meinen. Roh, ungefaltet. */
  readonly terms: readonly string[];
}

export const FACETS: readonly Facet[] = [
  // ─── Leistungen ────────────────────────────────────────────────────────────
  {
    axis: 'service',
    id: 'webdesign',
    label: 'Webdesign',
    pathTokens: ['webdesign', 'website', 'landingpage', 'seo', 'lokales'],
    terms: [
      'Webdesign', 'Website', 'Webseite', 'Homepage', 'Internetseite', 'Internetauftritt',
      'Online-Auftritt', 'Webagentur', 'Webdesigner', 'Webentwicklung', 'Landingpage',
      'Relaunch', 'Website erstellen', 'Website erneuern', 'neue Website', 'SEO',
      'Suchmaschinenoptimierung', 'Google Ranking', 'gefunden werden', 'Sichtbarkeit',
      'Google Maps', 'WordPress', 'Design', 'Webseite erstellen lassen',
    ],
  },
  {
    axis: 'service',
    id: 'telefon',
    label: 'KI-Telefonassistent',
    pathTokens: ['telefonassistent', 'praxen', 'anrufe', 'terminbuchung'],
    terms: [
      'Telefonassistent', 'Telefon', 'Anruf', 'Anrufe', 'Anrufannahme', 'Telefonie',
      'Telefonservice', 'Telefonzentrale', 'Telefonassistenz', 'Rezeption', 'Rezeptionistin',
      'Empfang', 'Anmeldung', 'Sprachassistent', 'Voicebot', 'Voice Agent', 'Hotline',
      'Erreichbarkeit', 'erreichbar', 'besetzt', 'Warteschleife', 'Anrufbeantworter',
      'Rückruf', 'Termine am Telefon', 'KI am Telefon', 'Anrufe annehmen',
      'Anrufe entgegennehmen', 'telefonisch', 'Telefonbot', 'Phone', 'Call',
    ],
  },
  {
    axis: 'service',
    id: 'automatisierung',
    label: 'Automatisierung',
    pathTokens: ['automatisierung', 'prozessautomatisierung', 'manuelle', 'digitale', 'digitalisierung'],
    terms: [
      'Automatisierung', 'Automation', 'automatisieren', 'Prozesse', 'Prozessautomatisierung',
      'Workflow', 'Workflows', 'Abläufe', 'manuelle Arbeit', 'Handarbeit', 'Zettelwirtschaft',
      'Digitalisierung', 'digitalisieren', 'KI-Agent', 'Agent', 'CRM', 'Zapier', 'Make', 'n8n',
      'Schnittstelle', 'Integration', 'Datenübertragung', 'Rechnungen automatisch',
      'E-Mails automatisch', 'Zeit sparen', 'Routineaufgaben', 'Papierkram',
    ],
  },

  // ─── Branchen ──────────────────────────────────────────────────────────────
  {
    axis: 'industry',
    id: 'arzt',
    label: 'Arztpraxis',
    pathTokens: ['arzt', 'praxis', 'praxen', 'arztpraxis'],
    terms: [
      'Arzt', 'Ärzte', 'Ärztin', 'Arztpraxis', 'Praxis', 'Praxen', 'Hausarzt', 'Facharzt',
      'Mediziner', 'medizinisch', 'MVZ', 'Patienten', 'Patientinnen', 'Sprechstunde',
      'MFA', 'PVS', 'Praxisverwaltung', 'Praxisteam', 'Rezeptbestellung', 'Überweisung',
      'Physiotherapie', 'Therapeut', 'Heilpraktiker', 'Gesundheit', 'Klinik', 'Ambulanz',
    ],
  },
  {
    axis: 'industry',
    id: 'zahnarzt',
    label: 'Zahnarztpraxis',
    parent: 'arzt',
    pathTokens: ['zahnarztpraxis', 'zahnarzt'],
    terms: ['Zahnarzt', 'Zahnärzte', 'Zahnärztin', 'Zahnarztpraxis', 'Dental', 'Kieferorthopädie', 'KFO', 'ZFA'],
  },
  {
    axis: 'industry',
    id: 'gastronomie',
    label: 'Gastronomie',
    pathTokens: ['gastronomie', 'restaurant'],
    terms: [
      'Restaurant', 'Restaurants', 'Gastronomie', 'Gastro', 'Gaststätte', 'Lokal', 'Café',
      'Bar', 'Bistro', 'Pizzeria', 'Reservierung', 'Reservierungen', 'Tischreservierung',
      'Speisekarte', 'Lieferservice', 'Bestellungen', 'Gäste',
    ],
  },
  {
    axis: 'industry',
    id: 'hotel',
    label: 'Hotellerie',
    pathTokens: ['hotel'],
    terms: ['Hotel', 'Hotels', 'Hotellerie', 'Pension', 'Ferienwohnung', 'Buchung', 'Buchungsanfrage', 'Zimmer', 'Gastgeber', 'Übernachtung'],
  },
  {
    axis: 'industry',
    id: 'immobilien',
    label: 'Immobilien',
    pathTokens: ['immobilien'],
    terms: ['Immobilien', 'Immobilienmakler', 'Makler', 'Maklerbüro', 'Objekte', 'Exposé', 'Besichtigung', 'Wohnung', 'Haus verkaufen', 'Hausverwaltung'],
  },
  {
    axis: 'industry',
    id: 'sport',
    label: 'Sport und Fitness',
    pathTokens: ['sport'],
    terms: ['Sport', 'Sportverein', 'Verein', 'Fitnessstudio', 'Fitness', 'Studio', 'Gym', 'Mitglieder', 'Mitgliederverwaltung', 'Training', 'Kurse'],
  },

  // ─── Standorte ─────────────────────────────────────────────────────────────
  {
    axis: 'city',
    id: 'bayreuth',
    label: 'Bayreuth',
    pathTokens: ['bayreuth'],
    terms: ['Bayreuth', 'Oberfranken', 'Kulmbach', 'Hof', 'Bamberg', 'Franken'],
  },
  {
    axis: 'city',
    id: 'muenchen',
    label: 'München',
    pathTokens: ['muenchen'],
    terms: ['München', 'Muenchen', 'Munchen', 'Munich', 'Oberbayern', 'Münchner'],
  },
  {
    axis: 'city',
    id: 'regensburg',
    label: 'Regensburg',
    pathTokens: ['regensburg'],
    terms: ['Regensburg', 'Oberpfalz', 'Regensburger'],
  },
  {
    axis: 'city',
    id: 'bayern',
    label: 'Bayern',
    region: true,
    pathTokens: ['bayern'],
    terms: ['Bayern', 'bayerisch', 'Nürnberg', 'Augsburg', 'Würzburg', 'Erlangen', 'Fürth', 'Ingolstadt', 'Passau', 'Landshut', 'Rosenheim'],
  },
  {
    axis: 'city',
    id: 'deutschland',
    label: 'Deutschland',
    region: true,
    pathTokens: ['deutschland'],
    terms: ['Deutschland', 'deutschlandweit', 'bundesweit', 'national', 'Berlin', 'Hamburg', 'Köln', 'Frankfurt', 'Stuttgart', 'Düsseldorf', 'Leipzig', 'Dresden', 'Hannover'],
  },
];

/**
 * Wörter, die eine Seitenart statt einer Facette meinen. „Was kostet" führt zur
 * Preisseite, „Ratgeber" zum Blog — unabhängig davon, welche Leistung gemeint ist.
 */
export const KIND_TERMS: Readonly<Record<SearchKind, readonly string[]>> = {
  preise: ['Kosten', 'kostet', 'Preis', 'Preise', 'Preisliste', 'teuer', 'günstig', 'Budget', 'Angebot', 'Tarif', 'monatlich', 'Euro', 'bezahlen', 'Investition', 'Rechner', 'ROI'],
  ratgeber: ['Blog', 'Ratgeber', 'Artikel', 'Leitfaden', 'Tipps', 'Beitrag', 'lesen', 'Wissen', 'Anleitung', 'erklärt'],
  problem: ['Problem', 'verloren', 'verpasst', 'keine Anfragen', 'bringt nichts', 'funktioniert nicht', 'zu viel', 'Stress', 'überlastet', 'Chaos'],
  unternehmen: ['Kontakt', 'Termin', 'Erstgespräch', 'Gespräch', 'kennenlernen', 'Team', 'Gründer', 'wer seid ihr', 'über uns', 'Firma', 'Agentur', 'Demo', 'ausprobieren', 'testen', 'FAQ', 'Fragen'],
  rechtliches: ['Impressum', 'Datenschutzerklärung', 'rechtlich', 'AGB', 'Cookies'],
  leistung: ['Leistungen', 'Angebot', 'Services', 'Lösungen', 'was macht ihr', 'was bietet ihr'],
  branche: ['Branche', 'für wen'],
  standort: ['Standort', 'Standorte', 'Region', 'in meiner Nähe', 'vor Ort', 'Stadt'],
};

export interface PageEnrichment {
  /** Kürzere Beschriftung als der SEO-Titel. */
  readonly label?: string;
  readonly kind?: SearchKind;
  /** Zusätzliche Begriffe, die der Titel nicht trägt. */
  readonly terms?: readonly string[];
  /** Ganze Sätze, wie Besucher ihr Anliegen formulieren. Treffer wiegen schwer. */
  readonly phrases?: readonly string[];
  /** Grundgewicht 0–1; Einstiegsseiten stehen bei Gleichstand vorn. */
  readonly weight?: number;
}

/**
 * Ergänzungen je Pfad. Keine der fünf eingefrorenen Experimentrouten darf hier
 * stehen — siehe Kopfkommentar.
 */
export const PAGE_ENRICHMENT: Readonly<Record<string, PageEnrichment>> = {
  '/': {
    label: 'Startseite',
    kind: 'unternehmen',
    terms: ['Cogniiq', 'Start', 'Home', 'Übersicht', 'Agentur'],
    weight: 0.5,
  },
  '/leistungen': {
    label: 'Alle Leistungen im Überblick',
    kind: 'leistung',
    terms: ['Überblick', 'alles', 'Angebot', 'Services', 'Lösungen'],
    phrases: ['Was macht ihr', 'Was bietet ihr an', 'Ich weiß nicht, was ich brauche', 'Womit fange ich an'],
    weight: 1,
  },
  '/kontakt': {
    label: 'Erstgespräch vereinbaren',
    kind: 'unternehmen',
    terms: ['Kontakt', 'Termin', 'Erstgespräch', 'Beratung', 'anrufen', 'E-Mail', 'Telefonnummer', 'Adresse', 'kennenlernen', 'Anfrage', 'Rückruf', 'melden'],
    phrases: ['Ich möchte mit euch sprechen', 'Wie erreiche ich euch', 'Termin vereinbaren', 'Gespräch anfragen', 'Angebot anfordern'],
    weight: 1,
  },
  '/ueber-uns': {
    label: 'Über uns',
    kind: 'unternehmen',
    terms: ['Team', 'Gründer', 'Lazar Popovic', 'Djordje Popovic', 'Geschichte', 'Werte', 'Ansprechpartner', 'Firma'],
    phrases: ['Wer seid ihr', 'Wer steckt dahinter', 'Wer ist Cogniiq'],
    weight: 0.8,
  },
  '/faq': {
    label: 'Häufige Fragen',
    kind: 'unternehmen',
    terms: ['FAQ', 'Fragen', 'Antworten', 'Ablauf', 'Dauer', 'wie lange', 'wie schnell', 'realistisch', 'Projektstart'],
    phrases: ['Wie läuft ein Projekt ab', 'Wie lange dauert es', 'Häufige Fragen'],
    weight: 0.8,
  },
  '/praxen': {
    label: 'Telefonassistent für Praxen',
    kind: 'branche',
    terms: ['Praxisempfang', 'Stimmauswahl', 'Übergabe', 'Kontingent', 'Freigabe', 'Stoßzeiten', 'Patienten'],
    phrases: ['Keiner geht ans Telefon', 'Patienten kommen nicht durch', 'Anmeldung ständig unterbrochen', 'Telefon in der Praxis entlasten'],
    weight: 1,
  },
  '/ki-telefonassistent': {
    label: 'KI-Telefonassistent',
    kind: 'leistung',
    terms: ['Übersicht', 'Funktionen', 'wie funktioniert'],
    phrases: ['Anrufe automatisch annehmen', 'KI geht ans Telefon', 'Telefon rund um die Uhr erreichbar'],
    weight: 1,
  },
  '/webdesign': {
    label: 'Webdesign',
    kind: 'leistung',
    terms: ['Übersicht', 'Ablauf'],
    phrases: ['Ich brauche eine neue Website', 'Website erstellen lassen', 'Website die Anfragen bringt'],
    weight: 1,
  },
  '/prozessautomatisierung': {
    label: 'Prozessautomatisierung',
    kind: 'leistung',
    terms: ['Übersicht', 'Beispiele', 'Ablauf'],
    phrases: ['Abläufe automatisieren', 'Weniger manuelle Arbeit', 'Prozesse digitalisieren'],
    weight: 1,
  },
  '/ki-telefonassistent/demo': {
    label: 'Demo des Telefonassistenten',
    kind: 'unternehmen',
    terms: ['Demo', 'Vorführung', 'ausprobieren', 'testen', 'anhören', 'Stimme', 'Hörprobe', 'live', 'Beispielanruf'],
    phrases: ['Kann ich das testen', 'Demo anfragen', 'Wie klingt der Assistent'],
    weight: 0.9,
  },
  '/ki-telefonassistent-einfuehren': {
    label: 'Telefonassistent einführen',
    kind: 'ratgeber',
    terms: ['Einführung', 'einführen', 'Umstellung', 'Team', 'Ablauf', 'Schritte', 'Start', 'Testphase'],
    phrases: ['Wie führe ich den Assistenten ein', 'Wie startet man'],
  },
  '/ki-telefonassistent-zahnarztpraxis': {
    kind: 'branche',
    terms: ['Grenzen', 'Notfall', 'Schmerzpatienten'],
  },
  '/webdesign-agentur-deutschland': { kind: 'leistung', terms: ['Agentur', 'bundesweit', 'remote'] },
  '/ki-agentur-deutschland': { kind: 'leistung', terms: ['KI-Agentur', 'AI Agentur', 'künstliche Intelligenz', 'KI-Systeme', 'bundesweit'] },
  '/kosten-webdesign': {
    label: 'Was kostet eine Website?',
    kind: 'preise',
    terms: ['Webdesign Kosten', 'Website Preis', 'Preistreiber', 'Pauschale', 'Festpreis'],
    phrases: ['Was kostet eine Website', 'Was kostet Webdesign', 'Wie teuer ist eine Homepage'],
    weight: 0.95,
  },
  '/kosten-ki-telefonassistent': {
    label: 'Was kostet der Telefonassistent?',
    kind: 'preise',
    terms: ['Telefonassistent Kosten', 'monatliche Kosten', 'Minutenpreis', 'Kontingent', 'Rechner'],
    phrases: ['Was kostet ein KI-Telefonassistent', 'Was kostet der Telefonassistent', 'Preis Telefonassistent'],
    weight: 0.95,
  },
  '/kosten-automatisierung': {
    label: 'Was kostet Automatisierung?',
    kind: 'preise',
    terms: ['Automatisierung Kosten', 'Preistreiber', 'Rechner', 'Amortisation'],
    phrases: ['Was kostet Prozessautomatisierung', 'Was kostet Automatisierung'],
    weight: 0.95,
  },
  '/verpasste-anrufe-verlust': {
    label: 'Verpasste Anrufe',
    kind: 'problem',
    terms: ['verpasste Anrufe', 'verlorene Anrufe', 'entgangene Anrufe', 'nicht erreichbar', 'besetzt', 'Umsatzverlust', 'Anrufe gehen verloren'],
    phrases: ['Anrufe gehen verloren', 'Wir verpassen Anrufe', 'Niemand geht ans Telefon', 'Kunden erreichen uns nicht', 'Telefon ständig besetzt'],
    weight: 0.9,
  },
  '/keine-anfragen-website': {
    label: 'Website bringt keine Anfragen',
    kind: 'problem',
    terms: ['keine Anfragen', 'keine Kunden', 'keine Leads', 'Website funktioniert nicht', 'niemand meldet sich', 'Konversion'],
    phrases: ['Meine Website bringt keine Anfragen', 'Über die Website kommt nichts', 'Website bringt keine Kunden'],
    weight: 0.9,
  },
  '/keine-terminbuchung-online': {
    label: 'Keine Online-Terminbuchung',
    kind: 'problem',
    terms: ['Terminbuchung', 'Online-Termine', 'Terminvergabe', 'Buchung online', 'Kalender', 'Termin buchen'],
    phrases: ['Kunden können keine Termine online buchen', 'Terminbuchung online anbieten'],
    weight: 0.9,
  },
  '/zu-viel-manuelle-arbeit': {
    label: 'Zu viel manuelle Arbeit',
    kind: 'problem',
    terms: ['manuelle Arbeit', 'Handarbeit', 'Routine', 'Papierkram', 'Zettel', 'Excel', 'Überstunden', 'Zeitfresser'],
    phrases: ['Wir haben zu viel manuelle Arbeit', 'Alles läuft per Hand', 'Zu viel Verwaltung'],
    weight: 0.9,
  },
  '/digitale-automatisierung-unternehmen': {
    label: 'Digitale Automatisierung',
    kind: 'problem',
    terms: ['digital', 'Digitalisierung', 'Einstieg', 'sofort einsetzbar', 'praxisnah'],
    phrases: ['Wo fange ich mit Digitalisierung an'],
  },
  '/blog': {
    label: 'Blog',
    kind: 'ratgeber',
    terms: ['Blog', 'Artikel', 'Ratgeber', 'Wissen', 'Beiträge', 'lesen'],
    weight: 0.7,
  },
  '/impressum': { label: 'Impressum', kind: 'rechtliches', terms: ['Impressum', 'Anbieterkennzeichnung', 'Anschrift', 'Verantwortlich'], weight: 0.3 },
  '/datenschutz': { label: 'Datenschutzerklärung', kind: 'rechtliches', terms: ['Datenschutzerklärung', 'Cookies', 'Einwilligung', 'Rechte', 'DSGVO'], weight: 0.3 },
};

/**
 * Seiten, die in der Suche nichts verloren haben. Nicht indexierbare Routen
 * (Dankeseite, Grundgerüste ohne geprüften Fachinhalt) fallen bereits im Index
 * heraus — das Manifest trifft diese Entscheidung, nicht die Suche.
 */
export const EXCLUDED_PATHS: ReadonlySet<string> = new Set(['/anfrage-erhalten']);

/**
 * Beispielfragen im Leerzustand. Sie zeigen, dass ganze Sätze erlaubt sind —
 * ein einzelnes Wort versteht die Suche genauso.
 */
export const EXAMPLE_QUERIES: readonly string[] = [
  'Anrufe gehen verloren',
  'Was kostet eine Website?',
  'Telefonassistent für Zahnarztpraxis',
  'Webdesign in München',
  'Zu viel manuelle Arbeit',
  'Ist das DSGVO-konform?',
];
