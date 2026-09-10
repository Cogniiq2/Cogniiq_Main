import { supabase } from '@/lib/supabase';

/**
 * Owner workspace organization: folders, Papierkorb, and one honest delete path.
 *
 * Two things live here, and they are deliberately not the same thing.
 *
 * ORGANIZATION is where the owner filed a record and whether it should still show up in the
 * day-to-day list. It is a view preference. It never touches accounting: a paid expense in the
 * Papierkorb is still in the EÜR, an issued invoice in the Papierkorb is still a receivable, and
 * nothing in this module or the SQL behind it adds a `trashed_at is null` predicate to a tax,
 * VAT or revenue query.
 *
 * DELETION is decided by the SERVER, per record, every time. This module asks
 * `owner_workspace_delete_preflight` what "Löschen" can honestly mean for a given row and
 * renders the answer; it never decides for itself that something is safe to destroy. The wrappers
 * below are thin on purpose — every one of them is an `supabase.rpc(...)` call to a named,
 * owner-gated SECURITY DEFINER function. There is no `from('...').delete()` anywhere in this file
 * and there must never be one.
 *
 * Migration: 20260903120000_owner_workspace_organization.sql
 */

export const OWNER_WORKSPACE_MIGRATION = '20260903120000_owner_workspace_organization.sql';

/* ------------------------------------------------------------------ scopes */

/**
 * The scopes with a real collection surface today. The database vocabulary is wider so a later
 * surface needs no schema change, but a scope is only listed here once a page actually mounts it
 * AND the server models what deletion means for it.
 */
export const WORKSPACE_SCOPES = ['invoice', 'offer', 'expense'] as const;
export type WorkspaceScope = (typeof WORKSPACE_SCOPES)[number];

/* ------------------------------------------------------------------- model */

export interface WorkspaceFolder {
  id: string;
  name: string;
  sortOrder: number;
  createdAt: string;
}

export interface WorkspaceItemState {
  resourceId: string;
  folderId: string | null;
  trashedAt: string | null;
}

export interface WorkspaceState {
  folders: WorkspaceFolder[];
  /** Keyed by resource id. Absent means "Ohne Ordner, not trashed" — the common case. */
  items: Record<string, WorkspaceItemState>;
}

export const EMPTY_WORKSPACE_STATE: WorkspaceState = { folders: [], items: {} };

/** The two system views. Neither is a user-created folder and neither can be renamed or deleted. */
export const FOLDER_ALL = 'all';
export const FOLDER_UNFILED = 'unfiled';
export const FOLDER_TRASH = 'trash';

/** `all` | `unfiled` | `trash` | a folder uuid. */
export type FolderSelection = string;

export function isSystemFolder(selection: FolderSelection): boolean {
  return selection === FOLDER_ALL || selection === FOLDER_UNFILED || selection === FOLDER_TRASH;
}

/* -------------------------------------------------------------- pure logic */

/**
 * Folder filtering, as a predicate over rows the page has already loaded and already filtered by
 * status, search and date. It composes rather than replaces: the folder never resets another
 * filter, and another filter never resets the folder.
 *
 * The one rule that is not merely additive: a trashed record disappears from `Alle` AND from every
 * custom folder, and appears only in `Papierkorb`. That is what makes the Papierkorb useful at all.
 */
export function matchesFolder(
  state: WorkspaceState, resourceId: string, selection: FolderSelection,
): boolean {
  const item = state.items[resourceId];
  const trashed = Boolean(item?.trashedAt);
  if (selection === FOLDER_TRASH) return trashed;
  if (trashed) return false;
  if (selection === FOLDER_ALL) return true;
  if (selection === FOLDER_UNFILED) return !item?.folderId;
  return item?.folderId === selection;
}

export function filterByFolder<T>(
  rows: T[], getId: (row: T) => string, state: WorkspaceState, selection: FolderSelection,
): T[] {
  return rows.filter((row) => matchesFolder(state, getId(row), selection));
}

export interface FolderCounts {
  all: number;
  unfiled: number;
  trash: number;
  byFolder: Record<string, number>;
}

/**
 * Counts for the rail, computed once over the loaded rows.
 *
 * Deliberately over the FULL row set rather than the status-filtered one: a folder chip that said
 * "0" only because the Status filter happens to be "Bezahlt" would look like an empty folder.
 */
