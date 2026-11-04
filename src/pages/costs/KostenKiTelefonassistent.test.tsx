// ─────────────────────────────────────────────────────────────────────────────
// DIE PREISSEITE NACH DEM EXPERIMENT.
//
// /kosten-ki-telefonassistent war bis zum 12.09.2026 ein eingefrorenes
// SEO-Experiment. Der Freeze hielt einen überholten Stand fest: den
// Alt-Rechner mit voreingestelltem „Automatisierungsgrad" von 20 %, ein
// ROI-Modell, das aus unvollständigen Angaben ein negatives Ergebnis zeigen
// konnte, und die Produktaussage „nimmt auf und gibt strukturiert weiter".
//
// Diese Suite ist die Gegenwache zur Fingerabdruck-Wache, die hier weggefallen
// ist: Sie prüft nicht mehr, dass die Seite UNVERÄNDERT bleibt, sondern dass
// die zurückgenommenen Fehler nicht zurückkommen. Gerendert wird über den
// echten SSR-Eingang, damit geprüft wird, was ein Besucher wirklich bekommt.
// ─────────────────────────────────────────────────────────────────────────────
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
const { PROTECTED_EXPERIMENT_PATHS, GRADUATED_EXPERIMENT_PATHS } = await import(
  '@/lib/routing/protectedExperiments'
);
const { EINRICHTUNG, SPRACHEN, SPRACHEN_PREISE, TARIFE, FAKTEN } = await import('@/lib/telefonassistent-copy');

const PFAD = '/kosten-ki-telefonassistent';

const { html } = await render(PFAD, 30_000);
const doc = new DOMParser().parseFromString(html, 'text/html');
const main = doc.querySelector('main')!;
const text = (main.textContent ?? '').replace(/\s+/g, ' ');

describe('Preisseite — das Experiment ist beendet', () => {
  it('ist nicht mehr eingefroren, aber formell graduiert', () => {
    expect(PROTECTED_EXPERIMENT_PATHS).not.toContain(PFAD);
    expect(GRADUATED_EXPERIMENT_PATHS).toContain(PFAD);
  });

  it('besitzt weiter die Preisintention in Title, H1 und Canonical', () => {
    // Ende des Freezes heisst NICHT Umwidmung: Die Seite bleibt die Antwort auf
    // „was kostet ein KI Telefonassistent" und tritt nicht gegen das
    // Flaggschiff /ki-telefonassistent an.
    const h1 = [...main.querySelectorAll('h1')].map((e) => e.textContent?.trim());
    expect(h1).toHaveLength(1);
    expect(h1[0]).toBe('Was kostet ein KI Telefonassistent?');
    expect(doc.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? html).toContain(
      PFAD
    );
    expect(h1[0]).not.toBe('KI Telefonassistent');
  });
});

describe('Preisseite — ein Rechner, der kanonische', () => {
  it('rendert den kanonischen Rechner und genau einmal', () => {
    // Der Tarifblock des kanonischen Rechners. Zweimal hiesse: zwei Instanzen.
    expect(text.match(/Günstigster Tarif bei diesem Aufkommen/g) ?? []).toHaveLength(1);
    expect(text).toContain('Abrechenbare Minuten pro Monat');
  });

  it('zeigt den Rechner früh — vor Einrichtung, Vertrag und FAQ', () => {
    /*
      Gemessen wird der ANFANG des Abschnitts (seine Überschrift), nicht ein
      Label aus dem Inneren des Rechners: Der Rechner ist selbst lang, und
      „Passender Tarif" liegt schon mitten in seiner Ausgabe. Wo der Besucher
      ihn ANTRIFFT, ist die Überschrift.
    */
    const rechner = text.indexOf('Was kostet das bei Ihrem Anrufaufkommen?');
    const einrichtung = text.indexOf('Wofür zahlen Sie die Einrichtung?');
    const faq = text.indexOf('Häufige Fragen zum Preis');
    expect(rechner).toBeGreaterThan(-1);
    expect(einrichtung).toBeGreaterThan(-1);
    expect(faq).toBeGreaterThan(-1);
    expect(rechner).toBeLessThan(einrichtung);
    expect(rechner).toBeLessThan(faq);
  });

  it('steht als dritter Abschnitt der Seite, nicht als zehnter', () => {
    /*
      Die aussagekräftige Grösse ist die POSITION IN DER GLIEDERUNG, nicht ein
      Prozentwert: Der Rechner ist selbst der längste Abschnitt der Seite und
      verschiebt damit jede Textanteil-Rechnung, in der er mitzählt.

      Vorher: Abschnitt 10 von 12 — hinter Einrichtung, Testphase, Begriffs-
      klärung, Sprachen, Vertrag und „was nicht extra kostet".
      Jetzt: Abschnitt 3 — direkt hinter Abrechnung und Tarifen.
    */
    const h2 = [...main.querySelectorAll('h2')].map((e) =>
      (e.textContent ?? '').replace(/\s+/g, ' ').trim()
    );
    const index = h2.indexOf('Was kostet das bei Ihrem Anrufaufkommen?');
    expect(index).toBeGreaterThan(-1);
    expect(index).toBeLessThanOrEqual(2);
    // Abrechnung und Tarife bleiben davor — der Rechner ist nicht der Einstieg.
    expect(index).toBeGreaterThan(0);
  });

  it('trägt die Tarife und die Abrechnung weiterhin VOR dem Rechner', () => {
    const tarife = text.indexOf('Welcher Tarif passt zu wie vielen Anrufen?');
    expect(tarife).toBeGreaterThan(-1);
    expect(tarife).toBeLessThan(text.indexOf('Günstigster Tarif bei diesem Aufkommen'));
  });
});

