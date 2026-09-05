import { describe, expect, it } from 'vitest';

import {
  MockBookingProvider, N8nBookingProvider, ToolRuntime, TOOL_NAMES, TOOL_DEFINITIONS, validateClientConfig, validateToolArguments,
  composeGoldenAgentPrompt, renderUniversalRules, classifyKnowledgeRequest, buildKnowledgeDocuments, findKnowledgeGaps,
  planGoldenAgent, applyGoldenAgentPlan, emptyProvisionedState, buildWebhookToolConfig, buildAgentBody, toolResourceName, universalToolName,
  testClinicConfig, haemaLeipzigDevConfig, createDefaultClientConfig,
  buildScenarioCatalog, SCENARIO_CATEGORIES, runOfflineEvaluation, evaluateTranscript, runReferenceConversation,
  compileSimulationTest, normaliseElevenLabsTranscript, formatWeeklyHoursDe, hoursForDate,
} from './index.ts';
import type { FactoryClient, Transcript } from './index.ts';

const config = testClinicConfig();
const NOW = new Date('2026-09-07T10:00:00+02:00');

function runtimeWith(provider = new MockBookingProvider({ seededAppointments: [] })) {
  const events: unknown[] = [];
  return { runtime: new ToolRuntime(config, { provider, now: () => NOW, onEvent: (e) => { events.push(e); } }), events, provider };
}

describe('client configuration model', () => {
  it('accepts the fixtures and rejects unsafe configs', () => {
    expect(validateClientConfig(config).config).not.toBeNull();
    expect(validateClientConfig(haemaLeipzigDevConfig()).config).not.toBeNull();
    const broken = validateClientConfig({ ...config, confirmation: { ...config.confirmation, readBackBeforeWrite: false }, stage: 'live', bookingIntegration: { provider: 'mock' } });
    expect(broken.config).toBeNull();
    expect(broken.issues.map((i) => i.path)).toEqual(expect.arrayContaining(['confirmation.readBackBeforeWrite', 'bookingIntegration.provider']));
  });

  it('rejects dangling references and malformed hours', () => {
    const result = validateClientConfig({ ...config, locations: [{ ...config.locations[0], serviceIds: ['nope'], hours: { mon: [{ open: '18:00', close: '08:00' }] } }] });
    expect(result.issues.some((i) => i.message.includes('unknown service'))).toBe(true);
    expect(result.issues.some((i) => i.message.includes('open must be before close'))).toBe(true);
  });

  it('creates a safe default skeleton that still needs onboarding', () => {
    const fresh = createDefaultClientConfig({ clientId: '11111111-1111-4111-8111-111111111111', companyName: 'Neu GmbH' });
    expect(validateClientConfig(fresh).config).toBeNull();
    expect(findKnowledgeGaps(fresh).some((g) => g.severity === 'blocker')).toBe(true);
  });
});

describe('opening hours', () => {
  it('resolves weekdays, closures and formatting', () => {
    const zentrum = config.locations[0];
    expect(hoursForDate(zentrum, '2026-09-11').ranges[0]).toEqual({ open: '08:00', close: '14:00' });
    expect(hoursForDate(zentrum, '2026-10-03').open).toBe(false);
    expect(hoursForDate(zentrum, '2026-09-12').open).toBe(false);
    expect(formatWeeklyHoursDe(zentrum)).toContain('Mo–Di 08:00–18:00 Uhr');
  });
});

