// Complex local-only premium-offer fixture (Pankofer-style): 8 project modules, long
// introduction, multiple deliverables per module, €80,000 net / 19 % VAT / €95,200 gross,
// 30/40/30 payment schedule, assumptions, exclusions, a multi-phase timeline and a closing.
// Used ONLY to render + visually inspect the premium PDF locally. NEVER inserted into any
// database. `isDraft` is a parameter so the draft-watermark path can be exercised too.

function line(title, netCents, details, deliverables, phase, duration) {
  const vat = Math.round((netCents * 1900) / 10000);
  return {
    description: title, details, deliverables,
    phaseLabel: phase, durationLabel: duration,
    quantityMilli: 1000, unit: 'Pauschal', unitPriceCents: netCents,
    vatRateBp: 1900, vatTreatment: 'standard',
    netCents, vatCents: vat, grossCents: netCents + vat, isOptional: false,
  };
}

const modules = [
  line('Digitale Montageplanung und Monteur-Kommunikation', 1200000,
    'Entwicklung einer zentralen Wochen- und Einsatzplanung für Monteure inklusive mobiler Nutzung. Die Planung ersetzt die bisherigen Excel-Listen und schafft eine verbindliche, tagesaktuelle Sicht auf alle Einsätze.',
    ['Wochenplan je Monteur', 'Mobile Nutzung auf Tablets', 'Arbeitszeit- und Materialerfassung', 'Digitale Kundenbestätigung vor Ort'],
    'Phase 2', '4 Wochen'),
  line('Zentrale Auftrags- und Projektdatenbank', 1000000,
    'Aufbau einer gemeinsamen Datenbasis für Aufträge, Kunden, Objekte und Dokumente. Alle Abteilungen arbeiten künftig auf denselben, konsistenten Stammdaten.',
    ['Einheitliche Auftragsakte', 'Dokumenten-Upload je Projekt', 'Volltextsuche über alle Aufträge'],
    'Phase 1', '3 Wochen'),
  line('Angebots- und Kalkulationsmodul', 1000000,
    'Digitale Angebotserstellung mit hinterlegten Preis- und Materialkatalogen sowie automatischer Kalkulation von Deckungsbeiträgen.',
    ['Angebotsvorlagen', 'Material- und Lohnkalkulation', 'Automatische Margenberechnung', 'PDF-Export im Corporate Design'],
    'Phase 2', '3 Wochen'),
  line('Materialwirtschaft und Bestellwesen', 900000,
    'Anbindung der Materialwirtschaft an die Auftragsplanung, damit Bestellungen projektbezogen ausgelöst und Lieferungen nachverfolgt werden können.',
    ['Projektbezogene Bestellungen', 'Lieferstatus-Tracking', 'Inventurunterstützung'],
    'Phase 3', '4 Wochen'),
  line('Zeiterfassung und Lohnvorbereitung', 1100000,
    'Mobile Zeiterfassung der Monteure mit direkter Übergabe der geleisteten Stunden an die Lohnvorbereitung. Zuschläge und Fahrtzeiten werden regelbasiert berücksichtigt.',
    ['Mobile Stundenerfassung', 'Zuschlags- und Fahrtzeitregeln', 'Export an die Lohnbuchhaltung', 'Monatsauswertung je Mitarbeiter'],
    'Phase 3', '3 Wochen'),
  line('Kunden- und Serviceportal', 800000,
    'Ein schlankes Portal, über das Kunden Termine einsehen, Dokumente abrufen und Serviceanfragen stellen können.',
    ['Terminübersicht für Kunden', 'Dokumentenabruf', 'Serviceanfragen mit Statusverfolgung'],
    'Phase 4', '3 Wochen'),
  line('Auswertungen und Management-Dashboard', 1000000,
    'Verdichtete Kennzahlen zu Auslastung, Umsatz, offenen Aufträgen und Materialkosten in einem übersichtlichen Dashboard für die Geschäftsführung.',
    ['Auslastungs- und Umsatzkennzahlen', 'Offene-Posten-Übersicht', 'Exportierbare Monatsberichte'],
    'Phase 4', '2 Wochen'),
  line('Schulung, Einführung und Hypercare', 1000000,
    'Begleitete Einführung mit Schulungen für alle Nutzergruppen sowie eine intensive Betreuungsphase nach dem Go-Live.',
    ['Rollenbasierte Schulungen', 'Handbuch und Kurzanleitungen', 'Vier Wochen Hypercare-Support', 'Abschluss-Review mit Optimierungen'],
    'Phase 5', '4 Wochen'),
];

