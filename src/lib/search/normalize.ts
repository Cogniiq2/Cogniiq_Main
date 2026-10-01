// ─────────────────────────────────────────────────────────────────────────────
// Textnormalisierung für die Seitensuche.
//
// Die Suche muss „Zahnärzte in München", „zahnaerzte muenchen" und „Zahnarzt
// Munchen" als dieselbe Absicht lesen. Dafür wird jeder Text auf eine kanonische
// Form gebracht: Kleinschreibung, Umlaute als ae/oe/ue, ß als ss, Satzzeichen
// entfernt, Stoppwörter gestrichen, Endungen leicht gekürzt. Es ist bewusst kein
// vollständiger Stemmer — für rund hundert Seiten reicht eine Kürzung, die
// „Anrufe" und „Anruf" zusammenführt, ohne „Praxis" zu verstümmeln.
// ─────────────────────────────────────────────────────────────────────────────

/** Umlaute, ß und Akzente auf ASCII falten. Bewusst ohne Unicode-Tabellen. */
export function fold(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/** Alles außer Buchstaben und Ziffern wird zum Trenner. */
export function normalize(text: string): string {
  return fold(text)
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Wörter, die eine Absicht nicht verändern. Ein Satz wie „ich brauche eine
 * Website für meine Praxis" wird zu „website praxis".
 */
const STOPWORDS = new Set(
  (
    'der die das den dem des ein eine einen einem einer eines und oder aber auch ' +
    'ich wir sie ihr mir mich uns ihnen ihre ihren ihrem ihrer ihres mein meine ' +
    'meinen meinem meiner meines unser unsere unseren unserem unserer ' +
    'ist sind war waren bin bist habe hat haben hatte brauche brauchen braucht ' +
    'moechte moechten will wollen wuerde wuerden kann koennen soll sollen muss ' +
    'suche suchen gesucht finde finden zeige zeigen gibt es geht ' +
    'in im an am auf aus bei fuer von vom zu zum zur mit ohne ueber unter nach ' +
    'durch um bis als wie was wer wo wann warum welche welcher welches wieso ' +
    'ja nein nicht kein keine keinen keinem keiner mehr sehr viel viele wenig ' +
    'da dann denn doch noch schon mal nur auch etwas jemand man hallo bitte ' +
    'the a an of for to and or my our is are i we you'
  ).split(' ')
);

export function isStopword(token: string): boolean {
  return STOPWORDS.has(token);
}

/**
 * Leichte Kürzung deutscher Endungen. Nur bei ausreichend langen Wörtern und
 * nur, wenn ein brauchbarer Stamm übrig bleibt.
 */
export function stem(token: string): string {
  if (token.length < 5) return token;
  const suffixes = ['erinnen', 'ungen', 'innen', 'ern', 'en', 'er', 'es', 'em', 'e', 'n', 's'];
  for (const suffix of suffixes) {
    if (token.endsWith(suffix) && token.length - suffix.length >= 4) {
      return token.slice(0, -suffix.length);
    }
  }
  return token;
}

export interface TokenizeOptions {
  /** Stoppwörter behalten (für Phrasen, in denen jedes Wort zählt). */
  keepStopwords?: boolean;
}

/** Gefaltete, gekürzte Wörter ohne Stoppwörter. */
export function tokenize(text: string, options: TokenizeOptions = {}): string[] {
  const words = normalize(text).split(' ').filter(Boolean);
  const kept = options.keepStopwords ? words : words.filter((w) => !isStopword(w));
  // Besteht die Eingabe nur aus Stoppwörtern („was gibt es"), bleibt sie ganz —
  // besser ein schwaches Ergebnis als gar keines.
  const source = kept.length > 0 ? kept : words;
  return source.map(stem);
}

/**
 * Damerau-Levenshtein (optimal string alignment) mit Abbruch über `max`.
 * Für Tippfehler wie „telefonasistent" oder „Webdesgin".
 */
export function editDistance(a: string, b: string, max: number): number {
  if (a === b) return 0;
  const la = a.length;
  const lb = b.length;
  if (Math.abs(la - lb) > max) return max + 1;
  let prev2: number[] = [];
  let prev: number[] = Array.from({ length: lb + 1 }, (_, i) => i);
  for (let i = 1; i <= la; i++) {
    const cur: number[] = [i];
    let rowMin = i;
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        v = Math.min(v, prev2[j - 2] + 1);
      }
      cur[j] = v;
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return max + 1;
    prev2 = prev;
    prev = cur;
  }
  return prev[lb];
}

/** Zulässige Tippfehler je Wortlänge: kurze Wörter nie, lange bis zu zwei. */
export function fuzzyBudget(token: string): number {
  if (token.length < 5) return 0;
  if (token.length < 8) return 1;
  return 2;
}
