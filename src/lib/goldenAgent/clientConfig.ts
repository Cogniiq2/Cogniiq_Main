// Golden Agent — client configuration model.
//
// This is the single, strongly typed description of ONE customer's AI receptionist. Everything
// customer-specific (names, locations, hours, services, rules, escalation, voice) lives here and
// only here. The universal agent behaviour (prompt composer, tool contracts, runtime guards) never
// reads customer facts from anywhere else, so onboarding customer #2 means writing a new
// ClientConfig, importing knowledge and choosing an integration adapter — not copying agent code.
//
// Dependency-free by design: this module is imported by the browser bundle, by vitest and by Deno
// edge functions (relative `.ts` import, see supabase/functions/receptionist-*), so it must not
// pull in `zod` or any bare package specifier. Validation is hand-written and returns a list of
// issues instead of throwing.

export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
export const WEEKDAYS: readonly Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export type LanguageCode = 'de' | 'en' | 'tr' | 'ru' | 'ar' | 'pl' | 'fr' | 'es' | 'it' | 'uk';
export const SUPPORTED_LANGUAGES: readonly LanguageCode[] = ['de', 'en', 'tr', 'ru', 'ar', 'pl', 'fr', 'es', 'it', 'uk'];

export type DeploymentStage = 'dev' | 'evaluation' | 'staging' | 'live' | 'paused';

export type BookingProviderKind = 'mock' | 'n8n_webhook' | 'none';

export interface TimeRange {
  /** HH:MM, 24h, local time of the location. */
  open: string;
  close: string;
}

export type WeeklyHours = Partial<Record<Weekday, TimeRange[]>>;

export interface SpecialClosure {
  /** ISO date YYYY-MM-DD (inclusive). */
  from: string;
  /** ISO date YYYY-MM-DD (inclusive). Defaults to `from`. */
  to?: string;
  reason?: string;
  /** Optional partial hours instead of a full closure. */
  hours?: TimeRange[];
}

export interface Address {
  street: string;
  postalCode: string;
  city: string;
  country?: string;
  /** Free text: floor, entrance, landmark. Read to callers who ask for directions. */
  directions?: string;
  parking?: string;
  publicTransport?: string;
}

export interface ClientLocation {
  /** Stable key used in tool calls and knowledge (e.g. "leipzig-markt"). */
  id: string;
  name: string;
  address: Address;
  phone?: string;
  hours: WeeklyHours;
  specialClosures?: SpecialClosure[];
  /** Service ids offered at this location. Empty = all services. */
  serviceIds?: string[];
  timezone?: string;
}

export interface ClientService {
  /** Stable key used in tool calls (e.g. "plasma-donation"). */
  id: string;
  name: string;
  /** Spoken synonyms the caller may use. */
  aliases?: string[];
  description?: string;
  durationMinutes: number;
  /** Optional price hint read to callers when asked. Never invented. */
  priceText?: string;
  /** What the caller must bring / know. Spoken after a successful booking. */
  requirements?: string[];
  /** Whether new (unknown) callers may book this service directly. */
  newCallersAllowed?: boolean;
  bookable: boolean;
  providerIds?: string[];
}

export interface ClientProvider {
  id: string;
  name: string;
  /** e.g. "Dr. med." — used when speaking the name. */
  title?: string;
  serviceIds?: string[];
  locationIds?: string[];
}

export interface BookingRules {
  /** Minimum notice in hours for a new booking. */
  minNoticeHours: number;
  /** How far in the future callers may book, in days. */
  maxAdvanceDays: number;
  /** Max alternatives the agent reads out when the requested slot is unavailable. */
  maxAlternativesSpoken: number;
  /** Caller data required before create_appointment may be called. */
  requiredCallerFields: CallerField[];
  /** Whether the same caller may hold two future appointments for the same service. */
  allowDuplicateFutureBookings: boolean;
}

export type CallerField = 'firstName' | 'lastName' | 'dateOfBirth' | 'phone' | 'email' | 'customerNumber' | 'insuranceType';