const optionalModule = {
  description: 'Optionale Schnittstelle zur Finanzbuchhaltung (DATEV)', details:
    'Automatischer Export der Ausgangsrechnungen und Belege an DATEV. Als Option ausgewiesen und nicht Teil des Investitionsvolumens.',
  deliverables: ['DATEV-Belegexport', 'Kontenzuordnung', 'Monatlicher Abgleich'],
  phaseLabel: 'Optional', durationLabel: '2 Wochen',
  quantityMilli: 1000, unit: 'Pauschal', unitPriceCents: 600000, vatRateBp: 1900, vatTreatment: 'standard',
  netCents: 600000, vatCents: 114000, grossCents: 714000, isOptional: true,
};

export function buildFixtureDoc({ isDraft = false } = {}) {
  const base = modules;
  const net = base.reduce((s, l) => s + l.netCents, 0);
  const vat = base.reduce((s, l) => s + l.vatCents, 0);
  return {
    kind: 'offer', language: 'de',
    documentNumber: isDraft ? null : 'AN-2026-0042',
    title: 'Digitalisierung der Auftrags- und Montageabwicklung',
    subtitle: 'Ein integriertes Betriebssystem für Planung, Montage und Service',
    valueProposition: 'Wir bündeln Auftragsplanung, Montage, Materialwirtschaft und Auswertung in einer durchgängigen Lösung — weniger manueller Aufwand, transparente Planung und eine zentrale Daten- und Dokumentenbasis.',
    brandAccent: '#0F766E',
    templateKey: 'cogniiq-premium-offer-v2',
    seller: {
      name: 'Cogniiq UG (haftungsbeschränkt)', addressLines: ['Beispielstraße 1', '10115 Berlin'],
      email: 'info@cogniiq.de', phone: '+49 30 1234567', website: 'www.cogniiq.de', vatId: 'DE123456789',
    },
    recipient: {
      name: 'Pankofer Montagen GmbH', contactName: 'Herr Josef Pankofer', department: 'Geschäftsführung',
      addressLines: ['Industriestraße 12', '84359 Simbach am Inn'], email: 'kontakt@pankofer.test', vatId: 'DE987654321',
    },
    issueDate: '2026-07-22', validUntil: '2026-08-31',
    currency: 'EUR',
    introduction:
      'Sehr geehrter Herr Pankofer,\n\nvielen Dank für das offene und detaillierte Gespräch über die aktuellen Abläufe in Ihrem Betrieb. Ihre Montageplanung, die Kommunikation mit den Monteuren und die Nachverfolgung von Material und Zeiten erfolgen heute überwiegend manuell und in getrennten Systemen. Das kostet Zeit, führt zu Doppelerfassungen und erschwert einen verlässlichen Überblick über laufende Aufträge.\n\nMit diesem Angebot schlagen wir eine schrittweise, in fünf Phasen gegliederte Digitalisierung vor, die genau an diesen Punkten ansetzt und Ihren Betrieb ohne Bruch in den laufenden Betrieb überführt.',
    projectApproach:
      'Wir gehen modular und risikoarm vor: Jede Phase liefert einen eigenständigen Nutzen und baut auf der vorherigen auf. So sehen Sie früh erste Ergebnisse, und Ihr Team wächst schrittweise in die neue Arbeitsweise hinein. Zielbild ist ein durchgängiger Fluss vom Auftrag über die Montageplanung bis zur Auswertung — ohne Medienbrüche.',
    executiveSummary:
      'Das Projekt umfasst acht aufeinander abgestimmte Module, die in rund fünf bis acht Monaten umgesetzt werden. Das Investitionsvolumen beträgt 80.000 € netto. Ergebnis ist eine zentrale, mobil nutzbare Plattform, die manuelle Arbeit reduziert, die Planung transparent macht und belastbare Kennzahlen für die Geschäftsführung liefert.',
    desiredOutcomes: [
      'Weniger manueller Verwaltungsaufwand in Planung und Abrechnung',
      'Transparente Auftrags- und Montageplanung in Echtzeit',
      'Zentrale Daten- und Dokumentenbasis für alle Abteilungen',
      'Belastbare Kennzahlen für fundierte Entscheidungen',
    ],
    lines: [...base, optionalModule],
    netTotalCents: net, vatTotalCents: vat, grossTotalCents: net + vat,
    timeline: [
      { phase: 'Phase 1', title: 'Analyse & zentrale Datenbasis', duration: '3 Wochen', description: 'Aufnahme der Prozesse und Aufbau der gemeinsamen Auftrags- und Stammdatenbank.' },
      { phase: 'Phase 2', title: 'Planung & Angebotswesen', duration: '4 Wochen', description: 'Montageplanung, Monteur-Kommunikation und digitales Angebots- und Kalkulationsmodul.' },
      { phase: 'Phase 3', title: 'Material & Zeiten', duration: '4 Wochen', description: 'Materialwirtschaft, Bestellwesen sowie mobile Zeiterfassung und Lohnvorbereitung.' },
      { phase: 'Phase 4', title: 'Portal & Auswertung', duration: '3 Wochen', description: 'Kunden- und Serviceportal sowie Management-Dashboard.' },
      { phase: 'Phase 5', title: 'Einführung & Hypercare', duration: '4 Wochen', description: 'Schulung, begleiteter Go-Live und intensive Betreuung.' },
    ],
    deliveryTerms:
      'Für einen reibungslosen Ablauf benötigen wir je Phase einen festen Ansprechpartner auf Ihrer Seite, Zugang zu den relevanten Bestandsdaten sowie die Teilnahme der Key-User an den vorgesehenen Abstimmungs- und Schulungsterminen.',
    paymentSchedule: [
      { label: 'Bei Auftragserteilung', percentageBp: 3000 },
      { label: 'Nach Fertigstellung der Kernmodule', percentageBp: 4000 },
      { label: 'Nach Abnahme', percentageBp: 3000 },
    ],
    paymentTerms: 'Zahlbar jeweils 14 Tage netto nach Rechnungsstellung. Alle Beträge verstehen sich zzgl. der gesetzlichen Umsatzsteuer.',
    assumptions:
      'Die bestehende IT-Infrastruktur (Internetanbindung, Tablets für die Monteure) wird bereitgestellt. Vorhandene Stammdaten liegen in exportierbarer Form vor. Die Umsetzung erfolgt remote mit Vor-Ort-Terminen zu den Schulungen.',
    exclusions:
      'Nicht enthalten sind die Beschaffung von Hardware, die laufenden Lizenzkosten für Drittsysteme sowie individuelle Anpassungen, die über den beschriebenen Leistungsumfang hinausgehen. Diese werden bei Bedarf gesondert angeboten.',
    closing:
      'Wir sind überzeugt, dass diese Lösung Ihren Betrieb spürbar entlastet und freuen uns darauf, Sie auf diesem Weg zu begleiten. Für Rückfragen stehen wir Ihnen jederzeit gern zur Verfügung.',
    nextSteps:
      'Nach Ihrer Online-Annahme stimmen wir gemeinsam den Projektstart und die erste Konzeptionsphase ab und benennen die Ansprechpartner für Phase 1.',
    footer: 'Cogniiq UG (haftungsbeschränkt) · Beispielstraße 1 · 10115 Berlin · info@cogniiq.de · USt-IdNr. DE123456789',
    isDraft,
    templateVersion: 'transactional-v1',
  };
}
