# Phase D3b — local Club Operations gateway implementation plan (revision 2)

**Status: audit and plan only. Nothing in this document has been implemented.** No Edge Function
exists, no migration was written, no hosted project was contacted, no dependency was installed, and
`club_operations` still resolves to `unavailableImplementation`.

**Revision 2 incorporates four owner decisions** that resolve the blockers A1–A4 of revision 1:

| Decision | Resolution |
|---|---|
| 1 — response protocol | responses are **unsigned**; TLS in transit plus strict application-level validation in A. No CQGW1-R, no second key pair, no response-signing secret, no rotation process. |
| 2 — component ownership | three independently reviewable subphases: **D3b-A** (Cogniiq_Main), **D3b-B** (SVHeinersreuth), **D3b-I** (local integration proof). No deployable Component B code under `Cogniiq_Main/docs/`. |
| 3 — entitlement | a **generic, fail-closed entitlement-authorizer interface** in D3b-A. Deny-by-default until a separately reviewed generic database-backed implementation exists. Nothing customer-specific is hardcoded. |
| 4 — source-absent data | **explicit `null`, never a fabricated string.** Keys are retained for stable response shape; types, validators, fixtures and tests change consistently; documented as a pre-deployment contract correction. Extended by the §7.4 refund-amount finding, accepted by the owner as required contract completion. |

Authorities, in precedence order:

1. [`phase-d2-contract.md`](./phase-d2-contract.md) — binding on D3.
2. [`d2-spike/README.md`](./d2-spike/README.md) — the measured evidence behind it.
3. `src/lib/gateway/gatewayRoleGuards.ts` → `D3_ACCEPTANCE_CONSTRAINTS` — the constraints in code.
4. `SVHeinersreuth/supabase/migrations/20260814120000_add_cogniiq_readonly_gateway_role.sql` and
   `SVHeinersreuth/docs/cogniiq-gateway/d3a-adapter-column-mapping.md` — read-only, D3a.
5. The four owner decisions recorded above, which supersede revision 1's §19 items A1–A4.

Verified state at the time of writing:

| Repository | Branch | HEAD | Tree |
|---|---|---|---|
| `Cogniiq_Main` | `claude/club-operations-d3b-gateway` (from `main`) | `2b38e7a` | clean apart from this plan |
| `SVHeinersreuth` | `main` | `1e4bcf1` | clean, **unmodified** |

Baseline suite for the affected areas: **346 passed, 1 skipped, 0 failed** (`src/lib/gateway`,
`src/solutions/club-operations/adapter`, boundaries, inertness). Ed25519 through `crypto.subtle`
works in the vitest environment — `cqgw1.test.ts` passes 40/40 there.

---

## 1. Purpose and trust boundary

The gateway lets a signed-in Cogniiq user read the SV Heinersreuth club's operational data **without
Cogniiq's browser ever learning that the club system exists**, and without any credential capable of
writing to it existing anywhere in the path.

```
 browser                A: club-operations-read         B: cogniiq-read-gateway          club DB
 ───────                (Cogniiq_Main)                  (SVHeinersreuth)                 ───────
 Cogniiq session  ──►   verify Cogniiq JWT        ──►   verify CQGW1 signature     ──►   cogniiq_readonly
 (no knowledge of       organization membership         timestamp / request-id           column-scoped
  SVH, no URL,          entitlement authorizer,         replay constraints               SELECT + RLS
  no key)               fail closed                     closed operation allowlist       statement_timeout 2s
                        durable rate limit              parameter validation
                        sign CQGW1 request              named-column SELECT only
                        strict response validation      per-request client, finally
        ◄── domain JSON ──                ◄── unsigned JSON over TLS ──          ◄── rows ──
```

**Trust boundary 1 — browser ↔ A.** The browser presents only its own Cogniiq session. Identity is
never a parameter (`ClubOperationsAdapter.ts` header). A carries the URL, the key id and the private
signing key; none of them is a `VITE_*` variable and none appears in any browser-reachable module.
`clubOperations.boundaries.test.ts` already fails the build if the solution module so much as names
a URL, `fetch`, `createClient`, `import.meta.env` or a JWT-shaped literal.

**Trust boundary 2 — A ↔ B.** *Requests* are authenticated by CQGW1 over Ed25519. B trusts a request
only because it verifies against a public key it holds; it never trusts the network, the body, or a
header before the signature verifies. *Responses* are unsigned (owner decision 1, §5). A trust
failure in either direction maps to `unavailable` at the adapter, **never** `forbidden`
(`transportAdapter.ts:77`), so the client cannot be used as an oracle for the A↔B relationship.

**Trust boundary 3 — B ↔ database.** `cogniiq_readonly`: column-scoped `SELECT`, `USAGE` on the
schema, `FOR SELECT` RLS only, `NOBYPASSRLS`, `CONNECTION LIMIT 24`, server-enforced
`statement_timeout = '2s'`. The permitted security claim, verbatim and only this: **"Read-only access
is enforced by restricted PostgreSQL grants plus RLS."**

**Not a boundary:** `default_transaction_read_only = on`. D2c wrote real rows straight through it via
three client-side paths. It is a convenience default that catches careless writes and must never be
described otherwise, in code, comment, doc or commit message.

---

## 2. The three-subphase architecture (owner decision 2)

### 2.1 Subphases and repository ownership

| Subphase | Repository | Component | One-line scope |
|---|---|---|---|
| **D3b-A** | `Cogniiq_Main` | `club-operations-read` | the Cogniiq request boundary: JWT, membership, fail-closed entitlement, rate limit, CQGW1 signing, injectable transport, strict response validation, sanitized errors |
| **D3b-B** | `SVHeinersreuth` | `cogniiq-read-gateway` | the SVH database gateway: CQGW1 verification, timestamp/request-id/replay constraints, closed operation allowlist, parameter validation, Supavisor 6543 transaction mode as `cogniiq_readonly`, named-column parameterized SELECTs only, per-request client closed in `finally`, defined response envelope, no DML, no `SELECT *` |
| **D3b-I** | harness only (see §2.4) | both, locally | run both components against disposable local infrastructure with fictional fixtures; prove the complete request path and every negative path |

No deployable Component B code exists in `Cogniiq_Main` in any form — not under `docs/`, not under
`supabase/functions/`, not vendored into a test. D3b-B is authored, reviewed and owned in
`SVHeinersreuth`.

### 2.2 Dependency order

```
 (0) contract freeze              already in Cogniiq_Main main: cqgw1.ts, encoding.ts,
     ────────────────             canonicalJson.ts, the closed 12-operation union,
                                  the D3a column grant — plus the §7 nullable-field
                                  contract correction, which lands FIRST, in D3b-A's
                                  repository, because it changes types and validators
                                  that both sides build against.

 (1) D3b-A  (Cogniiq_Main)   ┐    independently reviewable; may proceed in either
 (1) D3b-B  (SVHeinersreuth) ┘    order or in parallel once (0) is merged. Neither
                                  imports the other; they meet only at the wire
                                  contract and the shared conformance fixtures.

 (2) D3b-I                        strictly last. Requires both (1) branches checked
                                  out locally. Produces recorded evidence, no code
                                  that ships.
```

The one cross-repository fact that makes (1) parallelizable: **B cannot import Cogniiq_Main
modules.** The CQGW1 verifier, encoding and canonical-JSON code must exist in SVHeinersreuth as a
transcription of the Cogniiq originals. Drift between the two copies is the failure mode; the guard
is a **byte-hash parity check on both sides** — D3b-A pins the SHA-256 of each shared contract
module in a test, D3b-B pins the same hashes (modulo the one mechanical `.ts`-specifier rewrite the
D2d spike already validated, whose post-rewrite hash is pinned instead), and a documented
conformance-vector file (signed requests with expected accept/reject outcomes) is run by both suites.
This mirrors exactly what the D2d spike did with recorded hashes (`302306fe…`, `d75efd31…`).

### 2.3 Branch strategy

| Subphase | Repository | Branch | Created when |
|---|---|---|---|
| plan (this revision) | Cogniiq_Main | `claude/club-operations-d3b-gateway` — **the existing branch, no new branch** | exists now |
| D3b-A | Cogniiq_Main | `claude/club-operations-d3b-a-request-boundary`, from the latest `origin/main` **after** this plan is merged | at D3b-A start |
| D3b-B | SVHeinersreuth | `claude/cogniiq-read-gateway-d3b-b`, from the latest SVH `origin/main` | at D3b-B start — **explicitly not created during this planning correction** |
| D3b-I | none (scratch checkouts + harness docs on the D3b-A branch or its successor) | — | at D3b-I start |