export interface CancellationRules {
  /** Minimum notice in hours to cancel without consequence. */
  minNoticeHours: number;
  /** Spoken when the caller cancels late. */
  lateCancellationText?: string;
  /** If false, the agent explains and escalates instead of cancelling. */
  callerMayCancel: boolean;
  callerMayReschedule: boolean;
}

export interface IdentityVerificationRules {
  /** Fields the caller must state before any existing appointment/personal data is disclosed. */
  requiredFields: CallerField[];
  /** Minimum number of requiredFields that must match. Defaults to all. */
  minimumMatches?: number;
}

export interface FaqEntry {
  id: string;
  question: string;
  answer: string;
  /** Alternative phrasings to improve recall. */
  variants?: string[];
  /** Only relevant at these locations (empty = all). */
  locationIds?: string[];
}

export interface EscalationContact {
  id: string;
  label: string;
  /** E.164 number used for transfer_to_number. Omit for callback-only contacts. */
  phone?: string;
  email?: string;
  /** When this contact should be used (spoken to the LLM as a rule). */
  when: string;
  /** Local hours when live transfer is possible; otherwise a callback is offered. */
  availableHours?: WeeklyHours;
}

export interface EmergencyPolicy {
  /** Sentence the agent says verbatim when an emergency is detected. */
  message: string;
  /** Emergency number to state (e.g. "112"). */
  emergencyNumber: string;
  /** Extra domain-specific triggers on top of the universal ones. */
  additionalTriggers?: string[];
}

export type KnowledgeSourceKind = 'website' | 'faq' | 'document' | 'structured' | 'text';

export interface KnowledgeSource {
  id: string;
  kind: KnowledgeSourceKind;
  name: string;
  /** For website/document sources. */
  url?: string;
  /** For text sources: the content itself. */
  text?: string;
  /** Whether the source has been reviewed by a human before the agent may rely on it. */
  reviewed: boolean;
  /** Provider-side document id once attached (e.g. ElevenLabs knowledge base id). */
  providerDocumentId?: string;
}

export interface VoiceSettings {
  /** Provider voice id (ElevenLabs voice_id). Optional so the factory can apply a default. */
  voiceId?: string;
  /** Spoken name of the assistant, e.g. "Chris". Optional; the agent may stay anonymous. */
  assistantName?: string;
  ttsModel?: 'eleven_flash_v2_5' | 'eleven_v3_conversational' | 'eleven_multilingual_v2';
  stability?: number;
  similarityBoost?: number;
  speed?: number;
}

export interface PronunciationHint {
  /** Text as written. */
  text: string;
  /** How it should be said (phonetic spelling in the primary language). */
  spokenAs: string;
}

export interface ConfirmationBehavior {
  /** Read back date, time, location and service before every write. Should always be true. */
  readBackBeforeWrite: boolean;
  /** Require an explicit "ja" before cancel/reschedule. Should always be true. */
  explicitYesForDestructive: boolean;
  /** Offer SMS/e-mail confirmation after a booking when a channel is known. */
  offerWrittenConfirmation: boolean;
  /** Custom closing sentence after a successful booking. */
  bookingSuccessSuffix?: string;
}

export interface BookingIntegration {
  provider: BookingProviderKind;
  /** n8n_webhook: base URL of the customer workflow; secrets live in edge function env, never here. */
  baseUrl?: string;
  /** Name of the server-side env var holding the shared secret (never the secret itself). */
  secretEnvVar?: string;
  /** Provider-specific mapping, e.g. { locationIdField: "center" }. */
  options?: Record<string, string>;
}

