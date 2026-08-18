// Which data source a Club Operations instance reads from.
//
// The value comes from `organization_solutions.config.data_source`, which is server-owned: the
// `organization_solutions_write_admin` RLS policy admits INSERT/UPDATE/DELETE only for
// `is_platform_admin()`, so a customer session cannot write `config` at all and a browser cannot
// select its own data source. This module only *reads* that decision; it never makes one from a
// URL, a query parameter, an environment variable or a build flag.
//
// The default is deliberately the gateway. 'demo' has to be asked for explicitly and exactly, so
// every way of getting the config wrong — a missing key, a null config, an array, a truthy typo,
// a nested object — resolves to the real, authenticated read path rather than to fixtures. Showing
// demonstration figures where live ones were expected is the failure mode worth designing against.

export type ClubOperationsDataSource = 'gateway' | 'demo';

export function resolveClubOperationsDataSource(config: unknown): ClubOperationsDataSource {
  if (typeof config !== 'object' || config === null || Array.isArray(config)) return 'gateway';
  return (config as Record<string, unknown>).data_source === 'demo' ? 'demo' : 'gateway';
}
