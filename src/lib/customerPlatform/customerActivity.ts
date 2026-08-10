// A customer-safe "was zuletzt passiert ist" feed.
//
// This is NOT an audit log and it is not a stream of internal events. There is no
// customer-visible event table, so nothing here is read from one. Every entry is
// derived from a timestamp that the customer RPCs ALREADY return on an object the
// customer can already see:
//
//   | entry              | source field                        | RPC                                 |
//   |--------------------|-------------------------------------|-------------------------------------|
//   | document_published | customer_documents.uploaded_at      | list_customer_documents             |
//   | invoice_issued     | customer_invoices.issue_date        | list_customer_invoices              |
//   | milestone_completed| milestones.completed_at             | list_customer_project_milestones    |
//   | project_updated    | customer_projects.updated_at        | list_customer_projects              |
//
// Consequences of that constraint, stated rather than worked around:
//   - Nothing is inferred. An entry exists only because a real timestamp exists.
//   - Milestone completions are only available where milestones are already loaded
//     (the project detail page). The overview does not fetch milestones per project,
//     and issuing one request per project to enrich a feed would be an N+1 — so the
//     overview simply builds a feed without them rather than faking the coverage.
//   - `project_updated` is emitted only when `updated_at` is meaningfully later than
//     `created_at`, so a freshly created project does not read as "just changed".
//
// Ordering is fully deterministic: newest first by timestamp, then by kind, then by
// id. Two entries sharing a timestamp therefore always render in the same order.

import type {
  CustomerDocument,
  CustomerInvoice,
  CustomerMilestone,
  CustomerProject,
} from './types';

export type CustomerActivityKind =
  | 'milestone_completed'
  | 'document_published'
  | 'invoice_issued'
  | 'project_updated';

export interface CustomerActivityEntry {
  /** Stable across renders: `${kind}:${sourceId}`. */
  id: string;
  kind: CustomerActivityKind;
  /** ISO timestamp the entry is sorted by. Always a real stored value. */
  timestamp: string;
  /** German one-line summary. Never contains an internal note or a raw enum. */
  title: string;
  /** Optional context line (project title, amount, category). */
  detail: string | null;
  /** In-app destination, when the underlying object has one. */
  href: string | null;
}

/** `updated_at` within this window of `created_at` is treated as "just created". */
const CREATION_WINDOW_MS = 60 * 1000;

/**
 * The one rule behind every "Neu" marker in the portal.
 *
 * A document counts as new for 14 days after `uploaded_at` — the timestamp the RPC
 * returns for the published version. It is deliberately a fixed, documented window
 * rather than a per-user "seen" state: the portal stores no read receipts, so any
 * "unread" badge would be a guess. Exported so the overview and the document centre
 * cannot drift apart on what "Neu" means.
 */
export const RECENT_DOCUMENT_DAYS = 14;

export function isRecentlyPublished(uploadedAt: string, now: number = Date.now()): boolean {
  const uploaded = timeOf(uploadedAt);
  if (Number.isNaN(uploaded)) return false;
  return now - uploaded <= RECENT_DOCUMENT_DAYS * 24 * 60 * 60 * 1000;
}

function timeOf(value: string | null | undefined): number {
  if (!value) return Number.NaN;
  return new Date(value).getTime();
}

function isRealTimestamp(value: string | null | undefined): value is string {
  return !Number.isNaN(timeOf(value));
}

export interface BuildCustomerActivityInput {
  projects: CustomerProject[];
  documents: CustomerDocument[];
  invoices: CustomerInvoice[];
  /**
   * Milestones for the projects in scope. Empty on surfaces that have not already
   * loaded them — see the N+1 note above.
   */
  milestones?: CustomerMilestone[];
  /** Documents/invoices name their project when the title is known. */
  projectTitles?: Map<string, string>;
  limit?: number;
  /** Injected in tests; defaults to `Date.now()`. */
  now?: number;
}

export function buildCustomerActivity({
  projects,
  documents,
  invoices,
  milestones = [],
  projectTitles,
  limit = 6,
}: BuildCustomerActivityInput): CustomerActivityEntry[] {
  const titles = projectTitles ?? new Map(projects.map((project) => [project.id, project.title]));
  const titleOf = (projectId: string | null) => (projectId ? titles.get(projectId) ?? null : null);

  const entries: CustomerActivityEntry[] = [];

  for (const milestone of milestones) {
    if (milestone.status !== 'completed') continue;
    if (!isRealTimestamp(milestone.completed_at)) continue;
    entries.push({
      id: `milestone_completed:${milestone.id}`,
      kind: 'milestone_completed',
      timestamp: milestone.completed_at,
      title: `Meilenstein abgeschlossen: ${milestone.title}`,
      detail: titleOf(milestone.project_id),
      href: `/app/projects/${milestone.project_id}`,
    });
  }

  for (const document of documents) {
    if (!isRealTimestamp(document.uploaded_at)) continue;
    entries.push({
      id: `document_published:${document.id}`,
      kind: 'document_published',
      timestamp: document.uploaded_at,
      title: `Neues Dokument: ${document.title}`,
      detail: titleOf(document.project_id),
      href: '/app/documents',
    });
  }

  for (const invoice of invoices) {
    if (!isRealTimestamp(invoice.issue_date)) continue;
    entries.push({
      id: `invoice_issued:${invoice.invoice_id}`,
      kind: 'invoice_issued',
      timestamp: invoice.issue_date,
      title: invoice.invoice_number
        ? `Rechnung ${invoice.invoice_number} ausgestellt`
        : 'Rechnung ausgestellt',
      detail: titleOf(invoice.project_id),
      href: '/app/billing',
    });
  }

  for (const project of projects) {
    if (!isRealTimestamp(project.updated_at)) continue;
    // A row whose updated_at still sits on its created_at was not "updated" — it was
    // created, and the creation is already visible as the project itself.
    if (timeOf(project.updated_at) - timeOf(project.created_at) <= CREATION_WINDOW_MS) continue;
    entries.push({
      id: `project_updated:${project.id}`,
      kind: 'project_updated',
      timestamp: project.updated_at,
      title: `Projekt aktualisiert: ${project.title}`,
      detail: project.phase || null,
      href: `/app/projects/${project.id}`,
    });
  }

  entries.sort(compareActivity);
  return entries.slice(0, limit);
}

/** Newest first; ties broken by kind then id so the order never wobbles. */
function compareActivity(a: CustomerActivityEntry, b: CustomerActivityEntry): number {
  const delta = timeOf(b.timestamp) - timeOf(a.timestamp);
  if (delta !== 0) return delta;
  if (a.kind !== b.kind) return a.kind < b.kind ? -1 : 1;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}
