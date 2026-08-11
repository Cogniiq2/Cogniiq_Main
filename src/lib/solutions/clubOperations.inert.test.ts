// Inertness contract for the club_operations solution key.
//
// club_operations is declared but deliberately not implemented. These tests pin the four properties
// that make declaring it safe, so a later change cannot make it live by accident:
//
//   1. The frontend registry is exhaustive and closed.
//   2. club_operations resolves only to the unavailable fallback.
//   3. Declaring the key grants no organization anything — the migration activates nothing, and the
//      database still rejects the implementation key outright.
//   4. No SVH host, project reference, credential or network call exists in the new implementation.
//
// Plus a regression guard that the existing customer solutions resolve exactly as before.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { implementationKeys, solutionCatalogKeys } from '@/lib/clientPlatform/types';
import { isImplementationAvailable, resolveImplementation } from '@/lib/solutions/registry';

const repoRoot = resolve(__dirname, '../../..');
const migrationPath = resolve(
  repoRoot,
  'supabase/migrations/20260811120000_club_operations_catalog_entry.sql',
);
const platformMigrationPath = resolve(
  repoRoot,
  'supabase/migrations/20260721120000_product_aware_client_platform.sql',
);

const migrationSql = readFileSync(migrationPath, 'utf8');

// Comments are stripped before any "must not contain" scan. The prose in these files legitimately
// *names* the things that must never appear, in order to record the rule; what matters for the
// inertness contract is that no executable statement does.
function stripComments(source: string): string {
  return source
    .replace(/^\s*--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}

const migrationStatements = stripComments(migrationSql);
const registrySource = readFileSync(resolve(repoRoot, 'src/lib/solutions/registry.tsx'), 'utf8');
const typesSource = readFileSync(resolve(repoRoot, 'src/lib/clientPlatform/types.ts'), 'utf8');

describe('registry is exhaustive and closed', () => {
  it('resolves every declared implementation key to a concrete implementation', () => {
    for (const key of implementationKeys) {
      const implementation = resolveImplementation(key);
      expect(implementation, `no implementation resolved for ${key}`).toBeTruthy();
      expect(implementation.Landing).toBeTruthy();
    }
  });

  it('resolves the implementation each key names, never a neighbouring entry', () => {
    // A Record<ImplementationKey, …> makes the registry exhaustive at compile time; this pins that
    // lookups are not silently falling through to the fallback for keys that do have a module.
    expect(resolveImplementation('ai_receptionist').implementationKey).toBe('ai_receptionist');
    expect(resolveImplementation('automation_workspace').implementationKey).toBe('automation_workspace');
  });

  it('resolves unknown, empty and nullish keys to the safe fallback', () => {
    for (const key of ['not_a_key', '', '__proto__', 'constructor', 'toString', null, undefined]) {
      expect(isImplementationAvailable(key as string | null | undefined)).toBe(false);
      expect(resolveImplementation(key as string | null | undefined).implementationKey).toBe('unavailable');
    }
  });
});

describe('club_operations resolves only to the unavailable fallback', () => {
  it('is declared in both key unions', () => {
    expect(solutionCatalogKeys).toContain('club_operations');
    expect(implementationKeys).toContain('club_operations');
  });

  it('resolves to the very same object as the unavailable fallback', () => {
    expect(resolveImplementation('club_operations')).toBe(resolveImplementation('unavailable'));
  });

  it('reports itself unavailable and exposes no navigation', () => {
    const implementation = resolveImplementation('club_operations');
    expect(implementation.available).toBe(false);
    expect(isImplementationAvailable('club_operations')).toBe(false);
    expect(implementation.navGroups).toHaveLength(0);
  });
});

describe('declaring the key grants no organization access', () => {
  it('inserts the catalog row inactive', () => {
    expect(migrationSql).toMatch(/insert into public\.solution_catalog/i);
    // The value list must carry an explicit false for is_active.
    const columns = /insert into public\.solution_catalog \(([^)]*)\)/i.exec(migrationSql)?.[1];
    expect(columns).toContain('is_active');
    expect(migrationSql).toMatch(/^\s*false,\s*$/m);
  });

  it('defaults the catalog entry to the unavailable implementation', () => {
    expect(migrationSql).toMatch(/'unavailable'/);
    expect(migrationSql).not.toMatch(/default_implementation_key\s*=\s*'club_operations'/i);
  });

  it('creates no solution instance and no membership, so no organization gains a surface', () => {
    expect(migrationSql).not.toMatch(/insert into public\.organization_solutions/i);
    expect(migrationSql).not.toMatch(/insert into public\.organization_members/i);
    expect(migrationSql).not.toMatch(/insert into public\.organizations/i);
    expect(migrationSql).not.toMatch(/insert into public\.client_invitations/i);
  });

  it('performs no destructive or privilege-granting statement', () => {
    for (const forbidden of [
      /\bdrop\s+table\b/i,
      /\bdrop\s+policy\b/i,
      /\btruncate\b/i,
      /\bdelete\s+from\b/i,
      /\bupdate\s+public\./i,
      /\balter\s+table\b/i,
      /\bgrant\b/i,
      /\bcreate\s+policy\b/i,
    ]) {
      expect(migrationStatements, `migration must not contain ${forbidden}`).not.toMatch(forbidden);
    }
  });

  it('leaves the database constraint rejecting the implementation key', () => {
    // Independent backstop: even a platform admin cannot attach a live club_operations instance
    // until a later, explicit migration widens this constraint.
    const constraint = /organization_solutions_implementation_key_check check \(\s*implementation_key in \(([^)]*)\)/i
      .exec(readFileSync(platformMigrationPath, 'utf8'))?.[1];
    expect(constraint).toBeTruthy();
    expect(constraint).not.toContain('club_operations');
  });
});

