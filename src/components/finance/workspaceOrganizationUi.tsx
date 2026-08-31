import {
  useCallback, useEffect, useMemo, useRef, useState, type ReactNode,
} from 'react';
import { useSearchParams } from 'react-router-dom';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  Folder, FolderInput, FolderPlus, MoreHorizontal, Pencil, RotateCcw, Trash2, X,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  Button, Field, Modal, Spinner, border, focusRing, focusRingOnSurface, interactive, radius,
  text, useToast, zIndex,
} from '@/components/dashboard';
import {
  EMPTY_WORKSPACE_STATE, FOLDER_ALL, FOLDER_TRASH, FOLDER_UNFILED,
  createWorkspaceFolder, deleteWorkspaceFolder, deleteWorkspaceItems,
  folderErrorText, loadWorkspaceState, moveWorkspaceItems, preflightWorkspaceDelete,
  purgeWorkspaceItems, renameWorkspaceFolder, restoreWorkspaceItems, resultToast,
  summarisePlans, summaryLines, validateFolderName,
  describeReasons,
  type DeletePlan, type FolderCounts, type FolderSelection, type WorkspaceFolder,
  type WorkspaceScope, type WorkspaceState,
} from '@/lib/ownerFinance/workspaceOrganization';

/**
 * The folder / Papierkorb / delete surface, shared by every owner collection that has one.
 *
 * It is built entirely from the PR #80 system — the same tokens, the same Modal, the same
 * Button, the same focus ring, the same 140–180 ms motion band — because it is meant to read
 * as something that was always part of the Admin Center rather than a feature bolted on top.
 * There is no second visual language here: no gradient, no card, no shadow beyond the one the
 * overlay surface already uses.
 *
 * Everything destructive goes through @/lib/ownerFinance/workspaceOrganization, which goes
 * through an owner-gated RPC. No component in this file decides that a record is safe to
 * delete; it asks the server and renders the answer.
 */

/* ============================================================= URL binding */

export const FOLDER_PARAM = 'folder';

/**
 * Folder selection lives in the query string so a view survives a reload and can be linked.
 * `all` is the default and writes no parameter at all, which keeps the plain list URL plain —
 * and every mutation of the params is a functional update, so `?create=1` and anything else
 * the page owns is preserved rather than clobbered.
 */
export function useFolderSelection(): [FolderSelection, (next: FolderSelection) => void] {
  const [params, setParams] = useSearchParams();
  const selection = params.get(FOLDER_PARAM) || FOLDER_ALL;
  const set = useCallback((next: FolderSelection) => {
    setParams((prev) => {
      const updated = new URLSearchParams(prev);
      if (next === FOLDER_ALL) updated.delete(FOLDER_PARAM);
      else updated.set(FOLDER_PARAM, next);
      return updated;
    }, { replace: true });
  }, [setParams]);
  return [selection, set];
}

/* ==================================================================== hook */

export interface WorkspaceOrganization {
  scope: WorkspaceScope;
  entityId: string | null;
  state: WorkspaceState;
  ready: boolean;
  selection: FolderSelection;
  setSelection: (next: FolderSelection) => void;
  reload: () => Promise<void>;
  /** Local-first update so a move or a trash lands in the same frame as the click. */
  patch: (updater: (previous: WorkspaceState) => WorkspaceState) => void;
}

/**
 * One folder read per scope, never one per row. A move or a delete updates local state and
 * refetches only the workspace state — the page's own row loader is left to the page.
 */
export function useWorkspaceOrganization(entityId: string | null, scope: WorkspaceScope): WorkspaceOrganization {
  const [state, setState] = useState<WorkspaceState>(EMPTY_WORKSPACE_STATE);
  const [ready, setReady] = useState(false);
  const [selection, setSelection] = useFolderSelection();

  const reload = useCallback(async () => {
    if (!entityId) { setState(EMPTY_WORKSPACE_STATE); setReady(true); return; }
    try {
      setState(await loadWorkspaceState(entityId, scope));
    } catch {
      // A workspace whose organization layer is not installed yet is still a usable
      // workspace: the list, its filters and its actions are untouched, there simply
      // are no folders. This must never take the page down.
      setState(EMPTY_WORKSPACE_STATE);
    } finally {
      setReady(true);
    }
  }, [entityId, scope]);

  useEffect(() => { void reload(); }, [reload]);

  return {
    scope, entityId, state, ready, selection, setSelection, reload,
    patch: (updater) => setState(updater),
  };
}

