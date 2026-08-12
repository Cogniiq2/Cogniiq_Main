import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { createFixtureAdapter } from './adapter/fixtureAdapter';
import { ClubOperationsModule } from './ClubOperationsModule';
import { formatCents } from './formatting';
import { fixtureBookings } from './fixtures/bookings';

function renderModule(options: Parameters<typeof createFixtureAdapter>[0] = {}) {
  return render(<ClubOperationsModule adapter={createFixtureAdapter(options)} />);
}

describe('module shell', () => {
  it('exposes only the sections implemented in this phase', async () => {
    renderModule();
    const nav = screen.getByRole('navigation', { name: 'Vereinsbetrieb' });
    const items = within(nav).getAllByRole('button');
    expect(items.map((item) => item.textContent?.trim())).toEqual(['Übersicht', 'Buchungen']);
  });

  it('shows no links for sections that do not exist yet', () => {
    renderModule();
    for (const absent of ['Rechnungen', 'Zahlungen', 'Mitglieder', 'Gutscheine', 'Berichte', 'Einstellungen']) {
      expect(screen.queryByText(absent)).toBeNull();
    }
  });

  it('marks the active section for assistive technology', async () => {
    renderModule();
    expect(screen.getByRole('button', { name: /Übersicht/ })).toHaveAttribute('aria-current', 'page');
    await userEvent.click(screen.getByRole('button', { name: /Buchungen/ }));
    expect(screen.getByRole('button', { name: /Buchungen/ })).toHaveAttribute('aria-current', 'page');
  });

  it('switches sections by keyboard alone', async () => {
    renderModule();
    const bookingsTab = screen.getByRole('button', { name: /Buchungen/ });
    bookingsTab.focus();
    expect(bookingsTab).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());
  });

  it('renders no global layout chrome of its own', () => {
    const { container } = renderModule();
    // The host shell owns these; a second one would compete with the portal's own navigation.
    expect(container.querySelector('header')).toBeNull();
    expect(container.querySelector('aside')).toBeNull();
  });
});

describe('overview section', () => {
  it('renders the operational metric groups', async () => {
    renderModule();
    expect(await screen.findByText('Gesamtumsatz')).toBeInTheDocument();
    expect(screen.getByText('Ø Buchungswert')).toBeInTheDocument();
    expect(screen.getByText('MwSt. gesamt')).toBeInTheDocument();
    expect(screen.getByText('Zahlungsstatus')).toBeInTheDocument();
    expect(screen.getByText('Platzauslastung')).toBeInTheDocument();
    expect(screen.getByText('Letzte Aktivität')).toBeInTheDocument();
  });

  it('formats money as de-DE euros, never as raw cents', async () => {
    renderModule();
    await screen.findByText('Gesamtumsatz');

    const expectedCents = fixtureBookings
      .filter((booking) => booking.paymentStatus === 'paid')
      .reduce((sum, booking) => sum + booking.amountCents, 0);

    // Intl separates the amount from the currency symbol with a non-breaking space; compare on a
    // whitespace-normalised copy so the assertion tests the formatting, not the space character.
    const normalize = (value: string) => value.replace(/\s+/g, ' ');
    const page = normalize(document.body.textContent ?? '');

    // The formatted euro string is rendered ...
    expect(page).toContain(normalize(formatCents(expectedCents)));
    // ... and the raw cent integer appears nowhere on the page.
    expect(page).not.toContain(String(expectedCents));
  });

  it('gives the VAT table real table semantics with a caption', async () => {
    renderModule();
    const vatTable = await screen.findByRole('table', { name: /Umsatzsteuer/ });
    expect(within(vatTable).getAllByRole('columnheader').map((h) => h.textContent)).toEqual([
      'Kategorie', 'Buchungen', 'Netto', 'MwSt.',
    ]);
    expect(within(vatTable).getAllByRole('rowheader').length).toBeGreaterThan(0);
  });

  it('labels the period selector', async () => {
    renderModule();
    expect(await screen.findByLabelText('Zeitraum')).toBeInTheDocument();
  });

  it('states plainly that the data is not live', async () => {
    renderModule();
    expect(await screen.findByText(/keine Verbindung zu einem Live-System/i)).toBeInTheDocument();
  });

  it('offers no mutation controls', async () => {
    renderModule();
    await screen.findByText('Gesamtumsatz');
    for (const forbidden of [/speichern/i, /stornieren/i, /erstatten/i, /rechnung erstellen/i, /überschreiben/i]) {
      expect(screen.queryByRole('button', { name: forbidden })).toBeNull();
    }
  });
});

describe('overview states', () => {
  it('announces the loading state', () => {
    renderModule({ scenario: 'loading' });
    expect(screen.getByRole('status', { name: 'Übersicht wird geladen' })).toBeInTheDocument();
  });

  it('renders a useful empty state', async () => {
    renderModule({ scenario: 'empty' });
    expect(await screen.findByText('Keine Daten im gewählten Zeitraum')).toBeInTheDocument();
  });

  it('renders an alert with a retry affordance on error', async () => {
    renderModule({ scenario: 'error' });
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Übersicht konnte nicht geladen werden');
    expect(screen.getByRole('button', { name: 'Erneut versuchen' })).toBeInTheDocument();
  });

  it('maps a forbidden failure to a permission message, not a technical one', async () => {
    renderModule({ scenario: 'error', errorCode: 'forbidden' });
    expect(await screen.findByText(/fehlt die Berechtigung/i)).toBeInTheDocument();
  });
});

