// ─────────────────────────────────────────────────────────────────────────────
// The owner workspace organization layer, client side.
//
// Two things are pinned here:
//
//  1. The pure logic the folder rail and the confirmations are built on — folder
//     filtering (which must COMPOSE with the page's own filters, never replace
//     them), counts, validation, and the copy that states what actually happened.
//
//  2. The wiring. Every destructive or organisational operation must reach a
//     named owner-gated RPC and must never touch a table from the browser, which
//     is asserted the same way destructiveRpcWiring.test.ts asserts it for the
//     pre-existing paths: `from` throws if anything calls it.
// ─────────────────────────────────────────────────────────────────────────────
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Types only — erased at compile time, so this does not defeat the vi.mock hoisting that the
// dynamic import below exists for.
import type {
  DeleteAction, DeleteOutcome, DeletePlan, DeleteResult, WorkspaceState,
} from '@/lib/ownerFinance/workspaceOrganization';

const rpc = vi.fn(async () => ({ data: null, error: null }));
const from = vi.fn(() => { throw new Error('workspace organization must not touch tables directly'); });

vi.mock('@/lib/supabase', () => ({ supabase: { rpc, from } }));

const w = await import('@/lib/ownerFinance/workspaceOrganization');

const state = (
  folders: { id: string; name: string }[],
  items: Record<string, { folderId?: string | null; trashedAt?: string | null }>,
): WorkspaceState => ({
  folders: folders.map((f, index) => ({ ...f, sortOrder: index, createdAt: '2026-01-01' })),
  items: Object.fromEntries(Object.entries(items).map(([id, value]) => [
    id, { resourceId: id, folderId: value.folderId ?? null, trashedAt: value.trashedAt ?? null },
  ])),
});

const rows = (...ids: string[]) => ids.map((id) => ({ id }));
const byId = (row: { id: string }) => row.id;

beforeEach(() => {
  rpc.mockClear();
  from.mockClear();
  rpc.mockResolvedValue({ data: null, error: null } as never);
});

describe('folder filtering', () => {
  const s = state([{ id: 'f1', name: 'SV Heinersreuth' }, { id: 'f2', name: 'Archiv' }], {
    a: { folderId: 'f1' },
    b: { folderId: 'f1' },
    c: { folderId: 'f2' },
    d: { trashedAt: '2026-03-01T10:00:00Z' },
    e: { folderId: 'f1', trashedAt: '2026-03-01T10:00:00Z' },
  });
  const all = rows('a', 'b', 'c', 'd', 'e', 'f');

  it('"Alle" shows everything that is not in the Papierkorb', () => {
    expect(w.filterByFolder(all, byId, s, w.FOLDER_ALL).map(byId)).toEqual(['a', 'b', 'c', 'f']);
  });

  it('a folder shows only its own records', () => {
    expect(w.filterByFolder(all, byId, s, 'f1').map(byId)).toEqual(['a', 'b']);
  });

  it('"Ohne Ordner" is everything unfiled, and a record with no state row at all counts', () => {
    expect(w.filterByFolder(all, byId, s, w.FOLDER_UNFILED).map(byId)).toEqual(['f']);
  });

  it('the Papierkorb is the only view a trashed record appears in', () => {
    expect(w.filterByFolder(all, byId, s, w.FOLDER_TRASH).map(byId)).toEqual(['d', 'e']);
    // 'e' is filed in f1 AND trashed: it must not show up inside the folder.
    expect(w.filterByFolder(all, byId, s, 'f1').map(byId)).not.toContain('e');
  });

  it('composes with an already-filtered row set rather than re-filtering the page', () => {
    // The page hands in what survived status + search; the folder narrows that further.
    const afterStatusAndSearch = rows('a', 'c');
    expect(w.filterByFolder(afterStatusAndSearch, byId, s, 'f1').map(byId)).toEqual(['a']);
  });

  it('a workspace with no folder state at all is completely unaffected', () => {
    expect(w.filterByFolder(all, byId, w.EMPTY_WORKSPACE_STATE, w.FOLDER_ALL)).toHaveLength(6);
  });
});

