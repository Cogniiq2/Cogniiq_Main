// ─────────────────────────────────────────────────────────────────────────────
// Der 301 als Zusage, nicht als Absicht.
//
// Eine Konsolidierung scheitert lautlos: Die Regel fehlt, sie zeigt auf eine
// URL, die selbst zurückgezogen ist, die alte URL wird weiter ausgeliefert, oder
// sie steht noch in der Sitemap. Auf der überlebenden Seite sieht in allen vier
// Fällen alles richtig aus.
//
// .github/scripts/test-seo-consistency.mjs prüft dieselben Zusagen gegen die
// ausgelieferten Dateien (_redirects, sitemap.xml, App.tsx). Diese Suite prüft
// die Tabelle selbst — sie läuft auch dann, wenn niemand das mjs-Skript
// aufruft, und sie ist der Ort, an dem die Regeln als Regeln stehen.
// ─────────────────────────────────────────────────────────────────────────────
import { describe, expect, it } from 'vitest';

import {
  LEGACY_REDIRECTS,
  isLegacyRedirectSource,
  legacyRedirectTarget,
} from './legacyRedirects';
import { PUBLIC_ROUTES } from './publicRoutes';
import { PUBLIC_ROUTE_PATHS, isKnownPublicRoute } from './publicRoutePaths';

const EINTRAEGE = Object.entries(LEGACY_REDIRECTS);

describe('zurückgezogene Routen', () => {
  it('führt die Konsolidierung vom 12.09.2026 auf den Pillar', () => {
    expect(LEGACY_REDIRECTS['/automatisierung-unternehmen']).toBe('/prozessautomatisierung');
  });

  it.each(EINTRAEGE)('%s wird nicht mehr als Seite ausgeliefert', (von) => {
    // Weder im Manifest noch in der Client-Pfadliste: Stünde sie dort, würde
    // sie vorgerendert — und eine Datei auf der Platte wird vor jeder
    // Redirect-Regel ausgeliefert. Die Regel wäre dann wirkungslos und es gäbe
    // wieder zwei Dokumente auf eine Kopfintention.
    expect(PUBLIC_ROUTES.some((r) => r.path === von)).toBe(false);
    expect(PUBLIC_ROUTE_PATHS).not.toContain(von);
    expect(isKnownPublicRoute(von)).toBe(false);
  });

  it.each(EINTRAEGE)('%s landet auf einer indexierbaren Manifest-Route', (_von, nach) => {
    const ziel = PUBLIC_ROUTES.find((r) => r.path === nach);
    expect(ziel, `${nach} ist keine Route im Manifest`).toBeDefined();
    expect(ziel!.indexable).toBe(true);
    // Selbstreferenzieller Canonical ist die Regel des Manifests (publicRoutes
    // .test.ts); hier zählt, dass das Ziel überhaupt indexierbar ist — ein 301
    // auf eine noindex-Seite verschenkt genau das Signal, das er tragen soll.
    expect(ziel!.sitemap).toBeDefined();
  });

  it('kennt keine Kette: kein Ziel ist selbst zurückgezogen', () => {
    for (const [von, nach] of EINTRAEGE) {
      expect(isLegacyRedirectSource(nach), `${von} -> ${nach} -> …`).toBe(false);
    }
  });

  it('beantwortet die Zugehörigkeitsfrage in beide Richtungen', () => {
    expect(isLegacyRedirectSource('/automatisierung-unternehmen')).toBe(true);
    expect(isLegacyRedirectSource('/prozessautomatisierung')).toBe(false);
    expect(legacyRedirectTarget('/automatisierung-unternehmen')).toBe('/prozessautomatisierung');
    expect(legacyRedirectTarget('/gibt-es-nicht')).toBeNull();
  });

  it('verwechselt eine zurückgezogene URL nicht mit einer, die sie als Präfix hat', () => {
    // /digitale-automatisierung-unternehmen bleibt eine eigene, lebende Route —
    // sie bedient die Problem-Intention und ist ausdrücklich NICHT Teil der
    // Konsolidierung.
    expect(isLegacyRedirectSource('/digitale-automatisierung-unternehmen')).toBe(false);
    expect(isKnownPublicRoute('/digitale-automatisierung-unternehmen')).toBe(true);
  });
});
