// Deny-by-default proofs for the entitlement boundary, plus the static scans that keep the whole
// gateway free of anything customer-specific (plan §6.2, §14.1.1).

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { handleClubGatewayRequest, unconfiguredRateLimiter } from './clubGatewayShell';
import { cqgw1Operations } from './cqgw1';
import { denyAllAuthorizer, isEntitled, type EntitlementAuthorizer } from './entitlement';

const request = { userId: 'u-1', organizationId: 'o-1', operation: 'listBookings' } as const;

describe('denyAllAuthorizer', () => {
  it('denies every caller, for every operation', async () => {
    for (const operation of ['getOverview', 'listBookings', 'getSettings'] as const) {
      await expect(denyAllAuthorizer({ ...request, operation })).resolves.toEqual({
        entitled: false,
      });
    }
  });

  it('resolves to a denial through the fail-closed reader', async () => {
    await expect(isEntitled(denyAllAuthorizer, request)).resolves.toBe(false);
  });
});

describe('every abnormal outcome is a denial', () => {
  const denyingAuthorizers: Array<[string, unknown]> = [
    ['a missing authorizer', undefined],
    ['a null authorizer', null],
    ['a non-callable authorizer', {}],
    ['an authorizer returning false', async () => ({ entitled: false })],
    ['an authorizer that throws synchronously', () => {
      throw new Error('boom');
    }],
    ['an authorizer that rejects', async () => {
      throw new Error('boom');
    }],
    ['an authorizer returning undefined', async () => undefined],
    ['an authorizer returning null', async () => null],
    ['an authorizer returning a bare true', async () => true],
    ['an authorizer returning an array', async () => [{ entitled: true }]],
    ['an authorizer returning a truthy non-boolean', async () => ({ entitled: 'yes' })],
    ['an authorizer returning 1', async () => ({ entitled: 1 })],
    ['an authorizer returning extra keys alongside the allow', async () => ({
      entitled: true,
      bypass: true,
    })],
    ['an authorizer returning an empty object', async () => ({})],
  ];

  for (const [what, authorizer] of denyingAuthorizers) {
    it(`denies with ${what}`, async () => {
      await expect(
        isEntitled(authorizer as EntitlementAuthorizer, request),
      ).resolves.toBe(false);
    });
  }

  it('allows only the exact literal { entitled: true }', async () => {
    const allow: EntitlementAuthorizer = async () => ({ entitled: true });
    await expect(isEntitled(allow, request)).resolves.toBe(true);
  });

  it('passes the request through unchanged, and nothing else', async () => {
    let seen: unknown;
    const spy: EntitlementAuthorizer = async (received) => {
      seen = received;
      return { entitled: false };
    };
    await isEntitled(spy, request);
    expect(seen).toEqual({ userId: 'u-1', organizationId: 'o-1', operation: 'listBookings' });
  });
});

/* ------------------------------------------------------------------ Static scans */

const repoRoot = resolve(__dirname, '../../..');
const gatewayRoot = resolve(repoRoot, 'src/lib/gateway');

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

/** Product source only. Tests are excluded: this file must name the forbidden patterns to forbid them. */
const gatewaySources = walk(gatewayRoot)
  .filter((file) => /\.ts$/.test(file) && !/\.(test|fixtures)\.ts$/.test(file))
  .map((file) => ({
    path: relative(repoRoot, file).replace(/\\/g, '/'),
    code: readFileSync(file, 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, ''),
  }));

const shellPath = resolve(repoRoot, 'supabase/functions/club-operations-read/index.ts');
const shellSource = readFileSync(shellPath, 'utf8');

