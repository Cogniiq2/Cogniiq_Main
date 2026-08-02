import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MoreHorizontal, Trash2 } from 'lucide-react';

import { PremiumCombobox, PremiumDropdownMenu, PremiumSelect } from './premiumControls';

// Behavioural cover for the three shared selection primitives that replaced every visible
// native <select> and every hand-rolled action menu in the product.
//
// The point of these tests is that the replacement is a real control, not a styled div: it
// must be operable from the keyboard alone, expose the right roles and accessible names,
// close on Escape and on an outside click, honour disabled options, and hand the SAME value
// back to the caller that a native <select> would have — including the empty string, which
// the product uses as a genuine "no selection" option in a dozen finance forms.

const statuses = [
  { value: '', label: '— Kein Kunde zugeordnet —' },
  { value: 'lead', label: 'Lead' },
  { value: 'active', label: 'Aktiv' },
  { value: 'paused', label: 'Pausiert', disabled: true },
];

function ControlledSelect(props: Partial<React.ComponentProps<typeof PremiumSelect>> = {}) {
  const [value, setValue] = useState(props.value ?? 'lead');
  return (
    <PremiumSelect
      label="Lifecycle-Status"
      value={value}
      onValueChange={(next) => {
        setValue(next);
        props.onValueChange?.(next);
      }}
      options={statuses}
      {...props}
      // The local state must win over a `value` passed only as an initial seed.
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...{ value }}
    />
  );
}