/* ================================================================== menus */

const menuSurface = cn(
  'min-w-[200px] overflow-hidden bg-[var(--cq-surface)] p-1 shadow-[var(--cq-elev-3)]',
  border.hairline, radius.lg, zIndex.popover,
  'data-[state=open]:animate-in data-[state=closed]:animate-out',
  'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
  'data-[state=open]:zoom-in-[0.98] data-[state=closed]:zoom-out-[0.98]',
  'data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1',
  'duration-fast ease-premium',
);

const menuItem = cn(
  'flex min-h-9 cursor-pointer select-none items-center gap-2 px-2.5 text-[13px] leading-5 outline-none',
  radius.sm, 'text-[var(--cq-fg)]',
  'data-[highlighted]:bg-[var(--cq-hover)]',
  'data-[disabled]:pointer-events-none data-[disabled]:opacity-40',
);

/**
 * The row's organisation menu.
 *
 * A menu rather than two more permanently visible buttons: a list row already carries the
 * actions that matter for its lifecycle, and hanging a folder button off every row would be
 * the noise this feature exists to remove. Radix portals the content, so it is never clipped
 * by the table's own overflow or by a sticky header — and it carries `data-cq-portal` so the
 * dashboard tokens and the reduced-motion rules still apply outside the shell subtree.
 */
