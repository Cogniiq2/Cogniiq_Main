# send-offer-document-email — production automation worker (SOURCE ONLY — NOT DEPLOYED)

Drains the durable `owner_automation_jobs` outbox and performs the real downstream work
after an offer is accepted. Invoked every minute by a secure Supabase Cron / pg_net call.

## What it does per job type

| job_type | operation |
|---|---|
| `invoice_create` | idempotent server-authoritative invoice draft (`owner_ensure_offer_invoice_internal`) |
| `invoice_issue` | server-authoritative issue — final number + status, full preflight (`owner_issue_invoice_internal`); **never marked sent unless the issue succeeded** |
| `invoice_send` / `invoice_email` | issue if needed → render the invoice PDF from **trusted** server context (`owner_worker_invoice_context`) → store it privately in `owner-finance-documents` → register it (`owner_worker_register_document`) → email it as a **Base64 attachment** (`Rechnung-RE-2026-0001-Cogniiq.pdf`) |
| `invoice_pdf_generate` | issue if needed → render + privately store + register the invoice PDF only (no email); terminates as `completed` |
| `offer_email` | mint a **fresh** secure token (hash-only stored, raw returned once) → email the **exact** `PUBLIC_APP_URL/d/<token>` portal link (never the app root, never fabricated from a hash), using the owner-authored subject/message (HTML-escaped) or the premium German default → on success advance the offer to `sent` (`owner_worker_mark_offer_sent`); on failure revoke the just-minted token (`owner_worker_revoke_offer_token`) so no active token is orphaned |
| `signed_offer_certificate_generate` | fetch the drawn signature PNG from the **private** `owner-offer-signatures` bucket → render the signed **acceptance certificate** from trusted context (`owner_worker_certificate_context`) with the signature embedded → store it privately in `owner-finance-documents` → register it as a signed offer document (`owner_worker_register_certificate`); terminates as `completed` |
| `signed_offer_confirmation_email` | ensure the certificate exists (generate it if missing) → email a premium German confirmation (`Ihre Annahme des Angebots … wurde bestätigt`) with the certificate attached (`Annahmebestaetigung-…-Cogniiq.pdf`) |

Outcomes are recorded via `owner_complete_automation_job`:
- `sent` — an email left the building (terminal/idempotent);
- `completed` — a generation-only job finished (certificate / invoice PDF), **never** falsely marked `sent`;
- `retrying` — bounded exponential backoff (1m → 5m → 15m → 1h → capped);
- `failed` — attempt cap reached.

A failed job never rolls back the accepted offer, deletes the invoice, or removes signature
evidence; the owner dashboard shows the failure and offers a secure retry.

## Signed acceptance certificate

Generated **server-side** from `owner_worker_certificate_context` (the immutable offer
snapshot + the acceptance event's signature evidence) — the browser never produces the
authoritative certificate. The customer's drawn signature PNG is decoded (inflate → unfilter →
flattened onto white) and embedded as a real image XObject, so the certificate shows the actual
signature. It proves which offer + immutable version was accepted, by whom, when, for what
amount, under which terms version, bound by the SHA-256 values, with the original PNG privately
stored. It is explicitly a **simple** electronic signature (eIDAS) — never qualified/advanced.

Registering it (dedupe on the `signed` flag, so it never collides with the finalized offer PDF)
flips `signed_document_available` to `true`, making the dashboard show
`Signierter Nachweis: Verfügbar` with preview + download. No private storage path appears in the
customer-facing PDF.

## Owner-triggered offer email ("E-Mail jetzt senden")

The owner dashboard's *Angebot versenden* dialog no longer uses a local `mailto:` provider.
The primary button **E-Mail jetzt senden** enqueues one durable `offer_email` job through the
secure owner RPC `owner_enqueue_offer_email(offer_id, recipient_email, subject, message)`
(`20260723128000`). The worker then mints the fresh secure portal token and sends through Resend
automatically. The flow:

