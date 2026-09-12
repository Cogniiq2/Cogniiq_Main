// ─────────────────────────────────────────────────────────────────────────────
// DER RECHNER AUF DEM FLAGGSCHIFF MUSS AUFFINDBAR SEIN.
//
// Am 12.09.2026 hat der Inhaber die Vorschau geprüft und den Rechner auf
// /ki-telefonassistent NICHT GEFUNDEN. Technisch war alles in Ordnung: Der
// Abschnitt war montiert, der Anker eindeutig, der Chunk emittiert und der
// Rechner sogar servergerendert. Er lag nur als 14. von 23 Abschnitten hinter
// Sprachen und Anbieter-Check — nach knapp 60 % des Seitentexts.
//
// Ein Bauteil, das existiert und nicht gefunden wird, ist für die Konversion
// dasselbe wie ein Bauteil, das fehlt. Diese Suite prüft deshalb nicht, DASS es
// existiert, sondern dass ein Besucher es früh antrifft: ein sichtbarer Weg aus
// dem Hero, ein eindeutiger Anker, und ein Abschnitt vor den langen
// Kaufkriterien.
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(async () => ({ data: { session: null }, error: null })),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      updateUser: vi.fn(async () => ({ error: null })),
      signOut: vi.fn(async () => ({ error: null })),
    },
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }),
    }),
  },
}));

const { render } = await import('@/entry-server');
const { RECHNER_ANKER } = await import('@/lib/rechner-anker');

const { html } = await render('/ki-telefonassistent', 30_000);
const doc = new DOMParser().parseFromString(html, 'text/html');
const main = doc.querySelector('main')!;
const h2 = [...main.querySelectorAll('h2')].map((e) =>
  (e.textContent ?? '').replace(/\s+/g, ' ').trim()
);

describe('Flaggschiff — der Rechner ist auffindbar', () => {
  it('trägt den Anker genau einmal', () => {
    // Zweimal wäre ungültiges HTML und ein Sprung ins Ungewisse.
    const treffer = main.querySelectorAll(`#${RECHNER_ANKER}`);
    expect(treffer).toHaveLength(1);
    expect(doc.querySelectorAll(`#${RECHNER_ANKER}`)).toHaveLength(1);
  });

  it('hält am Anker einen Abschnitt mit sichtbarer Überschrift', () => {
    const section = main.querySelector(`#${RECHNER_ANKER}`)!;
    expect(section.tagName.toLowerCase()).toBe('section');
    // Der Sprung darf nicht unter der klebenden Navigation landen.
    expect(section.getAttribute('class') ?? '').toMatch(/scroll-mt-/);
    const heading = section.querySelector('h2');
    expect(heading?.textContent ?? '').toMatch(/Was das bei Ihrem Anrufaufkommen kostet/);
    // Und der Abschnitt ist nicht versteckt.
    expect(section.hasAttribute('hidden')).toBe(false);
    expect(section.getAttribute('class') ?? '').not.toMatch(/\bhidden\b/);
  });

  it('führt aus dem Hero sichtbar auf den Rechner', () => {
    const cta = [...main.querySelectorAll(`a[href="#${RECHNER_ANKER}"]`)];
    expect(cta.length).toBeGreaterThanOrEqual(1);
    const ersteCta = cta[0];
    expect(ersteCta.textContent ?? '').toMatch(/Preis & Wirtschaftlichkeit berechnen/);
    /*
      Der Weg muss als Bedienelement erkennbar sein. Vorher war es eine
      Unterstreichung in einem Absatz voller Links — die Rangfolge war richtig,
      die Sichtbarkeit zu gering. Eine Kontur genügt und konkurriert nicht mit
      dem gefüllten Demo-CTA.
    */
    const klassen = ersteCta.getAttribute('class') ?? '';
    expect(klassen).toMatch(/border/);
    expect(klassen).toMatch(/rounded/);
    expect(klassen).toMatch(/px-\d/);
  });

  it('lässt den primären Demo-CTA primär bleiben', () => {
    const demo = main.querySelector('a[href="/ki-telefonassistent/demo"]');
    expect(demo?.textContent ?? '').toMatch(/Demo-Termin anfragen/);
    // Primär = gefüllt, sekundär = Kontur. Der sekundäre Weg darf die
    // Vollfläche des primären nicht nachbauen.
    const sekundaer = main.querySelector(`a[href="#${RECHNER_ANKER}"]`)!;
    /*
      Geprüft wird die GRUNDFLÄCHE, nicht jede Variante: `dark:hover:bg-gray-900/40`
      ist ein Hover-Zustand und macht aus einer Kontur keine Vollfläche. Ohne
      diese Grenze schlägt die Prüfung am eigenen Hover-Stil fehl.
    */
    const grundflaeche = (klasse: string) =>
      klasse.split(/\s+/).some((k) => /^bg-gray-900(\/\d+)?$/.test(k));
    expect(grundflaeche(demo?.getAttribute('class') ?? '')).toBe(true);
    expect(grundflaeche(sekundaer.getAttribute('class') ?? '')).toBe(false);
  });

  it('nennt die Bedingungen des Rechnerwegs ohne Übertreibung', () => {
    const text = (main.textContent ?? '').replace(/\s+/g, ' ');
    expect(text).toContain('Sofort · ohne E-Mail · mit Ihren eigenen Zahlen');
    // Kein künstlicher Druck, kein Gate.
    expect(text).not.toMatch(/nur heute|jetzt sichern|begrenzte Plätze/i);
  });
});