describe('Preisseite — die verworfenen Altlasten kommen nicht zurück', () => {
  it('nennt keinen Automatisierungsgrad und keinen Vorgabewert dafür', () => {
    expect(text).not.toMatch(/Automatisierungsgrad/);
    expect(text).not.toMatch(/automatisiert (?:nur )?20\s?%/);
  });

  it('zeigt kein negatives Ergebnis aus unvollständigen Angaben', () => {
    /*
      Der konkrete Befund des Inhabers war „Bleibt im ersten Jahr −648 € /
      Monat" — aus einem halben Modell. Im Startzustand sind die
      wirtschaftlichen Felder leer, also darf hier NICHTS Negatives stehen und
      stattdessen der Unvollständigkeitszustand.
    */
    expect(text).toContain('Wirtschaftlichkeit noch nicht vollständig berechnet');
    expect(text).not.toMatch(/Bleibt im ersten Jahr/);
    expect(text).not.toMatch(/trägt sich nicht/);
    expect(text).not.toMatch(/-\s?\d[\d.]*\s?€|−\s?\d[\d.]*\s?€/);
  });

  it('trägt keine der alten Beispielzahlen mehr', () => {
    expect(text).not.toMatch(/120\s+Anrufe/);
    expect(text).not.toMatch(/18\s?€\s?\/\s?h|18\s?€ pro Stunde/);
    expect(text).not.toMatch(/Davon heute nicht angenommen/);
  });

  it('beschreibt das Produkt nicht mehr als Notizzettel', () => {
    expect(text).not.toMatch(/Anliegen aufnimmt und strukturiert weitergibt/);
    expect(text).not.toMatch(/Kern des Produkts ist die (?:strukturierte )?Übergabe/);
    // Stattdessen die zugesicherte Fähigkeit …
    expect(text).toMatch(/bucht Termine, verschiebt sie/);
    // … und die Bedingung für Schreibzugriff in Lesenähe.
    expect(text).toMatch(/richten wir diese Anbindung für Ihr System ein/);
    expect(text).toMatch(/verifizieren sie vor dem Go-live/);
  });

  it('macht keine unbelegte Zusage zur Gleichzeitigkeit', () => {
    expect(text).not.toMatch(/ohne Warteschleife|kein(?:e)? Besetztzeichen/);
    expect(text).not.toMatch(/(?:zehn|10)\s+(?:Anrufe|Gespräche)\s+gleichzeitig/i);
    expect(text).not.toMatch(/jeder Anruf wird angenommen|kein Anruf geht verloren/);
  });
});

