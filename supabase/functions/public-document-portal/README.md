# Edge Function: `public-document-portal`

**Source only — NOT deployed by this task.** Deploying Edge Functions and running production
migrations is explicitly out of scope; this document records how a deployer would enable it.

## What it does

The anonymous offer portal (`/d/:token`) already works without this function: token verification,
the curated offer projection, and accept/reject are `SECURITY DEFINER` RPCs
(`public_offer_by_token`, `respond_offer_by_token`) callable with the **anon** key, and the portal
renders the offer PDF client-side from the projection.

This function adds two things the browser cannot safely do:

1. **Rate limiting** in front of the public RPCs (best-effort in-memory; back it with a durable
   store for production, since Edge Functions scale horizontally).
2. **Signed-URL download** of the *stored* PDF. Anonymous users have no access to the private
   `owner-finance-documents` bucket, so a `download` request verifies the token via the anon RPC,
   then uses the **service role** to resolve the token's document path and return a **120-second
   signed URL**. The raw storage path is never returned.

## Endpoints (POST)

- `POST …/view` → `{ token }` → `{ offer }`
- `POST …/respond` → `{ token, decision, signerName, signerCompany, signerEmail, termsVersion, comment }` → `{ result }`
- `POST …/download` → `{ token }` → `{ url, expires_in }`

## Required secrets (function-scoped — never in the frontend or Vite env)

```
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY   # secret; only used server-side inside the function
```

## Deploy (run by a human operator, not by this task)

```bash
supabase functions deploy public-document-portal
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=... SUPABASE_ANON_KEY=... SUPABASE_URL=...
```

## Security notes

- The service-role key stays inside the function (`Deno.env`), never reaches the client.
- The raw offer id never grants access — only a token whose SHA-256 hash matches a live,
  non-expired, non-revoked row.
- Production rate limiting should use a durable backing store.
