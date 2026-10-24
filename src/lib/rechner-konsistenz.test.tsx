// ─────────────────────────────────────────────────────────────────────────────
// KONSISTENZWACHE FÜR ALLE ÖFFENTLICHEN RECHNER.
//
// Warum es diese Datei gibt. Vor dem 11.09.2026 standen auf der Website vier
// Stellen, die Geld ausrechneten, und sie widersprachen einander:
//
//   • `CostComparisonSection` behauptete einen Festpreis von 297 € im Monat.
//     Der steht in keiner Tarifliste; die Tarife beginnen bei 300 € und richten
//     sich nach dem Minutenkontingent.
//   • `ROICalculator` und `CostComparisonSection` rechneten mit 4,3 Wochen je
//     Monat, der Praxis-Rechner mit 4,33. Gleiche Eingabe, zwei Ergebnisse.
//   • `PraxisRechnerWidget` hatte eine eigene Tarifrechnung samt eigenem
//     Mehrpreis je Minute und parste dafür die ANZEIGESTRINGS der Preisseite
//     zurück in Zahlen.
//   • Derselbe Rechner setzte 20 % als „Automatisierungsgrad" voreingestellt —
//     eine Aussage über das eigene Produkt, die es weit unter Wert verkauft.
//
// Jede dieser Abweichungen war für sich plausibel begründbar und in Summe ein
// Glaubwürdigkeitsproblem: Ein Besucher, der zwei Seiten öffnet, findet den
// Widerspruch in unter einer Minute.
//
// Diese Suite prüft deshalb ZWEIERLEI, und beides ist nötig:
//   1. ARITHMETIK — gleiche Eingabe, gleiches Ergebnis, über alle Fassungen.
//      Ein Test, der nur gerenderten Text liest, hätte 297 € nie gefunden.
//   2. QUELLTEXT — dass kein Bauteil einen Betrag oder einen Vorgabewert erneut
//      tippt. Arithmetik allein fängt eine neu eingeführte Konstante erst, wenn
//      jemand zufällig genau den Fall testet, in dem sie auffällt.
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

import { EINRICHTUNG, FAKTEN, SPRACHEN_PREISE, TARIFE } from '@/lib/telefonassistent-copy';
import { RECHNER_ANKER, RECHNER_LINK, RECHNER_ROUTE } from '@/lib/rechner-anker';
import { PROTECTED_EXPERIMENT_PATHS } from '@/lib/routing/protectedExperiments';
import {
  WOCHEN_PRO_MONAT,
  anrufeProMonatAusWoche,
  berechneNutzen,
  berechnePreis,
  UNVOLLSTAENDIG,
  waehleSzenario,
  type NutzenEingabe,
} from '@/lib/telefonassistent-rechner';

const REPO_ROOT = process.cwd();

/** Quelle je Route, die jemals in PROTECTED_EXPERIMENT_PATHS stand. */
const ROUTE_ZU_QUELLE: Record<string, string> = {
  '/kosten-ki-telefonassistent': 'src/pages/costs/KostenKiTelefonassistent.tsx',
  '/ki-telefonassistent-arzt': 'src/pages/industries/KiTelefonassistentArzt.tsx',
  '/bayreuth/webdesign': 'src/components/CityServiceRoute.tsx',
  '/bayreuth/website-relaunch': 'src/pages/cluster/bayreuth/WebsiteRelaunchBayreuth.tsx',
  '/regensburg/website-relaunch': 'src/pages/cluster/regensburg/WebsiteRelaunchRegensburg.tsx',
  '/muenchen/webdesign-kosten': 'src/pages/cluster/muenchen/WebdesignKostenMuenchen.tsx',
};

function sammle(dir: string, out: Map<string, string> = new Map()): Map<string, string> {
  for (const eintrag of readdirSync(dir)) {
    if (eintrag === 'node_modules' || eintrag === '.git') continue;
    const voll = join(dir, eintrag);
    if (statSync(voll).isDirectory()) {
      sammle(voll, out);
      continue;
    }
    if (!/\.tsx?$/.test(eintrag)) continue;
    out.set(relative(REPO_ROOT, voll).split(sep).join('/'), readFileSync(voll, 'utf8'));
  }
  return out;
}

const QUELLEN = sammle(join(REPO_ROOT, 'src'));

