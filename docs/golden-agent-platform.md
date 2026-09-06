# Golden Agent Platform — AI Receptionists

Status: DEV-ready engine, first internal control center. Nothing here is deployed to production by
the repository itself; the migration, the edge functions and their secrets are applied through the
existing manual workflows.

## What it is

One reusable AI receptionist engine that Cogniiq configures per customer instead of rebuilding per
customer. A customer is a `ClientConfig` (company, locations, hours, services, rules, FAQs,
escalation, emergency policy, knowledge sources, booking integration, voice). Everything universal
(conversation rules, tool contracts, safety guards, evaluation) lives once in `src/lib/goldenAgent`.

```
Cogniiq Dashboard (/admin/receptionists)
   → receptionist-admin (edge function, owner-only, holds the ElevenLabs API key)
      → ElevenLabs API (agent, webhook tools, knowledge base, simulation tests)
         → ElevenLabs Agent (voice runtime)
            → receptionist-tools (edge function, bearer-bound tenant, ToolRuntime)
               → BookingProvider adapter (mock today; n8n webhook adapter implemented, needs the customer workflow)
            → receptionist-postcall (edge function, HMAC-verified webhook, call outcomes)
```

Claude is not involved at runtime.

## Modules

| Area | Path | Notes |
| --- | --- | --- |
| Client configuration | `src/lib/goldenAgent/clientConfig.ts` | Typed model, validator, safe defaults, live-stage rules |
| Tool contracts | `src/lib/goldenAgent/toolContracts.ts` | 11 universal tools, schemas, explicit failure codes |
| Tool runtime | `src/lib/goldenAgent/toolRuntime.ts` | Validation, confirmation gates, idempotent writes, config-served tools, events |
| Adapters | `src/lib/goldenAgent/adapters/*` | `BookingProvider` contract, in-memory mock with fault injection, signed n8n webhook adapter |
| Prompt | `src/lib/goldenAgent/prompt.ts` | Universal German-first rules + rendered customer facts |
| Knowledge | `src/lib/goldenAgent/knowledge.ts` | Configured / knowledge-base / tool / escalate / unknown classes, generated documents, onboarding gaps |
| ElevenLabs | `src/lib/goldenAgent/elevenlabs/*` | REST client, config→agent/tool mapping (verified against the live API) |
| Factory | `src/lib/goldenAgent/agentFactory.ts` | `planGoldenAgent` / `applyGoldenAgentPlan` / `createGoldenAgent`, idempotent |
| Evaluation | `src/lib/goldenAgent/evaluation/*` | 181-scenario catalog, per-customer generated suites, 9 scorers, offline reference runner, ElevenLabs simulation compiler |
| Server handlers | `src/lib/goldenAgent/server/*` | Testable logic of the three edge functions |
| Edge functions | `supabase/functions/receptionist-{admin,tools,postcall}` | Thin Deno shells |
| Data | `supabase/migrations/20260905120000_ai_receptionist_platform.sql` | Tenant-scoped tables with RLS; smoke test in `supabase/tests` |
| Dashboard | `src/pages/admin/receptionists/*` | List, create, detail with 8 sections |
| Examples | `src/lib/goldenAgent/examples/*` | Test Clinic fixture; Haema Leipzig DEV config (customer #1 as configuration) |

## Where to look

| Question | Document |
| --- | --- |
| How do I take one customer from nothing to live? | `docs/golden-agent-runbook.md` |
| What must a customer's n8n booking workflow implement? | `docs/golden-agent-n8n-contract.md` |
| What is the system made of? | this file |

## Deployment checklist (manual, in this order)

1. Apply migration `20260905120000_ai_receptionist_platform.sql` via the production migration workflow (dry-run first).
2. Deploy edge functions `receptionist-admin`, `receptionist-tools`, `receptionist-postcall`
   (`supabase/config.toml` already disables JWT verification for the two ElevenLabs-facing functions).
3. Set function secrets: `ELEVENLABS_API_KEY`, `ELEVENLABS_WEBHOOK_SECRET`, optionally `RECEPTIONIST_TOOLS_URL`.
   Per customer n8n integration: the env var named in `bookingIntegration.secretEnvVar`.
4. In ElevenLabs, configure the workspace post-call webhook to `https://<ref>.supabase.co/functions/v1/receptionist-postcall`.
5. Grant the ElevenLabs API key the permissions listed in the runbook, step 6. **Known blocker:**
   `POST /v1/convai/secrets` currently returns 401 — the key needs Workspace Secrets (write) before
   any receptionist can be provisioned.
6. In the dashboard: create receptionist → complete configuration → provision (DEV) → run offline
   suite → create + run simulation tests → review failures. The full sequence is the runbook.
7. Phone numbers are assigned manually in ElevenLabs; the platform never touches them.

## Security notes

- Tenant of a tool call comes only from the hashed bearer token binding; the LLM cannot choose a tenant.
- DEV/staging bindings cannot reach a live receptionist and vice versa.
- Tool tokens are stored as SHA-256 hashes; the ElevenLabs side holds them as workspace secrets. A
  rotation creates the new secret BEFORE it revokes the old binding, so a provider failure can never
  leave a working agent with a credential no secret carries.
- Managed provider resource names are derived from a hash of the whole client id, never a prefix of
  it, so two customers cannot end up sharing a tool in one ElevenLabs workspace.
- Post-call webhooks are verified with the ElevenLabs HMAC signature over `${t}.${body}`, a
  ±30-minute window, a constant-time comparison and a strict signature format. Only agents this
  platform provisioned are stored; deliveries are idempotent across ElevenLabs' retries.
- Call events never store caller arguments or the provider's free-text summary; the summary lives
  only on the retention-bounded call row (`retention_until`).
- Provider errors are classified before they leave the server: no API key, token or raw provider
  payload reaches the browser or `last_sync_error`.
- The ElevenLabs API key exists only in the `receptionist-admin` function environment.

## Provisioning convergence

Provisioning is many round trips against a remote API and can fail at any of them. Three mechanisms
make a retry converge on exactly one logical resource per intended resource, so an operator never
has to clean up the ElevenLabs workspace by hand:

1. **Persisted progress** — every provider id is written to `provider_state` before the next call.
2. **Deterministic managed names** — `reconcileProvisionedState` adopts orphans by name when the
   stored state lost them entirely.
3. **Content fingerprints** — an unchanged knowledge document is left alone, so repeated
   provisioning is a genuine no-op instead of one new document per run.

`src/lib/goldenAgent/server/provisioningRecovery.test.ts` holds this as executable cases.

## Not legal advice

Storing call summaries and provider transcripts involves personal (and potentially health) data.
Retention defaults (7 days DEV, 30 days live) and the recording flags are technical defaults, not a
DSGVO assessment. Processor agreements with ElevenLabs and the n8n host remain owner decisions.
