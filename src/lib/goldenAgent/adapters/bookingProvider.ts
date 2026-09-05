// Golden Agent — booking provider adapter contract.
//
// The Golden Agent calls universal tools (toolContracts.ts). A BookingProvider is the customer-side
// implementation of the transactional subset: availability, booking, lookup, reschedule, cancel,
// confirmation and callbacks. One adapter per booking backend (mock, n8n workflow, later a direct
// PVS/calendar API). The runtime never knows which one it is talking to.
//
// Contract rules every adapter must respect:
//   * Never invent success. If the backend did not confirm, return a failure with a precise code.
//   * Return the same result for the same idempotency_key (a retried write must not double-book).
//   * Never return data belonging to a different caller than the one identified in the request.
//   * Keep messages caller-safe: no stack traces, URLs, ids of other people, or backend names.

import type { ClientConfig } from '../clientConfig.ts';
import type {
  AppointmentSummary,
  CancelAppointmentData,
  CreateAppointmentData,
  FindAppointmentData,
  GetAvailableSlotsData,
  RequestCallbackData,
  RescheduleAppointmentData,
  SendConfirmationData,
  ToolResult,
} from '../toolContracts.ts';

export interface CallerIdentity {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  phone?: string;
  email?: string;
  customerNumber?: string;
}

export interface ProviderContext {
  /** organizations.id — bound server-side to the registered tool, never taken from the LLM. */
  clientId: string;
  config: ClientConfig;
  /** Voice-runtime conversation id, used for idempotency keys and event correlation. */
  conversationId: string;
  /** "now" in ISO 8601; injectable so evaluations are deterministic. */
  now: string;
}

export interface AvailabilityQuery {
  serviceId: string;
  locationId?: string;
  fromDate: string;
  toDate: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'any';
  providerId?: string;
  isNewCaller?: boolean;
}

export interface CreateAppointmentRequest {
  idempotencyKey: string;
  slotId: string;
  serviceId: string;
  locationId: string;
  startTime: string;
  caller: CallerIdentity;
  notes?: string;
}

export interface RescheduleRequest {
  idempotencyKey: string;
  appointmentId: string;
  newSlotId: string;
  newStartTime: string;
  caller: CallerIdentity;
}

export interface CancelRequest {
  idempotencyKey: string;
  appointmentId: string;
  caller: CallerIdentity;
  reason?: string;
}

export interface CallbackRequest {
  idempotencyKey: string;
  callerName: string;
  callerPhone: string;
  topic: string;
  preferredTime?: string;
  locationId?: string;
  urgency: 'normal' | 'high';
}

export interface ConfirmationRequest {
  idempotencyKey: string;
  appointmentId: string;
  channel: 'sms' | 'email';
  destination: string;
}

export interface BookingProvider {
  readonly kind: string;
  getAvailableSlots(ctx: ProviderContext, query: AvailabilityQuery): Promise<ToolResult<GetAvailableSlotsData>>;
  createAppointment(ctx: ProviderContext, request: CreateAppointmentRequest): Promise<ToolResult<CreateAppointmentData>>;
  findAppointments(ctx: ProviderContext, caller: CallerIdentity, options: { reference?: string; fromDate?: string }): Promise<ToolResult<FindAppointmentData>>;
  rescheduleAppointment(ctx: ProviderContext, request: RescheduleRequest): Promise<ToolResult<RescheduleAppointmentData>>;
  cancelAppointment(ctx: ProviderContext, request: CancelRequest): Promise<ToolResult<CancelAppointmentData>>;
  sendConfirmation(ctx: ProviderContext, request: ConfirmationRequest): Promise<ToolResult<SendConfirmationData>>;
  requestCallback(ctx: ProviderContext, request: CallbackRequest): Promise<ToolResult<RequestCallbackData>>;
}

/** Fields the caller supplied, normalised for identity matching. */
export function normaliseIdentity(caller: CallerIdentity): CallerIdentity {
  const clean = (value?: string) => (value === undefined ? undefined : value.trim().toLowerCase());
  return {
    firstName: clean(caller.firstName),
    lastName: clean(caller.lastName),
    dateOfBirth: caller.dateOfBirth?.trim(),
    phone: caller.phone === undefined ? undefined : caller.phone.replace(/[^0-9+]/g, ''),
    email: clean(caller.email),
    customerNumber: clean(caller.customerNumber),
  };
}

export function isAppointmentSummary(value: unknown): value is AppointmentSummary {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.appointment_id === 'string' && typeof v.start_time === 'string' && typeof v.end_time === 'string'
    && typeof v.location_id === 'string' && typeof v.service_id === 'string'
    && (v.status === 'booked' || v.status === 'cancelled' || v.status === 'completed');
}
