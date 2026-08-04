// A small PostgREST-shaped router over the fixture tables.
//
// This is NOT a Postgres emulator. It implements exactly the surface that
// `src/lib/**` actually uses — the filter operators, ordering, limits and single-row
// Accept negotiation that appear at real call sites — so a page under QA takes the same
// code path it takes in production, including its `.maybeSingle()` null handling and its
// error branch.
//
// TEST-ONLY — never imported from `src/`.

import { tables } from './tables.mjs';
import { rpc } from './rpc.mjs';

const SINGLE_ACCEPT = 'application/vnd.pgrst.object+json';

/* ------------------------------------------------------------------ filters */

const RESERVED = new Set(['select', 'order', 'limit', 'offset', 'on_conflict', 'columns']);

// PostgREST encodes a value list as `in.(a,b,c)`; strings may be quoted.
function parseList(raw) {
  return raw
    .replace(/^\(|\)$/g, '')
    .split(',')
    .map((part) => part.trim().replace(/^"|"$/g, ''));
}

function coerce(raw) {
  if (raw === 'null') return null;
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  if (raw !== '' && !Number.isNaN(Number(raw))) return Number(raw);
  return raw;
}

function matches(row, column, expression) {
  const dot = expression.indexOf('.');
  const op = dot === -1 ? 'eq' : expression.slice(0, dot);
  const raw = dot === -1 ? expression : expression.slice(dot + 1);
  const actual = row[column];

  switch (op) {
    case 'eq': return String(actual) === String(coerce(raw));
    case 'neq': return String(actual) !== String(coerce(raw));
    case 'gt': return actual > coerce(raw);
    case 'gte': return actual >= coerce(raw);
    case 'lt': return actual < coerce(raw);
    case 'lte': return actual <= coerce(raw);
    case 'is': return actual === coerce(raw);
    case 'in': return parseList(raw).some((candidate) => String(actual) === String(coerce(candidate)));
    case 'like':
    case 'ilike': {
      const pattern = raw.replace(/\*/g, '').replace(/%/g, '').toLowerCase();
      return String(actual ?? '').toLowerCase().includes(pattern);
    }
    case 'not': return !matches(row, column, raw);
    default:
      // An operator we have not needed yet must not silently filter everything out —
      // it would look like a legitimate empty state and hide the gap.
      throw new Error(`[qa-fixtures] unsupported PostgREST operator "${op}" on ${column}`);
  }
}

function applyOrder(rows, orderParams) {
  if (!orderParams.length) return rows;
  const specs = orderParams.flatMap((param) => param.split(',')).map((spec) => {
    const [column, ...flags] = spec.split('.');
    return {
      column,
      descending: flags.includes('desc'),
      nullsFirst: flags.includes('nullsfirst'),
    };
  });

  return [...rows].sort((left, right) => {
    for (const { column, descending, nullsFirst } of specs) {
      const a = left[column];
      const b = right[column];
      if (a === b) continue;
      if (a === null || a === undefined) return nullsFirst ? -1 : 1;
      if (b === null || b === undefined) return nullsFirst ? 1 : -1;
      const cmp = a < b ? -1 : 1;
      return descending ? -cmp : cmp;
    }
    return 0;
  });
}

/* ------------------------------------------------------------------ scenarios */

export const SCENARIOS = ['populated', 'empty', 'loading', 'error'];

const ERROR_BODY = {
  code: '57014',
  message: 'Die Verbindung zur Datenbank wurde unterbrochen.',
  details: 'qa fixture: forced error scenario',
  hint: null,
};

/* ------------------------------------------------------------------ router */

/**
 * Resolve one intercepted Supabase request against the fixtures.
 *
 * @param {object} input
 * @param {string} input.url      full request URL
 * @param {string} input.method   HTTP method
 * @param {Record<string,string>} input.headers  lower-cased request headers
 * @param {'populated'|'empty'|'loading'|'error'} input.scenario
 * @param {object} input.session  the synthetic session to answer /auth/v1 with
 * @param {{rpc?:Record<string,unknown>, tables?:Record<string,unknown[]>, functions?:Record<string,{status:number,body:unknown}>}} [input.overrides]
 *   Per-run replacements for individual RPC responses, table row sets or Edge Function
 *   answers. This is how a single named case ("Cogniiq owns the next action", "the
 *   download fails") is exercised WITHOUT forking the fixture layer: the shapes stay the
 *   ones declared in `rpc.mjs`/`tables.mjs`, only the values differ.
 * @returns {{status:number, body:unknown, delayMs?:number}}
 */
