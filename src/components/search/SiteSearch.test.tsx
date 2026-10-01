import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

import { Navigation } from '@/components/Navigation';
import { openSiteSearch, queryFromPath } from '@/lib/search/openSiteSearch';

// Bedienung der Seitensuche von der Navigation aus: öffnen (Knopf, Tastatur,
// Ereignis), tippen, mit der Tastatur wählen, Seite wechseln, schließen.
//
// Keine der eingefrorenen Experimentrouten wird hier beim Namen genannt.

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: null, isLoading: false }),
}));

function Pfadanzeige() {
  const { pathname } = useLocation();
  return <output data-testid="pfad">{pathname}</output>;
}

function aufbauen(pfad = '/') {
  return render(
    <MemoryRouter initialEntries={[pfad]}>
      <Navigation />
      <Routes>
        <Route path="*" element={<Pfadanzeige />} />
      </Routes>
    </MemoryRouter>
  );
}

function ausloeser() {
  // Desktop-Feld und Mobil-Knopf tragen beide die Rolle; der erste genügt.
  return screen.getAllByRole('button', { name: /Seite finden|Suche/ })[0];
}

async function dialog() {
  return await screen.findByRole('dialog', { name: 'Seite finden' });
}

describe('Seitensuche — Öffnen', () => {
  it('steht vor dem ersten Öffnen nicht im Dokument', () => {
    aufbauen();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(ausloeser().getAttribute('aria-expanded')).toBe('false');
  });

  it('öffnet per Knopf und setzt den Fokus in das Eingabefeld', async () => {
    const user = userEvent.setup();
    aufbauen();
    await user.click(ausloeser());
    const d = await dialog();
    const feld = within(d).getByRole('textbox', { name: 'Seite finden' });
    await waitFor(() => expect(document.activeElement).toBe(feld));
  });

  it('öffnet mit Strg K', async () => {
    const user = userEvent.setup();
    aufbauen();
    await user.keyboard('{Control>}k{/Control}');
    expect(await dialog()).toBeTruthy();
  });

  it('öffnet über das Ereignis mit vorbelegter Eingabe', async () => {
    aufbauen();
    openSiteSearch({ query: queryFromPath('/impressum-alt') });
    const d = await dialog();
    const feld = within(d).getByRole('textbox', { name: 'Seite finden' }) as HTMLInputElement;
    expect(feld.value).toBe('impressum alt');
    expect(await within(d).findByRole('option', { name: /Impressum/ })).toBeTruthy();
  });
});

describe('Seitensuche — Suchen und Wählen', () => {
  it('zeigt die beste Seite zuerst, als echten Verweis', async () => {
    const user = userEvent.setup();
    aufbauen();
    await user.click(ausloeser());
    const d = await dialog();
    await user.type(within(d).getByRole('textbox', { name: 'Seite finden' }), 'was kostet eine website');

    const optionen = await within(d).findAllByRole('option');
    expect(optionen[0].getAttribute('href')).toBe('/kosten-webdesign');
    expect(optionen[0].getAttribute('aria-selected')).toBe('true');
    expect(within(optionen[0]).getByText('Beste Übereinstimmung')).toBeTruthy();
  });

  it('wechselt mit Pfeiltasten und öffnet mit der Eingabetaste', async () => {
    const user = userEvent.setup();
    aufbauen();
    await user.click(ausloeser());
    const d = await dialog();
    const feld = within(d).getByRole('textbox', { name: 'Seite finden' });
    await user.type(feld, 'Kosten');
    const optionen = await within(d).findAllByRole('option');
    expect(optionen.length).toBeGreaterThan(1);

    await user.keyboard('{ArrowDown}');
    const zweite = within(d).getAllByRole('option')[1];
    expect(zweite.getAttribute('aria-selected')).toBe('true');
    expect(feld.getAttribute('aria-activedescendant')).toBe(zweite.id);

    const ziel = zweite.getAttribute('href');
    await user.keyboard('{Enter}');
    await waitFor(() => expect(screen.getByTestId('pfad').textContent).toBe(ziel));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('sagt ehrlich, wenn es keine Seite gibt, und bietet den Kontakt an', async () => {
    const user = userEvent.setup();
    aufbauen();
    await user.click(ausloeser());
    const d = await dialog();
    await user.type(within(d).getByRole('textbox', { name: 'Seite finden' }), 'xqzvw');
    expect(await within(d).findByText(/keine eigene Seite/)).toBeTruthy();
    expect(within(d).getByRole('link', { name: /Anliegen schildern/ }).getAttribute('href')).toBe('/kontakt');
  });

  it('bietet Beispiele an, solange nichts getippt ist', async () => {
    const user = userEvent.setup();
    aufbauen();
    await user.click(ausloeser());
    const d = await dialog();
    await user.click(within(d).getByRole('button', { name: /Anrufe gehen verloren/ }));
    const optionen = await within(d).findAllByRole('option');
    expect(optionen[0].getAttribute('href')).toBe('/verpasste-anrufe-verlust');
  });
});

describe('Seitensuche — Schließen', () => {
  it('schließt mit Escape und gibt den Fokus an den Auslöser zurück', async () => {
    const user = userEvent.setup();
    aufbauen();
    const knopf = ausloeser();
    await user.click(knopf);
    await dialog();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(knopf));
  });
});