Each subphase is merged through its own PR in its own repository. No PR may span repositories, and
no subphase branch is cut from another subphase branch.

### 2.4 Where D3b-I's files live

D3b-I ships no deployable code. Its artefacts are: a harness README, driver scripts, fixture SQL for
**fictional** rows, and a recorded-results document. These live in
`Cogniiq_Main/docs/club-operations/d3b-integration/` — permissible because they are harness
material, not Component B source (owner decision 2 forbids *deployable Component B code* under
`Cogniiq_Main/docs/`, and the harness copies B from the SVH checkout at run time, exactly as the D2
spike copied its functions into the scratch project). The scratch Supabase project itself lives
outside both repositories and is destroyed on teardown.

---

## 3. Component names, paths and the testability constraint

| | D3b-A | D3b-B |
|---|---|---|
| Function name | `club-operations-read` | `cogniiq-read-gateway` |
| Shell path | `Cogniiq_Main/supabase/functions/club-operations-read/index.ts` | `SVHeinersreuth/supabase/functions/cogniiq-read-gateway/index.ts` |
| Canonical signed path | — | `/functions/v1/cogniiq-read-gateway` (34 UTF-8 bytes, `cqgw1.ts:44`) |
| Deployed by D3b? | **no** | **no** |

B's name is fixed by `CQGW1_CANONICAL_PATH` and cannot be chosen freely — changing it changes every
signature. A's name follows the existing repository convention (`admin-provision-client`,
`public-document-portal`, `customer-document-download`).

**Testability constraint that shapes both.** Cogniiq's `vitest.config.ts` collects only
`src/**/*.test.{ts,tsx}`; nothing under `supabase/functions/` is reachable by the suite. Therefore
**all D3b-A logic lives in `src/lib/gateway/**` and the `index.ts` is a thin shell** — env read,
request/response plumbing, one call into a tested module. D3b-B applies the same rule in its own
repository: logic in a testable module tree, `index.ts` as a shell, tested under Deno
(`deno test`), which is the runtime B actually runs in.

---

## 4. Request protocol (unchanged from D2 — implementable today)

`POST /functions/v1/cogniiq-read-gateway`, six mandatory headers (`cqgw1.ts:47`):

| Header | Value |
|---|---|
| `X-CQ-Version` | `CQGW1` |
| `X-CQ-Key-Id` | `[A-Za-z0-9_.-]{1,64}` |
| `X-CQ-Timestamp` | Unix seconds, decimal, ±60 s |
| `X-CQ-Request-Id` | `[A-Za-z0-9_-]{8,64}` |
| `X-CQ-Operation` | one of the closed 12 |
| `X-CQ-Signature` | Ed25519, base64url **unpadded**, padding rejected |

Body: `{"operation": "<same as header>", "query": { … }}`, canonical JSON (`canonicalJson.ts`),
≤ 64 KiB. Signing is `signCqgw1Request`; verification is `verifyCqgw1Request` with its eleven
fail-closed steps. **Both already exist and are tested. D3b writes no new crypto and no new
canonical-string code.**

**Replay constraints in B (owner decision 2 scope line).** CQGW1 carries no dedicated nonce header;
`X-CQ-Request-Id` is the nonce. B enforces, in addition to the ±60 s window: a per-worker in-memory
set of request ids seen within the window — a repeated id inside the window is rejected with the
same opaque 401 as any other verification failure. This is stated honestly as **best-effort,
worker-scoped replay suppression**: a durable replay store is impossible by design, because the only
database credential B holds is read-only and D2 §2 explicitly removed the upstream-side durable
counter rather than trade away the read-only guarantee. The ±60 s window remains the entire durable
replay exposure, exactly as `cqgw1.ts:56` documents; every operation is a pure read, so a replayed
request re-reads data the caller was already entitled to read. If a stronger guarantee is ever
required, that is a contract change needing owner review — not something D3b invents.

---

## 5. Response model — unsigned, strictly validated (owner decision 1)

There is **no response signing**. No CQGW1-R, no second Ed25519 key pair, no response signing
secret, no response-key rotation process, and no environment variable for any of those. What
protects the response:

* **in transit** — HTTPS/TLS to the pinned upstream URL;
* **at the application boundary** — A treats every response as untrusted input and validates it
  exhaustively before anything reaches the adapter.

**Stated plainly, and to be documented verbatim in both READMEs:** this provides transport
protection and application-level validation. It does **not** provide cryptographic end-to-end
response authenticity. A cannot cryptographically distinguish "the real B answered" from "something
holding a valid certificate at that host answered". Given that every operation is a pure read and a
forged response can only mislead a dashboard — never cause a write — the owner accepts this for the
read-only release.

### 5.1 The response envelope

B returns, for a successful operation, exactly this top-level shape and nothing else:

```json
{
  "requestId": "<echo of X-CQ-Request-Id>",
  "operation": "<echo of the verified operation>",
  "result": { … operation-specific payload … }
}
```

Exactly three top-level fields. An unknown top-level field is a validation failure in A, not
something to ignore — the contract requires exactness, and "ignore unknown fields" is how an
envelope quietly grows a side channel. Error responses carry an opaque body as §12 specifies and are
never parsed for content beyond status classification.

### 5.2 A's mandatory response checks, in order, fail-closed at every step

| # | Check | Failure maps to |
|---|---|---|
| 1 | fetch issued with `redirect: 'error'` — **any redirect is a hard failure**, never followed | `unavailable` |
| 2 | timeout via `AbortController` (budget below); abort → no partial read is ever parsed | `unavailable` |
| 3 | HTTP status: `200` proceeds; 400/422 → `invalid_query`; 401/403 from B → `unavailable` (trust failure, never surfaced as a permission problem); 413/429/5xx → `unavailable`; anything else → `unknown` | per row |
| 4 | `Content-Type` is exactly `application/json` (parameters beyond charset=utf-8 rejected) | `unknown` |
| 5 | body read through a **capped reader** — hard maximum 4 MiB; bytes beyond the cap are never read, let alone parsed; `Content-Length`, when present, is checked against the cap before reading | `unknown` |
| 6 | UTF-8 decode with `fatal: true`; `JSON.parse` — malformed **and truncated** JSON both fail here, since a truncated body is not valid JSON | `unknown` |
| 7 | envelope shape: an object with exactly the three fields of §5.1, no more, no fewer | `unknown` |
| 8 | `requestId` equals the id A generated for this request — correlation, so a delayed or crossed response can never satisfy the wrong call | `unknown` |
| 9 | `operation` equals the operation A requested | `unknown` |
| 10 | `result` passes the operation's full runtime validator from `responseValidation.ts` — the 772-line structural check that rejects a float where cents belong, an unknown enum member, a missing field, a partially valid object | `unknown` |

Only after step 10 does data reach `createTransportAdapter`'s caller, and through it the UI.