export function RowOrganizeMenu({ label, items }: {
  label: string;
  items: { key: string; label: string; icon?: typeof Folder; tone?: 'default' | 'danger'; disabled?: boolean; onSelect: () => void }[];
}) {
  if (items.length === 0) return null;
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label={label}
        className={cn(
          'inline-flex h-8 w-8 items-center justify-center text-[var(--cq-fg-subtle)]',
          radius.md, interactive.press, focusRingOnSurface,
          'hover:bg-[var(--cq-hover)] hover:text-[var(--cq-fg)]',
          'data-[state=open]:bg-[var(--cq-hover)] data-[state=open]:text-[var(--cq-fg)]',
        )}
      >
        <MoreHorizontal size={15} aria-hidden="true" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          data-cq-portal="dashboard"
          align="end"
          sideOffset={6}
          collisionPadding={12}
          onClick={(event) => event.stopPropagation()}
          className={menuSurface}
        >
          {items.map((item) => (
            <DropdownMenu.Item
              key={item.key}
              disabled={item.disabled}
              onSelect={item.onSelect}
              className={cn(menuItem, item.tone === 'danger' && 'text-red-600 data-[highlighted]:bg-red-50')}
            >
              {item.icon ? <item.icon size={14} aria-hidden="true" className="shrink-0 opacity-70" /> : null}
              {item.label}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

/* ============================================================ folder rail */

const chipBase = cn(
  'inline-flex h-8 shrink-0 items-center gap-1.5 border px-2.5 text-[12.5px] font-medium',
  radius.md, interactive.press, focusRing,
);
const chipIdle = cn(
  'border-transparent bg-transparent text-[var(--cq-fg-muted)]',
  'hover:bg-[var(--cq-hover)] hover:text-[var(--cq-fg)]',
);
const chipActive = 'border-[var(--cq-accent-border)] bg-[var(--cq-accent-weak)] text-[var(--cq-accent-fg)]';

function Chip({ active, onClick, children, count, title }: {
  active: boolean; onClick: () => void; children: ReactNode; count?: number; title?: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      tabIndex={active ? 0 : -1}
      title={title}
      onClick={onClick}
      className={cn(chipBase, active ? chipActive : chipIdle, 'max-w-[220px]')}
    >
      <span className="min-w-0 truncate">{children}</span>
      {count != null ? (
        <span className={cn('shrink-0 tabular-nums', active ? 'opacity-70' : 'text-[var(--cq-fg-subtle)]')}>
          {count}
        </span>
      ) : null}
    </button>
  );
}

/**
 * The rail itself: Alle · Ohne Ordner · the owner's folders · Papierkorb.
 *
 * One row, chip density identical to the status filter directly above it, and horizontally
 * scrollable rather than wrapping — so a workspace with twenty folders never pushes the table
 * down the page and never gives the PAGE a horizontal scrollbar (the overflow is owned by this
 * strip, which is why `min-w-0` runs all the way down).
 */
export function WorkspaceFolderRail({ org, counts, resourceLabel }: {
  org: WorkspaceOrganization;
  counts: FolderCounts;
  /** Plural noun for the confirmation copy, e.g. "Rechnungen". */
  resourceLabel: string;
}) {
  const toast = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [renaming, setRenaming] = useState<WorkspaceFolder | null>(null);
  const [deleting, setDeleting] = useState<WorkspaceFolder | null>(null);

  const { state, selection, setSelection } = org;

  const railRadioGroupProps = { role: 'radiogroup' as const, 'aria-label': 'Nach Ordner filtern' };

  const removeFolder = async (folder: WorkspaceFolder) => {
    const { unassigned, error } = await deleteWorkspaceFolder(folder.id);
    if (error) { toast.error('Ordner konnte nicht gelöscht werden', 'Bitte erneut versuchen.'); return; }
    if (selection === folder.id) setSelection(FOLDER_ALL);
    setDeleting(null);
    await org.reload();
    toast.success('Ordner gelöscht', unassigned > 0
      ? `${unassigned} ${unassigned === 1 ? 'Eintrag ist' : 'Einträge sind'} jetzt unter „Ohne Ordner".`
      : 'Der Ordner war leer.');
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <div
          {...railRadioGroupProps}
          className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <Chip active={selection === FOLDER_ALL} onClick={() => setSelection(FOLDER_ALL)} count={counts.all}>
            Alle
          </Chip>
          <Chip active={selection === FOLDER_UNFILED} onClick={() => setSelection(FOLDER_UNFILED)} count={counts.unfiled}>
            Ohne Ordner
          </Chip>

          {state.folders.map((folder) => (
            <span key={folder.id} className="flex shrink-0 items-center">
              <Chip
                active={selection === folder.id}
                onClick={() => setSelection(folder.id)}
                count={counts.byFolder[folder.id] ?? 0}
                title={folder.name}
              >
                <span className="inline-flex min-w-0 items-center gap-1.5">
                  <Folder size={13} aria-hidden="true" className="shrink-0 opacity-60" />
                  <span className="min-w-0 truncate">{folder.name}</span>
                </span>
              </Chip>
              {selection === folder.id ? (
                <RowOrganizeMenu
                  label={`Ordner ${folder.name} verwalten`}
                  items={[
                    { key: 'rename', label: 'Umbenennen', icon: Pencil, onSelect: () => setRenaming(folder) },
                    { key: 'delete', label: 'Ordner löschen', icon: Trash2, tone: 'danger', onSelect: () => setDeleting(folder) },
                  ]}
                />
              ) : null}
            </span>
          ))}

          <span className="mx-1 h-4 w-px shrink-0 bg-[var(--cq-border)]" aria-hidden="true" />
          <Chip active={selection === FOLDER_TRASH} onClick={() => setSelection(FOLDER_TRASH)} count={counts.trash}>
            Papierkorb
          </Chip>
        </div>

        {/* The label shortens to the icon on a phone, so the accessible name is stated
            explicitly rather than left to whatever text happens to be visible. */}
        <Button
          size="sm"
          variant="ghost"
          icon={FolderPlus}
          aria-label="Neuer Ordner"
          onClick={() => setCreateOpen(true)}
          disabled={!org.entityId}
        >
          <span className="hidden sm:inline">Ordner</span>
        </Button>
      </div>

      <FolderNameDialog
        open={createOpen}
        title="Neuer Ordner"
        confirmLabel="Ordner anlegen"
        existing={state.folders}
        onClose={() => setCreateOpen(false)}
        onSubmit={async (name) => {
          if (!org.entityId) return 'Kein Geschäftsbereich aktiv.';
          const { folder, error } = await createWorkspaceFolder(org.entityId, org.scope, name);
          if (error || !folder) return folderErrorText(error);
          await org.reload();
          setCreateOpen(false);
          setSelection(folder.id);
          return null;
        }}
      />

      <FolderNameDialog
        open={Boolean(renaming)}
        title="Ordner umbenennen"
        confirmLabel="Speichern"
        initial={renaming?.name ?? ''}
        existing={state.folders}
        ignoreId={renaming?.id}
        onClose={() => setRenaming(null)}
        onSubmit={async (name) => {
          if (!renaming) return null;
          const { error } = await renameWorkspaceFolder(renaming.id, name);
          if (error) return folderErrorText(error);
          await org.reload();
          setRenaming(null);
          return null;
        }}
      />

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Ordner löschen?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleting(null)}>Abbrechen</Button>
            <Button variant="danger" onClick={() => { if (deleting) void removeFolder(deleting); }}>
              Ordner löschen
            </Button>
          </>
        }
      >
        <p className={text.body}>
          Der Ordner „{deleting?.name}" wird entfernt.{' '}
          <strong className="font-medium text-[var(--cq-fg)]">
            Die {resourceLabel} darin werden nicht gelöscht
          </strong>{' '}
          — sie erscheinen anschließend unter „Ohne Ordner".
        </p>
      </Modal>
    </>
  );
}

/**
 * Create/rename. One field, Enter submits, the folder exists the moment the server confirms.
 * Validation is an inline field error, not a toast: the owner is looking at the input.
 */
function FolderNameDialog({
  open, title, confirmLabel, initial = '', existing, ignoreId, onClose, onSubmit,
}: {
  open: boolean;
  title: string;
  confirmLabel: string;
  initial?: string;
  existing: WorkspaceFolder[];
  ignoreId?: string;
  onClose: () => void;
  /** Resolves to an error message, or null on success. */
  onSubmit: (name: string) => Promise<string | null>;
}) {
  const [name, setName] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const openedWith = useRef(initial);

  useEffect(() => {
    if (!open) return;
    openedWith.current = initial;
    setName(initial);
    setError(null);
    setBusy(false);
  }, [open, initial]);

  const submit = async () => {
    const local = validateFolderName(name, existing, ignoreId);
    if (local) { setError(local); return; }
    setBusy(true);
    const message = await onSubmit(name.trim());
    setBusy(false);
    if (message) setError(message);
  };

  return (
    <Modal
      open={open}
      onClose={busy ? () => {} : onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>Abbrechen</Button>
          <Button onClick={() => void submit()} loading={busy}>{confirmLabel}</Button>
        </>
      }
    >
      <form
        onSubmit={(event) => { event.preventDefault(); void submit(); }}
      >
        <Field
          id="workspace-folder-name"
          label="Name"
          value={name}
          onChange={(value) => { setName(value); if (error) setError(null); }}
          error={error ?? undefined}
          hint="z. B. 2026, SV Heinersreuth, Archiv"
          autoFocus
        />
        {/* Enter submits. aria-hidden + tabIndex so it is a keyboard convenience only and
            never a second copy of the footer button in the accessibility tree. */}
        <button type="submit" aria-hidden="true" tabIndex={-1} className="sr-only">{confirmLabel}</button>
      </form>
    </Modal>
  );
}

/* ============================================================== bulk bar */

/** X ausgewählt · In Ordner verschieben · Löschen · Auswahl aufheben. Nothing else. */
export function WorkspaceBulkBar({ count, onMove, onDelete, onClear, deleteLabel = 'Löschen' }: {
  count: number;
  onMove: () => void;
  onDelete: () => void;
  onClear: () => void;
  deleteLabel?: string;
}) {
  if (count === 0) return null;
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 bg-[var(--cq-sunken)] px-3 py-2',
        border.hairline, radius.lg,
        'animate-in fade-in slide-in-from-top-1 duration-fast ease-premium',
      )}
    >
      <span className={cn('mr-1', text.bodyStrong)}>{count} ausgewählt</span>
      <Button size="sm" variant="secondary" icon={FolderInput} onClick={onMove}>In Ordner verschieben</Button>
      <Button size="sm" variant="ghost" icon={Trash2} onClick={onDelete}>{deleteLabel}</Button>
      <Button size="sm" variant="ghost" icon={X} onClick={onClear} className="ml-auto">Auswahl aufheben</Button>
    </div>
  );
}

