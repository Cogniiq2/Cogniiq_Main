# client-onboarding-invite — owner-triggered onboarding emails (SOURCE ONLY — NOT DEPLOYED)

One request sends one email (`invitation`, `reminder` or `request`) for an AI Receptionist
engagement. It is called only by the platform owner from the engagement workspace. There is no
cron job and nothing is sent automatically.

## Flow

1. Verify the caller's JWT (anon/publishable key + `Authorization` header).
2. `owner_onboarding_begin_send` **under the caller's identity**. That RPC does all
   authorization: owner only, recipient must belong to this customer, test sends always go to the
   owner's own address, rate limits (5/h and 15/day per engagement, 10 tests/h per owner),
   idempotency key, and — for a real invitation to a non-member — the pending
   `client_invitations` row that the existing `claim_my_client_invitations()` flow consumes.
3. Entry link (`_shared/clientOnboarding/linkPolicy.ts`, unit-tested). Supabase emails nothing:
   - pending portal invitation, no account yet → `generateLink({ type: 'invite' })` (creates the one auth user);
   - pending portal invitation, account exists but never signed in (an earlier link was not
     used or expired) → `generateLink({ type: 'magiclink' })` to the same set-password page;
   - the address has signed in before, or no pending invitation → normal login
     `PUBLIC_APP_URL/app/login?redirectTo=/app/setup`;
   - test send → portal login; no auth link is minted. The test email says that a Cogniiq staff
     account does not see the customer view.
   The email link's expiry (`AUTH_LINK_TTL_SECONDS`) is recorded per message, separately from the
   portal invitation's 30-day validity. "Neuen Aktivierungslink senden" reuses the same pending
   `client_invitations` row: no second account, no second membership.
4. Render `_shared/clientOnboarding/emailTemplate.ts` — the same module the owner preview uses (re-exported in `src/lib`).
5. Resend `POST /emails` with `Idempotency-Key: onboarding:<message_id>`, 15 s timeout, one
   retry on 429/5xx.
6. `service_onboarding_complete_send` (service role only). `accepted` is final.

## Truthfulness

`accepted` means the provider accepted the message. It is never shown as delivered, opened or
read. No tracking pixel, no click tracking, no open tracking.

## Secrets and data handling

- `RESEND_API_KEY` and the service-role key live only in `Deno.env`; never returned or logged.
- The activation link is a credential: it appears only inside the email, never in a response,
  a database row or a log.
- Errors returned to the browser are fixed German strings (`_shared/clientOnboarding/sendErrors.ts`);
  raw database and provider messages are never forwarded.

## Environment

| name | notes |
|---|---|
| `SUPABASE_URL`, anon/publishable key, service-role/secret key | provided by the runtime (`../_shared/env.ts`) |
| `RESEND_API_KEY`, `EMAIL_FROM` | already configured for `send-offer-document-email` |
| `PUBLIC_APP_URL` | e.g. `https://cogniiq.de` |
| `CUSTOMER_PORTAL_INVITE_REDIRECT` | optional, default `${PUBLIC_APP_URL}/auth/confirmed?flow=invite` (same as `admin-provision-client`) |
| `ONBOARDING_REPLY_TO` | optional; defaults to the business email in `owner_document_settings` |
| `AUTH_LINK_TTL_SECONDS` | must equal Supabase Auth → Email → "Email OTP expiration" (seconds, 300–86400). Default 3600 — conservative: it can only under-state how long a link works |

Deploy with JWT verification **on** (default). Must be deployed **after** migration
`20261124120000_client_onboarding_bridge.sql`. All local imports stay inside `supabase/functions`
(`../_shared/env.ts`, `../_shared/clientOnboarding/*.ts`) — the same pattern every deployed function
uses; there is no cross-directory import into `src/` (that pattern is unproven, see
`club-operations-read/README.md`). The frontend re-exports the shared modules from `src/lib/clientOnboarding`.

## Known limits

- An activation link stops working after the Supabase email-OTP lifetime. The owner panel shows
  the recorded expiry per link and offers "Neuen Aktivierungslink senden"; the portal invitation
  itself stays valid 30 days.
- The magic-link path for "account exists, never signed in" must be confirmed once in the pilot
  (docs/client-onboarding.md §9); if it fails, the function falls back to the login link and the
  owner sees "mit Anmeldelink" in the history.
- A message stuck in `sending` (function crashed between reserve and record) is shown to the
  owner as "Status unklar" after 10 minutes, never as sent.
