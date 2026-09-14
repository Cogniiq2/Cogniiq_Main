/*
  Die Meldung eines bestätigten Leads.

  Bis zum 14.09.2026 meldete die öffentliche Seite 27 Absichtssignale — Klicks
  auf Handlungsaufforderungen und Rechnernutzung — und KEIN einziges Ergebnis.
  Das Kontaktformular navigierte nach einem gelesenen 2xx eigens mit
  `state.submitted` auf die Dankeseite, mit dem im Quelltext notierten Zweck,
  „so it can fire the conversion event without counting failures"; gelesen hat
  diesen Zustand nie jemand.

  Der erste Anlauf am selben Tag löste das Ereignis aus, riegelte aber nur mit
  einem `useRef` im Bauteil. Das war zu schwach, und zwar messbar: eine zweite
  Montage desselben History-Eintrags meldete ein zweites Mal. Der Grund ist
  strukturell — `location.state` gehört zum HISTORY-EINTRAG und bleibt dort
  liegen, ein Ref lebt nur so lange wie die Instanz. Zurück, Neuladen und jede
  Remontage legen denselben bestätigten Zustand erneut vor.

  Seitdem trägt jede bestätigte Übermittlung eine eigene Kennung (`leadId`),
  und `src/lib/leadConversion.ts` nimmt jede Kennung genau einmal an. Diese
  Datei hält fest, was daraus folgen muss:

    1. Vor der Einwilligung passiert nichts — auch kein Erfolgsereignis.
    2. Je angenommener Übermittlung GENAU EIN Ereignis.
    3. Kein Ereignis bei Fehlschlag, Direktaufruf, Reload, Remontage oder
       Zurück-Navigation auf eine bereits gemeldete Dankeseite.
    4. Eine wirklich neue Übermittlung darf wieder eines erzeugen.
    5. Keine Besucherangabe erreicht die Analyse.

  Was diese Datei NICHT zeigt: dass GA4 die Ereignisse EMPFÄNGT. Geprüft wird
  hier die Erhebung im Browser — welcher Aufruf den dataLayer erreicht. Ob die
  Property sie verbucht, ist eine Kontofrage und steht als I2/I3 in
  OWNER-INPUT.md.
*/
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AnfrageErhaltenPage } from '@/pages/AnfrageErhaltenPage';
import { KiTelefonassistentDemoPage } from '@/pages/KiTelefonassistentDemoPage';
import { CONSENT_STORAGE_KEY } from '@/lib/consent';
import { __leadSpeicherZuruecksetzen, neueLeadKennung } from '@/lib/leadConversion';

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

/** Der Zustand, den ContactSection nach einem gelesenen 2xx mitgibt. */
function bestaetigt(leadId = neueLeadKennung()) {
  return { submitted: true, leadId };
}

/** Die Dankeseite so rendern, wie ContactSection dorthin navigiert. */
function danke(state: unknown) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/anfrage-erhalten', state }]}>
      <AnfrageErhaltenPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
  __leadSpeicherZuruecksetzen();
  (window as unknown as { dataLayer?: unknown[] }).dataLayer = [];
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Einwilligung geht der Messung voraus', () => {
  it('meldet NICHTS ohne Analyse-Einwilligung und rührt den dataLayer nicht an', async () => {
    // Die Zusage „keine Google-Anfrage vor der Entscheidung" gilt auch für
    // Erfolgsmeldungen. Eine bestätigte Anfrage ist kein Sonderfall.
    danke(bestaetigt());

    await screen.findByRole('heading', { name: /Anfrage erfolgreich gesendet/ });
    expect(dataLayer()).toHaveLength(0);
  });

  it('meldet auch bei ausdrücklich abgelehnter Analyse nichts', async () => {
    localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({ analytics: 'denied', marketing: 'granted', ts: Date.now(), version: 2 }),
    );
    danke(bestaetigt());

    await screen.findByRole('heading', { name: /Anfrage erfolgreich gesendet/ });
    expect(leadMeldungen()).toHaveLength(0);
  });
});

