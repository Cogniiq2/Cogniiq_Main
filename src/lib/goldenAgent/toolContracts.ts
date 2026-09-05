// Golden Agent — universal tool contracts.
//
// These are the ONLY tools the Golden Agent is allowed to call, regardless of customer. Each tool
// has an explicit argument schema, an explicit result union with named failure states, and a
// classification (read / write / destructive) that the runtime uses for confirmation gates and
// duplicate-action protection. Customer-specific behaviour is never expressed here: it lives in a
// BookingProvider adapter that fulfils these contracts.
//
// The argument schemas are expressed in a tiny JSON-schema subset so the same definition can be
// (a) validated at runtime, (b) rendered into ElevenLabs webhook tool definitions and (c) documented
// in the dashboard. Dependency-free (see clientConfig.ts).

export const TOOL_NAMES = [
  'get_available_slots',
  'create_appointment',
  'find_appointment',
  'reschedule_appointment',
  'cancel_appointment',
  'get_opening_hours',
  'get_service_information',
  'send_confirmation',
  'request_callback',
  'escalate_to_human',
  'log_conversation_event',
] as const;

export type ToolName = (typeof TOOL_NAMES)[number];

export type ToolClass = 'read' | 'write' | 'destructive' | 'telemetry';

export interface ParamSpec {
  type: 'string' | 'integer' | 'number' | 'boolean';
  description: string;
  required?: boolean;
  enum?: readonly string[];
  /** Regex the string must match (validated server-side). */
  pattern?: string;
  minimum?: number;
  maximum?: number;
  maxLength?: number;
}

export interface ToolDefinition {
  name: ToolName;
  class: ToolClass;
  /** Spoken to the LLM as the tool description. Must not contain customer facts. */
  description: string;
  params: Record<string, ParamSpec>;
  /** Whether the runtime requires an explicit caller confirmation flag before executing. */
  requiresConfirmation: boolean;
  /** Whether repeated identical calls in one conversation are collapsed (idempotent). */
  idempotent: boolean;
  /** Timeout the voice runtime should wait for the webhook. */
  timeoutSeconds: number;
}

const ISO_DATE = '^\\d{4}-\\d{2}-\\d{2}$';
const ISO_DATETIME = '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}(:\\d{2})?([+-]\\d{2}:\\d{2}|Z)?$';
const KEY = '^[a-z0-9][a-z0-9-_]{0,63}$';
const PHONE = '^\\+?[0-9 ()/-]{6,20}$';

const callerIdentityParams: Record<string, ParamSpec> = {
  caller_first_name: { type: 'string', description: 'Vorname des Anrufers, wie genannt.', maxLength: 80 },
  caller_last_name: { type: 'string', description: 'Nachname des Anrufers, wie genannt.', maxLength: 80 },
  caller_date_of_birth: { type: 'string', description: 'Geburtsdatum als YYYY-MM-DD, nur wenn genannt.', pattern: ISO_DATE },
  caller_phone: { type: 'string', description: 'Telefonnummer des Anrufers, nur wenn genannt oder bestätigt.', pattern: PHONE },
  caller_email: { type: 'string', description: 'E-Mail-Adresse, nur wenn genannt.', maxLength: 160 },
  caller_customer_number: { type: 'string', description: 'Kunden-/Patientennummer, nur wenn genannt.', maxLength: 40 },
};

