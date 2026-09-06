// Golden Agent — n8n webhook booking provider.
//
// Talks to a customer-specific n8n workflow that fronts the customer's real booking system. This
// adapter owns the wire contract; the workflow owns the customer system. Nothing customer-specific
// is hardcoded: the base URL comes from the ClientConfig, the shared secret from a server-side env
// var whose NAME is in the config (the value never leaves the edge function environment).
//
// Wire contract (one endpoint per operation, POST, JSON) — the normative version with payload and
// response schemas per operation is docs/golden-agent-n8n-contract.md:
//   POST {baseUrl}/{operation}
//   headers: Content-Type: application/json,
//            X-Cogniiq-Timestamp: <unix seconds>,
//            X-Cogniiq-Signature: <hex hmac-sha256(secret, `${timestamp}.${rawBody}`)>,
//            X-Cogniiq-Client: <clientId>,
//            X-Cogniiq-Idempotency-Key: <key>   (write operations only)
//   body:    { client_id, conversation_id, idempotency_key?, ...operation payload }
//   response: { ok: true, data: {...}, deduplicated?: boolean } | { ok: false, code: <ToolFailureCode>, message }
//
// Every response is validated structurally before it reaches the agent. A workflow that returns an
// unexpected shape yields `malformed_provider_response`, never a fabricated success.

import { failure, success } from '../toolContracts.ts';
import type {
  CancelAppointmentData, CreateAppointmentData, FindAppointmentData, GetAvailableSlotsData,
  RequestCallbackData, RescheduleAppointmentData, SendConfirmationData, ToolFailureCode, ToolResult,
} from '../toolContracts.ts';
import type {
  AvailabilityQuery, BookingProvider, CallbackRequest, CallerIdentity, CancelRequest,
  ConfirmationRequest, CreateAppointmentRequest, ProviderContext, RescheduleRequest,
} from './bookingProvider.ts';
import { isAppointmentSummary } from './bookingProvider.ts';

export interface N8nProviderDependencies {
  baseUrl: string;
  /** The shared secret value, resolved by the edge function from the env var named in the config. */
  secret: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  /** HMAC implementation; injectable so the adapter is testable without WebCrypto. */
  sign?: (secret: string, body: string) => Promise<string>;
  now?: () => number;
  /**
   * Receives operator-facing explanations of integration failures (wrong secret, missing webhook,
   * malformed response). Deliberately separate from the ToolResult: nothing here may reach the
   * caller, because everything in a tool result becomes context the LLM can speak aloud.
   */
  onDiagnostic?: (message: string) => void;
}

const FAILURE_CODES: ReadonlySet<string> = new Set<ToolFailureCode>([
  'invalid_arguments', 'confirmation_required', 'identity_unverified', 'not_found', 'slot_unavailable',
  'duplicate_booking', 'outside_booking_window', 'policy_violation', 'provider_unavailable', 'provider_timeout',
  'provider_error', 'malformed_provider_response', 'not_supported', 'unknown_tool',
]);

