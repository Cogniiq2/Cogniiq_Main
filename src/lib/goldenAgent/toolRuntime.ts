// Golden Agent — tool runtime.
//
// The single dispatch point between the voice runtime (ElevenLabs webhook tools) and the
// customer's booking provider. It is where the universal safety rules live, so they hold for every
// customer regardless of adapter quality:
//
//   1. arguments are validated against the tool contract; unknown tools and unknown params fail;
//   2. write/destructive tools refuse to run unless `caller_confirmed === true` (the LLM must have
//      read the action back and heard a yes);
//   3. identical write calls within one conversation collapse onto one idempotency key, so a retry
//      after a timeout can never double-book;
//   4. configuration-answerable tools (opening hours, service info, escalation routing) are served
//      from the ClientConfig without touching the provider;
//   5. every call is observed through an event sink (tool name, latency, outcome, failure code) —
//      never the caller's personal data.

import type { ClientConfig, EscalationContact } from './clientConfig.ts';
import { findLocation, findService, servicesAtLocation } from './clientConfig.ts';
import { formatWeeklyHoursDe, hoursForDate, addDays } from './openingHours.ts';
import type { BookingProvider, CallerIdentity, ProviderContext } from './adapters/bookingProvider.ts';
import {
  TOOL_DEFINITIONS, failure, isToolName, success, validateToolArguments,
} from './toolContracts.ts';
import type {
  EscalateToHumanData, LogConversationEventData, OpeningHoursData, ServiceInformationData, ToolName, ToolResult,
} from './toolContracts.ts';

export interface ToolCallEvent {
  conversationId: string;
  clientId: string;
  tool: ToolName | string;
  ok: boolean;
  failureCode?: string;
  latencyMs: number;
  deduplicated: boolean;
  /** Only for log_conversation_event: the structured event the agent reported. */
  reported?: { event_type: string; intent?: string; detail?: string };
  at: string;
}

export interface ToolRuntimeDependencies {
  provider: BookingProvider;
  /** Receives one event per tool call. Must not throw. */
  onEvent?: (event: ToolCallEvent) => void | Promise<void>;
  now?: () => Date;
  /** Stable hash used for idempotency keys. Defaults to a simple FNV-1a; edge functions may pass SHA-256. */
  hash?: (input: string) => Promise<string> | string;
}

export interface ToolCallRequest {
  conversationId: string;
  tool: string;
  arguments: unknown;
}

