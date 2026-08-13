# D2c / D2d proof-of-mechanism spike

Reproducible local spike for the two D2 criteria that could not be evaluated when Phase D2 was first
run. Everything here targets a **disposable local Supabase stack**. Nothing in this directory is
imported by application code, executed by the test suite, or run by any build or deployment step.

**Not for hosted use.** No command below logs in, links a project, pushes a migration or deploys a
function. If a command in this file is ever pointed at a hosted project, that is a mistake.

> **Outcome.** These results were accepted by the owner at the close of D2. Option 2 proceeds under
> the constraints in [`../phase-d2-contract.md` §6](../phase-d2-contract.md). Criterion 3 **failed**
> and stays failed on the record — D2c is six of seven, and the security claim is now
> *"read-only access is enforced by restricted PostgreSQL grants plus RLS."*
> The accepted parameters are `CONNECTION LIMIT 24`, pool size 4, `statement_timeout = '2s'`, the
> per-request client pattern, and Ed25519 with no HMAC fallback.
>
> The privilege guard derived from criterion 3 lives in `src/lib/gateway/gatewayRoleGuards.ts` and is
> tested against `sql/02_misgrant.sql` — the fixture in this directory that produced the failure.

---

## Runtimes these results were measured on

| Component | Version |
|---|---|
| Docker | 29.7.2 (client and Linux server), Compose v5.3.1 |
| Supabase CLI | 2.114.0, invoked as `npx.cmd --yes supabase@latest` |
| Deno (host) | 2.9.5 |
| Supabase Edge runtime (container) | supabase-edge-runtime-1.74.3, compatible with Deno v2.1.4, V8 11.6.189.12 |
| PostgreSQL (container) | 17.6 |
| Supavisor | local `supabase_pooler_*` container, transaction mode, port 6543 |

On Windows, PowerShell blocks `npx.ps1`; use `npx.cmd`. The Docker CLI may not be on an already-open
shell's `PATH` after installation — invoke it by absolute path or restart the shell.

---

## Setting up the disposable stack

Run from a scratch directory **outside** both repositories.

```bash
npx.cmd --yes supabase@latest init --force
```

Then, in `supabase/config.toml`, enable Supavisor on the real transaction-mode port:

```toml
[db.pooler]
enabled = true
port = 6543
pool_mode = "transaction"
default_pool_size = 15
max_client_conn = 60
```

```bash
npx.cmd --yes supabase@latest start
```

Copy `functions/` from this directory into the scratch project's `supabase/functions/`, then apply
the fixture. The role password is a throwaway supplied at apply time and is deliberately not stored
in this repository:

```bash
docker exec -i supabase_db_<project> psql -U postgres -d postgres -v ON_ERROR_STOP=1 -v spike_password=<throwaway> -f - < sql/01_fixture.sql
```

`d2d-ed25519/index.ts` imports `./vendor/cqgw1.ts` and `./vendor/encoding.ts`. Produce them by
copying the two repository modules into the function's `vendor/` directory and rewriting one import
specifier — see "Edge runtime module resolution" below.

```bash
npx.cmd --yes supabase@latest functions serve --no-verify-jwt
```

---

## D2c — the seven criteria

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | Edge Function reads through Supavisor transaction mode on 6543 as a dedicated LOGIN role | **PASS** | `current_user = cq_readonly_spike`, 500 synthetic rows readable, `default_transaction_read_only = on`, `statement_timeout = 2s` |
| 2 | `INSERT` / `UPDATE` / `DELETE` / `TRUNCATE` all fail | **PASS** | all four rejected, SQLSTATE `25006` |
| 3 | Writes still fail after a deliberate DML mis-grant, and every read-only escape is refused | **FAIL — see below** | 3 of 6 escape paths defeated `default_transaction_read_only` |
| 4 | `EXECUTE` on an arbitrary function denied | **PASS** | `42501` for the plain function, a writing function, `pg_read_file`, and `COPY … FROM PROGRAM` |
| 5 | Server-enforced `statement_timeout` cancels a long query | **PASS** | `pg_sleep(10)` cancelled at ~2.07 s, SQLSTATE `57014` (server-side cancel, not a client abort) |
| 6 | ≥100 sequential and ≥20 concurrent invocations complete reliably; pooler connections bounded | **PASS, with a configuration condition** | 100 sequential: 0 failures, p50 49 ms, p95 73 ms. 20 concurrent: 0 failures, 317 ms wall. 20 concurrent clients multiplexed onto **max 4 server connections** |
| 7 | Cold-start p95 below 500 ms | **PASS** | 30 samples under `policy = "oneshot"` (every request boots a fresh worker): **p50 252 ms, p95 293 ms**, min 238 ms, max 318 ms |

### Criterion 3 in detail — the finding that matters

The D1 design called `ALTER ROLE … SET default_transaction_read_only = on` "belt and braces": the
safety net that would still stop a write if a DML grant were mis-applied in a later migration.

**It does not.** `default_transaction_read_only` is a *default*, and a client may override it.

With the DML grant deliberately mis-applied and RLS still carrying only a `FOR SELECT` policy, no
write succeeded — but the reason changed, which is the whole point:

| Escape path | Outcome | Blocked by |
|---|---|---|
| `SET transaction_read_only = off` then `INSERT` | blocked | `25006` — read-only transaction |
| `SET SESSION CHARACTERISTICS AS TRANSACTION READ WRITE` then `INSERT` | blocked | `42501` — **RLS**, not read-only mode |
| `BEGIN; SET TRANSACTION READ WRITE; INSERT; COMMIT` | blocked | `42501` — **RLS** |
| fresh read-write transaction on a new connection | blocked | `42501` — **RLS** |
| `RESET ALL` then `INSERT` | blocked | `25006` |
| `ALTER ROLE self SET default_transaction_read_only = off` | blocked | `25006` |