export const TOOL_DEFINITIONS: Record<ToolName, ToolDefinition> = {
  get_available_slots: {
    name: 'get_available_slots',
    class: 'read',
    description:
      'Liefert tatsächlich freie Termine für eine Leistung an einem Standort in einem Zeitraum. Einzige zulässige Quelle für freie Termine. Vor jeder Buchung oder Umbuchung aufrufen.',
    params: {
      service_id: { type: 'string', description: 'ID der Leistung aus der Leistungsliste.', required: true, pattern: KEY },
      location_id: { type: 'string', description: 'ID des Standorts. Leer lassen, wenn der Anrufer keinen Standort bevorzugt.', pattern: KEY },
      from_date: { type: 'string', description: 'Frühestes Datum YYYY-MM-DD.', required: true, pattern: ISO_DATE },
      to_date: { type: 'string', description: 'Spätestes Datum YYYY-MM-DD. Standard: from_date plus 7 Tage.', pattern: ISO_DATE },
      time_of_day: { type: 'string', description: 'Präferenz des Anrufers.', enum: ['morning', 'afternoon', 'evening', 'any'] },
      provider_id: { type: 'string', description: 'Gewünschte Person/Behandler, nur wenn genannt.', pattern: KEY },
      is_new_caller: { type: 'boolean', description: 'true, wenn der Anrufer noch nie Kunde war.' },
    },
    requiresConfirmation: false,
    idempotent: true,
    timeoutSeconds: 15,
  },
  create_appointment: {
    name: 'create_appointment',
    class: 'write',
    description:
      'Bucht einen konkreten freien Termin verbindlich. Nur aufrufen, nachdem der Anrufer Datum, Uhrzeit, Standort und Leistung ausdrücklich bestätigt hat. Erst nach Antwort status=booked sagen, dass gebucht wurde.',
    params: {
      slot_id: { type: 'string', description: 'slot_id aus get_available_slots.', required: true, maxLength: 120 },
      service_id: { type: 'string', description: 'ID der Leistung.', required: true, pattern: KEY },
      location_id: { type: 'string', description: 'ID des Standorts.', required: true, pattern: KEY },
      start_time: { type: 'string', description: 'Startzeit ISO 8601 aus dem Slot.', required: true, pattern: ISO_DATETIME },
      caller_confirmed: { type: 'boolean', description: 'Muss true sein: der Anrufer hat den vorgelesenen Termin ausdrücklich bestätigt.', required: true },
      ...callerIdentityParams,
      notes: { type: 'string', description: 'Kurze sachliche Notiz, keine Gesundheitsdaten.', maxLength: 240 },
    },
    requiresConfirmation: true,
    idempotent: true,
    timeoutSeconds: 20,
  },
  find_appointment: {
    name: 'find_appointment',
    class: 'read',
    description:
      'Sucht bestehende Termine des Anrufers. Nur aufrufen, nachdem die Identität mit den erforderlichen Angaben geprüft wurde. Gibt niemals Termine anderer Personen zurück.',
    params: {
      ...callerIdentityParams,
      appointment_reference: { type: 'string', description: 'Terminnummer, falls der Anrufer eine nennt.', maxLength: 60 },
      from_date: { type: 'string', description: 'Nur Termine ab diesem Datum.', pattern: ISO_DATE },
    },
    requiresConfirmation: false,
    idempotent: true,
    timeoutSeconds: 15,
  },
  reschedule_appointment: {
    name: 'reschedule_appointment',
    class: 'destructive',
    description:
      'Verschiebt einen bestehenden Termin atomar auf einen neuen freien Slot. Nur nach ausdrücklicher Bestätigung von altem und neuem Termin. Niemals zuerst stornieren und dann neu buchen.',
    params: {
      appointment_id: { type: 'string', description: 'appointment_id aus find_appointment.', required: true, maxLength: 120 },
      new_slot_id: { type: 'string', description: 'slot_id aus get_available_slots.', required: true, maxLength: 120 },
      new_start_time: { type: 'string', description: 'Neue Startzeit ISO 8601.', required: true, pattern: ISO_DATETIME },
      caller_confirmed: { type: 'boolean', description: 'Muss true sein: der Anrufer hat die Verschiebung ausdrücklich bestätigt.', required: true },
      ...callerIdentityParams,
    },
    requiresConfirmation: true,
    idempotent: true,
    timeoutSeconds: 20,
  },
  cancel_appointment: {
    name: 'cancel_appointment',
    class: 'destructive',
    description:
      'Storniert einen bestehenden Termin. Nur nach ausdrücklichem "Ja" des Anrufers zum konkret genannten Termin. Erst nach Antwort status=cancelled die Stornierung bestätigen.',
    params: {
      appointment_id: { type: 'string', description: 'appointment_id aus find_appointment.', required: true, maxLength: 120 },
      caller_confirmed: { type: 'boolean', description: 'Muss true sein: der Anrufer hat die Stornierung ausdrücklich bestätigt.', required: true },
      reason: { type: 'string', description: 'Kurzer Grund, falls genannt. Keine Gesundheitsdaten.', maxLength: 160 },
      ...callerIdentityParams,
    },
    requiresConfirmation: true,
    idempotent: true,
    timeoutSeconds: 20,
  },
  get_opening_hours: {
    name: 'get_opening_hours',
    class: 'read',
    description: 'Liefert Öffnungszeiten und Sonderschließungen eines Standorts für ein Datum. Aufrufen, wenn nach Öffnungszeiten, Feiertagen oder "heute geöffnet?" gefragt wird.',
    params: {
      location_id: { type: 'string', description: 'ID des Standorts. Leer = alle Standorte.', pattern: KEY },
      date: { type: 'string', description: 'Datum YYYY-MM-DD. Leer = heute.', pattern: ISO_DATE },
    },
    requiresConfirmation: false,
    idempotent: true,
    timeoutSeconds: 10,
  },
  get_service_information: {
    name: 'get_service_information',
    class: 'read',
    description: 'Liefert freigegebene Informationen zu einer Leistung: Dauer, Voraussetzungen, Preis-Hinweis, Standorte. Aufrufen, wenn Details zu einer Leistung gefragt werden.',
    params: {
      service_id: { type: 'string', description: 'ID der Leistung. Leer = Übersicht aller Leistungen.', pattern: KEY },
      location_id: { type: 'string', description: 'Standort, falls relevant.', pattern: KEY },
    },
    requiresConfirmation: false,
    idempotent: true,
    timeoutSeconds: 10,
  },
  send_confirmation: {
    name: 'send_confirmation',
    class: 'write',
    description: 'Sendet eine schriftliche Terminbestätigung per SMS oder E-Mail, wenn der Anrufer das wünscht und der Kanal bekannt ist.',
    params: {
      appointment_id: { type: 'string', description: 'appointment_id des gebuchten Termins.', required: true, maxLength: 120 },
      channel: { type: 'string', description: 'Kanal.', required: true, enum: ['sms', 'email'] },
      destination: { type: 'string', description: 'Telefonnummer oder E-Mail-Adresse, vom Anrufer bestätigt.', required: true, maxLength: 160 },
    },
    requiresConfirmation: false,
    idempotent: true,
    timeoutSeconds: 15,
  },
  request_callback: {
    name: 'request_callback',
    class: 'write',
    description: 'Hinterlegt eine Rückrufbitte für das Team, wenn ein Anliegen nicht direkt gelöst werden kann oder kein Mitarbeiter erreichbar ist.',
    params: {
      caller_name: { type: 'string', description: 'Name des Anrufers.', required: true, maxLength: 120 },
      caller_phone: { type: 'string', description: 'Rückrufnummer, vom Anrufer bestätigt.', required: true, pattern: PHONE },
      topic: { type: 'string', description: 'Sachliche Kurzbeschreibung des Anliegens. Keine Gesundheitsdaten.', required: true, maxLength: 240 },
      preferred_time: { type: 'string', description: 'Gewünschtes Zeitfenster in Worten.', maxLength: 80 },
      location_id: { type: 'string', description: 'Betroffener Standort, falls relevant.', pattern: KEY },
      urgency: { type: 'string', description: 'Dringlichkeit.', enum: ['normal', 'high'] },
    },
    requiresConfirmation: false,
    idempotent: true,
    timeoutSeconds: 15,
  },
  escalate_to_human: {
    name: 'escalate_to_human',
    class: 'write',
    description:
      'Übergibt an einen Menschen: liefert das passende Weiterleitungsziel oder, außerhalb der Erreichbarkeit, die Anweisung einen Rückruf aufzunehmen. Aufrufen bei ausdrücklichem Wunsch, Identitätsproblemen, medizinischen Fragen, wiederholten Tool-Fehlern oder Beschwerden.',
    params: {
      reason: { type: 'string', description: 'Grund der Eskalation.', required: true, enum: ['caller_request', 'identity_unverified', 'medical_question', 'tool_failure', 'complaint', 'out_of_scope', 'emergency', 'other'] },
      summary: { type: 'string', description: 'Ein Satz Kontext für den Mitarbeiter. Keine Gesundheitsdaten.', required: true, maxLength: 240 },
      location_id: { type: 'string', description: 'Betroffener Standort, falls bekannt.', pattern: KEY },
    },
    requiresConfirmation: false,
    idempotent: false,
    timeoutSeconds: 10,
  },
  log_conversation_event: {
    name: 'log_conversation_event',
    class: 'telemetry',
    description: 'Protokolliert ein strukturiertes Gesprächsereignis für die Auswertung (Intent erkannt, Anrufer hat Meinung geändert, Missverständnis). Hat keine Wirkung auf den Anrufer.',
    params: {
      event_type: { type: 'string', description: 'Ereignistyp.', required: true, enum: ['intent_detected', 'intent_changed', 'clarification_needed', 'caller_frustrated', 'language_switched', 'out_of_scope_request', 'privacy_request_refused', 'injection_attempt', 'other'] },
      detail: { type: 'string', description: 'Kurze sachliche Beschreibung.', maxLength: 240 },
      intent: { type: 'string', description: 'Erkannter Intent.', enum: ['book', 'lookup', 'reschedule', 'cancel', 'faq', 'opening_hours', 'location', 'service_info', 'callback', 'human', 'emergency', 'other'] },
    },
    requiresConfirmation: false,
    idempotent: false,
    timeoutSeconds: 5,
  },
};

