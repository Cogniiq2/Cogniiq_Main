// ─────────────────────────────────────────────────────────────────────────────
// Suchindex der öffentlichen Seite.
//
// Quelle ist das Routen-Manifest (publicRoutes.ts) — dieselben Titel und
// Beschreibungen, die der Crawler sieht. Eine neue Route ist damit automatisch
// durchsuchbar. Facetten (Leistung, Branche, Standort) werden aus dem Pfad
// abgeleitet, Ergänzungen kommen aus lexicon.ts, Blogartikel bringen Kategorie
// und Kernbegriff aus blog-data.ts mit.
//
// Der Index wird einmal je Sitzung gebaut (lazy, beim ersten Öffnen der Suche)
// und liegt nicht im Einstiegs-Chunk.
// ─────────────────────────────────────────────────────────────────────────────
import { PUBLIC_ROUTES } from '@/lib/routing/publicRoutes';
import { BLOG_ARTICLES } from '@/lib/blog-data';
import {
  EXCLUDED_PATHS,
  FACETS,
  PAGE_ENRICHMENT,
  type Facet,
  type SearchKind,
} from './lexicon';
import { fold, stem, tokenize } from './normalize';

export interface SearchDocument {
  readonly path: string;
  /** Kurze, lesbare Beschriftung. */
  readonly label: string;
  /** Bereinigter Seitentitel ohne Markenzusatz. */
  readonly title: string;
  readonly description: string;
  readonly kind: SearchKind;
  readonly facets: readonly Facet[];
  /** Grundgewicht 0–1. */
  readonly weight: number;

  // Vorberechnet für die Bewertung.
  readonly labelTokens: ReadonlySet<string>;
  readonly titleTokens: ReadonlySet<string>;
  readonly termTokens: ReadonlySet<string>;
  readonly pathTokens: ReadonlySet<string>;
  readonly descTokens: ReadonlySet<string>;
  /** Gekürzte, gefaltete Absichtssätze — für Phrasentreffer. */
  readonly phrases: readonly string[];
  /** Gekürzter Titel ohne Stoppwörter als Zeichenkette — für Wortfolgen im Titel. */
  readonly titlePhrase: string;
  /** Stamm → Originalwort, für „Trifft: …" in der Anzeige. */
  readonly display: ReadonlyMap<string, string>;
}

const BRAND_SUFFIX = /\s*(\||–|-)\s*Cogniiq\s*$/u;
const BRAND_PREFIX = /^Cogniiq\s*(–|-|\|)\s*/u;

function cleanTitle(raw: string): string {
  return raw.replace(BRAND_SUFFIX, '').replace(BRAND_PREFIX, '').trim();
}

/** Erster Abschnitt des Titels als Beschriftung: „Webdesign Agentur München". */
function labelFromTitle(title: string): string {
  const first = title.split(/\s+(?:\||–|:)\s+/u)[0]?.trim();
  return first && first.length >= 4 ? first : title;
}

function pathTokensOf(path: string): string[] {
  return path.split(/[/-]+/).filter(Boolean);
}

function facetsForPath(path: string): Facet[] {
  const tokens = new Set(pathTokensOf(path));
  const found = FACETS.filter((f) => f.pathTokens.some((t) => tokens.has(t)));
  // Eine Unterfacette (Zahnarzt) zieht ihre Elternfacette (Arzt) nach, damit
  // „Arzt" die Zahnarztseite findet, ohne dass der Pfad das Wort trägt.
  const ids = new Set(found.map((f) => f.id));
  for (const f of found) {
    if (f.parent && !ids.has(f.parent)) {
      const parent = FACETS.find((p) => p.id === f.parent);
      if (parent) {
        found.push(parent);
        ids.add(parent.id);
      }
    }
  }
  return found;
}

function kindForPath(path: string, facets: readonly Facet[]): SearchKind {
  const enriched = PAGE_ENRICHMENT[path]?.kind;
  if (enriched) return enriched;
  if (path.startsWith('/blog')) return 'ratgeber';
  const tokens = new Set(pathTokensOf(path));
  if (tokens.has('kosten')) return 'preise';
  const hasService = facets.some((f) => f.axis === 'service');
  const hasIndustry = facets.some((f) => f.axis === 'industry');
  const hasCity = facets.some((f) => f.axis === 'city');
  if (hasIndustry) return 'branche';
  if (hasCity && !hasService) return 'standort';
  if (hasService) return 'leistung';
  return 'unternehmen';
}

/** Originalwörter je Stamm — für die Anzeige der getroffenen Begriffe. */
function collectDisplay(texts: readonly string[], into: Map<string, string>): void {
  for (const text of texts) {
    for (const word of text.split(/[\s,./()„“"»«|–—:;!?]+/u)) {
      if (word.length < 3) continue;
      const key = stem(fold(word).replace(/[^a-z0-9]/g, ''));
      if (key.length >= 2 && !into.has(key)) into.set(key, word);
    }
  }
}

function tokenSet(texts: readonly string[]): Set<string> {
  const set = new Set<string>();
  for (const text of texts) for (const t of tokenize(text)) set.add(t);
  return set;
}

function phraseKey(text: string): string {
  return tokenize(text, { keepStopwords: true }).join(' ');
}

let cached: readonly SearchDocument[] | null = null;

export function buildSearchIndex(): readonly SearchDocument[] {
  if (cached) return cached;

  const blogBySlug = new Map(BLOG_ARTICLES.map((a) => [a.slug, a]));

  const docs: SearchDocument[] = [];
  for (const route of PUBLIC_ROUTES) {
    if (EXCLUDED_PATHS.has(route.path)) continue;
    if (!route.indexable && !route.path.startsWith('/blog')) {
      // Nicht indexierbare Seiten sind Zwischen- oder Dankeseiten — nie ein Ziel.
      continue;
    }

    const enrichment = PAGE_ENRICHMENT[route.path];
    const facets = facetsForPath(route.path);
    const kind = kindForPath(route.path, facets);
    const title = cleanTitle(route.title);
    const label = enrichment?.label ?? labelFromTitle(title);

    const article = route.path.startsWith('/blog/')
      ? blogBySlug.get(route.path.slice('/blog/'.length))
      : undefined;

    const terms: string[] = [
      ...(enrichment?.terms ?? []),
      ...(route.keywords ? route.keywords.split(',').map((k) => k.trim()) : []),
      ...facets.flatMap((f) => [f.label, ...f.terms]),
    ];
    if (article) terms.push(article.category, article.heroKeyword);

    const phrases = [...(enrichment?.phrases ?? [])];
    const description = article?.excerpt ?? route.description;

    const display = new Map<string, string>();
    collectDisplay([label, title, ...terms, description], display);

    const weight =
      enrichment?.weight ??
      (article ? 0.6 : route.sitemap ? Math.min(1, Math.max(0.3, Number(route.sitemap.priority) || 0.5)) : 0.5);

    docs.push({
      path: route.path,
      label,
      title,
      description,
      kind,
      facets,
      weight,
      labelTokens: tokenSet([label]),
      titleTokens: tokenSet([title]),
      termTokens: tokenSet([...terms, ...phrases]),
      pathTokens: new Set(pathTokensOf(route.path).map(stem)),
      descTokens: tokenSet([description]),
      phrases: phrases.map(phraseKey),
      titlePhrase: tokenize(title).join(' '),
      display,
    });
  }

  cached = docs;
  return docs;
}

/** Nur für Tests: Index neu aufbauen lassen. */
export function resetSearchIndexForTests(): void {
  cached = null;
}
