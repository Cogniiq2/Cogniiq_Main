# Golden Agent — n8n booking workflow contract

Normative wire contract between the `n8n_webhook` booking adapter
(`src/lib/goldenAgent/adapters/n8nBookingProvider.ts`) and a customer's n8n workflow.

**Status:** the adapter is implemented and tested; no customer workflow exists yet. Haema DEV
deliberately stays on the in-memory `mock` provider until a real workflow is built and this contract
is implemented against a real booking system. The executable half of this document is
`src/lib/goldenAgent/adapters/n8nContract.test.ts`.

**This contract is generic on purpose.** It is expressed in the Golden Agent's universal vocabulary
(slots, appointments, callers), not in any customer system's vocabulary. Mapping to a PVS, a
calendar or a spreadsheet is the workflow's job, and the workflow is the only place a customer
system may be named.

---

## 1. Configuration

In the receptionist's `ClientConfig`:

```jsonc
"bookingIntegration": {
  "provider": "n8n_webhook",
  "baseUrl": "https://n8n.example.com/webhook/<customer>",   // no trailing slash needed
  "secretEnvVar": "N8N_BOOKING_SECRET_<CUSTOMER>"            // the NAME of an env var, never a value
}
```

**Never put a secret in the ClientConfig.** The config is stored in the database, shown in the
dashboard and versioned. Only the *name* of a server-side environment variable belongs there; the
value is set as a Supabase function secret on `receptionist-tools` and is read exclusively inside
the edge function. Naming convention: `N8N_BOOKING_SECRET_<CUSTOMER_SLUG>`, upper snake case.

If the env var is unset, the adapter is never constructed: the tool answers
`provider_unavailable` and the agent offers a callback. It never falls back to the mock.

---

## 2. Request

One HTTPS endpoint per operation:

```
POST {baseUrl}/{operation}
Content-Type: application/json
X-Cogniiq-Client:          <clientId — the Cogniiq organization uuid>
X-Cogniiq-Timestamp:       <unix seconds>
X-Cogniiq-Signature:       <lowercase hex hmac-sha256(secret, `${timestamp}.${rawBody}`)>
X-Cogniiq-Idempotency-Key: <key>            (write operations only)
```

Body, for every operation:

```jsonc
{
  "client_id": "<organization uuid>",
  "conversation_id": "<voice runtime conversation id>",
  "idempotency_key": "<key>",   // write operations only
  ...                           // operation payload, see §4
}
```

### The workflow MUST

1. **Verify the signature** over `${X-Cogniiq-Timestamp}.${raw request body}` using the shared
   secret, with a constant-time comparison. The timestamp is inside the signed string, so a captured
   request cannot be replayed with a fresh header.
2. **Reject a timestamp outside a ±5 minute window**, to bound replay.
3. **Reject a `client_id` that is not the customer this workflow serves.** The adapter only ever
   sends the bound tenant, but a workflow that trusts the field blindly turns a Cogniiq bug into a
   cross-tenant leak.
4. **Deduplicate write operations on `idempotency_key`.** The same key means the same intent: return
   the ORIGINAL result again with `"deduplicated": true`. It must never create a second appointment.
5. **Answer within 12 seconds.** After that the adapter aborts and the agent offers a callback. A
   write that was still executed after the abort is reconciled by the idempotency key on the retry.

---

## 3. Response

```jsonc
// success — HTTP 200 only
{ "ok": true, "data": { /* per operation, see §4 */ }, "deduplicated": false }

// failure — any status; a 2xx with ok:false is fine and preferred
{ "ok": false, "code": "<failure code>", "message": "<short German sentence for the caller>" }
```

Rules the adapter enforces, so the workflow cannot accidentally lie to a caller:

| The workflow returns | The agent gets |
| --- | --- |
| HTTP 200, `ok:true`, `data` matching the schema | success |
| HTTP 200, `ok:true`, `data` NOT matching the schema | `malformed_provider_response` |
| HTTP 4xx/5xx with `ok:true` | `malformed_provider_response` — a success is only accepted with a 2xx |
| Body that is not JSON, or has no boolean `ok` | `malformed_provider_response` |
| `ok:false` with a code from §5 | that code, verbatim |
| `ok:false` with any other code | `provider_error` |
| `message` absent, non-string, or over 200 characters | a safe German default |
| HTTP 401 / 403 | `provider_unavailable`, not retryable — operator diagnostic: secret mismatch |
| HTTP 404 / 405 | `provider_unavailable`, not retryable — operator diagnostic: no such webhook |
| HTTP 408 / 429 | `provider_timeout`, retryable |
| HTTP 502 / 503 / 504 | `provider_error`, retryable |
| Other HTTP 5xx | `provider_error`, not retryable |
| Connection error | `provider_unavailable`, retryable |
| No answer within the timeout | `provider_timeout`, retryable |

`message` is spoken to a caller. It must be a short German sentence in Sie-Form and must never
contain a system name, a URL, an internal id, a stack trace, or another person's data.

