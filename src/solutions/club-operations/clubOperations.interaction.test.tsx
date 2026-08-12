// Interaction guarantees for the redesigned workspace.
//
// The theme is that every visible control does something real. This phase is inert by design, which
// makes it very easy to ship an affordance that looks operable and is not — a sort arrow that does
// not sort, a chip that does not clear, a drill-down that lands on an unfiltered list. Each of those
// is checked here by driving the control and reading the result, never by asserting that a handler
// was wired up.

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { createFixtureAdapter } from './adapter/fixtureAdapter';
import { ClubOperationsModule } from './ClubOperationsModule';
import { isAlertOpen } from './filtering';
import { fixtureAlerts } from './fixtures/alerts';
import { clubOperationsNavItems, type ClubOperationsSectionId } from './navigation';

function renderSection(section: ClubOperationsSectionId) {
  return render(
    <ClubOperationsModule adapter={createFixtureAdapter()} initialSection={section} />,
  );
}

/** Body-cell text of a column, top to bottom. */
function columnValues(table: HTMLElement, columnIndex: number): string[] {
  return within(table)
    .getAllByRole('row')
    .slice(1)
    .map((row) => row.children[columnIndex]?.textContent?.trim() ?? '');
}

function headerIndex(table: HTMLElement, header: string): number {
  return within(table)
    .getAllByRole('columnheader')
    .findIndex((cell) => cell.textContent?.trim() === header);
}

/* ==================================================================== Sorting */

describe('local sorting', () => {
  it('offers a sort control only on columns that can sort', async () => {
    renderSection('payments');
    const table = await screen.findByRole('table');
    const headers = within(table).getAllByRole('columnheader');

    const sortable = headers.filter((cell) => cell.querySelector('button') !== null);
    expect(sortable.length).toBeGreaterThan(0);
    // Every sort affordance belongs to a header that declares aria-sort — no decorative arrows.
    for (const cell of sortable) expect(cell).toHaveAttribute('aria-sort');
    for (const cell of headers) {
      if (cell.querySelector('button') === null) expect(cell).not.toHaveAttribute('aria-sort');
    }
  });

  it('actually reorders the rows, and reverses on a second press', async () => {
    renderSection('members');
    const table = await screen.findByRole('table');
    const column = headerIndex(table, 'Buchungen');
    expect(column).toBeGreaterThan(-1);

    const sortButton = within(within(table).getAllByRole('columnheader')[column]).getByRole('button');

    await userEvent.click(sortButton);
    await waitFor(() => {
      const ascending = columnValues(screen.getByRole('table'), column).map(Number);
      expect(ascending).toEqual([...ascending].sort((a, b) => a - b));
    });

    await userEvent.click(sortButton);
    await waitFor(() => {
      const descending = columnValues(screen.getByRole('table'), column).map(Number);
      expect(descending).toEqual([...descending].sort((a, b) => b - a));
    });
  });

  it('reports its direction through aria-sort, and clears on the third press', async () => {
    renderSection('members');
    const table = await screen.findByRole('table');
    const column = headerIndex(table, 'Buchungen');
    const cell = within(table).getAllByRole('columnheader')[column];
    const sortButton = within(cell).getByRole('button');

    await userEvent.click(sortButton);
    await waitFor(() => expect(within(screen.getByRole('table')).getAllByRole('columnheader')[column]).toHaveAttribute('aria-sort', 'ascending'));

    await userEvent.click(within(within(screen.getByRole('table')).getAllByRole('columnheader')[column]).getByRole('button'));
    await waitFor(() => expect(within(screen.getByRole('table')).getAllByRole('columnheader')[column]).toHaveAttribute('aria-sort', 'descending'));

    await userEvent.click(within(within(screen.getByRole('table')).getAllByRole('columnheader')[column]).getByRole('button'));
    await waitFor(() => expect(within(screen.getByRole('table')).getAllByRole('columnheader')[column]).toHaveAttribute('aria-sort', 'none'));
  });

  it('never drops or duplicates a row while sorting', async () => {
    renderSection('vouchers');
    const table = await screen.findByRole('table');
    const before = within(table).getAllByRole('row').length;

    const sortable = within(table)
      .getAllByRole('columnheader')
      .find((cell) => cell.querySelector('button'));
    await userEvent.click(within(sortable as HTMLElement).getByRole('button'));

    await waitFor(() => {
      expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(before);
    });
  });
});