export function resolve({ url, method = 'GET', headers = {}, scenario = 'populated', session, overrides = {} }) {
  const parsed = new URL(url);
  const path = parsed.pathname;

  // Auth is never scenario-driven: a page cannot reach its empty or error state if the
  // session itself fails to resolve, and "signed out" is a different test.
  if (path.startsWith('/auth/v1/user')) return { status: 200, body: session.user };
  if (path.startsWith('/auth/v1/token')) return { status: 200, body: session };
  if (path.startsWith('/auth/v1/logout')) return { status: 204, body: null };
  if (path.startsWith('/auth/v1/')) return { status: 200, body: session };

  // Identity always resolves, in every scenario. `profiles` and `organization_members`
  // are what the access guards read to decide whether the user may see the route at all;
  // failing them turns every scenario into "Kein Zugriff" and the page under test never
  // renders. The realistic failure being modelled is "the page loads, its data query
  // fails" — not "the user lost their role".
  // `claim_my_client_invitations` belongs here too: AuthContext AWAITS it during
  // bootstrap, so hanging it under the `loading` scenario froze every route on the auth
  // spinner and no page ever reached its own skeleton — the scenario proved only that the
  // auth guard works, which was not what it was for.
  const isIdentityRead =
    path.startsWith('/rest/v1/profiles')
    || path.startsWith('/rest/v1/organization_members')
    || path === '/rest/v1/rpc/claim_my_client_invitations';

  if (!isIdentityRead) {
    // `loading` never resolves — it is how the harness proves a skeleton is a real
    // transient state and not the page's permanent condition.
    if (scenario === 'loading') return { status: 200, body: [], delayMs: Number.POSITIVE_INFINITY };
    if (scenario === 'error') return { status: 500, body: ERROR_BODY };
  }

  /* ---- Edge Functions ---- */
  // Only reachable when a case explicitly overrides one; otherwise the caller's own
  // handling applies. Used to exercise the document-download failure path.
  if (path.startsWith('/functions/v1/')) {
    const fn = path.slice('/functions/v1/'.length);
    const override = overrides.functions?.[fn];
    if (override) return { status: override.status, body: override.body };
    return { status: 200, body: { url: `${parsed.origin}/qa-fixture-signed-object` } };
  }

  /* ---- RPC ---- */
  if (path.startsWith('/rest/v1/rpc/')) {
    const name = path.slice('/rest/v1/rpc/'.length);
    if (overrides.rpc && name in overrides.rpc) {
      const overridden = overrides.rpc[name];
      if (scenario === 'empty') return { status: 200, body: Array.isArray(overridden) ? [] : null };
      return { status: 200, body: overridden };
    }
    if (!(name in rpc)) {
      // An unknown RPC is a fixture gap, not an empty result. Surfacing it as a
      // PostgREST "function not found" makes the gap visible in the QA report instead
      // of quietly rendering an empty page.
      return {
        status: 404,
        body: { code: 'PGRST202', message: `Could not find the function public.${name}`, details: 'qa fixture gap', hint: null },
      };
    }
    const value = rpc[name];
    if (scenario === 'empty') {
      return { status: 200, body: Array.isArray(value) ? [] : null };
    }
    return { status: 200, body: value };
  }

  /* ---- tables ---- */
  if (!path.startsWith('/rest/v1/')) return { status: 200, body: {} };

  const table = path.slice('/rest/v1/'.length).split('?')[0];
  const overriddenTable = overrides.tables?.[table];
  if (!overriddenTable && !(table in tables)) {
    return {
      status: 404,
      body: { code: 'PGRST205', message: `Could not find the table 'public.${table}' in the schema cache`, details: 'qa fixture gap', hint: null },
    };
  }

  const source = overriddenTable ?? tables[table];

  // Writes never mutate the fixtures — a QA run must be repeatable, and the constraint
  // is that no business record is created anywhere, including in memory.
  if (method !== 'GET' && method !== 'HEAD') {
    const echo = source[0] ?? {};
    return { status: method === 'DELETE' ? 204 : 201, body: method === 'DELETE' ? null : [echo] };
  }

  let rows = scenario === 'empty' ? [] : source;

  for (const [key, value] of parsed.searchParams.entries()) {
    if (RESERVED.has(key)) continue;
    rows = rows.filter((row) => matches(row, key, value));
  }

  rows = applyOrder(rows, parsed.searchParams.getAll('order'));

  const limit = parsed.searchParams.get('limit');
  if (limit) rows = rows.slice(0, Number(limit));

  // `.single()` / `.maybeSingle()` negotiate a bare object. PostgREST answers 406 with
  // PGRST116 when the row count is not exactly one; postgrest-js turns that into
  // `data: null` for maybeSingle and into an error for single. Reproducing the status
  // rather than the outcome is what keeps both branches honest.
  if ((headers.accept ?? '').includes(SINGLE_ACCEPT)) {
    if (rows.length === 1) return { status: 200, body: rows[0] };
    return {
      status: 406,
      body: {
        code: 'PGRST116',
        message: 'JSON object requested, multiple (or no) rows returned',
        details: `Results contain ${rows.length} rows`,
        hint: null,
      },
    };
  }

  return { status: 200, body: rows };
}
