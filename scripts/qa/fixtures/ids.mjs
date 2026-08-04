// Stable identifiers for the QA fixture layer.
//
// Every id is a literal, deterministic UUID. Nothing is generated at runtime, so two
// runs of the harness produce byte-identical responses and a screenshot diff means a
// real rendering change rather than fixture churn.
//
// TEST-ONLY. Nothing in this directory is imported by `src/`; see
// `src/test/qaFixtureIsolation.test.ts` for the guard that enforces it.

const u = (suffix) => `00000000-0000-4000-8000-${suffix.padStart(12, '0')}`;

export const ID = {
  // identity
  ownerUser: u('1'),
  customerUser: u('2'),
  orgA: u('a1'),
  orgB: u('a2'),

  // owner finance
  entity: u('e1'),

  // CRM
  accountA: u('c1'),
  accountB: u('c2'),
  contactA: u('cc1'),
  contactB: u('cc2'),
  engagementA: u('eg1'),
  engagementB: u('eg2'),
  invitationA: u('iv1'),
  invitationB: u('iv2'),
  solutionA: u('so1'),
  solutionB: u('so2'),

  // owner customers
  customerA: u('b1'),
  customerB: u('b2'),
  customerC: u('b3'),

  // offers
  offerA: u('f1'),
  offerB: u('f2'),
  offerC: u('f3'),

  // invoices
  invoiceA: u('d1'),
  invoiceB: u('d2'),
  invoiceC: u('d3'),

  // expenses
  expenseA: u('x1'),
  expenseB: u('x2'),

  // customer portal
  projectA: u('9a1'),
  projectB: u('9a2'),
  milestoneA: u('9b1'),
  milestoneB: u('9b2'),
  milestoneC: u('9b3'),
  documentA: u('9c1'),
  documentB: u('9c2'),
  documentC: u('9c3'),

  // ops
  taskA: u('7a1'),
  taskB: u('7a2'),
  taskC: u('7a3'),
};

// Deliberately long, real-shaped German values. Every layout in the product has to
// survive these without truncating into meaninglessness or forcing a horizontal
// scrollbar — that is the entire point of choosing them.
export const NAMES = {
  orgA: 'Musterbau Heizungstechnik Bayreuth GmbH & Co. KG',
  orgB: 'Nordlicht Energieverbund Schleswig-Holstein AG',
  orgC: 'Oberfränkische Verwaltungsgesellschaft für Gebäudetechnik mbH',
  ownerPerson: 'Dr. Katharina Obermüller-Weißenstein',
  customerPerson: 'Hans-Jürgen Schwarzenbeck',
  contactPerson: 'Prof. Dr.-Ing. Maximilian von Hohenberg-Lindau',
};

export const EMAILS = {
  owner: 'owner@cogniiq.de',
  customer: 'kontakt@musterbau-heizungstechnik-bayreuth.de',
  contact: 'm.hohenberg-lindau@nordlicht-energieverbund.de',
};