describe('folder counts', () => {
  it('counts over the full row set, not the filtered one, and excludes the Papierkorb', () => {
    const s = state([{ id: 'f1', name: 'A' }], {
      a: { folderId: 'f1' }, b: { folderId: 'f1' }, c: { trashedAt: 'x' },
    });
    expect(w.folderCounts(rows('a', 'b', 'c', 'd'), byId, s)).toEqual({
      all: 3, unfiled: 1, trash: 1, byFolder: { f1: 2 },
    });
  });

  it('counts a record filed in a folder that no longer exists as unfiled', () => {
    const s = state([], { a: { folderId: 'gone' } });
    expect(w.folderCounts(rows('a'), byId, s).unfiled).toBe(1);
  });
});

describe('folder name validation', () => {
  const existing = [{ id: 'f1', name: 'Archiv', sortOrder: 0, createdAt: '' }];

  it('rejects an empty or whitespace-only name', () => {
    expect(w.validateFolderName('   ', existing)).toMatch(/Namen/);
  });

  it('rejects a case-insensitive duplicate', () => {
    expect(w.validateFolderName('  archiv ', existing)).toMatch(/existiert bereits/);
  });

  it('allows the same name when renaming that same folder', () => {
    expect(w.validateFolderName('Archiv', existing, 'f1')).toBeNull();
  });

  it('rejects an unreasonably long name', () => {
    expect(w.validateFolderName('x'.repeat(61), existing)).toMatch(/60/);
  });

  it('maps the server codes to something a person can act on, and never leaks SQL', () => {
    expect(w.folderErrorText('folder_name_taken')).toMatch(/existiert bereits/);
    expect(w.folderErrorText('ERROR: duplicate key value violates unique constraint "x"'))
      .toBe('Der Ordner konnte nicht gespeichert werden.');
  });
});

describe('delete plan presentation', () => {
  const plan = (action: DeleteAction, reasons: string[] = []): DeletePlan =>
    ({ resourceId: 'r', action, reasons, dependencies: {} });

  it('summarises a mixed batch by what will actually happen to each record', () => {
    const summary = w.summarisePlans([
      plan('hard_delete'), plan('hard_delete'), plan('hard_delete'), plan('hard_delete'),
      plan('trash_only'), plan('trash_only'),
      plan('cancel_and_trash'), plan('cancel_and_trash'),
    ]);
    expect(summary).toMatchObject({ total: 8, hardDelete: 4, trashOnly: 2, cancelAndTrash: 2 });
    expect(w.summaryLines(summary)).toEqual([
      '4 Einträge werden endgültig gelöscht',
      '2 Rechnungen werden storniert und aus dem Arbeitsbereich entfernt',
      '2 Einträge werden in den Papierkorb verschoben',
    ]);
  });

  it('prints only the groups that occur', () => {
    expect(w.summaryLines(w.summarisePlans([plan('trash_only')])))
      .toEqual(['1 Eintrag wird in den Papierkorb verschoben']);
  });

  it('renders reason codes as German, and drops codes it does not know', () => {
    expect(w.describeReasons(['has_payments', 'wat'])).toEqual(['Zahlungen erfasst']);
  });
});

describe('what the toast says', () => {
  const result = (outcome: DeleteOutcome): DeleteResult =>
    ({ resourceId: 'r', action: 'trash_only', outcome, reasons: [], error: null });

  it('never calls a move to the Papierkorb a deletion', () => {
    expect(w.resultToast([result('trashed')])).toMatchObject({
      tone: 'success', title: 'In Papierkorb verschoben',
    });
  });

  it('names the Storno when a Storno is what happened', () => {
    expect(w.resultToast([result('cancelled_and_trashed')]).title)
      .toBe('Rechnung storniert und entfernt');
  });

  it('says "endgültig gelöscht" only for a real hard delete', () => {
    expect(w.resultToast([result('hard_deleted')]).title).toBe('Endgültig gelöscht');
  });

  it('reports a partial batch as a partial batch instead of a success', () => {
    const toast = w.resultToast([result('hard_deleted'), result('failed')]);
    expect(toast.tone).toBe('error');
    expect(toast.detail).toMatch(/1 Eintrag konnte nicht entfernt werden/);
  });

  it('reports a batch where nothing happened as a failure, not a silent success', () => {
    expect(w.resultToast([result('blocked')])).toMatchObject({ tone: 'error', title: 'Nichts entfernt' });
  });
});

