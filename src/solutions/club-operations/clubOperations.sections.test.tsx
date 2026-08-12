// Rendering, accessibility and read-only guarantees for the Phase C2 sections.

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { createFixtureAdapter, type FixtureAdapterOptions } from './adapter/fixtureAdapter';
import { ClubOperationsModule } from './ClubOperationsModule';
import { clubOperationsNavItems, type ClubOperationsSectionId } from './navigation';

function renderSection(section: ClubOperationsSectionId, options: FixtureAdapterOptions = {}) {
  return render(
    <ClubOperationsModule adapter={createFixtureAdapter(options)} initialSection={section} />,
  );
}

/** Words that would indicate a control capable of changing something. */
const mutationVerbs = [
  /speichern/i, /anlegen/i, /erstellen/i, /bearbeiten/i, /löschen/i, /stornieren/i,
  /erstatten/i, /versenden/i, /senden/i, /einlösen/i, /freigeben/i, /übernehmen/i,
  /deaktivieren/i, /auflösen/i, /überschreiben/i, /exportieren/i, /herunterladen/i,
];

/** Buttons every section legitimately has: filter reset, detail close, error retry. */
const allowedButtons = [
  /Filter zurücksetzen/i, /Detailansicht schließen/i, /Erneut versuchen/i,
  ...clubOperationsNavItems.map((item) => new RegExp(`^${item.label}$`)),
];

describe.each(clubOperationsNavItems.map((item) => [item.id, item.label] as const))(
  'section %s',
  (id, label) => {
    it('renders its own heading', async () => {
      renderSection(id);
      expect(await screen.findByRole('heading', { name: label })).toBeInTheDocument();
    });

    it('announces a loading state', () => {
      renderSection(id, { scenario: 'loading' });
      // Filter bars also carry role="status" for their result count, so match the loading label.
      const announced = screen
        .getAllByRole('status')
        .map((element) => element.getAttribute('aria-label') ?? '');
      expect(announced.some((label) => /wird geladen|werden geladen|wird erstellt/i.test(label))).toBe(true);
    });

    it('renders an alert with a retry affordance on error', async () => {
      renderSection(id, { scenario: 'error' });
      expect(await screen.findByRole('alert')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Erneut versuchen' })).toBeInTheDocument();
    });

    it('states that the data is not live', async () => {
      renderSection(id);
      await screen.findByRole('heading', { name: label });
      expect(screen.getAllByText(/keine Verbindung zu einem Live-System/i).length).toBeGreaterThan(0);
    });

    it('offers no control that could change anything', async () => {
      renderSection(id);
      await screen.findByRole('heading', { name: label });

      for (const verb of mutationVerbs) {
        expect(screen.queryByRole('button', { name: verb }), `${label}: ${verb}`).toBeNull();
      }

      // Nothing may be submittable either.
      expect(document.querySelector('form')).toBeNull();
      expect(document.querySelector('button[type="submit"]')).toBeNull();
    });

    it('exposes only permitted buttons', async () => {
      renderSection(id);
      await screen.findByRole('heading', { name: label });

      const unexpected = screen
        .getAllByRole('button')
        .map((button) => (button.getAttribute('aria-label') ?? button.textContent ?? '').trim())
        // Select triggers render their current value as their accessible name.
        .filter((name) => name.length > 0)
        .filter((name) => !allowedButtons.some((allowed) => allowed.test(name)))
        // Remaining entries are PremiumSelect triggers, which are read controls for filters.
        .filter((name) => !/alle |^\d{4}|zeitraum|monat|woche/i.test(name));

      // Anything left would be an action control that should not exist.
      for (const name of unexpected) {
        expect(mutationVerbs.some((verb) => verb.test(name)), `${label}: "${name}"`).toBe(false);
      }
    });
  },
);

describe('tables use real table semantics', () => {
  const tabular: ClubOperationsSectionId[] = [
    'bookings', 'payments', 'invoices', 'reconciliation', 'vouchers', 'members', 'activity', 'alerts',
  ];

  it.each(tabular)('%s renders a table with column headers and rows', async (id) => {
    renderSection(id);
    const table = await screen.findByRole('table');
    expect(within(table).getAllByRole('columnheader').length).toBeGreaterThan(2);
    expect(within(table).getAllByRole('row').length).toBeGreaterThan(1);
  });

  it.each(tabular)('%s renders a mobile card list alongside the table', async (id) => {
    const { container } = renderSection(id);
    await screen.findByRole('table');
    expect(container.querySelector('.md\\:hidden')).not.toBeNull();
  });
});

describe('filters are labelled and reset', () => {
  // Plural nouns, matching each section's own empty-state wording.
  const filtered: [ClubOperationsSectionId, string][] = [
    ['payments', 'Zahlungen'],
    ['invoices', 'Rechnungen'],
    ['reconciliation', 'Vorgänge'],
    ['vouchers', 'Gutscheine'],
    ['members', 'Mitglieder'],
    ['activity', 'Einträge'],
    ['alerts', 'Meldungen'],
  ];

  it.each(filtered)('%s labels its search field', async (id) => {
    renderSection(id);
    await screen.findByRole('table');
    expect(screen.getByLabelText('Suche')).toBeInTheDocument();
  });

  it.each(filtered)('%s shows a filter-specific empty state and restores on reset', async (id, noun) => {
    renderSection(id);
    await screen.findByRole('table');
    const before = within(screen.getByRole('table')).getAllByRole('row').length;

    await userEvent.type(screen.getByLabelText('Suche'), 'GibtEsNicht');
    expect(await screen.findByText(new RegExp(`Keine ${noun}`, 'i'))).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Filter zurücksetzen/ }));
    await waitFor(() => {
      expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(before);
    });
  });

  it.each(filtered)('%s hides the reset control until something is filtered', async (id) => {
    renderSection(id);
    await screen.findByRole('table');
    expect(screen.queryByRole('button', { name: /Filter zurücksetzen/ })).toBeNull();
  });
});

