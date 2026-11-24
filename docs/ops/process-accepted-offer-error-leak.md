# process-accepted-offer — raw database error exposure (deployed build)

## Finding

The **deployed** build of the public Edge Function `process-accepted-offer` (called without a
JWT by anyone holding an offer link) returns raw Postgres error text in its JSON response when
`record_offer_acceptance` fails. That text can include constraint, function and column names
and is shown to anonymous callers. Found during the 2026-11 read-only production audit.

## State of the source

`supabase/functions/process-accepted-offer/index.ts` on `main` is already safe: every error
response is a fixed English string (`link is not valid`, `could not store signature`,
`acceptance could not be recorded`, …) and nothing is logged. The deployed version predates it.

## This change

- `.github/scripts/test-public-edge-function-error-surface.mjs`: static guard (with self-test)
  that fails the build if a `json(...)`, `new Response(...)` or `console.*` call in the public
  function exposes `err.message/.details/.hint/.code/.stack`, a stringified or interpolated error.
- Wired into `build.yml`.
- No runtime code change, no deployment.

## Required owner action (not performed)

Redeploy the function from `main` after review:

```bash
supabase functions deploy process-accepted-offer --no-verify-jwt
```

Verify afterwards with an invalid token (expect `{"ok":false,"error":"link is not valid"}`);
do not use a real customer's link. Environment variables and secrets are unchanged.
