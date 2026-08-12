// Fictional member register.
//
// Every member classified as a padel member here is the customer of at least one padel booking
// carrying the reduced VAT rate, and the booking summary on each record is derived from the booking
// fixtures rather than typed in. That means the register and the ledger cannot disagree: if a
// booking's membership changes, the member's figures move with it.
//
// Identities, member numbers and addresses are invented. No e-mail, telephone number or any other
// contact channel is modelled — the domain type has no field for one.

import type { MembershipType, Member, MemberStatus, MembershipClassification } from '../types';
import { fixtureBookings } from './bookings';

interface MemberSeed {
  number: number;
  firstName: string;
  lastName: string;
  membershipType: MembershipType;
  status: MemberStatus;
  joinedAt: string;
  validUntil: string | null;
  city: string;
  postalCode: string;
}

/** Padel membership is what confers the reduced VAT rate; tennis-only membership does not. */
function classificationFor(type: MembershipType): MembershipClassification {
  return type === 'padel' || type === 'combination' ? 'member' : 'not_applicable';
}

const memberSeeds: MemberSeed[] = [
  // Padel members who appear as booking customers with the reduced rate.
  { number: 1042, firstName: 'Maximiliane', lastName: 'Schöllhammer-Oberreuther', membershipType: 'combination', status: 'active', joinedAt: '2019-04-01', validUntil: '2026-12-31', city: 'Talheim', postalCode: '95500' },
  { number: 1057, firstName: 'Bärbel', lastName: 'Rautenkranz', membershipType: 'padel', status: 'active', joinedAt: '2021-09-15', validUntil: '2026-12-31', city: 'Rosenau', postalCode: '95463' },
  { number: 1063, firstName: 'Katharina', lastName: 'Wiesenmüller', membershipType: 'padel', status: 'active', joinedAt: '2022-01-10', validUntil: '2026-12-31', city: 'Talheim', postalCode: '95500' },
  { number: 1071, firstName: 'Gertrud', lastName: 'Habermehl-Steinbrück', membershipType: 'combination', status: 'active', joinedAt: '2018-06-01', validUntil: '2026-12-31', city: 'Lindenbach', postalCode: '95488' },
  { number: 1088, firstName: 'Rosemarie', lastName: 'Zimmermann-Kleist', membershipType: 'padel', status: 'active', joinedAt: '2023-03-20', validUntil: '2026-12-31', city: 'Talheim', postalCode: '95500' },
  { number: 1094, firstName: 'Waltraud', lastName: 'Oberländer', membershipType: 'padel', status: 'active', joinedAt: '2022-11-05', validUntil: '2026-12-31', city: 'Weiherfeld', postalCode: '95444' },
  { number: 1102, firstName: 'Marianne', lastName: 'Trautwein', membershipType: 'combination', status: 'active', joinedAt: '2020-02-14', validUntil: '2026-12-31', city: 'Talheim', postalCode: '95500' },
  { number: 1115, firstName: 'Adelheid', lastName: 'Rosenkranz', membershipType: 'padel', status: 'active', joinedAt: '2024-05-02', validUntil: '2026-12-31', city: 'Rosenau', postalCode: '95463' },
  { number: 1126, firstName: 'Editha', lastName: 'Sonnenschein', membershipType: 'padel', status: 'active', joinedAt: '2023-08-18', validUntil: '2026-12-31', city: 'Weiherfeld', postalCode: '95444' },
  { number: 1133, firstName: 'Wilhelmine', lastName: 'Nussbaumer', membershipType: 'combination', status: 'active', joinedAt: '2021-01-08', validUntil: '2026-12-31', city: 'Lindenbach', postalCode: '95488' },

  // Members without bookings in the fixture window, and non-active states.
  { number: 1140, firstName: 'Ottokar', lastName: 'Breitenbach', membershipType: 'tennis', status: 'active', joinedAt: '2017-03-01', validUntil: '2026-12-31', city: 'Talheim', postalCode: '95500' },
  { number: 1148, firstName: 'Philippine', lastName: 'Achterberg', membershipType: 'tennis', status: 'active', joinedAt: '2019-07-22', validUntil: '2026-12-31', city: 'Weiherfeld', postalCode: '95444' },
  { number: 1155, firstName: 'Sieglinde', lastName: 'Morgenstern', membershipType: 'combination', status: 'pending', joinedAt: '2026-02-01', validUntil: null, city: 'Rosenau', postalCode: '95463' },
  { number: 1161, firstName: 'Traugott', lastName: 'Winterhalter', membershipType: 'tennis', status: 'inactive', joinedAt: '2015-05-11', validUntil: '2025-12-31', city: 'Talheim', postalCode: '95500' },
  { number: 1167, firstName: 'Emmerich', lastName: 'Falkenstein', membershipType: 'other', status: 'resigned', joinedAt: '2016-09-30', validUntil: '2025-06-30', city: 'Lindenbach', postalCode: '95488' },
  { number: 1172, firstName: 'Klothilde', lastName: 'Bergmiller', membershipType: 'padel', status: 'active', joinedAt: '2025-04-04', validUntil: '2026-12-31', city: 'Weiherfeld', postalCode: '95444' },
];

function bookingSummaryFor(fullName: string): { bookingCount: number; bookingRevenueCents: number } {
  const own = fixtureBookings.filter((booking) => booking.customerName === fullName);
  return {
    bookingCount: own.length,
    bookingRevenueCents: own
      .filter((booking) => booking.paymentStatus === 'paid')
      .reduce((sum, booking) => sum + booking.amountCents, 0),
  };
}

export const fixtureMembers: Member[] = memberSeeds.map((seed) => {
  const fullName = `${seed.firstName} ${seed.lastName}`;
  return {
    id: `mem-${seed.number}`,
    memberNumber: seed.number,
    firstName: seed.firstName,
    lastName: seed.lastName,
    membershipType: seed.membershipType,
    status: seed.status,
    joinedAt: seed.joinedAt,
    validUntil: seed.validUntil,
    vatClassification: classificationFor(seed.membershipType),
    city: seed.city,
    postalCode: seed.postalCode,
    ...bookingSummaryFor(fullName),
  };
});

export function memberFullName(member: Member): string {
  return `${member.firstName} ${member.lastName}`;
}