export interface ClientConfig {
  /** Schema version for forward-compatible migrations of stored configs. */
  schemaVersion: 1;
  /** Cogniiq client id = organizations.id (uuid). Never derived from caller input at runtime. */
  clientId: string;
  companyName: string;
  /** Short spoken name if the legal name is unwieldy. */
  spokenName?: string;
  industry?: string;
  website?: string;
  stage: DeploymentStage;
  primaryLanguage: LanguageCode;
  additionalLanguages: LanguageCode[];
  timezone: string;
  locations: ClientLocation[];
  services: ClientService[];
  providers?: ClientProvider[];
  bookingRules: BookingRules;
  cancellationRules: CancellationRules;
  identityVerification: IdentityVerificationRules;
  faqs: FaqEntry[];
  escalationContacts: EscalationContact[];
  emergency: EmergencyPolicy;
  knowledgeSources: KnowledgeSource[];
  bookingIntegration: BookingIntegration;
  voice: VoiceSettings;
  pronunciation?: PronunciationHint[];
  confirmation: ConfirmationBehavior;
  /** Domain constraints the agent must state and never override (e.g. "kein Arzt, keine Diagnose"). */
  scopeLimits?: string[];
  /** Topics that must always go to a human. */
  alwaysEscalateTopics?: string[];
}

/* ------------------------------------------------------------------ validation */

export interface ConfigIssue {
  path: string;
  message: string;
  severity: 'error' | 'warning';
}

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const KEY_RE = /^[a-z0-9][a-z0-9-_]{0,63}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const E164_RE = /^\+[1-9]\d{6,14}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateHours(hours: unknown, path: string, issues: ConfigIssue[]): void {
  if (!isRecord(hours)) {
    issues.push({ path, message: 'hours must be an object keyed by weekday', severity: 'error' });
    return;
  }
  for (const [day, ranges] of Object.entries(hours)) {
    if (!WEEKDAYS.includes(day as Weekday)) {
      issues.push({ path: `${path}.${day}`, message: `unknown weekday "${day}"`, severity: 'error' });
      continue;
    }
    if (!Array.isArray(ranges)) {
      issues.push({ path: `${path}.${day}`, message: 'must be an array of {open, close}', severity: 'error' });
      continue;
    }
    ranges.forEach((range, index) => {
      if (!isRecord(range) || typeof range.open !== 'string' || typeof range.close !== 'string') {
        issues.push({ path: `${path}.${day}[${index}]`, message: 'range needs open and close', severity: 'error' });
        return;
      }
      if (!TIME_RE.test(range.open) || !TIME_RE.test(range.close)) {
        issues.push({ path: `${path}.${day}[${index}]`, message: 'times must be HH:MM', severity: 'error' });
      } else if (range.open >= range.close) {
        issues.push({ path: `${path}.${day}[${index}]`, message: 'open must be before close', severity: 'error' });
      }
    });
  }
}

/**
 * Validates an untrusted value as a ClientConfig. Returns every issue found so an operator can fix
 * a stored config in one pass. `errors.length === 0` means the value is safe to use as ClientConfig.
 */
