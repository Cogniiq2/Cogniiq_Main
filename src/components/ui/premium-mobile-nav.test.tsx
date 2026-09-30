import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { PremiumMobileNav } from '@/components/ui/premium-mobile-nav';
import { LEISTUNGEN, STANDORTE } from '@/lib/navigation-data';

// Verhaltensdeckung für die Mobilnavigation: ein Register mit Drill-down statt
// verschachtelter Akkordeons. Festgehalten wird, dass jede Ebene genau eine
// Entscheidung zeigt, dass Ziele echte Verweise sind und dass die
// Dialog-Semantik (Escape, Fokus zurück, Rücksprung) trägt.
//
// Reine vitest-Zusicherungen; dieses Repository registriert keine
// jest-dom-Matcher global.

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: null, isLoading: false }),
}));

function aufbauen(pfad = '/') {
  return render(
    <MemoryRouter initialEntries={[pfad]}>
      <PremiumMobileNav />
    </MemoryRouter>
  );
}

async function oeffnen() {
  const user = userEvent.setup();
  const view = aufbauen();
  await user.click(screen.getByRole('button', { name: 'Navigation öffnen' }));
  return { user, view, dialog: screen.getByRole('dialog', { name: 'Navigation' }) };
}

describe('Mobilnavigation — Aufbau', () => {
  it('rendert geschlossen nur den Auslöser, keine Ziele', () => {
    aufbauen();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(screen.getByRole('button', { name: 'Navigation öffnen' }).getAttribute('aria-expanded')).toBe('false');
  });

  it('zeigt auf Ebene 1 drei Hauptziele und keine Nischen', async () => {
    const { dialog } = await oeffnen();
    expect(within(dialog).getByRole('button', { name: /Leistungen/ })).toBeTruthy();
    expect(within(dialog).getByRole('button', { name: /Standorte/ })).toBeTruthy();
    expect(within(dialog).getByRole('link', { name: /Über uns/ }).getAttribute('href')).toBe('/ueber-uns');

    const hrefs = within(dialog).getAllByRole('link').map((a) => a.getAttribute('href'));
    for (const leistung of LEISTUNGEN) {
      for (const nische of leistung.nischen) expect(hrefs).not.toContain(nische.href);
    }
    // Die Handlung steht auf jeder Ebene im Fuß.
    expect(within(dialog).getByRole('link', { name: /Erstgespräch vereinbaren/ }).getAttribute('href')).toBe('/kontakt');
  });

  it('führt per Drill-down von den Leistungen zu den Nischen und wieder zurück', async () => {
    const { user, dialog } = await oeffnen();
    await user.click(within(dialog).getByRole('button', { name: /Leistungen/ }));

    await waitFor(() => expect(within(dialog).getByRole('heading', { name: 'Leistungen' })).toBeTruthy());
    for (const leistung of LEISTUNGEN) {
      expect(within(dialog).getByRole('button', { name: new RegExp(leistung.label) })).toBeTruthy();
    }

    const zweite = LEISTUNGEN[1];
    await user.click(within(dialog).getByRole('button', { name: new RegExp(zweite.label) }));
    await waitFor(() => expect(within(dialog).getByRole('heading', { name: zweite.label })).toBeTruthy());
    expect(within(dialog).getByRole('link', { name: /Überblick/ }).getAttribute('href')).toBe(zweite.href);
    for (const nische of zweite.nischen) {
      expect(within(dialog).getByRole('link', { name: nische.label }).getAttribute('href')).toBe(nische.href);
    }

    await user.click(within(dialog).getByRole('button', { name: /Zurück zu Leistungen/ }));
    await waitFor(() => expect(within(dialog).getByRole('heading', { name: 'Leistungen' })).toBeTruthy());
  });

  it('zeigt unter Standorte die fünf Ziele und den Hauptsitz', async () => {
    const { user, dialog } = await oeffnen();
    await user.click(within(dialog).getByRole('button', { name: /Standorte/ }));
    await waitFor(() => expect(within(dialog).getByRole('heading', { name: 'Standorte' })).toBeTruthy());

    for (const ziel of [...STANDORTE.staedte, ...STANDORTE.regionen]) {
      expect(within(dialog).getByRole('link', { name: new RegExp(ziel.label) }).getAttribute('href')).toBe(ziel.href);
    }
    expect(within(dialog).getByText('Hauptsitz')).toBeTruthy();
  });
});

describe('Mobilnavigation — Zustand und Bedienung', () => {
  it('markiert den aktiven Bereich über navigation-data, auch für /praxen', async () => {
    const user = userEvent.setup();
    aufbauen('/praxen');
    await user.click(screen.getByRole('button', { name: 'Navigation öffnen' }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('button', { name: /Leistungen.*Aktuell/ })).toBeTruthy();
  });

  it('schließt mit Escape und gibt den Fokus an den Auslöser zurück', async () => {
    const { user } = await oeffnen();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Navigation öffnen' }));
  });

  it('beginnt nach erneutem Öffnen wieder auf Ebene 1', async () => {
    const { user, dialog } = await oeffnen();
    await user.click(within(dialog).getByRole('button', { name: /Standorte/ }));
    await waitFor(() => expect(within(dialog).getByRole('heading', { name: 'Standorte' })).toBeTruthy());

    await user.click(within(dialog).getByRole('button', { name: 'Navigation schließen' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

    await user.click(screen.getByRole('button', { name: 'Navigation öffnen' }));
    const neu = screen.getByRole('dialog');
    expect(within(neu).queryByRole('heading', { name: 'Standorte' })).toBeNull();
    expect(within(neu).getByRole('button', { name: /Leistungen/ })).toBeTruthy();
  });
});