export function folderCounts<T>(
  rows: T[], getId: (row: T) => string, state: WorkspaceState,
): FolderCounts {
  const counts: FolderCounts = { all: 0, unfiled: 0, trash: 0, byFolder: {} };
  for (const folder of state.folders) counts.byFolder[folder.id] = 0;
  for (const row of rows) {
    const item = state.items[getId(row)];
    if (item?.trashedAt) { counts.trash += 1; continue; }
    counts.all += 1;
    if (item?.folderId && item.folderId in counts.byFolder) counts.byFolder[item.folderId] += 1;
    else counts.unfiled += 1;
  }
  return counts;
}

/* ------------------------------------------------------------ delete plans */

export type DeleteAction =
  | 'hard_delete'
  | 'cancel_and_trash'
  | 'archive_and_trash'
  | 'trash_only'
  | 'blocked'
  /** Only ever returned by the force purge — never by the ordinary preflight. */
  | 'force_delete';

export interface DeletePlan {
  resourceId: string;
  action: DeleteAction;
  /** Stable machine codes. The server never returns SQL text or a message to render. */
  reasons: string[];
  dependencies: Record<string, unknown>;
}

export type DeleteOutcome =
  | 'hard_deleted'
  | 'cancelled_and_trashed'
  | 'archived_and_trashed'
  | 'trashed'
  | 'blocked'
  | 'failed';

export interface DeleteResult {
  resourceId: string;
  action: DeleteAction;
  outcome: DeleteOutcome;
  reasons: string[];
  /** SQLSTATE only, and only on failure. Never surfaced verbatim. */
  error: string | null;
}

/** German for a preflight reason code. Unknown codes fall back to nothing rather than a raw code. */
export const deleteReasonLabel: Record<string, string> = {
  never_issued_draft: 'Entwurf, nie gestellt',
  pristine_draft: 'Entwurf ohne Versionen, Dokumente oder Freigaben',
  no_protected_dependency: 'keine Zahlung, kein Beleg, kein Nachweis hinterlegt',
  has_payments: 'Zahlungen erfasst',
  has_documents: 'Belege verknüpft',
  has_generated_documents: 'erzeugte Dokumente vorhanden',
  has_access_tokens: 'Freigabe-Links vergeben',
  has_acceptance_evidence: 'Annahme-Nachweis vorhanden',
  has_immutable_version: 'unveränderliche Version vorhanden',
  converted_to_invoice: 'in eine Rechnung überführt',
  partially_or_fully_paid: 'bereits ganz oder teilweise bezahlt',
  issued_invoice_requires_storno: 'gestellte Rechnung — Storno erforderlich',
  fully_paid_invoice: 'vollständig bezahlt — bleibt unverändert in der Buchhaltung',
  invoice_number_retained: 'Rechnungsnummer bleibt vergeben',
  already_cancelled: 'bereits storniert',
  not_a_pristine_draft: 'nicht mehr im Entwurfszustand',
  not_found: 'Datensatz nicht gefunden',
  scope_not_supported: 'für diesen Datentyp nicht vorgesehen',
};

export function describeReasons(reasons: string[]): string[] {
  return reasons.map((code) => deleteReasonLabel[code]).filter((v): v is string => Boolean(v));
}

export interface PlanSummary {
  total: number;
  hardDelete: number;
  cancelAndTrash: number;
  archiveAndTrash: number;
  trashOnly: number;
  blocked: number;
}

export function summarisePlans(plans: DeletePlan[]): PlanSummary {
  const summary: PlanSummary = {
    total: plans.length, hardDelete: 0, cancelAndTrash: 0, archiveAndTrash: 0, trashOnly: 0, blocked: 0,
  };
  for (const plan of plans) {
    if (plan.action === 'hard_delete') summary.hardDelete += 1;
    else if (plan.action === 'cancel_and_trash') summary.cancelAndTrash += 1;
    else if (plan.action === 'archive_and_trash') summary.archiveAndTrash += 1;
    else if (plan.action === 'trash_only') summary.trashOnly += 1;
    else summary.blocked += 1;
  }
  return summary;
}