export function validateClientConfig(value: unknown): { issues: ConfigIssue[]; config: ClientConfig | null } {
  const issues: ConfigIssue[] = [];
  if (!isRecord(value)) {
    return { issues: [{ path: '', message: 'config must be an object', severity: 'error' }], config: null };
  }
  const c = value;

  if (c.schemaVersion !== 1) issues.push({ path: 'schemaVersion', message: 'must be 1', severity: 'error' });
  if (typeof c.clientId !== 'string' || !UUID_RE.test(c.clientId)) {
    issues.push({ path: 'clientId', message: 'must be the organization uuid', severity: 'error' });
  }
  if (typeof c.companyName !== 'string' || c.companyName.trim().length < 2) {
    issues.push({ path: 'companyName', message: 'required', severity: 'error' });
  }
  if (!['dev', 'evaluation', 'staging', 'live', 'paused'].includes(String(c.stage))) {
    issues.push({ path: 'stage', message: 'invalid stage', severity: 'error' });
  }
  if (!SUPPORTED_LANGUAGES.includes(c.primaryLanguage as LanguageCode)) {
    issues.push({ path: 'primaryLanguage', message: 'unsupported language', severity: 'error' });
  }
  if (!Array.isArray(c.additionalLanguages)) {
    issues.push({ path: 'additionalLanguages', message: 'must be an array', severity: 'error' });
  } else {
    c.additionalLanguages.forEach((lang, i) => {
      if (!SUPPORTED_LANGUAGES.includes(lang as LanguageCode)) {
        issues.push({ path: `additionalLanguages[${i}]`, message: 'unsupported language', severity: 'error' });
      } else if (lang === c.primaryLanguage) {
        issues.push({ path: `additionalLanguages[${i}]`, message: 'duplicates primaryLanguage', severity: 'warning' });
      }
    });
  }
  if (typeof c.timezone !== 'string' || !c.timezone.includes('/')) {
    issues.push({ path: 'timezone', message: 'must be an IANA timezone like Europe/Berlin', severity: 'error' });
  }

  const serviceIds = new Set<string>();
  if (!Array.isArray(c.services) || c.services.length === 0) {
    issues.push({ path: 'services', message: 'at least one service is required', severity: 'error' });
  } else {
    c.services.forEach((service, i) => {
      const p = `services[${i}]`;
      if (!isRecord(service)) { issues.push({ path: p, message: 'must be an object', severity: 'error' }); return; }
      if (typeof service.id !== 'string' || !KEY_RE.test(service.id)) {
        issues.push({ path: `${p}.id`, message: 'id must be a lowercase key', severity: 'error' });
      } else if (serviceIds.has(service.id)) {
        issues.push({ path: `${p}.id`, message: 'duplicate service id', severity: 'error' });
      } else serviceIds.add(service.id);
      if (typeof service.name !== 'string' || !service.name.trim()) issues.push({ path: `${p}.name`, message: 'required', severity: 'error' });
      if (typeof service.durationMinutes !== 'number' || service.durationMinutes <= 0 || service.durationMinutes > 24 * 60) {
        issues.push({ path: `${p}.durationMinutes`, message: 'must be a positive number of minutes', severity: 'error' });
      }
      if (typeof service.bookable !== 'boolean') issues.push({ path: `${p}.bookable`, message: 'required boolean', severity: 'error' });
    });
  }

  const locationIds = new Set<string>();
  if (!Array.isArray(c.locations) || c.locations.length === 0) {
    issues.push({ path: 'locations', message: 'at least one location is required', severity: 'error' });
  } else {
    c.locations.forEach((location, i) => {
      const p = `locations[${i}]`;
      if (!isRecord(location)) { issues.push({ path: p, message: 'must be an object', severity: 'error' }); return; }
      if (typeof location.id !== 'string' || !KEY_RE.test(location.id)) {
        issues.push({ path: `${p}.id`, message: 'id must be a lowercase key', severity: 'error' });
      } else if (locationIds.has(location.id)) {
        issues.push({ path: `${p}.id`, message: 'duplicate location id', severity: 'error' });
      } else locationIds.add(location.id);
      if (typeof location.name !== 'string' || !location.name.trim()) issues.push({ path: `${p}.name`, message: 'required', severity: 'error' });
      if (!isRecord(location.address) || typeof location.address.city !== 'string' || typeof location.address.street !== 'string') {
        issues.push({ path: `${p}.address`, message: 'street and city are required', severity: 'error' });
      }
      validateHours(location.hours, `${p}.hours`, issues);
      if (location.specialClosures !== undefined) {
        if (!Array.isArray(location.specialClosures)) {
          issues.push({ path: `${p}.specialClosures`, message: 'must be an array', severity: 'error' });
        } else {
          location.specialClosures.forEach((closure, j) => {
            if (!isRecord(closure) || typeof closure.from !== 'string' || !DATE_RE.test(closure.from)) {
              issues.push({ path: `${p}.specialClosures[${j}].from`, message: 'must be YYYY-MM-DD', severity: 'error' });
            }
            if (isRecord(closure) && closure.to !== undefined && (typeof closure.to !== 'string' || !DATE_RE.test(closure.to))) {
              issues.push({ path: `${p}.specialClosures[${j}].to`, message: 'must be YYYY-MM-DD', severity: 'error' });
            }
          });
        }
      }
      if (Array.isArray(location.serviceIds)) {
        location.serviceIds.forEach((id, j) => {
          if (!serviceIds.has(String(id))) {
            issues.push({ path: `${p}.serviceIds[${j}]`, message: `unknown service "${String(id)}"`, severity: 'error' });
          }
        });
      }
    });
  }

  if (Array.isArray(c.providers)) {
    c.providers.forEach((provider, i) => {
      if (!isRecord(provider) || typeof provider.id !== 'string' || typeof provider.name !== 'string') {
        issues.push({ path: `providers[${i}]`, message: 'id and name are required', severity: 'error' });
        return;
      }
      (Array.isArray(provider.serviceIds) ? provider.serviceIds : []).forEach((id) => {
        if (!serviceIds.has(String(id))) issues.push({ path: `providers[${i}].serviceIds`, message: `unknown service "${String(id)}"`, severity: 'error' });
      });
      (Array.isArray(provider.locationIds) ? provider.locationIds : []).forEach((id) => {
        if (!locationIds.has(String(id))) issues.push({ path: `providers[${i}].locationIds`, message: `unknown location "${String(id)}"`, severity: 'error' });
      });
    });
  }

  if (!isRecord(c.bookingRules)) {
    issues.push({ path: 'bookingRules', message: 'required', severity: 'error' });
  } else {
    const r = c.bookingRules;
    if (typeof r.minNoticeHours !== 'number' || r.minNoticeHours < 0) issues.push({ path: 'bookingRules.minNoticeHours', message: 'must be >= 0', severity: 'error' });
    if (typeof r.maxAdvanceDays !== 'number' || r.maxAdvanceDays <= 0) issues.push({ path: 'bookingRules.maxAdvanceDays', message: 'must be > 0', severity: 'error' });
    if (typeof r.maxAlternativesSpoken !== 'number' || r.maxAlternativesSpoken < 1 || r.maxAlternativesSpoken > 5) {
      issues.push({ path: 'bookingRules.maxAlternativesSpoken', message: 'must be between 1 and 5 (callers cannot follow more)', severity: 'error' });
    }
    if (!Array.isArray(r.requiredCallerFields) || r.requiredCallerFields.length === 0) {
      issues.push({ path: 'bookingRules.requiredCallerFields', message: 'at least one caller field is required', severity: 'error' });
    }
    if (typeof r.allowDuplicateFutureBookings !== 'boolean') issues.push({ path: 'bookingRules.allowDuplicateFutureBookings', message: 'required boolean', severity: 'error' });
  }

  if (!isRecord(c.cancellationRules)) {
    issues.push({ path: 'cancellationRules', message: 'required', severity: 'error' });
  } else {
    const r = c.cancellationRules;
    if (typeof r.minNoticeHours !== 'number' || r.minNoticeHours < 0) issues.push({ path: 'cancellationRules.minNoticeHours', message: 'must be >= 0', severity: 'error' });
    if (typeof r.callerMayCancel !== 'boolean') issues.push({ path: 'cancellationRules.callerMayCancel', message: 'required boolean', severity: 'error' });
    if (typeof r.callerMayReschedule !== 'boolean') issues.push({ path: 'cancellationRules.callerMayReschedule', message: 'required boolean', severity: 'error' });
  }

  if (!isRecord(c.identityVerification) || !Array.isArray(c.identityVerification.requiredFields) || c.identityVerification.requiredFields.length === 0) {
    issues.push({ path: 'identityVerification.requiredFields', message: 'at least one field is required before personal data may be disclosed', severity: 'error' });
  }

  if (!Array.isArray(c.faqs)) {
    issues.push({ path: 'faqs', message: 'must be an array (may be empty)', severity: 'error' });
  } else {
    const faqIds = new Set<string>();
    c.faqs.forEach((faq, i) => {
      if (!isRecord(faq) || typeof faq.id !== 'string' || typeof faq.question !== 'string' || typeof faq.answer !== 'string') {
        issues.push({ path: `faqs[${i}]`, message: 'id, question and answer are required', severity: 'error' });
        return;
      }
      if (faqIds.has(faq.id)) issues.push({ path: `faqs[${i}].id`, message: 'duplicate faq id', severity: 'error' });
      faqIds.add(faq.id);
      if (!faq.answer.trim()) issues.push({ path: `faqs[${i}].answer`, message: 'empty answer', severity: 'error' });
    });
  }

  if (!Array.isArray(c.escalationContacts) || c.escalationContacts.length === 0) {
    issues.push({ path: 'escalationContacts', message: 'at least one human escalation contact is required', severity: 'error' });
  } else {
    c.escalationContacts.forEach((contact, i) => {
      if (!isRecord(contact) || typeof contact.id !== 'string' || typeof contact.label !== 'string' || typeof contact.when !== 'string') {
        issues.push({ path: `escalationContacts[${i}]`, message: 'id, label and when are required', severity: 'error' });
        return;
      }
      if (contact.phone !== undefined && (typeof contact.phone !== 'string' || !E164_RE.test(contact.phone))) {
        issues.push({ path: `escalationContacts[${i}].phone`, message: 'must be E.164 (+49...)', severity: 'error' });
      }
      if (contact.phone === undefined && contact.email === undefined) {
        issues.push({ path: `escalationContacts[${i}]`, message: 'no phone and no email: callbacks cannot be routed', severity: 'warning' });
      }
    });
  }

  if (!isRecord(c.emergency) || typeof c.emergency.message !== 'string' || typeof c.emergency.emergencyNumber !== 'string') {
    issues.push({ path: 'emergency', message: 'message and emergencyNumber are required', severity: 'error' });
  }

  if (!Array.isArray(c.knowledgeSources)) {
    issues.push({ path: 'knowledgeSources', message: 'must be an array (may be empty)', severity: 'error' });
  } else {
    c.knowledgeSources.forEach((source, i) => {
      if (!isRecord(source) || typeof source.id !== 'string' || typeof source.name !== 'string' || typeof source.reviewed !== 'boolean') {
        issues.push({ path: `knowledgeSources[${i}]`, message: 'id, name and reviewed are required', severity: 'error' });
        return;
      }
      if (!['website', 'faq', 'document', 'structured', 'text'].includes(String(source.kind))) {
        issues.push({ path: `knowledgeSources[${i}].kind`, message: 'invalid kind', severity: 'error' });
      }
      if ((source.kind === 'website' || source.kind === 'document') && typeof source.url !== 'string') {
        issues.push({ path: `knowledgeSources[${i}].url`, message: 'url required for website/document sources', severity: 'error' });
      }
      if (source.kind === 'text' && typeof source.text !== 'string') {
        issues.push({ path: `knowledgeSources[${i}].text`, message: 'text required for text sources', severity: 'error' });
      }
      if (source.reviewed === false && c.stage === 'live') {
        issues.push({ path: `knowledgeSources[${i}].reviewed`, message: 'unreviewed knowledge on a live agent', severity: 'error' });
      }
    });
  }

  if (!isRecord(c.bookingIntegration) || !['mock', 'n8n_webhook', 'none'].includes(String(c.bookingIntegration.provider))) {
    issues.push({ path: 'bookingIntegration.provider', message: 'must be mock, n8n_webhook or none', severity: 'error' });
  } else {
    const integration = c.bookingIntegration;
    if (integration.provider === 'n8n_webhook') {
      if (typeof integration.baseUrl !== 'string' || !/^https:\/\//.test(integration.baseUrl)) {
        issues.push({ path: 'bookingIntegration.baseUrl', message: 'n8n_webhook requires an https baseUrl', severity: 'error' });
      }
      if (typeof integration.secretEnvVar !== 'string' || !/^[A-Z][A-Z0-9_]+$/.test(integration.secretEnvVar)) {
        issues.push({ path: 'bookingIntegration.secretEnvVar', message: 'name of the server env var holding the shared secret', severity: 'error' });
      }
    }
    if (integration.provider === 'mock' && c.stage === 'live') {
      issues.push({ path: 'bookingIntegration.provider', message: 'mock provider on a live agent', severity: 'error' });
    }
    if (integration.provider === 'none' && Array.isArray(c.services) && c.services.some((s) => isRecord(s) && s.bookable === true)) {
      issues.push({ path: 'bookingIntegration.provider', message: 'bookable services but no booking provider', severity: 'error' });
    }
  }

  if (!isRecord(c.voice)) {
    issues.push({ path: 'voice', message: 'required (may be empty object)', severity: 'error' });
  }

  if (!isRecord(c.confirmation)) {
    issues.push({ path: 'confirmation', message: 'required', severity: 'error' });
  } else {
    if (c.confirmation.readBackBeforeWrite !== true) {
      issues.push({ path: 'confirmation.readBackBeforeWrite', message: 'must be true: writes without read-back are not permitted', severity: 'error' });
    }
    if (c.confirmation.explicitYesForDestructive !== true) {
      issues.push({ path: 'confirmation.explicitYesForDestructive', message: 'must be true: destructive actions need an explicit yes', severity: 'error' });
    }
  }

  const errors = issues.filter((issue) => issue.severity === 'error');
  return { issues, config: errors.length === 0 ? (value as unknown as ClientConfig) : null };
}

