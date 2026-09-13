/*
  Was diese Datei schützt.

  Die Startseite trug den vollständigen Wirtschaftlichkeitsrechner (fünf
  Pflichtangaben, Personalszenarien, Trichterfelder) und ein achtteiliges
  Beispielprotokoll zwischen Produkt und Abschluss. Beides ist wertvoll und
  beides bleibt erreichbar — aber nicht als Pflichtlektüre auf dem Weg zur
  Anfrage.

  Geprüft wird deshalb, dass die Verdichtung eine DARSTELLUNGSfrage bleibt:
  dieselbe Rechnung, dieselben Belege, nur ein anderer Einstieg. Die
  Preisinvarianten („offen" bleibt offen) gelten in beiden Fassungen.
*/
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { SolutionShowcase } from '@/components/SolutionShowcase';
import { TelefonRechner } from '@/components/TelefonRechner';

const ROI_UEBERSCHRIFT = 'Und was bringt es Ihnen?';

function rechner(variante: 'voll' | 'kompakt') {
  return render(
    <MemoryRouter>
      <TelefonRechner variante={variante} />
    </MemoryRouter>,
  );
}

describe('Rechner — kompakt zeigt den Preis, voll zeigt alles', () => {
  it('rechnet in beiden Fassungen denselben Tarif und denselben Monatsbetrag aus denselben Startwerten', () => {
    const { unmount } = rechner('voll');
    const tarifVoll = screen.getByText('Passender Tarif').closest('div')?.parentElement?.textContent ?? '';
    const betragVoll = screen.getAllByText(/339,00/)[0]?.textContent;
    unmount();

    rechner('kompakt');
    const tarifKompakt = screen.getByText('Passender Tarif').closest('div')?.parentElement?.textContent ?? '';
    const betragKompakt = screen.getAllByText(/339,00/)[0]?.textContent;

    expect(tarifKompakt).toContain('Basis');
    expect(tarifVoll).toContain('Basis');
    expect(betragKompakt).toBe(betragVoll);
  });

  it('lässt den mehrschrittigen Wirtschaftlichkeitsteil nur in der vollen Fassung stehen', () => {
    const { unmount } = rechner('voll');
    expect(screen.getByText(ROI_UEBERSCHRIFT)).toBeTruthy();
    unmount();

    rechner('kompakt');
    expect(screen.queryByText(ROI_UEBERSCHRIFT)).toBeNull();
  });

  it('führt aus der kompakten Fassung auf den vollständigen Rechner, nicht auf ein Formular', () => {
    rechner('kompakt');
    const weg = screen.getByRole('link', { name: /Wirtschaftlichkeit berechnen/ });
    expect(weg.getAttribute('href')).toContain('#preis-roi-rechner');
  });

  it('hält die unbekannte Anbindung in BEIDEN Fassungen offen — nie null, nie stillschweigend weggelassen', () => {
    for (const variante of ['voll', 'kompakt'] as const) {
      const { unmount } = rechner(variante);
      const zeile = screen.getByText('Anbindung an Ihr System').closest('div')?.parentElement;
      expect(within(zeile as HTMLElement).getByText('noch offen')).toBeTruthy();
      unmount();
    }
  });

  it('nennt die Vertragsbedingungen am Ergebnis, auch kompakt', () => {
    rechner('kompakt');
    expect(screen.getByText(/Die Laufzeit beträgt/)).toBeTruthy();
    expect(screen.getByText(/schriftlich garantiert/)).toBeTruthy();
  });

  it('zeigt die einmalige Einrichtung kompakt genau einmal — nicht als Zahl und Zeile doppelt', () => {
    rechner('kompakt');
    expect(screen.getAllByText(/1\.490/)).toHaveLength(1);
  });
});

describe('Beispiel — Ausschnitt zuerst, vollständiges Protokoll auf Wunsch', () => {
  const zeigen = () => render(<MemoryRouter><SolutionShowcase /></MemoryRouter>);

  it('zeigt einen benannten Ausschnitt statt des ganzen Protokolls', () => {
    zeigen();
    expect(screen.getByText(/Ausschnitt — 4 von 8 Nachrichten/)).toBeTruthy();
    expect(screen.queryByText(/Ihr Terminwunsch geht mit Ihrer Rückrufnummer an die Anmeldung/)).toBeNull();
  });

  it('hält den Beispiel-Hinweis neben dem Beispiel sichtbar', () => {
    zeigen();
    expect(screen.getByText(/Nachgestelltes Beispiel – kein echter Anruf/)).toBeTruthy();
  });

  it('klappt das vollständige Gespräch auf und wieder zu', async () => {
    const user = userEvent.setup();
    zeigen();
    await user.click(screen.getByRole('button', { name: /Vollständiges Beispielgespräch ansehen/ }));
    expect(screen.getByText(/Ihr Terminwunsch geht mit Ihrer Rückrufnummer an die Anmeldung/)).toBeTruthy();
    await user.click(screen.getByRole('button', { name: /Ausschnitt zeigen/ }));
    expect(screen.queryByText(/Ihr Terminwunsch geht mit Ihrer Rückrufnummer an die Anmeldung/)).toBeNull();
  });

  it('wechselt die Branche und beginnt dort wieder mit dem Ausschnitt', async () => {
    const user = userEvent.setup();
    zeigen();
    await user.click(screen.getByRole('button', { name: /Vollständiges Beispielgespräch ansehen/ }));
    await user.click(screen.getByRole('tab', { name: /Restaurant/ }));
    expect(screen.getByRole('tab', { name: /Restaurant/ }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByText(/Ausschnitt — 4 von 8 Nachrichten/)).toBeTruthy();
  });

  it('nennt das Ergebnis einen Wunsch, keine Buchung', () => {
    zeigen();
    expect(screen.getByText('Terminwunsch')).toBeTruthy();
    expect(screen.getByText(/Notiert wird ein Wunsch, keine Buchung/)).toBeTruthy();
  });
});
