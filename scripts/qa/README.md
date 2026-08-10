# Route QA

Browser QA for the two authenticated surfaces, run against the **production build** and a
deterministic in-memory fixture layer. Nothing here reads from or writes to hosted Supabase:
every request to the Supabase origin is intercepted and answered from literals, and the
session is synthetic (its token is not a JWT and authenticates nothing).

## What runs

| Harness | What it answers |
| --- | --- |
| `.github/scripts/qa-dashboard-shell.mjs` | Is the primary navigation a persistent vertical sidebar at 1440/1280/1024/834/390, for both roles, with a working mobile drawer and reduced-motion support? |
| `scripts/qa/route-qa.mjs` | Does every listed route render **populated**, **empty** and **error** without console errors, horizontal overflow or sub-44px option rows? |

## Running it

```bash
# The build must carry the QA Supabase placeholders, or the app throws at boot.
VITE_SUPABASE_URL=https://example.supabase.co VITE_SUPABASE_ANON_KEY=qa-placeholder npm run build
npx vite preview --port 4173 --strictPort &

node scripts/qa/route-qa.mjs --out qa-screenshots            # everything
node scripts/qa/route-qa.mjs --out qa-screenshots --only app # one route subset
```

Playwright is deliberately **not** a `package.json` dependency and CI does not invoke these:
they are development tools. Set `PW_CHROMIUM`, or `PLAYWRIGHT_BROWSERS_PATH`, to point at a
Chromium.

Output lands in `--out` (git-ignored): one screenshot per route × scenario × viewport, plus
`route-qa-report.md` and `route-qa-report.json`. The run exits non-zero on any finding.

## Scenarios

`populated`, `empty`, `loading` and `error` are selected per run and applied to the whole
surface, so a route can be photographed in each state without touching the app.

One RPC is **scenario-invariant**: `current_user_portal_context`. "Empty" means the
organization holds no projects, documents or invoices — not that the caller has no access
context. Blanking it would make every capability guard fail closed and the harness would
photograph the guard instead of the empty state.

## Isolation

`src/test/qaFixtureIsolation.test.ts` fails the test suite if anything under `src/` imports
`scripts/qa/fixtures/`. That is what keeps "test-only" a checked property rather than a
comment — the fixtures invent customers, invoices and German company names, and none of it
may ever reach a production bundle.