export async function hmacSha256Hex(secret: string, body: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  return [...new Uint8Array(signature)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * The wire uses snake_case throughout, including inside `caller`. The runtime's CallerIdentity is
 * camelCase; translating here keeps the workflow contract consistent instead of asking every
 * customer workflow to handle two spellings. Undefined fields are omitted rather than sent as null,
 * so "not asked" and "asked and empty" stay distinguishable.
 */
function wireCaller(caller: CallerIdentity): Record<string, string> {
  const entries: Array<[string, string | undefined]> = [
    ['first_name', caller.firstName], ['last_name', caller.lastName], ['date_of_birth', caller.dateOfBirth],
    ['phone', caller.phone], ['email', caller.email], ['customer_number', caller.customerNumber],
  ];
  return Object.fromEntries(entries.filter((entry): entry is [string, string] => typeof entry[1] === 'string'));
}

export class N8nBookingProvider implements BookingProvider {
  readonly kind = 'n8n_webhook';
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;
  private readonly sign: (secret: string, body: string) => Promise<string>;
  private readonly now: () => number;

  constructor(private readonly deps: N8nProviderDependencies) {
    this.fetchImpl = deps.fetchImpl ?? fetch;
    this.timeoutMs = deps.timeoutMs ?? 12_000;
    this.sign = deps.sign ?? hmacSha256Hex;
    this.now = deps.now ?? (() => Date.now());
  }

  private diagnose(message: string): void {
    try { this.deps.onDiagnostic?.(message); } catch { /* diagnostics must never break a call */ }
  }

  private async call<T>(ctx: ProviderContext, operation: string, payload: Record<string, unknown>, validate: (data: unknown) => data is T): Promise<ToolResult<T>> {
    const body = JSON.stringify({ client_id: ctx.clientId, conversation_id: ctx.conversationId, ...payload });
    const timestamp = Math.floor(this.now() / 1000).toString();
    // Timestamp is inside the signed payload, so a captured request cannot be replayed later with
    // a fresh timestamp header.
    const signature = await this.sign(this.deps.secret, `${timestamp}.${body}`);
    const idempotencyKey = typeof payload.idempotency_key === 'string' ? payload.idempotency_key : undefined;
    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, this.timeoutMs);
    let response: Response;
    try {
      response = await this.fetchImpl(`${this.deps.baseUrl.replace(/\/$/, '')}/${operation}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Cogniiq-Signature': signature,
          'X-Cogniiq-Timestamp': timestamp,
          'X-Cogniiq-Client': ctx.clientId,
          // Also a header so a workflow can deduplicate before it parses the body.
          ...(idempotencyKey ? { 'X-Cogniiq-Idempotency-Key': idempotencyKey } : {}),
        },
        body,
        signal: controller.signal,
      });
    } catch (error) {
      clearTimeout(timer);
      // A write that timed out MAY have been executed. `provider_timeout` is not retryable as a
      // silent repeat by the agent: the runtime's idempotency key makes a deliberate retry safe,
      // and the caller is offered a callback rather than a second booking attempt.
      const aborted = timedOut || (error instanceof Error && error.name === 'AbortError');
      return aborted
        ? failure('provider_timeout', 'Das Buchungssystem antwortet gerade nicht.', 'offer_callback', { retryable: true })
        : failure('provider_unavailable', 'Das Buchungssystem ist vorübergehend nicht erreichbar.', 'offer_callback', { retryable: true });
    }
    clearTimeout(timer);
    // HTTP-level failures are separated from workflow-level failures. A 401 means our shared secret
    // and the workflow's disagree — an operator problem the caller must never hear about, and one
    // that must never be reported as "no appointment available".
    // The reason goes to the operator diagnostic sink, never into the tool result: everything in
    // the result becomes conversation context the LLM may repeat to the caller.
    if (response.status === 401 || response.status === 403) {
      this.diagnose(`${operation}: n8n rejected the Cogniiq signature (HTTP ${response.status}). The shared secret on both sides does not match.`);
      return failure('provider_unavailable', 'Das Buchungssystem ist derzeit nicht erreichbar.', 'offer_callback', { retryable: false });
    }
    if (response.status === 404 || response.status === 405) {
      this.diagnose(`${operation}: n8n has no webhook for this operation at the configured base URL (HTTP ${response.status}).`);
      return failure('provider_unavailable', 'Das Buchungssystem ist derzeit nicht erreichbar.', 'offer_callback', { retryable: false });
    }
    if (response.status === 408 || response.status === 429) {
      return failure('provider_timeout', 'Das Buchungssystem antwortet gerade nicht.', 'offer_callback', { retryable: true });
    }
    if (response.status >= 500) return failure('provider_error', 'Das Buchungssystem hat einen Fehler gemeldet.', 'escalate', { retryable: response.status === 502 || response.status === 503 || response.status === 504 });
    let parsed: unknown;
    try {
      parsed = await response.json();
    } catch {
      this.diagnose(`${operation}: the n8n response was not valid JSON.`);
      return failure('malformed_provider_response', 'Die Antwort des Buchungssystems war unvollständig.', 'escalate');
    }
    if (!isRecord(parsed) || typeof parsed.ok !== 'boolean') {
      this.diagnose(`${operation}: the n8n response has no boolean "ok" field. Expected { ok, data } or { ok:false, code, message }.`);
      return failure('malformed_provider_response', 'Die Antwort des Buchungssystems war unvollständig.', 'escalate');
    }
    // A 2xx envelope that says ok:true is the ONLY thing that may become a success. Any other
    // status with a well-formed body is still a failure — an n8n "Respond to Webhook" node set to
    // 400 must not be able to confirm a booking.
    if (response.status >= 400 && parsed.ok === true) {
      this.diagnose(`${operation}: n8n answered HTTP ${response.status} with ok:true. A success is only accepted with a 2xx status.`);
      return failure('malformed_provider_response', 'Die Antwort des Buchungssystems war unvollständig.', 'escalate');
    }
    if (parsed.ok === false) {
      const code = typeof parsed.code === 'string' && FAILURE_CODES.has(parsed.code) ? (parsed.code as ToolFailureCode) : 'provider_error';
      const message = typeof parsed.message === 'string' && parsed.message.length <= 200 ? parsed.message : 'Das Buchungssystem konnte die Anfrage nicht ausführen.';
      const nextAction = code === 'slot_unavailable' ? 'offer_alternatives' : code === 'identity_unverified' ? 'verify_identity' : code === 'not_found' ? 'verify_identity' : 'escalate';
      return failure(code, message, nextAction);
    }
    if (!validate(parsed.data)) {
      this.diagnose(`${operation}: the n8n "data" object does not match the documented schema (docs/golden-agent-n8n-contract.md).`);
      return failure('malformed_provider_response', 'Die Antwort des Buchungssystems war unvollständig.', 'escalate');
    }
    return success(parsed.data, parsed.deduplicated === true);
  }

  getAvailableSlots(ctx: ProviderContext, query: AvailabilityQuery) {
    return this.call<GetAvailableSlotsData>(ctx, 'get_available_slots', {
      service_id: query.serviceId, location_id: query.locationId ?? null, from_date: query.fromDate, to_date: query.toDate,
      time_of_day: query.timeOfDay ?? 'any', provider_id: query.providerId ?? null, is_new_caller: query.isNewCaller ?? null,
    }, (data): data is GetAvailableSlotsData => isRecord(data) && Array.isArray(data.slots) && typeof data.none_available === 'boolean'
      && data.slots.every((slot) => isRecord(slot) && typeof slot.slot_id === 'string' && typeof slot.start_time === 'string' && typeof slot.end_time === 'string' && typeof slot.location_id === 'string' && typeof slot.service_id === 'string'));
  }

  createAppointment(ctx: ProviderContext, request: CreateAppointmentRequest) {
    return this.call<CreateAppointmentData>(ctx, 'create_appointment', {
      idempotency_key: request.idempotencyKey, slot_id: request.slotId, service_id: request.serviceId, location_id: request.locationId,
      start_time: request.startTime, caller: wireCaller(request.caller), notes: request.notes ?? null,
    }, (data): data is CreateAppointmentData => isRecord(data) && data.status === 'booked' && isAppointmentSummary(data.appointment));
  }

  findAppointments(ctx: ProviderContext, caller: CallerIdentity, options: { reference?: string; fromDate?: string }) {
    return this.call<FindAppointmentData>(ctx, 'find_appointment', { caller: wireCaller(caller), reference: options.reference ?? null, from_date: options.fromDate ?? null },
      (data): data is FindAppointmentData => isRecord(data) && Array.isArray(data.appointments) && data.appointments.every(isAppointmentSummary) && typeof data.identity_verified === 'boolean');
  }

  rescheduleAppointment(ctx: ProviderContext, request: RescheduleRequest) {
    return this.call<RescheduleAppointmentData>(ctx, 'reschedule_appointment', {
      idempotency_key: request.idempotencyKey, appointment_id: request.appointmentId, new_slot_id: request.newSlotId, new_start_time: request.newStartTime, caller: wireCaller(request.caller),
    }, (data): data is RescheduleAppointmentData => isRecord(data) && data.status === 'rescheduled' && isAppointmentSummary(data.appointment) && typeof data.previous_start_time === 'string');
  }

  cancelAppointment(ctx: ProviderContext, request: CancelRequest) {
    return this.call<CancelAppointmentData>(ctx, 'cancel_appointment', {
      idempotency_key: request.idempotencyKey, appointment_id: request.appointmentId, caller: wireCaller(request.caller), reason: request.reason ?? null,
    }, (data): data is CancelAppointmentData => isRecord(data) && data.status === 'cancelled' && typeof data.appointment_id === 'string' && typeof data.late_cancellation === 'boolean');
  }

  sendConfirmation(ctx: ProviderContext, request: ConfirmationRequest) {
    return this.call<SendConfirmationData>(ctx, 'send_confirmation', {
      idempotency_key: request.idempotencyKey, appointment_id: request.appointmentId, channel: request.channel, destination: request.destination,
    }, (data): data is SendConfirmationData => isRecord(data) && (data.status === 'sent' || data.status === 'queued') && (data.channel === 'sms' || data.channel === 'email'));
  }

  requestCallback(ctx: ProviderContext, request: CallbackRequest) {
    return this.call<RequestCallbackData>(ctx, 'request_callback', {
      idempotency_key: request.idempotencyKey, caller_name: request.callerName, caller_phone: request.callerPhone, topic: request.topic,
      preferred_time: request.preferredTime ?? null, location_id: request.locationId ?? null, urgency: request.urgency,
    }, (data): data is RequestCallbackData => isRecord(data) && data.status === 'recorded' && typeof data.callback_id === 'string' && typeof data.expectation === 'string');
  }
}
