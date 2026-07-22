# send-offer-document-email — production automation worker (SOURCE ONLY — NOT DEPLOYED)

Drains the durable `owner_automation_jobs` outbox and performs the real downstream work
after an offer is accepted. Invoked every minute by a secure Supabase Cron / pg_net call.

## What it does per job type

| job_type | operation |
|---|---|
| `invoice_create` | idempotent server-authoritative invoice draft (`owner_ensure_offer_invoice_internal`) |
| `invoice_issue` | server-authoritative issue — final number + status, full preflight (`owner_issue_invoice_internal`); **never marked sent unless the issue succeeded** |
| `invoice_send` / `invoice_email` | issue if needed → render the invoice PDF from **trusted** server context (`owner_worker_invoice_context`) → store it privately in `owner-finance-documents` → register it (`owner_worker_register_document`) → email it as a **Base64 attachment** (`Rechnung-RE-2026-0001-Cogniiq.pdf`) |
| `offer_email` | mint a **fresh** secure token (hash-only stored, raw returned once) → email the **exact** `PUBLIC_APP_URL/d/<token>` portal link (never the app root, never fabricated from a hash) |

Outcomes are recorded via `owner_complete_automation_job`: `sent` (terminal/idempotent),
`retrying` (bounded exponential backoff), or `failed` (attempt cap reached). A failed email
never rolls back the accepted offer or deletes the invoice; the owner dashboard shows the
failure and offers manual retry.

## Worker authentication

The handler requires a **constant-time** match between the `x-worker-secret` request header
and the `WORKER_SECRET` env value. Missing/incorrect → `401`. The secret is read only from
`Deno.env` and is never returned or logged.

## Secrets (server only — never shipped to the browser)

```
supabase secrets set WORKER_SECRET=$(openssl rand -hex 32)
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=…      # provided by the platform
supabase secrets set EMAIL_PROVIDER=resend
supabase secrets set RESEND_API_KEY=…
supabase secrets set EMAIL_FROM="Cogniiq <rechnungen@cogniiq.de>"
supabase secrets set PUBLIC_APP_URL=https://app.cogniiq.de   # production URL, never a preview host
```

## Deploy (run manually; NOT part of this task)

```
supabase functions deploy send-offer-document-email --no-verify-jwt
```

`--no-verify-jwt` because the caller authenticates with `x-worker-secret`, not a Supabase JWT.

## Secure Cron invocation (pg_cron + pg_net + Vault)

The Function URL and the worker secret live in **Supabase Vault**, so the secret never
appears in the visible cron job source. Run the `vault.create_secret` calls once (e.g. in the
SQL editor); they store encrypted values, not plaintext-in-source.

### 1. Store the URL + secret in Vault (once)

```sql
-- Replace <PROJECT_REF> and paste the SAME value you set as the WORKER_SECRET function secret.
select vault.create_secret(
  'https://<PROJECT_REF>.supabase.co/functions/v1/send-offer-document-email',
  'automation_worker_url');
select vault.create_secret('<the-hex-WORKER_SECRET>', 'automation_worker_secret');
```

### 2. Create the every-minute Cron job

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule('automation-worker', '* * * * *', $$
  select net.http_post(
    url     := (select decrypted_secret from vault.decrypted_secrets where name = 'automation_worker_url'),
    headers := jsonb_build_object(
                 'content-type',   'application/json',
                 'x-worker-secret',(select decrypted_secret from vault.decrypted_secrets where name = 'automation_worker_secret')),
    body    := '{}'::jsonb,
    timeout_milliseconds := 20000
  );
$$);
```

The secret is only ever read from `vault.decrypted_secrets` at call time — it is not written
into `cron.job.command` in plaintext.

### 3. Inspect

```sql
select jobid, jobname, schedule, active from cron.job where jobname = 'automation-worker';
select jobid, status, return_message, start_time, end_time
  from cron.job_run_details
  where jobid = (select jobid from cron.job where jobname = 'automation-worker')
  order by start_time desc limit 20;
```

### 4. Remove

```sql
select cron.unschedule('automation-worker');
-- optional: also drop the stored secrets
delete from vault.secrets where name in ('automation_worker_url','automation_worker_secret');
```

## Guarantees

- Provider/service/worker secrets are read from `Deno.env` only; never returned or logged.
- Raw customer tokens, signatures and document bytes are never logged and never stored in the
  job table; private storage paths are never exposed to callers.
- Resend `Idempotency-Key = <jobId>:<documentVersion>` so retries never send duplicates.
- Concurrent worker runs never process the same job (`owner_claim_automation_jobs` uses
  `FOR UPDATE SKIP LOCKED`).
- An incomplete invoice is never issued or emailed (preflight enforced server-side).
