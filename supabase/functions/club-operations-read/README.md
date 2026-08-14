# `club-operations-read` — Component A of the Club Operations read gateway

**Not deployed. Not deployable today.** This directory is source only. No `supabase functions deploy`
was run, no project was linked, no migration was applied, no hosted service was contacted, and
`club_operations` remains `unavailableImplementation` in the solution registry — unrouted and
inactive.

Implements subphase **D3b-A** of [`docs/club-operations/phase-d3b-plan.md`](../../../docs/club-operations/phase-d3b-plan.md).

## What this function is

The Cogniiq-side request boundary. A signed-in Cogniiq user asks for club operational data; this
function decides whether that is permitted, validates the parameters, signs a CQGW1 request, sends
it to the upstream club gateway over HTTPS, and validates the answer exhaustively before any of it
goes back.

The browser never learns that the upstream exists. It has no URL, no key id, no key and no knowledge
of the signing protocol — all of that lives here, on the server.

## Why it denies every caller

Two dependencies are wired to deny, on purpose:

| Wiring | Why |
|---|---|
| `denyAllAuthorizer` | The real, generic, database-backed entitlement authorizer is separate reviewed work (plan §19, item **B1**). Deny-by-default is the correct posture while the solution is inert. |
| `unconfiguredRateLimiter` | The durable rate limiter's thresholds are an unresolved owner decision (plan §19, item **B4**). There is no safe number to invent, so the boundary denies without contacting the upstream. |

Replacing either one is not an implementation detail — it is the thing that has to be reviewed
before this function can be deployed at all.

## Response protection — stated exactly

Responses from the upstream are **unsigned** (owner decision 1, plan §5). What protects them is:

> **transport protection + application validation, not cryptographic end-to-end authenticity**

HTTPS protects the bytes in transit; the boundary treats everything that arrives as untrusted input
and validates it exhaustively (plan §5.2, implemented in `src/lib/gateway/clubGatewayResponse.ts`).
This function **cannot** cryptographically distinguish "the real upstream answered" from "something
holding a valid certificate at that host answered". Every operation is a pure read, and a forged
response can only mislead a dashboard — never cause a write — which is why the owner accepts this
for the read-only release.

There is no CQGW1-R, no second key pair, no response-signing secret, no response public key, no
rotation process, and **no environment variable for any of those**.

## Environment variables — names only

No value for any of these appears in this repository, in a test, in a fixture, in a log or in a
commit message. No `.env` file was read while writing this.

| Name | Meaning |
|---|---|
| `CLUB_OPS_GATEWAY_URL` | Origin of the upstream project. **https only**; a path, query, fragment or embedded credential is refused at startup. The signed path is fixed by `CQGW1_CANONICAL_PATH` and is not configurable. See "Where the destination comes from" below. |
| `CLUB_OPS_GATEWAY_KEY_ID` | CQGW1 key id, `[A-Za-z0-9_.-]{1,64}`. |
| `CLUB_OPS_GATEWAY_SIGNING_KEY` | Ed25519 private key, PKCS#8, base64url unpadded. Imported once as a non-extractable `CryptoKey`; the raw bytes are never returned, stringified or logged. |
| `CLUB_OPS_GATEWAY_ALLOWED_ORIGINS` | Comma-separated exact-match CORS allowlist. An origin outside it receives no CORS headers at all. |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | Runtime-provided. Used only to verify the caller's own token and read that caller's own memberships under their own identity. |

**No service-role key.** Every check runs under the caller's identity, so there is no privileged
credential in this path to misuse.

## Request path, in order

1. `OPTIONS` → CORS preflight, nothing else.
2. Method must be `POST`, else `405`.
3. Configuration present, else `500 {"error":"Server is not configured"}` — never naming which piece.
4. `Authorization: Bearer …` present, else `401`.
5. The caller's own token resolves to an identity, else `401`.
6. The caller belongs to at least one organization, else the single opaque `403`.
7. The entitlement authorizer explicitly allows the operation, else the same opaque `403`.
8. Parameters validate, else `400`.
9. The rate limiter allows the call, else `429`.
10. Only now: sign CQGW1 and send.

Every denial in 6–7 returns one byte-identical `403`, so nothing about the entitlement model is
probeable — and an unentitled caller never learns whether its parameters would have validated.

Identity comes from the caller's bearer token and from nowhere else. The request body admits exactly
`operation` and `query`; a `userId`, `organizationId` or `email` anywhere in the body, headers or URL
is refused, never adopted.

## Where the destination comes from — a configuration trust, stated plainly

The outbound destination is **operator-controlled configuration and nothing else**. No caller input
reaches it: there is no host, path, project or URL parameter in the request contract, the body admits
exactly `operation` and `query`, and the signed path is a compile-time constant. The transport
additionally requires `https:`, refuses an embedded credential, refuses a base URL carrying its own
path, query or fragment, and refuses every redirect rather than following one.

What that does **not** cover, and what deployment review must therefore check by hand:

* a `CLUB_OPS_GATEWAY_URL` set to the wrong host is simply the wrong host — the function will sign
  and send to it, because a valid-looking configured origin is exactly what it is built to trust;
* a correct hostname whose DNS resolves somewhere unintended (internal address, rebound record) is
  likewise outside what this code can detect.

