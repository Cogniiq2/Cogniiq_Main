// Pure decision logic behind the Customer Portal's presentation.
//
// These functions decide WHAT the portal shows — which project it leads with, how
// invoices group, which documents survive a filter, which navigation entries exist. They
// are deliberately separate from the components that render them so each can be tested
// without a DOM, and so a page file exports components only.
//
// Nothing here reads, writes or derives anything the customer RPCs do not already
// return.

import type {
  CustomerDocument,
  CustomerDocumentCategory,
  CustomerInvoice,
  CustomerProject,
} from './types';
import { customerOrganizationStatusLabel } from './customerLabels';

/* ------------------------------------------------------------------ overview */

/**
 * Which project the overview leads with.
 *
 * Need-driven rather than "the first row": a blocked project outranks one that needs
 * attention, which outranks one that is on track. Within a tier the nearest target date
 * wins, then the most recent update, then the id — so the order is total and the page
 * never reshuffles between renders.
 */
export function pickPrimaryProject(projects: CustomerProject[]): CustomerProject | null {
  if (!projects.length) return null;
  const rank: Record<string, number> = { blocked: 0, attention_needed: 1, on_track: 2 };
  return [...projects].sort((a, b) => {
    const tier = (rank[a.status] ?? 3) - (rank[b.status] ?? 3);
    if (tier !== 0) return tier;
    const aDate = a.target_date ? new Date(a.target_date).getTime() : Number.POSITIVE_INFINITY;
    const bDate = b.target_date ? new Date(b.target_date).getTime() : Number.POSITIVE_INFINITY;
    if (aDate !== bDate) return aDate - bDate;
    const updated = new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    if (updated !== 0) return updated;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  })[0];
}

/**
 * The next action to show the CUSTOMER, or null.
 *
 * The load-bearing rule of the whole overview: this banner answers "does Cogniiq need
 * something from me?", so an action owned by Cogniiq must never reach it — no matter how
 * urgent, how overdue, or how empty the page would otherwise look. The primary project
 * wins when it has one; otherwise the first active project that does.
 */
export function pickCustomerNextAction(
  projects: CustomerProject[],
  primary: CustomerProject | null,
): CustomerProject | null {
  const owned = (p: CustomerProject | null | undefined): p is CustomerProject =>
    Boolean(p && p.next_action_owner === 'customer' && p.next_action_summary);
  if (owned(primary)) return primary;
  return projects.find(owned) ?? null;
}

/**
 * The Cogniiq-owned next action for the primary project, or null.
 *
 * Strictly the mirror of the rule above — a customer-owned action must never be
 * presented as something Cogniiq is working on.
 */
export function pickCogniiqNextAction(primary: CustomerProject | null): CustomerProject | null {
  if (!primary) return null;
  if (primary.next_action_owner !== 'cogniiq' || !primary.next_action_summary) return null;
  return primary;
}

/* ------------------------------------------------------------------- billing */

/**
 * Split the invoice list into the three groups the billing page shows.
 *
 * "Overdue" is taken from the STORED status only — never re-derived from the due date in
 * the browser, because the server owns that judgement and a wrong client clock must not
 * be able to move an invoice between groups. Each group is sorted newest-first by issue
 * date, with the invoice number as a stable tiebreak.
 */
export function groupInvoices(invoices: CustomerInvoice[]): {
  overdue: CustomerInvoice[];
  open: CustomerInvoice[];
  settled: CustomerInvoice[];
} {
  const overdue: CustomerInvoice[] = [];
  const open: CustomerInvoice[] = [];
  const settled: CustomerInvoice[] = [];

  for (const invoice of invoices) {
    if (invoice.outstanding_cents <= 0) settled.push(invoice);
    else if (invoice.status === 'overdue') overdue.push(invoice);
    else open.push(invoice);
  }

  return { overdue: sortInvoices(overdue), open: sortInvoices(open), settled: sortInvoices(settled) };
}

function sortInvoices(invoices: CustomerInvoice[]): CustomerInvoice[] {
  return [...invoices].sort((a, b) => {
    const aTime = a.issue_date ? new Date(a.issue_date).getTime() : 0;
    const bTime = b.issue_date ? new Date(b.issue_date).getTime() : 0;
    if (aTime !== bTime) return bTime - aTime;
    return (b.invoice_number ?? '').localeCompare(a.invoice_number ?? '', 'de');
  });
}

export interface CustomerInvoiceSummary {
  currency: string;
  outstanding: number;
  overdue: number;
  paid: number;
  openCount: number;
  overdueCount: number;
  settledCount: number;
}

/**
 * Totals for the billing summary tiles.
 *
 * Every figure is a plain SUM of STORED cents. Nothing is rounded, converted or
 * recalculated — no VAT is re-derived and no gross is reconstructed. `paid` is
 * `amount_paid_cents` as stored, deliberately not "gross minus outstanding", which would
 * invent a number for a credited invoice.
 */
export function summarizeInvoices(invoices: CustomerInvoice[]): CustomerInvoiceSummary {
  const currency = invoices[0]?.currency ?? 'EUR';
  let outstanding = 0;
  let overdue = 0;
  let paid = 0;
  let openCount = 0;
  let overdueCount = 0;
  let settledCount = 0;

  for (const invoice of invoices) {
    outstanding += invoice.outstanding_cents;
    paid += invoice.amount_paid_cents;
    if (invoice.outstanding_cents > 0) {
      openCount += 1;
      if (invoice.status === 'overdue') {
        overdue += invoice.outstanding_cents;
        overdueCount += 1;
      }
    } else {
      settledCount += 1;
    }
  }

  return { currency, outstanding, overdue, paid, openCount, overdueCount, settledCount };
}