---

## 4. Operations

Field names are `snake_case` everywhere on the wire, including inside `caller`, which is
`{ first_name?, last_name?, date_of_birth?, phone?, email?, customer_number? }`. Fields the caller
never supplied are OMITTED, not sent as `null`, so "not asked" and "asked and empty" stay
distinguishable.

### `get_available_slots` (read)

Request: `service_id`, `location_id|null`, `from_date`, `to_date`, `time_of_day`
(`morning|afternoon|evening|any`), `provider_id|null`, `is_new_caller|null`. Dates are `YYYY-MM-DD`.

Response `data`:
```jsonc
{
  "slots": [
    { "slot_id": "string",     // opaque, must be accepted back verbatim by create_appointment
      "start_time": "2026-09-09T09:00",   // local time, no offset
      "end_time":   "2026-09-09T09:30",
      "location_id": "string", "service_id": "string" }
  ],
  "none_available": false
}
```
Return `none_available: true` with an empty `slots` array when the search genuinely found nothing.
Never return a slot the caller cannot actually book: the agent will offer it out loud.

### `create_appointment` (write, idempotent)

Request: `idempotency_key`, `slot_id`, `service_id`, `location_id`, `start_time`, `caller`,
`notes|null`.

Response `data`: `{ "status": "booked", "appointment": <Appointment> }` where `<Appointment>` is
`{ appointment_id, reference?, start_time, end_time, location_id, service_id, status: "booked"|"cancelled"|"completed" }`.

Only return `ok:true` when the appointment exists in the customer system. Everything else is a
failure code — most usefully `slot_unavailable` or `duplicate_booking`.

### `find_appointment` (read, identity-gated)

Request: `caller`, `reference|null`, `from_date|null`.

Response `data`: `{ "appointments": [<Appointment>], "identity_verified": true }`.

**Return only appointments belonging to the identified caller.** The Cogniiq runtime refuses to call
this at all until the configured identity fields are present, but the workflow is the last line of
defence. Never include another person's data in the array, and never include caller fields the agent
did not already know.

### `reschedule_appointment` (write, idempotent)

Request: `idempotency_key`, `appointment_id`, `new_slot_id`, `new_start_time`, `caller`.
Response `data`: `{ "status": "rescheduled", "appointment": <Appointment>, "previous_start_time": "..." }`.

Move the appointment. Do not implement it as cancel + create: the evaluation suite asserts the
distinction, and a failed second half would lose the caller's appointment entirely.

### `cancel_appointment` (write, idempotent, destructive)

Request: `idempotency_key`, `appointment_id`, `caller`, `reason|null`.
Response `data`: `{ "status": "cancelled", "appointment_id": "...", "late_cancellation": false }`.

Set `late_cancellation` when the customer's own cancellation window was missed, so the agent can say
so. The Cogniiq runtime has already required an explicit spoken confirmation before this call.

### `send_confirmation` (write, idempotent)

Request: `idempotency_key`, `appointment_id`, `channel` (`sms|email`), `destination`.
Response `data`: `{ "status": "sent"|"queued", "channel": "sms"|"email" }`.

### `request_callback` (write, idempotent)

Request: `idempotency_key`, `caller_name`, `caller_phone`, `topic`, `preferred_time|null`,
`location_id|null`, `urgency` (`normal|high`).
Response `data`: `{ "status": "recorded", "callback_id": "...", "expectation": "Das Team meldet sich heute noch." }`.

`expectation` is read aloud, so it must be a promise the customer can actually keep.

---

## 5. Failure codes

Use the most specific one; anything unrecognised becomes `provider_error`.

| Code | Meaning | Agent's next move |
| --- | --- | --- |
| `slot_unavailable` | The slot was taken between the search and the booking | offer alternatives |
| `duplicate_booking` | This person already has such an appointment | ask the caller |
| `not_found` | No appointment matches | verify identity |
| `identity_unverified` | The supplied details do not match the record | verify identity |
| `outside_booking_window` | Too far ahead, too short notice, or outside the allowed window | escalate |
| `policy_violation` | The customer's rules forbid this by phone | escalate |
| `invalid_arguments` | The payload was unusable | escalate |
| `provider_unavailable` | The backing system is down | offer a callback |
| `provider_timeout` | The backing system did not answer in time | offer a callback |
| `provider_error` | Anything else that went wrong | escalate |

---

## 6. Checklist before switching a customer off the mock

1. Workflow implements all seven operations and verifies the signature.
2. Idempotency is real: replaying a write returns the first result, not a second appointment.
3. `find_appointment` cannot return another caller's data.
4. The shared secret is set as a Supabase function secret under the name in `secretEnvVar`, and
   nowhere else.
5. The workflow answers within 12 seconds under load.
6. The DEV receptionist is switched to `n8n_webhook`, provisioned, and the offline suite plus an
   ElevenLabs simulation run pass.
7. Only then may the receptionist leave `dev`.
