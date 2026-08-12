// Static enforcement for the Club Operations module.
//
// Scans the module's *source* files only. Test files are excluded on purpose: this very file has to
// name the forbidden patterns in order to forbid them, and scanning itself would be self-defeating.
// Comments are stripped before scanning so a comment recording a rule cannot trip the rule.

import { execSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const repoRoot = resolve(__dirname, '../../..');
const moduleRoot = resolve(repoRoot, 'src/solutions/club-operations');

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const allFiles = walk(moduleRoot);

/**
 * Product source files: everything except tests and `__`-prefixed local scratch files.
 *
 * Tests are excluded because this file has to name the forbidden patterns in order to forbid them.
 * `__`-prefixed files are temporary, local-only review harnesses that are never committed — the
 * separate "no uncommitted harness ships" guard below is what keeps that honest.
 */
const sourceFiles = allFiles.filter(
  (file) =>
    /\.(ts|tsx)$/.test(file) &&
    !/\.test\.tsx?$/.test(file) &&
    !/[\\/]__/.test(file),
);

function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}

const sources = sourceFiles.map((file) => ({
  path: relative(repoRoot, file).replace(/\\/g, '/'),
  code: stripComments(readFileSync(file, 'utf8')),
}));

describe('the module has source files to scan', () => {
  it('found the expected module tree', () => {
    // Guards against the scan silently passing because it globbed nothing.
    expect(sourceFiles.length).toBeGreaterThanOrEqual(25);
    const names = sources.map((s) => s.path);
    expect(names).toContain('src/solutions/club-operations/ClubOperationsModule.tsx');
    expect(names).toContain('src/solutions/club-operations/adapter/fixtureAdapter.ts');
    // One section file per navigation entry — a section cannot be listed without existing.
    const sectionFiles = names.filter((name) => name.includes('/sections/'));
    expect(sectionFiles).toHaveLength(12);
  });

  it('no temporary harness file is tracked by git', () => {
    // The review harness is local-only. If one is ever committed it would ship an unguarded entry
    // point into the bundle, so its absence from the index is asserted rather than assumed.
    const tracked = execSync('git ls-files src/solutions/club-operations', {
      cwd: repoRoot,
      encoding: 'utf8',
    })
      .split('\n')
      .filter((line) => /(^|\/)__/.test(line.trim()) && line.trim().length > 0);
    expect(tracked).toEqual([]);
  });
});