/** The lines a bulk confirmation prints. Only non-zero groups appear. */
export function summaryLines(summary: PlanSummary): string[] {
  const lines: string[] = [];
  const n = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;
  if (summary.hardDelete) lines.push(`${n(summary.hardDelete, 'Eintrag wird', 'Einträge werden')} endgültig gelöscht`);
  if (summary.cancelAndTrash) lines.push(`${n(summary.cancelAndTrash, 'Rechnung wird', 'Rechnungen werden')} storniert und aus dem Arbeitsbereich entfernt`);
  if (summary.archiveAndTrash) lines.push(`${n(summary.archiveAndTrash, 'Angebot wird', 'Angebote werden')} archiviert und aus dem Arbeitsbereich entfernt`);
  if (summary.trashOnly) lines.push(`${n(summary.trashOnly, 'Eintrag wird', 'Einträge werden')} in den Papierkorb verschoben`);
  if (summary.blocked) lines.push(`${n(summary.blocked, 'Eintrag kann', 'Einträge können')} hier nicht entfernt werden`);
  return lines;
}

/**
 * What the toast says after the fact — which is what actually happened, never a generic
 * "erfolgreich gelöscht" for a record that was only moved.
 */
export function resultToast(results: DeleteResult[]): { tone: 'success' | 'error'; title: string; detail?: string } {
  const failed = results.filter((r) => r.outcome === 'failed' || r.outcome === 'blocked');
  const done = results.filter((r) => r.outcome !== 'failed' && r.outcome !== 'blocked');
  if (done.length === 0) {
    return { tone: 'error', title: 'Nichts entfernt', detail: 'Der Server hat die Aktion abgelehnt.' };
  }

  const kinds = new Set(done.map((r) => r.outcome));
  let title: string;
  if (kinds.size === 1) {
    const only = [...kinds][0];
    title = only === 'hard_deleted' ? (done.length === 1 ? 'Endgültig gelöscht' : `${done.length} endgültig gelöscht`)
      : only === 'cancelled_and_trashed' ? (done.length === 1 ? 'Rechnung storniert und entfernt' : `${done.length} Rechnungen storniert und entfernt`)
      : only === 'archived_and_trashed' ? (done.length === 1 ? 'Angebot archiviert und entfernt' : `${done.length} Angebote archiviert und entfernt`)
      : (done.length === 1 ? 'In Papierkorb verschoben' : `${done.length} in Papierkorb verschoben`);
  } else {
    title = `${done.length} Einträge bearbeitet`;
  }

  const detail = failed.length
    ? `${failed.length} ${failed.length === 1 ? 'Eintrag konnte' : 'Einträge konnten'} nicht entfernt werden.`
    : undefined;
  return { tone: failed.length ? 'error' : 'success', title, detail };
}

/**
 * Folder validation failures are inline field errors, never toasts: the owner is looking at the
 * field they just typed into. Anything the server did not name explicitly stays generic rather
 * than leaking a Postgres message into the dialog.
 */
export function folderErrorText(message: string | null | undefined): string {
  if (!message) return 'Der Ordner konnte nicht gespeichert werden.';
  if (message.includes('folder_name_taken')) return 'Ein Ordner mit diesem Namen existiert bereits.';
  if (message.includes('folder_name_required')) return 'Bitte geben Sie einen Namen ein.';
  if (message.includes('folder_name_too_long')) return 'Höchstens 60 Zeichen.';
  if (message.includes('Owner access required')) return 'Keine Berechtigung.';
  return 'Der Ordner konnte nicht gespeichert werden.';
}

/** Client-side pre-check so an obviously invalid name never reaches the network. */
export function validateFolderName(raw: string, existing: WorkspaceFolder[], ignoreId?: string): string | null {
  const name = raw.trim();
  if (!name) return 'Bitte geben Sie einen Namen ein.';
  if (name.length > 60) return 'Höchstens 60 Zeichen.';
  const clash = existing.some((f) => f.id !== ignoreId && f.name.trim().toLowerCase() === name.toLowerCase());
  return clash ? 'Ein Ordner mit diesem Namen existiert bereits.' : null;
}

/* --------------------------------------------------------------------- api */

interface RawState {
  folders?: { id: string; name: string; sort_order: number; created_at: string }[];
  items?: { resource_id: string; folder_id: string | null; trashed_at: string | null }[];
}

function toState(raw: RawState | null): WorkspaceState {
  const folders = (raw?.folders ?? []).map((f) => ({
    id: f.id, name: f.name, sortOrder: f.sort_order, createdAt: f.created_at,
  }));
  const items: Record<string, WorkspaceItemState> = {};
  for (const item of raw?.items ?? []) {
    items[item.resource_id] = {
      resourceId: item.resource_id, folderId: item.folder_id, trashedAt: item.trashed_at,
    };
  }
  return { folders, items };
}

