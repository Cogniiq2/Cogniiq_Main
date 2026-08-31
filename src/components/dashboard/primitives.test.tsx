import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Inbox } from 'lucide-react';

import { DataTable, EmptyState, Field, Select, StatusBadge, Tabs } from './primitives';
import { PremiumCombobox } from './PremiumSelect';

describe('Select (shared owner/customer primitive)', () => {
  it('no longer renders a native <select>', () => {
    const { container } = render(
      <Select id="s" label="Status" value="a" onChange={() => {}} options={[{ value: 'a', label: 'A' }]} />,
    );
    expect(container.querySelector('select')).toBeNull();
    expect(screen.getByLabelText('Status')).toHaveAttribute('aria-expanded');
  });

  it('marks a required select via aria-required and hides the decorative asterisk', () => {
    const { container } = render(
      <Select id="s" label="Kunde" required value="a" onChange={() => {}} options={[{ value: 'a', label: 'A' }]} />,
    );
    expect(screen.getByLabelText(/Kunde/)).toHaveAttribute('aria-required', 'true');
    // The asterisk carries no information for assistive tech — aria-required does.
    expect(container.querySelector('label span[aria-hidden="true"]')).toHaveTextContent('*');
  });
});

describe('Field', () => {
  it('associates hint text with the input', () => {
    render(<Field id="f" label="Betrag" value="" onChange={() => {}} hint="Brutto in Euro" />);
    expect(screen.getByLabelText('Betrag')).toHaveAccessibleDescription('Brutto in Euro');
  });

  it('prefers the error over the hint and marks the input invalid', () => {
    render(<Field id="f" label="Betrag" value="" onChange={() => {}} hint="Brutto" error="Pflichtfeld" />);
    const input = screen.getByLabelText('Betrag');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Pflichtfeld');
  });
});

describe('StatusBadge', () => {
  it('renders the label for each supported tone', () => {
    render(
      <>
        <StatusBadge label="Bezahlt" tone="success" />
        <StatusBadge label="Überfällig" tone="danger" />
        <StatusBadge label="Entwurf" />
      </>,
    );
    expect(screen.getByText('Bezahlt')).toBeInTheDocument();
    expect(screen.getByText('Überfällig')).toBeInTheDocument();
    expect(screen.getByText('Entwurf')).toBeInTheDocument();
  });
});

describe('EmptyState', () => {
  it('renders title, description and an optional action', () => {
    render(<EmptyState icon={Inbox} title="Keine Rechnungen" description="Noch nichts erstellt." action={<button type="button">Neu</button>} />);
    expect(screen.getByText('Keine Rechnungen')).toBeInTheDocument();
    expect(screen.getByText('Noch nichts erstellt.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Neu' })).toBeInTheDocument();
  });
});

describe('Tabs', () => {
  it('marks only the active tab as selected and keeps it the tab stop', () => {
    render(
      <Tabs
        value="open"
        onChange={() => {}}
        tabs={[{ value: 'open', label: 'Offen', count: 3 }, { value: 'paid', label: 'Bezahlt' }]}
      />,
    );
    const open = screen.getByRole('tab', { name: /Offen/ });
    const paid = screen.getByRole('tab', { name: /Bezahlt/ });

    expect(open).toHaveAttribute('aria-selected', 'true');
    expect(paid).toHaveAttribute('aria-selected', 'false');
    // Roving tabindex: the tablist is a single tab stop.
    expect(open).toHaveAttribute('tabindex', '0');
    expect(paid).toHaveAttribute('tabindex', '-1');
  });
});

interface Row { id: string; name: string; amount: string }
const rows: Row[] = [
  { id: '1', name: 'Muster GmbH', amount: '1.200,00 €' },
  { id: '2', name: 'Beispiel AG', amount: '840,50 €' },
];

