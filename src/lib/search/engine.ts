// ─────────────────────────────────────────────────────────────────────────────
// Bewertung der Seitensuche.
//
// Ein Treffer entsteht aus drei Schichten:
//
//   1. WORTTREFFER — jedes Suchwort wird gegen Beschriftung, Titel, Begriffe,
//      Pfad und Beschreibung geprüft: exakt, als Wortanfang („telef" → Telefon),
//      als Bestandteil eines Kompositums („arzt" → Zahnarztpraxis) und mit
//      Tippfehler-Toleranz. Seiten, die ALLE Suchwörter treffen, liegen klar vor
//      Seiten, die nur eines treffen.
//
//   2. ABSICHT — aus der Eingabe werden Facetten gelesen: Leistung, Branche,
//      Standort, Seitenart. Eine Seite mit derselben Facette steigt, eine Seite
//      mit einer ANDEREN Facette derselben Achse fällt deutlich. „Webdesign
//      München" bringt so nie die Bayreuther Seite nach vorn, und „Was kostet"
//      führt zur Preisseite statt zur Leistungsübersicht.
//
//   3. GEWICHT — bei Gleichstand stehen Einstiegsseiten vor Nischenseiten.
//
// Ganze Sätze als Phrase zu treffen („Anrufe gehen verloren") wiegt am schwersten:
// Das ist die Formulierung, die der Besucher selbst wählt.
// ─────────────────────────────────────────────────────────────────────────────
import { FACETS, KIND_TERMS, type Facet, type FacetAxis, type SearchKind } from './lexicon';
import type { SearchDocument } from './index';
import { editDistance, fold, fuzzyBudget, tokenize } from './normalize';

export interface SearchResult {
  readonly doc: SearchDocument;
  readonly score: number;
  /** Was die Seite getroffen hat — Facettenbezeichnungen und Suchwörter. */
  readonly matched: readonly string[];
}

export interface QueryIntent {
  readonly tokens: readonly string[];
  readonly facets: readonly Facet[];
  readonly kinds: readonly SearchKind[];
}

// Die Beschriftung wiegt am meisten: Wer „KI" tippt, meint die Seite, die so heißt,
// nicht jede Seite, die das Wort in den Schlagwörtern führt.
const FIELD_WEIGHT = { label: 12, term: 10, title: 9, path: 7, desc: 4 } as const;

/** Reihenfolge der Leistungen bei Gleichstand — wie in der Navigation. */
const SERVICE_RANK: Readonly<Record<string, number>> = { telefon: 0, webdesign: 1, automatisierung: 2 };

function serviceRank(doc: SearchDocument): number {
  const ranks = doc.facets.filter((f) => f.axis === 'service').map((f) => SERVICE_RANK[f.id] ?? 3);
  return ranks.length === 0 ? 3 : Math.min(...ranks);
}
const MAX_RESULTS = 8;
const MIN_QUERY_LENGTH = 2;

/** Wie gut passt ein Suchwort zu einem Dokumentwort? 0 = gar nicht. */
function matchQuality(q: string, d: string): number {
  if (q === d) return 1;
  if (q.length >= 3 && d.startsWith(q)) return 0.8;
  if (d.length >= 4 && q.startsWith(d)) return 0.65;
  if (q.length >= 4 && d.includes(q)) return 0.6;
  if (d.length >= 4 && q.includes(d)) return 0.5;
  const budget = fuzzyBudget(q);
  if (budget > 0 && Math.abs(q.length - d.length) <= budget) {
    const dist = editDistance(q, d, budget);
    if (dist <= budget) return budget === 1 ? 0.55 : 0.4;
  }
  return 0;
}

function bestInField(q: string, field: ReadonlySet<string>): { quality: number; token: string } {
  let best = 0;
  let bestToken = '';
  for (const d of field) {
    const quality = matchQuality(q, d);
    if (quality > best) {
      best = quality;
      bestToken = d;
      if (best === 1) break;
    }
  }
  return { quality: best, token: bestToken };
}