export function assertClientConfig(value: unknown): ClientConfig {
  const { issues, config } = validateClientConfig(value);
  if (!config) {
    const summary = issues.filter((i) => i.severity === 'error').map((i) => `${i.path}: ${i.message}`).join('; ');
    throw new Error(`Invalid client config: ${summary}`);
  }
  return config;
}

/* ------------------------------------------------------------------ helpers */

export function findLocation(config: ClientConfig, locationId: string): ClientLocation | undefined {
  return config.locations.find((location) => location.id === locationId);
}

export function findService(config: ClientConfig, serviceId: string): ClientService | undefined {
  return config.services.find((service) => service.id === serviceId);
}

/** Resolves a spoken service name or alias to a service id, case-insensitively. */
export function resolveServiceId(config: ClientConfig, spoken: string): string | null {
  const needle = spoken.trim().toLowerCase();
  if (!needle) return null;
  for (const service of config.services) {
    if (service.id === needle || service.name.toLowerCase() === needle) return service.id;
    if ((service.aliases ?? []).some((alias) => alias.toLowerCase() === needle)) return service.id;
  }
  return null;
}

export function servicesAtLocation(config: ClientConfig, locationId: string): ClientService[] {
  const location = findLocation(config, locationId);
  if (!location) return [];
  if (!location.serviceIds || location.serviceIds.length === 0) return config.services;
  return config.services.filter((service) => location.serviceIds!.includes(service.id));
}

