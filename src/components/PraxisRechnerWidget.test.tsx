import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { PraxisRechnerWidget } from '@/components/PraxisRechnerWidget';

// Der Automatisierungsgrad ist der Vorgabewert, den jeder Besucher der
// Preisseite als Erstes sieht. Er ist damit die sichtbarste Produktaussage des
// Rechners — dieser Test hält ihn fest, damit er nicht unbemerkt verrutscht,
// und prüft, dass er einstellbar bleibt.
//
// Reine vitest-Zusicherungen; dieses Repository registriert keine
// jest-dom-Matcher global.

function regler(): HTMLInputElement {
  return screen.getByLabelText(/Automatisierungsgrad/) as HTMLInputElement;
}

describe('Praxis-Rechner — Automatisierungsgrad', () => {
  // Vorgabewert am 23.08.2026 von 90 % auf 20 % gesenkt. 90 % war eine Aussage
  // über das eigene Produkt ohne Beleg: OWNER-INPUT F4 (gemessene Übernahmequote)
  // ist unbeantwortet, COPY-BRIEF §5.7 deckelt die einzige dokumentierte, vom
  // Käufer selbst gerechnete Spanne bei 10–20 % netto, und §2.4 verbietet die
  // Zusage, der Assistent übernehme „die Mehrheit" der Anrufe.
  //
  // 20 % ist die Obergrenze der belegten Spanne. Dieser Test hält den Wert fest,
  // damit er nicht unbemerkt zurückwandert — erhöht werden darf er erst, wenn F4
  // mit einer gemessenen Zahl beantwortet ist.
  it('steht beim Öffnen auf 20 % — der belegten Obergrenze', () => {
    render(<PraxisRechnerWidget />);
    expect(regler().value).toBe('20');
  });

  it('ist vom Besucher über die ganze Spanne einstellbar', () => {
    render(<PraxisRechnerWidget />);
    const schieber = regler();

    expect(schieber.min).toBe('10');
    expect(schieber.max).toBe('100');

    // jsdom setzt Pfeiltasten auf input[type=range] nicht um — der Regler wird
    // deshalb über das Change-Ereignis verstellt, das der Browser dabei sendet.
    fireEvent.change(schieber, { target: { value: '55' } });
    expect(regler().value).toBe('55');
  });

  it('rechnet mit dem eingestellten Grad, nicht mit einem festen Wert', () => {
    render(<PraxisRechnerWidget />);
    const vorher = screen.getByText(/Stunden$/).textContent;

    fireEvent.change(regler(), { target: { value: '45' } });

    expect(regler().value).toBe('45');
    expect(screen.getByText(/Stunden$/).textContent).not.toBe(vorher);
  });
});
