import { describe, expect, it } from 'vitest';

import { CITY_LINKS, CITY_SERVICE_ROUTES } from './standorte-data';
import { CITY_SERVICE_CONFIGS } from './standorte-service-configs';

// CITY_SERVICE_ROUTES lives in the small module (it reaches the entry chunk, so
// src/App.tsx can register the routes) while the configs live in the heavy one
// (lazy, loaded only by the nine pages that render it). That is two places
// naming the same nine URLs, so the agreement is asserted rather than assumed:
// a route added to one and not the other is a 404 or an unrouted page.
describe('city × service route split', () => {
  it('lists exactly the routes the configs define, in the same order', () => {
    expect(CITY_SERVICE_ROUTES).toEqual(
      Object.values(CITY_SERVICE_CONFIGS).map((config) => config.route)
    );
  });

  it('derives every route from its config key', () => {
    for (const [key, config] of Object.entries(CITY_SERVICE_CONFIGS)) {
      expect(config.route).toBe(`/${key}`);
    }
  });

  it('has no duplicate routes', () => {
    expect(new Set(CITY_SERVICE_ROUTES).size).toBe(CITY_SERVICE_ROUTES.length);
  });

  it('keeps every CITY_LINKS service href pointing at a real city × service route', () => {
    for (const city of Object.values(CITY_LINKS)) {
      for (const service of city.services) {
        expect(CITY_SERVICE_ROUTES).toContain(service.href);
      }
    }
  });
});
