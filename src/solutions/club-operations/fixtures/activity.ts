// Fictional audit trail.
//
// Action codes are the ones the reference system records, so the protocol reads identically to the
// one staff know. Every entry references something that exists elsewhere in the fixture set.
//
// The reference model stores actor e-mail, IP address and user agent. All three are dropped: they
// are personal and network-identifying data with no read-only value here. An actor *role* is kept,
// which is what a reader of an audit trail actually needs.

import type { ActivityRecord } from '../types';

export const fixtureActivityRecords: ActivityRecord[] = [
  { id: 'log-0001', occurredAt: '2026-03-30T18:02:00+02:00', category: 'booking', actionCode: 'VIEW_BOOKINGS', actorType: 'admin', actorRole: 'Buchungs Admin', summary: 'Buchungsliste für März 2026 geöffnet', entityLabel: 'Buchungen März 2026', relatedReference: null },
  { id: 'log-0002', occurredAt: '2026-03-27T18:12:00+01:00', category: 'refund', actionCode: 'PAYMENT_REFUNDED', actorType: 'system', actorRole: 'System', summary: 'Erstattung zu BU-2127 durch Zahlungsanbieter bestätigt', entityLabel: 'Zahlung ZA-3038', relatedReference: 'BU-2127' },
  { id: 'log-0003', occurredAt: '2026-03-27T18:11:00+01:00', category: 'system', actionCode: 'ALERT_RAISED', actorType: 'system', actorRole: 'System', summary: 'Warnung erzeugt: aktive Buchung wurde erstattet', entityLabel: 'Warnung alr-0001', relatedReference: 'BU-2127' },
  { id: 'log-0004', occurredAt: '2026-03-26T09:12:00+01:00', category: 'invoice', actionCode: 'INVOICE_SENT', actorType: 'admin', actorRole: 'Finanz Admin', summary: 'Rechnung RE-2026-0038 an Kundin versendet', entityLabel: 'Rechnung RE-2026-0038', relatedReference: 'BU-2125' },
  { id: 'log-0005', occurredAt: '2026-03-26T09:08:00+01:00', category: 'invoice', actionCode: 'INVOICE_CREATED', actorType: 'admin', actorRole: 'Finanz Admin', summary: 'Rechnung RE-2026-0038 als Entwurf erstellt', entityLabel: 'Rechnung RE-2026-0038', relatedReference: 'BU-2125' },
  { id: 'log-0006', occurredAt: '2026-03-24T11:40:00+01:00', category: 'report', actionCode: 'EXPORT_PDF', actorType: 'admin', actorRole: 'Vorstand', summary: 'Finanzbericht für März 2026 als PDF exportiert', entityLabel: 'Bericht März 2026', relatedReference: null },
  { id: 'log-0007', occurredAt: '2026-03-24T11:38:00+01:00', category: 'report', actionCode: 'VIEW_REPORT', actorType: 'admin', actorRole: 'Vorstand', summary: 'Finanzbericht für März 2026 geöffnet', entityLabel: 'Bericht März 2026', relatedReference: null },
  { id: 'log-0008', occurredAt: '2026-03-20T19:05:00+01:00', category: 'voucher', actionCode: 'UPDATE_VOUCHER', actorType: 'customer', actorRole: 'Kunde', summary: 'Gutschein GS-2026-0002 mit 36,00 € für BU-2123 eingelöst', entityLabel: 'Gutschein GS-2026-0002', relatedReference: 'BU-2123' },
  { id: 'log-0009', occurredAt: '2026-03-19T17:52:00+01:00', category: 'system', actionCode: 'ALERT_RAISED', actorType: 'system', actorRole: 'System', summary: 'Warnung erzeugt: Zahlung ohne zugehörige Buchung', entityLabel: 'Warnung alr-0002', relatedReference: 'ZA-3906' },
  { id: 'log-0010', occurredAt: '2026-03-17T09:15:00+01:00', category: 'tax', actionCode: 'SET_TAX_OVERRIDE', actorType: 'admin', actorRole: 'Finanz Admin', summary: 'Steuerkategorie für BU-2121 auf Nichtmitglied 19 % gesetzt', entityLabel: 'Buchung BU-2121', relatedReference: 'BU-2121' },
  { id: 'log-0011', occurredAt: '2026-03-14T15:05:00+01:00', category: 'booking', actionCode: 'BOOKING_CANCELLED', actorType: 'customer', actorRole: 'Kunde', summary: 'Buchung BU-2120 durch Kunden storniert', entityLabel: 'Buchung BU-2120', relatedReference: 'BU-2120' },
  { id: 'log-0012', occurredAt: '2026-03-11T09:32:00+01:00', category: 'voucher', actionCode: 'UPDATE_VOUCHER', actorType: 'customer', actorRole: 'Kunde', summary: 'Gutschein GS-2026-0003 vollständig eingelöst', entityLabel: 'Gutschein GS-2026-0003', relatedReference: 'BU-2117' },
  { id: 'log-0013', occurredAt: '2026-03-06T11:36:00+01:00', category: 'payment', actionCode: 'VIEW_PAYMENTS', actorType: 'admin', actorRole: 'Finanz Admin', summary: 'Zahlungsübersicht nach fehlgeschlagener Gutscheinzahlung geöffnet', entityLabel: 'Zahlungen März 2026', relatedReference: 'ZA-3904' },
  { id: 'log-0014', occurredAt: '2026-03-05T08:12:00+01:00', category: 'booking', actionCode: 'BOOKING_CANCELLED', actorType: 'system', actorRole: 'System', summary: 'Doppelbuchung BU-2047 automatisch storniert und erstattet', entityLabel: 'Buchung BU-2047', relatedReference: 'BU-2047' },
  { id: 'log-0015', occurredAt: '2026-03-02T14:05:00+01:00', category: 'invoice', actionCode: 'INVOICE_CREATED', actorType: 'admin', actorRole: 'Finanz Admin', summary: 'Rechnung RE-2026-0037 als uneinbringlich eingestuft', entityLabel: 'Rechnung RE-2026-0037', relatedReference: 'BU-2102' },
  { id: 'log-0016', occurredAt: '2026-03-01T10:00:00+01:00', category: 'report', actionCode: 'GENERATE_MONTHLY_REPORT', actorType: 'admin', actorRole: 'Vorstand', summary: 'Monatsbericht Februar 2026 erstellt', entityLabel: 'Monatsbericht 2026-02', relatedReference: null },
  { id: 'log-0017', occurredAt: '2026-02-26T18:05:00+01:00', category: 'payment', actionCode: 'VIEW_PAYMENTS', actorType: 'admin', actorRole: 'Finanz Admin', summary: 'Offene Zahlung zu BU-2114 geprüft', entityLabel: 'Buchung BU-2114', relatedReference: 'BU-2114' },
  { id: 'log-0018', occurredAt: '2026-02-20T16:50:00+01:00', category: 'voucher', actionCode: 'CREATE_VOUCHER', actorType: 'customer', actorRole: 'Kunde', summary: 'Gutschein GS-2026-0003 über 20,00 € gekauft', entityLabel: 'Gutschein GS-2026-0003', relatedReference: 'ZA-3903' },
  { id: 'log-0019', occurredAt: '2026-02-15T19:10:00+01:00', category: 'refund', actionCode: 'PAYMENT_REFUNDED', actorType: 'admin', actorRole: 'Finanz Admin', summary: 'Erstattung zu BU-2109 nach Kundenstornierung ausgelöst', entityLabel: 'Buchung BU-2109', relatedReference: 'BU-2109' },
  { id: 'log-0020', occurredAt: '2026-02-10T08:30:00+01:00', category: 'member', actionCode: 'VIEW_BOOKINGS', actorType: 'admin', actorRole: 'Super Admin', summary: 'Mitgliederliste zur Prüfung der Padel-Mitgliedschaften geöffnet', entityLabel: 'Mitglieder', relatedReference: null },
  { id: 'log-0021', occurredAt: '2026-02-05T13:20:00+01:00', category: 'tax', actionCode: 'REMOVE_TAX_OVERRIDE', actorType: 'admin', actorRole: 'Finanz Admin', summary: 'Manuelle Steuerkategorie für BU-2102 entfernt', entityLabel: 'Buchung BU-2102', relatedReference: 'BU-2102' },
  { id: 'log-0022', occurredAt: '2026-02-01T09:00:00+01:00', category: 'report', actionCode: 'EXPORT_CSV', actorType: 'admin', actorRole: 'Vorstand', summary: 'Buchungsexport für Januar 2026 als CSV erzeugt', entityLabel: 'Bericht Januar 2026', relatedReference: null },
];