describe('Flaggschiff — der Rechner steht nicht mehr hinten', () => {
  it('steht vor Sprachen, Kaufkriterien, Einrichtung und FAQ', () => {
    const i = h2.findIndex((t) => /Was das bei Ihrem Anrufaufkommen kostet/.test(t));
    expect(i).toBeGreaterThan(-1);
    for (const spaeter of [/Sprache/i, /Anbieter/i, /Einrichtung/i, /Fragen/i]) {
      const j = h2.findIndex((t) => spaeter.test(t));
      if (j === -1) continue;
      expect(j, `„${h2[j]}" muss hinter dem Rechner stehen`).toBeGreaterThan(i);
    }
  });

  it('steht in der ersten Hälfte der Gliederung', () => {
    const i = h2.findIndex((t) => /Was das bei Ihrem Anrufaufkommen kostet/.test(t));
    expect(i / h2.length).toBeLessThan(0.5);
  });

  it('steht aber nicht vor der Produkterklärung', () => {
    // Wer nicht weiss, was das System leistet, kann mit einem Preis nichts
    // anfangen. Der Anliegen-Katalog und die Grenzen bleiben davor.
    const i = h2.findIndex((t) => /Was das bei Ihrem Anrufaufkommen kostet/.test(t));
    expect(i).toBeGreaterThan(1);
  });
});

describe('Flaggschiff und Preisseite rechnen mit demselben Kern', () => {
  it('beide Seiten rendern den Rechner servergerendert, nicht nur als Platzhalter', async () => {
    const kosten = await render('/kosten-ki-telefonassistent', 30_000);
    for (const [label, markup] of [
      ['/ki-telefonassistent', html],
      ['/kosten-ki-telefonassistent', kosten.html],
    ] as const) {
      const t = new DOMParser().parseFromString(markup, 'text/html').querySelector('main')!
        .textContent!.replace(/\s+/g, ' ');
      // Ausgaben des kanonischen Kerns, nicht der Suspense-Platzhalter.
      expect(t, `${label}: Tarifausgabe fehlt`).toContain('Passender Tarif');
      expect(t, `${label}: Minutenausgabe fehlt`).toContain('Gesprächsminuten pro Monat');
      expect(t, `${label}: Unvollständigkeitszustand fehlt`).toContain(
        'Wirtschaftlichkeit noch nicht vollständig berechnet'
      );
      expect(t, `${label}: zeigt einen Platzhalter statt des Rechners`).not.toContain(
        'Rechner wird geladen'
      );
      // Genau eine Instanz je Seite.
      expect((t.match(/Passender Tarif/g) ?? []).length, `${label}: doppelter Rechner`).toBe(1);
    }
  }, 60_000);
});

describe('Der Sprung auf den Rechner wird nach der Hydration gehalten', () => {
  /*
    WAS HIER GEPRÜFT WIRD UND WAS NICHT.

    Das eigentliche Verhalten ist Layout: ein Fragment-Sprung, der verfällt,
    weil die lazy geladene Route den Baum kurzzeitig durch den
    Suspense-Platzhalter ersetzt und die Dokumenthöhe zusammenbricht. jsdom hat
    kein Layout — `getBoundingClientRect()` liefert dort Nullen —, also lässt
    sich das hier nicht messen. Verifiziert wurde es am 12.09.2026 in Chromium
    gegen den echten Build:

      /ki-telefonassistent#preis-roi-rechner   1280 px: scrollY 10406, Überschrift bei 216 px
                                                390 px: scrollY 20022, Überschrift bei 216 px
      Verweis von /integrationen und /          beide Breiten: Überschrift im Sichtfeld

    Vor der Korrektur: scrollY 0 bei 390 px und 583 bei 1280 px — der Besucher
    landete oben und sah den Rechner nie.

    Dieser Test hält deshalb nur das fest, was ohne Layout prüfbar ist und beim
    Aufräumen sonst still verschwindet: dass der Manager existiert und im Baum
    montiert ist. Fällt er heraus, sind alle Verweise auf `RECHNER_LINK` wieder
    wirkungslos, ohne dass eine andere Prüfung rot wird.
  */
  const app = readFileSync(join(process.cwd(), 'src/App.tsx'), 'utf8');

  it('montiert den HashScrollManager im gemeinsamen Baum', () => {
    expect(app).toMatch(/function HashScrollManager\(/);
    expect(app).toMatch(/<HashScrollManager \/>/);
  });

  it('hält die Position nach, statt einmal zu springen', () => {
    // Ein einmaliger Sprung war der erste, gescheiterte Versuch. Die
    // Nachhaltung ist der Kern der Korrektur.
    expect(app).toMatch(/requestAnimationFrame\(versuchen\)/);
    expect(app).toMatch(/scrollMarginTop/);
    expect(app).toMatch(/scrollIntoView/);
  });

  it('bricht ab, sobald der Besucher selbst scrollt', () => {
    for (const ereignis of ['wheel', 'touchstart', 'keydown']) {
      expect(app, `${ereignis} bricht den Sprung nicht ab`).toContain(`'${ereignis}', abbrechen`);
    }
  });
});