describe('no credential, connection target or network client', () => {
  const forbidden: Array<[string, RegExp]> = [
    ['a supabase host', /supabase\.(co|in)\b/i],
    ['a project reference of the reference system', /sbsniydzogakbgfubgaq/i],
    ['an http URL', /http:\/\//i],
    ['an https URL', /https:\/\//i],
    ['a fetch call', /\bfetch\s*\(/],
    ['axios', /\baxios\b/i],
    ['a client factory', /\bcreateClient\b/],
    ['an env access', /import\.meta\.env/],
    ['an admin secret', /ADMIN_SECRET/i],
    ['a service role reference', /SERVICE_ROLE/i],
    ['a VITE-prefixed variable', /\bVITE_/],
    ['the club contact address', /svheinersreuth-padel\.de/i],
    ['a hardcoded personal account', /cogniiq4@gmail\.com/i],
    ['a JWT-shaped literal', /eyJ[A-Za-z0-9_-]{10,}/],
    ['an anon key reference', /anon[_-]?key/i],
    ['a websocket client', /\bWebSocket\b/],
    ['XMLHttpRequest', /XMLHttpRequest/],
    ['a process env access', /process\.env/],
  ];

  for (const [what, pattern] of forbidden) {
    it(`no source file contains ${what}`, () => {
      const offenders = sources.filter((s) => pattern.test(s.code)).map((s) => s.path);
      expect(offenders).toEqual([]);
    });
  }
});

describe('no copied authorization logic from the reference dashboard', () => {
  it('does not reintroduce a hardcoded current role', () => {
    // The hazard in the reference system is `CURRENT_ROLE = 'superadmin'` — a constant standing in
    // for an authorization decision. The *word* superadmin is fine as a permission-matrix row label;
    // what must never exist is a value claiming to be the caller's own role.
    const offenders = sources
      .filter((s) => /CURRENT_ROLE|currentRole|effectiveRole|isSuperAdmin|hasPermission\s*\(/i.test(s.code))
      .map((s) => s.path);
    expect(offenders).toEqual([]);
  });

  it('never assigns a role to the viewer', () => {
    // Roles appear in this module only as displayed data — a permission-matrix row, an audit-trail
    // actor. What must not exist is a variable holding *the caller's* role, or a role literal being
    // assigned to one. (`role=` as a JSX ARIA attribute is unrelated and deliberately not matched.)
    for (const { path, code } of sources) {
      expect(code, `${path}: names a viewer role`).not.toMatch(
        /\b(currentRole|viewerRole|userRole|activeRole|myRole)\b/i,
      );
      expect(code, `${path}: assigns a role literal`).not.toMatch(
        /=\s*['"](superadmin|vorstand|finanzadmin|buchungsadmin|readonly)['"]/i,
      );
    }
  });

  it('contains no organization-, email- or tenant-specific authorization', () => {
    for (const pattern of [/heinersreuth/i, /\bSVH\b/, /organization_id\s*===/, /@[a-z0-9-]+\.(de|com)\b/i]) {
      const offenders = sources.filter((s) => pattern.test(s.code)).map((s) => s.path);
      expect(offenders, `pattern ${pattern}`).toEqual([]);
    }
  });
});

describe('import boundaries', () => {
  const importsOf = (code: string) =>
    [...code.matchAll(/\bfrom\s+'([^']+)'/g)].map((match) => match[1]);

  const allowedExternal = new Set(['react', 'react-dom', 'lucide-react']);
  // Specific dashboard submodules only — never the barrel. The barrel re-exports DashboardShell,
  // which imports AuthContext and through it the Supabase client; importing it would couple this
  // module to authentication internals it has no business touching.
  const allowedInternalPrefixes = [
    '@/components/dashboard/primitives',
    '@/components/dashboard/tokens',
    '@/components/dashboard/PremiumSelect',
    '@/lib/utils',
  ];

  it('imports only its own files, the shared dashboard system, generic utils and vetted packages', () => {
    const violations: string[] = [];

    for (const { path, code } of sources) {
      for (const specifier of importsOf(code)) {
        if (specifier.startsWith('.')) continue; // own tree
        if (allowedExternal.has(specifier)) continue;
        if (allowedInternalPrefixes.some((prefix) => specifier === prefix || specifier.startsWith(`${prefix}/`))) continue;
        violations.push(`${path} -> ${specifier}`);
      }
    }

    expect(violations).toEqual([]);
  });

  it('imports nothing from the forbidden Cogniiq areas', () => {
    const forbiddenPrefixes = [
      '@/lib/supabase',
      '@/contexts/AuthContext',
      '@/hooks/useOrganizations',
      '@/hooks/useOrganizationSolutions',
      '@/pages/owner',
      '@/pages/admin',
      '@/lib/ownerFinance',
      '@/lib/clientPlatform',
      '@/components/app',
    ];

    const violations: string[] = [];
    for (const { path, code } of sources) {
      for (const specifier of importsOf(code)) {
        if (forbiddenPrefixes.some((prefix) => specifier.startsWith(prefix))) {
          violations.push(`${path} -> ${specifier}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it('never imports the dashboard barrel, which would pull in auth and the Supabase client', () => {
    const violations: string[] = [];
    for (const { path, code } of sources) {
      for (const specifier of importsOf(code)) {
        if (specifier === '@/components/dashboard') violations.push(path);
      }
    }
    expect(violations).toEqual([]);
  });

  it('reaches no Supabase client transitively, at any import depth', () => {
    const resolveLocal = (fromFile: string, specifier: string): string | null => {
      let base: string;
      if (specifier.startsWith('@/')) base = resolve(repoRoot, 'src', specifier.slice(2));
      else if (specifier.startsWith('.')) base = resolve(fromFile, '..', specifier);
      else return null;
      for (const candidate of [`${base}.ts`, `${base}.tsx`, join(base, 'index.ts'), join(base, 'index.tsx')]) {
        try {
          if (statSync(candidate).isFile()) return candidate;
        } catch {
          // not this extension; keep looking
        }
      }
      return null;
    };

    const seen = new Set<string>();
    const queue = [...sourceFiles];
    while (queue.length > 0) {
      const file = queue.pop()!;
      if (seen.has(file)) continue;
      seen.add(file);
      const code = readFileSync(file, 'utf8');
      for (const specifier of importsOf(code)) {
        const target = resolveLocal(file, specifier);
        if (target && !seen.has(target)) queue.push(target);
      }
    }

    const reached = [...seen].map((f) => relative(repoRoot, f).replace(/\\/g, '/'));
    expect(reached).not.toContain('src/lib/supabase.ts');
    expect(reached).not.toContain('src/contexts/AuthContext.tsx');
    expect(reached.filter((f) => /supabase/i.test(f))).toEqual([]);
  });

  it('never reaches outside the repository or up past src', () => {
    for (const { path, code } of sources) {
      for (const specifier of importsOf(code)) {
        expect(specifier, `${path} -> ${specifier}`).not.toMatch(/\.\.\/\.\.\/\.\./);
      }
    }
  });
});

describe('the module stays unreachable in production routing', () => {
  const appSource = readFileSync(resolve(repoRoot, 'src/App.tsx'), 'utf8');
  const registrySource = readFileSync(resolve(repoRoot, 'src/lib/solutions/registry.tsx'), 'utf8');

  it('is not referenced by the route tree', () => {
    expect(appSource).not.toMatch(/club-operations/i);
    expect(appSource).not.toMatch(/ClubOperationsModule/);
  });

  it('is not referenced by the solution registry', () => {
    expect(registrySource).not.toMatch(/club-operations/);
    expect(registrySource).not.toMatch(/ClubOperationsModule/);
  });

  it('registry still resolves club_operations to the unavailable fallback', () => {
    expect(registrySource).toMatch(/club_operations:\s*unavailableImplementation/);
  });

  it('no production file outside the module imports the module', () => {
    const srcRoot = resolve(repoRoot, 'src');
    const offenders = walk(srcRoot)
      .filter((file) => /\.(ts|tsx)$/.test(file))
      .filter((file) => !file.startsWith(moduleRoot))
      .filter((file) => /solutions\/club-operations/.test(readFileSync(file, 'utf8')))
      .map((file) => relative(repoRoot, file).replace(/\\/g, '/'));
    expect(offenders).toEqual([]);
  });

  it('adds no route, query-parameter or preview bypass of its own', () => {
    for (const { path, code } of sources) {
      expect(code, path).not.toMatch(/<Route\b/);
      expect(code, path).not.toMatch(/URLSearchParams|location\.search|window\.location/);
      expect(code, path).not.toMatch(/localStorage|sessionStorage|document\.cookie/);
    }
  });
});

describe('the module performs no writes', () => {
  it('the adapter contract declares no mutating method', () => {
    const contract = sources.find((s) => s.path.endsWith('adapter/ClubOperationsAdapter.ts'));
    expect(contract).toBeTruthy();
    for (const verb of [/\bcreate[A-Z]/, /\bupdate[A-Z]/, /\bdelete[A-Z]/, /\bsave[A-Z]/, /\bvoid[A-Z]/, /\bsend[A-Z]/]) {
      expect(contract!.code, `contract must not declare ${verb}`).not.toMatch(verb);
    }
  });
});