/*
  Kommentare werden vor jeder Quelltextprüfung entfernt — und zwar nicht aus
  Bequemlichkeit. Die Kommentare dieses Projekts erklären genau die Fehler, die
  hier verboten werden: „hier stand 297 €", „hier stand betragZuZahl". Würde die
  Prüfung sie mitlesen, wäre die Dokumentation eines behobenen Fehlers selbst
  ein Fehler — und der nächste Entwickler löschte die Erklärung, statt den Code
  zu verstehen.
*/
function nurCode(inhalt: string): string {
  return inhalt.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

/** Nur Produktionsquelltext — Tests dürfen Beträge nennen, sie prüfen sie ja. */
const PRODUKTION: Array<[string, string]> = [...QUELLEN]
  .filter(([pfad]) => !/\.test\.tsx?$/.test(pfad))
  .map(([pfad, inhalt]) => [pfad, nurCode(inhalt)]);

/** Die Dateien, in denen Beträge legitim als Literal stehen dürfen. */
const KANONISCHE_ZAHLENQUELLEN = new Set(['src/lib/telefonassistent-copy.ts']);

/*
  BIS ZUM 12.09.2026 stand hier eine Ausnahme:

    const EINGEFROREN = 'src/components/PraxisRechnerWidget.tsx';

  Dieses Widget war der letzte Ort, an dem ein voreingestellter
  „Automatisierungsgrad" von 20 % überlebte — geduldet, weil es nur noch die
  eingefrorene Kostenseite bediente und deren gerenderte Bytes die
  Messbedingung eines laufenden Experiments waren.

  Das Experiment ist durch Inhaber-Entscheidung beendet, die Kostenseite rechnet
  mit dem kanonischen `TelefonRechner`, und das Widget ist gelöscht. Die
  Ausnahme ist damit ersatzlos weg: Es gibt keine Fläche mehr, auf der ein
  Vorgabewert für den Automatisierungsgrad erlaubt wäre.
*/

// ── 1 · Der Preis ist überall derselbe ──────────────────────────────────────

describe('Preis — eine Quelle, ein Ergebnis', () => {
  /*
    Die Fälle decken jede Kante der Tarifregel ab: unter dem Kontingent, exakt
    am Kontingent, im Mehrverbrauch, am Deckel des kleinsten Tarifs, im
    Tarifwechsel und jenseits der Liste.
  */
  const FAELLE: Array<[string, number, number]> = [
    ['leerer Warenkorb', 0, 0],
    ['weit unter dem Basiskontingent', 100, 2],
    ['exakt am Basiskontingent', 250, 2],
    ['knapp über dem Basiskontingent', 300, 2],
    ['im Praxis-Bereich', 600, 2],
    ['im MVZ-Bereich', 900, 2],
    ['jenseits der Tarifliste', 3000, 5],
  ];

  it.each(FAELLE)(
    '%s — Tarifwahl, Monatsbetrag und Einrichtung hängen nur an den Minuten',
    (_name, anrufe, dauer) => {
      const a = berechnePreis({ anrufeProMonat: anrufe, minutenProAnruf: dauer }, 0);
      // Dieselben Minuten, anders zusammengesetzt, müssen dasselbe ergeben:
      // Der Preis hängt am Minutenbedarf, nicht an der Zerlegung in Anrufe.
      const b = berechnePreis({ anrufeProMonat: anrufe * dauer, minutenProAnruf: 1 }, 0);
      expect(b).toEqual(a);
    }
  );

  it('leitet jeden Tarifbetrag aus TARIFE ab, nie aus einem eigenen Literal', () => {
    for (const tarif of TARIFE) {
      // Genau am Kontingent eines Tarifs ist dieser Tarif der günstigste, und
      // sein Betrag ist exakt die Grundgebühr aus TARIFE.
      const szenario = waehleSzenario(tarif.minuten);
      expect(szenario.tarif.name).toBe(tarif.name);
      expect(szenario.mehrminuten).toBe(0);
      expect(szenario.monatlichEur).toBe(tarif.monatlichEur);
      expect(TARIFE).toContain(szenario.tarif);
    }
  });

  it('rechnet Mehrminuten zum Satz aus FAKTEN — eine Minute über Basis kostet Grundgebühr + 0,50 €', () => {
    const einMinuteUeberBasis = TARIFE[0].minuten + 1;
    const szenario = waehleSzenario(einMinuteUeberBasis);
    expect(szenario.tarif.name).toBe(TARIFE[0].name);
    expect(szenario.mehrminuten).toBe(1);
    expect(szenario.monatlichEur).toBe(TARIFE[0].monatlichEur + FAKTEN.mehrpreisProMinuteEur);
  });

  it('rechnet jenseits des größten Kontingents linear weiter — kein Deckel, kein Abbruch', () => {
    const groesster = TARIFE[TARIFE.length - 1];
    const weitDarueber = groesster.minuten + 1000;
    const preis = berechnePreis({ anrufeProMonat: weitDarueber, minutenProAnruf: 1 }, 0);
    expect(preis.empfehlung.tarif.name).toBe(groesster.name);
    expect(preis.monatlichGesamtEur).toBe(groesster.monatlichEur + 1000 * FAKTEN.mehrpreisProMinuteEur);
    expect(preis.einrichtungEur).toBe(EINRICHTUNG.eur);
  });

  it('weist die Anbindung IMMER als unbekannt aus, nie als 0', () => {
    for (const [, anrufe, dauer] of FAELLE) {
      const preis = berechnePreis({ anrufeProMonat: anrufe, minutenProAnruf: dauer }, 0);
      expect(preis.anbindungEur).toBe('unbekannt');
      expect(preis.anbindungEur).not.toBe(0);
    }
  });

  it('beziffert den eindeutigen Sprachaufschlag aus SPRACHEN_PREISE', () => {
    const basis = { anrufeProMonat: 200, minutenProAnruf: 2 };
    expect(berechnePreis(basis, 0).sprachenMonatlichEur).toBe(0);
    expect(berechnePreis(basis, 1).sprachenMonatlichEur).toBe(SPRACHEN_PREISE.proSpracheEur);
  });

  it('lässt den mehrdeutigen Paketpreis offen statt ihn abzuleiten', () => {
    /*
      „Ab drei Sprachen 230 € für bis zu fünf Sprachen" legt nicht fest, ob
      Deutsch mitzählt. Aus wirtschaftlicher Plausibilität eine
      Vertragsbedingung zu erschließen ist keine Quelle — und ein zu niedrig
      ausgewiesener Monatsbetrag ist der teuerste Fehler, den ein Preisrechner
      machen kann. Offen bis OWNER-INPUT H3 beantwortet ist.
    */
    const basis = { anrufeProMonat: 200, minutenProAnruf: 2 };
    for (const n of [2, 3] as const) {
      const p = berechnePreis(basis, n);
      expect(p.sprachenOffen).toBe(true);
      expect(p.sprachenMonatlichEur).not.toBe(0);
      expect(p.monatlichGesamtEur).toBe('unbekannt');
    }
  });
});

// ── 2 · Die Wirtschaftlichkeit ist überall dieselbe ─────────────────────────

describe('Nutzen — drei Bausteine, ein Geldsaldo', () => {
  const volumen = { anrufeProMonat: 400, minutenProAnruf: 2.5 };
  const preis = berechnePreis(volumen, 0);
  const AUS: NutzenEingabe = {
    zeit: { aktiv: false, anrufeHeuteVomTeam: null, minutenProAnrufTeam: null, uebernommenProzent: null, restaufwandProzent: null, stundenkostenEur: null },
    kosten: { aktiv: false, entfallendeAusgabenEur: null },
    termine: { aktiv: false, zusaetzlicheTermine: null, deckungsbeitragEur: null, freieKapazitaet: null },
  };

  /*
    DER FEHLER, DEN DIESE GRUPPE VERHINDERT (Stand 23.10.2026).

    Bis dahin ging „Telefonminuten × Routineanteil × Stundensatz" als Nutzen
    gegen den Cogniiq-Preis und ergab einen „Nettoeffekt" samt Amortisation —
    eine Cash-Rechnung aus einer Größe, die kein Geldzufluss ist. Jetzt gibt
    es den Geldsaldo nur aus tatsächlich entfallenden Ausgaben und
    realisierbaren Zusatzterminen; der Zeitwert steht daneben.
  */
  it('zeigt ohne gewählten Baustein KEINEN Saldo — auch keinen negativen', () => {
    const r = berechneNutzen(preis, AUS);
    expect(r.vollstaendig).toBe(false);
    expect(r.cash.saldoProMonatEur).toBe(UNVOLLSTAENDIG);
  });

  it('nennt genau die Felder, die ein aktiver Baustein noch braucht', () => {
    const r = berechneNutzen(preis, { ...AUS, zeit: { ...AUS.zeit, aktiv: true, minutenProAnrufTeam: 3 } });
    expect(r.zeit.fehlend).toEqual(['anrufeHeuteVomTeam', 'uebernommenProzent']);
    expect(r.cash.saldoProMonatEur).toBe(UNVOLLSTAENDIG);
  });

  it('der Zeitwert steht NIE im Geldsaldo', () => {
    const nurZeit = berechneNutzen(preis, {
      ...AUS,
      zeit: { aktiv: true, anrufeHeuteVomTeam: 400, minutenProAnrufTeam: 3, uebernommenProzent: 100, restaufwandProzent: 0, stundenkostenEur: 40 },
    });
    expect(nurZeit.zeit.zeitwertEur).toBeCloseTo(800, 10);
    expect(nurZeit.cash.saldoProMonatEur).toBeCloseTo(-(preis.monatlichGesamtEur as number), 10);
  });

  it('Potenzial ohne Kapazität ist kein Gewinn', () => {
    const r = berechneNutzen(preis, { ...AUS, termine: { aktiv: true, zusaetzlicheTermine: 10, deckungsbeitragEur: 50, freieKapazitaet: null } });
    expect(r.termine.potenzialEur).toBe(500);
    expect(r.termine.realisierbarEur).toBeNull();
    expect(r.cash.saldoProMonatEur).toBeCloseTo(-(preis.monatlichGesamtEur as number), 10);
  });

  it('zeigt ein vollständiges negatives Ergebnis unverändert an', () => {
    const r = berechneNutzen(preis, { ...AUS, kosten: { aktiv: true, entfallendeAusgabenEur: 50 } });
    expect(r.vollstaendig).toBe(true);
    expect(r.cash.saldoProMonatEur).toBeLessThan(0);
  });

  it('weist die Einrichtung als 990 € einmalig aus, aber ohne Amortisation – die Anbindung bleibt offen', () => {
    const r = berechneNutzen(preis, { ...AUS, kosten: { aktiv: true, entfallendeAusgabenEur: 900 } });
    expect(r.cash.einmaligeKostenEur).toBe(EINRICHTUNG.eur);
    expect(r.cash).not.toHaveProperty('ersteJahrSaldoEur');
    expect(r.cash).not.toHaveProperty('amortisationMonate');
    expect(r.cash.offeneKosten).toEqual(['anbindung']);
  });

  it('rechnet sehr hohes Aufkommen zum Listenpreis ohne Deckel und markiert es zur individuellen Prüfung', () => {
    // 25.000 Min: MVZ 800 € + 23.000 × 0,50 € = 12.300 € → Saldo 900 − 12.300 = −11.400 €.
    const riesig = berechnePreis({ anrufeProMonat: 5000, minutenProAnruf: 5 }, 0);
    expect(riesig.individuellPruefen).toBe(true);
    expect(riesig.monatlichGesamtEur).toBe(12300);
    expect(berechneNutzen(riesig, { ...AUS, kosten: { aktiv: true, entfallendeAusgabenEur: 900 } }).cash.saldoProMonatEur).toBe(-11400);
  });

  it('gibt bei offenem Sprachaufschlag keinen Saldo aus', () => {
    expect(berechneNutzen(berechnePreis(volumen, 3), { ...AUS, kosten: { aktiv: true, entfallendeAusgabenEur: 900 } }).cash.saldoProMonatEur).toBe('unbekannt');
  });
});

// ── 3 · Ein Wochenfaktor ────────────────────────────────────────────────────

describe('Wochen je Monat', () => {
  it('rechnet Wochenaufkommen über genau eine Umrechnung in Monatsaufkommen', () => {
    expect(anrufeProMonatAusWoche(120)).toBeCloseTo(120 * WOCHEN_PRO_MONAT, 10);
    expect(anrufeProMonatAusWoche(-5)).toBe(0);
  });

  it('taucht als Zahlenliteral in keinem Bauteil erneut auf', () => {
    for (const [pfad, inhalt] of PRODUKTION) {
      // Seit dem 12.09.2026 die einzige erlaubte Stelle. Vorher stand die Zahl
      // in telefonassistent-rechner.ts; sie ist dorthin gezogen, damit der
      // Automatisierungs-Rechner sie lesen kann, ohne das Preismodell des
      // Telefonassistenten in sein Bündel zu ziehen.
      if (pfad === 'src/lib/zeitrechnung.ts') continue;
      expect(
        /(^|[^\d.])4\.3{1,2}([^\d]|$)/.test(inhalt),
        `${pfad} tippt einen eigenen Wochenfaktor; er gehört in telefonassistent-rechner.ts`
      ).toBe(false);
    }
  });
});

// ── 4 · Keine überlebenden Fremdbeträge ─────────────────────────────────────

describe('Beträge stehen an genau einer Stelle', () => {
  it('kennt keinen KI-Monatspreis von 297 € mehr', () => {
    for (const [pfad, inhalt] of PRODUKTION) {
      expect(
        /KI_PRICE_MONTHLY|\b297\s*€|297\\u00A0€/.test(inhalt),
        `${pfad} enthält den alten Beispielpreis 297 €`
      ).toBe(false);
    }
  });

  it('tippt den Minutenpreis 0,39 € nirgends erneut', () => {
    for (const [pfad, inhalt] of PRODUKTION) {
      if (KANONISCHE_ZAHLENQUELLEN.has(pfad)) continue;
      expect(
        /0[.,]39/.test(inhalt),
        `${pfad} tippt einen Minutenpreis; seit dem 24.10.2026 gibt es keinen — Konditionen über dem Kontingent stehen im Angebot`
      ).toBe(false);
    }
  });

  it('tippt keinen Tarif-, Obergrenzen- oder Einrichtungsbetrag erneut', () => {
    const betraege = new Set(
      [...TARIFE.map((t) => t.monatlichEur), EINRICHTUNG.eur]
    );
    /*
      Geprüft wird die ZUWEISUNG AN EINEN PREIS-BEZEICHNER, nicht die nackte
      Zahl. `const START_ANRUFE = 300` ist ein Startwert für Anrufe und hat mit
      dem Basis-Monatspreis von 300 € nur die Ziffern gemeinsam; ein Test, der
      beides verwechselt, wird beim ersten Fehlalarm entschärft und schützt
      danach nichts mehr.
    */
    const preisZuweisung =
      /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::\s*number\s*)?=\s*(\d+(?:[.,]\d+)?)\s*;/g;
    const preisWort = /PREIS|PRICE|MONATLICH|MONTHLY|EINRICHTUNG|SETUP|OBERGRENZE|TARIF|KOSTEN/i;
    for (const [pfad, inhalt] of PRODUKTION) {
      if (KANONISCHE_ZAHLENQUELLEN.has(pfad)) continue;
      for (const treffer of inhalt.matchAll(preisZuweisung)) {
        const [, name, rohwert] = treffer;
        if (!preisWort.test(name)) continue;
        expect(
          betraege.has(Number(rohwert.replace(',', '.'))),
          `${pfad} weist ${name} = ${rohwert} zu; Tarifzahlen kommen aus TARIFE`
        ).toBe(false);
      }
    }
  });

  it('parst keinen formatierten Preisstring zurück in eine Zahl', () => {
    for (const [pfad, inhalt] of PRODUKTION) {
      expect(
        /betragZuZahl|replace\(\/\[\^\\d,\]/.test(inhalt),
        `${pfad} leitet Geschäftslogik aus einer Anzeigeformatierung ab`
      ).toBe(false);
    }
  });
});

// ── 5 · Die Automatisierungs-Semantik ───────────────────────────────────────

describe('Automatisierung — Fähigkeit und Anrufmix bleiben getrennt', () => {
  it('setzt auf keiner Fläche einen Automatisierungsgrad voreingestellt', () => {
    // Ohne Ausnahme: jede Produktionsdatei, keine geduldete Fläche mehr.
    for (const [pfad, inhalt] of PRODUKTION) {
      expect(
        /AUTOMATISIERUNG_STANDARD|START_AUTOMATISIERUNG/.test(inhalt),
        `${pfad} setzt wieder einen Vorgabewert für den Automatisierungsgrad`
      ).toBe(false);
    }
  });

  it('behauptet nirgends, dass jeder Anruf vollständig automatisiert wird', () => {
    for (const [pfad, inhalt] of PRODUKTION) {
      expect(
        /100\s*%\s*(aller|jedes|jeder)\s+Anruf/.test(inhalt),
        `${pfad} verspricht die Automatisierung ALLER Anrufe; zugesagt sind konfigurierte Routineabläufe`
      ).toBe(false);
    }
  });

  it('hält die Übernahme als gewähltes Szenario im Rechenkern fest, nicht als Standard', () => {
    const kern = QUELLEN.get('src/lib/telefonassistent-rechner.ts')!;
    expect(kern).toMatch(/uebernommenProzent/);
    // Der Kommentar ist hier Teil der Zusage: Er ist die Stelle, an der steht,
    // dass 100 % Übernahme eine bewusste Wahl ist und kein versteckter Standard.
    expect(kern).toMatch(/kein versteckter Standard/);
  });
});

// ── 6 · Der Anker trägt ─────────────────────────────────────────────────────

describe('Rechner-Anker', () => {
  it('existiert genau einmal als ID auf der Zielseite', () => {
    const seite = QUELLEN.get('src/pages/KiTelefonassistentPage.tsx')!;
    expect(seite).toMatch(/id=\{RECHNER_ANKER\}/);
    expect(seite).toMatch(/from "@\/lib\/rechner-anker"/);
  });

  it('setzt sich aus Route und ID zusammen — kein getippter Pfad', () => {
    expect(RECHNER_LINK).toBe(`${RECHNER_ROUTE}#${RECHNER_ANKER}`);
    expect(RECHNER_ROUTE.startsWith('/')).toBe(true);
    expect(RECHNER_ANKER.startsWith('#')).toBe(false);
  });

  it('wird von keinem Bauteil als Literal nachgebaut', () => {
    for (const [pfad, inhalt] of PRODUKTION) {
      if (pfad === 'src/lib/rechner-anker.ts') continue;
      expect(
        inhalt.includes(`"${RECHNER_LINK}"`) || inhalt.includes(`'${RECHNER_LINK}'`),
        `${pfad} tippt das Sprungziel; es steht in RECHNER_LINK`
      ).toBe(false);
    }
  });

  it('verweist von keiner eingefrorenen Seite auf den Rechner', () => {
    // Die Inbound-Zählung in protectedExperiments.test.tsx deckt die
    // Gegenrichtung ab. Diese Prüfung deckt die Hinrichtung: ein CTA, der auf
    // einer eingefrorenen Seite landet, verändert deren gerenderte Bytes.
    // Die Kostenseite steht hier seit dem 12.09.2026 nicht mehr: Sie ist keine
    // eingefrorene Route mehr und TRÄGT den Rechner jetzt selbst. Die Arztseite
    // steht hier seit dem 23.10.2026 nicht mehr: Sie wurde graduiert und
    // verlinkt den Rechner jetzt bewusst (Kosten sind dort Einwand Nr. 1).
    // Die Liste folgt PROTECTED_EXPERIMENT_PATHS; solange sie leer ist, prüft
    // dieser Test nur, dass kein Pfad versehentlich wieder hart getippt wird.
    const eingefroren = PROTECTED_EXPERIMENT_PATHS.map((route) => ROUTE_ZU_QUELLE[route]).filter(Boolean);
    for (const pfad of eingefroren) {
      const inhalt = QUELLEN.get(pfad)!;
      expect(inhalt).not.toMatch(/RechnerCta|rechner-anker|rechner:/);
    }
  });
});

// ── 7 · Die Kostenseite rechnet mit dem kanonischen Kern ───────────────────

describe('Kostenseite — ein Rechner, kein zweiter', () => {
  const seite = QUELLEN.get('src/pages/costs/KostenKiTelefonassistent.tsx')!;

  /*
    Abschnitt 7 hiess bis zum 12.09.2026 „Der eingefrorene Rechner widerspricht
    dem Kern nicht" und bewachte die Parität zwischen `PraxisRechnerWidget` und
    dem Rechenkern. Das Widget ist gelöscht; zu bewachen ist jetzt das
    Gegenteil — dass die Kostenseite sich keinen eigenen Rechner zurückholt.
  */
  it('rendert den kanonischen Rechner und nicht das gelöschte Praxis-Widget', () => {
    expect(seite).toMatch(/TelefonRechnerSection/);
    expect(seite).not.toMatch(/PraxisRechner/);
  });

  it('rechnet selbst nichts — kein eigener Tarif, kein eigener Minutenpreis', () => {
    const ohneKommentare = nurCode(seite);
    expect(ohneKommentare).not.toMatch(/berechnePreis|berechneWirtschaftlichkeit/);
    expect(ohneKommentare).not.toMatch(/waehleSzenario|minutenProMonat/);
    expect(ohneKommentare).not.toMatch(/MEHRPREIS_PRO_MINUTE\s*=/);
    expect(ohneKommentare).not.toMatch(/function betragZuZahl/);
  });

  it('stellt den Rechner vor die erklärenden Abschnitte, nicht dahinter', () => {
    /*
      Preisintention: Der Besucher will „was kostet mich das" beantwortet
      haben. Deckelung und Tarife dürfen davor stehen — Einrichtung, Vertrag,
      FAQ und „was nicht extra kostet" nicht mehr. Vorher lag der Rechner
      hinter allen vier.
    */
    const rechner = seite.indexOf('<TelefonRechnerSection');
    const tarife = seite.indexOf('Welcher Tarif passt zu wie vielen Anrufen?');
    const einrichtung = seite.indexOf('Wofür zahlen Sie die Einrichtung?');
    const faq = seite.indexOf('Häufige Fragen zum Preis');
    for (const [name, pos] of [['Tarife', tarife], ['Einrichtung', einrichtung], ['FAQ', faq]] as const) {
      expect(pos, `Abschnitt ${name} nicht gefunden`).toBeGreaterThan(-1);
    }
    expect(rechner).toBeGreaterThan(tarife);
    expect(rechner).toBeLessThan(einrichtung);
    expect(rechner).toBeLessThan(faq);
  });
});

// ── 8 · Produktwahrheit auf den nicht eingefrorenen Flächen ────────────────

describe('Produktwahrheit — Abwicklung ist der Normalfall, Übergabe die Ausnahme', () => {
  /*
    Die eingefrorenen Experimentrouten sind ausgenommen, und zwar NICHT weil
    ihre Formulierungen richtig wären, sondern weil ihre gerenderten Bytes die
    Messbedingung eines laufenden Tests sind. Sobald der endet, fällt die
    Ausnahme weg — die Nachträge stehen in
    docs/seo/post-experiment-opportunities.md.
  */
  // Seit dem 12.09.2026 ist nur noch EINE Route eingefroren. Die Kostenseite
  // ist graduiert und wird ab hier wie jede lebende Fläche geprüft; das Widget
  // existiert nicht mehr.
  const EINGEFROREN_QUELLEN = new Set(['src/pages/industries/KiTelefonassistentArzt.tsx']);
  const LEBEND = PRODUKTION.filter(([pfad]) => !EINGEFROREN_QUELLEN.has(pfad));

  it('verspricht nirgends eine unbedingte Erreichbarkeit ohne Warteschleife', () => {
    /*
      „ohne Warteschleife", „kein Besetztzeichen", „jeder Anruf wird
      angenommen" sind unbedingte Zusagen. Sie hängen an einer endlichen
      Gleichzeitigkeit, deren Bereitstellung je Kunde nicht dokumentiert ist
      (OWNER-INPUT B11a) — und an einem Überlaufverhalten, das ebenfalls offen
      ist (B9). Erlaubt bleibt die Aussage, die in jedem Fall trägt: mehrere
      Anrufe zur selben Zeit.
    */
    const verboten = /ohne Warteschleife|kein(?:e)? Besetztzeichen|ohne Besetztzeichen|egal wie voll|jeder Anruf wird angenommen/;
    for (const [pfad, inhalt] of LEBEND) {
      expect(verboten.test(inhalt), `${pfad} verspricht unbedingte Erreichbarkeit`).toBe(false);
    }
  });

  it('nennt keine Anzahl gleichzeitiger Anrufe als öffentliche Zusage', () => {
    const verboten = /(zehn|10)\s+(?:Anrufe|Gespräche)\s+gleichzeitig/i;
    for (const [pfad, inhalt] of LEBEND) {
      expect(verboten.test(inhalt), `${pfad} beziffert die Gleichzeitigkeit`).toBe(false);
    }
  });

  it('beschreibt die Übergabe nirgends als den Kern des Produkts', () => {
    const verboten = /Übergabe (?:ist|bleibt) der Kern|Kern des Produkts ist die (?:strukturierte )?Übergabe|nimmt Terminwünsche auf, Ihr Team bestätigt/i;
    for (const [pfad, inhalt] of LEBEND) {
      expect(verboten.test(inhalt), `${pfad} macht die Notiz zum Produkt`).toBe(false);
    }
  });

  it('hält Fähigkeit und Anbindungsbedingung als getrennte Regeln fest', () => {
    const copy = QUELLEN.get('src/lib/telefonassistent-copy.ts')!;
    // Die Fähigkeit darf benannt werden …
    expect(copy).toMatch(/AUTOMATED_WORKFLOW_COMPLETION|AUTOMATISIERTE_ABWICKLUNG/);
    // … und die Bedingung für Schreibzugriff steht daneben, nicht statt ihrer.
    expect(copy).toMatch(/SYSTEM_SCHREIBZUGRIFF/);
    // Die alte Fehlleseung darf nicht zurückkehren.
    expect(copy).not.toMatch(
      /was universell und\s+belegt gilt, ist die Aufnahme des Terminwunsches/
    );
  });
});

// ── 8 · Messung ohne Geschäftszahlen ────────────────────────────────────────

describe('Analytics', () => {
  const rechner = QUELLEN.get('src/components/TelefonRechner.tsx')!;

  it('meldet nur Ereignisnamen und feste Labels, nie einen Eingabewert', () => {
    const aufrufe = [...rechner.matchAll(/trackEvent\(([^)]*)\)/g)].map((m) => m[1]);
    expect(aufrufe.length).toBeGreaterThan(0);
    for (const argumente of aufrufe) {
      // Erlaubt: "name" oder "name", "Label". Verboten: jede Variable.
      expect(
        /^"[a-z_]+"(,\s*"[^"]*")?$/.test(argumente.trim()),
        `trackEvent(${argumente}) übergibt etwas anderes als feste Zeichenketten`
      ).toBe(true);
    }
  });

  it('meldet den Rechenstart höchstens einmal je Besuch', () => {
    expect(rechner).toMatch(/preisGemeldet\.current/);
    expect(rechner).toMatch(/roiGemeldet\.current/);
  });
});