/* ------------------------------------------------------------------ results */

export interface Slot {
  slot_id: string;
  start_time: string;
  end_time: string;
  location_id: string;
  service_id: string;
  provider_id?: string;
}

export interface AppointmentSummary {
  appointment_id: string;
  start_time: string;
  end_time: string;
  location_id: string;
  service_id: string;
  provider_id?: string;
  /** Human reference the caller may quote later. */
  reference?: string;
  status: 'booked' | 'cancelled' | 'completed';
}

export type ToolFailureCode =
  | 'invalid_arguments'
  | 'confirmation_required'
  | 'identity_unverified'
  | 'not_found'
  | 'slot_unavailable'
  | 'duplicate_booking'
  | 'outside_booking_window'
  | 'policy_violation'
  | 'provider_unavailable'
  | 'provider_timeout'
  | 'provider_error'
  | 'malformed_provider_response'
  | 'not_supported'
  | 'unknown_tool';

export interface ToolFailure {
  ok: false;
  code: ToolFailureCode;
  /** Short, caller-safe explanation the LLM may paraphrase. Never contains internals. */
  message: string;
  /** Whether the runtime already retried and a further retry is pointless. */
  retryable: boolean;
  /** Recommended next step for the agent. */
  next_action: 'ask_caller' | 'offer_alternatives' | 'verify_identity' | 'escalate' | 'offer_callback' | 'none';
  details?: Record<string, unknown>;
}

