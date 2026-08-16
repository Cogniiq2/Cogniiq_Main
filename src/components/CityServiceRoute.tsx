// Route element for the nine city × service pages.
//
// Exists purely as a code-splitting boundary: src/App.tsx registers the routes
// from CITY_SERVICE_ROUTES (nine strings) and renders this component lazily, so
// the ~102 KiB CITY_SERVICE_CONFIGS literal and CityServicePage itself leave the
// entry chunk that every visitor on every route downloads. The rendered output
// is unchanged — same component, same config object, same markup.
import { CITY_SERVICE_CONFIGS } from '@/lib/standorte-service-configs';
import { CityServicePage } from '@/components/CityServicePage';

const BY_ROUTE = new Map(
  Object.values(CITY_SERVICE_CONFIGS).map((config) => [config.route, config])
);

export function CityServiceRoute({ route }: { route: string }) {
  const config = BY_ROUTE.get(route);

  // Unreachable while CITY_SERVICE_ROUTES and CITY_SERVICE_CONFIGS agree, which
  // src/lib/standorte-data.test.ts asserts. Throwing rather than rendering null
  // means that if they ever did drift, scripts/prerender.mjs fails the build
  // instead of silently emitting an empty indexable page.
  if (!config) throw new Error(`No CityServiceConfig registered for route ${route}`);

  return <CityServicePage config={config} />;
}

export default CityServiceRoute;