describe('tool contracts and runtime guards', () => {
  it('validates arguments strictly and rejects unknown parameters', () => {
    const ok = validateToolArguments('get_available_slots', { service_id: 'labor', from_date: '2026-09-08' });
    expect(ok.issues).toEqual([]);
    const bad = validateToolArguments('get_available_slots', { service_id: 'Labor!', from_date: '08.09.2026', made_up: 1 });
    expect(bad.issues.map((i) => i.param).sort()).toEqual(['from_date', 'made_up', 'service_id']);
  });

  it('every tool definition has a description free of customer facts', () => {
    for (const name of TOOL_NAMES) {
      expect(TOOL_DEFINITIONS[name].description).not.toMatch(/musterstadt|haema|leipzig/i);
    }
  });

  it('refuses writes without explicit confirmation', async () => {
    const { runtime } = runtimeWith();
    const result = await runtime.execute({ conversationId: 'c1', tool: 'create_appointment', arguments: { slot_id: 'x', service_id: 'labor', location_id: 'zentrum', start_time: '2026-09-08T09:00', caller_confirmed: false } });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('confirmation_required');
  });

  it('rejects unknown tools and reports an event', async () => {
    const { runtime, events } = runtimeWith();
    const result = await runtime.execute({ conversationId: 'c1', tool: 'delete_everything', arguments: {} });
    expect(result.ok).toBe(false);
    expect(events).toHaveLength(1);
    expect((events[0] as { failureCode: string }).failureCode).toBe('unknown_tool');
  });

  it('books only offered slots, collapses retries and blocks duplicates', async () => {
    const { runtime, provider } = runtimeWith();
    const slots = await runtime.execute({ conversationId: 'c2', tool: 'get_available_slots', arguments: { service_id: 'erstgespraech', location_id: 'zentrum', from_date: '2026-09-08', to_date: '2026-09-08' } });
    expect(slots.ok).toBe(true);
    const first = (slots as { data: { slots: Array<{ slot_id: string; start_time: string }> } }).data.slots[0];
    const caller = { caller_first_name: 'Ben', caller_last_name: 'Keller', caller_date_of_birth: '1992-11-02', caller_phone: '+4917612345679' };
    const args = { slot_id: first.slot_id, service_id: 'erstgespraech', location_id: 'zentrum', start_time: first.start_time, caller_confirmed: true, ...caller };
    const booked = await runtime.execute({ conversationId: 'c2', tool: 'create_appointment', arguments: args });
    expect(booked.ok).toBe(true);
    const retried = await runtime.execute({ conversationId: 'c2', tool: 'create_appointment', arguments: { ...args, notes: 'rephrased' } });
    expect(retried.ok && retried.deduplicated).toBe(true);
    expect(provider.inspect().appointments).toHaveLength(1);
    const other = await runtime.execute({ conversationId: 'c3', tool: 'create_appointment', arguments: { ...args, slot_id: first.slot_id.replace('T', 'T'), start_time: first.start_time } });
    expect(other.ok).toBe(false);
    if (!other.ok) expect(['slot_unavailable', 'duplicate_booking']).toContain(other.code);
  });

  it('never discloses appointments without the configured identity fields', async () => {
    const provider = new MockBookingProvider({ seededAppointments: [{ appointment_id: 'a1', reference: 'T-1', start_time: '2026-09-10T09:30', end_time: '2026-09-10T09:45', location_id: 'zentrum', service_id: 'labor', status: 'booked', caller: { firstName: 'Anna', lastName: 'Schmidt', dateOfBirth: '1985-03-12', phone: '+4915112345678' } }] });
    const { runtime } = runtimeWith(provider);
    const byPhoneOnly = await runtime.execute({ conversationId: 'c4', tool: 'find_appointment', arguments: { caller_phone: '+4915112345678' } });
    expect(byPhoneOnly.ok).toBe(false);
    const wrongPerson = await runtime.execute({ conversationId: 'c4', tool: 'find_appointment', arguments: { caller_last_name: 'Wagner', caller_date_of_birth: '1970-07-01' } });
    expect(wrongPerson.ok && (wrongPerson.data as { appointments: unknown[] }).appointments).toEqual([]);
    const right = await runtime.execute({ conversationId: 'c4', tool: 'find_appointment', arguments: { caller_last_name: 'Schmidt', caller_date_of_birth: '1985-03-12' } });
    expect(right.ok && (right.data as { appointments: Array<{ appointment_id: string }> }).appointments.map((a) => a.appointment_id)).toEqual(['a1']);
  });

  it('serves opening hours, service info and escalation from configuration', async () => {
    const { runtime } = runtimeWith();
    const hours = await runtime.execute({ conversationId: 'c5', tool: 'get_opening_hours', arguments: { location_id: 'zentrum', date: '2026-10-03' } });
    expect(hours.ok && (hours.data as { locations: Array<{ open: boolean }> }).locations[0].open).toBe(false);
    const escalation = await runtime.execute({ conversationId: 'c5', tool: 'escalate_to_human', arguments: { reason: 'caller_request', summary: 'will Mitarbeiter' } });
    expect(escalation.ok && (escalation.data as { action: string }).action).toBe('transfer');
    const info = await runtime.execute({ conversationId: 'c5', tool: 'get_service_information', arguments: { service_id: 'op-beratung' } });
    expect(info.ok && (info.data as { services: Array<{ bookable: boolean }> }).services[0].bookable).toBe(false);
  });

  it('surfaces provider faults as explicit failure states', async () => {
    const provider = new MockBookingProvider({ faults: { getAvailableSlots: ['timeout', 'malformed'] } });
    const { runtime } = runtimeWith(provider);
    const args = { service_id: 'labor', location_id: 'zentrum', from_date: '2026-09-08' };
    const first = await runtime.execute({ conversationId: 'c6', tool: 'get_available_slots', arguments: args });
    const second = await runtime.execute({ conversationId: 'c6', tool: 'get_available_slots', arguments: args });
    expect(!first.ok && first.code).toBe('provider_timeout');
    expect(!first.ok && first.retryable).toBe(true);
    expect(!second.ok && second.code).toBe('malformed_provider_response');
  });
});

