import {
  useCallback, useEffect, useMemo, useRef, useState, type ReactNode,
} from 'react';
import { useSearchParams } from 'react-router-dom';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  ChevronLeft, Folder, FolderInput, FolderOpen, FolderPlus, LayoutList, MoreHorizontal,
  Pencil, RotateCcw, Trash2, X, type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  Button, Field, Modal, Spinner, border, focusRing, focusRingOnSurface, interactive, radius,
  surface, text, useToast, zIndex,
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
 *
 * NO PARAMETER MEANS THE FOLDER OVERVIEW, not "all records". That is the whole point of the
 * folder-first navigation: opening Rechnungen shows folders, and a record list is something
 * the owner enters deliberately. `null` is therefore a real state, not a missing value.
 *
 * Every mutation is a functional update on the existing params, so `?create=1` and anything
 * else the page owns is preserved rather than clobbered.
 */
export function useFolderSelection(): [FolderSelection | null, (next: FolderSelection | null) => void] {
  const [params, setParams] = useSearchParams();
  const selection = params.get(FOLDER_PARAM) || null;
  const set = useCallback((next: FolderSelection | null) => {
    setParams((prev) => {
      const updated = new URLSearchParams(prev);
      if (next === null) updated.delete(FOLDER_PARAM);
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
  /** `null` is the folder overview. A string is a folder id or a system view. */
  selection: FolderSelection | null;
  setSelection: (next: FolderSelection | null) => void;
  /** True while no folder is open — the page shows folders, never records. */
  isOverview: boolean;
  /**
   * What the record list filters by. On the overview this is FOLDER_ALL so anything that
   * legitimately spans the whole collection — the export menu, the stat band — keeps
   * working unchanged; the table simply is not rendered there.
   */
  view: FolderSelection;
  /** The custom folder currently open, if the selection names one. */
  activeFolder: WorkspaceFolder | null;
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

  const isSystem = selection === FOLDER_ALL || selection === FOLDER_UNFILED || selection === FOLDER_TRASH;
  const activeFolder = selection && !isSystem
    ? state.folders.find((folder) => folder.id === selection) ?? null
    : null;

  /**
   * A folder id in the URL that no longer resolves — deleted in another tab, an old
   * bookmark, a typo — must not leave the owner staring at an empty list. Once the state
   * has actually loaded, the parameter is dropped and the overview takes over.
   */
  useEffect(() => {
    if (!ready || !selection || isSystem || activeFolder) return;
    setSelection(null);
  }, [ready, selection, isSystem, activeFolder, setSelection]);

  const resolved = selection && !isSystem && !activeFolder ? null : selection;

  return {
    scope, entityId, state, ready,
    selection: resolved,
    setSelection,
    isOverview: resolved === null,
    view: resolved ?? FOLDER_ALL,
    activeFolder,
    reload,
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

/* ======================================================== folder overview */

/**
 * Folder create / rename / delete, in one place.
 *
 * The overview and the in-folder header both need these dialogs and neither should own a
 * second copy, so the state and the JSX live here and each surface just calls `open*`.
 * Every one of them goes through the same backend path as before — nothing about creating,
 * renaming or deleting a folder changed in this feature.
 */
function useFolderAdmin(org: WorkspaceOrganization, resourceLabel: string) {
  const toast = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [renaming, setRenaming] = useState<WorkspaceFolder | null>(null);
  const [deleting, setDeleting] = useState<WorkspaceFolder | null>(null);

  const removeFolder = async (folder: WorkspaceFolder) => {
    const { unassigned, error } = await deleteWorkspaceFolder(folder.id);
    if (error) { toast.error('Ordner konnte nicht gelöscht werden', 'Bitte erneut versuchen.'); return; }
    // Deleting the folder you are standing in returns you to the overview rather than to
    // a view that no longer exists.
    if (org.selection === folder.id) org.setSelection(null);
    setDeleting(null);
    await org.reload();
    toast.success('Ordner gelöscht', unassigned > 0
      ? `${unassigned} ${unassigned === 1 ? 'Eintrag ist' : 'Einträge sind'} jetzt unter „Ohne Ordner".`
      : 'Der Ordner war leer.');
  };

  const dialogs = (
    <>
      <FolderNameDialog
        open={createOpen}
        title="Neuer Ordner"
        confirmLabel="Ordner anlegen"
        existing={org.state.folders}
        onClose={() => setCreateOpen(false)}
        onSubmit={async (name) => {
          if (!org.entityId) return 'Kein Geschäftsbereich aktiv.';
          const { folder, error } = await createWorkspaceFolder(org.entityId, org.scope, name);
          if (error || !folder) return folderErrorText(error);
          await org.reload();
          setCreateOpen(false);
          // Stay on the overview. The point of creating a folder is to organise into it,
          // and dropping the owner into an empty list would hide the folder they just made.
          return null;
        }}
      />

      <FolderNameDialog
        open={Boolean(renaming)}
        title="Ordner umbenennen"
        confirmLabel="Speichern"
        initial={renaming?.name ?? ''}
        existing={org.state.folders}
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

  return {
    openCreate: () => setCreateOpen(true),
    openRename: (folder: WorkspaceFolder) => setRenaming(folder),
    openDelete: (folder: WorkspaceFolder) => setDeleting(folder),
    dialogs,
  };
}

/** The menu items a custom folder offers. System folders get none — they cannot be edited. */
function folderMenuItems(
  folder: WorkspaceFolder,
  admin: { openRename: (f: WorkspaceFolder) => void; openDelete: (f: WorkspaceFolder) => void },
) {
  return [
    { key: 'rename', label: 'Umbenennen', icon: Pencil, onSelect: () => admin.openRename(folder) },
    { key: 'delete', label: 'Ordner löschen', icon: Trash2, tone: 'danger' as const, onSelect: () => admin.openDelete(folder) },
  ];
}

/**
 * One folder tile.
 *
 * The whole tile is the click target, so the accessible name lives on a button stretched
 * across it rather than on the visible text — a nested button (the overflow menu) inside a
 * button would be invalid markup and would swallow the menu's own clicks. The content is
 * pointer-transparent; only the menu sits above the overlay.
 */
function FolderTile({ name, count, caption, icon: Icon, onOpen, menu, tone = 'folder' }: {
  name: string;
  count: number;
  caption?: string;
  icon: LucideIcon;
  onOpen: () => void;
  menu?: ReactNode;
  tone?: 'folder' | 'system';
}) {
  return (
    <div
      className={cn(
        'group relative flex min-h-[92px] flex-col justify-between p-3.5',
        surface.card, interactive.transition,
        'hover:border-[var(--cq-border-strong)] hover:bg-[var(--cq-hover)]',
        'focus-within:border-[var(--cq-border-strong)]',
      )}
    >
      {/* The stretched click target. Everything visible above it is decoration. */}
      <button
        type="button"
        onClick={onOpen}
        aria-label={`${name} öffnen — ${count} ${count === 1 ? 'Eintrag' : 'Einträge'}`}
        className={cn('absolute inset-0 rounded-[12px]', interactive.press, focusRing)}
      />

      <div className="pointer-events-none flex items-start justify-between gap-2">
        <Icon
          size={16}
          aria-hidden="true"
          className={cn('shrink-0', tone === 'system' ? 'text-[var(--cq-fg-subtle)]' : 'text-[var(--cq-accent-fg)] opacity-80')}
        />
        <span className={cn('shrink-0 tabular-nums', text.bodyStrong)}>{count}</span>
      </div>

      {/* The menu sits on the caption line, not beside the count: at the top right the two
          would collide, and the count is the thing the eye is scanning for. */}
      <div className="mt-2 flex items-end justify-between gap-2">
        <div className="pointer-events-none min-w-0">
          <div className={cn('truncate', text.cardTitle)} title={name}>{name}</div>
          {caption ? <div className={cn('mt-0.5 truncate', text.hint)}>{caption}</div> : null}
        </div>
        {menu ? <div className="relative z-10 -mb-1 -mr-1 shrink-0">{menu}</div> : null}
      </div>
    </div>
  );
}

/**
 * THE FOLDER OVERVIEW — what the owner sees when they open Rechnungen, Angebote or Ausgaben.
 *
 * Folders, and only folders. No record rows, no table, no status filters, no bulk bar: the
 * list is something you enter, which is the entire reason this exists. A collection with
 * dozens of invoices should open calm rather than dumping every row on the screen.
 *
 * Custom folders come first; the three system views sit under a hairline so they read as a
 * different kind of thing without needing a different visual language. Counts come from the
 * folder state the page already loaded — one read per scope, never one per folder.
 */
export function WorkspaceFolderOverview({ org, counts, resourceLabel, resourcePlural }: {
  org: WorkspaceOrganization;
  counts: FolderCounts;
  /** Plural noun for the confirmation copy, e.g. "Rechnungen". */
  resourceLabel: string;
  /** Caption under a folder name, e.g. "Rechnungen". Usually the same word. */
  resourcePlural: string;
}) {
  const admin = useFolderAdmin(org, resourceLabel);
  const { state, setSelection } = org;

  const grid = 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

  return (
    <div className="animate-in fade-in slide-in-from-top-1 duration-fast ease-premium">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className={text.sectionTitle}>Ordner</h2>
        <Button
          size="sm"
          variant="secondary"
          icon={FolderPlus}
          onClick={admin.openCreate}
          disabled={!org.entityId}
        >
          Neuer Ordner
        </Button>
      </div>

      {state.folders.length > 0 ? (
        <div className={grid}>
          {state.folders.map((folder) => (
            <FolderTile
              key={folder.id}
              name={folder.name}
              count={counts.byFolder[folder.id] ?? 0}
              caption={resourcePlural}
              icon={Folder}
              onOpen={() => setSelection(folder.id)}
              menu={<RowOrganizeMenu label={`Ordner ${folder.name} verwalten`} items={folderMenuItems(folder, admin)} />}
            />
          ))}
        </div>
      ) : (
        <div className={cn('px-4 py-6 text-center', surface.sunken)}>
          <p className={text.bodyStrong}>Noch keine Ordner</p>
          <p className={cn('mt-1', text.body)}>
            Legen Sie einen Ordner an — zum Beispiel einen Kundennamen, ein Jahr oder ein Projekt.
          </p>
        </div>
      )}

      {/* The system views. Same tile, quieter icon: they behave identically but cannot be
          renamed or deleted, so they carry no overflow menu. */}
      <div className={cn('mt-4 pt-4', border.hairlineT)}>
        <div className={grid}>
          <FolderTile
            name="Alle Einträge"
            count={counts.all}
            caption="ohne Ordnerfilter"
            icon={LayoutList}
            tone="system"
            onOpen={() => setSelection(FOLDER_ALL)}
          />
          <FolderTile
            name="Ohne Ordner"
            count={counts.unfiled}
            caption="noch nicht einsortiert"
            icon={FolderOpen}
            tone="system"
            onOpen={() => setSelection(FOLDER_UNFILED)}
          />
          <FolderTile
            name="Papierkorb"
            count={counts.trash}
            caption="aus dem Arbeitsbereich entfernt"
            icon={Trash2}
            tone="system"
            onOpen={() => setSelection(FOLDER_TRASH)}
          />
        </div>
      </div>

      {admin.dialogs}
    </div>
  );
}

/**
 * Copy for a custom folder that genuinely holds nothing.
 *
 * Returns null unless the owner is standing in a custom folder whose count is zero, so a
 * folder that merely looks empty because of an active status filter or search still gets the
 * page's own "no match" wording instead of being called empty.
 */
export function emptyFolderCopy(
  org: WorkspaceOrganization, counts: FolderCounts,
): { title: string; description: string } | null {
  const folder = org.activeFolder;
  if (!folder || (counts.byFolder[folder.id] ?? 0) !== 0) return null;
  return {
    title: 'Noch keine Einträge in diesem Ordner',
    description: 'Verschieben Sie Einträge über „In Ordner verschieben" im Zeilenmenü hierher.',
  };
}

/* ================================================== in-folder context bar */

const systemFolderLabel: Record<string, string> = {
  [FOLDER_ALL]: 'Alle Einträge',
  [FOLDER_UNFILED]: 'Ohne Ordner',
  [FOLDER_TRASH]: 'Papierkorb',
};

/**
 * The band that says which folder you are standing in.
 *
 * Deliberately small: the page keeps its own WorkspaceHeader, and a second full-size header
 * would read as a different page rather than a folder inside one. A back control, the folder
 * name, its count, and — for a custom folder — the same rename/delete menu the overview offers.
 */
export function WorkspaceFolderContextHeader({ org, counts, resourceLabel, backLabel }: {
  org: WorkspaceOrganization;
  counts: FolderCounts;
  /** Plural noun for the count line and the delete copy, e.g. "Rechnungen". */
  resourceLabel: string;
  /** The page's own name, used on the back control: "← Rechnungen". */
  backLabel: string;
}) {
  const admin = useFolderAdmin(org, resourceLabel);
  const folder = org.activeFolder;
  const name = folder?.name ?? systemFolderLabel[org.view] ?? backLabel;
  const count = folder
    ? counts.byFolder[folder.id] ?? 0
    : org.view === FOLDER_TRASH ? counts.trash
    : org.view === FOLDER_UNFILED ? counts.unfiled
    : counts.all;

  return (
    <div className="animate-in fade-in slide-in-from-top-1 duration-fast ease-premium">
      {/* Not history.back(): this has to behave the same after a direct URL load, so it
          clears the parameter rather than popping whatever came before. */}
      <button
        type="button"
        onClick={() => org.setSelection(null)}
        className={cn(
          '-ml-1 inline-flex items-center gap-1 px-1 py-0.5 text-[12px] font-medium text-[var(--cq-fg-muted)]',
          radius.sm, interactive.transition, focusRing, 'hover:text-[var(--cq-fg)]',
        )}
      >
        <ChevronLeft size={13} aria-hidden="true" />
        {backLabel}
      </button>

      <div className="mt-1 flex items-center gap-2">
        <h2 className={cn('min-w-0 truncate', text.cardTitle)} title={name}>{name}</h2>
        <span className={cn('shrink-0', text.hint)}>
          {count} {count === 1 ? 'Eintrag' : 'Einträge'}
        </span>
        {folder ? (
          <RowOrganizeMenu label={`Ordner ${folder.name} verwalten`} items={folderMenuItems(folder, admin)} />
        ) : null}
      </div>

      {admin.dialogs}
    </div>
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
