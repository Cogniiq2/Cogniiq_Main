import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PremiumSelect, type SelectOption } from './PremiumSelect';

// Behavioural contract for the premium dropdown system. These assert the things a native <select>
// gave us for free and that a custom control must not lose: labelling, keyboard operation,
// selected state, disabled options, escape handling and focus restoration.

const options: SelectOption[] = [
  { value: 'draft', label: 'Entwurf' },
  { value: 'sent', label: 'Versendet' },
  { value: 'paid', label: 'Bezahlt' },
  { value: 'void', label: 'Storniert', disabled: true },
];

function Harness({
  initial = 'draft',
  onChange,
  ...rest
}: { initial?: string; onChange?: (v: string) => void } & Partial<React.ComponentProps<typeof PremiumSelect>>) {
  const [value, setValue] = useState(initial);
  return (
    <PremiumSelect
      id="status"
      label="Status"
      value={value}
      onChange={(next) => { setValue(next); onChange?.(next); }}
      options={options}
      {...rest}
    />
  );
}

describe('PremiumSelect', () => {
  it('associates the visible label with the trigger', () => {
    render(<Harness />);
    expect(screen.getByLabelText('Status')).toBeInTheDocument();
  });

  it('renders the selected value in the closed trigger', () => {
    render(<Harness initial="paid" />);
    expect(screen.getByLabelText('Status')).toHaveTextContent('Bezahlt');
  });

  it('opens with the keyboard and reports expanded state', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const trigger = screen.getByLabelText('Status');

    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    trigger.focus();
    await user.keyboard('{Enter}');

    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('selects an option with arrow keys and Enter', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    const trigger = screen.getByLabelText('Status');
    trigger.focus();
    await user.keyboard('{Enter}');
    await screen.findByRole('listbox');

    await user.keyboard('{ArrowDown}{Enter}');

    await waitFor(() => expect(onChange).toHaveBeenCalledWith('sent'));
    expect(trigger).toHaveTextContent('Versendet');
  });

  it('marks the selected option and leaves others unselected', async () => {
    const user = userEvent.setup();
    render(<Harness initial="sent" />);

    await user.click(screen.getByLabelText('Status'));
    const listbox = await screen.findByRole('listbox');

    expect(within(listbox).getByRole('option', { name: 'Versendet' })).toHaveAttribute('aria-selected', 'true');
    expect(within(listbox).getByRole('option', { name: 'Entwurf' })).toHaveAttribute('aria-selected', 'false');
  });

  it('does not select a disabled option', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    await user.click(screen.getByLabelText('Status'));
    const listbox = await screen.findByRole('listbox');

    await user.click(within(listbox).getByRole('option', { name: 'Storniert' }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it('closes on Escape and restores focus to the trigger', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const trigger = screen.getByLabelText('Status');

    await user.click(trigger);
    await screen.findByRole('listbox');

    await user.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it('supports an empty-string option value, which Radix reserves internally', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const withEmpty: SelectOption[] = [
      { value: '', label: '— Keine Zuordnung —' },
      { value: 'a', label: 'Kunde A' },
    ];

    function EmptyHarness() {
      const [value, setValue] = useState('a');
      return (
        <PremiumSelect
          id="alloc"
          label="Zuordnung"
          value={value}
          onChange={(next) => { setValue(next); onChange(next); }}
          options={withEmpty}
        />
      );
    }

    render(<EmptyHarness />);
    await user.click(screen.getByLabelText('Zuordnung'));
    const listbox = await screen.findByRole('listbox');
    await user.click(within(listbox).getByRole('option', { name: '— Keine Zuordnung —' }));

    // The caller must receive "", not the internal sentinel.
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(''));
  });

  it('exposes invalid state and associates the error message', () => {
    render(<Harness error="Bitte Status wählen" />);
    const trigger = screen.getByLabelText('Status');

    expect(trigger).toHaveAttribute('aria-invalid', 'true');
    expect(trigger).toHaveAccessibleDescription('Bitte Status wählen');
  });

  it('associates the hint when there is no error', () => {
    render(<Harness hint="Wird im Dokument angezeigt" />);
    expect(screen.getByLabelText('Status')).toHaveAccessibleDescription('Wird im Dokument angezeigt');
  });

  it('does not open when disabled', async () => {
    const user = userEvent.setup();
    render(<Harness disabled />);

    const trigger = screen.getByLabelText('Status');
    expect(trigger).toBeDisabled();

    await user.click(trigger);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('renders the menu in a portal so it is not clipped by an overflow-hidden ancestor', async () => {
    const user = userEvent.setup();
    render(
      <div style={{ overflow: 'hidden' }} data-testid="clipper">
        <Harness />
      </div>,
    );

    await user.click(screen.getByLabelText('Status'));
    const listbox = await screen.findByRole('listbox');

    expect(screen.getByTestId('clipper')).not.toContainElement(listbox);
  });
});