export type ToolSuccess<T> = { ok: true; data: T; /** Set when a duplicate call was collapsed. */ deduplicated?: boolean };

export type ToolResult<T = unknown> = ToolSuccess<T> | ToolFailure;

export interface GetAvailableSlotsData {
  slots: Slot[];
  /** True when the window was searched completely and nothing is free. */
  none_available: boolean;
  searched_from: string;
  searched_to: string;
}

export interface CreateAppointmentData {
  status: 'booked';
  appointment: AppointmentSummary;
}

export interface FindAppointmentData {
  appointments: AppointmentSummary[];
  identity_verified: boolean;
}

export interface RescheduleAppointmentData {
  status: 'rescheduled';
  appointment: AppointmentSummary;
  previous_start_time: string;
}

export interface CancelAppointmentData {
  status: 'cancelled';
  appointment_id: string;
  late_cancellation: boolean;
}

export interface OpeningHoursData {
  locations: Array<{
    location_id: string;
    name: string;
    date: string;
    open: boolean;
    ranges: Array<{ open: string; close: string }>;
    closure_reason?: string;
    weekly: Record<string, Array<{ open: string; close: string }>>;
  }>;
}

export interface ServiceInformationData {
  services: Array<{
    service_id: string;
    name: string;
    description?: string;
    duration_minutes: number;
    price_text?: string;
    requirements: string[];
    bookable: boolean;
    new_callers_allowed: boolean;
    location_ids: string[];
  }>;
}

export interface SendConfirmationData {
  status: 'sent' | 'queued';
  channel: 'sms' | 'email';
}

export interface RequestCallbackData {
  status: 'recorded';
  callback_id: string;
  /** Spoken to the caller. Never promises a time the config does not guarantee. */
  expectation: string;
}