describe('no SVH reference, credential or network call in the new implementation', () => {
  const newSources = [
    ['registry.tsx', stripComments(registrySource)],
    ['types.ts', stripComments(typesSource)],
    ['migration', migrationStatements],
  ] as const;

  // Substrings that would indicate a live SVH coupling. The SVH project ref is matched by shape
  // rather than by value so no identifier is embedded in this repository.
  const forbiddenPatterns: Array<[string, RegExp]> = [
    ['a supabase host', /[a-z0-9-]+\.supabase\.(co|in)/i],
    ['an edge function URL', /functions\/v1\//i],
    ['a JWT-shaped literal', /eyJ[A-Za-z0-9_-]{10,}/],
    ['an admin secret', /admin[_-]?secret/i],
    ['a service role key', /service[_-]?role/i],
    ['a VITE-exposed secret', /import\.meta\.env\.VITE_[A-Z0-9_]*(SECRET|KEY|TOKEN)/],
    ['an SVH project name', /heinersreuth|svh_|sv-heinersreuth/i],
    ['a network call', /\bfetch\s*\(|XMLHttpRequest|axios/],
  ];

  for (const [label, source] of newSources) {
    for (const [what, pattern] of forbiddenPatterns) {
      it(`${label} contains no ${what}`, () => {
        expect(source).not.toMatch(pattern);
      });
    }
  }

  it('adds no import to the registry beyond what it already had', () => {
    // Matches multi-line import blocks too, so a new dependency cannot slip in unnoticed.
    const modules = [...registrySource.matchAll(/\bfrom\s+'([^']+)'/g)].map((match) => match[1]);
    const unique = [...new Set(modules)].sort();
    expect(unique).toEqual(['@/lib/clientPlatform/types', 'lucide-react', 'react']);
  });

  it('lazily imports only modules that already existed', () => {
    const dynamicImports = [...registrySource.matchAll(/import\('([^']+)'\)/g)].map((match) => match[1]);
    expect([...new Set(dynamicImports)].sort()).toEqual([
      '@/components/app/solutions/AutomationSolutionLanding',
      '@/components/app/solutions/ReceptionistSolutionLanding',
      '@/components/app/solutions/UnavailableSolutionLanding',
    ]);
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
