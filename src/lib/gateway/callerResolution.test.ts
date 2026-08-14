// Caller resolution, with a local fake client (plan §6.1 steps 5–6).
//
// This is the logic that used to live in the Edge Function, where no test could reach it. Nothing
// here constructs a Supabase client, opens a socket or names a hosted project: the factory is a fake
// that records what it was asked for.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  ORGANIZATION_MEMBERS_COLUMN,
  ORGANIZATION_MEMBERS_TABLE,
  ORGANIZATION_MEMBERS_USER_COLUMN,
  createSupabaseCallerResolver,
  type CallerScopedClient,
} from './callerResolution';

const BEARER = 'Bearer local-fake-token';
const USER_ID = 'user-abc';

interface Recorded {
  factoryArgs: string[];
  tables: string[];
  columns: string[];
  filters: Array<[string, string]>;
}

interface FakeOptions {
  getUser?: () => Promise<{ data?: { user?: { id?: unknown } | null } | null; error?: unknown }>;
  membership?: () => Promise<{ data?: unknown; error?: unknown }>;
  factoryThrows?: boolean;
}

function fakeClient(options: FakeOptions = {}) {
  const recorded: Recorded = { factoryArgs: [], tables: [], columns: [], filters: [] };

  const factory = (authorization: string): CallerScopedClient => {
    recorded.factoryArgs.push(authorization);
    if (options.factoryThrows) throw new Error('client construction failed: bad url or key');
    return {
      auth: {
        getUser:
          options.getUser ?? (async () => ({ data: { user: { id: USER_ID } }, error: null })),
      },
      from: (table: string) => {
        recorded.tables.push(table);
        return {
          select: (columns: string) => {
            recorded.columns.push(columns);
            return {
              eq: async (column: string, value: string) => {
                recorded.filters.push([column, value]);
                return options.membership
                  ? options.membership()
                  : { data: [{ [ORGANIZATION_MEMBERS_COLUMN]: 'org-1' }], error: null };
              },
            };
          },
        };
      },
    };
  };

  return { resolver: createSupabaseCallerResolver(factory), recorded };
}

/* -------------------------------------------------------------------- Success */

describe('a valid authenticated caller', () => {
  it('resolves to its user id and memberships', async () => {
    const { resolver } = fakeClient({
      membership: async () => ({
        data: [{ organization_id: 'org-1' }, { organization_id: 'org-2' }],
        error: null,
      }),
    });
    await expect(resolver(BEARER)).resolves.toEqual({
      userId: USER_ID,
      organizationIds: ['org-1', 'org-2'],
    });
  });

  it('resolves with no memberships, which the shell answers as a denial rather than a session error', async () => {
    const { resolver } = fakeClient({ membership: async () => ({ data: [], error: null }) });
    await expect(resolver(BEARER)).resolves.toEqual({ userId: USER_ID, organizationIds: [] });
  });
});

/* ------------------------------------------------------------ Query discipline */

