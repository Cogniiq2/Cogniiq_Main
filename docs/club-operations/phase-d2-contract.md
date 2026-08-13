# Phase D2 — corrected gateway contract

Supersedes the corresponding parts of the D1 design and its architecture correction addendum. Where
this document and either of those disagree, this one is current.

Nothing described here is deployed. No migration exists, no Edge Function exists, no hosted project
has been contacted, and `club_operations` still resolves to the unavailable fallback.

---

## 1. CQGW1 — corrected signing contract

### 1.1 Signed header set

Six headers, all mandatory:

| Header | Contents |
|---|---|
| `X-CQ-Version` | exactly `CQGW1` |
| `X-CQ-Key-Id` | key label, `[A-Za-z0-9_.-]{1,64}` |
| `X-CQ-Timestamp` | Unix seconds, decimal |
| `X-CQ-Request-Id` | `[A-Za-z0-9_-]{8,64}` |
| `X-CQ-Operation` | one member of the closed 12-operation union |
| `X-CQ-Signature` | Ed25519 signature, base64url **unpadded** |

`X-CQ-Operation` is new. The canonical string commits to the operation, so the verifier must know it
before it can rebuild that string — and it cannot learn it from the body, because the body must not
be parsed until the signature has verified. Without the header the protocol was unimplementable as
specified.

### 1.2 Canonical string

```
CQGW1\n
<byteLen>:<http_method>\n
<byteLen>:<canonical_path>\n
<byteLen>:<key_id>\n
<byteLen>:<timestamp_unix_seconds>\n
<byteLen>:<request_id>\n
<byteLen>:<operation>\n
<byteLen>:<body_sha256_lowercase_hex>
```

Every prefix is a **UTF-8 byte** count, computed from the value. The D1 example gave the canonical
path a length of 25; the real UTF-8 length of `/functions/v1/cogniiq-read-gateway` is **34**. The
implementation derives every prefix at build time and the test asserts the derived value, so no
unchecked example length exists anywhere in the code.

### 1.3 Verification order

1. reject an unknown version
2. require all six headers, `X-CQ-Operation` included
3. reject an operation outside the closed union
4. enforce the ±60 s window against the verifier's own clock
5. read at most 64 KiB of raw request bytes
6. SHA-256 those exact bytes
7. build the canonical string from the **header** operation and the **computed** hash
8. verify the Ed25519 signature via `crypto.subtle`
9. only now, parse the JSON body
10. require `body.operation === X-CQ-Operation` when the body carries one
11. validate the operation-specific payload
12. only then may a database or adapter method be called

### 1.4 Removed: the impossible hash comparison

The D1 addendum instructed the verifier to "compare the computed hash with the signed hash before
signature verification". There is no separately transmitted body-hash header, so there is nothing to
compare against. The instruction is removed.

Integrity is established differently and no more weakly: the canonical string is built with the
locally computed hash, and the signature is verified over that string. A tampered body produces a
different hash, hence a different canonical string, hence a failed verification. The tests cover a
whole-body swap and a single flipped byte.

### 1.5 Cryptography

`crypto.subtle` with the platform `Ed25519` primitive. No custom implementation exists in this
repository and none may be written.

**No constant-time claim is made anywhere.** Constant-time execution is a property of the platform's
implementation. A wall-clock measurement in a JIT-compiled, garbage-collected runtime cannot
establish it, so no timing test appears in the suite and no such claim appears in the code.

### 1.6 Encoding

Signatures are base64url, unpadded. Padded input is **rejected** rather than tolerated: one value
must have exactly one spelling, or two distinct header strings would verify identically.

---

## 2. Removed: the upstream-side rate counter

The D1 addendum gave the upstream gateway its own durable request counter, keyed on `key_id`, stored
in the upstream database. That is incompatible with the read-only database role that is the whole
point of the design: a strictly read-only role cannot increment a counter, and giving it write
permission — or introducing a second, privileged credential to do the writing — would trade away the
guarantee in order to obtain a limiter. **The read-only guarantee wins.**

Retained for the first read-only release:

- the durable atomic rate limiter in Cogniiq Postgres (per organization, per user, per operation);
- the dedicated upstream role's `CONNECTION LIMIT`;
- the server-side `statement_timeout`;
- the 64 KiB request-size cap;
- one controlled retry, never a retry storm.

Removed: any upstream database counter, any write grant to the read-only role, any second privileged
upstream credential introduced for rate limiting.

### Residual risk, stated plainly

If the Cogniiq signer is compromised, the upstream gateway has **connection and timeout containment
but no independent durable request counter**. An attacker holding a valid signing key could issue
requests at whatever rate the pooler's connection limit and the statement timeout permit, and the
upstream side would not count them.