describe('n8n booking provider wire contract', () => {
  it('signs requests, validates responses and never invents success', async () => {
    const calls: Array<{ url: string; headers: Record<string, string>; body: string }> = [];
    const responses = [
      new Response(JSON.stringify({ ok: true, data: { status: 'booked', appointment: { appointment_id: 'x1', start_time: '2026-09-08T09:00', end_time: '2026-09-08T09:30', location_id: 'zentrum', service_id: 'erstgespraech', status: 'booked' } } }), { status: 200 }),
      new Response(JSON.stringify({ ok: true, data: { status: 'booked' } }), { status: 200 }),
      new Response('not json', { status: 200 }),
      new Response(JSON.stringify({ ok: false, code: 'slot_unavailable', message: 'weg' }), { status: 200 }),
      new Response('', { status: 503 }),
    ];
    const provider = new N8nBookingProvider({
      baseUrl: 'https://n8n.example/webhook/clinic', secret: 's3cret',
      fetchImpl: async (url, init) => { calls.push({ url: String(url), headers: init?.headers as Record<string, string>, body: String(init?.body) }); return responses.shift()!; },
      sign: async (secret, body) => `sig:${secret.length}:${body.length}`,
      now: () => 1_700_000_000_000,
    });
    const ctx = { clientId: config.clientId, config, conversationId: 'conv', now: '2026-09-07T10:00' };
    const request = { idempotencyKey: 'k1', slotId: 'zentrum|erstgespraech|2026-09-08T09:00', serviceId: 'erstgespraech', locationId: 'zentrum', startTime: '2026-09-08T09:00', caller: { firstName: 'Ben', lastName: 'Keller' } };
    const ok = await provider.createAppointment(ctx, request);
    expect(ok.ok).toBe(true);
    expect(calls[0].url).toBe('https://n8n.example/webhook/clinic/create_appointment');
    expect(calls[0].headers['X-Cogniiq-Signature']).toMatch(/^sig:6:/);
    expect(calls[0].headers['X-Cogniiq-Client']).toBe(config.clientId);
    expect(JSON.parse(calls[0].body).idempotency_key).toBe('k1');
    const partial = await provider.createAppointment(ctx, request);
    expect(!partial.ok && partial.code).toBe('malformed_provider_response');
    const garbage = await provider.createAppointment(ctx, request);
    expect(!garbage.ok && garbage.code).toBe('malformed_provider_response');
    const declined = await provider.createAppointment(ctx, request);
    expect(!declined.ok && declined.code).toBe('slot_unavailable');
    const down = await provider.createAppointment(ctx, request);
    expect(!down.ok && down.code).toBe('provider_error');
  });
});

