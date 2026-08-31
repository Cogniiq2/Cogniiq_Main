import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { FileText } from 'lucide-react';

import {
  CommandPaletteProvider, matchCommand, rankCommands, type CommandItem,
} from '@/components/dashboard/CommandPalette';

/**
 * The palette's promise is that it is honest and fast to drive from the keyboard.
 * These tests hold it to both: it never claims to search something it did not load,
 * and ↑/↓/Enter/Escape actually work.
 */

const item = (over: Partial<CommandItem>): CommandItem => ({
  id: 'x', label: 'Rechnungen', group: 'Navigation', to: '/admin/finance/invoices', ...over,
});

function Probe() {
  const { pathname } = useLocation();
  return <p data-testid="path">{pathname}</p>;
}

function renderPalette(items: CommandItem[], loadObjects?: () => Promise<CommandItem[]>) {
  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <CommandPaletteProvider items={items} loadObjects={loadObjects}>
        <Routes>
          <Route path="*" element={<Probe />} />
        </Routes>
      </CommandPaletteProvider>
    </MemoryRouter>,
  );
}

async function openPalette(user: ReturnType<typeof userEvent.setup>) {
  await user.keyboard('{Control>}k{/Control}');
  const dialog = await screen.findByRole('dialog', { name: 'Schnellsuche' });
  // The input takes focus on the next animation frame; waiting for it keeps the
  // keyboard assertions about the palette rather than about that frame.
  await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('combobox')));
  return dialog;
}

describe('matchCommand', () => {
  it('folds umlauts so an ASCII query still finds the German label', () => {
    expect(matchCommand(item({ label: 'Übersicht' }), 'ubersicht')).toBe(true);
    expect(matchCommand(item({ label: 'Ausgaben' }), 'AUSG')).toBe(true);
  });

  it('matches a subsequence, so an approximate memory of the label still lands', () => {
    expect(matchCommand(item({ label: 'Laufende Verträge' }), 'lvertr')).toBe(true);
    expect(matchCommand(item({ label: 'Laufende Verträge' }), 'zzz')).toBe(false);
  });

  it('searches the hint and hidden keywords, not only what is printed', () => {
    expect(matchCommand(item({ label: 'Steuern', keywords: 'euer umsatzsteuer' }), 'umsatzsteuer')).toBe(true);
    expect(matchCommand(item({ label: 'Steuern', hint: 'Finanzen › Buchhaltung' }), 'buchhaltung')).toBe(true);
  });

  it('matches everything on an empty query', () => {
    expect(matchCommand(item({}), '   ')).toBe(true);
  });
});

describe('rankCommands', () => {
  it('puts a prefix match above a contains match above a keyword-only match', () => {
    const ranked = rankCommands([
      item({ id: 'keyword', label: 'Angebote', keywords: 'rechnung' }),
      item({ id: 'contains', label: 'Offene Rechnungen' }),
      item({ id: 'prefix', label: 'Rechnungen' }),
    ], 'rechnung');
    expect(ranked.map((r) => r.id)).toEqual(['prefix', 'contains', 'keyword']);
  });
});

describe('CommandPalette', () => {
  it('opens on Ctrl+K and closes on Escape', async () => {
    const user = userEvent.setup();
    renderPalette([item({})]);
    expect(screen.queryByRole('dialog')).toBeNull();

    await openPalette(user);
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('navigates with the arrow keys and opens the highlighted result with Enter', async () => {
    const user = userEvent.setup();
    renderPalette([
      item({ id: 'a', label: 'Übersicht', to: '/admin/finance/overview' }),
      item({ id: 'b', label: 'Rechnungen', to: '/admin/finance/invoices' }),
    ]);

    await openPalette(user);
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    await waitFor(() => expect(screen.getByTestId('path').textContent).toBe('/admin/finance/invoices'));
  });

  it('binds the highlighted option to the input, so the combobox is announced', async () => {
    const user = userEvent.setup();
    renderPalette([item({ id: 'a', label: 'Übersicht' }), item({ id: 'b', label: 'Rechnungen' })]);

    await openPalette(user);
    const input = screen.getByRole('combobox');
    expect(input.getAttribute('aria-activedescendant')).toBe('cq-cmd-a');
    await user.keyboard('{ArrowDown}');
    expect(input.getAttribute('aria-activedescendant')).toBe('cq-cmd-b');
  });

  it('groups results and filters them as the query is typed', async () => {
    const user = userEvent.setup();
    renderPalette([
      item({ id: 'a', label: 'Übersicht', group: 'Navigation' }),
      item({ id: 'b', label: 'Neues Angebot erstellen', group: 'Aktionen', to: '/admin/finance/offers/new' }),
    ]);

    const dialog = await openPalette(user);
    expect(dialog.textContent).toContain('Navigation');
    expect(dialog.textContent).toContain('Aktionen');

    await user.type(screen.getByRole('combobox'), 'angebot');
    await waitFor(() => expect(screen.queryByText('Übersicht')).toBeNull());
    expect(screen.getByText('Neues Angebot erstellen')).toBeTruthy();
  });

  it('loads business objects once, on first open — never on mount and never per keystroke', async () => {
    const user = userEvent.setup();
    const loadObjects = vi.fn().mockResolvedValue([
      item({ id: 'c1', label: 'Zahnarztpraxis Dr. Merten', group: 'Kunden', to: '/admin/finance/customers/1' }),
    ]);
    renderPalette([item({ id: 'a', label: 'Übersicht' })], loadObjects);

    expect(loadObjects).not.toHaveBeenCalled();

    await openPalette(user);
    await waitFor(() => expect(screen.getByText('Zahnarztpraxis Dr. Merten')).toBeTruthy());

    await user.type(screen.getByRole('combobox'), 'zahn');
    await user.keyboard('{Escape}');
    await openPalette(user);
    expect(loadObjects).toHaveBeenCalledTimes(1);
  });

  it('keeps working when the object read fails, and says only what it actually searched', async () => {
    const user = userEvent.setup();
    const loadObjects = vi.fn().mockRejectedValue(new Error('RLS denied'));
    renderPalette([item({ id: 'a', label: 'Übersicht' })], loadObjects);

    await openPalette(user);
    await waitFor(() => expect(loadObjects).toHaveBeenCalled());

    await user.type(screen.getByRole('combobox'), 'zzzz');
    const empty = await screen.findByText(/Kein Treffer/);
    // No customers were loaded, so the palette must not claim to have searched them.
    expect(empty.textContent).not.toContain('Kunden');
    expect(empty.textContent).toContain('Navigation');
  });

  it('does not swallow an icon-only item and renders its label as the accessible text', async () => {
    const user = userEvent.setup();
    renderPalette([item({ id: 'a', label: 'Rechnungen', icon: FileText })]);
    const dialog = await openPalette(user);
    expect(dialog.textContent).toContain('Rechnungen');
  });
});