describe('the gateway names no customer, organization or identity', () => {
  it('found the modules to scan', () => {
    const names = gatewaySources.map((source) => source.path);
    expect(names).toContain('src/lib/gateway/entitlement.ts');
    expect(names).toContain('src/lib/gateway/clubGatewayShell.ts');
    expect(names).toContain('src/lib/gateway/clubGatewayTransport.ts');
    expect(names).toContain('src/lib/gateway/operationValidation.ts');
    expect(names).toContain('src/lib/gateway/clubGatewayResponse.ts');
  });

  const forbidden: Array<[string, RegExp]> = [
    ['the club by name', /heinersreuth/i],
    ['the club abbreviation', /\bSVH\b/],
    ['an email address', /[a-z0-9._-]+@[a-z0-9-]+\.[a-z]{2,}/i],
    ['a UUID literal', /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i],
    ['a project reference', /sbsniydzogakbgfubgaq/i],
    ['a supabase host', /supabase\.(co|in)\b/i],
    ['a hardcoded organization comparison', /organization_?[Ii]d\s*===\s*['"]/],
    ['a JWT-shaped literal', /eyJ[A-Za-z0-9_-]{10,}/],
    ['a service role reference', /SERVICE_ROLE/i],
    ['a response-signing key variable', /RESPONSE_(PUBLIC|SIGNING)_KEY/i],
    ['a response-signing protocol', /CQGW1-R\b/],
  ];

  for (const [what, pattern] of forbidden) {
    it(`no gateway source contains ${what}`, () => {
      const offenders = gatewaySources.filter((s) => pattern.test(s.code)).map((s) => s.path);
      expect(offenders).toEqual([]);
    });
  }
});

describe('nothing outside the authorizer can influence the decision', () => {
  it('the entitlement module reads no environment, header, cookie or storage', () => {
    const entitlement = gatewaySources.find((s) => s.path.endsWith('gateway/entitlement.ts'))!;
    for (const pattern of [
      /Deno\.env/,
      /import\.meta\.env/,
      /process\.env/,
      /headers/i,
      /cookie/i,
      /localStorage|sessionStorage/,
      /URLSearchParams/,
      /fetch\s*\(/,
    ]) {
      expect(entitlement.code, `pattern ${pattern}`).not.toMatch(pattern);
    }
  });

  it('the shell selects its authorizer from a constant, never from a request or an environment', () => {
    const withoutComments = shellSource
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '');
    // The authorizer is a fixed import, not something computed from a variable.
    expect(withoutComments).toMatch(/authorize:\s*denyAllAuthorizer/);
    expect(withoutComments).not.toMatch(/authorize:\s*[A-Za-z_$][\w$]*\s*\?/);
    expect(withoutComments).not.toMatch(/\b(ALLOW_ALL|BYPASS|DEV_MODE|SKIP_AUTH|FORCE_ENTITLED)\b/i);
  });
});

describe('the production shell stays deny-all', () => {
  const shellCode = shellSource
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

  it('contains exactly one authorizer wiring, and it is denyAllAuthorizer', () => {
    // Presence is not the property that matters — *uniqueness* is. A second dependency object with
    // a different authorizer would satisfy a "contains denyAllAuthorizer" check while shipping a way
    // in, so every `authorize:` in the file is counted and every one must be the denial.
    const wirings = [...shellCode.matchAll(/\bauthorize\s*:/g)];
    expect(wirings).toHaveLength(1);
    expect(shellCode).toMatch(/\bauthorize\s*:\s*denyAllAuthorizer\s*,/);
    expect(shellCode).toMatch(/import\s*\{\s*denyAllAuthorizer\s*\}/);
  });

  it('builds exactly one dependency object, so there is no second wiring to find', () => {
    const dependencyObjects = [...shellCode.matchAll(/ClubGatewayShellDependencies\s*=/g)];
    expect(dependencyObjects).toHaveLength(1);
    const handlerCalls = [...shellCode.matchAll(/handleClubGatewayRequest\s*\(/g)];
    expect(handlerCalls).toHaveLength(1);
  });

  it('imports no authorizer other than the denial', () => {
    // `denyAllAuthorizer` is the only value the entitlement module exports that can authorize, and
    // it authorizes nothing. Anything else arriving from anywhere is the thing to catch.
    const imported = [...shellCode.matchAll(/import\s*\{([^}]*)\}\s*from\s*'[^']*entitlement\.ts'/g)]
      .flatMap((match) => match[1].split(',').map((name) => name.trim()))
      .filter((name) => name !== '');
    expect(imported).toEqual(['denyAllAuthorizer']);
    expect(shellCode).not.toMatch(/Authorizer\s*=/); // no locally defined authorizer
  });

  it('cannot have the authorizer replaced by an environment variable, a conditional or a fallback', () => {
    // Every environment read in the shell, checked against what may legitimately be configured.
    const envReads = [...shellCode.matchAll(/Deno\.env\.get\(\s*'([^']+)'\s*\)/g)].map((m) => m[1]);
    expect(envReads.sort()).toEqual(
      [
        'CLUB_OPS_GATEWAY_ALLOWED_ORIGINS',
        'CLUB_OPS_GATEWAY_KEY_ID',
        'CLUB_OPS_GATEWAY_SIGNING_KEY',
        'CLUB_OPS_GATEWAY_URL',
        'SUPABASE_ANON_KEY',
        'SUPABASE_URL',
      ].sort(),
    );
    // None of them is an entitlement switch, and the wiring line contains no conditional at all.
    const wiringLine = shellCode.split('\n').find((line) => /\bauthorize\s*:/.test(line))!;
    expect(wiringLine).not.toMatch(/[?]|&&|\|\|/);
    expect(wiringLine).not.toMatch(/Deno\.env|process\.env|import\.meta\.env/);
    expect(shellCode).not.toMatch(/\b(ALLOW_ALL|BYPASS|DEV_MODE|SKIP_AUTH|FORCE_ENTITLED)\b/i);
  });

  it('wires the unconfigured rate limiter, because B4 is unresolved', () => {
    const wirings = [...shellCode.matchAll(/\brateLimiter\s*:/g)];
    expect(wirings).toHaveLength(1);
    expect(shellCode).toMatch(/\brateLimiter\s*:\s*unconfiguredRateLimiter\s*,/);
  });

  it('carries no service-role key and no response key', () => {
    expect(shellSource).not.toMatch(/SERVICE_ROLE/);
    expect(shellSource).not.toMatch(/RESPONSE_(PUBLIC|SIGNING)_KEY/i);
  });
});

describe('the production-equivalent wiring denies all twelve at runtime', () => {
  // The shell's own dependency object cannot be imported — it lives in a Deno module the vitest
  // environment cannot load. What can be done, and is done here, is to run the real handler with the
  // *same two production values* the shell wires, and observe the outcome for every operation.
  //
  // This is not a substitute for D3b-I scenario 2, which observes the unmodified deployed shell deny
  // over the real wire. It proves the values are denying values; it cannot prove they are the values
  // that ship. The uniqueness assertions above are what cover that, statically.
  it('denies every operation with zero signing and zero fetch', async () => {
    const attempted: string[] = [];
    const bodies = new Set<string>();

    for (const operation of cqgw1Operations) {
      const query =
        operation === 'getOverview'
          ? { period: 'month' }
          : operation === 'getReport'
            ? { range: 'week' }
            : {};

      const response = await handleClubGatewayRequest(
        new Request('https://cogniiq.example.test/functions/v1/club-operations-read', {
          method: 'POST',
          headers: { Authorization: 'Bearer local-fake-token', 'Content-Type': 'application/json' },
          body: JSON.stringify({ operation, query }),
        }),
        {
          resolveCaller: async () => ({ userId: 'user-1', organizationIds: ['org-1', 'org-2'] }),
          // The two production values, verbatim.
          authorize: denyAllAuthorizer,
          rateLimiter: unconfiguredRateLimiter,
          transport: async (request) => {
            attempted.push(request.operation);
            return { status: 200, body: {}, requestId: 'req-abcdefgh' };
          },
        },
      );

      expect(response.status, operation).toBe(403);
      bodies.add(await response.text());
    }

    expect(attempted).toEqual([]);
    expect([...bodies]).toEqual(['{"error":"Not permitted"}']);
  });
});