```
Owner clicks "E-Mail jetzt senden"
  → owner_enqueue_offer_email  (owner-only RPC; enqueues/re-arms ONE offer_email job)
  → worker claims the job       (owner_claim_automation_jobs, FOR UPDATE SKIP LOCKED)
  → worker mints a fresh token  (owner_worker_mint_offer_link — hash-only stored)
  → Resend sends the offer email with the exact PUBLIC_APP_URL/d/<token> link
  → offer status becomes 'sent' ONLY after the successful provider send
```

Key guarantees:

- **The token is minted only in the worker** while processing the job — never when the dialog
  opens. Opening the dialog creates no token, no job, changes no status, and contacts no
  provider. (This removed the old behavior where opening the dialog immediately minted a token.)
- **`owner_enqueue_offer_email` never sets the offer to `sent`.** Only a successful Resend send
  does, via the service-role `owner_worker_mark_offer_sent` (finalized/viewed → sent; idempotent;
  never downgrades an accepted/converted offer).
- **Sendable-state gate:** only `finalized`, `sent`, `viewed` offers may be enqueued; `draft`,
  `cancelled`, `rejected`, `expired`, `accepted`, `converted` are rejected.
- **Recipient** is validated + normalized (lowercased/trimmed) server-side.
- **Editable subject/message** are stored in a safe job payload and HTML-escaped in the worker;
  the secure link is always appended by the worker (the dialog never carries the token).
- **Explicit resend** creates a new versioned attempt (dedupe key `offerId:offer_email:<n>`),
  preserving prior `sent` jobs as historical evidence; a failed job is re-armed in place.
- **Manual alternatives** (copy link / WhatsApp / share) are separate. They mint a secure link
  only on explicit click and **never** enqueue an `offer_email` job or mark the offer email-sent.

### Retry a failed offer email

Re-open *Angebot versenden* and click **Erneut versuchen** (calls `owner_enqueue_offer_email`
again, which re-arms the failed job to `retrying`). The dashboard status line shows
`Noch nicht versendet` / `Wartet auf Versand` / `Wird versendet` / `Versendet` /
`Fehler beim Versand`.

### Verify the offer email + provider message id

```sql
-- Offer-email attempts for an offer (newest last) with the Resend provider message id:
select dedupe_key, status, recipient_email, provider_message_id, last_error, scheduled_at, sent_at
  from public.owner_automation_jobs
  where offer_id = '<offer-uuid>' and job_type = 'offer_email'
  order by created_at;
```

## Automation settings (owner-controlled, `owner_document_settings`)

| setting | default | effect |
|---|---|---|
| `auto_generate_signed_certificate_on_acceptance` | **on** | generate the certificate after a signed acceptance |
| `auto_send_signed_confirmation_on_acceptance` | **on** | email the customer the confirmation + certificate |
| `auto_create_invoice_on_acceptance` | **on** | create the invoice draft |
| `auto_issue_invoice_on_acceptance` | **off** | finalize + number the invoice (opt-in) |
| `auto_send_invoice_on_acceptance` | **off** | email the finalized invoice (opt-in) |

Certificate + confirmation default **on** (non-destructive, customer-positive). Invoice
issue/send stay **off** until the owner deliberately enables them.

## Manual retry (owner dashboard)

Each retry action calls the owner-only `owner_retry_automation_job(offer_id, job_type)` RPC,
which re-arms an exhausted job or enqueues a missing one and resets its attempt budget. The
sensitive work still runs only in the worker — nothing is executed in the browser.

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

