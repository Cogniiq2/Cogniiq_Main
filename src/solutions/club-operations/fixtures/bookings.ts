// Fictional booking fixtures.
//
// Every name, reference and amount is invented for this fixture set. There are no production
// identifiers, no payment-provider identifiers, no voucher codes and no contact details.
// Dates are fixed literals so every test and every render is deterministic.
//
// Coverage is intentional: all five courts, all five booking statuses, all five payment statuses,
// paid / pending / refunded / free / voucher payments, member / non-member / unresolved membership,
// every VAT category, and deliberately long German names to exercise truncation and wrapping.

import type {
  Booking,
  BookingStatus,
  CourtKey,
  MembershipClassification,
  PaymentProvider,
  PaymentStatus,
  TaxCategory,
} from '../types';

/**
 * VAT treatment follows from court and membership; it is never chosen independently.
 *
 * Padel is rated by membership (reduced for members, standard for non-members, unresolved when the
 * membership could not be determined); tennis is exempt; a booking that required no payment carries
 * no VAT at all. Deriving it here means a fixture row cannot contradict itself.
 */
export function taxTreatmentFor(
  court: CourtKey,
  membership: MembershipClassification,
  paymentStatus: PaymentStatus,
): { taxCategory: TaxCategory; taxRatePercent: number | null } {
  if (paymentStatus === 'not_required') return { taxCategory: 'free', taxRatePercent: null };
  if (court.startsWith('tennis')) return { taxCategory: 'tennis_exempt', taxRatePercent: 0 };
  if (membership === 'member') return { taxCategory: 'padel_member_reduced', taxRatePercent: 7 };
  if (membership === 'non_member') {
    return { taxCategory: 'padel_non_member_standard', taxRatePercent: 19 };
  }
  return { taxCategory: 'padel_unresolved', taxRatePercent: null };
}

interface BookingSeed {
  seq: number;
  court: CourtKey;
  /** Local start, "YYYY-MM-DDTHH:MM". The offset is appended per month (CET/CEST). */
  start: string;
  durationMinutes: number;
  customerName: string;
  status: BookingStatus;
  provider: PaymentProvider;
  paymentStatus: PaymentStatus;
  amountCents: number;
  membership: MembershipClassification;
  lightsRequested?: boolean;
}

/** Central European offset for the fixture window: CET until 29 March 2026, CEST after. */
function offsetFor(start: string): string {
  return start >= '2026-03-29' ? '+02:00' : '+01:00';
}

function addMinutes(start: string, minutes: number): string {
  const [datePart, timePart] = start.split('T');
  const [hour, minute] = timePart.split(':').map(Number);
  const total = hour * 60 + minute + minutes;
  const endHour = String(Math.floor(total / 60)).padStart(2, '0');
  const endMinute = String(total % 60).padStart(2, '0');
  return `${datePart}T${endHour}:${endMinute}`;
}

function buildBooking(seed: BookingSeed): Booking {
  const offset = offsetFor(seed.start);
  const { taxCategory, taxRatePercent } = taxTreatmentFor(
    seed.court,
    seed.membership,
    seed.paymentStatus,
  );
  return {
    id: `bkg-${String(seed.seq).padStart(4, '0')}`,
    reference: `BU-${2000 + seed.seq}`,
    court: seed.court,
    startsAt: `${seed.start}:00${offset}`,
    endsAt: `${addMinutes(seed.start, seed.durationMinutes)}:00${offset}`,
    customerName: seed.customerName,
    status: seed.status,
    provider: seed.provider,
    paymentStatus: seed.paymentStatus,
    amountCents: seed.amountCents,
    currency: 'EUR',
    membership: seed.membership,
    taxCategory,
    taxRatePercent,
    lightsRequested: seed.lightsRequested ?? false,
  };
}

/**
 * The first twelve rows are written out in full: they are the set the Phase C1 tests pin, and
 * spelling them out keeps that contract visible. Everything after is expressed as seeds, so the
 * larger set stays readable and its VAT treatment is derived rather than retyped.
 */