Isolating the variable — keeping the mis-granted DML **and** adding a permissive RLS `INSERT` policy —
three of those paths wrote real rows:

```
*** WRITE SUCCEEDED *** SET SESSION CHARACTERISTICS AS TRANSACTION READ WRITE
*** WRITE SUCCEEDED *** BEGIN; SET TRANSACTION READ WRITE; INSERT; COMMIT
*** WRITE SUCCEEDED *** fresh read-write transaction on a new connection
```

Verified against the table: `bookings_now = 503`, three rows `ESC-SESSCHAR`, `ESC-TXRW`, `ESC-FRESH`.

**Conclusion.** The barriers that actually hold are the **absence of DML grants** and **RLS without a
permissive write policy**. `default_transaction_read_only` catches careless writes only; it is not a
security boundary and must not be described as one. Restoring the intended configuration (no DML
grant, `FOR SELECT` policy only) blocks all six paths again — three by `25006`, three by `42501`
permission denied.

### Criterion 6 in detail — the connection-limit condition

The first run used the D1-specified `CONNECTION LIMIT 4`. Under 20 concurrent invocations it failed
with `too many connections for role "cq_readonly_spike"` (5–15 of 20 requests). A control function
touching no database served the same 20 concurrent requests in 25 ms, so the limiter was the database
path, not the local Edge runtime.

Raising the role's `CONNECTION LIMIT` above peak concurrency made it pass cleanly, while Supavisor
still bounded **server** connections to 4. So multiplexing works — but the role's connection limit is
counted against *client* connection attempts during establishment, not against the multiplexed server
connections. A limit equal to the pool size leaves no headroom and fails under burst.

**Design consequence for D3.** The D1 argument that `CONNECTION LIMIT 4` makes the gateway "starve
before the booking site does" is sound as containment, but 4 is below any realistic concurrency and
would make the gateway fail under ordinary load. The limit must be chosen above expected peak
concurrency with headroom, which weakens the containment argument by exactly that much.

**Decided:** `CONNECTION LIMIT 24`, with the Supavisor server pool held at 4. Containment therefore
comes from the bounded server pool and the 2-second statement timeout rather than from the role's
connection limit, and the reduction in containment is accepted knowingly.

A second finding: a module-scoped `postgres.js` client with a small `max` **stalled** under 20
concurrent invocations (13–16 of 20 hit the Edge runtime's 150 s request timeout) even with the
raised limits, while a per-request client succeeded. The intuitive "share one client per worker"
optimisation was the worse of the two here.

**Decided:** D3 uses the **per-request** client pattern. The module-scoped pattern is not to be
adopted without a load test that shows it holding under at least the same concurrency.

---

## D2d — Ed25519 and CQGW1

Run in two runtimes. Both execute the repository's own `src/lib/gateway/cqgw1.ts` and `encoding.ts`.

```bash
# Host Deno 2.9.5, importing the repository modules directly. No --allow-net.
deno run --unstable-sloppy-imports --allow-read docs/club-operations/d2-spike/scripts/d2d_deno.ts

# Inside the local Supabase Edge runtime
curl -s -X POST http://127.0.0.1:54321/functions/v1/d2d-ed25519 -H 'content-type: application/json' -d '{}'
```

| Check | Deno 2.9.5 | Edge runtime 1.74.3 |
|---|:--:|:--:|
| Ed25519 key generation | PASS | PASS |
| signing | PASS | PASS |
| verification | PASS | PASS |
| 64-byte signature | PASS | PASS |
| tampered message rejected | PASS | PASS |
| 32-byte raw public key export | PASS | PASS |
| raw public key re-import verifies | PASS | PASS |
| canonical path length 34 bytes (computed) | PASS | PASS |
| canonical string shape, 8 lines | PASS | PASS |
| closed 12-operation union | PASS | PASS |
| end-to-end verify accepts | PASS | PASS |
| signature is unpadded base64url | PASS | PASS |
| flipped body byte rejected | PASS | PASS |
| swapped body rejected | PASS | PASS |
| operation-header swap rejected | PASS | PASS |
| stale timestamp rejected | PASS | PASS |
| unknown key id rejected | PASS | PASS |
| **failures** | **0** | **0** |

**Ed25519 is available in both runtimes. The HMAC fallback is not needed and is not selected.**

No timing measurement appears in either spike. Constant-time execution is a property of the
platform's implementation and cannot be established by wall-clock observation.

### Edge runtime module resolution

The Edge runtime could not load `cqgw1.ts` as committed: the repository uses bundler-style
extensionless imports (`from './encoding'`), and the runtime requires an explicit extension.

The spike applied exactly one mechanical rewrite to the vendored copy:

```diff
-import { … } from './encoding';
+import { … } from './encoding.ts';
```

`encoding.ts` was copied byte-identically (SHA-256 `d75efd31…c020bb`, unchanged). `cqgw1.ts` before
the rewrite was SHA-256 `302306fe…df852d`, matching the repository file exactly.

**D3 requirement (accepted):** the gateway function must **bundle its dependencies or use explicit
`.ts` specifiers** in the modules it shares with the browser build. This is a packaging task, not a
rewrite — the module's behaviour was identical in both runtimes.

---

## Teardown

```bash
npx.cmd --yes supabase@latest stop --no-backup
```

The role, schema, synthetic rows and throwaway credential exist only inside the disposable container
and are destroyed with it.