/* ========================================================== move dialog */

export function MoveToFolderDialog({ open, org, resourceIds, onClose, onDone }: {
  open: boolean;
  org: WorkspaceOrganization;
  resourceIds: string[];
  onClose: () => void;
  onDone: () => void;
}) {
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  const move = async (folderId: string | null) => {
    if (!org.entityId || resourceIds.length === 0) return;
    setBusy(folderId ?? FOLDER_UNFILED);
    const { error } = await moveWorkspaceItems(org.entityId, org.scope, resourceIds, folderId);
    setBusy(null);
    if (error) { toast.error('Verschieben fehlgeschlagen', 'Bitte erneut versuchen.'); return; }
    await org.reload();
    onClose();
    onDone();
    const target = folderId ? org.state.folders.find((f) => f.id === folderId)?.name ?? 'Ordner' : 'Ohne Ordner';
    toast.success(
      resourceIds.length === 1 ? 'Verschoben' : `${resourceIds.length} verschoben`,
      `Jetzt in „${target}".`,
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="In Ordner verschieben"
      description={resourceIds.length === 1 ? undefined : `${resourceIds.length} Einträge`}
      size="sm"
      footer={<Button variant="secondary" onClick={onClose}>Abbrechen</Button>}
    >
      <div className="space-y-1">
        <FolderTarget label="Ohne Ordner" busy={busy === FOLDER_UNFILED} onClick={() => void move(null)} />
        {org.state.folders.map((folder) => (
          <FolderTarget
            key={folder.id}
            label={folder.name}
            icon
            busy={busy === folder.id}
            onClick={() => void move(folder.id)}
          />
        ))}
        {org.state.folders.length === 0 ? (
          <p className={cn('pt-2', text.hint)}>
            Noch keine Ordner. Legen Sie oben in der Ordnerleiste einen an.
          </p>
        ) : null}
      </div>
    </Modal>
  );
}

function FolderTarget({ label, onClick, busy, icon }: {
  label: string; onClick: () => void; busy?: boolean; icon?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={cn(
        'flex w-full items-center gap-2 px-2.5 py-2 text-left text-[13px] text-[var(--cq-fg)]',
        radius.md, interactive.press, focusRingOnSurface,
        'hover:bg-[var(--cq-hover)] disabled:opacity-60',
      )}
    >
      {icon ? <Folder size={14} aria-hidden="true" className="shrink-0 opacity-60" /> : <span className="w-3.5" />}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {busy ? <Spinner className="h-3.5 w-3.5" /> : null}
    </button>
  );
}

/* ======================================================== delete dialog */

const singleTitle: Record<string, string> = {
  hard_delete: 'Endgültig löschen?',
  cancel_and_trash: 'Rechnung entfernen?',
  archive_and_trash: 'Angebot entfernen?',
  trash_only: 'Aus Arbeitsbereich entfernen?',
  blocked: 'Nicht möglich',
};

/**
 * Truthful confirmation copy, chosen by what the SERVER said it will do.
 *
 * The one thing this dialog must never do is promise a deletion that will not happen — which
 * is why the wording, the button label and the toast afterwards all come from the same
 * preflight answer rather than from the word on the menu item.
 */
function singleBody(plan: DeletePlan, resourceSingular: string): ReactNode {
  const reasons = describeReasons(plan.reasons);
  if (plan.action === 'hard_delete') {
    return (
      <>
        <p>Dieser Eintrag wird dauerhaft entfernt und kann nicht wiederhergestellt werden.</p>
        {reasons.length ? <p className="mt-2 text-[var(--cq-fg-subtle)]">{reasons.join(' · ')}</p> : null}
      </>
    );
  }
  if (plan.action === 'cancel_and_trash') {
    return (
      <>
        <p>
          Die Rechnung wird aus dem Arbeitsbereich entfernt. Die Rechnungsnummer und der gesetzlich
          erforderliche Nachweis bleiben erhalten.
        </p>
        <p className="mt-2">
          Dafür wird die vorhandene Storno-Funktion verwendet: Die Rechnung bleibt mit ihrer Nummer,
          ihren Beträgen und ihren Zahlungen in der Buchhaltung und wird als storniert geführt.
        </p>
      </>
    );
  }
  if (plan.action === 'archive_and_trash') {
    return (
      <>
        <p>
          Das Angebot wird archiviert und aus dem Arbeitsbereich entfernt. Versionen, erzeugte
          Dokumente und Annahme-Nachweise bleiben vollständig erhalten.
        </p>
        {reasons.length ? <p className="mt-2 text-[var(--cq-fg-subtle)]">{reasons.join(' · ')}</p> : null}
      </>
    );
  }
  if (plan.action === 'trash_only') {
    return (
      <>
        <p>
          Der Eintrag wird aus der normalen Liste ausgeblendet. Er bleibt in Buchhaltung und Historie
          unverändert erhalten und kann jederzeit aus dem Papierkorb wiederhergestellt werden.
        </p>
        {reasons.length ? <p className="mt-2 text-[var(--cq-fg-subtle)]">{reasons.join(' · ')}</p> : null}
      </>
    );
  }
  return <p>Dieser {resourceSingular} kann hier nicht entfernt werden.</p>;
}

const confirmLabelFor: Record<string, string> = {
  hard_delete: 'Endgültig löschen',
  cancel_and_trash: 'Stornieren und entfernen',
  archive_and_trash: 'Archivieren und entfernen',
  trash_only: 'In Papierkorb verschieben',
};

/**
 * Runs the server preflight when it opens, states exactly what will happen, and performs it.
 *
 * On failure the record stays where it is, the selection stays intact and the error is
 * actionable — nothing is optimistically hidden before the server has confirmed it.
 */
export function WorkspaceDeleteDialog({
  open, org, resourceIds, onClose, onDone, resourceSingular, resourcePlural, mode = 'delete',
}: {
  open: boolean;
  org: WorkspaceOrganization;
  resourceIds: string[];
  onClose: () => void;
  onDone: () => void;
  resourceSingular: string;
  resourcePlural: string;
  /** `purge` is the Papierkorb's "Endgültig löschen"; it only ever hard-deletes. */
  mode?: 'delete' | 'purge';
}) {
  const toast = useToast();
  const [plans, setPlans] = useState<DeletePlan[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  useEffect(() => {
    if (!open || resourceIds.length === 0) { setPlans(null); setFailure(null); return; }
    let cancelled = false;
    setPlans(null);
    setFailure(null);
    void preflightWorkspaceDelete(org.scope, resourceIds).then(({ plans: next, error }) => {
      if (cancelled) return;
      if (error) { setFailure('Die Prüfung konnte nicht abgeschlossen werden.'); return; }
      setPlans(next);
    });
    return () => { cancelled = true; };
    // resourceIds is a fresh array each render; its identity is not the input, its contents are.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, org.scope, resourceIds.join(',')]);

  const summary = useMemo(() => (plans ? summarisePlans(plans) : null), [plans]);
  const single = plans?.length === 1 ? plans[0] : null;

  const run = async () => {
    if (!org.entityId) return;
    setBusy(true);
    setFailure(null);
    const { results, error } = mode === 'purge'
      ? await purgeWorkspaceItems(org.entityId, org.scope, resourceIds)
      : await deleteWorkspaceItems(org.entityId, org.scope, resourceIds);
    setBusy(false);
    if (error) { setFailure('Der Server hat die Aktion abgelehnt. Es wurde nichts verändert.'); return; }
    const toastPayload = resultToast(results);
    await org.reload();
    onClose();
    onDone();
    if (toastPayload.tone === 'success') toast.success(toastPayload.title, toastPayload.detail);
    else toast.error(toastPayload.title, toastPayload.detail);
  };

  const actionable = mode === 'purge'
    ? (summary?.hardDelete ?? 0) > 0
    : (summary ? summary.total - summary.blocked > 0 : false);

  const title = mode === 'purge'
    ? 'Endgültig löschen?'
    : single ? (singleTitle[single.action] ?? 'Entfernen?')
    : `${resourceIds.length} ${resourcePlural} entfernen?`;

  const confirmLabel = mode === 'purge'
    ? 'Endgültig löschen'
    : single ? (confirmLabelFor[single.action] ?? 'Entfernen') : 'Entfernen';

  return (
    <Modal
      open={open}
      onClose={busy ? () => {} : onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>Abbrechen</Button>
          <Button
            variant={single?.action === 'hard_delete' || mode === 'purge' ? 'danger' : 'primary'}
            onClick={() => void run()}
            loading={busy}
            disabled={!plans || !actionable}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {!plans ? (
        <div className="flex items-center gap-2 py-1">
          <Spinner className="h-4 w-4" />
          <span className={text.body}>Wird geprüft …</span>
        </div>
      ) : single ? (
        <div className={text.body}>{singleBody(single, resourceSingular)}</div>
      ) : (
        <div className={text.body}>
          <p className="font-medium text-[var(--cq-fg)]">{resourceIds.length} ausgewählt</p>
          <ul className="mt-2 space-y-1">
            {(summary ? summaryLines(summary) : []).map((line) => (
              <li key={line} className="flex gap-2">
                <span aria-hidden="true" className="text-[var(--cq-fg-subtle)]">·</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[var(--cq-fg-subtle)]">
            Jeder Eintrag wird einzeln behandelt. Was aus Nachweis- oder Buchhaltungsgründen erhalten
            bleiben muss, bleibt erhalten.
          </p>
        </div>
      )}
      {failure ? <p className="mt-3 text-[13px] text-red-600">{failure}</p> : null}
    </Modal>
  );
}

/* ============================================================ trash notes */

/**
 * The Papierkorb row actions. "Endgültig löschen" appears ONLY where the server preflight says
 * a hard delete is genuinely available — a button that would always refuse is worse than no
 * button. Where it is absent, the row states why, once, without lecturing.
 */
export function TrashRowActions({ plan, onRestore, onPurge }: {
  plan: DeletePlan | undefined;
  onRestore: () => void;
  onPurge: () => void;
}) {
  const purgeable = plan?.action === 'hard_delete';
  return (
    <div className="flex items-center justify-end gap-1.5">
      <Button size="sm" variant="secondary" icon={RotateCcw} onClick={onRestore}>Wiederherstellen</Button>
      {purgeable ? (
        <Button size="sm" variant="ghost" icon={Trash2} onClick={onPurge}>Endgültig löschen</Button>
      ) : (
        <span className={cn('max-w-[220px] text-right', text.hint)}>
          Muss aus Nachweis-/Buchhaltungsgründen erhalten bleiben.
        </span>
      )}
    </div>
  );
}

/**
 * The preflight for everything currently in the Papierkorb, in ONE request.
 *
 * The trash view needs to know, per row, whether "Endgültig löschen" is genuinely available.
 * Asking per row would be exactly the N+1 this feature is supposed to avoid, so the whole
 * visible set is resolved in a single call and indexed by resource id.
 */
export function useTrashPlans(scope: WorkspaceScope, resourceIds: string[], active: boolean): Record<string, DeletePlan> {
  const [plans, setPlans] = useState<Record<string, DeletePlan>>({});
  const key = resourceIds.join(',');

  useEffect(() => {
    if (!active || resourceIds.length === 0) { setPlans({}); return; }
    let cancelled = false;
    void preflightWorkspaceDelete(scope, resourceIds).then(({ plans: next }) => {
      if (cancelled) return;
      const indexed: Record<string, DeletePlan> = {};
      for (const plan of next) indexed[plan.resourceId] = plan;
      setPlans(indexed);
    });
    return () => { cancelled = true; };
    // The contents are the input, not the array identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, key, active]);

  return plans;
}

/**
 * Restore is a plain action, not a confirmation: it is the reversible one.
 */
export async function restoreFromTrash(
  org: WorkspaceOrganization, resourceIds: string[],
): Promise<{ error: string | null }> {
  if (!org.entityId) return { error: 'no entity' };
  const { error } = await restoreWorkspaceItems(org.entityId, org.scope, resourceIds);
  if (!error) await org.reload();
  return { error };
}