describe('PremiumSelect', () => {
  it('exposes a combobox trigger with the visible label as its accessible name', () => {
    render(<ControlledSelect />);
    expect(screen.getByRole('combobox', { name: /Lifecycle-Status/ })).toBeInTheDocument();
  });

  it('opens, lists every option in the declared order and marks the current one as selected', async () => {
    const user = userEvent.setup();
    render(<ControlledSelect />);

    await user.click(screen.getByRole('combobox', { name: /Lifecycle-Status/ }));

    const listbox = await screen.findByRole('listbox');
    const options = within(listbox).getAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual([
      '— Kein Kunde zugeordnet —',
      'Lead',
      'Aktiv',
      'Pausiert',
    ]);
    expect(within(listbox).getByRole('option', { name: 'Lead' })).toHaveAttribute('aria-selected', 'true');
  });

  it('selects with the keyboard alone and reports the chosen value', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<ControlledSelect onValueChange={onValueChange} />);

    await user.tab();
    expect(screen.getByRole('combobox', { name: /Lifecycle-Status/ })).toHaveFocus();

    await user.keyboard('{Enter}');
    await screen.findByRole('listbox');
    await user.keyboard('{ArrowDown}{Enter}');

    await waitFor(() => expect(onValueChange).toHaveBeenCalledWith('active'));
  });

  it('hands back the empty string unchanged for a real "no selection" option', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<ControlledSelect onValueChange={onValueChange} />);

    await user.click(screen.getByRole('combobox', { name: /Lifecycle-Status/ }));
    await user.click(await screen.findByRole('option', { name: '— Kein Kunde zugeordnet —' }));

    // Not the internal sentinel: the caller's contract is byte-identical to a native select.
    await waitFor(() => expect(onValueChange).toHaveBeenCalledWith(''));
  });

  it('marks a disabled option as disabled and does not select it', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<ControlledSelect onValueChange={onValueChange} />);

    await user.click(screen.getByRole('combobox', { name: /Lifecycle-Status/ }));
    const disabledOption = await screen.findByRole('option', { name: 'Pausiert' });
    expect(disabledOption).toHaveAttribute('data-disabled');

    await user.click(disabledOption);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('does not open at all when the whole control is disabled', async () => {
    const user = userEvent.setup();
    render(<ControlledSelect disabled />);

    const trigger = screen.getByRole('combobox', { name: /Lifecycle-Status/ });
    expect(trigger).toBeDisabled();
    await user.click(trigger);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('wires an error message to the control via aria-describedby and aria-invalid', () => {
    render(<ControlledSelect id="status" error="Bitte einen Status wählen." />);

    const trigger = screen.getByRole('combobox', { name: /Lifecycle-Status/ });
    expect(trigger).toHaveAttribute('aria-invalid', 'true');
    expect(trigger).toHaveAttribute('aria-describedby', 'status-error');
    expect(screen.getByText('Bitte einen Status wählen.')).toHaveAttribute('id', 'status-error');
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    render(<ControlledSelect />);

    const trigger = screen.getByRole('combobox', { name: /Lifecycle-Status/ });
    await user.click(trigger);
    await screen.findByRole('listbox');

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it('renders a long option without losing its accessible name', async () => {
    const user = userEvent.setup();
    const longLabel =
      'Musterbau Heizungstechnik Bayreuth GmbH & Co. Kommanditgesellschaft — Standort Oberfranken';
    render(
      <ControlledSelect
        value="long"
        options={[{ value: 'long', label: longLabel }, ...statuses.slice(1)]}
      />,
    );

    await user.click(screen.getByRole('combobox', { name: /Lifecycle-Status/ }));
    // Truncation is visual only (CSS `truncate`); the full text stays in the accessible tree.
    expect(await screen.findByRole('option', { name: longLabel })).toBeInTheDocument();
  });

  it('renders a hidden native select for form integration when a name is supplied', () => {
    // Radix only emits the hidden native select inside a form, which is exactly where
    // native submission and React Hook Form's uncontrolled path need it.
    const { container } = render(
      <form>
        <ControlledSelect name="lifecycle_status" />
      </form>,
    );

    // The only native select permitted: an invisible semantic fallback so the control still
    // participates in native form submission. It is never the visible interface.
    const native = container.querySelector('select[name="lifecycle_status"]');
    expect(native).not.toBeNull();
    expect(native).toHaveAttribute('aria-hidden', 'true');
  });

  it('keeps a 44px minimum touch target on every option row', async () => {
    const user = userEvent.setup();
    render(<ControlledSelect />);

    await user.click(screen.getByRole('combobox', { name: /Lifecycle-Status/ }));
    for (const option of within(await screen.findByRole('listbox')).getAllByRole('option')) {
      expect(option.className).toContain('min-h-11');
    }
  });

  it('scopes the portalled list to a product surface so reduced motion reaches it', async () => {
    const user = userEvent.setup();
    render(<ControlledSelect />);

    await user.click(screen.getByRole('combobox', { name: /Lifecycle-Status/ }));
    const listbox = await screen.findByRole('listbox');

    // index.css collapses animations under prefers-reduced-motion for [data-cq-surface] and
    // its descendants. Radix portals to document.body, outside both shells, so the portalled
    // root has to carry the marker itself or the entrance animation would survive.
    expect(listbox.closest('[data-cq-surface]')).not.toBeNull();
  });

  it('switches organizations through the same contract the shell relies on', async () => {
    const user = userEvent.setup();
    const setActiveOrganizationId = vi.fn();

    function OrgSwitcher() {
      const [active, setActive] = useState('org-a');
      return (
        <PremiumSelect
          ariaLabel="Organisation auswählen"
          value={active}
          onValueChange={(value) => {
            setActive(value);
            setActiveOrganizationId(value || null);
          }}
          options={[
            { value: 'org-a', label: 'Musterbau GmbH' },
            { value: 'org-b', label: 'Nordlicht Energie AG' },
          ]}
        />
      );
    }

    render(<OrgSwitcher />);
    await user.click(screen.getByRole('combobox', { name: 'Organisation auswählen' }));
    await user.click(await screen.findByRole('option', { name: 'Nordlicht Energie AG' }));

    await waitFor(() => expect(setActiveOrganizationId).toHaveBeenCalledWith('org-b'));
  });
});

const customers = [
  { value: 'c1', label: 'Musterbau GmbH', description: 'Bayreuth', keywords: ['K-1001'] },
  { value: 'c2', label: 'Nordlicht Energie AG', description: 'Kiel', keywords: ['K-1002'] },
  { value: 'c3', label: 'Südwind Solar GmbH', description: 'Freiburg', keywords: ['K-1003'] },
];

function ControlledCombobox(props: Partial<React.ComponentProps<typeof PremiumCombobox>> = {}) {
  const [value, setValue] = useState('');
  return (
    <PremiumCombobox
      label="Kunde"
      placeholder="Kunde wählen"
      emptyMessage="Kein Kunde gefunden."
      value={value}
      onValueChange={(next) => {
        setValue(next);
        props.onValueChange?.(next);
      }}
      options={customers}
      {...props}
      {...{ value }}
    />
  );
}

describe('PremiumCombobox', () => {
  it('filters the list by the search term and selects with the keyboard', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<ControlledCombobox onValueChange={onValueChange} />);

    await user.click(screen.getByRole('combobox', { name: /Kunde/ }));
    await user.keyboard('nordlicht');

    await waitFor(() => expect(screen.queryByText('Musterbau GmbH')).not.toBeInTheDocument());
    expect(screen.getByText('Nordlicht Energie AG')).toBeInTheDocument();

    await user.keyboard('{Enter}');
    await waitFor(() => expect(onValueChange).toHaveBeenCalledWith('c2'));
  });

  it('matches on keywords that are never rendered as the label', async () => {
    const user = userEvent.setup();
    render(<ControlledCombobox />);

    await user.click(screen.getByRole('combobox', { name: /Kunde/ }));
    await user.keyboard('K-1003');

    await waitFor(() => expect(screen.getByText('Südwind Solar GmbH')).toBeInTheDocument());
    expect(screen.queryByText('Musterbau GmbH')).not.toBeInTheDocument();
  });

  it('shows the empty state when nothing matches', async () => {
    const user = userEvent.setup();
    render(<ControlledCombobox />);

    await user.click(screen.getByRole('combobox', { name: /Kunde/ }));
    await user.keyboard('zzzz');

    expect(await screen.findByText('Kein Kunde gefunden.')).toBeInTheDocument();
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    render(<ControlledCombobox />);

    const trigger = screen.getByRole('combobox', { name: /Kunde/ });
    await user.click(trigger);
    expect(await screen.findByPlaceholderText('Suchen …')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByPlaceholderText('Suchen …')).not.toBeInTheDocument());
  });

  it('closes on an outside click', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <ControlledCombobox />
        <button type="button">Woanders</button>
      </div>,
    );

    await user.click(screen.getByRole('combobox', { name: /Kunde/ }));
    expect(await screen.findByPlaceholderText('Suchen …')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Woanders' }));
    await waitFor(() => expect(screen.queryByPlaceholderText('Suchen …')).not.toBeInTheDocument());
  });

  it('offers a clear action only when the field permits an empty value', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<PremiumCombobox label="Kunde" value="c1" onValueChange={() => {}} options={customers} />);
    expect(screen.queryByRole('button', { name: 'Auswahl entfernen' })).not.toBeInTheDocument();

    const onValueChange = vi.fn();
    rerender(
      <PremiumCombobox label="Kunde" value="c1" onValueChange={onValueChange} options={customers} clearable />,
    );
    await user.click(screen.getByRole('button', { name: 'Auswahl entfernen' }));
    expect(onValueChange).toHaveBeenCalledWith('');
  });

  it('does not open when disabled', async () => {
    const user = userEvent.setup();
    render(<ControlledCombobox disabled />);

    const trigger = screen.getByRole('combobox', { name: /Kunde/ });
    expect(trigger).toBeDisabled();
    await user.click(trigger);
    expect(screen.queryByPlaceholderText('Suchen …')).not.toBeInTheDocument();
  });
});

