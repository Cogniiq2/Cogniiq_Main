import type { PostgrestError } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

export const supportedLanguages = ['de', 'en'] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

export const onboardingStepIds = ['company', 'goals', 'research', 'review', 'continue'] as const;
export type OnboardingStepId = (typeof onboardingStepIds)[number];

export const onboardingStatusValues = [
  'not_started',
  'in_progress',
  'research_queued',
  'research_running',
  'review_required',
  'ready_for_test',
  'ready_for_launch',
  'live',
  'paused',
  'error',
] as const;
export type OnboardingStatus = (typeof onboardingStatusValues)[number];

export const onboardingGoalOptions = [
  'answer_faqs',
  'capture_leads',
  'transfer_calls',
  'capture_appointments',
  'after_hours',
  'multilingual',
] as const;
export type OnboardingGoal = (typeof onboardingGoalOptions)[number];

export const onboardingGoalLabels: Record<OnboardingGoal, string> = {
  answer_faqs: 'Hauefige Fragen beantworten',
  capture_leads: 'Leads erfassen',
  transfer_calls: 'Anrufe weiterleiten',
  capture_appointments: 'Terminwuensche aufnehmen',
  after_hours: 'After-hours beantworten',
  multilingual: 'Mehrsprachige Anfragen vorbereiten',
};

export const receptionistToneOptions = ['professional', 'warm', 'concise', 'formal'] as const;
export type ReceptionistTone = (typeof receptionistToneOptions)[number];

export const receptionistToneLabels: Record<ReceptionistTone, string> = {
  professional: 'Professionell',
  warm: 'Warm',
  concise: 'Knapp',
  formal: 'Formell',
};

export const receptionistResponsibilityOptions = [
  'answer_faqs',
  'capture_leads',
  'take_messages',
  'transfer_calls',
  'capture_appointments',
  'after_hours',
] as const;
export type ReceptionistResponsibility = (typeof receptionistResponsibilityOptions)[number];

export const receptionistResponsibilityLabels: Record<ReceptionistResponsibility, string> = {
  answer_faqs: 'FAQs beantworten',
  capture_leads: 'Leads erfassen',
  take_messages: 'Nachrichten aufnehmen',
  transfer_calls: 'Anrufe weiterleiten',
  capture_appointments: 'Terminwuensche sammeln',
  after_hours: 'After-hours behandeln',
};

export const receptionistAllowedActionOptions = [
  'use_confirmed_facts_only',
  'be_transparent_when_unsure',
  'transfer_when_needed',
  'take_messages',
  'collect_contact_details',
] as const;
export type ReceptionistAllowedAction = (typeof receptionistAllowedActionOptions)[number];

export const receptionistAllowedActionLabels: Record<ReceptionistAllowedAction, string> = {
  use_confirmed_facts_only: 'Nur bestaetigte Fakten nennen',
  be_transparent_when_unsure: 'Bei Unsicherheit transparent bleiben',
  transfer_when_needed: 'Bei Bedarf uebergeben',
  take_messages: 'Nachrichten aufnehmen',
  collect_contact_details: 'Kontaktdaten erfassen',
};

export const receptionistProhibitedActionOptions = [
  'no_invented_prices',
  'no_binding_appointments',
  'no_refund_promises',
  'no_regulated_advice',
  'no_unconfirmed_services',
] as const;
export type ReceptionistProhibitedAction = (typeof receptionistProhibitedActionOptions)[number];

export const receptionistProhibitedActionLabels: Record<ReceptionistProhibitedAction, string> = {
  no_invented_prices: 'Keine Preise erfinden',
  no_binding_appointments: 'Keine Termine verbindlich zusagen',
  no_refund_promises: 'Keine Erstattungen bestaetigen',
  no_regulated_advice: 'Keine regulierte Beratung geben',
  no_unconfirmed_services: 'Keine nicht bestaetigten Leistungen nennen',
};

export const phoneSetupModes = ['ai-number', 'forwarding'] as const;
export type PhoneSetupMode = (typeof phoneSetupModes)[number];

export const phoneTestStatuses = ['not_started', 'queued', 'running', 'failed', 'passed'] as const;
export type PhoneTestStatus = (typeof phoneTestStatuses)[number];

export type PersistenceErrorKind = 'validation' | 'authorization' | 'network' | 'backend';

export interface CustomerPortalError {
  kind: PersistenceErrorKind;
  message: string;
  fieldErrors?: Record<string, string>;
}

