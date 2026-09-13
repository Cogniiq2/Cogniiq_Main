/*
  Was diese Datei schützt.

  Das Hero-Beispiel darf sein Ergebnis NICHT hinter eine Interaktion legen: Wer
  die Seite öffnet, soll die Anfrage und die daraus gelesenen Felder im selben
  Blick sehen. Die Auswahl vertieft das Beispiel, sie schaltet es nicht frei.

  Geprüft wird deshalb der semantische Inhalt und der Zustand der Bedienung —
  nicht, welche Klassen dabei gesetzt werden.
*/
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { MobileHeroBeispiel } from '@/components/MobileHeroBeispiel';

const ANFRAGE = 'Ich möchte einen Rückruf zur Einrichtung eines Telefonassistenten.';

describe('Hero-Beispiel — Anfrage und Zusammenfassung stehen gemeinsam da', () => {
  it('zeigt Anfrage, alle drei Felder und den Beispiel-Hinweis ohne jede Interaktion', () => {
    const { container } = render(<MobileHeroBeispiel />);

    expect(container.querySelector('p')?.textContent).toBe(ANFRAGE);
    expect(screen.getByText('Beispiel')).toBeTruthy();
    expect(screen.getByText('Beispielanfrage')).toBeTruthy();

    for (const [label, wert] of [
      ['Anliegen', 'Rückruf'],
      ['Thema', 'Telefonassistent'],
      ['Nächster Schritt', 'Einrichtung besprechen'],
    ]) {
      const zeile = screen.getByRole('button', { name: new RegExp(`^${label}`) });
      expect(zeile.textContent).toBe(`${label}${wert}`);
    }

    expect(screen.getByText('So kann eine strukturierte Zusammenfassung aussehen.')).toBeTruthy();
  });

  it('nennt genau ein Feld ausgewählt und verschiebt die Auswahl beim Antippen', async () => {
    const user = userEvent.setup();
    render(<MobileHeroBeispiel />);

    const zeilen = screen.getAllByRole('button');
    const ausgewaehlte = () => zeilen.filter((b) => b.getAttribute('aria-pressed') === 'true');

    expect(ausgewaehlte()).toHaveLength(1);
    expect(ausgewaehlte()[0].textContent).toContain('Anliegen');

    await user.click(screen.getByRole('button', { name: /Thema/ }));
    expect(ausgewaehlte()).toHaveLength(1);
    expect(ausgewaehlte()[0].textContent).toContain('Thema');

    // Wiederholte Klicks dürfen weder den Zustand verdoppeln noch ihn verlieren.
    await user.click(screen.getByRole('button', { name: /Thema/ }));
    await user.click(screen.getByRole('button', { name: /Thema/ }));
    expect(ausgewaehlte()).toHaveLength(1);
  });

  it('lässt die Anfrage bei jeder Auswahl vollständig lesbar — nur die Markierung wandert', async () => {
    const user = userEvent.setup();
    const { container } = render(<MobileHeroBeispiel />);

    const satz = () => container.querySelector('p')?.textContent;
    const markiert = () =>
      [...container.querySelectorAll('mark')]
        .filter((m) => m.className.includes('bg-pub-signal-wash'))
        .map((m) => m.textContent);

    expect(satz()).toBe(ANFRAGE);
    expect(markiert()).toEqual(['einen Rückruf']);

    await user.click(screen.getByRole('button', { name: /Nächster Schritt/ }));
    expect(satz()).toBe(ANFRAGE);
    expect(markiert()).toEqual(['zur Einrichtung']);

    await user.click(screen.getByRole('button', { name: /Thema/ }));
    expect(markiert()).toEqual(['Telefonassistenten']);
  });

  it('ist mit der Tastatur bedienbar — echte Buttons, kein klickbares div', async () => {
    const user = userEvent.setup();
    render(<MobileHeroBeispiel />);

    screen.getByRole('button', { name: /Anliegen/ }).focus();
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /Thema/ }));

    await user.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: /Thema/ }).getAttribute('aria-pressed')).toBe('true');
  });

  it('behauptet nirgends einen erledigten Vorgang oder einen laufenden Anruf', () => {
    const { container } = render(<MobileHeroBeispiel />);
    const text = container.textContent ?? '';
    for (const verboten of ['Gespeichert', 'Übergeben', 'Termin gebucht', 'Live', 'Aufnahme']) {
      expect(text).not.toContain(verboten);
    }
  });
});