describe('Preisseite — Sprachpreise so sicher wie die Rechnung, nicht sicherer', () => {
  it('nennt den eindeutigen Einzelpreis', () => {
    expect(text).toContain(String(SPRACHEN_PREISE.proSpracheEur));
  });

  it('nennt den unbestätigten Paketbetrag nicht als Tatsache', () => {
    // OWNER-INPUT H3 offen: weder „230 €" noch „ab drei Sprachen" als Fakt.
    expect(text).not.toContain(String(SPRACHEN_PREISE.paketEur));
    expect(text).not.toMatch(/ab drei Sprachen sind es/);
    // Verschwiegen wird nichts: Paketpreis und Angebot werden benannt.
    expect(text).toMatch(/Paketpreis/);
    expect(text).toMatch(/Angebot/);
  });

  it('tippt die Sprachpreise nicht zweimal — eine Quelle', () => {
    // FAQ und Abschnitt speisen sich beide aus SPRACHEN.text.
    const kern = 'Eine weitere Sprache kostet';
    expect(SPRACHEN.text).toContain(kern);
    expect(text).toContain(kern);
  });
});

describe('Preisseite — Messung bleibt unverändert', () => {
  /*
    DIE GA4-LÜCKE IST GESCHLOSSEN, 12.09.2026.

    Bis zur Zusammenführung stand hier eine begründete Auslassung: Die
    Korrektur auf den Produktions-Stream `G-NDN9J2G5LM` lag auf dem eigenen
    Zweig `claude/fix-ga4-stream-id-2026-09-12` und war weder in `origin/main`
    noch in diesem Zweig. Eine Zusicherung auf die neue ID wäre damals
    fehlgeschlagen, eine auf die alte hätte den falschen Wert festgeschrieben.

    Die Korrektur ist über PR #92 in `main` gelandet und mit der Zusammenführung
    von `origin/main` in diesen Zweig gekommen. Damit gilt hier genau die Zeile,
    die der Kommentar angekündigt hat — sie steht jetzt unten.

    `src/lib/consent.test.ts` prüft dieselbe ID zusätzlich im Verhalten,
    einschließlich Cookie-Cleanup für den stillgelegten Stream.
  */
  it('ändert die Analytics-Konfiguration dieses Zweigs nicht', async () => {
    const consent = (await import('@/lib/consent?raw')) as unknown as { default: string };
    const quelle = consent.default;
    // Ads bleibt unangetastet — diese Aufgabe fasst Werbung nicht an.
    expect(quelle).toContain('AW-17946397271');
    // Der aktive GA4-Stream ist der Produktions-Stream.
    expect(quelle).toContain('G-NDN9J2G5LM');
    // Der stillgelegte Stream darf ausschließlich als Cookie-Name überleben —
    // nie als konfigurierte Measurement-ID.
    expect(quelle).not.toContain("GA4_ID = 'G-K7BS3LKT6H'");
    expect(quelle).toContain("LEGACY_ANALYTICS_COOKIES = ['_ga_K7BS3LKT6H']");
    // Und der Rechner bleibt in der Messung grob: keine Geschäftszahl geht raus.
    expect(quelle).toContain("CONSENT_STORAGE_KEY = 'cogniiq_consent_v2'");
  });

  it('meldet aus dem Rechner keine Eingabewerte des Besuchers', async () => {
    const rechner = (await import('@/components/TelefonRechner?raw')) as unknown as {
      default: string;
    };
    const aufrufe = [...rechner.default.matchAll(/trackEvent\(([^)]*)\)/g)].map((m) => m[1]);
    expect(aufrufe.length).toBeGreaterThan(0);
    for (const argumente of aufrufe) {
      // Nur feste Zeichenketten, niemals eine Variable mit einem Betrag darin.
      expect(
        /^"[a-z_]+"(,\s*"[^"]*")?$/.test(argumente.trim()),
        `trackEvent(${argumente}) übergibt etwas anderes als feste Zeichenketten`
      ).toBe(true);
    }
  });
});

/* ───────────────────────────────────────────────────────────────────────────
   KEIN PREISDECKEL — verbindliche Preisstruktur vom 24.10.2026.

   Bis zum 24.10. nannte die Seite eine „angegebene Obergrenze" je Tarif. Der
   Inhaber hat sie gestrichen: Der Monatspreis enthält ein Kontingent, jede
   weitere abrechenbare Minute kostet 0,50 €, die Rechnung steigt ohne Deckel.
   Diese Suite verhindert, dass ein Deckel – ausdrücklich oder sinngemäß –
   zurückkehrt, und hält fest, dass die Mehrminuten offen benannt werden.
   ────────────────────────────────────────────────────────────────────────── */