function toPlans(raw: unknown): DeletePlan[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((entry) => {
    const row = entry as { resource_id: string; action: DeleteAction; reasons?: string[]; dependencies?: Record<string, unknown> };
    return {
      resourceId: row.resource_id,
      action: row.action,
      reasons: row.reasons ?? [],
      dependencies: row.dependencies ?? {},
    };
  });
}

function toResults(raw: unknown): DeleteResult[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((entry) => {
    const row = entry as { resource_id: string; action: DeleteAction; outcome: DeleteOutcome; reasons?: string[]; error?: string | null };
    return {
      resourceId: row.resource_id, action: row.action, outcome: row.outcome,
      reasons: row.reasons ?? [], error: row.error ?? null,
    };
  });
}

/**
 * ONE read per scope: every folder and every item state in a single request, whatever the list
 * length. Nothing here is ever called per row.
 */
export async function loadWorkspaceState(entityId: string, scope: WorkspaceScope): Promise<WorkspaceState> {
  const { data, error } = await supabase.rpc('owner_workspace_state', { p_entity: entityId, p_scope: scope });
  if (error) throw error;
  return toState(data as RawState | null);
}

export async function createWorkspaceFolder(
  entityId: string, scope: WorkspaceScope, name: string,
): Promise<{ folder: WorkspaceFolder | null; error: string | null }> {
  const { data, error } = await supabase.rpc('owner_create_workspace_folder', {
    p_entity: entityId, p_scope: scope, p_name: name,
  });
  if (error) return { folder: null, error: error.message };
  const row = data as { id: string; name: string; sort_order: number } | null;
  if (!row?.id) return { folder: null, error: 'unknown' };
  return { folder: { id: row.id, name: row.name, sortOrder: row.sort_order, createdAt: new Date().toISOString() }, error: null };
}

export async function renameWorkspaceFolder(folderId: string, name: string): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('owner_rename_workspace_folder', { p_folder_id: folderId, p_name: name });
  return { error: error?.message ?? null };
}

/** Deletes the folder ONLY. Every record inside becomes "Ohne Ordner" — see the migration's FK. */
export async function deleteWorkspaceFolder(folderId: string): Promise<{ unassigned: number; error: string | null }> {
  const { data, error } = await supabase.rpc('owner_delete_workspace_folder', { p_folder_id: folderId });
  if (error) return { unassigned: 0, error: error.message };
  return { unassigned: (data as { unassigned_count?: number })?.unassigned_count ?? 0, error: null };
}

/** One request for the whole selection, however many rows it holds. */
export async function moveWorkspaceItems(
  entityId: string, scope: WorkspaceScope, resourceIds: string[], folderId: string | null,
): Promise<{ moved: number; error: string | null }> {
  const { data, error } = await supabase.rpc('owner_move_workspace_items', {
    p_entity: entityId, p_scope: scope, p_resource_ids: resourceIds, p_folder_id: folderId,
  });
  if (error) return { moved: 0, error: error.message };
  return { moved: (data as { moved?: number })?.moved ?? 0, error: null };
}

/** Asks the server what "Löschen" means for these records. The UI never guesses. */
export async function preflightWorkspaceDelete(
  scope: WorkspaceScope, resourceIds: string[],
): Promise<{ plans: DeletePlan[]; error: string | null }> {
  const { data, error } = await supabase.rpc('owner_workspace_delete_preflight', {
    p_scope: scope, p_resource_ids: resourceIds,
  });
  if (error) return { plans: [], error: error.message };
  return { plans: toPlans(data), error: null };
}

export async function deleteWorkspaceItems(
  entityId: string, scope: WorkspaceScope, resourceIds: string[], reason?: string | null,
): Promise<{ results: DeleteResult[]; error: string | null }> {
  const { data, error } = await supabase.rpc('owner_workspace_delete_items', {
    p_entity: entityId, p_scope: scope, p_resource_ids: resourceIds, p_reason: reason ?? null,
  });
  if (error) return { results: [], error: error.message };
  return { results: toResults(data), error: null };
}

export async function restoreWorkspaceItems(
  entityId: string, scope: WorkspaceScope, resourceIds: string[],
): Promise<{ restored: number; error: string | null }> {
  const { data, error } = await supabase.rpc('owner_workspace_restore_items', {
    p_entity: entityId, p_scope: scope, p_resource_ids: resourceIds,
  });
  if (error) return { restored: 0, error: error.message };
  return { restored: (data as { restored?: number })?.restored ?? 0, error: null };
}