**Timeout budget.** The upstream statement timeout is 2 s, server-enforced. A's total budget per
request: **10 s** (connection establishment + B's verification + query + transfer), enforced by
`AbortController`. One controlled retry applies only to a connection-establishment failure (§10),
never to a timeout — a timed-out statement was cancelled server-side and retrying it immediately is
how retry storms start.

---

## 6. Authentication, authorization and the fail-closed entitlement interface (owner decision 3)

### 6.1 Flow in A, strict order, fail-closed at every step

1. `OPTIONS` → CORS preflight response, nothing else (§11).
2. Method must be `POST`, else `405`.
3. Server configuration present (URL, key id, signing key). Missing → `500`
   `{"error":"Server is not configured"}` — never naming which variable.
4. `Authorization: Bearer <jwt>` present, else `401`.
5. Caller-scoped Supabase client with that bearer; `auth.getUser()`; failure → `401`. This is the
   existing `admin-provision-client` pattern: identity from the caller's own token, privilege
   confirmed from the database under that identity, never from user metadata or the request body.
6. **Generic organization membership**: the caller belongs to at least one organization, read under
   the caller's own identity through existing RLS-protected tables. No membership → the single
   opaque `403`.
7. **Entitlement authorizer** (§6.2): called with the caller's user id, the organization id and the
   requested operation. Anything but an explicit allow → the same single opaque `403`.
8. Parse and validate the body: `operation` inside the closed 12, `query` an object, per-operation
   parameter validation (§9). Failure → `400`.
9. Durable rate limit in Cogniiq Postgres, atomic, keyed on (organization, user, operation).
   Exceeded → `429`, which the adapter maps to `unavailable` so the limit itself does not leak.
10. Only now: sign and issue the CQGW1 request through the injectable transport.

Every distinct denial in steps 6–7 — no membership, no entitlement, unknown organization, authorizer
error — returns **one byte-identical `403`**, so nothing about the entitlement model is probeable.

### 6.2 The entitlement-authorizer interface

Generic, minimal, and biased so that every failure mode is a denial:

```ts
// src/lib/gateway/entitlement.ts
export interface EntitlementRequest {
  userId: string;
  organizationId: string;
  operation: Cqgw1Operation;
}

/**
 * The ONLY value that authorizes anything is the literal object { entitled: true }.
 * A throw, a rejection, a timeout, undefined, null, a truthy non-conforming value —
 * every one of them is a denial. There is no bypass parameter, no environment
 * switch, no development flag, and no way to construct an allow from anything
 * except an authorizer that explicitly returns it.
 */
export type EntitlementAuthorizer = (
  request: EntitlementRequest,
) => Promise<{ entitled: boolean }>;

/** The production authorizer until a reviewed implementation replaces it. */
export const denyAllAuthorizer: EntitlementAuthorizer = async () => ({ entitled: false });
```

Hard rules, each backed by a test (§14):

* the production shell wires `denyAllAuthorizer` — **every caller is denied today**, which is the
  correct state while `club_operations` is inert;
* an authorizer that throws or rejects denies;
* no environment variable, header, query parameter, cookie, development account or special identity
  influences the decision — asserted by a static scan of the module for `Deno.env`, `import.meta.env`
  and request-derived inputs reaching the authorizer selection;
* nothing customer-specific exists anywhere in D3b-A: no "SV Heinersreuth" or "SVH" string, no
  organization id, no user id, no email address, no project reference, no admin identity. The
  boundary scan already forbids most of these in the solution module; D3b-A extends the same
  patterns to `src/lib/gateway/**`.

### 6.3 What is implemented now vs. what needs separate review

**Now (D3b-A):** the interface, `denyAllAuthorizer`, the wiring, the opaque-403 discipline, and the
deny-by-default tests. **No new database migration in this round** (owner decision 3).

**Later, as its own reviewed work:** the real generic database-backed authorizer — presumably a read
over the organization-solutions tables answering "does this organization hold an active
`club_operations` entitlement and does this caller's role include it". It will need its own design
(which tables, which roles, whether per-operation granularity is real or notional), possibly a
migration, and its own review and tests. Until that lands: the function stays undeployed, every
request is denied, and `club_operations` stays inactive and unavailable in the registry.

**In B:** no entitlement concept at all. B authenticates a *key*, not a person, via CQGW1's eleven
steps. B must not become a second, weaker place where Cogniiq's authorization model is
re-implemented.

---

## 7. Source-absent data — the nullable-field contract correction (owner decision 4)

**Rule: never fabricate a string to satisfy a validator.** Where no authoritative upstream column
exists (per the D3a mapping), the key is **retained** — a stable response shape is what makes
canonical validation meaningful — and the value is **explicitly `null`**. TypeScript types, runtime
validators (`responseValidation.ts`), the fixture adapter's fixtures, and every affected test change
together, in one reviewed commit inside D3b-A, **before** either component is built against the
contract. This is a pre-deployment contract correction: no deployed consumer exists, so no
compatibility shim is needed — but it must land first (§2.2 step 0).

### 7.1 Full audit of the domain model against the D3a grant

Every field of every response type was checked against the 93-column grant. Fields with a direct or
derivable source are unchanged. The complete list of fields **without** an authoritative source:

| Field | Current type | Corrected type | Source situation |
|---|---|---|---|
| `Payment.customerName` | `string` | `string \| null` | no `payments.customer_name` column; the name lives in `payments.metadata` (excluded). **Conditional derivation** (§7.2) or `null`. |
| `Payment.refundedCents` | `number` | `number \| null` | **no refund-amount column exists on `payments`** — see §7.1a |
| `PaymentTotals.refundedCents`, `.netCents`, `.refundedCount` | `number` | `number \| null` | depend on the unavailable refund amount; `refundedCount` decided on evidence in §7.1b |
| `RefundBreakdown.totalCents` | `number` | `number \| null` | sums `Payment.refundedCents` |
| `ReconciliationEntry.refundAmountCents` | `number` | `number \| null` | is `Payment.refundedCents` at its only construction site |
| `ReconciliationCounts.refundedTotalCents` | `number` | `number \| null` | sums `ReconciliationEntry.refundAmountCents` |
| `Payment.note` | `string \| null` | unchanged (`null` when absent) | lives in `metadata`; no permitted source → always `null` |
| `Payment.metaClass` | `PaymentMetaClass` | `PaymentMetaClass \| null` | upstream derives `double_booking` / `customer_cancelled` from `metadata`, which is excluded. **No source → `null`**, and every consumer that counts by metaClass treats `null` as "not classifiable", not as `standard`. |
| `PaymentTotals.doubleBookingCount`, `.customerCancelledCount` | `number` | `number \| null` | derived purely from `metaClass`; with `metaClass` unsourced these counts are unknowable, and `0` would be a synthetic claim |
| `Member.city`, `Member.postalCode` | `string` | `string \| null` | no upstream column |
| `Member.validUntil` | `string \| null` | unchanged | already nullable; no column → `null` |
| `Member.bookingCount`, `Member.bookingRevenueCents` | `number` | `number \| null` | member↔booking association is **none** by contract; `0` would assert "this member booked nothing", which is not known — `null` says "not linkable", which is true |
| `Voucher.expiresAt` | `string` | `string \| null` | expiry "not tracked upstream" (D2 §3); no value may be invented |
| `Voucher.usages` | `VoucherUsage[]` | `VoucherUsage[] \| null` | usage history not tracked; `null` ("not tracked") is distinct from `[]` ("tracked, none"), and conflating them is exactly the invention decision 4 forbids |
| `VoucherTotals.expiredCount` | `number` | `number \| null` | with no expiry data, no voucher can be classified expired; a hard `0` would claim knowledge |
| `Voucher.status` value `'expired'` | — | **unreachable from upstream data**; remains in the enum (the UI renders it), documented as never produced by the gateway | |
| `ReconciliationEntry` / `ReconciliationCounts` fields derived from metaClass (`double_booking`, `customer_cancellation` issues; `cancellationRefundsCents`, `doubleBookingRefundsCents`) | various | live-derived variants `null` / issue falls back to `needs_review`; **exception:** `MonthlyReport.refundedCancellationCents` / `.refundedDoubleBookingCents` keep their `number` type — they have real stored columns (`refunded_cancellation_amount`, `refunded_double_booking_amount`) | the stored monthly figures are authoritative; the live derivation is not |

Not corrected, because a real source or a legitimate derivation exists: all `Booking` fields
(18-column grant covers every one, including the VAT inputs); `Member.joinedAt` (verbatim
`"Eintritt"` free text — surfaced, never parsed); `Voucher.remainingCents` (derivable from the
binary `is_redeemed`, documented as binary); `Invoice` net/VAT (derived by the classification
module, provisional per D2 §4); `ActivityRecord.actorType` (derived from `actor_role`) and
`.summary` (composed from granted columns); `SettingsSnapshot` (built from ported constants, already
documented as illustrative configuration display, no database source claimed);
`MonthlyReport.vat` / `.membership` / `.courts` (recomputed from granted booking columns — §8.3
consistency note applies).

`payments.metadata` **remains excluded**: not queried, not granted, not requested in any future
round without an owner decision, because a jsonb blob cannot be column-scoped and carries PII.

### 7.1a The refund-amount finding — `Payment.refundedCents` and its dependents

Found during implementation of the §7.1 correction, verified against upstream source, and accepted by
the owner as **required contract completion** rather than optional scope.

**The finding.** `Payment.refundedCents` has no authorised upstream source. The evidence is the
committed `payments` table definition itself
(`SVHeinersreuth/supabase/migrations/20260121112311_create_payments_table.sql`), whose complete
column list is `id, created_at, provider, status, amount_eur, currency, reference_type, reference_id,
stripe_session_id, stripe_payment_intent_id, customer_email, metadata`. **There is no refund-amount
column of any kind**, and `amount_eur` carries `CHECK (amount_eur > 0)` — it is the amount charged,
never an amount returned.

**What may not be used to reconstruct it**, per owner rule: `payments.amount_eur`; payment status;
`payments.metadata` (excluded, PII-bearing, un-column-scopable); the unproven `reference_id` →
booking join (§7.2, still unproven); or any other assumption. A partial refund is not derivable from
a binary status, and `0` is not a permitted substitute. `Payment.refundedCents` is therefore
`number | null`.

**`bookings.refund_amount` is a real granted source — for booking-scoped figures, not for a payment.**

D3a grants `bookings.refund_amount` and maps it to `ReconciliationEntry.refundAmountCents` and to
`RefundBreakdown`. That is an authorised column, and D3b-B **may** use it to populate, once the
required booking relationship and query scope are proven for the operation in question:

* a **joined** `ReconciliationEntry.refundAmountCents` — `listReconciliation` joins payments to
  bookings as part of its own definition, so the amount can come from the booking side rather than
  from the payment;
* a **window-scoped** refund total such as `RefundBreakdown.totalCents` in `getReport` /
  `getOverview`, summed over the bookings already selected for the reporting window.

What this does **not** do, and must not be read as doing:

* it does **not** make `Payment.refundedCents` sourceable. A payment-level refund amount would still
  need the unproven `payments.reference_id` → booking join, and `listPayments` selects no bookings
  at all. It stays `null`.
* it does **not** make the cancellation / double-booking split sourceable. That split needs the
  payment's `metaClass`, which lives in the excluded `metadata` jsonb regardless of any booking join.
* it does **not** make the nullable types wrong. A field is typed `| null` because it is unavailable
  in *some* response path, not in all of them: `RefundBreakdown.totalCents` reached through a
  booking window may be a number while the same field reached from unjoined payments is `null`, and
  the type must admit both. Narrowing it back would force the unjoined path to fabricate.
* **D3b-B must never substitute `payments.amount_eur`, `payments.status` or `payments.metadata` for a
  refund amount.** A charge is not a refund, a binary status is not a partial amount, and the jsonb
  blob is excluded.

Today the `Booking` domain type carries no refund field, so nothing in this repository can route the
column yet. Adding one is a model change with its own review, not part of this correction, and no
query is written here.

**Aggregates that mathematically depend on it, all now `number | null`:**

| Field | Why it may be unavailable |
|---|---|
| `PaymentTotals.refundedCents` | sums `Payment.refundedCents`; `listPayments` selects no bookings, so no granted refund column is in scope |
| `PaymentTotals.netCents` | `gross − refunded`; the subtrahend is unknown, and printing gross as if it were net would overstate what the club kept |
| `PaymentTotals.refundedCount` | see §7.1b — decided on evidence, not convenience |
| `RefundBreakdown.totalCents` | sums `Payment.refundedCents` on the payment-driven path. **May be populated from `bookings.refund_amount`** once the window scope is proven — see the note above |
| `ReconciliationEntry.refundAmountCents` | is `Payment.refundedCents` at the only site that builds it today. **May be populated from the joined booking** — see the note above |
| `ReconciliationCounts.refundedTotalCents` | sums `ReconciliationEntry.refundAmountCents`, so it follows whatever that field can supply |

**Deliberately NOT widened**, each with a stated reason:

* `MonthlyReport.refundedCents`, `.refundedCancellationCents`, `.refundedDoubleBookingCents` — stored
  upstream as `admin_monthly_reports.refunded_amount`, `.refunded_cancellation_amount` and
  `.refunded_double_booking_amount`, all three granted. They are an authoritative stored fact, not a
  live derivation, and stay `number`.
* `ReconciliationEntry.moneyToRecoverCents` — the branch that reads a refund amount
  (`active_booking_refunded`) is unreachable when the amount is unknown; the branches that remain
  (`paid_no_booking`, `amount_mismatch`) read `grossCents` and `booking.amountCents`, both sourced.
* `ReconciliationCounts.falseRefunds`, `.matched`, `.openReview` — counts of issue classes, not
  monetary aggregates. A row whose refund state is unknown is classified `needs_review` (below), so
  it is visibly counted as outstanding rather than silently counted as healthy. `falseRefunds = 0`
  alongside a populated `needs_review` reports "none identified", which is true.
* `PaymentTotals.grossCents`, `.pendingCents`, `.succeededCount`, `.pendingCount` — derived from
  `amount_eur` and `status`, both granted.

**Classification consequence.** `classifyReconciliation` cannot detect `active_booking_refunded`
without a refund amount. As with an absent `metaClass`, a row that would otherwise fall through to
`matched` is reported `needs_review` instead: `matched` asserts that nothing is wrong, and that
assertion cannot be made when a check that could have contradicted it was unable to run.

### 7.1c Incomplete-data guards precede every reference-type shortcut

Found by the `source-absent` scenario after the first correction had been reviewed and passed, which
is the clearest argument for that scenario existing.

`classifyReconciliation` short-circuits on `referenceType === 'voucher'`, because a voucher purchase
legitimately has no booking behind it. That shortcut returned `matched` **before** the incomplete-data
guard ran, so a voucher payment was declared reconciled with no refund amount and no classification —
the exact defect the guard was added to prevent, reached by a path that skipped it.

**The rule, now enforced at every clean verdict:** a guard on incomplete data precedes any
reference-type shortcut that can report health. Being a voucher purchase is not itself evidence that
nothing is wrong; a refunded voucher purchase is indistinguishable from an untouched one without a
refund amount, and `matched` would be asserting precisely that difference. **No payment may be marked
matched merely because its `referenceType` is `voucher`.**

**Voucher payments have no authorised refund-amount source at all.** `public.payments` carries no
refund column for any row, and the `"Gutschein"` grant (`is_redeemed`, `redeemed_at`, `sold`,
`sold_at`, …) describes redemption, not the reversal of a purchase. So under a live gateway,
**hosted voucher payments are expected to remain `needs_review`** until a truthful refund source
exists. That is deliberate fail-closed behaviour and not an application error, and it must be
described that way to staff rather than investigated as a bug. Nothing here claims the system has
complete voucher refund visibility — it has none.

**What the guard deliberately does not do.** It gates clean verdicts only. `paid_no_booking` and
`amount_mismatch` are decided entirely from sourced values — `grossCents`, the booking's absence,
`booking.amountCents` — and a blanket guard at the top of the function would demote them to
`needs_review`, discarding a critical finding, zeroing the recoverable money it identifies, and
dropping `openReview` to nought while dozens of rows awaited review. That trades one falsehood for a
worse one. Severities, `openReview` and every other branch are unchanged; `needs_review` keeps
`moneyToRecoverCents: 0`, meaning nothing recoverable was *identified*, not that nothing exists.

Measured over the `source-absent` dataset: `matched` falls from 4 to **0**, `openReview` stays at
**2**, and `moneyToRecoverCents` stays at **5.100 ct** — the orphaned payment and the amount mismatch
still found, still quantified. Over `populated`, where every input is present, classification is
byte-for-byte unchanged (30 matched).

### 7.1b `PaymentTotals.refundedCount` — the decision, and the evidence for it

**Decision: `number | null`.** The exact count cannot be derived reliably from an authorised granted
column, so per the owner rule it is not guessed at.

The candidate derivation was `count(payments WHERE status = 'refunded')` — `payments.status` *is*
granted. It was rejected on positive evidence of a gap, not on doubt:

| Evidence | Source | Finding |
|---|---|---|
| Every writer of `payments` in the committed function set | repository-wide search of `SVHeinersreuth/supabase/functions` | exactly two functions write the table: `create-stripe-checkout-session` (insert, plus a `stripe_session_id` update) and `stripe-webhook` (status updates) |
| Every writer of `status = 'refunded'` | same | **exactly one**: `stripe-webhook`, on the `charge.refunded` event, matched by `stripe_payment_intent_id` |
| PayPal refund handling | same | **none exists.** No function writes `payments` for PayPal at all; PayPal appears only in read/reporting functions (`admin-monthly-reports`, `admin-payout-summary`, `admin-bookings`) |
| Status domain | `20260121112311_create_payments_table.sql` | documented in a comment as `'pending', 'succeeded', 'failed', 'refunded'`; the column is plain `text` with **no CHECK constraint**, so the set is convention, not enforcement |

What this establishes, and what it does not:

* **For Stripe, the semantics do hold.** Stripe's `charge.refunded` fires for partial refunds as well
  as full ones, and the handler sets the status unconditionally on that event. So for a Stripe
  payment, `status = 'refunded'` genuinely means "at least one refund occurred" — the same predicate
  as `refundedCents > 0`.
* **For PayPal, they demonstrably do not.** `Payment.provider` includes `paypal`, and no code path
  sets `status = 'refunded'` for one. A refunded PayPal payment keeps whatever status it had, so a
  status-based count **systematically undercounts** by every PayPal refund in the window.

A count that is right for one provider and silently low for another is a wrong number, not a partial
one — and it would be wrong in the flattering direction, reporting fewer refunds than occurred. Since
the meaning is not proven across the providers the domain actually models, the field is `null`.

**What would change this.** Proof that PayPal refunds reach `payments.status` — a webhook or admin
path that sets it, or a hosted read-only verification showing refunded PayPal rows carrying the
status. Neither exists today. If one is later established, `refundedCount` can become a `number`
without touching `refundedCents`, which stays unavailable regardless: the count and the amount are
independent questions.

### 7.2 `Payment.customerName` — the one conditional

Owner decision: derive it from a proven, permitted booking relationship **only if the exact join key
exists and is granted**; otherwise `null`. Current facts: `payments.reference_id` is granted and
justifies `Payment.reference`; `bookings.customer_name`, `bookings.id` and `bookings.booking_id` are
granted. What is **not** established is which booking column `reference_id` actually equals for
`reference_type = 'booking'` rows. That is a factual question about upstream data, answerable in
D3b-I against the local fixture and — for the hosted truth — only by a later read-only verification.
Plan: implement `null` now; behind it, D3b-I measures the candidate join on fictional fixtures and
records the finding; enabling the join is a one-line change **only after** the key is proven against
hosted reality in a later, separately approved read-only check. Until then the payments ledger shows
the name as not available.

### 7.3 Validator and fixture consequences

`responseValidation.ts` gains `nullable*` readers for exactly the fields above — each one annotated
with the reason ("no upstream source; D3b contract correction, owner decision 4") so a future reader
cannot mistake nullability for sloppiness. The fixture adapter's fixtures set the corrected fields to
realistic **fictional** values in the `populated` scenario (fixtures may be rich — they are labelled
fiction) but the *types* now admit `null`. The UI sections render `null` through their existing
German formatting layer as a "not available" label — a **display** string, which is not the same
thing as fabricating a *data* value.

**The `source-absent` scenario.** A fifth fixture scenario, alongside `populated` / `empty` / `error`
/ `loading`, returns the shape a live gateway response actually has: every SOURCE-ABSENT field
`null`, nothing substituted. It is *derived* from the populated fixtures in
`fixtures/sourceAbsent.ts` — same rows, same cross-references, only the unavailable fields removed —
and it is swapped in at the adapter's data source, so every aggregate downstream (payment totals,
voucher totals, reconciliation counts, the report's refund block, the overview) computes from the
incomplete rows exactly as the gateway would. Hand-nulling each response would have proved only that
a test can write `null`; propagation is the property worth pinning.

`clubOperations.sourceAbsent.test.tsx` renders the real sections against it and asserts, from the
DOM, that: unavailable money renders `—` and never a standalone `0,00 €`; an unclassifiable payment
reads **"Nicht klassifiziert"** and never "Regulär"; an untracked voucher history reads
**"Einlösungen werden im Vereinssystem nicht erfasst."** and never "noch nicht eingelöst"; an
unknown refund share reads **"Anteil nicht verfügbar"** and never "0,0 %"; unlinkable member
figures read `—` with **"Buchungen nicht zuordenbar"**; stranded voucher value reads `—` rather
than `0`; every section renders without crashing and without falling into its error state. Where a
flattering substitute exists, its *absence* is asserted alongside the correct string.

Two limits, stated rather than papered over. A blanket "no `0,00 €` anywhere" scan is **not** used:
a VAT-exempt tennis category carries a genuine zero of tax, as does an unresolved-padel category and
an empty day in the trend — those are facts. The zero assertions therefore sit on the specific tiles
whose underlying field is known to be unavailable. And `monthly-reports` deliberately keeps real
numbers under this scenario, which the suite asserts: its refund columns are stored upstream and
remain available when the live derivation is not.

---

## 8. The twelve operations and their SQL (D3b-B)

Every query is a `postgres.js` tagged template — parameters interpolate as bind parameters, never as
text. Every projection is an explicit named-column list drawn from the D3a grant. **No `SELECT *`
anywhere; no DML anywhere; a static guard fails the build if either appears (§14.2).**

Aggregation happens in **TypeScript, after the read**, not in SQL — the fixture adapter's
aggregations are already tested against the UI's expectations, and a second SQL implementation could
drift.

| # | Operation | Tables | Notes |
|---|---|---|---|
| 1 | `getOverview` | `bookings`, `payments`, `admin_stripe_invoices`, `admin_alerts` | window-bounded by `period` |
| 2 | `listBookings` | `bookings` | |
| 3 | `listPayments` | `payments` | nullable fields per §7 |
| 4 | `listInvoices` | `admin_stripe_invoices` | net/VAT derived, provisional |
| 5 | `listReconciliation` | `payments`, `bookings`, `admin_stripe_invoices` | join on `booking_id` / `payment_id` |
| 6 | `getMonthlyReport` | `admin_monthly_reports`, `bookings` | §8.3 |
| 7 | `getReport` | `bookings` | range window |
| 8 | `listVouchers` | `public."Gutschein"` | quoted identifier, never lowercase `gutschein` |
| 9 | `listMembers` | `public."SV Heinersreuth Mitglieder"` | quoted identifier |
| 10 | `listActivity` | `admin_audit_log` | |
| 11 | `listAlerts` | `admin_alerts` | |
| 12 | `getSettings` | **none** | ported constants; no database round-trip |

### 8.1 Exact column projections

Each list is the full usable subset of the D3a grant; a column outside the grant fails `42501` and is
caught by D3b-I long before deployment.

* **`public.bookings`** (18): `id, booking_id, court_key, start_time, end_time, customer_name,
  status, provider, payment_status, amount_total, currency, lights, player_membership,
  tax_membership_override, refund_status, refund_amount, cancelled_at, created_at` —
  `player_membership`, `tax_membership_override`, `court_key`, `provider`, `refund_status` are the
  parity-critical VAT inputs of `clubOperationsTax.ts`. `booking_ref`, `court_id`, `start_ts`,
  `end_ts` are not granted and must not be referenced.
* **`public.payments`** (8): `id, created_at, provider, status, amount_eur, currency,
  reference_type, reference_id`
* **`public.admin_stripe_invoices`** (14): `id, invoice_number, created_at, due_date, sent_at,
  paid_at, voided_at, status, customer_name, booking_id, payment_id, amount_eur, currency, reason`
* **`public."Gutschein"`** (10): `id, code, value_eur, currency, is_redeemed, redeemed_at,
  created_at, sold, sold_at, buyer_name`
* **`public."SV Heinersreuth Mitglieder"`** (8): `id, first_name, last_name, membership_number,
  membership_type, status, created_at, "Eintritt"`
* **`public.admin_alerts`** (12): `id, created_at, type, severity, status, title, message,
  reference, court, amount, resolved_at, resolved_by`
* **`public.admin_audit_log`** (7): `id, created_at, action, actor_role, entity_type, entity_id,
  entity_label`
* **`public.admin_monthly_reports`** (16): `id, report_month, period_start, period_end,
  total_revenue, stripe_revenue, paypal_revenue, giftcard_revenue, refunded_amount,
  refunded_cancellation_amount, refunded_double_booking_amount, booking_count, successful_count,
  pending_count, cancelled_count, top_court`

### 8.2 Money

Every monetary column upstream is PostgreSQL `numeric`, arriving as a **decimal string**.
`decimalCents.toCents` is the only permitted conversion — `Math.round(parseFloat(v) * 100)` is wrong
on real inputs and is forbidden. `splitVatFromGross` derives the invoice net/VAT split so
`net + vat === gross` on every row. Already tested (78 tests).

### 8.3 `getMonthlyReport` consistency

`admin_monthly_reports` carries headline figures but not `MonthlyReport.vat` / `.membership` /
`.courts`; those are recomputed from `bookings` inside `period_start`…`period_end` via
`clubOperationsTax.ts`. A month whose bookings have changed upstream can produce a `vat` block that
does not tie to the stored `total_revenue`; surfaced as a consistency note, not silently
reconciled. `availableMonths` from `SELECT report_month … ORDER BY report_month DESC LIMIT n`.

---

## 9. Parameter validation

Two layers, both mandatory. **In A, before signing:** `operation` ∈ the closed 12; `query` a plain
object; unknown key → reject, never ignore; enums checked against the exported unions in `types.ts`;
`dateFrom`/`dateTo` strict `YYYY-MM-DD` with `from ≤ to`; `month` strict `YYYY-MM`; `search` a
length-capped string never interpreted as a pattern; `period`/`range` ∈ their unions. Failure →
`400` → `invalid_query`. **In B, after signature verification:** the same rules again via
`Cqgw1VerifyInput.validatePayload` (step 11, `cqgw1.ts:330`). B never trusts A's validation.

Because the two components live in different repositories, the validation rules are kept identical
the same way the contract modules are (§2.2): transcription plus pinned hashes plus a shared
conformance-vector file of accept/reject cases run by both suites.

---

## 10. Connection lifecycle and timeouts (D3b-B)

Per D2 decisions 6–9 and `D3_ACCEPTANCE_CONSTRAINTS`:

```ts
const sql = postgres({
  host, port: 6543, database, user, password,
  prepare: false,      // transaction mode multiplexes; prepared statements do not survive
  max: 1,              // per-request client, one connection
  idle_timeout: 2,
  connect_timeout: 5,
  ssl: 'require',
  onnotice: () => {},
});
try {
  return await runOperation(sql, operation, query);
} finally {
  await sql.end({ timeout: 5 });   // unconditional
}
```

* **Per-request client, closed in a `finally`.** The module-scoped client stalled 13–16 of 20
  concurrent invocations in D2c; the per-request client did not. Not to be revisited without a load
  test at ≥ the same concurrency.
* **`prepare: false`** — mandatory in transaction mode.
* **`statement_timeout = '2s'` is server-enforced** via `ALTER ROLE`. B must **not** issue
  `SET statement_timeout` — a client that can raise it defeats the containment.
* **Containment** comes from the bounded Supavisor server pool (4) and the timeout, not from
  `CONNECTION LIMIT 24`, which sits above peak concurrency knowingly (D2c criterion 6).
* **One controlled retry** — connection-establishment failures only, never a timeout or a permission
  error, bounded delay, hard cap of one.

---

## 11. CORS and allowed origins

**A:** explicit allowlist from `CLUB_OPS_GATEWAY_ALLOWED_ORIGINS` (comma-separated). The request
`Origin` is echoed **only on exact match**; no match → CORS headers omitted entirely. `Vary: Origin`
set. Allowed headers `authorization, content-type`; methods `POST, OPTIONS`; credentials not enabled
(bearer, not cookie). Stricter than the existing `*` functions deliberately — A is the only door to
another organization's operational data.

**B: no CORS headers at all.** B is server-to-server; no browser may ever reach it, and advertising
a permitted origin would be a false statement about who may call it. B sets `verify_jwt = false` in
SVH's `config.toml` — CQGW1 is its authentication, and a Supabase JWT check would be a second,
weaker gate that is not the one doing the work.

CORS is a browser convention here, not an access control. The access control is §6.

---

## 12. Error taxonomy

Five public codes, fixed by `ClubOperationsAdapter.ts`, German staff-facing messages. Nothing else
reaches a component.

| Upstream reality | B returns | A returns | Adapter code |
|---|---|---|---|
| CQGW1 rejected (any of 11 reasons, replay included) | 400/401/413, **byte-identical body per status** | 502 | `unavailable` |
| Payload invalid | 400 | 400 | `invalid_query` |
| No Cogniiq session | — | 401 | `unauthorized` |
| No membership / no entitlement (any reason) | — | 403, one identical body | `forbidden` |
| Rate limited | — | 429 | `unavailable` |
| `57014` statement timeout | 504 | 502 | `unavailable` |
| `42501` permission denied | 500 | 502 | `unavailable` |
| `53300` too many connections | 503 | 502 | `unavailable` |
| Response fails any §5.2 check | — | — | `unknown` (or `unavailable` for steps 1–3) |

**Never crosses either boundary:** SQLSTATE codes, PostgreSQL messages, table or column names, host
names, key ids, connection strings, the CQGW1 rejection reason (`cqgw1RejectionReasons` is
internal-only; every 401 body is byte-identical), stack traces, any monetary or personal value.
**Logging:** reason codes and request ids only — `MalformedAmountError` and
`MalformedResponseError` already carry a reason or a path but never a value. Retention 90 days
(D2 §3). A `42501` maps to `unavailable`, never `forbidden` — surfacing an upstream privilege
failure as a permission problem would make the client an oracle for the A↔B relationship.

---

## 13. Files proposed per subphase

### 13.1 D3b-A — Cogniiq_Main

Created:

| Path | Purpose |
|---|---|
| `src/lib/gateway/entitlement.ts` | the fail-closed authorizer interface + `denyAllAuthorizer` (§6.2) |
| `src/lib/gateway/entitlement.test.ts` | deny-by-default proofs (§14.1) |
| `src/lib/gateway/operationValidation.ts` | per-operation parameter validation |
| `src/lib/gateway/operationValidation.test.ts` | |
| `src/lib/gateway/clubGatewayResponse.ts` | the §5.2 ten-step response validation pipeline |
| `src/lib/gateway/clubGatewayResponse.test.ts` | |
| `src/lib/gateway/clubGatewayTransport.ts` | signs, sends (injectable fetch), runs the response pipeline; implements `ClubOperationsTransport` |
| `src/lib/gateway/clubGatewayTransport.test.ts` | |
| `src/lib/gateway/clubGatewayShell.ts` | the testable request handler the Edge shell delegates to (steps 1–10 of §6.1) |
| `src/lib/gateway/clubGatewayShell.test.ts` | |
| `src/lib/gateway/contractHashes.test.ts` | pins SHA-256 of `cqgw1.ts`, `encoding.ts`, `canonicalJson.ts`, `operationValidation.ts`; anchors the cross-repo parity discipline |
| `src/lib/gateway/conformanceVectors.json` + `conformanceVectors.test.ts` | shared accept/reject vectors, run by both repositories |
| `supabase/functions/club-operations-read/index.ts` | thin shell |
| `supabase/functions/club-operations-read/README.md` | not-deployed notice, env names (§15), the §5 transport-not-authenticity statement, deploy steps not executed |

Modified (the contract correction, §7 — lands first):

| Path | Change |
|---|---|
| `src/solutions/club-operations/types.ts` | nullable types per §7.1 |
| `src/solutions/club-operations/adapter/responseValidation.ts` | matching `nullable*` readers, each annotated |
| `src/solutions/club-operations/fixtures/*` (payments, members, vouchers, reconciliation) | fictional values under the corrected types; one all-`null` scenario |
| affected section components + their tests | render `null` as the existing "not available" German label |
| `src/lib/gateway/{cqgw1,encoding,canonicalJson,clubOperationsTax,decimalCents}.ts` | import specifiers only (`'./encoding'` → `'./encoding.ts'`), if the `.ts`-specifier packaging option is confirmed; behaviour-neutral, baseline must stay green |
| `tsconfig.app.json` | possibly `allowImportingTsExtensions` |

### 13.2 D3b-B — SVHeinersreuth

All created; nothing existing in SVH is modified except `supabase/config.toml` (one
`verify_jwt = false` entry):

| Path | Purpose |
|---|---|
| `supabase/functions/cogniiq-read-gateway/index.ts` | thin shell |
| `supabase/functions/cogniiq-read-gateway/README.md` | not-deployed notice, env names, replay-suppression honesty note (§4) |
| `supabase/functions/cogniiq-read-gateway/lib/cqgw1.ts`, `lib/encoding.ts`, `lib/canonicalJson.ts`, `lib/operationValidation.ts` | transcriptions with `.ts` specifiers; hashes pinned both sides |
| `supabase/functions/cogniiq-read-gateway/lib/replayGuard.ts` | worker-scoped request-id set (§4) |
| `supabase/functions/cogniiq-read-gateway/lib/queries.ts` | the twelve named-column SELECTs + typed row readers |
| `supabase/functions/cogniiq-read-gateway/lib/connection.ts` | §10 lifecycle |
| `supabase/functions/cogniiq-read-gateway/lib/envelope.ts` | the §5.1 response envelope |
| `supabase/functions/cogniiq-read-gateway/tests/*` (Deno tests) | §14.2 |
| `docs/cogniiq-gateway/d3b-b-gateway.md` | design record mirroring the relevant sections of this plan |

### 13.3 D3b-I — harness only

| Path | Purpose |
|---|---|
| `Cogniiq_Main/docs/club-operations/d3b-integration/README.md` | full procedure: scratch-project setup, baseline assembly order, both function copies, run matrix, teardown |
| `…/d3b-integration/sql/10_fictional_rows.sql` | fictional fixture rows for all eight tables — obviously fictional names, no real person, no real booking |
| `…/d3b-integration/scripts/drive.ts` | Deno driver exercising the full matrix (§14.3) against localhost only |
| `…/d3b-integration/RESULTS.md` | recorded outcomes, versions, hashes — written after the runs |

No file in this set is imported by application code, executed by the test suite, or run by any build
or deployment step; asserted the same way the D2 spike's isolation is.

---

## 14. Tests required, per repository

### 14.1 D3b-A (vitest, in `npm test`, green before any commit)

1. **Entitlement / authentication** — missing bearer → 401; invalid session → 401; valid session,
   `denyAllAuthorizer` → 403; authorizer throw → 403; authorizer rejection → 403; authorizer
   returning a malformed value → 403; every distinct denial produces a **byte-identical** 403; no
   env var, header or query parameter reaches the authorizer decision (static scan); the production
   shell wires `denyAllAuthorizer` (asserted by reading the shell's source, the same technique the
   inertness tests use on `registry.tsx`).
2. **Parameter validation** — accept/reject per operation; unknown key rejected; date grammar;
   `dateFrom > dateTo`; enum boundaries; oversized search; the shared conformance vectors.
3. **Signing** — reuse and extend `cqgw1.test.ts`: valid round trip; flipped byte; swapped body;
   operation-header swap; stale/future timestamp; unknown key id; padded base64url; wrong-length
   signature; each header missing. No timing test.
4. **Response pipeline (§5.2, every step)** — redirect refused; abort on timeout; each status
   mapping; wrong content type; body over the 4 MiB cap never fully read; malformed JSON; truncated
   JSON; wrong `requestId`; wrong `operation`; extra top-level envelope field; missing envelope
   field; `result` failing each validator class (float cents, unknown enum, missing field); the
   corrected nullable fields accepted as `null` and rejected as absent-key where the shape requires
   the key.
5. **Transport adapter integration** — `createTransportAdapter` over the real transport (fake fetch)
   produces exactly the five public codes and no other; a trust failure surfaces as `unavailable`,
   never `forbidden`.
6. **Contract correction** — fixtures round-trip through the corrected validators; the all-`null`
   scenario renders; no fixture or source file contains a fabricated stand-in string for a
   source-absent field (scan for the forbidden pattern of non-null defaults on the §7.1 fields).
7. **Contract hashes + inertness** — pinned hashes match; the entire existing baseline (346 tests),
   boundaries and inertness suites stay green, including `registry.tsx` still resolving
   `club_operations: unavailableImplementation` and `App.tsx` still matching nothing.

### 14.2 D3b-B (Deno tests, in the SVH repository)

1. **CQGW1 verification** — the same negative matrix as 14.1.3, plus: repeated request id inside the
   window rejected; the same id after the window behaves per contract; rejection bodies
   byte-identical per status.
2. **Static SQL / write guards** — every query string is `SELECT`-only; every table on the
   allowlist; every column in the D3a grant (the grant transcribed into the test as authority); no
   `SELECT *`; no string-concatenated SQL; no `SET statement_timeout`; the vestigial lowercase
   `gutschein` never referenced; scan includes `INSERT|UPDATE|DELETE|TRUNCATE|ALTER|GRANT|COPY|CALL|DO`.
3. **Envelope** — exactly three fields; `requestId` echo; `operation` echo; error bodies opaque.
4. **Row readers** — every upstream row shape maps or fails typed; `numeric` strings through the
   transcribed cents conversion; `null` propagation for the §7.1 fields.
5. **Conformance vectors** — the shared file passes identically to 14.1.2/14.1.3.
6. **Hash parity** — post-rewrite hashes of the transcribed modules match the values pinned in
   Cogniiq_Main.

### 14.3 D3b-I (manual procedure against the disposable stack; results recorded, not CI-gated)

1. Complete request path: all twelve operations, browser-shaped call → A → B → database → validated
   domain object; entitlement temporarily satisfied by a **test-only authorizer injected by the
   harness** — the production shell's `denyAllAuthorizer` wiring is itself proven by first observing
   the unmodified shell deny.
2. Denied authorization: unmodified A denies every caller (403, byte-identical).
3. Invalid signatures, replay rejection, invalid parameters — the negative matrix over the real wire.
4. Read success on fictional fixtures; `Payment.customerName` join-key measurement recorded (§7.2).
5. Mutation impossibility: `INSERT`/`UPDATE`/`DELETE`/`TRUNCATE` fail; non-granted column fails
   `42501`; the six `SECURITY DEFINER` functions not callable; `EXECUTE` on an arbitrary function
   denied.
6. Timeout handling: `pg_sleep(10)` cancelled ~2 s with `57014`, surfaced as `unavailable`.
7. Connection cleanup: `pg_stat_activity` rows for the role counted before/after; a forced throw
   still closes the client (the `finally` is exercised, not inspected).
8. Concurrency: ≥100 sequential and ≥20 concurrent invocations, 0 failures, server connections
   bounded at pool size 4.
9. Edge-runtime compatibility: both functions load and serve in the locally served Edge runtime;
   Ed25519 passes inside it (re-running the D2d check against the transcribed modules).
10. Everything contacts localhost / container-internal addresses only.

---

## 15. Environment variables (names only — no values, ever)

**A:** `CLUB_OPS_GATEWAY_URL`, `CLUB_OPS_GATEWAY_KEY_ID`, `CLUB_OPS_GATEWAY_SIGNING_KEY` (Ed25519
private, PKCS#8, base64url), `CLUB_OPS_GATEWAY_ALLOWED_ORIGINS`. Runtime-provided `SUPABASE_URL` and
publishable key read through `_shared/env.ts`. **No service-role key** — every check runs under the
caller's identity. **No response-key variable exists** (owner decision 1).

**B:** `COGNIIQ_GATEWAY_PUBLIC_KEYS` (JSON map key-id → base64url raw 32-byte public key, so a key
is rotated or **revoked unilaterally without a Cogniiq deploy**), `CLUB_DB_HOST`, `CLUB_DB_PORT`
(6543), `CLUB_DB_NAME`, `CLUB_DB_USER` (`cogniiq_readonly`), `CLUB_DB_PASSWORD` (out-of-band; the
committed role is `PASSWORD NULL` and cannot authenticate; revocation is `ALTER ROLE … PASSWORD
NULL`).

No value for any name above may appear in either repository, in a test, fixture, log, commit message
or this document. No `.env` file was read during this audit.

---

## 16. How every query stays read-only — five independent layers

| # | Layer | Enforced by | Runs where |
|---|---|---|---|
| 1 | No write privilege | D3a column-scoped `SELECT` grants only | database |
| 2 | RLS admits no write | `FOR SELECT` policies only, `NOBYPASSRLS` | database |
| 3 | No callable writer | D3a §5 removes `PUBLIC EXECUTE` from the six `SECURITY DEFINER` functions, four of which write as `postgres` | database |
| 4 | Static SQL guard | §14.2.2, in the SVH suite where the queries live | build |
| 5 | Contract guard | the adapter declares no mutating method; `clubOperations.boundaries.test.ts` fails on `create*`/`update*`/`delete*`/`save*` | build |

Layers 1–3 hold at runtime; 4–5 are design-time controls over committed text and prove nothing about
a deployed database. `auditGatewayRoleSql` returns 0 findings for the D3a migration and 3 for the
known-bad `02_misgrant.sql` fixture. Because the migration lives in SVH, D3b-B adds the equivalent
scan to the SVH suite so the file is policed where it lives (this resolves revision 1's A5).

**Accepted residual risk, restated:** a future migration that *simultaneously* grants DML and
creates a permissive write policy enables writes, with no backstop beneath those two conditions.
Demonstrated in D2c, not theorised.

---

## 17. Disposable local test architecture (D3b-I)

Identical in shape to the D2 spike, which is the point — proven to work and to leave nothing behind.

```
scratch directory OUTSIDE both repositories
  └── supabase/            (npx supabase init --force)
      ├── config.toml      [db.pooler] enabled, port 6543, transaction mode
      ├── functions/
      │   ├── cogniiq-read-gateway/     copied from the SVH D3b-B checkout
      │   └── club-operations-read/     copied from the Cogniiq_Main D3b-A checkout
      └── local baseline, applied in order:
          1. SVH 00_local_roles.local-fixture.sql
          2. the eleven self-contained committed SVH migrations (#2,5,6,7,8,10,11,12,13,14,18)
          3. SVH 01_missing_tables.local-fixture.sql
          4. SVH 02_security_definer_functions.local-fixture.sql   (PUBLIC EXECUTE intact)
          5. the D3a migration itself
          6. docs/club-operations/d3b-integration/sql/10_fictional_rows.sql
```

Toolchain matching D2's measured versions: Docker 29.7.2, Supabase CLI 2.114.0 via `npx.cmd`
(PowerShell blocks `npx.ps1`), Deno 2.9.5, Edge runtime 1.74.3, PostgreSQL 17.6, Supavisor
transaction mode on 6543. Step 4 is load-bearing — it reproduces the `PUBLIC EXECUTE` hole so §5 of
the migration can be shown to close it; a proof that cannot fail proves nothing.

The SVH fixture files are read as inputs, never modified, never moved, never copied into
`supabase/migrations/` in either repository. Known hosted-vs-history divergences the harness must
expect: `"Gutschein".value_eur` is `numeric(12,2)`, the check constraint is `>= 0`, `sold` exists,
and lowercase `public.gutschein` is a separate vestigial table that must never be queried. The
`cogniiq_readonly` password is a throwaway supplied at apply time and stored nowhere; teardown is
`supabase stop --no-backup`. **No command logs in, links a project, pushes a migration or deploys a
function.**

---

## 18. Blast radius and protected files

**Blast radius of the full three-subphase plan: zero reachable surface changes.** Every new
Cogniiq_Main file is either unreferenced by the route tree or a test; every new SVH file is an
undeployed function plus its tests; `club_operations` stays inert throughout.

Protected — must not be modified, asserted by existing tests where they exist:

| Path | Guard |
|---|---|
| `src/App.tsx` | boundaries test — must not match `/club-operations/i` or `ClubOperationsModule` |
| `src/lib/solutions/registry.tsx` | must still contain `club_operations: unavailableImplementation` |
| the solution catalog | `club_operations` stays inactive |
| `src/solutions/club-operations/**` | no URL, `fetch`, `createClient`, `import.meta.env`, `SERVICE_ROLE`, JWT literal, role variable, or Supabase client at any import depth — the §7 type/validator/fixture changes stay inside these existing rules |
| every existing public / customer / owner / admin page and Edge Function | untouched; no existing function's CORS, auth or error handling changes |
| `Cogniiq_Main/supabase/migrations/**` | **no new migration in any subphase of this plan** (owner decision 3); `investigationQueries.test.ts` asserts the only `club_operations` migration remains `20260811120000_club_operations_catalog_entry.sql` |
| `SVHeinersreuth/supabase/migrations/**` | D3b-B adds **no migration**; the D3a migration is not edited |
| SVH application code, booking flow, deployed functions | untouched by D3b-B; only the new function directory, its docs, and one `config.toml` entry |

The riskiest single change remains the import-specifier rewrite in `src/lib/gateway/*.ts`
(behaviour-neutral by construction; the 346-test baseline must stay green byte-for-byte), followed
by the §7 contract correction, which is deliberately front-loaded and reviewed on its own.

---

## 19. Remaining ambiguities and open items

Revision 1's A1–A4 are resolved by the owner decisions. Still open:

| # | Item | Severity | Needs |
|---|---|---|---|
| **B1** | **The real entitlement implementation** — which tables/roles answer "entitled", whether per-operation granularity is real, whether a migration is needed. Deliberately out of D3b's scope; D3b ships deny-all. | high (blocks activation, not D3b) | separate design + review |
| **B2** | **`Payment.customerName` join key** — which booking column `payments.reference_id` equals. Measured on fixtures in D3b-I; proven only by a later approved read-only check against hosted data. Until then: `null`. | medium | later hosted read-only verification |
| **B3** | **`getMonthlyReport` consistency** between stored headline figures and recomputed slices (§8.3). | medium | product decision on surfacing |
| **B4** | **Rate-limit thresholds** — D2 retained "the durable atomic rate limiter in Cogniiq Postgres" without values. D3b-A implements the mechanism with conservative placeholder limits held in one constant, flagged for owner confirmation before any deployment. | medium | owner decision before deploy |
| **B5** | **Replay suppression is worker-scoped, not durable** (§4) — a design consequence of the read-only guarantee, stated honestly. Strengthening it is a contract change. | low (accepted posture) | none, unless owner reopens |
| **B6** | **Deno is not in either repo's toolchain yet.** D3b-B introduces `deno test` in SVH; D3b-I remains a manual recorded procedure, not a CI gate. | medium | accepted |
| **B7** | **D2c criterion 3 remains FAILED** — six of seven, permanently on the record. | — | none |
| **B8** | **`CONNECTION LIMIT 24` vs pool 4** — accepted, owner-visible containment trade-off; restated so it is not rediscovered. | low | none |

---

## 20. What is provable where

**Provable locally (D3b-A + D3b-B + D3b-I), with no hosted access:** the full CQGW1 request
protocol including every rejection and the replay window; deny-by-default entitlement; the entire
§5.2 response-validation pipeline; all twelve operations end-to-end against a disposable database
producing objects that satisfy the corrected validators; that `cogniiq_readonly` cannot write,
cannot read a non-granted column, cannot call the six functions, and is cancelled at 2 s; bounded
connections and unconditional cleanup under ≥20 concurrent invocations; that no query is anything
but a `SELECT` on named granted columns; that `club_operations` remains inert and no protected
surface changed; cross-repo contract parity via pinned hashes and shared vectors.

**Not provable without hosted access — and therefore not claimed:** that the hosted schema matches
the fixture transcription; that the hosted `cogniiq_readonly` role exists (**it does not** — D3a is
committed but unapplied); hosted function ACLs; the §7.2 join key against real data; real latency,
concurrency, Supavisor behaviour or cold starts; that any out-of-band credential works; response
authenticity beyond TLS (§5, by design, permanently for this release).

**Prohibited after all three subphases are implemented, and not lifted by them:** deploying either
Edge Function anywhere; applying D3a to the hosted database (still blocked pending its own
deployment plan — ACL pre-verification, transaction-scoped apply, post-apply `EXECUTE` checks,
booking-flow smoke tests, rehearsed rollback, monitored change window); activating
`club_operations`, routing it, or registering it in `registry.tsx`; replacing `denyAllAuthorizer`
with anything not separately reviewed; granting the gateway role any write privilege — **ever**;
adding any write operation to the adapter; labelling any output a tax report, VAT return input or
authoritative accounting output before the D1 §9.3 sign-off exists in writing; describing
`default_transaction_read_only` as a write barrier; claiming constant-time verification; claiming
cryptographic response authenticity.

---

## 21. Verdicts

| Scope | Verdict |
|---|---|
| **D3b-A local implementation** (Cogniiq_Main, contract correction first, deny-all entitlement) | **GO** |
| **D3b-B local implementation** (SVHeinersreuth, own branch, own review) | **GO**, sequenced after the step-0 contract correction is merged |
| **D3b-I local proof** (disposable stack, fictional fixtures, localhost only) | **GO**, strictly after D3b-A and D3b-B |
| Deployment of Component A (`club-operations-read`) | **NO-GO** — deny-all is not a deployable posture, rate limits unconfirmed (B4), entitlement unbuilt (B1) |
| Deployment of Component B (`cogniiq-read-gateway`) | **NO-GO** — role unprovisioned, D3a unapplied, hosted verification absent |
| Applying D3a to the hosted database | **NO-GO** — blocked on its own deployment plan |
| Activating `club_operations` | **NO-GO** — requires the reviewed entitlement implementation (B1) and every deployment precondition above |

All four revision-1 blockers are resolved by owner decision. Nothing blocks the *start* of D3b-A;
the sequencing constraint is internal (contract correction first), and the SVH branch for D3b-B is
created only when that subphase begins.
