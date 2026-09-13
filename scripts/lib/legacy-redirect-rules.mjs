// ─────────────────────────────────────────────────────────────────────────────
// SHARED SOURCE OF TRUTH FOR RETIRED-ROUTE REDIRECT RULES.
//
// Same role as ./private-routing.mjs: one dependency-free module that several
// consumers read, instead of each of them holding its own opinion. Consumers:
//
//   .github/scripts/test-seo-consistency.mjs   — the retired route is declared,
//                                                served as 301, gone from the
//                                                manifest, the router and the
//                                                sitemap, and never chains.
//   .github/scripts/test-prerender-output.mjs  — the Netlify artifact contains
//                                                no trailing-slash rule EXCEPT
//                                                a declared legacy migration.
//   src/lib/routing/legacyRedirects.test.ts    — proves both directions of that
//                                                rule with synthetic tables.
//
// WHY THIS MODULE EXISTS AT ALL — the defect it was extracted from.
//
// Until 2026-09-13 the two CI scripts disagreed about one line. The seo gate
// REQUIRED `/automatisierung-unternehmen/ -> /prozessautomatisierung 301` (the
// slashed form of a retired route: without it an old backlink to the slashed
// variant answers 404, because a retired route has no file left for the host to
// normalise to). The prerender gate, in Netlify mode, FORBADE every rule whose
// source ends in `/` — a guard written against generated trailing-slash
// CANONICALISATION of live routes, which Netlify documents as unreliable and
// which can loop. Both rules were right about their own subject and neither
// knew about the other, so the branch could not be green on both.
//
// The distinction they were missing is semantic, not syntactic: canonicalising
// a LIVE url's slashed variant is forbidden; migrating a DECLARED RETIRED url
// is required. That distinction can only be drawn against the declaration, so
// the declaration — and the check that reads it — live here, once.
// ─────────────────────────────────────────────────────────────────────────────

/** Where the declaration lives, relative to the repository root. */
export const LEGACY_REDIRECTS_SOURCE = 'src/lib/routing/legacyRedirects.ts';

/**
 * Reads the `LEGACY_REDIRECTS` table out of the TypeScript source as [from, to]
 * pairs.
 *
 * Parsed from text rather than imported: these consumers are plain Node scripts
 * with no TypeScript loader, and the repository's rule is that .mjs scripts
 * never import src/*.ts directly (see the header of publicRoutes.ts). The
 * pattern is the conservative one already used across .github/scripts: match the
 * literal, not the language.
 *
 * THROWS when the table is declared but nothing parses. Returning an empty list
 * there would be the dangerous direction — every "is this rule declared?"
 * question would silently answer no, and in a consumer that treats a declared
 * rule as ALLOWED the guard would simply stop allowing (loud, fine), while in a
 * consumer that treats declarations as things to CHECK the checks would vanish
 * (silent, not fine). A reformatted table must fail here, visibly.
 */
export function parseLegacyRedirects(source) {
  const marker = source.indexOf('LEGACY_REDIRECTS');
  if (marker === -1) return [];
  const body = source.slice(marker);
  const pairs = [...body.matchAll(/^\s*'(\/[^']*)':\s*'(\/[^']*)',/gm)].map((m) => [m[1], m[2]]);
  if (!pairs.length) {
    throw new Error(
      `${LEGACY_REDIRECTS_SOURCE} declares LEGACY_REDIRECTS but no '/from': '/to' entry could be parsed — ` +
        'the table was reformatted and every consumer of this module is now blind. Fix the parser here, once.'
    );
  }
  return pairs;
}

/** The trailing-slash form of a retired source. One spelling, one place. */
export function slashVariant(path) {
  return `${path}/`;
}

/**
 * Netlify-mode contract for trailing-slash rules in the built `_redirects`.
 *
 * @param rules       every non-comment rule as a whitespace-split array,
 *                    e.g. ['/from', '/to', '301'].
 * @param legacyPairs output of parseLegacyRedirects().
 * @returns array of human-readable failures; empty means the contract holds.
 *
 * FORBIDDEN, unchanged from the original guard: any trailing-slash rule that is
 * not the slashed form of a declared retired route. That is what a generated
 * `/live-route/ -> /live-route` canonicalisation looks like, and it still fails.
 *
 * ALLOWED, and only under all six conditions together:
 *   1. its non-slash source is declared in LEGACY_REDIRECTS,
 *   2. its target is exactly that declaration's target,
 *   3. its status is a plain permanent 301,
 *   4. it is not forced syntax (`301!`),
 *   5. the non-slash form exists with the identical target and status,
 *   6. the target is not itself a retired source (no chain).
 *
 * Conditions 1–2 and 6 overlap with the seo-consistency gate on purpose: this
 * function reads the BUILT artifact, that one reads the committed file, and a
 * migration is only real if it survives the build.
 */
export function checkNetlifyTrailingSlashRules(rules, legacyPairs) {
  const failures = [];
  const legacyTargetFor = new Map(legacyPairs);
  const retiredSources = new Set(legacyPairs.map(([from]) => from));

  const slashRules = rules.filter((r) => r[0].endsWith('/') && r[0] !== '/' && r[0] !== '/*');

  const undeclared = [];
  for (const rule of slashRules) {
    const [source, target, status = ''] = rule;
    const nonSlash = source.slice(0, -1);

    // (1) Not a declared migration -> this is canonicalisation, which stays banned.
    if (!legacyTargetFor.has(nonSlash)) {
      undeclared.push(source);
      continue;
    }

    const declaredTarget = legacyTargetFor.get(nonSlash);

    // (2) Target must be the declared one, not merely some target.
    if (target !== declaredTarget) {
      failures.push(
        `${source} redirects to ${target}, but ${LEGACY_REDIRECTS_SOURCE} declares ${nonSlash} -> ${declaredTarget}`
      );
    }

    // (3)+(4) Plain permanent only. "301!" is forced syntax and is refused here
    // as well as by the separate forced-redirect check, so neither can be
    // relaxed without the other noticing.
    if (status !== '301') {
      failures.push(
        `${source} is served as "${status || '(no status)'}"; a retired route must be a plain permanent 301, never forced or temporary`
      );
    }

    // (5) The slashed form may never be the only one: the canonical spelling is
    // the unslashed url, and that is the one backlinks and the sitemap used.
    const nonSlashRule = rules.find((r) => r[0] === nonSlash);
    if (!nonSlashRule) {
      failures.push(`${source} exists but ${nonSlash} does not — the canonical form must redirect too`);
    } else if (nonSlashRule[1] !== target || (nonSlashRule[2] || '') !== status) {
      failures.push(
        `${nonSlash} and ${source} disagree: "${nonSlashRule.slice(1).join(' ')}" vs "${rule.slice(1).join(' ')}"`
      );
    }

    // (6) No chain. One hop is the whole point of a migration.
    if (retiredSources.has(declaredTarget)) {
      failures.push(`${source} -> ${declaredTarget}, and ${declaredTarget} is itself retired — redirect chain`);
    }
  }

  if (undeclared.length) {
    failures.push(
      `generated trailing-slash rules must not exist: ${undeclared.join(', ')} — ` +
        `only the slashed form of a route declared in ${LEGACY_REDIRECTS_SOURCE} may carry one`
    );
  }

  return failures;
}