const coreBookings: Booking[] = [
  {
    id: 'bkg-0001',
    reference: 'BU-2043',
    court: 'padel-1',
    startsAt: '2026-03-02T18:00:00+01:00',
    endsAt: '2026-03-02T19:30:00+01:00',
    customerName: 'Maximiliane Schöllhammer-Oberreuther',
    status: 'confirmed',
    provider: 'stripe',
    paymentStatus: 'paid',
    amountCents: 3600,
    currency: 'EUR',
    membership: 'member',
    taxCategory: 'padel_member_reduced',
    taxRatePercent: 7,
    lightsRequested: true,
  },
  {
    id: 'bkg-0002',
    reference: 'BU-2044',
    court: 'padel-2',
    startsAt: '2026-03-02T19:30:00+01:00',
    endsAt: '2026-03-02T21:00:00+01:00',
    customerName: 'Friedrich-Wilhelm Baumgartner',
    status: 'confirmed',
    provider: 'paypal',
    paymentStatus: 'paid',
    amountCents: 4800,
    currency: 'EUR',
    membership: 'non_member',
    taxCategory: 'padel_non_member_standard',
    taxRatePercent: 19,
    lightsRequested: true,
  },
  {
    id: 'bkg-0003',
    reference: 'BU-2045',
    court: 'tennis-1',
    startsAt: '2026-03-03T09:00:00+01:00',
    endsAt: '2026-03-03T10:00:00+01:00',
    customerName: 'Annegret Düsterhöft',
    status: 'confirmed',
    provider: 'stripe',
    paymentStatus: 'paid',
    amountCents: 2000,
    currency: 'EUR',
    membership: 'not_applicable',
    taxCategory: 'tennis_exempt',
    taxRatePercent: 0,
    lightsRequested: false,
  },
  {
    id: 'bkg-0004',
    reference: 'BU-2046',
    court: 'tennis-2',
    startsAt: '2026-03-03T17:00:00+01:00',
    endsAt: '2026-03-03T18:30:00+01:00',
    customerName: 'Jörg Käsemann',
    status: 'pending',
    provider: 'stripe',
    paymentStatus: 'pending',
    amountCents: 3000,
    currency: 'EUR',
    membership: 'not_applicable',
    taxCategory: 'tennis_exempt',
    taxRatePercent: 0,
    lightsRequested: true,
  },
  {
    id: 'bkg-0005',
    reference: 'BU-2047',
    court: 'padel-1',
    startsAt: '2026-03-04T20:00:00+01:00',
    endsAt: '2026-03-04T21:30:00+01:00',
    customerName: 'Bärbel Rautenkranz',
    status: 'refunded',
    provider: 'stripe',
    paymentStatus: 'refunded',
    amountCents: 3600,
    currency: 'EUR',
    membership: 'member',
    taxCategory: 'padel_member_reduced',
    taxRatePercent: 7,
    lightsRequested: true,
  },
  {
    id: 'bkg-0006',
    reference: 'BU-2048',
    court: 'tennis-3',
    startsAt: '2026-03-05T08:00:00+01:00',
    endsAt: '2026-03-05T09:00:00+01:00',
    customerName: 'Hans-Günther Vollenweider',
    status: 'cancelled',
    provider: 'free',
    paymentStatus: 'not_required',
    amountCents: 0,
    currency: 'EUR',
    membership: 'not_applicable',
    taxCategory: 'free',
    taxRatePercent: null,
    lightsRequested: false,
  },
  {
    id: 'bkg-0007',
    reference: 'BU-2049',
    court: 'padel-2',
    startsAt: '2026-03-05T18:30:00+01:00',
    endsAt: '2026-03-05T20:00:00+01:00',
    customerName: 'Katharina Wiesenmüller',
    status: 'confirmed',
    provider: 'voucher',
    paymentStatus: 'paid',
    amountCents: 3600,
    currency: 'EUR',
    membership: 'member',
    taxCategory: 'padel_member_reduced',
    taxRatePercent: 7,
    lightsRequested: true,
  },
  {
    id: 'bkg-0008',
    reference: 'BU-2050',
    court: 'padel-1',
    startsAt: '2026-03-06T17:00:00+01:00',
    endsAt: '2026-03-06T18:30:00+01:00',
    customerName: 'Sebastian Krautwurst',
    status: 'confirmed',
    provider: 'paypal',
    paymentStatus: 'paid',
    amountCents: 4800,
    currency: 'EUR',
    membership: 'unresolved',
    taxCategory: 'padel_unresolved',
    taxRatePercent: null,
    lightsRequested: false,
  },
  {
    id: 'bkg-0009',
    reference: 'BU-2051',
    court: 'tennis-1',
    startsAt: '2026-03-06T19:00:00+01:00',
    endsAt: '2026-03-06T20:30:00+01:00',
    customerName: 'Elisabeth Freytag-Löwenstein',
    status: 'failed',
    provider: 'stripe',
    paymentStatus: 'failed',
    amountCents: 3000,
    currency: 'EUR',
    membership: 'not_applicable',
    taxCategory: 'tennis_exempt',
    taxRatePercent: 0,
    lightsRequested: true,
  },
  {
    id: 'bkg-0010',
    reference: 'BU-2052',
    court: 'tennis-2',
    startsAt: '2026-03-07T10:00:00+01:00',
    endsAt: '2026-03-07T11:00:00+01:00',
    customerName: 'Reinhard Obermeier',
    status: 'confirmed',
    provider: 'free',
    paymentStatus: 'not_required',
    amountCents: 0,
    currency: 'EUR',
    membership: 'not_applicable',
    taxCategory: 'free',
    taxRatePercent: null,
    lightsRequested: false,
  },
  {
    id: 'bkg-0011',
    reference: 'BU-2053',
    court: 'padel-2',
    startsAt: '2026-03-07T20:00:00+01:00',
    endsAt: '2026-03-07T21:30:00+01:00',
    customerName: 'Wolfgang Tannenberger',
    status: 'confirmed',
    provider: 'stripe',
    paymentStatus: 'paid',
    amountCents: 4800,
    currency: 'EUR',
    membership: 'non_member',
    taxCategory: 'padel_non_member_standard',
    taxRatePercent: 19,
    lightsRequested: true,
  },
  {
    id: 'bkg-0012',
    reference: 'BU-2054',
    court: 'tennis-3',
    startsAt: '2026-03-08T14:00:00+01:00',
    endsAt: '2026-03-08T15:30:00+01:00',
    customerName: 'Charlotte Nöllenburg',
    status: 'pending',
    provider: 'paypal',
    paymentStatus: 'pending',
    amountCents: 3000,
    currency: 'EUR',
    membership: 'not_applicable',
    taxCategory: 'tennis_exempt',
    taxRatePercent: 0,
    lightsRequested: false,
  },
];

