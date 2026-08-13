// The transport seam.
//
// The adapter needs *a way to ask a question and get an answer*. It does not need — and must not
// have — a URL, a host, a project reference, a credential, a header set or a client library. All of
// those belong to the server-side caller that supplies the transport; none of them appears in this
// module, and the boundary tests fail the build if one ever does.
//
// A transport is therefore a single function. In this phase every transport is a fake supplied by a
// test. The real one is written in a later phase, outside this module.

/** The closed set of read operations. One name per adapter method; nothing else is expressible. */
export const clubOperationsOperations = [
  'getOverview',
  'listBookings',
  'listPayments',
  'listInvoices',
  'listReconciliation',
  'getMonthlyReport',
  'getReport',
  'listVouchers',
  'listMembers',
  'listActivity',
  'listAlerts',
  'getSettings',
] as const;
export type ClubOperationsOperation = (typeof clubOperationsOperations)[number];

export interface ClubOperationsTransportRequest {
  operation: ClubOperationsOperation;
  /** The domain query, already shaped by the caller. Never a filter string, table or column list. */
  query: Record<string, unknown>;
}

export interface ClubOperationsTransportResponse {
  /** Outcome status. Mapped to the five public error codes by the adapter, never surfaced raw. */
  status: number;
  /** The response payload. Validated before any of it reaches a component. */
  body: unknown;
}

export type ClubOperationsTransport = (
  request: ClubOperationsTransportRequest,
) => Promise<ClubOperationsTransportResponse>;