/** Spoken display name used in prompts and greetings. */
export function spokenCompanyName(config: ClientConfig): string {
  return config.spokenName?.trim() || config.companyName;
}

/** Deterministic default config skeleton for a brand-new receptionist. Every value is safe and non-final. */
export function createDefaultClientConfig(input: { clientId: string; companyName: string; timezone?: string }): ClientConfig {
  return {
    schemaVersion: 1,
    clientId: input.clientId,
    companyName: input.companyName,
    stage: 'dev',
    primaryLanguage: 'de',
    additionalLanguages: [],
    timezone: input.timezone ?? 'Europe/Berlin',
    locations: [],
    services: [],
    providers: [],
    bookingRules: {
      minNoticeHours: 2,
      maxAdvanceDays: 90,
      maxAlternativesSpoken: 3,
      requiredCallerFields: ['firstName', 'lastName', 'dateOfBirth', 'phone'],
      allowDuplicateFutureBookings: false,
    },
    cancellationRules: {
      minNoticeHours: 24,
      callerMayCancel: true,
      callerMayReschedule: true,
    },
    identityVerification: { requiredFields: ['lastName', 'dateOfBirth'] },
    faqs: [],
    escalationContacts: [],
    emergency: {
      message: 'Das klingt nach einem medizinischen Notfall. Bitte legen Sie auf und rufen Sie sofort die 112 an.',
      emergencyNumber: '112',
    },
    knowledgeSources: [],
    bookingIntegration: { provider: 'mock' },
    voice: {},
    pronunciation: [],
    confirmation: {
      readBackBeforeWrite: true,
      explicitYesForDestructive: true,
      offerWrittenConfirmation: true,
    },
    scopeLimits: [],
    alwaysEscalateTopics: [],
  };
}