/* ───────────────────────────────────────────────────────────────────────────
   DIE PERSONALLESARTEN GELTEN AUF BEIDEN FLÄCHEN GLEICH.

   `/ki-telefonassistent` und `/kosten-ki-telefonassistent` rendern denselben
   `TelefonRechner` und damit denselben Kern. Diese Suite hält fest, dass die
   Korrektur vom 12.09.2026 nicht an einer Fläche vorbeigeht — und dass
   niemand einen zweiten Personalrechner danebenstellt.
   ────────────────────────────────────────────────────────────────────────── */
describe('Nutzenbausteine — ein Kern, beide Flächen', () => {
  it('rechnet den Nutzen genau einmal — es gibt keine zweite Implementierung', () => {
    for (const [pfad, inhalt] of PRODUKTION) {
      if (pfad === 'src/lib/telefonassistent-rechner.ts') continue;
      expect(
        /uebernommenProzent\s*(as number)?\s*\)?\s*\/\s*100/.test(inhalt),
        `${pfad} rechnet die Zeitübernahme selbst nach`
      ).toBe(false);
      expect(/export function berechneNutzen/.test(inhalt), `${pfad} definiert berechneNutzen ein zweites Mal`).toBe(false);
    }
  });

  it('der Rechner übergibt dem Kern die Bausteine mit ausdrücklichem aktiv-Schalter', () => {
    const rechner = QUELLEN.get('src/components/TelefonRechner.tsx')!;
    expect(rechner).toMatch(/berechneNutzen\(/);
    expect(rechner).toMatch(/aktiv:\s*zeitAktiv/);
    expect(rechner).toMatch(/aktiv:\s*kostenAktiv/);
    expect(rechner).toMatch(/aktiv:\s*termineAktiv/);
  });

  it('meldet keinen Nutzenwert an GA4', () => {
    const rechner = QUELLEN.get('src/components/TelefonRechner.tsx')!;
    const aufrufe = [...rechner.matchAll(/trackEvent\(([^)]*)\)/g)].map((m) => m[1]);
    for (const argumente of aufrufe) {
      for (const verboten of ['stundenkosten', 'entfallend', 'deckungsbeitrag', 'kapazitaet', 'saldo', 'zeitwert', 'termine']) {
        expect(argumente.toLowerCase().includes(verboten), `trackEvent(${argumente}) überträgt „${verboten}"`).toBe(false);
      }
    }
  });

  it('setzt für keinen Nutzenwert einen Vorgabewert und wählt keinen Baustein vor', () => {
    const rechner = QUELLEN.get('src/components/TelefonRechner.tsx')!;
    for (const feld of ['teamAnrufe', 'teamMinuten', 'uebernommen', 'restaufwand', 'stundenkosten', 'entfallend', 'zusatzTermine', 'deckungsbeitrag', 'kapazitaet']) {
      expect(rechner, `${feld} startet nicht leer`).toMatch(new RegExp(`const \\[${feld}, set\\w+\\] = useState<number \\| null>\\(null\\)`));
    }
    for (const schalter of ['zeitAktiv', 'kostenAktiv', 'termineAktiv']) {
      expect(rechner, `${schalter} ist vorgewählt`).toMatch(new RegExp(`const \\[${schalter}, set\\w+\\] = useState\\(false\\)`));
    }
  });

  it('meldet den CTA-Klick nicht als Berechnung', () => {
    const rechner = QUELLEN.get('src/components/TelefonRechner.tsx')!;
    expect(rechner).not.toMatch(/_completed/);
    expect(rechner).toMatch(/trackEvent\("price_calculated"\)/);
    expect(rechner).toMatch(/trackEvent\("roi_calculated"\)/);
  });
});