describe('detail panels', () => {
  const withDetail: [ClubOperationsSectionId, string][] = [
    ['payments', 'Zahlung'],
    ['invoices', 'Rechnung'],
    ['reconciliation', 'Abgleich'],
    ['vouchers', 'Gutschein'],
    ['members', 'Mitglied'],
    ['activity', 'Protokolleintrag'],
    ['alerts', 'Meldung'],
  ];

  it.each(withDetail)('%s opens and closes a read-only detail panel', async (id, eyebrow) => {
    renderSection(id);
    const table = await screen.findByRole('table');
    const firstRow = within(table).getAllByRole('row')[1];
    await userEvent.click(firstRow);

    const close = await screen.findByRole('button', { name: 'Detailansicht schließen' });
    const panel = close.closest('section') as HTMLElement;
    // getAllByText: some eyebrows also appear as a badge value inside the same panel
    // (a member's VAT classification renders as "Mitglied", for instance).
    expect(within(panel).getAllByText(eyebrow).length).toBeGreaterThan(0);

    // The panel's only control is the close button.
    expect(within(panel).getAllByRole('button')).toHaveLength(1);

    await userEvent.click(close);
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Detailansicht schließen' })).toBeNull();
    });
  });
});

describe('section-specific content', () => {
  it('Zahlungen shows totals, refunds and the remaining amount', async () => {
    renderSection('payments');
    expect(await screen.findByText('Brutto eingegangen')).toBeInTheDocument();
    expect(screen.getAllByText('Erstattet').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Verbleibt').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Zahlungswege').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Zahlungsstatus').length).toBeGreaterThan(0);
  });

  it('Rechnungen shows net, VAT and gross columns', async () => {
    renderSection('invoices');
    const table = await screen.findByRole('table');
    const headers = within(table).getAllByRole('columnheader').map((h) => h.textContent);
    expect(headers).toContain('Netto');
    expect(headers).toContain('MwSt.');
    expect(headers).toContain('Brutto');
  });

  it('Rechnungen marks an overdue invoice', async () => {
    renderSection('invoices');
    await screen.findByRole('table');
    expect(screen.getAllByText('Überfällig').length).toBeGreaterThan(0);
  });

  it('Zahlungsabgleich shows severities and the amount to recover', async () => {
    renderSection('reconciliation');
    expect(await screen.findByText('Potenziell nachzufordern')).toBeInTheDocument();
    expect(screen.getByText('Offene Prüfungen')).toBeInTheDocument();
    expect(screen.getAllByText('Kritisch').length).toBeGreaterThan(0);
  });

  it('Gutscheine shows original value, remaining balance and usage history', async () => {
    renderSection('vouchers');
    const table = await screen.findByRole('table');
    const headers = within(table).getAllByRole('columnheader').map((h) => h.textContent);
    expect(headers).toContain('Wert');
    expect(headers).toContain('Restguthaben');

    await userEvent.click(within(table).getAllByRole('row')[1]);
    expect((await screen.findAllByText('Einlösungen')).length).toBeGreaterThan(0);
  });

  it('Mitglieder shows the VAT classification a membership confers', async () => {
    renderSection('members');
    const table = await screen.findByRole('table');
    expect(within(table).getAllByRole('columnheader').map((h) => h.textContent)).toContain('Steuerlich');
    await userEvent.click(within(table).getAllByRole('row')[1]);
    expect(await screen.findByText('Steuerliche Einstufung')).toBeInTheDocument();
  });

  it('Monatsberichte compares against the previous month', async () => {
    renderSection('monthly-reports');
    expect(await screen.findByText('Vergleich zum Vormonat')).toBeInTheDocument();
    expect(screen.getByLabelText('Berichtsmonat')).toBeInTheDocument();
    const table = await screen.findByRole('table', { name: /Vergleich|Kennzahlen/ });
    expect(within(table).getAllByRole('rowheader').length).toBeGreaterThan(3);
  });

  it('Berichte lets the period be chosen and shows the VAT breakdown', async () => {
    renderSection('reports');
    expect(await screen.findByLabelText('Zeitraum')).toBeInTheDocument();
    expect(await screen.findByRole('table', { name: /Umsatzsteuer/ })).toBeInTheDocument();
    expect(screen.getByText('Erstattet gesamt')).toBeInTheDocument();
  });

  it('Berichte offers no download or export control', async () => {
    renderSection('reports');
    await screen.findByLabelText('Zeitraum');
    expect(screen.queryByRole('button', { name: /pdf|csv|download|herunterladen|exportieren/i })).toBeNull();
  });

  it('Aktivitätsprotokoll lists newest first with German descriptions', async () => {
    renderSection('activity');
    const table = await screen.findByRole('table');
    expect(within(table).getAllByRole('columnheader').map((h) => h.textContent)).toContain('Zeitpunkt');
    expect(within(table).getAllByText(/angesehen|erstellt|versendet|storniert|eingelöst|exportiert/i).length).toBeGreaterThan(0);
  });

  it('Alert Center surfaces open counts by severity', async () => {
    renderSection('alerts');
    expect(await screen.findByText('Offen gesamt')).toBeInTheDocument();
    expect(screen.getAllByText('Kritisch').length).toBeGreaterThan(0);
  });

  it('Einstellungen is labelled read-only and renders the permission matrix', async () => {
    renderSection('settings');
    expect(await screen.findByText('Nur-Lese-Ansicht')).toBeInTheDocument();
    const table = await screen.findByRole('table', { name: /Berechtigungen/ });
    expect(within(table).getAllByRole('columnheader').length).toBeGreaterThan(3);
  });

  it('Einstellungen renders no form control at all', async () => {
    renderSection('settings');
    await screen.findByText('Nur-Lese-Ansicht');
    expect(document.querySelector('input')).toBeNull();
    expect(document.querySelector('select')).toBeNull();
    expect(document.querySelector('textarea')).toBeNull();
    expect(document.querySelector('[role="switch"]')).toBeNull();
  });

  it('Übersicht summarises invoices, reconciliation and alerts', async () => {
    renderSection('overview');
    expect(await screen.findByText('Offene Rechnungen')).toBeInTheDocument();
    expect(screen.getByText('Offene Prüfungen')).toBeInTheDocument();
    expect(screen.getByText('Offene Meldungen')).toBeInTheDocument();
  });
});
