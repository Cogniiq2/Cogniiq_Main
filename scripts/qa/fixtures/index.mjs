// Public entry point of the QA fixture layer.
//
// The harness talks to this module and nothing else. Everything under
// `scripts/qa/fixtures/` is TEST-ONLY: `src/` never imports it, the production bundle
// never contains it, and `src/test/qaFixtureIsolation.test.ts` fails the build if that
// ever stops being true.
//
// Nothing here touches the hosted Supabase project. There is no network client, no
// service-role key, and no write path — the router answers from literals in memory.

import { ID, NAMES, EMAILS } from './ids.mjs';
import { tables } from './tables.mjs';
import { rpc, readRpc, requiredReadRpcNames } from './rpc.mjs';
import { resolve, SCENARIOS } from './router.mjs';

export { ID, NAMES, EMAILS, tables, rpc, readRpc, requiredReadRpcNames, resolve, SCENARIOS };

/** A synthetic, never-issued session. The token is not a JWT and authenticates nothing. */
export function syntheticSession(userId, email) {
  return {
    access_token: `qa-fixture.${userId}`,
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: 4_102_444_800, // 2100-01-01, so a fixture run never expires mid-capture
    refresh_token: `qa-fixture-refresh.${userId}`,
    user: {
      id: userId,
      aud: 'authenticated',
      role: 'authenticated',
      email,
      email_confirmed_at: '2026-01-04T09:00:00Z',
      created_at: '2026-01-04T09:00:00Z',
      updated_at: '2026-07-30T09:00:00Z',
      app_metadata: { provider: 'email', providers: ['email'] },
      user_metadata: {},
      identities: [],
    },
  };
}

export const ROLES = {
  owner: { userId: ID.ownerUser, email: EMAILS.owner },
  customer: { userId: ID.customerUser, email: EMAILS.customer },
};

/**
 * Install the fixture layer on a Playwright BrowserContext.
 *
 * Every request to the Supabase host is answered locally; none leaves the machine.
 * `scenario` selects which of the four states the whole surface is in, so a route can be
 * captured populated, empty, permanently-loading and errored without touching the app.
 */
export async function installFixtures(context, { role, scenario = 'populated', supabaseUrl }) {
  const { userId, email } = ROLES[role];
  const session = syntheticSession(userId, email);
  const host = new URL(supabaseUrl).origin;

  await context.route(`${host}/**`, async (route) => {
    const request = route.request();
    const headers = Object.fromEntries(
      Object.entries(await request.allHeaders()).map(([k, v]) => [k.toLowerCase(), v]),
    );

    const result = resolve({
      url: request.url(),
      method: request.method(),
      headers,
      scenario,
      session,
    });

    if (result.delayMs === Number.POSITIVE_INFINITY) {
      // Hang the request. The page stays in whatever loading state it really has.
      return; // never fulfilled, never aborted
    }

    await route.fulfill({
      status: result.status,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: result.body === null ? '' : JSON.stringify(result.body),
    });
  });

  // supabase-js v2 restores its session from localStorage, keyed by project ref.
  const ref = new URL(supabaseUrl).hostname.split('.')[0];
  await context.addInitScript(
    ({ storageKey, value }) => {
      window.localStorage.setItem(storageKey, JSON.stringify(value));
    },
    { storageKey: `sb-${ref}-auth-token`, value: session },
  );

  return { session, userId, email };
}