No caller-controlled host allowlist exists and none should be added — an allowlist implies callers
have a say in the destination, and they do not. **The control is the deployment review: confirm the
exact configured origin against the intended upstream project before any secret is set.**

## Deno and bundling — what has been checked, and what has not

Checked, offline, with no downloads:

* every **local** module in this function's runtime graph passes `deno check` under Deno 2.9.5 —
  `clubGatewayShell.ts`, `callerResolution.ts`, `clubGatewayTransport.ts`, `clubGatewayResponse.ts`,
  `cappedRead.ts`, `entitlement.ts`, `operationValidation.ts`, `cqgw1.ts`, `encoding.ts`,
  `canonicalJson.ts`, plus `responseValidation.ts` and `types.ts`;
* the `.ts` import specifiers resolve;
* no Node-only, browser-only or Vite-only API appears anywhere in that graph, and nothing in it
  reaches React or the DOM;
* `resolveJsonModule` in `tsconfig.app.json` exists for the **test** suite's conformance-vector
  import. It says nothing about Deno, and no JSON import exists in this function's runtime graph.

**Not** checked, and not claimed:

* **the entry point itself.** `index.ts` imports `deno.land/std@0.224.0/http/server.ts` and
  `esm.sh/@supabase/supabase-js@2.58.0`; those are not in the local Deno cache, and downloading them
  was out of scope. `deno check` of this file has therefore never completed. The two URLs are
  byte-identical to the pattern `admin-provision-client` already runs in production, which is
  reassurance, not verification.
* **cross-directory bundling.** This function imports `../../../src/lib/gateway/**`, outside
  `supabase/functions/`. Every other function in this repository is self-contained, so whether the
  deploy bundler follows those imports has **no precedent here and is unproven**.

`deno.json` in this directory exists solely to stop Deno's config discovery from walking up to the
repository's Vite `tsconfig.json`, whose `baseUrl` fails under the TypeScript version Deno 2.9.5
ships (TS5101). It declares no permissions, tasks or import maps.

**D3b-I must serve this exact entry point in the local Supabase Edge runtime** and record the result.
Until it does, "deployable" is not a claim this repository makes. **No hosted deployment is
authorised** regardless of the outcome — B1 and B4 remain unresolved.

If bundling turns out to require copying or bundling the module graph into this directory, that is a
**separately reviewed change**, not a mechanical fix: it must preserve the pinned contract hashes in
`contractHashes.test.ts` and keep the shared `conformanceVectors.json` passing on both sides, or the
cross-repository parity discipline is silently broken by a build step.

## Where the logic lives, and why it is not in this file

Cogniiq's `vitest.config.ts` collects only `src/**/*.test.ts`, so nothing under
`supabase/functions/` is reachable by the test suite. The behaviour therefore lives in modules that
are:

| Module | Role |
|---|---|
| `src/lib/gateway/clubGatewayShell.ts` | steps 1–10 above, CORS, the error vocabulary, the rate-limit seam |
| `src/lib/gateway/callerResolution.ts` | token validation through `auth.getUser()`, the caller's own membership read, and every fail-closed decision made with them |
| `src/lib/gateway/cappedRead.ts` | the one capped stream reader both the inbound request and the outbound response are read through |
| `src/lib/gateway/entitlement.ts` | the fail-closed authorizer interface and `denyAllAuthorizer` |
| `src/lib/gateway/operationValidation.ts` | per-operation parameter validation for the closed twelve |
| `src/lib/gateway/clubGatewayTransport.ts` | canonical body, CQGW1 signing, one HTTPS request, no redirects, abort budget |
| `src/lib/gateway/clubGatewayResponse.ts` | the ten-step response pipeline |
| `src/lib/gateway/cqgw1.ts`, `encoding.ts`, `canonicalJson.ts` | the frozen contract modules — D3b writes no new crypto |

This file is what is left over: environment reads, dependency construction, one call.

## Deploy steps — documented, **not executed**

None of the following was run, and none may be run until B1 and B4 are resolved and the upstream
component exists:

```
supabase secrets set CLUB_OPS_GATEWAY_URL=… CLUB_OPS_GATEWAY_KEY_ID=… \
  CLUB_OPS_GATEWAY_SIGNING_KEY=… CLUB_OPS_GATEWAY_ALLOWED_ORIGINS=…
supabase functions deploy club-operations-read
```

Deployment verdict from the plan (§21): **NO-GO** — deny-all is not a deployable posture, the rate
limits are unconfirmed, and the entitlement model is unbuilt.

## Not claimed

* That the upstream gateway exists or is deployed — it does not and is not (subphase D3b-B).
* That the upstream read-only database role exists — it does not; D3a is committed but unapplied.
* Cryptographic authenticity of any response (see above).
* Constant-time signature verification.
* That `default_transaction_read_only` is a write barrier — it is not, and was demonstrated not to be.
* **That caller resolution is bounded.** Neither the `auth.getUser()` call nor the organization-
  membership read in `callerResolution.ts` carries an explicit timeout or cancellation strategy, and
  the membership result has no documented row cap. Harmless while the authorizer is `denyAllAuthorizer`
  — the per-organization work is constant and nothing downstream runs — but a real authorizer turns an
  unbounded membership list into unbounded entitlement work, and an unbounded auth call into
  unbounded latency inside the request budget. **Both bounds must be decided and implemented with B1,
  before any deployment or activation.**