/**
 * February 2026 — the comparison month for the monthly report, and the reason the reporting section
 * has real movement to show rather than a single isolated month.
 */
const februarySeeds: BookingSeed[] = [
  { seq: 101, court: 'padel-1', start: '2026-02-03T18:00', durationMinutes: 90, customerName: 'Gertrud Habermehl-Steinbrück', status: 'confirmed', provider: 'stripe', paymentStatus: 'paid', amountCents: 3600, membership: 'member', lightsRequested: true },
  { seq: 102, court: 'padel-2', start: '2026-02-04T19:30', durationMinutes: 90, customerName: 'Konstantin Aschenbrenner', status: 'confirmed', provider: 'paypal', paymentStatus: 'paid', amountCents: 4800, membership: 'non_member', lightsRequested: true },
  { seq: 103, court: 'tennis-1', start: '2026-02-05T10:00', durationMinutes: 60, customerName: 'Ingeborg Wallerstein', status: 'confirmed', provider: 'stripe', paymentStatus: 'paid', amountCents: 2000, membership: 'not_applicable' },
  { seq: 104, court: 'tennis-2', start: '2026-02-06T17:00', durationMinutes: 90, customerName: 'Ludwig Pfaffenberger', status: 'confirmed', provider: 'stripe', paymentStatus: 'paid', amountCents: 3000, membership: 'not_applicable', lightsRequested: true },
  { seq: 105, court: 'padel-1', start: '2026-02-07T20:00', durationMinutes: 90, customerName: 'Rosemarie Zimmermann-Kleist', status: 'refunded', provider: 'stripe', paymentStatus: 'refunded', amountCents: 3600, membership: 'member', lightsRequested: true },
  { seq: 106, court: 'tennis-3', start: '2026-02-09T08:30', durationMinutes: 60, customerName: 'Theodor Brandstätter', status: 'confirmed', provider: 'free', paymentStatus: 'not_required', amountCents: 0, membership: 'not_applicable' },
  { seq: 107, court: 'padel-2', start: '2026-02-11T18:30', durationMinutes: 90, customerName: 'Waltraud Oberländer', status: 'confirmed', provider: 'voucher', paymentStatus: 'paid', amountCents: 3600, membership: 'member', lightsRequested: true },
  { seq: 108, court: 'padel-1', start: '2026-02-13T17:00', durationMinutes: 90, customerName: 'Benedikt Hohenwarter', status: 'confirmed', provider: 'paypal', paymentStatus: 'paid', amountCents: 4800, membership: 'non_member' },
  { seq: 109, court: 'tennis-1', start: '2026-02-15T19:00', durationMinutes: 90, customerName: 'Hildegard Schwarzenbeck', status: 'cancelled', provider: 'stripe', paymentStatus: 'refunded', amountCents: 3000, membership: 'not_applicable', lightsRequested: true },
  { seq: 110, court: 'tennis-2', start: '2026-02-17T11:00', durationMinutes: 60, customerName: 'Norbert Grünewald', status: 'confirmed', provider: 'free', paymentStatus: 'not_required', amountCents: 0, membership: 'not_applicable' },
  { seq: 111, court: 'padel-2', start: '2026-02-19T20:00', durationMinutes: 90, customerName: 'Cornelia Fürstenberger', status: 'confirmed', provider: 'stripe', paymentStatus: 'paid', amountCents: 4800, membership: 'non_member', lightsRequested: true },
  { seq: 112, court: 'tennis-3', start: '2026-02-21T14:00', durationMinutes: 90, customerName: 'Siegfried Lindenmeier', status: 'confirmed', provider: 'stripe', paymentStatus: 'paid', amountCents: 3000, membership: 'not_applicable' },
  { seq: 113, court: 'padel-1', start: '2026-02-24T19:00', durationMinutes: 90, customerName: 'Marianne Trautwein', status: 'confirmed', provider: 'stripe', paymentStatus: 'paid', amountCents: 3600, membership: 'member', lightsRequested: true },
  { seq: 114, court: 'padel-2', start: '2026-02-26T18:00', durationMinutes: 90, customerName: 'Erwin Baumbach', status: 'pending', provider: 'paypal', paymentStatus: 'pending', amountCents: 4800, membership: 'unresolved' },
];

