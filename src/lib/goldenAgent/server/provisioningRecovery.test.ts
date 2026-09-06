// Golden Agent — provisioning failure and recovery.
//
// Every test here answers one question: after this goes wrong, does clicking "Provision" again
// converge on exactly one logical resource per intended resource, or does it leave a mess?
//
// The provider is a fake with scripted failures. Nothing here touches ElevenLabs.

import { beforeEach, describe, expect, it } from 'vitest';

import { handleAdminAction } from './adminHandler.ts';
import type { AdminDependencies, AdminProviderClient } from './adminHandler.ts';
import { countCalls, fakeDb, fakeProvider } from './testFakes.ts';
import type { FakeDb, FakeProvider } from './testFakes.ts';
import { TEST_CLINIC_CLIENT_ID, TOOL_NAMES, testClinicConfig } from '../index.ts';

const TOOLS_URL = 'https://x.supabase.co/functions/v1/receptionist-tools';

async function json(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>;
}

describe('provisioning failure recovery', () => {
  let db: FakeDb;
  let fake: FakeProvider;
  let deps: AdminDependencies;
  let receptionistId: string;

  beforeEach(async () => {
    db = fakeDb();
    fake = fakeProvider();
    deps = { db: db.db, provider: () => fake.provider, toolsEndpointUrl: TOOLS_URL, actorId: 'user_1' };
    const created = await json(await handleAdminAction({ action: 'create', organizationId: TEST_CLINIC_CLIENT_ID, name: 'Praxis Musterstadt' }, deps));
    receptionistId = String(created.receptionistId);
    await handleAdminAction({ action: 'save_config', receptionistId, clientConfig: testClinicConfig({ stage: 'dev' }) }, deps);
  });

  const provision = () => handleAdminAction({ action: 'provision', receptionistId }, deps);

  /* --------------------------------------------------------------- A: workspace secret 401 */

  it('A · a 401 on the workspace secret fails safely, explains the missing permission and leaves a retry possible', async () => {
    fake.failures.push({ method: 'createSecret', status: 401, action: 'create_workspace_secret' });
    const failed = await provision();
    expect(failed.status).toBe(502);
    const body = await json(failed);

    // The operator learns what to change, not which URL returned what.
    expect(String(body.error)).toContain('Workspace Secrets (write)');
    expect(String(body.error)).toContain('ELEVENLABS_API_KEY');
    expect(body.details).toMatchObject({ kind: 'authentication', status: 401, action: 'create_workspace_secret' });

    // Nothing credential-shaped leaves the server, and nothing was created.
    expect(JSON.stringify(body)).not.toMatch(/cqr_/);
    expect(fake.issued.secrets).toHaveLength(0);
    expect(fake.issued.tools).toHaveLength(0);
    expect(db.bindings.filter((b) => b.active)).toHaveLength(0);

    // The failure is persisted for the dashboard, and it is the actionable sentence.
    const row = db.rows.get(receptionistId);
    expect(row?.lastSyncError).toContain('Workspace Secrets (write)');

    // Retry after the permission is granted: one secret, one binding, one agent.
    fake.failures.length = 0;
    const ok = await json(await provision());
    expect(ok.ok).toBe(true);
    expect(fake.issued.secrets).toHaveLength(1);
    expect(fake.issued.agents).toHaveLength(1);
    expect(db.bindings.filter((b) => b.active)).toHaveLength(1);
  });

  it('A2 · the 401 message never contains the API key or the token, whatever the provider echoes back', async () => {
    fake.failures.push({
      method: 'createSecret', status: 401, action: 'create_workspace_secret',
      body: { detail: { message: 'invalid xi-api-key: sk_abcdef0123456789abcdef, token cqr_deadbeefdeadbeef' } },
    });
    const body = await json(await provision());
    const serialised = JSON.stringify(body);
    expect(serialised).not.toContain('sk_abcdef0123456789abcdef');
    expect(serialised).not.toContain('cqr_deadbeefdeadbeef');
    expect(serialised).toContain('[redacted]');
  });

  /* --------------------------------------------------------------- B: failure after N tools */

  it('B · a failure after some tools were created converges on one tool per contract, not two', async () => {
    fake.failures.push({ method: 'createTool', status: 500, action: 'create_tool', onCall: 4 });
    const failed = await provision();
    expect(failed.status).toBe(502);
    expect(fake.issued.tools).toHaveLength(3);

    // The three ids that DID get created were checkpointed, so they are not lost.
    const stored = db.rows.get(receptionistId)?.providerState as { toolIds: Record<string, string> };
    expect(Object.keys(stored.toolIds)).toHaveLength(3);

    fake.failures.length = 0;
    const ok = await json(await provision());
    expect(ok.ok).toBe(true);
    // Exactly one tool per contract in the workspace, and the first three were reused.
    expect(fake.issued.tools).toHaveLength(TOOL_NAMES.length);
    expect(countCalls(fake.log, 'createTool')).toBe(TOOL_NAMES.length + 1); // +1 = the failed call
    expect(countCalls(fake.log, 'updateTool')).toBe(3);
  });

  it('B2 · if the checkpoint itself was lost, the retry adopts the orphaned tools by managed name', async () => {
    fake.failures.push({ method: 'createTool', status: 500, action: 'create_tool', onCall: 4 });
    await provision();
    expect(fake.issued.tools).toHaveLength(3);

    // Simulate the worst case: the process died before any progress reached the database.
    const row = db.rows.get(receptionistId);
    db.rows.set(receptionistId, { ...row!, providerState: {}, providerAgentId: null });

    fake.failures.length = 0;
    const ok = await json(await provision());
    expect(ok.ok).toBe(true);
    expect((ok.warnings as string[]).some((w) => w.includes('Adopted existing provider resources'))).toBe(true);
    expect(fake.issued.tools).toHaveLength(TOOL_NAMES.length);
  });

  /* --------------------------------------------------------------- C: knowledge failure */

  it('C · a knowledge creation failure converges: no duplicate documents after the retry', async () => {
    fake.failures.push({ method: 'createKnowledgeText', status: 503, action: 'create_knowledge', onCall: 2 });
    expect((await provision()).status).toBe(502);
    const afterFailure = fake.issued.documents.length;
    expect(afterFailure).toBe(1);

    fake.failures.length = 0;
    await provision();
    const documentCount = fake.issued.documents.length;

    // A third, fully successful provision must not create a single further document.
    await provision();
    expect(fake.issued.documents).toHaveLength(documentCount);
  });

  /* --------------------------------------------------------------- D: agent creation failure */

  it('D · an agent creation failure reuses the existing tools and documents on the retry', async () => {
    fake.failures.push({ method: 'createAgent', status: 500, action: 'create_agent' });
    expect((await provision()).status).toBe(502);
    const toolsAfterFailure = [...fake.issued.tools];
    const documentsAfterFailure = [...fake.issued.documents];
    expect(toolsAfterFailure).toHaveLength(TOOL_NAMES.length);
    expect(fake.issued.agents).toHaveLength(0);

    fake.failures.length = 0;
    const ok = await json(await provision());
    expect(ok.ok).toBe(true);
    expect(fake.issued.tools).toEqual(toolsAfterFailure);
    expect(fake.issued.documents).toEqual(documentsAfterFailure);
    expect(fake.issued.agents).toHaveLength(1);
    expect(countCalls(fake.log, 'createAgent')).toBe(2); // the failure and the success
  });

  /* --------------------------------------------------------------- E: agent update failure */

  it('E · an agent update failure does not mark the agent as synchronized', async () => {
    await provision();
    const synced = db.rows.get(receptionistId)?.providerState as { appliedFingerprint: string };
    expect(synced.appliedFingerprint).toBeTruthy();

    // Change the configuration so the next run must write a new body, then make that write fail.
    const changed = { ...testClinicConfig({ stage: 'dev' }), companyName: 'Praxis Musterstadt Nord' };
    await handleAdminAction({ action: 'save_config', receptionistId, clientConfig: changed }, deps);
    fake.failures.push({ method: 'updateAgent', status: 500, action: 'update_agent' });
    expect((await provision()).status).toBe(502);

    const afterFailure = db.rows.get(receptionistId);
    // Still the fingerprint of the body that IS live — not the one that failed to be written.
    expect((afterFailure?.providerState as { appliedFingerprint: string }).appliedFingerprint).toBe(synced.appliedFingerprint);
    expect(afterFailure?.lastSyncError).toBeTruthy();

    fake.failures.length = 0;
    const ok = await json(await provision());
    expect(ok.ok).toBe(true);
    expect((ok.updated as string[])).toContain('agent');
    expect(db.rows.get(receptionistId)?.lastSyncError).toBeNull();
  });

  /* --------------------------------------------------------------- F: token rotation */

  it('F · rotation revokes the old binding, keeps exactly one active credential and retires the old secret', async () => {
    await provision();
    const firstHash = db.bindings.find((b) => b.active)?.tokenHash;
    const firstSecret = fake.issued.secrets[0];

    const rotated = await json(await handleAdminAction({ action: 'rotate_token', receptionistId }, deps));
    expect(String(rotated.newToolToken)).toMatch(/^cqr_/);

    const active = db.bindings.filter((b) => b.active);
    expect(active).toHaveLength(1);
    expect(active[0].tokenHash).not.toBe(firstHash);
    // The token is only ever stored as a hash.
    expect(active[0].tokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(db.bindings)).not.toContain(String(rotated.newToolToken));

    // The superseded workspace secret is gone; the new one is in use.
    expect(fake.issued.secrets).toEqual([String(rotated.secretId)]);
    expect(firstSecret).not.toBe(rotated.secretId);
  });

  it('F2 · a rotation whose secret creation fails leaves the previously working binding untouched', async () => {
    await provision();
    const before = db.bindings.filter((b) => b.active).map((b) => b.tokenHash);
    expect(before).toHaveLength(1);

    fake.failures.push({ method: 'createSecret', status: 401, action: 'create_workspace_secret' });
    const failed = await handleAdminAction({ action: 'rotate_token', receptionistId }, deps);
    expect(failed.status).toBe(502);

    // The live agent keeps working: the old credential was never revoked.
    expect(db.bindings.filter((b) => b.active).map((b) => b.tokenHash)).toEqual(before);
  });

  /* --------------------------------------------------------------- G: repeated success */

  it('G · a second and third successful provision create nothing new', async () => {
    await provision();
    const snapshot = {
      tools: [...fake.issued.tools], documents: [...fake.issued.documents],
      agents: [...fake.issued.agents], secrets: [...fake.issued.secrets],
    };
    const knowledgeWritesAfterFirstRun = countCalls(fake.log, 'createKnowledgeText');

    const second = await json(await provision());
    expect(second.created).toEqual([]);
    expect(second.newToolToken).toBeNull();
    const third = await json(await provision());
    expect(third.created).toEqual([]);

    expect(fake.issued).toMatchObject(snapshot);
    // The agent body is unchanged, so it is not rewritten either.
    expect(countCalls(fake.log, 'updateAgent')).toBe(0);
    // Not one further knowledge document is written: the fingerprints say nothing changed.
    expect(countCalls(fake.log, 'createKnowledgeText')).toBe(knowledgeWritesAfterFirstRun);
    expect(countCalls(fake.log, 'deleteKnowledgeDocument')).toBe(0);
  });

  /* --------------------------------------------------------------- H: tenant isolation */

  it('H · a receptionist id from another organization cannot be operated on with a foreign config', async () => {
    // Saving a config whose clientId names a different tenant is refused, so a stored config can
    // never impersonate another organization inside the tool runtime.
    const foreign = { ...testClinicConfig({ stage: 'dev' }), clientId: '00000000-0000-0000-0000-0000000000ff' };
    const rejected = await handleAdminAction({ action: 'save_config', receptionistId, clientConfig: foreign }, deps);
    expect(rejected.status).toBe(422);
    expect(String((await json(rejected)).error)).toContain('clientId');

    // An unknown receptionist id is a 404, never a silent operation on someone else's row.
    const missing = await handleAdminAction({ action: 'provision', receptionistId: 'r-does-not-exist' }, deps);
    expect(missing.status).toBe(404);
  });

  it('H2 · the tool binding is created for the receptionist organization, never for one from the request', async () => {
    await handleAdminAction({ action: 'provision', receptionistId, organizationId: 'attacker-org', clientId: 'attacker-org' }, deps);
    const binding = db.bindings.find((b) => b.active);
    expect(binding?.receptionistId).toBe(receptionistId);
    expect(db.rows.get(receptionistId)?.organizationId).toBe(TEST_CLINIC_CLIENT_ID);
  });
});

