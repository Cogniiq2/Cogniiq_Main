import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

// FALSIFICATION TEST — QA fixtures must not be reachable from production source.
//
// The fixture layer under `scripts/qa/fixtures/` fabricates customers, invoices, offers and
// German company names. If any of it were reachable from `src/`, Vite would bundle it and a
// real user could be shown invented business records. This test is the thing that makes
// "test-only" a checked property rather than a comment.
//
// It is deliberately written to FAIL if someone adds the import — that is the point. To see
// it work, add `import { tables } from '../../scripts/qa/fixtures/tables.mjs'` anywhere in
// `src/` and run this file.

const ROOT = resolve(__dirname, '../..');
const SRC = join(ROOT, 'src');
const FIXTURE_DIR = join(ROOT, 'scripts/qa/fixtures');

function walk(dir: string, extensions: string[]): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...walk(full, extensions));
    } else if (extensions.some((ext) => entry.endsWith(ext))) {
      out.push(full);
    }
  }
  return out;
}

const SRC_FILES = walk(SRC, ['.ts', '.tsx']);

/**
 * The files Vite can actually reach from `index.html`. Test files are excluded from the
 * production graph by `vite.config.ts`, so a fixture-shaped string inside a `.test.tsx` is
 * not a leak — asserting otherwise would only teach people to weaken this file.
 */
const SHIPPED_FILES = SRC_FILES.filter(
  (file) => !/\.test\.tsx?$/.test(file) && !file.includes(`${sep}test${sep}`),
);

/** Every module specifier in a file, from static imports, re-exports and dynamic import(). */
function moduleSpecifiers(source: string): string[] {
  const specifiers: string[] = [];
  const patterns = [
    /(?:^|\n)\s*import\s[^;]*?from\s*['"]([^'"]+)['"]/g,
    /(?:^|\n)\s*import\s*['"]([^'"]+)['"]/g,
    /(?:^|\n)\s*export\s[^;]*?from\s*['"]([^'"]+)['"]/g,
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) specifiers.push(match[1]);
  }
  return specifiers;
}

describe('QA fixtures are unreachable from production source', () => {
  it('no file under src/ imports anything from scripts/', () => {
    const offenders: string[] = [];

    for (const file of SRC_FILES) {
      const source = readFileSync(file, 'utf8');
      for (const specifier of moduleSpecifiers(source)) {
        const reachesScripts =
          specifier.includes('scripts/qa') ||
          specifier.includes('qa/fixtures') ||
          /^(\.\.\/)+scripts\//.test(specifier) ||
          specifier.startsWith('@/../scripts');
        if (reachesScripts) offenders.push(`${relative(ROOT, file)} → ${specifier}`);
      }
    }

    expect(offenders, `production source must not import QA fixtures:\n${offenders.join('\n')}`).toEqual([]);
  });

  it('no file under src/ imports a .mjs module at all', () => {
    // The fixture layer is the only .mjs in the repository that could plausibly be pulled
    // in, and `src/` is TypeScript throughout. Forbidding the extension outright closes the
    // path that a relative specifier without the word "scripts" would otherwise leave open.
    const offenders: string[] = [];
    for (const file of SRC_FILES) {
      for (const specifier of moduleSpecifiers(readFileSync(file, 'utf8'))) {
        if (specifier.endsWith('.mjs')) offenders.push(`${relative(ROOT, file)} → ${specifier}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('the fixture layer lives entirely under scripts/qa', () => {
    expect(existsSync(FIXTURE_DIR)).toBe(true);
    const fixtureFiles = walk(FIXTURE_DIR, ['.mjs', '.ts', '.tsx', '.js']);
    expect(fixtureFiles.length).toBeGreaterThan(0);
    for (const file of fixtureFiles) {
      expect(relative(ROOT, file).startsWith('scripts/qa/')).toBe(true);
    }
  });

  it('no fixture-only marker string appears anywhere in src/', () => {
    // Distinctive literals that exist only in the fixture layer. If one of them turns up in
    // `src/`, fixture data has been copied into the product even without an import.
    const markers = ['qa-fixture.', 'Musterbau Heizungstechnik', 'Nordlicht Energieverbund', 'qa fixture gap'];
    const offenders: string[] = [];
    for (const file of SHIPPED_FILES) {
      const source = readFileSync(file, 'utf8');
      for (const marker of markers) {
        if (source.includes(marker)) offenders.push(`${relative(ROOT, file)} contains "${marker}"`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('the built bundle contains no fixture data, when a build is present', () => {
    // Only meaningful after `npm run build`; skipped rather than failed on a clean checkout,
    // because the static checks above already hold unconditionally.
    const dist = join(ROOT, 'dist/assets');
    if (!existsSync(dist)) return;

    const offenders: string[] = [];
    for (const file of walk(dist, ['.js', '.css'])) {
      const source = readFileSync(file, 'utf8');
      for (const marker of ['Musterbau Heizungstechnik', 'Nordlicht Energieverbund', 'qa-fixture.']) {
        if (source.includes(marker)) offenders.push(`${relative(ROOT, file)} contains "${marker}"`);
      }
    }
    expect(offenders, `QA fixture data leaked into the production bundle:\n${offenders.join('\n')}`).toEqual([]);
  });
});
