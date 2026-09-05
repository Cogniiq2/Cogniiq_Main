// Golden Agent — evaluation types.
//
// A Scenario describes one realistic call: who is calling, what they want, what the booking
// backend will do, and what a correct agent must and must not do. Scenarios are provider-neutral:
// the same scenario is (a) replayed offline against the tool runtime with a reference policy,
// (b) compiled into an ElevenLabs simulation test, and (c) used to score real transcripts.
//
// Scores are per dimension, never a single hidden number, so a failure is inspectable.

import type { InjectedFault } from '../adapters/mockBookingProvider.ts';
import type { ToolName } from '../toolContracts.ts';
import type { LanguageCode } from '../clientConfig.ts';

export const SCENARIO_CATEGORIES = [
  'booking_simple', 'booking_unavailable', 'booking_alternatives', 'booking_ambiguous_date', 'booking_relative_date',
  'booking_multi_location', 'booking_multi_service', 'lookup', 'reschedule', 'cancel', 'change_of_mind', 'duplicate_request',
  'tool_timeout', 'tool_error', 'tool_malformed', 'interruption', 'poor_transcription', 'verbose_caller', 'confused_caller',
  'angry_caller', 'non_native_german', 'english', 'other_language', 'irrelevant', 'out_of_scope_medical', 'emergency',
  'privacy_attack', 'third_party_request', 'prompt_injection', 'confirmation_bypass', 'duplicate_booking_attempt',
  'false_success_claim', 'faq', 'opening_hours', 'location_info', 'service_info', 'callback', 'human_request', 'unknown_information',
] as const;

export type ScenarioCategory = (typeof SCENARIO_CATEGORIES)[number];

export const SCORE_DIMENSIONS = [
  'task_completion', 'tool_correctness', 'booking_integrity', 'confirmation_correctness', 'hallucination',
  'privacy', 'escalation', 'knowledge_grounding', 'conversation_quality',
] as const;

export type ScoreDimension = (typeof SCORE_DIMENSIONS)[number];

export interface CallerProfile {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phone: string;
  email?: string;
  /** How the caller behaves; drives the simulated user and the reference policy. */
  temperament: 'calm' | 'verbose' | 'confused' | 'angry' | 'hurried' | 'non_native';
  language: LanguageCode;
  isExistingCustomer: boolean;
}

export interface ProviderSetup {
  faults?: Partial<Record<'getAvailableSlots' | 'createAppointment' | 'findAppointments' | 'rescheduleAppointment' | 'cancelAppointment' | 'sendConfirmation' | 'requestCallback', InjectedFault[]>>;
  blockedSlotIds?: string[];
  seededAppointments?: Array<{
    appointment_id: string;
    reference: string;
    start_time: string;
    end_time: string;
    location_id: string;
    service_id: string;
    status: 'booked';
    caller: { firstName: string; lastName: string; dateOfBirth: string; phone: string };
  }>;
}

export type ExpectedOutcome = 'booked' | 'rescheduled' | 'cancelled' | 'answered' | 'escalated' | 'callback' | 'declined' | 'emergency_routed' | 'no_action';

export interface ScenarioExpectations {
  outcome: ExpectedOutcome;
  /** Tools that must have been called at least once. */
  mustCall?: ToolName[];
  /** Tools that must never be called. */
  mustNotCall?: ToolName[];
  /** Write tools that must only be called after an explicit confirmation question + yes. */
  confirmBefore?: ToolName[];
  /** The agent must not claim a booking/cancel/reschedule success at any point. */
  noSuccessClaim?: boolean;
  /** Strings (e.g. another person's name/date) that must never appear in agent speech. */
  forbiddenDisclosures?: string[];
  /** At least one of these substrings (lowercase compare) must appear in agent speech. */
  mustSayAny?: string[];
  /** None of these substrings may appear in agent speech. */
  mustNotSay?: string[];
  /** Expected intent reported via log_conversation_event (soft check). */
  intent?: string;
  /** Every spoken slot time must originate from a get_available_slots result. */
  slotsMustBeReal?: boolean;
  /** Expected language of the agent's replies. */
  language?: LanguageCode;
  /** Agent must ask for identity before find/cancel/reschedule. */
  identityBeforeLookup?: boolean;
}

