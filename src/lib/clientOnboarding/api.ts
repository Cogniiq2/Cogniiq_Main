// Thin typed wrapper over the client onboarding RPCs and the owner send function.
// Every authorization decision and every status rule lives in the database
// (migration 20261124120000) — this module never decides who may do what.

import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { secureUuid } from '@/lib/ownerFinance/api';
import { describeOnboardingError, type OnboardingFailure } from '@/lib/clientOnboarding/errors';
import type {
  AnswerValue, CustomerIntake, CustomerIntakeSummary, MessageKind, OwnerOnboardingDetail, ReviewDecision,
} from '@/lib/clientOnboarding/types';

export type Result<T> = { data: T; error: null } | { data: null; error: OnboardingFailure };

async function call<T>(fn: string, args: Record<string, unknown>): Promise<Result<T>> {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) return { data: null, error: describeOnboardingError(error) };
  return { data: data as T, error: null };
}

/* ------------------------------------------------------------------ customer */

export const listMyOnboardings = () => call<CustomerIntakeSummary[]>('client_onboarding_list', {});

export const getMyOnboarding = (engagementId: string) =>
  call<CustomerIntake>('client_onboarding_get', { p_engagement_id: engagementId });

export const saveMyOnboarding = (
  engagementId: string, answers: Record<string, AnswerValue>, expectedVersion: number, currentStage: string | null,
) => call<{ version: number; changed: number }>('client_onboarding_save', {
  p_engagement_id: engagementId, p_answers: answers, p_expected_version: expectedVersion, p_current_stage: currentStage,
});

export const submitMyOnboarding = (engagementId: string, expectedVersion: number) =>
  call<{ status: string; submitted_at: string; already: boolean }>('client_onboarding_submit', {
    p_engagement_id: engagementId, p_expected_version: expectedVersion,
  });

export const respondToRequest = (requestId: string, response: string) =>
  call<{ id: string; status: string }>('client_onboarding_respond_request', { p_request_id: requestId, p_response: response });

/* --------------------------------------------------------------------- owner */

export const loadOwnerOnboarding = (engagementId: string) =>
  call<OwnerOnboardingDetail>('owner_onboarding_detail', { p_engagement_id: engagementId });

export const linkCustomerOrganization = (customerId: string, organizationId: string) =>
  call<{ customer_id: string; organization_id: string; already: boolean }>('owner_link_customer_organization', {
    p_customer_id: customerId, p_organization_id: organizationId,
  });

export const reviewOnboarding = (engagementId: string, decisions: ReviewDecision[], note: string | null) =>
  call<{ approved: number; changes_requested: number; applied_to_fields: number; intake_status: string }>('owner_onboarding_review', {
    p_engagement_id: engagementId, p_decisions: decisions, p_review_note: note,
  });

export const createOnboardingRequest = (engagementId: string, question: string, questionCode: string | null, taskId: string | null) =>
  call<{ id: string }>('owner_onboarding_create_request', {
    p_engagement_id: engagementId, p_question: question, p_question_code: questionCode, p_task_id: taskId,
  });

export const closeOnboardingRequest = (requestId: string, outcome: 'accepted' | 'cancelled' | 'reopen') =>
  call<{ id: string; status: string }>('owner_onboarding_close_request', { p_request_id: requestId, p_outcome: outcome });

export const reopenOnboarding = (engagementId: string, note: string | null) =>
  call<{ status: string }>('owner_onboarding_reopen', { p_engagement_id: engagementId, p_note: note });

export const revokeOnboardingInvitation = (invitationId: string) =>
  call<{ id: string; status: string }>('owner_onboarding_revoke_invitation', { p_invitation_id: invitationId });

export interface SendInput {
  engagementId: string;
  kind: MessageKind;
  recipientEmail: string | null;
  recipientName: string | null;
  language: 'de' | 'en';
  subject: string;
  intro: string | null;
  isTest: boolean;
  requestId?: string | null;
  /** Generate once per confirmed send and reuse it on retry, so a retry can never send twice. */
  idempotencyKey: string;
}

export interface SendOutcome {
  ok: boolean;
  messageId: string | null;
  /** "accepted" = the email provider accepted the message. Never "delivered" or "opened". */
  status: 'accepted' | 'failed' | 'sending' | null;
  replay: boolean;
  linkMode: 'activation' | 'login' | 'test' | null;
  error: string | null;
  recordingWarning: string | null;
}

export const newSendKey = () => secureUuid();

export async function sendOnboardingEmail(input: SendInput): Promise<SendOutcome> {
  const { data, error } = await supabase.functions.invoke('client-onboarding-invite', {
    body: {
      engagementId: input.engagementId, kind: input.kind, recipientEmail: input.recipientEmail,
      recipientName: input.recipientName, language: input.language, subject: input.subject, intro: input.intro,
      isTest: input.isTest, requestId: input.requestId ?? null, idempotencyKey: input.idempotencyKey,
    },
  });
  let body = data as Record<string, unknown> | null;
  if (error) {
    body = null;
    if (error instanceof FunctionsHttpError) {
      try { body = await error.context.clone().json(); } catch { body = null; }
    }
    if (!body) {
      return { ok: false, messageId: null, status: null, replay: false, linkMode: null, recordingWarning: null,
        error: 'Der Versanddienst ist nicht erreichbar. Es ist unklar, ob die Nachricht versendet wurde — bitte prüfen Sie den Verlauf, bevor Sie erneut senden.' };
    }
  }
  const b = body ?? {};
  return {
    ok: b.ok === true,
    messageId: typeof b.messageId === 'string' ? b.messageId : null,
    status: (b.status as SendOutcome['status']) ?? null,
    replay: b.replay === true,
    linkMode: (b.linkMode as SendOutcome['linkMode']) ?? null,
    error: typeof b.error === 'string' ? b.error : (b.ok === true ? null : 'Die Nachricht wurde nicht versendet.'),
    recordingWarning: typeof b.recordingWarning === 'string' ? b.recordingWarning : null,
  };
}