/** Steht jedes Wort des Begriffs in der Eingabe (exakt oder als Wortanfang)? */
function termInQuery(termTokens: readonly string[], queryTokens: readonly string[]): boolean {
  if (termTokens.length === 0) return false;
  return termTokens.every((t) =>
    queryTokens.some((q) => q === t || (q.length >= 4 && (q.startsWith(t) || t.startsWith(q))) ||
      (t.length >= 7 && Math.abs(q.length - t.length) <= 1 && editDistance(q, t, 1) <= 1))
  );
}

export function readIntent(query: string): QueryIntent {
  const tokens = tokenize(query);
  const facets = FACETS.filter((f) =>
    [f.label, ...f.terms].some((term) => termInQuery(tokenize(term), tokens))
  );
  const kinds = (Object.keys(KIND_TERMS) as SearchKind[]).filter((kind) =>
    KIND_TERMS[kind].some((term) => termInQuery(tokenize(term), tokens))
  );
  return { tokens, facets, kinds };
}

function facetBonus(doc: SearchDocument, intent: QueryIntent): { bonus: number; labels: string[] } {
  let bonus = 0;
  const labels: string[] = [];
  const axes: FacetAxis[] = ['service', 'industry', 'city'];

  for (const axis of axes) {
    const wanted = intent.facets.filter((f) => f.axis === axis);
    const have = doc.facets.filter((f) => f.axis === axis);

    if (wanted.length === 0) {
      // Keine Angabe auf dieser Achse: allgemeine Seiten vor spezifischen.
      if (have.length > 0) {
        if (axis === 'city') bonus -= have.some((f) => f.region) ? 3 : 6;
        if (axis === 'industry') bonus -= 2;
        if (axis === 'service') bonus -= 1;
      }
      continue;
    }

    let axisBest = -Infinity;
    for (const w of wanted) {
      let v: number;
      if (have.some((h) => h.id === w.id)) {
        v = 9;
        labels.push(w.label);
      } else if (have.some((h) => h.parent === w.id)) {
        v = 5; // Zahnarzt-Seite bei Suche nach „Arzt"
      } else if (w.parent && have.some((h) => h.id === w.parent)) {
        v = 4; // Arzt-Seite bei Suche nach „Zahnarzt"
      } else if (have.length === 0) {
        v = axis === 'city' ? -2 : 0;
      } else {
        // Andere Facette derselben Achse: deutlich nach hinten.
        const mild = axis === 'city' && (w.region || have.every((h) => h.region));
        v = axis === 'city' ? (mild ? -5 : -14) : axis === 'industry' ? -10 : -9;
      }
      if (v > axisBest) axisBest = v;
    }
    bonus += axisBest;
  }
  return { bonus, labels };
}

function kindBonus(doc: SearchDocument, intent: QueryIntent): number {
  if (intent.kinds.includes(doc.kind)) return 10;
  let bonus = 0;
  // Nur ein Ort genannt („Bayreuth"): die Stadtseite ist der Einstieg, nicht
  // eine der Leistungsseiten dieser Stadt. Nur eine Leistung genannt
  // („Automatisierung"): die Leistungsübersicht, nicht eine Branchenseite.
  if (doc.kind === 'standort' && isPureFacetQuery(intent, 'city')) bonus += 5;
  if (
    doc.kind === 'leistung' &&
    isPureFacetQuery(intent, 'service') &&
    doc.facets.every((f) => f.axis === 'service') &&
    doc.facets.some((f) => intent.facets.some((w) => w.id === f.id))
  ) {
    bonus += 5;
  }
  // Ratgeber erst, wenn danach gefragt wird: Wer „Telefonassistent Restaurant"
  // tippt, meint das Angebot, nicht den Artikel dazu.
  if (doc.kind === 'ratgeber' && !intent.kinds.includes('ratgeber')) bonus -= 5;
  if (doc.kind === 'rechtliches' && !intent.kinds.includes('rechtliches')) bonus -= 6;
  if (doc.kind === 'preise' && !intent.kinds.includes('preise')) bonus -= 1;
  return bonus;
}

function countWords(text: string): number {
  return text.length === 0 ? 0 : text.split(' ').length;
}