describe('Preisseite — Kontingent plus Mehrminuten, kein Preisdeckel', () => {
  it('behauptet nirgends eine Obergrenze, einen Deckel oder einen Höchstpreis', () => {
    expect(text).not.toMatch(/Obergrenze|gedeckelt|Deckelung|garantierte[rn]? Höchstpreis|maximal 500 ?€/);
    const absolut = [
      'Mehr zahlen Sie in diesem Monat nicht',
      'Mehr zahlen Sie nie',
      'maximale Monatsrechnung',
      'feste Gesamtkosten',
      'kostet es nie mehr',
    ];
    for (const satz of absolut) {
      expect(text, `„${satz}" behauptet einen Deckel`).not.toContain(satz);
    }
  });

  it('sagt ausdrücklich, dass es keinen Preisdeckel gibt und die Rechnung steigt', () => {
    expect(text).toContain('Einen Preisdeckel gibt es nicht');
    expect(text).toContain('steigt die Monatsrechnung um die Mehrminuten');
  });

  it('nennt den Mehrminutensatz 0,50 € für alle drei Tarife', () => {
    expect(FAKTEN.mehrpreisProMinuteEur).toBe(0.5);
    expect(text).toMatch(/jede (?:darüber hinausgehende abrechenbare|weitere) Minute (?:kostet zusätzlich )?0,50 €/);
    expect(text).toContain('in allen drei Tarifen');
  });

  it('kündigt den nachvollziehbaren Rechnungsausweis der Mehrminuten an', () => {
    expect(text).toContain('Mehrminuten weisen wir auf der Monatsrechnung nachvollziehbar aus');
  });

  it('rechnet das Rechnungsbeispiel korrekt: Praxis bei 1.200 Minuten = 500 € + 200 × 0,50 € = 600 €', () => {
    expect(text).toMatch(/1\.200/);
    expect(text).toMatch(/600(?:,00)? €/);
  });

  it('weist Zusatzposten separat aus', () => {
    expect(text).toMatch(/eigene Positionen|separat/);
  });
});

describe('Preisseite — die Geschäftspreise sind unverändert', () => {
  /*
    Diese Aufgabe war Konsistenz und Wirtschaftsmodell, NICHT Preispolitik.
    Jede Zahl unten stammt aus TARIFE / FAKTEN / SPRACHEN_PREISE und steht
    hier als Wache gegen eine stille Preisänderung im Zuge einer Copy-Korrektur.
  */
  it('zeigt Grundpreise und Kontingente; Einrichtung 990 € einheitlich, ohne Staffel', () => {
    const norm = (v: string) => v.replace(/\s+/g, ' ');
    for (const t of TARIFE) {
      expect(text).toContain(norm(t.monatlich));
    }
    expect(TARIFE.map((t) => t.monatlichEur)).toEqual([300, 500, 800]);
    expect(TARIFE.map((t) => t.minuten)).toEqual([500, 1000, 2000]);
    // Die alte Staffel 1.490 / 2.490 / 3.490 € steht nirgends mehr.
    expect(text).not.toMatch(/1\.490|2\.490|3\.490/);
    expect(EINRICHTUNG.eur).toBe(990);
    expect(text).toContain(norm(EINRICHTUNG.kurz));
    expect(text).toContain('in allen drei Tarifen einmalig 990 €');
  });

  it('nennt keinen alten Minutenpreis', () => {
    expect(text).not.toMatch(/0,39/);
  });

  it('hält den bestätigten Preis für eine Zusatzsprache bei 79 €', () => {
    expect(SPRACHEN_PREISE.proSpracheEur).toBe(79);
  });

  it('lässt die Mehrsprachigkeit oberhalb einer Zusatzsprache offen', () => {
    // OWNER-INPUT H3 ist unverändert unbeantwortet — hier darf kein Paketpreis
    // stehen, den wir nicht für jede Konstellation belegen können.
    expect(SPRACHEN.text).toContain('Paketpreis');
    expect(SPRACHEN.text).toContain('schriftlichen Angebot');
  });

  it('nennt Enterprise weiterhin als Untergrenze, nicht als Preis', () => {
    expect(text).toMatch(/ab 5\.000 ?€/);
  });

  it('weist den Aufschlag für monatliche Kündbarkeit weiterhin aus', () => {
    expect(text).toMatch(/20 ?% Aufschlag/);
  });

  it('hält die Anbindung als offene Position, nie als Null', () => {
    expect(text).toMatch(/noch offen|technischen Prüfung/);
  });
});