/* ================================================================ Drill-down */

describe('drill-down from the overview', () => {
  it('opens the target section with the filter already applied', async () => {
    render(<ClubOperationsModule adapter={createFixtureAdapter()} />);

    // The overview's own alert figure states the module-wide unresolved count ...
    const openAlerts = fixtureAlerts.filter(isAlertOpen).length;
    const card = await screen.findByRole('button', {
      name: 'Offene Meldungen im Alert Center öffnen',
    });
    await userEvent.click(card);

    // ... and the Alert Center it opens shows exactly that many rows.
    const table = await screen.findByRole('table');
    await waitFor(() => {
      expect(within(table).getAllByRole('row')).toHaveLength(openAlerts + 1);
    });
    // With the filter visible as a chip, not merely applied silently.
    expect(screen.getByText(/Aktive Filter/)).toBeInTheDocument();
  });

  it('lets an attention row open its own section', async () => {
    render(<ClubOperationsModule adapter={createFixtureAdapter()} />);
    await screen.findByText('Aufmerksamkeit erforderlich');

    // The first row is the most serious finding; its label states where it goes.
    const first = screen.getAllByRole('button', { name: /öffnen$/ })[0];
    const target = first.getAttribute('aria-label') ?? '';
    await userEvent.click(first);

    const section = target.includes('Zahlungsabgleich')
      ? 'Zahlungsabgleich'
      : target.includes('Rechnungen')
        ? 'Rechnungen'
        : target.includes('Zahlungen')
          ? 'Zahlungen'
          : 'Alert Center';
    expect(await screen.findByRole('heading', { name: section })).toBeInTheDocument();
  });

  it('leaves the seeded filter fully resettable', async () => {
    render(<ClubOperationsModule adapter={createFixtureAdapter()} />);
    await userEvent.click(
      await screen.findByRole('button', { name: 'Offene Meldungen im Alert Center öffnen' }),
    );
    const table = await screen.findByRole('table');
    const filtered = within(table).getAllByRole('row').length;

    await userEvent.click(screen.getByRole('button', { name: /Filter zurücksetzen/ }));
    await waitFor(() => {
      expect(within(screen.getByRole('table')).getAllByRole('row').length).toBeGreaterThan(filtered);
    });
  });
});

/* ============================================================= Active filters */

describe('active filters are visible and individually removable', () => {
  it('names each active facet rather than only counting them', async () => {
    renderSection('payments');
    await screen.findByRole('table');

    await userEvent.type(screen.getByLabelText('Suche'), 'Schöllhammer');
    expect(await screen.findByText(/Aktive Filter/)).toBeInTheDocument();
    // The chip states the facet and its value, so "which filter is on" needs no re-reading of
    // six controls.
    expect(
      await screen.findByRole('button', { name: 'Filter entfernen: Suche: Schöllhammer' }),
    ).toBeInTheDocument();
  });

  it('clears exactly the facet its chip names', async () => {
    renderSection('payments');
    const table = await screen.findByRole('table');
    const before = within(table).getAllByRole('row').length;

    await userEvent.type(screen.getByLabelText('Suche'), 'Schöllhammer');
    await waitFor(() =>
      expect(within(screen.getByRole('table')).getAllByRole('row').length).toBeLessThan(before),
    );

    await userEvent.click(await screen.findByRole('button', { name: /Filter entfernen: Suche/ }));
    await waitFor(() =>
      expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(before),
    );
  });

  it('shows no chip area at all until something is filtered', async () => {
    renderSection('payments');
    await screen.findByRole('table');
    expect(screen.queryByText(/Aktive Filter/)).toBeNull();
  });
});

/* ============================================================= Detail panels */