describe('bookings section', () => {
  async function openBookings() {
    renderModule();
    await userEvent.click(screen.getByRole('button', { name: /Buchungen/ }));
    return screen.findByRole('table');
  }

  it('renders a semantic table with column headers', async () => {
    const table = await openBookings();
    const headers = within(table).getAllByRole('columnheader').map((h) => h.textContent);
    expect(headers).toEqual(['Referenz', 'Kunde', 'Platz', 'Datum', 'Status', 'Zahlung', 'Steuer', 'Betrag']);
  });

  it('renders one row per fixture booking', async () => {
    const table = await openBookings();
    expect(within(table).getAllByRole('row')).toHaveLength(fixtureBookings.length + 1);
  });

  it('renders long German names without truncating the underlying text', async () => {
    const table = await openBookings();
    expect(within(table).getByText('Maximiliane Schöllhammer-Oberreuther')).toBeInTheDocument();
    expect(within(table).getByText('Hans-Günther Vollenweider')).toBeInTheDocument();
  });

  it('labels every filter control', async () => {
    await openBookings();
    expect(screen.getByLabelText('Suche')).toBeInTheDocument();
    expect(screen.getByLabelText('Von')).toBeInTheDocument();
    expect(screen.getByLabelText('Bis')).toBeInTheDocument();
    expect(screen.getByLabelText('Status')).toBeInTheDocument();
    expect(screen.getByLabelText('Platz')).toBeInTheDocument();
  });

  it('narrows results as the user searches', async () => {
    await openBookings();
    await userEvent.type(screen.getByLabelText('Suche'), 'Krautwurst');
    await waitFor(() => {
      expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(2);
    });
  });

  it('shows a filter-specific empty state, not the generic one', async () => {
    await openBookings();
    await userEvent.type(screen.getByLabelText('Suche'), 'GibtEsNicht');
    expect(await screen.findByText('Keine Buchungen für diese Filter')).toBeInTheDocument();
    expect(screen.queryByText('Noch keine Buchungen')).toBeNull();
  });

  it('restores every booking when filters are reset', async () => {
    await openBookings();
    await userEvent.type(screen.getByLabelText('Suche'), 'Krautwurst');
    await waitFor(() => expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(2));

    await userEvent.click(screen.getByRole('button', { name: /Filter zurücksetzen/ }));
    await waitFor(() => {
      expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(fixtureBookings.length + 1);
    });
  });

  it('hides the reset control until something is actually filtered', async () => {
    await openBookings();
    expect(screen.queryByRole('button', { name: /Filter zurücksetzen/ })).toBeNull();
    await userEvent.type(screen.getByLabelText('Suche'), 'Krautwurst');
    expect(await screen.findByRole('button', { name: /Filter zurücksetzen/ })).toBeInTheDocument();
  });

  it('opens a read-only detail panel with no action controls', async () => {
    const table = await openBookings();
    await userEvent.click(within(table).getByText('Annegret Düsterhöft'));

    const panel = await screen.findByRole('region', { name: undefined }).catch(() => null);
    expect(await screen.findByText('Steuerkategorie')).toBeInTheDocument();
    expect(screen.getByText('Flutlicht')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Detailansicht schließen' })).toBeInTheDocument();
    for (const forbidden of [/stornieren/i, /erstatten/i, /überschreiben/i, /rechnung/i]) {
      expect(screen.queryByRole('button', { name: forbidden })).toBeNull();
    }
    void panel;
  });

  it('closes the detail panel again', async () => {
    const table = await openBookings();
    await userEvent.click(within(table).getByText('Annegret Düsterhöft'));
    await userEvent.click(await screen.findByRole('button', { name: 'Detailansicht schließen' }));
    await waitFor(() => expect(screen.queryByText('Steuerkategorie')).toBeNull());
  });

  it('renders a mobile card list alongside the table so small screens never rely on scroll', async () => {
    const { container } = render(<ClubOperationsModule adapter={createFixtureAdapter()} initialSection="bookings" />);
    await screen.findByRole('table');
    // The shared DataTable renders both presentations; the table is md+ only, the cards md:hidden.
    expect(container.querySelector('.md\\:hidden')).not.toBeNull();
    expect(container.querySelector('.hidden.md\\:block, .md\\:block')).not.toBeNull();
  });

  it('announces the result count', async () => {
    await openBookings();
    expect(await screen.findByText(new RegExp(`${fixtureBookings.length} Buchungen`))).toBeInTheDocument();
  });
});

describe('bookings states', () => {
  it('announces the loading state', () => {
    render(<ClubOperationsModule adapter={createFixtureAdapter({ scenario: 'loading' })} initialSection="bookings" />);
    expect(screen.getByRole('status', { name: 'Buchungen werden geladen' })).toBeInTheDocument();
  });

  it('shows the generic empty state when there is genuinely no data', async () => {
    render(<ClubOperationsModule adapter={createFixtureAdapter({ scenario: 'empty' })} initialSection="bookings" />);
    expect(await screen.findByText('Noch keine Buchungen')).toBeInTheDocument();
  });

  it('shows an alert on error', async () => {
    render(<ClubOperationsModule adapter={createFixtureAdapter({ scenario: 'error' })} initialSection="bookings" />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Buchungen konnten nicht geladen werden');
  });
});