describe('every operation goes through an owner-gated RPC', () => {
  it.each([
    ['loadWorkspaceState', () => w.loadWorkspaceState('e1', 'invoice'), 'owner_workspace_state',
      { p_entity: 'e1', p_scope: 'invoice' }],
    ['createWorkspaceFolder', () => w.createWorkspaceFolder('e1', 'expense', 'Archiv'), 'owner_create_workspace_folder',
      { p_entity: 'e1', p_scope: 'expense', p_name: 'Archiv' }],
    ['renameWorkspaceFolder', () => w.renameWorkspaceFolder('f1', 'Neu'), 'owner_rename_workspace_folder',
      { p_folder_id: 'f1', p_name: 'Neu' }],
    ['deleteWorkspaceFolder', () => w.deleteWorkspaceFolder('f1'), 'owner_delete_workspace_folder',
      { p_folder_id: 'f1' }],
    ['moveWorkspaceItems', () => w.moveWorkspaceItems('e1', 'invoice', ['a', 'b'], 'f1'), 'owner_move_workspace_items',
      { p_entity: 'e1', p_scope: 'invoice', p_resource_ids: ['a', 'b'], p_folder_id: 'f1' }],
    ['preflightWorkspaceDelete', () => w.preflightWorkspaceDelete('offer', ['a']), 'owner_workspace_delete_preflight',
      { p_scope: 'offer', p_resource_ids: ['a'] }],
    ['deleteWorkspaceItems', () => w.deleteWorkspaceItems('e1', 'expense', ['a']), 'owner_workspace_delete_items',
      { p_entity: 'e1', p_scope: 'expense', p_resource_ids: ['a'], p_reason: null }],
    ['restoreWorkspaceItems', () => w.restoreWorkspaceItems('e1', 'expense', ['a']), 'owner_workspace_restore_items',
      { p_entity: 'e1', p_scope: 'expense', p_resource_ids: ['a'] }],
    ['purgeWorkspaceItems', () => w.purgeWorkspaceItems('e1', 'invoice', ['a']), 'owner_workspace_purge_items',
      { p_entity: 'e1', p_scope: 'invoice', p_resource_ids: ['a'] }],
  ])('%s → %s', async (_label, call, fnName, args) => {
    await call();
    expect(rpc).toHaveBeenCalledWith(fnName, args);
    expect(from).not.toHaveBeenCalled();
  });

  it('a bulk move is ONE request, whatever the selection size', async () => {
    await w.moveWorkspaceItems('e1', 'invoice', Array.from({ length: 250 }, (_, i) => `r${i}`), null);
    expect(rpc).toHaveBeenCalledTimes(1);
  });

  it('surfaces a server refusal instead of reporting success', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'folder_name_taken' } } as never);
    const res = await w.createWorkspaceFolder('e1', 'invoice', 'Archiv');
    expect(res.folder).toBeNull();
    expect(w.folderErrorText(res.error)).toMatch(/existiert bereits/);
  });

  it('reads the state in one call and indexes it by resource', async () => {
    rpc.mockResolvedValue({
      data: {
        folders: [{ id: 'f1', name: 'A', sort_order: 0, created_at: '2026-01-01' }],
        items: [{ resource_id: 'r1', folder_id: 'f1', trashed_at: null }],
      },
      error: null,
    } as never);
    const loaded = await w.loadWorkspaceState('e1', 'invoice');
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(loaded.folders).toEqual([{ id: 'f1', name: 'A', sortOrder: 0, createdAt: '2026-01-01' }]);
    expect(loaded.items.r1).toEqual({ resourceId: 'r1', folderId: 'f1', trashedAt: null });
  });
});