describe('prompt composer and knowledge', () => {
  it('keeps universal rules free of customer facts and renders facts separately', () => {
    const universal = renderUniversalRules(config).join('\n');
    expect(universal).not.toMatch(/Hauptstraße|Nordring|Parkhaus|Dr\. Müller/);
    const composed = composeGoldenAgentPrompt(config);
    expect(composed.systemPrompt).toContain('# KUNDENSPEZIFISCHE ANGABEN');
    expect(composed.systemPrompt).toContain('Hauptstraße 1');
    expect(composed.systemPrompt).not.toContain('+4930123456');
    expect(composed.firstMessage).toContain('Praxis Musterstadt');
    for (const name of TOOL_NAMES) expect(composed.systemPrompt).toContain(`- ${name}:`);
  });

  it('the Haema config composes without any Haema fact leaking into universal rules', () => {
    const haema = haemaLeipzigDevConfig();
    // Universal rules are parameterised by a few config slots (company name, emergency message,
    // rules) but never by locations, services or FAQs — those only appear in the facts section.
    expect(renderUniversalRules(haema).join('\n')).not.toMatch(/Gohlis|Connewitz|Markt 9|Thrombozyten|25 Euro|Lützowstraße/);
    expect(composeGoldenAgentPrompt(haema).systemPrompt).toContain('Leipzig-Connewitz');
  });

  it('classifies knowledge requests by source', () => {
    expect(classifyKnowledgeRequest(config, 'Wo kann ich bei Ihnen parken?').class).toBe('configured');
    expect(classifyKnowledgeRequest(config, 'Haben Sie morgen früh noch was frei?').class).toBe('tool_required');
    expect(classifyKnowledgeRequest(config, 'Darf ich mit Antibiotika kommen?').class).toBe('must_escalate');
    expect(classifyKnowledgeRequest(config, 'Was steht in meinem Befund?').class).toBe('must_escalate');
    expect(classifyKnowledgeRequest({ ...config, knowledgeSources: [] }, 'Gibt es bei Ihnen eine Rabattaktion für Neupatienten?').class).toBe('unknown');
    expect(buildKnowledgeDocuments(config).map((d) => d.key)).toEqual(['locations', 'services', 'faq']);
  });
});

describe('ElevenLabs mapping and factory', () => {
  it('maps tool contracts to webhook tools with server-bound authorization', () => {
    const tool = buildWebhookToolConfig(config, 'create_appointment', { endpointUrl: 'https://x.supabase.co/functions/v1/receptionist-tools', authorization: { secret_id: 'sec_1' } });
    expect(tool.name).toBe(toolResourceName(config, 'create_appointment'));
    expect(universalToolName(String(tool.name))).toBe('create_appointment');
    const schema = tool.api_schema as { url: string; request_headers: Record<string, unknown>; request_body_schema: { required: string[] } };
    expect(schema.url).toBe('https://x.supabase.co/functions/v1/receptionist-tools/create_appointment');
    expect(schema.request_headers.Authorization).toEqual({ secret_id: 'sec_1' });
    expect(schema.request_body_schema.required).toContain('caller_confirmed');
    expect(tool.interruption_mode).toBe('disable_during_tool');
  });

  it('builds a live-safe agent body', () => {
    const prompt = composeGoldenAgentPrompt(config);
    const body = buildAgentBody({ config: { ...config, stage: 'live' }, prompt, toolIds: ['t1'], knowledgeBase: [], stage: 'live' }) as { platform_settings: { privacy: { record_voice: boolean }; auth: { enable_auth: boolean } }; conversation_config: { agent: { language: string } } };
    expect(body.platform_settings.privacy.record_voice).toBe(false);
    expect(body.platform_settings.auth.enable_auth).toBe(true);
    expect(body.conversation_config.agent.language).toBe('de');
  });

  it('plans and applies idempotently through a fake client', async () => {
    const created: string[] = [];
    let counter = 0;
    const client: FactoryClient = {
      createTool: async (cfg) => { created.push(`tool:${cfg.name}`); return { id: `tool_${++counter}` }; },
      updateTool: async (id) => ({ id }),
      createKnowledgeText: async (name) => { created.push(`kb:${name}`); return { id: `doc_${++counter}` }; },
      deleteKnowledgeDocument: async () => ({}),
      createKnowledgeUrl: async (name) => { created.push(`url:${name}`); return { id: `doc_${++counter}` }; },
      createAgent: async () => { created.push('agent'); return { agent_id: 'agent_1' }; },
      updateAgent: async () => { created.push('agent-update'); return {}; },
      getAgent: async () => ({ agent_id: 'agent_1', conversation_config: {} }),
    };
    const input = { config, state: emptyProvisionedState(), toolTarget: { endpointUrl: 'https://x.supabase.co/functions/v1/receptionist-tools', authorization: { bearer: 'dev' } as const } };
    const plan = planGoldenAgent(input);
    expect(plan.steps.filter((s) => s.kind === 'create_tool')).toHaveLength(TOOL_NAMES.length);
    const first = await applyGoldenAgentPlan(client, input, plan, { fingerprint: (s) => String(s.length) });
    expect(first.agentId).toBe('agent_1');
    expect(Object.keys(first.state.toolIds)).toHaveLength(TOOL_NAMES.length);
    expect(created.filter((c) => c === 'agent')).toHaveLength(1);
    const second = await applyGoldenAgentPlan(client, { ...input, state: first.state }, planGoldenAgent({ ...input, state: first.state }), { fingerprint: (s) => String(s.length) });
    expect(second.created.filter((c) => c.startsWith('tool:'))).toHaveLength(0);
    expect(created.filter((c) => c === 'agent')).toHaveLength(1);
    expect(second.updated).toContain('tool:create_appointment');
    await expect(applyGoldenAgentPlan(client, { ...input, config: { ...config, stage: 'live' }, state: first.state }, plan)).rejects.toThrow(/live/);
  });
});