describe('Kein Preisdeckel — die Prosa sagt, wie abgerechnet wird', () => {
  const copy = QUELLEN.get('src/lib/telefonassistent-copy.ts')!;

  it('behauptet in keiner gerenderten Konstante einen Deckel oder eine Obergrenze', () => {
    /*
      Geprüft wird der Quelltext OHNE Kommentare: Die Begründung der Korrektur
      zitiert die alten Sätze absichtlich.
    */
    const ohneKommentare = nurCode(copy);
    expect(ohneKommentare).not.toMatch(/Obergrenze|gedeckelt|Höchstpreis|Mehr zahlen Sie in diesem Monat nicht/);
  });

  it('hält Abrechnung und Rechnungsausweis an genau einer Stelle', () => {
    expect(copy).toContain('abrechnungGeltung:');
    const treffer = [...copy.matchAll(/Einen Preisdeckel gibt es nicht/g)];
    expect(treffer).toHaveLength(1);
  });
});

/* ──────────────────────────────────────────────────────────────────────────
   7 · DER AUTOMATISIERUNGS-RECHNER (/kosten-automatisierung)

   Zweiter öffentlicher Rechner seit dem 12.09.2026. Er darf drei Dinge nicht
   tun, und alle drei sind Wiederholungen von Fehlern, die diese Datei schon
   einmal abstellen musste:

     1. Arithmetik im Bauteil statt im Kern.
     2. Einen eigenen Wochenfaktor oder Vorgabewert tippen.
     3. Zahlen des Besuchers an GA4 melden.

   Punkt 3 ist der wichtigste. Die Ereignisnamen sind eine geschlossene Union,
   und `trackEvent` nimmt neben dem Namen nur ein handgeschriebenes Label — es
   gibt also keinen Parameter, durch den ein Betrag geraten könnte. Geprüft
   wird trotzdem der Aufrufort: dass dort nichts steht, was nach einer Variablen
   aussieht. Ein Typ schützt vor Versehen, nicht vor einer späteren Erweiterung.
   ────────────────────────────────────────────────────────────────────────── */