describe('simulation test lifecycle', () => {
  let db: FakeDb;
  let fake: FakeProvider;
  let deps: AdminDependencies;
  let receptionistId: string;

  beforeEach(async () => {
    db = fakeDb();
    fake = fakeProvider();
    deps = { db: db.db, provider: () => fake.provider, toolsEndpointUrl: TOOLS_URL, actorId: 'user_1' };
    const created = await json(await handleAdminAction({ action: 'create', organizationId: TEST_CLINIC_CLIENT_ID, name: 'Praxis Musterstadt' }, deps));
    receptionistId = String(created.receptionistId);
    await handleAdminAction({ action: 'save_config', receptionistId, clientConfig: testClinicConfig({ stage: 'dev' }) }, deps);
    await handleAdminAction({ action: 'provision', receptionistId }, deps);
  });

  it('creates the suite before retiring the old one, so a failure leaves no orphans behind', async () => {
    const first = await json(await handleAdminAction({ action: 'create_simulation_tests', receptionistId }, deps));
    const suiteSize = Number(first.tests);
    expect(suiteSize).toBeGreaterThan(0);
    expect(fake.issued.tests).toHaveLength(suiteSize);

    // Second attempt fails partway. The old suite must still exist and the partial new one must be
    // recorded, so the next run can retire both.
    fake.failures.push({ method: 'createTest', status: 500, action: 'create_test', onCall: suiteSize + 3 });
    const failed = await handleAdminAction({ action: 'create_simulation_tests', receptionistId }, deps);
    expect(failed.status).toBe(502);
    expect(fake.issued.tests.length).toBeGreaterThan(suiteSize);

    fake.failures.length = 0;
    const recovered = await json(await handleAdminAction({ action: 'create_simulation_tests', receptionistId }, deps));
    expect(recovered.tests).toBe(suiteSize);
    // Exactly one suite remains in the workspace.
    expect(fake.issued.tests).toHaveLength(suiteSize);
  });

  it('does not open an evaluation run when the provider refuses to start the simulation', async () => {
    await handleAdminAction({ action: 'create_simulation_tests', receptionistId }, deps);
    fake.failures.push({ method: 'runTests', status: 403, action: 'run_tests' });
    const failed = await handleAdminAction({ action: 'run_simulation_tests', receptionistId }, deps);
    expect(failed.status).toBe(502);
    expect(String((await json(failed)).error)).toContain('Tests (write)');
    expect(db.runs).toHaveLength(0);
  });

  it('reports pending results as running and a transcript-less finished run as a failure, never as a pass', async () => {
    await handleAdminAction({ action: 'create_simulation_tests', receptionistId }, deps);
    const tests = (db.rows.get(receptionistId)?.providerState as { simulationTests: Record<string, string> }).simulationTests;
    const [firstScenario, firstTest] = Object.entries(tests)[0];
    const [, secondTest] = Object.entries(tests)[1];

    fake.invocation = { id: 'inv_1', test_runs: [{ test_id: firstTest, status: 'running' }] };
    const started = await json(await handleAdminAction({ action: 'run_simulation_tests', receptionistId }, deps));
    const runId = String(started.runId);

    const polling = await json(await handleAdminAction({ action: 'fetch_simulation_results', receptionistId, runId, invocationId: 'inv_1' }, deps));
    expect(polling.status).toBe('running');
    expect(polling.pending).toBe(1);

    // Finished, but the provider returned no transcript: that is a failed scenario, not a pass.
    fake.invocation = { id: 'inv_1', test_runs: [{ test_id: firstTest, status: 'completed' }, { test_id: secondTest, status: 'completed', agent_responses: [] }] };
    const done = await json(await handleAdminAction({ action: 'fetch_simulation_results', receptionistId, runId, invocationId: 'inv_1' }, deps));
    expect(done.status).toBe('completed');
    expect(done.malformed).toBe(1);
    expect(db.results.some((r) => r.scenarioId === firstScenario)).toBe(true);
    expect((done.summary as { failed: number }).failed).toBeGreaterThan(0);
  });

  it('marks a run failed when nothing in the invocation belongs to this receptionist', async () => {
    await handleAdminAction({ action: 'create_simulation_tests', receptionistId }, deps);
    fake.invocation = { id: 'inv_1', test_runs: [] };
    const started = await json(await handleAdminAction({ action: 'run_simulation_tests', receptionistId }, deps));
    fake.invocation = { id: 'inv_1', test_runs: [{ test_id: 'test_from_another_receptionist', status: 'completed', agent_responses: [] }] };
    const result = await json(await handleAdminAction({ action: 'fetch_simulation_results', receptionistId, runId: String(started.runId), invocationId: 'inv_1' }, deps));
    expect(result.status).toBe('failed');
    expect(result.unmatched).toBe(1);
    expect(db.runs.find((r) => r.id === started.runId)?.status).toBe('failed');
    expect(db.results).toHaveLength(0);
  });

  it('keeps a run "running" when polling itself hits a retryable provider error', async () => {
    await handleAdminAction({ action: 'create_simulation_tests', receptionistId }, deps);
    const started = await json(await handleAdminAction({ action: 'run_simulation_tests', receptionistId }, deps));
    fake.failures.push({ method: 'getTestInvocation', status: 503, action: 'read_test_invocation' });
    const failed = await handleAdminAction({ action: 'fetch_simulation_results', receptionistId, runId: String(started.runId), invocationId: 'inv_1' }, deps);
    expect(failed.status).toBe(502);
    expect(db.runs.find((r) => r.id === started.runId)?.status).toBe('running');
  });
});

describe('the real client satisfies what the handlers require', () => {
  // supabase/functions/* is Deno and is not covered by `tsc -p tsconfig.app.json`, so a signature
  // drift between ElevenLabsClient and AdminProviderClient would only surface at deploy time.
  // The assignment below is a compile-time assertion: if it stops type-checking, the edge function
  // is broken and `npm run typecheck` says so.
  it('ElevenLabsClient is structurally an AdminProviderClient', async () => {
    const { ElevenLabsClient } = await import('../elevenlabs/client.ts');
    const client = new ElevenLabsClient({ apiKey: 'not-a-real-key', fetchImpl: (async () => new Response('{}')) as unknown as typeof fetch });
    const asAdminProvider: AdminProviderClient = client;
    expect(typeof asAdminProvider.createSecret).toBe('function');
    expect(typeof asAdminProvider.deleteSecret).toBe('function');
    expect(typeof asAdminProvider.listTools).toBe('function');
    expect(typeof asAdminProvider.listKnowledgeBase).toBe('function');
    expect(typeof asAdminProvider.listAgents).toBe('function');
  });
});
