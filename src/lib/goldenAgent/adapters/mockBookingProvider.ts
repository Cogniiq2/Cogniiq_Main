// Golden Agent — in-memory booking provider.
//
// Used for DEV agents, the evaluation suite and dashboard smoke tests. It behaves like a strict
// real backend: slots derive from configured opening hours and service durations, bookings consume
// slots, identities are matched before anything is disclosed, and every failure mode a real
// provider can produce (timeout, malformed response, error) can be injected for scenario testing.
// It must never be wired to a customer in stage=live (validateClientConfig enforces that).

import type { ClientConfig } from '../clientConfig.ts';
import { findLocation, findService, servicesAtLocation } from '../clientConfig.ts';
import { addDays, hoursForDate } from '../openingHours.ts';
import { failure, success } from '../toolContracts.ts';
import type {
  AppointmentSummary, CancelAppointmentData, CreateAppointmentData, FindAppointmentData,
  GetAvailableSlotsData, RequestCallbackData, RescheduleAppointmentData, SendConfirmationData, Slot, ToolResult,
} from '../toolContracts.ts';
import type {
  AvailabilityQuery, BookingProvider, CallbackRequest, CallerIdentity, CancelRequest,
  ConfirmationRequest, CreateAppointmentRequest, ProviderContext, RescheduleRequest,
} from './bookingProvider.ts';
import { normaliseIdentity } from './bookingProvider.ts';

export type InjectedFault = 'timeout' | 'error' | 'malformed' | 'unavailable';

interface StoredAppointment extends AppointmentSummary {
  caller: CallerIdentity;
  idempotencyKey: string;
}

export interface MockProviderOptions {
  /** Slot ids that are always "taken", to simulate unavailable requests deterministically. */
  blockedSlotIds?: string[];
  /** Fault to inject on the next call of a given method (consumed once). */
  faults?: Partial<Record<keyof BookingProvider, InjectedFault[]>>;
  /** Slot grid in minutes (default 30). */
  gridMinutes?: number;
  /** Pre-seeded appointments (e.g. a known caller with an existing booking). */
  seededAppointments?: Array<Omit<StoredAppointment, 'idempotencyKey'> & { idempotencyKey?: string }>;
}

function toSummary(stored: StoredAppointment): AppointmentSummary {
  return { appointment_id: stored.appointment_id, start_time: stored.start_time, end_time: stored.end_time, location_id: stored.location_id, service_id: stored.service_id, provider_id: stored.provider_id, reference: stored.reference, status: stored.status };
}

function hhmmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function minutesToHhmm(minutes: number): string {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

function timeOfDayWindow(pref: AvailabilityQuery['timeOfDay']): [number, number] {
  switch (pref) {
    case 'morning': return [0, 12 * 60];
    case 'afternoon': return [12 * 60, 17 * 60];
    case 'evening': return [17 * 60, 24 * 60];
    default: return [0, 24 * 60];
  }
}

export class MockBookingProvider implements BookingProvider {
  readonly kind = 'mock';
  private appointments = new Map<string, StoredAppointment>();
  private idempotency = new Map<string, ToolResult<unknown>>();
  private callbacks: CallbackRequest[] = [];
  private confirmations: ConfirmationRequest[] = [];
  private sequence = 0;
  private readonly blocked: Set<string>;
  private readonly faults: Map<keyof BookingProvider, InjectedFault[]>;
  private readonly gridMinutes: number;

  constructor(options: MockProviderOptions = {}) {
    this.blocked = new Set(options.blockedSlotIds ?? []);
    this.faults = new Map(Object.entries(options.faults ?? {}) as Array<[keyof BookingProvider, InjectedFault[]]>);
    this.gridMinutes = options.gridMinutes ?? 30;
    for (const seeded of options.seededAppointments ?? []) {
      this.appointments.set(seeded.appointment_id, { ...seeded, idempotencyKey: seeded.idempotencyKey ?? `seed-${seeded.appointment_id}` });
    }
  }

  /** Test hook: inspect state without going through the tool surface. */
  inspect() {
    return {
      appointments: [...this.appointments.values()],
      callbacks: [...this.callbacks],
      confirmations: [...this.confirmations],
    };
  }

  private takeFault(method: keyof BookingProvider): ToolResult<never> | null {
    const queue = this.faults.get(method);
    if (!queue || queue.length === 0) return null;
    const fault = queue.shift()!;
    switch (fault) {
      case 'timeout': return failure('provider_timeout', 'Das Buchungssystem antwortet gerade nicht.', 'offer_callback', { retryable: true });
      case 'error': return failure('provider_error', 'Das Buchungssystem hat einen Fehler gemeldet.', 'escalate', { retryable: false });
      case 'malformed': return failure('malformed_provider_response', 'Die Antwort des Buchungssystems war unvollständig.', 'escalate', { retryable: false });
      case 'unavailable': return failure('provider_unavailable', 'Das Buchungssystem ist vorübergehend nicht erreichbar.', 'offer_callback', { retryable: true });
    }
  }

  private slotId(locationId: string, serviceId: string, start: string): string {
    return `${locationId}|${serviceId}|${start}`;
  }

  private slotTaken(slotId: string): boolean {
    if (this.blocked.has(slotId)) return true;
    for (const appointment of this.appointments.values()) {
      if (appointment.status === 'booked' && this.slotId(appointment.location_id, appointment.service_id, appointment.start_time) === slotId) return true;
    }
    return false;
  }

  private endTime(config: ClientConfig, serviceId: string, startIso: string): string {
    const service = findService(config, serviceId);
    const [date, time] = startIso.split('T');
    const minutes = hhmmToMinutes(time.slice(0, 5)) + (service?.durationMinutes ?? 30);
    return `${date}T${minutesToHhmm(minutes)}`;
  }

  async getAvailableSlots(ctx: ProviderContext, query: AvailabilityQuery): Promise<ToolResult<GetAvailableSlotsData>> {
    const fault = this.takeFault('getAvailableSlots');
    if (fault) return fault;
    const { config } = ctx;
    const service = findService(config, query.serviceId);
    if (!service || !service.bookable) return failure('policy_violation', 'Diese Leistung kann telefonisch nicht gebucht werden.', 'escalate');
    if (query.isNewCaller && service.newCallersAllowed === false) {
      return failure('policy_violation', 'Diese Leistung ist nur für bestehende Kunden buchbar.', 'escalate');
    }
    const locations = query.locationId ? [findLocation(config, query.locationId)].filter(Boolean) : config.locations;
    if (locations.length === 0) return failure('not_found', 'Diesen Standort gibt es nicht.', 'ask_caller');

    const todayDate = ctx.now.slice(0, 10);
    const nowMinutes = hhmmToMinutes(ctx.now.slice(11, 16));
    const minNotice = config.bookingRules.minNoticeHours * 60;
    const maxDate = addDays(todayDate, config.bookingRules.maxAdvanceDays);
    if (query.fromDate > maxDate) {
      return failure('outside_booking_window', `Termine können höchstens ${config.bookingRules.maxAdvanceDays} Tage im Voraus gebucht werden.`, 'ask_caller');
    }
    const [windowStart, windowEnd] = timeOfDayWindow(query.timeOfDay);
    const slots: Slot[] = [];
    for (const location of locations) {
      if (!location) continue;
      if (!servicesAtLocation(config, location.id).some((s) => s.id === service.id)) continue;
      for (let date = query.fromDate; date <= query.toDate && date <= maxDate; date = addDays(date, 1)) {
        if (date < todayDate) continue;
        const day = hoursForDate(location, date);
        if (!day.open) continue;
        for (const range of day.ranges) {
          for (let start = hhmmToMinutes(range.open); start + service.durationMinutes <= hhmmToMinutes(range.close); start += this.gridMinutes) {
            if (start < windowStart || start >= windowEnd) continue;
            if (date === todayDate && start < nowMinutes + minNotice) continue;
            const startIso = `${date}T${minutesToHhmm(start)}`;
            const id = this.slotId(location.id, service.id, startIso);
            if (this.slotTaken(id)) continue;
            slots.push({ slot_id: id, start_time: startIso, end_time: this.endTime(config, service.id, startIso), location_id: location.id, service_id: service.id, provider_id: query.providerId });
            if (slots.length >= 40) break;
          }
        }
      }
    }
    return success({ slots, none_available: slots.length === 0, searched_from: query.fromDate, searched_to: query.toDate });
  }

  private identityMatches(config: ClientConfig, stored: CallerIdentity, given: CallerIdentity): boolean {
    const a = normaliseIdentity(stored);
    const b = normaliseIdentity(given);
    const required = config.identityVerification.requiredFields;
    const minimum = config.identityVerification.minimumMatches ?? required.length;
    let matches = 0;
    for (const field of required) {
      const key = field === 'customerNumber' ? 'customerNumber' : field;
      const av = a[key as keyof CallerIdentity];
      const bv = b[key as keyof CallerIdentity];
      if (av !== undefined && bv !== undefined && av === bv) matches += 1;
    }
    return matches >= minimum && matches > 0;
  }

  private hasRequiredFields(config: ClientConfig, caller: CallerIdentity): boolean {
    const map: Record<string, unknown> = {
      firstName: caller.firstName, lastName: caller.lastName, dateOfBirth: caller.dateOfBirth,
      phone: caller.phone, email: caller.email, customerNumber: caller.customerNumber, insuranceType: undefined,
    };
    return config.bookingRules.requiredCallerFields.every((field) => typeof map[field] === 'string' && (map[field] as string).trim() !== '');
  }

  async createAppointment(ctx: ProviderContext, request: CreateAppointmentRequest): Promise<ToolResult<CreateAppointmentData>> {
    const fault = this.takeFault('createAppointment');
    if (fault) return fault;
    const cached = this.idempotency.get(request.idempotencyKey);
    if (cached) return { ...(cached as ToolResult<CreateAppointmentData>), ...(cached.ok ? { deduplicated: true } : {}) };
    const { config } = ctx;
    if (!this.hasRequiredFields(config, request.caller)) {
      return failure('invalid_arguments', 'Für die Buchung fehlen noch Angaben zum Anrufer.', 'ask_caller', { details: { missing: config.bookingRules.requiredCallerFields } });
    }
    const expectedSlot = this.slotId(request.locationId, request.serviceId, request.startTime);
    if (request.slotId !== expectedSlot) {
      return failure('invalid_arguments', 'Der gewählte Termin passt nicht zu den Angaben. Bitte Verfügbarkeit erneut prüfen.', 'offer_alternatives');
    }
    if (this.slotTaken(request.slotId)) {
      return failure('slot_unavailable', 'Dieser Termin ist inzwischen leider vergeben.', 'offer_alternatives');
    }
    if (!config.bookingRules.allowDuplicateFutureBookings) {
      const duplicate = [...this.appointments.values()].find((a) => a.status === 'booked' && a.service_id === request.serviceId
        && a.start_time >= ctx.now && this.identityMatches(config, a.caller, request.caller));
      if (duplicate) {
        const result = failure('duplicate_booking', 'Für diese Person besteht bereits ein Termin für diese Leistung.', 'ask_caller', { details: { existing_appointment_id: duplicate.appointment_id, existing_start_time: duplicate.start_time } });
        this.idempotency.set(request.idempotencyKey, result);
        return result;
      }
    }
    this.sequence += 1;
    const appointment: StoredAppointment = {
      appointment_id: `apt_${this.sequence.toString().padStart(4, '0')}`,
      reference: `T-${(1000 + this.sequence).toString()}`,
      start_time: request.startTime,
      end_time: this.endTime(config, request.serviceId, request.startTime),
      location_id: request.locationId,
      service_id: request.serviceId,
      status: 'booked',
      caller: request.caller,
      idempotencyKey: request.idempotencyKey,
    };
    this.appointments.set(appointment.appointment_id, appointment);
    const result = success<CreateAppointmentData>({ status: 'booked', appointment: toSummary(appointment) });
    this.idempotency.set(request.idempotencyKey, result);
    return result;
  }

  async findAppointments(ctx: ProviderContext, caller: CallerIdentity, options: { reference?: string; fromDate?: string }): Promise<ToolResult<FindAppointmentData>> {
    const fault = this.takeFault('findAppointments');
    if (fault) return fault;
    const { config } = ctx;
    const provided = Object.values(caller).filter((v) => typeof v === 'string' && v.trim() !== '').length;
    if (provided === 0) return failure('identity_unverified', 'Zur Terminsuche werden die erforderlichen Angaben zur Identität benötigt.', 'verify_identity');
    const matches = [...this.appointments.values()].filter((a) => this.identityMatches(config, a.caller, caller))
      .filter((a) => !options.reference || a.reference === options.reference || a.appointment_id === options.reference)
      .filter((a) => !options.fromDate || a.start_time.slice(0, 10) >= options.fromDate);
    const verified = matches.length > 0 || config.identityVerification.requiredFields.every((field) => {
      const map: Record<string, unknown> = { firstName: caller.firstName, lastName: caller.lastName, dateOfBirth: caller.dateOfBirth, phone: caller.phone, email: caller.email, customerNumber: caller.customerNumber };
      return typeof map[field] === 'string';
    });
    if (!verified) return failure('identity_unverified', 'Die Identität konnte mit den Angaben nicht bestätigt werden.', 'verify_identity');
    return success({ appointments: matches.map(toSummary), identity_verified: true });
  }

  async rescheduleAppointment(ctx: ProviderContext, request: RescheduleRequest): Promise<ToolResult<RescheduleAppointmentData>> {
    const fault = this.takeFault('rescheduleAppointment');
    if (fault) return fault;
    const cached = this.idempotency.get(request.idempotencyKey);
    if (cached) return { ...(cached as ToolResult<RescheduleAppointmentData>), ...(cached.ok ? { deduplicated: true } : {}) };
    const { config } = ctx;
    if (!config.cancellationRules.callerMayReschedule) return failure('policy_violation', 'Termine können telefonisch nicht verschoben werden.', 'escalate');
    const existing = this.appointments.get(request.appointmentId);
    if (!existing || existing.status !== 'booked') return failure('not_found', 'Dieser Termin wurde nicht gefunden.', 'verify_identity');
    if (!this.identityMatches(config, existing.caller, request.caller)) return failure('identity_unverified', 'Die Identität passt nicht zu diesem Termin.', 'verify_identity');
    const expectedSlot = this.slotId(existing.location_id, existing.service_id, request.newStartTime);
    if (request.newSlotId !== expectedSlot) return failure('invalid_arguments', 'Der neue Termin passt nicht zu den Angaben. Bitte Verfügbarkeit erneut prüfen.', 'offer_alternatives');
    if (this.slotTaken(request.newSlotId)) return failure('slot_unavailable', 'Der neue Termin ist inzwischen leider vergeben. Der bisherige Termin bleibt bestehen.', 'offer_alternatives');
    const previous = existing.start_time;
    existing.start_time = request.newStartTime;
    existing.end_time = this.endTime(config, existing.service_id, request.newStartTime);
    const result = success<RescheduleAppointmentData>({ status: 'rescheduled', appointment: toSummary(existing), previous_start_time: previous });
    this.idempotency.set(request.idempotencyKey, result);
    return result;
  }

  async cancelAppointment(ctx: ProviderContext, request: CancelRequest): Promise<ToolResult<CancelAppointmentData>> {
    const fault = this.takeFault('cancelAppointment');
    if (fault) return fault;
    const cached = this.idempotency.get(request.idempotencyKey);
    if (cached) return { ...(cached as ToolResult<CancelAppointmentData>), ...(cached.ok ? { deduplicated: true } : {}) };
    const { config } = ctx;
    if (!config.cancellationRules.callerMayCancel) return failure('policy_violation', 'Termine können telefonisch nicht storniert werden.', 'escalate');
    const existing = this.appointments.get(request.appointmentId);
    if (!existing || existing.status !== 'booked') return failure('not_found', 'Dieser Termin wurde nicht gefunden.', 'verify_identity');
    if (!this.identityMatches(config, existing.caller, request.caller)) return failure('identity_unverified', 'Die Identität passt nicht zu diesem Termin.', 'verify_identity');
    const noticeMs = new Date(existing.start_time).getTime() - new Date(ctx.now).getTime();
    const late = noticeMs < config.cancellationRules.minNoticeHours * 3_600_000;
    existing.status = 'cancelled';
    const result = success<CancelAppointmentData>({ status: 'cancelled', appointment_id: existing.appointment_id, late_cancellation: late });
    this.idempotency.set(request.idempotencyKey, result);
    return result;
  }

  async sendConfirmation(_ctx: ProviderContext, request: ConfirmationRequest): Promise<ToolResult<SendConfirmationData>> {
    const fault = this.takeFault('sendConfirmation');
    if (fault) return fault;
    const existing = this.appointments.get(request.appointmentId);
    if (!existing) return failure('not_found', 'Dieser Termin wurde nicht gefunden.', 'ask_caller');
    if (this.confirmations.some((c) => c.idempotencyKey === request.idempotencyKey)) return success({ status: 'sent', channel: request.channel }, true);
    this.confirmations.push(request);
    return success({ status: 'queued', channel: request.channel });
  }

  async requestCallback(_ctx: ProviderContext, request: CallbackRequest): Promise<ToolResult<RequestCallbackData>> {
    const fault = this.takeFault('requestCallback');
    if (fault) return fault;
    const existing = this.callbacks.find((c) => c.idempotencyKey === request.idempotencyKey);
    if (existing) return success({ status: 'recorded', callback_id: `cb_${request.idempotencyKey.slice(0, 8)}`, expectation: 'Das Team meldet sich so bald wie möglich.' }, true);
    this.callbacks.push(request);
    return success({ status: 'recorded', callback_id: `cb_${request.idempotencyKey.slice(0, 8)}`, expectation: 'Das Team meldet sich so bald wie möglich.' });
  }
}
