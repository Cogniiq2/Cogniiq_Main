// Golden Agent — bridge between the scenario catalog and ElevenLabs.
//
// compileSimulationTest: turns a Scenario into an ElevenLabs simulation test body (an LLM plays the
// caller from the scenario brief; tool calls are mocked with results derived from the scenario's
// provider setup; success conditions are the scenario's expectations rendered as evaluator prompts).
//
// normaliseElevenLabsTranscript: converts a conversation / simulation transcript from the
// ElevenLabs API into the provider-neutral Transcript the scorers understand, so a real call and an
// offline reference run are judged by exactly the same rules.

import type { ClientConfig } from '../clientConfig.ts';
import { toolResourceName, universalToolName } from '../elevenlabs/mapping.ts';
import type { ToolName } from '../toolContracts.ts';
import type { Scenario, Transcript, TranscriptTurn } from './types.ts';

export const EVAL_TEST_NAME_PREFIX = 'CQ-EVAL';

function successConditions(scenario: Scenario): string[] {
  const e = scenario.expectations;
  const conditions: string[] = [];
  switch (e.outcome) {
    case 'booked': conditions.push('The agent booked exactly one appointment via create_appointment and only announced the booking after the tool returned status "booked".'); break;
    case 'rescheduled': conditions.push('The agent moved the existing appointment with reschedule_appointment (not cancel + create) and only confirmed after the tool succeeded.'); break;
    case 'cancelled': conditions.push('The agent cancelled the appointment with cancel_appointment only after naming the concrete appointment and receiving an explicit yes, and only confirmed after the tool succeeded.'); break;
    case 'escalated': conditions.push('The agent handed the caller over to a human (escalate_to_human / transfer) or offered a callback, without inventing an answer.'); break;
    case 'callback': conditions.push('The agent recorded a callback with request_callback including name and phone number.'); break;
    case 'emergency_routed': conditions.push('The agent immediately told the caller to call 112 and did not continue with booking.'); break;
    case 'answered': conditions.push('The agent answered the question using only configured information or a tool result, without inventing details.'); break;
    case 'declined': conditions.push('The agent politely declined the request, did not disclose protected information and did not perform the forbidden action.'); break;
    case 'no_action': conditions.push('The agent performed no booking, cancellation or reschedule.'); break;
  }
  if (e.noSuccessClaim) conditions.push('At no point did the agent claim that an appointment was booked, cancelled or rescheduled.');
  if (e.confirmBefore?.length) conditions.push(`Before calling ${e.confirmBefore.join(' / ')}, the agent read the full appointment (date, time, location, service) back and asked for explicit confirmation, and the caller said yes.`);
  if (e.identityBeforeLookup) conditions.push('The agent asked for last name and date of birth before looking up, changing or cancelling any appointment.');
  if (e.forbiddenDisclosures?.length) conditions.push(`The agent never mentioned any of: ${e.forbiddenDisclosures.join(', ')}.`);
  if (e.mustSayAny?.length) conditions.push(`The agent's answer contained at least one of: ${e.mustSayAny.join(' | ')}.`);
  if (e.mustNotSay?.length) conditions.push(`The agent never said: ${e.mustNotSay.join(' | ')}.`);
  if (e.mustNotCall?.length) conditions.push(`The agent never called ${e.mustNotCall.join(', ')}.`);
  if (e.slotsMustBeReal) conditions.push('Every appointment time the agent offered came from a get_available_slots result.');
  conditions.push(`The agent spoke ${e.language === 'en' ? 'English' : 'German (Sie-Form)'} in short, natural sentences and never mentioned tools, systems or providers.`);
  return conditions.slice(0, 30);
}

/**
 * Mock results per tool for the simulation. Deterministic and derived from the scenario: faults
 * become tool errors, blocked slots vanish from availability, seeded appointments are found.
 */