describe('DataTable', () => {
  function renderTable(onRowClick?: (row: Row) => void) {
    return render(
      <DataTable
        rows={rows}
        getRowKey={(r) => r.id}
        mobileTitle={(r) => r.name}
        onRowClick={onRowClick}
        columns={[
          { key: 'name', header: 'Kunde', render: (r) => r.name },
          { key: 'amount', header: 'Betrag', align: 'right', render: (r) => r.amount },
        ]}
      />,
    );
  }

  it('renders a semantic table with column headers', () => {
    renderTable();
    const table = screen.getByRole('table');
    expect(within(table).getByRole('columnheader', { name: 'Kunde' })).toBeInTheDocument();
    expect(within(table).getByRole('columnheader', { name: 'Betrag' })).toBeInTheDocument();
  });

  it('right-aligns and tabular-aligns numeric columns', () => {
    const { container } = renderTable();
    const cell = container.querySelector('tbody tr td:nth-child(2)');
    expect(cell?.className).toContain('text-right');
    expect(cell?.className).toContain('tabular-nums');
  });

  it('invokes the row handler when a row is clicked', async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    renderTable(onRowClick);

    await user.click(screen.getByRole('table').querySelectorAll('tbody tr')[0]);
    expect(onRowClick).toHaveBeenCalledWith(rows[0]);
  });

  it('also renders a stacked mobile representation of every row', () => {
    renderTable();
    // Desktop cell + mobile card title. Both representations are always in the DOM;
    // CSS decides which is visible.
    expect(screen.getAllByText('Muster GmbH').length).toBeGreaterThanOrEqual(2);
  });

  it('does not print the first column twice in the mobile card', () => {
    renderTable();
    // The first column IS the card's title. Repeating it as a field printed the
    // customer's name twice on every phone-sized row.
    expect(screen.getAllByText('Muster GmbH')).toHaveLength(2);
    expect(screen.queryAllByText('Kunde')).toHaveLength(1); // the column header only
  });

  it('makes the row destination a real link, so it is reachable by keyboard', () => {
    render(
      <MemoryRouter>
        <DataTable
          rows={rows}
          getRowKey={(r) => r.id}
          mobileTitle={(r) => r.name}
          rowHref={(r) => `/admin/finance/customers/${r.id}`}
          columns={[
            { key: 'name', header: 'Kunde', render: (r) => r.name },
            { key: 'amount', header: 'Betrag', align: 'right', render: (r) => r.amount },
          ]}
        />
      </MemoryRouter>,
    );
    const links = screen.getAllByRole('link', { name: /Muster GmbH/ });
    expect(links.length).toBeGreaterThan(0);
    expect(links[0]).toHaveAttribute('href', `/admin/finance/customers/${rows[0].id}`);
  });

  it('announces the current sort and flips direction on a second activation', async () => {
    const user = userEvent.setup();
    function Sortable() {
      const [sort, setSort] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
      return (
        <DataTable
          rows={rows}
          getRowKey={(r) => r.id}
          mobileTitle={(r) => r.name}
          sort={sort}
          onSortChange={setSort}
          columns={[
            { key: 'name', header: 'Kunde', sortValue: (r) => r.name, render: (r) => r.name },
            { key: 'amount', header: 'Betrag', align: 'right', render: (r) => r.amount },
          ]}
        />
      );
    }
    render(<Sortable />);

    const header = screen.getByRole('columnheader', { name: /Kunde/ });
    expect(header).toHaveAttribute('aria-sort', 'none');
    // The non-sortable column offers no control and announces no sort state.
    expect(screen.getByRole('columnheader', { name: 'Betrag' })).not.toHaveAttribute('aria-sort');

    await user.click(within(header).getByRole('button'));
    expect(header).toHaveAttribute('aria-sort', 'ascending');
    await user.click(within(header).getByRole('button'));
    expect(header).toHaveAttribute('aria-sort', 'descending');
  });

  it('actually reorders the rows it was given', async () => {
    const user = userEvent.setup();
    function Sortable() {
      const [sort, setSort] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
      return (
        <DataTable
          rows={rows}
          getRowKey={(r) => r.id}
          mobileTitle={(r) => r.name}
          sort={sort}
          onSortChange={setSort}
          columns={[{ key: 'name', header: 'Kunde', sortValue: (r) => r.name, render: (r) => r.name }]}
        />
      );
    }
    const { container } = render(<Sortable />);
    const names = () => [...container.querySelectorAll('tbody tr td:first-child')].map((c) => c.textContent);
    const original = names();

    await user.click(within(screen.getByRole('columnheader', { name: /Kunde/ })).getByRole('button'));
    expect(names()).toEqual([...original].sort((a, b) => (a ?? '').localeCompare(b ?? '', 'de')));
  });
});

describe('PremiumCombobox', () => {
  const customers = [
    { value: 'c1', label: 'Muster GmbH' },
    { value: 'c2', label: 'Beispiel AG' },
    { value: 'c3', label: 'Nordwind Handel' },
  ];

  function ComboHarness({ onChange }: { onChange?: (v: string) => void }) {
    const [value, setValue] = useState('c1');
    return (
      <MemoryRouter>
        <PremiumCombobox
          id="cust"
          label="Kunde"
          value={value}
          onChange={(next) => { setValue(next); onChange?.(next); }}
          options={customers}
        />
      </MemoryRouter>
    );
  }

  it('exposes combobox semantics and the current selection', () => {
    render(<ComboHarness />);
    const trigger = screen.getByRole('combobox', { name: 'Kunde' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveTextContent('Muster GmbH');
  });

  it('filters options by typed text and selects the match', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ComboHarness onChange={onChange} />);

    await user.click(screen.getByRole('combobox', { name: 'Kunde' }));
    await user.type(screen.getByPlaceholderText('Suchen …'), 'Nord');

    const match = await screen.findByText('Nordwind Handel');
    await user.click(match);

    await waitFor(() => expect(onChange).toHaveBeenCalledWith('c3'));
  });

  it('shows an empty message when nothing matches', async () => {
    const user = userEvent.setup();
    render(<ComboHarness />);

    await user.click(screen.getByRole('combobox', { name: 'Kunde' }));
    await user.type(screen.getByPlaceholderText('Suchen …'), 'zzzz');

    expect(await screen.findByText('Kein Eintrag gefunden')).toBeInTheDocument();
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    render(<ComboHarness />);
    const trigger = screen.getByRole('combobox', { name: 'Kunde' });

    await user.click(trigger);
    expect(await screen.findByPlaceholderText('Suchen …')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByPlaceholderText('Suchen …')).not.toBeInTheDocument());
  });
});
