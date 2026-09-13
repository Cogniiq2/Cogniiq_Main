/*
  Der Versandzustand des Demo-Formulars.

  Bis zum 13.09.2026 setzte dieses Formular den Erfolgszustand im `catch` —
  jede Netzwerkstörung, jede CORS-Zurückweisung und jeder Serverfehler zeigte
  „Demo-Anfrage eingegangen" und leitete weiter. Ein Interessent, dessen
  Anfrage nie ankam, wartete danach auf einen Rückruf, den niemand ausgelöst
  hatte.

  Erfolg gilt jetzt ausschließlich bei einer LESBAREN 2xx-Antwort des
  Endpunkts. Alles andere behält das Formular samt Eingaben, sagt, dass der
  Eingang NICHT bestätigt werden konnte, und nennt Telefon und E-Mail. Dass
  wir mehr als den Empfang am Webhook nicht wissen können, steht im Bericht,
  nicht in einer Behauptung auf der Seite.
*/
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { KiTelefonassistentDemoPage } from '@/pages/KiTelefonassistentDemoPage';

function zeigen() {
  return render(
    <MemoryRouter>
      <KiTelefonassistentDemoPage />
    </MemoryRouter>,
  );
}

async function ausfuellenUndSenden(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText('Max Mustermann'), 'Erika Muster');
  await user.type(screen.getByPlaceholderText('max@firma.de'), 'erika@muster.de');
  await user.type(screen.getByPlaceholderText('Muster GmbH'), 'Muster GmbH');
  await user.click(screen.getByRole('button', { name: /Demo-Termin anfragen/ }));
}

const ERFOLG = /Demo-Anfrage eingegangen/;
const UNBESTAETIGT = /konnten den Eingang Ihrer Anfrage nicht bestätigen/;

describe('Demo-Formular — Erfolg nur bei bestätigtem Eingang', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('meldet Erfolg, wenn der Endpunkt lesbar mit 2xx antwortet', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, status: 200 });
    const user = userEvent.setup();
    zeigen();
    await ausfuellenUndSenden(user);
    expect(await screen.findByText(ERFOLG)).toBeTruthy();
  });

  it('meldet KEINEN Erfolg bei einem Netzwerk- oder CORS-Fehler und behält die Eingaben', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new TypeError('Failed to fetch'));
    const user = userEvent.setup();
    zeigen();
    await ausfuellenUndSenden(user);

    expect(await screen.findByRole('alert')).toHaveTextContent(UNBESTAETIGT);
    expect(screen.queryByText(ERFOLG)).toBeNull();
    expect((screen.getByPlaceholderText('Max Mustermann') as HTMLInputElement).value).toBe('Erika Muster');
    expect((screen.getByPlaceholderText('max@firma.de') as HTMLInputElement).value).toBe('erika@muster.de');
  });

  it('meldet KEINEN Erfolg bei einer Fehlerantwort des Servers', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false, status: 500 });
    const user = userEvent.setup();
    zeigen();
    await ausfuellenUndSenden(user);

    expect(await screen.findByRole('alert')).toHaveTextContent(UNBESTAETIGT);
    expect(screen.queryByText(ERFOLG)).toBeNull();
  });

  it('nennt im Fehlerfall einen Weg, der ohne dieses Formular funktioniert', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false, status: 502 });
    const user = userEvent.setup();
    zeigen();
    await ausfuellenUndSenden(user);

    const meldung = await screen.findByRole('alert');
    expect(meldung.querySelector('a[href^="tel:"]')).toBeTruthy();
    expect(meldung.querySelector('a[href^="mailto:"]')).toBeTruthy();
  });

  it('sendet einen Klick nicht zweimal, solange die erste Anfrage läuft', async () => {
    let aufloesen: (v: unknown) => void = () => {};
    (fetch as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise((res) => { aufloesen = res; }),
    );
    const user = userEvent.setup();
    zeigen();
    await ausfuellenUndSenden(user);

    const knopf = screen.getByRole('button', { name: /Wird gesendet/ });
    expect(knopf.getAttribute('aria-busy')).toBe('true');
    await user.click(knopf).catch(() => {});
    expect((fetch as unknown as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(1);
    aufloesen({ ok: true, status: 200 });
  });

  it('verspricht im Titel keine sofort abspielbare Demo', () => {
    zeigen();
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Demo-Termin anfragen');
  });
});
