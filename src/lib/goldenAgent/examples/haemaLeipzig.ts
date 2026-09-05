// Golden Agent — example customer configuration: Haema Leipzig (DEV).
//
// This is the "customer #1 as configuration" proof: every fact that used to be hard-coded in the
// hand-written ElevenLabs prompt now lives in a ClientConfig, and the Golden Agent core stays
// generic. Facts were transcribed from the existing Haema agent prompt in the ElevenLabs workspace
// (centres, hours, donation types, compensation). Anything not verifiable there is left out.
//
// DEV only: booking provider is the mock until the customer's n8n workflow exposes the wire contract
// in adapters/n8nBookingProvider.ts. The clientId must be replaced by the customer's organization id.

import type { ClientConfig } from '../clientConfig.ts';

export const HAEMA_LEIPZIG_DEV_CLIENT_ID = '00000000-0000-4000-8000-000000000002';

const weekdayHours = { mon: [{ open: '07:30', close: '19:30' }], tue: [{ open: '07:30', close: '19:30' }], wed: [{ open: '07:30', close: '19:30' }], thu: [{ open: '07:30', close: '19:30' }], fri: [{ open: '07:30', close: '19:30' }] };

export function haemaLeipzigDevConfig(clientId: string = HAEMA_LEIPZIG_DEV_CLIENT_ID): ClientConfig {
  return {
    schemaVersion: 1,
    clientId,
    companyName: 'Haema Blut- und Plasmaspendezentren Leipzig',
    spokenName: 'Haema in Leipzig',
    industry: 'Blut- und Plasmaspende',
    website: 'https://www.haema.de/standorte/leipzig/',
    stage: 'dev',
    primaryLanguage: 'de',
    additionalLanguages: ['en'],
    timezone: 'Europe/Berlin',
    locations: [
      { id: 'leipzig-markt', name: 'Leipzig-Markt', address: { street: 'Markt 9', postalCode: '04109', city: 'Leipzig', directions: 'Zweite Etage des König-Albert-Hauses direkt am Markt', parking: 'Marktgalerie; Beteiligung an der ersten Parkstunde nach aktuellem Stand', publicTransport: 'Straßenbahn und S-Bahn am Markt' }, hours: weekdayHours },
      { id: 'leipzig-gohlis', name: 'Leipzig-Gohlis Arkaden', address: { street: 'Lützowstraße 11', postalCode: '04155', city: 'Leipzig', directions: 'Im Gebäudekomplex Gohlis Arkaden', parking: 'Tiefgarage Gohlis Arkaden, erste Stunde grundsätzlich kostenlos', publicTransport: 'Straßenbahn und S-Bahn Leipzig-Gohlis' }, hours: weekdayHours },
      { id: 'leipzig-connewitz', name: 'Leipzig-Connewitz', address: { street: 'Karl-Liebknecht-Straße 153–155', postalCode: '04277', city: 'Leipzig', directions: 'Direkt am Connewitzer Kreuz im Gebäude der Sparkasse', publicTransport: 'Straßenbahn und Bus, Connewitzer Kreuz' }, hours: weekdayHours, serviceIds: ['blutspende', 'plasmaspende', 'neuspender'] },
    ],
    services: [
      { id: 'neuspender', name: 'Erstspende / Neuspender-Aufnahme', aliases: ['erste spende', 'neuspender', 'zum ersten mal spenden'], durationMinutes: 90, bookable: true, newCallersAllowed: true, requirements: ['Gültiger Personalausweis (bei Reisepass zusätzlich Wohnortnachweis)', 'Ausreichend gegessen und getrunken', 'Mehr Zeit einplanen, etwa 1 bis 1,5 Stunden'], description: 'Beim ersten Besuch erfolgt die Aufnahme und medizinische Untersuchung. Ob direkt gespendet wird oder zuerst eine Laborkontrolle erfolgt, entscheidet das Team vor Ort.' },
      { id: 'blutspende', name: 'Vollblutspende', aliases: ['blutspende', 'blut spenden'], durationMinutes: 60, bookable: true, newCallersAllowed: false, requirements: ['Gültiger Personalausweis', 'Vorher ausreichend essen und trinken'], priceText: 'Aufwandsentschädigung nach aktuellem Stand 20 Euro' },
      { id: 'plasmaspende', name: 'Plasmaspende', aliases: ['plasma', 'plasma spenden'], durationMinutes: 90, bookable: true, newCallersAllowed: false, requirements: ['Gültiger Personalausweis', 'Fettarm essen, viel trinken'], priceText: 'Aufwandsentschädigung nach aktuellem Stand 25 Euro' },
      { id: 'thrombozyten', name: 'Thrombozytenspende', aliases: ['thrombozyten', 'blutplättchen'], durationMinutes: 120, bookable: true, newCallersAllowed: false, requirements: ['Zusätzliche medizinische Voraussetzungen, Entscheidung durch das medizinische Personal'], description: 'Nur in Leipzig-Markt und Leipzig-Gohlis.' },
    ],
    bookingRules: { minNoticeHours: 2, maxAdvanceDays: 90, maxAlternativesSpoken: 3, requiredCallerFields: ['firstName', 'lastName', 'dateOfBirth', 'phone'], allowDuplicateFutureBookings: false },
    cancellationRules: { minNoticeHours: 12, callerMayCancel: true, callerMayReschedule: true },
    identityVerification: { requiredFields: ['lastName', 'dateOfBirth'] },
    faqs: [
      { id: 'dauer-blut', question: 'Wie lange dauert eine Blutspende?', answer: 'Die Entnahme selbst dauert etwa 10 bis 15 Minuten. Mit Anmeldung, Voruntersuchung, Arztgespräch und Ruhezeit sollten Sie etwa eine Stunde einplanen, beim ersten Mal etwas mehr.' },
      { id: 'dauer-plasma', question: 'Wie lange dauert eine Plasmaspende?', answer: 'Der Plasma-Vorgang dauert etwa 30 bis 45 Minuten, insgesamt sollten Sie bis zu 1,5 Stunden einplanen.' },
      { id: 'voraussetzungen', question: 'Wer darf spenden?', answer: 'Grundsätzlich ab 18 Jahren, mindestens etwa 50 Kilogramm, gesund, fester Wohnsitz und ausreichende Deutschkenntnisse. Die endgültige Entscheidung trifft immer das medizinische Personal im Zentrum.' },
      { id: 'ausweis', question: 'Welchen Ausweis brauche ich?', answer: 'Einen gültigen Personalausweis. Bei einem Reisepass zusätzlich einen Wohnortnachweis. Führerschein, Studentenausweis oder Krankenkassenkarte reichen nicht.' },
      { id: 'vorbereitung', question: 'Wie bereite ich mich vor?', answer: 'Ausreichend schlafen, vorher mindestens 1,5 Liter alkoholfrei trinken, ausreichend und fettarm essen, zwölf Stunden vorher kein Alkohol, zwei Stunden vorher nicht rauchen.' },
      { id: 'abstand', question: 'Wie oft darf ich spenden?', answer: 'Plasma zu Plasma mindestens zwei spendefreie Tage, Vollblut bei Männern etwa acht und bei Frauen etwa zwölf Wochen. Für registrierte Spender prüft das Zentrum die persönliche Spendefähigkeit.' },
      { id: 'entschaedigung', question: 'Wie hoch ist die Aufwandsentschädigung?', answer: 'Nach aktuellem Stand 25 Euro für Plasma und 20 Euro für Blut. Aktionen und Boni wechseln; die aktuelle Aktion bestätigt das Zentrum.' },
      { id: 'tattoo', question: 'Ich habe ein neues Tattoo, darf ich spenden?', answer: 'Nach Tattoos oder Piercings gilt eine Sicherheitsfrist von etwa vier Monaten.' },
      { id: 'schwanger', question: 'Darf ich in der Schwangerschaft spenden?', answer: 'Während Schwangerschaft und Stillzeit ist keine Spende möglich, nach einer Geburt gilt eine Pause von mindestens sechs Monaten.' },
      { id: 'thrombo-standorte', question: 'Wo kann ich Thrombozyten spenden?', answer: 'In Leipzig-Markt und Leipzig-Gohlis, nicht in Connewitz.' },
    ],
    escalationContacts: [
      { id: 'zentrum', label: 'einem Mitarbeiter im Spendezentrum', when: 'Medizinische Einzelfragen, Beschwerden, Sonderfälle bei Ausweis oder Wohnsitz, aktuelle Aktionen', availableHours: weekdayHours },
    ],
    emergency: { message: 'Das klingt nach einem medizinischen Notfall. Bitte rufen Sie sofort die 112 an.', emergencyNumber: '112', additionalTriggers: ['Beschwerden nach einer Spende, die nicht offensichtlich lebensbedrohlich sind: zusätzlich das Zentrum informieren'] },
    knowledgeSources: [
      { id: 'website-leipzig', kind: 'website', name: 'Standortseite Leipzig', url: 'https://www.haema.de/standorte/leipzig/', reviewed: true },
    ],
    bookingIntegration: { provider: 'mock', options: { note: 'n8n_webhook once the customer workflow implements the wire contract' } },
    voice: { voiceId: 'cllvQaMvj0ZKxH88HGEn', assistantName: 'Chris', ttsModel: 'eleven_flash_v2_5' },
    pronunciation: [{ text: 'Haema', spokenAs: 'Hä-ma' }, { text: 'Apherese', spokenAs: 'A-fe-re-se' }],
    confirmation: { readBackBeforeWrite: true, explicitYesForDestructive: true, offerWrittenConfirmation: true, bookingSuccessSuffix: 'Bitte bringen Sie einen gültigen Ausweis mit und essen und trinken Sie vorher ausreichend.' },
    scopeLimits: [
      'Keine Diagnosen und niemals verbindlich zusagen oder ausschließen, dass jemand spenden darf; das entscheidet das medizinische Personal.',
      'Keine Aussagen zu Laborergebnissen oder individuellen Sperren.',
      'Keine Bonusbeträge oder Aktionen erfinden; nur konfigurierte oder vom Zentrum bestätigte Informationen nennen.',
    ],
    alwaysEscalateTopics: ['Medikamente', 'Reiserückkehr', 'Operation', 'Laborergebnis', 'Sperre'],
  };
}