function fnv1a(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (typeof value === 'object' && value !== null) {
    return `{${Object.keys(value as Record<string, unknown>).sort().map((key) => `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function callerFromArgs(args: Record<string, unknown>): CallerIdentity {
  const str = (key: string) => (typeof args[key] === 'string' ? (args[key] as string) : undefined);
  return {
    firstName: str('caller_first_name'),
    lastName: str('caller_last_name'),
    dateOfBirth: str('caller_date_of_birth'),
    phone: str('caller_phone'),
    email: str('caller_email'),
    customerNumber: str('caller_customer_number'),
  };
}

function hhmmOf(date: Date, timezone: string): string {
  try {
    return new Intl.DateTimeFormat('de-DE', { timeZone: timezone, hour: '2-digit', minute: '2-digit', hour12: false }).format(date).replace('24:', '00:');
  } catch {
    return date.toISOString().slice(11, 16);
  }
}

function isoDateOf(date: Date, timezone: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
    return `${get('year')}-${get('month')}-${get('day')}`;
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

/** Local "now" in the client timezone as an ISO-like string without offset (what the adapters expect). */
export function localNowIso(date: Date, timezone: string): string {
  return `${isoDateOf(date, timezone)}T${hhmmOf(date, timezone)}`;
}

export function contactAvailableNow(contact: EscalationContact, date: Date, timezone: string): boolean {
  if (!contact.phone) return false;
  if (!contact.availableHours) return true;
  const isoDate = isoDateOf(date, timezone);
  const hhmm = hhmmOf(date, timezone);
  const pseudoLocation = { id: contact.id, name: contact.label, address: { street: '', postalCode: '', city: '' }, hours: contact.availableHours };
  const day = hoursForDate(pseudoLocation, isoDate);
  return day.open && day.ranges.some((range) => range.open <= hhmm && hhmm < range.close);
}

export class ToolRuntime {
  private readonly now: () => Date;
  private readonly hash: (input: string) => Promise<string> | string;

  constructor(private readonly config: ClientConfig, private readonly deps: ToolRuntimeDependencies) {
    this.now = deps.now ?? (() => new Date());
    this.hash = deps.hash ?? fnv1a;
  }

  private async idempotencyKey(conversationId: string, tool: ToolName, args: Record<string, unknown>): Promise<string> {
    // The key intentionally ignores free-text notes/reasons so a rephrased retry still collapses.
    const significant = Object.fromEntries(Object.entries(args).filter(([key]) => key !== 'notes' && key !== 'reason'));
    return `${conversationId}:${tool}:${await this.hash(stableStringify(significant))}`;
  }

  private context(conversationId: string): ProviderContext {
    return { clientId: this.config.clientId, config: this.config, conversationId, now: localNowIso(this.now(), this.config.timezone) };
  }

  async execute(request: ToolCallRequest): Promise<ToolResult> {
    const started = Date.now();
    const result = await this.dispatch(request);
    const event: ToolCallEvent = {
      conversationId: request.conversationId,
      clientId: this.config.clientId,
      tool: request.tool,
      ok: result.ok,
      failureCode: result.ok ? undefined : result.code,
      latencyMs: Date.now() - started,
      deduplicated: result.ok ? result.deduplicated === true : false,
      at: this.now().toISOString(),
    };
    if (request.tool === 'log_conversation_event' && result.ok) {
      const args = (typeof request.arguments === 'object' && request.arguments !== null ? request.arguments : {}) as Record<string, unknown>;
      event.reported = { event_type: String(args.event_type ?? 'other'), intent: typeof args.intent === 'string' ? args.intent : undefined, detail: typeof args.detail === 'string' ? args.detail.slice(0, 240) : undefined };
    }
    try {
      await this.deps.onEvent?.(event);
    } catch {
      // Observability must never break a caller's conversation.
    }
    return result;
  }

  private async dispatch(request: ToolCallRequest): Promise<ToolResult> {
    if (!isToolName(request.tool)) {
      return failure('unknown_tool', 'Diese Funktion steht nicht zur Verfügung.', 'escalate');
    }
    const tool = request.tool;
    const definition = TOOL_DEFINITIONS[tool];
    const { issues, args } = validateToolArguments(tool, request.arguments);
    if (issues.length > 0) {
      return failure('invalid_arguments', 'Für diese Aktion fehlen noch Angaben oder sie sind unvollständig.', 'ask_caller', { details: { issues } });
    }
    if (definition.requiresConfirmation && args.caller_confirmed !== true) {
      return failure('confirmation_required', 'Bitte zuerst den Termin vorlesen und die ausdrückliche Bestätigung des Anrufers einholen.', 'ask_caller');
    }
    const ctx = this.context(request.conversationId);
    const provider = this.deps.provider;

    switch (tool) {
      case 'get_available_slots': {
        const fromDate = String(args.from_date);
        const toDate = typeof args.to_date === 'string' ? args.to_date : addDays(fromDate, 7);
        if (toDate < fromDate) return failure('invalid_arguments', 'Das Enddatum liegt vor dem Startdatum.', 'ask_caller');
        if (typeof args.location_id === 'string' && !findLocation(this.config, args.location_id)) {
          return failure('not_found', 'Diesen Standort gibt es nicht.', 'ask_caller');
        }
        if (!findService(this.config, String(args.service_id))) return failure('not_found', 'Diese Leistung gibt es nicht.', 'ask_caller');
        return provider.getAvailableSlots(ctx, {
          serviceId: String(args.service_id),
          locationId: typeof args.location_id === 'string' ? args.location_id : undefined,
          fromDate, toDate,
          timeOfDay: typeof args.time_of_day === 'string' ? (args.time_of_day as 'morning' | 'afternoon' | 'evening' | 'any') : 'any',
          providerId: typeof args.provider_id === 'string' ? args.provider_id : undefined,
          isNewCaller: typeof args.is_new_caller === 'boolean' ? args.is_new_caller : undefined,
        });
      }
      case 'create_appointment': {
        if (!findLocation(this.config, String(args.location_id))) return failure('not_found', 'Diesen Standort gibt es nicht.', 'ask_caller');
        const service = findService(this.config, String(args.service_id));
        if (!service) return failure('not_found', 'Diese Leistung gibt es nicht.', 'ask_caller');
        if (!service.bookable) return failure('policy_violation', 'Diese Leistung kann telefonisch nicht gebucht werden.', 'escalate');
        return provider.createAppointment(ctx, {
          idempotencyKey: await this.idempotencyKey(request.conversationId, tool, args),
          slotId: String(args.slot_id), serviceId: String(args.service_id), locationId: String(args.location_id), startTime: String(args.start_time),
          caller: callerFromArgs(args), notes: typeof args.notes === 'string' ? args.notes : undefined,
        });
      }
      case 'find_appointment': {
        const caller = callerFromArgs(args);
        const required = this.config.identityVerification.requiredFields;
        const map: Record<string, unknown> = { firstName: caller.firstName, lastName: caller.lastName, dateOfBirth: caller.dateOfBirth, phone: caller.phone, email: caller.email, customerNumber: caller.customerNumber };
        const supplied = required.filter((field) => typeof map[field] === 'string');
        const minimum = this.config.identityVerification.minimumMatches ?? required.length;
        if (supplied.length < minimum) {
          return failure('identity_unverified', 'Zur Terminsuche werden zuerst die erforderlichen Angaben zur Identität benötigt.', 'verify_identity', { details: { required_fields: required } });
        }
        return provider.findAppointments(ctx, caller, { reference: typeof args.appointment_reference === 'string' ? args.appointment_reference : undefined, fromDate: typeof args.from_date === 'string' ? args.from_date : undefined });
      }
      case 'reschedule_appointment': {
        if (!this.config.cancellationRules.callerMayReschedule) return failure('policy_violation', 'Termine können telefonisch nicht verschoben werden.', 'escalate');
        return provider.rescheduleAppointment(ctx, {
          idempotencyKey: await this.idempotencyKey(request.conversationId, tool, args),
          appointmentId: String(args.appointment_id), newSlotId: String(args.new_slot_id), newStartTime: String(args.new_start_time), caller: callerFromArgs(args),
        });
      }
      case 'cancel_appointment': {
        if (!this.config.cancellationRules.callerMayCancel) return failure('policy_violation', 'Termine können telefonisch nicht storniert werden.', 'escalate');
        return provider.cancelAppointment(ctx, {
          idempotencyKey: await this.idempotencyKey(request.conversationId, tool, args),
          appointmentId: String(args.appointment_id), caller: callerFromArgs(args), reason: typeof args.reason === 'string' ? args.reason : undefined,
        });
      }
      case 'get_opening_hours': return this.openingHours(args);
      case 'get_service_information': return this.serviceInformation(args);
      case 'send_confirmation': {
        if (!this.config.confirmation.offerWrittenConfirmation) return failure('not_supported', 'Schriftliche Bestätigungen sind nicht vorgesehen.', 'none');
        return provider.sendConfirmation(ctx, {
          idempotencyKey: await this.idempotencyKey(request.conversationId, tool, args),
          appointmentId: String(args.appointment_id), channel: args.channel as 'sms' | 'email', destination: String(args.destination),
        });
      }
      case 'request_callback': return provider.requestCallback(ctx, {
        idempotencyKey: await this.idempotencyKey(request.conversationId, tool, args),
        callerName: String(args.caller_name), callerPhone: String(args.caller_phone), topic: String(args.topic),
        preferredTime: typeof args.preferred_time === 'string' ? args.preferred_time : undefined,
        locationId: typeof args.location_id === 'string' ? args.location_id : undefined,
        urgency: args.urgency === 'high' ? 'high' : 'normal',
      });
      case 'escalate_to_human': return this.escalate(args);
      case 'log_conversation_event': return success<LogConversationEventData>({ status: 'logged' });
    }
  }

  private openingHours(args: Record<string, unknown>): ToolResult<OpeningHoursData> {
    const date = typeof args.date === 'string' ? args.date : isoDateOf(this.now(), this.config.timezone);
    const locations = typeof args.location_id === 'string' ? [findLocation(this.config, args.location_id)] : this.config.locations;
    if (locations.some((location) => !location)) return failure('not_found', 'Diesen Standort gibt es nicht.', 'ask_caller');
    return success({
      locations: locations.map((location) => {
        const day = hoursForDate(location!, date);
        const weekly: Record<string, Array<{ open: string; close: string }>> = {};
        for (const [weekday, ranges] of Object.entries(location!.hours)) weekly[weekday] = ranges ?? [];
        return { location_id: location!.id, name: location!.name, date, open: day.open, ranges: day.ranges, closure_reason: day.closureReason, weekly };
      }),
    });
  }

  private serviceInformation(args: Record<string, unknown>): ToolResult<ServiceInformationData> {
    const locationId = typeof args.location_id === 'string' ? args.location_id : undefined;
    if (locationId && !findLocation(this.config, locationId)) return failure('not_found', 'Diesen Standort gibt es nicht.', 'ask_caller');
    const pool = locationId ? servicesAtLocation(this.config, locationId) : this.config.services;
    const services = typeof args.service_id === 'string' ? pool.filter((service) => service.id === args.service_id) : pool;
    if (typeof args.service_id === 'string' && services.length === 0) return failure('not_found', 'Diese Leistung gibt es nicht oder wird an diesem Standort nicht angeboten.', 'ask_caller');
    return success({
      services: services.map((service) => ({
        service_id: service.id, name: service.name, description: service.description, duration_minutes: service.durationMinutes,
        price_text: service.priceText, requirements: service.requirements ?? [], bookable: service.bookable,
        new_callers_allowed: service.newCallersAllowed !== false,
        location_ids: this.config.locations.filter((location) => !location.serviceIds || location.serviceIds.length === 0 || location.serviceIds.includes(service.id)).map((location) => location.id),
      })),
    });
  }

  private escalate(args: Record<string, unknown>): ToolResult<EscalateToHumanData> {
    const now = this.now();
    const reason = String(args.reason);
    const locationId = typeof args.location_id === 'string' ? args.location_id : undefined;
    const contacts = this.config.escalationContacts;
    if (contacts.length === 0) return failure('not_supported', 'Es ist kein Ansprechpartner hinterlegt.', 'offer_callback');
    // Prefer a contact whose `when` mentions the reason or the location; otherwise the first one.
    const preferred = contacts.find((contact) => contact.when.toLowerCase().includes(reason.replace(/_/g, ' '))
      || (locationId !== undefined && contact.when.toLowerCase().includes(locationId))) ?? contacts[0];
    const live = contactAvailableNow(preferred, now, this.config.timezone);
    if (live && preferred.phone) {
      return success({ action: 'transfer', transfer_phone: preferred.phone, contact_label: preferred.label, spoken_instruction: `Sagen Sie: "Gerne, ich verbinde Sie kurz mit ${preferred.label}." Dann weiterleiten.` });
    }
    return success({ action: 'callback', contact_label: preferred.label, spoken_instruction: `Aktuell ist ${preferred.label} nicht direkt erreichbar. Bieten Sie einen Rückruf an und nehmen Sie ihn mit request_callback auf.` });
  }
}

/** Spoken summary of weekly hours per location, used by the prompt composer. */
export function describeLocationsForPrompt(config: ClientConfig): string[] {
  return config.locations.map((location) => `${location.name} (${location.id}): ${location.address.street}, ${location.address.postalCode} ${location.address.city}. Öffnungszeiten: ${formatWeeklyHoursDe(location)}.`);
}