/**
 * Additional March 2026 rows. Chosen to round out the current month so the ledger, reconciliation
 * and voucher sections all have enough material to show their edge cases.
 */
const marchSeeds: BookingSeed[] = [
  { seq: 115, court: 'padel-1', start: '2026-03-09T18:00', durationMinutes: 90, customerName: 'Adelheid Rosenkranz', status: 'confirmed', provider: 'stripe', paymentStatus: 'paid', amountCents: 3600, membership: 'member', lightsRequested: true },
  { seq: 116, court: 'padel-2', start: '2026-03-10T19:30', durationMinutes: 90, customerName: 'Gunther Weissenberger', status: 'confirmed', provider: 'stripe', paymentStatus: 'paid', amountCents: 4800, membership: 'non_member', lightsRequested: true },
  { seq: 117, court: 'tennis-1', start: '2026-03-11T09:30', durationMinutes: 60, customerName: 'Liselotte Hartmannsgruber', status: 'confirmed', provider: 'voucher', paymentStatus: 'paid', amountCents: 2000, membership: 'not_applicable' },
  { seq: 118, court: 'tennis-2', start: '2026-03-12T18:00', durationMinutes: 90, customerName: 'Reinhold Kirchsteiger', status: 'confirmed', provider: 'paypal', paymentStatus: 'paid', amountCents: 3000, membership: 'not_applicable', lightsRequested: true },
  { seq: 119, court: 'padel-1', start: '2026-03-13T20:00', durationMinutes: 90, customerName: 'Editha Sonnenschein', status: 'confirmed', provider: 'stripe', paymentStatus: 'paid', amountCents: 3600, membership: 'member', lightsRequested: true },
  { seq: 120, court: 'tennis-3', start: '2026-03-14T15:00', durationMinutes: 90, customerName: 'Alois Neuhauser', status: 'refunded', provider: 'stripe', paymentStatus: 'refunded', amountCents: 3000, membership: 'not_applicable' },
  { seq: 121, court: 'padel-2', start: '2026-03-16T18:30', durationMinutes: 90, customerName: 'Roswitha Ebersberger', status: 'confirmed', provider: 'stripe', paymentStatus: 'paid', amountCents: 4800, membership: 'non_member', lightsRequested: true },
  { seq: 122, court: 'tennis-1', start: '2026-03-18T10:00', durationMinutes: 60, customerName: 'Fridolin Aichinger', status: 'confirmed', provider: 'free', paymentStatus: 'not_required', amountCents: 0, membership: 'not_applicable' },
  { seq: 123, court: 'padel-1', start: '2026-03-20T19:00', durationMinutes: 90, customerName: 'Wilhelmine Nussbaumer', status: 'confirmed', provider: 'voucher', paymentStatus: 'paid', amountCents: 3600, membership: 'member', lightsRequested: true },
  { seq: 124, court: 'tennis-2', start: '2026-03-22T16:00', durationMinutes: 90, customerName: 'Gottfried Rauschenbach', status: 'pending', provider: 'stripe', paymentStatus: 'pending', amountCents: 3000, membership: 'not_applicable' },
  { seq: 125, court: 'padel-2', start: '2026-03-25T20:00', durationMinutes: 90, customerName: 'Hermine Vogelsang', status: 'confirmed', provider: 'paypal', paymentStatus: 'paid', amountCents: 4800, membership: 'unresolved', lightsRequested: true },
  { seq: 126, court: 'tennis-3', start: '2026-03-30T17:30', durationMinutes: 90, customerName: 'Leopold Wiesinger', status: 'confirmed', provider: 'stripe', paymentStatus: 'paid', amountCents: 3000, membership: 'not_applicable', lightsRequested: true },
  // Deliberate anomaly: the money was refunded but the slot is still confirmed and blocked. This is
  // the "aktive Buchung erstattet" case the reconciliation section exists to surface.
  { seq: 127, court: 'padel-1', start: '2026-03-27T18:00', durationMinutes: 90, customerName: 'Isolde Krummenacher', status: 'confirmed', provider: 'stripe', paymentStatus: 'refunded', amountCents: 3600, membership: 'member', lightsRequested: true },

  // FIXTURE_TODAY. The overview's "Heute" window resolves to this date, so the day has to carry
  // real trade — an empty today would make a working period control look like a broken one.
  { seq: 128, court: 'tennis-1', start: '2026-03-31T09:00', durationMinutes: 60, customerName: 'Sigismund Häberle', status: 'confirmed', provider: 'stripe', paymentStatus: 'paid', amountCents: 2000, membership: 'not_applicable' },
  { seq: 129, court: 'padel-2', start: '2026-03-31T18:00', durationMinutes: 90, customerName: 'Klothilde Bergmiller', status: 'confirmed', provider: 'stripe', paymentStatus: 'paid', amountCents: 3600, membership: 'member', lightsRequested: true },
  { seq: 130, court: 'tennis-2', start: '2026-03-31T17:00', durationMinutes: 90, customerName: 'Perpetua Lindenschmidt', status: 'pending', provider: 'paypal', paymentStatus: 'pending', amountCents: 3000, membership: 'not_applicable', lightsRequested: true },
];

export const fixtureBookings: Booking[] = [
  ...coreBookings,
  ...februarySeeds.map(buildBooking),
  ...marchSeeds.map(buildBooking),
];

/** Bookings whose local start date falls in the given YYYY-MM month. */
export function bookingsInMonth(month: string): Booking[] {
  return fixtureBookings.filter((booking) => booking.startsAt.slice(0, 7) === month);
}

/** Months present in the fixture set, oldest first. */
export const fixtureMonths: string[] = [
  ...new Set(fixtureBookings.map((booking) => booking.startsAt.slice(0, 7))),
].sort();

export function findBookingByReference(reference: string): Booking | null {
  return fixtureBookings.find((booking) => booking.reference === reference) ?? null;
}