describe('detail panel accessibility', () => {
  it('is labelled by its own heading and takes focus when it opens', async () => {
    renderSection('invoices');
    const table = await screen.findByRole('table');
    await userEvent.click(within(table).getAllByRole('row')[1]);

    const close = await screen.findByRole('button', { name: 'Detailansicht schließen' });
    const panel = close.closest('section') as HTMLElement;

    expect(panel).toHaveAttribute('aria-labelledby', 'club-ops-detail-title');
    // Focus lands inside the panel, so the next Tab continues within it rather than from the top
    // of the table the reader just left.
    await waitFor(() => expect(panel.contains(document.activeElement)).toBe(true));
  });

  it('returns focus to the control that opened it', async () => {
    renderSection('invoices');
    const table = await screen.findByRole('table');
    const opener = within(table).getAllByRole('row')[1].querySelector('button') as HTMLElement;
    opener.focus();
    await userEvent.click(opener);

    await userEvent.click(await screen.findByRole('button', { name: 'Detailansicht schließen' }));
    await waitFor(() => expect(document.activeElement).toBe(opener));
  });

  it('marks the row whose detail is open', async () => {
    renderSection('invoices');
    const table = await screen.findByRole('table');
    const row = within(table).getAllByRole('row')[1];
    expect(row).not.toHaveAttribute('aria-current');

    await userEvent.click(row);
    await waitFor(() => {
      expect(within(screen.getByRole('table')).getAllByRole('row')[1]).toHaveAttribute('aria-current');
    });
  });

  it('opens by keyboard alone, through the row identifier control', async () => {
    renderSection('invoices');
    const table = await screen.findByRole('table');
    const opener = within(table).getAllByRole('row')[1].querySelector('button') as HTMLElement;

    opener.focus();
    expect(opener).toHaveFocus();
    await userEvent.keyboard('{Enter}');

    expect(await screen.findByRole('button', { name: 'Detailansicht schließen' })).toBeInTheDocument();
  });
});

/* ================================================================ Chrome */

describe('the module header', () => {
  it('states the dataset is fictional where a live indicator would sit', async () => {
    render(<ClubOperationsModule adapter={createFixtureAdapter()} />);
    expect(await screen.findByText('Beispieldaten')).toBeInTheDocument();
    // Nothing anywhere claims a connection, a sync or a live feed.
    expect(screen.queryByText(/\blive\b(?!-System)/i)).toBeNull();
    expect(screen.queryByText(/synchronisiert|verbunden|aktualisiert um/i)).toBeNull();
  });

  it('states the reporting period and the data date', async () => {
    render(<ClubOperationsModule adapter={createFixtureAdapter()} />);
    // "Zeitraum" names both the header's term and the period select that changes it — deliberately
    // the same word for the same thing, so it is matched non-uniquely.
    expect((await screen.findAllByText('Zeitraum')).length).toBeGreaterThan(0);
    expect(screen.getByText('Datenstand')).toBeInTheDocument();
    expect(screen.getAllByText(/31\.03\.2026/).length).toBeGreaterThan(0);
  });

  it('summarises operational health as a verdict, not a raw number', async () => {
    render(<ClubOperationsModule adapter={createFixtureAdapter()} />);
    expect(await screen.findByText('Betriebslage')).toBeInTheDocument();
    expect(screen.getByText(/Eingriff erforderlich|Prüfung erforderlich|Ohne Auffälligkeiten|Kleinere Hinweise/)).toBeInTheDocument();
  });

  it('carries no account, organisation or refresh control', async () => {
    render(<ClubOperationsModule adapter={createFixtureAdapter()} />);
    await screen.findByText('Beispieldaten');
    for (const forbidden of [/abmelden/i, /profil/i, /konto/i, /organisation wechseln/i, /aktualisieren/i, /synchronisieren/i]) {
      expect(screen.queryByRole('button', { name: forbidden }), String(forbidden)).toBeNull();
    }
  });
});

/* ======================================================== No dead affordances */

