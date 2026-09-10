# storage-purge-worker — production Storage-deletion worker (SOURCE ONLY — NOT DEPLOYED)

Drains the durable `owner_storage_purge_queue` outbox and performs the real deletion of Storage
object bytes after an owner purge or emergency deletion. Invoked every minute by a secure
Supabase Cron / pg_net call — the same architecture as `send-offer-document-email`, applied to
exactly one operation.

## Why this exists

Every owner deletion RPC (`owner_workspace_purge_items`, `owner_force_purge_items`,
`owner_force_delete_customer`, `owner_purge_customer`) removes database rows and writes an
append-only tombstone in one Postgres transaction. Before this worker existed, that same
transaction also issued `delete from storage.objects` directly — which only ever removes
Postgres's *metadata* row. The actual file bytes live behind the Storage API service (S3 or
equivalent), and nothing reachable from plain SQL calls that service. The direct delete looked
like cleanup and was not: it silently orphaned bytes in the bucket.

A Postgres transaction and an external HTTP call to the Storage API cannot be made atomic with
each other. The standard, correct answer to that constraint is a **transactional outbox**: the
intent to delete is written durably and atomically with the row destruction; a separate,
idempotent worker drains it. This is that worker.

## What it does

1. Authenticates the caller with a constant-time `WORKER_SECRET` check (`x-worker-secret`
   header) — identical mechanism to the automation worker, a **different** secret.
2. Atomically claims a bounded batch of due queue entries via `owner_storage_purge_claim_batch`
   (`FOR UPDATE SKIP LOCKED`), so two overlapping invocations can never process the same object.
3. For each claimed entry, calls `storage.from(bucket).remove([path])` — the real Storage API
   call, which removes the backing bytes and the metadata row together, atomically, as one
   operation on Supabase's side.
4. Reports the outcome via `owner_storage_purge_complete`:
   - `deleted` — the object was actually removed.
   - `already_missing` — the call succeeded but the object was not there to remove (distinguished
     from `deleted` by `interpretRemoveResult.ts`, which checks whether the requested path
     appears in the API's own list of what it actually removed).
   - `failed` — a genuine error (network, permissions, 5xx). Reverts to `pending` while attempts
     remain, so it is retried on the next sweep rather than dropped; becomes a terminal, visible
     `failed` row once the attempt cap (`max_attempts`, default 8) is reached.

No object is ever destroyed through any other path. No SQL function in this repository issues
`delete from storage.objects` for a purge.

## Idempotency and retries

- **Claim is exclusive.** `FOR UPDATE SKIP LOCKED` means a second concurrent invocation (a
  retried or duplicated cron trigger, a manual re-run) simply gets a different, non-overlapping
  batch — never the same row twice while it is in flight.
- **Completion is idempotent.** Reporting `deleted` a second time against an already-terminal
  row is a no-op (`owner_storage_purge_complete` returns `idempotent: true` and touches nothing)
  — safe if the worker's own report call is itself retried after a network blip.
- **The Storage API call itself is naturally idempotent.** Removing an object that is already
  gone (because a previous attempt actually succeeded before the worker crashed reporting it)
  returns success with an empty removed-list, which `interpretRemoveResult` correctly reads as
  `already_missing` — never an error, never a reason to believe something went wrong.
- **A transient failure is retried automatically** by the next cron sweep (every minute); an
  owner can also force an immediate retry of a terminally `failed` entry via
  `owner_storage_purge_retry_failed(tombstone_id)`.

## Failure modes considered

| Scenario | Behavior |
|---|---|
| Storage delete succeeds, DB report never arrives (crash, network) | Next sweep calls `remove()` again on an already-gone object → `already_missing` → reported as resolved. No data loss, no duplicate side effect. |
| DB row deletion succeeds, Storage API call fails | Row is already gone (irreversible, by design — the DB transaction is not held open waiting for Storage). The queue entry — durably written in the SAME transaction as the row deletion — carries the obligation forward until it resolves or is visibly `failed`. |
| Edge Function times out mid-batch | Entries already fully processed (deleted + reported) stay resolved. Entries not yet reached stay `pending`/`processing` and are picked up by the next sweep — nothing is lost, because nothing was marked done that was not actually done. |
| Duplicate/replayed HTTP trigger | Two invocations independently claim non-overlapping batches (`FOR UPDATE SKIP LOCKED`); neither can process what the other already claimed. |
| Partial failure across a multi-object purge | Each object is an independent queue row with its own status — `owner_storage_purge_status(tombstone_id)` reports exactly which are `deleted`, `already_missing`, `failed`, or still `pending`, never a single pass/fail for the whole purge. |

## What it never does

- Never accepts a path from the HTTP request body. Every queue entry comes from
  `owner_storage_purge_enqueue`, itself only reachable from inside the owner-gated purge RPCs,
  and only for the three buckets this system owns (`owner-finance-documents`,
  `owner-offer-signatures`, `customer-documents`) — a disallowed bucket is refused before it
  can ever reach the queue.
- Never exposes the service-role key to a browser. It lives only in this function's environment
  (`../_shared/env.ts`), the same platform-injected credential every other worker in this
  repository uses.
- Never claims a purge is fully successful based on the DB transaction alone. The purge RPCs'
  own response reports the row destruction (`outcome: 'hard_deleted'`) and the *expected*
  Storage objects — never a synchronous "deleted" claim for Storage, because nothing has
  attempted that deletion yet at the point the RPC returns.

## Deploying (when explicitly asked — not part of this change)

```
supabase functions deploy storage-purge-worker --no-verify-jwt
```

`--no-verify-jwt` because this function is authenticated by `WORKER_SECRET`, not a Supabase JWT
— pg_net calls it with a service credential header, not a user session. Set `WORKER_SECRET` as
a function secret (`supabase secrets set WORKER_SECRET=...`), store the function's own URL and
that same secret value in Vault under `storage_purge_worker_url` /
`storage_purge_worker_secret`, then run the `cron.schedule(...)` block documented in
`20260910140000_owner_storage_purge_worker.sql` §11 from the Supabase SQL Editor.