/** Enthält `haystack` die Wortfolge `needle` an Wortgrenzen? */
function containsWords(haystack: string, needle: string): boolean {
  if (needle.length === 0 || haystack.length === 0) return false;
  return ` ${haystack} `.includes(` ${needle} `);
}

/** Besteht die Eingabe ausschließlich aus Wörtern EINER Facettenachse? */
function isPureFacetQuery(intent: QueryIntent, axis: FacetAxis): boolean {
  const own = intent.facets.filter((f) => f.axis === axis);
  if (own.length === 0 || intent.facets.length !== own.length) return false;
  const words = new Set(own.flatMap((f) => [f.label, ...f.terms].flatMap((t) => tokenize(t))));
  return intent.tokens.every((t) => words.has(t));
}

export function searchSite(index: readonly SearchDocument[], query: string): SearchResult[] {
  const trimmed = query.trim();
  if (trimmed.length < MIN_QUERY_LENGTH) return [];

  const intent = readIntent(trimmed);
  if (intent.tokens.length === 0) return [];
  const phrase = tokenize(trimmed, { keepStopwords: true }).join(' ');
  const phraseWords = countWords(phrase);
  const corePhrase = intent.tokens.join(' ');

  const results: SearchResult[] = [];

  for (const doc of index) {
    let tokenScore = 0;
    let matchedCount = 0;
    const matchedWords: string[] = [];

    for (const q of intent.tokens) {
      const candidates: Array<{ field: ReadonlySet<string>; weight: number }> = [
        { field: doc.labelTokens, weight: FIELD_WEIGHT.label },
        { field: doc.termTokens, weight: FIELD_WEIGHT.term },
        { field: doc.titleTokens, weight: FIELD_WEIGHT.title },
        { field: doc.pathTokens, weight: FIELD_WEIGHT.path },
        { field: doc.descTokens, weight: FIELD_WEIGHT.desc },
      ];
      let best = 0;
      let bestToken = '';
      for (const { field, weight } of candidates) {
        const { quality, token } = bestInField(q, field);
        const value = quality * weight;
        if (value > best) {
          best = value;
          bestToken = token;
        }
      }
      if (best > 0) {
        matchedCount += 1;
        tokenScore += best;
        const word = doc.display.get(bestToken) ?? doc.display.get(q);
        if (word) matchedWords.push(word);
      }
    }

    if (matchedCount === 0) continue;

    const coverage = matchedCount / intent.tokens.length;
    let score = tokenScore * (0.35 + 0.65 * coverage * coverage);

    // Phrasentreffer: die eigene Formulierung des Besuchers. Nur für mehrere
    // Wörter und nur an Wortgrenzen — ein einzelnes „Webdesign" ist keine Phrase
    // und darf nicht jede Seite treffen, deren Absichtssatz das Wort enthält.
    if (phraseWords >= 2 && doc.phrases.some((p) => containsWords(p, phrase) || (countWords(p) >= 2 && containsWords(phrase, p)))) {
      score += 18;
    } else if (intent.tokens.length >= 2 && containsWords(doc.titlePhrase, corePhrase)) {
      score += 10;
    }

    const { bonus, labels } = facetBonus(doc, intent);
    score += bonus;
    score += kindBonus(doc, intent);
    score += doc.weight * 6;

    if (score <= 0) continue;

    // Facettenbezeichnung vor Einzelwort; ein Wort, das die Bezeichnung schon
    // trägt („Arzt" neben „Arztpraxis"), wird nicht noch einmal genannt.
    const foldedLabels = labels.map((l) => fold(l));
    const extraWords = matchedWords.filter((w) => {
      const fw = fold(w);
      return !foldedLabels.some((l) => l.includes(fw) || fw.includes(l));
    });
    const matched = [...new Set([...labels, ...extraWords])].slice(0, 3);
    results.push({ doc, score, matched });
  }

  results.sort(
    (a, b) =>
      b.score - a.score ||
      b.doc.weight - a.doc.weight ||
      serviceRank(a.doc) - serviceRank(b.doc) ||
      a.doc.path.length - b.doc.path.length ||
      a.doc.path.localeCompare(b.doc.path)
  );

  return results.slice(0, MAX_RESULTS);
}