export class CustomerPortalValidationError extends Error {
  readonly fieldErrors: Record<string, string>;

  constructor(fieldErrors: Record<string, string>, message = 'Bitte pruefen Sie die markierten Felder.') {
    super(message);
    this.name = 'CustomerPortalValidationError';
    this.fieldErrors = fieldErrors;
  }
}

export interface Business {
  id: string;
  organizationId: string;
  name: string;
  website: string | null;
  industry: string | null;
  address: string | null;
  contactEmail: string | null;
  primaryContactName: string | null;
  existingBusinessPhone: string | null;
  primaryLanguage: SupportedLanguage;
  timezone: string;
  environment: string;
  createdAt: string;
  updatedAt: string;
}

export interface OnboardingSession {
  id: string;
  organizationId: string;
  businessId: string;
  status: OnboardingStatus;
  currentStep: OnboardingStepId | null;
  completedSteps: OnboardingStepId[];
  selectedGoals: OnboardingGoal[];
  preferredBehavior: string | null;
  lastError: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReceptionistConfig {
  id: string;
  organizationId: string;
  businessId: string;
  receptionistName: string | null;
  primaryLanguage: SupportedLanguage;
  additionalLanguages: SupportedLanguage[];
  greeting: string | null;
  tone: ReceptionistTone | null;
  responsibilities: ReceptionistResponsibility[];
  allowedActions: ReceptionistAllowedAction[];
  prohibitedActions: ReceptionistProhibitedAction[];
  afterHoursBehavior: { instruction?: string };
  transferBehavior: { instruction?: string };
  createdAt: string;
  updatedAt: string;
}

export interface PhoneConfig {
  id: string;
  organizationId: string;
  businessId: string;
  setupMode: PhoneSetupMode | null;
  existingPublicNumber: string | null;
  assignedAiNumber: string | null;
  humanTransferNumber: string | null;
  urgentEscalationNumber: string | null;
  afterHoursNumber: string | null;
  smsNotificationNumber: string | null;
  forwardingConfirmed: boolean;
  testStatus: PhoneTestStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerPortalSnapshot {
  business: Business | null;
  onboardingSession: OnboardingSession | null;
  receptionistConfig: ReceptionistConfig | null;
  phoneConfig: PhoneConfig | null;
}

export interface BusinessDraft {
  name: string;
  website: string;
  industry: string;
  address: string;
  contactEmail: string;
  primaryContactName: string;
  existingBusinessPhone: string;
  primaryLanguage: SupportedLanguage;
  timezone: string;
}

export interface OnboardingDraft {
  business: BusinessDraft;
  currentStep: OnboardingStepId;
  completedSteps: OnboardingStepId[];
  selectedGoals: OnboardingGoal[];
  preferredBehavior: string;
}

export interface ReceptionistDraft {
  receptionistName: string;
  primaryLanguage: SupportedLanguage;
  additionalLanguages: SupportedLanguage[];
  greeting: string;
  tone: ReceptionistTone;
  responsibilities: ReceptionistResponsibility[];
  allowedActions: ReceptionistAllowedAction[];
  prohibitedActions: ReceptionistProhibitedAction[];
  afterHoursInstruction: string;
  transferInstruction: string;
}

export interface PhoneDraft {
  setupMode: PhoneSetupMode;
  existingPublicNumber: string;
  humanTransferNumber: string;
  urgentEscalationNumber: string;
  afterHoursNumber: string;
  smsNotificationNumber: string;
  forwardingConfirmed: boolean;
}

interface BusinessRow {
  id: string;
  organization_id: string;
  name: string;
  website: string | null;
  industry: string | null;
  address: string | null;
  contact_email: string | null;
  primary_contact_name: string | null;
  existing_business_phone: string | null;
  primary_language: SupportedLanguage;
  timezone: string;
  environment: string;
  created_at: string;
  updated_at: string;
}

interface OnboardingSessionRow {
  id: string;
  organization_id: string;
  business_id: string;
  status: OnboardingStatus;
  current_step: OnboardingStepId | null;
  completed_steps: OnboardingStepId[];
  selected_goals: OnboardingGoal[];
  preferred_behavior: string | null;
  last_error: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ReceptionistConfigRow {
  id: string;
  organization_id: string;
  business_id: string;
  receptionist_name: string | null;
  primary_language: SupportedLanguage;
  additional_languages: SupportedLanguage[];
  greeting: string | null;
  tone: ReceptionistTone | null;
  responsibilities: ReceptionistResponsibility[];
  allowed_actions: ReceptionistAllowedAction[];
  prohibited_actions: ReceptionistProhibitedAction[];
  after_hours_behavior: { instruction?: string } | null;
  transfer_behavior: { instruction?: string } | null;
  created_at: string;
  updated_at: string;
}

interface PhoneConfigRow {
  id: string;
  organization_id: string;
  business_id: string;
  setup_mode: PhoneSetupMode | null;
  existing_public_number: string | null;
  assigned_ai_number: string | null;
  human_transfer_number: string | null;
  urgent_escalation_number: string | null;
  after_hours_number: string | null;
  sms_notification_number: string | null;
  forwarding_confirmed: boolean;
  test_status: PhoneTestStatus;
  created_at: string;
  updated_at: string;
}

type BusinessWrite = Pick<
  BusinessRow,
  | 'organization_id'
  | 'name'
  | 'website'
  | 'industry'
  | 'address'
  | 'contact_email'
  | 'primary_contact_name'
  | 'existing_business_phone'
  | 'primary_language'
  | 'timezone'
>;

type OnboardingInsertWrite = Pick<
  OnboardingSessionRow,
  'organization_id' | 'business_id' | 'status' | 'current_step' | 'completed_steps' | 'selected_goals' | 'preferred_behavior'
>;

type OnboardingUpdateWrite = Pick<
  OnboardingSessionRow,
  'current_step' | 'completed_steps' | 'selected_goals' | 'preferred_behavior'
>;

type ReceptionistWrite = Pick<
  ReceptionistConfigRow,
  | 'organization_id'
  | 'business_id'
  | 'receptionist_name'
  | 'primary_language'
  | 'additional_languages'
  | 'greeting'
  | 'tone'
  | 'responsibilities'
  | 'allowed_actions'
  | 'prohibited_actions'
  | 'after_hours_behavior'
  | 'transfer_behavior'
>;

type PhoneWrite = Pick<
  PhoneConfigRow,
  | 'organization_id'
  | 'business_id'
  | 'setup_mode'
  | 'existing_public_number'
  | 'human_transfer_number'
  | 'urgent_escalation_number'
  | 'after_hours_number'
  | 'sms_notification_number'
  | 'forwarding_confirmed'
>;

export const defaultBusinessDraft: BusinessDraft = {
  name: '',
  website: '',
  industry: '',
  address: '',
  contactEmail: '',
  primaryContactName: '',
  existingBusinessPhone: '',
  primaryLanguage: 'de',
  timezone: 'Europe/Berlin',
};

export const defaultOnboardingDraft: OnboardingDraft = {
  business: defaultBusinessDraft,
  currentStep: 'company',
  completedSteps: [],
  selectedGoals: [],
  preferredBehavior: '',
};

export const defaultReceptionistDraft: ReceptionistDraft = {
  receptionistName: '',
  primaryLanguage: 'de',
  additionalLanguages: [],
  greeting: '',
  tone: 'professional',
  responsibilities: [...receptionistResponsibilityOptions],
  allowedActions: [...receptionistAllowedActionOptions],
  prohibitedActions: [...receptionistProhibitedActionOptions],
  afterHoursInstruction: '',
  transferInstruction: '',
};

export const defaultPhoneDraft: PhoneDraft = {
  setupMode: 'ai-number',
  existingPublicNumber: '',
  humanTransferNumber: '',
  urgentEscalationNumber: '',
  afterHoursNumber: '',
  smsNotificationNumber: '',
  forwardingConfirmed: false,
};

const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const phonePattern = /^\+?[0-9][0-9 ()/.-]{5,}$/;
const websitePattern = /^https?:\/\/[^\s]+\.[^\s]+$/i;

export function isPersistenceError(error: unknown): error is CustomerPortalError {
  return (
    typeof error === 'object'
    && error !== null
    && 'kind' in error
    && 'message' in error
  );
}

export function toCustomerPortalError(error: unknown): CustomerPortalError {
  if (isPersistenceError(error)) return error;

  if (error instanceof CustomerPortalValidationError) {
    return {
      kind: 'validation',
      message: error.message,
      fieldErrors: error.fieldErrors,
    };
  }

  if (isPostgrestError(error)) {
    return {
      kind: isAuthorizationError(error) ? 'authorization' : 'backend',
      message: error.message,
    };
  }

  if (error instanceof Error) {
    return {
      kind: 'network',
      message: error.message,
    };
  }

  return {
    kind: 'backend',
    message: 'Unbekannter Fehler beim Zugriff auf die Datenbank.',
  };
}

export async function loadCustomerPortalSnapshot(organizationId: string): Promise<CustomerPortalSnapshot> {
  const businessResult = await supabase
    .from('businesses')
    .select('*')
    .eq('organization_id', organizationId)
    .maybeSingle();

  if (businessResult.error) throw businessResult.error;

  const businessRow = businessResult.data as BusinessRow | null;
  if (!businessRow) {
    return {
      business: null,
      onboardingSession: null,
      receptionistConfig: null,
      phoneConfig: null,
    };
  }

  const [onboardingResult, receptionistResult, phoneResult] = await Promise.all([
    supabase
      .from('onboarding_sessions')
      .select('*')
      .eq('business_id', businessRow.id)
      .maybeSingle(),
    supabase
      .from('receptionist_configs')
      .select('*')
      .eq('business_id', businessRow.id)
      .maybeSingle(),
    supabase
      .from('phone_configs')
      .select('*')
      .eq('business_id', businessRow.id)
      .maybeSingle(),
  ]);

  if (onboardingResult.error) throw onboardingResult.error;
  if (receptionistResult.error) throw receptionistResult.error;
  if (phoneResult.error) throw phoneResult.error;

  return {
    business: mapBusinessRow(businessRow),
    onboardingSession: onboardingResult.data ? mapOnboardingRow(onboardingResult.data as OnboardingSessionRow) : null,
    receptionistConfig: receptionistResult.data ? mapReceptionistRow(receptionistResult.data as ReceptionistConfigRow) : null,
    phoneConfig: phoneResult.data ? mapPhoneRow(phoneResult.data as PhoneConfigRow) : null,
  };
}

export async function saveOnboardingDraft(
  organizationId: string,
  currentBusiness: Business | null,
  currentSession: OnboardingSession | null,
  draft: OnboardingDraft
): Promise<{ business: Business; onboardingSession: OnboardingSession }> {
  const businessPayload = buildBusinessWrite(organizationId, draft.business);
  const business = await saveBusiness(organizationId, currentBusiness?.id ?? null, businessPayload);

  const onboardingPayload: OnboardingUpdateWrite = {
    current_step: draft.currentStep,
    completed_steps: uniqueOnboardingSteps(draft.completedSteps),
    selected_goals: uniqueOnboardingGoals(draft.selectedGoals),
    preferred_behavior: nullableText(draft.preferredBehavior),
  };

  const onboardingInsertPayload: OnboardingInsertWrite = {
    organization_id: organizationId,
    business_id: business.id,
    status: 'in_progress',
    current_step: draft.currentStep,
    completed_steps: uniqueOnboardingSteps(draft.completedSteps),
    selected_goals: uniqueOnboardingGoals(draft.selectedGoals),
    preferred_behavior: nullableText(draft.preferredBehavior),
  };

  const onboardingSession = await saveOnboardingSession(
    business.id,
    currentSession?.id ?? null,
    onboardingInsertPayload,
    onboardingPayload
  );

  return { business, onboardingSession };
}

export async function saveReceptionistDraft(
  organizationId: string,
  business: Business | null,
  currentConfig: ReceptionistConfig | null,
  draft: ReceptionistDraft
): Promise<ReceptionistConfig> {
  if (!business) {
    throw new CustomerPortalValidationError({
      business: 'Bitte speichern Sie zuerst die Unternehmensdaten im Onboarding.',
    });
  }

  const payload = buildReceptionistWrite(organizationId, business.id, draft);
  return saveReceptionistConfig(business.id, currentConfig?.id ?? null, payload);
}

export async function savePhoneDraft(
  organizationId: string,
  business: Business | null,
  currentConfig: PhoneConfig | null,
  draft: PhoneDraft
): Promise<PhoneConfig> {
  if (!business) {
    throw new CustomerPortalValidationError({
      business: 'Bitte speichern Sie zuerst die Unternehmensdaten im Onboarding.',
    });
  }

  const payload = buildPhoneWrite(organizationId, business.id, draft);
  return savePhoneConfig(business.id, currentConfig?.id ?? null, payload);
}

export function makeOnboardingDraft(
  business: Business | null,
  onboardingSession: OnboardingSession | null
): OnboardingDraft {
  return {
    business: business ? makeBusinessDraft(business) : defaultBusinessDraft,
    currentStep: onboardingSession?.currentStep ?? 'company',
    completedSteps: onboardingSession?.completedSteps ?? [],
    selectedGoals: onboardingSession?.selectedGoals ?? [],
    preferredBehavior: onboardingSession?.preferredBehavior ?? '',
  };
}

export function makeBusinessDraft(business: Business): BusinessDraft {
  return {
    name: business.name,
    website: business.website ?? '',
    industry: business.industry ?? '',
    address: business.address ?? '',
    contactEmail: business.contactEmail ?? '',
    primaryContactName: business.primaryContactName ?? '',
    existingBusinessPhone: business.existingBusinessPhone ?? '',
    primaryLanguage: business.primaryLanguage,
    timezone: business.timezone,
  };
}

export function makeReceptionistDraft(config: ReceptionistConfig | null): ReceptionistDraft {
  if (!config) return defaultReceptionistDraft;

  return {
    receptionistName: config.receptionistName ?? '',
    primaryLanguage: config.primaryLanguage,
    additionalLanguages: config.additionalLanguages,
    greeting: config.greeting ?? '',
    tone: config.tone ?? 'professional',
    responsibilities: config.responsibilities,
    allowedActions: config.allowedActions,
    prohibitedActions: config.prohibitedActions,
    afterHoursInstruction: config.afterHoursBehavior.instruction ?? '',
    transferInstruction: config.transferBehavior.instruction ?? '',
  };
}

export function makePhoneDraft(config: PhoneConfig | null): PhoneDraft {
  if (!config) return defaultPhoneDraft;

  return {
    setupMode: config.setupMode ?? 'ai-number',
    existingPublicNumber: config.existingPublicNumber ?? '',
    humanTransferNumber: config.humanTransferNumber ?? '',
    urgentEscalationNumber: config.urgentEscalationNumber ?? '',
    afterHoursNumber: config.afterHoursNumber ?? '',
    smsNotificationNumber: config.smsNotificationNumber ?? '',
    forwardingConfirmed: config.forwardingConfirmed,
  };
}

function buildBusinessWrite(organizationId: string, draft: BusinessDraft): BusinessWrite {
  const fieldErrors: Record<string, string> = {};
  const name = draft.name.trim();
  const website = nullableText(draft.website);
  const contactEmail = nullableText(draft.contactEmail);
  const existingBusinessPhone = nullableText(draft.existingBusinessPhone);
  const timezone = draft.timezone.trim() || 'Europe/Berlin';

  if (!name) fieldErrors.name = 'Der Unternehmensname ist erforderlich.';
  if (website && !websitePattern.test(website)) fieldErrors.website = 'Bitte eine gueltige URL mit https:// oder http:// eingeben.';
  if (contactEmail && !emailPattern.test(contactEmail)) fieldErrors.contactEmail = 'Bitte eine gueltige E-Mail-Adresse eingeben.';
  if (existingBusinessPhone && !phonePattern.test(existingBusinessPhone)) fieldErrors.existingBusinessPhone = 'Bitte eine gueltige Telefonnummer eingeben.';
  if (!supportedLanguages.includes(draft.primaryLanguage)) fieldErrors.primaryLanguage = 'Diese Sprache wird noch nicht unterstuetzt.';

  if (Object.keys(fieldErrors).length > 0) throw new CustomerPortalValidationError(fieldErrors);

  return {
    organization_id: organizationId,
    name,
    website,
    industry: nullableText(draft.industry),
    address: nullableText(draft.address),
    contact_email: contactEmail,
    primary_contact_name: nullableText(draft.primaryContactName),
    existing_business_phone: existingBusinessPhone,
    primary_language: draft.primaryLanguage,
    timezone,
  };
}

function buildReceptionistWrite(
  organizationId: string,
  businessId: string,
  draft: ReceptionistDraft
): ReceptionistWrite {
  const fieldErrors: Record<string, string> = {};
  const additionalLanguages = uniqueLanguages(draft.additionalLanguages)
    .filter((language) => language !== draft.primaryLanguage);

  if (!supportedLanguages.includes(draft.primaryLanguage)) fieldErrors.primaryLanguage = 'Diese Sprache wird noch nicht unterstuetzt.';
  if (!receptionistToneOptions.includes(draft.tone)) fieldErrors.tone = 'Dieser Kommunikationsstil wird nicht unterstuetzt.';

  validateStringArray('responsibilities', draft.responsibilities, receptionistResponsibilityOptions, fieldErrors);
  validateStringArray('allowedActions', draft.allowedActions, receptionistAllowedActionOptions, fieldErrors);
  validateStringArray('prohibitedActions', draft.prohibitedActions, receptionistProhibitedActionOptions, fieldErrors);

  if (Object.keys(fieldErrors).length > 0) throw new CustomerPortalValidationError(fieldErrors);

  return {
    organization_id: organizationId,
    business_id: businessId,
    receptionist_name: nullableText(draft.receptionistName),
    primary_language: draft.primaryLanguage,
    additional_languages: additionalLanguages,
    greeting: nullableText(draft.greeting),
    tone: draft.tone,
    responsibilities: uniqueAllowedStrings(draft.responsibilities, receptionistResponsibilityOptions),
    allowed_actions: uniqueAllowedStrings(draft.allowedActions, receptionistAllowedActionOptions),
    prohibited_actions: uniqueAllowedStrings(draft.prohibitedActions, receptionistProhibitedActionOptions),
    after_hours_behavior: { instruction: nullableText(draft.afterHoursInstruction) ?? '' },
    transfer_behavior: { instruction: nullableText(draft.transferInstruction) ?? '' },
  };
}

function buildPhoneWrite(organizationId: string, businessId: string, draft: PhoneDraft): PhoneWrite {
  const fieldErrors: Record<string, string> = {};
  const existingPublicNumber = nullableText(draft.existingPublicNumber);
  const humanTransferNumber = nullableText(draft.humanTransferNumber);
  const urgentEscalationNumber = nullableText(draft.urgentEscalationNumber);
  const afterHoursNumber = nullableText(draft.afterHoursNumber);
  const smsNotificationNumber = nullableText(draft.smsNotificationNumber);

  if (!phoneSetupModes.includes(draft.setupMode)) fieldErrors.setupMode = 'Diese Telefonmethode wird nicht unterstuetzt.';
  validateOptionalPhone('existingPublicNumber', existingPublicNumber, fieldErrors);
  validateOptionalPhone('humanTransferNumber', humanTransferNumber, fieldErrors);
  validateOptionalPhone('urgentEscalationNumber', urgentEscalationNumber, fieldErrors);
  validateOptionalPhone('afterHoursNumber', afterHoursNumber, fieldErrors);
  validateOptionalPhone('smsNotificationNumber', smsNotificationNumber, fieldErrors);

  if (Object.keys(fieldErrors).length > 0) throw new CustomerPortalValidationError(fieldErrors);

  return {
    organization_id: organizationId,
    business_id: businessId,
    setup_mode: draft.setupMode,
    existing_public_number: existingPublicNumber,
    human_transfer_number: humanTransferNumber,
    urgent_escalation_number: urgentEscalationNumber,
    after_hours_number: afterHoursNumber,
    sms_notification_number: smsNotificationNumber,
    forwarding_confirmed: draft.forwardingConfirmed,
  };
}

async function saveBusiness(
  organizationId: string,
  businessId: string | null,
  payload: BusinessWrite
): Promise<Business> {
  if (businessId) {
    const result = await supabase
      .from('businesses')
      .update(payload)
      .eq('organization_id', organizationId)
      .eq('id', businessId)
      .select('*')
      .single();

    if (result.error) throw result.error;
    return mapBusinessRow(result.data as BusinessRow);
  }

  const insertResult = await supabase
    .from('businesses')
    .insert(payload)
    .select('*')
    .single();

  if (insertResult.error && insertResult.error.code === '23505') {
    const existing = await loadBusinessByOrganization(organizationId);
    if (!existing) throw insertResult.error;
    return saveBusiness(organizationId, existing.id, payload);
  }

  if (insertResult.error) throw insertResult.error;
  return mapBusinessRow(insertResult.data as BusinessRow);
}

async function saveOnboardingSession(
  businessId: string,
  sessionId: string | null,
  insertPayload: OnboardingInsertWrite,
  updatePayload: OnboardingUpdateWrite
): Promise<OnboardingSession> {
  if (sessionId) {
    const result = await supabase
      .from('onboarding_sessions')
      .update(updatePayload)
      .eq('business_id', businessId)
      .eq('id', sessionId)
      .select('*')
      .single();

    if (result.error) throw result.error;
    return mapOnboardingRow(result.data as OnboardingSessionRow);
  }

  const insertResult = await supabase
    .from('onboarding_sessions')
    .insert(insertPayload)
    .select('*')
    .single();

  if (insertResult.error && insertResult.error.code === '23505') {
    const existing = await loadOnboardingByBusiness(businessId);
    if (!existing) throw insertResult.error;
    return saveOnboardingSession(businessId, existing.id, insertPayload, updatePayload);
  }

  if (insertResult.error) throw insertResult.error;
  return mapOnboardingRow(insertResult.data as OnboardingSessionRow);
}

async function saveReceptionistConfig(
  businessId: string,
  configId: string | null,
  payload: ReceptionistWrite
): Promise<ReceptionistConfig> {
  if (configId) {
    const result = await supabase
      .from('receptionist_configs')
      .update(payload)
      .eq('business_id', businessId)
      .eq('id', configId)
      .select('*')
      .single();

    if (result.error) throw result.error;
    return mapReceptionistRow(result.data as ReceptionistConfigRow);
  }

  const insertResult = await supabase
    .from('receptionist_configs')
    .insert(payload)
    .select('*')
    .single();

  if (insertResult.error && insertResult.error.code === '23505') {
    const existing = await loadReceptionistByBusiness(businessId);
    if (!existing) throw insertResult.error;
    return saveReceptionistConfig(businessId, existing.id, payload);
  }

  if (insertResult.error) throw insertResult.error;
  return mapReceptionistRow(insertResult.data as ReceptionistConfigRow);
}

async function savePhoneConfig(
  businessId: string,
  configId: string | null,
  payload: PhoneWrite
): Promise<PhoneConfig> {
  if (configId) {
    const result = await supabase
      .from('phone_configs')
      .update(payload)
      .eq('business_id', businessId)
      .eq('id', configId)
      .select('*')
      .single();

    if (result.error) throw result.error;
    return mapPhoneRow(result.data as PhoneConfigRow);
  }

  const insertResult = await supabase
    .from('phone_configs')
    .insert(payload)
    .select('*')
    .single();

  if (insertResult.error && insertResult.error.code === '23505') {
    const existing = await loadPhoneByBusiness(businessId);
    if (!existing) throw insertResult.error;
    return savePhoneConfig(businessId, existing.id, payload);
  }

  if (insertResult.error) throw insertResult.error;
  return mapPhoneRow(insertResult.data as PhoneConfigRow);
}

async function loadBusinessByOrganization(organizationId: string): Promise<Business | null> {
  const result = await supabase
    .from('businesses')
    .select('*')
    .eq('organization_id', organizationId)
    .maybeSingle();

  if (result.error) throw result.error;
  return result.data ? mapBusinessRow(result.data as BusinessRow) : null;
}

async function loadOnboardingByBusiness(businessId: string): Promise<OnboardingSession | null> {
  const result = await supabase
    .from('onboarding_sessions')
    .select('*')
    .eq('business_id', businessId)
    .maybeSingle();

  if (result.error) throw result.error;
  return result.data ? mapOnboardingRow(result.data as OnboardingSessionRow) : null;
}

async function loadReceptionistByBusiness(businessId: string): Promise<ReceptionistConfig | null> {
  const result = await supabase
    .from('receptionist_configs')
    .select('*')
    .eq('business_id', businessId)
    .maybeSingle();

  if (result.error) throw result.error;
  return result.data ? mapReceptionistRow(result.data as ReceptionistConfigRow) : null;
}

async function loadPhoneByBusiness(businessId: string): Promise<PhoneConfig | null> {
  const result = await supabase
    .from('phone_configs')
    .select('*')
    .eq('business_id', businessId)
    .maybeSingle();

  if (result.error) throw result.error;
  return result.data ? mapPhoneRow(result.data as PhoneConfigRow) : null;
}

function mapBusinessRow(row: BusinessRow): Business {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    website: row.website,
    industry: row.industry,
    address: row.address,
    contactEmail: row.contact_email,
    primaryContactName: row.primary_contact_name,
    existingBusinessPhone: row.existing_business_phone,
    primaryLanguage: row.primary_language,
    timezone: row.timezone,
    environment: row.environment,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapOnboardingRow(row: OnboardingSessionRow): OnboardingSession {
  return {
    id: row.id,
    organizationId: row.organization_id,
    businessId: row.business_id,
    status: row.status,
    currentStep: row.current_step,
    completedSteps: uniqueOnboardingSteps(row.completed_steps),
    selectedGoals: uniqueOnboardingGoals(row.selected_goals),
    preferredBehavior: row.preferred_behavior,
    lastError: row.last_error,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapReceptionistRow(row: ReceptionistConfigRow): ReceptionistConfig {
  return {
    id: row.id,
    organizationId: row.organization_id,
    businessId: row.business_id,
    receptionistName: row.receptionist_name,
    primaryLanguage: row.primary_language,
    additionalLanguages: uniqueLanguages(row.additional_languages),
    greeting: row.greeting,
    tone: row.tone,
    responsibilities: uniqueReceptionistResponsibilities(Array.isArray(row.responsibilities) ? row.responsibilities : []),
    allowedActions: uniqueReceptionistAllowedActions(Array.isArray(row.allowed_actions) ? row.allowed_actions : []),
    prohibitedActions: uniqueReceptionistProhibitedActions(Array.isArray(row.prohibited_actions) ? row.prohibited_actions : []),
    afterHoursBehavior: row.after_hours_behavior ?? {},
    transferBehavior: row.transfer_behavior ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPhoneRow(row: PhoneConfigRow): PhoneConfig {
  return {
    id: row.id,
    organizationId: row.organization_id,
    businessId: row.business_id,
    setupMode: row.setup_mode,
    existingPublicNumber: row.existing_public_number,
    assignedAiNumber: row.assigned_ai_number,
    humanTransferNumber: row.human_transfer_number,
    urgentEscalationNumber: row.urgent_escalation_number,
    afterHoursNumber: row.after_hours_number,
    smsNotificationNumber: row.sms_notification_number,
    forwardingConfirmed: row.forwarding_confirmed,
    testStatus: row.test_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function nullableText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function isPostgrestError(error: unknown): error is PostgrestError {
  return (
    typeof error === 'object'
    && error !== null
    && 'message' in error
    && 'code' in error
  );
}

function isAuthorizationError(error: PostgrestError): boolean {
  const message = error.message.toLowerCase();
  return (
    error.code === '42501'
    || message.includes('permission denied')
    || message.includes('row-level security')
    || message.includes('rls')
    || message.includes('not authorized')
  );
}

function validateOptionalPhone(
  key: string,
  value: string | null,
  fieldErrors: Record<string, string>
) {
  if (value && !phonePattern.test(value)) {
    fieldErrors[key] = 'Bitte eine gueltige Telefonnummer eingeben.';
  }
}

function validateStringArray<T extends readonly string[]>(
  key: string,
  values: string[],
  allowed: T,
  fieldErrors: Record<string, string>
) {
  const allowedSet = new Set<string>(allowed);
  const unsupported = values.find((value) => !allowedSet.has(value));
  if (unsupported) {
    fieldErrors[key] = 'Diese Auswahl wird nicht unterstuetzt.';
  }
}

function uniqueOnboardingSteps(values: OnboardingStepId[]): OnboardingStepId[] {
  return uniqueAllowedStrings(values, onboardingStepIds);
}

function uniqueOnboardingGoals(values: OnboardingGoal[]): OnboardingGoal[] {
  return uniqueAllowedStrings(values, onboardingGoalOptions);
}

function uniqueLanguages(values: SupportedLanguage[]): SupportedLanguage[] {
  return uniqueAllowedStrings(values, supportedLanguages);
}

function uniqueReceptionistResponsibilities(values: string[]): ReceptionistResponsibility[] {
  return uniqueAllowedStrings(values, receptionistResponsibilityOptions);
}

function uniqueReceptionistAllowedActions(values: string[]): ReceptionistAllowedAction[] {
  return uniqueAllowedStrings(values, receptionistAllowedActionOptions);
}

function uniqueReceptionistProhibitedActions(values: string[]): ReceptionistProhibitedAction[] {
  return uniqueAllowedStrings(values, receptionistProhibitedActionOptions);
}

function uniqueAllowedStrings<T extends string>(values: string[], allowed: readonly T[]): T[] {
  const allowedSet = new Set<string>(allowed);
  const seen = new Set<string>();
  const result: T[] = [];

  values.forEach((value) => {
    if (!allowedSet.has(value) || seen.has(value)) return;
    seen.add(value);
    result.push(value as T);
  });

  return result;
}
