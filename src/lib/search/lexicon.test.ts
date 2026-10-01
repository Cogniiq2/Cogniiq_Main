import { describe, expect, it } from 'vitest';
import { PUBLIC_ROUTES } from '@/lib/routing/publicRoutes';
import { PROTECTED_EXPERIMENT_PATHS } from '@/lib/routing/protectedExperiments';
import { EXCLUDED_PATHS, FACETS, PAGE_ENRICHMENT } from './lexicon';

describe('Wortschatz der Seitensuche', () => {
  it('nennt keine eingefrorene Experimentroute beim Pfad', () => {
    // Die Experimente werden ausschließlich über pfadabgeleitete Facetten
    // gefunden. Ein Eintrag hier wäre eine zusätzliche Erwähnung im Quellbaum,
    // die src/protectedExperiments.test.tsx als Topologieänderung zählt.
    for (const path of PROTECTED_EXPERIMENT_PATHS) {
      expect(PAGE_ENRICHMENT).not.toHaveProperty(path);
      expect(EXCLUDED_PATHS.has(path)).toBe(false);
    }
  });

  it('ergänzt nur Pfade, die das Manifest kennt', () => {
    const known = new Set(PUBLIC_ROUTES.map((r) => r.path));
    for (const path of Object.keys(PAGE_ENRICHMENT)) {
      expect(known.has(path), `${path} fehlt in PUBLIC_ROUTES`).toBe(true);
    }
  });

  it('hat je Achse eindeutige Facetten mit gültigen Eltern', () => {
    const ids = new Set<string>();
    for (const f of FACETS) {
      expect(ids.has(f.id)).toBe(false);
      ids.add(f.id);
      if (f.parent) {
        const parent = FACETS.find((p) => p.id === f.parent);
        expect(parent?.axis).toBe(f.axis);
      }
    }
  });
});