/* ================================================================ force delete
 *
 * The second, irreversible path. Everything above this line describes the ordinary
 * "Löschen", which is honest about refusing to destroy a numbered document. This is what the
 * owner reaches for when that refusal is not what they want — a test invoice, a duplicate, a
 * record that must genuinely leave the system rather than sit in the Papierkorb forever.
 *
 * It exists because the original purge could never run: `owner_workspace_delete_items` hard-deletes
 * anything the preflight calls `hard_delete` instead of trashing it, so no record in the Papierkorb
 * ever satisfies the condition `owner_workspace_purge_items` required. See
 * 20260910120000_owner_force_delete.sql.
 *
 * The server enforces all four guards — trashed (or archived) first, the typed phrase, a reason of
 * at least three characters, and a tombstone written in the same transaction. Nothing here may
 * assume any of them; the UI restates them because it is the honest thing to show, not because it
 * is what makes them true.
 */

/** The phrase the owner must type. Must match `owner_force_delete_phrase()` exactly. */
export const FORCE_DELETE_PHRASE = 'ENDGÜLTIG LÖSCHEN';

export const FORCE_DELETE_MIGRATION = '20260910120000_owner_force_delete.sql';

export interface ForceDeletePreview {
  resourceId: string;
  found: boolean;
  label: string | null;
  /** The record as it was, straight from the server. Rendered read-only. */
  summary: Record<string, unknown>;
  /** Table name -> number of rows that will cease to exist. */
  manifest: Record<string, number>;
  reason: string | null;
}

/**
 * German for a physical table name.
 *
 * The manifest is a catalog walk, so it can name a table this map has never heard of. That is
 * deliberate and must stay non-fatal: an unknown table is shown under its own name rather than
 * hidden, because hiding a row count in a destruction confirmation is the one thing this dialog
 * may never do.
 */
export const manifestTableLabel: Record<string, string> = {
  owner_invoices: 'Rechnung',
  owner_invoice_lines: 'Rechnungsposition',
  owner_invoice_versions: 'Rechnungsversion',
  owner_offers: 'Angebot',
  owner_offer_lines: 'Angebotsposition',
  owner_offer_versions: 'Angebotsversion',
  owner_offer_acceptance_events: 'Annahme-Nachweis',
  owner_expenses: 'Beleg',
  owner_expense_lines: 'Belegposition',
  owner_payments: 'Zahlung',
  owner_finance_documents: 'Dokument',
  owner_generated_documents: 'Erzeugtes PDF',
  owner_document_access_tokens: 'Freigabe-Link',
  owner_document_access_events: 'Zugriffsereignis',
  owner_customers: 'Kunde',
  owner_customer_tasks: 'Aufgabe',
  owner_customer_activity: 'Aktivität',
  owner_customer_services: 'Kundenservice',
  owner_subscriptions: 'Abonnement',
  owner_revenue_contracts: 'Umsatzvertrag',
  owner_revenue_contract_lines: 'Vertragsposition',
  owner_revenue_contract_postings: 'Vertragsbuchung',
  owner_service_engagements: 'Onboarding',
  customer_project_invoices: 'Projektverknüpfung',
};

export interface ManifestLine {
  table: string;
  label: string;
  count: number;
}

/**
 * The manifest as sorted, human lines. The record's own table comes first — it is the thing the
 * owner asked to delete — and the dependents follow by descending count.
 */
export function manifestLines(
  manifest: Record<string, number>, primaryTable?: string,
): ManifestLine[] {
  return Object.entries(manifest)
    .filter(([, count]) => count > 0)
    .map(([table, count]) => ({ table, label: manifestTableLabel[table] ?? table, count }))
    .sort((a, b) => {
      if (a.table === primaryTable) return -1;
      if (b.table === primaryTable) return 1;
      return b.count - a.count || a.label.localeCompare(b.label, 'de');
    });
}

/** The physical table behind a scope, so `manifestLines` can put it first. Mirrors the SQL. */
export const scopeTable: Record<string, string> = {
  invoice: 'owner_invoices',
  offer: 'owner_offers',
  expense: 'owner_expenses',
  customer: 'owner_customers',
};

/**
 * Stable server codes turned into something the owner can act on. Anything the server did not
 * name explicitly stays generic rather than leaking a Postgres message into the dialog.
 */
