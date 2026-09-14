/*
  Die Meldung eines bestätigten Leads.

  Bis zum 14.09.2026 meldete die öffentliche Seite 27 Absichtssignale — Klicks
  auf Handlungsaufforderungen und Rechnernutzung — und KEIN einziges Ergebnis.
  Das Kontaktformular navigierte nach einem gelesenen 2xx eigens mit
  `state.submitted` auf die Dankeseite, mit dem im Quelltext notierten Zweck,
  „so it can fire the conversion event without counting failures"; gelesen hat
  diesen Zustand nie jemand. Das Geschäftsziel dieser Website — qualifizierte
  Anfragen — war damit in GA4 nicht zählbar.

  Diese Datei hält die drei Eigenschaften fest, an denen die Kennzahl steht
  oder fällt:

    1. Gemeldet wird der BESTÄTIGTE Eingang, nicht der Klick. Ein 5xx, ein
       Netzfehler oder ein Werbeblocker darf keinen Lead erzeugen.
    2. Ein Direktaufruf der Dankeseite — aus der Suche, aus einem Lesezeichen,
       per Reload oder durch einen Crawler — erzeugt keinen Lead. Geprüft wird
       der Navigationszustand, nicht der Pfad.
    3. Es verlässt keine Besucherangabe den Browser. Gemeldet wird, WELCHES
       Formular abgeschickt wurde, nicht von wem.
*/
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AnfrageErhaltenPage } from '@/pages/AnfrageErhaltenPage';
import { KiTelefonassistentDemoPage } from '@/pages/KiTelefonassistentDemoPage';
import { CONSENT_STORAGE_KEY } from '@/lib/consent';

type GtagCall = unknown[];

function dataLayer(): GtagCall[] {
  const w = window as unknown as { dataLayer?: GtagCall[] };
  return (w.dataLayer ?? []).map((c) => Array.from(c as ArrayLike<unknown>));
}

/** Jede `gtag('event', 'lead_submitted', …)`-Meldung im dataLayer. */
function leadMeldungen(): Record<string, unknown>[] {
  return dataLayer()
    .filter((c) => c[0] === 'event' && c[1] === 'lead_submitted')
    .map((c) => (c[2] ?? {}) as Record<string, unknown>);
}

function analyticsErlauben() {
  localStorage.setItem(
    CONSENT_STORAGE_KEY,
    JSON.stringify({ analytics: 'granted', marketing: 'denied', ts: Date.now(), version: 2 }),
  );
}

/** Die Dankeseite so rendern, wie ContactSection nach einem 2xx dorthin navigiert. */
function danke(state: unknown) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/anfrage-erhalten', state }]}>
      <AnfrageErhaltenPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
  (window as unknown as { dataLayer?: unknown[] }).dataLayer = [];
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Kontaktformular — ein Lead gilt erst als bestätigt', () => {
  it('meldet den Lead, wenn die Dankeseite mit bestätigtem Versand erreicht wird', async () => {
    analyticsErlauben();
    danke({ submitted: true });

    await waitFor(() => expect(leadMeldungen()).toHaveLength(1));
    // `page_path` liest trackEvent aus `window.location`, nicht aus dem
    // Router — im Test bleibt das die jsdom-Adresse. Geprüft wird hier, was
    // diese Datei prüfen kann: dass die Meldung das Formular benennt.
    expect(leadMeldungen()[0]).toMatchObject({ cta_label: 'kontakt' });
  });

  it('meldet NICHTS bei einem Direktaufruf ohne Navigationszustand', async () => {
    analyticsErlauben();
    danke(null);

    // Die Seite ist indexierbar: Suchtreffer, Lesezeichen, Reload und Crawler
    // erreichen sie ohne `state`. Keiner davon ist eine Anfrage.
    await screen.findByRole('heading', { name: /Anfrage erfolgreich gesendet/ });
    expect(leadMeldungen()).toHaveLength(0);
  });

  it('meldet NICHTS, wenn der Zustand den Versand nicht bestätigt', async () => {
    analyticsErlauben();
    danke({ submitted: false });

    await screen.findByRole('heading', { name: /Anfrage erfolgreich gesendet/ });
    expect(leadMeldungen()).toHaveLength(0);
  });

  it('meldet NICHTS ohne Analyse-Einwilligung und rührt den dataLayer nicht an', async () => {
    // Keine Einwilligung hinterlegt: trackEvent verwirft die Meldung, bevor
    // irgendetwas geschoben wird. Die Zusage „keine Google-Anfrage vor der
    // Entscheidung" gilt auch für Erfolgsmeldungen.
    danke({ submitted: true });

    await screen.findByRole('heading', { name: /Anfrage erfolgreich gesendet/ });
    expect(dataLayer()).toHaveLength(0);
  });
});

describe('Demo-Formular — die Meldung hängt an der Serverantwort, nicht am Klick', () => {
  async function ausfuellenUndSenden() {
    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText('Max Mustermann'), 'Erika Muster');
    await user.type(screen.getByPlaceholderText('max@firma.de'), 'erika@muster.de');
    await user.type(screen.getByPlaceholderText('Muster GmbH'), 'Muster GmbH');
    await user.click(screen.getByRole('button', { name: /Demo-Termin anfragen/ }));
  }

  function zeigen() {
    return render(
      <MemoryRouter>
        <KiTelefonassistentDemoPage />
      </MemoryRouter>,
    );
  }

  it('meldet den Lead nach einer lesbaren 2xx-Antwort', async () => {
    analyticsErlauben();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }));

    zeigen();
    await ausfuellenUndSenden();

    await waitFor(() => expect(leadMeldungen()).toHaveLength(1));
    expect(leadMeldungen()[0]).toMatchObject({ cta_label: 'demo' });
  });

  it('meldet NICHTS bei einer Fehlerantwort des Servers', async () => {
    analyticsErlauben();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 502 }));

    zeigen();
    await ausfuellenUndSenden();

    await screen.findByText(/konnten den Eingang Ihrer Anfrage nicht bestätigen/);
    expect(leadMeldungen()).toHaveLength(0);
  });

  it('meldet NICHTS bei einem Netzwerk- oder CORS-Fehler', async () => {
    analyticsErlauben();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    zeigen();
    await ausfuellenUndSenden();

    await screen.findByText(/konnten den Eingang Ihrer Anfrage nicht bestätigen/);
    expect(leadMeldungen()).toHaveLength(0);
  });

  it('trägt keine Angabe des Besuchers in die Meldung', async () => {
    analyticsErlauben();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }));

    zeigen();
    await ausfuellenUndSenden();

    await waitFor(() => expect(leadMeldungen()).toHaveLength(1));

    // Der gesamte dataLayer, nicht nur die Lead-Meldung: eine Angabe darf auch
    // nicht über einen anderen Aufruf hinausgehen.
    const roh = JSON.stringify(dataLayer());
    for (const angabe of ['Erika Muster', 'erika@muster.de', 'Muster GmbH']) {
      expect(roh).not.toContain(angabe);
    }
  });
});