What bounds the damage: every operation is a pure read; the role holds `SELECT` only; the connection
limit starves the gateway before it starves the live booking site; each statement is cancelled by the
server at the timeout. What is genuinely lost: the ability to detect and throttle such a compromise
from the upstream side alone. Revocation remains immediate and unilateral — disabling the public key
upstream invalidates every Cogniiq request without a Cogniiq deploy.

This becomes reviewable again before any write operation ships.

---

## 3. Owner defaults recorded for this phase

Recorded, **not implemented**. No code in D2 acts on any of these.

| Decision | Default |
|---|---|
| Break-glass / platform-admin access | **none**. No bypass of any kind exists or is built. |
| Access-log retention | 90 days |
| Support-grant record retention (if ever built) | 2 years |
| Voucher expiry, partial redemption, usage history | displayed as **"not tracked upstream"** — no value is invented |
| Member-to-booking association | **none** until a real stable key exists |
| Fuzzy matching on the membership free-text field | **never** |

---

## 4. Provisional status of every figure

Everything the classification module produces is **provisional**. The rules are transcribed from the
committed upstream implementation; whether they are the correct tax positions is a question for the
club's tax adviser.

No output of this work may be labelled a tax report, a VAT return input, or authoritative accounting
output. That restriction lifts only when the D1 §9.3 sign-off exists in writing.

---

## 5. Spike results — measured, no longer blocked

Both spikes have now been run against a disposable local Supabase stack (Docker 29.7.2, Supabase CLI
2.114.0, Deno 2.9.5, edge runtime 1.74.3, PostgreSQL 17.6, Supavisor transaction mode on port 6543).
Full method, commands and raw results: [`d2-spike/README.md`](./d2-spike/README.md).

No hosted project was contacted. No `login`, `link`, `db push` or `functions deploy` was run.

### 5.1 D2d — Ed25519: **PASSED in both runtimes**

Key generation, signing, verification, 64-byte signatures, 32-byte raw public key export and
re-import, and the full CQGW1 canonical-string and exact-body verification behaviour all pass in the
host Deno 2.9.5 **and** inside the actual locally served Supabase Edge runtime — 0 failures in each,
running the repository's own `cqgw1.ts` and `encoding.ts`.

**The HMAC fallback is not needed and is not selected.** The Ed25519 blast-radius argument stands.

One packaging finding: the Edge runtime cannot load the module as committed, because the repository
uses bundler-style extensionless imports (`from './encoding'`). D3 needs a bundling step, an import
map, or `.ts`-suffixed specifiers. Behaviour was identical in both runtimes once resolved.

No constant-time claim is made. That remains a platform property and no timing test was run.

### 5.2 D2c — six of seven criteria pass; criterion 3 fails

| # | Criterion | Result |
|---|---|---|
| 1 | Edge Function reads through Supavisor transaction mode as a dedicated LOGIN role | **PASS** |
| 2 | `INSERT`/`UPDATE`/`DELETE`/`TRUNCATE` all fail | **PASS** (`25006`) |
| 3 | Writes still fail after a deliberate DML mis-grant; no read-only escape works | **FAIL** |
| 4 | `EXECUTE` on an arbitrary function denied | **PASS** (`42501`) |
| 5 | Server-enforced `statement_timeout` cancels a long query | **PASS** (`57014`, ~2.07 s) |
| 6 | ≥100 sequential and ≥20 concurrent invocations; connections bounded | **PASS**, with a condition |
| 7 | Cold-start p95 < 500 ms | **PASS** — p50 252 ms, p95 293 ms |

### 5.3 The falsified claim: `default_transaction_read_only` is not a boundary

The D1 design called `ALTER ROLE … SET default_transaction_read_only = on` "belt and braces" — the
net that would still stop a write if a grant were mis-applied later. **Measurement shows it does
not.** It is a default a client may override. With a mis-applied DML grant and a permissive RLS
write policy, three escape paths wrote real rows:

* `SET SESSION CHARACTERISTICS AS TRANSACTION READ WRITE`
* `BEGIN; SET TRANSACTION READ WRITE; INSERT; COMMIT`
* a fresh read-write transaction on a new connection

The barriers that actually hold are the **absence of DML grants** and **RLS with no permissive write
policy**. `default_transaction_read_only` catches careless writes only, and must be described that
way rather than as a second line of defence.

This does not sink Option 2. Under the intended configuration — no DML grant, `FOR SELECT` policies
only — every write path was refused, and the read-only property is genuinely database-enforced by
privileges and RLS. What changes is the *reason* it holds, and therefore what a future migration
must never do: a single mis-applied `GRANT INSERT` plus a permissive policy is sufficient to allow
writes, with no backstop underneath it.