export interface EscalateToHumanData {
  action: 'transfer' | 'callback';
  /** Present only for action=transfer. Consumed by the voice runtime, never read to the caller. */
  transfer_phone?: string;
  contact_label: string;
  /** What the agent should say before transferring / offering callback. */
  spoken_instruction: string;
}

export interface LogConversationEventData {
  status: 'logged';
}

export type ToolDataMap = {
  get_available_slots: GetAvailableSlotsData;
  create_appointment: CreateAppointmentData;
  find_appointment: FindAppointmentData;
  reschedule_appointment: RescheduleAppointmentData;
  cancel_appointment: CancelAppointmentData;
  get_opening_hours: OpeningHoursData;
  get_service_information: ServiceInformationData;
  send_confirmation: SendConfirmationData;
  request_callback: RequestCallbackData;
  escalate_to_human: EscalateToHumanData;
  log_conversation_event: LogConversationEventData;
};

/* ------------------------------------------------------------------ validation */

export interface ArgumentIssue {
  param: string;
  message: string;
}

export function isToolName(value: unknown): value is ToolName {
  return typeof value === 'string' && (TOOL_NAMES as readonly string[]).includes(value);
}

/**
 * Validates raw arguments (as sent by the LLM through the voice runtime) against the tool's schema.
 * Unknown parameters are rejected: an LLM inventing parameters is a signal, not a convenience.
 * Returns the cleaned arguments (trimmed strings, coerced booleans/numbers) on success.
 */
export function validateToolArguments(
  tool: ToolName,
  raw: unknown,
): { issues: ArgumentIssue[]; args: Record<string, unknown> } {
  const definition = TOOL_DEFINITIONS[tool];
  const issues: ArgumentIssue[] = [];
  const args: Record<string, unknown> = {};
  const input = typeof raw === 'object' && raw !== null && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};

  for (const key of Object.keys(input)) {
    if (!(key in definition.params)) issues.push({ param: key, message: 'unknown parameter' });
  }

  for (const [name, spec] of Object.entries(definition.params)) {
    const value = input[name];
    const isEmpty = value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
    if (isEmpty) {
      if (spec.required) issues.push({ param: name, message: 'required' });
      continue;
    }
    switch (spec.type) {
      case 'string': {
        if (typeof value !== 'string') { issues.push({ param: name, message: 'must be a string' }); break; }
        const trimmed = value.trim();
        if (spec.maxLength !== undefined && trimmed.length > spec.maxLength) { issues.push({ param: name, message: `longer than ${spec.maxLength}` }); break; }
        if (spec.enum && !spec.enum.includes(trimmed)) { issues.push({ param: name, message: `must be one of ${spec.enum.join(', ')}` }); break; }
        if (spec.pattern && !new RegExp(spec.pattern).test(trimmed)) { issues.push({ param: name, message: 'invalid format' }); break; }
        args[name] = trimmed;
        break;
      }
      case 'boolean': {
        if (typeof value === 'boolean') args[name] = value;
        else if (value === 'true' || value === 'false') args[name] = value === 'true';
        else issues.push({ param: name, message: 'must be a boolean' });
        break;
      }
      case 'integer':
      case 'number': {
        const num = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
        if (!Number.isFinite(num) || (spec.type === 'integer' && !Number.isInteger(num))) { issues.push({ param: name, message: `must be a ${spec.type}` }); break; }
        if (spec.minimum !== undefined && num < spec.minimum) { issues.push({ param: name, message: `below ${spec.minimum}` }); break; }
        if (spec.maximum !== undefined && num > spec.maximum) { issues.push({ param: name, message: `above ${spec.maximum}` }); break; }
        args[name] = num;
        break;
      }
    }
  }
  return { issues, args };
}

export function failure(
  code: ToolFailureCode,
  message: string,
  next_action: ToolFailure['next_action'],
  options: { retryable?: boolean; details?: Record<string, unknown> } = {},
): ToolFailure {
  return { ok: false, code, message, retryable: options.retryable ?? false, next_action, details: options.details };
}

export function success<T>(data: T, deduplicated = false): ToolSuccess<T> {
  return deduplicated ? { ok: true, data, deduplicated: true } : { ok: true, data };
}