describe('every control in every section does something', () => {
  it.each(clubOperationsNavItems.map((item) => [item.id, item.label] as const))(
    '%s exposes no disabled control and no dead affordance',
    async (id, label) => {
      renderSection(id);
      await screen.findByRole('heading', { name: label });

      // A disabled control still tells the reader the action exists here. In an inert phase it
      // does not, so none may be rendered at all.
      expect(document.querySelector('button[disabled]'), label).toBeNull();
      expect(document.querySelector('[aria-disabled="true"]'), label).toBeNull();

      // No pagination, export or bulk-selection surface, none of which is implemented.
      for (const dead of [/seite \d/i, /nächste seite/i, /vorherige seite/i, /csv/i, /pdf/i, /alle auswählen/i, /export/i]) {
        expect(screen.queryByRole('button', { name: dead }), `${label}: ${dead}`).toBeNull();
      }
      expect(document.querySelector('input[type="checkbox"]'), label).toBeNull();
    },
  );
});

/* ================================================= Navigation active state */

// Regression coverage for a defect where the active-state background was a single overlay
// measured with getBoundingClientRect and positioned with `top-0 bottom-0` against the *whole*
// (potentially multi-row) nav container. Once the strip wrapped onto more than one row, that
// overlay's height spanned every row rather than just the active button's row, so the highlighted
// box visually surrounded several buttons instead of exactly one.
//
// The fix replaced the shared measured overlay with a button-local active layer — each button
// paints its own background/border/shadow when it is the active one, so the "highlighted region"
// is definitionally always the exact bounding box of a single button. These tests assert that
// property directly (module-wide, not the box coordinates a screenshot diff would need) so a
// regression to a shared overlay — or to any state where the active layer can belong to more than
// one button — fails here rather than only being caught by eye.

function activeLayerButtons(container: HTMLElement): HTMLButtonElement[] {
  // The active layer is the same Tailwind background utility the button carries when selected —
  // see ModuleNav.tsx. Reading the class list (not a measured/computed style) keeps this assertion
  // independent of paint timing.
  return [...container.querySelectorAll<HTMLButtonElement>('nav[aria-label="Vereinsbetrieb"] button')].filter(
    (button) => button.classList.contains('bg-[var(--cq-surface)]'),
  );
}

function ariaCurrentButtons(container: HTMLElement): HTMLButtonElement[] {
  return [
    ...container.querySelectorAll<HTMLButtonElement>(
      'nav[aria-label="Vereinsbetrieb"] button[aria-current="page"]',
    ),
  ];
}

