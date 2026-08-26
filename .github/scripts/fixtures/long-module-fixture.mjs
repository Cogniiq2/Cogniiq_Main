// Deterministic fixtures for LONG project modules.
//
// Synthetic content on purpose: the real SV Heinersreuth offers (Admin, Admin Pro,
// Complete) are finalized customer documents and are never touched to create a test case.
// These reproduce the SHAPE that breaks the renderer — a single module whose deliverables
// and prose exceed what one A4 page can hold — without borrowing a word of real offer text.
//
// A) ADMIN_PRO_SIZED  one module that approaches a full page (22 deliverables + prose)
// B) COMPLETE_SIZED   one module that CANNOT fit on a page (60 deliverables + 4 paragraphs)
//
// Every deliverable string is unique and index-tagged, so a test can assert that each one
// appears EXACTLY once — which is how omission, duplication and clipping are detected.

const VAT_BP = 1900;

function money(netCents) {
  const vatCents = Math.round((netCents * VAT_BP) / 10000);
  return { netCents, vatCents, grossCents: netCents + vatCents };
}

function moduleLine({ title, netCents, details, deliverables, phase, duration, recurring }) {
  const m = money(netCents);
  return {
    description: title,
    details,
    deliverables,
    phaseLabel: phase ?? null,
    durationLabel: duration ?? null,
    quantityMilli: 1000,
    unit: recurring ? 'Monat' : 'Pauschal',
    unitPriceCents: netCents,
    vatRateBp: VAT_BP,
    vatTreatment: 'standard',
    ...m,
    isOptional: false,
    ...(recurring
      ? { pricingType: 'recurring', billingInterval: 'monthly', minimumTermMonths: 12,
          billingStartType: 'commissioning', billingStartLabel: null }
      : { pricingType: 'one_time', billingInterval: null, minimumTermMonths: null,
          billingStartType: null, billingStartLabel: null }),
  };
}

/** `count` unique, index-tagged deliverables of realistic German length. */
export function deliverables(prefix, count) {
  const subjects = [
    'Rollen- und Rechteverwaltung', 'Mandantenfähige Datenhaltung', 'Protokollierung aller Änderungen',
    'Automatischer Abgleich offener Vorgänge', 'Wiederkehrende Aufgaben mit Fristenkontrolle',
    'Serienbriefe und Sammelversand', 'Exportierbare Monatsauswertung', 'Freigabe-Workflow mit Vier-Augen-Prinzip',
    'Volltextsuche über alle Vorgänge', 'Konfigurierbare Benachrichtigungen',
  ];
  return Array.from({ length: count }, (_, i) =>
    `${prefix}-${String(i + 1).padStart(2, '0')} ${subjects[i % subjects.length]} `
    + `mit nachvollziehbarer Historie, revisionssicherer Ablage und einer je Rolle konfigurierbaren Sicht auf den Bearbeitungsstand`);
}

const PARA = (n) =>
  `Absatz ${n}: Dieser Abschnitt beschreibt den Leistungsumfang des Moduls im Detail und erläutert, `
  + `welche Arbeitsschritte enthalten sind, wie die Abnahme erfolgt und welche Mitwirkung der Auftraggeber `
  + `erbringt. Die Beschreibung ist bewusst ausführlich, damit der Umfang später nicht strittig ist und `
  + `jede Position eindeutig einer Phase des Projektplans zugeordnet werden kann.`;