describe('PremiumDropdownMenu', () => {
  const renderMenu = (onDelete = vi.fn()) => {
    render(
      <PremiumDropdownMenu
        trigger={
          <button type="button" aria-label="Aktionen">
            <MoreHorizontal size={16} />
          </button>
        }
        groups={[
          { label: 'Bearbeiten', items: [{ key: 'edit', label: 'Umbenennen' }] },
          {
            items: [
              {
                key: 'delete',
                label: 'Löschen',
                icon: Trash2,
                destructive: true,
                onSelect: onDelete,
              },
              {
                key: 'archive',
                label: 'Archivieren',
                description: 'Erst möglich, wenn alle Rechnungen bezahlt sind.',
                disabled: true,
              },
            ],
          },
        ]}
      />,
    );
    return onDelete;
  };

  it('opens from the keyboard and moves focus into the menu', async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.tab();
    expect(screen.getByRole('button', { name: 'Aktionen' })).toHaveFocus();

    await user.keyboard('{Enter}');
    const menu = await screen.findByRole('menu');
    await waitFor(() => expect(within(menu).getByRole('menuitem', { name: 'Umbenennen' })).toHaveFocus());
  });

  it('runs a destructive item and explains a disabled one instead of hiding it', async () => {
    const user = userEvent.setup();
    const onDelete = renderMenu();

    await user.click(screen.getByRole('button', { name: 'Aktionen' }));
    const menu = await screen.findByRole('menu');

    expect(within(menu).getByText('Erst möglich, wenn alle Rechnungen bezahlt sind.')).toBeInTheDocument();
    expect(within(menu).getByRole('menuitem', { name: /Archivieren/ })).toHaveAttribute('aria-disabled', 'true');

    await user.click(within(menu).getByRole('menuitem', { name: 'Löschen' }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    renderMenu();

    const trigger = screen.getByRole('button', { name: 'Aktionen' });
    await user.click(trigger);
    await screen.findByRole('menu');

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it('closes on an outside click', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <PremiumDropdownMenu
          trigger={<button type="button" aria-label="Aktionen">…</button>}
          groups={[{ items: [{ key: 'a', label: 'Aktion A' }] }]}
        />
        <button type="button">Woanders</button>
      </div>,
    );

    await user.click(screen.getByRole('button', { name: 'Aktionen' }));
    await screen.findByRole('menu');

    await user.click(screen.getByRole('button', { name: 'Woanders' }));
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
  });

  it('portals into a product surface so the menu cannot be clipped or lose its tokens', async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole('button', { name: 'Aktionen' }));
    const menu = await screen.findByRole('menu');
    expect(menu.closest('[data-cq-surface]')).not.toBeNull();
  });
});