### 5.4 The connection-limit trade-off

At the D1-specified `CONNECTION LIMIT 4`, 20 concurrent invocations failed with `too many connections
for role`. Raising the limit above peak concurrency made criterion 6 pass cleanly while Supavisor
still bounded server connections to 4.

So the D1 containment argument — "the cap exists precisely so the gateway starves before the booking
site does" — holds only at values too low to serve ordinary load. The limit must sit above expected
peak concurrency, which weakens containment by exactly that margin. **This is an owner-visible
trade-off and a D3 decision, not a value to pick silently.**

### 5.5 Status

Option 2 is **proven as a mechanism** on a disposable local stack. The Option 1 fallback
(service-role client with code-enforced projection) is **not** selected and was never triggered — the
trigger was criteria 1, 5 or 6 failing, and all three passed.

---

## 6. Accepted architecture decisions

Accepted by the owner at the close of D2. These are binding on D3.

| # | Decision |
|---|---|
| 1 | Proceed with **Option 2** — a dedicated PostgreSQL LOGIN role through Supavisor transaction mode. |
| 2 | The accurate security claim is: **"Read-only access is enforced by restricted PostgreSQL grants plus RLS."** No other phrasing may be used. |
| 3 | `default_transaction_read_only = on` stays as additional protection, documented **only as an overridable default — never as an irreversible write barrier**. |
| 4 | No migration or application change may **ever** grant the gateway role `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, sequence mutation or arbitrary function execution. |
| 5 | Automated privilege guards must fail the build if a prohibited grant or a permissive write policy becomes available to the gateway role. |
| 6 | Gateway role `CONNECTION LIMIT` = **24**. |
| 7 | Supavisor server pool bounded at **4**. |
| 8 | Server-enforced `statement_timeout = '2s'`. |
| 9 | Use the proven **per-request** `postgres.js` client. The module-scoped client that stalled under concurrency is not to be used. |
| 10 | **Ed25519 accepted.** The HMAC fallback is not implemented. |
| 11 | The failed deliberate-misgrant criterion stays on the record. D2c is six of seven, not seven of seven. |
| 12 | The residual risk in §6.2 is accepted for the purpose of proceeding to D3. |

### 6.1 D3 acceptance constraints

Held in code at `src/lib/gateway/gatewayRoleGuards.ts` as `D3_ACCEPTANCE_CONSTRAINTS`, with a test
asserting this document and that constant agree, so the two cannot drift.

| Constraint | Value |
|---|---|
| Gateway role | `CONNECTION LIMIT 24` |
| Supavisor pool size | pool size 4 |
| Statement timeout | `statement_timeout = '2s'`, server-enforced |
| Pooler port / mode | 6543, transaction mode |
| Prepared statements | disabled (`prepare: false`) — transaction mode does not support them |
| Client pattern | **per-request** `postgres.js` client |
| Signature algorithm | **Ed25519**, no HMAC fallback |
| Privileges | `SELECT` on named columns only; `USAGE` on the schema; nothing else |
| RLS | `FOR SELECT` policies only; no policy may permit a write to the gateway role |

**Edge-runtime import requirement.** The gateway function must either bundle its dependencies or use
explicit `.ts` specifiers. The repository's bundler-style extensionless imports (`from './encoding'`)
do not resolve in the Deno Edge runtime; this is a packaging step, not a rewrite.

### 6.2 Accepted residual risk

**If a future administrator simultaneously grants DML to the gateway role and creates a permissive
write RLS policy, the role can write.** This was demonstrated, not theorised: three client-side paths
wrote real rows once both conditions held, and `default_transaction_read_only` did not stop them.

Accepted mitigations, all design-time:

* least-privilege migrations — `SELECT` on named columns and nothing else;
* RLS carrying `FOR SELECT` policies only;
* the automated regression guards in `gatewayRoleGuards.test.ts`, which fail the build on a
  prohibited grant, a dangerous role attribute, or a permissive write policy — detected from SQL
  text, with no database contact;
* the D2c spike's own mis-grant fixture used as the guard's positive test case, so the guard is
  verified against the real failure rather than a sample chosen to make it pass.

The guards are a **design-time** control over committed SQL. They prove nothing about a deployed
database and do not replace review of the migration that eventually creates the role.

### 6.3 What is and is not proven

Proven: the mechanism works on a **disposable local stack**.

Not proven, and not claimed: nothing here says the production gateway is safe, deployed, connected or
provisioned. No gateway role, migration or Edge Function exists in either repository. `club_operations`
remains inactive and still resolves to the unavailable fallback.

---

## 7. Final D2 status

**D2 complete; GO for implementing D3 under the accepted constraints.**