select cron.schedule('cogniiq-automation-worker', '* * * * *', $$
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
select jobid, jobname, schedule, active from cron.job where jobname = 'cogniiq-automation-worker';
select jobid, status, return_message, start_time, end_time
  from cron.job_run_details
  where jobid = (select jobid from cron.job where jobname = 'cogniiq-automation-worker')
  order by start_time desc limit 20;
```

### 4. Remove

```sql
select cron.unschedule('cogniiq-automation-worker');
-- optional: also drop the stored secrets
delete from vault.secrets where name in ('automation_worker_url','automation_worker_secret');
```

## Dashboard-only deployment (no local terminal required)

The owner does not use a local terminal. Everything below is done in the Supabase Dashboard.

1. **Copy the function code.** Dashboard → *Edge Functions* → *Deploy a new function* →
   name it `send-offer-document-email`. Paste `index.ts` and add the sibling files
   `email.ts`, `invoicePdf.ts`, `certificatePdf.ts` in the in-browser editor. Repeat for
   `process-accepted-offer` (its own folder).
2. **JWT verification.** For `send-offer-document-email` turn **Verify JWT off** (it
   authenticates with `x-worker-secret`). For `process-accepted-offer` also **off** (it is a
   public, token-authenticated customer endpoint).
3. **Set the secrets.** Dashboard → *Edge Functions* → *Secrets* (or *Project Settings →
   Functions*): set `WORKER_SECRET`, `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, `EMAIL_FROM`,
   `PUBLIC_APP_URL`. `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` are provided automatically.
4. **Deploy** with the *Deploy* button.
5. **Create the Cron job** in *SQL Editor* using the Vault + `cron.schedule` SQL above.
6. **Test with a disposable offer.** Create a throwaway offer, send yourself the portal link,
   accept it with a drawn signature, and watch the jobs drain (see verification below).

## Production verification

```sql
-- Jobs for a given offer and their live state:
select job_type, status, attempt_count, provider_message_id, last_error, scheduled_at
  from public.owner_automation_jobs where offer_id = '<offer-uuid>' order by created_at;

-- The signed certificate document (private path; download via a signed URL in the dashboard):
select document_number, version, pdf_storage_path, render_metadata->>'signed' as signed, finalized_at
  from public.owner_generated_documents
  where source_resource_type = 'owner_offers' and source_resource_id = '<offer-uuid>'
    and render_metadata->>'signed' = 'true';

-- Verify the signature bucket stays PRIVATE (must return false):
select public from storage.buckets where id = 'owner-offer-signatures';
```

- **Disable auto-send:** owner dashboard → *Dokumente & Rechnungsangaben* → *Automatik bei
  Annahme* → uncheck the relevant toggles (or set the booleans in `owner_document_settings`).
- **Stop the Cron job:** `select cron.unschedule('cogniiq-automation-worker');`
- **Inspect logs:** Dashboard → *Edge Functions* → `send-offer-document-email` → *Logs*.

## Rollback

- **Pause automation** without code changes: unschedule the Cron job (above). No new jobs run;
  accepted offers and evidence are untouched.
- **Roll back the migration** effect: the `20260723127000` and `20260723128000` migrations are
  additive — their columns and functions are safe to leave in place. To revert behaviour, set the
  four new settings off, or `drop function` the added RPCs (the earlier
  `owner_process_offer_acceptance` from `20260723125000` can be re-applied to stop enqueuing
  certificate/confirmation jobs). For the offer-email path specifically, `drop function`
  `owner_enqueue_offer_email` / `owner_worker_mark_offer_sent` / `owner_worker_revoke_offer_token`
  from `20260723128000`; no data is lost (the automation jobs remain as history).
- **Nothing is destructive:** buckets stay private, signature evidence and finalized documents
  are never deleted.

## Guarantees

- Provider/service/worker secrets are read from `Deno.env` only; never returned or logged.
- Raw customer tokens, signatures and document bytes are never logged and never stored in the
  job table; private storage paths are never exposed to callers or rendered in customer PDFs.
- Resend `Idempotency-Key = <jobId>:<documentVersion>` (invoices) / `<jobId>:confirmation`
  (confirmation email) / `<jobId>:offer` (offer email) so retries never send duplicates; an
  explicit resend is a new job (new `jobId`), so it is a genuine new send, not a dedup.
- The offer email mints exactly one token per processed job; a failed send revokes it, so
  repeated UI renders / retries never accumulate multiple active tokens.
- The certificate register dedupes on the `signed` flag, so retries never create a second
  certificate and it never collides with the finalized offer PDF.
- Concurrent worker runs never process the same job (`owner_claim_automation_jobs` uses
  `FOR UPDATE SKIP LOCKED`).
- An incomplete invoice is never issued or emailed (preflight enforced server-side).
- Generation-only jobs terminate as `completed`, never falsely as `sent`.
