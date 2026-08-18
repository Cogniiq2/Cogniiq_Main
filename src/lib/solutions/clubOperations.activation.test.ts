// Activation contract for the club_operations solution key.
//
// This file replaces the inertness contract that governed the key while it was deliberately
// unimplemented. The properties it pinned were never "club_operations must stay dead" for its own
// sake — they were "nothing may become reachable by accident, and no club identifier or credential
// may enter this repository". Activation retires the first half deliberately and keeps the second
// half exactly as strict:
//
//   1. The frontend registry is still exhaustive and closed.
//   2. club_operations now resolves to its own real implementation, and every navigation entry it
//      exposes opens a section that actually exists.
//   3. Activation grants no organization anything by itself: the migration widens a constraint and
//      activates a catalog row, and creates no organization, membership, invitation or solution
//      instance. Who gets access remains an operational, database-side decision.
//   4. No SVH host, project reference, credential or direct network call exists in any of the
//      files this integration adds or changes.
//
// Plus a regression guard that the existing customer solutions resolve exactly as before.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { implementationKeys, solutionCatalogKeys } from '@/lib/clientPlatform/types';
import { isImplementationAvailable, resolveImplementation } from '@/lib/solutions/registry';
import { clubOperationsSectionIds } from '@/solutions/club-operations/types';

const repoRoot = resolve(__dirname, '../../..');
const catalogMigrationPath = resolve(
  repoRoot,
  'supabase/migrations/20260811120000_club_operations_catalog_entry.sql',
);
const activationMigrationPath = resolve(
  repoRoot,
  'supabase/migrations/20260818120000_club_operations_activation.sql',
);
const platformMigrationPath = resolve(
  repoRoot,
  'supabase/migrations/20260721120000_product_aware_client_platform.sql',
);

