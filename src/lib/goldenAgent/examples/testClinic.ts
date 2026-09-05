// Golden Agent — generic evaluation fixture ("Test Clinic").
//
// A neutral, fully configured customer used by the evaluation suite and the DEV agent. It has two
// locations, three services, FAQs, escalation and emergency policy — enough to exercise every
// scenario category without any real customer's data. Nothing in here is a real business.

import type { ClientConfig } from '../clientConfig.ts';

export const TEST_CLINIC_CLIENT_ID = '00000000-0000-4000-8000-000000000001';

export function testClinicConfig(overrides: Partial<ClientConfig> = {}): ClientConfig {
  return {
    schemaVersion: 1,
    clientId: TEST_CLINIC_CLIENT_ID,
    companyName: 'Praxis Musterstadt',
    spokenName: 'Praxis Musterstadt',
    industry: 'Arztpraxis',
    website: 'https://praxis-musterstadt.example',
    stage: 'evaluation',
    primaryLanguage: 'de',
    additionalLanguages: ['en'],
    timezone: 'Europe/Berlin',
    locations: [
      {
        id: 'zentrum',
        name: 'Praxis Zentrum',
        address: { street: 'Hauptstraße 1', postalCode: '12345', city: 'Musterstadt', parking: 'Parkhaus Markt, erste Stunde frei', publicTransport: 'Haltestelle Markt, Linien 3 und 7' },
        hours: { mon: [{ open: '08:00', close: '18:00' }], tue: [{ open: '08:00', close: '18:00' }], wed: [{ open: '08:00', close: '13:00' }], thu: [{ open: '08:00', close: '18:00' }], fri: [{ open: '08:00', close: '14:00' }] },
        specialClosures: [{ from: '2026-10-03', reason: 'Tag der Deutschen Einheit' }, { from: '2026-12-24', to: '2026-12-26', reason: 'Weihnachten' }],
      },
      {
        id: 'nord',
        name: 'Praxis Nord',
        address: { street: 'Nordring 20', postalCode: '12347', city: 'Musterstadt', parking: 'Kostenlose Parkplätze vor dem Haus' },
        hours: { mon: [{ open: '09:00', close: '17:00' }], wed: [{ open: '09:00', close: '17:00' }], fri: [{ open: '09:00', close: '12:00' }] },
        serviceIds: ['erstgespraech', 'kontrolle'],
      },
    ],
    services: [
      { id: 'erstgespraech', name: 'Erstgespräch', aliases: ['erster termin', 'neuaufnahme', 'ersttermin'], durationMinutes: 30, bookable: true, newCallersAllowed: true, requirements: ['Versichertenkarte', 'Überweisung, falls vorhanden'] },
      { id: 'kontrolle', name: 'Kontrolltermin', aliases: ['kontrolle', 'nachsorge', 'nachkontrolle'], durationMinutes: 15, bookable: true, newCallersAllowed: false, requirements: ['Versichertenkarte'] },
      { id: 'labor', name: 'Blutabnahme', aliases: ['blut abnehmen', 'labor', 'blutentnahme'], durationMinutes: 15, bookable: true, newCallersAllowed: false, requirements: ['nüchtern erscheinen'], priceText: 'für Kassenpatienten kostenfrei' },
      { id: 'op-beratung', name: 'OP-Beratung', aliases: ['operation', 'op'], durationMinutes: 45, bookable: false, description: 'Wird ausschließlich nach ärztlicher Rücksprache vergeben.' },
    ],
    providers: [{ id: 'dr-mueller', name: 'Müller', title: 'Dr. med.', serviceIds: ['erstgespraech', 'kontrolle'], locationIds: ['zentrum'] }],
    bookingRules: { minNoticeHours: 2, maxAdvanceDays: 60, maxAlternativesSpoken: 3, requiredCallerFields: ['firstName', 'lastName', 'dateOfBirth', 'phone'], allowDuplicateFutureBookings: false },
    cancellationRules: { minNoticeHours: 24, callerMayCancel: true, callerMayReschedule: true, lateCancellationText: 'Bitte beachten Sie, dass kurzfristige Absagen anderen Patienten den Termin nehmen.' },
    identityVerification: { requiredFields: ['lastName', 'dateOfBirth'] },
    faqs: [
      { id: 'parken', question: 'Wo kann ich parken?', answer: 'Am Standort Zentrum im Parkhaus Markt, die erste Stunde ist frei. In der Praxis Nord gibt es kostenlose Parkplätze vor dem Haus.', variants: ['Gibt es Parkplätze?', 'Parkmöglichkeiten'] },
      { id: 'nuechtern', question: 'Muss ich zur Blutabnahme nüchtern kommen?', answer: 'Ja, bitte kommen Sie nüchtern, das heißt mindestens acht Stunden nichts essen. Wasser dürfen Sie trinken.', variants: ['Darf ich vor der Blutabnahme etwas essen?'] },
      { id: 'ueberweisung', question: 'Brauche ich eine Überweisung?', answer: 'Für ein Erstgespräch ist keine Überweisung nötig, bringen Sie aber gerne eine mit, falls Sie eine haben.' },
      { id: 'rezept', question: 'Kann ich telefonisch ein Rezept bestellen?', answer: 'Rezeptwünsche nimmt das Team per Rückruf auf; sie werden nach ärztlicher Freigabe in der Regel innerhalb von zwei Werktagen bereitgestellt.', variants: ['Folgerezept', 'Rezept anfordern'] },
      { id: 'krankschreibung', question: 'Kann ich eine Krankschreibung telefonisch bekommen?', answer: 'Eine Krankschreibung ist nur nach ärztlicher Einschätzung möglich. Ich kann Ihnen einen Termin oder einen Rückruf durch das Team anbieten.', variants: ['AU', 'Arbeitsunfähigkeit'] },
    ],
    escalationContacts: [
      { id: 'empfang', label: 'dem Praxisteam', phone: '+4930123456', when: 'Allgemeine Rückfragen, Beschwerden, Rezeptwünsche, medizinische Fragen', availableHours: { mon: [{ open: '08:00', close: '18:00' }], tue: [{ open: '08:00', close: '18:00' }], wed: [{ open: '08:00', close: '13:00' }], thu: [{ open: '08:00', close: '18:00' }], fri: [{ open: '08:00', close: '14:00' }] } },
      { id: 'abrechnung', label: 'der Abrechnung', email: 'abrechnung@praxis-musterstadt.example', when: 'Rechnungen, Erstattungen, Privatliquidation' },
    ],
    emergency: { message: 'Das klingt nach einem medizinischen Notfall. Bitte legen Sie auf und rufen Sie sofort die 112 an.', emergencyNumber: '112' },
    knowledgeSources: [{ id: 'website', kind: 'website', name: 'Praxis-Website', url: 'https://praxis-musterstadt.example', reviewed: true }],
    bookingIntegration: { provider: 'mock' },
    voice: { assistantName: 'Mia' },
    pronunciation: [{ text: 'Dr. Müller', spokenAs: 'Doktor Müller' }],
    confirmation: { readBackBeforeWrite: true, explicitYesForDestructive: true, offerWrittenConfirmation: true },
    scopeLimits: ['Keine medizinische Beratung, keine Diagnosen, keine Aussagen zu Medikamenten oder Befunden.', 'Keine Auskunft zu Laborwerten oder Befunden am Telefon.'],
    alwaysEscalateTopics: ['Befund', 'Laborwerte', 'Krankschreibung rückwirkend'],
    ...overrides,
  };
}
