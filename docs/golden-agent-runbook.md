# Golden Agent — operator runbook

How one customer goes from "nothing" to a live AI receptionist, in the order the steps must happen.
Companion to `docs/golden-agent-platform.md` (what the system is) and
`docs/golden-agent-n8n-contract.md` (what a customer's booking workflow must implement).

Everything below happens in the internal control center at `/admin/receptionists`, except the steps
explicitly marked **MANUAL** — those are actions in ElevenLabs, Supabase or a phone provider and are
deliberately outside what the platform can do on its own.

---

## Current blocker (as of this writing)

**`POST /v1/convai/secrets` returns 401.** The ElevenLabs API key in the `receptionist-admin`
function environment lacks permission to create workspace secrets, so step 7 fails at the very
first provider call.

That secret is how a webhook tool authenticates to `receptionist-tools` without the token ever
appearing in a prompt, a tool parameter or the browser. **It is not a limitation to work around.**
Do not move the token into the prompt, do not send it as a tool argument, do not accept a tenant id
from the request body, and do not disable the tool authentication. The fix is a permission change on
the key (**MANUAL**, step 6).

The dashboard now names this explicitly: a failed provisioning shows
*"ElevenLabs authentication failure (HTTP 401) while creating the workspace tool secret. Verify that
ELEVENLABS_API_KEY is valid, not expired, and has the 'Workspace Secrets (write)' permission."* —
and the failure stays on the page until the next successful run, rather than vanishing with a toast.

---

## The 18 steps

### 1. Create the organization / client
The tenant is an `organizations` row. It already exists for an onboarded customer. Its `id` is the
`clientId` of every ClientConfig for that customer and the tenant of every tool call.

### 2. Create the receptionist
`/admin/receptionists` → *Create AI Receptionist* → pick the organization, give it a name
(e.g. "Haema Leipzig DEV"). This writes an `ai_receptionists` row at stage `dev` with a skeleton
config that still has onboarding blockers.

### 3. Save the ClientConfig
Detail page → **Configuration** → paste or edit the JSON → *Speichern*. The server re-validates and
writes a new `config_version` plus a row in `ai_receptionist_config_versions`, so every change is
recoverable.

Rules that are enforced, not suggested:
* `clientConfig.clientId` MUST equal the receptionist's organization id — rejected with 422
  otherwise, and a database trigger refuses it as a second line of defence.
* **No secrets in the config.** `bookingIntegration.secretEnvVar` holds the NAME of a server-side
  env var; the value lives only in the Supabase function environment.

### 4. Validate
*Prüfen* runs the same validator the server uses. `error` issues block everything downstream;
`warning` issues do not. The **Onboarding-Status** panel lists what still has to be answered before
this receptionist may leave DEV.

### 5. Inspect the plan
**Agent** tab → *Plan anzeigen*. Shows the exact agent name, the prompt version and length, every
create/update step, and the warnings. Nothing has been sent to ElevenLabs at this point. Read the
system prompt here rather than discovering it on a live call.

Expect, in DEV: `Booking provider is the in-memory mock: bookings are not real.`

### 6. Configure the required ElevenLabs permissions — **MANUAL**
The API key stored as the `ELEVENLABS_API_KEY` function secret needs, at minimum:

| Permission | Needed for |
| --- | --- |
| Workspace Secrets (write) | the tool authentication secret — **currently missing** |
| Agents Platform / Tools (read + write) | creating and reconciling the 11 webhook tools |
| Agents Platform / Knowledge Base (read + write) | the generated knowledge documents |
| Agents Platform / Agents (read + write) | creating, updating and reading the agent |
| Agents Platform / Tests (read + write) | simulation tests and their results |
| Agents Platform / Conversations (read) | syncing call outcomes |

If a permission is missing, the dashboard names it: every provider error is classified and mapped to
the permission its endpoint needs.

### 7. Provision DEV
**Agent** tab → *Agent erstellen (DEV)*. In order: adopt any existing managed resources, ensure the
tool binding and its workspace secret, create or update the 11 tools, write the knowledge documents,
then create or update the agent.

**Retrying is safe and is the intended recovery.** A run that fails halfway persists every provider
id it obtained before failing, and the next run adopts anything it lost by looking the workspace up
by managed name. Repeated successful runs create nothing new. So: fix the cause, click again. Do not
clean up ElevenLabs by hand first — hand-deleting a resource the state still points at only creates
work.

The tool token is displayed exactly once. It is stored only as a SHA-256 hash and is already
installed as the ElevenLabs workspace secret; note it down only if you intend to call the tool
endpoint manually.

### 8. Verify provider status
*Status aus ElevenLabs lesen* fetches the live agent and compares it with what we believe. It
reports the linked tools, the knowledge documents, the phone numbers (expect: none) and **tool
drift** — tools we own that are not attached to the agent, which is what a manual edit in the
ElevenLabs UI looks like. Drift is fixed by provisioning again.

The status badge is derived from stored facts only:
`Nicht provisioniert` → `Teilweise provisioniert` → `Provisionierung fehlgeschlagen` →
`Provisioniert` → `Abweichung bei ElevenLabs`.

### 9. Run the offline evaluation
**Evaluations** → *Offline-Suite ausführen*. Runs every generated scenario through the real tool
runtime and the real adapters against a deterministic reference policy.

**This does not prove anything about the live agent.** It proves the tool contracts, the
confirmation gates, the identity rules and the adapter behaviour. No LLM is involved. The dashboard
says so on every offline run; do not let a green offline suite stand in for step 10.

### 10. Create and run ElevenLabs simulations
*ElevenLabs-Tests anlegen* uploads one simulation test per scenario, then *ElevenLabs-Simulation
starten* runs them against the provisioned agent with mocked tool results. This is the first
evidence about how the actual prompt and the actual model behave.

Results are polled with *Ergebnisse abrufen*. A run stays `running` while any test is pending, and a
run whose provider results cannot be attributed to this receptionist is marked `failed` rather than
reported as passing.

### 11. Inspect failures
Select a run: every scenario shows its findings per dimension and the transcript. A scenario passes
only if BOTH our scorers and the ElevenLabs evaluator pass it.

### 12. Iterate
Failures are almost always a configuration problem, not a code problem. Change the ClientConfig
(step 3), provision again (step 7), re-run (steps 9–10). Only genuinely universal behaviour belongs
in `src/lib/goldenAgent` — anything customer-specific in the core is a bug, and
`genericity.test.ts` fails the build for it.

### 13. Connect the real n8n adapter
Build the workflow against `docs/golden-agent-n8n-contract.md`. Set the shared secret as a Supabase
function secret on `receptionist-tools` under the name in `bookingIntegration.secretEnvVar`
(**MANUAL**), switch `bookingIntegration.provider` to `n8n_webhook`, save, provision, and re-run the
evaluations. Until then the receptionist stays on the mock and the dashboard says so everywhere.

### 14. Move to staging
**Settings** → Stage → `staging`. The tool binding is environment-scoped: a DEV credential cannot
reach a staging receptionist and vice versa, so provision again after the change to issue the
staging credential and re-point the tools.

### 15. Assign a phone number — **MANUAL**, only after approval
The platform never touches phone numbers, in any direction. Assign the number to the agent in the
ElevenLabs UI once the receptionist is otherwise approved.

### 16. Verify the post-call webhook — **MANUAL**
In the ElevenLabs workspace settings, point the post-call webhook at
`https://<ref>.supabase.co/functions/v1/receptionist-postcall` and set its secret to the value of
the `ELEVENLABS_WEBHOOK_SECRET` function secret.

**The code existing is not proof the webhook is configured.** Verify by making one test call and
checking that a row appears under **Calls**. The endpoint deliberately does not require a JWT: it is
authenticated by the ElevenLabs HMAC signature with a 30-minute replay window, rejects malformed and
wrong-secret signatures, ignores agents this platform did not provision, and is idempotent across
the retries ElevenLabs performs until it sees a 2xx.

### 17. Live-readiness review
Before anyone proposes going live:

- [ ] Config valid as a LIVE config (mock provider and unreviewed knowledge are refused above DEV).
- [ ] No `blocker` onboarding gaps.
- [ ] Booking provider is `n8n_webhook` and its workflow satisfies §6 of the n8n contract.
- [ ] Offline suite green **and** a simulation run green — both, for the current config version.
- [ ] Provider status clean: no tool drift, `last_sync_error` empty.
- [ ] At least one real test call verified end to end, including the post-call webhook.
- [ ] Escalation contacts and the emergency policy are correct and reachable.
- [ ] Retention and recording settings reviewed against the customer's processor agreement.

### 18. Approve LIVE explicitly
**Settings** → Stage → `live` is refused unless the config is live-valid, blockers are cleared and
an agent exists. After that, every further provisioning of a live agent requires
`allowLiveChanges=true` — the dashboard asks for confirmation. This is deliberate friction.

---

## Server environment (names only — never values)

| Name | Where | Purpose |
| --- | --- | --- |
| `ELEVENLABS_API_KEY` | `receptionist-admin` | the only copy of the provider key; never returned to the browser |
| `ELEVENLABS_WEBHOOK_SECRET` | `receptionist-postcall` | HMAC verification of post-call deliveries |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | all three functions | runtime-provided |
| `RECEPTIONIST_TOOLS_URL` | `receptionist-admin` (optional) | overrides the derived tools endpoint URL |
| `N8N_BOOKING_SECRET_<CUSTOMER>` | `receptionist-tools` | per-customer n8n shared secret; the NAME goes in the ClientConfig, the value never does |

---

## Failure playbook

| Symptom | Meaning | Action |
| --- | --- | --- |
| 401 while creating the workspace tool secret | API key lacks Workspace Secrets (write) | fix the key permission, provision again |
| 403 on tools / knowledge / agents / tests | API key lacks that scope | grant it, provision again |
| 429 or 5xx mid-run | provider-side | wait, provision again — the run resumes from what exists |
| `Teilweise provisioniert` | a run failed after creating some resources | provision again; ids were checkpointed and are reused |
| `Abweichung bei ElevenLabs` | someone edited the agent in the ElevenLabs UI | provision again to rewrite the intended state |
| Tools answer `unauthorized` | the binding was rotated without re-provisioning | provision again so the tools use the new secret |
| Tools answer `provider_unavailable` with an n8n integration | wrong shared secret or missing webhook | check the system events under **Calls**; the diagnostic says which |
| A simulation run stays `running` | tests still pending, or polling hit a provider error | poll again; a retryable polling error never marks the run failed |
| A simulation run is `failed` with `unmatched` | the provider returned results for tests this receptionist does not own | recreate the simulation tests and run again |

## What the platform will never do on its own

Assign or change a phone number · delete an ElevenLabs resource that is still referenced · apply a
database migration · deploy an edge function · promote a receptionist to `live` · change a live
agent without `allowLiveChanges` · put a secret into a ClientConfig, a prompt or a tool parameter ·
accept a tenant id from a tool-call body.
