// Fictional invoices.
//
// Each invoice points at a real booking reference from the booking fixtures, and its net/VAT split
// is computed from that booking's own tax rate — so an invoice can never claim a VAT treatment the
// booking does not have.
//
// The reference system stores a hosted invoice URL, a PDF link, a dashboard link and a customer
// identifier. None of them are modelled: they are live external references.

import type { Invoice, InvoiceStatus } from '../types';
import { findBookingByReference } from './bookings';

/** Net and VAT split out of a gross amount at the given percent rate. */
export function splitGross(
  grossCents: number,
  ratePercent: number | null,
): { netCents: number; vatCents: number } {
  if (!ratePercent) return { netCents: grossCents, vatCents: 0 };
  const netCents = Math.round(grossCents / (1 + ratePercent / 100));
  return { netCents, vatCents: grossCents - netCents };
}

interface InvoiceSeed {
  number: string;
  bookingReference: string | null;
  customerName: string;
  grossCents: number;
  taxRatePercent: number | null;
  issuedAt: string;
  dueDate: string;
  sentAt: string | null;
  paidAt: string | null;
  voidedAt: string | null;
  status: InvoiceStatus;
  reason: string;
}

const invoiceSeeds: InvoiceSeed[] = [
  {
    number: 'RE-2026-0031',
    bookingReference: 'BU-2044',
    customerName: 'Friedrich-Wilhelm Baumgartner',
    grossCents: 4800,
    taxRatePercent: 19,
    issuedAt: '2026-03-03',
    dueDate: '2026-03-17',
    sentAt: '2026-03-03',
    paidAt: '2026-03-09',
    voidedAt: null,
    status: 'paid',
    reason: 'Platzmiete Padel 2, Nichtmitglied',
  },
  {
    number: 'RE-2026-0032',
    bookingReference: 'BU-2050',
    customerName: 'Sebastian Krautwurst',
    grossCents: 4800,
    taxRatePercent: null,
    issuedAt: '2026-03-07',
    dueDate: '2026-03-21',
    sentAt: '2026-03-07',
    paidAt: null,
    voidedAt: null,
    status: 'open',
    reason: 'Platzmiete Padel 1, Mitgliedschaft ungeklärt',
  },
  {
    number: 'RE-2026-0033',
    bookingReference: 'BU-2053',
    customerName: 'Wolfgang Tannenberger',
    grossCents: 4800,
    taxRatePercent: 19,
    issuedAt: '2026-02-10',
    dueDate: '2026-02-24',
    sentAt: '2026-02-10',
    paidAt: null,
    voidedAt: null,
    status: 'open',
    reason: 'Platzmiete Padel 2, Nichtmitglied',
  },
  {
    number: 'RE-2026-0034',
    bookingReference: 'BU-2116',
    customerName: 'Gunther Weissenberger',
    grossCents: 4800,
    taxRatePercent: 19,
    issuedAt: '2026-03-11',
    dueDate: '2026-03-25',
    sentAt: null,
    paidAt: null,
    voidedAt: null,
    status: 'draft',
    reason: 'Platzmiete Padel 2, Nichtmitglied',
  },
  {
    number: 'RE-2026-0035',
    bookingReference: 'BU-2121',
    customerName: 'Roswitha Ebersberger',
    grossCents: 4800,
    taxRatePercent: 19,
    issuedAt: '2026-03-17',
    dueDate: '2026-03-31',
    sentAt: '2026-03-17',
    paidAt: '2026-03-24',
    voidedAt: null,
    status: 'paid',
    reason: 'Platzmiete Padel 2, Nichtmitglied',
  },
  {
    number: 'RE-2026-0036',
    bookingReference: 'BU-2047',
    customerName: 'Bärbel Rautenkranz',
    grossCents: 3600,
    taxRatePercent: 7,
    issuedAt: '2026-03-05',
    dueDate: '2026-03-19',
    sentAt: '2026-03-05',
    paidAt: null,
    voidedAt: '2026-03-06',
    status: 'void',
    reason: 'Doppelbuchung — Rechnung storniert',
  },
  {
    number: 'RE-2026-0037',
    bookingReference: 'BU-2102',
    customerName: 'Konstantin Aschenbrenner',
    grossCents: 4800,
    taxRatePercent: 19,
    issuedAt: '2026-02-05',
    dueDate: '2026-02-19',
    sentAt: '2026-02-05',
    paidAt: null,
    voidedAt: null,
    status: 'uncollectible',
    reason: 'Platzmiete Padel 2 — Forderung ausgebucht',
  },
  {
    number: 'RE-2026-0038',
    bookingReference: 'BU-2125',
    customerName: 'Hermine Vogelsang',
    grossCents: 4800,
    taxRatePercent: null,
    issuedAt: '2026-03-26',
    dueDate: '2026-04-09',
    sentAt: '2026-03-26',
    paidAt: null,
    voidedAt: null,
    status: 'open',
    reason: 'Platzmiete Padel 2, Mitgliedschaft ungeklärt',
  },
  {
    number: 'RE-2026-0039',
    bookingReference: null,
    customerName: 'Volkmar Dietershagen',
    grossCents: 5000,
    taxRatePercent: 19,
    issuedAt: '2026-03-05',
    dueDate: '2026-03-19',
    sentAt: '2026-03-05',
    paidAt: null,
    voidedAt: null,
    status: 'open',
    reason: 'Gutscheinkauf — Zahlung fehlgeschlagen, Nachberechnung',
  },
  {
    number: 'RE-2026-0040',
    bookingReference: 'BU-2108',
    customerName: 'Benedikt Hohenwarter',
    grossCents: 4800,
    taxRatePercent: 19,
    issuedAt: '2026-02-14',
    dueDate: '2026-02-28',
    sentAt: '2026-02-14',
    paidAt: '2026-02-20',
    voidedAt: null,
    status: 'paid',
    reason: 'Platzmiete Padel 1, Nichtmitglied',
  },
];

export const fixtureInvoices: Invoice[] = invoiceSeeds.map((seed, index) => {
  const { netCents, vatCents } = splitGross(seed.grossCents, seed.taxRatePercent);
  return {
    id: `inv-${String(index + 1).padStart(4, '0')}`,
    number: seed.number,
    issuedAt: seed.issuedAt,
    dueDate: seed.dueDate,
    sentAt: seed.sentAt,
    paidAt: seed.paidAt,
    voidedAt: seed.voidedAt,
    status: seed.status,
    customerName: seed.customerName,
    bookingReference: seed.bookingReference,
    netCents,
    vatCents,
    grossCents: seed.grossCents,
    taxRatePercent: seed.taxRatePercent,
    currency: 'EUR',
    reason: seed.reason,
  };
});

/** Every invoice that names a booking must name one that exists. Used by the consistency tests. */
export function invoicesWithUnknownBooking(): Invoice[] {
  return fixtureInvoices.filter(
    (invoice) => invoice.bookingReference !== null && findBookingByReference(invoice.bookingReference) === null,
  );
}