function baseDoc(lines, { number, title }) {
  const committed = lines.filter((l) => !l.isOptional && l.pricingType !== 'recurring');
  const net = committed.reduce((s, l) => s + l.netCents, 0);
  const vat = committed.reduce((s, l) => s + l.vatCents, 0);
  return {
    kind: 'offer',
    language: 'de',
    documentNumber: number,
    title,
    subtitle: 'Regressionsfixture für lange Projektmodule',
    seller: {
      name: 'Cogniiq', addressLines: ['Am Main 3', '95444 Bayreuth'],
      email: 'info@cogniiq.de', website: 'https://cogniiq.de', vatId: 'DE460292419',
    },
    recipient: { name: 'Testkunde GmbH', contactName: 'Alex Muster', addressLines: ['Musterstadt'], email: 'alex.muster@example.test' },
    issueDate: '2026-08-26',
    validUntil: '2026-09-30',
    serviceDate: null,
    currency: 'EUR',
    introduction: 'Diese Fixture existiert ausschließlich, um die Seitenumbrüche langer Projektmodule zu prüfen.',
    executiveSummary: 'Ein einzelnes Modul überschreitet hier bewusst die Höhe einer A4-Seite.',
    projectApproach: 'Der Renderer muss den Modulinhalt über mehrere Seiten fortsetzen, ohne Inhalt zu verlieren.',
    desiredOutcomes: ['Kein überlappender Text', 'Kein abgeschnittener Text', 'Vollständige Leistungsliste'],
    scope: null,
    timeline: [{ phase: 'Umsetzung', title: null, duration: '6 Wochen', description: null }],
    paymentSchedule: [
      { label: 'Bei Auftragserteilung', percentageBp: 5000, amountCents: null, note: null },
      { label: 'Nach Übergabe', percentageBp: 5000, amountCents: null, note: null },
    ],
    nextSteps: 'Nach Annahme beginnt die technische Abstimmung.',
    paymentTerms: 'Zahlbar innerhalb von 14 Tagen ohne Abzug.',
    deliveryTerms: 'Die Übergabe erfolgt in einer bereitgestellten Testumgebung.',
    assumptions: 'Die bestehende Plattform bleibt erhalten.\nZugänge werden rechtzeitig bereitgestellt.',
    exclusions: 'Hardware und Drittlizenzen.\nSteuer- und Rechtsberatung.',
    lines,
    netTotalCents: net,
    vatTotalCents: vat,
    grossTotalCents: net + vat,
    footer: 'Cogniiq · Am Main 3, 95444 Bayreuth · info@cogniiq.de · USt-IdNr. DE460292419',
    isDraft: false,
    templateKey: 'cogniiq-premium-offer-v2',
    templateVersion: 'cogniiq-premium-offer-v2',
  };
}

export const ADMIN_PRO_DELIVERABLES = deliverables('APRO', 22);
export const COMPLETE_DELIVERABLES = deliverables('COMPL', 60);

/** A) One module that approaches a full page. */
export function buildAdminProSizedDoc() {
  return baseDoc([
    moduleLine({
      title: 'Erweiterter Verwaltungsbereich mit Rollen, Freigaben und Auswertungen',
      netCents: 690000,
      details: [PARA(1), PARA(2)].join('\n'),
      deliverables: ADMIN_PRO_DELIVERABLES,
      phase: 'Einrichtung', duration: 'ca. 3 Wochen',
    }),
    moduleLine({ title: 'Laufende Betreuung & Betrieb', netCents: 39000,
      details: 'Technische Betreuung nach Inbetriebnahme.',
      deliverables: ['Wartung', 'Fehlerbehebung'], recurring: true }),
  ], { number: 'TEST-ADMIN-PRO', title: 'Fixture: Admin-Pro-großes Modul' });
}

/** B) One module that CANNOT fit on a single page and must span several. */
export function buildCompleteSizedDoc() {
  return baseDoc([
    moduleLine({
      title: 'Gesamtplattform mit vollständiger Verwaltungs-, Auswertungs- und Betriebsfunktionalität',
      netCents: 2400000,
      details: [PARA(1), PARA(2), PARA(3), PARA(4)].join('\n'),
      deliverables: COMPLETE_DELIVERABLES,
      phase: 'Umsetzung', duration: 'ca. 10 Wochen',
    }),
    moduleLine({
      title: 'Zweites Modul nach dem überlangen Modul',
      netCents: 150000,
      details: 'Dieses Modul muss nach dem überlangen Modul korrekt positioniert bleiben.',
      deliverables: deliverables('NEXT', 4),
      phase: 'Abschluss', duration: '1 Woche',
    }),
    moduleLine({ title: 'Laufende Betreuung & Betrieb', netCents: 79000,
      details: 'Technische Betreuung nach Inbetriebnahme.',
      deliverables: ['Wartung', 'Monitoring'], recurring: true }),
  ], { number: 'TEST-COMPLETE', title: 'Fixture: Complete-großes Modul' });
}