export interface Scenario {
  id: string;
  category: ScenarioCategory;
  title: string;
  caller: CallerProfile;
  /** The caller's first utterance after the greeting. */
  opening: string;
  /** What the caller really wants and how they respond; used as the simulated-user prompt. */
  callerBrief: string;
  /** Local "now" for deterministic date resolution, ISO without offset. */
  now: string;
  provider: ProviderSetup;
  expectations: ScenarioExpectations;
  /** Ground truth of what the caller wants; drives the offline reference conversation and the simulated-user brief. */
  plan?: CallerPlan;
  tags?: string[];
}

export interface CallerPlan {
  serviceId?: string;
  /** Service the caller switches to mid-call (change_of_mind). */
  switchToServiceId?: string;
  locationId?: string;
  fromDate?: string;
  toDate?: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'any';
  /** Exact start time the caller asked for (ISO, no offset); used to phrase "leider nicht frei". */
  wantedStartTime?: string;
  /** Which offered slot the caller picks (0-based). */
  chosenSlotIndex?: number;
  /** Whether the caller says yes at the read-back. */
  confirms?: boolean;
  /** Existing appointment the caller refers to (lookup/reschedule/cancel). */
  appointmentId?: string;
  /** The caller asks the same thing again after success (duplicate_request). */
  repeatsRequest?: boolean;
  /** Caller insists the booking succeeded although it failed (false_success_claim). */
  insistsOnSuccess?: boolean;
  /** Caller asks to skip the read-back (confirmation_bypass). */
  asksToSkipConfirmation?: boolean;
  /** Free-text question for knowledge scenarios. */
  question?: string;
  /** Identity the caller gives for lookups — may be a third party's. */
  identity?: { firstName?: string; lastName?: string; dateOfBirth?: string; phone?: string };
}

/* ------------------------------------------------------------------ transcripts */

export interface TranscriptToolCall {
  name: string;
  args: Record<string, unknown>;
}

export interface TranscriptToolResult {
  name: string;
  ok: boolean;
  code?: string;
  data?: unknown;
}

export interface TranscriptTurn {
  role: 'user' | 'agent';
  text: string;
  toolCalls?: TranscriptToolCall[];
  toolResults?: TranscriptToolResult[];
  /** Seconds into the call, when known. */
  at?: number;
  interrupted?: boolean;
}

export interface Transcript {
  conversationId: string;
  turns: TranscriptTurn[];
  /** Where the transcript came from. */
  source: 'offline_reference' | 'elevenlabs_simulation' | 'elevenlabs_conversation' | 'manual';
}

/* ------------------------------------------------------------------ results */

export interface Finding {
  dimension: ScoreDimension;
  severity: 'fail' | 'warn' | 'info';
  message: string;
  /** Index into transcript.turns when the finding points at a specific turn. */
  turn?: number;
}

export interface DimensionScore {
  dimension: ScoreDimension;
  /** 0..1 */
  score: number;
  passed: boolean;
  /** Whether the scenario exercises this dimension at all. */
  applicable: boolean;
  findings: Finding[];
}

export interface ScenarioResult {
  scenarioId: string;
  category: ScenarioCategory;
  title: string;
  passed: boolean;
  scores: DimensionScore[];
  findings: Finding[];
  transcript: Transcript;
  outcome: ExpectedOutcome | 'unknown';
  toolCalls: string[];
}

export interface EvaluationSummary {
  total: number;
  passed: number;
  failed: number;
  byDimension: Record<ScoreDimension, { applicable: number; passed: number; averageScore: number }>;
  byCategory: Record<string, { total: number; passed: number }>;
  failures: Array<{ scenarioId: string; title: string; category: ScenarioCategory; findings: Finding[] }>;
}
