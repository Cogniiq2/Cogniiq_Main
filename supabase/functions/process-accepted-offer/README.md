# process-accepted-offer (SOURCE ONLY — NOT DEPLOYED)

Token-authenticated offer acceptance with a drawn signature. The browser posts the
signature as a `data:image/png;base64,…` payload plus signer details; this function
validates + hashes the PNG server-side, stores it PRIVATELY at a server-generated path in
the `owner-offer-signatures` bucket, and calls the service-role RPC
`record_offer_acceptance`, which binds the evidence to the immutable offer version + source
hash, is idempotent, and queues the configured invoice automation.

## Request

`POST /functions/v1/process-accepted-offer`

```json
{
  "token": "<raw access token>",
  "signer_name": "Thomas Pensel",
  "signer_company": "Pankofer GmbH",
  "signer_email": "kontakt@example.test",
  "signer_role": "Geschäftsführer",
  "comment": "Passt",
  "terms_version": "annahme-v1",
  "signature_png": "data:image/png;base64,iVBORw0KGgo…",
  "user_agent": "…"
}
```

Response: `{ "ok": true, "offer_number": "AN-2026-0001" }` or `{ "ok": false, "error": "…" }`
(customer-safe messages only; raw Postgres/Storage errors are never surfaced or logged).

## Secrets (server only)

```
supabase secrets set SUPABASE_URL=…            # provided automatically in the platform
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=…
```

`SUPABASE_SERVICE_ROLE_KEY` is a function secret — it never ships to the browser.

## Deploy (run manually; NOT part of this task)

```
supabase functions deploy process-accepted-offer --no-verify-jwt
```

`--no-verify-jwt` because the caller is anonymous; authorization is the secure token, not a
Supabase JWT.

## Guarantees

- MIME (`image/png`) + PNG magic-number + strict max size (≤ 400 KB) enforced before any write.
- Storage path is server-generated (`<entity>/<offer>/<uuid>.png`); the client cannot choose it.
- Private bucket only; no public object URL is ever produced.
- Raw token and signature bytes are never logged.
- On RPC failure the orphaned signature object is removed (compensation).
- Rate-limited per IP (best-effort in-memory; back with a durable store in production).