describe('the query is minimal and caller-scoped', () => {
  it('passes the bearer header to the factory, and nothing else', async () => {
    const { resolver, recorded } = fakeClient();
    await resolver(BEARER);
    expect(recorded.factoryArgs).toEqual([BEARER]);
  });

  it('reads exactly one column from exactly one table, filtered by the resolved user', async () => {
    const { resolver, recorded } = fakeClient();
    await resolver(BEARER);
    expect(recorded.tables).toEqual([ORGANIZATION_MEMBERS_TABLE]);
    expect(recorded.columns).toEqual([ORGANIZATION_MEMBERS_COLUMN]);
    expect(recorded.columns[0]).toBe('organization_id');
    expect(recorded.columns[0]).not.toContain('*');
    expect(recorded.filters).toEqual([[ORGANIZATION_MEMBERS_USER_COLUMN, USER_ID]]);
  });

  it('filters by the id the auth server returned, never by anything supplied alongside it', async () => {
    const { resolver, recorded } = fakeClient({
      getUser: async () => ({
        data: {
          user: {
            id: USER_ID,
            // Attacker-shaped extras on the user object. None of them may steer the query.
            organization_id: 'org-injected',
            role: 'superadmin',
            app_metadata: { organizationIds: ['org-injected'] },
          },
        },
        error: null,
      }),
    });
    const identity = await resolver(BEARER);
    expect(recorded.filters).toEqual([['user_id', USER_ID]]);
    expect(identity!.organizationIds).toEqual(['org-1']);
    expect(identity!.organizationIds).not.toContain('org-injected');
  });

  it('validates the token through the auth server rather than decoding it', () => {
    const source = readFileSync(resolve(__dirname, 'callerResolution.ts'), 'utf8');
    expect(source).toMatch(/auth\.getUser\(\)/);
    for (const pattern of [/atob\s*\(/, /jwtDecode|jwt_decode|decodeJwt/i, /\.split\('\.'\)/, /app_metadata/, /user_metadata/]) {
      expect(source, `pattern ${pattern}`).not.toMatch(pattern);
    }
  });
});

/* ------------------------------------------------------------- Fail-closed set */

describe('every abnormal outcome resolves to null', () => {
  const cases: Array<[string, FakeOptions]> = [
    ['the factory throws', { factoryThrows: true }],
    ['getUser throws', { getUser: async () => { throw new Error('network down at db.internal'); } }],
    ['getUser reports an error', { getUser: async () => ({ data: null, error: { message: 'invalid JWT: token is expired' } }) }],
    ['getUser returns no data', { getUser: async () => ({}) }],
    ['getUser returns a null user', { getUser: async () => ({ data: { user: null }, error: null }) }],
    ['the user has no id', { getUser: async () => ({ data: { user: {} }, error: null }) }],
    ['the user id is empty', { getUser: async () => ({ data: { user: { id: '' } }, error: null }) }],
    ['the user id is not a string', { getUser: async () => ({ data: { user: { id: 42 } }, error: null }) }],
    ['getUser returns null outright', { getUser: async () => null as unknown as { data?: null } }],
    ['the membership query throws', { membership: async () => { throw new Error('relation does not exist'); } }],
    ['the membership query reports an error', { membership: async () => ({ data: null, error: { code: '42501', message: 'permission denied for table organization_members' } }) }],
    ['the membership query returns null outright', { membership: async () => null as unknown as { data?: null } }],
  ];

  for (const [what, options] of cases) {
    it(`returns null when ${what}`, async () => {
      const { resolver } = fakeClient(options);
      await expect(resolver(BEARER)).resolves.toBeNull();
    });
  }

  it('never throws, whatever the client does', async () => {
    const { resolver } = fakeClient({
      getUser: async () => {
        throw new Error('boom');
      },
    });
    await expect(resolver(BEARER)).resolves.toBeNull();
  });

  it('leaks no Supabase error detail into the result', async () => {
    const secret = 'permission denied for table organization_members (42501) at db.internal:5432';
    const { resolver } = fakeClient({ membership: async () => ({ data: null, error: { message: secret } }) });
    const result = await resolver(BEARER);
    expect(result).toBeNull();
    expect(JSON.stringify(result)).not.toContain('42501');
    expect(JSON.stringify(result)).not.toContain('db.internal');
  });
});

/* ------------------------------------------------------------ Row-shape defence */

describe('membership rows are mapped defensively', () => {
  it('drops malformed rows rather than trusting them', async () => {
    const { resolver } = fakeClient({
      membership: async () => ({
        data: [
          { organization_id: 'org-1' },
          null,
          'org-2',
          42,
          [],
          {},
          { organization_id: null },
          { organization_id: '' },
          { organization_id: 7 },
          { organization_id: ['org-3'] },
          { organisation_id: 'org-4' }, // misspelled column
          { organization_id: 'org-5' },
        ],
        error: null,
      }),
    });
    await expect(resolver(BEARER)).resolves.toEqual({
      userId: USER_ID,
      organizationIds: ['org-1', 'org-5'],
    });
  });

  it('collapses duplicate organization ids, preserving order', async () => {
    const { resolver } = fakeClient({
      membership: async () => ({
        data: [
          { organization_id: 'org-2' },
          { organization_id: 'org-1' },
          { organization_id: 'org-2' },
          { organization_id: 'org-1' },
        ],
        error: null,
      }),
    });
    await expect(resolver(BEARER)).resolves.toEqual({
      userId: USER_ID,
      organizationIds: ['org-2', 'org-1'],
    });
  });

  it('ignores unexpected extra columns on a row', async () => {
    const { resolver } = fakeClient({
      membership: async () => ({
        data: [
          {
            organization_id: 'org-1',
            role: 'owner',
            entitled: true,
            email: 'someone@example.test',
          },
        ],
        error: null,
      }),
    });
    const identity = await resolver(BEARER);
    expect(identity).toEqual({ userId: USER_ID, organizationIds: ['org-1'] });
    expect(JSON.stringify(identity)).not.toContain('owner');
    expect(JSON.stringify(identity)).not.toContain('example.test');
  });

  it('treats a non-array membership payload as no memberships', async () => {
    for (const data of [null, undefined, {}, 'org-1', 42]) {
      const { resolver } = fakeClient({ membership: async () => ({ data, error: null }) });
      await expect(resolver(BEARER), JSON.stringify(data)).resolves.toEqual({
        userId: USER_ID,
        organizationIds: [],
      });
    }
  });
});

/* -------------------------------------------------------------- No privilege */

describe('no privileged credential exists in this path', () => {
  // Comments are stripped first: the module's own documentation has to name the thing it forbids in
  // order to forbid it, exactly as `clubOperations.boundaries.test.ts` does.
  const source = readFileSync(resolve(__dirname, 'callerResolution.ts'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

  it('names no service-role or secret key, and reads no environment', () => {
    for (const pattern of [/SERVICE_ROLE/i, /service[_-]?role/i, /SECRET_KEY/i, /Deno\.env/, /process\.env/, /import\.meta\.env/]) {
      expect(source, `pattern ${pattern}`).not.toMatch(pattern);
    }
  });

  it('takes no credential parameter — only a factory over the caller header', () => {
    expect(source).toMatch(/CallerScopedClientFactory\s*=\s*\(\s*authorizationHeader:\s*string\s*\)/);
    expect(source).not.toMatch(/apiKey|serviceKey|secret/i);
  });
});

/* ------------------------------------------------------- The shell uses this */

describe('the production shell delegates to this module', () => {
  const shell = readFileSync(
    resolve(__dirname, '../../../supabase/functions/club-operations-read/index.ts'),
    'utf8',
  );

  it('builds its resolver here rather than implementing one inline', () => {
    expect(shell).toMatch(/createSupabaseCallerResolver\(/);
    expect(shell).toMatch(/resolveCaller,/);
  });

  it('keeps no membership query or auth decision of its own', () => {
    const withoutComments = shell
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '');
    expect(withoutComments).not.toMatch(/organization_members/);
    expect(withoutComments).not.toMatch(/auth\.getUser/);
    expect(withoutComments).not.toMatch(/\.select\(/);
  });

  it('passes the caller header straight into the client it builds', () => {
    expect(shell).toMatch(/Authorization:\s*authorization/);
    expect(shell).toMatch(/SUPABASE_ANON_KEY/);
    expect(shell).not.toMatch(/SERVICE_ROLE/);
  });
});