export function forceDeleteErrorText(message: string | null | undefined): string {
  if (!message) return 'Der Datensatz konnte nicht gelöscht werden.';
  if (message.includes('force_delete_confirmation_required')) {
    return `Bitte tippen Sie „${FORCE_DELETE_PHRASE}" exakt so ein.`;
  }
  if (message.includes('force_delete_reason_required')) return 'Bitte geben Sie einen Grund an.';
  if (message.includes('force_delete_requires_archived')) {
    return 'Der Kunde muss zuerst archiviert werden.';
  }
  if (message.includes('force_delete_protected_table')) {
    return 'Dieser Datensatz ist strukturell geschützt und kann nicht gelöscht werden.';
  }
  if (message.includes('force_delete_depth_exceeded')) {
    return 'Der Datensatz hat zu viele verknüpfte Ebenen. Bitte löschen Sie die Verknüpfungen zuerst.';
  }
  if (message.includes('Owner access required')) return 'Keine Berechtigung.';
  if (message.includes('customer not found')) return 'Kunde nicht gefunden.';
  return 'Der Datensatz konnte nicht gelöscht werden.';
}

/** Read-only. Answers "what exactly disappears if I confirm this?" and destroys nothing. */
export async function loadForceDeletePreview(
  scope: string, resourceId: string,
): Promise<{ preview: ForceDeletePreview | null; error: string | null }> {
  const { data, error } = await supabase.rpc('owner_force_delete_preview', {
    p_scope: scope, p_resource_id: resourceId,
  });
  if (error) return { preview: null, error: error.message };
  const row = data as {
    resource_id?: string; found?: boolean; label?: string | null; reason?: string | null;
    summary?: Record<string, unknown>; manifest?: Record<string, number>;
  } | null;
  if (!row) return { preview: null, error: 'unknown' };
  return {
    preview: {
      resourceId: row.resource_id ?? resourceId,
      found: Boolean(row.found),
      label: row.label ?? null,
      summary: row.summary ?? {},
      manifest: row.manifest ?? {},
      reason: row.reason ?? null,
    },
    error: null,
  };
}

/**
 * Destroys the records for real. Only reachable for something already in the Papierkorb — the
 * server checks that itself and returns `blocked` with `not_trashed` otherwise.
 */
export async function forcePurgeWorkspaceItems(
  entityId: string, scope: WorkspaceScope, resourceIds: string[],
  reason: string, confirmation: string,
): Promise<{ results: DeleteResult[]; error: string | null }> {
  const { data, error } = await supabase.rpc('owner_force_purge_items', {
    p_entity: entityId, p_scope: scope, p_resource_ids: resourceIds,
    p_reason: reason, p_confirmation: confirmation,
  });
  if (error) return { results: [], error: error.message };
  return { results: toResults(data), error: null };
}

/**
 * The customer counterpart. The archive is the customer's Papierkorb, so the server refuses
 * anything that is not archived yet — the two-step rule is the same one, spelled differently.
 */
export async function forceDeleteCustomer(
  customerId: string, reason: string, confirmation: string,
): Promise<{ deleted: boolean; label: string | null; error: string | null }> {
  const { data, error } = await supabase.rpc('owner_force_delete_customer', {
    p_customer_id: customerId, p_reason: reason, p_confirmation: confirmation,
  });
  if (error) return { deleted: false, label: null, error: error.message };
  const row = data as { deleted?: boolean; label?: string | null } | null;
  return { deleted: Boolean(row?.deleted), label: row?.label ?? null, error: null };
}

/** What the toast says after a force purge — plainly, with no softening. */
export function forceResultToast(
  results: DeleteResult[],
): { tone: 'success' | 'error'; title: string; detail?: string } {
  const done = results.filter((r) => r.outcome === 'hard_deleted');
  const notTrashed = results.filter((r) => r.error === 'not_trashed');
  if (done.length === 0) {
    return {
      tone: 'error',
      title: 'Nichts gelöscht',
      detail: notTrashed.length
        ? 'Nur Einträge im Papierkorb können endgültig gelöscht werden.'
        : 'Der Server hat die Aktion abgelehnt.',
    };
  }
  const failed = results.length - done.length;
  return {
    tone: failed ? 'error' : 'success',
    title: done.length === 1 ? 'Endgültig gelöscht' : `${done.length} endgültig gelöscht`,
    detail: failed
      ? `${failed} ${failed === 1 ? 'Eintrag konnte' : 'Einträge konnten'} nicht gelöscht werden.`
      : undefined,
  };
}
