// Golden Agent — n8n webhook booking provider.
//
// Talks to a customer-specific n8n workflow that fronts the customer's real booking system. This
// adapter owns the wire contract; the workflow owns the customer system. Nothing customer-specific
// is hardcoded: the base URL comes from the ClientConfig, the shared secret from a server-side env
// var whose NAME is in the config (the value never leaves the edge function environment).
//
// Wire contract (one endpoint per operation, POST, JSON):
//   POST {baseUrl}/{operation}
//   headers: Content-Type: application/json, X-Cogniiq-Signature: <hex hmac-sha256(secret, body)>,
//            X-Cogniiq-Timestamp: <unix seconds>, X-Cogniiq-Client: <clientId>
//   body:    { client_id, conversation_id, idempotency_key?, ...operation payload }
//   response: { ok: true, data: {...} } | { ok: false, code: <ToolFailureCode>, message }
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

  private async call<T>(ctx: ProviderContext, operation: string, payload: Record<string, unknown>, validate: (data: unknown) => data is T): Promise<ToolResult<T>> {
    const body = JSON.stringify({ client_id: ctx.clientId, conversation_id: ctx.conversationId, ...payload });
    const timestamp = Math.floor(this.now() / 1000).toString();
    const signature = await this.sign(this.deps.secret, `${timestamp}.${body}`);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    let response: Response;
    try {
      response = await this.fetchImpl(`${this.deps.baseUrl.replace(/\/$/, '')}/${operation}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Cogniiq-Signature': signature,
          'X-Cogniiq-Timestamp': timestamp,
          'X-Cogniiq-Client': ctx.clientId,
        },
        body,
        signal: controller.signal,
      });
    } catch (error) {
      clearTimeout(timer);
      const aborted = error instanceof Error && error.name === 'AbortError';
      return aborted
        ? failure('provider_timeout', 'Das Buchungssystem antwortet gerade nicht.', 'offer_callback', { retryable: true })
        : failure('provider_unavailable', 'Das Buchungssystem ist vorübergehend nicht erreichbar.', 'offer_callback', { retryable: true });
    }
    clearTimeout(timer);
    if (response.status >= 500) return failure('provider_error', 'Das Buchungssystem hat einen Fehler gemeldet.', 'escalate', { retryable: response.status === 503 });
    let parsed: unknown;
    try {
      parsed = await response.json();
    } catch {
      return failure('malformed_provider_response', 'Die Antwort des Buchungssystems war unvollständig.', 'escalate');
    }
    if (!isRecord(parsed) || typeof parsed.ok !== 'boolean') {
      return failure('malformed_provider_response', 'Die Antwort des Buchungssystems war unvollständig.', 'escalate');
    }
    if (parsed.ok === false) {
      const code = typeof parsed.code === 'string' && FAILURE_CODES.has(parsed.code) ? (parsed.code as ToolFailureCode) : 'provider_error';
      const message = typeof parsed.message === 'string' && parsed.message.length <= 200 ? parsed.message : 'Das Buchungssystem konnte die Anfrage nicht ausführen.';
      const nextAction = code === 'slot_unavailable' ? 'offer_alternatives' : code === 'identity_unverified' ? 'verify_identity' : code === 'not_found' ? 'verify_identity' : 'escalate';
      return failure(code, message, nextAction);
    }
    if (!validate(parsed.data)) {
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
      start_time: request.startTime, caller: request.caller, notes: request.notes ?? null,
    }, (data): data is CreateAppointmentData => isRecord(data) && data.status === 'booked' && isAppointmentSummary(data.appointment));
  }

  findAppointments(ctx: ProviderContext, caller: CallerIdentity, options: { reference?: string; fromDate?: string }) {
    return this.call<FindAppointmentData>(ctx, 'find_appointment', { caller, reference: options.reference ?? null, from_date: options.fromDate ?? null },
      (data): data is FindAppointmentData => isRecord(data) && Array.isArray(data.appointments) && data.appointments.every(isAppointmentSummary) && typeof data.identity_verified === 'boolean');
  }

  rescheduleAppointment(ctx: ProviderContext, request: RescheduleRequest) {
    return this.call<RescheduleAppointmentData>(ctx, 'reschedule_appointment', {
      idempotency_key: request.idempotencyKey, appointment_id: request.appointmentId, new_slot_id: request.newSlotId, new_start_time: request.newStartTime, caller: request.caller,
    }, (data): data is RescheduleAppointmentData => isRecord(data) && data.status === 'rescheduled' && isAppointmentSummary(data.appointment) && typeof data.previous_start_time === 'string');
  }

  cancelAppointment(ctx: ProviderContext, request: CancelRequest) {
    return this.call<CancelAppointmentData>(ctx, 'cancel_appointment', {
      idempotency_key: request.idempotencyKey, appointment_id: request.appointmentId, caller: request.caller, reason: request.reason ?? null,
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
