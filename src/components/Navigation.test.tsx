import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { Navigation } from '@/components/Navigation';
import { LEISTUNGEN, STANDORTE } from '@/lib/navigation-data';

// Verhaltensdeckung für die öffentliche Hauptnavigation. Zwei Dinge werden hier
// festgehalten, weil beide zuvor gebrochen waren:
//
//   1. Die Menge an Information auf Ebene 1. Vorher standen 37 Verweise
//      gleichzeitig im Leistungs-Panel. Der Test bindet die Ruhefassung auf die
//      drei Leistungen fest, damit die Liste nicht wieder anwächst.
//   2. Die Tastaturbedienung. Vorher öffneten die Panels ausschließlich auf
//      `mouseenter`, während `aria-expanded` am <button> dauerhaft "false"
//      meldete — für Tastaturbedienung nicht erreichbar.
//
// Reine vitest-Zusicherungen; dieses Repository registriert keine
// jest-dom-Matcher global.

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: null, isLoading: false }),
}));

function aufbauen(pfad = '/') {
  return render(
    <MemoryRouter initialEntries={[pfad]}>
      <Navigation />
    </MemoryRouter>
  );
}

function leistungenAusloeser() {
  return screen.getByRole('button', { name: /Leistungen/ });
}

describe('Hauptnavigation — Menge auf Ebene 1', () => {
  it('zeigt in der Kopfzeile genau drei Ziele neben Login und Handlung', () => {
    aufbauen();
    // Zwei Auslöser mit Panel plus ein einfacher Verweis.
    expect(screen.getByRole('button', { name: /Leistungen/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Standorte/ })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Über uns' })).toBeTruthy();

    // Was bewusst NICHT mehr in der Kopfzeile steht.
    expect(screen.queryByRole('link', { name: 'FAQ' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Blog' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Referenzen' })).toBeNull();
  });

  it('zeigt im geöffneten Leistungs-Panel nur die Leistungen, nicht die Nischen', async () => {
    const user = userEvent.setup();
    aufbauen();
    await user.click(leistungenAusloeser());

    const reiter = screen.getAllByRole('tab');
    expect(reiter).toHaveLength(LEISTUNGEN.length);
    expect(LEISTUNGEN).toHaveLength(3);

    // Die Nischen der NICHT gewählten Leistungen sind nicht sichtbar. Geprüft
    // wird über das Ziel, nicht über die Beschriftung: „Für Arztpraxen" und
    // „Für Restaurants" kommen in mehreren Leistungen vor.
    const sichtbareZiele = screen
      .getAllByRole('link')
      .map((a) => a.getAttribute('href'));
    for (const leistung of LEISTUNGEN.slice(1)) {
      for (const nische of leistung.nischen) {
        expect(sichtbareZiele).not.toContain(nische.href);
      }
    }
  });

  it('legt die Nischen erst nach der Wahl einer Leistung offen', async () => {
    const user = userEvent.setup();
    aufbauen();
    await user.click(leistungenAusloeser());

    const zweite = LEISTUNGEN[1];
    await user.hover(screen.getByRole('tab', { name: new RegExp(zweite.label) }));

    const panel = screen.getByRole('tabpanel');
    for (const nische of zweite.nischen) {
      expect(within(panel).getByRole('link', { name: nische.label })).toBeTruthy();
    }
  });

  it('führt den Gesundheits-Einstieg auf den Hub mit der vollständigen Beweiskette', async () => {
    const user = userEvent.setup();
    aufbauen();
    await user.click(leistungenAusloeser());

    const einstieg = screen.getByRole('link', { name: 'Für Arzt- und Zahnarztpraxen' });
    expect(einstieg.getAttribute('href')).toBe('/praxen');
  });

  it('zeigt unter Standorte fünf Ziele und keine Leistungen je Stadt', async () => {
    const user = userEvent.setup();
    aufbauen();
    await user.click(screen.getByRole('button', { name: /Standorte/ }));

    const gesamt = [...STANDORTE.staedte, ...STANDORTE.regionen];
    expect(gesamt).toHaveLength(5);
    for (const ziel of gesamt) {
      expect(screen.getByRole('link', { name: new RegExp(ziel.label) })).toBeTruthy();
    }
    // Keine Stadt-Leistungsverweise mehr im Panel.
    expect(screen.queryByRole('link', { name: /Webdesign Bayreuth/ })).toBeNull();
  });
});

describe('Hauptnavigation — Bedienung ohne Maus', () => {
  it('öffnet das Panel per Klick und meldet den Zustand korrekt', async () => {
    const user = userEvent.setup();
    aufbauen();
    const ausloeser = leistungenAusloeser();

    expect(ausloeser.getAttribute('aria-expanded')).toBe('false');
    await user.click(ausloeser);
    expect(ausloeser.getAttribute('aria-expanded')).toBe('true');
  });

  it('schließt mit Escape und gibt den Fokus an den Auslöser zurück', async () => {
    const user = userEvent.setup();
    aufbauen();
    const ausloeser = leistungenAusloeser();

    await user.click(ausloeser);
    expect(screen.getByRole('tablist')).toBeTruthy();

    await user.keyboard('{Escape}');
    // AnimatePresence hält das Panel für die Dauer der Ausblendung im DOM.
    await waitFor(() => expect(screen.queryByRole('tablist')).toBeNull());
    expect(document.activeElement).toBe(ausloeser);
  });

  it('wechselt mit den Pfeiltasten zwischen den Leistungen', async () => {
    const user = userEvent.setup();
    aufbauen();
    await user.click(leistungenAusloeser());

    const ersterReiter = screen.getByRole('tab', { name: new RegExp(LEISTUNGEN[0].label) });
    expect(ersterReiter.getAttribute('aria-selected')).toBe('true');

    ersterReiter.focus();
    await user.keyboard('{ArrowDown}');

    const zweiterReiter = screen.getByRole('tab', { name: new RegExp(LEISTUNGEN[1].label) });
    expect(zweiterReiter.getAttribute('aria-selected')).toBe('true');
  });
});