/* ----------------------------------------------------------------- documents */

export interface DocumentFilter {
  query: string;
  category: CustomerDocumentCategory | 'all';
  /** A project id, `'all'`, or `'none'` for organization-level documents. */
  projectId: string;
}

/**
 * Client-side filtering over the `list_customer_documents` response the page already
 * holds — no extra request and no server-side search endpoint.
 *
 * Search is a case- and diacritic-insensitive substring match on the TITLE only. It
 * never matches on an id, a storage reference or any field the customer cannot see.
 */
export function filterDocuments(
  documents: CustomerDocument[],
  { query, category, projectId }: DocumentFilter,
): CustomerDocument[] {
  const needle = normalizeForSearch(query);
  return documents.filter((doc) => {
    if (category !== 'all' && doc.category !== category) return false;
    if (projectId === 'none') { if (doc.project_id) return false; }
    else if (projectId !== 'all' && doc.project_id !== projectId) return false;
    if (needle && !normalizeForSearch(doc.title).includes(needle)) return false;
    return true;
  });
}

export function normalizeForSearch(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    // Strip combining marks, so typing "Ubergabe" still finds "Übergabe".
    .replace(/[\u0300-\u036f]/g, '');
}

/* ---------------------------------------------------------------- navigation */

export type CustomerWorkspaceTone = 'neutral' | 'success' | 'attention';

/**
 * The compact, CUSTOMER-SAFE workspace status shown at the top of the rail.
 *
 * Derived only from values the customer can already see: whether an organization is
 * connected, that organization's own status, and how many of their own projects are
 * active. No internal health signal and no owner-side state.
 */
export function getWorkspaceStatus(
  hasOrganization: boolean,
  organizationStatus: string | null,
  activeProjectCount: number,
  projectsStatus: string,
): { label: string; tone: CustomerWorkspaceTone } {
  if (!hasOrganization) return { label: 'Keine Organisation', tone: 'neutral' };
  if (organizationStatus && organizationStatus !== 'active') {
    return { label: customerOrganizationStatusLabel(organizationStatus), tone: 'attention' };
  }
  // Never state a project count on the strength of a request that has not succeeded.
  if (projectsStatus !== 'ready') return { label: 'Aktiv', tone: 'success' };
  if (activeProjectCount === 0) return { label: 'Kein aktives Projekt', tone: 'neutral' };
  return {
    label: activeProjectCount === 1 ? '1 aktives Projekt' : `${activeProjectCount} aktive Projekte`,
    tone: 'success',
  };
}

export interface RailProjectChild {
  label: string;
  href: string;
  tone?: 'attention' | 'danger';
}

/**
 * The customer's REAL projects, as children of the rail's "Projekte" entry.
 *
 * There is no `/app/projects` index route and none is invented: the children are the
 * concrete `/app/projects/:id` routes that already exist. Completed projects are left
 * out of the rail (they remain reachable from the overview archive), and a customer with
 * no project simply gets no children rather than a fabricated placeholder.
 */
export function buildRailProjectChildren(
  projects: Array<{ id: string; title: string; status: string }>,
  limit = 5,
): RailProjectChild[] {
  return projects
    .filter((project) => project.status !== 'completed')
    .slice(0, limit)
    .map((project) => ({
      label: project.title,
      href: `/app/projects/${project.id}`,
      tone: project.status === 'blocked' ? ('danger' as const)
        : project.status === 'attention_needed' ? ('attention' as const)
          : undefined,
    }));
}

/* --------------------------------------------------------- project deep links */

export type CustomerProjectTab = 'overview' | 'milestones' | 'documents' | 'billing';

export const customerProjectTabHashes: Record<CustomerProjectTab, string> = {
  overview: '#uebersicht',
  milestones: '#meilensteine',
  documents: '#dokumente',
  billing: '#abrechnung',
};

/** `#meilensteine` opens the milestone section — the sections are deep-linkable. */
export function tabFromHash(hash: string): CustomerProjectTab {
  const normalized = hash.toLowerCase();
  const entry = (Object.entries(customerProjectTabHashes) as Array<[CustomerProjectTab, string]>)
    .find(([, value]) => value === normalized);
  return entry?.[0] ?? 'overview';
}

/* ------------------------------------------------- document presentation helpers */

export function formatFileSizeDe(bytes: number | null): string | null {
  if (bytes === null || bytes <= 0) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

/**
 * A short, human file-type label from the stored MIME type.
 *
 * Only types the product actually publishes are named. Anything else returns `null` and
 * the label is omitted — a customer must never be shown a raw MIME string such as
 * `application/vnd.openxmlformats-officedocument.wordprocessingml.document`.
 */
export function fileTypeLabel(contentType: string | null): string | null {
  if (!contentType) return null;
  const type = contentType.split(';')[0].trim().toLowerCase();
  const map: Record<string, string> = {
    'application/pdf': 'PDF',
    'application/msword': 'DOC',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
    'application/vnd.ms-excel': 'XLS',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
    'application/vnd.ms-powerpoint': 'PPT',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
    'application/zip': 'ZIP',
    'text/csv': 'CSV',
    'text/plain': 'TXT',
    'image/png': 'PNG',
    'image/jpeg': 'JPG',
    'image/webp': 'WEBP',
    'image/svg+xml': 'SVG',
  };
  return map[type] ?? null;
}