describe('Kontaktformular — genau ein Ereignis je angenommener Übermittlung', () => {
  it('meldet den bestätigten Lead einmal', async () => {
    analyticsErlauben();
    danke(bestaetigt());

    await waitFor(() => expect(leadMeldungen()).toHaveLength(1));
    // `page_path` liest trackEvent aus `window.location`, nicht aus dem Router —
    // im Test bleibt das die jsdom-Adresse. Geprüft wird, was hier prüfbar ist:
    // dass die Meldung das Formular benennt und sonst nichts.
    expect(leadMeldungen()[0]).toMatchObject({ cta_label: 'kontakt' });
    expect(Object.keys(leadMeldungen()[0]).sort()).toEqual(['cta_label', 'page_path']);
  });

  it('meldet bei einer REMONTAGE desselben Eintrags kein zweites Mal', async () => {
    // Der Fall, an dem der erste Anlauf gescheitert ist. `location.state` gehört
    // zum History-Eintrag: er liegt bei der zweiten Montage unverändert vor,
    // während ein Ref im Bauteil mit der ersten Instanz verschwunden ist.
    analyticsErlauben();
    const zustand = bestaetigt();

    const erste = danke(zustand);
    await waitFor(() => expect(leadMeldungen()).toHaveLength(1));
    erste.unmount();

    danke(zustand);
    await screen.findByRole('heading', { name: /Anfrage erfolgreich gesendet/ });
    expect(leadMeldungen()).toHaveLength(1);
  });

  it('meldet bei ZURÜCK-Navigation auf eine bereits gemeldete Dankeseite kein zweites Mal', async () => {
    analyticsErlauben();

    // Echte Reihenfolge: Dankeseite ansehen, weiterklicken, mit der History
    // zurück. Der Eintrag der Dankeseite behält dabei seinen Zustand.
    function Weiter() {
      const nav = useNavigate();
      return (
        <button type="button" onClick={() => nav('/leistungen')}>
          weiter
        </button>
      );
    }
    function Zurueck() {
      const nav = useNavigate();
      return (
        <button type="button" onClick={() => nav(-1)}>
          zurück
        </button>
      );
    }

    render(
      <MemoryRouter initialEntries={[{ pathname: '/anfrage-erhalten', state: bestaetigt() }]}>
        <Routes>
          <Route
            path="/anfrage-erhalten"
            element={
              <>
                <AnfrageErhaltenPage />
                <Weiter />
              </>
            }
          />
          <Route path="/leistungen" element={<Zurueck />} />
        </Routes>
      </MemoryRouter>,
    );

    // Erste Ansicht: gemeldet.
    await waitFor(() => expect(leadMeldungen()).toHaveLength(1));

    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'weiter' }));
    await screen.findByRole('button', { name: 'zurück' });

    // Mit der History zurück — derselbe Eintrag, derselbe bestätigte Zustand,
    // eine frische Montage der Dankeseite.
    await user.click(screen.getByRole('button', { name: 'zurück' }));
    await screen.findByRole('heading', { name: /Anfrage erfolgreich gesendet/ });
    expect(leadMeldungen()).toHaveLength(1);
  });

  it('meldet eine WIRKLICH NEUE Übermittlung wieder', async () => {
    // Die Gegenprobe zu den drei Fällen darüber: der Riegel darf nicht so fest
    // sein, dass er echte Anfragen verschluckt. Zweite Übermittlung, zweite
    // Kennung, zweites Ereignis.
    analyticsErlauben();

    const erste = danke(bestaetigt());
    await waitFor(() => expect(leadMeldungen()).toHaveLength(1));
    erste.unmount();

    danke(bestaetigt());
    await waitFor(() => expect(leadMeldungen()).toHaveLength(2));
  });
});

describe('Kontaktformular — was kein bestätigter Lead ist', () => {
  it('meldet NICHTS bei einem Direktaufruf ohne Navigationszustand', async () => {
    // Die Seite ist indexierbar: Suchtreffer, Lesezeichen und Crawler erreichen
    // sie ohne `state`. Keiner davon ist eine Anfrage.
    analyticsErlauben();
    danke(null);

    await screen.findByRole('heading', { name: /Anfrage erfolgreich gesendet/ });
    expect(leadMeldungen()).toHaveLength(0);
  });

  it('meldet NICHTS, wenn der Zustand den Versand nicht bestätigt', async () => {
    analyticsErlauben();
    danke({ submitted: false, leadId: neueLeadKennung() });

    await screen.findByRole('heading', { name: /Anfrage erfolgreich gesendet/ });
    expect(leadMeldungen()).toHaveLength(0);
  });

  it('meldet NICHTS bei bestätigtem Versand ohne Kennung', async () => {
    // Ohne Kennung liesse sich diese Übermittlung von ihrer eigenen Wiederholung
    // nicht unterscheiden. Dann lieber nicht melden als doppelt melden.
    analyticsErlauben();
    danke({ submitted: true });

    await screen.findByRole('heading', { name: /Anfrage erfolgreich gesendet/ });
    expect(leadMeldungen()).toHaveLength(0);
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

  it('meldet NICHTS ohne Analyse-Einwilligung, auch bei 2xx', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }));

    zeigen();
    await ausfuellenUndSenden();

    await screen.findByText(/Demo-Anfrage eingegangen/);
    expect(dataLayer()).toHaveLength(0);
  });
});

describe('Keine Besucherangabe verlässt den Browser', () => {
  it('trägt weder Eingaben noch die interne Kennung in die Analyse', async () => {
    analyticsErlauben();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }));

    render(
      <MemoryRouter>
        <KiTelefonassistentDemoPage />
      </MemoryRouter>,
    );
    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText('Max Mustermann'), 'Erika Muster');
    await user.type(screen.getByPlaceholderText('max@firma.de'), 'erika@muster.de');
    await user.type(screen.getByPlaceholderText('Muster GmbH'), 'Muster GmbH');
    await user.click(screen.getByRole('button', { name: /Demo-Termin anfragen/ }));

    await waitFor(() => expect(leadMeldungen()).toHaveLength(1));

    // Der GESAMTE dataLayer, nicht nur die Lead-Meldung: eine Angabe darf auch
    // nicht über einen anderen Aufruf hinausgehen.
    const roh = JSON.stringify(dataLayer());
    for (const angabe of ['Erika Muster', 'erika@muster.de', 'Muster GmbH']) {
      expect(roh).not.toContain(angabe);
    }
  });

  it('gibt die Lead-Kennung nicht an die Analyse weiter', async () => {
    // Die Kennung ordnet eine Übermittlung ihrer eigenen Wiederholung zu und
    // sonst nichts. Sie darf GA4 nie erreichen, sonst wäre sie ein
    // Wiedererkennungsmerkmal.
    analyticsErlauben();
    const zustand = bestaetigt();
    danke(zustand);

    await waitFor(() => expect(leadMeldungen()).toHaveLength(1));
    expect(JSON.stringify(dataLayer())).not.toContain(zustand.leadId);
  });
});
