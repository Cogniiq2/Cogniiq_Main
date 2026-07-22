# send-offer-document-email (SOURCE ONLY — NOT DEPLOYED)

Automation-job worker + provider-agnostic email sender. Drains `owner_automation_jobs`
(the durable outbox created in migration `20260723125000`) and performs the configured
downstream steps after acceptance — issue the invoice, generate its PDF, send the
invoice/offer email — recording each outcome back on the job (status, attempt_count,
last_error, provider_message_id) for the owner dashboard, with bounded retries.

## Secrets (server only — never shipped to the browser)

```
supabase secrets set EMAIL_PROVIDER=resend
supabase secrets set RESEND_API_KEY=…
supabase secrets set EMAIL_FROM="Cogniiq <angebote@cogniiq.de>"
supabase secrets set PUBLIC_APP_URL=https://app.cogniiq.de   # production URL, never a preview host
```

## Deploy + schedule (run manually; NOT part of this task)

```
supabase functions deploy send-offer-document-email
# schedule every minute via pg_cron / Supabase scheduled functions to drain the outbox
```

## Guarantees

- Provider secrets are read from `Deno.env` only; nothing is hardcoded and nothing is returned.
- Jobs reference offer/invoice ids — the raw customer token is never read or logged; signatures
  are never emailed or logged.
- Bounded retries: a job flips `retrying` until `max_attempts`, then `failed` (manual retry from
  the dashboard re-arms it).
- An incomplete invoice is never emailed — preflight gating happens upstream in
  `owner_process_offer_acceptance`; only jobs the pipeline queued are drained here.
