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
3. Entry link:
   - real send with a pending portal invitation → one-time activation link from
     `auth.admin.generateLink({ type: 'invite' })`. Supabase sends nothing itself.
   - the address already has an account (`already registered`) → normal login
     `PUBLIC_APP_URL/app/login?redirectTo=/app/setup`. No account is created or replaced.
   - test send → plain portal URL; no auth link is minted.
4. Render `src/lib/clientOnboarding/emailTemplate.ts` — the same module the owner preview uses.
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
- Errors returned to the browser are fixed German strings (`src/lib/clientOnboarding/sendErrors.ts`);
  raw database and provider messages are never forwarded.

## Environment

| name | notes |
|---|---|
| `SUPABASE_URL`, anon/publishable key, service-role/secret key | provided by the runtime (`../_shared/env.ts`) |
| `RESEND_API_KEY`, `EMAIL_FROM` | already configured for `send-offer-document-email` |
| `PUBLIC_APP_URL` | e.g. `https://cogniiq.de` |
| `CUSTOMER_PORTAL_INVITE_REDIRECT` | optional, default `${PUBLIC_APP_URL}/auth/confirmed?flow=invite` (same as `admin-provision-client`) |
| `ONBOARDING_REPLY_TO` | optional; defaults to the business email in `owner_document_settings` |

Deploy with JWT verification **on** (default). Must be deployed **after** migration
`20261124120000_client_onboarding_bridge.sql`. The frontend imports from `src/lib`, so deploy
from the repository root (same as `club-operations-read`).

## Known limits

- The Supabase activation link expires after the project's OTP lifetime (default 24 h). The
  portal invitation itself stays valid 30 days; "Neu einladen" mints a fresh link.
- A message stuck in `sending` (function crashed between reserve and record) is shown to the
  owner as "Status unklar" after 10 minutes, never as sent.