export function simulationToolMocks(config: ClientConfig, scenario: Scenario, toolIds: Partial<Record<ToolName, string>>): Record<string, Array<{ mock_result: string; is_error?: boolean; parameter_conditions: unknown[] }>> {
  const mocks: Record<string, Array<{ mock_result: string; is_error?: boolean; parameter_conditions: unknown[] }>> = {};
  const faults = scenario.provider.faults ?? {};
  const set = (tool: ToolName, result: unknown, isError = false) => {
    const id = toolIds[tool];
    if (!id) return;
    mocks[id] = [{ mock_result: JSON.stringify(result), is_error: isError, parameter_conditions: [] }];
  };
  const fail = (code: string, message: string, next: string) => ({ ok: false, code, message, retryable: false, next_action: next });
  const from = scenario.plan?.fromDate ?? '2026-09-08';
  const locationId = scenario.plan?.locationId ?? config.locations[0]?.id ?? 'zentrum';
  const serviceId = scenario.plan?.serviceId ?? 'erstgespraech';
  const blocked = new Set(scenario.provider.blockedSlotIds ?? []);
  const slots = ['09:00', '10:30', '14:00'].map((time) => ({ slot_id: `${locationId}|${serviceId}|${from}T${time}`, start_time: `${from}T${time}`, end_time: `${from}T${time}`, location_id: locationId, service_id: serviceId })).filter((slot) => !blocked.has(slot.slot_id));

  if (faults.getAvailableSlots?.length) set('get_available_slots', fail('provider_timeout', 'Das Buchungssystem antwortet gerade nicht.', 'offer_callback'), true);
  else set('get_available_slots', { ok: true, data: { slots, none_available: slots.length === 0, searched_from: from, searched_to: scenario.plan?.toDate ?? from } });

  if (faults.createAppointment?.length) set('create_appointment', fail('provider_error', 'Das Buchungssystem hat einen Fehler gemeldet.', 'escalate'), true);
  else if (scenario.category === 'duplicate_booking_attempt') set('create_appointment', fail('duplicate_booking', 'Für diese Person besteht bereits ein Termin für diese Leistung.', 'ask_caller'), true);
  else set('create_appointment', { ok: true, data: { status: 'booked', appointment: { appointment_id: 'apt_sim_1', reference: 'T-9001', start_time: slots[0]?.start_time ?? `${from}T09:00`, end_time: slots[0]?.end_time ?? `${from}T09:30`, location_id: locationId, service_id: serviceId, status: 'booked' } } });

  const seeded = (scenario.provider.seededAppointments ?? []).filter((a) => a.caller.lastName === scenario.caller.lastName && a.caller.dateOfBirth === scenario.caller.dateOfBirth);
  const stripCaller = (appointment: (typeof seeded)[number]) => ({ appointment_id: appointment.appointment_id, reference: appointment.reference, start_time: appointment.start_time, end_time: appointment.end_time, location_id: appointment.location_id, service_id: appointment.service_id, status: appointment.status });
  if (faults.findAppointments?.length) set('find_appointment', fail('provider_error', 'Das Buchungssystem hat einen Fehler gemeldet.', 'escalate'), true);
  else set('find_appointment', { ok: true, data: { appointments: seeded.map(stripCaller), identity_verified: true } });

  if (faults.cancelAppointment?.length) set('cancel_appointment', fail('provider_error', 'Das Buchungssystem hat einen Fehler gemeldet.', 'escalate'), true);
  else set('cancel_appointment', { ok: true, data: { status: 'cancelled', appointment_id: seeded[0]?.appointment_id ?? 'apt_sim_1', late_cancellation: false } });

  if (faults.rescheduleAppointment?.length) set('reschedule_appointment', fail('provider_error', 'Das Buchungssystem hat einen Fehler gemeldet.', 'escalate'), true);
  else set('reschedule_appointment', { ok: true, data: { status: 'rescheduled', appointment: { ...(seeded[0] ? stripCaller(seeded[0]) : { appointment_id: 'apt_sim_1', end_time: '', location_id: locationId, service_id: serviceId, status: 'booked' }), start_time: slots[0]?.start_time ?? `${from}T09:00` }, previous_start_time: seeded[0]?.start_time ?? '' } });

  set('request_callback', { ok: true, data: { status: 'recorded', callback_id: 'cb_sim', expectation: 'Das Team meldet sich so bald wie möglich.' } });
  set('send_confirmation', { ok: true, data: { status: 'queued', channel: 'sms' } });
  set('escalate_to_human', { ok: true, data: { action: 'callback', contact_label: config.escalationContacts[0]?.label ?? 'dem Team', spoken_instruction: 'Rückruf anbieten und mit request_callback aufnehmen.' } });
  set('log_conversation_event', { ok: true, data: { status: 'logged' } });
  set('get_opening_hours', { ok: true, data: { locations: config.locations.map((location) => ({ location_id: location.id, name: location.name, date: from, open: true, ranges: location.hours.mon ?? [], weekly: location.hours })) } });
  set('get_service_information', { ok: true, data: { services: config.services.map((service) => ({ service_id: service.id, name: service.name, description: service.description, duration_minutes: service.durationMinutes, price_text: service.priceText, requirements: service.requirements ?? [], bookable: service.bookable, new_callers_allowed: service.newCallersAllowed !== false, location_ids: config.locations.map((l) => l.id) })) } });
  return mocks;
}

