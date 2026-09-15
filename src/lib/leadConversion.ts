// ─────────────────────────────────────────────────────────────────────────────
// WELCHE BESTÄTIGTE ANFRAGE WURDE SCHON GEMELDET?
//
// `lead_submitted` ist das einzige Ereignis der öffentlichen Website, das ein
// Ergebnis meldet und keine Absicht. Genau deshalb ist es das einzige, bei dem
// eine Doppelmeldung nicht bloss Rauschen ist, sondern die Kennzahl verfälscht:
// eine Anfrage, die zweimal gezählt wird, verdoppelt die gemessene
// Konversionsrate der Seite, auf der sie entstanden ist.
//
// WARUM EIN REF IM BAUTEIL NICHT REICHT. Die Dankeseite wird nach einem
// gelesenen 2xx mit `state.submitted` angesteuert. Dieser Zustand gehört zum
// HISTORY-EINTRAG, nicht zum Mount — er bleibt dort liegen, solange der Eintrag
// existiert. Ein `useRef`-Riegel lebt dagegen nur so lange wie die Instanz des
// Bauteils. Drei reale Abläufe überleben ihn:
//
//   • REMOUNT — gemessen, nicht vermutet: eine zweite Montage desselben
//     Eintrags meldete vor dieser Datei nachweislich ein zweites Mal.
//   • ZURÜCK — der Besucher verlässt die Dankeseite und geht zurück. Der
//     Eintrag trägt `state.submitted` unverändert, das Bauteil montiert neu.
//   • NEU LADEN — react-router legt `location.state` in `window.history.state`
//     ab. Ein Reload stellt ihn wieder her; für das Bauteil sieht das aus wie
//     eine frische, bestätigte Anfrage.
//
// Die Abhilfe ist nicht ein stärkerer Riegel, sondern eine IDENTITÄT: jede
// bestätigte Übermittlung bekommt beim Versand eine eigene Kennung, und
// gemeldet wird eine Kennung genau einmal. Damit fällt die Unterscheidung
// zusammen, auf die es ankommt — dieselbe Anfrage noch einmal ansehen ist
// keine neue Anfrage, eine zweite echte Übermittlung erzeugt eine neue Kennung
// und wird gemeldet.
//
// Die Kennung ist ein Zufallswert ohne Bezug zur Person: sie entsteht im
// Browser, wird nie an GA4 übergeben (dorthin geht nur das Formular-Label) und
// nie an den Endpunkt geschickt. Sie ist kein Identifikator des Besuchers und
// darf nie einer werden.
//
// Ablage in `sessionStorage`: pro Tab, endet mit dem Tab, übersteht aber den
// Reload — genau der Geltungsbereich, den ein Versandvorgang hat. localStorage
// wäre zu weit (ein Besucher, der nächste Woche erneut anfragt, muss erneut
// gezählt werden), ein Modul-Set zu eng (überlebt keinen Reload). Ist der
// Speicher nicht verfügbar — privates Fenster, blockierte Site-Daten —, greift
// das Modul-Set als ehrlich schwächerer Rückfall: es deckt Remount und Zurück
// ab, den Reload nicht.
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'cogniiq_reported_leads';

/** Obergrenze der mitgeführten Kennungen. Ein Tab erzeugt realistisch eine,
 *  vielleicht zwei; die Grenze verhindert nur, dass ein pathologischer Fall
 *  den Speicher füllt. Älteste fallen zuerst heraus. */
const MAX_IDS = 20;

/** Rückfall für den Fall, dass `sessionStorage` nicht lesbar oder schreibbar
 *  ist. Modulweit, also überlebt er Remount und Zurück innerhalb derselben
 *  Seitensitzung — aber keinen Reload. Das ist die Grenze, und sie wird hier
 *  benannt statt kaschiert. */
const imSpeicher = new Set<string>();

/** Erzeugt die Kennung einer bestätigten Übermittlung. */
export function neueLeadKennung(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  // Kein Krypto-Bedarf: die Kennung muss innerhalb eines Tabs eindeutig sein,
  // nicht unvorhersagbar.
  return `lead-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function lesen(): string[] {
  try {
    const roh = sessionStorage.getItem(STORAGE_KEY);
    if (!roh) return [];
    const wert: unknown = JSON.parse(roh);
    return Array.isArray(wert) ? wert.filter((e): e is string => typeof e === 'string') : [];
  } catch {
    return [];
  }
}

function schreiben(ids: string[]): boolean {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ids.slice(-MAX_IDS)));
    return true;
  } catch {
    return false;
  }
}

/**
 * Meldet diese Kennung als gemeldet an und sagt, ob das der ERSTE Anlauf war.
 *
 * `true` genau einmal je Kennung — der Aufrufer löst das Ereignis nur dann aus.
 * Bewusst ein Test-and-set in einer Funktion und nicht zwei (`istGemeldet` +
 * `merken`): zwei Aufrufe laden dazu ein, zwischen ihnen etwas anderes zu tun,
 * und genau dort entsteht die Doppelmeldung wieder.
 */
export function leadAlsGemeldetVormerken(id: string): boolean {
  if (!id) return false;
  if (imSpeicher.has(id)) return false;

  const bekannt = lesen();
  if (bekannt.includes(id)) {
    // Aus dem Speicher gelesen, im Modul noch nicht bekannt: das ist der
    // Reload-Fall. Nachziehen, damit spätere Aufrufe ohne Speicherzugriff
    // dieselbe Antwort geben.
    imSpeicher.add(id);
    return false;
  }

  imSpeicher.add(id);
  schreiben([...bekannt, id]);
  return true;
}

/** Nur für Tests: setzt den Modulzustand und den Tab-Speicher zurück. */
export function __leadSpeicherZuruecksetzen(): void {
  imSpeicher.clear();
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* nicht verfügbar — dann gab es auch nichts zu löschen */
  }
}