describe('Automatisierungs-Rechner', () => {
  const KERN = 'src/lib/automatisierung-rechner.ts';
  const BAUTEIL = 'src/components/AutomatisierungRechner.tsx';

  it('rechnet ausschließlich im Kern, nie im Bauteil', () => {
    const bauteil = nurCode(QUELLEN.get(BAUTEIL)!);
    // Die Kernfunktion ist der einzige Weg zu einem Ergebnis.
    expect(bauteil).toMatch(/berechneWirtschaftlichkeit\(/);
    // Und keine der Formeln steht hier noch einmal.
    for (const formel of [
      /reduzierbarerAnteilProzent\s*(as number)?\s*\)?\s*\/\s*100/,
      /vermeidbarerAnteilProzent\s*(as number)?\s*\)?\s*\/\s*100/,
      /einmaligEur\s*\/\s*/,
      /\*\s*12\b/,
    ]) {
      expect(formel.test(bauteil), `${BAUTEIL} rechnet selbst: ${formel}`).toBe(false);
    }
  });

  it('liest den Wochenfaktor aus der gemeinsamen Quelle', () => {
    const kern = QUELLEN.get(KERN)!;
    expect(kern).toMatch(/from "@\/lib\/zeitrechnung"/);
    // Kein Betrag und kein Faktor als Literal im Kern.
    expect(/(^|[^\d.])4\.3{1,2}([^\d]|$)/.test(nurCode(kern))).toBe(false);
  });

  it('setzt keinen einzigen Wirtschaftswert voreingestellt', () => {
    const bauteil = nurCode(QUELLEN.get(BAUTEIL)!);
    /*
      Jeder Zustand startet auf null. Ein `useState<number | null>(45)` wäre
      eine Behauptung über den Betrieb des Besuchers — genau der Fehler, den
      der Telefon-Rechner am 11.09.2026 abgelegt hat.
    */
    const zustaende = [...bauteil.matchAll(/useState<number \| null>\(([^)]*)\)/g)].map((m) => m[1].trim());
    expect(zustaende.length).toBeGreaterThan(4);
    for (const start of zustaende) {
      expect(start, `${BAUTEIL} belegt ein Zahlenfeld vor`).toBe('null');
    }
  });

  it('meldet an GA4 nur Ereignisnamen und handgeschriebene Label', () => {
    const bauteil = nurCode(QUELLEN.get(BAUTEIL)!);
    const aufrufe = [...bauteil.matchAll(/trackEvent\(([^)]*)\)/g)].map((m) => m[1]);
    expect(aufrufe.length).toBeGreaterThan(0);
    for (const argumente of aufrufe) {
      // Jedes Argument muss ein String-Literal sein. Ein Bezeichner an dieser
      // Stelle wäre der Weg, auf dem eine Geschäftszahl das Haus verlässt.
      for (const arg of argumente.split(',').map((a) => a.trim()).filter(Boolean)) {
        expect(/^"[^"]*"$/.test(arg), `${BAUTEIL}: trackEvent(… ${arg} …) übergibt kein Literal`).toBe(true);
      }
    }
  });

  it('nennt keine der Rechengrößen in einem Ereignisnamen', () => {
    const consent = nurCode(QUELLEN.get('src/lib/consent.ts')!);
    const union = consent.slice(consent.indexOf('export type ConversionEvent'), consent.indexOf('export function trackEvent'));
    expect(union).toMatch(/'automation_roi_started'/);
    expect(union).toMatch(/'automation_roi_completed'/);
    expect(union).toMatch(/'automation_cta_clicked'/);
    for (const verboten of [/stunden/i, /kosten_?eur/i, /invest/i, /amortis/i, /netto/i, /ersparnis/i, /roi_wert/i]) {
      expect(verboten.test(union), `ConversionEvent enthält einen Namen mit ${verboten}`).toBe(false);
    }
  });

  it('verriegelt das Ergebnis hinter keinem Formular', () => {
    const bauteil = QUELLEN.get(BAUTEIL)!;
    for (const gate of [/<form/, /type="email"/, /type="tel"/, /E-Mail-Adresse eingeben/]) {
      expect(gate.test(bauteil), `${BAUTEIL} verriegelt den Rechner mit ${gate}`).toBe(false);
    }
  });
});