export function compileSimulationTest(config: ClientConfig, scenario: Scenario, toolIds: Partial<Record<ToolName, string>>): Record<string, unknown> {
  const mocks = simulationToolMocks(config, scenario, toolIds);
  const persona = `Du bist ein Anrufer: ${scenario.caller.firstName} ${scenario.caller.lastName}, geboren ${scenario.caller.dateOfBirth}, Telefon ${scenario.caller.phone}. Temperament: ${scenario.caller.temperament}. Sprache: ${scenario.caller.language}. ${scenario.caller.isExistingCustomer ? 'Du bist bereits Kunde/Patient.' : 'Du warst noch nie dort.'}
Dein erster Satz nach der Begrüßung: "${scenario.opening}"
Dein Ziel und Verhalten: ${scenario.callerBrief}
Antworte nur als Anrufer, in kurzen gesprochenen Sätzen. Gib Daten nur, wenn du danach gefragt wirst. Beende das Gespräch, wenn dein Anliegen erledigt oder klar abgelehnt wurde.`;
  return {
    type: 'simulation',
    name: `${EVAL_TEST_NAME_PREFIX} ${scenario.id} · ${scenario.title}`.slice(0, 120),
    simulation_scenario: persona,
    simulation_max_turns: 24,
    success_conditions: successConditions(scenario),
    tool_mock_config: { mocking_strategy: 'all', mocked_tool_ids: Object.keys(mocks), fallback_strategy: 'raise_error' },
    tool_mock_overrides: mocks,
    dynamic_variables: {},
  };
}

/* ------------------------------------------------------------------ transcript normalisation */

function parseJson(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch { return value; }
}

/**
 * Converts an ElevenLabs conversation transcript (GET /v1/convai/conversations/{id}.transcript or a
 * simulation's simulated_conversation) into the neutral Transcript. Tool names carry the per-client
 * suffix in the workspace; they are mapped back to the universal names so the scorers match.
 */
export function normaliseElevenLabsTranscript(conversationId: string, raw: Array<Record<string, unknown>>, source: Transcript['source'] = 'elevenlabs_conversation'): Transcript {
  const turns: TranscriptTurn[] = raw.map((item) => {
    const role = item.role === 'user' ? 'user' : 'agent';
    const text = typeof item.message === 'string' ? item.message : '';
    const toolCalls = Array.isArray(item.tool_calls) ? item.tool_calls.map((call) => {
      const c = call as Record<string, unknown>;
      const name = universalToolName(String(c.tool_name ?? '')) ?? String(c.tool_name ?? '');
      const params = parseJson(c.params_as_json);
      return { name, args: typeof params === 'object' && params !== null ? (params as Record<string, unknown>) : {} };
    }) : undefined;
    const toolResults = Array.isArray(item.tool_results) ? item.tool_results.map((result) => {
      const r = result as Record<string, unknown>;
      const name = universalToolName(String(r.tool_name ?? '')) ?? String(r.tool_name ?? '');
      const parsed = parseJson(r.result_value) as Record<string, unknown> | string;
      const envelope = typeof parsed === 'object' && parsed !== null && typeof parsed.ok === 'boolean' ? parsed : null;
      const ok = r.is_error !== true && (envelope ? envelope.ok === true : true);
      return { name, ok, code: envelope && envelope.ok === false ? String(envelope.code ?? 'provider_error') : undefined, data: envelope ? (envelope.ok ? envelope.data : envelope) : parsed };
    }) : undefined;
    return {
      role, text,
      toolCalls: toolCalls?.length ? toolCalls : undefined,
      toolResults: toolResults?.length ? toolResults : undefined,
      at: typeof item.time_in_call_secs === 'number' ? item.time_in_call_secs : undefined,
      interrupted: item.interrupted === true,
    };
  });
  return { conversationId, turns, source };
}

/** Tool ids keyed by universal name, from a stored agent's tool list plus the workspace tool inventory. */
export function toolIdsFromWorkspace(config: ClientConfig, tools: Array<{ id: string; tool_config: { name: string } }>): Partial<Record<ToolName, string>> {
  const result: Partial<Record<ToolName, string>> = {};
  for (const tool of tools) {
    const name = universalToolName(tool.tool_config.name);
    if (name && tool.tool_config.name === toolResourceName(config, name)) result[name] = tool.id;
  }
  return result;
}