describe('evaluation framework', () => {
  const catalog = buildScenarioCatalog();

  it('covers every category with at least 150 scenarios and stable ids', () => {
    expect(catalog.length).toBeGreaterThanOrEqual(150);
    const ids = new Set(catalog.map((s) => s.id));
    expect(ids.size).toBe(catalog.length);
    for (const category of SCENARIO_CATEGORIES) expect(catalog.some((s) => s.category === category), category).toBe(true);
  });

  it('the reference conversations pass every scenario through the real runtime', async () => {
    const { summary } = await runOfflineEvaluation(config);
    expect(summary.total).toBe(catalog.length);
    expect(summary.failures).toEqual([]);
  }, 60_000);

  it('scorers catch a claimed booking that never happened', async () => {
    const scenario = catalog.find((s) => s.category === 'booking_simple')!;
    const { transcript } = await runReferenceConversation(config, scenario);
    const mutated: Transcript = { ...transcript, turns: transcript.turns.map((turn) => ({ ...turn, toolCalls: turn.toolCalls?.filter((c) => c.name !== 'create_appointment'), toolResults: turn.toolResults?.filter((r) => r.name !== 'create_appointment') })) };
    const result = evaluateTranscript(scenario, mutated);
    expect(result.passed).toBe(false);
    expect(result.findings.map((f) => f.dimension)).toEqual(expect.arrayContaining(['hallucination', 'task_completion']));
  });

  it('scorers catch a write without confirmation and a disclosed third-party fact', async () => {
    const cancel = catalog.find((s) => s.category === 'cancel')!;
    const { transcript } = await runReferenceConversation(config, cancel);
    const noReadback: Transcript = { ...transcript, turns: transcript.turns.map((turn) => (turn.role === 'agent' ? { ...turn, text: turn.text.replace(/richtig\?|wirklich absagen\?/gi, '') } : turn)) };
    expect(evaluateTranscript(cancel, noReadback).scores.find((s) => s.dimension === 'confirmation_correctness')?.passed).toBe(false);

    const privacy = catalog.find((s) => s.category === 'privacy_attack')!;
    const leak = await runReferenceConversation(config, privacy);
    const leaked: Transcript = { ...leak.transcript, turns: [...leak.transcript.turns, { role: 'agent', text: 'Sein Termin ist am 11. September um 14:00 in Nord.' }] };
    expect(evaluateTranscript(privacy, leaked).scores.find((s) => s.dimension === 'privacy')?.passed).toBe(false);
  });

  it('compiles scenarios into ElevenLabs simulation tests and normalises transcripts back', () => {
    const scenario = catalog.find((s) => s.category === 'tool_error')!;
    const test = compileSimulationTest(config, scenario, { get_available_slots: 'tool_a', create_appointment: 'tool_b', request_callback: 'tool_c' }) as { type: string; success_conditions: string[]; tool_mock_overrides: Record<string, unknown[]> };
    expect(test.type).toBe('simulation');
    expect(test.success_conditions.length).toBeGreaterThan(2);
    expect(Object.keys(test.tool_mock_overrides)).toEqual(expect.arrayContaining(['tool_a', 'tool_b', 'tool_c']));
    const transcript = normaliseElevenLabsTranscript('conv_1', [
      { role: 'agent', message: 'Guten Tag', time_in_call_secs: 0 },
      { role: 'user', message: 'Termin bitte', time_in_call_secs: 3 },
      { role: 'agent', message: 'Einen Moment', tool_calls: [{ tool_name: toolResourceName(config, 'get_available_slots'), params_as_json: '{"service_id":"labor","from_date":"2026-09-08"}' }], tool_results: [{ tool_name: toolResourceName(config, 'get_available_slots'), result_value: '{"ok":true,"data":{"slots":[],"none_available":true}}', is_error: false }] },
    ]);
    expect(transcript.turns[2].toolCalls?.[0].name).toBe('get_available_slots');
    expect(transcript.turns[2].toolResults?.[0].ok).toBe(true);
  });
});
