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
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
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

/* ──────────────────────────────────────────────────────────────────────────
   DER NETLIFY-VERTRAG FÜR SCHRÄGSTRICH-REGELN

   Warum das hier steht. Am 13.09.2026 widersprachen sich zwei CI-Gates über
   genau eine Zeile: `.github/scripts/test-seo-consistency.mjs` VERLANGTE
   `/automatisierung-unternehmen/ -> /prozessautomatisierung 301`, während
   `.github/scripts/test-prerender-output.mjs` im Netlify-Modus JEDE Regel mit
   Schrägstrich am Ende verbot. Beide hatten für ihren eigenen Gegenstand
   recht: Kanonisierung einer LEBENDEN URL („/route/ -> /route") ist bei
   Netlify unzuverlässig und kann kreisen — die Migration einer
   ZURÜCKGEZOGENEN URL ist dagegen genau das, was alte Backlinks davor
   bewahrt, in einen 404 zu fallen.

   Der lokale portable Build hat den Konflikt nicht gezeigt, weil die
   Schrägstrich-Prüfung nur im Netlify-Modus läuft. Deshalb prüft diese Suite
   den Vertrag direkt gegen synthetische Regeltabellen: Sie läuft in jedem
   `npm test`, unabhängig vom Provider-Modus des letzten Builds.

   Geprüft werden BEIDE Richtungen — dass die deklarierte Migration erlaubt
   ist, UND dass eine beliebige neue Schrägstrich-Regel weiterhin scheitert.
   Nur die erste Richtung zu prüfen hieße, eine Lockerung zu testen statt
   einer Regel.
   ────────────────────────────────────────────────────────────────────────── */
describe('Netlify-Vertrag für Schrägstrich-Regeln', async () => {
  const { checkNetlifyTrailingSlashRules, parseLegacyRedirects, slashVariant } = await import(
    '../../../scripts/lib/legacy-redirect-rules.mjs'
  );

  /** Die echte Deklaration, über denselben Parser wie in CI gelesen. */
  const PAARE: Array<readonly [string, string]> = EINTRAEGE.map(
    ([von, nach]) => [von, nach] as const
  );
  const [VON, NACH] = PAARE[0];
  const VON_SLASH = slashVariant(VON);

  /** Eine Regeltabelle, wie sie im gebauten `_redirects` steht. */
  const BASIS = [
    ['/app', '/app-shell', '200'],
    [VON, NACH, '301'],
    [VON_SLASH, NACH, '301'],
    ['/*', '/404.html', '404'],
  ];

  it('liest dieselbe Tabelle wie die CI-Skripte', () => {
    const quelle = readFileSync(
      join(process.cwd(), 'src/lib/routing/legacyRedirects.ts'),
      'utf8'
    );
    expect(parseLegacyRedirects(quelle)).toEqual(PAARE);
  });

  // ── Richtung A: die deklarierte Migration ist erlaubt ────────────────────
  it('lässt die deklarierte Migration mit beiden Formen durch', () => {
    expect(checkNetlifyTrailingSlashRules(BASIS, PAARE)).toEqual([]);
  });

  it('stört sich nicht an einer Tabelle ganz ohne Schrägstrich-Regel', () => {
    const ohne = BASIS.filter((r) => r[0] !== VON_SLASH);
    expect(checkNetlifyTrailingSlashRules(ohne, PAARE)).toEqual([]);
  });

  // ── Richtung B: alles andere scheitert weiterhin ─────────────────────────
  it('lässt eine NICHT deklarierte Schrägstrich-Regel scheitern', () => {
    // Genau die Kanonisierung, gegen die die ursprüngliche Sperre geschrieben
    // wurde. Sie muss weiter durchfallen, sonst wäre der Schutz aufgegeben.
    const fehler = checkNetlifyTrailingSlashRules(
      [...BASIS, ['/webdesign/', '/webdesign', '301']],
      PAARE
    );
    expect(fehler.join(' ')).toMatch(/trailing-slash rules must not exist/);
    expect(fehler.join(' ')).toContain('/webdesign/');
  });

  it('scheitert auch, wenn die Deklaration leer ist', () => {
    // Kein Eintrag, also darf es auch keine erlaubte Schrägstrich-Regel geben.
    const fehler = checkNetlifyTrailingSlashRules(BASIS, []);
    expect(fehler.join(' ')).toMatch(/trailing-slash rules must not exist/);
    expect(fehler.join(' ')).toContain(VON_SLASH);
  });

  it('scheitert bei einem anderen Ziel als dem deklarierten', () => {
    const fehler = checkNetlifyTrailingSlashRules(
      BASIS.map((r) => (r[0] === VON_SLASH ? [VON_SLASH, '/woanders', '301'] : r)),
      PAARE
    );
    expect(fehler.join(' ')).toMatch(/declares .* -> /);
  });

  it('scheitert bei 302 statt 301', () => {
    const fehler = checkNetlifyTrailingSlashRules(
      BASIS.map((r) => (r[0] === VON_SLASH ? [VON_SLASH, NACH, '302'] : r)),
      PAARE
    );
    expect(fehler.join(' ')).toMatch(/plain permanent 301/);
  });

  it('scheitert bei erzwungener Syntax 301!', () => {
    const fehler = checkNetlifyTrailingSlashRules(
      BASIS.map((r) => (r[0] === VON_SLASH ? [VON_SLASH, NACH, '301!'] : r)),
      PAARE
    );
    expect(fehler.join(' ')).toMatch(/never forced/);
  });

  it('scheitert, wenn die Schrägstrich-Form ohne die kanonische dasteht', () => {
    const fehler = checkNetlifyTrailingSlashRules(
      BASIS.filter((r) => r[0] !== VON),
      PAARE
    );
    expect(fehler.join(' ')).toMatch(/the canonical form must redirect too/);
  });

  it('scheitert, wenn beide Formen sich widersprechen', () => {
    const fehler = checkNetlifyTrailingSlashRules(
      BASIS.map((r) => (r[0] === VON ? [VON, NACH, '302'] : r)),
      PAARE
    );
    expect(fehler.join(' ')).toMatch(/disagree/);
  });

  it('scheitert bei einer Kette', () => {
    // Ziel ist selbst zurückgezogen: ein Hop wäre dann zwei.
    const fehler = checkNetlifyTrailingSlashRules(
      [...BASIS, ['/b', '/c', '301'], ['/b/', '/c', '301']],
      [...PAARE, ['/b', '/c'] as const, ['/c', '/d'] as const]
    );
    expect(fehler.join(' ')).toMatch(/redirect chain/);
  });

  it('wirft, wenn die Tabelle umformatiert und damit unlesbar wird', () => {
    // Stiller Parserverlust wäre der gefährlichste Ausgang: Jede Frage „ist
    // das deklariert?" würde dann mit nein beantwortet.
    expect(() =>
      parseLegacyRedirects('export const LEGACY_REDIRECTS = { "/a": "/b" };')
    ).toThrow(/no .* entry could be parsed/);
    // Fehlt die Tabelle ganz, ist die leere Liste die richtige Antwort.
    expect(parseLegacyRedirects('export const NICHTS = {};')).toEqual([]);
  });
});