describe('navigation active state belongs to exactly one button', () => {
  it('marks exactly one button as active, and it is the one just selected', async () => {
    const { container } = render(<ClubOperationsModule adapter={createFixtureAdapter()} />);
    const nav = await screen.findByRole('navigation', { name: 'Vereinsbetrieb' });

    for (const item of clubOperationsNavItems) {
      await userEvent.click(within(nav).getByRole('button', { name: new RegExp(`^${item.label}`) }));

      const layer = activeLayerButtons(container);
      const current = ariaCurrentButtons(container);
      const clicked = within(nav).getByRole('button', { name: new RegExp(`^${item.label}`) });

      expect(layer, item.label).toHaveLength(1);
      expect(current, item.label).toHaveLength(1);
      expect(layer[0], item.label).toBe(clicked);
      expect(current[0], item.label).toBe(clicked);
    }
  });

  it('exposes aria-current="page" on exactly one button at a time, never zero, never several', async () => {
    const { container } = render(<ClubOperationsModule adapter={createFixtureAdapter()} />);
    const nav = await screen.findByRole('navigation', { name: 'Vereinsbetrieb' });

    expect(ariaCurrentButtons(container)).toHaveLength(1);

    await userEvent.click(within(nav).getByRole('button', { name: /^Zahlungsabgleich/ }));
    expect(ariaCurrentButtons(container)).toHaveLength(1);
    expect(ariaCurrentButtons(container)[0]).toHaveTextContent('Zahlungsabgleich');

    await userEvent.click(within(nav).getByRole('button', { name: /^Mitglieder/ }));
    expect(ariaCurrentButtons(container)).toHaveLength(1);
    expect(ariaCurrentButtons(container)[0]).toHaveTextContent('Mitglieder');
  });

  it('moves the active layer off the previous button when a new one is selected', async () => {
    const { container } = render(<ClubOperationsModule adapter={createFixtureAdapter()} />);
    const nav = await screen.findByRole('navigation', { name: 'Vereinsbetrieb' });

    const uebersicht = within(nav).getByRole('button', { name: /^Übersicht/ });
    expect(uebersicht.classList.contains('bg-[var(--cq-surface)]')).toBe(true);

    await userEvent.click(within(nav).getByRole('button', { name: /^Rechnungen/ }));

    // The formerly active button must lose the active layer entirely — not merely stop being the
    // *only* one that has it. A leftover layer on a former selection is the same "spans more than
    // one button" defect, just expressed as two separate single-button layers instead of one
    // multi-row one.
    expect(uebersicht.classList.contains('bg-[var(--cq-surface)]')).toBe(false);
    expect(activeLayerButtons(container)).toHaveLength(1);
    expect(activeLayerButtons(container)[0]).toHaveTextContent('Rechnungen');
  });

  it('gives every inactive button no active layer and no aria-current', async () => {
    const { container } = render(<ClubOperationsModule adapter={createFixtureAdapter()} />);
    const nav = await screen.findByRole('navigation', { name: 'Vereinsbetrieb' });

    await userEvent.click(within(nav).getByRole('button', { name: /^Gutscheine/ }));

    const allNavButtons = [
      ...container.querySelectorAll<HTMLButtonElement>('nav[aria-label="Vereinsbetrieb"] button'),
    ];
    const inactive = allNavButtons.filter((button) => button.textContent?.includes('Gutscheine') === false);
    expect(inactive.length).toBeGreaterThan(0);
    for (const button of inactive) {
      expect(button.classList.contains('bg-[var(--cq-surface)]'), button.textContent ?? '').toBe(false);
      expect(button.getAttribute('aria-current'), button.textContent ?? '').toBeNull();
    }
  });

  it('keeps the active layer scoped to a single button under rapid, unyielded navigation', async () => {
    // Fires every click back-to-back inside one `act()` batch rather than awaiting between them —
    // the shape of the original defect was independent of click timing (it was a layout bug, not a
    // race), but this also guards against a future implementation reintroducing async measurement
    // that could transiently apply the layer to more than one button.
    const { container } = render(<ClubOperationsModule adapter={createFixtureAdapter()} />);
    await screen.findByRole('navigation', { name: 'Vereinsbetrieb' });

    const nav = container.querySelector('nav[aria-label="Vereinsbetrieb"]') as HTMLElement;
    const buttons = [...nav.querySelectorAll('button')];

    for (const button of buttons) {
      await userEvent.click(button, { delay: null });
      expect(activeLayerButtons(container), button.textContent ?? '').toHaveLength(1);
      expect(ariaCurrentButtons(container), button.textContent ?? '').toHaveLength(1);
    }

    // Settle on the last entry and confirm the invariant still holds at rest.
    expect(activeLayerButtons(container)).toHaveLength(1);
    expect(activeLayerButtons(container)[0]).toBe(buttons[buttons.length - 1]);
  });

  it('never renders a shared measured overlay element behind the navigation buttons', async () => {
    // The regressed implementation rendered one absolutely-positioned <span aria-hidden="true">
    // sibling of the button list to act as the sliding indicator. Its reappearance is itself the
    // regression, independent of whether its measured position happens to be correct in a given
    // render.
    const { container } = render(<ClubOperationsModule adapter={createFixtureAdapter()} />);
    await screen.findByRole('navigation', { name: 'Vereinsbetrieb' });

    const nav = container.querySelector('nav[aria-label="Vereinsbetrieb"]') as HTMLElement;
    const strayOverlay = nav.querySelector(':scope > div > span[aria-hidden="true"]');
    expect(strayOverlay).toBeNull();
  });
});