// Comments are stripped before any "must not contain" scan. The prose in these files legitimately
// *names* the things that must never appear, in order to record the rule; what matters for the
// contract is that no executable statement does.
function stripComments(source: string): string {
  return source
    .replace(/^\s*--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}

function read(relativePath: string): string {
  return readFileSync(resolve(repoRoot, relativePath), 'utf8');
}

const activationSql = readFileSync(activationMigrationPath, 'utf8');
const activationStatements = stripComments(activationSql);
const registrySource = read('src/lib/solutions/registry.tsx');
const typesSource = read('src/lib/clientPlatform/types.ts');
const landingSource = read('src/components/app/solutions/ClubOperationsSolutionLanding.tsx');
const transportSource = read('src/lib/gateway/clubOperationsBrowserTransport.ts');
const dataSourceSource = read('src/lib/solutions/clubOperationsDataSource.ts');

describe('registry is exhaustive and closed', () => {
  it('resolves every declared implementation key to a concrete implementation', () => {
    for (const key of implementationKeys) {
      const implementation = resolveImplementation(key);
      expect(implementation, `no implementation resolved for ${key}`).toBeTruthy();
      expect(implementation.Landing).toBeTruthy();
    }
  });

  it('resolves the implementation each key names, never a neighbouring entry', () => {
    expect(resolveImplementation('ai_receptionist').implementationKey).toBe('ai_receptionist');
    expect(resolveImplementation('automation_workspace').implementationKey).toBe('automation_workspace');
    expect(resolveImplementation('club_operations').implementationKey).toBe('club_operations');
  });

  it('resolves unknown, empty and nullish keys to the safe fallback', () => {
    for (const key of ['not_a_key', '', '__proto__', 'constructor', 'toString', null, undefined]) {
      expect(isImplementationAvailable(key as string | null | undefined)).toBe(false);
      expect(resolveImplementation(key as string | null | undefined).implementationKey).toBe('unavailable');
    }
  });
});

describe('club_operations resolves to its own live implementation', () => {
  it('is declared in both key unions', () => {
    expect(solutionCatalogKeys).toContain('club_operations');
    expect(implementationKeys).toContain('club_operations');
  });

  it('is no longer the unavailable fallback', () => {
    expect(resolveImplementation('club_operations')).not.toBe(resolveImplementation('unavailable'));
    expect(resolveImplementation('club_operations').available).toBe(true);
    expect(isImplementationAvailable('club_operations')).toBe(true);
  });

  it('exposes navigation whose every entry opens an implemented section', () => {
    const implementation = resolveImplementation('club_operations');
    const items = implementation.navGroups.flatMap((group) => group.items);
    expect(items.length).toBeGreaterThan(0);

    for (const item of items) {
      // Portal navigation for this module is relative to the instance; an `absolute` entry would
      // point outside the solution and escape the instance-scoped access check in SolutionPage.
      expect(item.absolute, `${item.key} must stay instance-relative`).toBeFalsy();

      // '' is the module's default section; anything else must name a real one. A navigation entry
      // pointing at a section that does not exist would be a placeholder page, which this module
      // deliberately has none of.
      const section = item.path.replace(/^\//, '');
      if (section !== '') {
        expect(clubOperationsSectionIds, `${item.path} is not a real section`).toContain(section);
      }
    }
  });

  it('keeps the portal rail shorter than the module’s own full navigation', () => {
    const items = resolveImplementation('club_operations').navGroups.flatMap((group) => group.items);
    expect(items.length).toBeLessThan(clubOperationsSectionIds.length);
  });
});

describe('activation grants no organization access by itself', () => {
  it('widens the implementation key constraint to admit club_operations', () => {
    expect(activationStatements).toMatch(/alter table public\.organization_solutions/i);
    expect(activationStatements).toMatch(/organization_solutions_implementation_key_check/);
    expect(activationStatements).toMatch(/'club_operations'/);
  });

  it('keeps every previously permitted implementation key permitted', () => {
    const widened = /implementation_key in \(([^)]*)\)/i.exec(activationStatements)?.[1];
    expect(widened).toBeTruthy();
    for (const key of ['ai_receptionist', 'automation_workspace', 'pankofer_operations', 'unavailable']) {
      expect(widened).toContain(key);
    }
  });

  it('activates the catalog row without rewriting the original inert migration', () => {
    expect(activationStatements).toMatch(/update public\.solution_catalog/i);
    expect(activationStatements).toMatch(/is_active\s*=\s*true/i);
    // The historical migration is immutable: it already ran wherever it ran.
    const catalogSql = readFileSync(catalogMigrationPath, 'utf8');
    expect(catalogSql).toMatch(/^\s*false,\s*$/m);
    expect(stripComments(catalogSql)).not.toMatch(/\balter\s+table\b/i);
  });

  it('creates no organization, membership, invitation or solution instance', () => {
    for (const forbidden of [
      /insert into public\.organization_solutions/i,
      /insert into public\.organization_members/i,
      /insert into public\.organizations/i,
      /insert into public\.client_invitations/i,
      /insert into public\.profiles/i,
    ]) {
      expect(activationStatements, `activation must not contain ${forbidden}`).not.toMatch(forbidden);
    }
  });

  it('performs no destructive or privilege-granting statement', () => {
    for (const forbidden of [
      /\bdrop\s+table\b/i,
      /\bdrop\s+policy\b/i,
      /\btruncate\b/i,
      /\bdelete\s+from\b/i,
      /\bgrant\b/i,
      /\bcreate\s+policy\b/i,
      /\balter\s+policy\b/i,
    ]) {
      expect(activationStatements, `activation must not contain ${forbidden}`).not.toMatch(forbidden);
    }
  });

  it('touches only the one constraint it names', () => {
    // `drop constraint` is permitted exactly once, for the check being replaced. Anything else
    // dropped here would be a relaxation hiding inside an activation.
    const dropped = [...activationStatements.matchAll(/drop constraint (?:if exists )?([\w]+)/gi)].map(
      (match) => match[1],
    );
    expect(dropped).toEqual(['organization_solutions_implementation_key_check']);
  });

  it('leaves the original platform migration untouched', () => {
    // The widening lives in its own migration; editing history in place would desynchronise any
    // database that already applied the original.
    const constraint = /organization_solutions_implementation_key_check check \(\s*implementation_key in \(([^)]*)\)/i
      .exec(readFileSync(platformMigrationPath, 'utf8'))?.[1];
    expect(constraint).toBeTruthy();
    expect(constraint).not.toContain('club_operations');
  });
});

describe('no SVH reference, credential or direct network call in the integration', () => {
  const sources = [
    ['registry.tsx', stripComments(registrySource)],
    ['types.ts', stripComments(typesSource)],
    ['ClubOperationsSolutionLanding.tsx', stripComments(landingSource)],
    ['clubOperationsSection.ts', stripComments(read('src/lib/solutions/clubOperationsSection.ts'))],
    ['clubOperationsBrowserTransport.ts', stripComments(transportSource)],
    ['clubOperationsDataSource.ts', stripComments(dataSourceSource)],
    ['activation migration', activationStatements],
  ] as const;

  // Substrings that would indicate a live SVH coupling leaking into the browser bundle. The SVH
  // project ref is matched by shape rather than by value so no identifier is embedded in this
  // repository.
  const forbiddenPatterns: Array<[string, RegExp]> = [
    ['a supabase host', /[a-z0-9-]+\.supabase\.(co|in)/i],
    ['an edge function URL', /functions\/v1\//i],
    ['a JWT-shaped literal', /eyJ[A-Za-z0-9_-]{10,}/],
    ['an admin secret', /admin[_-]?secret/i],
    ['a service role key', /service[_-]?role/i],
    ['a VITE-exposed secret', /import\.meta\.env\.VITE_[A-Z0-9_]*(SECRET|KEY|TOKEN)/],
    ['an SVH project name', /heinersreuth|svh_|sv-heinersreuth/i],
    // The browser must reach the upstream only through the Edge Function, via the authenticated
    // Supabase client. A raw fetch here would be a second, unsigned path to somewhere.
    ['a direct network call', /\bfetch\s*\(|XMLHttpRequest|axios/],
  ];

  for (const [label, source] of sources) {
    for (const [what, pattern] of forbiddenPatterns) {
      it(`${label} contains no ${what}`, () => {
        expect(source).not.toMatch(pattern);
      });
    }
  }

  it('names the Edge Function and sends no caller identity in the request body', () => {
    expect(transportSource).toContain("'club-operations-read'");
    // The function derives the user from their own bearer token and the organization from the
    // database. A body-supplied identifier could be forged by the browser, so the two-key contract
    // is pinned here rather than left to review.
    const body = /body:\s*\{([^}]*)\}/.exec(stripComments(transportSource))?.[1] ?? '';
    expect(body).toContain('operation');
    expect(body).toContain('query');
    expect(body).not.toMatch(/userId|user_id|organizationId|organization_id|email/i);
  });

  it('lazily imports only landing modules that exist', () => {
    const dynamicImports = [...registrySource.matchAll(/import\('([^']+)'\)/g)].map((match) => match[1]);
    expect([...new Set(dynamicImports)].sort()).toEqual([
      '@/components/app/solutions/AutomationSolutionLanding',
      '@/components/app/solutions/ClubOperationsSolutionLanding',
      '@/components/app/solutions/ReceptionistSolutionLanding',
      '@/components/app/solutions/UnavailableSolutionLanding',
    ]);
  });

  it('adds no static import to the registry beyond what it already had', () => {
    // The club module must reach the bundle only through the lazy landing above; a static import
    // here would pull the whole dashboard into every customer's first load.
    const modules = [...registrySource.matchAll(/\bfrom\s+'([^']+)'/g)].map((match) => match[1]);
    expect([...new Set(modules)].sort()).toEqual(['@/lib/clientPlatform/types', 'lucide-react', 'react']);
  });
});

describe('existing customer solutions resolve exactly as before', () => {
  it('keeps ai_receptionist available with its navigation intact', () => {
    const implementation = resolveImplementation('ai_receptionist');
    expect(implementation.available).toBe(true);
    expect(implementation.label).toBe('KI-Rezeptionist');
    expect(implementation.navGroups.flatMap((group) => group.items.map((item) => item.key))).toEqual([
      'overview',
      'onboarding',
      'receptionist',
      'phone',
    ]);
  });

  it('keeps automation_workspace available with its navigation intact', () => {
    const implementation = resolveImplementation('automation_workspace');
    expect(implementation.available).toBe(true);
    expect(implementation.label).toBe('Automatisierungs-Workspace');
    expect(implementation.navGroups.flatMap((group) => group.items.map((item) => item.key))).toEqual([
      'overview',
    ]);
  });

  it('keeps pankofer_operations on the fallback', () => {
    expect(resolveImplementation('pankofer_operations')).toBe(resolveImplementation('unavailable'));
  });

  it('leaves the previously declared catalog keys in place', () => {
    for (const key of ['ai_receptionist', 'automation_workspace', 'custom_client_portal', 'website_management']) {
      expect(solutionCatalogKeys).toContain(key);
    }
  });
});
